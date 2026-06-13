import React, { useState, useEffect, useRef, useCallback } from 'react';
import Editor from './Editor';
import { AudioEngine } from './AudioEngine';
import {
  AudioNodeData,
  ConnectionData,
  NodeParams,
  UserData,
  RoomState,
  WSMessage,
  NodeType,
  NODE_COLORS,
  NODE_LABELS,
} from './types';

const NODE_TYPES: NodeType[] = ['oscillator', 'player', 'gain', 'reverb', 'delay', 'output'];

export default function App() {
  const [nodes, setNodes] = useState<AudioNodeData[]>([]);
  const [connections, setConnections] = useState<ConnectionData[]>([]);
  const [users, setUsers] = useState<UserData[]>([]);
  const [roomCode, setRoomCode] = useState('');
  const [userName, setUserName] = useState('');
  const [joined, setJoined] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [bpm, setBpm] = useState(120);
  const [activeNodeIds, setActiveNodeIds] = useState<string[]>([]);
  const [wsConnected, setWsConnected] = useState(false);

  const [nicknameInput, setNicknameInput] = useState('');
  const [roomCodeInput, setRoomCodeInput] = useState('');
  const [showRoomCodeInput, setShowRoomCodeInput] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectDelayRef = useRef(1000);
  const heartbeatTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pongTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const audioEngineRef = useRef(new AudioEngine());
  const pulseCounterRef = useRef(0);

  const sendWs = useCallback((msg: WSMessage) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(msg));
    }
  }, []);

  const clearHeartbeat = useCallback(() => {
    if (heartbeatTimerRef.current) {
      clearInterval(heartbeatTimerRef.current);
      heartbeatTimerRef.current = null;
    }
    if (pongTimeoutRef.current) {
      clearTimeout(pongTimeoutRef.current);
      pongTimeoutRef.current = null;
    }
  }, []);

  const startHeartbeat = useCallback(() => {
    clearHeartbeat();
    heartbeatTimerRef.current = setInterval(() => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'ping' }));
        pongTimeoutRef.current = setTimeout(() => {
          if (wsRef.current) {
            wsRef.current.close();
          }
        }, 5000);
      }
    }, 30000);
  }, [clearHeartbeat]);

  const connectWs = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setWsConnected(true);
      reconnectDelayRef.current = 1000;
      startHeartbeat();
    };

    ws.onclose = () => {
      setWsConnected(false);
      clearHeartbeat();
      const delay = reconnectDelayRef.current;
      reconnectTimerRef.current = setTimeout(() => {
        reconnectDelayRef.current = Math.min(reconnectDelayRef.current * 2, 8000);
        connectWs();
      }, delay);
    };

    ws.onerror = () => {
      ws.close();
    };

    ws.onmessage = (event) => {
      let data: any;
      try {
        data = JSON.parse(event.data);
      } catch {
        return;
      }

      if (data.type === 'pong') {
        if (pongTimeoutRef.current) {
          clearTimeout(pongTimeoutRef.current);
          pongTimeoutRef.current = null;
        }
        return;
      }

      switch (data.type) {
        case 'joined': {
          const state: RoomState = data.state;
          setRoomCode(data.roomCode);
          setUsers(data.users);
          setNodes(state.nodes);
          setConnections(state.connections);
          setJoined(true);
          break;
        }
        case 'user_joined': {
          setUsers((prev) => [...prev, data.user]);
          break;
        }
        case 'user_left': {
          setUsers((prev) => prev.filter((u) => u.id !== data.userId));
          break;
        }
        case 'add_node': {
          setNodes((prev) => [...prev, data.node]);
          break;
        }
        case 'move_node': {
          setNodes((prev) =>
            prev.map((n) =>
              n.id === data.nodeId ? { ...n, x: data.x, y: data.y } : n
            )
          );
          break;
        }
        case 'update_params': {
          setNodes((prev) =>
            prev.map((n) =>
              n.id === data.nodeId
                ? { ...n, params: data.params, lastEditor: data.editorName }
                : n
            )
          );
          break;
        }
        case 'add_connection': {
          setConnections((prev) => [...prev, data.connection]);
          break;
        }
        case 'remove_node': {
          setNodes((prev) => prev.filter((n) => n.id !== data.nodeId));
          setConnections((prev) =>
            prev.filter(
              (c) => c.fromNodeId !== data.nodeId && c.toNodeId !== data.nodeId
            )
          );
          break;
        }
        case 'remove_connection': {
          setConnections((prev) =>
            prev.filter((c) => c.id !== data.connectionId)
          );
          break;
        }
        case 'room_full': {
          alert('房间已满');
          break;
        }
        case 'error': {
          alert(data.message);
          break;
        }
      }
    };
  }, [startHeartbeat, clearHeartbeat]);

  useEffect(() => {
    connectWs();
    return () => {
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
      }
      clearHeartbeat();
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connectWs, clearHeartbeat]);

  useEffect(() => {
    audioEngineRef.current.setBPM(bpm);
  }, [bpm]);

  useEffect(() => {
    audioEngineRef.current.setOnPulseCallback(() => {
      pulseCounterRef.current += 1;
      setActiveNodeIds([...audioEngineRef.current.getActiveNodeIds()]);
    });
  }, []);

  const handleJoin = useCallback(
    (action: 'create' | 'join') => {
      const name = nicknameInput.trim();
      if (!name) return;
      setUserName(name);
      if (action === 'create') {
        const code = String(Math.floor(100000 + Math.random() * 900000));
        sendWs({ type: 'join', roomCode: code, userName: name });
      } else {
        const code = roomCodeInput.trim();
        if (!code || code.length !== 6) return;
        sendWs({ type: 'join', roomCode: code, userName: name });
      }
    },
    [nicknameInput, roomCodeInput, sendWs]
  );

  const handleAddNode = useCallback(
    (node: AudioNodeData) => {
      setNodes((prev) => [...prev, node]);
      sendWs({ type: 'add_node', node });
    },
    [sendWs]
  );

  const handleMoveNode = useCallback(
    (nodeId: string, x: number, y: number) => {
      setNodes((prev) =>
        prev.map((n) => (n.id === nodeId ? { ...n, x, y } : n))
      );
      sendWs({ type: 'move_node', nodeId, x, y });
    },
    [sendWs]
  );

  const handleUpdateParams = useCallback(
    (nodeId: string, params: NodeParams) => {
      setNodes((prev) =>
        prev.map((n) =>
          n.id === nodeId
            ? { ...n, params, lastEditor: userName }
            : n
        )
      );
      sendWs({ type: 'update_params', nodeId, params, editorName: userName });
    },
    [sendWs, userName]
  );

  const handleAddConnection = useCallback(
    (connection: ConnectionData) => {
      setConnections((prev) => [...prev, connection]);
      sendWs({ type: 'add_connection', connection });
    },
    [sendWs]
  );

  const handleRemoveNode = useCallback(
    (nodeId: string) => {
      setNodes((prev) => prev.filter((n) => n.id !== nodeId));
      setConnections((prev) =>
        prev.filter(
          (c) => c.fromNodeId !== nodeId && c.toNodeId !== nodeId
        )
      );
      sendWs({ type: 'remove_node', nodeId });
    },
    [sendWs]
  );

  const handleRemoveConnection = useCallback(
    (connectionId: string) => {
      setConnections((prev) =>
        prev.filter((c) => c.id !== connectionId)
      );
      sendWs({ type: 'remove_connection', connectionId });
    },
    [sendWs]
  );

  const handlePlayStop = useCallback(() => {
    if (isPlaying) {
      audioEngineRef.current.stop();
      setIsPlaying(false);
      setActiveNodeIds([]);
    } else {
      audioEngineRef.current.play(nodes, connections);
      setIsPlaying(true);
    }
  }, [isPlaying, nodes, connections]);

  const handleSave = useCallback(async () => {
    try {
      await fetch('/api/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomCode, nodes, connections }),
      });
    } catch {}
  }, [roomCode, nodes, connections]);

  const handleLoad = useCallback(async () => {
    try {
      const res = await fetch(`/api/load/${roomCode}`);
      const data = await res.json();
      if (data.nodes) setNodes(data.nodes);
      if (data.connections) setConnections(data.connections);
    } catch {}
  }, [roomCode]);

  const handleToolboxDragStart = useCallback(
    (e: React.DragEvent, nodeType: NodeType) => {
      e.dataTransfer.setData('nodeType', nodeType);
    },
    []
  );

  if (!joined) {
    return (
      <div className="app-container">
        <div className="join-screen">
          <h1>音乐协作白板</h1>
          <input
            type="text"
            placeholder="输入昵称"
            value={nicknameInput}
            onChange={(e) => setNicknameInput(e.target.value)}
            maxLength={20}
          />
          {!showRoomCodeInput ? (
            <div className="room-buttons">
              <button onClick={() => handleJoin('create')}>创建房间</button>
              <button onClick={() => setShowRoomCodeInput(true)}>加入房间</button>
            </div>
          ) : (
            <>
              <input
                type="text"
                placeholder="输入6位房间号"
                value={roomCodeInput}
                onChange={(e) => setRoomCodeInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
                maxLength={6}
              />
              <div className="room-buttons">
                <button onClick={() => handleJoin('join')}>加入房间</button>
                <button onClick={() => setShowRoomCodeInput(false)}>返回</button>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <div className="editor-container">
        <div className="toolbox">
          {NODE_TYPES.map((nt) => (
            <div
              key={nt}
              className="toolbox-item"
              title="toolbox-item"
              draggable
              onDragStart={(e) => handleToolboxDragStart(e, nt)}
              style={{ background: NODE_COLORS[nt] }}
            >
              {NODE_LABELS[nt]}
            </div>
          ))}
        </div>

        <div className="canvas-container">
          <Editor
            nodes={nodes}
            connections={connections}
            onAddNode={handleAddNode}
            onMoveNode={handleMoveNode}
            onUpdateParams={handleUpdateParams}
            onAddConnection={handleAddConnection}
            onRemoveNode={handleRemoveNode}
            onRemoveConnection={handleRemoveConnection}
            userName={userName}
            isPlaying={isPlaying}
            activeNodeIds={activeNodeIds}
            bpm={bpm}
          />
        </div>

        <div className="room-info">
          <span className="room-code">{roomCode}</span>
          <span className="room-users">{users.length} 在线</span>
          <div
            className="connection-status"
            style={{ background: wsConnected ? '#1A936F' : '#D81159' }}
          />
        </div>

        <div className="save-load-buttons">
          <button onClick={handleSave}>保存</button>
          <button onClick={handleLoad}>加载</button>
        </div>

        <div className="playback-controls">
          <button
            className={`play-button${isPlaying ? ' playing' : ''}`}
            onClick={handlePlayStop}
          >
            {isPlaying ? '■' : '▶'}
          </button>
          <div className="bpm-control">
            <span className="bpm-label">BPM</span>
            <input
              type="range"
              min={60}
              max={180}
              value={bpm}
              onChange={(e) => setBpm(Number(e.target.value))}
              className="bpm-slider"
            />
            <span className="bpm-value">{bpm}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
