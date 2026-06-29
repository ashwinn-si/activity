'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { getSportMeta } from '@/utils/sportConfig';

interface ChartProps {
  data: Record<string, string | number>[];
}

export function WeeklyVolumeChart({ data }: ChartProps) {
  // Derive sport types dynamically from the data keys (exclude 'name' which is the week label)
  const sportTypes = useMemo(() => {
    const keys = new Set<string>();
    for (const row of data) {
      for (const k of Object.keys(row)) {
        if (k !== 'name') keys.add(k);
      }
    }
    return [...keys];
  }, [data]);

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
            tickLine={false} axisLine={false}
            tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
          />
          <YAxis
            tickLine={false} axisLine={false}
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
            formatter={(value: unknown, name: unknown) => [
              typeof value === 'number' ? `${value.toFixed(1)} km` : String(value ?? ''),
              typeof name === 'string' ? getSportMeta(name).label : String(name ?? ''),
            ]}
          />
          <Legend
            wrapperStyle={{ paddingTop: '16px' }}
            iconType="square"
            iconSize={10}
            formatter={(v) => getSportMeta(String(v)).label}
          />
          {sportTypes.map((type, i) => {
            const meta = getSportMeta(type);
            // Last sport type gets rounded top corners
            const isTop = i === sportTypes.length - 1;
            return (
              <Bar
                key={type}
                dataKey={type}
                stackId="a"
                fill={meta.hex}
                radius={isTop ? [4, 4, 0, 0] : [0, 0, 0, 0]}
              />
            );
          })}
        </BarChart>
      </ResponsiveContainer>
    </motion.div>
  );
}
