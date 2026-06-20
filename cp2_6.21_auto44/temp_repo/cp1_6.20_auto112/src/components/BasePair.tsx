import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Billboard, Text } from '@react-three/drei';
import * as THREE from 'three';
import { BasePairData } from '../lib/DNAGeometry';
import { Colors } from '../lib/utils';
import { useDNAContext } from '../context/DNAContext';

interface BasePairProps {
  data: BasePairData;
  isHighlighted: boolean;
  showBonds: boolean;
  showLabels: boolean;
}

const BasePair: React.FC<BasePairProps> = ({ data, isHighlighted, showBonds, showLabels }) => {
  const groupRef = useRef<THREE.Group>(null);
  const haloRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const { setHighlightedBasePair, visualMode } = useDNAContext();

  const color = data.type === 'AT' ? Colors.baseAT : Colors.baseGC;
  const labelA = data.type === 'AT' ? 'A' : 'G';
  const labelB = data.type === 'AT' ? 'T' : 'C';

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    const targetScale = isHighlighted ? 1.2 : hovered ? 1.08 : 1;
    groupRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 1 - Math.exp(-delta * 10));
    if (haloRef.current) {
      const haloMesh = haloRef.current;
      const targetOpacity = isHighlighted ? 0.55 : 0;
      const mat = haloMesh.material as THREE.MeshBasicMaterial;
      mat.opacity += (targetOpacity - mat.opacity) * Math.min(1, delta * 8);
      haloMesh.scale.lerp(new THREE.Vector3(1.15, 1.15, 1.15), 1 - Math.exp(-delta * 6));
    }
  });

  if (visualMode === 'backbone') return null;

  const pointA = new THREE.Vector3(...data.pointA);
  const pointB = new THREE.Vector3(...data.pointB);
  const mid = new THREE.Vector3().addVectors(pointA, pointB).multiplyScalar(0.5);
  const dir = new THREE.Vector3().subVectors(pointB, pointA);
  const length = dir.length();
  const quaternion = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());

  return (
    <group ref={groupRef} position={mid} quaternion={quaternion}>
      <mesh
        onClick={(e) => {
          e.stopPropagation();
          setHighlightedBasePair(isHighlighted ? null : data);
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          setHovered(false);
          document.body.style.cursor = 'default';
        }}
      >
        <cylinderGeometry args={[0.08, 0.08, length, 10]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={isHighlighted ? 0.6 : hovered ? 0.35 : 0.18}
          metalness={0.3}
          roughness={0.4}
        />
      </mesh>

      {isHighlighted && (
        <mesh ref={haloRef}>
          <sphereGeometry args={[length * 0.8, 24, 24]} />
          <meshBasicMaterial color={Colors.highlight} transparent opacity={0} depthWrite={false} />
        </mesh>
      )}

      {showBonds && (
        <line>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={2}
              array={new Float32Array([0, -length / 2, 0, 0, length / 2, 0])}
              itemSize={3}
            />
          </bufferGeometry>
          <lineDashedMaterial
            color={Colors.hydrogenBond}
            dashSize={0.08}
            gapSize={0.05}
            transparent
            opacity={0.55}
          />
        </line>
      )}

      {showLabels && (
        <>
          <Billboard position={new THREE.Vector3(0.28, -length / 2 - 0.08, 0)}>
            <Text
              fontSize={0.2}
              color={color}
              anchorX="center"
              anchorY="middle"
              outlineWidth={0.015}
              outlineColor="#000000"
            >
              {labelA}
            </Text>
          </Billboard>
          <Billboard position={new THREE.Vector3(0.28, length / 2 + 0.08, 0)}>
            <Text
              fontSize={0.2}
              color={color}
              anchorX="center"
              anchorY="middle"
              outlineWidth={0.015}
              outlineColor="#000000"
            >
              {labelB}
            </Text>
          </Billboard>
        </>
      )}
    </group>
  );
};

export default BasePair;
