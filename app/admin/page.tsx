"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface UserRow {
  id: string;
  email: string;
  full_name: string | null;
  subscription_status: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  subscription_period_end: string | null;
  created_at: string;
  icp: {
    completion_pct: number;
    company_name: string | null;
    industry: string | null;
    updated_at: string;
  } | null;
  progress: { total: number; completed: number };
}

function statusColor(status: string | null): { bg: string; text: string; label: string } {
  switch (status) {
    case "active":    return { bg: "rgba(16,185,129,0.12)", text: "#10b981", label: "Aktiv" };
    case "trialing":  return { bg: "rgba(99,102,241,0.12)", text: "#818cf8", label: "Testperiod" };
    case "past_due":  return { bg: "rgba(245,158,11,0.12)", text: "#f59e0b", label: "Förfallen" };
    case "canceled":  return { bg: "rgba(239,68,68,0.12)",  text: "#f87171", label: "Avslutad" };
    default:          return { bg: "rgba(107,114,128,0.12)", text: "#9ca3af", label: "Ingen" };
  }
}

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("sv-SE", { day: "numeric", month: "short", year: "numeric" });
}

export default function AdminPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<string>("all");
  const [stats, setStats] = useState({ total: 0, active: 0, mrr: 0 });

  useEffect(() => {
    fetch("/api/admin/users")
      .then((r) => r.json())
      .then((d) => {
        if (d.error) { setError(d.error); return; }
        setUsers(d.users);
        const active = d.users.filter((u: UserRow) => u.subscription_status === "active" || u.subscription_status === "trialing").length;
        setStats({ total: d.users.length, active, mrr: active * 697 });
      })
      .catch(() => setError("Kunde inte hämta användare"))
      .finally(() => setLoading(false));
  }, []);

  const filtered = users.filter((u) => {
    const matchSearch =
      !search ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.full_name ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (u.icp?.company_name ?? "").toLowerCase().includes(search.toLowerCase());
    const matchFilter =
      filter === "all" ||
      (filter === "active" && (u.subscription_status === "active" || u.subscription_status === "trialing")) ||
      (filter === "inactive" && u.subscription_status !== "active" && u.subscription_status !== "trialing");
    return matchSearch && matchFilter;
  });

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0b", color: "#f3f4f6" }}>
      {/* Header */}
      <header style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", background: "rgba(10,10,11,0.97)", backdropFilter: "blur(12px)", position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 1.5rem", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <span style={{ fontSize: "1.25rem" }}>🛡️</span>
            <div>
              <div style={{ fontWeight: 800, fontSize: "0.95rem", color: "#fff" }}>Admin</div>
              <div style={{ fontSize: "0.72rem", color: "#6b7280" }}>GripCoaching Agent Team</div>
            </div>
          </div>
          <Link href="/dashboard" style={{ fontSize: "0.82rem", color: "#6b7280", textDecoration: "none", display: "flex", alignItems: "center", gap: "0.35rem" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#fff")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#6b7280")}>
            ← Dashboard
          </Link>
        </div>
      </header>

      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "2rem 1.5rem" }}>
        {/* Title */}
        <div style={{ marginBottom: "2rem" }}>
          <h1 style={{ fontSize: "1.6rem", fontWeight: 900, color: "#fff", margin: 0 }}>Användaradministration</h1>
          <p style={{ color: "#6b7280", fontSize: "0.88rem", marginTop: "0.35rem" }}>Hantera prenumeranter, se ICP-progress och Stripe-data</p>
        </div>

        {/* Stats row */}
        {!loading && !error && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem", marginBottom: "2rem" }}>
            {[
              { label: "Totalt registrerade", value: stats.total, icon: "👤", color: "#6366f1" },
              { label: "Aktiva prenumeranter", value: stats.active, icon: "✅", color: "#10b981" },
              { label: "Estimerad MRR", value: `${stats.mrr.toLocaleString("sv-SE")} kr`, icon: "💰", color: "#f59e0b" },
            ].map((s) => (
              <div key={s.label} style={{ background: "#111113", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, padding: "1.25rem 1.5rem", display: "flex", alignItems: "center", gap: "1rem" }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: `${s.color}18`, border: `1px solid ${s.color}30`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.25rem", flexShrink: 0 }}>
                  {s.icon}
                </div>
                <div>
                  <div style={{ fontSize: "1.5rem", fontWeight: 900, color: "#fff", lineHeight: 1.1 }}>{s.value}</div>
                  <div style={{ fontSize: "0.75rem", color: "#6b7280", marginTop: 2 }}>{s.label}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Filters + search */}
        <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1.25rem", flexWrap: "wrap" }}>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Sök på namn, e-post eller företag…"
            style={{ flex: 1, minWidth: 220, background: "#111113", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: "0.55rem 1rem", color: "#f3f4f6", fontSize: "0.88rem", outline: "none" }}
          />
          {["all", "active", "inactive"].map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              style={{ padding: "0.5rem 1rem", borderRadius: 9, border: "1px solid rgba(255,255,255,0.06)", background: filter === f ? "#6366f1" : "#111113", color: filter === f ? "#fff" : "#9ca3af", fontSize: "0.82rem", fontWeight: 600, cursor: "pointer" }}>
              {f === "all" ? "Alla" : f === "active" ? "Aktiva" : "Inaktiva"}
            </button>
          ))}
        </div>

        {/* Table */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "4rem", color: "#6b7280" }}>Laddar användare…</div>
        ) : error ? (
          <div style={{ textAlign: "center", padding: "4rem", color: "#f87171" }}>⚠️ {error}</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "4rem", color: "#6b7280" }}>Inga användare matchar sökningen.</div>
        ) : (
          <div style={{ background: "#111113", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, overflow: "hidden" }}>
            {/* Table header */}
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1.4fr 1fr 1fr 1fr 80px", gap: "0.5rem", padding: "0.75rem 1.25rem", borderBottom: "1px solid rgba(255,255,255,0.05)", fontSize: "0.72rem", fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              <span>Användare</span>
              <span>Status</span>
              <span>ICP</span>
              <span>Progress</span>
              <span>Registrerad</span>
              <span></span>
            </div>

            {/* Table rows */}
            {filtered.map((u, i) => {
              const sc = statusColor(u.subscription_status);
              const icpPct = u.icp?.completion_pct ?? 0;
              const progPct = u.progress.total ? Math.round((u.progress.completed / u.progress.total) * 100) : 0;
              return (
                <div key={u.id}
                  style={{ display: "grid", gridTemplateColumns: "2fr 1.4fr 1fr 1fr 1fr 80px", gap: "0.5rem", padding: "0.95rem 1.25rem", borderBottom: i < filtered.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none", alignItems: "center" }}>
                  {/* User info */}
                  <div>
                    <div style={{ fontWeight: 600, fontSize: "0.88rem", color: "#fff" }}>{u.full_name || "—"}</div>
                    <div style={{ fontSize: "0.78rem", color: "#6b7280", marginTop: 2 }}>{u.email}</div>
                    {u.icp?.company_name && (
                      <div style={{ fontSize: "0.72rem", color: "#4b5563", marginTop: 1 }}>🏢 {u.icp.company_name}</div>
                    )}
                  </div>

                  {/* Subscription status */}
                  <div>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", padding: "0.3rem 0.7rem", borderRadius: 8, background: sc.bg, color: sc.text, fontSize: "0.78rem", fontWeight: 700 }}>
                      <span style={{ width: 6, height: 6, borderRadius: "50%", background: sc.text, display: "inline-block" }} />
                      {sc.label}
                    </span>
                    {u.subscription_period_end && (
                      <div style={{ fontSize: "0.7rem", color: "#4b5563", marginTop: 4 }}>
                        Till {fmtDate(u.subscription_period_end)}
                      </div>
                    )}
                  </div>

                  {/* ICP completion */}
                  <div>
                    <div style={{ fontSize: "0.88rem", fontWeight: 700, color: icpPct >= 80 ? "#10b981" : icpPct >= 40 ? "#f59e0b" : "#9ca3af" }}>{icpPct}%</div>
                    <div style={{ width: "100%", height: 4, background: "rgba(255,255,255,0.05)", borderRadius: 2, marginTop: 5 }}>
                      <div style={{ width: `${icpPct}%`, height: "100%", borderRadius: 2, background: icpPct >= 80 ? "#10b981" : icpPct >= 40 ? "#f59e0b" : "#6b7280" }} />
                    </div>
                  </div>

                  {/* Progress steps */}
                  <div>
                    <div style={{ fontSize: "0.88rem", fontWeight: 700, color: "#9ca3af" }}>{u.progress.completed}/{u.progress.total}</div>
                    <div style={{ width: "100%", height: 4, background: "rgba(255,255,255,0.05)", borderRadius: 2, marginTop: 5 }}>
                      <div style={{ width: `${progPct}%`, height: "100%", borderRadius: 2, background: "#6366f1" }} />
                    </div>
                  </div>

                  {/* Joined */}
                  <div style={{ fontSize: "0.8rem", color: "#6b7280" }}>{fmtDate(u.created_at)}</div>

                  {/* Action */}
                  <div>
                    <Link href={`/admin/users/${u.id}`}
                      style={{ display: "inline-block", padding: "0.35rem 0.75rem", borderRadius: 8, background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.25)", color: "#818cf8", fontSize: "0.76rem", fontWeight: 600, textDecoration: "none" }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(99,102,241,0.2)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(99,102,241,0.1)")}>
                      Visa →
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer hint */}
        {!loading && !error && (
          <p style={{ textAlign: "center", fontSize: "0.75rem", color: "#374151", marginTop: "1.5rem" }}>
            {filtered.length} av {users.length} användare visas
          </p>
        )}
      </main>
    </div>
  );
}
