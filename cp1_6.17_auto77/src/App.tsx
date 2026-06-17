import { useEffect, useRef, useState, useCallback } from 'react';
import { SceneManager, SceneStats, CameraMode } from './SceneManager';
import { BlockType } from './BlockGrid';
import './App.css';

interface MaterialOption {
  type: BlockType;
  name: string;
  color: string;
}

const MATERIALS: MaterialOption[] = [
  { type: BlockType.Dirt, name: '泥土', color: '#8B5E3C' },
  { type: BlockType.Stone, name: '石头', color: '#808080' },
  { type: BlockType.Wood, name: '木材', color: '#DEB887' },
  { type: BlockType.Metal, name: '金属', color: '#A9A9A9' },
  { type: BlockType.Glow, name: '发光', color: '#FFD700' },
];

function App() {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneManagerRef = useRef<SceneManager | null>(null);
  const cursorRef = useRef<HTMLDivElement>(null);

  const [selectedMaterial, setSelectedMaterial] = useState<BlockType>(BlockType.Dirt);
  const [cameraMode, setCameraMode] = useState<CameraMode>('isometric');
  const [stats, setStats] = useState<SceneStats>({
    totalBlocks: 0,
    placedCount: 0,
    destroyedCount: 0,
  });

  useEffect(() => {
    if (!containerRef.current) return;

    const sceneManager = new SceneManager({
      container: containerRef.current,
      onStatsChange: (newStats) => {
        setStats(newStats);
      },
      onCameraModeChange: (mode) => {
        setCameraMode(mode);
      },
    });

    sceneManagerRef.current = sceneManager;
    sceneManager.start();

    return () => {
      sceneManager.dispose();
      sceneManagerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (cursorRef.current) {
        cursorRef.current.style.left = `${e.clientX}px`;
        cursorRef.current.style.top = `${e.clientY}px`;
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  const handleMaterialSelect = useCallback((type: BlockType) => {
    setSelectedMaterial(type);
    if (sceneManagerRef.current) {
      sceneManagerRef.current.setSelectedMaterial(type);
    }
  }, []);

  const handleToggleCamera = useCallback(() => {
    if (sceneManagerRef.current) {
      sceneManagerRef.current.toggleCameraMode();
    }
  }, []);

  const selectedMaterialInfo = MATERIALS.find((m) => m.type === selectedMaterial);

  return (
    <div className="app-container">
      <div ref={containerRef} className="scene-container" />

      <div
        ref={cursorRef}
        className="custom-cursor"
        style={
          {
            '--cursor-color': selectedMaterialInfo?.color || '#ffffff',
          } as React.CSSProperties
        }
      >
        <div className="cursor-crosshair">
          <div className="crosshair-h" />
          <div className="crosshair-v" />
        </div>
        <div className="cursor-ring" />
      </div>

      <div className="toolbar">
        <div className="toolbar-title">方块材质</div>
        <div className="toolbar-materials">
          {MATERIALS.map((material) => (
            <button
              key={material.type}
              className={`material-btn ${selectedMaterial === material.type ? 'active' : ''}`}
              onClick={() => handleMaterialSelect(material.type)}
              title={material.name}
              style={
                {
                  '--material-color': material.color,
                } as React.CSSProperties
              }
            >
              <div className="material-preview" />
              <span className="material-name">{material.name}</span>
            </button>
          ))}
        </div>
        <div className="toolbar-divider" />
        <div className="toolbar-info">
          <div className="info-item">
            <span className="info-label">左键</span>
            <span className="info-value">放置方块</span>
          </div>
          <div className="info-item">
            <span className="info-label">右键</span>
            <span className="info-value">破坏方块</span>
          </div>
          <div className="info-item">
            <span className="info-label">Ctrl+左键</span>
            <span className="info-value">破坏方块</span>
          </div>
          <div className="info-item">
            <span className="info-label">空格</span>
            <span className="info-value">切换视角</span>
          </div>
        </div>
      </div>

      <div className="status-bar">
        <div className="status-left">
          <span className="status-label">方块总数</span>
          <span className="status-count total-count">{stats.totalBlocks}</span>
        </div>
        <div className="status-right">
          <div className="status-item">
            <span className="status-label">已放置</span>
            <span className="status-count placed-count">{stats.placedCount}</span>
          </div>
          <div className="status-item">
            <span className="status-label">已破坏</span>
            <span className="status-count destroyed-count">{stats.destroyedCount}</span>
          </div>
        </div>
      </div>

      <button className="camera-toggle-btn" onClick={handleToggleCamera}>
        {cameraMode === 'isometric' ? '🔄 切换自由视角' : '🔄 切换等距视角'}
      </button>

      <div className="mode-indicator">
        {cameraMode === 'isometric' ? '等距俯视模式' : '自由旋转模式'}
        {cameraMode === 'free' && (
          <span className="mode-hint">（左键拖拽旋转，滚轮缩放）</span>
        )}
      </div>
    </div>
  );
}

export default App;
