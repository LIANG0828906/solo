import React, { useEffect, useState } from 'react';
import BoardView from './moduleB';
import { createTask, fetchTasks, fetchReviewers } from './moduleA';
import { initSocket } from './moduleC';
import { useBoardStore } from './store';
import { hashNameToColor } from './utils';
import type { CreateTaskPayload, Task, User, TaskStatus } from './types';
import { STATUS_COLUMNS, STATUS_TOAST_COLORS } from './types';

const App: React.FC = () => {
  const { currentUser, setCurrentUser, tasks, setTasks, toasts, removeToast, addToast } = useBoardStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ title: '', description: '', repoUrl: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const guestId = 'u-guest-' + Math.floor(Math.random() * 10000);
    setCurrentUser({
      id: guestId,
      name: '访客用户',
      avatarColor: hashNameToColor('访客用户'),
      isOnline: true,
      activeTasks: 0,
    });

    initSocket();

    Promise.all([fetchTasks(), fetchReviewers().catch(() => [])])
      .then(([fetchedTasks]) => {
        setTasks(fetchedTasks);
      })
      .catch(() => {
        setTasks(getMockTasks());
      })
      .finally(() => setLoading(false));
  }, [setCurrentUser, setTasks]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      addToast({ message: '请输入任务标题', type: 'error' });
      return;
    }
    if (!currentUser) return;
    setSubmitting(true);
    try {
      const payload: CreateTaskPayload = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        repoUrl: formData.repoUrl.trim(),
        submitterId: currentUser.id,
      };
      const newTask = await createTask(payload);
      setTasks([newTask, ...tasks]);
      setFormData({ title: '', description: '', repoUrl: '' });
      setShowModal(false);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredTasks = tasks;

  return (
    <div className="app-root">
      <aside className={`sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-inner">
          <div className="sidebar-logo">
            <span className="logo-icon">🔍</span>
            <span className="logo-text">CR Board</span>
          </div>
          <div className="sidebar-user">
            <div
              className="user-avatar"
              style={{ background: currentUser?.avatarColor || '#e94560' }}
              title={currentUser?.name}
            >
              {currentUser?.name?.charAt(0) || 'U'}
            </div>
            <div className="user-info">
              <div className="user-name">{currentUser?.name || '未登录'}</div>
              <div className="user-status">
                <span className="status-dot" /> 在线
              </div>
            </div>
          </div>
          <button
            className="btn-new-task"
            onClick={() => setShowModal(true)}
          >
            <span className="btn-icon">＋</span> 新建任务
          </button>
          <nav className="sidebar-nav">
            <div className="nav-item active">📋 看板</div>
            <div className="nav-item">📤 我的提交</div>
            <div className="nav-item">✅ 待我审查</div>
            <div className="nav-item">⚙️ 设置</div>
          </nav>
          <div className="sidebar-stats">
            <div className="stats-title">任务统计</div>
            <div className="stats-grid">
              {STATUS_COLUMNS.map((col) => (
                <div key={col.id} className="stat-item">
                  <span className="stat-label">{col.title}</span>
                  <span className="stat-value">
                    {tasks.filter((t) => t.status === col.id).length}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </aside>

      <button
        className="sidebar-toggle"
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        {sidebarOpen ? '✕' : '☰'}
      </button>

      <main className="main-area">
        <header className="main-header">
          <h1 className="page-title">代码审查看板</h1>
          <div className="header-actions">
            <button
              className="btn-refresh"
              onClick={() => {
                fetchTasks().then(setTasks).catch(() => addToast({ message: '刷新失败', type: 'error' }));
              }}
            >
              🔄 刷新
            </button>
          </div>
        </header>

        {loading ? (
          <div className="loading-wrap">
            <div className="loading-spinner" />
            <div className="loading-text">加载看板中...</div>
          </div>
        ) : (
          <BoardView tasks={filteredTasks} />
        )}
      </main>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">新建代码审查任务</h2>
            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-group">
                <label className="form-label">任务标题 *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="例如：修复用户登录Token过期问题"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  autoFocus
                />
              </div>
              <div className="form-group">
                <label className="form-label">描述（支持 Markdown）</label>
                <textarea
                  className="form-textarea"
                  rows={4}
                  placeholder="**变更内容**：`修复Token刷新逻辑`&#10;**影响范围**：Auth模块"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">代码仓库链接</label>
                <input
                  type="url"
                  className="form-input"
                  placeholder="https://github.com/user/repo/pull/123"
                  value={formData.repoUrl}
                  onChange={(e) => setFormData({ ...formData, repoUrl: e.target.value })}
                />
              </div>
              <div className="form-actions">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setShowModal(false)}
                  disabled={submitting}
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="btn-submit"
                  disabled={submitting || !formData.title.trim()}
                >
                  {submitting ? '提交中...' : '提交并分配'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="toast-container">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="toast-item"
            style={{
              background: STATUS_TOAST_COLORS[toast.type] || '#2196f3',
            }}
            onClick={() => removeToast(toast.id)}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </div>
  );
};

function getMockTasks(): Task[] {
  const now = new Date();
  const reviewers: User[] = [
    { id: 'r1', name: '张三', avatarColor: '#e91e63', isOnline: true, activeTasks: 0 },
    { id: 'r2', name: '李四', avatarColor: '#2196f3', isOnline: true, activeTasks: 1 },
    { id: 'r3', name: '王五', avatarColor: '#4caf50', isOnline: true, activeTasks: 0 },
    { id: 'r4', name: '赵六', avatarColor: '#ff9800', isOnline: true, activeTasks: 2 },
  ];
  const submitter: User = reviewers[0];
  const mk = (min: number) => new Date(now.getTime() - min * 60000).toISOString();
  const statuses: TaskStatus[] = ['pending', 'reviewing', 'approved', 'changes_needed'];
  const titles = [
    '修复用户登录Token过期问题',
    '重构API中间件，支持流式响应',
    '新增数据导出CSV功能',
    '修复商品列表分页Bug',
    '优化首页加载速度，懒加载图片',
    '添加单元测试覆盖Auth模块',
    '修复移动端输入框被键盘遮挡',
    '实现搜索关键词高亮',
    '修复WebSocket重连逻辑',
    '更新依赖版本并修复兼容性',
  ];
  return titles.map((title, i) => ({
    id: `t-mock-${i}`,
    title,
    description: i % 3 === 0 ? '**紧急**：需要 `本周` 内完成代码审查，否则影响发版。' : '',
    repoUrl: `https://github.com/org/repo/pull/${100 + i}`,
    status: statuses[i % statuses.length],
    createdAt: mk(60 + i * 17),
    updatedAt: mk(i * 3 + 1),
    submitter,
    reviewer: reviewers[i % reviewers.length],
  }));
}

export default App;
