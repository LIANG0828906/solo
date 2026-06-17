import { useEffect, useRef, useMemo, useState } from 'react';
import type { ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { BuildingMesh } from './Building';
import { useAppStore } from '@/store/useAppStore';
import { cityGenerator } from '@/engine/cityGenerator';
import { audioEngine } from '@/engine/audioEngine';
import { CameraController } from '@/engine/cameraController';
import type { BuildingData, TooltipData } from '@/types';
import { uiConfig } from '@/data/uiConfig';

function CityScene() {
  const {
    cityConfig,
    buildings,
    setBuildings,
    animationKey,
    updateFPS,
    updateVisibleBuildings,
    selectBuilding,
    hoverBuilding,
    setAnimating,
  } = useAppStore();

  const [animationProgress, setAnimationProgress] = useState(1);
  const animationStartRef = useRef(0);
  const prevConfigRef = useRef(cityConfig);
  const transitionDuration = uiConfig.animation.transitionDuration;

  useEffect(() => {
    audioEngine.init().catch(() => {});
  }, []);

  useEffect(() => {
    const prev = prevConfigRef.current;
    const needsFullRegeneration =
      prev.noiseType !== cityConfig.noiseType ||
      prev.density !== cityConfig.density ||
      prev.gridSize !== cityConfig.gridSize;

    const needsHeightUpdate = prev.heightScale !== cityConfig.heightScale;
    const needsColorUpdate = prev.colorContrast !== cityConfig.colorContrast;

    let newBuildings: BuildingData[] = [];

    if (needsFullRegeneration) {
      newBuildings = cityGenerator.generateCity(cityConfig);
    } else if (buildings.length > 0) {
      newBuildings = [...buildings];
      if (needsHeightUpdate) {
        newBuildings = cityGenerator.updateHeights(newBuildings, cityConfig.heightScale);
      }
      if (needsColorUpdate) {
        newBuildings = cityGenerator.recalculateColors(newBuildings, cityConfig.colorContrast);
      }
    } else {
      newBuildings = cityGenerator.generateCity(cityConfig);
    }

    setBuildings(newBuildings);
    updateVisibleBuildings(newBuildings.length);
    prevConfigRef.current = { ...cityConfig };

    animationStartRef.current = performance.now();
    setAnimationProgress(0);
    setAnimating(true);

    const animate = () => {
      const elapsed = performance.now() - animationStartRef.current;
      const progress = Math.min(1, elapsed / transitionDuration);
      setAnimationProgress(progress);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setAnimating(false);
      }
    };
    requestAnimationFrame(animate);
  }, [animationKey]);

  const handlePointerOver = (e: ThreeEvent<PointerEvent>, building: BuildingData) => {
    document.body.style.cursor = 'pointer';
    const tooltip: TooltipData = {
      id: building.id,
      height: Number(building.targetHeight.toFixed(2)),
      color: building.baseColor,
      x: e.clientX,
      y: e.clientY,
    };
    hoverBuilding(building.id, tooltip);
  };

  const handlePointerOut = () => {
    document.body.style.cursor = 'default';
    hoverBuilding(null, null);
  };

  const handleClick = (_e: ThreeEvent<MouseEvent>, building: BuildingData) => {
    selectBuilding(building.id);
  };

  const sortedBuildings = useMemo(
    () => [...buildings].sort((a, b) => (a.hovered ? -1 : 1) - (b.hovered ? -1 : 1) || a.targetHeight - b.targetHeight),
    [buildings],
  );

  return (
    <>
      <ambientLight intensity={0.4} color="#8892B0" />
      <directionalLight
        position={[20, 50, 30]}
        intensity={0.8}
        color="#FFFFFF"
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <directionalLight
        position={[-30, 20, -20]}
        intensity={0.3}
        color="#81ECEC"
      />
      <pointLight position={[0, 60, 0]} intensity={0.2} color="#FF6B6B" distance={100} />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[200, 200]} />
        <meshStandardMaterial color="#0F0F1A" roughness={1} metalness={0} />
      </mesh>

      <gridHelper
        args={[120, 60, '#2A2A4A', '#1E1E3A']}
        position={[0, 0.001, 0]}
      />

      {sortedBuildings.map((building) => (
        <BuildingMesh
          key={building.id}
          data={building}
          animationProgress={animationProgress}
          onPointerOver={handlePointerOver as unknown as (e: THREE.Event, b: BuildingData) => void}
          onPointerOut={handlePointerOut}
          onClick={handleClick as unknown as (e: THREE.Event, b: BuildingData) => void}
        />
      ))}

      <CameraController
        onFpsUpdate={updateFPS}
        onVisibleBuildingsChange={updateVisibleBuildings}
        buildingCount={buildings.length}
      />
    </>
  );
}

export default CityScene;
