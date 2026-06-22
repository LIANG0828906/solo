import * as THREE from 'three';
import type { Particle } from '@/store/useSimulationStore';

interface VelocityArrowProps {
  particle: Particle;
}

export default function VelocityArrow({ particle }: VelocityArrowProps) {
  const speed = Math.sqrt(particle.velocity[0] ** 2 + particle.velocity[1] ** 2);

  if (!particle.active || speed < 0.01) return null;

  const length = Math.min(Math.max(speed * 0.3, 0.5), 3);
  const direction = new THREE.Vector3(particle.velocity[0], 0, particle.velocity[1]).normalize();
  const origin = new THREE.Vector3(particle.position[0], 0.15, particle.position[1]);

  return (
    <group>
      <mesh position={origin.clone().add(direction.clone().multiplyScalar(length / 2)).toArray()}>
        <cylinderGeometry args={[0.03, 0.03, length, 8]} />
        <meshBasicMaterial color="#ffdd00" />
      </mesh>
      <mesh
        position={origin.clone().add(direction.clone().multiplyScalar(length)).toArray()}
        rotation={[0, 0, 0]}
      >
        <coneGeometry args={[0.08, 0.2, 8]} />
        <meshBasicMaterial color="#ffdd00" />
      </mesh>
    </group>
  );
}
