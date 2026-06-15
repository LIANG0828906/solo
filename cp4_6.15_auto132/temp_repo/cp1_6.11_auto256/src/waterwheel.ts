import * as THREE from 'three';

const COLOR_SPOKE = 0x6B4226;
const COLOR_BUCKET = 0x8B5E3C;
const COLOR_AXIS = 0x4A4A4A;
const WHEEL_HEIGHT = 150;
const WHEEL_RADIUS = WHEEL_HEIGHT / 2;
const SPOKE_COUNT = 12;
const RPM_TRANSITION_TIME = 0.5;

export class WaterWheel {
  private scene: THREE.Scene;
  private wheelGroup!: THREE.Group;
  private buckets: THREE.Group[] = [];
  private bucketWaterIndicators: THREE.Mesh[] = [];
  private currentRPM: number = 0;
  private targetRPM: number = 0;
  private rpmTransitionStart: number = 0;
  private rpmTransitionFrom: number = 0;
  private wheelAngle: number = 0;
  private pourParticles: THREE.Points | null = null;
  private pourParticleData: Array<{
    active: boolean;
    velocity: THREE.Vector3;
    life: number;
    maxLife: number;
  }> = [];

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  build(position: THREE.Vector3): void {
    this.wheelGroup = new THREE.Group();
    this.wheelGroup.position.copy(position);
    this.scene.add(this.wheelGroup);

    this.buildAxis();
    this.buildWheelFrame();
    this.buildSpokes();
    this.buildBuckets();
    this.buildPourParticles();
  }

  private buildAxis(): void {
    const axisLength = 50;
    const axisRadius = 5;

    const axisGeometry = new THREE.CylinderGeometry(axisRadius, axisRadius, axisLength, 24);
    const axisMaterial = new THREE.MeshStandardMaterial({
      color: COLOR_AXIS,
      roughness: 0.4,
      metalness: 0.7
    });
    const axis = new THREE.Mesh(axisGeometry, axisMaterial);
    axis.rotation.z = Math.PI / 2;
    axis.castShadow = true;
    axis.receiveShadow = true;
    this.wheelGroup.add(axis);

    const supportGeometry = new THREE.BoxGeometry(8, 60, 8);
    const supportMaterial = new THREE.MeshStandardMaterial({
      color: COLOR_SPOKE,
      roughness: 0.8,
      metalness: 0.1
    });

    const leftSupport = new THREE.Mesh(supportGeometry, supportMaterial);
    leftSupport.position.set(-4, -WHEEL_RADIUS - 30, 0);
    leftSupport.castShadow = true;
    leftSupport.receiveShadow = true;
    this.wheelGroup.add(leftSupport);

    const rightSupport = new THREE.Mesh(supportGeometry, supportMaterial);
    rightSupport.position.set(-4, -WHEEL_RADIUS - 30, 0);
    rightSupport.position.z = -4;
    rightSupport.castShadow = true;
    rightSupport.receiveShadow = true;
    this.wheelGroup.add(rightSupport);

    const baseGeometry = new THREE.BoxGeometry(20, 6, 40);
    const baseMaterial = new THREE.MeshStandardMaterial({
      color: COLOR_SPOKE,
      roughness: 0.9
    });
    const base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.position.set(-4, -WHEEL_RADIUS - 63, -2);
    base.castShadow = true;
    base.receiveShadow = true;
    this.wheelGroup.add(base);
  }

  private buildWheelFrame(): void {
    const outerRingGeometry = new THREE.TorusGeometry(WHEEL_RADIUS, 3, 12, 64);
    const woodMaterial = new THREE.MeshStandardMaterial({
      color: COLOR_SPOKE,
      roughness: 0.7,
      metalness: 0.05
    });
    const outerRing = new THREE.Mesh(outerRingGeometry, woodMaterial);
    outerRing.rotation.y = Math.PI / 2;
    outerRing.castShadow = true;
    outerRing.receiveShadow = true;
    this.wheelGroup.add(outerRing);

    const innerRingGeometry = new THREE.TorusGeometry(WHEEL_RADIUS * 0.3, 2.5, 12, 48);
    const innerRing = new THREE.Mesh(innerRingGeometry, woodMaterial);
    innerRing.rotation.y = Math.PI / 2;
    innerRing.castShadow = true;
    innerRing.receiveShadow = true;
    this.wheelGroup.add(innerRing);
  }

  private buildSpokes(): void {
    const spokeMaterial = new THREE.MeshStandardMaterial({
      color: COLOR_SPOKE,
      roughness: 0.7
    });

    for (let i = 0; i < SPOKE_COUNT; i++) {
      const angle = (i / SPOKE_COUNT) * Math.PI * 2;
      const spokeGeometry = new THREE.BoxGeometry(WHEEL_RADIUS * 0.78, 3, 3);
      const spoke = new THREE.Mesh(spokeGeometry, spokeMaterial);
      spoke.rotation.y = angle;
      spoke.position.x = Math.cos(angle) * WHEEL_RADIUS * 0.39;
      spoke.position.z = Math.sin(angle) * WHEEL_RADIUS * 0.39;
      spoke.castShadow = true;
      spoke.receiveShadow = true;
      this.wheelGroup.add(spoke);

      const supportAngle = angle + Math.PI / SPOKE_COUNT;
      const supportLength = WHEEL_RADIUS * 0.5;
      const supportGeometry = new THREE.BoxGeometry(supportLength, 2, 2);
      const support = new THREE.Mesh(supportGeometry, spokeMaterial);
      support.rotation.y = supportAngle + Math.PI / 2;
      const midRadius = WHEEL_RADIUS * 0.55;
      support.position.x = Math.cos(supportAngle) * midRadius;
      support.position.z = Math.sin(supportAngle) * midRadius;
      support.castShadow = true;
      this.wheelGroup.add(support);
    }
  }

  private buildBuckets(): void {
    const bucketMaterial = new THREE.MeshStandardMaterial({
      color: COLOR_BUCKET,
      roughness: 0.75
    });

    const waterMaterial = new THREE.MeshStandardMaterial({
      color: 0x4A90D9,
      transparent: true,
      opacity: 0.7,
      roughness: 0.1,
      metalness: 0.1
    });

    for (let i = 0; i < SPOKE_COUNT; i++) {
      const angle = (i / SPOKE_COUNT) * Math.PI * 2;
      const bucketGroup = new THREE.Group();

      const bucketShape = new THREE.Shape();
      bucketShape.moveTo(-8, -2);
      bucketShape.lineTo(8, -2);
      bucketShape.lineTo(6, 10);
      bucketShape.lineTo(-6, 10);
      bucketShape.lineTo(-8, -2);

      const extrudeSettings = {
        depth: 10,
        bevelEnabled: true,
        bevelThickness: 0.5,
        bevelSize: 0.5,
        bevelSegments: 2
      };

      const bucketGeometry = new THREE.ExtrudeGeometry(bucketShape, extrudeSettings);
      bucketGeometry.center();
      const bucketMesh = new THREE.Mesh(bucketGeometry, bucketMaterial);
      bucketMesh.rotation.x = -Math.PI / 2;
      bucketMesh.rotation.y = Math.PI;
      bucketMesh.scale.set(1, 0.8, 1);
      bucketMesh.castShadow = true;
      bucketMesh.receiveShadow = true;
      bucketGroup.add(bucketMesh);

      const waterGeometry = new THREE.BoxGeometry(10, 6, 8);
      const waterMesh = new THREE.Mesh(waterGeometry, waterMaterial.clone());
      waterMesh.position.y = 2;
      waterMesh.visible = false;
      bucketGroup.add(waterMesh);
      this.bucketWaterIndicators.push(waterMesh);

      const bucketRadius = WHEEL_RADIUS - 10;
      bucketGroup.position.x = Math.cos(angle) * bucketRadius;
      bucketGroup.position.z = Math.sin(angle) * bucketRadius;
      bucketGroup.rotation.y = -angle + Math.PI / 2;
      bucketGroup.position.y = 0;

      this.wheelGroup.add(bucketGroup);
      this.buckets.push(bucketGroup);
    }
  }

  private buildPourParticles(): void {
    const maxParticles = 200;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(maxParticles * 3);
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
      color: 0x4A90D9,
      size: 2,
      transparent: true,
      opacity: 0.8,
      sizeAttenuation: true
    });

    this.pourParticles = new THREE.Points(geometry, material);
    this.scene.add(this.pourParticles);

    for (let i = 0; i < maxParticles; i++) {
      this.pourParticleData.push({
        active: false,
        velocity: new THREE.Vector3(),
        life: 0,
        maxLife: 1
      });
    }
  }

  setTargetRPM(rpm: number): void {
    this.rpmTransitionFrom = this.currentRPM;
    this.targetRPM = Math.max(0, Math.min(60, rpm));
    this.rpmTransitionStart = performance.now();
  }

  update(dt: number): void {
    this.updateRPM(dt);
    this.wheelAngle += (this.currentRPM / 60) * Math.PI * 2 * dt;
    this.wheelGroup.rotation.x = this.wheelAngle;
    this.updateBucketWater();
    this.updatePourParticles(dt);
  }

  private updateRPM(_dt: number): void {
    if (this.currentRPM === this.targetRPM) return;
    const elapsed = (performance.now() - this.rpmTransitionStart) / 1000;
    const t = Math.min(elapsed / RPM_TRANSITION_TIME, 1);
    this.currentRPM = this.rpmTransitionFrom + (this.targetRPM - this.rpmTransitionFrom) * t;
    if (t >= 1) {
      this.currentRPM = this.targetRPM;
    }
  }

  private updateBucketWater(): void {
    const normalizedAngle = ((this.wheelAngle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
    for (let i = 0; i < SPOKE_COUNT; i++) {
      const bucketAngle = normalizedAngle + (i / SPOKE_COUNT) * Math.PI * 2;
      const normalizedBucketAngle = ((bucketAngle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
      const yPos = Math.sin(normalizedBucketAngle);
      const waterMesh = this.bucketWaterIndicators[i];
      if (yPos < -0.7) {
        waterMesh.visible = true;
        if (waterMesh.material instanceof THREE.MeshStandardMaterial) {
          waterMesh.material.opacity = 0.7;
        }
      } else if (yPos > 0.7 && waterMesh.visible) {
        if (waterMesh.material instanceof THREE.MeshStandardMaterial) {
          const fadeAmount = Math.min((yPos - 0.7) / 0.3, 1);
          waterMesh.material.opacity = 0.7 * (1 - fadeAmount);
        }
        this.emitPourParticles(i);
        if (waterMesh.material instanceof THREE.MeshStandardMaterial && waterMesh.material.opacity <= 0.05) {
          waterMesh.visible = false;
        }
      }
    }
  }

  private emitPourParticles(bucketIndex: number): void {
    if (!this.pourParticles || this.currentRPM < 2) return;
    const bucket = this.buckets[bucketIndex];
    const worldPos = new THREE.Vector3();
    bucket.getWorldPosition(worldPos);
    const positions = this.pourParticles.geometry.attributes.position.array as Float32Array;
    for (let i = 0; i < this.pourParticleData.length; i++) {
      if (!this.pourParticleData[i].active) {
        this.pourParticleData[i].active = true;
        this.pourParticleData[i].life = 0;
        this.pourParticleData[i].maxLife = 1.2 + Math.random() * 0.5;
        this.pourParticleData[i].velocity.set(
          (Math.random() - 0.5) * 10,
          -20 - Math.random() * 15,
          (Math.random() - 0.5) * 10
        );
        positions[i * 3] = worldPos.x + (Math.random() - 0.5) * 15;
        positions[i * 3 + 1] = worldPos.y + 5;
        positions[i * 3 + 2] = worldPos.z + (Math.random() - 0.5) * 15;
        break;
      }
    }
  }

  private updatePourParticles(dt: number): void {
    if (!this.pourParticles) return;
    const positions = this.pourParticles.geometry.attributes.position.array as Float32Array;
    for (let i = 0; i < this.pourParticleData.length; i++) {
      if (!this.pourParticleData[i].active) continue;
      const data = this.pourParticleData[i];
      data.life += dt;
      if (data.life >= data.maxLife) {
        data.active = false;
        positions[i * 3 + 1] = -1000;
        continue;
      }
      data.velocity.y -= 40 * dt;
      positions[i * 3] += data.velocity.x * dt;
      positions[i * 3 + 1] += data.velocity.y * dt;
      positions[i * 3 + 2] += data.velocity.z * dt;
    }
    this.pourParticles.geometry.attributes.position.needsUpdate = true;
  }

  getCurrentRPM(): number {
    return this.currentRPM;
  }

  getWheelGroup(): THREE.Group {
    return this.wheelGroup;
  }

  dispose(): void {
    if (this.pourParticles) {
      this.pourParticles.geometry.dispose();
      (this.pourParticles.material as THREE.Material).dispose();
      this.scene.remove(this.pourParticles);
    }
  }
}
