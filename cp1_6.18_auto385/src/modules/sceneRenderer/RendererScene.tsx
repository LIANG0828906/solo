import React, { useMemo, useRef, useEffect, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { useStore, MaterialType } from '@/store/useStore';

const MAX_DISPLACEMENT = 2;

const materialConfigs: Record<MaterialType, {
  roughness: number;
  metalness: number;
  transparent?: boolean;
  opacity?: number;
  color: string;
}> = {
  matte: { roughness: 0.8, metalness: 0.1, color: '#C8C8C8' },
  metal: { roughness: 0.3, metalness: 0.8, color: '#B8B8B8' },
  glass: { roughness: 0.1, metalness: 0.0, transparent: true, opacity: 0.6, color: '#D8E8FF' },
};

interface SculptMeshProps {
  depthMap: number[] | null;
  depthWidth: number;
  depthHeight: number;
  bumpStrength: number;
  material: MaterialType;
}

const SculptMesh: React.FC<SculptMeshProps> = ({
  depthMap,
  depthWidth,
  depthHeight,
  bumpStrength,
  material,
}) => {
  const meshRef = useRef<THREE.Mesh>(null);

  const { segmentsW, segmentsH, geometry, aspect } = useMemo(() => {
    const w = Math.max(50, depthWidth || 50);
    const h = Math.max(50, depthHeight || 50);
    const geo = new THREE.PlaneGeometry(4, 4, w - 1, h - 1);
    const aspect = w / h;
    const sw = w;
    const sh = h;
    return { segmentsW: sw, segmentsH: sh, geometry: geo, aspect };
  }, [depthWidth, depthHeight]);

  useEffect(() => {
    if (!depthMap || depthMap.length === 0 || !geometry) return;

    const positions = geometry.attributes.position as THREE.BufferAttribute;
    const count = positions.count;
    const expectedCount = segmentsW * segmentsH;

    for (let i = 0; i < count && i < depthMap.length && i < expectedCount; i++) {
      const depthValue = depthMap[i] ?? 0;
      const z = (depthValue / 255) * MAX_DISPLACEMENT;
      positions.setZ(i, z);
    }

    positions.needsUpdate = true;
    geometry.computeVertexNormals();
  }, [depthMap, segmentsW, segmentsH, geometry]);

  const matConfig = materialConfigs[material];

  return (
    <mesh
      ref={meshRef}
      rotation={[-Math.PI / 2, 0, 0]}
      scale={[aspect >= 1 ? 1 : aspect, 1, bumpStrength]}
      castShadow
      receiveShadow
      geometry={geometry}
    >
      <meshStandardMaterial
        color={matConfig.color}
        roughness={matConfig.roughness}
        metalness={matConfig.metalness}
        transparent={matConfig.transparent || false}
        opacity={matConfig.opacity ?? 1}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
};

const AmbientLightAnimator: React.FC = () => {
  const lightRef = useRef<THREE.AmbientLight>(null);
  useFrame((state) => {
    if (!lightRef.current) return;
    const t = state.clock.elapsedTime;
    const period = 8;
    const phase = (t % period) / period;
    const warm = new THREE.Color('#FFF5E0');
    const cool = new THREE.Color('#E0F0FF');
    const ratio = 0.5 - 0.5 * Math.cos(phase * Math.PI * 2);
    const color = warm.clone().lerp(cool, ratio);
    lightRef.current.color = color;
  });
  return <ambientLight ref={lightRef} intensity={0.35} />;
};

const DirectionalLightWithTarget: React.FC<{
  position: [number, number, number];
  intensity: number;
  lightX: number;
  lightY: number;
  isMain: boolean;
}> = ({ position, intensity, lightX, lightY, isMain }) => {
  const lightRef = useRef<THREE.DirectionalLight>(null);

  useFrame(() => {
    if (!lightRef.current) return;
    const basePos = [...position] as [number, number, number];
    if (isMain) {
      basePos[0] = 5 * Math.sign(lightX || 1) * (0.5 + Math.abs(lightX) * 0.5);
      basePos[1] = 3 + 4 * lightY;
    } else {
      basePos[0] = -5 * Math.sign(lightX || -1) * (0.5 + Math.abs(lightX) * 0.5);
      basePos[1] = 3 - 4 * lightY;
    }
    lightRef.current.position.set(basePos[0], basePos[1], basePos[2]);
  });

  return (
    <directionalLight
      ref={lightRef}
      position={position}
      intensity={intensity}
      castShadow
      shadow-mapSize-width={1024}
      shadow-mapSize-height={1024}
    />
  );
};

const FpsTracker: React.FC = () => {
  const setFps = useStore((s) => s.setFps);
  const framesRef = useRef(0);
  const timeRef = useRef(performance.now());

  useFrame(() => {
    framesRef.current++;
    const now = performance.now();
    const elapsed = now - timeRef.current;
    if (elapsed >= 500) {
      const fps = Math.round((framesRef.current * 1000) / elapsed);
      setFps(fps);
      framesRef.current = 0;
      timeRef.current = now;
    }
  });
  return null;
};

interface SceneProps {
  depthMap: number[] | null;
  depthWidth: number;
  depthHeight: number;
  bumpStrength: number;
  lightX: number;
  lightY: number;
  material: MaterialType;
}

const InnerScene: React.FC<SceneProps> = (props) => {
  return (
    <>
      <FpsTracker />
      <color attach="background" args={['#0F0F1E']} />
      <fog attach="fog" args={['#0F0F1E', 8, 22]} />

      <AmbientLightAnimator />
      <DirectionalLightWithTarget
        position={[5, 7, 5]}
        intensity={1.0}
        lightX={props.lightX}
        lightY={props.lightY}
        isMain={true}
      />
      <DirectionalLightWithTarget
        position={[-5, 2, -5]}
        intensity={0.4}
        lightX={props.lightX}
        lightY={props.lightY}
        isMain={false}
      />

      <Suspense fallback={null}>
        <SculptMesh
          depthMap={props.depthMap}
          depthWidth={props.depthWidth}
          depthHeight={props.depthHeight}
          bumpStrength={props.bumpStrength}
          material={props.material}
        />
      </Suspense>

      <OrbitControls
        enableDamping
        dampingFactor={0.08}
        minDistance={3}
        maxDistance={15}
        target={[0, 0, 0]}
      />

      <gridHelper args={[20, 40, '#00D4FF33', '#00D4FF11']} position={[0, -0.1, 0]} />
    </>
  );
};

const RendererScene: React.FC = () => {
  const { depthMap, depthWidth, depthHeight, bumpStrength, lightX, lightY, material } = useStore();

  return (
    <Canvas
      shadows
      camera={{ position: [3, 4, 6], fov: 45 }}
      gl={{ antialias: true, preserveDrawingBuffer: true, powerPreference: 'high-performance' }}
      dpr={[1, 2]}
    >
      <InnerScene
        depthMap={depthMap}
        depthWidth={depthWidth}
        depthHeight={depthHeight}
        bumpStrength={bumpStrength}
        lightX={lightX}
        lightY={lightY}
        material={material}
      />
    </Canvas>
  );
};

export default RendererScene;
