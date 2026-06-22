import React, { useMemo, useEffect, useState } from 'react';
import { ColorSchemeGroup, hslToHex, getTextColor } from './types';
import { useColorStore } from './store';

interface PreviewAreaProps {}

const PreviewArea: React.FC<PreviewAreaProps> = () => {
  const schemes = useColorStore((s) => s.schemes);
  const currentHSL = useColorStore((s) => s.currentHSL);
  const previewUpdateKey = useColorStore((s) => s.previewUpdateKey);
  const [fadeKey, setFadeKey] = useState(0);

  useEffect(() => {
    setFadeKey((k) => k + 1);
  }, [previewUpdateKey]);

  const colors = useMemo(() => {
    const analogous = schemes.find((s) => s.name === '类似色');
    const complementary = schemes.find((s) => s.name === '互补色');
    const splitComp = schemes.find((s) => s.name === '分裂互补');
    const triadic = schemes.find((s) => s.name === '三角形');
    const monochrome = schemes.find((s) => s.name === '单色变体');

    const primary = analogous?.colors[2]?.hex || hslToHex(currentHSL.h, currentHSL.s, currentHSL.l);
    const gradientStart = analogous?.colors[0]?.hex || hslToHex(currentHSL.h, currentHSL.s, currentHSL.l);
    const gradientEnd = analogous?.colors[4]?.hex || hslToHex((currentHSL.h + 30) % 360, currentHSL.s, currentHSL.l);
    const compColor = complementary?.colors[2]?.hex || hslToHex((currentHSL.h + 180) % 360, currentHSL.s, currentHSL.l);
    const splitColor1 = splitComp?.colors[1]?.hex || hslToHex((currentHSL.h + 150) % 360, currentHSL.s, currentHSL.l);
    const splitColor2 = splitComp?.colors[4]?.hex || hslToHex((currentHSL.h + 210) % 360, currentHSL.s, currentHSL.l);
    const triadColor = triadic?.colors[2]?.hex || hslToHex((currentHSL.h + 120) % 360, currentHSL.s, currentHSL.l);
    const textBg = monochrome?.colors[0]?.hex || '#1A1A2E';
    const textColor = getTextColor(primary);

    return {
      primary,
      gradientStart,
      gradientEnd,
      compColor,
      splitColor: splitColor1,
      triadColor,
      textBg,
      textColor,
    };
  }, [schemes, currentHSL]);

  return (
    <div
      style={{
        backgroundColor: '#111118',
        borderRadius: 12,
        padding: 16,
        boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
        border: '1px solid #1F1F2E',
      }}
    >
      <div
        key={`header-${fadeKey}`}
        style={{
          opacity: 0,
          animation: 'crossFade 0.4s ease forwards',
        }}
      >
        <div
          style={{
            height: 160,
            borderRadius: 8,
            background: `linear-gradient(90deg, ${colors.gradientStart} 0%, ${colors.gradientEnd} 100%)`,
            marginBottom: 24,
            position: 'relative',
            overflow: 'hidden',
            transition: 'background 0.4s ease',
            boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'flex-end',
              padding: 20,
              background:
                'linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 60%)',
            }}
          >
            <div>
              <div
                style={{
                  fontSize: 12,
                  color: 'rgba(255,255,255,0.85)',
                  letterSpacing: 2,
                  textTransform: 'uppercase',
                  marginBottom: 6,
                  fontWeight: 500,
                }}
              >
                ColorSwirl Preview
              </div>
              <div
                style={{
                  fontSize: 20,
                  fontWeight: 700,
                  color: '#FFFFFF',
                  textShadow: '0 2px 8px rgba(0,0,0,0.3)',
                }}
              >
                渐变头图 Banner
              </div>
            </div>
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            gap: 16,
            marginBottom: 28,
            justifyContent: 'flex-start',
            flexWrap: 'wrap',
          }}
        >
          <PreviewButton color={colors.compColor} label="互补色按钮" />
          <PreviewButton color={colors.splitColor} label="分裂互补按钮" />
          <PreviewButton color={colors.triadColor} label="三角形按钮" />
        </div>

        <div
          style={{
            padding: '32px 24px',
            backgroundColor: colors.textBg,
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background-color 0.4s ease',
            minHeight: 100,
          }}
        >
          <h1
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: 28,
              fontWeight: 600,
              letterSpacing: 2,
              color: colors.textColor,
              transition: 'color 0.4s ease',
              margin: 0,
              textAlign: 'center',
            }}
          >
            Design with ColorSwirl
          </h1>
        </div>
      </div>
      <style>{`
        @keyframes crossFade {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
};

interface PreviewButtonProps {
  color: string;
  label: string;
}

const PreviewButton: React.FC<PreviewButtonProps> = ({ color, label }) => {
  const [hovered, setHovered] = useState(false);
  const textColor = getTextColor(color);

  return (
    <button
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: 120,
        height: 40,
        borderRadius: 6,
        border: 'none',
        backgroundColor: color,
        color: textColor,
        fontSize: 13,
        fontWeight: 600,
        fontFamily: "'Inter', sans-serif",
        letterSpacing: 0.5,
        cursor: 'pointer',
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        transform: hovered ? 'translateY(-4px)' : 'translateY(0)',
        boxShadow: hovered
          ? `0 12px 24px ${color}55, 0 4px 8px rgba(0,0,0,0.3)`
          : `0 4px 12px rgba(0,0,0,0.3)`,
        outline: 'none',
        padding: 0,
        lineHeight: '40px',
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </button>
  );
};

export default PreviewArea;
