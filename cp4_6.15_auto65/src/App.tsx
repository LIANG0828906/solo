// 应用入口组件
// 数据流向：App.tsx 包裹 AppProvider -> 渲染页面组件
// 被调用方：src/main.tsx
// 调用方：src/context/AppContext.tsx, src/pages/Dashboard.tsx, src/pages/AdminPanel.tsx

import React, { useState } from 'react';
import { AppProvider } from '@/context/AppContext';
import Dashboard from '@/pages/Dashboard';
import AdminPanel from '@/pages/AdminPanel';

type Page = 'dashboard' | 'admin';

function AppContent() {
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');

  return (
    <div className="app">
      <nav className="app-nav">
        <div className="nav-brand">🏢 智慧办公</div>
        <div className="nav-links">
          <button
            className={`nav-link ${currentPage === 'dashboard' ? 'active' : ''}`}
            onClick={() => setCurrentPage('dashboard')}
          >
            📊 仪表盘
          </button>
          <button
            className={`nav-link ${currentPage === 'admin' ? 'active' : ''}`}
            onClick={() => setCurrentPage('admin')}
          >
            ⚙️ 管理面板
          </button>
        </div>
      </nav>

      <main className="app-main">
        {currentPage === 'dashboard' && <Dashboard />}
        {currentPage === 'admin' && <AdminPanel />}
      </main>

      <style>{`
        * {
          box-sizing: border-box;
        }

        body {
          margin: 0;
          padding: 0;
          font-family: 'Inter', 'Noto Sans SC', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          background: #f5f7fa;
          color: #333;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }

        .app {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
        }

        .app-nav {
          background: #fff;
          border-bottom: 1px solid #E0E0E0;
          padding: 0 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          position: sticky;
          top: 0;
          z-index: 50;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
        }

        .nav-brand {
          font-size: 18px;
          font-weight: 700;
          color: #1E88E5;
          padding: 14px 0;
        }

        .nav-links {
          display: flex;
          gap: 4px;
        }

        .nav-link {
          background: transparent;
          border: none;
          padding: 10px 18px;
          font-size: 14px;
          font-weight: 500;
          color: #666;
          cursor: pointer;
          border-radius: 6px;
          transition: all 0.15s ease;
          font-family: inherit;
        }

        .nav-link:hover {
          color: #1E88E5;
          background: #f0f7ff;
        }

        .nav-link.active {
          color: #1E88E5;
          background: #e3f2fd;
        }

        .app-main {
          flex: 1;
        }

        @media (max-width: 768px) {
          .app-nav {
            padding: 0 16px;
            flex-direction: column;
            align-items: stretch;
          }

          .nav-brand {
            padding: 12px 0;
            text-align: center;
            border-bottom: 1px solid #f0f0f0;
          }

          .nav-links {
            justify-content: center;
            padding: 8px 0;
          }

          .nav-link {
            padding: 8px 14px;
            font-size: 13px;
          }
        }
      `}</style>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
