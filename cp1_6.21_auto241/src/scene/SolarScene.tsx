import { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Stars, Html, Line } from '@react-three/drei';
import * as THREE from 'three';
import { useSolarStore } from '../store/useSolarStore';
import { SCENE_CONFIG, ANIMATION_CONFIG, COLORS } from '../utils/constants';
import type { PlanetBasic } from '../types/planet';

interface PlanetMeshProps {
  planet: PlanetBasic;
  segments: number;
  showLabel: boolean;
  onSelect: (id: string) => void;
  isPaused: boolean;
  speedMultiplier: number;
}

function PlanetMesh({ planet, segments, showLabel, onSelect, isPaused, speedMultiplier }: PlanetMeshProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const groupRef = useRef<THREE.Group>(null);
  const angleRef = useRef(Math.random() * Math.PI * 2);

  useFrame((_state, delta) => {
    if (!isPaused) {
      angleRef.current += delta * ANIMATION_CONFIG.baseOrbitSpeed * planet.orbitSpeed * speedMultiplier;
    }

    const x = Math.cos(angleRef.current) * planet.orbitRadius;
    const z = Math.sin(angleRef.current) * planet.orbitRadius;

    if (groupRef.current) {
      groupRef.current.position.x = x;
      groupRef.current.position.z = z;
    }

    if (meshRef.current && !isPaused) {
      meshRef.current.rotation.y += delta * ANIMATION_CONFIG.baseRotationSpeed * Math.abs(planet.rotationSpeed);
    }
  });

  const handleClick = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    onSelect(planet.id);
  };

  return (
    <group ref={groupRef}>
      <mesh
        ref={meshRef}
        onClick={handleClick}
        onPointerOver={(e) => {
          e.stopPropagation();
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          document.body.style.cursor = 'default';
        }}
      >
        <sphereGeometry args={[planet.radius, segments, segments]} />
        <meshStandardMaterial color={planet.color} />
      </mesh>

      {showLabel && (
        <Html
          position={[0, planet.radius + SCENE_CONFIG.labelOffset, 0]}
          center
          style={{
            pointerEvents: 'none',
            userSelect: 'none',
          }}
        >
          <div
            style={{
              color: 'white',
              fontSize: `${SCENE_CONFIG.labelFontSize}px`,
              textShadow: '0 0 4px rgba(0,0,0,0.8)',
              whiteSpace: 'nowrap',
              fontWeight: 500,
              opacity: 0,
              animation: 'fadeIn 0.5s ease-out forwards',
            }}
          >
            {planet.nameCn}
          </div>
        </Html>
      )}
    </group>
  );
}

interface OrbitLineProps {
  radius: number;
  visible: boolean;
}

function OrbitLine({ radius, visible }: OrbitLineProps) {
  const points = useMemo(() => {
    const pts: [number, number, number][] = [];
    const segments = 128;
    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      pts.push([Math.cos(angle) * radius, 0, Math.sin(angle) * radius]);
    }
    return pts;
  }, [radius]);

  if (!visible) return null;

  return (
    <Line
      points={points}
      color="white"
      transparent
      opacity={SCENE_CONFIG.orbitOpacity}
      lineWidth={SCENE_CONFIG.orbitLineWidth}
    />
  );
}

interface SunProps {
  glowIntensity: number;
  performanceMode: boolean;
}

function Sun({ glowIntensity, performanceMode }: SunProps) {
  const sunRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Sprite>(null);
  const glowPulseRef = useRef(0);

  useFrame((_state, delta) => {
    if (sunRef.current) {
      sunRef.current.rotation.y += delta * 0.1;
    }

    if (glowRef.current && !performanceMode) {
      glowPulseRef.current += delta * ANIMATION_CONFIG.glowPulseSpeed;
      const pulse = ANIMATION_CONFIG.minGlowScale + (ANIMATION_CONFIG.maxGlowScale - ANIMATION_CONFIG.minGlowScale) * (0.5 + 0.5 * Math.sin(glowPulseRef.current));
      const baseScale = SCENE_CONFIG.sunRadius * 3 * glowIntensity;
      glowRef.current.scale.set(baseScale * pulse, baseScale * pulse, 1);
    }
  });

  const glowTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;
    const gradient = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
    gradient.addColorStop(0, 'rgba(255, 215, 0, 1)');
    gradient.addColorStop(0.3, 'rgba(255, 165, 0, 0.6)');
    gradient.addColorStop(0.6, 'rgba(255, 69, 0, 0.3)');
    gradient.addColorStop(1, 'rgba(255, 69, 0, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 256, 256);
    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  }, []);

  const lightIntensity = 1.5 + glowIntensity * 2;

  return (
    <group>
      <mesh ref={sunRef}>
        <sphereGeometry args={[SCENE_CONFIG.sunRadius, 64, 64]} />
        <meshBasicMaterial color={COLORS.sunGlowInner} />
      </mesh>

      <pointLight color={COLORS.sunGlowInner} intensity={lightIntensity} distance={300} decay={2} />

      {!performanceMode && glowIntensity > 0 && (
        <sprite ref={glowRef} scale={[SCENE_CONFIG.sunRadius * 3 * glowIntensity, SCENE_CONFIG.sunRadius * 3 * glowIntensity, 1]}>
          <spriteMaterial map={glowTexture} transparent opacity={glowIntensity} depthWrite={false} />
        </sprite>
      )}
    </group>
  );
}

function CameraController() {
  const { camera } = useThree();
  const controlsRef = useRef<any>(null);
  const viewResetTrigger = useSolarStore((state) => state.viewResetTrigger);

  useEffect(() => {
    if (viewResetTrigger > 0 && controlsRef.current) {
      controlsRef.current.reset();
    }
  }, [viewResetTrigger]);

  useEffect(() => {
    camera.position.set(...SCENE_CONFIG.defaultCameraPosition);
  }, [camera]);

  return (
    <OrbitControls
      ref={controlsRef}
      enableDamping
      dampingFactor={0.05}
      minDistance={SCENE_CONFIG.minDistance}
      maxDistance={SCENE_CONFIG.maxDistance}
      maxPolarAngle={Math.PI}
      minPolarAngle={0}
      enablePan
      panSpeed={1}
      rotateSpeed={0.5}
      zoomSpeed={0.8}
    />
  );
}

interface SceneContentProps {
  planets: PlanetBasic[];
  showOrbits: boolean;
  showLabels: boolean;
  glowIntensity: number;
  speedMultiplier: number;
  isPaused: boolean;
  performanceMode: boolean;
  onSelectPlanet: (id: string) => void;
}

function SceneContent({
  planets,
  showOrbits,
  showLabels,
  glowIntensity,
  speedMultiplier,
  isPaused,
  performanceMode,
  onSelectPlanet,
}: SceneContentProps) {
  const segments = performanceMode ? SCENE_CONFIG.lowQualitySegments : SCENE_CONFIG.highQualitySegments;

  return (
    <>
      <ambientLight intensity={0.1} />
      <Stars radius={300} depth={60} count={5000} factor={7} saturation={0} fade speed={1} />

      <Sun glowIntensity={glowIntensity} performanceMode={performanceMode} />

      {planets.map((planet) => (
        <OrbitLine key={`orbit-${planet.id}`} radius={planet.orbitRadius} visible={showOrbits} />
      ))}

      {planets.map((planet) => (
        <PlanetMesh
          key={planet.id}
          planet={planet}
          segments={segments}
          showLabel={showLabels}
          onSelect={onSelectPlanet}
          isPaused={isPaused}
          speedMultiplier={speedMultiplier}
        />
      ))}

      <CameraController />
    </>
  );
}

export default function SolarScene() {
  const planets = useSolarStore((state) => state.planets);
  const showOrbits = useSolarStore((state) => state.showOrbits);
  const showLabels = useSolarStore((state) => state.showLabels);
  const glowIntensity = useSolarStore((state) => state.glowIntensity);
  const speedMultiplier = useSolarStore((state) => state.speedMultiplier);
  const isPaused = useSolarStore((state) => state.isPaused);
  const performanceMode = useSolarStore((state) => state.performanceMode);
  const setSelectedPlanetId = useSolarStore((state) => state.setSelectedPlanetId);

  const handleCanvasClick = () => {
    setSelectedPlanetId(null);
  };

  const handleSelectPlanet = (id: string) => {
    setSelectedPlanetId(id);
  };

  return (
    <div style={{ width: '100%', height: '100%' }} onClick={handleCanvasClick}>
      <Canvas
        camera={{ position: SCENE_CONFIG.defaultCameraPosition, fov: 60, near: 0.1, far: 1000 }}
        style={{ background: COLORS.background }}
        onClick={handleCanvasClick}
        gl={{ antialias: !performanceMode }}
      >
        <SceneContent
          planets={planets}
          showOrbits={showOrbits}
          showLabels={showLabels}
          glowIntensity={glowIntensity}
          speedMultiplier={speedMultiplier}
          isPaused={isPaused}
          performanceMode={performanceMode}
          onSelectPlanet={handleSelectPlanet}
        />
      </Canvas>
    </div>
  );
}
