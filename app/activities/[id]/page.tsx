'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
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
import { ArrowLeft, GitCompare } from 'lucide-react';
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

export default function ActivityDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [activity, setActivity] = useState<Activity | null>(null);
  const [streams, setStreams] = useState<Streams | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      </div>
    </main>
  );
}
