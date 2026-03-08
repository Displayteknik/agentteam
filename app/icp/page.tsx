import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ICPEditor from "./ICPEditor";

export const dynamic = "force-dynamic";

export default async function ICPPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("subscription_status")
    .eq("id", user.id)
    .single();

  const isAdmin = user.email?.toLowerCase() === (process.env.ADMIN_EMAIL ?? "").toLowerCase();
  const isActive = isAdmin || profile?.subscription_status === "active" || profile?.subscription_status === "trialing";
  if (!isActive) redirect("/subscribe");

  const { data: icp } = await supabase
    .from("icp_documents")
    .select("*")
    .eq("user_id", user.id)
    .single();

  return <ICPEditor icp={icp} />;
}
