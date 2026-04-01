/**
 * Planes — InstancedMesh of aircraft silhouettes.
 *
 * Each plane is oriented:
 *   local +Y → surface normal (away from globe)
 *   local +Z → heading direction (nose)
 *   local +X → right wing
 *
 * Clicking an instanced plane selects it; clicking empty globe deselects.
 */

import { useEffect, useRef } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useFlightStore } from '../../store/flightStore';
import { latLonAltToXYZ }  from '../../utils/geo';
import { altitudeHex }     from '../../utils/colors';

const MAX_INSTANCES = 650;
const MAX_SPEED_MS  = 350;
const DEG2RAD       = Math.PI / 180;

// Reusable scratch objects — never re-allocated in hot path
const _obj     = new THREE.Object3D();
const _col     = new THREE.Color();
const _norm    = new THREE.Vector3();
const _north   = new THREE.Vector3();
const _east    = new THREE.Vector3();
const _forward = new THREE.Vector3();
const _right   = new THREE.Vector3();
const _mat4    = new THREE.Matrix4();
const _quat    = new THREE.Quaternion();
const _raycaster = new THREE.Raycaster();
const _mouse     = new THREE.Vector2();
const _camDir    = new THREE.Vector3();

function easeInOut(t) { return t < 0.5 ? 2*t*t : -1+(4-2*t)*t; }
function speedScale(v) {
  if (!v || v <= 0) return 0.7;
  return 0.65 + Math.min(v / MAX_SPEED_MS, 1) * 0.85;
}

/** Top-down aircraft silhouette, nose → +Z, lying flat in XZ plane. */
function buildAircraftGeometry() {
  const s = 0.010;  // scale unit — wingspan ≈ 0.017

  const shape = new THREE.Shape();
  shape.moveTo(  0,       s*1.00);  // nose
  shape.lineTo(  s*0.12,  s*0.55);  // right fuselage fwd
  shape.lineTo(  s*0.82,  s*0.10);  // right wingtip LE
  shape.lineTo(  s*0.82, -s*0.06);  // right wingtip TE
  shape.lineTo(  s*0.12, -s*0.12);  // right wing root TE
  shape.lineTo(  s*0.28, -s*0.66);  // right stab tip LE
  shape.lineTo(  s*0.28, -s*0.80);  // right stab tip TE
  shape.lineTo(  s*0.06, -s*0.70);  // right stab root TE
  shape.lineTo(  s*0.04, -s*1.02);  // right tail
  shape.lineTo(  0,      -s*1.07);  // tail tip
  shape.lineTo( -s*0.04, -s*1.02);
  shape.lineTo( -s*0.06, -s*0.70);
  shape.lineTo( -s*0.28, -s*0.80);
  shape.lineTo( -s*0.28, -s*0.66);
  shape.lineTo( -s*0.12, -s*0.12);
  shape.lineTo( -s*0.82, -s*0.06);
  shape.lineTo( -s*0.82,  s*0.10);
  shape.lineTo( -s*0.12,  s*0.55);
  shape.closePath();

  const geo = new THREE.ShapeGeometry(shape, 2);
  geo.rotateX(-Math.PI / 2);  // XY → XZ plane so nose points +Z

  // White vertex colors so instanceColor multiplies through correctly
  const n = geo.attributes.position.count;
  geo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(n * 3).fill(1.0), 3));
  return geo;
}

/** Selected-plane pulse ring — simple circle Line. */
function buildRingGeometry() {
  const pts = [];
  const SEG = 32;
  for (let i = 0; i <= SEG; i++) {
    const a = (i / SEG) * Math.PI * 2;
    pts.push(new THREE.Vector3(Math.cos(a) * 0.022, 0, Math.sin(a) * 0.022));
  }
  return new THREE.BufferGeometry().setFromPoints(pts);
}

export function Planes() {
  const { scene, camera, gl } = useThree();
  const meshRef      = useRef(null);
  const ringRef      = useRef(null);
  const idxToId      = useRef([]);
  const pendingClick = useRef(null);

  // ── Build InstancedMesh ──────────────────────────────────
  useEffect(() => {
    const geometry = buildAircraftGeometry();
    const material = new THREE.MeshBasicMaterial({ vertexColors: true, toneMapped: false, side: THREE.DoubleSide });
    const mesh     = new THREE.InstancedMesh(geometry, material, MAX_INSTANCES);
    mesh.frustumCulled = false;

    const white = new THREE.Color(1, 1, 1);
    for (let i = 0; i < MAX_INSTANCES; i++) mesh.setColorAt(i, white);
    mesh.instanceColor.needsUpdate = true;

    _obj.scale.setScalar(0); _obj.updateMatrix();
    for (let i = 0; i < MAX_INSTANCES; i++) mesh.setMatrixAt(i, _obj.matrix);
    _obj.scale.setScalar(1);
    mesh.instanceMatrix.needsUpdate = true;
    mesh.count = 0;

    scene.add(mesh);
    meshRef.current = mesh;
    return () => { scene.remove(mesh); geometry.dispose(); material.dispose(); meshRef.current = null; };
  }, [scene]);

  // ── Build pulse ring ─────────────────────────────────────
  useEffect(() => {
    const geo = buildRingGeometry();
    const mat = new THREE.LineBasicMaterial({
      color: 0xFFFFFF, transparent: true, opacity: 0, depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const ring = new THREE.Line(geo, mat);
    ring.frustumCulled = false;
    ring.renderOrder   = 12;
    scene.add(ring);
    ringRef.current = ring;
    return () => { scene.remove(ring); geo.dispose(); mat.dispose(); ringRef.current = null; };
  }, [scene]);

  // ── Pointer → click detection ────────────────────────────
  useEffect(() => {
    const canvas = gl.domElement;
    let downTime = 0;
    const onDown = () => { downTime = Date.now(); };
    const onUp   = (e) => {
      if (Date.now() - downTime > 200) return; // was a drag, not a click
      const rect = canvas.getBoundingClientRect();
      pendingClick.current = {
        x:  ((e.clientX - rect.left) / rect.width)  * 2 - 1,
        y: -((e.clientY - rect.top)  / rect.height) * 2 + 1,
      };
    };
    canvas.addEventListener('pointerdown', onDown);
    canvas.addEventListener('pointerup',   onUp);
    return () => { canvas.removeEventListener('pointerdown', onDown); canvas.removeEventListener('pointerup', onUp); };
  }, [gl]);

  // ── Per-frame update ─────────────────────────────────────
  useFrame(() => {
    const mesh = meshRef.current;
    const ring = ringRef.current;
    if (!mesh) return;

    // Handle click
    if (pendingClick.current) {
      _mouse.set(pendingClick.current.x, pendingClick.current.y);
      pendingClick.current = null;
      _raycaster.setFromCamera(_mouse, camera);
      const hits = _raycaster.intersectObject(mesh);
      if (hits.length > 0) {
        const id = idxToId.current[hits[0].instanceId];
        if (id !== undefined) useFlightStore.getState().setSelectedId(id);
      } else {
        // Clicked empty space → deselect
        useFlightStore.getState().clearSelection();
      }
    }

    const { flights, selectedId, filteredIds } = useFlightStore.getState();
    const ids = filteredIds ?? Object.keys(flights);
    const now = Date.now();
    let slot  = 0;

    _camDir.copy(camera.position).normalize();

    // Pulse selected plane: oscillate scale between 1.3 and 2.0
    const selScale = 1.65 + 0.35 * Math.sin((now / 900) * Math.PI * 2);

    for (let i = 0; i < ids.length && slot < MAX_INSTANCES; i++) {
      const id = ids[i];
      const f  = flights[id];
      if (!f) continue;

      // Smooth interpolation
      const t   = easeInOut(Math.min((now - f.interpStart) / f.interpDuration, 1));
      const lat = f.prevLat + (f.lat - f.prevLat) * t;
      const lon = f.prevLon + (f.lon - f.prevLon) * t;
      const alt = (f.prevAlt ?? 0) + ((f.altitude ?? 0) - (f.prevAlt ?? 0)) * t;

      const [x, y, z] = latLonAltToXYZ(lat, lon, alt);

      // Back-face cull
      _norm.set(x, y, z).normalize();
      if (_norm.dot(_camDir) < 0.05) continue;

      // ── Heading-aware orientation ──────────────────────
      const phi = lat * DEG2RAD;
      const lam = lon * DEG2RAD;

      // North vector at this surface point
      _north.set(
        -Math.sin(phi) * Math.cos(lam),
         Math.cos(phi),
         Math.sin(phi) * Math.sin(lam)
      );

      // East = cross(north, normal)
      _east.crossVectors(_north, _norm);

      // Heading direction (0=N, 90=E, clockwise)
      const h = (f.heading ?? 0) * DEG2RAD;
      _forward.copy(_north).multiplyScalar(Math.cos(h))
              .addScaledVector(_east, Math.sin(h));

      // Build orthonormal basis: right / normal(up) / forward(nose)
      _right.crossVectors(_norm, _forward);
      _mat4.makeBasis(_right, _norm, _forward);
      _quat.setFromRotationMatrix(_mat4);
      // ── ──────────────────────────────────────────────────

      const scale = id === selectedId ? selScale : speedScale(f.velocity);
      _obj.position.set(x, y, z);
      _obj.scale.setScalar(scale);
      _obj.setRotationFromQuaternion(_quat);
      _obj.updateMatrix();
      mesh.setMatrixAt(slot, _obj.matrix);

      _col.set(id === selectedId ? '#FFFFFF' : altitudeHex(f.altitude));
      mesh.setColorAt(slot, _col);

      // Position pulse ring on selected plane
      if (ring && id === selectedId) {
        ring.position.set(x, y, z);
        ring.setRotationFromQuaternion(_quat);
        const ringPulse = 0.55 + 0.45 * Math.abs(Math.sin((now / 900) * Math.PI));
        ring.scale.setScalar(scale * ringPulse);
        ring.material.opacity = 0.35 + 0.35 * Math.abs(Math.sin((now / 900) * Math.PI));
      }

      idxToId.current[slot] = id;
      slot++;
    }

    // Hide ring if nothing selected
    if (ring && !selectedId) ring.material.opacity = 0;

    // Zero out unused slots
    _obj.position.setScalar(0); _obj.scale.setScalar(0); _obj.updateMatrix();
    for (let i = slot; i < MAX_INSTANCES; i++) mesh.setMatrixAt(i, _obj.matrix);
    _obj.scale.setScalar(1);

    mesh.count = slot;
    mesh.instanceMatrix.needsUpdate = true;
    mesh.instanceColor.needsUpdate  = true;
  });

  return null;
}