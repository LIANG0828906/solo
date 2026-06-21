import { useState, useEffect } from 'react';
import { useSolarStore } from '../store/useSolarStore';
import { COLORS, UI_CONFIG } from '../utils/constants';
import { Play, Pause, RotateCcw, Zap, Tag, Orbit } from 'lucide-react';

export default function ControlPanel() {
  const showOrbits = useSolarStore((state) => state.showOrbits);
  const showLabels = useSolarStore((state) => state.showLabels);
  const glowIntensity = useSolarStore((state) => state.glowIntensity);
  const speedMultiplier = useSolarStore((state) => state.speedMultiplier);
  const isPaused = useSolarStore((state) => state.isPaused);
  const performanceMode = useSolarStore((state) => state.performanceMode);

  const toggleOrbits = useSolarStore((state) => state.toggleOrbits);
  const toggleLabels = useSolarStore((state) => state.toggleLabels);
  const setGlowIntensity = useSolarStore((state) => state.setGlowIntensity);
  const setSpeedMultiplier = useSolarStore((state) => state.setSpeedMultiplier);
  const togglePause = useSolarStore((state) => state.togglePause);
  const togglePerformanceMode = useSolarStore((state) => state.togglePerformanceMode);
  const resetView = useSolarStore((state) => state.resetView);

  const [isMobile, setIsMobile] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < UI_CONFIG.mobileBreakpoint);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const panelContent = (
    <div style={{ padding: '20px', color: COLORS.textPrimary }}>
      <h2 style={{
        margin: 0,
        marginBottom: '20px',
        fontSize: '16px',
        fontWeight: 700,
        color: COLORS.textPrimary,
      }}>
        太阳系漫游指南
      </h2>

      <div style={{ marginBottom: '20px' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '16px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {showOrbits ? <Orbit size={16} color={COLORS.accentLight} /> : <Orbit size={16} color="#64748b" />}
            <span style={{ fontSize: '14px' }}>轨道线</span>
          </div>
          <ToggleSwitch checked={showOrbits} onChange={toggleOrbits} />
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '16px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {showLabels ? <Tag size={16} color={COLORS.accentLight} /> : <Tag size={16} color="#64748b" />}
            <span style={{ fontSize: '14px' }}>行星标签</span>
          </div>
          <ToggleSwitch checked={showLabels} onChange={toggleLabels} />
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '16px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {performanceMode ? <Zap size={16} color={COLORS.accentLight} /> : <Zap size={16} color="#64748b" />}
            <span style={{ fontSize: '14px' }}>性能模式</span>
          </div>
          <ToggleSwitch checked={performanceMode} onChange={togglePerformanceMode} />
        </div>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <div style={{
          fontSize: '14px',
          marginBottom: '8px',
          color: COLORS.textSecondary,
        }}>
          光晕强度: {(glowIntensity * 100).toFixed(0)}%
        </div>
        <StyledSlider
          value={glowIntensity}
          min={0}
          max={1}
          step={0.01}
          onChange={setGlowIntensity}
          disabled={performanceMode}
        />
      </div>

      <div style={{ marginBottom: '20px' }}>
        <div style={{
          fontSize: '14px',
          marginBottom: '8px',
          color: COLORS.textSecondary,
        }}>
          公转速度: {speedMultiplier.toFixed(1)}x
        </div>
        <StyledSlider
          value={speedMultiplier}
          min={0.1}
          max={5}
          step={0.1}
          onChange={setSpeedMultiplier}
        />
      </div>

      <div style={{
        display: 'flex',
        gap: '10px',
        marginBottom: '16px',
      }}>
        <button
          onClick={togglePause}
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            padding: '10px 12px',
            backgroundColor: COLORS.accent,
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 500,
            transition: 'all 0.3s ease-in-out',
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = COLORS.accentLight;
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = COLORS.accent;
          }}
        >
          {isPaused ? <Play size={16} /> : <Pause size={16} />}
          {isPaused ? '继续' : '暂停'}
        </button>

        <button
          onClick={resetView}
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            padding: '10px 12px',
            backgroundColor: COLORS.trackBg,
            color: COLORS.textPrimary,
            border: `1px solid ${COLORS.panelBorder}`,
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 500,
            transition: 'all 0.3s ease-in-out',
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = '#334155';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = COLORS.trackBg;
          }}
        >
          <RotateCcw size={16} />
          重置视角
        </button>
      </div>

      <div style={{
        fontSize: '12px',
        color: COLORS.textSecondary,
        lineHeight: 1.6,
        paddingTop: '16px',
        borderTop: `1px solid ${COLORS.panelBorder}`,
      }}>
        <p style={{ margin: '0 0 8px 0', fontWeight: 600, color: COLORS.textPrimary }}>操作提示</p>
        <p style={{ margin: '4px 0' }}>• 拖拽鼠标旋转视角</p>
        <p style={{ margin: '4px 0' }}>• 滚轮缩放视图</p>
        <p style={{ margin: '4px 0' }}>• 右键拖拽平移</p>
        <p style={{ margin: '4px 0' }}>• 点击行星查看详情</p>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <>
        <button
          onClick={() => setIsDrawerOpen(true)}
          style={{
            position: 'fixed',
            bottom: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 100,
            padding: '12px 24px',
            backgroundColor: COLORS.panelBg,
            color: COLORS.textPrimary,
            border: `1px solid ${COLORS.panelBorder}`,
            borderRadius: '24px',
            backdropFilter: 'blur(10px)',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 500,
            transition: 'all 0.3s ease-in-out',
          }}
        >
          控制面板
        </button>

        {isDrawerOpen && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              zIndex: 200,
              opacity: isDrawerOpen ? 1 : 0,
              transition: 'opacity 0.3s ease-in-out',
            }}
            onClick={() => setIsDrawerOpen(false)}
          />
        )}

        <div
          style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            height: isDrawerOpen ? '40vh' : '0',
            backgroundColor: COLORS.panelBg,
            backdropFilter: 'blur(10px)',
            borderTop: `1px solid ${COLORS.panelBorder}`,
            borderRadius: '16px 16px 0 0',
            zIndex: 300,
            overflow: 'hidden',
            transform: isDrawerOpen ? 'translateY(0)' : 'translateY(100%)',
            transition: 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
          }}
        >
          <div
            style={{
              width: '40px',
              height: '8px',
              backgroundColor: '#475569',
              borderRadius: '4px',
              margin: '12px auto',
            }}
          />
          <div style={{ overflowY: 'auto', height: 'calc(100% - 32px)' }}>
            {panelContent}
          </div>
        </div>
      </>
    );
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: `${UI_CONFIG.panelWidth}px`,
        height: '100vh',
        backgroundColor: COLORS.panelBg,
        backdropFilter: 'blur(10px)',
        borderRight: `1px solid ${COLORS.panelBorder}`,
        borderRadius: '0 16px 16px 0',
        zIndex: 100,
        overflowY: 'auto',
        transition: 'all 0.3s ease-in-out',
      }}
    >
      {panelContent}
    </div>
  );
}

interface ToggleSwitchProps {
  checked: boolean;
  onChange: () => void;
}

function ToggleSwitch({ checked, onChange }: ToggleSwitchProps) {
  return (
    <div
      onClick={onChange}
      style={{
        width: '44px',
        height: '24px',
        backgroundColor: checked ? COLORS.accent : COLORS.trackBg,
        borderRadius: '12px',
        cursor: 'pointer',
        position: 'relative',
        transition: 'background-color 0.3s ease-in-out',
      }}
    >
      <div
        style={{
          width: '20px',
          height: '20px',
          backgroundColor: checked ? COLORS.accentLight : '#94A3B8',
          borderRadius: '50%',
          position: 'absolute',
          top: '2px',
          left: checked ? '22px' : '2px',
          transition: 'all 0.3s ease-in-out',
        }}
      />
    </div>
  );
}

interface StyledSliderProps {
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}

function StyledSlider({ value, min, max, step, onChange, disabled = false }: StyledSliderProps) {
  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <div style={{
      position: 'relative',
      width: '160px',
      height: '20px',
      display: 'flex',
      alignItems: 'center',
      opacity: disabled ? 0.5 : 1,
      pointerEvents: disabled ? 'none' : 'auto',
    }}>
      <div style={{
        position: 'absolute',
        left: 0,
        right: 0,
        height: '4px',
        backgroundColor: COLORS.trackBg,
        borderRadius: '2px',
      }}>
        <div style={{
          height: '100%',
          width: `${percentage}%`,
          backgroundColor: COLORS.accent,
          borderRadius: '2px',
          transition: 'width 0.2s ease-out',
        }} />
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        style={{
          position: 'absolute',
          width: '100%',
          height: '20px',
          margin: 0,
          opacity: 0,
          cursor: 'pointer',
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: `calc(${percentage}% - 10px)`,
          width: '20px',
          height: '20px',
          backgroundColor: COLORS.accentLight,
          borderRadius: '50%',
          boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
          transition: 'left 0.2s ease-out',
          pointerEvents: 'none',
        }}
      />
    </div>
  );
}
