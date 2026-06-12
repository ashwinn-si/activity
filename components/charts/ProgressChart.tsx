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
} from 'recharts';

interface ChartProps {
  data: { time: number; distance: number }[];
}

function formatDistance(value: number) {
  return Number.isFinite(value) ? value.toFixed(1) : '0.0';
}

function formatTime(minutes: number) {
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (hrs === 0) return `${mins} min`;
  if (mins === 0) return `${hrs} hr`;

  return `${hrs} hr ${mins} min`;
}

export function ProgressChart({ data }: ChartProps) {
  const latestDistance = data.at(-1)?.distance ?? 0;

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
          <h3 className="text-lg font-semibold text-text-primary">Distance Progress Over Time</h3>
          <p className="mt-1 text-sm text-text-secondary">
            Cumulative distance over time with the peak shown as a reference.
          </p>
        </div>

        <div className="rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-text-secondary">
          {formatDistance(latestDistance)} km latest
        </div>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data} margin={{ top: 10, right: 24, left: 0, bottom: 8 }}>
          <defs>
            <linearGradient id="distanceGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--accent-run)" stopOpacity={0.45} />
              <stop offset="95%" stopColor="var(--accent-run)" stopOpacity={0.03} />
            </linearGradient>
          </defs>

          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" strokeOpacity={0.65} />

          <XAxis
            dataKey="time"
            stroke="var(--text-secondary)"
            tickLine={false}
            axisLine={false}
            tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
            interval="preserveStartEnd"
            minTickGap={24}
            tickCount={8}
            tickFormatter={formatTime}
            label={{
              value: 'Time',
              position: 'insideBottomRight',
              offset: -6,
            }}
          />

          <YAxis
            stroke="var(--text-secondary)"
            tickLine={false}
            axisLine={false}
            tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
            label={{
              value: 'Distance (km)',
              angle: -90,
              position: 'insideLeft',
            }}
          />

          <Tooltip
            contentStyle={{
              backgroundColor: 'var(--tooltip-background)',
              border: '1px solid var(--tooltip-border)',
              borderRadius: '12px',
              boxShadow: 'var(--tooltip-shadow)',
            }}
            formatter={(value: unknown) => [
              typeof value === 'number' ? value.toFixed(1) : String(value ?? ''),
              'Distance (km)',
            ]}
            labelFormatter={label => `Time ${formatTime(Number(label))}`}
          />

          <Area
            type="monotone"
            dataKey="distance"
            stroke="var(--accent-run)"
            fill="url(#distanceGradient)"
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
