import * as THREE from 'three';
import { lerp } from './types';

export class SpectrumAnalyzer {
  private scene: THREE.Scene;
  private group: THREE.Group;
  private analyser: AnalyserNode;
  private dataArray: Uint8Array<ArrayBuffer>;
  
  private bars: THREE.Mesh[] = [];
  private halos: THREE.Mesh[] = [];
  private barGeometry: THREE.BoxGeometry;
  private haloGeometry: THREE.CircleGeometry;
  private barMaterials: THREE.MeshBasicMaterial[] = [];
  private haloMaterials: THREE.MeshBasicMaterial[] = [];
  
  private barCount: number = 512;
  private maxBarCount: number = 512;
  private minBarCount: number = 128;
  private barWidth: number = 0.12;
  private barSpacing: number = 0.04;
  private maxBarHeight: number = 6;
  private barDepth: number = 0.3;
  
  private visible: boolean = false;
  private targetOpacity: number = 0;
  private currentOpacity: number = 0;
  private pulsePhase: number = 0;
  
  private lowColor: THREE.Color = new THREE.Color(0x0066ff);
  private midColor: THREE.Color = new THREE.Color(0x00ffcc);
  private highColor: THREE.Color = new THREE.Color(0xff3366);

  constructor(scene: THREE.Scene, analyser: AnalyserNode) {
    this.scene = scene;
    this.analyser = analyser;
    
    this.analyser.fftSize = this.barCount * 2;
    this.dataArray = new Uint8Array(this.analyser.frequencyBinCount) as Uint8Array<ArrayBuffer>;

    this.group = new THREE.Group();
    this.group.position.set(0, -2, -8);
    this.group.rotation.x = -0.1;
    this.scene.add(this.group);

    this.barGeometry = new THREE.BoxGeometry(1, 1, 1);
    this.haloGeometry = new THREE.CircleGeometry(0.5, 16);

    this.createBars();
    this.group.visible = false;
  }

  private createBars(): void {
    this.clearBars();
    
    const totalWidth = this.barCount * (this.barWidth + this.barSpacing) - this.barSpacing;
    const startX = -totalWidth / 2;

    for (let i = 0; i < this.barCount; i++) {
      const x = startX + i * (this.barWidth + this.barSpacing);
      
      const barMaterial = new THREE.MeshBasicMaterial({
        color: this.getBarColor(i),
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });
      
      const bar = new THREE.Mesh(this.barGeometry, barMaterial);
      bar.scale.set(this.barWidth, 0.01, this.barDepth);
      bar.position.set(x, 0, 0);
      this.group.add(bar);
      
      this.bars.push(bar);
      this.barMaterials.push(barMaterial);
      
      const haloMaterial = new THREE.MeshBasicMaterial({
        color: this.getBarColor(i),
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide
      });
      
      const halo = new THREE.Mesh(this.haloGeometry, haloMaterial);
      halo.scale.set(0, 0, 1);
      halo.position.set(x, 0, this.barDepth / 2 + 0.01);
      halo.rotation.x = -Math.PI / 2;
      this.group.add(halo);
      
      this.halos.push(halo);
      this.haloMaterials.push(haloMaterial);
    }
  }

  private clearBars(): void {
    this.bars.forEach(bar => {
      this.group.remove(bar);
      (bar.material as THREE.Material).dispose();
    });
    this.halos.forEach(halo => {
      this.group.remove(halo);
      (halo.material as THREE.Material).dispose();
    });
    this.bars = [];
    this.halos = [];
    this.barMaterials = [];
    this.haloMaterials = [];
  }

  private getBarColor(index: number): THREE.Color {
    const t = index / this.barCount;
    const color = new THREE.Color();
    
    if (t < 0.5) {
      const localT = t * 2;
      color.r = lerp(this.lowColor.r, this.midColor.r, localT);
      color.g = lerp(this.lowColor.g, this.midColor.g, localT);
      color.b = lerp(this.lowColor.b, this.midColor.b, localT);
    } else {
      const localT = (t - 0.5) * 2;
      color.r = lerp(this.midColor.r, this.highColor.r, localT);
      color.g = lerp(this.midColor.g, this.highColor.g, localT);
      color.b = lerp(this.midColor.b, this.highColor.b, localT);
    }
    
    return color;
  }

  public setVisible(visible: boolean): void {
    if (visible === this.visible) return;
    
    this.visible = visible;
    this.targetOpacity = visible ? 1 : 0;
    
    if (visible) {
      this.group.visible = true;
    }
  }

  public getVisible(): boolean {
    return this.visible;
  }

  public reduceQuality(): void {
    if (this.barCount > this.minBarCount) {
      this.barCount = this.minBarCount;
      this.analyser.fftSize = this.barCount * 2;
      this.dataArray = new Uint8Array(this.analyser.frequencyBinCount) as Uint8Array<ArrayBuffer>;
      this.createBars();
    }
  }

  public restoreQuality(): void {
    if (this.barCount < this.maxBarCount) {
      this.barCount = this.maxBarCount;
      this.analyser.fftSize = this.barCount * 2;
      this.dataArray = new Uint8Array(this.analyser.frequencyBinCount) as Uint8Array<ArrayBuffer>;
      this.createBars();
    }
  }

  public update(deltaTime: number, isPlaying: boolean): void {
    this.pulsePhase += deltaTime * 2;
    this.currentOpacity = lerp(this.currentOpacity, this.targetOpacity, deltaTime * 4);
    
    if (this.currentOpacity < 0.01 && !this.visible) {
      this.group.visible = false;
      return;
    }

    this.analyser.getByteFrequencyData(this.dataArray);

    for (let i = 0; i < this.barCount; i++) {
      const value = this.dataArray[i] / 255;
      const targetHeight = value * this.maxBarHeight * (isPlaying ? 1 : 0.3);
      const currentHeight = this.bars[i].scale.y;
      const newHeight = lerp(currentHeight, targetHeight, deltaTime * 8);
      
      const barPulse = 1 + Math.sin(this.pulsePhase + i * 0.08) * 0.05;
      this.bars[i].scale.y = Math.max(0.01, newHeight * barPulse);
      this.bars[i].position.y = newHeight / 2;
      
      const barOpacity = this.currentOpacity * (0.6 + value * 0.4);
      this.barMaterials[i].opacity = barOpacity;
      
      if (value > 0.1 && isPlaying) {
        const haloScale = this.barWidth * (0.5 + value * 0.5);
        const haloPulse = 1 + Math.sin(this.pulsePhase * 1.3 + i * 0.12) * 0.1;
        this.halos[i].scale.set(haloScale * haloPulse, haloScale * haloPulse, 1);
        this.halos[i].position.y = newHeight;
        this.haloMaterials[i].opacity = this.currentOpacity * value * 0.6;
      } else {
        this.halos[i].scale.set(0, 0, 1);
        this.haloMaterials[i].opacity = 0;
      }
    }
  }

  public getGroup(): THREE.Group {
    return this.group;
  }

  public dispose(): void {
    this.clearBars();
    this.barGeometry.dispose();
    this.haloGeometry.dispose();
  }
}
