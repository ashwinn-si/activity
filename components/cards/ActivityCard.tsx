'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { formatDistance, formatDuration, formatSpeed, formatPace } from '@/utils/formatters';
import { Badge } from '@/components/ui/Badge';
import { Bike, Footprints, PersonStanding, Heart, Mountain } from 'lucide-react';

const sportIcons: any = {
  Run: Footprints,
  Ride: Bike,
  Walk: PersonStanding,
};

const sportColors: any = {
  Run: 'run',
  Ride: 'ride',
  Walk: 'walk',
};

interface ActivityCardProps {
  activity: any;
}

export function ActivityCard({ activity }: ActivityCardProps) {
  const Icon = sportIcons[activity.type] || Bike;
  const badgeVariant = sportColors[activity.type] || 'default';

  return (
    <motion.div
      whileHover={{ scale: 1.015, y: -2 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 300, damping: 22 }}
    >
      <Link href={`/activities/${activity.id}`}>
        <div className="bg-surface border border-border rounded-2xl p-5 hover:border-opacity-50 transition-all cursor-pointer">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <Icon className="w-6 h-6" />
              <div>
                <h3 className="font-semibold text-text-primary">
                  {activity.name}
                </h3>
                <p className="text-xs text-text-secondary">
                  {new Date(activity.start_date).toLocaleDateString()}
                </p>
              </div>
            </div>
            <Badge variant={badgeVariant}>{activity.type}</Badge>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs text-text-secondary uppercase tracking-wider">
                Distance
              </p>
              <p className="font-mono font-semibold">
                {formatDistance(activity.distance)}
              </p>
            </div>
            <div>
              <p className="text-xs text-text-secondary uppercase tracking-wider">
                Time
              </p>
              <p className="font-mono font-semibold">
                {formatDuration(activity.moving_time)}
              </p>
            </div>
            <div>
              <p className="text-xs text-text-secondary uppercase tracking-wider">
                {activity.type === 'Run' ? 'Pace' : 'Speed'}
              </p>
              <p className="font-mono font-semibold">
                {activity.type === 'Run'
                  ? formatPace(activity.average_speed)
                  : formatSpeed(activity.average_speed)}
              </p>
            </div>
            <div>
              <p className="text-xs text-text-secondary uppercase tracking-wider">
                Elevation
              </p>
              <p className="font-mono font-semibold">
                {(activity.elevation_gain || 0).toFixed(0)}m
              </p>
            </div>
          </div>

          {(activity.average_heartrate || activity.max_heartrate) && (
            <div className="mt-3 pt-3 border-t border-border flex items-center gap-2 text-xs text-text-secondary">
              <Heart className="w-4 h-4" />
              {activity.average_heartrate && (
                <span>{Math.round(activity.average_heartrate)} avg</span>
              )}
              {activity.max_heartrate && (
                <span>• {Math.round(activity.max_heartrate)} max</span>
              )}
            </div>
          )}
        </div>
      </Link>
    </motion.div>
  );
}
