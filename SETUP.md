# Strava Dashboard Setup

Professional Strava activity dashboard built with Next.js, Tailwind CSS, and Framer Motion.

## Quick Start

### 1. Get Strava API Credentials

See [GET_CREDENTIALS.md](GET_CREDENTIALS.md) for detailed instructions. You need:

- **Client ID**: Your app's unique identifier
- **Client Secret**: Keep this secret!
- **Refresh Token**: Obtain by completing OAuth flow with proper scopes (`activity:read_all`)

### 2. Set Up MongoDB

Create a free MongoDB Atlas cluster at https://mongodb.com/atlas, then get your connection URI.

### 3. Set Environment Variables

Update `.env.local`:

```env
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/stravaDashboard?retryWrites=true&w=majority
STRAVA_CLIENT_ID=your_client_id
STRAVA_CLIENT_SECRET=your_client_secret
STRAVA_REFRESH_TOKEN=your_refresh_token
```

⚠️ Never commit `.env.local` — it's in `.gitignore`

### 4. Install & Run

```bash
npm install
npm run dev
```

Open http://localhost:3000

On first load, MongoDB collections are populated automatically from the Strava API. Subsequent loads within 15 minutes are served from MongoDB.

## Features

### 📊 Dashboard
- **Period Selection**: Last 7/15/30 days or custom date range
- **Activity Stats**: Total distance, time, and count by period
- **Activity Breakdown**: Distance and time by activity type (Ride, Run, Walk, etc.)
- **Recent Activities**: Last 5 activities with quick preview
- **Responsive**: Works on mobile, tablet, and desktop

### 🚴 Activities Page
- **Pagination**: 10 activities per page with navigation
- **Filtering**: Filter by activity type
- **Sorting**: Sort by date, distance, or elevation gain
- **Activity Cards**: Rich preview with all key stats
- **Direct Links**: Click to view full activity details

### 📈 Activity Details
- **Key Stats**: Distance, time, pace/speed, heart rate
- **Distance vs Time Chart**: Visual progress throughout activity
- **Pace/Speed Chart**: How your pace varied during the activity
- **Heart Rate Graph**: HR trends (if available)
- **Elevation Profile**: Altitude changes throughout activity

### 📋 Stats Page
- **Year-to-Date**: Running total for current year by activity type
- **All-Time Records**: Longest rides/runs, most elevation gained
- **Activity Counts**: Total activities by type

## Pages & Routes

| Route | Page | Features |
|-------|------|----------|
| `/` | Dashboard | Stats overview, activity breakdown, recent activities |
| `/activities` | Activities | Paginated list, filters, sort options |
| `/activities/:id` | Activity Detail | Complete stats, charts, progress visualization |
| `/stats` | Statistics | YTD aggregates, all-time records, trends |

## Project Architecture

```
app/
├── page.tsx                      # Dashboard with stats & charts
├── activities/
│   ├── page.tsx                 # List with pagination
│   └── [id]/page.tsx            # Detail view with charts
├── stats/page.tsx               # Aggregated statistics
├── api/
│   ├── athlete/route.ts         # Get athlete profile (DB-cached)
│   ├── activities/route.ts      # List activities (DB-cached)
│   ├── activities/[id]/route.ts # Get activity detail (DB-cached)
│   └── debug/route.ts           # Debug credentials
└── layout.tsx                   # Root layout & navigation

components/
├── cards/
│   ├── StatCard.tsx            # Stat display card
│   └── ActivityCard.tsx         # Activity preview
├── charts/
│   ├── ProgressChart.tsx       # Distance vs Time
│   ├── PaceChart.tsx           # Pace over distance
│   ├── HeartRateChart.tsx      # HR over distance
│   └── ElevationChart.tsx      # Elevation profile
├── layout/
│   ├── Sidebar.tsx             # Desktop navigation
│   ├── BottomNav.tsx           # Mobile navigation
│   ├── Topbar.tsx              # Mobile header
│   └── PageWrapper.tsx         # Page transitions
└── ui/
    ├── Badge.tsx               # Status badges
    ├── Skeleton.tsx            # Loading state
    └── EmptyState.tsx          # No data state

lib/
├── strava.ts                   # Strava API client
└── mongodb.ts                  # Mongoose connection + TTL helper

models/
├── Activity.ts                 # Activities collection
├── AthleteCache.ts             # Athlete + stats document
├── ActivityDetailCache.ts      # Activity detail + streams
└── CacheMetadata.ts            # Cache freshness tracking

store/useStravaStore.ts         # Zustand state management
utils/formatters.ts             # Format utilities
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js (App Router) |
| Database | MongoDB (Mongoose) |
| Styling | Tailwind CSS v4 |
| Animation | Framer Motion |
| State | Zustand |
| Charts | Recharts |
| Icons | Lucide React |
| Dates | date-fns |

## Security

✅ **Server-Side Only**: All credentials are processed server-side
✅ **Never Exposed**: Browser only receives JSON data
✅ **MongoDB Cache**: Data served from DB — Strava API called at most every 15 min
✅ **Secure Refresh**: Automatic token refresh before expiration

Data flow:
```
Browser → Next.js API Route → MongoDB (cache hit) → Browser
Browser → Next.js API Route → Strava API → MongoDB (upsert) → Browser
```

## Development

```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint
```

### Debug Mode

Check credential status:
```bash
curl http://localhost:3000/api/debug
```

## Rate Limits

Strava API limits:
- **200 requests** per 15 minutes
- **2,000 requests** per day

With MongoDB caching (15-min TTL), the app makes at most 2 Strava requests per 15-minute window (activities + athlete). Activity detail pages are cached permanently, so each unique activity only costs 1 Strava API call ever.

## Troubleshooting

**"Authorization Error"**
- Refresh token is invalid or expired
- See [GET_CREDENTIALS.md](GET_CREDENTIALS.md) to get a new one

**"MONGODB_URI environment variable is not set"**
- Add `MONGODB_URI` to `.env.local`
- See Step 2 above for Atlas setup

**"Activities not loading"**
- Check `.env.local` has all four variables (including `MONGODB_URI`)
- Run `/api/debug` endpoint to verify Strava credentials
- Check browser console for errors

**Charts not showing**
- Some activities may not have all stream data (HR, altitude)
- Charts only appear if data is available

**Data seems stale**
- Click the ↻ refresh button to force-fetch from Strava
- Or see [CACHING.md](CACHING.md) for manual cache expiry

## Documentation

- **[README.md](README.md)** — Project overview
- **[STYLE.md](STYLE.md)** — Design system & colors
- **[GET_CREDENTIALS.md](GET_CREDENTIALS.md)** — OAuth setup
- **[CACHING.md](CACHING.md)** — MongoDB caching strategy
- **[DEPLOY.md](DEPLOY.md)** — Deploy to Vercel

## Next Steps

1. ✅ Set up Strava credentials
2. ✅ Set up MongoDB Atlas
3. ✅ Run development server
4. 🎯 Explore dashboard & activities
5. 📊 Check your stats page
6. 📱 Test on mobile
