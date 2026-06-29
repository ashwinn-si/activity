'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bike, Footprints, PersonStanding, Search, Check, ChevronDown, X } from 'lucide-react';
import { formatDistance, formatDuration, formatPace, formatSpeed } from '@/utils/formatters';

interface Activity {
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
  accent: 'run' | 'ride';
  activities: Activity[];
  selected: Activity | null;
  onSelect: (a: Activity | null) => void;
  /** When set, only activities of this type are shown */
  filterType?: string | null;
  /** Activity IDs to exclude from the list */
  excludeIds?: number[];
}

const sportMeta: Record<
  string,
  { icon: React.ComponentType<{ className?: string }>; color: string; bg: string; border: string; label: string }
> = {
  Run:  { icon: Footprints,     color: 'text-accent-run',  bg: 'bg-accent-run/10',  border: 'border-accent-run/25',  label: 'Run'   },
  Ride: { icon: Bike,           color: 'text-accent-ride', bg: 'bg-accent-ride/10', border: 'border-accent-ride/25', label: 'Ride'  },
  Walk: { icon: PersonStanding, color: 'text-accent-walk', bg: 'bg-accent-walk/10', border: 'border-accent-walk/25', label: 'Walk'  },
};

const accentTokens = {
  run:  { ring: 'ring-accent-run/40',  label: 'text-accent-run',  badge: 'bg-accent-run/15 text-accent-run border-accent-run/30'  },
  ride: { ring: 'ring-accent-ride/40', label: 'text-accent-ride', badge: 'bg-accent-ride/15 text-accent-ride border-accent-ride/30' },
};

function SportChip({
  type,
  count,
  active,
  onClick,
}: {
  type: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  const meta = sportMeta[type] ?? { icon: Bike, color: 'text-text-secondary', bg: 'bg-white/5', border: 'border-white/10', label: type };
  const Icon = meta.icon;

  return (
    <motion.button
      whileTap={{ scale: 0.94 }}
      onClick={onClick}
      className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border text-sm font-medium transition-all duration-200 ${
        active
          ? `${meta.bg} ${meta.border} ${meta.color} shadow-sm`
          : 'bg-white/4 border-white/8 text-text-secondary hover:text-text-primary hover:bg-white/8'
      }`}
    >
      <Icon className="w-3.5 h-3.5" />
      {meta.label}
      <span
        className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
          active ? `${meta.bg} ${meta.color}` : 'bg-white/8 text-text-muted'
        }`}
      >
        {count}
      </span>
    </motion.button>
  );
}

function ActivityRow({
  activity,
  selected,
  onClick,
}: {
  activity: Activity;
  selected: boolean;
  onClick: () => void;
}) {
  const meta = sportMeta[activity.type] ?? sportMeta['Ride'];
  const Icon = meta.icon;

  return (
    <motion.button
      whileHover={{ x: 3 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors duration-150 ${
        selected
          ? `${meta.bg} ${meta.border} border`
          : 'hover:bg-white/5 border border-transparent'
      }`}
    >
      <div className={`p-1.5 rounded-lg ${meta.bg} ${meta.color} flex-shrink-0`}>
        <Icon className="w-3.5 h-3.5" />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-text-primary truncate">{activity.name}</p>
        <p className="text-[11px] text-text-secondary mt-0.5">
          {new Date(activity.start_date).toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })}
        </p>
      </div>

      <div className="flex items-center gap-3 text-[11px] font-mono text-text-secondary flex-shrink-0">
        <span>{formatDistance(activity.distance)}</span>
        <span className="text-text-muted">·</span>
        <span>{formatDuration(activity.moving_time)}</span>
        <span className="text-text-muted">·</span>
        <span>
          {activity.type === 'Run'
            ? formatPace(activity.average_speed)
            : formatSpeed(activity.average_speed)}
        </span>
      </div>

      {selected && <Check className="w-4 h-4 text-accent-run flex-shrink-0" />}
    </motion.button>
  );
}

export function SessionPicker({
  label,
  accent,
  activities,
  selected,
  onSelect,
  filterType,
  excludeIds = [],
}: SessionPickerProps) {
  const tokens = accentTokens[accent];
  const [open, setOpen] = useState(false);
  const [sportFilter, setSportFilter] = useState<string | null>(filterType ?? null);
  const [query, setQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // Sync external filterType changes
  useEffect(() => {
    if (filterType !== undefined) setSportFilter(filterType);
  }, [filterType]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Focus search when opened
  useEffect(() => {
    if (open) setTimeout(() => searchRef.current?.focus(), 60);
  }, [open]);

  const sportCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const a of activities) {
      if (excludeIds.includes(a.id)) continue;
      counts[a.type] = (counts[a.type] ?? 0) + 1;
    }
    return counts;
  }, [activities, excludeIds]);

  const sportTypes = Object.keys(sportCounts);

  const filtered = useMemo(() => {
    let list = activities.filter((a) => !excludeIds.includes(a.id));
    if (sportFilter) list = list.filter((a) => a.type === sportFilter);
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          new Date(a.start_date)
            .toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
            .toLowerCase()
            .includes(q)
      );
    }
    return list.sort(
      (a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime()
    );
  }, [activities, excludeIds, sportFilter, query]);

  const handleSelect = (a: Activity) => {
    onSelect(a);
    setOpen(false);
    setQuery('');
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(null);
    setSportFilter(filterType ?? null);
  };

  const selectedMeta = selected ? (sportMeta[selected.type] ?? sportMeta['Ride']) : null;
  const SelectedIcon = selectedMeta?.icon ?? Bike;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Label */}
      <p className={`text-[10px] uppercase tracking-widest font-semibold mb-2 ${tokens.label}`}>
        {label}
      </p>

      {/* Trigger */}
      <button
        onClick={() => setOpen((v) => !v)}
        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border bg-white/4 text-left transition-all duration-200 ${
          open
            ? `${tokens.ring} ring-2 border-transparent`
            : 'border-white/10 hover:border-white/20 hover:bg-white/6'
        }`}
      >
        {selected ? (
          <>
            <div className={`p-1.5 rounded-lg ${selectedMeta?.bg} ${selectedMeta?.color} flex-shrink-0`}>
              <SelectedIcon className="w-3.5 h-3.5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-text-primary truncate">{selected.name}</p>
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
              className="p-1 rounded-lg hover:bg-white/10 text-text-muted hover:text-text-secondary transition-colors flex-shrink-0"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </>
        ) : (
          <>
            <ChevronDown className="w-4 h-4 text-text-muted flex-shrink-0" />
            <span className="text-sm text-text-secondary flex-1">Choose a session…</span>
          </>
        )}
        {!selected && (
          <ChevronDown
            className={`w-4 h-4 text-text-muted transition-transform duration-200 flex-shrink-0 ${open ? 'rotate-180' : ''}`}
          />
        )}
      </button>

      {/* Dropdown panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.18 }}
            className="absolute z-50 mt-2 w-full min-w-[340px] glass-panel rounded-2xl border border-white/10 shadow-2xl overflow-hidden"
            style={{ maxHeight: 440 }}
          >
            {/* Sport chips */}
            {!filterType && sportTypes.length > 1 && (
              <div className="px-3 pt-3 pb-2 flex flex-wrap gap-2 border-b border-white/8">
                <button
                  onClick={() => setSportFilter(null)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 ${
                    sportFilter === null
                      ? 'bg-white/12 text-text-primary border border-white/20'
                      : 'text-text-secondary hover:text-text-primary hover:bg-white/6 border border-transparent'
                  }`}
                >
                  All
                </button>
                {sportTypes.map((type) => (
                  <SportChip
                    key={type}
                    type={type}
                    count={sportCounts[type]}
                    active={sportFilter === type}
                    onClick={() => setSportFilter((cur) => (cur === type ? null : type))}
                  />
                ))}
              </div>
            )}

            {/* Search */}
            <div className="px-3 pt-2.5 pb-2 border-b border-white/8">
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/6 border border-white/10">
                <Search className="w-3.5 h-3.5 text-text-muted flex-shrink-0" />
                <input
                  ref={searchRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search by name or date…"
                  className="flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-muted outline-none"
                />
                {query && (
                  <button onClick={() => setQuery('')} className="text-text-muted hover:text-text-secondary">
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            {/* List */}
            <div className="overflow-y-auto px-2 py-2" style={{ maxHeight: 300 }}>
              {filtered.length === 0 ? (
                <p className="text-center text-sm text-text-muted py-8">No sessions found</p>
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

            {/* Footer count */}
            <div className="px-4 py-2 border-t border-white/8">
              <p className="text-[11px] text-text-muted">
                {filtered.length} session{filtered.length !== 1 ? 's' : ''}
                {sportFilter ? ` · ${sportFilter}` : ''}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
