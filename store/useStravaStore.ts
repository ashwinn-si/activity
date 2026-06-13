'use client';

import { create } from 'zustand';

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
    set({ athlete: null, stats: null, activities: [], error: null });
  },

  fetchAll: async (forceRefresh = false) => {
    set({ loading: true, error: null });
    try {
      const qs = forceRefresh ? '?force=true' : '';

      const [athRes, activRes] = await Promise.all([
        fetch(`/api/athlete${qs}`),
        fetch(`/api/activities${qs}`),
      ]);

      if (!athRes.ok || !activRes.ok) {
        throw new Error(
          'Invalid Strava credentials. Check GET_CREDENTIALS.md for setup instructions.'
        );
      }

      const [athResponse, activResponse] = await Promise.all([
        athRes.json(),
        activRes.json(),
      ]);

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
