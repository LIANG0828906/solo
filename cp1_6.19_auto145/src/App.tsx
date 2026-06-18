import React from 'react';
import { PortfolioProvider } from './hooks/usePortfolio';
import PortfolioBuilder from './components/PortfolioBuilder';
import ChartPanel from './components/ChartPanel';

export default function App() {
  return (
    <PortfolioProvider>
      <div style={styles.app}>
        <header style={styles.header}>
          <h1 style={styles.headerTitle}>投资组合构建器</h1>
          <span style={styles.headerSub}>
            标签式组合构建 · 收益曲线模拟 · 风险评级分析
          </span>
        </header>
        <div className="main-layout" style={styles.main}>
          <div className="left-panel" style={styles.left}>
            <PortfolioBuilder />
          </div>
          <div className="right-panel" style={styles.right}>
            <ChartPanel />
          </div>
        </div>
      </div>
      <style>{globalCSS}</style>
    </PortfolioProvider>
  );
}

const globalCSS = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { background: #0F0F1E; color: #D0D0E0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-track { background: #0F0F1E; }
  ::-webkit-scrollbar-thumb { background: #2A2A50; border-radius: 3px; }
  @keyframes spin { to { transform: rotate(360deg); } }
  @media (max-width: 1024px) {
    .main-layout { flex-direction: column !important; }
    .left-panel { width: 100% !important; border-right: none !important; border-bottom: 1px solid #2A2A50 !important; }
    .right-panel { width: 100% !important; }
  }
`;

const styles: Record<string, React.CSSProperties> = {
  app: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    padding: '16px 24px',
    borderBottom: '1px solid #2A2A50',
    display: 'flex',
    alignItems: 'baseline',
    gap: '16px',
  },
  headerTitle: {
    fontSize: '22px',
    fontWeight: 800,
    color: '#D0D0E0',
  },
  headerSub: {
    fontSize: '13px',
    color: '#555577',
  },
  main: {
    display: 'flex',
    flex: 1,
    overflow: 'hidden',
  },
  left: {
    width: '35%',
    borderRight: '1px solid #2A2A50',
    overflow: 'auto',
  },
  right: {
    width: '65%',
    overflow: 'auto',
  },
};
