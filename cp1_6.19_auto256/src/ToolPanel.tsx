import React from 'react';
import { useGameStore } from './orchestra';
import { ToolType } from './types';

const tools: { type: ToolType; label: string; icon: string }[] = [
  { type: 'track', label: '轨道', icon: '🛤️' },
  { type: 'mine', label: '矿点', icon: '⛏️' },
  { type: 'unload', label: '卸载', icon: '📦' },
  { type: 'cart', label: '矿车', icon: '🚋' },
  { type: 'eraser', label: '擦除', icon: '🧹' },
];

const ToolPanel: React.FC = () => {
  const selectedTool = useGameStore((s) => s.selectedTool);
  const isRunning = useGameStore((s) => s.isRunning);
  const stats = useGameStore((s) => s.stats);
  const carts = useGameStore((s) => s.carts);
  const setTool = useGameStore((s) => s.setTool);
  const toggleRunning = useGameStore((s) => s.toggleRunning);
  const resetGame = useGameStore((s) => s.resetGame);

  return (
    <div className="tool-panel">
      <div className="tool-section">
        <h3 className="tool-section-title">工具</h3>
        <div className="tool-grid">
          {tools.map((tool) => (
            <button
              key={tool.type}
              className={`tool-btn ${selectedTool === tool.type ? 'active' : ''}`}
              onClick={() => setTool(tool.type)}
              disabled={isRunning && tool.type !== 'cart'}
              title={tool.label}
            >
              <span className="tool-icon">{tool.icon}</span>
              <span className="tool-label">{tool.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="tool-section">
        <h3 className="tool-section-title">控制</h3>
        <button className={`control-btn ${isRunning ? 'running' : ''}`} onClick={toggleRunning}>
          {isRunning ? '⏸ 暂停' : '▶ 启动'}
        </button>
        <button className="control-btn reset-btn" onClick={resetGame}>
          🔄 重置
        </button>
      </div>

      <div className="tool-section">
        <h3 className="tool-section-title">统计</h3>
        <div className="stats-grid">
          <div className="stat-item">
            <span className="stat-label">在途矿车</span>
            <span className="stat-value">{stats.inTransitCarts}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">运输矿石</span>
            <span className="stat-value">{stats.totalOre}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">平均时间</span>
            <span className="stat-value">{stats.avgTransportTime.toFixed(1)}s</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">轨道利用</span>
            <span className="stat-value">{stats.trackUtilization.toFixed(1)}%</span>
          </div>
        </div>
      </div>

      <div className="tool-section">
        <h3 className="tool-section-title">信息</h3>
        <div className="info-text">
          <p>矿车: {carts.length}/20</p>
          <p className="info-hint">点击或拖拽铺设轨道</p>
          <p className="info-hint">放置矿点和卸载点</p>
          <p className="info-hint">在轨道上放置矿车</p>
          <p className="info-hint">点击启动开始模拟</p>
        </div>
      </div>
    </div>
  );
};

export default ToolPanel;
