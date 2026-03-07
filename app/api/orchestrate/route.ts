import Anthropic from "@anthropic-ai/sdk";
import { agents, getAgent } from "@/lib/agents";
import { NextRequest } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 300;

const ORCHESTRATOR_SYSTEM_PROMPT = `Du är Projektledaren – GripCoachings AI-orkestratör och marknadsföringsdirektör.

Ditt jobb är att analysera ett marknadsföringsprojekt och delegera det till rätt specialister i teamet. Välj BARA de agenter som faktiskt behövs och briefar dem noggrant.

DITT TEAM:
• Strategen – Marknadsföringsstrategi, KPI:er, positionering, go-to-market, konkurrentanalys. Kalla vid: kampanjplanering, lansering, ny produkt/tjänst, tillväxtmål.
• Copywritern – E-post, landningssidor, blogginlägg, annonstexter, säljbrev. Kalla vid: text behövs, copy, innehåll att skriva.
• SEO-Experten – Sökordsanalys, on-page SEO, meta-texter, innehållsstrategi. Kalla vid: SEO, Google-synlighet, sökord, organisk trafik.
• SoMe-Managern – LinkedIn, Instagram, Facebook-inlägg, innehållskalender, hashtags. Kalla vid: sociala medier, inlägg, kalender, SoMe.
• Annons-Specialisten – Google Ads, Meta Ads, kampanjstruktur, annonstexter, budgetstrategi. Kalla vid: betald annonsering, ads, kampanj, budget.
• Data-Analytikern – KPI-ramverk, mätplan, GA4-analys, uppföljningsstruktur. Kalla vid: mätning, analys, KPI:er, data, uppföljning.

INSTRUKTIONER:
1. Börja med en kort analys (2–3 meningar) av vad uppdraget kräver och vilka specialister du aktiverar
2. Välj 2–5 agenter – aldrig fler än nödvändigt för just detta uppdrag
3. Ge varje agent en DETALJERAD brief (inkludera: vad projektet är, målgrupp, mål, ton, och kontext från andra agenter om relevant)
4. Kalla alltid Strategen FÖRST vid stora eller nya projekt – inkludera sedan strategin i alla efterföljande agenters brief
5. Avsluta med en kort sammanfattning av vad som levererats

Svara alltid på svenska.`;

// Build tool definitions from the 6 specialist agents (not the orchestrator itself)
const agentTools: Anthropic.Tool[] = agents
  .filter((a) => !a.isOrchestrator)
  .map((agent) => ({
    name: `call_${agent.slug.replace(/-/g, "_")}`,
    description: `${agent.name} (${agent.title}): ${agent.description}`,
    input_schema: {
      type: "object" as const,
      properties: {
        brief: {
          type: "string",
          description: `Detaljerad brief för ${agent.name}. Inkludera all relevant kontext, målgrupp, mål och specifika önskemål.`,
        },
      },
      required: ["brief"],
    },
  }));

async function callSubAgent(slug: string, brief: string): Promise<string> {
  const agent = getAgent(slug);
  if (!agent) return `⚠️ Agent "${slug}" hittades inte.`;

  const apiKey = process.env.ANTHROPIC_API_KEY!;
  const client = new Anthropic({ apiKey });

  try {
    const response = await client.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 2048,
      system: agent.systemPrompt,
      messages: [{ role: "user", content: brief }],
    });
    return response.content[0].type === "text" ? response.content[0].text : "";
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return `⚠️ Fel från ${agent.name}: ${msg}`;
  }
}

export async function POST(request: NextRequest) {
  try {
    const { messages } = await request.json();

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return new Response("ANTHROPIC_API_KEY saknas i miljövariablerna.", {
        status: 500,
      });
    }

    const client = new Anthropic({ apiKey });
    const encoder = new TextEncoder();

    const readable = new ReadableStream({
      async start(controller) {
        const send = (text: string) => {
          controller.enqueue(encoder.encode(text));
        };

        try {
          const orchestratorMessages: Anthropic.MessageParam[] = messages;

          // ── Step 1: Let the orchestrator analyze and decide which agents to call ──
          const planResponse = await client.messages.create({
            model: "claude-sonnet-4-5-20250929",
            max_tokens: 4096,
            system: ORCHESTRATOR_SYSTEM_PROMPT,
            messages: orchestratorMessages,
            tools: agentTools,
            tool_choice: { type: "auto" },
          });

          // Stream any text from the orchestrator (its analysis)
          for (const block of planResponse.content) {
            if (block.type === "text" && block.text) {
              send(block.text);
            }
          }

          if (planResponse.stop_reason === "tool_use") {
            const toolUseBlocks = planResponse.content.filter(
              (b): b is Anthropic.ToolUseBlock => b.type === "tool_use"
            );

            // Announce which agents are being activated
            const agentList = toolUseBlocks
              .map((t) => {
                const slug = t.name.replace("call_", "").replace(/_/g, "-");
                const ag = getAgent(slug);
                return `${ag?.icon} ${ag?.name}`;
              })
              .join("  ·  ");

            send(`\n\n*Aktiverar: ${agentList}*\n`);

            // ── Step 2: Call all agents in parallel ──
            const results = await Promise.all(
              toolUseBlocks.map(async (toolUse) => {
                const agentSlug = toolUse.name
                  .replace("call_", "")
                  .replace(/_/g, "-");
                const brief = (toolUse.input as { brief: string }).brief;
                const result = await callSubAgent(agentSlug, brief);
                return { agentSlug, result, id: toolUse.id };
              })
            );

            // ── Step 3: Stream results in order ──
            for (const { agentSlug, result } of results) {
              const agentInfo = getAgent(agentSlug);
              send(
                `\n\n---\n\n## ${agentInfo?.icon ?? "🤖"} ${agentInfo?.name ?? agentSlug}\n\n`
              );
              send(result);
            }

            // ── Step 4: Ask orchestrator for a final summary ──
            orchestratorMessages.push({
              role: "assistant",
              content: planResponse.content,
            });
            orchestratorMessages.push({
              role: "user",
              content: results.map((r) => ({
                type: "tool_result" as const,
                tool_use_id: r.id,
                content: r.result,
              })),
            });

            const summaryResponse = await client.messages.create({
              model: "claude-sonnet-4-5-20250929",
              max_tokens: 512,
              system: ORCHESTRATOR_SYSTEM_PROMPT,
              messages: orchestratorMessages,
              tools: agentTools,
            });

            const summaryText = summaryResponse.content
              .filter((b): b is Anthropic.TextBlock => b.type === "text")
              .map((b) => b.text)
              .join("");

            if (summaryText.trim()) {
              send("\n\n---\n\n## 📋 Projektledarens sammanfattning\n\n");
              send(summaryText);
            }
          }
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          send(`\n\n⚠️ Fel: ${msg}`);
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
    console.error("Orchestrate API error:", msg);
    return new Response(`Server error: ${msg}`, { status: 500 });
  }
}
