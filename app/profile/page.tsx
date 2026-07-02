'use client';

import { useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import useStravaStore from '@/store/useStravaStore';
import { Skeleton } from '@/components/ui/Skeleton';
import { ActivityHeatmap } from '@/components/ActivityHeatmap';
import { getSportMeta } from '@/utils/sportConfig';
import { formatDistance, formatDuration } from '@/utils/formatters';
import { MapPin, Calendar, Award, Zap, TrendingUp, Trophy } from 'lucide-react';

const item = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

function StatTile({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="glass-panel rounded-2xl p-4 flex flex-col gap-1">
      <p className="text-[10px] uppercase tracking-widest font-semibold text-text-secondary">
        {label}
      </p>
      <p className="text-2xl font-bold font-mono text-text-primary">{value}</p>
      {sub && <p className="text-xs text-text-muted">{sub}</p>}
    </div>
  );
}

export default function ProfilePage() {
  const { athlete, activities, stats, loading, fetchAll } = useStravaStore();

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const sportSummary = useMemo(() => {
    const map: Record<string, { count: number; distance: number; time: number }> = {};
    for (const a of activities) {
      if (!map[a.type]) map[a.type] = { count: 0, distance: 0, time: 0 };
      map[a.type].count++;
      map[a.type].distance += a.distance ?? 0;
      map[a.type].time += a.moving_time ?? 0;
    }
    return Object.entries(map).sort((a, b) => b[1].count - a[1].count);
  }, [activities]);

  const memberSince = athlete?.created_at
    ? new Date(athlete.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : null;

  const totalTime = activities.reduce((s, a) => s + (a.moving_time ?? 0), 0);
  const totalDist = activities.reduce((s, a) => s + (a.distance ?? 0), 0);

  if (loading && !athlete) {
    return (
      <main className="flex-1 overflow-auto pb-20 lg:pb-6">
        <div className="px-4 md:px-8 lg:px-12 py-6 lg:py-8 space-y-6">
          <Skeleton className="h-48" />
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
          <Skeleton className="h-64" />
          <Skeleton className="h-72" />
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 overflow-auto pb-20 lg:pb-6">
      <div className="px-4 md:px-8 lg:px-12 py-6 lg:py-8 space-y-6 w-full">
        {/* ── Profile hero ── */}
        <motion.div
          variants={item}
          initial="initial"
          animate="animate"
          className="glass-panel rounded-2xl p-6"
        >
          <div className="flex items-start gap-5 flex-wrap">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              {athlete?.profile && athlete.profile.startsWith('https') ? (
                <Image
                  src={athlete.profile}
                  alt="Profile"
                  width={96}
                  height={96}
                  className="w-24 h-24 rounded-2xl object-cover ring-2 ring-border"
                  onError={e => {
                    (e.currentTarget as HTMLImageElement).style.display = 'none';
                  }}
                />
              ) : null}
              <div
                className="w-24 h-24 rounded-2xl flex items-center justify-center text-2xl font-bold text-white select-none"
                style={{
                  background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                  position: athlete?.profile?.startsWith('http') ? 'absolute' : 'relative',
                  inset: 0,
                  zIndex: -1,
                }}
              >
                {athlete
                  ? `${athlete.firstname?.[0] ?? ''}${athlete.lastname?.[0] ?? ''}`.toUpperCase() ||
                    '?'
                  : '?'}
              </div>
              <div className="absolute -bottom-1.5 -right-1.5 w-5 h-5 rounded-full bg-emerald-500 border-2 border-background" />
            </div>

            {/* Name + meta */}
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold tracking-tight">
                {athlete ? `${athlete.firstname} ${athlete.lastname}` : '—'}
              </h1>
              <div className="mt-2 flex flex-wrap gap-3 text-sm text-text-secondary">
                {(athlete?.city || athlete?.state) && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />
                    {[athlete.city, athlete.state, athlete.country].filter(Boolean).join(', ')}
                  </span>
                )}
                {memberSince && (
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    Member since {memberSince}
                  </span>
                )}
              </div>
              <div className="mt-4 flex flex-wrap gap-6">
                {[
                  { label: 'Activities', value: activities.length },
                  { label: 'Total Distance', value: formatDistance(totalDist) },
                  { label: 'Total Time', value: formatDuration(totalTime) },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <p className="text-xl font-bold font-mono">{value}</p>
                    <p className="text-[11px] text-text-muted uppercase tracking-wider mt-0.5">
                      {label}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── Year to Date (from Strava stats API) ── */}
        {stats && (
          <motion.div variants={item} initial="initial" animate="animate">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-4 h-4 text-text-secondary" />
              <h2 className="font-semibold text-text-primary">Year to Date</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatTile
                label="Ride Distance"
                value={formatDistance(stats.ytd_ride_totals.distance)}
                sub={`${stats.ytd_ride_totals.count} rides`}
              />
              <StatTile
                label="Ride Time"
                value={formatDuration(stats.ytd_ride_totals.moving_time)}
              />
              <StatTile
                label="Run Distance"
                value={formatDistance(stats.ytd_run_totals.distance)}
                sub={`${stats.ytd_run_totals.count} runs`}
              />
              <StatTile label="Run Time" value={formatDuration(stats.ytd_run_totals.moving_time)} />
            </div>
          </motion.div>
        )}

        {/* ── All-time bests ── */}
        {stats && (
          <motion.div variants={item} initial="initial" animate="animate">
            <div className="flex items-center gap-2 mb-3">
              <Trophy className="w-4 h-4 text-text-secondary" />
              <h2 className="font-semibold text-text-primary">All-Time Bests</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatTile
                label="Longest Ride"
                value={
                  stats.biggest_ride_distance ? formatDistance(stats.biggest_ride_distance) : '—'
                }
              />
              <StatTile
                label="Longest Run"
                value={
                  stats.longest_run_distance ? formatDistance(stats.longest_run_distance) : '—'
                }
              />
              <StatTile
                label="Biggest Climb"
                value={
                  stats.biggest_climb_elevation_gain
                    ? `${Math.round(stats.biggest_climb_elevation_gain)} m`
                    : '—'
                }
              />
              <StatTile
                label="Total Logged"
                value={stats.all_ride_totals.count + stats.all_run_totals.count}
                sub="activities ever"
              />
            </div>
          </motion.div>
        )}

        {/* ── All-time totals ── */}
        {stats && (
          <motion.div variants={item} initial="initial" animate="animate">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-4 h-4 text-text-secondary" />
              <h2 className="font-semibold text-text-primary">All-Time Totals</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatTile
                label="Total Ride Dist"
                value={formatDistance(stats.all_ride_totals.distance)}
              />
              <StatTile
                label="Total Ride Time"
                value={formatDuration(stats.all_ride_totals.moving_time)}
              />
              <StatTile
                label="Total Run Dist"
                value={formatDistance(stats.all_run_totals.distance)}
              />
              <StatTile
                label="Total Run Time"
                value={formatDuration(stats.all_run_totals.moving_time)}
              />
            </div>
          </motion.div>
        )}

        {/* ── Activity breakdown ── */}
        {sportSummary.length > 0 && (
          <motion.div
            variants={item}
            initial="initial"
            animate="animate"
            className="glass-panel rounded-2xl p-6"
          >
            <div className="flex items-center gap-2 mb-4">
              <Award className="w-4 h-4 text-text-secondary" />
              <h2 className="font-semibold text-text-primary">Activity Breakdown</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {sportSummary.map(([type, s]) => {
                const meta = getSportMeta(type);
                const Icon = meta.icon;
                return (
                  <div
                    key={type}
                    className="flex items-center gap-3 rounded-xl p-3 border border-border"
                    style={{ background: `${meta.hex}08` }}
                  >
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: `${meta.hex}18`, color: meta.hex }}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold" style={{ color: meta.hex }}>
                        {meta.label}
                      </p>
                      <p className="text-[11px] text-text-secondary mt-0.5">
                        {s.count} session{s.count !== 1 ? 's' : ''} · {formatDistance(s.distance)}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs font-mono text-text-primary">
                        {formatDuration(s.time)}
                      </p>
                      <p className="text-[10px] text-text-muted">total time</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* ── Heatmap ── */}
        <motion.div
          variants={item}
          initial="initial"
          animate="animate"
          className="glass-panel rounded-2xl p-6"
        >
          <div className="flex items-center gap-2 mb-5">
            <Zap className="w-4 h-4 text-text-secondary" />
            <h2 className="font-semibold text-text-primary">Activity Heatmap</h2>
          </div>
          <ActivityHeatmap activities={activities} />
        </motion.div>
      </div>
    </main>
  );
}
