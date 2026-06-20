import { useRef, useMemo, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Line } from '@react-three/drei';
import * as THREE from 'three';
import { CuttingPieceData } from '@/types';
import { getShapeOutlinePoints } from '@/modules/leather/LeatherViewer';

interface CuttingPathProps {
  piece: CuttingPieceData;
}

export function CuttingPath3D({ piece }: CuttingPathProps) {
  const dashOffset = useRef(0);
  const [glowColor, setGlowColor] = useState('#ff8844');
  const [glowOpacity, setGlowOpacity] = useState(0.6);

  const outlinePoints = useMemo(() => {
    const pts = getShapeOutlinePoints(
      piece.shape,
      piece.width * piece.scale,
      piece.height * piece.scale
    );
    return pts.map(([x, y]): [number, number, number] => [x, 0.02, y]);
  }, [piece.shape, piece.width, piece.height, piece.scale]);

  useFrame((_, delta) => {
    dashOffset.current -= delta * 2;
    if (dashOffset.current < -20) dashOffset.current = 0;

    const t = (Math.sin(Date.now() * 0.003) + 1) / 2;
    const r = 255;
    const g = Math.floor(68 + t * 68);
    const b = 68;
    setGlowColor(`rgb(${r},${g},${b})`);
    setGlowOpacity(0.5 + t * 0.3);
  });

  return (
    <group
      position={[piece.position.x, 0.005, piece.position.y]}
      rotation={[0, -piece.rotation, 0]}
    >
      <Line
        points={outlinePoints}
        color="#ff4444"
        lineWidth={1.5}
        dashed
        dashSize={0.05}
        gapSize={0.05}
        transparent
        opacity={0.9}
      />
      <Line
        points={outlinePoints}
        color={glowColor}
        lineWidth={2}
        transparent
        opacity={glowOpacity}
      />
    </group>
  );
}
