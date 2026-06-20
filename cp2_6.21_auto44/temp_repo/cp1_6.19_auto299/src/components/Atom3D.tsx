import { useRef, useEffect, useState } from 'react';
import { useFrame, ThreeEvent } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { useMoleculeStore, Atom } from '../store';
import { ELEMENT_COLORS, ELEMENT_RADIUS } from '../data/molecule';

interface Atom3DProps {
  atom: Atom;
  index: number;
}

export function Atom3D({ atom, index }: Atom3DProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const [entered, setEntered] = useState(false);
  const [mountProgress, setMountProgress] = useState(0);

  const setHoveredAtom = useMoleculeStore((s) => s.setHoveredAtom);
  const setSelectedAtom = useMoleculeStore((s) => s.setSelectedAtom);
  const hoveredAtomId = useMoleculeStore((s) => s.hoveredAtomId);
  const selectedAtomId = useMoleculeStore((s) => s.selectedAtomId);
  const setAtomPosition = useMoleculeStore((s) => s.setAtomPosition);

  const isHovered = hoveredAtomId === atom.id;
  const isSelected = selectedAtomId === atom.id;
  const color = ELEMENT_COLORS[atom.element];
  const baseRadius = ELEMENT_RADIUS[atom.element];

  useEffect(() => {
    const startTime = performance.now() + index * 30;
    const duration = 800;
    let animationId: number;

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(Math.max(elapsed / duration, 0), 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setMountProgress(eased);
      if (progress < 1) {
        animationId = requestAnimationFrame(animate);
      }
    };
    animationId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationId);
  }, [index]);

  useFrame(() => {
    if (!meshRef.current) return;

    const target = atom.isAssembled ? atom.originalPosition : atom.disassembledPosition;
    const current = meshRef.current.position;
    const lerpFactor = 0.06;

    const newX = current.x + (target[0] - current.x) * lerpFactor;
    const newY = current.y + (target[1] - current.y) * lerpFactor;
    const newZ = current.z + (target[2] - current.z) * lerpFactor;

    meshRef.current.position.set(newX, newY, newZ);
    if (glowRef.current) {
      glowRef.current.position.set(newX, newY, newZ);
    }
    setAtomPosition(atom.id, [newX, newY, newZ]);

    const targetScale = (entered || isSelected ? 1.2 : 1) * mountProgress;
    const currentScale = meshRef.current.scale.x;
    const newScale = currentScale + (targetScale - currentScale) * 0.15;
    meshRef.current.scale.setScalar(newScale);

    if (glowRef.current) {
      const glowTarget = isHovered ? 1.6 * mountProgress : 0;
      const glowCurrent = glowRef.current.scale.x;
      const glowScale = glowCurrent + (glowTarget - glowCurrent) * 0.12;
      glowRef.current.scale.setScalar(glowScale);
      const mat = glowRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = isHovered ? 0.25 : 0;
    }
  });

  const handlePointerOver = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    setEntered(true);
    setHoveredAtom(atom.id);
    document.body.style.cursor = 'pointer';
  };

  const handlePointerOut = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    setEntered(false);
    setHoveredAtom(null);
    document.body.style.cursor = 'auto';
  };

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    setSelectedAtom(isSelected ? null : atom.id);
  };

  const showLabel = isHovered && meshRef.current && mountProgress > 0.8;

  return (
    <group>
      <mesh ref={glowRef} visible={isHovered}>
        <sphereGeometry args={[baseRadius, 32, 32]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0}
          side={THREE.BackSide}
          depthWrite={false}
        />
      </mesh>

      <mesh
        ref={meshRef}
        scale={0}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        onClick={handleClick}
        castShadow
        receiveShadow
      >
        <sphereGeometry args={[baseRadius, 32, 32]} />
        <meshStandardMaterial
          color={color}
          roughness={0.25}
          metalness={0.7}
          emissive={color}
          emissiveIntensity={isHovered ? 0.35 : 0.08}
        />
      </mesh>

      {showLabel && (
        <Html
          position={[
            meshRef.current!.position.x,
            meshRef.current!.position.y + baseRadius + 0.45,
            meshRef.current!.position.z,
          ]}
          center
          distanceFactor={8}
          style={{ pointerEvents: 'none', zIndex: 100 }}
        >
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.92)',
              color: '#2C3E50',
              padding: '8px 14px',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 600,
              whiteSpace: 'nowrap',
              boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
              fontFamily: 'system-ui, -apple-system, "Segoe UI", sans-serif',
              border: `2px solid ${color}`,
              backdropFilter: 'blur(4px)',
            }}
          >
            <span style={{ color: color, marginRight: '8px', fontSize: '12px' }}>●</span>
            {atom.element} - {atom.role}
          </div>
        </Html>
      )}
    </group>
  );
}
