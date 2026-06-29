'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Check, ChevronDown, X, Activity } from 'lucide-react';
import { getSportMeta } from '@/utils/sportConfig';
import { formatDistance, formatDuration, formatPace, formatSpeed } from '@/utils/formatters';

interface ActivityItem {
  id: number;
  name: string;
  type: string;
  distance: number;
  moving_time: number;
  start_date: string;
  average_speed: number;
  max_speed?: number;
  elevation_gain?: number;
  average_heartrate?: number;
  max_heartrate?: number;
  [key: string]: unknown;
}

interface SessionPickerProps {
  label: string;
  /** Hex accent color for trigger border glow. Defaults to filterType sport color. */
  accentColor?: string;
  activities: ActivityItem[];
  selected: ActivityItem | null;
  onSelect: (a: ActivityItem | null) => void;
  filterType?: string | null;
  excludeIds?: number[];
}

/* ── Sport chip ─────────────────────────────────────────────── */
function SportChip({ type, count, active, onClick }: {
  type: string; count: number; active: boolean; onClick: () => void;
}) {
  const meta = getSportMeta(type);
  const Icon = meta.icon;
  return (
    <motion.button
      whileTap={{ scale: 0.94 }}
      onClick={onClick}
      style={active ? {
        background: `${meta.hex}18`,
        borderColor: `${meta.hex}50`,
        color: meta.hex,
      } : undefined}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all duration-150 ${
        active
          ? ''
          : 'border-border bg-surface text-text-secondary hover:text-text-primary hover:bg-muted'
      }`}
    >
      <Icon className="w-3 h-3" />
      {meta.label}
      <span
        className="px-1.5 py-0.5 rounded-full text-[10px] font-bold"
        style={{
          background: active ? `${meta.hex}20` : 'var(--border)',
          color: active ? meta.hex : 'var(--text-muted)',
        }}
      >
        {count}
      </span>
    </motion.button>
  );
}

/* ── Activity row ───────────────────────────────────────────── */
function ActivityRow({ activity, selected, onClick }: {
  activity: ActivityItem; selected: boolean; onClick: () => void;
}) {
  const meta = getSportMeta(activity.type);
  const Icon = meta.icon;

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors duration-100 hover:bg-muted"
      style={selected ? { background: `${meta.hex}10`, outline: `1px solid ${meta.hex}30` } : undefined}
    >
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ background: `${meta.hex}15`, color: meta.hex }}
      >
        <Icon className="w-3.5 h-3.5" />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-text-primary truncate">{activity.name}</p>
        <p className="text-[11px] text-text-secondary mt-0.5">
          {new Date(activity.start_date).toLocaleDateString('en-US', {
            weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
          })}
        </p>
      </div>

      <div className="hidden sm:flex items-center gap-2 text-[11px] font-mono text-text-secondary flex-shrink-0">
        <span>{formatDistance(activity.distance)}</span>
        <span style={{ color: 'var(--text-muted)' }}>·</span>
        <span>{formatDuration(activity.moving_time)}</span>
        <span style={{ color: 'var(--text-muted)' }}>·</span>
        <span>
          {meta.usePace ? formatPace(activity.average_speed) : formatSpeed(activity.average_speed)}
        </span>
      </div>

      <div className="flex sm:hidden text-[11px] font-mono text-text-secondary flex-shrink-0">
        {formatDistance(activity.distance)}
      </div>

      {selected && (
        <Check className="w-4 h-4 flex-shrink-0" style={{ color: meta.hex }} />
      )}
    </button>
  );
}

/* ── Main component ─────────────────────────────────────────── */
export function SessionPicker({
  label, accentColor, activities, selected, onSelect, filterType, excludeIds = [],
}: SessionPickerProps) {
  const hex = accentColor ?? (filterType ? getSportMeta(filterType).hex : '#6366f1');

  const [open, setOpen] = useState(false);
  const [sportFilter, setSportFilter] = useState<string | null>(filterType ?? null);
  const [query, setQuery] = useState('');
  const wrapRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (filterType !== undefined) setSportFilter(filterType);
  }, [filterType]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => searchRef.current?.focus(), 60);
  }, [open]);

  const sportCounts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const a of activities) {
      if (excludeIds.includes(a.id)) continue;
      if (filterType && a.type !== filterType) continue;
      c[a.type] = (c[a.type] ?? 0) + 1;
    }
    return c;
  }, [activities, excludeIds, filterType]);

  const sportTypes = Object.keys(sportCounts);

  const filtered = useMemo(() => {
    let list = activities.filter((a) => !excludeIds.includes(a.id));
    if (sportFilter) list = list.filter((a) => a.type === sportFilter);
    else if (filterType) list = list.filter((a) => a.type === filterType);
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          new Date(a.start_date)
            .toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
            .toLowerCase().includes(q)
      );
    }
    return list.sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime());
  }, [activities, excludeIds, sportFilter, filterType, query]);

  const handleSelect = (a: ActivityItem) => { onSelect(a); setOpen(false); setQuery(''); };
  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation(); onSelect(null);
    if (!filterType) setSportFilter(null);
  };

  const selectedMeta = selected ? getSportMeta(selected.type) : null;
  const SelectedIcon = selectedMeta?.icon ?? Activity;

  return (
    <div className="relative" ref={wrapRef}>
      {label && (
        <p className="text-[10px] uppercase tracking-widest font-semibold mb-2" style={{ color: hex }}>
          {label}
        </p>
      )}

      {/* Trigger */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all duration-200"
        style={{
          background: 'var(--surface)',
          borderColor: open ? hex : 'var(--border)',
          boxShadow: open ? `0 0 0 3px ${hex}20` : undefined,
        }}
      >
        {selected ? (
          <>
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: `${selectedMeta!.hex}15`, color: selectedMeta!.hex }}
            >
              <SelectedIcon className="w-3.5 h-3.5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-text-primary truncate">{selected.name}</p>
              <p className="text-[11px] text-text-secondary mt-0.5">
                {new Date(selected.start_date).toLocaleDateString('en-US', {
                  weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
                })}
                {' · '}{formatDistance(selected.distance)}
                {' · '}{formatDuration(selected.moving_time)}
              </p>
            </div>
            <button
              onClick={handleClear}
              className="p-1.5 rounded-lg hover:bg-muted text-text-muted hover:text-text-secondary transition-colors flex-shrink-0"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </>
        ) : (
          <>
            <span className="text-sm text-text-secondary flex-1">Choose a session…</span>
            <ChevronDown
              className="w-4 h-4 flex-shrink-0 transition-transform duration-200"
              style={{ color: 'var(--text-muted)', transform: open ? 'rotate(180deg)' : undefined }}
            />
          </>
        )}
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute z-[9999] mt-2 left-0 right-0 rounded-2xl overflow-hidden"
            style={{
              background: 'var(--background)',
              border: '1px solid var(--border)',
              boxShadow: '0 20px 56px rgba(0,0,0,0.15), 0 6px 20px rgba(0,0,0,0.09)',
              minWidth: 280,
            }}
          >
            {/* Sport chips — only when not locked to a single type */}
            {!filterType && sportTypes.length > 1 && (
              <div
                className="px-3 pt-3 pb-2.5 flex flex-wrap gap-1.5"
                style={{ borderBottom: '1px solid var(--border)' }}
              >
                <button
                  onClick={() => setSportFilter(null)}
                  className="px-3 py-1.5 rounded-lg border text-xs font-medium transition-all duration-150"
                  style={
                    sportFilter === null
                      ? { background: 'var(--muted)', borderColor: 'var(--border)', color: 'var(--text-primary)', fontWeight: 600 }
                      : { borderColor: 'transparent', color: 'var(--text-secondary)', background: 'transparent' }
                  }
                >
                  All
                </button>
                {sportTypes.map((type) => (
                  <SportChip
                    key={type}
                    type={type}
                    count={sportCounts[type]}
                    active={sportFilter === type}
                    onClick={() => setSportFilter((c) => (c === type ? null : type))}
                  />
                ))}
              </div>
            )}

            {/* Search */}
            <div className="px-3 py-2.5" style={{ borderBottom: '1px solid var(--border)' }}>
              <div
                className="flex items-center gap-2 px-3 py-2 rounded-xl"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
              >
                <Search className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'var(--text-muted)' }} />
                <input
                  ref={searchRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search by name or date…"
                  className="flex-1 bg-transparent text-sm outline-none placeholder:text-text-muted"
                  style={{ color: 'var(--text-primary)' }}
                />
                {query && (
                  <button onClick={() => setQuery('')} style={{ color: 'var(--text-muted)' }}>
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            {/* List */}
            <div className="overflow-y-auto px-2 py-1.5" style={{ maxHeight: 300 }}>
              {filtered.length === 0 ? (
                <p className="text-center text-sm py-8" style={{ color: 'var(--text-muted)' }}>
                  No sessions found
                </p>
              ) : (
                filtered.map((a) => (
                  <ActivityRow
                    key={a.id}
                    activity={a}
                    selected={selected?.id === a.id}
                    onClick={() => handleSelect(a)}
                  />
                ))
              )}
            </div>

            {/* Footer */}
            <div className="px-4 py-2" style={{ borderTop: '1px solid var(--border)' }}>
              <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                {filtered.length} session{filtered.length !== 1 ? 's' : ''}
                {sportFilter && !filterType ? ` · ${getSportMeta(sportFilter).label}` : ''}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
