import { useRef, useMemo, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Exhibit } from '../types/scene';
import { generateAbstractPaintingTexture } from '../utils/textureGenerator';
import { EXHIBIT_SIZE } from '../utils/exhibitPresets';
import { useSceneStore } from '../store/sceneStore';

interface ExhibitMeshProps {
  exhibit: Exhibit;
}

export function ExhibitMesh({ exhibit }: ExhibitMeshProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const groupRef = useRef<THREE.Group>(null);
  const selectedId = useSceneStore((state) => state.selectedId);
  const selectExhibit = useSceneStore((state) => state.selectExhibit);
  const transformMode = useSceneStore((state) => state.transformMode);
  const updateTransform = useSceneStore((state) => state.updateTransform);
  const [hovered, setHovered] = useState(false);
  const [draggingAxis, setDraggingAxis] = useState<string | null>(null);
  const dragStartPos = useRef<{ x: number; y: number; z: number } | null>(null);
  const dragStartMouse = useRef<{ x: number; y: number; z: number } | null>(null);

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

  useFrame((state) => {
    if (exhibit.type === 'particle_column' && meshRef.current) {
      const positions = meshRef.current.geometry.attributes.position.array as Float32Array;
      const time = state.clock.elapsedTime;
      for (let i = 0; i < 250; i++) {
        positions[i * 3 + 1] += 0.01;
        if (positions[i * 3 + 1] > size.height) {
          positions[i * 3 + 1] = 0;
        }
        positions[i * 3] += Math.sin(time + i) * 0.002;
        positions[i * 3 + 2] += Math.cos(time + i * 0.7) * 0.002;
      }
      meshRef.current.geometry.attributes.position.needsUpdate = true;
    }

    if (isSelected && groupRef.current) {
      const outline = groupRef.current.children.find(
        (child) => (child as any).isLineSegments
      ) as THREE.LineSegments;
      if (outline) {
        const material = outline.material as THREE.LineBasicMaterial;
        const pulse = (Math.sin(state.clock.elapsedTime * 4) + 1) / 2;
        material.color.setHSL(0.44, 1, 0.4 + pulse * 0.2);
      }
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

  const handlePointerOut = () => {
    setHovered(false);
    document.body.style.cursor = 'auto';
  };

  const handleAxisPointerDown = (e: any, axis: string) => {
    e.stopPropagation();
    setDraggingAxis(axis);
    dragStartPos.current = { ...exhibit.transform.position };
    dragStartMouse.current = { x: e.point.x, y: e.point.y, z: e.point.z };
    e.target.setPointerCapture?.(e.pointerId);
  };

  const handleAxisPointerMove = (e: any) => {
    if (!draggingAxis || !dragStartPos.current || !dragStartMouse.current) return;

    if (transformMode === 'translate') {
      const newPos = { ...exhibit.transform.position };
      const scale = exhibit.transform.scale;

      if (draggingAxis === 'x') {
        newPos.x = Math.max(-8, Math.min(8, dragStartPos.current.x + (e.point.x - dragStartMouse.current.x)));
      } else if (draggingAxis === 'y') {
        newPos.y = Math.max(0, Math.min(6, dragStartPos.current.y + (e.point.y - dragStartMouse.current.y)));
      } else if (draggingAxis === 'z') {
        newPos.z = Math.max(-8, Math.min(8, dragStartPos.current.z + (e.point.z - dragStartMouse.current.z)));
      }

      updateTransform(exhibit.id, { position: newPos });
    } else if (transformMode === 'rotate') {
      const newRot = { ...exhibit.transform.rotation };
      const delta = (e.point.x - dragStartMouse.current.x) * 2;

      if (draggingAxis === 'x') {
        newRot.x = dragStartPos.current.x + delta;
      } else if (draggingAxis === 'y') {
        newRot.y = dragStartPos.current.y + delta;
      } else if (draggingAxis === 'z') {
        newRot.z = dragStartPos.current.z + delta;
      }

      updateTransform(exhibit.id, { rotation: newRot });
    }
  };

  const handleAxisPointerUp = (e: any) => {
    setDraggingAxis(null);
    dragStartPos.current = null;
    dragStartMouse.current = null;
    e.target.releasePointerCapture?.(e.pointerId);
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
          <mesh ref={meshRef}>
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
          <points ref={meshRef as any}>
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

  const renderHandles = () => {
    if (!isSelected) return null;

    const handleLength = 1;
    const handleThickness = 0.03;

    if (transformMode === 'translate') {
      return (
        <>
          <mesh
            position={[handleLength / 2, 0, 0]}
            onPointerDown={(e) => handleAxisPointerDown(e, 'x')}
            onPointerMove={handleAxisPointerMove}
            onPointerUp={handleAxisPointerUp}
            onPointerOut={handleAxisPointerUp}
          >
            <cylinderGeometry args={[handleThickness, handleThickness, handleLength, 8]} />
            <meshBasicMaterial color="#ff4444" />
            <mesh rotation={[0, 0, -Math.PI / 2]} />
          </mesh>
          <mesh position={[handleLength, 0, 0]}>
            <coneGeometry args={[0.08, 0.15, 8]} />
            <meshBasicMaterial color="#ff4444" />
            <mesh rotation={[0, 0, Math.PI / 2]} />
          </mesh>

          <mesh
            position={[0, handleLength / 2, 0]}
            onPointerDown={(e) => handleAxisPointerDown(e, 'y')}
            onPointerMove={handleAxisPointerMove}
            onPointerUp={handleAxisPointerUp}
            onPointerOut={handleAxisPointerUp}
          >
            <cylinderGeometry args={[handleThickness, handleThickness, handleLength, 8]} />
            <meshBasicMaterial color="#44ff44" />
          </mesh>
          <mesh position={[0, handleLength, 0]}>
            <coneGeometry args={[0.08, 0.15, 8]} />
            <meshBasicMaterial color="#44ff44" />
          </mesh>

          <mesh
            position={[0, 0, handleLength / 2]}
            onPointerDown={(e) => handleAxisPointerDown(e, 'z')}
            onPointerMove={handleAxisPointerMove}
            onPointerUp={handleAxisPointerUp}
            onPointerOut={handleAxisPointerUp}
          >
            <cylinderGeometry args={[handleThickness, handleThickness, handleLength, 8]} />
            <meshBasicMaterial color="#4488ff" />
            <mesh rotation={[Math.PI / 2, 0, 0]} />
          </mesh>
          <mesh position={[0, 0, handleLength]}>
            <coneGeometry args={[0.08, 0.15, 8]} />
            <meshBasicMaterial color="#4488ff" />
            <mesh rotation={[-Math.PI / 2, 0, 0]} />
          </mesh>
        </>
      );
    } else {
      return (
        <>
          <mesh
            onPointerDown={(e) => handleAxisPointerDown(e, 'x')}
            onPointerMove={handleAxisPointerMove}
            onPointerUp={handleAxisPointerUp}
            onPointerOut={handleAxisPointerUp}
          >
            <torusGeometry args={[0.8, 0.03, 8, 32]} />
            <meshBasicMaterial color="#ff4444" transparent opacity={0.8} />
            <mesh rotation={[0, Math.PI / 2, 0]} />
          </mesh>

          <mesh
            onPointerDown={(e) => handleAxisPointerDown(e, 'y')}
            onPointerMove={handleAxisPointerMove}
            onPointerUp={handleAxisPointerUp}
            onPointerOut={handleAxisPointerUp}
          >
            <torusGeometry args={[0.9, 0.03, 8, 32]} />
            <meshBasicMaterial color="#44ff44" transparent opacity={0.8} />
          </mesh>

          <mesh
            onPointerDown={(e) => handleAxisPointerDown(e, 'z')}
            onPointerMove={handleAxisPointerMove}
            onPointerUp={handleAxisPointerUp}
            onPointerOut={handleAxisPointerUp}
          >
            <torusGeometry args={[0.85, 0.03, 8, 32]} />
            <meshBasicMaterial color="#4488ff" transparent opacity={0.8} />
            <mesh rotation={[Math.PI / 2, 0, 0]} />
          </mesh>
        </>
      );
    }
  };

  return (
    <group
      ref={groupRef}
      position={[
        exhibit.transform.position.x,
        exhibit.transform.position.y,
        exhibit.transform.position.z,
      ]}
      rotation={[
        exhibit.transform.rotation.x,
        exhibit.transform.rotation.y,
        exhibit.transform.rotation.z,
      ]}
      scale={exhibit.transform.scale}
      onClick={handleClick}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
    >
      {renderExhibitContent()}

      {isSelected && (
        <lineSegments>
          <boxGeometry args={[size.width * 1.1, size.height * 1.1, size.depth * 1.1]} />
          <lineBasicMaterial color="#00ffaa" linewidth={2} />
        </lineSegments>
      )}

      {renderHandles()}
    </group>
  );
}
