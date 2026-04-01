import { Canvas }                from '@react-three/fiber';
import { OrbitControls, Stars }  from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { Earth }           from './Earth';
import { Planes }          from './Planes';
import { Trail }           from './Trail';
import { FlightPath }      from './FlightPath';
import { AirportMarkers }  from './AirportMarkers';
import { CameraFollow }    from './CameraFollow';

export function Scene() {
  return (
    <Canvas
      camera={{ position: [0, 0.7, 2.7], fov: 44, near: 0.01, far: 500 }}
      gl={{ antialias: true, powerPreference: 'high-performance', alpha: false, stencil: false }}
      dpr={[1, 2]}
      style={{ background: '#02020E' }}
    >
      <directionalLight position={[4, 3, 4]}    intensity={1.5}  color={0xfff8ee} />
      <directionalLight position={[-4, -2, -3]} intensity={0.18} color={0x224488} />
      <ambientLight intensity={0.22} />

      <Stars radius={90} depth={55} count={6500} factor={4.2} saturation={0.4} fade speed={0.2} />

      <Earth />
      <AirportMarkers />
      <FlightPath />
      <Trail />
      <Planes />
      <CameraFollow />

      <OrbitControls
        enablePan={false}
        enableDamping
        dampingFactor={0.055}
        rotateSpeed={0.45}
        zoomSpeed={0.55}
        minDistance={1.35}
        maxDistance={7}
      />

      <EffectComposer multisampling={4}>
        <Bloom intensity={0.6} luminanceThreshold={0.55} luminanceSmoothing={0.35} mipmapBlur />
      </EffectComposer>
    </Canvas>
  );
}
