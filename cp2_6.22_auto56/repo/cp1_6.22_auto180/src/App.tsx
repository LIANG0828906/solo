import { useEffect, useState } from 'react';
import Editor from './components/Editor';
import { collaborationService } from './services/CollaborationService';

function App() {
  const [screenTooSmall, setScreenTooSmall] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const checkWidth = () => {
      setScreenTooSmall(window.innerWidth < 1024);
    };
    checkWidth();
    window.addEventListener('resize', checkWidth);
    return () => window.removeEventListener('resize', checkWidth);
  }, []);

  useEffect(() => {
    const userName = `用户${Math.floor(Math.random() * 1000)}`;
    collaborationService.connect('default-room', userName);
    setIsConnected(true);

    return () => {
      collaborationService.disconnect();
    };
  }, []);

  if (screenTooSmall) {
    return (
      <div style={styles.smallScreenWarning}>
        <div style={styles.warningContent}>
          <div style={styles.warningIcon}>⚠️</div>
          <h1 style={styles.warningTitle}>屏幕尺寸过小</h1>
          <p style={styles.warningText}>
            本编辑器需要至少 1024px 的屏幕宽度才能正常使用。
            <br />
            请使用更大的屏幕或调整浏览器窗口大小。
          </p>
          <p style={styles.warningHint}>当前宽度: {window.innerWidth}px</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.app}>
      <Editor isConnected={isConnected} />
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  app: {
    width: '100%',
    height: '100vh',
    overflow: 'hidden',
    backgroundColor: '#FAFAFA',
  },
  smallScreenWarning: {
    width: '100vw',
    height: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FAFAFA',
    padding: '24px',
    boxSizing: 'border-box',
  },
  warningContent: {
    textAlign: 'center',
    maxWidth: 480,
  },
  warningIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  warningTitle: {
    fontSize: 24,
    fontWeight: 700,
    color: '#1F2937',
    margin: 0,
    marginBottom: 12,
  },
  warningText: {
    fontSize: 16,
    color: '#4B5563',
    lineHeight: 1.6,
    margin: 0,
    marginBottom: 16,
  },
  warningHint: {
    fontSize: 14,
    color: '#9CA3AF',
    margin: 0,
  },
};

export default App;
