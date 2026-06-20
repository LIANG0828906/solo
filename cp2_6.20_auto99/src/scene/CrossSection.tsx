import { useMemo, useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGeoStore } from '@/store/useGeoStore';
import { getDensityAtSlice, getColorScale } from '@/utils/geoUtils';

interface CrossSectionProps {
  axis: 'x' | 'y' | 'z';
}

export function CrossSection({ axis }: CrossSectionProps) {
  const planeRef = useRef<THREE.Mesh>(null);
  const edgesRef = useRef<THREE.LineSegments>(null);
  const gridRef = useRef<THREE.GridHelper | null>(null);
  const glowRingRef = useRef<THREE.Mesh>(null);
  const particlesRef = useRef<THREE.Points>(null);
  const { geoData, gridSize, sliceX, sliceY, sliceZ, colorMode, isDraggingSlice } = useGeoStore();
  const colorScale = getColorScale(colorMode);
  const [showGrid, setShowGrid] = useState(false);

  const sliceValue = axis === 'x' ? sliceX : axis === 'y' ? sliceY : sliceZ;
  const isThisDragging = isDraggingSlice === axis;

  useEffect(() => {
    if (isThisDragging && sliceValue > 0) {
      setShowGrid(true);
    } else if (!isThisDragging) {
      const timer = setTimeout(() => setShowGrid(false), 150);
      return () => clearTimeout(timer);
    }
  }, [isThisDragging, sliceValue]);

  const { position, size, visible, textureData, avgDensity } = useMemo(() => {
    if (!geoData || sliceValue === 0) {
      return { 
        position: { x: 0, y: 0, z: 0 }, 
        size: [1, 1] as [number, number], 
        visible: false,
        textureData: null as { densities: number[][]; width: number; height: number } | null,
        avgDensity: 0
      };
    }

    const halfX = gridSize.x / 2;
    const halfY = gridSize.y / 2;
    const halfZ = gridSize.z / 2;

    const { densities, avgDensity: avg } = getDensityAtSlice(geoData, axis, sliceValue, gridSize);

    let pos = { x: 0, y: 0, z: 0 };
    let planeSize: [number, number] = [1, 1];
    let texData: { densities: number[][]; width: number; height: number } | null = null;

    if (axis === 'x') {
      const xPos = (sliceValue / 100) * gridSize.x - halfX;
      pos = { x: xPos, y: 0, z: 0 };
      planeSize = [gridSize.z, gridSize.y];
      texData = { densities, width: gridSize.z, height: gridSize.y };
    } else if (axis === 'y') {
      const yPos = (sliceValue / 100) * gridSize.y - halfY;
      pos = { x: 0, y: yPos, z: 0 };
      planeSize = [gridSize.x, gridSize.z];
      texData = { densities, width: gridSize.x, height: gridSize.z };
    } else {
      const zPos = (sliceValue / 100) * gridSize.z - halfZ;
      pos = { x: 0, y: 0, z: zPos };
      planeSize = [gridSize.x, gridSize.y];
      texData = { densities, width: gridSize.x, height: gridSize.y };
    }

    return { 
      position: pos, 
      size: planeSize, 
      visible: true,
      textureData: texData,
      avgDensity: avg
    };
  }, [geoData, gridSize, sliceValue, axis]);

  const texture = useMemo(() => {
    if (!textureData) return null;

    const { densities, width, height } = textureData;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    const imageData = ctx.createImageData(width, height);
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const density = densities[x][height - 1 - y] || 0;
        const colorStr = colorScale(density);
        const rgb = hexToRgb(colorStr);
        
        const idx = (y * width + x) * 4;
        imageData.data[idx] = rgb.r;
        imageData.data[idx + 1] = rgb.g;
        imageData.data[idx + 2] = rgb.b;
        imageData.data[idx + 3] = 210;
      }
    }
    
    ctx.putImageData(imageData, 0, 0);
    
    const tex = new THREE.CanvasTexture(canvas);
    tex.needsUpdate = true;
    tex.magFilter = THREE.NearestFilter;
    tex.minFilter = THREE.NearestFilter;
    
    return tex;
  }, [textureData, colorScale]);

  const particlePositions = useMemo(() => {
    if (!textureData || !visible) return null;
    const { densities, width, height } = textureData;
    const points: number[] = [];
    const step = 2;

    for (let y = 0; y < height; y += step) {
      for (let x = 0; x < width; x += step) {
        const d1 = densities[x][height - 1 - y] || 0;
        const dRight = x + 1 < width ? (densities[x + 1][height - 1 - y] || 0) : d1;
        const dUp = y + 1 < height ? (densities[x][height - 1 - y - 1] || 0) : d1;

        if (Math.abs(d1 - dRight) > 0.08 || Math.abs(d1 - dUp) > 0.08) {
          const px = (x / width - 0.5) * size[0];
          const py = (0.5 - y / height) * size[1];
          const pz = (Math.random() - 0.5) * 0.3;
          points.push(px, py, pz);
        }
      }
    }

    if (points.length === 0) return null;
    return new Float32Array(points);
  }, [textureData, visible, size]);

  useFrame(({ clock }) => {
    if (!edgesRef.current || !visible) return;
    const t = clock.elapsedTime;

    const edgePulse = 0.5 + Math.sin(t * 2) * 0.2;
    (edgesRef.current.material as THREE.Material).opacity = edgePulse;

    if (gridRef.current) {
      const gridMat = gridRef.current.material as THREE.Material;
      gridMat.opacity = showGrid ? 0.35 + Math.sin(t * 4) * 0.1 : 0;
    }

    if (glowRingRef.current) {
      const glowMat = glowRingRef.current.material as THREE.MeshBasicMaterial;
      glowMat.opacity = 0.2 + Math.sin(t * 1.5) * 0.1;
      const s = 1.0 + Math.sin(t * 2) * 0.01;
      glowRingRef.current.scale.set(s, s, s);
    }

    if (particlesRef.current) {
      const mat = particlesRef.current.material as THREE.PointsMaterial;
      mat.opacity = 0.4 + Math.sin(t * 3) * 0.25;
      mat.size = 0.08 + Math.sin(t * 2.5) * 0.03;
    }
  });

  const rotation = useMemo(() => {
    if (axis === 'x') return [0, Math.PI / 2, 0] as [number, number, number];
    if (axis === 'y') return [-Math.PI / 2, 0, 0] as [number, number, number];
    return [0, 0, 0] as [number, number, number];
  }, [axis]);

  const gridParams = useMemo(() => {
    const divisions = axis === 'y' ? gridSize.x : (axis === 'x' ? gridSize.z : gridSize.x);
    const sizeVal = Math.max(size[0], size[1]);
    return { size: sizeVal, divisions };
  }, [size, axis, gridSize]);

  if (!visible || !geoData) return null;

  return (
    <group position={[position.x, position.y, position.z]} rotation={rotation}>
      <mesh ref={planeRef} position={[0, 0, 0]}>
        <planeGeometry args={size} />
        <meshBasicMaterial
          color="#22c55e"
          transparent
          opacity={0.2}
          side={THREE.DoubleSide}
          map={texture || undefined}
        />
      </mesh>

      <mesh ref={glowRingRef} position={[0, 0, -0.01]}>
        <planeGeometry args={[size[0] + 0.4, size[1] + 0.4]} />
        <meshBasicMaterial
          color="#4ade80"
          transparent
          opacity={0.2}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
      
      <lineSegments ref={edgesRef}>
        <edgesGeometry args={[new THREE.PlaneGeometry(size[0], size[1])]} />
        <lineBasicMaterial color="#4ade80" transparent opacity={0.8} linewidth={2} />
      </lineSegments>

      {showGrid && (
        <gridHelper
          ref={(el) => { gridRef.current = el; }}
          args={[gridParams.size, gridParams.divisions, '#4ade80', '#22c55e']}
          position={[0, 0.01, 0]}
        />
      )}

      {particlePositions && (
        <points ref={particlesRef}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={particlePositions.length / 3}
              array={particlePositions}
              itemSize={3}
            />
          </bufferGeometry>
          <pointsMaterial
            color="#86efac"
            size={0.08}
            transparent
            opacity={0.6}
            sizeAttenuation
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </points>
      )}
    </group>
  );
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 0, g: 0, b: 0 };
}

export default CrossSection;
