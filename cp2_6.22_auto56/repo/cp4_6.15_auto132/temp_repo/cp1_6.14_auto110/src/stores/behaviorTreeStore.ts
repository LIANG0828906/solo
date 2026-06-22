import { create } from 'zustand';
import type { TreeNodeData, Connection, EnvironmentState, CharacterState, RunState, NodeType } from '@/types/behaviorTree';
import { generateId } from '@/utils/animation';
import { BehaviorTreeEngine } from '@/engine/behaviorTree';

interface BehaviorTreeState {
  nodes: TreeNodeData[];
  connections: Connection[];
  environment: EnvironmentState;
  character: CharacterState;
  runState: RunState;
  panelCollapsed: boolean;
  editingNodeId: string | null;
  currentActionLabel: string | null;
  showFlash: boolean;
  engine: BehaviorTreeEngine;
  addNode: (type: NodeType, x: number, y: number) => void;
  removeNode: (id: string) => void;
  updateNodePosition: (id: string, x: number, y: number) => void;
  updateNodeProperties: (id: string, props: Record<string, unknown>) => void;
  setEditingNode: (id: string | null) => void;
  addConnection: (fromId: string, toId: string) => void;
  removeConnection: (id: string) => void;
  updateEnvironment: (env: Partial<EnvironmentState>) => void;
  start: () => void;
  pause: () => void;
  step: () => void;
  reset: () => void;
  executeTick: () => void;
  togglePanel: () => void;
  setCurrentActionLabel: (label: string | null) => void;
  setShowFlash: (show: boolean) => void;
}

const getDefaultLabel = (type: NodeType): string => {
  switch (type) {
    case 'selector':
      return '选择器';
    case 'sequence':
      return '顺序';
    case 'condition':
      return '条件';
    case 'action':
      return '动作';
    default:
      return '节点';
  }
};

const getDefaultProperties = (type: NodeType): Record<string, unknown> => {
  switch (type) {
    case 'condition':
      return { conditionType: 'playerDistance', operator: 'lt', value: 30 };
    case 'action':
      return { actionType: 'idle' };
    default:
      return {};
  }
};

let intervalId: ReturnType<typeof setInterval> | null = null;

export const useBehaviorTreeStore = create<BehaviorTreeState>((set, get) => ({
  nodes: [],
  connections: [],
  environment: { playerDistance: 50, health: 100, hasCover: false },
  character: { position: { x: 0, z: 0 }, rotation: 0, action: 'idle', isCrouching: false },
  runState: { isRunning: false, currentNodeId: null as unknown as string, executionPath: [], speed: 50 },
  panelCollapsed: false,
  editingNodeId: null,
  currentActionLabel: null,
  showFlash: false,
  engine: new BehaviorTreeEngine([], []),

  addNode: (type: NodeType, x: number, y: number) => {
    const newNode: TreeNodeData = {
      id: generateId(),
      type,
      x,
      y,
      label: getDefaultLabel(type),
      properties: getDefaultProperties(type),
      isActive: false,
      isExecuting: false,
    };
    set((state) => ({ nodes: [...state.nodes, newNode] }));
  },

  removeNode: (id: string) => {
    set((state) => ({
      nodes: state.nodes.filter((node) => node.id !== id),
      connections: state.connections.filter((conn) => conn.fromNodeId !== id && conn.toNodeId !== id),
    }));
  },

  updateNodePosition: (id: string, x: number, y: number) => {
    set((state) => ({
      nodes: state.nodes.map((node) =>
        node.id === id ? { ...node, x, y } : node
      ),
    }));
  },

  updateNodeProperties: (id: string, props: Record<string, unknown>) => {
    set((state) => ({
      nodes: state.nodes.map((node) =>
        node.id === id ? { ...node, properties: { ...node.properties, ...props } } : node
      ),
    }));
  },

  setEditingNode: (id: string | null) => {
    set({ editingNodeId: id });
  },

  addConnection: (fromId: string, toId: string) => {
    const newConnection: Connection = {
      id: generateId(),
      fromNodeId: fromId,
      fromPort: 'output',
      toNodeId: toId,
      toPort: 'input',
      isActive: false,
    };
    set((state) => ({ connections: [...state.connections, newConnection] }));
  },

  removeConnection: (id: string) => {
    set((state) => ({
      connections: state.connections.filter((conn) => conn.id !== id),
    }));
  },

  updateEnvironment: (env: Partial<EnvironmentState>) => {
    set((state) => ({ environment: { ...state.environment, ...env } }));
  },

  start: () => {
    set({ runState: { ...get().runState, isRunning: true } });
    if (intervalId) {
      clearInterval(intervalId);
    }
    intervalId = setInterval(() => {
      get().executeTick();
    }, 50);
  },

  pause: () => {
    set({ runState: { ...get().runState, isRunning: false } });
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
  },

  step: () => {
    get().executeTick();
  },

  reset: () => {
    const state = get();
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
    set({
      character: { position: { x: 0, z: 0 }, rotation: 0, action: 'idle', isCrouching: false },
      runState: { isRunning: false, currentNodeId: null as unknown as string, executionPath: [], speed: state.runState.speed },
      nodes: state.nodes.map((node) => ({ ...node, isActive: false, isExecuting: false })),
      connections: state.connections.map((conn) => ({ ...conn, isActive: false })),
    });
  },

  executeTick: () => {
    const state = get();
    const { nodes, connections, environment, character, engine } = state;

    engine.setNodes(nodes);
    engine.setConnections(connections);

    const rootNodes = nodes.filter(
      (node) => !connections.some((conn) => conn.toNodeId === node.id)
    );

    if (rootNodes.length === 0) {
      return;
    }

    const rootNode = rootNodes[0];
    const result = engine.tick(rootNode.id, environment, character);

    const updatedNodes = nodes.map((node) => ({
      ...node,
      isActive: result.executionPath.includes(node.id),
      isExecuting: result.executionPath[result.executionPath.length - 1] === node.id,
    }));

    const updatedConnections = connections.map((conn) => ({
      ...conn,
      isActive: result.executionPath.includes(conn.fromNodeId) && result.executionPath.includes(conn.toNodeId),
    }));

    const newCharacter: CharacterState = {
      ...character,
      ...result.charState,
    };

    const newExecutionPath = [...state.runState.executionPath, ...result.executionPath].slice(-20);
    const currentNodeId = result.executionPath[result.executionPath.length - 1] ?? state.runState.currentNodeId;
    const executedNode = updatedNodes.find((n) => n.id === currentNodeId);

    set({
      nodes: updatedNodes,
      connections: updatedConnections,
      character: newCharacter,
      runState: {
        ...state.runState,
        currentNodeId,
        executionPath: newExecutionPath,
      },
      currentActionLabel: executedNode?.label || null,
    });
  },

  togglePanel: () => {
    set((state) => ({ panelCollapsed: !state.panelCollapsed }));
  },

  setCurrentActionLabel: (label: string | null) => {
    set({ currentActionLabel: label });
  },

  setShowFlash: (show: boolean) => {
    set({ showFlash: show });
  },
}));
