export interface MindMapNode {
  id: string;
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  borderColor: string;
  parentId: string | null;
  children: string[];
  votes: number;
  level: number;
  collapsed: boolean;
}

export interface MindMapState {
  nodes: Record<string, MindMapNode>;
  rootIds: string[];
}

export interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  text: string;
  timestamp: number;
}

export interface OnlineUser {
  id: string;
  name: string;
  role: 'admin' | 'editor' | 'viewer';
  color: string;
  avatar?: string;
}

export const NODE_COLORS = [
  { fill: '#E3F2FD', border: '#90CAF9' },
  { fill: '#F3E5F5', border: '#CE93D8' },
  { fill: '#E8F5E9', border: '#A5D6A7' },
  { fill: '#FFF3E0', border: '#FFCC80' },
  { fill: '#FBE9E7', border: '#FFAB91' },
  { fill: '#F1F8E9', border: '#C5E1A5' },
];

export const ROLE_COLORS: Record<string, string> = {
  admin: '#4CAF50',
  editor: '#2196F3',
  viewer: '#FF9800',
};

export const DEFAULT_ROOT_WIDTH = 120;
export const DEFAULT_ROOT_HEIGHT = 80;
export const DEFAULT_CHILD_WIDTH = 100;
export const DEFAULT_CHILD_HEIGHT = 60;
export const MAX_DEPTH = 5;
export const MAX_TEXT_LENGTH = 200;

export function createNode(
  id: string,
  text: string,
  x: number,
  y: number,
  parentId: string | null,
  level: number
): MindMapNode {
  const isRoot = level === 0;
  const colorIndex = level % NODE_COLORS.length;
  return {
    id,
    text,
    x,
    y,
    width: isRoot ? DEFAULT_ROOT_WIDTH : DEFAULT_CHILD_WIDTH,
    height: isRoot ? DEFAULT_ROOT_HEIGHT : DEFAULT_CHILD_HEIGHT,
    color: NODE_COLORS[colorIndex].fill,
    borderColor: NODE_COLORS[colorIndex].border,
    parentId,
    children: [],
    votes: 0,
    level,
    collapsed: false,
  };
}

export function addChildNode(
  state: MindMapState,
  parentId: string,
  childId: string,
  text: string
): MindMapState {
  const parent = state.nodes[parentId];
  if (!parent) return state;
  if (parent.level >= MAX_DEPTH - 1) return state;

  const angle = (Math.random() * 90 + 0) * (Math.PI / 180);
  const distance = 160 + Math.random() * 40;
  const offsetX = Math.cos(angle) * distance;
  const offsetY = Math.sin(angle) * distance;

  const childX = parent.x + offsetX;
  const childY = parent.y + offsetY;

  const child = createNode(childId, text, childX, childY, parentId, parent.level + 1);

  return {
    nodes: {
      ...state.nodes,
      [parentId]: {
        ...parent,
        children: [...parent.children, childId],
      },
      [childId]: child,
    },
    rootIds: state.rootIds,
  };
}

export function deleteNode(state: MindMapState, nodeId: string): MindMapState {
  const node = state.nodes[nodeId];
  if (!node) return state;

  const descendantIds = new Set<string>();
  const collectDescendants = (id: string) => {
    const n = state.nodes[id];
    if (!n) return;
    descendantIds.add(id);
    n.children.forEach(collectDescendants);
  };
  collectDescendants(nodeId);

  let newNodes = { ...state.nodes };
  descendantIds.forEach((id) => delete newNodes[id]);

  if (node.parentId && newNodes[node.parentId]) {
    const parent = newNodes[node.parentId];
    newNodes[node.parentId] = {
      ...parent,
      children: parent.children.filter((cid) => cid !== nodeId),
    };
  }

  const newRootIds = node.parentId === null
    ? state.rootIds.filter((id) => id !== nodeId)
    : state.rootIds;

  return { nodes: newNodes, rootIds: newRootIds };
}

export function updateNodeText(
  state: MindMapState,
  nodeId: string,
  text: string
): MindMapState {
  const node = state.nodes[nodeId];
  if (!node) return state;
  return {
    ...state,
    nodes: {
      ...state.nodes,
      [nodeId]: { ...node, text: text.slice(0, MAX_TEXT_LENGTH) },
    },
  };
}

export function updateNodeColor(
  state: MindMapState,
  nodeId: string,
  colorIndex: number
): MindMapState {
  const node = state.nodes[nodeId];
  if (!node) return state;
  const colors = NODE_COLORS[colorIndex % NODE_COLORS.length];
  return {
    ...state,
    nodes: {
      ...state.nodes,
      [nodeId]: { ...node, color: colors.fill, borderColor: colors.border },
    },
  };
}

export function voteNode(state: MindMapState, nodeId: string): MindMapState {
  const node = state.nodes[nodeId];
  if (!node) return state;
  return {
    ...state,
    nodes: {
      ...state.nodes,
      [nodeId]: { ...node, votes: node.votes + 1 },
    },
  };
}

export function sortNodesByVotes(state: MindMapState): string[] {
  return Object.values(state.nodes).sort((a, b) => b.votes - a.votes).map((n) => n.id);
}

export function moveNode(
  state: MindMapState,
  nodeId: string,
  x: number,
  y: number
): MindMapState {
  const node = state.nodes[nodeId];
  if (!node) return state;
  const dx = x - node.x;
  const dy = y - node.y;

  const moveDescendants = (id: string, nodes: Record<string, MindMapNode>): Record<string, MindMapNode> => {
    const n = nodes[id];
    if (!n) return nodes;
    let updated = {
      ...nodes,
      [id]: { ...n, x: n.x + dx, y: n.y + dy },
    };
    n.children.forEach((cid) => {
      updated = moveDescendants(cid, updated);
    });
    return updated;
  };

  let newNodes = { ...state.nodes };
  newNodes = moveDescendants(nodeId, newNodes);
  return { ...state, nodes: newNodes };
}

export function exportToJSON(
  state: MindMapState,
  chatHistory: ChatMessage[],
  title: string
): string {
  const data = {
    title,
    nodes: state.nodes,
    rootIds: state.rootIds,
    chatHistory,
    exportedAt: new Date().toISOString(),
  };
  return JSON.stringify(data, null, 2);
}
