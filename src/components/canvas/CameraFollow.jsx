import { useRef }             from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE             from 'three';
import { useFlightStore }     from '../../store/flightStore';
import { latLonAltToXYZ }    from '../../utils/geo';

const _target    = new THREE.Vector3();
const _current   = new THREE.Vector3();
const _targetDir = new THREE.Vector3();
const _currentDir= new THREE.Vector3();

const LERP_SPEED = 0.04;
const SETTLE_DOT = 0.9998;

const DEFAULT_POS = new THREE.Vector3(0, 0.7, 2.7); // matches Scene camera

export function CameraFollow() {
  const { camera }   = useThree();
  const lastIdRef    = useRef(null);
  const followingRef = useRef(false);
  const lastResetRef = useRef(0);

  useFrame(() => {
    const { selectedId, flights, cameraResetAt } = useFlightStore.getState();

    // R key camera reset
    if (cameraResetAt > lastResetRef.current) {
      lastResetRef.current = cameraResetAt;
      followingRef.current = false;
      _target.copy(DEFAULT_POS).normalize().multiplyScalar(camera.position.length());
      camera.position.lerp(_target, 0.06);
      camera.lookAt(0, 0, 0);
      return;
    }

    if (!selectedId || !flights[selectedId]) {
      lastIdRef.current = null; followingRef.current = false;
      return;
    }

    if (selectedId !== lastIdRef.current) {
      lastIdRef.current    = selectedId;
      followingRef.current = true;
    }

    if (!followingRef.current) return;

    const f = flights[selectedId];
    const [x, y, z] = latLonAltToXYZ(f.lat, f.lon, f.altitude ?? 0);
    _targetDir.set(x, y, z).normalize();

    const dist = camera.position.length();
    _currentDir.copy(camera.position).normalize();

    if (_currentDir.dot(_targetDir) >= SETTLE_DOT) {
      followingRef.current = false;
      return;
    }

    _current.copy(_currentDir);
    _target.copy(_targetDir);
    _current.lerp(_target, LERP_SPEED).normalize();

    camera.position.copy(_current).multiplyScalar(dist);
    camera.lookAt(0, 0, 0);
  });

  return null;
}