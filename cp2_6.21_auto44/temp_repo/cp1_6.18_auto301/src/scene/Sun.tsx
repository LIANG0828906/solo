import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export function Sun() {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);

  const sunTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;
    const gradient = ctx.createRadialGradient(128, 128, 20, 128, 128, 128);
    gradient.addColorStop(0, '#FFFFAA');
    gradient.addColorStop(0.4, '#FFCC33');
    gradient.addColorStop(0.7, '#FF9900');
    gradient.addColorStop(1, '#FF6600');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 256, 256);

    for (let i = 0; i < 80; i++) {
      const x = Math.random() * 256;
      const y = Math.random() * 256;
      const r = Math.random() * 8 + 2;
      ctx.fillStyle = `rgba(255, ${Math.floor(150 + Math.random() * 100)}, 0, ${Math.random() * 0.4})`;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.needsUpdate = true;
    return tex;
  }, []);

  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.05;
    }
    if (glowRef.current) {
      const scale = 1 + Math.sin(performance.now() * 0.002) * 0.05;
      glowRef.current.scale.set(scale, scale, scale);
    }
  });

  return (
    <group>
      <mesh ref={meshRef}>
        <sphereGeometry args={[2, 64, 64]} />
        <meshBasicMaterial map={sunTexture} />
      </mesh>
      <mesh ref={glowRef}>
        <sphereGeometry args={[2.3, 32, 32]} />
        <meshBasicMaterial
          color="#FFAA00"
          transparent
          opacity={0.15}
          side={THREE.BackSide}
        />
      </mesh>
      <pointLight color="#FFFFAA" intensity={2} distance={100} decay={2} />
    </group>
  );
}
