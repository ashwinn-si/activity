'use client';

import { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { format, parseISO } from 'date-fns';

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
  const chartData = useMemo(() => {
    if (!activities || activities.length === 0) return [];

    const sortedActivities = [...activities].sort(
      (a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
    );

    let rideDistance = 0;
    let runDistance = 0;

    return sortedActivities.map(activity => {
      if (activity.type === 'Ride') {
        rideDistance += activity.distance;
      } else if (activity.type === 'Run') {
        runDistance += activity.distance;
      }

      return {
        date: format(parseISO(activity.start_date), 'MMM dd'),
        fullDate: format(parseISO(activity.start_date), 'MMM dd, yyyy'),
        rideDistance: Math.round((rideDistance / 1000) * 100) / 100,
        runDistance: Math.round((runDistance / 1000) * 100) / 100,
        totalDistance: Math.round(((rideDistance + runDistance) / 1000) * 100) / 100,
      };
    });
  }, [activities]);

  const latest = chartData.at(-1);

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
            Cumulative ride, run, and combined distance across activities.
          </p>
        </div>
        <div className="rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-text-secondary">
          {latest ? `${latest.totalDistance.toFixed(2)} km total` : '0 km total'}
        </div>
      </div>

      <div className="h-96 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 24, left: 0, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" strokeOpacity={0.65} />
            <XAxis
              dataKey="date"
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
              label={{ value: 'Distance (km)', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip
              labelStyle={{ color: 'var(--tooltip-label)' }}
              cursor={{ stroke: 'var(--tooltip-border)', strokeWidth: 2 }}
              formatter={value => {
                if (typeof value === 'number') {
                  return `${value.toFixed(2)} km`;
                }
                return value;
              }}
              labelFormatter={label => `Date: ${label}`}
            />
            <Legend
              wrapperStyle={{ paddingTop: '16px' }}
              iconType="line"
              iconSize={18}
              formatter={value => {
                const labels: { [key: string]: string } = {
                  rideDistance: 'Bike Ride Distance',
                  runDistance: 'Run Distance',
                  totalDistance: 'Total Distance',
                };
                return labels[value] || value;
              }}
            />
            <Line
              type="monotone"
              dataKey="rideDistance"
              stroke="var(--accent-run)"
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 0 }}
              isAnimationActive={true}
              animationDuration={800}
              name="rideDistance"
            />
            <Line
              type="monotone"
              dataKey="runDistance"
              stroke="var(--accent-pr)"
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 0 }}
              isAnimationActive={true}
              animationDuration={800}
              name="runDistance"
            />
            <Line
              type="monotone"
              dataKey="totalDistance"
              stroke="var(--accent-walk)"
              strokeWidth={2.5}
              strokeDasharray="5 5"
              dot={false}
              activeDot={{ r: 4, strokeWidth: 0 }}
              isAnimationActive={true}
              animationDuration={800}
              name="totalDistance"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-6 grid grid-cols-3 gap-4 border-t border-border pt-6">
        <div className="rounded-2xl border border-border bg-surface/70 p-4 text-center">
          <div className="mb-2 flex items-center justify-center">
            <div className="mr-2 h-3 w-3 rounded-full bg-accent-run"></div>
            <p className="text-sm font-medium text-text-secondary">Bike</p>
          </div>
          <p className="text-2xl font-bold text-text-primary">{latest?.rideDistance || 0}</p>
          <p className="text-xs text-text-secondary">km total</p>
        </div>
        <div className="rounded-2xl border border-border bg-surface/70 p-4 text-center">
          <div className="mb-2 flex items-center justify-center">
            <div className="mr-2 h-3 w-3 rounded-full bg-accent-pr"></div>
            <p className="text-sm font-medium text-text-secondary">Run</p>
          </div>
          <p className="text-2xl font-bold text-text-primary">{latest?.runDistance || 0}</p>
          <p className="text-xs text-text-secondary">km total</p>
        </div>
        <div className="rounded-2xl border border-border bg-surface/70 p-4 text-center">
          <div className="mb-2 flex items-center justify-center">
            <div className="mr-2 h-3 w-3 rounded-full bg-accent-walk"></div>
            <p className="text-sm font-medium text-text-secondary">Combined</p>
          </div>
          <p className="text-2xl font-bold text-text-primary">{latest?.totalDistance || 0}</p>
          <p className="text-xs text-text-secondary">km total</p>
        </div>
      </div>
    </div>
  );
}
