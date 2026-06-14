import React, { useMemo, useCallback } from 'react';
import { HexColorPicker } from 'react-colorful';
import { Save, RotateCcw, Palette } from 'lucide-react';
import { useGradientStore } from '../store';
import { debounce } from '../utils/debounce';
import { generateGradientCss } from '../utils/cssGenerator';

export const ColorGenerator: React.FC = () => {
  const currentGradient = useGradientStore((s) => s.currentGradient);
  const setStartColor = useGradientStore((s) => s.setStartColor);
  const setEndColor = useGradientStore((s) => s.setEndColor);
  const setAngle = useGradientStore((s) => s.setAngle);
  const saveToPalette = useGradientStore((s) => s.saveToPalette);

  const debouncedSetStart = useMemo(
    () => debounce((color: string) => setStartColor(color), 150),
    [setStartColor]
  );
  const debouncedSetEnd = useMemo(
    () => debounce((color: string) => setEndColor(color), 150),
    [setEndColor]
  );
  const debouncedSetAngle = useMemo(
    () => debounce((angle: number) => setAngle(angle), 150),
    [setAngle]
  );

  const previewStyle = useMemo(
    () => ({
      background: generateGradientCss(currentGradient),
      transition: 'background 200ms ease-out'
    }),
    [currentGradient]
  );

  const handleStartChange = useCallback(
    (color: string) => {
      setStartColor(color);
      debouncedSetStart(color);
    },
    [setStartColor, debouncedSetStart]
  );

  const handleEndChange = useCallback(
    (color: string) => {
      setEndColor(color);
      debouncedSetEnd(color);
    },
    [setEndColor, debouncedSetEnd]
  );

  const handleAngleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = parseInt(e.target.value, 10);
      setAngle(val);
      debouncedSetAngle(val);
    },
    [setAngle, debouncedSetAngle]
  );

  return (
    <div
      style={{
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
        padding: 24
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <Palette size={22} color="#3b82f6" />
        <h1 style={{ fontSize: 20, fontWeight: 700, letterSpacing: -0.3 }}>
          渐变色生成器
        </h1>
      </div>

      <div
        style={{
          width: 400,
          maxWidth: '100%',
          height: 200,
          borderRadius: 12,
          ...previewStyle
        }}
      />

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 16
        }}
      >
        <div
          style={{
            backgroundColor: 'var(--color-bg-card)',
            borderRadius: 12,
            padding: 14,
            transition: 'transform 150ms ease, box-shadow 150ms ease',
            cursor: 'default'
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLDivElement).style.transform =
              'translateY(-2px)';
            (e.currentTarget as HTMLDivElement).style.boxShadow =
              '0 4px 12px rgba(0,0,0,0.12)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLDivElement).style.transform =
              'translateY(0)';
            (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 10
            }}
          >
            <span style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
              起始色
            </span>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 12,
                padding: '3px 8px',
                backgroundColor: 'var(--color-bg-input)',
                borderRadius: 4,
                color: 'var(--color-text-primary)'
              }}
            >
              {currentGradient.startColor.toUpperCase()}
            </span>
          </div>
          <HexColorPicker
            color={currentGradient.startColor}
            onChange={handleStartChange}
          />
        </div>

        <div
          style={{
            backgroundColor: 'var(--color-bg-card)',
            borderRadius: 12,
            padding: 14,
            transition: 'transform 150ms ease, box-shadow 150ms ease',
            cursor: 'default'
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLDivElement).style.transform =
              'translateY(-2px)';
            (e.currentTarget as HTMLDivElement).style.boxShadow =
              '0 4px 12px rgba(0,0,0,0.12)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLDivElement).style.transform =
              'translateY(0)';
            (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 10
            }}
          >
            <span style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
              终止色
            </span>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 12,
                padding: '3px 8px',
                backgroundColor: 'var(--color-bg-input)',
                borderRadius: 4,
                color: 'var(--color-text-primary)'
              }}
            >
              {currentGradient.endColor.toUpperCase()}
            </span>
          </div>
          <HexColorPicker
            color={currentGradient.endColor}
            onChange={handleEndChange}
          />
        </div>
      </div>

      <div
        style={{
          backgroundColor: 'var(--color-bg-card)',
          borderRadius: 12,
          padding: 18,
          transition: 'transform 150ms ease, box-shadow 150ms ease'
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)';
          (e.currentTarget as HTMLDivElement).style.boxShadow =
            '0 4px 12px rgba(0,0,0,0.12)';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
          (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 12
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <RotateCcw size={16} color="var(--color-text-secondary)" />
            <span style={{ fontSize: 14, fontWeight: 500 }}>渐变角度</span>
          </div>
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 18,
              fontWeight: 600,
              color: 'var(--color-accent)'
            }}
          >
            {currentGradient.angle}°
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <input
            type="range"
            min={0}
            max={360}
            step={1}
            value={currentGradient.angle}
            onChange={handleAngleChange}
            style={{ flex: 1 }}
          />
        </div>
      </div>

      <button
        onClick={saveToPalette}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          height: 48,
          borderRadius: 12,
          backgroundColor: 'var(--color-accent)',
          color: 'white',
          fontSize: 15,
          fontWeight: 600,
          transition: 'all 150ms ease'
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.backgroundColor =
            'var(--color-accent-hover)';
          (e.currentTarget as HTMLButtonElement).style.transform =
            'translateY(-2px)';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.backgroundColor =
            'var(--color-accent)';
          (e.currentTarget as HTMLButtonElement).style.transform =
            'translateY(0)';
        }}
      >
        <Save size={18} />
        保存到调色板
      </button>
    </div>
  );
};

export default ColorGenerator;
