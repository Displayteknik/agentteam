"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

// ── Types ──────────────────────────────────────────────────────────────────
interface ActionItem {
  id: string;
  item_number: number;
  title: string;
  description: string;
  category: string;
  agent_slug: string;
  xp_value: number;
  is_completed: boolean;
  completed_at: string | null;
}

interface ActionPlan {
  id: string;
  goal_description: string;
  goal_type: string;
  total_xp: number;
  action_items: ActionItem[];
}

// ── Level system ───────────────────────────────────────────────────────────
const LEVELS = [
  { min: 0, max: 299, emoji: "🌱", name: "Nybörjare", color: "#10b981" },
  { min: 300, max: 599, emoji: "⚡", name: "Igångkommen", color: "#06b6d4" },
  { min: 600, max: 999, emoji: "🔥", name: "Aktiv", color: "#f59e0b" },
  { min: 1000, max: 1499, emoji: "🎯", name: "Fokuserad", color: "#8b5cf6" },
  { min: 1500, max: Infinity, emoji: "🚀", name: "Proffs", color: "#ec4899" },
];

// ── Category config ────────────────────────────────────────────────────────
const CAT: Record<string, { color: string; label: string; emoji: string }> = {
  grund: { color: "#6366f1", label: "Grund", emoji: "📐" },
  "innehåll": { color: "#8b5cf6", label: "Innehåll", emoji: "✍️" },
  "marknadsföring": { color: "#ec4899", label: "Marknadsföring", emoji: "📢" },
  "sälj": { color: "#f59e0b", label: "Sälj", emoji: "💰" },
  teknik: { color: "#06b6d4", label: "Teknik", emoji: "⚙️" },
  lansering: { color: "#10b981", label: "Lansering", emoji: "🚀" },
};

const AGENT_NAMES: Record<string, string> = {
  strategen: "Strategen",
  copywritern: "Copywritern",
  "seo-experten": "SEO-Experten",
  "some-managern": "SOME-Managern",
  "annons-specialisten": "Annons-Specialisten",
  "data-analytikern": "Data-Analytikern",
  coachen: "Coachen",
  "icp-dokumentoren": "ICP-Dokumentören",
};

function getLevel(xp: number) {
  return LEVELS.find((l) => xp >= l.min && xp <= l.max) ?? LEVELS[0];
}

// ── Confetti ───────────────────────────────────────────────────────────────
function Confetti({ active }: { active: boolean }) {
  if (!active) return null;
  const pieces = Array.from({ length: 18 }, (_, i) => i);
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        pointerEvents: "none",
        zIndex: 9999,
        overflow: "hidden",
      }}
    >
      {pieces.map((i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            top: "-10px",
            left: `${(i / pieces.length) * 100}%`,
            width: 10,
            height: 10,
            borderRadius: i % 3 === 0 ? "50%" : 2,
            background: ["#6366f1", "#10b981", "#f59e0b", "#ec4899", "#06b6d4", "#8b5cf6"][i % 6],
            animation: `confettiFall ${1.5 + (i % 4) * 0.3}s ease-in ${(i % 5) * 0.15}s forwards`,
          }}
        />
      ))}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────
export default function PlanView({ plan: initialPlan }: { plan: ActionPlan }) {
  const [items, setItems] = useState<ActionItem[]>(initialPlan.action_items ?? []);
  const [toggling, setToggling] = useState<string | null>(null);
  const [celebrationId, setCelebrationId] = useState<string | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [prevXp, setPrevXp] = useState(0);
  const [levelUp, setLevelUp] = useState(false);

  const earnedXp = items.filter((i) => i.is_completed).reduce((s, i) => s + i.xp_value, 0);
  const totalXp = initialPlan.total_xp;
  const completedCount = items.filter((i) => i.is_completed).length;
  const totalCount = items.length;
  const currentLevel = getLevel(earnedXp);
  const nextLevel = LEVELS[LEVELS.indexOf(currentLevel) + 1] ?? null;
  const levelProgress = nextLevel
    ? Math.min(
        Math.round(((earnedXp - currentLevel.min) / (nextLevel.min - currentLevel.min)) * 100),
        100
      )
    : 100;
  const nextIncompleteIndex = items.findIndex((i) => !i.is_completed);
  const allDone = completedCount === totalCount && totalCount > 0;

  // Detect level-up
  useEffect(() => {
    const prevLevel = getLevel(prevXp);
    if (earnedXp > prevXp && currentLevel.name !== prevLevel.name) {
      setLevelUp(true);
      setTimeout(() => setLevelUp(false), 3000);
    }
    setPrevXp(earnedXp);
  }, [earnedXp]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleItem = async (item: ActionItem) => {
    if (toggling) return;
    setToggling(item.id);
    const newCompleted = !item.is_completed;

    // Optimistic update
    setItems((prev) =>
      prev.map((i) =>
        i.id === item.id
          ? { ...i, is_completed: newCompleted, completed_at: newCompleted ? new Date().toISOString() : null }
          : i
      )
    );

    try {
      const res = await fetch(`/api/plan/items/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_completed: newCompleted }),
      });

      if (res.ok && newCompleted) {
        setCelebrationId(item.id);
        setShowConfetti(true);
        setTimeout(() => setCelebrationId(null), 1800);
        setTimeout(() => setShowConfetti(false), 2200);
      }
      if (!res.ok) {
        // Revert
        setItems((prev) =>
          prev.map((i) =>
            i.id === item.id
              ? { ...i, is_completed: item.is_completed, completed_at: item.completed_at }
              : i
          )
        );
      }
    } catch {
      setItems((prev) =>
        prev.map((i) =>
          i.id === item.id
            ? { ...i, is_completed: item.is_completed, completed_at: item.completed_at }
            : i
        )
      );
    } finally {
      setToggling(null);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0b", color: "#f3f4f6" }}>
      {/* Confetti */}
      <Confetti active={showConfetti} />

      {/* Level-up banner */}
      {levelUp && (
        <div
          style={{
            position: "fixed",
            top: 80,
            left: "50%",
            transform: "translateX(-50%)",
            background: `linear-gradient(135deg, ${currentLevel.color}22, #111113)`,
            border: `1px solid ${currentLevel.color}50`,
            borderRadius: 16,
            padding: "1rem 2rem",
            zIndex: 1000,
            textAlign: "center",
            animation: "slideDown 0.4s ease",
          }}
        >
          <div style={{ fontSize: "2rem" }}>{currentLevel.emoji}</div>
          <div style={{ fontWeight: 900, color: "#fff", fontSize: "1rem" }}>
            Ny nivå: {currentLevel.name}!
          </div>
        </div>
      )}

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
            maxWidth: 820,
            margin: "0 auto",
            padding: "0 1.5rem",
            height: 64,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <Link
              href="/dashboard"
              style={{ fontSize: "0.82rem", color: "#6b7280", textDecoration: "none" }}
            >
              ← Dashboard
            </Link>
            <span style={{ color: "rgba(255,255,255,0.1)" }}>|</span>
            <span style={{ fontWeight: 800, color: "#fff", fontSize: "0.95rem" }}>
              🗺️ Handlingsplan
            </span>
          </div>
          <Link
            href="/plan/setup"
            style={{
              fontSize: "0.78rem",
              color: "#6b7280",
              textDecoration: "none",
              padding: "0.35rem 0.75rem",
              borderRadius: 8,
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            Nytt mål
          </Link>
        </div>
      </header>

      <div style={{ maxWidth: 820, margin: "0 auto", padding: "2rem 1.5rem 5rem" }}>
        {/* Goal description */}
        <div style={{ marginBottom: "1.75rem" }}>
          <div
            style={{
              fontSize: "0.7rem",
              fontWeight: 700,
              color: "#4b5563",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              marginBottom: "0.35rem",
            }}
          >
            Ditt mål
          </div>
          <p style={{ fontSize: "1rem", fontWeight: 600, color: "#d1d5db", lineHeight: 1.5, margin: 0 }}>
            {initialPlan.goal_description}
          </p>
        </div>

        {/* XP / Level card */}
        <div
          style={{
            background: "#111113",
            border: `1px solid ${currentLevel.color}25`,
            borderRadius: 20,
            padding: "1.5rem",
            marginBottom: "1.25rem",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: 3,
              background: `linear-gradient(90deg, ${currentLevel.color}, transparent)`,
            }}
          />

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "1rem",
              marginBottom: "1.25rem",
            }}
          >
            {/* Level info */}
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 14,
                  background: `${currentLevel.color}15`,
                  border: `1px solid ${currentLevel.color}30`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "1.8rem",
                }}
              >
                {currentLevel.emoji}
              </div>
              <div>
                <div style={{ fontSize: "1.2rem", fontWeight: 900, color: "#fff" }}>
                  {currentLevel.name}
                </div>
                <div style={{ fontSize: "0.75rem", color: "#6b7280" }}>
                  Nivå {LEVELS.indexOf(currentLevel) + 1} av {LEVELS.length}
                </div>
              </div>
            </div>

            {/* XP counter */}
            <div style={{ textAlign: "right" }}>
              <div
                style={{
                  fontSize: "2rem",
                  fontWeight: 900,
                  color: currentLevel.color,
                  lineHeight: 1,
                }}
              >
                {earnedXp}
              </div>
              <div style={{ fontSize: "0.75rem", color: "#6b7280" }}>av {totalXp} XP</div>
            </div>
          </div>

          {/* XP bar */}
          <div
            style={{
              height: 10,
              background: "rgba(255,255,255,0.05)",
              borderRadius: 99,
              overflow: "hidden",
              marginBottom: "0.5rem",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${Math.min((earnedXp / Math.max(totalXp, 1)) * 100, 100)}%`,
                background: `linear-gradient(90deg, ${currentLevel.color}, ${currentLevel.color}88)`,
                borderRadius: 99,
                transition: "width 0.6s ease",
              }}
            />
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: "0.75rem",
              color: "#4b5563",
            }}
          >
            <span>
              {completedCount}/{totalCount} steg klara
            </span>
            {nextLevel ? (
              <span>
                Nästa: {nextLevel.emoji} {nextLevel.name} ({nextLevel.min} XP)
                &nbsp;·&nbsp;{levelProgress}%
              </span>
            ) : (
              <span>🏆 Max nivå uppnådd!</span>
            )}
          </div>
        </div>

        {/* Category legend */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "0.45rem",
            marginBottom: "1.5rem",
          }}
        >
          {Object.entries(CAT).map(([key, cfg]) => (
            <span
              key={key}
              style={{
                fontSize: "0.68rem",
                padding: "0.2rem 0.55rem",
                borderRadius: 99,
                background: `${cfg.color}10`,
                border: `1px solid ${cfg.color}22`,
                color: cfg.color,
                fontWeight: 600,
              }}
            >
              {cfg.emoji} {cfg.label}
            </span>
          ))}
        </div>

        {/* Action items */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.55rem" }}>
          {items.map((item, idx) => {
            const cat = CAT[item.category] ?? { color: "#6b7280", label: item.category, emoji: "📌" };
            const isNext = idx === nextIncompleteIndex;
            const isCelebrating = celebrationId === item.id;

            return (
              <div
                key={item.id}
                style={{
                  background: item.is_completed ? "#0d0d0f" : "#111113",
                  border: `1px solid ${
                    isCelebrating
                      ? "#10b981"
                      : item.is_completed
                      ? "rgba(255,255,255,0.04)"
                      : isNext
                      ? `${cat.color}40`
                      : "rgba(255,255,255,0.06)"
                  }`,
                  borderRadius: 16,
                  padding: "1rem 1.25rem",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "1rem",
                  transition: "all 0.3s ease",
                  position: "relative",
                  overflow: "hidden",
                  opacity: item.is_completed ? 0.55 : 1,
                }}
              >
                {/* Left color accent */}
                {!item.is_completed && (
                  <div
                    style={{
                      position: "absolute",
                      left: 0,
                      top: 0,
                      bottom: 0,
                      width: 3,
                      background: cat.color,
                      opacity: isNext ? 1 : 0.25,
                    }}
                  />
                )}

                {/* Celebration flash */}
                {isCelebrating && (
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      background: "rgba(16,185,129,0.06)",
                      pointerEvents: "none",
                    }}
                  >
                    <div
                      style={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        fontSize: "1.8rem",
                        animation: "popBounce 0.6s ease forwards",
                      }}
                    >
                      ✨
                    </div>
                  </div>
                )}

                {/* Checkbox */}
                <button
                  onClick={() => toggleItem(item)}
                  disabled={toggling === item.id}
                  title={item.is_completed ? "Markera som ej klar" : "Markera som klar"}
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 8,
                    border: `2px solid ${
                      item.is_completed ? "rgba(16,185,129,0.5)" : `${cat.color}40`
                    }`,
                    background: item.is_completed
                      ? "rgba(16,185,129,0.12)"
                      : toggling === item.id
                      ? `${cat.color}08`
                      : "transparent",
                    cursor: toggling === item.id ? "wait" : "pointer",
                    flexShrink: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginTop: 2,
                    transition: "all 0.2s",
                    fontFamily: "inherit",
                  }}
                >
                  {item.is_completed && (
                    <span style={{ color: "#10b981", fontSize: "0.85rem" }}>✓</span>
                  )}
                </button>

                {/* Text content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      flexWrap: "wrap",
                      marginBottom: "0.3rem",
                    }}
                  >
                    <span style={{ fontSize: "0.7rem", color: "#374151", fontWeight: 700 }}>
                      #{item.item_number}
                    </span>
                    <span
                      style={{
                        fontWeight: item.is_completed ? 500 : 700,
                        color: item.is_completed ? "#6b7280" : "#f3f4f6",
                        fontSize: "0.92rem",
                        textDecoration: item.is_completed ? "line-through" : "none",
                      }}
                    >
                      {item.title}
                    </span>
                    {isNext && !item.is_completed && (
                      <span
                        style={{
                          fontSize: "0.62rem",
                          padding: "0.15rem 0.5rem",
                          borderRadius: 99,
                          background: `${cat.color}18`,
                          border: `1px solid ${cat.color}35`,
                          color: cat.color,
                          fontWeight: 800,
                          letterSpacing: "0.07em",
                        }}
                      >
                        NU
                      </span>
                    )}
                  </div>

                  {item.description && (
                    <p
                      style={{
                        fontSize: "0.82rem",
                        color: item.is_completed ? "#374151" : "#9ca3af",
                        lineHeight: 1.55,
                        margin: "0 0 0.6rem",
                      }}
                    >
                      {item.description}
                    </p>
                  )}

                  {/* Meta row */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.65rem",
                      flexWrap: "wrap",
                    }}
                  >
                    {/* Category */}
                    <span
                      style={{
                        fontSize: "0.67rem",
                        padding: "0.12rem 0.45rem",
                        borderRadius: 99,
                        background: `${cat.color}12`,
                        color: cat.color,
                        fontWeight: 600,
                      }}
                    >
                      {cat.emoji} {cat.label}
                    </span>

                    {/* Agent link */}
                    {item.agent_slug && (
                      <Link
                        href={`/agent/${item.agent_slug}`}
                        style={{
                          fontSize: "0.67rem",
                          color: "#4b5563",
                          textDecoration: "none",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "0.2rem",
                        }}
                      >
                        🤖 {AGENT_NAMES[item.agent_slug] ?? item.agent_slug} →
                      </Link>
                    )}

                    {/* XP */}
                    <span
                      style={{
                        fontSize: "0.67rem",
                        color: item.is_completed ? "#10b981" : "#374151",
                        fontWeight: 700,
                      }}
                    >
                      {item.is_completed ? "✓ " : ""}
                      {item.xp_value} XP
                    </span>

                    {/* Completed date */}
                    {item.is_completed && item.completed_at && (
                      <span style={{ fontSize: "0.65rem", color: "#374151" }}>
                        {new Date(item.completed_at).toLocaleDateString("sv-SE", {
                          day: "numeric",
                          month: "short",
                        })}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* All done celebration */}
        {allDone && (
          <div
            style={{
              marginTop: "2rem",
              padding: "2.5rem",
              borderRadius: 20,
              background: "linear-gradient(135deg, rgba(16,185,129,0.08), rgba(6,182,212,0.04))",
              border: "1px solid rgba(16,185,129,0.2)",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: "3.5rem", marginBottom: "0.75rem" }}>🏆</div>
            <h2
              style={{
                fontSize: "1.35rem",
                fontWeight: 900,
                color: "#10b981",
                marginBottom: "0.5rem",
              }}
            >
              Plan genomförd!
            </h2>
            <p
              style={{
                color: "#6b7280",
                fontSize: "0.9rem",
                marginBottom: "1.5rem",
                lineHeight: 1.6,
              }}
            >
              Du har tjänat {earnedXp} XP och nått nivå {currentLevel.emoji}{" "}
              <strong style={{ color: currentLevel.color }}>{currentLevel.name}</strong>. Redo
              för nästa mål?
            </p>
            <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center", flexWrap: "wrap" }}>
              <Link
                href="/plan/setup"
                style={{
                  padding: "0.75rem 1.75rem",
                  borderRadius: 12,
                  background: "#10b981",
                  color: "#fff",
                  textDecoration: "none",
                  fontWeight: 700,
                  fontSize: "0.9rem",
                }}
              >
                Sätt ett nytt mål →
              </Link>
              <Link
                href="/agent/coachen"
                style={{
                  padding: "0.75rem 1.75rem",
                  borderRadius: 12,
                  background: "rgba(245,158,11,0.15)",
                  border: "1px solid rgba(245,158,11,0.3)",
                  color: "#f59e0b",
                  textDecoration: "none",
                  fontWeight: 700,
                  fontSize: "0.9rem",
                }}
              >
                Fira med Coachen 💪
              </Link>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes confettiFall {
          0%   { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
        @keyframes popBounce {
          0%   { transform: translate(-50%, -50%) scale(0.3); opacity: 0; }
          40%  { transform: translate(-50%, -50%) scale(1.6); opacity: 1; }
          100% { transform: translate(-50%, -50%) scale(1); opacity: 0; }
        }
        @keyframes slideDown {
          from { transform: translate(-50%, -20px); opacity: 0; }
          to   { transform: translate(-50%, 0);    opacity: 1; }
        }
      `}</style>
    </div>
  );
}
