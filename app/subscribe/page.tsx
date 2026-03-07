"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";

export const dynamic = "force-dynamic";

function SubscribeContent() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const params = useSearchParams();
  const canceled = params.get("canceled");

  async function handleSubscribe() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/stripe/create-checkout", { method: "POST" });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error ?? "Något gick fel. Försök igen.");
        setLoading(false);
      }
    } catch {
      setError("Nätverksfel. Försök igen.");
      setLoading(false);
    }
  }

  return (
    <div style={{ width: "100%", maxWidth: 480 }}>
      {canceled && (
        <div style={{ marginBottom: "1.5rem", padding: "0.75rem 1rem", borderRadius: 10, background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.2)", color: "#fbbf24", fontSize: "0.85rem", textAlign: "center" }}>
          Betalningen avbröts. Du kan försöka igen nedan.
        </div>
      )}

      <div style={{ background: "#111113", border: "1px solid rgba(249,115,22,0.2)", borderRadius: 20, overflow: "hidden" }}>
        <div style={{ height: 3, background: "linear-gradient(90deg, #f97316, #fb923c)" }} />
        <div style={{ padding: "2.5rem" }}>
          <div style={{ textAlign: "center", marginBottom: "2rem" }}>
            <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>🚀</div>
            <h1 style={{ fontSize: "1.6rem", fontWeight: 900, color: "#fff", marginBottom: "0.5rem" }}>
              Ditt marknadsföringsteam
            </h1>
            <p style={{ color: "#9ca3af", fontSize: "0.9rem", lineHeight: 1.6 }}>
              7 AI-specialister. Obegränsat. Alltid tillgängliga.
            </p>
          </div>

          {/* Features */}
          <div style={{ marginBottom: "2rem" }}>
            {[
              "🎯 Strategen — Marknadsplaner och KPI:er",
              "✍️ Copywritern — Färdiga texter direkt",
              "📈 SEO-Experten — Synlighet på Google",
              "📱 SoMe-Managern — Sociala medier-inlägg",
              "💰 Annons-Specialisten — Google & Meta Ads",
              "📊 Data-Analytikern — Insikter från din data",
              "🚀 Projektledaren — Hela teamet på en gång",
              "🗺️ ICP-Dokumentören — Din strategiska grund",
              "💪 Coachen — Din personliga progress-coach",
            ].map((f) => (
              <div key={f} style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.5rem 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                <span style={{ color: "#10b981", flexShrink: 0, fontSize: "0.9rem" }}>✓</span>
                <span style={{ fontSize: "0.88rem", color: "#d1d5db" }}>{f}</span>
              </div>
            ))}
          </div>

          {/* Price */}
          <div style={{ textAlign: "center", marginBottom: "1.5rem", padding: "1.25rem", borderRadius: 12, background: "rgba(249,115,22,0.06)", border: "1px solid rgba(249,115,22,0.15)" }}>
            <div style={{ fontSize: "2.5rem", fontWeight: 900, color: "#fff", lineHeight: 1 }}>697 kr</div>
            <div style={{ color: "#9ca3af", fontSize: "0.85rem", marginTop: "0.25rem" }}>per månad · ingen bindningstid</div>
          </div>

          {error && (
            <div style={{ marginBottom: "1rem", padding: "0.75rem 1rem", borderRadius: 10, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171", fontSize: "0.85rem" }}>
              {error}
            </div>
          )}

          <button
            onClick={handleSubscribe}
            disabled={loading}
            style={{ width: "100%", padding: "0.95rem", borderRadius: 12, background: loading ? "rgba(249,115,22,0.4)" : "#f97316", border: "none", color: "#fff", fontWeight: 800, fontSize: "1rem", cursor: loading ? "not-allowed" : "pointer", transition: "background 0.15s" }}
          >
            {loading ? "Skickar till Stripe..." : "Starta mitt abonnemang →"}
          </button>

          <p style={{ textAlign: "center", marginTop: "1rem", fontSize: "0.78rem", color: "#374151" }}>
            Säker betalning via Stripe · Avsluta när som helst
          </p>
        </div>
      </div>
    </div>
  );
}

export default function SubscribePage() {
  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0b", display: "flex", alignItems: "center", justifyContent: "center", padding: "1.5rem" }}>
      <Suspense fallback={<div style={{ color: "#6b7280" }}>Laddar…</div>}>
        <SubscribeContent />
      </Suspense>
    </div>
  );
}
