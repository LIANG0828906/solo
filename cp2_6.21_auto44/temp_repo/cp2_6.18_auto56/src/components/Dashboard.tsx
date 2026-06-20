import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAppStore } from '../store';
import { PROJECT_TYPES, CreateProjectInput, ProjectType, FilterStatus, SortType } from '../types';
import ProjectCard from './ProjectCard';
import ProjectDetail from './ProjectDetail';

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

function todayPlus(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

const Dashboard: React.FC = () => {
  const {
    projects,
    filteredProjects,
    stats,
    selectedProjectId,
    createProject,
    setSearchQuery,
    setFilterStatus,
    setSortType,
    selectProject,
    searchQuery,
    filterStatus,
    sortType,
  } = useAppStore();

  const [mobileNav, setMobileNav] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [searchInput, setSearchInput] = useState(searchQuery);

  const [form, setForm] = useState<CreateProjectInput & { errors: Partial<Record<keyof CreateProjectInput, string>> }>({
    name: '',
    clientEmail: '',
    budget: 3000,
    deadline: todayPlus(14),
    projectType: '角色设计',
    errors: {},
  });

  const debouncedQuery = useDebounce(searchInput, 300);
  const firstRun = useRef(true);
  useEffect(() => {
    if (firstRun.current) { firstRun.current = false; return; }
    setSearchQuery(debouncedQuery);
  }, [debouncedQuery, setSearchQuery]);

  const selectedProject = selectedProjectId ? projects.find((p) => p.id === selectedProjectId) ?? null : null;

  const openCreate = useCallback(() => {
    setForm({
      name: '',
      clientEmail: '',
      budget: 3000,
      deadline: todayPlus(14),
      projectType: '角色设计',
      errors: {},
    });
    setShowModal(true);
  }, []);

  const validate = (): boolean => {
    const errors: Partial<Record<keyof CreateProjectInput, string>> = {};
    if (!form.name.trim()) errors.name = '请填写项目名称';
    else if (form.name.length > 30) errors.name = '项目名称最多 30 字';
    if (!form.clientEmail.trim()) errors.clientEmail = '请填写客户邮箱';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.clientEmail)) errors.clientEmail = '邮箱格式不正确';
    if (form.budget < 500 || form.budget > 50000) errors.budget = '预算必须在 500~50000 元之间';
    if (!form.deadline) errors.deadline = '请选择截止日期';
    setForm({ ...form, errors });
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    createProject({
      name: form.name.trim(),
      clientEmail: form.clientEmail.trim(),
      budget: form.budget,
      deadline: form.deadline,
      projectType: form.projectType,
    });
    setShowModal(false);
  };

  return (
    <div className="app">
      <aside className={`sidebar ${mobileNav ? 'open' : ''}`}>
        <div className="sidebar-logo">ArtFlow</div>
        <nav className="sidebar-nav">
          <div className="nav-item active" onClick={() => setMobileNav(false)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect width="7" height="9" x="3" y="3" rx="1" />
              <rect width="7" height="5" x="14" y="3" rx="1" />
              <rect width="7" height="9" x="14" y="12" rx="1" />
              <rect width="7" height="5" x="3" y="16" rx="1" />
            </svg>
            项目列表
          </div>
          <div className="nav-item">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
            设置
          </div>
        </nav>
      </aside>

      {mobileNav && <div className="overlay visible" onClick={() => setMobileNav(false)} />}

      <main className="main">
        <header className="topbar">
          <button className="hamburger" onClick={() => setMobileNav(true)} aria-label="菜单">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="4" x2="20" y1="12" y2="12" />
              <line x1="4" x2="20" y1="6" y2="6" />
              <line x1="4" x2="20" y1="18" y2="18" />
            </svg>
          </button>

          <div className="search-wrap">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            <input
              className="search-input"
              type="text"
              placeholder="搜索项目名或客户邮箱"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>

          <div className="topbar-spacer" />

          <div className="filters">
            <select
              className="select"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as FilterStatus)}
            >
              <option value="全部">全部状态</option>
              <option value="进行中">进行中</option>
              <option value="待确认">待确认</option>
              <option value="已完成">已完成</option>
            </select>
            <select
              className="select"
              value={sortType}
              onChange={(e) => setSortType(e.target.value as SortType)}
            >
              <option value="按截止日期">按截止日期</option>
              <option value="按创建时间">按创建时间</option>
              <option value="按预算">按预算</option>
            </select>
            <button className="btn-primary" onClick={openCreate}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 5v14M5 12h14" />
              </svg>
              新建项目
            </button>
          </div>
        </header>

        <div className="content">
          <div className="section-title">
            <h2>项目仪表盘</h2>
          </div>

          {filteredProjects.length === 0 ? (
            <div className="empty">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                <polyline points="14 2 14 8 20 8" />
                <path d="M9 13h6M9 17h6" />
              </svg>
              <p>{projects.length === 0 ? '暂无项目，点击右上角「新建项目」开始吧' : '没有符合条件的项目'}</p>
            </div>
          ) : (
            <div className="grid">
              {filteredProjects.map((p) => (
                <ProjectCard key={p.id} project={p} />
              ))}
            </div>
          )}

          <div className="section-title">
            <h2>数据统计</h2>
          </div>
          <div className="stats">
            <div className="stat-card total">
              <div className="label">项目总数</div>
              <div className="value">{stats.total}</div>
            </div>
            <div className="stat-card pending">
              <div className="label">待确认</div>
              <div className="value">{stats.pending}</div>
            </div>
            <div className="stat-card budget">
              <div className="label">平均预算</div>
              <div className="value">¥{stats.avgBudget.toLocaleString()}</div>
            </div>
          </div>
        </div>
      </main>

      {selectedProject && (
        <ProjectDetail
          project={selectedProject}
          onClose={() => selectProject(null)}
        />
      )}

      {/* 新建项目模态框 */}
      <div className={`modal ${showModal ? 'visible' : ''}`} onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
        <div className="modal-card" onClick={(e) => e.stopPropagation()}>
          <div className="modal-head">
            <h3>新建项目</h3>
            <button className="drawer-close" onClick={() => setShowModal(false)} aria-label="关闭">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="modal-body">
            <div className="form-field">
              <label>项目名称</label>
              <input
                className="input"
                type="text"
                value={form.name}
                maxLength={40}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="如：游戏主角立绘设计"
              />
              <div className="char-count">{form.name.length}/30</div>
              {form.errors.name && <div className="form-error">{form.errors.name}</div>}
            </div>

            <div className="form-field">
              <label>客户邮箱</label>
              <input
                className="input"
                type="email"
                value={form.clientEmail}
                onChange={(e) => setForm({ ...form, clientEmail: e.target.value })}
                placeholder="client@example.com"
              />
              {form.errors.clientEmail && <div className="form-error">{form.errors.clientEmail}</div>}
            </div>

            <div className="form-row">
              <div className="form-field">
                <label>项目类型</label>
                <select
                  className="input"
                  value={form.projectType}
                  onChange={(e) => setForm({ ...form, projectType: e.target.value as ProjectType })}
                >
                  {PROJECT_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div className="form-field">
                <label>截止日期</label>
                <input
                  className="input"
                  type="date"
                  value={form.deadline}
                  min={todayPlus(0)}
                  onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                />
                {form.errors.deadline && <div className="form-error">{form.errors.deadline}</div>}
              </div>
            </div>

            <div className="form-field">
              <label>预算范围（¥500 ~ ¥50,000）</label>
              <div className="range-wrap">
                <input
                  type="range"
                  min={500}
                  max={50000}
                  step={100}
                  value={form.budget}
                  onChange={(e) => setForm({ ...form, budget: Number(e.target.value) })}
                />
                <div className="range-value">¥{form.budget.toLocaleString()}</div>
              </div>
              {form.errors.budget && <div className="form-error">{form.errors.budget}</div>}
            </div>
          </div>

          <div className="modal-foot">
            <button className="btn-ghost" onClick={() => setShowModal(false)}>取消</button>
            <button className="btn-primary" onClick={handleSubmit}>创建项目</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
