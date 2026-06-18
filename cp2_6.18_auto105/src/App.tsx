import React, { useState } from 'react';
import { ColorPicker } from './components/ColorPicker';
import { PaletteBar } from './components/PaletteBar';
import { PreviewPanel } from './components/PreviewPanel';
import { usePaletteStore } from './store';

const App: React.FC = () => {
  const { exportJSON } = usePaletteStore();
  const [showExportToast, setShowExportToast] = useState(false);

  const handleExport = async () => {
    const json = exportJSON();
    try {
      await navigator.clipboard.writeText(json);
      setShowExportToast(true);
      setTimeout(() => setShowExportToast(false), 2000);
    } catch (err) {
      console.error('Failed to export:', err);
    }
  };

  return (
    <div className="app">
      <nav className="navbar">
        <div className="navbar-content">
          <div className="logo">
            <span className="logo-icon">🎨</span>
            <span className="logo-text">ColorPalette Pro</span>
          </div>
          <ColorPicker />
        </div>
      </nav>

      <main className="main-content">
        <aside className="sidebar">
          <div className="sidebar-content">
            <PaletteBar />
          </div>
        </aside>

        <section className="preview-section">
          <PreviewPanel />
        </section>
      </main>

      <button className="export-btn" onClick={handleExport}>
        <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
          <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" />
        </svg>
        导出 JSON
      </button>

      {showExportToast && (
        <div className="export-toast">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
          </svg>
          已复制到剪贴板
        </div>
      )}

      <style>{`
        * {
          box-sizing: border-box;
        }
        html, body, #root {
          margin: 0;
          padding: 0;
          height: 100%;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto,
            'Helvetica Neue', Arial, sans-serif;
        }
        .app {
          display: flex;
          flex-direction: column;
          height: 100vh;
          overflow: hidden;
          transition: background-color 0.4s ease, color 0.4s ease;
        }
        .navbar {
          height: 80px;
          background-color: #1E293B;
          color: #FFFFFF;
          display: flex;
          align-items: center;
          padding: 0 32px;
          flex-shrink: 0;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.15);
        }
        .navbar-content {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .logo {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .logo-icon {
          font-size: 28px;
        }
        .logo-text {
          font-size: 20px;
          font-weight: 600;
          letter-spacing: 0.3px;
        }
        .main-content {
          flex: 1;
          display: flex;
          overflow: hidden;
        }
        .sidebar {
          width: 320px;
          flex-shrink: 0;
          background-color: #F8FAFC;
          border-right: 1px solid #E2E8F0;
          padding: 24px;
          overflow-y: auto;
          transition: background-color 0.4s ease, border-color 0.4s ease;
        }
        .sidebar-content {
          color: #1E293B;
        }
        .preview-section {
          flex: 1;
          overflow: hidden;
          position: relative;
        }
        .export-btn {
          position: fixed;
          right: 24px;
          bottom: 24px;
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 14px 24px;
          background: linear-gradient(135deg, #FF6B35 0%, #FF8F5E 100%);
          color: #FFFFFF;
          border: none;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.2),
                      0 8px 20px rgba(255, 107, 53, 0.35);
          transition: transform 0.2s ease, box-shadow 0.2s ease;
          z-index: 100;
        }
        .export-btn:hover {
          transform: translateY(-2px);
          box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.2),
                      0 12px 28px rgba(255, 107, 53, 0.45);
        }
        .export-btn:active {
          transform: translateY(0);
        }
        .export-toast {
          position: fixed;
          right: 24px;
          bottom: 80px;
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 20px;
          background-color: #10B981;
          color: #FFFFFF;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
          animation: slideIn 0.3s ease;
          z-index: 101;
        }
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @media (max-width: 768px) {
          .navbar {
            height: auto;
            padding: 12px 16px;
            flex-shrink: 0;
          }
          .navbar-content {
            flex-direction: column;
            gap: 12px;
            align-items: flex-start !important;
          }
          .logo {
            width: 100%;
            justify-content: space-between;
          }
          .logo-text {
            font-size: 16px;
          }
          .color-picker {
            width: 100%;
            justify-content: space-between;
          }
          .main-content {
            flex-direction: column;
          }
          .sidebar {
            width: 100%;
            max-height: 180px;
            flex-shrink: 0;
            padding: 16px;
            border-right: none;
            border-bottom: 1px solid #E2E8F0;
            overflow-y: auto;
          }
          .sidebar-content {
            width: 100%;
          }
          .preview-section {
            flex: 1;
            min-height: 0;
          }
          .export-btn {
            right: 16px;
            bottom: 16px;
            padding: 12px 20px;
            font-size: 13px;
          }
          .export-toast {
            right: 16px;
            bottom: 70px;
          }
        }
      `}</style>
    </div>
  );
};

export default App;
