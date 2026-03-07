"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export const dynamic = "force-dynamic";

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const params = useSearchParams();
  const redirectTo = params.get("redirectTo") || "/dashboard";

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError("Fel e-post eller lösenord. Försök igen.");
      setLoading(false);
    } else {
      router.push(redirectTo);
      router.refresh();
    }
  }

  return (
    <div style={{ width: "100%", maxWidth: 400 }}>
      <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
        <div style={{ fontSize: "2rem", marginBottom: "0.75rem" }}>🚀</div>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 900, color: "#fff", marginBottom: "0.4rem" }}>Logga in</h1>
        <p style={{ color: "#6b7280", fontSize: "0.9rem" }}>Ditt AI-marknadsföringsteam väntar</p>
      </div>

      <form onSubmit={handleLogin} style={{ background: "#111113", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 20, padding: "2rem" }}>
        <Field label="E-post" type="email" value={email} onChange={setEmail} placeholder="din@email.se" />
        <Field label="Lösenord" type="password" value={password} onChange={setPassword} placeholder="••••••••" />

        {error && (
          <div style={{ marginBottom: "1.25rem", padding: "0.75rem 1rem", borderRadius: 10, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171", fontSize: "0.85rem" }}>
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !email || !password}
          style={{ width: "100%", padding: "0.85rem", borderRadius: 12, background: loading ? "rgba(99,102,241,0.4)" : "#6366f1", border: "none", color: "#fff", fontWeight: 700, fontSize: "0.95rem", cursor: loading ? "not-allowed" : "pointer", transition: "background 0.15s" }}
        >
          {loading ? "Loggar in..." : "Logga in"}
        </button>

        <p style={{ textAlign: "center", marginTop: "1.25rem", fontSize: "0.85rem", color: "#6b7280" }}>
          Inget konto?{" "}
          <Link href="/auth/signup" style={{ color: "#a5b4fc", textDecoration: "none", fontWeight: 600 }}>
            Skapa konto
          </Link>
        </p>
      </form>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0b", display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
      <Suspense fallback={<div style={{ color: "#6b7280" }}>Laddar…</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}

function Field({ label, type, value, onChange, placeholder }: { label: string; type: string; value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div style={{ marginBottom: "1.25rem" }}>
      <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#9ca3af", marginBottom: "0.4rem" }}>{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required
        style={{ width: "100%", padding: "0.75rem 1rem", borderRadius: 10, background: "#1a1a1e", border: "1px solid rgba(255,255,255,0.08)", color: "#f3f4f6", fontSize: "0.9rem", outline: "none", boxSizing: "border-box" }}
      />
    </div>
  );
}
