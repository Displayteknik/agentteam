import Link from "next/link";

export default function ConfirmPage() {
  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0b", display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
      <div style={{ width: "100%", maxWidth: 420, textAlign: "center" }}>
        <div style={{ fontSize: "3rem", marginBottom: "1.25rem" }}>📬</div>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 900, color: "#fff", marginBottom: "0.75rem" }}>Kolla din e-post</h1>
        <p style={{ color: "#9ca3af", fontSize: "0.95rem", lineHeight: 1.7, marginBottom: "2rem" }}>
          Vi har skickat en bekräftelselänk till din e-postadress. Klicka på länken för att aktivera ditt konto och komma igång.
        </p>
        <p style={{ color: "#6b7280", fontSize: "0.85rem" }}>
          Ser du inget mejl? Kolla skräppost.
        </p>
        <div style={{ marginTop: "2rem" }}>
          <Link href="/auth/login" style={{ color: "#a5b4fc", textDecoration: "none", fontSize: "0.9rem", fontWeight: 600 }}>
            ← Tillbaka till inloggning
          </Link>
        </div>
      </div>
    </div>
  );
}
