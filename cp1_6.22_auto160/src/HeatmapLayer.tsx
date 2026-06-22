import { useRef, useMemo, useState, useEffect } from 'react';
import { useFrame, ThreeEvent } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { scaleLinear } from 'd3-scale';
import type { DensityPoint } from './HeatmapData';

interface HeatmapLayerProps {
  points: DensityPoint[];
  onStatsUpdate?: (visible: DensityPoint[]) => void;
}

const colorScale = scaleLinear<string>()
  .domain([0, 33.33, 66.66, 100])
  .range(['#0000FF', '#00FFFF', '#FFFF00', '#FF0000']);

function hexToRgb(hex: string): THREE.Color {
  return new THREE.Color(hex);
}

interface TooltipState {
  index: number;
  point: DensityPoint;
}

export default function HeatmapLayer({ points, onStatsUpdate }: HeatmapLayerProps) {
  const particlesRef = useRef<THREE.Points>(null);
  const glowRef = useRef<THREE.Points>(null);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const tooltipTimerRef = useRef<number | null>(null);

  const count = points.length;

  const { positions, colors, sizes, baseSizes, glowSizes, glowColors } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const baseSizes = new Float32Array(count);
    const glowSizes = new Float32Array(count);
    const glowColors = new Float32Array(count * 4);

    for (let i = 0; i < count; i++) {
      const p = points[i];
      positions[i * 3] = p.x;
      positions[i * 3 + 1] = 0.3;
      positions[i * 3 + 2] = p.y;

      const c = hexToRgb(colorScale(p.density));
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;

      const size = 0.5 + (p.density / 100) * 1.5;
      sizes[i] = size;
      baseSizes[i] = size;
      glowSizes[i] = size * 1.5;

      glowColors[i * 4] = c.r;
      glowColors[i * 4 + 1] = c.g;
      glowColors[i * 4 + 2] = c.b;
      glowColors[i * 4 + 3] = 0.3;
    }

    return { positions, colors, sizes, baseSizes, glowSizes, glowColors };
  }, [points]);

  const particleTexture = useMemo(() => makeRadialTexture(), []);
  const glowTexture = useMemo(() => makeGlowTexture(), []);

  useFrame((state, delta) => {
    const time = state.clock.elapsedTime;
    const pts = particlesRef.current;
    const glw = glowRef.current;

    if (pts) {
      const sizeAttr = pts.geometry.getAttribute('aParticleSize') as THREE.BufferAttribute;
      const arr = sizeAttr.array as Float32Array;
      for (let i = 0; i < count; i++) {
        const pulse = 1 + Math.sin(time * 2 + i * 0.05) * 0.08;
        const highlight = tooltip && tooltip.index === i ? 1.5 : 1;
        arr[i] = baseSizes[i] * pulse * highlight;
      }
      sizeAttr.needsUpdate = true;
    }

    if (glw) {
      const glowSizeAttr = glw.geometry.getAttribute('aGlowSize') as THREE.BufferAttribute;
      const glowArr = glowSizeAttr.array as Float32Array;
      for (let i = 0; i < count; i++) {
        const pulse = 1 + Math.sin(time * 1.5 + i * 0.07) * 0.12;
        const highlight = tooltip && tooltip.index === i ? 1.5 : 1;
        glowArr[i] = glowSizes[i] * pulse * highlight;
      }
      glowSizeAttr.needsUpdate = true;
    }

    if (onStatsUpdate && state.camera) {
      const camera = state.camera as THREE.PerspectiveCamera;
      const frustum = new THREE.Frustum();
      const matrix = new THREE.Matrix4().multiplyMatrices(
        camera.projectionMatrix,
        camera.matrixWorldInverse
      );
      frustum.setFromProjectionMatrix(matrix);
      const visible: DensityPoint[] = [];
      for (let i = 0; i < count; i++) {
        const v = new THREE.Vector3(positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2]);
        if (frustum.containsPoint(v)) {
          visible.push(points[i]);
        }
      }
      onStatsUpdate(visible);
    }
  });

  useEffect(() => {
    return () => {
      if (tooltipTimerRef.current) {
        window.clearTimeout(tooltipTimerRef.current);
      }
    };
  }, []);

  const handleClick = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation();
    const index = (event as any).instanceId ?? event.intersections?.[0]?.index;
    if (index === undefined || index < 0 || index >= count) return;

    if (tooltipTimerRef.current) {
      window.clearTimeout(tooltipTimerRef.current);
    }

    setTooltip({ index, point: points[index] });

    tooltipTimerRef.current = window.setTimeout(() => {
      setTooltip(null);
    }, 2000);
  };

  const particleGeometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('aParticleColor', new THREE.BufferAttribute(colors, 3));
    geo.setAttribute('aParticleSize', new THREE.BufferAttribute(sizes, 1));
    geo.setAttribute('size', new THREE.BufferAttribute(new Float32Array(sizes), 1));
    return geo;
  }, [positions, colors, sizes]);

  const glowGeometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3));
    geo.setAttribute('aGlowColor', new THREE.BufferAttribute(new Float32Array(glowColors), 4));
    geo.setAttribute('aGlowSize', new THREE.BufferAttribute(new Float32Array(glowSizes), 1));
    return geo;
  }, [positions, glowColors, glowSizes]);

  return (
    <group>
      <points
        ref={glowRef}
        geometry={glowGeometry}
        frustumCulled={false}
        raycast={() => null}
      >
        <shaderMaterial
          vertexShader={glowVertexShader}
          fragmentShader={glowFragmentShader}
          uniforms={{
            uTexture: { value: glowTexture },
            uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
          }}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>

      <points
        ref={particlesRef}
        geometry={particleGeometry}
        frustumCulled={false}
        onClick={handleClick}
      >
        <shaderMaterial
          vertexShader={particleVertexShader}
          fragmentShader={particleFragmentShader}
          uniforms={{
            uTexture: { value: particleTexture },
            uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
          }}
          transparent
          depthWrite={false}
        />
      </points>

      {tooltip && (
        <Html
          position={[tooltip.point.x, 1.8, tooltip.point.y]}
          center
          distanceFactor={12}
          style={{ pointerEvents: 'none' }}
        >
          <div
            style={{
              color: '#FFFFFF',
              background: '#00000080',
              borderRadius: '8px',
              padding: '10px 14px',
              fontSize: '13px',
              lineHeight: '1.6',
              backdropFilter: 'blur(6px)',
              border: '1px solid rgba(255,255,255,0.15)',
              whiteSpace: 'nowrap',
              boxShadow: '0 0 20px rgba(99,102,241,0.4)',
            }}
          >
            <div style={{ fontWeight: 600, marginBottom: '4px', color: colorScale(tooltip.point.density) }}>
              密度值: {tooltip.point.density.toFixed(2)}
            </div>
            <div style={{ opacity: 0.85 }}>
              坐标 X: {tooltip.point.x.toFixed(2)}
            </div>
            <div style={{ opacity: 0.85 }}>
              坐标 Y: {tooltip.point.y.toFixed(2)}
            </div>
          </div>
        </Html>
      )}
    </group>
  );
}

function makeRadialTexture(): THREE.Texture {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gradient.addColorStop(0, 'rgba(255,255,255,1)');
  gradient.addColorStop(0.4, 'rgba(255,255,255,0.9)');
  gradient.addColorStop(0.7, 'rgba(255,255,255,0.4)');
  gradient.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

function makeGlowTexture(): THREE.Texture {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gradient.addColorStop(0, 'rgba(255,255,255,0.6)');
  gradient.addColorStop(0.5, 'rgba(255,255,255,0.25)');
  gradient.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

const particleVertexShader = /* glsl */ `
  attribute float aParticleSize;
  attribute vec3 aParticleColor;
  varying vec3 vColor;
  uniform float uPixelRatio;
  void main() {
    vColor = aParticleColor;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = aParticleSize * uPixelRatio * (300.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const particleFragmentShader = /* glsl */ `
  varying vec3 vColor;
  uniform sampler2D uTexture;
  void main() {
    vec4 tex = texture2D(uTexture, gl_PointCoord);
    if (tex.a < 0.02) discard;
    gl_FragColor = vec4(vColor, tex.a);
  }
`;

const glowVertexShader = /* glsl */ `
  attribute float aGlowSize;
  attribute vec4 aGlowColor;
  varying vec4 vColor;
  uniform float uPixelRatio;
  void main() {
    vColor = aGlowColor;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = aGlowSize * uPixelRatio * (300.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const glowFragmentShader = /* glsl */ `
  varying vec4 vColor;
  uniform sampler2D uTexture;
  void main() {
    vec4 tex = texture2D(uTexture, gl_PointCoord);
    if (tex.a < 0.02) discard;
    gl_FragColor = vec4(vColor.rgb, vColor.a * tex.a);
  }
`;
