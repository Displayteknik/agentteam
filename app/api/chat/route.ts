import Anthropic from "@anthropic-ai/sdk";
import { getAgent } from "@/lib/agents";
import { NextRequest } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const { messages, agentSlug } = await request.json();

    const agent = getAgent(agentSlug);
    if (!agent) {
      return new Response("Agent not found", { status: 404 });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return new Response("ANTHROPIC_API_KEY saknas i miljövariablerna.", {
        status: 500,
      });
    }

    // Create client inside handler so env var is resolved at runtime
    const client = new Anthropic({ apiKey });

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          const stream = await client.messages.create({
            model: "claude-sonnet-4-5-20250929",
            max_tokens: 4096,
            system: agent.systemPrompt,
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
          // Write error into stream so client sees it
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
    console.error("Chat API error:", msg);
    return new Response(`Server error: ${msg}`, { status: 500 });
  }
}
