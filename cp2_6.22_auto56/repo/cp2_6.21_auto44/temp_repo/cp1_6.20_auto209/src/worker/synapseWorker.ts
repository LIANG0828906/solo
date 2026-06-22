export interface NeuronData {
  id: number;
  name: string;
  position: { x: number; y: number; z: number };
  color: string;
}

export interface SynapseData {
  id: number;
  from: number;
  to: number;
  weight: number;
  targetWeight: number;
  color: string;
}

export interface WorkerInitData {
  neurons: NeuronData[];
  synapses: SynapseData[];
}

export interface WorkerStartData {
  frequency: number;
  duration: number;
}

export type WorkerMessageType = 'init' | 'start' | 'stop' | 'reset' | 'update' | 'log' | 'pulse';

export interface WorkerMessage {
  type: WorkerMessageType;
  payload?: unknown;
}

export interface UpdatePayload {
  weights: number[];
  targets: number[];
  timestamp: number;
}

export interface LogPayload {
  message: string;
  type: 'info' | 'ltp' | 'ltd' | 'pulse';
  timestamp: number;
}

export interface PulsePayload {
  neuronId: number;
  timestamp: number;
}

interface WorkerState {
  neurons: NeuronData[];
  synapses: SynapseData[];
  isRunning: boolean;
  startTime: number;
  duration: number;
  frequency: number;
  lastPulseTime: Map<number, number>;
  postSynapticPotential: Map<number, number>;
  updateTimer: number | null;
  pulseTimer: number | null;
}

const state: WorkerState = {
  neurons: [],
  synapses: [],
  isRunning: false,
  startTime: 0,
  duration: 1000,
  frequency: 100,
  lastPulseTime: new Map(),
  postSynapticPotential: new Map(),
  updateTimer: null,
  pulseTimer: null
};

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function calculateWeightChange(currentWeight: number, frequency: number, dt: number): { delta: number; event?: 'ltp' | 'ltd' } {
  const baseline = 1.0;
  const thresholdHigh = 140;
  const thresholdLow = 100;
  const learningRate = 0.00008;
  let delta = 0;
  let event: 'ltp' | 'ltd' | undefined;

  if (frequency >= thresholdHigh) {
    delta = learningRate * (frequency - thresholdHigh) * dt * 60;
    if (currentWeight + delta >= 1.5 && currentWeight < 1.5) {
      event = 'ltp';
    }
  } else if (frequency <= thresholdLow) {
    delta = -learningRate * (thresholdLow - frequency) * dt * 60;
    if (currentWeight + delta <= 0.5 && currentWeight > 0.5) {
      event = 'ltd';
    }
  } else {
    delta = (baseline - currentWeight) * learningRate * 0.1 * dt;
  }

  return { delta, event };
}

function updateWeights() {
  if (!state.isRunning) return;

  const now = performance.now();
  const elapsed = now - state.startTime;
  const dt = 1000 / 60;

  if (elapsed >= state.duration) {
    stopSimulation();
    return;
  }

  const weights: number[] = [];
  const targets: number[] = [];

  state.synapses.forEach((synapse) => {
    const { delta, event } = calculateWeightChange(synapse.weight, state.frequency, dt);
    synapse.weight = clamp(synapse.weight + delta, 0, 2);
    synapse.targetWeight = clamp(synapse.weight + delta * 2, 0, 2);

    if (event === 'ltp') {
      const logMsg: LogPayload = {
        message: `突触 ${synapse.id} (N${synapse.from}→N${synapse.to}) 触发LTP! 权重: ${synapse.weight.toFixed(3)}`,
        type: 'ltp',
        timestamp: now
      };
      postMessage({ type: 'log', payload: logMsg });
    } else if (event === 'ltd') {
      const logMsg: LogPayload = {
        message: `突触 ${synapse.id} (N${synapse.from}→N${synapse.to}) 触发LTD! 权重: ${synapse.weight.toFixed(3)}`,
        type: 'ltd',
        timestamp: now
      };
      postMessage({ type: 'log', payload: logMsg });
    }

    weights.push(synapse.weight);
    targets.push(synapse.targetWeight);
  });

  const updatePayload: UpdatePayload = {
    weights,
    targets,
    timestamp: now
  };
  postMessage({ type: 'update', payload: updatePayload });
}

function emitPulses() {
  if (!state.isRunning) return;

  const now = performance.now();
  const pulseInterval = 1000 / state.frequency;

  state.neurons.forEach((neuron) => {
    const lastTime = state.lastPulseTime.get(neuron.id) || 0;
    if (now - lastTime >= pulseInterval) {
      state.lastPulseTime.set(neuron.id, now);
      
      const connectedSynapses = state.synapses.filter(s => s.to === neuron.id);
      const totalPotential = connectedSynapses.reduce((sum, s) => sum + s.weight, 0);
      
      const currentPSP = state.postSynapticPotential.get(neuron.id) || 0;
      state.postSynapticPotential.set(neuron.id, currentPSP + totalPotential);

      const pulsePayload: PulsePayload = {
        neuronId: neuron.id,
        timestamp: now
      };
      postMessage({ type: 'pulse', payload: pulsePayload });
    }
  });
}

function startSimulation(data: WorkerStartData) {
  stopSimulation();
  
  state.isRunning = true;
  state.frequency = data.frequency;
  state.duration = data.duration * 1000;
  state.startTime = performance.now();
  state.lastPulseTime.clear();
  state.postSynapticPotential.clear();

  state.neurons.forEach(n => {
    state.lastPulseTime.set(n.id, 0);
    state.postSynapticPotential.set(n.id, 0);
  });

  state.updateTimer = self.setInterval(updateWeights, 1000 / 60) as unknown as number;
  state.pulseTimer = self.setInterval(emitPulses, 1000 / 200) as unknown as number;

  const logMsg: LogPayload = {
    message: `刺激开始: ${data.frequency}Hz, 持续 ${data.duration}s`,
    type: 'info',
    timestamp: performance.now()
  };
  postMessage({ type: 'log', payload: logMsg });
}

function stopSimulation() {
  state.isRunning = false;
  if (state.updateTimer !== null) {
    clearInterval(state.updateTimer);
    state.updateTimer = null;
  }
  if (state.pulseTimer !== null) {
    clearInterval(state.pulseTimer);
    state.pulseTimer = null;
  }
}

function resetSimulation() {
  stopSimulation();
  state.synapses.forEach(s => {
    s.weight = 1.0;
    s.targetWeight = 1.0;
  });

  const weights: number[] = state.synapses.map(s => s.weight);
  const targets: number[] = state.synapses.map(s => s.targetWeight);
  const updatePayload: UpdatePayload = {
    weights,
    targets,
    timestamp: performance.now()
  };
  postMessage({ type: 'update', payload: updatePayload });

  const logMsg: LogPayload = {
    message: '网络已重置，所有突触权重恢复为1.0',
    type: 'info',
    timestamp: performance.now()
  };
  postMessage({ type: 'log', payload: logMsg });
}

self.onmessage = (e: MessageEvent<WorkerMessage>) => {
  const { type, payload } = e.data;

  switch (type) {
    case 'init':
      const initData = payload as WorkerInitData;
      state.neurons = JSON.parse(JSON.stringify(initData.neurons));
      state.synapses = JSON.parse(JSON.stringify(initData.synapses));
      break;
    case 'start':
      startSimulation(payload as WorkerStartData);
      break;
    case 'stop':
      stopSimulation();
      break;
    case 'reset':
      resetSimulation();
      break;
  }
};

export {};
