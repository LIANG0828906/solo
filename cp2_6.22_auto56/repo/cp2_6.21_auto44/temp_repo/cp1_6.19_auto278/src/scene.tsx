import React, { useRef, useMemo, createContext, useContext, useCallback, forwardRef, useImperativeHandle } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Stars, Line } from '@react-three/drei';
import * as THREE from 'three';
import { useStore } from './store';
import type { PlanetState } from './store';

interface ControlsContextValue {
  controlsRef: React.MutableRefObject<any>;
}

const ControlsContext = createContext<ControlsContextValue | null>(null);

function useControlsStore() {
  const ctx = useContext(ControlsContext);
  if (!ctx) throw new Error('useControlsStore must be used within ControlsProvider');
  return ctx;
}

export function useStoreRef() {
  const { controlsRef } = useControlsStore();
  return controlsRef;
}

function getOrbitPoints(
  orbitRadius: number,
  eccentricity: number,
  inclination: number,
  count: number
): THREE.Vector3[] {
  const points: THREE.Vector3[] = [];
  const a = orbitRadius;
  const e = eccentricity;
  const inclRad = (inclination * Math.PI) / 180;
  for (let i = 0; i <= count; i++) {
    const angle = (i / count) * Math.PI * 2;
    const r = (a * (1 - e * e)) / (1 + e * Math.cos(angle));
    const x = r * Math.cos(angle);
    const z = r * Math.sin(angle) * Math.cos(inclRad);
    const y = r * Math.sin(angle) * Math.sin(inclRad);
    points.push(new THREE.Vector3(x, y, z));
  }
  return points;
}

function Sun() {
  const sunTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;
    const gradient = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
    gradient.addColorStop(0, 'rgba(255, 255, 200, 1)');
    gradient.addColorStop(0.2, 'rgba(255, 220, 100, 0.8)');
    gradient.addColorStop(0.5, 'rgba(255, 180, 50, 0.3)');
    gradient.addColorStop(1, 'rgba(255, 150, 0, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 256, 256);
    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  }, []);

  return (
    <group>
      <mesh>
        <sphereGeometry args={[0.5, 32, 32]} />
        <meshBasicMaterial color="#FFD700" />
      </mesh>
      <sprite scale={[2, 2, 1]}>
        <spriteMaterial map={sunTexture} transparent depthWrite={false} />
      </sprite>
      <pointLight position={[0, 0, 0]} intensity={3} distance={50} color="#FFFFFF" />
    </group>
  );
}

interface PlanetOrbitProps {
  planet: PlanetState;
  isSelected: boolean;
}

function PlanetOrbit({ planet, isSelected }: PlanetOrbitProps) {
  const linePoints = useMemo(
    () => getOrbitPoints(planet.orbitRadius, planet.orbitEccentricity, planet.orbitInclination, 128),
    [planet.orbitRadius, planet.orbitEccentricity, planet.orbitInclination]
  );

  const markerPoints = useMemo(
    () => getOrbitPoints(planet.orbitRadius, planet.orbitEccentricity, planet.orbitInclination, 12).slice(0, 12),
    [planet.orbitRadius, planet.orbitEccentricity, planet.orbitInclination]
  );

  return (
    <group>
      <Line
        points={linePoints}
        color={planet.color}
        transparent
        opacity={isSelected ? 0.8 : 0.3}
      />
      {markerPoints.map((point, i) => (
        <mesh key={i} position={point.toArray() as [number, number, number]}>
          <sphereGeometry args={[0.015, 8, 8]} />
          <meshBasicMaterial
            color={planet.color}
            transparent
            opacity={isSelected ? 0.9 : 0.4}
          />
        </mesh>
      ))}
    </group>
  );
}

interface PlanetMeshProps {
  planet: PlanetState;
  isSelected: boolean;
}

function PlanetMesh({ planet, isSelected }: PlanetMeshProps) {
  const setSelectedPlanet = useStore((s) => s.setSelectedPlanet);
  const meshRef = useRef<THREE.Mesh>(null);

  const emissiveIntensity = isSelected ? 0.4 : 0.1;

  return (
    <mesh
      ref={meshRef}
      position={planet.position}
      onClick={(e) => {
        e.stopPropagation();
        setSelectedPlanet(planet.id);
      }}
    >
      <icosahedronGeometry args={[planet.radius, 1]} />
      <meshStandardMaterial
        color={planet.color}
        emissive={planet.color}
        emissiveIntensity={emissiveIntensity}
        roughness={0.7}
        metalness={0.1}
      />
    </mesh>
  );
}

function Planets() {
  const planets = useStore((s) => s.planets);
  const selectedPlanetId = useStore((s) => s.selectedPlanetId);
  const updatePlanets = useStore((s) => s.updatePlanets);

  useFrame((_, delta) => {
    updatePlanets(delta);
  });

  return (
    <group>
      {planets.map((planet) => (
        <React.Fragment key={planet.id}>
          <PlanetOrbit
            planet={planet}
            isSelected={selectedPlanetId === planet.id}
          />
          <PlanetMesh
            planet={planet}
            isSelected={selectedPlanetId === planet.id}
          />
        </React.Fragment>
      ))}
    </group>
  );
}

interface CameraControllerProps {
  controlsRef: React.MutableRefObject<any>;
}

function CameraController({ controlsRef }: CameraControllerProps) {
  return (
    <OrbitControls
      ref={controlsRef}
      minDistance={0.5}
      maxDistance={50}
      enableDamping
      dampingFactor={0.08}
      makeDefault
    />
  );
}

export interface SceneHandle {
  resetCamera: () => void;
}

interface SceneProps {}

const InnerScene = forwardRef<SceneHandle, SceneProps>((_props, ref) => {
  const controlsRef = useRef<any>(null);
  const { camera } = useThree();

  const resetCamera = useCallback(() => {
    if (controlsRef.current) {
      camera.position.set(0, 5, 10);
      controlsRef.current.target.set(0, 0, 0);
      controlsRef.current.update();
    }
  }, [camera]);

  useImperativeHandle(
    ref,
    () => ({
      resetCamera,
    }),
    [resetCamera]
  );

  return (
    <ControlsContext.Provider value={{ controlsRef }}>
      <ambientLight intensity={0.2} />
      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
      <Sun />
      <Planets />
      <CameraController controlsRef={controlsRef} />
    </ControlsContext.Provider>
  );
});

InnerScene.displayName = 'InnerScene';

const Scene = forwardRef<SceneHandle, SceneProps>((props, ref) => {
  return (
    <Canvas
      camera={{ position: [0, 5, 10], fov: 60 }}
      onPointerMissed={() => useStore.getState().setSelectedPlanet(null)}
    >
      <InnerScene ref={ref} {...props} />
    </Canvas>
  );
});

Scene.displayName = 'Scene';

export default Scene;
