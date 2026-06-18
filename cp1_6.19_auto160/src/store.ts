import { eventBus, EVENTS } from './eventBus';

export interface MetricData {
  month: number;
  satisfaction: number;
  carbon: number;
  economy: number;
}

export interface PolicyContribution {
  month: number;
  [policyId: string]: number;
}

export interface Snapshot {
  id: string;
  name: string;
  selectedPolicies: string[];
  simulationData: MetricData[];
  policyContributions: PolicyContribution[];
  summary: {
    satisfactionChange: number;
    carbonChange: number;
    economyChange: number;
  };
}

export interface SimulationState {
  selectedPolicies: string[];
  simulationData: MetricData[];
  policyContributions: PolicyContribution[];
  isSimulating: boolean;
  snapshots: Snapshot[];
}

const INITIAL_STATE: SimulationState = {
  selectedPolicies: [],
  simulationData: [],
  policyContributions: [],
  isSimulating: false,
  snapshots: [],
};

let state: SimulationState = { ...INITIAL_STATE };
const listeners = new Set<(state: SimulationState) => void>();

export const getState = (): SimulationState => ({ ...state });

export const setState = (partial: Partial<SimulationState>): void => {
  state = { ...state, ...partial };
  listeners.forEach((listener) => listener(state));
};

export const subscribe = (listener: (state: SimulationState) => void): (() => void) => {
  listeners.add(listener);
  listener(state);
  return () => listeners.delete(listener);
};

eventBus.on(EVENTS.START_SIMULATION, () => {
  setState({ isSimulating: true });
});

eventBus.on(EVENTS.SIMULATION_COMPLETE, (data: { simulationData: MetricData[]; policyContributions: PolicyContribution[] }) => {
  setState({
    simulationData: data.simulationData,
    policyContributions: data.policyContributions,
    isSimulating: false,
  });
});

eventBus.on(EVENTS.CLEAR_SELECTION, () => {
  setState({
    selectedPolicies: [],
    simulationData: [],
    policyContributions: [],
  });
});

eventBus.on(EVENTS.SAVE_SNAPSHOT, (snapshot: Omit<Snapshot, 'id'>) => {
  const newSnapshot: Snapshot = {
    ...snapshot,
    id: Date.now().toString(),
  };
  const updatedSnapshots = [...state.snapshots, newSnapshot].slice(-3);
  setState({ snapshots: updatedSnapshots });
});

eventBus.on(EVENTS.LOAD_SNAPSHOT, (snapshotId: string) => {
  const snapshot = state.snapshots.find((s) => s.id === snapshotId);
  if (snapshot) {
    setState({
      selectedPolicies: snapshot.selectedPolicies,
      simulationData: snapshot.simulationData,
      policyContributions: snapshot.policyContributions,
    });
  }
});

eventBus.on(EVENTS.DELETE_SNAPSHOT, (snapshotId: string) => {
  const updatedSnapshots = state.snapshots.filter((s) => s.id !== snapshotId);
  setState({ snapshots: updatedSnapshots });
});

eventBus.on(EVENTS.CLEAR_SNAPSHOTS, () => {
  setState({ snapshots: [] });
});
