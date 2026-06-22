import express from 'express';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const PORT = 3001;

app.use(express.json());

interface AdVersion {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  ctaText: string;
  ctaLink: string;
  trafficPercentage: number;
  createdAt: number;
  history: VersionHistory[];
}

interface VersionHistory {
  id: string;
  timestamp: number;
  data: Partial<AdVersion>;
  note: string;
}

interface Metrics {
  impressions: number;
  clicks: number;
  conversions: number;
}

interface ExperimentState {
  id: string;
  name: string;
  status: 'draft' | 'running' | 'completed';
  versions: AdVersion[];
  metrics: Record<string, Metrics>;
  historyData: Record<string, { timestamp: number; metrics: Metrics }[]>;
  startTime: number | null;
  durationHours: number;
}

let experiment: ExperimentState = createInitialExperiment();

function createInitialExperiment(): ExperimentState {
  const versionA: AdVersion = {
    id: uuidv4(),
    title: '夏季限时特惠 - 全场5折起',
    description: '精选商品限时折扣，立即抢购享受超值优惠！数量有限，先到先得。',
    imageUrl: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400',
    ctaText: '立即抢购',
    ctaLink: 'https://example.com/sale',
    trafficPercentage: 50,
    createdAt: Date.now(),
    history: []
  };
  const versionB: AdVersion = {
    id: uuidv4(),
    title: '新品上市 - 会员专享体验',
    description: '全新产品发布，会员抢先体验，注册即享专属折扣码。',
    imageUrl: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=400',
    ctaText: '免费体验',
    ctaLink: 'https://example.com/new',
    trafficPercentage: 50,
    createdAt: Date.now(),
    history: []
  };

  return {
    id: uuidv4(),
    name: '夏季促销活动测试',
    status: 'draft',
    versions: [versionA, versionB],
    metrics: {
      [versionA.id]: { impressions: 0, clicks: 0, conversions: 0 },
      [versionB.id]: { impressions: 0, clicks: 0, conversions: 0 }
    },
    historyData: {},
    startTime: null,
    durationHours: 24
  };
}

function simulateMetricsUpdate() {
  if (experiment.status !== 'running') return;

  experiment.versions.forEach(version => {
    const trafficWeight = version.trafficPercentage / 100;
    const baseImpressions = Math.floor(Math.random() * 100 * trafficWeight) + 10;
    experiment.metrics[version.id].impressions += baseImpressions;

    const clickRate = 0.02 + Math.random() * 0.08;
    const newClicks = Math.floor(baseImpressions * clickRate);
    experiment.metrics[version.id].clicks += newClicks;

    const conversionRate = 0.05 + Math.random() * 0.15;
    const newConversions = Math.floor(newClicks * conversionRate);
    experiment.metrics[version.id].conversions += newConversions;

    if (!experiment.historyData[version.id]) {
      experiment.historyData[version.id] = [];
    }
    experiment.historyData[version.id].push({
      timestamp: Date.now(),
      metrics: { ...experiment.metrics[version.id] }
    });

    if (experiment.historyData[version.id].length > 100) {
      experiment.historyData[version.id] = experiment.historyData[version.id].slice(-100);
    }
  });
}

setInterval(simulateMetricsUpdate, 10000);

app.get('/api/experiment/:id', (req, res) => {
  const now = Date.now();
  if (experiment.status === 'running' && experiment.startTime) {
    const elapsed = now - experiment.startTime;
    const durationMs = experiment.durationHours * 60 * 60 * 1000;
    if (elapsed >= durationMs) {
      experiment.status = 'completed';
    }
  }
  res.json(experiment);
});

app.post('/api/experiment', (req, res) => {
  const { versions, durationHours, name } = req.body;
  experiment = {
    id: uuidv4(),
    name: name || '新实验',
    status: 'running',
    versions: versions.map((v: any) => ({
      ...v,
      id: uuidv4(),
      createdAt: Date.now(),
      history: []
    })),
    metrics: {},
    historyData: {},
    startTime: Date.now(),
    durationHours: durationHours || 24
  };

  experiment.versions.forEach(v => {
    experiment.metrics[v.id] = { impressions: 0, clicks: 0, conversions: 0 };
    experiment.historyData[v.id] = [];
  });

  res.json(experiment);
});

app.post('/api/experiment/:id/publish', (req, res) => {
  const { versionIds, trafficPercentages, durationHours } = req.body;
  const selectedVersions = experiment.versions.filter(v => versionIds.includes(v.id));

  selectedVersions.forEach((v, i) => {
    v.trafficPercentage = trafficPercentages[i];
  });

  experiment.versions = selectedVersions;
  experiment.status = 'running';
  experiment.startTime = Date.now();
  experiment.durationHours = durationHours || 24;

  experiment.versions.forEach(v => {
    if (!experiment.metrics[v.id]) {
      experiment.metrics[v.id] = { impressions: 0, clicks: 0, conversions: 0 };
    }
    if (!experiment.historyData[v.id]) {
      experiment.historyData[v.id] = [];
    }
  });

  res.json(experiment);
});

app.post('/api/versions', (req, res) => {
  const newVersion: AdVersion = {
    id: uuidv4(),
    title: req.body.title || '新广告版本',
    description: req.body.description || '',
    imageUrl: req.body.imageUrl || '',
    ctaText: req.body.ctaText || '了解更多',
    ctaLink: req.body.ctaLink || '#',
    trafficPercentage: 0,
    createdAt: Date.now(),
    history: []
  };
  experiment.versions.push(newVersion);
  experiment.metrics[newVersion.id] = { impressions: 0, clicks: 0, conversions: 0 };
  experiment.historyData[newVersion.id] = [];
  res.json(newVersion);
});

app.put('/api/versions/:id', (req, res) => {
  const version = experiment.versions.find(v => v.id === req.params.id);
  if (!version) {
    return res.status(404).json({ error: '版本不存在' });
  }

  version.history.push({
    id: uuidv4(),
    timestamp: Date.now(),
    data: {
      title: version.title,
      description: version.description,
      imageUrl: version.imageUrl,
      ctaText: version.ctaText,
      ctaLink: version.ctaLink
    },
    note: '编辑修改'
  });

  Object.assign(version, req.body);
  res.json(version);
});

app.delete('/api/versions/:id', (req, res) => {
  const idx = experiment.versions.findIndex(v => v.id === req.params.id);
  if (idx === -1) {
    return res.status(404).json({ error: '版本不存在' });
  }
  experiment.versions.splice(idx, 1);
  delete experiment.metrics[req.params.id];
  delete experiment.historyData[req.params.id];
  res.json({ success: true });
});

app.post('/api/versions/:id/copy', (req, res) => {
  const source = experiment.versions.find(v => v.id === req.params.id);
  if (!source) {
    return res.status(404).json({ error: '版本不存在' });
  }

  const newVersion: AdVersion = {
    id: uuidv4(),
    title: source.title + ' (副本)',
    description: source.description,
    imageUrl: source.imageUrl,
    ctaText: source.ctaText,
    ctaLink: source.ctaLink,
    trafficPercentage: 0,
    createdAt: Date.now(),
    history: []
  };

  experiment.versions.push(newVersion);
  experiment.metrics[newVersion.id] = { impressions: 0, clicks: 0, conversions: 0 };
  experiment.historyData[newVersion.id] = [];
  res.json(newVersion);
});

app.post('/api/versions/:id/rollback', (req, res) => {
  const { historyId } = req.body;
  const version = experiment.versions.find(v => v.id === req.params.id);
  if (!version) {
    return res.status(404).json({ error: '版本不存在' });
  }

  const historyEntry = version.history.find(h => h.id === historyId);
  if (!historyEntry) {
    return res.status(404).json({ error: '历史版本不存在' });
  }

  version.history.push({
    id: uuidv4(),
    timestamp: Date.now(),
    data: {
      title: version.title,
      description: version.description,
      imageUrl: version.imageUrl,
      ctaText: version.ctaText,
      ctaLink: version.ctaLink
    },
    note: `回滚到历史版本`
  });

  Object.assign(version, historyEntry.data);
  res.json(version);
});

app.post('/api/reset', (_req, res) => {
  experiment = createInitialExperiment();
  res.json({ success: true, experiment });
});

app.listen(PORT, () => {
  console.log(`Express 服务器运行在 http://localhost:${PORT}`);
});
