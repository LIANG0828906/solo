import { useMemo } from 'react';
import { Html } from '@react-three/drei';
import type { Vector3 } from '@/types/game';

interface AngleIndicatorProps {
  visible: boolean;
  position: Vector3;
  angle: number;
}

export function AngleIndicator({ visible, position, angle }: AngleIndicatorProps) {
  const tickCount = 12;
  const ringRadius = 0.85;

  const ticks = useMemo(() => {
    const result: Array<{
      angleDeg: number;
      isHighlighted: boolean;
      position: [number, number, number];
      rotation: [number, number, number];
    }> = [];

    const normalizedAngle = ((angle % 360) + 360) % 360;
    const highlightedIndex = Math.round(normalizedAngle / 30) % tickCount;

    for (let i = 0; i < tickCount; i++) {
      const angleDeg = i * 30;
      const angleRad = (angleDeg * Math.PI) / 180;
      const x = Math.cos(angleRad) * ringRadius;
      const z = Math.sin(angleRad) * ringRadius;
      result.push({
        angleDeg,
        isHighlighted: i === highlightedIndex,
        position: [x, 0, z],
        rotation: [0, -angleRad, 0],
      });
    }
    return result;
  }, [angle, ringRadius]);

  const arrowAngleRad = (angle * Math.PI) / 180;
  const arrowX = Math.cos(arrowAngleRad) * (ringRadius + 0.1);
  const arrowZ = Math.sin(arrowAngleRad) * (ringRadius + 0.1);
  const normalizedAngle = ((angle % 360) + 360) % 360;

  if (!visible) return null;

  return (
    <group position={[position.x, position.y + 1.8, position.z]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[ringRadius, 0.02, 16, 64]} />
        <meshBasicMaterial
          color="#9ca3af"
          transparent
          opacity={0.4}
        />
      </mesh>

      {ticks.map((tick, index) => (
        <mesh
          key={`tick-${index}`}
          position={tick.position}
          rotation={tick.rotation}
        >
          <cylinderGeometry args={[0.012, 0.012, tick.isHighlighted ? 0.18 : 0.12, 8]} />
          <meshBasicMaterial
            color={tick.isHighlighted ? '#FFD700' : '#6b7280'}
            transparent
            opacity={tick.isHighlighted ? 1 : 0.6}
          />
        </mesh>
      ))}

      <group position={[arrowX, 0, arrowZ]} rotation={[0, -arrowAngleRad + Math.PI / 2, 0]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <coneGeometry args={[0.08, 0.2, 8]} />
          <meshBasicMaterial
            color="#FFD700"
            transparent
            opacity={0.95}
          />
        </mesh>
      </group>

      <Html
        position={[0, 0.5, 0]}
        center
        distanceFactor={10}
        style={{
          pointerEvents: 'none',
        }}
      >
        <div
          style={{
            color: '#FFD700',
            fontFamily: 'monospace',
            fontSize: '18px',
            fontWeight: 'bold',
            textShadow: '0 0 8px rgba(255, 215, 0, 0.8)',
            whiteSpace: 'nowrap',
            userSelect: 'none',
          }}
        >
          {Math.round(normalizedAngle)}°
        </div>
      </Html>
    </group>
  );
}
