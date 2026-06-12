'use client';

import { motion } from 'framer-motion';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';

interface ChartProps {
  data: { distance: number; pace: number }[];
}

function formatPace(value: number) {
  if (!Number.isFinite(value)) return '0:00';

  const minutes = Math.floor(value);
  const seconds = Math.round((value - minutes) * 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export function PaceChart({ data }: ChartProps) {
  const latestPace = data.at(-1)?.pace ?? 0;
  const averagePace =
    data.length > 0 ? data.reduce((sum, entry) => sum + entry.pace, 0) / data.length : 0;

  return (
    <motion.div
      initial={{ opacity: 0, scaleY: 0.92 }}
      animate={{ opacity: 1, scaleY: 1 }}
      transition={{ duration: 0.45 }}
      style={{ transformOrigin: 'bottom' }}
      className="glass-panel rounded-2xl p-6"
    >
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-text-primary">Pace Trend</h3>
          <p className="mt-1 text-sm text-text-secondary">
            Pace across distance, with the average shown as a reference line.
          </p>
        </div>
        <div className="rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-text-secondary">
          {formatPace(latestPace)} avg pace
        </div>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="paceGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--accent-run)" stopOpacity={0.45} />
              <stop offset="95%" stopColor="var(--accent-run)" stopOpacity={0.03} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" strokeOpacity={0.65} />
          <XAxis
            dataKey="distance"
            stroke="var(--text-secondary)"
            tickLine={false}
            axisLine={false}
            tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
            label={{ value: 'Distance', position: 'insideBottomRight', offset: -6 }}
          />
          <YAxis
            stroke="var(--text-secondary)"
            tickLine={false}
            axisLine={false}
            tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
            label={{ value: 'Pace', angle: -90, position: 'insideLeft' }}
          />
          <ReferenceLine
            y={averagePace}
            stroke="var(--accent-pr)"
            strokeDasharray="4 4"
            strokeOpacity={0.8}
            label={{
              value: 'Average',
              position: 'right',
              fill: 'var(--text-secondary)',
              fontSize: 12,
            }}
          />
          <Tooltip
            formatter={(value: unknown) => [
              typeof value === 'number' ? formatPace(value) : String(value ?? ''),
              'Pace',
            ]}
            labelFormatter={label => `Distance ${label} km`}
          />
          <Area
            type="monotone"
            dataKey="pace"
            stroke="var(--accent-run)"
            fill="url(#paceGradient)"
            strokeWidth={2.5}
            dot={false}
            activeDot={{ r: 4, strokeWidth: 0 }}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </motion.div>
  );
}
