import 'express-async-errors';
import express, { Request, Response } from 'express';
import cors from 'cors';

// ============ 类型定义 ============
interface DataPoint {
  timeStep: number;
  lat: number;
  lng: number;
  windSpeed: number;
  pressure: number;
  category: number;
}

type DisasterLevel = 1 | 2 | 3;

interface CityTimelineStep {
  windLevel: number;
  rainfall: number;
  disasterLevel: DisasterLevel;
  affectedPopulation: number;
}

interface CityImpact {
  cityId: string;
  name: string;
  lat: number;
  lng: number;
  size: 'small' | 'large';
  timeline: CityTimelineStep[];
}

interface HeatmapCell { lat: number; lng: number; intensity: number; }
interface HeatmapGrid { timeStep: number; cells: HeatmapCell[]; }

const TOTAL_STEPS = 72;

// ============ 工具函数 ============
function seededRandom(seed: number): () => number {
  let s = seed >>> 0;
  return function () {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}

function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const la1 = lat1 * Math.PI / 180;
  const la2 = lat2 * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

// ============ 数据生成：台风路径 ============
function generateTyphoonPath(): DataPoint[] {
  const rand = seededRandom(20240801);
  // 起点：马里亚纳海沟附近 (142.0, 13.5N)
  // 路径沿琉球群岛向西北移动，掠过台湾，登陆福建浙江一带，转向东北入海
  const controlPoints = [
    { t: 0,   lat: 13.5, lng: 142.0 },
    { t: 0.2, lat: 17.5, lng: 133.0 },
    { t: 0.4, lat: 22.8, lng: 126.0 },
    { t: 0.6, lat: 26.5, lng: 121.5 },
    { t: 0.8, lat: 29.5, lng: 119.5 },
    { t: 1.0, lat: 33.5, lng: 124.0 },
  ];
  const path: DataPoint[] = [];
  for (let i = 0; i < TOTAL_STEPS; i++) {
    const t = i / (TOTAL_STEPS - 1);
    // 找到所在区间
    let seg = 0;
    for (let j = 0; j < controlPoints.length - 1; j++) {
      if (t >= controlPoints[j].t && t <= controlPoints[j + 1].t) { seg = j; break; }
    }
    const cp0 = controlPoints[seg];
    const cp1 = controlPoints[seg + 1];
    const lt = (t - cp0.t) / (cp1.t - cp0.t);
    // 贝塞尔样条（使用中间控制点）
    const midLat = (cp0.lat + cp1.lat) / 2 + (rand() - 0.5) * 2.2;
    const midLng = (cp0.lng + cp1.lng) / 2 + (rand() - 0.5) * 2.2;
    const lat = lerp(lerp(cp0.lat, midLat, lt), lerp(midLat, cp1.lat, lt), lt);
    const lng = lerp(lerp(cp0.lng, midLng, lt), lerp(midLng, cp1.lng, lt), lt);

    // 风速曲线：0 -> 升至峰值(0.5左右) -> 下降（登陆后减弱）
    const windProgress = Math.sin(Math.min(1, t / 0.55) * Math.PI);  // 0..1..0 峰值约0.55
    const baseWind = 80 + windProgress * 140 + (rand() - 0.5) * 18;
    // 登陆（约0.65）后快速衰减
    let wind = t > 0.65
      ? baseWind * Math.max(0.25, 1 - (t - 0.65) * 1.2)
      : baseWind;
    wind = Math.max(40, Math.min(245, wind));

    // 气压（960~1010 hPa，与风速负相关
    const pressure = 1013 - (wind - 40) * 0.22 + (rand() - 0.5) * 3;

    // 台风等级 0-5（Saffir-Simpson 简化版）
    let category = 0;
    if (wind >= 210) category = 5;
    else if (wind >= 178) category = 4;
    else if (wind >= 149) category = 3;
    else if (wind >= 119) category = 2;
    else if (wind >= 90) category = 1;

    path.push({
      timeStep: i,
      lat: +lat.toFixed(3),
      lng: +lng.toFixed(3),
      windSpeed: +wind.toFixed(1),
      pressure: +pressure.toFixed(1),
      category,
    });
  }
  return path;
}

// ============ 数据生成：沿海城市 ============
const CITY_DEFS: Omit<CityImpact, 'timeline'>[] = [
  { cityId: 'SHA', name: '上海', lat: 31.23, lng: 121.47, size: 'large' },
  { cityId: 'NGB', name: '宁波', lat: 29.87, lng: 121.55, size: 'large' },
  { cityId: 'WZQ', name: '温州', lat: 27.99, lng: 120.70, size: 'small' },
  { cityId: 'FZH', name: '福州', lat: 26.08, lng: 119.30, size: 'large' },
  { cityId: 'XMN', name: '厦门', lat: 24.48, lng: 118.09, size: 'large' },
  { cityId: 'SWA', name: '汕头', lat: 23.35, lng: 116.68, size: 'small' },
  { cityId: 'GZH', name: '广州', lat: 23.13, lng: 113.26, size: 'large' },
  { cityId: 'HKG', name: '香港', lat: 22.32, lng: 114.17, size: 'large' },
];

function generateCityTimeline(city: Omit<CityImpact, 'timeline'>, typhoonPath: DataPoint[]): CityTimelineStep[] {
  const rand = seededRandom(city.cityId.charCodeAt(0) * 131 + city.cityId.charCodeAt(2) * 17);
  const basePop = city.size === 'large' ? 800 : 200; // 万人口基数
  return typhoonPath.map((pt, idx) => {
    const dist = haversineKm(city.lat, city.lng, pt.lat, pt.lng);
    // 距离越近影响越大
    const influence = Math.max(0, 1 - dist / 1400);
    // 风力等级（1-12）
    const windLevelRaw = Math.round(4 + influence * 9 + (rand() - 0.5) * 1.2);
    const windLevel = Math.max(1, Math.min(12, windLevelRaw));
    // 降雨量
    const rainfall = +(influence * 320 * (0.8 + rand() * 0.6)).toFixed(1);
    // 灾害等级
    let disasterLevel: DisasterLevel = 1;
    if (influence > 0.72 || windLevel >= 10) disasterLevel = 3;
    else if (influence > 0.45 || windLevel >= 7) disasterLevel = 2;
    // 受灾人口（受距离、强度影响）
    const affectedPopulation = Math.round(basePop * influence * (0.15 + pt.windSpeed / 400) * 10000);
    return { windLevel, rainfall, disasterLevel, affectedPopulation };
  });
}

function generateCities(path: DataPoint[]): CityImpact[] {
  return CITY_DEFS.map(c => ({
    ...c,
    timeline: generateCityTimeline(c, path),
  }));
}

// ============ 数据生成：热力图网格 ============
function generateHeatmap(timeStep: number, path: DataPoint[], cities: CityImpact[]): HeatmapGrid {
  const cells: HeatmapCell[] = [];
  const pt = path[Math.min(Math.max(0, timeStep), TOTAL_STEPS - 1)];
  // 台风中心周围
  for (let dLat = -6; dLat <= 6; dLat += 1.5) {
    for (let dLng = -8; dLng <= 8; dLng += 1.5) {
      const lat = pt.lat + dLat;
      const lng = pt.lng + dLng;
      const dist = haversineKm(pt.lat, pt.lng, lat, lng);
      const intensity = Math.max(0, 1 - dist / 900);
      if (intensity > 0.05) cells.push({ lat: +lat.toFixed(2), lng: +lng.toFixed(2), intensity: +intensity.toFixed(3) });
    }
  }
  // 叠加城市局部热点
  for (const city of cities) {
    const step = city.timeline[Math.min(timeStep, city.timeline.length - 1)];
    if (step.disasterLevel >= 2) {
      cells.push({
        lat: city.lat,
        lng: city.lng,
        intensity: +(step.disasterLevel / 3 * 0.9).toFixed(3),
      });
    }
  }
  return { timeStep, cells };
}

// ============ 启动Express服务 ============
const app = express();

// CORS 中间件（必须在路由注册之前）
app.use(cors({ origin: '*' }));
app.use(express.json());

// 核心数据缓存，进程启动时一次性生成
const TYPHOON_PATH = generateTyphoonPath();
const CITIES = generateCities(TYPHOON_PATH);

// ============ 路由注册：使用 express.Router() 实例 ============
const typhoonRouter = express.Router();

// GET /api/typhoon/path → 返回台风路径坐标数组（72个时间步）
typhoonRouter.get('/path', (_req: Request, res: Response) => {
  res.json({ data: TYPHOON_PATH });
});

// GET /api/typhoon/cities → 返回受影响城市列表及灾害等级
typhoonRouter.get('/cities', (_req: Request, res: Response) => {
  res.json({ data: CITIES });
});

// GET /api/typhoon/heatmap?time=N → 返回该时间步的热力图数据网格
typhoonRouter.get('/heatmap', (req: Request, res: Response) => {
  const t = parseInt(String(req.query.time ?? '0'), 10);
  const timeStep = isNaN(t) ? 0 : Math.min(Math.max(0, t), TOTAL_STEPS - 1);
  res.json({ data: generateHeatmap(timeStep, TYPHOON_PATH, CITIES) });
});

// 将 Router 挂载到 /api/typhoon 前缀
// 最终路由: /api/typhoon/path, /api/typhoon/cities, /api/typhoon/heatmap
app.use('/api/typhoon', typhoonRouter);

// 健康检查（独立端点，不走 Router）
app.get('/api/health', (_req, res) => res.json({ status: 'ok', uptime: process.uptime() }));

// 404 兜底：所有未匹配的 /api/* 路由返回明确错误信息
app.use('/api', (_req, res) => {
  res.status(404).json({ error: 'Not Found', hint: 'Available: /api/typhoon/path, /api/typhoon/cities, /api/typhoon/heatmap?time=N, /api/health' });
});

const PORT_CANDIDATES: number[] = [3001, 3002, 3003, 3004, 3005, 3006, 3007];

function listenAnyPort(app: express.Express, ports: number[]): Promise<number> {
  return new Promise((resolve, reject) => {
    let idx = 0;
    const tryNext = () => {
      if (idx >= ports.length) {
        reject(new Error('No available port in range: ' + ports.join(',')));
        return;
      }
      const port = ports[idx++];
      const server = app.listen(port, () => {
        resolve(port);
      });
      server.once('error', (err: any) => {
        if (err && err.code === 'EADDRINUSE') {
          try { server.close(() => { /* noop */ }); } catch { /* ignore */ }
          tryNext();
        } else {
          reject(err);
        }
      });
    };
    tryNext();
  });
}

listenAnyPort(app, PORT_CANDIDATES).then((port) => {
  // eslint-disable-next-line no-console
  console.log(`[Typhoon API] running on http://localhost:${port}`);
  console.log(`  GET /api/typhoon/path`);
  console.log(`  GET /api/typhoon/cities`);
  console.log(`  GET /api/typhoon/heatmap?time=N`);
}).catch(err => {
  // eslint-disable-next-line no-console
  console.error('[Typhoon API] failed to start:', err);
  process.exit(1);
});
