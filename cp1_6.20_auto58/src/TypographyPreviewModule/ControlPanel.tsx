import React, { useState, useEffect } from 'react';
import { AlignLeft, AlignCenter, AlignRight } from 'lucide-react';
import { useTypographyStore, TextAlign } from './TypographyContext';

interface SliderConfig {
  key: keyof Pick<
    ReturnType<typeof useTypographyStore.getState>['params'],
    'headingSize' | 'bodySize' | 'lineHeight' | 'letterSpacing' | 'paragraphSpacing'
  >;
  label: string;
  min: number;
  max: number;
  step: number;
  format: (value: number) => string;
}

const SLIDER_CONFIGS: SliderConfig[] = [
  {
    key: 'headingSize',
    label: '标题字号',
    min: 12,
    max: 72,
    step: 1,
    format: (v) => `${v}px`,
  },
  {
    key: 'bodySize',
    label: '正文字号',
    min: 12,
    max: 72,
    step: 1,
    format: (v) => `${v}px`,
  },
  {
    key: 'lineHeight',
    label: '行高',
    min: 1.0,
    max: 2.0,
    step: 0.05,
    format: (v) => v.toFixed(2),
  },
  {
    key: 'letterSpacing',
    label: '字间距',
    min: -2,
    max: 8,
    step: 0.5,
    format: (v) => `${v}px`,
  },
  {
    key: 'paragraphSpacing',
    label: '段落间距',
    min: 0,
    max: 40,
    step: 1,
    format: (v) => `${v}px`,
  },
];

const ALIGN_OPTIONS: { value: TextAlign; Icon: typeof AlignLeft }[] = [
  { value: 'left', Icon: AlignLeft },
  { value: 'center', Icon: AlignCenter },
  { value: 'right', Icon: AlignRight },
];

const panelStyle: React.CSSProperties = {
  width: 260,
  background: 'rgba(255,255,255,0.75)',
  backdropFilter: 'blur(8px)',
  WebkitBackdropFilter: 'blur(8px)',
  border: '1px solid rgba(0,0,0,0.08)',
  borderTopLeftRadius: 16,
  borderBottomLeftRadius: 16,
  boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
  padding: 20,
  position: 'fixed',
  right: 0,
  top: '50%',
  transform: 'translateY(-50%)',
  zIndex: 50,
  transition: 'all 0.3s ease',
};

const titleStyle: React.CSSProperties = {
  color: '#2C3E50',
  fontSize: 14,
  fontWeight: 700,
  marginBottom: 16,
};

const sliderWrapperStyle: React.CSSProperties = {
  marginBottom: 18,
};

const sliderLabelRowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 8,
};

const sliderLabelStyle: React.CSSProperties = {
  fontSize: 12,
  color: '#5A6C7D',
  fontWeight: 500,
};

const valueBubbleStyle: React.CSSProperties = {
  background: 'rgba(44,62,80,0.85)',
  color: '#ffffff',
  fontSize: 11,
  padding: '2px 8px',
  borderRadius: 8,
  fontWeight: 600,
  opacity: 0,
  transition: 'opacity 0.2s ease',
  pointerEvents: 'none',
};

const valueBubbleVisibleStyle: React.CSSProperties = {
  ...valueBubbleStyle,
  opacity: 1,
};

const sliderContainerStyle: React.CSSProperties = {
  position: 'relative',
  height: 20,
  display: 'flex',
  alignItems: 'center',
};

const trackStyle: React.CSSProperties = {
  position: 'absolute',
  left: 0,
  right: 0,
  height: 4,
  background: '#E0E0E0',
  borderRadius: 2,
};

const fillStyle: React.CSSProperties = {
  position: 'absolute',
  left: 0,
  height: 4,
  background: '#E27D60',
  borderRadius: 2,
};

const thumbStyle: React.CSSProperties = {
  position: 'absolute',
  width: 16,
  height: 16,
  borderRadius: '50%',
  background: '#E27D60',
  cursor: 'grab',
  transition: 'transform 0.2s ease',
  boxShadow: '0 2px 6px rgba(226,125,96,0.4)',
  zIndex: 2,
  transform: 'translateX(-50%)',
  userSelect: 'none',
};

const thumbActiveStyle: React.CSSProperties = {
  ...thumbStyle,
  transform: 'translateX(-50%) scale(1.15)',
  cursor: 'grabbing',
};

const alignGroupStyle: React.CSSProperties = {
  display: 'flex',
  gap: 8,
  marginTop: 8,
};

const alignButtonBaseStyle: React.CSSProperties = {
  flex: 1,
  aspectRatio: '1 / 1',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: 8,
  border: 'none',
  cursor: 'pointer',
  transition: 'all 0.15s ease',
};

const alignButtonUnselectedStyle: React.CSSProperties = {
  ...alignButtonBaseStyle,
  background: '#F0F0F0',
  color: '#2C3E50',
};

const alignButtonSelectedStyle: React.CSSProperties = {
  ...alignButtonBaseStyle,
  background: '#2C3E50',
  color: '#ffffff',
};

const alignSectionTitleStyle: React.CSSProperties = {
  fontSize: 12,
  color: '#5A6C7D',
  fontWeight: 500,
  marginTop: 20,
  marginBottom: 8,
};

function Slider({ config }: { config: SliderConfig }) {
  const { params, setParams } = useTypographyStore();
  const value = params[config.key] as number;
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const trackRef = React.useRef<HTMLDivElement>(null);

  const percentage =
    ((value - config.min) / (config.max - config.min)) * 100;

  const updateValueFromClientX = (clientX: number) => {
    if (!trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    let pct = (clientX - rect.left) / rect.width;
    pct = Math.max(0, Math.min(1, pct));
    const raw = config.min + pct * (config.max - config.min);
    const stepped = Math.round(raw / config.step) * config.step;
    const clamped = Math.max(config.min, Math.min(config.max, stepped));
    const roundedValue = Number(clamped.toFixed(2));
    setParams({ [config.key]: roundedValue } as Record<string, number>);
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMove = (e: MouseEvent | TouchEvent) => {
      const clientX =
        'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
      updateValueFromClientX(clientX);
    };

    const handleUp = () => {
      setIsDragging(false);
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    window.addEventListener('touchmove', handleMove, { passive: false });
    window.addEventListener('touchend', handleUp);

    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleUp);
    };
  }, [isDragging, config]);

  const bubbleVisible = isHovered || isDragging;

  return (
    <div style={sliderWrapperStyle}>
      <div style={sliderLabelRowStyle}>
        <span style={sliderLabelStyle}>{config.label}</span>
        <span style={bubbleVisible ? valueBubbleVisibleStyle : valueBubbleStyle}>
          {config.format(value)}
        </span>
      </div>
      <div
        style={sliderContainerStyle}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div ref={trackRef} style={trackStyle}>
          <div style={{ ...fillStyle, width: `${percentage}%` }} />
        </div>
        <div
          style={isDragging ? thumbActiveStyle : thumbStyle}
          onMouseDown={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onTouchStart={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onClick={(e) => {
            updateValueFromClientX((e as React.MouseEvent).clientX);
          }}
        />
        <input
          type="range"
          min={config.min}
          max={config.max}
          step={config.step}
          value={value}
          onChange={(e) => setParams({ [config.key]: Number(e.target.value) } as Record<string, number>)}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            opacity: 0,
            cursor: 'pointer',
            margin: 0,
            padding: 0,
            zIndex: 3,
          }}
          aria-label={config.label}
        />
      </div>
    </div>
  );
}

function AlignButtons() {
  const { params, setParams } = useTypographyStore();
  const [pressed, setPressed] = useState<string | null>(null);

  return (
    <>
      <div style={alignSectionTitleStyle}>对齐方式</div>
      <div style={alignGroupStyle}>
        {ALIGN_OPTIONS.map(({ value, Icon }) => {
          const isSelected = params.textAlign === value;
          const isPressed = pressed === value;
          return (
            <button
              key={value}
              type="button"
              style={{
                ...(isSelected ? alignButtonSelectedStyle : alignButtonUnselectedStyle),
                transform: isPressed ? 'scale(0.95)' : 'scale(1)',
              }}
              onMouseDown={() => setPressed(value)}
              onMouseUp={() => setPressed(null)}
              onMouseLeave={() => setPressed(null)}
              onTouchStart={() => setPressed(value)}
              onTouchEnd={() => setPressed(null)}
              onClick={() => setParams({ textAlign: value })}
              aria-label={`${value} align`}
            >
              <Icon size={18} strokeWidth={2} />
            </button>
          );
        })}
      </div>
    </>
  );
}

export default function ControlPanel() {
  const [isSmallScreen, setIsSmallScreen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const check = () => setIsSmallScreen(window.innerWidth < 900);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  if (!mounted) return null;

  const responsiveStyle: React.CSSProperties = isSmallScreen
    ? {
        ...panelStyle,
        top: 16,
        right: 16,
        left: 16,
        bottom: 'auto',
        transform: 'none',
        width: 'auto',
        borderTopRightRadius: 16,
        borderBottomRightRadius: 16,
      }
    : panelStyle;

  return (
    <div style={responsiveStyle}>
      <div style={titleStyle}>排版参数</div>
      {SLIDER_CONFIGS.map((config) => (
        <Slider key={config.key} config={config} />
      ))}
      <AlignButtons />
    </div>
  );
}
