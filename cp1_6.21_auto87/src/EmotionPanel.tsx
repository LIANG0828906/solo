import React, { useState, useEffect, useMemo } from 'react';
import type { EmotionType, EmotionCard, PaletteColors } from './types';
import { hslToHex, hexToHsl, adjustLightness, shiftHue } from './colorUtils';

interface EmotionPanelProps {
  primaryHex: string;
  primaryHue: number;
  selectedEmotion: EmotionType | null;
  onEmotionSelect: (emotion: EmotionType, colors: PaletteColors) => void;
}

const EMOTION_CARDS: EmotionCard[] = [
  { id: 'passion', label: '热情', emoji: '😡', bgColor: '#FFE0E6' },
  { id: 'calm', label: '平静', emoji: '😌', bgColor: '#E3F2FD' },
  { id: 'joy', label: '愉悦', emoji: '😄', bgColor: '#FFF9C4' },
  { id: 'mystery', label: '神秘', emoji: '😮', bgColor: '#F3E5F5' },
  { id: 'nature', label: '自然', emoji: '🌿', bgColor: '#E8F5E9' },
  { id: 'warmth', label: '温暖', emoji: '☕', bgColor: '#FFF3E0' }
];

const CARD_H = 150;
const SWATCH_SIZE = 60;

function generatePalette(primaryHex: string, emotion: EmotionType): PaletteColors {
  const [h, s, l] = hexToHsl(primaryHex);

  let accent1: string, accent2: string, accent3: string;
  let gradStart: string, gradEnd: string;

  switch (emotion) {
    case 'passion':
      accent1 = hslToHex((h + 15) % 360, Math.min(s + 10, 100), Math.min(l + 10, 90));
      accent2 = hslToHex((h + 330) % 360, Math.max(s - 5, 40), Math.max(l - 15, 20));
      accent3 = hslToHex((h + 20) % 360, Math.max(s - 20, 40), 85);
      gradStart = hslToHex(h, s, Math.min(l + 15, 85));
      gradEnd = hslToHex((h + 340) % 360, Math.min(s + 5, 100), Math.max(l - 10, 35));
      break;
    case 'calm':
      accent1 = hslToHex((h + 180) % 360, Math.max(s - 30, 25), Math.min(l + 20, 90));
      accent2 = hslToHex((h + 200) % 360, Math.max(s - 15, 35), Math.min(l + 5, 80));
      accent3 = hslToHex(h, Math.max(s - 50, 15), 92);
      gradStart = hslToHex(h, Math.max(s - 20, 30), Math.min(l + 20, 90));
      gradEnd = hslToHex((h + 185) % 360, Math.max(s - 25, 25), Math.min(l + 15, 85));
      break;
    case 'joy':
      accent1 = hslToHex((h + 60) % 360, Math.min(s + 10, 100), Math.min(l + 15, 88));
      accent2 = hslToHex((h + 30) % 360, Math.min(s + 5, 95), Math.min(l + 20, 90));
      accent3 = hslToHex((h + 90) % 360, s, Math.min(l + 25, 92));
      gradStart = hslToHex((h + 350) % 360, s, Math.min(l + 15, 88));
      gradEnd = hslToHex((h + 55) % 360, Math.min(s + 10, 100), Math.min(l + 10, 85));
      break;
    case 'mystery':
      accent1 = hslToHex((h + 280) % 360, Math.min(s + 5, 95), Math.max(l - 20, 25));
      accent2 = hslToHex((h + 300) % 360, Math.max(s - 10, 40), 45);
      accent3 = hslToHex((h + 260) % 360, Math.max(s - 30, 25), 78);
      gradStart = hslToHex(h, Math.max(s - 10, 50), Math.max(l - 10, 35));
      gradEnd = hslToHex((h + 290) % 360, Math.min(s + 5, 100), Math.max(l - 5, 40));
      break;
    case 'nature':
      accent1 = hslToHex((h + 120) % 360, s, l);
      accent2 = hslToHex((h + 90) % 360, Math.max(s - 15, 40), Math.min(l + 10, 80));
      accent3 = hslToHex((h + 150) % 360, Math.max(s - 25, 30), 88);
      gradStart = hslToHex(h, s, Math.min(l + 12, 82));
      gradEnd = hslToHex((h + 130) % 360, s, Math.min(l + 5, 78));
      break;
    case 'warmth':
      accent1 = hslToHex((h + 30) % 360, s, Math.min(l + 5, 80));
      accent2 = hslToHex((h + 350) % 360, Math.max(s - 10, 50), Math.max(l - 10, 35));
      accent3 = hslToHex((h + 45) % 360, Math.max(s - 20, 50), Math.min(l + 25, 92));
      gradStart = hslToHex((h + 355) % 360, s, Math.min(l + 10, 82));
      gradEnd = hslToHex((h + 35) % 360, s, Math.min(l + 15, 85));
      break;
  }

  accent1 = accent1 || adjustLightness(shiftHue(primaryHex, 30), 10);
  accent2 = accent2 || adjustLightness(primaryHex, -15);
  accent3 = accent3 || adjustLightness(primaryHex, 25);
  gradStart = gradStart || adjustLightness(primaryHex, 15);
  gradEnd = gradEnd || adjustLightness(primaryHex, -10);

  return {
    primary: primaryHex,
    accent1,
    accent2,
    accent3,
    gradient: [gradStart, gradEnd]
  };
}

interface SwatchProps {
  color: string;
  index: number;
}

const Swatch: React.FC<SwatchProps> = ({ color, index }) => {
  const [visible, setVisible] = useState(false);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    setVisible(false);
    const t = setTimeout(() => setVisible(true), index * 50);
    return () => clearTimeout(t);
  }, [color, index]);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: SWATCH_SIZE,
        height: SWATCH_SIZE,
        borderRadius: 8,
        background: color,
        cursor: 'pointer',
        position: 'relative',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        transform: hovered ? 'scale(1.1)' : visible ? 'scale(1)' : 'scale(0.8)',
        opacity: visible ? 1 : 0,
        transition: 'transform 0.15s ease-out, opacity 0.2s ease-out, box-shadow 0.15s',
        zIndex: hovered ? 2 : 1,
        flexShrink: 0
      }}
    >
      {hovered && (
        <div
          style={{
            position: 'absolute',
            bottom: -32,
            left: '50%',
            transform: 'translateX(-50%)',
            padding: '5px 10px',
            borderRadius: 6,
            background: '#222',
            color: '#fff',
            fontSize: 12,
            fontWeight: 600,
            whiteSpace: 'nowrap',
            zIndex: 10,
            letterSpacing: 0.3
          }}
        >
          {color}
        </div>
      )}
    </div>
  );
};

interface GradientSwatchProps {
  gradient: [string, string];
}

const GradientSwatch: React.FC<GradientSwatchProps> = ({ gradient }) => {
  const [visible, setVisible] = useState(false);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    setVisible(false);
    const t = setTimeout(() => setVisible(true), 250);
    return () => clearTimeout(t);
  }, [gradient[0], gradient[1]]);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: SWATCH_SIZE * 2 + 8,
        height: SWATCH_SIZE,
        borderRadius: 8,
        background: `linear-gradient(135deg, ${gradient[0]}, ${gradient[1]})`,
        cursor: 'pointer',
        position: 'relative',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        transform: hovered ? 'scale(1.05)' : visible ? 'scale(1)' : 'scale(0.8)',
        opacity: visible ? 1 : 0,
        transition: 'transform 0.15s ease-out, opacity 0.2s ease-out',
        flexShrink: 0
      }}
    >
      {hovered && (
        <div
          style={{
            position: 'absolute',
            bottom: -32,
            left: '50%',
            transform: 'translateX(-50%)',
            padding: '5px 10px',
            borderRadius: 6,
            background: '#222',
            color: '#fff',
            fontSize: 11,
            fontWeight: 600,
            whiteSpace: 'nowrap',
            zIndex: 10
          }}
        >
          {gradient[0]} → {gradient[1]}
        </div>
      )}
    </div>
  );
};

const EmotionPanel: React.FC<EmotionPanelProps> = ({
  primaryHex,
  primaryHue,
  selectedEmotion,
  onEmotionSelect
}) => {
  const [displayPalette, setDisplayPalette] = useState<PaletteColors | null>(null);

  useEffect(() => {
    if (selectedEmotion) {
      const palette = generatePalette(primaryHex, selectedEmotion);
      setDisplayPalette(palette);
    } else {
      setDisplayPalette(null);
    }
  }, [selectedEmotion, primaryHex, primaryHue]);

  const handleCardClick = (card: EmotionCard) => {
    const palette = generatePalette(primaryHex, card.id);
    onEmotionSelect(card.id, palette);
  };

  const selectedCard = useMemo(
    () => EMOTION_CARDS.find(c => c.id === selectedEmotion) || null,
    [selectedEmotion]
  );

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: 14
      }}
    >
      <div style={{ fontSize: 18, fontWeight: 600, color: '#333' }}>
        选择你的情绪
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 12,
          width: '100%'
        }}
      >
        {EMOTION_CARDS.map(card => {
          const isSelected = selectedEmotion === card.id;
          return (
            <div
              key={card.id}
              onClick={() => handleCardClick(card)}
              style={{
                width: '100%',
                height: CARD_H,
                borderRadius: 16,
                background: card.bgColor,
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
                transition: 'all 0.2s ease',
                border: isSelected ? `3px solid ${primaryHex}` : '3px solid transparent',
                boxShadow: isSelected
                  ? `0 6px 20px ${primaryHex}40, 0 2px 6px rgba(0,0,0,0.06)`
                  : '0 2px 8px rgba(0,0,0,0.04)',
                transform: isSelected ? 'translateY(-2px)' : 'translateY(0)',
                padding: '3px'
              }}
              onMouseEnter={e => {
                if (!isSelected) {
                  e.currentTarget.style.transform = 'translateY(-3px)';
                  e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.1), 0 2px 6px rgba(0,0,0,0.05)';
                }
              }}
              onMouseLeave={e => {
                if (!isSelected) {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)';
                }
              }}
            >
              <div style={{ fontSize: 42, lineHeight: 1 }}>{card.emoji}</div>
              <div style={{
                fontSize: 14,
                fontWeight: 600,
                color: '#444',
                letterSpacing: 1
              }}>
                {card.label}
              </div>
            </div>
          );
        })}
      </div>

      <div
        style={{
          flex: 1,
          minHeight: 120,
          borderRadius: 16,
          background: '#FFFFFF',
          padding: '16px 20px',
          boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
          display: 'flex',
          flexDirection: 'column',
          gap: 14
        }}
      >
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#333' }}>
            {selectedCard ? `${selectedCard.label} · 配色方案` : '生成的配色方案'}
          </div>
          {selectedCard && (
            <div style={{ fontSize: 22 }}>{selectedCard.emoji}</div>
          )}
        </div>

        {displayPalette ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
              <Swatch color={displayPalette.primary} index={0} />
              <Swatch color={displayPalette.accent1} index={1} />
              <Swatch color={displayPalette.accent2} index={2} />
              <Swatch color={displayPalette.accent3} index={3} />
            </div>
            <div style={{ paddingTop: 4 }}>
              <GradientSwatch gradient={displayPalette.gradient} />
            </div>
          </div>
        ) : (
          <div style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#999',
            fontSize: 13,
            minHeight: 100
          }}>
            点击上方情绪卡片，生成专属配色方案 ✨
          </div>
        )}
      </div>
    </div>
  );
};

export default EmotionPanel;
