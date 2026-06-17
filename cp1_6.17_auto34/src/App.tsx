import FontInput from '@/components/FontInput';
import StyleSelector from '@/components/StyleSelector';
import CanvasRenderer from '@/components/CanvasRenderer';

export default function App() {
  return (
    <div style={styles.root}>
      <div style={styles.leftPanel}>
        <h1 style={styles.title}>字体风格转换</h1>
        <FontInput />
        <div style={styles.sectionLabel}>选择样式</div>
        <StyleSelector />
      </div>
      <div style={styles.rightPanel}>
        <CanvasRenderer />
      </div>
      <style>{`
        @media (max-width: 768px) {
          .app-layout {
            flex-direction: column !important;
          }
          .left-panel {
            width: 100% !important;
            min-width: unset !important;
            max-width: unset !important;
            border-right: none !important;
            border-bottom: 1px solid #333 !important;
          }
          .right-panel {
            width: 100% !important;
          }
        }
      `}</style>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  root: {
    display: 'flex',
    width: '100%',
    minHeight: '100vh',
    background: '#121212',
    color: '#E0E0E0',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  leftPanel: {
    width: '30%',
    minWidth: 280,
    maxWidth: 380,
    background: '#1A1A1A',
    padding: '32px 24px',
    display: 'flex',
    flexDirection: 'column',
    gap: 24,
    borderRight: '1px solid #333',
    boxSizing: 'border-box',
  },
  rightPanel: {
    width: '70%',
    background: '#121212',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    boxSizing: 'border-box',
  },
  title: {
    fontSize: 22,
    fontWeight: 700,
    color: '#E0E0E0',
    margin: 0,
    letterSpacing: '0.5px',
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: 600,
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: '1px',
  },
};
