'use client';

import { useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { format, parseISO } from 'date-fns';
import { getSportMeta } from '@/utils/sportConfig';

interface Activity {
  id: number;
  name: string;
  type: string;
  distance: number;
  start_date: string;
  [key: string]: unknown;
}

interface DistanceProgressChartProps {
  activities: Activity[];
}

export function DistanceProgressChart({ activities }: DistanceProgressChartProps) {
  const { chartData, sportTypes, totalKm } = useMemo<{
    chartData: Record<string, string | number>[];
    sportTypes: string[];
    totalKm: number;
  }>(() => {
    if (!activities || activities.length === 0)
      return { chartData: [], sportTypes: [], totalKm: 0 };

    const sorted = [...activities].sort(
      (a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
    );

    // Discover all sport types in this dataset
    const types = [...new Set(sorted.map((a) => a.type))];
    const running: Record<string, number> = Object.fromEntries(types.map((t) => [t, 0]));
    let total = 0;

    const data = sorted.map((activity) => {
      running[activity.type] = (running[activity.type] ?? 0) + activity.distance;
      total += activity.distance;
      return {
        date: format(parseISO(activity.start_date), 'MMM dd'),
        fullDate: format(parseISO(activity.start_date), 'MMM dd, yyyy'),
        total: Math.round((total / 1000) * 100) / 100,
        ...Object.fromEntries(
          types.map((t) => [t, Math.round(((running[t] ?? 0) / 1000) * 100) / 100])
        ),
      };
    });

    return { chartData: data, sportTypes: types, totalKm: Math.round((total / 1000) * 100) / 100 };
  }, [activities]);

  if (chartData.length === 0) {
    return (
      <div className="glass-panel flex h-96 w-full items-center justify-center rounded-2xl p-6">
        <p className="text-sm text-text-secondary">No activity data available</p>
      </div>
    );
  }

  return (
    <div className="glass-panel rounded-2xl p-6">
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-text-primary">Distance Progress Over Time</h3>
          <p className="mt-1 text-sm text-text-secondary">
            Cumulative distance per sport type.
          </p>
        </div>
        <div className="rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-text-secondary">
          {totalKm.toFixed(2)} km total
        </div>
      </div>

      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 24, left: 0, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" strokeOpacity={0.65} />
            <XAxis
              dataKey="date"
              tickLine={false} axisLine={false}
              tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
            />
            <YAxis
              tickLine={false} axisLine={false}
              tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
              label={{ value: 'km', angle: -90, position: 'insideLeft', fontSize: 12, fill: 'var(--text-secondary)' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--tooltip-background)',
                border: '1px solid var(--tooltip-border)',
                borderRadius: '12px',
              }}
              labelStyle={{ color: 'var(--tooltip-label)' }}
              cursor={{ stroke: 'var(--tooltip-border)', strokeWidth: 2 }}
              formatter={(value: unknown, name: unknown) => [
                typeof value === 'number' ? `${value.toFixed(2)} km` : String(value ?? ''),
                typeof name === 'string' && name !== 'total'
                  ? getSportMeta(name).label
                  : 'All Sports',
              ]}
              labelFormatter={(l) => `Date: ${l}`}
            />
            <Legend
              wrapperStyle={{ paddingTop: '16px' }}
              iconType="line"
              iconSize={18}
              formatter={(v) =>
                v === 'total' ? 'All Sports' : getSportMeta(String(v)).label
              }
            />

            {/* One line per sport type */}
            {sportTypes.map((type) => {
              const meta = getSportMeta(type);
              return (
                <Line
                  key={type}
                  type="monotone"
                  dataKey={type}
                  stroke={meta.hex}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 0 }}
                  isAnimationActive={true}
                  animationDuration={800}
                />
              );
            })}

            {/* Dashed total line (only when >1 sport) */}
            {sportTypes.length > 1 && (
              <Line
                type="monotone"
                dataKey="total"
                stroke="#888"
                strokeWidth={1.5}
                strokeDasharray="5 5"
                dot={false}
                activeDot={{ r: 3, strokeWidth: 0 }}
                isAnimationActive={true}
                animationDuration={800}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Summary tiles — one per sport */}
      <div className={`mt-6 grid gap-4 border-t border-border pt-6`}
        style={{ gridTemplateColumns: `repeat(${Math.min(sportTypes.length + (sportTypes.length > 1 ? 1 : 0), 4)}, 1fr)` }}
      >
        {sportTypes.map((type) => {
          const meta = getSportMeta(type);
          const km = (chartData[chartData.length - 1]?.[type] as number | undefined) ?? 0;
          return (
            <div key={type} className="rounded-2xl border border-border bg-surface/70 p-4 text-center">
              <div className="mb-2 flex items-center justify-center gap-1.5">
                <div className="h-2.5 w-2.5 rounded-full" style={{ background: meta.hex }} />
                <p className="text-sm font-medium text-text-secondary">{meta.label}</p>
              </div>
              <p className="text-2xl font-bold text-text-primary">{km}</p>
              <p className="text-xs text-text-secondary">km total</p>
            </div>
          );
        })}
        {sportTypes.length > 1 && (
          <div className="rounded-2xl border border-border bg-surface/70 p-4 text-center">
            <div className="mb-2 flex items-center justify-center gap-1.5">
              <div className="h-2.5 w-2.5 rounded-full bg-text-muted" />
              <p className="text-sm font-medium text-text-secondary">Combined</p>
            </div>
            <p className="text-2xl font-bold text-text-primary">{totalKm}</p>
            <p className="text-xs text-text-secondary">km total</p>
          </div>
        )}
      </div>
    </div>
  );
}
