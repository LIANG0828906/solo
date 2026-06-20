import type { StickerType } from '@/types';

export type StickerData = {
  type: StickerType;
  name: string;
  svg: string;
  defaultWidth: number;
  defaultHeight: number;
};

export const STICKERS: Record<StickerType, StickerData> = {
  'washi-tape-1': {
    type: 'washi-tape-1',
    name: '和纸胶带-淡粉格纹',
    defaultWidth: 200,
    defaultHeight: 40,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 40" preserveAspectRatio="none">
  <defs>
    <pattern id="washi1-pattern" patternUnits="userSpaceOnUse" width="10" height="10">
      <rect width="10" height="10" fill="#f8d7da"/>
      <path d="M0 0 L10 0 M0 0 L0 10" stroke="#e4a6ac" stroke-width="0.5" fill="none"/>
    </pattern>
    <filter id="washi1-rough">
      <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="2" result="noise"/>
      <feDisplacementMap in="SourceGraphic" in2="noise" scale="2"/>
    </filter>
  </defs>
  <rect width="200" height="40" fill="url(#washi1-pattern)" opacity="0.85" filter="url(#washi1-rough)"/>
  <path d="M0 39 Q25 37 50 39 T100 39 T150 39 T200 39" stroke="#d4939a" stroke-width="0.5" fill="none" opacity="0.5"/>
  <path d="M0 1 Q25 3 50 1 T100 1 T150 1 T200 1" stroke="#d4939a" stroke-width="0.5" fill="none" opacity="0.5"/>
</svg>`,
  },
  'washi-tape-2': {
    type: 'washi-tape-2',
    name: '和纸胶带-复古蓝波点',
    defaultWidth: 200,
    defaultHeight: 40,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 40" preserveAspectRatio="none">
  <defs>
    <pattern id="washi2-pattern" patternUnits="userSpaceOnUse" width="12" height="12">
      <rect width="12" height="12" fill="#d4e5ed"/>
      <circle cx="6" cy="6" r="2" fill="#7a9eaf"/>
      <circle cx="0" cy="0" r="1" fill="#7a9eaf"/>
      <circle cx="12" cy="12" r="1" fill="#7a9eaf"/>
    </pattern>
  </defs>
  <rect width="200" height="40" fill="url(#washi2-pattern)" opacity="0.85"/>
  <rect x="0" y="0" width="200" height="40" fill="none" stroke="#5c8496" stroke-width="0.3" stroke-dasharray="2 4" opacity="0.4"/>
</svg>`,
  },
  'paper-clip': {
    type: 'paper-clip',
    name: '复古回形针',
    defaultWidth: 45,
    defaultHeight: 90,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 45 90">
  <defs>
    <linearGradient id="clip-grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#b8a082"/>
      <stop offset="50%" stop-color="#d4c4a8"/>
      <stop offset="100%" stop-color="#a08868"/>
    </linearGradient>
  </defs>
  <path d="M10 5 L10 75 Q10 85 22.5 85 Q35 85 35 75 L35 15 Q35 10 30 10 Q25 10 25 15 L25 70" fill="none" stroke="url(#clip-grad)" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M10 5 L10 75 Q10 85 22.5 85 Q35 85 35 75 L35 15 Q35 10 30 10 Q25 10 25 15 L25 70" fill="none" stroke="#8b7355" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" opacity="0.5"/>
</svg>`,
  },
  'tag-1': {
    type: 'tag-1',
    name: '纸质标签-米色',
    defaultWidth: 120,
    defaultHeight: 160,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 160">
  <defs>
    <linearGradient id="tag1-bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#f5ecd7"/>
      <stop offset="100%" stop-color="#e8dcc0"/>
    </linearGradient>
  </defs>
  <path d="M10 10 L110 10 L110 140 L60 155 L10 140 Z" fill="url(#tag1-bg)" stroke="#c9b896" stroke-width="1"/>
  <circle cx="60" cy="28" r="7" fill="#d4c4a8" stroke="#b8a082" stroke-width="1"/>
  <circle cx="60" cy="28" r="3" fill="#a08868"/>
  <line x1="30" y1="55" x2="90" y2="55" stroke="#c9b896" stroke-width="0.5" stroke-dasharray="3 2"/>
  <line x1="30" y1="75" x2="90" y2="75" stroke="#c9b896" stroke-width="0.5" stroke-dasharray="3 2"/>
  <line x1="30" y1="95" x2="90" y2="95" stroke="#c9b896" stroke-width="0.5" stroke-dasharray="3 2"/>
  <line x1="30" y1="115" x2="75" y2="115" stroke="#c9b896" stroke-width="0.5" stroke-dasharray="3 2"/>
</svg>`,
  },
  'tag-2': {
    type: 'tag-2',
    name: '纸质标签-墨绿',
    defaultWidth: 100,
    defaultHeight: 140,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 140">
  <defs>
    <linearGradient id="tag2-bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#7a8b72"/>
      <stop offset="100%" stop-color="#5c6e54"/>
    </linearGradient>
  </defs>
  <path d="M8 8 L92 8 L92 120 L50 135 L8 120 Z" fill="url(#tag2-bg)" stroke="#4a5a44" stroke-width="1"/>
  <circle cx="50" cy="24" r="6" fill="#5c6e54" stroke="#3d4d37" stroke-width="1"/>
  <circle cx="50" cy="24" r="2.5" fill="#3d4d37"/>
  <rect x="20" y="45" width="60" height="50" fill="none" stroke="#a8b8a0" stroke-width="0.8" stroke-dasharray="2 3"/>
  <text x="50" y="72" text-anchor="middle" fill="#e8ecd8" font-family="Georgia, serif" font-size="11" font-style="italic">NOTE</text>
  <line x1="20" y1="105" x2="80" y2="105" stroke="#a8b8a0" stroke-width="0.5" stroke-dasharray="2 2"/>
</svg>`,
  },
  'postmark': {
    type: 'postmark',
    name: '复古邮戳',
    defaultWidth: 120,
    defaultHeight: 120,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
  <circle cx="60" cy="60" r="52" fill="none" stroke="#8b4513" stroke-width="2" opacity="0.75"/>
  <circle cx="60" cy="60" r="46" fill="none" stroke="#8b4513" stroke-width="0.8" stroke-dasharray="3 2" opacity="0.6"/>
  <circle cx="60" cy="60" r="38" fill="none" stroke="#a0522d" stroke-width="0.5" opacity="0.5"/>
  <text x="60" y="42" text-anchor="middle" fill="#8b4513" font-family="'Courier New', monospace" font-size="8" letter-spacing="2" opacity="0.8">VINTAGE</text>
  <text x="60" y="65" text-anchor="middle" fill="#8b4513" font-family="'Georgia', serif" font-size="18" font-weight="bold" opacity="0.85">2024</text>
  <text x="60" y="85" text-anchor="middle" fill="#8b4513" font-family="'Courier New', monospace" font-size="7" letter-spacing="1.5" opacity="0.8">JOURNAL</text>
  <line x1="15" y1="60" x2="25" y2="60" stroke="#8b4513" stroke-width="1.5" opacity="0.6"/>
  <line x1="95" y1="60" x2="105" y2="60" stroke="#8b4513" stroke-width="1.5" opacity="0.6"/>
  <line x1="60" y1="10" x2="60" y2="18" stroke="#8b4513" stroke-width="1.5" opacity="0.6"/>
  <line x1="60" y1="102" x2="60" y2="110" stroke="#8b4513" stroke-width="1.5" opacity="0.6"/>
</svg>`,
  },
  'polaroid': {
    type: 'polaroid',
    name: '拍立得相框',
    defaultWidth: 130,
    defaultHeight: 160,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 130 160">
  <defs>
    <linearGradient id="polaroid-shadow" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="100%" stop-color="#f0ebe0"/>
    </linearGradient>
  </defs>
  <rect x="5" y="3" width="120" height="154" fill="url(#polaroid-shadow)" stroke="#d4cdbc" stroke-width="1"/>
  <rect x="8" y="6" width="114" height="148" fill="#ffffff" stroke="#c9c2b0" stroke-width="0.5"/>
  <rect x="14" y="14" width="102" height="102" fill="#e8e4d8" stroke="#a8a090" stroke-width="0.5"/>
  <rect x="14" y="14" width="102" height="102" fill="url(#polaroid-placeholder)"/>
  <defs>
    <pattern id="polaroid-placeholder" patternUnits="userSpaceOnUse" width="20" height="20">
      <rect width="20" height="20" fill="#f5f1e6"/>
      <path d="M0 20 L20 0 M-5 5 L5 -5 M15 25 L25 15" stroke="#e8e4d8" stroke-width="1"/>
    </pattern>
  </defs>
  <rect x="14" y="14" width="102" height="102" fill="#d4cdbc" opacity="0.3"/>
  <line x1="14" y1="14" x2="116" y2="116" stroke="#c9c2b0" stroke-width="0.3"/>
  <line x1="116" y1="14" x2="14" y2="116" stroke="#c9c2b0" stroke-width="0.3"/>
  <rect x="22" y="126" width="86" height="20" fill="none" stroke="#d4cdbc" stroke-width="0.3" stroke-dasharray="2 2"/>
</svg>`,
  },
  'masking-tape-1': {
    type: 'masking-tape-1',
    name: '美纹纸胶带-焦糖色',
    defaultWidth: 180,
    defaultHeight: 50,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 50" preserveAspectRatio="none">
  <defs>
    <pattern id="mask1-pattern" patternUnits="userSpaceOnUse" width="6" height="6">
      <rect width="6" height="6" fill="#c9a876"/>
      <path d="M0 0 L6 6 M6 0 L0 6" stroke="#b89460" stroke-width="0.3" opacity="0.5"/>
    </pattern>
  </defs>
  <path d="M0 2 L8 0 L18 3 L28 1 L38 4 L48 0 L58 2 L68 3 L78 1 L88 4 L98 0 L108 2 L118 3 L128 1 L138 4 L148 0 L158 2 L168 3 L178 1 L180 2 L180 48 L172 50 L162 47 L152 49 L142 46 L132 50 L122 48 L112 47 L102 49 L92 46 L82 50 L72 48 L62 47 L52 49 L42 46 L32 50 L22 48 L12 47 L2 49 L0 48 Z" fill="url(#mask1-pattern)" opacity="0.82"/>
  <path d="M0 2 L8 0 L18 3 L28 1 L38 4 L48 0 L58 2 L68 3 L78 1 L88 4 L98 0 L108 2 L118 3 L128 1 L138 4 L148 0 L158 2 L168 3 L178 1 L180 2" fill="none" stroke="#a07c48" stroke-width="0.5" opacity="0.6"/>
</svg>`,
  },
  'masking-tape-2': {
    type: 'masking-tape-2',
    name: '美纹纸胶带-橄榄绿',
    defaultWidth: 180,
    defaultHeight: 50,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 50" preserveAspectRatio="none">
  <defs>
    <pattern id="mask2-pattern" patternUnits="userSpaceOnUse" width="8" height="8">
      <rect width="8" height="8" fill="#9eab82"/>
      <line x1="0" y1="4" x2="8" y2="4" stroke="#8a986e" stroke-width="0.3" opacity="0.6"/>
      <line x1="4" y1="0" x2="4" y2="8" stroke="#8a986e" stroke-width="0.3" opacity="0.6"/>
    </pattern>
  </defs>
  <path d="M0 3 L10 1 L20 4 L30 0 L40 3 L50 2 L60 4 L70 1 L80 3 L90 0 L100 4 L110 2 L120 3 L130 1 L140 4 L150 0 L160 3 L170 2 L180 3 L180 47 L170 49 L160 46 L150 50 L140 47 L130 48 L120 46 L110 49 L100 47 L90 50 L80 47 L70 48 L60 46 L50 49 L40 47 L30 50 L20 47 L10 48 L0 46 Z" fill="url(#mask2-pattern)" opacity="0.8"/>
  <path d="M0 3 L10 1 L20 4 L30 0 L40 3 L50 2 L60 4 L70 1 L80 3 L90 0 L100 4 L110 2 L120 3 L130 1 L140 4 L150 0 L160 3 L170 2 L180 3" fill="none" stroke="#7a8860" stroke-width="0.5" opacity="0.6"/>
</svg>`,
  },
  'sticky-note': {
    type: 'sticky-note',
    name: '便签纸-鹅黄',
    defaultWidth: 140,
    defaultHeight: 140,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 140 140">
  <defs>
    <linearGradient id="sticky-bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fff4c2"/>
      <stop offset="70%" stop-color="#fce9a3"/>
      <stop offset="100%" stop-color="#f0dd8a"/>
    </linearGradient>
    <linearGradient id="sticky-fold" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#e8d87a"/>
      <stop offset="100%" stop-color="#d4c466"/>
    </linearGradient>
  </defs>
  <path d="M5 5 L135 5 L135 105 L105 135 L5 135 Z" fill="url(#sticky-bg)" stroke="#d4c060" stroke-width="0.8"/>
  <path d="M135 105 L105 105 L105 135 Z" fill="url(#sticky-fold)" stroke="#c0ac50" stroke-width="0.5"/>
  <line x1="105" y1="105" x2="135" y2="135" stroke="#c0ac50" stroke-width="0.5" opacity="0.6"/>
  <line x1="25" y1="35" x2="115" y2="35" stroke="#d4c466" stroke-width="0.5" opacity="0.6"/>
  <line x1="25" y1="55" x2="115" y2="55" stroke="#d4c466" stroke-width="0.5" opacity="0.6"/>
  <line x1="25" y1="75" x2="115" y2="75" stroke="#d4c466" stroke-width="0.5" opacity="0.6"/>
  <line x1="25" y1="95" x2="100" y2="95" stroke="#d4c466" stroke-width="0.5" opacity="0.6"/>
</svg>`,
  },
};

export const STICKER_LIST: StickerData[] = Object.values(STICKERS);

export function getStickerByType(type: StickerType): StickerData | undefined {
  return STICKERS[type];
}

export function getStickerSvg(type: StickerType): string | undefined {
  return STICKERS[type]?.svg;
}
