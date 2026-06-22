import React from 'react';
import { useTerrainContext } from '../App';
import { LandformType } from '../types';

interface ControlPanelProps {
  iteration: number;
  heightChangePercent: number;
}

const LANDFORMS: { type: LandformType; name: string; color: string; icon: string }[] = [
  { type: 'mountain', name: '山脉', color: '#4a6741', icon: '⛰' },
  { type: 'basin', name: '盆地', color: '#2c5f4f', icon: '◠' },
  { type: 'plain', name: '平原', color: '#8fa055', icon: '▬' },
  { type: 'volcano', name: '火山', color: '#8b0000', icon: '▲' },
];

const ControlPanel: React.FC<ControlPanelProps> = ({ iteration, heightChangePercent }) => {
  const {
    terrainState,
    erosionParams,
    isPlaying,
    setErosionParams,
    setLandform,
    togglePlay,
    resetTerrain,
  } = useTerrainContext();

  const handleSliderChange = (key: keyof typeof erosionParams, value: number) => {
    setErosionParams({
      ...erosionParams,
      [key]: value,
    });
  };

  const sliderStyle: React.CSSProperties = {
    width: '100%',
    height: 6,
    borderRadius: 3,
    background: 'transparent',
    appearance: 'none',
    WebkitAppearance: 'none',
    outline: 'none',
    cursor: 'pointer',
  };

  const sliderTrackStyle = `
    .custom-slider::-webkit-slider-runnable-track {
      height: 6px;
      border-radius: 3px;
      background: linear-gradient(to right, #6c63ff var(--progress), #4a4a6a var(--progress));
    }
    .custom-slider::-moz-range-track {
      height: 6px;
      border-radius: 3px;
      background: #4a4a6a;
    }
    .custom-slider::-moz-range-progress {
      height: 6px;
      border-radius: 3px;
      background: #6c63ff;
    }
    .custom-slider::-webkit-slider-thumb {
      -webkit-appearance: none;
      appearance: none;
      width: 18px;
      height: 18px;
      border-radius: 50%;
      background: #6c63ff;
      cursor: pointer;
      border: 3px solid #ffffff;
      margin-top: -6px;
      box-shadow: 0 2px 8px rgba(108, 99, 255, 0.5);
      transition: transform 0.15s ease;
    }
    .custom-slider::-webkit-slider-thumb:hover {
      transform: scale(1.15);
    }
    .custom-slider::-moz-range-thumb {
      width: 18px;
      height: 18px;
      border-radius: 50%;
      background: #6c63ff;
      cursor: pointer;
      border: 3px solid #ffffff;
      box-shadow: 0 2px 8px rgba(108, 99, 255, 0.5);
    }
  `;

  return (
    <>
      <style>{sliderTrackStyle}</style>
      <div
        style={{
          width: 280,
          minWidth: 280,
          height: '100%',
          background: '#2d2d44',
          padding: '24px 20px',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 24,
          borderRight: '1px solid #3d3d5c',
          boxShadow: '4px 0 20px rgba(0,0,0,0.3)',
        }}
      >
        <div>
          <h1
            style={{
              color: '#ffffff',
              fontSize: 20,
              fontWeight: 700,
              marginBottom: 4,
              letterSpacing: 0.5,
            }}
          >
            地质侵蚀模拟器
          </h1>
          <p style={{ color: '#8a8ab0', fontSize: 12, margin: 0 }}>
            Geo Erosion Simulator
          </p>
        </div>

        <div>
          <h3
            style={{
              color: '#ffffff',
              fontSize: 14,
              fontWeight: 600,
              marginBottom: 16,
              paddingBottom: 8,
              borderBottom: '1px solid #3d3d5c',
            }}
          >
            地貌选择
          </h3>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: 20,
              justifyItems: 'center',
            }}
          >
            {LANDFORMS.map((landform) => (
              <div
                key={landform.type}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <button
                  onClick={() => setLandform(landform.type)}
                  style={{
                    width: 70,
                    height: 70,
                    borderRadius: '50%',
                    border: terrainState.landform === landform.type
                      ? '3px solid #6c63ff'
                      : '3px solid #4a4a6a',
                    background: `linear-gradient(135deg, ${landform.color}dd, ${landform.color}88)`,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 28,
                    color: '#ffffff',
                    boxShadow: terrainState.landform === landform.type
                      ? `0 0 20px ${landform.color}aa, 0 4px 12px rgba(0,0,0,0.3)`
                      : '0 4px 12px rgba(0,0,0,0.3)',
                    transition: 'all 0.2s ease',
                    transform: terrainState.landform === landform.type ? 'scale(1.05)' : 'scale(1)',
                  }}
                  onMouseEnter={(e) => {
                    if (terrainState.landform !== landform.type) {
                      e.currentTarget.style.transform = 'scale(1.08)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (terrainState.landform !== landform.type) {
                      e.currentTarget.style.transform = 'scale(1)';
                    }
                  }}
                >
                  {landform.icon}
                </button>
                <span
                  style={{
                    color: '#ffffff',
                    fontSize: 12,
                    fontWeight: 500,
                  }}
                >
                  {landform.name}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div
          style={{
            background: '#3d3d5c',
            borderRadius: 12,
            padding: 16,
            border: '1px solid #4a4a6a',
          }}
        >
          <h3
            style={{
              color: '#ffffff',
              fontSize: 14,
              fontWeight: 600,
              marginBottom: 12,
            }}
          >
            模拟状态
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span style={{ color: '#8a8ab0', fontSize: 13 }}>迭代次数</span>
              <span
                style={{
                  color: '#6c63ff',
                  fontSize: 16,
                  fontWeight: 700,
                  fontFamily: 'monospace',
                }}
              >
                {iteration}
              </span>
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span style={{ color: '#8a8ab0', fontSize: 13 }}>总高度变化</span>
              <span
                style={{
                  color: heightChangePercent >= 0 ? '#4ade80' : '#f87171',
                  fontSize: 16,
                  fontWeight: 700,
                  fontFamily: 'monospace',
                }}
              >
                {heightChangePercent >= 0 ? '+' : ''}
                {heightChangePercent.toFixed(2)}%
              </span>
            </div>
          </div>
        </div>

        <div>
          <h3
            style={{
              color: '#ffffff',
              fontSize: 14,
              fontWeight: 600,
              marginBottom: 16,
              paddingBottom: 8,
              borderBottom: '1px solid #3d3d5c',
            }}
          >
            侵蚀参数
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 8,
                }}
              >
                <label style={{ color: '#ffffff', fontSize: 14, fontWeight: 500 }}>
                  💨 风力侵蚀
                </label>
                <span
                  style={{
                    color: '#6c63ff',
                    fontSize: 14,
                    fontWeight: 700,
                    fontFamily: 'monospace',
                    minWidth: 32,
                    textAlign: 'right',
                  }}
                >
                  {erosionParams.windStrength}
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={erosionParams.windStrength}
                onChange={(e) => handleSliderChange('windStrength', parseInt(e.target.value))}
                className="custom-slider"
                style={{
                  ...sliderStyle,
                  ['--progress' as string]: `${erosionParams.windStrength}%`,
                }}
              />
            </div>

            <div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 8,
                }}
              >
                <label style={{ color: '#ffffff', fontSize: 14, fontWeight: 500 }}>
                  💧 水流侵蚀
                </label>
                <span
                  style={{
                    color: '#6c63ff',
                    fontSize: 14,
                    fontWeight: 700,
                    fontFamily: 'monospace',
                    minWidth: 32,
                    textAlign: 'right',
                  }}
                >
                  {erosionParams.waterStrength}
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={erosionParams.waterStrength}
                onChange={(e) => handleSliderChange('waterStrength', parseInt(e.target.value))}
                className="custom-slider"
                style={{
                  ...sliderStyle,
                  ['--progress' as string]: `${erosionParams.waterStrength}%`,
                }}
              />
            </div>

            <div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 8,
                }}
              >
                <label style={{ color: '#ffffff', fontSize: 14, fontWeight: 500 }}>
                  ❄️ 冰川侵蚀
                </label>
                <span
                  style={{
                    color: '#6c63ff',
                    fontSize: 14,
                    fontWeight: 700,
                    fontFamily: 'monospace',
                    minWidth: 32,
                    textAlign: 'right',
                  }}
                >
                  {erosionParams.glacierStrength}
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={erosionParams.glacierStrength}
                onChange={(e) => handleSliderChange('glacierStrength', parseInt(e.target.value))}
                className="custom-slider"
                style={{
                  ...sliderStyle,
                  ['--progress' as string]: `${erosionParams.glacierStrength}%`,
                }}
              />
            </div>
          </div>
        </div>

        <div style={{ marginTop: 'auto', display: 'flex', gap: 12 }}>
          <button
            onClick={togglePlay}
            style={{
              flex: 1,
              padding: '14px 16px',
              borderRadius: 10,
              border: 'none',
              background: isPlaying
                ? 'linear-gradient(135deg, #f87171, #ef4444)'
                : 'linear-gradient(135deg, #6c63ff, #5856e6)',
              color: '#ffffff',
              fontSize: 14,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              boxShadow: isPlaying
                ? '0 4px 16px rgba(239, 68, 68, 0.4)'
                : '0 4px 16px rgba(108, 99, 255, 0.4)',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            {isPlaying ? (
              <>
                <span>⏸</span> 暂停
              </>
            ) : (
              <>
                <span>▶</span> 播放
              </>
            )}
          </button>

          <button
            onClick={resetTerrain}
            style={{
              padding: '14px 18px',
              borderRadius: 10,
              border: '2px solid #4a4a6a',
              background: 'transparent',
              color: '#ffffff',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#6c63ff';
              e.currentTarget.style.background = 'rgba(108, 99, 255, 0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#4a4a6a';
              e.currentTarget.style.background = 'transparent';
            }}
            title="重置地形"
          >
            ↻
          </button>
        </div>

        <div
          style={{
            color: '#5a5a7a',
            fontSize: 11,
            textAlign: 'center',
            paddingTop: 8,
            borderTop: '1px solid #3d3d5c',
          }}
        >
          左键旋转 · 右键平移 · 滚轮缩放
        </div>
      </div>
    </>
  );
};

export default ControlPanel;
