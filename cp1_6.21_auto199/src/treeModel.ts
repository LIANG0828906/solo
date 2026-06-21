import * as THREE from 'three';

export interface TreeParams {
  lightIntensity: number;
  waterAmount: number;
  nutrientAmount: number;
  growthSpeed: number;
}

interface Branch {
  mesh: THREE.Mesh;
  length: number;
  startRadius: number;
  endRadius: number;
  depth: number;
  startPoint: THREE.Vector3;
  direction: THREE.Vector3;
  grown: number;
  children: Branch[];
  createdSegments: Set<number>;
}

interface Leaf {
  mesh: THREE.Mesh;
  age: number;
  maxAge: number;
  falling: boolean;
  velocity: THREE.Vector3;
  rotationSpeed: THREE.Vector3;
}

interface Particle {
  mesh: THREE.Mesh;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  life: number;
  maxLife: number;
}

export class Tree {
  public group: THREE.Group;
  private branches: Branch[] = [];
  private leaves: Leaf[] = [];
  private particles: Particle[] = [];
  private growthTime: number = 0;
  private maxGrowthTime: number = 60;
  private params: TreeParams;
  private lastSaveTime: number = 0;
  private leafGeometry: THREE.PlaneGeometry;
  private branchMaterial: THREE.MeshStandardMaterial;
  private particleGeometry: THREE.SphereGeometry;
  private leafCreateAccumulator: number = 0;

  constructor(initialParams: TreeParams) {
    this.params = { ...initialParams };
    this.group = new THREE.Group();
    this.leafGeometry = new THREE.PlaneGeometry(0.18, 0.12);
    this.branchMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#5B4033'),
      roughness: 0.9,
      metalness: 0.1,
    });
    this.particleGeometry = new THREE.SphereGeometry(0.035, 4, 4);

    const saved = this.loadState();
    if (saved !== null) {
      this.growthTime = saved;
    }

    this.createTrunk();
  }

  private createTrunk(): void {
    const startRadius = 0.15;
    const endRadius = 0.25;
    const length = 3;

    const geometry = new THREE.CylinderGeometry(startRadius, endRadius, length, 8);
    const mesh = new THREE.Mesh(geometry, this.branchMaterial);
    mesh.position.set(0, length / 2, 0);
    const initialGrown = 0.5 / length;
    mesh.scale.y = initialGrown;
    mesh.position.y = (length * initialGrown) / 2;

    const trunk: Branch = {
      mesh,
      length,
      startRadius,
      endRadius,
      depth: 0,
      startPoint: new THREE.Vector3(0, 0, 0),
      direction: new THREE.Vector3(0, 1, 0),
      grown: initialGrown,
      children: [],
      createdSegments: new Set(),
    };

    this.branches.push(trunk);
    this.group.add(mesh);
  }

  private getGrowthProgress(): number {
    const t = Math.min(this.growthTime / this.maxGrowthTime, 1);
    return 1 - Math.pow(1 - t, 3);
  }

  private getEffectiveGrowthSpeed(): number {
    const base = this.params.growthSpeed;
    const envFactor = 0.5 + 0.5 * (this.params.lightIntensity * 0.4 + this.params.waterAmount * 0.3 + this.params.nutrientAmount * 0.3);
    return base * envFactor;
  }

  private getPointOnBranch(branch: Branch, t: number): THREE.Vector3 {
    return branch.startPoint.clone().add(
      branch.direction.clone().multiplyScalar(branch.length * t)
    );
  }

  private createOrthogonalBasis(direction: THREE.Vector3): { tangent: THREE.Vector3; bitangent: THREE.Vector3 } {
    const dir = direction.clone().normalize();
    let tangent: THREE.Vector3;
    
    if (Math.abs(dir.y) < 0.9) {
      tangent = new THREE.Vector3(-dir.z, 0, dir.x).normalize();
    } else {
      tangent = new THREE.Vector3(1, 0, 0);
    }
    
    const bitangent = new THREE.Vector3().crossVectors(dir, tangent).normalize();
    return { tangent, bitangent };
  }

  private createBranch(
    parent: Branch,
    segmentIndex: number,
    azimuthOffset: number
  ): void {
    const depth = parent.depth + 1;
    if (depth > 4) return;

    const segmentSpacing = 0.8;
    const tStart = Math.min(0.2 + segmentIndex * (segmentSpacing / parent.length), 0.88);

    const startPoint = this.getPointOnBranch(parent, tStart);
    const parentRadius = parent.startRadius + (parent.endRadius - parent.startRadius) * tStart;

    const branchLength = parent.length * (0.45 - depth * 0.05) * (0.9 + Math.random() * 0.2);
    const startRadius = parentRadius * (0.5 + Math.random() * 0.15);
    const endRadius = startRadius * (0.3 + Math.random() * 0.15);

    const { tangent, bitangent } = this.createOrthogonalBasis(parent.direction);

    const spreadAngle = Math.PI / 5 + depth * 0.08 + (Math.random() - 0.5) * 0.25;
    const azimuth = azimuthOffset + (Math.random() - 0.5) * 0.3;

    const sinSpread = Math.sin(spreadAngle);
    const cosSpread = Math.cos(spreadAngle);
    const direction = new THREE.Vector3()
      .addScaledVector(parent.direction, cosSpread)
      .addScaledVector(tangent, sinSpread * Math.cos(azimuth))
      .addScaledVector(bitangent, sinSpread * Math.sin(azimuth))
      .normalize();

    const geometry = new THREE.CylinderGeometry(endRadius, startRadius, branchLength, 6);
    const mesh = new THREE.Mesh(geometry, this.branchMaterial);

    const midPoint = startPoint.clone().add(direction.clone().multiplyScalar(branchLength / 2));
    mesh.position.copy(midPoint);
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction);
    mesh.scale.y = 0.01;

    const branch: Branch = {
      mesh,
      length: branchLength,
      startRadius,
      endRadius,
      depth,
      startPoint: startPoint.clone(),
      direction: direction.clone(),
      grown: 0.01,
      children: [],
      createdSegments: new Set(),
    };

    this.branches.push(branch);
    parent.children.push(branch);
    this.group.add(mesh);
  }

  private tryCreateBranches(branch: Branch): void {
    if (branch.depth > 2) return;

    const segmentSpacing = 0.8;
    const segmentsTotal = Math.floor((branch.length * 0.7) / segmentSpacing);
    const grownSegments = Math.floor(branch.grown * branch.length / segmentSpacing);

    for (let i = 0; i < grownSegments && i < segmentsTotal; i++) {
      if (branch.createdSegments.has(i)) continue;

      const tSegment = 0.2 + (i + 1) * (segmentSpacing / branch.length);
      if (tSegment > branch.grown) continue;
      if (branch.depth === 0 && tSegment < 0.28) continue;

      branch.createdSegments.add(i);

      const numBranches = branch.depth === 0 ? (i % 2 === 0 ? 2 : 3) : 2;
      for (let c = 0; c < numBranches; c++) {
        const baseAngle = (c / numBranches) * Math.PI * 2;
        const spiralOffset = i * 0.8;
        this.createBranch(branch, i, baseAngle + spiralOffset);
      }
    }
  }

  private createLeaf(position: THREE.Vector3): void {
    const maxLeaves = 200 + Math.floor(this.getGrowthProgress() * 300);
    if (this.leaves.length >= maxLeaves) return;

    const envFactor = this.params.lightIntensity * 0.3 + this.params.waterAmount * 0.3 + this.params.nutrientAmount * 0.4;

    const material = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#6EE7B7'),
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.9,
      roughness: 0.8,
    });

    const mesh = new THREE.Mesh(this.leafGeometry, material);
    mesh.position.copy(position);
    mesh.position.x += (Math.random() - 0.5) * 0.2;
    mesh.position.y += (Math.random() - 0.5) * 0.1 + 0.05;
    mesh.position.z += (Math.random() - 0.5) * 0.2;
    mesh.rotation.set(
      Math.random() * Math.PI,
      Math.random() * Math.PI,
      (Math.random() - 0.5) * 0.5
    );

    const leaf: Leaf = {
      mesh,
      age: 0,
      maxAge: 50 + envFactor * 30 + Math.random() * 25,
      falling: false,
      velocity: new THREE.Vector3(0, 0, 0),
      rotationSpeed: new THREE.Vector3(
        (Math.random() - 0.5) * 1.5,
        (Math.random() - 0.5) * 1.5,
        (Math.random() - 0.5) * 1.5
      ),
    };

    this.leaves.push(leaf);
    this.group.add(mesh);
  }

  private tryCreateLeaves(deltaTime: number): void {
    const progress = this.getGrowthProgress();
    if (progress < 0.35) return;

    const rate = progress * 1.5;
    this.leafCreateAccumulator += deltaTime * rate;

    while (this.leafCreateAccumulator >= 1) {
      this.leafCreateAccumulator -= 1;

      const outerBranches = this.branches.filter(b => b.depth >= 2 && b.grown > 0.5);
      if (outerBranches.length === 0) break;

      const branch = outerBranches[Math.floor(Math.random() * outerBranches.length)];
      const t = 0.5 + Math.random() * 0.5;
      const leafPos = this.getPointOnBranch(branch, Math.min(t, branch.grown));
      this.createLeaf(leafPos);
    }
  }

  private updateLeafColor(leaf: Leaf): void {
    const ageRatio = leaf.age / leaf.maxAge;
    const material = leaf.mesh.material as THREE.MeshStandardMaterial;

    if (ageRatio < 0.35) {
      const t = ageRatio / 0.35;
      material.color.copy(new THREE.Color('#6EE7B7').lerp(new THREE.Color('#065F46'), t));
    } else if (ageRatio < 0.7) {
      material.color.copy(new THREE.Color('#065F46'));
    } else if (ageRatio < 1) {
      const t = (ageRatio - 0.7) / 0.3;
      material.color.copy(new THREE.Color('#065F46').lerp(new THREE.Color('#F59E0B'), t));
    } else {
      leaf.falling = true;
    }
  }

  public triggerWaterParticles(): void {
    const count = 20 + Math.floor(this.params.waterAmount * 30);
    for (let i = 0; i < Math.min(count, 50); i++) {
      this.createParticle(new THREE.Color('#3B82F6'), 'water');
    }
  }

  public triggerNutrientParticles(): void {
    const count = 20 + Math.floor(this.params.nutrientAmount * 30);
    for (let i = 0; i < Math.min(count, 50); i++) {
      this.createParticle(new THREE.Color('#FACC15'), 'nutrient');
    }
  }

  private createParticle(color: THREE.Color, type: 'water' | 'nutrient'): void {
    if (this.particles.length >= 300) return;

    const material = new THREE.MeshBasicMaterial({
      color: color.clone(),
      transparent: true,
      opacity: 0.85,
    });

    const mesh = new THREE.Mesh(this.particleGeometry, material);
    let position: THREE.Vector3;
    let velocity: THREE.Vector3;

    if (type === 'water') {
      const angle = Math.random() * Math.PI * 2;
      const radius = 0.15 + Math.random() * 0.35;
      position = new THREE.Vector3(
        Math.cos(angle) * radius,
        0.05 + Math.random() * 0.4,
        Math.sin(angle) * radius
      );
      velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 0.4,
        0.4 + Math.random() * 0.6,
        (Math.random() - 0.5) * 0.4
      );
    } else {
      const treeProgress = this.getGrowthProgress();
      const treeHeight = 0.8 + treeProgress * 2.2;
      position = new THREE.Vector3(
        (Math.random() - 0.5) * 1.8,
        treeHeight * 0.4 + Math.random() * treeHeight * 0.6,
        (Math.random() - 0.5) * 1.8
      );
      velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 0.25,
        0.05 + Math.random() * 0.2,
        (Math.random() - 0.5) * 0.25
      );
    }

    mesh.position.copy(position);

    const particle: Particle = {
      mesh,
      position: position.clone(),
      velocity,
      life: 0,
      maxLife: 1 + Math.random(),
    };

    this.particles.push(particle);
    this.group.add(mesh);
  }

  public update(deltaTime: number, params: TreeParams): void {
    this.params = { ...params };
    this.growthTime += deltaTime * this.getEffectiveGrowthSpeed();
    const progress = this.getGrowthProgress();

    for (const branch of this.branches) {
      const depthDelay = branch.depth * 0.1;
      const targetGrown = Math.min(Math.max(progress - depthDelay, 0) * (1 - branch.depth * 0.1), 1);
      const growDiff = targetGrown - branch.grown;
      branch.grown += growDiff * Math.min(deltaTime * 1.8, 1);
      branch.grown = Math.max(0.001, Math.min(1, branch.grown));

      branch.mesh.scale.y = branch.grown;
      const currentLength = branch.length * branch.grown;
      branch.mesh.position.copy(
        branch.startPoint.clone().add(branch.direction.clone().multiplyScalar(currentLength / 2))
      );

      this.tryCreateBranches(branch);
    }

    this.tryCreateLeaves(deltaTime);

    for (let i = this.leaves.length - 1; i >= 0; i--) {
      const leaf = this.leaves[i];
      leaf.age += deltaTime;

      if (leaf.falling) {
        leaf.velocity.y -= deltaTime * 0.8;
        leaf.velocity.x += (Math.random() - 0.5) * deltaTime * 0.3;
        leaf.velocity.z += (Math.random() - 0.5) * deltaTime * 0.3;
        leaf.mesh.position.add(leaf.velocity.clone().multiplyScalar(deltaTime));
        leaf.mesh.rotation.x += leaf.rotationSpeed.x * deltaTime;
        leaf.mesh.rotation.y += leaf.rotationSpeed.y * deltaTime;
        leaf.mesh.rotation.z += leaf.rotationSpeed.z * deltaTime;

        if (leaf.mesh.position.y < -1) {
          this.group.remove(leaf.mesh);
          (leaf.mesh.material as THREE.Material).dispose();
          this.leaves.splice(i, 1);
          continue;
        }
      }

      this.updateLeafColor(leaf);
    }

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const particle = this.particles[i];
      particle.life += deltaTime;

      if (particle.life >= particle.maxLife) {
        this.group.remove(particle.mesh);
        (particle.mesh.material as THREE.Material).dispose();
        this.particles.splice(i, 1);
        continue;
      }

      particle.position.add(particle.velocity.clone().multiplyScalar(deltaTime));
      particle.mesh.position.copy(particle.position);

      const alpha = 1 - particle.life / particle.maxLife;
      (particle.mesh.material as THREE.MeshBasicMaterial).opacity = alpha * 0.85;
      particle.mesh.scale.setScalar(alpha * 0.6 + 0.4);
    }

    this.lastSaveTime += deltaTime;
    if (this.lastSaveTime >= 5) {
      this.saveState();
      this.lastSaveTime = 0;
    }
  }

  public setParams(params: TreeParams): void {
    this.params = { ...params };
  }

  public saveState(): void {
    try {
      localStorage.setItem('magicTree_growthTime', String(this.growthTime));
    } catch (e) {
      console.warn('Failed to save tree state:', e);
    }
  }

  public loadState(): number | null {
    try {
      const saved = localStorage.getItem('magicTree_growthTime');
      if (saved) {
        const val = parseFloat(saved);
        if (!isNaN(val) && val >= 0) {
          return val;
        }
      }
    } catch (e) {
      console.warn('Failed to load tree state:', e);
    }
    return null;
  }

  public dispose(): void {
    this.saveState();
    for (const branch of this.branches) {
      branch.mesh.geometry.dispose();
    }
    for (const leaf of this.leaves) {
      (leaf.mesh.material as THREE.Material).dispose();
    }
    for (const particle of this.particles) {
      (particle.mesh.material as THREE.Material).dispose();
    }
    this.leafGeometry.dispose();
    this.branchMaterial.dispose();
    this.particleGeometry.dispose();
  }
}
