import { useRef, useMemo, useState, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { PartData, SubMeshData } from '@/types';
import { PartLabel } from './PartLabel';
import { useExplosionStore } from '@/store/explosionStore';
import { createGeometry } from '@/utils/geometryFactory';

/**
 * 单个部件渲染组件
 *
 * 职责：根据 part 数据渲染一个部件（可能包含多个子网格），
 *       处理悬停高亮、点击选中自转、标签显示。
 *
 * 子网格拆分逻辑：
 *   1. 遍历 part.subMeshes 数组，为每个子网格创建独立的 THREE.Mesh
 *   2. 每个子网格拥有独立的位置 (sub.position)、旋转 (sub.rotation)
 *   3. 所有子网格共享同一材质（部件级别）和拆解偏移（部件级别）
 *   4. 交互事件在子网格上触发，但状态在部件级别管理
 *
 * 数据流向：
 *   props(part, offset, isSelected)
 *     → 计算拆解后位置 = defaultPosition + explodeAxis * offset
 *     → 遍历 subMeshes 渲染多个独立 mesh（每个含独立几何+位置）
 *     → 悬停显示 Edges 轮廓
 *     → 选中时 useFrame 更新外层 group.rotation.y
 *
 * 调用方：Scene 组件遍历 BRONZE_DING_PARTS 渲染本组件
 */

interface PartMeshProps {
  part: PartData;
  offset: number;
  isSelected: boolean;
}

interface SubMeshProps {
  subMesh: SubMeshData;
  geometry: THREE.BufferGeometry;
  material: THREE.MeshStandardMaterial;
  hovered: boolean;
  onPointerOver: (e: any) => void;
  onPointerOut: (e: any) => void;
  onClick: (e: any) => void;
}

function SubMesh({
  subMesh,
  geometry,
  material,
  hovered,
  onPointerOver,
  onPointerOut,
  onClick,
}: SubMeshProps) {
  const position = subMesh.position as [number, number, number];
  const rotation = (subMesh.rotation as [number, number, number]) || [0, 0, 0];

  return (
    <group position={position} rotation={rotation}>
      <mesh
        geometry={geometry}
        material={material}
        castShadow
        receiveShadow
        onPointerOver={onPointerOver}
        onPointerOut={onPointerOut}
        onClick={onClick}
      >
        {hovered && (
          <lineSegments>
            <edgesGeometry args={[geometry]} />
            <lineBasicMaterial color="#ffffff" linewidth={2} />
          </lineSegments>
        )}
      </mesh>
    </group>
  );
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

  const handlePointerOver = useCallback((e: any) => {
    e.stopPropagation();
    setHovered(true);
    document.body.style.cursor = 'pointer';
  }, []);

  const handlePointerOut = useCallback((e: any) => {
    e.stopPropagation();
    setHovered(false);
    document.body.style.cursor = 'auto';
  }, []);

  const handleClick = useCallback(
    (e: any) => {
      e.stopPropagation();
      togglePartSelection(part.id);
    },
    [part.id, togglePartSelection]
  );

  return (
    <group
      ref={groupRef}
      position={finalPosition.toArray() as [number, number, number]}
    >
      <group ref={centerRef}>
        {part.subMeshes.map((sub, idx) => (
          <SubMesh
            key={`${part.id}-sub-${idx}`}
            subMesh={sub}
            geometry={subGeometries[idx]}
            material={material}
            hovered={hovered}
            onPointerOver={handlePointerOver}
            onPointerOut={handlePointerOut}
            onClick={handleClick}
          />
        ))}
      </group>
      <PartLabel part={part} worldPosition={worldPos} />
    </group>
  );
}
