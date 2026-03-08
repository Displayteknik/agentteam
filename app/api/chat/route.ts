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

    // ── Extra context for Coachen: inject progress steps + action plan ──
    let progressContext = "";
    if (agentSlug === "coachen") {
      const [{ data: steps }, { data: activePlan }] = await Promise.all([
        supabase
          .from("progress_steps")
          .select("step_number, title, is_completed")
          .eq("user_id", user.id)
          .order("step_number"),
        supabase
          .from("action_plans")
          .select("*, action_items(item_number, title, description, category, agent_slug, xp_value, is_completed)")
          .eq("user_id", user.id)
          .eq("is_active", true)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);

      if (steps?.length) {
        const done = steps.filter((s) => s.is_completed).map((s) => `✓ ${s.title}`);
        const todo = steps.filter((s) => !s.is_completed).map((s) => `○ ${s.title}`);
        progressContext =
          `\n\n─────────────────────────────────────────────────\n` +
          `ANVÄNDARENS ONBOARDING-PROGRESS (${done.length}/${steps.length} steg klara):\n` +
          `${[...done, ...todo].join("\n")}\n` +
          `─────────────────────────────────────────────────`;
      }

      if (activePlan) {
        const planItems = [...(activePlan.action_items ?? [])].sort(
          (a: { item_number: number }, b: { item_number: number }) => a.item_number - b.item_number
        );
        const completedItems = planItems.filter((i: { is_completed: boolean }) => i.is_completed);
        const incompleteItems = planItems.filter((i: { is_completed: boolean }) => !i.is_completed);
        const nextStep = incompleteItems[0] ?? null;
        const earnedXp = completedItems.reduce((s: number, i: { xp_value: number }) => s + i.xp_value, 0);

        progressContext +=
          `\n\n─────────────────────────────────────────────────\n` +
          `ANVÄNDARENS HANDLINGSPLAN:\n` +
          `Mål: "${activePlan.goal_description}"\n` +
          `Framsteg: ${completedItems.length}/${planItems.length} steg klara · ${earnedXp}/${activePlan.total_xp} XP intjänat\n\n`;

        if (completedItems.length > 0) {
          progressContext += `Avklarade steg:\n`;
          completedItems.forEach((i: { item_number: number; title: string }) => {
            progressContext += `  ✓ #${i.item_number} ${i.title}\n`;
          });
        }

        if (nextStep) {
          progressContext +=
            `\nNÄSTA STEG (hjälp användaren med detta):\n` +
            `  → #${nextStep.item_number} ${nextStep.title}\n` +
            `     ${nextStep.description ?? ""}\n` +
            `     Agent: ${nextStep.agent_slug}\n`;
        }

        if (incompleteItems.length > 1) {
          progressContext += `\nKommande steg:\n`;
          incompleteItems.slice(1, 4).forEach((i: { item_number: number; title: string }) => {
            progressContext += `  ○ #${i.item_number} ${i.title}\n`;
          });
          if (incompleteItems.length > 4) {
            progressContext += `  ... och ${incompleteItems.length - 4} steg till\n`;
          }
        }

        progressContext += `─────────────────────────────────────────────────`;

        // Coach instruction
        progressContext +=
          `\n\n[COACHENS INSTRUKTION: Du känner till användarens exakta handlingsplan och var de befinner sig. ` +
          `Hälsa dem välkomna och fråga om de vill fortsätta med nästa steg (#${nextStep?.item_number ?? "?"} — ${nextStep?.title ?? "sista steget"}). ` +
          `Var specifik, uppmuntrande och handlingsorienterad. Påminn dem om hur nära de är sitt mål.]`;
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
