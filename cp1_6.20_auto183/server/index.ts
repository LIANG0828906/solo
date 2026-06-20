import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

export type CapsuleStatus = 'planted' | 'sealed' | 'unlocked' | 'discovered';

export interface Capsule {
  id: string;
  lat: number;
  lng: number;
  text: string;
  imageUrl: string;
  openDate: string;
  createdAt: string;
  status: CapsuleStatus;
  discoveredAt?: string;
  discoveredBy?: string;
}

const capsules = new Map<string, Capsule>();
const userDiscoveries = new Map<string, Set<string>>();

const getCurrentStatus = (capsule: Capsule): CapsuleStatus => {
  const now = new Date();
  const openDate = new Date(capsule.openDate);

  if (capsule.status === 'discovered') return 'discovered';
  if (now >= openDate) return 'unlocked';
  return 'sealed';
};

const seedSampleCapsules = () => {
  const samples: Omit<Capsule, 'id' | 'createdAt' | 'status'>[] = [
    {
      lat: 39.9042,
      lng: 116.4074,
      text: '致未来的旅人：当你打开这个胶囊时，愿你心中仍有热爱，眼中仍有星光。2024年的北京，阳光正好。',
      imageUrl: 'https://images.unsplash.com/photo-1508804185872-d7badad00f7d?w=400',
      openDate: new Date(Date.now() - 86400000).toISOString(),
    },
    {
      lat: 40.7128,
      lng: -74.006,
      text: '来自纽约的问候！自由女神像在夕阳下熠熠生辉，希望这份美好能跨越时空传递给你。',
      imageUrl: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=400',
      openDate: new Date(Date.now() - 172800000).toISOString(),
    },
    {
      lat: 51.5074,
      lng: -0.1278,
      text: '伦敦的雾已散去，大本钟的钟声回荡在泰晤士河畔。有些东西，值得等待。',
      imageUrl: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=400',
      openDate: new Date(Date.now() + 86400000 * 2).toISOString(),
    },
    {
      lat: 35.6762,
      lng: 139.6503,
      text: '东京的樱花漫天飞舞，平成最后的春天。愿你也有这般绚烂的季节。',
      imageUrl: 'https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=400',
      openDate: new Date(Date.now() - 259200000).toISOString(),
    },
    {
      lat: -33.8688,
      lng: 151.2093,
      text: '悉尼歌剧院的贝壳在阳光下闪耀，南半球的海风正暖。',
      imageUrl: 'https://images.unsplash.com/photo-1523482580672-f109ba8cb9be?w=400',
      openDate: new Date(Date.now() + 86400000 * 5).toISOString(),
    },
    {
      lat: 48.8566,
      lng: 2.3522,
      text: '巴黎铁塔下的誓言，塞纳河畔的落日。浪漫不分时间，对吗？',
      imageUrl: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=400',
      openDate: new Date(Date.now() - 345600000).toISOString(),
    },
  ];

  samples.forEach((sample) => {
    const id = uuidv4();
    const capsule: Capsule = {
      ...sample,
      id,
      createdAt: new Date().toISOString(),
      status: 'planted',
    };
    capsule.status = getCurrentStatus(capsule);
    capsules.set(id, capsule);
  });
};

seedSampleCapsules();

app.get('/api/capsules', (_req, res) => {
  const result = Array.from(capsules.values()).map((c) => ({
    ...c,
    status: getCurrentStatus(c),
  }));
  res.json(result);
});

app.get('/api/capsules/:id', (req, res) => {
  const { id } = req.params;
  const capsule = capsules.get(id);
  if (!capsule) {
    res.status(404).json({ error: 'Capsule not found' });
    return;
  }
  const updatedCapsule = { ...capsule, status: getCurrentStatus(capsule) };
  res.json(updatedCapsule);
});

app.get('/api/capsules/random', (req, res) => {
  const userId = (req.headers['x-user-id'] as string) || 'anonymous';

  const discoveredSet = userDiscoveries.get(userId) || new Set<string>();

  const availableCapsules = Array.from(capsules.values()).filter((c) => {
    const status = getCurrentStatus(c);
    return status === 'unlocked' && !discoveredSet.has(c.id);
  });

  if (availableCapsules.length === 0) {
    res.status(404).json({ error: 'No available capsules to discover' });
    return;
  }

  const randomIndex = Math.floor(Math.random() * availableCapsules.length);
  const randomCapsule = availableCapsules[randomIndex];
  const result = { ...randomCapsule, status: getCurrentStatus(randomCapsule) };

  res.json(result);
});

app.post('/api/capsules', (req, res) => {
  const { lat, lng, text, imageUrl, openDate } = req.body;

  if (
    typeof lat !== 'number' ||
    typeof lng !== 'number' ||
    typeof text !== 'string' ||
    typeof openDate !== 'string'
  ) {
    res.status(400).json({ error: 'Missing required fields' });
    return;
  }

  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    res.status(400).json({ error: 'Invalid coordinates' });
    return;
  }

  const id = uuidv4();
  const now = new Date();
  const capsule: Capsule = {
    id,
    lat,
    lng,
    text: text.slice(0, 500),
    imageUrl: imageUrl || '',
    openDate,
    createdAt: now.toISOString(),
    status: 'planted',
  };
  capsule.status = getCurrentStatus(capsule);

  capsules.set(id, capsule);
  res.status(201).json(capsule);
});

app.post('/api/capsules/:id/discover', (req, res) => {
  const { id } = req.params;
  const userId = (req.headers['x-user-id'] as string) || 'anonymous';

  const capsule = capsules.get(id);
  if (!capsule) {
    res.status(404).json({ error: 'Capsule not found' });
    return;
  }

  const currentStatus = getCurrentStatus(capsule);
  if (currentStatus === 'sealed') {
    res.status(403).json({ error: 'Capsule is still sealed' });
    return;
  }

  if (!userDiscoveries.has(userId)) {
    userDiscoveries.set(userId, new Set());
  }
  const discoveredSet = userDiscoveries.get(userId)!;

  if (discoveredSet.has(id)) {
    res.status(403).json({ error: 'You have already discovered this capsule' });
    return;
  }

  discoveredSet.add(id);
  capsule.status = 'discovered';
  capsule.discoveredAt = new Date().toISOString();
  capsule.discoveredBy = userId;
  capsules.set(id, capsule);

  res.json({ ...capsule, status: getCurrentStatus(capsule) });
});

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', capsulesCount: capsules.size });
});

app.listen(PORT, () => {
  console.log(`[Server] Time Capsule API running on http://localhost:${PORT}`);
  console.log(`[Server] Seeded ${capsules.size} sample capsules`);
});
