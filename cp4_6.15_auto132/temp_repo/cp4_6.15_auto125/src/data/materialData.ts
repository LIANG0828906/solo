import type { Material } from '@/types';

/**
 * 素材数据说明：
 * - 所有SVG路径均为基础几何图形组合（圆形、矩形、三角形、多边形、椭圆弧）
 * - 统一使用 viewBox="0 0 100 100"，以(50,50)为中心便于居中变换
 * - 路径来源：全部手写SVG path命令，使用 M/L/H/V/C/Q/A/Z 等基础指令
 * - 每个素材均标注：形状类型 + 构造方式注释
 */
export const MATERIALS: Material[] = [
  // ==================== 自然分类 ====================
  {
    // 树叶：用椭圆弧描边 + 中脉直线，M起点→A弧→L折线→闭合
    id: 'nature-leaf',
    category: 'nature',
    name: '树叶',
    svgPath: 'M50 10 A30 50 0 0 1 50 90 A30 50 0 0 1 50 10 M50 20 L50 85',
    defaultColor: '#4A7C59',
    viewBox: '0 0 100 100',
  },
  {
    // 花朵：6个椭圆花瓣围绕中心 + 圆形花蕊，H/V水平垂直画线
    id: 'nature-flower',
    category: 'nature',
    name: '花朵',
    svgPath: 'M50 15 A18 18 0 0 1 68 30 A18 18 0 0 1 50 45 A18 18 0 0 1 32 30 A18 18 0 0 1 50 15 M20 40 A18 18 0 0 1 38 55 A18 18 0 0 1 20 70 A18 18 0 0 1 2 55 A18 18 0 0 1 20 40 M80 40 A18 18 0 0 1 98 55 A18 18 0 0 1 80 70 A18 18 0 0 1 62 55 A18 18 0 0 1 80 40 M30 65 A18 18 0 0 1 48 80 A18 18 0 0 1 30 95 A18 18 0 0 1 12 80 A18 18 0 0 1 30 65 M70 65 A18 18 0 0 1 88 80 A18 18 0 0 1 70 95 A18 18 0 0 1 52 80 A18 18 0 0 1 70 65 M50 38 m-12 0 a12 12 0 1 0 24 0 a12 12 0 1 0 -24 0',
    defaultColor: '#E8B4B8',
    viewBox: '0 0 100 100',
  },
  {
    // 山脉：三个相连三角形，纯折线 L 指令绘制
    id: 'nature-mountain',
    category: 'nature',
    name: '山脉',
    svgPath: 'M5 85 L25 40 L40 65 L55 30 L75 60 L95 25 L95 85 Z',
    defaultColor: '#6B8E9F',
    viewBox: '0 0 100 100',
  },
  {
    // 云朵：3-4个相切圆形叠加 + 底部矩形，用A圆弧和H水平线
    id: 'nature-cloud',
    category: 'nature',
    name: '云朵',
    svgPath: 'M20 65 A15 15 0 0 1 20 35 A20 20 0 0 1 50 25 A18 18 0 0 1 80 30 A15 15 0 0 1 85 65 Z',
    defaultColor: '#B8C5D6',
    viewBox: '0 0 100 100',
  },
  {
    // 太阳：中心圆 + 8条放射线，使用m相对坐标绘制射线
    id: 'nature-sun',
    category: 'nature',
    name: '太阳',
    svgPath: 'M50 50 m-22 0 a22 22 0 1 0 44 0 a22 22 0 1 0 -44 0 M50 15 V5 M50 95 V85 M15 50 H5 M85 50 H95 M25 25 L18 18 M82 82 L75 75 M25 75 L18 82 M82 18 L75 25',
    defaultColor: '#F5B971',
    viewBox: '0 0 100 100',
  },
  {
    // 水滴：尖顶椭圆，用两个Q二次贝塞尔曲线
    id: 'nature-drop',
    category: 'nature',
    name: '水滴',
    svgPath: 'M50 12 Q28 48 28 68 A22 22 0 0 0 72 68 Q72 48 50 12',
    defaultColor: '#7EC8E3',
    viewBox: '0 0 100 100',
  },
  {
    // 树木：底部矩形树干 + 两个三角形树冠，L折线+Z闭合
    id: 'nature-tree',
    category: 'nature',
    name: '树木',
    svgPath: 'M45 92 H55 V62 H45 Z M50 15 L22 55 L35 55 L15 80 L85 80 L65 55 L78 55 Z',
    defaultColor: '#8B7355',
    viewBox: '0 0 100 100',
  },

  // ==================== 几何分类 ====================
  {
    // 圆形：标准两个半圆弧合成，m相对位移 + a椭圆弧
    id: 'geo-circle',
    category: 'geometry',
    name: '圆形',
    svgPath: 'M50 15 m-35 0 a35 35 0 1 0 70 0 a35 35 0 1 0 -70 0',
    defaultColor: '#D4A574',
    viewBox: '0 0 100 100',
  },
  {
    // 三角形：等边三角形，M→L→L→Z闭合
    id: 'geo-triangle',
    category: 'geometry',
    name: '三角形',
    svgPath: 'M50 12 L88 82 L12 82 Z',
    defaultColor: '#C9A959',
    viewBox: '0 0 100 100',
  },
  {
    // 正方形：纯水平垂直，H水平线 + V垂直线，宽高60
    id: 'geo-square',
    category: 'geometry',
    name: '正方形',
    svgPath: 'M20 20 H80 V80 H20 Z',
    defaultColor: '#B8860B',
    viewBox: '0 0 100 100',
  },
  {
    // 六边形：6个顶点，L连接每个角，中心对齐(50,50)
    id: 'geo-hexagon',
    category: 'geometry',
    name: '六边形',
    svgPath: 'M50 10 L85 30 L85 70 L50 90 L15 70 L15 30 Z',
    defaultColor: '#CD853F',
    viewBox: '0 0 100 100',
  },
  {
    // 五角星：5个外角5个内角交替，使用数学坐标计算
    id: 'geo-star',
    category: 'geometry',
    name: '星形',
    svgPath: 'M50 8 L60 38 L92 38 L66 58 L76 88 L50 70 L24 88 L34 58 L8 38 L40 38 Z',
    defaultColor: '#DAA520',
    viewBox: '0 0 100 100',
  },
  {
    // 菱形：45°旋转正方形，M-L-L-L-Z
    id: 'geo-diamond',
    category: 'geometry',
    name: '菱形',
    svgPath: 'M50 12 L88 50 L50 88 L12 50 Z',
    defaultColor: '#BC8F8F',
    viewBox: '0 0 100 100',
  },
  {
    // 圆环：两个同心圆使用奇偶规则，外圈R35内圈R15
    id: 'geo-donut',
    category: 'geometry',
    name: '圆环',
    svgPath: 'M50 50 m-35 0 a35 35 0 1 0 70 0 a35 35 0 1 0 -70 0 M50 50 m-15 0 a15 15 0 1 0 30 0 a15 15 0 1 0 -30 0',
    defaultColor: '#A0522D',
    viewBox: '0 0 100 100',
  },

  // ==================== 动物分类 ====================
  {
    // 小鸟：身体椭圆 + 两个三角形翅膀 + 小三角嘴
    id: 'animal-bird',
    category: 'animal',
    name: '小鸟',
    svgPath: 'M50 45 m-25 0 a25 20 0 1 0 50 0 a25 20 0 1 0 -50 0 M35 40 L25 25 L45 40 Z M65 40 L75 25 L55 40 Z M75 45 L88 40 L75 55 Z M45 55 L48 62 M55 55 L52 62',
    defaultColor: '#5D4E6D',
    viewBox: '0 0 100 100',
  },
  {
    // 鱼：椭圆身体 + 三角形尾巴 + 圆形眼睛
    id: 'animal-fish',
    category: 'animal',
    name: '鱼',
    svgPath: 'M50 50 m-28 0 a28 18 0 1 0 56 0 a28 18 0 1 0 -56 0 M78 50 L95 30 L90 50 L95 70 Z M40 45 m-4 0 a4 4 0 1 0 8 0 a4 4 0 1 0 -8 0',
    defaultColor: '#4A6FA5',
    viewBox: '0 0 100 100',
  },
  {
    // 蝴蝶：左右对称翅膀用椭圆，中间矩形身体
    id: 'animal-butterfly',
    category: 'animal',
    name: '蝴蝶',
    svgPath: 'M48 30 H52 V75 H48 Z M46 38 m-25 -8 a25 22 0 1 0 35 28 a20 18 0 1 0 -35 -28 M54 38 m-5 -8 a25 22 0 1 0 35 28 a20 18 0 1 0 -30 -28 M48 22 L42 12 M52 22 L58 12',
    defaultColor: '#9B5DE5',
    viewBox: '0 0 100 100',
  },
  {
    // 猫咪：圆角矩形头部 + 三角耳朵 + 圆眼 + 嘴部小椭圆
    id: 'animal-cat',
    category: 'animal',
    name: '猫咪',
    svgPath: 'M25 40 H75 V75 H25 Z M25 40 L18 22 L35 40 Z M75 40 L82 22 L65 40 Z M40 55 m-5 0 a5 5 0 1 0 10 0 a5 5 0 1 0 -10 0 M60 55 m-5 0 a5 5 0 1 0 10 0 a5 5 0 1 0 -10 0 M50 65 Q46 70 50 70 Q54 70 50 65 M35 70 L28 82 M65 70 L72 82',
    defaultColor: '#6B4423',
    viewBox: '0 0 100 100',
  },
  {
    // 兔子：椭圆头部 + 两个长椭圆耳朵 + 圆眼 + 鼻子三角
    id: 'animal-rabbit',
    category: 'animal',
    name: '兔子',
    svgPath: 'M36 22 m-6 0 a6 18 0 1 0 12 0 a6 18 0 1 0 -12 0 M58 22 m-6 0 a6 18 0 1 0 12 0 a6 18 0 1 0 -12 0 M50 50 m-20 0 a20 18 0 1 0 40 0 a20 18 0 1 0 -40 0 M43 47 m-3 0 a3 3 0 1 0 6 0 a3 3 0 1 0 -6 0 M57 47 m-3 0 a3 3 0 1 0 6 0 a3 3 0 1 0 -6 0 M50 54 Q48 57 50 57 Q52 57 50 54',
    defaultColor: '#C4A484',
    viewBox: '0 0 100 100',
  },
  {
    // 小鹿：椭圆身体 + 椭圆头部 + 4条腿（矩形）+ 鹿角折线
    id: 'animal-deer',
    category: 'animal',
    name: '小鹿',
    svgPath: 'M38 35 m-10 0 a10 12 0 1 0 20 0 a10 12 0 1 0 -20 0 M28 40 L18 22 L22 38 M48 40 L58 22 L54 38 M28 25 L15 15 M28 28 L20 18 M48 25 L61 15 M48 28 L56 18 M50 55 m-18 0 a18 15 0 1 0 36 0 a18 15 0 1 0 -36 0 M40 85 H35 V70 H40 Z M60 85 H55 V70 H60 Z M42 50 m-2 0 a2 2 0 1 0 4 0 a2 2 0 1 0 -4 0 M56 50 m-2 0 a2 2 0 1 0 4 0 a2 2 0 1 0 -4 0 M48 53 Q46 55 48 56 Q50 55 48 53',
    defaultColor: '#8B4513',
    viewBox: '0 0 100 100',
  },
  {
    // 狐狸：三角耳朵 + 梯形脸部 + 白色嘴部三角
    id: 'animal-fox',
    category: 'animal',
    name: '狐狸',
    svgPath: 'M18 32 L82 32 L72 75 L28 75 Z M18 32 L10 12 L32 32 Z M82 32 L90 12 L68 32 Z M42 55 m-4 0 a4 4 0 1 0 8 0 a4 4 0 1 0 -8 0 M58 55 m-4 0 a4 4 0 1 0 8 0 a4 4 0 1 0 -8 0 M50 62 L45 72 L55 72 Z',
    defaultColor: '#D2691E',
    viewBox: '0 0 100 100',
  },

  // ==================== 抽象分类 ====================
  {
    // 波浪：3个连接的Q贝塞尔曲线，波峰波谷交替
    id: 'abs-wave',
    category: 'abstract',
    name: '波浪',
    svgPath: 'M8 50 Q23 28 38 50 Q53 72 68 50 Q83 28 92 50',
    defaultColor: '#00A896',
    viewBox: '0 0 100 100',
  },
  {
    // 螺旋：4圈顺时针螺旋线，L连线段近似
    id: 'abs-spiral',
    category: 'abstract',
    name: '螺旋',
    svgPath: 'M50 50 L58 50 Q70 50 70 62 Q70 78 54 78 Q34 78 34 58 Q34 32 60 32 Q92 32 92 62 Q92 100 50 100',
    defaultColor: '#7209B7',
    viewBox: '0 0 100 100',
  },
  {
    // 斑点：5个不同大小的圆形分散排列，m相对位置
    id: 'abs-dots',
    category: 'abstract',
    name: '斑点',
    svgPath: 'M22 22 m-8 0 a8 8 0 1 0 16 0 a8 8 0 1 0 -16 0 M72 20 m-6 0 a6 6 0 1 0 12 0 a6 6 0 1 0 -12 0 M76 72 m-10 0 a10 10 0 1 0 20 0 a10 10 0 1 0 -20 0 M24 76 m-5 0 a5 5 0 1 0 10 0 a5 5 0 1 0 -10 0 M50 50 m-7 0 a7 7 0 1 0 14 0 a7 7 0 1 0 -14 0',
    defaultColor: '#F72585',
    viewBox: '0 0 100 100',
  },
  {
    // 线条：5条平行水平H线，均匀分布
    id: 'abs-lines',
    category: 'abstract',
    name: '线条',
    svgPath: 'M12 18 H88 M12 34 H88 M12 50 H88 M12 66 H88 M12 82 H88',
    defaultColor: '#3A86FF',
    viewBox: '0 0 100 100',
  },
  {
    // 泼墨：不规则C曲线闭合形状 + 周围4个小圆点
    id: 'abs-splash',
    category: 'abstract',
    name: '泼墨',
    svgPath: 'M48 18 C25 22 22 48 32 58 C20 68 32 85 52 80 C70 88 82 68 78 50 C88 40 72 18 48 18 Z M60 18 m-4 0 a4 4 0 1 0 8 0 a4 4 0 1 0 -8 0 M80 28 m-3 0 a3 3 0 1 0 6 0 a3 3 0 1 0 -6 0 M86 65 m-5 0 a5 5 0 1 0 10 0 a5 5 0 1 0 -10 0 M20 28 m-3 0 a3 3 0 1 0 6 0 a3 3 0 1 0 -6 0',
    defaultColor: '#2B2D42',
    viewBox: '0 0 100 100',
  },
  {
    // 网格：4条垂直线V + 4条水平线H组成3x3网格
    id: 'abs-grid',
    category: 'abstract',
    name: '网格',
    svgPath: 'M25 8 V92 M50 8 V92 M75 8 V92 M8 25 H92 M8 50 H92 M8 75 H92',
    defaultColor: '#5C677D',
    viewBox: '0 0 100 100',
  },
  {
    // 禅意圆：外粗圆 + 内部半月牙弧形（用粗细不同两弧）
    id: 'abs-zen',
    category: 'abstract',
    name: '禅意圆',
    svgPath: 'M50 50 m-36 0 a36 36 0 1 0 72 0 a36 36 0 1 0 -72 0 M50 50 m-20 0 a20 20 0 0 1 40 0 a20 20 0 0 1 -40 0 M50 30 Q30 40 30 65 Q45 80 70 70',
    defaultColor: '#1D3557',
    viewBox: '0 0 100 100',
  },
];

export const CATEGORY_INFO: Record<string, { label: string; icon: string }> = {
  nature: { label: '自然', icon: '🌿' },
  geometry: { label: '几何', icon: '◇' },
  animal: { label: '动物', icon: '🦊' },
  abstract: { label: '抽象', icon: '◐' },
};

/** 按分类过滤素材，返回该分类下所有素材 */
export const getMaterialsByCategory = (category: string): Material[] => {
  return MATERIALS.filter((m) => m.category === category);
};

/** 按ID查找单个素材定义 */
export const getMaterialById = (id: string): Material | undefined => {
  return MATERIALS.find((m) => m.id === id);
};

/** 从指定分类随机选取一个素材（使用Math.floor均匀采样）*/
export const getRandomMaterial = (category: string): Material => {
  const categoryMaterials = getMaterialsByCategory(category);
  const randomIndex = Math.floor(Math.random() * categoryMaterials.length);
  return categoryMaterials[randomIndex];
};
