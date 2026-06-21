import React, { useEffect, useState } from 'react';
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
    setDisplayMode,
    clearMeasurements,
    setIsMeasuring,
    setMeasureFirstAtom,
  } = useAppStore();

  const [infoVisible, setInfoVisible] = useState(false);

  useEffect(() => {
    if (selectedAtom) {
      setInfoVisible(true);
    } else {
      const timer = setTimeout(() => setInfoVisible(false), 200);
      return () => clearTimeout(timer);
    }
  }, [selectedAtom]);

  const handleMoleculeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setMolecule(e.target.value);
  };

  const handleModeChange = (mode: DisplayMode) => {
    setDisplayMode(mode);
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
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          overflow: hidden;
          background: #0d1222;
          color: #e0e6f0;
        }

        #root {
          width: 100vw;
          height: 100vh;
          position: relative;
        }

        /* ===== 顶部分子选择下拉 ===== */
        .top-bar {
          position: fixed;
          top: 20px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 50;
        }

        .molecule-select-wrap {
          position: relative;
          background: rgba(22, 28, 48, 0.85);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 14px;
          padding: 4px 4px 4px 18px;
          display: flex;
          align-items: center;
          gap: 10px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.35);
        }

        .molecule-label {
          font-size: 12px;
          font-weight: 500;
          color: #8a94a8;
          letter-spacing: 0.5px;
        }

        .molecule-select {
          background: linear-gradient(135deg, #5b6fd4, #6b4fa8);
          color: #ffffff;
          border: none;
          padding: 10px 36px 10px 14px;
          border-radius: 10px;
          font-family: inherit;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          outline: none;
          transition: all 0.2s ease;
          -webkit-appearance: none;
          appearance: none;
          min-width: 140px;
        }

        .molecule-select:hover {
          filter: brightness(1.15);
          transform: translateY(-1px);
          box-shadow: 0 4px 16px rgba(91, 111, 212, 0.4);
        }

        .molecule-select:active {
          transform: scale(0.97);
        }

        .molecule-select option {
          background: #1a2038;
          color: #e0e6f0;
          font-size: 14px;
        }

        .molecule-select-arrow {
          position: absolute;
          right: 18px;
          top: 50%;
          transform: translateY(-50%);
          pointer-events: none;
          color: rgba(255, 255, 255, 0.7);
          font-size: 10px;
        }

        /* ===== 右侧信息面板 ===== */
        .right-panel {
          position: fixed;
          right: 20px;
          top: 80px;
          width: 280px;
          background: rgba(22, 28, 48, 0.9);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 16px;
          padding: 20px;
          z-index: 40;
          opacity: 0;
          transform: translateX(20px);
          pointer-events: none;
          transition: opacity 0.25s ease-out, transform 0.25s ease-out;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
        }

        .right-panel.visible {
          opacity: 1;
          transform: translateX(0);
          pointer-events: auto;
        }

        .right-panel-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 16px;
        }

        .right-panel-close {
          background: rgba(255, 255, 255, 0.05);
          border: none;
          color: #8a94a8;
          width: 24px;
          height: 24px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          line-height: 1;
          transition: all 0.15s ease;
        }

        .right-panel-close:hover {
          background: rgba(255, 255, 255, 0.12);
          color: #e0e6f0;
        }

        .info-title {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .info-symbol {
          font-size: 28px;
          font-weight: 700;
          color: #ffffff;
        }

        .info-dot {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          border: 2px solid rgba(255, 255, 255, 0.25);
        }

        .info-name {
          font-size: 18px;
          font-weight: 600;
          color: #ffffff;
          margin-top: 2px;
        }

        .info-rows {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .info-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 0;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }

        .info-row:last-child {
          border-bottom: none;
        }

        .info-key {
          font-size: 12px;
          font-weight: 500;
          color: #7a8498;
        }

        .info-val {
          font-size: 14px;
          font-weight: 500;
          color: #dde4ef;
          font-variant-numeric: tabular-nums;
        }

        /* ===== 测量记录区 ===== */
        .measure-section {
          position: fixed;
          right: 20px;
          top: 380px;
          bottom: 120px;
          width: 280px;
          background: rgba(22, 28, 48, 0.85);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 16px;
          padding: 16px;
          z-index: 40;
          display: flex;
          flex-direction: column;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.35);
        }

        .measure-section-title {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;
        }

        .measure-section-title span {
          font-size: 12px;
          font-weight: 600;
          color: #7a8498;
          letter-spacing: 0.8px;
          text-transform: uppercase;
        }

        .measure-clear {
          background: none;
          border: none;
          color: #6b7fd6;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          padding: 2px 6px;
          border-radius: 4px;
          transition: all 0.15s;
        }

        .measure-clear:hover {
          background: rgba(107, 127, 214, 0.12);
          color: #8a9def;
        }

        .measure-list {
          flex: 1;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .measure-list::-webkit-scrollbar {
          width: 4px;
        }

        .measure-list::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.12);
          border-radius: 2px;
        }

        .measure-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 10px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.04);
          border-radius: 8px;
        }

        .measure-item-left {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          color: #c0c8d8;
        }

        .measure-dash {
          color: #5a6478;
        }

        .measure-item-val {
          font-size: 13px;
          font-weight: 600;
          color: #6b85e0;
          font-variant-numeric: tabular-nums;
        }

        .measure-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          flex: 1;
          color: #5a6478;
          font-size: 12px;
          gap: 4px;
        }

        /* ===== 左下角显示模式按钮组 ===== */
        .mode-group {
          position: fixed;
          left: 20px;
          bottom: 20px;
          display: flex;
          background: rgba(22, 28, 48, 0.9);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 12px;
          padding: 4px;
          z-index: 40;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.35);
        }

        .mode-btn {
          background: transparent;
          color: #8a94a8;
          border: none;
          padding: 10px 16px;
          border-radius: 8px;
          font-family: inherit;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .mode-btn:hover {
          color: #d0d8e8;
          background: rgba(255, 255, 255, 0.04);
        }

        .mode-btn.active {
          background: linear-gradient(135deg, #5b6fd4, #6b4fa8);
          color: #ffffff;
          box-shadow: 0 2px 12px rgba(91, 111, 212, 0.4);
        }

        .mode-icon {
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: currentColor;
          opacity: 0.8;
        }

        .mode-icon.stick {
          position: relative;
        }

        .mode-icon.stick::after {
          content: '';
          position: absolute;
          width: 10px;
          height: 2px;
          background: currentColor;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          border-radius: 1px;
          opacity: 0.8;
        }

        /* ===== 右下角测量按钮 ===== */
        .measure-btn-wrap {
          position: fixed;
          right: 20px;
          bottom: 20px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          z-index: 40;
          align-items: flex-end;
        }

        .measure-btn {
          background: rgba(22, 28, 48, 0.9);
          color: #e0e6f0;
          border: 1px solid rgba(255, 255, 255, 0.08);
          padding: 12px 18px;
          border-radius: 12px;
          font-family: inherit;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          gap: 8px;
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.35);
        }

        .measure-btn:hover {
          transform: translateY(-1px);
          border-color: rgba(255, 255, 255, 0.15);
          box-shadow: 0 10px 36px rgba(0, 0, 0, 0.4);
        }

        .measure-btn.active {
          background: linear-gradient(135deg, #5b6fd4, #6b4fa8);
          border-color: transparent;
          color: #ffffff;
          box-shadow: 0 6px 20px rgba(91, 111, 212, 0.45);
        }

        .measure-btn-icon {
          width: 16px;
          height: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        /* ===== 测量提示条 ===== */
        .measure-hint {
          background: rgba(91, 111, 212, 0.95);
          color: #ffffff;
          padding: 8px 14px;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 500;
          box-shadow: 0 4px 16px rgba(91, 111, 212, 0.35);
          animation: hintPulse 1.6s ease-in-out infinite;
        }

        @keyframes hintPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.75; }
        }

        /* ===== 响应式 ===== */
        @media (max-width: 768px) {
          .top-bar {
            top: 12px;
          }

          .molecule-select-wrap {
            padding: 4px 4px 4px 14px;
          }

          .molecule-select {
            padding: 12px 36px 12px 12px;
            min-width: 160px;
          }

          .right-panel {
            right: 12px;
            left: 12px;
            top: auto;
            bottom: 140px;
            width: auto;
          }

          .measure-section {
            display: none;
          }

          .mode-group {
            left: 12px;
            bottom: 12px;
          }

          .mode-btn {
            padding: 10px 12px;
            font-size: 12px;
          }

          .measure-btn-wrap {
            right: 12px;
            bottom: 12px;
          }

          .measure-btn {
            padding: 10px 14px;
            font-size: 13px;
          }
        }
      `}</style>

      {/* 顶部分子选择 */}
      <div className="top-bar">
        <div className="molecule-select-wrap">
          <span className="molecule-label">分子</span>
          <select
            className="molecule-select"
            value={currentMolecule}
            onChange={handleMoleculeChange}
          >
            {moleculeKeys.map((key) => (
              <option key={key} value={key}>
                {moleculeMap[key].displayName || moleculeMap[key].name}
              </option>
            ))}
          </select>
          <span className="molecule-select-arrow">▾</span>
        </div>
      </div>

      {/* 右侧原子信息面板 */}
      <div className={`right-panel ${infoVisible && selectedAtom ? 'visible' : ''}`}>
        {selectedAtom && (
          <>
            <div className="right-panel-header">
              <div>
                <div className="info-title">
                  <span className="info-symbol">{selectedAtom.symbol}</span>
                  <span
                    className="info-dot"
                    style={{ backgroundColor: selectedAtom.color }}
                  />
                </div>
                <div className="info-name">{selectedAtom.name}</div>
              </div>
              <button className="right-panel-close" onClick={handleCloseInfo}>✕</button>
            </div>
            <div className="info-rows">
              <div className="info-row">
                <span className="info-key">元素符号</span>
                <span className="info-val">{selectedAtom.symbol}</span>
              </div>
              <div className="info-row">
                <span className="info-key">元素名称</span>
                <span className="info-val">{selectedAtom.name}</span>
              </div>
              <div className="info-row">
                <span className="info-key">原子序数</span>
                <span className="info-val">{selectedAtom.atomicNumber}</span>
              </div>
              <div className="info-row">
                <span className="info-key">坐标 (Å)</span>
                <span className="info-val">
                  {selectedAtom.position[0].toFixed(2)}, {selectedAtom.position[1].toFixed(2)}, {selectedAtom.position[2].toFixed(2)}
                </span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* 右侧测量记录 */}
      <div className="measure-section">
        <div className="measure-section-title">
          <span>测量记录</span>
          {measurements.length > 0 && (
            <button className="measure-clear" onClick={handleClearMeasurements}>
              清除
            </button>
          )}
        </div>
        {measurements.length === 0 ? (
          <div className="measure-empty">
            <span>暂无测量</span>
            <span style={{ fontSize: 11, opacity: 0.7 }}>点击右下角按钮开始</span>
          </div>
        ) : (
          <div className="measure-list">
            {measurements.map((m, i) => (
              <div className="measure-item" key={i}>
                <div className="measure-item-left">
                  <span style={{ color: m.atom1.color }}>●</span>
                  <span>{m.atom1.symbol}</span>
                  <span className="measure-dash">—</span>
                  <span style={{ color: m.atom2.color }}>●</span>
                  <span>{m.atom2.symbol}</span>
                </div>
                <span className="measure-item-val">{m.distance.toFixed(2)} Å</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 左下角显示模式切换 */}
      <div className="mode-group">
        <button
          className={`mode-btn ${displayMode === 'ball-stick' ? 'active' : ''}`}
          onClick={() => handleModeChange('ball-stick')}
        >
          <span className="mode-icon stick" />
          球棍模型
        </button>
        <button
          className={`mode-btn ${displayMode === 'space-filling' ? 'active' : ''}`}
          onClick={() => handleModeChange('space-filling')}
        >
          <span className="mode-icon" />
          空间填充
        </button>
      </div>

      {/* 右下角测量工具按钮 */}
      <div className="measure-btn-wrap">
        {isMeasuring && (
          <div className="measure-hint">
            {measureFirstAtom
              ? `已选 ${measureFirstAtom.symbol}，点击第二个原子`
              : '点击第一个原子'}
          </div>
        )}
        <button
          className={`measure-btn ${isMeasuring ? 'active' : ''}`}
          onClick={handleMeasureToggle}
        >
          <span className="measure-btn-icon">
            {isMeasuring ? '✕' : '📏'}
          </span>
          {isMeasuring ? '退出测量' : '测量距离'}
        </button>
      </div>
    </>
  );
};

export default UIOverlay;
