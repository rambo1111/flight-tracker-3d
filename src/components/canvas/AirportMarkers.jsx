/**
 * AirportMarkers — renders the 97 busiest airports as glowing dots.
 * Selected flight's departure / arrival airports glow brighter.
 */

import { useEffect, useRef } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { AIRPORTS }        from '../../api/airports';
import { useFlightStore }  from '../../store/flightStore';
import { latLonAltToXYZ }  from '../../utils/geo';

const AIRPORT_LIST = Object.entries(AIRPORTS); // [[icao, data], ...]
const COUNT        = AIRPORT_LIST.length;
const SURFACE_R    = 1.004; // just above surface, below flight arcs

const _obj    = new THREE.Object3D();
const _col    = new THREE.Color();
const DEFAULT_COLOR   = new THREE.Color(0.9, 0.85, 0.6);   // warm dim
const DEP_COLOR       = new THREE.Color(0.0, 1.0, 0.53);   // #00FF88 green
const ARR_COLOR       = new THREE.Color(1.0, 0.42, 0.21);  // #FF6B35 orange
const HOVER_COLOR     = new THREE.Color(1.0, 0.9,  0.0);   // accent yellow

export function AirportMarkers() {
  const { scene } = useThree();
  const meshRef   = useRef(null);

  useEffect(() => {
    const geo = new THREE.CircleGeometry(0.004, 6); // hexagonal dot
    geo.rotateX(-Math.PI / 2); // face up (lie flat on surface)
    const mat = new THREE.MeshBasicMaterial({ toneMapped: false, side: THREE.DoubleSide });
    const mesh = new THREE.InstancedMesh(geo, mat, COUNT);
    mesh.frustumCulled = false;
    mesh.renderOrder   = 6;

    // Pre-place all airports
    for (let i = 0; i < COUNT; i++) {
      const [, apt] = AIRPORT_LIST[i];
      const [x, y, z] = latLonAltToXYZ(apt.lat, apt.lon, 0);
      const nx = x / Math.sqrt(x*x+y*y+z*z);
      const ny = y / Math.sqrt(x*x+y*y+z*z);
      const nz = z / Math.sqrt(x*x+y*y+z*z);
      _obj.position.set(nx * SURFACE_R, ny * SURFACE_R, nz * SURFACE_R);

      // Orient the disk to face outward (align local Y with surface normal)
      const norm = new THREE.Vector3(nx, ny, nz);
      const up   = new THREE.Vector3(0, 1, 0);
      const q    = new THREE.Quaternion().setFromUnitVectors(up, norm);
      _obj.setRotationFromQuaternion(q);
      _obj.scale.setScalar(1);
      _obj.updateMatrix();
      mesh.setMatrixAt(i, _obj.matrix);
      mesh.setColorAt(i, DEFAULT_COLOR);
    }
    mesh.instanceMatrix.needsUpdate = true;
    mesh.instanceColor.needsUpdate  = true;

    scene.add(mesh);
    meshRef.current = mesh;
    return () => { scene.remove(mesh); geo.dispose(); mat.dispose(); meshRef.current = null; };
  }, [scene]);

  // Update colors when selection changes
  useFrame(() => {
    const mesh = meshRef.current;
    if (!mesh) return;

    const { selectedId, flights } = useFlightStore.getState();
    const f   = selectedId ? flights[selectedId] : null;
    const dep = f?.departure?.toUpperCase() ?? null;
    const arr = f?.arrival?.toUpperCase()   ?? null;

    let dirty = false;
    for (let i = 0; i < COUNT; i++) {
      const [icao] = AIRPORT_LIST[i];
      if (icao === dep)       { mesh.setColorAt(i, DEP_COLOR);  dirty = true; }
      else if (icao === arr)  { mesh.setColorAt(i, ARR_COLOR);  dirty = true; }
      else                    { mesh.setColorAt(i, DEFAULT_COLOR); dirty = true; }
    }
    if (dirty) mesh.instanceColor.needsUpdate = true;
  });

  return null;
}