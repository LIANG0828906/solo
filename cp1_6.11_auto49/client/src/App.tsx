import { useState, useEffect, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import Board from './components/Board';
import VoteList from './components/VoteList';
import { Download, Users, Clock, Trophy } from 'lucide-react';
import type { Idea, User, TimerState, VoteType } from '../../shared/types';

let socket: Socket | null = null;

function App() {
  const [nickname, setNickname] = useState('');
  const [nicknameInput, setNicknameInput] = useState('');
  const [nicknameError, setNicknameError] = useState('');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [timer, setTimer] = useState<TimerState>({
    duration: 30 * 60,
    remaining: 30 * 60,
    isRunning: false,
    isLocked: false,
    startedBy: null,
  });
  const [showJoinModal, setShowJoinModal] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);
  const [newIdeaContent, setNewIdeaContent] = useState('');
  const [newIdeaError, setNewIdeaError] = useState('');
  const [timerMinutes, setTimerMinutes] = useState(30);
  const [animatingVotes, setAnimatingVotes] = useState<Set<string>>(new Set());

  const ideasRef = useRef<Idea[]>([]);
  ideasRef.current = ideas;

  useEffect(() => {
    socket = io({
      transports: ['websocket', 'polling'],
    });

    socket.on('state-sync', (state: { ideas: Idea[]; users: User[]; timer: TimerState }) => {
      setIdeas(state.ideas);
      setUsers(state.users);
      setTimer(state.timer);
    });

    socket.on('user-joined-self', ({ user }: { user: User }) => {
      setCurrentUser(user);
    });

    socket.on('user-joined', ({ users: newUsers }: { user: User; users: User[] }) => {
      setUsers(newUsers);
    });

    socket.on('user-left', ({ users: newUsers }: { userId: string; users: User[] }) => {
      setUsers(newUsers);
    });

    socket.on('idea-created', (idea: Idea) => {
      setIdeas((prev) => {
        if (prev.find((i) => i.id === idea.id)) return prev;
        return [...prev, idea];
      });
    });

    socket.on('idea-deleted', ({ ideaId }: { ideaId: string }) => {
      setIdeas((prev) => prev.filter((i) => i.id !== ideaId));
    });

    socket.on(
      'vote-updated',
      ({
        ideaId,
        upvotes,
        downvotes,
        votes,
      }: {
        ideaId: string;
        upvotes: number;
        downvotes: number;
        votes: Record<string, VoteType>;
      }) => {
        setIdeas((prev) =>
          prev.map((idea) =>
            idea.id === ideaId ? { ...idea, upvotes, downvotes, votes } : idea
          )
        );
      }
    );

    socket.on(
      'idea-dragged',
      ({ ideaId, position }: { ideaId: string; position: { x: number; y: number } }) => {
        setIdeas((prev) =>
          prev.map((idea) => (idea.id === ideaId ? { ...idea, position } : idea))
        );
      }
    );

    socket.on('timer-updated', (timerState: TimerState) => {
      setTimer(timerState);
    });

    socket.on('room-locked', () => {
      setShowResultModal(true);
    });

    socket.on('error', (err: { message: string }) => {
      console.error('Socket error:', err.message);
    });

    return () => {
      if (socket) socket.disconnect();
    };
  }, []);

  const handleJoin = useCallback(() => {
    const trimmed = nicknameInput.trim();
    if (trimmed.length < 2 || trimmed.length > 10) {
      setNicknameError('昵称长度需在2-10字符之间');
      return;
    }
    setNicknameError('');
    setNickname(trimmed);
    setShowJoinModal(false);
    socket?.emit('join-room', { nickname: trimmed });
  }, [nicknameInput]);

  const handleCreateIdea = useCallback(() => {
    const trimmed = newIdeaContent.trim();
    if (trimmed.length < 10 || trimmed.length > 200) {
      setNewIdeaError('内容长度需在10-200字之间');
      return;
    }
    setNewIdeaError('');
    socket?.emit('create-idea', {
      content: trimmed,
      position: { x: 100 + Math.random() * 300, y: 100 + Math.random() * 200 },
    });
    setNewIdeaContent('');
    setShowCreateModal(false);
  }, [newIdeaContent]);

  const handleVote = useCallback(
    (ideaId: string, voteType: VoteType) => {
      const animKey = `${ideaId}-${voteType}`;
      setAnimatingVotes((prev) => new Set(prev).add(animKey));
      setTimeout(() => {
        setAnimatingVotes((prev) => {
          const next = new Set(prev);
          next.delete(animKey);
          return next;
        });
      }, 200);
      socket?.emit('vote', { ideaId, voteType });
    },
    []
  );

  const handleDeleteIdea = useCallback((ideaId: string) => {
    socket?.emit('delete-idea', { ideaId });
  }, []);

  const handleDragUpdate = useCallback(
    (ideaId: string, position: { x: number; y: number }) => {
      socket?.emit('drag-idea', { ideaId, position });
    },
    []
  );

  const handleStartTimer = useCallback(() => {
    socket?.emit('start-timer', { duration: timerMinutes * 60 });
  }, [timerMinutes]);

  const handleStopTimer = useCallback(() => {
    socket?.emit('stop-timer');
  }, []);

  const handleResetTimer = useCallback(() => {
    socket?.emit('reset-timer');
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const getSortedIdeas = useCallback(() => {
    return [...ideasRef.current].sort((a, b) => {
      const scoreA = a.upvotes - a.downvotes;
      const scoreB = b.upvotes - b.downvotes;
      return scoreB - scoreA;
    });
  }, []);

  const handleExport = useCallback(() => {
    const sorted = getSortedIdeas();
    const result = {
      exportedAt: new Date().toISOString(),
      totalIdeas: sorted.length,
      rankings: sorted.map((idea, idx) => ({
        rank: idx + 1,
        content: idea.content,
        author: idea.author,
        createdAt: idea.createdAt,
        upvotes: idea.upvotes,
        downvotes: idea.downvotes,
        score: idea.upvotes - idea.downvotes,
      })),
    };
    const blob = new Blob([JSON.stringify(result, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `brainstorm-result-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [getSortedIdeas]);

  const isFirstUser = currentUser?.isFirst ?? false;

  return (
    <div className="app-container">
      <nav className="top-nav">
        <div className="room-title">💡 头脑风暴房间</div>
        <div className="online-badge">
          <span className="online-dot" />
          <Users size={16} />
          <span>在线 {users.length} 人</span>
        </div>
      </nav>

      <div className="main-content">
        <Board
          ideas={ideas}
          currentUser={currentUser}
          isLocked={timer.isLocked}
          onVote={handleVote}
          onDelete={handleDeleteIdea}
          onDragUpdate={handleDragUpdate}
          onAddClick={() => !timer.isLocked && setShowCreateModal(true)}
          animatingVotes={animatingVotes}
          formatTime={formatTime}
        />
        <VoteList ideas={ideas} />
      </div>

      <div className="timer-widget">
        <div className={`timer-display ${timer.remaining <= 60 ? 'warning' : ''}`}>
          <Clock size={20} style={{ verticalAlign: 'middle', marginRight: 6 }} />
          {formatTime(timer.remaining)}
        </div>
        {timer.isLocked ? (
          <div className="timer-locked">白板已锁定</div>
        ) : isFirstUser ? (
          <>
            {!timer.isRunning && (
              <input
                type="number"
                className="timer-input"
                value={timerMinutes}
                onChange={(e) =>
                  setTimerMinutes(Math.max(1, Math.min(120, Number(e.target.value) || 30)))
                }
                min={1}
                max={120}
                disabled={timer.isRunning}
              />
            )}
            <div className="timer-controls">
              {!timer.isRunning ? (
                <button className="btn-success" onClick={handleStartTimer}>
                  开始
                </button>
              ) : (
                <button className="btn-secondary" onClick={handleStopTimer}>
                  暂停
                </button>
              )}
              <button className="btn-secondary" onClick={handleResetTimer}>
                重置
              </button>
            </div>
          </>
        ) : timer.isRunning ? (
          <div style={{ textAlign: 'center', fontSize: 12, color: '#6b7280' }}>
            倒计时进行中
          </div>
        ) : (
          <div style={{ textAlign: 'center', fontSize: 12, color: '#6b7280' }}>
            等待主持人启动
          </div>
        )}
      </div>

      {showJoinModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2 className="modal-title">加入头脑风暴</h2>
            <p className="modal-subtitle">请输入你的昵称以加入房间</p>
            <div className="form-group">
              <label className="form-label">昵称</label>
              <input
                type="text"
                className={`form-input ${nicknameError ? 'error' : ''}`}
                value={nicknameInput}
                onChange={(e) => setNicknameInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
                placeholder="请输入2-10个字符"
                autoFocus
              />
              <div className={`form-hint ${nicknameError ? 'error' : ''}`}>
                {nicknameError || `${nicknameInput.length}/10`}
              </div>
            </div>
            <button className="btn-primary" onClick={handleJoin}>
              加入房间
            </button>
          </div>
        </div>
      )}

      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">发布新想法</h2>
            <p className="modal-subtitle">分享你的创意，让团队一起投票</p>
            <div className="form-group">
              <label className="form-label">想法内容</label>
              <textarea
                className={`form-input form-textarea ${newIdeaError ? 'error' : ''}`}
                value={newIdeaContent}
                onChange={(e) => setNewIdeaContent(e.target.value)}
                placeholder="请输入10-200字描述你的想法..."
                autoFocus
              />
              <div className={`form-hint ${newIdeaError ? 'error' : ''}`}>
                {newIdeaError || `${newIdeaContent.length}/200`}
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setShowCreateModal(false)}>
                取消
              </button>
              <button className="btn-primary" onClick={handleCreateIdea}>
                发布
              </button>
            </div>
          </div>
        </div>
      )}

      {showResultModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: 600 }}>
            <h2 className="modal-title">
              <Trophy size={24} style={{ verticalAlign: 'middle', marginRight: 8 }} />
              最终投票结果
            </h2>
            <p className="modal-subtitle">头脑风暴已结束，以下是最终排名</p>
            <div className="result-list">
              {getSortedIdeas().length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon">📝</div>
                  <div className="empty-state-text">暂无想法</div>
                </div>
              ) : (
                getSortedIdeas().map((idea, idx) => (
                  <div key={idea.id} className="result-item">
                    <div
                      className={`rank-badge ${
                        idx === 0 ? 'gold' : idx === 1 ? 'silver' : idx === 2 ? 'bronze' : ''
                      }`}
                    >
                      {idx + 1}
                    </div>
                    <div className="result-item-content">
                      <div className="result-item-text">{idea.content}</div>
                      <div className="result-item-meta">
                        {idea.author} · {idea.createdAt} · 👍{idea.upvotes} 👎
                        {idea.downvotes}
                      </div>
                    </div>
                    <div
                      className={`vote-score ${
                        idea.upvotes - idea.downvotes > 0
                          ? 'positive'
                          : idea.upvotes - idea.downvotes < 0
                          ? 'negative'
                          : ''
                      }`}
                    >
                      {idea.upvotes - idea.downvotes > 0 ? '+' : ''}
                      {idea.upvotes - idea.downvotes}
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setShowResultModal(false)}>
                关闭
              </button>
              <button className="btn-primary" onClick={handleExport}>
                <Download size={16} style={{ verticalAlign: 'middle', marginRight: 6 }} />
                导出结果
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
