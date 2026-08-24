'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistance, formatDuration, formatSpeed, formatPacePerKm } from '@/utils/formatters';
import { PaceChart } from '@/components/charts/PaceChart';
import { HeartRateChart } from '@/components/charts/HeartRateChart';
import { ElevationChart } from '@/components/charts/ElevationChart';
import { ProgressChart } from '@/components/charts/ProgressChart';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { Badge } from '@/components/ui/Badge';
import { KmSplitTable } from '@/components/KmSplitTable';
import { BestEffortsTable } from '@/components/BestEffortsTable';
import { ArrowLeft, GitCompare, X } from 'lucide-react';
import Link from 'next/link';
import { getSportMeta, getSportBadgeVariant } from '@/utils/sportConfig';
import { fmtActivityTimes } from '@/utils/timeUtils';

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
  photos?: {
    primary?: {
      urls?: {
        '100'?: string;
        '600'?: string;
      };
    };
  };
  [key: string]: unknown;
}

interface StreamData {
  data: number[];
  original_size?: number;
  resolution?: string;
  series_type?: string;
}

interface Streams {
  distance?: StreamData;
  time?: StreamData;
  heartrate?: StreamData;
  altitude?: StreamData;
  velocity_smooth?: StreamData;
  [key: string]: StreamData | undefined;
}

const container = {
  animate: {
    transition: {
      staggerChildren: 0.1,
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

function HeartRateZones({
  hrData,
  timeData,
  maxHR,
}: {
  hrData: number[];
  timeData: number[];
  maxHR: number;
}) {
  const zones = [
    { name: 'Z1 Active Recovery', range: '50% - 60%', minPct: 0.5, maxPct: 0.6, color: '#3b82f6' },
    { name: 'Z2 Aerobic / Endurance', range: '60% - 70%', minPct: 0.6, maxPct: 0.7, color: '#10b981' },
    { name: 'Z3 Tempo / Rhythm', range: '70% - 80%', minPct: 0.7, maxPct: 0.8, color: '#f59e0b' },
    { name: 'Z4 Threshold / Hard', range: '80% - 90%', minPct: 0.8, maxPct: 0.9, color: '#f97316' },
    { name: 'Z5 Anaerobic / Max', range: '90% - 100%', minPct: 0.9, maxPct: 1.0, color: '#ef4444' },
  ];

  const zoneSeconds = [0, 0, 0, 0, 0];
  let totalValidSeconds = 0;

  for (let i = 0; i < hrData.length; i++) {
    const hr = hrData[i];
    const pct = hr / maxHR;

    let delta = 1;
    if (i > 0) {
      delta = timeData[i] - timeData[i - 1];
    }

    if (pct >= 0.5) {
      totalValidSeconds += delta;
      if (pct >= 0.9) zoneSeconds[4] += delta;
      else if (pct >= 0.8) zoneSeconds[3] += delta;
      else if (pct >= 0.7) zoneSeconds[2] += delta;
      else if (pct >= 0.6) zoneSeconds[1] += delta;
      else zoneSeconds[0] += delta;
    }
  }

  const formatDurationHMS = (totalSecs: number) => {
    if (totalSecs === 0) return '0s';
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;

    const parts = [];
    if (hrs > 0) parts.push(`${hrs}h`);
    if (mins > 0 || hrs > 0) parts.push(`${mins}m`);
    if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);
    return parts.join(' ');
  };

  return (
    <div className="glass-panel rounded-2xl p-6">
      <h3 className="text-base font-semibold text-text-primary mb-1">Heart Rate Zones</h3>
      <p className="text-sm text-text-secondary mb-5">
        Time spent in training intensity zones based on max heart rate ({maxHR} bpm).
      </p>

      <div className="space-y-4">
        {zones.map((zone, idx) => {
          const seconds = zoneSeconds[idx];
          const pct = totalValidSeconds > 0 ? (seconds / totalValidSeconds) * 100 : 0;
          return (
            <div key={idx} className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span style={{ color: zone.color }}>{zone.name}</span>
                <span className="text-text-secondary font-mono">
                  {pct.toFixed(1)}% · {formatDurationHMS(seconds)}
                </span>
              </div>
              <div className="h-3 w-full rounded-full bg-white/5 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${pct}%`,
                    backgroundColor: zone.color,
                    boxShadow: `0 0 8px ${zone.color}40`,
                  }}
                />
              </div>
            </div>
          );
        }).reverse()}
      </div>
    </div>
  );
}

export default function ActivityDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [activity, setActivity] = useState<Activity | null>(null);
  const [streams, setStreams] = useState<Streams | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);

  useEffect(() => {
    const fetchActivity = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/activities/${id}`);
        if (!res.ok) throw new Error('Failed to fetch activity');
        const data = await res.json();
        setActivity(data.activity);
        setStreams(data.streams);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setLoading(false);
      }
    };

    fetchActivity();
  }, [id]);

  if (error) {
    return (
      <div className="p-6">
        <EmptyState title="Error loading activity" description={error} />
      </div>
    );
  }

  if (loading || !activity) {
    return (
      <main className="flex-1 overflow-auto pb-20 lg:pb-6">
        <div className="px-4 md:px-8 lg:px-12 py-6 lg:py-8">
          <Skeleton className="h-10 w-12 mb-4" />
          <Skeleton className="h-12 w-64 mb-2" />
          <Skeleton className="h-4 w-48 mb-8" />
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-80" />
            ))}
          </div>
        </div>
      </main>
    );
  }

  const sportMeta = getSportMeta(activity.type);
  const { localRange, istLabel, isIST } = fmtActivityTimes(
    activity.start_date,
    activity.start_date_local as string | undefined,
    activity.elapsed_time,
  );

  const maxHR = activity.max_heartrate || (streams?.heartrate?.data ? Math.max(...streams.heartrate.data) : 190);

  return (
    <main className="flex-1 overflow-auto pb-20 lg:pb-6">
      <div className="px-4 md:px-8 lg:px-12 py-6 lg:py-8">
        {/* Back Button + Compare */}
        <div className="flex items-center justify-between mb-6">
          <Link href="/activities">
            <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-surface border border-border text-text-secondary hover:text-text-primary hover:bg-muted transition-all duration-300 text-sm font-medium">
              <ArrowLeft className="w-4 h-4" />
              Back to Activities
            </button>
          </Link>
          <Link href={`/compare?a=${id}`}>
            <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-accent-ride/10 border border-accent-ride/25 text-accent-ride hover:bg-accent-ride/20 transition-all duration-300 text-sm font-medium">
              <GitCompare className="w-4 h-4" />
              Compare
            </button>
          </Link>
        </div>

        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight mb-2">
                {activity.name}
              </h1>
              <p className="text-text-secondary">
                {new Date(activity.start_date).toLocaleDateString('en-IN', {
                  weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
                  timeZone: 'Asia/Kolkata',
                })}
              </p>
              <p className="text-sm font-mono mt-1" style={{ color: sportMeta.hex, opacity: 0.9 }}>
                {isIST ? `${localRange} IST` : <>{localRange} · {istLabel}</>}
              </p>
            </div>
            <Badge variant={getSportBadgeVariant(activity.type)}>{sportMeta.label}</Badge>
          </div>
        </motion.div>



        {/* Key Stats Grid */}
        <motion.div
          className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8"
          variants={container}
          initial="initial"
          animate="animate"
        >
          {[
            {
              label: 'Distance',
              value: formatDistance(activity.distance),
            },
            {
              label: 'Moving Time',
              value: formatDuration(activity.moving_time),
            },
            {
              label: sportMeta.paceLabel,
              value: sportMeta.usePace
                ? formatPacePerKm(activity.average_speed)
                : formatSpeed(activity.average_speed),
            },
            {
              label: 'Max Speed',
              value: formatSpeed(activity.max_speed),
            },
            activity.average_heartrate && {
              label: 'Avg Heart Rate',
              value: `${Math.round(activity.average_heartrate)} bpm`,
            },
            activity.max_heartrate && {
              label: 'Max Heart Rate',
              value: `${Math.round(activity.max_heartrate)} bpm`,
            },
          ]
            .filter((s): s is { label: string; value: string } => !!s)
            .map((stat, idx) => (
              <motion.div
                key={idx}
                variants={item}
                className="glass-panel rounded-2xl p-4"
              >
                <p className="text-xs uppercase tracking-wider text-text-secondary mb-2">
                  {stat.label}
                </p>
                <p className="text-2xl font-mono font-semibold">
                  {stat.value}
                </p>
              </motion.div>
            ))}
        </motion.div>

        {/* Charts */}
        {streams && streams.distance?.data && streams.time?.data && streams.distance.data.length > 0 && (() => {
          const distData = streams.distance.data;
          const timeData = streams.time.data;
          const downsample = Math.ceil(distData.length / 100);
          return (
          <motion.div
            className="space-y-6"
            variants={container}
            initial="initial"
            animate="animate"
          >
            {/* Progress Chart - Distance vs Time */}
            <motion.div variants={item}>
              <ProgressChart
                data={
                  distData
                    .map((d: number, i: number) => ({
                      time: Math.round((timeData[i] || 0) / 60), // Convert to minutes
                      distance: Number((d / 1000).toFixed(2)), // Convert to km
                    }))
                    .filter((_: unknown, i: number) => i % downsample === 0) || []
                }
              />
            </motion.div>

            {streams.velocity_smooth?.data && (
              <motion.div variants={item}>
                <PaceChart
                  sportType={activity.type}
                  data={
                  distData
                    .map((d: number, i: number) => ({
                      distance: Number((d / 1000).toFixed(1)),
                      pace: streams.velocity_smooth?.data[i] || 0,
                    }))
                    .filter((_: unknown, i: number) => i % downsample === 0) || []
                }
                />
              </motion.div>
            )}

            <motion.div variants={item}>
              <KmSplitTable
                distanceData={distData}
                timeData={timeData}
                sportHex={sportMeta.hex}
              />
            </motion.div>

            {activity.distance >= 400 && (
              <motion.div variants={item}>
                <BestEffortsTable
                  distanceData={distData}
                  timeData={timeData}
                  activityDistance={activity.distance}
                  sportType={activity.type}
                />
              </motion.div>
            )}

            {streams.heartrate?.data && streams.heartrate.data.length > 0 && (
              <>
                <motion.div variants={item}>
                  <HeartRateChart
                    data={
                    distData
                      .map((d: number, i: number) => ({
                        distance: Number((d / 1000).toFixed(1)),
                        heartrate: streams.heartrate?.data[i] || 0,
                      }))
                      .filter((_: unknown, i: number) => i % downsample === 0) || []
                  }
                  />
                </motion.div>

                <motion.div variants={item}>
                  <HeartRateZones
                    hrData={streams.heartrate.data}
                    timeData={timeData}
                    maxHR={maxHR}
                  />
                </motion.div>
              </>
            )}

            {streams.altitude?.data && streams.altitude.data.length > 0 && (
              <motion.div variants={item}>
                <ElevationChart
                  data={
                  distData
                    .map((d: number, i: number) => ({
                      distance: Number((d / 1000).toFixed(1)),
                      altitude: streams.altitude?.data[i] || 0,
                    }))
                    .filter((_: unknown, i: number) => i % downsample === 0) || []
                }
                />
              </motion.div>
            )}
          </motion.div>
          );
        })()}

        {/* Activity Photo at the Bottom */}
        {activity.photos?.primary?.urls?.['600'] && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-8 overflow-hidden rounded-2xl border border-border shadow-sm cursor-pointer group relative"
            onClick={() => setIsImageModalOpen(true)}
          >
            <img 
              src={activity.photos.primary.urls['600']} 
              alt={`Photo from ${activity.name}`}
              className="w-full h-64 object-cover transition-transform duration-700 group-hover:scale-105"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-300 flex items-center justify-center">
              <span className="opacity-0 group-hover:opacity-100 text-white font-medium bg-black/60 px-5 py-2.5 rounded-full transition-opacity duration-300 backdrop-blur-md flex items-center gap-2 shadow-lg">
                View Full Image
              </span>
            </div>
          </motion.div>
        )}
      </div>

      {/* Fullscreen Image Modal */}
      <AnimatePresence>
        {isImageModalOpen && activity.photos?.primary?.urls?.['600'] && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsImageModalOpen(false)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4 md:p-12 backdrop-blur-xl"
          >
            <button 
              onClick={() => setIsImageModalOpen(false)}
              className="absolute top-6 right-6 md:top-8 md:right-8 p-3 bg-white/10 hover:bg-white/25 text-white rounded-full transition-colors backdrop-blur-md z-10"
            >
              <X className="w-6 h-6" />
            </button>
            <motion.img
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              src={activity.photos.primary.urls['600']}
              alt={`Full size photo from ${activity.name}`}
              className="max-w-full max-h-full object-contain rounded-xl shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
