import * as THREE from 'three';

export class CatapultModel {
  catapultGroup: THREE.Group;
  base: THREE.Mesh;
  rails: THREE.Group;
  lever: THREE.Mesh;
  counterweight: THREE.Mesh;
  pouch: THREE.Mesh;
  projectile: THREE.Mesh;
  slider: THREE.Mesh;
  leverPivotGroup: THREE.Group;
  pivotPoint: THREE.Vector3;

  private defaultWeight: number = 300;
  private defaultLeverRatio: number = 0.5;
  private defaultAngle: number = 45;
  private readonly LEVER_LENGTH = 8;
  private readonly RAIL_LENGTH = 8;
  private readonly BASE_HEIGHT = 0.5;

  private currentWeight: number;
  private currentLeverRatio: number;
  private currentAngle: number;
  private projectileInPouch: boolean;
  private originalProjectileParent: THREE.Object3D | null;

  constructor() {
    this.catapultGroup = new THREE.Group();
    this.pivotPoint = new THREE.Vector3(0, this.BASE_HEIGHT + 0.5, 0);
    this.currentWeight = this.defaultWeight;
    this.currentLeverRatio = this.defaultLeverRatio;
    this.currentAngle = this.defaultAngle;
    this.projectileInPouch = true;
    this.originalProjectileParent = null;

    const woodTexture = this.createWoodTexture();
    const darkWoodTexture = this.createWoodTexture('#6B4226');

    this.base = this.createBase(darkWoodTexture);
    this.catapultGroup.add(this.base);

    this.rails = this.createRails(woodTexture);
    this.catapultGroup.add(this.rails);

    this.slider = this.createSlider();
    this.catapultGroup.add(this.slider);

    this.leverPivotGroup = new THREE.Group();
    this.catapultGroup.add(this.leverPivotGroup);

    this.lever = this.createLever(woodTexture);
    this.leverPivotGroup.add(this.lever);

    this.counterweight = this.createCounterweight();
    this.leverPivotGroup.add(this.counterweight);

    this.pouch = this.createPouch();
    this.leverPivotGroup.add(this.pouch);

    this.projectile = this.createProjectile();
    this.leverPivotGroup.add(this.projectile);
    this.originalProjectileParent = this.leverPivotGroup;

    this.setWeight(this.defaultWeight);
    this.setLeverPosition(this.defaultLeverRatio);
    this.setAngle(this.defaultAngle);

    this.catapultGroup.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.castShadow = true;
        obj.receiveShadow = true;
      }
    });
  }

  private createWoodTexture(baseColor: string = '#8B5A2B'): THREE.Texture {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = baseColor;
    ctx.fillRect(0, 0, 256, 256);

    for (let i = 0; i < 256; i += 8) {
      const alpha = 0.05 + Math.random() * 0.1;
      ctx.strokeStyle = `rgba(0, 0, 0, ${alpha})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, i + Math.random() * 4);
      for (let x = 0; x < 256; x += 16) {
        ctx.lineTo(x, i + Math.random() * 6 - 3);
      }
      ctx.stroke();
    }

    for (let i = 0; i < 50; i++) {
      const x = Math.random() * 256;
      const y = Math.random() * 256;
      const r = 2 + Math.random() * 4;
      ctx.fillStyle = `rgba(60, 30, 10, ${0.1 + Math.random() * 0.15})`;
      ctx.beginPath();
      ctx.ellipse(x, y, r, r * 0.5, Math.random() * Math.PI, 0, Math.PI * 2);
      ctx.fill();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    return texture;
  }

  private createBase(woodTexture: THREE.Texture): THREE.Mesh {
    const geometry = new THREE.BoxGeometry(5, this.BASE_HEIGHT, 5);
    const material = new THREE.MeshStandardMaterial({
      map: woodTexture,
      color: 0x6B4226,
      roughness: 0.85,
      metalness: 0.05
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.y = this.BASE_HEIGHT / 2;
    return mesh;
  }

  private createRails(woodTexture: THREE.Texture): THREE.Group {
    const group = new THREE.Group();
    const railGeometry = new THREE.BoxGeometry(0.3, 0.25, this.RAIL_LENGTH);
    const material = new THREE.MeshStandardMaterial({
      map: woodTexture,
      color: 0x8B5A2B,
      roughness: 0.8,
      metalness: 0.05
    });

    const rail1 = new THREE.Mesh(railGeometry, material);
    rail1.position.set(-0.9, this.BASE_HEIGHT + 0.125, 0);

    const rail2 = new THREE.Mesh(railGeometry, material);
    rail2.position.set(0.9, this.BASE_HEIGHT + 0.125, 0);

    group.add(rail1);
    group.add(rail2);

    for (let i = -3; i <= 3; i += 2) {
      const supportGeometry = new THREE.BoxGeometry(2.1, 0.15, 0.2);
      const support = new THREE.Mesh(supportGeometry, material);
      support.position.set(0, this.BASE_HEIGHT + 0.075, i);
      group.add(support);
    }

    return group;
  }

  private createSlider(): THREE.Mesh {
    const geometry = new THREE.BoxGeometry(2.3, 0.4, 0.6);
    const material = new THREE.MeshStandardMaterial({
      color: 0x4A4A4A,
      roughness: 0.6,
      metalness: 0.7
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.y = this.BASE_HEIGHT + 0.2 + 0.2;
    return mesh;
  }

  private createLever(woodTexture: THREE.Texture): THREE.Mesh {
    const geometry = new THREE.CylinderGeometry(0.18, 0.22, this.LEVER_LENGTH, 12);
    const material = new THREE.MeshStandardMaterial({
      map: woodTexture,
      color: 0x8B5A2B,
      roughness: 0.75,
      metalness: 0.05
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.rotation.z = Math.PI / 2;
    mesh.position.y = 0.3;
    return mesh;
  }

  private createCounterweight(): THREE.Mesh {
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshStandardMaterial({
      color: 0x808080,
      roughness: 0.9,
      metalness: 0.1
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.y = 0.3;
    return mesh;
  }

  private createPouch(): THREE.Mesh {
    const geometry = new THREE.SphereGeometry(0.45, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2);
    const material = new THREE.MeshStandardMaterial({
      color: 0x654321,
      roughness: 0.95,
      metalness: 0.0,
      side: THREE.DoubleSide
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.y = 0.3;
    return mesh;
  }

  private createProjectile(): THREE.Mesh {
    const geometry = new THREE.SphereGeometry(0.5, 24, 16);
    const material = new THREE.MeshStandardMaterial({
      color: 0x707070,
      roughness: 0.95,
      metalness: 0.05
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.y = 0.3;
    return mesh;
  }

  private updateSliderPosition(): void {
    const railMin = -this.RAIL_LENGTH / 2;
    const railMax = this.RAIL_LENGTH / 2;
    const zPos = railMin + (railMax - railMin) * this.currentLeverRatio;
    this.slider.position.z = zPos;
    this.pivotPoint.set(0, this.BASE_HEIGHT + 0.5, zPos);
    this.leverPivotGroup.position.copy(this.pivotPoint);
  }

  private updateLeverRotation(): void {
    const angleRad = (this.currentAngle * Math.PI) / 180;
    this.leverPivotGroup.rotation.x = -angleRad;

    const shortArm = this.LEVER_LENGTH * this.currentLeverRatio;
    const longArm = this.LEVER_LENGTH * (1 - this.currentLeverRatio);

    this.counterweight.position.set(0, 0.3, shortArm - 0.1);
    this.pouch.position.set(0, 0.3, -longArm + 0.1);
    this.projectile.position.set(0, 0.8, -longArm + 0.1);
  }

  setWeight(kg: number): void {
    this.currentWeight = Math.max(100, Math.min(500, kg));
    const baseScale = 0.8;
    const scaleFactor = baseScale + (this.currentWeight - 100) / 400 * 0.8;
    this.counterweight.scale.setScalar(scaleFactor);
  }

  setLeverPosition(ratio: number): void {
    this.currentLeverRatio = Math.max(0.4, Math.min(0.7, ratio));
    this.updateSliderPosition();
    this.updateLeverRotation();
  }

  setAngle(deg: number): void {
    this.currentAngle = Math.max(30, Math.min(75, deg));
    this.updateLeverRotation();
  }

  getProjectileStartPosition(): THREE.Vector3 {
    const worldPos = new THREE.Vector3();
    this.projectile.getWorldPosition(worldPos);
    return worldPos;
  }

  detachProjectile(): THREE.Mesh {
    this.projectileInPouch = false;
    const worldPos = new THREE.Vector3();
    this.projectile.getWorldPosition(worldPos);
    if (this.projectile.parent) {
      this.projectile.parent.remove(this.projectile);
    }
    this.projectile.position.copy(worldPos);
    return this.projectile;
  }

  reset(): void {
    this.setWeight(this.defaultWeight);
    this.setLeverPosition(this.defaultLeverRatio);
    this.setAngle(this.defaultAngle);

    if (!this.projectileInPouch) {
      this.projectileInPouch = true;
      if (this.projectile.parent) {
        this.projectile.parent.remove(this.projectile);
      }
      this.leverPivotGroup.add(this.projectile);
      this.updateLeverRotation();
    }
  }

  getCurrentParams(): { weight: number; leverRatio: number; angle: number } {
    return {
      weight: this.currentWeight,
      leverRatio: this.currentLeverRatio,
      angle: this.currentAngle
    };
  }
}
