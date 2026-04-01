/**
 * AltitudeLegend — altitude colour scale + clickable band filters.
 * Click a band to show only that altitude range.
 */

import { useFlightStore } from '../../store/flightStore';

const BANDS = [
  { key: 'ground', label: 'GROUND',  sub: '< 500 m',       color: '#00FF88', min: 0,      max: 500      },
  { key: 'low',    label: 'LOW',     sub: '< 3,000 m',      color: '#00FF88', min: 500,    max: 3_000    },
  { key: 'mid',    label: 'MID',     sub: '3,000 – 7,000',  color: '#FFE500', min: 3_000,  max: 7_000    },
  { key: 'high',   label: 'HIGH',    sub: '7,000 – 11,000', color: '#FF6B35', min: 7_000,  max: 11_000   },
  { key: 'cruise', label: 'CRUISE',  sub: '> 11,000 m',     color: '#80CFFF', min: 11_000, max: Infinity },
  { key: 'sel',    label: 'SELECTED',sub: '',               color: '#FFFFFF', min: null,   max: null     },
];

function getBandKey(alt) {
  if (alt <= 500)   return 'ground';
  if (alt <= 3000)  return 'low';
  if (alt <= 7000)  return 'mid';
  if (alt <= 11000) return 'high';
  return 'cruise';
}

export function AltitudeLegend() {
  const flights      = useFlightStore(s => s.flights);
  const selectedId   = useFlightStore(s => s.selectedId);
  const altFilter    = useFlightStore(s => s.altFilter);
  const setAltFilter = useFlightStore(s => s.setAltFilter);

  const counts = { ground: 0, low: 0, mid: 0, high: 0, cruise: 0 };
  let total = 0;
  for (const f of Object.values(flights)) {
    if (f.altitude == null) continue;
    counts[getBandKey(f.altitude)]++;
    total++;
  }

  return (
    <div className="fixed left-4 bottom-4 z-40">
      <div className="neo-panel p-3 min-w-[168px]">
        <div className="flex items-center justify-between mb-2">
          <div className="label">ALTITUDE</div>
          {altFilter && (
            <button onClick={() => setAltFilter(null)}
                    className="text-[8px] tracking-widest transition-colors"
                    style={{ color: 'var(--accent)' }}>
              CLEAR ×
            </button>
          )}
        </div>
        <ul className="space-y-2">
          {BANDS.map(({ key, label, sub, color, min, max }) => {
            const count  = key === 'sel' ? (selectedId ? 1 : 0) : (counts[key] ?? 0);
            const barPct = (key !== 'sel' && total > 0) ? (count / total) * 100 : 0;
            const active = altFilter === key;
            const dimmed = altFilter && !active && key !== 'sel';

            return (
              <li key={key}
                  onClick={() => key !== 'sel' && setAltFilter(active ? null : key)}
                  style={{ cursor: key !== 'sel' ? 'pointer' : 'default', opacity: dimmed ? 0.35 : 1,
                           transition: 'opacity 0.2s' }}>
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="flex-shrink-0 w-2 h-2 rounded-full"
                        style={{ background: color, boxShadow: `0 0 ${active ? 8 : 5}px ${active ? 2 : 1}px ${color}88` }} />
                  <span className="text-[10px] font-bold tracking-wider flex-1" style={{ color }}>
                    {label}
                    {active && <span className="ml-1 text-[8px]">●</span>}
                  </span>
                  {key !== 'sel' && total > 0 && (
                    <span className="text-[9px] tabular-nums" style={{ color: 'var(--text-faint)' }}>{count}</span>
                  )}
                </div>
                {sub && (
                  <div className="pl-4 space-y-0.5">
                    <div className="text-[8px] tracking-wider" style={{ color: 'var(--text-faint)' }}>{sub}</div>
                    {key !== 'sel' && total > 0 && (
                      <div className="h-[3px] w-full rounded-full" style={{ background: 'var(--border-dim)' }}>
                        <div className="h-full rounded-full transition-all duration-700"
                             style={{ width: `${barPct}%`, background: color, opacity: 0.75,
                                      boxShadow: `0 0 4px ${color}` }} />
                      </div>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
        {altFilter && (
          <div className="mt-2 pt-2 text-[8px] tracking-wider text-center"
               style={{ borderTop: '1px solid var(--border-dim)', color: 'var(--text-faint)' }}>
            CLICK BAND TO FILTER
          </div>
        )}
        {!altFilter && (
          <div className="mt-2 pt-2 text-[8px] tracking-wider text-center"
               style={{ borderTop: '1px solid var(--border-dim)', color: 'var(--text-faint)' }}>
            CLICK BAND TO FILTER
          </div>
        )}
      </div>
    </div>
  );
}