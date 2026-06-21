import * as React from 'react';
const { useRef, useMemo, useEffect, useState, useCallback } = React;
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { LandformType, GRID_SIZE, TERRAIN_SIZE, COLOR_MAPS } from '../types';

interface TerrainMeshProps {
  heightMap: number[][];
  landform: LandformType;
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

const TerrainMesh: React.FC<TerrainMeshProps> = ({ heightMap, landform }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const geometryRef = useRef<THREE.PlaneGeometry>(null);

  const { geometry } = useMemo(() => {
    const geo = new THREE.PlaneGeometry(TERRAIN_SIZE, TERRAIN_SIZE, GRID_SIZE - 1, GRID_SIZE - 1);
    geo.rotateX(-Math.PI / 2);

    const positions = geo.attributes.position;
    const colors = new Float32Array(positions.count * 3);

    let minHeight = Infinity;
    let maxHeight = -Infinity;

    for (let i = 0; i < GRID_SIZE; i++) {
      for (let j = 0; j < GRID_SIZE; j++) {
        const idx = i * GRID_SIZE + j;
        const h = heightMap[i][j];
        positions.setY(idx, h);
        if (h < minHeight) minHeight = h;
        if (h > maxHeight) maxHeight = h;
      }
    }

    for (let i = 0; i < GRID_SIZE; i++) {
      for (let j = 0; j < GRID_SIZE; j++) {
        const idx = i * GRID_SIZE + j;
        const h = heightMap[i][j];
        const color = getColorForHeight(h, minHeight, maxHeight, landform);
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

    let minHeight = Infinity;
    let maxHeight = -Infinity;

    for (let i = 0; i < GRID_SIZE; i++) {
      for (let j = 0; j < GRID_SIZE; j++) {
        const idx = i * GRID_SIZE + j;
        const h = heightMap[i][j];
        positions.setY(idx, h);
        if (h < minHeight) minHeight = h;
        if (h > maxHeight) maxHeight = h;
      }
    }

    for (let i = 0; i < GRID_SIZE; i++) {
      for (let j = 0; j < GRID_SIZE; j++) {
        const idx = i * GRID_SIZE + j;
        const h = heightMap[i][j];
        const color = getColorForHeight(h, minHeight, maxHeight, landform);
        colors.setXYZ(idx, color.r, color.g, color.b);
      }
    }

    positions.needsUpdate = true;
    colors.needsUpdate = true;
    geometryRef.current.computeVertexNormals();
  }, [heightMap, landform]);

  return (
    <mesh ref={meshRef} geometry={geometry} receiveShadow castShadow>
      <meshStandardMaterial
        vertexColors
        side={THREE.DoubleSide}
        flatShading={false}
        roughness={0.85}
        metalness={0.05}
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
}

const TerrainRenderer: React.FC<TerrainRendererProps> = ({ heightMap, landform }) => {
  const [compassRotation, setCompassRotation] = useState(0);
  const compassRef = useRef<HTMLDivElement>(null);

  const handleRotationChange = useCallback((rotation: number) => {
    setCompassRotation(rotation);
  }, []);

  useEffect(() => {
    if (compassRef.current) {
      compassRef.current.style.transform = `rotate(${-compassRotation}deg)`;
    }
  }, [compassRotation]);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <Canvas
        shadows={false}
        camera={{ position: [14, 12, 14], fov: 50, near: 0.1, far: 200 }}
        gl={{ antialias: true, alpha: false }}
        style={{ background: '#252545' }}
      >
        <color attach="background" args={['#252545']} />
        <fog attach="fog" args={['#252545', 50, 100]} />

        <ambientLight intensity={0.6} color="#ffffff" />
        <directionalLight
          position={[15, 25, 10]}
          intensity={1.4}
        />
        <directionalLight position={[-10, 8, -8]} intensity={0.4} color="#a8b0ff" />
        <hemisphereLight args={['#ffffff', '#444466', 0.5]} />

        <TerrainMesh heightMap={heightMap} landform={landform} />
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
