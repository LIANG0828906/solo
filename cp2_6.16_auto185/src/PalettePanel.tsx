import React, { useState, useEffect } from 'react';
import { ColorSchemeGroup, ColorCard, hslToString, getTextColor } from './types';
import { useColorStore } from './store';

interface PalettePanelProps {}

const PalettePanel: React.FC<PalettePanelProps> = () => {
  const schemes = useColorStore((s) => s.schemes);
  const previewUpdateKey = useColorStore((s) => s.previewUpdateKey);
  const setToast = useColorStore((s) => s.setToast);
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [fadeKey, setFadeKey] = useState(0);

  useEffect(() => {
    setFadeKey((k) => k + 1);
  }, [previewUpdateKey]);

  const copyToClipboard = async (hex: string) => {
    try {
      await navigator.clipboard.writeText(hex);
      setToast(`已复制 ${hex}`);
    } catch (err) {
      const textarea = document.createElement('textarea');
      textarea.value = hex;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setToast(`已复制 ${hex}`);
    }
  };

  const renderCard = (card: ColorCard, schemeName: string) => {
    const isHovered = hoveredCard === `${schemeName}-${card.id}`;
    const textColor = getTextColor(card.hex);

    return (
      <div
        key={`${schemeName}-${card.id}`}
        onClick={() => copyToClipboard(card.hex)}
        onMouseEnter={() => setHoveredCard(`${schemeName}-${card.id}`)}
        onMouseLeave={() => setHoveredCard(null)}
        style={{
          width: 80,
          height: 120,
          borderRadius: 8,
          overflow: 'hidden',
          cursor: 'pointer',
          flexShrink: 0,
          transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
          transform: isHovered ? 'scale(1.05) translateY(-4px)' : 'scale(1) translateY(0)',
          boxShadow: isHovered
            ? `0 12px 32px ${card.hex}55, 0 0 24px ${card.hex}33`
            : '0 4px 12px rgba(0,0,0,0.25)',
          backgroundColor: '#15151F',
          display: 'flex',
          flexDirection: 'column',
          border: isHovered ? '1px solid rgba(255,255,255,0.1)' : '1px solid transparent',
        }}
      >
        <div
          style={{
            flex: 1,
            backgroundColor: card.hex,
            position: 'relative',
            transition: 'background-color 0.3s ease',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: 8,
              left: 8,
              fontSize: 11,
              fontWeight: 700,
              color: textColor,
              opacity: 0.7,
              letterSpacing: 0.5,
            }}
          >
            {card.label}
          </div>
        </div>
        <div
          style={{
            padding: '6px 8px',
            backgroundColor: '#15151F',
            borderTop: '1px solid #252538',
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontFamily: "'SF Mono', 'Fira Code', 'Consolas', monospace",
              color: '#A0A0B8',
              fontWeight: 500,
              textAlign: 'center',
              lineHeight: 1.3,
            }}
          >
            {card.hex}
          </div>
          <div
            style={{
              fontSize: 10,
              fontFamily: "'SF Mono', 'Fira Code', 'Consolas', monospace",
              color: '#6A6A85',
              textAlign: 'center',
              lineHeight: 1.2,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {`${card.hsl.h},${card.hsl.s}%,${card.hsl.l}%`}
          </div>
        </div>
      </div>
    );
  };

  const renderScheme = (scheme: ColorSchemeGroup) => (
    <div
      key={scheme.id}
      style={{
        marginBottom: 28,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          gap: 12,
          marginBottom: 14,
        }}
      >
        <h3
          style={{
            fontSize: 15,
            fontWeight: 600,
            color: '#E8E8F0',
            letterSpacing: 0.3,
          }}
        >
          {scheme.name}
        </h3>
        <span
          style={{
            fontSize: 12,
            color: '#6A6A85',
          }}
        >
          {scheme.description}
        </span>
      </div>
      <div
        style={{
          display: 'flex',
          gap: 12,
          flexWrap: 'wrap',
          opacity: 0,
          animation: 'fadeIn 0.4s ease forwards',
        }}
        key={`${scheme.id}-${fadeKey}`}
      >
        {scheme.colors.map((card) => renderCard(card, scheme.name))}
      </div>
    </div>
  );

  return (
    <div
      style={{
        backgroundColor: '#1E1E2E',
        padding: 24,
        borderRadius: 16,
        height: '100%',
        overflowY: 'auto',
        boxShadow: '0 16px 48px rgba(0,0,0,0.4)',
        border: '1px solid #2D2D44',
      }}
    >
      <div
        style={{
          marginBottom: 20,
          paddingBottom: 16,
          borderBottom: '1px solid #2D2D44',
        }}
      >
        <h2
          style={{
            fontSize: 18,
            fontWeight: 700,
            color: '#FFFFFF',
            letterSpacing: 0.5,
            marginBottom: 4,
          }}
        >
          配色方案
        </h2>
        <p
          style={{
            fontSize: 13,
            color: '#8A8AA5',
          }}
        >
          点击色块复制色值到剪贴板
        </p>
      </div>
      {schemes.length === 0 ? (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: 200,
            color: '#6A6A85',
            fontSize: 14,
          }}
        >
          正在生成配色方案...
        </div>
      ) : (
        schemes.map(renderScheme)
      )}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default PalettePanel;
