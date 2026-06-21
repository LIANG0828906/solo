import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import {
  MindMapData,
  MindMapNode,
  Note,
  OnlineUser,
  ClientMessage,
  ServerMessage,
} from '../types';
import { useWebSocket } from '../hooks/useWebSocket';

interface MindMapContextValue {
  data: MindMapData | null;
  users: OnlineUser[];
  selectedNodeId: string | null;
  setSelectedNodeId: (id: string | null) => void;
  currentUserId: string;
  updateNode: (nodeId: string, patch: Partial<MindMapNode>) => void;
  addNode: (parentId: string, text?: string) => void;
  deleteNode: (nodeId: string) => void;
  moveNode: (nodeId: string, newParentId: string, index: number) => void;
  addNote: (nodeId: string, content?: string) => void;
  updateNote: (nodeId: string, noteId: string, content: string) => void;
  deleteNote: (nodeId: string, noteId: string) => void;
  reorderNotes: (nodeId: string, noteIds: string[]) => void;
  connectionStatus: 'connecting' | 'connected' | 'disconnected';
}

const MindMapContext = createContext<MindMapContextValue | null>(null);

export function useMindMap() {
  const ctx = useContext(MindMapContext);
  if (!ctx) throw new Error('MindMapContext not provided');
  return ctx;
}

function getUserIdFromUrl(): string {
  const params = new URLSearchParams(window.location.search);
  const uid = params.get('userId');
  if (uid) return uid;
  const newUid = 'u-' + uuidv4().slice(0, 8);
  const url = new URL(window.location.href);
  url.searchParams.set('userId', newUid);
  window.history.replaceState({}, '', url.toString());
  return newUid;
}

const EASE_FN = 'cubic-bezier(0.4, 0, 0.2, 1)';

export const MindMapProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const currentUserId = useMemo(getUserIdFromUrl, []);
  const userName = useMemo(
    () => `协作者${currentUserId.slice(-4).toUpperCase()}`,
    [currentUserId]
  );

  const [data, setData] = useState<MindMapData | null>(null);
  const [users, setUsers] = useState<OnlineUser[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');

  const sendRef = React.useRef<((msg: ClientMessage) => void) | null>(null);

  const handleMessage = useCallback((msg: ServerMessage) => {
    switch (msg.type) {
      case 'INIT':
        setData(msg.data);
        setUsers(msg.users);
        setConnectionStatus('connected');
        setSelectedNodeId(msg.data.rootId);
        break;
      case 'USER_JOIN':
        setUsers((prev) => (prev.some((u) => u.userId === msg.user.userId) ? prev : [...prev, msg.user]));
        break;
      case 'USER_LEAVE':
        setUsers((prev) => prev.filter((u) => u.userId !== msg.userId));
        break;
      case 'UPDATE_NODE':
        setData((prev) => {
          if (!prev) return prev;
          const node = prev.nodes[msg.nodeId];
          if (!node) return prev;
          return {
            ...prev,
            nodes: {
              ...prev.nodes,
              [msg.nodeId]: { ...node, ...msg.patch },
            },
          };
        });
        break;
      case 'ADD_NODE':
        setData((prev) => {
          if (!prev) return prev;
          const parent = prev.nodes[msg.parentId];
          if (!parent) return prev;
          return {
            ...prev,
            nodes: {
              ...prev.nodes,
              [msg.newNode.id]: msg.newNode,
              [msg.parentId]: {
                ...parent,
                childrenIds: [...parent.childrenIds, msg.newNode.id],
                collapsed: false,
              },
            },
          };
        });
        break;
      case 'DELETE_NODE': {
        setData((prev) => {
          if (!prev) return prev;
          const target = prev.nodes[msg.nodeId];
          if (!target || !target.parentId) return prev;
          const collect = (id: string, out: string[] = []) => {
            out.push(id);
            const n = prev.nodes[id];
            if (n) for (const c of n.childrenIds) collect(c, out);
            return out;
          };
          const toDelete = new Set(collect(msg.nodeId));
          const newNodes: Record<string, MindMapNode> = {};
          for (const id in prev.nodes) {
            if (!toDelete.has(id)) {
              const n = prev.nodes[id];
              if (id === target.parentId) {
                newNodes[id] = { ...n, childrenIds: n.childrenIds.filter((cid) => cid !== msg.nodeId) };
              } else {
                newNodes[id] = n;
              }
            }
          }
          const newNotes: Record<string, Note[]> = {};
          for (const id in prev.notes) {
            if (!toDelete.has(id)) newNotes[id] = prev.notes[id];
          }
          return { ...prev, nodes: newNodes, notes: newNotes };
        });
        break;
      }
      case 'MOVE_NODE': {
        setData((prev) => {
          if (!prev) return prev;
          const node = prev.nodes[msg.nodeId];
          if (!node || !node.parentId) return prev;
          const newNodes = { ...prev.nodes };
          if (msg.newParentId === node.parentId) {
            const parent = { ...newNodes[node.parentId] };
            const ids = [...parent.childrenIds];
            const fromIdx = ids.indexOf(msg.nodeId);
            if (fromIdx < 0) return prev;
            ids.splice(fromIdx, 1);
            const toIdx = Math.max(0, Math.min(msg.index, ids.length));
            ids.splice(toIdx, 0, msg.nodeId);
            parent.childrenIds = ids;
            newNodes[node.parentId] = parent;
          } else {
            const oldParent = { ...newNodes[node.parentId] };
            const newParent = { ...newNodes[msg.newParentId] };
            oldParent.childrenIds = oldParent.childrenIds.filter((id) => id !== msg.nodeId);
            const toIdx = Math.max(0, Math.min(msg.index, newParent.childrenIds.length));
            newParent.childrenIds = [...newParent.childrenIds];
            newParent.childrenIds.splice(toIdx, 0, msg.nodeId);
            newNodes[node.parentId] = oldParent;
            newNodes[msg.newParentId] = newParent;
            const moved = { ...node, parentId: msg.newParentId };
            newNodes[msg.nodeId] = moved;
            const updateLevel = (id: string, level: number) => {
              const n = newNodes[id];
              if (!n) return;
              newNodes[id] = { ...n, level };
              for (const cid of n.childrenIds) updateLevel(cid, level + 1);
            };
            updateLevel(msg.nodeId, newParent.level + 1);
          }
          return { ...prev, nodes: newNodes };
        });
        break;
      }
      case 'ADD_NOTE':
        setData((prev) => {
          if (!prev) return prev;
          const list = prev.notes[msg.nodeId] ? [...prev.notes[msg.nodeId]] : [];
          list.push(msg.note);
          return {
            ...prev,
            notes: { ...prev.notes, [msg.nodeId]: list },
          };
        });
        break;
      case 'UPDATE_NOTE':
        setData((prev) => {
          if (!prev) return prev;
          const list = prev.notes[msg.nodeId];
          if (!list) return prev;
          return {
            ...prev,
            notes: {
              ...prev.notes,
              [msg.nodeId]: list.map((n) =>
                n.id === msg.noteId ? { ...n, content: msg.content } : n
              ),
            },
          };
        });
        break;
      case 'DELETE_NOTE':
        setData((prev) => {
          if (!prev) return prev;
          const list = prev.notes[msg.nodeId];
          if (!list) return prev;
          return {
            ...prev,
            notes: {
              ...prev.notes,
              [msg.nodeId]: list.filter((n) => n.id !== msg.noteId),
            },
          };
        });
        break;
      case 'REORDER_NOTES':
        setData((prev) => {
          if (!prev) return prev;
          const list = prev.notes[msg.nodeId];
          if (!list) return prev;
          const map = new Map(list.map((n) => [n.id, n]));
          const reordered = msg.noteIds
            .map((id, i) => {
              const n = map.get(id);
              return n ? { ...n, order: i } : null;
            })
            .filter(Boolean) as Note[];
          return {
            ...prev,
            notes: { ...prev.notes, [msg.nodeId]: reordered },
          };
        });
        break;
    }
  }, []);

  const { send } = useWebSocket(currentUserId, userName, handleMessage);

  useEffect(() => {
    sendRef.current = send;
  }, [send]);

  const updateNode = useCallback((nodeId: string, patch: Partial<MindMapNode>) => {
    setData((prev) => {
      if (!prev) return prev;
      const node = prev.nodes[nodeId];
      if (!node) return prev;
      return {
        ...prev,
        nodes: {
          ...prev.nodes,
          [nodeId]: { ...node, ...patch },
        },
      };
    });
    sendRef.current?.({ type: 'UPDATE_NODE', nodeId, patch });
  }, []);

  const addNode = useCallback((parentId: string, text = '新节点') => {
    setData((prev) => {
      if (!prev) return prev;
      const parent = prev.nodes[parentId];
      if (!parent) return prev;
      const newId = 'n-' + uuidv4().slice(0, 10);
      const newNode: MindMapNode = {
        id: newId,
        parentId,
        text,
        colorTag: '#4a90d9',
        level: parent.level + 1,
        order: parent.childrenIds.length,
        collapsed: false,
        childrenIds: [],
      };
      sendRef.current?.({ type: 'ADD_NODE', parentId, newNode });
      return {
        ...prev,
        nodes: {
          ...prev.nodes,
          [newId]: newNode,
          [parentId]: {
            ...parent,
            childrenIds: [...parent.childrenIds, newId],
            collapsed: false,
          },
        },
      };
    });
  }, []);

  const deleteNode = useCallback((nodeId: string) => {
    setData((prev) => {
      if (!prev) return prev;
      const target = prev.nodes[nodeId];
      if (!target || !target.parentId) return prev;
      const collect = (id: string, out: string[] = []) => {
        out.push(id);
        const n = prev.nodes[id];
        if (n) for (const c of n.childrenIds) collect(c, out);
        return out;
      };
      const toDelete = new Set(collect(nodeId));
      const newNodes: Record<string, MindMapNode> = {};
      for (const id in prev.nodes) {
        if (!toDelete.has(id)) {
          const n = prev.nodes[id];
          if (id === target.parentId) {
            newNodes[id] = { ...n, childrenIds: n.childrenIds.filter((cid) => cid !== nodeId) };
          } else {
            newNodes[id] = n;
          }
        }
      }
      const newNotes: Record<string, Note[]> = {};
      for (const id in prev.notes) {
        if (!toDelete.has(id)) newNotes[id] = prev.notes[id];
      }
      sendRef.current?.({ type: 'DELETE_NODE', nodeId });
      return { ...prev, nodes: newNodes, notes: newNotes };
    });
  }, []);

  const moveNode = useCallback((nodeId: string, newParentId: string, index: number) => {
    sendRef.current?.({ type: 'MOVE_NODE', nodeId, newParentId, index });
  }, []);

  const addNote = useCallback((nodeId: string, content = '') => {
    const noteId = 'note-' + uuidv4().slice(0, 10);
    const note: Note = {
      id: noteId,
      nodeId,
      content,
      order: Date.now(),
      createdAt: Date.now(),
    };
    setData((prev) => {
      if (!prev) return prev;
      const list = prev.notes[nodeId] ? [...prev.notes[nodeId]] : [];
      list.push(note);
      return { ...prev, notes: { ...prev.notes, [nodeId]: list } };
    });
    sendRef.current?.({ type: 'ADD_NOTE', nodeId, note });
  }, []);

  const updateNote = useCallback((nodeId: string, noteId: string, content: string) => {
    setData((prev) => {
      if (!prev) return prev;
      const list = prev.notes[nodeId];
      if (!list) return prev;
      return {
        ...prev,
        notes: {
          ...prev.notes,
          [nodeId]: list.map((n) => (n.id === noteId ? { ...n, content } : n)),
        },
      };
    });
    sendRef.current?.({ type: 'UPDATE_NOTE', nodeId, noteId, content });
  }, []);

  const deleteNote = useCallback((nodeId: string, noteId: string) => {
    setData((prev) => {
      if (!prev) return prev;
      const list = prev.notes[nodeId];
      if (!list) return prev;
      return {
        ...prev,
        notes: {
          ...prev.notes,
          [nodeId]: list.filter((n) => n.id !== noteId),
        },
      };
    });
    sendRef.current?.({ type: 'DELETE_NOTE', nodeId, noteId });
  }, []);

  const reorderNotes = useCallback((nodeId: string, noteIds: string[]) => {
    setData((prev) => {
      if (!prev) return prev;
      const list = prev.notes[nodeId];
      if (!list) return prev;
      const map = new Map(list.map((n) => [n.id, n]));
      const reordered = noteIds
        .map((id, i) => {
          const n = map.get(id);
          return n ? { ...n, order: i } : null;
        })
        .filter(Boolean) as Note[];
      return { ...prev, notes: { ...prev.notes, [nodeId]: reordered } };
    });
    sendRef.current?.({ type: 'REORDER_NOTES', nodeId, noteIds });
  }, []);

  const value: MindMapContextValue = {
    data,
    users,
    selectedNodeId,
    setSelectedNodeId,
    currentUserId,
    updateNode,
    addNode,
    deleteNode,
    moveNode,
    addNote,
    updateNote,
    deleteNote,
    reorderNotes,
    connectionStatus,
  };

  return <MindMapContext.Provider value={value}>{children}</MindMapContext.Provider>;
};

export { EASE_FN };
