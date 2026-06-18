import React, { useRef, useMemo, useEffect, useState } from 'react';
import { useFrame, ThreeEvent } from '@react-three/fiber';
import { Line } from '@react-three/drei';
import * as THREE from 'three';
import { useAppStore, Point2D } from '../../store/appStore';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'three-line': any;
      'three-lineSegments': any;
    }
  }
}

interface SphereData {
  position: THREE.Vector3;
  radius: number;
  color: THREE.Color;
  phase: number;
}

interface ParticleData {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  color: THREE.Color;
  birthTime: number;
  life: number;
}

const mapTo3D = (point: Point2D, canvasWidth: number, canvasHeight: number): THREE.Vector3 => {
  const scale = 0.02;
  const x = (point.x - canvasWidth / 2) * scale;
  const z = (point.y - canvasHeight / 2) * scale;
  return new THREE.Vector3(x, 0.5, z);
};

const getGradientColor = (t: number): THREE.Color => {
  const colors = [
    new THREE.Color('#FFD93D'),
    new THREE.Color('#FF6B6B'),
    new THREE.Color('#6BCB77')
  ];
  const scaled = t * (colors.length - 1);
  const idx = Math.floor(scaled);
  const frac = scaled - idx;
  if (idx >= colors.length - 1) return colors[colors.length - 1].clone();
  return colors[idx].clone().lerp(colors[idx + 1], frac);
};

const cubicBezier = (t: number): number => {
  const p0 = 0, p1 = 0.25, p2 = 0.1, p3 = 0.25, p4 = 1;
  const cx = 3 * p1;
  const bx = 3 * (p3 - p1) - cx;
  const ax = 1 - cx - bx;
  const cy = 3 * p2;
  const by = 3 * p4 - cy - 1;
  const ay = 1 - cy - by;
  let tSquared, tCubed;
  let resultX;
  let t0 = t;
  for (let i = 0; i < 8; i++) {
    tSquared = t0 * t0;
    tCubed = tSquared * t0;
    resultX = (ax * tCubed) + (bx * tSquared) + (cx * t0) - t;
    if (Math.abs(resultX) < 1e-6) break;
    const dx = (3 * ax * tSquared) + (2 * bx * t0) + cx;
    if (Math.abs(dx) < 1e-6) break;
    t0 -= resultX / dx;
  }
  tSquared = t0 * t0;
  tCubed = tSquared * t0;
  return (ay * tCubed) + (by * tSquared) + (cy * t0);
};

const GrowingPath: React.FC = () => {
  const lineRef = useRef<any>(null);
  const glowLineRef = useRef<any>(null);
  const spheresRef = useRef<THREE.Group>(null);
  const connectionsRef = useRef<any>(null);
  const growParticlesRef = useRef<THREE.Points>(null);

  const { pathPoints, growthPhase, particleDensity } = useAppStore();
  const [canvasSize, setCanvasSize] = useState({ w: 800, h: 600 });
  const growthStartTime = useRef<number>(0);
  const spheresData = useRef<SphereData[]>([]);
  const growParticlesData = useRef<ParticleData[]>([]);

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

  const points3D = useMemo(() => {
    return pathPoints.map(p => mapTo3D(p, canvasSize.w, canvasSize.h));
  }, [pathPoints, canvasSize]);

  const { linePositions, lineColors, lineWidths } = useMemo(() => {
    const len = points3D.length;
    const positions = new Float32Array(len * 3);
    const colors = new Float32Array(len * 3);
    const widths = new Float32Array(len);
    for (let i = 0; i < len; i++) {
      const t = len > 1 ? i / (len - 1) : 0;
      positions[i * 3] = points3D[i].x;
      positions[i * 3 + 1] = points3D[i].y;
      positions[i * 3 + 2] = points3D[i].z;
      const col = new THREE.Color('#FF6B6B').lerp(new THREE.Color('#4FC3F7'), t);
      colors[i * 3] = col.r;
      colors[i * 3 + 1] = col.g;
      colors[i * 3 + 2] = col.b;
      widths[i] = 0.1 + t * 0.4;
    }
    return { linePositions: positions, lineColors: colors, lineWidths: widths };
  }, [points3D]);

  useEffect(() => {
    if (growthPhase === 'growing') {
      growthStartTime.current = performance.now();
      const numSpheres = particleDensity;
      spheresData.current = [];
      growParticlesData.current = [];

      if (points3D.length >= 2) {
        for (let i = 0; i < numSpheres; i++) {
          const t = i / (numSpheres - 1);
          const pathIdx = Math.floor(t * (points3D.length - 1));
          const pos = points3D[pathIdx].clone();
          const radius = 0.15 + t * 0.45;
          const color = getGradientColor(t);
          spheresData.current.push({ position: pos, radius, color, phase: t });

          for (let j = 0; j < 6; j++) {
            const angle = (j / 6) * Math.PI * 2;
            const r = Math.random() * 0.8;
            const heightOffset = (Math.random() - 0.5) * 0.6;
            const pPos = new THREE.Vector3(
              pos.x + Math.cos(angle) * r,
              pos.y + heightOffset + 0.5,
              pos.z + Math.sin(angle) * r
            );
            const compColor = new THREE.Color(
              1 - color.r,
              1 - color.g,
              1 - color.b
            );
            growParticlesData.current.push({
              position: pPos,
              velocity: new THREE.Vector3(0, 0, 0),
              color: compColor,
              birthTime: performance.now() + i * 100,
              life: 4
            });
          }
        }
      }
    }
  }, [growthPhase, particleDensity, points3D]);

  useFrame((_, delta) => {
    const now = performance.now();
    let growthProgress = 0;

    if (growthPhase === 'growing') {
      const elapsed = (now - growthStartTime.current) / 1000;
      growthProgress = Math.min(1, elapsed / 3);
      growthProgress = cubicBezier(growthProgress);
    } else if (growthPhase === 'complete') {
      growthProgress = 1;
    }

    if (spheresRef.current && (growthPhase === 'growing' || growthPhase === 'complete')) {
      while (spheresRef.current.children.length > 0) {
        const child = spheresRef.current.children[0];
        spheresRef.current.remove(child);
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose();
          if (Array.isArray(child.material)) {
            child.material.forEach(m => m.dispose());
          } else {
            child.material.dispose();
          }
        }
      }

      const visibleCount = Math.ceil(spheresData.current.length * growthProgress);
      for (let i = 0; i < visibleCount; i++) {
        const sphere = spheresData.current[i];
        const sphereProgress = visibleCount > 1
          ? Math.min(1, (growthProgress * spheresData.current.length - i) / 1)
          : growthProgress;
        const animProgress = cubicBezier(Math.max(0, sphereProgress));

        const mesh = new THREE.Mesh(
          new THREE.SphereGeometry(sphere.radius * animProgress, 16, 16),
          new THREE.MeshStandardMaterial({
            color: sphere.color,
            emissive: sphere.color,
            emissiveIntensity: 0.3 * animProgress,
            transparent: true,
            opacity: animProgress,
            metalness: 0.3,
            roughness: 0.4
          })
        );
        mesh.position.copy(sphere.position);
        spheresRef.current.add(mesh);
      }
    }

    if (connectionsRef.current && (growthPhase === 'growing' || growthPhase === 'complete')) {
      const visibleCount = Math.max(2, Math.ceil(spheresData.current.length * growthProgress));
      const connPositions = new Float32Array((visibleCount - 1) * 6);
      const connColors = new Float32Array((visibleCount - 1) * 6);
      for (let i = 0; i < visibleCount - 1; i++) {
        const s1 = spheresData.current[i];
        const s2 = spheresData.current[i + 1];
        connPositions[i * 6] = s1.position.x;
        connPositions[i * 6 + 1] = s1.position.y;
        connPositions[i * 6 + 2] = s1.position.z;
        connPositions[i * 6 + 3] = s2.position.x;
        connPositions[i * 6 + 4] = s2.position.y;
        connPositions[i * 6 + 5] = s2.position.z;
        const c1 = s1.color;
        const c2 = s2.color;
        for (let k = 0; k < 3; k++) {
          connColors[i * 6 + k] = c1.r;
          connColors[i * 6 + 3 + k] = c2.r;
        }
      }
      const geo = connectionsRef.current.geometry as THREE.BufferGeometry;
      geo.setAttribute('position', new THREE.BufferAttribute(connPositions, 3));
      geo.setAttribute('color', new THREE.BufferAttribute(connColors, 3));
      geo.attributes.position.needsUpdate = true;
      geo.attributes.color.needsUpdate = true;
    }

    if (growParticlesRef.current && (growthPhase === 'growing' || growthPhase === 'complete')) {
      const visibleCount = Math.ceil(spheresData.current.length * growthProgress);
      const maxParticles = visibleCount * 6;
      const positions = new Float32Array(maxParticles * 3);
      const colors = new Float32Array(maxParticles * 3);
      let idx = 0;
      for (let i = 0; i < growParticlesData.current.length && idx < maxParticles; i++) {
        const p = growParticlesData.current[i];
        const sphereIdx = Math.floor(i / 6);
        if (sphereIdx >= visibleCount) break;
        const age = (now - p.birthTime) / 1000;
        if (age < 0) continue;
        const floatY = Math.sin(now * 0.002 + i * 0.5) * 0.15;
        positions[idx * 3] = p.position.x;
        positions[idx * 3 + 1] = p.position.y + floatY;
        positions[idx * 3 + 2] = p.position.z;
        const alpha = Math.min(1, age / 0.3);
        colors[idx * 3] = p.color.r * alpha;
        colors[idx * 3 + 1] = p.color.g * alpha;
        colors[idx * 3 + 2] = p.color.b * alpha;
        idx++;
      }
      const geo = growParticlesRef.current.geometry as THREE.BufferGeometry;
      geo.setAttribute('position', new THREE.BufferAttribute(positions.slice(0, idx * 3), 3));
      geo.setAttribute('color', new THREE.BufferAttribute(colors.slice(0, idx * 3), 3));
      geo.attributes.position.needsUpdate = true;
      geo.attributes.color.needsUpdate = true;
    }
  });

  const glowPointsArr = useMemo(() => {
    const arr: [number, number, number][] = [];
    for (let i = 0; i < linePositions.length; i += 3) {
      arr.push([linePositions[i], linePositions[i + 1], linePositions[i + 2]]);
    }
    return arr;
  }, [linePositions]);

  const glowColorsArr = useMemo(() => {
    const arr: [number, number, number][] = [];
    for (let i = 0; i < lineColors.length; i += 3) {
      arr.push([lineColors[i], lineColors[i + 1], lineColors[i + 2]]);
    }
    return arr;
  }, [lineColors]);

  return (
    <group>
      {points3D.length > 1 && (
        <>
          <Line
            ref={glowLineRef as any}
            points={glowPointsArr}
            vertexColors={glowColorsArr}
            transparent
            opacity={0.3}
            lineWidth={2}
          />
          <Line
            ref={lineRef as any}
            points={glowPointsArr}
            vertexColors={glowColorsArr}
            transparent
            opacity={0.9}
            lineWidth={1.5}
          />
        </>
      )}

      <group ref={spheresRef} />
      <lineSegments ref={connectionsRef} >
        <bufferGeometry />
        <lineBasicMaterial
          vertexColors
          color="#FFFFFF"
          transparent
          opacity={0.3}
          linewidth={0.05}
        />
      </lineSegments>

      <points ref={growParticlesRef}>
        <bufferGeometry />
        <pointsMaterial
          vertexColors
          size={0.06}
          transparent
          opacity={0.5}
          sizeAttenuation
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  );
};

export default GrowingPath;
