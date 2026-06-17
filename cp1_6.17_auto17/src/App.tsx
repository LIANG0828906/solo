import './App.css'
import CameraModule from './modules/camera/CameraModule'
import TextureModule from './modules/texture/TextureModule'
import { useStore } from './store'

function App() {
  const { stats } = useStore()

  return (
    <div className="app-container">
      <header className="app-header">
        <h1 className="app-title">纸张褶皱检测器</h1>
        <p className="app-subtitle">实时检测纸张表面褶皱并生成热力图</p>
      </header>

      <div className="main-layout">
        <div className="left-panel">
          <CameraModule />
          <div style={styles.statsPanel}>
            <div style={styles.statItem}>
              <span style={styles.statLabel}>平均褶皱强度:</span>
              <span style={styles.statValue}>{stats.averageIntensity.toFixed(1)}%</span>
            </div>
            <div style={styles.statItem}>
              <span style={styles.statLabel}>最大褶皱区域:</span>
              <span style={styles.statValue}>
                ({stats.maxWrinkleX}, {stats.maxWrinkleY})
              </span>
            </div>
          </div>
        </div>

        <div className="divider" />

        <div className="right-panel">
          <TextureModule />
        </div>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  statsPanel: {
    width: 640,
    maxWidth: '100%',
    marginTop: 16,
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    border: '2px solid #424242',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  statItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statLabel: {
    color: '#546E7A',
    fontSize: 14,
    fontWeight: 500,
  },
  statValue: {
    color: '#0D47A1',
    fontSize: 16,
    fontWeight: 600,
  },
}

export default App
