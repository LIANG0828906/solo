import express, { Request, Response } from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';

interface Route {
  id: string;
  name: string;
  distance: number;
  lightingRating: number;
  safetyRating: number;
  routeType: 'riverside' | 'park' | 'street';
  coordinates: [number, number][];
  recentReports: number;
  userTag?: string;
  createdAt: number;
}

interface Report {
  id: string;
  type: 'streetlight' | 'stray_dog' | 'suspicious' | 'pothole';
  severity: 'low' | 'medium' | 'high';
  coordinates: [number, number];
  createdAt: number;
  expiresAt: number;
}

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

const routes = new Map<string, Route>();
const reports = new Map<string, Report>();

const generateUserTag = (route: Partial<Route>): string => {
  const tags: string[] = [];
  if (route.safetyRating && route.safetyRating >= 4) {
    tags.push('安全推荐');
  }
  if (route.lightingRating && route.lightingRating >= 4) {
    tags.push('照明良好');
  }
  if (route.distance && route.distance <= 3) {
    tags.push('新手友好');
  }
  if (route.distance && route.distance >= 8) {
    tags.push('长距离挑战');
  }
  if (route.routeType === 'park') {
    tags.push('环境优美');
  }
  if (route.routeType === 'riverside') {
    tags.push('沿河风光');
  }
  return tags[0] || '精选路线';
};

const seedRoutes: Route[] = [
  {
    id: uuidv4(),
    name: '滨江公园夜跑路线',
    distance: 5.2,
    lightingRating: 5,
    safetyRating: 5,
    routeType: 'park',
    coordinates: [
      [31.2304, 121.4737],
      [31.2320, 121.4750],
      [31.2340, 121.4760],
      [31.2360, 121.4740],
      [31.2350, 121.4710],
    ],
    recentReports: 0,
    userTag: '新手友好',
    createdAt: Date.now() - 86400000,
  },
  {
    id: uuidv4(),
    name: '外环绿道 10 公里',
    distance: 10.5,
    lightingRating: 4,
    safetyRating: 4,
    routeType: 'riverside',
    coordinates: [
      [31.2200, 121.4500],
      [31.2250, 121.4550],
      [31.2300, 121.4600],
      [31.2350, 121.4550],
      [31.2400, 121.4500],
    ],
    recentReports: 1,
    userTag: '长距离挑战',
    createdAt: Date.now() - 172800000,
  },
  {
    id: uuidv4(),
    name: '市中心街道路线',
    distance: 3.5,
    lightingRating: 5,
    safetyRating: 3,
    routeType: 'street',
    coordinates: [
      [31.2304, 121.4737],
      [31.2310, 121.4700],
      [31.2290, 121.4680],
      [31.2270, 121.4710],
    ],
    recentReports: 2,
    userTag: '照明良好',
    createdAt: Date.now() - 259200000,
  },
  {
    id: uuidv4(),
    name: '小区周边慢跑',
    distance: 2.1,
    lightingRating: 3,
    safetyRating: 5,
    routeType: 'street',
    coordinates: [
      [31.2250, 121.4600],
      [31.2260, 121.4620],
      [31.2240, 121.4630],
      [31.2230, 121.4610],
    ],
    recentReports: 0,
    userTag: '新手友好',
    createdAt: Date.now() - 345600000,
  },
];

seedRoutes.forEach((route) => routes.set(route.id, route));

const cleanupExpiredReports = () => {
  const now = Date.now();
  for (const [id, report] of reports) {
    if (report.expiresAt < now) {
      reports.delete(id);
    }
  }
};

setInterval(cleanupExpiredReports, 60000);

app.get('/api/routes', (_req: Request, res: Response) => {
  const routesList = Array.from(routes.values()).sort((a, b) => {
    if (b.safetyRating !== a.safetyRating) {
      return b.safetyRating - a.safetyRating;
    }
    return a.recentReports - b.recentReports;
  });
  res.json(routesList);
});

app.post('/api/routes', (req: Request, res: Response) => {
  const { name, distance, lightingRating, safetyRating, routeType, coordinates } = req.body;

  if (!name || !distance || !lightingRating || !safetyRating || !routeType || !coordinates) {
    return res.status(400).json({ error: '缺少必填字段' });
  }

  const newRoute: Route = {
    id: uuidv4(),
    name,
    distance,
    lightingRating,
    safetyRating,
    routeType,
    coordinates,
    recentReports: 0,
    userTag: generateUserTag({ lightingRating, safetyRating, distance, routeType }),
    createdAt: Date.now(),
  };

  routes.set(newRoute.id, newRoute);
  res.status(201).json(newRoute);
});

app.get('/api/reports', (_req: Request, res: Response) => {
  cleanupExpiredReports();
  const reportsList = Array.from(reports.values());
  res.json(reportsList);
});

app.post('/api/reports', (req: Request, res: Response) => {
  const { type, severity, coordinates } = req.body;

  if (!type || !severity || !coordinates) {
    return res.status(400).json({ error: '缺少必填字段' });
  }

  const now = Date.now();
  const newReport: Report = {
    id: uuidv4(),
    type,
    severity,
    coordinates,
    createdAt: now,
    expiresAt: now + 5 * 60 * 1000,
  };

  reports.set(newReport.id, newReport);
  res.status(201).json(newReport);
});

app.listen(PORT, () => {
  console.log(`夜跑安全地图服务器运行在 http://localhost:${PORT}`);
});
