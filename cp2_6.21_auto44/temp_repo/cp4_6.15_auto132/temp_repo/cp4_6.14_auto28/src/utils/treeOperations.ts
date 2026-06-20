import { v4 as uuidv4 } from 'uuid';
import { MindMap, MindMapNode } from '../types';

export const createNode = (
  title: string = '新节点',
  parentId: string | null = null,
  x: number = 0,
  y: number = 0,
  overrides: Partial<MindMapNode> = {}
): MindMapNode => {
  return {
    id: uuidv4(),
    title,
    subtitle: '',
    parentId,
    children: [],
    x,
    y,
    color: '#ffffff',
    borderStyle: 'solid',
    fontSize: 16,
    icon: '📝',
    ...overrides
  };
};

export const addChildNode = (
  mindMap: MindMap,
  parentId: string,
  title?: string
): { mindMap: MindMap; newNode: MindMapNode } => {
  const parent = mindMap.nodes[parentId];
  if (!parent) return { mindMap, newNode: {} as MindMapNode };

  const siblingCount = parent.children.length;
  const angleOffset = (siblingCount % 2 === 0 ? 1 : -1) * Math.ceil(siblingCount / 2);
  const baseAngle = Math.atan2(parent.y, parent.x) || 0;
  const spreadAngle = 0.3;
  const distance = 220;
  const level = getNodeLevel(mindMap, parentId);

  let newX: number, newY: number;
  if (parentId === mindMap.rootId) {
    const totalChildren = parent.children.length + 1;
    const angleStep = (Math.PI * 2) / Math.max(totalChildren, 6);
    const startAngle = -Math.PI / 2;
    const angle = startAngle + angleStep * siblingCount;
    newX = parent.x + Math.cos(angle) * distance;
    newY = parent.y + Math.sin(angle) * distance;
  } else {
    const directionX = Math.sign(parent.x - (mindMap.nodes[parent.parentId!]?.x || 0)) || 1;
    newX = parent.x + directionX * distance;
    newY = parent.y + angleOffset * 70;
  }

  const colors = ['#4dabf7', '#69db7c', '#ffa94d', '#9775fa', '#ff6b6b', '#38d9a9', '#ffd43b', '#f783ac'];
  const newNode = createNode(title || '子节点', parentId, newX, newY, {
    color: colors[Math.floor(Math.random() * colors.length)],
    fontSize: Math.max(12, 18 - level)
  });

  const newNodes = { ...mindMap.nodes };
  newNodes[newNode.id] = newNode;
  newNodes[parentId] = {
    ...parent,
    children: [...parent.children, newNode.id]
  };

  return {
    mindMap: { ...mindMap, nodes: newNodes },
    newNode
  };
};

export const addSiblingNode = (
  mindMap: MindMap,
  siblingId: string,
  title?: string
): { mindMap: MindMap; newNode: MindMapNode } => {
  const sibling = mindMap.nodes[siblingId];
  if (!sibling || !sibling.parentId) return { mindMap, newNode: {} as MindMapNode };

  const parent = mindMap.nodes[sibling.parentId];
  const siblingIndex = parent.children.indexOf(siblingId);

  const offsetY = 70;
  const directionX = Math.sign(sibling.x - (parent?.x || 0)) || 1;
  const newX = sibling.x;
  const newY = sibling.y + offsetY;

  const colors = ['#4dabf7', '#69db7c', '#ffa94d', '#9775fa', '#ff6b6b', '#38d9a9', '#ffd43b', '#f783ac'];
  const newNode = createNode(title || '同级节点', sibling.parentId, newX, newY, {
    color: colors[Math.floor(Math.random() * colors.length)],
    fontSize: sibling.fontSize
  });

  const newNodes = { ...mindMap.nodes };
  newNodes[newNode.id] = newNode;

  const newChildren = [...parent.children];
  newChildren.splice(siblingIndex + 1, 0, newNode.id);
  newNodes[sibling.parentId] = { ...parent, children: newChildren };

  const adjustChildren = (baseId: string, baseY: number) => {
    const startIdx = newChildren.indexOf(baseId) + 1;
    for (let i = startIdx; i < newChildren.length; i++) {
      const childId = newChildren[i];
      if (childId !== newNode.id && newNodes[childId]) {
        const child = newNodes[childId];
        const offset = child.y - sibling.y;
        const dy = newY + offsetY - sibling.y;
        const newAdjustedY = child.y >= sibling.y ? child.y + offsetY : child.y;
        newNodes[childId] = { ...child, y: newAdjustedY };
      }
    }
  };

  return {
    mindMap: { ...mindMap, nodes: newNodes },
    newNode
  };
};

export const deleteNode = (
  mindMap: MindMap,
  nodeId: string
): { mindMap: MindMap; deletedNodes: string[] } => {
  const node = mindMap.nodes[nodeId];
  if (!node) return { mindMap, deletedNodes: [] };

  const collectSubtree = (id: string, ids: string[] = []): string[] => {
    ids.push(id);
    const n = mindMap.nodes[id];
    if (n) {
      n.children.forEach((childId) => collectSubtree(childId, ids));
    }
    return ids;
  };

  const subtreeIds = collectSubtree(nodeId);
  const newNodes = { ...mindMap.nodes };
  subtreeIds.forEach((id) => delete newNodes[id]);

  let newRootId = mindMap.rootId;
  if (nodeId === mindMap.rootId) {
    const remainingIds = Object.keys(newNodes);
    if (remainingIds.length > 0) {
      newRootId = remainingIds[0];
      if (newNodes[newRootId]) {
        newNodes[newRootId] = { ...newNodes[newRootId], parentId: null };
      }
    }
  } else if (node.parentId && newNodes[node.parentId]) {
    newNodes[node.parentId] = {
      ...newNodes[node.parentId],
      children: newNodes[node.parentId].children.filter((id) => id !== nodeId)
    };
  }

  return {
    mindMap: { rootId: newRootId, nodes: newNodes },
    deletedNodes: subtreeIds
  };
};

export const moveNode = (
  mindMap: MindMap,
  nodeId: string,
  newParentId: string | null,
  newIndex?: number
): MindMap => {
  const node = mindMap.nodes[nodeId];
  if (!node || nodeId === newParentId) return mindMap;

  const isDescendant = (parentId: string, childId: string): boolean => {
    if (parentId === childId) return true;
    const p = mindMap.nodes[parentId];
    if (!p) return false;
    return p.children.some((c) => isDescendant(c, childId));
  };
  if (newParentId && isDescendant(nodeId, newParentId)) return mindMap;

  const newNodes = { ...mindMap.nodes };

  if (node.parentId && newNodes[node.parentId]) {
    newNodes[node.parentId] = {
      ...newNodes[node.parentId],
      children: newNodes[node.parentId].children.filter((id) => id !== nodeId)
    };
  }

  if (newParentId && newNodes[newParentId]) {
    const parent = newNodes[newParentId];
    const newChildren = [...parent.children];
    if (typeof newIndex === 'number') {
      newChildren.splice(Math.min(newIndex, newChildren.length), 0, nodeId);
    } else {
      newChildren.push(nodeId);
    }
    newNodes[newParentId] = { ...parent, children: newChildren };
  }

  newNodes[nodeId] = { ...node, parentId: newParentId };

  return { ...mindMap, nodes: newNodes };
};

export const updateNode = (
  mindMap: MindMap,
  nodeId: string,
  updates: Partial<MindMapNode>
): MindMap => {
  const node = mindMap.nodes[nodeId];
  if (!node) return mindMap;

  return {
    ...mindMap,
    nodes: {
      ...mindMap.nodes,
      [nodeId]: { ...node, ...updates }
    }
  };
};

export const getNodeLevel = (mindMap: MindMap, nodeId: string): number => {
  let level = 0;
  let currentId: string | null = nodeId;
  while (currentId) {
    const node = mindMap.nodes[currentId];
    if (!node || !node.parentId) break;
    currentId = node.parentId;
    level++;
  }
  return level;
};

export const traverseTree = (
  mindMap: MindMap,
  nodeId: string,
  callback: (node: MindMapNode, level: number) => void,
  level: number = 0
): void => {
  const node = mindMap.nodes[nodeId];
  if (!node) return;
  callback(node, level);
  node.children.forEach((childId) => traverseTree(mindMap, childId, callback, level + 1));
};

export const getSubtreeIds = (mindMap: MindMap, nodeId: string): string[] => {
  const ids: string[] = [];
  traverseTree(mindMap, nodeId, (n) => ids.push(n.id));
  return ids;
};

export const cloneMindMap = (mindMap: MindMap): MindMap => {
  return JSON.parse(JSON.stringify(mindMap));
};

export const applySpringLayout = (
  mindMap: MindMap,
  movedNodeId: string,
  targetX: number,
  targetY: number,
  damping: number = 0.85
): { mindMap: MindMap; moves: Array<{ nodeId: string; x: number; y: number }> } => {
  const moves: Array<{ nodeId: string; x: number; y: number }> = [];
  const newNodes = { ...mindMap.nodes };

  const movedNode = newNodes[movedNodeId];
  if (!movedNode) return { mindMap, moves };

  const dx = targetX - movedNode.x;
  const dy = targetY - movedNode.y;

  const applyToChildren = (parentId: string, offsetX: number, offsetY: number, factor: number) => {
    const parent = newNodes[parentId];
    if (!parent) return;
    parent.children.forEach((childId) => {
      const child = newNodes[childId];
      if (child && childId !== movedNodeId) {
        const childFactor = factor * damping;
        const newCX = child.x + offsetX * childFactor;
        const newCY = child.y + offsetY * childFactor;
        newNodes[childId] = { ...child, x: newCX, y: newCY };
        moves.push({ nodeId: childId, x: newCX, y: newCY });
        applyToChildren(childId, offsetX, offsetY, childFactor);
      }
    });
  };

  newNodes[movedNodeId] = { ...movedNode, x: targetX, y: targetY };
  moves.push({ nodeId: movedNodeId, x: targetX, y: targetY });

  applyToChildren(movedNodeId, dx, dy, 0.9);

  return {
    mindMap: { ...mindMap, nodes: newNodes },
    moves
  };
};
