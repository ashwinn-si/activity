# Strava Dashboard

Professional activity tracking dashboard for Strava. Built with Next.js 14, Tailwind CSS, and Framer Motion.

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

1. **Get Strava Credentials**
   - Read [GET_CREDENTIALS.md](GET_CREDENTIALS.md)
   - Update `.env.local` with your tokens

2. **Install & Run**
   ```bash
   npm install
   npm run dev
   ```

3. **Visit** http://localhost:3000

## Project Structure

```
├── app/
│   ├── page.tsx                # Dashboard
│   ├── activities/page.tsx      # Activity list
│   ├── activities/[id]/page.tsx # Activity detail
│   ├── stats/page.tsx           # Statistics
│   └── api/                     # Backend routes
├── components/
│   ├── cards/                   # StatCard, ActivityCard
│   ├── charts/                  # Data visualizations
│   ├── layout/                  # Navigation & structure
│   └── ui/                      # Reusable components
├── lib/strava.ts                # Strava API helpers
├── store/useStravaStore.ts      # State management
└── utils/formatters.ts          # Format utilities
```

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS v4
- **Animation**: Framer Motion
- **Charts**: Recharts
- **Icons**: Lucide React
- **State**: Zustand
- **Date Utils**: date-fns

## Security

All Strava credentials are **server-side only**. Your browser never sees:
- Client ID, Secret, or Refresh Token
- These are stored in `.env.local` (added to `.gitignore`)

Data flow is secure: Browser → Next.js API Routes → Strava API → JSON response to browser.

## Development

```bash
# Dev server
npm run dev

# Build for production
npm run build

# Production server
npm start

# Linting
npm run lint
```

## Documentation

- [SETUP.md](SETUP.md) - Initial setup & running locally
- [GET_CREDENTIALS.md](GET_CREDENTIALS.md) - Strava OAuth setup
- [DEPLOY.md](DEPLOY.md) - Deploy to Vercel with custom domain
- [STYLE.md](STYLE.md) - Design system & colors
- [CACHING.md](CACHING.md) - LocalStorage caching strategy

## Rate Limits

Strava allows:
- **200 requests** per 15 minutes
- **2,000 requests** per day

This app uses 5-minute server-side caching to stay well under limits.

## License

MIT
