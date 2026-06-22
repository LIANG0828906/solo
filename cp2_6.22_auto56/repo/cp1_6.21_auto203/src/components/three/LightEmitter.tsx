import type { Vector3 } from '@/types/game';

interface LightEmitterProps {
  position: Vector3;
}

export function LightEmitter({ position }: LightEmitterProps) {
  return (
    <group position={[position.x, position.y, position.z]}>
      <mesh>
        <cylinderGeometry args={[0.15, 0.15, 0.4, 24]} />
        <meshStandardMaterial
          color="#4a4570"
          emissive="#FFD700"
          emissiveIntensity={0.5}
          roughness={0.5}
          metalness={0.4}
        />
      </mesh>
      <mesh position={[0, 0.22, 0]}>
        <sphereGeometry args={[0.075, 24, 24]} />
        <meshBasicMaterial color="#FFD700" />
      </mesh>
      <pointLight
        position={[0, 0.2, 0]}
        color="#FFD700"
        intensity={1.5}
        distance={8}
        decay={2}
      />
    </group>
  );
}
