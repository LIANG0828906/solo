import React from 'react';

interface ParameterPanelProps {
  params: { hue: number; rotation: number; shapeCount: number };
  onParamsChange: (params: { hue: number; rotation: number; shapeCount: number }) => void;
  onPresetClick: (presetName: string) => void;
}

const sliderStyleId = 'parameter-panel-slider-styles';

function injectSliderStyles() {
  if (document.getElementById(sliderStyleId)) return;
  const style = document.createElement('style');
  style.id = sliderStyleId;
  style.textContent = `
    .param-range::-webkit-slider-runnable-track {
      height: 6px;
      background: #D4C9B3;
      border-radius: 3px;
    }
    .param-range::-webkit-slider-thumb {
      -webkit-appearance: none;
      width: 20px;
      height: 20px;
      background: #8B7D6B;
      border-radius: 50%;
      cursor: pointer;
      transition: transform 0.2s, background 0.2s;
      margin-top: -7px;
    }
    .param-range::-webkit-slider-thumb:hover,
    .param-range::-webkit-slider-thumb:active {
      transform: scale(1.2);
      background: #6B5E4D;
    }
    .param-range::-moz-range-track {
      height: 6px;
      background: #D4C9B3;
      border-radius: 3px;
      border: none;
    }
    .param-range::-moz-range-thumb {
      width: 20px;
      height: 20px;
      background: #8B7D6B;
      border-radius: 50%;
      cursor: pointer;
      border: none;
      transition: transform 0.2s, background 0.2s;
    }
    .param-range::-moz-range-thumb:hover,
    .param-range::-moz-range-thumb:active {
      transform: scale(1.2);
      background: #6B5E4D;
    }
    .param-range {
      -webkit-appearance: none;
      appearance: none;
      width: 100%;
      background: transparent;
      outline: none;
    }
  `;
  document.head.appendChild(style);
}

const ParameterPanel: React.FC<ParameterPanelProps> = ({ params, onParamsChange, onPresetClick }) => {
  React.useEffect(() => {
    injectSliderStyles();
  }, []);

  const handleChange = (key: keyof typeof params, value: number) => {
    onParamsChange({ ...params, [key]: value });
  };

  const presets = ['几何风暴', '光纤漩涡', '像素浪潮'];

  return (
    <div
      style={{
        width: 320,
        height: '100vh',
        background: '#F5F0E8',
        padding: 24,
        overflowY: 'auto',
        position: 'relative',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background:
            'repeating-linear-gradient(0deg, transparent, transparent 28px, rgba(0,0,0,0.02) 28px, rgba(0,0,0,0.02) 29px), repeating-linear-gradient(90deg, transparent, transparent 28px, rgba(0,0,0,0.015) 28px, rgba(0,0,0,0.015) 29px)',
          pointerEvents: 'none',
        }}
      />

      <div style={{ position: 'relative' }}>
        <h2
          style={{
            fontSize: 20,
            color: '#5C4F3D',
            marginBottom: 24,
            fontWeight: 600,
          }}
        >
          参数控制
        </h2>

        <div style={{ marginBottom: 20 }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 8,
            }}
          >
            <span style={{ fontSize: 14, color: '#6B5E4D' }}>色相</span>
            <span style={{ fontSize: 14, color: '#8B7D6B', fontWeight: 500 }}>
              {params.hue}
            </span>
          </div>
          <input
            type="range"
            className="param-range"
            min={0}
            max={360}
            step={1}
            value={params.hue}
            onChange={(e) => handleChange('hue', Number(e.target.value))}
          />
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: `hsl(${params.hue}, 70%, 55%)`,
              border: '2px solid #D4C9B3',
              marginTop: 10,
            }}
          />
        </div>

        <div style={{ marginBottom: 20 }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 8,
            }}
          >
            <span style={{ fontSize: 14, color: '#6B5E4D' }}>旋转角度</span>
            <span style={{ fontSize: 14, color: '#8B7D6B', fontWeight: 500 }}>
              {params.rotation}
            </span>
          </div>
          <input
            type="range"
            className="param-range"
            min={0}
            max={360}
            step={1}
            value={params.rotation}
            onChange={(e) => handleChange('rotation', Number(e.target.value))}
          />
        </div>

        <div style={{ marginBottom: 20 }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 8,
            }}
          >
            <span style={{ fontSize: 14, color: '#6B5E4D' }}>形状数量</span>
            <span style={{ fontSize: 14, color: '#8B7D6B', fontWeight: 500 }}>
              {params.shapeCount}
            </span>
          </div>
          <input
            type="range"
            className="param-range"
            min={3}
            max={15}
            step={1}
            value={params.shapeCount}
            onChange={(e) => handleChange('shapeCount', Number(e.target.value))}
          />
        </div>

        <div style={{ display: 'flex', gap: 8, marginTop: 32 }}>
          {presets.map((name) => (
            <button
              key={name}
              onClick={() => onPresetClick(name)}
              onMouseDown={(e) => {
                const el = e.currentTarget;
                el.style.transform = 'scale(0.95)';
                el.style.background = '#D4C9B3';
              }}
              onMouseUp={(e) => {
                const el = e.currentTarget;
                el.style.transform = 'scale(1.02)';
                el.style.background = '#EDE8DC';
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget;
                el.style.transform = 'scale(1)';
                el.style.background = '#FFFDF8';
              }}
              onMouseOver={(e) => {
                const el = e.currentTarget;
                if (el.style.transform !== 'scale(0.95)') {
                  el.style.background = '#EDE8DC';
                  el.style.transform = 'scale(1.02)';
                }
              }}
              style={{
                padding: '8px 12px',
                border: '1px solid #D4C9B3',
                background: '#FFFDF8',
                color: '#6B5E4D',
                borderRadius: 8,
                cursor: 'pointer',
                fontSize: 13,
                flex: 1,
                transition: 'all 0.2s',
              }}
            >
              {name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ParameterPanel;
