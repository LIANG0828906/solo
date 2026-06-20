import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Socket } from 'socket.io-client';
import useDrawingStore, { DrawAction, SessionInfo } from '@/store/drawingStore';

interface SidePanelProps {
  socketRef: React.MutableRefObject<Socket | null>;
  isOpen: boolean;
  onClose: () => void;
}

const SidePanel: React.FC<SidePanelProps> = ({ socketRef, isOpen, onClose }) => {
  const {
    sessions,
    setSessions,
    setCurrentSession,
    currentSessionId,
    startPlayback,
    stopPlayback,
    isPlaying,
    setActions,
  } = useDrawingStore();

  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newSessionName, setNewSessionName] = useState('');

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return '刚刚';
    if (diffMins < 60) return `${diffMins}分钟前`;
    if (diffHours < 24) return `${diffHours}小时前`;
    if (diffDays < 7) return `${diffDays}天前`;

    return date.toLocaleDateString('zh-CN', {
      month: 'short',
      day: 'numeric',
    });
  };

  const formatDuration = (actions: DrawAction[]) => {
    if (actions.length === 0) return '0秒';
    const start = actions[0].startTime;
    const end = actions[actions.length - 1].endTime;
    const totalMs = end - start;
    const totalSec = Math.floor(totalMs / 1000);
    if (totalSec < 60) return `${totalSec}秒`;
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins}分${secs}秒`;
  };

  const handleSwitchSession = async (session: SessionInfo) => {
    if (loadingId) return;

    try {
      setLoadingId(session.id);
      stopPlayback();

      const response = await axios.get<{ id: string; name: string; actions: DrawAction[] }>(
        `/api/sessions/${session.id}`
      );

      setCurrentSession(response.data.id, response.data.name);
      setActions(response.data.actions);
      socketRef.current?.emit('join-session', session.id);
    } catch (e) {
      console.error('切换会话失败:', e);
    } finally {
      setLoadingId(null);
    }
  };

  const handlePlayback = async (session: SessionInfo, e: React.MouseEvent) => {
    e.stopPropagation();
    if (loadingId) return;

    try {
      setLoadingId(session.id);

      const response = await axios.get<{ id: string; name: string; actions: DrawAction[] }>(
        `/api/sessions/${session.id}`
      );

      const sortedActions = [...response.data.actions].sort(
        (a, b) => a.startTime - b.startTime
      );

      startPlayback(sortedActions);
    } catch (e) {
      console.error('加载回放数据失败:', e);
    } finally {
      setLoadingId(null);
    }
  };

  const handleCreateSession = () => {
    const name = newSessionName.trim() || `画布 ${new Date().toLocaleString('zh-CN')}`;
    socketRef.current?.emit('create-session', name);
    setNewSessionName('');
    setShowCreateModal(false);
  };

  useEffect(() => {
    axios
      .get<SessionInfo[]>('/api/sessions')
      .then((res) => setSessions(res.data))
      .catch((e) => console.error('加载会话列表失败:', e));
  }, [setSessions]);

  const panelContent = (
    <div
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: '#2c2c2c',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          padding: '20px 16px 16px',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 16,
          }}
        >
          <h2
            style={{
              margin: 0,
              fontSize: 18,
              fontWeight: 600,
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <i className="fa-solid fa-clock-rotate-left" style={{ color: '#2196F6' }} />
            历史画布
          </h2>
          <button
            onClick={() => setShowCreateModal(true)}
            style={{
              width: 32,
              height: 32,
              borderRadius: 6,
              border: 'none',
              backgroundColor: '#2196F6',
              color: 'white',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 14,
              transition: 'all 0.1s ease-out',
            }}
            onMouseDown={(e) => {
              e.currentTarget.style.transform = 'scale(0.92)';
            }}
            onMouseUp={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
            }}
            title="新建画布"
          >
            <i className="fa-solid fa-plus" />
          </button>
        </div>

        <div
          style={{
            fontSize: 12,
            color: '#888',
          }}
        >
          共 {sessions.length} 个画布 · 点击切换 · ▶ 回放
        </div>
      </div>

      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: 12,
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}
      >
        {sessions.length === 0 && (
          <div
            style={{
              textAlign: 'center',
              padding: '40px 20px',
              color: '#666',
              fontSize: 13,
            }}
          >
            <i className="fa-solid fa-file-circle-plus" style={{ fontSize: 36, marginBottom: 12, color: '#444' }} />
            <div>暂无画布</div>
            <div style={{ marginTop: 4, fontSize: 11 }}>点击右上角按钮创建</div>
          </div>
        )}

        {sessions.map((session) => {
          const isActive = session.id === currentSessionId;
          const isLoading = loadingId === session.id;

          return (
            <div
              key={session.id}
              onClick={() => !isLoading && handleSwitchSession(session)}
              style={{
                position: 'relative',
                backgroundColor: isActive ? 'rgba(33, 150, 246, 0.15)' : 'rgba(255,255,255,0.04)',
                border: isActive ? '1px solid rgba(33, 150, 246, 0.4)' : '1px solid rgba(255,255,255,0.06)',
                borderRadius: 8,
                padding: '14px 14px 12px',
                cursor: isLoading ? 'progress' : 'pointer',
                transition: 'all 0.1s ease-out',
                userSelect: 'none',
              }}
              onMouseDown={(e) => {
                if (!isLoading) {
                  e.currentTarget.style.transform = 'scale(0.97)';
                }
              }}
              onMouseUp={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
              }}
              onMouseEnter={(e) => {
                if (!isLoading && !isActive) {
                  e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)';
                }
              }}
            >
              {isLoading && (
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(44, 44, 44, 0.7)',
                    borderRadius: 8,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 10,
                  }}
                >
                  <i className="fa-solid fa-spinner fa-spin" style={{ color: '#2196F6' }} />
                </div>
              )}

              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  gap: 8,
                  marginBottom: 8,
                }}
              >
                <div
                  style={{
                    flex: 1,
                    minWidth: 0,
                    fontWeight: 500,
                    fontSize: 14,
                    color: isActive ? '#fff' : '#ddd',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                  title={session.name}
                >
                  {isActive && (
                    <span style={{ color: '#2196F6', marginRight: 6 }}>
                      <i className="fa-solid fa-circle" style={{ fontSize: 8 }} />
                    </span>
                  )}
                  {session.name}
                </div>

                <button
                  onClick={(e) => handlePlayback(session, e)}
                  disabled={session.actionCount === 0 || isLoading}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 6,
                    border: 'none',
                    backgroundColor:
                      session.actionCount === 0 || isLoading
                        ? 'rgba(255,255,255,0.05)'
                        : 'rgba(255, 87, 34, 0.2)',
                    color: session.actionCount === 0 || isLoading ? '#555' : '#FF5722',
                    cursor: session.actionCount === 0 || isLoading ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 12,
                    flexShrink: 0,
                    transition: 'all 0.1s ease',
                  }}
                  onMouseEnter={(e) => {
                    if (session.actionCount > 0 && !isLoading) {
                      e.currentTarget.style.backgroundColor = 'rgba(255, 87, 34, 0.4)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (session.actionCount > 0 && !isLoading) {
                      e.currentTarget.style.backgroundColor = 'rgba(255, 87, 34, 0.2)';
                    }
                  }}
                  title={session.actionCount === 0 ? '暂无内容' : '回放此画布'}
                >
                  <i className="fa-solid fa-play" />
                </button>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  fontSize: 11,
                  color: '#888',
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <i className="fa-regular fa-clock" style={{ fontSize: 10 }} />
                  {formatDate(session.createdAt)}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <i className="fa-solid fa-pen-nib" style={{ fontSize: 10 }} />
                  {session.actionCount} 笔
                </span>
              </div>

              {session.actionCount > 0 && (
                <div
                  style={{
                    marginTop: 10,
                    height: 24,
                    backgroundColor: 'rgba(255,255,255,0.03)',
                    borderRadius: 4,
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '0 6px',
                    gap: 2,
                  }}
                >
                  {Array.from({ length: Math.min(session.actionCount, 40) }).map((_, i) => {
                    const ratio = session.actionCount > 40 ? 40 / session.actionCount : 1;
                    const fill = i < Math.min(session.actionCount, 40);
                    return (
                      <div
                        key={i}
                        style={{
                          flex: 1,
                          height: fill ? 8 + Math.random() * 12 : 4,
                          backgroundColor: fill
                            ? i % 3 === 0
                              ? '#FF5722'
                              : i % 3 === 1
                              ? '#2196F6'
                              : '#4CAF50'
                            : 'rgba(255,255,255,0.1)',
                          borderRadius: 2,
                          opacity: fill ? 0.6 + Math.random() * 0.4 : 0.3,
                        }}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {isPlaying && (
        <div
          style={{
            padding: 12,
            borderTop: '1px solid rgba(255,255,255,0.08)',
            backgroundColor: 'rgba(33, 150, 246, 0.1)',
          }}
        >
          <button
            onClick={() => stopPlayback()}
            style={{
              width: '100%',
              padding: '10px 16px',
              borderRadius: 6,
              border: 'none',
              backgroundColor: '#FF5722',
              color: 'white',
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              transition: 'all 0.1s ease',
            }}
            onMouseDown={(e) => {
              e.currentTarget.style.transform = 'scale(0.97)';
            }}
            onMouseUp={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            <i className="fa-solid fa-stop" />
            停止回放
          </button>
        </div>
      )}

      {showCreateModal && (
        <>
          <div
            onClick={() => setShowCreateModal(false)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.5)',
              zIndex: 1000,
            }}
          />
          <div
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              backgroundColor: '#333',
              borderRadius: 10,
              padding: 24,
              zIndex: 1001,
              minWidth: 300,
              boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            }}
          >
            <h3
              style={{
                margin: '0 0 16px',
                color: 'white',
                fontSize: 16,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <i className="fa-solid fa-file-circle-plus" style={{ color: '#2196F6' }} />
              新建画布
            </h3>
            <input
              type="text"
              value={newSessionName}
              onChange={(e) => setNewSessionName(e.target.value)}
              placeholder="输入画布名称（可选）"
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 6,
                border: '1px solid rgba(255,255,255,0.15)',
                backgroundColor: '#222',
                color: 'white',
                fontSize: 14,
                outline: 'none',
                marginBottom: 16,
                boxSizing: 'border-box',
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreateSession();
              }}
              autoFocus
            />
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowCreateModal(false)}
                style={{
                  padding: '8px 16px',
                  borderRadius: 6,
                  border: '1px solid rgba(255,255,255,0.15)',
                  backgroundColor: 'transparent',
                  color: '#ccc',
                  cursor: 'pointer',
                  fontSize: 13,
                }}
              >
                取消
              </button>
              <button
                onClick={handleCreateSession}
                style={{
                  padding: '8px 16px',
                  borderRadius: 6,
                  border: 'none',
                  backgroundColor: '#2196F6',
                  color: 'white',
                  cursor: 'pointer',
                  fontSize: 13,
                  fontWeight: 500,
                }}
              >
                创建
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );

  return (
    <>
      <div
        style={{
          display: window.innerWidth >= 768 ? 'block' : 'none',
          width: 300,
          flexShrink: 0,
          height: '100vh',
          overflow: 'hidden',
        }}
      >
        {panelContent}
      </div>

      {isOpen && (
        <div
          style={{
            position: 'fixed',
            left: 0,
            right: 0,
            bottom: 0,
            height: '70vh',
            zIndex: 200,
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            overflow: 'hidden',
            boxShadow: '0 -8px 32px rgba(0,0,0,0.4)',
            animation: 'slideUp 0.25s ease-out',
          }}
        >
          <div
            style={{
              width: '100%',
              height: '100%',
              position: 'relative',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: 8,
                left: '50%',
                transform: 'translateX(-50%)',
                width: 40,
                height: 4,
                borderRadius: 2,
                backgroundColor: 'rgba(255,255,255,0.3)',
                zIndex: 10,
              }}
            />
            <button
              onClick={onClose}
              style={{
                position: 'absolute',
                top: 12,
                right: 12,
                width: 32,
                height: 32,
                borderRadius: '50%',
                border: 'none',
                backgroundColor: 'rgba(255,255,255,0.1)',
                color: '#ccc',
                cursor: 'pointer',
                zIndex: 10,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <i className="fa-solid fa-chevron-down" />
            </button>
            <div style={{ height: '100%', paddingTop: 0 }}>
              {panelContent}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SidePanel;
