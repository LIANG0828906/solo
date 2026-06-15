import { useRef, useMemo } from 'react';
import { Canvas, useFrame, ThreeEvent } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { useAppStore } from '../store/store';
import { buildingsData, BuildingData } from '../utils/buildingData';

interface BuildingProps {
  data: BuildingData;
  isSelected: boolean;
  otherSelected: boolean;
  onClick: (id: string) => void;
}

function Building({ data, isSelected, otherSelected, onClick }: BuildingProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const edgesRef = useRef<THREE.LineSegments>(null);

  const material = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: data.color,
      transparent: true,
      opacity: isSelected ? 1 : otherSelected ? 0.3 : 1,
      roughness: 0.7,
      metalness: 0.1,
    });
  }, [data.color, isSelected, otherSelected]);

  useFrame(() => {
    if (meshRef.current) {
      const mat = meshRef.current.material as THREE.MeshStandardMaterial;
      const targetOpacity = isSelected ? 1 : otherSelected ? 0.3 : 1;
      mat.opacity = THREE.MathUtils.lerp(mat.opacity, targetOpacity, 0.2);
    }
    if (edgesRef.current) {
      edgesRef.current.visible = isSelected;
    }
  });

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    onClick(data.id);
  };

  return (
    <group position={[data.position.x, data.size.height / 2, data.position.z]}>
      <mesh
        ref={meshRef}
        material={material}
        onClick={handleClick}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[data.size.width, data.size.height, data.size.depth]} />
      </mesh>
      <lineSegments ref={edgesRef}>
        <edgesGeometry args={[new THREE.BoxGeometry(data.size.width, data.size.height, data.size.depth)]} />
        <lineBasicMaterial color="#ffff00" linewidth={2} />
      </lineSegments>
    </group>
  );
}

function Ground() {
  const gridSize = 50;
  const gridDivisions = 50;

  const gridHelper = useMemo(() => {
    return new THREE.GridHelper(gridSize, gridDivisions, 0x444444, 0x444444);
  }, []);

  const thickGridHelper = useMemo(() => {
    const lines: THREE.Line3[] = [];
    const halfSize = gridSize / 2;
    const step = 5;

    for (let i = -halfSize; i <= halfSize; i += step) {
      lines.push(new THREE.Line3(
        new THREE.Vector3(i, 0.01, -halfSize),
        new THREE.Vector3(i, 0.01, halfSize)
      ));
      lines.push(new THREE.Line3(
        new THREE.Vector3(-halfSize, 0.01, i),
        new THREE.Vector3(halfSize, 0.01, i)
      ));
    }

    const geometry = new THREE.BufferGeometry();
    const positions: number[] = [];
    lines.forEach(line => {
      positions.push(line.start.x, line.start.y, line.start.z);
      positions.push(line.end.x, line.end.y, line.end.z);
    });
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));

    return new THREE.LineSegments(geometry, new THREE.LineBasicMaterial({ color: 0x444444, linewidth: 2 }));
  }, []);

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[gridSize, gridSize]} />
        <meshStandardMaterial color="#2a2a3e" />
      </mesh>
      <primitive object={gridHelper} position={[0, 0.005, 0]} />
      <primitive object={thickGridHelper} />
    </group>
  );
}

function SunLight() {
  const lightRef = useRef<THREE.PointLight>(null);
  const sunPosition = useAppStore((state) => state.sunPosition);

  useFrame(() => {
    if (lightRef.current) {
      lightRef.current.position.set(
        sunPosition.vector.x,
        sunPosition.vector.y,
        sunPosition.vector.z
      );
    }
  });

  return (
    <pointLight
      ref={lightRef}
      color="#fffacd"
      intensity={2}
      distance={300}
      decay={0.5}
      castShadow
      shadow-mapSize-width={2048}
      shadow-mapSize-height={2048}
      shadow-camera-far={300}
      shadow-camera-left={-80}
      shadow-camera-right={80}
      shadow-camera-top={80}
      shadow-camera-bottom={-80}
      shadow-bias={-0.0001}
    />
  );
}

function Buildings() {
  const selectedBuildingId = useAppStore((state) => state.selectedBuildingId);
  const setSelectedBuildingId = useAppStore((state) => state.setSelectedBuildingId);

  const handleBuildingClick = (id: string) => {
    setSelectedBuildingId(selectedBuildingId === id ? null : id);
  };

  const handleCanvasClick = () => {
    setSelectedBuildingId(null);
  };

  return (
    <group onClick={handleCanvasClick}>
      {buildingsData.map((building) => (
        <Building
          key={building.id}
          data={building}
          isSelected={selectedBuildingId === building.id}
          otherSelected={selectedBuildingId !== null && selectedBuildingId !== building.id}
          onClick={handleBuildingClick}
        />
      ))}
    </group>
  );
}

function SceneContent() {
  return (
    <>
      <ambientLight intensity={0.3} />
      <SunLight />
      <Ground />
      <Buildings />
      <OrbitControls
        enableDamping
        dampingFactor={0.05}
        minDistance={20}
        maxDistance={100}
        maxPolarAngle={Math.PI / 2.1}
        target={[0, 5, 0]}
      />
    </>
  );
}

export default function Scene3D() {
  return (
    <Canvas
      shadows
      camera={{ position: [50, 40, 50], fov: 50, near: 0.1, far: 1000 }}
      gl={{ antialias: true, shadowMap: { enabled: true, type: THREE.PCFSoftShadowMap } }}
      onPointerMissed={() => useAppStore.getState().setSelectedBuildingId(null)}
    >
      <color attach="background" args={['#1a1a2e']} />
      <fog attach="fog" args={['#1a1a2e', 80, 150]} />
      <SceneContent />
    </Canvas>
  );
}
