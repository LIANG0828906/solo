import { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import { useFrame, useThree, ThreeEvent } from '@react-three/fiber';
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
  const [dragging, setDragging] = useState(false);
  const { gl } = useThree();
  const targetScale = useRef(new THREE.Vector3(1, 1, 1));

  const hexColor = useMemo(() => new THREE.Color(fragment.elementColor), [fragment.elementColor]);

  const handlePointerOver = useCallback((e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    if (!fragment.isMatched && !dragging) {
      setHovered(true);
      document.body.style.cursor = 'grab';
    }
  }, [fragment.isMatched, dragging]);

  const handlePointerOut = useCallback((_e: ThreeEvent<PointerEvent>) => {
    setHovered(false);
    if (!dragging) {
      document.body.style.cursor = 'default';
    }
  }, [dragging]);

  const handlePointerDown = useCallback((e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    if (fragment.isMatched) return;

    setDragging(true);
    setHovered(false);
    nodeSystem.handleDragStart(fragment.id);
    document.body.style.cursor = 'grabbing';
    (e.target as Element).setPointerCapture?.(e.pointerId);
  }, [fragment.id, fragment.isMatched, nodeSystem]);

  const handlePointerUp = useCallback((e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    if (!dragging) return;

    setDragging(false);
    nodeSystem.handleDragEnd(fragment.id);
    document.body.style.cursor = 'default';
    (e.target as Element).releasePointerCapture?.(e.pointerId);
  }, [dragging, fragment.id, nodeSystem]);

  const handlePointerMove = useCallback((e: ThreeEvent<PointerEvent>) => {
    if (!dragging) return;
    e.stopPropagation();

    const domRect = gl.domElement.getBoundingClientRect();
    nodeSystem.handleDragMove(fragment.id, e.clientX, e.clientY, domRect);
  }, [dragging, fragment.id, gl.domElement, nodeSystem]);

  useEffect(() => {
    targetScale.current.setScalar(hovered || dragging ? 1.15 : 1);
  }, [hovered, dragging]);

  useEffect(() => {
    if (dragging) {
      const handleWindowMove = (e: MouseEvent) => {
        const domRect = gl.domElement.getBoundingClientRect();
        nodeSystem.handleDragMove(fragment.id, e.clientX, e.clientY, domRect);
      };

      const handleWindowUp = () => {
        setDragging(false);
        nodeSystem.handleDragEnd(fragment.id);
        document.body.style.cursor = 'default';
      };

      window.addEventListener('mousemove', handleWindowMove);
      window.addEventListener('mouseup', handleWindowUp);

      return () => {
        window.removeEventListener('mousemove', handleWindowMove);
        window.removeEventListener('mouseup', handleWindowUp);
      };
    }
  }, [dragging, fragment.id, gl.domElement, nodeSystem]);

  useFrame((state) => {
    if (!groupRef.current || !meshRef.current) return;
    const t = state.clock.elapsedTime;

    groupRef.current.position.lerp(
      new THREE.Vector3(...fragment.position),
      0.25
    );

    meshRef.current.scale.lerp(targetScale.current, 0.15);

    if (!dragging && !fragment.isMatched) {
      meshRef.current.rotation.y = t * 0.5;
      meshRef.current.rotation.x = Math.sin(t * 0.7) * 0.3;
      groupRef.current.position.y += Math.sin(t * 1.5 + fragment.position[0]) * 0.002;
    } else if (dragging) {
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
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerMove={handlePointerMove}
        onPointerCancel={handlePointerUp}
        onPointerLeave={handlePointerOut}
      >
        <octahedronGeometry args={[0.4, 0]} />
        <meshStandardMaterial
          color={hexColor}
          emissive={hexColor}
          emissiveIntensity={hovered || dragging ? 1.8 : 1}
          metalness={0.6}
          roughness={0.25}
          transparent
          opacity={0.95}
        />
      </mesh>

      <pointLight
        color={fragment.elementColor}
        intensity={hovered || dragging ? 1.8 : 0.8}
        distance={3.5}
        decay={2}
      />
    </group>
  );
};

export default RelicFragment;
