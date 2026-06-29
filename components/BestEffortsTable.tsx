'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Zap } from 'lucide-react';

interface BestEffortsTableProps {
  distanceData: number[];
  timeData: number[];
  activityDistance: number; // total metres
}

const EFFORTS = [
  { label: '400 m',       metres: 400 },
  { label: '1 km',        metres: 1000 },
  { label: '1 mile',      metres: 1609 },
  { label: '5 km',        metres: 5000 },
  { label: '10 km',       metres: 10000 },
  { label: 'Half (21k)',  metres: 21097 },
  { label: 'Marathon',    metres: 42195 },
];

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

function bestEffort(distData: number[], timeData: number[], targetMetres: number): number | null {
  if (distData.length < 2) return null;
  if ((distData[distData.length - 1] ?? 0) < targetMetres) return null;

  let best = Infinity;
  let j = 0;

  for (let i = 0; i < distData.length; i++) {
    // advance j until the window covers targetMetres
    while (j < distData.length - 1 && distData[j] - distData[i] < targetMetres) {
      j++;
    }
    const covered = distData[j] - distData[i];
    if (covered >= targetMetres) {
      // linear interpolation for precise end time
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

export function BestEffortsTable({ distanceData, timeData, activityDistance }: BestEffortsTableProps) {
  const efforts = useMemo(() => {
    return EFFORTS
      .filter((e) => activityDistance >= e.metres * 0.95)
      .map((e) => {
        const seconds = bestEffort(distanceData, timeData, e.metres);
        return { ...e, seconds };
      })
      .filter((e) => e.seconds !== null) as (typeof EFFORTS[number] & { seconds: number })[];
  }, [distanceData, timeData, activityDistance]);

  if (efforts.length === 0) return null;

  const fastestPaceSeconds = Math.min(...efforts.map((e) => (e.seconds / e.metres) * 1000));

  return (
    <motion.div
      initial={{ opacity: 0, scaleY: 0.92 }}
      animate={{ opacity: 1, scaleY: 1 }}
      transition={{ duration: 0.45 }}
      style={{ transformOrigin: 'bottom' }}
      className="glass-panel rounded-2xl p-6"
    >
      <div className="flex items-center gap-2 mb-1">
        <Zap className="w-4 h-4 text-accent-pr" />
        <h3 className="text-lg font-semibold text-text-primary">Best Efforts</h3>
      </div>
      <p className="text-sm text-text-secondary mb-5">
        Fastest time to cover each standard distance in this run.
      </p>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="pb-3 text-left font-medium text-text-secondary">Distance</th>
              <th className="pb-3 text-right font-medium text-text-secondary">Time</th>
              <th className="pb-3 text-right font-medium text-text-secondary">Pace</th>
              <th className="pb-3 pr-1 text-right font-medium text-text-secondary">Effort bar</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {efforts.map((e, i) => {
              const paceSeconds = (e.seconds / e.metres) * 1000;
              const slowestPaceSeconds = Math.max(...efforts.map((x) => (x.seconds / x.metres) * 1000));
              // bar: full width = fastest, empty = slowest
              const barPct =
                slowestPaceSeconds === fastestPaceSeconds
                  ? 100
                  : Math.round(
                      100 -
                        ((paceSeconds - fastestPaceSeconds) /
                          (slowestPaceSeconds - fastestPaceSeconds)) *
                          100
                    );

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
                    {formatPace(e.seconds, e.metres)}
                  </td>
                  <td className="py-3 pl-4 pr-1">
                    <div className="flex items-center justify-end">
                      <div className="h-1.5 w-24 rounded-full bg-white/5 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-accent-pr to-accent-run transition-all duration-500"
                          style={{ width: `${barPct}%` }}
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
