import { useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame, useThree, ThreeEvent } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import type { DataPoint, CameraPreset, SelectedDataDetail } from './types';
import { CATEGORY_COLORS, CAMERA_PRESETS } from './types';

interface GeometryBarProps {
  position: [number, number, number];
  targetHeight: number;
  color: string;
  dataPoint: DataPoint;
  isSelected: boolean;
  onClick: (detail: SelectedDataDetail) => void;
  enableLOD: boolean;
  timeOffset: number;
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function GeometryBar({
  position,
  targetHeight,
  color,
  dataPoint,
  isSelected,
  onClick,
  enableLOD,
  timeOffset,
}: GeometryBarProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const heightRef = useRef(0.01);
  const prevHeightRef = useRef(0.01);
  const animStartRef = useRef(0);
  const animatingRef = useRef(false);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    prevHeightRef.current = heightRef.current;
    animStartRef.current = performance.now();
    animatingRef.current = true;
  }, [targetHeight]);

  useFrame((state) => {
    if (!meshRef.current) return;

    const now = performance.now();
    const elapsed = (now - animStartRef.current) / 300;

    if (animatingRef.current && elapsed < 1) {
      const t = easeOutCubic(Math.min(elapsed, 1));
      heightRef.current = prevHeightRef.current + (targetHeight - prevHeightRef.current) * t;
    } else {
      heightRef.current = targetHeight;
      animatingRef.current = false;
    }

    const floatAmplitude = 0.02;
    const floatPeriod = 2000;
    const float = Math.sin((now + timeOffset) / floatPeriod * Math.PI * 2) * floatAmplitude;

    meshRef.current.scale.y = heightRef.current;
    meshRef.current.position.y = position[1] + heightRef.current / 2 + float;

    const scale = isSelected ? 1.2 : hovered ? 1.08 : 1;
    meshRef.current.scale.x = scale;
    meshRef.current.scale.z = scale;
  });

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    onClick({
      point: dataPoint,
      rank: 0,
      screenPosition: { x: 0, y: 0 },
    });
  };

  const segments = enableLOD && position[0] * position[0] + position[2] * position[2] > 100 ? 4 : 16;

  return (
    <mesh
      ref={meshRef}
      position={[position[0], position[1] + heightRef.current / 2, position[2]]}
      onClick={handleClick}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
      castShadow
    >
      <boxGeometry args={[0.6, 1, 0.6, segments, 1, segments]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={isSelected ? 0.8 : hovered ? 0.5 : 0.25}
        transparent
        opacity={0.95}
        metalness={0.3}
        roughness={0.4}
      />
    </mesh>
  );
}

function BreathingGrid() {
  const materialRef = useRef<THREE.LineBasicMaterial>(null);

  useFrame((state) => {
    if (!materialRef.current) return;
    const t = state.clock.elapsedTime;
    const intensity = 0.5 + Math.sin(t * 1.2) * 0.3;
    materialRef.current.opacity = 0.15 + intensity * 0.1;
  });

  return (
    <group>
      <gridHelper
        args={[30, 30, '#2AF5FF', '#2AF5FF']}
        position={[0, 0.01, 0]}
      >
        <lineBasicMaterial
          ref={materialRef}
          transparent
          opacity={0.3}
          color="#2AF5FF"
        />
      </gridHelper>
      <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[30, 30]} />
        <meshStandardMaterial
          color="#0B0D17"
          transparent
          opacity={0.7}
          metalness={0.2}
          roughness={0.8}
        />
      </mesh>
    </group>
  );
}

function CameraAnimator({
  targetPreset,
  onComplete,
  showGuidance,
  setShowGuidance,
}: {
  targetPreset: CameraPreset | null;
  onComplete: () => void;
  showGuidance: boolean;
  setShowGuidance: (v: boolean) => void;
}) {
  const { camera } = useThree();
  const controlsRef = useRef<any>(null);
  const startPosRef = useRef<THREE.Vector3 | null>(null);
  const startTargetRef = useRef<THREE.Vector3 | null>(null);
  const animStartRef = useRef(0);
  const activeRef = useRef(false);
  const lineRef = useRef<any>(null);

  useEffect(() => {
    if (targetPreset) {
      startPosRef.current = camera.position.clone();
      startTargetRef.current = new THREE.Vector3(...targetPreset.target);
      animStartRef.current = performance.now();
      activeRef.current = true;
      if (showGuidance) {
        setShowGuidance(true);
      }
    }
  }, [targetPreset]);

  useFrame(() => {
    if (!activeRef.current || !targetPreset || !startPosRef.current) return;

    const elapsed = (performance.now() - animStartRef.current) / 1000;
    const t = easeInOutCubic(Math.min(elapsed, 1));

    const targetPos = new THREE.Vector3(...targetPreset.position);
    camera.position.lerpVectors(startPosRef.current, targetPos, t);

    if (lineRef.current && showGuidance) {
      const geometry = lineRef.current.geometry as THREE.BufferGeometry;
      const positions = geometry.attributes.position as THREE.BufferAttribute;
      const progress = Math.min(t * 1.5, 1);
      for (let i = 0; i <= 50; i++) {
        const frac = i / 50;
        if (frac <= progress) {
          const point = startPosRef.current.clone().lerp(targetPos, frac);
          positions.setXYZ(i, point.x, point.y, point.z);
        } else {
          positions.setXYZ(i, startPosRef.current.x, startPosRef.current.y, startPosRef.current.z);
        }
      }
      positions.needsUpdate = true;
    }

    if (t >= 1) {
      activeRef.current = false;
      onComplete();
      setTimeout(() => setShowGuidance(false), 300);
    }
  });

  if (!showGuidance || !targetPreset || !startPosRef.current) return null;

  const points: THREE.Vector3[] = [];
  for (let i = 0; i <= 50; i++) {
    points.push(startPosRef.current.clone());
  }
  const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
  const lineMaterial = new THREE.LineBasicMaterial({
    color: '#2AF5FF',
    transparent: true,
    opacity: 0.8,
  });
  const lineObj = new THREE.Line(lineGeometry, lineMaterial);

  return (
    <primitive ref={lineRef} object={lineObj} />
  );
}

interface SceneContentProps {
  dataSlice: DataPoint[];
  onSelectPoint: (detail: SelectedDataDetail | null) => void;
  selectedIndex: number | null;
  cameraPreset: CameraPreset | null;
  onCameraAnimationComplete: () => void;
}

function SceneContent({
  dataSlice,
  onSelectPoint,
  selectedIndex,
  cameraPreset,
  onCameraAnimationComplete,
}: SceneContentProps) {
  const [showGuidance, setShowGuidance] = useState(false);
  const enableLOD = dataSlice.length > 500;

  const { colors, sortedData } = useMemo(() => {
    const categories = Array.from(new Set(dataSlice.map((d) => d.category)));
    const colorMap: Record<string, string> = {};
    categories.forEach((cat, i) => {
      colorMap[cat] = CATEGORY_COLORS[cat] || Object.values(CATEGORY_COLORS)[i % 5] || '#2AF5FF';
    });

    const sorted = [...dataSlice].sort((a, b) => b.value - a.value);
    const rankMap = new Map<number, number>();
    sorted.forEach((p, i) => rankMap.set(p.index, i + 1));

    return { colors: colorMap, sortedData: dataSlice.map(p => ({ ...p, rank: rankMap.get(p.index) || 0 })) };
  }, [dataSlice]);

  const maxValue = useMemo(() => {
    return Math.max(...dataSlice.map((d) => d.value), 1);
  }, [dataSlice]);

  const gridCols = Math.ceil(Math.sqrt(dataSlice.length));

  const handleBarClick = (detail: SelectedDataDetail) => {
    const rank = sortedData.find(p => p.index === detail.point.index)?.rank || 0;
    onSelectPoint({ ...detail, rank });
  };

  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[10, 15, 10]} intensity={0.8} castShadow />
      <pointLight position={[-10, 8, -10]} intensity={0.5} color="#A855F7" />
      <pointLight position={[10, 5, -10]} intensity={0.3} color="#2AF5FF" />

      <BreathingGrid />

      {sortedData.map((point, idx) => {
        const col = idx % gridCols;
        const row = Math.floor(idx / gridCols);
        const x = (col - gridCols / 2) * 0.85;
        const z = (row - gridCols / 2) * 0.85;
        const height = Math.max(0.05, (point.value / maxValue) * 6);
        const color = colors[point.category] || '#2AF5FF';

        return (
          <GeometryBar
            key={`${point.time}-${point.index}`}
            position={[x, 0, z]}
            targetHeight={height}
            color={color}
            dataPoint={point}
            isSelected={selectedIndex === point.index}
            onClick={handleBarClick}
            enableLOD={enableLOD}
            timeOffset={idx * 137}
          />
        );
      })}

      <CameraAnimator
        targetPreset={cameraPreset}
        onComplete={onCameraAnimationComplete}
        showGuidance={showGuidance}
        setShowGuidance={setShowGuidance}
      />

      <OrbitControls
        enableDamping
        dampingFactor={0.08}
        minDistance={5}
        maxDistance={40}
        maxPolarAngle={Math.PI / 2 - 0.05}
      />
    </>
  );
}

interface SceneManagerProps {
  dataSlice: DataPoint[];
  onSelectPoint: (detail: SelectedDataDetail | null) => void;
  selectedIndex: number | null;
  cameraPresetIndex: number | null;
  onCameraAnimationComplete: () => void;
}

export function SceneManager({
  dataSlice,
  onSelectPoint,
  selectedIndex,
  cameraPresetIndex,
  onCameraAnimationComplete,
}: SceneManagerProps) {
  const cameraPreset = cameraPresetIndex !== null ? CAMERA_PRESETS[cameraPresetIndex] : null;

  const handleCanvasClick = () => {
    onSelectPoint(null);
  };

  return (
    <Canvas
      camera={{ position: CAMERA_PRESETS[0].position, fov: 50, near: 0.1, far: 1000 }}
      style={{ background: 'linear-gradient(180deg, #0B0D17 0%, #0F1222 100%)' }}
      shadows
      onClick={handleCanvasClick}
      gl={{ antialias: true, alpha: false }}
    >
      <fog attach="fog" args={['#0B0D17', 20, 50]} />
      <SceneContent
        dataSlice={dataSlice}
        onSelectPoint={onSelectPoint}
        selectedIndex={selectedIndex}
        cameraPreset={cameraPreset}
        onCameraAnimationComplete={onCameraAnimationComplete}
      />
    </Canvas>
  );
}
