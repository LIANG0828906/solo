import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { io, Socket } from 'socket.io-client';
import DiffPanel from '@/diff/DiffPanel';
import CommentPanel from '@/comment/CommentPanel';
import {
  DiffSegment,
  Comment,
  ReviewStatus,
  User,
  ReviewTask
} from '@/types';

interface Toast {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

interface EditingUser {
  id: string;
  userName: string;
  segmentId: string;
  timestamp: number;
}

const App: React.FC = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [currentUser, setCurrentUser] = useState<User>({ id: '', nickname: '', avatarColor: '' });
  const [segments, setSegments] = useState<DiffSegment[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [originalText, setOriginalText] = useState('');
  const [revisedText, setRevisedText] = useState('');
  const [selectedSegmentId, setSelectedSegmentId] = useState<string | null>(null);
  const [leftRatio, setLeftRatio] = useState(45);
  const [taskId, setTaskId] = useState('');
  const [loadTaskInput, setLoadTaskInput] = useState('');
  const [originalFileName, setOriginalFileName] = useState('');
  const [revisedFileName, setRevisedFileName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [tileAnimationKey, setTileAnimationKey] = useState(0);
  const [showUploadModal, setShowUploadModal] = useState(true);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [editingUsers, setEditingUsers] = useState<EditingUser[]>([]);
  const [isSmallScreen, setIsSmallScreen] = useState(false);

  const originalInputRef = useRef<HTMLTextAreaElement>(null);
  const revisedInputRef = useRef<HTMLTextAreaElement>(null);
  const originalFileRef = useRef<HTMLInputElement>(null);
  const revisedFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const checkScreen = () => setIsSmallScreen(window.innerWidth < 1200);
    checkScreen();
    window.addEventListener('resize', checkScreen);
    return () => window.removeEventListener('resize', checkScreen);
  }, []);

  useEffect(() => {
    const newSocket = io('/', {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    newSocket.on('connect', () => {
      console.log('[Socket] Connected');
    });

    newSocket.on('user_info', (data: User) => {
      setCurrentUser(data);
    });

    newSocket.on('diff_result', (data: { segments: DiffSegment[]; originalText: string; revisedText: string }) => {
      setSegments(data.segments);
      setOriginalText(data.originalText);
      setRevisedText(data.revisedText);
      setComments([]);
      setSelectedSegmentId(null);
      setIsLoading(false);
      setShowUploadModal(false);
      setTileAnimationKey(k => k + 1);
    });

    newSocket.on('status_updated', (data: { segmentId: string; status: ReviewStatus; userName: string }) => {
      setSegments(prev => prev.map(s =>
        s.id === data.segmentId ? { ...s, status: data.status } : s
      ));
    });

    newSocket.on('comment_added', (data: { comment: Comment }) => {
      setComments(prev => [...prev, data.comment]);
    });

    newSocket.on('user_editing', (data: { segmentId: string; userName: string; action?: string }) => {
      const id = `${data.userName}-${data.segmentId}`;
      setEditingUsers(prev => {
        const filtered = prev.filter(e => e.id !== id);
        return [...filtered, {
          id,
          userName: data.userName,
          segmentId: data.segmentId,
          timestamp: Date.now()
        }];
      });
      setTimeout(() => {
        setEditingUsers(prev => prev.filter(e => e.id !== id));
      }, 2000);
    });

    newSocket.on('task_saved', (data: { taskId: string }) => {
      setTaskId(data.taskId);
      addToast('success', `任务已保存！ID: ${data.taskId}`);
      setIsLoading(false);
    });

    newSocket.on('task_loaded', (data: { task: ReviewTask }) => {
      setSegments(data.task.segments);
      setComments(data.task.comments);
      setOriginalText(data.task.originalText);
      setRevisedText(data.task.revisedText);
      setTaskId(data.task.id);
      setSelectedSegmentId(null);
      setShowUploadModal(false);
      setIsLoading(false);
      setTileAnimationKey(k => k + 1);
      setTimeout(() => addToast('success', '加载完成'), 450);
    });

    newSocket.on('task_not_found', (data: { taskId: string }) => {
      addToast('error', `任务 ${data.taskId} 不存在`);
      setIsLoading(false);
    });

    newSocket.on('error', (data: { message: string }) => {
      addToast('error', data.message);
      setIsLoading(false);
    });

    newSocket.on('disconnect', () => {
      console.log('[Socket] Disconnected');
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  const addToast = useCallback((type: Toast['type'], message: string) => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 2500);
  }, []);

  const handleSelectSegment = useCallback((segmentId: string | null) => {
    setSelectedSegmentId(segmentId);
    if (socket) {
      socket.emit('segment_selected', { segmentId });
    }
  }, [socket]);

  useEffect(() => {
    if (!socket) return;

    const handleSegmentSelected = (data: { segmentId: string | null; userId: string; userName: string }) => {
      if (data.userId !== currentUser.id) {
        addToast('info', `${data.userName} 选中了一个段落`);
      }
    };

    socket.on('segment_selected', handleSegmentSelected);
    return () => {
      socket.off('segment_selected', handleSegmentSelected);
    };
  }, [socket, currentUser.id, addToast]);

  const handleUpdateStatus = useCallback((segmentId: string, status: ReviewStatus) => {
    if (!socket) return;
    setSegments(prev => prev.map(s =>
      s.id === segmentId ? { ...s, status } : s
    ));
    socket.emit('update_status', { segmentId, status, taskId: taskId || undefined });
  }, [socket, taskId]);

  const handleSubmitComment = useCallback((content: string, replyToNickname?: string) => {
    if (!socket || !selectedSegmentId) return;
    socket.emit('add_comment', {
      comment: {
        segmentId: selectedSegmentId,
        content,
        replyToNickname
      },
      taskId: taskId || undefined
    });
  }, [socket, selectedSegmentId, taskId]);

  const handleFileRead = (file: File, callback: (content: string, filename: string) => void) => {
    const ext = file.name.toLowerCase().slice(file.name.lastIndexOf('.'));
    if (ext !== '.txt' && ext !== '.md') {
      addToast('error', `${file.name}: 仅支持 .txt 和 .md 格式`);
      return;
    }
    if (file.size > 1024 * 1024) {
      addToast('error', `${file.name}: 文件大小超过 1MB 限制`);
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      callback(content, file.name);
    };
    reader.onerror = () => {
      addToast('error', `${file.name}: 读取失败`);
    };
    reader.readAsText(file);
  };

  const handleCalculateDiff = () => {
    if (!socket) return;
    const orig = originalText.trim();
    const rev = revisedText.trim();
    if (!orig || !rev) {
      addToast('error', '请填写两份文档内容');
      return;
    }
    setIsLoading(true);
    socket.emit('calculate_diff', {
      originalText: orig,
      revisedText: rev,
      originalFileName: originalFileName || undefined,
      revisedFileName: revisedFileName || undefined
    });
  };

  const handleSaveTask = () => {
    if (!socket) return;
    if (!originalText || !revisedText || segments.length === 0) {
      addToast('error', '请先完成文档校对');
      return;
    }
    let id = taskId;
    if (!id) {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
      for (let i = 0; i < 6; i++) {
        id += chars.charAt(Math.floor(Math.random() * chars.length));
      }
    }
    if (!/^[A-Za-z0-9]{6}$/.test(id)) {
      addToast('error', '任务ID必须是6位数字字母组合');
      return;
    }
    setIsLoading(true);
    socket.emit('save_task', {
      taskId: id,
      originalText,
      revisedText,
      segments,
      comments
    });
  };

  const handleLoadTask = () => {
    if (!socket) return;
    const id = loadTaskInput.trim();
    if (!/^[A-Za-z0-9]{6}$/.test(id)) {
      addToast('error', '请输入有效的6位任务ID');
      return;
    }
    setIsLoading(true);
    socket.emit('load_task', { taskId: id });
    setLoadTaskInput('');
  };

  const stats = useMemo(() => {
    const diffSegments = segments.filter(s => s.type !== 'unchanged');
    const total = diffSegments.length;
    let accepted = 0, rejected = 0, pending = 0;
    diffSegments.forEach(s => {
      if (s.status === 'accepted') accepted++;
      else if (s.status === 'rejected') rejected++;
      else if (s.status === 'pending') pending++;
    });
    return { accepted, rejected, pending, total };
  }, [segments]);

  const selectedSegment = useMemo(() =>
    segments.find(s => s.id === selectedSegmentId) || null,
    [segments, selectedSegmentId]
  );

  const segmentComments = useMemo(() =>
    comments.filter(c => c.segmentId === selectedSegmentId),
    [comments, selectedSegmentId]
  );

  const generateTaskId = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let id = '';
    for (let i = 0; i < 6; i++) {
      id += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setTaskId(id);
  };

  return (
    <div className="app-container">
      {/* Toast 提示 */}
      <div className="toast-container">
        {toasts.map(t => (
          <div key={t.id} className={`toast toast-${t.type}`}>
            <span>{t.type === 'success' ? '✓' : t.type === 'error' ? '✕' : 'ℹ'}</span>
            <span>{t.message}</span>
          </div>
        ))}
      </div>

      {/* 用户编辑提示 */}
      {editingUsers.slice(0, 1).map(e => (
        <div key={e.id} className="user-editing-toast">
          {e.userName} 正在编辑...
        </div>
      ))}

      {/* Loading */}
      {isLoading && (
        <div className="loading-overlay">
          <div className="spinner" />
        </div>
      )}

      {/* 顶部工具栏 */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '14px 24px',
        background: '#FFFFFF',
        borderRadius: 12,
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        gap: 16,
        flexWrap: 'wrap'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: 'linear-gradient(135deg, #4A90D9, #357ABD)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: 18,
            fontWeight: 700
          }}>
            D
          </div>
          <div>
            <div style={{ fontSize: 17, fontWeight: 700, color: '#1F2937' }}>DiffReview</div>
            <div style={{ fontSize: 12, color: '#6B7280' }}>文档差异实时校对平台</div>
          </div>
          {currentUser.nickname && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginLeft: 16,
              padding: '4px 12px',
              background: '#F0F4F8',
              borderRadius: 20
            }}>
              <div style={{
                width: 24,
                height: 24,
                borderRadius: '50%',
                background: currentUser.avatarColor,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontSize: 11,
                fontWeight: 600
              }}>
                {currentUser.nickname.charAt(0).toUpperCase()}
              </div>
              <span style={{ fontSize: 13, color: '#374151', fontWeight: 500 }}>{currentUser.nickname}</span>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <button
            onClick={() => setShowUploadModal(true)}
            style={{
              padding: '8px 18px',
              borderRadius: 8,
              background: '#F0F4F8',
              color: '#374151',
              fontSize: 13,
              fontWeight: 500
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#E4EAF0'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = '#F0F4F8'; }}
          >
            📂 新文档
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <input
              type="text"
              value={taskId}
              onChange={(e) => setTaskId(e.target.value.replace(/[^A-Za-z0-9]/g, '').slice(0, 6))}
              placeholder="任务ID"
              style={{
                width: 110,
                padding: '8px 12px',
                borderRadius: 8,
                fontSize: 13,
                fontFamily: '"SF Mono", Menlo, monospace',
                letterSpacing: 1
              }}
            />
            <button
              onClick={generateTaskId}
              title="生成任务ID"
              style={{
                padding: '8px 10px',
                borderRadius: 8,
                background: '#F0F4F8',
                fontSize: 14
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#E4EAF0'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = '#F0F4F8'; }}
            >
              🎲
            </button>
          </div>

          <button
            onClick={handleSaveTask}
            disabled={segments.length === 0}
            style={{
              padding: '8px 18px',
              borderRadius: 8,
              background: segments.length > 0 ? 'linear-gradient(135deg, #52C41A, #389E0D)' : '#D1D5DB',
              color: '#fff',
              fontSize: 13,
              fontWeight: 600,
              cursor: segments.length > 0 ? 'pointer' : 'not-allowed',
              boxShadow: segments.length > 0 ? '0 2px 6px rgba(82,196,26,0.3)' : 'none'
            }}
          >
            💾 保存进度
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <input
              type="text"
              value={loadTaskInput}
              onChange={(e) => setLoadTaskInput(e.target.value.replace(/[^A-Za-z0-9]/g, '').slice(0, 6))}
              placeholder="加载任务ID"
              style={{
                width: 110,
                padding: '8px 12px',
                borderRadius: 8,
                fontSize: 13,
                fontFamily: '"SF Mono", Menlo, monospace',
                letterSpacing: 1
              }}
            />
            <button
              onClick={handleLoadTask}
              disabled={!loadTaskInput.trim()}
              style={{
                padding: '8px 18px',
                borderRadius: 8,
                background: loadTaskInput.trim() ? 'linear-gradient(135deg, #4A90D9, #357ABD)' : '#D1D5DB',
                color: '#fff',
                fontSize: 13,
                fontWeight: 600,
                cursor: loadTaskInput.trim() ? 'pointer' : 'not-allowed',
                boxShadow: loadTaskInput.trim() ? '0 2px 6px rgba(74,144,217,0.3)' : 'none'
              }}
            >
              加载
            </button>
          </div>
        </div>
      </div>

      {/* 上传弹窗 */}
      {showUploadModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.45)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            width: 'min(780px, 92vw)',
            maxHeight: '86vh',
            overflowY: 'auto',
            background: '#fff',
            borderRadius: 16,
            boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
            padding: 28,
            animation: 'tile-slide 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <div>
                <h2 style={{ fontSize: 22, fontWeight: 700, color: '#1F2937', marginBottom: 4 }}>📝 上传校对文档</h2>
                <p style={{ fontSize: 13, color: '#6B7280' }}>支持 .txt 和 .md 格式，单文件最大 1MB</p>
              </div>
              <button
                onClick={() => setShowUploadModal(false)}
                style={{
                  width: 36, height: 36,
                  borderRadius: 10,
                  background: '#F3F4F6',
                  fontSize: 20,
                  color: '#6B7280',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}
              >×</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              <div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 8
                }}>
                  <label style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>原版文档</label>
                  <button
                    onClick={() => originalFileRef.current?.click()}
                    style={{
                      fontSize: 12,
                      color: '#4A90D9',
                      padding: '4px 10px',
                      borderRadius: 6,
                      border: '1px dashed #4A90D9',
                      fontWeight: 500
                    }}
                  >
                    选择文件
                  </button>
                  <input
                    ref={originalFileRef}
                    type="file"
                    accept=".txt,.md"
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handleFileRead(file, (content, filename) => {
                          setOriginalText(content);
                          setOriginalFileName(filename);
                        });
                      }
                    }}
                  />
                </div>
                {originalFileName && (
                  <div style={{
                    fontSize: 12,
                    color: '#4A90D9',
                    padding: '6px 10px',
                    background: 'rgba(74,144,217,0.08)',
                    borderRadius: 6,
                    marginBottom: 6
                  }}>
                    📄 {originalFileName}
                  </div>
                )}
                <textarea
                  ref={originalInputRef}
                  value={originalText}
                  onChange={(e) => { setOriginalText(e.target.value); setOriginalFileName(''); }}
                  placeholder="粘贴原版内容，或点击上方选择文件..."
                  rows={14}
                  style={{
                    width: '100%',
                    padding: 12,
                    borderRadius: 10,
                    border: '1px solid #E5E7EB',
                    resize: 'vertical',
                    fontFamily: '"SF Mono", Menlo, monospace',
                    fontSize: 13,
                    lineHeight: 1.6,
                    minHeight: 200,
                    background: '#FAFBFD'
                  }}
                />
              </div>

              <div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 8
                }}>
                  <label style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>修订文档</label>
                  <button
                    onClick={() => revisedFileRef.current?.click()}
                    style={{
                      fontSize: 12,
                      color: '#4A90D9',
                      padding: '4px 10px',
                      borderRadius: 6,
                      border: '1px dashed #4A90D9',
                      fontWeight: 500
                    }}
                  >
                    选择文件
                  </button>
                  <input
                    ref={revisedFileRef}
                    type="file"
                    accept=".txt,.md"
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handleFileRead(file, (content, filename) => {
                          setRevisedText(content);
                          setRevisedFileName(filename);
                        });
                      }
                    }}
                  />
                </div>
                {revisedFileName && (
                  <div style={{
                    fontSize: 12,
                    color: '#4A90D9',
                    padding: '6px 10px',
                    background: 'rgba(74,144,217,0.08)',
                    borderRadius: 6,
                    marginBottom: 6
                  }}>
                    📄 {revisedFileName}
                  </div>
                )}
                <textarea
                  ref={revisedInputRef}
                  value={revisedText}
                  onChange={(e) => { setRevisedText(e.target.value); setRevisedFileName(''); }}
                  placeholder="粘贴修订内容，或点击上方选择文件..."
                  rows={14}
                  style={{
                    width: '100%',
                    padding: 12,
                    borderRadius: 10,
                    border: '1px solid #E5E7EB',
                    resize: 'vertical',
                    fontFamily: '"SF Mono", Menlo, monospace',
                    fontSize: 13,
                    lineHeight: 1.6,
                    minHeight: 200,
                    background: '#FAFBFD'
                  }}
                />
              </div>
            </div>

            <div style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 10,
              marginTop: 24,
              paddingTop: 20,
              borderTop: '1px solid #F0F0F5'
            }}>
              <button
                onClick={() => {
                  setOriginalText(''); setRevisedText('');
                  setOriginalFileName(''); setRevisedFileName('');
                }}
                style={{
                  padding: '10px 22px',
                  borderRadius: 8,
                  background: '#F3F4F6',
                  color: '#374151',
                  fontSize: 14,
                  fontWeight: 500
                }}
              >
                清空
              </button>
              <button
                onClick={handleCalculateDiff}
                disabled={!originalText.trim() || !revisedText.trim()}
                style={{
                  padding: '10px 28px',
                  borderRadius: 8,
                  background: (!originalText.trim() || !revisedText.trim())
                    ? '#D1D5DB'
                    : 'linear-gradient(135deg, #4A90D9, #357ABD)',
                  color: '#fff',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: (!originalText.trim() || !revisedText.trim()) ? 'not-allowed' : 'pointer',
                  boxShadow: (!originalText.trim() || !revisedText.trim())
                    ? 'none'
                    : '0 4px 12px rgba(74,144,217,0.35)'
                }}
              >
                开始对比分析 →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 主内容区 */}
      <div
        key={tileAnimationKey}
        className={`main-content ${tileAnimationKey > 0 ? 'tile-slide-animation' : ''}`}
        style={{
          flex: 1,
          display: 'flex',
          gap: 0,
          overflow: 'hidden',
          minHeight: 0
        }}
      >
        <DiffPanel
          segments={segments}
          selectedSegmentId={selectedSegmentId}
          onSelectSegment={handleSelectSegment}
          onUpdateStatus={handleUpdateStatus}
          leftRatio={leftRatio}
          onLeftRatioChange={setLeftRatio}
          isSmallScreen={isSmallScreen}
        />

        {!isSmallScreen && (
          <CommentPanel
            segment={selectedSegment}
            comments={segmentComments}
            currentUser={currentUser}
            onSubmitComment={handleSubmitComment}
            isSmallScreen={isSmallScreen}
            stats={stats}
          />
        )}
      </div>

      {/* 小屏幕底部浮层评论面板 */}
      {isSmallScreen && (
        <CommentPanel
          segment={selectedSegment}
          comments={segmentComments}
          currentUser={currentUser}
          onSubmitComment={handleSubmitComment}
          isSmallScreen={isSmallScreen}
          stats={stats}
        />
      )}
    </div>
  );
};

export default App;
