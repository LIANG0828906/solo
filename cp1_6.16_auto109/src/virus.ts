import * as THREE from 'three';

export interface SpikeInfo {
  id: number;
  type: string;
  affinity: number;
  position: THREE.Vector3;
}

export interface SpikeData {
  mesh: THREE.Mesh;
  group: THREE.Group;
  baseRotation: THREE.Euler;
  info: SpikeInfo;
}

export enum InvasionPhase {
  IDLE = 'idle',
  APPROACHING = 'approaching',
  DOCKING = 'docking',
  MEMBRANE_DEPRESSION = 'membrane_depression',
  ENDOCYTOSIS = 'endocytosis',
  COMPLETE = 'complete'
}

export const PHASE_NAMES: Record<InvasionPhase, string> = {
  [InvasionPhase.IDLE]: '等待交互',
  [InvasionPhase.APPROACHING]: '靠近中',
  [InvasionPhase.DOCKING]: '对接中',
  [InvasionPhase.MEMBRANE_DEPRESSION]: '膜凹陷',
  [InvasionPhase.ENDOCYTOSIS]: '内吞中',
  [InvasionPhase.COMPLETE]: '内吞完成'
};

export const easeInOutCubic = (t: number): number =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

export const easeOutBack = (t: number): number => {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
};

export const easeInOutQuad = (t: number): number =>
  t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

export class ParticleSystem {
  private scene: THREE.Scene;
  private particles: { mesh: THREE.Mesh; velocity: THREE.Vector3; life: number; maxLife: number }[] = [];
  private maxParticles = 150;
  private particleGeometry: THREE.SphereGeometry;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.particleGeometry = new THREE.SphereGeometry(0.03, 8, 8);
  }

  emit(position: THREE.Vector3, color: number, count: number, velocityScale = 1): void {
    for (let i = 0; i < count && this.particles.length < this.maxParticles; i++) {
      const material = new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.9
      });
      const mesh = new THREE.Mesh(this.particleGeometry, material);
      mesh.position.copy(position);

      const velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 0.8 * velocityScale,
        (Math.random() - 0.5) * 0.8 * velocityScale,
        (Math.random() - 0.5) * 0.8 * velocityScale
      );

      this.scene.add(mesh);
      this.particles.push({ mesh, velocity, life: 0, maxLife: 1.5 + Math.random() * 0.5 });
    }
  }

  update(delta: number, timeScale: number): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life += delta * timeScale;
      if (p.life >= p.maxLife) {
        this.scene.remove(p.mesh);
        (p.mesh.material as THREE.Material).dispose();
        this.particles.splice(i, 1);
        continue;
      }
      const progress = p.life / p.maxLife;
      p.mesh.position.addScaledVector(p.velocity, delta * timeScale);
      (p.mesh.material as THREE.MeshBasicMaterial).opacity = 0.9 * (1 - progress);
      p.mesh.scale.setScalar(1 + progress * 0.5);
    }
  }

  clear(): void {
    for (const p of this.particles) {
      this.scene.remove(p.mesh);
      (p.mesh.material as THREE.Material).dispose();
    }
    this.particles = [];
  }
}

export class Virus {
  scene: THREE.Scene;
  group: THREE.Group;
  coreMesh: THREE.Mesh;
  spikes: SpikeData[] = [];
  phase: InvasionPhase = InvasionPhase.IDLE;
  phaseProgress = 0;
  totalProgress = 0;
  private animationTime = 0;
  private startPosition: THREE.Vector3 | null = null;
  private targetPosition: THREE.Vector3 | null = null;
  private dockedSpikes: { spike: SpikeData; targetPos: THREE.Vector3 }[] = [];
  private phaseDurations: Record<InvasionPhase, number> = {
    [InvasionPhase.IDLE]: 0,
    [InvasionPhase.APPROACHING]: 2,
    [InvasionPhase.DOCKING]: 1.5,
    [InvasionPhase.MEMBRANE_DEPRESSION]: 1.2,
    [InvasionPhase.ENDOCYTOSIS]: 1.5,
    [InvasionPhase.COMPLETE]: 0
  };
  particles: ParticleSystem;
  vesicleMesh: THREE.Mesh | null = null;
  vesicleGlow: THREE.Mesh | null = null;
  private originalVirusScale = 1;

  constructor(scene: THREE.Scene, position: THREE.Vector3) {
    this.scene = scene;
    this.particles = new ParticleSystem(scene);
    this.group = new THREE.Group();
    this.group.position.copy(position);

    const coreGeometry = new THREE.SphereGeometry(0.8, 48, 48);
    const coreMaterial = new THREE.MeshPhongMaterial({
      color: 0x8b1a1a,
      shininess: 60,
      specular: 0x444444
    });
    this.coreMesh = new THREE.Mesh(coreGeometry, coreMaterial);
    this.group.add(this.coreMesh);

    this.generateSpikes(40);
    scene.add(this.group);
  }

  private generateSpikes(count: number): void {
    const spikeTypes = ['S1', 'S2', 'S1/S2'];
    for (let i = 0; i < count; i++) {
      const phi = Math.acos(2 * Math.random() - 1);
      const theta = 2 * Math.PI * Math.random();

      const x = Math.sin(phi) * Math.cos(theta);
      const y = Math.sin(phi) * Math.sin(theta);
      const z = Math.cos(phi);
      const dir = new THREE.Vector3(x, y, z).normalize();

      const spikeGroup = new THREE.Group();
      spikeGroup.position.copy(dir.clone().multiplyScalar(0.8));
      spikeGroup.lookAt(dir.clone().multiplyScalar(2));

      const coneGeometry = new THREE.ConeGeometry(0.07, 0.25, 8);
      const colorMix = Math.random();
      const spikeColor = new THREE.Color().lerpColors(
        new THREE.Color(0xffd700),
        new THREE.Color(0xff2200),
        colorMix
      );
      const coneMaterial = new THREE.MeshPhongMaterial({
        color: spikeColor,
        shininess: 80,
        specular: 0xffffff
      });
      const cone = new THREE.Mesh(coneGeometry, coneMaterial);
      cone.position.y = 0.125;
      cone.rotation.x = Math.PI / 2;
      spikeGroup.add(cone);

      const headGeometry = new THREE.SphereGeometry(0.05, 12, 12);
      const headMaterial = new THREE.MeshPhongMaterial({
        color: spikeColor.clone().multiplyScalar(0.8),
        shininess: 100
      });
      const head = new THREE.Mesh(headGeometry, headMaterial);
      head.position.set(0, 0, 0.25);
      spikeGroup.add(head);

      this.group.add(spikeGroup);

      const info: SpikeInfo = {
        id: i,
        type: spikeTypes[Math.floor(Math.random() * spikeTypes.length)],
        affinity: 0.5 + Math.random() * 0.5,
        position: spikeGroup.position.clone()
      };

      this.spikes.push({
        mesh: cone,
        group: spikeGroup,
        baseRotation: spikeGroup.rotation.clone(),
        info
      });
    }
  }

  startInvasion(membraneY: number, receptorPositions: THREE.Vector3[]): void {
    if (this.phase !== InvasionPhase.IDLE) return;

    this.startPosition = this.group.position.clone();
    const targetX = receptorPositions[0].x;
    const targetZ = receptorPositions[0].z;
    this.targetPosition = new THREE.Vector3(targetX, membraneY + 0.8 + 0.25, targetZ);

    this.dockedSpikes = [];
    const sortedSpikes = [...this.spikes].sort((a, b) => {
      const wa = new THREE.Vector3().copy(a.group.position).applyMatrix4(this.group.matrixWorld);
      const wb = new THREE.Vector3().copy(b.group.position).applyMatrix4(this.group.matrixWorld);
      return wa.y - wb.y;
    });
    for (let i = 0; i < Math.min(3, sortedSpikes.length); i++) {
      this.dockedSpikes.push({
        spike: sortedSpikes[i],
        targetPos: receptorPositions[i] || receptorPositions[0]
      });
    }

    this.phase = InvasionPhase.APPROACHING;
    this.phaseProgress = 0;
    this.totalProgress = 0;
    this.animationTime = 0;
  }

  update(delta: number, timeScale: number): void {
    this.particles.update(delta, timeScale);

    if (this.phase === InvasionPhase.IDLE || this.phase === InvasionPhase.COMPLETE) {
      return;
    }

    const duration = this.phaseDurations[this.phase];
    if (duration > 0) {
      this.phaseProgress += (delta * timeScale) / duration;
      this.animationTime += delta * timeScale;

      if (this.phase === InvasionPhase.APPROACHING) {
        this.updateApproaching();
      } else if (this.phase === InvasionPhase.DOCKING) {
        this.updateDocking();
      } else if (this.phase === InvasionPhase.MEMBRANE_DEPRESSION) {
        this.updateMembraneDepression();
      } else if (this.phase === InvasionPhase.ENDOCYTOSIS) {
        this.updateEndocytosis();
      }

      if (this.phaseProgress >= 1) {
        this.advancePhase();
      }
    }
  }

  private updateApproaching(): void {
    if (!this.startPosition || !this.targetPosition) return;
    const t = easeInOutCubic(Math.min(this.phaseProgress, 1));
    this.group.position.lerpVectors(this.startPosition, this.targetPosition, t);
    this.totalProgress = t * 0.25;
  }

  private updateDocking(): void {
    const t = easeInOutQuad(Math.min(this.phaseProgress, 1));
    for (const ds of this.dockedSpikes) {
      const worldPos = new THREE.Vector3();
      ds.spike.group.getWorldPosition(worldPos);
      if (Math.random() < 0.15) {
        this.particles.emit(worldPos, 0x00ff88, 1, 0.5);
      }
    }
    this.group.position.y = (this.targetPosition?.y ?? 0) - t * 0.1;
    this.totalProgress = 0.25 + t * 0.25;
  }

  private updateMembraneDepression(): void {
    const t = easeOutBack(Math.min(this.phaseProgress, 1));
    this.group.position.y = (this.targetPosition?.y ?? 0) - 0.1 - t * 0.3;
    this.totalProgress = 0.5 + t * 0.25;

    if (Math.random() < 0.1) {
      const worldPos = new THREE.Vector3();
      this.coreMesh.getWorldPosition(worldPos);
      this.particles.emit(worldPos, 0x4488ff, 2, 0.4);
    }
  }

  private updateEndocytosis(): void {
    const t = easeInOutCubic(Math.min(this.phaseProgress, 1));
    this.group.position.y = (this.targetPosition?.y ?? 0) - 0.4 - t * 0.6;

    const targetScale = 0.6 / 1.6;
    this.originalVirusScale = 1 - t * (1 - targetScale);
    this.group.scale.setScalar(this.originalVirusScale);

    if (this.vesicleMesh) {
      this.vesicleMesh.position.copy(this.group.position);
      this.vesicleMesh.scale.setScalar(1 + t * 0.3);
      const mat = this.vesicleMesh.material as THREE.MeshPhongMaterial;
      mat.opacity = 0.3 + t * 0.3;
    }
    if (this.vesicleGlow) {
      this.vesicleGlow.position.copy(this.group.position);
      this.vesicleGlow.scale.setScalar(1 + t * 0.3);
      const mat = this.vesicleGlow.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.5 * (1 - Math.abs(t - 0.5) * 2);
    }

    this.totalProgress = 0.75 + t * 0.25;

    if (Math.random() < 0.2) {
      this.particles.emit(this.group.position, 0x0088ff, 1, 0.3);
    }
  }

  private advancePhase(): void {
    this.phaseProgress = 0;
    switch (this.phase) {
      case InvasionPhase.APPROACHING:
        this.phase = InvasionPhase.DOCKING;
        break;
      case InvasionPhase.DOCKING:
        this.phase = InvasionPhase.MEMBRANE_DEPRESSION;
        this.createVesicle();
        break;
      case InvasionPhase.MEMBRANE_DEPRESSION:
        this.phase = InvasionPhase.ENDOCYTOSIS;
        break;
      case InvasionPhase.ENDOCYTOSIS:
        this.phase = InvasionPhase.COMPLETE;
        this.totalProgress = 1;
        break;
    }
  }

  private createVesicle(): void {
    const vesicleGeometry = new THREE.SphereGeometry(1.1, 32, 32);
    const vesicleMaterial = new THREE.MeshPhongMaterial({
      color: 0x88aaff,
      transparent: true,
      opacity: 0.3,
      side: THREE.DoubleSide,
      shininess: 100
    });
    this.vesicleMesh = new THREE.Mesh(vesicleGeometry, vesicleMaterial);
    this.vesicleMesh.position.copy(this.group.position);
    this.scene.add(this.vesicleMesh);

    const glowGeometry = new THREE.SphereGeometry(1.3, 32, 32);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: 0x00aaff,
      transparent: true,
      opacity: 0.5,
      side: THREE.BackSide
    });
    this.vesicleGlow = new THREE.Mesh(glowGeometry, glowMaterial);
    this.vesicleGlow.position.copy(this.group.position);
    this.scene.add(this.vesicleGlow);
  }

  getSpikeAt(intersects: THREE.Intersection[]): SpikeData | null {
    for (const hit of intersects) {
      for (const spike of this.spikes) {
        if (hit.object === spike.mesh || hit.object.parent === spike.group) {
          return spike;
        }
      }
    }
    return null;
  }

  containsObject(obj: THREE.Object3D): boolean {
    return this.group === obj || this.group.children.includes(obj) ||
      obj.parent === this.coreMesh || this.group.children.some(c => c.children.includes(obj));
  }

  reset(): void {
    this.phase = InvasionPhase.IDLE;
    this.phaseProgress = 0;
    this.totalProgress = 0;
    this.animationTime = 0;
    this.group.position.set(-2.5, 0, 0);
    this.group.scale.setScalar(1);
    this.originalVirusScale = 1;
    this.dockedSpikes = [];
    this.startPosition = null;
    this.targetPosition = null;
    this.particles.clear();

    if (this.vesicleMesh) {
      this.scene.remove(this.vesicleMesh);
      (this.vesicleMesh.material as THREE.Material).dispose();
      this.vesicleMesh.geometry.dispose();
      this.vesicleMesh = null;
    }
    if (this.vesicleGlow) {
      this.scene.remove(this.vesicleGlow);
      (this.vesicleGlow.material as THREE.Material).dispose();
      this.vesicleGlow.geometry.dispose();
      this.vesicleGlow = null;
    }

    for (const spike of this.spikes) {
      spike.group.rotation.copy(spike.baseRotation);
    }
  }

  dispose(): void {
    this.particles.clear();
    this.scene.remove(this.group);
    this.coreMesh.geometry.dispose();
    (this.coreMesh.material as THREE.Material).dispose();
  }
}
