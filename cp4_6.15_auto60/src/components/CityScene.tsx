import { useRef, useMemo, useEffect, useState, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import * as THREE from 'three';
import {
  createParticles,
  updateParticles,
  getParticleData,
  getPopulationDistribution,
  TRAIL_LENGTH,
  type Particle,
  type ZoneType,
} from '@/utils/particleSystem';
import { generateBuildings, createGroundTexture, FLOOR_HEIGHT, type BuildingData } from '@/utils/cityData';

interface CitySceneProps {
  timeHour: number;
  onPopulationChange?: (distribution: Record<ZoneType, number>) => void;
  onFpsUpdate?: (fps: number) => void;
  particleCount?: number;
}

function Buildings({ buildings }: { buildings: BuildingData[] }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const edgesGroupRef = useRef<THREE.Group>(null);
  const { camera } = useThree();
  const [edgeOpacity, setEdgeOpacity] = useState(0.25);

  useFrame(() => {
    if (camera && edgesGroupRef.current) {
      const target = new THREE.Vector3(0, 0, 0);
      camera.getWorldDirection(target);
      const angle = Math.abs(target.y);
      const newOpacity = 0.15 + angle * 0.5;
      setEdgeOpacity(newOpacity);
      edgesGroupRef.current.children.forEach((child) => {
        if (child instanceof THREE.LineSegments) {
          (child.material as THREE.LineBasicMaterial).opacity = newOpacity;
        }
      });
    }
  });

  const dummy = useMemo(() => new THREE.Object3D(), []);

  const edgeData = useMemo(() => {
    const positions: number[] = [];
    const colors: number[] = [];
    const edgeGeo = new THREE.EdgesGeometry(new THREE.BoxGeometry(1, 1, 1));
    const edgePositions = edgeGeo.attributes.position.array as Float32Array;

    buildings.forEach((building) => {
      const hx = building.size.x / 2;
      const hy = building.size.y / 2;
      const hz = building.size.z / 2;

      for (let i = 0; i < edgePositions.length; i += 3) {
        positions.push(
          edgePositions[i] * building.size.x + building.position.x,
          edgePositions[i + 1] * building.size.y + building.position.y,
          edgePositions[i + 2] * building.size.z + building.position.z
        );
        colors.push(0.29, 0.78, 1.0);
      }
    });

    return {
      positions: new Float32Array(positions),
      colors: new Float32Array(colors),
    };
  }, [buildings]);

  useEffect(() => {
    if (!meshRef.current) return;

    buildings.forEach((building, i) => {
      dummy.position.copy(building.position);
      dummy.scale.set(building.size.x, building.size.y, building.size.z);
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  }, [buildings, dummy]);

  return (
    <group>
      <instancedMesh ref={meshRef} args={[undefined, undefined, buildings.length]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial
          color="#9a9aaa"
          metalness={0.08}
          roughness={0.85}
          transparent
          opacity={0.85}
        />
      </instancedMesh>

      <group ref={edgesGroupRef}>
        <lineSegments>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={edgeData.positions.length / 3}
              array={edgeData.positions}
              itemSize={3}
            />
            <bufferAttribute
              attach="attributes-color"
              count={edgeData.colors.length / 3}
              array={edgeData.colors}
              itemSize={3}
            />
          </bufferGeometry>
          <lineBasicMaterial
            vertexColors
            transparent
            opacity={edgeOpacity}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </lineSegments>
      </group>
    </group>
  );
}

function Ground() {
  const texture = useMemo(() => createGroundTexture(), []);

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
      <planeGeometry args={[110, 110, 1, 1]} />
      <meshStandardMaterial
        map={texture}
        color="#2a2a3a"
        metalness={0.05}
        roughness={0.9}
      />
    </mesh>
  );
}

interface ParticleSystemProps {
  timeHour: number;
  onPopulationChange?: (distribution: Record<ZoneType, number>) => void;
  onFpsUpdate?: (fps: number) => void;
  initialCount?: number;
}

function ParticleSystem({
  timeHour,
  onPopulationChange,
  onFpsUpdate,
  initialCount = 800,
}: ParticleSystemProps) {
  const pointsRef = useRef<THREE.Points>(null);
  const trailsRef = useRef<THREE.LineSegments>(null);
  const particlesRef = useRef<Particle[]>([]);
  const frameCountRef = useRef(0);
  const lastFpsUpdateRef = useRef(performance.now());
  const currentCountRef = useRef(initialCount);
  const lowFpsFramesRef = useRef(0);

  const [particleCount, setParticleCount] = useState(initialCount);

  useEffect(() => {
    particlesRef.current = createParticles(initialCount);
    currentCountRef.current = initialCount;
  }, [initialCount]);

  useFrame((_, delta) => {
    if (!pointsRef.current || !trailsRef.current) return;
    if (particlesRef.current.length === 0) return;

    const particles = particlesRef.current;
    updateParticles(particles, timeHour, delta * 2);

    const data = getParticleData(particles.slice(0, currentCountRef.current));

    const positionsAttr = pointsRef.current.geometry.attributes.position as THREE.BufferAttribute;
    const colorsAttr = pointsRef.current.geometry.attributes.color as THREE.BufferAttribute;
    positionsAttr.array.set(data.positions);
    colorsAttr.array.set(data.colors);
    positionsAttr.needsUpdate = true;
    colorsAttr.needsUpdate = true;

    const trailPosAttr = trailsRef.current.geometry.attributes.position as THREE.BufferAttribute;
    const trailColAttr = trailsRef.current.geometry.attributes.color as THREE.BufferAttribute;
    trailPosAttr.array.set(data.trailPositions);
    trailColAttr.array.set(data.trailColors);
    trailPosAttr.needsUpdate = true;
    trailColAttr.needsUpdate = true;

    if (onPopulationChange) {
      const distribution = getPopulationDistribution(particles.slice(0, currentCountRef.current));
      onPopulationChange(distribution);
    }

    frameCountRef.current++;
    const now = performance.now();
    if (now - lastFpsUpdateRef.current >= 1000) {
      const fps = (frameCountRef.current * 1000) / (now - lastFpsUpdateRef.current);
      onFpsUpdate?.(fps);

      if (fps < 28 && currentCountRef.current > 400) {
        lowFpsFramesRef.current++;
        if (lowFpsFramesRef.current >= 3) {
          const newCount = Math.max(400, currentCountRef.current - 100);
          currentCountRef.current = newCount;
          setParticleCount(newCount);
          lowFpsFramesRef.current = 0;
        }
      } else if (fps > 55 && currentCountRef.current < initialCount) {
        const newCount = Math.min(initialCount, currentCountRef.current + 50);
        currentCountRef.current = newCount;
        setParticleCount(newCount);
      } else {
        lowFpsFramesRef.current = 0;
      }

      frameCountRef.current = 0;
      lastFpsUpdateRef.current = now;
    }
  });

  const trailSegmentsPerParticle = TRAIL_LENGTH - 1;
  const totalTrailPoints = particleCount * trailSegmentsPerParticle * 2;

  return (
    <group>
      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={particleCount}
            array={new Float32Array(particleCount * 3)}
            itemSize={3}
          />
          <bufferAttribute
            attach="attributes-color"
            count={particleCount}
            array={new Float32Array(particleCount * 3)}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.7}
          vertexColors
          transparent
          opacity={0.95}
          sizeAttenuation
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>

      <lineSegments ref={trailsRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={totalTrailPoints}
            array={new Float32Array(totalTrailPoints * 3)}
            itemSize={3}
          />
          <bufferAttribute
            attach="attributes-color"
            count={totalTrailPoints}
            array={new Float32Array(totalTrailPoints * 3)}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial
          vertexColors
          transparent
          opacity={0.55}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </lineSegments>
    </group>
  );
}

function SceneLighting() {
  return (
    <>
      <ambientLight intensity={0.35} color="#a0a0c0" />
      <directionalLight
        position={[30, 50, 20]}
        intensity={0.7}
        color="#e0e8ff"
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <hemisphereLight
        args={['#4a5580', '#1a1a2a', 0.4]}
      />
      <pointLight position={[0, 30, 0]} intensity={0.3} color="#4ac7ff" distance={80} />
    </>
  );
}

export default function CityScene({
  timeHour,
  onPopulationChange,
  onFpsUpdate,
  particleCount = 800,
}: CitySceneProps) {
  const buildings = useMemo(() => generateBuildings(), []);

  const handlePopulationChange = useCallback(
    (dist: Record<ZoneType, number>) => {
      onPopulationChange?.(dist);
    },
    [onPopulationChange]
  );

  return (
    <Canvas
      shadows
      camera={{ position: [45, 35, 45], fov: 55, near: 0.1, far: 500 }}
      gl={{ antialias: true, alpha: false }}
      onCreated={({ gl, scene }) => {
        gl.setClearColor('#1a1a2a');
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.2;
        scene.fog = new THREE.Fog('#1a1a2a', 100, 220);
      }}
    >
      <SceneLighting />
      <Ground />
      <Buildings buildings={buildings} />
      <ParticleSystem
        timeHour={timeHour}
        onPopulationChange={handlePopulationChange}
        onFpsUpdate={onFpsUpdate}
        initialCount={particleCount}
      />
      <Stars radius={200} depth={50} count={1500} factor={4} saturation={0} fade speed={0.5} />
      <OrbitControls
        enablePan={false}
        enableDamping
        dampingFactor={0.08}
        minDistance={30}
        maxDistance={150}
        minPolarAngle={0.2}
        maxPolarAngle={Math.PI / 2.1}
        target={[0, 5, 0]}
      />
    </Canvas>
  );
}
