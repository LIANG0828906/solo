import React from 'react';
import { useAppStore } from '../stores/appStore';
import { moleculeKeys, moleculeMap } from '../data/molecules';
import type { DisplayMode } from '../types';

const UIOverlay: React.FC = () => {
  const {
    currentMolecule,
    selectedAtom,
    displayMode,
    measurements,
    isMeasuring,
    measureFirstAtom,
    setMolecule,
    setSelectedAtom,
    toggleDisplayMode,
    clearMeasurements,
    setIsMeasuring,
    setMeasureFirstAtom,
  } = useAppStore();

  const handleMoleculeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setMolecule(e.target.value);
  };

  const handleDisplayModeToggle = () => {
    toggleDisplayMode();
  };

  const handleMeasureToggle = () => {
    if (isMeasuring) {
      setIsMeasuring(false);
      setMeasureFirstAtom(null);
    } else {
      setSelectedAtom(null);
      setIsMeasuring(true);
      setMeasureFirstAtom(null);
    }
  };

  const handleClearMeasurements = () => {
    clearMeasurements();
  };

  const handleCloseInfo = () => {
    setSelectedAtom(null);
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Exo+2:wght@300;400;600;700&display=swap');

        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          font-family: 'Exo 2', sans-serif;
          overflow: hidden;
          background: linear-gradient(135deg, #0a0e1a 0%, #1a2035 100%);
        }

        #root {
          width: 100vw;
          height: 100vh;
        }

        .toolbar {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          height: 56px;
          background: rgba(10, 14, 26, 0.85);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          display: flex;
          align-items: center;
          padding: 0 20px;
          gap: 12px;
          z-index: 100;
        }

        .toolbar-title {
          font-size: 16px;
          font-weight: 700;
          color: #e0e6f0;
          letter-spacing: 1px;
          text-transform: uppercase;
          margin-right: 16px;
          white-space: nowrap;
        }

        .toolbar-select {
          background: linear-gradient(135deg, #667eea, #764ba2);
          color: #fff;
          border: none;
          padding: 8px 14px;
          border-radius: 8px;
          font-family: 'Exo 2', sans-serif;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          outline: none;
          transition: all 0.15s ease;
          -webkit-appearance: none;
          appearance: none;
          min-width: 120px;
        }

        .toolbar-select:hover {
          filter: brightness(1.2);
        }

        .toolbar-select:active {
          transform: scale(0.95);
        }

        .toolbar-select option {
          background: #1a2035;
          color: #e0e6f0;
        }

        .toolbar-btn {
          background: linear-gradient(135deg, #667eea, #764ba2);
          color: #fff;
          border: none;
          padding: 8px 16px;
          border-radius: 8px;
          font-family: 'Exo 2', sans-serif;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          outline: none;
          transition: all 0.15s ease;
          white-space: nowrap;
          position: relative;
        }

        .toolbar-btn:hover {
          filter: brightness(1.2);
          transform: scale(1.05);
        }

        .toolbar-btn:active {
          transform: scale(0.95);
        }

        .toolbar-btn.active {
          box-shadow: 0 0 12px rgba(102, 126, 234, 0.6), inset 0 0 8px rgba(255, 255, 255, 0.2);
        }

        .toolbar-btn.danger {
          background: linear-gradient(135deg, #e74c3c, #c0392b);
        }

        .toolbar-btn.danger:hover {
          filter: brightness(1.2);
        }

        .toolbar-divider {
          width: 1px;
          height: 28px;
          background: rgba(255, 255, 255, 0.1);
          margin: 0 4px;
        }

        .mode-label {
          color: #8a94a8;
          font-size: 12px;
          margin-left: 4px;
        }

        .info-panel {
          position: fixed;
          left: 0;
          top: 56px;
          bottom: 0;
          width: 260px;
          background: rgba(20, 25, 40, 0.9);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          border-radius: 0 16px 16px 0;
          padding: 20px;
          z-index: 90;
          transform: translateX(-100%);
          transition: transform 0.3s ease-out;
          color: #e0e6f0;
          border-right: 1px solid rgba(255, 255, 255, 0.05);
          border-top: 1px solid rgba(255, 255, 255, 0.05);
        }

        .info-panel.open {
          transform: translateX(0);
        }

        .info-panel-close {
          position: absolute;
          top: 12px;
          right: 12px;
          background: none;
          border: none;
          color: #8a94a8;
          font-size: 20px;
          cursor: pointer;
          line-height: 1;
          padding: 4px;
          transition: color 0.2s;
        }

        .info-panel-close:hover {
          color: #e0e6f0;
        }

        .info-panel-title {
          font-size: 24px;
          font-weight: 700;
          margin-bottom: 16px;
          color: #fff;
        }

        .info-panel-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 0;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }

        .info-panel-label {
          font-size: 13px;
          color: #8a94a8;
          font-weight: 400;
        }

        .info-panel-value {
          font-size: 16px;
          color: #e0e6f0;
          font-weight: 400;
        }

        .info-panel-color-dot {
          display: inline-block;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          margin-right: 8px;
          vertical-align: middle;
          border: 2px solid rgba(255, 255, 255, 0.2);
        }

        .measure-panel {
          position: fixed;
          right: 16px;
          bottom: 16px;
          width: 320px;
          max-height: 200px;
          background: rgba(10, 14, 26, 0.8);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          border-radius: 12px;
          padding: 12px;
          z-index: 90;
          overflow-y: auto;
          color: #e0e6f0;
          border: 1px solid rgba(255, 255, 255, 0.05);
        }

        .measure-panel::-webkit-scrollbar {
          width: 4px;
        }

        .measure-panel::-webkit-scrollbar-track {
          background: transparent;
        }

        .measure-panel::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.15);
          border-radius: 2px;
        }

        .measure-panel-title {
          font-size: 13px;
          font-weight: 600;
          color: #8a94a8;
          margin-bottom: 8px;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .measure-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 6px 8px;
          background: rgba(255, 255, 255, 0.03);
          border-radius: 6px;
          margin-bottom: 4px;
          font-size: 14px;
        }

        .measure-item-label {
          color: #c0c8d8;
        }

        .measure-item-value {
          color: #667eea;
          font-weight: 600;
        }

        .measure-empty {
          color: #5a6478;
          font-size: 13px;
          text-align: center;
          padding: 8px;
        }

        .measuring-hint {
          position: fixed;
          bottom: 240px;
          right: 16px;
          background: rgba(102, 126, 234, 0.9);
          color: #fff;
          padding: 8px 16px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          z-index: 95;
          animation: pulse-hint 1.5s ease-in-out infinite;
        }

        @keyframes pulse-hint {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }

        .measure-crosshair {
          cursor: crosshair !important;
        }

        @media (max-width: 768px) {
          .toolbar {
            height: auto;
            flex-wrap: wrap;
            padding: 10px 12px;
            gap: 8px;
          }

          .toolbar-title {
            width: 100%;
            font-size: 14px;
            margin-right: 0;
          }

          .toolbar-select {
            flex: 1;
            min-width: auto;
            height: 44px;
          }

          .toolbar-btn {
            flex: 1;
            min-width: auto;
            height: 44px;
            padding: 8px 10px;
            font-size: 12px;
          }

          .toolbar-divider {
            display: none;
          }

          .info-panel {
            left: 0;
            right: 0;
            top: auto;
            bottom: 0;
            width: 100%;
            height: auto;
            max-height: 60vh;
            border-radius: 16px 16px 0 0;
            transform: translateY(100%);
            transition: transform 0.3s ease-out;
          }

          .info-panel.open {
            transform: translateY(0);
          }

          .measure-panel {
            left: 16px;
            right: 16px;
            width: auto;
          }
        }
      `}</style>

      <div className="toolbar">
        <span className="toolbar-title">Mol Viewer</span>
        <select
          className="toolbar-select"
          value={currentMolecule}
          onChange={handleMoleculeChange}
        >
          {moleculeKeys.map((key) => (
            <option key={key} value={key}>
              {moleculeMap[key].name}
            </option>
          ))}
        </select>

        <div className="toolbar-divider" />

        <button className="toolbar-btn" onClick={handleDisplayModeToggle}>
          {displayMode === 'ball-stick' ? '⚛ 球棍' : '◉ 填充'}
        </button>
        <span className="mode-label">
          {displayMode === 'ball-stick' ? 'Ball-Stick' : 'Space-Filling'}
        </span>

        <div className="toolbar-divider" />

        <button
          className={`toolbar-btn ${isMeasuring ? 'active' : ''}`}
          onClick={handleMeasureToggle}
        >
          {isMeasuring ? '✕ 退出测量' : '📏 测量'}
        </button>

        {measurements.length > 0 && (
          <button className="toolbar-btn danger" onClick={handleClearMeasurements}>
            清除测量
          </button>
        )}

        <div className="toolbar-divider" />

        <button className="toolbar-btn" onClick={() => {
          setSelectedAtom(null);
          setIsMeasuring(false);
          setMeasureFirstAtom(null);
          window.dispatchEvent(new CustomEvent('reset-camera'));
        }}>
          ⟳ 重置视角
        </button>
      </div>

      <div className={`info-panel ${selectedAtom ? 'open' : ''}`}>
        {selectedAtom && (
          <>
            <button className="info-panel-close" onClick={handleCloseInfo}>✕</button>
            <div className="info-panel-title">
              <span
                className="info-panel-color-dot"
                style={{ backgroundColor: selectedAtom.color }}
              />
              {selectedAtom.name}
            </div>
            <div className="info-panel-row">
              <span className="info-panel-label">元素符号</span>
              <span className="info-panel-value" style={{ fontWeight: 700 }}>{selectedAtom.symbol}</span>
            </div>
            <div className="info-panel-row">
              <span className="info-panel-label">元素名称</span>
              <span className="info-panel-value">{selectedAtom.name}</span>
            </div>
            <div className="info-panel-row">
              <span className="info-panel-label">原子序数</span>
              <span className="info-panel-value">{selectedAtom.atomicNumber}</span>
            </div>
            <div className="info-panel-row">
              <span className="info-panel-label">坐标 (Å)</span>
              <span className="info-panel-value">
                ({selectedAtom.position[0].toFixed(2)}, {selectedAtom.position[1].toFixed(2)}, {selectedAtom.position[2].toFixed(2)})
              </span>
            </div>
          </>
        )}
      </div>

      {isMeasuring && (
        <div className="measuring-hint">
          {measureFirstAtom
            ? `点击第二个原子完成测量（已选: ${measureFirstAtom.symbol}）`
            : '点击第一个原子开始测量'}
        </div>
      )}

      {(measurements.length > 0 || isMeasuring) && (
        <div className="measure-panel">
          <div className="measure-panel-title">测量结果</div>
          {measurements.length === 0 ? (
            <div className="measure-empty">暂无测量数据</div>
          ) : (
            measurements.map((m, i) => (
              <div className="measure-item" key={i}>
                <span className="measure-item-label">
                  {m.atom1.symbol}–{m.atom2.symbol}
                </span>
                <span className="measure-item-value">
                  {m.distance.toFixed(2)} Å
                </span>
              </div>
            ))
          )}
        </div>
      )}
    </>
  );
};

export default UIOverlay;
