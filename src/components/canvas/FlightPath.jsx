/**
 * FlightPath — draws:
 *  1. Great-circle arc from departure → current position → arrival
 *  2. Small dot markers at departure & arrival airports
 *
 * Only visible when a flight with a known departure AND arrival is selected.
 */

import { useEffect, useRef } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useFlightStore }  from '../../store/flightStore';
import { lookupAirport }   from '../../api/airports';
import { latLonAltToXYZ, EARTH_RADIUS } from '../../utils/geo';

const ARC_SEGS   = 80;   // points per arc segment
const ARC_HEIGHT = 1.006; // slightly above surface

function greatCirclePoints(v0, v1, segs) {
  const pts = [];
  for (let i = 0; i <= segs; i++) {
    const t = i / segs;
    // lerp + normalize = slerp approximation, perfect for visualization
    const v = new THREE.Vector3().lerpVectors(v0, v1, t).normalize().multiplyScalar(ARC_HEIGHT);
    pts.push(v.x, v.y, v.z);
  }
  return new Float32Array(pts);
}

function airportVec(apt) {
  const [x, y, z] = latLonAltToXYZ(apt.lat, apt.lon, 0);
  return new THREE.Vector3(x, y, z).normalize().multiplyScalar(ARC_HEIGHT);
}

export function FlightPath() {
  const { scene } = useThree();

  // Flown arc (dep → current): white/yellow
  const flownRef = useRef(null);
  // Remaining arc (current → arr): dim blue
  const remainRef = useRef(null);
  // Dep/arr marker dots
  const markersRef = useRef(null);

  useEffect(() => {
    function makeLine(maxPts, color, opacity, dashed = false) {
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(maxPts * 3), 3));
      geo.setDrawRange(0, 0);
      const mat = new THREE.LineBasicMaterial({
        color, transparent: true, opacity, depthWrite: false,
        blending: THREE.AdditiveBlending,
      });
      const line = new THREE.Line(geo, mat);
      line.frustumCulled = false;
      line.renderOrder   = 8;
      return line;
    }

    const flown  = makeLine(ARC_SEGS + 1, 0xFFE500, 0.80);
    const remain = makeLine(ARC_SEGS + 1, 0x80CFFF, 0.40);

    // Two small sphere markers (dep green, arr orange)
    const markerGeo = new THREE.SphereGeometry(0.006, 8, 8);
    const markerMat = new THREE.MeshBasicMaterial({ color: 0xFFFFFF, toneMapped: false });
    const markers   = new THREE.InstancedMesh(markerGeo, markerMat, 2);
    markers.frustumCulled = false;
    markers.renderOrder   = 9;
    markers.count = 0;

    scene.add(flown, remain, markers);
    flownRef.current   = flown;
    remainRef.current  = remain;
    markersRef.current = markers;

    return () => {
      scene.remove(flown, remain, markers);
      [flown, remain].forEach(l => { l.geometry.dispose(); l.material.dispose(); });
      markerGeo.dispose(); markerMat.dispose();
      flownRef.current = remainRef.current = markersRef.current = null;
    };
  }, [scene]);

  useFrame(() => {
    const flown   = flownRef.current;
    const remain  = remainRef.current;
    const markers = markersRef.current;
    if (!flown || !remain || !markers) return;

    const { selectedId, flights } = useFlightStore.getState();

    if (!selectedId) {
      flown.geometry.setDrawRange(0, 0);
      remain.geometry.setDrawRange(0, 0);
      markers.count = 0;
      return;
    }

    const f   = flights[selectedId];
    const dep = f?.departure ? lookupAirport(f.departure) : null;
    const arr = f?.arrival   ? lookupAirport(f.arrival)   : null;

    if (!dep && !arr) {
      flown.geometry.setDrawRange(0, 0);
      remain.geometry.setDrawRange(0, 0);
      markers.count = 0;
      return;
    }

    // Current position as normalized vector
    const [cx, cy, cz] = latLonAltToXYZ(f.lat, f.lon, f.altitude ?? 0);
    const curVec = new THREE.Vector3(cx, cy, cz).normalize().multiplyScalar(ARC_HEIGHT);

    const obj = new THREE.Object3D();
    let mSlot = 0;

    // ── Flown arc: dep → current ─────────────────────────
    if (dep) {
      const depVec = airportVec(dep);
      const pts    = greatCirclePoints(depVec, curVec, ARC_SEGS);
      flown.geometry.attributes.position.array.set(pts);
      flown.geometry.attributes.position.needsUpdate = true;
      flown.geometry.setDrawRange(0, ARC_SEGS + 1);

      // Dep marker (green dot)
      obj.position.copy(depVec);
      obj.scale.setScalar(1);
      obj.updateMatrix();
      markers.setMatrixAt(mSlot, obj.matrix);
      markers.setColorAt(mSlot, new THREE.Color(0x00FF88));
      mSlot++;
    } else {
      flown.geometry.setDrawRange(0, 0);
    }

    // ── Remaining arc: current → arrival ─────────────────
    if (arr) {
      const arrVec = airportVec(arr);
      const pts    = greatCirclePoints(curVec, arrVec, ARC_SEGS);
      remain.geometry.attributes.position.array.set(pts);
      remain.geometry.attributes.position.needsUpdate = true;
      remain.geometry.setDrawRange(0, ARC_SEGS + 1);

      // Arr marker (orange dot)
      obj.position.copy(arrVec);
      obj.scale.setScalar(1);
      obj.updateMatrix();
      markers.setMatrixAt(mSlot, obj.matrix);
      markers.setColorAt(mSlot, new THREE.Color(0xFF6B35));
      mSlot++;
    } else {
      remain.geometry.setDrawRange(0, 0);
    }

    markers.count = mSlot;
    if (mSlot > 0) {
      markers.instanceMatrix.needsUpdate = true;
      markers.instanceColor.needsUpdate  = true;
    }
  });

  return null;
}