import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { Node, Edge, NodeChange, EdgeChange } from 'reactflow';
import type { MindMapNode, MindMapEdge, NodeShape } from '../types';
import socketClient from '../socket/socketClient';

interface HistoryState {
  nodes: Node[];
  edges: Edge[];
}

interface FlowState {
  nodes: Node[];
  edges: Edge[];
  selectedNodeId: string | null;
  selectedEdgeId: string | null;
  zoomLevel: number;
  mindmapId: string;
  userId: string;
  isLoading: boolean;
  historyStack: HistoryState[];
  historyIndex: number;

  setMindmapId: (id: string) => void;
  setUserId: (id: string) => void;
  setZoomLevel: (zoom: number) => void;
  selectNode: (nodeId: string | null) => void;
  selectEdge: (edgeId: string | null) => void;

  addNode: (parentId?: string) => Promise<boolean>;
  updateNode: (nodeId: string, updates: Partial<MindMapNode>) => Promise<boolean>;
  deleteNode: (nodeId: string) => Promise<boolean>;
  updateNodePosition: (nodeId: string, x: number, y: number) => void;

  addEdge: (source: string, target: string) => Promise<boolean>;
  deleteEdge: (edgeId: string) => Promise<boolean>;

  applyNodesChange: (changes: NodeChange[]) => void;
  applyEdgesChange: (changes: EdgeChange[]) => void;

  setNodes: (nodes: Node[]) => void;
  setEdges: (edges: Edge[]) => void;

  initializeFromData: (nodes: MindMapNode[], edges: MindMapEdge[]) => void;
  undo: () => void;
  redo: () => void;
}

const DEFAULT_COLOR = '#ffffff';
const DEFAULT_FONT_SIZE = 16;
const DEFAULT_SHAPE: NodeShape = 'rounded-rectangle';

const getShapeStyle = (shape: NodeShape): React.CSSProperties => {
  const baseStyle: React.CSSProperties = {
    transition: 'background-color 200ms ease, border-color 200ms ease, box-shadow 200ms ease, border-radius 200ms ease, clip-path 200ms ease',
  };

  switch (shape) {
    case 'rectangle':
      return {
        ...baseStyle,
        borderRadius: '0px',
        clipPath: 'none',
      };
    case 'rounded-rectangle':
      return {
        ...baseStyle,
        borderRadius: '8px',
        clipPath: 'none',
      };
    case 'diamond':
      return {
        ...baseStyle,
        borderRadius: '0px',
        clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
      };
    case 'ellipse':
      return {
        ...baseStyle,
        borderRadius: '50%',
        clipPath: 'none',
      };
    default:
      return baseStyle;
  }
};

const mindMapNodeToFlowNode = (node: MindMapNode): Node => {
  const shape = node.shape || DEFAULT_SHAPE;
  const shapeStyle = getShapeStyle(shape);

  return {
    id: node.id,
    type: 'default',
    position: { x: node.x, y: node.y },
    data: {
      label: node.title,
      title: node.title,
      note: node.note,
      color: node.color || DEFAULT_COLOR,
      fontSize: node.fontSize || DEFAULT_FONT_SIZE,
      shape,
    },
    style: {
      backgroundColor: node.color || DEFAULT_COLOR,
      border: '1px solid #e5e7eb',
      padding: '12px 16px',
      fontSize: `${node.fontSize || DEFAULT_FONT_SIZE}px`,
      color: '#1f2937',
      textAlign: 'center' as const,
      minWidth: '120px',
      ...shapeStyle,
    },
  };
};

const flowNodeToMindMapNode = (node: Node): MindMapNode => ({
  id: node.id,
  title: node.data.title || node.data.label || '',
  note: node.data.note || '',
  color: node.data.color || DEFAULT_COLOR,
  fontSize: node.data.fontSize || DEFAULT_FONT_SIZE,
  x: node.position.x,
  y: node.position.y,
  shape: node.data.shape || DEFAULT_SHAPE,
  parentId: node.data.parentId,
});

const saveStateToHistory = (state: FlowState): HistoryState[] => {
  const newHistory = state.historyStack.slice(0, state.historyIndex + 1);
  newHistory.push({
    nodes: JSON.parse(JSON.stringify(state.nodes)),
    edges: JSON.parse(JSON.stringify(state.edges)),
  });
  return newHistory;
};

export const useFlowStore = create<FlowState>((set, get) => ({
  nodes: [],
  edges: [],
  selectedNodeId: null,
  selectedEdgeId: null,
  zoomLevel: 1,
  mindmapId: '',
  userId: '',
  isLoading: false,
  historyStack: [],
  historyIndex: -1,

  setMindmapId: (id) => set({ mindmapId: id }),
  setUserId: (id) => set({ userId: id }),
  setZoomLevel: (zoom) => set({ zoomLevel: Math.max(0.2, Math.min(3.0, zoom)) }),

  selectNode: (nodeId) => set({ selectedNodeId: nodeId, selectedEdgeId: nodeId ? null : get().selectedEdgeId }),
  selectEdge: (edgeId) => set({ selectedEdgeId: edgeId, selectedNodeId: edgeId ? null : get().selectedNodeId }),

  addNode: async (parentId?: string): Promise<boolean> => {
    const newId = uuidv4();
    const parentNode = get().nodes.find((n) => n.id === parentId);
    const baseX = parentNode ? parentNode.position.x + 200 : 100;
    const baseY = parentNode ? parentNode.position.y + 50 * get().nodes.filter((n) => n.data.parentId === parentId).length : 100;

    const shapeStyle = getShapeStyle(DEFAULT_SHAPE);

    const newNode: Node = {
      id: newId,
      type: 'default',
      position: { x: baseX, y: baseY },
      data: {
        label: '新节点',
        title: '新节点',
        note: '',
        color: DEFAULT_COLOR,
        fontSize: DEFAULT_FONT_SIZE,
        shape: DEFAULT_SHAPE,
        parentId,
      },
      style: {
        backgroundColor: DEFAULT_COLOR,
        border: '1px solid #e5e7eb',
        padding: '12px 16px',
        fontSize: `${DEFAULT_FONT_SIZE}px`,
        color: '#1f2937',
        textAlign: 'center' as const,
        minWidth: '120px',
        ...shapeStyle,
      },
    };

    const prevNodes = [...get().nodes];
    const prevEdges = [...get().edges];
    const newHistory = saveStateToHistory(get());

    set((state) => ({
      nodes: [...state.nodes, newNode],
      historyStack: newHistory,
      historyIndex: newHistory.length - 1,
    }));

    let newEdge: Edge | null = null;
    if (parentId) {
      newEdge = {
        id: `e-${parentId}-${newId}`,
        source: parentId,
        target: newId,
        type: 'smoothstep',
        animated: false,
        style: { stroke: '#d1d5db', strokeWidth: 2 },
      };
      set((state) => ({
        edges: [...state.edges, newEdge!],
      }));
    }

    const mindMapNode = flowNodeToMindMapNode(newNode);

    try {
      const result = await socketClient.send('node:add', { node: mindMapNode, parentId });
      if (!result.success) {
        set({ nodes: prevNodes, edges: prevEdges });
        return false;
      }
      return true;
    } catch (error) {
      set({ nodes: prevNodes, edges: prevEdges });
      return false;
    }
  },

  updateNode: async (nodeId: string, updates: Partial<MindMapNode>): Promise<boolean> => {
    const prevNodes = JSON.parse(JSON.stringify(get().nodes));

    set((state) => ({
      nodes: state.nodes.map((node) => {
        if (node.id !== nodeId) return node;
        const currentShape = (updates.shape || node.data.shape || DEFAULT_SHAPE) as NodeShape;
        const shapeStyle = getShapeStyle(currentShape);
        const updatedNode = {
          ...node,
          position: {
            x: updates.x !== undefined ? updates.x : node.position.x,
            y: updates.y !== undefined ? updates.y : node.position.y,
          },
          data: {
            ...node.data,
            title: updates.title !== undefined ? updates.title : node.data.title,
            label: updates.title !== undefined ? updates.title : node.data.label,
            note: updates.note !== undefined ? updates.note : node.data.note,
            color: updates.color !== undefined ? updates.color : node.data.color,
            fontSize: updates.fontSize !== undefined ? updates.fontSize : node.data.fontSize,
            shape: updates.shape !== undefined ? updates.shape : node.data.shape,
          },
          style: {
            ...node.style,
            backgroundColor: updates.color || node.style?.backgroundColor,
            fontSize: updates.fontSize ? `${updates.fontSize}px` : node.style?.fontSize,
            ...shapeStyle,
          },
        };
        return updatedNode;
      }),
    }));

    try {
      const result = await socketClient.send('node:update', { nodeId, updates });
      if (!result.success) {
        set({ nodes: prevNodes });
        return false;
      }
      return true;
    } catch (error) {
      set({ nodes: prevNodes });
      return false;
    }
  },

  deleteNode: async (nodeId: string): Promise<boolean> => {
    const prevNodes = [...get().nodes];
    const prevEdges = [...get().edges];
    const newHistory = saveStateToHistory(get());

    const connectedEdgeIds = get().edges
      .filter((e) => e.source === nodeId || e.target === nodeId)
      .map((e) => e.id);

    set((state) => ({
      nodes: state.nodes.filter((n) => n.id !== nodeId),
      edges: state.edges.filter((e) => !connectedEdgeIds.includes(e.id)),
      selectedNodeId: state.selectedNodeId === nodeId ? null : state.selectedNodeId,
      historyStack: newHistory,
      historyIndex: newHistory.length - 1,
    }));

    try {
      const result = await socketClient.send('node:delete', { nodeId });
      if (!result.success) {
        set({ nodes: prevNodes, edges: prevEdges });
        return false;
      }
      return true;
    } catch (error) {
      set({ nodes: prevNodes, edges: prevEdges });
      return false;
    }
  },

  updateNodePosition: (nodeId: string, x: number, y: number) => {
    set((state) => ({
      nodes: state.nodes.map((node) =>
        node.id === nodeId
          ? { ...node, position: { x, y } }
          : node
      ),
    }));

    socketClient.send('node:position', { nodeId, x, y });
  },

  addEdge: async (source: string, target: string): Promise<boolean> => {
    const newEdge: Edge = {
      id: `e-${source}-${target}`,
      source,
      target,
      type: 'smoothstep',
      animated: false,
      style: { stroke: '#d1d5db', strokeWidth: 2 },
    };

    const prevEdges = [...get().edges];
    const newHistory = saveStateToHistory(get());

    set((state) => ({
      edges: [...state.edges, newEdge],
      historyStack: newHistory,
      historyIndex: newHistory.length - 1,
    }));

    try {
      const result = await socketClient.send('edge:add', { source, target });
      if (!result.success) {
        set({ edges: prevEdges });
        return false;
      }
      return true;
    } catch (error) {
      set({ edges: prevEdges });
      return false;
    }
  },

  deleteEdge: async (edgeId: string): Promise<boolean> => {
    const prevEdges = [...get().edges];
    const newHistory = saveStateToHistory(get());

    set((state) => ({
      edges: state.edges.filter((e) => e.id !== edgeId),
      selectedEdgeId: state.selectedEdgeId === edgeId ? null : state.selectedEdgeId,
      historyStack: newHistory,
      historyIndex: newHistory.length - 1,
    }));

    try {
      const result = await socketClient.send('edge:delete', { edgeId });
      if (!result.success) {
        set({ edges: prevEdges });
        return false;
      }
      return true;
    } catch (error) {
      set({ edges: prevEdges });
      return false;
    }
  },

  applyNodesChange: (changes: NodeChange[]) => {
    changes.forEach((change) => {
      if (change.type === 'position' && change.position) {
        get().updateNodePosition(change.id, change.position.x, change.position.y);
      }
    });
  },

  applyEdgesChange: (changes: EdgeChange[]) => {
    // Handle edge selection changes
    changes.forEach((change) => {
      if (change.type === 'select') {
        if (change.selected) {
          set({ selectedEdgeId: change.id });
        } else if (get().selectedEdgeId === change.id) {
          set({ selectedEdgeId: null });
        }
      }
    });
  },

  setNodes: (nodes: Node[]) => set({ nodes }),
  setEdges: (edges: Edge[]) => set({ edges }),

  initializeFromData: (nodes: MindMapNode[], edges: MindMapEdge[]) => {
    const flowNodes = nodes.map(mindMapNodeToFlowNode);
    const flowEdges: Edge[] = edges.map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      type: 'smoothstep',
      animated: false,
      style: { stroke: '#d1d5db', strokeWidth: 2 },
    }));

    const initialHistory: HistoryState = {
      nodes: JSON.parse(JSON.stringify(flowNodes)),
      edges: JSON.parse(JSON.stringify(flowEdges)),
    };

    set({
      nodes: flowNodes,
      edges: flowEdges,
      historyStack: [initialHistory],
      historyIndex: 0,
    });
  },

  undo: () => {
    const state = get();
    if (state.historyIndex > 0) {
      const prevState = state.historyStack[state.historyIndex - 1];
      set({
        nodes: JSON.parse(JSON.stringify(prevState.nodes)),
        edges: JSON.parse(JSON.stringify(prevState.edges)),
        historyIndex: state.historyIndex - 1,
      });
    }
  },

  redo: () => {
    const state = get();
    if (state.historyIndex < state.historyStack.length - 1) {
      const nextState = state.historyStack[state.historyIndex + 1];
      set({
        nodes: JSON.parse(JSON.stringify(nextState.nodes)),
        edges: JSON.parse(JSON.stringify(nextState.edges)),
        historyIndex: state.historyIndex + 1,
      });
    }
  },
}));

export default useFlowStore;
