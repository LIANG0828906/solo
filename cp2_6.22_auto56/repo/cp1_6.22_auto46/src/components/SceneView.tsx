import React, { useRef, useEffect, useMemo, useState, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { buildTerrainGeometry, type TerrainData } from '@/modules/Terrain';
import {
  createParticleSystem,
  updateParticleSystem,
  setTerrainData,
  type ParticleSystemState,
} from '@/modules/ParticleSystem';

interface SceneViewProps {
  windSpeed: number;
  windAngle: number;
}

interface ArrowInfo {
  x: number;
  y: number;
  opacity: number;
  angle: number;
}

function CameraTracker({ onArrowUpdate }: { onArrowUpdate: (arrow: ArrowInfo | null) => void }) {
  const { camera } = useThree();

  useFrame(() => {
    const camDir = new THREE.Vector3();
    camera.getWorldDirection(camDir);

    const forward = camDir.clone();
    forward.y = 0;
    forward.normalize();
    const zFlat = new THREE.Vector3(0, 0, 1);

    const dot = forward.dot(zFlat);
    const angleToZ = Math.acos(Math.min(1, Math.max(-1, dot)));
    const cross = forward.x * zFlat.z - forward.z * zFlat.x;
    const signedAngle = cross > 0 ? -angleToZ : angleToZ;

    const visibility = Math.min(1, angleToZ / (Math.PI * 0.4));

    if (visibility < 0.05) {
      onArrowUpdate(null);
      return;
    }

    const container = document.querySelector('.scene-container');
    const w = container ? container.clientWidth : window.innerWidth * 0.8;
    const h = container ? container.clientHeight : window.innerHeight;
    const cx = w / 2;
    const cy = h / 2;

    const screenAngle = -signedAngle;
    const edgeDist = Math.min(w, h) * 0.42;

    const ax = cx + Math.sin(screenAngle) * edgeDist;
    const ay = cy - Math.cos(screenAngle) * edgeDist;

    const clampedX = Math.max(30, Math.min(w - 30, ax));
    const clampedY = Math.max(30, Math.min(h - 30, ay));

    onArrowUpdate({
      x: clampedX,
      y: clampedY,
      opacity: visibility * 0.85,
      angle: (screenAngle * 180) / Math.PI,
    });
  });

  return null;
}

function DirectionOverlay({ arrow }: { arrow: ArrowInfo | null }) {
  if (!arrow) return null;

  return (
    <div
      className="direction-indicator"
      style={{
        position: 'absolute',
        left: arrow.x - 20,
        top: arrow.y - 20,
        opacity: arrow.opacity,
        transform: `rotate(${arrow.angle}deg)`,
        pointerEvents: 'none',
        zIndex: 10,
        transition: 'opacity 0.4s ease',
      }}
    >
      <svg
        className="direction-arrow"
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ width: 40, height: 40, filter: 'drop-shadow(0 0 6px rgba(0,229,255,0.5))' }}
      >
        <path
          d="M20 4 L30 28 L20 22 L10 28 Z"
          fill="rgba(0,229,255,0.8)"
          stroke="rgba(0,229,255,0.4)"
          strokeWidth="1"
        />
        <text
          x="20"
          y="38"
          textAnchor="middle"
          fill="rgba(0,229,255,0.6)"
          fontSize="7"
          fontFamily="system-ui"
        >
          Z+
        </text>
      </svg>
    </div>
  );
}

function Terrain({ data }: { data: TerrainData }) {
  const geometry = useMemo(() => buildTerrainGeometry(data), [data]);

  return (
    <mesh geometry={geometry} receiveShadow>
      <meshStandardMaterial
        vertexColors
        roughness={0.85}
        metalness={0.05}
        flatShading={false}
      />
    </mesh>
  );
}

function Particles({
  windSpeed,
  windAngle,
  terrainData,
}: {
  windSpeed: number;
  windAngle: number;
  terrainData: TerrainData;
}) {
  const pointsRef = useRef<THREE.Points>(null);
  const systemRef = useRef<ParticleSystemState>(createParticleSystem());
  const prevTerrain = useRef<TerrainData | null>(null);

  useEffect(() => {
    if (terrainData && terrainData !== prevTerrain.current) {
      prevTerrain.current = terrainData;
      setTerrainData(systemRef.current, terrainData);
    }
  }, [terrainData]);

  useFrame((_state, delta) => {
    const sys = systemRef.current;
    updateParticleSystem(sys, windSpeed, windAngle, delta);

    if (pointsRef.current) {
      const posAttr = pointsRef.current.geometry.attributes.position;
      const colAttr = pointsRef.current.geometry.attributes.color;

      const posArray = posAttr.array as Float32Array;
      const colArray = colAttr.array as Float32Array;

      posArray.set(sys.positions);
      colArray.set(sys.colors);

      posAttr.needsUpdate = true;
      colAttr.needsUpdate = true;
    }
  });

  const [posBuf, colBuf] = useMemo(() => {
    const p = new Float32Array(3500 * 3);
    const c = new Float32Array(3500 * 3);
    for (let i = 0; i < 3500; i++) {
      p[i * 3] = (Math.random() - 0.5) * 100;
      p[i * 3 + 1] = Math.random() * 10 + 2;
      p[i * 3 + 2] = (Math.random() - 0.5) * 100;
      c[i * 3] = 0;
      c[i * 3 + 1] = 0.5;
      c[i * 3 + 2] = 1;
    }
    return [p, c];
  }, []);

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={3500}
          array={posBuf}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={3500}
          array={colBuf}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        vertexColors
        size={0.6}
        sizeAttenuation
        transparent
        opacity={0.85}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

function SceneLighting() {
  return (
    <>
      <ambientLight intensity={0.35} color="#8090b0" />
      <directionalLight
        position={[40, 60, 30]}
        intensity={1.2}
        color="#ffe0c0"
        castShadow
      />
      <directionalLight
        position={[-30, 40, -20]}
        intensity={0.4}
        color="#6080c0"
      />
      <hemisphereLight
        args={['#4060a0', '#203040', 0.5]}
      />
    </>
  );
}

function WindArrowHelper({ windSpeed, windAngle }: { windSpeed: number; windAngle: number }) {
  const arrowRef = useRef<THREE.ArrowHelper>(null);
  const rad = (windAngle * Math.PI) / 180;
  const dir = useMemo(() => new THREE.Vector3(Math.sin(rad), 0, Math.cos(rad)).normalize(), [windAngle]);

  useEffect(() => {
    if (arrowRef.current) {
      arrowRef.current.setDirection(dir);
      arrowRef.current.setLength(Math.max(0.5, windSpeed * 0.5), 2, 1);
    }
  }, [dir, windSpeed]);

  return (
    <arrowHelper
      ref={arrowRef}
      args={[dir, new THREE.Vector3(0, 15, 0), Math.max(0.5, windSpeed * 0.5), 0x00e5ff, 2, 1]}
    />
  );
}

function SceneContent({ windSpeed, windAngle, terrainData, onArrowUpdate }: SceneViewProps & { terrainData: TerrainData | null; onArrowUpdate: (arrow: ArrowInfo | null) => void }) {
  if (!terrainData) return null;

  return (
    <>
      <SceneLighting />
      <Terrain data={terrainData} />
      <Particles windSpeed={windSpeed} windAngle={windAngle} terrainData={terrainData} />
      <WindArrowHelper windSpeed={windSpeed} windAngle={windAngle} />
      <OrbitControls
        enableDamping
        dampingFactor={0.08}
        maxPolarAngle={Math.PI * 0.48}
        minDistance={15}
        maxDistance={150}
        target={[0, 3, 0]}
      />
      <gridHelper args={[100, 20, '#1a2550', '#0f1835']} position={[0, 0.05, 0]} />
      <CameraTracker onArrowUpdate={onArrowUpdate} />
    </>
  );
}

function FogAndBackground() {
  const { scene } = useThree();
  useEffect(() => {
    scene.fog = new THREE.FogExp2('#070b15', 0.008);
    scene.background = new THREE.Color('#070b15');
  }, [scene]);
  return null;
}

export default function SceneView({ windSpeed, windAngle }: SceneViewProps) {
  const [terrainData, setTerrainData] = useState<TerrainData | null>(null);
  const [loading, setLoading] = useState(true);
  const [arrow, setArrow] = useState<ArrowInfo | null>(null);

  const handleArrowUpdate = useCallback((a: ArrowInfo | null) => {
    setArrow(a);
  }, []);

  useEffect(() => {
    const fallbackData: TerrainData = {
      width: 100,
      depth: 100,
      resolution: 50,
      heights: generateFallbackHeights(50, 100, 100),
    };

    fetch('/api/terrain')
      .then((res) => res.json())
      .then((data) => {
        setTerrainData(data);
        setLoading(false);
      })
      .catch(() => {
        setTerrainData(fallbackData);
        setLoading(false);
      });
  }, []);

  return (
    <div className="scene-container">
      {loading && (
        <div className="loading-overlay">
          <div className="loading-spinner" />
        </div>
      )}
      <Canvas
        camera={{ position: [50, 35, 50], fov: 55, near: 0.5, far: 500 }}
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: 'high-performance',
        }}
        dpr={[1, 1.5]}
        performance={{ min: 0.5 }}
      >
        <FogAndBackground />
        <SceneContent
          windSpeed={windSpeed}
          windAngle={windAngle}
          terrainData={terrainData}
          onArrowUpdate={handleArrowUpdate}
        />
      </Canvas>
      <DirectionOverlay arrow={arrow} />
    </div>
  );
}

function generateFallbackHeights(resolution: number, width: number, depth: number): number[][] {
  const heights: number[][] = [];
  for (let i = 0; i <= resolution; i++) {
    const row: number[] = [];
    for (let j = 0; j <= resolution; j++) {
      const x = (j / resolution) * width - width / 2;
      const z = (i / resolution) * depth - depth / 2;
      const h =
        4.0 * Math.sin(x * 0.08) * Math.cos(z * 0.12) +
        2.5 * Math.sin(x * 0.05 + z * 0.07) +
        1.8 * Math.cos(x * 0.14 - z * 0.09) +
        3.0 * Math.sin(x * 0.03) * Math.sin(z * 0.04) +
        1.2 * Math.cos(x * 0.2 + z * 0.15);
      row.push(Math.max(0, h));
    }
    heights.push(row);
  }
  return heights;
}
