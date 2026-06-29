'use client';

import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Check, ChevronDown, X, Activity, ChevronRight } from 'lucide-react';
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
    <button
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
    </button>
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
      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors duration-100 hover:bg-muted active:bg-muted"
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

/* ── Shared list body (used in both sheet and dropdown) ─────── */
function PickerBody({
  query, setQuery, searchRef, filtered, selected, sportTypes, sportFilter, filterType,
  sportCounts, setSportFilter, onSelect, setQuery: _sq, hex, listMaxHeight,
}: {
  query: string;
  setQuery: (q: string) => void;
  searchRef: React.RefObject<HTMLInputElement | null>;
  filtered: ActivityItem[];
  selected: ActivityItem | null;
  sportTypes: string[];
  sportFilter: string | null;
  filterType?: string | null;
  sportCounts: Record<string, number>;
  setSportFilter: (fn: (c: string | null) => string | null) => void;
  onSelect: (a: ActivityItem) => void;
  hex: string;
  listMaxHeight?: number | string;
}) {
  return (
    <>
      {/* Sport chips */}
      {!filterType && sportTypes.length > 1 && (
        <div
          className="px-3 pt-3 pb-2.5 flex flex-wrap gap-1.5"
          style={{ borderBottom: '1px solid var(--border)' }}
        >
          <button
            onClick={() => setSportFilter(() => null)}
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
      <div
        className="overflow-y-auto overscroll-contain px-2 py-1.5"
        style={{ maxHeight: listMaxHeight ?? 260 }}
      >
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
              onClick={() => onSelect(a)}
            />
          ))
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-2 flex-shrink-0" style={{ borderTop: '1px solid var(--border)' }}>
        <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
          {filtered.length} session{filtered.length !== 1 ? 's' : ''}
          {sportFilter && !filterType ? ` · ${getSportMeta(sportFilter).label}` : ''}
        </p>
      </div>
    </>
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
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Desktop dropdown positioning
  const [dropdownStyle, setDropdownStyle] = useState<{
    top: number; left: number; width: number; maxHeight: number;
  }>({ top: 0, left: 0, width: 0, maxHeight: 300 });

  const wrapRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    if (filterType !== undefined) setSportFilter(filterType);
  }, [filterType]);

  // Lock body scroll on mobile when sheet is open
  useEffect(() => {
    if (!isMobile) return;
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open, isMobile]);

  // Desktop: click-outside for dropdown (mousedown + touchstart)
  useEffect(() => {
    if (isMobile) return;
    const handler = (e: MouseEvent | TouchEvent) => {
      const target = (e as MouseEvent).target as Node;
      if (!wrapRef.current?.contains(target) && !dropdownRef.current?.contains(target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    document.addEventListener('touchstart', handler);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('touchstart', handler);
    };
  }, [isMobile]);

  useEffect(() => {
    if (open && !isMobile) setTimeout(() => searchRef.current?.focus(), 60);
    if (open && isMobile) setTimeout(() => searchRef.current?.focus(), 300);
  }, [open, isMobile]);

  // Desktop: compute fixed position via visualViewport (iOS-aware)
  const updateDropdownPos = useCallback(() => {
    if (!wrapRef.current) return;
    const rect = wrapRef.current.getBoundingClientRect();
    // visualViewport accounts for iOS keyboard / address bar offsets
    const vvOffsetTop = window.visualViewport?.offsetTop ?? 0;
    const vvHeight = window.visualViewport?.height ?? window.innerHeight;
    const spaceBelow = vvHeight - (rect.bottom - vvOffsetTop) - 8;
    const spaceAbove = rect.top - vvOffsetTop - 8;
    const placeAbove = spaceBelow < 200 && spaceAbove > spaceBelow;
    const maxH = Math.min(360, Math.max(160, placeAbove ? spaceAbove : spaceBelow));
    setDropdownStyle({
      left: rect.left,
      width: rect.width,
      top: placeAbove
        ? rect.top + vvOffsetTop - maxH - 4
        : rect.bottom + vvOffsetTop + 4,
      maxHeight: maxH,
    });
  }, []);

  useEffect(() => {
    if (!open || isMobile) return;
    updateDropdownPos();
    const vv = window.visualViewport;
    vv?.addEventListener('resize', updateDropdownPos);
    vv?.addEventListener('scroll', updateDropdownPos);
    window.addEventListener('resize', updateDropdownPos);
    return () => {
      vv?.removeEventListener('resize', updateDropdownPos);
      vv?.removeEventListener('scroll', updateDropdownPos);
      window.removeEventListener('resize', updateDropdownPos);
    };
  }, [open, isMobile, updateDropdownPos]);

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

  const pickerBodyProps = {
    query, setQuery, searchRef, filtered, selected,
    sportTypes, sportFilter, filterType, sportCounts, setSportFilter, hex,
    onSelect: handleSelect,
    // Mobile sheet: fill most of the 85dvh sheet minus handle + title + search + footer
    listMaxHeight: 'calc(85dvh - 200px)' as string | number,
  };

  /* ── Mobile bottom sheet ─────────────────────────────────── */
  const mobileSheet = (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onPointerDown={() => setOpen(false)}
            style={{
              position: 'fixed', inset: 0,
              background: 'rgba(0,0,0,0.55)',
              zIndex: 9998,
              WebkitTapHighlightColor: 'transparent',
            }}
          />

          {/* Sheet */}
          <motion.div
            key="sheet"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 340, damping: 34, mass: 0.9 }}
            style={{
              position: 'fixed',
              bottom: 0, left: 0, right: 0,
              zIndex: 9999,
              background: 'var(--background)',
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              maxHeight: '85dvh',
              display: 'flex',
              flexDirection: 'column',
              overscrollBehavior: 'contain',
              // Ensure sheet clears iOS home indicator
              paddingBottom: 'env(safe-area-inset-bottom)',
            }}
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
              <div
                className="rounded-full"
                style={{ width: 36, height: 4, background: 'var(--border)' }}
              />
            </div>

            {/* Title row */}
            <div
              className="flex items-center justify-between px-4 pb-3 flex-shrink-0"
              style={{ borderBottom: '1px solid var(--border)' }}
            >
              <p className="font-semibold text-text-primary">Choose a session</p>
              <button
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-lg hover:bg-muted text-text-muted"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <PickerBody {...pickerBodyProps} />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  /* ── Desktop portal dropdown ─────────────────────────────── */
  const desktopDropdown = (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={dropdownRef}
          key="dropdown"
          initial={{ opacity: 0, y: -6, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -6, scale: 0.98 }}
          transition={{ duration: 0.15 }}
          className="rounded-2xl overflow-hidden"
          style={{
            position: 'fixed',
            top: dropdownStyle.top,
            left: dropdownStyle.left,
            width: dropdownStyle.width,
            minWidth: 280,
            zIndex: 9999,
            background: 'var(--background)',
            border: '1px solid var(--border)',
            boxShadow: '0 20px 56px rgba(0,0,0,0.25), 0 6px 20px rgba(0,0,0,0.15)',
          }}
        >
          {/* Desktop: list height derived from available viewport space, container auto-sizes to content */}
          <PickerBody
            {...pickerBodyProps}
            listMaxHeight={Math.max(120, dropdownStyle.maxHeight - 130)}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );

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

      {mounted && createPortal(
        isMobile ? mobileSheet : desktopDropdown,
        document.body,
      )}
    </div>
  );
}
