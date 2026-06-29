import {
  Footprints, Bike, PersonStanding, Waves, Mountain,
  Snowflake, Dumbbell, Activity, Sailboat, Zap, Flag,
  Wind, Timer,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface SportMeta {
  icon: LucideIcon;
  hex: string;         // hard hex — safe inside SVG / Recharts
  label: string;
  paceLabel: string;   // "Pace" or "Speed" depending on sport type
  usePace: boolean;    // true = show min/km, false = show km/h
}

/* Known Strava sport types */
const KNOWN: Record<string, SportMeta> = {
  Run:              { icon: Footprints,     hex: '#6366f1', label: 'Run',           paceLabel: 'Pace',  usePace: true  },
  TrailRun:         { icon: Mountain,       hex: '#7c3aed', label: 'Trail Run',      paceLabel: 'Pace',  usePace: true  },
  VirtualRun:       { icon: Footprints,     hex: '#818cf8', label: 'Virtual Run',    paceLabel: 'Pace',  usePace: true  },
  Walk:             { icon: PersonStanding, hex: '#2dd4bf', label: 'Walk',           paceLabel: 'Pace',  usePace: true  },
  Hike:             { icon: Mountain,       hex: '#10b981', label: 'Hike',           paceLabel: 'Pace',  usePace: true  },
  Ride:             { icon: Bike,           hex: '#8b5cf6', label: 'Ride',           paceLabel: 'Speed', usePace: false },
  VirtualRide:      { icon: Bike,           hex: '#a78bfa', label: 'Virtual Ride',   paceLabel: 'Speed', usePace: false },
  EBikeRide:        { icon: Zap,            hex: '#c084fc', label: 'E-Bike',         paceLabel: 'Speed', usePace: false },
  Swim:             { icon: Waves,          hex: '#0ea5e9', label: 'Swim',           paceLabel: 'Pace',  usePace: true  },
  Kayaking:         { icon: Sailboat,       hex: '#06b6d4', label: 'Kayak',          paceLabel: 'Speed', usePace: false },
  Rowing:           { icon: Sailboat,       hex: '#0891b2', label: 'Row',            paceLabel: 'Speed', usePace: false },
  Canoeing:         { icon: Sailboat,       hex: '#0284c7', label: 'Canoe',          paceLabel: 'Speed', usePace: false },
  StandUpPaddling:  { icon: Sailboat,       hex: '#0369a1', label: 'SUP',            paceLabel: 'Speed', usePace: false },
  AlpineSki:        { icon: Snowflake,      hex: '#38bdf8', label: 'Alpine Ski',     paceLabel: 'Speed', usePace: false },
  NordicSki:        { icon: Snowflake,      hex: '#7dd3fc', label: 'Nordic Ski',     paceLabel: 'Speed', usePace: false },
  BackcountrySki:   { icon: Snowflake,      hex: '#bae6fd', label: 'Backcountry',    paceLabel: 'Speed', usePace: false },
  Snowboard:        { icon: Snowflake,      hex: '#e0f2fe', label: 'Snowboard',      paceLabel: 'Speed', usePace: false },
  Snowshoe:         { icon: Snowflake,      hex: '#93c5fd', label: 'Snowshoe',       paceLabel: 'Pace',  usePace: true  },
  WeightTraining:   { icon: Dumbbell,       hex: '#f97316', label: 'Weights',        paceLabel: 'Speed', usePace: false },
  Crossfit:         { icon: Dumbbell,       hex: '#fb923c', label: 'CrossFit',       paceLabel: 'Speed', usePace: false },
  Workout:          { icon: Dumbbell,       hex: '#fbbf24', label: 'Workout',        paceLabel: 'Speed', usePace: false },
  Elliptical:       { icon: Timer,          hex: '#f59e0b', label: 'Elliptical',     paceLabel: 'Speed', usePace: false },
  StairStepper:     { icon: Activity,       hex: '#d97706', label: 'Stairs',         paceLabel: 'Speed', usePace: false },
  Yoga:             { icon: PersonStanding, hex: '#ec4899', label: 'Yoga',           paceLabel: 'Speed', usePace: false },
  RockClimbing:     { icon: Mountain,       hex: '#ef4444', label: 'Climbing',       paceLabel: 'Speed', usePace: false },
  Soccer:           { icon: Flag,           hex: '#22c55e', label: 'Soccer',         paceLabel: 'Speed', usePace: false },
  Golf:             { icon: Flag,           hex: '#16a34a', label: 'Golf',           paceLabel: 'Speed', usePace: false },
  IceSkate:         { icon: Snowflake,      hex: '#60a5fa', label: 'Ice Skate',      paceLabel: 'Speed', usePace: false },
  InlineSkate:      { icon: Zap,            hex: '#a78bfa', label: 'Inline Skate',   paceLabel: 'Speed', usePace: false },
  Skateboard:       { icon: Zap,            hex: '#818cf8', label: 'Skate',          paceLabel: 'Speed', usePace: false },
  Surfing:          { icon: Waves,          hex: '#0284c7', label: 'Surf',           paceLabel: 'Speed', usePace: false },
  Kitesurf:         { icon: Wind,           hex: '#0891b2', label: 'Kitesurf',       paceLabel: 'Speed', usePace: false },
  Windsurf:         { icon: Wind,           hex: '#0ea5e9', label: 'Windsurf',       paceLabel: 'Speed', usePace: false },
  Handcycle:        { icon: Bike,           hex: '#db2777', label: 'Handcycle',      paceLabel: 'Speed', usePace: false },
  Wheelchair:       { icon: Activity,       hex: '#e11d48', label: 'Wheelchair',     paceLabel: 'Speed', usePace: false },
  Sail:             { icon: Sailboat,       hex: '#0369a1', label: 'Sailing',        paceLabel: 'Speed', usePace: false },
};

/* Deterministic color from sport name for anything not in KNOWN */
const FALLBACK_PALETTE = [
  '#6366f1','#8b5cf6','#ec4899','#f97316','#eab308',
  '#22c55e','#14b8a6','#06b6d4','#3b82f6','#a855f7',
];

function hashHex(str: string): string {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = str.charCodeAt(i) + ((h << 5) - h);
  return FALLBACK_PALETTE[Math.abs(h) % FALLBACK_PALETTE.length];
}

export function getSportMeta(type: string): SportMeta {
  return (
    KNOWN[type] ?? {
      icon: Activity,
      hex: hashHex(type),
      label: type,
      paceLabel: 'Speed',
      usePace: false,
    }
  );
}

/* Badge variant — only known badge variants exist in Badge component */
export function getSportBadgeVariant(type: string): 'run' | 'ride' | 'walk' | 'default' {
  if (type === 'Run' || type === 'TrailRun' || type === 'VirtualRun') return 'run';
  if (type === 'Ride' || type === 'VirtualRide' || type === 'EBikeRide') return 'ride';
  if (type === 'Walk' || type === 'Hike') return 'walk';
  return 'default';
}
