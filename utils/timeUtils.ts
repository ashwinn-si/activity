const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000; // UTC+5:30

// Format the time portion of a naive ISO string ("2026-06-26T08:30:00") without
// any timezone conversion — Strava's start_date_local is already the local clock time.
function fmtNaiveTime(naiveISO: string): string {
  const h = parseInt(naiveISO.slice(11, 13), 10);
  const mStr = naiveISO.slice(14, 16);
  const ampm = h >= 12 ? 'pm' : 'am';
  const h12 = h % 12 || 12;
  return `${h12}:${mStr} ${ampm}`;
}

// Add seconds to a naive ISO and format the resulting time.
function fmtNaiveTimePlusSec(naiveISO: string, sec: number): string {
  const ms = new Date(naiveISO + 'Z').getTime() + sec * 1000;
  const d = new Date(ms);
  const h = d.getUTCHours();
  const m = d.getUTCMinutes();
  const ampm = h >= 12 ? 'pm' : 'am';
  const h12 = h % 12 || 12;
  return `${h12}:${m.toString().padStart(2, '0')} ${ampm}`;
}

export interface ActivityTimeResult {
  // "8:30 am → 10:01 am" in the timezone of the activity
  localRange: string;
  // "8:30 am IST" — IST start time only
  istLabel: string;
  // true when the activity was recorded in IST already
  isIST: boolean;
}

/**
 * Returns formatted local start→end time and IST start time.
 *
 * @param startUTC   - Strava start_date (UTC ISO string)
 * @param startLocal - Strava start_date_local (naive ISO string, no timezone suffix)
 * @param elapsedSec - elapsed_time in seconds (wall-clock duration)
 */
export function fmtActivityTimes(
  startUTC: string,
  startLocal: string | undefined,
  elapsedSec: number | undefined,
): ActivityTimeResult {
  const naive = startLocal ?? startUTC;

  const localStart = fmtNaiveTime(naive);
  const localEnd = elapsedSec ? fmtNaiveTimePlusSec(naive, elapsedSec) : null;
  const localRange = localEnd ? `${localStart} → ${localEnd}` : localStart;

  const istStart = new Date(startUTC).toLocaleTimeString('en-IN', {
    hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata',
  });
  const istLabel = `${istStart} IST`;

  // Determine whether the activity was recorded in IST (offset diff within 1 min)
  const offsetMs = startLocal
    ? new Date(startLocal + 'Z').getTime() - new Date(startUTC).getTime()
    : IST_OFFSET_MS;
  const isIST = Math.abs(offsetMs - IST_OFFSET_MS) < 60_000;

  return { localRange, istLabel, isIST };
}
