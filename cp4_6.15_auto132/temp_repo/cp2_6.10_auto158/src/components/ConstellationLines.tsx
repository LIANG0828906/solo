import { useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { constellations, getStarById, raDecToVector3 } from '@/data/starData';
import { useStore } from '@/store/useStore';

export function ConstellationLines() {
  const groupRef = useRef<THREE.Group>(null);
  const { camera } = useThree();
  
  const showLines = useStore((state) => state.showConstellationLines);
  const timeMonth = useStore((state) => state.timeMonth);

  const lineData = useMemo(() => {
    return constellations.map((constellation) => {
      const positions: [number, number, number][] = [];
      const lineIndices: [number, number][] = [];
      let positionIndex = 0;
      
      const starPositions = new Map<string, number>();
      
      constellation.stars.forEach((starId) => {
        const star = getStarById(starId);
        if (star) {
          const [x, y, z] = raDecToVector3(star.ra, star.dec, 99);
          positions.push([x, y, z]);
          starPositions.set(starId, positionIndex);
          positionIndex++;
        }
      });
      
      constellation.lines.forEach(([startIdx, endIdx]) => {
        const startId = constellation.stars[startIdx];
        const endId = constellation.stars[endIdx];
        const startPosIdx = starPositions.get(startId);
        const endPosIdx = starPositions.get(endId);
        if (startPosIdx !== undefined && endPosIdx !== undefined) {
          lineIndices.push([startPosIdx, endPosIdx]);
        }
      });
      
      return {
        name: constellation.name,
        positions,
        lineIndices,
      };
    });
  }, []);

  useFrame(() => {
    if (groupRef.current) {
      const rotationAngle = (timeMonth / 12) * Math.PI * 2;
      groupRef.current.rotation.y = rotationAngle;
    }
  });

  if (!showLines) return null;

  return (
    <group ref={groupRef}>
      {lineData.map((constellation, constellationIdx) => (
        <group key={constellation.name}>
          {constellation.lineIndices.map(([startIdx, endIdx], lineIdx) => {
            const startPos = constellation.positions[startIdx];
            const endPos = constellation.positions[endIdx];
            if (!startPos || !endPos) return null;
            
            const start = new THREE.Vector3(...startPos);
            const end = new THREE.Vector3(...endPos);
            const mid = start.clone().lerp(end, 0.5);
            const normal = mid.clone().normalize().multiplyScalar(2);
            mid.add(normal);
            
            const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
            const points = curve.getPoints(50);
            const positions = new Float32Array(points.length * 3);
            
            points.forEach((point, i) => {
              positions[i * 3] = point.x;
              positions[i * 3 + 1] = point.y;
              positions[i * 3 + 2] = point.z;
            });
            
            const geometry = new THREE.BufferGeometry();
            geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
            
            return (
              <line key={`${constellationIdx}-${lineIdx}`} geometry={geometry}>
                <lineBasicMaterial
                  color="#d4af37"
                  transparent
                  opacity={0.4}
                  linewidth={1}
                />
              </line>
            );
          })}
          
          {constellation.positions.map((pos, idx) => {
            const starId = constellations[constellationIdx].stars[idx];
            const star = getStarById(starId);
            if (!star || !star.isMain) return null;
            
            return (
              <mesh key={`label-${constellation.name}-${idx}`} position={pos}>
                <sphereGeometry args={[0.3, 8, 8]} />
                <meshBasicMaterial color="#d4af37" />
              </mesh>
            );
          })}
        </group>
      ))}
    </group>
  );
}
