import { useState, useRef, useMemo, useEffect, useCallback } from 'react';
import ControlPanel from '@/components/ControlPanel';
import Scene3D, { type Scene3DHandle } from '@/components/Scene3D';
import {
  calculateTopology,
  type TopologyMode,
  type TopologyResult,
  type InteractionMode,
  type TopologyInfo,
} from '@/utils/topologyCalculator';
import { exportPNG, exportJSON } from '@/utils/exportHelper';

const DEFAULT_CENTERS: Record<string, [number, number, number]> = {
  'knot-0': [4.0, 0, 0],
  'knot-1': [0, 0, 4.0],
  'knot-2': [-4.0, 0, 0],
  'knot-3': [0, 0, -4.0],
};

export default function App() {
  const [particleCount, setParticleCount] = useState(400);
  const [speed, setSpeed] = useState(1.0);
  const [topologyMode, setTopologyMode] = useState<TopologyMode>('torus');
  const [interactionMode, setInteractionMode] = useState<InteractionMode>('play');
  const [panelCollapsed, setPanelCollapsed] = useState(false);
  const [selectedKnotId, setSelectedKnotId] = useState<string | null>(null);
  const [knotCenters, setKnotCenters] = useState<Record<string, [number, number, number]>>({ ...DEFAULT_CENTERS });

  const sceneRef = useRef<Scene3DHandle>(null);

  const topologyData: TopologyResult = useMemo(() => {
    return calculateTopology({
      mode: topologyMode,
      particleCount,
      speed,
      knotCenters,
    });
  }, [topologyMode, particleCount, knotCenters]);

  const selectedKnotInfo: TopologyInfo | undefined = useMemo(() => {
    if (!selectedKnotId) return undefined;
    return topologyData.knotInfos.find(k => k.knotId === selectedKnotId);
  }, [selectedKnotId, topologyData.knotInfos]);

  const handleKnotCenterChange = useCallback((knotId: string, center: [number, number, number]) => {
    setKnotCenters(prev => ({ ...prev, [knotId]: center }));
  }, []);

  const handleExportPNG = async () => {
    const canvas = sceneRef.current?.getCanvas();
    if (!canvas) {
      const dataUrl = sceneRef.current?.captureScreenshot();
      if (dataUrl) {
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = `quantum-topology-${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
      return;
    }
    try {
      await exportPNG(canvas, `quantum-topology-${Date.now()}.png`);
    } catch (e) {
      const dataUrl = sceneRef.current?.captureScreenshot();
      if (dataUrl) {
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = `quantum-topology-${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    }
  };

  const handleExportJSON = () => {
    exportJSON(topologyData.particles, `quantum-topology-${Date.now()}.json`);
  };

  const autoRotate = interactionMode !== 'edit';

  return (
    <div className="app-root">
      <div className="title-badge">
        <span className="title-badge-icon" />
        <span className="title-badge-text">Quantum Topology Workshop</span>
      </div>

      <Scene3D
        ref={sceneRef}
        topologyData={topologyData}
        speed={speed}
        interactionMode={interactionMode}
        selectedKnotId={selectedKnotId}
        onKnotSelect={setSelectedKnotId}
        knotCenters={knotCenters}
        onKnotCenterChange={handleKnotCenterChange}
        autoRotate={autoRotate}
      />

      <ControlPanel
        particleCount={particleCount}
        speed={speed}
        topologyMode={topologyMode}
        collapsed={panelCollapsed}
        onToggleCollapsed={() => setPanelCollapsed(c => !c)}
        onParticleCountChange={setParticleCount}
        onSpeedChange={setSpeed}
        onTopologyModeChange={setTopologyMode}
      />

      <div className={`info-panel ${selectedKnotInfo ? 'visible' : ''}`}>
        <div className="info-header">
          <div className="info-knot-name">{selectedKnotInfo?.name ?? '拓扑信息'}</div>
          <button
            type="button"
            className="info-close"
            onClick={() => setSelectedKnotId(null)}
          >
            ✕
          </button>
        </div>
        <div className="info-row" data-key="winding">
          <div className="info-row-label">绕数 Winding</div>
          <div className="info-row-value">{selectedKnotInfo?.windingNumber ?? '—'}</div>
        </div>
        <div className="info-row" data-key="crossing">
          <div className="info-row-label">交点数 Crossing</div>
          <div className="info-row-value">{selectedKnotInfo?.crossingNumber ?? '—'}</div>
        </div>
        <div className="info-row" data-key="energy">
          <div className="info-row-label">能量值 Energy</div>
          <div className="info-row-value">{selectedKnotInfo?.energyValue?.toFixed(2) ?? '—'}</div>
        </div>
        <div className="info-row" data-key="genus">
          <div className="info-row-label">亏格 Genus</div>
          <div className="info-row-value">{selectedKnotInfo?.genus ?? '—'}</div>
        </div>
      </div>

      <div className="toolbar" data-mode={interactionMode}>
        <button
          type="button"
          className={`tool-btn ${interactionMode === 'edit' ? 'active' : ''}`}
          data-color="cyan"
          onClick={() => setInteractionMode('edit')}
        >
          <span className="tool-btn-icon">✏</span>
          <span>编辑</span>
        </button>
        <button
          type="button"
          className={`tool-btn ${interactionMode === 'play' ? 'active' : ''}`}
          data-color="emerald"
          onClick={() => setInteractionMode('play')}
        >
          <span className="tool-btn-icon">▶</span>
          <span>播放</span>
        </button>
        <div className="tool-divider" />
        <button
          type="button"
          className={`tool-btn ${interactionMode === 'export' ? 'active' : ''}`}
          data-color="amber"
          onClick={() => setInteractionMode(m => m === 'export' ? 'play' : 'export')}
        >
          <span className="tool-btn-icon">⬇</span>
          <span>导出</span>
        </button>
        <div className={`export-options ${interactionMode === 'export' ? 'visible' : ''}`}>
          <button type="button" className="export-btn" onClick={handleExportPNG}>
            <span>🖼</span> PNG 截图
          </button>
          <button type="button" className="export-btn" onClick={handleExportJSON}>
            <span>📄</span> JSON 坐标
          </button>
        </div>
      </div>
    </div>
  );
}
