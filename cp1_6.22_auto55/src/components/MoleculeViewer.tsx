import React, { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Text, Stars, Float } from '@react-three/drei';
import * as THREE from 'three';
import { Molecule, Atom, Bond, CPK_COLORS, ATOM_RADIUS, ReactionResult } from '@/types';

interface AtomComponentProps {
  atom: Atom;
  scale: number;
  isSelected: boolean;
  onClick: () => void;
  opacity: number;
  animationProgress: number;
  targetPosition?: [number, number, number];
}

const AtomComponent: React.FC<AtomComponentProps> = ({
  atom,
  scale,
  isSelected,
  onClick,
  opacity,
  animationProgress,
  targetPosition,
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const baseRadius = (ATOM_RADIUS[atom.element] || ATOM_RADIUS.default) * scale;

  const currentPosition = useMemo(() => {
    if (targetPosition && animationProgress > 0) {
      const t = Math.min(animationProgress, 1);
      return [
        atom.x + (targetPosition[0] - atom.x) * t,
        atom.y + (targetPosition[1] - atom.y) * t,
        atom.z + (targetPosition[2] - atom.z) * t,
      ] as [number, number, number];
    }
    return [atom.x, atom.y, atom.z] as [number, number, number];
  }, [atom, targetPosition, animationProgress]);

  useFrame(({ clock }) => {
    if (meshRef.current) {
      if (isSelected) {
        const pulse = 1 + Math.sin(clock.elapsedTime * 8) * 0.15;
        meshRef.current.scale.setScalar(pulse);
      } else {
        meshRef.current.scale.setScalar(1);
      }
    }
  });

  const color = CPK_COLORS[atom.element] || '#888888';
  const emissive = isSelected ? color : hovered ? color : '#000000';
  const emissiveIntensity = isSelected ? 0.5 : hovered ? 0.2 : 0;

  return (
    <group position={currentPosition}>
      <mesh
        ref={meshRef}
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          setHovered(false);
          document.body.style.cursor = 'auto';
        }}
      >
        <sphereGeometry args={[baseRadius, 32, 32]} />
        <meshStandardMaterial
          color={color}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
          metalness={0.3}
          roughness={0.4}
          transparent
          opacity={opacity}
        />
      </mesh>
      {(isSelected || hovered) && (
        <Text
          position={[0, baseRadius + 0.3, 0]}
          fontSize={0.25}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
          renderOrder={100}
        >
          {atom.element}
        </Text>
      )}
    </group>
  );
};

interface BondComponentProps {
  bond: Bond;
  atoms: Atom[];
  scale: number;
  opacity: number;
  breakProgress: number;
}

const BondComponent: React.FC<BondComponentProps> = ({ bond, atoms, scale, opacity, breakProgress }) => {
  const atom1 = atoms.find(a => a.id === bond.atom1);
  const atom2 = atoms.find(a => a.id === bond.atom2);

  if (!atom1 || !atom2) return null;

  const start = new THREE.Vector3(atom1.x, atom1.y, atom1.z);
  const end = new THREE.Vector3(atom2.x, atom2.y, atom2.z);
  const direction = end.clone().sub(start);
  const length = direction.length();
  const midPoint = start.clone().add(end).multiplyScalar(0.5);

  const brokenOffset = breakProgress > 0 ? (Math.random() - 0.5) * breakProgress * 2 : 0;

  const bondRadius = 0.12 * scale;

  const renderBond = (offset: number, rad: number) => {
    const position = midPoint.clone();
    const perp = new THREE.Vector3().crossVectors(direction, new THREE.Vector3(0, 1, 0)).normalize();
    if (perp.length() === 0) perp.set(1, 0, 0);
    position.add(perp.multiplyScalar(offset));

    const quaternion = new THREE.Quaternion();
    quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.clone().normalize());

    return (
      <mesh
        key={offset}
        position={[position.x + brokenOffset, position.y, position.z + brokenOffset]}
        quaternion={quaternion}
      >
        <cylinderGeometry args={[rad, rad, length * (1 - breakProgress), 16]} />
        <meshStandardMaterial
          color="#8899aa"
          transparent
          opacity={opacity * 0.7}
          metalness={0.5}
          roughness={0.3}
        />
      </mesh>
    );
  };

  if (bond.type === 'aromatic') {
    return (
      <group>
        {renderBond(0, bondRadius * 0.5)}
        <mesh position={midPoint.toArray()}>
          <torusGeometry args={[length * 0.3, bondRadius * 0.25, 8, 32]} />
          <meshStandardMaterial
            color="#8899aa"
            transparent
            opacity={opacity * 0.4}
            side={THREE.DoubleSide}
          />
        </mesh>
      </group>
    );
  }

  if (bond.type === 'double') {
    return (
      <group>
        {renderBond(-bondRadius * 1.2, bondRadius * 0.8)}
        {renderBond(bondRadius * 1.2, bondRadius * 0.8)}
      </group>
    );
  }

  if (bond.type === 'triple') {
    return (
      <group>
        {renderBond(-bondRadius * 1.8, bondRadius * 0.7)}
        {renderBond(0, bondRadius * 0.7)}
        {renderBond(bondRadius * 1.8, bondRadius * 0.7)}
      </group>
    );
  }

  return renderBond(0, bondRadius);
};

interface MoleculeGroupProps {
  molecule: Molecule;
  position: [number, number, number];
  scale: number;
  selectedAtomId: string | null;
  onAtomClick: (atomId: string) => void;
  opacity: number;
  isPreview?: boolean;
  breakProgress: number;
  animationProgress: number;
  atomTargets?: Record<string, [number, number, number]>;
  autoRotate?: boolean;
  appearProgress?: number;
}

const MoleculeGroup: React.FC<MoleculeGroupProps> = ({
  molecule,
  position,
  scale,
  selectedAtomId,
  onAtomClick,
  opacity,
  isPreview,
  breakProgress,
  animationProgress,
  atomTargets,
  autoRotate,
  appearProgress = 1,
}) => {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (groupRef.current && autoRotate) {
      groupRef.current.rotation.y += 0.005;
    }
  });

  const displayScale = scale * (0.1 + 0.9 * appearProgress);

  return (
    <group ref={groupRef} position={position} scale={displayScale}>
      {molecule.bonds.map(bond => (
        <BondComponent
          key={bond.id}
          bond={bond}
          atoms={molecule.atoms}
          scale={scale}
          opacity={opacity * (1 - breakProgress)}
          breakProgress={breakProgress}
        />
      ))}
      {molecule.atoms.map(atom => (
        <AtomComponent
          key={atom.id}
          atom={atom}
          scale={scale}
          isSelected={selectedAtomId === atom.id}
          onClick={() => onAtomClick(atom.id)}
          opacity={isPreview ? opacity * 0.5 : opacity}
          animationProgress={animationProgress}
          targetPosition={atomTargets?.[atom.id]}
        />
      ))}
    </group>
  );
};

interface ReactionParticlesProps {
  active: boolean;
  progress: number;
}

const ReactionParticles: React.FC<ReactionParticlesProps> = ({ active, progress }) => {
  const pointsRef = useRef<THREE.Points>(null);
  const particleCount = 200;

  const [positions, velocities] = useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    const vel = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 0.1 + Math.random() * 0.5;
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi);

      vel[i * 3] = (Math.random() - 0.5) * 2;
      vel[i * 3 + 1] = (Math.random() - 0.5) * 2;
      vel[i * 3 + 2] = (Math.random() - 0.5) * 2;
    }
    return [pos, vel];
  }, []);

  useFrame(() => {
    if (!pointsRef.current || !active) return;
    const positions = pointsRef.current.geometry.attributes.position.array as Float32Array;
    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] += velocities[i * 3] * 0.02 * progress;
      positions[i * 3 + 1] += velocities[i * 3 + 1] * 0.02 * progress;
      positions[i * 3 + 2] += velocities[i * 3 + 2] * 0.02 * progress;
    }
    pointsRef.current.geometry.attributes.position.needsUpdate = true;
  });

  if (!active) return null;

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particleCount}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.1}
        color="#4da6ff"
        transparent
        opacity={0.8 * (1 - progress)}
        sizeAttenuation
      />
    </points>
  );
};

interface SceneStatsProps {
  rotationSpeed: number;
  zoomLevel: number;
}

const SceneStats: React.FC<SceneStatsProps> = ({ rotationSpeed, zoomLevel }) => {
  return (
    <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-sm rounded-lg p-3 text-white text-sm font-mono z-10">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-gray-400">旋转速度:</span>
        <span className={rotationSpeed > 30 ? 'text-yellow-400' : 'text-green-400'}>
          {rotationSpeed.toFixed(1)}°/s
        </span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-gray-400">缩放比例:</span>
        <span className="text-blue-400">{zoomLevel.toFixed(2)}x</span>
      </div>
    </div>
  );
};

interface MotionBlurEffectProps {
  intensity: number;
}

const MotionBlurEffect: React.FC<MotionBlurEffectProps> = ({ intensity }) => {
  if (intensity <= 0) return null;
  return (
    <div
      className="absolute inset-0 pointer-events-none z-5"
      style={{
        boxShadow: `inset 0 0 ${50 * intensity}px ${20 * intensity}px rgba(0, 0, 0, ${0.3 * intensity})`,
        filter: `blur(${2 * intensity}px)`,
        transition: 'all 0.3s ease',
      }}
    />
  );
};

interface GridFloorProps {}

const GridFloor: React.FC<GridFloorProps> = () => {
  return (
    <gridHelper
      args={[20, 20, 0x334455, 0x223344]}
      position={[0, -3, 0]}
      rotation={[0, 0, 0]}
    />
  );
};

interface CameraControllerProps {
  onRotationSpeedChange: (speed: number) => void;
  onZoomChange: (zoom: number) => void;
}

const CameraController: React.FC<CameraControllerProps> = ({ onRotationSpeedChange, onZoomChange }) => {
  const { camera } = useThree();
  const controlsRef = useRef<any>(null);
  const lastThetaRef = useRef(0);
  const lastPhiRef = useRef(0);

  useFrame(({ clock }) => {
    if (controlsRef.current) {
      const { theta, phi } = controlsRef.current.getSpherical();
      const deltaTheta = Math.abs(theta - lastThetaRef.current);
      const deltaPhi = Math.abs(phi - lastPhiRef.current);
      const speed = ((deltaTheta + deltaPhi) * 180) / Math.PI * 60;
      onRotationSpeedChange(speed);
      lastThetaRef.current = theta;
      lastPhiRef.current = phi;

      const distance = camera.position.length();
      const zoom = 6 / distance;
      onZoomChange(zoom);
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      enableDamping
      dampingFactor={0.05}
      minDistance={2}
      maxDistance={20}
      enablePan={false}
    />
  );
};

interface MoleculeViewerProps {
  primaryMolecule: Molecule | null;
  secondaryMolecule: Molecule | null;
  reactionResult: ReactionResult | null;
  isReacting: boolean;
  reactionProgress: number;
  dragPreviewMolecule: Molecule | null;
  dragPosition: { x: number; y: number } | null;
  onDrop: (position: { x: number; y: number }) => void;
  onAtomClick: (moleculeId: string, atomId: string) => void;
  selectedAtom: { moleculeId: string; atomId: string } | null;
}

const MoleculeViewer: React.FC<MoleculeViewerProps> = ({
  primaryMolecule,
  secondaryMolecule,
  reactionResult,
  isReacting,
  reactionProgress,
  dragPreviewMolecule,
  dragPosition,
  onDrop,
  onAtomClick,
  selectedAtom,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [rotationSpeed, setRotationSpeed] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [appearProgress, setAppearProgress] = useState(0);
  const [autoRotate, setAutoRotate] = useState(false);

  useEffect(() => {
    if (primaryMolecule) {
      setAppearProgress(0);
      const startTime = Date.now();
      const animate = () => {
        const elapsed = (Date.now() - startTime) / 600;
        const progress = Math.min(1, 1 - Math.pow(1 - elapsed, 3));
        setAppearProgress(progress);
        if (progress < 1) requestAnimationFrame(animate);
      };
      requestAnimationFrame(animate);
    }
  }, [primaryMolecule?.id]);

  useEffect(() => {
    if (reactionResult && reactionProgress >= 1) {
      setAutoRotate(true);
    } else {
      setAutoRotate(false);
    }
  }, [reactionResult, reactionProgress]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      onDrop({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    }
  };

  const previewPosition = useMemo((): [number, number, number] => {
    if (!dragPosition || !containerRef.current) return [0, 0, 0];
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((dragPosition.x / rect.width) * 2 - 1) * 4;
    const y = (-(dragPosition.y / rect.height) * 2 + 1) * 3;
    return [x, y, 0];
  }, [dragPosition]);

  const motionBlurIntensity = Math.max(0, (rotationSpeed - 30) / 50);

  const atomTargets = useMemo(() => {
    if (!reactionResult || !isReacting) return undefined;
    const targets: Record<string, [number, number, number]> = {};
    Object.entries(reactionResult.atomMapping).forEach(([sourceId, targetId]) => {
      const targetAtom = reactionResult.product.atoms.find(a => a.id === targetId);
      if (targetAtom) {
        targets[sourceId] = [targetAtom.x, targetAtom.y, targetAtom.z];
      }
    });
    return targets;
  }, [reactionResult, isReacting]);

  const displayMolecule = reactionResult && reactionProgress >= 1
    ? reactionResult.product
    : primaryMolecule;

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full bg-[#1a1a2e]"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <MotionBlurEffect intensity={motionBlurIntensity} />
      <SceneStats rotationSpeed={rotationSpeed} zoomLevel={zoomLevel} />

      <Canvas
        camera={{ position: [0, 0, 6], fov: 50 }}
        gl={{ antialias: true, alpha: false }}
        dpr={[1, 2]}
      >
        <color attach="background" args={['#1a1a2e']} />
        <fog attach="fog" args={['#1a1a2e', 10, 25]} />

        <ambientLight intensity={0.4} />
        <hemisphereLight args={['#607080', '#203040', 0.6]} />
        <directionalLight position={[5, 5, 5]} intensity={0.8} castShadow />
        <directionalLight position={[-5, -3, -5]} intensity={0.4} />

        <Stars radius={50} depth={50} count={3000} factor={4} saturation={0} fade speed={0.5} />
        <GridFloor />

        <CameraController
          onRotationSpeedChange={setRotationSpeed}
          onZoomChange={setZoomLevel}
        />

        {displayMolecule && (
          <Float speed={autoRotate ? 0 : 1} rotationIntensity={autoRotate ? 0 : 0.2} floatIntensity={autoRotate ? 0 : 0.3}>
            <MoleculeGroup
              molecule={displayMolecule}
              position={[0, 0, 0]}
              scale={1}
              selectedAtomId={selectedAtom?.moleculeId === displayMolecule.id ? selectedAtom.atomId : null}
              onAtomClick={(atomId) => onAtomClick(displayMolecule.id, atomId)}
              opacity={isReacting ? 1 - reactionProgress * 0.3 : 1}
              breakProgress={isReacting ? Math.min(1, reactionProgress * 1.5) : 0}
              animationProgress={0}
              autoRotate={autoRotate}
              appearProgress={appearProgress}
            />
          </Float>
        )}

        {secondaryMolecule && !isReacting && (
          <MoleculeGroup
            molecule={secondaryMolecule}
            position={[3, 0, 0]}
            scale={1}
            selectedAtomId={selectedAtom?.moleculeId === secondaryMolecule.id ? selectedAtom.atomId : null}
            onAtomClick={(atomId) => onAtomClick(secondaryMolecule.id, atomId)}
            opacity={1}
            breakProgress={0}
            animationProgress={0}
          />
        )}

        {isReacting && secondaryMolecule && (
          <MoleculeGroup
            molecule={secondaryMolecule}
            position={[3 * (1 - reactionProgress * 0.5), 0, 0]}
            scale={1}
            selectedAtomId={null}
            onAtomClick={() => {}}
            opacity={1 - reactionProgress}
            breakProgress={Math.min(1, reactionProgress * 1.5)}
            animationProgress={reactionProgress}
            atomTargets={atomTargets}
          />
        )}

        {reactionResult && isReacting && reactionProgress > 0.3 && (
          <MoleculeGroup
            molecule={reactionResult.product}
            position={[0, 0, 0]}
            scale={1}
            selectedAtomId={null}
            onAtomClick={() => {}}
            opacity={Math.max(0, (reactionProgress - 0.3) / 0.7)}
            breakProgress={0}
            animationProgress={0}
            appearProgress={Math.max(0, (reactionProgress - 0.3) / 0.7)}
          />
        )}

        {dragPreviewMolecule && (
          <MoleculeGroup
            molecule={dragPreviewMolecule}
            position={previewPosition}
            scale={1}
            selectedAtomId={null}
            onAtomClick={() => {}}
            opacity={0.6}
            isPreview
            breakProgress={0}
            animationProgress={0}
          />
        )}

        <ReactionParticles active={isReacting} progress={reactionProgress} />
      </Canvas>

      {!primaryMolecule && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <p className="text-gray-400 text-xl mb-2">从左侧面板选择一个分子开始</p>
            <p className="text-gray-500 text-sm">点击卡片或拖拽到场景中</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default MoleculeViewer;
