import { Line } from '@react-three/drei';
import type { LightSegment } from '@/types/game';

interface LightRayProps {
  segments: LightSegment[];
}

export function LightRay({ segments }: LightRayProps) {
  return (
    <group>
      {segments.map((segment, index) => {
        const start: [number, number, number] = [
          segment.start.x,
          segment.start.y,
          segment.start.z,
        ];
        const end: [number, number, number] = [
          segment.end.x,
          segment.end.y,
          segment.end.z,
        ];

        return (
          <group key={`segment-${index}`}>
            <Line
              points={[start, end]}
              color={segment.color}
              transparent
              opacity={0.8 * segment.intensity}
              lineWidth={3}
            />
            <mesh position={end}>
              <sphereGeometry args={[0.05, 16, 16]} />
              <meshBasicMaterial
                color={segment.color}
                emissive={segment.color}
                emissiveIntensity={1.5}
              />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}
