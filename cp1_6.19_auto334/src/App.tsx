import { useRef, useState, useEffect } from 'react';
import * as THREE from 'three';
import { SceneCanvas } from './Scene3D';
import ControlPanel from './ControlPanel';
import ComparisonView from './ComparisonView';
import { useAppStore, Snapshot } from './store';

function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp);
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const seconds = date.getSeconds().toString().padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
}

function SnapshotList() {
  const { snapshots, loadSnapshot, deleteSnapshot } = useAppStore();

  return (
    <div className="snapshot-panel" style={styles.snapshotPanel}>
      <div style={styles.snapshotTitle}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64B5F6" strokeWidth="2">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <polyline points="21 15 16 10 5 21" />
        </svg>
        <span>历史快照</span>
      </div>
      <div style={styles.snapshotList}>
        {snapshots.length === 0 ? (
          <div style={styles.emptyState}>
            <p style={styles.emptyText}>暂无快照</p>
            <p style={styles.emptyHint}>点击"保存快照"按钮保存当前状态</p>
          </div>
        ) : (
          snapshots.map((snapshot: Snapshot) => (
            <div
              key={snapshot.id}
              className="snapshot-item"
              style={styles.snapshotItem}
              onClick={() => loadSnapshot(snapshot.id)}
            >
              <img src={snapshot.thumbnail} alt="" style={styles.thumbnail} />
              <div style={styles.snapshotInfo}>
                <div style={styles.snapshotTime}>
                  {formatTimestamp(snapshot.timestamp)}
                </div>
                <div style={styles.snapshotMeta}>
                  {snapshot.materialParams.textureType}
                </div>
              </div>
              <button
                className="delete-btn"
                style={styles.deleteBtn}
                onClick={(e) => {
                  e.stopPropagation();
                  deleteSnapshot(snapshot.id);
                }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default function App() {
  const glRef = useRef<THREE.WebGLRenderer | null>(null);
  const { comparisonMode, toggleComparisonMode, saveSnapshot, maxSnapshots, snapshots } = useAppStore();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleSaveSnapshot = () => {
    if (!glRef.current) return;

    const renderer = glRef.current;
    const canvas = renderer.domElement;

    const thumbnailCanvas = document.createElement('canvas');
    thumbnailCanvas.width = 120;
    thumbnailCanvas.height = 90;
    const ctx = thumbnailCanvas.getContext('2d')!;
    ctx.drawImage(canvas, 0, 0, 120, 90);

    const thumbnail = thumbnailCanvas.toDataURL('image/jpeg', 0.8);
    saveSnapshot(thumbnail);
  };

  return (
    <div style={styles.app}>
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <button
            className={`compare-btn ${comparisonMode ? 'compare-btn-active' : ''}`}
            style={{
              ...styles.compareBtn,
              ...(comparisonMode ? styles.compareBtnActive : {}),
            }}
            onClick={toggleComparisonMode}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="18" />
              <rect x="14" y="3" width="7" height="18" />
            </svg>
            <span style={{ marginLeft: '6px' }}>对比</span>
          </button>
        </div>
        <h1 style={styles.appTitle}>纹理工坊</h1>
        <div style={styles.headerRight}>
          <span style={styles.snapshotCount}>
            {snapshots.length}/{maxSnapshots} 快照
          </span>
        </div>
      </header>

      <main style={styles.main}>
        <SnapshotList />

        <div
          style={{
            ...styles.sceneContainer,
            ...(isMobile ? styles.sceneContainerMobile : {}),
          }}
        >
          {comparisonMode ? (
            <ComparisonView glRef={glRef} />
          ) : (
            <SceneCanvas glRef={glRef} />
          )}

          <div style={styles.bottomToolbar}>
            <button className="save-btn" style={styles.saveBtn} onClick={handleSaveSnapshot}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                <polyline points="17 21 17 13 7 13 7 21" />
                <polyline points="7 3 7 8 15 8" />
              </svg>
              <span style={{ marginLeft: '6px' }}>保存快照</span>
            </button>
          </div>
        </div>

        {!isMobile && <ControlPanel />}
      </main>

      {isMobile && (
        <div style={styles.mobileControlPanel}>
          <ControlPanel />
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .control-panel-desktop {
            display: none !important;
          }
          .snapshot-panel {
            width: 140px !important;
          }
        }
      `}</style>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  app: {
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#1a1a2e',
    overflow: 'hidden',
  },
  header: {
    height: '56px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 20px',
    background: 'rgba(26, 26, 46, 0.95)',
    backdropFilter: 'blur(10px)',
    borderBottom: '1px solid rgba(100, 181, 246, 0.2)',
    zIndex: 200,
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    minWidth: '120px',
    justifyContent: 'flex-end',
  },
  appTitle: {
    fontSize: '18px',
    fontWeight: 600,
    color: '#e0e0e0',
    fontFamily: "'Microsoft YaHei', 'Segoe UI', sans-serif",
    paddingBottom: '2px',
    borderBottom: '2px solid #64B5F6',
    letterSpacing: '1px',
  },
  compareBtn: {
    display: 'flex',
    alignItems: 'center',
    padding: '8px 14px',
    background: 'rgba(42, 42, 62, 0.8)',
    color: '#b0b0b0',
    borderRadius: '4px',
    fontSize: '13px',
    fontWeight: 500,
    transition: 'all 0.2s ease',
  },
  compareBtnActive: {
    background: '#64B5F6',
    color: '#ffffff',
  },
  snapshotCount: {
    fontSize: '12px',
    color: '#808080',
  },
  main: {
    flex: 1,
    display: 'flex',
    position: 'relative',
    overflow: 'hidden',
  },
  sceneContainer: {
    flex: 1,
    position: 'relative',
    marginLeft: '200px',
    marginRight: '200px',
    overflow: 'hidden',
  },
  sceneContainerMobile: {
    marginLeft: '0',
    marginRight: '0',
    marginBottom: '300px',
  },
  bottomToolbar: {
    position: 'absolute',
    bottom: '20px',
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: 50,
  },
  saveBtn: {
    display: 'flex',
    alignItems: 'center',
    padding: '10px 20px',
    background: '#64B5F6',
    color: '#ffffff',
    borderRadius: '4px',
    fontSize: '14px',
    fontWeight: 600,
    boxShadow: '0 4px 12px rgba(100, 181, 246, 0.4)',
    transition: 'all 0.2s ease',
  },
  snapshotPanel: {
    position: 'fixed',
    left: 0,
    top: '56px',
    width: '200px',
    height: 'calc(100% - 56px)',
    background: 'rgba(26, 26, 46, 0.9)',
    backdropFilter: 'blur(10px)',
    borderRight: '1px solid rgba(100, 181, 246, 0.2)',
    zIndex: 100,
    display: 'flex',
    flexDirection: 'column',
  },
  snapshotTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '16px',
    fontSize: '14px',
    fontWeight: 600,
    color: '#e0e0e0',
    borderBottom: '1px solid rgba(100, 181, 246, 0.2)',
  },
  snapshotList: {
    flex: 1,
    overflowY: 'auto',
    padding: '12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  snapshotItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '8px',
    background: 'rgba(42, 42, 62, 0.6)',
    borderRadius: '4px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    position: 'relative',
  },
  thumbnail: {
    width: '60px',
    height: '45px',
    objectFit: 'cover',
    borderRadius: '3px',
    border: '1px solid rgba(100, 181, 246, 0.3)',
  },
  snapshotInfo: {
    flex: 1,
    minWidth: 0,
  },
  snapshotTime: {
    fontSize: '12px',
    color: '#e0e0e0',
    fontWeight: 500,
  },
  snapshotMeta: {
    fontSize: '11px',
    color: '#808080',
    marginTop: '2px',
  },
  deleteBtn: {
    position: 'absolute',
    top: '4px',
    right: '4px',
    width: '20px',
    height: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(255, 100, 100, 0.2)',
    color: '#ff6b6b',
    borderRadius: '3px',
    fontSize: '10px',
    opacity: 0,
    transition: 'opacity 0.2s ease',
  },
  emptyState: {
    textAlign: 'center',
    padding: '40px 16px',
  },
  emptyText: {
    fontSize: '13px',
    color: '#606060',
    marginBottom: '6px',
  },
  emptyHint: {
    fontSize: '11px',
    color: '#505050',
    lineHeight: 1.5,
  },
  mobileControlPanel: {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 150,
    maxHeight: '300px',
    overflowY: 'auto',
  },
};


