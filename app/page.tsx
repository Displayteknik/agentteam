"use client";

import Link from "next/link";
import { agents } from "@/lib/agents";

export default function Home() {
  return (
    <div className="min-h-screen" style={{ background: "#0a0a0b" }}>
      {/* Header */}
      <header
        style={{
          borderBottom: "1px solid rgba(255,255,255,0.05)",
          background: "rgba(10,10,11,0.95)",
          backdropFilter: "blur(12px)",
          position: "sticky",
          top: 0,
          zIndex: 50,
        }}
      >
        <div
          style={{
            maxWidth: 1100,
            margin: "0 auto",
            padding: "0 1.5rem",
            height: 64,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: "rgba(99,102,241,0.15)",
                border: "1px solid rgba(99,102,241,0.3)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#a5b4fc",
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: "0.95rem", color: "#ffffff", lineHeight: 1.2 }}>
                GripCoaching
              </div>
              <div style={{ fontSize: "0.72rem", color: "#6b7280", fontWeight: 500 }}>
                Agent Team
              </div>
            </div>
          </div>

          <a
            href="https://gripcoaching-marketing.netlify.app"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontSize: "0.85rem",
              color: "#6b7280",
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
              transition: "color 0.15s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#ffffff")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#6b7280")}
          >
            Tillbaka till sidan
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" />
            </svg>
          </a>
        </div>
      </header>

      {/* Hero */}
      <div
        style={{
          maxWidth: 1100,
          margin: "0 auto",
          padding: "5rem 1.5rem 3.5rem",
          textAlign: "center",
        }}
      >
        {/* Status badge */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            padding: "0.4rem 1rem",
            borderRadius: 999,
            background: "rgba(99,102,241,0.08)",
            border: "1px solid rgba(99,102,241,0.2)",
            color: "#a5b4fc",
            fontSize: "0.82rem",
            fontWeight: 600,
            marginBottom: "1.75rem",
          }}
        >
          <span
            style={{
              width: 7,
              height: 7,
              borderRadius: "50%",
              background: "#10b981",
              display: "inline-block",
            }}
          />
          6 agenter online och redo
        </div>

        <h1
          style={{
            fontSize: "clamp(2.2rem, 5vw, 3.5rem)",
            fontWeight: 900,
            color: "#ffffff",
            lineHeight: 1.1,
            marginBottom: "1.25rem",
            letterSpacing: "-0.02em",
          }}
        >
          Ditt Marketing Team
        </h1>

        <p
          style={{
            fontSize: "1.15rem",
            color: "#9ca3af",
            maxWidth: 520,
            margin: "0 auto",
            lineHeight: 1.6,
          }}
        >
          Välj en specialist. Ge dem ett uppdrag. Få professionella resultat på
          sekunder.
        </p>
      </div>

      {/* Agent Grid */}
      <div
        style={{
          maxWidth: 1100,
          margin: "0 auto",
          padding: "0 1.5rem 6rem",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
          gap: "1.25rem",
        }}
      >
        {agents.map((agent) => (
          <Link
            key={agent.slug}
            href={`/agent/${agent.slug}`}
            style={{ textDecoration: "none" }}
          >
            <div
              style={{
                position: "relative",
                padding: "1.75rem",
                borderRadius: 20,
                background: "#121214",
                border: "1px solid rgba(255,255,255,0.05)",
                cursor: "pointer",
                transition: "border-color 0.2s, transform 0.15s, box-shadow 0.2s",
                overflow: "hidden",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLDivElement).style.borderColor = `${agent.color}40`;
                (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)";
                (e.currentTarget as HTMLDivElement).style.boxShadow = `0 8px 32px ${agent.color}10`;
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(255,255,255,0.05)";
                (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
                (e.currentTarget as HTMLDivElement).style.boxShadow = "none";
              }}
            >
              {/* Top color line */}
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  height: 2,
                  background: `linear-gradient(90deg, transparent, ${agent.color}, transparent)`,
                }}
              />

              {/* Arrow */}
              <div
                style={{
                  position: "absolute",
                  top: "1.5rem",
                  right: "1.5rem",
                  color: "#374151",
                  fontSize: "1.1rem",
                }}
              >
                →
              </div>

              {/* Icon */}
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 14,
                  background: `${agent.color}18`,
                  border: `1px solid ${agent.color}30`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "1.6rem",
                  marginBottom: "1.25rem",
                }}
              >
                {agent.icon}
              </div>

              {/* Name & title */}
              <div
                style={{
                  fontWeight: 800,
                  fontSize: "1.1rem",
                  color: "#ffffff",
                  marginBottom: "0.2rem",
                }}
              >
                {agent.name}
              </div>
              <div
                style={{
                  fontSize: "0.72rem",
                  color: "#6b7280",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  marginBottom: "0.85rem",
                }}
              >
                {agent.title}
              </div>

              {/* Description */}
              <p
                style={{
                  fontSize: "0.9rem",
                  color: "#9ca3af",
                  lineHeight: 1.6,
                  marginBottom: "1.25rem",
                }}
              >
                {agent.description}
              </p>

              {/* Capability tags */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                {agent.capabilities.map((cap) => (
                  <span
                    key={cap}
                    style={{
                      fontSize: "0.75rem",
                      padding: "0.25rem 0.65rem",
                      borderRadius: 6,
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.06)",
                      color: "#6b7280",
                    }}
                  >
                    {cap}
                  </span>
                ))}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
