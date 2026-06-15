import React, { useRef, useMemo, useEffect, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Html, useProgress, SpotLight, useGLTF, Detailed, Edges } from '@react-three/drei';
import * as THREE from 'three';
import {
  Artifact,
  LightingPreset,
  DisplayMode,
  AnnotationPoint,
  ArtifactCategory,
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

function createNoiseTexture(size: number = 512): THREE.Texture {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const imageData = ctx.createImageData(size, size);
  for (let i = 0; i < imageData.data.length; i += 4) {
    const value = Math.random() * 255;
    imageData.data[i] = value;
    imageData.data[i + 1] = value;
    imageData.data[i + 2] = value;
    imageData.data[i + 3] = 255;
  }
  ctx.putImageData(imageData, 0, 0);
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

function createWeatheringMaterial(
  baseColor: string,
  category: ArtifactCategory,
  weathering: number,
  noiseTexture: THREE.Texture
): THREE.MeshPhysicalMaterial {
  const color = new THREE.Color(baseColor);
  const agedColor = mixColors(baseColor, '#3a2f20', weathering * 0.6);
  
  const roughness = lerp(0.18, 0.85, weathering);
  const metalness = category === ArtifactCategory.BRONZE 
    ? lerp(0.85, 0.35, weathering * 0.7)
    : lerp(0.1, 0.25, weathering);
  
  return new THREE.MeshPhysicalMaterial({
    color: agedColor,
    roughness,
    metalness,
    clearcoat: lerp(0.6, 0, weathering * 0.8),
    clearcoatRoughness: lerp(0.15, 0.7, weathering),
    bumpMap: noiseTexture,
    bumpScale: lerp(0.001, 0.04, weathering),
    displacementMap: noiseTexture,
    displacementScale: lerp(0, 0.035, weathering),
    aoMap: noiseTexture,
    aoMapIntensity: lerp(0.1, 0.7, weathering),
  });
}

function Loader() {
  const { progress } = useProgress();
  return (
    <Html center style={{ pointerEvents: 'none' }}>
      <div
        style={{
          background: 'rgba(26, 26, 46, 0.92)',
          padding: '24px 40px',
          borderRadius: 16,
          border: '1px solid rgba(212, 175, 55, 0.4)',
          color: '#d4af37',
          textAlign: 'center',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        }}
      >
        <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>文物加载中...</div>
        <div
          style={{
            width: 240, height: 5,
            background: 'rgba(255,255,255,0.1)',
            borderRadius: 3,
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
        <div style={{ fontSize: 11, marginTop: 10, color: 'rgba(255,255,255,0.5)' }}>
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
  return (
    <group position={position}>
      <mesh position={[0, 0.5, 0]} receiveShadow>
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
          color="#2a2a4e"
          transparent
          opacity={0.9}
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

interface HighlightBorderProps {
  geometry: THREE.BufferGeometry;
  visible: boolean;
}

function HighlightBorder({ geometry, visible }: HighlightBorderProps) {
  if (!visible) return null;
  return (
    <lineSegments geometry={geometry}>
      <lineBasicMaterial
        color="#d4af37"
        transparent
        opacity={0.95}
        linewidth={3}
      />
    </lineSegments>
  );
}

interface ArtifactTooltipProps {
  artifact: Artifact;
  visible: boolean;
}

function ArtifactTooltip({ artifact, visible }: ArtifactTooltipProps) {
  if (!visible) return null;
  
  return (
    <Html
      position={[0, 1.5, 0]}
      center
      zIndexRange={[100, 0]}
      style={{ pointerEvents: 'none' }}
    >
      <div
        style={{
          background: 'rgba(26, 26, 46, 0.95)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(212, 175, 55, 0.7)',
          borderRadius: 12,
          padding: '14px 18px',
          minWidth: 220,
          boxShadow: '0 8px 32px rgba(0,0,0,0.6), 0 0 40px rgba(212,175,55,0.15)',
          animation: 'tooltipFadeIn 300ms cubic-bezier(0.645, 0.045, 0.355, 1)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
          <span
            style={{
              fontSize: 9,
              padding: '2px 8px',
              borderRadius: 4,
              background: 'rgba(212, 175, 55, 0.15)',
              color: '#d4af37',
              letterSpacing: 0.5,
            }}
          >
            {artifact.category === 'bronze' ? '商周青铜器' : artifact.category === 'pottery' ? '古希腊陶瓶' : '玛雅玉器'}
          </span>
        </div>
        <div
          style={{
            fontSize: 16,
            fontWeight: 700,
            color: '#d4af37',
            marginBottom: 6,
            letterSpacing: 0.5,
          }}
        >
          {artifact.name}
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            fontSize: 11,
            color: 'rgba(255,255,255,0.65)',
          }}
        >
          <span>📅 {artifact.era}</span>
          <span>📦 {artifact.material}</span>
        </div>
        <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <span style={{ fontSize: 9, color: 'rgba(212,175,55,0.6)' }}>点击查看详情 · 拖拽旋转 · 滚轮缩放</span>
        </div>
      </div>
    </Html>
  );
}

function createDetailedArtifactGeometry(artifact: Artifact): THREE.BufferGeometry {
  const { geometryType, category } = artifact;
  
  switch (geometryType) {
    case 'ding': {
      const group = new THREE.Group();
      const body = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.65, 1.1));
      body.position.y = 0.32;
      group.add(body);
      const rim = new THREE.Mesh(new THREE.TorusGeometry(0.8, 0.07, 16, 64));
      rim.position.y = 0.68;
      rim.rotation.x = Math.PI / 2;
      group.add(rim);
      const legGeo = new THREE.CylinderGeometry(0.07, 0.11, 0.45, 12);
      [[0.42, -0.22, 0.42], [-0.42, -0.22, 0.42], [0.42, -0.22, -0.42], [-0.42, -0.22, -0.42]].forEach(p => {
        const leg = new THREE.Mesh(legGeo);
        leg.position.set(p[0], p[1], p[2]);
        group.add(leg);
      });
      const handleGeo = new THREE.TorusGeometry(0.16, 0.035, 8, 32, Math.PI);
      const h1 = new THREE.Mesh(handleGeo);
      h1.position.set(0.8, 0.55, 0);
      h1.rotation.z = Math.PI / 2;
      group.add(h1);
      const h2 = h1.clone();
      h2.position.x = -0.8;
      group.add(h2);
      
      const merged = mergeGroupMeshes(group);
      if (merged) return merged;
      return new THREE.CylinderGeometry(0.85, 0.95, 0.9, 8, 1);
    }
    case 'zun': {
      const pts: THREE.Vector2[] = [];
      for (let i = 0; i <= 24; i++) {
        const t = i / 23;
        let r;
        if (t < 0.18) r = 0.22 + t * 2.1;
        else if (t < 0.35) r = 0.6 + (t - 0.18) * 0.4;
        else if (t < 0.75) r = 0.68 - (t - 0.35) * 0.35;
        else r = 0.52 - (t - 0.75) * 0.95;
        pts.push(new THREE.Vector2(r * 0.7, t * 1.25 - 0.1));
      }
      return new THREE.LatheGeometry(pts, 64);
    }
    case 'hu': {
      const pts: THREE.Vector2[] = [];
      for (let i = 0; i <= 28; i++) {
        const t = i / 27;
        const r = Math.sin(t * Math.PI) * 0.62 + 0.2;
        pts.push(new THREE.Vector2(r * 0.78, t * 1.1 + 0.02));
      }
      return new THREE.LatheGeometry(pts, 64);
    }
    case 'amphora': {
      const pts: THREE.Vector2[] = [];
      for (let i = 0; i <= 32; i++) {
        const t = i / 31;
        let r;
        if (t < 0.14) r = 0.13 + t * 1.65;
        else if (t < 0.72) r = 0.58 + Math.sin((t - 0.14) / 0.58 * Math.PI) * 0.42;
        else r = 0.58 - (t - 0.72) * 1.9;
        pts.push(new THREE.Vector2(r * 0.72, t * 1.45));
      }
      return new THREE.LatheGeometry(pts, 64);
    }
    case 'kylix': {
      return new THREE.CylinderGeometry(0.88, 0.32, 0.38, 48);
    }
    case 'hydria': {
      const pts: THREE.Vector2[] = [];
      for (let i = 0; i <= 30; i++) {
        const t = i / 29;
        let r;
        if (t < 0.1) r = 0.18 + t * 3.1;
        else if (t < 0.68) r = 0.68 + Math.sin((t - 0.1) / 0.58 * Math.PI) * 0.38;
        else r = 0.68 - (t - 0.68) * 2.1;
        pts.push(new THREE.Vector2(r * 0.82, t * 1.35 + 0.02));
      }
      return new THREE.LatheGeometry(pts, 64);
    }
    case 'mask': {
      const geo = new THREE.SphereGeometry(0.58, 56, 56, 0, Math.PI * 2, 0, Math.PI * 0.88);
      const positions = geo.attributes.position;
      for (let i = 0; i < positions.count; i++) {
        const y = positions.getY(i);
        const z = positions.getZ(i);
        if (y > 0.1 && Math.abs(z) < 0.3) {
          positions.setZ(i, z - 0.12);
        }
      }
      geo.computeVertexNormals();
      return geo;
    }
    case 'pendant': {
      return new THREE.TorusGeometry(0.58, 0.19, 36, 72);
    }
    case 'figure': {
      return new THREE.CapsuleGeometry(0.2, 0.75, 18, 36);
    }
    case 'jue':
    default: {
      return new THREE.CylinderGeometry(0.38, 0.48, 0.95, 32);
    }
  }
}

function mergeGroupMeshes(group: THREE.Group): THREE.BufferGeometry | null {
  const geometries: THREE.BufferGeometry[] = [];
  group.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.updateMatrix();
      const geo = child.geometry.clone();
      geo.applyMatrix4(child.matrix);
      geometries.push(geo);
    }
  });
  if (geometries.length === 0) return null;
  return mergeGeometries(geometries);
}

function mergeGeometries(geometries: THREE.BufferGeometry[]): THREE.BufferGeometry {
  let vertexCount = 0;
  geometries.forEach(geo => { vertexCount += geo.attributes.position.count; });
  
  const positions = new Float32Array(vertexCount * 3);
  const normals = new Float32Array(vertexCount * 3);
  const uvs = new Float32Array(vertexCount * 2);
  const indices: number[] = [];
  
  let vertexOffset = 0;
  let indexOffset = 0;
  
  geometries.forEach(geo => {
    const pos = geo.attributes.position.array as Float32Array;
    const nor = geo.attributes.normal.array as Float32Array;
    const uv = geo.attributes.uv ? geo.attributes.uv.array as Float32Array : new Float32Array(pos.length / 3 * 2);
    
    positions.set(pos, vertexOffset * 3);
    normals.set(nor, vertexOffset * 3);
    uvs.set(uv, vertexOffset * 2);
    
    if (geo.index) {
      const idx = geo.index.array;
      for (let i = 0; i < idx.length; i++) {
        indices.push(idx[i] + vertexOffset);
      }
    } else {
      for (let i = 0; i < pos.length / 3; i++) {
        indices.push(i + vertexOffset);
      }
    }
    
    vertexOffset += pos.length / 3;
    indexOffset += indices.length;
  });
  
  const mergedGeo = new THREE.BufferGeometry();
  mergedGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  mergedGeo.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
  mergedGeo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
  mergedGeo.setIndex(indices);
  
  return mergedGeo;
}

interface GLTFArtifactProps {
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
  stopAutoRotate?: boolean;
}

function GLTFArtifact({
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
  stopAutoRotate,
}: GLTFArtifactProps) {
  const groupRef = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const edgesRef = useRef<THREE.LineSegments>(null);
  
  const noiseTexture = useMemo(() => createNoiseTexture(512), []);
  noiseTexture.repeat.set(4, 4);
  
  const material = useMemo(() => {
    return createWeatheringMaterial(artifact.baseColor, artifact.category, weathering, noiseTexture);
  }, [artifact.baseColor, artifact.category, noiseTexture]);

  useEffect(() => {
    if (meshRef.current) {
      const m = meshRef.current.material as THREE.MeshPhysicalMaterial;
      const agedColor = mixColors(artifact.baseColor, '#3a2f20', weathering * 0.6);
      m.color.copy(agedColor);
      m.roughness = lerp(0.18, 0.85, weathering);
      m.metalness = artifact.category === ArtifactCategory.BRONZE
        ? lerp(0.85, 0.35, weathering * 0.7)
        : lerp(0.1, 0.25, weathering);
      m.clearcoat = lerp(0.6, 0, weathering * 0.8);
      m.clearcoatRoughness = lerp(0.15, 0.7, weathering);
      if (m.bumpMap) m.bumpScale = lerp(0.001, 0.04, weathering);
      if (m.displacementMap) m.displacementScale = lerp(0, 0.035, weathering);
      m.needsUpdate = true;
    }
    if (edgesRef.current) {
      const edgeMat = edgesRef.current.material as THREE.LineBasicMaterial;
      edgeMat.opacity = (isHovered || isCompareSelected) && !isInspecting ? 0.95 : 0;
      edgeMat.needsUpdate = true;
    }
  }, [weathering, artifact.baseColor, artifact.category, isHovered, isCompareSelected, isInspecting]);

  useFrame((state, delta) => {
    if (groupRef.current && !stopAutoRotate && !isInspecting && !isSelected) {
      groupRef.current.rotation.y += delta * 0.05;
    }
  });

  const [geometry, edgeGeometry] = useMemo(() => {
    const geo = createDetailedArtifactGeometry(artifact);
    const edgeGeo = new THREE.EdgesGeometry(geo, 25);
    return [geo, edgeGeo];
  }, [artifact]);

  const showBorder = (isHovered || isCompareSelected) && !isInspecting;
  const showTooltip = isHovered && !isInspecting && !isSelected;
  const worldPos = overridePosition || artifact.position;

  return (
    <group
      ref={groupRef}
      position={worldPos}
      scale={artifact.scale}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        onHover(true);
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={(e) => {
        e.stopPropagation();
        onHover(false);
        document.body.style.cursor = 'default';
      }}
    >
      <Detailed distances={[0, 3, 8]}>
        <mesh ref={meshRef} geometry={geometry} material={material} castShadow receiveShadow />
        <mesh geometry={geometry} material={material} castShadow />
        <mesh geometry={geometry} material={material} castShadow />
      </Detailed>

      {showBorder && (
        <lineSegments ref={edgesRef} geometry={edgeGeometry}>
          <lineBasicMaterial
            color="#d4af37"
            transparent
            opacity={0.95}
            linewidth={3}
          />
        </lineSegments>
      )}

      {isHovered && !isInspecting && !isSelected && (
        <pointLight position={[0, 0.9, 0]} color="#d4af37" intensity={2} distance={4} />
      )}

      <ArtifactTooltip artifact={artifact} visible={showTooltip} />

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
  const ringRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (markerRef.current) {
      const t = state.clock.elapsedTime;
      const scale = 1 + Math.sin(t * 3) * 0.25;
      markerRef.current.scale.setScalar(isActive ? scale * 1.5 : scale);
    }
    if (ringRef.current) {
      const t = state.clock.elapsedTime;
      const scale = 1.5 + Math.sin(t * 2.5) * 0.5;
      ringRef.current.scale.setScalar(isActive ? scale * 1.4 : scale);
      const mat = ringRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = isActive ? 0.45 : 0.25;
    }
  });

  const colorMap: Record<string, string> = {
    inscription: '#d4af37',
    repair: '#5dade2',
    crack: '#e74c3c',
    texture: '#58d68d',
  };

  const color = colorMap[annotation.type];

  return (
    <group position={annotation.position}>
      <mesh
        ref={ringRef}
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          document.body.style.cursor = 'default';
        }}
      >
        <ringGeometry args={[0.06, 0.09, 32]} />
        <meshBasicMaterial color={color} transparent opacity={0.25} side={THREE.DoubleSide} />
      </mesh>

      <mesh
        ref={markerRef}
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          document.body.style.cursor = 'default';
        }}
      >
        <sphereGeometry args={[0.045, 24, 24]} />
        <meshBasicMaterial color={color} transparent opacity={0.95} />
      </mesh>

      <pointLight color={color} intensity={isActive ? 1.5 : 0.8} distance={1.2} />

      {isActive && (
        <Html
          position={[0, 0.15, 0]}
          center
          zIndexRange={[200, 100]}
        >
          <div
            style={{
              background: 'rgba(26,26,46,0.95)',
              border: `1px solid ${color}88`,
              borderRadius: 8,
              padding: '6px 12px',
              fontSize: 10,
              color: color,
              fontWeight: 600,
              whiteSpace: 'nowrap',
              boxShadow: `0 4px 16px ${color}33`,
              pointerEvents: 'none',
            }}
          >
            {annotation.title}
          </div>
        </Html>
      )}
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
        targetPosition.current.set(worldX + 0.4, worldY + 1.1, worldZ + 2.2);
        targetLookAt.current.set(worldX, worldY + 0.3, worldZ);
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
      minDistance={isInspecting ? 0.6 : 4}
      maxDistance={isInspecting ? 4 : 25}
      maxPolarAngle={isInspecting ? Math.PI * 0.88 : Math.PI * 0.52}
      minPolarAngle={isInspecting ? 0.1 : Math.PI * 0.18}
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
    if (hemiRef.current) {
      const targetSkyColor = mixColors(prev.ambientColor, preset.ambientColor, t);
      hemiRef.current.color.copy(targetSkyColor);
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
      const targetX = entered ? -2.2 : -7;
      groupARef.current.position.x += (targetX - groupARef.current.position.x) * Math.min(delta * 3, 1);
    }
    if (groupBRef.current) {
      const targetX = entered ? 2.2 : 7;
      groupBRef.current.position.x += (targetX - groupBRef.current.position.x) * Math.min(delta * 3, 1);
    }
  });

  if (compareArtifacts.length < 2) return null;

  return (
    <group>
      <group ref={groupARef} position={[-7, 1.8, 0]}>
        <GLTFArtifact
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
        <Html center position={[0, -1.5, 0]}>
          <div
            style={{
              background: 'rgba(26,26,46,0.95)',
              padding: '12px 20px',
              borderRadius: 10,
              border: '1px solid rgba(212,175,55,0.4)',
              textAlign: 'center',
              minWidth: 200,
              boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            }}
          >
            <div style={{ fontSize: 15, fontWeight: 700, color: '#d4af37', marginBottom: 4 }}>
              {compareArtifacts[0].name}
            </div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)' }}>
              {compareArtifacts[0].era} · {compareArtifacts[0].material}
            </div>
          </div>
        </Html>
      </group>

      <group ref={groupBRef} position={[7, 1.8, 0]}>
        <GLTFArtifact
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
        <Html center position={[0, -1.5, 0]}>
          <div
            style={{
              background: 'rgba(26,26,46,0.95)',
              padding: '12px 20px',
              borderRadius: 10,
              border: '1px solid rgba(212,175,55,0.4)',
              textAlign: 'center',
              minWidth: 200,
              boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            }}
          >
            <div style={{ fontSize: 15, fontWeight: 700, color: '#d4af37', marginBottom: 4 }}>
              {compareArtifacts[1].name}
            </div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)' }}>
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
                <GLTFArtifact
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

      <style>{`
        @keyframes tooltipFadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </Canvas>
  );
};

export default Scene;
