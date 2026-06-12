'use client';

import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from 'recharts';

interface ChartProps {
  data: { name: string; value: number }[];
}

export function SportBreakdownChart({ data }: ChartProps) {
  const COLORS = {
    Run: '#3b82f6',
    Ride: '#f97316',
    Walk: '#22c55e',
  };

  return (
    <motion.div
      initial={{ opacity: 0, scaleY: 0.92 }}
      animate={{ opacity: 1, scaleY: 1 }}
      transition={{ duration: 0.45 }}
      style={{ transformOrigin: 'bottom' }}
      className="glass-panel rounded-2xl p-6"
    >
      <h3 className="text-lg font-semibold text-text-primary mb-4">
        Sport Breakdown
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, value }) => `${name}: ${value}%`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((entry) => (
              <Cell key={`cell-${entry.name}`} fill={COLORS[entry.name as keyof typeof COLORS] || '#666'} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: '#1a1a1a',
              border: '1px solid #262626',
            }}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </motion.div>
  );
}
