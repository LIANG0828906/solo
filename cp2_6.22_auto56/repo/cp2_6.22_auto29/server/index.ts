import express from 'express';
import { v4 as uuidv4 } from 'uuid';

const app = express();
app.use(express.json({ limit: '10mb' }));

interface AdVersion {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  ctaText: string;
  ctaLink: string;
  history: HistoryEntry[];
  createdAt: number;
  updatedAt: number;
}

interface HistoryEntry {
  id: string;
  timestamp: number;
  snapshot: {
    title: string;
    description: string;
    imageUrl: string;
    ctaText: string;
    ctaLink: string;
  };
  note?: string;
}

interface VersionMetrics {
  impressions: number;
  clicks: number;
  conversions: number;
  ctr: number;
  cvr: number;
}

interface MetricsHistoryPoint {
  timestamp: number;
  impressions: number;
  clicks: number;
  conversions: number;
  ctr: number;
  cvr: number;
}

interface Experiment {
  id: string;
  versionIds: string[];
  trafficAllocation: Record<string, number>;
  startDate: number;
  endDate: number;
  status: 'draft' | 'running' | 'completed';
  metrics: Record<string, VersionMetrics>;
  metricsHistory: Record<string, MetricsHistoryPoint[]>;
  winner?: string;
}

let versions: Map<string, AdVersion> = new Map();
let experiment: Experiment | null = null;
let simulationInterval: ReturnType<typeof setInterval> | null = null;
let historyInterval: ReturnType<typeof setInterval> | null = null;
let completionCheckInterval: ReturnType<typeof setInterval> | null = null;

function createVersion(data: Omit<AdVersion, 'id' | 'history' | 'createdAt' | 'updatedAt'>): AdVersion {
  const now = Date.now();
  const version: AdVersion = {
    id: uuidv4(),
    ...data,
    history: [],
    createdAt: now,
    updatedAt: now,
  };
  version.history.push({
    id: uuidv4(),
    timestamp: now,
    snapshot: {
      title: data.title,
      description: data.description,
      imageUrl: data.imageUrl,
      ctaText: data.ctaText,
      ctaLink: data.ctaLink,
    },
    note: '初始版本',
  });
  return version;
}

function initSampleData() {
  const sampleVersions = [
    {
      title: '限时优惠 - 全场5折起',
      description: '精选商品低至5折，限时抢购，先到先得！立即点击享受独家折扣。',
      imageUrl: 'https://trae-api-cn.mchort.guru/api/ide/v1/text_to_image?prompt=vibrant%20red%20sale%20banner%20with%20discount%20tags%20and%20shopping%20bags%2C%20modern%20marketing&image_size=landscape_16_9',
      ctaText: '立即抢购',
      ctaLink: 'https://example.com/sale',
    },
    {
      title: '新品首发 - 体验科技魅力',
      description: '全新智能产品线震撼发布，前沿科技触手可及，开启智慧生活新篇章。',
      imageUrl: 'https://trae-api-cn.mchort.guru/api/ide/v1/text_to_image?prompt=sleek%20tech%20product%20launch%20banner%20with%20blue%20neon%20glow%20and%20futuristic%20design&image_size=landscape_16_9',
      ctaText: '了解更多',
      ctaLink: 'https://example.com/new',
    },
    {
      title: '会员专属 - 尊享特权',
      description: '成为VIP会员，解锁专属折扣、优先购买权和个性化推荐，尊享不一样的购物体验。',
      imageUrl: 'https://trae-api-cn.mchort.guru/api/ide/v1/text_to_image?prompt=premium%20gold%20VIP%20membership%20card%20with%20elegant%20design%20and%20luxury%20background&image_size=landscape_16_9',
      ctaText: '加入会员',
      ctaLink: 'https://example.com/vip',
    },
  ];

  sampleVersions.forEach((v) => {
    const version = createVersion(v);
    versions.set(version.id, version);
  });
}

function startSimulation() {
  if (simulationInterval) clearInterval(simulationInterval);
  if (historyInterval) clearInterval(historyInterval);
  if (completionCheckInterval) clearInterval(completionCheckInterval);

  simulationInterval = setInterval(() => {
    if (!experiment || experiment.status !== 'running') return;

    experiment.versionIds.forEach((vid) => {
      const allocation = experiment.trafficAllocation[vid] || 0;
      const newImpressions = Math.floor(Math.random() * 30 * (allocation / 100)) + 5;
      const ctr = 0.02 + Math.random() * 0.04;
      const cvr = 0.005 + Math.random() * 0.025;

      const m = experiment.metrics[vid];
      m.impressions += newImpressions;
      m.clicks += Math.floor(newImpressions * ctr);
      const newClicks = Math.floor(newImpressions * ctr);
      m.conversions += Math.floor(newClicks * cvr);
      m.ctr = m.impressions > 0 ? m.clicks / m.impressions : 0;
      m.cvr = m.clicks > 0 ? m.conversions / m.clicks : 0;
    });
  }, 2000);

  historyInterval = setInterval(() => {
    if (!experiment || experiment.status !== 'running') return;
    const now = Date.now();
    experiment.versionIds.forEach((vid) => {
      const m = experiment.metrics[vid];
      if (!experiment!.metricsHistory[vid]) {
        experiment!.metricsHistory[vid] = [];
      }
      experiment!.metricsHistory[vid].push({
        timestamp: now,
        impressions: m.impressions,
        clicks: m.clicks,
        conversions: m.conversions,
        ctr: m.ctr,
        cvr: m.cvr,
      });
    });
  }, 10000);

  completionCheckInterval = setInterval(() => {
    if (!experiment || experiment.status !== 'running') return;
    if (Date.now() >= experiment.endDate) {
      experiment.status = 'completed';
      let bestCvr = -1;
      let winnerId = '';
      experiment.versionIds.forEach((vid) => {
        const m = experiment.metrics[vid];
        if (m.cvr > bestCvr) {
          bestCvr = m.cvr;
          winnerId = vid;
        }
      });
      experiment.winner = winnerId;
      if (simulationInterval) clearInterval(simulationInterval);
      if (historyInterval) clearInterval(historyInterval);
    }
  }, 5000);
}

initSampleData();

app.get('/api/versions', (_req, res) => {
  res.json(Array.from(versions.values()));
});

app.post('/api/versions', (req, res) => {
  const { title, description, imageUrl, ctaText, ctaLink } = req.body;
  if (!title || !ctaText) {
    res.status(400).json({ error: '标题和CTA文案为必填项' });
    return;
  }
  const version = createVersion({
    title,
    description: description || '',
    imageUrl: imageUrl || '',
    ctaText,
    ctaLink: ctaLink || '',
  });
  versions.set(version.id, version);
  res.json(version);
});

app.put('/api/versions/:id', (req, res) => {
  const { id } = req.params;
  const version = versions.get(id);
  if (!version) {
    res.status(404).json({ error: '版本未找到' });
    return;
  }
  const { title, description, imageUrl, ctaText, ctaLink } = req.body;
  const now = Date.now();
  const snapshot = {
    title: title ?? version.title,
    description: description ?? version.description,
    imageUrl: imageUrl ?? version.imageUrl,
    ctaText: ctaText ?? version.ctaText,
    ctaLink: ctaLink ?? version.ctaLink,
  };

  const changed =
    snapshot.title !== version.title ||
    snapshot.description !== version.description ||
    snapshot.imageUrl !== version.imageUrl ||
    snapshot.ctaText !== version.ctaText ||
    snapshot.ctaLink !== version.ctaLink;

  if (changed) {
    version.history.push({
      id: uuidv4(),
      timestamp: now,
      snapshot: { ...version },
      note: '手动编辑',
    });
  }

  Object.assign(version, snapshot, { updatedAt: now });
  versions.set(id, version);
  res.json(version);
});

app.delete('/api/versions/:id', (req, res) => {
  const { id } = req.params;
  if (!versions.has(id)) {
    res.status(404).json({ error: '版本未找到' });
    return;
  }
  versions.delete(id);
  res.json({ success: true });
});

app.post('/api/versions/:id/duplicate', (req, res) => {
  const { id } = req.params;
  const source = versions.get(id);
  if (!source) {
    res.status(404).json({ error: '版本未找到' });
    return;
  }
  const dup = createVersion({
    title: source.title + ' (副本)',
    description: source.description,
    imageUrl: source.imageUrl,
    ctaText: source.ctaText,
    ctaLink: source.ctaLink,
  });
  versions.set(dup.id, dup);
  res.json(dup);
});

app.post('/api/versions/:id/rollback', (req, res) => {
  const { id } = req.params;
  const version = versions.get(id);
  if (!version) {
    res.status(404).json({ error: '版本未找到' });
    return;
  }
  const { historyEntryId, note } = req.body;
  const entry = version.history.find((h) => h.id === historyEntryId);
  if (!entry) {
    res.status(404).json({ error: '历史记录未找到' });
    return;
  }

  version.history.push({
    id: uuidv4(),
    timestamp: Date.now(),
    snapshot: {
      title: version.title,
      description: version.description,
      imageUrl: version.imageUrl,
      ctaText: version.ctaText,
      ctaLink: version.ctaLink,
    },
    note: note || `回滚到历史版本`,
  });

  Object.assign(version, entry.snapshot, { updatedAt: Date.now() });
  versions.set(id, version);
  res.json(version);
});

app.post('/api/experiment', (req, res) => {
  const { versionIds, trafficAllocation, durationHours } = req.body;

  if (!versionIds || versionIds.length < 2 || versionIds.length > 5) {
    res.status(400).json({ error: '广告组须包含2-5个版本' });
    return;
  }

  for (const vid of versionIds) {
    if (!versions.has(vid)) {
      res.status(400).json({ error: `版本 ${vid} 不存在` });
      return;
    }
  }

  const totalAllocation = versionIds.reduce((sum: number, vid: string) => sum + (trafficAllocation[vid] || 0), 0);
  if (Math.abs(totalAllocation - 100) > 1) {
    res.status(400).json({ error: '流量分配比例之和须为100%' });
    return;
  }

  if (experiment && experiment.status === 'running') {
    res.status(400).json({ error: '已有实验正在运行，请先结束或重置' });
    return;
  }

  const now = Date.now();
  const hours = durationHours || 1;
  const metrics: Record<string, VersionMetrics> = {};
  const metricsHistory: Record<string, MetricsHistoryPoint[]> = {};

  versionIds.forEach((vid: string) => {
    metrics[vid] = { impressions: 0, clicks: 0, conversions: 0, ctr: 0, cvr: 0 };
    metricsHistory[vid] = [{
      timestamp: now,
      impressions: 0,
      clicks: 0,
      conversions: 0,
      ctr: 0,
      cvr: 0,
    }];
  });

  experiment = {
    id: uuidv4(),
    versionIds,
    trafficAllocation,
    startDate: now,
    endDate: now + hours * 3600 * 1000,
    status: 'running',
    metrics,
    metricsHistory,
  };

  startSimulation();
  res.json(experiment);
});

app.get('/api/experiment/:id', (req, res) => {
  if (!experiment || experiment.id !== req.params.id) {
    res.status(404).json({ error: '实验未找到' });
    return;
  }

  const enrichedVersionIds = experiment.versionIds.filter((vid) => versions.has(vid));
  const versionData = enrichedVersionIds.map((vid) => ({
    ...versions.get(vid),
    metrics: experiment.metrics[vid],
  }));

  res.json({
    ...experiment,
    versionData,
  });
});

app.post('/api/experiment/:id/select-winner', (req, res) => {
  if (!experiment || experiment.id !== req.params.id) {
    res.status(404).json({ error: '实验未找到' });
    return;
  }
  const { versionId } = req.body;
  if (!experiment.versionIds.includes(versionId)) {
    res.status(400).json({ error: '该版本不在此实验中' });
    return;
  }
  experiment.winner = versionId;
  experiment.status = 'completed';
  res.json(experiment);
});

app.post('/api/reset', (_req, res) => {
  if (simulationInterval) clearInterval(simulationInterval);
  if (historyInterval) clearInterval(historyInterval);
  if (completionCheckInterval) clearInterval(completionCheckInterval);
  simulationInterval = null;
  historyInterval = null;
  completionCheckInterval = null;
  experiment = null;
  versions.clear();
  initSampleData();
  res.json({ success: true, message: '所有数据已重置' });
});

app.listen(3002, () => {
  console.log('Express server running on http://localhost:3002');
});
