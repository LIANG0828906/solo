// 单个台风粒子：管理粒子位置、速度、生命周期和透明度
// 性能优化：使用全局 sin/cos 查找表（LUT）和预计算风速颜色表，避免每帧大量 Math.* 调用

import * as THREE from 'three';

export interface ParticleState {
  position: THREE.Vector3;
  color: THREE.Color;
  size: number;
  opacity: number;
}

// ============ 全局性能优化：查找表 ============
const TRIG_TABLE_SIZE = 4096;                 // 2 的幂，便于 & 取模
const TRIG_TABLE_MASK = TRIG_TABLE_SIZE - 1;
const TRIG_TABLE_STEP = (Math.PI * 2) / TRIG_TABLE_SIZE;
const TRIG_TABLE_INV_STEP = 1 / TRIG_TABLE_STEP;

const SIN_TABLE = new Float32Array(TRIG_TABLE_SIZE);
const COS_TABLE = new Float32Array(TRIG_TABLE_SIZE);
for (let i = 0; i < TRIG_TABLE_SIZE; i++) {
  const a = i * TRIG_TABLE_STEP;
  SIN_TABLE[i] = Math.sin(a);
  COS_TABLE[i] = Math.cos(a);
}

/** 快速 sin，通过 LUT + 线性插值，误差 < 0.0005 */
function fastSin(angle: number): number {
  const t = ((angle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
  const idxF = t * TRIG_TABLE_INV_STEP;
  const i0 = (idxF | 0) & TRIG_TABLE_MASK;
  const i1 = (i0 + 1) & TRIG_TABLE_MASK;
  const f = idxF - (idxF | 0);
  return SIN_TABLE[i0] + (SIN_TABLE[i1] - SIN_TABLE[i0]) * f;
}
function fastCos(angle: number): number {
  const t = ((angle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
  const idxF = t * TRIG_TABLE_INV_STEP;
  const i0 = (idxF | 0) & TRIG_TABLE_MASK;
  const i1 = (i0 + 1) & TRIG_TABLE_MASK;
  const f = idxF - (idxF | 0);
  return COS_TABLE[i0] + (COS_TABLE[i1] - COS_TABLE[i0]) * f;
}

// ============ 风速 -> 颜色查找表（80-240 km/h 分 256 阶） ============
const COLOR_LUT_SIZE = 256;
const WIND_COLOR_LUT_R = new Float32Array(COLOR_LUT_SIZE);
const WIND_COLOR_LUT_G = new Float32Array(COLOR_LUT_SIZE);
const WIND_COLOR_LUT_B = new Float32Array(COLOR_LUT_SIZE);
(function buildWindColorLut() {
  const stops: [number, [number, number, number]][] = [
    [0.0, [0.06, 0.52, 0.95]],
    [0.4, [0.90, 0.95, 1.00]],
    [0.7, [1.00, 0.55, 0.15]],
    [1.0, [0.95, 0.15, 0.15]],
  ];
  const sample = (t: number): [number, number, number] => {
    for (let i = 0; i < stops.length - 1; i++) {
      if (t >= stops[i][0] && t <= stops[i + 1][0]) {
        const f = (t - stops[i][0]) / (stops[i + 1][0] - stops[i][0]);
        const a = stops[i][1];
        const b = stops[i + 1][1];
        return [
          a[0] + (b[0] - a[0]) * f,
          a[1] + (b[1] - a[1]) * f,
          a[2] + (b[2] - a[2]) * f,
        ];
      }
    }
    return stops[stops.length - 1][1];
  };
  for (let i = 0; i < COLOR_LUT_SIZE; i++) {
    const t = i / (COLOR_LUT_SIZE - 1);
    const [r, g, b] = sample(t);
    WIND_COLOR_LUT_R[i] = r;
    WIND_COLOR_LUT_G[i] = g;
    WIND_COLOR_LUT_B[i] = b;
  }
})();

export class TyphoonParticle {
  // 粒子半径方向距离中心的比例（0-1）
  private radiusRatio: number;
  // 当前角度（绕中心旋转）
  private theta: number;
  // 角速度（强度越高旋转越快）
  private angularSpeed: number;
  // 粒子自身的高度偏移
  private zRatio: number;
  // 涡旋结构：螺旋角
  private helixOffset: number;
  // 基于索引的稳定伪随机相位（替代 Math.random，避免GC）
  private randPhase: number;

  constructor(
    particleIndex: number,
    totalCount: number,
  ) {
    const inv = particleIndex / totalCount;
    // 在半径范围内不均匀分布：中心密集，外部稀疏（使用确定算法）
    const r = ((particleIndex * 9301 + 49297) % 233280) / 233280;
    this.radiusRatio = Math.pow(r, 0.65);
    // 初始角度：粒子索引 + 螺旋偏移
    this.helixOffset = this.radiusRatio * Math.PI * 4;
    this.theta = inv * Math.PI * 2 * 3 + this.helixOffset;
    // 角速度：半径越小转得越快（刚体近似）
    this.angularSpeed = (1.6 - this.radiusRatio * 0.9);
    // 高度：中心略高，呈云层堆叠效果
    this.zRatio = (1 - this.radiusRatio) * 0.9 + (((particleIndex * 12345) & 0xff) / 0xff) * 0.1;
    // 稳定随机相位（用于尺寸抖动）
    this.randPhase = particleIndex * 0.37 + 0.13;
  }

  /**
   * 计算某时间步下的粒子世界坐标、颜色和尺寸
   * 所有三角函数均通过 LUT 计算，颜色通过预采样表查表，大幅降低CPU占用
   */
  update(
    centerWorld: THREE.Vector3,
    normal: THREE.Vector3,
    tangentU: THREE.Vector3,
    tangentV: THREE.Vector3,
    baseRadiusKm: number,
    windSpeed: number,
    dt: number,
    strength: number,
    state: ParticleState,
  ): void {
    // 强度控制旋转速度
    this.theta += this.angularSpeed * (0.6 + strength * 2.2) * dt;

    // 半径随强度膨胀
    const r = this.radiusRatio * baseRadiusKm * (0.55 + strength * 0.55);

    // 使用 LUT 近似替代 Math.sin / Math.cos
    const cosT = fastCos(this.theta);
    const sinT = fastSin(this.theta);

    // 在切平面内坐标
    const u = cosT * r;
    const v = sinT * r;

    // 螺旋下沉：越外圈越下沉
    const lift = this.zRatio * baseRadiusKm * 0.35 * (0.3 + strength * 0.8);

    // 组合世界坐标（直接复用 Vector3 以减少分配）
    const sp = state.position;
    sp.x = centerWorld.x + tangentU.x * u + tangentV.x * v + normal.x * lift;
    sp.y = centerWorld.y + tangentU.y * u + tangentV.y * v + normal.y * lift;
    sp.z = centerWorld.z + tangentU.z * u + tangentV.z * v + normal.z * lift;

    // 颜色：从 LUT 查表
    TyphoonParticle.windSpeedToColor(windSpeed, this.radiusRatio, state.color);

    // 尺寸：中心小边缘大，强度越大整体更大（使用稳定伪随机避免GC）
    const jitter = 0.85 + ((fastSin(this.randPhase + this.theta * 0.2) + 1) * 0.15);
    state.size = (0.012 + this.radiusRatio * 0.02) * (0.7 + strength * 1.2) * jitter;

    // 透明度：外围更透明，中心更实
    state.opacity = 0.25 + (1 - this.radiusRatio) * 0.6;
  }

  /** 预计算查表方式映射风速颜色，速度范围 80-240 km/h */
  static windSpeedToColor(windSpeed: number, radiusRatio: number, out: THREE.Color): void {
    const t = THREE.MathUtils.clamp((windSpeed - 80) / (240 - 80), 0, 1);
    const idx = t * (COLOR_LUT_SIZE - 1);
    const i0 = idx | 0;
    const i1 = Math.min(i0 + 1, COLOR_LUT_SIZE - 1);
    const f = idx - i0;
    out.r = WIND_COLOR_LUT_R[i0] + (WIND_COLOR_LUT_R[i1] - WIND_COLOR_LUT_R[i0]) * f;
    out.g = WIND_COLOR_LUT_G[i0] + (WIND_COLOR_LUT_G[i1] - WIND_COLOR_LUT_G[i0]) * f;
    out.b = WIND_COLOR_LUT_B[i0] + (WIND_COLOR_LUT_B[i1] - WIND_COLOR_LUT_B[i0]) * f;
    // 边缘稍微加一点亮度
    const lumBoost = radiusRatio * 0.02;
    out.r = Math.min(1, out.r + lumBoost);
    out.g = Math.min(1, out.g + lumBoost);
    out.b = Math.min(1, out.b + lumBoost);
  }
}
