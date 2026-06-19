import React, { useState, useEffect } from 'react';

interface PollItem {
  id: string;
  title: string;
  type: 'single' | 'multiple';
  isActive: boolean;
  totalVotes: number;
  createdAt: number;
  deadline?: number;
}

interface AdminPanelProps {
  onPollSelect: (pollId: string) => void;
  showToast: (message: string) => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ onPollSelect, showToast }) => {
  const [polls, setPolls] = useState<PollItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const fetchPolls = async () => {
    try {
      const response = await fetch('/api/admin/polls', {
        headers: {
          'x-admin-password': password,
        },
      });

      if (response.status === 403) {
        setAuthError('管理员密码错误');
        setLoading(false);
        return;
      }

      const data = await response.json();
      setPolls(data.polls || []);
      setIsAuthenticated(true);
      setAuthError(null);
    } catch (err) {
      showToast('加载失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setAuthError('请输入管理员密码');
      return;
    }
    setLoading(true);
    fetchPolls();
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchPolls();
    }
  }, [isAuthenticated]);

  const endPoll = async (pollId: string) => {
    if (!confirm('确定要结束这个投票吗？')) return;

    try {
      const response = await fetch(`/api/polls/${pollId}/end`, {
        method: 'POST',
        headers: {
          'x-admin-password': password,
        },
      });

      if (response.ok) {
        showToast('投票已结束');
        fetchPolls();
      } else {
        const data = await response.json();
        showToast(data.error || '操作失败');
      }
    } catch (err) {
      showToast('操作失败');
    }
  };

  const deletePoll = async (pollId: string) => {
    if (!confirm('确定要删除这个投票吗？此操作不可撤销。')) return;

    try {
      const response = await fetch(`/api/polls/${pollId}`, {
        method: 'DELETE',
        headers: {
          'x-admin-password': password,
        },
      });

      if (response.ok) {
        showToast('投票已删除');
        fetchPolls();
      } else {
        const data = await response.json();
        showToast(data.error || '删除失败');
      }
    } catch (err) {
      showToast('删除失败');
    }
  };

  const exportPoll = async (pollId: string, title: string) => {
    try {
      const response = await fetch(`/api/polls/${pollId}/export`, {
        headers: {
          'x-admin-password': password,
        },
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${title}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        showToast('导出成功');
      } else {
        const data = await response.json();
        showToast(data.error || '导出失败');
      }
    } catch (err) {
      showToast('导出失败');
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('zh-CN');
  };

  if (!isAuthenticated) {
    return (
      <div className="admin-panel">
        <div className="card login-card">
          <h1>管理员登录</h1>
          <p className="subtitle">请输入管理员密码以访问管理后台</p>

          {authError && <div className="error-message">{authError}</div>}

          <form onSubmit={handleLogin} className="login-form">
            <div className="form-group">
              <label htmlFor="password">管理员密码</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="请输入密码"
                autoFocus
              />
            </div>
            <button type="submit" className="btn btn-primary login-btn" disabled={loading}>
              {loading ? '登录中...' : '登录'}
            </button>
            <p className="hint">默认密码：admin123</p>
          </form>
        </div>

        <style>{`
          .login-card {
            max-width: 400px;
            margin: 0 auto;
          }

          .subtitle {
            color: #666;
            margin-bottom: 24px;
            font-size: 14px;
          }

          .login-form {
            display: flex;
            flex-direction: column;
            gap: 16px;
          }

          .form-group {
            display: flex;
            flex-direction: column;
            gap: 8px;
          }

          .login-btn {
            width: 100%;
            padding: 12px;
            font-size: 15px;
          }

          .error-message {
            background: #ffebee;
            color: #c62828;
            padding: 12px;
            border-radius: 8px;
            margin-bottom: 16px;
            font-size: 14px;
          }

          .hint {
            font-size: 12px;
            color: #999;
            text-align: center;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="admin-panel">
      <div className="admin-header card">
        <h1>投票管理</h1>
        <p className="subtitle">共 {polls.length} 个投票</p>
      </div>

      {loading ? (
        <div className="polls-list card">
          {[1, 2, 3].map((i) => (
            <div key={i} className="poll-item skeleton-item">
              <div className="skeleton skeleton-title" style={{ width: '40%', marginBottom: '8px' }}></div>
              <div className="skeleton skeleton-line" style={{ width: '60%' }}></div>
            </div>
          ))}
        </div>
      ) : polls.length === 0 ? (
        <div className="card empty-state">
          <p>暂无投票数据</p>
        </div>
      ) : (
        <div className="polls-list">
          {polls.map((poll) => (
            <div key={poll.id} className="card poll-item">
              <div className="poll-info">
                <h3 className="poll-title" onClick={() => onPollSelect(poll.id)}>
                  {poll.title}
                </h3>
                <div className="poll-meta">
                  <span className={`status ${poll.isActive ? 'active' : 'ended'}`}>
                    {poll.isActive ? '进行中' : '已结束'}
                  </span>
                  <span className="type">
                    {poll.type === 'single' ? '单选' : '多选'}
                  </span>
                  <span className="votes">{poll.totalVotes} 票</span>
                  <span className="created">创建于 {formatDate(poll.createdAt)}</span>
                </div>
              </div>
              <div className="poll-actions">
                <button
                  className="btn btn-secondary action-btn"
                  onClick={() => onPollSelect(poll.id)}
                >
                  查看
                </button>
                {poll.isActive && (
                  <button
                    className="btn btn-secondary action-btn"
                    onClick={() => endPoll(poll.id)}
                  >
                    结束
                  </button>
                )}
                <button
                  className="btn btn-secondary action-btn"
                  onClick={() => exportPoll(poll.id, poll.title)}
                >
                  导出
                </button>
                <button
                  className="btn btn-danger action-btn"
                  onClick={() => deletePoll(poll.id)}
                >
                  删除
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <style>{`
        .admin-panel .admin-header {
          margin-bottom: 20px;
        }

        .admin-header h1 {
          margin-bottom: 4px;
        }

        .subtitle {
          color: #666;
          font-size: 14px;
        }

        .polls-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .poll-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
          padding: 20px;
        }

        .skeleton-item {
          padding: 20px;
        }

        .poll-info {
          flex: 1;
          min-width: 0;
        }

        .poll-title {
          font-size: 16px;
          color: #1a237e;
          margin-bottom: 8px;
          cursor: pointer;
          word-break: break-word;
          transition: color 0.3s ease;
        }

        .poll-title:hover {
          color: #3f51b5;
        }

        .poll-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          font-size: 12px;
          color: #888;
        }

        .status {
          padding: 2px 8px;
          border-radius: 4px;
          font-weight: 500;
        }

        .status.active {
          background: #e8f5e9;
          color: #2e7d32;
        }

        .status.ended {
          background: #ffebee;
          color: #c62828;
        }

        .poll-actions {
          display: flex;
          gap: 8px;
          flex-shrink: 0;
        }

        .action-btn {
          padding: 8px 14px;
          font-size: 13px;
        }

        .empty-state {
          text-align: center;
          padding: 40px;
          color: #999;
        }

        @media (max-width: 600px) {
          .poll-item {
            flex-direction: column;
            align-items: stretch;
          }

          .poll-actions {
            justify-content: flex-start;
            flex-wrap: wrap;
          }

          .poll-meta {
            gap: 8px;
          }
        }
      `}</style>
    </div>
  );
};

export default AdminPanel;
