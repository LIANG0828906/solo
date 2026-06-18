import React, { useRef, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useAppStore, Point2D } from '../../store/appStore';

interface TrailParticle {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  birthTime: number;
  life: number;
  size: number;
}

const MAX_TOTAL_PARTICLES = 1500;
const MAX_BACKGROUND_PARTICLES = 100;
const MAX_TRAIL_PARTICLES = MAX_TOTAL_PARTICLES - MAX_BACKGROUND_PARTICLES - 200;

const mapTo3D = (point: Point2D, canvasW: number, canvasH: number): THREE.Vector3 => {
  const scale = 0.02;
  return new THREE.Vector3(
    (point.x - canvasW / 2) * scale,
    0.5,
    (point.y - canvasH / 2) * scale
  );
};

const ParticleSystem: React.FC = () => {
  const trailParticlesRef = useRef<THREE.Points>(null);
  const trailDataRef = useRef<TrailParticle[]>([]);
  const lastPointRef = useRef<THREE.Vector3 | null>(null);
  const lastSpawnTime = useRef<number>(0);

  const { pathPoints, isDrawing } = useAppStore();
  const [canvasSize, setCanvasSize] = useState({ w: 800, h: 600 });

  useEffect(() => {
    const updateSize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      setCanvasSize({ w: w <= 768 ? w : w - 280, h: w <= 768 ? h - 80 : h });
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  const spawnTrailParticle = (position: THREE.Vector3, now: number) => {
    if (trailDataRef.current.length >= MAX_TRAIL_PARTICLES) {
      trailDataRef.current.shift();
    }
    const angle = Math.random() * Math.PI * 2;
    const spread = Math.random() * 0.1;
    trailDataRef.current.push({
      position: new THREE.Vector3(
        position.x + Math.cos(angle) * spread,
        position.y + (Math.random() - 0.3) * 0.2,
        position.z + Math.sin(angle) * spread
      ),
      velocity: new THREE.Vector3(
        (Math.random() - 0.5) * 0.002,
        Math.random() * 0.003 + 0.001,
        (Math.random() - 0.5) * 0.002
      ),
      birthTime: now,
      life: 2 + Math.random() * 0.5,
      size: 0.3 + Math.random() * 0.5
    });
  };

  useFrame((_, delta) => {
    const now = performance.now();

    if (isDrawing && pathPoints.length > 0) {
      const last2D = pathPoints[pathPoints.length - 1];
      const currentPos = mapTo3D(last2D, canvasSize.w, canvasSize.h);

      if (now - lastSpawnTime.current > 33) {
        if (lastPointRef.current) {
          const dist = currentPos.distanceTo(lastPointRef.current);
          const steps = Math.max(1, Math.ceil(dist / 0.08));
          for (let i = 0; i < steps; i++) {
            const t = i / steps;
            const interpPos = lastPointRef.current.clone().lerp(currentPos, t);
            spawnTrailParticle(interpPos, now + i * 10);
          }
        } else {
          spawnTrailParticle(currentPos, now);
        }
        lastSpawnTime.current = now;
      }
      lastPointRef.current = currentPos.clone();
    } else if (!isDrawing) {
      lastPointRef.current = null;
    }

    const positions = new Float32Array(trailDataRef.current.length * 3);
    const colors = new Float32Array(trailDataRef.current.length * 3);
    const sizes = new Float32Array(trailDataRef.current.length);
    let writeIdx = 0;

    trailDataRef.current = trailDataRef.current.filter(p => {
      const age = (now - p.birthTime) / 1000;
      if (age >= p.life) return false;

      p.position.add(p.velocity);
      p.velocity.y -= 0.0001;

      const lifeRatio = age / p.life;
      const alpha = Math.max(0, 1 - lifeRatio) * 0.4;

      positions[writeIdx * 3] = p.position.x;
      positions[writeIdx * 3 + 1] = p.position.y;
      positions[writeIdx * 3 + 2] = p.position.z;

      colors[writeIdx * 3] = 1 * alpha;
      colors[writeIdx * 3 + 1] = 1 * alpha;
      colors[writeIdx * 3 + 2] = 1 * alpha;

      sizes[writeIdx] = p.size * (1 - lifeRatio * 0.5);
      writeIdx++;
      return true;
    });

    if (trailParticlesRef.current) {
      const geo = trailParticlesRef.current.geometry as THREE.BufferGeometry;
      const trimmedPositions = positions.slice(0, writeIdx * 3);
      const trimmedColors = colors.slice(0, writeIdx * 3);
      geo.setAttribute('position', new THREE.BufferAttribute(trimmedPositions, 3));
      geo.setAttribute('color', new THREE.BufferAttribute(trimmedColors, 3));
      if (geo.attributes.position) geo.attributes.position.needsUpdate = true;
      if (geo.attributes.color) geo.attributes.color.needsUpdate = true;
    }
  });

  return (
    <group>
      <points ref={trailParticlesRef}>
        <bufferGeometry />
        <pointsMaterial
          vertexColors
          size={0.8}
          transparent
          opacity={0.9}
          sizeAttenuation
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  );
};

export default ParticleSystem;
