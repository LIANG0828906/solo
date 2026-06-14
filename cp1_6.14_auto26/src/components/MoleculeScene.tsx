import { useRef, useMemo, useEffect, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import type { ParsedMolecule, DisplayMode } from '@/types';
import { ELEMENT_INFO, DEFAULT_ELEMENT, HIGHLIGHT_COLOR, BACKGROUND_COLOR } from '@/constants/elements';

interface MoleculeSceneProps {
  molecule: ParsedMolecule;
  displayMode: DisplayMode;
  highlightedAtomIds: Set<string>;
  onAtomClick: (atomId: string) => void;
  autoRotate: boolean;
  rotationSpeed: number;
}

interface BondTransform {
  position: [number, number, number];
  rotation: [number, number, number];
  length: number;
  atom1Element: string;
  atom2Element: string;
  order: number;
}

function computeBondTransforms(
  molecule: ParsedMolecule,
  atomPositions: Map<string, [number, number, number]>
): BondTransform[] {
  return molecule.bonds.map((bond) => {
    const pos1 = atomPositions.get(bond.atom1Id)!;
    const pos2 = atomPositions.get(bond.atom2Id)!;
    const atom1 = molecule.atoms.find((a) => a.id === bond.atom1Id)!;
    const atom2 = molecule.atoms.find((a) => a.id === bond.atom2Id)!;

    const dx = pos2[0] - pos1[0];
    const dy = pos2[1] - pos1[1];
    const dz = pos2[2] - pos1[2];
    const length = Math.sqrt(dx * dx + dy * dy + dz * dz);

    const cx = (pos1[0] + pos2[0]) / 2;
    const cy = (pos1[1] + pos2[1]) / 2;
    const cz = (pos1[2] + pos2[2]) / 2;

    const axis = new THREE.Vector3(dx, dy, dz).normalize();
    const up = new THREE.Vector3(0, 1, 0);
    const quaternion = new THREE.Quaternion().setFromUnitVectors(up, axis);
    const euler = new THREE.Euler().setFromQuaternion(quaternion);

    return {
      position: [cx, cy, cz],
      rotation: [euler.x, euler.y, euler.z],
      length,
      atom1Element: atom1.element,
      atom2Element: atom2.element,
      order: bond.order,
    };
  });
}

interface AtomMeshProps {
  id: string;
  element: string;
  basePosition: [number, number, number];
  displayMode: DisplayMode;
  highlighted: boolean;
  onClick: (id: string) => void;
  transitionProgress: number;
}

function AtomMesh({
  id,
  element,
  basePosition,
  displayMode,
  highlighted,
  onClick,
  transitionProgress,
}: AtomMeshProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const info = ELEMENT_INFO[element] || DEFAULT_ELEMENT;

  const targetRadius = displayMode === 'ball-stick' ? info.radius : info.vanDerWaalsRadius * 0.5;
  const displayRadius = useRef(info.radius);

  useFrame(() => {
    const current = displayRadius.current;
    const diff = targetRadius - current;
    displayRadius.current = current + diff * 0.12 * transitionProgress;

    if (meshRef.current) {
      meshRef.current.scale.setScalar(displayRadius.current / info.radius);
    }
    if (glowRef.current) {
      const glowScale = (displayRadius.current / info.radius) * 1.25;
      glowRef.current.scale.setScalar(glowScale);
    }
  });

  const baseColor = new THREE.Color(info.color);
  const highlightColor = new THREE.Color(HIGHLIGHT_COLOR);
  const finalColor = highlighted ? highlightColor : baseColor;

  const emissiveIntensity = highlighted ? 0.8 : 0;

  return (
    <group position={basePosition}>
      <mesh
        ref={meshRef}
        onClick={(e) => {
          e.stopPropagation();
          onClick(id);
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          document.body.style.cursor = 'default';
        }}
      >
        <sphereGeometry args={[info.radius, 32, 32]} />
        <meshStandardMaterial
          color={finalColor}
          emissive={finalColor}
          emissiveIntensity={emissiveIntensity}
          roughness={0.3}
          metalness={0.1}
        />
      </mesh>
      {highlighted && (
        <mesh ref={glowRef} scale={1.25}>
          <sphereGeometry args={[info.radius, 32, 32]} />
          <meshBasicMaterial color={HIGHLIGHT_COLOR} transparent opacity={0.25} side={THREE.BackSide} />
        </mesh>
      )}
    </group>
  );
}

interface BondMeshProps {
  transform: BondTransform;
  displayMode: DisplayMode;
  transitionProgress: number;
}

function BondMesh({ transform, displayMode, transitionProgress }: BondMeshProps) {
  const groupRef = useRef<THREE.Group>(null);
  const info1 = ELEMENT_INFO[transform.atom1Element] || DEFAULT_ELEMENT;
  const info2 = ELEMENT_INFO[transform.atom2Element] || DEFAULT_ELEMENT;

  const targetVisible = displayMode === 'ball-stick';
  const opacityRef = useRef(1);

  const bondRadius = 0.12;
  const halfLength = transform.length / 2;

  useFrame(() => {
    const targetOpacity = targetVisible ? 1 : 0;
    opacityRef.current = opacityRef.current + (targetOpacity - opacityRef.current) * 0.15 * transitionProgress;

    if (groupRef.current) {
      groupRef.current.visible = opacityRef.current > 0.01;
      groupRef.current.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;
          const mat = mesh.material as THREE.MeshStandardMaterial;
          if (mat.opacity !== undefined) {
            mat.opacity = opacityRef.current;
          }
        }
      });
    }
  });

  const renderBondCylinders = () => {
    const cylinders: JSX.Element[] = [];
    const order = transform.order;
    const offsets = order === 1 ? [0] : order === 2 ? [-0.12, 0.12] : [-0.18, 0, 0.18];

    offsets.forEach((offset, idx) => {
      const leftOffset = new THREE.Vector3(offset, 0, 0);
      const rightOffset = new THREE.Vector3(offset, 0, 0);

      cylinders.push(
        <mesh
          key={`left-${idx}`}
          position={[0, -halfLength / 2, 0]}
        >
          <cylinderGeometry args={[bondRadius, bondRadius, halfLength, 16]} />
          <meshStandardMaterial
            color={info1.color}
            roughness={0.4}
            metalness={0.05}
            transparent
            opacity={1}
          />
        </mesh>
      );

      cylinders.push(
        <mesh
          key={`right-${idx}`}
          position={[0, halfLength / 2, 0]}
        >
          <cylinderGeometry args={[bondRadius, bondRadius, halfLength, 16]} />
          <meshStandardMaterial
            color={info2.color}
            roughness={0.4}
            metalness={0.05}
            transparent
            opacity={1}
          />
        </mesh>
      );

      void leftOffset;
      void rightOffset;
    });

    return cylinders;
  };

  return (
    <group
      ref={groupRef}
      position={transform.position}
      rotation={transform.rotation}
    >
      {renderBondCylinders()}
    </group>
  );
}

interface AutoRotateGroupProps {
  autoRotate: boolean;
  speed: number;
  children: React.ReactNode;
}

function AutoRotateGroup({ autoRotate, speed, children }: AutoRotateGroupProps) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (autoRotate && groupRef.current) {
      groupRef.current.rotation.y += delta * speed * 0.5;
    }
  });

  return <group ref={groupRef}>{children}</group>;
}

interface CameraControllerProps {
  target: [number, number, number];
  radius: number;
  resetTrigger: number;
}

function CameraController({ target, radius, resetTrigger }: CameraControllerProps) {
  const { camera } = useThree();
  const controlsRef = useRef<any>(null);
  const prevReset = useRef(resetTrigger);

  useEffect(() => {
    if (resetTrigger !== prevReset.current) {
      prevReset.current = resetTrigger;
      const distance = Math.max(radius * 2.5, 8);
      camera.position.set(target[0], target[1] + distance * 0.6, target[2] + distance);
      camera.lookAt(target[0], target[1], target[2]);
      if (controlsRef.current) {
        controlsRef.current.target.set(target[0], target[1], target[2]);
        controlsRef.current.update();
      }
    }
  }, [resetTrigger, target, radius, camera]);

  return (
    <OrbitControls
      ref={controlsRef}
      enableDamping
      dampingFactor={0.08}
      minDistance={2}
      maxDistance={200}
      makeDefault
    />
  );
}

function SceneContent({
  molecule,
  displayMode,
  highlightedAtomIds,
  onAtomClick,
  autoRotate,
  rotationSpeed,
  resetTrigger,
}: MoleculeSceneProps & { resetTrigger: number }) {
  const [transitionProgress, setTransitionProgress] = useState(1);
  const prevDisplayMode = useRef(displayMode);

  useEffect(() => {
    if (prevDisplayMode.current !== displayMode) {
      prevDisplayMode.current = displayMode;
      setTransitionProgress(0);
      const startTime = performance.now();
      const duration = 400;
      const animate = () => {
        const elapsed = performance.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        setTransitionProgress(eased);
        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };
      requestAnimationFrame(animate);
    }
  }, [displayMode]);

  const atomPositions = useMemo(() => {
    const map = new Map<string, [number, number, number]>();
    molecule.atoms.forEach((atom) => {
      map.set(atom.id, atom.position);
    });
    return map;
  }, [molecule.atoms]);

  const bondTransforms = useMemo(
    () => computeBondTransforms(molecule, atomPositions),
    [molecule, atomPositions]
  );

  const bounds = useMemo(() => {
    let minX = Infinity,
      minY = Infinity,
      minZ = Infinity;
    let maxX = -Infinity,
      maxY = -Infinity,
      maxZ = -Infinity;

    molecule.atoms.forEach((atom) => {
      const [x, y, z] = atom.position;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      minZ = Math.min(minZ, z);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
      maxZ = Math.max(maxZ, z);
    });

    const center: [number, number, number] = [(minX + maxX) / 2, (minY + maxY) / 2, (minZ + maxZ) / 2];
    const size = Math.max(maxX - minX, maxY - minY, maxZ - minZ);
    const radius = size / 2;

    return { center, radius };
  }, [molecule.atoms]);

  const centeredAtoms = useMemo(() => {
    return molecule.atoms.map((atom) => ({
      ...atom,
      centeredPosition: [
        atom.position[0] - bounds.center[0],
        atom.position[1] - bounds.center[1],
        atom.position[2] - bounds.center[2],
      ] as [number, number, number],
    }));
  }, [molecule.atoms, bounds.center]);

  const centeredBondTransforms = useMemo(() => {
    return bondTransforms.map((t) => ({
      ...t,
      position: [
        t.position[0] - bounds.center[0],
        t.position[1] - bounds.center[1],
        t.position[2] - bounds.center[2],
      ] as [number, number, number],
    }));
  }, [bondTransforms, bounds.center]);

  return (
    <>
      <PerspectiveCamera makeDefault position={[0, bounds.radius * 1.2, bounds.radius * 2.2]} fov={45} />
      <CameraController target={[0, 0, 0]} radius={bounds.radius} resetTrigger={resetTrigger} />

      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1.0} castShadow />
      <directionalLight position={[-10, -5, -10]} intensity={0.4} />
      <pointLight position={[0, 10, 0]} intensity={0.5} />
      <pointLight position={[0, -10, -10]} intensity={0.3} />

      <AutoRotateGroup autoRotate={autoRotate} speed={rotationSpeed}>
        {centeredAtoms.map((atom) => (
          <AtomMesh
            key={atom.id}
            id={atom.id}
            element={atom.element}
            basePosition={atom.centeredPosition}
            displayMode={displayMode}
            highlighted={highlightedAtomIds.has(atom.id)}
            onClick={onAtomClick}
            transitionProgress={transitionProgress}
          />
        ))}
        {centeredBondTransforms.map((transform, idx) => (
          <BondMesh
            key={`bond-${idx}`}
            transform={transform}
            displayMode={displayMode}
            transitionProgress={transitionProgress}
          />
        ))}
      </AutoRotateGroup>
    </>
  );
}

export default function MoleculeScene(props: MoleculeSceneProps) {
  const [resetTrigger, setResetTrigger] = useState(0);

  useEffect(() => {
    const handleReset = () => setResetTrigger((t) => t + 1);
    window.addEventListener('reset-camera', handleReset);
    return () => window.removeEventListener('reset-camera', handleReset);
  }, []);

  void props.autoRotate;
  void props.rotationSpeed;

  return (
    <Canvas
      shadows
      gl={{ antialias: true, alpha: false }}
      style={{ background: BACKGROUND_COLOR }}
      dpr={[1, 2]}
    >
      <color attach="background" args={[BACKGROUND_COLOR]} />
      <fog attach="fog" args={[BACKGROUND_COLOR, 50, 150]} />
      <SceneContent {...props} resetTrigger={resetTrigger} />
    </Canvas>
  );
}
