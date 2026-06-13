# Caching Strategy

Server-side MongoDB caching with a 15-minute TTL. The app rarely hits the Strava API — most requests are served from the database.

## How It Works

```
User opens page
    ↓
API route checks CacheMetadata.lastRefreshed
    ↓
< 15 min old? → Return from MongoDB (fast)
> 15 min old? → Fetch from Strava → Upsert MongoDB → Update lastRefreshed → Return
    ↓
User clicks Refresh button
    ↓
?force=true → Always fetch from Strava → Update MongoDB
```

## Cache Tiers

| Data | TTL | Collection |
|------|-----|------------|
| **Activities list** | 15 minutes | `activities` + `cachemetadatas` |
| **Athlete + Stats** | 15 minutes | `athletecaches` + `cachemetadatas` |
| **Activity detail + streams** | Permanent | `activitydetailcaches` |

Activity detail and streams are cached permanently — Strava streams are immutable after an activity is saved. Use the refresh button (`?force=true`) to re-fetch a specific activity if needed.

## MongoDB Collections

| Collection | Key | Purpose |
|---|---|---|
| `activities` | `stravaId` (unique) | Full activity list with `raw` Strava payload |
| `athletecaches` | `singleton: 'athlete'` | Athlete profile + stats (one doc) |
| `activitydetailcaches` | `stravaId` (unique) | Individual activity + stream data |
| `cachemetadatas` | `{ type, stravaId }` | Tracks `lastRefreshed` per data type |

## Force Refresh

The refresh button on the dashboard always passes `?force=true` to the API, bypassing the TTL check and re-fetching from Strava.

```typescript
// In store/useStravaStore.ts
fetchAll(true)  // force=true → appends ?force=true to API requests
```

Any API route also accepts `?force=true` directly:
```
GET /api/activities?force=true
GET /api/athlete?force=true
GET /api/activities/[id]?force=true
```

## Implementation

- **`lib/mongodb.ts`** — Mongoose connection singleton + `isCacheStale()` helper
- **`models/CacheMetadata.ts`** — TTL metadata per collection type
- **`models/Activity.ts`** — Activity documents (upserted via `bulkWrite`)
- **`models/AthleteCache.ts`** — Single athlete + stats document
- **`models/ActivityDetailCache.ts`** — Activity detail + streams

## Configuration

TTL is set in `lib/mongodb.ts`:

```typescript
const TTL_MS = 15 * 60 * 1000; // 15 minutes
```

## Troubleshooting

### Data seems stale
Click the ↻ refresh button — forces a Strava API call and updates MongoDB.

### Force-expire cache manually
In MongoDB Atlas or shell:
```js
db.cachemetadatas.updateOne(
  { type: 'activities' },
  { $set: { lastRefreshed: new Date(0) } }
)
```
Next page load will re-fetch from Strava.

### Verify cache is working
Check `lastRefreshed` in `cachemetadatas` collection — it should only update every 15+ minutes during normal use.
