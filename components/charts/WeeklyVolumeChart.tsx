'use client';

import { motion } from 'framer-motion';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface ChartProps {
  data: Record<string, string | number>[];
}

export function WeeklyVolumeChart({ data }: ChartProps) {
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
          <h3 className="text-lg font-semibold text-text-primary">Weekly Volume</h3>
          <p className="mt-1 text-sm text-text-secondary">Distance per week by activity type.</p>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} margin={{ top: 10, right: 24, left: 0, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" strokeOpacity={0.65} />
          <XAxis
            dataKey="name"
            stroke="var(--text-secondary)"
            tickLine={false}
            axisLine={false}
            tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
          />
          <YAxis
            stroke="var(--text-secondary)"
            tickLine={false}
            axisLine={false}
            tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'var(--tooltip-background)',
              border: '1px solid var(--tooltip-border)',
              borderRadius: '12px',
              boxShadow: 'var(--tooltip-shadow)',
            }}
            cursor={{ fill: 'var(--border)', opacity: 0.4 }}
          />
          <Legend wrapperStyle={{ paddingTop: '16px' }} iconType="square" iconSize={10} />
          <Bar dataKey="Ride" stackId="a" fill="var(--accent-ride)" radius={[0, 0, 0, 0]} />
          <Bar dataKey="Run" stackId="a" fill="var(--accent-run)" radius={[0, 0, 0, 0]} />
          <Bar dataKey="Walk" stackId="a" fill="var(--accent-walk)" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </motion.div>
  );
}
