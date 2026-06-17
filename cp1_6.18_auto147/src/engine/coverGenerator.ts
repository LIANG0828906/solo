import type { CoverStyle, CoverKeyword } from '@/types';

const colorMap: Record<CoverStyle, string[]> = {
  '爵士暖调': ['#D4A574', '#8B4513', '#CD853F', '#DEB887'],
  '电子冷感': ['#00CED1', '#4169E1', '#9400D3', '#00FFFF'],
  '民谣清新': ['#90EE90', '#98FB98', '#3CB371', '#2E8B57'],
  '古典典雅': ['#DAA520', '#B8860B', '#CD853F', '#D2691E'],
};

const keywordPatternMap: Record<CoverKeyword, string> = {
  '慵懒': '波浪',
  '深邃': '几何圆形',
  '明亮': '放射线条',
  '忧郁': '渐变矩形',
};

export function generateCover(style: CoverStyle, keyword: CoverKeyword): string {
  const colors = colorMap[style] || colorMap['爵士暖调'];
  const pattern = keywordPatternMap[keyword];
  const [c0 = colors[0], c1 = colors[1], c2 = colors[2], c3 = colors[3]] = colors;

  let mainPattern = '';

  if (pattern === '波浪') {
    mainPattern = `
      <path d="M0,150 Q75,100 150,150 T300,150" fill="none" stroke="${c1}" stroke-width="8" opacity="0.8"/>
      <path d="M0,180 Q75,130 150,180 T300,180" fill="none" stroke="${c2}" stroke-width="6" opacity="0.6"/>
      <path d="M0,210 Q75,160 150,210 T300,210" fill="none" stroke="${c3}" stroke-width="4" opacity="0.4"/>
      <path d="M0,120 Q75,70 150,120 T300,120" fill="none" stroke="${c1}" stroke-width="5" opacity="0.7"/>
    `;
  } else if (pattern === '几何圆形') {
    mainPattern = `
      <circle cx="150" cy="150" r="100" fill="none" stroke="${c1}" stroke-width="4" opacity="0.6"/>
      <circle cx="150" cy="150" r="70" fill="none" stroke="${c2}" stroke-width="3" opacity="0.7"/>
      <circle cx="150" cy="150" r="40" fill="none" stroke="${c3}" stroke-width="2" opacity="0.8"/>
      <circle cx="150" cy="150" r="120" fill="none" stroke="${c1}" stroke-width="2" opacity="0.4"/>
      <circle cx="100" cy="100" r="15" fill="${c2}" opacity="0.5"/>
      <circle cx="200" cy="200" r="20" fill="${c3}" opacity="0.5"/>
    `;
  } else if (pattern === '放射线条') {
    let lines = '';
    for (let i = 0; i < 24; i++) {
      const angle = (i * 15 * Math.PI) / 180;
      const x2 = 150 + Math.cos(angle) * 140;
      const y2 = 150 + Math.sin(angle) * 140;
      const color = i % 3 === 0 ? c1 : i % 3 === 1 ? c2 : c3;
      lines += `<line x1="150" y1="150" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="3" opacity="${0.3 + (i % 5) * 0.15}"/>`;
    }
    mainPattern = lines;
  } else {
    mainPattern = `
      <rect x="30" y="30" width="240" height="240" fill="url(#gradRect1)" opacity="0.6"/>
      <rect x="60" y="60" width="180" height="180" fill="url(#gradRect2)" opacity="0.5"/>
      <rect x="90" y="90" width="120" height="120" fill="url(#gradRect3)" opacity="0.4"/>
    `;
  }

  const decorations = `
    <circle cx="50" cy="50" r="8" fill="${c2}" opacity="0.6"/>
    <circle cx="250" cy="250" r="6" fill="${c3}" opacity="0.5"/>
    <circle cx="250" cy="50" r="10" fill="${c1}" opacity="0.4"/>
    <circle cx="50" cy="250" r="7" fill="${c2}" opacity="0.5"/>
  `;

  const label = `
    <circle cx="150" cy="150" r="45" fill="${c0}" stroke="${c1}" stroke-width="3"/>
    <circle cx="150" cy="150" r="15" fill="${c1}"/>
    <text x="150" y="130" text-anchor="middle" font-size="10" fill="${c1}" font-weight="bold" font-family="Arial">VINYL</text>
  `;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300">
  <defs>
    <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${c0};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${c1};stop-opacity:1" />
    </linearGradient>
    <radialGradient id="gradRect1" cx="50%" cy="50%" r="50%">
      <stop offset="0%" style="stop-color:${c1};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${c2};stop-opacity:1" />
    </radialGradient>
    <radialGradient id="gradRect2" cx="50%" cy="50%" r="50%">
      <stop offset="0%" style="stop-color:${c2};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${c3};stop-opacity:1" />
    </radialGradient>
    <radialGradient id="gradRect3" cx="50%" cy="50%" r="50%">
      <stop offset="0%" style="stop-color:${c3};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${c1};stop-opacity:1" />
    </radialGradient>
  </defs>
  <rect width="300" height="300" fill="url(#bgGradient)"/>
  ${decorations}
  ${mainPattern}
  ${label}
</svg>`;
}
