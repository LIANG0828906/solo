import { useRef, useMemo, useEffect, useState } from 'react';
import { useFrame, ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import type { Fragment, Vec3, Euler3 } from '@/stores/gameStore';
import { useGameStore } from '@/stores/gameStore';
import { lerpVec3, lerpEuler, getPulseIntensity } from '@/modules/physics/PhysicsEngine';

interface FragmentMeshProps {
  fragment: Fragment;
  onPointerDown: (e: ThreeEvent<PointerEvent>, id: string) => void;
  onPointerOver: (e: ThreeEvent<PointerEvent>, id: string) => void;
  onPointerOut: () => void;
}

export function FragmentMesh({
  fragment,
  onPointerDown,
  onPointerOver,
  onPointerOut,
}: FragmentMeshProps) {
  const groupRef = useRef<THREE.Group>(null);
  const edgesRef = useRef<THREE.LineSegments>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const [animating, setAnimating] = useState(false);
  const [animStart, setAnimStart] = useState(0);
  const [animFromPos, setAnimFromPos] = useState<Vec3>(fragment.position);
  const [animFromRot, setAnimFromRot] = useState<Euler3>(fragment.rotation);

  const { selectedId, hoveredId, updateFragment, isComplete } = useGameStore();
  const isSelected = selectedId === fragment.id;
  const isHovered = hoveredId === fragment.id;

  const scale = isHovered && !fragment.isMatched ? 1.05 : 1;

  const geometries = useMemo(() => {
    const result: THREE.BufferGeometry[] = [];
    if (fragment.shapeType === 'box') {
      result.push(
        new THREE.BoxGeometry(
          fragment.shapeParams.width ?? 1,
          fragment.shapeParams.height ?? 1,
          fragment.shapeParams.depth ?? 1,
          8,
          6,
          8
        )
      );
    } else if (fragment.shapeType === 'cylinder') {
      result.push(
        new THREE.CylinderGeometry(
          fragment.shapeParams.radius ?? 0.5,
          (fragment.shapeParams.radius ?? 0.5) * 0.8,
          fragment.shapeParams.height ?? 1,
          fragment.shapeParams.radialSegments ?? 16,
          4
        )
      );
    } else {
      result.push(
        new THREE.BoxGeometry(
          fragment.shapeParams.width ?? 1,
          fragment.shapeParams.height ?? 1,
          fragment.shapeParams.depth ?? 1,
          6,
          5,
          6
        )
      );
      const cyl = new THREE.CylinderGeometry(
        fragment.shapeParams.radius ?? 0.4,
        fragment.shapeParams.radius ?? 0.4,
        (fragment.shapeParams.height ?? 1) * 0.6,
        12
      );
      cyl.translate(0, (fragment.shapeParams.height ?? 1) * 0.2, 0);
      result.push(cyl);
    }
    return result;
  }, [fragment.shapeType, fragment.shapeParams]);

  const edgesGeometry = useMemo(() => {
    const merged = new THREE.BufferGeometry();
    const positions: number[] = [];
    geometries.forEach((geo) => {
      const edge = new THREE.EdgesGeometry(geo, 20);
      const pos = edge.getAttribute('position') as THREE.BufferAttribute;
      for (let i = 0; i < pos.count; i++) {
        positions.push(pos.getX(i), pos.getY(i), pos.getZ(i));
      }
      edge.dispose();
    });
    merged.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    return merged;
  }, [geometries]);

  useEffect(() => {
    if (fragment.isMatched && !animating) {
      setAnimating(true);
      setAnimStart(performance.now());
      setAnimFromPos(fragment.position);
      setAnimFromRot(fragment.rotation);
    }
  }, [fragment.isMatched]);

  useFrame((state) => {
    if (!groupRef.current) return;

    if (animating && fragment.isMatched) {
      const elapsed = (performance.now() - animStart) / 500;
      if (elapsed >= 1) {
        setAnimating(false);
        groupRef.current.position.set(
          fragment.targetPosition[0],
          fragment.targetPosition[1],
          fragment.targetPosition[2]
        );
        groupRef.current.rotation.set(
          fragment.targetRotation[0],
          fragment.targetRotation[1],
          fragment.targetRotation[2]
        );
      } else {
        const pos = lerpVec3(animFromPos, fragment.targetPosition, elapsed);
        const rot = lerpEuler(animFromRot, fragment.targetRotation, elapsed);
        groupRef.current.position.set(pos[0], pos[1], pos[2]);
        groupRef.current.rotation.set(rot[0], rot[1], rot[2]);
      }
    } else if (!isComplete) {
      groupRef.current.position.set(
        fragment.position[0],
        fragment.position[1],
        fragment.position[2]
      );
      groupRef.current.rotation.set(
        fragment.rotation[0],
        fragment.rotation[1],
        fragment.rotation[2]
      );
    }

    groupRef.current.scale.setScalar(scale);

    if (edgesRef.current) {
      const mat = edgesRef.current.material as THREE.LineBasicMaterial;
      if (fragment.isMatched) {
        const intensity = getPulseIntensity(state.clock.elapsedTime, 1);
        const color = new THREE.Color().lerpColors(
          new THREE.Color('#FFD700'),
          new THREE.Color('#FF8C00'),
          intensity
        );
        mat.color = color;
        mat.opacity = 0.6 + 0.4 * intensity;
        (edgesRef.current.material as THREE.LineBasicMaterial).transparent = true;
      } else if (isSelected) {
        mat.color = new THREE.Color('#00FFAA');
        mat.opacity = 1;
        mat.transparent = true;
      } else if (isHovered) {
        mat.color = new THREE.Color('#88FFCC');
        mat.opacity = 0.7;
        mat.transparent = true;
      } else {
        mat.opacity = 0;
      }
    }

    if (glowRef.current && fragment.isMatched) {
      const intensity = getPulseIntensity(state.clock.elapsedTime, 1);
      const glowMat = glowRef.current.material as THREE.MeshBasicMaterial;
      glowMat.opacity = 0.15 + 0.25 * intensity;
    }
  });

  const handleDrag = (e: ThreeEvent<PointerEvent>) => {
    if (fragment.isMatched) return;
    onPointerDown(e, fragment.id);
  };

  const handleOver = (e: ThreeEvent<PointerEvent>) => {
    if (fragment.isMatched) return;
    onPointerOver(e, fragment.id);
    document.body.style.cursor = 'grab';
  };

  const handleOut = () => {
    onPointerOut();
    document.body.style.cursor = 'default';
  };

  return (
    <group
      ref={groupRef}
      position={fragment.position as unknown as THREE.Vector3}
      rotation={fragment.rotation as unknown as THREE.Euler}
      onPointerDown={handleDrag}
      onPointerOver={handleOver}
      onPointerOut={handleOut}
    >
      {geometries.map((geo, i) => (
        <mesh key={i} geometry={geo} castShadow receiveShadow>
          <meshStandardMaterial
            color={fragment.color}
            roughness={0.85}
            metalness={0.15}
            flatShading
          />
        </mesh>
      ))}

      <lineSegments
        ref={edgesRef}
        geometry={edgesGeometry}
      >
        <lineBasicMaterial
          color={isSelected ? '#00FFAA' : '#FFD700'}
          linewidth={2}
          transparent
          opacity={isSelected || isHovered || fragment.isMatched ? 1 : 0}
        />
      </lineSegments>

      {isSelected && (
        <mesh>
          <boxGeometry args={[1.8, 1.4, 1.6]} />
          <meshBasicMaterial
            color="#00FFAA"
            transparent
            opacity={0.08}
            side={THREE.DoubleSide}
            wireframe={false}
          />
        </mesh>
      )}

      {fragment.isMatched && (
        <mesh ref={glowRef}>
          <sphereGeometry args={[1.3, 32, 32]} />
          <meshBasicMaterial
            color="#FFD700"
            transparent
            opacity={0.2}
            side={THREE.BackSide}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      )}
    </group>
  );
}
