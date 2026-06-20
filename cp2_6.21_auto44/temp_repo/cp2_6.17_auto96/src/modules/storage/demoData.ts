import type { Photo } from '../../types';

function generateDemoPhotos(): Photo[] {
  const photos: Photo[] = [];
  const titles = [
    '城市夜景', '海边日落', '山间清晨', '森林小径', '花海漫步',
    '古镇风情', '雪山远眺', '湖畔倒影', '星空银河', '沙漠黄昏',
    '春日樱花', '夏日海滩', '秋日枫叶', '冬日雪景', '雨后彩虹',
    '咖啡时光', '书房一角', '窗台上的猫', '阳光花园', '静物写生',
    '老巷回忆', '童年记忆', '旅途风景', '美食特写', '建筑光影',
    '微距花朵', '飞翔的鸟', '云海之上', '田野风光', '港口灯塔'
  ];

  const aspects = [
    { w: 400, h: 300 },
    { w: 400, h: 500 },
    { w: 400, h: 400 },
    { w: 400, h: 600 },
    { w: 400, h: 250 }
  ];

  const colors = [
    ['#6C63FF', '#4A47A3'],
    ['#FF6B6B', '#C44569'],
    ['#4ECDC4', '#26A69A'],
    ['#FFD93D', '#F39C12'],
    ['#6BCB77', '#27AE60'],
    ['#FF9A8B', '#E17055'],
    ['#A29BFE', '#6C5CE7'],
    ['#FD79A8', '#E84393']
  ];

  function createGradientSVG(width: number, height: number, colorPair: string[], index: number): string {
    const id = `grad-${index}`;
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
        <defs>
          <linearGradient id="${id}" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:${colorPair[0]};stop-opacity:1" />
            <stop offset="100%" style="stop-color:${colorPair[1]};stop-opacity:1" />
          </linearGradient>
        </defs>
        <rect width="${width}" height="${height}" fill="url(#${id})" />
        <circle cx="${width * 0.7}" cy="${height * 0.3}" r="${Math.min(width, height) * 0.15}" fill="rgba(255,255,255,0.15)" />
        <circle cx="${width * 0.25}" cy="${height * 0.7}" r="${Math.min(width, height) * 0.1}" fill="rgba(255,255,255,0.1)" />
      </svg>
    `;
    return 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg.trim())));
  }

  const now = Date.now();

  for (let i = 0; i < 30; i++) {
    const aspect = aspects[i % aspects.length];
    const colorPair = colors[i % colors.length];
    const title = titles[i % titles.length];
    const daysAgo = i;
    const date = new Date(now - daysAgo * 24 * 60 * 60 * 1000);
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

    const fullUrl = createGradientSVG(aspect.w * 3, aspect.h * 3, colorPair, i);
    const thumbnailUrl = createGradientSVG(aspect.w, aspect.h, colorPair, i);

    photos.push({
      id: `demo-${i}`,
      title: `${title} ${i + 1}`,
      date: dateStr,
      thumbnailUrl,
      fullUrl,
      width: aspect.w * 3,
      height: aspect.h * 3,
      createdAt: now - daysAgo * 24 * 60 * 60 * 1000
    });
  }

  return photos;
}

export const demoPhotos = generateDemoPhotos();
