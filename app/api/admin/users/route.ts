import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

function getServiceSupabase() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function isAdmin(email: string | undefined): boolean {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail || !email) return false;
  return email.toLowerCase() === adminEmail.toLowerCase();
}

// GET /api/admin/users — list all users with profile + ICP data
export async function GET() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || !isAdmin(user.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const service = getServiceSupabase();

  // Fetch all profiles
  const { data: profiles, error } = await service
    .from("profiles")
    .select(`
      id,
      email,
      full_name,
      subscription_status,
      stripe_customer_id,
      stripe_subscription_id,
      subscription_period_end,
      created_at
    `)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Fetch ICP completion for each user
  const { data: icpDocs } = await service
    .from("icp_documents")
    .select("user_id, completion_pct, company_name, industry, updated_at");

  // Fetch progress step counts
  const { data: progressData } = await service
    .from("progress_steps")
    .select("user_id, is_completed");

  // Build a map for quick lookup
  const icpMap = new Map((icpDocs ?? []).map((d) => [d.user_id, d]));
  const progressMap = new Map<string, { total: number; completed: number }>();
  for (const step of progressData ?? []) {
    const cur = progressMap.get(step.user_id) ?? { total: 0, completed: 0 };
    cur.total += 1;
    if (step.is_completed) cur.completed += 1;
    progressMap.set(step.user_id, cur);
  }

  const users = (profiles ?? []).map((p) => ({
    ...p,
    icp: icpMap.get(p.id) ?? null,
    progress: progressMap.get(p.id) ?? { total: 0, completed: 0 },
  }));

  return NextResponse.json({ users });
}
