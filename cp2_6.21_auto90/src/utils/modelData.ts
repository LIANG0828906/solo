import { PartData } from '@/types';

/**
 * 青铜鼎部件数据定义模块
 *
 * 职责：定义青铜鼎的5个独立部件（鼎身、双耳、三足、纹饰层、铭文层）。
 * 每个部件可能包含多个子网格（例如双耳包含左耳和右耳两个子网格，三足包含三个子网格）。
 *
 * 调用方：
 *   - Scene 组件读取 BRONZE_DING_PARTS 遍历渲染 PartMesh
 *   - ExplosionPanel 组件读取 BRONZE_DING_PARTS 遍历渲染滑动条
 *   - explosionStore 通过 BRONZE_DING_PARTS 初始化 partOffsets 和 explodeAll 目标值
 *
 * 数据流向：
 *   BRONZE_DING_PARTS → Scene → PartMesh
 *   BRONZE_DING_PARTS → ExplosionPanel → slider onChange → useExplosionStore
 */

export const BRONZE_DING_PARTS: PartData[] = [
  {
    id: 'dingBody',
    name: '鼎身',
    color: '#6B4226',
    defaultPosition: [0, 0, 0],
    explodeAxis: [0, 0, 0],
    label: '鼎身',
    explodeTargetOffset: 0,
    subMeshes: [
      {
        geometryType: 'dingBody',
        position: [0, 0, 0],
      },
    ],
  },
  {
    id: 'ears',
    name: '双耳',
    color: '#8B5E3C',
    defaultPosition: [0, 1.3, 0],
    explodeAxis: [0, 1, 0],
    label: '双耳',
    explodeTargetOffset: 2,
    subMeshes: [
      {
        geometryType: 'ear',
        position: [-1.1, 0, 0],
      },
      {
        geometryType: 'ear',
        position: [1.1, 0, 0],
      },
    ],
  },
  {
    id: 'legs',
    name: '三足',
    color: '#5C3317',
    defaultPosition: [0, -1.2, 0],
    explodeAxis: [0, -1, 0],
    label: '三足',
    explodeTargetOffset: 2.5,
    subMeshes: [
      {
        geometryType: 'leg',
        position: [-0.8, 0, 0.8],
      },
      {
        geometryType: 'leg',
        position: [0.8, 0, 0.8],
      },
      {
        geometryType: 'leg',
        position: [0, 0, -0.9],
      },
    ],
  },
  {
    id: 'patternLayer',
    name: '纹饰层',
    color: '#C4985A',
    defaultPosition: [0, 0.2, 0],
    explodeAxis: [0, 1, 0],
    label: '纹饰层',
    explodeTargetOffset: 3,
    subMeshes: [
      {
        geometryType: 'pattern',
        position: [0, 0, 0],
      },
    ],
  },
  {
    id: 'inscriptionLayer',
    name: '铭文层',
    color: '#D4AF37',
    defaultPosition: [0, -0.1, 0],
    explodeAxis: [0, -1, 0],
    label: '铭文层',
    explodeTargetOffset: 2,
    subMeshes: [
      {
        geometryType: 'inscription',
        position: [0, 0, 0],
      },
    ],
  },
];

export const EXPLODE_OFFSET_MIN = -3;
export const EXPLODE_OFFSET_MAX = 5;
export const MAX_SELECTED_PARTS = 2;
