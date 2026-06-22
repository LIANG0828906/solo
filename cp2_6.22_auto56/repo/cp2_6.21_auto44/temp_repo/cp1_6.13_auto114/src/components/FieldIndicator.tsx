import type { GravitySource } from '@/utils/physicsEngine';
import useSimulationStore from '@/store/useSimulationStore';

interface FieldIndicatorProps {
  source: GravitySource;
}

export default function FieldIndicator({ source }: FieldIndicatorProps) {
  const showFieldIndicators = useSimulationStore((s) => s.showFieldIndicators);

  if (!showFieldIndicators) return null;

  const color = source.mass > 0 ? '#00d4ff' : source.mass < 0 ? '#ff3300' : '#888888';
  const ringRadius = Math.abs(source.mass) * 0.5 + 1;

  return (
    <mesh position={[source.position[0], 0.05, source.position[1]]} rotation={[-Math.PI / 2, 0, 0]}>
      <torusGeometry args={[ringRadius, 0.05, 8, 64]} />
      <meshBasicMaterial color={color} transparent opacity={0.2} />
    </mesh>
  );
}
