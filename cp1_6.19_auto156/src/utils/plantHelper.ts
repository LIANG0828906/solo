import { v4 as uuidv4 } from 'uuid';
import type { Plant, GrowthLog, Alert, WaterStatus, WaterRecord } from '@/types';

export const generateId = (): string => {
  return uuidv4();
};

export const calculateWaterStatus = (plant: Plant): WaterStatus => {
  const recentLogs = plant.growthLogs
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 3);

  if (recentLogs.length === 0) {
    return 'normal';
  }

  const avgMoisture = recentLogs.reduce((sum, log) => sum + log.soilMoisture, 0) / recentLogs.length;

  let thresholdNormal = 60;
  let thresholdWarning = 40;

  if (plant.waterPreference === 'low') {
    thresholdNormal = 40;
    thresholdWarning = 20;
  } else if (plant.waterPreference === 'high') {
    thresholdNormal = 70;
    thresholdWarning = 50;
  }

  if (avgMoisture >= thresholdNormal) {
    return 'normal';
  } else if (avgMoisture >= thresholdWarning) {
    return 'need-water-soon';
  } else {
    return 'need-water-now';
  }
};

export const detectPestAndDisease = (plant: Plant): Alert[] => {
  const alerts: Alert[] = [];
  const sortedLogs = [...plant.growthLogs].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  if (sortedLogs.length >= 3) {
    const recent3 = sortedLogs.slice(-3);
    const firstLeafCount = recent3[0].leafCount;
    const lastLeafCount = recent3[2].leafCount;

    if (firstLeafCount > 0 && ((firstLeafCount - lastLeafCount) / firstLeafCount) > 0.1) {
      alerts.push({
        id: generateId(),
        plantId: plant.id,
        type: 'disease',
        description: `${plant.name} 连续3天叶片数量减少超过10%，可能存在病虫害。`,
        suggestion: '检查叶片背面是否有虫卵或菌斑，可使用有机杀虫剂或咨询园艺专家。',
        date: new Date().toISOString().split('T')[0],
        resolved: false,
      });
    }
  }

  const latestLog = sortedLogs[sortedLogs.length - 1];
  if (latestLog) {
    if (latestLog.leafColor === 'yellow') {
      alerts.push({
        id: generateId(),
        plantId: plant.id,
        type: 'disease',
        description: `${plant.name} 叶片发黄，可能缺氮或浇水过度。`,
        suggestion: '适量施加氮肥，调整浇水频率，检查土壤排水情况。',
        date: new Date().toISOString().split('T')[0],
        resolved: false,
      });
    } else if (latestLog.leafColor === 'brown') {
      alerts.push({
        id: generateId(),
        plantId: plant.id,
        type: 'disease',
        description: `${plant.name} 叶片出现褐斑，可能是真菌感染。`,
        suggestion: '移除病叶，增加通风，可使用有机杀菌剂。',
        date: new Date().toISOString().split('T')[0],
        resolved: false,
      });
    } else if (latestLog.leafColor === 'spotted') {
      alerts.push({
        id: generateId(),
        plantId: plant.id,
        type: 'pest',
        description: `${plant.name} 叶片出现斑点，可能有虫害。`,
        suggestion: '检查是否有蚜虫、红蜘蛛等害虫，可用肥皂水喷洒或使用生物防治。',
        date: new Date().toISOString().split('T')[0],
        resolved: false,
      });
    }

    if (latestLog.markedAbnormal) {
      alerts.push({
        id: generateId(),
        plantId: plant.id,
        type: 'pest',
        description: `${plant.name} 被标记为异常状态。`,
        suggestion: '仔细观察植物状态，记录异常特征，必要时寻求专业帮助。',
        date: new Date().toISOString().split('T')[0],
        resolved: false,
      });
    }
  }

  return alerts;
};

export const generateWaterNotification = (plant: Plant): string | null => {
  const status = calculateWaterStatus(plant);
  if (status === 'need-water-now') {
    return `⚠️ ${plant.name} 已缺水，请立即浇水！`;
  } else if (status === 'need-water-soon') {
    return `💧 ${plant.name} 即将需要浇水，请做好准备。`;
  }
  return null;
};

export const generateMockGrowthLogs = (days: number = 30): GrowthLog[] => {
  const logs: GrowthLog[] = [];
  const today = new Date();
  let height = 10 + Math.random() * 20;
  let leafCount = 3 + Math.floor(Math.random() * 5);

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);

    height += Math.random() * 2 - 0.3;
    leafCount += Math.floor(Math.random() * 3) - 1;

    logs.push({
      id: generateId(),
      date: date.toISOString().split('T')[0],
      height: Math.max(0, Math.round(height * 10) / 10),
      leafCount: Math.max(0, leafCount),
      soilMoisture: Math.round(20 + Math.random() * 60),
      leafColor: 'green',
      markedAbnormal: false,
    });
  }

  return logs;
};

export const generateMockWaterRecords = (count: number = 5): WaterRecord[] => {
  const records: WaterRecord[] = [];
  const today = new Date();
  const types: ('water' | 'fertilize' | 'prune')[] = ['water', 'fertilize', 'prune'];

  for (let i = count - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - Math.floor(Math.random() * 10));

    records.push({
      id: generateId(),
      date: date.toISOString().split('T')[0],
      type: types[Math.floor(Math.random() * types.length)],
      amount: Math.floor(Math.random() * 500) + 100,
      note: '',
    });
  }

  return records.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
};

export const getCategories = (): string[] => {
  return ['全部', '蔬菜', '花卉', '香草', '果树'];
};

export const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  return `${date.getMonth() + 1}/${date.getDate()}`;
};

export const getOperationTypeColor = (type: string): string => {
  switch (type) {
    case 'water':
      return '#2196F3';
    case 'fertilize':
      return '#FF9800';
    case 'prune':
      return '#9C27B0';
    default:
      return '#757575';
  }
};

export const getOperationTypeName = (type: string): string => {
  switch (type) {
    case 'water':
      return '浇水';
    case 'fertilize':
      return '施肥';
    case 'prune':
      return '修剪';
    default:
      return type;
  }
};
