import Anthropic from "@anthropic-ai/sdk";
import { getAgent } from "@/lib/agents";
import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { buildICPContextString } from "@/lib/icp-context";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const { messages, agentSlug, responseMode } = await request.json();

    // ── Auth check ──
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return new Response("Unauthorized", { status: 401 });

    // ── Subscription check ──
    const { data: profile } = await supabase
      .from("profiles")
      .select("subscription_status")
      .eq("id", user.id)
      .single();

    const isAdmin = user.email?.toLowerCase() === (process.env.ADMIN_EMAIL ?? "").toLowerCase();
    const isActive =
      isAdmin ||
      profile?.subscription_status === "active" ||
      profile?.subscription_status === "trialing";
    if (!isActive) return new Response("Subscription required", { status: 402 });

    // ── Get agent ──
    const agent = getAgent(agentSlug);
    if (!agent) return new Response("Agent not found", { status: 404 });

    // ── Fetch ICP document for context ──
    const { data: icpDoc } = await supabase
      .from("icp_documents")
      .select("*")
      .eq("user_id", user.id)
      .single();

    const icpContext = buildICPContextString(icpDoc);

    // ── Response-mode instruction ──
    let modeInstruction = "";
    if (responseMode === "kort") {
      modeInstruction =
        "\n\n[SVARSLÄGE: KORT — Ge ett koncist svar på max 150 ord. Fokusera på det allra viktigaste. Inga långa förklaringar eller utfyllnad.]";
    } else if (responseMode === "nasta-steg") {
      modeInstruction =
        "\n\n[SVARSLÄGE: NÄSTA STEG — Fokusera enbart på konkreta handlingar. Lista exakt 3–5 specifika saker användaren ska göra härnäst, i prioriteringsordning. Kort och actionable.]";
    }

    // ── Extra context for Coachen: inject progress steps ──
    let progressContext = "";
    if (agentSlug === "coachen") {
      const { data: steps } = await supabase
        .from("progress_steps")
        .select("step_number, title, is_completed")
        .eq("user_id", user.id)
        .order("step_number");

      if (steps?.length) {
        const done = steps.filter((s) => s.is_completed).map((s) => `✓ ${s.title}`);
        const todo = steps.filter((s) => !s.is_completed).map((s) => `○ ${s.title}`);
        progressContext =
          `\n\n─────────────────────────────────────────────────\n` +
          `ANVÄNDARENS PROGRESS (${done.length}/${steps.length} steg klara):\n` +
          `${[...done, ...todo].join("\n")}\n` +
          `─────────────────────────────────────────────────`;
      }
    }

    const enrichedSystemPrompt =
      agent.systemPrompt +
      progressContext +
      (icpContext ? "\n\n" + icpContext : "") +
      modeInstruction;

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) return new Response("ANTHROPIC_API_KEY saknas.", { status: 500 });

    const client = new Anthropic({ apiKey });
    const encoder = new TextEncoder();

    const readable = new ReadableStream({
      async start(controller) {
        try {
          const stream = await client.messages.create({
            model: "claude-sonnet-4-5-20250929",
            max_tokens: responseMode === "kort" ? 512 : 4096,
            system: enrichedSystemPrompt,
            messages,
            stream: true,
          });
          for await (const event of stream) {
            if (
              event.type === "content_block_delta" &&
              event.delta.type === "text_delta"
            ) {
              controller.enqueue(encoder.encode(event.delta.text));
            }
          }
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          controller.enqueue(encoder.encode(`⚠️ Fel: ${msg}`));
        } finally {
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache, no-store",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(`Server error: ${msg}`, { status: 500 });
  }
}
