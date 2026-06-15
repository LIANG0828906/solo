import * as THREE from 'three';
import type { TemperaturePoint } from './types';

interface RippleEffect {
  center: { x: number; y: number };
  startTime: number;
  duration: number;
  maxRadius: number;
}

export class HeatmapRenderer {
  private scene: THREE.Scene;
  private earthRadius: number;
  private heatmapMesh: THREE.Mesh | null = null;
  private heatmapCanvas: HTMLCanvasElement;
  private heatmapTexture: THREE.CanvasTexture;
  private currentData: TemperaturePoint[] = [];
  private targetData: TemperaturePoint[] = [];
  private transitionProgress: number = 1;
  private transitionStart: number = 0;
  private transitionDuration: number = 500;
  private ripples: RippleEffect[] = [];
  private opacity: number = 0.7;
  private gridWidth: number = 180;
  private gridHeight: number = 90;
  private temperatureGrid: Float32Array;
  private targetGrid: Float32Array;

  constructor(scene: THREE.Scene, earthRadius: number) {
    this.scene = scene;
    this.earthRadius = earthRadius;
    
    this.temperatureGrid = new Float32Array(this.gridWidth * this.gridHeight);
    this.targetGrid = new Float32Array(this.gridWidth * this.gridHeight);
    
    this.heatmapCanvas = document.createElement('canvas');
    this.heatmapCanvas.width = this.gridWidth * 4;
    this.heatmapCanvas.height = this.gridHeight * 4;
    
    this.heatmapTexture = new THREE.CanvasTexture(this.heatmapCanvas);
    this.heatmapTexture.wrapS = THREE.RepeatWrapping;
    this.heatmapTexture.wrapT = THREE.ClampToEdgeWrapping;
    
    this.createMesh();
    this.initializeDefaultData();
  }

  private createMesh(): void {
    const geometry = new THREE.SphereGeometry(this.earthRadius * 1.001, 64, 32);
    const material = new THREE.MeshBasicMaterial({
      map: this.heatmapTexture,
      transparent: true,
      opacity: this.opacity,
      depthWrite: false
    });
    this.heatmapMesh = new THREE.Mesh(geometry, material);
    this.scene.add(this.heatmapMesh);
  }

  private initializeDefaultData(): void {
    for (let i = 0; i < this.gridWidth * this.gridHeight; i++) {
      const lat = 90 - (Math.floor(i / this.gridWidth) / this.gridHeight) * 180;
      const baseTemp = 32 - Math.abs(lat) * 0.6 + (Math.random() - 0.5) * 4;
      this.temperatureGrid[i] = Math.max(0, Math.min(32, baseTemp));
      this.targetGrid[i] = this.temperatureGrid[i];
    }
    this.renderHeatmap();
  }

  private temperatureToColor(temp: number): { r: number; g: number; b: number } {
    const t = Math.max(0, Math.min(32, temp)) / 32;
    
    if (t < 0.2) {
      const tt = t / 0.2;
      return { r: 0, g: 0.1 + tt * 0.2, b: 0.4 + tt * 0.6 };
    } else if (t < 0.4) {
      const tt = (t - 0.2) / 0.2;
      return { r: 0, g: 0.3 + tt * 0.4, b: 1 - tt * 0.3 };
    } else if (t < 0.6) {
      const tt = (t - 0.4) / 0.2;
      return { r: tt * 0.3, g: 0.7 + tt * 0.3, b: 0.7 - tt * 0.5 };
    } else if (t < 0.8) {
      const tt = (t - 0.6) / 0.2;
      return { r: 0.3 + tt * 0.7, g: 1 - tt * 0.3, b: 0.2 - tt * 0.2 };
    } else {
      const tt = (t - 0.8) / 0.2;
      return { r: 1, g: 0.7 - tt * 0.5, b: 0 };
    }
  }

  private lngLatToGrid(lng: number, lat: number): { x: number; y: number } {
    const x = ((lng + 180) / 360) * this.gridWidth;
    const y = ((90 - lat) / 180) * this.gridHeight;
    return { x: Math.floor(x), y: Math.floor(y) };
  }

  updateTemperatureData(data: TemperaturePoint[]): void {
    this.targetData = data;
    
    for (let i = 0; i < this.gridWidth * this.gridHeight; i++) {
      this.targetGrid[i] = this.temperatureGrid[i];
    }
    
    for (const point of data) {
      const grid = this.lngLatToGrid(point.lng, point.lat);
      if (grid.x >= 0 && grid.x < this.gridWidth && grid.y >= 0 && grid.y < this.gridHeight) {
        const idx = grid.y * this.gridWidth + grid.x;
        this.targetGrid[idx] = point.temperature;
        
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const nx = grid.x + dx;
            const ny = grid.y + dy;
            if (nx >= 0 && nx < this.gridWidth && ny >= 0 && ny < this.gridHeight) {
              const nidx = ny * this.gridWidth + nx;
              const dist = Math.sqrt(dx * dx + dy * dy);
              const weight = 1 - dist / 2.5;
              if (weight > 0) {
                this.targetGrid[nidx] = this.targetGrid[nidx] * (1 - weight * 0.5) + point.temperature * weight * 0.5;
              }
            }
          }
        }
      }
    }
    
    this.transitionProgress = 0;
    this.transitionStart = performance.now();
    
    if (data.length > 0) {
      const hotPoints = [...data].sort((a, b) => b.temperature - a.temperature).slice(0, 5);
      for (const point of hotPoints) {
        const canvasW = this.heatmapCanvas.width;
        const canvasH = this.heatmapCanvas.height;
        this.ripples.push({
          center: { x: ((point.lng + 180) / 360) * canvasW, y: ((90 - point.lat) / 180) * canvasH },
          startTime: performance.now(),
          duration: 600,
          maxRadius: 100
        });
      }
    }
  }

  private renderHeatmap(): void {
    const ctx = this.heatmapCanvas.getContext('2d');
    if (!ctx) return;
    
    const canvasW = this.heatmapCanvas.width;
    const canvasH = this.heatmapCanvas.height;
    const cellW = canvasW / this.gridWidth;
    const cellH = canvasH / this.gridHeight;
    
    ctx.clearRect(0, 0, canvasW, canvasH);
    
    for (let y = 0; y < this.gridHeight; y++) {
      for (let x = 0; x < this.gridWidth; x++) {
        const idx = y * this.gridWidth + x;
        const temp = this.temperatureGrid[idx];
        const color = this.temperatureToColor(temp);
        
        ctx.fillStyle = `rgba(${Math.floor(color.r * 255)}, ${Math.floor(color.g * 255)}, ${Math.floor(color.b * 255)}, 1.0)`;
        ctx.fillRect(Math.floor(x * cellW), Math.floor(y * cellH), Math.ceil(cellW) + 1, Math.ceil(cellH) + 1);
      }
    }
    
    const now = performance.now();
    this.ripples = this.ripples.filter(ripple => {
      const elapsed = now - ripple.startTime;
      if (elapsed >= ripple.duration) return false;
      
      const progress = elapsed / ripple.duration;
      const radius = progress * ripple.maxRadius;
      const alpha = (1 - progress) * 0.6;
      
      const gradient = ctx.createRadialGradient(
        ripple.center.x, ripple.center.y, 0,
        ripple.center.x, ripple.center.y, radius
      );
      gradient.addColorStop(0, `rgba(255, 255, 255, ${alpha})`);
      gradient.addColorStop(0.5, `rgba(255, 200, 100, ${alpha * 0.5})`);
      gradient.addColorStop(1, 'rgba(255, 150, 50, 0)');
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(ripple.center.x, ripple.center.y, radius, 0, Math.PI * 2);
      ctx.fill();
      
      return true;
    });
    
    this.heatmapTexture.needsUpdate = true;
  }

  update(time: number): void {
    if (this.transitionProgress < 1) {
      const elapsed = time - this.transitionStart;
      this.transitionProgress = Math.min(1, elapsed / this.transitionDuration);
      const t = this.easeInOutCubic(this.transitionProgress);
      
      for (let i = 0; i < this.gridWidth * this.gridHeight; i++) {
        const currentIdx = Math.floor(i / this.gridWidth) * this.gridWidth + (i % this.gridWidth);
        this.temperatureGrid[i] = this.temperatureGrid[i] * (1 - t) + this.targetGrid[i] * t;
      }
      
      this.renderHeatmap();
    }
    
    if (this.ripples.length > 0 && this.transitionProgress >= 1) {
      this.renderHeatmap();
    }
  }

  private easeInOutCubic(t: number): number {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  setOpacity(opacity: number): void {
    this.opacity = Math.max(0.2, Math.min(1.0, opacity));
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
