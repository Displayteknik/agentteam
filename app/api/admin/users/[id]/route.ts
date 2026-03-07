import { NextRequest, NextResponse } from "next/server";
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

// GET /api/admin/users/[id] — get full user details
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || !isAdmin(user.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const service = getServiceSupabase();
  const userId = params.id;

  // Fetch profile
  const { data: profile } = await service
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  // Fetch ICP document
  const { data: icp } = await service
    .from("icp_documents")
    .select("*")
    .eq("user_id", userId)
    .single();

  // Fetch progress steps
  const { data: steps } = await service
    .from("progress_steps")
    .select("*")
    .eq("user_id", userId)
    .order("step_order", { ascending: true });

  return NextResponse.json({ profile, icp, steps });
}

// PATCH /api/admin/users/[id] — update subscription status
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || !isAdmin(user.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const service = getServiceSupabase();
  const userId = params.id;
  const body = await request.json();

  // Only allow patching subscription_status and subscription_period_end
  const allowed = ["subscription_status", "subscription_period_end", "full_name"];
  const update: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) update[key] = body[key];
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  const { data, error } = await service
    .from("profiles")
    .update(update)
    .eq("id", userId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ profile: data });
}
