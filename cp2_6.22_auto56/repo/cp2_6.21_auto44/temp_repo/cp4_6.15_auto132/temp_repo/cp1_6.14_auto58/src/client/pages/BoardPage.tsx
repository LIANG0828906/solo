import React, { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import OKRBoard from '../components/OKRBoard';
import { useAuth, useTheme } from '../context/AppContext';
import { okrApi, userApi } from '../api';
import type { Objective, User } from '../types';

const BoardPage: React.FC = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [objectives, setObjectives] = useState<Objective[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [quarterFilter, setQuarterFilter] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [objRes, usersRes] = await Promise.all([
          okrApi.getAll(),
          userApi.getAll(),
        ]);
        setObjectives(objRes.objectives);
        setUsers(usersRes.users);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const quarters = useMemo(() => {
    const set = new Set(objectives.map((o) => o.quarter));
    return Array.from(set).sort();
  }, [objectives]);

  const filteredObjectives = useMemo(() => {
    if (quarterFilter === 'all') return objectives;
    return objectives.filter((o) => o.quarter === quarterFilter);
  }, [objectives, quarterFilter]);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">📋 OKR看板</h1>
          <nav style={{ display: 'flex', gap: 4 }}>
            <Link
              to="/board"
              className="btn"
              style={{
                backgroundColor: 'var(--color-primary)',
                color: '#fff',
              }}
            >
              看板
            </Link>
            <Link
              to="/timeline"
              className="btn btn-secondary"
            >
              时间轴
            </Link>
          </nav>
          {quarters.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ color: 'var(--color-text-secondary)', fontSize: 13 }}>
                季度：
              </span>
              <select
                className="select"
                value={quarterFilter}
                onChange={(e) => setQuarterFilter(e.target.value)}
              >
                <option value="all">全部季度</option>
                {quarters.map((q) => (
                  <option key={q} value={q}>
                    {q}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
        <div className="page-header-right">
          <button className="btn btn-secondary" onClick={toggleTheme}>
            {theme === 'light' ? '🌙 暗色' : '☀️ 亮色'}
          </button>
          {user?.role === 'manager' && (
            <button
              className="btn btn-primary"
              onClick={() => setShowCreateModal(true)}
            >
              + 创建OKR
            </button>
          )}
          {user && (
            <div className="user-info">
              <span className="user-avatar">{user.avatar}</span>
              <span style={{ fontWeight: 500 }}>{user.name}</span>
              <span
                style={{
                  fontSize: 11,
                  padding: '1px 6px',
                  borderRadius: 8,
                  backgroundColor:
                    user.role === 'manager'
                      ? 'var(--color-primary)'
                      : 'var(--color-text-secondary)',
                  color: '#fff',
                }}
              >
                {user.role === 'manager' ? '管理员' : '成员'}
              </span>
            </div>
          )}
          <button className="btn btn-secondary" onClick={handleLogout}>
            退出
          </button>
        </div>
      </header>

      <main className="page-content" style={{ flex: 1 }}>
        {loading ? (
          <div className="loading">加载中</div>
        ) : (
          <OKRBoard
            objectives={filteredObjectives}
            users={users}
            currentUserId={user?.id}
            userRole={user?.role}
          />
        )}
      </main>

      {showCreateModal && (
        <CreateOKRModal
          users={users}
          currentUserId={user?.id}
          onClose={() => setShowCreateModal(false)}
          onCreated={(obj) => {
            setObjectives((prev) => [obj, ...prev]);
            setShowCreateModal(false);
          }}
        />
      )}
    </div>
  );
};

interface CreateOKRModalProps {
  users: User[];
  currentUserId?: string;
  onClose: () => void;
  onCreated: (obj: Objective) => void;
}

const CreateOKRModal: React.FC<CreateOKRModalProps> = ({
  users,
  currentUserId,
  onClose,
  onCreated,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [quarter, setQuarter] = useState(() => {
    const now = new Date();
    const q = Math.floor(now.getMonth() / 3) + 1;
    return `${now.getFullYear()}Q${q}`;
  });
  const [keyResults, setKeyResults] = useState<
    { title: string; description: string; ownerId: string; deadline: string }[]
  >([
    { title: '', description: '', ownerId: currentUserId || '', deadline: '' },
    { title: '', description: '', ownerId: currentUserId || '', deadline: '' },
    { title: '', description: '', ownerId: currentUserId || '', deadline: '' },
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const updateKR = (idx: number, field: string, value: string) => {
    setKeyResults((prev) =>
      prev.map((kr, i) => (i === idx ? { ...kr, [field]: value } : kr))
    );
  };

  const addKR = () => {
    if (keyResults.length >= 5) return;
    setKeyResults((prev) => [
      ...prev,
      { title: '', description: '', ownerId: currentUserId || '', deadline: '' },
    ]);
  };

  const removeKR = (idx: number) => {
    if (keyResults.length <= 3) return;
    setKeyResults((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!title.trim()) {
      setError('请输入目标标题');
      return;
    }
    if (!quarter.trim()) {
      setError('请选择季度');
      return;
    }
    const validKRs = keyResults.filter((kr) => kr.title.trim());
    if (validKRs.length < 3 || validKRs.length > 5) {
      setError('关键结果数量必须在3-5个之间');
      return;
    }
    for (const kr of validKRs) {
      if (!kr.ownerId) {
        setError('请为所有关键结果指定负责人');
        return;
      }
      if (!kr.deadline) {
        setError('请为所有关键结果指定截止日期');
        return;
      }
    }
    setSubmitting(true);
    try {
      const { objective } = await okrApi.create({
        title: title.trim(),
        description: description.trim() || undefined,
        quarter: quarter.trim(),
        keyResults: validKRs.map((kr) => ({
          title: kr.title.trim(),
          description: kr.description.trim() || undefined,
          ownerId: kr.ownerId,
          deadline: kr.deadline,
        })),
      });
      onCreated(objective);
    } catch (err: any) {
      setError(err.response?.data?.error || '创建失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
        padding: 20,
      }}
      onClick={onClose}
    >
      <div
        className="card"
        style={{
          width: '100%',
          maxWidth: 720,
          maxHeight: '90vh',
          overflow: 'auto',
          padding: 28,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ fontSize: 20, fontWeight: 600 }}>创建新OKR</h2>
          <button onClick={onClose} style={{ fontSize: 24, color: 'var(--color-text-secondary)' }}>
            ×
          </button>
        </div>

        {error && (
          <div
            style={{
              padding: 10,
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              color: 'var(--color-danger)',
              borderRadius: 'var(--radius-md)',
              fontSize: 13,
              marginBottom: 16,
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
            <div>
              <label style={{ display: 'block', marginBottom: 6, fontWeight: 500, fontSize: 13 }}>
                目标标题 *
              </label>
              <input
                type="text"
                className="input"
                style={{ width: '100%' }}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="例如：提升产品用户体验"
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: 6, fontWeight: 500, fontSize: 13 }}>
                季度 *
              </label>
              <input
                type="text"
                className="input"
                style={{ width: '100%' }}
                value={quarter}
                onChange={(e) => setQuarter(e.target.value)}
                placeholder="例如：2024Q2"
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: 6, fontWeight: 500, fontSize: 13 }}>
              目标描述
            </label>
            <textarea
              className="input"
              style={{ width: '100%', minHeight: 60, resize: 'vertical' }}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="可选：描述该目标的背景和意义"
            />
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <label style={{ fontWeight: 600, fontSize: 14 }}>
                关键结果 ({keyResults.length}/5) *
              </label>
              {keyResults.length < 5 && (
                <button type="button" className="btn btn-secondary" style={{ padding: '4px 12px', fontSize: 12 }} onClick={addKR}>
                  + 添加
                </button>
              )}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {keyResults.map((kr, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: 12,
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--color-surface-hover)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontWeight: 600, fontSize: 13 }}>#{idx + 1}</span>
                    {keyResults.length > 3 && (
                      <button
                        type="button"
                        style={{ color: 'var(--color-danger)', fontSize: 12 }}
                        onClick={() => removeKR(idx)}
                      >
                        删除
                      </button>
                    )}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 8, marginBottom: 8 }}>
                    <div>
                      <input
                        type="text"
                        className="input"
                        style={{ width: '100%' }}
                        value={kr.title}
                        onChange={(e) => updateKR(idx, 'title', e.target.value)}
                        placeholder="关键结果标题"
                      />
                    </div>
                    <div>
                      <select
                        className="select"
                        style={{ width: '100%' }}
                        value={kr.ownerId}
                        onChange={(e) => updateKR(idx, 'ownerId', e.target.value)}
                      >
                        <option value="">选择负责人</option>
                        {users.map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.avatar} {u.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <input
                        type="date"
                        className="input"
                        style={{ width: '100%' }}
                        value={kr.deadline}
                        onChange={(e) => updateKR(idx, 'deadline', e.target.value)}
                      />
                    </div>
                  </div>
                  <input
                    type="text"
                    className="input"
                    style={{ width: '100%' }}
                    value={kr.description}
                    onChange={(e) => updateKR(idx, 'description', e.target.value)}
                    placeholder="描述（可选）"
                  />
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              取消
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting}
              style={{ opacity: submitting ? 0.6 : 1 }}
            >
              {submitting ? '创建中...' : '创建OKR'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BoardPage;
