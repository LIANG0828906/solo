import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { MapView } from './components/MapView';
import { NodeEditor } from './components/NodeEditor';
import { useWebSocket } from './hooks/useWebSocket';
import { addChildNode, addSiblingNode, deleteNode, updateNode, cloneMindMap } from './utils/treeOperations';
import { MindMap, MindMapNode, User, WSMessage, HistoryEntry } from './types';

const MAX_HISTORY = 50;
const PANEL_WIDTH = 320;

interface LocalHistoryEntry {
  id: string;
  action: 'add' | 'delete' | 'update' | 'move';
  description: string;
  before: MindMap;
  after: MindMap;
  timestamp: number;
}

const App: React.FC = () => {
  const [joined, setJoined] = useState(false);
  const [roomIdInput, setRoomIdInput] = useState('');
  const [nicknameInput, setNicknameInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const [mindMap, setMindMap] = useState<MindMap | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [panelCollapsed, setPanelCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const [undoStack, setUndoStack] = useState<LocalHistoryEntry[]>([]);
  const [redoStack, setRedoStack] = useState<LocalHistoryEntry[]>([]);
  const [historyList, setHistoryList] = useState<HistoryEntry[]>([]);

  const [cursors, setCursors] = useState<Record<string, { x: number; y: number }>>({});

  const skipNextHistoryRef = useRef(false);

  const handleWSMessage = useCallback((message: WSMessage) => {
    if (message.type === 'cursor_update') {
      const { userId, x, y } = message.payload;
      setCursors((prev) => ({ ...prev, [userId]: { x, y } }));
      return;
    }

    setMindMap((prev) => {
      if (!prev) return prev;
      skipNextHistoryRef.current = true;
      let newMap = { ...prev, nodes: { ...prev.nodes } };

      switch (message.type) {
        case 'node_add': {
          const { node, parentId } = message.payload;
          newMap.nodes[node.id] = { ...node };
          if (parentId && newMap.nodes[parentId]) {
            newMap.nodes[parentId] = {
              ...newMap.nodes[parentId],
              children: newMap.nodes[parentId].children.includes(node.id)
                ? newMap.nodes[parentId].children
                : [...newMap.nodes[parentId].children, node.id]
            };
          }
          break;
        }
        case 'node_update': {
          const { nodeId, updates } = message.payload;
          if (newMap.nodes[nodeId]) {
            newMap.nodes[nodeId] = { ...newMap.nodes[nodeId], ...updates };
          }
          break;
        }
        case 'node_delete': {
          const { nodeId } = message.payload;
          const node = newMap.nodes[nodeId];
          if (node) {
            const collectIds = (id: string): string[] => {
              const ids = [id];
              const n = newMap.nodes[id];
              if (n) n.children.forEach((c) => ids.push(...collectIds(c)));
              return ids;
            };
            const toDelete = collectIds(nodeId);
            toDelete.forEach((id) => delete newMap.nodes[id]);

            if (node.parentId && newMap.nodes[node.parentId]) {
              newMap.nodes[node.parentId] = {
                ...newMap.nodes[node.parentId],
                children: newMap.nodes[node.parentId].children.filter((id) => id !== nodeId)
              };
            }
            if (nodeId === newMap.rootId) {
              const remaining = Object.keys(newMap.nodes);
              if (remaining.length > 0) {
                newMap.rootId = remaining[0];
                if (newMap.nodes[newMap.rootId]) {
                  newMap.nodes[newMap.rootId] = { ...newMap.nodes[newMap.rootId], parentId: null };
                }
              }
            }
            if (selectedNodeId && toDelete.includes(selectedNodeId)) {
              setSelectedNodeId(null);
            }
          }
          break;
        }
        case 'node_move': {
          const { moves } = message.payload;
          moves.forEach((move: { nodeId: string; x: number; y: number }) => {
            if (newMap.nodes[move.nodeId]) {
              newMap.nodes[move.nodeId] = {
                ...newMap.nodes[move.nodeId],
                x: move.x,
                y: move.y
              };
            }
          });
          break;
        }
        case 'tree_update': {
          newMap = message.payload.mindMap;
          break;
        }
      }
      return newMap;
    });
  }, [selectedNodeId]);

  const ws = useWebSocket(handleWSMessage);

  useEffect(() => {
    if (ws.mindMap && !mindMap) {
      setMindMap(ws.mindMap);
      setSelectedNodeId(ws.mindMap.rootId);
    }
  }, [ws.mindMap, mindMap]);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const pushHistory = useCallback((entry: LocalHistoryEntry) => {
    setUndoStack((prev) => {
      const next = [...prev, entry];
      return next.length > MAX_HISTORY ? next.slice(next.length - MAX_HISTORY) : next;
    });
    setRedoStack([]);
    setHistoryList((prev) => {
      const next = [
        ...prev,
        {
          id: entry.id,
          action: entry.action,
          description: entry.description,
          timestamp: entry.timestamp,
          userId: ws.currentUserId || 'local'
        }
      ];
      return next.length > MAX_HISTORY ? next.slice(next.length - MAX_HISTORY) : next;
    });
  }, [ws.currentUserId]);

  const doAddChild = useCallback((parentId: string) => {
    if (!mindMap) return;
    const before = cloneMindMap(mindMap);
    const result = addChildNode(mindMap, parentId);
    const after = result.mindMap;

    setMindMap(after);
    setSelectedNodeId(result.newNode.id);
    ws.sendMessage('node_add', { node: result.newNode, parentId });

    pushHistory({
      id: result.newNode.id,
      action: 'add',
      description: `添加子节点: ${result.newNode.title}`,
      before,
      after,
      timestamp: Date.now()
    });
  }, [mindMap, ws, pushHistory]);

  const doAddSibling = useCallback((siblingId: string) => {
    if (!mindMap) return;
    const before = cloneMindMap(mindMap);
    const result = addSiblingNode(mindMap, siblingId);
    if (!result.newNode.id) return;
    const after = result.mindMap;

    setMindMap(after);
    setSelectedNodeId(result.newNode.id);
    ws.sendMessage('node_add', { node: result.newNode, parentId: result.newNode.parentId });

    pushHistory({
      id: result.newNode.id,
      action: 'add',
      description: `添加同级节点: ${result.newNode.title}`,
      before,
      after,
      timestamp: Date.now()
    });
  }, [mindMap, ws, pushHistory]);

  const doDeleteNode = useCallback((nodeId: string) => {
    if (!mindMap) return;
    const node = mindMap.nodes[nodeId];
    if (!node) return;

    const before = cloneMindMap(mindMap);
    const result = deleteNode(mindMap, nodeId);
    const after = result.mindMap;

    setMindMap(after);
    ws.sendMessage('node_delete', { nodeId });
    if (selectedNodeId === nodeId || result.deletedNodes.includes(selectedNodeId || '')) {
      setSelectedNodeId(after.rootId || null);
    }

    pushHistory({
      id: nodeId,
      action: 'delete',
      description: `删除节点: ${node.title}`,
      before,
      after,
      timestamp: Date.now()
    });
  }, [mindMap, ws, selectedNodeId, pushHistory]);

  const doUpdateNode = useCallback((nodeId: string, updates: Partial<MindMapNode>, recordHistory: boolean = true) => {
    if (!mindMap) return;
    const before = cloneMindMap(mindMap);
    const after = updateNode(mindMap, nodeId, updates);

    setMindMap(after);
    ws.sendMessage('node_update', { nodeId, updates });

    if (recordHistory && !skipNextHistoryRef.current) {
      const keys = Object.keys(updates).join(',');
      pushHistory({
        id: nodeId + '-' + Date.now(),
        action: 'update',
        description: `修改节点 (${keys})`,
        before,
        after,
        timestamp: Date.now()
      });
    }
    skipNextHistoryRef.current = false;
  }, [mindMap, ws, pushHistory]);

  const doMoveNodes = useCallback((moves: Array<{ nodeId: string; x: number; y: number }>) => {
    if (!mindMap) return;
    const newNodes = { ...mindMap.nodes };
    moves.forEach((move) => {
      if (newNodes[move.nodeId]) {
        newNodes[move.nodeId] = { ...newNodes[move.nodeId], x: move.x, y: move.y };
      }
    });
    const after = { ...mindMap, nodes: newNodes };
    setMindMap(after);
    ws.sendMessage('node_move', { moves });
  }, [mindMap, ws]);

  const doUndo = useCallback(() => {
    setUndoStack((prev) => {
      if (prev.length === 0) return prev;
      const entry = prev[prev.length - 1];
      const rest = prev.slice(0, -1);

      setRedoStack((redoPrev) => [...redoPrev, entry]);
      setMindMap(cloneMindMap(entry.before));
      ws.sendMessage('tree_update', { mindMap: entry.before });
      return rest;
    });
  }, [ws]);

  const doRedo = useCallback(() => {
    setRedoStack((prev) => {
      if (prev.length === 0) return prev;
      const entry = prev[prev.length - 1];
      const rest = prev.slice(0, -1);

      setUndoStack((undoPrev) => [...undoPrev, entry]);
      setMindMap(cloneMindMap(entry.after));
      ws.sendMessage('tree_update', { mindMap: entry.after });
      return rest;
    });
  }, [ws]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!joined || !mindMap) return;

      const isInput = ['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName);
      if (isInput && e.key !== 'Tab' && e.key !== 'Enter') return;

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        e.preventDefault();
        doUndo();
        return;
      }
      if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === 'y' || (e.shiftKey && e.key.toLowerCase() === 'z'))) {
        e.preventDefault();
        doRedo();
        return;
      }

      if (e.key === 'Tab') {
        e.preventDefault();
        if (selectedNodeId) doAddChild(selectedNodeId);
        return;
      }
      if (e.key === 'Enter' && !e.shiftKey && !isInput) {
        e.preventDefault();
        if (selectedNodeId) doAddSibling(selectedNodeId);
        return;
      }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (!isInput && selectedNodeId && selectedNodeId !== mindMap.rootId) {
          e.preventDefault();
          setDeleteTargetId(selectedNodeId);
          setShowDeleteConfirm(true);
        }
        return;
      }
      if (e.key === 'Escape') {
        setShowDeleteConfirm(false);
        setEditingNodeId(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [joined, mindMap, selectedNodeId, doUndo, doRedo, doAddChild, doAddSibling]);

  const handleJoin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const id = roomIdInput.trim().toUpperCase();
    const name = nicknameInput.trim();

    if (!/^[A-Z0-9]{6}$/.test(id)) {
      setError('房间ID必须是6位字母或数字');
      return;
    }
    if (!name) {
      setError('请输入昵称');
      return;
    }

    setIsLoading(true);
    setError('');

    const result = await ws.joinRoom(id, name);
    if (result) {
      setJoined(true);
      if (isMobile) setPanelCollapsed(true);
    } else {
      setError('连接服务器失败，请重试');
    }
    setIsLoading(false);
  };

  const generateRoomId = async () => {
    try {
      const res = await fetch('http://localhost:3001/api/room/generate', { method: 'POST' });
      const data = await res.json();
      setRoomIdInput(data.roomId);
    } catch {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let id = '';
      for (let i = 0; i < 6; i++) id += chars[Math.floor(Math.random() * chars.length)];
      setRoomIdInput(id);
    }
  };

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'add': return '➕';
      case 'delete': return '🗑️';
      case 'update': return '✏️';
      case 'move': return '↔️';
      default: return '📌';
    }
  };

  if (!joined) {
    return (
      <div style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #1e1e2e 0%, #252540 50%, #1a1a2e 100%)',
        padding: 20
      }}>
        <div style={{
          width: '100%',
          maxWidth: 420,
          padding: 40,
          backgroundColor: 'rgba(42, 42, 62, 0.8)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 20,
          boxShadow: '0 32px 64px rgba(0,0,0,0.4)'
        }}>
          <div style={{ textAlign: 'center', marginBottom: 36 }}>
            <div style={{ fontSize: 56, marginBottom: 12 }}>🧠</div>
            <h1 style={{
              fontSize: 28,
              fontWeight: 700,
              color: '#ffffff',
              marginBottom: 8,
              background: 'linear-gradient(135deg, #4fc3f7, #9775fa)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              协同思维导图
            </h1>
            <p style={{ color: '#8888aa', fontSize: 14, lineHeight: 1.6 }}>
              多人实时协作，创意无限发散
            </p>
          </div>

          <form onSubmit={handleJoin} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
              <label style={{
                display: 'block',
                fontSize: 12,
                fontWeight: 600,
                color: '#8888aa',
                marginBottom: 8,
                textTransform: 'uppercase',
                letterSpacing: 0.5
              }}>
                房间 ID
              </label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  type="text"
                  value={roomIdInput}
                  onChange={(e) => {
                    setRoomIdInput(e.target.value.toUpperCase());
                    setError('');
                  }}
                  placeholder="6位字母数字"
                  maxLength={6}
                  style={{
                    flex: 1,
                    padding: '14px 16px',
                    backgroundColor: 'rgba(255,255,255,0.05)',
                    border: '2px solid rgba(255,255,255,0.1)',
                    borderRadius: 10,
                    color: '#ffffff',
                    fontSize: 18,
                    fontWeight: 600,
                    letterSpacing: 4,
                    textAlign: 'center',
                    fontFamily: 'monospace',
                    outline: 'none',
                    transition: 'all 0.2s'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#4fc3f7';
                    e.target.style.boxShadow = '0 0 0 4px rgba(79,195,247,0.15)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'rgba(255,255,255,0.1)';
                    e.target.style.boxShadow = 'none';
                  }}
                />
                <button
                  type="button"
                  onClick={generateRoomId}
                  title="生成随机ID"
                  style={{
                    padding: '0 16px',
                    backgroundColor: 'rgba(79,195,247,0.1)',
                    border: '2px solid rgba(79,195,247,0.3)',
                    borderRadius: 10,
                    color: '#4fc3f7',
                    fontSize: 20,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    minWidth: 52
                  }}
                  onMouseOver={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(79,195,247,0.2)';
                    (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.05)';
                  }}
                  onMouseOut={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(79,195,247,0.1)';
                    (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
                  }}
                >
                  🎲
                </button>
              </div>
            </div>

            <div>
              <label style={{
                display: 'block',
                fontSize: 12,
                fontWeight: 600,
                color: '#8888aa',
                marginBottom: 8,
                textTransform: 'uppercase',
                letterSpacing: 0.5
              }}>
                你的昵称
              </label>
              <input
                type="text"
                value={nicknameInput}
                onChange={(e) => {
                  setNicknameInput(e.target.value);
                  setError('');
                }}
                placeholder="输入一个昵称..."
                maxLength={20}
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  backgroundColor: 'rgba(255,255,255,0.05)',
                  border: '2px solid rgba(255,255,255,0.1)',
                  borderRadius: 10,
                  color: '#ffffff',
                  fontSize: 15,
                  outline: 'none',
                  transition: 'all 0.2s',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#4fc3f7';
                  e.target.style.boxShadow = '0 0 0 4px rgba(79,195,247,0.15)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(255,255,255,0.1)';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>

            {error && (
              <div style={{
                padding: '12px 14px',
                backgroundColor: 'rgba(255,107,107,0.1)',
                border: '1px solid rgba(255,107,107,0.3)',
                borderRadius: 8,
                color: '#ff6b6b',
                fontSize: 13
              }}>
                ⚠️ {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              style={{
                marginTop: 8,
                padding: '16px 24px',
                background: isLoading
                  ? 'rgba(79,195,247,0.5)'
                  : 'linear-gradient(135deg, #4fc3f7, #748ffc)',
                border: 'none',
                borderRadius: 12,
                color: '#ffffff',
                fontSize: 16,
                fontWeight: 600,
                cursor: isLoading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
                boxShadow: isLoading ? 'none' : '0 8px 24px rgba(79,195,247,0.3)',
                letterSpacing: 1
              }}
              onMouseOver={(e) => {
                if (!isLoading) {
                  (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px)';
                  (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 12px 32px rgba(79,195,247,0.4)';
                }
              }}
              onMouseOut={(e) => {
                (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';
                (e.currentTarget as HTMLButtonElement).style.boxShadow = isLoading ? 'none' : '0 8px 24px rgba(79,195,247,0.3)';
              }}
            >
              {isLoading ? '连接中...' : '🚀 加入协作房间'}
            </button>
          </form>

          <div style={{
            marginTop: 32,
            paddingTop: 24,
            borderTop: '1px solid rgba(255,255,255,0.05)',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 12
          }}>
            {[
              { k: 'Tab', v: '创建子节点' },
              { k: 'Enter', v: '同级节点' },
              { k: 'Ctrl+Z', v: '撤销操作' },
              { k: 'Del', v: '删除节点' }
            ].map(({ k, v }) => (
              <div key={k} style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 10px',
                backgroundColor: 'rgba(255,255,255,0.02)',
                borderRadius: 8
              }}>
                <kbd style={{
                  padding: '2px 8px',
                  backgroundColor: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 4,
                  fontSize: 11,
                  color: '#aaaacc',
                  fontFamily: 'monospace'
                }}>{k}</kbd>
                <span style={{ fontSize: 12, color: '#8888aa' }}>{v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const selectedNode = selectedNodeId && mindMap ? mindMap.nodes[selectedNodeId] || null : null;
  const userColorMap = useMemo(() => {
    const map: Record<string, string> = {};
    ws.users.forEach((u) => { map[u.id] = u.color; });
    return map;
  }, [ws.users]);

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', position: 'relative', overflow: 'hidden' }}>
      <div style={{
        flex: 1,
        width: panelCollapsed ? '100%' : `calc(100% - ${PANEL_WIDTH}px)`,
        transition: 'width 0.3s ease-in-out',
        position: 'relative'
      }}>
        {mindMap && (
          <MapView
            mindMap={mindMap}
            selectedNodeId={selectedNodeId}
            onSelectNode={setSelectedNodeId}
            onMoveNodes={doMoveNodes}
            onNodeDoubleClick={(id) => setEditingNodeId(id)}
            users={ws.users}
            currentUserId={ws.currentUserId}
            cursors={cursors}
          />
        )}

        <div style={{
          position: 'absolute',
          top: 16,
          left: 16,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '10px 16px',
          backgroundColor: 'rgba(30,30,46,0.9)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 12
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 18 }}>🏠</span>
            <span style={{
              fontFamily: 'monospace',
              fontSize: 14,
              fontWeight: 700,
              color: '#4fc3f7',
              letterSpacing: 2
            }}>{ws.roomId}</span>
          </div>
          <div style={{ width: 1, height: 20, backgroundColor: 'rgba(255,255,255,0.1)' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: ws.isConnected ? '#69db7c' : ws.isConnecting ? '#ffd43b' : '#ff6b6b',
              boxShadow: ws.isConnected ? '0 0 8px #69db7c' : 'none'
            }} />
            <span style={{ fontSize: 12, color: '#aaaacc' }}>
              {ws.isConnected ? '已连接' : ws.isConnecting ? '连接中...' : '已断开'}
            </span>
          </div>
          <div style={{ width: 1, height: 20, backgroundColor: 'rgba(255,255,255,0.1)' }} />
          <div style={{ display: 'flex', gap: 4 }}>
            <button
              onClick={doUndo}
              disabled={undoStack.length === 0}
              title="撤销 (Ctrl+Z)"
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                border: '1px solid rgba(255,255,255,0.1)',
                background: undoStack.length ? 'rgba(255,255,255,0.05)' : 'transparent',
                color: undoStack.length ? '#e0e0e0' : '#444455',
                cursor: undoStack.length ? 'pointer' : 'not-allowed',
                fontSize: 14,
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => {
                if (undoStack.length) {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = '#4fc3f7';
                  (e.currentTarget as HTMLButtonElement).style.color = '#4fc3f7';
                }
              }}
              onMouseOut={(e) => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.1)';
                (e.currentTarget as HTMLButtonElement).style.color = undoStack.length ? '#e0e0e0' : '#444455';
              }}
            >↶</button>
            <button
              onClick={doRedo}
              disabled={redoStack.length === 0}
              title="重做 (Ctrl+Shift+Z)"
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                border: '1px solid rgba(255,255,255,0.1)',
                background: redoStack.length ? 'rgba(255,255,255,0.05)' : 'transparent',
                color: redoStack.length ? '#e0e0e0' : '#444455',
                cursor: redoStack.length ? 'pointer' : 'not-allowed',
                fontSize: 14,
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => {
                if (redoStack.length) {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = '#4fc3f7';
                  (e.currentTarget as HTMLButtonElement).style.color = '#4fc3f7';
                }
              }}
              onMouseOut={(e) => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.1)';
                (e.currentTarget as HTMLButtonElement).style.color = redoStack.length ? '#e0e0e0' : '#444455';
              }}
            >↷</button>
          </div>
        </div>

        {isMobile && (
          <button
            onClick={() => setPanelCollapsed(false)}
            style={{
              position: 'absolute',
              top: 16,
              right: 16,
              width: 44,
              height: 44,
              borderRadius: 12,
              backgroundColor: 'rgba(30,30,46,0.9)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: '#e0e0e0',
              fontSize: 20,
              cursor: 'pointer',
              zIndex: 50
            }}
          >☰</button>
        )}
      </div>

      <div style={{
        width: panelCollapsed ? 0 : PANEL_WIDTH,
        overflow: 'hidden',
        flexShrink: 0,
        backgroundColor: '#252538',
        borderLeft: panelCollapsed ? 'none' : '1px solid rgba(255,255,255,0.06)',
        transition: 'all 0.3s ease-in-out',
        position: 'relative'
      }}>
        <div style={{
          width: PANEL_WIDTH,
          height: '100%',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 16px',
            borderBottom: '1px solid rgba(255,255,255,0.05)',
            backgroundColor: 'rgba(0,0,0,0.15)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 18 }}>⚙️</span>
              <span style={{ fontWeight: 600, color: '#e0e0e0', fontSize: 15 }}>控制面板</span>
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              {isMobile && (
                <button
                  onClick={() => setPanelCollapsed(true)}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    border: '1px solid rgba(255,255,255,0.08)',
                    background: 'transparent',
                    color: '#8888aa',
                    cursor: 'pointer',
                    fontSize: 16
                  }}
                >✕</button>
              )}
              <button
                onClick={() => setPanelCollapsed(true)}
                title="收起面板"
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  border: '1px solid rgba(255,255,255,0.08)',
                  background: 'transparent',
                  color: '#8888aa',
                  cursor: 'pointer',
                  fontSize: 14,
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = '#4fc3f7';
                  (e.currentTarget as HTMLButtonElement).style.color = '#4fc3f7';
                }}
                onMouseOut={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.08)';
                  (e.currentTarget as HTMLButtonElement).style.color = '#8888aa';
                }}
              >{isMobile ? '➡' : '❯'}</button>
            </div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div>
              <h3 style={{
                fontSize: 11,
                fontWeight: 700,
                color: '#8888aa',
                textTransform: 'uppercase',
                letterSpacing: 1,
                marginBottom: 12,
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}>
                <span>👥</span> 在线用户 ({ws.users.length})
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {ws.users.map((user: User) => (
                  <div
                    key={user.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '8px 12px',
                      backgroundColor: user.id === ws.currentUserId
                        ? 'rgba(79,195,247,0.1)'
                        : 'rgba(255,255,255,0.02)',
                      borderRadius: 8,
                      border: user.id === ws.currentUserId
                        ? '1px solid rgba(79,195,247,0.2)'
                        : '1px solid rgba(255,255,255,0.04)',
                      transition: 'all 0.2s'
                    }}
                  >
                    <div style={{
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      backgroundColor: user.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 13,
                      fontWeight: 700,
                      color: user.color && getContrastColor(user.color),
                      flexShrink: 0
                    }}>
                      {user.nickname.charAt(0).toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: 13,
                        fontWeight: 500,
                        color: '#e0e0e0',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6
                      }}>
                        {user.nickname}
                        {user.id === ws.currentUserId && (
                          <span style={{
                            fontSize: 10,
                            padding: '1px 6px',
                            backgroundColor: 'rgba(79,195,247,0.2)',
                            color: '#4fc3f7',
                            borderRadius: 4
                          }}>我</span>
                        )}
                      </div>
                    </div>
                    <div style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      backgroundColor: '#69db7c',
                      boxShadow: '0 0 6px #69db7c'
                    }} />
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 style={{
                fontSize: 11,
                fontWeight: 700,
                color: '#8888aa',
                textTransform: 'uppercase',
                letterSpacing: 1,
                marginBottom: 12,
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}>
                <span>✏️</span> 节点编辑
              </h3>
              <NodeEditor
                node={selectedNode}
                onUpdate={doUpdateNode}
              />
            </div>

            <div>
              <h3 style={{
                fontSize: 11,
                fontWeight: 700,
                color: '#8888aa',
                textTransform: 'uppercase',
                letterSpacing: 1,
                marginBottom: 12,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span>📜</span> 操作历史
                </span>
                <span style={{ fontSize: 10, color: '#666688', fontWeight: 500 }}>
                  {historyList.length}/{MAX_HISTORY}
                </span>
              </h3>
              <div style={{
                maxHeight: 200,
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
                padding: 4,
                backgroundColor: 'rgba(255,255,255,0.01)',
                borderRadius: 8,
                border: '1px solid rgba(255,255,255,0.03)'
              }}>
                {historyList.length === 0 ? (
                  <div style={{
                    padding: 20,
                    textAlign: 'center',
                    color: '#666688',
                    fontSize: 12
                  }}>
                    暂无操作记录
                  </div>
                ) : (
                  [...historyList].reverse().map((entry, idx) => (
                    <div
                      key={entry.id}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 10,
                        padding: '8px 10px',
                        borderRadius: 6,
                        opacity: idx === 0 ? 1 : 0.8 - idx * 0.02,
                        transition: 'all 0.2s'
                      }}
                      onMouseOver={(e) => {
                        (e.currentTarget as HTMLDivElement).style.backgroundColor = 'rgba(255,255,255,0.04)';
                      }}
                      onMouseOut={(e) => {
                        (e.currentTarget as HTMLDivElement).style.backgroundColor = 'transparent';
                      }}
                    >
                      <span style={{ fontSize: 14, marginTop: 1 }}>{getActionIcon(entry.action)}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontSize: 12,
                          color: '#ccccdd',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}>
                          {entry.description}
                        </div>
                        <div style={{
                          fontSize: 10,
                          color: '#666688',
                          marginTop: 2,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6
                        }}>
                          <span style={{
                            width: 6,
                            height: 6,
                            borderRadius: '50%',
                            backgroundColor: userColorMap[entry.userId] || '#8888aa'
                          }} />
                          <span>{formatTime(entry.timestamp)}</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div>
              <h3 style={{
                fontSize: 11,
                fontWeight: 700,
                color: '#8888aa',
                textTransform: 'uppercase',
                letterSpacing: 1,
                marginBottom: 12,
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}>
                <span>⌨️</span> 快捷键
              </h3>
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 8
              }}>
                {[
                  { k: 'Tab', v: '子节点' },
                  { k: 'Enter', v: '同级' },
                  { k: 'Del', v: '删除' },
                  { k: 'Ctrl+Z', v: '撤销' },
                  { k: 'Ctrl+Y', v: '重做' },
                  { k: 'Esc', v: '取消' }
                ].map(({ k, v }) => (
                  <div key={k} style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 10px',
                    backgroundColor: 'rgba(255,255,255,0.02)',
                    borderRadius: 6
                  }}>
                    <kbd style={{
                      padding: '2px 7px',
                      backgroundColor: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: 4,
                      fontSize: 10,
                      color: '#aaaacc',
                      fontFamily: 'monospace'
                    }}>{k}</kbd>
                    <span style={{ fontSize: 11, color: '#8888aa' }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div style={{
            padding: '12px 16px',
            borderTop: '1px solid rgba(255,255,255,0.05)',
            display: 'flex',
            gap: 8
          }}>
            <button
              onClick={() => {
                ws.leaveRoom();
                setJoined(false);
                setMindMap(null);
                setUndoStack([]);
                setRedoStack([]);
                setHistoryList([]);
                setRoomIdInput('');
                setNicknameInput('');
              }}
              style={{
                flex: 1,
                padding: '10px 12px',
                backgroundColor: 'rgba(255,107,107,0.1)',
                border: '1px solid rgba(255,107,107,0.2)',
                borderRadius: 8,
                color: '#ff6b6b',
                fontSize: 13,
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(255,107,107,0.2)';
              }}
              onMouseOut={(e) => {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(255,107,107,0.1)';
              }}
            >
              🚪 退出房间
            </button>
          </div>
        </div>
      </div>

      {panelCollapsed && !isMobile && (
        <button
          onClick={() => setPanelCollapsed(false)}
          title="展开面板"
          style={{
            position: 'absolute',
            top: '50%',
            right: 0,
            transform: 'translateY(-50%)',
            width: 24,
            height: 56,
            backgroundColor: '#252538',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRight: 'none',
            borderRadius: '8px 0 0 8px',
            color: '#8888aa',
            cursor: 'pointer',
            fontSize: 14,
            zIndex: 100,
            transition: 'all 0.2s'
          }}
          onMouseOver={(e) => {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#2f2f45';
            (e.currentTarget as HTMLButtonElement).style.color = '#4fc3f7';
            (e.currentTarget as HTMLButtonElement).style.width = '28px';
          }}
          onMouseOut={(e) => {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#252538';
            (e.currentTarget as HTMLButtonElement).style.color = '#8888aa';
            (e.currentTarget as HTMLButtonElement).style.width = '24px';
          }}
        >❮</button>
      )}

      {showDeleteConfirm && deleteTargetId && (
        <div
          onClick={() => setShowDeleteConfirm(false)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.4)',
            backdropFilter: 'blur(6px)',
            WebkitBackdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            animation: 'fadeIn 0.2s ease'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '90%',
              maxWidth: 380,
              padding: 28,
              backgroundColor: '#2a2a3e',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 16,
              boxShadow: '0 32px 64px rgba(0,0,0,0.5)',
              animation: 'slideUp 0.25s ease'
            }}
          >
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{
                width: 56,
                height: 56,
                margin: '0 auto 16px',
                borderRadius: '50%',
                backgroundColor: 'rgba(255,107,107,0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 28
              }}>⚠️</div>
              <h2 style={{
                fontSize: 20,
                fontWeight: 600,
                color: '#ffffff',
                marginBottom: 8
              }}>确认删除节点？</h2>
              <p style={{
                color: '#8888aa',
                fontSize: 14,
                lineHeight: 1.6
              }}>
                节点「<span style={{ color: '#e0e0e0', fontWeight: 500 }}>
                  {mindMap?.nodes[deleteTargetId]?.title || '选中'}
                </span>」及其所有子节点将被永久删除，此操作可撤销。
              </p>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  backgroundColor: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 10,
                  color: '#ccccdd',
                  fontSize: 14,
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.2)';
                }}
              >
                取消
              </button>
              <button
                onClick={() => {
                  doDeleteNode(deleteTargetId);
                  setShowDeleteConfirm(false);
                  setDeleteTargetId(null);
                }}
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  backgroundColor: 'linear-gradient(135deg, #ff6b6b, #fa5252)',
                  border: 'none',
                  borderRadius: 10,
                  color: '#ffffff',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: '0 8px 20px rgba(255,107,107,0.3)'
                }}
                onMouseOver={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)';
                  (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 12px 28px rgba(255,107,107,0.4)';
                }}
                onMouseOut={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';
                  (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 8px 20px rgba(255,107,107,0.3)';
                }}
              >
                🗑️ 确认删除
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        ::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        ::-webkit-scrollbar-track {
          background: transparent;
        }
        ::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.1);
          border-radius: 3px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: rgba(255,255,255,0.2);
        }
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #4fc3f7;
          cursor: pointer;
          border: 2px solid #1e1e2e;
          box-shadow: 0 0 0 1px #4fc3f7;
          transition: all 0.15s;
        }
        input[type="range"]::-webkit-slider-thumb:hover {
          transform: scale(1.2);
        }
      `}</style>
    </div>
  );
};

function getContrastColor(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.5 ? '#1a1a2e' : '#ffffff';
}

export default App;
