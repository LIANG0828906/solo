import {
  Mesh,
  PlaneGeometry,
  CanvasTexture,
  MeshBasicMaterial,
  Color,
  Vector3,
  DoubleSide,
} from 'three';
import { Particle } from './types';

export class HeatmapLayer {
  private gridSize: number = 16;
  private worldSize: number;
  private worldCenter: Vector3;
  
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private imageData: ImageData;
  private texture: CanvasTexture;
  private geometry: PlaneGeometry;
  private material: MeshBasicMaterial;
  private mesh: Mesh;
  
  private intensityGrid: Float32Array;
  private colorMap: Color[];
  
  private tempColor: Color = new Color();
  
  constructor(worldSize: number = 200, worldCenter: Vector3 = new Vector3(0, 0, 0)) {
    this.worldSize = worldSize;
    this.worldCenter = worldCenter;
    
    this.canvas = document.createElement('canvas');
    this.canvas.width = this.gridSize;
    this.canvas.height = this.gridSize;
    
    const ctx = this.canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Could not get 2D context');
    }
    this.ctx = ctx;
    
    this.imageData = this.ctx.createImageData(this.gridSize, this.gridSize);
    
    this.intensityGrid = new Float32Array(this.gridSize * this.gridSize);
    
    this.colorMap = this.createColorMap();
    
    this.texture = new CanvasTexture(this.canvas);
    this.texture.needsUpdate = true;
    
    this.geometry = new PlaneGeometry(worldSize, worldSize);
    this.material = new MeshBasicMaterial({
      map: this.texture,
      transparent: true,
      opacity: 0.6,
      side: DoubleSide,
      depthWrite: false,
    });
    
    this.mesh = new Mesh(this.geometry, this.material);
    this.mesh.rotation.x = -Math.PI / 2;
    this.mesh.position.set(worldCenter.x, 0.01, worldCenter.z);
  }
  
  private createColorMap(): Color[] {
    const colors: Color[] = [];
    const startColor = new Color(0x000080);
    const endColor = new Color(0xFF0040);
    
    for (let i = 0; i < 256; i++) {
      const t = i / 255;
      const color = new Color().lerpColors(startColor, endColor, t);
      colors.push(color);
    }
    
    return colors;
  }
  
  update(particles: Particle[]): void {
    this.intensityGrid.fill(0);
    
    const halfWorld = this.worldSize / 2;
    const cellSize = this.worldSize / this.gridSize;
    
    for (const particle of particles) {
      if (particle.position.y > 5) continue;
      
      const localX = particle.position.x - (this.worldCenter.x - halfWorld);
      const localZ = particle.position.z - (this.worldCenter.z - halfWorld);
      
      if (localX < 0 || localX >= this.worldSize || localZ < 0 || localZ >= this.worldSize) continue;
      
      const gridX = Math.floor(localX / cellSize);
      const gridZ = Math.floor(localZ / cellSize);
      
      const heightFactor = Math.max(0, 1 - particle.position.y / 5);
      const intensity = particle.alpha * heightFactor;
      
      const radius = 2;
      
      for (let dx = -radius; dx <= radius; dx++) {
        for (let dz = -radius; dz <= radius; dz++) {
          const gx = gridX + dx;
          const gz = gridZ + dz;
          
          if (gx < 0 || gx >= this.gridSize || gz < 0 || gz >= this.gridSize) continue;
          
          const dist = Math.sqrt(dx * dx + dz * dz);
          if (dist > radius) continue;
          
          const falloff = 1 - dist / radius;
          const idx = gz * this.gridSize + gx;
          this.intensityGrid[idx] += intensity * falloff * 0.1;
        }
      }
    }
    
    const decay = 0.95;
    for (let i = 0; i < this.intensityGrid.length; i++) {
      this.intensityGrid[i] = Math.min(1, this.intensityGrid[i]) * decay;
    }
    
    this.updateTexture();
  }
  
  private updateTexture(): void {
    const data = this.imageData.data;
    
    for (let z = 0; z < this.gridSize; z++) {
      for (let x = 0; x < this.gridSize; x++) {
        const gridIdx = z * this.gridSize + x;
        const pixelIdx = (z * this.gridSize + x) * 4;
        
        const intensity = Math.min(1, this.intensityGrid[gridIdx]);
        const colorIdx = Math.floor(intensity * 255);
        
        const color = this.colorMap[colorIdx];
        
        data[pixelIdx] = Math.floor(color.r * 255);
        data[pixelIdx + 1] = Math.floor(color.g * 255);
        data[pixelIdx + 2] = Math.floor(color.b * 255);
        data[pixelIdx + 3] = intensity > 0.01 ? Math.floor(intensity * 200 + 55) : 0;
      }
    }
    
    this.ctx.putImageData(this.imageData, 0, 0);
    this.texture.needsUpdate = true;
  }
  
  getIntensityAt(x: number, z: number): number {
    const halfWorld = this.worldSize / 2;
    const cellSize = this.worldSize / this.gridSize;
    
    const localX = x - (this.worldCenter.x - halfWorld);
    const localZ = z - (this.worldCenter.z - halfWorld);
    
    if (localX < 0 || localX >= this.worldSize || localZ < 0 || localZ >= this.worldSize) {
      return 0;
    }
    
    const gridX = Math.floor(localX / cellSize);
    const gridZ = Math.floor(localZ / cellSize);
    
    return this.intensityGrid[gridZ * this.gridSize + gridX];
  }
  
  getMesh(): Mesh {
    return this.mesh;
  }
}
