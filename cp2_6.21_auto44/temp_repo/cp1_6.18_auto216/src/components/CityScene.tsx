import { useRef, useEffect, useMemo, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { useAppStore } from '@/store/useAppStore';
import { calculateSunPosition, calculateSolar } from '@/analytics/solarSim';
import { CAMERA_PRESETS } from '@/renderer/sceneManager';
import { BuildingMesh } from '@/components/BuildingMesh';
import { BUILDING_SCHEMES, type Building, type SchemeType } from '@/data/buildingModel';

function GridGround() {
  return (
    <group>
      <gridHelper
        args={[20, 20, '#2A3A5A', '#2A3A5A']}
        position={[0, 0.001, 0]}
      >
        <lineBasicMaterial attach="material" transparent opacity={0.4} />
      </gridHelper>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow position={[0, 0, 0]}>
        <planeGeometry args={[22, 22]} />
        <meshStandardMaterial color="#0D1424" roughness={0.9} metalness={0.05} />
      </mesh>
    </group>
  );
}

function SunLight() {
  const dirRef = useRef<THREE.DirectionalLight>(null);
  const ambientRef = useRef<THREE.AmbientLight>(null);
  const hemiRef = useRef<THREE.HemisphereLight>(null);
  const currentHour = useAppStore((s) => s.currentHour);

  useFrame(() => {
    if (!dirRef.current) return;
    const sun = calculateSunPosition(currentHour);
    dirRef.current.position.set(sun.x, sun.y, sun.z);
    dirRef.current.color.copy(sun.color);
    dirRef.current.intensity = sun.intensity;
    const d = 16;
    if (dirRef.current.shadow) {
      dirRef.current.shadow.camera.left = -d;
      dirRef.current.shadow.camera.right = d;
      dirRef.current.shadow.camera.top = d;
      dirRef.current.shadow.camera.bottom = -d;
      dirRef.current.shadow.camera.near = 1;
      dirRef.current.shadow.camera.far = 80;
      dirRef.current.shadow.mapSize.set(1024, 1024);
      dirRef.current.shadow.bias = -0.0005;
      dirRef.current.shadow.normalBias = 0.02;
    }
  });

  return (
    <>
      <ambientLight ref={ambientRef} intensity={0.35} color="#8AA0C0" />
      <hemisphereLight ref={hemiRef} args={['#6B8BB0', '#1A2438', 0.35]} />
      <directionalLight
        ref={dirRef}
        castShadow
        color="#FFD699"
        intensity={1.0}
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
    </>
  );
}

function CameraController() {
  const { camera } = useThree();
  const controlsRef = useRef<any>(null);
  const preset = useAppStore((s) => s.cameraPreset);
  const transitionRef = useRef<{
    active: boolean;
    start: number;
    dur: number;
    fromPos: THREE.Vector3;
    toPos: THREE.Vector3;
    fromTarget: THREE.Vector3;
    toTarget: THREE.Vector3;
  }>({ active: false, start: 0, dur: 1200, fromPos: new THREE.Vector3(), toPos: new THREE.Vector3(), fromTarget: new THREE.Vector3(), toTarget: new THREE.Vector3() });
  const prevPreset = useRef(preset);

  useEffect(() => {
    const p = CAMERA_PRESETS[preset];
    transitionRef.current = {
      active: true,
      start: performance.now(),
      dur: 1200,
      fromPos: camera.position.clone(),
      toPos: new THREE.Vector3(...p.position),
      fromTarget: controlsRef.current?.target ? controlsRef.current.target.clone() : new THREE.Vector3(),
      toTarget: new THREE.Vector3(...p.target),
    };
    prevPreset.current = preset;
  }, [preset, camera]);

  useFrame(() => {
    const t = transitionRef.current;
    if (!t.active) return;
    const now = performance.now();
    const tt = Math.min(1, (now - t.start) / t.dur);
    const e = tt < 0.5 ? 4 * tt * tt * tt : 1 - Math.pow(-2 * tt + 2, 3) / 2;
    camera.position.lerpVectors(t.fromPos, t.toPos, e);
    if (controlsRef.current) {
      controlsRef.current.target.lerpVectors(t.fromTarget, t.toTarget, e);
      controlsRef.current.update();
    }
    if (tt >= 1) t.active = false;
  });

  return (
    <OrbitControls
      ref={controlsRef}
      enableDamping
      dampingFactor={0.08}
      minDistance={6}
      maxDistance={60}
      maxPolarAngle={Math.PI / 2.05}
      minPolarAngle={0.1}
      enablePan={true}
      mouseButtons={{
        LEFT: THREE.MOUSE.ROTATE,
        MIDDLE: THREE.MOUSE.DOLLY,
        RIGHT: THREE.MOUSE.PAN,
      }}
      touches={{
        ONE: THREE.TOUCH.ROTATE,
        TWO: THREE.TOUCH.DOLLY_PAN,
      }}
    />
  );
}

function SolarUpdater() {
  const buildings = useAppStore((s) => s.buildings);
  const hour = useAppStore((s) => s.currentHour);
  const updateSolarResults = useAppStore((s) => s.updateSolarResults);

  useEffect(() => {
    const results = calculateSolar(hour, buildings);
    updateSolarResults(results);
  }, [hour, buildings, updateSolarResults]);

  return null;
}

function BuildingsLayer() {
  const buildings = useAppStore((s) => s.buildings);
  const solarResults = useAppStore((s) => s.solarResults);
  const currentScheme = useAppStore((s) => s.currentScheme);
  const isTransitioning = useAppStore((s) => s.isTransitioning);
  const [prevScheme, setPrevScheme] = useState<SchemeType>(currentScheme);
  const [transitionStart, setTransitionStart] = useState<number>(0);
  const [progress, setProgress] = useState(1);
  const prevBuildingsRef = useRef<Building[]>(buildings);

  useEffect(() => {
    if (currentScheme !== prevScheme) {
      prevBuildingsRef.current = useAppStore.getState().buildings;
      setPrevScheme(currentScheme);
      setTransitionStart(performance.now());
      setProgress(0);
    }
  }, [currentScheme, prevScheme]);

  useFrame(() => {
    if (isTransitioning) {
      const t = Math.min(1, (performance.now() - transitionStart) / 2000);
      setProgress(t);
    } else {
      setProgress(1);
    }
  });

  const intensityMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of solarResults) map.set(r.buildingId, r.sunIntensity);
    return map;
  }, [solarResults]);

  const prevBuildings = isTransitioning ? prevBuildingsRef.current : buildings;
  const displayedBuildings = isTransitioning ? prevBuildings : buildings;

  return (
    <>
      {displayedBuildings.map((b, idx) => {
        const targetB = isTransitioning ? buildings[idx] ?? b : null;
        return (
          <BuildingMesh
            key={b.id}
            building={b}
            solarIntensity={intensityMap.get(b.id) ?? 0.6}
            transitionProgress={progress}
            targetBuilding={targetB}
          />
        );
      })}
    </>
  );
}

function SceneContent() {
  return (
    <>
      <color attach="background" args={['#0A0E1A']} />
      <fog attach="fog" args={['#0A0E1A', 28, 75]} />
      <SunLight />
      <GridGround />
      <CameraController />
      <SolarUpdater />
      <BuildingsLayer />
    </>
  );
}

export function CityScene() {
  return (
    <Canvas
      shadows
      dpr={[1, 1.75]}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
      camera={{ fov: 50, near: 0.1, far: 1000, position: [0, 25 * Math.sin(Math.PI / 6), 25 * Math.cos(Math.PI / 6)] }}
      style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }}
      onPointerMissed={() => {
        const st = useAppStore.getState();
        if (st.selectedBuildingId) st.setSelectedBuilding(null);
        if (st.hoveredBuildingId) st.setHoveredBuilding(null);
      }}
    >
      <SceneContent />
    </Canvas>
  );
}

export { BUILDING_SCHEMES };
