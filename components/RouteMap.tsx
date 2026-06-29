'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { MapPin } from 'lucide-react';

interface RouteMapProps {
  polyline: string;
  sportType?: string;
}

function decodePolyline(encoded: string): [number, number][] {
  const coords: [number, number][] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    let shift = 0;
    let result = 0;
    let byte: number;
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    lat += result & 1 ? ~(result >> 1) : result >> 1;

    shift = 0;
    result = 0;
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    lng += result & 1 ? ~(result >> 1) : result >> 1;

    coords.push([lat / 1e5, lng / 1e5]);
  }
  return coords;
}

const sportStroke: Record<string, string> = {
  Run: 'var(--accent-run)',
  Ride: 'var(--accent-ride)',
  Walk: 'var(--accent-walk)',
};

const sportGradId: Record<string, string> = {
  Run: 'routeGradRun',
  Ride: 'routeGradRide',
  Walk: 'routeGradWalk',
};

const VIEW_W = 800;
const VIEW_H = 400;
const PAD = 32;

export function RouteMap({ polyline, sportType = 'Run' }: RouteMapProps) {
  const { path, startPt, endPt } = useMemo(() => {
    if (!polyline) return { path: '', startPt: null, endPt: null };

    const coords = decodePolyline(polyline);
    if (coords.length < 2) return { path: '', startPt: null, endPt: null };

    const lats = coords.map((c) => c[0]);
    const lngs = coords.map((c) => c[1]);

    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);

    const latSpan = maxLat - minLat || 0.001;
    const lngSpan = maxLng - minLng || 0.001;

    // preserve aspect ratio
    const scaleX = (VIEW_W - PAD * 2) / lngSpan;
    const scaleY = (VIEW_H - PAD * 2) / latSpan;
    const scale = Math.min(scaleX, scaleY);

    const offsetX = (VIEW_W - lngSpan * scale) / 2;
    const offsetY = (VIEW_H - latSpan * scale) / 2;

    const project = ([lat, lng]: [number, number]): [number, number] => [
      offsetX + (lng - minLng) * scale,
      VIEW_H - offsetY - (lat - minLat) * scale, // flip Y
    ];

    const pts = coords.map(project);
    const d = pts.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ');

    return {
      path: d,
      startPt: pts[0],
      endPt: pts[pts.length - 1],
    };
  }, [polyline]);

  if (!path) return null;

  const stroke = sportStroke[sportType] ?? 'var(--accent-run)';
  const gradId = sportGradId[sportType] ?? 'routeGradRun';

  return (
    <motion.div
      initial={{ opacity: 0, scaleY: 0.95 }}
      animate={{ opacity: 1, scaleY: 1 }}
      transition={{ duration: 0.45 }}
      style={{ transformOrigin: 'bottom' }}
      className="glass-panel rounded-2xl overflow-hidden"
    >
      <div className="px-6 pt-5 pb-3 flex items-center gap-2">
        <MapPin className="w-4 h-4" style={{ color: stroke }} />
        <h3 className="text-lg font-semibold text-text-primary">Route</h3>
      </div>

      <div className="relative w-full" style={{ background: 'var(--surface)' }}>
        {/* subtle grid bg */}
        <svg
          viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
          className="w-full"
          style={{ display: 'block' }}
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            {/* glow filter */}
            <filter id="routeGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>

            {/* gradient along path */}
            <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={stroke} stopOpacity="0.4" />
              <stop offset="50%" stopColor={stroke} stopOpacity="1" />
              <stop offset="100%" stopColor={stroke} stopOpacity="0.7" />
            </linearGradient>

            {/* glow shadow path */}
            <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
              <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor={stroke} floodOpacity="0.5" />
            </filter>
          </defs>

          {/* grid dots */}
          <pattern id="dots" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
            <circle cx="1" cy="1" r="1" fill="var(--border)" fillOpacity="0.4" />
          </pattern>
          <rect width={VIEW_W} height={VIEW_H} fill="url(#dots)" />

          {/* glow layer */}
          <path
            d={path}
            fill="none"
            stroke={stroke}
            strokeWidth={6}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeOpacity={0.25}
            filter="url(#shadow)"
          />

          {/* main route line */}
          <path
            d={path}
            fill="none"
            stroke={`url(#${gradId})`}
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Start dot */}
          {startPt && (
            <g>
              <circle cx={startPt[0]} cy={startPt[1]} r={8} fill={stroke} fillOpacity={0.2} />
              <circle cx={startPt[0]} cy={startPt[1]} r={4} fill={stroke} />
              <circle cx={startPt[0]} cy={startPt[1]} r={2} fill="white" fillOpacity={0.9} />
            </g>
          )}

          {/* End dot */}
          {endPt && (
            <g>
              <circle cx={endPt[0]} cy={endPt[1]} r={8} fill={stroke} fillOpacity={0.2} />
              <circle cx={endPt[0]} cy={endPt[1]} r={4} fill={stroke} />
            </g>
          )}
        </svg>

        {/* Legend */}
        <div className="absolute bottom-3 right-4 flex items-center gap-3 text-[11px] text-text-secondary">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: stroke }} />
            Start
          </span>
          <span className="flex items-center gap-1.5">
            <span
              className="w-2.5 h-2.5 rounded-full inline-block border-2"
              style={{ background: stroke, borderColor: 'var(--background)' }}
            />
            Finish
          </span>
        </div>
      </div>
    </motion.div>
  );
}
