"use client";

import Link from "next/link";

const agents = [
  {
    slug: "projektledaren",
    icon: "🚀",
    color: "#f97316",
    name: "Projektledaren",
    badge: "HELA TEAMET",
    what: "Koordinerar hela teamet automatiskt. Du beskriver ett projekt — han bestämmer vilka specialister som behövs, briefar dem och levererar ett komplett paket.",
    when: [
      "Lansering av ny tjänst eller produkt",
      "Komplett marknadsföringskampanj",
      "Du vill ha allt — strategi, texter, inlägg och annonser på en gång",
      "Du vet inte var du ska börja",
    ],
    examples: [
      "Jag lanserar en onlinekurs om löneförhandling för ingenjörer i september. Budget 15 000 kr i ads. Jag behöver allt — strategi, texter, SoMe-innehåll och annonskampanj.",
      "Mitt städföretag i Göteborg vill växa. Vi omsätter 2 miljoner och vill nå 4 miljoner på 18 månader. Hjälp mig med hela marknadsföringen.",
    ],
    tip: "Ge så mycket kontext som möjligt — bransch, målgrupp, pris, mål. Projektledaren tar 30–60 sekunder men levererar vad som annars tar en dag.",
    isOrchestrator: true,
  },
  {
    slug: "strategen",
    icon: "🎯",
    color: "#6366f1",
    name: "Strategen",
    badge: "STRATEGI",
    what: "Din virtuella marknadschef. Sätter mål, skapar planer och analyserar marknaden. Ger dig konkreta steg med tidsramar och ansvar.",
    when: [
      "Du inte vet hur du ska växa ditt företag",
      "Du ska lansera något nytt",
      "Du vill förstå dina konkurrenter",
      "Du behöver sätta mätbara mål (KPI:er)",
    ],
    examples: [
      "Jag driver en redovisningsbyrå i Malmö med 5 anställda. Omsättning 3 miljoner. Jag vill växa 40% nästa år. Vad är min marknadsföringsstrategi?",
      "Jag ska lansera en PT-coaching online för mammor 30–45. Pris: 1 990 kr/mån. Hur positionerar jag mig och vad är min go-to-market-plan?",
    ],
    tip: "Berätta nuläget (omsättning, storlek, marknad) och vad du vill uppnå. Ju mer data, desto mer konkret plan.",
  },
  {
    slug: "copywritern",
    icon: "✍️",
    color: "#8b5cf6",
    name: "Copywritern",
    badge: "TEXTER",
    what: "Skriver alla dina texter — färdiga, redo att klistra in och använda direkt. Inte råd om hur man skriver, utan faktiska texter.",
    when: [
      "Du behöver ett mejl till dina kunder",
      "Du ska skriva en landningssida",
      "Du vill ha ett blogginlägg",
      "Du behöver text till en annons",
      "Du ska skriva en säljande produktbeskrivning",
    ],
    examples: [
      "Skriv ett välkomstmejl till nya kunder som köpt min onlinekurs om tidsstyrning. Ton: varm och uppmuntrande.",
      "Skriv en landningssida för min juridiska tjänst — avtalsgranskning för startups. Pris: 4 500 kr. Målgrupp: grundare 25–40.",
    ],
    tip: "Säg alltid: vem är kunden, vad kostar produkten, och vilken ton vill du ha (varm/direkt/professionell/rolig). Första svaret är ett utkast — be om justeringar.",
  },
  {
    slug: "seo-experten",
    icon: "📈",
    color: "#06b6d4",
    name: "SEO-Experten",
    badge: "GOOGLE",
    what: "Hjälper dig synas gratis på Google. Sökordsanalys, optimering av befintliga sidor och strategier för att ranka högt.",
    when: [
      "Du vill veta vilka sökord du ska använda",
      "Du ska optimera en sida på din webbplats",
      "Du vill skriva ett blogginlägg som rankar på Google",
      "Du undrar varför du inte syns när folk söker på ditt område",
    ],
    examples: [
      "Jag driver en hunddagis i Stockholm. Vilka sökord ska jag fokusera på? Ge mig en tabell med sökord, volym och sökintention.",
      "Här är texten på min tjänstesida om bokföring: [klistra in text]. Optimera den för SEO och ge mig ny title tag och meta description.",
    ],
    tip: "SEO tar 3–6 månader att se resultat. Men om du gör det nu är det gratis trafik för alltid. Börja med 3–5 sökord och en sida i taget.",
  },
  {
    slug: "some-managern",
    icon: "📱",
    color: "#ec4899",
    name: "SoMe-Managern",
    badge: "SOCIALA MEDIER",
    what: "Skapar färdiga inlägg för LinkedIn, Instagram och Facebook — komplett med hashtags, bästa publiceringstid och call-to-action.",
    when: [
      "Du inte vet vad du ska posta den här veckan",
      "Du behöver en innehållskalender",
      "Du vill ha LinkedIn-inlägg som positionerar dig som expert",
      "Du ska starta upp din Instagram",
    ],
    examples: [
      "Ge mig 5 LinkedIn-inlägg för en konsult inom ledarskap. Målgrupp: VD:ar på 10–50 personsföretag. Ton: professionell men mänsklig.",
      "Skapa en innehållskalender för Instagram för oktober. 3 inlägg/vecka. Bransch: hälsokost. Mix av tips, produkter och bakomkulisserna.",
    ],
    tip: "Be om varierade format — ett inspirerande, ett utbildande, ett som säljer. Håll en konsekvent ton genom hela kalendern.",
  },
  {
    slug: "annons-specialisten",
    icon: "💰",
    color: "#f59e0b",
    name: "Annons-Specialisten",
    badge: "BETALDA ADS",
    what: "Planerar och optimerar Google Ads och Meta Ads (Facebook/Instagram). Ger dig färdiga annonstexter, kampanjstrukturer och budgetstrategi.",
    when: [
      "Du ska starta en annonskampanj",
      "Du vill ha färdiga annonstexter att ladda upp",
      "Du undrar hur du ska fördela din budget",
      "Dina annonser visas men ingen klickar",
    ],
    examples: [
      "Jag ska köra Meta Ads för min onlinekurs om ekonomi för frilansare. Pris: 1 490 kr. Budget: 5 000 kr/mån. Skriv 3 annonsvarianter för A/B-test. Målgrupp: egenföretagare 25–45.",
      "Bygg en Google Ads-kampanj för ett rörmokeri i Göteborg. Sök-kampanj. Budget 8 000 kr/mån. Ge mig kampanjstruktur och annonstexter.",
    ],
    tip: "Ange alltid: produkt/tjänst, pris, budget, målgrupp och geografi. Annons-Specialisten ger dig allt redo att kopiera rakt in i Meta Business Manager eller Google Ads.",
  },
  {
    slug: "data-analytikern",
    icon: "📊",
    color: "#10b981",
    name: "Data-Analytikern",
    badge: "ANALYS",
    what: "Förklarar vad din data BETYDER — inte bara siffrorna, utan vad du ska göra härnäst baserat på dem.",
    when: [
      "Du har siffror från Google Analytics du inte förstår",
      "Du vill veta vad som fungerar på din webbplats",
      "Du undrar varför din konverteringsgrad är låg",
      "Du ska presentera marknadsföringsresultat",
    ],
    examples: [
      "Här är data från min webbplats förra månaden: 3 200 besökare, bounce rate 74%, snittid 1:12, 8 köp. Vad berättar det och vad prioriterar jag?",
      "Mina Google Ads kostar 12 kr/klick, CPA 890 kr, produkten kostar 2 500 kr. Är det lönsamt och hur optimerar jag?",
    ],
    tip: "Klistra in dina siffror direkt i chatten. Analytikern läser rå data — Google Analytics-export, Excel-tabeller, siffror från Meta Ads — och förklarar vad de betyder.",
  },
];

const tips = [
  {
    icon: "📝",
    title: "Var specifik",
    body: 'Skriv: "Jag säljer X till Y som kostar Z" — inte bara "hjälp med marknadsföring". Specifik input → specifikt svar.',
  },
  {
    icon: "🔄",
    title: "Fortsätt konversationen",
    body: 'Första svaret är ett utkast. Skriv "gör om stycke 2, mer aggressiv ton" eller "ge mig 3 alternativ till". Svaret förbättras för varje runda.',
  },
  {
    icon: "📋",
    title: "Kopiera direkt",
    body: "Svaren är redo att klistra in i ditt CRM, din scheduler, Google Ads eller Meta. Du behöver inte skriva om något — bara justera namn och specifika detaljer.",
  },
  {
    icon: "🧩",
    title: "Ta output från en agent till en annan",
    body: "Klistra in Strategens plan i Copywriterns chatt som bakgrundsinformation. Resultaten blir bättre när agenterna jobbar på samma underlag.",
  },
  {
    icon: "⚠️",
    title: "Stäng inte midt i ett jobb",
    body: "Varje agent minns bara den nuvarande chatten. Slutför ett uppdrag i en session och kopiera resultatet innan du stänger.",
  },
  {
    icon: "🚀",
    title: "Använd Projektledaren för helheten",
    body: "Har du ett stort projekt — lansering, kampanj, ny tjänst — ge det till Projektledaren. Han koordinerar hela teamet automatiskt.",
  },
];

export default function DocsPage() {
  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0b", color: "#f3f4f6", fontFamily: "inherit" }}>

      {/* ── Header ── */}
      <header style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", background: "rgba(10,10,11,0.97)", backdropFilter: "blur(12px)", position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 900, margin: "0 auto", padding: "0 1.5rem", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: "0.4rem", color: "#6b7280", textDecoration: "none", fontSize: "0.85rem", fontWeight: 500 }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#fff")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#6b7280")}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Tillbaka till teamet
          </Link>
          <span style={{ fontSize: "0.8rem", color: "#374151", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" }}>Dokumentation</span>
        </div>
      </header>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "3rem 1.5rem 6rem" }}>

        {/* ── Hero ── */}
        <div style={{ textAlign: "center", marginBottom: "4rem" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", padding: "0.35rem 1rem", borderRadius: 99, background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.2)", color: "#a5b4fc", fontSize: "0.8rem", fontWeight: 600, marginBottom: "1.5rem" }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#10b981", display: "inline-block" }} />
            7 agenter online
          </div>
          <h1 style={{ fontSize: "clamp(1.8rem, 4vw, 2.8rem)", fontWeight: 900, color: "#fff", letterSpacing: "-0.02em", lineHeight: 1.1, marginBottom: "1rem" }}>
            Hur du använder ditt<br />AI-marknadsföringsteam
          </h1>
          <p style={{ fontSize: "1.05rem", color: "#9ca3af", maxWidth: 520, margin: "0 auto", lineHeight: 1.7 }}>
            Du har 7 AI-specialister som jobbar för dig dygnet runt. Den här guiden visar exakt vad varje specialist gör och hur du får bästa möjliga resultat.
          </p>
        </div>

        {/* ── Quick start ── */}
        <section style={{ marginBottom: "4rem" }}>
          <SectionTitle>Kom igång på 3 steg</SectionTitle>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1rem" }}>
            {[
              { step: "1", title: "Välj specialist", body: "Klicka på den specialist du behöver — eller välj Projektledaren för att aktivera hela teamet på en gång." },
              { step: "2", title: "Beskriv uppdraget", body: 'Skriv vad du behöver. Var specifik: berätta vem din kund är, vad du säljer och vad du vill uppnå.' },
              { step: "3", title: "Kopiera och använd", body: "Svaren är redo att klistra in direkt. Jobba vidare i chatten om du vill justera eller förfina." },
            ].map(({ step, title, body }) => (
              <div key={step} style={{ padding: "1.5rem", borderRadius: 16, background: "#111113", border: "1px solid rgba(255,255,255,0.05)" }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.25)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, color: "#a5b4fc", fontSize: "0.95rem", marginBottom: "0.9rem" }}>{step}</div>
                <div style={{ fontWeight: 700, color: "#fff", marginBottom: "0.4rem" }}>{title}</div>
                <div style={{ fontSize: "0.88rem", color: "#9ca3af", lineHeight: 1.6 }}>{body}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Formula ── */}
        <section style={{ marginBottom: "4rem" }}>
          <SectionTitle>Formeln för bra svar</SectionTitle>
          <div style={{ padding: "1.75rem 2rem", borderRadius: 16, background: "#111113", border: "1px solid rgba(255,255,255,0.05)", marginBottom: "1rem" }}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", alignItems: "center", marginBottom: "1.25rem" }}>
              {["VEM du är", "+", "VAD du säljer", "+", "TILL VEM", "+", "VAD du behöver"].map((part, i) => (
                <span key={i} style={part === "+" ? { color: "#374151", fontWeight: 700, fontSize: "1.2rem" } : { padding: "0.3rem 0.8rem", borderRadius: 8, background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.2)", color: "#a5b4fc", fontSize: "0.85rem", fontWeight: 600 }}>
                  {part}
                </span>
              ))}
            </div>
            <div style={{ display: "grid", gap: "0.75rem" }}>
              <ExampleBox bad label="❌ För vagt">
                Skriv ett Instagram-inlägg.
              </ExampleBox>
              <ExampleBox good label="✅ Bra fråga">
                Jag är personlig tränare i Stockholm. Jag säljer onlineträning för 1 500 kr/mån till män 30–50 som sitter på kontor och vill bli starka. Skriv 3 Instagram-inlägg denna vecka — ett inspirerande, ett med kundresultat och ett som säljer direkt. Ton: rak och motiverande.
              </ExampleBox>
            </div>
          </div>
        </section>

        {/* ── Agents ── */}
        <section style={{ marginBottom: "4rem" }}>
          <SectionTitle>Dina 7 specialister</SectionTitle>
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            {agents.map((agent) => (
              <div key={agent.slug} style={{ borderRadius: 18, background: "#111113", border: `1px solid ${agent.isOrchestrator ? "rgba(249,115,22,0.2)" : "rgba(255,255,255,0.05)"}`, overflow: "hidden" }}>
                {/* Top accent line */}
                <div style={{ height: 2, background: `linear-gradient(90deg, transparent, ${agent.color}, transparent)` }} />

                <div style={{ padding: "1.5rem" }}>
                  {/* Header row */}
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "1rem", marginBottom: "1.25rem", flexWrap: "wrap" }}>
                    <div style={{ width: 52, height: 52, borderRadius: 14, background: `${agent.color}18`, border: `1px solid ${agent.color}30`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.5rem", flexShrink: 0 }}>
                      {agent.icon}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.3rem", flexWrap: "wrap" }}>
                        <span style={{ fontWeight: 800, fontSize: "1.05rem", color: "#fff" }}>{agent.name}</span>
                        <span style={{ fontSize: "0.65rem", padding: "0.15rem 0.55rem", borderRadius: 99, background: `${agent.color}18`, border: `1px solid ${agent.color}30`, color: agent.color, fontWeight: 700, letterSpacing: "0.07em" }}>{agent.badge}</span>
                      </div>
                      <p style={{ fontSize: "0.88rem", color: "#9ca3af", margin: 0, lineHeight: 1.55 }}>{agent.what}</p>
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "1rem" }}>
                    {/* When to use */}
                    <div>
                      <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.6rem" }}>Använd när du</div>
                      <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                        {agent.when.map((w, i) => (
                          <li key={i} style={{ display: "flex", gap: "0.5rem", fontSize: "0.85rem", color: "#9ca3af", lineHeight: 1.4 }}>
                            <span style={{ color: agent.color, flexShrink: 0, marginTop: 1 }}>›</span>
                            {w}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Examples */}
                    <div>
                      <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.6rem" }}>Exempeluppdrag</div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                        {agent.examples.map((ex, i) => (
                          <div key={i} style={{ padding: "0.65rem 0.9rem", borderRadius: 10, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)", fontSize: "0.82rem", color: "#d1d5db", lineHeight: 1.5, fontStyle: "italic" }}>
                            "{ex}"
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Tip */}
                  <div style={{ marginTop: "1rem", padding: "0.75rem 1rem", borderRadius: 10, background: `${agent.color}08`, border: `1px solid ${agent.color}15`, fontSize: "0.82rem", color: "#9ca3af", lineHeight: 1.5 }}>
                    <span style={{ color: agent.color, fontWeight: 700 }}>💡 Tips: </span>{agent.tip}
                  </div>

                  {/* CTA */}
                  <div style={{ marginTop: "1rem" }}>
                    <Link href={`/agent/${agent.slug}`} style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", padding: "0.5rem 1rem", borderRadius: 10, background: `${agent.color}18`, border: `1px solid ${agent.color}30`, color: agent.color, fontSize: "0.82rem", fontWeight: 600, textDecoration: "none" }}
                      onMouseEnter={(e) => ((e.currentTarget as HTMLAnchorElement).style.background = `${agent.color}25`)}
                      onMouseLeave={(e) => ((e.currentTarget as HTMLAnchorElement).style.background = `${agent.color}18`)}>
                      Öppna {agent.name} →
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Tips ── */}
        <section style={{ marginBottom: "4rem" }}>
          <SectionTitle>6 tips för bättre resultat</SectionTitle>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "1rem" }}>
            {tips.map((tip) => (
              <div key={tip.title} style={{ padding: "1.25rem", borderRadius: 14, background: "#111113", border: "1px solid rgba(255,255,255,0.05)" }}>
                <div style={{ fontSize: "1.4rem", marginBottom: "0.6rem" }}>{tip.icon}</div>
                <div style={{ fontWeight: 700, color: "#fff", marginBottom: "0.4rem", fontSize: "0.92rem" }}>{tip.title}</div>
                <div style={{ fontSize: "0.84rem", color: "#9ca3af", lineHeight: 1.6 }}>{tip.body}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Quick reference ── */}
        <section style={{ marginBottom: "4rem" }}>
          <SectionTitle>Snabbreferens — Vem frågar du om vad?</SectionTitle>
          <div style={{ borderRadius: 16, background: "#111113", border: "1px solid rgba(255,255,255,0.05)", overflow: "hidden" }}>
            {[
              { need: "Marknadsplan eller strategi", agent: "🎯 Strategen" },
              { need: "Förstå konkurrenter", agent: "🎯 Strategen" },
              { need: "Sätta mål och KPI:er", agent: "🎯 Strategen" },
              { need: "Skriva ett mejl", agent: "✍️ Copywritern" },
              { need: "Text till webbplatsen", agent: "✍️ Copywritern" },
              { need: "Blogginlägg", agent: "✍️ Copywritern" },
              { need: "Annonstext (copy)", agent: "✍️ Copywritern" },
              { need: "Synas på Google", agent: "📈 SEO-Experten" },
              { need: "Veta vilka sökord att använda", agent: "📈 SEO-Experten" },
              { need: "Optimera en sida", agent: "📈 SEO-Experten" },
              { need: "LinkedIn- och Instagram-inlägg", agent: "📱 SoMe-Managern" },
              { need: "Innehållskalender", agent: "📱 SoMe-Managern" },
              { need: "Hashtag-strategi", agent: "📱 SoMe-Managern" },
              { need: "Starta Google Ads eller Meta Ads", agent: "💰 Annons-Specialisten" },
              { need: "Förstå varför annonser inte funkar", agent: "💰 Annons-Specialisten" },
              { need: "Förstå webbplatsdata", agent: "📊 Data-Analytikern" },
              { need: "Vad mina siffror betyder", agent: "📊 Data-Analytikern" },
              { need: "Hela marknadsföringen på en gång", agent: "🚀 Projektledaren" },
            ].map((row, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.75rem 1.25rem", borderBottom: i < 17 ? "1px solid rgba(255,255,255,0.04)" : "none", gap: "1rem", flexWrap: "wrap" }}>
                <span style={{ fontSize: "0.88rem", color: "#9ca3af" }}>{row.need}</span>
                <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "#fff", flexShrink: 0 }}>{row.agent}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ── FAQ ── */}
        <section style={{ marginBottom: "4rem" }}>
          <SectionTitle>Vanliga frågor</SectionTitle>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {[
              { q: "Minns agenterna vad jag sagt tidigare?", a: "Bara under pågående chatt. Stänger du fönstret börjar de om från noll. Kopiera viktiga svar innan du stänger." },
              { q: "Kan jag jobba vidare på ett svar?", a: 'Ja — fortsätt chatten. Skriv "gör om stycke 2 med mer aggressiv ton" eller "ge mig 3 varianter av det sista stycket". Svaret förbättras i varje runda.' },
              { q: "Varför tar Projektledaren längre tid?", a: "Han aktiverar 2–5 specialister som jobbar parallellt. Det tar 30–60 sekunder men du får ett komplett paket som annars skulle ta timmar." },
              { q: "Kan jag använda agenterna på engelska?", a: "Ja. Skriv på engelska och de svarar på engelska. Systemet är optimerat för svenska men hanterar alla stora språk." },
              { q: "Hur specifik behöver jag vara?", a: "Ju mer desto bättre. Bransch, målgrupp, pris och mål ger mycket bättre svar än vaga frågor. Men du kan alltid börja enkelt och be om mer." },
              { q: "Kan jag klistra in svaren direkt?", a: "Ja. Texterna är redo att använda. Kolla att namn, priser och specifika detaljer stämmer — det är allt du behöver justera." },
            ].map(({ q, a }, i) => (
              <div key={i} style={{ padding: "1.1rem 1.25rem", borderRadius: 12, background: "#111113", border: "1px solid rgba(255,255,255,0.05)" }}>
                <div style={{ fontWeight: 700, color: "#fff", marginBottom: "0.4rem", fontSize: "0.9rem" }}>{q}</div>
                <div style={{ fontSize: "0.86rem", color: "#9ca3af", lineHeight: 1.6 }}>{a}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ── CTA ── */}
        <div style={{ textAlign: "center", padding: "3rem 1rem", borderRadius: 20, background: "linear-gradient(135deg, #111113 0%, #1a0f05 100%)", border: "1px solid rgba(249,115,22,0.15)" }}>
          <div style={{ fontSize: "2rem", marginBottom: "0.75rem" }}>🚀</div>
          <h2 style={{ fontSize: "1.4rem", fontWeight: 900, color: "#fff", marginBottom: "0.75rem" }}>Redo att köra?</h2>
          <p style={{ color: "#9ca3af", marginBottom: "1.5rem", fontSize: "0.9rem", lineHeight: 1.6, maxWidth: 400, margin: "0 auto 1.5rem" }}>
            Börja med Projektledaren om du har ett stort projekt — eller välj en specialist för ett snabbt uppdrag.
          </p>
          <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", padding: "0.75rem 1.75rem", borderRadius: 12, background: "#f97316", color: "#fff", textDecoration: "none", fontWeight: 700, fontSize: "0.9rem" }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLAnchorElement).style.background = "#ea6c0a")}
            onMouseLeave={(e) => ((e.currentTarget as HTMLAnchorElement).style.background = "#f97316")}>
            Öppna teamet →
          </Link>
        </div>

      </div>
    </div>
  );
}

// ── Helper components ──

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 style={{ fontSize: "1.1rem", fontWeight: 800, color: "#fff", marginBottom: "1.25rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
      <span style={{ width: 3, height: 18, background: "#6366f1", borderRadius: 2, display: "inline-block" }} />
      {children}
    </h2>
  );
}

function ExampleBox({ children, bad, good, label }: { children: React.ReactNode; bad?: boolean; good?: boolean; label: string }) {
  const bg = bad ? "rgba(239,68,68,0.06)" : "rgba(16,185,129,0.06)";
  const border = bad ? "rgba(239,68,68,0.2)" : "rgba(16,185,129,0.2)";
  const labelColor = bad ? "#f87171" : "#34d399";
  return (
    <div style={{ padding: "0.9rem 1.1rem", borderRadius: 10, background: bg, border: `1px solid ${border}` }}>
      <div style={{ fontSize: "0.72rem", fontWeight: 700, color: labelColor, marginBottom: "0.4rem", letterSpacing: "0.05em" }}>{label}</div>
      <div style={{ fontSize: "0.86rem", color: "#d1d5db", lineHeight: 1.6, fontStyle: "italic" }}>{children}</div>
    </div>
  );
}
