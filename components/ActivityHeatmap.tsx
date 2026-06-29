'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getSportMeta } from '@/utils/sportConfig';
import { formatDistance, formatDuration } from '@/utils/formatters';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Activity {
  id: number;
  name: string;
  type: string;
  sport_type?: string;
  distance: number;
  moving_time: number;
  start_date: string;
  start_date_local?: string; // preferred for calendar grouping (athlete's timezone)
}

interface ActivityHeatmapProps {
  activities: Activity[];
}

const DAYS = ['', 'Mon', '', 'Wed', '', 'Fri', ''];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function localIso(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function ActivityHeatmap({ activities }: ActivityHeatmapProps) {
  // All date-dependent state is set in useEffect to avoid SSR/client mismatch.
  // Server renders UTC; client renders local timezone — without this the year
  // and today's date can differ, causing a React hydration error.
  const [selectedYear, setSelectedYear] = useState(0);
  const [todayStr, setTodayStr] = useState('');
  const [currentYear, setCurrentYear] = useState(0);

  useEffect(() => {
    const now = new Date();
    const yr = now.getFullYear();
    setCurrentYear(yr);
    setSelectedYear(yr);
    setTodayStr(localIso(now));
  }, []);

  const [tooltip, setTooltip] = useState<{
    date: string;
    acts: Activity[];
    mx: number; // viewport-relative mouse X
    my: number; // viewport-relative mouse Y
  } | null>(null);

  // All years that have at least one activity
  const availableYears = useMemo(() => {
    const yrs = new Set<number>();
    for (const a of activities) yrs.add(new Date(a.start_date).getFullYear());
    if (currentYear) yrs.add(currentYear); // always include current year
    return [...yrs].sort((a, b) => a - b);
  }, [activities, currentYear]);

  // Build dayMap for ALL activities (used across years)
  const dayMap = useMemo(() => {
    const map: Record<string, Activity[]> = {};
    for (const a of activities) {
      // Prefer start_date_local (athlete's timezone); fall back to parsing start_date
      const raw = a.start_date_local ?? a.start_date;
      const d = raw.slice(0, 10); // fast ISO date extract: "YYYY-MM-DD"
      if (!map[d]) map[d] = [];
      map[d].push(a);
    }
    return map;
  }, [activities]);

  const { weeks, monthLabels, maxCount, yearStats } = useMemo(() => {
    if (!selectedYear) return { weeks: [], monthLabels: [], maxCount: 0, yearStats: { count: 0, distance: 0, time: 0, activeDays: 0 } };
    const today = todayStr ? new Date(todayStr + 'T00:00:00') : new Date();
    const isCurrentYear = selectedYear === currentYear;

    // Jan 1 of selected year
    const jan1 = new Date(selectedYear, 0, 1);
    // Start grid on the Sunday on or before Jan 1
    const startSunday = new Date(jan1);
    startSunday.setDate(jan1.getDate() - jan1.getDay());

    // End: Dec 31 of selected year OR today (whichever is earlier)
    const dec31 = new Date(selectedYear, 11, 31);
    const endDay = isCurrentYear && today < dec31 ? today : dec31;

    const weeks: string[][] = [];
    const cur = new Date(startSunday);
    let maxCount = 0;

    while (cur <= endDay) {
      const week: string[] = [];
      for (let d = 0; d < 7; d++) {
        const inYear = cur.getFullYear() === selectedYear && cur <= endDay;
        const key = inYear ? localIso(new Date(cur)) : '';
        week.push(key);
        if (key) {
          const cnt = dayMap[key]?.length ?? 0;
          if (cnt > maxCount) maxCount = cnt;
        }
        cur.setDate(cur.getDate() + 1);
      }
      weeks.push(week);
    }

    // Month label column positions
    const monthLabels: { month: string; col: number }[] = [];
    let lastMonth = -1;
    weeks.forEach((week, col) => {
      const first = week.find((d) => d);
      if (!first) return;
      const m = new Date(first).getMonth();
      if (m !== lastMonth) {
        monthLabels.push({ month: MONTHS[m], col });
        lastMonth = m;
      }
    });

    // Year summary stats — use start_date_local when available
    const prefix = `${selectedYear}-`;
    const yearActs = activities.filter((a) =>
      (a.start_date_local ?? a.start_date).startsWith(prefix)
    );
    const yearStats = {
      count: yearActs.length,
      distance: yearActs.reduce((s, a) => s + (a.distance ?? 0), 0),
      time: yearActs.reduce((s, a) => s + (a.moving_time ?? 0), 0),
      activeDays: new Set(yearActs.map((a) => localIso(new Date(a.start_date)))).size,
    };

    return { weeks, monthLabels, maxCount, yearStats };
  }, [selectedYear, currentYear, todayStr, dayMap, activities]);

  function cellColor(count: number): string {
    if (count === 0) return 'var(--border)';
    const t = Math.min(count / Math.max(maxCount, 1), 1);
    if (t < 0.25) return '#3b82f625';
    if (t < 0.5)  return '#3b82f655';
    if (t < 0.75) return '#3b82f690';
    return '#3b82f6';
  }

  // Ref-based active date avoids stale closure comparisons
  const activeDateRef = useRef<string | null>(null);

  const handleMouseEnter = useCallback((e: React.MouseEvent, dateKey: string) => {
    // Same cell already showing — skip to prevent re-render loop
    if (activeDateRef.current === dateKey) return;
    const acts = dayMap[dateKey] ?? [];
    if (!acts.length) {
      activeDateRef.current = null;
      setTooltip(null);
      return;
    }
    activeDateRef.current = dateKey;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setTooltip({
      date: dateKey,
      acts,
      mx: rect.left + rect.width / 2,
      my: rect.top,
    });
  }, [dayMap]);

  const handleGridMouseLeave = useCallback(() => {
    activeDateRef.current = null;
    setTooltip(null);
  }, []);

  const yearIdx = availableYears.indexOf(selectedYear);

  // Don't render until client-side date is known (avoids hydration mismatch)
  if (!selectedYear) return <div className="h-40" />;

  return (
    <div className="space-y-4">
      {/* Year selector */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setSelectedYear(availableYears[yearIdx - 1])}
          disabled={yearIdx === 0}
          className="p-1.5 rounded-lg border border-border hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="w-3.5 h-3.5 text-text-secondary" />
        </button>

        <div className="flex items-center gap-1 flex-wrap">
          {availableYears.map((yr) => (
            <button
              key={yr}
              onClick={() => setSelectedYear(yr)}
              className="px-3 py-1 rounded-lg text-xs font-semibold transition-all duration-150"
              style={
                yr === selectedYear
                  ? { background: '#3b82f620', color: '#3b82f6', border: '1px solid #3b82f640' }
                  : { background: 'transparent', color: 'var(--text-secondary)', border: '1px solid transparent' }
              }
            >
              {yr}
            </button>
          ))}
        </div>

        <button
          onClick={() => setSelectedYear(availableYears[yearIdx + 1])}
          disabled={yearIdx === availableYears.length - 1}
          className="p-1.5 rounded-lg border border-border hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRight className="w-3.5 h-3.5 text-text-secondary" />
        </button>

        {/* Year summary */}
        <div className="ml-auto flex items-center gap-4 text-xs text-text-secondary">
          <span><span className="font-semibold text-text-primary">{yearStats.count}</span> activities</span>
          <span><span className="font-semibold text-text-primary">{formatDistance(yearStats.distance)}</span></span>
          <span className="hidden sm:inline"><span className="font-semibold text-text-primary">{yearStats.activeDays}</span> active days</span>
        </div>
      </div>

      {/* Heatmap grid */}
      <div className="heatmap-scroll overflow-x-auto">
        <div style={{ minWidth: weeks.length * 14 + 32 }}>
          {/* Month labels row */}
          <div className="relative mb-1" style={{ height: 16, paddingLeft: 28 }}>
            {monthLabels.map(({ month, col }, i) => (
              <span
                key={i}
                className="absolute text-[10px] text-text-muted"
                style={{ left: 28 + col * 14 }}
              >
                {month}
              </span>
            ))}
          </div>

          {/* Day-label column + week columns */}
          <div className="flex">
            {/* Day labels */}
            <div className="flex flex-col gap-0.5 mr-1 flex-shrink-0" style={{ width: 26 }}>
              {DAYS.map((d, i) => (
                <div key={i} className="text-[10px] text-text-muted text-right pr-1"
                  style={{ height: 12, lineHeight: '12px' }}>
                  {d}
                </div>
              ))}
            </div>

            {/* Week columns — onMouseLeave on container clears tooltip once,
                not on every individual cell (avoids rapid set/clear cycling) */}
            <div className="flex gap-0.5" onMouseLeave={handleGridMouseLeave}>
              {weeks.map((week, wi) => (
                <div key={wi} className="flex flex-col gap-0.5">
                  {week.map((dateKey, di) => {
                    if (!dateKey) {
                      return (
                        <div key={di} style={{ width: 12, height: 12 }}
                          className="rounded-[2px]" />
                      );
                    }
                    const count = dayMap[dateKey]?.length ?? 0;
                    const isToday = dateKey === todayStr;
                    return (
                      <div
                        key={di}
                        onMouseEnter={(e) => handleMouseEnter(e, dateKey)}
                        className="rounded-[2px] cursor-default transition-opacity duration-100 hover:opacity-80"
                        style={{
                          width: 12,
                          height: 12,
                          background: cellColor(count),
                          boxShadow: isToday ? '0 0 0 1.5px #3b82f6' : undefined,
                        }}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* Legend */}
      <div className="flex items-center gap-1.5 justify-end">
        <span className="text-[10px] text-text-muted">Less</span>
        {[0, 0.25, 0.5, 0.75, 1].map((v, i) => (
          <div
            key={i}
            className="rounded-[2px]"
            style={{
              width: 12,
              height: 12,
              background: v === 0 ? 'var(--border)' : `#3b82f6${Math.round(v * 255).toString(16).padStart(2, '0')}`,
            }}
          />
        ))}
        <span className="text-[10px] text-text-muted">More</span>
      </div>

      {/* Tooltip — fixed so scroll / container offset can't affect it */}
      {tooltip && (
        <div
          className="fixed z-[9999] pointer-events-none"
          style={{
            left: tooltip.mx,
            top: tooltip.my - 10,
            transform: 'translate(-50%, -100%)',
          }}
        >
          {/* Arrow */}
          <div className="relative">
            <div
              className="rounded-xl px-3 py-2.5 text-xs shadow-2xl"
              style={{
                background: 'var(--background)',
                border: '1px solid var(--border)',
                minWidth: 170,
                maxWidth: 230,
                boxShadow: '0 8px 32px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.10)',
              }}
            >
              {/* Date header */}
              <p className="font-semibold text-text-primary mb-2 text-[11px]">
                {new Date(tooltip.date + 'T00:00:00').toLocaleDateString('en-US', {
                  weekday: 'long', month: 'short', day: 'numeric',
                })}
              </p>

              {/* Activities */}
              <div className="space-y-1.5">
                {tooltip.acts.slice(0, 4).map((a) => {
                  const meta = getSportMeta(a.type);
                  const Icon = meta.icon;
                  return (
                    <div key={a.id} className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0"
                        style={{ background: `${meta.hex}18`, color: meta.hex }}>
                        <Icon className="w-3 h-3" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-text-primary font-medium truncate" style={{ maxWidth: 140 }}>{a.name}</p>
                        <p className="text-text-muted text-[10px]">
                          {formatDistance(a.distance)} · {formatDuration(a.moving_time)}
                        </p>
                      </div>
                    </div>
                  );
                })}
                {tooltip.acts.length > 4 && (
                  <p className="text-text-muted text-[10px] pt-0.5">
                    +{tooltip.acts.length - 4} more
                  </p>
                )}
              </div>

              {/* Day total (only when >1 activity) */}
              {tooltip.acts.length > 1 && (
                <div className="mt-2 pt-2 border-t border-border/50 flex justify-between text-[10px] text-text-muted">
                  <span>{tooltip.acts.length} activities</span>
                  <span>{formatDistance(tooltip.acts.reduce((s, a) => s + a.distance, 0))}</span>
                </div>
              )}
            </div>
            {/* Down-pointing arrow */}
            <div className="absolute left-1/2 -translate-x-1/2 -bottom-[5px] w-2.5 h-2.5 rotate-45"
              style={{ background: 'var(--background)', borderRight: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }} />
          </div>
        </div>
      )}
    </div>
  );
}
