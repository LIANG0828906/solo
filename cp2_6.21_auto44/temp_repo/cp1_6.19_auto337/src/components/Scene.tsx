import { useRef, useMemo, useEffect, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { useStore } from '@/store';
import Turbine from './Turbine';
import Particles from './Particles';
import { generateHeightMap, calculateWake } from '@/simulator';
import type { WakeCone } from '@/simulator';

function Terrain({ amplitude }: { amplitude: number }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const size = 200;
  const segments = 100;

  const { geometry, colors } = useMemo(() => {
    const geo = new THREE.PlaneGeometry(size, size, segments, segments);
    geo.rotateX(-Math.PI / 2);

    const heightMap = generateHeightMap(segments + 1, amplitude);
    const positions = geo.attributes.position;
    const colorArray = new Float32Array((segments + 1) * (segments + 1) * 3);

    const colorLow = new THREE.Color('#4caf50');
    const colorHigh = new THREE.Color('#8bc34a');

    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      const z = positions.getZ(i);
      const gx = Math.floor(((x + size / 2) / size) * segments);
      const gz = Math.floor(((z + size / 2) / size) * segments);
      const height = heightMap[gz]?.[gx] || 0;
      positions.setY(i, height);

      const heightRatio = Math.min(1, height / amplitude);
      const color = colorLow.clone().lerp(colorHigh, heightRatio);
      colorArray[i * 3] = color.r;
      colorArray[i * 3 + 1] = color.g;
      colorArray[i * 3 + 2] = color.b;
    }

    geo.setAttribute('color', new THREE.BufferAttribute(colorArray, 3));
    geo.computeVertexNormals();

    return { geometry: geo, colors: colorArray };
  }, [amplitude]);

  return (
    <mesh ref={meshRef} geometry={geometry} receiveShadow>
      <meshStandardMaterial vertexColors side={THREE.DoubleSide} />
    </mesh>
  );
}

function WakeCones({ heightMap }: { heightMap: number[][] }) {
  const turbines = useStore((state) => state.turbines);
  const [wakeCones, setWakeCones] = useState<WakeCone[]>([]);

  useEffect(() => {
    const timer = setTimeout(() => {
      const cones = calculateWake(turbines);
      setWakeCones(cones);
    }, 100);
    return () => clearTimeout(timer);
  }, [turbines]);

  return (
    <group>
      {wakeCones.map((cone, index) => (
        <mesh
          key={index}
          position={[
            cone.position[0] + cone.length / 2,
            cone.position[1] + cone.height / 2,
            cone.position[2],
          ]}
          rotation={[0, 0, -Math.PI / 2]}
        >
          <coneGeometry args={[cone.radius, cone.length, 16, 1, true]} />
          <meshBasicMaterial
            color="#ff9800"
            transparent
            opacity={0.3}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
    </group>
  );
}

function SuggestionMarkers() {
  const suggestions = useStore((state) => state.suggestions);
  const meshRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.children.forEach((child, i) => {
        const scale = 1 + Math.sin(Date.now() * 0.003 + i) * 0.3;
        child.scale.setScalar(scale);
      });
    }
  });

  return (
    <group ref={meshRef}>
      {suggestions.map((pos, index) => (
        <mesh key={index} position={pos}>
          <ringGeometry args={[1.5, 2, 32]} />
          <meshBasicMaterial
            color="#ffd700"
            transparent
            opacity={0.8}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
    </group>
  );
}

function SceneContent({
  heightMap,
  onTerrainClick,
}: {
  heightMap: number[][];
  onTerrainClick: (point: THREE.Vector3) => void;
}) {
  const terrainAmplitude = useStore((state) => state.terrainAmplitude);
  const particleCount = useStore((state) => state.particleCount);
  const turbines = useStore((state) => state.turbines);
  const { raycaster, mouse, camera } = useThree();
  const planeRef = useRef<THREE.Mesh>(null);

  const handleClick = (event: any) => {
    event.stopPropagation();

    if (!planeRef.current) return;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObject(planeRef.current);

    if (intersects.length > 0) {
      const point = intersects[0].point;
      onTerrainClick(point);
    }
  };

  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight
        position={[50, 80, 50]}
        intensity={1}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-left={-120}
        shadow-camera-right={120}
        shadow-camera-top={120}
        shadow-camera-bottom={-120}
      />
      <hemisphereLight args={['#87ceeb', '#363636', 0.3]} />

      <fog attach="fog" args={['#121212', 150, 300]} />

      <Terrain amplitude={terrainAmplitude} />

      <mesh
        ref={planeRef}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.1, 0]}
        onClick={handleClick}
      >
        <planeGeometry args={[200, 200]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>

      <WakeCones heightMap={heightMap} />
      <SuggestionMarkers />

      {turbines.map((turbine) => (
        <Turbine
          key={turbine.id}
          id={turbine.id}
          position={turbine.position}
          windSpeed={turbine.windSpeed}
          power={turbine.power}
          heightMap={heightMap}
        />
      ))}

      <Particles count={particleCount} heightMap={heightMap} />

      <OrbitControls
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={30}
        maxDistance={200}
        target={[0, 10, 0]}
        maxPolarAngle={Math.PI / 2.2}
      />
    </>
  );
}

export default function Scene({
  heightMap,
  onTerrainClick,
}: {
  heightMap: number[][];
  onTerrainClick: (point: THREE.Vector3) => void;
}) {
  return (
    <Canvas
      shadows
      camera={{ position: [80, 60, 80], fov: 50 }}
      gl={{ antialias: true, alpha: false }}
      style={{ background: '#121212' }}
    >
      <SceneContent heightMap={heightMap} onTerrainClick={onTerrainClick} />
    </Canvas>
  );
}
