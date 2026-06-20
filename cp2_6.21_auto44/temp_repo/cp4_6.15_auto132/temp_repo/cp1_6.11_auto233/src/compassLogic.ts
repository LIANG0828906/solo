import * as THREE from 'three';

export interface DirectionInfo {
  name: string;
  angle: number;
  radius: number;
  layer: number;
  trigram?: string;
  element?: string;
  direction?: string;
  ganzhi?: string;
}

export type FlowDirection = 'clockwise' | 'counter' | 'opposite';

export const TWENTY_FOUR_MOUNTAINS: DirectionInfo[] = [
  { name: '壬', angle: -Math.PI / 2, radius: 5.2, layer: 2, ganzhi: '壬', element: '水', direction: '正北偏西' },
  { name: '子', angle: -Math.PI / 2 + Math.PI / 12, radius: 5.2, layer: 2, ganzhi: '子', element: '水', direction: '正北' },
  { name: '癸', angle: -Math.PI / 2 + Math.PI / 6, radius: 5.2, layer: 2, ganzhi: '癸', element: '水', direction: '正北偏东' },
  { name: '丑', angle: -Math.PI / 2 + Math.PI / 4, radius: 5.2, layer: 2, ganzhi: '丑', element: '土', direction: '东北偏北' },
  { name: '艮', angle: -Math.PI / 2 + Math.PI / 3, radius: 5.2, layer: 2, trigram: '艮为山', element: '土', direction: '东北' },
  { name: '寅', angle: -Math.PI / 2 + 5 * Math.PI / 12, radius: 5.2, layer: 2, ganzhi: '寅', element: '木', direction: '东北偏东' },
  { name: '甲', angle: -Math.PI / 2 + Math.PI / 2, radius: 5.2, layer: 2, ganzhi: '甲', element: '木', direction: '正东偏北' },
  { name: '卯', angle: -Math.PI / 2 + 7 * Math.PI / 12, radius: 5.2, layer: 2, ganzhi: '卯', element: '木', direction: '正东' },
  { name: '乙', angle: -Math.PI / 2 + 2 * Math.PI / 3, radius: 5.2, layer: 2, ganzhi: '乙', element: '木', direction: '正东偏南' },
  { name: '辰', angle: -Math.PI / 2 + 3 * Math.PI / 4, radius: 5.2, layer: 2, ganzhi: '辰', element: '土', direction: '东南偏东' },
  { name: '巽', angle: -Math.PI / 2 + 5 * Math.PI / 6, radius: 5.2, layer: 2, trigram: '巽为风', element: '木', direction: '东南' },
  { name: '巳', angle: -Math.PI / 2 + 11 * Math.PI / 12, radius: 5.2, layer: 2, ganzhi: '巳', element: '火', direction: '东南偏南' },
  { name: '丙', angle: -Math.PI / 2 + Math.PI, radius: 5.2, layer: 2, ganzhi: '丙', element: '火', direction: '正南偏东' },
  { name: '午', angle: -Math.PI / 2 + 13 * Math.PI / 12, radius: 5.2, layer: 2, ganzhi: '午', element: '火', direction: '正南' },
  { name: '丁', angle: -Math.PI / 2 + 7 * Math.PI / 6, radius: 5.2, layer: 2, ganzhi: '丁', element: '火', direction: '正南偏西' },
  { name: '未', angle: -Math.PI / 2 + 5 * Math.PI / 4, radius: 5.2, layer: 2, ganzhi: '未', element: '土', direction: '西南偏南' },
  { name: '坤', angle: -Math.PI / 2 + 4 * Math.PI / 3, radius: 5.2, layer: 2, trigram: '坤为地', element: '土', direction: '西南' },
  { name: '申', angle: -Math.PI / 2 + 17 * Math.PI / 12, radius: 5.2, layer: 2, ganzhi: '申', element: '金', direction: '西南偏西' },
  { name: '庚', angle: -Math.PI / 2 + 3 * Math.PI / 2, radius: 5.2, layer: 2, ganzhi: '庚', element: '金', direction: '正西偏南' },
  { name: '酉', angle: -Math.PI / 2 + 19 * Math.PI / 12, radius: 5.2, layer: 2, ganzhi: '酉', element: '金', direction: '正西' },
  { name: '辛', angle: -Math.PI / 2 + 5 * Math.PI / 3, radius: 5.2, layer: 2, ganzhi: '辛', element: '金', direction: '正西偏北' },
  { name: '戌', angle: -Math.PI / 2 + 7 * Math.PI / 4, radius: 5.2, layer: 2, ganzhi: '戌', element: '土', direction: '西北偏西' },
  { name: '乾', angle: -Math.PI / 2 + 11 * Math.PI / 6, radius: 5.2, layer: 2, trigram: '乾为天', element: '金', direction: '西北' },
  { name: '亥', angle: -Math.PI / 2 + 23 * Math.PI / 12, radius: 5.2, layer: 2, ganzhi: '亥', element: '水', direction: '西北偏北' },
];

export const EIGHT_TRIGRAMS: DirectionInfo[] = [
  { name: '坎', angle: -Math.PI / 2, radius: 3.8, layer: 1, trigram: '坎为水', element: '水', direction: '正北' },
  { name: '艮', angle: -Math.PI / 2 + Math.PI / 4, radius: 3.8, layer: 1, trigram: '艮为山', element: '土', direction: '东北' },
  { name: '震', angle: 0, radius: 3.8, layer: 1, trigram: '震为雷', element: '木', direction: '正东' },
  { name: '巽', angle: Math.PI / 4, radius: 3.8, layer: 1, trigram: '巽为风', element: '木', direction: '东南' },
  { name: '离', angle: Math.PI / 2, radius: 3.8, layer: 1, trigram: '离为火', element: '火', direction: '正南' },
  { name: '坤', angle: 3 * Math.PI / 4, radius: 3.8, layer: 1, trigram: '坤为地', element: '土', direction: '西南' },
  { name: '兑', angle: Math.PI, radius: 3.8, layer: 1, trigram: '兑为泽', element: '金', direction: '正西' },
  { name: '乾', angle: -3 * Math.PI / 4, radius: 3.8, layer: 1, trigram: '乾为天', element: '金', direction: '西北' },
];

export const HEAVENLY_STEMS: DirectionInfo[] = [
  { name: '甲', angle: 0, radius: 4.5, layer: 1, ganzhi: '甲', element: '木', direction: '正东' },
  { name: '乙', angle: Math.PI / 4, radius: 4.5, layer: 1, ganzhi: '乙', element: '木', direction: '东南' },
  { name: '丙', angle: Math.PI / 2, radius: 4.5, layer: 1, ganzhi: '丙', element: '火', direction: '正南' },
  { name: '丁', angle: 3 * Math.PI / 4, radius: 4.5, layer: 1, ganzhi: '丁', element: '火', direction: '西南' },
  { name: '庚', angle: Math.PI, radius: 4.5, layer: 1, ganzhi: '庚', element: '金', direction: '正西' },
  { name: '辛', angle: -3 * Math.PI / 4, radius: 4.5, layer: 1, ganzhi: '辛', element: '金', direction: '西北' },
  { name: '壬', angle: -Math.PI / 2, radius: 4.5, layer: 1, ganzhi: '壬', element: '水', direction: '正北' },
  { name: '癸', angle: -Math.PI / 4, radius: 4.5, layer: 1, ganzhi: '癸', element: '水', direction: '东北' },
];

export const EARTHLY_BRANCHES: DirectionInfo[] = [
  { name: '子', angle: -Math.PI / 2, radius: 5.8, layer: 3, ganzhi: '子', element: '水', direction: '正北' },
  { name: '丑', angle: -Math.PI / 3, radius: 5.8, layer: 3, ganzhi: '丑', element: '土', direction: '东北偏北' },
  { name: '寅', angle: -Math.PI / 6, radius: 5.8, layer: 3, ganzhi: '寅', element: '木', direction: '东北偏东' },
  { name: '卯', angle: 0, radius: 5.8, layer: 3, ganzhi: '卯', element: '木', direction: '正东' },
  { name: '辰', angle: Math.PI / 6, radius: 5.8, layer: 3, ganzhi: '辰', element: '土', direction: '东南偏东' },
  { name: '巳', angle: Math.PI / 3, radius: 5.8, layer: 3, ganzhi: '巳', element: '火', direction: '东南偏南' },
  { name: '午', angle: Math.PI / 2, radius: 5.8, layer: 3, ganzhi: '午', element: '火', direction: '正南' },
  { name: '未', angle: 2 * Math.PI / 3, radius: 5.8, layer: 3, ganzhi: '未', element: '土', direction: '西南偏南' },
  { name: '申', angle: 5 * Math.PI / 6, radius: 5.8, layer: 3, ganzhi: '申', element: '金', direction: '西南偏西' },
  { name: '酉', angle: Math.PI, radius: 5.8, layer: 3, ganzhi: '酉', element: '金', direction: '正西' },
  { name: '戌', angle: -5 * Math.PI / 6, radius: 5.8, layer: 3, ganzhi: '戌', element: '土', direction: '西北偏西' },
  { name: '亥', angle: -2 * Math.PI / 3, radius: 5.8, layer: 3, ganzhi: '亥', element: '水', direction: '西北偏北' },
];

export const LAYER_CONFIGS = [
  { innerRadius: 0, outerRadius: 1.2, color: '#D2B48C', y: 0, label: '天池' },
  { innerRadius: 1.2, outerRadius: 2.8, color: '#8B7355', y: 0.3, label: '内盘' },
  { innerRadius: 2.8, outerRadius: 4.4, color: '#A0522D', y: 0.6, label: '中盘' },
  { innerRadius: 4.4, outerRadius: 5.6, color: '#CD853F', y: 0.9, label: '外盘' },
  { innerRadius: 5.6, outerRadius: 6.0, color: '#696969', y: 1.2, label: '最外圈' },
];

export interface ParticleData {
  angle: number;
  radius: number;
  height: number;
  speed: number;
  phase: number;
  size: number;
  flowOffset: number;
}

export class CompassLogic {
  public timeSpeed: number = 1.0;
  public qiStrength: number = 1.0;
  public particleCount: number = 500;
  public flowDirection: FlowDirection = 'clockwise';
  public rotationSpeed: number = 0.02;
  public compassRotation: number = 0;
  public particles: ParticleData[] = [];
  public highlightedName: string | null = null;
  public highlightTime: number = 0;
  public directionLookup: Map<string, DirectionInfo> = new Map();

  constructor() {
    this.initDirectionLookup();
    this.initParticles(500);
  }

  private initDirectionLookup(): void {
    const allDirections = [
      ...TWENTY_FOUR_MOUNTAINS,
      ...EIGHT_TRIGRAMS,
      ...HEAVENLY_STEMS,
      ...EARTHLY_BRANCHES,
    ];
    for (const dir of allDirections) {
      if (!this.directionLookup.has(dir.name)) {
        this.directionLookup.set(dir.name, dir);
      }
    }
  }

  public initParticles(count: number): void {
    this.particles = [];
    for (let i = 0; i < count; i++) {
      this.particles.push({
        angle: Math.random() * Math.PI * 2,
        radius: Math.random() * 12,
        height: (Math.random() - 0.5) * 3,
        speed: 0.2 + Math.random() * 0.6,
        phase: Math.random() * Math.PI * 2,
        size: 0.05 + Math.random() * 0.1,
        flowOffset: Math.random() * Math.PI * 2,
      });
    }
    this.particleCount = count;
  }

  public updateParticles(delta: number): void {
    const scaledDelta = delta * this.timeSpeed;
    const qiFactor = this.qiStrength;
    let flowSign = 1;
    if (this.flowDirection === 'counter') flowSign = -1;

    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      let angularSpeed = p.speed * qiFactor * 0.15;

      if (this.flowDirection === 'opposite') {
        const mod = Math.floor(p.radius / 3) % 2;
        angularSpeed *= (mod === 0 ? 1 : -1);
      } else {
        angularSpeed *= flowSign;
      }

      p.angle += angularSpeed * scaledDelta;
      p.phase += p.speed * scaledDelta * 0.5;

      const spiralFactor = 0.02 * qiFactor;
      p.radius += Math.sin(p.phase) * spiralFactor * scaledDelta * 60;

      if (p.radius < 0.5) p.radius = 0.5 + Math.random() * 0.5;
      if (p.radius > 12) p.radius = 0.5 + Math.random() * 2;

      p.height = Math.sin(p.phase * 0.7 + p.flowOffset) * 1.5 * qiFactor;
    }

    this.compassRotation += this.rotationSpeed * this.timeSpeed * scaledDelta;
  }

  public getParticlePosition(index: number): THREE.Vector3 {
    const p = this.particles[index];
    return new THREE.Vector3(
      Math.cos(p.angle) * p.radius,
      2 + p.height,
      Math.sin(p.angle) * p.radius
    );
  }

  public setTimeSpeed(val: number): void {
    this.timeSpeed = val;
  }

  public setQiStrength(percent: number): void {
    this.qiStrength = percent / 100;
  }

  public setParticleCount(count: number): void {
    if (count !== this.particleCount) {
      this.initParticles(count);
    }
  }

  public setFlowDirection(dir: FlowDirection): void {
    this.flowDirection = dir;
  }

  public setRotationSpeed(speed: number): void {
    this.rotationSpeed = speed;
  }

  public highlightName(name: string): void {
    this.highlightedName = name;
    this.highlightTime = 0.5;
  }

  public updateHighlight(delta: number): void {
    if (this.highlightTime > 0) {
      this.highlightTime -= delta;
      if (this.highlightTime <= 0) {
        this.highlightedName = null;
        this.highlightTime = 0;
      }
    }
  }

  public getHighlightIntensity(): number {
    if (this.highlightTime <= 0) return 0;
    return Math.min(0.8, (this.highlightTime / 0.5) * 0.8);
  }

  public getDirectionInfo(name: string): DirectionInfo | undefined {
    return this.directionLookup.get(name);
  }
}
