import { useRef, useEffect, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import { Sun } from './Sun';
import { Planet } from './Planet';
import { Orbit } from './Orbit';
import { Starfield } from './Starfield';
import { PLANETS, getPlanetById } from '../data/planets';
import { useSolarSystemStore } from '../store/useSolarSystemStore';

interface CameraControllerProps {
  onDoubleClick: () => void;
}

function CameraController({ onDoubleClick }: CameraControllerProps) {
  const { camera } = useThree();
  const controlsRef = useRef<any>(null);
  const animRef = useRef<number | null>(null);
  const selectedPlanetId = useSolarSystemStore((s) => s.selectedPlanetId);
  const planetAngles = useSolarSystemStore((s) => s.planetAngles);
  const updatePlanetPositions = useSolarSystemStore(
    (s) => s.updatePlanetPositions
  );
  const reset = useSolarSystemStore((s) => s.reset);

  const flyToPosition = useCallback(
    (target: THREE.Vector3, distance: number, fov: number) => {
      if (animRef.current !== null) {
        cancelAnimationFrame(animRef.current);
      }

      const startPos = camera.position.clone();
      const startTarget = controlsRef.current?.target?.clone() || new THREE.Vector3();
      const startFov = (camera as THREE.PerspectiveCamera).fov;
      const direction = new THREE.Vector3()
        .subVectors(startPos, startTarget)
        .normalize();
      const endPos = new THREE.Vector3()
        .copy(target)
        .add(direction.multiplyScalar(distance));
      const endTarget = target.clone();
      const endFov = fov;
      const duration = 2000;
      const startTime = performance.now();

      const animate = () => {
        const elapsed = performance.now() - startTime;
        const t = Math.min(elapsed / duration, 1);
        const ease = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

        camera.position.lerpVectors(startPos, endPos, ease);
        if (controlsRef.current?.target) {
          controlsRef.current.target.lerpVectors(startTarget, endTarget, ease);
        }
        (camera as THREE.PerspectiveCamera).fov =
          startFov + (endFov - startFov) * ease;
        camera.updateProjectionMatrix();
        controlsRef.current?.update();

        if (t < 1) {
          animRef.current = requestAnimationFrame(animate);
        } else {
          animRef.current = null;
        }
      };

      animRef.current = requestAnimationFrame(animate);
    },
    [camera]
  );

  const resetCamera = useCallback(() => {
    if (animRef.current !== null) {
      cancelAnimationFrame(animRef.current);
    }

    const startPos = camera.position.clone();
    const startTarget = controlsRef.current?.target?.clone() || new THREE.Vector3();
    const startFov = (camera as THREE.PerspectiveCamera).fov;
    const defaultAngle = (30 * Math.PI) / 180;
    const endPos = new THREE.Vector3(
      0,
      15 * Math.sin(defaultAngle),
      15 * Math.cos(defaultAngle)
    );
    const endTarget = new THREE.Vector3(0, 0, 0);
    const endFov = 60;
    const duration = 1000;
    const startTime = performance.now();

    const animate = () => {
      const elapsed = performance.now() - startTime;
      const t = Math.min(elapsed / duration, 1);
      const ease = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

      camera.position.lerpVectors(startPos, endPos, ease);
      if (controlsRef.current?.target) {
        controlsRef.current.target.lerpVectors(startTarget, endTarget, ease);
      }
      (camera as THREE.PerspectiveCamera).fov =
        startFov + (endFov - startFov) * ease;
      camera.updateProjectionMatrix();
      controlsRef.current?.update();

      if (t < 1) {
        animRef.current = requestAnimationFrame(animate);
      } else {
        animRef.current = null;
      }
    };

    animRef.current = requestAnimationFrame(animate);
  }, [camera]);

  useEffect(() => {
    if (selectedPlanetId) {
      const planet = getPlanetById(selectedPlanetId);
      if (planet) {
        const angle = planetAngles[selectedPlanetId] || 0;
        const px = Math.cos(angle) * planet.orbitRadius;
        const pz = Math.sin(angle) * planet.orbitRadius;
        const target = new THREE.Vector3(px, 0, pz);
        flyToPosition(target, planet.radius + 3, 80);
      }
    }
  }, [selectedPlanetId, flyToPosition, planetAngles]);

  useEffect(() => {
    return () => {
      if (animRef.current !== null) {
        cancelAnimationFrame(animRef.current);
      }
    };
  }, []);

  useFrame((_, delta) => {
    updatePlanetPositions(delta);
  });

  return (
    <>
      <PerspectiveCamera
        makeDefault
        position={[0, 15 * Math.sin(Math.PI / 6), 15 * Math.cos(Math.PI / 6)]}
        fov={60}
        near={0.1}
        far={1000}
      />
      <OrbitControls
        ref={controlsRef}
        enableDamping
        dampingFactor={0.1}
        minDistance={5}
        maxDistance={30}
        onDoubleClick={() => {
          reset();
          resetCamera();
          onDoubleClick();
        }}
      />
    </>
  );
}

function SolarSystemScene() {
  const timeSpeed = useSolarSystemStore((s) => s.timeSpeed);
  const selectedPlanetId = useSolarSystemStore((s) => s.selectedPlanetId);
  const hoveredPlanetId = useSolarSystemStore((s) => s.hoveredPlanetId);
  const planetAngles = useSolarSystemStore((s) => s.planetAngles);
  const planetRotations = useSolarSystemStore((s) => s.planetRotations);
  const setHoveredPlanet = useSolarSystemStore((s) => s.setHoveredPlanet);
  const setSelectedPlanet = useSolarSystemStore((s) => s.setSelectedPlanet);

  return (
    <>
      <ambientLight intensity={0.1} />
      <Starfield />
      <Sun />

      {PLANETS.map((planet) => (
        <Orbit key={`orbit-${planet.id}`} radius={planet.orbitRadius} />
      ))}

      {PLANETS.map((planet) => (
        <Planet
          key={planet.id}
          data={planet}
          angle={planetAngles[planet.id] || 0}
          rotation={planetRotations[planet.id] || 0}
          isHovered={hoveredPlanetId === planet.id}
          isSelected={selectedPlanetId === planet.id}
          onPointerOver={(e) => {
            e.stopPropagation();
            setHoveredPlanet(planet.id);
            document.body.style.cursor = 'pointer';
          }}
          onPointerOut={() => {
            setHoveredPlanet(null);
            document.body.style.cursor = 'default';
          }}
          onClick={(e) => {
            e.stopPropagation();
            setSelectedPlanet(planet.id);
          }}
        />
      ))}
    </>
  );
}

export function Scene() {
  const handleDoubleClick = useCallback(() => {
    // handled inside CameraController
  }, []);

  return (
    <Canvas
      gl={{ antialias: false }}
      onPointerMissed={() => {
        useSolarSystemStore.getState().setSelectedPlanet(null);
      }}
    >
      <CameraController onDoubleClick={handleDoubleClick} />
      <SolarSystemScene />
    </Canvas>
  );
}
