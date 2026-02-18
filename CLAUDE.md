# CLAUDE.md

## Commands

```bash
npm run dev              # Start dev server (localhost:3000)
npm run build            # Production build
npm run lint             # ESLint
npm run db:up            # Start local Postgres (docker compose, port 5433)
npm run db:down          # Stop local Postgres
npm run db:push          # Push Prisma schema to local DB
npm run db:studio        # Open Prisma Studio
npm run prisma:migrate:dev     # Migrate using .env.prod
npm run prisma:migrate:deploy  # Deploy migrations using .env.prod
npm run prisma:db:push         # Push schema using .env.local
npx prisma generate      # Regenerate client (also runs on postinstall)
```

## Architecture

Next.js App Router with Supabase Auth + Prisma ORM on PostgreSQL. Deployed on Vercel.

### Scheduling Modes

Plans have a `mode` field — one of `DATE_RANGE`, `DATE_SELECTION`, or `DATE_TIME_SELECTION`:

- **DATE_RANGE** (default) — planner sets `startDate`/`endDate`, guests pick days within that range
- **DATE_SELECTION** — planner sets `startDate`/`endDate` as bounds, then picks specific `availableDates`. Guests choose from those dates only
- **DATE_TIME_SELECTION** — same as DATE_SELECTION, plus planner defines `timeWindows` (per-date time windows as JSON) and `desiredDuration` (minutes). Guests select dates and time windows per date

All three modes use `startDate`/`endDate` for calendar rendering bounds.

### Data Model (2 tables)

- **Plan** — `slug` (nanoid, 10 chars), `mode`, `startDate`/`endDate`, `availableDates` (DateTime[]), `timeWindows` (Json?), `desiredDuration` (Int?), `creatorId` (Supabase user ID), `creatorName` (denormalized)
- **Response** — `selectedDates` (DateTime[]), `selectedTimeWindows` (Json?), `guestName`, `comment`. Cascading delete from Plan

`timeWindows` and `selectedTimeWindows` share the same JSON shape: `Record<string, TimeWindow[]>` where key is `YYYY-MM-DD` and `TimeWindow` is `{ start: string, end: string }` in `HH:mm` format.

### Auth Flow

- Supabase SSR auth via `@supabase/ssr` with cookie-based sessions
- Server-side: `createServerSupabase()` from `@/lib/supabase/server` (uses `cookies()`)
- Client-side: `createClient()` from `@/lib/supabase/client`
- OAuth callback at `/auth/callback` exchanges code and redirects to `/dashboard`
- No middleware — auth checks happen in API route handlers
- Env vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

### Route Structure

| Route | Auth | Purpose |
|-------|------|---------|
| `/` | Public | Landing page |
| `/login` | Public | Login page |
| `/dashboard` | Authenticated | List user's plans |
| `/dashboard/new` | Authenticated | Create plan (multi-step: mode → details → time windows) |
| `/plan/[slug]` | Public | Guest response page (no auth needed) |
| `/plan/[slug]/results` | Owner only | View responses + heatmap + time bars |

### API Routes

- `GET/POST /api/plans` — list/create plans (authenticated). POST accepts `mode`, `availableDates`, `timeWindows`, `desiredDuration`
- `GET /api/plans/[slug]` — public plan info including mode fields (no auth, limited fields)
- `PATCH/DELETE /api/plans/[slug]` — update/delete (owner only)
- `POST /api/plans/[slug]/respond` — guest submits availability (no auth). Accepts `selectedTimeWindows` for DATE_TIME_SELECTION
- `GET /api/plans/[slug]/results` — plan with responses including `selectedTimeWindows` (owner only)
- `DELETE /api/plans/[slug]/responses/[responseId]` — remove response (owner only)

### Key Patterns

- **Prisma singleton** in `@/lib/prisma` with global caching for dev hot-reload
- **UI components** in `src/components/ui/` are shadcn/ui (CVA + tailwind-merge)
- **CalendarGrid** — dual-mode: `selectable` (guest picks dates) and `heatmap` (results). Supports `enabledDates` prop to restrict which dates are clickable (used for DATE_SELECTION/DATE_TIME_SELECTION). Supports `onDayClick` for heatmap interaction
- **ComparisonCalendar** — color-coded per-person availability comparison
- **ModeSelector** — three-card selector for choosing plan mode during creation
- **TimeWindowEditor** — planner-side per-date time window picker (start/end pairs, +, All Day, ×)
- **TimeWindowSelector** — guest-side version showing planner context (available windows + desired duration) + guest input
- **TimeHeatmapBar** — full 24-hour timeline with 15-min blocks. Thin planner reference strip on top, unfiltered guest responses on main bar. Click a block for detail panel with names. Grey blocks = outside planner windows
- **DateSelector** — CalendarGrid wrapper for planner date picking
- Plan descriptions support **Markdown** via `react-markdown` + `@tailwindcss/typography`
- All `params` in route handlers are `Promise<{...}>` (Next.js 16+ async params pattern)
- **Time validation** — start must be before end, enforced inline on components + on form submission (both planner and guest)

### Plan Creation Flow

Multi-step form in `/dashboard/new`:
1. **Mode selection** — pick DATE_RANGE / DATE_SELECTION / DATE_TIME_SELECTION
2. **Plan details** — name, description (markdown), start/end dates. For DATE_SELECTION and DATE_TIME_SELECTION: calendar appears to select specific dates within bounds. DATE_TIME_SELECTION also has desired duration input
3. **Time windows** (DATE_TIME_SELECTION only) — TimeWindowEditor per selected date

### Results Page

- Heatmap tab shows day-level availability for all modes
- For DATE_TIME_SELECTION: time heatmap bars auto-display for all days with responses. Closeable per day, re-openable by clicking the day on the calendar
- Responses tab with individual view and multi-person comparison mode

## Non-Obvious Details

- Local Postgres runs on **port 5433** (not 5432) to avoid conflicts — credentials: `etcetera`/`etcetera`/`etcetera_scheduler`
- Prisma migration commands use `dotenv-cli` to load `.env.prod`, while `db:push` uses `.env.local` — be aware which env you're targeting
- Guest responses require **no authentication** — anyone with the slug can submit
- Results page is **owner-gated** server-side (API checks `creatorId === user.id`)
- `next.config.mjs` is empty — no custom Next.js config
- No test framework is configured
- Time heatmap bars show **unfiltered** guest responses across the full day — even outside planner windows — so planners can spot rescheduling opportunities
- `TimeWindow` type is defined in `time-window-editor.tsx` and imported elsewhere
