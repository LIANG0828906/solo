import { useRef, useMemo, useEffect, useState, useCallback } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { useParticleStore } from './particleStore';
import { getColorByDistance } from './utils/colorUtils';

const MAX_DISTANCE = 100;

const createParticleTexture = (): THREE.Texture => {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;

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
};

const ParticleSystem = ({ onFpsUpdate }: { onFpsUpdate: (fps: number) => void }) => {
  const pointsRef = useRef<THREE.Points>(null);
  const particles = useParticleStore((state) => state.particles);
  const updateParticlePositions = useParticleStore((state) => state.updateParticlePositions);
  const updateTransition = useParticleStore((state) => state.updateTransition);
  const isTransitioning = useParticleStore((state) => state.isTransitioning);

  const [, setFpsCounter] = useState({ frames: 0, lastTime: performance.now() });

  const particleTexture = useMemo(() => createParticleTexture(), []);

  const { geometry, material } = useMemo(() => {
    const count = Math.max(particles.length, 1);
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const mat = new THREE.PointsMaterial({
      size: 1.2,
      sizeAttenuation: true,
      vertexColors: true,
      map: particleTexture,
      transparent: true,
      opacity: 0.95,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });

    return { geometry: geo, material: mat };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!geometry) return;
    const count = particles.length;
    const positionAttr = geometry.attributes.position as THREE.BufferAttribute;

    if (positionAttr.count !== count) {
      const newPositions = new Float32Array(count * 3);
      const newColors = new Float32Array(count * 3);
      const newSizes = new Float32Array(count);
      geometry.setAttribute('position', new THREE.BufferAttribute(newPositions, 3));
      geometry.setAttribute('color', new THREE.BufferAttribute(newColors, 3));
      geometry.setAttribute('size', new THREE.BufferAttribute(newSizes, 1));
    }
  }, [particles.length, geometry]);

  const updateBuffers = useCallback(() => {
    if (!geometry || particles.length === 0) return;
    const positionAttr = geometry.attributes.position as THREE.BufferAttribute;
    const colorAttr = geometry.attributes.color as THREE.BufferAttribute;
    const sizeAttr = geometry.attributes.size as THREE.BufferAttribute;
    const posArr = positionAttr.array as Float32Array;
    const colArr = colorAttr.array as Float32Array;
    const sizArr = sizeAttr.array as Float32Array;

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      const i3 = i * 3;

      posArr[i3] = p.x;
      posArr[i3 + 1] = p.y;
      posArr[i3 + 2] = p.z;

      const distance = Math.sqrt(p.x * p.x + p.y * p.y + p.z * p.z);
      let normalizedDistance = distance / MAX_DISTANCE;
      normalizedDistance = Math.max(0, Math.min(1, normalizedDistance));
      const mappedDistance = Math.pow(normalizedDistance, 0.7);

      const color = getColorByDistance(mappedDistance);
      colArr[i3] = color[0];
      colArr[i3 + 1] = color[1];
      colArr[i3 + 2] = color[2];

      sizArr[i] = 3 - mappedDistance * 2;
    }

    positionAttr.needsUpdate = true;
    colorAttr.needsUpdate = true;
    sizeAttr.needsUpdate = true;
  }, [particles, geometry]);

  useEffect(() => {
    updateBuffers();
  }, [updateBuffers]);

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

    updateBuffers();
  });

  return <points ref={pointsRef} geometry={geometry} material={material} frustumCulled={false} />;
};

const GalaxyCenter = () => {
  const params = useParticleStore((state) => state.params);
  const glowIntensity = params.gravityStrength / 100;

  return (
    <mesh>
      <sphereGeometry args={[3, 32, 32]} />
      <meshBasicMaterial color="#ff8c42" transparent opacity={0.3 + glowIntensity * 0.4} />
    </mesh>
  );
};

export const ParticleScene = () => {
  const setFps = useParticleStore((state) => state.setFps);
  const params = useParticleStore((state) => state.params);

  const handleFpsUpdate = useCallback((fps: number) => {
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

        <OrbitControls enableDamping dampingFactor={0.05} minDistance={30} maxDistance={300} enablePan={false} />
      </Canvas>
    </div>
  );
};
