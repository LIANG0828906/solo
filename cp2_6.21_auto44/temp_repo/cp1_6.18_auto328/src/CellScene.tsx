import { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame, ThreeEvent } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { useCellStore } from './useCellStore';
import { ICellOrganelle } from './CellTypes';

function CellMembrane({ organelle }: { organelle: ICellOrganelle }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const scale = organelle.scale || [1, 1, 1];
  const opacity = organelle.opacity || 0.2;

  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += organelle.rotationSpeed[0] * delta;
      meshRef.current.rotation.y += organelle.rotationSpeed[1] * delta;
      meshRef.current.rotation.z += organelle.rotationSpeed[2] * delta;
    }
  });

  return (
    <mesh
      ref={meshRef}
      position={organelle.position}
      rotation={organelle.rotation}
      scale={scale}
    >
      <sphereGeometry args={[organelle.radius, 64, 64]} />
      <meshStandardMaterial
        color={organelle.color}
        emissive={organelle.emissive}
        emissiveIntensity={organelle.emissiveIntensity}
        transparent
        opacity={opacity}
        side={THREE.DoubleSide}
        roughness={0.1}
        metalness={0.1}
      />
    </mesh>
  );
}

function Nucleus({
  organelle,
  onClick,
  isSelected
}: {
  organelle: ICellOrganelle;
  onClick: (e: ThreeEvent<MouseEvent>) => void;
  isSelected: boolean;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const timeRef = useRef(0);

  useFrame((_, delta) => {
    timeRef.current += delta;
    if (meshRef.current) {
      const pulse = 1 + 0.08 * Math.sin(timeRef.current * (organelle.pulseSpeed || 1.5) + (organelle.pulsePhase || 0));
      meshRef.current.scale.setScalar(pulse);
      meshRef.current.rotation.x += organelle.rotationSpeed[0] * delta;
      meshRef.current.rotation.y += organelle.rotationSpeed[1] * delta;
      meshRef.current.rotation.z += organelle.rotationSpeed[2] * delta;
      const material = meshRef.current.material as THREE.MeshStandardMaterial;
      material.emissiveIntensity = organelle.emissiveIntensity * (1 + 0.15 * Math.sin(timeRef.current * (organelle.pulseSpeed || 1.5) + (organelle.pulsePhase || 0)));
    }
  });

  return (
    <group position={organelle.position}>
      <mesh
        ref={meshRef}
        rotation={organelle.rotation}
        onClick={onClick}
        castShadow
        receiveShadow
      >
        <sphereGeometry args={[organelle.radius, 32, 32]} />
        <meshStandardMaterial
          color={organelle.color}
          emissive={organelle.emissive}
          emissiveIntensity={organelle.emissiveIntensity}
          transparent
          opacity={0.9}
          roughness={0.3}
          metalness={0.2}
        />
      </mesh>
      {isSelected && (
        <mesh rotation={organelle.rotation}>
          <sphereGeometry args={[organelle.radius * 1.15, 32, 32]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.3} side={THREE.BackSide} />
        </mesh>
      )}
    </group>
  );
}

function Mitochondria({
  organelle,
  onClick,
  isSelected
}: {
  organelle: ICellOrganelle;
  onClick: (e: ThreeEvent<MouseEvent>) => void;
  isSelected: boolean;
}) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += organelle.rotationSpeed[0] * delta;
      meshRef.current.rotation.y += organelle.rotationSpeed[1] * delta;
      meshRef.current.rotation.z += organelle.rotationSpeed[2] * delta;
    }
  });

  return (
    <group position={organelle.position}>
      <mesh
        ref={meshRef}
        rotation={organelle.rotation}
        onClick={onClick}
        castShadow
        receiveShadow
      >
        <capsuleGeometry args={[organelle.radius, organelle.radius * 1.5, 8, 16]} />
        <meshStandardMaterial
          color={organelle.color}
          emissive={organelle.emissive}
          emissiveIntensity={organelle.emissiveIntensity}
          transparent
          opacity={0.85}
          roughness={0.4}
          metalness={0.3}
        />
      </mesh>
      {isSelected && (
        <mesh rotation={organelle.rotation}>
          <sphereGeometry args={[organelle.radius * 1.2, 32, 32]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.3} side={THREE.BackSide} />
        </mesh>
      )}
    </group>
  );
}

function Golgi({
  organelle,
  onClick,
  isSelected
}: {
  organelle: ICellOrganelle;
  onClick: (e: ThreeEvent<MouseEvent>) => void;
  isSelected: boolean;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const discCount = 5;

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.x += organelle.rotationSpeed[0] * delta;
      groupRef.current.rotation.y += organelle.rotationSpeed[1] * delta;
      groupRef.current.rotation.z += organelle.rotationSpeed[2] * delta;
    }
  });

  const discs = useMemo(() => {
    return Array.from({ length: discCount }, (_, i) => {
      const yOffset = (i - (discCount - 1) / 2) * (organelle.radius * 0.3);
      const scale = 1 - Math.abs(i - (discCount - 1) / 2) * 0.15;
      return { yOffset, scale };
    });
  }, [organelle.radius]);

  return (
    <group position={organelle.position} onClick={onClick}>
      <group ref={groupRef} rotation={organelle.rotation}>
        {discs.map((disc, i) => (
          <mesh
            key={i}
            position={[0, disc.yOffset, 0]}
            scale={[disc.scale, 1, disc.scale]}
            castShadow
            receiveShadow
          >
            <cylinderGeometry args={[organelle.radius * 0.8, organelle.radius * 0.8, organelle.radius * 0.15, 32]} />
            <meshStandardMaterial
              color={organelle.color}
              emissive={organelle.emissive}
              emissiveIntensity={organelle.emissiveIntensity}
              transparent
              opacity={0.8}
              roughness={0.5}
              metalness={0.2}
            />
          </mesh>
        ))}
      </group>
      {isSelected && (
        <mesh>
          <sphereGeometry args={[organelle.radius * 1.2, 32, 32]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.2} side={THREE.BackSide} />
        </mesh>
      )}
    </group>
  );
}

function EndoplasmicReticulum({
  organelle,
  onClick,
  isSelected
}: {
  organelle: ICellOrganelle;
  onClick: (e: ThreeEvent<MouseEvent>) => void;
  isSelected: boolean;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const tubeCount = 8;

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.x += organelle.rotationSpeed[0] * delta;
      groupRef.current.rotation.y += organelle.rotationSpeed[1] * delta;
      groupRef.current.rotation.z += organelle.rotationSpeed[2] * delta;
    }
  });

  const tubes = useMemo(() => {
    return Array.from({ length: tubeCount }, (_, i) => {
      const angle = (i / tubeCount) * Math.PI * 2;
      const radius = organelle.radius * 0.6;
      const curvePoints: THREE.Vector3[] = [];
      const segments = 20;
      for (let j = 0; j <= segments; j++) {
        const t = j / segments;
        const x = Math.cos(angle + t * Math.PI) * radius * (0.5 + t * 0.5);
        const y = (t - 0.5) * organelle.radius * 1.5;
        const z = Math.sin(angle + t * Math.PI * 0.5) * radius * 0.5;
        curvePoints.push(new THREE.Vector3(x, y, z));
      }
      return new THREE.CatmullRomCurve3(curvePoints);
    });
  }, [organelle.radius]);

  return (
    <group position={organelle.position} onClick={onClick}>
      <group ref={groupRef} rotation={organelle.rotation}>
        {tubes.map((curve, i) => (
          <mesh key={i} castShadow receiveShadow>
            <tubeGeometry args={[curve, 20, organelle.radius * 0.08, 8, false]} />
            <meshStandardMaterial
              color={organelle.color}
              emissive={organelle.emissive}
              emissiveIntensity={organelle.emissiveIntensity}
              transparent
              opacity={0.7}
              roughness={0.6}
              metalness={0.1}
            />
          </mesh>
        ))}
      </group>
      {isSelected && (
        <mesh>
          <sphereGeometry args={[organelle.radius * 1.2, 32, 32]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.2} side={THREE.BackSide} />
        </mesh>
      )}
    </group>
  );
}

function Vacuole({
  organelle,
  onClick,
  isSelected
}: {
  organelle: ICellOrganelle;
  onClick: (e: ThreeEvent<MouseEvent>) => void;
  isSelected: boolean;
}) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += organelle.rotationSpeed[0] * delta;
      meshRef.current.rotation.y += organelle.rotationSpeed[1] * delta;
      meshRef.current.rotation.z += organelle.rotationSpeed[2] * delta;
    }
  });

  return (
    <group position={organelle.position}>
      <mesh
        ref={meshRef}
        rotation={organelle.rotation}
        onClick={onClick}
        castShadow
        receiveShadow
      >
        <sphereGeometry args={[organelle.radius, 32, 32]} />
        <meshStandardMaterial
          color={organelle.color}
          emissive={organelle.emissive}
          emissiveIntensity={organelle.emissiveIntensity}
          transparent
          opacity={0.6}
          roughness={0.2}
          metalness={0.1}
        />
      </mesh>
      {isSelected && (
        <mesh rotation={organelle.rotation}>
          <sphereGeometry args={[organelle.radius * 1.2, 32, 32]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.3} side={THREE.BackSide} />
        </mesh>
      )}
    </group>
  );
}

function OrganelleRenderer({
  organelle,
  onClick,
  isSelected
}: {
  organelle: ICellOrganelle;
  onClick: (org: ICellOrganelle) => void;
  isSelected: boolean;
}) {
  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    onClick(organelle);
  };

  switch (organelle.type) {
    case 'membrane':
      return <CellMembrane organelle={organelle} />;
    case 'nucleus':
      return <Nucleus organelle={organelle} onClick={handleClick} isSelected={isSelected} />;
    case 'mitochondria':
      return <Mitochondria organelle={organelle} onClick={handleClick} isSelected={isSelected} />;
    case 'golgi':
      return <Golgi organelle={organelle} onClick={handleClick} isSelected={isSelected} />;
    case 'er':
      return <EndoplasmicReticulum organelle={organelle} onClick={handleClick} isSelected={isSelected} />;
    case 'vacuole':
      return <Vacuole organelle={organelle} onClick={handleClick} isSelected={isSelected} />;
    default:
      return null;
  }
}

function CellContent() {
  const { organelles, selectedOrganelle, selectOrganelle, initializeOrganelles } = useCellStore();

  useEffect(() => {
    if (organelles.length === 0) {
      initializeOrganelles();
    }
  }, [organelles.length, initializeOrganelles]);

  const handleCanvasClick = () => {
    selectOrganelle(null);
  };

  return (
    <>
      <ambientLight intensity={0.3} />
      <directionalLight
        position={[10, 10, 5]}
        intensity={1.0}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-near={0.5}
        shadow-camera-far={50}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
        shadow-bias={-0.0001}
      />
      <pointLight position={[-5, 5, -5]} intensity={0.5} color="#88CCFF" distance={20} />
      <pointLight position={[0, -5, 5]} intensity={0.3} color="#FF6B6B" distance={15} />

      <group onClick={handleCanvasClick}>
        {organelles.map((organelle) => (
          <OrganelleRenderer
            key={organelle.id}
            organelle={organelle}
            onClick={selectOrganelle}
            isSelected={selectedOrganelle?.id === organelle.id}
          />
        ))}
      </group>

      <OrbitControls
        enableDamping
        dampingFactor={0.05}
        minDistance={5}
        maxDistance={20}
        enablePan={false}
        autoRotate={false}
        autoRotateSpeed={0.5}
      />
    </>
  );
}

export function CellScene() {
  return (
    <div className="canvas-container">
      <Canvas
        shadows
        camera={{ position: [0, 0, 15], fov: 60, near: 0.1, far: 1000 }}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance',
          pixelRatio: Math.min(window.devicePixelRatio, 2)
        }}
        dpr={[1, 2]}
      >
        <fog attach="fog" args={['#0A0A2E', 10, 40]} />
        <CellContent />
      </Canvas>
    </div>
  );
}
