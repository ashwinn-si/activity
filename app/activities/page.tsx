'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import useStravaStore from '@/store/useStravaStore';
import { ActivityCard } from '@/components/cards/ActivityCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { Badge } from '@/components/ui/Badge';
import { Filter, ChevronLeft, ChevronRight, RotateCw } from 'lucide-react';

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

  useEffect(() => {
    // Always fetch fresh data when page opens
    fetchAll(true);
  }, []);

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
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const sportTypes = [...new Set(activities.map((a) => a.type))];

  // Reset to page 1 when filter/sort changes
  useEffect(() => {
    setCurrentPage(1);
  }, [sportFilter, sortBy]);

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
            onClick={() => fetchAll(true)}
            disabled={loading}
            className="p-2 rounded-lg border border-border text-text-secondary hover:text-text-primary hover:border-accent-ride disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
            className="mb-6 bg-surface border border-border rounded-2xl p-4"
          >
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-text-secondary" />
                <span className="text-sm text-text-secondary">Sport:</span>
              </div>

              <button
                onClick={() => setSportFilter(null)}
                className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                  sportFilter === null
                    ? 'bg-accent-ride text-white'
                    : 'bg-muted text-text-secondary hover:text-text-primary'
                }`}
              >
                All
              </button>

              {sportTypes.map((sport) => (
                <button
                  key={sport}
                  onClick={() => setSportFilter(sport)}
                  className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                    sportFilter === sport
                      ? 'bg-accent-ride text-white'
                      : 'bg-muted text-text-secondary hover:text-text-primary'
                  }`}
                >
                  {sport}
                </button>
              ))}

              <div className="ml-auto flex items-center gap-2">
                <span className="text-sm text-text-secondary">Sort:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-muted text-text-primary rounded-lg px-3 py-1 text-sm border border-border focus:outline-none"
                >
                  <option value="date">Latest</option>
                  <option value="distance">Distance</option>
                  <option value="elevation">Elevation</option>
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

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-center gap-2"
              >
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg border border-border text-text-secondary hover:text-text-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                        currentPage === page
                          ? 'bg-accent-ride text-white'
                          : 'bg-muted text-text-secondary hover:text-text-primary'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg border border-border text-text-secondary hover:text-text-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </motion.div>
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
