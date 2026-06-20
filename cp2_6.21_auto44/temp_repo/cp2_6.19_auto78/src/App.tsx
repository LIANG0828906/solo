import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import { ProposalList } from './proposal/ProposalList';
import { ProposalDetail } from './proposal/components/ProposalDetail';
import { useProposalStore } from './proposal/store';
import { authService } from './user/auth';
import type { User } from './user/auth';
import './App.css';

const AdminPanel = () => {
  const { proposals, loading, hasMore, fetchProposals, togglePin, updateStatus, deleteProposal, category, status, setCategory, setStatus } = useProposalStore();
  const navigate = useNavigate();
  const isAdmin = authService.isAdmin();

  useEffect(() => {
    if (isAdmin) {
      fetchProposals(true);
    }
  }, [isAdmin, fetchProposals]);

  if (!isAdmin) {
    return (
      <div className="admin-denied">
        <h2>无权限访问</h2>
        <p>请使用管理员账号登录</p>
        <Link to="/" className="back-link">返回首页</Link>
      </div>
    );
  }

  const handleViewDetail = (id: string) => {
    navigate(`/proposal/${id}`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case '已通过': return '#1abc9c';
      case '审核中': return '#f39c12';
      case '已关闭': return '#95a5a6';
      default: return '#95a5a6';
    }
  };

  return (
    <div className="admin-panel">
      <div className="admin-sidebar">
        <h2 className="admin-title">管理后台</h2>
        <nav className="admin-nav">
          <Link to="/" className="nav-link">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            提案广场
          </Link>
          <div className="nav-link active">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <line x1="9" y1="9" x2="15" y2="9" />
              <line x1="9" y1="15" x2="15" y2="15" />
            </svg>
            提案管理
          </div>
        </nav>

        <div className="sidebar-stats">
          <div className="stat-item">
            <span className="stat-label">总提案数</span>
            <span className="stat-value">{proposals.length}</span>
          </div>
        </div>
      </div>

      <div className="admin-content">
        <div className="admin-header">
          <h1>提案管理</h1>
          <p>管理所有提案，支持分类浏览、状态筛选、置顶和关闭操作</p>
        </div>

        <div className="admin-filters">
          <div className="filter-group">
            <span className="filter-label">分类：</span>
            <div className="filter-buttons">
              {['全部', '技术', '市场', '管理'].map((cat) => (
                <button
                  key={cat}
                  className={`filter-btn ${(category || '全部') === cat ? 'active' : ''}`}
                  onClick={() => setCategory(cat === '全部' ? undefined : cat as any)}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="filter-group">
            <span className="filter-label">状态：</span>
            <div className="filter-buttons">
              {['全部', '审核中', '已通过', '已关闭'].map((stat) => (
                <button
                  key={stat}
                  className={`filter-btn ${(status || '全部') === stat ? 'active' : ''}`}
                  onClick={() => setStatus(stat === '全部' ? undefined : stat as any)}
                >
                  {stat}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="proposal-table-wrapper">
          <table className="proposal-table">
            <thead>
              <tr>
                <th>提案标题</th>
                <th>分类</th>
                <th>状态</th>
                <th>提交者</th>
                <th>点赞数</th>
                <th>置顶</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {proposals.map((proposal) => (
                <tr key={proposal.id}>
                  <td 
                    className="title-cell"
                    onClick={() => handleViewDetail(proposal.id)}
                  >
                    {proposal.title}
                  </td>
                  <td>
                    <span className="category-badge">{proposal.category}</span>
                  </td>
                  <td>
                    <span 
                      className="status-badge"
                      style={{ 
                        backgroundColor: getStatusColor(proposal.status) + '20',
                        color: getStatusColor(proposal.status) 
                      }}
                    >
                      {proposal.status}
                    </span>
                  </td>
                  <td>{proposal.authorName}</td>
                  <td>{proposal.upVotes}</td>
                  <td>
                    <span className={`pin-indicator ${proposal.isPinned ? 'pinned' : ''}`}>
                      {proposal.isPinned ? '★ 是' : '☆ 否'}
                    </span>
                  </td>
                  <td>
                    <div className="row-actions">
                      <button 
                        className="action-btn pin"
                        onClick={() => togglePin(proposal.id)}
                      >
                        {proposal.isPinned ? '取消置顶' : '置顶'}
                      </button>
                      {proposal.status !== '已关闭' ? (
                        <button 
                          className="action-btn close"
                          onClick={() => updateStatus(proposal.id, '已关闭')}
                        >
                          关闭
                        </button>
                      ) : (
                        <button 
                          className="action-btn reopen"
                          onClick={() => updateStatus(proposal.id, '已通过')}
                        >
                          重新开放
                        </button>
                      )}
                      <button 
                        className="action-btn delete"
                        onClick={() => {
                          if (confirm('确定要删除这个提案吗？')) {
                            deleteProposal(proposal.id);
                          }
                        }}
                      >
                        删除
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {loading && (
          <div className="table-loading">
            <div className="loading-spinner-small"></div>
            <span>加载中...</span>
          </div>
        )}

        {!loading && !hasMore && proposals.length > 0 && (
          <div className="table-end">— 已加载全部 —</div>
        )}

        {!loading && proposals.length === 0 && (
          <div className="table-empty">暂无提案数据</div>
        )}
      </div>
    </div>
  );
};

const Header = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    setCurrentUser(authService.getCurrentUser());
  }, []);

  const switchToAdmin = () => {
    authService.loginAsAdmin();
    setCurrentUser(authService.getCurrentUser());
    window.location.reload();
  };

  const switchToEmployee = () => {
    authService.loginAsEmployee();
    setCurrentUser(authService.getCurrentUser());
    window.location.reload();
  };

  return (
    <header className="app-header">
      <div className="header-container">
        <Link to="/" className="logo">
          <div className="logo-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
          </div>
          <span className="logo-text">创意提案平台</span>
        </Link>

        <nav className="header-nav">
          <Link to="/" className="nav-item">
            提案广场
          </Link>
          {currentUser?.role === 'admin' && (
            <Link to="/admin" className="nav-item">
              管理后台
            </Link>
          )}
        </nav>

        <div className="user-section">
          <div className="user-switcher">
            <span className="switch-label">身份：</span>
            <button
              className={`switch-btn ${currentUser?.role === 'employee' ? 'active' : ''}`}
              onClick={switchToEmployee}
            >
              员工
            </button>
            <button
              className={`switch-btn ${currentUser?.role === 'admin' ? 'active' : ''}`}
              onClick={switchToAdmin}
            >
              管理员
            </button>
          </div>
          <div 
            className="user-avatar"
            style={{ background: currentUser?.avatar }}
          >
            {currentUser?.name.charAt(0)}
          </div>
        </div>
      </div>
    </header>
  );
};

export const App = () => {
  return (
    <Router>
      <div className="app">
        <Header />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<ProposalList />} />
            <Route path="/proposal/:id" element={<ProposalDetail />} />
            <Route path="/admin" element={<AdminPanel />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
};
