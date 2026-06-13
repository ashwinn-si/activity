# Strava Dashboard

Professional activity tracking dashboard for Strava. Built with Next.js, Tailwind CSS, and Framer Motion.

## Features

✅ **Dashboard Overview**
- Quick stats (distance, time, activity count)
- Activity type breakdown (Ride, Run, Walk, etc.)
- Date range selector (Last 7/15/30 days or custom)
- Recent activities preview

✅ **Activities Page**
- Paginated activity list (10 per page)
- Filter by activity type
- Sort by date, distance, or elevation
- Quick navigation with prev/next buttons

✅ **Activity Details**
- Comprehensive stats (distance, time, pace, speed, heart rate)
- Distance vs Time progress chart
- Pace/Speed visualization
- Heart rate graph (if available)
- Elevation profile chart

✅ **Stats Page**
- Year-to-date aggregates
- All-time personal records
- Monthly trends
- Activity type breakdowns

✅ **Design**
- Dark theme with custom color system
- Responsive layout (mobile, tablet, desktop)
- Smooth Framer Motion animations
- Accessible navigation

## Quick Start

1. **Get Strava Credentials** — Read [GET_CREDENTIALS.md](GET_CREDENTIALS.md)

2. **Set up MongoDB** — Free Atlas cluster at https://mongodb.com/atlas

3. **Set environment variables** in `.env.local`:
   ```env
   MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/stravaDashboard?retryWrites=true&w=majority
   STRAVA_CLIENT_ID=your_client_id
   STRAVA_CLIENT_SECRET=your_client_secret
   STRAVA_REFRESH_TOKEN=your_refresh_token
   ```

4. **Install & Run**
   ```bash
   npm install
   npm run dev
   ```

5. **Visit** http://localhost:3000

## Project Structure

```
├── app/
│   ├── page.tsx                # Dashboard
│   ├── activities/page.tsx     # Activity list
│   ├── activities/[id]/page.tsx # Activity detail
│   ├── stats/page.tsx          # Statistics
│   └── api/                    # Backend routes (DB-cached)
├── components/
│   ├── cards/                  # StatCard, ActivityCard
│   ├── charts/                 # Data visualizations
│   ├── layout/                 # Navigation & structure
│   └── ui/                     # Reusable components
├── lib/
│   ├── strava.ts               # Strava API helpers
│   └── mongodb.ts              # Mongoose connection + TTL
├── models/                     # Mongoose models (cache collections)
├── store/useStravaStore.ts     # State management
└── utils/formatters.ts         # Format utilities
```

## Tech Stack

- **Framework**: Next.js (App Router)
- **Database**: MongoDB (Mongoose) — server-side cache
- **Styling**: Tailwind CSS v4
- **Animation**: Framer Motion
- **Charts**: Recharts
- **Icons**: Lucide React
- **State**: Zustand
- **Date Utils**: date-fns

## Caching

Activities and athlete data are cached in MongoDB with a **15-minute TTL**. Activity detail + streams are cached permanently (streams are immutable). The ↻ button forces a fresh Strava API call. See [CACHING.md](CACHING.md) for details.

## Security

All Strava credentials are **server-side only**. Your browser never sees the Client ID, Secret, or Refresh Token. Data flow: Browser → Next.js API Routes → MongoDB / Strava API → JSON response.

## Development

```bash
npm run dev       # Dev server
npm run build     # Production build
npm start         # Production server
npm run lint      # Linting
```

## Documentation

- [SETUP.md](SETUP.md) — Initial setup & running locally
- [GET_CREDENTIALS.md](GET_CREDENTIALS.md) — Strava OAuth setup
- [DEPLOY.md](DEPLOY.md) — Deploy to Vercel with custom domain
- [STYLE.md](STYLE.md) — Design system & colors
- [CACHING.md](CACHING.md) — MongoDB caching strategy

## Rate Limits

Strava allows 200 requests per 15 minutes / 2,000 per day. With MongoDB caching, the app makes at most 2 Strava requests per 15-minute window under normal use.

## License

MIT
