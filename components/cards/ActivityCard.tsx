'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { formatDistance, formatDuration, formatSpeed, formatPace } from '@/utils/formatters';
import { getSportMeta, getSportBadgeVariant } from '@/utils/sportConfig';
import { Badge } from '@/components/ui/Badge';
import { Heart } from 'lucide-react';

interface ActivityCardProps {
  activity: {
    id: number;
    name: string;
    type: string;
    distance: number;
    moving_time: number;
    start_date: string;
    average_speed: number;
    elevation_gain?: number;
    average_heartrate?: number;
    max_heartrate?: number;
  };
}

export function ActivityCard({ activity }: ActivityCardProps) {
  const meta = getSportMeta(activity.type);
  const Icon = meta.icon;
  const badgeVariant = getSportBadgeVariant(activity.type);

  return (
    <motion.div
      whileHover={{ y: -3 }}
      whileTap={{ scale: 0.99 }}
      transition={{ type: 'spring', stiffness: 300, damping: 22 }}
    >
      <Link href={`/activities/${activity.id}`}>
        <div className="glass-panel glass-panel-hover rounded-2xl p-5 cursor-pointer relative overflow-hidden pl-7">
          {/* Accent left strip */}
          <div
            className="absolute top-0 left-0 bottom-0 w-1 opacity-80"
            style={{ background: meta.hex }}
          />

          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div
                className="p-2.5 rounded-xl shadow-sm"
                style={{
                  background: `${meta.hex}18`,
                  border: `1px solid ${meta.hex}30`,
                  color: meta.hex,
                }}
              >
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-text-primary tracking-tight">
                  {activity.name}
                </h3>
                <p className="text-xs text-text-secondary mt-0.5">
                  {new Date(activity.start_date).toLocaleDateString(undefined, {
                    weekday: 'short', year: 'numeric', month: 'short', day: 'numeric',
                  })}
                </p>
              </div>
            </div>
            <Badge variant={badgeVariant}>{meta.label}</Badge>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm mt-3 pt-1">
            <div>
              <p className="text-[10px] font-bold text-text-secondary uppercase tracking-wider mb-1">Distance</p>
              <p className="font-mono font-semibold text-text-primary text-base">
                {formatDistance(activity.distance)}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-text-secondary uppercase tracking-wider mb-1">Time</p>
              <p className="font-mono font-semibold text-text-primary text-base">
                {formatDuration(activity.moving_time)}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-text-secondary uppercase tracking-wider mb-1">
                {meta.paceLabel}
              </p>
              <p className="font-mono font-semibold text-text-primary text-base">
                {meta.usePace ? formatPace(activity.average_speed) : formatSpeed(activity.average_speed)}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-text-secondary uppercase tracking-wider mb-1">Elevation</p>
              <p className="font-mono font-semibold text-text-primary text-base">
                {(activity.elevation_gain || 0).toFixed(0)} m
              </p>
            </div>
          </div>

          {(activity.average_heartrate || activity.max_heartrate) && (
            <div className="mt-4 pt-3 border-t border-border flex items-center gap-3 text-xs text-text-secondary">
              <div className="flex items-center gap-1.5" style={{ color: meta.hex }}>
                <Heart className="w-3.5 h-3.5 fill-current" />
                <span>Heart Rate</span>
              </div>
              <div className="flex items-center gap-2 font-mono">
                {activity.average_heartrate && <span>{Math.round(activity.average_heartrate)} bpm avg</span>}
                {activity.max_heartrate && <span>· {Math.round(activity.max_heartrate)} bpm max</span>}
              </div>
            </div>
          )}
        </div>
      </Link>
    </motion.div>
  );
}
