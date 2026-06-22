import { useRef, useMemo, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { CabinetData } from '../types';
import { useStore } from '../store';
import {
  getHeightByMode,
  getThreeColorByMode,
  easeInOut,
} from '../utils/colorMapping';
import {
  CABINET_WIDTH,
  CABINET_DEPTH,
  ANIMATION,
  HEIGHT_MIN,
} from '../utils/constants';

interface CabinetProps {
  data: CabinetData;
}

export function Cabinet({ data }: CabinetProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const lightRef = useRef<THREE.PointLight>(null);
  const haloRef = useRef<THREE.Mesh>(null);

  const mode = useStore((state) => state.mode);
  const filter = useStore((state) => state.filter);
  const progress = useStore((state) => state.progress);
  const selectedId = useStore((state) => state.selectedId);
  const setSelectedId = useStore((state) => state.setSelectedId);
  const setHoveredId = useStore((state) => state.setHoveredId);
  const getCurrentFrameData = useStore((state) => state.getCurrentFrameData);

  const [targetHeight, setTargetHeight] = useState(HEIGHT_MIN);
  const [currentHeight, setCurrentHeight] = useState(HEIGHT_MIN);
  const [targetColor, setTargetColor] = useState(new THREE.Color('#888888'));
  const [currentColor, setCurrentColor] = useState(new THREE.Color('#888888'));
  const [opacity, setOpacity] = useState(1);
  const [targetOpacity, setTargetOpacity] = useState(1);
  const [haloVisible, setHaloVisible] = useState(false);
  const [haloAlpha, setHaloAlpha] = useState(0);

  const isSelected = selectedId === data.id;
  const isInFilter = filter === 'all' || filter === data.zone;

  const frameData = useMemo(() => {
    return getCurrentFrameData(data.id);
  }, [data.id, progress, getCurrentFrameData]);

  const currentValue = useMemo(() => {
    return mode === 'power' ? frameData.power : frameData.temperature;
  }, [mode, frameData]);

  const breathingScale = useMemo(() => {
    if (!isInFilter) return 1;
    return 1;
  }, [isInFilter]);

  useEffect(() => {
    const newHeight = getHeightByMode(currentValue, mode);
    const newColor = getThreeColorByMode(currentValue, mode);
    setTargetHeight(newHeight);
    setTargetColor(newColor);
  }, [currentValue, mode]);

  useEffect(() => {
    const newOpacity = isInFilter ? 1 : 0.15;
    setTargetOpacity(newOpacity);
  }, [isInFilter]);

  useEffect(() => {
    if (isSelected) {
      setHaloVisible(true);
      const timer = setTimeout(() => {
        setHaloVisible(false);
      }, ANIMATION.haloDuration * 1000);
      return () => clearTimeout(timer);
    }
  }, [isSelected]);

  useFrame((_, delta) => {
    const speed = 1 / ANIMATION.modeTransition;
    const t = Math.min(1, delta * speed);

    setCurrentHeight((prev) => {
      const next = THREE.MathUtils.lerp(prev, targetHeight, easeInOut(t));
      if (meshRef.current) {
        meshRef.current.scale.y = next / HEIGHT_MIN;
        meshRef.current.position.y = next / 2;
      }
      return next;
    });

    setCurrentColor((prev) => {
      const next = prev.clone().lerp(targetColor, easeInOut(t));
      if (meshRef.current) {
        const mat = meshRef.current.material as THREE.MeshStandardMaterial;
        if (mat.color) {
          mat.color.copy(next);
        }
      }
      return next;
    });

    setOpacity((prev) => {
      const fadeSpeed = 1 / ANIMATION.filterFade;
      const fadeT = Math.min(1, delta * fadeSpeed);
      const next = THREE.MathUtils.lerp(prev, targetOpacity, fadeT);
      if (meshRef.current) {
        const mat = meshRef.current.material as THREE.MeshStandardMaterial;
        mat.opacity = next;
        mat.transparent = next < 1;
      }
      return next;
    });

    if (lightRef.current) {
      const brightness = (currentHeight / 4) * 0.8 + 0.2;
      lightRef.current.intensity = brightness * (isInFilter ? 1 : 0.3);
      lightRef.current.color.copy(currentColor);
    }

    if (haloRef.current) {
      const targetHaloAlpha = haloVisible ? 0.6 : 0;
      const haloT = Math.min(1, delta * 3);
      setHaloAlpha((prev) => {
        const next = THREE.MathUtils.lerp(prev, targetHaloAlpha, haloT);
        const mat = haloRef.current?.material as THREE.MeshBasicMaterial;
        if (mat) {
          mat.opacity = next;
          mat.transparent = true;
        }
        return next;
      });

      if (haloVisible && haloRef.current) {
        const scale = 1 + Math.sin(Date.now() * 0.003) * 0.1;
        haloRef.current.scale.setScalar(scale);
      }
    }
  });

  const handlePointerOver = (e: any) => {
    e.stopPropagation();
    if (!isInFilter) return;
    setHoveredId(data.id);
    document.body.style.cursor = 'pointer';
  };

  const handlePointerOut = () => {
    setHoveredId(null);
    document.body.style.cursor = 'auto';
  };

  const handleDoubleClick = (e: any) => {
    e.stopPropagation();
    if (!isInFilter) return;
    setSelectedId(data.id);
  };

  return (
    <group position={[data.x, 0, data.z]} scale={breathingScale}>
      <mesh
        ref={meshRef}
        position={[0, currentHeight / 2, 0]}
        castShadow
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        onDoubleClick={handleDoubleClick}
      >
        <boxGeometry args={[CABINET_WIDTH, HEIGHT_MIN, CABINET_DEPTH]} />
        <meshStandardMaterial
          color={currentColor}
          transparent
          opacity={opacity}
          metalness={0.3}
          roughness={0.5}
          emissive={currentColor}
          emissiveIntensity={isSelected ? 0.2 : 0.05}
        />
      </mesh>

      <mesh position={[0, currentHeight + 0.05, 0]}>
        <cylinderGeometry args={[0.08, 0.08, 0.02, 16]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={opacity} />
      </mesh>

      <pointLight
        ref={lightRef}
        position={[0, currentHeight + 0.2, 0]}
        intensity={0.3}
        distance={3}
        decay={2}
      />

      {haloVisible && (
        <mesh ref={haloRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
          <ringGeometry args={[0.7, 1.0, 32]} />
          <meshBasicMaterial
            color="#ffcc00"
            transparent
            side={THREE.DoubleSide}
          />
        </mesh>
      )}
    </group>
  );
}
