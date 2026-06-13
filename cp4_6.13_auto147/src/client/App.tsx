import { useState, useEffect, useRef, useCallback } from 'react';
import { MindMapNode, UserInfo, NodeEventMessage } from '../shared/types';
import MindmapEditor from './MindmapEditor';
import Toolbar from './Toolbar';
import UserAvatars from './UserAvatars';
import './App.css';

const MAX_HISTORY = 30;

function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

function App() {
  const [roomCode, setRoomCode] = useState<string>('');
  const [mindmapData, setMindmapData] = useState<MindMapNode | null>(null);
  const [users, setUsers] = useState<UserInfo[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [inputText, setInputText] = useState<string>(
    '项目启动会准备事项：场地预订、设备测试、材料打印、嘉宾邀请、应急预案'
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [history, setHistory] = useState<MindMapNode[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);

  const wsRef = useRef<WebSocket | null>(null);
  const isRemoteUpdateRef = useRef(false);

  const showToastMessage = useCallback((message: string) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2000);
  }, []);

  const pushHistory = useCallback((data: MindMapNode) => {
    if (isRemoteUpdateRef.current) return;
    const newData = deepClone(data);
    setHistory((prev) => {
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push(newData);
      if (newHistory.length > MAX_HISTORY) {
        newHistory.shift();
        return newHistory;
      }
      return newHistory;
    });
    setHistoryIndex((prev) => Math.min(prev + 1, MAX_HISTORY - 1));
  }, [historyIndex]);

  const undo = useCallback(() => {
    if (historyIndex > 0 && history[historyIndex - 1]) {
      isRemoteUpdateRef.current = true;
      const prevData = deepClone(history[historyIndex - 1]);
      setMindmapData(prevData);
      setHistoryIndex((prev) => prev - 1);
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN && prevData) {
        wsRef.current.send(
          JSON.stringify({
            type: 'mindmap_full_update',
            data: { mindmapData: prevData },
          })
        );
      }
      setTimeout(() => {
        isRemoteUpdateRef.current = false;
      }, 300);
    }
  }, [history, historyIndex]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1 && history[historyIndex + 1]) {
      isRemoteUpdateRef.current = true;
      const nextData = deepClone(history[historyIndex + 1]);
      setMindmapData(nextData);
      setHistoryIndex((prev) => prev + 1);
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN && nextData) {
        wsRef.current.send(
          JSON.stringify({
            type: 'mindmap_full_update',
            data: { mindmapData: nextData },
          })
        );
      }
      setTimeout(() => {
        isRemoteUpdateRef.current = false;
      }, 300);
    }
  }, [history, historyIndex]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'z' && !e.shiftKey) {
          e.preventDefault();
          undo();
        } else if ((e.key === 'z' && e.shiftKey) || e.key === 'y') {
          e.preventDefault();
          redo();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  useEffect(() => {
    const hash = window.location.hash.replace('#', '').toUpperCase();
    if (hash && hash.length >= 4) {
      setRoomCode(hash);
    }
  }, []);

  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log('WebSocket connected');
      ws.send(
        JSON.stringify({
          type: 'join_room',
          data: { roomCode: roomCode || undefined },
        })
      );
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        handleWebSocketMessage(message);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    wsRef.current = ws;

    return () => {
      ws.close();
    };
  }, []);

  const handleWebSocketMessage = (message: { type: string; data: any }) => {
    const { type, data } = message;

    switch (type) {
      case 'room_joined':
        setRoomCode(data.roomCode);
        setCurrentUserId(data.userId);
        setUsers(data.users);
        if (data.mindmapData) {
          isRemoteUpdateRef.current = true;
          setMindmapData(data.mindmapData);
          setHistory([deepClone(data.mindmapData)]);
          setHistoryIndex(0);
          setTimeout(() => {
            isRemoteUpdateRef.current = false;
          }, 100);
        }
        if (window.location.hash.replace('#', '').toUpperCase() !== data.roomCode) {
          window.location.hash = data.roomCode;
        }
        break;

      case 'user_joined':
        setUsers(data.users);
        break;

      case 'user_left':
        setUsers(data.users);
        break;

      case 'node_event':
        handleRemoteNodeEvent(data);
        break;

      case 'mindmap_updated':
        isRemoteUpdateRef.current = true;
        setMindmapData(data.mindmapData);
        setTimeout(() => {
          isRemoteUpdateRef.current = false;
        }, 100);
        break;
    }
  };

  const handleRemoteNodeEvent = (eventData: NodeEventMessage & { fromUser: string }) => {
    if (eventData.fromUser === currentUserId) return;

    isRemoteUpdateRef.current = true;
    setMindmapData((prev) => {
      if (!prev) return prev;
      const newData = deepClone(prev);
      applyNodeEvent(newData, eventData);
      return newData;
    });

    setTimeout(() => {
      isRemoteUpdateRef.current = false;
    }, 50);
  };

  const applyNodeEvent = (root: MindMapNode, event: NodeEventMessage): boolean => {
    switch (event.type) {
      case 'drag':
        return updateNode(root, event.nodeId, { x: event.x!, y: event.y! });
      case 'text_update':
        return updateNode(root, event.nodeId, { text: event.text! });
      case 'delete':
        return deleteNode(root, event.nodeId);
      default:
        return false;
    }
  };

  const updateNode = (root: MindMapNode, nodeId: string, updates: Partial<MindMapNode>): boolean => {
    if (root.id === nodeId) {
      Object.assign(root, updates);
      return true;
    }
    for (const child of root.children) {
      if (updateNode(child, nodeId, updates)) {
        return true;
      }
    }
    return false;
  };

  const deleteNode = (root: MindMapNode, nodeId: string): boolean => {
    for (let i = 0; i < root.children.length; i++) {
      if (root.children[i].id === nodeId) {
        root.children.splice(i, 1);
        return true;
      }
      if (deleteNode(root.children[i], nodeId)) {
        return true;
      }
    }
    return false;
  };

  const handleGenerate = async () => {
    if (!inputText.trim()) {
      showToastMessage('请输入描述文字');
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: inputText }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate');
      }

      const data = (await response.json()) as MindMapNode;
      isRemoteUpdateRef.current = true;
      setMindmapData(data);
      pushHistory(data);

      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            type: 'mindmap_full_update',
            data: { mindmapData: data },
          })
        );
      }

      setTimeout(() => {
        isRemoteUpdateRef.current = false;
      }, 100);
    } catch (error) {
      console.error('Generation error:', error);
      showToastMessage('生成失败，请重试');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleNodeDrag = useCallback(
    (nodeId: string, x: number, y: number) => {
      setMindmapData((prev) => {
        if (!prev) return prev;
        const newData = deepClone(prev);
        updateNode(newData, nodeId, { x, y });
        return newData;
      });

      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            type: 'node_event',
            data: { type: 'drag', nodeId, x, y } as NodeEventMessage,
          })
        );
      }
    },
    []
  );

  const handleNodeDragEnd = useCallback(() => {
    if (mindmapData && !isRemoteUpdateRef.current) {
      pushHistory(mindmapData);
    }
  }, [mindmapData, pushHistory]);

  const handleNodeTextChange = useCallback(
    (nodeId: string, text: string) => {
      setMindmapData((prev) => {
        if (!prev) return prev;
        const newData = deepClone(prev);
        updateNode(newData, nodeId, { text });
        return newData;
      });

      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            type: 'node_event',
            data: { type: 'text_update', nodeId, text } as NodeEventMessage,
          })
        );
      }
    },
    []
  );

  const handleNodeDelete = useCallback(
    (nodeId: string) => {
      setMindmapData((prev) => {
        if (!prev) return prev;
        if (prev.id === nodeId) return prev;
        const newData = deepClone(prev);
        deleteNode(newData, nodeId);
        return newData;
      });

      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            type: 'node_event',
            data: { type: 'delete', nodeId } as NodeEventMessage,
          })
        );
      }

      if (mindmapData) {
        setTimeout(() => pushHistory(mindmapData), 0);
      }
    },
    [mindmapData, pushHistory]
  );

  const handleExport = () => {
    showToastMessage('导出中...');
  };

  const handleShare = () => {
    const url = `${window.location.origin}${window.location.pathname}#${roomCode}`;
    navigator.clipboard
      .writeText(url)
      .then(() => {
        showToastMessage('分享链接已复制到剪贴板');
      })
      .catch(() => {
        showToastMessage('复制失败，请手动复制');
      });
  };

  return (
    <div className="app">
      <Toolbar
        inputText={inputText}
        onInputChange={setInputText}
        onGenerate={handleGenerate}
        onExport={handleExport}
        onShare={handleShare}
        isGenerating={isGenerating}
        roomCode={roomCode}
      />

      <div className="main-content">
        <MindmapEditor
          data={mindmapData}
          onNodeDrag={handleNodeDrag}
          onNodeDragEnd={handleNodeDragEnd}
          onNodeTextChange={handleNodeTextChange}
          onNodeDelete={handleNodeDelete}
        />
        <UserAvatars users={users} currentUserId={currentUserId} />
      </div>

      {showToast && <div className="toast">{toastMessage}</div>}
    </div>
  );
}

export default App;
