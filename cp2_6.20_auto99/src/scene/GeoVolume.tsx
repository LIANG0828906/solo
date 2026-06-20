import { useRef, useMemo, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGeoStore, getRockInfo } from '@/store/useGeoStore';
import { getColorScale } from '@/utils/geoUtils';

interface GeoVolumeProps {
  onVoxelClick?: (position: { x: number; y: number; z: number }, density: number) => void;
}

export function GeoVolume({ onVoxelClick }: GeoVolumeProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const { geoData, gridSize, colorMode, sliceX, sliceY, sliceZ } = useGeoStore();
  const [hoveredId, setHoveredId] = useState<number | null>(null);
  const colorScale = getColorScale(colorMode);

  const dummy = useMemo(() => new THREE.Object3D(), []);
  const tempColor = useMemo(() => new THREE.Color(), []);

  const { positions, densities, visibleCount } = useMemo(() => {
    const positions: { x: number; y: number; z: number }[] = [];
    const densities: number[] = [];
    let visibleCount = 0;

    if (!geoData) return { positions, densities, visibleCount };

    const halfX = gridSize.x / 2;
    const halfY = gridSize.y / 2;
    const halfZ = gridSize.z / 2;

    const sliceIdxX = Math.floor((sliceX / 100) * gridSize.x);
    const sliceIdxY = Math.floor((sliceY / 100) * gridSize.y);
    const sliceIdxZ = Math.floor((sliceZ / 100) * gridSize.z);

    for (let x = 0; x < gridSize.x; x++) {
      for (let y = 0; y < gridSize.y; y++) {
        for (let z = 0; z < gridSize.z; z++) {
          const density = geoData[x][y][z];
          if (density <= 0.02) continue;

          const xVisible = sliceX === 0 || x <= sliceIdxX;
          const yVisible = sliceY === 0 || y <= sliceIdxY;
          const zVisible = sliceZ === 0 || z <= sliceIdxZ;
          
          if (!xVisible || !yVisible || !zVisible) continue;

          positions.push({
            x: x - halfX + 0.5,
            y: y - halfY + 0.5,
            z: z - halfZ + 0.5
          });
          densities.push(density);
          visibleCount++;
        }
      }
    }

    return { positions, densities, visibleCount };
  }, [geoData, gridSize, sliceX, sliceY, sliceZ]);

  useEffect(() => {
    if (!meshRef.current || !geoData) return;

    const mesh = meshRef.current;
    mesh.count = visibleCount;

    for (let i = 0; i < visibleCount; i++) {
      const pos = positions[i];
      dummy.position.set(pos.x, pos.y, pos.z);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);

      const density = densities[i];
      const color = colorScale(density);
      tempColor.set(color);
      mesh.setColorAt(i, tempColor);
    }

    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) {
      mesh.instanceColor.needsUpdate = true;
    }
  }, [positions, densities, visibleCount, colorScale, dummy, tempColor, geoData]);

  useFrame(({ clock }) => {
    if (!meshRef.current || hoveredId === null) return;
    
    const pulse = 1 + Math.sin(clock.elapsedTime * 4) * 0.05;
    const pos = positions[hoveredId];
    if (pos) {
      dummy.position.set(pos.x, pos.y, pos.z);
      dummy.scale.set(pulse, pulse, pulse);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(hoveredId, dummy.matrix);
      meshRef.current.instanceMatrix.needsUpdate = true;
    }
  });

  const handlePointerOver = (e: any) => {
    e.stopPropagation();
    setHoveredId(e.instanceId);
    document.body.style.cursor = 'pointer';
  };

  const handlePointerOut = (e: any) => {
    e.stopPropagation();
    setHoveredId(null);
    document.body.style.cursor = 'default';
    
    if (meshRef.current && e.instanceId !== undefined) {
      const pos = positions[e.instanceId];
      if (pos) {
        dummy.position.set(pos.x, pos.y, pos.z);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        meshRef.current.setMatrixAt(e.instanceId, dummy.matrix);
        meshRef.current.instanceMatrix.needsUpdate = true;
      }
    }
  };

  const handleClick = (e: any) => {
    e.stopPropagation();
    const idx = e.instanceId;
    if (idx === undefined || idx >= positions.length) return;
    
    const pos = positions[idx];
    const density = densities[idx];
    onVoxelClick?.(pos, density);
  };

  if (!geoData || visibleCount === 0) return null;

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, visibleCount]}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
      onClick={handleClick}
    >
      <boxGeometry args={[0.95, 0.95, 0.95]} />
      <meshStandardMaterial 
        transparent 
        opacity={0.85}
        roughness={0.7}
        metalness={0.1}
      />
    </instancedMesh>
  );
}
