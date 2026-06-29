'use client';

import { useEffect, useState, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import {
  GitCompare, ArrowLeft, TrendingUp, TrendingDown,
  Minus, ChevronRight, RotateCcw,
} from 'lucide-react';
import { getSportMeta } from '@/utils/sportConfig';
import Link from 'next/link';
import useStravaStore from '@/store/useStravaStore';
import { formatDistance, formatDuration, formatPace, formatSpeed } from '@/utils/formatters';
import { Skeleton } from '@/components/ui/Skeleton';
import { SessionPicker } from '@/components/ui/SessionPicker';

/* ─── types ─────────────────────────────────────────────────── */
interface Activity {
  id: number; name: string; type: string;
  distance: number; moving_time: number;
  elevation_gain?: number; start_date: string;
  average_speed: number; max_speed?: number;
  average_heartrate?: number; max_heartrate?: number;
  [key: string]: unknown;
}
interface StreamData { data: number[] }
interface Streams {
  distance?: StreamData; time?: StreamData;
  heartrate?: StreamData; velocity_smooth?: StreamData; altitude?: StreamData;
}
interface SessionData { activity: Activity; streams: Streams }

/* ─── constants ──────────────────────────────────────────────── */
// Hard hex — CSS vars don't resolve inside Recharts SVG context
const COLOR_A = '#3b82f6'; // blue
const COLOR_B = '#f97316'; // orange


/* ─── helpers ────────────────────────────────────────────────── */
function fmtSplit(s: number) {
  const m = Math.floor(s / 60), sec = Math.round(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

function computeKmSplits(dist: number[], time: number[]) {
  const out: { km: number; s: number }[] = [];
  const totalKm = Math.floor((dist[dist.length - 1] ?? 0) / 1000);
  let prev = 0;
  for (let km = 1; km <= totalKm; km++) {
    const target = km * 1000;
    const idx = dist.findIndex((d) => d >= target);
    if (idx < 1) break;
    const frac = (target - dist[idx - 1]) / (dist[idx] - dist[idx - 1]);
    const t = time[idx - 1] + frac * (time[idx] - time[idx - 1]);
    out.push({ km, s: t - prev });
    prev = t;
  }
  return out;
}

/* Interpolate a sorted (km, val) series at a target km using linear interp */
function interp(pts: { km: number; val: number }[], target: number): number | null {
  if (!pts.length || target < pts[0].km || target > pts[pts.length - 1].km) return null;
  let lo = 0, hi = pts.length - 1;
  while (lo < hi - 1) { const mid = (lo + hi) >> 1; if (pts[mid].km <= target) lo = mid; else hi = mid; }
  const p0 = pts[lo], p1 = pts[hi];
  if (p0.km === p1.km) return p0.val;
  return p0.val + ((target - p0.km) / (p1.km - p0.km)) * (p1.val - p0.val);
}

function buildOverlay(
  a: SessionData, b: SessionData,
  key: 'velocity' | 'heartrate' | 'altitude',
  usePace: boolean,
) {
  const extract = (sess: SessionData): { km: number; val: number }[] => {
    const dist = sess.streams.distance?.data ?? [];
    const raw = key === 'velocity' ? sess.streams.velocity_smooth?.data
      : key === 'heartrate' ? sess.streams.heartrate?.data
      : sess.streams.altitude?.data;
    if (!raw || !dist.length) return [];
    return dist.reduce<{ km: number; val: number }[]>((acc, d, i) => {
      const v = raw[i];
      if (key === 'velocity' && (!v || v < 0.5)) return acc;  // filter stops/glitches
      const val = key === 'velocity'
        ? (usePace ? 1000 / v / 60 : v * 3.6)
        : v;
      acc.push({ km: d / 1000, val });
      return acc;
    }, []);
  };

  const aV = extract(a), bV = extract(b);
  if (!aV.length && !bV.length) return [];

  // If only one session has data, render that series alone over its full range
  if (!aV.length || !bV.length) {
    const pts = aV.length ? aV : bV;
    const isA = aV.length > 0;
    const STEP = 0.05;
    const result: { km: number; a?: number; b?: number }[] = [];
    for (let km = pts[0].km + STEP; km <= pts[pts.length - 1].km + 0.001; km += STEP) {
      const kmR = Math.round(km * 100) / 100;
      const v = interp(pts, kmR);
      if (v !== null) result.push(isA ? { km: kmR, a: v } : { km: kmR, b: v });
    }
    return result;
  }

  // Overlap range — both sessions have data
  const startKm = Math.max(aV[0].km, bV[0].km);
  const maxKm   = Math.min(aV[aV.length - 1].km, bV[bV.length - 1].km);
  if (maxKm <= startKm) return [];

  // Sample both at fixed 0.05 km grid — guarantees aligned, continuous lines
  const STEP = 0.05;
  const result: { km: number; a?: number; b?: number }[] = [];
  for (let km = startKm + STEP; km <= maxKm + 0.001; km += STEP) {
    const kmR = Math.round(km * 100) / 100;
    const av = interp(aV, kmR);
    const bv = interp(bV, kmR);
    if (av !== null || bv !== null)
      result.push({ km: kmR, a: av ?? undefined, b: bv ?? undefined });
  }
  return result;
}

/* ─── sub-components ────────────────────────────────────────── */

function SportTypeStep({
  types, counts, onSelect,
}: {
  types: string[]; counts: Record<string, number>; onSelect: (t: string) => void;
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
      <p className="text-sm text-text-secondary mb-4 font-medium uppercase tracking-widest">
        Step 1 · Choose sport
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {types.map((type) => {
          const m = getSportMeta(type);
          const Icon = m.icon;
          return (
            <motion.button
              key={type}
              whileHover={{ y: -3, scale: 1.01 }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 300, damping: 22 }}
              onClick={() => onSelect(type)}
              className="glass-panel rounded-2xl p-5 flex flex-col items-start gap-3 border transition-all duration-200 cursor-pointer text-left"
              style={{ borderColor: `${m.hex}35` }}
            >
              <div
                className="p-2.5 rounded-xl"
                style={{ background: `${m.hex}18`, color: m.hex }}
              >
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <p className="font-semibold text-lg" style={{ color: m.hex }}>{m.label}</p>
                <p className="text-text-secondary text-sm">{counts[type]} sessions</p>
              </div>
              <ChevronRight className="w-4 h-4 text-text-muted self-end" />
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
}

function StatCard({
  label, valA, valB, higherIsBetter = true,
}: {
  label: string; valA: string; valB: string; higherIsBetter?: boolean;
}) {
  // Try to parse a numeric winner
  const numA = parseFloat(valA.replace(/[^\d.]/g, ''));
  const numB = parseFloat(valB.replace(/[^\d.]/g, ''));
  const aWins = !isNaN(numA) && !isNaN(numB) && (higherIsBetter ? numA > numB : numA < numB);
  const bWins = !isNaN(numA) && !isNaN(numB) && (higherIsBetter ? numB > numA : numB < numA);

  return (
    <div className="glass-panel rounded-2xl p-4 flex flex-col gap-2">
      <p className="text-[10px] uppercase tracking-widest font-semibold text-text-secondary">{label}</p>
      <div className="flex items-center gap-2">
        {/* A */}
        <div className={`flex-1 rounded-xl px-3 py-2.5 transition-colors ${aWins ? 'bg-[#3b82f6]/12' : 'bg-white/4'}`}>
          <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: COLOR_A }}>A</p>
          <p className={`font-mono font-bold text-base leading-none ${aWins ? '' : 'text-text-secondary'}`}
             style={{ color: aWins ? COLOR_A : undefined }}>
            {valA}
          </p>
        </div>
        <span className="text-text-muted text-xs font-medium flex-shrink-0">vs</span>
        {/* B */}
        <div className={`flex-1 rounded-xl px-3 py-2.5 transition-colors ${bWins ? 'bg-[#f97316]/12' : 'bg-white/4'}`}>
          <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: COLOR_B }}>B</p>
          <p className={`font-mono font-bold text-base leading-none ${bWins ? '' : 'text-text-secondary'}`}
             style={{ color: bWins ? COLOR_B : undefined }}>
            {valB}
          </p>
        </div>
      </div>
    </div>
  );
}

function SessionHeader({ sess, slot }: { sess: SessionData; slot: 'A' | 'B' }) {
  const color = slot === 'A' ? COLOR_A : COLOR_B;
  const m = getSportMeta(sess.activity.type);
  const Icon = m.icon;
  return (
    <div
      className="glass-panel rounded-2xl p-5 flex items-start gap-4 border-t-2"
      style={{ borderColor: color }}
    >
      <div className="flex-shrink-0">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm text-white"
          style={{ background: color }}
        >
          {slot}
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-text-primary leading-snug truncate">{sess.activity.name}</p>
        <p className="text-xs text-text-secondary mt-1">
          {new Date(sess.activity.start_date).toLocaleDateString('en-US', {
            weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
          })}
        </p>
        <div className="flex items-center gap-3 mt-2 text-xs font-mono text-text-secondary">
          <span>{formatDistance(sess.activity.distance)}</span>
          <span className="text-text-muted">·</span>
          <span>{formatDuration(sess.activity.moving_time)}</span>
          <span className="text-text-muted">·</span>
          <span>{m.usePace ? formatPace(sess.activity.average_speed) : formatSpeed(sess.activity.average_speed)}</span>
        </div>
      </div>
      <div className="p-2 rounded-xl flex-shrink-0" style={{ background: `${m.hex}18`, color: m.hex }}>
        <Icon className="w-4 h-4" />
      </div>
    </div>
  );
}

function SplitTable({ sessA, sessB, nameA, nameB }: {
  sessA: SessionData; sessB: SessionData; nameA: string; nameB: string;
}) {
  const splitsA = computeKmSplits(sessA.streams.distance?.data ?? [], sessA.streams.time?.data ?? []);
  const splitsB = computeKmSplits(sessB.streams.distance?.data ?? [], sessB.streams.time?.data ?? []);
  const rows = Math.min(splitsA.length, splitsB.length);
  if (rows === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      className="glass-panel rounded-2xl p-6"
    >
      <h3 className="text-base font-semibold text-text-primary mb-1">Km Splits</h3>
      <p className="text-sm text-text-secondary mb-4">Time for each km — winner highlighted.</p>
      <div className="overflow-x-auto">
        <div className="overflow-y-auto" style={{ maxHeight: 400 }}>
        <table className="w-full text-sm">
          <thead className="sticky top-0 z-10" style={{ background: 'var(--background)' }}>
            <tr className="border-b border-border">
              <th className="pb-3 pt-1 text-left font-medium text-text-secondary w-12">Km</th>
              <th className="pb-3 pt-1 text-center font-medium" style={{ color: COLOR_A }}>{nameA}</th>
              <th className="pb-3 pt-1 text-center font-medium" style={{ color: COLOR_B }}>{nameB}</th>
              <th className="pb-3 pt-1 text-right font-medium text-text-secondary">Δ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/30">
            {Array.from({ length: rows }, (_, i) => {
              const a = splitsA[i]!, b = splitsB[i]!;
              const diff = a.s - b.s;
              const aFaster = diff < -2, bFaster = diff > 2;
              const DiffIcon = Math.abs(diff) < 2 ? Minus : diff < 0 ? TrendingDown : TrendingUp;
              const diffColor = Math.abs(diff) < 2 ? 'text-text-muted' : diff < 0 ? '' : '';

              return (
                <tr key={a.km} className="group">
                  <td className="py-2.5 font-semibold text-text-primary">{a.km}</td>
                  <td className="py-2.5 text-center">
                    <span
                      className={`font-mono text-sm px-2 py-0.5 rounded-lg ${aFaster ? 'font-bold' : ''}`}
                      style={{
                        color: COLOR_A,
                        background: aFaster ? `${COLOR_A}18` : undefined,
                      }}
                    >
                      {fmtSplit(a.s)}
                    </span>
                  </td>
                  <td className="py-2.5 text-center">
                    <span
                      className={`font-mono text-sm px-2 py-0.5 rounded-lg ${bFaster ? 'font-bold' : ''}`}
                      style={{
                        color: COLOR_B,
                        background: bFaster ? `${COLOR_B}18` : undefined,
                      }}
                    >
                      {fmtSplit(b.s)}
                    </span>
                  </td>
                  <td className={`py-2.5 text-right font-mono text-xs ${diffColor}`}>
                    <span
                      className="flex items-center justify-end gap-1"
                      style={{ color: aFaster ? COLOR_A : bFaster ? COLOR_B : '#999' }}
                    >
                      <DiffIcon className="w-3 h-3" />
                      {fmtSplit(Math.abs(diff))}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        </div>
      </div>
      {rows > 10 && (
        <p className="mt-2 text-center text-[11px]" style={{ color: 'var(--text-muted)' }}>
          Scroll to see all {rows} splits
        </p>
      )}
    </motion.div>
  );
}

function OverlayChart({
  sessA, sessB, nameA, nameB, dataKey, usePace,
}: {
  sessA: SessionData; sessB: SessionData; nameA: string; nameB: string;
  dataKey: 'velocity' | 'heartrate' | 'altitude';
  usePace: boolean;
}) {
  const data = useMemo(
    () => buildOverlay(sessA, sessB, dataKey, usePace),
    [sessA, sessB, dataKey, usePace],
  );
  if (data.length === 0) return null;

  const isVelocity = dataKey === 'velocity';
  const isAlt      = dataKey === 'altitude';
  const title      = isVelocity ? (usePace ? 'Pace' : 'Speed') : isAlt ? 'Elevation' : 'Heart Rate';
  const yLabel     = isVelocity ? (usePace ? 'min/km' : 'km/h') : isAlt ? 'm' : 'bpm';

  const fmtTip = (v: number) => {
    if (isVelocity && usePace) {
      const m = Math.floor(v); const s = Math.round((v - m) * 60).toString().padStart(2, '0');
      return `${m}:${s} /km`;
    }
    if (isVelocity) return `${v.toFixed(1)} km/h`;
    if (isAlt) return `${Math.round(v)} m`;
    return `${Math.round(v)} bpm`;
  };

  // For elevation and HR, auto-scale Y-axis with a small margin
  const allVals = data.flatMap((d) => [d.a, d.b]).filter((v): v is number => v != null);
  const minVal = Math.min(...allVals), maxVal = Math.max(...allVals);
  const pad = (maxVal - minVal) * 0.15 || 1;
  const yDomain: [number | string, number | string] = isVelocity
    ? ([0, 'auto'] as [number, string])
    : ([Math.max(0, minVal - pad), maxVal + pad] as [number, number]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      className="glass-panel rounded-2xl p-6"
    >
      <div className="flex items-center gap-3 mb-1">
        <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: COLOR_A }} />
        <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: COLOR_B }} />
        <h3 className="text-base font-semibold text-text-primary">{title}</h3>
      </div>
      <p className="text-sm text-text-secondary mb-4 ml-9">Overlaid on the same distance axis.</p>

      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={data} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" strokeOpacity={0.4} />
          <XAxis
            dataKey="km"
            tickLine={false} axisLine={false}
            tick={{ fontSize: 11, fill: '#888' }}
            tickFormatter={(v) => typeof v === 'number' ? v.toFixed(2) : v}
            label={{ value: 'km', position: 'insideBottomRight', offset: -4, fontSize: 11, fill: '#888' }}
          />
          <YAxis
            tickLine={false} axisLine={false}
            tick={{ fontSize: 11, fill: '#888' }}
            domain={yDomain}
            label={{ value: yLabel, angle: -90, position: 'insideLeft', fontSize: 11, fill: '#888' }}
            width={44}
            tickFormatter={(v) => typeof v === 'number' ? (isVelocity && !usePace ? v.toFixed(0) : v.toFixed(1)) : v}
          />
          <Tooltip
            contentStyle={{ background: '#1a1f2e', border: '1px solid #2a2f3e', borderRadius: 10, fontSize: 12 }}
            labelStyle={{ color: '#aaa', marginBottom: 4 }}
            formatter={(v: unknown, name: unknown) => [
              typeof v === 'number' ? fmtTip(v) : String(v),
              name === 'a' ? nameA : nameB,
            ]}
            labelFormatter={(l) => `${typeof l === 'number' ? l.toFixed(2) : l} km`}
          />
          <Legend
            formatter={(v) => (
              <span style={{ color: v === 'a' ? COLOR_A : COLOR_B, fontSize: 12 }}>
                {v === 'a' ? nameA : nameB}
              </span>
            )}
          />
          <Line type="monotone" dataKey="a" stroke={COLOR_A} strokeWidth={2.5}
            dot={false} activeDot={{ r: 4, strokeWidth: 0, fill: COLOR_A }}
            isAnimationActive={false} name="a" connectNulls />
          <Line type="monotone" dataKey="b" stroke={COLOR_B} strokeWidth={2.5}
            dot={false} activeDot={{ r: 4, strokeWidth: 0, fill: COLOR_B }}
            isAnimationActive={false} name="b" connectNulls />
        </LineChart>
      </ResponsiveContainer>
    </motion.div>
  );
}

/* ─── page ───────────────────────────────────────────────────── */
function ComparePageInner() {
  const searchParams = useSearchParams();
  const { activities, loading, fetchAll } = useStravaStore();
  const preloadAId = searchParams.get('a');

  // step: 'sport' | 'sessions' | 'results'
  const [selectedSport, setSelectedSport] = useState<string | null>(null);
  const [activityA, setActivityA] = useState<Activity | null>(null);
  const [activityB, setActivityB] = useState<Activity | null>(null);
  const [sessA, setSessA] = useState<SessionData | null>(null);
  const [sessB, setSessB] = useState<SessionData | null>(null);
  const [loadingA, setLoadingA] = useState(false);
  const [loadingB, setLoadingB] = useState(false);

  useEffect(() => { if (activities.length === 0) fetchAll(); }, [activities.length, fetchAll]);

  // Pre-select sport from URL param
  useEffect(() => {
    if (preloadAId && activities.length > 0 && !activityA) {
      const found = activities.find((a) => String(a.id) === preloadAId) ?? null;
      if (found) { setSelectedSport(found.type); setActivityA(found); }
    }
  }, [preloadAId, activities, activityA]);

  const sportCounts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const a of activities) c[a.type] = (c[a.type] ?? 0) + 1;
    return c;
  }, [activities]);

  const sportTypes = Object.keys(sportCounts);

  const fetchSession = async (id: number, set: (s: SessionData | null) => void, setL: (v: boolean) => void) => {
    setL(true);
    try {
      const res = await fetch(`/api/activities/${id}`);
      const d = await res.json();
      set({ activity: d.activity, streams: d.streams });
    } finally { setL(false); }
  };

  useEffect(() => {
    if (activityA) fetchSession(activityA.id, setSessA, setLoadingA);
    else setSessA(null);
  }, [activityA]);

  useEffect(() => {
    if (activityB) fetchSession(activityB.id, setSessB, setLoadingB);
    else setSessB(null);
  }, [activityB]);

  const reset = () => {
    setSelectedSport(null); setActivityA(null); setActivityB(null);
    setSessA(null); setSessB(null);
  };

  const bothReady = sessA && sessB && !loadingA && !loadingB;
  const hasVelocity = bothReady && (sessA.streams.velocity_smooth?.data?.length ?? 0) > 0
                               && (sessB.streams.velocity_smooth?.data?.length ?? 0) > 0;
  const hasHR   = bothReady && ((sessA.streams.heartrate?.data?.length ?? 0) > 0
                            ||  (sessB.streams.heartrate?.data?.length ?? 0) > 0);
  const hasAlt  = bothReady && (sessA.streams.altitude?.data?.length ?? 0) > 0
                            && (sessB.streams.altitude?.data?.length ?? 0) > 0;

  const sportUsePace = selectedSport ? getSportMeta(selectedSport).usePace : true;

  // Step indicator
  const step = !selectedSport ? 1 : !activityA || !activityB ? 2 : 3;

  return (
    <main className="flex-1 overflow-auto pb-20 lg:pb-6">
      <div className="px-4 md:px-8 lg:px-12 py-6 lg:py-8">

        {/* Top bar */}
        <div className="flex items-center justify-between mb-8">
          <Link href="/activities">
            <button className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/5 text-text-secondary hover:text-text-primary hover:bg-white/10 transition-all duration-200 text-sm font-medium">
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
          </Link>

          <div className="flex items-center gap-3">
            <GitCompare className="w-5 h-5 text-text-secondary" />
            <h1 className="text-xl font-bold tracking-tight">Compare Sessions</h1>
          </div>

          {selectedSport && (
            <button
              onClick={reset}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/5 text-text-secondary hover:text-text-primary hover:bg-white/10 transition-all duration-200 text-sm font-medium"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset
            </button>
          )}
          {!selectedSport && <div className="w-20" />}
        </div>

        {/* Step pills */}
        <div className="flex items-center gap-2 mb-8">
          {['Sport', 'Sessions', 'Results'].map((label, i) => {
            const n = i + 1;
            const done = step > n;
            const active = step === n;
            return (
              <div key={label} className="flex items-center gap-2">
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  active ? 'bg-[#3b82f6]/15 text-[#3b82f6] border border-[#3b82f6]/30'
                  : done ? 'bg-white/8 text-text-primary border border-white/15'
                  : 'bg-white/4 text-text-muted border border-transparent'
                }`}>
                  <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    active ? 'bg-[#3b82f6] text-white'
                    : done ? 'bg-white/20 text-text-primary'
                    : 'bg-white/8 text-text-muted'
                  }`}>{n}</span>
                  {label}
                </div>
                {i < 2 && <ChevronRight className="w-3 h-3 text-text-muted flex-shrink-0" />}
              </div>
            );
          })}
        </div>

        {loading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[1,2,3].map(i => <Skeleton key={i} className="h-36" />)}
          </div>
        )}

        <AnimatePresence mode="wait">
          {/* ── Step 1: Sport type ── */}
          {!loading && !selectedSport && (
            <motion.div key="sport" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <SportTypeStep types={sportTypes} counts={sportCounts} onSelect={setSelectedSport} />
            </motion.div>
          )}

          {/* ── Step 2: Session pickers ── */}
          {!loading && selectedSport && (
            <motion.div key="pickers" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>

              {/* Sport badge */}
              <div className="flex items-center gap-2 mb-6">
                {(() => { const m = getSportMeta(selectedSport); const Icon = m.icon;
                  return (
                    <div
                      className="flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-semibold"
                      style={{ background: `${m.hex}15`, color: m.hex, borderColor: `${m.hex}35` }}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {m.label}
                    </div>
                  );
                })()}
                <p className="text-text-secondary text-sm">
                  {sportCounts[selectedSport]} sessions available
                </p>
              </div>

              <p className="text-sm text-text-secondary mb-4 font-medium uppercase tracking-widest">
                Step 2 · Choose two sessions
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                {/* A */}
                <div className="glass-panel rounded-2xl p-4 border-t-2" style={{ borderColor: COLOR_A }}>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold text-white" style={{ background: COLOR_A }}>A</div>
                    <span className="text-sm font-medium text-text-primary">Session A</span>
                  </div>
                  <SessionPicker
                    label=""
                    accentColor={COLOR_A}
                    activities={activities}
                    selected={activityA}
                    onSelect={(a) => { setActivityA(a); setActivityB(null); }}
                    filterType={selectedSport}
                    excludeIds={activityB ? [activityB.id] : []}
                  />
                </div>

                {/* B */}
                <div className="glass-panel rounded-2xl p-4 border-t-2" style={{ borderColor: COLOR_B }}>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold text-white" style={{ background: COLOR_B }}>B</div>
                    <span className="text-sm font-medium text-text-primary">Session B</span>
                  </div>
                  <SessionPicker
                    label=""
                    accentColor={COLOR_B}
                    activities={activities}
                    selected={activityB}
                    onSelect={setActivityB}
                    filterType={selectedSport}
                    excludeIds={activityA ? [activityA.id] : []}
                  />
                </div>
              </div>

              {/* Loading */}
              {(loadingA || loadingB) && (
                <div className="space-y-4">
                  {[1,2,3].map(i => <Skeleton key={i} className="h-40" />)}
                </div>
              )}

              {/* ── Results ── */}
              {bothReady && (() => {
                const nameA = sessA.activity.name;
                const nameB = sessB.activity.name;
                return (
                  <motion.div
                    initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                    className="space-y-5"
                  >
                    {/* Session headers */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <SessionHeader sess={sessA} slot="A" />
                      <SessionHeader sess={sessB} slot="B" />
                    </div>

                    {/* Stat grid */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      <StatCard label="Distance"
                        valA={formatDistance(sessA.activity.distance)}
                        valB={formatDistance(sessB.activity.distance)} />
                      <StatCard label="Moving Time"
                        valA={formatDuration(sessA.activity.moving_time)}
                        valB={formatDuration(sessB.activity.moving_time)}
                        higherIsBetter={false} />
                      {sportUsePace ? (
                        <StatCard label="Avg Pace"
                          valA={formatPace(sessA.activity.average_speed)}
                          valB={formatPace(sessB.activity.average_speed)}
                          higherIsBetter={false} />
                      ) : (
                        <StatCard label="Avg Speed"
                          valA={formatSpeed(sessA.activity.average_speed)}
                          valB={formatSpeed(sessB.activity.average_speed)} />
                      )}
                      <StatCard label="Elevation"
                        valA={`${Math.round(sessA.activity.elevation_gain ?? 0)} m`}
                        valB={`${Math.round(sessB.activity.elevation_gain ?? 0)} m`} />
                      <StatCard label="Max Speed"
                        valA={`${((sessA.activity.max_speed ?? 0) * 3.6).toFixed(1)} km/h`}
                        valB={`${((sessB.activity.max_speed ?? 0) * 3.6).toFixed(1)} km/h`} />
                      {hasHR && (
                        <StatCard label="Avg Heart Rate"
                          valA={sessA.activity.average_heartrate ? `${Math.round(sessA.activity.average_heartrate)} bpm` : '—'}
                          valB={sessB.activity.average_heartrate ? `${Math.round(sessB.activity.average_heartrate)} bpm` : '—'}
                          higherIsBetter={false} />
                      )}
                      {hasHR && (
                        <StatCard label="Max Heart Rate"
                          valA={sessA.activity.max_heartrate ? `${Math.round(sessA.activity.max_heartrate)} bpm` : '—'}
                          valB={sessB.activity.max_heartrate ? `${Math.round(sessB.activity.max_heartrate)} bpm` : '—'}
                          higherIsBetter={false} />
                      )}
                    </div>

                    {/* Km splits */}
                    {sessA.streams.distance?.data && sessA.streams.time?.data &&
                     sessB.streams.distance?.data && sessB.streams.time?.data && (
                      <SplitTable sessA={sessA} sessB={sessB} nameA={nameA} nameB={nameB} />
                    )}

                    {/* Charts */}
                    {hasVelocity && (
                      <OverlayChart sessA={sessA} sessB={sessB} nameA={nameA} nameB={nameB}
                        dataKey="velocity" usePace={sportUsePace} />
                    )}
                    {hasHR && (
                      <OverlayChart sessA={sessA} sessB={sessB} nameA={nameA} nameB={nameB}
                        dataKey="heartrate" usePace={false} />
                    )}
                    {hasAlt && (
                      <OverlayChart sessA={sessA} sessB={sessB} nameA={nameA} nameB={nameB}
                        dataKey="altitude" usePace={false} />
                    )}
                  </motion.div>
                );
              })()}

              {/* Pick B prompt */}
              {activityA && !activityB && !loadingA && !loadingB && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="glass-panel rounded-2xl p-10 text-center text-text-secondary mt-4">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white mx-auto mb-3 text-lg" style={{ background: COLOR_B }}>B</div>
                  <p className="font-medium">Now pick Session B</p>
                  <p className="text-sm mt-1 opacity-60">Only {selectedSport} sessions shown.</p>
                </motion.div>
              )}

              {/* Pick A prompt */}
              {!activityA && !loadingA && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="glass-panel rounded-2xl p-10 text-center text-text-secondary">
                  <div className="flex justify-center gap-3 mb-4">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-white" style={{ background: COLOR_A }}>A</div>
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-white" style={{ background: COLOR_B }}>B</div>
                  </div>
                  <p className="font-medium">Choose Session A to get started</p>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}

export default function ComparePage() {
  return (
    <Suspense>
      <ComparePageInner />
    </Suspense>
  );
}
