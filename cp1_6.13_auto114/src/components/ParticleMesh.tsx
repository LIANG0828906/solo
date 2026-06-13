import type { Particle } from '@/store/useSimulationStore';

interface ParticleMeshProps {
  particle: Particle;
}

export default function ParticleMesh({ particle }: ParticleMeshProps) {
  return (
    <mesh position={[particle.position[0], 0.15, particle.position[1]]}>
      <sphereGeometry args={[0.15, 16, 16]} />
      <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.6} />
    </mesh>
  );
}
