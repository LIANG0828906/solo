import React, { useState, useCallback } from 'react';
import ColorWheel from './ColorWheel';
import EmotionPanel from './EmotionPanel';
import PreviewSection from './PreviewSection';
import { exportPalette } from './exportUtils';
import type { EmotionType, PaletteColors } from './types';
import { hslToHex } from './colorUtils';

const App: React.FC = () => {
  const [primaryHue, setPrimaryHue] = useState<number>(10);
  const [selectedEmotion, setSelectedEmotion] = useState<EmotionType | null>(null);
  const [palette, setPalette] = useState<PaletteColors | null>(null);
  const [buttonPressed, setButtonPressed] = useState(false);

  const primaryHex = hslToHex(primaryHue, 75, 55);

  const handleColorChange = useCallback((hex: string, hue: number) => {
    setPrimaryHue(hue);
  }, []);

  const handleEmotionSelect = useCallback((emotion: EmotionType, colors: PaletteColors) => {
    setSelectedEmotion(emotion);
    setPalette(colors);
  }, []);

  const handleExport = useCallback(() => {
    setButtonPressed(true);
    setTimeout(() => setButtonPressed(false), 200);

    const emotionLabels: Record<EmotionType, string> = {
      passion: '热情',
      calm: '平静',
      joy: '愉悦',
      mystery: '神秘',
      nature: '自然',
      warmth: '温暖'
    };

    const defaultPalette: PaletteColors = {
      primary: primaryHex,
      accent1: hslToHex((primaryHue + 30) % 360, 70, 65),
      accent2: hslToHex((primaryHue + 180) % 360, 65, 45),
      accent3: hslToHex(primaryHue, 50, 85),
      gradient: [
        hslToHex(primaryHue, 75, 70),
        hslToHex((primaryHue + 30) % 360, 70, 50)
      ]
    };

    const exportEmotion = selectedEmotion || 'warmth';
    const exportPalette_ = palette || defaultPalette;

    exportPalette(
      primaryHue,
      exportEmotion,
      emotionLabels[exportEmotion],
      exportPalette_
    );
  }, [primaryHex, primaryHue, selectedEmotion, palette]);

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: '#FEFAF6',
        overflow: 'hidden'
      }}
    >
      <div
        style={{
          height: 64,
          background: '#FFFFFF',
          borderBottom: '1px solid #E0D8C8',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 32px',
          flexShrink: 0,
          boxShadow: '0 1px 4px rgba(0,0,0,0.02)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: `linear-gradient(135deg, ${primaryHex}, ${hslToHex((primaryHue + 60) % 360, 70, 60)})`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: `0 2px 8px ${primaryHex}40`
            }}
          >
            <span style={{ fontSize: 18 }}>🎨</span>
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#222' }}>
              创意情绪调色板
            </div>
            <div style={{ fontSize: 11, color: '#888', marginTop: 1 }}>
              Creative Emotion Palette
            </div>
          </div>
        </div>

        <button
          onClick={handleExport}
          onMouseDown={() => setButtonPressed(true)}
          onMouseUp={() => setButtonPressed(false)}
          onMouseLeave={() => setButtonPressed(false)}
          onTouchStart={() => setButtonPressed(true)}
          onTouchEnd={() => setButtonPressed(false)}
          title="导出配色方案"
          style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            background: 'linear-gradient(135deg, #6C63FF 0%, #B388FF 100%)',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 14px rgba(108,99,255,0.35)',
            transform: buttonPressed ? 'scale(0.9) translateY(1px)' : 'scale(1)',
            transition: 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.2s ease',
            flexShrink: 0
          }}
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
        </button>
      </div>

      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px 48px 60px',
          gap: 48,
          minHeight: 0,
          overflow: 'hidden'
        }}
      >
        <div
          style={{
            width: '55%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            paddingTop: 20
          }}
        >
          <ColorWheel
            onColorChange={handleColorChange}
            currentHue={primaryHue}
          />
        </div>

        <div
          style={{
            width: '40%',
            height: '100%',
            minHeight: 0,
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          <EmotionPanel
            primaryHex={primaryHex}
            primaryHue={primaryHue}
            selectedEmotion={selectedEmotion}
            onEmotionSelect={handleEmotionSelect}
          />
        </div>
      </div>

      <PreviewSection palette={palette} />
    </div>
  );
};

export default App;
