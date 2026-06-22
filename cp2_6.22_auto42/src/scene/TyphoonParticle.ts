// 单个台风粒子：管理粒子位置、速度、生命周期和透明度

import * as THREE from 'three';

export interface ParticleState {
  position: THREE.Vector3;
  color: THREE.Color;
  size: number;
  opacity: number;
}

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
  // 当前缩放
  public scale = 1;

  constructor(
    private particleIndex: number,
    private totalCount: number,
  ) {
    // 在半径范围内不均匀分布：中心密集，外部稀疏
    const r = Math.random();
    this.radiusRatio = Math.pow(r, 0.65);
    // 初始角度：粒子索引 + 螺旋偏移
    this.helixOffset = this.radiusRatio * Math.PI * 4;
    this.theta = (particleIndex / totalCount) * Math.PI * 2 * 3 + this.helixOffset;
    // 角速度：半径越小转得越快（刚体近似），但强度会在update中覆盖
    this.angularSpeed = (1.6 - this.radiusRatio * 0.9);
    // 高度：中心略高，呈云层堆叠效果
    this.zRatio = (1 - this.radiusRatio) * 0.9 + Math.random() * 0.1;
  }

  /**
   * 计算某时间步下的粒子世界坐标、颜色和尺寸
   * @param centerWorld 台风中心（世界坐标）
   * @param normal 地表法线（球面地球表面）
   * @param tangentU 地表切向 U
   * @param tangentV 地表切向 V
   * @param baseRadiusKm 本次渲染的台风水平规模（Three.js单位）
   * @param windSpeed 风速 km/h，用于着色与尺寸
   * @param dt 秒距，用于推进 theta
   * @param state 复用输出对象，避免GC
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
    const k = 0.6 + strength * 2.2;
    this.theta += this.angularSpeed * k * dt;

    // 半径随强度膨胀（但考虑粒子自身 radialRatio
    const r = this.radiusRatio * baseRadiusKm * (0.55 + strength * 0.55);

    const cosT = Math.cos(this.theta);
    const sinT = Math.sin(this.theta);

    // 在切平面内坐标
    const u = cosT * r;
    const v = sinT * r;

    // 螺旋下沉：越外圈越下沉
    const lift = this.zRatio * baseRadiusKm * 0.35 * (0.3 + strength * 0.8);

    // 组合世界坐标
    state.position
      .copy(centerWorld)
      .addScaledVector(tangentU, u)
      .addScaledVector(tangentV, v)
      .addScaledVector(normal, lift);

    // 颜色：根据风速渐变 蓝 -> 白 -> 橙 -> 红
    TyphoonParticle.windSpeedToColor(windSpeed, this.radiusRatio, state.color);

    // 尺寸：中心小边缘大，强度越大整体更大
    const baseSize = 0.012 + this.radiusRatio * 0.02;
    state.size = baseSize * (0.7 + strength * 1.2) * (0.85 + Math.random() * 0.3);

    // 透明度：外围更透明，中心更实
    state.opacity = Math.max(0.18, 1 - this.radiusRatio * 0.75);
  }

  /**
   * 根据风速映射颜色。速度范围 80-240 km/h
   * 100以下蓝 -> 150 白 -> 180 橙 -> 200+ 红
   */
  static windSpeedToColor(windSpeed: number, radiusRatio: number, out: THREE.Color): void {
    const t = THREE.MathUtils.clamp((windSpeed - 80) / (240 - 80), 0, 1);
    // 多段颜色插值
    const stops: [number, number, number][] = [
      [0.06, 0.52, 0.95], // 蓝
      [0.90, 0.95, 1.00], // 白
      [1.00, 0.55, 0.15], // 橙
      [0.95, 0.15, 0.15], // 红
    ];
    const seg = t * (stops.length - 1);
    const i = Math.min(Math.floor(seg), stops.length - 2);
    const f = seg - i;
    const a = stops[i];
    const b = stops[i + 1];
    out.setRGB(
      a[0] + (b[0] - a[0]) * f,
      a[1] + (b[1] - a[1]) * f,
      a[2] + (b[2] - a[2]) * f,
    );
    // 边缘稍微加一点蓝
    out.offsetHSL(0, 0, radiusRatio * 0.02);
  }
}
