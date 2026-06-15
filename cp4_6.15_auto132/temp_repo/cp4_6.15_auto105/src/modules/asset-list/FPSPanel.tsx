import { useState } from 'react';
import { Activity, ChevronDown, Gauge } from 'lucide-react';
import { useFPSMonitor } from '../../hooks/useFPSMonitor';
import './FPSPanel.css';

interface FPSPanelProps {
  defaultCollapsed?: boolean;
  performanceMode: boolean;
  onTogglePerformanceMode: () => void;
}

function getFpsColor(fps: number): string {
  if (fps >= 55) return '#10b981';
  if (fps >= 30) return '#f59e0b';
  return '#ef4444';
}

function getFpsLabel(fps: number): string {
  if (fps >= 55) return '流畅';
  if (fps >= 30) return '一般';
  return '卡顿';
}

export function FPSPanel({
  defaultCollapsed = true,
  performanceMode,
  onTogglePerformanceMode,
}: FPSPanelProps) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  const fps = useFPSMonitor(!isCollapsed);

  const currentColor = getFpsColor(fps.current);
  const averageColor = getFpsColor(fps.average);

  if (isCollapsed) {
    return (
      <button
        className="fps-panel-collapsed"
        onClick={() => setIsCollapsed(false)}
        title="展开性能监控"
      >
        <Activity size={16} />
      </button>
    );
  }

  return (
    <div className="fps-panel">
      <div className="fps-panel-header">
        <div className="fps-panel-title">
          <Gauge size={16} />
          <span>性能监控</span>
        </div>
        <button
          className="fps-panel-collapse-btn"
          onClick={() => setIsCollapsed(true)}
          title="收起"
        >
          <ChevronDown size={16} />
        </button>
      </div>

      <div className="fps-panel-content">
        <div className="fps-item">
          <span className="fps-label">当前 FPS</span>
          <span className="fps-value" style={{ color: currentColor }}>
            {fps.current}
          </span>
          <span className="fps-status" style={{ background: currentColor }}>
            {getFpsLabel(fps.current)}
          </span>
        </div>

        <div className="fps-item">
          <span className="fps-label">平均 FPS</span>
          <span className="fps-value" style={{ color: averageColor }}>
            {fps.average}
          </span>
        </div>

        <div className="fps-legend">
          <div className="legend-item">
            <span className="legend-dot" style={{ background: '#10b981' }} />
            <span>≥ 55 流畅</span>
          </div>
          <div className="legend-item">
            <span className="legend-dot" style={{ background: '#f59e0b' }} />
            <span>30-55 一般</span>
          </div>
          <div className="legend-item">
            <span className="legend-dot" style={{ background: '#ef4444' }} />
            <span>&lt; 30 卡顿</span>
          </div>
        </div>

        <div className="fps-divider" />

        <div className="performance-mode-section">
          <span className="performance-label">性能模式</span>
          <button
            className={`performance-toggle ${performanceMode ? 'active' : ''}`}
            onClick={onTogglePerformanceMode}
          >
            <span className="toggle-track">
              <span className="toggle-thumb" />
            </span>
            <span className="toggle-label">
              {performanceMode ? '已开启' : '已关闭'}
            </span>
          </button>
        </div>

        <p className="performance-hint">
          性能模式下使用静态缩略图替代实时 3D 渲染，提升滚动流畅度
        </p>
      </div>
    </div>
  );
}
