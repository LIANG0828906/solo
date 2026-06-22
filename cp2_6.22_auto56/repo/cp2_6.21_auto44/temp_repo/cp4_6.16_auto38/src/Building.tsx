import { useRef, useMemo, useEffect, useState } from 'react';
import { useFrame, ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import type { BuildingData, BuildingFlowData } from './types';
import { useAppStore } from './store';

import vertexShader from './shaders/heatmapVertex.glsl?raw';
import fragmentShader from './shaders/heatmapFragment.glsl?raw';

interface BuildingProps {
  building: BuildingData;
  flowData: BuildingFlowData | undefined;
}

export function Building({ building, flowData }: BuildingProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const edgesRef = useRef<THREE.LineSegments>(null);
  const [hovered, setHovered] = useState(false);
  const [displayDensity, setDisplayDensity] = useState(flowData?.density ?? 0);
  
  const setHoveredBuilding = useAppStore((state) => state.setHoveredBuilding);
  const setTooltip = useAppStore((state) => state.setTooltip);
  const hoveredBuildingId = useAppStore((state) => state.hoveredBuildingId);

  const targetDensity = flowData?.density ?? 0;
  const density = (flowData?.density ?? 0) / 100;

  const uniforms = useMemo(
    () => ({
      uDensity: { value: density },
      uTime: { value: 0 },
      uHovered: { value: 0.0 },
      uBaseColor: { value: new THREE.Color(0x1a1a2e) },
      uEmissiveColor: { value: new THREE.Color(0x0088ff) },
      uMetalness: { value: 0.7 },
      uRoughness: { value: 0.3 },
    }),
    []
  );

  const shaderMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms,
      vertexShader,
      fragmentShader,
      side: THREE.DoubleSide,
    });
  }, [uniforms]);

  useFrame((state, delta) => {
    uniforms.uTime.value += delta;
    
    const currentDensity = uniforms.uDensity.value;
    const target = targetDensity / 100;
    const newDensity = currentDensity + (target - currentDensity) * delta * 2;
    uniforms.uDensity.value = newDensity;
    setDisplayDensity(newDensity * 100);
    
    if (edgesRef.current) {
      const edgesMat = edgesRef.current.material as THREE.LineBasicMaterial;
      const isHovered = hovered || hoveredBuildingId === building.id;
      const hoverValue = isHovered ? 1.0 : 0.0;
      const currentHover = uniforms.uHovered.value;
      uniforms.uHovered.value = currentHover + (hoverValue - currentHover) * delta * 8;
      
      const heatColor = getHeatColor(newDensity);
      edgesMat.color.lerp(new THREE.Color(heatColor), delta * 8);
      edgesMat.opacity = 0.3 + uniforms.uHovered.value * 0.7;
      edgesMat.visible = true;
    }
  });

  const getHeatColor = (d: number): string => {
    const density = Math.min(1, Math.max(0, d));
    if (density < 0.2) {
      const t = density / 0.2;
      return lerpColor('#1a4de6', '#1ab2e6', t);
    } else if (density < 0.4) {
      const t = (density - 0.2) / 0.2;
      return lerpColor('#1ab2e6', '#33e680', t);
    } else if (density < 0.6) {
      const t = (density - 0.4) / 0.2;
      return lerpColor('#33e680', '#f2d933', t);
    } else if (density < 0.8) {
      const t = (density - 0.6) / 0.2;
      return lerpColor('#f2d933', '#f24d26', t);
    } else {
      const t = (density - 0.8) / 0.2;
      return lerpColor('#f24d26', '#e60d0d', t);
    }
  };

  const lerpColor = (color1: string, color2: string, t: number): string => {
    const c1 = new THREE.Color(color1);
    const c2 = new THREE.Color(color2);
    const result = c1.lerp(c2, t);
    return `#${result.getHexString()}`;
  };

  const handlePointerOver = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
    setHovered(true);
    setHoveredBuilding(building.id);
    document.body.style.cursor = 'pointer';
    
    const heatColor = getHeatColor(density);
    setTooltip({
      visible: true,
      buildingId: building.id,
      buildingName: building.name,
      density: Math.round(displayDensity),
      historicalPeak: Math.round(flowData?.historicalPeak ?? 0),
      position: {
        x: event.clientX,
        y: event.clientY,
      },
    });
  };

  const handlePointerMove = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
    if (hovered) {
      setTooltip({
        position: {
          x: event.clientX,
          y: event.clientY,
        },
      });
    }
  };

  const handlePointerOut = () => {
    setHovered(false);
    if (hoveredBuildingId === building.id) {
      setHoveredBuilding(null);
    }
    document.body.style.cursor = 'default';
    setTooltip({
      visible: false,
      buildingId: null,
    });
  };

  const edgesGeometry = useMemo(() => {
    const geometry = new THREE.BoxGeometry(building.size[0], building.size[1], building.size[2]);
    return new THREE.EdgesGeometry(geometry);
  }, [building.size]);

  return (
    <group position={building.position} rotation={building.rotation}>
      <mesh
        ref={meshRef}
        material={shaderMaterial}
        position={[0, building.size[1] / 2, 0]}
        onPointerOver={handlePointerOver}
        onPointerMove={handlePointerMove}
        onPointerOut={handlePointerOut}
        castShadow
        receiveShadow
      >
        <boxGeometry args={building.size} />
      </mesh>
      <lineSegments
        ref={edgesRef}
        geometry={edgesGeometry}
        position={[0, building.size[1] / 2, 0]}
      >
        <lineBasicMaterial
          color={getHeatColor(density)}
          transparent
          opacity={0.3}
          linewidth={2}
        />
      </lineSegments>
    </group>
  );
}
