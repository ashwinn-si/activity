'use client';

import { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import {
  Bike, Footprints, PersonStanding, Activity,
  GitCompare, ArrowLeft, TrendingUp, TrendingDown,
  Minus, ChevronRight, RotateCcw,
} from 'lucide-react';
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

const SPORT_META: Record<string, {
  icon: React.ComponentType<{ className?: string }>;
  color: string; bg: string; border: string; ring: string; label: string;
}> = {
  Run:  { icon: Footprints,     color: 'text-[#3b82f6]', bg: 'bg-[#3b82f6]/10', border: 'border-[#3b82f6]/30', ring: 'ring-[#3b82f6]/40', label: 'Run'  },
  Ride: { icon: Bike,           color: 'text-[#f97316]', bg: 'bg-[#f97316]/10', border: 'border-[#f97316]/30', ring: 'ring-[#f97316]/40', label: 'Ride' },
  Walk: { icon: PersonStanding, color: 'text-[#22c55e]', bg: 'bg-[#22c55e]/10', border: 'border-[#22c55e]/30', ring: 'ring-[#22c55e]/40', label: 'Walk' },
};
const FALLBACK_META = { icon: Activity, color: 'text-[#a855f7]', bg: 'bg-[#a855f7]/10', border: 'border-[#a855f7]/30', ring: 'ring-[#a855f7]/40', label: '—' };

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

function buildOverlay(a: SessionData, b: SessionData, key: 'pace' | 'heartrate' | 'altitude') {
  const extract = (sess: SessionData) => {
    const dist = sess.streams.distance?.data ?? [];
    const raw = key === 'pace' ? sess.streams.velocity_smooth?.data
      : key === 'heartrate' ? sess.streams.heartrate?.data
      : sess.streams.altitude?.data;
    if (!raw || !dist.length) return [];
    const step = Math.ceil(dist.length / 80);
    return dist.map((d, i) => {
      const v = raw[i];
      // filter near-zero pace points (stopped / GPS glitch)
      if (key === 'pace' && (!v || v < 0.5)) return null;
      return { km: +(d / 1000).toFixed(2), val: key === 'pace' ? 1000 / v / 60 : v };
    }).filter((p, i) => p !== null && i % step === 0) as { km: number; val: number }[];
  };

  const aV = extract(a), bV = extract(b);
  const maxKm = Math.min(aV.at(-1)?.km ?? 0, bV.at(-1)?.km ?? 0);
  const merged: Record<number, { km: number; a?: number; b?: number }> = {};
  for (const p of aV) {
    if (p.km > maxKm + 0.1) break;
    const k = Math.round(p.km * 10);
    merged[k] = { km: p.km, a: p.val };
  }
  for (const p of bV) {
    if (p.km > maxKm + 0.1) break;
    const k = Math.round(p.km * 10);
    merged[k] = { ...merged[k], km: p.km, b: p.val };
  }
  return Object.values(merged).sort((x, y) => x.km - y.km);
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
          const m = SPORT_META[type] ?? FALLBACK_META;
          const Icon = m.icon;
          return (
            <motion.button
              key={type}
              whileHover={{ y: -3, scale: 1.01 }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 300, damping: 22 }}
              onClick={() => onSelect(type)}
              className={`glass-panel rounded-2xl p-5 flex flex-col items-start gap-3 border ${m.border} hover:${m.ring} hover:ring-2 transition-all duration-200 cursor-pointer text-left`}
            >
              <div className={`p-2.5 rounded-xl ${m.bg} ${m.color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <p className={`font-semibold text-lg ${m.color}`}>{type}</p>
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
  const m = SPORT_META[sess.activity.type] ?? FALLBACK_META;
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
          <span>{formatPace(sess.activity.average_speed)}</span>
        </div>
      </div>
      <div className={`p-2 rounded-xl ${m.bg} ${m.color} flex-shrink-0`}>
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
      <p className="text-sm text-text-secondary mb-5">Time for each km — winner highlighted.</p>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="pb-3 text-left font-medium text-text-secondary w-12">Km</th>
              <th className="pb-3 text-center font-medium" style={{ color: COLOR_A }}>{nameA}</th>
              <th className="pb-3 text-center font-medium" style={{ color: COLOR_B }}>{nameB}</th>
              <th className="pb-3 text-right font-medium text-text-secondary">Δ</th>
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
    </motion.div>
  );
}

function OverlayChart({
  sessA, sessB, nameA, nameB, dataKey, title, yLabel, fmtTip,
}: {
  sessA: SessionData; sessB: SessionData; nameA: string; nameB: string;
  dataKey: 'pace' | 'heartrate' | 'altitude';
  title: string; yLabel: string; fmtTip?: (v: number) => string;
}) {
  const data = useMemo(() => buildOverlay(sessA, sessB, dataKey), [sessA, sessB, dataKey]);
  if (data.length === 0) return null;

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
            label={{ value: 'km', position: 'insideBottomRight', offset: -4, fontSize: 11, fill: '#888' }}
          />
          <YAxis
            tickLine={false} axisLine={false}
            tick={{ fontSize: 11, fill: '#888' }}
            label={{ value: yLabel, angle: -90, position: 'insideLeft', fontSize: 11, fill: '#888' }}
            width={40}
          />
          <Tooltip
            contentStyle={{ background: '#1a1f2e', border: '1px solid #2a2f3e', borderRadius: 10, fontSize: 12 }}
            labelStyle={{ color: '#aaa', marginBottom: 4 }}
            formatter={(v: unknown, name: unknown) => [
              typeof v === 'number' && fmtTip ? fmtTip(v) : String(v),
              name === 'a' ? nameA : nameB,
            ]}
            labelFormatter={(l) => `${l} km`}
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
            isAnimationActive={false} name="a" connectNulls={false} />
          <Line type="monotone" dataKey="b" stroke={COLOR_B} strokeWidth={2.5}
            dot={false} activeDot={{ r: 4, strokeWidth: 0, fill: COLOR_B }}
            isAnimationActive={false} name="b" connectNulls={false} />
        </LineChart>
      </ResponsiveContainer>
    </motion.div>
  );
}

/* ─── page ───────────────────────────────────────────────────── */
export default function ComparePage() {
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
  const hasPace = bothReady && sessA.streams.velocity_smooth?.data && sessB.streams.velocity_smooth?.data;
  const hasHR   = bothReady && sessA.streams.heartrate?.data && sessB.streams.heartrate?.data;
  const hasAlt  = bothReady && sessA.streams.altitude?.data && sessB.streams.altitude?.data;

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
                {(() => { const m = SPORT_META[selectedSport] ?? FALLBACK_META; const Icon = m.icon;
                  return (
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${m.bg} ${m.color} border ${m.border} text-sm font-semibold`}>
                      <Icon className="w-3.5 h-3.5" />
                      {selectedSport}
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
                    accent="run"
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
                    accent="ride"
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
                      <StatCard label="Avg Pace"
                        valA={formatPace(sessA.activity.average_speed)}
                        valB={formatPace(sessB.activity.average_speed)}
                        higherIsBetter={false} />
                      {sessA.activity.average_speed > 0 && (
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
                    </div>

                    {/* Km splits */}
                    {sessA.streams.distance?.data && sessA.streams.time?.data &&
                     sessB.streams.distance?.data && sessB.streams.time?.data && (
                      <SplitTable sessA={sessA} sessB={sessB} nameA={nameA} nameB={nameB} />
                    )}

                    {/* Charts */}
                    {hasPace && (
                      <OverlayChart sessA={sessA} sessB={sessB} nameA={nameA} nameB={nameB}
                        dataKey="pace" title="Pace" yLabel="min/km"
                        fmtTip={(v) => { const m = Math.floor(v); const s = Math.round((v-m)*60).toString().padStart(2,'0'); return `${m}:${s} /km`; }} />
                    )}
                    {hasHR && (
                      <OverlayChart sessA={sessA} sessB={sessB} nameA={nameA} nameB={nameB}
                        dataKey="heartrate" title="Heart Rate" yLabel="bpm"
                        fmtTip={(v) => `${Math.round(v)} bpm`} />
                    )}
                    {hasAlt && (
                      <OverlayChart sessA={sessA} sessB={sessB} nameA={nameA} nameB={nameB}
                        dataKey="altitude" title="Elevation" yLabel="m"
                        fmtTip={(v) => `${Math.round(v)} m`} />
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
