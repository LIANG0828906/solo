import { useRef, useEffect } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import {
  OrbitControls,
  EffectComposer,
  Bloom,
  Stars,
} from '@react-three/drei';
import * as THREE from 'three';
import { GeometrySculpture } from './GeometrySculpture';
import { SceneLights } from './SceneLights';
import { useGeometryStore, selectEnabledGeometries } from '@/store/geometryStore';
import { SCENE_CONSTANTS, COLORS } from '@/utils/constants';

interface CameraControllerProps {
  children?: React.ReactNode;
}

function CameraController({ children }: CameraControllerProps) {
  const { camera } = useThree();

  useEffect(() => {
    camera.position.set(0, 4, SCENE_CONSTANTS.CAMERA_DISTANCE);
    camera.lookAt(0, 0, 0);
  }, [camera]);

  return <>{children}</>;
}

interface SceneContentProps {
  audioAnalyzerRef: React.MutableRefObject<unknown | null>;
}

function SceneContent({ audioAnalyzerRef }: SceneContentProps) {
  const geometries = useGeometryStore(selectEnabledGeometries);

  audioAnalyzerRef;

  return (
    <>
      <SceneLights />

      <Stars
        radius={100}
        depth={50}
        count={3000}
        factor={4}
        saturation={0}
        fade
        speed={0.5}
      />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -3, 0]} receiveShadow>
        <circleGeometry args={[20, 64]} />
        <meshStandardMaterial
          color={COLORS.BACKGROUND}
          transparent
          opacity={0.8}
        />
      </mesh>

      {geometries.map((config) => (
        <GeometrySculpture key={config.id} config={config} />
      ))}

      <OrbitControls
        enablePan={false}
        enableZoom={true}
        minDistance={4}
        maxDistance={20}
        minPolarAngle={SCENE_CONSTANTS.MIN_POLAR_ANGLE}
        maxPolarAngle={SCENE_CONSTANTS.MAX_POLAR_ANGLE}
        dampingFactor={0.05}
        enableDamping={true}
        target={[0, 0, 0]}
      />

      <EffectComposer>
        <Bloom
          luminanceThreshold={SCENE_CONSTANTS.BLOOM_THRESHOLD}
          luminanceSmoothing={0.9}
          intensity={SCENE_CONSTANTS.BLOOM_STRENGTH}
          radius={SCENE_CONSTANTS.BLOOM_RADIUS}
          mipmapBlur
        />
      </EffectComposer>
    </>
  );
}

interface Scene3DProps {
  audioAnalyzerRef: React.MutableRefObject<unknown | null>;
}

export function Scene3D({ audioAnalyzerRef }: Scene3DProps) {
  return (
    <Canvas
      camera={{
        fov: SCENE_CONSTANTS.CAMERA_FOV,
        near: SCENE_CONSTANTS.CAMERA_NEAR,
        far: SCENE_CONSTANTS.CAMERA_FAR,
      }}
      gl={{
        antialias: true,
        alpha: false,
        powerPreference: 'high-performance',
      }}
      dpr={[1, 2]}
      style={{ background: COLORS.BACKGROUND }}
      frameloop="demand"
    >
      <CameraController>
        <color attach="background" args={[COLORS.BACKGROUND]} />
        <fog attach="fog" args={[COLORS.BACKGROUND, 10, 40]} />
        <SceneContent audioAnalyzerRef={audioAnalyzerRef} />
      </CameraController>
    </Canvas>
  );
}
