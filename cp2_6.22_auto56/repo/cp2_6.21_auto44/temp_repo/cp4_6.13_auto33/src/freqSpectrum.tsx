import { useRef, useMemo, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useStore } from './store';

interface Particle {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  life: number;
  maxLife: number;
  size: number;
}

export function FreqSpectrum() {
  const barsRef = useRef<THREE.InstancedMesh>(null);
  const particlesRef = useRef<THREE.Points>(null);
  const frequencies = useStore((state) => state.spectrumData.frequencies);
  const isPlaying = useStore((state) => state.playbackState.isPlaying);
  const isLoaded = useStore((state) => state.playbackState.isLoaded);

  const barCount = 128;
  const targetHeights = useRef(new Float32Array(barCount));
  const currentHeights = useRef(new Float32Array(barCount));
  const velocities = useRef(new Float32Array(barCount));

  const particles = useRef<Particle[]>([]);
  const maxParticles = 200;

  const dummy = useMemo(() => new THREE.Object3D(), []);
  const barColors = useMemo(() => new Float32Array(barCount * 3), []);

  const barGeometry = useMemo(() => new THREE.BoxGeometry(0.15, 1, 0.15), []);
  const barMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        metalness: 0.3,
        roughness: 0.4,
      }),
    []
  );

  const particleGeometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(maxParticles * 3);
    const colors = new Float32Array(maxParticles * 3);
    const sizes = new Float32Array(maxParticles);
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    return geo;
  }, []);

  const particleMaterial = useMemo(
    () =>
      new THREE.PointsMaterial({
        size: 0.1,
        vertexColors: true,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending,
        sizeAttenuation: true,
      }),
    []
  );

  const getBarColor = useCallback((index: number, height: number) => {
    const t = index / barCount;
    const r = 1.0 - t * 0.5 + height * 0.3;
    const g = 0.3 + t * 0.3;
    const b = 0.2 + t * 0.8;
    return new THREE.Color(
      Math.min(1, Math.max(0, r)),
      Math.min(1, Math.max(0, g)),
      Math.min(1, Math.max(0, b))
    );
  }, []);

  const spawnParticles = useCallback((barIndex: number, barHeight: number) => {
    if (particles.current.length >= maxParticles || barHeight <= 0.7) return;

    const spawnCount = Math.min(3, Math.floor((barHeight - 0.7) * 10));
    const barX = (barIndex - barCount / 2) * 0.2;

    for (let i = 0; i < spawnCount; i++) {
      if (particles.current.length >= maxParticles) break;

      const particle: Particle = {
        position: new THREE.Vector3(
          barX + (Math.random() - 0.5) * 0.3,
          barHeight * 3 + Math.random() * 0.5,
          (Math.random() - 0.5) * 0.3
        ),
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 0.1,
          Math.random() * 0.15 + 0.05,
          (Math.random() - 0.5) * 0.1
        ),
        life: 1.0,
        maxLife: 0.5 + Math.random() * 0.5,
        size: 0.05 + Math.random() * 0.1,
      };
      particles.current.push(particle);
    }
  }, []);

  useFrame((_, delta) => {
    const damping = 0.85;
    const springStrength = 25;

    for (let i = 0; i < barCount; i++) {
      targetHeights.current[i] = isPlaying && isLoaded ? frequencies[i] || 0 : 0;
      
      const force = (targetHeights.current[i] - currentHeights.current[i]) * springStrength;
      velocities.current[i] += force * delta;
      velocities.current[i] *= damping;
      currentHeights.current[i] += velocities.current[i];
      
      if (currentHeights.current[i] < 0.001) {
        currentHeights.current[i] = 0;
        velocities.current[i] = 0;
      }

      if (barsRef.current) {
        const height = Math.max(0.01, currentHeights.current[i] * 3);
        const x = (i - barCount / 2) * 0.2;
        
        dummy.position.set(x, height / 2, 0);
        dummy.scale.set(1, height, 1);
        dummy.updateMatrix();
        barsRef.current.setMatrixAt(i, dummy.matrix);

        const color = getBarColor(i, currentHeights.current[i]);
        barColors[i * 3] = color.r;
        barColors[i * 3 + 1] = color.g;
        barColors[i * 3 + 2] = color.b;

        if (currentHeights.current[i] > 0.7 && isPlaying) {
          spawnParticles(i, currentHeights.current[i]);
        }
      }
    }

    if (barsRef.current) {
      barsRef.current.instanceMatrix.needsUpdate = true;
      const colorAttribute = barsRef.current.instanceColor;
      if (colorAttribute) {
        colorAttribute.array.set(barColors);
        colorAttribute.needsUpdate = true;
      }
    }

    const positions = particleGeometry.attributes.position.array as Float32Array;
    const colors = particleGeometry.attributes.color.array as Float32Array;
    const sizes = particleGeometry.attributes.size.array as Float32Array;

    particles.current = particles.current.filter((p) => p.life > 0);

    for (let i = 0; i < maxParticles; i++) {
      if (i < particles.current.length) {
        const p = particles.current[i];
        p.position.add(p.velocity.clone().multiplyScalar(delta * 60));
        p.velocity.y -= 0.002;
        p.life -= delta / p.maxLife;

        const alpha = Math.max(0, p.life);
        positions[i * 3] = p.position.x;
        positions[i * 3 + 1] = p.position.y;
        positions[i * 3 + 2] = p.position.z;
        colors[i * 3] = 1.0 * alpha;
        colors[i * 3 + 1] = 0.5 * alpha;
        colors[i * 3 + 2] = 0.8 * alpha;
        sizes[i] = p.size * alpha;
      } else {
        positions[i * 3] = 0;
        positions[i * 3 + 1] = -100;
        positions[i * 3 + 2] = 0;
        sizes[i] = 0;
      }
    }

    particleGeometry.attributes.position.needsUpdate = true;
    particleGeometry.attributes.color.needsUpdate = true;
    particleGeometry.attributes.size.needsUpdate = true;
  });

  return (
    <group position={[0, -0.5, 0]}>
      <instancedMesh
        ref={barsRef}
        args={[barGeometry, barMaterial, barCount]}
        castShadow
        receiveShadow
      >
        <instancedBufferAttribute
          attach="instanceColor"
          args={[barColors, 3]}
        />
      </instancedMesh>
      <points ref={particlesRef} geometry={particleGeometry} material={particleMaterial} />
    </group>
  );
}
