import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Billboard, Text } from '@react-three/drei';
import { a, useSpring } from '@react-spring/three';
import * as THREE from 'three';
import type { CityAQI } from '../types';
import { aqiToColor, aqiToRadius, latLngToVector3 } from '../utils/aqiUtils';
import { useAQIStore } from '../store/aqiStore';

interface HeatmapPointProps {
  city: CityAQI;
  currentYear: number;
}

const AnimatedSprite = a('sprite');

export const HeatmapPoint: React.FC<HeatmapPointProps> = ({ city, currentYear }) => {
  const spriteRef = useRef<THREE.Sprite>(null);
  const groupRef = useRef<THREE.Group>(null);
  const addPulseRipple = useAQIStore((s) => s.addPulseRipple);
  const setHoveredCity = useAQIStore((s) => s.setHoveredCity);
  const hoveredCityId = useAQIStore((s) => s.hoveredCityId);

  const currentAqi = useMemo(() => {
    const data = city.yearlyData.find((d) => d.year === currentYear);
    return data?.aqi ?? 50;
  }, [city.yearlyData, currentYear]);

  const color = aqiToColor(currentAqi);
  const targetRadius = aqiToRadius(currentAqi);

  const basePosition = useMemo(
    () => latLngToVector3(city.lat, city.lng, 5.05),
    [city.lat, city.lng]
  );

  const spriteTexture = useMemo(() => {
    const size = 128;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;
    const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    gradient.addColorStop(0, 'rgba(255,255,255,1)');
    gradient.addColorStop(0.4, 'rgba(255,255,255,0.6)');
    gradient.addColorStop(0.7, 'rgba(255,255,255,0.2)');
    gradient.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
    const tex = new THREE.CanvasTexture(canvas);
    tex.needsUpdate = true;
    return tex;
  }, []);

  const { scale } = useSpring({
    scale: targetRadius * 2,
    config: { duration: 500, easing: (t: number) => t * (2 - t) },
  });

  useFrame(({ clock }) => {
    if (groupRef.current) {
      const t = clock.getElapsedTime();
      const floatY = Math.sin(t * Math.PI) * 0.1;
      groupRef.current.position.y = basePosition[1] + floatY;
    }
  });

  const isHovered = hoveredCityId === city.id;

  const handlePointerOver = (e: THREE.Event) => {
    e.stopPropagation();
    setHoveredCity(city.id);
    document.body.style.cursor = 'pointer';
  };

  const handlePointerOut = (e: THREE.Event) => {
    e.stopPropagation();
    setHoveredCity(null);
    document.body.style.cursor = 'default';
  };

  const handleClick = (e: THREE.Event) => {
    e.stopPropagation();
    const worldPos = new THREE.Vector3(...basePosition);
    addPulseRipple([worldPos.x, worldPos.y, worldPos.z]);
  };

  return (
    <group ref={groupRef} position={basePosition}>
      <AnimatedSprite
        ref={spriteRef}
        scale-x={scale}
        scale-y={scale}
        scale-z={scale}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        onClick={handleClick}
      >
        <spriteMaterial
          map={spriteTexture}
          color={color}
          transparent
          opacity={isHovered ? 0.95 : 0.75}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </AnimatedSprite>

      <Billboard position={[0, targetRadius + 0.25, 0]}>
        <Text
          fontSize={0.15}
          color="#FFFFFF"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.01}
          outlineColor="#000000"
        >
          {city.city}
        </Text>
      </Billboard>
    </group>
  );
};
