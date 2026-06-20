import React, { useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { PlantType, EnvironmentParams, plantTypes, lerp, clamp } from '../data/plantTypes';

interface PlantSceneProps {
  plantType: PlantType;
  params: EnvironmentParams;
}

const hexToRgb = (hex: string): THREE.Color => {
  return new THREE.Color(hex);
};

const lerpColor = (color1: string, color2: string, t: number): THREE.Color => {
  const c1 = hexToRgb(color1);
  const c2 = hexToRgb(color2);
  return c1.lerp(c2, clamp(t, 0, 1));
};

const calculateStressLevel = (plantType: PlantType, params: EnvironmentParams): number => {
  const config = plantTypes[plantType];
  const { optimalRange, growthRules } = config;

  const calculateParamStress = (
    value: number,
    range: [number, number],
    effect: number
  ): number => {
    const [min, max] = range;
    if (value >= min && value <= max) return 0;
    if (value < min) {
      return ((min - value) / min) * effect;
    } else {
      return ((value - max) / (100 - max)) * effect;
    }
  };

  const lightStress = calculateParamStress(params.light, optimalRange.light, growthRules.lightEffect);
  const waterStress = calculateParamStress(params.water, optimalRange.water, growthRules.waterEffect);
  const tempStress = calculateParamStress(params.temperature, optimalRange.temperature, growthRules.temperatureEffect);

  return clamp((lightStress + waterStress + tempStress) / 3, 0, 1);
};

const Pot: React.FC = () => {
  return (
    <group position={[0, -0.5, 0]}>
      <mesh position={[0, 0.1, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[1.2, 1.4, 0.2, 32]} />
        <meshStandardMaterial color="#D2B48C" roughness={0.8} />
      </mesh>
      <mesh position={[0, -0.3, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[1.0, 1.2, 0.8, 32]} />
        <meshStandardMaterial color="#C4A484" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.2, 0]} receiveShadow>
        <cylinderGeometry args={[1.15, 1.15, 0.1, 32]} />
        <meshStandardMaterial color="#8D6E63" roughness={1} />
      </mesh>
    </group>
  );
};

const RingIndicator: React.FC<{
  value: number;
  color: string;
  position: [number, number, number];
  radius: number;
}> = ({ value, color, position, radius }) => {
  const ringRef = useRef<THREE.Mesh>(null);
  const [breathPhase, setBreathPhase] = useState(0);

  useFrame((_, delta) => {
    setBreathPhase((prev) => (prev + delta * (Math.PI * 2) / 1.5) % (Math.PI * 2));
  });

  const arc = (value / 100) * Math.PI * 2;
  const breathScale = 1 + Math.sin(breathPhase) * 0.03;

  return (
    <group position={position}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[radius - 0.03, radius, 64, 1, 0, Math.PI * 2]} />
        <meshBasicMaterial color={color} transparent opacity={0.15} side={THREE.DoubleSide} />
      </mesh>
      <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, Math.PI / 2]} scale={[breathScale, breathScale, breathScale]}>
        <ringGeometry args={[radius - 0.02, radius, 64, 1, 0, arc]} />
        <meshBasicMaterial color={color} transparent opacity={0.7} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
};

const Succulent: React.FC<{ stress: number; params: EnvironmentParams }> = ({ stress, params }) => {
  const groupRef = useRef<THREE.Group>(null);
  const [shakeTime, setShakeTime] = useState(0);
  const [targetScale, setTargetScale] = useState(1);
  const currentScale = useRef(1);

  const leafPositions = useMemo(() => {
    const positions: Array<{ pos: [number, number, number]; scale: [number, number, number]; rot: [number, number, number] }> = [];
    const count = 8;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const radius = 0.25 + Math.random() * 0.1;
      const height = 0.2 + Math.random() * 0.15;
      positions.push({
        pos: [Math.cos(angle) * radius, height, Math.sin(angle) * radius],
        scale: [0.25 + Math.random() * 0.1, 0.3 + Math.random() * 0.15, 0.25 + Math.random() * 0.1],
        rot: [Math.random() * 0.3, angle, Math.random() * 0.3],
      });
    }
    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2 + Math.PI / 4;
      const radius = 0.15;
      const height = 0.4 + Math.random() * 0.1;
      positions.push({
        pos: [Math.cos(angle) * radius, height, Math.sin(angle) * radius],
        scale: [0.2 + Math.random() * 0.08, 0.25 + Math.random() * 0.1, 0.2 + Math.random() * 0.08],
        rot: [Math.random() * 0.2, angle, Math.random() * 0.2],
      });
    }
    positions.push({
      pos: [0, 0.55, 0],
      scale: [0.22, 0.28, 0.22],
      rot: [0, 0, 0],
    });
    return positions;
  }, []);

  useEffect(() => {
    setTargetScale(1 + (params.water - 50) / 200);
    setShakeTime(0.3);
  }, [params]);

  useFrame((_, delta) => {
    currentScale.current = lerp(currentScale.current, targetScale, delta * 0.5);
    
    if (groupRef.current) {
      if (shakeTime > 0) {
        const shakeAmount = shakeTime * 0.02;
        groupRef.current.rotation.x = (Math.random() - 0.5) * shakeAmount;
        groupRef.current.rotation.z = (Math.random() - 0.5) * shakeAmount;
        setShakeTime((prev) => Math.max(0, prev - delta));
      } else {
        groupRef.current.rotation.x = 0;
        groupRef.current.rotation.z = 0;
      }
    }
  });

  const color = lerpColor('#66BB6A', '#FF7043', stress);
  const openness = clamp(1 - params.light / 150, 0.3, 1);

  return (
    <group ref={groupRef}>
      {leafPositions.map((leaf, i) => {
        const openAngle = leaf.rot[0] + (1 - openness) * 0.5;
        return (
          <mesh
            key={i}
            position={leaf.pos}
            rotation={[openAngle, leaf.rot[1], leaf.rot[2]]}
            scale={[leaf.scale[0] * currentScale.current, leaf.scale[1] * currentScale.current, leaf.scale[2] * currentScale.current]}
            castShadow
          >
            <icosahedronGeometry args={[1, 0]} />
            <meshStandardMaterial color={color} roughness={0.6} flatShading />
          </mesh>
        );
      })}
    </group>
  );
};

const Fern: React.FC<{ stress: number; params: EnvironmentParams }> = ({ stress, params }) => {
  const groupRef = useRef<THREE.Group>(null);
  const [shakeTime, setShakeTime] = useState(0);

  const fronds = useMemo(() => {
    const frondData: Array<{ angle: number; height: number; length: number }> = [];
    const count = 7;
    for (let i = 0; i < count; i++) {
      frondData.push({
        angle: (i / count) * Math.PI * 2,
        height: 0.2 + i * 0.05,
        length: 0.6 + Math.random() * 0.3,
      });
    }
    return frondData;
  }, []);

  useEffect(() => {
    setShakeTime(0.3);
  }, [params]);

  useFrame((_, delta) => {
    if (groupRef.current) {
      if (shakeTime > 0) {
        const shakeAmount = shakeTime * 0.02;
        groupRef.current.rotation.x = (Math.random() - 0.5) * shakeAmount;
        groupRef.current.rotation.z = (Math.random() - 0.5) * shakeAmount;
        setShakeTime((prev) => Math.max(0, prev - delta));
      } else {
        groupRef.current.rotation.x = 0;
        groupRef.current.rotation.z = 0;
      }
    }
  });

  const color = lerpColor('#81C784', '#FFE082', stress);
  const droop = clamp(stress * 0.8, 0, 0.8);

  return (
    <group ref={groupRef}>
      {fronds.map((frond, i) => (
        <group key={i} position={[0, frond.height, 0]} rotation={[0, frond.angle, 0]}>
          {Array.from({ length: 8 }).map((_, j) => {
            const leafAngle = (j / 8) * Math.PI * 0.8 - Math.PI * 0.4;
            const leafY = j * 0.06;
            const leafZ = -j * 0.08;
            const droopAngle = droop * (j / 8) * 0.5;
            return (
              <group key={j} position={[0, leafY, leafZ]} rotation={[droopAngle, 0, 0]}>
                <mesh
                  position={[Math.cos(leafAngle) * 0.25, 0, Math.sin(leafAngle) * 0.25 - 0.1]}
                  rotation={[0, 0, leafAngle + Math.PI / 2]}
                  castShadow
                >
                  <coneGeometry args={[0.06, 0.25, 4]} />
                  <meshStandardMaterial color={color} roughness={0.7} flatShading />
                </mesh>
                <mesh
                  position={[-Math.cos(leafAngle) * 0.25, 0, Math.sin(leafAngle) * 0.25 - 0.1]}
                  rotation={[0, 0, -leafAngle - Math.PI / 2]}
                  castShadow
                >
                  <coneGeometry args={[0.06, 0.25, 4]} />
                  <meshStandardMaterial color={color} roughness={0.7} flatShading />
                </mesh>
              </group>
            );
          })}
        </group>
      ))}
    </group>
  );
};

const Mint: React.FC<{ stress: number; params: EnvironmentParams }> = ({ stress, params }) => {
  const groupRef = useRef<THREE.Group>(null);
  const [shakeTime, setShakeTime] = useState(0);

  const stems = useMemo(() => {
    const stemData: Array<{ angle: number; height: number; x: number; z: number }> = [];
    const count = 5;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const radius = 0.2 + Math.random() * 0.15;
      stemData.push({
        angle,
        height: 0.8 + Math.random() * 0.4,
        x: Math.cos(angle) * radius,
        z: Math.sin(angle) * radius,
      });
    }
    stemData.push({
      angle: 0,
      height: 1.0,
      x: 0,
      z: 0,
    });
    return stemData;
  }, []);

  useEffect(() => {
    setShakeTime(0.3);
  }, [params]);

  useFrame((_, delta) => {
    if (groupRef.current) {
      if (shakeTime > 0) {
        const shakeAmount = shakeTime * 0.02;
        groupRef.current.rotation.x = (Math.random() - 0.5) * shakeAmount;
        groupRef.current.rotation.z = (Math.random() - 0.5) * shakeAmount;
        setShakeTime((prev) => Math.max(0, prev - delta));
      } else {
        groupRef.current.rotation.x = 0;
        groupRef.current.rotation.z = 0;
      }
    }
  });

  const color = lerpColor('#4CAF50', '#8D6E63', stress);
  const droop = clamp((100 - params.water) / 100, 0, 1) * 0.6;

  return (
    <group ref={groupRef}>
      {stems.map((stem, i) => (
        <group key={i} position={[stem.x, 0, stem.z]}>
          <mesh position={[0, stem.height / 2, 0]} castShadow>
            <cylinderGeometry args={[0.02, 0.03, stem.height, 6]} />
            <meshStandardMaterial color="#8D6E63" roughness={0.9} flatShading />
          </mesh>
          {Array.from({ length: 4 }).map((_, j) => {
            const leafY = stem.height * (0.3 + j * 0.18);
            const leafAngle = (j / 4) * Math.PI * 2 + stem.angle;
            const droopRot = droop * (j / 4) * 0.8;
            return (
              <group key={j} position={[0, leafY, 0]} rotation={[droopRot, 0, 0]}>
                <mesh
                  position={[Math.cos(leafAngle) * 0.15, 0, Math.sin(leafAngle) * 0.15]}
                  rotation={[0, -leafAngle, Math.PI / 4]}
                  castShadow
                >
                  <coneGeometry args={[0.05, 0.18, 4]} />
                  <meshStandardMaterial color={color} roughness={0.6} flatShading />
                </mesh>
                <mesh
                  position={[-Math.cos(leafAngle) * 0.15, 0.02, -Math.sin(leafAngle) * 0.15]}
                  rotation={[0, Math.PI - leafAngle, -Math.PI / 4]}
                  castShadow
                >
                  <coneGeometry args={[0.05, 0.18, 4]} />
                  <meshStandardMaterial color={color} roughness={0.6} flatShading />
                </mesh>
              </group>
            );
          })}
        </group>
      ))}
    </group>
  );
};

const Plant: React.FC<{ plantType: PlantType; params: EnvironmentParams }> = ({ plantType, params }) => {
  const stress = calculateStressLevel(plantType, params);

  switch (plantType) {
    case 'succulent':
      return <Succulent stress={stress} params={params} />;
    case 'fern':
      return <Fern stress={stress} params={params} />;
    case 'mint':
      return <Mint stress={stress} params={params} />;
    default:
      return null;
  }
};

const Scene: React.FC<PlantSceneProps> = ({ plantType, params }) => {
  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight
        position={[5, 8, 5]}
        intensity={1}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <directionalLight position={[-3, 5, -3]} intensity={0.3} />

      <Pot />
      <Plant plantType={plantType} params={params} />

      <RingIndicator value={params.light} color="#FFD700" position={[0, 0.6, 0]} radius={1.8} />
      <RingIndicator value={params.water} color="#4FC3F7" position={[0, 0.6, 0]} radius={2.0} />
      <RingIndicator value={params.temperature} color="#FF7043" position={[0, 0.6, 0]} radius={2.2} />

      <OrbitControls
        enablePan={false}
        minDistance={4}
        maxDistance={10}
        minPolarAngle={Math.PI / 6}
        maxPolarAngle={Math.PI / 2.2}
      />
    </>
  );
};

const PlantScene: React.FC<PlantSceneProps> = ({ plantType, params }) => {
  return (
    <div style={{ width: '100%', height: '100%', minHeight: '400px' }}>
      <Canvas
        shadows
        camera={{ position: [0, 3, 5], fov: 50 }}
        gl={{ antialias: true, powerPreference: 'high-performance' }}
        onCreated={({ gl }) => {
          gl.setClearColor('#F5F0EB');
        }}
      >
        <Scene plantType={plantType} params={params} />
      </Canvas>
    </div>
  );
};

export default PlantScene;
