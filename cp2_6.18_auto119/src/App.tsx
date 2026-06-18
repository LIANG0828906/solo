import { useEffect, useState } from 'react';
import LayerPanel from './components/LayerPanel';
import PreviewCanvas from './components/PreviewCanvas';
import CodePanel from './components/CodePanel';

const App = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <div style={styles.app}>
      <header style={styles.header}>
        <div style={styles.logoWrap}>
          <div style={styles.logoIcon}>
            <div style={styles.logoInner1} />
            <div style={styles.logoInner2} />
          </div>
          <div>
            <h1 style={styles.logoText}>GradientFlow</h1>
            <p style={styles.logoSub}>多层 CSS 渐变叠加生成器</p>
          </div>
        </div>
        <div style={styles.tagList}>
          <span style={styles.tag}>最多 6 层</span>
          <span style={styles.tag}>实时预览</span>
          <span style={styles.tag}>CSS 导出</span>
        </div>
      </header>

      <main
        style={{
          ...styles.main,
          flexDirection: isMobile ? 'column' : 'row',
          alignItems: isMobile ? 'center' : 'flex-start',
        }}
      >
        <div
          style={{
            ...styles.leftCol,
            width: isMobile ? '100%' : undefined,
            maxWidth: isMobile ? 600 : undefined,
          }}
        >
          <LayerPanel />
        </div>

        <div
          style={{
            ...styles.centerCol,
            width: isMobile ? '100%' : 600,
            maxWidth: isMobile ? 600 : 600,
            alignSelf: isMobile ? 'center' : 'flex-start',
          }}
        >
          <PreviewCanvas />
        </div>

        <div
          style={{
            ...styles.rightCol,
            width: isMobile ? '100%' : undefined,
            maxWidth: isMobile ? 600 : undefined,
          }}
        >
          <CodePanel />
        </div>
      </main>

      <footer style={styles.footer}>
        <span>
          GradientFlow · 拖动层卡片排序 · 所有数据存储在浏览器本地
        </span>
      </footer>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  app: {
    minHeight: '100vh',
    background: '#0f0f1a',
    padding: '20px 24px 30px',
    display: 'flex',
    flexDirection: 'column',
    gap: 22,
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
  },
  logoWrap: { display: 'flex', alignItems: 'center', gap: 12 },
  logoIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    position: 'relative',
    overflow: 'hidden',
    boxShadow: '0 6px 20px rgba(167,139,250,0.25)',
  },
  logoInner1: {
    position: 'absolute',
    inset: 0,
    background: 'linear-gradient(135deg, #a78bfa, #f368e0)',
  },
  logoInner2: {
    position: 'absolute',
    inset: 0,
    background: 'radial-gradient(circle at 30% 70%, rgba(96,165,250,0.9), transparent 60%), conic-gradient(from 180deg, rgba(72,219,251,0.7), transparent 40%)',
    mixBlendMode: 'screen',
  },
  logoText: {
    fontSize: 22,
    fontWeight: 800,
    margin: 0,
    background: 'linear-gradient(135deg, #e2e8f0, #a78bfa)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    letterSpacing: -0.5,
  },
  logoSub: {
    fontSize: 11,
    color: '#64748b',
    margin: 0,
    marginTop: 2,
  },
  tagList: { display: 'flex', gap: 6, flexWrap: 'wrap' },
  tag: {
    fontSize: 10.5,
    color: '#a78bfa',
    background: 'rgba(167,139,250,0.1)',
    border: '1px solid rgba(167,139,250,0.2)',
    padding: '4px 10px',
    borderRadius: 999,
    fontWeight: 500,
  },
  main: {
    display: 'flex',
    gap: 20,
    flex: 1,
    justifyContent: 'center',
    width: '100%',
    maxWidth: 1400,
    margin: '0 auto',
  },
  leftCol: {
    flexShrink: 0,
  },
  centerCol: {
    flexShrink: 0,
    display: 'flex',
    justifyContent: 'center',
  },
  rightCol: {
    flex: 1,
    minWidth: 320,
  },
  footer: {
    textAlign: 'center',
    fontSize: 11,
    color: '#475569',
    paddingTop: 8,
    borderTop: '1px solid #1e1e2e',
    marginTop: 10,
  },
};

export default App;
