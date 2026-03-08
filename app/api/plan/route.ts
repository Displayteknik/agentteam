import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(_request: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const { data: plan } = await supabase
    .from("action_plans")
    .select("*, action_items(*)")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!plan) return Response.json({ plan: null });

  // Sort items by item_number
  if (plan.action_items) {
    plan.action_items = [...plan.action_items].sort(
      (a: { item_number: number }, b: { item_number: number }) => a.item_number - b.item_number
    );
  }

  return Response.json({ plan });
}
