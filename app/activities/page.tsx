'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import useStravaStore from '@/store/useStravaStore';
import { ActivityCard } from '@/components/cards/ActivityCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { Filter, RotateCw } from 'lucide-react';
import { useInView } from 'react-intersection-observer';

const container = {
  animate: {
    transition: {
      staggerChildren: 0.07,
    },
  },
};

const item = {
  initial: { opacity: 0, y: 20 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35 },
  },
};

const ITEMS_PER_PAGE = 10;

export default function ActivitiesPage() {
  const { activities, loading, error, fetchAll } = useStravaStore();
  const [sportFilter, setSportFilter] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'date' | 'distance' | 'elevation'>('date');
  const [currentPage, setCurrentPage] = useState(1);

  const { ref } = useInView({
    threshold: 0,
    rootMargin: '400px',
    onChange: (inView) => {
      if (inView && currentPage < totalPages) {
        setCurrentPage((prev) => prev + 1);
      }
    },
  });

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const filteredActivities = useMemo(() => {
    let filtered = activities;

    if (sportFilter) {
      filtered = filtered.filter((a) => a.type === sportFilter);
    }

    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'distance':
          return b.distance - a.distance;
        case 'elevation':
          return b.elevation_gain - a.elevation_gain;
        case 'date':
        default:
          return new Date(b.start_date).getTime() - new Date(a.start_date).getTime();
      }
    });
  }, [activities, sportFilter, sortBy]);

  const totalPages = Math.ceil(filteredActivities.length / ITEMS_PER_PAGE);
  const paginatedActivities = filteredActivities.slice(
    0,
    currentPage * ITEMS_PER_PAGE
  );

  const sportTypes = [...new Set(activities.map((a) => a.type))];

  // Helper function to update sport filter and reset page index to 1
  const handleSportFilterChange = (sport: string | null) => {
    setSportFilter(sport);
    setCurrentPage(1);
  };

  // Helper function to update sort and reset page index to 1
  const handleSortChange = (newSortBy: 'date' | 'distance' | 'elevation') => {
    setSortBy(newSortBy);
    setCurrentPage(1);
  };

  if (error) {
    return (
      <div className="p-6">
        <EmptyState title="Error loading activities" description={error} />
      </div>
    );
  }

  return (
    <main className="flex-1 overflow-auto pb-20 lg:pb-6">
      <div className="px-4 md:px-8 lg:px-12 py-6 lg:py-8">
        <div className="flex items-center justify-between mb-6 gap-4">
          <h1 className="text-3xl font-bold tracking-tight">Activities</h1>
          <button
            onClick={() => fetchAll()}
            disabled={loading}
            className="p-2.5 rounded-xl border border-white/5 bg-white/5 text-text-secondary hover:text-text-primary hover:bg-white/10 hover:border-accent-ride/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
            title="Refresh activities from Strava"
          >
            <RotateCw
              className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`}
            />
          </button>
        </div>

        {/* Filter Bar */}
        {!loading && activities.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 glass-panel rounded-2xl p-4"
          >
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2 mr-1">
                <Filter className="w-4 h-4 text-accent-ride/80" />
                <span className="text-sm font-medium text-text-secondary">Sport:</span>
              </div>

              <button
                onClick={() => handleSportFilterChange(null)}
                className={`px-4 py-1.5 rounded-xl text-sm font-medium transition-all duration-300 ${
                  sportFilter === null
                    ? 'bg-accent-ride/25 text-text-primary border border-accent-ride/40 shadow-sm'
                    : 'bg-white/5 text-text-secondary hover:text-text-primary hover:bg-white/10 border border-transparent'
                }`}
              >
                All
              </button>

              {sportTypes.map((sport) => (
                <button
                  key={sport}
                  onClick={() => handleSportFilterChange(sport)}
                  className={`px-4 py-1.5 rounded-xl text-sm font-medium transition-all duration-300 ${
                    sportFilter === sport
                      ? 'bg-accent-ride/25 text-text-primary border border-accent-ride/40 shadow-sm'
                      : 'bg-white/5 text-text-secondary hover:text-text-primary hover:bg-white/10 border border-transparent'
                  }`}
                >
                  {sport}
                </button>
              ))}

              <div className="ml-auto flex items-center gap-2">
                <span className="text-sm font-medium text-text-secondary">Sort:</span>
                <select
                  value={sortBy}
                  onChange={(e) => handleSortChange(e.target.value as 'date' | 'distance' | 'elevation')}
                  className="bg-white/5 text-text-primary rounded-xl px-3 py-1.5 text-sm border border-white/5 focus:outline-none focus:border-accent-ride/40 transition-colors"
                >
                  <option value="date" className="bg-[#0B0F19]">Latest</option>
                  <option value="distance" className="bg-[#0B0F19]">Distance</option>
                  <option value="elevation" className="bg-[#0B0F19]">Elevation</option>
                </select>
              </div>
            </div>
          </motion.div>
        )}

        {/* Activities Grid */}
        {loading ? (
          <div className="grid gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        ) : paginatedActivities.length > 0 ? (
          <>
            <motion.div
              className="grid gap-4 mb-6"
              variants={container}
              initial="initial"
              animate="animate"
            >
              {paginatedActivities.map((activity) => (
                <motion.div key={activity.id} variants={item}>
                  <ActivityCard activity={activity} />
                </motion.div>
              ))}
            </motion.div>

            {/* Infinite Scroll Trigger */}
            {currentPage < totalPages && (
              <div ref={ref} className="py-8 flex justify-center">
                <div className="w-8 h-8 rounded-full border-2 border-accent-ride/20 border-t-accent-ride animate-spin" />
              </div>
            )}
          </>
        ) : (
          <EmptyState
            title={sportFilter ? 'No activities found' : 'No activities yet'}
            description={sportFilter ? `Try adjusting your filters` : 'Your activities will appear here'}
          />
        )}
      </div>
    </main>
  );
}
