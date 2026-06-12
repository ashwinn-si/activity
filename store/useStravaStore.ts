'use client';

import { create } from 'zustand';

// Cache configuration
const CACHE_CONFIG = {
  ACTIVITIES: { key: 'strava_activities', ttl: 5 * 60 * 1000 }, // 5 mins
  ATHLETE: { key: 'strava_athlete', ttl: 30 * 60 * 1000 }, // 30 mins
  STATS: { key: 'strava_stats', ttl: 60 * 60 * 1000 }, // 1 hour
};

// Cache helpers
const getCache = (key: string) => {
  if (typeof window === 'undefined') return null;
  try {
    const item = localStorage.getItem(key);
    if (!item) return null;

    const { data, timestamp } = JSON.parse(item);
    const config = Object.values(CACHE_CONFIG).find(c => c.key === key);

    if (config && Date.now() - timestamp > config.ttl) {
      localStorage.removeItem(key);
      return null;
    }

    return data;
  } catch {
    return null;
  }
};

const setCache = (key: string, data: unknown) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify({ data, timestamp: Date.now() }));
  } catch (e) {
    console.warn('Failed to cache data:', e);
  }
};

const clearCache = () => {
  if (typeof window === 'undefined') return;
  Object.values(CACHE_CONFIG).forEach(config => {
    localStorage.removeItem(config.key);
  });
};

interface Activity {
  id: number;
  name: string;
  type: string;
  distance: number;
  moving_time: number;
  elapsed_time: number;
  elevation_gain: number;
  start_date: string;
  average_speed: number;
  max_speed: number;
  average_heartrate?: number;
  max_heartrate?: number;
  polyline?: string;
  [key: string]: unknown;
}

interface Athlete {
  id: number;
  firstname: string;
  lastname: string;
  city: string;
  state: string;
  country?: string;
  profile_medium?: string;
  profile?: string;
  created_at: string;
  [key: string]: unknown;
}

interface Stats {
  biggest_climb_elevation_gain: number;
  biggest_ride_distance: number;
  longest_ride_distance: number;
  longest_run_distance: number;
  recent_ride_totals: {
    count: number;
    distance: number;
    moving_time: number;
    elevation_gain: number;
  };
  recent_run_totals: {
    count: number;
    distance: number;
    moving_time: number;
    elevation_gain: number;
  };
  ytd_ride_totals: {
    count: number;
    distance: number;
    moving_time: number;
    elevation_gain: number;
  };
  ytd_run_totals: {
    count: number;
    distance: number;
    moving_time: number;
    elevation_gain: number;
  };
  all_ride_totals: {
    count: number;
    distance: number;
    moving_time: number;
    elevation_gain: number;
  };
  all_run_totals: {
    count: number;
    distance: number;
    moving_time: number;
    elevation_gain: number;
  };
  [key: string]: unknown;
}

interface StravaState {
  athlete: Athlete | null;
  stats: Stats | null;
  activities: Activity[];
  loading: boolean;
  error: string | null;
  fetchAll: (forceRefresh?: boolean) => Promise<void>;
  clearCache: () => void;
}

const useStravaStore = create<StravaState>((set) => ({
  athlete: null,
  stats: null,
  activities: [],
  loading: false,
  error: null,

  clearCache: () => {
    clearCache();
    set({
      athlete: null,
      stats: null,
      activities: [],
      error: null,
    });
  },

  fetchAll: async (forceRefresh = false) => {
    set({ loading: true, error: null });
    try {
      // Load from cache first (unless forced refresh)
      const cachedAthlete = !forceRefresh ? getCache(CACHE_CONFIG.ATHLETE.key) : null;
      const cachedStats = !forceRefresh ? getCache(CACHE_CONFIG.STATS.key) : null;
      const cachedActivities = !forceRefresh ? getCache(CACHE_CONFIG.ACTIVITIES.key) : null;

      // Set cached data immediately (while fetching fresh data)
      if (cachedAthlete || cachedStats || cachedActivities) {
        set({
          athlete: cachedAthlete,
          stats: cachedStats,
          activities: cachedActivities || [],
        });
      }

      // Fetch fresh data from API
      const [athRes, activRes] = await Promise.all([
        fetch('/api/athlete'),
        fetch('/api/activities?per_page=100'),
      ]);

      if (!athRes.ok || !activRes.ok) {
        // If API fails but we have cache, show cached data with error
        if (cachedAthlete || cachedActivities) {
          set({
            error: 'Could not fetch fresh data. Showing cached data.',
            loading: false,
          });
          return;
        }

        throw new Error(
          'Invalid Strava credentials. Check GET_CREDENTIALS.md for setup instructions.'
        );
      }

      const [athResponse, activResponse] = await Promise.all([
        athRes.json(),
        activRes.json(),
      ]);

      // Cache the fresh data
      if (athResponse.athlete && athResponse.stats) {
        setCache(CACHE_CONFIG.ATHLETE.key, {
          athlete: athResponse.athlete,
          stats: athResponse.stats,
        });
      }

      if (Array.isArray(activResponse)) {
        setCache(CACHE_CONFIG.ACTIVITIES.key, activResponse);
      }

      // Update state with fresh data
      set({
        athlete: athResponse.athlete,
        stats: athResponse.stats,
        activities: Array.isArray(activResponse) ? activResponse : [],
        error: null,
      });
    } catch (e: unknown) {
      set({ error: e instanceof Error ? e.message : 'Unknown error' });
    } finally {
      set({ loading: false });
    }
  },
}));

export default useStravaStore;
