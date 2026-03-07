# CLAUDE.md – GripCoaching Agent Team

## Projektstatus
Aktiv. Next.js app med Claude AI-backend.
GitHub: https://github.com/Displayteknik/agentteam
Netlify: https://gripcoaching-agents.netlify.app

## Teknikstack
- Next.js 14 App Router · TypeScript · Tailwind CSS
- @anthropic-ai/sdk → claude-3-5-sonnet-20241022 (streaming)
- Ingen databas – tillstånd hanteras lokalt i webbläsaren

## Filstruktur
```
agentteam/
├── app/
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Dashboard – 6 agent-kort
│   ├── globals.css         # Globala stilar + prose-agent markdown
│   └── api/chat/route.ts   # Streaming Claude API (POST)
│   └── agent/[slug]/
│       └── page.tsx        # Chat-sida per agent
├── components/
│   └── ChatInterface.tsx   # Klientkomponent – chat UI + streaming
├── lib/
│   └── agents.ts           # 6 agent-definitioner + systemPrompts
├── netlify.toml
├── .env.local.example
└── CLAUDE.md
```

## Miljövariabler
```
ANTHROPIC_API_KEY=sk-ant-...   ← Krävs för att appen ska fungera
```
Sätt i Netlify dashboard under Site settings → Environment variables.
Lokalt: kopiera .env.local.example → .env.local och fyll i nyckeln.

## Agenter (lib/agents.ts)
| slug | Namn | Fokus |
|---|---|---|
| strategen | Strategen | Marknadsstrategi, KPI, handlingsplan |
| copywritern | Copywritern | E-post, landningssidor, bloggar |
| seo-experten | SEO-Experten | Sökordsanalys, on-page, revision |
| some-managern | SoMe-Managern | LinkedIn, Instagram, Facebook |
| annons-specialisten | Annons-Specialisten | Google/Meta Ads, A/B-test |
| data-analytikern | Data-Analytikern | GA4, rapport, KPI-analys |

## API-flöde
1. `ChatInterface.tsx` POST:ar till `/api/chat` med `{ messages, agentSlug }`
2. `route.ts` slår upp agentens `systemPrompt` i `lib/agents.ts`
3. Claude API returnerar en streaming-text-response
4. Klienten läser ReadableStream chunk-för-chunk och uppdaterar UI

## Markdown-rendering
Svaren renderas via `renderMarkdown()` i `ChatInterface.tsx` (custom regex, ingen extern lib).
CSS i `globals.css` under `.prose-agent` styr utseendet.

## Deploy-workflow
```bash
# Lokal dev:
npm run dev   # → http://localhost:3460

# Deploy till Netlify (kräver @netlify/plugin-nextjs):
npm run build
netlify deploy --prod

# Eller via GitHub → auto-deploy via Netlify CI
```

## Koppling till landingssidan
Landningssidans "Kom igång"-knapp och "Boka en genomgång" bör länkas till agentteam-appen.
URL: https://gripcoaching-agents.netlify.app
