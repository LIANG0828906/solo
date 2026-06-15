import { useRef, useMemo, useEffect, useState, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Stars, Sphere, Line } from '@react-three/drei';
import * as THREE from 'three';
import { windSpeedColorScale, categoryToColor } from '@/utils/colorScale';
import { useStormStore } from '@/store/useStormStore';
import type { StormRecord, StormPathPoint } from '@/data/types';

const EARTH_RADIUS = 1;
const PATH_HEIGHT = 0.008;
const GLOW_BALL_HEIGHT = 0.015;
const MAX_STORMS = 200;

function latLonToVector3(lat: number, lon: number, radius: number): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

interface StormPathLineProps {
  storm: StormRecord;
  opacity: number;
  highlighted: boolean;
  onPointClick: (stormId: string, pointIndex: number) => void;
  progress: number;
}

function StormPathLine({ storm, opacity, highlighted, onPointClick, progress }: StormPathLineProps) {
  const lineRef = useRef<THREE.Line>(null);
  const glowBallsRef = useRef<THREE.Points>(null);
  const numGlowBalls = 3;

  const { positions, colors } = useMemo(() => {
    const points = storm.path;
    const pos: number[] = [];
    const col: number[] = [];

    for (let i = 0; i < points.length; i++) {
      const p = points[i];
      const vec = latLonToVector3(p.lat, p.lon, EARTH_RADIUS + PATH_HEIGHT);
      pos.push(vec.x, vec.y, vec.z);
      const color = new THREE.Color(windSpeedColorScale(p.windSpeed));
      col.push(color.r, color.g, color.b);
    }

    return { positions: new Float32Array(pos), colors: new Float32Array(col) };
  }, [storm]);

  useFrame((state, delta) => {
    if (!glowBallsRef.current) return;

    const positions = glowBallsRef.current.geometry.attributes.position.array as Float32Array;
    const pathPoints = storm.path;
    const totalSegments = pathPoints.length - 1;

    for (let i = 0; i < numGlowBalls; i++) {
      let t = ((state.clock.elapsedTime * 0.3 + i * (1 / numGlowBalls)) % 1);
      t = t * progress;
      const segIndex = Math.min(Math.floor(t * totalSegments), totalSegments - 1);
      const segT = (t * totalSegments) - segIndex;

      const p1 = pathPoints[segIndex];
      const p2 = pathPoints[Math.min(segIndex + 1, pathPoints.length - 1)];

      const lat = lerp(p1.lat, p2.lat, segT);
      const lon = lerp(p1.lon, p2.lon, segT);
      const vec = latLonToVector3(lat, lon, EARTH_RADIUS + GLOW_BALL_HEIGHT);

      positions[i * 3] = vec.x;
      positions[i * 3 + 1] = vec.y;
      positions[i * 3 + 2] = vec.z;
    }

    glowBallsRef.current.geometry.attributes.position.needsUpdate = true;
  });

  const glowGeometry = useMemo(() => {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(numGlowBalls * 3);
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return geometry;
  }, []);

  const lineColor = highlighted ? categoryToColor(storm.category) : '#64748b';
  const lineOpacity = highlighted ? opacity : opacity * 0.3;

  const handlePointerDown = (e: any) => {
    e.stopPropagation();
    const point = e.point;
    let closestIndex = 0;
    let closestDist = Infinity;
    const points = storm.path;

    for (let i = 0; i < points.length; i++) {
      const p = points[i];
      const vec = latLonToVector3(p.lat, p.lon, EARTH_RADIUS + PATH_HEIGHT);
      const dist = vec.distanceTo(point);
      if (dist < closestDist) {
        closestDist = dist;
        closestIndex = i;
      }
    }
    onPointClick(storm.id, closestIndex);
  };

  return (
    <group>
      <Line
        ref={lineRef}
        points={storm.path.map(p => {
          const v = latLonToVector3(p.lat, p.lon, EARTH_RADIUS + PATH_HEIGHT);
          return [v.x, v.y, v.z];
        })}
        color={lineColor}
        lineWidth={highlighted ? 2 : 1}
        transparent
        opacity={lineOpacity}
        onPointerDown={handlePointerDown}
      />
      <points ref={glowBallsRef} geometry={glowGeometry} visible={highlighted}>
        <pointsMaterial
          size={0.025}
          color="#22d3ee"
          transparent
          opacity={0.9}
          sizeAttenuation
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>
    </group>
  );
}

interface EarthProps {
  storms: StormRecord[];
  selectedStormId: string | null;
  onStormPointClick: (stormId: string, pointIndex: number) => void;
  pathProgress: number;
}

function Earth({ storms, selectedStormId, onStormPointClick, pathProgress }: EarthProps) {
  const earthRef = useRef<THREE.Group>(null);
  const { camera } = useThree();
  const targetRotation = useRef(new THREE.Euler(0, 0, 0));
  const currentRotation = useRef(new THREE.Euler(0, 0, 0));

  const visibleStorms = useMemo(() => {
    if (storms.length <= MAX_STORMS) return storms;
    const sorted = [...storms].sort((a, b) => b.category - a.category);
    return sorted.slice(0, MAX_STORMS);
  }, [storms]);

  useFrame((_, delta) => {
    if (!earthRef.current) return;
    const t = Math.min(delta * 3, 1);
    currentRotation.current.x = lerp(currentRotation.current.x, targetRotation.current.x, t);
    currentRotation.current.y = lerp(currentRotation.current.y, targetRotation.current.y, t);
    earthRef.current.rotation.x = currentRotation.current.x;
    earthRef.current.rotation.y = currentRotation.current.y;
  });

  const rotateToPoint = useCallback((lat: number, lon: number) => {
    const targetLon = -lon * (Math.PI / 180);
    const targetLat = lat * (Math.PI / 180);
    targetRotation.current.y = targetLon;
    targetRotation.current.x = -targetLat * 0.3;
  }, []);

  useEffect(() => {
    if (selectedStormId) {
      const storm = storms.find(s => s.id === selectedStormId);
      if (storm && storm.path.length > 0) {
        const midIdx = Math.floor(storm.path.length / 2);
        const point = storm.path[midIdx];
        rotateToPoint(point.lat, point.lon);
      }
    }
  }, [selectedStormId, storms, rotateToPoint]);

  return (
    <group ref={earthRef}>
      <Sphere args={[EARTH_RADIUS, 64, 64]}>
        <meshPhongMaterial
          color="#0ea5e9"
          emissive="#0c4a6e"
          emissiveIntensity={0.2}
          specular="#0369a1"
          shininess={10}
          transparent
          opacity={0.9}
        />
      </Sphere>
      <Sphere args={[EARTH_RADIUS + 0.002, 64, 64]}>
        <meshBasicMaterial
          color="#06b6d4"
          transparent
          opacity={0.1}
          side={THREE.BackSide}
        />
      </Sphere>
      <Sphere args={[EARTH_RADIUS + 0.05, 64, 64]}>
        <meshBasicMaterial
          color="#38bdf8"
          transparent
          opacity={0.06}
          side={THREE.BackSide}
        />
      </Sphere>
      {visibleStorms.map(storm => (
        <StormPathLine
          key={storm.id}
          storm={storm}
          opacity={1}
          highlighted={selectedStormId === storm.id || selectedStormId === null}
          onPointClick={onStormPointClick}
          progress={pathProgress}
        />
      ))}
    </group>
  );
}

interface StormGlobeProps {
  className?: string;
}

export default function StormGlobe({ className }: StormGlobeProps) {
  const { yearRange, category, basin, selectStorm, playbackYear, isPlaying } = useStormStore();
  const [storms, setStorms] = useState<StormRecord[]>([]);
  const [pathProgress, setPathProgress] = useState(1);
  const prevYearRef = useRef(yearRange[1]);

  useEffect(() => {
    const { filterStorms } = require('@/data/stormDataLoader');
    const filtered = filterStorms({ yearRange, category, basin });
    setStorms(filtered);
  }, [yearRange, category, basin]);

  useEffect(() => {
    if (isPlaying) {
      setPathProgress(1);
      prevYearRef.current = playbackYear;
    }
  }, [isPlaying, playbackYear]);

  const handleStormPointClick = (stormId: string, _pointIndex: number) => {
    selectStorm(stormId);
  };

  return (
    <div className={className} style={{ width: '100%', height: '100%' }}>
      <Canvas camera={{ position: [0, 0, 2.5], fov: 45 }}>
        <ambientLight intensity={0.4} />
        <directionalLight position={[5, 3, 5]} intensity={0.8} color="#fff7ed" />
        <directionalLight position={[-3, -1, -4]} intensity={0.2} color="#60a5fa" />
        <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={0.5} />
        <Earth
          storms={storms}
          selectedStormId={useStormStore.getState().selectedStormId}
          onStormPointClick={handleStormPointClick}
          pathProgress={pathProgress}
        />
        <OrbitControls
          enablePan={false}
          minDistance={1.5}
          maxDistance={5}
          enableDamping
          dampingFactor={0.05}
        />
      </Canvas>
    </div>
  );
}
