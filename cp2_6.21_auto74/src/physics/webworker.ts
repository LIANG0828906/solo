import { PhysicsEngine } from './PhysicsEngine';
import type { IStellarBody } from '@/utils/types';

interface WorkerMessage {
  type: 'init' | 'step' | 'setG' | 'addBody' | 'removeBody' | 'setTrajectoryLength';
  payload?: unknown;
}

interface StepPayload {
  dt: number;
  speed: number;
}

const engine = new PhysicsEngine();

self.onmessage = (e: MessageEvent<WorkerMessage>) => {
  const { type, payload } = e.data;

  switch (type) {
    case 'init': {
      const bodies = payload as IStellarBody[];
      engine.initSystem(bodies);
      self.postMessage({
        type: 'initComplete',
        payload: { bodies: engine.getBodies() },
      });
      break;
    }

    case 'step': {
      const { dt, speed } = payload as StepPayload;
      const result = engine.step(dt * speed);
      self.postMessage({
        type: 'stepComplete',
        payload: result,
      });
      break;
    }

    case 'setG': {
      const G = payload as number;
      engine.setG(G);
      break;
    }

    case 'setTrajectoryLength': {
      const length = payload as number;
      engine.setTrajectoryLength(length);
      break;
    }

    case 'addBody': {
      const body = payload as IStellarBody;
      engine.addBody(body);
      self.postMessage({
        type: 'bodyAdded',
        payload: { bodies: engine.getBodies() },
      });
      break;
    }

    case 'removeBody': {
      const id = payload as string;
      engine.removeBody(id);
      self.postMessage({
        type: 'bodyRemoved',
        payload: { bodies: engine.getBodies() },
      });
      break;
    }
  }
};
