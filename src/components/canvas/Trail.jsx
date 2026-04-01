import { useEffect, useRef } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useFlightStore } from '../../store/flightStore';
import { latLonAltToXYZ } from '../../utils/geo';

const MAX_TRAIL = 28;

export function Trail() {
  const { scene } = useThree();
  const lineRef   = useRef(null);

  useEffect(() => {
    const positions = new Float32Array(MAX_TRAIL * 3);
    const colors    = new Float32Array(MAX_TRAIL * 3);

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3).setUsage(THREE.DynamicDrawUsage));
    geometry.setAttribute('color',    new THREE.BufferAttribute(colors,    3).setUsage(THREE.DynamicDrawUsage));
    geometry.setDrawRange(0, 0);

    const material = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent:  true,
      opacity:      0.92,
      linewidth:    1,
      depthWrite:   false,
      blending:     THREE.AdditiveBlending,
    });

    const line = new THREE.Line(geometry, material);
    line.frustumCulled = false;
    line.renderOrder   = 10;
    scene.add(line);
    lineRef.current = line;

    return () => {
      scene.remove(line);
      geometry.dispose();
      material.dispose();
      lineRef.current = null;
    };
  }, [scene]);

  useFrame(() => {
    const line = lineRef.current;
    if (!line) return;

    const { trail, selectedId, flights } = useFlightStore.getState();

    if (!selectedId || trail.length < 2) {
      line.geometry.setDrawRange(0, 0);
      return;
    }

    const f      = flights[selectedId];
    const allPts = f
      ? [...trail, { lat: f.lat, lon: f.lon, alt: f.altitude }]
      : [...trail];

    const count   = Math.min(allPts.length, MAX_TRAIL);
    const posAttr = line.geometry.attributes.position;
    const colAttr = line.geometry.attributes.color;

    for (let i = 0; i < count; i++) {
      const pt    = allPts[allPts.length - count + i];
      const [x, y, z] = latLonAltToXYZ(pt.lat, pt.lon, pt.alt);
      const a     = i / (count - 1); // 0 = tail, 1 = head

      posAttr.setXYZ(i, x, y, z);                          // ← FIX: was called twice
      colAttr.setXYZ(i, a * 1.0, a * 0.9, a * 0.1);       // gold fade
    }

    posAttr.needsUpdate = true;
    colAttr.needsUpdate = true;
    line.geometry.setDrawRange(0, count);
  });

  return null;
}