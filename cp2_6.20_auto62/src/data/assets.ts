import type { AssetItem } from '../types/board';

function svgToDataUrl(svg: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

const makeAsset = (id: string, name: string, category: string, svg: string): AssetItem => ({
  id,
  name,
  category,
  svg,
  thumbnail: svgToDataUrl(svg),
});

const mountainSvg = (primary: string, secondary: string) => `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
  <defs>
    <linearGradient id="g${id}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${primary}"/>
      <stop offset="100%" stop-color="${secondary}"/>
    </linearGradient>
  </defs>
  <polygon points="20,180 70,60 110,140 140,80 180,180" fill="url(#g${id})"/>
  <polygon points="70,60 85,90 55,90" fill="#ffffff" opacity="0.8"/>
  <circle cx="160" cy="40" r="20" fill="#FFD93D"/>
</svg>`;

const treeSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
  <rect x="85" y="120" width="30" height="70" fill="#8B5A2B" rx="3"/>
  <polygon points="100,10 170,130 30,130" fill="#2D6A4F"/>
  <polygon points="100,40 155,120 45,120" fill="#40916C"/>
</svg>`;

const sunSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
  <circle cx="100" cy="100" r="45" fill="#FF6F00"/>
  <circle cx="100" cy="100" r="30" fill="#FFD93D"/>
  ${[...Array(8)].map((_, i) => {
    const angle = (i * Math.PI) / 4;
    const x1 = 100 + Math.cos(angle) * 55;
    const y1 = 100 + Math.sin(angle) * 55;
    const x2 = 100 + Math.cos(angle) * 75;
    const y2 = 100 + Math.sin(angle) * 75;
    return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#FF6F00" stroke-width="6" stroke-linecap="round"/>`;
  }).join('')}
</svg>`;

const cloudSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
  <ellipse cx="100" cy="110" rx="60" ry="35" fill="#E0E0E0"/>
  <circle cx="70" cy="100" r="30" fill="#EEEEEE"/>
  <circle cx="110" cy="90" r="35" fill="#F5F5F5"/>
  <circle cx="140" cy="105" r="25" fill="#EEEEEE"/>
</svg>`;

const leafSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
  <path d="M100,20 C150,40 170,100 100,180 C30,100 50,40 100,20 Z" fill="#52B788"/>
  <path d="M100,30 C100,80 100,140 100,175" stroke="#2D6A4F" stroke-width="3" fill="none"/>
  ${[...Array(6)].map((_, i) => {
    const y = 50 + i * 20;
    const x = 100 + (i % 2 === 0 ? 25 : -25);
    return `<path d="M100,${y} Q${x - 10},${y - 5} ${x},${y + 10}" stroke="#40916C" stroke-width="2" fill="none"/>`;
  }).join('')}
</svg>`;

const waveSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
  <path d="M0,120 Q50,80 100,120 T200,120 L200,200 L0,200 Z" fill="#2196F3" opacity="0.7"/>
  <path d="M0,140 Q50,100 100,140 T200,140 L200,200 L0,200 Z" fill="#2196F3" opacity="0.5"/>
  <path d="M0,160 Q50,130 100,160 T200,160 L200,200 L0,200 Z" fill="#2196F3" opacity="0.3"/>
</svg>`;

const starSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
  <polygon points="100,20 120,75 180,75 130,110 150,170 100,135 50,170 70,110 20,75 80,75" fill="#FFD93D"/>
</svg>`;

const moonSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
  <path d="M130,40 A70,70 0 1,0 130,160 A55,55 0 1,1 130,40 Z" fill="#FFE066"/>
  <circle cx="110" cy="70" r="6" fill="#FFD93D" opacity="0.6"/>
  <circle cx="85" cy="100" r="8" fill="#FFD93D" opacity="0.5"/>
  <circle cx="115" cy="130" r="5" fill="#FFD93D" opacity="0.6"/>
</svg>`;

const rainbowSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
  <path d="M20,160 A80,80 0 0,1 180,160" stroke="#FF5252" stroke-width="10" fill="none"/>
  <path d="M32,160 A68,68 0 0,1 168,160" stroke="#FF9800" stroke-width="10" fill="none"/>
  <path d="M44,160 A56,56 0 0,1 156,160" stroke="#FFEB3B" stroke-width="10" fill="none"/>
  <path d="M56,160 A44,44 0 0,1 144,160" stroke="#4CAF50" stroke-width="10" fill="none"/>
  <path d="M68,160 A32,32 0 0,1 132,160" stroke="#2196F3" stroke-width="10" fill="none"/>
  <path d="M80,160 A20,20 0 0,1 120,160" stroke="#9C27B0" stroke-width="10" fill="none"/>
</svg>`;

const flowerSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
  ${[...Array(6)].map((_, i) => {
    const angle = (i * Math.PI) / 3;
    const cx = 100 + Math.cos(angle) * 30;
    const cy = 100 + Math.sin(angle) * 30;
    return `<ellipse cx="${cx}" cy="${cy}" rx="25" ry="18" fill="#E91E63" transform="rotate(${(i * 60)} ${cx} ${cy})"/>`;
  }).join('')}
  <circle cx="100" cy="100" r="18" fill="#FFD93D"/>
</svg>`;

const circleGeoSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
  <circle cx="100" cy="100" r="70" fill="none" stroke="#2196F3" stroke-width="4"/>
  <circle cx="100" cy="100" r="50" fill="none" stroke="#2196F3" stroke-width="3" opacity="0.7"/>
  <circle cx="100" cy="100" r="30" fill="none" stroke="#2196F3" stroke-width="2" opacity="0.5"/>
  <circle cx="100" cy="100" r="10" fill="#2196F3"/>
</svg>`;

const triangleSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
  <polygon points="100,20 180,170 20,170" fill="none" stroke="#FF6F00" stroke-width="4"/>
  <polygon points="100,50 155,155 45,155" fill="none" stroke="#FF6F00" stroke-width="3" opacity="0.7"/>
  <polygon points="100,80 135,145 65,145" fill="#FF6F00" opacity="0.5"/>
</svg>`;

const hexagonSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
  <polygon points="100,25 170,65 170,135 100,175 30,135 30,65" fill="none" stroke="#9C27B0" stroke-width="4"/>
  <polygon points="100,50 150,80 150,120 100,150 50,120 50,80" fill="#9C27B0" opacity="0.3"/>
</svg>`;

const gridSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
  ${[...Array(5)].map((_, i) => `<line x1="0" y1="${(i + 1) * 33}" x2="200" y2="${(i + 1) * 33}" stroke="#2196F3" stroke-width="2" opacity="0.6"/>`).join('')}
  ${[...Array(5)].map((_, i) => `<line x1="${(i + 1) * 33}" y1="0" x2="${(i + 1) * 33}" y2="200" stroke="#2196F3" stroke-width="2" opacity="0.6"/>`).join('')}
  ${Array.from({ length: 6 }, (_, r) =>
    Array.from({ length: 6 }, (_, c) => {
      if ((r + c) % 2 === 0) {
        return `<rect x="${c * 33}" y="${r * 33}" width="33" height="33" fill="#2196F3" opacity="0.15"/>`;
      }
      return '';
    }).join('')
  ).join('')}
</svg>`;

const spiralSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
  <path d="M100,100 m0,-5 a5,5 0 1,1 0,10 a10,10 0 1,1 0,-20 a15,15 0 1,1 0,30 a20,20 0 1,1 0,-40 a25,25 0 1,1 0,50 a30,30 0 1,1 0,-60 a35,35 0 1,1 0,70 a40,40 0 1,1 0,-80 a45,45 0 1,1 0,90 a50,50 0 1,1 0,-100 a55,55 0 1,1 0,110 a60,60 0 1,1 0,-120 a65,65 0 1,1 0,130 a70,70 0 1,1 0,-140"
    fill="none" stroke="#FF6F00" stroke-width="3" stroke-linecap="round"/>
</svg>`;

const diamondSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
  <polygon points="100,10 180,100 100,190 20,100" fill="none" stroke="#00BCD4" stroke-width="4"/>
  <polygon points="100,40 150,100 100,160 50,100" fill="none" stroke="#00BCD4" stroke-width="3" opacity="0.7"/>
  <polygon points="100,70 125,100 100,130 75,100" fill="#00BCD4" opacity="0.5"/>
</svg>`;

const personSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" fill="#2d3436">
  <circle cx="100" cy="55" r="28"/>
  <path d="M100,90 C60,90 35,120 35,180 L70,180 L70,140 L90,140 L90,180 L110,180 L110,140 L130,140 L130,180 L165,180 C165,120 140,90 100,90 Z"/>
</svg>`;

const thinkerSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" fill="#2d3436">
  <circle cx="120" cy="50" r="22"/>
  <rect x="95" y="70" width="50" height="20" rx="10"/>
  <ellipse cx="70" cy="55" rx="10" ry="8"/>
  <path d="M110,90 L110,140 L85,140 L85,110 Q65,100 75,85 Q85,75 110,80"/>
  <line x1="110" y1="140" x2="95" y2="185" stroke-width="12" stroke-linecap="round" stroke="#2d3436"/>
  <line x1="135" y1="140" x2="150" y2="185" stroke-width="12" stroke-linecap="round" stroke="#2d3436"/>
</svg>`;

const runnerSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" fill="#E91E63">
  <circle cx="130" cy="45" r="18"/>
  <path d="M110,70 Q120,65 135,70 L125,110 L100,105 L90,130" stroke-width="10" stroke-linecap="round" stroke="#E91E63" fill="none"/>
  <path d="M125,75 L85,60" stroke-width="10" stroke-linecap="round" stroke="#E91E63"/>
  <path d="M125,75 L160,90" stroke-width="10" stroke-linecap="round" stroke="#E91E63"/>
  <path d="M100,105 L65,150" stroke-width="12" stroke-linecap="round" stroke="#E91E63"/>
  <path d="M125,110 L155,155" stroke-width="12" stroke-linecap="round" stroke="#E91E63"/>
</svg>`;

const dancerSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" fill="#9C27B0">
  <circle cx="100" cy="40" r="20"/>
  <path d="M100,60 Q95,85 80,110 L60,170" stroke-width="12" stroke-linecap="round" stroke="#9C27B0" fill="none"/>
  <path d="M80,110 Q120,120 140,100" stroke-width="10" stroke-linecap="round" stroke="#9C27B0" fill="none"/>
  <path d="M80,110 Q65,80 50,70" stroke-width="10" stroke-linecap="round" stroke="#9C27B0" fill="none"/>
  <path d="M60,170 L130,150" stroke-width="10" stroke-linecap="round" stroke="#9C27B0" fill="none"/>
  <ellipse cx="135" cy="148" rx="12" ry="8" fill="#9C27B0"/>
</svg>`;

const heartSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
  <path d="M100,180 C40,130 10,90 30,55 C45,30 80,25 100,55 C120,25 155,30 170,55 C190,90 160,130 100,180 Z" fill="#E91E63"/>
  <ellipse cx="75" cy="70" rx="15" ry="10" fill="#ffffff" opacity="0.3"/>
</svg>`;

const bubbleSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
  <circle cx="100" cy="85" r="60" fill="#2196F3" opacity="0.5"/>
  <circle cx="100" cy="85" r="60" fill="none" stroke="#2196F3" stroke-width="3"/>
  <ellipse cx="80" cy="65" rx="18" ry="12" fill="#ffffff" opacity="0.5"/>
  <circle cx="140" cy="140" r="18" fill="#2196F3" opacity="0.5"/>
  <circle cx="140" cy="140" r="18" fill="none" stroke="#2196F3" stroke-width="2"/>
  <circle cx="165" cy="170" r="10" fill="#2196F3" opacity="0.5"/>
</svg>`;

const arrowSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
  <path d="M30,100 L140,100" stroke="#FF6F00" stroke-width="14" stroke-linecap="round"/>
  <polygon points="130,50 185,100 130,150" fill="#FF6F00"/>
</svg>`;

const sparkSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
  <polygon points="100,10 115,85 190,100 115,115 100,190 85,115 10,100 85,85" fill="#FFD93D"/>
  <polygon points="100,40 108,90 155,100 108,110 100,160 92,110 45,100 92,90" fill="#FF6F00" opacity="0.6"/>
</svg>`;

const lightningSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
  <polygon points="115,10 55,110 95,110 75,190 145,80 100,80 130,10" fill="#FFD93D"/>
  <polygon points="115,10 55,110 95,110 75,190 145,80 100,80 130,10" fill="none" stroke="#FF6F00" stroke-width="2"/>
</svg>`;

const planetSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
  <ellipse cx="100" cy="100" rx="85" ry="25" fill="none" stroke="#FFD93D" stroke-width="4" transform="rotate(-20 100 100)"/>
  <circle cx="100" cy="100" r="45" fill="#FF6F00"/>
  <circle cx="85" cy="85" r="12" fill="#FFA94D" opacity="0.8"/>
  <circle cx="115" cy="110" r="8" fill="#FFA94D" opacity="0.6"/>
</svg>`;

const featherSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
  <path d="M50,180 Q40,120 80,70 Q120,30 170,25 Q165,80 130,120 Q90,160 50,180 Z" fill="#2196F3"/>
  <path d="M50,180 Q75,150 100,110 Q120,80 140,55" stroke="#1976D2" stroke-width="2" fill="none"/>
  ${[...Array(7)].map((_, i) => {
    const y = 170 - i * 20;
    const x1 = 60 + i * 10;
    return `<line x1="${x1}" y1="${y}" x2="${x1 + 25}" y2="${y - 10}" stroke="#1976D2" stroke-width="1.5" opacity="0.7"/>`;
  }).join('')}
</svg>`;

export const ASSETS: AssetItem[] = [
  makeAsset('mountain-1', '山脉日出', '自然', mountainSvg('#2D6A4F', '#95D5B2')),
  makeAsset('mountain-2', '雪山', '自然', mountainSvg('#6C757D', '#DEE2E6')),
  makeAsset('tree', '松树', '自然', treeSvg),
  makeAsset('sun', '太阳', '自然', sunSvg),
  makeAsset('cloud', '云朵', '自然', cloudSvg),
  makeAsset('leaf', '叶子', '自然', leafSvg),
  makeAsset('wave', '海浪', '自然', waveSvg),
  makeAsset('star', '星星', '自然', starSvg),
  makeAsset('moon', '月亮', '自然', moonSvg),
  makeAsset('rainbow', '彩虹', '自然', rainbowSvg),
  makeAsset('flower', '花朵', '自然', flowerSvg),
  makeAsset('circle-geo', '同心圆', '几何', circleGeoSvg),
  makeAsset('triangle', '三角', '几何', triangleSvg),
  makeAsset('hexagon', '六边形', '几何', hexagonSvg),
  makeAsset('grid', '棋盘格', '几何', gridSvg),
  makeAsset('spiral', '螺旋', '几何', spiralSvg),
  makeAsset('diamond', '菱形', '几何', diamondSvg),
  makeAsset('person', '人物剪影', '人物', personSvg),
  makeAsset('thinker', '思考者', '人物', thinkerSvg),
  makeAsset('runner', '奔跑者', '人物', runnerSvg),
  makeAsset('dancer', '舞者', '人物', dancerSvg),
  makeAsset('heart', '爱心', '装饰', heartSvg),
  makeAsset('bubble', '气泡', '装饰', bubbleSvg),
  makeAsset('arrow', '箭头', '装饰', arrowSvg),
  makeAsset('spark', '闪耀', '装饰', sparkSvg),
  makeAsset('lightning', '闪电', '装饰', lightningSvg),
  makeAsset('planet', '星球', '装饰', planetSvg),
  makeAsset('feather', '羽毛', '装饰', featherSvg),
];

export const ASSET_CATEGORIES = ['全部', '自然', '几何', '人物', '装饰'];

export function getAssetsByCategory(category: string): AssetItem[] {
  if (category === '全部') return ASSETS;
  return ASSETS.filter((a) => a.category === category);
}
