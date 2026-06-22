import * as THREE from 'three';
import {
  clamp,
  getShichenFromTime,
  SHICHEN_LIST
} from './utils';

export interface SundialState {
  currentHour: number;
  currentMinute: number;
  season: '春' | '夏' | '秋' | '冬';
  isDayMode: boolean;
  shadowAngle: number;
  currentShichen: string;
}

const DIAL_RADIUS = 3;
const DIAL_THICKNESS = 0.3;
const GNOMON_HEIGHT = 4;
const SHADOW_LENGTH = GNOMON_HEIGHT * 1.5;

export class Sundial {
  public group: THREE.Group;
  public state: SundialState;

  private dialMesh!: THREE.Mesh;
  private dialRimMesh!: THREE.Mesh;
  private gnomonMesh!: THREE.Mesh;
  private shadowMesh!: THREE.Mesh;
  private markGroup!: THREE.Group;
  private dialMaterial!: THREE.MeshStandardMaterial;
  private gnomonMaterial!: THREE.MeshStandardMaterial;

  constructor() {
    this.group = new THREE.Group();
    this.state = {
      currentHour: 12,
      currentMinute: 0,
      season: '夏',
      isDayMode: false,
      shadowAngle: 0,
      currentShichen: '午时'
    };

    this.createDial();
    this.createGnomon();
    this.createShadow();
    this.createMarks();
    this.updateShadow();
  }

  private createDial(): void {
    const dialGeometry = new THREE.CylinderGeometry(
      DIAL_RADIUS,
      DIAL_RADIUS,
      DIAL_THICKNESS,
      64
    );

    this.dialMaterial = new THREE.MeshStandardMaterial({
      color: 0xB87333,
      metalness: 0.7,
      roughness: 0.35
    });

    this.dialMesh = new THREE.Mesh(dialGeometry, this.dialMaterial);
    this.dialMesh.position.y = 0;
    this.dialMesh.receiveShadow = true;
    this.group.add(this.dialMesh);

    const rimGeometry = new THREE.TorusGeometry(DIAL_RADIUS, 0.05, 16, 64);
    const rimMaterial = new THREE.MeshStandardMaterial({
      color: 0xDAA520,
      metalness: 0.9,
      roughness: 0.2
    });

    this.dialRimMesh = new THREE.Mesh(rimGeometry, rimMaterial);
    this.dialRimMesh.rotation.x = Math.PI / 2;
    this.dialRimMesh.position.y = DIAL_THICKNESS / 2 + 0.02;
    this.group.add(this.dialRimMesh);
  }

  private createGnomon(): void {
    const gnomonHeight = GNOMON_HEIGHT;
    const gnomonRadius = 0.08;

    const gnomonGeometry = new THREE.ConeGeometry(gnomonRadius, gnomonHeight, 8);
    this.gnomonMaterial = new THREE.MeshStandardMaterial({
      color: 0xC0C0C0,
      metalness: 0.6,
      roughness: 0.4
    });

    this.gnomonMesh = new THREE.Mesh(gnomonGeometry, this.gnomonMaterial);
    this.gnomonMesh.position.y = DIAL_THICKNESS / 2 + gnomonHeight / 2;
    this.gnomonMesh.castShadow = true;
    this.group.add(this.gnomonMesh);
  }

  private createShadow(): void {
    const shadowShape = new THREE.Shape();
    shadowShape.moveTo(-0.1, 0);
    shadowShape.lineTo(0.1, 0);
    shadowShape.lineTo(0.3, SHADOW_LENGTH);
    shadowShape.lineTo(-0.3, SHADOW_LENGTH);
    shadowShape.lineTo(-0.1, 0);

    const shadowGeometry = new THREE.ShapeGeometry(shadowShape);

    const shadowMaterial = new THREE.MeshBasicMaterial({
      color: 0x1A1A1A,
      transparent: true,
      opacity: 0.7,
      side: THREE.DoubleSide,
      depthWrite: false
    });

    this.shadowMesh = new THREE.Mesh(shadowGeometry, shadowMaterial);
    this.shadowMesh.rotation.x = -Math.PI / 2;
    this.shadowMesh.position.y = DIAL_THICKNESS / 2 + 0.01;
    this.group.add(this.shadowMesh);
  }

  private createMarks(): void {
    this.markGroup = new THREE.Group();
    this.markGroup.position.y = DIAL_THICKNESS / 2 + 0.03;

    const markMaterial = new THREE.LineBasicMaterial({
      color: 0xDAA520,
      transparent: true,
      opacity: 0.9
    });

    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2 - Math.PI / 2;
      const shichen = SHICHEN_LIST[(i + 6) % 12];

      const markInner = DIAL_RADIUS - 0.4;
      const markOuter = DIAL_RADIUS - 0.15;
      const x1 = Math.cos(angle) * markInner;
      const z1 = Math.sin(angle) * markInner;
      const x2 = Math.cos(angle) * markOuter;
      const z2 = Math.sin(angle) * markOuter;

      const points = [];
      points.push(new THREE.Vector3(x1, 0, z1));
      points.push(new THREE.Vector3(x2, 0, z2));

      const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
      const line = new THREE.Line(lineGeometry, markMaterial);
      this.markGroup.add(line);

      const textX = Math.cos(angle) * (DIAL_RADIUS - 0.75);
      const textZ = Math.sin(angle) * (DIAL_RADIUS - 0.75);

      const textMesh = this.createTextSprite(shichen, '#DAA520');
      textMesh.position.set(textX, 0.02, textZ);
      textMesh.rotation.x = -Math.PI / 2;
      textMesh.rotation.z = -angle + Math.PI / 2;
      this.markGroup.add(textMesh);
    }

    this.group.add(this.markGroup);
  }

  private createTextSprite(text: string, color: string): THREE.Sprite {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    canvas.width = 128;
    canvas.height = 64;

    ctx.fillStyle = 'rgba(0, 0, 0, 0)';
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.font = 'bold 32px "Courier New", Courier, monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = color;
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 2;
    ctx.fillText(text, canvas.width / 2, canvas.height / 2);

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;

    const spriteMaterial = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthTest: false
    });

    const sprite = new THREE.Sprite(spriteMaterial);
    sprite.scale.set(0.6, 0.3, 1);

    return sprite;
  }

  public calculateSolarAngle(): number {
    const totalMinutes = this.state.currentHour * 60 + this.state.currentMinute;
    const t = totalMinutes / 1440;
    return t * Math.PI * 2 - Math.PI / 2;
  }

  public updateShadow(): void {
    const solarAngle = this.calculateSolarAngle();
    this.state.shadowAngle = solarAngle + Math.PI;
    this.shadowMesh.rotation.z = this.state.shadowAngle + Math.PI / 2;

    this.state.currentShichen = getShichenFromTime(
      this.state.currentHour,
      this.state.currentMinute
    );
  }

  public setTime(hour: number, minute: number): void {
    this.state.currentHour = clamp(hour, 0, 24);
    this.state.currentMinute = clamp(minute, 0, 59);
    this.updateShadow();
  }

  public setDayMode(isDay: boolean): void {
    this.state.isDayMode = isDay;

    if (isDay) {
      this.dialMaterial.roughness = 0.21;
      this.dialMaterial.metalness = 0.8;
      this.gnomonMaterial.roughness = 0.24;
      this.gnomonMaterial.metalness = 0.75;
    } else {
      this.dialMaterial.roughness = 0.35;
      this.dialMaterial.metalness = 0.7;
      this.gnomonMaterial.roughness = 0.4;
      this.gnomonMaterial.metalness = 0.6;
    }
  }

  public setSeason(season: '春' | '夏' | '秋' | '冬'): void {
    this.state.season = season;
  }

  public getDialTopY(): number {
    return DIAL_THICKNESS / 2;
  }

  public getDialRadius(): number {
    return DIAL_RADIUS;
  }
}
