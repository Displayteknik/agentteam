# GripCoaching Agent Team — Admindokumentation

> **Ägare:** hakan@displayteknik.se
> **Live URL:** https://gripcoaching-agents.netlify.app
> **Lokal dev:** http://localhost:3460
> **Stack:** Next.js 14 · TypeScript · Supabase · Stripe · Claude API

---

## Innehåll

1. [Systemöversikt](#1-systemöversikt)
2. [Arkitektur & teknisk stack](#2-arkitektur--teknisk-stack)
3. [Filstruktur](#3-filstruktur)
4. [Databas — Supabase](#4-databas--supabase)
5. [Alla 9 AI-agenter](#5-alla-9-ai-agenter)
6. [Betalflöde — Stripe](#6-betalflöde--stripe)
7. [Admin-panelen](#7-admin-panelen)
8. [Alla URL:er och vad de gör](#8-alla-urler-och-vad-de-gör)
9. [API-routes](#9-api-routes)
10. [Miljövariabler](#10-miljövariabler)
11. [Var du testar och ser saker](#11-var-du-testar-och-ser-saker)
12. [Lokal utveckling](#12-lokal-utveckling)
13. [Deploy](#13-deploy)
14. [Felsökning](#14-felsökning)

---

## 1. Systemöversikt

GripCoaching Agent Team är en **SaaS-plattform** där användare betalar 697 kr/mån för tillgång till 9 AI-specialister inom marknadsföring. Varje specialist är en anpassad Claude-modell med djupa systemprompts.

### Flöde för en ny användare:

```
1. Besöker https://gripcoaching-agents.netlify.app
2. Klickar "Skapa konto" → registrerar sig (email + lösenord)
3. Bekräftar e-post (Supabase skickar mail)
4. Omdirigeras till /subscribe → klickar "Starta mitt abonnemang"
5. Betalar via Stripe (697 kr/mån)
6. Stripe webhook uppdaterar subscription_status = "active" i databasen
7. Användaren omdirigeras till /dashboard
8. Kan nu chatta med alla 9 agenter obegränsat
```

### Betalvägg:
Agentchattarna är **helt blockerade** tills `subscription_status = "active"` eller `"trialing"`. Försöker man nå `/dashboard` utan aktiv prenumeration → redirect till `/subscribe`.

---

## 2. Arkitektur & teknisk stack

| Komponent | Teknologi | Syfte |
|-----------|-----------|-------|
| **Frontend** | Next.js 14 App Router | Sidor, routing, SSR |
| **Streaming chat** | ReadableStream + Claude API | Realtids-AI-svar |
| **AI-motor** | Anthropic Claude (claude-3-5-sonnet) | Alla 9 agenter |
| **Databas** | Supabase (PostgreSQL) | Användare, ICP, progress |
| **Auth** | Supabase Auth | Login/signup/session |
| **Betalning** | Stripe | Prenumeration 697 kr/mån |
| **Hosting** | Netlify | Deploy + edge functions |
| **Språk** | TypeScript | Hela codebasen |

### Hur streaming fungerar:
```
User types message
        ↓
ChatInterface.tsx skickar POST /api/chat (eller /api/orchestrate)
        ↓
API-route autentiserar + hämtar ICP-kontext från Supabase
        ↓
Anropar Claude API med streaming=true
        ↓
ReadableStream pumpas chunk-för-chunk tillbaka till webbläsaren
        ↓
ChatInterface lägger till tecken i realtid i UI:t
```

---

## 3. Filstruktur

```
agentteam/
├── app/
│   ├── page.tsx                    ← Landningssida (agentgrid)
│   ├── layout.tsx                  ← Root layout, metadata, lang="sv"
│   ├── globals.css                 ← Tailwind + .prose-agent markdown-CSS
│   │
│   ├── agent/[slug]/page.tsx       ← Chattsida för varje agent
│   ├── dashboard/page.tsx          ← Användarens dashboard (skyddad)
│   ├── admin/page.tsx              ← Admin-panel (bara admin-email)
│   ├── docs/page.tsx               ← Användarguide
│   ├── subscribe/page.tsx          ← Stripe-betalningssida
│   │
│   ├── auth/
│   │   ├── login/page.tsx          ← Inloggning
│   │   ├── signup/page.tsx         ← Registrering
│   │   ├── callback/route.ts       ← Supabase OAuth-callback
│   │   ├── confirm/page.tsx        ← "Kolla din e-post"
│   │   └── signout/route.ts        ← Logga ut
│   │
│   └── api/
│       ├── chat/route.ts           ← Streaming chat för enskilda agenter
│       ├── orchestrate/route.ts    ← Streaming för Projektledaren
│       ├── icp/route.ts            ← GET/PUT ICP-dokument
│       ├── progress/route.ts       ← GET/PATCH progress-steg
│       └── stripe/
│       │   ├── create-checkout/route.ts  ← Skapar Stripe checkout session
│       │   └── webhook/route.ts          ← Tar emot Stripe-webhooks
│       └── admin/
│           ├── users/route.ts            ← Lista alla användare
│           └── users/[id]/route.ts       ← Visa/uppdatera en användare
│
├── components/
│   └── ChatInterface.tsx           ← Streamande chattkomponent (klient)
│
├── lib/
│   ├── agents.ts                   ← Alla 9 agentdefinitioner + systemprompts
│   ├── icp-context.ts              ← ICP-datastrukturer + completion-beräkning
│   ├── stripe.ts                   ← Stripe-singleton (lazy init)
│   └── supabase/
│       ├── client.ts               ← Webbläsarklient
│       ├── server.ts               ← Serverklient (API-routes + RSC)
│       └── middleware-client.ts    ← Middleware-klient (cookie-hantering)
│
├── middleware.ts                   ← Auth-gard + admin-skydd
├── supabase/schema.sql             ← Databas-schema (kör i Supabase SQL Editor)
├── netlify.toml                    ← Netlify-konfiguration
├── .env.local                      ← Lokala miljövariabler (ej committat)
└── ADMIN.md                        ← Det här dokumentet
```

---

## 4. Databas — Supabase

**Projekt URL:** https://liunepzrmygiaaibsbni.supabase.co
**Dashboard:** https://supabase.com/dashboard/project/liunepzrmygiaaibsbni

### Tabell 1: `profiles`
Utökar Supabase's inbyggda `auth.users`. Skapas automatiskt via trigger när ny användare registrerar sig.

| Kolumn | Typ | Beskrivning |
|--------|-----|-------------|
| `id` | uuid (PK) | Samma som auth.users.id |
| `email` | text | Användarens e-post |
| `full_name` | text | Namn (från signup) |
| `stripe_customer_id` | text (unique) | Stripe customer ID (cus_xxx) |
| `stripe_subscription_id` | text | Stripe subscription ID (sub_xxx) |
| `subscription_status` | text | `active` / `trialing` / `past_due` / `canceled` / null |
| `subscription_period_end` | timestamptz | När prenumerationen löper ut |
| `created_at` | timestamptz | Registreringsdatum |

**Row Level Security:** Användare kan bara läsa/skriva sin egen rad. Service role (webhook, admin) kringgår RLS automatiskt.

---

### Tabell 2: `icp_documents`
En ICP-rad per användare. Upsertad av ICP-Dokumentören via `/api/icp`.

| Kolumn | Typ | Beskrivning |
|--------|-----|-------------|
| `id` | uuid (PK) | Auto-genererat |
| `user_id` | uuid (unique FK) | Kopplat till profiles |
| `company_name` | text | Företagsnamn |
| `industry` | text | Bransch |
| `product_description` | text | Produktbeskrivning |
| `target_job_titles` | text[] | Jobbtitlar på målpersoner |
| `target_company_size` | text | Företagsstorlek |
| `geographies` | text[] | Geografier |
| `pain_points` | text[] | Smärtpunkter |
| `value_propositions` | text[] | Värdeerbjudanden |
| `objections` | text[] | Vanliga invändningar |
| `buying_triggers` | text[] | Köputlösare |
| `competitors` | text[] | Konkurrenter |
| `tone_of_voice` | text | Kommunikationsstil |
| `monthly_budget` | text | Månatlig marknadsföringsbudget |
| `completion_pct` | integer | 0–100%, beräknas automatiskt |
| `created_at` / `updated_at` | timestamptz | Tidsstämplar |

---

### Tabell 3: `progress_steps`
10 steg per användare. Skapas automatiskt via trigger när profil skapas.

| Steg | step_key | Beskrivning |
|------|----------|-------------|
| 1 | `onboarding_complete` | Konto aktiverat & betalning klar |
| 2 | `icp_started` | ICP-Dokumentören startad |
| 3 | `icp_basics_done` | Grundinfo ifylld |
| 4 | `icp_persona_done` | Målperson & företagsstorlek |
| 5 | `icp_pain_points_done` | Smärtpunkter kartlagda |
| 6 | `icp_completed` | ICP-Dokument 100% klart |
| 7 | `first_strategy` | Första strategi med Strategen |
| 8 | `first_content` | Första innehåll med Copywritern |
| 9 | `first_campaign` | Första kampanj lanserad |
| 10 | `first_analysis` | Första analys med Data-Analytikern |

**Automatisk uppdatering:** Steg 2–6 markeras automatiskt när ICP-dokumentet sparas beroende på ifyllnadsgrad. Steg 1 markeras via Stripe webhook.

---

### Databas — triggers (automatiska)

**Trigger 1: `on_auth_user_created`**
Körs när ny användare registrerar sig → skapar rad i `profiles`.

**Trigger 2: `on_profile_created`**
Körs när profil skapas → skapar 10 rader i `progress_steps`.

---

## 5. Alla 9 AI-agenter

| Slug | Namn | Emoji | Färg | Roll |
|------|------|-------|------|------|
| `projektledaren` | Projektledaren | 🚀 | #f97316 | **Orkestrator** — koordinerar alla specialister |
| `strategen` | Strategen | 🎯 | #6366f1 | Marknadsplaner, KPI:er, konkurrentanalys |
| `copywritern` | Copywritern | ✍️ | #8b5cf6 | Text, e-post, landningssidor, blogginlägg |
| `seo-experten` | SEO-Experten | 📈 | #06b6d4 | Nyckelord, on-page SEO, innehållsstrategi |
| `some-managern` | SoMe-Managern | 📱 | #ec4899 | LinkedIn, Instagram, Facebook-inlägg |
| `annons-specialisten` | Annons-Specialisten | 💰 | #f59e0b | Google Ads, Meta Ads, kampanjoptimering |
| `data-analytikern` | Data-Analytikern | 📊 | #10b981 | GA4, insikter, rapporter |
| `icp-dokumentoren` | ICP-Dokumentören | 🗺️ | #14b8a6 | Interaktiv ICP-byggnadsguide |
| `coachen` | Coachen | 💪 | #f59e0b | Progress-coach, motivation, nästa steg |

### Hur Projektledaren (orkestratorn) fungerar:
- Tar emot användarens fråga
- Bestämmer vilka 2–5 specialister som är relevanta
- Anropar Claude med en superprompt som inkluderar alla specialisters perspektiv
- Returnerar ett strukturerat svar med sektioner per specialist
- Max tokens: **8192** (dubbelt mot enskilda agenter)

### ICP-kontext i varje agent:
Varje agent (utom orkestratorn) hämtar automatiskt användarens ICP-dokument och injicerar det i systempromten. Detta gör att varje svar är anpassat till användarens specifika företag, målgrupp och produkt — utan att användaren behöver förklara det varje gång.

### Coachen — extra kontext:
Coachen hämtar även `progress_steps` och använder dem för att ge personaliserade råd baserat på var i resan användaren befinner sig.

---

## 6. Betalflöde — Stripe

**Live-läge:** Ja (livemode: true)
**Pris:** 697 kr/mån
**Stripe Dashboard:** https://dashboard.stripe.com

### Inställningar i Stripe:

| Objekt | ID | Beskrivning |
|--------|-----|-------------|
| **Produkt** | `prod_U6WYZz8fZvLzgo` | GripCoaching Agent Team |
| **Pris** | `price_1T8JVEHtFx7OzOu5lDGv6lob` | 697 SEK/månad |
| **Webhook** | `we_1T8JVIHtFx7OzOu5pMjSQoKE` | Endpoint för betalningshändelser |

### Webhook-URL:
```
https://gripcoaching-agents.netlify.app/api/stripe/webhook
```

### Händelser webhooket lyssnar på:
| Händelse | Vad som sker |
|----------|--------------|
| `checkout.session.completed` | Prenumeration aktiveras, `onboarding_complete` markeras |
| `customer.subscription.updated` | Uppdaterar status och period-slutdatum |
| `customer.subscription.deleted` | Sätter status till `canceled` |
| `invoice.payment_failed` | Sätter status till `past_due` |

### Komplett betalningsflöde:

```
/subscribe (klicka knapp)
    ↓
POST /api/stripe/create-checkout
    ↓ skapar Stripe customer (cus_xxx) om det inte finns
    ↓ skapar checkout session med metadata: { supabase_user_id }
    ↓ returnerar { url: "https://checkout.stripe.com/..." }
    ↓
Stripe hosted checkout (kortuppgifter)
    ↓ (betalning godkänd)
Stripe → POST /api/stripe/webhook
    ↓
Webhook verifierar signatur (STRIPE_WEBHOOK_SECRET)
    ↓
Uppdaterar profiles:
    stripe_subscription_id = sub_xxx
    subscription_status = "active"
    subscription_period_end = [datum]
    ↓
Markerar progress_step "onboarding_complete" = true
    ↓
Redirect → /dashboard?subscription=success
```

### Manuell prenumerationshantering:
Som admin kan du uppdatera `subscription_status` direkt från admin-panelen utan att gå via Stripe. Användbart om något gick fel med webhooket.

---

## 7. Admin-panelen

**URL:** https://gripcoaching-agents.netlify.app/admin
**Åtkomst:** Bara e-posten `hakan@displayteknik.se` (definierat i `ADMIN_EMAIL`)

### Skydd i middleware:
```typescript
// middleware.ts
if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) {
  if (userEmail !== process.env.ADMIN_EMAIL.toLowerCase()) {
    return redirect("/dashboard");  // vanliga användare kastas ut
  }
}
```

### Admin dashboard (`/admin`):

**Statistikkort:**
- Totalt registrerade användare
- Aktiva prenumeranter (status = active eller trialing)
- Beräknat MRR: `aktiva × 697 kr`

**Sökning & filtrering:**
- Sök på e-post, namn eller företagsnamn
- Filtrera på: Alla / Aktiva / Inaktiva

**Användartabell:**
| Kolumn | Beskrivning |
|--------|-------------|
| Namn + e-post | Klickbar länk till `/admin/users/[id]` |
| Prenumerationsstatus | Färgad badge (grön=active, blå=trialing, orange=past_due, röd=canceled) |
| ICP % | Hur långt de kommit med ICP-dokumentet |
| Progress | X/10 steg klara |
| Registrerad | Datum |
| Åtgärd | "Visa" → detaljsida |

### Användardetaljer (`/admin/users/[id]`):
- Full profilinformation
- Stripe customer ID med länk till Stripe dashboard: `https://dashboard.stripe.com/customers/cus_xxx`
- Redigerbar prenumerationsstatus (dropdown + spara)
- Alla 10 progress-steg med datum
- Hela ICP-dokumentet (läsläge)

---

## 8. Alla URL:er och vad de gör

### Publika sidor (ingen inloggning krävs):
| URL | Beskrivning |
|-----|-------------|
| `/` | Landningssida med alla agenter |
| `/docs` | Användarguide (hur man använder agenterna) |
| `/auth/login` | Inloggningssida |
| `/auth/signup` | Registreringssida |
| `/auth/confirm` | "Kolla din e-post"-sida efter registrering |
| `/auth/callback` | Supabase auth-callback (hanteras automatiskt) |

### Skyddade sidor (kräver inloggning):
| URL | Beskrivning |
|-----|-------------|
| `/subscribe` | Stripe-betalningssida (visas om ej aktiv prenumerant) |
| `/dashboard` | Användarens dashboard med progress + agentlänkar |
| `/agent/projektledaren` | Orkestratorn — koordinerar alla specialister |
| `/agent/strategen` | Strateg-agenten |
| `/agent/copywritern` | Copywriter-agenten |
| `/agent/seo-experten` | SEO-agenten |
| `/agent/some-managern` | SoMe-agenten |
| `/agent/annons-specialisten` | Annons-agenten |
| `/agent/data-analytikern` | Data-agenten |
| `/agent/icp-dokumentoren` | ICP-guiden |
| `/agent/coachen` | Progress-coachen |

### Admin-sidor (kräver ADMIN_EMAIL):
| URL | Beskrivning |
|-----|-------------|
| `/admin` | Admindashboard — alla användare, stats |
| `/admin/users/[id]` | Detaljer + redigering för en specifik användare |

---

## 9. API-routes

### Chat-API:

**`POST /api/chat`** — Streamande svar från enskild agent
```json
Request: {
  "messages": [{ "role": "user", "content": "..." }],
  "agentSlug": "strategen",
  "responseMode": "djup" | "kort" | "nasta-steg"
}
Response: ReadableStream (text/plain)
```

**`POST /api/orchestrate`** — Streamande svar från Projektledaren
```json
Request: { "messages": [{ "role": "user", "content": "..." }] }
Response: ReadableStream (text/plain)
```

### ICP-API:

**`GET /api/icp`** — Hämtar användarens ICP-dokument
```json
Response: { "icp": { ...ICP-fält... } | null }
```

**`PUT /api/icp`** — Sparar ICP-dokument (upsert)
```json
Request: { "company_name": "...", "pain_points": ["..."], ... }
Response: { "icp": {...}, "completion_pct": 75 }
```

### Progress-API:

**`GET /api/progress`** — Hämtar alla 10 progress-steg
```json
Response: { "steps": [{ "step_key": "...", "is_completed": true, ... }] }
```

**`PATCH /api/progress`** — Markerar ett steg som klart/oklart
```json
Request: { "step_key": "first_strategy", "is_completed": true }
Response: { "step": { ... } }
```

### Stripe-API:

**`POST /api/stripe/create-checkout`** — Skapar Stripe checkout session
```json
Request: (tom body)
Response: { "url": "https://checkout.stripe.com/..." }
```

**`POST /api/stripe/webhook`** — Tar emot Stripe-händelser
```
Verifieras med STRIPE_WEBHOOK_SECRET-signatur
```

### Admin-API (kräver ADMIN_EMAIL):

**`GET /api/admin/users`** — Lista alla användare
```json
Response: { "users": [{ "email", "subscription_status", "icp", "progress", ... }] }
```

**`GET /api/admin/users/[id]`** — Hämta en användares fullständiga data
```json
Response: { "profile": {...}, "icp": {...}, "steps": [...] }
```

**`PATCH /api/admin/users/[id]`** — Uppdatera en användare
```json
Request: { "subscription_status": "active" }
Response: { "profile": {...} }
```

---

## 10. Miljövariabler

Satt i **Netlify** (Settings → Environment variables) och i `.env.local` lokalt.

| Variabel | Värde / Källa | Krävs |
|----------|---------------|-------|
| `ANTHROPIC_API_KEY` | console.anthropic.com | ✅ |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase dashboard → Project Settings | ✅ |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase dashboard → API Keys | ✅ |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase dashboard → API Keys (secret!) | ✅ |
| `STRIPE_SECRET_KEY` | Stripe dashboard → API Keys | ✅ |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe dashboard → API Keys | ✅ |
| `NEXT_PUBLIC_STRIPE_PRICE_ID` | `price_1T8JVEHtFx7OzOu5lDGv6lob` | ✅ |
| `STRIPE_WEBHOOK_SECRET` | `whsec_ENP9TDMJNSzpXOfw9el19Nh6Jfr1vxUi` | ✅ |
| `ADMIN_EMAIL` | `hakan@displayteknik.se` | ✅ |
| `NEXT_PUBLIC_ADMIN_EMAIL` | `hakan@displayteknik.se` | ✅ |
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3460` (lokalt) | Valfri |

### Var hittar du dem?

- **Netlify:** https://app.netlify.com/projects/gripcoaching-agents/configuration/env
- **Supabase:** https://supabase.com/dashboard/project/liunepzrmygiaaibsbni/settings/api
- **Stripe:** https://dashboard.stripe.com/apikeys
- **Anthropic:** https://console.anthropic.com/settings/keys
- **Lokalt:** `C:\Users\hakan\.gemini\antigravity\scratch\agentteam\.env.local`

---

## 11. Var du testar och ser saker

### Som admin (inloggad som hakan@displayteknik.se):

#### Testa hela betalflödet:
1. Gå till https://gripcoaching-agents.netlify.app/auth/signup
2. Registrera ett **testanvändarkonto** (annan e-post)
3. Bekräfta e-posten
4. Du omdirigeras till `/subscribe`
5. Klicka "Starta mitt abonnemang"
6. Stripe testkortnummer: **4242 4242 4242 4242** (datum valfritt i framtiden, CVC valfri)
   *(OBS: Ni är i live-läge, så riktiga kort debiteras — använd en riktig betalning eller byt till test-läge i Stripe)*
7. Kontrollera att du hamnar på `/dashboard` med status "active"
8. Kontrollera i admin-panelen att användaren syns

#### Se alla användare:
- **Live:** https://gripcoaching-agents.netlify.app/admin
- **Supabase tabell:** https://supabase.com/dashboard/project/liunepzrmygiaaibsbni/editor

#### Ge en användare access manuellt (utan Stripe):
1. Gå till `/admin`
2. Klicka "Visa" på användaren
3. Ändra "Prenumerationsstatus" till "active"
4. Klicka "Spara"
5. Användaren kan nu logga in och använda alla agenter

#### Se Stripe-betalningar:
- https://dashboard.stripe.com/payments
- https://dashboard.stripe.com/subscriptions
- https://dashboard.stripe.com/customers

#### Se Stripe-webhooks (om de levererades korrekt):
- https://dashboard.stripe.com/webhooks/we_1T8JVIHtFx7OzOu5pMjSQoKE

#### Se Netlify-loggar:
- **Build logs:** https://app.netlify.com/projects/gripcoaching-agents/deploys
- **Function logs:** https://app.netlify.com/projects/gripcoaching-agents/logs/functions
- **Edge function logs:** https://app.netlify.com/projects/gripcoaching-agents/logs/edge-functions

#### Se Supabase-data direkt:
- **profiles-tabell:** https://supabase.com/dashboard/project/liunepzrmygiaaibsbni/editor?sql=select+*+from+profiles+order+by+created_at+desc
- **ICP-dokument:** https://supabase.com/dashboard/project/liunepzrmygiaaibsbni/editor?sql=select+*+from+icp_documents
- **Progress-steg:** https://supabase.com/dashboard/project/liunepzrmygiaaibsbni/editor?sql=select+*+from+progress_steps+order+by+user_id,+step_order

---

## 12. Lokal utveckling

```bash
# 1. Gå till projektmappen
cd "C:\Users\hakan\.gemini\antigravity\scratch\agentteam"

# 2. Installera beroenden (om du inte gjort det)
npm install

# 3. Starta dev-servern
npm run dev
# → http://localhost:3460

# 4. Bygg för produktion (för att testa build)
npm run build
```

### Viktigt om local vs. live:
- Stripe webhooks kan **inte** skickas till localhost. Använd [Stripe CLI](https://stripe.com/docs/stripe-cli) för lokal webhook-testning:
  ```bash
  stripe listen --forward-to localhost:3460/api/stripe/webhook
  ```
- Supabase Auth redirect är satt till `https://gripcoaching-agents.netlify.app/auth/callback`. För lokal testning kan du tillfälligt lägga till `http://localhost:3460/auth/callback` i Supabase Auth → URL Configuration.

---

## 13. Deploy

### Deploya till Netlify (produktion):
```bash
cd "C:\Users\hakan\.gemini\antigravity\scratch\agentteam"
netlify deploy --site b071005f-6f1a-41b4-b88f-135e23632732 --prod
```

### Deploya preview (utan --prod):
```bash
netlify deploy --site b071005f-6f1a-41b4-b88f-135e23632732
# → ger en unik preview-URL för testning
```

### Pusha till GitHub:
```bash
git add .
git commit -m "Uppdatering"
git push origin main
```

### Netlify IDs:
- **Site ID:** `b071005f-6f1a-41b4-b88f-135e23632732`
- **Site URL:** https://gripcoaching-agents.netlify.app
- **Admin:** https://app.netlify.com/projects/gripcoaching-agents

---

## 14. Felsökning

### "Användaren kan inte logga in"
1. Kolla att de bekräftat e-posten (Supabase skickar bekräftelsemail)
2. Kolla Supabase Auth logs: https://supabase.com/dashboard/project/liunepzrmygiaaibsbni/auth/users
3. Om de aldrig fick mailet → gå till Supabase Auth → Users, hitta användaren, klicka "Send magic link"

### "Betalning gick igenom men användaren har fortfarande ingen access"
1. Kolla Stripe webhook-loggar: https://dashboard.stripe.com/webhooks/we_1T8JVIHtFx7OzOu5pMjSQoKE
2. Se om webhook levererades (200) eller misslyckades
3. Om misslyckat → klicka "Resend" på händelsen i Stripe
4. Alternativt: ge access manuellt via admin-panelen (`/admin`)

### "API-fel / agenten svarar inte"
1. Kolla Netlify function logs: https://app.netlify.com/projects/gripcoaching-agents/logs/functions
2. Vanliga orsaker:
   - `ANTHROPIC_API_KEY` saknas/utgången
   - Rate limit på Claude API
   - Build-fel (kolla deploy logs)

### "Admin-panelen visar inga användare"
1. Kolla att `ADMIN_EMAIL` är satt korrekt i Netlify env vars
2. Kontrollera att du är inloggad med exakt `hakan@displayteknik.se`
3. Kolla Supabase: https://supabase.com/dashboard/project/liunepzrmygiaaibsbni/editor

### Viktiga länkarkiv:

| Tjänst | Dashboard |
|--------|-----------|
| **Live site** | https://gripcoaching-agents.netlify.app |
| **Admin-panel** | https://gripcoaching-agents.netlify.app/admin |
| **Netlify** | https://app.netlify.com/projects/gripcoaching-agents |
| **Supabase** | https://supabase.com/dashboard/project/liunepzrmygiaaibsbni |
| **Stripe** | https://dashboard.stripe.com |
| **Stripe webhooks** | https://dashboard.stripe.com/webhooks/we_1T8JVIHtFx7OzOu5pMjSQoKE |
| **Anthropic** | https://console.anthropic.com |
| **GitHub** | https://github.com/Displayteknik/agentteam |

---

*Skapad: 2026-03-07 | Uppdatera detta dokument vid större systemändringar.*
