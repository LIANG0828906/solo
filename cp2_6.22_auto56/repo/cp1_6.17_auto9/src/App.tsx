import { CameraModule } from './modules/camera/CameraModule'
import { TextureModule } from './modules/texture/TextureModule'

export default function App() {
  return (
    <div style={styles.app}>
      <style>{globalStyles}</style>
      <div style={styles.header}>
        <h1 style={styles.title}>纸张褶皱检测与纹理热力图生成器</h1>
        <div style={styles.subtitle}>Wrinkle Detection & Texture Heatmap Generator</div>
      </div>
      <div className="main-layout" style={styles.main}>
        <div className="panel-layout" style={styles.leftPanel}>
          <CameraModule />
        </div>
        <div className="divider-layout" style={styles.divider} />
        <div className="panel-layout" style={styles.rightPanel}>
          <TextureModule />
        </div>
      </div>
    </div>
  )
}

const globalStyles = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  * { box-sizing: border-box; }
  body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
  input[type="range"]::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: #1565C0;
    cursor: pointer;
    transition: box-shadow 0.3s ease;
  }
  input[type="range"]::-webkit-slider-thumb:hover {
    box-shadow: 0 0 0 4px rgba(21, 101, 192, 0.2);
  }
  input[type="range"]::-moz-range-thumb {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: #1565C0;
    cursor: pointer;
    border: none;
  }
  button:hover:not(:disabled) {
    background: #42A5F5 !important;
    box-shadow: 0 4px 8px rgba(0,0,0,0.15) !important;
  }
  button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  @media (max-width: 768px) {
    .main-layout {
      flex-direction: column !important;
    }
    .divider-layout {
      width: 100% !important;
      height: 2px !important;
    }
    .panel-layout {
      width: 100% !important;
    }
  }
`

const styles: Record<string, React.CSSProperties> = {
  app: {
    minHeight: '100vh',
    background: '#ECEFF1',
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    background: '#0D47A1',
    color: '#fff',
    padding: '20px 32px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
  },
  title: {
    margin: 0,
    fontSize: '22px',
    fontWeight: 600,
    letterSpacing: '0.5px',
  },
  subtitle: {
    fontSize: '13px',
    opacity: 0.8,
    marginTop: '4px',
    letterSpacing: '0.5px',
  },
  main: {
    flex: 1,
    display: 'flex',
  },
  leftPanel: {
    flex: 1,
    minWidth: 0,
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  rightPanel: {
    flex: 1,
    minWidth: 0,
    display: 'flex',
  },
  divider: {
    width: '2px',
    background: '#90A4AE',
    flexShrink: 0,
  },
}
