import { useMemo } from 'react';
import type { TypographyStyle } from './utils/exportCSS';

interface PreviewPanelProps {
  style: TypographyStyle;
  fontLoaded: boolean;
}

const sampleText = [
  '大江东去，浪淘尽，千古风流人物。',
  '故垒西边，人道是，三国周郎赤壁。',
  '乱石穿空，惊涛拍岸，卷起千堆雪。',
  '江山如画，一时多少豪杰。',
];

function getLuminance(hex: string): number {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const toLinear = (c: number) =>
    c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

function needsDarkOverlay(hex: string): boolean {
  return getLuminance(hex) > 0.6;
}

export default function PreviewPanel({ style, fontLoaded }: PreviewPanelProps) {
  const weightMap: Record<string, number> = {
    light: 300,
    regular: 400,
    bold: 700,
  };

  const darkOverlay = useMemo(() => needsDarkOverlay(style.color), [style.color]);

  const textStyle: React.CSSProperties = {
    fontFamily: `'${style.fontFamily}', sans-serif`,
    fontSize: `${style.fontSize}px`,
    fontWeight: weightMap[style.fontWeight] || 400,
    color: style.color,
    lineHeight: 1.6,
    transition: 'opacity 0.2s ease, color 0.15s ease',
    opacity: fontLoaded ? 1 : 0.5,
  };

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#ffffff',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {darkOverlay && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.08)',
            borderRadius: '15px',
            pointerEvents: 'none',
          }}
        />
      )}
      <div
        style={{
          position: 'relative',
          maxWidth: '720px',
          padding: '40px 48px',
          textAlign: 'center',
        }}
      >
        {sampleText.map((line, i) => (
          <p key={i} style={{ ...textStyle, margin: '0 0 0.4em 0' }}>
            {line}
          </p>
        ))}
      </div>
    </div>
  );
}
