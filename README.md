# Etcetera Scheduler

A collaborative scheduling tool that helps groups find the best time to meet.

## Features

- **Three Scheduling Modes**
  - **Date Range** — Select a start/end date. Guests pick which days work.
  - **Date Selection** — Pick specific dates. Guests choose from those dates.
  - **Date & Time Selection** — Pick specific dates with time windows. Guests select days and times.
- **Collect Responses** — Share a link, guests select their availability (no account needed)
- **Availability Heatmap** — See at a glance which dates (and times) work best
- **Time Heatmap Bars** — For Date & Time plans, view a full-day timeline showing guest overlap per 15-minute block
- **Schedule Comparison** — Compare specific people's availability with color-coded calendars
- **Markdown Descriptions** — Plan descriptions support markdown formatting

## Tech Stack

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS + ShadCN UI
- Prisma + PostgreSQL
- Supabase Auth

## Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).
