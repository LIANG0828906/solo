import { useRef, useState, useEffect, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import type { Fragment } from '@/store/useGameStore';
import { NodeSystem } from '@/game/NodeSystem';

interface RelicFragmentProps {
  fragment: Fragment;
  nodeSystem: NodeSystem;
}

const RelicFragment: React.FC<RelicFragmentProps> = ({ fragment, nodeSystem }) => {
  const groupRef = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const { gl, camera } = useThree();
  const targetScale = useRef(new THREE.Vector3(1, 1, 1));

  const hexColor = useMemo(() => new THREE.Color(fragment.elementColor), [fragment.elementColor]);

  useEffect(() => {
    targetScale.current.setScalar(hovered || fragment.isDragging ? 1.15 : 1);
  }, [hovered, fragment.isDragging]);

  useEffect(() => {
    if (isDragging || fragment.isDragging) {
      const dom = gl.domElement;
      const domRect = dom.getBoundingClientRect();

      const handleMove = (e: MouseEvent) => {
        nodeSystem.handleDragMove(fragment.id, e.clientX, e.clientY, domRect);
      };

      const handleUp = () => {
        setIsDragging(false);
        nodeSystem.handleDragEnd(fragment.id);
        document.removeEventListener('mousemove', handleMove);
        document.removeEventListener('mouseup', handleUp);
      };

      document.addEventListener('mousemove', handleMove);
      document.addEventListener('mouseup', handleUp);

      return () => {
        document.removeEventListener('mousemove', handleMove);
        document.removeEventListener('mouseup', handleUp);
      };
    }
  }, [isDragging, fragment.id, fragment.isDragging, nodeSystem, gl]);

  useFrame((state) => {
    if (!groupRef.current || !meshRef.current) return;
    const t = state.clock.elapsedTime;

    groupRef.current.position.lerp(
      new THREE.Vector3(...fragment.position),
      0.25
    );

    meshRef.current.scale.lerp(targetScale.current, 0.15);

    if (!fragment.isDragging && !fragment.isMatched) {
      meshRef.current.rotation.y = t * 0.5;
      meshRef.current.rotation.x = Math.sin(t * 0.7) * 0.3;
      groupRef.current.position.y += Math.sin(t * 1.5 + fragment.position[0]) * 0.002;
    } else if (fragment.isDragging) {
      meshRef.current.rotation.y += 0.05;
      meshRef.current.rotation.x += 0.03;
    } else if (fragment.isMatched) {
      meshRef.current.rotation.y = t * 0.8;
      meshRef.current.rotation.z = t * 0.4;
    }
  });

  if (fragment.isMatched) return null;

  return (
    <group ref={groupRef} position={fragment.position}>
      <mesh
        ref={meshRef}
        onPointerOver={(e) => {
          e.stopPropagation();
          if (!fragment.isDragging) setHovered(true);
          document.body.style.cursor = 'grab';
        }}
        onPointerOut={() => {
          setHovered(false);
          document.body.style.cursor = 'default';
        }}
        onPointerDown={(e) => {
          e.stopPropagation();
          if (fragment.isMatched) return;
          setIsDragging(true);
          nodeSystem.handleDragStart(fragment.id);
          document.body.style.cursor = 'grabbing';
        }}
      >
        <octahedronGeometry args={[0.4, 0]} />
        <meshStandardMaterial
          color={hexColor}
          emissive={hexColor}
          emissiveIntensity={hovered ? 1.5 : 1}
          metalness={0.6}
          roughness={0.25}
          transparent
          opacity={0.95}
        />
      </mesh>

      <pointLight
        color={fragment.elementColor}
        intensity={hovered ? 1.5 : 0.8}
        distance={3}
        decay={2}
      />
    </group>
  );
};

export default RelicFragment;
