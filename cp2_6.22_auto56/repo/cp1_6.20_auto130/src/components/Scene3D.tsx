import { useRef, useMemo, useEffect, useState, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Grid, Html } from '@react-three/drei';
import * as THREE from 'three';
import { Building, CityParams, CELL_SIZE, generateBuildings } from '../modules/BuildingGenerator';
import { calculateStats, CityStats, calculateDensityHeatmap } from '../modules/StatsCalculator';
import { DisplayMode, ViewPreset } from '../App';

interface Scene3DProps {
  params: CityParams;
  displayMode: DisplayMode;
  viewPreset: ViewPreset;
  sunAngle: number;
  walkSpeed: number;
  onBuildingSelect: (building: Building | null) => void;
  onStatsUpdate: (stats: CityStats) => void;
  onBuildingHeightChange: (id: string, height: number) => void;
}

interface BuildingMeshProps {
  building: Building;
  displayMode: DisplayMode;
  minHeight: number;
  maxHeight: number;
  targetHeight: number;
  onClick: () => void;
  onDoubleClick: () => void;
}

function BuildingMesh({
  building,
  displayMode,
  minHeight,
  maxHeight,
  targetHeight,
  onClick,
  onDoubleClick,
}: BuildingMeshProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const currentHeight = useRef(0);
  const animStartTime = useRef(Date.now());
  const initialHeight = useRef(0);

  useEffect(() => {
    initialHeight.current = currentHeight.current;
    animStartTime.current = Date.now();
  }, [targetHeight]);

  useFrame(() => {
    if (!meshRef.current) return;
    const elapsed = (Date.now() - animStartTime.current) / 500;
    const t = Math.min(1, elapsed);
    const eased = 1 - Math.pow(1 - t, 3);
    currentHeight.current = initialHeight.current + (targetHeight - initialHeight.current) * eased;
    meshRef.current.scale.y = currentHeight.current;
    meshRef.current.position.y = currentHeight.current / 2;
  });

  const color = useMemo(() => {
    if (displayMode === 'heightColor') {
      const t = (targetHeight - minHeight) / (maxHeight - minHeight);
      const hue = (1 - t) * 240;
      return new THREE.Color().setHSL(hue / 360, 0.8, 0.55);
    }
    return new THREE.Color(building.color);
  }, [displayMode, targetHeight, minHeight, maxHeight, building.color]);

  const windowTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#3a7bc8';
    ctx.fillRect(0, 0, 128, 256);
    
    const windowColor = '#e8f4ff';
    const windowDarkColor = '#c8e0f8';
    const windowWidth = 14;
    const windowHeight = 22;
    const cols = 5;
    const rows = 9;
    const paddingX = 12;
    const paddingY = 14;
    
    ctx.fillStyle = '#2d5fa0';
    for (let i = 0; i <= cols; i++) {
      const x = paddingX / 2 + i * (windowWidth + paddingX / 2) - 1;
      ctx.fillRect(x, 0, 2, 256);
    }
    for (let i = 0; i <= rows; i++) {
      const y = paddingY / 2 + i * (windowHeight + paddingY / 2) - 1;
      ctx.fillRect(0, y, 128, 2);
    }
    
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const x = paddingX + col * (windowWidth + paddingX / 2);
        const y = paddingY + row * (windowHeight + paddingY / 2);
        const lit = Math.random() > 0.3;
        
        ctx.fillStyle = lit ? windowColor : windowDarkColor;
        ctx.fillRect(x, y, windowWidth, windowHeight);
        
        const grad = ctx.createLinearGradient(x, y, x, y + windowHeight);
        grad.addColorStop(0, 'rgba(255, 255, 255, 0.3)');
        grad.addColorStop(0.5, 'rgba(255, 255, 255, 0.1)');
        grad.addColorStop(1, 'rgba(0, 0, 0, 0.1)');
        ctx.fillStyle = grad;
        ctx.fillRect(x, y, windowWidth, windowHeight);
      }
    }
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.magFilter = THREE.LinearFilter;
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    return texture;
  }, []);

  const topColor = displayMode === 'heightColor' 
    ? color.clone().lerp(new THREE.Color('white'), 0.2) 
    : new THREE.Color('#7ec8f5');

  return (
    <group position={[building.x, 0, building.z]}>
      <mesh
        ref={meshRef}
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        onDoubleClick={(e) => {
          e.stopPropagation();
          onDoubleClick();
        }}
      >
        <boxGeometry args={[building.width, 1, building.depth]} />
        {(displayMode === 'normal' || displayMode === 'shadow') && windowTexture ? (
          <meshStandardMaterial
            color={color}
            transparent
            opacity={displayMode === 'shadow' ? 0.6 : 0.88}
            map={windowTexture}
          />
        ) : (
          <meshStandardMaterial color={color} transparent opacity={0.85} />
        )}
      </mesh>
      
      <mesh position={[0, targetHeight + 0.1, 0]}>
        <boxGeometry args={[building.width * 0.9, 0.3, building.depth * 0.9]} />
        <meshStandardMaterial
          color={topColor}
          transparent
          opacity={0.95}
          emissive={topColor}
          emissiveIntensity={0.2}
        />
      </mesh>

      {building.selected && (
        <mesh position={[0, targetHeight / 2, 0]}>
          <boxGeometry args={[building.width * 1.08, targetHeight * 1.02, building.depth * 1.08]} />
          <meshBasicMaterial color="#e94560" transparent opacity={0.3} side={THREE.BackSide} />
        </mesh>
      )}
    </group>
  );
}

interface ShadowPlaneProps {
  buildings: Building[];
  sunAngle: number;
  citySize: number;
}

function ShadowPlane({ buildings, sunAngle, citySize }: ShadowPlaneProps) {
  const shadowCanvas = useMemo(() => {
    const canvas = document.createElement('canvas');
    const size = 512;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0)';
    ctx.fillRect(0, 0, size, size);
    
    const angleRad = (sunAngle * Math.PI) / 180;
    const scale = size / citySize;
    
    for (const building of buildings) {
      const bx = size / 2 + building.x * scale;
      const bz = size / 2 + building.z * scale;
      const bw = building.width * scale;
      const bd = building.depth * scale;
      const shadowLen = building.height * scale * 0.5;
      
      const gradient = ctx.createLinearGradient(bx, bz, bx + Math.cos(angleRad) * shadowLen, bz + Math.sin(angleRad) * shadowLen);
      gradient.addColorStop(0, 'rgba(20, 20, 30, 0.6)');
      gradient.addColorStop(1, 'rgba(20, 20, 30, 0)');
      
      ctx.save();
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.rect(bx - bw / 2, bz - bd / 2, bw, bd);
      ctx.fill();
      ctx.restore();
    }
    
    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  }, [buildings, sunAngle, citySize]);

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
      <planeGeometry args={[citySize, citySize]} />
      <meshBasicMaterial map={shadowCanvas} transparent depthWrite={false} />
    </mesh>
  );
}

interface HeatmapPlaneProps {
  buildings: Building[];
  gridSize: number;
  citySize: number;
}

function HeatmapPlane({ buildings, gridSize, citySize }: HeatmapPlaneProps) {
  const heatmapData = useMemo(
    () => calculateDensityHeatmap(buildings, gridSize),
    [buildings, gridSize]
  );

  const heatmapTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    const size = gridSize * 8;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;
    
    const cellSize = size / gridSize;
    
    for (const cell of heatmapData) {
      const x = size / 2 + (cell.x / citySize) * size - cellSize / 2;
      const z = size / 2 + (cell.z / citySize) * size - cellSize / 2;
      
      const t = cell.density;
      const r = Math.floor(255 * t);
      const g = Math.floor(100 * (1 - t));
      const b = Math.floor(200 * (1 - t));
      
      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 0.7)`;
      ctx.fillRect(x, z, cellSize, cellSize);
    }
    
    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  }, [heatmapData, gridSize, citySize]);

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
      <planeGeometry args={[citySize, citySize]} />
      <meshBasicMaterial map={heatmapTexture} transparent depthWrite={false} />
    </mesh>
  );
}

interface WalkModeControllerProps {
  buildings: Building[];
  gridSize: number;
  speed: number;
}

function WalkModeController({ buildings, gridSize, speed }: WalkModeControllerProps) {
  const { camera } = useThree();
  const pathPoints = useRef<THREE.Vector3[]>([]);
  const currentPathIndex = useRef(0);
  const progress = useRef(0);

  useEffect(() => {
    const points: THREE.Vector3[] = [];
    const halfSize = (gridSize * CELL_SIZE) / 2;
    const spacing = CELL_SIZE * 2;
    
    let z = -halfSize + CELL_SIZE;
    while (z < halfSize - CELL_SIZE) {
      for (let x = -halfSize + CELL_SIZE; x < halfSize - CELL_SIZE; x += spacing) {
        let tooClose = false;
        for (const b of buildings) {
          const dist = Math.sqrt((b.x - x) ** 2 + (b.z - z) ** 2);
          if (dist < CELL_SIZE * 0.8) {
            tooClose = true;
            break;
          }
        }
        if (!tooClose) {
          points.push(new THREE.Vector3(x, 1.5, z));
        }
      }
      z += spacing;
    }
    
    if (points.length < 2) {
      points.push(new THREE.Vector3(0, 1.5, -halfSize + CELL_SIZE));
      points.push(new THREE.Vector3(0, 1.5, halfSize - CELL_SIZE));
    }
    
    pathPoints.current = points;
    currentPathIndex.current = 0;
    progress.current = 0;
    
    if (points.length > 0) {
      camera.position.copy(points[0]);
      camera.lookAt(points[0].x, 1.5, points[0].z + 10);
    }
  }, [buildings, gridSize, camera]);

  useFrame((_state, delta) => {
    if (pathPoints.current.length < 2) return;
    
    const points = pathPoints.current;
    const moveSpeed = speed * delta * 0.1;
    
    progress.current += moveSpeed;
    
    while (progress.current >= 1 && currentPathIndex.current < points.length - 1) {
      progress.current -= 1;
      currentPathIndex.current++;
    }
    
    if (currentPathIndex.current >= points.length - 1) {
      currentPathIndex.current = 0;
      progress.current = 0;
    }
    
    const current = points[currentPathIndex.current];
    const next = points[Math.min(currentPathIndex.current + 1, points.length - 1)];
    
    camera.position.lerpVectors(current, next, progress.current);
    
    const lookTarget = next.clone();
    lookTarget.y = 1.5;
    camera.lookAt(lookTarget);
  });

  return null;
}

interface CameraControllerProps {
  viewPreset: ViewPreset;
  citySize: number;
}

function CameraController({ viewPreset, citySize }: CameraControllerProps) {
  const { camera } = useThree();
  const controlsRef = useRef<any>(null);
  const targetPosition = useRef(new THREE.Vector3());
  const targetTarget = useRef(new THREE.Vector3());
  const isAnimating = useRef(false);
  const animStartTime = useRef(0);
  const startPosition = useRef(new THREE.Vector3());
  const startTarget = useRef(new THREE.Vector3());

  useEffect(() => {
    if (viewPreset === 'walk') return;
    
    const dist = citySize * 1.2;
    
    switch (viewPreset) {
      case 'top45':
        targetPosition.current.set(0, dist * 0.8, dist * 0.6);
        targetTarget.current.set(0, 0, 0);
        break;
      case 'north':
        targetPosition.current.set(0, dist * 0.4, dist);
        targetTarget.current.set(0, 0, 0);
        break;
      case 'east':
        targetPosition.current.set(dist, dist * 0.4, 0);
        targetTarget.current.set(0, 0, 0);
        break;
      default:
        targetPosition.current.set(dist * 0.7, dist * 0.6, dist * 0.7);
        targetTarget.current.set(0, 0, 0);
    }
    
    startPosition.current.copy(camera.position);
    if (controlsRef.current) {
      startTarget.current.copy(controlsRef.current.target);
    }
    isAnimating.current = true;
    animStartTime.current = Date.now();
  }, [viewPreset, citySize, camera]);

  useFrame(() => {
    if (viewPreset === 'walk') return;
    
    if (isAnimating.current && controlsRef.current) {
      const elapsed = (Date.now() - animStartTime.current) / 800;
      const t = Math.min(1, elapsed);
      const eased = 1 - Math.pow(1 - t, 3);
      
      camera.position.lerpVectors(startPosition.current, targetPosition.current, eased);
      controlsRef.current.target.lerpVectors(startTarget.current, targetTarget.current, eased);
      controlsRef.current.update();
      
      if (t >= 1) {
        isAnimating.current = false;
      }
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      enableDamping
      dampingFactor={0.05}
      minDistance={10}
      maxDistance={citySize * 3}
      maxPolarAngle={Math.PI / 2 - 0.05}
      enablePan={true}
      mouseButtons={{
        LEFT: THREE.MOUSE.ROTATE,
        MIDDLE: THREE.MOUSE.DOLLY,
        RIGHT: THREE.MOUSE.PAN,
      }}
      enabled={viewPreset !== 'walk'}
    />
  );
}

interface SceneContentProps {
  params: CityParams;
  displayMode: DisplayMode;
  viewPreset: ViewPreset;
  sunAngle: number;
  walkSpeed: number;
  onBuildingSelect: (building: Building | null) => void;
  onStatsUpdate: (stats: CityStats) => void;
}

function SceneContent({
  params,
  displayMode,
  viewPreset,
  sunAngle,
  walkSpeed,
  onBuildingSelect,
  onStatsUpdate,
}: SceneContentProps) {
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [buildingHeights, setBuildingHeights] = useState<Record<string, number>>({});
  const citySize = params.gridSize * CELL_SIZE;

  useEffect(() => {
    const newBuildings = generateBuildings(params);
    setBuildings(newBuildings);
    const heights: Record<string, number> = {};
    newBuildings.forEach((b) => {
      heights[b.id] = b.height;
    });
    setBuildingHeights(heights);
  }, [params]);

  useEffect(() => {
    const stats = calculateStats(buildings, params.gridSize);
    onStatsUpdate(stats);
  }, [buildings, params.gridSize, onStatsUpdate]);

  const handleBuildingClick = useCallback((building: Building) => {
    setBuildings((prev) =>
      prev.map((b) => ({
        ...b,
        selected: b.id === building.id,
      }))
    );
  }, []);

  const handleBuildingDoubleClick = useCallback((building: Building) => {
    onBuildingSelect(building);
  }, [onBuildingSelect]);

  const ambientIntensity = displayMode === 'shadow' ? 0.3 : 0.5;
  const directionalIntensity = displayMode === 'shadow' ? 1.2 : 0.8;

  const sunDirection = useMemo(() => {
    const angleRad = (sunAngle * Math.PI) / 180;
    const height = citySize * 0.8;
    return new THREE.Vector3(
      Math.cos(angleRad) * citySize * 0.6,
      height,
      Math.sin(angleRad) * citySize * 0.6
    );
  }, [sunAngle, citySize]);

  return (
    <>
      <ambientLight intensity={ambientIntensity} />
      <directionalLight
        position={sunDirection.toArray()}
        intensity={directionalIntensity}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-left={-citySize}
        shadow-camera-right={citySize}
        shadow-camera-top={citySize}
        shadow-camera-bottom={-citySize}
      />

      <Grid
        args={[citySize, params.gridSize]}
        cellSize={CELL_SIZE}
        cellThickness={0.5}
        cellColor="#3a3a5a"
        sectionSize={CELL_SIZE * 5}
        sectionThickness={1}
        sectionColor="#4a4a6a"
        fadeDistance={citySize * 2}
        fadeStrength={1}
        followCamera={false}
        infiniteGrid={false}
      />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[citySize, citySize]} />
        <meshStandardMaterial color="#2a2a3e" />
      </mesh>

      {buildings.map((building) => (
        <BuildingMesh
          key={building.id}
          building={building}
          displayMode={displayMode}
          minHeight={params.minHeight}
          maxHeight={params.maxHeight}
          targetHeight={buildingHeights[building.id] || building.height}
          onClick={() => handleBuildingClick(building)}
          onDoubleClick={() => handleBuildingDoubleClick(building)}
        />
      ))}

      {displayMode === 'shadow' && (
        <ShadowPlane buildings={buildings} sunAngle={sunAngle} citySize={citySize} />
      )}

      {displayMode === 'heatmap' && (
        <HeatmapPlane buildings={buildings} gridSize={params.gridSize} citySize={citySize} />
      )}

      <CameraController viewPreset={viewPreset} citySize={citySize} />

      {viewPreset === 'walk' && (
        <WalkModeController
          buildings={buildings}
          gridSize={params.gridSize}
          speed={walkSpeed}
        />
      )}
    </>
  );
}

function Scene3D(props: Scene3DProps) {
  return (
    <Canvas
      shadows
      camera={{ position: [150, 120, 150], fov: 50 }}
      gl={{ antialias: true, alpha: false }}
      dpr={[1, 2]}
    >
      <color attach="background" args={['#1a1a2e']} />
      <fog attach="fog" args={['#1a1a2e', 200, 600]} />
      <SceneContent {...props} />
    </Canvas>
  );
}

export default Scene3D;
