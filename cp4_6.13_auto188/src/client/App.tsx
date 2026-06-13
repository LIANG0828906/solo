import { useState, useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { EditorPanel } from './EditorPanel';
import { MindMapCanvas } from './MindMapCanvas';
import { ShareRoom } from './ShareRoom';
import type { MindMapNode, NodeMap, ParseResult, User } from './types';

function nodeMapToRecord(nodes: NodeMap): Record<string, MindMapNode> {
  const result: Record<string, MindMapNode> = {};
  nodes.forEach((node, id) => {
    result[id] = node;
  });
  return result;
}

function recordToNodeMap(record: Record<string, MindMapNode>): NodeMap {
  const result: NodeMap = new Map();
  Object.keys(record).forEach((id) => {
    result.set(id, record[id]);
  });
  return result;
}

export default function App() {
  const [nodes, setNodes] = useState<NodeMap>(new Map());
  const [rootId, setRootId] = useState<string>('');
  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<User[]>([]);
  const [userName, setUserName] = useState('用户' + Math.floor(Math.random() * 1000));
  const [showExportMenu, setShowExportMenu] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const isRemoteUpdateRef = useRef(false);

  useEffect(() => {
    const socket = io({ path: '/socket.io' });
    socketRef.current = socket;

    socket.on('room-joined', (data: { user: User; room: { nodes: Record<string, MindMapNode>; users: Record<string, User> } }) => {
      setCurrentUser(data.user);
      const nodeMap = recordToNodeMap(data.room.nodes);
      if (nodeMap.size > 0) {
        isRemoteUpdateRef.current = true;
        setNodes(nodeMap);
        const firstNode = nodeMap.values().next().value;
        if (firstNode) {
          let root = firstNode;
          while (root.parentId && nodeMap.has(root.parentId)) {
            root = nodeMap.get(root.parentId)!;
          }
          setRootId(root.id);
        }
      }
      setOnlineUsers(Object.values(data.room.users));
    });

    socket.on('user-joined', (data: { user: User; users: User[] }) => {
      setOnlineUsers(data.users);
    });

    socket.on('user-left', (data: { userId: string; users: User[] }) => {
      setOnlineUsers(data.users);
    });

    socket.on('nodes-updated', (data: { nodes: Record<string, MindMapNode> }) => {
      isRemoteUpdateRef.current = true;
      const nodeMap = recordToNodeMap(data.nodes);
      setNodes(nodeMap);
      const firstNode = nodeMap.values().next().value;
      if (firstNode) {
        let root = firstNode;
        while (root.parentId && nodeMap.has(root.parentId)) {
          root = nodeMap.get(root.parentId)!;
        }
        setRootId(root.id);
      }
    });

    socket.on('node-dragged', (data: { nodeId: string; x: number; y: number }) => {
      setNodes((prev) => {
        const next = new Map(prev);
        const node = next.get(data.nodeId);
        if (node) {
          next.set(data.nodeId, { ...node, x: data.x, y: data.y });
        }
        return next;
      });
    });

    socket.on('node-edited', (data: { nodeId: string; text?: string; note?: string; icon?: string }) => {
      setNodes((prev) => {
        const next = new Map(prev);
        const node = next.get(data.nodeId);
        if (node) {
          next.set(data.nodeId, {
            ...node,
            text: data.text !== undefined ? data.text : node.text,
            note: data.note !== undefined ? data.note : node.note,
            icon: data.icon !== undefined ? data.icon : node.icon,
          });
        }
        return next;
      });
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const handleParseResult = useCallback((result: ParseResult) => {
    if (isRemoteUpdateRef.current) {
      isRemoteUpdateRef.current = false;
      return;
    }
    setNodes(result.nodes);
    setRootId(result.rootId);

    if (socketRef.current && roomCode) {
      socketRef.current.emit('nodes-update', {
        roomCode,
        nodes: nodeMapToRecord(result.nodes),
      });
    }
  }, [roomCode]);

  const handleNodeUpdate = useCallback((updatedNode: MindMapNode) => {
    setNodes((prev) => {
      const next = new Map(prev);
      const existing = next.get(updatedNode.id);
      if (!existing) return prev;

      const posChanged = existing.x !== updatedNode.x || existing.y !== updatedNode.y;
      const contentChanged = existing.text !== updatedNode.text || existing.note !== updatedNode.note || existing.icon !== updatedNode.icon;

      next.set(updatedNode.id, updatedNode);

      if (socketRef.current && roomCode) {
        if (posChanged) {
          socketRef.current.emit('node-drag', {
            roomCode,
            nodeId: updatedNode.id,
            x: updatedNode.x,
            y: updatedNode.y,
          });
        }
        if (contentChanged) {
          socketRef.current.emit('node-edit', {
            roomCode,
            nodeId: updatedNode.id,
            text: updatedNode.text,
            note: updatedNode.note,
            icon: updatedNode.icon,
          });
        }
      }

      return next;
    });
  }, [roomCode]);

  const handleCreateRoom = useCallback(async () => {
    try {
      const response = await fetch('/api/rooms', { method: 'POST' });
      const data = await response.json();
      setRoomCode(data.code);
      if (socketRef.current) {
        socketRef.current.emit('join-room', { roomCode: data.code, userName });
        if (nodes.size > 0) {
          socketRef.current.emit('nodes-update', {
            roomCode: data.code,
            nodes: nodeMapToRecord(nodes),
          });
        }
      }
    } catch (e) {
      console.error('Failed to create room', e);
    }
  }, [userName, nodes]);

  const handleJoinRoom = useCallback((code: string, name: string) => {
    setUserName(name);
    setRoomCode(code);
    if (socketRef.current) {
      socketRef.current.emit('join-room', { roomCode: code, userName: name });
    }
  }, []);

  const handleLeaveRoom = useCallback(() => {
    setRoomCode(null);
    setCurrentUser(null);
    setOnlineUsers([]);
  }, []);

  const handleUpdateName = useCallback((name: string) => {
    setUserName(name);
    if (currentUser && socketRef.current && roomCode) {
      const updatedUser = { ...currentUser, name };
      setCurrentUser(updatedUser);
      setOnlineUsers((prev) => prev.map((u) => (u.id === currentUser.id ? updatedUser : u)));
    }
  }, [currentUser, roomCode]);

  const handleShare = useCallback(() => {
    if (!roomCode) {
      handleCreateRoom();
    }
  }, [roomCode, handleCreateRoom]);

  const exportToPNG = useCallback(() => {
    const canvas = canvasContainerRef.current?.querySelector('canvas');
    if (!canvas) return;

    const exportCanvas = document.createElement('canvas');
    const EXPORT_W = 1920;
    const EXPORT_H = 1080;
    exportCanvas.width = EXPORT_W;
    exportCanvas.height = EXPORT_H;
    const ctx = exportCanvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, EXPORT_W, EXPORT_H);

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    nodes.forEach((node) => {
      minX = Math.min(minX, node.x - 120);
      minY = Math.min(minY, node.y - 40);
      maxX = Math.max(maxX, node.x + 120);
      maxY = Math.max(maxY, node.y + 40);
    });

    if (minX === Infinity) {
      minX = 0; minY = 0; maxX = EXPORT_W; maxY = EXPORT_H;
    }

    const contentW = maxX - minX;
    const contentH = maxY - minY;
    const scale = Math.min((EXPORT_W - 80) / contentW, (EXPORT_H - 80) / contentH, 1);
    const offsetX = (EXPORT_W - contentW * scale) / 2 - minX * scale;
    const offsetY = (EXPORT_H - contentH * scale) / 2 - minY * scale;

    ctx.save();
    ctx.translate(offsetX, offsetY);
    ctx.scale(scale, scale);

    const colors = [
      { start: '#667eea', end: '#764ba2' },
      { start: '#7c8cf0', end: '#8b5bb0' },
      { start: '#929af2', end: '#a06bbe' },
      { start: '#a8a9f4', end: '#b57bcd' },
      { start: '#beb7f6', end: '#ca8cdc' },
      { start: '#d4c5f8', end: '#df9cea' },
    ];

    nodes.forEach((node) => {
      if (node.parentId) {
        const parent = nodes.get(node.parentId);
        if (parent) {
          ctx.beginPath();
          ctx.strokeStyle = '#aaa';
          ctx.lineWidth = 2;
          const startX = parent.x + 90;
          const startY = parent.y;
          const endX = node.x - 90;
          const endY = node.y;
          const controlX1 = startX + (endX - startX) * 0.5;
          const controlY1 = startY;
          const controlX2 = startX + (endX - startX) * 0.5;
          const controlY2 = endY;
          ctx.moveTo(startX, startY);
          ctx.bezierCurveTo(controlX1, controlY1, controlX2, controlY2, endX, endY);
          ctx.stroke();
        }
      }
    });

    nodes.forEach((node) => {
      const color = colors[Math.min(node.level, colors.length - 1)];
      const w = 180;
      const h = 44;
      const x = node.x;
      const y = node.y;
      const gradient = ctx.createLinearGradient(x - w / 2, y - h / 2, x + w / 2, y + h / 2);
      gradient.addColorStop(0, color.start);
      gradient.addColorStop(1, color.end);

      ctx.shadowColor = 'rgba(0,0,0,0.1)';
      ctx.shadowBlur = 6;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 2;

      ctx.beginPath();
      const r = 8;
      ctx.moveTo(x - w / 2 + r, y - h / 2);
      ctx.lineTo(x + w / 2 - r, y - h / 2);
      ctx.quadraticCurveTo(x + w / 2, y - h / 2, x + w / 2, y - h / 2 + r);
      ctx.lineTo(x + w / 2, y + h / 2 - r);
      ctx.quadraticCurveTo(x + w / 2, y + h / 2, x + w / 2 - r, y + h / 2);
      ctx.lineTo(x - w / 2 + r, y + h / 2);
      ctx.quadraticCurveTo(x - w / 2, y + h / 2, x - w / 2, y + h / 2 - r);
      ctx.lineTo(x - w / 2, y - h / 2 + r);
      ctx.quadraticCurveTo(x - w / 2, y - h / 2, x - w / 2 + r, y - h / 2);
      ctx.closePath();
      ctx.fillStyle = gradient;
      ctx.fill();
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;

      ctx.fillStyle = '#fff';
      ctx.font = '500 14px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const text = node.text.length > 20 ? node.text.slice(0, 20) + '...' : node.text;
      const textX = node.icon ? x + 10 : x;
      ctx.fillText(text, textX, y);

      if (node.icon) {
        ctx.font = '16px serif';
        ctx.fillText(node.icon, x - w / 2 + 24, y);
      }
    });

    ctx.restore();

    const link = document.createElement('a');
    link.download = `mindmap-${Date.now()}.png`;
    link.href = exportCanvas.toDataURL('image/png');
    link.click();

    setShowExportMenu(false);
  }, [nodes]);

  const exportToJSON = useCallback(() => {
    const nodesArray = Array.from(nodes.values());
    const connections: { from: string; to: string }[] = [];
    nodes.forEach((node) => {
      if (node.parentId) {
        connections.push({ from: node.parentId, to: node.id });
      }
    });

    const data = {
      nodes: nodesArray,
      connections,
      rootId,
      exportedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.download = `mindmap-${Date.now()}.json`;
    link.href = URL.createObjectURL(blob);
    link.click();
    URL.revokeObjectURL(link.href);
    setShowExportMenu(false);
  }, [nodes, rootId]);

  const handleExport = useCallback(() => {
    setShowExportMenu((prev) => !prev);
  }, []);

  return (
    <div className="app">
      <div className={`left-panel ${leftCollapsed ? 'collapsed' : ''}`}>
        <EditorPanel
          onChange={handleParseResult}
          onShare={handleShare}
          onExport={handleExport}
          nodes={nodes}
          rootId={rootId}
        />
        <ShareRoom
          currentRoomCode={roomCode}
          onlineUsers={onlineUsers}
          currentUserId={currentUser?.id || null}
          currentUserName={userName}
          onCreateRoom={handleCreateRoom}
          onJoinRoom={handleJoinRoom}
          onLeaveRoom={handleLeaveRoom}
          onUpdateName={handleUpdateName}
        />

        {showExportMenu && (
          <div className="export-menu" style={{
            position: 'absolute', bottom: '20px', left: '16px',
            background: '#fff', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            padding: '8px', display: 'flex', flexDirection: 'column', gap: '4px', zIndex: 300,
            border: '1px solid #e5e7eb', minWidth: '140px',
          }} onClick={(e) => e.stopPropagation()}>
            <button className="btn btn-secondary" onClick={exportToPNG} style={{ justifyContent: 'flex-start', padding: '8px 12px' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
              导出 PNG
            </button>
            <button className="btn btn-secondary" onClick={exportToJSON} style={{ justifyContent: 'flex-start', padding: '8px 12px' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>
              导出 JSON
            </button>
          </div>
        )}
      </div>

      <div className="divider" onClick={() => setLeftCollapsed(!leftCollapsed)}>
        <div className="collapse-btn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </div>
      </div>

      <div className="canvas-container" ref={canvasContainerRef} onClick={() => setShowExportMenu(false)}>
        {onlineUsers.length > 0 && (
          <div className="online-users">
            {onlineUsers.slice(0, 5).map((user) => (
              <div key={user.id} className="user-avatar">
                <div className="avatar-circle">
                  {user.name.charAt(0).toUpperCase()}
                  <span className="online-dot" />
                </div>
                <span className="user-name">
                  {user.id === currentUser?.id ? `${user.name}(我)` : user.name}
                </span>
              </div>
            ))}
            {onlineUsers.length > 5 && (
              <div className="user-avatar">
                <div className="avatar-circle">
                  +{onlineUsers.length - 5}
                </div>
              </div>
            )}
          </div>
        )}

        {nodes.size > 0 && rootId && (
          <MindMapCanvas nodes={nodes} rootId={rootId} onNodeUpdate={handleNodeUpdate} />
        )}
      </div>
    </div>
  );
}
