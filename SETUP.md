# Strava Dashboard Setup

Professional Strava activity dashboard built with Next.js 14, Tailwind CSS, and Framer Motion.

## Quick Start

### 1. Get Strava API Credentials

See [GET_CREDENTIALS.md](GET_CREDENTIALS.md) for detailed instructions. You need:

- **Client ID**: Your app's unique identifier
- **Client Secret**: Keep this secret!
- **Refresh Token**: Obtain by completing OAuth flow with proper scopes (`activity:read_all`)

### 2. Set Environment Variables

Update `.env.local`:

```env
STRAVA_CLIENT_ID=your_client_id
STRAVA_CLIENT_SECRET=your_client_secret
STRAVA_REFRESH_TOKEN=your_refresh_token
```

⚠️ Never commit `.env.local` — it's in `.gitignore`

### 3. Install & Run

```bash
npm install
npm run dev
```

Open http://localhost:3000

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
  - X-axis: Time elapsed (minutes)
  - Y-axis: Distance covered (km)
  - Shows pace consistency
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
│   ├── athlete/route.ts         # Get athlete profile
│   ├── activities/route.ts      # List activities
│   ├── activities/[id]/route.ts # Get activity detail
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

lib/strava.ts                    # Strava API client
store/useStravaStore.ts          # Zustand state management
utils/formatters.ts             # Format utilities
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Styling | Tailwind CSS v4 |
| Animation | Framer Motion |
| State | Zustand |
| Charts | Recharts |
| Icons | Lucide React |
| Dates | date-fns |
| HTTP | Native fetch + Next.js caching |

## Security

✅ **Server-Side Only**: All credentials are processed server-side
✅ **Never Exposed**: Browser only receives JSON data
✅ **Token Caching**: 5-minute automatic cache to reduce API calls
✅ **Secure Refresh**: Automatic token refresh before expiration

Data flow:
```
Browser → Next.js API Route → Strava API → Cached Response → Browser
         (server-side)       (secure)                    (JSON only)
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

Returns:
```json
{
  "status": "ok",
  "message": "Token refresh successful",
  "token_expires_in": 21600
}
```

## Rate Limits

Strava API limits:
- **200 requests** per 15 minutes
- **2,000 requests** per day

This app caches responses for 5 minutes to stay under limits. With typical usage (checking dashboard a few times per day), you'll use < 10 requests/day.

## Troubleshooting

**"Authorization Error"**
- Refresh token is invalid or expired
- See [GET_CREDENTIALS.md](GET_CREDENTIALS.md) to get a new one

**"Activities not loading"**
- Check `.env.local` has all three credentials
- Run `/api/debug` endpoint to verify
- Check browser console for errors

**Charts not showing**
- Some activities may not have all stream data (HR, altitude)
- Charts only appear if data is available
- Check activity has at least distance stream data

**Empty activities list**
- Verify you have recent activities on Strava
- Activities older than 5 years may not be available
- Check date range picker on dashboard

## Documentation

- **[README.md](README.md)** — Project overview
- **[STYLE.md](STYLE.md)** — Design system & colors
- **[GET_CREDENTIALS.md](GET_CREDENTIALS.md)** — OAuth setup
- **[CLAUDE.md](CLAUDE.md)** — Developer notes

## Next Steps

1. ✅ Set up credentials
2. ✅ Run development server
3. 🎯 Explore dashboard & activities
4. 📊 Check your stats page
5. 📱 Test on mobile

Enjoy tracking your activities! 🏃‍♂️🚴‍♀️
