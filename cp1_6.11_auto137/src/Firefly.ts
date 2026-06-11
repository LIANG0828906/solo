import * as THREE from 'three';

export class Firefly {
  private scene!: THREE.Scene;
  private coreMesh!: THREE.Mesh;
  private glowSprite!: THREE.Sprite;
  private trailPoints!: THREE.Points;
  private trailPositions!: Float32Array;
  private trailAges!: number[];

  position!: THREE.Vector3;
  private velocity!: THREE.Vector3;
  private wanderAngle: number;
  private sinePhase: { x: number; y: number; z: number };
  private sineFreq: { x: number; y: number; z: number };

  private flashPeriod: number;
  private flashTimer: number;
  private flashDuration: number;
  private flashActive: boolean;
  private flashTimerActive: number;
  private currentFlashIntensity: number;
  private baseFlashMultiplier: number;

  private baseColor: THREE.Color;
  private selectedColor: THREE.Color;
  private isSelected: boolean;
  private selectedTimer: number;

  private chainFlashRemaining: number;
  private chainFlashInterval: number;
  private chainFlashTimer: number;

  private globalTime: number;

  private static readonly TRAIL_COUNT = 20;
  private static readonly BOUNDS = { minX: -18, maxX: 18, minY: 0.5, maxY: 6, minZ: -18, maxZ: 18 };

  constructor(scene: THREE.Scene, position: THREE.Vector3) {
    this.scene = scene;
    this.position = position.clone();
    this.globalTime = 0;

    this.velocity = new THREE.Vector3(
      (Math.random() - 0.5) * 0.2,
      (Math.random() - 0.5) * 0.1,
      (Math.random() - 0.5) * 0.2
    );
    this.wanderAngle = Math.random() * Math.PI * 2;
    this.sinePhase = {
      x: Math.random() * Math.PI * 2,
      y: Math.random() * Math.PI * 2,
      z: Math.random() * Math.PI * 2
    };
    this.sineFreq = {
      x: 0.2 + Math.random() * 0.2,
      y: 0.2 + Math.random() * 0.2,
      z: 0.2 + Math.random() * 0.2
    };

    this.flashPeriod = 1.5 + Math.random() * 1.5;
    this.flashTimer = Math.random() * this.flashPeriod;
    this.flashDuration = 0.2;
    this.flashActive = false;
    this.flashTimerActive = 0;
    this.currentFlashIntensity = 1;
    this.baseFlashMultiplier = 2;

    this.baseColor = new THREE.Color(0xccff66);
    this.selectedColor = new THREE.Color(0x88ccff);
    this.isSelected = false;
    this.selectedTimer = 0;

    this.chainFlashRemaining = 0;
    this.chainFlashInterval = 0.3;
    this.chainFlashTimer = 0;

    this.trailAges = new Array(Firefly.TRAIL_COUNT).fill(-1);

    this.coreMesh = this.createCoreMesh();
    this.glowSprite = this.createGlowSprite();
    this.trailPoints = this.createTrailParticles();

    this.scene.add(this.coreMesh);
    this.scene.add(this.glowSprite);
    this.scene.add(this.trailPoints);

    this.updatePositions();
  }

  private createCoreMesh(): THREE.Mesh {
    const geometry = new THREE.SphereGeometry(0.15, 8, 8);
    const material = new THREE.MeshBasicMaterial({
      color: this.baseColor,
      transparent: true,
      opacity: 1
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.userData.firefly = this;
    return mesh;
  }

  private createGlowSprite(): THREE.Sprite {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d')!;
    const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    gradient.addColorStop(0, 'rgba(204, 255, 102, 0.8)');
    gradient.addColorStop(0.3, 'rgba(255, 255, 153, 0.3)');
    gradient.addColorStop(1, 'rgba(255, 255, 153, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 128, 128);
    const texture = new THREE.CanvasTexture(canvas);

    const material = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      opacity: 0.15,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    const sprite = new THREE.Sprite(material);
    sprite.scale.set(2, 2, 2);
    return sprite;
  }

  private createTrailParticles(): THREE.Points {
    this.trailPositions = new Float32Array(Firefly.TRAIL_COUNT * 3);
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(this.trailPositions, 3));

    const colors = new Float32Array(Firefly.TRAIL_COUNT * 3);
    for (let i = 0; i < Firefly.TRAIL_COUNT; i++) {
      colors[i * 3] = 170 / 255;
      colors[i * 3 + 1] = 255 / 255;
      colors[i * 3 + 2] = 136 / 255;
      this.trailPositions[i * 3] = 0;
      this.trailPositions[i * 3 + 1] = -1000;
      this.trailPositions[i * 3 + 2] = 0;
    }
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 0.08,
      vertexColors: true,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    const points = new THREE.Points(geometry, material);
    points.visible = false;
    return points;
  }

  update(
    delta: number,
    speedMultiplier: number,
    intensityMultiplier: number,
    globalTime: number
  ): void {
    this.globalTime = globalTime;
    this.updateMovement(delta, speedMultiplier);
    this.updateFlashing(delta, intensityMultiplier);
    this.updateSelectedState(delta);
    this.updateChainFlash(delta, intensityMultiplier);
    this.updateTrail(delta);
    this.updatePositions();
    this.updateVisuals(intensityMultiplier);
  }

  private updateMovement(delta: number, speedMultiplier: number): void {
    const baseSpeed = (0.1 + Math.random() * 0.05) * speedMultiplier;

    this.wanderAngle += (Math.random() - 0.5) * 0.5 * delta;
    this.velocity.x += Math.cos(this.wanderAngle) * 0.3 * delta;
    this.velocity.z += Math.sin(this.wanderAngle) * 0.3 * delta;
    this.velocity.y += (Math.random() - 0.5) * 0.2 * delta;

    this.velocity.clampLength(0, baseSpeed * 3);

    const sineAmp = 0.5;
    const sineOffset = new THREE.Vector3(
      Math.sin(this.globalTime * this.sineFreq.x + this.sinePhase.x) * sineAmp,
      Math.sin(this.globalTime * this.sineFreq.y + this.sinePhase.y) * sineAmp * 0.5,
      Math.sin(this.globalTime * this.sineFreq.z + this.sinePhase.z) * sineAmp
    );

    this.position.add(this.velocity.clone().multiplyScalar(delta));
    this.position.add(sineOffset.clone().multiplyScalar(delta * 0.5));

    const b = Firefly.BOUNDS;
    if (this.position.x < b.minX) { this.position.x = b.minX; this.velocity.x *= -0.8; }
    if (this.position.x > b.maxX) { this.position.x = b.maxX; this.velocity.x *= -0.8; }
    if (this.position.y < b.minY) { this.position.y = b.minY; this.velocity.y *= -0.8; }
    if (this.position.y > b.maxY) { this.position.y = b.maxY; this.velocity.y *= -0.8; }
    if (this.position.z < b.minZ) { this.position.z = b.minZ; this.velocity.z *= -0.8; }
    if (this.position.z > b.maxZ) { this.position.z = b.maxZ; this.velocity.z *= -0.8; }
  }

  private updateFlashing(delta: number, intensityMultiplier: number): void {
    if (this.chainFlashRemaining > 0) return;

    this.flashTimer += delta;
    if (this.flashTimer >= this.flashPeriod) {
      this.flashTimer = 0;
      this.flashActive = true;
      this.flashTimerActive = 0;
    }

    if (this.flashActive) {
      this.flashTimerActive += delta;
      const progress = this.flashTimerActive / this.flashDuration;
      if (progress >= 1) {
        this.flashActive = false;
        this.currentFlashIntensity = 1;
      } else {
        const flashMult = this.baseFlashMultiplier * intensityMultiplier;
        this.currentFlashIntensity = 1 + Math.sin(progress * Math.PI) * (flashMult - 1);
      }
    } else {
      this.currentFlashIntensity = 1;
    }
  }

  private updateSelectedState(delta: number): void {
    if (this.isSelected) {
      this.selectedTimer -= delta;
      if (this.selectedTimer <= 0) {
        this.isSelected = false;
        (this.trailPoints.material as THREE.PointsMaterial).opacity = 0;
        this.trailPoints.visible = false;
      }
    }
  }

  private updateChainFlash(delta: number, intensityMultiplier: number): void {
    if (this.chainFlashRemaining <= 0) return;

    this.chainFlashTimer += delta;
    if (this.chainFlashTimer >= this.chainFlashInterval) {
      this.chainFlashTimer = 0;
      this.chainFlashRemaining--;
      this.flashActive = true;
      this.flashTimerActive = 0;

      const flashMult = this.isSelected ? 3 : 2.5;
      this.currentFlashIntensity = flashMult * intensityMultiplier;
    }

    if (this.flashActive) {
      this.flashTimerActive += delta;
      const progress = this.flashTimerActive / (this.chainFlashInterval * 0.6);
      if (progress >= 1) {
        this.flashActive = false;
      } else {
        const flashMult = this.isSelected ? 3 : 2.5;
        this.currentFlashIntensity = 1 + Math.sin(progress * Math.PI) * (flashMult * intensityMultiplier - 1);
      }
    }
  }

  private updateTrail(delta: number): void {
    if (!this.isSelected) return;

    for (let i = 0; i < Firefly.TRAIL_COUNT; i++) {
      if (this.trailAges[i] >= 0) {
        this.trailAges[i] -= delta;
        if (this.trailAges[i] <= 0) {
          this.trailPositions[i * 3 + 1] = -1000;
        }
      }
    }

    for (let i = Firefly.TRAIL_COUNT - 1; i > 0; i--) {
      if (this.trailAges[i - 1] >= 0) {
        this.trailPositions[i * 3] = this.trailPositions[(i - 1) * 3];
        this.trailPositions[i * 3 + 1] = this.trailPositions[(i - 1) * 3 + 1];
        this.trailPositions[i * 3 + 2] = this.trailPositions[(i - 1) * 3 + 2];
        this.trailAges[i] = this.trailAges[i - 1];
      }
    }

    this.trailPositions[0] = this.position.x;
    this.trailPositions[1] = this.position.y;
    this.trailPositions[2] = this.position.z;
    this.trailAges[0] = 0.5;

    (this.trailPoints.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;

    const maxAge = 0.5;
    let totalOpacity = 0;
    for (let i = 0; i < Firefly.TRAIL_COUNT; i++) {
      if (this.trailAges[i] >= 0) {
        totalOpacity += (this.trailAges[i] / maxAge) * 0.8;
      }
    }
    (this.trailPoints.material as THREE.PointsMaterial).opacity = Math.min(1, totalOpacity / 5);
  }

  private updatePositions(): void {
    this.coreMesh.position.copy(this.position);
    this.glowSprite.position.copy(this.position);
  }

  private updateVisuals(intensityMultiplier: number): void {
    const coreMaterial = this.coreMesh.material as THREE.MeshBasicMaterial;
    const glowMaterial = this.glowSprite.material as THREE.SpriteMaterial;

    const displayColor = this.isSelected ? this.selectedColor : this.baseColor;
    const intensity = this.currentFlashIntensity;

    const r = Math.min(1, displayColor.r * intensity);
    const g = Math.min(1, displayColor.g * intensity);
    const b = Math.min(1, displayColor.b * intensity);
    coreMaterial.color.setRGB(r, g, b);

    const glowScale = this.isSelected ? 3 : 2;
    const baseOpacity = this.isSelected ? 0.22 : 0.15;
    this.glowSprite.scale.set(glowScale * intensity, glowScale * intensity, glowScale * intensity);
    glowMaterial.opacity = Math.min(0.5, baseOpacity * intensity * intensityMultiplier);

    if (this.trailPoints.visible !== this.isSelected) {
      this.trailPoints.visible = this.isSelected;
    }
  }

  triggerClickChain(allFireflies: Firefly[]): void {
    this.isSelected = true;
    this.selectedTimer = 5;

    this.chainFlashRemaining = 3;
    this.chainFlashInterval = 0.3;
    this.chainFlashTimer = this.chainFlashInterval;
    this.flashActive = false;

    const nearby: { firefly: Firefly; distance: number }[] = [];
    for (const other of allFireflies) {
      if (other === this) continue;
      const dist = this.position.distanceTo(other.position);
      if (dist <= 5) {
        nearby.push({ firefly: other, distance: dist });
      }
    }
    nearby.sort((a, b) => a.distance - b.distance);
    const toTrigger = nearby.slice(0, 10);

    toTrigger.forEach((item, index) => {
      setTimeout(() => {
        item.firefly.triggerChainFlash();
      }, 50 + index * 30);
    });
  }

  triggerChainFlash(): void {
    this.chainFlashRemaining = 2;
    this.chainFlashInterval = 0.35;
    this.chainFlashTimer = this.chainFlashInterval;
    this.flashActive = false;
  }

  getCoreMesh(): THREE.Mesh {
    return this.coreMesh;
  }

  dispose(): void {
    this.scene.remove(this.coreMesh);
    this.scene.remove(this.glowSprite);
    this.scene.remove(this.trailPoints);

    this.coreMesh.geometry.dispose();
    (this.coreMesh.material as THREE.Material).dispose();

    this.glowSprite.material?.dispose();
    const glowMat = this.glowSprite.material as THREE.SpriteMaterial;
    if (glowMat.map) glowMat.map.dispose();

    this.trailPoints.geometry.dispose();
    (this.trailPoints.material as THREE.Material).dispose();
  }
}
