# Strava Hub — User Guide

A personal dashboard for all your Strava activities: runs, rides, walks, swims, hikes, gym sessions, and any other sport you track. Visualize splits, compare sessions head-to-head, and track personal records across every sport type.

---

## Prerequisites

- A [Strava](https://www.strava.com) account with some recorded activities
- Node.js 18+ installed
- A MongoDB Atlas cluster (free tier is enough)

---

## 1. Get Strava API Credentials

1. Go to [strava.com/settings/api](https://www.strava.com/settings/api) and create an application.
   - **App Name**: anything (e.g. "My Hub")
   - **Website**: `http://localhost`
   - **Authorization Callback Domain**: `localhost`

2. Note your **Client ID** and **Client Secret** from the app page.

3. Get your **Refresh Token**:
   - Visit this URL in your browser (replace `YOUR_CLIENT_ID`):
     ```
     https://www.strava.com/oauth/authorize?client_id=YOUR_CLIENT_ID&response_type=code&redirect_uri=http://localhost&approval_prompt=force&scope=activity:read_all
     ```
   - After authorizing, Strava redirects to `http://localhost/?code=XXXX`. Copy the `code` value.
   - Exchange the code for a refresh token:
     ```bash
     curl -X POST https://www.strava.com/oauth/token \
       -d client_id=YOUR_CLIENT_ID \
       -d client_secret=YOUR_CLIENT_SECRET \
       -d code=CODE_FROM_ABOVE \
       -d grant_type=authorization_code
     ```
   - Copy the `refresh_token` from the JSON response.

---

## 2. Set Up MongoDB

1. Create a free cluster at [cloud.mongodb.com](https://cloud.mongodb.com).
2. Create a database named `strava_cache` (or any name — the app creates collections automatically).
3. Get your connection string from **Connect → Drivers**. It looks like:
   ```
   mongodb+srv://user:password@cluster.mongodb.net/strava_cache
   ```

---

## 3. Configure Environment Variables

Create a `.env.local` file in the project root:

```env
STRAVA_CLIENT_ID=your_client_id
STRAVA_CLIENT_SECRET=your_client_secret
STRAVA_REFRESH_TOKEN=your_refresh_token
MONGODB_URI=your_mongodb_connection_string
```

---

## 4. Run the App

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Features

### Dashboard
Overview of your recent activity and running totals (distance, time, elevation) across all sport types.

### Activities
Full list of all your Strava activities with distance, time, pace/speed, and elevation. Click any activity to open its detail page.

### Activity Detail
Each activity shows:
- **Key stats**: distance, moving time, avg pace/speed, max speed, heart rate
- **Pace / Speed chart**: velocity over distance
- **Elevation chart**: terrain profile
- **Heart rate chart**: HR over distance (if your device records it)
- **Km Split Table**: time per kilometre with fastest/slowest tags and trend arrows
- **Best Efforts**: fastest times over standard distances (400 m, 1 km, 1 mile, 5 km, 10 km, half-marathon, marathon) — shown for any distance-based sport

### Stats
Aggregate charts — weekly/monthly distance trends and sport breakdowns.

### Records
Personal bests per sport type. Tabs are generated dynamically from your actual activity history, so any new sport you record on Strava (swimming, yoga, climbing, etc.) automatically gets its own tab.

PRs tracked per sport:
- Longest distance
- Best average pace or speed (pace for running/walking/swimming, speed for cycling/etc.)
- Top speed (for speed-based sports)
- Most elevation gained
- Longest duration

### Compare
Compare two sessions of the same sport side-by-side:
1. Pick a sport type
2. Select Session A and Session B
3. See split-by-split breakdown, stat comparison with winner highlighting, and overlay charts (pace, heart rate, elevation)

### Dark / Light Mode
Toggle in the bottom-left of the sidebar (desktop) or via the theme button.

---

## Data Caching

Strava API responses are cached in MongoDB for 15 minutes to avoid hitting rate limits. To force a fresh fetch, add `?refresh=true` to any page URL.

---

## Deployment

The easiest way to deploy is [Vercel](https://vercel.com):

```bash
npx vercel
```

Set the same four environment variables in your Vercel project settings under **Settings → Environment Variables**.
