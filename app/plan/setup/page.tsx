"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const PRESETS = [
  {
    emoji: "🎓",
    label: "Lansera en ny kurs",
    value:
      "Jag vill lansera en ny onlinekurs och behöver hjälp med allt — från att skapa innehållet till att marknadsföra och sälja kursen.",
  },
  {
    emoji: "🙋",
    label: "Fler kunder",
    value:
      "Jag vill attrahera fler kunder/klienter till mitt befintliga erbjudande och bygga en stabil, växande kundstock.",
  },
  {
    emoji: "💰",
    label: "Bygga en säljfunnel",
    value:
      "Jag vill bygga en komplett säljfunnel med leadmagnet, e-postsekvens och ett konverterande erbjudande som genererar leads automatiskt.",
  },
  {
    emoji: "📱",
    label: "Växa på sociala medier",
    value:
      "Jag vill bygga en stark och lönsam närvaro på sociala medier som attraherar kunder organiskt och ökar min synlighet.",
  },
  {
    emoji: "🚀",
    label: "Skala upp verksamheten",
    value:
      "Jag vill skala upp min verksamhet med rätt marknadsföringssystem, ökad synlighet och effektiva processer för tillväxt.",
  },
];

export default function PlanSetupPage() {
  const router = useRouter();
  const [goal, setGoal] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [error, setError] = useState("");

  const loadingMessages = [
    "🤔 Analyserar ditt mål och din ICP...",
    "📋 Skapar 12–16 anpassade steg...",
    "🎯 Optimerar ordning och prioritet...",
    "✨ Lägger sista handen vid...",
  ];

  const handleGenerate = async () => {
    if (!goal.trim() || loading) return;
    setLoading(true);
    setError("");

    // Animate loading steps
    const interval = setInterval(() => {
      setLoadingStep((prev) => (prev < loadingMessages.length - 1 ? prev + 1 : prev));
    }, 3500);

    try {
      const res = await fetch("/api/plan/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goal }),
      });

      // Read streaming response — last non-empty chunk is the JSON result
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let lastChunk = "";
      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true }).trim();
          if (chunk) lastChunk = chunk;
        }
      }

      clearInterval(interval);

      // Parse result
      let result: { plan_id?: string; item_count?: number; error?: string } = {};
      try {
        result = JSON.parse(lastChunk);
      } catch {
        throw new Error("Timeout — servern svarade inte i tid. Försök igen.");
      }

      if (result.error) throw new Error(result.error);
      if (!result.plan_id) throw new Error("Ingen plan skapades. Försök igen.");

      router.push("/plan");
    } catch (e) {
      clearInterval(interval);
      const msg = e instanceof Error ? e.message : "Något gick fel. Försök igen.";
      // Strip raw HTML if timeout page slipped through
      setError(msg.includes("<HTML") || msg.includes("<html") ? "Timeout — servern tog för lång tid. Försök igen om en stund." : msg);
      setLoading(false);
      setLoadingStep(0);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0a0a0b",
        color: "#f3f4f6",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header */}
      <header
        style={{
          borderBottom: "1px solid rgba(255,255,255,0.05)",
          background: "rgba(10,10,11,0.97)",
          backdropFilter: "blur(12px)",
          position: "sticky",
          top: 0,
          zIndex: 50,
        }}
      >
        <div
          style={{
            maxWidth: 720,
            margin: "0 auto",
            padding: "0 1.5rem",
            height: 64,
            display: "flex",
            alignItems: "center",
            gap: "1rem",
          }}
        >
          <Link
            href="/dashboard"
            style={{ fontSize: "0.82rem", color: "#6b7280", textDecoration: "none" }}
          >
            ← Dashboard
          </Link>
          <span style={{ color: "rgba(255,255,255,0.1)" }}>|</span>
          <span style={{ fontWeight: 800, color: "#fff", fontSize: "0.95rem" }}>
            🗺️ Ny handlingsplan
          </span>
        </div>
      </header>

      <div
        style={{
          flex: 1,
          maxWidth: 720,
          margin: "0 auto",
          padding: "3rem 1.5rem 5rem",
          width: "100%",
          boxSizing: "border-box",
        }}
      >
        {/* Hero */}
        <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
          <div style={{ fontSize: "3.5rem", marginBottom: "1rem" }}>🎯</div>
          <h1
            style={{
              fontSize: "1.85rem",
              fontWeight: 900,
              color: "#fff",
              marginBottom: "0.75rem",
            }}
          >
            Vad vill du uppnå?
          </h1>
          <p
            style={{
              color: "#6b7280",
              fontSize: "0.95rem",
              lineHeight: 1.7,
              maxWidth: 500,
              margin: "0 auto",
            }}
          >
            Beskriv ditt mål — AI:n skapar en anpassad handlingsplan med{" "}
            <strong style={{ color: "#9ca3af" }}>12–16 konkreta steg</strong> baserat på din ICP
            och vad du vill uppnå.
          </p>
        </div>

        {/* Preset buttons */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
            gap: "0.75rem",
            marginBottom: "1.5rem",
          }}
        >
          {PRESETS.map((p) => (
            <button
              key={p.label}
              onClick={() => setGoal(p.value)}
              style={{
                background: goal === p.value ? "rgba(99,102,241,0.15)" : "#111113",
                border: `1px solid ${
                  goal === p.value ? "rgba(99,102,241,0.5)" : "rgba(255,255,255,0.07)"
                }`,
                borderRadius: 12,
                padding: "0.85rem 1rem",
                cursor: "pointer",
                textAlign: "left",
                color: goal === p.value ? "#a5b4fc" : "#9ca3af",
                fontSize: "0.85rem",
                fontWeight: 600,
                fontFamily: "inherit",
                transition: "all 0.15s",
              }}
            >
              <span style={{ marginRight: "0.4rem" }}>{p.emoji}</span>
              {p.label}
            </button>
          ))}
        </div>

        {/* Custom textarea */}
        <div style={{ marginBottom: "1.5rem" }}>
          <label
            style={{
              display: "block",
              fontSize: "0.78rem",
              fontWeight: 700,
              color: "#6b7280",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              marginBottom: "0.6rem",
            }}
          >
            Beskriv ditt mål — kan redigeras fritt
          </label>
          <textarea
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            placeholder="T.ex. Jag vill lansera en onlinekurs om stresshantering för chefer, pris 4 997 kr. Jag har ingen e-postlista än och behöver bygga allt från grunden..."
            rows={5}
            disabled={loading}
            style={{
              width: "100%",
              background: "#111113",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 14,
              padding: "1rem",
              color: "#f3f4f6",
              fontSize: "0.9rem",
              fontFamily: "inherit",
              resize: "vertical",
              outline: "none",
              lineHeight: 1.6,
              boxSizing: "border-box",
              opacity: loading ? 0.5 : 1,
            }}
          />
          <p style={{ fontSize: "0.75rem", color: "#374151", marginTop: "0.4rem" }}>
            Tips: Ju mer detaljer du ger, desto mer träffsäker plan.
          </p>
        </div>

        {/* Error */}
        {error && (
          <div
            style={{
              marginBottom: "1rem",
              padding: "0.75rem 1rem",
              borderRadius: 10,
              background: "rgba(239,68,68,0.08)",
              border: "1px solid rgba(239,68,68,0.2)",
              color: "#f87171",
              fontSize: "0.85rem",
            }}
          >
            ⚠️ {error}
          </div>
        )}

        {/* CTA */}
        <button
          onClick={handleGenerate}
          disabled={!goal.trim() || loading}
          style={{
            width: "100%",
            padding: "1.1rem",
            borderRadius: 14,
            background: loading
              ? "rgba(99,102,241,0.35)"
              : !goal.trim()
              ? "rgba(99,102,241,0.15)"
              : "#6366f1",
            border: "none",
            color: !goal.trim() && !loading ? "#6b7280" : "#fff",
            fontWeight: 800,
            fontSize: "1rem",
            cursor: !goal.trim() || loading ? "not-allowed" : "pointer",
            fontFamily: "inherit",
            transition: "all 0.2s",
            letterSpacing: "0.01em",
          }}
        >
          {loading ? "⏳ Genererar din handlingsplan..." : "✨ Generera min handlingsplan →"}
        </button>

        {/* Loading animation */}
        {loading && (
          <div
            style={{
              marginTop: "2rem",
              padding: "1.5rem",
              borderRadius: 16,
              background: "#111113",
              border: "1px solid rgba(99,102,241,0.15)",
            }}
          >
            {loadingMessages.map((msg, i) => (
              <div
                key={i}
                style={{
                  fontSize: "0.87rem",
                  color: i <= loadingStep ? "#a5b4fc" : "#374151",
                  padding: "0.4rem 0",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  transition: "color 0.5s",
                }}
              >
                <span
                  style={{
                    width: 16,
                    height: 16,
                    borderRadius: "50%",
                    background:
                      i < loadingStep
                        ? "rgba(16,185,129,0.3)"
                        : i === loadingStep
                        ? "rgba(99,102,241,0.3)"
                        : "rgba(255,255,255,0.05)",
                    border: `1px solid ${
                      i < loadingStep
                        ? "rgba(16,185,129,0.5)"
                        : i === loadingStep
                        ? "rgba(99,102,241,0.5)"
                        : "rgba(255,255,255,0.08)"
                    }`,
                    flexShrink: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "0.6rem",
                  }}
                >
                  {i < loadingStep ? "✓" : ""}
                </span>
                {msg}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
