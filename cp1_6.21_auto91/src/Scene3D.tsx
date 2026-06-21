import React, { useRef, useMemo, useEffect, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, TransformControls } from '@react-three/drei';
import * as THREE from 'three';
import { Molecule, LigandPosition, Atom, Bond, ATOM_COLORS } from './types';

interface Scene3DProps {
  protein: Molecule | null;
  ligand: Molecule | null;
  ligandPosition: LigandPosition;
  onLigandPositionChange: (position: LigandPosition) => void;
  conflictAtomPairs?: Array<{ proteinAtomIndex: number; ligandAtomIndex: number; distance: number }>;
  viewResetKey?: number;
  onSnapshot?: (dataUrl: string) => void;
  snapshotKey?: number;
}

function AtomMesh({ atom, scale = 1, color }: { atom: Atom; scale?: number; color?: string }) {
  const radius = atom.vdwRadius * 0.3 * scale;
  const atomColor = color || ATOM_COLORS[atom.element] || '#808080';

  return (
    <mesh position={[atom.x, atom.y, atom.z]}>
      <sphereGeometry args={[radius, 16, 16]} />
      <meshStandardMaterial color={atomColor} roughness={0.4} metalness={0.1} />
    </mesh>
  );
}

function BondMesh({ atom1, atom2, color = '#FFFFFF', radius = 0.1 }: { atom1: Atom; atom2: Atom; color?: string; radius?: number }) {
  const meshRef = useRef<THREE.Mesh>(null);

  useMemo(() => {
    if (!meshRef.current) return;

    const start = new THREE.Vector3(atom1.x, atom1.y, atom1.z);
    const end = new THREE.Vector3(atom2.x, atom2.y, atom2.z);
    const direction = new THREE.Vector3().subVectors(end, start);
    const length = direction.length();

    meshRef.current.position.copy(start);
    meshRef.current.position.add(direction.clone().multiplyScalar(0.5));
    meshRef.current.quaternion.setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      direction.clone().normalize()
    );

    if (meshRef.current.geometry) {
      meshRef.current.geometry.dispose();
    }
    meshRef.current.geometry = new THREE.CylinderGeometry(radius, radius, length, 8);
  }, [atom1, atom2, radius]);

  return (
    <mesh ref={meshRef}>
      <cylinderGeometry args={[radius, radius, 1, 8]} />
      <meshStandardMaterial color={color} roughness={0.5} metalness={0.1} />
    </mesh>
  );
}

function ProteinModel({ molecule, conflictIndices }: { molecule: Molecule; conflictIndices?: number[] }) {
  const conflictSet = useMemo(() => new Set(conflictIndices || []), [conflictIndices]);

  return (
    <group>
      {molecule.atoms.map((atom, i) => (
        <group key={`atom-${i}`}>
          <AtomMesh atom={atom} scale={1} />
          {conflictSet.has(i) && (
            <mesh position={[atom.x, atom.y, atom.z]}>
              <sphereGeometry args={[atom.vdwRadius * 0.4, 16, 16]} />
              <meshBasicMaterial color="#FF0000" transparent opacity={0.6} />
            </mesh>
          )}
        </group>
      ))}
      {molecule.bonds.map((bond, i) => {
        const atom1 = molecule.atoms[bond.atom1Index];
        const atom2 = molecule.atoms[bond.atom2Index];
        if (!atom1 || !atom2) return null;
        return <BondMesh key={`bond-${i}`} atom1={atom1} atom2={atom2} color="#808080" radius={0.08} />;
      })}
    </group>
  );
}

interface LigandModelProps {
  molecule: Molecule;
  position: LigandPosition;
  onPositionChange: (position: LigandPosition) => void;
  conflictIndices?: number[];
}

function LigandModel({ molecule, position, onPositionChange, conflictIndices }: LigandModelProps) {
  const transformRef = useRef<any>(null);
  const groupRef = useRef<THREE.Group>(null);
  const [dragging, setDragging] = useState(false);
  const { camera, gl } = useThree();
  const conflictSet = useMemo(() => new Set(conflictIndices || []), [conflictIndices]);

  const initialPosition = useMemo(() => {
    const positions = molecule.atoms.map(a => new THREE.Vector3(a.x, a.y, a.z));
    const center = new THREE.Vector3();
    positions.forEach(p => center.add(p));
    center.divideScalar(positions.length);
    return center;
  }, [molecule]);

  useEffect(() => {
    if (groupRef.current) {
      groupRef.current.position.set(position.x, position.y, position.z);
      groupRef.current.rotation.set(position.rotationX, position.rotationY, position.rotationZ);
    }
  }, [position]);

  useEffect(() => {
    const controls = transformRef.current;
    if (!controls) return;

    const onTransformStart = () => setDragging(true);
    const onTransformEnd = () => {
      setDragging(false);
      if (groupRef.current) {
        const newPos = {
          x: groupRef.current.position.x,
          y: groupRef.current.position.y,
          z: groupRef.current.position.z,
          rotationX: groupRef.current.rotation.x,
          rotationY: groupRef.current.rotation.y,
          rotationZ: groupRef.current.rotation.z,
        };
        onPositionChange(newPos);
      }
    };

    controls.addEventListener('dragging-changed', (event: any) => {
      setDragging(event.value);
      if (!event.value) {
        onTransformEnd();
      }
    });

    controls.addEventListener('objectChange', () => {
      if (groupRef.current) {
        const newPos = {
          x: groupRef.current.position.x,
          y: groupRef.current.position.y,
          z: groupRef.current.position.z,
          rotationX: groupRef.current.rotation.x,
          rotationY: groupRef.current.rotation.y,
          rotationZ: groupRef.current.rotation.z,
        };
        onPositionChange(newPos);
      }
    });

    return () => {
      controls.removeEventListener('dragging-changed', onTransformEnd);
      controls.removeEventListener('objectChange', onTransformEnd);
    };
  }, [onPositionChange]);

  useEffect(() => {
    const canvas = gl.domElement;
    const updateCursor = () => {
      canvas.style.cursor = dragging ? 'grabbing' : 'grab';
    };
    updateCursor();
    return () => {
      canvas.style.cursor = '';
    };
  }, [dragging, gl]);

  return (
    <TransformControls
      ref={transformRef}
      mode="translate"
      position={[position.x, position.y, position.z]}
    >
      <group ref={groupRef}>
        {molecule.atoms.map((atom, i) => (
          <group key={`ligand-atom-${i}`}>
            <mesh position={[atom.x, atom.y, atom.z]}>
              <sphereGeometry args={[atom.vdwRadius * 0.25, 16, 16]} />
              <meshStandardMaterial
                color={ATOM_COLORS[atom.element] || '#808080'}
                roughness={0.4}
                metalness={0.1}
              />
            </mesh>
            {conflictSet.has(i) && (
              <mesh position={[atom.x, atom.y, atom.z]}>
                <sphereGeometry args={[atom.vdwRadius * 0.35, 16, 16]} />
                <meshBasicMaterial color="#FF0000" transparent opacity={0.5} />
              </mesh>
            )}
          </group>
        ))}
        {molecule.bonds.map((bond, i) => {
          const atom1 = molecule.atoms[bond.atom1Index];
          const atom2 = molecule.atoms[bond.atom2Index];
          if (!atom1 || !atom2) return null;
          return (
            <BondMesh
              key={`ligand-bond-${i}`}
              atom1={atom1}
              atom2={atom2}
              color="#FFFFFF"
              radius={0.1
              }
            />
          );
        })}
      </group>
    </TransformControls>
  );
}

interface CameraControllerProps {
  resetKey?: number;
  protein: Molecule | null;
}

function CameraController({ resetKey, protein }: CameraControllerProps) {
  const { camera } = useThree();
  const controlsRef = useRef<any>(null);

  useEffect(() => {
    if (resetKey === undefined) return;
    if (!protein || protein.atoms.length === 0) return;

    let maxDist = 10;
    for (const atom of protein.atoms) {
      const dist = Math.sqrt(atom.x * atom.x + atom.y * atom.y + atom.z * atom.z);
      if (dist > maxDist) maxDist = dist;
    }
    const cameraDist = maxDist * 2.5;

    const targetPos = new THREE.Vector3(
      cameraDist * Math.cos(Math.PI / 4) * Math.cos(Math.PI / 4),
      cameraDist * Math.sin(Math.PI / 4),
      cameraDist * Math.cos(Math.PI / 4) * Math.sin(Math.PI / 4)
    );

    const startPos = camera.position.clone();
    const duration = 300;
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const t = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);

      camera.position.lerpVectors(startPos, targetPos, eased);
      camera.lookAt(0, 0, 0);

      if (t < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [resetKey, protein, camera]);

  return null;
}

interface InnerSceneProps {
  protein: Molecule | null;
  ligand: Molecule | null;
  ligandPosition: LigandPosition;
  onLigandPositionChange: (position: LigandPosition) => void;
  conflictAtomPairs?: Array<{ proteinAtomIndex: number; ligandAtomIndex: number; distance: number }>;
  viewResetKey?: number;
}

function InnerScene({
  protein,
  ligand,
  ligandPosition,
  onLigandPositionChange,
  conflictAtomPairs,
  viewResetKey,
}: InnerSceneProps) {
  const proteinConflictIndices = useMemo(
    () => conflictAtomPairs?.map(p => p.proteinAtomIndex) || [],
    [conflictAtomPairs]
  );
  const ligandConflictIndices = useMemo(
    () => conflictAtomPairs?.map(p => p.ligandAtomIndex) || [],
    [conflictAtomPairs]
  );

  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[10, 10, 5]} intensity={0.8} castShadow />
      <directionalLight position={[-5, -5, -5]} intensity={0.3} />
      <pointLight position={[0, 10, 0]} intensity={0.5} />

      {protein && <ProteinModel molecule={protein} conflictIndices={proteinConflictIndices} />}

      {ligand && (
        <LigandModel
          molecule={ligand}
          position={ligandPosition}
          onPositionChange={onLigandPositionChange}
          conflictIndices={ligandConflictIndices}
        />
      )}

      <gridHelper args={[50, 50, '#333333', '#222222']} position={[0, -5, 0]} />

      <OrbitControls
        makeDefault
        enableDamping
        dampingFactor={0.05}
        minDistance={2}
        maxDistance={100}
      />

      <CameraController resetKey={viewResetKey} protein={protein} />
    </>
  );
}

const Scene3D: React.FC<Scene3DProps> = ({
  protein,
  ligand,
  ligandPosition,
  onLigandPositionChange,
  conflictAtomPairs,
  viewResetKey,
  onSnapshot,
  snapshotKey,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (snapshotKey !== undefined && onSnapshot && canvasRef.current) {
      const canvas = canvasRef.current;
      const dataUrl = canvas.toDataURL('image/png');
      onSnapshot(dataUrl);
    }
  }, [snapshotKey, onSnapshot]);

  return (
    <Canvas
      ref={canvasRef}
      camera={{ position: [20, 15, 20], fov: 50 }}
      gl={{ antialias: true, preserveDrawingBuffer: true }}
      style={{ background: '#1E1E1E' }}
      onCreated={({ gl }) => {
        gl.setClearColor('#1E1E1E');
      }}
    >
      <InnerScene
        protein={protein}
        ligand={ligand}
        ligandPosition={ligandPosition}
        onLigandPositionChange={onLigandPositionChange}
        conflictAtomPairs={conflictAtomPairs}
        viewResetKey={viewResetKey}
      />
    </Canvas>
  );
};

export default Scene3D;
