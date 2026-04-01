/**
 * Earth — textured globe with two atmosphere layers.
 *
 * Texture streamed from unpkg (three-globe CDN) — no local file needed.
 * A solid fallback sphere renders instantly while the texture loads.
 */

import { Suspense, useMemo } from 'react';
import { useTexture }        from '@react-three/drei';
import * as THREE            from 'three';
import { EARTH_RADIUS }      from '../../utils/geo';

const DAY_URL   = 'https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg';
const NIGHT_URL = 'https://unpkg.com/three-globe/example/img/earth-night.jpg';

// Sun direction: matches key light position [4, 3, 4] in Scene.jsx
const SUN_DIR = new THREE.Vector3(4, 3, 4).normalize();

const VERT = /* glsl */`
  varying vec3 vWorldNormal;
  varying vec2 vUv;
  void main() {
    vUv          = uv;
    vWorldNormal = normalize(mat3(modelMatrix) * normal);
    gl_Position  = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const FRAG = /* glsl */`
  uniform sampler2D dayTexture;
  uniform sampler2D nightTexture;
  uniform vec3      sunDirection;

  varying vec3 vWorldNormal;
  varying vec2 vUv;

  void main() {
    vec4  day   = texture2D(dayTexture,   vUv);
    vec4  night = texture2D(nightTexture, vUv);

    // dot > 0 → facing sun (day), dot < 0 → away from sun (night)
    float d     = dot(normalize(vWorldNormal), sunDirection);
    // smoothstep creates a soft twilight band between -0.15 and 0.25
    float blend = smoothstep(-0.15, 0.25, d);

    // City lights glow slightly even into the twilight zone
    vec4 nightGlow = night * vec4(1.4, 1.2, 1.0, 1.0);

    gl_FragColor = mix(nightGlow, day, blend);
  }
`;

function EarthMesh() {
  const [dayTex, nightTex] = useTexture([DAY_URL, NIGHT_URL]);

  dayTex.anisotropy   = nightTex.anisotropy   = 8;
  dayTex.colorSpace   = nightTex.colorSpace   = THREE.SRGBColorSpace;

  const uniforms = useMemo(() => ({
    dayTexture:   { value: dayTex   },
    nightTexture: { value: nightTex },
    sunDirection: { value: SUN_DIR  },
  }), [dayTex, nightTex]);

  return (
    <group>
      {/* Globe with day/night shader */}
      <mesh renderOrder={0}>
        <sphereGeometry args={[EARTH_RADIUS, 72, 72]} />
        <shaderMaterial
          uniforms={uniforms}
          vertexShader={VERT}
          fragmentShader={FRAG}
        />
      </mesh>

      {/* Inner atmosphere haze */}
      <mesh renderOrder={1}>
        <sphereGeometry args={[EARTH_RADIUS * 1.013, 48, 48]} />
        <meshPhongMaterial color={0x4499ff} transparent opacity={0.055} side={THREE.BackSide} depthWrite={false} />
      </mesh>

      {/* Outer glow */}
      <mesh renderOrder={2}>
        <sphereGeometry args={[EARTH_RADIUS * 1.06, 32, 32]} />
        <meshPhongMaterial color={0x1133aa} transparent opacity={0.02} side={THREE.BackSide} depthWrite={false} />
      </mesh>
    </group>
  );
}

function EarthFallback() {
  return (
    <mesh>
      <sphereGeometry args={[EARTH_RADIUS, 32, 32]} />
      <meshPhongMaterial color={0x123a6a} />
    </mesh>
  );
}

export function Earth() {
  return (
    <Suspense fallback={<EarthFallback />}>
      <EarthMesh />
    </Suspense>
  );
}