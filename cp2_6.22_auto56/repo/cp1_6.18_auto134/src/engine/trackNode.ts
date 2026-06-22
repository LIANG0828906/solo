import * as THREE from 'three';
import { v4 as uuidv4 } from 'uuid';

export enum TrackType {
  GUITAR = 'guitar',
  DRUMS = 'drums',
  BASS = 'bass',
  KEYBOARD = 'keyboard',
  VOCALS = 'vocals',
  SYNTH = 'synth'
}

export interface TrackConfig {
  type: TrackType;
  name: string;
  color: string;
  defaultPosition: { x: number; y: number; z: number };
}

export const TRACK_CONFIGS: TrackConfig[] = [
  { type: TrackType.GUITAR, name: '吉他', color: '#F4A261', defaultPosition: { x: -100, y: 30, z: -50 } },
  { type: TrackType.DRUMS, name: '鼓', color: '#E76F51', defaultPosition: { x: 100, y: 50, z: 80 } },
  { type: TrackType.BASS, name: '贝斯', color: '#2A9D8F', defaultPosition: { x: -80, y: 20, z: 100 } },
  { type: TrackType.KEYBOARD, name: '键盘', color: '#E9C46A', defaultPosition: { x: 80, y: 40, z: -80 } },
  { type: TrackType.VOCALS, name: '人声', color: '#F4A261', defaultPosition: { x: 0, y: 60, z: 0 } },
  { type: TrackType.SYNTH, name: '合成器', color: '#264653', defaultPosition: { x: -30, y: 45, z: -120 } }
];

export class TrackNode {
  public id: string;
  public type: TrackType;
  public name: string;
  public color: string;
  
  public mesh: THREE.Mesh;
  public glow: THREE.Mesh;
  public group: THREE.Group;
  
  private _volume: number = 60;
  private _pitch: number = 0;
  private _speed: number = 1.0;
  private _isSelected: boolean = false;
  private _isDragging: boolean = false;
  
  private baseRadius: number = 50;
  private minRadius: number = 40;
  private maxRadius: number = 70;
  private maxPosition: number = 200;
  
  private targetScale: number = 1;
  private currentScale: number = 1;
  
  constructor(config: TrackConfig) {
    this.id = uuidv4();
    this.type = config.type;
    this.name = config.name;
    this.color = config.color;
    
    this.group = new THREE.Group();
    this.group.position.set(
      config.defaultPosition.x,
      config.defaultPosition.y,
      config.defaultPosition.z
    );
    
    const geometry = new THREE.SphereGeometry(this.baseRadius, 32, 32);
    const material = new THREE.MeshStandardMaterial({
      color: this.color,
      metalness: 0.3,
      roughness: 0.4,
      emissive: this.color,
      emissiveIntensity: 0.2
    });
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.userData.trackId = this.id;
    this.mesh.castShadow = true;
    this.group.add(this.mesh);
    
    const glowGeometry = new THREE.SphereGeometry(this.baseRadius * 1.4, 32, 32);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: this.color,
      transparent: true,
      opacity: 0.3,
      side: THREE.BackSide
    });
    this.glow = new THREE.Mesh(glowGeometry, glowMaterial);
    this.group.add(this.glow);
    
    this.updateScaleForVolume();
  }
  
  get volume(): number {
    return this._volume;
  }
  
  set volume(value: number) {
    this._volume = Math.max(0, Math.min(100, value));
    this.updateScaleForVolume();
  }
  
  get pitch(): number {
    return this._pitch;
  }
  
  set pitch(value: number) {
    this._pitch = Math.max(-5, Math.min(5, value));
  }
  
  get speed(): number {
    return this._speed;
  }
  
  set speed(value: number) {
    this._speed = Math.max(0.5, Math.min(2.0, value));
  }
  
  get isSelected(): boolean {
    return this._isSelected;
  }
  
  set isSelected(value: boolean) {
    this._isSelected = value;
    const material = this.mesh.material as THREE.MeshStandardMaterial;
    material.emissiveIntensity = value ? 0.5 : 0.2;
    
    const glowMaterial = this.glow.material as THREE.MeshBasicMaterial;
    glowMaterial.opacity = value ? 0.5 : 0.3;
  }
  
  get isDragging(): boolean {
    return this._isDragging;
  }
  
  set isDragging(value: boolean) {
    this._isDragging = value;
  }
  
  get position(): THREE.Vector3 {
    return this.group.position;
  }
  
  set position(pos: THREE.Vector3) {
    this.group.position.x = Math.max(-this.maxPosition, Math.min(this.maxPosition, pos.x));
    this.group.position.y = Math.max(-this.maxPosition, Math.min(this.maxPosition, pos.y));
    this.group.position.z = Math.max(-this.maxPosition, Math.min(this.maxPosition, pos.z));
  }
  
  private updateScaleForVolume(): void {
    const t = this._volume / 100;
    const radius = this.minRadius + t * (this.maxRadius - this.minRadius);
    this.targetScale = radius / this.baseRadius;
  }
  
  public update(deltaTime: number): void {
    const lerpFactor = 1 - Math.exp(-deltaTime * 10);
    this.currentScale += (this.targetScale - this.currentScale) * lerpFactor;
    
    this.mesh.scale.setScalar(this.currentScale);
    this.glow.scale.setScalar(this.currentScale * 1.4);
    
    const pulse = Math.sin(Date.now() * 0.003) * 0.05 + 1;
    this.glow.scale.multiplyScalar(pulse);
  }
  
  public getDistanceFromCenter(): number {
    return this.group.position.length();
  }
  
  public getParticleDensityMultiplier(): number {
    const maxDist = Math.sqrt(3) * this.maxPosition;
    const dist = this.getDistanceFromCenter();
    return 1 + (1 - dist / maxDist);
  }
  
  public dispose(): void {
    if (this.mesh.geometry) this.mesh.geometry.dispose();
    if (this.mesh.material) {
      const mat = this.mesh.material as THREE.Material;
      mat.dispose();
    }
    if (this.glow.geometry) this.glow.geometry.dispose();
    if (this.glow.material) {
      const mat = this.glow.material as THREE.Material;
      mat.dispose();
    }
  }
}
