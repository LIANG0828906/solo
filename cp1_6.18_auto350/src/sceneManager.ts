import { useRef, useMemo, useEffect, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Billboard, Text } from '@react-three/drei';
import * as THREE from 'three';
import type { StarData, Constellation, Position3D } from './types';
import { useStarStore } from './starStore';
import { calculateStarMaxDisplacement } from './dataLoader';

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));
const easeInOut = (t: number) => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

export function magnitudeToColor(magnitude: number): THREE.Color {
  const t = clamp((magnitude + 1.5) / 6, 0, 1);
  return new THREE.Color().lerpColors(
    new THREE.Color('#FFFFFF'),
    new THREE.Color('#1A237E'),
    t
  );
}

export function magnitudeToSize(magnitude: number): number {
  return 3 - clamp((magnitude + 1.5) / 3, 0, 2);
}

function interpolatePosition(
  eraA: Position3D,
  eraB: Position3D,
  t: number
): Position3D {
  const eased = easeInOut(t);
  return {
    x: eraA.x + (eraB.x - eraA.x) * eased,
    y: eraA.y + (eraB.y - eraA.y) * eased,
    z: eraA.z + (eraB.z - eraA.z) * eased,
  };
}

function getInterpolatedPosition(
  star: StarData,
  currentEra: number,
  targetEra: number,
  progress: number
): Position3D {
  if (progress >= 1 || currentEra === targetEra) {
    return star.eraPositions[targetEra];
  }
  return interpolatePosition(
    star.eraPositions[currentEra],
    star.eraPositions[targetEra],
    progress
  );
}

function createGlowTexture(): THREE.Texture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;
  const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  gradient.addColorStop(0, 'rgba(255,255,255,1)');
  gradient.addColorStop(0.2, 'rgba(255,255,255,0.8)');
  gradient.addColorStop(0.4, 'rgba(255,255,255,0.3)');
  gradient.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 128, 128);
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

export function TimelineAnimator() {
  const lastAdvanceRef = useRef<number>(0);
  const transitionDuration = 1.0;
  const advanceInterval = 1.5;

  useFrame((_, delta) => {
    const state = useStarStore.getState();
    const {
      isPlaying,
      currentEraIndex,
      targetEraIndex,
      transitionProgress,
      setTransitionProgress,
      advanceEra,
    } = state;

    if (transitionProgress < 1) {
      const newProgress = Math.min(1, transitionProgress + delta / transitionDuration);
      setTransitionProgress(newProgress);
    } else if (isPlaying) {
      lastAdvanceRef.current += delta;
      if (lastAdvanceRef.current >= advanceInterval) {
        lastAdvanceRef.current = 0;
        advanceEra();
      }
    } else {
      lastAdvanceRef.current = 0;
    }
  });

  return null;
}

export function StarField() {
  const pointsRef = useRef<THREE.Points>(null);
  const glowTextureRef = useRef<THREE.Texture | null>(null);
  const stars = useStarStore((s) => s.stars);
  const currentEraIndex = useStarStore((s) => s.currentEraIndex);
  const targetEraIndex = useStarStore((s) => s.targetEraIndex);
  const transitionProgress = useStarStore((s) => s.transitionProgress);
  const selectedStarId = useStarStore((s) => s.selectedStarId);
  const { camera } = useThree();

  const { geometry, starIds, selectedIndex } = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(stars.length * 3);
    const colors = new Float32Array(stars.length * 3);
    const sizes = new Float32Array(stars.length);
    const ids: string[] = [];
    let selIdx = -1;

    stars.forEach((star, i) => {
      ids.push(star.id);
      if (star.id === selectedStarId) selIdx = i;

      const pos = getInterpolatedPosition(star, currentEraIndex, targetEraIndex, transitionProgress);
      positions[i * 3] = pos.x;
      positions[i * 3 + 1] = pos.y;
      positions[i * 3 + 2] = pos.z;

      const color = magnitudeToColor(star.magnitude);
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;

      const baseSize = magnitudeToSize(star.magnitude);
      sizes[i] = star.id === selectedStarId ? baseSize * 2 : baseSize;
    });

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    geo.computeBoundingSphere();

    return { geometry: geo, starIds: ids, selectedIndex: selIdx };
  }, [stars, currentEraIndex, targetEraIndex, transitionProgress, selectedStarId]);

  useFrame(({ gl, scene }) => {
    if (!pointsRef.current) return;
    const material = pointsRef.current.material as THREE.PointsMaterial;

    const positions = geometry.attributes.position.array as Float32Array;
    const sizes = geometry.attributes.size.array as Float32Array;

    for (let i = 0; i < stars.length; i++) {
      const star = stars[i];
      const pos = getInterpolatedPosition(star, currentEraIndex, targetEraIndex, transitionProgress);
      positions[i * 3] = pos.x;
      positions[i * 3 + 1] = pos.y;
      positions[i * 3 + 2] = pos.z;

      const baseSize = magnitudeToSize(star.magnitude);
      const targetSize = star.id === selectedStarId ? baseSize * 2 : baseSize;
      sizes[i] += (targetSize - sizes[i]) * 0.15;
    }

    geometry.attributes.position.needsUpdate = true;
    geometry.attributes.size.needsUpdate = true;
  });

  useEffect(() => {
    if (!glowTextureRef.current) {
      glowTextureRef.current = createGlowTexture();
    }
    return () => {
      geometry.dispose();
    };
  }, [geometry]);

  return (
    <group>
      <points ref={pointsRef} geometry={geometry}>
        <pointsMaterial
          map={glowTextureRef.current || undefined}
          vertexColors
          size={0.12}
          sizeAttenuation
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
      {selectedStarId && (() => {
        const star = stars.find(s => s.id === selectedStarId);
        if (!star) return null;
        const pos = getInterpolatedPosition(star, currentEraIndex, targetEraIndex, transitionProgress);
        return (
          <mesh position={[pos.x, pos.y, pos.z]}>
            <sphereGeometry args={[0.25, 32, 32]} />
            <meshBasicMaterial
              color="#FFD700"
              transparent
              opacity={0.15}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
            />
          </mesh>
        );
      })()}
    </group>
  );
}

export function ConstellationLines() {
  const lineRef = useRef<THREE.LineSegments>(null);
  const stars = useStarStore((s) => s.stars);
  const constellations = useStarStore((s) => s.constellations);
  const currentEraIndex = useStarStore((s) => s.currentEraIndex);
  const targetEraIndex = useStarStore((s) => s.targetEraIndex);
  const transitionProgress = useStarStore((s) => s.transitionProgress);

  const { geometry, totalConnections } = useMemo(() => {
    const starMap = new Map(stars.map(s => [s.id, s]));
    let connCount = 0;
    constellations.forEach(c => connCount += c.connections.length);

    const positions = new Float32Array(connCount * 6);
    let idx = 0;

    for (const constellation of constellations) {
      for (const conn of constellation.connections) {
        const starA = starMap.get(conn.starIdA);
        const starB = starMap.get(conn.starIdB);
        if (!starA || !starB) continue;

        const posA = getInterpolatedPosition(starA, currentEraIndex, targetEraIndex, transitionProgress);
        const posB = getInterpolatedPosition(starB, currentEraIndex, targetEraIndex, transitionProgress);

        positions[idx * 6] = posA.x;
        positions[idx * 6 + 1] = posA.y;
        positions[idx * 6 + 2] = posA.z;
        positions[idx * 6 + 3] = posB.x;
        positions[idx * 6 + 4] = posB.y;
        positions[idx * 6 + 5] = posB.z;
        idx++;
      }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.computeBoundingSphere();

    return { geometry: geo, totalConnections: connCount };
  }, [stars, constellations, currentEraIndex, targetEraIndex, transitionProgress]);

  useFrame(() => {
    if (!lineRef.current) return;

    const starMap = new Map(stars.map(s => [s.id, s]));
    const positions = geometry.attributes.position.array as Float32Array;
    let idx = 0;

    for (const constellation of constellations) {
      for (const conn of constellation.connections) {
        const starA = starMap.get(conn.starIdA);
        const starB = starMap.get(conn.starIdB);
        if (!starA || !starB) continue;

        const posA = getInterpolatedPosition(starA, currentEraIndex, targetEraIndex, transitionProgress);
        const posB = getInterpolatedPosition(starB, currentEraIndex, targetEraIndex, transitionProgress);

        positions[idx * 6] = posA.x;
        positions[idx * 6 + 1] = posA.y;
        positions[idx * 6 + 2] = posA.z;
        positions[idx * 6 + 3] = posB.x;
        positions[idx * 6 + 4] = posB.y;
        positions[idx * 6 + 5] = posB.z;
        idx++;
      }
    }

    geometry.attributes.position.needsUpdate = true;
  });

  useEffect(() => {
    return () => geometry.dispose();
  }, [geometry]);

  return (
    <lineSegments ref={lineRef} geometry={geometry}>
      <lineBasicMaterial
        color="#FFD700"
        transparent
        opacity={0.4}
        depthWrite={false}
      />
    </lineSegments>
  );
}

export function ConstellationLabels() {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth < 768 : false
  );
  const constellations = useStarStore((s) => s.constellations);
  const stars = useStarStore((s) => s.stars);
  const currentEraIndex = useStarStore((s) => s.currentEraIndex);
  const targetEraIndex = useStarStore((s) => s.targetEraIndex);
  const transitionProgress = useStarStore((s) => s.transitionProgress);

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  if (isMobile) return null;

  const starMap = new Map(stars.map(s => [s.id, s]));

  return (
    <group>
      {constellations.map((constellation) => {
        let avgX = 0, avgY = 0, avgZ = 0;
        let count = 0;

        for (const starId of constellation.starIds) {
          const star = starMap.get(starId);
          if (!star) continue;
          const pos = getInterpolatedPosition(star, currentEraIndex, targetEraIndex, transitionProgress);
          avgX += pos.x;
          avgY += pos.y;
          avgZ += pos.z;
          count++;
        }

        if (count === 0) return null;

        const labelPos = constellation.labelPosition;
        const pos = {
          x: avgX / count + labelPos.x * 0.3,
          y: avgY / count + labelPos.y * 0.3 + 0.6,
          z: avgZ / count + labelPos.z * 0.3,
        };

        return (
          <Billboard key={constellation.id} position={[pos.x, pos.y, pos.z]}>
            <group>
              <mesh position={[0, 0, -0.01]}>
                <planeGeometry args={[constellation.name.length * 0.17 + 0.3, 0.55]} />
                <meshBasicMaterial
                  color="#000000"
                  transparent
                  opacity={0.5}
                  depthWrite={false}
                />
              </mesh>
              <Text
                text={constellation.name}
                fontSize={0.3}
                color="#FFFFFF"
                anchorX="center"
                anchorY="middle"
                outlineWidth={0.01}
                outlineColor="#000000"
              >
              </Text>
            </group>
          </Billboard>
        );
      })}
    </group>
  );
}

export function StarTrajectories() {
  const stars = useStarStore((s) => s.stars);
  const currentEraIndex = useStarStore((s) => s.currentEraIndex);
  const targetEraIndex = useStarStore((s) => s.targetEraIndex);
  const transitionProgress = useStarStore((s) => s.transitionProgress);

  const starData = useMemo(() => {
    return stars.map(star => {
      const maxDisp = calculateStarMaxDisplacement(star);
      const radius = maxDisp * 1.2 + 0.05;
      return { star, radius };
    });
  }, [stars]);

  return (
    <group>
      {starData.map(({ star, radius }) => {
        const pos = getInterpolatedPosition(star, currentEraIndex, targetEraIndex, transitionProgress);
        const era0 = star.eraPositions[0];
        const era2 = star.eraPositions[2];
        const normalX = era2.x - era0.x;
        const normalY = era2.y - era0.y;
        const normalZ = era2.z - era0.z;
        const len = Math.sqrt(normalX * normalX + normalY * normalY + normalZ * normalZ) || 1;

        return (
          <mesh
            key={star.id}
            position={[pos.x, pos.y, pos.z]}
            rotation={[
              Math.atan2(-normalY / len, Math.sqrt((normalX * normalX + normalZ * normalZ) / (len * len))),
              Math.atan2(normalX / len, normalZ / len),
              0
            ]}
          >
            <ringGeometry args={[radius * 0.98, radius, 48]} />
            <meshBasicMaterial
              color="#87CEEB"
              transparent
              opacity={0.2}
              wireframe
              side={THREE.DoubleSide}
              depthWrite={false}
            />
          </mesh>
        );
      })}
    </group>
  );
}

export function SceneBackground() {
  return (
    <color attach="background" args={['#000011']} />
  );
}
