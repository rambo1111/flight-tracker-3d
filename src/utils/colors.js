/**
 * Color system for flight altitude encoding.
 * Four bands: ground/low → mid → high → cruise.
 */

export const ALTITUDE_BANDS = [
  { maxM: 500,      label: 'GROUND',  hex: '#00FF88', three: 0x00FF88, cssVar: '--alt-low'    },
  { maxM: 3_000,    label: 'LOW',     hex: '#00FF88', three: 0x00FF88, cssVar: '--alt-low'    },
  { maxM: 7_000,    label: 'MID',     hex: '#FFE500', three: 0xFFE500, cssVar: '--alt-mid'    },
  { maxM: 11_000,   label: 'HIGH',    hex: '#FF6B35', three: 0xFF6B35, cssVar: '--alt-high'   },
  { maxM: Infinity, label: 'CRUISE',  hex: '#80CFFF', three: 0x80CFFF, cssVar: '--alt-cruise' },
];

export const SELECTED_COLOR_HEX   = '#FFFFFF';
export const SELECTED_COLOR_THREE = 0xFFFFFF;

/** Return the altitude band object for a given altitude in metres. */
export function getAltBand(altMeters) {
  const alt = altMeters || 0;
  for (const band of ALTITUDE_BANDS) {
    if (alt <= band.maxM) return band;
  }
  return ALTITUDE_BANDS[ALTITUDE_BANDS.length - 1];
}

/** CSS hex string for altitude. */
export function altitudeHex(altMeters) {
  return getAltBand(altMeters).hex;
}

/** Three.js integer color for altitude. */
export function altitudeThreeColor(altMeters) {
  return getAltBand(altMeters).three;
}

/** ── Formatters ──────────────────────────────────────── */

export function formatAltitude(meters) {
  if (!meters || meters <= 0) return '—';
  const m  = Math.round(meters).toLocaleString();
  const ft = Math.round(meters * 3.28084).toLocaleString();
  return `${m} m · ${ft} ft`;
}

export function formatSpeed(ms) {
  if (!ms || ms <= 0) return '—';
  const kts = Math.round(ms * 1.94384);
  const kmh = Math.round(ms * 3.6);
  return `${kts} kts · ${kmh} km/h`;
}

export function formatVertRate(ms) {
  if (ms === null || ms === undefined) return '—';
  const sign = ms > 0 ? '▲ +' : ms < 0 ? '▼ ' : '→ ';
  return `${sign}${ms.toFixed(1)} m/s`;
}

export function formatHeading(deg) {
  if (deg === null || deg === undefined) return '—';
  const n = Math.round(deg);
  const dirs = ['N','NE','E','SE','S','SW','W','NW'];
  const dir  = dirs[Math.round(n / 45) % 8];
  return `${n}° ${dir}`;
}
