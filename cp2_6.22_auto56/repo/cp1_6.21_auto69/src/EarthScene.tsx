import { useRef, useMemo, useCallback } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import {
  type Earthquake,
  magnitudeToRadius,
  magnitudeToHex,
  depthToOffset,
} from './quakeData';
import { type InteractionManager } from './interaction';

const EARTH_RADIUS = 2;

function latLngToVector3(lat: number, lng: number, radius: number): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -(radius * Math.sin(phi) * Math.cos(theta)),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
}

function EarthGlobe() {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.02;
    }
  });

  const earthMaterial = useMemo(
    () =>
      new THREE.MeshPhongMaterial({
        color: 0x0d2137,
        emissive: 0x071422,
        emissiveIntensity: 0.4,
        specular: 0x1a4a6e,
        shininess: 15,
        transparent: true,
        opacity: 0.95,
      }),
    []
  );

  return (
    <group>
      <mesh ref={meshRef} material={earthMaterial}>
        <sphereGeometry args={[EARTH_RADIUS, 64, 64]} />
      </mesh>
      <GridLines />
    </group>
  );
}

function GridLines() {
  const gridRef = useRef<THREE.Group>(null);

  const lineObjects = useMemo(() => {
    const objects: THREE.Line[] = [];
    const r = EARTH_RADIUS + 0.002;
    const lineMaterial = new THREE.LineBasicMaterial({
      color: 0x1a4a6e,
      transparent: true,
      opacity: 0.3,
    });

    for (let lat = -60; lat <= 60; lat += 30) {
      const points: THREE.Vector3[] = [];
      for (let lng = 0; lng <= 360; lng += 2) {
        points.push(latLngToVector3(lat, lng - 180, r));
      }
      const geom = new THREE.BufferGeometry().setFromPoints(points);
      objects.push(new THREE.Line(geom, lineMaterial));
    }

    for (let lng = -180; lng < 180; lng += 30) {
      const points: THREE.Vector3[] = [];
      for (let lat = -90; lat <= 90; lat += 2) {
        points.push(latLngToVector3(lat, lng, r));
      }
      const geom = new THREE.BufferGeometry().setFromPoints(points);
      objects.push(new THREE.Line(geom, lineMaterial));
    }

    return objects;
  }, []);

  useFrame((_, delta) => {
    if (gridRef.current) {
      gridRef.current.rotation.y += delta * 0.02;
    }
  });

  return (
    <group ref={gridRef}>
      {lineObjects.map((obj, i) => (
        <primitive key={i} object={obj} />
      ))}
    </group>
  );
}

function Atmosphere() {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * (2 * Math.PI) / 12;
    }
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[EARTH_RADIUS * 1.02, 64, 64]} />
      <meshPhongMaterial
        color={0x88ccff}
        transparent
        opacity={0.3}
        side={THREE.BackSide}
        depthWrite={false}
      />
    </mesh>
  );
}

function QuakeMarker({
  quake,
  isHovered,
  interaction,
  onPointerOver,
  onPointerOut,
}: {
  quake: Earthquake;
  isHovered: boolean;
  interaction: InteractionManager;
  onPointerOver: () => void;
  onPointerOut: () => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const timeRef = useRef(0);

  const baseRadius = magnitudeToRadius(quake.magnitude);
  const color = magnitudeToHex(quake.magnitude);
  const depthOff = depthToOffset(quake.depth);
  const position = latLngToVector3(
    quake.latitude,
    quake.longitude,
    EARTH_RADIUS + 0.01 + depthOff
  );

  const handleClick = useCallback(
    (e: ThreeEvent) => {
      e.stopPropagation();
      interaction.onQuakeClick(quake, { x: 0, y: 0 });
    },
    [interaction, quake]
  );

  const handlePointerOver = useCallback(
    (e: ThreeEvent) => {
      e.stopPropagation();
      onPointerOver();
    },
    [onPointerOver]
  );

  useFrame((_, delta) => {
    timeRef.current += delta;
    const breathe = 1.0 + 0.1 * Math.sin((timeRef.current * 2 * Math.PI) / 1.5);
    const hoverScale = isHovered ? 1.3 : 1.0;
    const scale = breathe * hoverScale;

    if (meshRef.current) {
      meshRef.current.scale.setScalar(scale);
    }
    if (glowRef.current) {
      glowRef.current.scale.setScalar(scale * 1.5);
      const mat = glowRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.15 + 0.05 * Math.sin((timeRef.current * 2 * Math.PI) / 1.5);
    }
  });

  return (
    <group position={position}>
      <mesh
        ref={meshRef}
        onClick={handleClick}
        onPointerOver={handlePointerOver}
        onPointerOut={onPointerOut}
      >
        <sphereGeometry args={[baseRadius, 16, 16]} />
        <meshBasicMaterial color={color} transparent opacity={0.9} />
      </mesh>
      <mesh ref={glowRef}>
        <sphereGeometry args={[baseRadius, 16, 16]} />
        <meshBasicMaterial color={color} transparent opacity={0.15} depthWrite={false} />
      </mesh>
      {isHovered && (
        <sprite position={[0, baseRadius * 3 + 0.05, 0]} scale={[0.5, 0.25, 1]}>
          <spriteMaterial color={0xffffff} transparent opacity={0.9} />
        </sprite>
      )}
    </group>
  );
}

type ThreeEvent = { stopPropagation: () => void };

function QuakeMarkers({
  earthquakes,
  interaction,
  hoveredId,
  setHoveredId,
}: {
  earthquakes: Earthquake[];
  interaction: InteractionManager;
  hoveredId: string | null;
  setHoveredId: (id: string | null) => void;
}) {
  return (
    <group>
      {earthquakes.map((eq) => (
        <QuakeMarker
          key={eq.id}
          quake={eq}
          isHovered={hoveredId === eq.id}
          interaction={interaction}
          onPointerOver={() => setHoveredId(eq.id)}
          onPointerOut={() => setHoveredId(null)}
        />
      ))}
    </group>
  );
}

function Scene({
  earthquakes,
  interaction,
  hoveredId,
  setHoveredId,
}: {
  earthquakes: Earthquake[];
  interaction: InteractionManager;
  hoveredId: string | null;
  setHoveredId: (id: string | null) => void;
}) {
  return (
    <>
      <ambientLight intensity={0.3} />
      <directionalLight position={[5, 3, 5]} intensity={0.8} color={0xffffff} />
      <directionalLight position={[-5, -2, -3]} intensity={0.2} color={0x88ccff} />
      <pointLight position={[0, 0, 0]} intensity={0.1} color={0x88ccff} />
      <OrbitControls
        enableDamping
        dampingFactor={0.08}
        minDistance={EARTH_RADIUS * 1.2}
        maxDistance={EARTH_RADIUS * 8}
        enablePan={false}
        rotateSpeed={0.5}
        zoomSpeed={0.8}
      />
      <EarthGlobe />
      <Atmosphere />
      <QuakeMarkers
        earthquakes={earthquakes}
        interaction={interaction}
        hoveredId={hoveredId}
        setHoveredId={setHoveredId}
      />
    </>
  );
}

export default function EarthScene({
  earthquakes,
  interaction,
  hoveredId,
  setHoveredId,
}: {
  earthquakes: Earthquake[];
  interaction: InteractionManager;
  hoveredId: string | null;
  setHoveredId: (id: string | null) => void;
}) {
  const cameraPosition = useMemo(() => latLngToVector3(0, 150, EARTH_RADIUS * 3.2), []);

  return (
    <Canvas
      gl={{ antialias: true, alpha: false }}
      style={{ background: '#0a0b1a' }}
      camera={{ position: cameraPosition, fov: 50, near: 0.1, far: 100 }}
    >
      <Scene
        earthquakes={earthquakes}
        interaction={interaction}
        hoveredId={hoveredId}
        setHoveredId={setHoveredId}
      />
    </Canvas>
  );
}
