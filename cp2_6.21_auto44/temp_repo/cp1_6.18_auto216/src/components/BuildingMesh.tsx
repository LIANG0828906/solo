import { useRef, useMemo, useEffect } from 'react';
import { useFrame, ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import type { Building } from '@/data/buildingModel';
import { getEnergyColor } from '@/data/buildingModel';
import { useAppStore } from '@/store/useAppStore';
import { easeInOutCubic } from '@/renderer/sceneManager';

interface BuildingMeshProps {
  building: Building;
  solarIntensity: number;
  transitionProgress: number;
  targetBuilding: Building | null;
}

export function BuildingMesh({ building, solarIntensity, transitionProgress, targetBuilding }: BuildingMeshProps) {
  const groupRef = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const edgesRef = useRef<THREE.LineSegments>(null);
  const topRef = useRef<THREE.LineSegments>(null);
  const hovered = useAppStore((s) => s.hoveredBuildingId === building.id);
  const selected = useAppStore((s) => s.selectedBuildingId === building.id);
  const setHovered = useAppStore((s) => s.setHoveredBuilding);
  const setSelected = useAppStore((s) => s.setSelectedBuilding);
  const baseColor = useMemo(() => new THREE.Color(getEnergyColor(building.energyLevel)), [building.energyLevel]);
  const targetColor = useMemo(() => {
    if (targetBuilding) return new THREE.Color(getEnergyColor(targetBuilding.energyLevel));
    return baseColor;
  }, [targetBuilding, baseColor]);

  const { width: cw, height: ch, depth: cd } = building.dimensions;
  const tw = targetBuilding ? targetBuilding.dimensions.width : cw;
  const th = targetBuilding ? targetBuilding.dimensions.height : ch;
  const td = targetBuilding ? targetBuilding.dimensions.depth : cd;

  const cpx = building.position.x;
  const cpy = building.position.y;
  const cpz = building.position.z;
  const tpx = targetBuilding ? targetBuilding.position.x : cpx;
  const tpy = targetBuilding ? targetBuilding.position.y : cpy;
  const tpz = targetBuilding ? targetBuilding.position.z : cpz;

  const ep = easeInOutCubic(transitionProgress);
  const iw = cw + (tw - cw) * ep;
  const ih = ch + (th - ch) * ep;
  const id_ = cd + (td - cd) * ep;
  const ipx = cpx + (tpx - cpx) * ep;
  const ipy = cpy + (tpy - cpy) * ep;
  const ipz = cpz + (tpz - cpz) * ep;
  const color = useMemo(() => {
    return baseColor.clone().lerp(targetColor, ep);
  }, [baseColor, targetColor, ep]);

  const emissiveIntensity = Math.max(0, (solarIntensity - 0.5) * 0.3) + (selected ? 0.15 : 0);
  const brightnessFactor = 0.6 + solarIntensity * 0.5;
  const finalColor = useMemo(() => color.clone().multiplyScalar(brightnessFactor), [color, brightnessFactor]);

  useFrame((_, delta) => {
    if (topRef.current) {
      const mat = topRef.current.material as THREE.LineBasicMaterial;
      const time = performance.now() / 1000;
      mat.opacity = 0.6 + Math.sin(time * (Math.PI * 2) / 3) * 0.15 + (selected ? 0.15 : 0);
      mat.needsUpdate = true;
    }
    if (edgesRef.current) {
      const mat = edgesRef.current.material as THREE.LineBasicMaterial;
      const target = hovered || selected ? 0.95 : 0;
      mat.opacity += (target - mat.opacity) * Math.min(1, delta * 8);
      mat.color.setHex(selected ? 0x00e5ff : 0xffffff);
      mat.needsUpdate = true;
    }
  });

  const handlePointerOver = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    setHovered(building.id);
    document.body.style.cursor = 'pointer';
  };
  const handlePointerOut = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    setHovered(null);
    document.body.style.cursor = 'default';
  };
  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    const current = useAppStore.getState().selectedBuildingId;
    setSelected(current === building.id ? null : building.id);
  };

  return (
    <group ref={groupRef} position={[ipx, ipy, ipz]}>
      <mesh
        ref={meshRef}
        castShadow
        receiveShadow
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        onClick={handleClick}
      >
        <boxGeometry args={[iw, ih, id_]} />
        <meshStandardMaterial
          color={finalColor}
          roughness={0.55}
          metalness={0.15}
          emissive={color}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>
      <lineSegments ref={topRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={8}
            array={
              new Float32Array([
                -iw / 2, ih / 2, -id_ / 2, iw / 2, ih / 2, -id_ / 2,
                iw / 2, ih / 2, -id_ / 2, iw / 2, ih / 2, id_ / 2,
                iw / 2, ih / 2, id_ / 2, -iw / 2, ih / 2, id_ / 2,
                -iw / 2, ih / 2, id_ / 2, -iw / 2, ih / 2, -id_ / 2,
              ])
            }
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial color="#FFFFFF" transparent opacity={0.75} linewidth={2} />
      </lineSegments>
      <lineSegments ref={edgesRef}>
        <edgesGeometry args={[new THREE.BoxGeometry(iw, ih, id_)]} />
        <lineBasicMaterial color="#FFFFFF" transparent opacity={0} linewidth={2} />
      </lineSegments>
    </group>
  );
}
