import { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { speedToColor } from '@/utils/physicsEngine';
import type { Particle } from '@/store/useSimulationStore';

interface TrajectoryLineProps {
  particle: Particle;
}

export default function TrajectoryLine({ particle }: TrajectoryLineProps) {
  const groupRef = useRef<THREE.Group>(null);

  const line = useMemo(() => {
    const points = particle.trajectory;
    if (points.length < 2) return null;

    const maxSpeed = Math.max(...points.map((p) => p.speed), 1);
    const positions = new Float32Array(points.length * 3);
    const colors = new Float32Array(points.length * 3);

    for (let i = 0; i < points.length; i++) {
      positions[i * 3] = points[i].x;
      positions[i * 3 + 1] = 0.05;
      positions[i * 3 + 2] = points[i].z;

      const c = new THREE.Color(speedToColor(points[i].speed, maxSpeed));
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    const mat = new THREE.LineBasicMaterial({ vertexColors: true });
    return new THREE.Line(geo, mat);
  }, [particle.trajectory]);

  if (!line) return null;

  return <primitive ref={groupRef} object={line} />;
}
