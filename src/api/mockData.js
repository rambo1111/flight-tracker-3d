/**
 * Mock flight data — 500+ aircraft on realistic global routes.
 * Flights drift each call to simulate motion. Used as final fallback.
 */

const ROUTES = [
  // ── North Atlantic ──
  { o:[51.5,-0.1],   d:[40.7,-74.0],  n:22, pfx:'BAW', ctry:'United Kingdom' },
  { o:[48.9,2.4],    d:[40.7,-74.0],  n:18, pfx:'AFR', ctry:'France' },
  { o:[53.4,-6.3],   d:[40.7,-74.0],  n:10, pfx:'EIN', ctry:'Ireland' },
  { o:[52.4,13.5],   d:[40.7,-74.0],  n:12, pfx:'DLH', ctry:'Germany' },
  { o:[41.9,-87.9],  d:[51.5,-0.1],   n:14, pfx:'UAL', ctry:'United States' },
  // ── Europe ──
  { o:[51.5,-0.1],   d:[48.9,2.4],    n:28, pfx:'EZY', ctry:'United Kingdom' },
  { o:[52.4,13.5],   d:[48.4,11.8],   n:20, pfx:'DLH', ctry:'Germany' },
  { o:[40.5,-3.6],   d:[43.7,7.2],    n:16, pfx:'IBE', ctry:'Spain' },
  { o:[41.9,12.2],   d:[48.9,2.4],    n:14, pfx:'AZA', ctry:'Italy' },
  { o:[48.4,11.8],   d:[51.5,-0.1],   n:18, pfx:'BER', ctry:'Germany' },
  { o:[50.1,8.6],    d:[41.3,19.8],   n:12, pfx:'DLH', ctry:'Germany' },
  { o:[55.6,12.7],   d:[48.9,2.4],    n:10, pfx:'SAS', ctry:'Sweden' },
  { o:[60.2,24.9],   d:[51.5,-0.1],   n:8,  pfx:'FIN', ctry:'Finland' },
  { o:[47.5,19.3],   d:[52.4,13.5],   n:10, pfx:'WZZ', ctry:'Hungary' },
  // ── US Domestic ──
  { o:[33.9,-118.4], d:[40.6,-73.8],  n:32, pfx:'UAL', ctry:'United States' },
  { o:[41.9,-87.9],  d:[25.8,-80.3],  n:24, pfx:'AAL', ctry:'United States' },
  { o:[33.6,-84.4],  d:[47.4,-122.3], n:20, pfx:'DAL', ctry:'United States' },
  { o:[29.9,-95.3],  d:[40.6,-73.8],  n:18, pfx:'UAL', ctry:'United States' },
  { o:[33.9,-118.4], d:[37.6,-122.4], n:22, pfx:'SWA', ctry:'United States' },
  { o:[47.4,-122.3], d:[25.8,-80.3],  n:16, pfx:'ASA', ctry:'United States' },
  { o:[41.9,-87.9],  d:[33.9,-118.4], n:20, pfx:'AAL', ctry:'United States' },
  // ── Asia Pacific ──
  { o:[35.5,139.8],  d:[22.3,114.2],  n:16, pfx:'JAL', ctry:'Japan' },
  { o:[37.5,127.0],  d:[35.5,139.8],  n:12, pfx:'KAL', ctry:'South Korea' },
  { o:[1.4,103.9],   d:[22.3,114.2],  n:20, pfx:'SIA', ctry:'Singapore' },
  { o:[22.3,114.2],  d:[35.5,139.8],  n:14, pfx:'CPA', ctry:'Hong Kong' },
  { o:[1.4,103.9],   d:[13.7,100.7],  n:16, pfx:'SIA', ctry:'Singapore' },
  { o:[28.6,77.1],   d:[1.4,103.9],   n:10, pfx:'AIC', ctry:'India' },
  { o:[-33.9,151.2], d:[-37.7,144.8], n:14, pfx:'QFA', ctry:'Australia' },
  { o:[-27.4,153.1], d:[-33.9,151.2], n:10, pfx:'QFA', ctry:'Australia' },
  // ── Middle East ──
  { o:[25.3,55.4],   d:[51.5,-0.1],   n:14, pfx:'UAE', ctry:'United Arab Emirates' },
  { o:[25.3,51.6],   d:[40.7,-74.0],  n:10, pfx:'QTR', ctry:'Qatar' },
  { o:[24.9,67.2],   d:[25.3,55.4],   n:8,  pfx:'PIA', ctry:'Pakistan' },
  // ── Africa ──
  { o:[33.8,9.1],    d:[48.9,2.4],    n:8,  pfx:'TUT', ctry:'Tunisia' },
  { o:[-26.1,28.2],  d:[-33.9,18.6],  n:10, pfx:'SAA', ctry:'South Africa' },
  // ── South America ──
  { o:[-23.4,-46.5], d:[-22.9,-43.2], n:12, pfx:'TAM', ctry:'Brazil' },
  { o:[-34.8,-58.5], d:[-23.4,-46.5], n:8,  pfx:'ARG', ctry:'Argentina' },
  { o:[4.7,-74.1],   d:[40.7,-74.0],  n:8,  pfx:'AVA', ctry:'Colombia' },
];

const ALT_PROFILES = [
  { alt: 11500, prob: 0.38 }, // cruise
  { alt: 10000, prob: 0.25 },
  { alt: 8500,  prob: 0.15 },
  { alt: 5000,  prob: 0.10 },
  { alt: 2500,  prob: 0.07 },
  { alt: 800,   prob: 0.05 },
];

let _rng = 0xc0ffee42;
function rnd() {
  _rng ^= _rng << 13; _rng ^= _rng >> 17; _rng ^= _rng << 5;
  return (_rng >>> 0) / 0xffffffff;
}
function rr(a, b) { return a + rnd() * (b - a); }

function pickAlt() {
  let r = rnd(), cum = 0;
  for (const p of ALT_PROFILES) {
    cum += p.prob;
    if (r < cum) return p.alt + rr(-400, 400);
  }
  return 11000;
}

let _pool = null;
let _seq  = 1;

function buildPool() {
  const pool = [];
  for (const r of ROUTES) {
    for (let i = 0; i < r.n; i++) {
      const t   = rr(0.02, 0.98);
      const lat = r.o[0] + (r.d[0] - r.o[0]) * t + rr(-0.5, 0.5);
      const lon = r.o[1] + (r.d[1] - r.o[1]) * t + rr(-0.5, 0.5);
      const alt = pickAlt();
      const spd = rr(210, 280); // m/s

      const heading = Math.atan2(r.d[0] - r.o[0], r.d[1] - r.o[1]) * 180 / Math.PI;

      pool.push({
        icao24:   (_seq++).toString(16).padStart(6, '0'),
        callsign: r.pfx + Math.floor(rr(100, 999)),
        country:  r.ctry,
        lat, lon, alt, spd, heading,
        dlat: (r.d[0] - r.o[0]) / r.n * rr(0.007, 0.013),
        dlon: (r.d[1] - r.o[1]) / r.n * rr(0.007, 0.013),
        vrate: rr(-0.4, 0.4),
      });
    }
  }
  return pool;
}

export function getMockFlights() {
  if (!_pool) _pool = buildPool();

  _pool = _pool.map(f => {
    let lat = f.lat + f.dlat;
    let lon = f.lon + f.dlon;
    if (lon >  180) lon -= 360;
    if (lon < -180) lon += 360;
    if (lat >  85)  { lat =  85; }
    if (lat < -85)  { lat = -85; }
    return { ...f, lat, lon };
  });

  return _pool.map(f => ({
    icao24:       f.icao24,
    callsign:     f.callsign,
    country:      f.country,
    lat:          f.lat,
    lon:          f.lon,
    altitude:     f.alt,
    onGround:     false,
    velocity:     f.spd,
    heading:      f.heading,
    verticalRate: f.vrate,
    lastContact:  Date.now() / 1000,
    squawk:       null,
    posSource:    0,
  }));
}