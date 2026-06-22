import type { Poster, PosterTemplate } from '@/types';
import { generateLongId } from './uuid';

function createPosterPreview(bgColor: string, accentColor: string, text: string): string {
  const canvas = document.createElement('canvas');
  canvas.width = 560;
  canvas.height = 800;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  const grd = ctx.createLinearGradient(0, 0, 0, 800);
  grd.addColorStop(0, bgColor);
  grd.addColorStop(1, adjustBrightness(bgColor, -30));
  ctx.fillStyle = grd;
  ctx.fillRect(0, 0, 560, 800);

  ctx.fillStyle = accentColor;
  ctx.globalAlpha = 0.85;
  ctx.beginPath();
  ctx.arc(180, 260, 140, 0, Math.PI * 2);
  ctx.fill();

  ctx.globalAlpha = 0.6;
  ctx.fillRect(80, 460, 400, 60);

  ctx.globalAlpha = 0.9;
  ctx.fillRect(80, 560, 280, 18);
  ctx.globalAlpha = 0.7;
  ctx.fillRect(80, 595, 360, 14);
  ctx.globalAlpha = 0.5;
  ctx.fillRect(80, 625, 200, 12);

  ctx.globalAlpha = 1;
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 64px "Noto Sans SC", sans-serif';
  ctx.fillText(text, 80, 200);

  return canvas.toDataURL('image/png');
}

function adjustBrightness(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.max(0, Math.min(255, (num >> 16) + amt));
  const G = Math.max(0, Math.min(255, ((num >> 8) & 0x00ff) + amt));
  const B = Math.max(0, Math.min(255, (num & 0x0000ff) + amt));
  return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
}

function createTemplate1(): PosterTemplate {
  return {
    width: 900,
    height: 1260,
    palette: ['#E63946', '#F1FAEE', '#A8DADC', '#457B9D', '#1D3557'],
    bgColor: '#1D3557',
    layers: [
      {
        id: 'bg-shape-1',
        type: 'circle',
        x: 300,
        y: 350,
        w: 500,
        h: 500,
        color: '#E63946',
        opacity: 0.9,
        zIndex: 1,
      },
      {
        id: 'bg-shape-2',
        type: 'rect',
        x: 100,
        y: 700,
        w: 700,
        h: 100,
        color: '#A8DADC',
        opacity: 0.7,
        zIndex: 2,
        rotation: -3,
      },
      {
        id: 'title',
        type: 'text',
        x: 80,
        y: 240,
        w: 740,
        h: 120,
        color: '#F1FAEE',
        opacity: 1.0,
        zIndex: 10,
        content: '燃·FLOW',
        fontSize: 140,
        fontFamily: '"Noto Sans SC", sans-serif',
      },
      {
        id: 'subtitle',
        type: 'text',
        x: 80,
        y: 900,
        w: 740,
        h: 60,
        color: '#F1FAEE',
        opacity: 0.9,
        zIndex: 9,
        content: '流动的瞬间 2026',
        fontSize: 48,
        fontFamily: '"Noto Sans SC", sans-serif',
      },
      {
        id: 'line-1',
        type: 'rect',
        x: 80,
        y: 1000,
        w: 500,
        h: 6,
        color: '#F1FAEE',
        opacity: 0.4,
        zIndex: 8,
      },
      {
        id: 'author-label',
        type: 'text',
        x: 80,
        y: 1080,
        w: 740,
        h: 40,
        color: '#A8DADC',
        opacity: 0.85,
        zIndex: 7,
        content: 'Curated by 林溪山',
        fontSize: 32,
        fontFamily: '"Noto Sans SC", sans-serif',
      },
      {
        id: 'accent-dot',
        type: 'circle',
        x: 750,
        y: 1150,
        w: 100,
        h: 100,
        color: '#E63946',
        opacity: 0.6,
        zIndex: 3,
      },
    ],
  };
}

function createTemplate2(): PosterTemplate {
  return {
    width: 900,
    height: 1260,
    palette: ['#0D1B2A', '#1B263B', '#415A77', '#778DA9', '#E0E1DD'],
    bgColor: '#0D1B2A',
    layers: [
      {
        id: 'diag-1',
        type: 'rect',
        x: -200,
        y: 200,
        w: 1100,
        h: 160,
        color: '#778DA9',
        opacity: 0.35,
        zIndex: 1,
        rotation: 12,
      },
      {
        id: 'diag-2',
        type: 'rect',
        x: -200,
        y: 420,
        w: 1100,
        h: 100,
        color: '#415A77',
        opacity: 0.5,
        zIndex: 2,
        rotation: 12,
      },
      {
        id: 'main-title',
        type: 'text',
        x: 80,
        y: 180,
        w: 740,
        h: 150,
        color: '#E0E1DD',
        opacity: 1.0,
        zIndex: 10,
        content: '静谧',
        fontSize: 180,
        fontFamily: '"Noto Sans SC", sans-serif',
      },
      {
        id: 'en-title',
        type: 'text',
        x: 80,
        y: 310,
        w: 740,
        h: 60,
        color: '#778DA9',
        opacity: 0.75,
        zIndex: 9,
        content: 'SILENCE',
        fontSize: 56,
        fontFamily: '"Noto Sans SC", sans-serif',
      },
      {
        id: 'big-circle',
        type: 'circle',
        x: 450,
        y: 880,
        w: 520,
        h: 520,
        color: '#415A77',
        opacity: 0.4,
        zIndex: 3,
      },
      {
        id: 'inner-circle',
        type: 'circle',
        x: 450,
        y: 880,
        w: 340,
        h: 340,
        color: '#E0E1DD',
        opacity: 0.15,
        zIndex: 4,
      },
      {
        id: 'date-text',
        type: 'text',
        x: 80,
        y: 1160,
        w: 400,
        h: 40,
        color: '#778DA9',
        opacity: 0.9,
        zIndex: 8,
        content: '2026 / 夏季展',
        fontSize: 30,
        fontFamily: '"Noto Sans SC", sans-serif',
      },
    ],
  };
}

function createTemplate3(): PosterTemplate {
  return {
    width: 900,
    height: 1260,
    palette: ['#FF6B6B', '#FFD93D', '#6BCB77', '#4D96FF', '#533483'],
    bgColor: '#FFF8E7',
    layers: [
      {
        id: 'block-yellow',
        type: 'rect',
        x: 0,
        y: 0,
        w: 900,
        h: 380,
        color: '#FFD93D',
        opacity: 1.0,
        zIndex: 1,
      },
      {
        id: 'block-pink',
        type: 'rect',
        x: 580,
        y: 380,
        w: 320,
        h: 880,
        color: '#FF6B6B',
        opacity: 1.0,
        zIndex: 2,
      },
      {
        id: 'circle-green',
        type: 'circle',
        x: 220,
        y: 780,
        w: 420,
        h: 420,
        color: '#6BCB77',
        opacity: 0.95,
        zIndex: 3,
      },
      {
        id: 'arc-blue',
        type: 'circle',
        x: 140,
        y: 180,
        w: 260,
        h: 260,
        color: '#4D96FF',
        opacity: 0.85,
        zIndex: 4,
      },
      {
        id: 'title-big',
        type: 'text',
        x: 50,
        y: 200,
        w: 600,
        h: 140,
        color: '#533483',
        opacity: 1.0,
        zIndex: 10,
        content: 'PLAY!',
        fontSize: 180,
        fontFamily: '"Noto Sans SC", sans-serif',
      },
      {
        id: 'sub-zh',
        type: 'text',
        x: 50,
        y: 320,
        w: 500,
        h: 50,
        color: '#533483',
        opacity: 0.8,
        zIndex: 9,
        content: '万物皆可游戏',
        fontSize: 44,
        fontFamily: '"Noto Sans SC", sans-serif',
      },
      {
        id: 'center-quote',
        type: 'text',
        x: 80,
        y: 1080,
        w: 440,
        h: 50,
        color: '#533483',
        opacity: 0.75,
        zIndex: 8,
        content: '艺术家: 苏小梦 | 数字媒介',
        fontSize: 28,
        fontFamily: '"Noto Sans SC", sans-serif',
      },
    ],
  };
}

function createTemplate4(): PosterTemplate {
  return {
    width: 900,
    height: 1260,
    palette: ['#2B2D42', '#8D99AE', '#EDF2F4', '#EF233C', '#D90429'],
    bgColor: '#EDF2F4',
    layers: [
      {
        id: 'dark-top',
        type: 'rect',
        x: 0,
        y: 0,
        w: 900,
        h: 560,
        color: '#2B2D42',
        opacity: 1.0,
        zIndex: 1,
      },
      {
        id: 'red-accent',
        type: 'rect',
        x: 0,
        y: 540,
        w: 900,
        h: 40,
        color: '#EF233C',
        opacity: 1.0,
        zIndex: 2,
      },
      {
        id: 'stripes-1',
        type: 'rect',
        x: 0,
        y: 620,
        w: 900,
        h: 20,
        color: '#8D99AE',
        opacity: 0.5,
        zIndex: 3,
      },
      {
        id: 'stripes-2',
        type: 'rect',
        x: 0,
        y: 660,
        w: 900,
        h: 20,
        color: '#8D99AE',
        opacity: 0.3,
        zIndex: 4,
      },
      {
        id: 'big-num',
        type: 'text',
        x: 60,
        y: 460,
        w: 500,
        h: 400,
        color: '#EDF2F4',
        opacity: 1.0,
        zIndex: 10,
        content: '∞',
        fontSize: 460,
        fontFamily: '"Noto Sans SC", sans-serif',
      },
      {
        id: 'headline',
        type: 'text',
        x: 60,
        y: 180,
        w: 780,
        h: 100,
        color: '#EDF2F4',
        opacity: 1.0,
        zIndex: 9,
        content: '无限边界',
        fontSize: 110,
        fontFamily: '"Noto Sans SC", sans-serif',
      },
      {
        id: 'meta-line-1',
        type: 'text',
        x: 60,
        y: 780,
        w: 780,
        h: 60,
        color: '#2B2D42',
        opacity: 0.9,
        zIndex: 8,
        content: 'LIMITLESS EDGE',
        fontSize: 56,
        fontFamily: '"Noto Sans SC", sans-serif',
      },
      {
        id: 'meta-line-2',
        type: 'text',
        x: 60,
        y: 860,
        w: 780,
        h: 40,
        color: '#2B2D42',
        opacity: 0.6,
        zIndex: 7,
        content: '探索数字艺术的无尽可能  ·  策展: Alex Chen',
        fontSize: 30,
        fontFamily: '"Noto Sans SC", sans-serif',
      },
      {
        id: 'bottom-red-dot',
        type: 'circle',
        x: 800,
        y: 1160,
        w: 140,
        h: 140,
        color: '#EF233C',
        opacity: 0.8,
        zIndex: 5,
      },
    ],
  };
}

export function createMockPosters(): Poster[] {
  const now = new Date();
  const daysAgo = (d: number) =>
    new Date(now.getTime() - d * 24 * 3600 * 1000).toISOString();

  return [
    {
      id: generateLongId(),
      name: '燃·Flow',
      author: '林溪山',
      createdAt: daysAgo(3),
      previewImage: createPosterPreview('#1D3557', '#E63946', '燃'),
      template: createTemplate1(),
      derivedVersions: [],
    },
    {
      id: generateLongId(),
      name: '静谧 Silence',
      author: '周子墨',
      createdAt: daysAgo(9),
      previewImage: createPosterPreview('#0D1B2A', '#778DA9', '静'),
      template: createTemplate2(),
      derivedVersions: [],
    },
    {
      id: generateLongId(),
      name: 'Play! 万物皆可游戏',
      author: '苏小梦',
      createdAt: daysAgo(15),
      previewImage: createPosterPreview('#FFD93D', '#FF6B6B', '玩'),
      template: createTemplate3(),
      derivedVersions: [],
    },
    {
      id: generateLongId(),
      name: '无限边界 Limitless',
      author: 'Alex Chen',
      createdAt: daysAgo(22),
      previewImage: createPosterPreview('#2B2D42', '#EF233C', '∞'),
      template: createTemplate4(),
      derivedVersions: [],
    },
  ];
}
