import React, { useRef, useMemo, useEffect, useState, useCallback } from 'react';
import { Canvas, useFrame, useThree, ThreeEvent } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Html, Line, Grid } from '@react-three/drei';
import * as THREE from 'three';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building,
  SimulationParams,
  EnvironmentResult,
  BuildingInfo,
  Streamline,
} from '../utils/dataTypes';
import {
  computeEnvironment,
  getBuildingInfo,
  generateSliceData,
  generateBuildings,
} from '../services/environmentEngine';
import {
  createHeatmapTexture,
  createWindSliceTexture,
} from '../services/heatmapHelper';

const WORLD_SIZE = 120;
const HALF = WORLD_SIZE / 2;

interface BuildingMeshProps {
  building: Building;
  onClick: (b: Building, e: ThreeEvent<MouseEvent>) => void;
  onHover: (b: Building | null) => void;
  hovered: boolean;
  selected: boolean;
}

const BuildingMesh: React.FC<BuildingMeshProps> = ({
  building,
  onClick,
  onHover,
  hovered,
  selected,
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const haloRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      const target = hovered || selected ? 1.05 : 1;
      meshRef.current.scale.lerp(new THREE.Vector3(target, 1, target), 0.15);
    }
    if (haloRef.current) {
      const halo = haloRef.current as THREE.Mesh;
      const mat = halo.material as THREE.MeshBasicMaterial;
      const pulse = 0.4 + Math.sin(state.clock.elapsedTime * 1.8) * 0.15;
      mat.opacity = selected ? 0.8 : hovered ? 0.5 : pulse * 0.45;
    }
  });

  const gradientMaterial = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 4;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;
    const grad = ctx.createLinearGradient(0, 256, 0, 0);
    grad.addColorStop(0, '#6B6B6B');
    grad.addColorStop(1, '#F5F5DC');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 4, 256);
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    tex.needsUpdate = true;
    return new THREE.MeshStandardMaterial({
      map: tex,
      roughness: 0.75,
      metalness: 0.08,
    });
  }, []);

  return (
    <group position={[building.x, 0, building.z]}>
      <mesh
        ref={meshRef}
        onClick={(e) => {
          e.stopPropagation();
          onClick(building, e);
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          onHover(building);
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          onHover(null);
          document.body.style.cursor = 'default';
        }}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[building.width, building.height, building.depth]} />
        <primitive object={gradientMaterial} attach="material" />
      </mesh>
      <mesh
        ref={haloRef}
        position={[0, building.height + 0.3, 0]}
      >
        <boxGeometry args={[building.width * 1.08, 0.5, building.depth * 1.08]} />
        <meshBasicMaterial
          color={selected ? '#FFD54F' : hovered ? '#64B5F6' : '#FFF8E1'}
          transparent
          opacity={0.5}
        />
      </mesh>
    </group>
  );
};

interface StreamlineProps {
  streamline: Streamline;
  lineWidth?: number;
}

const StreamlineLine: React.FC<StreamlineProps> = ({ streamline, lineWidth = 1.5 }) => {
  const points = useMemo(() => {
    const arr: [number, number, number][] = streamline.points.map(
      (p) => [p.x, p.y, p.z] as [number, number, number]
    );
    return arr;
  }, [streamline]);

  const particlesRef = useRef<THREE.Points>(null);
  const positions = useMemo(() => new Float32Array(8 * 3), []);
  const speeds = useMemo(() => {
    const arr = new Float32Array(8);
    for (let i = 0; i < 8; i++) arr[i] = Math.random();
    return arr;
  }, []);
  const pStarts = useMemo(() => {
    const arr = new Float32Array(8);
    for (let i = 0; i < 8; i++) arr[i] = i / 8;
    return arr;
  }, []);

  useFrame((state, delta) => {
    if (particlesRef.current && streamline.points.length > 1) {
      const posAttr = particlesRef.current.geometry.getAttribute('position') as THREE.BufferAttribute;
      const count = posAttr.count;
      const segCount = streamline.points.length - 1;
      for (let i = 0; i < count; i++) {
        pStarts[i] += delta * (0.15 + (streamline.points[Math.min(Math.floor(pStarts[i] * segCount), segCount)]?.y ?? 10) / 120);
        if (pStarts[i] > 1) pStarts[i] -= 1;
        const t = pStarts[i] * segCount;
        const idx = Math.floor(t);
        const frac = t - idx;
        const a = streamline.points[idx];
        const b = streamline.points[Math.min(idx + 1, streamline.points.length - 1)];
        posAttr.setXYZ(
          i,
          a.x + (b.x - a.x) * frac,
          a.y + (b.y - a.y) * frac,
          a.z + (b.z - a.z) * frac
        );
      }
      posAttr.needsUpdate = true;
    }
  });

  return (
    <group>
      <Line
        points={points}
        color="#4FC3F7"
        lineWidth={lineWidth}
        transparent
        opacity={0.65}
      />
      <points ref={particlesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={8}
            array={positions}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.8}
          color="#81D4FA"
          transparent
          opacity={0.95}
          sizeAttenuation
        />
      </points>
    </group>
  );
};

interface InfoCardProps {
  info: BuildingInfo;
  position: { x: number; y: number; z: number };
  building: Building;
}

const InfoCard3D: React.FC<InfoCardProps> = ({ info, position, building }) => {
  return (
    <Html position={[position.x, position.y + building.height + 6, position.z]} center>
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0, opacity: 0 }}
        transition={{ type: 'spring', duration: 0.2, bounce: 0.5 }}
        style={{
          background: 'rgba(44, 62, 80, 0.95)',
          color: 'white',
          padding: '14px 18px',
          borderRadius: 12,
          minWidth: 220,
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          border: '1px solid rgba(100,181,246,0.5)',
          pointerEvents: 'none',
          fontSize: 13,
        }}
      >
        <div style={{ fontWeight: 700, marginBottom: 10, color: '#64B5F6', fontSize: 14 }}>
          建筑 #{info.buildingId} · 高度 {building.height.toFixed(0)}m
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#BDBDBD' }}>🌬 周边风速</span>
            <span style={{ color: '#4FC3F7', fontWeight: 600 }}>{info.avgWindSpeed.toFixed(1)} m/s</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#BDBDBD' }}>🌡 地表温度</span>
            <span style={{ color: '#FF7043', fontWeight: 600 }}>{info.avgSurfaceTemp.toFixed(1)} ℃</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#BDBDBD' }}>📐 底面积</span>
            <span>{(building.width * building.depth).toFixed(1)} m²</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#BDBDBD' }}>🌿 阴影标注</span>
            <span style={{ color: '#81C784' }}>已显示</span>
          </div>
        </div>
      </motion.div>
    </Html>
  );
};

interface MiniMapProps {
  buildings: Building[];
  selectedId: string | null;
}

const MiniMap: React.FC<MiniMapProps> = ({ buildings, selectedId }) => {
  const { camera } = useThree();
  const [camDir, setCamDir] = useState({ x: 0, y: -1 });

  useFrame(() => {
    const dir = new THREE.Vector3();
    camera.getWorldDirection(dir);
    setCamDir({ x: dir.x, y: dir.z });
  });

  return (
    <Html
      position={[HALF - 18, 0.2, -HALF + 18]}
      style={{ pointerEvents: 'none' }}
      zIndexRange={[10, 0]}
    >
      <div
        style={{
          background: 'rgba(44, 62, 80, 0.9)',
          padding: 8,
          borderRadius: 10,
          border: '1px solid rgba(100,181,246,0.6)',
          width: 180,
          height: 180,
          position: 'relative',
        }}
      >
        <div style={{ color: '#64B5F6', fontSize: 11, textAlign: 'center', marginBottom: 4, fontWeight: 600 }}>
          俯视视角
        </div>
        <div
          style={{
            position: 'relative',
            width: '100%',
            height: 148,
            background: 'rgba(30,40,50,0.8)',
            borderRadius: 6,
            overflow: 'hidden',
          }}
        >
          <svg width="100%" height="100%" viewBox={`${-HALF} ${-HALF} ${WORLD_SIZE} ${WORLD_SIZE}`}>
            {buildings.map((b) => (
              <rect
                key={b.id}
                x={b.x - b.width / 2}
                y={b.z - b.depth / 2}
                width={b.width}
                height={b.depth}
                fill={selectedId === b.id ? '#FFD54F' : '#3498DB'}
                opacity={0.8}
                stroke={selectedId === b.id ? '#FFB300' : 'rgba(255,255,255,0.3)'}
                strokeWidth={0.5}
              />
            ))}
            <g transform={`translate(0,0) rotate(${-Math.atan2(camDir.y, camDir.x) * 180 / Math.PI + 90})`}>
              <polygon points="0,-12 -6,8 6,8" fill="#FF5252" stroke="#fff" strokeWidth="0.5" />
            </g>
          </svg>
        </div>
      </div>
    </Html>
  );
};

interface SceneContentProps {
  buildings: Building[];
  params: SimulationParams;
  viewMode: 'streamline' | 'slice';
  sliceHeight: number;
  showHeatmap: boolean;
  selectedBuilding: Building | null;
  hoveredBuilding: Building | null;
  onBuildingClick: (b: Building, e: ThreeEvent<MouseEvent>) => void;
  onBuildingHover: (b: Building | null) => void;
  onSceneClick: () => void;
  envResult: EnvironmentResult;
  buildingInfo: BuildingInfo | null;
  title?: string;
}

const SceneContent: React.FC<SceneContentProps> = ({
  buildings,
  params,
  viewMode,
  sliceHeight,
  showHeatmap,
  selectedBuilding,
  hoveredBuilding,
  onBuildingClick,
  onBuildingHover,
  onSceneClick,
  envResult,
  buildingInfo,
  title,
}) => {
  const { windField, temperatureField } = envResult;

  const heatmapTex = useMemo(() => {
    return createHeatmapTexture(
      temperatureField.temperatures,
      temperatureField.minTemp,
      temperatureField.maxTemp,
      true
    );
  }, [temperatureField]);

  const sliceTex = useMemo(() => {
    if (viewMode !== 'slice') return null;
    const data = generateSliceData(windField, sliceHeight);
    let minS = Infinity, maxS = -Infinity;
    for (const row of data) for (const c of row) {
      if (c.speed < minS) minS = c.speed;
      if (c.speed > maxS) maxS = c.speed;
    }
    return createWindSliceTexture(data, minS, maxS);
  }, [windField, viewMode, sliceHeight]);

  useEffect(() => {
    return () => {
      heatmapTex.dispose();
      sliceTex?.dispose();
    };
  }, [heatmapTex, sliceTex]);

  const windDir = useMemo(() => {
    const rad = (params.windAngle * Math.PI) / 180;
    return { x: Math.cos(rad), z: Math.sin(rad) };
  }, [params.windAngle]);

  return (
    <group onClick={onSceneClick}>
      <PerspectiveCamera makeDefault position={[90, 85, 110]} fov={45} />
      <OrbitControls
        enableDamping
        dampingFactor={0.08}
        minDistance={30}
        maxDistance={250}
        maxPolarAngle={Math.PI / 2.1}
        target={[0, 5, 0]}
      />

      <ambientLight intensity={0.55} />
      <directionalLight
        position={[60, 80, 40]}
        intensity={1.1}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-80}
        shadow-camera-right={80}
        shadow-camera-top={80}
        shadow-camera-bottom={-80}
      />
      <hemisphereLight args={['#B0BEC5', '#37474F', 0.4]} />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[WORLD_SIZE + 20, WORLD_SIZE + 20]} />
        <meshStandardMaterial color="#263238" roughness={1} />
      </mesh>

      {showHeatmap && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
          <planeGeometry args={[WORLD_SIZE, WORLD_SIZE]} />
          <meshBasicMaterial map={heatmapTex} transparent opacity={0.72} />
        </mesh>
      )}

      {viewMode === 'slice' && sliceTex && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, sliceHeight, 0]}>
          <planeGeometry args={[WORLD_SIZE, WORLD_SIZE]} />
          <meshBasicMaterial map={sliceTex} transparent opacity={0.7} />
        </mesh>
      )}

      <Grid
        args={[WORLD_SIZE, 12]}
        cellColor="#455A64"
        sectionColor="#607D8B"
        sectionThickness={1}
        cellThickness={0.5}
        fadeDistance={250}
        fadeStrength={1}
        position={[0, 0.02, 0]}
        infiniteGrid={false}
      />

      <group position={[-HALF - 12, 8, 0]}>
        <mesh>
          <coneGeometry args={[4, 10, 4]} />
          <meshBasicMaterial color="#4FC3F7" transparent opacity={0.85} />
        </mesh>
        <mesh position={[0, -8, 0]}>
          <cylinderGeometry args={[1.5, 1.5, 6]} />
          <meshBasicMaterial color="#29B6F6" />
        </mesh>
        <Html position={[0, -16, 0]} center style={{ pointerEvents: 'none' }}>
          <div style={{ color: '#4FC3F7', fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap' }}>
            风向 {params.windAngle}° · {params.windSpeed.toFixed(1)}m/s
          </div>
        </Html>
      </group>

      {viewMode === 'streamline' &&
        windField.streamlines.map((sl) => <StreamlineLine key={sl.id} streamline={sl} />)}

      {buildings.map((b) => (
        <BuildingMesh
          key={b.id}
          building={b}
          onClick={onBuildingClick}
          onHover={onBuildingHover}
          hovered={hoveredBuilding?.id === b.id}
          selected={selectedBuilding?.id === b.id}
        />
      ))}

      {selectedBuilding && buildingInfo &&
        buildingInfo.shadowArea.map((s, i) => (
          <mesh
            key={`shadow-${i}`}
            rotation={[-Math.PI / 2, 0, 0]}
            position={[s.x, 0.08, s.z]}
          >
            <planeGeometry args={[s.width, s.depth]} />
            <meshBasicMaterial color="#66BB6A" transparent opacity={0.42} />
          </mesh>
        ))}

      <AnimatePresence>
        {selectedBuilding && buildingInfo && (
          <InfoCard3D
            info={buildingInfo}
            position={{ x: selectedBuilding.x, y: 0, z: selectedBuilding.z }}
            building={selectedBuilding}
          />
        )}
      </AnimatePresence>

      {title && (
        <Html position={[0, 52, -HALF]} center style={{ pointerEvents: 'none' }}>
          <div
            style={{
              color: 'white',
              background: 'rgba(44,62,80,0.85)',
              padding: '8px 20px',
              borderRadius: 8,
              fontSize: 15,
              fontWeight: 700,
              border: '1px solid rgba(100,181,246,0.5)',
              whiteSpace: 'nowrap',
            }}
          >
            {title}
          </div>
        </Html>
      )}

      <MiniMap buildings={buildings} selectedId={selectedBuilding?.id ?? null} />

      <fog attach="fog" args={['#1A2332', 150, 320]} />
    </group>
  );
};

export interface BuildingSceneHandle {
  regenerate: () => void;
}

interface BuildingSceneProps {
  params: SimulationParams;
  compareMode: boolean;
  compareLayout?: 'enclosed' | 'row' | 'cluster';
}

const BuildingScene: React.FC<BuildingSceneProps> = ({ params, compareMode, compareLayout }) => {
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [compareBuildings, setCompareBuildings] = useState<Building[]>([]);
  const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(null);
  const [hoveredBuilding, setHoveredBuilding] = useState<Building | null>(null);
  const [viewMode, setViewMode] = useState<'streamline' | 'slice'>('streamline');
  const [sliceHeight, setSliceHeight] = useState(10);
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [buildingInfo, setBuildingInfo] = useState<BuildingInfo | null>(null);
  const [, setTick] = useState(0);

  useEffect(() => {
    (window as any).__sceneControls = {
      setViewMode,
      setSliceHeight,
      setShowHeatmap,
      regenerate: () => {
        setBuildings(prev => prev.length === 0 ? [] : [...prev]);
        setTick(t => t + 1);
      },
    };
  }, []);

  useEffect(() => {
    setBuildings([]);
    setTimeout(() => {
      setBuildings(generateBuildings(params.layout));
    }, 0);
  }, [params.layout]);

  useEffect(() => {
    if (compareMode && compareLayout) {
      setCompareBuildings([]);
      setTimeout(() => {
        setCompareBuildings(generateBuildings(compareLayout));
      }, 0);
    } else {
      setCompareBuildings([]);
    }
  }, [compareMode, compareLayout]);

  const envResult = useMemo(() => {
    if (buildings.length === 0) {
      return {
        windField: { gridSize: 0, bounds: { minX: 0, maxX: 0, minY: 0, maxY: 0, minZ: 0, maxZ: 0 }, points: [], streamlines: [] },
        temperatureField: { gridSize: 0, bounds: { minX: 0, maxX: 0, minZ: 0, maxZ: 0 }, temperatures: [[]], minTemp: 20, maxTemp: 40 },
      };
    }
    return computeEnvironment(buildings, params);
  }, [buildings, params.windAngle, params.windSpeed, params.solarIntensity]);

  const compareEnvResult = useMemo(() => {
    if (!compareMode || compareBuildings.length === 0) return null;
    return computeEnvironment(compareBuildings, params);
  }, [compareMode, compareBuildings, params.windAngle, params.windSpeed, params.solarIntensity]);

  useEffect(() => {
    if (selectedBuilding) {
      const info = getBuildingInfo(selectedBuilding, buildings, envResult, params.solarIntensity);
      setBuildingInfo(info);
    } else {
      setBuildingInfo(null);
    }
  }, [selectedBuilding, buildings, envResult, params.solarIntensity]);

  const handleBuildingClick = useCallback((b: Building, e: ThreeEvent<MouseEvent>) => {
    setSelectedBuilding((prev) => (prev?.id === b.id ? null : b));
  }, []);

  const layoutNames: Record<string, string> = {
    enclosed: '围合式布局',
    row: '行列式布局',
    cluster: '点群式布局',
  };

  if (buildings.length === 0) {
    return (
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#1A2332' }}>
        <div style={{ color: '#64B5F6', fontSize: 18 }}>正在生成场景...</div>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <div style={{
        position: 'absolute',
        top: 12,
        right: compareMode ? '51%' : 20,
        zIndex: 10,
        display: 'flex',
        gap: 8,
        flexWrap: 'wrap',
        maxWidth: 360,
      }}>
        <button
          onClick={() => setViewMode('streamline')}
          style={{
            padding: '7px 14px',
            borderRadius: 8,
            border: viewMode === 'streamline' ? '2px solid #3498DB' : '1px solid rgba(255,255,255,0.2)',
            background: viewMode === 'streamline' ? 'linear-gradient(135deg, #3498DB, #2980B9)' : 'rgba(44,62,80,0.85)',
            color: 'white',
            cursor: 'pointer',
            fontSize: 12,
            fontWeight: 600,
            transition: 'all 0.2s ease-out',
          }}
          onMouseEnter={(e) => { if (viewMode !== 'streamline') (e.target as HTMLButtonElement).style.background = 'rgba(255,255,255,0.25)'; }}
          onMouseLeave={(e) => { if (viewMode !== 'streamline') (e.target as HTMLButtonElement).style.background = 'rgba(44,62,80,0.85)'; }}
        >
          🌬 流线模式
        </button>
        <button
          onClick={() => setViewMode('slice')}
          style={{
            padding: '7px 14px',
            borderRadius: 8,
            border: viewMode === 'slice' ? '2px solid #3498DB' : '1px solid rgba(255,255,255,0.2)',
            background: viewMode === 'slice' ? 'linear-gradient(135deg, #3498DB, #2980B9)' : 'rgba(44,62,80,0.85)',
            color: 'white',
            cursor: 'pointer',
            fontSize: 12,
            fontWeight: 600,
            transition: 'all 0.2s ease-out',
          }}
          onMouseEnter={(e) => { if (viewMode !== 'slice') (e.target as HTMLButtonElement).style.background = 'rgba(255,255,255,0.25)'; }}
          onMouseLeave={(e) => { if (viewMode !== 'slice') (e.target as HTMLButtonElement).style.background = 'rgba(44,62,80,0.85)'; }}
        >
          📐 切片模式
        </button>
        <button
          onClick={() => setShowHeatmap(!showHeatmap)}
          style={{
            padding: '7px 14px',
            borderRadius: 8,
            border: showHeatmap ? '2px solid #E67E22' : '1px solid rgba(255,255,255,0.2)',
            background: showHeatmap ? 'linear-gradient(135deg, #E67E22, #D35400)' : 'rgba(44,62,80,0.85)',
            color: 'white',
            cursor: 'pointer',
            fontSize: 12,
            fontWeight: 600,
            transition: 'all 0.2s ease-out',
          }}
          onMouseEnter={(e) => { if (!showHeatmap) (e.target as HTMLButtonElement).style.background = 'rgba(255,255,255,0.25)'; }}
          onMouseLeave={(e) => { if (!showHeatmap) (e.target as HTMLButtonElement).style.background = 'rgba(44,62,80,0.85)'; }}
        >
          🌡 {showHeatmap ? '隐藏热力图' : '显示热力图'}
        </button>
        {viewMode === 'slice' && (
          <div style={{
            background: 'rgba(44,62,80,0.9)',
            padding: '7px 12px',
            borderRadius: 8,
            color: 'white',
            fontSize: 12,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            border: '1px solid rgba(255,255,255,0.15)',
          }}>
            切片高度
            <input
              type="range"
              min={2}
              max={40}
              step={1}
              value={sliceHeight}
              onChange={(e) => setSliceHeight(parseInt(e.target.value))}
              style={{ width: 80 }}
            />
            <span style={{ color: '#64B5F6', fontWeight: 600 }}>{sliceHeight}m</span>
          </div>
        )}
      </div>

      <div style={{ width: '100%', height: '100%', display: compareMode ? 'flex' : 'block' }}>
        <div style={{
          width: compareMode ? '50%' : '100%',
          height: '100%',
          position: 'relative',
          borderRight: compareMode ? '2px solid rgba(100,181,246,0.5)' : 'none',
        }}>
          <Canvas shadows dpr={[1, 2]} performance={{ min: 0.5 }}>
            <SceneContent
              buildings={buildings}
              params={params}
              viewMode={viewMode}
              sliceHeight={sliceHeight}
              showHeatmap={showHeatmap}
              selectedBuilding={selectedBuilding}
              hoveredBuilding={hoveredBuilding}
              onBuildingClick={handleBuildingClick}
              onBuildingHover={setHoveredBuilding}
              onSceneClick={() => setSelectedBuilding(null)}
              envResult={envResult}
              buildingInfo={buildingInfo}
              title={compareMode ? `A · ${layoutNames[params.layout]}` : undefined}
            />
          </Canvas>
        </div>
        {compareMode && compareEnvResult && (
          <div style={{ width: '50%', height: '100%', position: 'relative' }}>
            <Canvas shadows dpr={[1, 2]} performance={{ min: 0.5 }}>
              <SceneContent
                buildings={compareBuildings}
                params={params}
                viewMode={viewMode}
                sliceHeight={sliceHeight}
                showHeatmap={showHeatmap}
                selectedBuilding={null}
                hoveredBuilding={null}
                onBuildingClick={() => {}}
                onBuildingHover={() => {}}
                onSceneClick={() => {}}
                envResult={compareEnvResult}
                buildingInfo={null}
                title={`B · ${compareLayout ? layoutNames[compareLayout] : ''}`}
              />
            </Canvas>
          </div>
        )}
      </div>
    </div>
  );
};

export default BuildingScene;
