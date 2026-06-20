import React, { useRef, useMemo, useState, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import * as THREE from 'three';
import { Molecule, Atom, ELEMENT_VISUAL, ElementType } from './moleculeData';

interface SceneProps {
  molecule: Molecule | null;
  autoRotate: boolean;
  onHoverAtom: (atom: Atom | null, event?: PointerEvent) => void;
  resetSignal: number;
}

interface AtomMeshProps {
  atom: Atom;
  onHover: (atom: Atom | null, e?: any) => void;
}

function getAtomPosition(atomId: string, atoms: Atom[]): THREE.Vector3 | null {
  const atom = atoms.find(a => a.id === atomId);
  if (!atom) return null;
  return new THREE.Vector3(atom.position[0], atom.position[1], atom.position[2]);
}

function BondCylinder({ atom1, atom2, atoms }: { atom1: string; atom2: string; atoms: Atom[] }) {
  const start = getAtomPosition(atom1, atoms);
  const end = getAtomPosition(atom2, atoms);
  if (!start || !end) return null;

  const direction = new THREE.Vector3().subVectors(end, start);
  const length = direction.length();
  const midpoint = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);

  const quaternion = new THREE.Quaternion();
  const up = new THREE.Vector3(0, 1, 0);
  quaternion.setFromUnitVectors(up, direction.clone().normalize());

  return (
    <mesh position={midpoint} quaternion={quaternion}>
      <cylinderGeometry args={[0.04, 0.04, length, 16]} />
      <meshPhongMaterial color="#cccccc" shininess={50} />
    </mesh>
  );
}

function AtomMesh({ atom, onHover }: AtomMeshProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const visual = ELEMENT_VISUAL[atom.element as ElementType];
  const targetScale = hovered ? 1.2 : 1.0;

  useFrame(() => {
    if (meshRef.current) {
      const current = meshRef.current.scale.x;
      const next = current + (targetScale - current) * 0.25;
      meshRef.current.scale.setScalar(next);
    }
    if (glowRef.current) {
      const current = glowRef.current.material.opacity as number;
      const target = hovered ? 0.5 : 0;
      glowRef.current.material.opacity = current + (target - current) * 0.25;
      const scale = hovered ? 1.4 : 1.1;
      const curScale = glowRef.current.scale.x;
      glowRef.current.scale.setScalar(curScale + (scale - curScale) * 0.25);
    }
  });

  return (
    <group position={atom.position}>
      <mesh
        ref={meshRef}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
          onHover(atom, e);
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          setHovered(false);
          onHover(null);
        }}
      >
        <sphereGeometry args={[visual.radius, 32, 32]} />
        <meshPhongMaterial
          color={visual.color}
          shininess={100}
          specular={new THREE.Color(0x444444)}
        />
      </mesh>
      <mesh ref={glowRef}>
        <sphereGeometry args={[visual.radius, 32, 32]} />
        <meshBasicMaterial
          color={visual.color}
          transparent
          opacity={0}
          depthWrite={false}
          side={THREE.BackSide}
        />
      </mesh>
      {hovered && (
        <Html
          position={[0, visual.radius * targetScale + 0.3, 0]}
          center
          distanceFactor={10}
          style={{ pointerEvents: 'none' }}
        >
          <div style={{
            background: '#000000b3',
            color: '#ffffff',
            padding: '6px 12px',
            borderRadius: '6px',
            fontSize: '13px',
            whiteSpace: 'nowrap',
            fontWeight: 600,
          }}>
            {atom.element}-{visual.nameCN}
          </div>
        </Html>
      )}
    </group>
  );
}

export function Scene({ molecule, autoRotate, onHoverAtom, resetSignal }: SceneProps) {
  const groupRef = useRef<THREE.Group>(null);
  const controlsRef = useRef<any>(null);
  const [visible, setVisible] = useState(true);
  const { camera } = useThree();

  useEffect(() => {
    setVisible(false);
    const t = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(t);
  }, [molecule?.name]);

  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.reset();
      camera.position.set(0, 0, 6);
      camera.lookAt(0, 0, 0);
    }
  }, [resetSignal, camera]);

  const bonds = useMemo(() => {
    if (!molecule) return [];
    return molecule.bonds.map(bond => (
      <BondCylinder
        key={bond.id}
        atom1={bond.atom1}
        atom2={bond.atom2}
        atoms={molecule.atoms}
      />
    ));
  }, [molecule]);

  const atoms = useMemo(() => {
    if (!molecule) return [];
    return molecule.atoms.map(atom => (
      <AtomMesh key={atom.id} atom={atom} onHover={onHoverAtom} />
    ));
  }, [molecule, onHoverAtom]);

  return (
    <>
      <ambientLight intensity={0.4} color="#404060" />
      <directionalLight
        position={[5, 5, 5]}
        intensity={1.2}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <directionalLight position={[-3, -2, -4]} intensity={0.3} />

      <group
        ref={groupRef}
        style={{
          transition: 'opacity 0.5s ease-in-out',
          opacity: visible ? 1 : 0,
        }}
      >
        {bonds}
        {atoms}
      </group>

      <OrbitControls
        ref={controlsRef}
        enableDamping
        dampingFactor={0.1}
        minDistance={3}
        maxDistance={30}
        autoRotate={autoRotate}
        autoRotateSpeed={0.5}
        enablePan
        mouseButtons={{
          LEFT: THREE.MOUSE.ROTATE,
          MIDDLE: THREE.MOUSE.DOLLY,
          RIGHT: THREE.MOUSE.PAN,
        }}
      />
    </>
  );
}
