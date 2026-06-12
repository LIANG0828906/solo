import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import { v4 as uuidv4 } from 'uuid';
import { DrawEngine, Stroke, Sticky, MindNode } from '../modules/drawEngine';
import { GraphEngine } from '../modules/graphEngine';
import { useBoardStore, ChatMessage, OnlineUser, VersionInfo } from '../store/boardStore';

interface RemoteCursor {
  userId: string;
  username: string;
  x: number;
  y: number;
  lastSeen: number;
}

function BoardPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawEngineRef = useRef<DrawEngine | null>(null);
  const graphEngineRef = useRef<GraphEngine | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [isDrawing, setIsDrawing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragType, setDragType] = useState<'sticky' | 'node' | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  
  const [editingStickyId, setEditingStickyId] = useState<string | null>(null);
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [stickyText, setStickyText] = useState('');
  const [nodeText, setNodeText] = useState('');
  
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; type: string; id?: string } | null>(null);
  const [chatInput, setChatInput] = useState('');
  const [chatCollapsed, setChatCollapsed] = useState(false);
  const [remoteCursors, setRemoteCursors] = useState<Map<string, RemoteCursor>>(new Map());
  const [previewVersion, setPreviewVersion] = useState<VersionInfo | null>(null);
  const [previewSnapshot, setPreviewSnapshot] = useState<any>(null);
  
  const lastCursorEmit = useRef(0);

  const {
    tool,
    penColor,
    penWidth,
    strokes,
    stickies,
    nodes,
    selectedId,
    selectedType,
    chats,
    onlineUsers,
    versions,
    showVersionPanel,
    username,
    userId,
    avatarColor,
    setTool,
    setPenColor,
    setPenWidth,
    setStrokes,
    setStickies,
    setNodes,
    addStroke,
    removeStroke,
    addSticky,
    updateSticky,
    removeSticky,
    addNode,
    updateNode,
    removeNode,
    setSelected,
    addChat,
    setChats,
    addOnlineUser,
    removeOnlineUser,
    setOnlineUsers,
    setVersions,
    setShowVersionPanel,
    setUsername,
    setUserId,
    setAvatarColor,
    clearBoard,
  } = useBoardStore();

  const penColors = ['#FFFFFF', '#E53E3E', '#38A169', '#3182CE', '#D69E2E', '#9F7AEA'];
  const penWidths = [2, 5, 10];

  useEffect(() => {
    const savedUsername = localStorage.getItem('username');
    if (!savedUsername) {
      navigate('/join');
      return;
    }
    setUsername(savedUsername);
  }, [navigate, setUsername]);

  useEffect(() => {
    if (!canvasRef.current || !roomId) return;

    const engine = new DrawEngine(canvasRef.current);
    drawEngineRef.current = engine;
    
    const graphEngine = new GraphEngine();
    graphEngineRef.current = graphEngine;

    const socket = io({
      path: '/socket.io',
      transports: ['websocket', 'polling'],
    });
    socketRef.current = socket;

    const uid = localStorage.getItem('userId') || uuidv4();
    localStorage.setItem('userId', uid);
    setUserId(uid);

    socket.on('connect', () => {
      socket.emit('room:join', {
        roomId,
        username: localStorage.getItem('username') || '匿名用户',
        userId: uid,
      });
    });

    socket.on('room:joined', (data: {
      userId: string;
      avatarColor: string;
      boardState: { strokes: Stroke[]; stickies: Sticky[]; nodes: MindNode[] };
      chats: ChatMessage[];
      onlineUsers: OnlineUser[];
    }) => {
      setAvatarColor(data.avatarColor);
      setStrokes(data.boardState.strokes);
      setStickies(data.boardState.stickies);
      setNodes(data.boardState.nodes);
      setChats(data.chats);
      setOnlineUsers(data.onlineUsers);
      
      engine.setStrokes(data.boardState.strokes);
      engine.setStickies(data.boardState.stickies);
      engine.setNodes(data.boardState.nodes);
      
      graphEngine.setNodes(data.boardState.nodes);
    });

    socket.on('user:joined', (user: OnlineUser) => {
      addOnlineUser(user);
    });

    socket.on('user:left', ({ userId }: { userId: string }) => {
      removeOnlineUser(userId);
      setRemoteCursors(prev => {
        const next = new Map(prev);
        next.delete(userId);
        return next;
      });
    });

    socket.on('stroke:add', (stroke: Stroke) => {
      addStroke(stroke);
      engine.addStroke(stroke);
    });

    socket.on('stroke:delete', ({ id }: { id: string }) => {
      removeStroke(id);
      engine.removeStroke(id);
    });

    socket.on('sticky:add', (sticky: Sticky) => {
      addSticky(sticky);
      engine.addSticky(sticky);
    });

    socket.on('sticky:update', ({ id, updates }: { id: string; updates: Partial<Sticky> }) => {
      updateSticky(id, updates);
      engine.updateSticky(id, updates);
    });

    socket.on('sticky:delete', ({ id }: { id: string }) => {
      removeSticky(id);
      engine.removeSticky(id);
    });

    socket.on('node:add', (node: MindNode) => {
      addNode(node);
      engine.addNode(node);
      graphEngine.addNode(node);
    });

    socket.on('node:update', ({ id, updates }: { id: string; updates: Partial<MindNode> }) => {
      updateNode(id, updates);
      engine.updateNode(id, updates);
      if (updates.x !== undefined || updates.y !== undefined) {
        const node = graphEngine.getNode(id);
        if (node) {
          if (updates.x !== undefined) node.x = updates.x;
          if (updates.y !== undefined) node.y = updates.y;
        }
      }
    });

    socket.on('node:delete', ({ id }: { id: string }) => {
      removeNode(id);
      engine.removeNode(id);
      graphEngine.removeNode(id);
    });

    socket.on('chat:new', (chat: ChatMessage) => {
      addChat(chat);
    });

    socket.on('cursor:move', (data: { userId: string; username: string; x: number; y: number }) => {
      setRemoteCursors(prev => {
        const next = new Map(prev);
        next.set(data.userId, {
          userId: data.userId,
          username: data.username,
          x: data.x,
          y: data.y,
          lastSeen: Date.now(),
        });
        return next;
      });
    });

    socket.on('board:restore', (snapshot: { strokes: Stroke[]; stickies: Sticky[]; nodes: MindNode[] }) => {
      clearBoard();
      setStrokes(snapshot.strokes);
      setStickies(snapshot.stickies);
      setNodes(snapshot.nodes);
      engine.setStrokes(snapshot.strokes);
      engine.setStickies(snapshot.stickies);
      engine.setNodes(snapshot.nodes);
      graphEngine.setNodes(snapshot.nodes);
    });

    socket.on('version:new', () => {
      fetchVersions();
    });

    const handleResize = () => {
      engine.resize();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      socket.disconnect();
    };
  }, [roomId]);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setRemoteCursors(prev => {
        const next = new Map(prev);
        for (const [key, cursor] of next) {
          if (now - cursor.lastSeen > 5000) {
            next.delete(key);
          }
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const fetchVersions = useCallback(async () => {
    if (!roomId) return;
    try {
      const res = await fetch(`/api/rooms/${roomId}/versions`);
      const data = await res.json();
      setVersions(data);
    } catch (e) {
      console.error('Failed to fetch versions:', e);
    }
  }, [roomId, setVersions]);

  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (e.button === 2) return;
    
    const { x, y } = getCanvasCoords(e);
    const engine = drawEngineRef.current;
    const graphEngine = graphEngineRef.current;
    if (!engine || !graphEngine) return;

    if (tool === 'pen') {
      const strokeId = uuidv4();
      engine.setPenColor(penColor);
      engine.setPenWidth(penWidth);
      const stroke = engine.startDrawing(x, y, strokeId);
      if (stroke) {
        setIsDrawing(true);
      }
      return;
    }

    if (tool === 'eraser') {
      const erasedIds = engine.eraseAt(x, y);
      for (const id of erasedIds) {
        if (strokes.find(s => s.id === id)) {
          removeStroke(id);
          socketRef.current?.emit('stroke:delete', { id });
        } else if (stickies.find(s => s.id === id)) {
          removeSticky(id);
          socketRef.current?.emit('sticky:delete', { id });
        } else if (nodes.find(n => n.id === id)) {
          removeNode(id);
          graphEngine.removeNode(id);
          socketRef.current?.emit('node:delete', { id });
        }
      }
      return;
    }

    if (tool === 'sticky') {
      const newSticky: Sticky = {
        id: uuidv4(),
        x: x - 90,
        y: y - 60,
        width: 180,
        height: 120,
        text: '',
        color: '#FFF9C4',
        z_index: Date.now(),
      };
      engine.addSticky(newSticky);
      addSticky(newSticky);
      socketRef.current?.emit('sticky:add', newSticky);
      setEditingStickyId(newSticky.id);
      setStickyText('');
      return;
    }

    if (tool === 'node') {
      const hitNode = engine.hitTestNode(x, y);
      if (!hitNode) {
        const newNode: MindNode = {
          id: uuidv4(),
          parent_id: null,
          x,
          y,
          radius: 45,
          text: '中心主题',
          color: '#1E3A5F',
          z_index: Date.now(),
        };
        engine.addNode(newNode);
        addNode(newNode);
        graphEngine.addNode(newNode);
        socketRef.current?.emit('node:add', newNode);
      }
      return;
    }

    if (tool === 'select') {
      const hitSticky = engine.hitTestSticky(x, y);
      const hitNode = engine.hitTestNode(x, y);
      
      if (hitSticky) {
        setSelected(hitSticky.id, 'sticky');
        setDragType('sticky');
        setDragId(hitSticky.id);
        setDragOffset({ x: x - hitSticky.x, y: y - hitSticky.y });
        setIsDragging(true);
      } else if (hitNode) {
        setSelected(hitNode.id, 'node');
        setDragType('node');
        setDragId(hitNode.id);
        setDragOffset({ x: x - hitNode.x, y: y - hitNode.y });
        setIsDragging(true);
      } else {
        setSelected(null, null);
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x, y } = getCanvasCoords(e);
    const engine = drawEngineRef.current;
    const graphEngine = graphEngineRef.current;
    if (!engine || !graphEngine) return;

    const now = Date.now();
    if (now - lastCursorEmit.current > 50) {
      socketRef.current?.emit('cursor:move', { x, y });
      lastCursorEmit.current = now;
    }

    if (isDrawing) {
      engine.continueDrawing(x, y);
      return;
    }

    if (isDragging && dragId && dragType) {
      if (dragType === 'sticky') {
        const newX = x - dragOffset.x;
        const newY = y - dragOffset.y;
        engine.updateSticky(dragId, { x: newX, y: newY });
        updateSticky(dragId, { x: newX, y: newY });
      } else if (dragType === 'node') {
        const node = graphEngine.getNode(dragId);
        if (node) {
          const dx = x - dragOffset.x - node.x;
          const dy = y - dragOffset.y - node.y;
          
          graphEngine.moveNodeWithChildren(dragId, dx, dy);
          
          const allNodes = graphEngine.getAllNodes();
          for (const n of allNodes) {
            engine.updateNode(n.id, { x: n.x, y: n.y });
            updateNode(n.id, { x: n.x, y: n.y });
          }
        }
      }
    }
  };

  const handleMouseUp = () => {
    const engine = drawEngineRef.current;
    if (!engine) return;

    if (isDrawing) {
      const stroke = engine.endDrawing();
      if (stroke) {
        addStroke(stroke);
        socketRef.current?.emit('stroke:add', stroke);
      }
      setIsDrawing(false);
    }

    if (isDragging && dragId && dragType) {
      if (dragType === 'sticky') {
        const sticky = stickies.find(s => s.id === dragId);
        if (sticky) {
          socketRef.current?.emit('sticky:update', {
            id: dragId,
            updates: { x: sticky.x, y: sticky.y },
          });
        }
      } else if (dragType === 'node') {
        const graphEngine = graphEngineRef.current;
        if (graphEngine) {
          const allNodes = graphEngine.getAllNodes();
          for (const n of allNodes) {
            socketRef.current?.emit('node:update', {
              id: n.id,
              updates: { x: n.x, y: n.y },
            });
          }
        }
      }
    }

    setIsDragging(false);
    setDragType(null);
    setDragId(null);
  };

  const handleMouseLeave = () => {
    handleMouseUp();
  };

  const handleDoubleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x, y } = getCanvasCoords(e);
    const engine = drawEngineRef.current;
    if (!engine) return;

    const hitSticky = engine.hitTestSticky(x, y);
    if (hitSticky) {
      setEditingStickyId(hitSticky.id);
      setStickyText(hitSticky.text);
      return;
    }

    const hitNode = engine.hitTestNode(x, y);
    if (hitNode) {
      setEditingNodeId(hitNode.id);
      setNodeText(hitNode.text);
      return;
    }
  };

  const handleContextMenu = (e: React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const { x, y } = getCanvasCoords(e);
    const engine = drawEngineRef.current;
    if (!engine) return;

    const hitNode = engine.hitTestNode(x, y);
    if (hitNode) {
      setContextMenu({ x: e.clientX, y: e.clientY, type: 'node', id: hitNode.id });
      return;
    }

    const hitSticky = engine.hitTestSticky(x, y);
    if (hitSticky) {
      setContextMenu({ x: e.clientX, y: e.clientY, type: 'sticky', id: hitSticky.id });
      return;
    }

    setContextMenu({ x: e.clientX, y: e.clientY, type: 'canvas' });
  };

  const handleContextMenuClick = (action: string) => {
    const engine = drawEngineRef.current;
    const graphEngine = graphEngineRef.current;
    const socket = socketRef.current;
    if (!engine || !graphEngine || !socket || !contextMenu?.id) {
      setContextMenu(null);
      return;
    }

    const id = contextMenu.id;

    if (contextMenu.type === 'node') {
      if (action === 'addChild') {
        const childId = uuidv4();
        const childNode = graphEngine.addChildNode(id, childId, '新节点');
        if (childNode) {
          engine.addNode(childNode);
          addNode(childNode);
          socket.emit('node:add', childNode);
        }
      } else if (action === 'delete') {
        const descendants = graphEngine.getDescendants(id);
        const allIds = [id, ...descendants.map(d => d.id)];
        
        for (const nid of allIds) {
          engine.removeNode(nid);
          removeNode(nid);
          graphEngine.removeNode(nid);
        }
        socket.emit('node:delete', { id });
      } else if (action === 'edit') {
        const node = graphEngine.getNode(id);
        if (node) {
          setEditingNodeId(id);
          setNodeText(node.text);
        }
      }
    } else if (contextMenu.type === 'sticky') {
      if (action === 'delete') {
        engine.removeSticky(id);
        removeSticky(id);
        socket.emit('sticky:delete', { id });
      } else if (action === 'top') {
        const maxZ = Math.max(...stickies.map(s => s.z_index), ...strokes.map(s => s.z_index), ...nodes.map(n => n.z_index));
        const newZ = maxZ + 1;
        engine.updateSticky(id, { z_index: newZ });
        updateSticky(id, { z_index: newZ });
        socket.emit('sticky:top', { id });
      } else if (action === 'edit') {
        const sticky = stickies.find(s => s.id === id);
        if (sticky) {
          setEditingStickyId(id);
          setStickyText(sticky.text);
        }
      }
    }

    setContextMenu(null);
  };

  const handleStickyTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setStickyText(e.target.value);
    const engine = drawEngineRef.current;
    if (engine && editingStickyId) {
      engine.updateSticky(editingStickyId, { text: e.target.value });
      updateSticky(editingStickyId, { text: e.target.value });
    }
  };

  const handleStickyTextBlur = () => {
    if (editingStickyId) {
      socketRef.current?.emit('sticky:update', {
        id: editingStickyId,
        updates: { text: stickyText },
      });
    }
    setEditingStickyId(null);
  };

  const handleNodeTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.slice(0, 40);
    setNodeText(value);
    const engine = drawEngineRef.current;
    if (engine && editingNodeId) {
      engine.updateNode(editingNodeId, { text: value });
      updateNode(editingNodeId, { text: value });
      const graphEngine = graphEngineRef.current;
      if (graphEngine) {
        const node = graphEngine.getNode(editingNodeId);
        if (node) node.text = value;
      }
    }
  };

  const handleNodeTextBlur = () => {
    if (editingNodeId) {
      socketRef.current?.emit('node:update', {
        id: editingNodeId,
        updates: { text: nodeText },
      });
    }
    setEditingNodeId(null);
  };

  const sendChat = () => {
    if (!chatInput.trim()) return;
    socketRef.current?.emit('chat:send', { message: chatInput.trim() });
    setChatInput('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendChat();
    }
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleRestoreVersion = async (versionId: string) => {
    if (!roomId) return;
    if (!confirm('确定要恢复到此版本吗？当前内容将被替换。')) {
      return;
    }
    
    try {
      await fetch(`/api/rooms/${roomId}/versions/${versionId}/restore`, { method: 'POST' });
      setShowVersionPanel(false);
      setPreviewVersion(null);
      setPreviewSnapshot(null);
    } catch (e) {
      console.error('Failed to restore version:', e);
      alert('恢复版本失败');
    }
  };

  const handlePreviewVersion = async (version: VersionInfo) => {
    if (!roomId) return;
    try {
      const res = await fetch(`/api/rooms/${roomId}/versions/${version.id}`);
      const data = await res.json();
      setPreviewVersion(version);
      setPreviewSnapshot(data.snapshot ? JSON.parse(data.snapshot) : null);
    } catch (e) {
      console.error('Failed to fetch version:', e);
    }
  };

  const getStickyInputStyle = () => {
    const sticky = stickies.find(s => s.id === editingStickyId);
    if (!sticky) return {};
    return {
      left: sticky.x,
      top: sticky.y,
      width: sticky.width,
      height: sticky.height,
      backgroundColor: sticky.color,
    };
  };

  const getNodeInputStyle = () => {
    const node = nodes.find(n => n.id === editingNodeId);
    if (!node) return {};
    return {
      left: node.x,
      top: node.y,
      width: node.radius * 2,
    };
  };

  return (
    <div className="board-page">
      <div className="top-bar">
        <div className="room-info">
          <span className="room-id">{roomId}</span>
          <div className="online-count">
            <span className="online-dot"></span>
            <span>{onlineUsers.length} 在线</span>
          </div>
        </div>
        
        <div className="tool-bar">
          <button
            className={`tool-btn ${tool === 'pen' ? 'active' : ''}`}
            onClick={() => setTool('pen')}
            title="画笔"
          >
            ✏️
          </button>
          <button
            className={`tool-btn ${tool === 'sticky' ? 'active' : ''}`}
            onClick={() => setTool('sticky')}
            title="便签"
          >
            📝
          </button>
          <button
            className={`tool-btn ${tool === 'node' ? 'active' : ''}`}
            onClick={() => setTool('node')}
            title="思维导图"
          >
            🧠
          </button>
          <button
            className={`tool-btn ${tool === 'eraser' ? 'active' : ''}`}
            onClick={() => setTool('eraser')}
            title="橡皮擦"
          >
            🧹
          </button>
          <button
            className={`tool-btn ${tool === 'select' ? 'active' : ''}`}
            onClick={() => setTool('select')}
            title="选择"
          >
            👆
          </button>
        </div>
        
        <div className="top-actions">
          <button
            className="icon-btn"
            onClick={() => {
              setShowVersionPanel(!showVersionPanel);
              if (!showVersionPanel) fetchVersions();
            }}
            title="历史版本"
          >
            📜
          </button>
          <button
            className="icon-btn"
            onClick={() => navigate('/join')}
            title="退出房间"
          >
            🚪
          </button>
        </div>
      </div>

      <div className="board-container" ref={containerRef}>
        <div className="canvas-wrapper">
          <canvas
            ref={canvasRef}
            className="board-canvas"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
            onDoubleClick={handleDoubleClick}
            onContextMenu={handleContextMenu}
            style={{ width: '100%', height: '100%' }}
          />
          
          {Array.from(remoteCursors.values()).map(cursor => (
            <div
              key={cursor.userId}
              className="cursor-indicator"
              style={{
                left: cursor.x,
                top: cursor.y,
              }}
            >
              <div
                className="cursor-dot"
                style={{
                  backgroundColor: onlineUsers.find(u => u.userId === cursor.userId)?.avatarColor || '#3182CE',
                }}
              />
              <div
                className="cursor-label"
                style={{
                  backgroundColor: onlineUsers.find(u => u.userId === cursor.userId)?.avatarColor || '#3182CE',
                }}
              >
                {cursor.username}
              </div>
            </div>
          ))}

          {editingStickyId && (
            <textarea
              className="sticky-text-input"
              style={getStickyInputStyle()}
              value={stickyText}
              onChange={handleStickyTextChange}
              onBlur={handleStickyTextBlur}
              autoFocus
              placeholder="输入便签内容..."
            />
          )}

          {editingNodeId && (
            <input
              type="text"
              className="node-text-input"
              style={getNodeInputStyle()}
              value={nodeText}
              onChange={handleNodeTextChange}
              onBlur={handleNodeTextBlur}
              autoFocus
              maxLength={40}
            />
          )}
        </div>

        <div className="left-toolbar">
          <div className="color-palette" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)' }}>
            {penColors.map(color => (
              <button
                key={color}
                className={`color-btn ${penColor === color ? 'active' : ''}`}
                style={{ backgroundColor: color }}
                onClick={() => setPenColor(color)}
              />
            ))}
          </div>
          
          <div className="brush-size">
            <span className="brush-size-label">笔刷</span>
            <input
              type="range"
              className="size-slider"
              min="1"
              max="20"
              value={penWidth}
              onChange={(e) => setPenWidth(Number(e.target.value))}
            />
          </div>
        </div>

        {showVersionPanel && (
          <div className="version-panel">
            <div className="version-header">
              <span className="version-title">历史版本</span>
              <button
                className="icon-btn"
                style={{ width: '24px', height: '24px', fontSize: '14px' }}
                onClick={() => setShowVersionPanel(false)}
              >
                ✕
              </button>
            </div>
            <div className="version-list">
              {versions.length === 0 ? (
                <div style={{ padding: '20px', textAlign: 'center', color: '#718096', fontSize: '13px' }}>
                  暂无历史版本
                </div>
              ) : (
                versions.map(version => (
                  <div
                    key={version.id}
                    className="version-item"
                    onClick={() => handlePreviewVersion(version)}
                  >
                    <span className="version-label">{version.label || '未命名版本'}</span>
                    <span className="version-time">{formatTime(version.timestamp)}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        <div className={`chat-panel ${chatCollapsed ? 'collapsed' : ''}`}>
          <div className="chat-header" onClick={() => setChatCollapsed(!chatCollapsed)}>
            <span className="chat-title">💬 聊天室</span>
            <span style={{ fontSize: '12px', color: '#a0aec0' }}>
              {chatCollapsed ? '▲' : '▼'}
            </span>
          </div>
          
          {!chatCollapsed && (
            <>
              <div className="chat-messages">
                {chats.map(chat => (
                  <div key={chat.id} className="chat-message">
                    <div
                      className="chat-avatar"
                      style={{ backgroundColor: chat.avatar_color }}
                    >
                      {chat.username.charAt(0).toUpperCase()}
                    </div>
                    <div className="chat-content">
                      <div className="chat-username">{chat.username}</div>
                      <div className="chat-text">{chat.message}</div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="chat-input-container">
                <div className="chat-input-wrapper">
                  <input
                    type="text"
                    className="chat-input"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="输入消息..."
                  />
                  <button className="chat-send-btn" onClick={sendChat}>
                    发送
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {contextMenu && (
          <div
            className="context-menu"
            style={{ left: contextMenu.x, top: contextMenu.y }}
            onClick={() => setContextMenu(null)}
          >
            {contextMenu.type === 'node' && (
              <>
                <div className="context-menu-item" onClick={() => handleContextMenuClick('addChild')}>
                  添加子节点
                </div>
                <div className="context-menu-item" onClick={() => handleContextMenuClick('edit')}>
                  编辑文字
                </div>
                <div className="context-menu-divider" />
                <div
                  className="context-menu-item"
                  style={{ color: '#FC8181' }}
                  onClick={() => handleContextMenuClick('delete')}
                >
                  删除节点
                </div>
              </>
            )}
            {contextMenu.type === 'sticky' && (
              <>
                <div className="context-menu-item" onClick={() => handleContextMenuClick('edit')}>
                  编辑内容
                </div>
                <div className="context-menu-item" onClick={() => handleContextMenuClick('top')}>
                  置顶
                </div>
                <div className="context-menu-divider" />
                <div
                  className="context-menu-item"
                  style={{ color: '#FC8181' }}
                  onClick={() => handleContextMenuClick('delete')}
                >
                  删除便签
                </div>
              </>
            )}
          </div>
        )}

        {previewVersion && (
          <div className="version-preview-modal" onClick={() => { setPreviewVersion(null); setPreviewSnapshot(null); }}>
            <div className="version-preview-content" onClick={e => e.stopPropagation()}>
              <h3 className="version-preview-title">
                {previewVersion.label || '历史版本'}
              </h3>
              <p style={{ color: '#a0aec0', fontSize: '13px', marginBottom: '16px' }}>
                {formatTime(previewVersion.timestamp)}
              </p>
              
              {previewSnapshot && (
                <div
                  style={{
                    background: '#1a202c',
                    borderRadius: '8px',
                    padding: '16px',
                    marginBottom: '20px',
                    fontSize: '13px',
                    color: '#a0aec0',
                  }}
                >
                  <div>笔画: {previewSnapshot.strokes?.length || 0} 条</div>
                  <div>便签: {previewSnapshot.stickies?.length || 0} 个</div>
                  <div>节点: {previewSnapshot.nodes?.length || 0} 个</div>
                </div>
              )}
              
              <div className="version-preview-actions">
                <button className="btn-secondary" onClick={() => { setPreviewVersion(null); setPreviewSnapshot(null); }}>
                  取消
                </button>
                <button className="btn-danger" onClick={() => handleRestoreVersion(previewVersion.id)}>
                  恢复此版本
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default BoardPage;
