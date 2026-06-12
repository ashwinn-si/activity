'use client';

import { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import useStravaStore from '@/store/useStravaStore';
import { StatCard } from '@/components/cards/StatCard';
import { ActivityCard } from '@/components/cards/ActivityCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { formatDistance, formatDuration } from '@/utils/formatters';
import { TrendingUp, Clock, Mountain, Calendar, Bike, Footprints, PersonStanding, Waves, Dumbbell, Wind, Activity, RotateCw } from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';

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

export default function Dashboard() {
  const { athlete, activities, loading, error, fetchAll } =
    useStravaStore();

  const [dateRange, setDateRange] = useState<'7' | '15' | '30' | 'custom'>('7');
  const [customStartDate, setCustomStartDate] = useState<Date>(new Date());
  const [customEndDate, setCustomEndDate] = useState<Date>(new Date());

  const getDateRange = () => {
    const end = new Date();
    const start = new Date();

    if (dateRange === 'custom') {
      return { start: customStartDate, end: customEndDate };
    }

    const days = parseInt(dateRange);
    start.setDate(end.getDate() - days);
    return { start, end };
  };

  const { start: startDate, end: endDate } = getDateRange();

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const filteredActivities = useMemo(() => {
    return activities.filter(a => {
      const actDate = new Date(a.start_date);
      return actDate >= startDate && actDate <= endDate;
    });
  }, [activities, startDate, endDate]);

  const activityStats = useMemo(() => {
    const stats: Record<string, { distance: number; time: number }> = {};
    filteredActivities.forEach(a => {
      if (!stats[a.type]) stats[a.type] = { distance: 0, time: 0 };
      stats[a.type].distance += a.distance || 0;
      stats[a.type].time += a.moving_time || 0;
    });
    return stats;
  }, [filteredActivities]);

  if (error) {
    return (
      <main className="flex-1 overflow-auto pb-20 lg:pb-6">
        <div className="px-4 md:px-8 lg:px-12 py-6 lg:py-8">
          <div className="max-w-md">
            <h1 className="text-2xl font-bold mb-3">Setup Required</h1>
            <p className="text-text-secondary mb-4">{error}</p>
            <div className="glass-panel rounded-xl p-4 mb-4">
              <p className="text-sm mb-3">Steps:</p>
              <ol className="text-sm text-text-secondary space-y-2 list-decimal list-inside">
                <li>Get Strava API credentials from <a href="https://www.strava.com/settings/api" className="text-accent-ride hover:underline font-semibold">strava.com/settings/api</a></li>
                <li>Check <code className="bg-white/5 border border-white/5 px-2 py-1 rounded text-xs">GET_CREDENTIALS.md</code> for detailed instructions</li>
                <li>Update <code className="bg-white/5 border border-white/5 px-2 py-1 rounded text-xs">.env.local</code> with your credentials</li>
                <li>Restart the dev server</li>
              </ol>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="px-5 py-2.5 bg-accent-ride/20 text-text-primary border border-accent-ride/30 rounded-xl text-sm font-medium hover:bg-accent-ride/30 transition-all duration-300 shadow-sm"
            >
              Retry
            </button>
          </div>
        </div>
      </main>
    );
  }

  const recentActivities = Array.isArray(activities) ? activities.slice(0, 5) : [];

  return (
    <main className="flex-1 overflow-auto pb-20 lg:pb-6">
      <div className="px-4 md:px-8 lg:px-12 py-6 lg:py-8">
        {/* Hero Header */}
        <div className="flex items-start justify-between gap-4 mb-8">
          <div className="flex-1">
            {loading && !athlete ? (
              <>
                <Skeleton className="h-12 w-48 mb-2" />
                <Skeleton className="h-4 w-64" />
              </>
            ) : athlete ? (
              <motion.div>
                <h1 className="text-3xl font-bold tracking-tight mb-1">
                  {athlete.firstname} {athlete.lastname}
                </h1>
                <p className="text-text-secondary">
                  {athlete.city}, {athlete.state} {athlete.country}
                </p>
              </motion.div>
            ) : null}
          </div>

          {/* Refresh Button & Theme Toggle */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchAll()}
              disabled={loading}
              className="p-2.5 rounded-xl border border-white/5 bg-white/5 text-text-secondary hover:text-text-primary hover:bg-white/10 hover:border-accent-ride/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
              title="Refresh data from Strava"
            >
              <RotateCw
                className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`}
              />
            </button>
            <ThemeToggle />
          </div>
        </div>

        {/* Date Range Selector */}
        {!loading && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="glass-panel rounded-2xl p-4">
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-2 mr-1">
                  <Calendar className="w-4 h-4 text-accent-ride/80" />
                  <span className="text-sm font-medium text-text-secondary">Period:</span>
                </div>

                {(['7', '15', '30'] as const).map(days => (
                  <button
                    key={days}
                    onClick={() => setDateRange(days as '7' | '15' | '30')}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
                      dateRange === days
                        ? 'bg-accent-ride/25 text-text-primary border border-accent-ride/40 shadow-sm'
                        : 'bg-white/5 text-text-secondary hover:text-text-primary hover:bg-white/10 border border-transparent'
                    }`}
                  >
                    Last {days} days
                  </button>
                ))}

                <button
                  onClick={() => setDateRange('custom')}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
                    dateRange === 'custom'
                      ? 'bg-accent-ride/25 text-text-primary border border-accent-ride/40 shadow-sm'
                      : 'bg-white/5 text-text-secondary hover:text-text-primary hover:bg-white/10 border border-transparent'
                  }`}
                >
                  Custom
                </button>
              </div>

              {dateRange === 'custom' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4 pt-4 border-t border-white/5 flex items-center gap-3"
                >
                  <input
                    type="date"
                    value={customStartDate.toISOString().split('T')[0]}
                    onChange={(e) => setCustomStartDate(new Date(e.target.value))}
                    className="px-3 py-2 bg-white/5 text-text-primary rounded-xl text-sm border border-white/5 focus:outline-none focus:border-accent-ride/40 transition-colors"
                  />
                  <span className="text-text-secondary text-sm">to</span>
                  <input
                    type="date"
                    value={customEndDate.toISOString().split('T')[0]}
                    onChange={(e) => setCustomEndDate(new Date(e.target.value))}
                    className="px-3 py-2 bg-white/5 text-text-primary rounded-xl text-sm border border-white/5 focus:outline-none focus:border-accent-ride/40 transition-colors"
                  />
                </motion.div>
              )}
            </div>
          </motion.div>
        )}

        {/* Activity Type Summary */}
        {!loading && Object.keys(activityStats).length > 0 && (
          <motion.div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">By Activity Type</h2>
            <motion.div
              className="space-y-3"
              variants={container}
              initial="initial"
              animate="animate"
            >
              {Object.entries(activityStats).map(([type, stats]) => {
                const sportIconMap: Record<string, React.ReactNode> = {
                  Ride: <Bike className="w-6 h-6 text-accent-ride" />,
                  Run: <Footprints className="w-6 h-6 text-accent-run" />,
                  Walk: <PersonStanding className="w-6 h-6 text-accent-walk" />,
                  Swim: <Waves className="w-6 h-6 text-blue-500" />,
                  Hike: <Mountain className="w-6 h-6 text-orange-500" />,
                  Workout: <Dumbbell className="w-6 h-6 text-purple-500" />,
                  EBikeRide: <Bike className="w-6 h-6 text-accent-ride" />,
                  Windsurf: <Wind className="w-6 h-6 text-cyan-500" />,
                };
                const icon = sportIconMap[type] || <TrendingUp className="w-6 h-6 text-text-secondary" />;
                return (
                  <motion.div
                    key={type}
                    variants={item}
                    className="glass-panel glass-panel-hover rounded-xl p-4 flex items-center gap-4"
                  >
                    {icon}
                    <span className="font-semibold min-w-20">{type}</span>
                    <div className="flex items-center gap-6 ml-auto text-sm">
                      <div className="text-right">
                        <p className="text-text-secondary text-xs">Time</p>
                        <p className="text-lg font-mono font-semibold">
                          {formatDuration(stats.time)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-text-secondary text-xs">Distance</p>
                        <p className="text-lg font-mono font-semibold">
                          {formatDistance(stats.distance)}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          </motion.div>
        )}

        {/* Summary Stats */}
        <motion.div className="mb-8">
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
            variants={container}
            initial="initial"
            animate={loading ? 'initial' : 'animate'}
          >
            {loading
              ? [1, 2, 3, 4].map((i) => (
                  <motion.div key={i} variants={item}>
                    <Skeleton className="h-32" />
                  </motion.div>
                ))
              : [
                  {
                    label: `${dateRange === 'custom' ? 'Period' : 'Last ' + dateRange + ' days'} Distance`,
                    value: formatDistance(
                      Object.values(activityStats).reduce((sum, s) => sum + s.distance, 0)
                    ),
                    icon: <TrendingUp className="w-5 h-5" />,
                  },
                  {
                    label: `${dateRange === 'custom' ? 'Period' : 'Last ' + dateRange + ' days'} Time`,
                    value: formatDuration(
                      Object.values(activityStats).reduce((sum, s) => sum + s.time, 0)
                    ),
                    icon: <Clock className="w-5 h-5" />,
                  },
                  {
                    label: `Activities ${dateRange === 'custom' ? 'in Period' : 'Last ' + dateRange + ' days'}`,
                    value: filteredActivities.length,
                    icon: <Activity className="w-5 h-5" />,
                  },
                ].map((stat, idx) => (
                  <motion.div key={idx} variants={item}>
                    <StatCard {...stat} />
                  </motion.div>
                ))}
          </motion.div>
        </motion.div>


        {/* Recent Activities */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        ) : recentActivities.length > 0 ? (
          <motion.div
            variants={container}
            initial="initial"
            animate="animate"
          >
            <h2 className="text-xl font-bold mb-4">Recent Activities</h2>
            <motion.div className="grid gap-4">
              {recentActivities.map((activity) => (
                <motion.div key={activity.id} variants={item}>
                  <ActivityCard activity={activity} />
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        ) : (
          <EmptyState title="No activities yet" />
        )}
      </div>
    </main>
  );
}
