import { useEffect, useRef, useState } from 'react';
import { Download, Palette } from 'lucide-react';
import { useEditorStore, type SymmetryCount } from './store';
import { Canvas } from './components/Canvas';
import { ElementPanel } from './components/ElementPanel';
import { LayerPanel } from './components/LayerPanel';
import { ExportModal } from './components/ExportModal';

const App = () => {
  const canvasConfig = useEditorStore((s) => s.canvasConfig);
  const setCanvasConfig = useEditorStore((s) => s.setCanvasConfig);
  const showToast = useEditorStore((s) => s.showToast);
  const toast = useEditorStore((s) => s.toast);

  const svgRef = useRef<SVGSVGElement>(null);
  const [exportOpen, setExportOpen] = useState(false);
  const [fadeKey, setFadeKey] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [elementCollapsed, setElementCollapsed] = useState(false);
  const [layerCollapsed, setLayerCollapsed] = useState(false);
  const lastModeRef = useRef(canvasConfig.symmetryMode);

  useEffect(() => {
    if (lastModeRef.current !== canvasConfig.symmetryMode) {
      lastModeRef.current = canvasConfig.symmetryMode;
      setFadeKey((k) => k + 1);
    }
  }, [canvasConfig.symmetryMode]);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const handleMode = (mode: 'mirror' | 'rotational') => {
    setCanvasConfig({ symmetryMode: mode });
    showToast(mode === 'mirror' ? '已切换为镜像对称' : '已切换为旋转对称');
  };

  return (
    <div className="app">
      <header className="app-header">
        <div>
          <div className="app-title">
            <Palette size={24} style={{ display: 'inline', verticalAlign: '-4px', marginRight: 8, color: '#d4884a' }} />
            曼陀罗编辑器
          </div>
          <div className="app-subtitle">组合几何元素，创造你的专属对称图案</div>
        </div>
      </header>

      <div className="main-layout">
        <ElementPanel
          collapsed={isMobile && elementCollapsed}
          onToggle={isMobile ? () => setElementCollapsed(!elementCollapsed) : undefined}
        />

        <div>
          <Canvas ref={svgRef} fadeKey={fadeKey} />

          <div className="canvas-toolbar" style={{ marginTop: 16 }}>
            <div className="segmented" role="tablist">
              <button
                className={`segmented-btn ${canvasConfig.symmetryMode === 'rotational' ? 'active' : ''}`}
                onClick={() => handleMode('rotational')}
              >
                旋转对称
              </button>
              <button
                className={`segmented-btn ${canvasConfig.symmetryMode === 'mirror' ? 'active' : ''}`}
                onClick={() => handleMode('mirror')}
              >
                镜像对称
              </button>
            </div>

            {canvasConfig.symmetryMode === 'rotational' && (
              <select
                className="select-count"
                value={canvasConfig.symmetryCount}
                onChange={(e) => setCanvasConfig({ symmetryCount: parseInt(e.target.value) as SymmetryCount })}
              >
                <option value={4}>4 份</option>
                <option value={6}>6 份</option>
                <option value={8}>8 份</option>
                <option value={12}>12 份</option>
              </select>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 12, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                角度偏移
              </span>
              <input
                className="offset-slider"
                type="range"
                min={-30}
                max={30}
                step={1}
                value={canvasConfig.angleOffset}
                onChange={(e) => setCanvasConfig({ angleOffset: parseInt(e.target.value) })}
              />
              <span className="control-value" style={{ whiteSpace: 'nowrap' }}>
                {canvasConfig.angleOffset}°
              </span>
            </div>

            <button className="btn-primary" onClick={() => setExportOpen(true)}>
              <Download size={16} />
              导出
            </button>
          </div>
        </div>

        <LayerPanel
          collapsed={isMobile && layerCollapsed}
          onToggle={isMobile ? () => setLayerCollapsed(!layerCollapsed) : undefined}
        />
      </div>

      <ExportModal open={exportOpen} onClose={() => setExportOpen(false)} sourceRef={svgRef} />

      {toast && <div className="toast">{toast.message}</div>}
    </div>
  );
};

export default App;
