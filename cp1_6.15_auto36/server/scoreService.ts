import type { Point, ElementType, SpellTemplate, MatchQuality, ScoreResponse } from '../shared/types';

/**
 * 四种元素的符咒模板
 * 坐标已归一化到 0-1 范围
 * fire: 三角形（上下左右闭合）
 * water: 波浪线（正弦波形状）
 * wind: 螺旋形（向外旋转的螺旋）
 * thunder: 闪电折线（锯齿状折线）
 */
export const spellTemplates: Record<ElementType, SpellTemplate> = {
  fire: {
    id: 'fire-1',
    element: 'fire',
    name: '火焰符咒',
    difficulty: 3,
    points: [
      { x: 0.5, y: 0.2, timestamp: 0 },
      { x: 0.3, y: 0.5, timestamp: 100 },
      { x: 0.5, y: 0.8, timestamp: 200 },
      { x: 0.7, y: 0.5, timestamp: 300 },
      { x: 0.5, y: 0.2, timestamp: 400 },
    ],
  },
  water: {
    id: 'water-1',
    element: 'water',
    name: '水波符咒',
    difficulty: 2,
    points: [
      { x: 0.1, y: 0.5, timestamp: 0 },
      { x: 0.25, y: 0.35, timestamp: 50 },
      { x: 0.4, y: 0.5, timestamp: 100 },
      { x: 0.55, y: 0.65, timestamp: 150 },
      { x: 0.7, y: 0.5, timestamp: 200 },
      { x: 0.85, y: 0.35, timestamp: 250 },
      { x: 0.9, y: 0.5, timestamp: 300 },
    ],
  },
  wind: {
    id: 'wind-1',
    element: 'wind',
    name: '旋风符咒',
    difficulty: 4,
    points: [
      { x: 0.5, y: 0.5, timestamp: 0 },
      { x: 0.6, y: 0.4, timestamp: 80 },
      { x: 0.65, y: 0.55, timestamp: 160 },
      { x: 0.5, y: 0.65, timestamp: 240 },
      { x: 0.35, y: 0.55, timestamp: 320 },
      { x: 0.35, y: 0.35, timestamp: 400 },
      { x: 0.55, y: 0.3, timestamp: 480 },
      { x: 0.7, y: 0.4, timestamp: 560 },
      { x: 0.7, y: 0.65, timestamp: 640 },
    ],
  },
  thunder: {
    id: 'thunder-1',
    element: 'thunder',
    name: '雷电符咒',
    difficulty: 5,
    points: [
      { x: 0.5, y: 0.1, timestamp: 0 },
      { x: 0.4, y: 0.3, timestamp: 80 },
      { x: 0.6, y: 0.4, timestamp: 160 },
      { x: 0.35, y: 0.6, timestamp: 240 },
      { x: 0.55, y: 0.75, timestamp: 320 },
      { x: 0.45, y: 0.9, timestamp: 400 },
    ],
  },
};

const MAX_POINT_DISTANCE = Math.sqrt(2);
const RESAMPLE_COUNT = 32;

/**
 * 计算两点之间的欧氏距离
 * @param p1 点1
 * @param p2 点2
 * @returns 欧氏距离
 */
export function euclideanDistance(p1: Point, p2: Point): number {
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * 轨迹重采样
 * 使用线性插值将轨迹重采样到固定点数
 * @param trajectory 原始轨迹
 * @param targetCount 目标点数
 * @returns 重采样后的轨迹
 */
export function resampleTrajectory(trajectory: Point[], targetCount: number): Point[] {
  if (trajectory.length < 2) {
    return trajectory.slice();
  }

  const result: Point[] = [];
  const totalSegments = targetCount - 1;

  let totalLength = 0;
  const segmentLengths: number[] = [];
  for (let i = 1; i < trajectory.length; i++) {
    const len = euclideanDistance(trajectory[i - 1], trajectory[i]);
    segmentLengths.push(len);
    totalLength += len;
  }

  if (totalLength === 0) {
    for (let i = 0; i < targetCount; i++) {
      result.push({ ...trajectory[0], timestamp: trajectory[0].timestamp + i });
    }
    return result;
  }

  const interval = totalLength / totalSegments;
  let currentDistance = 0;
  let segmentIndex = 0;
  let accumulatedLength = 0;

  result.push({ ...trajectory[0] });

  for (let i = 1; i < targetCount - 1; i++) {
    const targetDistance = i * interval;

    while (segmentIndex < segmentLengths.length - 1 && accumulatedLength + segmentLengths[segmentIndex] < targetDistance) {
      accumulatedLength += segmentLengths[segmentIndex];
      segmentIndex++;
    }

    const segmentStart = accumulatedLength;
    const segmentLen = segmentLengths[segmentIndex] || 1;
    const t = (targetDistance - segmentStart) / segmentLen;

    const p1 = trajectory[segmentIndex];
    const p2 = trajectory[Math.min(segmentIndex + 1, trajectory.length - 1)];

    result.push({
      x: p1.x + (p2.x - p1.x) * t,
      y: p1.y + (p2.y - p1.y) * t,
      timestamp: p1.timestamp + (p2.timestamp - p1.timestamp) * t,
    });
  }

  result.push({ ...trajectory[trajectory.length - 1] });

  return result;
}

/**
 * 归一化轨迹
 * - 先重采样到固定点数
 * - 坐标缩放到 0-1 范围
 * - 时间戳相对化（从0开始）
 * @param trajectory 原始轨迹
 * @returns 归一化后的轨迹
 */
export function normalizeTrajectory(trajectory: Point[]): Point[] {
  if (trajectory.length === 0) {
    return [];
  }

  const resampled = resampleTrajectory(trajectory, RESAMPLE_COUNT);

  let minX = Infinity,
    maxX = -Infinity;
  let minY = Infinity,
    maxY = -Infinity;
  const minTimestamp = resampled[0].timestamp;

  for (const point of resampled) {
    if (point.x < minX) minX = point.x;
    if (point.x > maxX) maxX = point.x;
    if (point.y < minY) minY = point.y;
    if (point.y > maxY) maxY = point.y;
  }

  const rangeX = maxX - minX || 1;
  const rangeY = maxY - minY || 1;
  const scale = Math.max(rangeX, rangeY);

  return resampled.map((point) => ({
    x: (point.x - minX) / scale,
    y: (point.y - minY) / scale,
    timestamp: point.timestamp - minTimestamp,
  }));
}

/**
 * 动态时间规整（DTW）算法
 * 计算两个轨迹之间的距离，支持不同长度序列的匹配
 * 使用 Sakoe-Chiba band 路径约束减少计算量
 * 时间复杂度 O(n*w)，空间复杂度 O(n*m)，w 为窗口大小
 * @param seq1 轨迹1
 * @param seq2 轨迹2
 * @returns DTW 距离
 */
export function dtwDistance(seq1: Point[], seq2: Point[]): number {
  const n = seq1.length;
  const m = seq2.length;

  if (n === 0 || m === 0) {
    return Infinity;
  }

  const band = Math.max(Math.abs(n - m), Math.floor(Math.max(n, m) * 0.1));

  const dp: number[][] = Array(n + 1)
    .fill(0)
    .map(() => Array(m + 1).fill(Infinity));
  dp[0][0] = 0;

  for (let i = 1; i <= n; i++) {
    const jStart = Math.max(1, i - band);
    const jEnd = Math.min(m, i + band);

    for (let j = jStart; j <= jEnd; j++) {
      const cost = euclideanDistance(seq1[i - 1], seq2[j - 1]);
      dp[i][j] = cost + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }

  return dp[n][m];
}

/**
 * 根据 DTW 距离转换为 0-100 分
 * 距离越小，分数越高
 * 使用指数衰减映射，添加随机噪声让分数更自然
 * @param distance DTW 距离
 * @param templateLength 模板点数量（用于归一化距离）
 * @returns 0-100 的分数
 */
export function calculateScore(distance: number, templateLength: number): number {
  if (distance === Infinity) {
    return 0;
  }

  const normalizedDistance = distance / (templateLength * MAX_POINT_DISTANCE);
  const baseScore = 100 * Math.exp(-normalizedDistance * 6);
  const noise = (Math.random() - 0.5) * 4;
  const score = Math.round(baseScore + noise);

  return Math.max(0, Math.min(100, score));
}

/**
 * 根据分数判定匹配等级
 * >= 80: perfect（完美）
 * 60-79: normal（正常）
 * < 60: fail（失败）
 * @param score 分数
 * @returns 匹配等级
 */
export function determineMatchQuality(score: number): MatchQuality {
  if (score >= 80) {
    return 'perfect';
  } else if (score >= 60) {
    return 'normal';
  } else {
    return 'fail';
  }
}

/**
 * 主评分函数
 * 接收用户绘制的轨迹和目标元素，返回评分结果
 * @param trajectory 用户绘制的轨迹
 * @param element 目标元素类型
 * @returns 评分结果
 */
export function scoreSpell(trajectory: Point[], element: ElementType): ScoreResponse {
  if (trajectory.length < 3) {
    return {
      score: 0,
      element,
      matchQuality: 'fail',
      message: '轨迹太短，请绘制完整的符咒',
    };
  }

  const template = spellTemplates[element];
  const normalizedTrajectory = normalizeTrajectory(trajectory);
  const normalizedTemplate = normalizeTrajectory(template.points);

  const distance = dtwDistance(normalizedTrajectory, normalizedTemplate);
  const score = calculateScore(distance, template.points.length);
  const matchQuality = determineMatchQuality(score);

  let message: string;
  switch (matchQuality) {
    case 'perfect':
      message = `完美！${template.name}绘制精准，魔力共鸣强烈！`;
      break;
    case 'normal':
      message = `不错，${template.name}基本成型，继续练习可以更精准。`;
      break;
    case 'fail':
      message = `${template.name}绘制失败，轨迹偏差较大，请重新尝试。`;
      break;
  }

  return {
    score,
    element,
    matchQuality,
    message,
  };
}
