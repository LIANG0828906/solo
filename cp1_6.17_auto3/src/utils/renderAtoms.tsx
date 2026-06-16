import React from 'react';
import * as THREE from 'three';
import { Html } from '@react-three/drei';

export interface Atom {
  element: string;
  x: number;
  y: number;
  z: number;
  radius: number;
  color: string;
}

export interface Bond {
  from: number;
  to: number;
  order: number;
}

export interface Molecule {
  id: string;
  name: string;
  formula: string;
  atoms: Atom[];
  bonds: Bond[];
}

export interface RenderResult {
  atoms: React.ReactNode[];
  bonds: React.ReactNode[];
  labels: React.ReactNode[];
}

export function renderAtoms(
  molecule: Molecule,
  showLabels: boolean,
  cameraDistance: number = 10
): RenderResult {
  const atoms: React.ReactNode[] = molecule.atoms.map((atom, index) => (
    <mesh key={`atom-${index}`} position={[atom.x, atom.y, atom.z]}>
      <sphereGeometry args={[atom.radius, 32, 32]} />
      <meshStandardMaterial color={atom.color} transparent opacity={0.85} />
    </mesh>
  ));

  const bonds: React.ReactNode[] = molecule.bonds.map((bond, index) => {
    const fromAtom = molecule.atoms[bond.from];
    const toAtom = molecule.atoms[bond.to];

    const start = new THREE.Vector3(fromAtom.x, fromAtom.y, fromAtom.z);
    const end = new THREE.Vector3(toAtom.x, toAtom.y, toAtom.z);
    const direction = end.clone().sub(start);
    const length = direction.length();
    const midpoint = start.clone().add(end).multiplyScalar(0.5);

    const quaternion = new THREE.Quaternion();
    quaternion.setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      direction.clone().normalize()
    );

    return (
      <mesh
        key={`bond-${index}`}
        position={[midpoint.x, midpoint.y, midpoint.z]}
        quaternion={[quaternion.x, quaternion.y, quaternion.z, quaternion.w]}
      >
        <cylinderGeometry args={[0.1, 0.1, length, 16]} />
        <meshStandardMaterial color="#aaaaaa" />
      </mesh>
    );
  });

  const scaleFactor = 10 / cameraDistance;

  const labels: React.ReactNode[] = showLabels
    ? molecule.atoms.map((atom, index) => (
        <Html
          key={`label-${index}`}
          position={[atom.x, atom.y + atom.radius + 0.3, atom.z]}
          center
          distanceFactor={cameraDistance}
          zIndexRange={[100, 0]}
          occlude
        >
          <div
            style={{
              background: 'rgba(0, 0, 0, 0.75)',
              color: 'white',
              padding: '3px 8px',
              borderRadius: '6px',
              fontSize: '16px',
              fontWeight: 'bold',
              whiteSpace: 'nowrap',
              userSelect: 'none',
              transform: `scale(${scaleFactor})`,
              transformOrigin: 'center',
            }}
          >
            {atom.element}
          </div>
        </Html>
      ))
    : [];

  return { atoms, bonds, labels };
}
