import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useStore } from '@/store/useStore';

export const WaveLines = () => {
  const groupRef = useRef<THREE.Group>(null);
  const linesRef = useRef<(THREE.Line | null)[]>([]);
  
  const { buoys, frequency } = useStore((state) => ({
    buoys: state.buoys,
    frequency: state.frequency,
  }));

  const connections = useMemo(() => {
    const conns: [number, number][] = [];
    for (let i = 0; i < buoys.length; i++) {
      for (let j = i + 1; j < buoys.length; j++) {
        const dist = Math.sqrt(
          Math.pow(buoys[i].position[0] - buoys[j].position[0], 2) +
          Math.pow(buoys[i].position[2] - buoys[j].position[2], 2)
        );
        if (dist < 15) {
          conns.push([i, j]);
        }
      }
    }
    return conns;
  }, [buoys]);

  const lineGeometries = useMemo(() => {
    return connections.map(([i, j]) => {
      const start = buoys[i].position;
      const end = buoys[j].position;
      const points: THREE.Vector3[] = [];
      const segments = 30;
      
      for (let k = 0; k <= segments; k++) {
        const t = k / segments;
        const x = start[0] + (end[0] - start[0]) * t;
        const z = start[2] + (end[2] - start[2]) * t;
        const y = (start[1] + end[1]) * 0.5;
        points.push(new THREE.Vector3(x, y, z));
      }
      
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      return geometry;
    });
  }, [connections, buoys]);

  useFrame((state) => {
    const time = state.clock.elapsedTime;
    
    connections.forEach(([i, j], idx) => {
      if (!linesRef.current[idx]) return;
      
      const line = linesRef.current[idx];
      if (!line) return;
      
      const geometry = line.geometry;
      const positions = geometry.attributes.position.array as Float32Array;
      const start = buoys[i].position;
      const end = buoys[j].position;
      const segments = 30;
      
      for (let k = 0; k <= segments; k++) {
        const t = k / segments;
        const x = start[0] + (end[0] - start[0]) * t;
        const z = start[2] + (end[2] - start[2]) * t;
        const baseY = (start[1] + end[1]) * 0.5;
        
        const waveAmp = 0.3 + frequency * 0.2;
        const waveFreq = frequency * 2;
        const wave = Math.sin(t * Math.PI * 3 + time * waveFreq) * waveAmp;
        const height = Math.sin(t * Math.PI) * wave;
        
        positions[k * 3] = x;
        positions[k * 3 + 1] = baseY + height;
        positions[k * 3 + 2] = z;
      }
      
      geometry.attributes.position.needsUpdate = true;
    });
  });

  const getLineColor = (i: number, j: number) => {
    const color1 = new THREE.Color(buoys[i].color);
    const color2 = new THREE.Color(buoys[j].color);
    return color1.clone().lerp(color2, 0.5);
  };

  return (
    <group ref={groupRef}>
      {connections.map(([i, j], idx) => (
        <primitive
          key={`line-${i}-${j}`}
          object={
            new THREE.Line(
              lineGeometries[idx],
              new THREE.LineBasicMaterial({
                color: getLineColor(i, j),
                transparent: true,
                opacity: 0.6,
              })
            )
          }
          ref={(el) => {
            linesRef.current[idx] = el as THREE.Line;
          }}
        />
      ))}
    </group>
  );
};
