import React, { useEffect, useRef } from 'react';
import type { BlockData } from './types';

interface UIDataPanelProps {
  selectedBlock: BlockData | null;
  isOpen: boolean;
  onClose: () => void;
}

const UIDataPanel: React.FC<UIDataPanelProps> = ({ selectedBlock, isOpen, onClose }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current || !selectedBlock) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;
    const data = selectedBlock.historyData;
    const barCount = data.length;
    const barWidth = (width - 20) / barCount - 4;
    const maxValue = 100;
    const chartHeight = height - 30;

    ctx.clearRect(0, 0, width, height);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = 10 + (chartHeight / 4) * i;
      ctx.beginPath();
      ctx.moveTo(10, y);
      ctx.lineTo(width - 10, y);
      ctx.stroke();
    }

    data.forEach((value, index) => {
      const barHeight = (value / maxValue) * chartHeight;
      const x = 10 + index * (barWidth + 4);
      const y = height - 20 - barHeight;

      const t = value / 100;
      let r, g, b;
      if (t < 0.5) {
        const localT = t * 2;
        r = Math.floor(0 + 255 * localT);
        g = Math.floor(255 - (255 - 255) * localT);
        b = Math.floor(0 - 0 * localT);
      } else {
        const localT = (t - 0.5) * 2;
        r = Math.floor(255 + (255 - 255) * localT);
        g = Math.floor(255 - 255 * localT);
        b = 0;
      }

      const gradient = ctx.createLinearGradient(x, y, x, height - 20);
      gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.9)`);
      gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0.4)`);

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.roundRect(x, y, barWidth, barHeight, 2);
      ctx.fill();

      if (index % 3 === 0) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`${-11 + index}h`, x + barWidth / 2, height - 5);
      }
    });

    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('100', width - 5, 15);
    ctx.fillText('0', width - 5, height - 20);

  }, [selectedBlock]);

  if (!isOpen) {
    return (
      <div className="data-panel-wrapper">
        <div className="data-panel">
          <div className="empty-panel">
            <div className="empty-panel-icon">📊</div>
            <div className="empty-panel-text">
              点击任意街区方块<br />查看详细数据
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!selectedBlock) {
    return (
      <div className="data-panel-wrapper">
        <div className="data-panel open">
          <div className="empty-panel">
            <div className="empty-panel-icon">📊</div>
            <div className="empty-panel-text">
              点击任意街区方块<br />查看详细数据
            </div>
          </div>
        </div>
      </div>
    );
  }

  const getPollutionLevel = (index: number): string => {
    if (index < 30) return '低';
    if (index < 60) return '中';
    return '高';
  };

  const getLevelColor = (index: number): string => {
    if (index < 30) return '#4caf50';
    if (index < 60) return '#ffc107';
    return '#f44336';
  };

  return (
    <div className="data-panel-wrapper">
      <div className="data-panel open">
        <button className="close-btn" onClick={onClose}>
          ×
        </button>

        <h2>{selectedBlock.name}</h2>

        <div className="panel-section">
          <h3>基本信息</h3>
          <div className="data-row">
            <span className="data-label">街区编号</span>
            <span className="data-value">#{selectedBlock.id + 1}</span>
          </div>
          <div className="data-row">
            <span className="data-label">网格位置</span>
            <span className="data-value">({selectedBlock.positionX + 1}, {selectedBlock.positionZ + 1})</span>
          </div>
        </div>

        <div className="panel-section">
          <h3>光污染数据</h3>
          <div className="data-row">
            <span className="data-label">污染指数</span>
            <span 
              className="data-value" 
              style={{ color: getLevelColor(selectedBlock.pollutionIndex) }}
            >
              {selectedBlock.pollutionIndex.toFixed(0)} / 100
            </span>
          </div>
          <div className="data-row">
            <span className="data-label">污染等级</span>
            <span 
              className="data-value" 
              style={{ color: getLevelColor(selectedBlock.pollutionIndex) }}
            >
              {getPollutionLevel(selectedBlock.pollutionIndex)}
            </span>
          </div>
          <div className="data-row">
            <span className="data-label">灯光强度</span>
            <span className="data-value">{selectedBlock.lightIntensity.toLocaleString()} lux</span>
          </div>
          <div className="data-row">
            <span className="data-label">主要光源</span>
            <span className={`source-badge ${selectedBlock.lightSourceType}`}>
              {selectedBlock.lightSourceType}
            </span>
          </div>
        </div>

        <div className="panel-section">
          <h3>12小时趋势</h3>
          <div className="chart-container">
            <canvas ref={canvasRef} className="chart-canvas" />
          </div>
          <div style={{ marginTop: '8px', fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>
            单位：污染指数（0-100）
          </div>
        </div>

        <div className="panel-section">
          <h3>数据说明</h3>
          <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', lineHeight: '1.6' }}>
            <p>• 数据每2秒自动更新</p>
            <p>• 污染指数范围：0（无污染）- 100（严重污染）</p>
            <p>• 方块高度和颜色反映当前污染程度</p>
            <p>• 历史数据为模拟实时监测值</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UIDataPanel;
