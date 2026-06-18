import type { SceneType, ColorSwatch } from './types';
import { getContrastColor, hexToRgb } from './types';

interface ColorBucket {
  primary: string;
  secondary: string;
  tertiary: string;
  quaternary: string;
  background: string;
  foreground: string;
}

const buildBucket = (colors: ColorSwatch[]): ColorBucket => {
  const arr = colors.map((c) => c.hex);
  const get = (i: number, fallback: string) => (arr[i] ?? fallback);
  const primary = get(0, '#333333');
  const secondary = get(1, getContrastColor(primary));
  const tertiary = get(2, '#888888');
  const quaternary = get(3, '#BBBBBB');
  const background = get(4, '#FCF7F0');
  const foreground = getLuminance(primary) > 0.5 ? '#1A1A1A' : '#FFFFFF';
  return { primary, secondary, tertiary, quaternary, background, foreground };
};

const getLuminance = (hex: string): number => {
  const { r, g, b } = hexToRgb(hex);
  const [rn, gn, bn] = [r, g, b].map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rn + 0.7152 * gn + 0.0722 * bn;
};

export const renderPoster = (bucket: ColorBucket) => {
  const { primary, secondary, tertiary, background, foreground } = bucket;
  return (
    <svg viewBox="0 0 400 560" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
      <defs>
        <linearGradient id="poster-bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={background} />
          <stop offset="100%" stopColor={primary} stopOpacity="0.25" />
        </linearGradient>
      </defs>
      <rect width="400" height="560" fill="url(#poster-bg)" />
      <circle cx="340" cy="80" r="52" fill={tertiary} opacity="0.7" />
      <rect x="40" y="320" width="120" height="160" rx="8" fill={tertiary} opacity="0.55" />
      <circle cx="320" cy="460" r="62" fill={secondary} opacity="0.75" />
      <text x="40" y="140" fontSize="52" fontWeight="800" fill={primary} fontFamily="Arial Black, sans-serif">
        DESIGN
      </text>
      <text x="40" y="200" fontSize="28" fontWeight="600" fill={secondary} fontFamily="sans-serif">
        Exhibition 2025
      </text>
      <line x1="40" y1="220" x2="360" y2="220" stroke={tertiary} strokeWidth="3" />
      <text x="40" y="500" fontSize="12" fill={foreground} fontFamily="sans-serif" opacity="0.7">
        JUN 15 – AUG 28  ·  GALLERY 4F
      </text>
    </svg>
  );
};

export const renderUI = (bucket: ColorBucket) => {
  const { primary, secondary, tertiary, background, foreground } = bucket;
  const cardBg = getLuminance(background) > 0.7 ? '#FFFFFF' : shade(background, 15);
  return (
    <svg viewBox="0 0 320 560" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
      <rect x="20" y="0" width="280" height="560" rx="36" fill="#1A1A1A" />
      <rect x="28" y="8" width="264" height="544" rx="32" fill={background} />
      <rect x="130" y="14" width="60" height="6" rx="3" fill="#1A1A1A" />
      <g transform="translate(28, 40)">
        <rect width="264" height="500" rx="0" fill="transparent">
        </rect>
        <g transform="translate(20, 28)">
          <text fontSize="20" fontWeight="700" fill={foreground} fontFamily="sans-serif">
            早上好 ☀️
          </text>
          <text y="22" fontSize="12" fill={foreground} opacity="0.6" fontFamily="sans-serif">
            今天是美好的一天
          </text>
        </g>
        <g transform="translate(20, 90)">
          <rect width="224" height="88" rx="18" fill={cardBg} stroke={primary} strokeOpacity="0.15" />
          <circle cx="40" cy="44" r="24" fill={primary} />
          <text x="74" y="38" fontSize="14" fontWeight="600" fill={foreground} fontFamily="sans-serif">
            设计项目
          </text>
          <text x="74" y="58" fontSize="11" fill={foreground} opacity="0.6" fontFamily="sans-serif">
            3 个任务 · 今日完成
          </text>
          <rect x="194" y="36" width="18" height="18" rx="9" fill={secondary} />
        </g>
        <g transform="translate(20, 196)">
          <rect width="68" height="82" rx="14" fill={primary} />
          <text x="34" y="42" fontSize="22" textAnchor="middle" fill="#FFFFFF" fontFamily="sans-serif">
            🎨
          </text>
          <text x="34" y="64" fontSize="10" textAnchor="middle" fill="#FFFFFF" fontFamily="sans-serif">
            色板
          </text>
        </g>
        <g transform="translate(98, 196)">
          <rect width="68" height="82" rx="14" fill={secondary} />
          <text x="34" y="42" fontSize="22" textAnchor="middle" fill="#FFFFFF" fontFamily="sans-serif">
            ✨
          </text>
          <text x="34" y="64" fontSize="10" textAnchor="middle" fill="#FFFFFF" fontFamily="sans-serif">
            灵感
          </text>
        </g>
        <g transform="translate(176, 196)">
          <rect width="68" height="82" rx="14" fill={tertiary} />
          <text x="34" y="42" fontSize="22" textAnchor="middle" fill="#FFFFFF" fontFamily="sans-serif">
            📷
          </text>
          <text x="34" y="64" fontSize="10" textAnchor="middle" fill="#FFFFFF" fontFamily="sans-serif">
            收藏
          </text>
        </g>
        <g transform="translate(20, 300)">
          <rect width="224" height="72" rx="16" fill={cardBg} stroke={tertiary} strokeOpacity="0.2" />
          <circle cx="34" cy="36" r="18" fill={secondary} opacity="0.3" />
          <text x="34" y="41" fontSize="16" textAnchor="middle" fill={secondary} fontFamily="sans-serif">
            ✓
          </text>
          <text x="64" y="30" fontSize="13" fontWeight="600" fill={foreground} fontFamily="sans-serif">
            完成色板导出
          </text>
          <text x="64" y="50" fontSize="11" fill={foreground} opacity="0.5" fontFamily="sans-serif">
            2 分钟前
          </text>
        </g>
        <g transform="translate(20, 392)">
          <rect width="224" height="56" rx="28" fill={primary}>
          </rect>
          <text x="112" y="34" fontSize="14" fontWeight="600" textAnchor="middle" fill="#FFFFFF" fontFamily="sans-serif">
            开始创作
          </text>
        </g>
      </g>
    </svg>
  );
};

const shade = (hex: string, percent: number): string => {
  const { r, g, b } = hexToRgb(hex);
  const adjust = (v: number) => {
    const change = Math.round(2.55 * percent);
    return Math.max(0, Math.min(255, v + change));
  };
  const toHex = (n: number) => n.toString(16).padStart(2, '0');
  return `#${toHex(adjust(r))}${toHex(adjust(g))}${toHex(adjust(b))}`.toUpperCase();
};

export const renderIllustration = (bucket: ColorBucket) => {
  const { primary, secondary, tertiary, background } = bucket;
  return (
    <svg viewBox="0 0 480 360" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
      <defs>
        <linearGradient id="illu-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={background} />
          <stop offset="100%" stopColor={primary} stopOpacity="0.35" />
        </linearGradient>
      </defs>
      <rect width="480" height="360" fill="url(#illu-sky)" />
      <circle cx="390" cy="80" r="42" fill={tertiary} />
      <circle cx="380" cy="72" r="42" fill={background} opacity="0.3" />
      <path
        d="M0 280 Q 80 220 160 250 T 320 240 T 480 260 L 480 360 L 0 360 Z"
        fill={primary}
        opacity="0.35"
      />
      <path
        d="M0 310 Q 100 260 200 285 T 400 280 T 480 295 L 480 360 L 0 360 Z"
        fill={primary}
        opacity="0.6"
      />
      <g transform="translate(120, 200)">
        <path
          d="M40 60 Q 40 20 80 20 Q 120 20 120 60 L 120 120 L 40 120 Z"
          fill={secondary}
        />
        <rect x="40" y="118" width="80" height="8" fill={tertiary} />
        <circle cx="80" cy="60" r="10" fill={tertiary} />
        <rect x="60" y="70" width="40" height="30" rx="2" fill={tertiary} opacity="0.5" />
      </g>
      <g transform="translate(240, 180)">
        <path
          d="M0 100 L 50 20 L 100 100 Z"
          fill={primary}
        />
        <rect x="30" y="100" width="40" height="40" fill={tertiary} opacity="0.8" />
      </g>
      <g transform="translate(40, 240)">
        <rect x="0" y="20" width="40" height="30" rx="4" fill={secondary} />
        <circle cx="20" cy="20" r="22" fill={tertiary} />
        <circle cx="14" cy="16" r="3" fill={background} />
        <circle cx="26" cy="16" r="3" fill={background} />
      </g>
    </svg>
  );
};

export interface RendererProps {
  colors: ColorSwatch[];
  scene: SceneType;
}

export const renderScene = ({ colors, scene }: RendererProps) => {
  const bucket = buildBucket(colors);
  switch (scene) {
    case 'poster':
      return renderPoster(bucket);
    case 'ui':
      return renderUI(bucket);
    case 'illustration':
      return renderIllustration(bucket);
    default:
      return renderPoster(bucket);
  }
};

export const sceneNames: Record<SceneType, string> = {
  poster: '极简海报',
  ui: '移动端 UI',
  illustration: '扁平插画',
};

export const sceneIcons: Record<SceneType, string> = {
  poster: '🖼️',
  ui: '📱',
  illustration: '🎨',
};
