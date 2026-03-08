import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import PlanView from "./PlanView";

export const dynamic = "force-dynamic";

export default async function PlanPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("subscription_status")
    .eq("id", user.id)
    .single();

  const isAdmin =
    user.email?.toLowerCase() === (process.env.ADMIN_EMAIL ?? "").toLowerCase();
  const isActive =
    isAdmin ||
    profile?.subscription_status === "active" ||
    profile?.subscription_status === "trialing";
  if (!isActive) redirect("/subscribe");

  // Fetch active plan + items
  const { data: plan } = await supabase
    .from("action_plans")
    .select("*, action_items(*)")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  // No plan yet → send to setup
  if (!plan) redirect("/plan/setup");

  // Sort items by item_number
  if (plan.action_items) {
    plan.action_items = [...plan.action_items].sort(
      (a: { item_number: number }, b: { item_number: number }) =>
        a.item_number - b.item_number
    );
  }

  return <PlanView plan={plan} />;
}
