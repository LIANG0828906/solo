import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import GravitySourceMesh from './GravitySourceMesh';
import ParticleMesh from './ParticleMesh';
import TrajectoryLine from './TrajectoryLine';
import VelocityArrow from './VelocityArrow';
import PotentialGrid from './PotentialGrid';
import FieldIndicator from './FieldIndicator';
import GroundGrid from './GroundGrid';
import SimulationLoop from './SimulationLoop';
import GroundClickHandler from './GroundClickHandler';
import useSimulationStore from '@/store/useSimulationStore';

export default function SimulationCanvas() {
  const gravitySources = useSimulationStore((s) => s.gravitySources);
  const particles = useSimulationStore((s) => s.particles);
  const selectedSourceId = useSimulationStore((s) => s.selectedSourceId);
  const globalMaxSpeed = useSimulationStore((s) => s.globalMaxSpeed);

  return (
    <Canvas camera={{ position: [0, 30, 30], fov: 50 }} style={{ background: '#1a1a2e' }}>
      <ambientLight intensity={0.3} />
      <directionalLight position={[10, 20, 10]} intensity={0.7} />
      <OrbitControls
        enableRotate
        enablePan
        enableZoom
        maxPolarAngle={Math.PI / 2.1}
      />
      <GroundGrid />
      <GroundClickHandler />
      {gravitySources.map((source) => (
        <GravitySourceMesh
          key={source.id}
          source={source}
          isSelected={source.id === selectedSourceId}
          isFadingIn={false}
        />
      ))}
      {particles.map((particle) => (
        <group key={particle.id}>
          <ParticleMesh particle={particle} />
          <TrajectoryLine particle={particle} maxSpeed={globalMaxSpeed} />
          <VelocityArrow particle={particle} />
        </group>
      ))}
      {gravitySources.map((source) => (
        <FieldIndicator key={`field-${source.id}`} source={source} />
      ))}
      <PotentialGrid />
      <SimulationLoop />
    </Canvas>
  );
}
