import { forwardRef, useMemo, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Exhibit } from '../types/scene';
import { generateAbstractPaintingTexture } from '../utils/textureGenerator';
import { EXHIBIT_SIZE } from '../utils/exhibitPresets';
import { useSceneStore } from '../store/sceneStore';

interface ExhibitMeshProps {
  exhibit: Exhibit;
}

export const ExhibitMesh = forwardRef<THREE.Group, ExhibitMeshProps>(function ExhibitMesh(
  { exhibit },
  ref
) {
  const innerRef = useMemo(() => {
    const group = new THREE.Group();
    return group;
  }, []);

  const selectedId = useSceneStore((state) => state.selectedId);
  const selectExhibit = useSceneStore((state) => state.selectExhibit);
  const [hovered, setHovered] = useState(false);

  const isSelected = selectedId === exhibit.id;
  const size = EXHIBIT_SIZE[exhibit.type];

  const paintingTexture = useMemo(() => {
    if (exhibit.type === 'hanging_painting') {
      return generateAbstractPaintingTexture(512, 384, exhibit.color);
    }
    return null;
  }, [exhibit.type, exhibit.color]);

  const particlePositions = useMemo(() => {
    if (exhibit.type === 'particle_column') {
      const positions = new Float32Array(250 * 3);
      for (let i = 0; i < 250; i++) {
        positions[i * 3] = (Math.random() - 0.5) * size.width;
        positions[i * 3 + 1] = Math.random() * size.height;
        positions[i * 3 + 2] = (Math.random() - 0.5) * size.depth;
      }
      return positions;
    }
    return null;
  }, [exhibit.type, size]);

  const particleMeshRef = useMemo(() => {
    return { current: null as THREE.Points | null };
  }, []);

  useFrame((state) => {
    if (exhibit.type === 'particle_column' && particleMeshRef.current) {
      const positions = particleMeshRef.current.geometry.attributes.position.array as Float32Array;
      const time = state.clock.elapsedTime;
      for (let i = 0; i < 250; i++) {
        positions[i * 3 + 1] += 0.01;
        if (positions[i * 3 + 1] > size.height) {
          positions[i * 3 + 1] = 0;
        }
        positions[i * 3] += Math.sin(time + i) * 0.002;
        positions[i * 3 + 2] += Math.cos(time + i * 0.7) * 0.002;
      }
      particleMeshRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  const handleClick = (e: any) => {
    e.stopPropagation();
    selectExhibit(exhibit.id);
  };

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

  const renderExhibitContent = () => {
    switch (exhibit.type) {
      case 'pedestal_sculpture':
        return (
          <>
            <mesh position={[0, -size.height / 2 + 0.1, 0]}>
              <cylinderGeometry args={[0.7, 0.8, 0.2, 32]} />
              <meshStandardMaterial color="#333333" roughness={0.5} metalness={0.2} />
            </mesh>
            <mesh position={[0, 0.2, 0]}>
              <boxGeometry args={[size.width * 0.6, size.height * 0.6, size.depth * 0.6]} />
              <meshStandardMaterial color={exhibit.color} roughness={0.6} metalness={0.3} />
            </mesh>
          </>
        );

      case 'hanging_painting':
        return (
          <>
            <mesh position={[0, 0, -0.03]}>
              <planeGeometry args={[size.width + 0.2, size.height + 0.2]} />
              <meshStandardMaterial color="#2a1810" side={THREE.DoubleSide} />
            </mesh>
            <mesh>
              <planeGeometry args={[size.width, size.height]} />
              <meshBasicMaterial map={paintingTexture} side={THREE.DoubleSide} />
            </mesh>
          </>
        );

      case 'glass_relic':
        return (
          <>
            <mesh position={[0, -size.height / 2 - 0.05, 0]}>
              <boxGeometry args={[size.width * 1.2, 0.1, size.depth * 1.2]} />
              <meshStandardMaterial color="#222222" roughness={0.3} metalness={0.8} />
            </mesh>
            <mesh>
              <boxGeometry args={[size.width, size.height, size.depth]} />
              <meshPhysicalMaterial
                color={exhibit.color}
                transparent
                opacity={0.3}
                roughness={0.1}
                metalness={0.1}
                transmission={0.5}
                thickness={0.5}
              />
            </mesh>
            <mesh position={[0, -size.height * 0.3, 0]}>
              <boxGeometry args={[size.width * 0.5, size.height * 0.3, size.depth * 0.5]} />
              <meshStandardMaterial color={exhibit.color} roughness={0.4} metalness={0.3} />
            </mesh>
          </>
        );

      case 'glowing_sphere':
        return (
          <mesh>
            <sphereGeometry args={[size.width / 2, 32, 32]} />
            <meshStandardMaterial
              color={exhibit.color}
              emissive={exhibit.color}
              emissiveIntensity={2}
              roughness={0.2}
              metalness={0.5}
            />
          </mesh>
        );

      case 'particle_column':
        return (
          <points
            ref={(el) => {
              particleMeshRef.current = el;
            }}
          >
            <bufferGeometry>
              <bufferAttribute
                attach="attributes-position"
                count={250}
                array={particlePositions!}
                itemSize={3}
              />
            </bufferGeometry>
            <pointsMaterial
              size={0.05}
              color={exhibit.color}
              transparent
              opacity={0.8}
              sizeAttenuation
            />
          </points>
        );

      case 'mirror_plane':
        return (
          <mesh>
            <planeGeometry args={[size.width, size.height]} />
            <meshStandardMaterial
              color={exhibit.color}
              metalness={1.0}
              roughness={0.0}
              side={THREE.DoubleSide}
            />
          </mesh>
        );

      default:
        return null;
    }
  };

  const setRefs = (node: THREE.Group | null) => {
    if (node) {
      node.position.set(
        exhibit.transform.position.x,
        exhibit.transform.position.y,
        exhibit.transform.position.z
      );
      node.rotation.set(
        exhibit.transform.rotation.x,
        exhibit.transform.rotation.y,
        exhibit.transform.rotation.z
      );
      node.scale.set(
        exhibit.transform.scale,
        exhibit.transform.scale,
        exhibit.transform.scale
      );
      Object.assign(innerRef, node);
      if (typeof ref === 'function') {
        ref(node);
      } else if (ref) {
        (ref as any).current = node;
      }
    }
  };

  return (
    <group
      ref={setRefs}
      onClick={handleClick}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
    >
      {renderExhibitContent()}
    </group>
  );
});
