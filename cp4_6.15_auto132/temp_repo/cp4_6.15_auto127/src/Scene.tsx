import React, { useRef, useMemo, useEffect, useState, useCallback } from 'react';
import { Canvas, useFrame, useThree, useLoader } from '@react-three/fiber';
import { OrbitControls, Html, useProgress, SpotLight, Detailed, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
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
  onAnnotationHover: (id: string | null) => void;
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

function createNormalMap(size: number = 512): THREE.Texture {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const imageData = ctx.createImageData(size, size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      const noise = (Math.random() - 0.5) * 0.3;
      imageData.data[i] = 128 + noise * 255;
      imageData.data[i + 1] = 128 + noise * 255;
      imageData.data[i + 2] = 255;
      imageData.data[i + 3] = 255;
    }
  }
  ctx.putImageData(imageData, 0, 0);
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

function createRustTexture(size: number = 512): THREE.Texture {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  
  const gradient = ctx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size/2);
  gradient.addColorStop(0, '#8B4513');
  gradient.addColorStop(0.5, '#A0522D');
  gradient.addColorStop(1, '#654321');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  
  for (let i = 0; i < 2000; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const r = Math.random() * 8 + 1;
    ctx.fillStyle = `rgba(${139 + Math.random() * 40}, ${69 + Math.random() * 30}, ${19 + Math.random() * 20}, ${0.3 + Math.random() * 0.4})`;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

function createWeatheringShaderMaterial(
  baseColor: string,
  category: ArtifactCategory,
  weathering: number,
  baseTexture: THREE.Texture,
  rustTexture: THREE.Texture,
  normalTexture: THREE.Texture,
  noiseTexture: THREE.Texture
): THREE.ShaderMaterial {
  const base = new THREE.Color(baseColor);
  const aged = mixColors(baseColor, '#4a3520', 0.7);
  
  const uniforms = {
    uBaseColor: { value: new THREE.Color(base.r, base.g, base.b) },
    uAgedColor: { value: new THREE.Color(aged.r, aged.g, aged.b) },
    uWeathering: { value: weathering },
    uBaseTexture: { value: baseTexture },
    uRustTexture: { value: rustTexture },
    uNormalTexture: { value: normalTexture },
    uNoiseTexture: { value: noiseTexture },
    uRoughnessNew: { value: 0.15 },
    uRoughnessOld: { value: 0.9 },
    uMetalnessNew: { value: category === ArtifactCategory.BRONZE ? 0.9 : 0.1 },
    uMetalnessOld: { value: category === ArtifactCategory.BRONZE ? 0.25 : 0.15 },
  };

  return new THREE.ShaderMaterial({
    uniforms,
    vertexShader: `
      varying vec2 vUv;
      varying vec3 vNormal;
      varying vec3 vPosition;
      varying vec3 vViewPosition;
      
      void main() {
        vUv = uv;
        vNormal = normalize(normalMatrix * normal);
        vPosition = position;
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        vViewPosition = -mvPosition.xyz;
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      uniform vec3 uBaseColor;
      uniform vec3 uAgedColor;
      uniform float uWeathering;
      uniform sampler2D uBaseTexture;
      uniform sampler2D uRustTexture;
      uniform sampler2D uNormalTexture;
      uniform sampler2D uNoiseTexture;
      uniform float uRoughnessNew;
      uniform float uRoughnessOld;
      uniform float uMetalnessNew;
      uniform float uMetalnessOld;
      
      varying vec2 vUv;
      varying vec3 vNormal;
      varying vec3 vPosition;
      varying vec3 vViewPosition;
      
      float random(vec2 st) {
        return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
      }
      
      void main() {
        vec2 uv = vUv;
        
        float noiseVal = texture2D(uNoiseTexture, uv * 4.0).r;
        float rustFactor = texture2D(uRustTexture, uv * 2.5).r;
        
        float weatherFactor = uWeathering * (0.7 + noiseVal * 0.6);
        weatherFactor = clamp(weatherFactor, 0.0, 1.0);
        
        float rustAmount = smoothstep(0.2, 0.8, weatherFactor * (0.5 + rustFactor * 0.5));
        
        vec3 baseCol = mix(uBaseColor, uAgedColor, weatherFactor * 0.6);
        vec3 rustCol = texture2D(uRustTexture, uv * 3.0).rgb;
        vec3 finalColor = mix(baseCol, rustCol * 0.85, rustAmount * 0.7);
        
        float roughness = mix(uRoughnessNew, uRoughnessOld, weatherFactor);
        
        vec3 normal = vNormal;
        float normalMix = weatherFactor * 0.6;
        vec3 normalMap = texture2D(uNormalTexture, uv * 6.0).rgb * 2.0 - 1.0;
        normal = mix(normal, normalize(normal + normalMap * 0.3), normalMix);
        
        vec3 lightDir = normalize(vec3(1.0, 1.0, 1.0));
        float diff = max(dot(normal, lightDir), 0.0);
        
        float spec = 0.0;
        if (diff > 0.0) {
          vec3 viewDir = normalize(vViewPosition);
          vec3 reflectDir = reflect(-lightDir, normal);
          float specStrength = mix(0.8, 0.1, roughness);
          float shininess = mix(64.0, 4.0, roughness);
          spec = pow(max(dot(viewDir, reflectDir), 0.0), shininess) * specStrength;
        }
        
        vec3 ambient = finalColor * 0.35;
        vec3 diffuse = finalColor * diff * 0.7;
        vec3 specular = vec3(1.0, 0.95, 0.85) * spec;
        
        vec3 color = ambient + diffuse + specular;
        
        float edgeFactor = 1.0 - abs(dot(normal, normalize(vViewPosition)));
        edgeFactor = pow(edgeFactor, 2.0);
        color += vec3(0.9, 0.75, 0.45) * edgeFactor * weatherFactor * 0.15;
        
        gl_FragColor = vec4(color, 1.0);
      }
    `,
  });
}

function Loader() {
  const { progress } = useProgress();
  return (
    <Html center style={{ pointerEvents: 'none' }}>
      <div
        style={{
          background: 'rgba(26, 26, 46, 0.95)',
          padding: '28px 48px',
          borderRadius: 18,
          border: '1px solid rgba(212, 175, 55, 0.5)',
          color: '#d4af37',
          textAlign: 'center',
          boxShadow: '0 12px 48px rgba(0,0,0,0.6), 0 0 60px rgba(212,175,55,0.1)',
        }}
      >
        <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 14, letterSpacing: 1 }}>文物加载中...</div>
        <div
          style={{
            width: 260, height: 5,
            background: 'rgba(255,255,255,0.08)',
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
        <div style={{ fontSize: 11, marginTop: 12, color: 'rgba(255,255,255,0.5)', letterSpacing: 0.5 }}>
          {progress.toFixed(0)}% · 正在加载古文明珍宝
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
      lightRef.current.intensity = (0.5 + Math.sin(t * 1.4) * 0.5) * intensity;
    }
  });
  return (
    <pointLight
      ref={lightRef}
      position={[position[0], position[1] + 1.3, position[2]]}
      color="#d4af37"
      distance={7}
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
        <cylinderGeometry args={[1.7, 1.9, 1.1, 64]} />
        <meshPhysicalMaterial
          color="#16162a"
          transparent
          opacity={0.88}
          roughness={0.12}
          metalness={0.35}
          clearcoat={1}
          clearcoatRoughness={0.1}
        />
      </mesh>

      <mesh position={[0, 1.05, 0]}>
        <cylinderGeometry args={[1.65, 1.65, 0.03, 64]} />
        <meshPhysicalMaterial
          color="#2a2a4e"
          transparent
          opacity={0.92}
          roughness={0.08}
          metalness={0.92}
          clearcoat={1}
        />
      </mesh>

      <mesh position={[0, 1.07, 0]}>
        <ringGeometry args={[1.55, 1.63, 80]} />
        <meshBasicMaterial
          color="#d4af37"
          transparent
          opacity={0.75}
          side={THREE.DoubleSide}
        />
      </mesh>

      <mesh position={[0, 1.06, 0]}>
        <ringGeometry args={[1.45, 1.5, 80]} />
        <meshBasicMaterial
          color="#d4af37"
          transparent
          opacity={0.35}
          side={THREE.DoubleSide}
        />
      </mesh>

      <BreathingLight position={[0, 0, 0]} intensity={spotIntensity * 0.9} />

      {children}
    </group>
  );
}

interface ArtifactTooltipProps {
  artifact: Artifact;
  visible: boolean;
  position: [number, number, number];
}

function ArtifactTooltip({ artifact, visible, position }: ArtifactTooltipProps) {
  if (!visible) return null;
  
  return (
    <Html
      position={position}
      center
      zIndexRange={[200, 0]}
      style={{ pointerEvents: 'none' }}
    >
      <div
        style={{
          background: 'rgba(26, 26, 46, 0.97)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid rgba(212, 175, 55, 0.7)',
          borderRadius: 14,
          padding: '16px 20px',
          minWidth: 230,
          boxShadow: '0 10px 40px rgba(0,0,0,0.65), 0 0 50px rgba(212,175,55,0.12)',
          animation: 'tooltipFadeIn 350ms cubic-bezier(0.645, 0.045, 0.355, 1)',
          position: 'relative',
        }}
      >
        <div
          style={{
            position: 'absolute',
            bottom: -8,
            left: '50%',
            transform: 'translateX(-50%) rotate(45deg)',
            width: 16,
            height: 16,
            background: 'rgba(26,26,46,0.97)',
            borderRight: '1px solid rgba(212,175,55,0.7)',
            borderBottom: '1px solid rgba(212,175,55,0.7)',
          }}
        />
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <span
            style={{
              fontSize: 9,
              padding: '3px 10px',
              borderRadius: 5,
              background: 'rgba(212, 175, 55, 0.18)',
              color: '#d4af37',
              letterSpacing: 0.5,
              fontWeight: 600,
            }}
          >
            {artifact.category === 'bronze' ? '商周青铜器' : artifact.category === 'pottery' ? '古希腊陶瓶' : '玛雅玉器'}
          </span>
        </div>
        <div
          style={{
            fontSize: 17,
            fontWeight: 700,
            color: '#d4af37',
            marginBottom: 8,
            letterSpacing: 0.5,
            textShadow: '0 2px 12px rgba(212,175,55,0.2)',
          }}
        >
          {artifact.name}
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            fontSize: 12,
            color: 'rgba(255,255,255,0.72)',
          }}
        >
          <span>📅 {artifact.era}</span>
          <span>📦 {artifact.material}</span>
        </div>
        <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <span style={{ fontSize: 9.5, color: 'rgba(212,175,55,0.6)', letterSpacing: 0.3 }}>
            点击查看详情 · 拖拽旋转观察 · 滚轮缩放
          </span>
        </div>
      </div>
    </Html>
  );
}

function createPlaceholderGeometry(artifact: Artifact): THREE.BufferGeometry {
  const { geometryType, category } = artifact;
  
  switch (geometryType) {
    case 'ding': {
      const body = new THREE.CylinderGeometry(0.85, 0.95, 0.7, 8, 1);
      body.translate(0, 0.35, 0);
      return body;
    }
    case 'zun': {
      const pts: THREE.Vector2[] = [];
      for (let i = 0; i <= 28; i++) {
        const t = i / 27;
        let r;
        if (t < 0.2) r = 0.2 + t * 2.3;
        else if (t < 0.4) r = 0.66 + (t - 0.2) * 0.3;
        else if (t < 0.75) r = 0.72 - (t - 0.4) * 0.4;
        else r = 0.58 - (t - 0.75) * 1.1;
        pts.push(new THREE.Vector2(r * 0.72, t * 1.3 - 0.05));
      }
      return new THREE.LatheGeometry(pts, 72);
    }
    case 'hu': {
      const pts: THREE.Vector2[] = [];
      for (let i = 0; i <= 32; i++) {
        const t = i / 31;
        const r = Math.sin(t * Math.PI) * 0.65 + 0.22;
        pts.push(new THREE.Vector2(r * 0.8, t * 1.15 + 0.02));
      }
      return new THREE.LatheGeometry(pts, 72);
    }
    case 'amphora': {
      const pts: THREE.Vector2[] = [];
      for (let i = 0; i <= 36; i++) {
        const t = i / 35;
        let r;
        if (t < 0.15) r = 0.12 + t * 1.8;
        else if (t < 0.7) r = 0.6 + Math.sin((t - 0.15) / 0.55 * Math.PI) * 0.45;
        else r = 0.6 - (t - 0.7) * 2.1;
        pts.push(new THREE.Vector2(r * 0.75, t * 1.5));
      }
      return new THREE.LatheGeometry(pts, 72);
    }
    case 'kylix': {
      return new THREE.CylinderGeometry(0.92, 0.3, 0.4, 48);
    }
    case 'hydria': {
      const pts: THREE.Vector2[] = [];
      for (let i = 0; i <= 34; i++) {
        const t = i / 33;
        let r;
        if (t < 0.1) r = 0.16 + t * 3.3;
        else if (t < 0.65) r = 0.72 + Math.sin((t - 0.1) / 0.55 * Math.PI) * 0.4;
        else r = 0.72 - (t - 0.65) * 2.3;
        pts.push(new THREE.Vector2(r * 0.85, t * 1.4 + 0.02));
      }
      return new THREE.LatheGeometry(pts, 72);
    }
    case 'mask': {
      const geo = new THREE.SphereGeometry(0.62, 64, 64, 0, Math.PI * 2, 0, Math.PI * 0.9);
      const positions = geo.attributes.position;
      for (let i = 0; i < positions.count; i++) {
        const y = positions.getY(i);
        const z = positions.getZ(i);
        const x = positions.getX(i);
        if (y > 0.15 && Math.abs(z) < 0.35) {
          positions.setZ(i, z - 0.15);
        }
        if (y < -0.05 && Math.abs(x) < 0.2) {
          positions.setZ(i, z - 0.08);
        }
      }
      geo.computeVertexNormals();
      return geo;
    }
    case 'pendant': {
      return new THREE.TorusGeometry(0.62, 0.21, 40, 80);
    }
    case 'figure': {
      return new THREE.CapsuleGeometry(0.22, 0.8, 20, 40);
    }
    case 'jue':
    default: {
      return new THREE.CylinderGeometry(0.36, 0.5, 1.0, 36);
    }
  }
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
  onAnnotationHover: (id: string | null) => void;
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
  onAnnotationHover,
  activeAnnotationId,
  showAnnotations,
  overridePosition,
  stopAutoRotate,
}: GLTFArtifactProps) {
  const groupRef = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const edgesRef = useRef<THREE.LineSegments>(null);
  const outlineRef = useRef<THREE.Mesh>(null);
  const [loadError, setLoadError] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const noiseTexture = useMemo(() => {
    const tex = createNoiseTexture(512);
    tex.repeat.set(4, 4);
    return tex;
  }, []);

  const rustTexture = useMemo(() => {
    const tex = createRustTexture(512);
    tex.repeat.set(3, 3);
    return tex;
  }, []);

  const normalTexture = useMemo(() => {
    const tex = createNormalMap(512);
    tex.repeat.set(6, 6);
    return tex;
  }, []);

  const baseColorTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;
    const c = hexToRgb(artifact.baseColor);
    const gradient = ctx.createLinearGradient(0, 0, 0, 512);
    gradient.addColorStop(0, `rgb(${Math.floor(c.r * 255 * 1.2)}, ${Math.floor(c.g * 255 * 1.1)}, ${Math.floor(c.b * 255 * 1.05)})`);
    gradient.addColorStop(0.5, artifact.baseColor);
    gradient.addColorStop(1, `rgb(${Math.floor(c.r * 255 * 0.75)}, ${Math.floor(c.g * 255 * 0.7)}, ${Math.floor(c.b * 255 * 0.65)})`);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 500; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 512;
      const a = Math.random() * 0.15 + 0.05;
      ctx.fillStyle = `rgba(255, 255, 255, ${a})`;
      ctx.fillRect(x, y, Math.random() * 3 + 1, Math.random() * 3 + 1);
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    return tex;
  }, [artifact.baseColor]);

  const shaderMaterial = useMemo(() => {
    return createWeatheringShaderMaterial(
      artifact.baseColor,
      artifact.category,
      weathering,
      baseColorTexture,
      rustTexture,
      normalTexture,
      noiseTexture
    );
  }, [artifact.baseColor, artifact.category, baseColorTexture, rustTexture, normalTexture, noiseTexture]);

  useEffect(() => {
    if (shaderMaterial.uniforms) {
      shaderMaterial.uniforms.uWeathering.value = weathering;
    }
  }, [weathering, shaderMaterial]);

  const [placeholderGeometry, edgeGeometry, outlineGeometry] = useMemo(() => {
    const geo = createPlaceholderGeometry(artifact);
    const edgeGeo = new THREE.EdgesGeometry(geo, 20);
    const outlineGeo = geo.clone();
    return [geo, edgeGeo, outlineGeo];
  }, [artifact]);

  useFrame((state, delta) => {
    if (groupRef.current && !stopAutoRotate && !isInspecting && !isSelected) {
      groupRef.current.rotation.y += delta * 0.05;
    }
    
    if (edgesRef.current && edgesRef.current.material) {
      const mat = edgesRef.current.material as THREE.LineBasicMaterial;
      const targetOpacity = (isHovered || isCompareSelected) && !isInspecting ? 1 : 0;
      mat.opacity += (targetOpacity - mat.opacity) * 0.15;
      mat.needsUpdate = true;
    }

    if (outlineRef.current && outlineRef.current.material) {
      const mat = outlineRef.current.material as THREE.MeshBasicMaterial;
      const targetOpacity = (isHovered || isCompareSelected) && !isInspecting ? 0.5 : 0;
      mat.opacity += (targetOpacity - mat.opacity) * 0.12;
      mat.needsUpdate = true;
    }
  });

  const showBorder = (isHovered || isCompareSelected) && !isInspecting;
  const showTooltip = isHovered && !isInspecting && !isSelected;
  const worldPos = overridePosition || artifact.position;
  const tooltipPos: [number, number, number] = [worldPos[0], worldPos[1] + 1.6, worldPos[2]];

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
      <Detailed distances={[0, 2.5, 7]}>
        <mesh ref={meshRef} geometry={placeholderGeometry} material={shaderMaterial} castShadow receiveShadow />
        <mesh geometry={placeholderGeometry} material={shaderMaterial} castShadow />
        <mesh geometry={placeholderGeometry} material={shaderMaterial} castShadow />
      </Detailed>

      <lineSegments ref={edgesRef} geometry={edgeGeometry} position={[0, 0, 0.001]}>
        <lineBasicMaterial
          color="#d4af37"
          transparent
          opacity={0}
          linewidth={2}
        />
      </lineSegments>

      {showBorder && (
        <mesh ref={outlineRef} geometry={outlineGeometry} scale={1.08} position={[0, 0, -0.01]}>
          <meshBasicMaterial
            color="#d4af37"
            transparent
            opacity={0}
            side={THREE.BackSide}
            depthWrite={false}
          />
        </mesh>
      )}

      {isHovered && !isInspecting && !isSelected && (
        <pointLight position={[0, 0.9, 0]} color="#d4af37" intensity={2.5} distance={5} />
      )}

      {loadError && (
        <Html center position={[0, 0.5, 0]}>
          <div style={{
            background: 'rgba(231, 76, 60, 0.9)',
            color: 'white',
            padding: '8px 14px',
            borderRadius: 8,
            fontSize: 11,
            textAlign: 'center',
            whiteSpace: 'nowrap',
          }}>
            ⚠️ 模型加载失败
          </div>
        </Html>
      )}

      <ArtifactTooltip artifact={artifact} visible={showTooltip} position={tooltipPos} />

      {showAnnotations && artifact.annotations.map((ann) => (
        <AnnotationMarker
          key={ann.id}
          annotation={ann}
          isActive={activeAnnotationId === ann.id}
          onClick={() => onAnnotationClick(ann.id)}
          onHover={(h) => onAnnotationHover(h ? ann.id : null)}
        />
      ))}
    </group>
  );
}

interface AnnotationMarkerProps {
  annotation: AnnotationPoint;
  isActive: boolean;
  onClick: () => void;
  onHover: (hovered: boolean) => void;
}

function AnnotationMarker({ annotation, isActive, onClick, onHover }: AnnotationMarkerProps) {
  const markerRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const pulseRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (markerRef.current) {
      const t = state.clock.elapsedTime;
      const scale = 1 + Math.sin(t * 3) * 0.28;
      markerRef.current.scale.setScalar(isActive ? scale * 1.6 : scale);
    }
    if (ringRef.current) {
      const t = state.clock.elapsedTime;
      const scale = 1.6 + Math.sin(t * 2.5) * 0.6;
      ringRef.current.scale.setScalar(isActive ? scale * 1.5 : scale * 0.8);
      const mat = ringRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = isActive ? 0.5 : 0.3;
    }
    if (pulseRef.current) {
      const t = state.clock.elapsedTime * 1.5;
      const s = 1 + (t % 1) * 2;
      pulseRef.current.scale.setScalar(s);
      const mat = pulseRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = Math.max(0, 0.6 - (t % 1) * 0.6);
    }
  });

  const colorMap: Record<string, string> = {
    inscription: '#d4af37',
    repair: '#5dade2',
    crack: '#e74c3c',
    texture: '#58d68d',
  };

  const color = colorMap[annotation.type];
  const typeLabelMap: Record<string, string> = {
    inscription: '铭文',
    repair: '修复',
    crack: '痕迹',
    texture: '纹理',
  };

  return (
    <group position={annotation.position}>
      <mesh
        ref={pulseRef}
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
        <ringGeometry args={[0.03, 0.05, 32]} />
        <meshBasicMaterial color={color} transparent opacity={0.5} side={THREE.DoubleSide} />
      </mesh>

      <mesh
        ref={ringRef}
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
        <ringGeometry args={[0.07, 0.1, 32]} />
        <meshBasicMaterial color={color} transparent opacity={0.3} side={THREE.DoubleSide} />
      </mesh>

      <mesh
        ref={markerRef}
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
        <sphereGeometry args={[0.055, 28, 28]} />
        <meshBasicMaterial color={color} transparent opacity={0.95} />
      </mesh>

      <pointLight color={color} intensity={isActive ? 2 : 1} distance={1.5} />

      {isActive && (
        <Html
          position={[0, 0.22, 0]}
          center
          zIndexRange={[250, 150]}
          style={{ pointerEvents: 'none' }}
        >
          <div
            style={{
              background: `linear-gradient(135deg, ${color}22, ${color}08)`,
              border: `1px solid ${color}99`,
              borderRadius: 10,
              padding: '7px 14px',
              fontSize: 10.5,
              color: color,
              fontWeight: 700,
              whiteSpace: 'nowrap',
              boxShadow: `0 4px 20px ${color}44`,
              letterSpacing: 0.3,
            }}
          >
            <span style={{ fontSize: 9, opacity: 0.8, marginRight: 4 }}>
              {typeLabelMap[annotation.type]}
            </span>
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
        targetPosition.current.set(worldX + 0.35, worldY + 1.0, worldZ + 2.0);
        targetLookAt.current.set(worldX, worldY + 0.25, worldZ);
      } else if (isCompareMode && compareArtifacts.length === 2) {
        targetPosition.current.set(0, 2.6, 6.5);
        targetLookAt.current.set(0, 1.6, 0);
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
      animProgress.current = Math.min(animProgress.current + delta * 1.4, 1);
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
      minDistance={isInspecting ? 0.5 : 4}
      maxDistance={isInspecting ? 4.5 : 25}
      maxPolarAngle={isInspecting ? Math.PI * 0.9 : Math.PI * 0.52}
      minPolarAngle={isInspecting ? 0.08 : Math.PI * 0.18}
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
      transitionProgress.current = Math.min(transitionProgress.current + delta * 0.9, 1);
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
        args={[preset.ambientColor, '#1a1a2e', 0.35]}
      />
      <directionalLight
        ref={directionalRef}
        position={preset.directionalPosition}
        intensity={preset.directionalIntensity}
        color={preset.directionalColor}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-left={-16}
        shadow-camera-right={16}
        shadow-camera-top={16}
        shadow-camera-bottom={-16}
        shadow-bias={-0.0001}
      />
      {pedestalPositions.map((pos, i) => (
        <SpotLight
          key={i}
          position={[pos[0], 5.5, pos[2] - 0.5]}
          angle={0.55}
          penumbra={0.7}
          intensity={preset.spotIntensity}
          castShadow
          distance={14}
          color="#fff5dd"
          target-position={[pos[0], 1.2, pos[2]]}
        />
      ))}
    </>
  );
}

function GalleryRoom({ fogColor }: { fogColor: string }) {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[60, 60]} />
        <meshStandardMaterial color="#141428" roughness={0.9} metalness={0.08} />
      </mesh>

      {[-18, -12, -6, 0, 6, 12, 18].map((x, i) => (
        <mesh key={`column-${i}`} position={[x, 3, -13]}>
          <boxGeometry args={[0.18, 6, 0.18]} />
          <meshStandardMaterial color="#202040" metalness={0.45} roughness={0.55} />
        </mesh>
      ))}

      <mesh position={[0, 6, -13]}>
        <boxGeometry args={[42, 0.25, 0.5]} />
        <meshStandardMaterial color="#25254a" metalness={0.55} roughness={0.35} />
      </mesh>

      {[-8, 0, 8].map((x, i) => (
        <mesh key={`plinth-${i}`} position={[x, 0.08, -9.5]} receiveShadow>
          <boxGeometry args={[5.5, 0.15, 1.0]} />
          <meshStandardMaterial color="#1c1c3a" metalness={0.25} roughness={0.82} />
        </mesh>
      ))}

      {[-12, -4, 4, 12].map((x, i) => (
        <mesh key={`wall-deco-${i}`} position={[x, 4.5, -12.7]}>
          <planeGeometry args={[1.8, 0.8]} />
          <meshBasicMaterial color="#d4af37" transparent opacity={0.15} />
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
  onAnnotationHover: (id: string | null) => void;
}

function CompareView({
  compareArtifacts,
  weathering,
  activeAnnotationId,
  onAnnotationClick,
  onAnnotationHover,
}: CompareViewProps) {
  const groupARef = useRef<THREE.Group>(null);
  const groupBRef = useRef<THREE.Group>(null);
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setEntered(true), 80);
    return () => clearTimeout(timer);
  }, []);

  useFrame((state, delta) => {
    if (groupARef.current) {
      const targetX = entered ? -2.5 : -8;
      groupARef.current.position.x += (targetX - groupARef.current.position.x) * Math.min(delta * 2.8, 1);
    }
    if (groupBRef.current) {
      const targetX = entered ? 2.5 : 8;
      groupBRef.current.position.x += (targetX - groupBRef.current.position.x) * Math.min(delta * 2.8, 1);
    }
  });

  if (compareArtifacts.length < 2) return null;

  const earlierIdx = compareArtifacts[0].year <= compareArtifacts[1].year ? 0 : 1;
  const laterIdx = earlierIdx === 0 ? 1 : 0;

  return (
    <group>
      <group ref={groupARef} position={[-8, 2.0, 0]}>
        <GLTFArtifact
          artifact={compareArtifacts[earlierIdx]}
          isHovered={false}
          isSelected={false}
          isCompareSelected={false}
          isInspecting={true}
          weathering={weathering * 0.3}
          onClick={() => {}}
          onHover={() => {}}
          onAnnotationClick={onAnnotationClick}
          onAnnotationHover={onAnnotationHover}
          activeAnnotationId={activeAnnotationId}
          showAnnotations={false}
          overridePosition={[0, 0, 0]}
          stopAutoRotate
        />
        <Html center position={[0, -1.6, 0]} zIndexRange={[150, 50]}>
          <div
            style={{
              background: 'rgba(22,22,40,0.96)',
              padding: '14px 22px',
              borderRadius: 14,
              border: '1px solid rgba(212,175,55,0.5)',
              textAlign: 'center',
              minWidth: 210,
              boxShadow: '0 10px 40px rgba(0,0,0,0.6)',
              position: 'relative',
            }}
          >
            <div style={{
              fontSize: 10,
              color: '#58d68d',
              marginBottom: 6,
              fontWeight: 700,
              letterSpacing: 1,
            }}>
              ◀ 更早时期
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#d4af37', marginBottom: 5 }}>
              {compareArtifacts[earlierIdx].name}
            </div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>
              {compareArtifacts[earlierIdx].era} · {compareArtifacts[earlierIdx].material}
            </div>
          </div>
        </Html>
      </group>

      <group ref={groupBRef} position={[8, 2.0, 0]}>
        <GLTFArtifact
          artifact={compareArtifacts[laterIdx]}
          isHovered={false}
          isSelected={false}
          isCompareSelected={false}
          isInspecting={true}
          weathering={weathering}
          onClick={() => {}}
          onHover={() => {}}
          onAnnotationClick={onAnnotationClick}
          onAnnotationHover={onAnnotationHover}
          activeAnnotationId={activeAnnotationId}
          showAnnotations={false}
          overridePosition={[0, 0, 0]}
          stopAutoRotate
        />
        <Html center position={[0, -1.6, 0]} zIndexRange={[150, 50]}>
          <div
            style={{
              background: 'rgba(22,22,40,0.96)',
              padding: '14px 22px',
              borderRadius: 14,
              border: '1px solid rgba(212,175,55,0.5)',
              textAlign: 'center',
              minWidth: 210,
              boxShadow: '0 10px 40px rgba(0,0,0,0.6)',
              position: 'relative',
            }}
          >
            <div style={{
              fontSize: 10,
              color: '#e74c3c',
              marginBottom: 6,
              fontWeight: 700,
              letterSpacing: 1,
            }}>
              更晚时期 ▶
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#d4af37', marginBottom: 5 }}>
              {compareArtifacts[laterIdx].name}
            </div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>
              {compareArtifacts[laterIdx].era} · {compareArtifacts[laterIdx].material}
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
  onAnnotationHover,
}) => {
  const selectedArtifact = artifacts.find(a => a.id === selectedArtifactId) || null;
  const compareArtifacts = selectedForCompare.map(id => artifacts.find(a => a.id === id)!).filter(Boolean);

  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      camera={{ position: [0, 4, 13], fov: 50, near: 0.1, far: 100 }}
      gl={{ antialias: true, alpha: false, powerPreference: 'high-performance', toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.05 }}
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
                  onAnnotationHover={onAnnotationHover}
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
            onAnnotationHover={onAnnotationHover}
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
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
          0% { transform: scale(1); opacity: 0.6; }
          100% { transform: scale(3); opacity: 0; }
        }
      `}</style>
    </Canvas>
  );
};

export default Scene;
