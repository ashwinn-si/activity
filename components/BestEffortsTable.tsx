'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Zap } from 'lucide-react';
import { getSportMeta } from '@/utils/sportConfig';

interface BestEffortsTableProps {
  distanceData: number[];
  timeData: number[];
  activityDistance: number; // total metres
  sportType?: string;
}

interface Effort { label: string; metres: number }

// Standard distances per sport category
const EFFORTS_RUN: Effort[] = [
  { label: '400 m',      metres: 400 },
  { label: '1 km',       metres: 1000 },
  { label: '1 mile',     metres: 1609 },
  { label: '5 km',       metres: 5000 },
  { label: '10 km',      metres: 10000 },
  { label: 'Half (21k)', metres: 21097 },
  { label: 'Marathon',   metres: 42195 },
];

const EFFORTS_SWIM: Effort[] = [
  { label: '50 m',  metres: 50 },
  { label: '100 m', metres: 100 },
  { label: '200 m', metres: 200 },
  { label: '400 m', metres: 400 },
  { label: '800 m', metres: 800 },
  { label: '1500 m',metres: 1500 },
  { label: '1 km',  metres: 1000 },
];

const EFFORTS_RIDE: Effort[] = [
  { label: '1 km',   metres: 1000 },
  { label: '5 km',   metres: 5000 },
  { label: '10 km',  metres: 10000 },
  { label: '20 km',  metres: 20000 },
  { label: '40 km',  metres: 40000 },
  { label: '100 km', metres: 100000 },
];

const EFFORTS_DEFAULT: Effort[] = [
  { label: '500 m',  metres: 500 },
  { label: '1 km',   metres: 1000 },
  { label: '5 km',   metres: 5000 },
  { label: '10 km',  metres: 10000 },
  { label: '20 km',  metres: 20000 },
];

function getEffortsForSport(type: string): Effort[] {
  if (type === 'Run' || type === 'TrailRun' || type === 'VirtualRun') return EFFORTS_RUN;
  if (type === 'Swim') return EFFORTS_SWIM;
  if (type === 'Ride' || type === 'VirtualRide' || type === 'EBikeRide') return EFFORTS_RIDE;
  if (type === 'Walk' || type === 'Hike') return EFFORTS_RUN;
  return EFFORTS_DEFAULT;
}

function formatTime(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.round(seconds % 60);
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function formatPace(seconds: number, metres: number) {
  const secPerKm = (seconds / metres) * 1000;
  const m = Math.floor(secPerKm / 60);
  const s = Math.round(secPerKm % 60);
  return `${m}:${s.toString().padStart(2, '0')} /km`;
}

function formatSpeed(seconds: number, metres: number) {
  const kmh = (metres / seconds) * 3.6;
  return `${kmh.toFixed(1)} km/h`;
}

function bestEffort(distData: number[], timeData: number[], targetMetres: number): number | null {
  if (distData.length < 2) return null;
  if ((distData[distData.length - 1] ?? 0) < targetMetres) return null;

  let best = Infinity;
  let j = 0;

  for (let i = 0; i < distData.length; i++) {
    while (j < distData.length - 1 && distData[j] - distData[i] < targetMetres) j++;
    const covered = distData[j] - distData[i];
    if (covered >= targetMetres) {
      const excess = covered - targetMetres;
      const segLen = distData[j] - distData[j - 1];
      const segTime = timeData[j] - timeData[j - 1];
      const interpTime = segLen > 0 ? timeData[j] - (excess / segLen) * segTime : timeData[j];
      const elapsed = interpTime - timeData[i];
      if (elapsed > 0 && elapsed < best) best = elapsed;
    }
  }

  return best === Infinity ? null : best;
}

export function BestEffortsTable({
  distanceData, timeData, activityDistance, sportType = 'Run',
}: BestEffortsTableProps) {
  const meta = getSportMeta(sportType);
  const efforts = getEffortsForSport(sportType);

  const computed = useMemo(() => {
    return efforts
      .filter((e) => activityDistance >= e.metres * 0.95)
      .map((e) => ({ ...e, seconds: bestEffort(distanceData, timeData, e.metres) }))
      .filter((e): e is typeof e & { seconds: number } => e.seconds !== null);
  }, [distanceData, timeData, activityDistance, efforts]);

  if (computed.length === 0) return null;

  const ratesPerKm = computed.map((e) => (e.seconds / e.metres) * 1000);
  const fastest = Math.min(...ratesPerKm);
  const slowest = Math.max(...ratesPerKm);

  return (
    <motion.div
      initial={{ opacity: 0, scaleY: 0.92 }}
      animate={{ opacity: 1, scaleY: 1 }}
      transition={{ duration: 0.45 }}
      style={{ transformOrigin: 'bottom' }}
      className="glass-panel rounded-2xl p-6"
    >
      <div className="flex items-center gap-2 mb-1">
        <Zap className="w-4 h-4" style={{ color: meta.hex }} />
        <h3 className="text-lg font-semibold text-text-primary">Best Efforts</h3>
      </div>
      <p className="text-sm text-text-secondary mb-5">
        Fastest time to cover each standard distance in this {meta.label.toLowerCase()}.
      </p>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="pb-3 text-left font-medium text-text-secondary">Distance</th>
              <th className="pb-3 text-right font-medium text-text-secondary">Time</th>
              <th className="pb-3 text-right font-medium text-text-secondary">
                {meta.usePace ? 'Pace' : 'Speed'}
              </th>
              <th className="pb-3 pr-1 text-right font-medium text-text-secondary">Effort</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {computed.map((e, i) => {
              const ratePerKm = (e.seconds / e.metres) * 1000;
              const barPct = slowest === fastest
                ? 100
                : Math.round(100 - ((ratePerKm - fastest) / (slowest - fastest)) * 100);

              return (
                <motion.tr
                  key={e.metres}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                >
                  <td className="py-3 font-semibold text-text-primary">{e.label}</td>
                  <td className="py-3 text-right font-mono text-text-primary">
                    {formatTime(e.seconds)}
                  </td>
                  <td className="py-3 text-right font-mono text-text-secondary text-xs">
                    {meta.usePace
                      ? formatPace(e.seconds, e.metres)
                      : formatSpeed(e.seconds, e.metres)}
                  </td>
                  <td className="py-3 pl-4 pr-1">
                    <div className="flex items-center justify-end">
                      <div className="h-1.5 w-24 rounded-full bg-border overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${barPct}%`,
                            background: `linear-gradient(to right, ${meta.hex}99, ${meta.hex})`,
                          }}
                        />
                      </div>
                    </div>
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}
