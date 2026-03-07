"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  subscription_status: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  subscription_period_end: string | null;
  created_at: string;
}

interface ICPDocument {
  company_name?: string;
  industry?: string;
  product_description?: string;
  target_job_titles?: string[];
  target_company_size?: string;
  geographies?: string[];
  pain_points?: string[];
  value_propositions?: string[];
  objections?: string[];
  buying_triggers?: string[];
  competitors?: string[];
  tone_of_voice?: string;
  monthly_budget?: string;
  completion_pct?: number;
  updated_at?: string;
}

interface ProgressStep {
  id: string;
  step_key: string;
  step_label: string;
  step_order: number;
  is_completed: boolean;
  completed_at: string | null;
}

type SubStatus = "active" | "trialing" | "past_due" | "canceled" | "none";

const STATUS_OPTIONS: { value: SubStatus; label: string }[] = [
  { value: "active",   label: "Aktiv" },
  { value: "trialing", label: "Testperiod" },
  { value: "past_due", label: "Förfallen" },
  { value: "canceled", label: "Avslutad" },
  { value: "none",     label: "Ingen prenumeration" },
];

function statusStyle(s: string | null) {
  switch (s) {
    case "active":    return { bg: "rgba(16,185,129,0.12)",  text: "#10b981" };
    case "trialing":  return { bg: "rgba(99,102,241,0.12)",  text: "#818cf8" };
    case "past_due":  return { bg: "rgba(245,158,11,0.12)",  text: "#f59e0b" };
    case "canceled":  return { bg: "rgba(239,68,68,0.12)",   text: "#f87171" };
    default:          return { bg: "rgba(107,114,128,0.12)", text: "#9ca3af" };
  }
}

function fmtDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("sv-SE", { day: "numeric", month: "long", year: "numeric" });
}

function FieldRow({ label, value }: { label: string; value: string | string[] | undefined }) {
  if (!value || (Array.isArray(value) && value.length === 0)) return null;
  const display = Array.isArray(value) ? value.join(", ") : value;
  return (
    <div style={{ padding: "0.75rem 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
      <div style={{ fontSize: "0.72rem", color: "#6b7280", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: "0.88rem", color: "#d1d5db", lineHeight: 1.6 }}>{display}</div>
    </div>
  );
}

export default function AdminUserPage() {
  const params = useParams();
  const userId = params.id as string;

  const [profile, setProfile] = useState<Profile | null>(null);
  const [icp, setIcp] = useState<ICPDocument | null>(null);
  const [steps, setSteps] = useState<ProgressStep[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Subscription edit state
  const [editingStatus, setEditingStatus] = useState(false);
  const [newStatus, setNewStatus] = useState<SubStatus>("active");
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/admin/users/${userId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) { setError(d.error); return; }
        setProfile(d.profile);
        setIcp(d.icp);
        setSteps(d.steps ?? []);
        setNewStatus((d.profile?.subscription_status ?? "none") as SubStatus);
      })
      .catch(() => setError("Kunde inte hämta användare"))
      .finally(() => setLoading(false));
  }, [userId]);

  const saveStatus = async () => {
    if (!profile) return;
    setSaving(true);
    setSaveMsg(null);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscription_status: newStatus === "none" ? null : newStatus }),
      });
      const d = await res.json();
      if (d.error) { setSaveMsg("❌ " + d.error); return; }
      setProfile(d.profile);
      setSaveMsg("✅ Status uppdaterad");
      setEditingStatus(false);
    } catch {
      setSaveMsg("❌ Nätverksfel");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "#0a0a0b", display: "flex", alignItems: "center", justifyContent: "center", color: "#6b7280" }}>
      Laddar…
    </div>
  );

  if (error || !profile) return (
    <div style={{ minHeight: "100vh", background: "#0a0a0b", display: "flex", alignItems: "center", justifyContent: "center", color: "#f87171" }}>
      ⚠️ {error ?? "Användare hittades inte"}
    </div>
  );

  const ss = statusStyle(profile.subscription_status);
  const icpPct = icp?.completion_pct ?? 0;
  const completedSteps = steps.filter((s) => s.is_completed).length;

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0b", color: "#f3f4f6" }}>
      {/* Header */}
      <header style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", background: "rgba(10,10,11,0.97)", backdropFilter: "blur(12px)", position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 1.5rem", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <Link href="/admin" style={{ fontSize: "0.82rem", color: "#6b7280", textDecoration: "none" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#fff")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#6b7280")}>
              ← Tillbaka
            </Link>
            <span style={{ width: 1, height: 18, background: "rgba(255,255,255,0.08)" }} />
            <span style={{ fontSize: "0.88rem", fontWeight: 700, color: "#fff" }}>{profile.full_name ?? profile.email}</span>
          </div>
          <span style={{ fontSize: "0.72rem", padding: "0.3rem 0.8rem", borderRadius: 8, background: ss.bg, color: ss.text, fontWeight: 700 }}>
            {profile.subscription_status ?? "Ingen prenumeration"}
          </span>
        </div>
      </header>

      <main style={{ maxWidth: 1100, margin: "0 auto", padding: "2rem 1.5rem" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>

          {/* ── Left column ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>

            {/* Profile card */}
            <div style={{ background: "#111113", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, padding: "1.5rem" }}>
              <h2 style={{ fontSize: "0.8rem", fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "1rem" }}>Profil</h2>
              <FieldRow label="Namn" value={profile.full_name ?? undefined} />
              <FieldRow label="E-post" value={profile.email} />
              <FieldRow label="Registrerad" value={fmtDate(profile.created_at)} />
              <FieldRow label="Prenumeration till" value={fmtDate(profile.subscription_period_end)} />
            </div>

            {/* Stripe card */}
            <div style={{ background: "#111113", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, padding: "1.5rem" }}>
              <h2 style={{ fontSize: "0.8rem", fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "1rem" }}>Stripe</h2>
              {profile.stripe_customer_id ? (
                <>
                  <FieldRow label="Customer ID" value={profile.stripe_customer_id} />
                  {profile.stripe_subscription_id && (
                    <FieldRow label="Subscription ID" value={profile.stripe_subscription_id} />
                  )}
                  <div style={{ marginTop: "1rem" }}>
                    <a href={`https://dashboard.stripe.com/customers/${profile.stripe_customer_id}`}
                      target="_blank" rel="noopener noreferrer"
                      style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", padding: "0.45rem 1rem", borderRadius: 9, background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.25)", color: "#818cf8", fontSize: "0.82rem", fontWeight: 600, textDecoration: "none" }}>
                      Öppna i Stripe →
                    </a>
                  </div>
                </>
              ) : (
                <p style={{ fontSize: "0.85rem", color: "#6b7280" }}>Ingen Stripe-kund kopplad</p>
              )}
            </div>

            {/* Subscription status editor */}
            <div style={{ background: "#111113", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, padding: "1.5rem" }}>
              <h2 style={{ fontSize: "0.8rem", fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "1rem" }}>Manuell åtkomst</h2>
              <p style={{ fontSize: "0.82rem", color: "#9ca3af", marginBottom: "1rem", lineHeight: 1.6 }}>
                Ändra prenumerationsstatus manuellt, t.ex. för att ge gratis access eller spärra ett konto.
              </p>
              {!editingStatus ? (
                <button onClick={() => setEditingStatus(true)}
                  style={{ padding: "0.5rem 1.25rem", borderRadius: 9, background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.3)", color: "#f59e0b", fontSize: "0.82rem", fontWeight: 700, cursor: "pointer" }}>
                  ✏️ Ändra status
                </button>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  <select value={newStatus} onChange={(e) => setNewStatus(e.target.value as SubStatus)}
                    style={{ padding: "0.55rem 0.9rem", borderRadius: 9, background: "#1a1a1e", border: "1px solid rgba(255,255,255,0.1)", color: "#f3f4f6", fontSize: "0.88rem", outline: "none" }}>
                    {STATUS_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <button onClick={saveStatus} disabled={saving}
                      style={{ padding: "0.5rem 1.25rem", borderRadius: 9, background: "#10b981", border: "none", color: "#fff", fontSize: "0.82rem", fontWeight: 700, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.6 : 1 }}>
                      {saving ? "Sparar…" : "Spara"}
                    </button>
                    <button onClick={() => { setEditingStatus(false); setSaveMsg(null); }}
                      style={{ padding: "0.5rem 0.9rem", borderRadius: 9, background: "transparent", border: "1px solid rgba(255,255,255,0.08)", color: "#6b7280", fontSize: "0.82rem", cursor: "pointer" }}>
                      Avbryt
                    </button>
                  </div>
                  {saveMsg && <p style={{ fontSize: "0.82rem", color: saveMsg.startsWith("✅") ? "#10b981" : "#f87171" }}>{saveMsg}</p>}
                </div>
              )}
            </div>

            {/* Progress steps */}
            <div style={{ background: "#111113", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, padding: "1.5rem" }}>
              <h2 style={{ fontSize: "0.8rem", fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "1rem" }}>
                Progress ({completedSteps}/{steps.length})
              </h2>
              {steps.length === 0 ? (
                <p style={{ fontSize: "0.85rem", color: "#6b7280" }}>Inga steg registrerade</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                  {steps.map((step) => (
                    <div key={step.id} style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                      <div style={{
                        width: 22, height: 22, borderRadius: "50%", flexShrink: 0,
                        background: step.is_completed ? "rgba(16,185,129,0.15)" : "rgba(255,255,255,0.04)",
                        border: `1.5px solid ${step.is_completed ? "#10b981" : "rgba(255,255,255,0.08)"}`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: "0.7rem", color: step.is_completed ? "#10b981" : "#4b5563",
                      }}>
                        {step.is_completed ? "✓" : step.step_order}
                      </div>
                      <div>
                        <div style={{ fontSize: "0.82rem", color: step.is_completed ? "#d1d5db" : "#6b7280", fontWeight: step.is_completed ? 600 : 400 }}>
                          {step.step_label}
                        </div>
                        {step.completed_at && (
                          <div style={{ fontSize: "0.7rem", color: "#4b5563" }}>{fmtDate(step.completed_at)}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── Right column: ICP document ── */}
          <div style={{ background: "#111113", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, padding: "1.5rem", alignSelf: "start" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
              <h2 style={{ fontSize: "0.8rem", fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.06em" }}>ICP-Dokument</h2>
              {icp && (
                <span style={{ fontSize: "0.82rem", fontWeight: 700, color: icpPct >= 80 ? "#10b981" : icpPct >= 40 ? "#f59e0b" : "#9ca3af" }}>
                  {icpPct}% ifyllt
                </span>
              )}
            </div>

            {/* ICP progress bar */}
            {icp && (
              <div style={{ width: "100%", height: 6, background: "rgba(255,255,255,0.05)", borderRadius: 3, marginBottom: "1.25rem" }}>
                <div style={{ width: `${icpPct}%`, height: "100%", borderRadius: 3, background: icpPct >= 80 ? "#10b981" : icpPct >= 40 ? "#f59e0b" : "#6b7280", transition: "width 0.4s" }} />
              </div>
            )}

            {!icp ? (
              <p style={{ fontSize: "0.88rem", color: "#6b7280" }}>Inget ICP-dokument har skapats ännu.</p>
            ) : (
              <div>
                <FieldRow label="Företagsnamn" value={icp.company_name} />
                <FieldRow label="Bransch" value={icp.industry} />
                <FieldRow label="Produkt / tjänst" value={icp.product_description} />
                <FieldRow label="Målpersoner (titlar)" value={icp.target_job_titles} />
                <FieldRow label="Företagsstorlek" value={icp.target_company_size} />
                <FieldRow label="Geografi" value={icp.geographies} />
                <FieldRow label="Smärtpunkter" value={icp.pain_points} />
                <FieldRow label="Värdeerbjudanden" value={icp.value_propositions} />
                <FieldRow label="Invändningar" value={icp.objections} />
                <FieldRow label="Köputlösare" value={icp.buying_triggers} />
                <FieldRow label="Konkurrenter" value={icp.competitors} />
                <FieldRow label="Ton & röst" value={icp.tone_of_voice} />
                <FieldRow label="Månadsbudget" value={icp.monthly_budget} />
                {icp.updated_at && (
                  <div style={{ marginTop: "0.75rem", fontSize: "0.72rem", color: "#4b5563" }}>
                    Senast uppdaterad: {fmtDate(icp.updated_at)}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
