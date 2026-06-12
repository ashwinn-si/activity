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
  data: any[];
}

export function WeeklyVolumeChart({ data }: ChartProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scaleY: 0.92 }}
      animate={{ opacity: 1, scaleY: 1 }}
      transition={{ duration: 0.45 }}
      style={{ transformOrigin: 'bottom' }}
      className="bg-surface border border-border rounded-2xl p-6"
    >
      <h3 className="text-lg font-semibold text-text-primary mb-4">
        Weekly Volume
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
          <XAxis dataKey="name" stroke="#6b7280" />
          <YAxis stroke="#6b7280" />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1a1a1a',
              border: '1px solid #262626',
            }}
          />
          <Legend />
          <Bar dataKey="Ride" stackId="a" fill="#f97316" />
          <Bar dataKey="Run" stackId="a" fill="#3b82f6" />
          <Bar dataKey="Walk" stackId="a" fill="#22c55e" />
        </BarChart>
      </ResponsiveContainer>
    </motion.div>
  );
}
