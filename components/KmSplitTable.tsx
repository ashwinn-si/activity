'use client';

import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface KmSplitTableProps {
  distanceData: number[];
  timeData: number[];
}

interface Split {
  km: number;
  splitSeconds: number;
  cumulativeSeconds: number;
  pace: string;
  delta: number | null;
}

function formatSplitTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function computeSplits(distData: number[], timeData: number[]): Split[] {
  const splits: Split[] = [];
  const totalMeters = distData[distData.length - 1] ?? 0;
  const totalKm = Math.floor(totalMeters / 1000);

  let prevCumulative = 0;
  let prevSplitSeconds: number | null = null;

  for (let km = 1; km <= totalKm; km++) {
    const targetMeters = km * 1000;
    let idx = distData.findIndex((d) => d >= targetMeters);
    if (idx === -1) break;

    let interpolatedTime: number;
    if (idx === 0) {
      interpolatedTime = timeData[0];
    } else {
      const d0 = distData[idx - 1];
      const d1 = distData[idx];
      const t0 = timeData[idx - 1];
      const t1 = timeData[idx];
      const frac = (targetMeters - d0) / (d1 - d0);
      interpolatedTime = t0 + frac * (t1 - t0);
    }

    const splitSeconds = interpolatedTime - prevCumulative;
    const delta = prevSplitSeconds !== null ? splitSeconds - prevSplitSeconds : null;

    splits.push({
      km,
      splitSeconds,
      cumulativeSeconds: interpolatedTime,
      pace: formatSplitTime(splitSeconds),
      delta,
    });

    prevCumulative = interpolatedTime;
    prevSplitSeconds = splitSeconds;
  }

  // Partial last km
  const lastKmStart = totalKm * 1000;
  const remainingMeters = totalMeters - lastKmStart;
  if (remainingMeters > 50) {
    const lastTime = timeData[timeData.length - 1];
    const partialSeconds = lastTime - prevCumulative;
    const projectedFullKmSeconds = (partialSeconds / remainingMeters) * 1000;
    const delta = prevSplitSeconds !== null ? projectedFullKmSeconds - prevSplitSeconds : null;
    splits.push({
      km: totalKm + 1,
      splitSeconds: projectedFullKmSeconds,
      cumulativeSeconds: lastTime,
      pace: formatSplitTime(projectedFullKmSeconds),
      delta,
    });
  }

  return splits;
}

export function KmSplitTable({ distanceData, timeData }: KmSplitTableProps) {
  const splits = computeSplits(distanceData, timeData);
  if (splits.length === 0) return null;

  const avgSeconds = splits.reduce((s, x) => s + x.splitSeconds, 0) / splits.length;
  const fastest = Math.min(...splits.map((s) => s.splitSeconds));
  const slowest = Math.max(...splits.map((s) => s.splitSeconds));

  return (
    <motion.div
      initial={{ opacity: 0, scaleY: 0.92 }}
      animate={{ opacity: 1, scaleY: 1 }}
      transition={{ duration: 0.45 }}
      style={{ transformOrigin: 'bottom' }}
      className="glass-panel rounded-2xl p-6"
    >
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-text-primary">Km Splits</h3>
          <p className="mt-1 text-sm text-text-secondary">
            Time taken to complete each kilometre.
          </p>
        </div>
        <div className="flex gap-2 text-xs font-medium">
          <span className="rounded-full border border-border bg-surface px-3 py-1 text-text-secondary">
            avg {formatSplitTime(avgSeconds)}
          </span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="pb-3 text-left font-medium text-text-secondary">Km</th>
              <th className="pb-3 text-right font-medium text-text-secondary">Split</th>
              <th className="pb-3 text-right font-medium text-text-secondary">Cumulative</th>
              <th className="pb-3 text-right font-medium text-text-secondary">vs prev</th>
              <th className="pb-3 pr-1 text-right font-medium text-text-secondary">Pace bar</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {splits.map((split, i) => {
              const isFastest = split.splitSeconds === fastest;
              const isSlowest = split.splitSeconds === slowest;
              const isPartial = i === splits.length - 1 && split.km > Math.floor(distanceData[distanceData.length - 1] / 1000);

              const barWidth = Math.round(
                ((split.splitSeconds - fastest) / (slowest - fastest + 1)) * 100
              );

              const deltaColor =
                split.delta === null
                  ? 'text-text-muted'
                  : split.delta < -2
                  ? 'text-accent-run'
                  : split.delta > 2
                  ? 'text-red-400'
                  : 'text-text-secondary';

              const DeltaIcon =
                split.delta === null
                  ? Minus
                  : split.delta < -2
                  ? TrendingDown
                  : split.delta > 2
                  ? TrendingUp
                  : Minus;

              return (
                <motion.tr
                  key={split.km}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="group"
                >
                  <td className="py-3 font-mono font-semibold text-text-primary">
                    <span className="flex items-center gap-2">
                      {isPartial ? (
                        <span className="text-text-secondary">~{split.km}</span>
                      ) : (
                        split.km
                      )}
                      {isFastest && (
                        <span className="rounded-full bg-accent-run/20 px-1.5 py-0.5 text-[10px] font-semibold text-accent-run">
                          fastest
                        </span>
                      )}
                      {isSlowest && splits.length > 1 && (
                        <span className="rounded-full bg-red-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-red-400">
                          slowest
                        </span>
                      )}
                    </span>
                  </td>
                  <td className="py-3 text-right font-mono text-text-primary">
                    {split.pace}
                    {isPartial && (
                      <span className="ml-1 text-[10px] text-text-muted">(proj)</span>
                    )}
                  </td>
                  <td className="py-3 text-right font-mono text-text-secondary">
                    {formatSplitTime(split.cumulativeSeconds)}
                  </td>
                  <td className={`py-3 text-right font-mono text-xs ${deltaColor}`}>
                    <span className="flex items-center justify-end gap-1">
                      <DeltaIcon className="w-3 h-3" />
                      {split.delta !== null
                        ? `${split.delta > 0 ? '+' : ''}${formatSplitTime(Math.abs(split.delta))}`
                        : '—'}
                    </span>
                  </td>
                  <td className="py-3 pl-4 pr-1">
                    <div className="flex items-center justify-end">
                      <div className="h-1.5 w-24 rounded-full bg-white/5 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-accent-run to-blue-400 transition-all duration-500"
                          style={{ width: `${100 - barWidth}%` }}
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
