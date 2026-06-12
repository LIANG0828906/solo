import { useCallback, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useMindMapStore } from '@/store/mindMapStore';
import type { MindMapNode } from '@/types/mindMap';
import {
  DEFAULT_SIBLING_GAP,
  MOBILE_SIBLING_GAP,
  LEVEL_GAP,
  DEFAULT_NODE_WIDTH,
  DEFAULT_NODE_HEIGHT,
  MIN_SCALE,
  MAX_SCALE,
  NODE_COLORS,
} from '@/types/mindMap';
import {
  calculateLayout,
  findParentId,
  findNearestParent,
  getDescendantIds,
  updateLevels,
} from '@/utils/layout';
import { createSnapshot } from '@/utils/history';

export function useMindMap() {
  const store = useMindMapStore();
  const isDraggingRef = useRef(false);
  const dragMovedRef = useRef(false);

  const getSiblingGap = useCallback(() => {
    if (typeof window === 'undefined') return DEFAULT_SIBLING_GAP;
    return window.innerWidth < 768 ? MOBILE_SIBLING_GAP : DEFAULT_SIBLING_GAP;
  }, []);

  const commitSnapshot = useCallback(() => {
    const state = useMindMapStore.getState();
    const snapshot = createSnapshot(state.nodes, state.rootId);
    state.pushHistory(snapshot);
  }, []);

  const relayout = useCallback(
    (nodesOverride?: Record<string, MindMapNode>, rootOverride?: string) => {
      const state = useMindMapStore.getState();
      const nodes = nodesOverride ?? state.nodes;
      const rootId = rootOverride ?? state.rootId;
      const root = nodes[rootId];
      const siblingGap = getSiblingGap();
      const laidOut = calculateLayout(nodes, rootId, {
        rootX: root?.x ?? 0,
        rootY: root?.y ?? 0,
        siblingGap,
        levelGap: LEVEL_GAP,
      });
      useMindMapStore.getState().setNodes(laidOut);
      return laidOut;
    },
    [getSiblingGap]
  );

  const addChild = useCallback(
    (parentId: string) => {
      commitSnapshot();
      const state = useMindMapStore.getState();
      const parent = state.nodes[parentId];
      if (!parent) return;

      const newId = uuidv4();
      const childLevel = parent.level + 1;
      const newNode: MindMapNode = {
        id: newId,
        text: '新节点',
        children: [],
        x: 0,
        y: 0,
        color: NODE_COLORS[Math.min(childLevel, 3)] ?? NODE_COLORS[3],
        level: childLevel,
        width: DEFAULT_NODE_WIDTH,
        height: DEFAULT_NODE_HEIGHT,
      };

      const newNodes = {
        ...state.nodes,
        [newId]: newNode,
        [parentId]: {
          ...parent,
          children: [...parent.children, newId],
        },
      };

      const siblingGap = getSiblingGap();
      const root = newNodes[state.rootId];
      const laidOut = calculateLayout(newNodes, state.rootId, {
        rootX: root.x,
        rootY: root.y,
        siblingGap,
        levelGap: LEVEL_GAP,
      });

      state.setNodes(laidOut);
      state.setEditingNode(newId);
    },
    [commitSnapshot, getSiblingGap]
  );

  const editText = useCallback(
    (nodeId: string, text: string) => {
      const state = useMindMapStore.getState();
      const current = state.nodes[nodeId];
      if (current && current.text !== text) {
        commitSnapshot();
        state.updateNode(nodeId, { text });
      }
    },
    [commitSnapshot]
  );

  const deleteNode = useCallback(
    (nodeId: string) => {
      const state = useMindMapStore.getState();
      if (nodeId === state.rootId) return;

      commitSnapshot();

      const descendants = getDescendantIds(nodeId, state.nodes);
      const allToDelete = new Set([nodeId, ...descendants]);

      const parentId = findParentId(nodeId, state.nodes);
      const newNodes: Record<string, MindMapNode> = {};

      for (const [id, node] of Object.entries(state.nodes)) {
        if (allToDelete.has(id)) continue;
        let newChildren = node.children;
        if (node.children.includes(nodeId)) {
          newChildren = node.children.filter((c) => c !== nodeId);
        }
        newNodes[id] = { ...node, children: newChildren };
      }

      if (parentId && newNodes[parentId]) {
        const siblingGap = getSiblingGap();
        const root = newNodes[state.rootId];
        const laidOut = calculateLayout(newNodes, state.rootId, {
          rootX: root.x,
          rootY: root.y,
          siblingGap,
          levelGap: LEVEL_GAP,
        });
        state.setNodes(laidOut);
      } else {
        state.setNodes(newNodes);
      }

      state.selectNode(null);
    },
    [commitSnapshot, getSiblingGap]
  );

  const moveNode = useCallback((nodeId: string, x: number, y: number) => {
    useMindMapStore.getState().updateNode(nodeId, { x, y });
  }, []);

  const moveNodeWithChildren = useCallback(
    (nodeId: string, dx: number, dy: number) => {
      const state = useMindMapStore.getState();
      const descendants = getDescendantIds(nodeId, state.nodes);
      const all = new Set([nodeId, ...descendants]);

      const updates: Partial<MindMapNode> = { x: 0, y: 0 };
      const newNodes = { ...state.nodes };

      for (const id of all) {
        const node = newNodes[id];
        if (node) {
          newNodes[id] = {
            ...node,
            x: node.x + dx,
            y: node.y + dy,
          };
        }
      }

      state.setNodes(newNodes);
      void updates;
    },
    []
  );

  const endDrag = useCallback(
    (nodeId: string) => {
      if (!dragMovedRef.current) {
        isDraggingRef.current = false;
        dragMovedRef.current = false;
        return;
      }

      commitSnapshot();
      const state = useMindMapStore.getState();

      if (nodeId === state.rootId) {
        isDraggingRef.current = false;
        dragMovedRef.current = false;
        return;
      }

      const result = findNearestParent(nodeId, state.nodes);
      const newNodes: Record<string, MindMapNode> = JSON.parse(
        JSON.stringify(state.nodes)
      );

      if (result && result.parentId !== findParentId(nodeId, state.nodes)) {
        const { parentId: newParentId, insertIndex } = result;
        const oldParentId = findParentId(nodeId, state.nodes);

        if (oldParentId && newNodes[oldParentId]) {
          newNodes[oldParentId] = {
            ...newNodes[oldParentId],
            children: newNodes[oldParentId].children.filter(
              (c) => c !== nodeId
            ),
          };
        }

        if (newNodes[newParentId]) {
          const newChildren = [...newNodes[newParentId].children];
          newChildren.splice(insertIndex, 0, nodeId);
          newNodes[newParentId] = {
            ...newNodes[newParentId],
            children: newChildren,
          };
        }

        const newParentLevel = newNodes[newParentId]?.level ?? 0;
        updateLevels(nodeId, newNodes, newParentLevel + 1);
      }

      const siblingGap = getSiblingGap();
      const root = newNodes[state.rootId];
      const laidOut = calculateLayout(newNodes, state.rootId, {
        rootX: root.x,
        rootY: root.y,
        siblingGap,
        levelGap: LEVEL_GAP,
      });

      state.setNodes(laidOut);
      isDraggingRef.current = false;
      dragMovedRef.current = false;
    },
    [commitSnapshot, getSiblingGap]
  );

  const onUndo = useCallback(() => {
    useMindMapStore.getState().undo();
  }, []);

  const onRedo = useCallback(() => {
    useMindMapStore.getState().redo();
  }, []);

  const updateNodeSize = useCallback(
    (nodeId: string, width: number, height: number) => {
      const state = useMindMapStore.getState();
      const node = state.nodes[nodeId];
      if (node && (node.width !== width || node.height !== height)) {
        state.updateNode(nodeId, { width, height });
      }
    },
    []
  );

  const setViewportScale = useCallback(
    (delta: number, centerX?: number, centerY?: number) => {
      const state = useMindMapStore.getState();
      const { viewport } = state;
      const newScale = Math.min(
        MAX_SCALE,
        Math.max(MIN_SCALE, viewport.scale * (1 + delta))
      );

      if (newScale === viewport.scale) return;

      let newOffsetX = viewport.offsetX;
      let newOffsetY = viewport.offsetY;

      if (centerX !== undefined && centerY !== undefined) {
        const scaleRatio = newScale / viewport.scale;
        newOffsetX = centerX - (centerX - viewport.offsetX) * scaleRatio;
        newOffsetY = centerY - (centerY - viewport.offsetY) * scaleRatio;
      }

      state.setViewport({ scale: newScale, offsetX: newOffsetX, offsetY: newOffsetY });
    },
    []
  );

  const panViewport = useCallback((dx: number, dy: number) => {
    const state = useMindMapStore.getState();
    state.setViewport({
      offsetX: state.viewport.offsetX + dx,
      offsetY: state.viewport.offsetY + dy,
    });
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isCtrl = e.ctrlKey || e.metaKey;
      if (isCtrl && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        e.preventDefault();
        onUndo();
      } else if (
        (isCtrl && e.key.toLowerCase() === 'z' && e.shiftKey) ||
        (isCtrl && e.key.toLowerCase() === 'y')
      ) {
        e.preventDefault();
        onRedo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onUndo, onRedo]);

  return {
    nodes: store.nodes,
    rootId: store.rootId,
    selectedNodeId: store.selectedNodeId,
    editingNodeId: store.editingNodeId,
    viewport: store.viewport,
    history: store.history,
    selectNode: store.selectNode,
    setEditingNode: store.setEditingNode,
    setViewport: store.setViewport,
    addChild,
    editText,
    deleteNode,
    moveNode,
    moveNodeWithChildren,
    endDrag,
    onUndo,
    onRedo,
    updateNodeSize,
    setViewportScale,
    panViewport,
    relayout,
    commitSnapshot,
    isDraggingRef,
    dragMovedRef,
  };
}
