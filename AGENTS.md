# AGENTS.md — AI Briefing Dashboard (Agent Instructions)

This file guides agentic coding assistants working in this repo.

## 0) Golden Rules

- **답변은 한글로 작성합니다.**
- **Do not run `git commit` / `git push` unless the user explicitly asks.**
- Prefer **small, focused patches**. Don’t refactor unrelated code.
- **No secrets in git**: never commit `.env` or any credentials.

## 1) Key Constraints (Static Export)

This project is a **static export** Next.js app.

- `next.config.js` uses `output: 'export'` → **do not change**.
- **No dynamic routes** (no `[param]`).
- **No API routes**.
- **No `getServerSideProps` / `getStaticProps`**.
- Data must be loaded **client-side** via `fetch()`.

## 2) Build / Lint / Test Commands

### Local development

```bash
npm install
npm run dev
```

### Lint

```bash
npm run lint
```

### Tests

```bash
npm test
```

Note: currently `npm test` is a no-op (`"No tests yet"`). There is **no single-test command** configured.

### Build

```bash
npm run build
```

### Data generation (local)

```bash
npm run generate:data
```

- Runs `node scripts/generate-briefing-v1.js`.
- Requires `GEMINI_API_KEY` in `.env`.
- Optional: `YOUTUBE_API_KEY` (if absent, YouTube search is skipped).

### Data collection sanity (no LLM)

```bash
npm run test:data
```

### Typecheck (optional)

```bash
npx tsc --noEmit
```

## 3) Runtime Data Model (public/data)

Generated files:

- `public/data/latest.json`
- `public/data/dates.json` → `{ "dates": ["YYYY-MM-DD", ...] }`
- `public/data/YYYY/MM/YYYY-MM-DD.json`

Schema (current):

- `schema_version: number`
- `date: "YYYY-MM-DD"` (Asia/Seoul)
- `sections` keys are **snake_case**:
  - `hype_check: NewsItem[]`
  - `tech_deep_dive: NewsItem[]`
  - `watch_this: VideoItem[]`

`NewsItem` uses `og_image` (snake_case).

## 4) Where the App Fetches Data

- Main page fetches data from GitHub Raw by default:
  - `https://raw.githubusercontent.com/zemyblue/ai-briefing-dashboard/main/public/data`
- Override for local/static testing:
  - set `NEXT_PUBLIC_DATA_BASE_URL=/data`

The UI adds a cache-buster query param and uses `cache: 'no-store'` to avoid stale “latest” on static deploys.

## 5) GitHub Actions

Workflows:

- `.github/workflows/ci.yml`
  - Runs: `npm ci` → `npm run lint` → `npm test` → `npm run build`

- `.github/workflows/daily-briefing.yml`
  - `schedule: '0 0 * * *'` (UTC 00:00 = **KST 09:00**)
  - **Important:** GitHub schedule execution can be delayed; this is expected.
  - Runs `npm run generate:data`, validates expected outputs, opens PR, auto-merges.
  - Secrets required:
    - `GEMINI_API_KEY` (required)
    - `YOUTUBE_API_KEY` (optional)

## 6) Module System Rules

- `src/app/**`, `src/components/**`: ESM/TypeScript (Next.js)
- `scripts/**`: CommonJS (Node script style)

Do not mix module systems inside those directories.

## 7) Code Style Guidelines

### TypeScript

- **No `any`**. Prefer explicit unions (`T | null`) and interfaces.
- Keep types **local and minimal**; don’t invent large abstractions.

### Imports

- Order:
  1) React/Next
  2) third-party
  3) internal (`@/...`)
- Remove unused imports/vars (ESLint is strict).

### React / Next

- Client components must include `'use client'`.
- Keep components pure; side-effects go in `useEffect`.
- Data is fetched on the client (static export).

### Tailwind

- Prefer consistent utility ordering and reuse existing patterns.
- Avoid global CSS changes unless necessary.

### Framer Motion

- Shared layout transitions use `layoutId`.
- Avoid `transition-all` on elements participating in layout animations (causes jank).

### Naming

- TS/JS: `camelCase` for variables/functions, `PascalCase` for components.
- JSON: `snake_case` keys.

### Error handling

- No empty `catch (e) {}`.
- If the error object is unused, use `catch { ... }`.
- Log actionable context (`source`, `url`, etc.).

## 8) Cursor / Copilot Rules

- No `.cursor/rules/`, `.cursorrules`, or `.github/copilot-instructions.md` found in this repo.

## 9) Shipping Checklist

Before asking to commit:

```bash
npm run lint
npm test
npm run build
```

Then show:

```bash
git status
git diff
```
