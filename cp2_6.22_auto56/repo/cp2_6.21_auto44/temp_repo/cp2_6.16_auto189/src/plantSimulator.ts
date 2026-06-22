import * as THREE from 'three';

export interface PlantStage {
  name: string;
  duration: number;
}

export const STAGES: PlantStage[] = [
  { name: '发芽期', duration: 6 },
  { name: '幼苗期', duration: 7 },
  { name: '生长期', duration: 8 },
  { name: '现蕾期', duration: 6 },
  { name: '开花期', duration: 7 },
];

export interface PlantParams {
  light: number;
  water: number;
  speed: number;
}

function bezierEase(t: number, p0: number, p1: number, p2: number, p3: number): number {
  const u = 1 - t;
  return (u * u * u * p0) + (3 * u * u * t * p1) + (3 * u * t * t * p2) + (t * t * t * p3);
}

export function easeInOutCubic(t: number): number {
  return bezierEase(t, 0, 0.42, 0.58, 1);
}

export function easeOutBack(t: number): number {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function getStagesDuration(params: PlantParams): number {
  const waterFactor = 0.5 + params.water * 0.5 + params.light * 0.2;
  return STAGES.reduce((sum, s) => sum + s.duration, 0) / waterFactor;
}

export function getStageInfo(globalProgress: number, params: PlantParams): { stageIndex: number; stageProgress: number } {
  const totalDuration = getStagesDuration(params);
  let elapsed = globalProgress * totalDuration;
  for (let i = 0; i < STAGES.length; i++) {
    const stageDuration = STAGES[i].duration;
    if (elapsed <= stageDuration) {
      return { stageIndex: i, stageProgress: elapsed / stageDuration };
    }
    elapsed -= stageDuration;
  }
  return { stageIndex: STAGES.length - 1, stageProgress: 1 };
}

export class PlantModel {
  group: THREE.Group;
  stem!: THREE.Mesh;
  leaves: THREE.Mesh[] = [];
  bud!: THREE.Mesh;
  petals: THREE.Mesh[] = [];
  seed!: THREE.Mesh;
  stemSegments = 5;
  petalCount = 5;

  constructor() {
    this.group = new THREE.Group();
    this.createGeometries();
  }

  createGeometries() {
    this.seed = new THREE.Mesh(
      new THREE.SphereGeometry(0.12, 16, 16),
      new THREE.MeshStandardMaterial({ color: 0x8B4513, roughness: 0.8, metalness: 0.1 })
    );
    this.seed.position.y = 0.12;
    this.group.add(this.seed);

    const stemMat = new THREE.MeshStandardMaterial({
      color: 0x2E8B57,
      roughness: 0.6,
      metalness: 0.05,
    });
    this.stem = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.04, 0.2, 12), stemMat);
    this.stem.position.y = 0.2;
    this.group.add(this.stem);

    this.createLeaves();

    const budMat = new THREE.MeshStandardMaterial({
      color: 0x90EE90,
      roughness: 0.5,
      metalness: 0.05,
    });
    this.bud = new THREE.Mesh(new THREE.SphereGeometry(0.1, 16, 16), budMat);
    this.bud.position.y = 0.3;
    this.bud.visible = false;
    this.group.add(this.bud);

    this.createPetals();
  }

  createLeaves() {
    const leafPositions = [
      { y: 0.35, angle: 0, scale: 0.9 },
      { y: 0.55, angle: Math.PI, scale: 1.0 },
      { y: 0.75, angle: Math.PI * 0.5, scale: 1.1 },
      { y: 0.95, angle: -Math.PI * 0.5, scale: 1.0 },
      { y: 1.15, angle: 0.25 * Math.PI, scale: 0.85 },
    ];
    for (const pos of leafPositions) {
      const leaf = this.createLeaf();
      leaf.userData = { baseY: pos.y, baseAngle: pos.angle, scale: pos.scale };
      leaf.visible = false;
      this.leaves.push(leaf);
      this.group.add(leaf);
    }
  }

  createLeaf(): THREE.Mesh {
    const shape = new THREE.Shape();
    shape.moveTo(0, 0);
    shape.quadraticCurveTo(0.25, 0.3, 0, 0.6);
    shape.quadraticCurveTo(-0.25, 0.3, 0, 0);
    const extrudeSettings = { depth: 0.02, bevelEnabled: false };
    const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    geometry.center();
    const material = new THREE.MeshStandardMaterial({
      color: 0x2ECC71,
      roughness: 0.7,
      metalness: 0.05,
      side: THREE.DoubleSide,
    });
    const mesh = new THREE.Mesh(geometry, material);
    return mesh;
  }

  createPetals() {
    const petalMat = new THREE.MeshStandardMaterial({
      color: 0xFF69B4,
      roughness: 0.4,
      metalness: 0.1,
      side: THREE.DoubleSide,
    });
    for (let i = 0; i < this.petalCount; i++) {
      const shape = new THREE.Shape();
      shape.moveTo(0, 0);
      shape.quadraticCurveTo(0.15, 0.1, 0.08, 0.4);
      shape.quadraticCurveTo(0, 0.5, -0.08, 0.4);
      shape.quadraticCurveTo(-0.15, 0.1, 0, 0);
      const extrudeSettings = { depth: 0.015, bevelEnabled: false };
      const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
      geometry.translate(0, 0.25, 0);
      const petal = new THREE.Mesh(geometry, petalMat.clone());
      petal.userData = { index: i };
      petal.visible = false;
      this.petals.push(petal);
      this.group.add(petal);
    }
  }

  update(globalProgress: number, params: PlantParams) {
    const { stageIndex, stageProgress } = getStageInfo(globalProgress, params);
    const easedProgress = easeInOutCubic(stageProgress);

    this.updateSeed(stageIndex, easedProgress);
    this.updateStem(stageIndex, easedProgress, params);
    this.updateLeaves(stageIndex, easedProgress, params);
    this.updateBud(stageIndex, easedProgress);
    this.updatePetals(stageIndex, easedProgress);

    return { stageIndex, stageProgress };
  }

  updateSeed(stageIndex: number, t: number) {
    if (stageIndex === 0) {
      this.seed.visible = true;
      this.seed.scale.setScalar(lerp(1, 1.3, easeInOutCubic(t)));
      this.seed.material.opacity = 1;
      (this.seed.material as THREE.MeshStandardMaterial).transparent = false;
    } else {
      const fadeOut = stageIndex === 1 ? easeInOutCubic(t) : 1;
      this.seed.scale.setScalar(lerp(1.3, 0.5, fadeOut));
      (this.seed.material as THREE.MeshStandardMaterial).transparent = true;
      (this.seed.material as THREE.MeshStandardMaterial).opacity = 1 - fadeOut;
    }
  }

  updateStem(stageIndex: number, t: number, params: PlantParams) {
    let targetHeight = 0.2;

    if (stageIndex === 0) {
      targetHeight = lerp(0, 0.2, t);
    } else if (stageIndex === 1) {
      targetHeight = lerp(0.2, 1.0, t);
    } else if (stageIndex === 2) {
      targetHeight = lerp(1.0, 2.2, t);
    } else if (stageIndex === 3) {
      targetHeight = lerp(2.2, 2.8, t);
    } else {
      targetHeight = 3.0;
    }

    const thicknessFactor = 0.6 + params.water * 0.4;
    const targetTopRadius = 0.02 + (targetHeight / 3) * 0.04 * thicknessFactor;
    const targetBottomRadius = 0.03 + (targetHeight / 3) * 0.05 * thicknessFactor;
    const baseTopRadius = 0.03;
    const baseBottomRadius = 0.04;
    const baseHeight = 0.2;

    this.stem.scale.set(
      (targetTopRadius + targetBottomRadius) / 2 / ((baseTopRadius + baseBottomRadius) / 2),
      targetHeight / baseHeight,
      (targetTopRadius + targetBottomRadius) / 2 / ((baseTopRadius + baseBottomRadius) / 2)
    );
    this.stem.position.y = targetHeight / 2;

    const stemMat = this.stem.material as THREE.MeshStandardMaterial;
    const greenHue = 0.33;
    const saturation = 0.5 + params.light * 0.3;
    const lightness = 0.25 + params.light * 0.15 + (stageIndex >= 2 ? 0.05 : 0);
    const color = new THREE.Color().setHSL(greenHue, saturation, lightness);
    stemMat.color = color;
  }

  getStemHeight(stageIndex: number, t: number): number {
    if (stageIndex === 0) return lerp(0, 0.2, t);
    if (stageIndex === 1) return lerp(0.2, 1.0, t);
    if (stageIndex === 2) return lerp(1.0, 2.2, t);
    if (stageIndex === 3) return lerp(2.2, 2.8, t);
    return 3.0;
  }

  updateLeaves(stageIndex: number, t: number, params: PlantParams) {
    const stemHeight = this.getStemHeight(stageIndex, t);
    const maxStemHeight = 3.0;

    for (let i = 0; i < this.leaves.length; i++) {
      const leaf = this.leaves[i];
      const ud = leaf.userData;
      const leafStartStage = i < 2 ? 1 : 2;
      const leafIndexInStage = i < 2 ? i : i - 2;
      const leafAppearT = (leafIndexInStage * 0.3) + (i >= 2 ? 0.2 : 0);

      if (stageIndex < leafStartStage) {
        leaf.visible = false;
        continue;
      }

      leaf.visible = true;
      let leafProgress: number;
      if (stageIndex === leafStartStage) {
        leafProgress = Math.max(0, (t - leafAppearT) / (1 - leafAppearT));
      } else {
        leafProgress = 1;
      }
      leafProgress = easeOutBack(easeInOutCubic(Math.min(1, Math.max(0, leafProgress))));

      const yPos = ud.baseY * (stemHeight / maxStemHeight);
      leaf.position.y = yPos;
      leaf.position.x = Math.cos(ud.baseAngle) * (0.04 + (stemHeight / maxStemHeight) * 0.06);
      leaf.position.z = Math.sin(ud.baseAngle) * (0.04 + (stemHeight / maxStemHeight) * 0.06);

      const baseScale = ud.scale * leafProgress * (0.5 + params.water * 0.5);
      leaf.scale.set(baseScale, baseScale, baseScale);

      const rotateIn = leafProgress;
      leaf.rotation.set(
        Math.PI * 0.5 - rotateIn * Math.PI * 0.3,
        ud.baseAngle + Math.PI,
        Math.cos(ud.baseAngle) * (1 - rotateIn) * 0.8
      );

      const leafMat = leaf.material as THREE.MeshStandardMaterial;
      const hue = 0.3;
      const sat = 0.5 + params.light * 0.4;
      const light = 0.35 + params.light * 0.2;
      leafMat.color = new THREE.Color().setHSL(hue, sat, light);
    }
  }

  updateBud(stageIndex: number, t: number) {
    const stemHeight = this.getStemHeight(stageIndex, t);
    if (stageIndex < 3) {
      this.bud.visible = false;
      return;
    }

    this.bud.visible = true;
    if (stageIndex === 3) {
      const budProgress = easeInOutCubic(t);
      this.bud.scale.setScalar(0.25 + budProgress * 0.55);
      (this.bud.material as THREE.MeshStandardMaterial).color = new THREE.Color().setHSL(
        0.33,
        0.6,
        lerp(0.5, 0.42, budProgress)
      );
      this.bud.position.y = stemHeight + 0.04 + budProgress * 0.16;
    } else if (stageIndex === 4) {
      const bloomProgress = easeInOutCubic(t);
      this.bud.scale.setScalar(lerp(0.8, 0.55, bloomProgress));
      (this.bud.material as THREE.MeshStandardMaterial).color = new THREE.Color().setHSL(
        0.1,
        lerp(0.5, 0.9, bloomProgress),
        lerp(0.55, 0.6, bloomProgress)
      );
      (this.bud.material as THREE.MeshStandardMaterial).emissive = new THREE.Color().setHSL(0.1, 0.5, 0.3);
      (this.bud.material as THREE.MeshStandardMaterial).emissiveIntensity = bloomProgress * 0.4;
      this.bud.position.y = stemHeight + 0.16;
    }
  }

  updatePetals(stageIndex: number, t: number) {
    if (stageIndex < 4) {
      for (const petal of this.petals) petal.visible = false;
      return;
    }

    const stemHeight = this.getStemHeight(stageIndex, t);
    const bloomProgress = easeOutBack(easeInOutCubic(t));
    const centerY = stemHeight + 0.16;
    const openAngle = bloomProgress * Math.PI * 0.42;
    const petalSize = 0.35 + bloomProgress * 1.4;

    for (let i = 0; i < this.petals.length; i++) {
      const petal = this.petals[i];
      petal.visible = true;
      const angle = (i / this.petalCount) * Math.PI * 2;

      petal.position.set(
        Math.cos(angle) * 0.08 * bloomProgress,
        centerY,
        Math.sin(angle) * 0.08 * bloomProgress
      );

      const euler = new THREE.Euler(
        -Math.PI / 2 + openAngle,
        angle,
        0,
        'YXZ'
      );
      petal.rotation.copy(euler);

      petal.scale.set(petalSize, petalSize, petalSize * 0.6);

      const petalMat = petal.material as THREE.MeshStandardMaterial;
      const hue = 0.92;
      const sat = lerp(0.55, 0.85, bloomProgress);
      const light = lerp(0.68, 0.78, bloomProgress);
      petalMat.color = new THREE.Color().setHSL(hue, sat, light);
    }
  }
}

export class PollenSystem {
  group: THREE.Group;
  particles: THREE.Mesh[] = [];
  maxParticles = 200;
  velocities: THREE.Vector3[] = [];
  active: boolean[] = [];
  life: number[] = [];

  constructor() {
    this.group = new THREE.Group();
    this.createParticles();
  }

  createParticles() {
    const geometry = new THREE.SphereGeometry(0.012, 6, 6);
    for (let i = 0; i < this.maxParticles; i++) {
      const material = new THREE.MeshStandardMaterial({
        color: 0xFFD700,
        emissive: 0xFFA500,
        emissiveIntensity: 0.3,
        transparent: true,
        opacity: 0.8,
      });
      const particle = new THREE.Mesh(geometry, material);
      particle.visible = false;
      this.particles.push(particle);
      this.velocities.push(new THREE.Vector3());
      this.active.push(false);
      this.life.push(0);
      this.group.add(particle);
    }
  }

  emit(stemHeight: number, amount: number, bloomProgress: number) {
    if (bloomProgress < 0.3) return;
    let emitted = 0;
    for (let i = 0; i < this.maxParticles && emitted < amount; i++) {
      if (!this.active[i]) {
        this.active[i] = true;
        this.life[i] = 1;
        const angle = Math.random() * Math.PI * 2;
        const radius = 0.08 + Math.random() * 0.08;
        this.particles[i].position.set(
          Math.cos(angle) * radius,
          stemHeight + 0.2 + Math.random() * 0.1,
          Math.sin(angle) * radius
        );
        this.velocities[i].set(
          (Math.random() - 0.5) * 0.006,
          0.008 + Math.random() * 0.012,
          (Math.random() - 0.5) * 0.006
        );
        this.particles[i].visible = true;
        emitted++;
      }
    }
  }

  update(delta: number) {
    for (let i = 0; i < this.maxParticles; i++) {
      if (!this.active[i]) continue;
      this.life[i] -= delta * 0.15;
      if (this.life[i] <= 0) {
        this.active[i] = false;
        this.particles[i].visible = false;
        continue;
      }
      this.particles[i].position.add(this.velocities[i]);
      this.velocities[i].y -= delta * 0.002;
      this.particles[i].rotation.x += delta * 2;
      this.particles[i].rotation.y += delta * 3;
      (this.particles[i].material as THREE.MeshStandardMaterial).opacity = this.life[i] * 0.8;
      const scale = 0.5 + this.life[i] * 0.8;
      this.particles[i].scale.setScalar(scale);
    }
  }
}
