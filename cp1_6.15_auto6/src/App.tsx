import { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import ActivityCreator from './components/ActivityCreator';
import SimulationChart from './components/SimulationChart';
import ActivityBoard from './components/ActivityBoard';
import ReviewReport from './components/ReviewReport';
import { Activity } from './data/mockData';

type ViewType = 'create' | 'board' | 'review';

const styles = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
    background: #f5f7fa;
    color: #2c3e50;
    min-height: 100vh;
  }
  .app-container { display: flex; min-height: 100vh; }
  .sidebar {
    width: 240px;
    background: linear-gradient(180deg, #1A73E8 0%, #1557B0 100%);
    color: white;
    padding: 24px 0;
    position: fixed;
    top: 0;
    left: 0;
    bottom: 0;
    z-index: 100;
    display: flex;
    flex-direction: column;
    box-shadow: 2px 0 12px rgba(26, 115, 232, 0.15);
  }
  .logo {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 0 24px 24px;
    border-bottom: 1px solid rgba(255,255,255,0.15);
  }
  .logo-icon {
    width: 40px; height: 40px;
    background: rgba(255,255,255,0.2);
    border-radius: 10px;
    display: flex; align-items: center; justify-content: center;
    font-size: 22px;
    backdrop-filter: blur(10px);
  }
  .logo-text { font-size: 17px; font-weight: 600; letter-spacing: 0.5px; }
  .logo-sub { font-size: 11px; opacity: 0.7; margin-top: 2px; }
  .nav-menu { flex: 1; padding: 16px 12px; }
  .nav-item {
    display: flex; align-items: center; gap: 14px;
    padding: 12px 16px;
    border-radius: 10px;
    cursor: pointer;
    margin-bottom: 4px;
    transition: all 0.25s ease;
    color: rgba(255,255,255,0.8);
    font-size: 14px;
    font-weight: 500;
    position: relative;
    overflow: hidden;
  }
  .nav-item:hover {
    background: rgba(255,255,255,0.12);
    color: white;
    transform: translateX(3px);
  }
  .nav-item.active {
    background: white;
    color: #1A73E8;
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  }
  .nav-item.active .nav-icon {
    transform: scale(1.05);
  }
  .nav-icon {
    font-size: 18px;
    width: 24px;
    text-align: center;
    transition: transform 0.3s ease;
  }
  .nav-badge {
    margin-left: auto;
    background: rgba(255,255,255,0.25);
    color: white;
    font-size: 11px;
    padding: 2px 8px;
    border-radius: 10px;
    font-weight: 600;
  }
  .nav-item.active .nav-badge {
    background: #1A73E8;
    color: white;
  }
  .sidebar-footer {
    padding: 16px 24px;
    border-top: 1px solid rgba(255,255,255,0.15);
    font-size: 12px;
    opacity: 0.6;
  }
  .main-content {
    flex: 1;
    margin-left: 240px;
    padding: 28px 36px;
    min-height: 100vh;
  }
  .top-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 28px;
    animation: fadeInDown 0.4s ease;
  }
  .page-title {
    font-size: 26px;
    font-weight: 700;
    color: #1a1a2e;
    letter-spacing: -0.5px;
  }
  .page-subtitle {
    font-size: 13px;
    color: #7f8c8d;
    margin-top: 4px;
  }
  .header-right { display: flex; align-items: center; gap: 12px; }
  .user-avatar {
    width: 40px; height: 40px;
    background: linear-gradient(135deg, #1A73E8, #5DADE2);
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    color: white;
    font-weight: 600;
    font-size: 15px;
    box-shadow: 0 4px 12px rgba(26, 115, 232, 0.3);
  }
  .mobile-header {
    display: none;
    position: fixed;
    top: 0; left: 0; right: 0;
    background: white;
    padding: 12px 16px;
    z-index: 99;
    box-shadow: 0 2px 8px rgba(0,0,0,0.06);
    align-items: center;
    justify-content: space-between;
  }
  .hamburger {
    width: 40px; height: 40px;
    display: flex; align-items: center; justify-content: center;
    border-radius: 8px;
    background: #f0f4ff;
    color: #1A73E8;
    font-size: 20px;
    cursor: pointer;
    border: none;
  }
  .mobile-overlay {
    display: none;
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(0,0,0,0.5);
    z-index: 99;
  }
  .mobile-overlay.show { display: block; }
  @keyframes fadeInUp {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes fadeInDown {
    from { opacity: 0; transform: translateY(-10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .fade-in-up { animation: fadeInUp 0.3s ease both; }
  @media (max-width: 1024px) {
    .sidebar {
      transform: translateX(-100%);
      transition: transform 0.3s ease;
      width: 260px;
    }
    .sidebar.show { transform: translateX(0); }
    .main-content {
      margin-left: 0;
      padding: 72px 20px 28px;
    }
    .mobile-header { display: flex; }
  }
  @media (max-width: 640px) {
    .main-content { padding: 68px 14px 24px; }
    .page-title { font-size: 22px; }
  }
`;

const App = () => {
  const [currentView, setCurrentView] = useState<ViewType>('board');
  const [selectedActivityId, setSelectedActivityId] = useState<string | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);

  useEffect(() => {
    fetchActivities();
  }, []);

  const fetchActivities = async () => {
    try {
      const res = await fetch('/api/activities');
      const data = await res.json();
      setActivities(data);
    } catch (e) {
      console.error('Failed to fetch activities:', e);
    }
  };

  const handleNavigateToCreate = () => {
    setEditingActivity(null);
    setCurrentView('create');
    setSidebarOpen(false);
  };

  const handleEditActivity = (activity: Activity) => {
    setEditingActivity(activity);
    setCurrentView('create');
    setSidebarOpen(false);
  };

  const handleViewReview = (activityId: string) => {
    setSelectedActivityId(activityId);
    setCurrentView('review');
    setSidebarOpen(false);
  };

  const handleActivityCreated = () => {
    setEditingActivity(null);
    fetchActivities();
    setCurrentView('board');
  };

  const navItems: { key: ViewType; label: string; icon: string; badge?: string }[] = [
    { key: 'create', label: editingActivity ? '编辑活动' : '活动创建', icon: '📋' },
    { key: 'board', label: '活动看板', icon: '📊', badge: activities.length > 0 ? String(activities.filter(a => a.status === 'ongoing').length) : undefined },
    { key: 'review', label: '效果复盘', icon: '📈' },
  ];

  const pageInfo: Record<ViewType, { title: string; subtitle: string }> = {
    create: {
      title: editingActivity ? '编辑促销活动' : '创建促销活动',
      subtitle: editingActivity ? '修改活动配置并保存更新' : '设置活动信息、优惠规则，实时预览效果',
    },
    board: {
      title: '活动看板',
      subtitle: `${activities.length} 个活动 · ${activities.filter(a => a.status === 'ongoing').length} 个进行中`,
    },
    review: {
      title: '效果复盘报告',
      subtitle: selectedActivityId ? '活动数据分析与效果评估' : '请从活动看板选择已结束的活动',
    },
  };

  return (
    <>
      <style>{styles}</style>
      <div className="app-container">
        <div className={`mobile-overlay ${sidebarOpen ? 'show' : ''}`} onClick={() => setSidebarOpen(false)} />
        <div className="mobile-header">
          <button className="hamburger" onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? '✕' : '☰'}
          </button>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#1A73E8' }}>促销活动策划</div>
          <div className="user-avatar" style={{ width: 36, height: 36, fontSize: 14 }}>管</div>
        </div>

        <aside className={`sidebar ${sidebarOpen ? 'show' : ''}`}>
          <div className="logo">
            <div className="logo-icon">🎯</div>
            <div>
              <div className="logo-text">促销活动策划</div>
              <div className="logo-sub">E-Commerce Promotions</div>
            </div>
          </div>

          <nav className="nav-menu">
            {navItems.map((item, idx) => (
              <div
                key={item.key}
                className={`nav-item ${currentView === item.key ? 'active' : ''}`}
                style={{ animationDelay: `${idx * 0.05}s` }}
                onClick={() => {
                  setCurrentView(item.key);
                  if (item.key === 'create') setEditingActivity(null);
                  setSidebarOpen(false);
                }}
              >
                <span className="nav-icon">{item.icon}</span>
                <span>{item.label}</span>
                {item.badge && <span className="nav-badge">{item.badge}</span>}
              </div>
            ))}
          </nav>

          <div className="sidebar-footer">
            <div>© 2026 促销活动策划平台</div>
            <div style={{ marginTop: 4 }}>v1.0.0 · 数据模拟模式</div>
          </div>
        </aside>

        <main className="main-content">
          <div className="top-header">
            <div>
              <div className="page-title">{pageInfo[currentView].title}</div>
              <div className="page-subtitle">{pageInfo[currentView].subtitle}</div>
            </div>
            <div className="header-right">
              <div className="user-avatar">管</div>
            </div>
          </div>

          <div className="fade-in-up">
            {currentView === 'create' && (
              <ActivityCreator
                editingActivity={editingActivity}
                onCreated={handleActivityCreated}
                onShowSimulation={(params) => {
                  (window as any).__simParams = params;
                  setCurrentView('board');
                  setTimeout(() => setCurrentView('create'), 0);
                }}
              />
            )}
            {currentView === 'board' && (
              <ActivityBoard
                onEdit={handleEditActivity}
                onViewReview={handleViewReview}
                onRefresh={fetchActivities}
                onCreateNew={handleNavigateToCreate}
              />
            )}
            {currentView === 'review' && (
              <ReviewReport
                activityId={selectedActivityId}
                onBack={() => setCurrentView('board')}
              />
            )}
          </div>
        </main>
      </div>
    </>
  );
};

export default App;
