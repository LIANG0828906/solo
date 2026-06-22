export type StageType = 'origin' | 'processing' | 'logistics' | 'sales';

export interface LocationPoint {
  lat: number;
  lng: number;
  name: string;
  stage: StageType;
  arrivalTime: string;
  departureTime: string;
  personInCharge: string;
}

export interface DetailRecord {
  id: string;
  date: string;
  type: string;
  operator: string;
  [key: string]: any;
}

export interface TimelineNode {
  id: string;
  stage: StageType;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  location: LocationPoint;
  totalHours: number;
  organizations: number;
  temperatureRange: [number, number];
  anomalies: number;
  details: DetailRecord[];
}

export interface BatchData {
  batchId: string;
  productName: string;
  productionDate: string;
  nodes: TimelineNode[];
}

export const stageColors: Record<StageType, string> = {
  origin: '#00B894',
  processing: '#0984E3',
  logistics: '#FDCB6E',
  sales: '#E17055',
};

export const stageNames: Record<StageType, string> = {
  origin: '原料产地',
  processing: '加工阶段',
  logistics: '物流阶段',
  sales: '销售阶段',
};

const mockBatchData: BatchData = {
  batchId: 'FOOD-2024-001234',
  productName: '有机鲜牛奶',
  productionDate: '2024-06-15',
  nodes: [
    {
      id: 'node-1',
      stage: 'origin',
      title: '内蒙古有机牧场',
      description: '原生态有机牧场，奶牛采用散养方式，食用天然牧草',
      startTime: '2024-06-15 06:00:00',
      endTime: '2024-06-15 14:00:00',
      location: {
        lat: 40.8426,
        lng: 111.7519,
        name: '内蒙古呼和浩特有机牧场',
        stage: 'origin',
        arrivalTime: '2024-06-15 06:00:00',
        departureTime: '2024-06-15 14:00:00',
        personInCharge: '张牧民',
      },
      totalHours: 8,
      organizations: 2,
      temperatureRange: [2, 6],
      anomalies: 0,
      details: [
        { id: 'd1', date: '2024-06-15 06:30', type: '健康检查', operator: '李兽医', result: '全部合格' },
        { id: 'd2', date: '2024-06-15 07:00', type: '挤奶操作', operator: '王工人', equipment: '利拉伐挤奶机' },
        { id: 'd3', date: '2024-06-15 08:00', type: '初步检测', operator: '赵检验员', fat: '3.8%', protein: '3.2%' },
        { id: 'd4', date: '2024-06-15 09:00', type: '冷却储存', operator: '陈工人', temperature: '4°C' },
        { id: 'd5', date: '2024-06-15 12:00', type: '冷链车装车', operator: '刘司机', vehicle: '蒙A·88621' },
      ],
    },
    {
      id: 'node-2',
      stage: 'processing',
      title: '北京乳品加工厂',
      description: '现代化无菌加工车间，采用巴氏杀菌工艺，全程质量监控',
      startTime: '2024-06-15 22:00:00',
      endTime: '2024-06-16 10:00:00',
      location: {
        lat: 39.9042,
        lng: 116.4074,
        name: '北京顺义乳品加工厂',
        stage: 'processing',
        arrivalTime: '2024-06-15 22:00:00',
        departureTime: '2024-06-16 10:00:00',
        personInCharge: '王厂长',
      },
      totalHours: 12,
      organizations: 3,
      temperatureRange: [1, 4],
      anomalies: 1,
      details: [
        { id: 'd6', date: '2024-06-15 22:30', type: '设备消毒', operator: '张技工', method: '高温蒸汽消毒', duration: '30分钟' },
        { id: 'd7', date: '2024-06-15 23:00', type: '原料验收', operator: '李检验员', result: '合格' },
        { id: 'd8', date: '2024-06-16 00:00', type: '设备消毒', operator: '张技工', method: '紫外线消毒', duration: '20分钟' },
        { id: 'd9', date: '2024-06-16 01:00', type: '标准化处理', operator: '王技术员', fat: '3.6%' },
        { id: 'd10', date: '2024-06-16 03:00', type: '巴氏杀菌', operator: '陈操作员', temperature: '72°C', duration: '15秒' },
        { id: 'd11', date: '2024-06-16 05:00', type: '设备消毒', operator: '张技工', method: '化学消毒剂', duration: '15分钟' },
        { id: 'd12', date: '2024-06-16 06:00', type: '无菌灌装', operator: '刘工人', line: '2号线' },
        { id: 'd13', date: '2024-06-16 08:00', type: '质量检测', operator: '赵检验员', result: '发现1盒包装瑕疵（已剔除）' },
        { id: 'd14', date: '2024-06-16 09:00', type: '装箱入库', operator: '孙工人', quantity: '5000盒' },
      ],
    },
    {
      id: 'node-3',
      stage: 'logistics',
      title: '冷链运输',
      description: '全程冷链运输，GPS实时追踪，温度全程监控',
      startTime: '2024-06-16 10:30:00',
      endTime: '2024-06-16 18:30:00',
      location: {
        lat: 31.2304,
        lng: 121.4737,
        name: '上海冷链配送中心',
        stage: 'logistics',
        arrivalTime: '2024-06-16 18:30:00',
        departureTime: '2024-06-16 19:00:00',
        personInCharge: '李物流',
      },
      totalHours: 8,
      organizations: 2,
      temperatureRange: [2, 5],
      anomalies: 0,
      details: [
        { id: 'd15', date: '2024-06-16 10:35', type: 'GPS定位', operator: '系统', lat: 39.9042, lng: 116.4074, temp: '3°C' },
        { id: 'd16', date: '2024-06-16 10:40', type: 'GPS定位', operator: '系统', lat: 39.9142, lng: 116.4274, temp: '3°C' },
        { id: 'd17', date: '2024-06-16 10:45', type: 'GPS定位', operator: '系统', lat: 39.9242, lng: 116.4474, temp: '3°C' },
        { id: 'd18', date: '2024-06-16 10:50', type: 'GPS定位', operator: '系统', lat: 39.9342, lng: 116.4674, temp: '3°C' },
        { id: 'd19', date: '2024-06-16 10:55', type: 'GPS定位', operator: '系统', lat: 39.9442, lng: 116.4874, temp: '3°C' },
        { id: 'd20', date: '2024-06-16 11:00', type: 'GPS定位', operator: '系统', lat: 39.9542, lng: 116.5074, temp: '3°C' },
        { id: 'd21', date: '2024-06-16 11:05', type: 'GPS定位', operator: '系统', lat: 39.9642, lng: 116.5274, temp: '3°C' },
        { id: 'd22', date: '2024-06-16 11:10', type: 'GPS定位', operator: '系统', lat: 39.9742, lng: 116.5474, temp: '3°C' },
        { id: 'd23', date: '2024-06-16 11:15', type: 'GPS定位', operator: '系统', lat: 39.9842, lng: 116.5674, temp: '3°C' },
        { id: 'd24', date: '2024-06-16 11:20', type: 'GPS定位', operator: '系统', lat: 39.9942, lng: 116.5874, temp: '3°C' },
        { id: 'd25', date: '2024-06-16 11:25', type: 'GPS定位', operator: '系统', lat: 40.0042, lng: 116.6074, temp: '3°C' },
        { id: 'd26', date: '2024-06-16 11:30', type: 'GPS定位', operator: '系统', lat: 40.0142, lng: 116.6274, temp: '3°C' },
        { id: 'd27', date: '2024-06-16 11:35', type: 'GPS定位', operator: '系统', lat: 40.0242, lng: 116.6474, temp: '3°C' },
        { id: 'd28', date: '2024-06-16 11:40', type: 'GPS定位', operator: '系统', lat: 40.0342, lng: 116.6674, temp: '3°C' },
        { id: 'd29', date: '2024-06-16 11:45', type: 'GPS定位', operator: '系统', lat: 40.0442, lng: 116.6874, temp: '3°C' },
        { id: 'd30', date: '2024-06-16 11:50', type: 'GPS定位', operator: '系统', lat: 40.0542, lng: 116.7074, temp: '3°C' },
        { id: 'd31', date: '2024-06-16 11:55', type: 'GPS定位', operator: '系统', lat: 40.0642, lng: 116.7274, temp: '3°C' },
        { id: 'd32', date: '2024-06-16 12:00', type: 'GPS定位', operator: '系统', lat: 40.0742, lng: 116.7474, temp: '3°C' },
        { id: 'd33', date: '2024-06-16 12:05', type: 'GPS定位', operator: '系统', lat: 40.0842, lng: 116.7674, temp: '3°C' },
        { id: 'd34', date: '2024-06-16 12:10', type: 'GPS定位', operator: '系统', lat: 40.0942, lng: 116.7874, temp: '3°C' },
        { id: 'd35', date: '2024-06-16 12:15', type: 'GPS定位', operator: '系统', lat: 40.1042, lng: 116.8074, temp: '3°C' },
        { id: 'd36', date: '2024-06-16 12:20', type: 'GPS定位', operator: '系统', lat: 40.1142, lng: 116.8274, temp: '3°C' },
        { id: 'd37', date: '2024-06-16 12:25', type: 'GPS定位', operator: '系统', lat: 40.1242, lng: 116.8474, temp: '3°C' },
        { id: 'd38', date: '2024-06-16 12:30', type: 'GPS定位', operator: '系统', lat: 40.1342, lng: 116.8674, temp: '3°C' },
        { id: 'd39', date: '2024-06-16 18:30', type: '到达签收', operator: '周仓管', status: '完好' },
      ],
    },
    {
      id: 'node-4',
      stage: 'sales',
      title: '上海连锁超市',
      description: '高端精品超市，冷藏陈列，保证产品新鲜度',
      startTime: '2024-06-16 20:00:00',
      endTime: '2024-06-19 12:00:00',
      location: {
        lat: 31.2304,
        lng: 121.4737,
        name: '上海浦东新区精品超市',
        stage: 'sales',
        arrivalTime: '2024-06-16 20:00:00',
        departureTime: '2024-06-19 12:00:00',
        personInCharge: '陈店长',
      },
      totalHours: 64,
      organizations: 1,
      temperatureRange: [2, 6],
      anomalies: 0,
      details: [
        { id: 'd40', date: '2024-06-16 20:00', type: '到货验收', operator: '周收货员', quantity: '5000盒', result: '合格' },
        { id: 'd41', date: '2024-06-16 20:30', type: '入库冷藏', operator: '吴仓管', temperature: '4°C' },
        { id: 'd42', date: '2024-06-17 08:00', type: '陈列上架', operator: '郑理货员', position: 'A区冷藏柜' },
        { id: 'd43', date: '2024-06-17 14:00', type: '温度巡检', operator: '王质检员', temperature: '3.5°C' },
        { id: 'd44', date: '2024-06-18 09:00', type: '销售记录', operator: '收银员', sold: '2800盒' },
        { id: 'd45', date: '2024-06-18 15:00', type: '温度巡检', operator: '王质检员', temperature: '4°C' },
        { id: 'd46', date: '2024-06-19 10:00', type: '销售记录', operator: '收银员', sold: '2200盒（售罄）' },
      ],
    },
  ],
};

export function getBatchData(batchId: string): BatchData | null {
  if (batchId === mockBatchData.batchId || batchId === '123456' || batchId === 'test') {
    return mockBatchData;
  }
  return null;
}

export function calculateRouteDuration(startTime: string, endTime: string): string {
  const start = new Date(startTime).getTime();
  const end = new Date(endTime).getTime();
  const hours = Math.floor((end - start) / (1000 * 60 * 60));
  const minutes = Math.floor(((end - start) % (1000 * 60 * 60)) / (1000 * 60));
  return `${hours}小时${minutes}分钟`;
}

export default mockBatchData;
