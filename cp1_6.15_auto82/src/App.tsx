import React, { useState, useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import Toolbar from './components/Toolbar';
import Canvas from './components/Canvas';
import { ToolType, Shape, User, Operation } from './types';

const USER_COLORS = [
  '#E53935', '#D81B60', '#8E24AA', '#5E35B1',
  '#3949AB', '#1E88E5', '#039BE5', '#00ACC1',
  '#00897B', '#43A047', '#7CB342', '#C0CA33',
  '#FDD835', '#FFB300', '#FB8C00', '#F4511E',
];

const NICKNAMES = [
  '小明', '小红', '小刚', '小丽', '小华', '小军', '小芳', '小燕',
  '阿杰', '阿强', '阿梅', '阿珍', '大熊', '小熊', '云朵', '星星',
];

interface ServerToClientEvents {
  room_state: (state: { shapes: Shape[]; users: Record<string, User> }) => void;
  user_joined: (user: User) => void;
  user_left: (userId: string) => void;
  operation: (operation: Operation) => void;
  undo_performed: (operation: Operation) => void;
}

interface ClientToServerEvents {
  join_room: (data: { roomId: string; user: User }) => void;
  leave_room: (data: { roomId: string; userId: string }) => void;
  operation: (data: { roomId: string; operation: Operation }) => void;
  request_undo: (data: { roomId: string; userId: string }) => void;
}

const generateUserId = () => `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
const generateRoomId = () => `room-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

const generateRandomUser = (): User => {
  const id = generateUserId();
  const color = USER_COLORS[Math.floor(Math.random() * USER_COLORS.length)];
  const nickname = NICKNAMES[Math.floor(Math.random() * NICKNAMES.length)];
  const avatarInitials = nickname.slice(0, 1);
  return { id, color, nickname, avatarInitials };
};

const App: React.FC = () => {
  const [socket, setSocket] = useState<Socket<ServerToClientEvents, ClientToServerEvents> | null>(null);
  const [currentTool, setCurrentTool] = useState<ToolType>('pen');
  const [penColor, setPenColor] = useState('#000000');
  const [penThickness, setPenThickness] = useState(4);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<Map<string, User>>(new Map());
  const [shapes, setShapes] = useState<Shape[]>([]);
  const [history, setHistory] = useState<Operation[]>([]);
  const [scale, setScale] = useState(1);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [scaleAnimating, setScaleAnimating] = useState(false);
  const [userCountAnimating, setUserCountAnimating] = useState(false);
  const [roomId, setRoomId] = useState<string>('');
  const [shareLink, setShareLink] = useState('');
  const [showRoomModal, setShowRoomModal] = useState(true);
  const [undoAnimatingIds, setUndoAnimatingIds] = useState<Set<string>>(new Set());
  const historyRef = useRef<Operation[]>([]);
  const scaleAnimRef = useRef<number | null>(null);

  useEffect(() => {
    historyRef.current = history;
  }, [history]);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const existingRoomId = urlParams.get('room');
    if (existingRoomId) {
      setRoomId(existingRoomId);
    }
  }, []);

  useEffect(() => {
    const newSocket = io({
      withCredentials: true,
      transports: ['websocket', 'polling'],
    });

    newSocket.on('connect', () => {
      console.log('Connected to server');
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  const joinRoom = useCallback((rid: string, user: User) => {
    if (!socket) return;
    
    socket.emit('join_room', { roomId: rid, user });
    
    socket.once('room_state', (state) => {
      const usersMap = new Map<string, User>();
      Object.entries(state.users).forEach(([id, u]) => {
        usersMap.set(id, u);
      });
      setUsers(usersMap);
      setShapes(state.shapes);
      setHistory([]);
    });

    socket.on('user_joined', (user) => {
      setUsers(prev => {
        const next = new Map(prev);
        next.set(user.id, user);
        return next;
      });
      setUserCountAnimating(true);
      setTimeout(() => setUserCountAnimating(false), 200);
    });

    socket.on('user_left', (userId) => {
      setUsers(prev => {
        const next = new Map(prev);
        next.delete(userId);
        return next;
      });
      setUserCountAnimating(true);
      setTimeout(() => setUserCountAnimating(false), 200);
    });

    socket.on('operation', (operation) => {
      if (operation.type === 'add') {
        setShapes(prev => {
          const exists = prev.find(s => s.id === operation.shape.id);
          if (exists) return prev.map(s => s.id === operation.shape.id ? operation.shape : s);
          return [...prev, operation.shape];
        });
      } else if (operation.type === 'update') {
        setShapes(prev => prev.map(s => s.id === operation.shape.id ? operation.shape : s));
      } else if (operation.type === 'delete') {
        setUndoAnimatingIds(prev => {
          const next = new Set(prev);
          next.add(operation.shapeId);
          return next;
        });
        setTimeout(() => {
          setShapes(prev => prev.filter(s => s.id !== operation.shapeId));
          setUndoAnimatingIds(prev => {
            const next = new Set(prev);
            next.delete(operation.shapeId);
            return next;
          });
        }, 200);
      }
    });

    socket.on('undo_performed', (operation) => {
      if (operation.type === 'delete') {
        setUndoAnimatingIds(prev => {
          const next = new Set(prev);
          next.add(operation.shapeId);
          return next;
        });
        setTimeout(() => {
          setShapes(prev => prev.filter(s => s.id !== operation.shapeId));
          setUndoAnimatingIds(prev => {
            const next = new Set(prev);
            next.delete(operation.shapeId);
            return next;
          });
        }, 200);
      } else if (operation.type === 'add') {
        setShapes(prev => {
          const exists = prev.find(s => s.id === operation.shape.id);
          if (exists) return prev;
          return [...prev, operation.shape];
        });
      } else if (operation.type === 'update') {
        setShapes(prev => prev.map(s => s.id === operation.shape.id ? operation.shape : s));
      }
    });
  }, [socket]);

  const broadcastOperation = useCallback((operation: Operation) => {
    if (!socket || !roomId) return;
    socket.emit('operation', { roomId, operation });
  }, [socket, roomId]);

  const shapesMapRef = useRef<Map<string, Shape>>(new Map());

  useEffect(() => {
    const map = new Map<string, Shape>();
    for (const shape of shapes) {
      map.set(shape.id, shape);
    }
    shapesMapRef.current = map;
  }, [shapes]);

  const pushToHistory = useCallback((operation: Operation) => {
    setHistory(prev => {
      const newHistory = [...prev, operation];
      if (newHistory.length > 10) {
        return newHistory.slice(-10);
      }
      return newHistory;
    });
  }, []);

  const handleShapeAdd = useCallback((shape: Shape) => {
    const operation: Operation = { type: 'add', shape };
    setShapes(prev => [...prev, shape]);
    pushToHistory(operation);
    broadcastOperation(operation);
  }, [pushToHistory, broadcastOperation]);

  const handleShapeUpdate = useCallback((shape: Shape) => {
    const prevShape = shapesMapRef.current.get(shape.id);
    if (!prevShape) return;
    
    const operation: Operation = { type: 'update', shape, prevShape };
    setShapes(prev => prev.map(s => s.id === shape.id ? shape : s));
    pushToHistory(operation);
    broadcastOperation(operation);
  }, [pushToHistory, broadcastOperation]);

  const handleShapeDelete = useCallback((shapeId: string, shape: Shape) => {
    const operation: Operation = { type: 'delete', shapeId, shape };
    
    setUndoAnimatingIds(prev => {
      const next = new Set(prev);
      next.add(shapeId);
      return next;
    });
    
    setTimeout(() => {
      setShapes(prev => prev.filter(s => s.id !== shapeId));
      setUndoAnimatingIds(prev => {
        const next = new Set(prev);
        next.delete(shapeId);
        return next;
      });
    }, 200);
    
    pushToHistory(operation);
    broadcastOperation(operation);
  }, [pushToHistory, broadcastOperation]);

  const executeUndoLocal = useCallback((operation: Operation) => {
    if (operation.type === 'add') {
      setUndoAnimatingIds(prev => {
        const next = new Set(prev);
        next.add(operation.shape.id);
        return next;
      });
      
      setTimeout(() => {
        setShapes(prev => prev.filter(s => s.id !== operation.shape.id));
        setUndoAnimatingIds(prev => {
          const next = new Set(prev);
          next.delete(operation.shape.id);
          return next;
        });
      }, 200);
    } else if (operation.type === 'delete') {
      setShapes(prev => [...prev, operation.shape]);
    } else if (operation.type === 'update') {
      setShapes(prev => prev.map(s => 
        s.id === operation.prevShape.id ? operation.prevShape : s
      ));
    }
  }, []);

  const handleUndo = useCallback(() => {
    if (historyRef.current.length === 0 || !socket || !roomId || !currentUser) return;

    const lastOp = historyRef.current[historyRef.current.length - 1];
    
    setHistory(prev => prev.slice(0, -1));

    executeUndoLocal(lastOp);

    socket.emit('request_undo', { roomId, userId: currentUser.id });
  }, [socket, roomId, currentUser, executeUndoLocal]);

  const handleScaleChange = useCallback((newScale: number, newOffsetX: number, newOffsetY: number) => {
    if (scaleAnimRef.current) {
      cancelAnimationFrame(scaleAnimRef.current);
    }

    const startScale = scale;
    const startOffsetX = offsetX;
    const startOffsetY = offsetY;
    const duration = 250;
    const startTime = performance.now();

    setScaleAnimating(true);

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeProgress = 1 - Math.pow(1 - progress, 3);

      const tScale = startScale + (newScale - startScale) * easeProgress;
      const tOffsetX = startOffsetX + (newOffsetX - startOffsetX) * easeProgress;
      const tOffsetY = startOffsetY + (newOffsetY - startOffsetY) * easeProgress;

      setScale(tScale);
      setOffsetX(tOffsetX);
      setOffsetY(tOffsetY);

      if (progress < 1) {
        scaleAnimRef.current = requestAnimationFrame(animate);
      } else {
        setScaleAnimating(false);
        scaleAnimRef.current = null;
      }
    };

    scaleAnimRef.current = requestAnimationFrame(animate);
  }, [scale, offsetX, offsetY]);

  const handleOffsetChange = useCallback((newOffsetX: number, newOffsetY: number) => {
    setOffsetX(newOffsetX);
    setOffsetY(newOffsetY);
  }, []);

  const createRoom = useCallback(() => {
    const user = generateRandomUser();
    const newRoomId = generateRoomId();
    setRoomId(newRoomId);
    setCurrentUser(user);
    setShareLink(`${window.location.origin}${window.location.pathname}?room=${newRoomId}`);
    setShowRoomModal(false);
    window.history.replaceState({}, '', `?room=${newRoomId}`);
    
    setTimeout(() => {
      joinRoom(newRoomId, user);
    }, 100);
  }, [joinRoom]);

  const joinExistingRoom = useCallback(() => {
    const user = generateRandomUser();
    setCurrentUser(user);
    setShareLink(`${window.location.origin}${window.location.pathname}?room=${roomId}`);
    setShowRoomModal(false);
    
    setTimeout(() => {
      joinRoom(roomId, user);
    }, 100);
  }, [roomId, joinRoom]);

  const copyShareLink = useCallback(() => {
    navigator.clipboard.writeText(shareLink).then(() => {
      alert('分享链接已复制到剪贴板！');
    });
  }, [shareLink]);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      {showRoomModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            padding: '40px',
            maxWidth: '420px',
            width: '90%',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          }}>
            <h1 style={{
              fontSize: '28px',
              fontWeight: 700,
              marginBottom: '8px',
              color: '#1a1a1a',
              textAlign: 'center',
            }}>
              协同白板
            </h1>
            <p style={{
              color: '#666',
              textAlign: 'center',
              marginBottom: '32px',
              fontSize: '14px',
            }}>
              让远程团队像在实体白板前一样自由协作
            </p>
            
            <button
              onClick={createRoom}
              style={{
                width: '100%',
                padding: '14px 24px',
                borderRadius: '10px',
                border: 'none',
                backgroundColor: '#2C2C2C',
                color: 'white',
                fontSize: '16px',
                fontWeight: 600,
                cursor: 'pointer',
                marginBottom: '16px',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#444'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#2C2C2C'}
            >
              创建新房间
            </button>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              margin: '20px 0',
            }}>
              <div style={{ flex: 1, height: '1px', backgroundColor: '#e0e0e0' }} />
              <span style={{ color: '#999', fontSize: '12px' }}>或者</span>
              <div style={{ flex: 1, height: '1px', backgroundColor: '#e0e0e0' }} />
            </div>

            {roomId && (
              <button
                onClick={joinExistingRoom}
                style={{
                  width: '100%',
                  padding: '14px 24px',
                  borderRadius: '10px',
                  border: '2px solid #2C2C2C',
                  backgroundColor: 'white',
                  color: '#2C2C2C',
                  fontSize: '16px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f5f5f5';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'white';
                }}
              >
                  加入房间 {roomId}
                </button>
            )}

            {!roomId && (
              <div style={{
                fontSize: '13px',
                color: '#999',
                textAlign: 'center',
                padding: '12px',
                backgroundColor: '#f5f5f5',
                borderRadius: '8px',
              }}>
                提示：分享房间链接可直接加入
              </div>
            )}
          </div>
        </div>
      )}

      {!showRoomModal && currentUser && (
        <>
          <Toolbar
            currentTool={currentTool}
            onToolChange={setCurrentTool}
            penColor={penColor}
            onPenColorChange={setPenColor}
            penThickness={penThickness}
            onPenThicknessChange={setPenThickness}
            onUndo={handleUndo}
            canUndo={history.length > 0}
          />

          <Canvas
            tool={currentTool}
            penColor={penColor}
            penThickness={penThickness}
            currentUser={currentUser}
            shapes={shapes}
            onShapeAdd={handleShapeAdd}
            onShapeUpdate={handleShapeUpdate}
            onShapeDelete={handleShapeDelete}
            scale={scale}
            offsetX={offsetX}
            offsetY={offsetY}
            onScaleChange={handleScaleChange}
            onOffsetChange={handleOffsetChange}
            undoAnimatingIds={undoAnimatingIds}
          />

          <div style={{
            position: 'absolute',
            right: '20px',
            top: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            zIndex: 100,
          }}>
            <button
              onClick={copyShareLink}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: 'rgba(44, 44, 44, 0.9)',
                color: 'white',
                fontSize: '13px',
                fontWeight: 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'background-color 0.15s ease',
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#444'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(44, 44, 44, 0.9)'}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
              </svg>
              分享链接
            </button>

            <div style={{
              padding: '8px 12px',
              borderRadius: '8px',
              backgroundColor: 'rgba(44, 44, 44, 0.9)',
              color: 'white',
              fontSize: '13px',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}>
              <div style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: currentUser.color,
              }} />
              {currentUser.nickname}
            </div>
          </div>

          <div style={{
            position: 'absolute',
            right: '20px',
            bottom: '20px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            gap: '8px',
            zIndex: 100,
          }}>
            <div style={{
              padding: '6px 12px',
              borderRadius: '8px',
              backgroundColor: 'rgba(44, 44, 44, 0.9)',
              color: 'white',
              fontSize: '13px',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'transform 0.25s ease',
              transform: scaleAnimating ? 'scale(1.05)' : 'scale(1)',
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
              {Math.round(scale * 100)}%
            </div>

            <div
              className={userCountAnimating ? 'badge-bounce' : ''}
              style={{
                padding: '6px 12px',
                borderRadius: '8px',
                backgroundColor: 'rgba(44, 44, 44, 0.9)',
                color: 'white',
                fontSize: '13px',
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              {users.size} 人在线
            </div>
          </div>

          <div style={{
            position: 'absolute',
            bottom: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            padding: '6px 16px',
            borderRadius: '20px',
            backgroundColor: 'rgba(44, 44, 44, 0.8)',
            color: 'rgba(255,255,255,0.8)',
            fontSize: '12px',
            zIndex: 100,
            pointerEvents: 'none',
          }}>
            按住空格键拖动平移 · 滚轮缩放
          </div>
        </>
      )}
    </div>
  );
};

export default App;
