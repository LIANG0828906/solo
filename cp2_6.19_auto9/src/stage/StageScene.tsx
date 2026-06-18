import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import * as THREE from 'three';
import type { LightParams } from '../types';
import { LIGHT_COUNT } from '../types';

interface StageSceneProps {
  lights: LightParams[];
}

const hslToThreeColor = (h: number, s: number, l: number): THREE.Color => {
  const color = new THREE.Color();
  color.setHSL(h / 360, s / 100, l / 100);
  return color;
};

const calculatePatternIntensity = (
  pattern: LightParams['pattern'],
  speed: number,
  time: number,
  index: number,
): number => {
  switch (pattern) {
    case 'static':
      return 1;
    case 'breathing':
      return 0.5 + 0.5 * Math.sin(time * speed * 2);
    case 'strobe':
      const period = 1 / (speed * 3);
      return (time % period) < period / 2 ? 1 : 0;
    case 'wave':
      return 0.5 + 0.5 * Math.sin(time * speed * 2 + index * 0.8);
    default:
      return 1;
  }
};

interface LightGroupProps {
  position: [number, number, number];
  params: LightParams;
  index: number;
  targetPosition: [number, number, number];
}

const LightGroup = ({ position, params, index, targetPosition }: LightGroupProps) => {
  const spotLightRef = useRef<THREE.SpotLight>(null);
  const pointLightRef = useRef<THREE.PointLight>(null);
  const coneRef = useRef<THREE.Mesh>(null);
  const bulbRef = useRef<THREE.Mesh>(null);
  const timeRef = useRef(0);

  useFrame((state, delta) => {
    timeRef.current += delta;
    const intensity = calculatePatternIntensity(
      params.pattern,
      params.patternSpeed,
      timeRef.current,
      index,
    );
    const brightnessMultiplier = params.brightness / 100;
    const finalIntensity = intensity * brightnessMultiplier;

    const color = hslToThreeColor(params.hue, params.saturation, 50 + params.brightness * 0.3);

    if (spotLightRef.current) {
      spotLightRef.current.intensity = 50 * finalIntensity;
      spotLightRef.current.color = color;
    }

    if (pointLightRef.current) {
      pointLightRef.current.intensity = 30 * finalIntensity;
      pointLightRef.current.color = color;
    }

    if (coneRef.current) {
      const mat = coneRef.current.material as THREE.MeshBasicMaterial;
      mat.color = color;
      mat.opacity = 0.2 * finalIntensity;
    }

    if (bulbRef.current) {
      const mat = bulbRef.current.material as THREE.MeshBasicMaterial;
      mat.color = color;
    }
  });

  const lookAtTarget = useMemo(() => new THREE.Vector3(...targetPosition), [targetPosition]);

  return (
    <group position={position}>
      <spotLight
        ref={spotLightRef}
        angle={Math.PI / 5}
        penumbra={0.3}
        distance={30}
        castShadow
        target-position={targetPosition}
      />
      <pointLight ref={pointLightRef} distance={15} decay={2} />

      <mesh ref={bulbRef}>
        <sphereGeometry args={[0.15, 16, 16]} />
        <meshBasicMaterial />
      </mesh>

      <mesh ref={coneRef} position={[0, -0.5, 0]} rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[0.8, 3, 16, 1, true]} />
        <meshBasicMaterial transparent side={THREE.DoubleSide} />
      </mesh>

      <mesh position={[0, 0.3, 0]}>
        <cylinderGeometry args={[0.2, 0.25, 0.4, 16]} />
        <meshStandardMaterial color="#2a2a3e" metalness={0.8} roughness={0.2} />
      </mesh>
    </group>
  );
};

const Stage = () => {
  return (
    <group position={[0, -2, 0]}>
      <mesh position={[0, 0, 0]} receiveShadow>
        <boxGeometry args={[10, 0.5, 8]} />
        <meshStandardMaterial color="#16213e" metalness={0.3} roughness={0.5} />
      </mesh>

      <mesh position={[0, 1, 0]}>
        <boxGeometry args={[6, 2, 0.3]} />
        <meshStandardMaterial color="#0f3460" metalness={0.4} roughness={0.4} emissive="#0f3460" emissiveIntensity={0.2} />
      </mesh>

      <mesh position={[-4, 1, -3]}>
        <boxGeometry args={[1.5, 4, 1.5]} />
        <meshStandardMaterial color="#1a1a2e" metalness={0.5} roughness={0.3} />
      </mesh>
      <mesh position={[4, 1, -3]}>
        <boxGeometry args={[1.5, 4, 1.5]} />
        <meshStandardMaterial color="#1a1a2e" metalness={0.5} roughness={0.3} />
      </mesh>

      {[-3, -1, 1, 3].map((x, i) => (
        <mesh key={i} position={[x, 0.5, 2]}>
          <cylinderGeometry args={[0.3, 0.4, 1.5, 16]} />
          <meshStandardMaterial color="#2a2a3e" metalness={0.6} roughness={0.2} />
        </mesh>
      ))}

      <mesh position={[0, -1.7, 2]}>
        <boxGeometry args={[3, 0.1, 0.3]} />
        <meshStandardMaterial color="#e94560" emissive="#e94560" emissiveIntensity={0.8} />
      </mesh>
    </group>
  );
};

const FloorGlow = () => {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.75, 0]}>
      <circleGeometry args={[12, 64]} />
      <meshBasicMaterial
        color="#0066ff"
        transparent
        opacity={0.08}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
};

const Scene = ({ lights }: { lights: LightParams[] }) => {
  const lightPositions = useMemo<[number, number, number][]>(() => {
    const positions: [number, number, number][] = [];
    for (let i = 0; i < LIGHT_COUNT; i++) {
      const angle = (i / LIGHT_COUNT) * Math.PI * 2 - Math.PI / 2;
      const radius = 6;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      positions.push([x, 4, z]);
    }
    return positions;
  }, []);

  const targetPositions = useMemo<[number, number, number][]>(() => {
    const targets: [number, number, number][] = [];
    for (let i = 0; i < LIGHT_COUNT; i++) {
      const angle = (i / LIGHT_COUNT) * Math.PI * 2 - Math.PI / 2 + Math.PI * 0.15;
      const radius = 2;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      targets.push([x, 0, z]);
    }
    return targets;
  }, []);

  return (
    <>
      <ambientLight intensity={0.15} />
      <Stars radius={100} depth={50} count={3000} factor={4} saturation={0} fade speed={0.5} />

      <Stage />
      <FloorGlow />

      {lights.map((lightParams, index) => (
        <LightGroup
          key={index}
          position={lightPositions[index]}
          params={lightParams}
          index={index}
          targetPosition={targetPositions[index]}
        />
      ))}

      <OrbitControls
        enablePan={false}
        enableZoom={true}
        minDistance={8}
        maxDistance={20}
        minPolarAngle={Math.PI / 6}
        maxPolarAngle={Math.PI / 2}
        autoRotate={false}
      />
    </>
  );
};

const StageScene = ({ lights }: StageSceneProps) => {
  return (
    <Canvas
      camera={{ position: [0, 3, 12], fov: 50 }}
      gl={{ antialias: true, alpha: false }}
      style={{ background: 'linear-gradient(to bottom, #0a0a1a 0%, #1a1a2e 50%, #16213e 100%)' }}
      shadows
    >
      <fog attach="fog" args={['#0a0a1a', 15, 40]} />
      <Scene lights={lights} />
    </Canvas>
  );
};

export default StageScene;
