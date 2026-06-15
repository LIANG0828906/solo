import React from 'react';
import { useGrowthStore } from '../store/growthStore';

const sliderStyles = (gradient: string): React.CSSProperties => ({
  width: '100%',
  height: '6px',
  appearance: 'none',
  WebkitAppearance: 'none',
  background: gradient,
  borderRadius: '3px',
  outline: 'none',
  cursor: 'pointer',
});

const globalSliderCSS = `
  input[type="range"]::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: #fff;
    box-shadow: 0 0 4px rgba(0,0,0,0.4);
    cursor: pointer;
    border: 2px solid rgba(255,255,255,0.8);
  }
  input[type="range"]::-moz-range-thumb {
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: #fff;
    box-shadow: 0 0 4px rgba(0,0,0,0.4);
    cursor: pointer;
    border: 2px solid rgba(255,255,255,0.8);
  }
`;

const lightGradient = 'linear-gradient(to right, #8B6914, #FFD700)';
const waterGradient = 'linear-gradient(to right, #1a3a5c, #4fc3f7)';
const tempGradient = 'linear-gradient(to right, #4fc3f7, #ff5722)';

export default function ControlPanel() {
  const {
    light,
    water,
    temperature,
    isGrowing,
    isPaused,
    setLight,
    setWater,
    setTemperature,
    startGrowing,
    pauseGrowing,
    resumeGrowing,
    resetGrowing,
    randomSeed,
    reset,
  } = useGrowthStore();

  const growthButtonLabel = isGrowing
    ? isPaused
      ? '继续'
      : '暂停'
    : '生长';

  const handleGrowthClick = () => {
    if (!isGrowing) {
      startGrowing();
    } else if (isPaused) {
      resumeGrowing();
    } else {
      pauseGrowing();
    }
  };

  return (
    <>
      <style>{globalSliderCSS}</style>
      <div style={panelStyle}>
        <h2 style={titleStyle}>🌿 植物生长控制</h2>

        <div style={sliderGroupStyle}>
          <div style={sliderHeaderStyle}>
            <span style={labelStyle}>☀️ 光照</span>
            <span style={valueStyle}>{light}</span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={light}
            onChange={(e) => setLight(Number(e.target.value))}
            style={sliderStyles(lightGradient)}
          />
        </div>

        <div style={sliderGroupStyle}>
          <div style={sliderHeaderStyle}>
            <span style={labelStyle}>💧 水分</span>
            <span style={valueStyle}>{water}</span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={water}
            onChange={(e) => setWater(Number(e.target.value))}
            style={sliderStyles(waterGradient)}
          />
        </div>

        <div style={sliderGroupStyle}>
          <div style={sliderHeaderStyle}>
            <span style={labelStyle}>🌡️ 温度</span>
            <span style={valueStyle}>{temperature}</span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={temperature}
            onChange={(e) => setTemperature(Number(e.target.value))}
            style={sliderStyles(tempGradient)}
          />
        </div>

        <div style={buttonGroupStyle}>
          <button onClick={handleGrowthClick} style={buttonStyle}>
            {growthButtonLabel}
          </button>
          <button onClick={randomSeed} style={buttonStyle}>
            🎲 随机种子
          </button>
          <button onClick={reset} style={buttonStyle}>
            ↺ 重置
          </button>
        </div>
      </div>
    </>
  );
}

const panelStyle: React.CSSProperties = {
  position: 'absolute',
  top: 0,
  right: 0,
  width: '280px',
  height: '100%',
  background: 'rgba(30, 30, 30, 0.85)',
  backdropFilter: 'blur(8px)',
  WebkitBackdropFilter: 'blur(8px)',
  padding: '24px 20px',
  display: 'flex',
  flexDirection: 'column',
  gap: '20px',
  zIndex: 10,
  borderLeft: '1px solid rgba(255,255,255,0.08)',
  overflowY: 'auto',
};

const titleStyle: React.CSSProperties = {
  color: '#c8d6c0',
  fontSize: '16px',
  fontWeight: 600,
  textAlign: 'center',
  margin: 0,
  paddingBottom: '12px',
  borderBottom: '1px solid rgba(255,255,255,0.1)',
};

const sliderGroupStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
};

const sliderHeaderStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
};

const labelStyle: React.CSSProperties = {
  color: '#a8b8a0',
  fontSize: '13px',
};

const valueStyle: React.CSSProperties = {
  color: '#e0e8d8',
  fontSize: '14px',
  fontWeight: 600,
  minWidth: '32px',
  textAlign: 'right',
};

const buttonGroupStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '10px',
  marginTop: '8px',
};

const buttonStyle: React.CSSProperties = {
  padding: '10px 16px',
  border: 'none',
  borderRadius: '8px',
  background: 'linear-gradient(135deg, rgba(80,120,80,0.5), rgba(60,90,60,0.6))',
  color: '#d0dcc8',
  fontSize: '14px',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
  fontWeight: 500,
};
