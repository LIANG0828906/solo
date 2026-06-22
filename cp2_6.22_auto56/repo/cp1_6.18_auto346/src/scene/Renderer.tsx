import React, { useRef, useMemo, useEffect, useState, useCallback } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { useCityStore } from '../store';
import { flowParticles } from './FlowParticles';
import { cityBuilder } from './CityBuilder';
import { ParticleState, BuildingAttributes } from '../types';
import { handleGroundClick, handleBuildingClick, onPointerDown, onPointerUp } from '../controls/InteractionHandler';

const PARTICLE_COUNT = 200;

function GradientBackground() {
  const { scene } = useThree();

  useEffect(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 2;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;
    const gradient = ctx.createLinearGradient(0, 0, 0, 512);
    gradient.addColorStop(0, '#87CEEB');
    gradient.addColorStop(1, '#E0F7FA');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 2, 512);
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    scene.background = texture;

    return () => {
      scene.background = null;
      texture.dispose();
      canvas.remove();
    };
  }, [scene]);

  return null;
}

function Ground() {
  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, 0, 0]}
      receiveShadow
      onClick={(e) => {
        if (!onPointerUp(e.nativeEvent as unknown as PointerEvent)) return;
        const greenCount = useCityStore.getState().greenCount;
        handleGroundClick(e.point, greenCount);
      }}
    >
      <planeGeometry args={[200, 200]} />
      <meshStandardMaterial color="#E0E0E0" roughness={0.9} />
    </mesh>
  );
}

function GridLines() {
  const geometry = useMemo(() => {
    const lines = cityBuilder.getGridLines();
    const positions: number[] = [];
    for (const line of lines) {
      positions.push(...line.start, ...line.end);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    return geo;
  }, []);

  return (
    <lineSegments geometry={geometry}>
      <lineBasicMaterial color="#E0E0E0" linewidth={1} />
    </lineSegments>
  );
}

interface BuildingMeshProps {
  building: BuildingAttributes;
  isHovered: boolean;
  onHover: (id: string | null) => void;
  scaleAnim: number;
}

function BuildingMesh({ building, isHovered, onHover, scaleAnim }: BuildingMeshProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const color = building.type === 'gray' ? '#808080' : '#4CAF50';
  const roughness = building.type === 'gray' ? 0.7 : 0.9;

  useFrame(() => {
    if (meshRef.current) {
      const target = scaleAnim;
      meshRef.current.scale.y = THREE.MathUtils.lerp(meshRef.current.scale.y, target, 0.15);
    }
  });

  return (
    <mesh
      ref={meshRef}
      position={[building.worldX, building.height / 2, building.worldZ]}
      castShadow
      receiveShadow
      scale={[1, scaleAnim, 1]}
      onClick={(e) => {
        e.stopPropagation();
        if (!onPointerUp(e.nativeEvent as unknown as PointerEvent)) return;
        handleBuildingClick(building.id);
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        onHover(building.id);
      }}
      onPointerOut={() => {
        onHover(null);
      }}
    >
      <boxGeometry args={[16, building.height, 16]} />
      <meshStandardMaterial
        color={color}
        roughness={roughness}
        transparent
        opacity={isHovered ? 0.9 : 1.0}
        emissive={isHovered ? '#ffffff' : '#000000'}
        emissiveIntensity={isHovered ? 0.15 : 0}
      />
    </mesh>
  );
}

function Buildings() {
  const buildings = useCityStore((s) => s.buildings);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [scaleAnims, setScaleAnims] = useState<Record<string, number>>({});

  useEffect(() => {
    const newAnims: Record<string, number> = {};
    for (const b of buildings) {
      if (scaleAnims[b.id] === undefined) {
        newAnims[b.id] = b.type === 'green' ? 0.01 : 1;
      } else {
        newAnims[b.id] = 1;
      }
    }
    setScaleAnims((prev) => ({ ...newAnims }));
  }, [buildings]);

  return (
    <group>
      {buildings.map((b) => (
        <BuildingMesh
          key={b.id}
          building={b}
          isHovered={hoveredId === b.id}
          onHover={setHoveredId}
          scaleAnim={scaleAnims[b.id] ?? 1}
        />
      ))}
    </group>
  );
}

function Particles() {
  const pointsRef = useRef<THREE.Points>(null);
  const particlesRef = useRef<ParticleState[]>([]);
  const wind = useCityStore((s) => s.wind);
  const buildings = useCityStore((s) => s.buildings);
  const clockRef = useRef(0);
  const avgSpeedTimerRef = useRef(0);

  const { positions, colors } = useMemo(() => {
    const pos = new Float32Array(PARTICLE_COUNT * 3);
    const col = new Float32Array(PARTICLE_COUNT * 3);
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const hue = (i / PARTICLE_COUNT) * 360;
      const color = new THREE.Color().setHSL(hue / 360, 1, 0.5);
      col[i * 3] = color.r;
      col[i * 3 + 1] = color.g;
      col[i * 3 + 2] = color.b;
    }
    return { positions: pos, colors: col };
  }, []);

  useEffect(() => {
    particlesRef.current = flowParticles.initParticles(PARTICLE_COUNT, wind);
  }, []);

  useFrame((_, delta) => {
    if (!pointsRef.current) return;

    const clampedDelta = Math.min(delta, 0.05);
    clockRef.current += clampedDelta;

    particlesRef.current = flowParticles.updateParticlePositions(
      particlesRef.current,
      wind,
      buildings,
      clampedDelta
    );

    const posAttr = pointsRef.current.geometry.getAttribute('position') as THREE.BufferAttribute;
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const p = particlesRef.current[i];
      if (p) {
        posAttr.setXYZ(i, p.position[0], p.position[1], p.position[2]);
      }
    }
    posAttr.needsUpdate = true;

    avgSpeedTimerRef.current += clampedDelta;
    if (avgSpeedTimerRef.current >= 1.0) {
      avgSpeedTimerRef.current = 0;
      const avg = flowParticles.calculateAverageSpeed(particlesRef.current);
      useCityStore.getState().setAverageSpeed(avg);
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={PARTICLE_COUNT}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={PARTICLE_COUNT}
          array={colors}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.6}
        vertexColors
        transparent
        opacity={0.8}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

function Lighting() {
  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight
        position={[50, 80, 30]}
        intensity={1.2}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-bias={-0.001}
        shadow-camera-far={200}
        shadow-camera-left={-120}
        shadow-camera-right={120}
        shadow-camera-top={120}
        shadow-camera-bottom={-120}
      />
    </>
  );
}

export function CityScene() {
  return (
    <>
      <GradientBackground />
      <Lighting />
      <Ground />
      <GridLines />
      <Buildings />
      <Particles />
      <OrbitControls
        enableDamping
        dampingFactor={0.1}
        minDistance={30}
        maxDistance={300}
        maxPolarAngle={Math.PI / 2.1}
      />
    </>
  );
}
