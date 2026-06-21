import React, { useRef, useMemo, useEffect, useState, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { LandformType, GRID_SIZE, TERRAIN_SIZE, COLOR_MAPS, ErosionParams } from '../types';

interface TerrainMeshProps {
  heightMap: number[][];
  landform: LandformType;
  iteration: number;
}

const hexToRgb = (hex: string) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16) / 255,
        g: parseInt(result[2], 16) / 255,
        b: parseInt(result[3], 16) / 255,
      }
    : { r: 0, g: 0, b: 0 };
};

const lerpColor = (
  c1: { r: number; g: number; b: number },
  c2: { r: number; g: number; b: number },
  t: number
) => ({
  r: c1.r + (c2.r - c1.r) * t,
  g: c1.g + (c2.g - c1.g) * t,
  b: c1.b + (c2.b - c1.b) * t,
});

const pseudoNoise = (x: number, y: number, seed: number = 0): number => {
  const a = Math.sin(x * 12.9898 + y * 78.233 + seed * 37.719) * 43758.5453;
  const b = Math.sin(x * 39.346 + y * 11.135 + seed * 91.121) * 23421.631;
  return ((a - Math.floor(a)) + (b - Math.floor(b))) / 2 - 0.5;
};

const stripeNoise = (x: number, y: number, angle: number, seed: number = 0): number => {
  const cosA = Math.cos(angle);
  const sinA = Math.sin(angle);
  const u = x * cosA - y * sinA;
  return Math.sin(u * 25 + seed * 6.28) * 0.5 + 0.5;
};

const getColorForHeight = (
  height: number,
  minHeight: number,
  maxHeight: number,
  landform: LandformType
) => {
  const colors = COLOR_MAPS[landform];
  const range = maxHeight - minHeight;
  const normalized = range > 0 ? (height - minHeight) / range : 0;

  const lowRgb = hexToRgb(colors.low);
  const midRgb = hexToRgb(colors.mid);
  const highRgb = hexToRgb(colors.high);

  if (landform === 'volcano' && colors.peak && normalized > 0.85) {
    const peakRgb = hexToRgb(colors.peak);
    const t = (normalized - 0.85) / 0.15;
    return lerpColor(highRgb, peakRgb, Math.min(1, t));
  }

  if (normalized < 0.5) {
    return lerpColor(lowRgb, midRgb, normalized * 2);
  } else {
    return lerpColor(midRgb, highRgb, (normalized - 0.5) * 2);
  }
};

const calculateSlope = (
  heightMap: number[][],
  i: number,
  j: number,
  cellSize: number
): number => {
  const im = Math.max(0, i - 1);
  const ip = Math.min(GRID_SIZE - 1, i + 1);
  const jm = Math.max(0, j - 1);
  const jp = Math.min(GRID_SIZE - 1, j + 1);
  const dzdx = (heightMap[ip][j] - heightMap[im][j]) / (2 * cellSize);
  const dzdy = (heightMap[i][jp] - heightMap[i][jm]) / (2 * cellSize);
  return Math.sqrt(dzdx * dzdx + dzdy * dzdy);
};

const calculateSlopeDir = (
  heightMap: number[][],
  i: number,
  j: number,
  cellSize: number
): { dx: number; dy: number } => {
  const im = Math.max(0, i - 1);
  const ip = Math.min(GRID_SIZE - 1, i + 1);
  const jm = Math.max(0, j - 1);
  const jp = Math.min(GRID_SIZE - 1, j + 1);
  const dzdx = (heightMap[ip][j] - heightMap[im][j]) / (2 * cellSize);
  const dzdy = (heightMap[i][jp] - heightMap[i][jm]) / (2 * cellSize);
  const len = Math.sqrt(dzdx * dzdx + dzdy * dzdy) + 0.0001;
  return { dx: dzdx / len, dy: dzdy / len };
};

const TerrainMesh: React.FC<TerrainMeshProps> = ({ heightMap, landform, iteration }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const geometryRef = useRef<THREE.PlaneGeometry>(null);

  const { geometry } = useMemo(() => {
    const geo = new THREE.PlaneGeometry(TERRAIN_SIZE, TERRAIN_SIZE, GRID_SIZE - 1, GRID_SIZE - 1);
    geo.rotateX(-Math.PI / 2);
    const positions = geo.attributes.position;
    const colors = new Float32Array(positions.count * 3);
    const cellSize = TERRAIN_SIZE / (GRID_SIZE - 1);

    let minHeight = Infinity;
    let maxHeight = -Infinity;
    let maxSlope = 0;

    for (let i = 0; i < GRID_SIZE; i++) {
      for (let j = 0; j < GRID_SIZE; j++) {
        const idx = i * GRID_SIZE + j;
        const h = heightMap[i][j];
        positions.setY(idx, h);
        if (h < minHeight) minHeight = h;
        if (h > maxHeight) maxHeight = h;
        const slope = calculateSlope(heightMap, i, j, cellSize);
        if (slope > maxSlope) maxSlope = slope;
      }
    }

    for (let i = 0; i < GRID_SIZE; i++) {
      for (let j = 0; j < GRID_SIZE; j++) {
        const idx = i * GRID_SIZE + j;
        const h = heightMap[i][j];
        let color = getColorForHeight(h, minHeight, maxHeight, landform);
        const slope = calculateSlope(heightMap, i, j, cellSize);
        const slopeNorm = maxSlope > 0 ? Math.min(1, slope / maxSlope) : 0;
        const heightNorm = maxHeight > minHeight ? (h - minHeight) / (maxHeight - minHeight) : 0;

        if (slopeNorm > 0.35) {
          const rockStrength = Math.min(1, (slopeNorm - 0.35) / 0.65);
          const stripeAngle = Math.atan2(
            heightMap[Math.min(GRID_SIZE - 1, i + 1)][j] - heightMap[Math.max(0, i - 1)][j],
            heightMap[i][Math.min(GRID_SIZE - 1, j + 1)] - heightMap[i][Math.max(0, j - 1)]
          );
          const stripe = stripeNoise(i * 0.08, j * 0.08, stripeAngle, 1);
          const grain = pseudoNoise(i * 0.25, j * 0.25, 2);
          const rockFactor = rockStrength * (0.65 * stripe + 0.35 * (grain + 0.5));
          const rockColor = { r: 0.42, g: 0.38, b: 0.34 };
          color = lerpColor(color, rockColor, rockFactor * 0.55);
          const darken = 1 - rockStrength * 0.15;
          color = { r: color.r * darken, g: color.g * darken, b: color.b * darken };
        }

        if (slopeNorm < 0.22 && heightNorm < 0.45) {
          const sedimentStrength = Math.min(1, (0.22 - slopeNorm) / 0.22) *
            Math.min(1, (0.45 - heightNorm) / 0.45);
          const fineGrain = pseudoNoise(i * 0.6, j * 0.6, iteration * 0.1);
          const mediumGrain = pseudoNoise(i * 0.3, j * 0.3, 3);
          const sedimentFactor = sedimentStrength * (0.7 * (fineGrain + 0.5) + 0.3 * (mediumGrain + 0.5));
          const sedimentColor = { r: 0.82, g: 0.76, b: 0.62 };
          color = lerpColor(color, sedimentColor, sedimentFactor * 0.45);
        }

        const detailNoise = pseudoNoise(i * 1.2, j * 1.2, 4) * 0.08;
        color = {
          r: Math.max(0, Math.min(1, color.r + detailNoise)),
          g: Math.max(0, Math.min(1, color.g + detailNoise)),
          b: Math.max(0, Math.min(1, color.b + detailNoise)),
        };

        colors[idx * 3] = color.r;
        colors[idx * 3 + 1] = color.g;
        colors[idx * 3 + 2] = color.b;
      }
    }

    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.computeVertexNormals();
    return { geometry: geo };
  }, [landform]);

  useEffect(() => {
    geometryRef.current = geometry;
  }, [geometry]);

  useEffect(() => {
    if (!geometryRef.current) return;
    const positions = geometryRef.current.attributes.position;
    const colors = geometryRef.current.attributes.color as THREE.BufferAttribute;
    const cellSize = TERRAIN_SIZE / (GRID_SIZE - 1);

    let minHeight = Infinity;
    let maxHeight = -Infinity;
    let maxSlope = 0;

    for (let i = 0; i < GRID_SIZE; i++) {
      for (let j = 0; j < GRID_SIZE; j++) {
        const idx = i * GRID_SIZE + j;
        const h = heightMap[i][j];
        positions.setY(idx, h);
        if (h < minHeight) minHeight = h;
        if (h > maxHeight) maxHeight = h;
        const slope = calculateSlope(heightMap, i, j, cellSize);
        if (slope > maxSlope) maxSlope = slope;
      }
    }

    for (let i = 0; i < GRID_SIZE; i++) {
      for (let j = 0; j < GRID_SIZE; j++) {
        const idx = i * GRID_SIZE + j;
        const h = heightMap[i][j];
        let color = getColorForHeight(h, minHeight, maxHeight, landform);
        const slope = calculateSlope(heightMap, i, j, cellSize);
        const slopeNorm = maxSlope > 0 ? Math.min(1, slope / maxSlope) : 0;
        const heightNorm = maxHeight > minHeight ? (h - minHeight) / (maxHeight - minHeight) : 0;

        if (slopeNorm > 0.35) {
          const rockStrength = Math.min(1, (slopeNorm - 0.35) / 0.65);
          const stripeAngle = Math.atan2(
            heightMap[Math.min(GRID_SIZE - 1, i + 1)][j] - heightMap[Math.max(0, i - 1)][j],
            heightMap[i][Math.min(GRID_SIZE - 1, j + 1)] - heightMap[i][Math.max(0, j - 1)]
          );
          const stripe = stripeNoise(i * 0.08, j * 0.08, stripeAngle, 1);
          const grain = pseudoNoise(i * 0.25, j * 0.25, 2);
          const rockFactor = rockStrength * (0.65 * stripe + 0.35 * (grain + 0.5));
          const rockColor = { r: 0.42, g: 0.38, b: 0.34 };
          color = lerpColor(color, rockColor, rockFactor * 0.55);
          const darken = 1 - rockStrength * 0.15;
          color = { r: color.r * darken, g: color.g * darken, b: color.b * darken };
        }

        if (slopeNorm < 0.22 && heightNorm < 0.45) {
          const sedimentStrength = Math.min(1, (0.22 - slopeNorm) / 0.22) *
            Math.min(1, (0.45 - heightNorm) / 0.45);
          const fineGrain = pseudoNoise(i * 0.6, j * 0.6, iteration * 0.1);
          const mediumGrain = pseudoNoise(i * 0.3, j * 0.3, 3);
          const sedimentFactor = sedimentStrength * (0.7 * (fineGrain + 0.5) + 0.3 * (mediumGrain + 0.5));
          const sedimentColor = { r: 0.82, g: 0.76, b: 0.62 };
          color = lerpColor(color, sedimentColor, sedimentFactor * 0.45);
        }

        const detailNoise = pseudoNoise(i * 1.2, j * 1.2, 4) * 0.08;
        color = {
          r: Math.max(0, Math.min(1, color.r + detailNoise)),
          g: Math.max(0, Math.min(1, color.g + detailNoise)),
          b: Math.max(0, Math.min(1, color.b + detailNoise)),
        };

        colors.setXYZ(idx, color.r, color.g, color.b);
      }
    }

    positions.needsUpdate = true;
    colors.needsUpdate = true;
    geometryRef.current.computeVertexNormals();
  }, [heightMap, landform, iteration]);

  return (
    <mesh ref={meshRef} geometry={geometry}>
      <meshStandardMaterial
        vertexColors
        side={THREE.DoubleSide}
        flatShading={false}
        roughness={0.88}
        metalness={0.04}
      />
    </mesh>
  );
};

const GridHelperComp: React.FC = () => {
  return (
    <gridHelper
      args={[TERRAIN_SIZE, 40, '#3a3a5c', '#2d2d48']}
      position={[0, 0.01, 0]}
    />
  );
};

interface WindParticlesProps {
  heightMap: number[][];
  windStrength: number;
  isPlaying: boolean;
}

const WIND_PARTICLE_COUNT = 300;

const WindParticles: React.FC<WindParticlesProps> = ({ heightMap, windStrength, isPlaying }) => {
  const pointsRef = useRef<THREE.Points>(null);
  const velocitiesRef = useRef<Float32Array | null>(null);
  const timeRef = useRef(0);

  const { positions, colors, initialVelocities } = useMemo(() => {
    const pos = new Float32Array(WIND_PARTICLE_COUNT * 3);
    const col = new Float32Array(WIND_PARTICLE_COUNT * 3);
    const vel = new Float32Array(WIND_PARTICLE_COUNT * 3);
    const halfSize = TERRAIN_SIZE / 2;

    let maxH = 0;
    for (let i = 0; i < GRID_SIZE; i++) {
      for (let j = 0; j < GRID_SIZE; j++) {
        if (heightMap[i][j] > maxH) maxH = heightMap[i][j];
      }
    }

    for (let i = 0; i < WIND_PARTICLE_COUNT; i++) {
      const gi = Math.floor(Math.random() * GRID_SIZE);
      const gj = Math.floor(Math.random() * GRID_SIZE);
      const x = (gi / (GRID_SIZE - 1)) * TERRAIN_SIZE - halfSize;
      const z = (gj / (GRID_SIZE - 1)) * TERRAIN_SIZE - halfSize;
      const baseY = heightMap[gi][gj];
      const heightThreshold = maxH * 0.55;

      if (baseY < heightThreshold && Math.random() > 0.35) {
        pos[i * 3] = x;
        pos[i * 3 + 1] = baseY + Math.random() * 0.4 + 0.1;
        pos[i * 3 + 2] = z;
      } else {
        const hiGi = Math.floor(Math.random() * GRID_SIZE * 0.5) + Math.floor(GRID_SIZE * 0.25);
        const hiGj = Math.floor(Math.random() * GRID_SIZE * 0.5) + Math.floor(GRID_SIZE * 0.25);
        const ci = Math.min(GRID_SIZE - 1, hiGi);
        const cj = Math.min(GRID_SIZE - 1, hiGj);
        const hx = (ci / (GRID_SIZE - 1)) * TERRAIN_SIZE - halfSize;
        const hz = (cj / (GRID_SIZE - 1)) * TERRAIN_SIZE - halfSize;
        const hy = heightMap[ci][cj];
        pos[i * 3] = hx;
        pos[i * 3 + 1] = hy + Math.random() * 1.5 + 0.3;
        pos[i * 3 + 2] = hz;
      }

      const alpha = 0.35 + Math.random() * 0.5;
      col[i * 3] = 0.92 * alpha;
      col[i * 3 + 1] = 0.88 * alpha;
      col[i * 3 + 2] = 0.78 * alpha;
      vel[i * 3] = (Math.random() - 0.3) * 0.015;
      vel[i * 3 + 1] = (Math.random() - 0.5) * 0.006;
      vel[i * 3 + 2] = (Math.random() - 0.5) * 0.015;
    }
    return { positions: pos, colors: col, initialVelocities: vel };
  }, []);

  useEffect(() => {
    velocitiesRef.current = initialVelocities;
  }, [initialVelocities]);

  useFrame((_, delta) => {
    if (!pointsRef.current || !velocitiesRef.current) return;
    const geom = pointsRef.current.geometry;
    const posAttr = geom.attributes.position as THREE.BufferAttribute;
    const colAttr = geom.attributes.color as THREE.BufferAttribute;
    const posArr = posAttr.array as Float32Array;
    const colArr = colAttr.array as Float32Array;
    const velArr = velocitiesRef.current;
    const halfSize = TERRAIN_SIZE / 2;

    timeRef.current += delta;
    const intensity = isPlaying ? windStrength / 100 : 0;
    const windX = Math.sin(timeRef.current * 0.3) * 0.008;
    const windZ = Math.cos(timeRef.current * 0.23) * 0.006;

    for (let i = 0; i < WIND_PARTICLE_COUNT; i++) {
      const ix = i * 3;
      posArr[ix] += (velArr[ix] + windX) * intensity * 60 * delta;
      posArr[ix + 1] += velArr[ix + 1] * intensity * 60 * delta + Math.sin(timeRef.current * 3 + i) * 0.003 * intensity;
      posArr[ix + 2] += (velArr[ix + 2] + windZ) * intensity * 60 * delta;

      if (posArr[ix] > halfSize + 1) posArr[ix] = -halfSize - 1;
      if (posArr[ix] < -halfSize - 1) posArr[ix] = halfSize + 1;
      if (posArr[ix + 2] > halfSize + 1) posArr[ix + 2] = -halfSize - 1;
      if (posArr[ix + 2] < -halfSize - 1) posArr[ix + 2] = halfSize + 1;

      const gi = Math.max(0, Math.min(GRID_SIZE - 1, Math.floor((posArr[ix] + halfSize) / TERRAIN_SIZE * (GRID_SIZE - 1))));
      const gj = Math.max(0, Math.min(GRID_SIZE - 1, Math.floor((posArr[ix + 2] + halfSize) / TERRAIN_SIZE * (GRID_SIZE - 1))));
      const groundY = heightMap[gi][gj];
      if (posArr[ix + 1] < groundY + 0.05) {
        posArr[ix + 1] = groundY + Math.random() * 0.8 + 0.2;
      }
      if (posArr[ix + 1] > groundY + 3.5) {
        posArr[ix + 1] = groundY + 0.5 + Math.random();
      }

      const visibility = intensity * (0.5 + Math.sin(timeRef.current * 2 + i * 0.1) * 0.5);
      colArr[ix] = 0.92 * visibility;
      colArr[ix + 1] = 0.88 * visibility;
      colArr[ix + 2] = 0.78 * visibility;
    }

    posAttr.needsUpdate = true;
    colAttr.needsUpdate = true;
  });

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    return geo;
  }, [positions, colors]);

  return (
    <points ref={pointsRef} geometry={geometry}>
      <pointsMaterial
        size={0.08}
        vertexColors
        transparent
        opacity={0.75}
        depthWrite={false}
        sizeAttenuation
      />
    </points>
  );
};

interface WaterFlowLinesProps {
  heightMap: number[][];
  waterStrength: number;
  isPlaying: boolean;
}

const FLOW_LINE_COUNT = 80;

const WaterFlowLines: React.FC<WaterFlowLinesProps> = ({ heightMap, waterStrength, isPlaying }) => {
  const linesRef = useRef<THREE.Group>(null);
  const lineDataRef = useRef<Array<{
    positions: Float32Array;
    progress: number;
    speed: number;
    gi: number;
    gj: number;
  }>>([]);
  const timeRef = useRef(0);

  const halfSize = TERRAIN_SIZE / 2;
  const cellSize = TERRAIN_SIZE / (GRID_SIZE - 1);

  const initLines = useCallback(() => {
    const data: typeof lineDataRef.current = [];
    const group = linesRef.current;
    if (!group) return;

    while (group.children.length > 0) {
      const child = group.children[0] as THREE.Line;
      group.remove(child);
      child.geometry.dispose();
      (child.material as THREE.Material).dispose();
    }

    for (let i = 0; i < FLOW_LINE_COUNT; i++) {
      const gi = Math.floor(Math.random() * GRID_SIZE);
      const gj = Math.floor(Math.random() * GRID_SIZE);
      const segCount = 6;
      const positions = new Float32Array(segCount * 3);

      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      const material = new THREE.LineBasicMaterial({
        color: 0x6ba3d6,
        transparent: true,
        opacity: 0,
        depthWrite: false,
      });
      const line = new THREE.Line(geometry, material);
      line.frustumCulled = false;
      group.add(line);

      data.push({
        positions,
        progress: Math.random(),
        speed: 0.08 + Math.random() * 0.12,
        gi,
        gj,
      });
    }
    lineDataRef.current = data;
  }, []);

  useEffect(() => {
    initLines();
  }, [initLines]);

  useFrame((_, delta) => {
    if (!linesRef.current) return;
    timeRef.current += delta;
    const intensity = isPlaying ? waterStrength / 100 : 0;
    const data = lineDataRef.current;

    for (let i = 0; i < data.length; i++) {
      const item = data[i];
      const line = linesRef.current.children[i] as THREE.Line;
      const mat = line.material as THREE.LineBasicMaterial;
      const posAttr = line.geometry.attributes.position as THREE.BufferAttribute;
      const posArr = posAttr.array as Float32Array;

      if (intensity > 0.05) {
        item.progress += item.speed * intensity * delta * 2;
        if (item.progress > 1.5) {
          item.progress = -0.3;
          item.gi = Math.floor(Math.random() * GRID_SIZE);
          item.gj = Math.floor(Math.random() * GRID_SIZE);
          item.speed = 0.08 + Math.random() * 0.12;
        }

        let curGi = item.gi;
        let curGj = item.gj;

        for (let s = 0; s < 6; s++) {
          const t = s / 5;
          const tProgress = Math.max(0, Math.min(1, (item.progress - 0.1) * 1.5));

          if (s === 0) {
            posArr[s * 3] = (curGi / (GRID_SIZE - 1)) * TERRAIN_SIZE - halfSize;
            posArr[s * 3 + 1] = heightMap[curGi][curGj] + 0.04;
            posArr[s * 3 + 2] = (curGj / (GRID_SIZE - 1)) * TERRAIN_SIZE - halfSize;
          } else {
            const dir = calculateSlopeDir(heightMap, curGi, curGj, cellSize);
            const stepI = Math.round(-dir.dx * 3);
            const stepJ = Math.round(-dir.dy * 3);
            curGi = Math.max(0, Math.min(GRID_SIZE - 1, curGi + stepI));
            curGj = Math.max(0, Math.min(GRID_SIZE - 1, curGj + stepJ));
            posArr[s * 3] = (curGi / (GRID_SIZE - 1)) * TERRAIN_SIZE - halfSize;
            posArr[s * 3 + 1] = heightMap[curGi][curGj] + 0.04;
            posArr[s * 3 + 2] = (curGj / (GRID_SIZE - 1)) * TERRAIN_SIZE - halfSize;
          }

          const fadeT = 1 - Math.abs(t - tProgress) * 4;
          if (s === 0) {
            mat.opacity = Math.max(0, fadeT) * intensity * 0.75;
          }
        }

        posAttr.needsUpdate = true;
        line.geometry.computeBoundingSphere();
      } else {
        mat.opacity = Math.max(0, mat.opacity - delta * 2);
      }
    }
  });

  return <group ref={linesRef} />;
};

interface CameraRotationTrackerProps {
  onRotationChange: (rotation: number) => void;
}

const CameraRotationTracker: React.FC<CameraRotationTrackerProps> = ({ onRotationChange }) => {
  const { camera } = useThree();
  const lastRotationRef = useRef<number>(0);

  useFrame(() => {
    const euler = new THREE.Euler(0, 0, 0, 'YXZ');
    euler.setFromQuaternion(camera.quaternion);
    const rotation = THREE.MathUtils.radToDeg(euler.y);
    if (Math.abs(rotation - lastRotationRef.current) > 0.1) {
      lastRotationRef.current = rotation;
      onRotationChange(rotation);
    }
  });

  return null;
};

interface TerrainRendererProps {
  heightMap: number[][];
  landform: LandformType;
  erosionParams: ErosionParams;
  isPlaying: boolean;
  iteration: number;
}

const TerrainRenderer: React.FC<TerrainRendererProps> = ({
  heightMap,
  landform,
  erosionParams,
  isPlaying,
  iteration,
}) => {
  const [compassRotation, setCompassRotation] = useState(0);
  const compassRef = useRef<HTMLDivElement>(null);

  const handleRotationChange = useCallback((rotation: number) => {
    setCompassRotation(rotation);
  }, []);

  useEffect(() => {
    if (compassRef.current) {
      compassRef.current.style.transform = 'rotate(' + (-compassRotation) + 'deg)';
    }
  }, [compassRotation]);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <Canvas
        shadows={false}
        camera={{ position: [14, 12, 14], fov: 50, near: 0.1, far: 200 }}
        gl={{ antialias: true, alpha: false }}
        style={{ background: '#1a1a2e' }}
      >
        <color attach="background" args={['#1a1a2e']} />
        <fog attach="fog" args={['#1a1a2e', 50, 100]} />

        <ambientLight intensity={0.6} color="#ffffff" />
        <directionalLight position={[15, 25, 10]} intensity={1.4} />
        <directionalLight position={[-10, 8, -8]} intensity={0.4} color="#a8b0ff" />
        <hemisphereLight args={['#ffffff', '#444466', 0.5]} />

        <TerrainMesh heightMap={heightMap} landform={landform} iteration={iteration} />
        <WindParticles heightMap={heightMap} windStrength={erosionParams.windStrength} isPlaying={isPlaying} />
        <WaterFlowLines heightMap={heightMap} waterStrength={erosionParams.waterStrength} isPlaying={isPlaying} />
        <GridHelperComp />
        <CameraRotationTracker onRotationChange={handleRotationChange} />

        <OrbitControls
          enableDamping
          dampingFactor={0.08}
          minDistance={5}
          maxDistance={40}
          minPolarAngle={Math.PI / 12}
          maxPolarAngle={Math.PI * 17 / 36}
          enablePan
          screenSpacePanning={false}
          mouseButtons={{
            LEFT: THREE.MOUSE.ROTATE,
            MIDDLE: THREE.MOUSE.DOLLY,
            RIGHT: THREE.MOUSE.PAN,
          }}
        />
      </Canvas>

      <div
        ref={compassRef}
        style={{
          position: 'absolute',
          top: 24,
          right: 24,
          width: 80,
          height: 80,
          pointerEvents: 'none',
          transition: 'transform 0.1s linear',
          zIndex: 10,
        }}
      >
        <svg width="80" height="80" viewBox="0 0 80 80">
          <circle cx="40" cy="40" r="38" fill="rgba(45,45,68,0.85)" stroke="#6c63ff" strokeWidth="2" />
          <polygon points="40,10 34,30 40,26 46,30" fill="#e74c3c" />
          <polygon points="40,70 34,50 40,54 46,50" fill="#7f8c8d" />
          <polygon points="10,40 30,34 26,40 30,46" fill="#7f8c8d" />
          <polygon points="70,40 50,34 54,40 50,46" fill="#7f8c8d" />
          <text x="40" y="18" textAnchor="middle" fill="#ffffff" fontSize="12" fontWeight="bold">N</text>
          <circle cx="40" cy="40" r="5" fill="#6c63ff" />
        </svg>
      </div>
    </div>
  );
};

export default TerrainRenderer;
