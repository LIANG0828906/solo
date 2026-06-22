import { v4 as uuidv4 } from 'uuid';
import type { AdVersion, Experiment, VersionMetrics, MetricsHistoryPoint, HistoryEntry } from '../types';

const STORAGE_KEYS = {
  VERSIONS: 'ab_lab_versions',
  EXPERIMENT: 'ab_lab_experiment',
  EVENTS: 'ab_lab_events',
};

function getFromStorage<T>(key: string, fallback: T): T {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : fallback;
  } catch {
    return fallback;
  }
}

function saveToStorage(key: string, data: any) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {
    // ignore
  }
}

export function getVersions(): AdVersion[] {
  return getFromStorage<AdVersion[]>(STORAGE_KEYS.VERSIONS, []);
}

export function saveVersions(versions: AdVersion[]) {
  saveToStorage(STORAGE_KEYS.VERSIONS, versions);
}

export function createLocalVersion(data: Omit<AdVersion, 'id' | 'history' | 'createdAt' | 'updatedAt'>): AdVersion {
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

export function addVersion(version: AdVersion) {
  const versions = getVersions();
  versions.push(version);
  saveVersions(versions);
}

export function updateVersion(id: string, updates: Partial<AdVersion>) {
  const versions = getVersions();
  const idx = versions.findIndex((v) => v.id === id);
  if (idx === -1) return null;

  const v = versions[idx];
  const now = Date.now();
  const newSnapshot = {
    title: updates.title ?? v.title,
    description: updates.description ?? v.description,
    imageUrl: updates.imageUrl ?? v.imageUrl,
    ctaText: updates.ctaText ?? v.ctaText,
    ctaLink: updates.ctaLink ?? v.ctaLink,
  };

  const changed =
    newSnapshot.title !== v.title ||
    newSnapshot.description !== v.description ||
    newSnapshot.imageUrl !== v.imageUrl ||
    newSnapshot.ctaText !== v.ctaText ||
    newSnapshot.ctaLink !== v.ctaLink;

  if (changed) {
    v.history.push({
      id: uuidv4(),
      timestamp: now,
      snapshot: {
        title: v.title,
        description: v.description,
        imageUrl: v.imageUrl,
        ctaText: v.ctaText,
        ctaLink: v.ctaLink,
      },
      note: '手动编辑',
    });
  }

  Object.assign(v, newSnapshot, { updatedAt: now });
  versions[idx] = v;
  saveVersions(versions);
  return v;
}

export function deleteVersion(id: string) {
  const versions = getVersions().filter((v) => v.id !== id);
  saveVersions(versions);
}

export function duplicateVersion(id: string): AdVersion | null {
  const versions = getVersions();
  const source = versions.find((v) => v.id === id);
  if (!source) return null;
  const dup = createLocalVersion({
    title: source.title + ' (副本)',
    description: source.description,
    imageUrl: source.imageUrl,
    ctaText: source.ctaText,
    ctaLink: source.ctaLink,
  });
  versions.push(dup);
  saveVersions(versions);
  return dup;
}

export function rollbackToHistory(versionId: string, historyEntryId: string, note?: string): AdVersion | null {
  const versions = getVersions();
  const idx = versions.findIndex((v) => v.id === versionId);
  if (idx === -1) return null;
  const v = versions[idx];
  const entry = v.history.find((h) => h.id === historyEntryId);
  if (!entry) return null;

  const now = Date.now();
  v.history.push({
    id: uuidv4(),
    timestamp: now,
    snapshot: {
      title: v.title,
      description: v.description,
      imageUrl: v.imageUrl,
      ctaText: v.ctaText,
      ctaLink: v.ctaLink,
    },
    note: note || `回滚到历史版本`,
  });

  Object.assign(v, entry.snapshot, { updatedAt: now });
  versions[idx] = v;
  saveVersions(versions);
  return v;
}

export function getExperiment(): Experiment | null {
  return getFromStorage<Experiment | null>(STORAGE_KEYS.EXPERIMENT, null);
}

export function saveExperiment(experiment: Experiment) {
  saveToStorage(STORAGE_KEYS.EXPERIMENT, experiment);
}

export function createExperiment(
  versionIds: string[],
  trafficAllocation: Record<string, number>,
  durationHours: number
): Experiment {
  const now = Date.now();
  const metrics: Record<string, VersionMetrics> = {};
  const metricsHistory: Record<string, MetricsHistoryPoint[]> = {};

  versionIds.forEach((vid) => {
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

  const experiment: Experiment = {
    id: uuidv4(),
    versionIds,
    trafficAllocation,
    startDate: now,
    endDate: now + durationHours * 3600 * 1000,
    status: 'running',
    metrics,
    metricsHistory,
  };

  saveExperiment(experiment);
  return experiment;
}

export function selectWinner(experimentId: string, versionId: string): Experiment | null {
  const exp = getExperiment();
  if (!exp || exp.id !== experimentId) return null;
  exp.winner = versionId;
  exp.status = 'completed';
  saveExperiment(exp);
  return exp;
}

export function allocateVersion(experiment: Experiment): string {
  const rand = Math.random() * 100;
  let cumulative = 0;
  for (const vid of experiment.versionIds) {
    cumulative += experiment.trafficAllocation[vid] || 0;
    if (rand <= cumulative) return vid;
  }
  return experiment.versionIds[experiment.versionIds.length - 1];
}

export function recordImpression(versionId: string) {
  const exp = getExperiment();
  if (!exp || exp.status !== 'running') return;
  if (!exp.metrics[versionId]) return;

  const m = exp.metrics[versionId];
  m.impressions += 1;
  m.ctr = m.impressions > 0 ? m.clicks / m.impressions : 0;
  m.cvr = m.clicks > 0 ? m.conversions / m.clicks : 0;

  saveExperiment(exp);
}

export function recordClick(versionId: string) {
  const exp = getExperiment();
  if (!exp || exp.status !== 'running') return;
  if (!exp.metrics[versionId]) return;

  const m = exp.metrics[versionId];
  m.clicks += 1;
  m.ctr = m.impressions > 0 ? m.clicks / m.impressions : 0;
  m.cvr = m.clicks > 0 ? m.conversions / m.clicks : 0;

  saveExperiment(exp);
}

export function recordConversion(versionId: string) {
  const exp = getExperiment();
  if (!exp || exp.status !== 'running') return;
  if (!exp.metrics[versionId]) return;

  const m = exp.metrics[versionId];
  m.conversions += 1;
  m.ctr = m.impressions > 0 ? m.clicks / m.impressions : 0;
  m.cvr = m.clicks > 0 ? m.conversions / m.clicks : 0;

  saveExperiment(exp);
}

let simInterval: ReturnType<typeof setInterval> | null = null;
let historyInterval: ReturnType<typeof setInterval> | null = null;

export function startLocalSimulation() {
  if (simInterval) clearInterval(simInterval);
  if (historyInterval) clearInterval(historyInterval);

  simInterval = setInterval(() => {
    const exp = getExperiment();
    if (!exp || exp.status !== 'running') return;

    exp.versionIds.forEach((vid) => {
      const allocation = exp.trafficAllocation[vid] || 0;
      const newImpressions = Math.floor(Math.random() * 10 * (allocation / 100)) + 1;
      const ctr = 0.02 + Math.random() * 0.05;
      const cvr = 0.01 + Math.random() * 0.03;

      const m = exp.metrics[vid];
      m.impressions += newImpressions;
      const newClicks = Math.floor(newImpressions * ctr);
      m.clicks += newClicks;
      m.conversions += Math.floor(newClicks * cvr);
      m.ctr = m.impressions > 0 ? m.clicks / m.impressions : 0;
      m.cvr = m.clicks > 0 ? m.conversions / m.clicks : 0;
    });

    saveExperiment(exp);
  }, 2000);

  historyInterval = setInterval(() => {
    const exp = getExperiment();
    if (!exp || exp.status !== 'running') return;
    const now = Date.now();
    exp.versionIds.forEach((vid) => {
      const m = exp.metrics[vid];
      if (!exp.metricsHistory[vid]) {
        exp.metricsHistory[vid] = [];
      }
      exp.metricsHistory[vid].push({
        timestamp: now,
        impressions: m.impressions,
        clicks: m.clicks,
        conversions: m.conversions,
        ctr: m.ctr,
        cvr: m.cvr,
      });
    });
    saveExperiment(exp);

    if (now >= exp.endDate) {
      exp.status = 'completed';
      let bestCvr = -1;
      let winnerId = '';
      exp.versionIds.forEach((vid) => {
        const m = exp.metrics[vid];
        if (m.cvr > bestCvr) {
          bestCvr = m.cvr;
          winnerId = vid;
        }
      });
      exp.winner = winnerId;
      saveExperiment(exp);
      stopLocalSimulation();
    }
  }, 10000);
}

export function stopLocalSimulation() {
  if (simInterval) {
    clearInterval(simInterval);
    simInterval = null;
  }
  if (historyInterval) {
    clearInterval(historyInterval);
    historyInterval = null;
  }
}

export function resetAllLocalData() {
  stopLocalSimulation();
  localStorage.removeItem(STORAGE_KEYS.VERSIONS);
  localStorage.removeItem(STORAGE_KEYS.EXPERIMENT);
  localStorage.removeItem(STORAGE_KEYS.EVENTS);
}

export function initSampleLocalData() {
  const existing = getVersions();
  if (existing.length > 0) return;

  const sampleData = [
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

  const versions = sampleData.map((d) => createLocalVersion(d));
  saveVersions(versions);
}
