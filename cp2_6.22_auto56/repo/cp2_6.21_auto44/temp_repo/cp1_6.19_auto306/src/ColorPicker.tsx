import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import tinycolor from 'tinycolor2';

interface ColorPickerProps {
  label: string;
  value: string;
  onChange: (color: string) => void;
  accentColor: string;
}

interface HSL {
  h: number;
  s: number;
  l: number;
}

const ColorPicker: React.FC<ColorPickerProps> = ({ label, value, onChange, accentColor }) => {
  const [inputValue, setInputValue] = useState(value);
  const [hsl, setHsl] = useState<HSL>(() => {
    const tc = tinycolor(value);
    const hslObj = tc.toHsl();
    return { h: Math.round(hslObj.h), s: Math.round(hslObj.s * 100), l: Math.round(hslObj.l * 100) };
  });
  const [isDraggingSV, setIsDraggingSV] = useState(false);
  const svAreaRef = useRef<HTMLDivElement>(null);
  const [inputError, setInputError] = useState(false);

  useEffect(() => {
    setInputValue(value);
    const tc = tinycolor(value);
    const hslObj = tc.toHsl();
    setHsl({ h: Math.round(hslObj.h), s: Math.round(hslObj.s * 100), l: Math.round(hslObj.l * 100) });
    setInputError(false);
  }, [value]);

  const handleHslChange = useCallback((key: keyof HSL, val: number) => {
    const newHsl = { ...hsl, [key]: val };
    setHsl(newHsl);
    const newColor = tinycolor({ h: newHsl.h, s: newHsl.s / 100, l: newHsl.l / 100 });
    const hex = newColor.toHexString().toUpperCase();
    setInputValue(hex);
    setInputError(false);
    onChange(hex);
  }, [hsl, onChange]);

  const handleHexInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    let val = raw.startsWith('#') ? raw : `#${raw}`;
    setInputValue(raw);
    const tc = tinycolor(val);
    if (tc.isValid() && raw.length >= 4) {
      const hex = tc.toHexString().toUpperCase();
      const hslObj = tc.toHsl();
      setHsl({ h: Math.round(hslObj.h), s: Math.round(hslObj.s * 100), l: Math.round(hslObj.l * 100) });
      setInputError(false);
      onChange(hex);
    } else if (raw.length >= 4) {
      setInputError(true);
    } else {
      setInputError(false);
    }
  };

  const handleHexBlur = () => {
    const tc = tinycolor(inputValue);
    if (tc.isValid()) {
      const hex = tc.toHexString().toUpperCase();
      setInputValue(hex);
      setInputError(false);
    } else {
      setInputValue(value);
      setInputError(false);
    }
  };

  const handleSVInteraction = useCallback((clientX: number, clientY: number) => {
    if (!svAreaRef.current) return;
    const rect = svAreaRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (clientY - rect.top) / rect.height));
    const s = Math.round(x * 100);
    const l = Math.round((1 - y) * 100);
    handleHslChange('s', s);
    handleHslChange('l', l);
  }, [handleHslChange]);

  const handleSVMouseDown = (e: React.MouseEvent) => {
    setIsDraggingSV(true);
    handleSVInteraction(e.clientX, e.clientY);
  };

  useEffect(() => {
    if (!isDraggingSV) return;
    const handleMove = (e: MouseEvent) => handleSVInteraction(e.clientX, e.clientY);
    const handleUp = () => setIsDraggingSV(false);
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };
  }, [isDraggingSV, handleSVInteraction]);

  const svBackground = useMemo(() => {
    return `linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, hsl(${hsl.h}, 100%, 50%))`;
  }, [hsl.h]);

  const hueSliderBg = useMemo(() => {
    const stops: string[] = [];
    for (let i = 0; i <= 360; i += 30) {
      stops.push(`hsl(${i}, 100%, 50%) ${(i / 360) * 100}%`);
    }
    return `linear-gradient(to right, ${stops.join(', ')})`;
  }, []);

  const satSliderBg = useMemo(() => {
    return `linear-gradient(to right, hsl(${hsl.h}, 0%, ${hsl.l}%), hsl(${hsl.h}, 100%, ${hsl.l}%))`;
  }, [hsl.h, hsl.l]);

  const lightSliderBg = useMemo(() => {
    return `linear-gradient(to right, #000, hsl(${hsl.h}, ${hsl.s}%, 50%), #fff)`;
  }, [hsl.h, hsl.s]);

  const getGlowColor = () => {
    const tc = tinycolor(accentColor);
    tc.setAlpha(0.3);
    return tc.toRgbString();
  };

  return (
    <div style={styles.container}>
      <div style={styles.labelRow}>
        <span style={styles.label}>{label}</span>
      </div>

      <div style={styles.topRow}>
        <div
          style={{
            ...styles.colorSwatch,
            backgroundColor: value,
            transition: 'background-color 0.3s ease-in-out',
            boxShadow: `0 4px 20px ${tinycolor(value).setAlpha(0.3).toRgbString()}`
          }}
        />
        <div style={styles.hexInputWrap}>
          <span style={styles.hashLabel}>#</span>
          <input
            type="text"
            value={inputValue.replace('#', '')}
            onChange={handleHexInput}
            onBlur={handleHexBlur}
            maxLength={7}
            spellCheck={false}
            style={{
              ...styles.hexInput,
              borderColor: inputError ? '#E74C3C' : 'transparent',
              boxShadow: inputError
                ? `0 0 0 3px rgba(231, 76, 60, 0.2)`
                : undefined,
              transition: 'all 0.3s ease-in-out'
            }}
            onFocus={(e) => {
              e.currentTarget.style.boxShadow = `0 0 0 3px ${getGlowColor()}`;
            }}
            onBlurCapture={(e) => {
              e.currentTarget.style.boxShadow = inputError
                ? `0 0 0 3px rgba(231, 76, 60, 0.2)`
                : 'none';
            }}
          />
        </div>
      </div>

      <div
        ref={svAreaRef}
        onMouseDown={handleSVMouseDown}
        style={{
          ...styles.svArea,
          background: svBackground,
          cursor: 'crosshair'
        }}
      >
        <div
          style={{
            ...styles.svHandle,
            left: `${hsl.s}%`,
            top: `${100 - hsl.l}%`,
            borderColor: hsl.l > 50 ? '#333' : '#fff',
            transition: isDraggingSV ? 'none' : 'all 0.3s ease-in-out'
          }}
        />
      </div>

      <div style={styles.slidersContainer}>
        <SliderRow
          label="H"
          value={hsl.h}
          min={0}
          max={360}
          suffix="°"
          background={hueSliderBg}
          thumbColor={`hsl(${hsl.h}, 100%, 50%)`}
          accentColor={accentColor}
          onChange={(v) => handleHslChange('h', v)}
        />
        <SliderRow
          label="S"
          value={hsl.s}
          min={0}
          max={100}
          suffix="%"
          background={satSliderBg}
          thumbColor={`hsl(${hsl.h}, ${hsl.s}%, 50%)`}
          accentColor={accentColor}
          onChange={(v) => handleHslChange('s', v)}
        />
        <SliderRow
          label="L"
          value={hsl.l}
          min={0}
          max={100}
          suffix="%"
          background={lightSliderBg}
          thumbColor={`hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`}
          accentColor={accentColor}
          onChange={(v) => handleHslChange('l', v)}
        />
      </div>
    </div>
  );
};

interface SliderRowProps {
  label: string;
  value: number;
  min: number;
  max: number;
  suffix: string;
  background: string;
  thumbColor: string;
  accentColor: string;
  onChange: (v: number) => void;
}

const SliderRow: React.FC<SliderRowProps> = ({
  label, value, min, max, suffix, background, thumbColor, accentColor, onChange
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [focused, setFocused] = useState(false);

  const glowColor = useMemo(() => {
    const tc = tinycolor(accentColor);
    tc.setAlpha(0.3);
    return tc.toRgbString();
  }, [accentColor]);

  const percent = ((value - min) / (max - min)) * 100;

  return (
    <div style={styles.sliderRow}>
      <span style={styles.sliderLabel}>{label}</span>
      <div style={{ ...styles.sliderTrackWrap, position: 'relative' }}>
        <div
          style={{
            ...styles.sliderTrack,
            background
          }}
        />
        <input
          ref={inputRef}
          type="range"
          min={min}
          max={max}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            ...styles.sliderInput,
            boxShadow: focused ? `0 0 0 3px ${glowColor}` : 'none'
          }}
        />
        <style>{`
          input[type="range"]::-webkit-slider-thumb {
            -webkit-appearance: none;
            appearance: none;
            width: 16px;
            height: 16px;
            border-radius: 50%;
            background: ${thumbColor};
            border: 2px solid #fff;
            box-shadow: 0 1px 4px rgba(0,0,0,0.4);
            cursor: pointer;
            margin-top: -5px;
            transition: transform 0.15s ease;
          }
          input[type="range"]::-webkit-slider-thumb:hover {
            transform: scale(1.15);
          }
          input[type="range"]::-moz-range-thumb {
            width: 16px;
            height: 16px;
            border-radius: 50%;
            background: ${thumbColor};
            border: 2px solid #fff;
            box-shadow: 0 1px 4px rgba(0,0,0,0.4);
            cursor: pointer;
            transition: transform 0.15s ease;
          }
          input[type="range"]::-moz-range-thumb:hover {
            transform: scale(1.15);
          }
          input[type="range"]::-webkit-slider-runnable-track {
            height: 6px;
            border-radius: 3px;
            background: transparent;
          }
          input[type="range"]::-moz-range-track {
            height: 6px;
            border-radius: 3px;
            background: transparent;
          }
        `}</style>
      </div>
      <span style={styles.sliderValue}>
        {value}{suffix}
      </span>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
    padding: 16,
    background: '#2A2A3E',
    borderRadius: 12,
    border: '1px solid #3A3A4E'
  },
  labelRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  label: {
    fontSize: 13,
    fontWeight: 600,
    color: '#A1A1AA',
    letterSpacing: '0.5px',
    textTransform: 'uppercase'
  },
  topRow: {
    display: 'flex',
    gap: 12,
    alignItems: 'center'
  },
  colorSwatch: {
    width: 48,
    height: 48,
    borderRadius: 8,
    border: '2px solid rgba(255,255,255,0.1)',
    flexShrink: 0
  },
  hexInputWrap: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    background: '#1A1A2A',
    borderRadius: 8,
    padding: '0 12px',
    border: '1px solid #3A3A4E',
    gap: 4
  },
  hashLabel: {
    color: '#71717A',
    fontFamily: "'Fira Code', monospace",
    fontSize: 13,
    fontWeight: 500
  },
  hexInput: {
    flex: 1,
    background: 'transparent',
    border: 'none',
    color: '#E4E4E7',
    fontFamily: "'Fira Code', monospace",
    fontSize: 13,
    fontWeight: 500,
    padding: '10px 0',
    textTransform: 'uppercase',
    letterSpacing: '1px'
  },
  svArea: {
    width: '100%',
    height: 140,
    borderRadius: 8,
    position: 'relative',
    border: '1px solid #3A3A4E',
    userSelect: 'none'
  },
  svHandle: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: '50%',
    border: '2px solid #fff',
    boxShadow: '0 1px 4px rgba(0,0,0,0.4)',
    transform: 'translate(-50%, -50%)',
    pointerEvents: 'none'
  },
  slidersContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10
  },
  sliderRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 10
  },
  sliderLabel: {
    width: 16,
    fontSize: 11,
    fontWeight: 700,
    color: '#71717A',
    textAlign: 'center'
  },
  sliderTrackWrap: {
    flex: 1,
    height: 24,
    display: 'flex',
    alignItems: 'center'
  },
  sliderTrack: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 6,
    borderRadius: 3
  },
  sliderInput: {
    position: 'absolute',
    left: 0,
    right: 0,
    width: '100%',
    height: 24,
    background: 'transparent',
    appearance: 'none',
    WebkitAppearance: 'none',
    cursor: 'pointer',
    padding: 0,
    margin: 0,
    zIndex: 2,
    borderRadius: 12
  },
  sliderValue: {
    width: 48,
    fontSize: 11,
    fontFamily: "'Fira Code', monospace",
    color: '#A1A1AA',
    textAlign: 'right',
    fontWeight: 500
  }
};

export default ColorPicker;
