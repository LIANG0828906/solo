import React, { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Sky } from '@react-three/drei';
import * as THREE from 'three';
import { BuildingData, TreeData, CityParams, animateBuildingRise } from './buildingGenerator';
import { CameraState } from './cameraNavigator';

interface BuildingProps {
  building: BuildingData;
  startTime: number;
}

const Building: React.FC<BuildingProps> = ({ building, startTime }) => {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (meshRef.current) {
      const elapsed = clock.getElapsedTime() - startTime;
      const { scaleY, y } = animateBuildingRise(building, elapsed);
      meshRef.current.scale.y = scaleY;
      meshRef.current.position.y = y;
    }
  });

  return (
    <mesh
      ref={meshRef}
      position={[building.position[0], 0, building.position[2]]}
      castShadow
      receiveShadow
    >
      <boxGeometry args={[building.width, building.height, building.depth]} />
      <meshStandardMaterial color={building.color} roughness={0.7} metalness={0.1} />
    </mesh>
  );
};

interface TreeProps {
  tree: TreeData;
}

const Tree: React.FC<TreeProps> = ({ tree }) => {
  const trunkHeight = tree.height * 0.4;
  const foliageHeight = tree.height * 0.6;
  const foliageRadius = tree.height * 0.3;

  return (
    <group position={[tree.position[0], 0, tree.position[2]]}>
      <mesh position={[0, trunkHeight / 2, 0]} castShadow>
        <cylinderGeometry args={[0.3, 0.4, trunkHeight, 8]} />
        <meshStandardMaterial color="#8B4513" />
      </mesh>
      <mesh position={[0, trunkHeight + foliageHeight / 2, 0]} castShadow>
        <coneGeometry args={[foliageRadius, foliageHeight, 8]} />
        <meshStandardMaterial color="#228B22" />
      </mesh>
    </group>
  );
};

interface GroundProps {
  size: number;
}

const Ground: React.FC<GroundProps> = ({ size }) => {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
      <planeGeometry args={[size, size]} />
      <meshStandardMaterial color="#F5F5DC" />
    </mesh>
  );
};

interface GridProps {
  size: number;
  divisions: number;
}

const Grid: React.FC<GridProps> = ({ size, divisions }) => {
  const gridRef = useRef<THREE.Group>(null);

  const gridLines = useMemo(() => {
    const lines: JSX.Element[] = [];
    const step = size / divisions;
    const halfSize = size / 2;

    for (let i = 0; i <= divisions; i++) {
      const pos = i * step - halfSize;
      lines.push(
        <line key={`h-${i}`}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={2}
              array={new Float32Array([-halfSize, 0.01, pos, halfSize, 0.01, pos])}
              itemSize={3}
            />
          </bufferGeometry>
          <lineBasicMaterial color="#CCCCCC" transparent opacity={0.3} />
        </line>
      );
      lines.push(
        <line key={`v-${i}`}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={2}
              array={new Float32Array([pos, 0.01, -halfSize, pos, 0.01, halfSize])}
              itemSize={3}
            />
          </bufferGeometry>
          <lineBasicMaterial color="#CCCCCC" transparent opacity={0.3} />
        </line>
      );
    }
    return lines;
  }, [size, divisions]);

  return <group ref={gridRef}>{gridLines}</group>;
};

interface LightingProps {
  sunAngle: number;
}

const Lighting: React.FC<LightingProps> = ({ sunAngle }) => {
  const angleRad = (sunAngle * Math.PI) / 180;
  const distance = 200;
  const height = 100;

  const lightX = Math.cos(angleRad) * distance;
  const lightZ = Math.sin(angleRad) * distance;

  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight
        position={[lightX, height, lightZ]}
        intensity={1}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-150}
        shadow-camera-right={150}
        shadow-camera-top={150}
        shadow-camera-bottom={-150}
        shadow-camera-near={1}
        shadow-camera-far={500}
      />
    </>
  );
};

interface SceneContentProps {
  buildings: BuildingData[];
  trees: TreeData[];
  params: CityParams;
  cameraState: CameraState;
  onCameraUpdate: (position: [number, number, number], target: [number, number, number]) => void;
  generationKey: number;
}

const SceneContent: React.FC<SceneContentProps> = ({
  buildings,
  trees,
  params,
  cameraState,
  onCameraUpdate,
  generationKey,
}) => {
  const { camera } = useThree();
  const controlsRef = useRef<any>(null);
  const startTime = useRef(0);

  useEffect(() => {
    startTime.current = 0;
  }, [generationKey]);

  useFrame(({ clock }) => {
    if (startTime.current === 0) {
      startTime.current = clock.getElapsedTime();
    }
    if (controlsRef.current) {
      const pos = controlsRef.current.object.position;
      const target = controlsRef.current.target;
      onCameraUpdate(
        [pos.x, pos.y, pos.z],
        [target.x, target.y, target.z]
      );
    }
  });

  useEffect(() => {
    camera.position.set(...cameraState.position);
    if (controlsRef.current) {
      controlsRef.current.target.set(...cameraState.target);
      controlsRef.current.update();
    }
  }, [cameraState.position, cameraState.target, camera]);

  return (
    <>
      <Sky sunPosition={[100, 50, 100]} turbidity={8} rayleigh={2} mieCoefficient={0.005} mieDirectionalG={0.8} />
      
      <color attach="background" args={[0x87CEEB]} />
      <fog attach="fog" args={[0x87CEEB, 200, 400]} />
      
      <Lighting sunAngle={params.sunAngle} />
      
      <Ground size={200} />
      <Grid size={200} divisions={20} />
      
      {buildings.map((building) => (
        <Building key={`${building.id}-${generationKey}`} building={building} startTime={startTime.current} />
      ))}
      
      {trees.map((tree) => (
        <Tree key={`${tree.id}-${generationKey}`} tree={tree} />
      ))}
      
      <OrbitControls
        ref={controlsRef}
        makeDefault
        enableDamping
        dampingFactor={0.05}
        minDistance={20}
        maxDistance={300}
        maxPolarAngle={Math.PI / 2 - 0.1}
      />
    </>
  );
};

interface SkylineSceneProps {
  buildings: BuildingData[];
  trees: TreeData[];
  params: CityParams;
  cameraState: CameraState;
  onCameraUpdate: (position: [number, number, number], target: [number, number, number]) => void;
  generationKey: number;
}

export const SkylineScene: React.FC<SkylineSceneProps> = ({
  buildings,
  trees,
  params,
  cameraState,
  onCameraUpdate,
  generationKey,
}) => {
  return (
    <div style={{ width: '100vw', height: '100vh', position: 'fixed', top: 0, left: 0 }}>
      <Canvas
        shadows
        camera={{ position: cameraState.position, fov: 60, near: 0.1, far: 1000 }}
        gl={{ antialias: true, powerPreference: 'high-performance' }}
      >
        <SceneContent
          buildings={buildings}
          trees={trees}
          params={params}
          cameraState={cameraState}
          onCameraUpdate={onCameraUpdate}
          generationKey={generationKey}
        />
      </Canvas>
    </div>
  );
};
