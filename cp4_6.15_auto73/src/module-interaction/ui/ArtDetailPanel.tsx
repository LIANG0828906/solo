import { useState, useEffect } from 'react';
import { X, RotateCcw, Palette, Gauge } from 'lucide-react';
import type { Artwork, ColorPreset } from '@/types';
import { useGalleryStore } from '@/store/useGalleryStore';

const colorPresets: ColorPreset[] = [
  {
    id: 'neon-purple',
    name: '霓虹紫紫',
    colors: ['#9333ea', '#c026d3', '#581c87'],
  },
  {
    id: 'ocean-blue',
    name: '海洋蓝',
    colors: ['#3b82f6', '#06b6d4', '#1e3a8a'],
  },
  {
    id: 'golden-dusk',
    name: '金色黄昏',
    colors: ['#fbbf24', '#f97316', '#991b1b'],
  },
  {
    id: 'emerald-green',
    name: '翡翠绿',
    colors: ['#22c55e', '#14b8a6', '#166534'],
  },
  {
    id: 'aurora-pink',
    name: '极光粉',
    colors: ['#ec4899', '#8b5cf6', '#ffffff'],
  },
];

interface ArtDetailPanelProps {
  artwork: Artwork | null;
  onClose: () => void;
}

export default function ArtDetailPanel({ artwork, onClose }: ArtDetailPanelProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const { updateArtworkColors, updateArtworkSpeed, resetArtwork } = useGalleryStore();

  useEffect(() => {
    if (artwork) {
      requestAnimationFrame(() => {
        setIsVisible(true);
      });
    } else {
      setIsVisible(false);
    }
  }, [artwork]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  const handleColorSelect = (colors: string[]) => {
    if (artwork) {
      updateArtworkColors(artwork.id, colors);
    }
  };

  const handleSpeedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (artwork) {
      const speed = parseFloat(e.target.value);
      updateArtworkSpeed(artwork.id, speed);
    }
  };

  const handleReset = () => {
    if (artwork) {
      setIsPressed(true);
      setTimeout(() => setIsPressed(false), 200);
      resetArtwork(artwork.id);
    }
  };

  if (!artwork) return null;

  return (
    <>
      <div className="art-detail-overlay" data-visible={isVisible} onClick={handleClose} />

      <div className="art-detail-panel" data-visible={isVisible}>
        <div className="art-detail-header">
          <h2 className="art-detail-title">作品详情</h2>
          <button
            type="button"
            className="art-detail-close-btn"
            onClick={handleClose}
            aria-label="关闭"
          >
            <X size={18} />
          </button>
        </div>

        <div className="art-detail-content">
          <div className="art-detail-info">
            <h1 className="artwork-name">{artwork.name}</h1>
            <p className="artwork-author">作者：{artwork.author}</p>
          </div>

          <div className="art-detail-section">
            <p className="artwork-description">{artwork.description}</p>
          </div>

          <div className="art-detail-section">
            <div className="section-header">
              <Palette size={16} className="section-icon icon-purple" />
              <span className="section-label">颜色主题</span>
            </div>
            <div className="color-palette-list">
              {colorPresets.map((preset) => {
                const isActive =
                  artwork.colorPalette.length === preset.colors.length &&
                  artwork.colorPalette.every(
                    (c, i) => c.toLowerCase() === preset.colors[i].toLowerCase()
                  );
                return (
                  <button
                    key={preset.id}
                    type="button"
                    className={`color-swatch ${isActive ? 'active' : ''}`}
                    onClick={() => handleColorSelect(preset.colors)}
                    title={preset.name}
                    style={{
                      background: `linear-gradient(135deg, ${preset.colors.join(', ')})`,
                      boxShadow: isActive ? `0 0 20px ${preset.colors[0]}50` : undefined,
                    }}
                  />
                );
              })}
            </div>
          </div>

          <div className="art-detail-section">
            <div className="section-header">
              <Gauge size={16} className="section-icon icon-cyan" />
              <span className="section-label">粒子速度</span>
              <span className="speed-value">{artwork.particleSpeed.toFixed(1)}x</span>
            </div>
            <div className="speed-slider-container">
              <input
                type="range"
                min="0.1"
                max="3"
                step="0.1"
                value={artwork.particleSpeed}
                onChange={handleSpeedChange}
                className="speed-slider-input"
              />
              <div
                className="speed-slider-thumb"
                style={{ left: `${((artwork.particleSpeed - 0.1) / (3 - 0.1)) * 100}%` }}
              />
            </div>
            <div className="speed-labels">
              <span>0.1x</span>
              <span>3.0x</span>
            </div>
          </div>

          <button
            type="button"
            className={`reset-button ${isPressed ? 'pressed' : ''}`}
            onClick={handleReset}
            onMouseDown={() => setIsPressed(true)}
            onMouseUp={() => setIsPressed(false)}
            onMouseLeave={() => setIsPressed(false)}
          >
            <RotateCcw size={16} />
            重置作品
          </button>
        </div>
      </div>

      <style>{`
        .art-detail-overlay {
          position: fixed;
          inset: 0;
          background-color: rgba(0, 0, 0, 0.4);
          opacity: 0;
          transition: opacity 0.3s ease-in-out;
          z-index: 40;
          pointer-events: none;
        }
        
        .art-detail-overlay[data-visible="true"] {
          opacity: 1;
          pointer-events: auto;
        }
        
        .art-detail-panel {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          max-height: 70vh;
          background-color: rgba(15, 15, 35, 0.75);
          backdrop-filter: blur(15px);
          -webkit-backdrop-filter: blur(15px);
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          border-top-left-radius: 24px;
          border-top-right-radius: 24px;
          box-shadow: 0 -8px 40px rgba(139, 92, 246, 0.15);
          transform: translateY(100%);
          transition: transform 0.3s ease-in-out;
          z-index: 50;
          display: flex;
          flex-direction: column;
          font-family: 'Orbitron', sans-serif;
          color: #ffffff;
          overflow: hidden;
        }
        
        .art-detail-panel[data-visible="true"] {
          transform: translateY(0);
        }
        
        @media (min-width: 1200px) {
          .art-detail-panel {
            top: 0;
            right: 0;
            bottom: auto;
            left: auto;
            width: 360px;
            height: 100vh;
            max-height: none;
            border-top: none;
            border-left: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 0;
            box-shadow: -8px 0 40px rgba(139, 92, 246, 0.15);
            transform: translateX(100%);
          }
          
          .art-detail-panel[data-visible="true"] {
            transform: translateX(0);
          }
        }
        
        .art-detail-header {
          padding: 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          flex-shrink: 0;
        }
        
        .art-detail-title {
          font-size: 18px;
          font-weight: 600;
          letter-spacing: 1px;
          margin: 0;
          background: linear-gradient(135deg, #a78bfa, #22d3ee);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        
        .art-detail-close-btn {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background-color: rgba(255, 255, 255, 0.08);
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          color: rgba(255, 255, 255, 0.7);
          transition: all 0.2s ease;
        }
        
        .art-detail-close-btn:hover {
          background-color: rgba(255, 255, 255, 0.15);
          color: #ffffff;
        }
        
        .art-detail-content {
          padding: 24px;
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 28px;
          overflow-y: auto;
        }
        
        .art-detail-info {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        
        .artwork-name {
          font-size: 26px;
          font-weight: 700;
          letter-spacing: 0.5px;
          margin: 0;
          line-height: 1.3;
        }
        
        .artwork-author {
          font-size: 14px;
          color: rgba(255, 255, 255, 0.6);
          margin: 0;
          letter-spacing: 0.5px;
        }
        
        .art-detail-section {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        
        .artwork-description {
          font-size: 13px;
          line-height: 1.8;
          color: rgba(255, 255, 255, 0.75);
          margin: 0;
          font-weight: 300;
        }
        
        .section-header {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .section-icon {
          flex-shrink: 0;
        }
        
        .icon-purple {
          color: #a78bfa;
        }
        
        .icon-cyan {
          color: #22d3ee;
        }
        
        .section-label {
          font-size: 14px;
          font-weight: 500;
          letter-spacing: 0.5px;
        }
        
        .color-palette-list {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }
        
        .color-swatch {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          border: 2px solid rgba(255, 255, 255, 0.2);
          cursor: pointer;
          transition: all 0.5s ease;
          padding: 0;
        }
        
        .color-swatch:hover {
          transform: scale(1.15);
        }
        
        .color-swatch.active {
          border-color: #ffffff;
          transform: scale(1.1);
        }
        
        .speed-value {
          margin-left: auto;
          font-size: 13px;
          color: rgba(255, 255, 255, 0.6);
        }
        
        .speed-slider-container {
          position: relative;
          height: 8px;
          border-radius: 4px;
          background: linear-gradient(90deg, #8b5cf6, #06b6d4, #8b5cf6);
          background-size: 200% 100%;
          animation: flow 3s linear infinite;
        }
        
        .speed-slider-input {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          opacity: 0;
          cursor: pointer;
          margin: 0;
        }
        
        .speed-slider-thumb {
          position: absolute;
          top: 50%;
          transform: translate(-50%, -50%);
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background-color: #ffffff;
          box-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
          transition: left 0.3s ease;
          pointer-events: none;
        }
        
        .speed-labels {
          display: flex;
          justify-content: space-between;
          font-size: 11px;
          color: rgba(255, 255, 255, 0.4);
        }
        
        .reset-button {
          margin-top: auto;
          width: 100%;
          padding: 14px 20px;
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.15);
          background-color: rgba(255, 255, 255, 0.05);
          color: #ffffff;
          font-size: 14px;
          font-weight: 500;
          letter-spacing: 1px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: all 0.2s ease;
          font-family: 'Orbitron', sans-serif;
          flex-shrink: 0;
        }
        
        .reset-button:hover {
          background-color: rgba(255, 255, 255, 0.12);
          border-color: rgba(255, 255, 255, 0.25);
        }
        
        .reset-button.pressed {
          transform: scale(0.95);
        }
        
        @keyframes flow {
          0% {
            background-position: 0% 50%;
          }
          100% {
            background-position: 200% 50%;
          }
        }
      `}</style>
    </>
  );
}
