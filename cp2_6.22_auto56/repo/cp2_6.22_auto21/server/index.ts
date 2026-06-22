import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

interface VersionHistory {
  id: string;
  timestamp: number;
  snapshot: Partial<AdVersion>;
  comment: string;
}

interface AdVersion {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  ctaText: string;
  ctaLink: string;
  createdAt: number;
  history: VersionHistory[];
}

interface AdMetrics {
  impressions: number;
  clicks: number;
  conversions: number;
  ctr: number;
  cvr: number;
}

interface ExperimentData {
  id: string;
  versions: AdVersion[];
  trafficAllocation: Record<string, number>;
  durationHours: number;
  startTime: number;
  metrics: Record<string, AdMetrics>;
  history: { timestamp: number; metrics: Record<string, AdMetrics> }[];
  status: 'draft' | 'running' | 'ended';
  winner: string | null;
}

const generateInitialMetrics = (): AdMetrics => ({
  impressions: 0,
  clicks: 0,
  conversions: 0,
  ctr: 0,
  cvr: 0,
});

const calcMetrics = (m: AdMetrics): AdMetrics => ({
  ...m,
  ctr: m.impressions > 0 ? (m.clicks / m.impressions) * 100 : 0,
  cvr: m.clicks > 0 ? (m.conversions / m.clicks) * 100 : 0,
});

const createDefaultVersions = (): AdVersion[] => [
  {
    id: uuidv4(),
    title: '夏季特惠 - 全场5折起',
    description: '精选商品限时优惠，立即抢购享受超值折扣',
    imageUrl: 'https://picsum.photos/seed/ad1/800/450',
    ctaText: '立即抢购',
    ctaLink: 'https://example.com/sale',
    createdAt: Date.now(),
    history: [],
  },
  {
    id: uuidv4(),
    title: '新用户专享 - 首单立减100',
    description: '注册即享新人礼包，更多福利等你来拿',
    imageUrl: 'https://picsum.photos/seed/ad2/800/450',
    ctaText: '马上注册',
    ctaLink: 'https://example.com/register',
    createdAt: Date.now(),
    history: [],
  },
  {
    id: uuidv4(),
    title: '会员日 - 双倍积分',
    description: 'VIP会员专属活动，购物积分翻倍',
    imageUrl: 'https://picsum.photos/seed/ad3/800/450',
    ctaText: '查看详情',
    ctaLink: 'https://example.com/vip',
    createdAt: Date.now(),
    history: [],
  },
];

let experiment: ExperimentData = (() => {
  const versions = createDefaultVersions();
  const allocation: Record<string, number> = {};
  const metrics: Record<string, AdMetrics> = {};
  versions.forEach((v, i) => {
    allocation[v.id] = i === 0 ? 50 : i === 1 ? 30 : 20;
    metrics[v.id] = generateInitialMetrics();
  });
  return {
    id: uuidv4(),
    versions,
    trafficAllocation: allocation,
    durationHours: 24,
    startTime: Date.now(),
    metrics,
    history: [],
    status: 'running',
    winner: null,
  };
})();

const simulateTraffic = () => {
  if (experiment.status !== 'running') return;

  const totalAllocation = Object.values(experiment.trafficAllocation).reduce(
    (a, b) => a + b,
    0,
  );

  experiment.versions.forEach((version) => {
    const weight = experiment.trafficAllocation[version.id] / totalAllocation;
    const impressionsDelta = Math.floor(Math.random() * 50 * weight) + 10;
    const clicksDelta = Math.floor(
      impressionsDelta * (Math.random() * 0.08 + 0.02),
    );
    const conversionsDelta = Math.floor(
      clicksDelta * (Math.random() * 0.15 + 0.05),
    );

    const current = experiment.metrics[version.id];
    experiment.metrics[version.id] = calcMetrics({
      impressions: current.impressions + impressionsDelta,
      clicks: current.clicks + clicksDelta,
      conversions: current.conversions + conversionsDelta,
      ctr: 0,
      cvr: 0,
    });
  });

  const metricsCopy: Record<string, AdMetrics> = {};
  Object.entries(experiment.metrics).forEach(([k, v]) => {
    metricsCopy[k] = { ...v };
  });
  experiment.history.push({
    timestamp: Date.now(),
    metrics: metricsCopy,
  });

  if (experiment.history.length > 100) {
    experiment.history = experiment.history.slice(-100);
  }

  const elapsed = Date.now() - experiment.startTime;
  const durationMs = experiment.durationHours * 60 * 60 * 1000;
  if (elapsed >= durationMs && experiment.status === 'running') {
    experiment.status = 'ended';
    let bestId: string | null = null;
    let bestCvr = -1;
    Object.entries(experiment.metrics).forEach(([id, m]) => {
      if (m.cvr > bestCvr) {
        bestCvr = m.cvr;
        bestId = id;
      }
    });
    experiment.winner = bestId;
  }
};

setInterval(simulateTraffic, 3000);

app.get('/api/experiment/:id', (_req, res) => {
  res.json(experiment);
});

app.post('/api/reset', (_req, res) => {
  const versions = createDefaultVersions();
  const allocation: Record<string, number> = {};
  const metrics: Record<string, AdMetrics> = {};
  versions.forEach((v, i) => {
    allocation[v.id] = i === 0 ? 50 : i === 1 ? 30 : 20;
    metrics[v.id] = generateInitialMetrics();
  });
  experiment = {
    id: uuidv4(),
    versions,
    trafficAllocation: allocation,
    durationHours: 24,
    startTime: Date.now(),
    metrics,
    history: [],
    status: 'running',
    winner: null,
  };
  res.json({ success: true, experiment });
});

app.post('/api/experiment/:id/publish', (req, res) => {
  const { versions, trafficAllocation, durationHours } = req.body as {
    versions: AdVersion[];
    trafficAllocation: Record<string, number>;
    durationHours: number;
  };
  const metrics: Record<string, AdMetrics> = {};
  versions.forEach((v) => {
    metrics[v.id] = generateInitialMetrics();
  });
  experiment = {
    id: uuidv4(),
    versions,
    trafficAllocation,
    durationHours,
    startTime: Date.now(),
    metrics,
    history: [],
    status: 'running',
    winner: null,
  };
  res.json({ success: true, experiment });
});

app.post('/api/experiment/:id/version', (req, res) => {
  const version = req.body as AdVersion;
  version.id = uuidv4();
  version.createdAt = Date.now();
  version.history = [];
  experiment.versions.push(version);
  experiment.metrics[version.id] = generateInitialMetrics();
  experiment.trafficAllocation[version.id] = 0;
  res.json(version);
});

app.put('/api/experiment/:id/version/:vid', (req, res) => {
  const { vid } = req.params;
  const updates = req.body as Partial<AdVersion>;
  const idx = experiment.versions.findIndex((v) => v.id === vid);
  if (idx === -1) {
    res.status(404).json({ error: 'Version not found' });
    return;
  }
  const snapshot: Partial<AdVersion> = {};
  (Object.keys(updates) as (keyof AdVersion)[]).forEach((key) => {
    if (key !== 'history' && key !== 'id' && key !== 'createdAt') {
      snapshot[key] = experiment.versions[idx][key] as never;
    }
  });
  const historyEntry: VersionHistory = {
    id: uuidv4(),
    timestamp: Date.now(),
    snapshot,
    comment: updates.history?.[0]?.comment || '更新广告素材',
  };
  experiment.versions[idx] = {
    ...experiment.versions[idx],
    ...updates,
    history: [historyEntry, ...experiment.versions[idx].history].slice(0, 50),
  };
  res.json(experiment.versions[idx]);
});

app.post('/api/experiment/:id/version/:vid/rollback', (req, res) => {
  const { vid } = req.params;
  const { historyId, comment } = req.body as {
    historyId: string;
    comment: string;
  };
  const idx = experiment.versions.findIndex((v) => v.id === vid);
  if (idx === -1) {
    res.status(404).json({ error: 'Version not found' });
    return;
  }
  const historyEntry = experiment.versions[idx].history.find(
    (h) => h.id === historyId,
  );
  if (!historyEntry) {
    res.status(404).json({ error: 'History entry not found' });
    return;
  }
  const snapshot: Partial<AdVersion> = {};
  (Object.keys(historyEntry.snapshot) as (keyof AdVersion)[]).forEach((key) => {
    if (key !== 'history' && key !== 'id' && key !== 'createdAt') {
      snapshot[key] = experiment.versions[idx][key] as never;
    }
  });
  experiment.versions[idx] = {
    ...experiment.versions[idx],
    ...historyEntry.snapshot,
    history: [
      {
        id: uuidv4(),
        timestamp: Date.now(),
        snapshot,
        comment: comment || `回滚到历史版本`,
      },
      ...experiment.versions[idx].history,
    ].slice(0, 50),
  };
  res.json(experiment.versions[idx]);
});

app.post('/api/experiment/:id/winner', (req, res) => {
  const { winnerId } = req.body as { winnerId: string };
  experiment.winner = winnerId;
  experiment.status = 'ended';
  res.json({ success: true, winner: winnerId });
});

app.listen(PORT, () => {
  console.log(`Express server running on http://localhost:${PORT}`);
});
