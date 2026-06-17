import React, { useMemo, useRef, useEffect } from 'react';
import * as THREE from 'three';
import { BranchData } from '../utils/treeGenerator';

interface BranchMeshProps {
  branches: BranchData[];
  selectedId: string | null;
  onSelect: (branch: BranchData) => void;
}

export const BranchMesh: React.FC<BranchMeshProps> = ({ branches, selectedId, onSelect }) => {
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
    <group>
      {meshData.map(({ branch, mid, length, quaternion }) => {
        const isSelected = selectedId === branch.id;
        const segments = branch.level < 2 ? 8 : branch.level < 4 ? 6 : 4;
        return (
          <mesh
            key={branch.id}
            position={[mid.x, mid.y, mid.z]}
            quaternion={quaternion}
            onClick={(e) => {
              e.stopPropagation();
              onSelect(branch);
            }}
          >
            <cylinderGeometry
              args={[branch.thickness, branch.thickness * 0.85, length, segments, 1]}
            />
            <meshStandardMaterial
              color={isSelected ? '#FFD700' : branch.color}
              roughness={0.8}
              metalness={0.1}
            />
            {isSelected && (
              <mesh>
                <cylinderGeometry
                  args={[
                    branch.thickness * 1.3,
                    branch.thickness * 1.1,
                    length * 1.02,
                    segments,
                    1,
                  ]}
                />
                <meshBasicMaterial
                  color="#FFD700"
                  transparent
                  opacity={0.4}
                />
              </mesh>
            )}
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
