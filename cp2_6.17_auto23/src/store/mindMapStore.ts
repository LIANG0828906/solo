import { create } from 'zustand';
import { MindMapNode, Position } from '../types';
import { parseMarkdown, findNodeById, countNodes } from '../utils/markdownParser';
import { calculateRadialLayout, resetToInitialPositions } from '../utils/layout';

interface MindMapState {
  rawText: string;
  parsedTree: MindMapNode | null;
  totalNodes: number;
  rootInitialPosition: Position | null;
  setText: (text: string, canvasCenter: Position) => void;
  toggleCollapse: (nodeId: string) => void;
  updateNodePosition: (nodeId: string, position: Position) => void;
  resetPositions: (canvasCenter: Position) => void;
}

function updateNodeInTree(
  root: MindMapNode,
  nodeId: string,
  updater: (node: MindMapNode) => MindMapNode
): MindMapNode {
  if (root.id === nodeId) {
    return updater(root);
  }
  return {
    ...root,
    children: root.children.map((child) => updateNodeInTree(child, nodeId, updater)),
  };
}

function resetAllPositions(root: MindMapNode): MindMapNode {
  return {
    ...root,
    position: { ...root.initialPosition },
    children: root.children.map(resetAllPositions),
  };
}

export const useMindMapStore = create<MindMapState>((set, get) => ({
  rawText: '',
  parsedTree: null,
  totalNodes: 0,
  rootInitialPosition: null,

  setText: (text: string, canvasCenter: Position) => {
    const parsed = parseMarkdown(text);
    if (parsed) {
      const layoutResult = calculateRadialLayout(parsed, canvasCenter);
      set({
        rawText: text,
        parsedTree: layoutResult.root,
        totalNodes: countNodes(layoutResult.root),
        rootInitialPosition: { ...canvasCenter },
      });
    } else {
      set({
        rawText: text,
        parsedTree: null,
        totalNodes: 0,
        rootInitialPosition: null,
      });
    }
  },

  toggleCollapse: (nodeId: string) => {
    const { parsedTree } = get();
    if (!parsedTree) return;

    const targetNode = findNodeById(parsedTree, nodeId);
    if (!targetNode || targetNode.children.length === 0) return;

    const newTree = updateNodeInTree(parsedTree, nodeId, (node) => ({
      ...node,
      collapsed: !node.collapsed,
    }));

    set({ parsedTree: newTree });
  },

  updateNodePosition: (nodeId: string, position: Position) => {
    const { parsedTree } = get();
    if (!parsedTree) return;

    const newTree = updateNodeInTree(parsedTree, nodeId, (node) => ({
      ...node,
      position: { ...position },
    }));

    set({ parsedTree: newTree });
  },

  resetPositions: (canvasCenter: Position) => {
    const { parsedTree, rawText, rootInitialPosition } = get();
    if (!parsedTree) return;

    let newTree: MindMapNode | null;
    const center = rootInitialPosition || canvasCenter;

    if (rawText) {
      const parsed = parseMarkdown(rawText);
      if (parsed) {
        const layoutResult = calculateRadialLayout(parsed, center);
        newTree = layoutResult.root;
      } else {
        newTree = resetAllPositions({
          ...parsedTree,
          position: { ...center },
          initialPosition: { ...center },
        });
      }
    } else {
      newTree = resetAllPositions({
        ...parsedTree,
        position: { ...center },
        initialPosition: { ...center },
      });
    }

    set({ parsedTree: newTree });
  },
}));
