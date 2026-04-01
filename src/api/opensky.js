import { getMockFlights } from './mockData';
import { ICAO_COUNTRY }   from './icaoCountry';

const TIMEOUT_MS = 10_000;
const MAX_PLANES = 600;

async function timedFetch(url, label) {
  const ctrl  = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal, headers: { Accept: 'application/json' }, cache: 'no-store',
    });
    clearTimeout(timer);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    clearTimeout(timer);
    console.warn(`[${label}]`, err.message);
    return null;
  }
}

async function tryVatsim() {
  const data = await timedFetch('https://data.vatsim.net/v3/vatsim-data.json', 'VATSIM');
  if (!Array.isArray(data?.pilots)) return null;

  const flights = data.pilots.map(p => {
    if (p.latitude == null || p.longitude == null) return null;
    const dep = p.flight_plan?.departure?.toUpperCase() ?? null;
    const arr = p.flight_plan?.arrival?.toUpperCase()   ?? null;
    return {
      icao24:       String(p.cid).padStart(6, '0'),
      callsign:     (p.callsign ?? 'UNKN').toUpperCase(),
      country:      dep ? (ICAO_COUNTRY[dep.slice(0,2)] ?? ICAO_COUNTRY[dep.slice(0,1)] ?? 'Unknown') : 'Unknown',
      lat:          p.latitude,
      lon:          p.longitude,
      altitude:     Math.max(0, (p.altitude ?? 0) * 0.3048),
      onGround:     (p.groundspeed ?? 0) < 30,
      velocity:     (p.groundspeed ?? 0) * 0.514444,
      heading:      p.heading ?? null,
      verticalRate: 0,
      lastContact:  Date.now() / 1000,
      squawk:       p.transponder ?? null,
      posSource:    0,
      // VATSIM extras
      departure:    dep,
      arrival:      arr,
      aircraft:     p.flight_plan?.aircraft_short ?? p.flight_plan?.aircraft ?? null,
      flightPlanAlt:p.flight_plan?.altitude ?? null,
      name:         p.name ?? null,
    };
  }).filter(Boolean).slice(0, MAX_PLANES);

  if (flights.length < 10) return null;
  console.log(`[VATSIM] ✓ ${flights.length} pilots`);
  return flights;
}

async function tryOpenSky() {
  const data = await timedFetch('/api/opensky/states/all', 'OpenSky');
  if (!Array.isArray(data?.states)) return null;
  const flights = data.states.map(s => {
    if (!s || s[5] == null || s[6] == null) return null;
    return {
      icao24: (s[0]??'').toLowerCase(), callsign: (s[1]?.trim()||s[0]||'UNKN').toUpperCase(),
      country: s[2]||'Unknown', lon: s[5], lat: s[6],
      altitude: Math.max(0, s[7]??s[13]??0), onGround: s[8]??false,
      velocity: s[9]??0, heading: s[10]??null, verticalRate: s[11]??0,
      lastContact: s[4]??null, squawk: s[14]??null, posSource: s[16]??0,
      departure: null, arrival: null, aircraft: null,
    };
  }).filter(Boolean).slice(0, MAX_PLANES);
  if (!flights.length) return null;
  console.log(`[OpenSky] ✓ ${flights.length} aircraft`);
  return flights;
}

export let dataSource = 'connecting';

export async function fetchFlights() {
  const vatsim = await tryVatsim();
  if (vatsim)  { dataSource = 'vatsim';  return vatsim; }
  const opensky = await tryOpenSky();
  if (opensky) { dataSource = 'opensky'; return opensky; }
  dataSource = 'mock';
  return getMockFlights();
}
