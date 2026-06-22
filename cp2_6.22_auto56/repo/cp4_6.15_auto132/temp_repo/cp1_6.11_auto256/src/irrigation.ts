import * as THREE from 'three';

const COLOR_WATER = 0x4A90D9;
const COLOR_WATER_LIGHT = 0xB0D4F1;
const COLOR_FARM_SOIL = 0x7B5B3A;
const COLOR_FARM_WATER = 0x5BA3C9;
const COLOR_CROP_STEM = 0x5A8C2A;
const COLOR_CROP_LEAF = 0x6B8E23;
const PARTICLES_PER_CHANNEL = 1000;
const MAX_WATER_LEVEL = 1.5;
const GROWTH_THRESHOLD = 0.8;
const GROWTH_DURATION = 3;
const BOUNCE_AMPLITUDE = 0.5;
const BOUNCE_FREQUENCY = 2;

type FlowDirection = 'left' | 'right';
type CropStage = 'seedling' | 'growing' | 'mature';

interface FieldData {
  id: number;
  position: THREE.Vector2;
  waterLevel: number;
  cropStage: CropStage;
  growthProgress: number;
  group: THREE.Group;
  waterMesh: THREE.Mesh;
  crops: THREE.Group[];
}

export class IrrigationSystem {
  private scene: THREE.Scene;
  private gateOpenness: number = 50;
  private flowDirection: FlowDirection = 'left';
  private waterFlow: number = 0;

  private channelGroup: THREE.Group = new THREE.Group();
  private leftParticles!: THREE.Points;
  private rightParticles!: THREE.Points;
  private leftParticleParams: Array<{ t: number; speed: number }> = [];
  private rightParticleParams: Array<{ t: number; speed: number }> = [];

  private fields: FieldData[] = [];
  private rootGroup: THREE.Group = new THREE.Group();

  private leftChannelCurve!: THREE.CatmullRomCurve3;
  private rightChannelCurve!: THREE.CatmullRomCurve3;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  build(): void {
    this.scene.add(this.rootGroup);
    this.buildChannels();
    this.buildParticleSystems();
    this.buildFields();
  }

  private buildChannels(): void {
    this.rootGroup.add(this.channelGroup);

    const channelMaterial = new THREE.MeshStandardMaterial({
      color: 0x5C4A2E,
      roughness: 0.9,
      metalness: 0.05
    });

    const leftPoints: THREE.Vector3[] = [];
    for (let i = 0; i <= 10; i++) {
      const t = i / 10;
      leftPoints.push(new THREE.Vector3(
        -20 + t * 280,
        0.5,
        40 + Math.sin(t * Math.PI * 2) * 15
      ));
    }
    this.leftChannelCurve = new THREE.CatmullRomCurve3(leftPoints);
    this.createChannelMesh(this.leftChannelCurve, channelMaterial);

    const rightPoints: THREE.Vector3[] = [];
    for (let i = 0; i <= 10; i++) {
      const t = i / 10;
      rightPoints.push(new THREE.Vector3(
        -20 + t * 280,
        0.5,
        -40 - Math.sin(t * Math.PI * 2) * 15
      ));
    }
    this.rightChannelCurve = new THREE.CatmullRomCurve3(rightPoints);
    this.createChannelMesh(this.rightChannelCurve, channelMaterial);

    const gateGeometry = new THREE.BoxGeometry(6, 20, 80);
    const gateMaterial = new THREE.MeshStandardMaterial({
      color: 0x6B4226,
      roughness: 0.8
    });
    const gate = new THREE.Mesh(gateGeometry, gateMaterial);
    gate.position.set(-30, 10, 0);
    gate.castShadow = true;
    gate.receiveShadow = true;
    this.channelGroup.add(gate);

    const pillarGeometry = new THREE.BoxGeometry(8, 35, 8);
    const leftPillar = new THREE.Mesh(pillarGeometry, gateMaterial);
    leftPillar.position.set(-30, 17.5, 45);
    leftPillar.castShadow = true;
    this.channelGroup.add(leftPillar);

    const rightPillar = new THREE.Mesh(pillarGeometry, gateMaterial);
    rightPillar.position.set(-30, 17.5, -45);
    rightPillar.castShadow = true;
    this.channelGroup.add(rightPillar);
  }

  private createChannelMesh(curve: THREE.CatmullRomCurve3, material: THREE.Material): void {
    const points = curve.getSpacedPoints(100);
    const shape = new THREE.Shape();
    shape.moveTo(-8, 0);
    shape.lineTo(-6, 4);
    shape.lineTo(6, 4);
    shape.lineTo(8, 0);
    shape.lineTo(-8, 0);

    const extrudeSettings = {
      steps: 100,
      bevelEnabled: false,
      extrudePath: curve as any
    };

    const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    this.channelGroup.add(mesh);
  }

  private buildParticleSystems(): void {
    this.leftParticles = this.createParticleSystem(this.leftChannelCurve, this.leftParticleParams);
    this.rightParticles = this.createParticleSystem(this.rightChannelCurve, this.rightParticleParams);
    this.rootGroup.add(this.leftParticles);
    this.rootGroup.add(this.rightParticles);
  }

  private createParticleSystem(
    curve: THREE.CatmullRomCurve3,
    params: Array<{ t: number; speed: number }>
  ): THREE.Points {
    const positions = new Float32Array(PARTICLES_PER_CHANNEL * 3);
    for (let i = 0; i < PARTICLES_PER_CHANNEL; i++) {
      const t = Math.random();
      params.push({ t, speed: 0.08 + Math.random() * 0.06 });
      const pos = curve.getPointAt(t);
      positions[i * 3] = pos.x + (Math.random() - 0.5) * 4;
      positions[i * 3 + 1] = pos.y + 1 + Math.random() * 2;
      positions[i * 3 + 2] = pos.z + (Math.random() - 0.5) * 4;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
      color: COLOR_WATER,
      size: 3,
      transparent: true,
      opacity: 0.9,
      sizeAttenuation: true
    });

    return new THREE.Points(geometry, material);
  }

  private buildFields(): void {
    const fieldPositions = [
      { channel: 'left' as const, x: 50, z: 75 },
      { channel: 'left' as const, x: 110, z: 80 },
      { channel: 'left' as const, x: 170, z: 75 },
      { channel: 'left' as const, x: 80, z: 110 },
      { channel: 'left' as const, x: 140, z: 115 },
      { channel: 'right' as const, x: 50, z: -75 },
      { channel: 'right' as const, x: 110, z: -80 },
      { channel: 'right' as const, x: 170, z: -75 },
      { channel: 'right' as const, x: 80, z: -110 },
      { channel: 'right' as const, x: 140, z: -115 }
    ];

    fieldPositions.forEach((fp, idx) => {
      this.fields.push(this.createField(idx, fp.x, fp.z, fp.channel));
    });
  }

  private createField(id: number, x: number, z: number, _channel: string): FieldData {
    const group = new THREE.Group();
    group.position.set(x, 0, z);

    const baseGeometry = new THREE.BoxGeometry(20, 2, 15);
    const baseMaterial = new THREE.MeshStandardMaterial({
      color: COLOR_FARM_SOIL,
      roughness: 0.95
    });
    const base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.position.y = -1;
    base.receiveShadow = true;
    group.add(base);

    const borderGeometry = new THREE.BoxGeometry(22, 4, 1);
    const borderMaterial = new THREE.MeshStandardMaterial({
      color: 0x5C4A2E,
      roughness: 0.9
    });
    const borderTop = new THREE.Mesh(borderGeometry, borderMaterial);
    borderTop.position.set(0, 0, 7.5);
    borderTop.receiveShadow = true;
    borderTop.castShadow = true;
    group.add(borderTop);

    const borderBottom = borderTop.clone();
    borderBottom.position.z = -7.5;
    group.add(borderBottom);

    const sideBorderGeometry = new THREE.BoxGeometry(1, 4, 15);
    const borderLeft = new THREE.Mesh(sideBorderGeometry, borderMaterial);
    borderLeft.position.set(-10, 0, 0);
    borderLeft.receiveShadow = true;
    borderLeft.castShadow = true;
    group.add(borderLeft);

    const borderRight = borderLeft.clone();
    borderRight.position.x = 10;
    group.add(borderRight);

    const waterGeometry = new THREE.PlaneGeometry(19, 14);
    const waterMaterial = new THREE.MeshStandardMaterial({
      color: COLOR_FARM_WATER,
      transparent: true,
      opacity: 0,
      roughness: 0.1,
      metalness: 0.1
    });
    const waterMesh = new THREE.Mesh(waterGeometry, waterMaterial);
    waterMesh.rotation.x = -Math.PI / 2;
    waterMesh.position.y = 0.02;
    group.add(waterMesh);

    const crops: THREE.Group[] = [];
    const cropCols = 5;
    const cropRows = 4;
    for (let r = 0; r < cropRows; r++) {
      for (let c = 0; c < cropCols; c++) {
        const crop = this.createCrop();
        crop.position.x = -7 + c * 3.5;
        crop.position.z = -5 + r * 3.3;
        crop.scale.setScalar(0.3);
        crops.push(crop);
        group.add(crop);
      }
    }

    this.rootGroup.add(group);

    return {
      id,
      position: new THREE.Vector2(x, z),
      waterLevel: 0,
      cropStage: 'seedling',
      growthProgress: 0,
      group,
      waterMesh,
      crops
    };
  }

  private createCrop(): THREE.Group {
    const group = new THREE.Group();

    const stemGeometry = new THREE.CylinderGeometry(0.15, 0.2, 1.5, 8);
    const stemMaterial = new THREE.MeshStandardMaterial({
      color: COLOR_CROP_STEM,
      roughness: 0.8
    });
    const stem = new THREE.Mesh(stemGeometry, stemMaterial);
    stem.position.y = 0.75;
    stem.castShadow = true;
    group.add(stem);

    const coneGeometry = new THREE.ConeGeometry(0.5, 1, 8);
    const coneMaterial = new THREE.MeshStandardMaterial({
      color: COLOR_CROP_LEAF,
      roughness: 0.75
    });
    const cone = new THREE.Mesh(coneGeometry, coneMaterial);
    cone.position.y = 2;
    cone.castShadow = true;
    group.add(cone);

    for (let i = 0; i < 4; i++) {
      const leafGeometry = new THREE.SphereGeometry(0.35, 8, 6);
      const leaf = new THREE.Mesh(leafGeometry, coneMaterial);
      const angle = (i / 4) * Math.PI * 2;
      leaf.position.set(
        Math.cos(angle) * 0.4,
        1.2 + (i % 2) * 0.3,
        Math.sin(angle) * 0.4
      );
      leaf.scale.set(1.5, 0.6, 1);
      leaf.rotation.y = angle;
      leaf.castShadow = true;
      group.add(leaf);
    }

    return group;
  }

  setGateOpenness(value: number): void {
    this.gateOpenness = Math.max(0, Math.min(100, value));
  }

  setFlowDirection(dir: FlowDirection): void {
    this.flowDirection = dir;
  }

  update(dt: number, time: number): void {
    this.waterFlow = Math.floor(this.gateOpenness * 2);
    this.updateParticles(dt);
    this.updateFieldWaterLevels(dt);
    this.updateCrops(dt, time);
  }

  private updateParticles(dt: number): void {
    const isLowFlow = this.gateOpenness < 20;
    const activeCount = isLowFlow ? Math.floor(PARTICLES_PER_CHANNEL / 2) : PARTICLES_PER_CHANNEL;
    const targetColor = isLowFlow ? COLOR_WATER_LIGHT : COLOR_WATER;
    const targetOpacity = isLowFlow ? 0.3 : 0.9;

    this.updateChannelParticles(
      this.leftParticles,
      this.leftParticleParams,
      this.leftChannelCurve,
      this.flowDirection === 'left' || this.flowDirection === 'both' ? this.gateOpenness : 0,
      dt,
      activeCount,
      targetColor,
      targetOpacity
    );

    this.updateChannelParticles(
      this.rightParticles,
      this.rightParticleParams,
      this.rightChannelCurve,
      this.flowDirection === 'right' || this.flowDirection === 'both' ? this.gateOpenness : 0,
      dt,
      activeCount,
      targetColor,
      targetOpacity
    );
  }

  private updateChannelParticles(
    points: THREE.Points,
    params: Array<{ t: number; speed: number }>,
    curve: THREE.CatmullRomCurve3,
    flowStrength: number,
    dt: number,
    activeCount: number,
    targetColor: number,
    targetOpacity: number
  ): void {
    const positions = points.geometry.attributes.position.array as Float32Array;
    const speedFactor = (flowStrength / 100) * 1.5;

    for (let i = 0; i < PARTICLES_PER_CHANNEL; i++) {
      if (i >= activeCount || flowStrength < 5) {
        positions[i * 3 + 1] = -1000;
        continue;
      }

      params[i].t += params[i].speed * speedFactor * dt;
      if (params[i].t > 1) {
        params[i].t = 0;
        params[i].speed = 0.08 + Math.random() * 0.06;
      }

      const pos = curve.getPointAt(params[i].t);
      positions[i * 3] = pos.x + (Math.random() - 0.5) * 4;
      positions[i * 3 + 1] = pos.y + 1 + Math.random() * 2;
      positions[i * 3 + 2] = pos.z + (Math.random() - 0.5) * 4;
    }

    points.geometry.attributes.position.needsUpdate = true;

    const material = points.material as THREE.PointsMaterial;
    material.color.lerp(new THREE.Color(targetColor), 0.05);
    material.opacity += (targetOpacity - material.opacity) * 0.05;
  }

  private updateFieldWaterLevels(dt: number): void {
    const flowRate = (this.gateOpenness / 100) * 0.3;
    const leftFieldsActive = this.flowDirection === 'left';
    const rightFieldsActive = this.flowDirection === 'right';

    this.fields.forEach((field, idx) => {
      const isLeftField = idx < 5;
      const active = (isLeftField && leftFieldsActive) || (!isLeftField && rightFieldsActive);

      if (active && this.gateOpenness > 10) {
        field.waterLevel = Math.min(MAX_WATER_LEVEL, field.waterLevel + flowRate * dt);
      } else {
        field.waterLevel = Math.max(0, field.waterLevel - 0.02 * dt);
      }

      const waterMaterial = field.waterMesh.material as THREE.MeshStandardMaterial;
      const waterAlpha = Math.min(field.waterLevel / MAX_WATER_LEVEL, 1) * 0.8;
      waterMaterial.opacity += (waterAlpha - waterMaterial.opacity) * 0.1;
      field.waterMesh.position.y = 0.02 + field.waterLevel * 0.3;
    });
  }

  private updateCrops(dt: number, time: number): void {
    this.fields.forEach((field) => {
      if (field.waterLevel >= GROWTH_THRESHOLD && field.cropStage !== 'mature') {
        if (field.cropStage === 'seedling') {
          field.cropStage = 'growing';
        }
        if (field.cropStage === 'growing') {
          field.growthProgress = Math.min(1, field.growthProgress + dt / GROWTH_DURATION);
          if (field.growthProgress >= 1) {
            field.cropStage = 'mature';
          }
        }
      }

      const easedProgress = this.easeOutCubic(field.growthProgress);
      const baseScale = 0.3 + easedProgress * 0.7;
      const targetHeight = 0.3 + easedProgress * 0.7;

      field.crops.forEach((crop, cropIdx) => {
        let scale = baseScale;
        let yOffset = 0;

        if (field.cropStage === 'mature') {
          const bouncePhase = time * BOUNCE_FREQUENCY * Math.PI * 2 + cropIdx * 0.5;
          yOffset = Math.sin(bouncePhase) * BOUNCE_AMPLITUDE * 0.1;
          scale = baseScale * (1 + Math.sin(bouncePhase) * 0.02);
        }

        crop.scale.setScalar(scale);
        crop.position.y = yOffset;
        void targetHeight;
      });
    });
  }

  private easeOutCubic(t: number): number {
    return 1 - Math.pow(1 - t, 3);
  }

  getWaterFlow(): number {
    return this.waterFlow;
  }

  getIrrigatedCount(): number {
    return this.fields.filter((f) => f.waterLevel >= GROWTH_THRESHOLD).length;
  }

  getFieldWaterLevels(): number[] {
    return this.fields.map((f) => f.waterLevel);
  }

  getGateOpenness(): number {
    return this.gateOpenness;
  }

  getFlowDirection(): FlowDirection {
    return this.flowDirection;
  }

  dispose(): void {
    this.scene.remove(this.rootGroup);
  }
}
