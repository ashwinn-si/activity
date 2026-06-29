'use client';

import { useMemo, useState } from 'react';
import { getSportMeta } from '@/utils/sportConfig';
import { formatDistance, formatDuration } from '@/utils/formatters';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Activity {
  id: number;
  name: string;
  type: string;
  distance: number;
  moving_time: number;
  start_date: string;
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
  const currentYear = new Date().getFullYear();

  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [tooltip, setTooltip] = useState<{
    date: string;
    acts: Activity[];
    x: number;
    y: number;
  } | null>(null);

  // All years that have at least one activity
  const availableYears = useMemo(() => {
    const yrs = new Set<number>();
    for (const a of activities) yrs.add(new Date(a.start_date).getFullYear());
    yrs.add(currentYear); // always include current year
    return [...yrs].sort((a, b) => a - b);
  }, [activities, currentYear]);

  // Build dayMap for ALL activities (used across years)
  const dayMap = useMemo(() => {
    const map: Record<string, Activity[]> = {};
    for (const a of activities) {
      const d = localIso(new Date(a.start_date));
      if (!map[d]) map[d] = [];
      map[d].push(a);
    }
    return map;
  }, [activities]);

  const { weeks, monthLabels, maxCount, yearStats } = useMemo(() => {
    const today = new Date();
    const isCurrentYear = selectedYear === today.getFullYear();

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

    // Year summary stats
    const prefix = `${selectedYear}-`;
    const yearActs = activities.filter((a) => a.start_date.startsWith(prefix));
    const yearStats = {
      count: yearActs.length,
      distance: yearActs.reduce((s, a) => s + (a.distance ?? 0), 0),
      time: yearActs.reduce((s, a) => s + (a.moving_time ?? 0), 0),
      activeDays: new Set(yearActs.map((a) => localIso(new Date(a.start_date)))).size,
    };

    return { weeks, monthLabels, maxCount, yearStats };
  }, [selectedYear, dayMap, activities]);

  function cellColor(count: number): string {
    if (count === 0) return 'var(--border)';
    const t = Math.min(count / Math.max(maxCount, 1), 1);
    if (t < 0.25) return '#3b82f625';
    if (t < 0.5)  return '#3b82f655';
    if (t < 0.75) return '#3b82f690';
    return '#3b82f6';
  }

  const handleMouseEnter = (e: React.MouseEvent, dateKey: string) => {
    const acts = dayMap[dateKey] ?? [];
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const container = (e.currentTarget as HTMLElement).closest('.heatmap-scroll')?.getBoundingClientRect();
    setTooltip({
      date: dateKey,
      acts,
      x: rect.left - (container?.left ?? 0) + rect.width / 2,
      y: rect.top - (container?.top ?? 0),
    });
  };

  const yearIdx = availableYears.indexOf(selectedYear);
  const todayStr = localIso(new Date());

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
      <div className="heatmap-scroll overflow-x-auto relative">
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

            {/* Week columns */}
            <div className="flex gap-0.5">
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
                        onMouseLeave={() => setTooltip(null)}
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

        {/* Tooltip */}
        {tooltip && (
          <div
            className="absolute z-50 pointer-events-none"
            style={{ left: tooltip.x, top: tooltip.y - 8, transform: 'translate(-50%, -100%)' }}
          >
            <div
              className="rounded-xl px-3 py-2 text-xs shadow-xl"
              style={{
                background: 'var(--tooltip-background)',
                border: '1px solid var(--tooltip-border)',
                minWidth: 160,
                maxWidth: 224,
              }}
            >
              <p className="font-semibold text-text-primary mb-1.5">
                {new Date(tooltip.date + 'T00:00:00').toLocaleDateString('en-US', {
                  weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
                })}
              </p>
              {tooltip.acts.length === 0 ? (
                <p className="text-text-muted">No activity</p>
              ) : (
                <div className="space-y-1.5">
                  {tooltip.acts.slice(0, 3).map((a) => {
                    const meta = getSportMeta(a.type);
                    const Icon = meta.icon;
                    return (
                      <div key={a.id} className="flex items-center gap-1.5">
                        <Icon className="w-3 h-3 flex-shrink-0" style={{ color: meta.hex }} />
                        <span className="text-text-primary truncate font-medium" style={{ maxWidth: 128 }}>{a.name}</span>
                      </div>
                    );
                  })}
                  {tooltip.acts.length > 3 && (
                    <p className="text-text-muted text-[10px]">+{tooltip.acts.length - 3} more</p>
                  )}
                  <div className="pt-1 mt-0.5 border-t border-border/40 text-text-muted">
                    {formatDistance(tooltip.acts.reduce((s, a) => s + a.distance, 0))}
                    {' · '}
                    {formatDuration(tooltip.acts.reduce((s, a) => s + a.moving_time, 0))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
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
    </div>
  );
}
