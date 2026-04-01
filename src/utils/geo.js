/**
 * Geographic utilities for mapping lat/lon/altitude → Three.js 3D coordinates.
 *
 * Coordinate convention is derived from Three.js SphereGeometry UV mapping:
 *   x = r · cos(lat) · cos(lon)   // prime meridian (lon=0) faces +X
 *   y = r · sin(lat)               // north pole at +Y
 *   z = −r · cos(lat) · sin(lon)  // 90°W faces +Z (towards default camera)
 *
 * This ensures plane positions are pixel-perfect aligned with the Earth texture.
 */

export const EARTH_RADIUS        = 1.0;
export const MAX_ALTITUDE_M      = 13_000; // meters — practical ceiling
export const MAX_ALTITUDE_OFFSET = 0.12;   // fraction of EARTH_RADIUS at MAX_ALTITUDE

/**
 * Convert geographic coordinates + altitude → Three.js [x, y, z].
 *
 * @param {number} lat       Latitude  in degrees (−90 … 90)
 * @param {number} lon       Longitude in degrees (−180 … 180)
 * @param {number} altMeters Geometric/barometric altitude in metres (≥ 0)
 * @returns {[number, number, number]}
 */
export function latLonAltToXYZ(lat, lon, altMeters = 0) {
  const safeAlt    = Math.max(0, altMeters || 0);
  const altFrac    = Math.min(safeAlt / MAX_ALTITUDE_M, 1);
  const r          = EARTH_RADIUS + altFrac * MAX_ALTITUDE_OFFSET;

  const φ = (lat * Math.PI) / 180; // latitude  → phi
  const λ = (lon * Math.PI) / 180; // longitude → lambda

  return [
     r * Math.cos(φ) * Math.cos(λ),  // x
     r * Math.sin(φ),                  // y
    -r * Math.cos(φ) * Math.sin(λ),  // z
  ];
}

/**
 * Normalised altitude fraction [0, 1] for visual encoding.
 */
export function altitudeFraction(altMeters) {
  return Math.min(Math.max((altMeters || 0) / MAX_ALTITUDE_M, 0), 1);
}
