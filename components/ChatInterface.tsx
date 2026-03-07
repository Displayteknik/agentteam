"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Agent } from "@/lib/agents";

interface Message {
  role: "user" | "assistant";
  content: string;
}

function renderMarkdown(text: string): string {
  return text
    // Code blocks
    .replace(/```(\w*)\n?([\s\S]*?)```/g, "<pre><code>$2</code></pre>")
    // Inline code
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    // Bold
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    // Italic
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    // H1
    .replace(/^# (.+)$/gm, "<h1>$1</h1>")
    // H2
    .replace(/^## (.+)$/gm, "<h2>$1</h2>")
    // H3
    .replace(/^### (.+)$/gm, "<h3>$1</h3>")
    // H4
    .replace(/^#### (.+)$/gm, "<h4>$1</h4>")
    // Horizontal rule
    .replace(/^---$/gm, "<hr>")
    // Blockquote
    .replace(/^> (.+)$/gm, "<blockquote>$1</blockquote>")
    // Unordered list items
    .replace(/^[-*] (.+)$/gm, "<li>$1</li>")
    // Ordered list items
    .replace(/^\d+\. (.+)$/gm, "<li>$1</li>")
    // Wrap consecutive <li> in <ul>
    .replace(/(<li>[\s\S]*?<\/li>)(\n<li>)/g, "$1$2")
    // Tables (basic)
    .replace(
      /\|(.+)\|\n\|[-| :]+\|\n((?:\|.+\|\n?)+)/g,
      (_, header, rows) => {
        const headers = header
          .split("|")
          .filter(Boolean)
          .map((h: string) => `<th>${h.trim()}</th>`)
          .join("");
        const bodyRows = rows
          .trim()
          .split("\n")
          .map((row: string) => {
            const cells = row
              .split("|")
              .filter(Boolean)
              .map((c: string) => `<td>${c.trim()}</td>`)
              .join("");
            return `<tr>${cells}</tr>`;
          })
          .join("");
        return `<table><thead><tr>${headers}</tr></thead><tbody>${bodyRows}</tbody></table>`;
      }
    )
    // Double newline → paragraph break
    .replace(/\n\n/g, "</p><p>")
    // Single newline
    .replace(/\n/g, "<br>");
}

export default function ChatInterface({ agent }: { agent: Agent }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  }, [input]);

  const sendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    const userMessage: Message = { role: "user", content: trimmed };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");
    setIsLoading(true);

    const assistantIndex = updatedMessages.length;
    setMessages([...updatedMessages, { role: "assistant", content: "" }]);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const endpoint = agent.isOrchestrator ? "/api/orchestrate" : "/api/chat";
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedMessages,
          agentSlug: agent.slug,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(errText || "API error");
      }

      if (!response.body) throw new Error("No stream");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(value, { stream: true });
        setMessages((prev) => {
          const updated = [...prev];
          updated[assistantIndex] = {
            role: "assistant",
            content: accumulated,
          };
          return updated;
        });
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") return;
      const msg =
        err instanceof Error
          ? err.message
          : "Något gick fel. Försök igen.";
      setMessages((prev) => {
        const updated = [...prev];
        updated[assistantIndex] = { role: "assistant", content: `⚠️ ${msg}` };
        return updated;
      });
    } finally {
      setIsLoading(false);
      abortRef.current = null;
    }
  };

  const stopGeneration = () => {
    abortRef.current?.abort();
    setIsLoading(false);
  };

  const clearChat = () => {
    setMessages([]);
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "calc(100vh - 64px)",
      }}
    >
      {/* ─── Messages ─── */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "1.5rem 1rem",
        }}
      >
        <div style={{ maxWidth: 760, margin: "0 auto" }}>
          {/* Welcome */}
          {messages.length === 0 && (
            <div style={{ textAlign: "center", padding: "4rem 1rem 2rem" }}>
              <div
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: 20,
                  background: `${agent.color}18`,
                  border: `1px solid ${agent.color}30`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "2rem",
                  margin: "0 auto 1.25rem",
                }}
              >
                {agent.icon}
              </div>
              <h2
                style={{
                  fontSize: "1.4rem",
                  fontWeight: 800,
                  color: "#ffffff",
                  marginBottom: "0.5rem",
                }}
              >
                {agent.isOrchestrator ? "Projektledaren" : `Hej! Jag är ${agent.name}`}
              </h2>
              <p
                style={{
                  color: "#9ca3af",
                  fontSize: "0.95rem",
                  maxWidth: agent.isOrchestrator ? 560 : 440,
                  margin: "0 auto 1.5rem",
                  lineHeight: 1.6,
                }}
              >
                {agent.isOrchestrator
                  ? "Beskriv ditt projekt eller kampanj. Jag analyserar vad som behövs, aktiverar rätt specialister ur teamet och levererar ett komplett marknadsföringspaket — automatiskt."
                  : agent.description}
              </p>
              {agent.isOrchestrator && (
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "0.5rem",
                    justifyContent: "center",
                    marginBottom: "1.25rem",
                  }}
                >
                  {["🎯 Strategen", "✍️ Copywritern", "📈 SEO-Experten", "📱 SoMe-Managern", "💰 Annons-Specialisten", "📊 Data-Analytikern"].map((name) => (
                    <span
                      key={name}
                      style={{
                        fontSize: "0.8rem",
                        padding: "0.3rem 0.75rem",
                        borderRadius: 8,
                        background: "rgba(249,115,22,0.08)",
                        border: "1px solid rgba(249,115,22,0.2)",
                        color: "#fb923c",
                      }}
                    >
                      {name}
                    </span>
                  ))}
                </div>
              )}
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "0.5rem",
                  justifyContent: "center",
                }}
              >
                {!agent.isOrchestrator && agent.capabilities.map((cap) => (
                  <span
                    key={cap}
                    style={{
                      fontSize: "0.8rem",
                      padding: "0.3rem 0.75rem",
                      borderRadius: 8,
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.07)",
                      color: "#9ca3af",
                    }}
                  >
                    {cap}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Messages list */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            {messages.map((msg, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  gap: "0.75rem",
                  justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
                  alignItems: "flex-start",
                }}
              >
                {/* Agent avatar */}
                {msg.role === "assistant" && (
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
                      flexShrink: 0,
                      marginTop: 2,
                    }}
                  >
                    {agent.icon}
                  </div>
                )}

                {/* Bubble */}
                <div
                  style={{
                    maxWidth: msg.role === "assistant" && agent.isOrchestrator ? "100%" : "82%",
                    borderRadius: msg.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                    padding: "0.9rem 1.1rem",
                    background:
                      msg.role === "user"
                        ? "#6366f1"
                        : "#161618",
                    border: msg.role === "user" ? "none" : "1px solid rgba(255,255,255,0.06)",
                    fontSize: "0.92rem",
                    lineHeight: 1.65,
                  }}
                >
                  {msg.role === "user" ? (
                    <p style={{ color: "#ffffff", margin: 0, whiteSpace: "pre-wrap" }}>
                      {msg.content}
                    </p>
                  ) : (
                    <div
                      className="prose-agent"
                      dangerouslySetInnerHTML={{
                        __html: msg.content
                          ? renderMarkdown(msg.content)
                          : "",
                      }}
                    />
                  )}
                  {/* Streaming cursor */}
                  {isLoading &&
                    msg.role === "assistant" &&
                    i === messages.length - 1 && (
                      <span className="cursor-blink" />
                    )}
                </div>

                {/* User avatar */}
                {msg.role === "user" && (
                  <div
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 10,
                      background: "rgba(99,102,241,0.2)",
                      border: "1px solid rgba(99,102,241,0.3)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "0.8rem",
                      fontWeight: 700,
                      color: "#a5b4fc",
                      flexShrink: 0,
                      marginTop: 2,
                    }}
                  >
                    Du
                  </div>
                )}
              </div>
            ))}
          </div>

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* ─── Input bar ─── */}
      <div
        style={{
          borderTop: "1px solid rgba(255,255,255,0.05)",
          background: "#0d0d0f",
          padding: "1rem",
          flexShrink: 0,
        }}
      >
        <div style={{ maxWidth: 760, margin: "0 auto" }}>
          {/* Controls row */}
          {messages.length > 0 && (
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                marginBottom: "0.5rem",
                gap: "0.75rem",
              }}
            >
              <button
                onClick={clearChat}
                style={{
                  fontSize: "0.78rem",
                  color: "#6b7280",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: "0 0.25rem",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#9ca3af")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "#6b7280")}
              >
                Rensa chat
              </button>
            </div>
          )}

          {/* Input box */}
          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              gap: "0.75rem",
              background: "#1a1a1e",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 16,
              padding: "0.75rem 1rem",
              transition: "border-color 0.15s",
            }}
            onFocus={(e) =>
              ((e.currentTarget as HTMLDivElement).style.borderColor =
                "rgba(99,102,241,0.4)")
            }
            onBlur={(e) =>
              ((e.currentTarget as HTMLDivElement).style.borderColor =
                "rgba(255,255,255,0.08)")
            }
          >
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={agent.placeholder}
              rows={1}
              disabled={isLoading}
              style={{
                flex: 1,
                background: "transparent",
                border: "none",
                outline: "none",
                color: "#f3f4f6",
                fontSize: "0.92rem",
                resize: "none",
                fontFamily: "inherit",
                lineHeight: 1.55,
              }}
            />

            {/* Stop / Send button */}
            {isLoading ? (
              <button
                onClick={stopGeneration}
                title="Stoppa"
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: "rgba(239,68,68,0.15)",
                  border: "1px solid rgba(239,68,68,0.3)",
                  color: "#f87171",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  flexShrink: 0,
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="4" y="4" width="16" height="16" rx="2" />
                </svg>
              </button>
            ) : (
              <button
                onClick={sendMessage}
                disabled={!input.trim()}
                title="Skicka (Enter)"
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: input.trim() ? "#6366f1" : "rgba(99,102,241,0.2)",
                  border: "none",
                  color: input.trim() ? "#ffffff" : "rgba(255,255,255,0.2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: input.trim() ? "pointer" : "not-allowed",
                  flexShrink: 0,
                  transition: "background 0.15s",
                }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </button>
            )}
          </div>

          <p
            style={{
              textAlign: "center",
              fontSize: "0.72rem",
              color: "#374151",
              marginTop: "0.5rem",
            }}
          >
            {agent.isOrchestrator
              ? "Enter = skicka · Shift+Enter = ny rad · Orkestratorn tar 30–60 sek"
              : "Enter = skicka · Shift+Enter = ny rad"}
          </p>
        </div>
      </div>
    </div>
  );
}
