# Arbiter

Arbiter is a multi-model LLM orchestrator built on Next.js 16 (App Router). Instead of asking a single model for an answer, Arbiter fans your query out to several "worker" models in parallel — OpenAI, Claude, Gemini, DeepSeek, and Mistral — streams every response back to the UI in real time, and then optionally routes all of the worker outputs through an "evaluator" model that synthesizes a single, final answer.

Think of it as a Perplexity-style chat interface, but instead of one model answering, a panel of models answers and one of them (or the evaluator) is picked as the judge.

## How it works

1. **Fan-out** — When you send a message, Arbiter calls every selected worker model concurrently via provider-specific adapters (`lib/agents/*`).
2. **Streaming** — Each worker's tokens are streamed to the browser over Server-Sent Events (`lib/orchestrator/sse.ts`) as they're generated, so you see all models "thinking" side by side.
3. **Evaluation (optional)** — If an evaluator model is configured, it receives the original query plus every worker's output and produces a single synthesized reply. If no evaluator is selected, the first successful worker response is used instead.
4. **Persistence** — Conversations, per-model runs, token usage, and cost are persisted to Postgres via Drizzle ORM, so every chat retains full multi-turn history and a breakdown of what each model cost to run.

## Features

- **Multi-provider orchestration** — pluggable adapters for OpenAI, Anthropic (Claude), Google Gemini, DeepSeek, and Mistral, unified behind a common `AgentAdapter` interface (`lib/agents/types.ts`).
- **Live streaming UI** — real-time token streaming per model via SSE, with worker start/delta/done/error events.
- **Worker + Evaluator pipeline** — run several models as workers and have one model act as an evaluator/synthesizer over all of their outputs.
- **Multi-turn context** — full conversation history is threaded through every provider adapter, not just the most recent message.
- **Cost & token tracking** — per-run input/output/cached token counts and USD cost are computed against a maintained pricing table (`config/modelPricing.ts`) and rolled up per chat and per user.
- **Google OAuth authentication** — sign in with Google using an OAuth + PKCE flow, with short-lived JWT session tokens and refresh-token rotation (`lib/auth/*`, `app/api/auth/*`).
- **Encrypted BYO API keys** — bring your own provider API keys; they're encrypted at rest with AES-256-GCM before being stored (`lib/crypto`, `db/schema.ts` → `apiCredentials`).
- **Guest mode** — try the orchestrator without signing in (`app/api/guest/message`).
- **Docs site** — an in-app documentation section (`app/docs`) with interactive diagrams built on React Flow (`@xyflow/react`).

## Tech stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router), React 19 |
| Styling | Tailwind CSS 4 |
| Diagrams | @xyflow/react |
| Database | PostgreSQL |
| ORM / Migrations | Drizzle ORM + drizzle-kit |
| Auth | Google OAuth (PKCE) + JWT sessions |
| Validation | Zod |
| Animation | Framer Motion |
| Package manager | Bun (bun.lock committed; npm/yarn/pnpm also work) |

## Prerequisites

- Node.js 20+ (or Bun)
- Docker (for the bundled Postgres container) — or your own Postgres instance
- API keys for whichever model providers you want to use: OpenAI, Anthropic, Google (Gemini), DeepSeek, Mistral
- A Google Cloud OAuth 2.0 Client ID/Secret (for sign-in)

## Installation

### 1. Clone the repository

```bash
git clone https://github.com/MEHULARORA11/Arbiter.git
cd Arbiter
```

### 2. Install dependencies

```bash
bun install
# or: npm install / yarn install / pnpm install
```

### 3. Configure environment variables

Copy the example env file and fill in your own values:

```bash
cp .env.example .env
```

```env
DATABASE_URL=postgres://user:password@localhost:5431/perplexity_clone

# Google OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback

# JWT Session Secret (short-lived 15-minute session tokens)
JWT_SECRET=

# Credentials Encryption Key (used for AES-256-GCM encryption of stored provider API keys)
CREDENTIALS_ENCRYPTION_KEY=

# Postgres container credentials (used by docker-compose.yml)
DB_USER=
DB_PASSWORD=
DB_NAME=
```

You'll also want at least one provider key available at runtime (either as environment variables for server-side defaults, or entered per-user through the app, which stores them encrypted):

```env
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
GEMINI_API_KEY=
DEEPSEEK_API_KEY=
MISTRAL_API_KEY=
```

> Note: `DATABASE_URL` should point at whatever port your Postgres instance is actually listening on. The bundled `docker-compose.yml` maps the container's `5432` to host port `5431`.

### 4. Start Postgres

```bash
docker compose up -d
```

### 5. Run database migrations

```bash
bun run db:generate   # generate migrations from the Drizzle schema (if you've changed it)
bun run db:migrate     # apply migrations
```

You can also inspect your data visually with:

```bash
bun run db:studio
```

### 6. Run the development server

```bash
bun run dev
# or: npm run dev / yarn dev / pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Available scripts

| Command | Description |
|---|---|
| `dev` | Start the Next.js development server |
| `build` | Build the app for production |
| `start` | Start the production server (after `build`) |
| `lint` | Run ESLint |
| `db:generate` | Generate Drizzle migration files from the schema |
| `db:migrate` | Apply pending migrations to the database |
| `db:studio` | Launch Drizzle Studio to browse the database |

## Project structure

```
app/
  api/            # Route handlers: auth, chats, credentials, models, guest
  docs/           # In-app documentation pages and diagrams
  page.tsx        # Main chat interface
config/
  modelPricing.ts # Per-model input/output/cache pricing used for cost tracking
db/
  schema.ts       # Drizzle schema: users, chats, messages, model runs, credentials
  queries/        # Query helpers
lib/
  agents/         # Provider adapters (OpenAI, Claude, Gemini, DeepSeek, Mistral)
  auth/           # Google OAuth (PKCE) + JWT session handling
  crypto/         # AES-256-GCM encryption for stored API keys
  orchestrator/   # Fan-out/evaluator pipeline, rate limiting, SSE helpers
  validation/     # Zod schemas
scripts/
  verify-models.ts # Sanity-check configured models against providers
```

## Contributing

Issues and pull requests are welcome. If you're extending the orchestrator with a new provider, implement the `AgentAdapter` interface in `lib/agents/types.ts` and register it in `lib/agents/registry.ts`.

## License

No license has been specified for this repository. All rights reserved by the author unless a license file is added.