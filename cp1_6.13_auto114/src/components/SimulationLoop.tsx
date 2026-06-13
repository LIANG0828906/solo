import { useFrame } from '@react-three/fiber';
import useSimulationStore from '@/store/useSimulationStore';
import { rk4Step } from '@/utils/physicsEngine';

export default function SimulationLoop() {
  useFrame(() => {
    const { isRunning, particles, gravitySources, speedScale, updateParticle, deactivateParticle, setMaxTrajectoryTime, setGlobalMaxSpeed } = useSimulationStore.getState();

    if (!isRunning) return;

    const activeParticles = particles.filter((p) => p.active);
    if (activeParticles.length === 0) return;

    const minStepsPerFrame = 10;
    const stepsPerFrame = Math.max(minStepsPerFrame, Math.ceil(speedScale * 10));
    const dt = 0.01 * speedScale;
    const subDt = dt / stepsPerFrame;

    for (const particle of activeParticles) {
      let pos = particle.position;
      let vel = particle.velocity;

      for (let i = 0; i < stepsPerFrame; i++) {
        const result = rk4Step(pos, vel, gravitySources, subDt);
        pos = result.position;
        vel = result.velocity;
      }

      const speed = Math.sqrt(vel[0] * vel[0] + vel[1] * vel[1]);
      const elapsed = performance.now() - particle.startTime;
      const state = useSimulationStore.getState();
      if (elapsed > state.maxTrajectoryTime) {
        setMaxTrajectoryTime(elapsed);
      }
      if (speed > state.globalMaxSpeed) {
        setGlobalMaxSpeed(speed);
      }

      if (Math.abs(pos[0]) > 30 || Math.abs(pos[1]) > 30 || speed > 100) {
        deactivateParticle(particle.id);
      } else {
        updateParticle(particle.id, pos, vel);
      }
    }
  });

  return null;
}
