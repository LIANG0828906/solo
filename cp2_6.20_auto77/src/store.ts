import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import {
  MechanismType,
  TriggerType,
  MechanismProp,
  Link,
  GameState,
  EditorMode,
  TriggerHistoryEntry,
  createDefaultProp,
} from './types';

interface Snapshot {
  props: MechanismProp[];
  links: Link[];
}

interface GameStore {
  mode: EditorMode;
  props: MechanismProp[];
  links: Link[];
  gameState: GameState;
  selectedPropId: string | null;
  connectingFromId: string | null;
  placingType: MechanismType | null;
  undoStack: Snapshot[];
  redoStack: Snapshot[];
  transitionOpacity: number;
  logicNodePositions: Record<string, { x: number; y: number }>;
  pendingTriggerType: TriggerType;

  setMode: (mode: EditorMode) => void;
  addProp: (type: MechanismType, position: [number, number, number]) => void;
  removeProp: (id: string) => void;
  updateProp: (id: string, updates: Partial<MechanismProp>) => void;
  selectProp: (id: string | null) => void;
  setPlacingType: (type: MechanismType | null) => void;
  startConnecting: (id: string) => void;
  finishConnecting: (targetId: string, triggerType?: TriggerType) => void;
  cancelConnecting: () => void;
  setPendingTriggerType: (t: TriggerType) => void;
  removeLink: (id: string) => void;
  activateProp: (id: string) => void;
  deactivateProp: (id: string) => void;
  setPlayerPosition: (pos: [number, number, number]) => void;
  addTriggerHistory: (entry: TriggerHistoryEntry) => void;
  updatePropOffset: (id: string, offset: number) => void;
  undo: () => void;
  redo: () => void;
  resetLevel: () => void;
  saveLevel: (name: string) => void;
  loadLevel: (name: string) => boolean;
  getLinks: () => Link[];
  getPropById: (id: string) => MechanismProp | undefined;
  loadExampleLevel: () => void;
  setTransitionOpacity: (v: number) => void;
  setLogicNodePosition: (id: string, x: number, y: number) => void;
  pushSnapshot: () => void;
}

function pushSnapshot(state: { props: MechanismProp[]; links: Link[]; undoStack: Snapshot[]; redoStack: Snapshot[] }): Partial<GameStore> {
  return {
    undoStack: [...state.undoStack, { props: JSON.parse(JSON.stringify(state.props)), links: JSON.parse(JSON.stringify(state.links)) }],
    redoStack: [],
  };
}

const EXAMPLE_LEVEL = {
  props: [
    {
      id: 'ex-pp1',
      type: MechanismType.PressurePlate,
      position: [-3, 0, 0] as [number, number, number],
      rotation: [0, 0, 0] as [number, number, number],
      activated: false,
      name: '压力板_A',
      pressureThreshold: 1,
      laserColor: '#ff0000',
      laserRadius: 0.5,
      moveAxis: 'y' as const,
      moveRange: 3,
      moveSpeed: 1,
      portalTarget: [0, 0, 0] as [number, number, number],
      currentOffset: 0,
    },
    {
      id: 'ex-le1',
      type: MechanismType.LaserEmitter,
      position: [0, 0, 0] as [number, number, number],
      rotation: [0, 0, 0] as [number, number, number],
      activated: false,
      name: '激光发射器_A',
      pressureThreshold: 1,
      laserColor: '#ff0000',
      laserRadius: 0.5,
      moveAxis: 'y' as const,
      moveRange: 3,
      moveSpeed: 1,
      portalTarget: [0, 0, 0] as [number, number, number],
      currentOffset: 0,
    },
    {
      id: 'ex-pt1',
      type: MechanismType.Portal,
      position: [3, 0, 0] as [number, number, number],
      rotation: [0, 0, 0] as [number, number, number],
      activated: false,
      name: '传送门_A',
      pressureThreshold: 1,
      laserColor: '#ff0000',
      laserRadius: 0.5,
      moveAxis: 'y' as const,
      moveRange: 3,
      moveSpeed: 1,
      portalTarget: [6, 0, 0] as [number, number, number],
      currentOffset: 0,
    },
    {
      id: 'ex-mp1',
      type: MechanismType.MovingPlatform,
      position: [6, 0, 0] as [number, number, number],
      rotation: [0, 0, 0] as [number, number, number],
      activated: false,
      name: '移动平台_A',
      pressureThreshold: 1,
      laserColor: '#ff0000',
      laserRadius: 0.5,
      moveAxis: 'y' as const,
      moveRange: 3,
      moveSpeed: 1,
      portalTarget: [0, 0, 0] as [number, number, number],
      currentOffset: 0,
    },
  ],
  links: [
    { id: 'ex-l1', sourceId: 'ex-pp1', targetId: 'ex-le1', triggerType: TriggerType.Continuous },
    { id: 'ex-l2', sourceId: 'ex-le1', targetId: 'ex-pt1', triggerType: TriggerType.Pulse },
    { id: 'ex-l3', sourceId: 'ex-pt1', targetId: 'ex-mp1', triggerType: TriggerType.Continuous },
  ],
};

export const useStore = create<GameStore>((set, get) => ({
  mode: 'editor',
  props: [],
  links: [],
  gameState: {
    propStates: {},
    playerPosition: [0, 0.5, 0],
    triggerHistory: [],
  },
  selectedPropId: null,
  connectingFromId: null,
  placingType: null,
  undoStack: [],
  redoStack: [],
  transitionOpacity: 1,
  logicNodePositions: {},
  pendingTriggerType: TriggerType.Continuous,

  setMode: (mode) => {
    const state = get();
    set({ ...pushSnapshot(state), mode, transitionOpacity: 0 });
    if (mode === 'run') {
      const propStates: GameState['propStates'] = {};
      state.props.forEach((p) => {
        propStates[p.id] = { activated: false, currentOffset: 0 };
      });
      set({
        gameState: {
          propStates,
          playerPosition: [0, 0.5, 0],
          triggerHistory: [],
        },
        props: state.props.map((p) => ({ ...p, activated: false, currentOffset: 0 })),
        selectedPropId: null,
        connectingFromId: null,
        placingType: null,
      });
    }
    setTimeout(() => set({ transitionOpacity: 1 }), 50);
  },

  addProp: (type, position) => {
    const state = get();
    const id = uuidv4();
    const prop = createDefaultProp(type, id);
    prop.position = [
      Math.round(position[0]),
      Math.round(position[1]),
      Math.round(position[2]),
    ];
    set({
      ...pushSnapshot(state),
      props: [...state.props, prop],
    });
  },

  removeProp: (id) => {
    const state = get();
    set({
      ...pushSnapshot(state),
      props: state.props.filter((p) => p.id !== id),
      links: state.links.filter((l) => l.sourceId !== id && l.targetId !== id),
      selectedPropId: state.selectedPropId === id ? null : state.selectedPropId,
    });
  },

  updateProp: (id, updates) => {
    const state = get();
    set({
      ...pushSnapshot(state),
      props: state.props.map((p) => (p.id === id ? { ...p, ...updates } : p)),
    });
  },

  selectProp: (id) => set({ selectedPropId: id, connectingFromId: null }),

  setPlacingType: (type) => set({ placingType: type, selectedPropId: null, connectingFromId: null }),

  startConnecting: (id) => set({ connectingFromId: id, selectedPropId: null }),

  setPendingTriggerType: (t) => set({ pendingTriggerType: t }),

  finishConnecting: (targetId, triggerType) => {
    const state = get();
    if (!state.connectingFromId || state.connectingFromId === targetId) return;
    const exists = state.links.some(
      (l) => l.sourceId === state.connectingFromId && l.targetId === targetId
    );
    if (exists) return;
    const link: Link = {
      id: uuidv4(),
      sourceId: state.connectingFromId,
      targetId,
      triggerType: triggerType || state.pendingTriggerType,
    };
    set({
      ...pushSnapshot(state),
      links: [...state.links, link],
      connectingFromId: null,
    });
  },

  cancelConnecting: () => set({ connectingFromId: null }),

  removeLink: (id) => {
    const state = get();
    set({
      ...pushSnapshot(state),
      links: state.links.filter((l) => l.id !== id),
    });
  },

  activateProp: (id) => {
    set((state) => ({
      props: state.props.map((p) =>
        p.id === id ? { ...p, activated: true } : p
      ),
    }));
  },

  deactivateProp: (id) => {
    set((state) => ({
      props: state.props.map((p) =>
        p.id === id ? { ...p, activated: false } : p
      ),
    }));
  },

  setPlayerPosition: (pos) =>
    set((state) => ({
      gameState: { ...state.gameState, playerPosition: pos },
    })),

  addTriggerHistory: (entry) =>
    set((state) => ({
      gameState: {
        ...state.gameState,
        triggerHistory: [...state.gameState.triggerHistory, entry],
      },
    })),

  updatePropOffset: (id, offset) =>
    set((state) => ({
      props: state.props.map((p) =>
        p.id === id ? { ...p, currentOffset: offset } : p
      ),
    })),

  undo: () => {
    const state = get();
    if (state.undoStack.length === 0) return;
    const prev = state.undoStack[state.undoStack.length - 1];
    set({
      props: prev.props,
      links: prev.links,
      undoStack: state.undoStack.slice(0, -1),
      redoStack: [...state.redoStack, { props: JSON.parse(JSON.stringify(state.props)), links: JSON.parse(JSON.stringify(state.links)) }],
    });
  },

  redo: () => {
    const state = get();
    if (state.redoStack.length === 0) return;
    const next = state.redoStack[state.redoStack.length - 1];
    set({
      props: next.props,
      links: next.links,
      redoStack: state.redoStack.slice(0, -1),
      undoStack: [...state.undoStack, { props: JSON.parse(JSON.stringify(state.props)), links: JSON.parse(JSON.stringify(state.links)) }],
    });
  },

  resetLevel: () => {
    const state = get();
    set({
      ...pushSnapshot(state),
      props: [],
      links: [],
      selectedPropId: null,
      connectingFromId: null,
      placingType: null,
    });
  },

  saveLevel: (name) => {
    const state = get();
    const data = {
      props: state.props,
      links: state.links,
      logicNodePositions: state.logicNodePositions,
    };
    try {
      localStorage.setItem(`level_${name}`, JSON.stringify(data));
    } catch {}
  },

  loadLevel: (name) => {
    try {
      const raw = localStorage.getItem(`level_${name}`);
      if (!raw) return false;
      const data = JSON.parse(raw);
      const state = get();
      set({
        ...pushSnapshot(state),
        props: data.props || [],
        links: data.links || [],
        logicNodePositions: data.logicNodePositions || {},
        selectedPropId: null,
        connectingFromId: null,
      });
      return true;
    } catch {
      return false;
    }
  },

  getLinks: () => get().links,

  getPropById: (id) => get().props.find((p) => p.id === id),

  loadExampleLevel: () => {
    const state = get();
    set({
      ...pushSnapshot(state),
      props: JSON.parse(JSON.stringify(EXAMPLE_LEVEL.props)),
      links: JSON.parse(JSON.stringify(EXAMPLE_LEVEL.links)),
      selectedPropId: null,
      connectingFromId: null,
      placingType: null,
    });
  },

  setTransitionOpacity: (v) => set({ transitionOpacity: v }),

  setLogicNodePosition: (id, x, y) =>
    set((state) => ({
      logicNodePositions: { ...state.logicNodePositions, [id]: { x, y } },
    })),

  pushSnapshot: () => {
    const state = get();
    set(pushSnapshot(state));
  },
}));
