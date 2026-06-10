import { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Calculus, ELEMENT_COLORS } from '@/types';
import { useAudio } from '@/hooks/useAudio';

interface Calculus3DProps {
  calculus: Calculus;
  isSelected: boolean;
  onSelect: () => void;
  onRotate: () => void;
  onFlip: () => void;
  onRemove: () => void;
  onLongPress: (active: boolean) => void;
}

export function Calculus3D({ calculus, isSelected, onSelect, onRotate, onFlip, onRemove, onLongPress }: Calculus3DProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const [placedAnimation, setPlacedAnimation] = useState(true);
  const [bounceOffset, setBounceOffset] = useState(0);
  const longPressTimer = useRef<number | null>(null);
  const isDragging = useRef(false);
  
  const { playRotateSound, playFlipSound } = useAudio();

  useEffect(() => {
    setPlacedAnimation(true);
    const timer = setTimeout(() => setPlacedAnimation(false), 500);
    return () => clearTimeout(timer);
  }, [calculus.position]);

  useFrame((state) => {
    if (meshRef.current) {
      const targetY = calculus.position?.y ?? 0.5;
      const time = state.clock.elapsedTime;
      
      if (placedAnimation) {
        const bounce = Math.sin(time * 8) * Math.exp(-time * 4) * 0.3;
        setBounceOffset(bounce);
      } else {
        setBounceOffset(0);
      }

      meshRef.current.position.y = targetY + bounceOffset;
      
      const targetRotation = (calculus.rotation * Math.PI) / 180;
      meshRef.current.rotation.y = THREE.MathUtils.lerp(
        meshRef.current.rotation.y,
        targetRotation,
        0.1
      );
      
      const targetScaleY = calculus.flipped ? -1 : 1;
      meshRef.current.scale.y = THREE.MathUtils.lerp(
        meshRef.current.scale.y,
        targetScaleY,
        0.1
      );

      if (isSelected || hovered) {
        meshRef.current.position.y += Math.sin(time * 3) * 0.05;
      }
    }
  });

  const handlePointerDown = (e: any) => {
    e.stopPropagation();
    isDragging.current = false;
    
    longPressTimer.current = window.setTimeout(() => {
      onLongPress(true);
    }, 500);
  };

  const handlePointerUp = (e: any) => {
    e.stopPropagation();
    
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
      onLongPress(false);
      
      if (!isDragging.current) {
        if (e.shiftKey) {
          onFlip();
          playFlipSound();
        } else {
          onRotate();
          playRotateSound();
        }
      }
    }
  };

  const handlePointerMove = () => {
    isDragging.current = true;
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
      onLongPress(false);
    }
  };

  const handleDoubleClick = (e: any) => {
    e.stopPropagation();
    onRemove();
  };

  const color = ELEMENT_COLORS[calculus.element];
  const emissiveIntensity = isSelected ? 0.3 : hovered ? 0.15 : 0;

  return (
    <group position={[calculus.position?.x ?? 0, 0, calculus.position?.z ?? 0]}>
      <mesh
        ref={meshRef}
        position={[0, 0.5, 0]}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerMove={handlePointerMove}
        onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = 'pointer'; }}
        onPointerOut={() => { setHovered(false); document.body.style.cursor = 'default'; }}
        onDoubleClick={handleDoubleClick}
        onClick={(e) => { e.stopPropagation(); onSelect(); }}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[0.8, 0.15, 1.2]} />
        <meshStandardMaterial
          color={color}
          roughness={0.4}
          metalness={0.3}
          emissive={color}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>

      <mesh position={[0, 0.65, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.6, 0.9]} />
        <meshBasicMaterial
          color="#2b1e0e"
          transparent
          opacity={0.9}
          side={THREE.DoubleSide}
        />
      </mesh>

      {isSelected && (
        <mesh position={[0, 0.58, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.5, 0.6, 32]} />
          <meshBasicMaterial
            color="#c0392b"
            transparent
            opacity={0.8}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}

      <mesh position={[0, 0.08, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.45, 0.55, 4]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.3}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}
