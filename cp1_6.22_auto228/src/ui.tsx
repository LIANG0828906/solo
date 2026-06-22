import React from 'react';
import { ModelMode, Measurement, AtomType, ElementType, HistoryEntry } from './types';

interface LeftPanelProps {
  modelMode: ModelMode;
  onModelModeChange: (mode: ModelMode) => void;
  isMeasuring: boolean;
  onToggleMeasuring: () => void;
  onClearMeasurements: () => void;
  measurementCount: number;
  clippingRadius: number;
  onClippingRadiusChange: (radius: number) => void;
  onUndo: () => void;
  onRedo: () => void;
  onResetCamera: () => void;
  canUndo: boolean;
  canRedo: boolean;
  history: HistoryEntry[];
}

const ELEMENT_LABELS: Record<ElementType, string> = {
  C: '碳 (C)',
  O: '氧 (O)',
  N: '氮 (N)',
  S: '硫 (S)',
  H: '氢 (H)',
};

export const LeftPanel: React.FC<LeftPanelProps> = ({
  modelMode,
  onModelModeChange,
  isMeasuring,
  onToggleMeasuring,
  onClearMeasurements,
  measurementCount,
  clippingRadius,
  onClippingRadiusChange,
  onUndo,
  onRedo,
  onResetCamera,
  canUndo,
  canRedo,
  history,
}) => {
  return (
    <div className="panel left-panel">
      <div className="panel-section">
        <h3 className="panel-title">模型显示</h3>
        <select
          className="model-select"
          value={modelMode}
          onChange={(e) => onModelModeChange(e.target.value as ModelMode)}
        >
          <option value="ball-stick">球棍模型</option>
          <option value="cartoon">卡通模型</option>
          <option value="wireframe">线框模型</option>
        </select>
      </div>

      <div className="panel-section">
        <h3 className="panel-title">测量工具</h3>
        <div className="tool-group">
          <button
            className={`tool-btn ${isMeasuring ? 'active' : ''}`}
            onClick={onToggleMeasuring}
            title="距离测量"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M2 20h20M5 20V4M19 20V4M5 12h14M5 8h2M5 16h2M17 8h2M17 16h2M9 10h2M13 14h2" />
            </svg>
            <span>{isMeasuring ? '测量中...' : '测量距离'}</span>
          </button>
          <button
            className="tool-btn"
            onClick={onClearMeasurements}
            disabled={measurementCount === 0}
            title="清除所有测量"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
            <span>清除测量</span>
          </button>
        </div>
        {measurementCount > 0 && (
          <div className="measurement-count">已有 {measurementCount}/5 组测量</div>
        )}
      </div>

      <div className="panel-section">
        <h3 className="panel-title">裁剪分析</h3>
        <div className="slider-container">
          <label className="slider-label">
            裁剪半径: <strong>{clippingRadius.toFixed(0)} Å</strong>
          </label>
          <input
            type="range"
            min="5"
            max="30"
            step="1"
            value={clippingRadius}
            onChange={(e) => onClippingRadiusChange(Number(e.target.value))}
            className="clipping-slider"
          />
          <div className="slider-range">
            <span>5Å</span>
            <span>30Å</span>
          </div>
        </div>
      </div>

      <div className="panel-section">
        <h3 className="panel-title">历史操作</h3>
        <div className="history-buttons">
          <button
            className="history-btn"
            onClick={onUndo}
            disabled={!canUndo}
            title="上一步"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 10h13a4 4 0 010 8H9M3 10l4-4M3 10l4 4" />
            </svg>
            上一步
          </button>
          <button
            className="history-btn"
            onClick={onRedo}
            disabled={!canRedo}
            title="下一步"
          >
            下一步
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 10H8a4 4 0 000 8h7M21 10l-4-4M21 10l-4 4" />
            </svg>
          </button>
        </div>
        <button className="reset-btn" onClick={onResetCamera}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M1 4v6h6M23 20v-6h-6" />
            <path d="M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15" />
          </svg>
          重置视角
        </button>
        {history.length > 0 && (
          <div className="history-list">
            {history.slice(-5).map((entry, i) => (
              <div key={i} className="history-item">
                <span className="history-dot" />
                {entry.type === 'selection' && '选择操作'}
                {entry.type === 'clipping' && '裁剪设置'}
                {entry.type === 'model-switch' && '模型切换'}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

interface RightPanelProps {
  selectedAtoms: AtomType[];
  measurements: Measurement[];
  atomMap: Map<number, AtomType>;
}

export const RightPanel: React.FC<RightPanelProps> = ({
  selectedAtoms,
  measurements,
  atomMap,
}) => {
  const elementCounts: Record<string, number> = {};
  let avgX = 0, avgY = 0, avgZ = 0;

  if (selectedAtoms.length > 0) {
    for (const atom of selectedAtoms) {
      elementCounts[atom.element] = (elementCounts[atom.element] || 0) + 1;
      avgX += atom.x;
      avgY += atom.y;
      avgZ += atom.z;
    }
    avgX /= selectedAtoms.length;
    avgY /= selectedAtoms.length;
    avgZ /= selectedAtoms.length;
  }

  return (
    <div className="panel right-panel">
      <div className="panel-section">
        <h3 className="panel-title">原子信息</h3>
        {selectedAtoms.length === 0 ? (
          <div className="info-empty">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="1.5">
              <circle cx="12" cy="12" r="3" />
              <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
            </svg>
            <p>点击或框选原子查看信息</p>
            <p className="info-hint">按住 Shift 拖拽框选</p>
          </div>
        ) : (
          <div className="info-content">
            <div className="info-row">
              <span className="info-label">选中原子数</span>
              <span className="info-value">{selectedAtoms.length}</span>
            </div>
            <div className="info-row">
              <span className="info-label">平均坐标</span>
              <span className="info-value mono">
                ({avgX.toFixed(2)}, {avgY.toFixed(2)}, {avgZ.toFixed(2)})
              </span>
            </div>
            <div className="info-section">
              <span className="info-label">元素组成</span>
              <div className="element-chips">
                {Object.entries(elementCounts).map(([el, count]) => (
                  <span key={el} className={`element-chip element-${el.toLowerCase()}`}>
                    {el}: {count}
                  </span>
                ))}
              </div>
            </div>
            <div className="info-section">
              <span className="info-label">残基列表</span>
              <div className="residue-list">
                {[...new Set(selectedAtoms.map(a => `${a.residueName}${a.residueId}`))].slice(0, 10).map(r => (
                  <span key={r} className="residue-chip">{r}</span>
                ))}
                {new Set(selectedAtoms.map(a => a.residueId)).size > 10 && (
                  <span className="residue-chip more">...</span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="panel-section">
        <h3 className="panel-title">测量结果</h3>
        {measurements.length === 0 ? (
          <div className="info-empty small">
            <p>点击测量工具开始测量</p>
          </div>
        ) : (
          <div className="measurement-list">
            {measurements.map((m) => {
              const a1 = atomMap.get(m.atom1Id);
              const a2 = atomMap.get(m.atom2Id);
              return (
                <div key={m.id} className="measurement-item">
                  <span className="measurement-dot" />
                  <span className="measurement-text">
                    {a1?.atomName || '?'}({a1?.residueName || ''}{a1?.residueId || ''})
                    {' → '}
                    {a2?.atomName || '?'}({a2?.residueName || ''}{a2?.residueId || ''})
                  </span>
                  <span className="measurement-distance">{m.distance.toFixed(2)} Å</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
