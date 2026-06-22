import React, { useState, useMemo, useCallback, memo } from 'react';
import { Color, Scheme } from './types';
import {
  pickBackgroundFromScheme,
  pickTitleFromScheme,
  pickBodyFromScheme,
  pickButtonFromScheme,
  pickBorderFromScheme,
} from './SchemeGenerator';

interface PreviewCardProps {
  scheme: Scheme | null;
  customColors?: {
    background?: Color;
    title?: Color;
    body?: Color;
    button?: Color;
    border?: Color;
  };
}

const PreviewCard: React.FC<PreviewCardProps> = memo(({ scheme, customColors }) => {
  const [buttonPressed, setButtonPressed] = useState(false);
  const [backgroundFlash, setBackgroundFlash] = useState(false);

  const defaultPalette = useMemo(() => {
    if (!scheme) {
      return {
        background: { hex: '#E8E8F0' },
        title: { hex: '#2D2D3A' },
        body: { hex: '#555566' },
        button: { hex: '#5B5BD6' },
        border: { hex: '#BBBBC8' },
      };
    }
    return {
      background: pickBackgroundFromScheme(scheme.colors),
      title: pickTitleFromScheme(scheme.colors),
      body: pickBodyFromScheme(scheme.colors),
      button: pickButtonFromScheme(scheme.colors),
      border: pickBorderFromScheme(scheme.colors),
    };
  }, [scheme]);

  const palette = useMemo(() => {
    return {
      background: customColors?.background || defaultPalette.background,
      title: customColors?.title || defaultPalette.title,
      body: customColors?.body || defaultPalette.body,
      button: customColors?.button || defaultPalette.button,
      border: customColors?.border || defaultPalette.border,
    };
  }, [customColors, defaultPalette]);

  const flashBackgroundColor = useMemo(() => {
    if (!scheme) return defaultPalette.background.hex;
    const candidates = scheme.colors.filter(
      (c) => c.hex.toLowerCase() !== palette.background.hex.toLowerCase()
    );
    if (candidates.length === 0) return palette.background.hex;
    return candidates[Math.floor(Date.now() / 1000) % candidates.length].hex;
  }, [scheme, palette.background.hex, defaultPalette.background.hex]);

  const handleButtonClick = useCallback(() => {
    setButtonPressed(true);
    setBackgroundFlash(true);
    window.setTimeout(() => setButtonPressed(false), 200);
    window.setTimeout(() => setBackgroundFlash(false), 1000);
  }, []);

  return (
    <div
      className="preview-wrapper"
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '20px',
      }}
    >
      <div
        className="preview-card"
        style={{
          width: 220,
          height: 300,
          borderRadius: 12,
          background: palette.background.hex,
          boxShadow: '0 4px 20px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.25)',
          padding: '24px 20px',
          display: 'flex',
          flexDirection: 'column',
          transition: backgroundFlash
            ? 'background-color 1s ease-in-out'
            : 'box-shadow 0.25s ease-out',
          backgroundColor: backgroundFlash ? flashBackgroundColor : palette.background.hex,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 1,
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent)',
            pointerEvents: 'none',
          }}
        />

        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            background: palette.button.hex,
            marginBottom: 18,
            boxShadow: `0 2px 8px ${palette.button.hex}50, inset 0 1px 0 rgba(255,255,255,0.3)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontWeight: 700,
            fontSize: 16,
          }}
        >
          ✦
        </div>

        <h3
          style={{
            fontSize: 18,
            fontWeight: 700,
            color: palette.title.hex,
            margin: 0,
            marginBottom: 10,
            lineHeight: 1.3,
            letterSpacing: '0.01em',
          }}
        >
          色彩设计卡
        </h3>

        <p
          style={{
            fontSize: 12,
            fontWeight: 400,
            color: palette.body.hex,
            margin: 0,
            marginBottom: 20,
            lineHeight: 1.6,
            flex: 1,
          }}
        >
          此卡片展示了当前配色方案在真实场景中的视觉效果。背景、标题、正文、按钮与边框颜色均从方案自动提取。
        </p>

        <button
          onClick={handleButtonClick}
          type="button"
          style={{
            width: 120,
            height: 36,
            borderRadius: 8,
            background: palette.button.hex,
            border: `2px solid ${palette.border.hex}`,
            color: '#FFFFFF',
            fontSize: 16,
            fontWeight: 600,
            cursor: 'pointer',
            alignSelf: 'flex-start',
            boxShadow: `0 3px 10px ${palette.button.hex}40`,
            transform: buttonPressed ? 'scale(0.95)' : 'scale(1)',
            transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-out',
            letterSpacing: '0.02em',
            outline: 'none',
            userSelect: 'none',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.boxShadow = `0 4px 14px ${palette.button.hex}60`;
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.boxShadow = `0 3px 10px ${palette.button.hex}40`;
          }}
        >
          立即体验
        </button>
      </div>
    </div>
  );
});

PreviewCard.displayName = 'PreviewCard';

export { PreviewCard };
export default PreviewCard;
