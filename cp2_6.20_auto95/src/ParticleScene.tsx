import React, { useRef, useMemo, useEffect, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Points, PointMaterial } from '@react-three/drei';
import * as THREE from 'three';
import { useParticleStore } from './particleStore';

interface ParticleSystemProps {
  onFpsUpdate: (fps: number) => void;
}

const ParticleSystem: React.FC<ParticleSystemProps> = ({ onFpsUpdate }) => {
  const pointsRef = useRef<THREE.Points>(null);
  const particles = useParticleStore((state) => state.particles);
  const updateParticlePositions = useParticleStore((state) => state.updateParticlePositions);
  const updateTransition = useParticleStore((state) => state.updateTransition);
  const isTransitioning = useParticleStore((state) => state.isTransitioning);

  const [, setFpsCounter] = useState({ frames: 0, lastTime: performance.now() });

  const [positions, colors, sizes] = useMemo(() => {
    const pos = new Float32Array(particles.length * 3);
    const col = new Float32Array(particles.length * 3);
    const siz = new Float32Array(particles.length);

    particles.forEach((p, i) => {
      pos[i * 3] = p.x;
      pos[i * 3 + 1] = p.y;
      pos[i * 3 + 2] = p.z;
      col[i * 3] = p.color[0];
      col[i * 3 + 1] = p.color[1];
      col[i * 3 + 2] = p.color[2];
      siz[i] = p.size;
    });

    return [pos, col, siz];
  }, [particles.length]);

  useEffect(() => {
    if (!pointsRef.current) return;
    
    const geometry = pointsRef.current.geometry;
    const positionAttr = geometry.attributes.position as THREE.BufferAttribute;
    const colorAttr = geometry.attributes.color as THREE.BufferAttribute;
    const sizeAttr = geometry.attributes.size as THREE.BufferAttribute;

    particles.forEach((p, i) => {
      positionAttr.array[i * 3] = p.x;
      positionAttr.array[i * 3 + 1] = p.y;
      positionAttr.array[i * 3 + 2] = p.z;
      colorAttr.array[i * 3] = p.color[0];
      colorAttr.array[i * 3 + 1] = p.color[1];
      colorAttr.array[i * 3 + 2] = p.color[2];
      sizeAttr.array[i] = p.size;
    });

    positionAttr.needsUpdate = true;
    colorAttr.needsUpdate = true;
    sizeAttr.needsUpdate = true;
  }, [particles]);

  const particleTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.2, 'rgba(255, 255, 255, 0.8)');
    gradient.addColorStop(0.4, 'rgba(255, 255, 255, 0.4)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 64, 64);

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  }, []);

  useFrame((_, delta) => {
    const currentTime = performance.now();
    
    setFpsCounter((prev) => {
      const newFrames = prev.frames + 1;
      const elapsed = currentTime - prev.lastTime;
      
      if (elapsed >= 500) {
        const fps = (newFrames / elapsed) * 1000;
        onFpsUpdate(Math.round(fps));
        return { frames: 0, lastTime: currentTime };
      }
      
      return { ...prev, frames: newFrames };
    });

    if (isTransitioning) {
      updateTransition(currentTime);
    } else {
      updateParticlePositions(delta * 60);
    }
  });

  return (
    <Points
      ref={pointsRef}
      positions={positions}
      colors={colors}
      frustumCulled={false}
    >
      <bufferAttribute
        attach="attributes-size"
        args={[sizes, 1]}
      />
      <PointMaterial
        map={particleTexture}
        vertexColors
        size={0.8}
        sizeAttenuation
        transparent
        opacity={0.9}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </Points>
  );
};

const GalaxyCenter: React.FC = () => {
  const params = useParticleStore((state) => state.params);
  const glowIntensity = params.gravityStrength / 100;

  return (
    <mesh>
      <sphereGeometry args={[3, 32, 32]} />
      <meshBasicMaterial
        color="#ff8c42"
        transparent
        opacity={0.3 + glowIntensity * 0.4}
      />
    </mesh>
  );
};

export const ParticleScene: React.FC = () => {
  const setFps = useParticleStore((state) => state.setFps);
  const params = useParticleStore((state) => state.params);

  const handleFpsUpdate = React.useCallback((fps: number) => {
    setFps(fps);
  }, [setFps]);

  return (
    <div className="canvas-container">
      <Canvas
        camera={{ position: [0, 50, 150], fov: 60, near: 0.1, far: 1000 }}
        gl={{ antialias: true, alpha: true }}
        dpr={[1, 2]}
      >
        <color attach="background" args={['#0d0d1a']} />
        <fog attach="fog" args={['#0d0d1a', 150, 350]} />
        
        <ambientLight intensity={0.1} />
        <pointLight position={[0, 0, 0]} intensity={params.gravityStrength / 50} color="#ff6b35" />
        
        <ParticleSystem onFpsUpdate={handleFpsUpdate} />
        <GalaxyCenter />
        
        <OrbitControls
          enableDamping
          dampingFactor={0.05}
          minDistance={30}
          maxDistance={300}
          enablePan={false}
        />
      </Canvas>
    </div>
  );
};
