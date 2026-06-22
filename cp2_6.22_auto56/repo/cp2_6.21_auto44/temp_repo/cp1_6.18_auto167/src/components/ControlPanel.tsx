import { useMemo } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { uiConfig, NOISE_LABEL_MAP } from '@/data/uiConfig';
import type { NoiseType, SliderConfig } from '@/types';

function ControlPanel() {
  const {
    cityConfig,
    setNoiseType,
    setDensity,
    setHeightScale,
    setColorContrast,
    isAnimating,
  } = useAppStore();

  const { colorPalette, sliders, noiseButtons, animation } = uiConfig;

  const currentNoiseLabel = NOISE_LABEL_MAP[cityConfig.noiseType];

  const handleSliderChange = (slider: SliderConfig, value: number) => {
    switch (slider.key) {
      case 'density':
        setDensity(value);
        break;
      case 'heightScale':
        setHeightScale(value);
        break;
      case 'colorContrast':
        setColorContrast(value);
        break;
    }
  };

  const sliderValues = useMemo(
    () => ({
      density: cityConfig.density,
      heightScale: cityConfig.heightScale,
      colorContrast: cityConfig.colorContrast,
    }),
    [cityConfig],
  );

  return (
    <div
      className="control-panel"
      style={{
        position: 'absolute',
        top: 20,
        right: 20,
        width: '280px',
        borderRadius: '16px',
        background: colorPalette.panelBg,
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.08)',
        padding: '24px 20px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        zIndex: 10,
        userSelect: 'none',
      }}
    >
      <div
        style={{
          fontWeight: 700,
          fontSize: '16px',
          color: colorPalette.accent,
          marginBottom: '20px',
          letterSpacing: '0.5px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        {isAnimating && (
          <span
            style={{
              display: 'inline-block',
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: colorPalette.accent,
              animation: 'pulse 1s ease-in-out infinite',
            }}
          />
        )}
        {currentNoiseLabel}
      </div>

      <div
        style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '28px',
          flexWrap: 'wrap',
        }}
      >
        {noiseButtons.map((btn) => {
          const isActive = cityConfig.noiseType === btn.key;
          return (
            <button
              key={btn.key}
              onClick={() => setNoiseType(btn.key as NoiseType)}
              title={btn.description}
              style={{
                width: '80px',
                height: '32px',
                borderRadius: '8px',
                border: isActive ? `1px solid ${colorPalette.accent}` : '1px solid transparent',
                background: isActive ? colorPalette.buttonActive : colorPalette.buttonBg,
                color: isActive ? colorPalette.accent : colorPalette.textSecondary,
                fontSize: '12px',
                fontWeight: isActive ? 600 : 400,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                outline: 'none',
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  (e.currentTarget as HTMLButtonElement).style.background = colorPalette.buttonHover;
                  (e.currentTarget as HTMLButtonElement).style.color = colorPalette.textPrimary;
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  (e.currentTarget as HTMLButtonElement).style.background = colorPalette.buttonBg;
                  (e.currentTarget as HTMLButtonElement).style.color = colorPalette.textSecondary;
                }
              }}
            >
              {btn.label}
            </button>
          );
        })}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
        {sliders.map((slider) => {
          const currentValue = sliderValues[slider.key];
          const percentage = ((currentValue - slider.min) / (slider.max - slider.min)) * 100;

          return (
            <div key={slider.key}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '8px',
                }}
              >
                <label
                  style={{
                    fontSize: '13px',
                    color: colorPalette.textSecondary,
                    fontWeight: 500,
                  }}
                >
                  {slider.label}
                </label>
                <span
                  style={{
                    fontSize: '13px',
                    color: colorPalette.accent,
                    fontWeight: 600,
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {slider.format(currentValue)}
                </span>
              </div>
              <div
                style={{
                  position: 'relative',
                  height: '24px',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    width: '100%',
                    height: '4px',
                    borderRadius: '2px',
                    background: colorPalette.sliderTrack,
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${percentage}%`,
                      background: `linear-gradient(90deg, ${colorPalette.accent}88, ${colorPalette.accent})`,
                      transition: `width ${animation.transitionDuration}ms ease`,
                    }}
                  />
                </div>
                <input
                  type="range"
                  min={slider.min}
                  max={slider.max}
                  step={slider.step}
                  value={currentValue}
                  onChange={(e) => handleSliderChange(slider, parseFloat(e.target.value))}
                  style={{
                    position: 'absolute',
                    width: '100%',
                    height: '24px',
                    background: 'transparent',
                    appearance: 'none',
                    WebkitAppearance: 'none',
                    cursor: 'pointer',
                    margin: 0,
                    padding: 0,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div
        style={{
          marginTop: '28px',
          paddingTop: '16px',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          fontSize: '11px',
          color: 'rgba(255,255,255,0.3)',
          lineHeight: '1.6',
        }}
      >
        <div style={{ marginBottom: '4px' }}>🖱️ 左键拖拽旋转 · 滚轮缩放 · 右键平移</div>
        <div>🏢 悬停查看信息 · 点击选中建筑</div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.3); }
        }
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #81ECEC;
          cursor: pointer;
          border: 2px solid #fff;
          box-shadow: 0 2px 6px rgba(129, 236, 236, 0.5);
          transition: transform 0.15s ease, box-shadow 0.15s ease;
        }
        input[type="range"]::-webkit-slider-thumb:hover {
          transform: scale(1.15);
          box-shadow: 0 2px 10px rgba(129, 236, 236, 0.8);
        }
        input[type="range"]::-moz-range-thumb {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #81ECEC;
          cursor: pointer;
          border: 2px solid #fff;
          box-shadow: 0 2px 6px rgba(129, 236, 236, 0.5);
        }
        input[type="range"]:focus {
          outline: none;
        }
        @media (max-width: 1024px) {
          .control-panel {
            width: 220px !important;
            padding: 16px 14px !important;
          }
        }
      `}</style>
    </div>
  );
}

export default ControlPanel;
