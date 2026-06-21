import React, { useState, Suspense, lazy } from 'react';
import { ActivityProvider, useActivity } from './context/ActivityContext';

const ActivityModule = lazy(() => import('./modules/ActivityModule'));
const AnalyticsModule = lazy(() => import('./modules/AnalyticsModule'));

type PageKey = 'home' | 'activity' | 'create' | 'analytics' | 'admin';

interface NavItem {
  key: PageKey;
  label: string;
  icon: string;
}

const navItems: NavItem[] = [
  { key: 'home', label: '首页', icon: '🏠' },
  { key: 'activity', label: '参与活动', icon: '🎯' },
  { key: 'create', label: '创建活动', icon: '✨' },
  { key: 'analytics', label: '数据看板', icon: '📊' },
  { key: 'admin', label: '管理后台', icon: '⚙️' },
];

const LoadingFallback: React.FC = () => (
  <div className="loading-container">
    <div className="loading-spinner" />
    <span className="loading-text">加载中...</span>
  </div>
);

const HomePage: React.FC = () => {
  const { currentActivityId, participants } = useActivity();

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">欢迎使用活动引擎</h1>
        <p className="page-subtitle">高效管理和参与各类活动，让协作更简单</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">进行中活动</div>
          <div className="stat-value blue">{currentActivityId ? 1 : 0}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">我的参与</div>
          <div className="stat-value purple">{participants.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">待审核</div>
          <div className="stat-value orange">2</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">系统通知</div>
          <div className="stat-value green">5</div>
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginBottom: '16px' }}>快速开始</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          <div
            style={{
              padding: '20px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(139, 92, 246, 0.1))',
              border: '1px solid #334155',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>🎯</div>
            <h4 style={{ marginBottom: '6px' }}>参与活动</h4>
            <p style={{ fontSize: '13px' }}>输入邀请码加入活动</p>
          </div>
          <div
            style={{
              padding: '20px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(59, 130, 246, 0.1))',
              border: '1px solid #334155',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>✨</div>
            <h4 style={{ marginBottom: '6px' }}>创建活动</h4>
            <p style={{ fontSize: '13px' }}>发起一个新的活动</p>
          </div>
          <div
            style={{
              padding: '20px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1), rgba(239, 68, 68, 0.1))',
              border: '1px solid #334155',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>📊</div>
            <h4 style={{ marginBottom: '6px' }}>查看数据</h4>
            <p style={{ fontSize: '13px' }}>分析活动统计数据</p>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: '20px' }}>
        <h3 style={{ marginBottom: '16px' }}>最近动态</h3>
        <ul style={{ listStyle: 'none' }}>
          {[
            { time: '10分钟前', text: '您成功加入了「技术分享大会」', type: 'success' },
            { time: '1小时前', text: '活动「产品设计工作坊」已更新议程', type: 'info' },
            { time: '昨天', text: '您创建的活动「新人培训营」审核通过', type: 'success' },
          ].map((item, idx) => (
            <li
              key={idx}
              style={{
                padding: '14px 0',
                borderBottom: idx < 2 ? '1px solid #334155' : 'none',
                display: 'flex',
                gap: '12px',
                alignItems: 'flex-start',
              }}
            >
              <span style={{ fontSize: '18px' }}>
                {item.type === 'success' ? '✅' : '📢'}
              </span>
              <div style={{ flex: 1 }}>
                <div style={{ color: '#E2E8F0', marginBottom: '4px' }}>{item.text}</div>
                <div style={{ color: '#64748B', fontSize: '12px' }}>{item.time}</div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

const CreatePage: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'online',
    startTime: '',
    endTime: '',
    maxParticipants: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert('活动创建成功！邀请码: ' + Math.random().toString(36).substring(2, 8).toUpperCase());
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">创建活动</h1>
        <p className="page-subtitle">填写活动信息，快速发起一个新活动</p>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">活动名称 *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="请输入活动名称"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">活动描述</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="简要描述活动内容、目标和形式"
              rows={4}
              style={{ resize: 'vertical' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">活动类型 *</label>
              <select name="type" value={formData.type} onChange={handleChange} required>
                <option value="online">线上会议</option>
                <option value="offline">线下聚会</option>
                <option value="training">培训课程</option>
                <option value="other">其他</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">最大参与人数</label>
              <input
                type="number"
                name="maxParticipants"
                value={formData.maxParticipants}
                onChange={handleChange}
                placeholder="不填表示不限"
                min={1}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">开始时间 *</label>
              <input
                type="datetime-local"
                name="startTime"
                value={formData.startTime}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">结束时间 *</label>
              <input
                type="datetime-local"
                name="endTime"
                value={formData.endTime}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="btn-group" style={{ marginTop: '24px' }}>
            <button type="submit">创建活动</button>
            <button type="button" className="btn-secondary">保存草稿</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const AdminPage: React.FC = () => {
  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">管理后台</h1>
        <p className="page-subtitle">管理活动、用户和系统配置</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">注册用户</div>
          <div className="stat-value blue">2,847</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">活动总数</div>
          <div className="stat-value purple">312</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">待审核</div>
          <div className="stat-value orange">18</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">系统状态</div>
          <div className="stat-value green">正常</div>
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginBottom: '16px' }}>审核队列</h3>
        <ul style={{ listStyle: 'none' }}>
          {[
            { name: '季度总结大会', creator: '张三', time: '2小时前' },
            { name: '团建活动报名', creator: '李四', time: '5小时前' },
            { name: '产品发布会', creator: '王五', time: '1天前' },
          ].map((item, idx) => (
            <li
              key={idx}
              style={{
                padding: '16px 0',
                borderBottom: idx < 2 ? '1px solid #334155' : 'none',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '16px',
                flexWrap: 'wrap',
              }}
            >
              <div style={{ flex: 1, minWidth: '200px' }}>
                <div style={{ color: '#E2E8F0', fontWeight: 500, marginBottom: '4px' }}>{item.name}</div>
                <div style={{ color: '#64748B', fontSize: '13px' }}>
                  创建者: {item.creator} · {item.time}
                </div>
              </div>
              <div className="btn-group">
                <button>通过</button>
                <button className="btn-danger">拒绝</button>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="card" style={{ marginTop: '20px' }}>
        <h3 style={{ marginBottom: '16px' }}>系统设置</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {[
            { label: '邮件通知', desc: '活动状态变更时发送邮件通知', enabled: true },
            { label: '自动审核', desc: '普通活动自动通过审核', enabled: false },
            { label: '数据备份', desc: '每日凌晨自动备份数据库', enabled: true },
          ].map((item, idx) => (
            <div
              key={idx}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '16px',
                background: '#0F172A',
                borderRadius: '10px',
                border: '1px solid #334155',
              }}
            >
              <div>
                <div style={{ color: '#E2E8F0', fontWeight: 500 }}>{item.label}</div>
                <div style={{ color: '#64748B', fontSize: '13px', marginTop: '4px' }}>{item.desc}</div>
              </div>
              <div
                style={{
                  width: '48px',
                  height: '26px',
                  borderRadius: '13px',
                  background: item.enabled ? '#3B82F6' : '#334155',
                  position: 'relative',
                  cursor: 'pointer',
                  transition: 'background 0.2s ease',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    top: '3px',
                    left: item.enabled ? '25px' : '3px',
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    background: '#FFFFFF',
                    transition: 'left 0.2s ease',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const AppContent: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<PageKey>('home');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <HomePage />;
      case 'activity':
        return (
          <Suspense fallback={<LoadingFallback />}>
            <ActivityModule />
          </Suspense>
        );
      case 'create':
        return <CreatePage />;
      case 'analytics':
        return (
          <Suspense fallback={<LoadingFallback />}>
            <AnalyticsModule />
          </Suspense>
        );
      case 'admin':
        return <AdminPage />;
      default:
        return <HomePage />;
    }
  };

  const handleNavClick = (key: PageKey) => {
    setCurrentPage(key);
    setSidebarOpen(false);
  };

  return (
    <div className="app-container">
      <button
        className="hamburger-btn"
        onClick={() => setSidebarOpen(!sidebarOpen)}
        aria-label="菜单"
      >
        {sidebarOpen ? '✕' : '☰'}
      </button>

      <div
        className={`sidebar-backdrop ${sidebarOpen ? 'visible' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />

      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h2 className="sidebar-title">活动引擎</h2>
          <p style={{ color: '#64748B', fontSize: '13px', marginTop: '4px' }}>Activity Engine</p>
        </div>

        <nav>
          <ul className="nav-menu">
            {navItems.map((item) => (
              <li
                key={item.key}
                className={`nav-item ${currentPage === item.key ? 'active' : ''}`}
                onClick={() => handleNavClick(item.key)}
              >
                <span className="nav-icon">{item.icon}</span>
                <span>{item.label}</span>
              </li>
            ))}
          </ul>
        </nav>

        <div
          style={{
            marginTop: 'auto',
            paddingTop: '20px',
            borderTop: '1px solid #334155',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFF',
                fontWeight: 600,
                fontSize: '16px',
              }}
            >
              A
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ color: '#E2E8F0', fontSize: '14px', fontWeight: 500 }}>管理员</div>
              <div style={{ color: '#64748B', fontSize: '12px' }}>admin@example.com</div>
            </div>
          </div>
        </div>
      </aside>

      <main className="main-content">{renderPage()}</main>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <ActivityProvider>
      <AppContent />
    </ActivityProvider>
  );
};

export default App;
