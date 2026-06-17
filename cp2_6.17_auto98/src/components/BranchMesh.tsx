import React, { useMemo, useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { BranchData } from '../utils/treeGenerator';

interface BranchMeshProps {
  branches: BranchData[];
  selectedId: string | null;
  onSelect: (branch: BranchData) => void;
}

export const BranchMesh: React.FC<BranchMeshProps> = ({ branches, selectedId, onSelect }) => {
  const groupRef = useRef<THREE.Group>(null);
  const [flashActive, setFlashActive] = useState(false);
  const flashStartTime = useRef(0);

  useEffect(() => {
    if (selectedId) {
      setFlashActive(true);
      flashStartTime.current = performance.now();
      const timer = setTimeout(() => {
        setFlashActive(false);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [selectedId]);

  useFrame(() => {
    if (!groupRef.current || !selectedId || !flashActive) return;

    const elapsed = performance.now() - flashStartTime.current;
    const flashDuration = 250;
    const flashCycle = Math.floor(elapsed / flashDuration);
    const flashProgress = (elapsed % flashDuration) / flashDuration;
    const isOn = flashCycle % 2 === 0;
    const intensity = isOn ? 1 - flashProgress * 0.5 : 0.3 + flashProgress * 0.3;

    groupRef.current.children.forEach((child) => {
      const mesh = child as THREE.Mesh;
      const userDataBranchId = mesh.userData.branchId as string;
      if (userDataBranchId === selectedId) {
        const material = mesh.material as THREE.MeshStandardMaterial;
        if (material.emissive) {
          material.emissive.setHex(0xffd700);
          material.emissiveIntensity = intensity * 0.8;
        }
        if (material.color) {
          const targetColor = new THREE.Color('#FFD700');
          const baseColor = new THREE.Color('#4A3728');
          material.color.lerpColors(baseColor, targetColor, intensity * 0.7);
        }
      }
    });
  });

  useEffect(() => {
    if (!groupRef.current) return;
    groupRef.current.children.forEach((child) => {
      const mesh = child as THREE.Mesh;
      const material = mesh.material as THREE.MeshStandardMaterial;
      if (material.emissive && !selectedId) {
        material.emissive.setHex(0x000000);
        material.emissiveIntensity = 0;
      }
    });
  }, [selectedId, branches]);

  const meshData = useMemo(() => {
    return branches.map((branch) => {
      const direction = new THREE.Vector3()
        .subVectors(branch.end, branch.start)
        .normalize();
      const mid = new THREE.Vector3()
        .addVectors(branch.start, branch.end)
        .multiplyScalar(0.5);
      const length = branch.start.distanceTo(branch.end);

      const quaternion = new THREE.Quaternion();
      quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction);

      return { branch, mid, length, quaternion };
    });
  }, [branches]);

  return (
    <group ref={groupRef}>
      {meshData.map(({ branch, mid, length, quaternion }) => {
        const segments = branch.level < 2 ? 8 : branch.level < 4 ? 6 : 4;
        const isSelected = selectedId === branch.id;
        return (
          <mesh
            key={branch.id}
            position={[mid.x, mid.y, mid.z]}
            quaternion={quaternion}
            onClick={(e) => {
              e.stopPropagation();
              onSelect(branch);
            }}
            userData={{ branchId: branch.id }}
          >
            <cylinderGeometry
              args={[branch.thickness, branch.thickness * 0.85, length, segments, 1]}
            />
            <meshStandardMaterial
              color={branch.color}
              roughness={0.8}
              metalness={0.1}
              emissive={isSelected ? '#FFD700' : '#000000'}
              emissiveIntensity={isSelected ? 0.5 : 0}
            />
          </mesh>
        );
      })}
    </group>
  );
};

interface LeafMeshProps {
  leaves: Array<{ position: THREE.Vector3; radius: number }>;
}

export const LeafMesh: React.FC<LeafMeshProps> = ({ leaves }) => {
  const instancedRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  useEffect(() => {
    if (!instancedRef.current || leaves.length === 0) return;
    const mesh = instancedRef.current;
    for (let i = 0; i < leaves.length; i++) {
      dummy.position.copy(leaves[i].position);
      dummy.scale.setScalar(leaves[i].radius);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  }, [leaves, dummy]);

  const leafGeometry = useMemo(() => new THREE.SphereGeometry(1, 4, 4), []);
  const leafMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#2D5A27',
        roughness: 0.9,
        metalness: 0.0,
      }),
    []
  );

  if (leaves.length === 0) return null;

  return (
    <instancedMesh
      ref={instancedRef}
      args={[leafGeometry, leafMaterial, leaves.length]}
      frustumCulled={false}
    />
  );
};
