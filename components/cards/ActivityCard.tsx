'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { formatDistance, formatDuration, formatSpeed, formatPace } from '@/utils/formatters';
import { Badge } from '@/components/ui/Badge';
import { Bike, Footprints, PersonStanding, Heart } from 'lucide-react';

const sportIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  Run: Footprints,
  Ride: Bike,
  Walk: PersonStanding,
};

const sportColors: Record<string, 'default' | 'run' | 'ride' | 'walk' | 'pr'> = {
  Run: 'run',
  Ride: 'ride',
  Walk: 'walk',
};

const sportAccents: Record<string, { color: string; border: string; bg: string }> = {
  Run: { color: 'text-accent-run', border: 'border-accent-run/20', bg: 'bg-accent-run/10' },
  Ride: { color: 'text-accent-ride', border: 'border-accent-ride/20', bg: 'bg-accent-ride/10' },
  Walk: { color: 'text-accent-walk', border: 'border-accent-walk/20', bg: 'bg-accent-walk/10' },
};

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
  const Icon = sportIcons[activity.type] || Bike;
  const badgeVariant = sportColors[activity.type] || 'default';

  const accent = sportAccents[activity.type] || { color: 'text-accent-ride', border: 'border-accent-ride/25', bg: 'bg-accent-ride/10' };
  const stripColor = activity.type === 'Ride' ? 'bg-accent-ride' : activity.type === 'Run' ? 'bg-accent-run' : activity.type === 'Walk' ? 'bg-accent-walk' : 'bg-accent-pr';

  return (
    <motion.div
      whileHover={{ y: -3 }}
      whileTap={{ scale: 0.99 }}
      transition={{ type: 'spring', stiffness: 300, damping: 22 }}
    >
      <Link href={`/activities/${activity.id}`}>
        <div className="glass-panel glass-panel-hover rounded-2xl p-5 cursor-pointer relative overflow-hidden pl-7">
          {/* Accent Color Left Strip Indicator */}
          <div className={`absolute top-0 left-0 bottom-0 w-1 ${stripColor} opacity-80`} />

          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl ${accent.bg} border ${accent.border} ${accent.color} shadow-sm`}>
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-text-primary tracking-tight group-hover:text-accent-ride transition-colors">
                  {activity.name}
                </h3>
                <p className="text-xs text-text-secondary mt-0.5">
                  {new Date(activity.start_date).toLocaleDateString(undefined, {
                    weekday: 'short',
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </p>
              </div>
            </div>
            <Badge variant={badgeVariant}>{activity.type}</Badge>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm mt-3 pt-1">
            <div>
              <p className="text-[10px] font-bold text-text-secondary uppercase tracking-wider mb-1">
                Distance
              </p>
              <p className="font-mono font-semibold text-text-primary text-base">
                {formatDistance(activity.distance)}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-text-secondary uppercase tracking-wider mb-1">
                Time
              </p>
              <p className="font-mono font-semibold text-text-primary text-base">
                {formatDuration(activity.moving_time)}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-text-secondary uppercase tracking-wider mb-1">
                {activity.type === 'Run' ? 'Pace' : 'Speed'}
              </p>
              <p className="font-mono font-semibold text-text-primary text-base">
                {activity.type === 'Run'
                  ? formatPace(activity.average_speed)
                  : formatSpeed(activity.average_speed)}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-text-secondary uppercase tracking-wider mb-1">
                Elevation
              </p>
              <p className="font-mono font-semibold text-text-primary text-base">
                {(activity.elevation_gain || 0).toFixed(0)}m
              </p>
            </div>
          </div>

          {(activity.average_heartrate || activity.max_heartrate) && (
            <div className="mt-4 pt-3 border-t border-white/5 flex items-center gap-3 text-xs text-text-secondary">
              <div className="flex items-center gap-1.5 text-accent-run/90">
                <Heart className="w-3.5 h-3.5 fill-current" />
                <span>Heart Rate</span>
              </div>
              <div className="flex items-center gap-2 font-mono">
                {activity.average_heartrate && (
                  <span>{Math.round(activity.average_heartrate)} bpm avg</span>
                )}
                {activity.max_heartrate && (
                  <span>• {Math.round(activity.max_heartrate)} bpm max</span>
                )}
              </div>
            </div>
          )}
        </div>
      </Link>
    </motion.div>
  );
}
