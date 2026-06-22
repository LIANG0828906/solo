import { v4 as uuidv4 } from 'uuid';
import type { Photo } from './types';

const CITIES = [
  { name: '东京', city: 'Tokyo', lat: 35.6762, lng: 139.6503 },
  { name: '纽约', city: 'New York', lat: 40.7128, lng: -74.006 },
  { name: '巴黎', city: 'Paris', lat: 48.8566, lng: 2.3522 },
  { name: '伦敦', city: 'London', lat: 51.5074, lng: -0.1278 },
  { name: '上海', city: 'Shanghai', lat: 31.2304, lng: 121.4737 },
  { name: '北京', city: 'Beijing', lat: 39.9042, lng: 116.4074 },
  { name: '香港', city: 'Hong Kong', lat: 22.3193, lng: 114.1694 },
  { name: '首尔', city: 'Seoul', lat: 37.5665, lng: 126.978 },
  { name: '新加坡', city: 'Singapore', lat: 1.3521, lng: 103.8198 },
  { name: '悉尼', city: 'Sydney', lat: -33.8688, lng: 151.2093 },
  { name: '洛杉矶', city: 'Los Angeles', lat: 34.0522, lng: -118.2437 },
  { name: '旧金山', city: 'San Francisco', lat: 37.7749, lng: -122.4194 },
  { name: '巴塞罗那', city: 'Barcelona', lat: 41.3851, lng: 2.1734 },
  { name: '罗马', city: 'Rome', lat: 41.9028, lng: 12.4964 },
  { name: '柏林', city: 'Berlin', lat: 52.52, lng: 13.405 },
  { name: '曼谷', city: 'Bangkok', lat: 13.7563, lng: 100.5018 },
  { name: '孟买', city: 'Mumbai', lat: 19.076, lng: 72.8777 },
  { name: '迪拜', city: 'Dubai', lat: 25.2048, lng: 55.2708 },
  { name: '开罗', city: 'Cairo', lat: 30.0444, lng: 31.2357 },
  { name: '里约热内卢', city: 'Rio', lat: -22.9068, lng: -43.1729 },
];

const SHUTTER_SPEEDS = [
  '1/30', '1/60', '1/125', '1/250', '1/500', '1/1000', '1/2000',
];
const APERTURES = [1.4, 1.8, 2.0, 2.8, 3.5, 4.0, 5.6, 8.0, 11, 16];
const ISOS = [100, 200, 400, 800, 1600, 3200, 6400];
const PLACES = [
  '涩谷十字路口', '时代广场', '香榭丽舍大街', '泰晤士河畔', '外滩',
  '王府井', '维多利亚港', '明洞街', '滨海湾', '歌剧院',
  '好莱坞大道', '金门大桥', '兰布拉大道', '斗兽场', '勃兰登堡门',
  '大皇宫', '印度门', '哈利法塔', '金字塔', '科帕卡巴纳',
  '新宿御苑', '中央公园', '埃菲尔铁塔', '伦敦眼', '城隍庙',
  '故宫博物院', '太平山顶', '景福宫', '鱼尾狮公园', '邦迪海滩',
];

const PHOTO_TITLES = [
  '雨后霓虹', '孤独的路人', '光影交织', '城市脉搏', '街角故事',
  '清晨微光', '伞下世界', '地铁一瞥', '窗口倒影', '夜色温柔',
  '匆忙人群', '卖花老人', '涂鸦墙前', '咖啡时光', '十字路口',
  '逆光剪影', '雨中小巷', '摩天楼下', '集市喧嚣', '归途',
  '晨曦中的身影', '午夜街头', '玻璃之城', '等待', '转角遇到',
  '黄昏漫步', '广告牌下', '人行道上', '公车驶过', '自行车与猫',
];

const COLORS = [
  ['#FF6B6B', '#FFE66D'], ['#4ECDC4', '#1A535C'], ['#667EEA', '#764BA2'],
  ['#F093FB', '#F5576C'], ['#43E97B', '#38F9D7'], ['#FA709A', '#FEE140'],
  ['#30CFD0', '#330867'], ['#A8EDEA', '#FED6E3'], ['#FCCB90', '#D57E7E'],
  ['#84FAB0', '#8FD3F4'], ['#FAD0C4', '#FF9A9E'], ['#667eea', '#764ba2'],
];

function generateThumbnail(seed: number): string {
  const [c1, c2] = COLORS[seed % COLORS.length];
  const svg = `
<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300'>
  <defs>
    <linearGradient id='g${seed}' x1='0%' y1='0%' x2='100%' y2='100%'>
      <stop offset='0%' stop-color='${c1}'/>
      <stop offset='100%' stop-color='${c2}'/>
    </linearGradient>
    <filter id='n${seed}'>
      <feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' seed='${seed}'/>
      <feColorMatrix values='0 0 0 0 0.1  0 0 0 0 0.1  0 0 0 0 0.15  0 0 0 0.3 0'/>
    </filter>
  </defs>
  <rect width='400' height='300' fill='url(#g${seed})'/>
  <rect width='400' height='300' filter='url(#n${seed})' opacity='0.4'/>
  <circle cx='${120 + (seed * 37) % 180}' cy='${80 + (seed * 23) % 140}' r='${30 + (seed * 7) % 50}' fill='rgba(255,255,255,0.18)'/>
  <circle cx='${260 + (seed * 53) % 100}' cy='${160 + (seed * 41) % 100}' r='${20 + (seed * 13) % 40}' fill='rgba(0,0,0,0.15)'/>
  <rect x='${40 + (seed * 29) % 120}' y='${200 + (seed * 17) % 60}' width='${60 + (seed * 19) % 80}' height='4' fill='rgba(255,255,255,0.5)'/>
  <text x='200' y='155' fill='rgba(255,255,255,0.9)' font-family='Georgia,serif' font-size='22' font-style='italic' text-anchor='middle' opacity='0.95'>Street #${seed + 1}</text>
</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function rand(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

export function generateMockPhotos(count = 260): Photo[] {
  const photos: Photo[] = [];
  for (let i = 0; i < count; i++) {
    const baseCity = CITIES[i % CITIES.length];
    const jitterLat = rand(-0.35, 0.35);
    const jitterLng = rand(-0.45, 0.45);
    const placeIdx = (i * 7 + Math.floor(rand(0, 6))) % PLACES.length;
    const titleIdx = (i * 13 + Math.floor(rand(0, 8))) % PHOTO_TITLES.length;
    photos.push({
      id: uuidv4(),
      title: `${PHOTO_TITLES[titleIdx]} · ${i + 1}`,
      thumbnail: generateThumbnail(i),
      location: {
        lat: baseCity.lat + jitterLat,
        lng: baseCity.lng + jitterLng,
        name: `${baseCity.name} · ${PLACES[placeIdx]}`,
        city: baseCity.city,
      },
      params: {
        aperture: APERTURES[Math.floor(rand(0, APERTURES.length))],
        shutter: SHUTTER_SPEEDS[Math.floor(rand(0, SHUTTER_SPEEDS.length))],
        iso: ISOS[Math.floor(rand(0, ISOS.length))],
      },
      uploadedAt: new Date(Date.now() - rand(0, 1000 * 3600 * 24 * 180)).toISOString(),
    });
  }
  return photos;
}

export { SHUTTER_SPEEDS, APERTURES, ISOS, CITIES };
