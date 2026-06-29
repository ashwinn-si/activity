'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Trophy, Ruler, Timer, Zap, Mountain, TrendingUp } from 'lucide-react';
import useStravaStore from '@/store/useStravaStore';
import { getSportMeta } from '@/utils/sportConfig';
import { formatDistance, formatDuration, formatPace, formatSpeed } from '@/utils/formatters';
import { Skeleton } from '@/components/ui/Skeleton';

interface ActivitySummary {
  id: number;
  name: string;
  type: string;
  distance: number;
  moving_time: number;
  elevation_gain: number;
  start_date: string;
  average_speed: number;
  max_speed: number;
}

interface PR {
  label: string;
  value: string;
  sub: string;
  icon: React.ComponentType<{ className?: string }>;
  activityId: number;
  activityName: string;
  date: string;
}

function computePRs(activities: ActivitySummary[], type: string): PR[] {
  const meta = getSportMeta(type);
  const list = activities.filter((a) => a.type === type && a.distance > 0);
  if (list.length === 0) return [];

  const prs: PR[] = [];

  // Longest distance
  const longest = list.reduce((b, a) => (a.distance > b.distance ? a : b), list[0]);
  prs.push({
    label: 'Longest Distance',
    value: formatDistance(longest.distance),
    sub: formatDuration(longest.moving_time),
    icon: Ruler,
    activityId: longest.id,
    activityName: longest.name,
    date: longest.start_date,
  });

  // Best pace or speed — generic based on sport meta
  const fastest = list.reduce((b, a) => (a.average_speed > b.average_speed ? a : b), list[0]);
  if (fastest.average_speed > 0) {
    prs.push({
      label: meta.usePace ? 'Best Avg Pace' : 'Best Avg Speed',
      value: meta.usePace ? formatPace(fastest.average_speed) : formatSpeed(fastest.average_speed),
      sub: formatDistance(fastest.distance),
      icon: Zap,
      activityId: fastest.id,
      activityName: fastest.name,
      date: fastest.start_date,
    });
  }

  // Top speed (for non-pace sports)
  if (!meta.usePace) {
    const topSpeed = list.reduce((b, a) => (a.max_speed > b.max_speed ? a : b), list[0]);
    if (topSpeed.max_speed > 0) {
      prs.push({
        label: 'Top Speed',
        value: formatSpeed(topSpeed.max_speed),
        sub: formatDistance(topSpeed.distance),
        icon: Zap,
        activityId: topSpeed.id,
        activityName: topSpeed.name,
        date: topSpeed.start_date,
      });
    }
  }

  // Most elevation
  const hilliest = list.reduce((b, a) => (a.elevation_gain > b.elevation_gain ? a : b), list[0]);
  if (hilliest.elevation_gain > 0) {
    prs.push({
      label: 'Most Elevation',
      value: `${Math.round(hilliest.elevation_gain)} m`,
      sub: formatDistance(hilliest.distance),
      icon: Mountain,
      activityId: hilliest.id,
      activityName: hilliest.name,
      date: hilliest.start_date,
    });
  }

  // Longest duration
  const longestTime = list.reduce((b, a) => (a.moving_time > b.moving_time ? a : b), list[0]);
  prs.push({
    label: 'Longest Duration',
    value: formatDuration(longestTime.moving_time),
    sub: formatDistance(longestTime.distance),
    icon: Timer,
    activityId: longestTime.id,
    activityName: longestTime.name,
    date: longestTime.start_date,
  });

  return prs;
}

function PRCard({ pr, hex }: { pr: PR; hex: string }) {
  const Icon = pr.icon;
  return (
    <motion.div whileHover={{ y: -2 }} transition={{ type: 'spring', stiffness: 300, damping: 22 }}>
      <Link href={`/activities/${pr.activityId}`}>
        <div className="glass-panel glass-panel-hover rounded-2xl p-5 cursor-pointer h-full flex flex-col gap-3 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: hex, opacity: 0.7 }} />

          <div className="flex items-start justify-between">
            <div className="p-2 rounded-xl" style={{ background: `${hex}18`, color: hex }}>
              <Icon className="w-4 h-4" />
            </div>
            <Trophy className="w-3.5 h-3.5 opacity-25 text-text-muted" />
          </div>

          <div>
            <p className="text-[10px] uppercase tracking-widest text-text-secondary font-medium mb-1">{pr.label}</p>
            <p className="text-2xl font-mono font-bold text-text-primary leading-none">{pr.value}</p>
            <p className="text-xs text-text-secondary mt-1">{pr.sub}</p>
          </div>

          <div className="mt-auto pt-3 border-t border-border">
            <p className="text-xs font-medium text-text-primary truncate">{pr.activityName}</p>
            <p className="text-[11px] text-text-muted mt-0.5">
              {new Date(pr.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </p>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

function SportSummaryBar({ type, activities }: { type: string; activities: ActivitySummary[] }) {
  const list = activities.filter((a) => a.type === type);
  const totalDist = list.reduce((s, a) => s + a.distance, 0);
  const totalTime = list.reduce((s, a) => s + a.moving_time, 0);
  const totalElev = list.reduce((s, a) => s + a.elevation_gain, 0);
  return (
    <div className="flex flex-wrap gap-4 text-sm text-text-secondary">
      <span><span className="font-semibold text-text-primary">{list.length}</span> sessions</span>
      <span><span className="font-semibold text-text-primary">{formatDistance(totalDist)}</span> total</span>
      <span><span className="font-semibold text-text-primary">{formatDuration(totalTime)}</span> moving</span>
      {totalElev > 0 && (
        <span><span className="font-semibold text-text-primary">{Math.round(totalElev)} m</span> climbed</span>
      )}
    </div>
  );
}

const container = { animate: { transition: { staggerChildren: 0.07 } } };
const itemV = { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0, transition: { duration: 0.3 } } };

export default function RecordsPage() {
  const { activities, loading, fetchAll } = useStravaStore();
  const [activeTab, setActiveTab] = useState<string | null>(null);

  useEffect(() => { if (activities.length === 0) fetchAll(); }, [activities.length, fetchAll]);

  const sportTypes = useMemo(() => [...new Set(activities.map((a) => a.type))].sort(), [activities]);

  useEffect(() => {
    if (!activeTab && sportTypes.length > 0) setActiveTab(sportTypes[0]);
  }, [activeTab, sportTypes]);

  const activeSport = activeTab ?? sportTypes[0] ?? '';
  const meta = getSportMeta(activeSport);
  const Icon = meta.icon;
  const prs = useMemo(() => computePRs(activities as ActivitySummary[], activeSport), [activities, activeSport]);

  return (
    <main className="flex-1 overflow-auto pb-20 lg:pb-6">
      <div className="px-4 md:px-8 lg:px-12 py-6 lg:py-8">

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Trophy className="w-6 h-6 text-accent-pr" />
            <h1 className="text-3xl font-bold tracking-tight">Personal Records</h1>
          </div>
          <p className="text-text-secondary">All-time bests across every sport in your history.</p>
        </motion.div>

        {loading && (
          <div className="space-y-6">
            <Skeleton className="h-14" />
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[1,2,3,4].map((i) => <Skeleton key={i} className="h-44" />)}
            </div>
          </div>
        )}

        {!loading && sportTypes.length === 0 && (
          <div className="glass-panel rounded-2xl p-10 text-center text-text-secondary">
            <Trophy className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p>No activities yet.</p>
          </div>
        )}

        {!loading && sportTypes.length > 0 && (
          <>
            {/* Sport tabs */}
            <motion.div
              initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
              className="glass-panel rounded-2xl p-4 mb-6 flex flex-wrap gap-2"
            >
              {sportTypes.map((type) => {
                const m = getSportMeta(type);
                const SIcon = m.icon;
                const count = activities.filter((a) => a.type === type).length;
                const isActive = activeSport === type;
                return (
                  <button
                    key={type}
                    onClick={() => setActiveTab(type)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 border"
                    style={isActive ? {
                      background: `${m.hex}15`,
                      borderColor: `${m.hex}40`,
                      color: m.hex,
                    } : {
                      background: 'transparent',
                      borderColor: 'transparent',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    <SIcon className="w-4 h-4" />
                    {m.label}
                    <span
                      className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold"
                      style={isActive
                        ? { background: `${m.hex}20`, color: m.hex }
                        : { background: 'var(--border)', color: 'var(--text-muted)' }
                      }
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </motion.div>

            {/* Active sport summary */}
            <motion.div
              key={activeSport + '-summary'} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="glass-panel rounded-2xl p-5 mb-6 flex items-center gap-4"
            >
              <div
                className="p-3 rounded-xl flex-shrink-0"
                style={{ background: `${meta.hex}18`, color: meta.hex }}
              >
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <p className="font-semibold text-text-primary mb-1">{meta.label} Overview</p>
                <SportSummaryBar type={activeSport} activities={activities as ActivitySummary[]} />
              </div>
            </motion.div>

            {/* PR grid */}
            {prs.length > 0 ? (
              <motion.div
                key={activeSport + '-prs'}
                className="grid grid-cols-2 md:grid-cols-3 gap-4"
                variants={container} initial="initial" animate="animate"
              >
                {prs.map((pr) => (
                  <motion.div key={pr.label} variants={itemV}>
                    <PRCard pr={pr} hex={meta.hex} />
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <div className="glass-panel rounded-2xl p-10 text-center text-text-secondary">
                <TrendingUp className="w-10 h-10 mx-auto mb-3 opacity-20" />
                <p>No records yet for {meta.label}.</p>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
