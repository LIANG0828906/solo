import { useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame, ThreeEvent } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import type { Molecule, Atom, Bond } from '../api';

interface MoleculeViewerProps {
  molecule: Molecule | null;
  atoms: Atom[];
  setAtoms: React.Dispatch<React.SetStateAction<Atom[]>>;
  brokenBonds: Set<string>;
  isTransitioning: boolean;
}

const ELEMENT_PROPS: Record<string, { color: string; radius: number }> = {
  H: { color: '#ffffff', radius: 0.3 },
  C: { color: '#808080', radius: 0.45 },
  O: { color: '#ff4444', radius: 0.5 },
};

interface AtomMeshProps {
  atom: Atom;
  originalPosition: [number, number, number];
  isTransitioning: boolean;
  isSelected: boolean;
  isDragging: boolean;
  onPointerDown: (e: ThreeEvent<PointerEvent>) => void;
  onPointerUp: (e: ThreeEvent<PointerEvent>) => void;
  onPointerMove: (e: ThreeEvent<PointerEvent>) => void;
}

function AtomMesh({
  atom,
  originalPosition,
  isTransitioning,
  isSelected,
  isDragging,
  onPointerDown,
  onPointerUp,
  onPointerMove,
}: AtomMeshProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const scaleRef = useRef(0);
  const positionRef = useRef(new THREE.Vector3(...originalPosition));

  useFrame((_state, delta) => {
    if (!meshRef.current) return;

    const targetScale = isTransitioning ? 0 : 1;
    scaleRef.current += (targetScale - scaleRef.current) * Math.min(delta * 8, 1);
    meshRef.current.scale.setScalar(scaleRef.current);

    if (isTransitioning) {
      const expandFactor = 1 + Math.sin(Date.now() * 0.01) * 0.1;
      meshRef.current.position.set(
        originalPosition[0] * expandFactor,
        originalPosition[1] * expandFactor,
        originalPosition[2] * expandFactor
      );
    } else if (!isDragging) {
      positionRef.current.lerp(
        new THREE.Vector3(atom.position[0], atom.position[1], atom.position[2]),
        Math.min(delta * 10, 1)
      );
      meshRef.current.position.copy(positionRef.current);
    } else {
      meshRef.current.position.set(
        atom.position[0],
        atom.position[1],
        atom.position[2]
      );
    }
  });

  const props = ELEMENT_PROPS[atom.element];

  return (
    <mesh
      ref={meshRef}
      position={originalPosition}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerMove={onPointerMove}
      castShadow
    >
      <sphereGeometry args={[props.radius, 32, 32]} />
      <meshStandardMaterial
        color={props.color}
        metalness={0.3}
        roughness={0.4}
        emissive={isSelected ? props.color : '#000000'}
        emissiveIntensity={isSelected ? 0.5 : 0}
      />
    </mesh>
  );
}

interface BondCylinderProps {
  bond: Bond;
  atom1Position: [number, number, number];
  atom2Position: [number, number, number];
  isBroken: boolean;
  isBreaking: boolean;
}

function BondCylinder({
  bond,
  atom1Position,
  atom2Position,
  isBroken,
  isBreaking,
}: BondCylinderProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const opacityRef = useRef(1);
  const colorRef = useRef(new THREE.Color('#cccccc'));

  const { position, rotation, scale } = useMemo(() => {
    const start = new THREE.Vector3(...atom1Position);
    const end = new THREE.Vector3(...atom2Position);
    const direction = new THREE.Vector3().subVectors(end, start);
    const length = direction.length();
    const midpoint = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);

    const quaternion = new THREE.Quaternion();
    quaternion.setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      direction.clone().normalize()
    );
    const euler = new THREE.Euler().setFromQuaternion(quaternion);

    return {
      position: midpoint,
      rotation: [euler.x, euler.y, euler.z] as [number, number, number],
      scale: [0.1, length, 0.1] as [number, number, number],
    };
  }, [atom1Position, atom2Position]);

  useFrame((_state, delta) => {
    if (!meshRef.current) return;

    const targetOpacity = isBroken ? 0 : 1;
    opacityRef.current += (targetOpacity - opacityRef.current) * Math.min(delta * 10, 1);
    (meshRef.current.material as THREE.MeshStandardMaterial).opacity = opacityRef.current;

    const targetColor = isBreaking
      ? new THREE.Color('#ff0000')
      : new THREE.Color('#cccccc');
    colorRef.current.lerp(targetColor, Math.min(delta * 5, 1));
    (meshRef.current.material as THREE.MeshStandardMaterial).color.copy(colorRef.current);
  });

  return (
    <mesh ref={meshRef} position={position} rotation={rotation} scale={scale}>
      <cylinderGeometry args={[1, 1, 1, 8]} />
      <meshStandardMaterial
        color="#cccccc"
        transparent
        opacity={1}
        metalness={0.1}
        roughness={0.8}
      />
    </mesh>
  );
}

interface MoleculeSceneProps {
  molecule: Molecule | null;
  atoms: Atom[];
  setAtoms: React.Dispatch<React.SetStateAction<Atom[]>>;
  brokenBonds: Set<string>;
  isTransitioning: boolean;
}

function MoleculeScene({
  molecule,
  atoms,
  setAtoms,
  brokenBonds,
  isTransitioning,
}: MoleculeSceneProps) {
  const [selectedAtomId, setSelectedAtomId] = useState<string | null>(null);
  const [draggingAtomId, setDraggingAtomId] = useState<string | null>(null);
  const [breakingBonds, setBreakingBonds] = useState<Set<string>>(new Set());
  const raycasterRef = useRef(new THREE.Raycaster());
  const planeRef = useRef(new THREE.Plane());
  const dragStartRef = useRef<THREE.Vector3 | null>(null);
  const controlsRef = useRef<any>(null);

  const atomPositionMap = useMemo(() => {
    const map = new Map<string, [number, number, number]>();
    atoms.forEach((atom) => map.set(atom.id, atom.position));
    return map;
  }, [atoms]);

  const originalPositionMap = useMemo(() => {
    const map = new Map<string, [number, number, number]>();
    molecule?.atoms.forEach((atom) => map.set(atom.id, atom.position));
    return map;
  }, [molecule]);

  const handlePointerDown = (atomId: string) => (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    if (molecule?.id !== 'c6h6') return;
    const atom = atoms.find((a) => a.id === atomId);
    if (!atom || atom.element !== 'H') return;

    setSelectedAtomId(atomId);
    setDraggingAtomId(atomId);
    dragStartRef.current = new THREE.Vector3(
      atom.position[0],
      atom.position[1],
      atom.position[2]
    );

    if (controlsRef.current) {
      controlsRef.current.enabled = false;
    }

    const camera = e.camera;
    const normal = new THREE.Vector3();
    camera.getWorldDirection(normal);
    planeRef.current.setFromNormalAndCoplanarPoint(
      normal,
      new THREE.Vector3(...atom.position)
    );

    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (atomId: string) => (e: ThreeEvent<PointerEvent>) => {
    if (draggingAtomId !== atomId || !dragStartRef.current) return;
    e.stopPropagation();

    const startTime = performance.now();

    const mouse = new THREE.Vector2(
      (e.clientX / window.innerWidth) * 2 - 1,
      -(e.clientY / window.innerHeight) * 2 + 1
    );

    raycasterRef.current.setFromCamera(mouse, e.camera);
    const intersection = new THREE.Vector3();
    raycasterRef.current.ray.intersectPlane(planeRef.current, intersection);

    if (intersection) {
      setAtoms((prev) =>
        prev.map((a) =>
          a.id === atomId
            ? { ...a, position: [intersection.x, intersection.y, intersection.z] as [number, number, number] }
            : a
        )
      );

      const responseTime = performance.now() - startTime;
      if (responseTime > 50) {
        console.warn(`Atom drag response took ${responseTime}ms`);
      }
    }
  };

  const handlePointerUp = (atomId: string) => (e: ThreeEvent<PointerEvent>) => {
    if (draggingAtomId !== atomId) return;
    e.stopPropagation();

    setDraggingAtomId(null);
    setSelectedAtomId(null);
    setBreakingBonds(new Set());

    if (controlsRef.current) {
      controlsRef.current.enabled = true;
    }

    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
  };

  useEffect(() => {
    if (!molecule) return;

    const newBreakingBonds = new Set<string>();
    atoms.forEach((atom) => {
      if (atom.element !== 'H') return;

      const originalPos = originalPositionMap.get(atom.id);
      if (!originalPos) return;

      const bond = molecule.bonds.find(
        (b) => b.atom1Id === atom.id || b.atom2Id === atom.id
      );
      if (!bond) return;

      const currentPos = atom.position;
      const dx = currentPos[0] - originalPos[0];
      const dy = currentPos[1] - originalPos[1];
      const dz = currentPos[2] - originalPos[2];
      const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

      if (distance > bond.bondLength * 1.5) {
        newBreakingBonds.add(bond.id);
      }
    });

    setBreakingBonds(newBreakingBonds);
  }, [atoms, molecule, originalPositionMap]);

  if (!molecule) return null;

  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 5, 5]} intensity={1} castShadow />
      <pointLight position={[-5, -5, -5]} intensity={0.5} />
      <pointLight position={[0, 5, 0]} intensity={0.3} />

      {molecule.bonds.map((bond) => {
        const pos1 = atomPositionMap.get(bond.atom1Id);
        const pos2 = atomPositionMap.get(bond.atom2Id);
        if (!pos1 || !pos2) return null;

        return (
          <BondCylinder
            key={bond.id}
            bond={bond}
            atom1Position={pos1}
            atom2Position={pos2}
            isBroken={brokenBonds.has(bond.id)}
            isBreaking={breakingBonds.has(bond.id)}
          />
        );
      })}

      {atoms.map((atom) => {
        const originalPos = originalPositionMap.get(atom.id) || atom.position;
        return (
          <AtomMesh
            key={atom.id}
            atom={atom}
            originalPosition={originalPos}
            isTransitioning={isTransitioning}
            isSelected={selectedAtomId === atom.id}
            isDragging={draggingAtomId === atom.id}
            onPointerDown={handlePointerDown(atom.id)}
            onPointerUp={handlePointerUp(atom.id)}
            onPointerMove={handlePointerMove(atom.id)}
          />
        );
      })}

      <OrbitControls
        ref={controlsRef}
        enableDamping
        dampingFactor={0.05}
        minDistance={2}
        maxDistance={15}
      />
    </>
  );
}

function MoleculeViewer({
  molecule,
  atoms,
  setAtoms,
  brokenBonds,
  isTransitioning,
}: MoleculeViewerProps) {
  return (
    <Canvas
      camera={{ position: [0, 3, 5], fov: 60 }}
      style={{ width: '100%', height: '100%' }}
      gl={{ antialias: true, alpha: true }}
      dpr={[1, 2]}
    >
      <MoleculeScene
        molecule={molecule}
        atoms={atoms}
        setAtoms={setAtoms}
        brokenBonds={brokenBonds}
        isTransitioning={isTransitioning}
      />
    </Canvas>
  );
}

export default MoleculeViewer;
