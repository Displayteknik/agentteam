"use client";

import { useState } from "react";
import Link from "next/link";

interface ICPDocument {
  id?: string;
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
}

function arrToText(arr?: string[]): string {
  return (arr ?? []).join("\n");
}
function textToArr(text: string): string[] {
  return text.split("\n").map((s) => s.trim()).filter(Boolean);
}

export default function ICPEditor({ icp }: { icp: ICPDocument | null }) {
  const [form, setForm] = useState({
    company_name: icp?.company_name ?? "",
    industry: icp?.industry ?? "",
    product_description: icp?.product_description ?? "",
    target_job_titles: arrToText(icp?.target_job_titles),
    target_company_size: icp?.target_company_size ?? "",
    geographies: arrToText(icp?.geographies),
    pain_points: arrToText(icp?.pain_points),
    value_propositions: arrToText(icp?.value_propositions),
    objections: arrToText(icp?.objections),
    buying_triggers: arrToText(icp?.buying_triggers),
    competitors: arrToText(icp?.competitors),
    tone_of_voice: icp?.tone_of_voice ?? "",
    monthly_budget: icp?.monthly_budget ?? "",
  });

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const completionPct = icp?.completion_pct ?? 0;

  const set = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSaved(false);
    try {
      const payload = {
        ...form,
        target_job_titles: textToArr(form.target_job_titles),
        geographies: textToArr(form.geographies),
        pain_points: textToArr(form.pain_points),
        value_propositions: textToArr(form.value_propositions),
        objections: textToArr(form.objections),
        buying_triggers: textToArr(form.buying_triggers),
        competitors: textToArr(form.competitors),
      };
      const res = await fetch("/api/icp", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Kunde inte spara");
      setSaved(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Något gick fel");
    } finally {
      setSaving(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    background: "#1a1a1e",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 10,
    padding: "0.65rem 0.85rem",
    color: "#f3f4f6",
    fontSize: "0.9rem",
    fontFamily: "inherit",
    outline: "none",
    boxSizing: "border-box",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: "0.78rem",
    fontWeight: 700,
    color: "#6b7280",
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    marginBottom: "0.4rem",
  };

  const hintStyle: React.CSSProperties = {
    fontSize: "0.72rem",
    color: "#4b5563",
    marginTop: "0.25rem",
  };

  const sectionStyle: React.CSSProperties = {
    background: "#111113",
    border: "1px solid rgba(255,255,255,0.05)",
    borderRadius: 18,
    padding: "1.5rem",
    marginBottom: "1.25rem",
  };

  const sectionTitle: React.CSSProperties = {
    fontSize: "0.8rem",
    fontWeight: 800,
    color: "#9ca3af",
    textTransform: "uppercase",
    letterSpacing: "0.1em",
    marginBottom: "1.25rem",
    paddingBottom: "0.75rem",
    borderBottom: "1px solid rgba(255,255,255,0.05)",
  };

  const fieldRow: React.CSSProperties = {
    marginBottom: "1rem",
  };

  const grid2: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "1rem",
    marginBottom: "1rem",
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0b", color: "#f3f4f6" }}>

      {/* Header */}
      <header style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", background: "rgba(10,10,11,0.97)", backdropFilter: "blur(12px)", position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 820, margin: "0 auto", padding: "0 1.5rem", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <Link href="/dashboard" style={{ fontSize: "0.82rem", color: "#6b7280", textDecoration: "none", display: "flex", alignItems: "center", gap: "0.35rem" }}>
              ← Dashboard
            </Link>
            <span style={{ color: "rgba(255,255,255,0.1)" }}>|</span>
            <span style={{ fontSize: "0.95rem" }}>🗺️</span>
            <span style={{ fontWeight: 800, color: "#fff", fontSize: "0.95rem" }}>ICP-Dokument</span>
          </div>
          <Link
            href="/agent/icp-dokumentoren"
            style={{ fontSize: "0.82rem", color: "#14b8a6", textDecoration: "none", fontWeight: 600, padding: "0.4rem 0.9rem", borderRadius: 8, border: "1px solid rgba(20,184,166,0.3)", background: "rgba(20,184,166,0.08)" }}
          >
            Bygg om med AI-guiden →
          </Link>
        </div>
      </header>

      <div style={{ maxWidth: 820, margin: "0 auto", padding: "2rem 1.5rem 5rem" }}>

        {/* Title + completion */}
        <div style={{ marginBottom: "2rem" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem", marginBottom: "0.75rem" }}>
            <div>
              <h1 style={{ fontSize: "1.5rem", fontWeight: 900, color: "#fff", marginBottom: "0.2rem" }}>Din Ideal Customer Profile</h1>
              <p style={{ fontSize: "0.85rem", color: "#6b7280" }}>
                {completionPct === 100
                  ? "✓ Komplett — alla agenter använder detta som underlag"
                  : completionPct > 0
                  ? `${completionPct}% klart — fyll i resterande fält för bäst resultat`
                  : "Börja fylla i fälten nedan eller använd AI-guiden"}
              </p>
            </div>
            <span style={{ fontSize: "1.6rem", fontWeight: 900, color: completionPct >= 100 ? "#14b8a6" : "#f97316" }}>
              {completionPct}%
            </span>
          </div>
          {/* Progress bar */}
          <div style={{ height: 6, background: "rgba(255,255,255,0.06)", borderRadius: 99, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${completionPct}%`, background: completionPct >= 100 ? "#14b8a6" : "#f97316", borderRadius: 99, transition: "width 0.5s" }} />
          </div>
        </div>

        {/* ─── Grundinfo ─── */}
        <div style={sectionStyle}>
          <div style={sectionTitle}>📋 Grundinfo</div>
          <div style={grid2}>
            <div>
              <label style={labelStyle}>Företagsnamn</label>
              <input style={inputStyle} value={form.company_name} onChange={(e) => set("company_name", e.target.value)} placeholder="Ditt företagsnamn" />
            </div>
            <div>
              <label style={labelStyle}>Bransch</label>
              <input style={inputStyle} value={form.industry} onChange={(e) => set("industry", e.target.value)} placeholder="T.ex. SaaS, Coaching, E-handel" />
            </div>
          </div>
          <div style={fieldRow}>
            <label style={labelStyle}>Produkt / Tjänst</label>
            <textarea style={{ ...inputStyle, minHeight: 90, resize: "vertical" }} value={form.product_description} onChange={(e) => set("product_description", e.target.value)} placeholder="Beskriv vad ni säljer och vilket problem det löser" />
          </div>
          <div style={fieldRow}>
            <label style={labelStyle}>Månadsbudget för marknadsföring</label>
            <input style={inputStyle} value={form.monthly_budget} onChange={(e) => set("monthly_budget", e.target.value)} placeholder="T.ex. 10 000–50 000 kr/mån" />
          </div>
        </div>

        {/* ─── Målpersona ─── */}
        <div style={sectionStyle}>
          <div style={sectionTitle}>👤 Målpersona</div>
          <div style={fieldRow}>
            <label style={labelStyle}>Jobbtitlar / Roller</label>
            <textarea style={{ ...inputStyle, minHeight: 90, resize: "vertical" }} value={form.target_job_titles} onChange={(e) => set("target_job_titles", e.target.value)} placeholder={"Marknadschef\nCEO\nSoloprenör"} />
            <p style={hintStyle}>En titel per rad</p>
          </div>
          <div style={grid2}>
            <div>
              <label style={labelStyle}>Bolagsstorlek</label>
              <input style={inputStyle} value={form.target_company_size} onChange={(e) => set("target_company_size", e.target.value)} placeholder="T.ex. 1–10 anställda, soloprenörer" />
            </div>
            <div>
              <label style={labelStyle}>Geografier</label>
              <textarea style={{ ...inputStyle, minHeight: 52, resize: "vertical" }} value={form.geographies} onChange={(e) => set("geographies", e.target.value)} placeholder={"Sverige\nNorden"} />
              <p style={hintStyle}>Ett land/region per rad</p>
            </div>
          </div>
        </div>

        {/* ─── Smärtpunkter & Värde ─── */}
        <div style={sectionStyle}>
          <div style={sectionTitle}>💔 Smärtpunkter & Värdeerbjudanden</div>
          <div style={fieldRow}>
            <label style={labelStyle}>Smärtpunkter — problem ni löser</label>
            <textarea style={{ ...inputStyle, minHeight: 110, resize: "vertical" }} value={form.pain_points} onChange={(e) => set("pain_points", e.target.value)} placeholder={"Har inte tid att skapa innehåll\nVet inte var de ska börja med marknadsföring\nFölorar kunder till konkurrenter"} />
            <p style={hintStyle}>En per rad</p>
          </div>
          <div style={fieldRow}>
            <label style={labelStyle}>Värdeerbjudanden — varför välja er?</label>
            <textarea style={{ ...inputStyle, minHeight: 110, resize: "vertical" }} value={form.value_propositions} onChange={(e) => set("value_propositions", e.target.value)} placeholder={"Beprövad metod med mätbara resultat\nPersonlig support ingår\nResultat inom 30 dagar eller pengarna tillbaka"} />
            <p style={hintStyle}>En per rad</p>
          </div>
        </div>

        {/* ─── Köpbeteende ─── */}
        <div style={sectionStyle}>
          <div style={sectionTitle}>🔥 Köpbeteende</div>
          <div style={fieldRow}>
            <label style={labelStyle}>Köputlösare — vad gör att de köper just nu?</label>
            <textarea style={{ ...inputStyle, minHeight: 90, resize: "vertical" }} value={form.buying_triggers} onChange={(e) => set("buying_triggers", e.target.value)} placeholder={"Ny finansieringsrunda\nNytt kvartal/budgetår\nNyligen bytt roll"} />
            <p style={hintStyle}>En per rad</p>
          </div>
          <div style={fieldRow}>
            <label style={labelStyle}>Invändningar — vanligaste anledningar att INTE köpa</label>
            <textarea style={{ ...inputStyle, minHeight: 90, resize: "vertical" }} value={form.objections} onChange={(e) => set("objections", e.target.value)} placeholder={"Har inte råd just nu\nBehöver förankra internt\nHar provat liknande förut utan resultat"} />
            <p style={hintStyle}>En per rad</p>
          </div>
        </div>

        {/* ─── Kommunikation ─── */}
        <div style={sectionStyle}>
          <div style={sectionTitle}>🗣️ Kommunikation & Konkurrens</div>
          <div style={fieldRow}>
            <label style={labelStyle}>Tone of Voice — hur kommunicerar ni med kunderna?</label>
            <textarea style={{ ...inputStyle, minHeight: 80, resize: "vertical" }} value={form.tone_of_voice} onChange={(e) => set("tone_of_voice", e.target.value)} placeholder="T.ex. Professionell men varm, direkt och handlingsorienterad, aldrig säljig" />
          </div>
          <div style={fieldRow}>
            <label style={labelStyle}>Konkurrenter</label>
            <textarea style={{ ...inputStyle, minHeight: 80, resize: "vertical" }} value={form.competitors} onChange={(e) => set("competitors", e.target.value)} placeholder={"Konkurrent AB\nAnnan aktör\nAtt inte göra något (status quo)"} />
            <p style={hintStyle}>En per rad</p>
          </div>
        </div>

        {/* Save bar */}
        <div style={{ position: "sticky", bottom: 0, background: "rgba(10,10,11,0.95)", backdropFilter: "blur(12px)", borderTop: "1px solid rgba(255,255,255,0.06)", padding: "1rem 0", marginTop: "0.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                padding: "0.65rem 1.75rem",
                borderRadius: 12,
                background: saving ? "rgba(99,102,241,0.4)" : "#6366f1",
                border: "none",
                color: "#fff",
                fontWeight: 700,
                fontSize: "0.9rem",
                cursor: saving ? "not-allowed" : "pointer",
                fontFamily: "inherit",
              }}
            >
              {saving ? "💾 Sparar..." : "💾 Spara ändringar"}
            </button>

            {saved && (
              <span style={{ fontSize: "0.85rem", color: "#10b981", fontWeight: 600 }}>
                ✅ Sparat! Alla agenter uppdaterade.
              </span>
            )}
            {error && (
              <span style={{ fontSize: "0.85rem", color: "#f87171" }}>
                ⚠️ {error}
              </span>
            )}

            <span style={{ fontSize: "0.78rem", color: "#374151", marginLeft: "auto" }}>
              Ändringar påverkar alla agenter direkt
            </span>
          </div>
        </div>

      </div>
    </div>
  );
}
