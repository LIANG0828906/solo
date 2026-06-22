import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

interface PlayRecord {
  id: string;
  date: string;
  trackId: string;
  trackName: string;
  plays: number;
  ageGroup: '18-24' | '25-34' | '35-44' | '45+' | 'unknown';
  region: string;
  gridX: number;
  gridY: number;
}

interface Track {
  id: string;
  name: string;
  plays: number;
}

const TRACK_NAMES = [
  'Midnight Dreams', 'Ocean Waves', 'City Lights', 'Summer Breeze',
  'Electric Soul', 'Neon Nights', 'Rainy Afternoon', 'Starlight',
  'Golden Hour', 'Echoes', 'Velvet Sky', 'Wild Heart'
];

const REGIONS = [
  '北美-西部', '北美-东部', '南美-北部', '南美-南部',
  '欧洲-西部', '欧洲-东部', '非洲-北部', '非洲-南部',
  '亚洲-东亚', '亚洲-东南亚', '亚洲-南亚', '大洋洲',
  '中东', '俄罗斯', '其他'
];

const AGE_GROUPS: PlayRecord['ageGroup'][] = ['18-24', '25-34', '35-44', '45+', 'unknown'];

function generateId(): string {
  return Math.random().toString(36).substring(2, 10);
}

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

const random = seededRandom(42);

function generateMockData(): { records: Map<string, PlayRecord[]>; tracks: Track[]; flows: Map<string, number> } {
  const records = new Map<string, PlayRecord[]>();
  const tracks: Track[] = TRACK_NAMES.map((name, idx) => ({
    id: `track_${idx}`,
    name,
    plays: 0
  }));
  const flows = new Map<string, number>();

  const today = new Date();
  for (let dayOffset = 29; dayOffset >= 0; dayOffset--) {
    const date = new Date(today);
    date.setDate(date.getDate() - dayOffset);
    const dateStr = date.toISOString().split('T')[0];
    const dayRecords: PlayRecord[] = [];

    const recordsPerDay = 50 + Math.floor(random() * 80);
    for (let i = 0; i < recordsPerDay; i++) {
      const trackIdx = Math.floor(random() * tracks.length);
      const track = tracks[trackIdx];
      const ageGroup = AGE_GROUPS[Math.floor(random() * AGE_GROUPS.length)];
      const regionIdx = Math.floor(random() * REGIONS.length);
      const region = REGIONS[regionIdx];
      const plays = Math.floor(random() * 500) + 10;

      track.plays += plays;

      const gridX = (regionIdx % 5) * 4 + Math.floor(random() * 4);
      const gridY = Math.floor(regionIdx / 5) * 5 + Math.floor(random() * 5);

      dayRecords.push({
        id: generateId(),
        date: dateStr,
        trackId: track.id,
        trackName: track.name,
        plays,
        ageGroup,
        region,
        gridX: Math.min(gridX, 19),
        gridY: Math.min(gridY, 14)
      });
    }

    records.set(dateStr, dayRecords);
  }

  for (let i = 0; i < tracks.length; i++) {
    for (let j = 0; j < tracks.length; j++) {
      if (i !== j && random() > 0.5) {
        const key = `${tracks[i].id}->${tracks[j].id}`;
        flows.set(key, Math.floor(random() * 3000) + 100);
      }
    }
  }

  return { records, tracks, flows };
}

const { records: DATA_RECORDS, tracks: DATA_TRACKS, flows: DATA_FLOWS } = generateMockData();

function getRecordsInRange(startDate: string, endDate: string): PlayRecord[] {
  const result: PlayRecord[] = [];
  const start = new Date(startDate);
  const end = new Date(endDate);

  for (const [date, dayRecords] of DATA_RECORDS) {
    const d = new Date(date);
    if (d >= start && d <= end) {
      result.push(...dayRecords);
    }
  }
  return result;
}

app.get('/api/stats', (req, res) => {
  const { startDate, endDate } = req.query;
  const today = new Date();
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 6);

  const start = (startDate as string) || weekAgo.toISOString().split('T')[0];
  const end = (endDate as string) || today.toISOString().split('T')[0];

  const filteredRecords = getRecordsInRange(start, end);

  const dailyMap = new Map<string, { plays: number; trackPlays: Map<string, number> }>();
  const ageCount: Record<string, number> = {
    '18-24': 0, '25-34': 0, '35-44': 0, '45+': 0, 'unknown': 0
  };

  for (const rec of filteredRecords) {
    if (!dailyMap.has(rec.date)) {
      dailyMap.set(rec.date, { plays: 0, trackPlays: new Map() });
    }
    const dayData = dailyMap.get(rec.date)!;
    dayData.plays += rec.plays;

    const currentTrackPlays = dayData.trackPlays.get(rec.trackName) || 0;
    dayData.trackPlays.set(rec.trackName, currentTrackPlays + rec.plays);

    ageCount[rec.ageGroup] += rec.plays;
  }

  const sortedDates = Array.from(dailyMap.keys()).sort();
  const dailyPlays = sortedDates.map(date => {
    const dayData = dailyMap.get(date)!;
    const sortedTracks = Array.from(dayData.trackPlays.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([name, plays]) => ({ name, plays }));

    return { date, plays: dayData.plays, topTracks: sortedTracks };
  });

  const totalAge = Object.values(ageCount).reduce((a, b) => a + b, 0) || 1;
  const audienceAge = {
    '18-24': Math.round((ageCount['18-24'] / totalAge) * 100),
    '25-34': Math.round((ageCount['25-34'] / totalAge) * 100),
    '35-44': Math.round((ageCount['35-44'] / totalAge) * 100),
    '45+': Math.round((ageCount['45+'] / totalAge) * 100),
    'unknown': Math.round((ageCount['unknown'] / totalAge) * 100)
  };

  res.json({ dailyPlays, audienceAge });
});

app.get('/api/heatmap', (req, res) => {
  const { startDate, endDate } = req.query;
  const today = new Date();
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 6);

  const start = (startDate as string) || weekAgo.toISOString().split('T')[0];
  const end = (endDate as string) || today.toISOString().split('T')[0];

  const filteredRecords = getRecordsInRange(start, end);
  const gridMap = new Map<string, { plays: number; region: string }>();

  for (const rec of filteredRecords) {
    const key = `${rec.gridX},${rec.gridY}`;
    const existing = gridMap.get(key);
    if (existing) {
      existing.plays += rec.plays;
    } else {
      gridMap.set(key, { plays: rec.plays, region: rec.region });
    }
  }

  const cells = Array.from(gridMap.entries()).map(([key, data]) => {
    const [x, y] = key.split(',').map(Number);
    return { x, y, region: data.region, plays: data.plays };
  });

  res.json({ cells });
});

app.get('/api/flow', (req, res) => {
  const nodes = DATA_TRACKS.map(t => ({
    id: t.id,
    name: t.name,
    plays: t.plays
  }));

  const totalFlows = Array.from(DATA_FLOWS.values()).reduce((a, b) => a + b, 0) || 1;
  const flows = Array.from(DATA_FLOWS.entries()).map(([key, count]) => {
    const [source, target] = key.split('->');
    return { source, target, percentage: Math.round((count / totalFlows) * 10000) / 100 };
  }).filter(f => f.percentage > 0.5);

  res.json({ nodes, flows });
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`音乐数据分析后端服务运行在 http://localhost:${PORT}`);
});
