import { Routes, Route, NavLink, useLocation } from 'react-router-dom';
import { lazy, Suspense, useState, useEffect } from 'react';
import { getOverdueTools } from './api/tools';
import type { Tool } from './api/tools';

const ProjectList = lazy(() => import('./components/ProjectList'));
const WoodInventory = lazy(() => import('./components/WoodInventory'));
const ToolMaintenance = lazy(() => import('./components/ToolMaintenance'));

function App() {
  const location = useLocation();
  const [overdueTools, setOverdueTools] = useState<Tool[]>([]);
  const [showOverdueBanner, setShowOverdueBanner] = useState(false);

  useEffect(() => {
    const loadOverdueTools = async () => {
      try {
        const tools = await getOverdueTools();
        setOverdueTools(tools);
        setShowOverdueBanner(tools.length > 0);
      } catch (error) {
        console.error('加载超期工具失败:', error);
      }
    };
    loadOverdueTools();
  }, []);

  const navItems = [
    { path: '/', label: '客户项目', icon: '📋' },
    { path: '/wood', label: '木料库存', icon: '🪵' },
    { path: '/tools', label: '工具维护', icon: '🔧' }
  ];

  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/') return '客户项目管理';
    if (path === '/wood') return '木料库存管理';
    if (path === '/tools') return '工具维护管理';
    return '木作工坊管理系统';
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <nav
        style={{
          width: '240px',
          backgroundColor: '#4E342E',
          color: '#F5F1EB',
          position: 'fixed',
          top: 0,
          left: 0,
          bottom: 0,
          display: 'flex',
          flexDirection: 'column',
          padding: '24px 0',
          zIndex: 100
        }}
      >
        <div style={{ padding: '0 24px 32px' }}>
          <h1 style={{ fontSize: '20px', fontWeight: '600', margin: 0 }}>
            🪚 木作工坊
          </h1>
          <p style={{ fontSize: '12px', opacity: 0.7, marginTop: '4px' }}>
            管理系统
          </p>
        </div>

        <div style={{ flex: 1 }}>
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '14px 24px',
                color: '#F5F1EB',
                textDecoration: 'none',
                fontSize: '15px',
                transition: 'all 0.2s ease',
                backgroundColor: isActive ? 'rgba(255,255,255,0.1)' : 'transparent',
                borderLeft: isActive ? '4px solid #D4AF37' : '4px solid transparent',
                paddingLeft: isActive ? '20px' : '24px'
              })}
            >
              <span style={{ fontSize: '20px' }}>{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </div>

        <div style={{ padding: '16px 24px', fontSize: '12px', opacity: 0.6 }}>
          <p>© 2024 木作工坊</p>
        </div>
      </nav>

      <main
        style={{
          flex: 1,
          marginLeft: '240px',
          backgroundColor: '#F8F5F0',
          minHeight: '100vh'
        }}
      >
        {showOverdueBanner && (
          <div
            style={{
              backgroundColor: '#D32F2F',
              color: '#fff',
              padding: '10px 24px',
              position: 'sticky',
              top: 0,
              zIndex: 50,
              overflow: 'hidden'
            }}
          >
            <div
              style={{
                whiteSpace: 'nowrap',
                animation: 'scrollText 20s linear infinite'
              }}
            >
              ⚠️ 工具维护超期提醒：
              {overdueTools.map((tool, index) => (
                <span key={tool.id} style={{ marginRight: '40px' }}>
                  {tool.name} ({tool.model}) - 已超期 {Math.abs(tool.days_until_maintenance)} 天
                  {index < overdueTools.length - 1 ? '  |  ' : ''}
                </span>
              ))}
            </div>
          </div>
        )}

        <div style={{ padding: '24px 32px' }}>
          <div style={{ marginBottom: '24px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: '600', color: '#212121', margin: 0 }}>
              {getPageTitle()}
            </h2>
          </div>

          <Suspense
            fallback={
              <div style={{ padding: '40px', textAlign: 'center', color: '#757575' }}>
                加载中...
              </div>
            }
          >
            <Routes>
              <Route path="/" element={<ProjectList />} />
              <Route path="/wood" element={<WoodInventory />} />
              <Route path="/tools" element={<ToolMaintenance />} />
            </Routes>
          </Suspense>
        </div>
      </main>
    </div>
  );
}

export default App;
