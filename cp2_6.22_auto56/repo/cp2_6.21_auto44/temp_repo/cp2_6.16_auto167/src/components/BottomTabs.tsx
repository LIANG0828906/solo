import { useNavigate, useLocation } from 'react-router-dom';

const tabs = [
  { path: '/', label: '时间线', icon: '⏳', key: 'timeline' },
  { create: true, key: 'create' },
  { path: '/private', label: '私密', icon: '🔒', key: 'private' },
  { path: '/opened', label: '回顾', icon: '✨', key: 'opened' },
];

export function BottomTabs() {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path?: string) => {
    if (!path) return false;
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="bottom-tabs">
      <div className="bottom-tabs-list">
        {tabs.map((tab) => {
          if ('create' in tab) {
            return (
              <div key={tab.key} className="bottom-tab-create" onClick={() => navigate('/create')}>
                ＋
              </div>
            );
          }
          return (
            <div
              key={tab.key}
              className={`bottom-tab ${isActive(tab.path) ? 'active' : ''}`}
              onClick={() => navigate(tab.path!)}
            >
              <span className="bottom-tab-icon">{tab.icon}</span>
              <span>{tab.label}</span>
            </div>
          );
        })}
      </div>
    </nav>
  );
}
