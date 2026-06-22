import { useRef, useMemo, useEffect, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { useTerrainStore } from '../store';
import {
  updateVertexPositions,
  updateVertexColors,
  buildGeometry,
  computeSlope,
  HEIGHT_SCALE,
  GRID_SIZE,
} from '../terrain';
import {
  computeFlowPath,
  createParticles,
  advanceParticles,
} from '../water';

interface TerrainMeshProps {
  mode: 'brush' | 'water';
}

function TerrainMesh({ mode }: TerrainMeshProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const wireframeRef = useRef<THREE.LineSegments>(null);
  const { heightMap, modifyTerrain, setMouseGridInfo, brush, setWaterStart } =
    useTerrainStore();
  const [isDragging, setIsDragging] = useState(false);
  const [lastModifyTime, setLastModifyTime] = useState(0);

  const geometry = useMemo(() => {
    return buildGeometry(heightMap);
  }, []);

  useEffect(() => {
    if (meshRef.current) {
      updateVertexPositions(meshRef.current.geometry as THREE.BufferGeometry, heightMap);
      updateVertexColors(meshRef.current.geometry as THREE.BufferGeometry, heightMap);
      if (wireframeRef.current) {
        const wGeo = wireframeRef.current.geometry as THREE.BufferGeometry;
        const positions = meshRef.current.geometry.attributes.position;
        wGeo.setAttribute('position', positions.clone());
        (wGeo.attributes.position as THREE.BufferAttribute).needsUpdate = true;
      }
    }
  }, [heightMap]);

  const handlePointerDown = (e: any) => {
    e.stopPropagation();
    const point = e.point;

    if (mode === 'brush') {
      setIsDragging(true);
      modifyTerrain(point.x, point.z);
    } else if (mode === 'water') {
      setWaterStart(point.x, point.z);
    }
  };

  const handlePointerMove = (e: any) => {
    e.stopPropagation();
    const point = e.point;
    const size = heightMap.size;
    const gx = Math.round(point.x + (size - 1) / 2);
    const gz = Math.round(point.z + (size - 1) / 2);
    const clampedX = Math.max(0, Math.min(size - 1, gx));
    const clampedZ = Math.max(0, Math.min(size - 1, gz));
    const height = heightMap.heights[clampedZ][clampedX] * HEIGHT_SCALE;
    const slope = computeSlope(heightMap.heights, clampedX, clampedZ);

    setMouseGridInfo({
      gridX: clampedX,
      gridZ: clampedZ,
      height,
      slope,
    });

    if (isDragging && mode === 'brush') {
      const now = performance.now();
      if (now - lastModifyTime > 30) {
        modifyTerrain(point.x, point.z);
        setLastModifyTime(now);
      }
    }
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  const handlePointerOut = () => {
    setIsDragging(false);
    setMouseGridInfo(null);
  };

  const wireframePositions = useMemo(() => {
    const positions: number[] = [];
    const size = heightMap.size;
    for (let z = 0; z < size; z++) {
      for (let x = 0; x < size; x++) {
        const i = z * size + x;
        if (x < size - 1) {
          positions.push(i, i + 1);
        }
        if (z < size - 1) {
          positions.push(i, i + size);
        }
      }
    }
    return new Uint32Array(positions);
  }, [heightMap.size]);

  return (
    <group>
      <mesh
        ref={meshRef}
        geometry={geometry}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerOut={handlePointerOut}
      >
        <meshStandardMaterial
          vertexColors
          side={THREE.DoubleSide}
          roughness={0.8}
          metalness={0.1}
        />
      </mesh>
      <lineSegments ref={wireframeRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            array={geometry.attributes.position.array}
            count={geometry.attributes.position.count}
            itemSize={3}
          />
          <bufferAttribute
            attach="index"
            array={wireframePositions}
            count={wireframePositions.length}
            itemSize={1}
          />
        </bufferGeometry>
        <lineBasicMaterial color="#ffffff" transparent opacity={0.15} />
      </lineSegments>
    </group>
  );
}

function WaterParticles() {
  const pointsRef = useRef<THREE.Points>(null);
  const {
    heightMap,
    water,
    setPath,
    setParticles,
  } = useTerrainStore();

  useEffect(() => {
    if (water.startPoint && water.path.length === 0) {
      const path = computeFlowPath(heightMap, water.startPoint.x, water.startPoint.z);
      setPath(path);
      const particles = createParticles(path, 30);
      setParticles(particles);
    }
  }, [water.startPoint]);

  useEffect(() => {
    if (water.startPoint && water.path.length > 0) {
      const path = computeFlowPath(heightMap, water.startPoint.x, water.startPoint.z);
      setPath(path);
    }
  }, [heightMap]);

  useFrame((_, delta) => {
    if (!water.isRunning || water.path.length < 2) return;

    const newParticles = advanceParticles(
      water.particles,
      water.path,
      heightMap.heights,
      delta,
      HEIGHT_SCALE,
      GRID_SIZE
    );
    setParticles(newParticles);

    if (pointsRef.current && newParticles.length > 0) {
      const positions = new Float32Array(newParticles.length * 3);
      newParticles.forEach((p, i) => {
        positions[i * 3] = p.position.x;
        positions[i * 3 + 1] = p.position.y;
        positions[i * 3 + 2] = p.position.z;
      });
      const posAttr = pointsRef.current.geometry.attributes.position as THREE.BufferAttribute;
      posAttr.array = positions;
      posAttr.needsUpdate = true;
    }
  });

  const particleGeometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(30 * 3);
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return geo;
  }, []);

  if (water.particles.length === 0) return null;

  return (
    <points ref={pointsRef} geometry={particleGeometry}>
      <pointsMaterial
        size={0.2}
        color="#4fc3f7"
        transparent
        opacity={0.8}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

function WaterStartMarker() {
  const { water, heightMap } = useTerrainStore();
  const markerRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (markerRef.current) {
      const scale = 1 + Math.sin(state.clock.elapsedTime * 3) * 0.15;
      markerRef.current.scale.setScalar(scale);
    }
  });

  if (!water.startPoint) return null;

  const center = (heightMap.size - 1) / 2;
  const x = water.startPoint.x - center;
  const z = water.startPoint.z - center;

  const gx = Math.max(0, Math.min(heightMap.size - 1, Math.round(water.startPoint.x)));
  const gz = Math.max(0, Math.min(heightMap.size - 1, Math.round(water.startPoint.z)));
  const h = heightMap.heights[gz][gx] * HEIGHT_SCALE;

  return (
    <mesh ref={markerRef} position={[x, h + 0.05, z]} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[0.3, 0.5, 32]} />
      <meshBasicMaterial color="#4fc3f7" transparent opacity={0.9} side={THREE.DoubleSide} />
    </mesh>
  );
}

function AnimationUpdater() {
  const { updateAnimation, isTerrainAnimating, updateBrushAnimation } = useTerrainStore();

  useFrame((_, delta) => {
    if (isTerrainAnimating) {
      updateAnimation(performance.now());
    }
    updateBrushAnimation(delta);
  });

  return null;
}

function SceneFog() {
  const { scene } = useThree();

  useEffect(() => {
    scene.fog = new THREE.Fog('#1a1a2e', 25, 55);
    return () => {
      scene.fog = null;
    };
  }, [scene]);

  return null;
}

interface Scene3DProps {
  mode: 'brush' | 'water';
}

export default function Scene3D({ mode }: Scene3DProps) {
  return (
    <Canvas
      camera={{ position: [0, 18, 22], fov: 50 }}
      shadows
      gl={{ antialias: true }}
    >
      <color attach="background" args={['#1a1a2e']} />
      <SceneFog />

      <ambientLight intensity={0.45} />
      <directionalLight
        position={[10, 20, 10]}
        intensity={1.2}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <directionalLight position={[-10, 8, -10]} intensity={0.3} color="#7c4dff" />

      <TerrainMesh mode={mode} />
      <WaterParticles />
      <WaterStartMarker />
      <AnimationUpdater />

      <OrbitControls
        enableDamping
        dampingFactor={0.05}
        minDistance={8}
        maxDistance={50}
        maxPolarAngle={Math.PI / 2 - 0.1}
      />
    </Canvas>
  );
}
