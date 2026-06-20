import { v4 as uuidv4 } from 'uuid';
import { writeDB, readDB } from './dataStore';
import type { BoxSeries, Artwork, User } from '../shared/types';

function genArtCode(): string {
  const p1 = Math.random().toString(36).substring(2, 6).toUpperCase();
  const p2 = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `ART-${p1}-${p2}`;
}

function generateThumbnail(seed: string): string {
  const colors = [
    ['#ff00aa', '#00f0ff'],
    ['#ff6b35', '#7b2cbf'],
    ['#00ff87', '#60efff'],
    ['#ff006e', '#8338ec'],
    ['#fb5607', '#ff006e'],
    ['#06ffa5', '#00a5cf']
  ];
  const idx = Math.abs(seed.split('').reduce((a, c) => a + c.charCodeAt(0), 0)) % colors.length;
  const [c1, c2] = colors[idx];
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='200' height='280'>
    <defs>
      <linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>
        <stop offset='0%' stop-color='${c1}'/>
        <stop offset='100%' stop-color='${c2}'/>
      </linearGradient>
    </defs>
    <rect width='200' height='280' rx='12' fill='#0a0a0f'/>
    <rect x='10' y='10' width='180' height='260' rx='8' fill='url(#g)' opacity='0.3'/>
    <circle cx='100' cy='110' r='50' fill='url(#g)' opacity='0.6'/>
    <rect x='40' y='180' width='120' height='40' rx='6' fill='#0a0a0f' opacity='0.7'/>
    <text x='100' y='205' text-anchor='middle' font-family='Orbitron, monospace' font-size='14' fill='#fff' font-weight='bold'>${seed}</text>
  </svg>`;
  return 'data:image/svg+xml;base64,' + Buffer.from(svg).toString('base64');
}

function generatePreview(title: string, seed: string): string {
  const colors = [
    ['#ff00aa', '#00f0ff', '#7b2cbf'],
    ['#00ff87', '#60efff', '#00a5cf'],
    ['#ff6b35', '#ff006e', '#8338ec'],
    ['#fb5607', '#ffbe0b', '#ff006e']
  ];
  const idx = Math.abs(seed.split('').reduce((a, c) => a + c.charCodeAt(0), 0)) % colors.length;
  const [c1, c2, c3] = colors[idx];
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='600' height='400'>
    <defs>
      <linearGradient id='bg' x1='0' y1='0' x2='1' y2='1'>
        <stop offset='0%' stop-color='#0a0a0f'/>
        <stop offset='100%' stop-color='#1a0a2e'/>
      </linearGradient>
      <radialGradient id='glow' cx='50%' cy='50%' r='50%'>
        <stop offset='0%' stop-color='${c1}' stop-opacity='0.5'/>
        <stop offset='100%' stop-color='${c1}' stop-opacity='0'/>
      </radialGradient>
    </defs>
    <rect width='600' height='400' fill='url(#bg)'/>
    <circle cx='300' cy='200' r='180' fill='url(#glow)'/>
    <polygon points='300,60 480,180 420,350 180,350 120,180' fill='none' stroke='${c2}' stroke-width='3' opacity='0.8'/>
    <polygon points='300,110 430,195 390,315 210,315 170,195' fill='${c3}' opacity='0.3' stroke='${c1}' stroke-width='2'/>
    <circle cx='300' cy='210' r='60' fill='${c2}' opacity='0.6'/>
    <text x='300' y='390' text-anchor='middle' font-family='Orbitron, monospace' font-size='18' fill='${c1}' font-weight='bold'>${title}</text>
    <text x='300' y='215' text-anchor='middle' font-family='Orbitron, monospace' font-size='22' fill='#fff' font-weight='bold'>${seed}</text>
  </svg>`;
  return 'data:image/svg+xml;base64,' + Buffer.from(svg).toString('base64');
}

const artworkTitles = [
  ['霓虹梦境', '量子迷航', '赛博洛神', '数据之舞', '矩阵花园', '未来遗迹'],
  ['星尘序曲', '暗物质', '量子纠缠', '时空裂隙', '虚拟之塔', '电路图腾']
];

const seriesInfo = [
  { name: '赛博都市系列', description: '探索霓虹灯下的数字都市，每一件作品都是未来城市的切片。融合东方美学与赛博朋克视觉语言，呈现独一无二的数字幻境。', price: 299 },
  { name: '宇宙漫游系列', description: '穿越星河与暗物质的视觉旅程。灵感来源于量子物理与天体物理，将抽象的宇宙概念转化为具象的数字艺术。', price: 399 }
];

export async function seedDatabase(): Promise<void> {
  const existing = await readDB();
  if (existing.series.length > 0 && existing.users.length > 0) {
    return;
  }

  const series: BoxSeries[] = [];

  for (let si = 0; si < 2; si++) {
    const seriesId = uuidv4();
    const artworks: Artwork[] = [];
    for (let ai = 0; ai < 6; ai++) {
      const code = genArtCode();
      const title = artworkTitles[si][ai];
      artworks.push({
        id: uuidv4(),
        code,
        title,
        description: `${title} — 来自${seriesInfo[si].name}的限量数字艺术作品。唯一编码：${code}，区块链级确权保证。`,
        previewImage: generatePreview(title, code),
        thumbnail: generateThumbnail(code),
        startingPrice: 100 + Math.floor(Math.random() * 400),
        seriesId
      });
    }
    series.push({
      id: seriesId,
      name: seriesInfo[si].name,
      description: seriesInfo[si].description,
      price: seriesInfo[si].price,
      totalCount: 50,
      soldCount: Math.floor(Math.random() * 15),
      artworks
    });
  }

  const user: User = {
    id: 'user-default',
    name: '收藏家Neo',
    balance: 10000,
    collection: []
  };

  await writeDB({
    series,
    users: [user],
    auctions: [],
    transactions: [],
    notifications: []
  });
}
