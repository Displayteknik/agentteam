import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { computeCompletionPct } from "@/lib/icp-context";

export const runtime = "nodejs";

// GET — fetch the current user's ICP document
export async function GET() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("icp_documents")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (error && error.code !== "PGRST116") {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ icp: data ?? null });
}

// PUT — upsert ICP document fields
export async function PUT(request: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();

  // Compute completion % from the fields being saved
  const completion_pct = computeCompletionPct(body);

  const { data, error } = await supabase
    .from("icp_documents")
    .upsert(
      { ...body, user_id: user.id, completion_pct, updated_at: new Date().toISOString() },
      { onConflict: "user_id" }
    )
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Auto-update progress steps based on completion
  const stepUpdates: string[] = [];
  if (completion_pct > 0) stepUpdates.push("icp_started");
  if (body.company_name && body.industry && body.product_description) stepUpdates.push("icp_basics_done");
  if (body.target_job_titles?.length && body.target_company_size) stepUpdates.push("icp_persona_done");
  if (body.pain_points?.length) stepUpdates.push("icp_pain_points_done");
  if (completion_pct >= 100) stepUpdates.push("icp_completed");

  for (const stepKey of stepUpdates) {
    await supabase
      .from("progress_steps")
      .update({ is_completed: true, completed_at: new Date().toISOString() })
      .eq("user_id", user.id)
      .eq("step_key", stepKey)
      .eq("is_completed", false);
  }

  return NextResponse.json({ icp: data, completion_pct });
}
