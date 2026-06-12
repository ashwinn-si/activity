'use client';

import { motion } from 'framer-motion';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface ChartProps {
  data: { time: number; distance: number }[];
}

export function ProgressChart({ data }: ChartProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scaleY: 0.92 }}
      animate={{ opacity: 1, scaleY: 1 }}
      transition={{ duration: 0.45 }}
      style={{ transformOrigin: 'bottom' }}
      className="bg-surface border border-border rounded-2xl p-6"
    >
      <h3 className="text-lg font-semibold text-text-primary mb-4">
        Distance Progress Over Time
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
          <XAxis
            dataKey="time"
            stroke="#6b7280"
            label={{ value: 'Time (mins)', position: 'insideBottomRight', offset: -5 }}
          />
          <YAxis
            stroke="#6b7280"
            label={{ value: 'Distance (km)', angle: -90, position: 'insideLeft' }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1a1a1a',
              border: '1px solid #262626',
            }}
            formatter={(value: unknown) => [
              typeof value === 'number' ? value.toFixed(1) : String(value ?? ''),
              'Distance (km)',
            ]}
            labelFormatter={(label) => `${label} mins`}
          />
          <Line
            type="monotone"
            dataKey="distance"
            stroke="#3b82f6"
            dot={false}
            isAnimationActive={false}
            strokeWidth={2}
          />
        </LineChart>
      </ResponsiveContainer>
    </motion.div>
  );
}
