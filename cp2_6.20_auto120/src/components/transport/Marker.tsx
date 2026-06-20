import type { Vec3 } from '@/types';

interface MarkerProps {
  position: Vec3;
  type: 'start' | 'end';
}

export default function Marker({ position, type }: MarkerProps) {
  const color = type === 'start' ? '#facc15' : '#a855f7';

  return (
    <mesh position={position}>
      <sphereGeometry args={[0.15, 32, 32]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={0.5}
      />
    </mesh>
  );
}
