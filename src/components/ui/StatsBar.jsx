import { useState, useEffect } from 'react';
import { useFlightStore } from '../../store/flightStore';

const POLL_MS = 12_000;

function useCountdown() {
  const lastFetchAt = useFlightStore(s => s.lastFetchAt);
  const [pct, setPct] = useState(1);

  useEffect(() => {
    const tick = () => {
      if (!lastFetchAt) { setPct(0); return; }
      const elapsed = Date.now() - lastFetchAt;
      setPct(Math.max(0, 1 - elapsed / POLL_MS));
    };
    tick();
    const id = setInterval(tick, 80);
    return () => clearInterval(id);
  }, [lastFetchAt]);

  return pct;
}

function StatCell({ label, value, accent = false, sub }) {
  return (
    <div
      className="neo-panel-dim px-4 py-2 text-center min-w-[88px]"
      style={accent ? { borderColor: 'var(--accent)' } : {}}
    >
      <div className="label mb-0.5">{label}</div>
      <div
        className="text-[17px] font-bold leading-tight tabular-nums"
        style={{ color: accent ? 'var(--accent)' : 'var(--text)' }}
      >
        {value}
      </div>
      {sub && <div className="label mt-0.5" style={{ color: 'var(--text-faint)' }}>{sub}</div>}
    </div>
  );
}

export function StatsBar() {
  const flights        = useFlightStore(s => s.flights);
  const totalCountries = useFlightStore(s => s.totalCountries);
  const filteredIds    = useFlightStore(s => s.filteredIds);
  const countdown      = useCountdown();

  const allFlights  = Object.values(flights);
  const total       = allFlights.length;
  const airborne    = allFlights.filter(f => !f.onGround).length;
  const shown       = filteredIds ? filteredIds.length : total;

  // Fastest airborne aircraft
  const fastest = allFlights.reduce((best, f) => {
    if (f.onGround || !f.velocity) return best;
    return (!best || f.velocity > best.velocity) ? f : best;
  }, null);

  const displayCount = filteredIds ? `${shown}/${total}` : total.toLocaleString();

  return (
    <div
      className="fixed z-40 flex flex-col items-center gap-0 animate-fade-in"
      style={{ top: '56px', left: '50%', transform: 'translateX(-50%)' }}
    >
      {/* Stats row */}
      <div className="flex gap-px">
        <StatCell label="AIRCRAFT"  value={displayCount}              accent />
        <StatCell label="AIRBORNE"  value={airborne.toLocaleString()} />
        <StatCell label="COUNTRIES" value={totalCountries}            />
        {fastest && (
          <StatCell
            label="FASTEST"
            value={`${Math.round(fastest.velocity * 1.94384)} kts`}
            sub={fastest.callsign}
          />
        )}
      </div>

      {/* Refresh countdown bar */}
      <div
        className="w-full h-[2px]"
        style={{ background: 'var(--border-dim)' }}
      >
        <div
          className="h-full transition-none"
          style={{
            width:      `${countdown * 100}%`,
            background: countdown > 0.3 ? 'var(--accent)' : '#FF6B35',
            transition: countdown === 1 ? 'none' : 'width 80ms linear',
          }}
        />
      </div>
    </div>
  );
}