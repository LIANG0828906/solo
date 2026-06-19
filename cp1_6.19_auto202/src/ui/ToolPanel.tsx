import { useGameStore } from '@/store/gameStore';
import type { BlockType } from '@/types';
import { Box, Circle, Hexagon, Trash2, AlertTriangle } from 'lucide-react';
import { shallow } from 'zustand/shallow';

const blockTypes: { type: BlockType; label: string; icon: React.ReactNode }[] = [
  { type: 'cube', label: '立方体', icon: <Box size={20} /> },
  { type: 'sphere', label: '球体', icon: <Circle size={20} /> },
  { type: 'prism', label: '棱柱', icon: <Hexagon size={20} /> },
];

export function ToolPanel() {
  const blocks = useGameStore((state) => state.blocks);
  const selectedType = useGameStore((state) => state.selectedType);
  const centerOfMass = useGameStore((state) => state.centerOfMass);
  const isCollapsed = useGameStore((state) => state.isCollapsed);
  const setSelectedType = useGameStore((state) => state.setSelectedType);
  const clearAll = useGameStore((state) => state.clearAll);
  const isOutOfBounds = centerOfMass.isOutOfBounds;

  const offsetPercent = centerOfMass.offsetPercent;
  const isWarning = offsetPercent > 80;
  const isDanger = isOutOfBounds;

  return (
    <div className="tool-panel">
      <div className="tool-panel__header">
        <span className="tool-panel__count">当前放置：{blocks.length}个</span>
      </div>

      <div className="tool-panel__section">
        <div className="tool-panel__section-title">几何体</div>
        <div className="tool-panel__buttons">
          {blockTypes.map(({ type, label, icon }) => (
            <button
              key={type}
              className={`tool-panel__btn ${selectedType === type ? 'tool-panel__btn--active' : ''}`}
              onClick={() => setSelectedType(selectedType === type ? null : type)}
              disabled={isCollapsed}
            >
              <span className="tool-panel__btn-icon">{icon}</span>
              <span className="tool-panel__btn-label">{label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="tool-panel__section">
        <div className="tool-panel__section-title">重心数据</div>
        <div className="tool-panel__com-data">
          <div className="com-row">
            <span className="com-label">X:</span>
            <span className="com-value">{centerOfMass.position[0].toFixed(2)}</span>
          </div>
          <div className="com-row">
            <span className="com-label">Y:</span>
            <span className="com-value">{centerOfMass.position[1].toFixed(2)}</span>
          </div>
          <div className="com-row">
            <span className="com-label">Z:</span>
            <span className="com-value">{centerOfMass.position[2].toFixed(2)}</span>
          </div>
          <div className="com-row">
            <span className="com-label">总重量:</span>
            <span className="com-value">{centerOfMass.totalMass.toFixed(2)}</span>
          </div>
          <div className="com-row">
            <span className="com-label">偏移:</span>
            <span className={`com-value com-value--${isDanger ? 'danger' : isWarning ? 'warning' : 'normal'}`}>
              {offsetPercent.toFixed(2)}%
            </span>
          </div>
        </div>
      </div>

      <div className="tool-panel__section">
        <div className="tool-panel__section-title">倒塌预警</div>
        <div className={`warning-light ${isDanger ? 'warning-light--danger' : isWarning ? 'warning-light--warning' : 'warning-light--ok'}`}>
          <div className="warning-light__dot" />
          <span className="warning-light__text">
            {isDanger ? '结构不稳！' : isWarning ? '接近临界' : '结构稳定'}
          </span>
        </div>
      </div>

      <button className="tool-panel__clear-btn" onClick={clearAll}>
        <Trash2 size={18} />
        <span>一键清除</span>
      </button>

      <style>{`
        .tool-panel {
          position: fixed;
          top: 50%;
          right: 20px;
          transform: translateY(-50%);
          width: 240px;
          padding: 16px;
          background: #1A1A1ACC;
          border: 1px solid #333333;
          border-radius: 12px;
          backdrop-filter: blur(10px);
          z-index: 100;
          color: #ffffff;
          user-select: none;
        }

        .tool-panel__header {
          margin-bottom: 16px;
          padding-bottom: 12px;
          border-bottom: 1px solid #333333;
        }

        .tool-panel__count {
          font-size: 20px;
          font-weight: 700;
          color: #ffffff;
        }

        .tool-panel__section {
          margin-bottom: 16px;
        }

        .tool-panel__section-title {
          font-size: 12px;
          color: #888888;
          margin-bottom: 8px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .tool-panel__buttons {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .tool-panel__btn {
          display: flex;
          align-items: center;
          gap: 10px;
          height: 40px;
          padding: 0 12px;
          background: transparent;
          border: 1px solid #333333;
          border-radius: 8px;
          color: #cccccc;
          cursor: pointer;
          transition: all 0.2s ease;
          font-size: 14px;
        }

        .tool-panel__btn:hover:not(:disabled) {
          background: #2A2A2A;
          color: #ffffff;
        }

        .tool-panel__btn--active {
          background: #2A2A2A;
          border-color: #3498DB;
          color: #ffffff;
        }

        .tool-panel__btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .tool-panel__btn-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 24px;
        }

        .tool-panel__com-data {
          background: #0d0d0d80;
          border-radius: 8px;
          padding: 10px 12px;
        }

        .com-row {
          display: flex;
          justify-content: space-between;
          padding: 3px 0;
          font-size: 13px;
        }

        .com-label {
          color: #888888;
        }

        .com-value {
          color: #ffffff;
          font-family: 'Courier New', monospace;
          font-weight: 600;
        }

        .com-value--normal {
          color: #2ECC71;
        }

        .com-value--warning {
          color: #F1C40F;
        }

        .com-value--danger {
          color: #E74C3C;
        }

        .warning-light {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 12px;
          background: #0d0d0d80;
          border-radius: 8px;
        }

        .warning-light__dot {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: #2ECC71;
          box-shadow: 0 0 10px #2ECC71;
        }

        .warning-light--ok .warning-light__dot {
          background: #2ECC71;
          box-shadow: 0 0 10px #2ECC71;
        }

        .warning-light--warning .warning-light__dot {
          background: #F1C40F;
          box-shadow: 0 0 10px #F1C40F;
        }

        .warning-light--danger .warning-light__dot {
          background: #E74C3C;
          box-shadow: 0 0 10px #E74C3C;
          animation: blink 0.5s infinite;
        }

        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }

        .warning-light__text {
          font-size: 13px;
          font-weight: 500;
        }

        .tool-panel__clear-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          width: 100%;
          height: 40px;
          background: #E74C3C20;
          border: 1px solid #E74C3C40;
          border-radius: 8px;
          color: #E74C3C;
          cursor: pointer;
          transition: all 0.2s ease;
          font-size: 14px;
          font-weight: 500;
        }

        .tool-panel__clear-btn:hover {
          background: #E74C3C30;
        }

        @media (max-width: 1024px) {
          .tool-panel {
            width: 180px;
            right: 10px;
            padding: 12px;
          }

          .tool-panel__count {
            font-size: 17px;
          }

          .tool-panel__section-title {
            font-size: 10px;
          }

          .tool-panel__btn {
            height: 34px;
            font-size: 12px;
          }

          .com-row {
            font-size: 11px;
          }

          .tool-panel__clear-btn {
            height: 34px;
            font-size: 12px;
          }
        }
      `}</style>
    </div>
  );
}
