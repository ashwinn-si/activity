'use client';

import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from 'recharts';
import { getSportMeta } from '@/utils/sportConfig';

interface ChartProps {
  data: { name: string; value: number }[];
}

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
            label={({ name, value }) => `${getSportMeta(String(name ?? '')).label}: ${value}%`}
            outerRadius={100}
            dataKey="value"
          >
            {data.map(entry => (
              <Cell
                key={`cell-${entry.name}`}
                fill={getSportMeta(entry.name).hex}
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
            formatter={(value: unknown, name: unknown) => [
              typeof value === 'number' ? `${value}%` : String(value ?? ''),
              typeof name === 'string' ? getSportMeta(name).label : String(name ?? ''),
            ]}
          />
          <Legend
            wrapperStyle={{ paddingTop: '16px' }}
            iconType="circle"
            iconSize={10}
            formatter={(v) => getSportMeta(String(v)).label}
          />
        </PieChart>
      </ResponsiveContainer>
    </motion.div>
  );
}
