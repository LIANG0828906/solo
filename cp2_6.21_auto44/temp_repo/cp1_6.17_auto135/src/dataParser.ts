export interface DataItem {
  name: string;
  value: number;
}

type DatasetKey = 'economy' | 'population';

const economyData: DataItem[] = [
  { name: '北京', value: 985 },
  { name: '上海', value: 942 },
  { name: '广州', value: 768 },
  { name: '深圳', value: 835 },
  { name: '杭州', value: 612 },
  { name: '成都', value: 548 },
  { name: '武汉', value: 476 },
  { name: '南京', value: 523 },
  { name: '西安', value: 389 },
  { name: '重庆', value: 456 },
  { name: '天津', value: 412 },
  { name: '苏州', value: 687 },
];

const populationData: DataItem[] = [
  { name: '北京', value: 685 },
  { name: '上海', value: 742 },
  { name: '广州', value: 598 },
  { name: '深圳', value: 876 },
  { name: '杭州', value: 423 },
  { name: '成都', value: 534 },
  { name: '武汉', value: 398 },
  { name: '南京', value: 356 },
  { name: '西安', value: 445 },
  { name: '重庆', value: 892 },
  { name: '天津', value: 378 },
  { name: '苏州', value: 512 },
];

const datasets: Record<DatasetKey, DataItem[]> = {
  economy: economyData,
  population: populationData,
};

export function parseData(dataset: DatasetKey = 'economy'): DataItem[] {
  const data = datasets[dataset];
  if (!data) {
    throw new Error(`Unknown dataset: ${dataset}`);
  }
  return data.map((item) => ({
    name: item.name,
    value: Math.max(100, Math.min(1000, item.value)),
  }));
}

export function getAvailableDatasets(): { key: DatasetKey; label: string }[] {
  return [
    { key: 'economy', label: '年度经济数据' },
    { key: 'population', label: '人口密度数据' },
  ];
}

export type { DatasetKey };
