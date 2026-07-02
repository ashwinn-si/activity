const IST_OFFSET_SEC = 5.5 * 60 * 60; // 19800 seconds

// Format the time portion of a naive ISO string
// Example: "2026-06-12T21:08:28Z" -> "9:08 pm"
function fmtNaiveTime(naiveISO: string): string {
  const h = parseInt(naiveISO.slice(11, 13), 10);
  const m = naiveISO.slice(14, 16);

  const ampm = h >= 12 ? 'pm' : 'am';
  const h12 = h % 12 || 12;

  return `${h12}:${m} ${ampm}`;
}

// Add seconds to a naive local ISO time without timezone conversion
function fmtNaiveTimePlusSec(naiveISO: string, sec: number): string {
  const h = parseInt(naiveISO.slice(11, 13), 10);
  const m = parseInt(naiveISO.slice(14, 16), 10);
  const s = parseInt(naiveISO.slice(17, 19), 10);

  let totalSeconds = h * 3600 + m * 60 + s + sec;

  // wrap around midnight
  totalSeconds %= 24 * 3600;

  const hh = Math.floor(totalSeconds / 3600);
  const mm = Math.floor((totalSeconds % 3600) / 60);

  const ampm = hh >= 12 ? 'pm' : 'am';
  const h12 = hh % 12 || 12;

  return `${h12}:${mm.toString().padStart(2, '0')} ${ampm}`;
}

export interface ActivityTimeResult {
  // Example: "9:08 pm → 10:40 pm"
  localRange: string;

  // Example: "9:08 pm IST"
  istLabel: string;

  // Whether activity itself was recorded in IST
  isIST: boolean;
}

/**
 * Formats Strava activity times.
 *
 * @param startUTC     Strava start_date
 * @param startLocal   Strava start_date_local
 * @param elapsedSec   elapsed_time
 * @param utcOffset    utc_offset from Strava (seconds)
 */
export function fmtActivityTimes(
  startUTC: string,
  startLocal: string | undefined,
  elapsedSec: number | undefined,
  utcOffset?: number
): ActivityTimeResult {
  // Strava start_date_local is already local clock time
  const localSource = startLocal ?? startUTC;

  const localStart = fmtNaiveTime(localSource);

  const localEnd = elapsedSec != null ? fmtNaiveTimePlusSec(localSource, elapsedSec) : null;

  const localRange = localEnd ? `${localStart} → ${localEnd}` : localStart;

  // Convert actual UTC time to IST
  const istStart = new Date(startUTC)
    .toLocaleTimeString('en-IN', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: 'Asia/Kolkata',
    })
    .toLowerCase();

  const istLabel = `${istStart} IST`;

  // Use Strava's utc_offset instead of date math
  const isIST = utcOffset != null ? Math.abs(utcOffset - IST_OFFSET_SEC) < 60 : false;

  return {
    localRange,
    istLabel,
    isIST,
  };
}
