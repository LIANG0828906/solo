import * as THREE from 'three';
import type { TemperaturePoint } from './types';

interface RippleEffect {
  center: { x: number; y: number };
  startTime: number;
  duration: number;
  maxRadius: number;
  strength: number;
}

export class HeatmapRenderer {
  private scene: THREE.Scene;
  private earthRadius: number;
  private heatmapMesh: THREE.Mesh | null = null;
  private heatmapCanvas: HTMLCanvasElement;
  private heatmapTexture: THREE.CanvasTexture;
  private transitionProgress: number = 1;
  private transitionStart: number = 0;
  private transitionDuration: number = 500;
  private ripples: RippleEffect[] = [];
  private opacity: number = 0.7;
  private gridWidth: number = 180;
  private gridHeight: number = 90;
  private temperatureGrid: Float32Array;
  private targetGrid: Float32Array;
  private initialGrid: Float32Array;
  private lastRenderTime: number = 0;
  private minRenderInterval: number = 16;

  constructor(scene: THREE.Scene, earthRadius: number) {
    this.scene = scene;
    this.earthRadius = earthRadius;
    
    this.temperatureGrid = new Float32Array(this.gridWidth * this.gridHeight);
    this.targetGrid = new Float32Array(this.gridWidth * this.gridHeight);
    this.initialGrid = new Float32Array(this.gridWidth * this.gridHeight);
    
    this.heatmapCanvas = document.createElement('canvas');
    this.heatmapCanvas.width = this.gridWidth * 4;
    this.heatmapCanvas.height = this.gridHeight * 4;
    
    this.heatmapTexture = new THREE.CanvasTexture(this.heatmapCanvas);
    this.heatmapTexture.wrapS = THREE.RepeatWrapping;
    this.heatmapTexture.wrapT = THREE.ClampToEdgeWrapping;
    this.heatmapTexture.minFilter = THREE.LinearFilter;
    this.heatmapTexture.magFilter = THREE.LinearFilter;
    
    this.createMesh();
    this.initializeDefaultData();
  }

  private createMesh(): void {
    const geometry = new THREE.SphereGeometry(this.earthRadius * 1.0015, 96, 48);
    const material = new THREE.MeshBasicMaterial({
      map: this.heatmapTexture,
      transparent: true,
      opacity: this.opacity,
      depthWrite: false,
      blending: THREE.NormalBlending
    });
    this.heatmapMesh = new THREE.Mesh(geometry, material);
    this.scene.add(this.heatmapMesh);
  }

  private initializeDefaultData(): void {
    for (let i = 0; i < this.gridWidth * this.gridHeight; i++) {
      const y = Math.floor(i / this.gridWidth);
      const lat = 90 - (y / (this.gridHeight - 1)) * 180;
      const baseTemp = 32 - Math.abs(lat) * 0.58 + (Math.random() - 0.5) * 3;
      const temp = Math.max(0, Math.min(32, baseTemp));
      this.temperatureGrid[i] = temp;
      this.targetGrid[i] = temp;
      this.initialGrid[i] = temp;
    }
    this.renderHeatmap();
  }

  private temperatureToColor(temp: number): { r: number; g: number; b: number } {
    const t = Math.max(0, Math.min(32, temp)) / 32;
    
    if (t < 0.15) {
      const tt = t / 0.15;
      return { r: 0.02, g: 0.05 + tt * 0.15, b: 0.25 + tt * 0.55 };
    } else if (t < 0.35) {
      const tt = (t - 0.15) / 0.2;
      return { r: 0.0 + tt * 0.15, g: 0.20 + tt * 0.50, b: 0.80 - tt * 0.15 };
    } else if (t < 0.50) {
      const tt = (t - 0.35) / 0.15;
      return { r: 0.15 + tt * 0.35, g: 0.70 + tt * 0.25, b: 0.65 - tt * 0.35 };
    } else if (t < 0.65) {
      const tt = (t - 0.50) / 0.15;
      return { r: 0.50 + tt * 0.40, g: 0.95 - tt * 0.10, b: 0.30 - tt * 0.20 };
    } else if (t < 0.82) {
      const tt = (t - 0.65) / 0.17;
      return { r: 0.90 + tt * 0.10, g: 0.85 - tt * 0.35, b: 0.10 - tt * 0.08 };
    } else {
      const tt = (t - 0.82) / 0.18;
      return { r: 1.0, g: 0.50 - tt * 0.40, b: 0.02 + tt * 0.0 };
    }
  }

  private lngLatToGrid(lng: number, lat: number): { x: number; y: number } {
    const x = ((lng + 180) / 360) * this.gridWidth;
    const y = ((90 - lat) / 180) * this.gridHeight;
    return { x: Math.floor(x), y: Math.floor(y) };
  }

  updateTemperatureData(data: TemperaturePoint[]): void {
    this.initialGrid.set(this.temperatureGrid);
    this.targetGrid.set(this.temperatureGrid);
    
    for (const point of data) {
      const grid = this.lngLatToGrid(point.lng, point.lat);
      if (grid.x >= 0 && grid.x < this.gridWidth && grid.y >= 0 && grid.y < this.gridHeight) {
        const idx = grid.y * this.gridWidth + grid.x;
        this.targetGrid[idx] = point.temperature;
        
        for (let dy = -2; dy <= 2; dy++) {
          for (let dx = -2; dx <= 2; dx++) {
            const nx = grid.x + dx;
            const ny = grid.y + dy;
            if (nx >= 0 && nx < this.gridWidth && ny >= 0 && ny < this.gridHeight) {
              const nidx = ny * this.gridWidth + nx;
              const dist = Math.sqrt(dx * dx + dy * dy);
              const weight = Math.max(0, 1 - dist / 3.5);
              if (weight > 0) {
                this.targetGrid[nidx] = this.targetGrid[nidx] * (1 - weight * 0.45) + point.temperature * weight * 0.45;
              }
            }
          }
        }
      }
    }
    
    this.transitionProgress = 0;
    this.transitionStart = performance.now();
    
    if (data.length > 0) {
      const sortedData = [...data].sort((a, b) => b.temperature - a.temperature);
      const hotPoints = sortedData.slice(0, 6);
      const coldPoints = sortedData.slice(-4).reverse();
      const ripplePoints = [...hotPoints, ...coldPoints.slice(0, 2)];
      
      for (const point of ripplePoints) {
        const canvasW = this.heatmapCanvas.width;
        const canvasH = this.heatmapCanvas.height;
        this.ripples.push({
          center: { x: ((point.lng + 180) / 360) * canvasW, y: ((90 - point.lat) / 180) * canvasH },
          startTime: performance.now(),
          duration: 600,
          maxRadius: 100,
          strength: point.temperature > 20 ? 0.7 : 0.5
        });
      }
    }
    
    this.renderHeatmap();
  }

  private renderHeatmap(): void {
    const ctx = this.heatmapCanvas.getContext('2d');
    if (!ctx) return;
    
    const canvasW = this.heatmapCanvas.width;
    const canvasH = this.heatmapCanvas.height;
    const cellW = canvasW / this.gridWidth;
    const cellH = canvasH / this.gridHeight;
    
    const imageData = ctx.createImageData(canvasW, canvasH);
    const data = imageData.data;
    
    for (let y = 0; y < this.gridHeight; y++) {
      for (let x = 0; x < this.gridWidth; x++) {
        const idx = y * this.gridWidth + x;
        const temp = this.temperatureGrid[idx];
        const color = this.temperatureToColor(temp);
        
        const px0 = Math.floor(x * cellW);
        const py0 = Math.floor(y * cellH);
        const px1 = Math.ceil((x + 1) * cellW);
        const py1 = Math.ceil((y + 1) * cellH);
        
        const r = Math.floor(color.r * 255);
        const g = Math.floor(color.g * 255);
        const b = Math.floor(color.b * 255);
        const a = 255;
        
        for (let py = py0; py < py1 && py < canvasH; py++) {
          for (let px = px0; px < px1 && px < canvasW; px++) {
            const pidx = (py * canvasW + px) * 4;
            data[pidx] = r;
            data[pidx + 1] = g;
            data[pidx + 2] = b;
            data[pidx + 3] = a;
          }
        }
      }
    }
    
    ctx.putImageData(imageData, 0, 0);
    
    const now = performance.now();
    this.ripples = this.ripples.filter(ripple => {
      const elapsed = now - ripple.startTime;
      if (elapsed >= ripple.duration) return false;
      
      const progress = elapsed / ripple.duration;
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      const radius = easedProgress * ripple.maxRadius;
      const alpha = (1 - progress) * 0.55 * ripple.strength;
      
      const gradient = ctx.createRadialGradient(
        ripple.center.x, ripple.center.y, 0,
        ripple.center.x, ripple.center.y, radius
      );
      gradient.addColorStop(0, `rgba(255, 255, 255, ${alpha})`);
      gradient.addColorStop(0.35, `rgba(255, 220, 130, ${alpha * 0.55})`);
      gradient.addColorStop(0.7, `rgba(255, 170, 70, ${alpha * 0.25})`);
      gradient.addColorStop(1, 'rgba(255, 130, 40, 0)');
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(ripple.center.x, ripple.center.y, radius, 0, Math.PI * 2);
      ctx.fill();
      
      if (progress > 0.25 && progress < 0.85) {
        const ringRadius = radius * 0.65;
        const ringWidth = Math.max(2, radius * 0.12);
        const ringAlpha = (1 - Math.abs(progress - 0.55) / 0.3) * alpha * 0.6;
        
        ctx.strokeStyle = `rgba(255, 240, 200, ${ringAlpha})`;
        ctx.lineWidth = ringWidth;
        ctx.beginPath();
        ctx.arc(ripple.center.x, ripple.center.y, ringRadius, 0, Math.PI * 2);
        ctx.stroke();
      }
      
      return true;
    });
    
    this.heatmapTexture.needsUpdate = true;
  }

  update(time: number): void {
    let needsRender = false;
    
    if (this.transitionProgress < 1) {
      const elapsed = time - this.transitionStart;
      this.transitionProgress = Math.min(1, elapsed / this.transitionDuration);
      const t = this.easeInOutCubic(this.transitionProgress);
      
      for (let i = 0; i < this.gridWidth * this.gridHeight; i++) {
        this.temperatureGrid[i] = this.initialGrid[i] * (1 - t) + this.targetGrid[i] * t;
      }
      needsRender = true;
    }
    
    if (this.ripples.length > 0) {
      needsRender = true;
    }
    
    const now = performance.now();
    if (needsRender && (now - this.lastRenderTime >= this.minRenderInterval)) {
      this.renderHeatmap();
      this.lastRenderTime = now;
    }
  }

  private easeInOutCubic(t: number): number {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  setOpacity(opacity: number): void {
    const clamped = Math.max(0.2, Math.min(1.0, opacity));
    if (Math.abs(this.opacity - clamped) < 0.01) return;
    
    this.opacity = clamped;
    if (this.heatmapMesh) {
      (this.heatmapMesh.material as THREE.MeshBasicMaterial).opacity = this.opacity;
    }
  }

  getOpacity(): number {
    return this.opacity;
  }

  getTemperatureAt(lat: number, lng: number): number {
    const grid = this.lngLatToGrid(lng, lat);
    if (grid.x >= 0 && grid.x < this.gridWidth && grid.y >= 0 && grid.y < this.gridHeight) {
      const idx = grid.y * this.gridWidth + grid.x;
      return this.temperatureGrid[idx];
    }
    return 0;
  }

  dispose(): void {
    if (this.heatmapMesh) {
      this.scene.remove(this.heatmapMesh);
      this.heatmapMesh.geometry.dispose();
      (this.heatmapMesh.material as THREE.Material).dispose();
    }
    this.heatmapTexture.dispose();
  }
}
