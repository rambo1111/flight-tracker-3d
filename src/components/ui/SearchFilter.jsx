/**
 * SearchFilter — left-side search panel.
 * Filters by callsign, country, or ICAO24.
 * Shows up to 8 clickable results below the input.
 */

import { useFlightStore }      from '../../store/flightStore';
import { altitudeHex }         from '../../utils/colors';

export function SearchFilter() {
  const searchQuery  = useFlightStore(s => s.searchQuery);
  const setSearchQuery = useFlightStore(s => s.setSearchQuery);
  const filteredIds  = useFlightStore(s => s.filteredIds);
  const flights      = useFlightStore(s => s.flights);
  const setSelectedId = useFlightStore(s => s.setSelectedId);

  const hasQuery    = searchQuery.trim().length > 0;
  const resultCount = filteredIds?.length ?? 0;
  const preview     = filteredIds?.slice(0, 8) ?? [];

  return (
    <div
      className="fixed left-4 z-40 w-56 animate-slide-in-left"
      style={{ top: '50%', transform: 'translateY(-50%)' }}
    >
      <div className="neo-panel p-3 space-y-2">
        {/* ── Label ── */}
        <div className="label">SEARCH</div>

        {/* ── Input ── */}
        <input
          type="text"
          className="neo-input w-full text-[11px] px-2.5 py-1.5 tracking-wider"
          placeholder="callsign / country…"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          spellCheck={false}
          autoComplete="off"
        />

        {/* ── Result count ── */}
        {hasQuery && (
          <div className="flex items-center justify-between">
            <span className="label">
              {resultCount} RESULT{resultCount !== 1 ? 'S' : ''}
            </span>
            <button
              onClick={() => setSearchQuery('')}
              className="text-[9px] tracking-widest transition-colors"
              style={{ color: 'var(--text-faint)' }}
              onMouseEnter={e => e.target.style.color = 'var(--text)'}
              onMouseLeave={e => e.target.style.color = 'var(--text-faint)'}
            >
              CLEAR ×
            </button>
          </div>
        )}

        {/* ── Results list ── */}
        {hasQuery && preview.length > 0 && (
          <>
            <hr className="neo-divider" />
            <ul className="space-y-px max-h-48 overflow-y-auto">
              {preview.map(id => {
                const f = flights[id];
                if (!f) return null;
                const color = altitudeHex(f.altitude);
                return (
                  <li key={id}>
                    <button
                      onClick={() => setSelectedId(id)}
                      className="
                        w-full text-left px-2 py-1.5 text-[10px]
                        flex items-center justify-between gap-2
                        transition-colors
                      "
                      style={{ color: 'var(--text-muted)' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      <span className="font-bold tracking-wider" style={{ color }}>
                        {f.callsign}
                      </span>
                      <span
                        className="text-[9px] truncate max-w-[80px] tracking-wider"
                        style={{ color: 'var(--text-faint)' }}
                      >
                        {f.country}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>

            {filteredIds.length > 8 && (
              <div className="label text-center pt-1">
                +{filteredIds.length - 8} MORE
              </div>
            )}
          </>
        )}

        {/* ── No results ── */}
        {hasQuery && resultCount === 0 && (
          <div className="label text-center py-2">NO MATCH</div>
        )}
      </div>
    </div>
  );
}
