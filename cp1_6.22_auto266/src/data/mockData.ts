export interface PipelineNode {
  id: string;
  x: number;
  y: number;
  z: number;
  name: string;
  depth: number;
}

export interface PipelineSegment {
  id: string;
  fromNode: string;
  toNode: string;
  diameter: number;
  material: string;
  isAbnormal: boolean;
  status: string;
}

export interface Pipeline {
  id: string;
  name: string;
  type: 'water' | 'gas' | 'power' | 'communication' | 'drainage';
  color: string;
  nodes: PipelineNode[];
  segments: PipelineSegment[];
}

export const PIPELINE_COLORS: Record<string, string> = {
  water: '#4A90D9',
  gas: '#E67E22',
  power: '#F1C40F',
  communication: '#2ECC71',
  drainage: '#9B59B6',
};

export const PIPELINE_TYPE_NAMES: Record<string, string> = {
  water: '给水',
  gas: '燃气',
  power: '电力',
  communication: '通信',
  drainage: '排水',
};

export const mockPipelines: Pipeline[] = [
  {
    id: 'water-1',
    name: '给水管线A',
    type: 'water',
    color: PIPELINE_COLORS.water,
    nodes: [
      { id: 'w-n1', x: -15, y: -2, z: -10, name: '水源泵站', depth: 2 },
      { id: 'w-n2', x: -8, y: -2.5, z: -5, name: '阀门井1号', depth: 2.5 },
      { id: 'w-n3', x: 0, y: -3, z: 0, name: '分流水井', depth: 3 },
      { id: 'w-n4', x: 8, y: -2.8, z: 5, name: '阀门井2号', depth: 2.8 },
      { id: 'w-n5', x: 15, y: -2.2, z: 10, name: '用户接入点', depth: 2.2 },
      { id: 'w-n6', x: 12, y: -3.5, z: -8, name: '消防栓节点', depth: 3.5 },
    ],
    segments: [
      { id: 'w-s1', fromNode: 'w-n1', toNode: 'w-n2', diameter: 0.5, material: '球墨铸铁', isAbnormal: false, status: '正常' },
      { id: 'w-s2', fromNode: 'w-n2', toNode: 'w-n3', diameter: 0.5, material: '球墨铸铁', isAbnormal: true, status: '异常，需检修' },
      { id: 'w-s3', fromNode: 'w-n3', toNode: 'w-n4', diameter: 0.4, material: '球墨铸铁', isAbnormal: false, status: '正常' },
      { id: 'w-s4', fromNode: 'w-n4', toNode: 'w-n5', diameter: 0.3, material: 'PE管', isAbnormal: false, status: '正常' },
      { id: 'w-s5', fromNode: 'w-n3', toNode: 'w-n6', diameter: 0.25, material: '镀锌钢管', isAbnormal: false, status: '正常' },
    ],
  },
  {
    id: 'gas-1',
    name: '燃气管线B',
    type: 'gas',
    color: PIPELINE_COLORS.gas,
    nodes: [
      { id: 'g-n1', x: -12, y: -1.5, z: 8, name: '燃气调压站', depth: 1.5 },
      { id: 'g-n2', x: -5, y: -1.8, z: 3, name: '阀门井A', depth: 1.8 },
      { id: 'g-n3', x: 2, y: -2, z: -2, name: '流量计节点', depth: 2 },
      { id: 'g-n4', x: 10, y: -1.6, z: -6, name: '阀门井B', depth: 1.6 },
      { id: 'g-n5', x: 18, y: -2.2, z: -10, name: '小区接入点', depth: 2.2 },
      { id: 'g-n6', x: 5, y: -2.5, z: 8, name: '工业用户节点', depth: 2.5 },
      { id: 'g-n7', x: -3, y: -1.9, z: 12, name: '远端监测点', depth: 1.9 },
    ],
    segments: [
      { id: 'g-s1', fromNode: 'g-n1', toNode: 'g-n2', diameter: 0.3, material: '无缝钢管', isAbnormal: false, status: '正常' },
      { id: 'g-s2', fromNode: 'g-n2', toNode: 'g-n3', diameter: 0.3, material: '无缝钢管', isAbnormal: false, status: '正常' },
      { id: 'g-s3', fromNode: 'g-n3', toNode: 'g-n4', diameter: 0.25, material: '无缝钢管', isAbnormal: true, status: '异常，需检修' },
      { id: 'g-s4', fromNode: 'g-n4', toNode: 'g-n5', diameter: 0.2, material: 'PE管', isAbnormal: false, status: '正常' },
      { id: 'g-s5', fromNode: 'g-n3', toNode: 'g-n6', diameter: 0.2, material: '无缝钢管', isAbnormal: false, status: '正常' },
      { id: 'g-s6', fromNode: 'g-n6', toNode: 'g-n7', diameter: 0.15, material: 'PE管', isAbnormal: false, status: '正常' },
    ],
  },
  {
    id: 'power-1',
    name: '电力管线C',
    type: 'power',
    color: PIPELINE_COLORS.power,
    nodes: [
      { id: 'p-n1', x: -18, y: -1, z: 0, name: '变电站出口', depth: 1 },
      { id: 'p-n2', x: -10, y: -1.2, z: -6, name: '电缆井1号', depth: 1.2 },
      { id: 'p-n3', x: -2, y: -0.8, z: -10, name: '分支接头', depth: 0.8 },
      { id: 'p-n4', x: 6, y: -1.5, z: -6, name: '电缆井2号', depth: 1.5 },
      { id: 'p-n5', x: 14, y: -1, z: -2, name: '环网柜', depth: 1 },
      { id: 'p-n6', x: 10, y: -1.3, z: 6, name: '用户配电室', depth: 1.3 },
      { id: 'p-n7', x: 0, y: -0.9, z: 10, name: '路灯变压点', depth: 0.9 },
      { id: 'p-n8', x: -8, y: -1.1, z: 6, name: '电缆井3号', depth: 1.1 },
    ],
    segments: [
      { id: 'p-s1', fromNode: 'p-n1', toNode: 'p-n2', diameter: 0.2, material: '铜芯电缆', isAbnormal: false, status: '正常' },
      { id: 'p-s2', fromNode: 'p-n2', toNode: 'p-n3', diameter: 0.2, material: '铜芯电缆', isAbnormal: false, status: '正常' },
      { id: 'p-s3', fromNode: 'p-n3', toNode: 'p-n4', diameter: 0.18, material: '铜芯电缆', isAbnormal: false, status: '正常' },
      { id: 'p-s4', fromNode: 'p-n4', toNode: 'p-n5', diameter: 0.15, material: '铝芯电缆', isAbnormal: false, status: '正常' },
      { id: 'p-s5', fromNode: 'p-n5', toNode: 'p-n6', diameter: 0.12, material: '铜芯电缆', isAbnormal: false, status: '正常' },
      { id: 'p-s6', fromNode: 'p-n6', toNode: 'p-n7', diameter: 0.1, material: '铜芯电缆', isAbnormal: false, status: '正常' },
      { id: 'p-s7', fromNode: 'p-n7', toNode: 'p-n8', diameter: 0.08, material: '铝芯电缆', isAbnormal: false, status: '正常' },
      { id: 'p-s8', fromNode: 'p-n8', toNode: 'p-n1', diameter: 0.15, material: '铜芯电缆', isAbnormal: false, status: '正常' },
    ],
  },
];

export const getNodeById = (nodeId: string): PipelineNode | undefined => {
  for (const pipeline of mockPipelines) {
    const node = pipeline.nodes.find((n) => n.id === nodeId);
    if (node) return node;
  }
  return undefined;
};

export const getSegmentById = (segId: string): { segment: PipelineSegment; pipeline: Pipeline } | undefined => {
  for (const pipeline of mockPipelines) {
    const segment = pipeline.segments.find((s) => s.id === segId);
    if (segment) return { segment, pipeline };
  }
  return undefined;
};
