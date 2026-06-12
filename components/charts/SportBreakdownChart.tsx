'use client';

import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from 'recharts';

interface ChartProps {
  data: { name: string; value: number }[];
}

const SPORT_COLORS: Record<string, string> = {
  Run: 'var(--accent-run)',
  Ride: 'var(--accent-ride)',
  Walk: 'var(--accent-walk)',
};

export function SportBreakdownChart({ data }: ChartProps) {
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
          <h3 className="text-lg font-semibold text-text-primary">Sport Breakdown</h3>
          <p className="mt-1 text-sm text-text-secondary">Activity share by sport type.</p>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, value }) => `${name}: ${value}%`}
            outerRadius={100}
            dataKey="value"
          >
            {data.map(entry => (
              <Cell
                key={`cell-${entry.name}`}
                fill={SPORT_COLORS[entry.name] ?? 'var(--text-secondary)'}
              />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: 'var(--tooltip-background)',
              border: '1px solid var(--tooltip-border)',
              borderRadius: '12px',
              boxShadow: 'var(--tooltip-shadow)',
            }}
            formatter={(value: unknown) => [
              typeof value === 'number' ? `${value}%` : String(value ?? ''),
            ]}
          />
          <Legend wrapperStyle={{ paddingTop: '16px' }} iconType="circle" iconSize={10} />
        </PieChart>
      </ResponsiveContainer>
    </motion.div>
  );
}
