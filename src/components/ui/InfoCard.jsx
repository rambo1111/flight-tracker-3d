import { useFlightStore }  from '../../store/flightStore';
import { lookupAirport }   from '../../api/airports';
import {
  altitudeHex, getAltBand,
  formatAltitude, formatSpeed, formatVertRate, formatHeading,
} from '../../utils/colors';

function Row({ label, value, highlight = false, color }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-0.5">
      <span className="label flex-shrink-0">{label}</span>
      <span className="text-[11px] font-bold tracking-wide text-right"
            style={{ color: color ?? (highlight ? 'var(--accent)' : 'var(--text)') }}>
        {value}
      </span>
    </div>
  );
}

function RouteRow({ dep, arr }) {
  const depApt = dep ? lookupAirport(dep) : null;
  const arrApt = arr ? lookupAirport(arr) : null;
  if (!dep && !arr) return null;

  return (
    <div className="mt-2 pt-2" style={{ borderTop: '1px solid var(--border-dim)' }}>
      <div className="label mb-1.5">ROUTE</div>
      <div className="flex items-center gap-2 text-[11px] font-bold tracking-wide">
        {/* Departure */}
        <div className="flex flex-col items-center min-w-[52px]">
          <span style={{ color: '#00FF88' }}>{dep ?? '—'}</span>
          {depApt && <span className="text-[8px] font-normal truncate max-w-[56px]"
                          style={{ color: 'var(--text-faint)' }}>{depApt.name}</span>}
        </div>

        {/* Arrow */}
        <div className="flex-1 flex items-center gap-0.5" style={{ color: 'var(--text-faint)' }}>
          <div className="flex-1 h-px" style={{ background: 'var(--border-dim)' }} />
          <span className="text-[10px]">✈</span>
          <div className="flex-1 h-px" style={{ background: 'var(--border-dim)' }} />
        </div>

        {/* Arrival */}
        <div className="flex flex-col items-center min-w-[52px]">
          <span style={{ color: '#FF6B35' }}>{arr ?? '—'}</span>
          {arrApt && <span className="text-[8px] font-normal truncate max-w-[56px]"
                          style={{ color: 'var(--text-faint)' }}>{arrApt.name}</span>}
        </div>
      </div>
    </div>
  );
}

export function InfoCard() {
  const flights        = useFlightStore(s => s.flights);
  const selectedId     = useFlightStore(s => s.selectedId);
  const clearSelection = useFlightStore(s => s.clearSelection);

  const flight = selectedId ? flights[selectedId] : null;
  if (!flight) return null;

  const altColor   = altitudeHex(flight.altitude);
  const band       = getAltBand(flight.altitude);
  const isAirborne = !flight.onGround;

  return (
    <div className="fixed right-4 z-40 w-64 animate-slide-in-right"
         style={{ top: '50%', transform: 'translateY(-50%)' }}>
      <div className="neo-panel p-4"
           style={{ borderColor: altColor, boxShadow: `3px 3px 0px ${altColor}` }}>

        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="label mb-0.5">SELECTED AIRCRAFT</div>
            <div className="text-xl font-bold tracking-[0.12em]" style={{ color: altColor }}>
              {flight.callsign}
            </div>
            {flight.aircraft && (
              <div className="text-[9px] tracking-widest mt-0.5" style={{ color: 'var(--text-faint)' }}>
                {flight.aircraft}
              </div>
            )}
          </div>
          <button onClick={clearSelection}
            className="text-xl leading-none mt-0.5 w-7 h-7 flex items-center justify-center"
            style={{ color: 'var(--text-faint)' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--text)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-faint)')}>
            ×
          </button>
        </div>

        {/* Status */}
        <div className="flex gap-2 mb-3">
          <span className="neo-badge"
                style={{ color: isAirborne ? altColor : 'var(--text-faint)',
                         borderColor: isAirborne ? altColor : 'var(--border-dim)' }}>
            {isAirborne ? '▲ AIRBORNE' : '● GROUND'}
          </span>
          <span className="neo-badge" style={{ color: 'var(--text-faint)', borderColor: 'var(--border-dim)' }}>
            {band.label}
          </span>
        </div>

        <hr className="neo-divider mb-3" />

        {/* Data */}
        <div className="space-y-0.5">
          <Row label="ICAO24"    value={flight.icao24.toUpperCase()} />
          <Row label="COUNTRY"   value={flight.country} />
          <Row label="ALTITUDE"  value={formatAltitude(flight.altitude)} highlight />
          <Row label="SPEED"     value={formatSpeed(flight.velocity)} />
          <Row label="HEADING"   value={formatHeading(flight.heading)} />
          <Row label="VERT RATE" value={formatVertRate(flight.verticalRate)} />
          {flight.squawk && <Row label="SQUAWK" value={flight.squawk} />}
        </div>

        {/* Position */}
        <hr className="neo-divider mt-3 mb-2" />
        <div className="flex gap-4">
          <div><div className="label mb-0.5">LAT</div>
               <div className="text-[10px] font-bold tabular-nums">{flight.lat.toFixed(3)}°</div></div>
          <div><div className="label mb-0.5">LON</div>
               <div className="text-[10px] font-bold tabular-nums">{flight.lon.toFixed(3)}°</div></div>
        </div>

        {/* Route (VATSIM only) */}
        {(flight.departure || flight.arrival) && (
          <RouteRow dep={flight.departure} arr={flight.arrival} />
        )}
      </div>
    </div>
  );
}
