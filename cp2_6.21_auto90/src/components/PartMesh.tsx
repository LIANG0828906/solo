import { useRef, useMemo, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { PartData } from '@/types';
import { PartLabel } from './PartLabel';
import { useExplosionStore } from '@/store/explosionStore';

interface PartMeshProps {
  part: PartData;
  offset: number;
  isSelected: boolean;
}

function createGeometry(type: PartData['geometryType']): THREE.BufferGeometry {
  switch (type) {
    case 'dingBody': {
      const points: THREE.Vector2[] = [];
      const segments = 32;
      for (let i = 0; i <= segments; i++) {
        const t = i / segments;
        const radius = 1.3 - 0.5 * t * t;
        const y = -0.9 + t * 1.8;
        points.push(new THREE.Vector2(radius, y));
      }
      return new THREE.LatheGeometry(points, 48);
    }
    case 'ear': {
      const outer = new THREE.TorusGeometry(0.35, 0.1, 12, 24);
      return outer;
    }
    case 'leg': {
      const leg = new THREE.CylinderGeometry(0.18, 0.25, 1.0, 16);
      return leg;
    }
    case 'pattern': {
      return new THREE.CylinderGeometry(1.1, 1.1, 0.05, 48);
    }
    case 'inscription': {
      return new THREE.CylinderGeometry(0.9, 0.9, 0.03, 48);
    }
    default:
      return new THREE.BoxGeometry(1, 1, 1);
  }
}

export function PartMesh({ part, offset, isSelected }: PartMeshProps) {
  const groupRef = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const togglePartSelection = useExplosionStore((s) => s.togglePartSelection);

  const geometry = useMemo(() => createGeometry(part.geometryType), [part.geometryType]);

  const finalPosition = useMemo(() => {
    const axis = new THREE.Vector3(...part.explodeAxis).normalize();
    const base = new THREE.Vector3(...part.defaultPosition);
    return base.add(axis.multiplyScalar(offset));
  }, [part.defaultPosition, part.explodeAxis, offset]);

  const worldPos = useMemo(() => new THREE.Vector3(), []);

  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.getWorldPosition(worldPos);
    }
    if (isSelected && groupRef.current) {
      groupRef.current.rotation.y += delta * (Math.PI / 6);
    }
  });

  const material = useMemo(() => {
    if (isSelected) {
      return new THREE.MeshStandardMaterial({
        color: '#D4AF37',
        metalness: 0.9,
        roughness: 0.15,
        emissive: '#8B6914',
        emissiveIntensity: 0.4,
      });
    }
    return new THREE.MeshStandardMaterial({
      color: part.color,
      metalness: 0.5,
      roughness: 0.5,
    });
  }, [part.color, isSelected]);

  const handlePointerOver = (e: any) => {
    e.stopPropagation();
    setHovered(true);
    document.body.style.cursor = 'pointer';
  };

  const handlePointerOut = (e: any) => {
    e.stopPropagation();
    setHovered(false);
    document.body.style.cursor = 'auto';
  };

  const handleClick = (e: any) => {
    e.stopPropagation();
    togglePartSelection(part.id);
  };

  return (
    <group ref={groupRef} position={finalPosition.toArray() as [number, number, number]}>
      <mesh
        ref={meshRef}
        geometry={geometry}
        material={material}
        castShadow
        receiveShadow
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        onClick={handleClick}
      >
        {hovered && (
          <lineSegments>
            <edgesGeometry args={[geometry]} />
            <lineBasicMaterial color="#ffffff" linewidth={2} />
          </lineSegments>
        )}
      </mesh>
      <PartLabel part={part} worldPosition={worldPos} />
    </group>
  );
}
