# Strava Hub — Setup Reference

## Prerequisites

- Node.js 18+
- MongoDB Atlas account (free tier sufficient)
- Strava account with recorded activities

## Environment Variables

Create `.env.local` in the project root:

```env
STRAVA_CLIENT_ID=your_client_id
STRAVA_CLIENT_SECRET=your_client_secret
STRAVA_REFRESH_TOKEN=your_refresh_token
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/strava_cache
```

See [GET_CREDENTIALS.md](GET_CREDENTIALS.md) for the Strava OAuth flow.

## Install & Run

```bash
npm install
npm run dev       # http://localhost:3000
npm run build     # production build
npm start         # production server
npm run lint      # lint
```

On first load, MongoDB collections are populated automatically from the Strava API. Subsequent loads within 15 minutes are served from the database.

## Pages & Routes

| Route | Description |
|---|---|
| `/` | Dashboard — totals, sport breakdown, recent activities |
| `/activities` | Paginated list with filter/sort |
| `/activities/:id` | Detail — charts, km splits, best efforts |
| `/stats` | Year-to-date aggregates and trends |
| `/records` | Personal Records board per sport type |
| `/compare` | Side-by-side session comparison |

## Project Architecture

```
app/
├── page.tsx                      # Dashboard
├── activities/
│   ├── page.tsx                  # List (paginated, filterable)
│   └── [id]/page.tsx             # Detail view with all charts
├── stats/page.tsx                # Aggregated statistics
├── records/page.tsx              # Personal Records board
├── compare/page.tsx              # Head-to-head session compare
└── api/
    ├── athlete/route.ts          # Athlete profile (DB-cached)
    ├── activities/route.ts       # Activity list (DB-cached, 15-min TTL)
    ├── activities/[id]/route.ts  # Activity detail + streams (DB-cached)
    └── debug/route.ts            # Credential health check

components/
├── cards/ActivityCard.tsx        # Activity list card
├── charts/
│   ├── PaceChart.tsx             # Pace/speed over distance
│   ├── HeartRateChart.tsx        # HR over distance
│   ├── ElevationChart.tsx        # Elevation profile
│   └── ProgressChart.tsx         # Distance vs time
├── layout/
│   ├── Sidebar.tsx               # Desktop navigation + theme toggle
│   ├── BottomNav.tsx             # Mobile navigation
│   └── PageWrapper.tsx           # Page transitions
├── ui/
│   ├── SessionPicker.tsx         # Custom sport-aware activity selector
│   ├── Badge.tsx                 # Sport type badges
│   ├── Skeleton.tsx              # Loading skeletons
│   └── EmptyState.tsx            # No-data state
├── KmSplitTable.tsx              # Per-km time breakdown
├── BestEffortsTable.tsx          # Fastest times over standard distances
└── ThemeToggle.tsx               # Dark/light mode button

utils/
├── sportConfig.ts                # Central icon/color/label for all Strava sports
└── formatters.ts                 # Distance, pace, speed, duration

store/
├── useStravaStore.ts             # Activity data + fetch actions (Zustand)
└── useThemeStore.ts              # Dark/light theme (Zustand)

lib/
├── strava.ts                     # Strava API client with auto token refresh
└── mongodb.ts                    # Mongoose connection + isCacheStale()

models/
├── Activity.ts                   # Activities collection
├── AthleteCache.ts               # Athlete profile (singleton)
├── ActivityDetailCache.ts        # Activity detail + streams
└── CacheMetadata.ts              # lastRefreshed per data type
```

## Adding Sport Support

The app is fully generic. Any sport type Strava returns is handled automatically via `utils/sportConfig.ts`. Known sports (Run, Ride, Walk, Swim, Hike, WeightTraining, Yoga, and 30+ more) have specific icons and colors. Unknown future sport types get a deterministic color derived from the sport name and a generic icon.

No code changes are needed when you start a new sport type on Strava.

## Security

All Strava credentials are server-side only. The browser receives JSON responses — never the Client ID, Secret, or Refresh Token.

```
Browser → Next.js API Route → MongoDB (cache hit) → JSON
Browser → Next.js API Route → Strava API → MongoDB (upsert) → JSON
```

## Troubleshooting

**"Authorization Error"**
Refresh token invalid or expired. See [GET_CREDENTIALS.md](GET_CREDENTIALS.md) to generate a new one.

**"MONGODB_URI not set"**
Add `MONGODB_URI` to `.env.local`. Restart the dev server after editing env files.

**Activities not loading**
Check all four env vars are set. Hit `/api/debug` to verify Strava credentials.

**Charts not showing**
Some activities lack stream data (HR, altitude). Charts appear only when data is available.

**Data seems stale**
Click the ↻ button on the dashboard to force a fresh Strava fetch. See [CACHING.md](CACHING.md) for manual cache expiry.

## Documentation

- [README.md](README.md) — Project overview
- [USER_GUIDE.md](USER_GUIDE.md) — New user setup & feature walkthrough
- [GET_CREDENTIALS.md](GET_CREDENTIALS.md) — Strava OAuth flow
- [CACHING.md](CACHING.md) — MongoDB caching strategy
- [DEPLOY.md](DEPLOY.md) — Deploy to Vercel
- [STYLE.md](STYLE.md) — Design system & colors
