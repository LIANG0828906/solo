import { create } from 'zustand';
import type {
  Story,
  SceneNode,
  SceneEdge,
  GameVariable,
  GameRuntimeState,
  VariableRule,
} from '../types';

interface GameStore {
  story: Story | null;
  setStory: (story: Story | null) => void;

  updateNode: (nodeId: string, updates: Partial<SceneNode>) => void;
  addNode: (node: SceneNode) => void;
  removeNode: (nodeId: string) => void;

  updateEdge: (edgeId: string, updates: Partial<SceneEdge>) => void;
  addEdge: (edge: SceneEdge) => void;
  removeEdge: (edgeId: string) => void;

  variables: GameVariable[];
  addVariable: (variable: GameVariable) => void;
  updateVariable: (variableId: string, updates: Partial<GameVariable>) => void;
  removeVariable: (variableId: string) => void;

  runtimeState: GameRuntimeState | null;
  setCurrentNode: (nodeId: string) => void;
  applyVariableRules: (rules: VariableRule[]) => void;
  resetRuntime: () => void;

  selectedNodeId: string | null;
  setSelectedNode: (nodeId: string | null) => void;
}

const syncVariablesFromStory = (story: Story | null): GameVariable[] => {
  if (!story) return [];
  return [...story.variables];
};

const initRuntimeFromStory = (story: Story | null): GameRuntimeState | null => {
  if (!story) return null;
  const variables: Record<string, number | boolean> = {};
  story.variables.forEach((v) => {
    variables[v.id] = v.initialValue;
  });
  const startNode = story.nodes.find((n) => n.isStart) || story.nodes[0];
  return {
    currentNodeId: startNode?.id || '',
    variables,
    visitedNodes: startNode ? [startNode.id] : [],
  };
};

export const useGameStore = create<GameStore>((set, get) => ({
  story: null,
  setStory: (story) =>
    set({
      story,
      variables: syncVariablesFromStory(story),
      runtimeState: initRuntimeFromStory(story),
      selectedNodeId: null,
    }),

  updateNode: (nodeId, updates) =>
    set((state) => {
      if (!state.story) return state;
      const nodes = state.story.nodes.map((node) =>
        node.id === nodeId ? { ...node, ...updates } : node
      );
      return {
        story: { ...state.story, nodes },
      };
    }),

  addNode: (node) =>
    set((state) => {
      if (!state.story) return state;
      const nodes = [...state.story.nodes, node];
      let startNodeId = state.story.startNodeId;
      if (node.isStart || !startNodeId) {
        startNodeId = node.id;
      }
      return {
        story: { ...state.story, nodes, startNodeId },
      };
    }),

  removeNode: (nodeId) =>
    set((state) => {
      if (!state.story) return state;
      const nodes = state.story.nodes.filter((node) => node.id !== nodeId);
      const edges = state.story.edges.filter(
        (edge) => edge.source !== nodeId && edge.target !== nodeId
      );
      let startNodeId = state.story.startNodeId;
      if (startNodeId === nodeId) {
        const newStart = nodes.find((n) => n.isStart) || nodes[0];
        startNodeId = newStart?.id;
      }
      return {
        story: { ...state.story, nodes, edges, startNodeId },
        selectedNodeId:
          state.selectedNodeId === nodeId ? null : state.selectedNodeId,
      };
    }),

  updateEdge: (edgeId, updates) =>
    set((state) => {
      if (!state.story) return state;
      const edges = state.story.edges.map((edge) =>
        edge.id === edgeId ? { ...edge, ...updates } : edge
      );
      return {
        story: { ...state.story, edges },
      };
    }),

  addEdge: (edge) =>
    set((state) => {
      if (!state.story) return state;
      const edges = [...state.story.edges, edge];
      return {
        story: { ...state.story, edges },
      };
    }),

  removeEdge: (edgeId) =>
    set((state) => {
      if (!state.story) return state;
      const edges = state.story.edges.filter((edge) => edge.id !== edgeId);
      return {
        story: { ...state.story, edges },
      };
    }),

  variables: [],
  addVariable: (variable) =>
    set((state) => {
      if (!state.story) return state;
      const variables = [...state.story.variables, variable];
      const runtimeState = state.runtimeState
        ? {
            ...state.runtimeState,
            variables: {
              ...state.runtimeState.variables,
              [variable.id]: variable.initialValue,
            },
          }
        : state.runtimeState;
      return {
        story: { ...state.story, variables },
        variables,
        runtimeState,
      };
    }),

  updateVariable: (variableId, updates) =>
    set((state) => {
      if (!state.story) return state;
      const variables = state.story.variables.map((v) =>
        v.id === variableId ? { ...v, ...updates } : v
      );
      const runtimeState = state.runtimeState
        ? {
            ...state.runtimeState,
            variables: {
              ...state.runtimeState.variables,
              [variableId]:
                updates.initialValue !== undefined
                  ? updates.initialValue
                  : state.runtimeState.variables[variableId],
            },
          }
        : state.runtimeState;
      return {
        story: { ...state.story, variables },
        variables,
        runtimeState,
      };
    }),

  removeVariable: (variableId) =>
    set((state) => {
      if (!state.story) return state;
      const variables = state.story.variables.filter(
        (v) => v.id !== variableId
      );
      const nodes = state.story.nodes.map((node) => ({
        ...node,
        variableRules: node.variableRules.filter(
          (r) => r.variableId !== variableId
        ),
      }));
      const edges = state.story.edges.map((edge) => ({
        ...edge,
        conditions: edge.conditions.filter(
          (c) => c.variableId !== variableId
        ),
      }));
      const runtimeState = state.runtimeState
        ? {
            ...state.runtimeState,
            variables: Object.fromEntries(
              Object.entries(state.runtimeState.variables).filter(
                ([key]) => key !== variableId
              )
            ),
          }
        : state.runtimeState;
      return {
        story: { ...state.story, variables, nodes, edges },
        variables,
        runtimeState,
      };
    }),

  runtimeState: null,
  setCurrentNode: (nodeId) =>
    set((state) => {
      if (!state.runtimeState) return state;
      const visitedNodes = state.runtimeState.visitedNodes.includes(nodeId)
        ? state.runtimeState.visitedNodes
        : [...state.runtimeState.visitedNodes, nodeId];
      return {
        runtimeState: {
          ...state.runtimeState,
          currentNodeId: nodeId,
          visitedNodes,
        },
      };
    }),

  applyVariableRules: (rules) =>
    set((state) => {
      if (!state.runtimeState) return state;
      const newVariables = { ...state.runtimeState.variables };
      const story = state.story;

      rules.forEach((rule) => {
        const varDef = story?.variables.find((v) => v.id === rule.variableId);
        if (!varDef) return;

        const currentValue = newVariables[rule.variableId];

        switch (rule.operation) {
          case 'add':
            if (typeof currentValue === 'number' && typeof rule.value === 'number') {
              let newValue = currentValue + rule.value;
              if (varDef.minValue !== undefined) {
                newValue = Math.max(varDef.minValue, newValue);
              }
              if (varDef.maxValue !== undefined) {
                newValue = Math.min(varDef.maxValue, newValue);
              }
              newVariables[rule.variableId] = newValue;
            }
            break;
          case 'subtract':
            if (typeof currentValue === 'number' && typeof rule.value === 'number') {
              let newValue = currentValue - rule.value;
              if (varDef.minValue !== undefined) {
                newValue = Math.max(varDef.minValue, newValue);
              }
              if (varDef.maxValue !== undefined) {
                newValue = Math.min(varDef.maxValue, newValue);
              }
              newVariables[rule.variableId] = newValue;
            }
            break;
          case 'set':
            newVariables[rule.variableId] = rule.value;
            break;
          case 'toggle':
            if (typeof currentValue === 'boolean') {
              newVariables[rule.variableId] = !currentValue;
            }
            break;
        }
      });

      return {
        runtimeState: {
          ...state.runtimeState,
          variables: newVariables,
        },
      };
    }),

  resetRuntime: () =>
    set((state) => ({
      runtimeState: initRuntimeFromStory(state.story),
    })),

  selectedNodeId: null,
  setSelectedNode: (nodeId) => set({ selectedNodeId: nodeId }),
}));
