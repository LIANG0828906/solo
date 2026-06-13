import { useRef, useMemo, useEffect } from 'react';
import * as THREE from 'three';
import { speedToColor } from '@/utils/physicsEngine';
import type { Particle } from '@/store/useSimulationStore';

interface TrajectoryLineProps {
  particle: Particle;
  maxSpeed: number;
}

export default function TrajectoryLine({ particle, maxSpeed }: TrajectoryLineProps) {
  const lineRef = useRef<THREE.Line | null>(null);

  const line = useMemo(() => {
    const points = particle.trajectory;
    if (points.length < 2) return null;

    const positions = new Float32Array(points.length * 3);
    const colors = new Float32Array(points.length * 3);

    for (let i = 0; i < points.length; i++) {
      positions[i * 3] = points[i].x;
      positions[i * 3 + 1] = 0.05;
      positions[i * 3 + 2] = points[i].z;

      const c = new THREE.Color(speedToColor(points[i].speed, Math.max(maxSpeed, 1)));
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    const mat = new THREE.LineBasicMaterial({ vertexColors: true });
    return new THREE.Line(geo, mat);
  }, [particle.trajectory, maxSpeed]);

  return line ? <primitive ref={lineRef} object={line} /> : null;
}
