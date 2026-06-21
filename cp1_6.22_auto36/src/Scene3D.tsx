import { useRef, useMemo, useEffect, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Grid } from '@react-three/drei';
import * as THREE from 'three';
import { BuildingBlock } from '@/components/BuildingBlock';
import { ShadowProjection } from '@/components/ShadowProjection';
import { ControlPanel } from '@/components/ControlPanel';
import { TimeSlider } from '@/components/TimeSlider';
import { ViewSwitcher } from '@/components/ViewSwitcher';
import { useSceneStore } from '@/store/useSceneStore';
import { calculateAllShadows, calculateSunDirection } from '@/utils/ShadowAnalyzer';
import type { Building, CameraMode, ShadowPolygon } from '@/types';

interface CameraControllerProps {
  cameraMode: CameraMode;
}

function CameraController({ cameraMode }: CameraControllerProps) {
  const { camera } = useThree();
  const controlsRef = useRef<any>(null);
  const targetPos = useRef(new THREE.Vector3());
  const targetTarget = useRef(new THREE.Vector3());
  const isAnimating = useRef(false);
  const animProgress = useRef(0);
  const startPos = useRef(new THREE.Vector3());
  const startTarget = useRef(new THREE.Vector3());

  const getCameraTarget = (mode: CameraMode) => {
    switch (mode) {
      case 'top45':
        return {
          position: new THREE.Vector3(40, 40, 40),
          target: new THREE.Vector3(0, 0, 0),
        };
      case 'south':
        return {
          position: new THREE.Vector3(0, 25, 60),
          target: new THREE.Vector3(0, 10, 0),
        };
      case 'free':
        return null;
      default:
        return null;
    }
  };

  useEffect(() => {
    const target = getCameraTarget(cameraMode);
    if (target) {
      startPos.current.copy(camera.position);
      startTarget.current.copy(controlsRef.current?.target || new THREE.Vector3());
      targetPos.current.copy(target.position);
      targetTarget.current.copy(target.target);
      isAnimating.current = true;
      animProgress.current = 0;
    }
  }, [cameraMode, camera]);

  useFrame((_, delta) => {
    if (isAnimating.current) {
      animProgress.current += delta / 0.6;
      const t = Math.min(animProgress.current, 1);
      const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

      camera.position.lerpVectors(startPos.current, targetPos.current, eased);
      if (controlsRef.current) {
        controlsRef.current.target.lerpVectors(startTarget.current, targetTarget.current, eased);
        controlsRef.current.update();
      }

      if (t >= 1) {
        isAnimating.current = false;
      }
    }

    if (cameraMode === 'free' && controlsRef.current) {
      controlsRef.current.enabled = true;
    } else if (controlsRef.current) {
      controlsRef.current.enabled = false;
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      enableDamping
      dampingFactor={0.05}
      minDistance={10}
      maxDistance={100}
      maxPolarAngle={Math.PI / 2.1}
    />
  );
}

interface SunLightProps {
  timeOfDay: number;
}

function SunLight({ timeOfDay }: SunLightProps) {
  const lightRef = useRef<THREE.DirectionalLight>(null);

  useFrame(() => {
    if (!lightRef.current) return;

    const { direction } = calculateSunDirection(timeOfDay);
    const distance = 80;
    lightRef.current.position.set(
      direction[0] * distance,
      direction[1] * distance,
      direction[2] * distance
    );

    const intensity = Math.max(0.3, Math.sin(((timeOfDay - 6) / 12) * Math.PI));
    lightRef.current.intensity = intensity * 1.5;
  });

  return (
    <directionalLight
      ref={lightRef}
      castShadow
      shadow-mapSize-width={1024}
      shadow-mapSize-height={1024}
      shadow-camera-left={-50}
      shadow-camera-right={50}
      shadow-camera-top={50}
      shadow-camera-bottom={-50}
      shadow-camera-near={0.1}
      shadow-camera-far={200}
    />
  );
}

interface SceneContentProps {
  buildings: Building[];
  selectedBuildingId: string | null;
  timeOfDay: number;
  cameraMode: CameraMode;
  shadowPolygons: ShadowPolygon[];
  onSelectBuilding: (id: string | null) => void;
}

function SceneContent({
  buildings,
  selectedBuildingId,
  timeOfDay,
  cameraMode,
  shadowPolygons,
  onSelectBuilding,
}: SceneContentProps) {
  const handleCanvasClick = () => {
    onSelectBuilding(null);
  };

  return (
    <>
      <ambientLight intensity={0.4} />
      <SunLight timeOfDay={timeOfDay} />

      <Grid
        position={[0, 0, 0]}
        args={[100, 100]}
        cellSize={5}
        cellThickness={0.5}
        cellColor="rgba(100, 200, 255, 0.15)"
        sectionSize={25}
        sectionThickness={1}
        sectionColor="rgba(100, 200, 255, 0.25)"
        fadeDistance={60}
        fadeStrength={1}
        followCamera={false}
        infiniteGrid
      />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} receiveShadow>
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial color="#1a1a2e" transparent opacity={0.5} />
      </mesh>

      <ShadowProjection shadowPolygons={shadowPolygons} />

      {buildings.map((building) => (
        <BuildingBlock
          key={building.id}
          building={building}
          selected={selectedBuildingId === building.id}
          onSelect={onSelectBuilding}
        />
      ))}

      <CameraController cameraMode={cameraMode} />

      <mesh onClick={handleCanvasClick} position={[0, -0.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[200, 200]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>
    </>
  );
}

export function Scene3D() {
  const { buildings, selectedBuildingId, timeOfDay, cameraMode, selectBuilding } = useSceneStore();
  const [shadowPolygons, setShadowPolygons] = useState<ShadowPolygon[]>([]);

  useEffect(() => {
    const startTime = performance.now();
    const polygons = calculateAllShadows(buildings, timeOfDay);
    const endTime = performance.now();
    
    if (endTime - startTime > 5) {
      console.warn(`Shadow calculation took ${(endTime - startTime).toFixed(2)}ms, exceeding 5ms budget`);
    }
    
    setShadowPolygons(polygons);
  }, [buildings, timeOfDay]);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', background: '#1a1a2e' }}>
      <Canvas
        shadows
        camera={{ position: [40, 40, 40], fov: 50, near: 0.1, far: 1000 }}
        gl={{ antialias: true, powerPreference: 'high-performance' }}
        dpr={[1, 2]}
      >
        <color attach="background" args={['#1a1a2e']} />
        <fog attach="fog" args={['#1a1a2e', 60, 120]} />
        <SceneContent
          buildings={buildings}
          selectedBuildingId={selectedBuildingId}
          timeOfDay={timeOfDay}
          cameraMode={cameraMode}
          shadowPolygons={shadowPolygons}
          onSelectBuilding={selectBuilding}
        />
      </Canvas>

      <ViewSwitcher />
      <ControlPanel />
      <TimeSlider />
    </div>
  );
}
