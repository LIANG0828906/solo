import React, { useRef, useMemo, useEffect, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Html, useProgress, SpotLight, Environment } from '@react-three/drei';
import * as THREE from 'three';
import {
  Artifact,
  LightingPreset,
  DisplayMode,
  AnnotationPoint,
} from './types';

interface SceneProps {
  artifacts: Artifact[];
  groupedArtifacts: Record<number, Artifact[]>;
  pedestalPositions: [number, number, number][];
  lightingPreset: LightingPreset;
  displayMode: DisplayMode;
  isRoamingPaused: boolean;
  selectedArtifactId: string | null;
  selectedForCompare: string[];
  isCompareMode: boolean;
  weatheringSlider: number;
  hoveredArtifactId: string | null;
  activeAnnotationId: string | null;
  onArtifactClick: (id: string) => void;
  onArtifactHover: (id: string | null) => void;
  onAnnotationClick: (id: string) => void;
}

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16) / 255,
        g: parseInt(result[2], 16) / 255,
        b: parseInt(result[3], 16) / 255,
      }
    : { r: 0, g: 0, b: 0 };
}

function mixColors(color1: string, color2: string, t: number): THREE.Color {
  const c1 = hexToRgb(color1);
  const c2 = hexToRgb(color2);
  return new THREE.Color(
    lerp(c1.r, c2.r, t),
    lerp(c1.g, c2.g, t),
    lerp(c1.b, c2.b, t)
  );
}

function Loader() {
  const { progress } = useProgress();
  return (
    <Html center style={{ pointerEvents: 'none' }}>
      <div
        style={{
          background: 'rgba(26, 26, 46, 0.9)',
          padding: '20px 32px',
          borderRadius: 12,
          border: '1px solid rgba(212, 175, 55, 0.3)',
          color: '#d4af37',
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: 14, marginBottom: 10 }}>文物加载中...</div>
        <div
          style={{
            width: 200, height: 4,
            background: 'rgba(255,255,255,0.1)',
            borderRadius: 2,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${progress}%`,
              height: '100%',
              background: 'linear-gradient(90deg, #d4af37, #f0d78c)',
              transition: 'width 300ms ease',
            }}
          />
        </div>
        <div style={{ fontSize: 11, marginTop: 6, color: 'rgba(255,255,255,0.5)' }}>
          {progress.toFixed(0)}%
        </div>
      </div>
    </Html>
  );
}

function BreathingLight({ position, intensity = 1 }: { position: [number, number, number]; intensity?: number }) {
  const lightRef = useRef<THREE.PointLight>(null);
  useFrame((state) => {
    if (lightRef.current) {
      const t = state.clock.elapsedTime;
      lightRef.current.intensity = (0.6 + Math.sin(t * 1.5) * 0.4) * intensity;
    }
  });
  return (
    <pointLight
      ref={lightRef}
      position={[position[0], position[1] + 1.2, position[2]]}
      color="#d4af37"
      distance={6}
      decay={2}
    />
  );
}

interface PedestalProps {
  position: [number, number, number];
  children: React.ReactNode;
  spotIntensity: number;
}

function Pedestal({ position, children, spotIntensity }: PedestalProps) {
  const [hovered, setHovered] = useState(false);

  return (
    <group position={position}>
      <mesh
        position={[0, 0.5, 0]}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        receiveShadow
      >
        <cylinderGeometry args={[1.6, 1.8, 1, 48]} />
        <meshPhysicalMaterial
          color="#1a1a2e"
          transparent
          opacity={0.85}
          roughness={0.15}
          metalness={0.3}
          clearcoat={1}
        />
      </mesh>

      <mesh position={[0, 1.01, 0]}>
        <cylinderGeometry args={[1.58, 1.58, 0.02, 48]} />
        <meshPhysicalMaterial
          color={hovered ? '#d4af37' : '#2a2a4e'}
          transparent
          opacity={0.9}
          emissive={hovered ? '#d4af37' : '#000000'}
          emissiveIntensity={hovered ? 0.25 : 0}
          roughness={0.1}
          metalness={0.9}
        />
      </mesh>

      <mesh position={[0, 1.02, 0]}>
        <ringGeometry args={[1.5, 1.58, 64]} />
        <meshBasicMaterial
          color="#d4af37"
          transparent
          opacity={0.7}
          side={THREE.DoubleSide}
        />
      </mesh>

      <BreathingLight position={[0, 0, 0]} intensity={spotIntensity * 0.8} />

      {children}
    </group>
  );
}

interface ArtifactMeshProps {
  artifact: Artifact;
  isHovered: boolean;
  isSelected: boolean;
  isCompareSelected: boolean;
  isInspecting: boolean;
  weathering: number;
  onClick: () => void;
  onHover: (hovered: boolean) => void;
  onAnnotationClick: (id: string) => void;
  activeAnnotationId: string | null;
  showAnnotations: boolean;
  overridePosition?: [number, number, number];
  disableAutoRotate?: boolean;
  stopAutoRotate?: boolean;
}

function createArtifactGeometry(geometryType: Artifact['geometryType']): THREE.BufferGeometry {
  switch (geometryType) {
    case 'ding': {
      const shape = new THREE.CylinderGeometry(0.85, 0.95, 0.9, 8, 1);
      return shape;
    }
    case 'zun': {
      const pts: THREE.Vector2[] = [];
      for (let i = 0; i <= 20; i++) {
        const t = i / 19;
        let r;
        if (t < 0.2) r = 0.25 + t * 2;
        else if (t < 0.8) r = 0.75 - (t - 0.2) * 0.3;
        else r = 0.5 - (t - 0.8) * 0.8;
        pts.push(new THREE.Vector2(r * 0.7, t * 1.2 - 0.1));
      }
      return new THREE.LatheGeometry(pts, 48);
    }
    case 'hu': {
      const pts: THREE.Vector2[] = [];
      for (let i = 0; i <= 24; i++) {
        const t = i / 23;
        const r = Math.sin(t * Math.PI) * 0.6 + 0.2;
        pts.push(new THREE.Vector2(r * 0.75, t * 1.0 + 0.05));
      }
      return new THREE.LatheGeometry(pts, 48);
    }
    case 'amphora': {
      const pts: THREE.Vector2[] = [];
      for (let i = 0; i <= 28; i++) {
        const t = i / 27;
        let r;
        if (t < 0.15) r = 0.15 + t * 1.5;
        else if (t < 0.75) r = 0.55 + Math.sin((t - 0.15) / 0.6 * Math.PI) * 0.4;
        else r = 0.55 - (t - 0.75) * 1.8;
        pts.push(new THREE.Vector2(r * 0.7, t * 1.4));
      }
      return new THREE.LatheGeometry(pts, 48);
    }
    case 'kylix': {
      return new THREE.CylinderGeometry(0.85, 0.35, 0.35, 48);
    }
    case 'hydria': {
      const pts: THREE.Vector2[] = [];
      for (let i = 0; i <= 26; i++) {
        const t = i / 25;
        let r;
        if (t < 0.1) r = 0.2 + t * 3;
        else if (t < 0.7) r = 0.65 + Math.sin((t - 0.1) / 0.6 * Math.PI) * 0.35;
        else r = 0.65 - (t - 0.7) * 2;
        pts.push(new THREE.Vector2(r * 0.8, t * 1.3 + 0.05));
      }
      return new THREE.LatheGeometry(pts, 48);
    }
    case 'mask': {
      return new THREE.SphereGeometry(0.55, 48, 48, 0, Math.PI * 2, 0, Math.PI * 0.85);
    }
    case 'pendant': {
      return new THREE.TorusGeometry(0.55, 0.18, 32, 64);
    }
    case 'figure': {
      return new THREE.CapsuleGeometry(0.22, 0.7, 16, 32);
    }
    case 'jue':
    default:
      return new THREE.CylinderGeometry(0.4, 0.5, 0.9, 32);
  }
}

function ArtifactMesh({
  artifact,
  isHovered,
  isSelected,
  isCompareSelected,
  isInspecting,
  weathering,
  onClick,
  onHover,
  onAnnotationClick,
  activeAnnotationId,
  showAnnotations,
  overridePosition,
  disableAutoRotate,
  stopAutoRotate,
}: ArtifactMeshProps) {
  const groupRef = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.Mesh>(null);

  const material = useMemo(() => {
    const weatheredColor = mixColors(artifact.baseColor, '#4a4033', weathering * 0.6);
    return new THREE.MeshPhysicalMaterial({
      color: weatheredColor,
      roughness: 0.25 + weathering * 0.55,
      metalness: artifact.category === 'bronze' ? 0.75 - weathering * 0.35 : 0.1 + weathering * 0.1,
      clearcoat: 0.3,
      clearcoatRoughness: 0.2,
    });
  }, [artifact.baseColor, artifact.category, weathering]);

  useEffect(() => {
    if (meshRef.current) {
      const m = meshRef.current.material as THREE.MeshPhysicalMaterial;
      const weatheredColor = mixColors(artifact.baseColor, '#4a4033', weathering * 0.6);
      m.color.copy(weatheredColor);
      m.roughness = 0.25 + weathering * 0.55;
      m.metalness = artifact.category === 'bronze' ? 0.75 - weathering * 0.35 : 0.1 + weathering * 0.1;
      m.needsUpdate = true;
    }
  }, [weathering, artifact.baseColor, artifact.category]);

  useFrame((state, delta) => {
    if (groupRef.current && !stopAutoRotate && !disableAutoRotate && !isInspecting && !isSelected) {
      groupRef.current.rotation.y += delta * 0.05;
    }
  });

  const geometry = useMemo(() => createArtifactGeometry(artifact.geometryType), [artifact.geometryType]);

  const highlightIntensity = (isHovered || isCompareSelected) && !isInspecting ? 0.35 : 0;

  return (
    <group
      ref={groupRef}
      position={overridePosition || artifact.position}
      scale={artifact.scale}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        onHover(true);
      }}
      onPointerOut={(e) => {
        e.stopPropagation();
        onHover(false);
      }}
    >
      <mesh ref={meshRef} geometry={geometry} material={material} castShadow receiveShadow>
        <meshPhysicalMaterial
          attach="material"
          color={material.color}
          emissive={isHovered || isCompareSelected ? '#d4af37' : '#000000'}
          emissiveIntensity={highlightIntensity}
          transparent
          opacity={1}
          roughness={material.roughness}
          metalness={material.metalness}
        />
      </mesh>

      {isHovered && !isInspecting && !isSelected && (
        <pointLight position={[0, 0.8, 0]} color="#d4af37" intensity={1.5} distance={3} />
      )}

      {showAnnotations && artifact.annotations.map((ann) => (
        <AnnotationMarker
          key={ann.id}
          annotation={ann}
          isActive={activeAnnotationId === ann.id}
          onClick={() => onAnnotationClick(ann.id)}
        />
      ))}
    </group>
  );
}

interface AnnotationMarkerProps {
  annotation: AnnotationPoint;
  isActive: boolean;
  onClick: () => void;
}

function AnnotationMarker({ annotation, isActive, onClick }: AnnotationMarkerProps) {
  const markerRef = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (markerRef.current) {
      const t = state.clock.elapsedTime;
      const scale = 1 + Math.sin(t * 3) * 0.25;
      markerRef.current.scale.setScalar(isActive ? scale * 1.4 : scale);
    }
  });

  const colorMap: Record<string, string> = {
    inscription: '#d4af37',
    repair: '#5dade2',
    crack: '#e74c3c',
    texture: '#58d68d',
  };

  return (
    <group position={annotation.position}>
      <mesh
        ref={markerRef}
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
      >
        <sphereGeometry args={[0.035, 24, 24]} />
        <meshBasicMaterial color={colorMap[annotation.type]} transparent opacity={0.95} />
      </mesh>
      <mesh>
        <sphereGeometry args={[0.07, 16, 16]} />
        <meshBasicMaterial
          color={colorMap[annotation.type]}
          transparent
          opacity={isActive ? 0.5 : 0.25}
        />
      </mesh>
    </group>
  );
}

interface CameraRigProps {
  displayMode: DisplayMode;
  isRoamingPaused: boolean;
  selectedArtifact: Artifact | null;
  isCompareMode: boolean;
  compareArtifacts: Artifact[];
  pedestalPositions: [number, number, number][];
}

function CameraRig({
  displayMode,
  isRoamingPaused,
  selectedArtifact,
  isCompareMode,
  compareArtifacts,
  pedestalPositions,
}: CameraRigProps) {
  const { camera } = useThree();
  const controlsRef = useRef<any>(null);
  const roamingAngleRef = useRef(0);
  const targetPosition = useRef(new THREE.Vector3(0, 4, 13));
  const targetLookAt = useRef(new THREE.Vector3(0, 1.5, 0));
  const animProgress = useRef(0);
  const startPosition = useRef(new THREE.Vector3());
  const startLookAt = useRef(new THREE.Vector3());
  const isAnimatingRef = useRef(false);
  const prevSelectedId = useRef<string | null>(null);
  const prevCompareMode = useRef(false);

  useEffect(() => {
    const posChanged =
      (selectedArtifact?.id || null) !== prevSelectedId.current ||
      isCompareMode !== prevCompareMode.current;

    if (posChanged) {
      startPosition.current.copy(camera.position);
      startLookAt.current.copy(
        controlsRef.current?.target || new THREE.Vector3(0, 1.5, 0)
      );

      if (selectedArtifact) {
        const basePos = pedestalPositions[selectedArtifact.pedestalIndex];
        const artPos = selectedArtifact.position;
        const worldX = basePos[0] + artPos[0];
        const worldY = basePos[1] + artPos[1];
        const worldZ = basePos[2] + artPos[2];
        targetPosition.current.set(worldX + 0.5, worldY + 1.3, worldZ + 2.5);
        targetLookAt.current.set(worldX, worldY + 0.4, worldZ);
      } else if (isCompareMode && compareArtifacts.length === 2) {
        targetPosition.current.set(0, 2.5, 6);
        targetLookAt.current.set(0, 1.5, 0);
      } else {
        targetPosition.current.set(0, 4, 13);
        targetLookAt.current.set(0, 1.5, 0);
      }

      animProgress.current = 0;
      isAnimatingRef.current = true;
      prevSelectedId.current = selectedArtifact?.id || null;
      prevCompareMode.current = isCompareMode;
    }
  }, [selectedArtifact, isCompareMode, compareArtifacts, pedestalPositions, camera]);

  useFrame((state, delta) => {
    if (displayMode === DisplayMode.ROAMING && !selectedArtifact && !isCompareMode) {
      if (!isRoamingPaused) {
        roamingAngleRef.current += delta * 0.12;
      }
      const a = 10;
      const b = 6;
      const angle = roamingAngleRef.current;
      const y = 3.5 + Math.sin(angle * 0.5) * 1.2;
      camera.position.set(
        Math.cos(angle) * a,
        y,
        Math.sin(angle) * b
      );
      camera.lookAt(0, 1.5, 0);
      if (controlsRef.current) {
        controlsRef.current.target.set(0, 1.5, 0);
        controlsRef.current.update();
      }
    } else if (isAnimatingRef.current) {
      animProgress.current = Math.min(animProgress.current + delta * 1.3, 1);
      const t = easeInOutCubic(animProgress.current);
      camera.position.lerpVectors(startPosition.current, targetPosition.current, t);
      if (controlsRef.current) {
        controlsRef.current.target.lerpVectors(startLookAt.current, targetLookAt.current, t);
        controlsRef.current.update();
      }
      if (animProgress.current >= 1) {
        isAnimatingRef.current = false;
      }
    } else if (controlsRef.current) {
      controlsRef.current.update();
    }
  });

  const isInspecting = !!selectedArtifact;

  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      enableDamping
      dampingFactor={0.08}
      enablePan={false}
      minDistance={isInspecting ? 0.8 : 4}
      maxDistance={isInspecting ? 4 : 25}
      maxPolarAngle={isInspecting ? Math.PI * 0.85 : Math.PI * 0.52}
      minPolarAngle={isInspecting ? 0.15 : Math.PI * 0.18}
      enabled={displayMode !== DisplayMode.ROAMING || !!selectedArtifact || isCompareMode}
    />
  );
}

interface LightingManagerProps {
  preset: LightingPreset;
  pedestalPositions: [number, number, number][];
}

function LightingManager({ preset, pedestalPositions }: LightingManagerProps) {
  const ambientRef = useRef<THREE.AmbientLight>(null);
  const directionalRef = useRef<THREE.DirectionalLight>(null);
  const hemiRef = useRef<THREE.HemisphereLight>(null);
  const { scene } = useThree();

  const currentPresetRef = useRef(preset);
  const transitionProgress = useRef(0);
  const prevPresetRef = useRef(preset);

  useEffect(() => {
    if (preset.mode !== currentPresetRef.current.mode) {
      prevPresetRef.current = currentPresetRef.current;
      transitionProgress.current = 0;
    }
    currentPresetRef.current = preset;
  }, [preset]);

  useFrame((_, delta) => {
    if (transitionProgress.current < 1) {
      transitionProgress.current = Math.min(transitionProgress.current + delta, 1);
    }
    const t = easeInOutCubic(transitionProgress.current);
    const prev = prevPresetRef.current;

    if (ambientRef.current) {
      const targetColor = mixColors(prev.ambientColor, preset.ambientColor, t);
      ambientRef.current.color.copy(targetColor);
      ambientRef.current.intensity = lerp(prev.ambientIntensity, preset.ambientIntensity, t);
    }
    if (directionalRef.current) {
      const targetColor = mixColors(prev.directionalColor, preset.directionalColor, t);
      directionalRef.current.color.copy(targetColor);
      directionalRef.current.intensity = lerp(prev.directionalIntensity, preset.directionalIntensity, t);
      directionalRef.current.position.set(
        lerp(prev.directionalPosition[0], preset.directionalPosition[0], t),
        lerp(prev.directionalPosition[1], preset.directionalPosition[1], t),
        lerp(prev.directionalPosition[2], preset.directionalPosition[2], t)
      );
    }
    if (scene.fog instanceof THREE.FogExp2) {
      const targetFog = mixColors(prev.fogColor, preset.fogColor, t);
      scene.fog.color.copy(targetFog);
      scene.fog.density = lerp(prev.fogDensity, preset.fogDensity, t);
    }
    const targetBg = mixColors(prev.background, preset.background, t);
    scene.background = targetBg;
  });

  return (
    <>
      <ambientLight ref={ambientRef} intensity={preset.ambientIntensity} color={preset.ambientColor} />
      <hemisphereLight
        ref={hemiRef}
        args={[preset.ambientColor, '#1a1a2e', 0.4]}
      />
      <directionalLight
        ref={directionalRef}
        position={preset.directionalPosition}
        intensity={preset.directionalIntensity}
        color={preset.directionalColor}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-left={-15}
        shadow-camera-right={15}
        shadow-camera-top={15}
        shadow-camera-bottom={-15}
      />
      {pedestalPositions.map((pos, i) => (
        <SpotLight
          key={i}
          position={[pos[0], 5, pos[2] - 0.5]}
          angle={0.55}
          penumbra={0.65}
          intensity={preset.spotIntensity}
          castShadow
          distance={12}
          color="#fff5dd"
          target-position={[pos[0], 1, pos[2]]}
        />
      ))}
    </>
  );
}

function GalleryRoom({ fogColor }: { fogColor: string }) {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[50, 50]} />
        <meshStandardMaterial color="#16162a" roughness={0.85} metalness={0.1} />
      </mesh>

      {[-18, -12, -6, 0, 6, 12, 18].map((x, i) => (
        <mesh key={`column-${i}`} position={[x, 3, -12]}>
          <boxGeometry args={[0.15, 6, 0.15]} />
          <meshStandardMaterial color="#252545" metalness={0.4} roughness={0.5} />
        </mesh>
      ))}

      <mesh position={[0, 6, -12]}>
        <boxGeometry args={[40, 0.2, 0.4]} />
        <meshStandardMaterial color="#2a2a50" metalness={0.5} roughness={0.3} />
      </mesh>

      {[-8, 0, 8].map((x, i) => (
        <mesh key={`plinth-${i}`} position={[x, 0.05, -9]} receiveShadow>
          <boxGeometry args={[5, 0.1, 0.8]} />
          <meshStandardMaterial color="#1f1f3e" metalness={0.2} roughness={0.8} />
        </mesh>
      ))}
    </group>
  );
}

interface CompareViewProps {
  compareArtifacts: Artifact[];
  weathering: number;
  activeAnnotationId: string | null;
  onAnnotationClick: (id: string) => void;
}

function CompareView({
  compareArtifacts,
  weathering,
  activeAnnotationId,
  onAnnotationClick,
}: CompareViewProps) {
  const groupARef = useRef<THREE.Group>(null);
  const groupBRef = useRef<THREE.Group>(null);
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setEntered(true), 50);
    return () => clearTimeout(timer);
  }, []);

  useFrame((state, delta) => {
    if (groupARef.current) {
      const targetX = entered ? -2 : -6;
      groupARef.current.position.x += (targetX - groupARef.current.position.x) * Math.min(delta * 3, 1);
    }
    if (groupBRef.current) {
      const targetX = entered ? 2 : 6;
      groupBRef.current.position.x += (targetX - groupBRef.current.position.x) * Math.min(delta * 3, 1);
    }
  });

  if (compareArtifacts.length < 2) return null;

  return (
    <group>
      <group ref={groupARef} position={[-6, 1.8, 0]}>
        <ArtifactMesh
          artifact={compareArtifacts[0]}
          isHovered={false}
          isSelected={false}
          isCompareSelected={false}
          isInspecting={true}
          weathering={weathering}
          onClick={() => {}}
          onHover={() => {}}
          onAnnotationClick={onAnnotationClick}
          activeAnnotationId={activeAnnotationId}
          showAnnotations={false}
          overridePosition={[0, 0, 0]}
          stopAutoRotate
        />
        <Html center position={[0, -1.4, 0]}>
          <div
            style={{
              background: 'rgba(26,26,46,0.95)',
              padding: '10px 18px',
              borderRadius: 8,
              border: '1px solid rgba(212,175,55,0.4)',
              textAlign: 'center',
              minWidth: 180,
            }}
          >
            <div style={{ fontSize: 15, fontWeight: 600, color: '#d4af37', marginBottom: 4 }}>
              {compareArtifacts[0].name}
            </div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>
              {compareArtifacts[0].era} · {compareArtifacts[0].material}
            </div>
          </div>
        </Html>
      </group>

      <group ref={groupBRef} position={[6, 1.8, 0]}>
        <ArtifactMesh
          artifact={compareArtifacts[1]}
          isHovered={false}
          isSelected={false}
          isCompareSelected={false}
          isInspecting={true}
          weathering={weathering}
          onClick={() => {}}
          onHover={() => {}}
          onAnnotationClick={onAnnotationClick}
          activeAnnotationId={activeAnnotationId}
          showAnnotations={false}
          overridePosition={[0, 0, 0]}
          stopAutoRotate
        />
        <Html center position={[0, -1.4, 0]}>
          <div
            style={{
              background: 'rgba(26,26,46,0.95)',
              padding: '10px 18px',
              borderRadius: 8,
              border: '1px solid rgba(212,175,55,0.4)',
              textAlign: 'center',
              minWidth: 180,
            }}
          >
            <div style={{ fontSize: 15, fontWeight: 600, color: '#d4af37', marginBottom: 4 }}>
              {compareArtifacts[1].name}
            </div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>
              {compareArtifacts[1].era} · {compareArtifacts[1].material}
            </div>
          </div>
        </Html>
      </group>
    </group>
  );
}

const Scene: React.FC<SceneProps> = ({
  artifacts,
  groupedArtifacts,
  pedestalPositions,
  lightingPreset,
  displayMode,
  isRoamingPaused,
  selectedArtifactId,
  selectedForCompare,
  isCompareMode,
  weatheringSlider,
  hoveredArtifactId,
  activeAnnotationId,
  onArtifactClick,
  onArtifactHover,
  onAnnotationClick,
}) => {
  const selectedArtifact = artifacts.find(a => a.id === selectedArtifactId) || null;
  const compareArtifacts = selectedForCompare.map(id => artifacts.find(a => a.id === id)!).filter(Boolean);

  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      camera={{ position: [0, 4, 13], fov: 50, near: 0.1, far: 100 }}
      gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
      style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }}
      onCreated={({ scene }) => {
        scene.fog = new THREE.FogExp2(lightingPreset.fogColor, lightingPreset.fogDensity);
        scene.background = new THREE.Color(lightingPreset.background);
      }}
    >
      <React.Suspense fallback={<Loader />}>
        <LightingManager preset={lightingPreset} pedestalPositions={pedestalPositions} />
        <GalleryRoom fogColor={lightingPreset.fogColor} />

        {pedestalPositions.map((pos, idx) => (
          <Pedestal key={idx} position={pos} spotIntensity={lightingPreset.spotIntensity}>
            {groupedArtifacts[idx]?.map((artifact) => {
              const isSelected = selectedArtifactId === artifact.id;
              const isHovered = hoveredArtifactId === artifact.id;
              const isCompareSelected = selectedForCompare.includes(artifact.id);
              const shouldHide = isSelected || (isCompareMode && !selectedForCompare.includes(artifact.id));
              if (shouldHide) return null;
              return (
                <ArtifactMesh
                  key={artifact.id}
                  artifact={artifact}
                  isHovered={isHovered}
                  isSelected={isSelected}
                  isCompareSelected={isCompareSelected}
                  isInspecting={!!isSelected}
                  weathering={weatheringSlider}
                  onClick={() => onArtifactClick(artifact.id)}
                  onHover={(h) => onArtifactHover(h ? artifact.id : null)}
                  onAnnotationClick={onAnnotationClick}
                  activeAnnotationId={activeAnnotationId}
                  showAnnotations={!!isSelected}
                />
              );
            })}
          </Pedestal>
        ))}

        {isCompareMode && compareArtifacts.length === 2 && (
          <CompareView
            compareArtifacts={compareArtifacts}
            weathering={weatheringSlider}
            activeAnnotationId={activeAnnotationId}
            onAnnotationClick={onAnnotationClick}
          />
        )}

        <CameraRig
          displayMode={displayMode}
          isRoamingPaused={isRoamingPaused}
          selectedArtifact={selectedArtifact}
          isCompareMode={isCompareMode && compareArtifacts.length === 2}
          compareArtifacts={compareArtifacts}
          pedestalPositions={pedestalPositions}
        />
      </React.Suspense>
    </Canvas>
  );
};

export default Scene;
