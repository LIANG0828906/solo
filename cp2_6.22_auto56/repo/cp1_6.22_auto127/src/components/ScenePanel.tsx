import { useRef, useMemo, useEffect, useState, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import {
  TerrainData,
  TerrainGeometryData,
  processTerrainData,
  updateColorsByYear,
  interpolateColors
} from '../utils/dataLoader';
import { GridPoint } from '../utils/dataLoader';

interface ScenePanelProps {
  terrainData: TerrainData;
  year: number;
  yearIndex: number;
  viewPreset: string;
  onPointClick: (point: GridPoint | null) => void;
}

function TerrainMesh({
  terrainData,
  yearIndex,
  onPointClick,
  highlightIndex
}: {
  terrainData: TerrainData;
  yearIndex: number;
  onPointClick: (point: GridPoint | null) => void;
  highlightIndex: number | null;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const geometryData = useMemo<TerrainGeometryData>(() => processTerrainData(terrainData), [terrainData]);
  
  const colorsTarget = useRef<Float32Array | null>(null);
  const colorsPrev = useRef<Float32Array | null>(null);
  const transitionStart = useRef<number>(0);
  const isTransitioning = useRef<boolean>(false);
  const transitionDuration = 500;
  const colorBuffer = useRef<Float32Array | null>(null);

  const basePositions = useRef<Float32Array | null>(null);
  const initialized = useRef<boolean>(false);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const initialColors = updateColorsByYear(terrainData, geometryData, yearIndex);
    
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(geometryData.positions), 3));
    geo.setAttribute('color', new THREE.BufferAttribute(initialColors, 3));
    geo.setAttribute('normal', new THREE.BufferAttribute(geometryData.normals, 3));
    geo.setAttribute('uv', new THREE.BufferAttribute(geometryData.uvs, 2));
    geo.setIndex(new THREE.BufferAttribute(geometryData.indices, 1));
    
    colorsTarget.current = initialColors;
    colorsPrev.current = initialColors;
    colorBuffer.current = new Float32Array(initialColors);
    basePositions.current = new Float32Array(geometryData.positions);
    initialized.current = true;
    
    return geo;
  }, [geometryData, terrainData]);

  useEffect(() => {
    if (!initialized.current || !meshRef.current) return;
    
    const newColors = updateColorsByYear(terrainData, geometryData, yearIndex);
    
    if (colorBuffer.current) {
      colorsPrev.current = new Float32Array(colorBuffer.current);
    } else {
      colorsPrev.current = newColors;
    }
    
    colorsTarget.current = newColors;
    transitionStart.current = performance.now();
    isTransitioning.current = true;
  }, [yearIndex, terrainData, geometryData]);

  useEffect(() => {
    if (!meshRef.current || !basePositions.current) return;
    
    const positions = (meshRef.current.geometry.getAttribute('position') as THREE.BufferAttribute).array as Float32Array;
    
    for (let i = 0; i < geometryData.pointCount; i++) {
      positions[i * 3 + 1] = basePositions.current[i * 3 + 1];
    }
    
    if (highlightIndex !== null) {
      positions[highlightIndex * 3 + 1] += 0.1;
    }
    
    (meshRef.current.geometry.getAttribute('position') as THREE.BufferAttribute).needsUpdate = true;
  }, [highlightIndex, geometryData.pointCount]);

  useFrame(() => {
    if (!meshRef.current || !colorsTarget.current || !colorsPrev.current || !colorBuffer.current) return;
    
    if (isTransitioning.current) {
      const colorsAttr = meshRef.current.geometry.getAttribute('color') as THREE.BufferAttribute;
      const elapsed = performance.now() - transitionStart.current;
      const t = Math.min(elapsed / transitionDuration, 1);
      const easeT = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      
      const interpolated = interpolateColors(colorsPrev.current, colorsTarget.current, easeT);
      colorBuffer.current.set(interpolated);
      (colorsAttr.array as Float32Array).set(interpolated);
      colorsAttr.needsUpdate = true;
      
      if (t >= 1) {
        isTransitioning.current = false;
      }
    }
  });

  const handleClick = useCallback((event: any) => {
    event.stopPropagation();
    
    const { point } = event;
    const { points, gridSize } = terrainData;
    
    const halfSize = (gridSize - 1) / 2;
    const gridX = Math.round(point.x + halfSize);
    const gridZ = Math.round(point.z + halfSize);
    
    if (gridX >= 0 && gridX < gridSize && gridZ >= 0 && gridZ < gridSize) {
      const index = gridZ * gridSize + gridX;
      const pointData = points[index];
      
      if (pointData) {
        onPointClick(pointData);
      }
    }
  }, [terrainData, onPointClick]);

  return (
    <mesh ref={meshRef} geometry={geometry} onClick={handleClick}>
      <meshPhongMaterial
        vertexColors
        shininess={10}
        side={THREE.DoubleSide}
        flatShading={false}
      />
    </mesh>
  );
}

function HighlightMarker({
  terrainData,
  highlightIndex
}: {
  terrainData: TerrainData;
  highlightIndex: number | null;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useEffect(() => {
    if (!meshRef.current || highlightIndex === null) return;
    
    const { gridSize } = terrainData;
    const halfSize = (gridSize - 1) / 2;
    const xi = highlightIndex % gridSize;
    const zi = Math.floor(highlightIndex / gridSize);
    const x = xi - halfSize;
    const z = zi - halfSize;
    const y = terrainData.points[highlightIndex].height + 0.25;
    
    meshRef.current.position.set(x, y, z);
  }, [highlightIndex, terrainData]);

  useFrame(({ clock }) => {
    if (meshRef.current && highlightIndex !== null) {
      const elapsed = clock.getElapsedTime();
      const scale = 1 + Math.sin(elapsed * 5) * 0.15;
      meshRef.current.scale.setScalar(scale);
    }
  });

  if (highlightIndex === null) return null;

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[0.2, 16, 16]} />
      <meshBasicMaterial color="#ffff00" transparent opacity={0.9} />
    </mesh>
  );
}

function CameraController({
  viewPreset
}: {
  viewPreset: string;
}) {
  const { camera } = useThree();
  
  const targetPos = useRef(new THREE.Vector3());
  const startPos = useRef(new THREE.Vector3());
  const isAnimating = useRef(false);
  const animStart = useRef(0);
  const animDuration = 800;

  useEffect(() => {
    if (!camera || viewPreset === 'default') return;
    
    startPos.current.copy(camera.position);
    
    let targetPosition: THREE.Vector3;
    
    switch (viewPreset) {
      case 'overhead':
        targetPosition = new THREE.Vector3(0, 25, 0.01);
        break;
      case 'southeast':
        targetPosition = new THREE.Vector3(15, 15, 15);
        break;
      case 'front':
        targetPosition = new THREE.Vector3(0, 10, 20);
        break;
      default:
        return;
    }
    
    targetPos.current.copy(targetPosition);
    isAnimating.current = true;
    animStart.current = performance.now();
  }, [viewPreset, camera]);

  useFrame(() => {
    if (!isAnimating.current || !camera) return;
    
    const elapsed = performance.now() - animStart.current;
    const t = Math.min(elapsed / animDuration, 1);
    
    const easeT = 1 - Math.pow(1 - t, 3);
    
    camera.position.lerpVectors(startPos.current, targetPos.current, easeT);
    camera.lookAt(0, 2, 0);
    
    if (t >= 1) {
      isAnimating.current = false;
    }
  });

  return null;
}

function SceneContent({
  terrainData,
  yearIndex,
  onPointClick,
  viewPreset
}: {
  terrainData: TerrainData;
  yearIndex: number;
  onPointClick: (point: GridPoint | null) => void;
  viewPreset: string;
}) {
  const [highlightIndex, setHighlightIndex] = useState<number | null>(null);

  const handlePointClick = useCallback((point: GridPoint | null) => {
    onPointClick(point);
    if (point) {
      setHighlightIndex(point.id);
    }
  }, [onPointClick]);

  useEffect(() => {
    if (highlightIndex !== null) {
      const timer = setTimeout(() => {
        setHighlightIndex(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [highlightIndex]);

  return (
    <>
      <CameraController viewPreset={viewPreset} />
      
      <ambientLight intensity={0.6} />
      <directionalLight position={[10, 20, 10]} intensity={1.2} />
      <directionalLight position={[-10, 15, -10]} intensity={0.5} color="#a0a0ff" />
      <hemisphereLight args={['#87CEEB', '#362d56', 0.4]} />
      
      <TerrainMesh
        terrainData={terrainData}
        yearIndex={yearIndex}
        onPointClick={handlePointClick}
        highlightIndex={highlightIndex}
      />
      
      <HighlightMarker
        terrainData={terrainData}
        highlightIndex={highlightIndex}
      />
      
      <gridHelper args={[20, 20, '#444466', '#333355']} position={[0, 0, 0]} />
      
      <OrbitControls
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={5}
        maxDistance={30}
        minPolarAngle={Math.PI / 6}
        maxPolarAngle={Math.PI / 2.2}
        target={[0, 2, 0]}
      />
    </>
  );
}

function ScenePanel({
  terrainData,
  year,
  yearIndex,
  viewPreset,
  onPointClick
}: ScenePanelProps) {
  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <Canvas
        camera={{ position: [0, 12, 18], fov: 50 }}
        style={{ background: 'linear-gradient(to bottom, #1A1A2E, #2D2D44)' }}
      >
        <SceneContent
          terrainData={terrainData}
          yearIndex={yearIndex}
          onPointClick={onPointClick}
          viewPreset={viewPreset}
        />
      </Canvas>
      
      <div style={{
        position: 'absolute',
        top: '20px',
        left: '20px',
        color: '#E0E0E0',
        fontSize: '14px',
        background: 'rgba(45, 45, 68, 0.8)',
        padding: '10px 16px',
        borderRadius: '8px',
        backdropFilter: 'blur(8px)'
      }}>
        <div style={{ fontWeight: 600, marginBottom: '4px' }}>人口密度热力图</div>
        <div style={{ fontSize: '11px', opacity: 0.7 }}>拖拽旋转 · 滚轮缩放 · 点击查看详情</div>
      </div>
      
      <div style={{
        position: 'absolute',
        bottom: '20px',
        left: '20px',
        color: 'rgba(224, 224, 224, 0.5)',
        fontSize: '11px'
      }}>
        数据年份: <span style={{ color: '#4A90D9', fontWeight: 600 }}>{year}</span>
      </div>
    </div>
  );
}

export default ScenePanel;
