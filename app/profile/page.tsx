'use client';

import { useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import useStravaStore from '@/store/useStravaStore';
import { Skeleton } from '@/components/ui/Skeleton';
import { ActivityHeatmap } from '@/components/ActivityHeatmap';
import { getSportMeta } from '@/utils/sportConfig';
import { formatDistance, formatDuration } from '@/utils/formatters';
import { MapPin, Calendar, Award, Zap } from 'lucide-react';

const item = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

export default function ProfilePage() {
  const { athlete, activities, loading, fetchAll } = useStravaStore();

  useEffect(() => { fetchAll(); }, [fetchAll]);

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
          <Skeleton className="h-64" />
          <Skeleton className="h-96" />
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 overflow-auto pb-20 lg:pb-6">
      <div className="px-4 md:px-8 lg:px-12 py-6 lg:py-8 space-y-6 max-w-5xl">

        {/* ── Profile hero ── */}
        <motion.div variants={item} initial="initial" animate="animate"
          className="glass-panel rounded-2xl p-6"
        >
          <div className="flex items-start gap-5 flex-wrap">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              {athlete?.profile ? (
                <Image
                  src={athlete.profile}
                  alt="Profile"
                  width={96}
                  height={96}
                  className="w-24 h-24 rounded-2xl object-cover ring-2 ring-border"
                />
              ) : (
                <div className="w-24 h-24 rounded-2xl bg-muted flex items-center justify-center text-3xl font-bold text-text-secondary">
                  {athlete?.firstname?.[0] ?? '?'}
                </div>
              )}
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

              {/* Quick totals */}
              <div className="mt-4 flex flex-wrap gap-4">
                {[
                  { label: 'Activities', value: activities.length },
                  { label: 'Total Distance', value: formatDistance(totalDist) },
                  { label: 'Total Time', value: formatDuration(totalTime) },
                ].map(({ label, value }) => (
                  <div key={label} className="text-center">
                    <p className="text-xl font-bold font-mono">{value}</p>
                    <p className="text-[11px] text-text-muted uppercase tracking-wider mt-0.5">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── Sport breakdown ── */}
        {sportSummary.length > 0 && (
          <motion.div variants={item} initial="initial" animate="animate"
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
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: `${meta.hex}18`, color: meta.hex }}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold" style={{ color: meta.hex }}>{meta.label}</p>
                      <p className="text-[11px] text-text-secondary mt-0.5">
                        {s.count} session{s.count !== 1 ? 's' : ''} · {formatDistance(s.distance)}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs font-mono text-text-primary">{formatDuration(s.time)}</p>
                      <p className="text-[10px] text-text-muted">total time</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* ── Heatmap ── */}
        <motion.div variants={item} initial="initial" animate="animate"
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
