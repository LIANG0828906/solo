import React, { useRef, useMemo } from 'react';
import { Text, Billboard } from '@react-three/drei';
import { a, useSpring } from '@react-spring/three';
import * as THREE from 'three';
import type { CityAQI } from '../types';
import { aqiToHeight, aqiToColor, latLngToVector3 } from '../utils/aqiUtils';
import { useAQIStore } from '../store/aqiStore';

interface AQIBarChartProps {
  city: CityAQI;
  currentYear: number;
}

const AnimatedMesh = a('mesh');

export const AQIBarChart: React.FC<AQIBarChartProps> = ({ city, currentYear }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const addPulseRipple = useAQIStore((s) => s.addPulseRipple);
  const setHoveredCity = useAQIStore((s) => s.setHoveredCity);
  const hoveredCityId = useAQIStore((s) => s.hoveredCityId);

  const currentAqi = useMemo(() => {
    const data = city.yearlyData.find((d) => d.year === currentYear);
    return data?.aqi ?? 50;
  }, [city.yearlyData, currentYear]);

  const targetHeight = aqiToHeight(currentAqi);
  const color = aqiToColor(currentAqi);

  const { scaleY } = useSpring({
    scaleY: targetHeight,
    config: { duration: 500, easing: (t: number) => t * (2 - t) },
  });

  const position = useMemo(
    () => latLngToVector3(city.lat, city.lng, 5),
    [city.lat, city.lng]
  );

  const normalizedDir = useMemo(() => {
    const v = new THREE.Vector3(...position).normalize();
    return [v.x, v.y, v.z] as [number, number, number];
  }, [position]);

  const quaternion = useMemo(() => {
    const up = new THREE.Vector3(0, 1, 0);
    const dir = new THREE.Vector3(...normalizedDir).normalize();
    const q = new THREE.Quaternion().setFromUnitVectors(up, dir);
    return q;
  }, [normalizedDir]);

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
    const worldPos = new THREE.Vector3();
    meshRef.current?.getWorldPosition(worldPos);
    addPulseRipple([worldPos.x, worldPos.y, worldPos.z]);
  };

  const isHovered = hoveredCityId === city.id;

  return (
    <group position={position} quaternion={quaternion}>
      <AnimatedMesh
        ref={meshRef}
        position={[0, targetHeight / 2, 0]}
        scale-x={isHovered ? 0.2 : 0.15}
        scale-y={scaleY}
        scale-z={isHovered ? 0.2 : 0.15}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        onClick={handleClick}
      >
        <cylinderGeometry args={[1, 1, 1, 8]} />
        <meshStandardMaterial
          color={color}
          transparent
          opacity={0.9}
          emissive={color}
          emissiveIntensity={isHovered ? 0.4 : 0.2}
          metalness={0.3}
          roughness={0.4}
        />
      </AnimatedMesh>

      <Billboard position={[0, targetHeight + 0.3, 0]}>
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
