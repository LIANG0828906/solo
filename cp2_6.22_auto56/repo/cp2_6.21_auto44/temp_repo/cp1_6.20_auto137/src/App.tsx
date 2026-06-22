import { useState, useEffect, useRef, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import MindMap from './components/MindMap';
import Toolbar from './components/Toolbar';
import {
  MindMapNode,
  MindMapDocument,
  ThemeType,
  THEMES,
  UserCursor,
  Operation,
  HistoryState,
} from './types';

const MAX_HISTORY = 50;
const CURSOR_COLORS = [
  '#e53935',
  '#1e88e5',
  '#43a047',
  '#fb8c00',
  '#8e24aa',
  '#00acc1',
  '#f4511e',
  '#6d4c41',
];

function App() {
  const [mindMapDoc, setMindMapDoc] = useState<MindMapDocument | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(true);
  const [showModal, setShowModal] = useState(true);
  const [modalMode, setModalMode] = useState<'create' | 'join'>('create');
  const [userName, setUserName] = useState('');
  const [joinDocId, setJoinDocId] = useState('');
  const [selectedTheme, setSelectedTheme] = useState<ThemeType>('ocean');
  const [userCursors, setUserCursors] = useState<Map<string, UserCursor>>(new Map());
  const [history, setHistory] = useState<HistoryState[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [showCopyToast, setShowCopyToast] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const userIdRef = useRef<string>(uuidv4());
  const reconnectTimerRef = useRef<number | null>(null);

  const theme = mindMapDoc?.theme || selectedTheme;
  const themeConfig = THEMES[theme];

  const saveToHistory = useCallback((nodes: MindMapNode[]) => {
    setHistory((prev) => {
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push({ nodes: JSON.parse(JSON.stringify(nodes)) });
      if (newHistory.length > MAX_HISTORY) {
        newHistory.shift();
      }
      return newHistory;
    });
    setHistoryIndex((prev) => Math.min(prev + 1, MAX_HISTORY - 1));
  }, [historyIndex]);

  const undo = useCallback(() => {
    if (historyIndex > 0 && mindMapDoc) {
      const newIndex = historyIndex - 1;
      const prevState = history[newIndex];
      if (prevState) {
        setMindMapDoc({
          ...mindMapDoc,
          nodes: JSON.parse(JSON.stringify(prevState.nodes)),
        });
        setHistoryIndex(newIndex);
        sendOperation({
          type: 'edit',
          nodeId: '__history__',
          payload: { nodes: prevState.nodes },
          timestamp: Date.now(),
        });
      }
    }
  }, [historyIndex, history, mindMapDoc]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1 && mindMapDoc) {
      const newIndex = historyIndex + 1;
      const nextState = history[newIndex];
      if (nextState) {
        setMindMapDoc({
          ...mindMapDoc,
          nodes: JSON.parse(JSON.stringify(nextState.nodes)),
        });
        setHistoryIndex(newIndex);
        sendOperation({
          type: 'edit',
          nodeId: '__history__',
          payload: { nodes: nextState.nodes },
          timestamp: Date.now(),
        });
      }
    }
  }, [historyIndex, history, mindMapDoc]);

  const connectWebSocket = useCallback((docId: string) => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws?docId=${docId}&userId=${userIdRef.current}&userName=${encodeURIComponent(userName)}`;

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('WebSocket connected');
      setIsConnected(true);
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
      setIsConnected(false);
      if (!reconnectTimerRef.current) {
        reconnectTimerRef.current = window.setTimeout(() => {
          connectWebSocket(docId);
        }, 2000);
      }
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        handleWebSocketMessage(data);
      } catch (e) {
        console.error('Failed to parse WebSocket message:', e);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  }, [userName]);

  const handleWebSocketMessage = useCallback((data: any) => {
    switch (data.type) {
      case 'doc-state':
        setMindMapDoc(data.document);
        setHistory([{ nodes: JSON.parse(JSON.stringify(data.document.nodes)) }]);
        setHistoryIndex(0);
        break;

      case 'operation-broadcast':
        if (data.userId !== userIdRef.current) {
          applyRemoteOperation(data.operation);
        }
        break;

      case 'cursor-broadcast':
        if (data.userId !== userIdRef.current) {
          setUserCursors((prev) => {
            const next = new Map(prev);
            next.set(data.userId, {
              userId: data.userId,
              userName: data.userName,
              color: data.color,
              x: data.x,
              y: data.y,
            });
            return next;
          });
        }
        break;

      case 'user-join':
        console.log('User joined:', data.userName);
        break;

      case 'user-leave':
        setUserCursors((prev) => {
          const next = new Map(prev);
          next.delete(data.userId);
          return next;
        });
        break;
    }
  }, []);

  const applyRemoteOperation = useCallback((operation: Operation) => {
    setMindMapDoc((prev) => {
      if (!prev) return prev;

      let newNodes = [...prev.nodes];

      switch (operation.type) {
        case 'add': {
          const existing = newNodes.find((n) => n.id === operation.nodeId);
          if (!existing) {
            newNodes.push(operation.payload.node);
          }
          break;
        }
        case 'delete': {
          newNodes = newNodes.filter((n) => n.id !== operation.nodeId);
          const children = newNodes.filter((n) => n.parentId === operation.nodeId);
          children.forEach((child) => {
            child.parentId = operation.payload.parentId;
          });
          break;
        }
        case 'move': {
          const node = newNodes.find((n) => n.id === operation.nodeId);
          if (node) {
            node.x = operation.payload.x;
            node.y = operation.payload.y;
          }
          break;
        }
        case 'edit': {
          if (operation.nodeId === '__history__') {
            newNodes = JSON.parse(JSON.stringify(operation.payload.nodes));
          } else {
            const node = newNodes.find((n) => n.id === operation.nodeId);
            if (node) {
              node.text = operation.payload.text;
            }
          }
          break;
        }
      }

      return { ...prev, nodes: newNodes, updatedAt: Date.now() };
    });
  }, []);

  const sendOperation = useCallback((operation: Operation) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'operation',
          operation,
          userId: userIdRef.current,
          userName,
        })
      );
    }
  }, [userName]);

  const sendCursorPosition = useCallback((x: number, y: number) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'cursor',
          x,
          y,
          userId: userIdRef.current,
          userName,
          color: CURSOR_COLORS[userCursors.size % CURSOR_COLORS.length],
        })
      );
    }
  }, [userName, userCursors]);

  const createDocument = useCallback(async () => {
    try {
      const response = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ theme: selectedTheme, userName }),
      });
      const doc = await response.json();
      setMindMapDoc(doc);
      setHistory([{ nodes: JSON.parse(JSON.stringify(doc.nodes)) }]);
      setHistoryIndex(0);
      setShowModal(false);
      connectWebSocket(doc.id);
    } catch (e) {
      console.error('Failed to create document:', e);
    }
  }, [selectedTheme, userName, connectWebSocket]);

  const joinDocument = useCallback(async () => {
    if (!joinDocId.trim()) return;
    try {
      const response = await fetch(`/api/documents/${joinDocId.trim()}`);
      if (!response.ok) throw new Error('Document not found');
      const doc = await response.json();
      setMindMapDoc(doc);
      setHistory([{ nodes: JSON.parse(JSON.stringify(doc.nodes)) }]);
      setHistoryIndex(0);
      setShowModal(false);
      connectWebSocket(doc.id);
    } catch (e) {
      alert('未找到该文档，请检查文档ID');
      console.error('Failed to join document:', e);
    }
  }, [joinDocId, userName, connectWebSocket]);

  const handleAddNode = useCallback(
    (parentId: string | null, text: string, x: number, y: number) => {
      if (!mindMapDoc) return;

      const newNode: MindMapNode = {
        id: uuidv4(),
        text,
        x,
        y,
        parentId,
      };

      const newNodes = [...mindMapDoc.nodes, newNode];
      setMindMapDoc({ ...mindMapDoc, nodes: newNodes });
      saveToHistory(newNodes);

      sendOperation({
        type: 'add',
        nodeId: newNode.id,
        payload: { node: newNode },
        timestamp: Date.now(),
      });

      return newNode;
    },
    [mindMapDoc, saveToHistory, sendOperation]
  );

  const handleDeleteNode = useCallback(
    (nodeId: string) => {
      if (!mindMapDoc) return;

      const node = mindMapDoc.nodes.find((n) => n.id === nodeId);
      if (!node) return;

      let newNodes = mindMapDoc.nodes.filter((n) => n.id !== nodeId);

      const children = newNodes.filter((n) => n.parentId === nodeId);
      children.forEach((child) => {
        child.parentId = node.parentId;
      });

      setMindMapDoc({ ...mindMapDoc, nodes: newNodes });
      saveToHistory(newNodes);
      setSelectedNodeId(null);

      sendOperation({
        type: 'delete',
        nodeId,
        payload: { parentId: node.parentId },
        timestamp: Date.now(),
      });
    },
    [mindMapDoc, saveToHistory, sendOperation]
  );

  const handleMoveNode = useCallback(
    (nodeId: string, x: number, y: number) => {
      if (!mindMapDoc) return;

      const newNodes = mindMapDoc.nodes.map((n) =>
        n.id === nodeId ? { ...n, x, y } : n
      );
      setMindMapDoc({ ...mindMapDoc, nodes: newNodes });

      sendOperation({
        type: 'move',
        nodeId,
        payload: { x, y },
        timestamp: Date.now(),
      });
    },
    [mindMapDoc, sendOperation]
  );

  const handleEditNode = useCallback(
    (nodeId: string, text: string) => {
      if (!mindMapDoc) return;

      const newNodes = mindMapDoc.nodes.map((n) =>
        n.id === nodeId ? { ...n, text } : n
      );
      setMindMapDoc({ ...mindMapDoc, nodes: newNodes });
      saveToHistory(newNodes);

      sendOperation({
        type: 'edit',
        nodeId,
        payload: { text },
        timestamp: Date.now(),
      });
    },
    [mindMapDoc, saveToHistory, sendOperation]
  );

  const handleMoveEnd = useCallback(() => {
    if (mindMapDoc) {
      saveToHistory(mindMapDoc.nodes);
    }
  }, [mindMapDoc, saveToHistory]);

  const copyDocId = useCallback(() => {
    if (mindMapDoc) {
      navigator.clipboard.writeText(mindMapDoc.id);
      setShowCopyToast(true);
      setTimeout(() => setShowCopyToast(false), 2000);
    }
  }, [mindMapDoc]);

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  useEffect(() => {
    window.document.documentElement.style.setProperty('--theme-primary', themeConfig.primary);
    window.document.documentElement.style.setProperty('--theme-primary-light', themeConfig.primaryLight);
  }, [themeConfig]);

  return (
    <div className="app-container">
      <div className={`connection-banner ${!isConnected ? 'visible' : ''}`}>
        连接断开，正在重连...
      </div>

      {mindMapDoc && (
        <>
          <Toolbar
            onUndo={undo}
            onRedo={redo}
            onDelete={() => selectedNodeId && handleDeleteNode(selectedNodeId)}
            canUndo={canUndo}
            canRedo={canRedo}
            hasSelection={!!selectedNodeId}
            docId={mindMapDoc.id}
            onCopyDocId={copyDocId}
            theme={theme}
          />

          <MindMap
            nodes={mindMapDoc.nodes}
            selectedNodeId={selectedNodeId}
            onSelectNode={setSelectedNodeId}
            onAddNode={handleAddNode}
            onDeleteNode={handleDeleteNode}
            onMoveNode={handleMoveNode}
            onEditNode={handleEditNode}
            onMoveEnd={handleMoveEnd}
            onCursorMove={sendCursorPosition}
            userCursors={userCursors}
            theme={theme}
          />
        </>
      )}

      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h2 className="modal-title">协作思维导图</h2>

            <div className="mode-toggle">
              <button
                className={modalMode === 'create' ? 'active' : ''}
                onClick={() => setModalMode('create')}
              >
                创建新导图
              </button>
              <button
                className={modalMode === 'join' ? 'active' : ''}
                onClick={() => setModalMode('join')}
              >
                加入协作
              </button>
            </div>

            <div className="form-group">
              <label className="form-label">你的昵称</label>
              <input
                type="text"
                className="form-input"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="输入你的昵称"
              />
            </div>

            {modalMode === 'create' && (
              <div className="form-group">
                <label className="form-label">选择主题</label>
                <div className="theme-options">
                  {(Object.keys(THEMES) as ThemeType[]).map((t) => (
                    <div
                      key={t}
                      className={`theme-option ${selectedTheme === t ? 'selected' : ''}`}
                      onClick={() => setSelectedTheme(t)}
                    >
                      <div
                        className="theme-preview"
                        style={{ background: THEMES[t].primary }}
                      />
                      <div className="theme-name">{THEMES[t].name}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {modalMode === 'join' && (
              <div className="form-group">
                <label className="form-label">文档ID</label>
                <input
                  type="text"
                  className="form-input"
                  value={joinDocId}
                  onChange={(e) => setJoinDocId(e.target.value)}
                  placeholder="输入文档ID加入协作"
                />
              </div>
            )}

            <div className="modal-actions">
              {modalMode === 'create' ? (
                <button
                  className="btn btn-primary"
                  onClick={createDocument}
                  disabled={!userName.trim()}
                >
                  创建导图
                </button>
              ) : (
                <button
                  className="btn btn-primary"
                  onClick={joinDocument}
                  disabled={!userName.trim() || !joinDocId.trim()}
                >
                  加入协作
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {showCopyToast && <div className="copy-toast">文档ID已复制到剪贴板</div>}
    </div>
  );
}

export default App;
