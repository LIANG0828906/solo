import type { Vec3 } from '@/types';

interface AxisIndicatorProps {
  position?: Vec3;
  scale?: number;
  showLabels?: boolean;
}

export default function AxisIndicator({
  position = [0, 0, 0],
  scale = 1,
  showLabels = true,
}: AxisIndicatorProps) {
  const axisLength = 1.5 * scale;
  const shaftRadius = 0.02 * scale;
  const headRadius = 0.06 * scale;
  const headLength = 0.15 * scale;

  return (
    <group position={position}>
      <group position={[axisLength / 2, 0, 0]}>
        <mesh rotation={[0, 0, -Math.PI / 2]}>
          <cylinderGeometry args={[shaftRadius, shaftRadius, axisLength - headLength, 8]} />
          <meshBasicMaterial color="#ff4444" />
        </mesh>
        <mesh position={[(axisLength - headLength) / 2, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
          <coneGeometry args={[headRadius, headLength, 8]} />
          <meshBasicMaterial color="#ff4444" />
        </mesh>
      </group>

      <group position={[0, axisLength / 2, 0]}>
        <mesh>
          <cylinderGeometry args={[shaftRadius, shaftRadius, axisLength - headLength, 8]} />
          <meshBasicMaterial color="#44ff44" />
        </mesh>
        <mesh position={[0, (axisLength - headLength) / 2, 0]}>
          <coneGeometry args={[headRadius, headLength, 8]} />
          <meshBasicMaterial color="#44ff44" />
        </mesh>
      </group>

      <group position={[0, 0, axisLength / 2]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[shaftRadius, shaftRadius, axisLength - headLength, 8]} />
          <meshBasicMaterial color="#4488ff" />
        </mesh>
        <mesh position={[0, 0, (axisLength - headLength) / 2]} rotation={[-Math.PI / 2, 0, 0]}>
          <coneGeometry args={[headRadius, headLength, 8]} />
          <meshBasicMaterial color="#4488ff" />
        </mesh>
      </group>

      {showLabels && (
        <>
          <mesh position={[axisLength + 0.1, 0, 0]}>
            <sphereGeometry args={[0.08 * scale, 8, 8]} />
            <meshBasicMaterial color="#ff4444" />
          </mesh>
          <mesh position={[0, axisLength + 0.1, 0]}>
            <sphereGeometry args={[0.08 * scale, 8, 8]} />
            <meshBasicMaterial color="#44ff44" />
          </mesh>
          <mesh position={[0, 0, axisLength + 0.1]}>
            <sphereGeometry args={[0.08 * scale, 8, 8]} />
            <meshBasicMaterial color="#4488ff" />
          </mesh>
        </>
      )}
    </group>
  );
}
