import * as THREE from 'three';

const SHICHEN_NAMES = [
  '子时', '丑时', '寅时', '卯时', '辰时', '巳时',
  '午时', '未时', '申时', '酉时', '戌时', '亥时'
];

const SHICHEN_DESCS = [
  '北斗七星正悬天际',
  '银河横跨夜空',
  '猎户座升起东方',
  '天狼星闪烁黎明',
  '轩辕十四高悬南天',
  '角宿初现苍龙首',
  '日当中天南河三',
  '大角星照耀西天',
  '心宿二红光满目',
  '织女星横贯天顶',
  '牛郎星隔河相望',
  '北落师门守夜阑'
];

const WATER_COLOR = 0x4488FF;
const BRONZE_COLOR = 0x8B6914;
const STONE_COLOR = 0x4A6A6A;
const CYLINDER_COUNT = 4;
const CYLINDER_HEIGHT = 1.5;
const CYLINDER_RADIUS = 0.8;
const CYLINDER_SPACING = 1.8;
const POT_HEIGHT = 2.0;
const INLET_HEIGHT = 0.6;
const INLET_RADIUS = 1.0;
const TOTAL_HEIGHT = INLET_HEIGHT + CYLINDER_COUNT * CYLINDER_SPACING + POT_HEIGHT + 0.5;

interface WaterDrop {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  life: number;
  targetCylinder: number;
}

export class WaterClock {
  group: THREE.Group;
  waterMeshes: THREE.Mesh[] = [];
  waterLevels: number[] = [];
  private maxWaterLevel = CYLINDER_HEIGHT;
  private drops: WaterDrop[] = [];
  private currentHour = 0;
  private elapsedSeconds = 0;
  private secondsPerHour = 120;
  private isRunning = false;
  private dropTimer = 0;
  private dropInterval = 1 / 3;
  private floatingBuoy: THREE.Mesh;
  private buoyY = 0;
  private inlets: THREE.Mesh[] = [];
  private onHourChange: ((hour: number) => void) | null = null;
  private onLevelUpdate: ((levels: number[], hour: number, currentLevel: number) => void) | null = null;

  constructor() {
    this.group = new THREE.Group();
    this.waterLevels = new Array(CYLINDER_COUNT).fill(0);
    this.buildInlet();
    this.buildCylinders();
    this.buildPot();
    this.buildBuoy();
  }

  private buildInlet() {
    const geom = new THREE.CylinderGeometry(INLET_RADIUS, INLET_RADIUS, INLET_HEIGHT, 48);
    const mat = new THREE.MeshStandardMaterial({
      color: BRONZE_COLOR,
      metalness: 0.7,
      roughness: 0.3
    });
    const inlet = new THREE.Mesh(geom, mat);
    const y = TOTAL_HEIGHT - INLET_HEIGHT / 2;
    inlet.position.set(0, y, 0);
    this.group.add(inlet);

    const ringGeom = new THREE.TorusGeometry(INLET_RADIUS, 0.05, 16, 48);
    const ringMat = new THREE.MeshStandardMaterial({ color: 0xD4A24C, metalness: 0.8, roughness: 0.2 });
    const ring = new THREE.Mesh(ringGeom, ringMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.set(0, y + INLET_HEIGHT / 2, 0);
    this.group.add(ring);

    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#8B6914';
    ctx.fillRect(0, 0, 512, 512);
    ctx.fillStyle = '#D4A24C';
    ctx.font = 'bold 36px SimSun, STSong, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2 - Math.PI / 2;
      const r = 180;
      const x = 256 + r * Math.cos(angle);
      const y = 256 + r * Math.sin(angle);
      ctx.fillText(SHICHEN_NAMES[i], x, y);
    }
    const texture = new THREE.CanvasTexture(canvas);
    const discGeom = new THREE.CircleGeometry(INLET_RADIUS * 0.95, 48);
    const discMat = new THREE.MeshStandardMaterial({ map: texture, metalness: 0.5, roughness: 0.4 });
    const disc = new THREE.Mesh(discGeom, discMat);
    disc.rotation.x = -Math.PI / 2;
    disc.position.set(0, y + INLET_HEIGHT / 2 + 0.01, 0);
    this.group.add(disc);

    const spoutGeom = new THREE.CylinderGeometry(0.08, 0.08, 0.15, 16);
    const spoutMat = new THREE.MeshStandardMaterial({ color: BRONZE_COLOR, metalness: 0.7, roughness: 0.3 });
    const spout = new THREE.Mesh(spoutGeom, spoutMat);
    spout.position.set(0, y - INLET_HEIGHT / 2 - 0.075, 0);
    this.group.add(spout);
    this.inlets.push(spout);
  }

  private buildCylinders() {
    for (let i = 0; i < CYLINDER_COUNT; i++) {
      const y = TOTAL_HEIGHT - INLET_HEIGHT - 0.3 - i * CYLINDER_SPACING - CYLINDER_HEIGHT / 2;

      const glassGeom = new THREE.CylinderGeometry(CYLINDER_RADIUS, CYLINDER_RADIUS, CYLINDER_HEIGHT, 48, 1, true);
      const glassMat = new THREE.MeshPhysicalMaterial({
        color: 0x88AACC,
        transparent: true,
        opacity: 0.25,
        roughness: 0.05,
        metalness: 0.0,
        side: THREE.DoubleSide,
        transmission: 0.6
      });
      const glass = new THREE.Mesh(glassGeom, glassMat);
      glass.position.set(0, y, 0);
      this.group.add(glass);

      const rimGeom = new THREE.TorusGeometry(CYLINDER_RADIUS, 0.04, 12, 48);
      const rimMat = new THREE.MeshStandardMaterial({ color: BRONZE_COLOR, metalness: 0.7, roughness: 0.3 });
      const topRim = new THREE.Mesh(rimGeom, rimMat);
      topRim.rotation.x = Math.PI / 2;
      topRim.position.set(0, y + CYLINDER_HEIGHT / 2, 0);
      this.group.add(topRim);
      const botRim = new THREE.Mesh(rimGeom.clone(), rimMat);
      botRim.rotation.x = Math.PI / 2;
      botRim.position.set(0, y - CYLINDER_HEIGHT / 2, 0);
      this.group.add(botRim);

      const waterGeom = new THREE.CylinderGeometry(CYLINDER_RADIUS * 0.96, CYLINDER_RADIUS * 0.96, 0.01, 48);
      const waterMat = new THREE.MeshPhysicalMaterial({
        color: WATER_COLOR,
        transparent: true,
        opacity: 0.4,
        roughness: 0.1,
        metalness: 0.0,
        side: THREE.DoubleSide
      });
      const water = new THREE.Mesh(waterGeom, waterMat);
      water.position.set(0, y - CYLINDER_HEIGHT / 2 + 0.005, 0);
      this.group.add(water);
      this.waterMeshes.push(water);

      if (i < CYLINDER_COUNT - 1) {
        const pipeGeom = new THREE.CylinderGeometry(0.06, 0.06, 0.3, 12);
        const pipeMat = new THREE.MeshStandardMaterial({ color: BRONZE_COLOR, metalness: 0.7, roughness: 0.3 });
        const pipe = new THREE.Mesh(pipeGeom, pipeMat);
        pipe.position.set(CYLINDER_RADIUS + 0.1, y - CYLINDER_HEIGHT / 2 - 0.15, 0);
        this.group.add(pipe);
      }
    }
  }

  private buildPot() {
    const y = TOTAL_HEIGHT - INLET_HEIGHT - 0.3 - (CYLINDER_COUNT - 1) * CYLINDER_SPACING - CYLINDER_HEIGHT - POT_HEIGHT / 2 - 0.2;
    const bodyGeom = new THREE.CylinderGeometry(0.9, 1.1, POT_HEIGHT, 48);
    const bodyMat = new THREE.MeshStandardMaterial({ color: BRONZE_COLOR, metalness: 0.7, roughness: 0.3 });
    const body = new THREE.Mesh(bodyGeom, bodyMat);
    body.position.set(0, y, 0);
    this.group.add(body);

    const baseGeom = new THREE.CylinderGeometry(1.15, 1.2, 0.15, 48);
    const base = new THREE.Mesh(baseGeom, bodyMat);
    base.position.set(0, y - POT_HEIGHT / 2 - 0.075, 0);
    this.group.add(base);

    const headGeom = new THREE.SphereGeometry(0.2, 16, 16);
    const headMat = new THREE.MeshStandardMaterial({ color: 0xD4A24C, metalness: 0.8, roughness: 0.2 });
    const angles = [0, Math.PI / 2, Math.PI, Math.PI * 1.5];
    for (const angle of angles) {
      const head = new THREE.Mesh(headGeom, headMat);
      head.position.set(Math.cos(angle) * 0.95, y, Math.sin(angle) * 0.95);
      this.group.add(head);
    }

    const rimGeom = new THREE.TorusGeometry(0.85, 0.06, 12, 48);
    const rim = new THREE.Mesh(rimGeom, bodyMat);
    rim.rotation.x = Math.PI / 2;
    rim.position.set(0, y + POT_HEIGHT / 2, 0);
    this.group.add(rim);
  }

  private buildBuoy() {
    const geom = new THREE.CylinderGeometry(0.12, 0.08, 0.3, 16);
    const mat = new THREE.MeshStandardMaterial({ color: 0xCC3333, metalness: 0.3, roughness: 0.6 });
    this.floatingBuoy = new THREE.Mesh(geom, mat);
    const firstCylY = TOTAL_HEIGHT - INLET_HEIGHT - 0.3 - CYLINDER_HEIGHT / 2;
    this.floatingBuoy.position.set(0, firstCylY - CYLINDER_HEIGHT / 2 + 0.15, 0);
    this.group.add(this.floatingBuoy);
    this.buoyY = this.floatingBuoy.position.y;
  }

  start() {
    this.isRunning = true;
  }

  stop() {
    this.isRunning = false;
  }

  reset() {
    this.isRunning = false;
    this.elapsedSeconds = 0;
    this.currentHour = 0;
    this.waterLevels.fill(0);
    for (const d of this.drops) {
      this.group.remove(d.mesh);
    }
    this.drops = [];
    this.updateWaterMeshes();
    this.updateBuoy();
  }

  setOnHourChange(cb: (hour: number) => void) {
    this.onHourChange = cb;
  }

  setOnLevelUpdate(cb: (levels: number[], hour: number, currentLevel: number) => void) {
    this.onLevelUpdate = cb;
  }

  getWaterLevel(): number {
    return this.waterLevels[0];
  }

  getCurrentHour(): number {
    return this.currentHour;
  }

  getIsRunning(): boolean {
    return this.isRunning;
  }

  getElapsedTime(): number {
    return this.elapsedSeconds;
  }

  update(deltaTime: number) {
    if (!this.isRunning) return;

    this.elapsedSeconds += deltaTime;
    this.dropTimer += deltaTime;

    while (this.dropTimer >= this.dropInterval) {
      this.dropTimer -= this.dropInterval;
      this.spawnDrop();
    }

    this.updateDrops(deltaTime);
    this.updateWaterLevels(deltaTime);
    this.updateWaterMeshes();
    this.updateBuoy();

    const newHour = Math.floor(this.elapsedSeconds / this.secondsPerHour) % 12;
    if (newHour !== this.currentHour) {
      this.currentHour = newHour;
      if (this.onHourChange) {
        this.onHourChange(this.currentHour);
      }
    }

    if (this.onLevelUpdate) {
      this.onLevelUpdate([...this.waterLevels], this.currentHour, this.waterLevels[0]);
    }
  }

  private spawnDrop() {
    if (this.drops.length >= 150) return;

    const geom = new THREE.SphereGeometry(0.04, 8, 8);
    const mat = new THREE.MeshPhysicalMaterial({
      color: WATER_COLOR,
      transparent: true,
      opacity: 0.7,
      roughness: 0.1
    });
    const mesh = new THREE.Mesh(geom, mat);
    const topY = TOTAL_HEIGHT - INLET_HEIGHT - 0.15;
    mesh.position.set(
      (Math.random() - 0.5) * 0.1,
      topY,
      (Math.random() - 0.5) * 0.1
    );
    this.group.add(mesh);

    let targetCyl = 0;
    for (let i = 0; i < CYLINDER_COUNT; i++) {
      if (this.waterLevels[i] < this.maxWaterLevel) {
        targetCyl = i;
        break;
      }
      if (i === CYLINDER_COUNT - 1) targetCyl = i;
    }

    this.drops.push({
      mesh,
      velocity: new THREE.Vector3(0, -0.5, 0),
      life: 0,
      targetCylinder: targetCyl
    });
  }

  private updateDrops(dt: number) {
    const toRemove: number[] = [];

    for (let i = 0; i < this.drops.length; i++) {
      const drop = this.drops[i];
      drop.life += dt;
      drop.velocity.y -= 2.0 * dt;
      drop.mesh.position.add(drop.velocity.clone().multiplyScalar(dt));

      const cylIndex = drop.targetCylinder;
      const cylY = TOTAL_HEIGHT - INLET_HEIGHT - 0.3 - cylIndex * CYLINDER_SPACING;
      const waterSurfaceY = cylY - CYLINDER_HEIGHT / 2 + this.waterLevels[cylIndex];

      if (drop.mesh.position.y <= waterSurfaceY || drop.life > 5) {
        toRemove.push(i);
      }
    }

    for (let i = toRemove.length - 1; i >= 0; i--) {
      const idx = toRemove[i];
      this.group.remove(this.drops[idx].mesh);
      this.drops.splice(idx, 1);
    }
  }

  private updateWaterLevels(dt: number) {
    const risePerSecond = this.maxWaterLevel / this.secondsPerHour;
    for (let i = 0; i < CYLINDER_COUNT; i++) {
      if (this.waterLevels[i] < this.maxWaterLevel) {
        this.waterLevels[i] = Math.min(this.maxWaterLevel, this.waterLevels[i] + risePerSecond * dt);
        if (this.waterLevels[i] >= this.maxWaterLevel && i < CYLINDER_COUNT - 1) {
          continue;
        }
        break;
      }
    }
  }

  private updateWaterMeshes() {
    for (let i = 0; i < CYLINDER_COUNT; i++) {
      const cylY = TOTAL_HEIGHT - INLET_HEIGHT - 0.3 - i * CYLINDER_SPACING;
      const level = this.waterLevels[i];
      if (level <= 0.001) {
        this.waterMeshes[i].scale.y = 0.01;
        this.waterMeshes[i].visible = false;
        continue;
      }
      this.waterMeshes[i].visible = true;
      this.waterMeshes[i].scale.y = Math.max(0.01, level / 0.01);
      const bottomY = cylY - CYLINDER_HEIGHT / 2;
      this.waterMeshes[i].position.y = bottomY + level / 2;
    }
  }

  private updateBuoy() {
    const cylY = TOTAL_HEIGHT - INLET_HEIGHT - 0.3 - CYLINDER_HEIGHT / 2;
    const level = this.waterLevels[0];
    const bottomY = cylY - CYLINDER_HEIGHT / 2;
    this.floatingBuoy.position.y = bottomY + level + 0.15;
    this.buoyY = this.floatingBuoy.position.y;
  }

  getBuoyNormalizedPosition(): number {
    return Math.min(1, this.waterLevels[0] / this.maxWaterLevel);
  }
}

export { SHICHEN_NAMES, SHICHEN_DESCS };
