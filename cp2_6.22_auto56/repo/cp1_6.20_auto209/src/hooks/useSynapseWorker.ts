import { useEffect, useRef, useCallback } from 'react';
import type {
  NeuronData,
  SynapseData,
  WorkerInitData,
  WorkerStartData,
  UpdatePayload,
  LogPayload,
  PulsePayload
} from '../worker/synapseWorker';

export interface UseSynapseWorkerParams {
  onWeightsUpdate: (weights: number[], targets: number[]) => void;
  onLog: (log: LogPayload) => void;
  onPulse: (neuronId: number) => void;
}

export function useSynapseWorker({ onWeightsUpdate, onLog, onPulse }: UseSynapseWorkerParams) {
  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    const worker = new Worker(
      new URL('../worker/synapseWorker.ts', import.meta.url),
      { type: 'module' }
    );
    workerRef.current = worker;

    worker.onmessage = (e: MessageEvent) => {
      const { type, payload } = e.data;
      switch (type) {
        case 'update': {
          const data = payload as UpdatePayload;
          onWeightsUpdate(data.weights, data.targets);
          break;
        }
        case 'log': {
          const data = payload as LogPayload;
          onLog(data);
          break;
        }
        case 'pulse': {
          const data = payload as PulsePayload;
          onPulse(data.neuronId);
          break;
        }
      }
    };

    return () => {
      worker.terminate();
      workerRef.current = null;
    };
  }, [onWeightsUpdate, onLog, onPulse]);

  const initNetwork = useCallback((neurons: NeuronData[], synapses: SynapseData[]) => {
    const data: WorkerInitData = { neurons, synapses };
    workerRef.current?.postMessage({ type: 'init', payload: data });
  }, []);

  const startSimulation = useCallback((frequency: number, duration: number) => {
    const data: WorkerStartData = { frequency, duration };
    workerRef.current?.postMessage({ type: 'start', payload: data });
  }, []);

  const stopSimulation = useCallback(() => {
    workerRef.current?.postMessage({ type: 'stop' });
  }, []);

  const resetNetwork = useCallback(() => {
    workerRef.current?.postMessage({ type: 'reset' });
  }, []);

  return {
    initNetwork,
    startSimulation,
    stopSimulation,
    resetNetwork
  };
}
