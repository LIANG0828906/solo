import { useRef, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Points, PointMaterial } from '@react-three/drei';
import * as THREE from 'three';
import type { QuantumNodeData } from '../types';
import { CYBER_COLORS } from '../types';

interface QuantumNodeProps {
  node: QuantumNodeData;
  isSelected: boolean;
  isCollapsing: boolean;
  onPointerDown: (e: any) => void;
  onPointerUp: (e: any) => void;
  onPointerOver: (e: any) => void;
  onPointerOut: (e: any) => void;
  onClick: (e: any) => void;
}

export default function QuantumNode({
  node,
  isSelected,
  isCollapsing,
  onPointerDown,
  onPointerUp,
  onPointerOver,
  onPointerOut,
  onClick,
}: QuantumNodeProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const outerGlowRef = useRef<THREE.Mesh>(null);
  const particlesRef = useRef<THREE.Points>(null);
  const [hovered, setHovered] = useState(false);

  const particleCount = 80;

  const particlePositions = useMemo(() => {
    const positions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const radius = 0.4 + Math.random() * 0.3;
      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = radius * Math.cos(phi);
    }
    return positions;
  }, []);

  const gradientTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d')!;
    const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    gradient.addColorStop(0, node.color);
    gradient.addColorStop(0.5, node.color + '80');
    gradient.addColorStop(1, 'transparent');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 128, 128);
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  }, [node.color]);

  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += delta * node.spinSpeed * 0.5;
      meshRef.current.rotation.y += delta * node.spinSpeed * 0.8;
      meshRef.current.rotation.z += delta * node.spinSpeed * 0.3;

      if (isCollapsing) {
        const collapsePhase = Math.sin(Date.now() * 0.01) * 0.5 + 0.5;
        const scale = isCollapsing ? (collapsePhase < 0.5 ? 1 - collapsePhase : collapsePhase) : 1;
        meshRef.current.scale.setScalar(scale * (hovered || isSelected ? 1.2 : 1));
      } else {
        meshRef.current.scale.setScalar(hovered || isSelected ? 1.2 : 1);
      }
    }

    if (outerGlowRef.current) {
      outerGlowRef.current.rotation.y -= delta * 0.3;
      outerGlowRef.current.rotation.x += delta * 0.2;
      const glowPulse = 1 + Math.sin(Date.now() * 0.003) * 0.15;
      outerGlowRef.current.scale.setScalar(glowPulse);
    }

    if (particlesRef.current) {
      particlesRef.current.rotation.y += delta * node.spinSpeed * 0.3;
      particlesRef.current.rotation.x += delta * node.spinSpeed * 0.2;
      const positions = particlesRef.current.geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < particleCount; i++) {
        const idx = i * 3;
        const wave = Math.sin(Date.now() * 0.002 + i * 0.2) * 0.02;
        positions[idx] += wave;
        positions[idx + 1] += wave * 0.5;
        positions[idx + 2] -= wave * 0.3;
      }
      particlesRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  const handlePointerOver = (e: any) => {
    e.stopPropagation();
    setHovered(true);
    document.body.style.cursor = 'pointer';
    onPointerOver(e);
  };

  const handlePointerOut = (e: any) => {
    e.stopPropagation();
    setHovered(false);
    document.body.style.cursor = 'auto';
    onPointerOut(e);
  };

  const nodeColor = isSelected ? CYBER_COLORS.neonCyan : node.color;

  return (
    <group position={node.position}>
      <mesh
        ref={outerGlowRef}
        scale={1.5}
      >
        <sphereGeometry args={[0.6, 32, 32]} />
        <meshBasicMaterial
          color={nodeColor}
          transparent
          opacity={0.15}
          side={THREE.BackSide}
        />
      </mesh>

      <mesh
        ref={meshRef}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        onClick={onClick}
      >
        <sphereGeometry args={[0.3, 32, 32]} />
        <meshStandardMaterial
          color={nodeColor}
          emissive={nodeColor}
          emissiveIntensity={isSelected || hovered ? 2 : 1}
          metalness={0.8}
          roughness={0.2}
          map={gradientTexture}
          transparent
          opacity={0.95}
        />
      </mesh>

      <Points
        ref={particlesRef as React.RefObject<THREE.Points<THREE.BufferGeometry, THREE.PointsMaterial>>}
        positions={particlePositions}
        stride={3}
        frustumCulled={false}
      >
        <PointMaterial
          transparent
          color={nodeColor}
          size={0.05}
          sizeAttenuation
          opacity={0.8}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </Points>

      <mesh>
        <ringGeometry args={[0.45, 0.5, 64]} />
        <meshBasicMaterial
          color={nodeColor}
          transparent
          opacity={0.4}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}
