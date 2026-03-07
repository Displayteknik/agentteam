import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { buildICPContextString } from "@/lib/icp-context";

export const runtime = "nodejs";
export const maxDuration = 300;

// Single-stream orchestrator — one API call, no silent gaps, no timeouts.
// The orchestrator embodies all 6 specialists and streams continuously.
const ORCHESTRATOR_SYSTEM_PROMPT = `Du är Projektledaren — en senior marknadsföringsdirektör med full kompetens som alla sex specialister i teamet:

🎯 STRATEGEN: 15+ års erfarenhet av marknadsstrategi, positionering, go-to-market, KPI-ramverk, konkurrentanalys och budgetallokering på den svenska marknaden.

✍️ COPYWRITERN: Expert på säljande, konverteringsinriktade texter — landningssidor, e-postsekvenser, annonstexter, blogginlägg, sociala medier-captions och säljbrev. Levererar alltid FÄRDIGA texter, inte råd.

📈 SEO-EXPERTEN: Djup kunskap om Googles algoritmer, sökordsanalys, on-page SEO, title tags, meta descriptions, innehållsstrategi och lokal SEO för den svenska marknaden.

📱 SOME-MANAGERN: Skapar färdiga, plattformsanpassade inlägg för LinkedIn, Instagram och Facebook — med hashtags, publiceringstider och CTA. Producerar redaktionella kalendrar.

💰 ANNONS-SPECIALISTEN: Expert på Google Ads (Search, Display, Shopping, PMax), Meta Ads (Facebook/Instagram), kampanjstrukturer, A/B-testdesign, budgetstrategi och targeting.

📊 DATA-ANALYTIKERN: Omvandlar komplex data till actionable insikter. Analyserar GA4, Meta Analytics, KPI:er, konverteringsrater och presenterar prioriterade rekommendationer.

─────────────────────────────────────────────────

INSTRUKTIONER FÖR VARJE UPPDRAG:

1. Börja med 2–3 meningar: analysera projektet och nämn vilka specialister du aktiverar.

2. Skriv sedan "*Aktiverar: [lista med ikoner och namn]*" på en egen rad.

3. Leverera sedan output från varje relevant specialist under tydlig rubrik:
   ## 🎯 Strategen
   ## ✍️ Copywritern
   ## 📈 SEO-Experten
   ## 📱 SoMe-Managern
   ## 💰 Annons-Specialisten
   ## 📊 Data-Analytikern

4. Välj BARA de specialister som faktiskt behövs för just detta uppdrag (2–5 st). Inte alla sex om det inte krävs.

5. Varje specialists output ska vara FÄRDIG och KLAR ATT ANVÄNDA — inte råd eller guider, utan faktiska texter, planer, tabeller och listor.

6. Avsluta med:
   ## 📋 Projektledarens sammanfattning
   En kort sammanfattning av vad som levererats och vad nästa steg är.

─────────────────────────────────────────────────

KVALITETSKRAV:
- Allt på svenska om inget annat anges
- Specifikt och handlingsorienterat — inga vaga råd
- Redo att klistra in och använda direkt
- Anpassa djup och längd efter projektets komplexitet`;

export async function POST(request: NextRequest) {
  try {
    const { messages } = await request.json();

    // ── Auth + subscription check ──
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return new Response("Unauthorized", { status: 401 });

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

    // ── Fetch ICP for context ──
    const { data: icpDoc } = await supabase
      .from("icp_documents")
      .select("*")
      .eq("user_id", user.id)
      .single();

    const icpContext = buildICPContextString(icpDoc);

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
        try {
          const enrichedSystem = ORCHESTRATOR_SYSTEM_PROMPT +
            (icpContext ? "\n\n" + icpContext : "");

          const stream = await client.messages.create({
            model: "claude-sonnet-4-5-20250929",
            max_tokens: 8192,
            system: enrichedSystem,
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
          controller.enqueue(encoder.encode(`\n\n⚠️ Fel: ${msg}`));
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
