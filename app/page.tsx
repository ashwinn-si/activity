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
  const { athlete, stats, activities, loading, error, fetchAll } =
    useStravaStore();

  const [dateRange, setDateRange] = useState<'7' | '15' | '30' | 'custom'>('7');
  const [customStartDate, setCustomStartDate] = useState<Date>(new Date());
  const [customEndDate, setCustomEndDate] = useState<Date>(new Date());

  const getDateRange = () => {
    const end = new Date();
    let start = new Date();

    if (dateRange === 'custom') {
      return { start: customStartDate, end: customEndDate };
    }

    const days = parseInt(dateRange);
    start.setDate(end.getDate() - days);
    return { start, end };
  };

  const { start: startDate, end: endDate } = getDateRange();

  useEffect(() => {
    // Always fetch fresh data when page opens
    fetchAll(true);
  }, []);

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
            <div className="bg-surface border border-border rounded-xl p-4 mb-4">
              <p className="text-sm mb-3">Steps:</p>
              <ol className="text-sm text-text-secondary space-y-2 list-decimal list-inside">
                <li>Get Strava API credentials from <a href="https://www.strava.com/settings/api" className="text-accent-ride hover:underline">strava.com/settings/api</a></li>
                <li>Check <code className="bg-muted px-2 py-1 rounded text-xs">GET_CREDENTIALS.md</code> for detailed instructions</li>
                <li>Update <code className="bg-muted px-2 py-1 rounded text-xs">.env.local</code> with your credentials</li>
                <li>Restart the dev server</li>
              </ol>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-accent-ride text-white rounded-lg text-sm hover:opacity-90"
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

          {/* Refresh Button */}
          <button
            onClick={() => fetchAll(true)}
            disabled={loading}
            className="p-2 rounded-lg border border-border text-text-secondary hover:text-text-primary hover:border-accent-ride disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Refresh data from Strava"
          >
            <RotateCw
              className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`}
            />
          </button>
        </div>

        {/* Date Range Selector */}
        {!loading && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="bg-surface border border-border rounded-2xl p-4">
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-text-secondary" />
                  <span className="text-sm text-text-secondary">Period:</span>
                </div>

                {(['7', '15', '30'] as const).map(days => (
                  <button
                    key={days}
                    onClick={() => setDateRange(days as '7' | '15' | '30')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      dateRange === days
                        ? 'bg-accent-ride text-white'
                        : 'bg-muted text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    Last {days} days
                  </button>
                ))}

                <button
                  onClick={() => setDateRange('custom')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    dateRange === 'custom'
                      ? 'bg-accent-ride text-white'
                      : 'bg-muted text-text-secondary hover:text-text-primary'
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
                  className="mt-4 pt-4 border-t border-border flex gap-3"
                >
                  <input
                    type="date"
                    value={customStartDate.toISOString().split('T')[0]}
                    onChange={(e) => setCustomStartDate(new Date(e.target.value))}
                    className="px-3 py-2 bg-muted text-text-primary rounded-lg text-sm border border-border focus:outline-none"
                  />
                  <span className="text-text-secondary">to</span>
                  <input
                    type="date"
                    value={customEndDate.toISOString().split('T')[0]}
                    onChange={(e) => setCustomEndDate(new Date(e.target.value))}
                    className="px-3 py-2 bg-muted text-text-primary rounded-lg text-sm border border-border focus:outline-none"
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
                    className="bg-surface border border-border rounded-xl p-4 flex items-center gap-4"
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
