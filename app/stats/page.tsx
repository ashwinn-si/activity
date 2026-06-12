'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import useStravaStore from '@/store/useStravaStore';
import { StatCard } from '@/components/cards/StatCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { formatDistance, formatDuration } from '@/utils/formatters';
import { Trophy, TrendingUp, Zap } from 'lucide-react';

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

export default function StatsPage() {
  const { athlete, stats, loading, error, fetchAll } = useStravaStore();

  useEffect(() => {
    fetchAll();
  }, []);

  if (error) {
    return (
      <div className="p-6">
        <EmptyState title="Error loading stats" description={error} />
      </div>
    );
  }

  return (
    <main className="flex-1 overflow-auto pb-20 lg:pb-6">
      <div className="px-4 md:px-8 lg:px-12 py-6 lg:py-8">
        <h1 className="text-3xl font-bold tracking-tight mb-8">Statistics</h1>

        {/* Year to Date */}
        {loading ? (
          <div className="mb-8">
            <Skeleton className="h-8 w-48 mb-4" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-32" />
              ))}
            </div>
          </div>
        ) : stats ? (
          <motion.div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Year to Date</h2>
            <motion.div
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
              variants={container}
              initial="initial"
              animate="animate"
            >
              {[
                {
                  label: 'Ride Distance',
                  value: formatDistance(stats.ytd_ride_totals.distance),
                  icon: <TrendingUp className="w-5 h-5" />,
                },
                {
                  label: 'Run Distance',
                  value: formatDistance(stats.ytd_run_totals.distance),
                  icon: <TrendingUp className="w-5 h-5" />,
                },
                {
                  label: 'Ride Time',
                  value: formatDuration(stats.ytd_ride_totals.moving_time),
                  icon: <TrendingUp className="w-5 h-5" />,
                },
                {
                  label: 'Run Time',
                  value: formatDuration(stats.ytd_run_totals.moving_time),
                  icon: <TrendingUp className="w-5 h-5" />,
                },
              ].map((stat, idx) => (
                <motion.div key={idx} variants={item}>
                  <StatCard {...stat} />
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        ) : null}

        {/* All Time Bests */}
        {loading ? (
          <div className="mb-8">
            <Skeleton className="h-8 w-48 mb-4" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-32" />
              ))}
            </div>
          </div>
        ) : stats ? (
          <motion.div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">All Time Bests</h2>
            <motion.div
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
              variants={container}
              initial="initial"
              animate="animate"
            >
              {[
                {
                  label: 'Longest Ride',
                  value: formatDistance(stats.biggest_ride_distance),
                  icon: <Trophy className="w-5 h-5" />,
                },
                {
                  label: 'Longest Run',
                  value: formatDistance(stats.longest_run_distance),
                  icon: <Trophy className="w-5 h-5" />,
                },
                {
                  label: 'Biggest Climb',
                  value: `${stats.biggest_climb_elevation_gain.toFixed(0)}m`,
                  icon: <Zap className="w-5 h-5" />,
                },
                {
                  label: 'Total Activities',
                  value:
                    stats.all_ride_totals.count +
                    stats.all_run_totals.count,
                  icon: <TrendingUp className="w-5 h-5" />,
                },
              ].map((stat, idx) => (
                <motion.div key={idx} variants={item}>
                  <StatCard {...stat} />
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        ) : null}

        {/* All Time Totals */}
        {loading ? (
          <div>
            <Skeleton className="h-8 w-48 mb-4" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[1, 2].map((i) => (
                <Skeleton key={i} className="h-32" />
              ))}
            </div>
          </div>
        ) : stats ? (
          <motion.div>
            <h2 className="text-xl font-semibold mb-4">All Time Totals</h2>
            <motion.div
              className="grid grid-cols-1 sm:grid-cols-2 gap-4"
              variants={container}
              initial="initial"
              animate="animate"
            >
              {[
                {
                  label: 'Total Ride Distance',
                  value: formatDistance(stats.all_ride_totals.distance),
                },
                {
                  label: 'Total Run Distance',
                  value: formatDistance(stats.all_run_totals.distance),
                },
                {
                  label: 'Total Ride Time',
                  value: formatDuration(stats.all_ride_totals.moving_time),
                },
                {
                  label: 'Total Run Time',
                  value: formatDuration(stats.all_run_totals.moving_time),
                },
              ].map((stat, idx) => (
                <motion.div key={idx} variants={item}>
                  <StatCard {...stat} />
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        ) : null}
      </div>
    </main>
  );
}
