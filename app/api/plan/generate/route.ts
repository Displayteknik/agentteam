import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { buildICPContextString } from "@/lib/icp-context";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const { goal } = await request.json();
  if (!goal?.trim()) return new Response("Goal required", { status: 400 });

  // Fetch ICP for context
  const { data: icpDoc } = await supabase
    .from("icp_documents")
    .select("*")
    .eq("user_id", user.id)
    .single();

  const icpContext = buildICPContextString(icpDoc);

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return new Response("ANTHROPIC_API_KEY saknas", { status: 500 });

  const client = new Anthropic({ apiKey });

  const prompt = `Du är en expert marknadsföringscoach för svenska småföretag. Skapa en anpassad, realistisk handlingsplan med 12–16 konkreta steg baserat på användarens mål och deras ICP.

ANVÄNDARENS MÅL:
${goal}

${icpContext ? `FÖRETAGETS ICP-DOKUMENT:\n${icpContext}` : ""}

Returnera ENBART ett JSON-objekt (ingen annan text, inga förklaringar, inga backticks):
{
  "goal_type": "ny_kurs|fler_kunder|säljfunnel|sociala_medier|väx_verksamhet|custom",
  "items": [
    {
      "item_number": 1,
      "title": "Kort handlingsorienterad titel (max 55 tecken)",
      "description": "Exakt vad som ska göras och varför — konkret och specifikt (1-2 meningar)",
      "category": "grund|innehåll|marknadsföring|sälj|teknik|lansering",
      "agent_slug": "strategen",
      "xp_value": 100
    }
  ]
}

REGLER:
- 12–16 steg i logisk ordning (grund → innehåll → marknadsföring → lansering/sälj)
- Varje steg direkt kopplat till användarens specifika mål och ICP
- agent_slug = vilken agent som hjälper bäst (strategen, copywritern, seo-experten, some-managern, annons-specialisten, data-analytikern)
- xp_value: 75 för snabba steg, 100 för vanliga, 150 för viktiga, 200 för stora milstolpar
- category: "grund" för strategi/planering, "innehåll" för copy/content, "marknadsföring" för kanaler, "sälj" för konvertering, "teknik" för setup/verktyg, "lansering" för go-live
- Returnera BARA JSON-objektet`;

  try {
    const message = await client.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 4096,
      messages: [{ role: "user", content: prompt }],
    });

    const responseText = message.content[0].type === "text" ? message.content[0].text : "";

    // Extract JSON (handle potential whitespace/preamble)
    const jsonMatch = responseText.match(/\{[\s\S]+\}/);
    if (!jsonMatch) return new Response("Kunde inte generera plan", { status: 500 });

    const planData = JSON.parse(jsonMatch[0]);

    // Deactivate existing plans
    await supabase.from("action_plans").update({ is_active: false }).eq("user_id", user.id);

    // Create new plan
    const totalXp = planData.items.reduce(
      (sum: number, i: { xp_value: number }) => sum + (i.xp_value ?? 100),
      0
    );

    const { data: plan, error: planError } = await supabase
      .from("action_plans")
      .insert({
        user_id: user.id,
        goal_description: goal,
        goal_type: planData.goal_type ?? "custom",
        total_xp: totalXp,
        is_active: true,
      })
      .select()
      .single();

    if (planError || !plan) {
      return new Response(`Kunde inte spara plan: ${planError?.message}`, { status: 500 });
    }

    // Insert items
    const items = planData.items.map((item: {
      item_number: number;
      title: string;
      description: string;
      category: string;
      agent_slug: string;
      xp_value: number;
    }) => ({
      plan_id: plan.id,
      user_id: user.id,
      item_number: item.item_number,
      title: item.title,
      description: item.description,
      category: item.category ?? "general",
      agent_slug: item.agent_slug ?? "strategen",
      xp_value: item.xp_value ?? 100,
      is_completed: false,
    }));

    const { error: itemsError } = await supabase.from("action_items").insert(items);
    if (itemsError) return new Response(`Kunde inte spara steg: ${itemsError.message}`, { status: 500 });

    return Response.json({ plan_id: plan.id, item_count: items.length });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(`Fel: ${msg}`, { status: 500 });
  }
}
