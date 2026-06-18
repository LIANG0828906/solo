import { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import * as THREE from 'three';
import { useNavStore } from '../store/useNavStore';
import { Landmark as LandmarkType } from '../types';

const WARM_COLORS = [
  '#FF6B6B',
  '#FF8E53',
  '#FFA726',
  '#FFCA28',
  '#FFEE58',
  '#FF7043',
  '#AB47BC',
  '#EC407A',
  '#EF5350',
  '#FFA726',
];

const generateLandmarks = (): LandmarkType[] => {
  const landmarks: LandmarkType[] = [];
  for (let i = 0; i < 10; i++) {
    const angle = (i / 10) * Math.PI * 2 + Math.random() * 0.5;
    const radius = 40 + Math.random() * 50;
    landmarks.push({
      id: `landmark-${i}`,
      name: `地标 ${i + 1}`,
      position: {
        x: Math.cos(angle) * radius,
        y: 0,
        z: Math.sin(angle) * radius,
      },
      color: WARM_COLORS[i % WARM_COLORS.length],
    });
  }
  return landmarks;
};

const GroundPlane = () => {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]} receiveShadow>
      <planeGeometry args={[200, 200, 50, 50]} />
      <meshStandardMaterial color="#1a1a2e" wireframe={false} />
    </mesh>
  );
};

const GridHelper = () => {
  const gridRef = useRef<THREE.GridHelper>(null);
  return (
    <gridHelper
      ref={gridRef}
      args={[200, 40, '#333355', '#222244']}
      position={[0, -0.49, 0]}
    />
  );
};

interface LandmarkMeshProps {
  landmark: LandmarkType;
  onClick: (id: string) => void;
}

const LandmarkMesh = ({ landmark, onClick }: LandmarkMeshProps) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    if (meshRef.current) {
      meshRef.current.position.y = 1 + Math.sin(time * 2 + landmark.position.x) * 0.3;
    }
    if (glowRef.current) {
      const scale = 1 + Math.sin(time * 3) * 0.1;
      glowRef.current.scale.set(scale, scale, scale);
    }
  });

  const handleClick = (e: any) => {
    e.stopPropagation();
    onClick(landmark.id);
  };

  return (
    <group position={[landmark.position.x, 0, landmark.position.z]}>
      <mesh
        ref={meshRef}
        position={[0, 1, 0]}
        onClick={handleClick}
        onPointerOver={(e) => {
          e.stopPropagation();
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          document.body.style.cursor = 'default';
        }}
      >
        <sphereGeometry args={[1, 32, 32]} />
        <meshStandardMaterial
          color={landmark.color}
          emissive={landmark.color}
          emissiveIntensity={0.8}
          metalness={0.3}
          roughness={0.2}
        />
      </mesh>
      <mesh ref={glowRef} position={[0, 1, 0]}>
        <sphereGeometry args={[1.3, 32, 32]} />
        <meshBasicMaterial
          color={landmark.color}
          transparent
          opacity={0.2}
          side={THREE.BackSide}
        />
      </mesh>
      <pointLight color={landmark.color} intensity={2} distance={15} position={[0, 1, 0]} />
      <Html position={[0, 3, 0]} center distanceFactor={15}>
        <div
          style={{
            color: landmark.color,
            fontSize: '12px',
            whiteSpace: 'nowrap',
            textShadow: '0 0 10px rgba(0,0,0,0.8)',
            fontWeight: 'bold',
            pointerEvents: 'none',
          }}
        >
          {landmark.name}
        </div>
      </Html>
    </group>
  );
};

const PlayerMarker = () => {
  const groupRef = useRef<THREE.Group>(null);
  const { player, setPlayerPosition, setPlayerFacing } = useNavStore();

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.position.set(player.position.x, 0.5, player.position.z);
      groupRef.current.rotation.y = player.facing;
    }
  });

  return (
    <group ref={groupRef}>
      <mesh position={[0, 0.5, 0]}>
        <coneGeometry args={[0.8, 2, 8]} />
        <meshStandardMaterial
          color="#FFD700"
          emissive="#FFD700"
          emissiveIntensity={0.6}
          metalness={0.8}
          roughness={0.2}
        />
      </mesh>
      <mesh position={[0, 0.5, 1.2]} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.3, 0.5, 6]} />
        <meshBasicMaterial color="#FFD700" side={THREE.DoubleSide} />
      </mesh>
      <pointLight color="#FFD700" intensity={3} distance={10} position={[0, 2, 0]} />
    </group>
  );
};

const CameraController = () => {
  const { camera } = useThree();
  const { player, setPlayerPosition, setPlayerFacing } = useNavStore();
  const controlsRef = useRef<any>(null);
  const lastPosRef = useRef({ x: player.position.x, z: player.position.z });

  useFrame(() => {
    if (controlsRef.current) {
      const target = controlsRef.current.target;
      const dx = target.x - lastPosRef.current.x;
      const dz = target.z - lastPosRef.current.z;

      if (Math.abs(dx) > 0.01 || Math.abs(dz) > 0.01) {
        setPlayerPosition({
          x: target.x,
          y: 0,
          z: target.z,
        });

        const distance = Math.sqrt(dx * dx + dz * dz);
        if (distance > 0.01) {
          const angle = Math.atan2(dx, dz);
          setPlayerFacing(angle);
        }

        lastPosRef.current = { x: target.x, z: target.z };
      }
    }
  });

  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.target.set(player.position.x, 0, player.position.z);
      controlsRef.current.update();
    }
  }, []);

  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      enablePan={true}
      enableZoom={true}
      enableRotate={false}
      minDistance={10}
      maxDistance={150}
      maxPolarAngle={Math.PI / 3}
      minPolarAngle={Math.PI / 6}
      screenSpacePanning={false}
    />
  );
};

const SceneContent = () => {
  const { landmarks, setLandmarks, setTargetLandmark, setShowLockPrompt } = useNavStore();

  useEffect(() => {
    const generated = generateLandmarks();
    setLandmarks(generated);
  }, [setLandmarks]);

  const handleLandmarkClick = (id: string) => {
    setTargetLandmark(id);
    setShowLockPrompt(true);
    setTimeout(() => setShowLockPrompt(false), 500);
  };

  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[50, 100, 50]} intensity={0.6} castShadow />
      <GroundPlane />
      <GridHelper />
      {landmarks.map((landmark) => (
        <LandmarkMesh
          key={landmark.id}
          landmark={landmark}
          onClick={handleLandmarkClick}
        />
      ))}
      <PlayerMarker />
      <CameraController />
    </>
  );
};

const MapScene = () => {
  return (
    <Canvas
      camera={{ position: [0, 80, 80], fov: 50 }}
      style={{ width: '100%', height: '100%', background: '#0f0f1a' }}
      shadows
    >
      <fog attach="fog" args={['#0f0f1a', 80, 200]} />
      <SceneContent />
    </Canvas>
  );
};

export default MapScene;
