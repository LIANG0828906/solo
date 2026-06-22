import React, { useMemo, useRef, useEffect } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { useTerrainStore, DATA_SOURCES } from '../store/useTerrainStore';
import {
  GRID_SIZE,
  TERRAIN_SIZE,
  generateHeightData,
  generateHeatmapData,
  elevationToColor,
  valueToColor,
} from '../utils/heatmapData';
import HeatmapOverlay from './HeatmapOverlay';

interface TerrainMeshProps {
  elevation: number;
  scale: number;
}

const TerrainMesh: React.FC<TerrainMeshProps> = React.memo(({ elevation, scale }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const wireframeRef = useRef<THREE.Mesh>(null);

  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(TERRAIN_SIZE, TERRAIN_SIZE, GRID_SIZE - 1, GRID_SIZE - 1);
    geo.rotateX(-Math.PI / 2);
    const h = generateHeightData(GRID_SIZE, elevation);
    const positions = geo.attributes.position;
    const colors = new Float32Array(positions.count * 3);

    for (let i = 0; i < positions.count; i++) {
      const y = h[i];
      positions.setY(i, y);
      const t = y / Math.max(elevation, 0.001);
      const c = elevationToColor(t);
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }

    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.computeVertexNormals();
    return geo;
  }, [elevation]);

  useEffect(() => {
    if (meshRef.current) {
      meshRef.current.scale.setScalar(scale);
    }
    if (wireframeRef.current) {
      wireframeRef.current.scale.setScalar(scale);
    }
  }, [scale]);

  return (
    <group>
      <mesh ref={meshRef} geometry={geometry} receiveShadow castShadow>
        <meshStandardMaterial
          vertexColors
          side={THREE.DoubleSide}
          roughness={0.9}
          metalness={0.05}
        />
      </mesh>

      <mesh ref={wireframeRef} geometry={geometry} position={[0, 0.01, 0]}>
        <meshBasicMaterial
          color="#555577"
          wireframe
          transparent
          opacity={0.15}
        />
      </mesh>
    </group>
  );
});

TerrainMesh.displayName = 'TerrainMesh';

const ContourLines: React.FC<{ elevation: number; scale: number; visible: boolean }> = ({
  elevation,
  scale,
  visible,
}) => {
  const contours = useMemo(() => {
    const group = new THREE.Group();
    if (!visible) return group;

    const heights = generateHeightData(GRID_SIZE, elevation);
    const halfSize = TERRAIN_SIZE / 2;
    const numContours = 5;

    for (let c = 1; c <= numContours; c++) {
      const targetHeight = (c / (numContours + 1)) * elevation;
      const points: THREE.Vector3[] = [];

      for (let y = 0; y < GRID_SIZE - 1; y++) {
        for (let x = 0; x < GRID_SIZE - 1; x++) {
          const p00 = heights[y * GRID_SIZE + x];
          const p10 = heights[y * GRID_SIZE + x + 1];
          const p01 = heights[(y + 1) * GRID_SIZE + x];
          const p11 = heights[(y + 1) * GRID_SIZE + x + 1];

          const x0 = (x / (GRID_SIZE - 1)) * TERRAIN_SIZE - halfSize;
          const x1 = ((x + 1) / (GRID_SIZE - 1)) * TERRAIN_SIZE - halfSize;
          const y0 = (y / (GRID_SIZE - 1)) * TERRAIN_SIZE - halfSize;
          const y1 = ((y + 1) / (GRID_SIZE - 1)) * TERRAIN_SIZE - halfSize;

          const edges: Array<[number, number, number, number, number, number]> = [
            [x0, y0, p00, x1, y0, p10],
            [x1, y0, p10, x1, y1, p11],
            [x0, y1, p01, x1, y1, p11],
            [x0, y0, p00, x0, y1, p01],
          ];

          for (const [ax, ay, ah, bx, by, bh] of edges) {
            if ((ah - targetHeight) * (bh - targetHeight) < 0) {
              const t = (targetHeight - ah) / (bh - ah);
              points.push(
                new THREE.Vector3(
                  ax + (bx - ax) * t,
                  targetHeight + 0.08,
                  ay + (by - ay) * t,
                ),
              );
            }
          }
        }
      }

      if (points.length > 1) {
        const geo = new THREE.BufferGeometry().setFromPoints(points);
        const mat = new THREE.LineBasicMaterial({
          color: 0x444444,
          transparent: true,
          opacity: 0.8,
        });
        const line = new THREE.Line(geo, mat);
        group.add(line);
      }
    }

    return group;
  }, [elevation, visible]);

  return <primitive object={contours} scale={[scale, scale, scale]} />;
};

interface AutoRotateCameraProps {
  autoRotate: boolean;
}

const AutoRotateCamera: React.FC<AutoRotateCameraProps> = ({ autoRotate }) => {
  const { camera } = useThree();
  const controlsRef = useRef<any>(null);
  const angleRef = useRef(0);

  useEffect(() => {
    if (autoRotate) {
      const v = camera.position.clone();
      angleRef.current = Math.atan2(v.z, v.x);
    }
  }, [autoRotate, camera]);

  useFrame((_, delta) => {
    if (!autoRotate) return;

    const period = 30;
    const radius = 25;
    const height = 15;

    angleRef.current += (delta / period) * Math.PI * 2;

    camera.position.x = Math.cos(angleRef.current) * radius;
    camera.position.z = Math.sin(angleRef.current) * radius;
    camera.position.y = height;
    camera.lookAt(0, 0, 0);

    if (controlsRef.current) {
      controlsRef.current.target.set(0, 0, 0);
      controlsRef.current.update();
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      enableDamping
      dampingFactor={0.08}
      minDistance={8}
      maxDistance={60}
      maxPolarAngle={Math.PI / 2.1}
      enabled={!autoRotate}
      target={[0, 0, 0]}
    />
  );
};

const TerrainScene: React.FC = () => {
  const elevation = useTerrainStore((s) => s.elevation);
  const scale = useTerrainStore((s) => s.scale);
  const dataSourceIndex = useTerrainStore((s) => s.dataSourceIndex);
  const heatmapOpacity = useTerrainStore((s) => s.heatmapOpacity);
  const showContour = useTerrainStore((s) => s.showContour);
  const autoRotate = useTerrainStore((s) => s.autoRotate);

  const source = DATA_SOURCES[dataSourceIndex];

  const heatmapData = useMemo(() => {
    const heights = generateHeightData(GRID_SIZE, elevation);
    return generateHeatmapData(GRID_SIZE, source.key, heights);
  }, [elevation, source.key]);

  return (
    <Canvas shadows dpr={[1, 2]} gl={{ antialias: true, powerPreference: 'high-performance' }}>
      <PerspectiveCamera makeDefault position={[18, 14, 18]} fov={50} />
      <AutoRotateCamera autoRotate={autoRotate} />

      <color attach="background" args={['#1A1A2E']} />
      <fog attach="fog" args={['#1A1A2E', 40, 80]} />

      <ambientLight intensity={0.45} />
      <directionalLight
        position={[15, 25, 10]}
        intensity={1.1}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-near={0.5}
        shadow-camera-far={100}
        shadow-camera-left={-25}
        shadow-camera-right={25}
        shadow-camera-top={25}
        shadow-camera-bottom={-25}
      />
      <directionalLight position={[-10, 8, -10]} intensity={0.3} color="#88aaff" />

      <TerrainMesh elevation={elevation} scale={scale} />
      <HeatmapOverlay
        elevation={elevation}
        scale={scale}
        heatmapData={heatmapData}
        opacity={heatmapOpacity}
      />
      <ContourLines elevation={elevation} scale={scale} visible={showContour} />
    </Canvas>
  );
};

export default TerrainScene;
