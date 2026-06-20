
import React, { useRef, useEffect, useState, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Html, Stars } from '@react-three/drei';
import * as THREE from 'three';
import { useMoleculeStore, type Atom as AtomType, type Bond as BondType, type Particle } from '../store/moleculeStore';
import type { ElementType } from '../utils/constants';
import { ELEMENT_CONFIG } from '../utils/constants';

interface AtomMeshProps {
  atom: AtomType;
  onClick: (e: any) => void;
  lowPerfMode: boolean;
}

const AtomMesh: React.FC<AtomMeshProps> = ({ atom, onClick, lowPerfMode }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const [scale, setScale] = useState(0);
  const [floatOffset, setFloatOffset] = useState(0);

  useFrame((state) => {
    if (meshRef.current) {
      if (scale < 1) {
        setScale(Math.min(scale + 0.05, 1));
      }
      const t = state.clock.elapsedTime;
      const offset = Math.sin(t * 1.5 + atom.createdAt * 0.001) * 0.05;
      setFloatOffset(offset);
    }
    if (glowRef.current && atom.selected) {
      const s = 1.3 + Math.sin(state.clock.elapsedTime * 3) * 0.08;
      glowRef.current.scale.setScalar(s);
    }
  });

  const finalPosition: [number, number, number] = [
    atom.position[0],
    atom.position[1] + floatOffset,
    atom.position[2],
  ];

  if (lowPerfMode) {
    return (
      <points position={finalPosition} onClick={onClick}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[new Float32Array([0, 0, 0]), 3]} />
        </bufferGeometry>
        <pointsMaterial size={atom.radius * 0.6} color={atom.color} sizeAttenuation transparent opacity={0.9} />
      </points>
    );
  }

  return (
    <group>
      <mesh
        ref={meshRef}
        position={finalPosition}
        onClick={onClick}
        scale={scale}
      >
        <sphereGeometry args={[atom.radius, 32, 32]} />
        <meshStandardMaterial
          color={atom.color}
          roughness={0.3}
          metalness={0.4}
          emissive={atom.selected ? atom.color : '#000000'}
          emissiveIntensity={atom.selected ? 0.5 : 0}
        />
      </mesh>
      <mesh ref={glowRef} position={finalPosition} scale={scale}>
        <sphereGeometry args={[atom.radius * 1.15, 24, 24]} />
        <meshBasicMaterial
          color={atom.color}
          transparent
          opacity={atom.selected ? 0.25 : 0.08}
          side={THREE.BackSide}
          depthWrite={false}
        />
      </mesh>
      {atom.selected && (
        <Html position={finalPosition} center distanceFactor={8} zIndexRange={[100, 0]}>
          <div
            className="px-2 py-1 rounded text-[10px] font-bold whitespace-nowrap pointer-events-none"
            style={{
              backgroundColor: 'rgba(0,0,0,0.8)',
              color: '#fff',
              border: `1px solid ${atom.color}`,
              boxShadow: `0 0 10px ${atom.color}66`,
            }}
          >
            {ELEMENT_CONFIG[atom.element as ElementType].name} ({atom.element})
          </div>
        </Html>
      )}
    </group>
  );
};

interface BondMeshProps {
  bond: BondType;
  atomA: AtomType;
  atomB: AtomType;
  onClick: (e: any) => void;
}

const BondMesh: React.FC<BondMeshProps> = ({ bond, atomA, atomB, onClick }) => {
  const meshRef = useRef<THREE.Group>(null);
  const [progress, setProgress] = useState(0);

  useFrame(() => {
    if (progress < 1) {
      setProgress(Math.min(progress + 0.04, 1));
    }
  });

  const count = bond.type === 'single' ? 1 : bond.type === 'double' ? 2 : 3;
  const offset = 0.1;

  const midPoint = useMemo(
    () => new THREE.Vector3(
      (atomA.position[0] + atomB.position[0]) / 2,
      (atomA.position[1] + atomB.position[1]) / 2,
      (atomA.position[2] + atomB.position[2]) / 2,
    ),
    [atomA.position, atomB.position]
  );

  const direction = useMemo(() => {
    const dir = new THREE.Vector3(
      atomB.position[0] - atomA.position[0],
      atomB.position[1] - atomA.position[1],
      atomB.position[2] - atomA.position[2],
    );
    return dir;
  }, [atomA.position, atomB.position]);

  const length = direction.length();
  const normalizedDir = direction.clone().normalize();

  const up = new THREE.Vector3(0, 1, 0);
  const perpendicular = new THREE.Vector3().crossVectors(normalizedDir, up).normalize();
  if (perpendicular.length() < 0.01) {
    perpendicular.set(1, 0, 0);
  }

  const bonds = [];
  for (let i = 0; i < count; i++) {
    const offsetAmount = count === 1 ? 0 : (i - (count - 1) / 2) * offset;
    const offsetVector = perpendicular.clone().multiplyScalar(offsetAmount);

    const start = new THREE.Vector3(
      atomA.position[0] + offsetVector.x,
      atomA.position[1] + offsetVector.y,
      atomA.position[2] + offsetVector.z,
    );
    const end = new THREE.Vector3(
      atomB.position[0] + offsetVector.x,
      atomB.position[1] + offsetVector.y,
      atomB.position[2] + offsetVector.z,
    );
    const currentEnd = new THREE.Vector3().lerpVectors(start, end, progress);
    const bondMid = new THREE.Vector3().addVectors(start, currentEnd).multiplyScalar(0.5);
    const bondLength = start.distanceTo(currentEnd);

    const quaternion = new THREE.Quaternion();
    const bondDir = new THREE.Vector3().subVectors(currentEnd, start).normalize();
    quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), bondDir);

    bonds.push(
      <mesh
        key={i}
        ref={i === 0 ? (meshRef as any) : undefined}
        position={bondMid}
        quaternion={quaternion}
        onClick={onClick}
      >
        <cylinderGeometry args={[0.06, 0.06, bondLength, 16]} />
        <meshStandardMaterial
          vertexColors
          color={bond.selected ? '#00ffff' : '#aaaaaa'}
          emissive={bond.selected ? '#00ffff' : '#000000'}
          emissiveIntensity={bond.selected ? 0.4 : 0}
          roughness={0.5}
          metalness={0.3}
        />
      </mesh>
    );
  }

  if (bond.selected) {
    bonds.push(
      <Html key="label" position={midPoint} center distanceFactor={8} zIndexRange={[100, 0]}>
        <div
          className="px-2 py-1 rounded text-[10px] font-bold whitespace-nowrap pointer-events-none"
          style={{
            backgroundColor: 'rgba(0,255,255,0.15)',
            color: '#00ffff',
            border: '1px solid #00ffff',
            boxShadow: '0 0 10px #00ffff66',
          }}
        >
          键长: {(length * 0.529).toFixed(3)} Å
        </div>
      </Html>
    );
  }

  return <group>{bonds}</group>;
};

interface ParticleMeshProps {
  particle: Particle;
}

const ParticleMesh: React.FC<ParticleMeshProps> = ({ particle }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (meshRef.current && glowRef.current) {
      const elapsed = Date.now() - particle.createdAt;
      const progress = Math.min(elapsed / particle.lifetime, 1);
      const scale = (1 - progress * 0.6) * 1.4;
      meshRef.current.scale.setScalar(scale);
      glowRef.current.scale.setScalar(scale * 1.8);
      const material = meshRef.current.material as THREE.MeshBasicMaterial;
      const glowMaterial = glowRef.current.material as THREE.MeshBasicMaterial;
      material.opacity = 1 - progress;
      glowMaterial.opacity = (1 - progress) * 0.5;
    }
  });

  return (
    <group>
      <mesh ref={meshRef} position={particle.position}>
        <sphereGeometry args={[0.1, 10, 10]} />
        <meshBasicMaterial color={particle.color} transparent opacity={1} />
      </mesh>
      <mesh ref={glowRef} position={particle.position}>
        <sphereGeometry args={[0.1, 10, 10]} />
        <meshBasicMaterial color={particle.color} transparent opacity={0.5} side={THREE.BackSide} depthWrite={false} />
      </mesh>
    </group>
  );
};

interface SceneContentProps {
  containerRef: React.RefObject<HTMLDivElement>;
  mousePositionRef: React.MutableRefObject<{ x: number; y: number }>;
}

const SceneContent: React.FC<SceneContentProps> = ({ containerRef, mousePositionRef }) => {
  const atoms = useMoleculeStore((s) => s.atoms);
  const bonds = useMoleculeStore((s) => s.bonds);
  const particles = useMoleculeStore((s) => s.particles);
  const updateParticles = useMoleculeStore((s) => s.updateParticles);
  const selectAtom = useMoleculeStore((s) => s.selectAtom);
  const selectBond = useMoleculeStore((s) => s.selectBond);
  const bondCreationFirstAtom = useMoleculeStore((s) => s.bondCreationFirstAtom);
  const setBondCreationFirstAtom = useMoleculeStore((s) => s.setBondCreationFirstAtom);
  const addBond = useMoleculeStore((s) => s.addBond);
  const selectedBondType = useMoleculeStore((s) => s.selectedBondType);
  const getAtomById = useMoleculeStore((s) => s.getAtomById);
  const draggingElement = useMoleculeStore((s) => s.draggingElement);
  const isOverScene = useMoleculeStore((s) => s.isOverScene);

  const { camera, viewport, size } = useThree();
  const previewRef = useRef<THREE.Mesh>(null);
  const previewGlowRef = useRef<THREE.Mesh>(null);

  const lowPerfMode = atoms.length > 200;

  useFrame((state) => {
    if (particles.length > 0) {
      updateParticles();
    }

    if (draggingElement && previewRef.current && previewGlowRef.current && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const ndcX = ((mousePositionRef.current.x - rect.left) / rect.width) * 2 - 1;
      const ndcY = -((mousePositionRef.current.y - rect.top) / rect.height) * 2 + 1;

      const distance = 6;
      const fov = 50;
      const aspect = rect.width / rect.height;
      const height3d = 2 * Math.tan((fov * Math.PI) / 360) * distance;
      const width3d = height3d * aspect;

      const targetX = ndcX * width3d * 0.5;
      const targetY = ndcY * height3d * 0.5;
      const targetZ = 0;

      previewRef.current.position.x += (targetX - previewRef.current.position.x) * 0.2;
      previewRef.current.position.y += (targetY - previewRef.current.position.y) * 0.2;
      previewRef.current.position.z += (targetZ - previewRef.current.position.z) * 0.2;

      previewGlowRef.current.position.copy(previewRef.current.position);

      const pulse = 1 + Math.sin(state.clock.elapsedTime * 6) * 0.08;
      previewGlowRef.current.scale.setScalar(pulse);
    }
  });

  const handleAtomClick = (atomId: string, e: any) => {
    e.stopPropagation();
    if (bondCreationFirstAtom) {
      if (bondCreationFirstAtom !== atomId) {
        addBond(bondCreationFirstAtom, atomId, selectedBondType);
      } else {
        setBondCreationFirstAtom(null);
      }
    } else {
      if (bondCreationFirstAtom === null && atoms.length >= 2) {
        setBondCreationFirstAtom(atomId);
      }
      selectAtom(atomId);
    }
  };

  const handleBondClick = (bondId: string, e: any) => {
    e.stopPropagation();
    setBondCreationFirstAtom(null);
    selectBond(bondId);
  };

  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 5, 5]} intensity={1} color="#ffffff" />
      <directionalLight position={[-5, -3, -5]} intensity={0.3} color="#6688ff" />
      <pointLight position={[0, 5, 0]} intensity={0.5} color="#ffaa66" />

      <Stars radius={100} depth={50} count={800} factor={4} fade speed={0.5} />

      {atoms.map((atom) => (
        <AtomMesh
          key={atom.id}
          atom={atom}
          onClick={(e) => handleAtomClick(atom.id, e)}
          lowPerfMode={lowPerfMode}
        />
      ))}

      {bonds.map((bond) => {
        const atomA = getAtomById(bond.atomA);
        const atomB = getAtomById(bond.atomB);
        if (!atomA || !atomB) return null;
        return (
          <BondMesh
            key={bond.id}
            bond={bond}
            atomA={atomA}
            atomB={atomB}
            onClick={(e) => handleBondClick(bond.id, e)}
          />
        );
      })}

      {particles.map((particle) => (
        <ParticleMesh key={particle.id} particle={particle} />
      ))}

      {bondCreationFirstAtom && (() => {
        const first = getAtomById(bondCreationFirstAtom);
        if (!first) return null;
        return (
          <mesh position={first.position}>
            <sphereGeometry args={[first.radius * 1.5, 24, 24]} />
            <meshBasicMaterial color="#00ffff" transparent opacity={0.15 + Math.sin(Date.now() * 0.005) * 0.1} />
          </mesh>
        );
      })()}

      {draggingElement && (() => {
        const config = ELEMENT_CONFIG[draggingElement];
        const borderColor = isOverScene ? '#4ade80' : '#f87171';
        return (
          <group>
            <mesh ref={previewRef}>
              <sphereGeometry args={[config.radius, 32, 32]} />
              <meshStandardMaterial
                color={config.color}
                transparent
                opacity={0.55}
                emissive={borderColor}
                emissiveIntensity={0.4}
                roughness={0.3}
                metalness={0.2}
              />
            </mesh>
            <mesh ref={previewGlowRef}>
              <sphereGeometry args={[config.radius * 1.6, 24, 24]} />
              <meshBasicMaterial
                color={borderColor}
                transparent
                opacity={isOverScene ? 0.25 : 0.15}
                side={THREE.BackSide}
                depthWrite={false}
              />
            </mesh>
          </group>
        );
      })()}

      <OrbitControls
        enablePan
        enableZoom
        enableRotate
        minDistance={2}
        maxDistance={30}
        makeDefault
      />
    </>
  );
};

export const MoleculeViewer: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mousePositionRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const addAtom = useMoleculeStore((s) => s.addAtom);
  const addParticles = useMoleculeStore((s) => s.addParticles);
  const setIsOverScene = useMoleculeStore((s) => s.setIsOverScene);
  const setDraggingElement = useMoleculeStore((s) => s.setDraggingElement);
  const draggingElement = useMoleculeStore((s) => s.draggingElement);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mousePositionRef.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    mousePositionRef.current = { x: e.clientX, y: e.clientY };
    setIsOverScene(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    if (containerRef.current && !containerRef.current.contains(e.relatedTarget as Node)) {
      setIsOverScene(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsOverScene(false);

    const element = e.dataTransfer.getData('element') as ElementType;
    if (!element || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    const distance = 6;
    const fov = 50;
    const aspect = rect.width / rect.height;
    const height = 2 * Math.tan((fov * Math.PI) / 360) * distance;
    const width = height * aspect;

    const worldPos: [number, number, number] = [
      x * width * 0.5,
      y * height * 0.5,
      0,
    ];

    const config = ELEMENT_CONFIG[element];
    const atomId = addAtom(element, worldPos, true);
    addParticles(worldPos, config.color);

    setTimeout(() => {
      setDraggingElement(null);
    }, 100);
  };

  return (
    <div
      ref={containerRef}
      className="w-full h-full relative"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => {
        useMoleculeStore.getState().setBondCreationFirstAtom(null);
      }}
    >
      <Canvas
        camera={{ position: [0, 2, 8], fov: 50 }}
        gl={{ antialias: true, alpha: true }}
        dpr={[1, 2]}
        style={{ width: '100%', height: '100%' }}
      >
        <fog attach="fog" args={['#0d1117', 10, 30]} />
        <SceneContent containerRef={containerRef} mousePositionRef={mousePositionRef} />
      </Canvas>
      {draggingElement && (
        <div
          className="absolute inset-0 pointer-events-none transition-all duration-200"
          style={{
            boxShadow: `inset 0 0 60px ${
              useMoleculeStore.getState().isOverScene ? 'rgba(74,222,128,0.3)' : 'rgba(248,113,113,0.2)'
            }`,
            border: `2px solid ${
              useMoleculeStore.getState().isOverScene ? 'rgba(74,222,128,0.6)' : 'rgba(248,113,113,0.4)'
            }`,
            borderRadius: 8,
          }}
        />
      )}
    </div>
  );
};
