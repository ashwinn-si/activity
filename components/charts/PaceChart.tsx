'use client';

import { motion } from 'framer-motion';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts';
import { getSportMeta } from '@/utils/sportConfig';

interface ChartProps {
  data: { distance: number; pace: number }[];  // pace = raw m/s from velocity_smooth
  sportType?: string;
}

function fmtPace(minsPerKm: number) {
  if (!Number.isFinite(minsPerKm) || minsPerKm <= 0) return '–';
  const m = Math.floor(minsPerKm);
  const s = Math.round((minsPerKm - m) * 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function fmtSpeed(kmh: number) {
  return `${kmh.toFixed(1)} km/h`;
}

export function PaceChart({ data, sportType = 'Run' }: ChartProps) {
  const meta = getSportMeta(sportType);
  const usePace = meta.usePace;

  // Convert raw m/s → display unit for each point
  const converted = data
    .filter((d) => d.pace > 0.5)                                   // filter stops/glitches
    .map((d) => ({
      distance: d.distance,
      value: usePace ? 1000 / d.pace / 60 : d.pace * 3.6,         // min/km or km/h
    }));

  const avg =
    converted.length > 0
      ? converted.reduce((s, d) => s + d.value, 0) / converted.length
      : 0;

  const label = usePace ? 'Pace' : 'Speed';
  const yAxisLabel = usePace ? 'min/km' : 'km/h';
  const avgLabel = usePace ? `${fmtPace(avg)} avg pace` : `${fmtSpeed(avg)} avg speed`;

  const allVals = converted.map((d) => d.value);
  const minVal = allVals.length ? Math.min(...allVals) : 0;
  const maxVal = allVals.length ? Math.max(...allVals) : 1;
  const pad = (maxVal - minVal) * 0.15 || 1;
  const yDomain: [number, number] = [Math.max(0, minVal - pad), maxVal + pad];

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
          <h3 className="text-lg font-semibold text-text-primary">{label} Trend</h3>
          <p className="mt-1 text-sm text-text-secondary">
            {label} across distance, with average reference line.
          </p>
        </div>
        <div className="rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-text-secondary">
          {avgLabel}
        </div>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={converted}>
          <defs>
            <linearGradient id="velGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor={meta.hex} stopOpacity={0.45} />
              <stop offset="95%" stopColor={meta.hex} stopOpacity={0.03} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" strokeOpacity={0.65} />
          <XAxis
            dataKey="distance"
            tickLine={false} axisLine={false}
            tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
            label={{ value: 'Distance (km)', position: 'insideBottomRight', offset: -6, fontSize: 12, fill: 'var(--text-secondary)' }}
          />
          <YAxis
            tickLine={false} axisLine={false}
            tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
            domain={yDomain}
            label={{ value: yAxisLabel, angle: -90, position: 'insideLeft', fontSize: 12, fill: 'var(--text-secondary)' }}
            tickFormatter={(v) => typeof v === 'number' ? (usePace ? v.toFixed(1) : v.toFixed(0)) : v}
          />
          <ReferenceLine
            y={avg}
            stroke={meta.hex}
            strokeDasharray="4 4"
            strokeOpacity={0.7}
            label={{ value: 'Avg', position: 'right', fill: 'var(--text-secondary)', fontSize: 12 }}
          />
          <Tooltip
            formatter={(v: unknown) => [
              typeof v === 'number'
                ? usePace ? `${fmtPace(v)} /km` : fmtSpeed(v)
                : String(v),
              label,
            ]}
            labelFormatter={(l) => `Distance ${l} km`}
            contentStyle={{
              background: 'var(--tooltip-background)',
              border: '1px solid var(--tooltip-border)',
              borderRadius: 10,
              fontSize: 12,
            }}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke={meta.hex}
            fill="url(#velGradient)"
            strokeWidth={2.5}
            dot={false}
            activeDot={{ r: 4, strokeWidth: 0, fill: meta.hex }}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </motion.div>
  );
}
