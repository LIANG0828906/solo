import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import type { Turbine } from '../types';

interface WakeStreamlineProps {
  turbine: Turbine;
  windDirection: number;
  windSpeed: number;
  getStreamlinePoints: (
    turbine: Turbine,
    windVector: [number, number],
    speed: number,
    numPoints: number
  ) => Array<[number, number, number]>;
}

export function WakeStreamline({ turbine, windDirection, windSpeed, getStreamlinePoints }: WakeStreamlineProps) {
  const lineRef = useRef<THREE.Line>(null);
  const timeRef = useRef(Math.random() * 100);

  const windVector = useMemo((): [number, number] => {
    const rad = (windDirection * Math.PI) / 180;
    return [-Math.sin(rad), -Math.cos(rad)];
  }, [windDirection]);

  const { geometry, material } = useMemo(() => {
    const numPoints = Math.min(30, 15 + Math.floor(windSpeed * 1.5));
    const points = getStreamlinePoints(turbine, windVector, windSpeed, numPoints);

    const positions = new Float32Array(points.length * 3);
    const colors = new Float32Array(points.length * 3);

    for (let i = 0; i < points.length; i++) {
      positions[i * 3] = points[i][0];
      positions[i * 3 + 1] = points[i][1];
      positions[i * 3 + 2] = points[i][2];

      const t = i / (points.length - 1);
      const opacity = 1 - t * 0.8;
      colors[i * 3] = 1.0;
      colors[i * 3 + 1] = 0.9 - t * 0.2;
      colors[i * 3 + 2] = 0.2 + t * 0.1;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const mat = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.6,
      linewidth: 2,
    });

    return { geometry: geo, material: mat };
  }, [turbine, windVector, windSpeed, getStreamlinePoints]);

  useFrame((_, delta) => {
    timeRef.current += delta;
    if (lineRef.current && material) {
      const pulse = 0.5 + 0.3 * Math.sin(timeRef.current * 2);
      material.opacity = 0.4 + pulse * 0.2;
    }
  });

  return (
    <>
      <line ref={lineRef} geometry={geometry} material={material} />
      <MultipleStreamlines
        turbine={turbine}
        windVector={windVector}
        windSpeed={windSpeed}
        getStreamlinePoints={getStreamlinePoints}
      />
    </>
  );
}

function MultipleStreamlines({
  turbine,
  windVector,
  windSpeed,
  getStreamlinePoints,
}: {
  turbine: Turbine;
  windVector: [number, number];
  windSpeed: number;
  getStreamlinePoints: WakeStreamlineProps['getStreamlinePoints'];
}) {
  const lines = useMemo(() => {
    const numLines = Math.min(8, 3 + Math.floor(windSpeed * 0.5));
    const result = [];

    for (let lineIdx = 0; lineIdx < numLines; lineIdx++) {
      const offsetTurbine: Turbine = {
        ...turbine,
        position: [
          turbine.position[0] + (Math.random() - 0.5) * turbine.rotorDiameter * 0.4,
          turbine.position[1],
          turbine.position[2] + (Math.random() - 0.5) * turbine.rotorDiameter * 0.4,
        ],
      };

      const numPoints = Math.min(25, 12 + Math.floor(windSpeed));
      const points = getStreamlinePoints(offsetTurbine, windVector, windSpeed, numPoints);

      const positions = new Float32Array(points.length * 3);
      const colors = new Float32Array(points.length * 3);

      for (let i = 0; i < points.length; i++) {
        positions[i * 3] = points[i][0];
        positions[i * 3 + 1] = points[i][1];
        positions[i * 3 + 2] = points[i][2];

        const t = i / (points.length - 1);
        colors[i * 3] = 1.0;
        colors[i * 3 + 1] = 0.85 - t * 0.15;
        colors[i * 3 + 2] = 0.15;
      }

      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

      const mat = new THREE.LineBasicMaterial({
        vertexColors: true,
        transparent: true,
        opacity: 0.35,
      });

      result.push({ geometry: geo, material: mat, key: lineIdx });
    }

    return result;
  }, [turbine, windVector, windSpeed, getStreamlinePoints]);

  return (
    <>
      {lines.map((line) => (
        <line key={line.key} geometry={line.geometry} material={line.material} />
      ))}
    </>
  );
}
