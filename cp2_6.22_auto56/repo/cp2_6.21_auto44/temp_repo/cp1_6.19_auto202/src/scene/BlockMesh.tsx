import { useRef, useMemo, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import type { BlockType } from '@/types';

interface BlockMeshProps {
  type: BlockType;
  position: [number, number, number];
  color: string;
  isPreview?: boolean;
  isCollapsed?: boolean;
  velocity?: [number, number, number];
  targetPosition?: [number, number, number];
  isTransitioning?: boolean;
}

export function BlockMesh({
  type,
  position,
  color,
  isPreview = false,
  isCollapsed = false,
  velocity,
  targetPosition,
  isTransitioning = false,
}: BlockMeshProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const velRef = useRef(velocity || [0, 0, 0]);

  const geometry = useMemo(() => {
    switch (type) {
      case 'cube':
        return new THREE.BoxGeometry(1, 1, 1);
      case 'sphere':
        return new THREE.SphereGeometry(0.5, 16, 16);
      case 'prism':
        return new THREE.CylinderGeometry(0.5, 0.5, 1, 6);
      default:
        return new THREE.BoxGeometry(1, 1, 1);
    }
  }, [type]);

  const material = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color,
      transparent: isPreview,
      opacity: isPreview ? 0.4 : 1,
      roughness: 0.7,
      metalness: 0.1,
    });
  }, [color, isPreview]);

  useEffect(() => {
    if (meshRef.current && isTransitioning && targetPosition) {
      const startPos = meshRef.current.position.clone();
      const endPos = new THREE.Vector3(...targetPosition);
      const duration = 0.3;
      const startTime = performance.now();

      const animate = () => {
        if (!meshRef.current) return;
        const elapsed = (performance.now() - startTime) / 1000;
        const t = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - t, 3);

        meshRef.current.position.lerpVectors(startPos, endPos, eased);

        if (t < 1) {
          requestAnimationFrame(animate);
        }
      };
      animate();
    } else if (meshRef.current) {
      meshRef.current.position.set(...position);
    }
  }, [position, targetPosition, isTransitioning]);

  useFrame((_, delta) => {
    if (!meshRef.current) return;

    if (isCollapsed && !isTransitioning) {
      const vel = velRef.current;
      vel[1] += -9.8 * delta;

      meshRef.current.position.x += vel[0] * delta;
      meshRef.current.position.y += vel[1] * delta;
      meshRef.current.position.z += vel[2] * delta;

      const halfY = type === 'sphere' ? 0.5 : 0.5;
      if (meshRef.current.position.y - halfY < 0) {
        meshRef.current.position.y = halfY;
        if (vel[1] < 0) {
          vel[1] = -vel[1] * 0.2;
          if (Math.abs(vel[1]) < 0.5) {
            vel[1] = 0;
          }
        }
      }
    }
  });

  return (
    <mesh ref={meshRef} position={position} castShadow receiveShadow geometry={geometry} material={material} />
  );
}
