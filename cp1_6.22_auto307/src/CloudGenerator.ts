import { CloudParams, CloudParticle, CloudBounds } from './types';
import * as THREE from 'three';

const TRANSITION_DURATION = 0.5;
const MIN_PARTICLES = 400;
const MAX_PARTICLES = 1200;
const MIN_HUMIDITY = 30;
const MAX_HUMIDITY = 90;
const MIN_TEMP = -10;
const MAX_TEMP = 30;
const MIN_UPDRAFT = 1;
const MAX_UPDRAFT = 10;
const MIN_Y_RANGE = 2;
const MAX_Y_RANGE = 8;
const CLOUD_RADIUS = 6;

export class CloudGenerator {
  private particles: CloudParticle[] = [];
  private currentParams: CloudParams;
  private targetParams: CloudParams;
  private transitionProgress = 1;
  private particleIdCounter = 0;

  constructor(initialParams: CloudParams) {
    this.currentParams = { ...initialParams };
    this.targetParams = { ...initialParams };
    this.generateParticles();
  }

  setParams(params: CloudParams): void {
    this.targetParams = { ...params };
    this.transitionProgress = 0;
    this.updateTargetParticles();
  }

  getParams(): CloudParams {
    return { ...this.currentParams };
  }

  update(deltaTime: number): void {
    if (this.transitionProgress < 1) {
      this.transitionProgress = Math.min(1, this.transitionProgress + deltaTime / TRANSITION_DURATION);
      this.interpolateParams();
    }

    const smoothSpeed = 2 * deltaTime;
    this.particles.forEach((p) => {
      p.x += (p.targetX - p.x) * smoothSpeed;
      p.y += (p.targetY - p.y) * smoothSpeed;
      p.z += (p.targetZ - p.z) * smoothSpeed;
      p.radius += (p.targetRadius - p.radius) * smoothSpeed;
      p.opacity += (p.targetOpacity - p.opacity) * smoothSpeed;
      p.color = this.interpolateColor(p.color, p.targetColor, smoothSpeed);
    });
  }

  getParticles(): CloudParticle[] {
    return this.particles;
  }

  getCloudBounds(): CloudBounds {
    if (this.particles.length === 0) {
      return {
        minY: 0, maxY: 0, minX: 0, maxX: 0, minZ: 0, maxZ: 0,
        centerX: 0, centerY: 0, centerZ: 0,
      };
    }

    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;
    let minZ = Infinity, maxZ = -Infinity;

    this.particles.forEach((p) => {
      minX = Math.min(minX, p.x - p.radius);
      maxX = Math.max(maxX, p.x + p.radius);
      minY = Math.min(minY, p.y - p.radius);
      maxY = Math.max(maxY, p.y + p.radius);
      minZ = Math.min(minZ, p.z - p.radius);
      maxZ = Math.max(maxZ, p.z + p.radius);
    });

    return {
      minX, maxX, minY, maxY, minZ, maxZ,
      centerX: (minX + maxX) / 2,
      centerY: (minY + maxY) / 2,
      centerZ: (minZ + maxZ) / 2,
    };
  }

  private generateParticles(): void {
    const targetCount = this.calculateParticleCount(this.targetParams.humidity);
    this.particles = [];

    for (let i = 0; i < targetCount; i++) {
      const particle = this.createParticle(i);
      this.particles.push(particle);
    }
  }

  private updateTargetParticles(): void {
    const targetCount = this.calculateParticleCount(this.targetParams.humidity);
    const color = this.calculateColor(this.targetParams.temperature);
    const yRange = this.calculateYRange(this.targetParams.updraft);
    const baseY = 4 + yRange / 2;

    while (this.particles.length < targetCount) {
      this.particles.push(this.createParticle(this.particleIdCounter++));
    }

    while (this.particles.length > targetCount) {
      this.particles.pop();
    }

    this.particles.forEach((p, i) => {
      const pos = this.calculateParticlePosition(i, targetCount, yRange, baseY);
      p.targetX = pos.x;
      p.targetY = pos.y;
      p.targetZ = pos.z;
      p.targetRadius = 0.3 + Math.random() * 0.9;
      p.targetColor = color;
      p.targetOpacity = 0.4 + Math.random() * 0.4;
    });
  }

  private createParticle(id: number): CloudParticle {
    const count = this.calculateParticleCount(this.currentParams.humidity);
    const yRange = this.calculateYRange(this.currentParams.updraft);
    const baseY = 4 + yRange / 2;
    const color = this.calculateColor(this.currentParams.temperature);
    const pos = this.calculateParticlePosition(id, count, yRange, baseY);
    const radius = 0.3 + Math.random() * 0.9;
    const opacity = 0.4 + Math.random() * 0.4;

    return {
      id,
      x: pos.x,
      y: pos.y,
      z: pos.z,
      radius,
      color,
      opacity,
      targetX: pos.x,
      targetY: pos.y,
      targetZ: pos.z,
      targetRadius: radius,
      targetColor: color,
      targetOpacity: opacity,
    };
  }

  private calculateParticlePosition(
    index: number,
    total: number,
    yRange: number,
    baseY: number
  ): { x: number; y: number; z: number } {
    const phi = Math.acos(-1 + (2 * index) / total);
    const theta = Math.sqrt(total * Math.PI) * phi;

    const r = CLOUD_RADIUS * Math.cbrt(Math.random());
    const x = r * Math.sin(phi) * Math.cos(theta);
    const z = r * Math.sin(phi) * Math.sin(theta);
    const yOffset = (Math.random() - 0.5) * yRange;
    const y = baseY + yOffset;

    return { x, y, z };
  }

  private calculateParticleCount(humidity: number): number {
    const normalized = (humidity - MIN_HUMIDITY) / (MAX_HUMIDITY - MIN_HUMIDITY);
    return Math.round(MIN_PARTICLES + normalized * (MAX_PARTICLES - MIN_PARTICLES));
  }

  private calculateYRange(updraft: number): number {
    const normalized = (updraft - MIN_UPDRAFT) / (MAX_UPDRAFT - MIN_UPDRAFT);
    return MIN_Y_RANGE + normalized * (MAX_Y_RANGE - MIN_Y_RANGE);
  }

  private calculateColor(temperature: number): string {
    const normalized = (temperature - MIN_TEMP) / (MAX_TEMP - MIN_TEMP);
    const coldColor = new THREE.Color(0xffffff);
    const warmColor = new THREE.Color(0x9e9e9e);
    const result = coldColor.clone().lerp(warmColor, normalized);
    return `#${result.getHexString()}`;
  }

  private interpolateColor(current: string, target: string, t: number): string {
    const currentColor = new THREE.Color(current);
    const targetColor = new THREE.Color(target);
    const result = currentColor.clone().lerp(targetColor, t);
    return `#${result.getHexString()}`;
  }

  private interpolateParams(): void {
    const t = this.easeInOutCubic(this.transitionProgress);
    this.currentParams.humidity = this.lerp(this.currentParams.humidity, this.targetParams.humidity, t);
    this.currentParams.temperature = this.lerp(this.currentParams.temperature, this.targetParams.temperature, t);
    this.currentParams.updraft = this.lerp(this.currentParams.updraft, this.targetParams.updraft, t);
  }

  private lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t;
  }

  private easeInOutCubic(t: number): number {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }
}
