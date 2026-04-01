import { create } from 'zustand';

const INTERP_MS = 10_000;
const MAX_TRAIL = 28;

const BAND_RANGES = {
  ground: [0,      500],
  low:    [500,    3_000],
  mid:    [3_000,  7_000],
  high:   [7_000,  11_000],
  cruise: [11_000, Infinity],
};

export const useFlightStore = create((set, get) => ({
  flights:        {},
  selectedId:     null,
  searchQuery:    '',
  filteredIds:    null,
  lastFetchAt:    null,
  fetchError:     false,
  isLoading:      true,
  totalCountries: 0,
  trail:          [],
  dataSource:     'connecting',
  cameraResetAt:  0,
  altFilter:      null,   // null | 'ground' | 'low' | 'mid' | 'high' | 'cruise'

  setFlights(incoming) {
    const existing = get().flights;
    const now      = Date.now();
    const next     = {};

    for (const f of incoming) {
      const prev = existing[f.icao24];
      next[f.icao24] = {
        ...f,
        prevLat:        prev?.lat      ?? f.lat,
        prevLon:        prev?.lon      ?? f.lon,
        prevAlt:        prev?.altitude ?? f.altitude,
        interpStart:    now,
        interpDuration: INTERP_MS,
      };
    }

    const totalCountries = new Set(incoming.map(f => f.country)).size;

    const selectedId = get().selectedId;
    let trail = get().trail;
    if (selectedId && next[selectedId]) {
      const f = next[selectedId];
      trail = [...trail, { lat: f.lat, lon: f.lon, alt: f.altitude }].slice(-MAX_TRAIL);
    }

    set({ flights: next, totalCountries, lastFetchAt: now, fetchError: false, isLoading: false, trail });

    // Re-apply combined filter
    get()._applyFilters(get().searchQuery, get().altFilter, next);
  },

  setFetchError() { set({ fetchError: true, isLoading: false }); },

  setSelectedId(id) {
    set(s => ({ selectedId: s.selectedId === id ? null : id, trail: [] }));
  },

  clearSelection() { set({ selectedId: null, trail: [] }); },

  setSearchQuery(q) {
    set({ searchQuery: q });
    get()._applyFilters(q.trim(), get().altFilter, get().flights);
  },

  setAltFilter(band) {
    set({ altFilter: band });
    get()._applyFilters(get().searchQuery, band, get().flights);
  },

  _applyFilters(q, band, flightMap) {
    const hasQ    = q && q.trim().length > 0;
    const hasBand = !!band;
    if (!hasQ && !hasBand) { set({ filteredIds: null }); return; }

    const lower = q ? q.toLowerCase() : '';
    const [bMin, bMax] = band ? BAND_RANGES[band] : [0, Infinity];

    const ids = Object.keys(flightMap).filter(id => {
      const f = flightMap[id];
      const matchText = !hasQ || (
        f.callsign?.toLowerCase().includes(lower) ||
        f.country?.toLowerCase().includes(lower)  ||
        f.icao24?.toLowerCase().includes(lower)
      );
      const matchBand = !hasBand || (
        (f.altitude ?? 0) >= bMin && (f.altitude ?? 0) < bMax
      );
      return matchText && matchBand;
    });
    set({ filteredIds: ids });
  },
}));