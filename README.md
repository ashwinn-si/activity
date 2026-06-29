# Strava Hub

Personal activity dashboard for Strava — visualize splits, compare sessions, and track personal records across every sport you log.

> New user? See [USER_GUIDE.md](USER_GUIDE.md) for full setup instructions.

## Features

**Dashboard**
- Activity totals by period (7 / 15 / 30 days or custom range)
- Sport-type breakdown and recent activity preview

**Activities**
- Paginated, filterable, sortable list
- Activity cards with distance, time, pace/speed, elevation, and heart rate

**Activity Detail**
- Key stats, pace/speed chart, elevation profile, heart rate chart
- Km Split Table — per-kilometre time, delta vs previous, fastest/slowest tags
- Best Efforts — fastest time over standard distances (400 m → marathon) for any distance-based sport

**Records**
- Personal bests per sport type, auto-generated from your actual history
- Covers any Strava sport: running, cycling, swimming, hiking, yoga, weight training, and more
- PRs: longest distance, best pace/speed, top speed, most elevation, longest duration

**Compare**
- 3-step flow: pick sport → pick two sessions → see results
- Side-by-side split table, stat cards with winner highlighting, overlay pace/HR/elevation charts

**UI**
- Dark and light mode toggle
- Responsive layout (mobile bottom nav, desktop sidebar)
- Smooth Framer Motion animations, Recharts data visualisations

## Quick Start

```bash
# 1. Clone & install
npm install

# 2. Create .env.local with your credentials
cp .env.example .env.local   # then fill in the four values

# 3. Run
npm run dev
```

Open http://localhost:3000. See [USER_GUIDE.md](USER_GUIDE.md) for Strava OAuth and MongoDB setup.

## Environment Variables

| Variable | Description |
|---|---|
| `STRAVA_CLIENT_ID` | From strava.com/settings/api |
| `STRAVA_CLIENT_SECRET` | From strava.com/settings/api |
| `STRAVA_REFRESH_TOKEN` | OAuth refresh token with `activity:read_all` scope |
| `MONGODB_URI` | MongoDB Atlas connection string |

## Project Structure

```
app/
├── page.tsx                       # Dashboard
├── activities/
│   ├── page.tsx                   # Activity list
│   └── [id]/page.tsx              # Activity detail
├── stats/page.tsx                 # Statistics
├── records/page.tsx               # Personal Records board
├── compare/page.tsx               # Side-by-side comparison
└── api/                           # Strava API routes (DB-cached)

components/
├── cards/ActivityCard.tsx         # Activity list card
├── charts/                        # Pace, HR, elevation, progress charts
├── layout/                        # Sidebar, BottomNav, PageWrapper
├── ui/
│   ├── SessionPicker.tsx          # Custom activity selector
│   └── Badge.tsx, Skeleton.tsx, EmptyState.tsx
├── KmSplitTable.tsx               # Per-km split breakdown
└── BestEffortsTable.tsx           # Fastest times over standard distances

utils/
├── sportConfig.ts                 # Icon, color, label for every Strava sport type
└── formatters.ts                  # Distance, pace, speed, duration formatters

store/useStravaStore.ts            # Zustand store (activities, streams, loading)
store/useThemeStore.ts             # Dark/light mode
lib/strava.ts                      # Strava API client (token refresh)
lib/mongodb.ts                     # Mongoose connection + TTL helper
models/                            # MongoDB cache collections
```

## Tech Stack

| | |
|---|---|
| Framework | Next.js (App Router) |
| Database | MongoDB (Mongoose) |
| Styling | Tailwind CSS v4 |
| Animation | Framer Motion |
| Charts | Recharts |
| Icons | Lucide React |
| State | Zustand |

## Caching

Activities list and athlete data: 15-minute TTL in MongoDB. Activity detail + streams: cached permanently (immutable after recording). The ↻ button forces a fresh Strava API call. See [CACHING.md](CACHING.md).

## Docs

- [USER_GUIDE.md](USER_GUIDE.md) — New user setup & feature walkthrough
- [SETUP.md](SETUP.md) — Detailed local setup reference
- [GET_CREDENTIALS.md](GET_CREDENTIALS.md) — Strava OAuth flow
- [CACHING.md](CACHING.md) — MongoDB caching strategy
- [DEPLOY.md](DEPLOY.md) — Deploy to Vercel

## License

MIT
