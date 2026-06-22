import { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import * as THREE from 'three';
import { useStore } from '../store/useStore';
import {
  MaterialType,
  MATERIAL_PRESETS,
  getSunPosition,
  getSunColor,
} from '../utils/materialConfig';

interface SculptureProps {
  offsetX: number;
  params: {
    materialType: MaterialType;
    roughness: number;
    metalness: number;
    envIntensity: number;
  };
}

function Sculpture({ offsetX, params }: SculptureProps) {
  const groupRef = useRef<THREE.Group>(null);
  const materialRefs = useRef<THREE.MeshPhysicalMaterial[]>([]);

  const targetRoughness = useRef(params.roughness);
  const targetMetalness = useRef(params.metalness);
  const targetColor = useRef(new THREE.Color(MATERIAL_PRESETS[params.materialType].color));
  const targetOpacity = useRef(MATERIAL_PRESETS[params.materialType].opacity ?? 1);
  const targetTransmission = useRef(MATERIAL_PRESETS[params.materialType].transmission ?? 0);

  useEffect(() => {
    targetRoughness.current = params.roughness;
    targetMetalness.current = params.metalness;
    targetColor.current.set(MATERIAL_PRESETS[params.materialType].color);
    targetOpacity.current = MATERIAL_PRESETS[params.materialType].opacity ?? 1;
    targetTransmission.current = MATERIAL_PRESETS[params.materialType].transmission ?? 0;
  }, [params]);

  useFrame((_, delta) => {
    const lerpFactor = Math.min(delta * 4, 1);
    materialRefs.current.forEach((mat) => {
      if (mat) {
        mat.roughness = THREE.MathUtils.lerp(mat.roughness, targetRoughness.current, lerpFactor);
        mat.metalness = THREE.MathUtils.lerp(mat.metalness, targetMetalness.current, lerpFactor);
        mat.color.lerp(targetColor.current, lerpFactor);
        mat.opacity = THREE.MathUtils.lerp(mat.opacity, targetOpacity.current, lerpFactor);
        if (mat.transmission !== undefined) {
          mat.transmission = THREE.MathUtils.lerp(
            mat.transmission,
            targetTransmission.current,
            lerpFactor,
          );
        }
        mat.envMapIntensity = params.envIntensity;
        mat.needsUpdate = true;
      }
    });
  });

  const preset = MATERIAL_PRESETS[params.materialType];
  const isTransparent = preset.transparent ?? false;

  const registerMat = (ref: THREE.MeshPhysicalMaterial | null) => {
    if (ref && !materialRefs.current.includes(ref)) {
      materialRefs.current.push(ref);
    }
  };

  return (
    <group ref={groupRef} position={[offsetX, 0, 0]}>
      <mesh position={[0, 0, 0]} receiveShadow castShadow>
        <cylinderGeometry args={[0.3, 0.4, 0.3, 32]} />
        <meshPhysicalMaterial
          ref={registerMat}
          color={preset.color}
          roughness={preset.roughness}
          metalness={preset.metalness}
          transparent={isTransparent}
          opacity={preset.opacity ?? 1}
          transmission={preset.transmission ?? 0}
          ior={preset.ior ?? 1.5}
          thickness={0.5}
          envMapIntensity={params.envIntensity}
        />
      </mesh>

      <mesh position={[0, 0.8, 0]} receiveShadow castShadow>
        <sphereGeometry args={[0.6, 64, 64]} />
        <meshPhysicalMaterial
          ref={registerMat}
          color={preset.color}
          roughness={preset.roughness}
          metalness={preset.metalness}
          transparent={isTransparent}
          opacity={preset.opacity ?? 1}
          transmission={preset.transmission ?? 0}
          ior={preset.ior ?? 1.5}
          thickness={0.5}
          envMapIntensity={params.envIntensity}
        />
      </mesh>

      <mesh position={[0.7, 0.5, 0]} rotation={[0, 0, Math.PI / 6]} receiveShadow castShadow>
        <boxGeometry args={[0.5, 0.5, 0.5]} />
        <meshPhysicalMaterial
          ref={registerMat}
          color={preset.color}
          roughness={preset.roughness}
          metalness={preset.metalness}
          transparent={isTransparent}
          opacity={preset.opacity ?? 1}
          transmission={preset.transmission ?? 0}
          ior={preset.ior ?? 1.5}
          thickness={0.5}
          envMapIntensity={params.envIntensity}
        />
      </mesh>

      <mesh position={[-0.6, 0.7, 0.3]} rotation={[Math.PI / 3, 0, 0]} receiveShadow castShadow>
        <torusGeometry args={[0.3, 0.08, 32, 64]} />
        <meshPhysicalMaterial
          ref={registerMat}
          color={preset.color}
          roughness={preset.roughness}
          metalness={preset.metalness}
          transparent={isTransparent}
          opacity={preset.opacity ?? 1}
          transmission={preset.transmission ?? 0}
          ior={preset.ior ?? 1.5}
          thickness={0.5}
          envMapIntensity={params.envIntensity}
        />
      </mesh>

      <mesh position={[0, 1.5, 0]} receiveShadow castShadow>
        <cylinderGeometry args={[0.1, 0.1, 0.8, 32]} />
        <meshPhysicalMaterial
          ref={registerMat}
          color={preset.color}
          roughness={preset.roughness}
          metalness={preset.metalness}
          transparent={isTransparent}
          opacity={preset.opacity ?? 1}
          transmission={preset.transmission ?? 0}
          ior={preset.ior ?? 1.5}
          thickness={0.5}
          envMapIntensity={params.envIntensity}
        />
      </mesh>

      <mesh position={[0, 2.0, 0]} receiveShadow castShadow>
        <icosahedronGeometry args={[0.25, 1]} />
        <meshPhysicalMaterial
          ref={registerMat}
          color={preset.color}
          roughness={preset.roughness}
          metalness={preset.metalness}
          transparent={isTransparent}
          opacity={preset.opacity ?? 1}
          transmission={preset.transmission ?? 0}
          ior={preset.ior ?? 1.5}
          thickness={0.5}
          envMapIntensity={params.envIntensity}
        />
      </mesh>
    </group>
  );
}

interface SunLightRigProps {
  timeOfDay: number;
}

function SunLightRig({ timeOfDay }: SunLightRigProps) {
  const lightRef = useRef<THREE.DirectionalLight>(null);
  const sunMeshRef = useRef<THREE.Mesh>(null);
  const targetColor = useRef(new THREE.Color(getSunColor(timeOfDay)));
  const targetPosition = useRef(new THREE.Vector3());
  const ambientRef = useRef<THREE.AmbientLight>(null);
  const { scene } = useThree();

  useEffect(() => {
    const pos = getSunPosition(timeOfDay, 12);
    targetPosition.current.set(pos.x, pos.y, pos.z);
    targetColor.current.set(getSunColor(timeOfDay));
  }, [timeOfDay]);

  useFrame((_, delta) => {
    const lerpSpeed = Math.min(delta * 6, 1);
    if (lightRef.current) {
      lightRef.current.position.lerp(targetPosition.current, lerpSpeed);
      lightRef.current.color.lerp(targetColor.current, lerpSpeed);
      const heightFactor = Math.max(0, (targetPosition.current.y - 2) / 10);
      lightRef.current.intensity = 0.5 + heightFactor * 2.5;
    }
    if (sunMeshRef.current) {
      sunMeshRef.current.position.lerp(targetPosition.current, lerpSpeed);
      (sunMeshRef.current.material as THREE.MeshBasicMaterial).color.lerp(
        targetColor.current,
        lerpSpeed,
      );
    }
    if (ambientRef.current) {
      const heightFactor = Math.max(0, (targetPosition.current.y - 2) / 10);
      ambientRef.current.intensity = 0.2 + heightFactor * 0.4;
      ambientRef.current.color.lerp(targetColor.current, lerpSpeed * 0.3);
    }
  });

  useEffect(() => {
    if (lightRef.current) {
      lightRef.current.target.position.set(0, 0, 0);
      scene.add(lightRef.current.target);
    }
  }, [scene]);

  const sunColor = getSunColor(timeOfDay);

  return (
    <>
      <ambientLight ref={ambientRef} intensity={0.4} color={sunColor} />
      <directionalLight
        ref={lightRef}
        position={[5, 8, 5]}
        intensity={2}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={50}
        shadow-camera-left={-15}
        shadow-camera-right={15}
        shadow-camera-top={15}
        shadow-camera-bottom={-15}
        shadow-bias={-0.0005}
        shadow-radius={4}
      />
      <mesh ref={sunMeshRef}>
        <sphereGeometry args={[0.5, 32, 32]} />
        <meshBasicMaterial color={sunColor} />
      </mesh>
    </>
  );
}

function Ground() {
  const texture = useMemo(() => {
    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;
    const cells = 16;
    const cellSize = size / cells;
    for (let y = 0; y < cells; y++) {
      for (let x = 0; x < cells; x++) {
        ctx.fillStyle = (x + y) % 2 === 0 ? '#D3D3D3' : '#B8B8B8';
        ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
      }
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(25, 25);
    tex.anisotropy = 8;
    return tex;
  }, []);

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.15, 0]} receiveShadow>
      <planeGeometry args={[100, 100]} />
      <meshStandardMaterial map={texture} roughness={1} metalness={0} />
    </mesh>
  );
}

function SceneContent() {
  const { compareMode, materialType, roughness, metalness, envIntensity, timeOfDay, rightParams } =
    useStore();

  const leftParams = useMemo(
    () => ({ materialType, roughness, metalness, envIntensity }),
    [materialType, roughness, metalness, envIntensity],
  );

  const rightSideParams = useMemo(
    () => ({
      materialType: rightParams.materialType,
      roughness: rightParams.roughness,
      metalness: rightParams.metalness,
      envIntensity: rightParams.envIntensity,
    }),
    [rightParams],
  );

  return (
    <>
      <SunLightRig timeOfDay={compareMode ? (timeOfDay + rightParams.timeOfDay) / 2 : timeOfDay} />
      <Ground />
      <Environment preset="city" />
      <Sculpture offsetX={compareMode ? -1.5 : 0} params={leftParams} />
      {compareMode && <Sculpture offsetX={1.5} params={rightSideParams} />}
      <OrbitControls
        enablePan={false}
        minDistance={4}
        maxDistance={20}
        target={[0, 0.8, 0]}
      />
    </>
  );
}

export default function Scene() {
  return (
    <Canvas
      shadows
      camera={{ position: [5, 4, 8], fov: 45 }}
      style={{ background: '#1a1a2e', width: '100%', height: '100%' }}
      dpr={[1, 2]}
      gl={{ antialias: true }}
    >
      <SceneContent />
    </Canvas>
  );
}
