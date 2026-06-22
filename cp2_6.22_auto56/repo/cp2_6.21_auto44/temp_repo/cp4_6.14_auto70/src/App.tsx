import { useState, useEffect, useCallback } from 'react';
import ControlPanel from './components/ControlPanel';
import ComparisonView from './components/ComparisonView';
import {
  FontConfig,
  FONT_OPTIONS,
  HistoryRecord,
  calcVisualScore,
  MeasureData,
} from './utils/fontMeasure';
import './App.css';

const DEFAULT_TEXT = `字体渲染测量仪 Font Rendering Tool

这是一段用于测试字体渲染效果的示例文字。
The quick brown fox jumps over the lazy dog.

汉字与英文字母的视觉对齐测试：
中文测试 中文测试 中文测试
English Test English Test

1234567890 !@#$%^&*()_+`;

const defaultConfigA: FontConfig = {
  fontFamily: FONT_OPTIONS[0].value,
  fontSize: 24,
  lineHeight: 1.5,
};

const defaultConfigB: FontConfig = {
  fontFamily: FONT_OPTIONS[1].value,
  fontSize: 24,
  lineHeight: 1.5,
};

function loadHistory(): HistoryRecord[] {
  try {
    const data = localStorage.getItem('font-measure-history');
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveHistory(history: HistoryRecord[]) {
  try {
    localStorage.setItem('font-measure-history', JSON.stringify(history));
  } catch {
    // ignore
  }
}

export default function App() {
  const [configA, setConfigA] = useState<FontConfig>(defaultConfigA);
  const [configB, setConfigB] = useState<FontConfig>(defaultConfigB);
  const [activePanel, setActivePanel] = useState<'A' | 'B'>('A');
  const [text, setText] = useState<string>(DEFAULT_TEXT);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [measureA, setMeasureA] = useState<MeasureData | null>(null);
  const [measureB, setMeasureB] = useState<MeasureData | null>(null);

  useEffect(() => {
    setHistory(loadHistory());
  }, []);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
      if (window.innerWidth >= 1024) {
        setSidebarOpen(false);
      }
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleConfigChange = useCallback((config: FontConfig, panel: 'A' | 'B') => {
    if (panel === 'A') {
      setConfigA(config);
    } else {
      setConfigB(config);
    }
  }, []);

  const handleActivePanelChange = useCallback((panel: 'A' | 'B') => {
    setActivePanel(panel);
  }, []);

  const addToHistory = useCallback(() => {
    const score = calcVisualScore(
      measureA?.charBounds || null,
      measureB?.charBounds || null,
      configA.fontSize,
      configB.fontSize
    );

    const record: HistoryRecord = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      configA: { ...configA },
      configB: { ...configB },
      measureA: measureA ? { ...measureA, charBounds: measureA.charBounds ? { ...measureA.charBounds } : null } : null,
      measureB: measureB ? { ...measureB, charBounds: measureB.charBounds ? { ...measureB.charBounds } : null } : null,
      score,
      text,
    };

    setHistory((prev) => {
      const next = [record, ...prev].slice(0, 20);
      saveHistory(next);
      return next;
    });
  }, [configA, configB, measureA, measureB, text]);

  const handleRestoreHistory = useCallback((record: HistoryRecord) => {
    setConfigA({ ...record.configA });
    setConfigB({ ...record.configB });
    if (record.text) {
      setText(record.text);
    }
    setMeasureA(record.measureA ? { ...record.measureA, charBounds: record.measureA.charBounds ? { ...record.measureA.charBounds } : null } : null);
    setMeasureB(record.measureB ? { ...record.measureB, charBounds: record.measureB.charBounds ? { ...record.measureB.charBounds } : null } : null);
    setSidebarOpen(false);
  }, []);

  const activeConfig = activePanel === 'A' ? configA : configB;

  return (
    <div className="app">
      <header className="app-header">
        <button
          className={`menu-btn ${sidebarOpen ? 'open' : ''}`}
          onClick={() => setSidebarOpen(!sidebarOpen)}
          style={{ display: isMobile ? 'flex' : 'none' }}
          aria-label="菜单"
        >
          <span className="menu-icon">
            <span className="menu-line" />
            <span className="menu-line" />
            <span className="menu-line" />
          </span>
        </button>
        <h1 className="app-title">字体渲染测量仪</h1>
        <div style={{ width: 120 }} />
      </header>

      <div className="app-body">
        {isMobile && sidebarOpen && (
          <div
            className="sidebar-overlay"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <aside
          className={`control-sidebar ${sidebarOpen ? 'open' : ''}`}
          style={{ display: isMobile && !sidebarOpen ? 'none' : 'flex' }}
        >
          <ControlPanel
            config={activeConfig}
            activePanel={activePanel}
            onConfigChange={handleConfigChange}
            history={history}
            onRestoreHistory={handleRestoreHistory}
          />
        </aside>

        <main className="main-content">
          <ComparisonView
            configA={configA}
            configB={configB}
            text={text}
            onConfigChange={handleConfigChange}
            onTextChange={setText}
            activePanel={activePanel}
            onActivePanelChange={handleActivePanelChange}
          />
        </main>
      </div>
    </div>
  );
}
