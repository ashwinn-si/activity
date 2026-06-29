'use client';

import { useMemo, useState } from 'react';
import { getSportMeta } from '@/utils/sportConfig';
import { formatDistance, formatDuration } from '@/utils/formatters';

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

function isoDate(d: Date) {
  return d.toISOString().split('T')[0];
}

export function ActivityHeatmap({ activities }: ActivityHeatmapProps) {
  const [tooltip, setTooltip] = useState<{
    date: string;
    acts: Activity[];
    x: number;
    y: number;
  } | null>(null);

  const { weeks, monthLabels, maxCount, dayMap } = useMemo(() => {
    // Build map: dateStr → activities[]
    const map: Record<string, Activity[]> = {};
    for (const a of activities) {
      const d = isoDate(new Date(a.start_date));
      if (!map[d]) map[d] = [];
      map[d].push(a);
    }

    // Last 53 weeks (371 days) ending today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Start on the Sunday 52 full weeks before the week containing today
    const startDay = new Date(today);
    startDay.setDate(today.getDate() - today.getDay() - 52 * 7);

    const weeks: string[][] = [];
    const cur = new Date(startDay);
    let maxCount = 0;

    while (cur <= today) {
      const week: string[] = [];
      for (let d = 0; d < 7; d++) {
        const key = isoDate(new Date(cur));
        week.push(cur <= today ? key : '');
        const cnt = map[key]?.length ?? 0;
        if (cnt > maxCount) maxCount = cnt;
        cur.setDate(cur.getDate() + 1);
      }
      weeks.push(week);
    }

    // Month labels: find which week column each month starts in
    const monthLabels: { month: string; col: number }[] = [];
    let lastMonth = -1;
    weeks.forEach((week, col) => {
      const firstValid = week.find((d) => d);
      if (!firstValid) return;
      const m = new Date(firstValid).getMonth();
      if (m !== lastMonth) {
        monthLabels.push({ month: MONTHS[m], col });
        lastMonth = m;
      }
    });

    return { weeks, monthLabels, maxCount, dayMap: map };
  }, [activities]);

  function cellColor(count: number): string {
    if (count === 0) return 'var(--border)';
    const intensity = Math.min(count / Math.max(maxCount, 1), 1);
    if (intensity < 0.25) return '#3b82f620';
    if (intensity < 0.5)  return '#3b82f650';
    if (intensity < 0.75) return '#3b82f688';
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

  return (
    <div className="space-y-3">
      {/* Scroll container */}
      <div className="heatmap-scroll overflow-x-auto relative">
        <div style={{ minWidth: weeks.length * 14 + 28 }}>
          {/* Month labels */}
          <div className="flex mb-1" style={{ paddingLeft: 28 }}>
            {monthLabels.map(({ month, col }, i) => (
              <div
                key={i}
                className="text-[10px] text-text-muted absolute"
                style={{ left: 28 + col * 14 }}
              >
                {month}
              </div>
            ))}
            {/* spacer so the row has height */}
            <div className="h-4 opacity-0">x</div>
          </div>

          {/* Grid: day-rows × week-cols */}
          <div className="flex gap-0" style={{ paddingLeft: 0 }}>
            {/* Day labels */}
            <div className="flex flex-col gap-0.5 mr-1 flex-shrink-0">
              {DAYS.map((d, i) => (
                <div key={i} className="text-[10px] text-text-muted leading-none"
                  style={{ height: 12, lineHeight: '12px', width: 24, textAlign: 'right', paddingRight: 4 }}>
                  {d}
                </div>
              ))}
            </div>

            {/* Cells */}
            <div className="flex gap-0.5">
              {weeks.map((week, wi) => (
                <div key={wi} className="flex flex-col gap-0.5">
                  {week.map((dateKey, di) => {
                    if (!dateKey) {
                      return <div key={di} style={{ width: 12, height: 12 }} />;
                    }
                    const count = dayMap[dateKey]?.length ?? 0;
                    const isToday = dateKey === isoDate(new Date());
                    return (
                      <div
                        key={di}
                        onMouseEnter={(e) => handleMouseEnter(e, dateKey)}
                        onMouseLeave={() => setTooltip(null)}
                        className="rounded-[2px] transition-all duration-100 cursor-default hover:ring-1 hover:ring-white/40"
                        style={{
                          width: 12,
                          height: 12,
                          background: cellColor(count),
                          outline: isToday ? '1.5px solid #3b82f6' : undefined,
                          outlineOffset: 1,
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
                maxWidth: 220,
              }}
            >
              <p className="font-semibold text-text-primary mb-1">
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
                        <span className="text-text-primary truncate font-medium" style={{ maxWidth: 120 }}>{a.name}</span>
                      </div>
                    );
                  })}
                  {tooltip.acts.length > 3 && (
                    <p className="text-text-muted">+{tooltip.acts.length - 3} more</p>
                  )}
                  <div className="pt-1 border-t border-border/50 text-text-muted">
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
        {[0, 0.2, 0.4, 0.7, 1].map((v, i) => (
          <div
            key={i}
            className="rounded-[2px]"
            style={{ width: 12, height: 12, background: v === 0 ? 'var(--border)' : `#3b82f6${Math.round(v * 255).toString(16).padStart(2, '0')}` }}
          />
        ))}
        <span className="text-[10px] text-text-muted">More</span>
      </div>
    </div>
  );
}
