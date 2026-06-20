import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import CodeEditor from './analysis/CodeEditor';
import ReportPanel from './report/ReportPanel';
import HistoryList from './report/HistoryList';
import SettingsDrawer from './report/SettingsDrawer';
import { useAnalysisStore } from './analysis/store';

function AppContent() {
  const [showSettings, setShowSettings] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [activeTab, setActiveTab] = useState<'issues' | 'report' | 'history'>('issues');
  const [historyBtnHover, setHistoryBtnHover] = useState(false);
  const [settingsBtnHover, setSettingsBtnHover] = useState(false);
  const { loadThresholds, result } = useAnalysisStore();

  useEffect(() => {
    loadThresholds();
  }, [loadThresholds]);

  useEffect(() => {
    if (result && result.stats.total > 0) {
      setActiveTab('issues');
    }
  }, [result]);

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <nav 
        style={{ 
          height: '56px', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          paddingLeft: '24px', 
          paddingRight: '24px', 
          color: 'white', 
          flexShrink: 0,
          backgroundColor: '#1E293B'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '32px' }}>🔍</span>
          <h1 style={{ fontSize: '18px', fontWeight: 600, letterSpacing: '0.025em' }}>代码审查助手</h1>
          <span style={{ fontSize: '12px', backgroundColor: 'rgba(255,255,255,0.2)', padding: '2px 8px', borderRadius: '4px' }}>v1.0</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={() => setShowHistory(true)}
            onMouseEnter={() => setHistoryBtnHover(true)}
            onMouseLeave={() => setHistoryBtnHover(false)}
            style={{ 
              padding: '8px', 
              borderRadius: '8px', 
              transition: 'background-color 0.15s ease, color 0.15s ease',
              backgroundColor: historyBtnHover ? 'rgba(255,255,255,0.1)' : 'transparent'
            }}
            title="历史记录"
          >
            📚
          </button>
          <button
            onClick={() => setShowSettings(true)}
            onMouseEnter={() => setSettingsBtnHover(true)}
            onMouseLeave={() => setSettingsBtnHover(false)}
            style={{ 
              padding: '8px', 
              borderRadius: '8px', 
              transition: 'background-color 0.15s ease, color 0.15s ease',
              backgroundColor: settingsBtnHover ? 'rgba(255,255,255,0.1)' : 'transparent'
            }}
            title="设置"
          >
            ⚙️
          </button>
        </div>
      </nav>

      <div id="main-container" style={{ flex: 1, display: 'flex', overflow: 'hidden', transition: 'all 0.3s ease' }}>
        <div 
          id="editor-panel"
          style={{ 
            height: '100%', 
            overflow: 'hidden', 
            flexShrink: 0,
            width: '70%',
            minWidth: '500px',
          }}
        >
          <CodeEditor onHistoryClick={() => setShowHistory(true)} />
        </div>

        <div 
          id="report-panel"
          style={{ 
            height: '100%', 
            borderLeft: '1px solid #e5e7eb', 
            overflow: 'hidden',
            width: '30%', 
            minWidth: '350px' 
          }}
        >
          {showHistory ? (
            <HistoryList onClose={() => setShowHistory(false)} />
          ) : (
            <ReportPanel activeTab={activeTab} onTabChange={setActiveTab} />
          )}
        </div>
      </div>

      <SettingsDrawer 
        isOpen={showSettings} 
        onClose={() => setShowSettings(false)} 
      />

      <style>{`
        @media (max-width: 768px) {
          #main-container {
            flex-direction: column !important;
          }
          #editor-panel {
            width: 100% !important;
            min-width: unset !important;
            height: 50% !important;
          }
          #report-panel {
            width: 100% !important;
            min-width: unset !important;
            height: 50% !important;
            border-left: none !important;
            border-top: 1px solid #e5e7eb;
          }
        }
      `}</style>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<AppContent />} />
        <Route path="/history" element={<AppContent />} />
        <Route path="/history/:id" element={<AppContent />} />
      </Routes>
    </Router>
  );
}
