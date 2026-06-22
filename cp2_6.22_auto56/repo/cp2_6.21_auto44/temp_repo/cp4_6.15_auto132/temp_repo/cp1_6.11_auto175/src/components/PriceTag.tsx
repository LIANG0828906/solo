import type { TagColor } from '../types';

interface PriceTagProps {
  price: number;
  bgColor: TagColor;
  width?: number;
  height?: number;
}

export const PriceTag = ({ price, bgColor, width = 100, height = 60 }: PriceTagProps) => {
  const darkerColor = adjustBrightness(bgColor, -10);

  return (
    <svg width={width} height={height} viewBox="0 0 100 60" style={{ display: 'block' }}>
      <defs>
        <filter id="shadow" x="-5%" y="-5%" width="110%" height="110%">
          <feDropShadow dx="1" dy="2" stdDeviation="2" floodOpacity="0.3" />
        </filter>
      </defs>
      <path
        d="M3 3 L97 3 L97 47 L85 57 L3 57 Z"
        fill={bgColor}
        stroke="rgba(0,0,0,0.2)"
        strokeWidth="1"
        filter="url(#shadow)"
      />
      <path
        d="M85 47 L97 47 L85 57 Z"
        fill={darkerColor}
      />
      <text
        x="50"
        y="35"
        textAnchor="middle"
        fill="#1a1a1a"
        fontSize="22"
        fontWeight="bold"
        fontFamily="Arial, sans-serif"
      >
        ￥{price.toFixed(2)}
      </text>
    </svg>
  );
};

function adjustBrightness(color: string, percent: number): string {
  const num = parseInt(color.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.max(0, Math.min(255, (num >> 16) + amt));
  const G = Math.max(0, Math.min(255, ((num >> 8) & 0x00ff) + amt));
  const B = Math.max(0, Math.min(255, (num & 0x0000ff) + amt));
  return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
}
