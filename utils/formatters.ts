export const formatDistance = (m: number) =>
  `${(m / 1000).toFixed(1)} km`;

export const formatDuration = (s: number) => {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
};

export const formatPace = (mps: number) => {
  if (!mps) return '—';
  const spk = 1000 / mps;
  const m = Math.floor(spk / 60);
  const s = Math.round(spk % 60).toString().padStart(2, '0');
  return `${m}:${s} /km`;
};

export const formatPacePerKm = (mps: number) => {
  if (!mps) return '—';
  const spk = 1000 / mps; // seconds per km
  const m = Math.floor(spk / 60);
  const s = Math.round(spk % 60);
  if (m === 0) return `${s}s / 1km`;
  return `${m}m ${s}s / 1km`;
};

export const formatSpeed = (mps: number) =>
  `${(mps * 3.6).toFixed(1)} km/h`;

export const sportMeta: any = {
  Run: {
    icon: 'Footprints',
    color: 'text-accent-run',
    bg: 'bg-blue-500/10',
  },
  Ride: {
    icon: 'Bike',
    color: 'text-accent-ride',
    bg: 'bg-orange-500/10',
  },
  Walk: {
    icon: 'PersonStanding',
    color: 'text-accent-walk',
    bg: 'bg-green-500/10',
  },
};
