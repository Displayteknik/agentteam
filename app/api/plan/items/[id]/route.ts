import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const { is_completed } = await request.json();

  // Update item (eq user_id ensures ownership)
  const { data: item, error } = await supabase
    .from("action_items")
    .update({
      is_completed,
      completed_at: is_completed ? new Date().toISOString() : null,
    })
    .eq("id", params.id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error || !item) return new Response(error?.message ?? "Not found", { status: 500 });

  // Calculate total XP earned for this plan
  const { data: planItems } = await supabase
    .from("action_items")
    .select("xp_value, is_completed")
    .eq("plan_id", item.plan_id);

  const earnedXp = (planItems ?? [])
    .filter((i: { is_completed: boolean }) => i.is_completed)
    .reduce((sum: number, i: { xp_value: number }) => sum + (i.xp_value ?? 100), 0);

  return Response.json({ item, earned_xp: earnedXp });
}
