# Caching Strategy

LocalStorage caching with automatic TTL expiration for better performance and offline support.

## How It Works

### 1. **Multi-Level Caching**

```
User opens page
    ↓
Always fetch fresh data from Strava API
    ↓
Show cached data while fetching (instant)
    ↓
Update UI with fresh data when ready
    ↓
Cache the fresh data

User clicks Refresh button
    ↓
Force fresh fetch (skip cache)
    ↓
Show spinner while loading
    ↓
Update with latest data
```

### 2. **Cache Tiers**

| Data | TTL | Purpose |
|------|-----|---------|
| **Activities** | 5 minutes | Frequently changes, needs refresh |
| **Athlete Profile** | 30 minutes | Rarely changes |
| **Stats** | 1 hour | Aggregates, less frequent changes |

### 3. **TTL Expiration**

Each cached item stores a timestamp. When accessed:
- ✅ If timestamp + TTL > now → use cache
- ❌ If expired → delete cache, fetch fresh

## Features

### ⚡ Fast Loading
- First visit after cache expires: shows cached data instantly
- Second API call happens in background
- UI updates when fresh data arrives

### 🔄 Automatic Refresh
- Cache validates on every access
- Expired items automatically deleted
- Fresh data fetched and cached

### 🔌 Offline Support
- Works with cached data if API fails
- Shows warning: "Using cached data. Could not reach Strava API."
- Activities still viewable if Strava is down

### 🧹 Smart Clearing
- Call `clearCache()` to manually clear all caches
- Useful after logout or credential changes

## Implementation Details

### Cache Storage Format

```javascript
localStorage['strava_activities'] = {
  data: [...activities],
  timestamp: 1718274000000
}
```

### Cache Keys

```javascript
{
  ATHLETE: {
    key: 'strava_athlete',
    ttl: 30 * 60 * 1000  // 30 mins
  },
  ACTIVITIES: {
    key: 'strava_activities',
    ttl: 5 * 60 * 1000   // 5 mins
  },
  STATS: {
    key: 'strava_stats',
    ttl: 60 * 60 * 1000  // 1 hour
  }
}
```

## Usage

### Page Load (Always Fresh)

When page opens, always fetch fresh data from Strava:

```javascript
const { fetchAll } = useStravaStore();

useEffect(() => {
  fetchAll(true); // true = force fresh (skip cache)
}, []);
```

### Refresh Button (Force Refresh)

User can manually refresh by clicking the ↻ button:

```javascript
<button onClick={() => fetchAll(true)} disabled={loading}>
  <RotateCw className={loading ? 'animate-spin' : ''} />
</button>
```

### Auto-Caching (After First Fetch)

Once data is fetched, it's cached automatically for navigation:

```javascript
const { fetchAll } = useStravaStore();

// First page load: fetches fresh, caches
await fetchAll(true);

// Navigate within app: uses cache (unless expired)
// No forceRefresh = uses cache if valid
```

### Manual Cache Clear

Clear cache when needed:

```javascript
const { clearCache } = useStravaStore();

clearCache(); // Removes all cached data
```

Example: Clear cache after logout
```javascript
function handleLogout() {
  clearCache();
  redirectToLogin();
}
```

## Performance Impact

### With Caching ✅

- **First load**: API response time (e.g., 1s)
- **Reload (cache valid)**: ~100ms (instant from storage)
- **Reload (cache expired)**: Shows old data (100ms) + fetches new in background

### Without Caching ❌

- **Every load**: API response time (e.g., 1s)
- **Poor UX**: Loading spinner every visit

### Benchmark

Typical improvements with caching:

| Scenario | Without Cache | With Cache | Improvement |
|----------|---------------|-----------|-------------|
| Revisit (5 mins) | 1000ms | 100ms | **10x faster** |
| Navigate around | 1000ms × 5 pages | 100ms + 1000ms API | **2-3x faster** |
| Offline | Error | Cached data | **Works!** |

## Best Practices

### ✅ DO

- Let the store handle caching automatically
- Check cache expiry times for your use case
- Clear cache when credentials change

### ❌ DON'T

- Don't manually set localStorage (use store)
- Don't trust old data if you just created activities
- Don't clear cache on every page load

## Troubleshooting

### Data seems stale

1. Check cache TTL for that data type
2. Manually clear: `clearCache()`
3. Or wait for auto-expiry

### Cache not working

```bash
# In browser console:
localStorage.getItem('strava_activities') // Should show data
localStorage.getItem('strava_athlete')    // Should show data
```

### Clear cache (browser)

```javascript
// In console:
localStorage.clear() // ⚠️ Clears ALL local storage

// Or just Strava cache:
['strava_activities', 'strava_athlete', 'strava_stats'].forEach(
  key => localStorage.removeItem(key)
)
```

## Configuration

To adjust cache TTLs, edit `store/useStravaStore.ts`:

```javascript
const CACHE_CONFIG = {
  ACTIVITIES: { key: 'strava_activities', ttl: 5 * 60 * 1000 },   // Change here
  ATHLETE: { key: 'strava_athlete', ttl: 30 * 60 * 1000 },         // Change here
  STATS: { key: 'strava_stats', ttl: 60 * 60 * 1000 },             // Change here
};
```

Examples:
- 10 mins: `10 * 60 * 1000`
- 1 hour: `60 * 60 * 1000`
- 24 hours: `24 * 60 * 60 * 1000`

## Privacy

⚠️ **Note**: Caching stores data in browser localStorage. It's:
- ✅ Local only (not sent to servers)
- ✅ Plaintext in localStorage
- ⚠️ Visible in DevTools
- ⚠️ Not encrypted

For sensitive data, consider clearing cache on logout.
