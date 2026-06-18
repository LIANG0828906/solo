import React, { useRef, useEffect, useState } from 'react';
import { useAppStore } from '../../store/appStore';

const ControlPanel: React.FC = () => {
  const {
    pathColor,
    particleDensity,
    setPathColor,
    setParticleDensity,
    resetPath
  } = useAppStore();

  const panelRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const panelStart = useRef({ x: 0, y: 0 });
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    if (panelRef.current && isMobile) {
      const stored = localStorage.getItem('panelPosition');
      if (stored) {
        try {
          const pos = JSON.parse(stored);
          panelRef.current.style.transform = `translate(${pos.x}px, ${pos.y}px)`;
        } catch {}
      }
    }
  }, [isMobile]);

  const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isMobile) return;
    setIsDragging(true);
    let clientX: number, clientY: number;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    dragStart.current = { x: clientX, y: clientY };
    const rect = panelRef.current?.getBoundingClientRect();
    if (rect) {
      panelStart.current = { x: rect.left, y: rect.top };
    }
  };

  const handleDragMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging || !isMobile) return;
    let clientX: number, clientY: number;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    const dx = clientX - dragStart.current.x;
    const dy = clientY - dragStart.current.y;
    if (panelRef.current) {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const rect = panelRef.current.getBoundingClientRect();
      let newX = panelStart.current.x + dx;
      let newY = panelStart.current.y + dy;
      newX = Math.max(10, Math.min(vw - rect.width - 10, newX));
      newY = Math.max(10, Math.min(vh - rect.height - 10, newY));
      panelRef.current.style.transform = `translate(${newX - (vw - rect.width - 10)}px, 0)`;
      panelRef.current.style.top = `${newY}px`;
      panelRef.current.style.bottom = 'auto';
      localStorage.setItem('panelPosition', JSON.stringify({ x: newX - (vw - rect.width - 10), y: newY }));
    }
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  return (
    <div
      className="control-panel"
      ref={panelRef}
      onMouseDown={handleDragStart}
      onMouseMove={handleDragMove}
      onMouseUp={handleDragEnd}
      onMouseLeave={handleDragEnd}
      onTouchStart={handleDragStart}
      onTouchMove={handleDragMove}
      onTouchEnd={handleDragEnd}
    >
      <h2 className="panel-title">✨ 控制面板</h2>

      <div className="panel-section">
        <label className="panel-label">路径颜色</label>
        <div className="color-picker-wrapper">
          <div className="color-ring">
            <input
              type="color"
              value={pathColor}
              onChange={(e) => setPathColor(e.target.value)}
            />
          </div>
          <svg
            className="picker-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m2 22 1-1h3l9-9" />
            <path d="M3 21v-3l9-9" />
            <path d="m15 6 3.4-3.4a2.1 2.1 0 1 1 3 3L18 9l.4.4a2.1 2.1 0 1 1-3 3l-3.8-3.8a2.1 2.1 0 1 1 3-3l.4.4Z" />
          </svg>
        </div>
      </div>

      <div className="panel-section">
        <label className="panel-label">
          粒子密度 <span style={{ color: '#FFD93D' }}>{particleDensity}</span>
        </label>
        <div className="slider-container">
          <input
            type="range"
            min="5"
            max="20"
            step="1"
            value={particleDensity}
            onChange={(e) => setParticleDensity(Number(e.target.value))}
          />
          <div className="slider-value">
            <span>稀疏 5</span>
            <span>密集 20</span>
          </div>
        </div>
      </div>

      <div className="panel-section">
        <button
          className="clear-button"
          onClick={resetPath}
        >
          🗑️ 清除路径
        </button>
      </div>

      <div style={{
        fontSize: '11px',
        color: 'rgba(255,255,255,0.4)',
        lineHeight: 1.6,
        borderTop: '1px solid rgba(255,255,255,0.05)',
        paddingTop: '16px',
        marginTop: '8px'
      }}>
        <p style={{ marginBottom: '6px' }}>🖱️ 拖拽旋转视角</p>
        <p style={{ marginBottom: '6px' }}>✏️ 画布区绘制路径</p>
        <p>⏱️ 停笔0.5s 自动生长</p>
      </div>
    </div>
  );
};

export default ControlPanel;
