import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Bond, useMoleculeStore } from '../store';

interface Bond3DProps {
  bond: Bond;
}

export function Bond3D({ bond }: Bond3DProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const atoms = useMoleculeStore((s) => s.atoms);

  const { atom1, atom2 } = useMemo(() => {
    const a1 = atoms.find((a) => a.id === bond.atom1Id);
    const a2 = atoms.find((a) => a.id === bond.atom2Id);
    return { atom1: a1, atom2: a2 };
  }, [atoms, bond.atom1Id, bond.atom2Id]);

  const bondVisible = atom1?.isAssembled && atom2?.isAssembled;

  useFrame(() => {
    if (!meshRef.current || !atom1 || !atom2) return;

    const start = new THREE.Vector3(...atom1.currentPosition);
    const end = new THREE.Vector3(...atom2.currentPosition);
    const direction = new THREE.Vector3().subVectors(end, start);
    const length = direction.length();

    if (length === 0) return;

    const midPoint = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
    meshRef.current.position.copy(midPoint);

    const quaternion = new THREE.Quaternion();
    quaternion.setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      direction.clone().normalize()
    );
    meshRef.current.rotation.setFromQuaternion(quaternion);

    meshRef.current.scale.y = Math.max(length, 0.01);
  });

  if (!atom1 || !atom2) return null;

  return (
    <mesh ref={meshRef}>
      <cylinderGeometry args={[0.05, 0.05, 1, 12, 1, false]} />
      <meshStandardMaterial
        color="#AAAAAA"
        transparent
        opacity={bondVisible ? 0.6 : 0}
        roughness={0.5}
        metalness={0.3}
      />
    </mesh>
  );
}
