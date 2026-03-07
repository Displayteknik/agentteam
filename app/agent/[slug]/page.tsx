"use client";

import { getAgent } from "@/lib/agents";
import ChatInterface from "@/components/ChatInterface";
import Link from "next/link";
import { notFound } from "next/navigation";

export default function AgentPage({
  params,
}: {
  params: { slug: string };
}) {
  const agent = getAgent(params.slug);
  if (!agent) notFound();

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0a0a0b",
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
          flexShrink: 0,
          position: "sticky",
          top: 0,
          zIndex: 50,
        }}
      >
        <div
          style={{
            maxWidth: 1100,
            margin: "0 auto",
            padding: "0 1.25rem",
            height: 64,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "1rem",
          }}
        >
          {/* Left: back + agent identity */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.9rem" }}>
            <Link
              href="/"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.35rem",
                color: "#6b7280",
                textDecoration: "none",
                fontSize: "0.85rem",
                fontWeight: 500,
                transition: "color 0.15s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#ffffff")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#6b7280")}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="15 18 9 12 15 6" />
              </svg>
              Alla agenter
            </Link>

            <span
              style={{
                width: 1,
                height: 18,
                background: "rgba(255,255,255,0.08)",
              }}
            />

            {/* Agent badge */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 10,
                  background: `${agent.color}18`,
                  border: `1px solid ${agent.color}30`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "1rem",
                }}
              >
                {agent.icon}
              </div>
              <div>
                <div
                  style={{
                    fontWeight: 700,
                    fontSize: "0.9rem",
                    color: "#ffffff",
                    lineHeight: 1.2,
                  }}
                >
                  {agent.name}
                </div>
                <div
                  style={{
                    fontSize: "0.72rem",
                    color: "#6b7280",
                  }}
                >
                  {agent.title}
                </div>
              </div>
            </div>
          </div>

          {/* Right: online status */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
              fontSize: "0.78rem",
              color: "#6b7280",
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
            Online
          </div>
        </div>
      </header>

      {/* Chat */}
      <ChatInterface agent={agent} />
    </div>
  );
}
