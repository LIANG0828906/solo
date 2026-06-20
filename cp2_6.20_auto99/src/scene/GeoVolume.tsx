import { useRef, useMemo, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGeoStore, RockType } from '@/store/useGeoStore';
import { getColorScale } from '@/utils/geoUtils';

interface GeoVolumeProps {
  onVoxelClick?: (position: { x: number; y: number; z: number }, density: number) => void;
}

interface VoxelData {
  position: { x: number; y: number; z: number };
  density: number;
  depth: number;
  rockType: RockType;
  gridIndex: { x: number; y: number; z: number };
}

const getRockType = (density: number): RockType => {
  if (density < 0.3) return 'sedimentary';
  if (density < 0.7) return 'metamorphic';
  return 'igneous';
};

const ROCK_LAYER_COLORS: Record<RockType, THREE.Color> = {
  sedimentary: new THREE.Color('#f59e0b'),
  metamorphic: new THREE.Color('#10b981'),
  igneous: new THREE.Color('#6366f1'),
};

const DEPTH_LAYER_COUNT = 4;

const blendColors = (base: THREE.Color, overlay: THREE.Color, ratio: number): THREE.Color => {
  const result = new THREE.Color();
  result.r = base.r * (1 - ratio) + overlay.r * ratio;
  result.g = base.g * (1 - ratio) + overlay.g * ratio;
  result.b = base.b * (1 - ratio) + overlay.b * ratio;
  return result;
};

const hexToColor = (hex: string): THREE.Color => {
  return new THREE.Color(hex);
};

export function GeoVolume({ onVoxelClick }: GeoVolumeProps) {
  const layerRefs = useRef<Map<string, THREE.InstancedMesh>>(new Map());
  const { geoData, gridSize, colorMode, sliceX, sliceY, sliceZ } = useGeoStore();
  const [hoveredInfo, setHoveredInfo] = useState<{ layerKey: string; index: number } | null>(null);
  const colorScale = getColorScale(colorMode);

  const dummy = useMemo(() => new THREE.Object3D(), []);
  const tempColor = useMemo(() => new THREE.Color(), []);

  const layeredVoxels = useMemo(() => {
    const layers = new Map<string, VoxelData[]>();

    if (!geoData) return layers;

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

          const rockType = getRockType(density);
          const depth = 1 - (y / gridSize.y);
          const depthLayer = Math.min(DEPTH_LAYER_COUNT - 1, Math.floor(depth * DEPTH_LAYER_COUNT));
          const layerKey = `${rockType}_depth_${depthLayer}`;

          if (!layers.has(layerKey)) {
            layers.set(layerKey, []);
          }

          layers.get(layerKey)!.push({
            position: {
              x: x - halfX + 0.5,
              y: y - halfY + 0.5,
              z: z - halfZ + 0.5
            },
            density,
            depth,
            rockType,
            gridIndex: { x, y, z }
          });
        }
      }
    }

    return layers;
  }, [geoData, gridSize, sliceX, sliceY, sliceZ]);

  const layerData = useMemo(() => {
    const result: {
      key: string;
      rockType: RockType;
      depthLayer: number;
      voxels: VoxelData[];
      baseColor: THREE.Color;
      opacity: number;
      roughness: number;
    }[] = [];

    layeredVoxels.forEach((voxels, key) => {
      const [rockType, , depthStr] = key.split('_');
      const depthLayer = parseInt(depthStr);
      const depthRatio = depthLayer / (DEPTH_LAYER_COUNT - 1);

      const baseRockColor = ROCK_LAYER_COLORS[rockType as RockType];
      const coolWarmBlend = new THREE.Color().lerpColors(
        new THREE.Color('#ff6b35'),
        new THREE.Color('#1e40af'),
        depthRatio
      );
      const baseColor = blendColors(baseRockColor, coolWarmBlend, 0.35);

      const opacity = 0.75 + depthRatio * 0.15;
      const roughness = 0.8 - depthRatio * 0.2;

      result.push({
        key,
        rockType: rockType as RockType,
        depthLayer,
        voxels,
        baseColor,
        opacity,
        roughness
      });
    });

    return result.sort((a, b) => a.depthLayer - b.depthLayer);
  }, [layeredVoxels]);

  useEffect(() => {
    layerData.forEach(({ key, voxels, baseColor }) => {
      const mesh = layerRefs.current.get(key);
      if (!mesh) return;

      mesh.count = voxels.length;

      for (let i = 0; i < voxels.length; i++) {
        const voxel = voxels[i];
        dummy.position.set(voxel.position.x, voxel.position.y, voxel.position.z);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);

        const pseudoColor = hexToColor(colorScale(voxel.density));
        const finalColor = blendColors(baseColor, pseudoColor, 0.55);
        tempColor.copy(finalColor);
        mesh.setColorAt(i, tempColor);
      }

      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) {
        mesh.instanceColor.needsUpdate = true;
      }
    });
  }, [layerData, colorScale, dummy, tempColor]);

  useFrame(({ clock }) => {
    if (!hoveredInfo) return;
    
    const { layerKey, index } = hoveredInfo;
    const mesh = layerRefs.current.get(layerKey);
    if (!mesh) return;

    const layer = layerData.find(l => l.key === layerKey);
    if (!layer || index >= layer.voxels.length) return;

    const pulse = 1 + Math.sin(clock.elapsedTime * 4) * 0.08;
    const voxel = layer.voxels[index];
    dummy.position.set(voxel.position.x, voxel.position.y, voxel.position.z);
    dummy.scale.set(pulse, pulse, pulse);
    dummy.updateMatrix();
    mesh.setMatrixAt(index, dummy.matrix);
    mesh.instanceMatrix.needsUpdate = true;
  });

  const handlePointerOver = (layerKey: string) => (e: any) => {
    e.stopPropagation();
    setHoveredInfo({ layerKey, index: e.instanceId });
    document.body.style.cursor = 'pointer';
  };

  const handlePointerOut = (layerKey: string) => (e: any) => {
    e.stopPropagation();
    
    const mesh = layerRefs.current.get(layerKey);
    if (mesh && e.instanceId !== undefined) {
      const layer = layerData.find(l => l.key === layerKey);
      if (layer && e.instanceId < layer.voxels.length) {
        const voxel = layer.voxels[e.instanceId];
        dummy.position.set(voxel.position.x, voxel.position.y, voxel.position.z);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        mesh.setMatrixAt(e.instanceId, dummy.matrix);
        mesh.instanceMatrix.needsUpdate = true;
      }
    }

    setHoveredInfo(null);
    document.body.style.cursor = 'default';
  };

  const handleClick = (layerKey: string) => (e: any) => {
    e.stopPropagation();
    const idx = e.instanceId;
    const layer = layerData.find(l => l.key === layerKey);
    if (!layer || idx === undefined || idx >= layer.voxels.length) return;
    
    const voxel = layer.voxels[idx];
    onVoxelClick?.(voxel.position, voxel.density);
  };

  const setMeshRef = (key: string) => (mesh: THREE.InstancedMesh | null) => {
    if (mesh) {
      layerRefs.current.set(key, mesh);
    } else {
      layerRefs.current.delete(key);
    }
  };

  if (!geoData || layerData.length === 0) return null;

  return (
    <group>
      {layerData.map(({ key, voxels, opacity, roughness, baseColor }) => (
        <instancedMesh
          key={key}
          ref={setMeshRef(key)}
          args={[undefined, undefined, voxels.length]}
          onPointerOver={handlePointerOver(key)}
          onPointerOut={handlePointerOut(key)}
          onClick={handleClick(key)}
        >
          <boxGeometry args={[0.92, 0.92, 0.92]} />
          <meshStandardMaterial 
            transparent 
            opacity={opacity}
            roughness={roughness}
            metalness={0.15}
            emissive={baseColor}
            emissiveIntensity={0.08}
          />
        </instancedMesh>
      ))}
    </group>
  );
}

export default GeoVolume;
