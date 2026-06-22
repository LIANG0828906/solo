import React, { useState, useEffect, useCallback, useRef } from 'react';
import VoteCard from './VoteCard';
import PieChart from './PieChart';

interface User {
  id: string;
  nickname: string;
  lastSeen: number;
}

interface VoteOption {
  id: string;
  text: string;
  order: number;
}

interface VoteRecord {
  userId: string;
  nickname: string;
  optionId: string;
  timestamp: number;
}

interface Vote {
  id: string;
  title: string;
  description: string;
  options: VoteOption[];
  createdBy: string;
  creatorNickname: string;
  createdAt: number;
  ended: boolean;
  records: VoteRecord[];
}

type View = 'login' | 'lobby' | 'create' | 'detail';

function App() {
  const [view, setView] = useState<View>('login');
  const [nickname, setNickname] = useState('');
  const [userId] = useState(() => {
    const stored = localStorage.getItem('voteUserId');
    if (stored) return stored;
    const id = crypto.randomUUID();
    localStorage.setItem('voteUserId', id);
    return id;
  });
  const [users, setUsers] = useState<User[]>([]);
  const [votes, setVotes] = useState<Vote[]>([]);
  const [selectedVoteId, setSelectedVoteId] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const [toast, setToast] = useState({ message: '', visible: false });
  const toastTimerRef = useRef<number>(0);
  const heartbeatRef = useRef<number>(0);

  const [loginInput, setLoginInput] = useState('');

  const [formTitle, setFormTitle] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formOptions, setFormOptions] = useState(['', '']);
  const [dragIdx, setDragIdx] = useState<number | null>(null);

  const showToast = useCallback((message: string) => {
    setToast({ message, visible: true });
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => {
      setToast((p) => ({ ...p, visible: false }));
    }, 2000);
  }, []);

  const sendWs = useCallback((data: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
    }
  }, []);

  useEffect(() => {
    return () => {
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
      if (wsRef.current) wsRef.current.close();
    };
  }, []);

  const handleJoin = useCallback(() => {
    if (!loginInput.trim()) return;

    const ws = new WebSocket('ws://localhost:3001');
    wsRef.current = ws;

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: 'join', nickname: loginInput.trim(), userId }));
      heartbeatRef.current = window.setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'heartbeat' }));
        }
      }, 3000);
    };

    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data);
        switch (msg.type) {
          case 'init':
            setUsers(msg.users);
            setVotes(msg.votes);
            setNickname(loginInput.trim());
            setView('lobby');
            break;
          case 'user_joined':
            setUsers((prev) => {
              if (prev.find((u) => u.id === msg.user.id)) return prev;
              return [...prev, msg.user];
            });
            break;
          case 'user_left':
            setUsers((prev) => prev.filter((u) => u.id !== msg.userId));
            break;
          case 'vote_created':
            setVotes((prev) => [msg.vote, ...prev]);
            break;
          case 'vote_updated':
            setVotes((prev) =>
              prev.map((v) => (v.id === msg.vote.id ? msg.vote : v))
            );
            break;
          case 'vote_ended':
            setVotes((prev) =>
              prev.map((v) => (v.id === msg.voteId ? { ...v, ended: true } : v))
            );
            break;
          case 'toast':
            showToast(msg.message);
            break;
        }
      } catch (err) {
        console.error('WS parse error', err);
      }
    };

    ws.onclose = () => {
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
    };

    ws.onerror = () => {
      showToast('连接服务器失败，请确保后端已启动');
    };
  }, [loginInput, userId, showToast]);

  const handleCreateVote = useCallback(() => {
    if (!formTitle.trim()) return;
    if (formOptions.filter((o) => o.trim()).length < 2) return;

    sendWs({
      type: 'create_vote',
      title: formTitle.trim().slice(0, 50),
      description: formDesc.trim().slice(0, 200),
      options: formOptions.filter((o) => o.trim()).slice(0, 8),
    });

    setFormTitle('');
    setFormDesc('');
    setFormOptions(['', '']);
    setView('lobby');
    showToast('操作成功');
  }, [formTitle, formDesc, formOptions, sendWs, showToast]);

  const handleCastVote = useCallback(
    (voteId: string, optionId: string) => {
      sendWs({ type: 'cast_vote', voteId, optionId });
    },
    [sendWs]
  );

  const handleEndVote = useCallback(
    (voteId: string) => {
      sendWs({ type: 'end_vote', voteId });
      showToast('操作成功');
    },
    [sendWs, showToast]
  );

  const handleDragStart = useCallback((idx: number) => {
    setDragIdx(idx);
  }, []);

  const handleDragOver = useCallback(
    (e: React.DragEvent, idx: number) => {
      e.preventDefault();
      if (dragIdx === null || dragIdx === idx) return;
      setFormOptions((prev) => {
        const arr = [...prev];
        const [item] = arr.splice(dragIdx, 1);
        arr.splice(idx, 0, item);
        return arr;
      });
      setDragIdx(idx);
    },
    [dragIdx]
  );

  const handleDragEnd = useCallback(() => {
    setDragIdx(null);
  }, []);

  const selectedVote = votes.find((v) => v.id === selectedVoteId);
  const myVote = selectedVote
    ? selectedVote.records.find((r) => r.userId === userId)
    : null;

  if (view === 'login') {
    return (
      <div className="login-container">
        <div className="login-card">
          <h1>🗳️ 团队投票</h1>
          <p>输入昵称加入投票大厅</p>
          <input
            value={loginInput}
            onChange={(e) => setLoginInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
            placeholder="请输入昵称"
            maxLength={20}
            autoFocus
          />
          <button
            className="btn-primary"
            onClick={handleJoin}
            disabled={!loginInput.trim()}
          >
            进入大厅
          </button>
        </div>
        {toast.visible && <div className="toast">{toast.message}</div>}
      </div>
    );
  }

  if (view === 'create') {
    return (
      <div className="create-container">
        <div className="create-card">
          <h2>创建投票</h2>
          <div className="form-group">
            <label>标题（最多50字）</label>
            <input
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value.slice(0, 50))}
              placeholder="输入投票标题"
              maxLength={50}
            />
            <div className="char-count">{formTitle.length}/50</div>
          </div>
          <div className="form-group">
            <label>描述（最多200字）</label>
            <textarea
              value={formDesc}
              onChange={(e) => setFormDesc(e.target.value.slice(0, 200))}
              placeholder="输入投票描述（可选）"
              maxLength={200}
              rows={3}
            />
            <div className="char-count">{formDesc.length}/200</div>
          </div>
          <div className="form-group">
            <label>选项（2-8个，拖拽调整顺序）</label>
            <ul className="options-list">
              {formOptions.map((opt, idx) => (
                <li
                  key={idx}
                  className={`option-item${dragIdx === idx ? ' dragging' : ''}`}
                  draggable
                  onDragStart={() => handleDragStart(idx)}
                  onDragOver={(e) => handleDragOver(e, idx)}
                  onDragEnd={handleDragEnd}
                >
                  <span className="drag-handle">⠿</span>
                  <input
                    value={opt}
                    onChange={(e) => {
                      const arr = [...formOptions];
                      arr[idx] = e.target.value;
                      setFormOptions(arr);
                    }}
                    placeholder={`选项 ${idx + 1}`}
                  />
                  {formOptions.length > 2 && (
                    <button
                      className="remove-btn"
                      onClick={() =>
                        setFormOptions((prev) => prev.filter((_, i) => i !== idx))
                      }
                    >
                      ×
                    </button>
                  )}
                </li>
              ))}
            </ul>
            {formOptions.length < 8 && (
              <button
                className="add-option-btn"
                onClick={() => setFormOptions((prev) => [...prev, ''])}
              >
                + 添加选项
              </button>
            )}
          </div>
          <div className="form-actions">
            <button className="btn-secondary" onClick={() => setView('lobby')}>
              取消
            </button>
            <button
              className="btn-primary"
              onClick={handleCreateVote}
              disabled={
                !formTitle.trim() ||
                formOptions.filter((o) => o.trim()).length < 2
              }
            >
              创建
            </button>
          </div>
        </div>
        {toast.visible && <div className="toast">{toast.message}</div>}
      </div>
    );
  }

  if (view === 'detail' && selectedVote) {
    const sortedRecords = [...selectedVote.records].sort(
      (a, b) => b.timestamp - a.timestamp
    );

    return (
      <div className="detail-container">
        <button className="detail-back" onClick={() => setView('lobby')}>
          ← 返回大厅
        </button>
        <div className="detail-content">
          <div className="detail-header">
            <h1>
              {selectedVote.title}
              {selectedVote.ended && (
                <span
                  style={{
                    fontSize: 14,
                    color: '#888',
                    marginLeft: 12,
                    fontWeight: 400,
                  }}
                >
                  [已结束]
                </span>
              )}
            </h1>
            {selectedVote.description && (
              <div className="desc">{selectedVote.description}</div>
            )}
            <div className="meta">
              <span>{selectedVote.creatorNickname} 发起</span>
              <span>{selectedVote.records.length} 人参与</span>
              <span>{selectedVote.options.length} 个选项</span>
            </div>
          </div>

          <div className="detail-body">
            <div className="detail-chart">
              <h3>投票分布</h3>
              <PieChart vote={selectedVote} />
            </div>
            <div className="detail-voting">
              <h3>{selectedVote.ended ? '投票结果' : '选择你的选项'}</h3>
              {selectedVote.options
                .slice()
                .sort((a, b) => a.order - b.order)
                .map((opt) => {
                  const count = selectedVote.records.filter(
                    (r) => r.optionId === opt.id
                  ).length;
                  const total = selectedVote.records.length;
                  const pct =
                    total === 0 ? 0 : Math.round((count / total) * 100);
                  const isSelected = myVote?.optionId === opt.id;

                  return (
                    <div key={opt.id}>
                      <button
                        className={`vote-option-btn${
                          isSelected ? ' selected' : ''
                        }`}
                        onClick={() =>
                          !selectedVote.ended &&
                          handleCastVote(selectedVote.id, opt.id)
                        }
                        disabled={selectedVote.ended}
                      >
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                          }}
                        >
                          <span>
                            {isSelected && '✓ '}
                            {opt.text}
                          </span>
                          <span style={{ color: '#888' }}>
                            {count}票 · {pct}%
                          </span>
                        </div>
                      </button>
                    </div>
                  );
                })}
              {selectedVote.createdBy === userId && !selectedVote.ended && (
                <button
                  className="end-vote-btn"
                  onClick={() => handleEndVote(selectedVote.id)}
                >
                  结束投票
                </button>
              )}
            </div>
          </div>

          <div className="detail-history">
            <h3>投票记录</h3>
            {sortedRecords.length === 0 ? (
              <div style={{ color: '#555', fontSize: 14, padding: '16px 0' }}>
                暂无投票记录
              </div>
            ) : (
              <div className="history-list">
                {sortedRecords.map((rec, i) => {
                  const opt = selectedVote.options.find(
                    (o) => o.id === rec.optionId
                  );
                  return (
                    <div className="history-item" key={i}>
                      <div className="h-avatar">
                        {rec.nickname.charAt(0).toUpperCase()}
                      </div>
                      <span className="h-name">{rec.nickname}</span>
                      <span className="h-option">{opt?.text || '—'}</span>
                      <span className="h-time">
                        {new Date(rec.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
        {toast.visible && <div className="toast">{toast.message}</div>}
      </div>
    );
  }

  return (
    <div className="lobby-container">
      <div className="lobby-header">
        <h2>🗳️ 团队投票</h2>
        <div className="header-right">
          <span className="user-nickname-tag">{nickname}</span>
          <button
            className="btn-primary"
            onClick={() => setView('create')}
          >
            + 创建投票
          </button>
        </div>
      </div>
      <div className="sidebar">
        <h3>在线用户 ({users.length})</h3>
        {users.map((u) => (
          <div className="user-list-item" key={u.id}>
            <div className="user-avatar">
              {u.nickname.charAt(0).toUpperCase()}
            </div>
            <span className="name">{u.nickname}</span>
            <span className="online-dot" />
          </div>
        ))}
      </div>
      <div className="main-content">
        {votes.length === 0 ? (
          <div className="empty-state">
            <div className="icon">📊</div>
            <p>暂无投票，点击右上角创建第一个投票</p>
          </div>
        ) : (
          <div className="vote-grid">
            {votes.map((v) => (
              <VoteCard
                key={v.id}
                vote={v}
                userId={userId}
                onClick={() => {
                  setSelectedVoteId(v.id);
                  setView('detail');
                }}
              />
            ))}
          </div>
        )}
      </div>
      {toast.visible && <div className="toast">{toast.message}</div>}
    </div>
  );
}

export default App;
