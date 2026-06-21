import { useRef, useMemo, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { PartData } from '@/types';
import { PartLabel } from './PartLabel';
import { useExplosionStore } from '@/store/explosionStore';
import { createGeometry } from '@/utils/geometryFactory';

/**
 * 单个部件渲染组件
 *
 * 职责：根据 part 数据渲染一个部件（可能包含多个子网格），
 *       处理悬停高亮、点击选中自转、标签显示。
 *
 * 数据流向：
 *   props(part, offset, isSelected)
 *     → 计算拆解后位置 = defaultPosition + explodeAxis * offset
 *     → 遍历 subMeshes 渲染多个 mesh
 *     → 悬停显示 Edges 轮廓
 *     → 选中时 useFrame 更新 group.rotation.y
 *
 * 调用方：Scene 组件遍历 BRONZE_DING_PARTS 渲染本组件
 */

interface PartMeshProps {
  part: PartData;
  offset: number;
  isSelected: boolean;
}

export function PartMesh({ part, offset, isSelected }: PartMeshProps) {
  const groupRef = useRef<THREE.Group>(null);
  const centerRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  const togglePartSelection = useExplosionStore((s) => s.togglePartSelection);

  const subGeometries = useMemo(
    () => part.subMeshes.map((sm) => createGeometry(sm.geometryType)),
    [part.subMeshes]
  );

  const finalPosition = useMemo(() => {
    const axis = new THREE.Vector3(...part.explodeAxis).normalize();
    const base = new THREE.Vector3(...part.defaultPosition);
    return base.add(axis.multiplyScalar(offset));
  }, [part.defaultPosition, part.explodeAxis, offset]);

  const worldPos = useMemo(() => new THREE.Vector3(), []);

  useFrame((_, delta) => {
    if (centerRef.current) {
      centerRef.current.getWorldPosition(worldPos);
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
    <group
      ref={groupRef}
      position={finalPosition.toArray() as [number, number, number]}
    >
      <group ref={centerRef}>
        {part.subMeshes.map((sub, idx) => (
          <group
            key={`${part.id}-sub-${idx}`}
            position={sub.position}
            rotation={(sub.rotation as [number, number, number]) || [0, 0, 0]}
            onPointerOver={handlePointerOver}
            onPointerOut={handlePointerOut}
            onClick={handleClick}
          >
            <mesh
              geometry={subGeometries[idx]}
              material={material}
              castShadow
              receiveShadow
            >
              {hovered && (
                <lineSegments>
                  <edgesGeometry args={[subGeometries[idx]]} />
                  <lineBasicMaterial color="#ffffff" linewidth={2} />
                </lineSegments>
              )}
            </mesh>
          </group>
        ))}
      </group>
      <PartLabel part={part} worldPosition={worldPos} />
    </group>
  );
}
