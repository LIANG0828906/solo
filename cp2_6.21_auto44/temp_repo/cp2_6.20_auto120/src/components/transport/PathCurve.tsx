import { useMemo } from 'react';
import type { Vec3 } from '@/types';
import { createCatmullRomCurve, generateTubeGeometry } from '@/utils/pathUtils';

interface PathCurveProps {
  start: Vec3;
  end: Vec3;
  controlPoints: Vec3[];
}

export default function PathCurve({ start, end, controlPoints }: PathCurveProps) {
  const geometry = useMemo(() => {
    const curve = createCatmullRomCurve(start, controlPoints, end);
    return generateTubeGeometry(curve, 0.08);
  }, [start, end, controlPoints]);

  return (
    <mesh geometry={geometry}>
      <meshStandardMaterial
        color="#7c3aed"
        transparent
        opacity={0.7}
        wireframe
      />
    </mesh>
  );
}
