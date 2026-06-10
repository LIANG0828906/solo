import { useRef, useState, useEffect } from 'react';
import { useFrame, ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { useDreamStore } from '@/store/useDreamStore';
import { playRandomNote } from '@/utils/audio';
import type { DreamNode as DreamNodeType } from '@/types/dream';

interface DreamNodeProps {
  node: DreamNodeType;
}

export function DreamNode({ node }: DreamNodeProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState<[number, number, number]>([0, 0, 0]);

  const {
    dreamIntensity,
    addRipple,
    updateNodePosition,
    addLog,
    selectedNodeId,
    setSelectedNode,
  } = useDreamStore();

  const floatOffset = useRef(Math.random() * Math.PI * 2);
  const isSelected = selectedNodeId === node.id;

  useFrame((state) => {
    if (!meshRef.current || !glowRef.current) return;

    const time = state.clock.elapsedTime;
    const floatSpeed = 0.5 + (dreamIntensity / 100) * 1.5;
    const floatAmplitude = 0.1 + (dreamIntensity / 100) * 0.3;

    if (!isDragging) {
      meshRef.current.position.x = node.basePosition[0] + Math.sin(time * floatSpeed + floatOffset.current) * floatAmplitude;
      meshRef.current.position.y = node.basePosition[1] + Math.cos(time * floatSpeed * 0.7 + floatOffset.current) * floatAmplitude;
      meshRef.current.position.z = node.basePosition[2] + Math.sin(time * floatSpeed * 1.3 + floatOffset.current) * floatAmplitude * 0.5;

      glowRef.current.position.copy(meshRef.current.position);
    }

    const pulseScale = 1 + Math.sin(time * 2 + floatOffset.current) * 0.05;
    const selectedScale = isSelected ? 1.2 : 1;
    meshRef.current.scale.setScalar(pulseScale * selectedScale);
    glowRef.current.scale.setScalar(pulseScale * selectedScale * 1.5);

    const glowOpacity = 0.3 + Math.sin(time * 1.5 + floatOffset.current) * 0.2;
    const glowMaterial = glowRef.current.material as THREE.MeshBasicMaterial;
    glowMaterial.opacity = glowOpacity * (isSelected ? 1.5 : 1);
  });

  const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    setIsDragging(true);
    setSelectedNode(node.id);

    if (e.pointerType === 'mouse') {
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    }

    if (meshRef.current) {
      const worldPos = new THREE.Vector3();
      meshRef.current.getWorldPosition(worldPos);
      setDragOffset([
        worldPos.x - e.point.x,
        worldPos.y - e.point.y,
        worldPos.z - e.point.z,
      ]);
    }
  };

  const handlePointerUp = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    if (isDragging && meshRef.current) {
      const pos: [number, number, number] = [
        meshRef.current.position.x,
        meshRef.current.position.y,
        meshRef.current.position.z,
      ];
      updateNodePosition(node.id, pos);
      addLog('drag', `拖动节点 #${node.id.slice(0, 4)}`, node.id);
    }
    setIsDragging(false);
    setSelectedNode(null);
  };

  const handlePointerMove = (e: ThreeEvent<PointerEvent>) => {
    if (!isDragging || !meshRef.current) return;
    e.stopPropagation();

    meshRef.current.position.set(
      e.point.x + dragOffset[0],
      e.point.y + dragOffset[1],
      e.point.z + dragOffset[2]
    );

    if (glowRef.current) {
      glowRef.current.position.copy(meshRef.current.position);
    }
  };

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (!isDragging) {
      if (meshRef.current) {
        const pos: [number, number, number] = [
          meshRef.current.position.x,
          meshRef.current.position.y,
          meshRef.current.position.z,
        ];
        addRipple(pos, node.color);
      }
      playRandomNote(dreamIntensity);
      addLog('click', `触发节点 #${node.id.slice(0, 4)} 涟漪`, node.id);
    }
  };

  useEffect(() => {
    return () => {
      if (selectedNodeId === node.id) {
        setSelectedNode(null);
      }
    };
  }, [node.id, selectedNodeId, setSelectedNode]);

  return (
    <group>
      <mesh
        ref={meshRef}
        position={node.position as [number, number, number]}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerUp}
        onClick={handleClick}
      >
        <sphereGeometry args={[0.5, 32, 32]} />
        <meshStandardMaterial
          color={node.color}
          transparent
          opacity={0.8}
          emissive={node.color}
          emissiveIntensity={0.5 + (dreamIntensity / 100) * 0.5}
          roughness={0.2}
          metalness={0.8}
        />
      </mesh>

      <mesh ref={glowRef} position={node.position as [number, number, number]}>
        <sphereGeometry args={[0.8, 32, 32]} />
        <meshBasicMaterial
          color={node.glowColor}
          transparent
          opacity={0.3}
          side={THREE.BackSide}
        />
      </mesh>
    </group>
  );
}
