import { useRef, useMemo, useEffect, useState, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Stars, Sphere, Line } from '@react-three/drei';
import * as THREE from 'three';
import { windSpeedColorScale, categoryToColor } from '@/utils/colorScale';
import { filterStorms } from '@/data/stormDataLoader';
import { useStormStore } from '@/store/useStormStore';
import type { StormRecord } from '@/data/types';

const EARTH_RADIUS = 1;
const PATH_HEIGHT = 0.008;
const GLOW_BALL_HEIGHT = 0.018;
const MAX_STORMS = 200;
const GLOW_BALLS_PER_STORM = 4;

function latLonToVec3(lat: number, lon: number, r: number): [number, number, number] {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  return [
    -r * Math.sin(phi) * Math.cos(theta),
    r * Math.cos(phi),
    r * Math.sin(phi) * Math.sin(theta),
  ];
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

interface MergedPathsProps {
  storms: StormRecord[];
  selectedStormId: string | null;
  onPointClick: (stormId: string, pointIndex: number) => void;
}

function MergedPaths({ storms, selectedStormId, onPointClick }: MergedPathsProps) {
  const visibleStorms = useMemo(() => {
    if (storms.length <= MAX_STORMS) return storms;
    const sorted = [...storms].sort((a, b) => b.category - a.category);
    return sorted.slice(0, MAX_STORMS);
  }, [storms]);

  return (
    <group>
      {visibleStorms.map(storm => (
        <StormPath
          key={storm.id}
          storm={storm}
          highlighted={selectedStormId === storm.id || selectedStormId === null}
          onPointClick={onPointClick}
        />
      ))}
      <MergedGlowBalls storms={visibleStorms} selectedStormId={selectedStormId} />
    </group>
  );
}

function StormPath({
  storm,
  highlighted,
  onPointClick,
}: {
  storm: StormRecord;
  highlighted: boolean;
  onPointClick: (stormId: string, pointIndex: number) => void;
}) {
  const linePoints = useMemo(() => {
    return storm.path.map(p => {
      const [x, y, z] = latLonToVec3(p.lat, p.lon, EARTH_RADIUS + PATH_HEIGHT);
      return new THREE.Vector3(x, y, z);
    });
  }, [storm]);

  const lineColor = highlighted ? categoryToColor(storm.category) : '#334155';
  const lineWidth = highlighted ? 2 : 0.8;
  const lineOpacity = highlighted ? 0.95 : 0.2;

  const handlePointerDown = useCallback(
    (e: any) => {
      e.stopPropagation();
      if (!highlighted) return;
      const point = e.point as THREE.Vector3;
      let closestIdx = 0;
      let closestDist = Infinity;
      storm.path.forEach((p, i) => {
        const [x, y, z] = latLonToVec3(p.lat, p.lon, EARTH_RADIUS + PATH_HEIGHT);
        const dx = x - point.x;
        const dy = y - point.y;
        const dz = z - point.z;
        const dist = dx * dx + dy * dy + dz * dz;
        if (dist < closestDist) {
          closestDist = dist;
          closestIdx = i;
        }
      });
      onPointClick(storm.id, closestIdx);
    },
    [storm, highlighted, onPointClick],
  );

  return (
    <Line
      points={linePoints}
      color={lineColor}
      lineWidth={lineWidth}
      transparent
      opacity={lineOpacity}
      onPointerDown={handlePointerDown}
    />
  );
}

function MergedGlowBalls({
  storms,
  selectedStormId,
}: {
  storms: StormRecord[];
  selectedStormId: string | null;
}) {
  const pointsRef = useRef<THREE.Points>(null);

  const highlightedStorms = useMemo(() => {
    if (selectedStormId !== null) {
      const s = storms.find(st => st.id === selectedStormId);
      return s ? [s] : [];
    }
    return storms;
  }, [storms, selectedStormId]);

  const totalBalls = highlightedStorms.length * GLOW_BALLS_PER_STORM;

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(totalBalls * 3);
    const sizes = new Float32Array(totalBalls);
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    return geo;
  }, [totalBalls]);

  useFrame((state) => {
    if (!pointsRef.current || highlightedStorms.length === 0) return;

    const posArr = pointsRef.current.geometry.attributes.position.array as Float32Array;
    const time = state.clock.elapsedTime;

    for (let si = 0; si < highlightedStorms.length; si++) {
      const storm = highlightedStorms[si];
      const path = storm.path;
      const segs = path.length - 1;

      for (let bi = 0; bi < GLOW_BALLS_PER_STORM; bi++) {
        const ballIdx = si * GLOW_BALLS_PER_STORM + bi;
        if (ballIdx * 3 + 2 >= posArr.length) break;

        let t = ((time * 0.25 + bi * (1 / GLOW_BALLS_PER_STORM) + si * 0.17) % 1);
        const segFloat = t * segs;
        const segIdx = Math.min(Math.floor(segFloat), segs - 1);
        const segT = segFloat - segIdx;

        const p1 = path[segIdx];
        const p2 = path[Math.min(segIdx + 1, path.length - 1)];

        const lat = lerp(p1.lat, p2.lat, segT);
        const lon = lerp(p1.lon, p2.lon, segT);
        const [x, y, z] = latLonToVec3(lat, lon, EARTH_RADIUS + GLOW_BALL_HEIGHT);

        posArr[ballIdx * 3] = x;
        posArr[ballIdx * 3 + 1] = y;
        posArr[ballIdx * 3 + 2] = z;
      }
    }

    pointsRef.current.geometry.attributes.position.needsUpdate = true;
  });

  if (totalBalls === 0) return null;

  return (
    <points ref={pointsRef} geometry={geometry}>
      <pointsMaterial
        size={0.03}
        color="#22d3ee"
        transparent
        opacity={0.85}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

interface EarthProps {
  storms: StormRecord[];
  selectedStormId: string | null;
  onStormPointClick: (stormId: string, pointIndex: number) => void;
}

function Earth({ storms, selectedStormId, onStormPointClick }: EarthProps) {
  const earthRef = useRef<THREE.Group>(null);
  const targetRotation = useRef({ x: 0, y: 0 });
  const currentRotation = useRef({ x: 0, y: 0 });

  useFrame((_, delta) => {
    if (!earthRef.current) return;
    const t = Math.min(delta * 3, 1);
    currentRotation.current.x = lerp(currentRotation.current.x, targetRotation.current.x, t);
    currentRotation.current.y = lerp(currentRotation.current.y, targetRotation.current.y, t);
    earthRef.current.rotation.x = currentRotation.current.x;
    earthRef.current.rotation.y = currentRotation.current.y;
  });

  const rotateToPoint = useCallback((lat: number, lon: number) => {
    targetRotation.current.y = -lon * (Math.PI / 180);
    targetRotation.current.x = -lat * (Math.PI / 180) * 0.3;
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
      <MergedPaths
        storms={storms}
        selectedStormId={selectedStormId}
        onPointClick={onStormPointClick}
      />
    </group>
  );
}

interface StormGlobeProps {
  className?: string;
}

export default function StormGlobe({ className }: StormGlobeProps) {
  const yearRange = useStormStore(s => s.yearRange);
  const category = useStormStore(s => s.category);
  const basin = useStormStore(s => s.basin);
  const selectedStormId = useStormStore(s => s.selectedStormId);
  const selectStorm = useStormStore(s => s.selectStorm);

  const [storms, setStorms] = useState<StormRecord[]>([]);

  useEffect(() => {
    const filtered = filterStorms({ yearRange, category, basin });
    setStorms(filtered);
  }, [yearRange, category, basin]);

  const handleStormPointClick = useCallback(
    (stormId: string, _pointIndex: number) => {
      selectStorm(stormId);
    },
    [selectStorm],
  );

  return (
    <div className={className} style={{ width: '100%', height: '100%' }}>
      <Canvas camera={{ position: [0, 0, 2.5], fov: 45 }}>
        <ambientLight intensity={0.4} />
        <directionalLight position={[5, 3, 5]} intensity={0.8} color="#fff7ed" />
        <directionalLight position={[-3, -1, -4]} intensity={0.2} color="#60a5fa" />
        <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={0.5} />
        <Earth
          storms={storms}
          selectedStormId={selectedStormId}
          onStormPointClick={handleStormPointClick}
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
