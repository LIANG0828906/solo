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

  const { position, size, visible, textureData } = useMemo(() => {
    if (!geoData || sliceValue === 0) {
      return { 
        position: { x: 0, y: 0, z: 0 }, 
        size: [1, 1] as [number, number], 
        visible: false,
        textureData: null as { densities: number[][]; width: number; height: number } | null
      };
    }

    const halfX = gridSize.x / 2;
    const halfY = gridSize.y / 2;
    const halfZ = gridSize.z / 2;

    const { densities } = getDensityAtSlice(geoData, axis, sliceValue, gridSize);

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
      textureData: texData
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

  useFrame(({ clock }) => {
    if (!edgesRef.current || !visible) return;
    const pulse = 0.5 + Math.sin(clock.elapsedTime * 2) * 0.2;
    (edgesRef.current.material as THREE.Material).opacity = pulse;

    if (gridRef.current) {
      const gridMat = gridRef.current.material as THREE.Material;
      gridMat.opacity = showGrid ? 0.35 + Math.sin(clock.elapsedTime * 4) * 0.1 : 0;
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
