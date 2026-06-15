import * as THREE from 'three';

export enum PapermakingStep {
  SOAKING = 0,
  COOKING = 1,
  PULPING = 2,
  SHEETING = 3,
  PRESSING = 4,
  DRYING = 5,
}

export interface ProcessParams {
  soakingDuration: number;
  pulpingCount: number;
  pressingForce: number;
}

export interface PaperQuality {
  softness: number;
  uniformity: number;
  smoothness: number;
  thickness: number;
  totalScore: number;
}

type StepCompleteCallback = (step: PapermakingStep) => void;
type ProgressCallback = (step: PapermakingStep, progress: number) => void;

const easeInOutCubic = (t: number): number =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

const STEP_NAMES: Record<PapermakingStep, string> = {
  [PapermakingStep.SOAKING]: '原料浸泡',
  [PapermakingStep.COOKING]: '蒸煮',
  [PapermakingStep.PULPING]: '捣浆',
  [PapermakingStep.SHEETING]: '抄纸',
  [PapermakingStep.PRESSING]: '压榨',
  [PapermakingStep.DRYING]: '晒干',
};

const STEP_DURATION = {
  [PapermakingStep.SOAKING]: 6,
  [PapermakingStep.COOKING]: 6,
  [PapermakingStep.PULPING]: 7,
  [PapermakingStep.SHEETING]: 6,
  [PapermakingStep.PRESSING]: 6,
  [PapermakingStep.DRYING]: 7,
};

const TOTAL_PARTICLES = 480;

export class PapermakingProcess {
  private scene: THREE.Scene;
  private root: THREE.Group;

  private currentStep: PapermakingStep = PapermakingStep.SOAKING;
  private completedSteps: Set<PapermakingStep> = new Set();
  private isRunning: boolean = false;
  private stepElapsed: number = 0;

  private params: ProcessParams = {
    soakingDuration: 5,
    pulpingCount: 9,
    pressingForce: 5,
  };

  private quality: PaperQuality = {
    softness: 50, uniformity: 50, smoothness: 50, thickness: 50, totalScore: 50,
  };

  private stepCompleteCb: StepCompleteCallback | null = null;
  private progressCb: ProgressCallback | null = null;

  private particlePositions: Float32Array;
  private particleColors: Float32Array;
  private particleVelocities: Float32Array;
  private particleLifetimes: Float32Array;
  private particleGeometry: THREE.BufferGeometry;
  private particleMaterial: THREE.PointsMaterial;
  private particles: THREE.Points;

  private fiberMeshes: THREE.Mesh[] = [];
  private soakingTub: THREE.Group | null = null;
  private cookingPot: THREE.Group | null = null;
  private pulpingSetup: { mallet: THREE.Group; mortar: THREE.Mesh; fibers: THREE.Group } | null = null;
  private sheetingSetup: { frame: THREE.Group; mesh: THREE.Mesh; wetPaper: THREE.Mesh } | null = null;
  private pressingSetup: { topStone: THREE.Mesh; bottomStone: THREE.Mesh; paperStack: THREE.Group } | null = null;
  private dryingPaper: THREE.Mesh | null = null;
  private wallMesh!: THREE.Mesh;
  private floorMesh!: THREE.Mesh;

  private time: number = 0;
  private __lastHitCycle: number = -1;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.root = new THREE.Group();
    this.scene.add(this.root);

    this.createEnvironment();

    this.particlePositions = new Float32Array(TOTAL_PARTICLES * 3);
    this.particleColors = new Float32Array(TOTAL_PARTICLES * 3);
    this.particleVelocities = new Float32Array(TOTAL_PARTICLES * 3);
    this.particleLifetimes = new Float32Array(TOTAL_PARTICLES);

    this.particleGeometry = new THREE.BufferGeometry();
    this.particleGeometry.setAttribute('position', new THREE.BufferAttribute(this.particlePositions, 3));
    this.particleGeometry.setAttribute('color', new THREE.BufferAttribute(this.particleColors, 3));

    this.particleMaterial = new THREE.PointsMaterial({
      size: 0.08,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
    });

    this.particles = new THREE.Points(this.particleGeometry, this.particleMaterial);
    this.particles.frustumCulled = false;
    this.root.add(this.particles);

    this.resetAllParticles();
    this.buildStepScene(PapermakingStep.SOAKING);
  }

  static getStepName(step: PapermakingStep): string {
    return STEP_NAMES[step];
  }

  setParams(params: Partial<ProcessParams>): void {
    this.params = { ...this.params, ...params };
  }

  getParams(): ProcessParams {
    return { ...this.params };
  }

  onStepComplete(cb: StepCompleteCallback): void {
    this.stepCompleteCb = cb;
  }

  onProgress(cb: ProgressCallback): void {
    this.progressCb = cb;
  }

  getCurrentStep(): PapermakingStep {
    return this.currentStep;
  }

  getCompletedSteps(): PapermakingStep[] {
    return Array.from(this.completedSteps);
  }

  getProgress(): number {
    const d = STEP_DURATION[this.currentStep];
    return clamp(this.stepElapsed / d, 0, 1);
  }

  isStepRunning(): boolean {
    return this.isRunning;
  }

  startStep(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.stepElapsed = 0;
  }

  jumpToStep(step: PapermakingStep): void {
    if (step === this.currentStep && !this.isRunning) {
      this.stepElapsed = 0;
      return;
    }
    this.isRunning = false;
    this.stepElapsed = 0;
    this.currentStep = step;
    this.clearStepProps();
    this.buildStepScene(step);
    this.resetAllParticles();
  }

  getQuality(): PaperQuality {
    return { ...this.quality };
  }

  private createEnvironment(): void {
    const wallGeo = new THREE.PlaneGeometry(30, 18);
    const wallMat = new THREE.MeshStandardMaterial({
      color: 0xe8e0d0, roughness: 0.95, metalness: 0.0,
    });
    this.wallMesh = new THREE.Mesh(wallGeo, wallMat);
    this.wallMesh.position.set(0, 5.5, -6);
    this.wallMesh.receiveShadow = true;
    this.root.add(this.wallMesh);

    const floorGeo = new THREE.PlaneGeometry(30, 20);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0xdeb887, roughness: 0.85, metalness: 0.0,
    });
    this.floorMesh = new THREE.Mesh(floorGeo, floorMat);
    this.floorMesh.rotation.x = -Math.PI / 2;
    this.floorMesh.position.y = 0;
    this.floorMesh.receiveShadow = true;
    this.root.add(this.floorMesh);
  }

  private resetAllParticles(): void {
    for (let i = 0; i < TOTAL_PARTICLES; i++) {
      this.hideParticle(i);
    }
    (this.particleGeometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
    (this.particleGeometry.attributes.color as THREE.BufferAttribute).needsUpdate = true;
  }

  private hideParticle(i: number): void {
    this.particlePositions[i * 3] = 0;
    this.particlePositions[i * 3 + 1] = -1000;
    this.particlePositions[i * 3 + 2] = 0;
    this.particleColors[i * 3] = 0;
    this.particleColors[i * 3 + 1] = 0;
    this.particleColors[i * 3 + 2] = 0;
    this.particleLifetimes[i] = -1;
    this.particleVelocities[i * 3] = 0;
    this.particleVelocities[i * 3 + 1] = 0;
    this.particleVelocities[i * 3 + 2] = 0;
  }

  private clearStepProps(): void {
    const groups = [this.soakingTub, this.cookingPot] as (THREE.Group | THREE.Mesh | null)[];
    if (this.pulpingSetup) groups.push(this.pulpingSetup.mallet, this.pulpingSetup.mortar, this.pulpingSetup.fibers);
    if (this.sheetingSetup) groups.push(this.sheetingSetup.frame, this.sheetingSetup.mesh, this.sheetingSetup.wetPaper);
    if (this.pressingSetup) groups.push(this.pressingSetup.topStone, this.pressingSetup.bottomStone, this.pressingSetup.paperStack);
    if (this.dryingPaper) groups.push(this.dryingPaper);
    this.fiberMeshes.forEach(m => groups.push(m));
    this.fiberMeshes = [];

    groups.forEach(obj => {
      if (!obj) return;
      this.root.remove(obj);
      if (obj instanceof THREE.Mesh) {
        obj.geometry.dispose();
        if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose());
        else obj.material.dispose();
      } else if (obj instanceof THREE.Group) {
        obj.traverse(child => {
          if (child instanceof THREE.Mesh) {
            child.geometry.dispose();
            if (Array.isArray(child.material)) child.material.forEach(m => m.dispose());
            else child.material.dispose();
          }
        });
      }
    });

    this.soakingTub = null;
    this.cookingPot = null;
    this.pulpingSetup = null;
    this.sheetingSetup = null;
    this.pressingSetup = null;
    this.dryingPaper = null;
  }

  private buildStepScene(step: PapermakingStep): void {
    switch (step) {
      case PapermakingStep.SOAKING: this.buildSoakingScene(); break;
      case PapermakingStep.COOKING: this.buildCookingScene(); break;
      case PapermakingStep.PULPING: this.buildPulpingScene(); break;
      case PapermakingStep.SHEETING: this.buildSheetingScene(); break;
      case PapermakingStep.PRESSING: this.buildPressingScene(); break;
      case PapermakingStep.DRYING: this.buildDryingScene(); break;
    }
  }

  private buildSoakingScene(): void {
    const group = new THREE.Group();
    group.position.set(0, 0, 0);

    const tubGeo = new THREE.BoxGeometry(4, 1.2, 3);
    const tubMat = new THREE.MeshStandardMaterial({ color: 0x8b6f47, roughness: 0.7, metalness: 0.0 });
    const tub = new THREE.Mesh(tubGeo, tubMat);
    tub.position.y = 0.6;
    tub.castShadow = true;
    tub.receiveShadow = true;
    group.add(tub);

    const innerGeo = new THREE.BoxGeometry(3.6, 1.0, 2.6);
    const innerMat = new THREE.MeshStandardMaterial({ color: 0x5a8fb8, roughness: 0.1, metalness: 0.0, transparent: true, opacity: 0.75 });
    const water = new THREE.Mesh(innerGeo, innerMat);
    water.position.y = 0.7;
    water.name = 'water';
    group.add(water);

    for (let i = 0; i < 18; i++) {
      const size = 0.18 + Math.random() * 0.22;
      const fiberGeo = new THREE.SphereGeometry(size, 10, 8);
      const fiberMat = new THREE.MeshStandardMaterial({
        color: 0xc8b88a, roughness: 0.8, transparent: true, opacity: 0.75,
      });
      const fiber = new THREE.Mesh(fiberGeo, fiberMat);
      fiber.position.set(
        (Math.random() - 0.5) * 3.0,
        0.6 + Math.random() * 0.6,
        (Math.random() - 0.5) * 2.2
      );
      fiber.userData = {
        basePos: fiber.position.clone(),
        phase: Math.random() * Math.PI * 2,
        freq: 0.5 + Math.random() * 1.0,
        amp: 0.1 + Math.random() * 0.12,
        scale: 1,
      };
      fiber.castShadow = true;
      this.fiberMeshes.push(fiber);
      group.add(fiber);
    }

    this.soakingTub = group;
    this.root.add(group);
  }

  private buildCookingScene(): void {
    const group = new THREE.Group();

    const potGeo = new THREE.CylinderGeometry(1.6, 1.3, 1.8, 24);
    const potMat = new THREE.MeshStandardMaterial({ color: 0x5a4a3a, roughness: 0.7 });
    const pot = new THREE.Mesh(potGeo, potMat);
    pot.position.y = 0.9;
    pot.castShadow = true;
    pot.receiveShadow = true;
    group.add(pot);

    const rimGeo = new THREE.TorusGeometry(1.6, 0.12, 8, 32);
    const rimMat = new THREE.MeshStandardMaterial({ color: 0x3a2a1a, roughness: 0.6 });
    const rim = new THREE.Mesh(rimGeo, rimMat);
    rim.rotation.x = Math.PI / 2;
    rim.position.y = 1.8;
    group.add(rim);

    const lidGeo = new THREE.CylinderGeometry(1.7, 1.6, 0.25, 24);
    const lidMat = new THREE.MeshStandardMaterial({ color: 0x4a3a2a, roughness: 0.6 });
    const lid = new THREE.Mesh(lidGeo, lidMat);
    lid.position.y = 2.1;
    lid.name = 'lid';
    group.add(lid);

    const fireGeo = new THREE.ConeGeometry(0.9, 0.8, 8);
    const fireMat = new THREE.MeshBasicMaterial({ color: 0xff7a2a, transparent: true, opacity: 0.8 });
    const fire = new THREE.Mesh(fireGeo, fireMat);
    fire.position.y = 0.35;
    fire.name = 'fire';
    group.add(fire);

    this.cookingPot = group;
    this.root.add(group);
  }

  private buildPulpingScene(): void {
    const group = new THREE.Group();

    const mortarGeo = new THREE.CylinderGeometry(1.1, 0.9, 0.8, 20);
    const mortarMat = new THREE.MeshStandardMaterial({ color: 0x6b5344, roughness: 0.9 });
    const mortar = new THREE.Mesh(mortarGeo, mortarMat);
    mortar.position.y = 0.4;
    mortar.castShadow = true;
    mortar.receiveShadow = true;
    this.root.add(mortar);

    const fibersGroup = new THREE.Group();
    for (let i = 0; i < 60; i++) {
      const w = 0.22 + Math.random() * 0.22;
      const h = 0.05 + Math.random() * 0.05;
      const d = 0.05 + Math.random() * 0.05;
      const fGeo = new THREE.BoxGeometry(w, h, d);
      const fMat = new THREE.MeshStandardMaterial({ color: 0xe0d4a8, roughness: 0.9 });
      const f = new THREE.Mesh(fGeo, fMat);
      f.position.set(
        (Math.random() - 0.5) * 1.4,
        0.85 + Math.random() * 0.2,
        (Math.random() - 0.5) * 1.4
      );
      f.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
      f.userData = { baseScale: 1 };
      this.fiberMeshes.push(f);
      fibersGroup.add(f);
    }
    this.root.add(fibersGroup);

    const malletGroup = new THREE.Group();
    const handleGeo = new THREE.CylinderGeometry(0.08, 0.08, 2.2, 12);
    const handleMat = new THREE.MeshStandardMaterial({ color: 0x8b6f47, roughness: 0.7 });
    const handle = new THREE.Mesh(handleGeo, handleMat);
    handle.position.y = 1.1;
    handle.castShadow = true;
    malletGroup.add(handle);

    const headGeo = new THREE.CylinderGeometry(0.35, 0.38, 0.7, 16);
    const headMat = new THREE.MeshStandardMaterial({ color: 0x5a4a3a, roughness: 0.8 });
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.y = 0;
    head.castShadow = true;
    malletGroup.add(head);

    malletGroup.position.set(0, 2.8, 0);
    this.root.add(malletGroup);

    this.pulpingSetup = { mallet: malletGroup, mortar, fibers: fibersGroup };
  }

  private buildSheetingScene(): void {
    const frameGroup = new THREE.Group();

    const frameMat = new THREE.MeshStandardMaterial({ color: 0x6b8e23, roughness: 0.7 });
    const thickness = 0.08;
    const w = 3.2, h = 2.4;
    const bars = [
      { size: [w, thickness, thickness], pos: [0, h / 2, 0] },
      { size: [w, thickness, thickness], pos: [0, -h / 2, 0] },
      { size: [thickness, h, thickness], pos: [-w / 2, 0, 0] },
      { size: [thickness, h, thickness], pos: [w / 2, 0, 0] },
    ];
    bars.forEach(b => {
      const g = new THREE.BoxGeometry(b.size[0], b.size[1], b.size[2]);
      const m = new THREE.Mesh(g, frameMat);
      m.position.set(b.pos[0], b.pos[1], b.pos[2]);
      m.castShadow = true;
      frameGroup.add(m);
    });

    const meshGeo = new THREE.PlaneGeometry(w - 0.12, h - 0.12, 24, 18);
    const meshMat = new THREE.MeshStandardMaterial({
      color: 0x8a7a5a, roughness: 0.9, transparent: true, opacity: 0.55, side: THREE.DoubleSide,
    });
    const mesh = new THREE.Mesh(meshGeo, meshMat);
    mesh.castShadow = true;
    frameGroup.add(mesh);

    const wetPaperGeo = new THREE.PlaneGeometry(w - 0.3, h - 0.3, 24, 18);
    const wetPaperMat = new THREE.MeshStandardMaterial({
      color: 0xd4c49a, roughness: 0.8, transparent: true, opacity: 0.0, side: THREE.DoubleSide,
    });
    const wetPaper = new THREE.Mesh(wetPaperGeo, wetPaperMat);
    wetPaper.position.z = -0.04;
    frameGroup.add(wetPaper);

    frameGroup.rotation.x = -0.25;
    frameGroup.position.set(0, 1.2, 0);
    this.root.add(frameGroup);

    this.sheetingSetup = { frame: frameGroup, mesh, wetPaper };
  }

  private buildPressingScene(): void {
    const bottomGeo = new THREE.BoxGeometry(3.2, 0.4, 2.4);
    const stoneMat = new THREE.MeshStandardMaterial({ color: 0x8a8278, roughness: 0.95 });
    const bottomStone = new THREE.Mesh(bottomGeo, stoneMat);
    bottomStone.position.y = 0.2;
    bottomStone.castShadow = true;
    bottomStone.receiveShadow = true;
    this.root.add(bottomStone);

    const stackGroup = new THREE.Group();
    for (let i = 0; i < 6; i++) {
      const pGeo = new THREE.BoxGeometry(2.8, 0.08, 2.0);
      const pMat = new THREE.MeshStandardMaterial({ color: 0xf0e6c8, roughness: 0.85 });
      const p = new THREE.Mesh(pGeo, pMat);
      p.position.y = 0.4 + i * 0.08;
      stackGroup.add(p);
    }
    this.root.add(stackGroup);

    const topGeo = new THREE.BoxGeometry(3.0, 0.5, 2.2);
    const topStone = new THREE.Mesh(topGeo, stoneMat);
    topStone.position.y = 3.2;
    topStone.castShadow = true;
    topStone.receiveShadow = true;
    this.root.add(topStone);

    this.pressingSetup = { topStone, bottomStone, paperStack: stackGroup };
  }

  private buildDryingScene(): void {
    const paperGeo = new THREE.PlaneGeometry(4.4, 3.0, 60, 40);
    const positions = paperGeo.attributes.position;
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      const y = positions.getY(i);
      const edgeFactor = Math.max(Math.abs(x) / 2.2, Math.abs(y) / 1.5);
      const z = (Math.random() - 0.5) * 0.025 + Math.pow(edgeFactor, 3) * 0.08;
      positions.setZ(i, z);
    }
    paperGeo.computeVertexNormals();

    const paperMat = new THREE.MeshStandardMaterial({
      color: 0xe6d6a8, roughness: 0.95, side: THREE.DoubleSide,
    });
    const paper = new THREE.Mesh(paperGeo, paperMat);
    paper.position.set(0, 3.0, -0.5);
    paper.rotation.x = -0.08;
    paper.castShadow = true;
    paper.receiveShadow = true;
    this.root.add(paper);

    const frameMat = new THREE.MeshStandardMaterial({ color: 0x6b4a2a, roughness: 0.8 });
    const w = 4.6, h = 3.2, t = 0.1;
    const frameBars = [
      [w, t, t, 0, h / 2, 0],
      [w, t, t, 0, -h / 2, 0],
      [t, h, t, -w / 2, 0, 0],
      [t, h, t, w / 2, 0, 0],
    ];
    frameBars.forEach(b => {
      const g = new THREE.BoxGeometry(b[0], b[1], b[2]);
      const m = new THREE.Mesh(g, frameMat);
      m.position.set(b[3], b[4], b[5]);
      paper.add(m);
    });

    this.dryingPaper = paper;
  }

  update(delta: number): void {
    this.time += delta;

    if (this.isRunning) {
      const duration = STEP_DURATION[this.currentStep];
      this.stepElapsed += delta;
      const progress = clamp(this.stepElapsed / duration, 0, 1);
      if (this.progressCb) this.progressCb(this.currentStep, progress);

      this.animateStep(progress, delta);

      if (this.stepElapsed >= duration) {
        this.isRunning = false;
        this.completedSteps.add(this.currentStep);
        this.updateQualityAfterStep(this.currentStep);
        if (this.stepCompleteCb) this.stepCompleteCb(this.currentStep);
      }
    } else {
      this.idleAnimation(delta);
    }

    this.updateParticles(delta);
  }

  private idleAnimation(delta: number): void {
    switch (this.currentStep) {
      case PapermakingStep.SOAKING: this.animateSoaking(0.15, delta, true); break;
      case PapermakingStep.COOKING: this.animateCooking(0.1, delta, true); break;
      case PapermakingStep.DRYING: this.animateDrying(0.5, delta); break;
    }
  }

  private animateStep(progress: number, delta: number): void {
    const ep = easeInOutCubic(progress);
    switch (this.currentStep) {
      case PapermakingStep.SOAKING: this.animateSoaking(ep, delta, false); break;
      case PapermakingStep.COOKING: this.animateCooking(ep, delta, false); break;
      case PapermakingStep.PULPING: this.animatePulping(progress, ep); break;
      case PapermakingStep.SHEETING: this.animateSheeting(ep); break;
      case PapermakingStep.PRESSING: this.animatePressing(progress, ep, delta); break;
      case PapermakingStep.DRYING: this.animateDrying(ep, delta); break;
    }
  }

  private animateSoaking(ep: number, delta: number, idle: boolean): void {
    if (!this.soakingTub) return;
    const factor = idle ? 1 : (0.3 + ep * 0.7);
    const soft = this.params.soakingDuration / 10;

    this.fiberMeshes.forEach(fiber => {
      const ud = fiber.userData;
      const t = this.time * ud.freq + ud.phase;
      fiber.position.x = ud.basePos.x + Math.sin(t * 1.2) * ud.amp * 2 * factor;
      fiber.position.z = ud.basePos.z + Math.cos(t) * ud.amp * 1.5 * factor;
      fiber.position.y = ud.basePos.y + Math.sin(t * 2 + 0.5) * 0.06 * factor;
      fiber.rotation.x += delta * 0.6 * factor;
      fiber.rotation.y += delta * 0.4 * factor;
      const targetScale = 1 + soft * ep * 0.35;
      fiber.scale.setScalar(lerp(fiber.scale.x, targetScale, 0.05));
      if (fiber.material instanceof THREE.MeshStandardMaterial) {
        fiber.material.opacity = 0.5 + 0.4 * factor;
      }
    });

    const water = this.soakingTub.getObjectByName('water') as THREE.Mesh;
    if (water) {
      const positions = (water.geometry as THREE.BoxGeometry).attributes.position;
      for (let i = 0; i < positions.count; i++) {
        const y = positions.getY(i);
        if (Math.abs(y - 0.5) < 0.01) {
          const x = positions.getX(i);
          const z = positions.getZ(i);
          const wave = Math.sin(x * 4 + this.time * 2) * 0.03 * factor
                     + Math.cos(z * 5 + this.time * 2.3) * 0.02 * factor;
          positions.setY(i, 0.5 + wave);
        }
      }
      positions.needsUpdate = true;
      water.geometry.computeVertexNormals();
    }

    if (!idle && Math.random() < 0.5 * factor) this.emitWaterParticle();
  }

  private emitWaterParticle(): void {
    const i = this.findFreeParticle();
    if (i < 0) return;
    this.particlePositions[i * 3] = (Math.random() - 0.5) * 3.0;
    this.particlePositions[i * 3 + 1] = 1.2 + Math.random() * 0.1;
    this.particlePositions[i * 3 + 2] = (Math.random() - 0.5) * 2.2;
    this.particleVelocities[i * 3] = (Math.random() - 0.5) * 0.2;
    this.particleVelocities[i * 3 + 1] = 0.3 + Math.random() * 0.4;
    this.particleVelocities[i * 3 + 2] = (Math.random() - 0.5) * 0.2;
    this.particleColors[i * 3] = 0.55;
    this.particleColors[i * 3 + 1] = 0.75;
    this.particleColors[i * 3 + 2] = 0.85;
    this.particleLifetimes[i] = 1.2 + Math.random() * 0.8;
  }

  private animateCooking(ep: number, delta: number, idle: boolean): void {
    if (!this.cookingPot) return;
    const factor = idle ? 0.3 : (0.2 + ep * 0.9);

    const lid = this.cookingPot.getObjectByName('lid') as THREE.Mesh;
    if (lid) {
      lid.position.y = 2.1 + Math.sin(this.time * 3) * 0.04 * factor;
      lid.rotation.z = Math.sin(this.time * 2) * 0.015 * factor;
    }
    const fire = this.cookingPot.getObjectByName('fire') as THREE.Mesh;
    if (fire) {
      fire.scale.setScalar(0.9 + Math.sin(this.time * 10) * 0.1 * factor);
      if (fire.material instanceof THREE.MeshBasicMaterial) {
        fire.material.opacity = 0.6 + 0.35 * factor;
      }
    }

    if (!idle) {
      const rate = 3 + ep * 8;
      for (let j = 0; j < Math.ceil(rate * delta * 30); j++) {
        this.emitSteamParticle();
      }
    }
  }

  private emitSteamParticle(): void {
    const i = this.findFreeParticle();
    if (i < 0) return;
    const ang = Math.random() * Math.PI * 2;
    const r = Math.random() * 1.3;
    this.particlePositions[i * 3] = Math.cos(ang) * r;
    this.particlePositions[i * 3 + 1] = 2.2;
    this.particlePositions[i * 3 + 2] = Math.sin(ang) * r;
    this.particleVelocities[i * 3] = (Math.random() - 0.5) * 0.3;
    this.particleVelocities[i * 3 + 1] = 1.0 + Math.random() * 0.8;
    this.particleVelocities[i * 3 + 2] = (Math.random() - 0.5) * 0.3;
    const c = 0.85 + Math.random() * 0.12;
    this.particleColors[i * 3] = c;
    this.particleColors[i * 3 + 1] = c;
    this.particleColors[i * 3 + 2] = c;
    this.particleLifetimes[i] = 2.2 + Math.random() * 1.0;
  }

  private animatePulping(progress: number, ep: number): void {
    if (!this.pulpingSetup) return;
    const count = this.params.pulpingCount;
    const cycleProgress = (progress * count) % 1;
    const completedCycles = Math.floor(progress * count);

    let malletY: number;
    const upY = 2.8, downY = 0.5;
    const p = cycleProgress;
    if (p < 0.5) {
      const t = easeInOutCubic(p * 2);
      malletY = lerp(upY, downY, t);
    } else {
      const t = easeInOutCubic((p - 0.5) * 2);
      malletY = lerp(downY, upY, t);
    }
    this.pulpingSetup.mallet.position.y = malletY;
    this.pulpingSetup.mallet.rotation.z = Math.sin(this.time * 1.2) * 0.04;

    const refineRatio = clamp(completedCycles / Math.max(1, count), 0, 1);
    this.fiberMeshes.forEach(fiber => {
      const target = 1 - refineRatio * 0.65;
      const s = lerp(fiber.userData.baseScale, target, 0.1);
      fiber.scale.set(s, s * 0.7, s);
      fiber.userData.baseScale = target;
      if (p > 0.35 && p < 0.5) {
        fiber.position.x += (Math.random() - 0.5) * 0.04;
        fiber.position.z += (Math.random() - 0.5) * 0.04;
      }
      fiber.rotation.x += 0.01;
      fiber.rotation.z += 0.008;
    });

    if (cycleProgress > 0.45 && cycleProgress < 0.55 && this.__lastHitCycle !== completedCycles) {
      this.__lastHitCycle = completedCycles;
      for (let k = 0; k < 2; k++) this.emitPulpParticle();
    }
  }

  private emitPulpParticle(): void {
    const i = this.findFreeParticle();
    if (i < 0) return;
    this.particlePositions[i * 3] = (Math.random() - 0.5) * 1.2;
    this.particlePositions[i * 3 + 1] = 1.0;
    this.particlePositions[i * 3 + 2] = (Math.random() - 0.5) * 1.2;
    this.particleVelocities[i * 3] = (Math.random() - 0.5) * 1.2;
    this.particleVelocities[i * 3 + 1] = 1.5 + Math.random();
    this.particleVelocities[i * 3 + 2] = (Math.random() - 0.5) * 1.2;
    this.particleColors[i * 3] = 0.88;
    this.particleColors[i * 3 + 1] = 0.82;
    this.particleColors[i * 3 + 2] = 0.66;
    this.particleLifetimes[i] = 1.0;
  }

  private animateSheeting(ep: number): void {
    if (!this.sheetingSetup) return;
    const { frame, wetPaper } = this.sheetingSetup;

    let frameY: number;
    let frameTilt: number;
    let opacity: number;
    if (ep < 0.5) {
      const t = easeInOutCubic(ep * 2);
      frameY = lerp(1.2, -0.2, t);
      frameTilt = lerp(-0.25, -0.8, t);
      opacity = 0;
    } else {
      const t = easeInOutCubic((ep - 0.5) * 2);
      frameY = lerp(-0.2, 2.0, t);
      frameTilt = lerp(-0.8, -0.1, t);
      opacity = t * 0.92;
      this.emitDripParticle(t);
    }
    frame.position.y = frameY;
    frame.rotation.x = frameTilt;

    if (wetPaper.material instanceof THREE.MeshStandardMaterial) {
      wetPaper.material.opacity = opacity;
      wetPaper.material.color.setHex(
        ep < 0.9 ? 0xd4c49a : Math.floor(lerp(0xd4c49a, 0xe8d8a8, (ep - 0.9) * 10))
      );
    }
  }

  private emitDripParticle(t: number): void {
    if (Math.random() > 0.5 * t) return;
    const i = this.findFreeParticle();
    if (i < 0) return;
    this.particlePositions[i * 3] = (Math.random() - 0.5) * 2.8;
    this.particlePositions[i * 3 + 1] = 1.8;
    this.particlePositions[i * 3 + 2] = (Math.random() - 0.5) * 0.4;
    this.particleVelocities[i * 3] = (Math.random() - 0.5) * 0.2;
    this.particleVelocities[i * 3 + 1] = -0.5;
    this.particleVelocities[i * 3 + 2] = 0;
    this.particleColors[i * 3] = 0.7;
    this.particleColors[i * 3 + 1] = 0.8;
    this.particleColors[i * 3 + 2] = 0.88;
    this.particleLifetimes[i] = 1.5;
  }

  private animatePressing(progress: number, ep: number, delta: number): void {
    if (!this.pressingSetup) return;
    const { topStone, paperStack } = this.pressingSetup;
    const force = this.params.pressingForce / 10;

    let topY: number;
    let squishRatio: number;
    if (ep < 0.6) {
      const t = easeInOutCubic(ep / 0.6);
      topY = lerp(3.2, 1.05, t);
      squishRatio = 1 - t * 0.2 * force;
    } else {
      const t = (ep - 0.6) / 0.4;
      const jiggle = Math.sin(this.time * 6) * 0.015 * force * t;
      topY = 1.05 - t * 0.15 * force + jiggle;
      squishRatio = 1 - (0.2 + t * 0.3) * force;
      if (Math.random() < 0.6 * t) this.emitPressWaterParticle();
    }
    topStone.position.y = topY;

    paperStack.children.forEach((p, idx) => {
      if (p instanceof THREE.Mesh) {
        const baseY = 0.4 + idx * 0.08;
        const compression = (1 - squishRatio) * (idx + 1) * 0.03;
        p.position.y = baseY * squishRatio + 0.02 * idx;
        const origH = 0.08;
        p.scale.set(1 + (1 - squishRatio) * 0.05, squishRatio, 1 + (1 - squishRatio) * 0.05);
      }
    });
  }

  private emitPressWaterParticle(): void {
    const i = this.findFreeParticle();
    if (i < 0) return;
    const side = Math.floor(Math.random() * 4);
    let x = 0, z = 0;
    if (side === 0) { x = -1.4; z = (Math.random() - 0.5) * 2.0; }
    else if (side === 1) { x = 1.4; z = (Math.random() - 0.5) * 2.0; }
    else if (side === 2) { z = -1.0; x = (Math.random() - 0.5) * 2.8; }
    else { z = 1.0; x = (Math.random() - 0.5) * 2.8; }
    this.particlePositions[i * 3] = x;
    this.particlePositions[i * 3 + 1] = 0.8;
    this.particlePositions[i * 3 + 2] = z;
    this.particleVelocities[i * 3] = (x > 0 ? 1 : -1) * (0.3 + Math.random() * 0.5);
    this.particleVelocities[i * 3 + 1] = 0.2 + Math.random() * 0.3;
    this.particleVelocities[i * 3 + 2] = (z > 0 ? 1 : -1) * (0.2 + Math.random() * 0.3);
    this.particleColors[i * 3] = 0.65;
    this.particleColors[i * 3 + 1] = 0.78;
    this.particleColors[i * 3 + 2] = 0.88;
    this.particleLifetimes[i] = 1.2;
  }

  private animateDrying(ep: number, delta: number): void {
    if (!this.dryingPaper) return;
    const mat = this.dryingPaper.material as THREE.MeshStandardMaterial;
    const start = new THREE.Color(0xe6d6a8);
    const end = new THREE.Color(0xfaf3e0);
    mat.color.copy(start).lerp(end, ep);
    mat.roughness = lerp(0.95, 0.85, ep);

    const positions = this.dryingPaper.geometry.attributes.position;
    for (let i = 0; i < positions.count; i += 1) {
      const x = positions.getX(i);
      const y = positions.getY(i);
      const edgeFactor = Math.max(Math.abs(x) / 2.2, Math.abs(y) / 1.5);
      const curl = Math.pow(edgeFactor, 2.5) * 0.18 * ep;
      const curlDir = (x + y) > 0 ? 1 : -1;
      const current = positions.getZ(i);
      const target = curl * curlDir + Math.sin(x * 15 + this.time * 0.3) * 0.008 * ep
                                    + Math.cos(y * 12 + this.time * 0.2) * 0.006 * ep;
      positions.setZ(i, lerp(current, target, 0.05));
    }
    positions.needsUpdate = true;
    this.dryingPaper.geometry.computeVertexNormals();
  }

  private updateParticles(delta: number): void {
    const gravity = -9.8;
    let anyChanged = false;
    for (let i = 0; i < TOTAL_PARTICLES; i++) {
      if (this.particleLifetimes[i] <= 0) continue;
      this.particleLifetimes[i] -= delta;
      if (this.particleLifetimes[i] <= 0) {
        this.hideParticle(i);
        anyChanged = true;
        continue;
      }
      this.particleVelocities[i * 3 + 1] += gravity * delta * 0.05;
      this.particlePositions[i * 3] += this.particleVelocities[i * 3] * delta;
      this.particlePositions[i * 3 + 1] += this.particleVelocities[i * 3 + 1] * delta;
      this.particlePositions[i * 3 + 2] += this.particleVelocities[i * 3 + 2] * delta;
      anyChanged = true;
    }
    if (anyChanged) {
      (this.particleGeometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
      (this.particleGeometry.attributes.color as THREE.BufferAttribute).needsUpdate = true;
    }
  }

  private findFreeParticle(): number {
    for (let i = 0; i < TOTAL_PARTICLES; i++) {
      if (this.particleLifetimes[i] <= 0) return i;
    }
    return -1;
  }

  private updateQualityAfterStep(step: PapermakingStep): void {
    switch (step) {
      case PapermakingStep.SOAKING: {
        this.quality.softness = clamp(this.params.soakingDuration * 10, 0, 100);
        break;
      }
      case PapermakingStep.PULPING: {
        const c = this.params.pulpingCount;
        let u: number;
        if (c >= 8 && c <= 12) u = 100;
        else if (c < 8) u = c * 10;
        else u = (15 - c) * 18;
        this.quality.uniformity = clamp(u, 0, 100);
        break;
      }
      case PapermakingStep.PRESSING: {
        this.quality.smoothness = clamp(this.params.pressingForce * 10, 0, 100);
        this.quality.thickness = clamp(90 - this.params.pressingForce * 4 + this.quality.uniformity * 0.25, 0, 100);
        break;
      }
      case PapermakingStep.DRYING: {
        this.quality.thickness = clamp(this.quality.thickness - 5, 0, 100);
        break;
      }
    }
    const q = this.quality;
    q.totalScore = Math.round(
      q.softness * 0.2 + q.uniformity * 0.3 + q.smoothness * 0.28 + q.thickness * 0.22
    );
  }

  dispose(): void {
    this.clearStepProps();
    this.particleGeometry.dispose();
    this.particleMaterial.dispose();
    this.wallMesh.geometry.dispose();
    (this.wallMesh.material as THREE.Material).dispose();
    this.floorMesh.geometry.dispose();
    (this.floorMesh.material as THREE.Material).dispose();
  }
}

