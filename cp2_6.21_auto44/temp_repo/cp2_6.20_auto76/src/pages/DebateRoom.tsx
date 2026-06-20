import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import { Room, Message, ArgumentNode, Connection, fetchRoom, fetchMessages, fetchNodes, fetchConnections } from '../api/debateApi';
import { debateSocket } from '../socket/debateSocket';
import ViewpointChart from '../charts/ViewpointChart';

dayjs.extend(utc);

const DebateRoom: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const [room, setRoom] = useState<Room | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [nodes, setNodes] = useState<ArgumentNode[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [userSide, setUserSide] = useState<'pro' | 'con' | null>(null);
  const [userId] = useState(() => uuidv4());
  const proRef = useRef<HTMLDivElement>(null);
  const conRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!roomId) return;
    loadRoomData();
    setupSocket();
    return () => {
      debateSocket.leaveRoom(roomId);
      debateSocket.off('new_message', handleNewMessage);
      debateSocket.off('new_node', handleNewNode);
      debateSocket.off('new_connection', handleNewConnection);
      debateSocket.off('room_updated', handleRoomUpdated);
    };
  }, [roomId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadRoomData = async () => {
    if (!roomId) return;
    try {
      const [roomData, messagesData, nodesData, connectionsData] = await Promise.all([
        fetchRoom(roomId),
        fetchMessages(roomId),
        fetchNodes(roomId),
        fetchConnections(roomId),
      ]);
      setRoom(roomData);
      setMessages(messagesData);
      setNodes(nodesData);
      setConnections(connectionsData);
    } catch (e) {
      console.error('Failed to load room data', e);
    }
  };

  const setupSocket = () => {
    if (!roomId) return;
    debateSocket.connect();
    debateSocket.on('new_message', handleNewMessage);
    debateSocket.on('new_node', handleNewNode);
    debateSocket.on('new_connection', handleNewConnection);
    debateSocket.on('room_updated', handleRoomUpdated);
    debateSocket.joinRoom(roomId);
  };

  const handleNewMessage = (msg: Message) => {
    setMessages((prev) => {
      if (prev.find((m) => m.id === msg.id)) return prev;
      return [...prev, msg];
    });
  };

  const handleNewNode = (node: ArgumentNode) => {
    setNodes((prev) => {
      if (prev.find((n) => n.id === node.id)) return prev;
      return [...prev, node];
    });
  };

  const handleNewConnection = (conn: Connection) => {
    setConnections((prev) => {
      if (prev.find((c) => c.id === conn.id)) return prev;
      return [...prev, conn];
    });
  };

  const handleRoomUpdated = (updatedRoom: Room) => {
    setRoom(updatedRoom);
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      proRef.current?.scrollTo({ top: proRef.current.scrollHeight, behavior: 'smooth' });
      conRef.current?.scrollTo({ top: conRef.current.scrollHeight, behavior: 'smooth' });
    }, 50);
  };

  const handleSend = () => {
    if (!inputValue.trim() || !roomId || !userSide || room?.status === 'ended') return;
    debateSocket.sendMessage(roomId, userId, userSide, inputValue.trim());
    setInputValue('');
    setUserSide(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const extractKeywords = (msgs: Message[]) => {
    const wordCount = new Map<string, number>();
    msgs.forEach((msg) => {
      const words = msg.content.split(/[\s，。！？、；：""''（）\[\]【】.,!?;:'"()]+/).filter((w) => w.length >= 2);
      words.forEach((w) => {
        wordCount.set(w, (wordCount.get(w) || 0) + 1);
      });
    });
    return Array.from(wordCount.entries())
      .map(([word, count]) => ({ word, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);
  };

  const buildFrequencyData = (msgs: Message[]) => {
    const timeMap = new Map<string, { pro: number; con: number }>();
    msgs.forEach((msg) => {
      const time = dayjs.utc(msg.timestamp).local().format('HH:mm');
      if (!timeMap.has(time)) timeMap.set(time, { pro: 0, con: 0 });
      const entry = timeMap.get(time)!;
      if (msg.side === 'pro') entry.pro++;
      else entry.con++;
    });
    return Array.from(timeMap.entries())
      .map(([time, counts]) => ({ time, ...counts }))
      .sort((a, b) => a.time.localeCompare(b.time));
  };

  const proMessages = messages.filter((m) => m.side === 'pro');
  const conMessages = messages.filter((m) => m.side === 'con');

  const getDisplayName = (uid: string) => {
    if (uid === userId) return '我';
    return '用户' + uid.substring(0, 4);
  };

  if (!room) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#f0f2f5', color: '#1e3a5f' }}>
        加载中...
      </div>
    );
  }

  return (
    <div className="room-container" style={{ background: '#f0f2f5', minHeight: '100vh', padding: '16px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px', gap: '12px' }}>
          <button
            onClick={() => navigate('/')}
            style={{
              padding: '8px 16px',
              border: '1px solid #d9d9d9',
              background: 'white',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              color: '#595959',
              transition: 'all 0.3s',
            }}
          >
            ← 返回
          </button>
          <div style={{ flex: 1 }}>
            <h1 style={{ margin: 0, color: '#1e3a5f', fontSize: '20px', fontWeight: 700 }}>{room.name}</h1>
            <p style={{ margin: '4px 0 0 0', color: '#595959', fontSize: '14px' }}>议题：{room.topic}</p>
          </div>
          <span
            style={{
              padding: '4px 12px',
              borderRadius: '4px',
              fontSize: '13px',
              background: room.status === 'active' ? '#e6f7ff' : '#f5f5f5',
              color: room.status === 'active' ? '#1890ff' : '#8c8c8c',
            }}
          >
            {room.status === 'active' ? '进行中' : '已结束'} · {room.participants} 人参与
          </span>
        </div>

        <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', gap: '16px', height: '400px' }}>
              <div
                ref={proRef}
                style={{
                  flex: 1,
                  background: 'white',
                  borderRadius: '8px',
                  padding: '16px',
                  overflowY: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                }}
              >
                <div style={{ textAlign: 'center', fontWeight: 600, color: '#1890ff', fontSize: '16px', marginBottom: '8px' }}>
                  正方 ({proMessages.length})
                </div>
                {proMessages.map((msg) => (
                  <div
                    key={msg.id}
                    style={{
                      alignSelf: 'flex-start',
                      maxWidth: '85%',
                      animation: 'slideIn 0.4s',
                    }}
                  >
                    <div
                      style={{
                        background: '#e6f7ff',
                        padding: '10px 14px',
                        borderRadius: '8px 8px 8px 0',
                        position: 'relative',
                        wordBreak: 'break-word',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px', gap: '8px' }}>
                        <span style={{ fontSize: '12px', color: '#1890ff', fontWeight: 600 }}>正方 · {getDisplayName(msg.userId)}</span>
                        <span style={{ fontSize: '11px', color: '#8c8c8c', whiteSpace: 'nowrap' }}>
                          {dayjs.utc(msg.timestamp).local().format('HH:mm:ss')}
                        </span>
                      </div>
                      <div style={{ fontSize: '14px', color: '#262626', lineHeight: 1.6 }}>{msg.content}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div
                ref={conRef}
                style={{
                  flex: 1,
                  background: 'white',
                  borderRadius: '8px',
                  padding: '16px',
                  overflowY: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                }}
              >
                <div style={{ textAlign: 'center', fontWeight: 600, color: '#ff6b6b', fontSize: '16px', marginBottom: '8px' }}>
                  反方 ({conMessages.length})
                </div>
                {conMessages.map((msg) => (
                  <div
                    key={msg.id}
                    style={{
                      alignSelf: 'flex-end',
                      maxWidth: '85%',
                      animation: 'slideIn 0.4s',
                    }}
                  >
                    <div
                      style={{
                        background: '#fff1f0',
                        padding: '10px 14px',
                        borderRadius: '8px 8px 0 8px',
                        position: 'relative',
                        wordBreak: 'break-word',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px', gap: '8px' }}>
                        <span style={{ fontSize: '12px', color: '#ff6b6b', fontWeight: 600 }}>反方 · {getDisplayName(msg.userId)}</span>
                        <span style={{ fontSize: '11px', color: '#8c8c8c', whiteSpace: 'nowrap' }}>
                          {dayjs.utc(msg.timestamp).local().format('HH:mm:ss')}
                        </span>
                      </div>
                      <div style={{ fontSize: '14px', color: '#262626', lineHeight: 1.6 }}>{msg.content}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div
              className="input-container"
              style={{
                background: 'white',
                borderRadius: '8px',
                padding: '16px',
                display: 'flex',
                gap: '12px',
                alignItems: 'center',
                boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
              }}
            >
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => setUserSide(userSide === 'pro' ? null : 'pro')}
                  style={{
                    padding: '8px 16px',
                    border: `2px solid ${userSide === 'pro' ? '#1890ff' : '#d9d9d9'}`,
                    background: userSide === 'pro' ? '#e6f7ff' : 'white',
                    color: userSide === 'pro' ? '#1890ff' : '#8c8c8c',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: userSide === 'pro' ? 600 : 400,
                    transition: 'all 0.3s',
                  }}
                >
                  正方
                </button>
                <button
                  onClick={() => setUserSide(userSide === 'con' ? null : 'con')}
                  style={{
                    padding: '8px 16px',
                    border: `2px solid ${userSide === 'con' ? '#ff6b6b' : '#d9d9d9'}`,
                    background: userSide === 'con' ? '#fff1f0' : 'white',
                    color: userSide === 'con' ? '#ff6b6b' : '#8c8c8c',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: userSide === 'con' ? 600 : 400,
                    transition: 'all 0.3s',
                  }}
                >
                  反方
                </button>
              </div>
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="输入您的观点..."
                disabled={room.status === 'ended'}
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  border: '1px solid #d9d9d9',
                  borderRadius: '24px',
                  fontSize: '14px',
                  outline: 'none',
                  transition: 'all 0.3s',
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = '#1890ff')}
                onBlur={(e) => (e.currentTarget.style.borderColor = '#d9d9d9')}
              />
              <button
                onClick={handleSend}
                disabled={!inputValue.trim() || !userSide || room.status === 'ended'}
                style={{
                  padding: '12px 28px',
                  border: 'none',
                  background: inputValue.trim() && userSide && room.status !== 'ended' ? '#1890ff' : '#bfbfbf',
                  color: 'white',
                  borderRadius: '24px',
                  cursor: inputValue.trim() && userSide && room.status !== 'ended' ? 'pointer' : 'not-allowed',
                  fontSize: '14px',
                  fontWeight: 500,
                  opacity: inputValue.trim() && userSide && room.status !== 'ended' ? 1 : 0.45,
                  transition: 'all 0.3s',
                }}
              >
                发送
              </button>
            </div>

            <div
              style={{
                background: 'white',
                borderRadius: '8px',
                padding: '16px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
              }}
            >
              <h3 style={{ margin: '0 0 12px 0', color: '#1e3a5f', fontSize: '16px', fontWeight: 600 }}>辩论地图</h3>
              <div
                style={{
                  width: '100%',
                  height: '300px',
                  position: 'relative',
                  overflow: 'hidden',
                  background: 'linear-gradient(135deg, #f0f5ff 0%, #fff0f0 100%)',
                  borderRadius: '6px',
                }}
              >
                <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
                  <defs>
                    <marker id="arrowhead-blue" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                      <polygon points="0 0, 10 3.5, 0 7" fill="#1890ff" />
                    </marker>
                    <marker id="arrowhead-red" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                      <polygon points="0 0, 10 3.5, 0 7" fill="#ff6b6b" />
                    </marker>
                  </defs>
                  {connections.map((conn) => {
                    const fromNode = nodes.find((n) => n.id === conn.from);
                    const toNode = nodes.find((n) => n.id === conn.to);
                    if (!fromNode || !toNode) return null;
                    return (
                      <line
                        key={conn.id}
                        x1={fromNode.x}
                        y1={fromNode.y}
                        x2={toNode.x}
                        y2={toNode.y}
                        stroke={conn.type === 'support' ? '#1890ff' : '#ff6b6b'}
                        strokeWidth="2"
                        strokeOpacity="0.6"
                        markerEnd={`url(#arrowhead-${conn.type === 'support' ? 'blue' : 'red'})`}
                      />
                    );
                  })}
                </svg>
                {nodes.map((node) => {
                  const nodeSize = 30 + node.support * 5;
                  return (
                    <div
                      key={node.id}
                      className="card-hover"
                      style={{
                        position: 'absolute',
                        left: node.x - nodeSize / 2,
                        top: node.y - nodeSize / 2,
                        width: nodeSize,
                        height: nodeSize,
                        borderRadius: '50%',
                        background: node.side === 'pro' ? '#1890ff' : '#ff6b6b',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'grab',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                        transition: 'all 0.2s',
                      }}
                      title={node.content.length > 50 ? node.content.substring(0, 50) + '...' : node.content}
                    >
                      {node.support}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div
            style={{
              width: '320px',
              background: 'white',
              borderRadius: '8px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
            }}
          >
            <ViewpointChart
              proCount={proMessages.length}
              conCount={conMessages.length}
              frequencyData={buildFrequencyData(messages)}
              keywords={extractKeywords(messages)}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DebateRoom;
