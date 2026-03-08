import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { agents } from "@/lib/agents";

export default async function DashboardPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  // Fetch profile, ICP, progress in parallel
  const [profileRes, icpRes, progressRes] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase.from("icp_documents").select("*").eq("user_id", user.id).single(),
    supabase.from("progress_steps").select("*").eq("user_id", user.id).order("step_number"),
  ]);

  const profile = profileRes.data;
  const icp = icpRes.data;
  let steps = progressRes.data ?? [];

  // Auto-create progress steps if missing (handles accounts created before trigger was set up)
  if (steps.length === 0) {
    await supabase.from("progress_steps").insert([
      { user_id: user.id, step_number: 1, step_key: "onboarding_complete", title: "Prenumeration aktiverad", description: "Ditt konto är aktivt och redo att användas", step_order: 1 },
      { user_id: user.id, step_number: 2, step_key: "icp_started", title: "ICP-Dokumentören startad", description: "Du har börjat bygga din kundprofil", step_order: 2 },
      { user_id: user.id, step_number: 3, step_key: "icp_basics_done", title: "Grundinfo ifylld", description: "Företag, bransch och produkt klart", step_order: 3 },
      { user_id: user.id, step_number: 4, step_key: "icp_persona_done", title: "Målperson definierad", description: "Jobbtitlar och företagsstorlek klart", step_order: 4 },
      { user_id: user.id, step_number: 5, step_key: "icp_pain_points_done", title: "Smärtpunkter kartlagda", description: "Utmaningar och problem dokumenterade", step_order: 5 },
      { user_id: user.id, step_number: 6, step_key: "icp_completed", title: "ICP-Dokument 100% klart", description: "Din kompletta kundprofil är färdig", step_order: 6 },
      { user_id: user.id, step_number: 7, step_key: "first_strategy", title: "Första strategi skapad", description: "Med hjälp av Strategen", step_order: 7 },
      { user_id: user.id, step_number: 8, step_key: "first_content", title: "Första innehåll skapat", description: "Med hjälp av Copywritern", step_order: 8 },
      { user_id: user.id, step_number: 9, step_key: "first_campaign", title: "Första kampanj lanserad", description: "Med hjälp av Annons-Specialisten", step_order: 9 },
      { user_id: user.id, step_number: 10, step_key: "first_analysis", title: "Första analys gjord", description: "Med hjälp av Data-Analytikern", step_order: 10 },
    ]);
    const { data: freshSteps } = await supabase
      .from("progress_steps")
      .select("*")
      .eq("user_id", user.id)
      .order("step_number");
    steps = freshSteps ?? [];
  }

  // Subscription check — allow 'active', 'trialing', or admin email
  const isAdmin = user.email?.toLowerCase() === (process.env.ADMIN_EMAIL ?? "").toLowerCase();
  const isActive = isAdmin || profile?.subscription_status === "active" || profile?.subscription_status === "trialing";
  if (!isActive) redirect("/subscribe");

  const firstName = profile?.full_name?.split(" ")[0] ?? "där";
  const icpPct = icp?.completion_pct ?? 0;
  const completedSteps = steps.filter((s) => s.is_completed).length;
  const totalSteps = steps.length || 10;
  const overallPct = Math.round((completedSteps / totalSteps) * 100);

  const specialistAgents = agents.filter((a) => !a.isOrchestrator);

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0b", color: "#f3f4f6" }}>

      {/* ── Header ── */}
      <header style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", background: "rgba(10,10,11,0.97)", backdropFilter: "blur(12px)", position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 1.5rem", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <span style={{ fontSize: "1.3rem" }}>🚀</span>
            <span style={{ fontWeight: 800, color: "#fff", fontSize: "0.95rem" }}>GripCoaching Agent Team</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "1.25rem" }}>
            <Link href="/docs" style={{ fontSize: "0.82rem", color: "#6b7280", textDecoration: "none" }}>Dokumentation</Link>
            {user.email?.toLowerCase() === (process.env.NEXT_PUBLIC_ADMIN_EMAIL ?? "").toLowerCase() && (
              <Link href="/admin" style={{ fontSize: "0.82rem", color: "#f59e0b", textDecoration: "none", fontWeight: 700 }}>🛡️ Admin</Link>
            )}
            <span style={{ fontSize: "0.82rem", color: "#6b7280" }}>{profile?.email}</span>
            <LogoutButton />
          </div>
        </div>
      </header>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "2.5rem 1.5rem 5rem" }}>

        {/* ── Welcome ── */}
        <div style={{ marginBottom: "2.5rem" }}>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 900, color: "#fff", marginBottom: "0.3rem" }}>
            Hej {firstName}! 👋
          </h1>
          <p style={{ color: "#6b7280", fontSize: "0.9rem" }}>
            Ditt marknadsföringsteam är redo. {completedSteps} av {totalSteps} steg avklarade.
          </p>
        </div>

        {/* ── Top row: ICP + Overall progress ── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.25rem", marginBottom: "2rem" }}>

          {/* ICP Card */}
          <Link href="/icp" style={{ textDecoration: "none" }}>
            <div style={{ padding: "1.5rem", borderRadius: 18, background: "#111113", border: `1px solid ${icpPct >= 100 ? "rgba(20,184,166,0.3)" : "rgba(249,115,22,0.25)"}`, cursor: "pointer", position: "relative", overflow: "hidden", transition: "border-color 0.2s" }}>
              <div style={{ height: 2, position: "absolute", top: 0, left: 0, right: 0, background: `linear-gradient(90deg, #14b8a6, transparent)` }} />
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                  <span style={{ fontSize: "1.4rem" }}>🗺️</span>
                  <span style={{ fontWeight: 700, color: "#fff", fontSize: "0.95rem" }}>ICP-Dokument</span>
                </div>
                <span style={{ fontSize: "1.4rem", fontWeight: 900, color: icpPct >= 100 ? "#14b8a6" : "#f97316" }}>{icpPct}%</span>
              </div>
              <ProgressBar pct={icpPct} color={icpPct >= 100 ? "#14b8a6" : "#f97316"} />
              <p style={{ fontSize: "0.8rem", color: "#6b7280", marginTop: "0.75rem" }}>
                {icpPct === 0 ? "Ej påbörjat — klicka för att börja" :
                 icpPct < 100 ? `${icpPct}% klart — fortsätt med ICP-Dokumentören` :
                 "✓ Komplett — alla agenter har din kundprofil"}
              </p>
            </div>
          </Link>

          {/* Overall progress card */}
          <div style={{ padding: "1.5rem", borderRadius: 18, background: "#111113", border: "1px solid rgba(255,255,255,0.05)", position: "relative", overflow: "hidden" }}>
            <div style={{ height: 2, position: "absolute", top: 0, left: 0, right: 0, background: "linear-gradient(90deg, #6366f1, transparent)" }} />
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                <span style={{ fontSize: "1.4rem" }}>📈</span>
                <span style={{ fontWeight: 700, color: "#fff", fontSize: "0.95rem" }}>Din resa</span>
              </div>
              <span style={{ fontSize: "1.4rem", fontWeight: 900, color: "#6366f1" }}>{overallPct}%</span>
            </div>
            <ProgressBar pct={overallPct} color="#6366f1" />
            <p style={{ fontSize: "0.8rem", color: "#6b7280", marginTop: "0.75rem" }}>
              {completedSteps} av {totalSteps} milstolpar avklarade
            </p>
          </div>

          {/* Coach shortcut */}
          <Link href="/agent/coachen" style={{ textDecoration: "none" }}>
            <div style={{ padding: "1.5rem", borderRadius: 18, background: "linear-gradient(135deg, #1a1305 0%, #111113 100%)", border: "1px solid rgba(245,158,11,0.2)", cursor: "pointer", position: "relative", overflow: "hidden", transition: "border-color 0.2s" }}>
              <div style={{ height: 2, position: "absolute", top: 0, left: 0, right: 0, background: "linear-gradient(90deg, #f59e0b, transparent)" }} />
              <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.75rem" }}>
                <span style={{ fontSize: "1.4rem" }}>💪</span>
                <span style={{ fontWeight: 700, color: "#fff", fontSize: "0.95rem" }}>Coachen</span>
              </div>
              <p style={{ fontSize: "0.85rem", color: "#9ca3af", lineHeight: 1.5 }}>
                {icpPct < 100
                  ? "Ditt ICP-dokument är inte klart än. Coachen guidar dig dit."
                  : "Fråga vad du ska fokusera på härnäst i din marknadsföring."}
              </p>
              <div style={{ marginTop: "0.75rem", fontSize: "0.8rem", color: "#f59e0b", fontWeight: 600 }}>Prata med Coachen →</div>
            </div>
          </Link>
        </div>

        {/* ── Progress Steps ── */}
        {steps.length > 0 && (
          <section style={{ marginBottom: "2.5rem" }}>
            <h2 style={{ fontSize: "0.85rem", fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "1rem" }}>
              Din marknadsföringsresa — {completedSteps}/{totalSteps} steg
            </h2>
            <div style={{ background: "#111113", borderRadius: 16, border: "1px solid rgba(255,255,255,0.05)", overflow: "hidden" }}>
              {steps.map((step, i) => (
                <div key={step.id} style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "0.9rem 1.25rem", borderBottom: i < steps.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
                  {/* Step indicator */}
                  <div style={{ width: 28, height: 28, borderRadius: "50%", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: step.is_completed ? "rgba(16,185,129,0.15)" : "rgba(255,255,255,0.04)", border: `1px solid ${step.is_completed ? "rgba(16,185,129,0.4)" : "rgba(255,255,255,0.08)"}` }}>
                    {step.is_completed
                      ? <span style={{ color: "#10b981", fontSize: "0.75rem" }}>✓</span>
                      : <span style={{ color: "#374151", fontSize: "0.72rem", fontWeight: 700 }}>{step.step_number}</span>}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "0.88rem", fontWeight: step.is_completed ? 500 : 600, color: step.is_completed ? "#6b7280" : "#f3f4f6", textDecoration: step.is_completed ? "line-through" : "none" }}>
                      {step.title}
                    </div>
                    <div style={{ fontSize: "0.78rem", color: "#4b5563", marginTop: "0.1rem" }}>{step.description}</div>
                  </div>
                  {step.is_completed && step.completed_at && (
                    <span style={{ fontSize: "0.72rem", color: "#374151", flexShrink: 0 }}>
                      {new Date(step.completed_at).toLocaleDateString("sv-SE", { day: "numeric", month: "short" })}
                    </span>
                  )}
                  {!step.is_completed && i === steps.findIndex((s) => !s.is_completed) && (
                    <span style={{ fontSize: "0.7rem", padding: "0.2rem 0.6rem", borderRadius: 99, background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.3)", color: "#a5b4fc", flexShrink: 0, fontWeight: 600 }}>
                      Nu
                    </span>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Agent Grid ── */}
        <section>
          <h2 style={{ fontSize: "0.85rem", fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "1rem" }}>
            Ditt team
          </h2>

          {/* Orchestrator */}
          <Link href="/agent/projektledaren" style={{ textDecoration: "none", display: "block", marginBottom: "1rem" }}>
            <div style={{ padding: "1.25rem 1.5rem", borderRadius: 16, background: "linear-gradient(135deg, #1a0f05 0%, #121214 60%)", border: "1px solid rgba(249,115,22,0.25)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap", cursor: "pointer", transition: "border-color 0.2s" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(249,115,22,0.15)", border: "1px solid rgba(249,115,22,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.3rem" }}>🚀</div>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <span style={{ fontWeight: 800, color: "#fff" }}>Projektledaren</span>
                    <span style={{ fontSize: "0.65rem", padding: "0.15rem 0.5rem", borderRadius: 99, background: "rgba(249,115,22,0.15)", color: "#fb923c", fontWeight: 700, letterSpacing: "0.06em" }}>HELA TEAMET</span>
                  </div>
                  <span style={{ fontSize: "0.82rem", color: "#9ca3af" }}>Beskriv ett projekt — aktiverar rätt specialister automatiskt</span>
                </div>
              </div>
              <span style={{ color: "#f97316", fontSize: "0.85rem", fontWeight: 600, flexShrink: 0 }}>Öppna →</span>
            </div>
          </Link>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "0.85rem" }}>
            {specialistAgents.map((agent) => (
              <Link key={agent.slug} href={`/agent/${agent.slug}`} style={{ textDecoration: "none" }}>
                <div style={{ padding: "1.1rem 1.25rem", borderRadius: 14, background: "#111113", border: "1px solid rgba(255,255,255,0.05)", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.9rem", transition: "border-color 0.2s" }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: `${agent.color}18`, border: `1px solid ${agent.color}30`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.15rem", flexShrink: 0 }}>
                    {agent.icon}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, color: "#fff", fontSize: "0.88rem" }}>{agent.name}</div>
                    <div style={{ fontSize: "0.75rem", color: "#6b7280", marginTop: "0.1rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{agent.description}</div>
                  </div>
                  <span style={{ color: "#374151", flexShrink: 0 }}>→</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

// ── Sub-components ──

function ProgressBar({ pct, color }: { pct: number; color: string }) {
  return (
    <div style={{ height: 6, background: "rgba(255,255,255,0.06)", borderRadius: 99, overflow: "hidden" }}>
      <div style={{ height: "100%", width: `${Math.min(pct, 100)}%`, background: color, borderRadius: 99, transition: "width 0.5s ease" }} />
    </div>
  );
}

function LogoutButton() {
  return (
    <form action="/auth/signout" method="POST">
      <button type="submit" style={{ fontSize: "0.82rem", color: "#6b7280", background: "none", border: "none", cursor: "pointer", padding: 0 }}>
        Logga ut
      </button>
    </form>
  );
}
