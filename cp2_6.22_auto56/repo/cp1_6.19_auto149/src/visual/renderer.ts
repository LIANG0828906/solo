import * as THREE from 'three';
import { IPlantState, GrowthStage } from '../growth/plantState';

interface LeafData {
  mesh: THREE.Mesh;
  originalColor: THREE.Color;
  baseAngle: number;
  heightRatio: number;
}

interface PetalData {
  mesh: THREE.Mesh;
  baseRotation: number;
  openProgress: number;
}

export class PlantRenderer {
  public plantGroup: THREE.Group;
  private scene: THREE.Scene;
  private stem: THREE.Mesh | null = null;
  private seedMesh: THREE.Mesh | null = null;
  private leaves: LeafData[] = [];
  private bud: THREE.Mesh | null = null;
  private petals: PetalData[] = [];
  private leafGeometry: THREE.PlaneGeometry;
  private leafMaterial: THREE.MeshStandardMaterial;
  private yellowLeafMaterial: THREE.MeshStandardMaterial;
  private hoveredLeaf: LeafData | null = null;
  private hoverTimeout: number | null = null;
  public tooltipElement: HTMLDivElement | null = null;
  private targetState: IPlantState;
  private currentState: IPlantState;
  private animatingBud: boolean = false;
  private budAnimationStart: number = 0;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.plantGroup = new THREE.Group();
    this.scene.add(this.plantGroup);

    this.targetState = {
      stemHeight: 0.5,
      leafCount: 0,
      budState: 0,
      growthDay: 0,
      isWilting: false,
      leafYellowing: false
    };
    this.currentState = { ...this.targetState };

    this.leafGeometry = new THREE.PlaneGeometry(1.2, 0.6, 2, 2);
    const positions = this.leafGeometry.attributes.position;
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      const y = positions.getY(i);
      const z = Math.sin((x + 0.6) / 1.2 * Math.PI) * 0.15;
      positions.setZ(i, z);
    }
    this.leafGeometry.computeVertexNormals();

    this.leafMaterial = new THREE.MeshStandardMaterial({
      color: 0x3d8b40,
      side: THREE.DoubleSide,
      roughness: 0.7,
      metalness: 0.1
    });

    this.yellowLeafMaterial = new THREE.MeshStandardMaterial({
      color: 0xc4a35a,
      side: THREE.DoubleSide,
      roughness: 0.8,
      metalness: 0.05
    });

    this.createTooltip();
    this.buildPlant();
  }

  private createTooltip(): void {
    this.tooltipElement = document.createElement('div');
    this.tooltipElement.style.cssText = `
      position: fixed;
      pointer-events: none;
      background: rgba(0, 0, 0, 0.85);
      color: #7FFF00;
      padding: 6px 12px;
      border-radius: 6px;
      font-size: 13px;
      font-family: sans-serif;
      border: 1px solid #7FFF00;
      z-index: 1000;
      display: none;
      transition: opacity 0.2s ease;
      opacity: 0;
      white-space: nowrap;
    `;
    document.body.appendChild(this.tooltipElement);
  }

  public showTooltip(x: number, y: number, text: string): void {
    if (!this.tooltipElement) return;
    this.tooltipElement.textContent = text;
    this.tooltipElement.style.left = `${x + 15}px`;
    this.tooltipElement.style.top = `${y - 10}px`;
    this.tooltipElement.style.display = 'block';
    requestAnimationFrame(() => {
      if (this.tooltipElement) this.tooltipElement.style.opacity = '1';
    });
  }

  public hideTooltip(): void {
    if (!this.tooltipElement) return;
    this.tooltipElement.style.opacity = '0';
    setTimeout(() => {
      if (this.tooltipElement) this.tooltipElement.style.display = 'none';
    }, 200);
  }

  private buildPlant(): void {
    while (this.plantGroup.children.length > 0) {
      const child = this.plantGroup.children[0];
      this.plantGroup.remove(child);
    }
    this.leaves = [];
    this.petals = [];
    this.stem = null;
    this.seedMesh = null;
    this.bud = null;

    if (this.currentState.growthDay <= 0) {
      this.createSeed();
    } else {
      this.createStem();
      this.createLeaves();
      if (this.currentState.budState > 0 || this.currentState.growthDay >= 9) {
        this.createBudAndPetals();
      }
    }
  }

  private createSeed(): void {
    const seedGeo = new THREE.SphereGeometry(0.2, 8, 8);
    const seedMat = new THREE.MeshStandardMaterial({
      color: 0x8b5a2b,
      roughness: 0.9
    });
    this.seedMesh = new THREE.Mesh(seedGeo, seedMat);
    this.seedMesh.position.y = 0.15;
    this.seedMesh.castShadow = true;
    this.plantGroup.add(this.seedMesh);
  }

  private createStem(): void {
    const stemGeo = new THREE.CylinderGeometry(0.08, 0.12, this.currentState.stemHeight, 8);
    const stemMat = new THREE.MeshStandardMaterial({
      color: this.currentState.leafYellowing ? 0xb8a86a : 0x4a7c39,
      roughness: 0.85
    });
    this.stem = new THREE.Mesh(stemGeo, stemMat);
    this.stem.position.y = this.currentState.stemHeight / 2;
    this.stem.castShadow = true;
    this.plantGroup.add(this.stem);
  }

  private createLeaves(): void {
    const count = Math.max(0, Math.min(12, Math.round(this.currentState.leafCount)));
    for (let i = 0; i < count; i++) {
      this.createLeaf(i, count);
    }
  }

  private createLeaf(index: number, total: number): void {
    const material = this.currentState.leafYellowing || this.currentState.isWilting
      ? this.yellowLeafMaterial.clone()
      : this.leafMaterial.clone();

    const leaf = new THREE.Mesh(this.leafGeometry.clone(), material);

    const layer = Math.floor(index / 2);
    const totalLayers = Math.max(1, Math.ceil(total / 2));
    const heightRatio = totalLayers === 1 ? 0.6 : 0.25 + (layer / (totalLayers - 1)) * 0.55;
    const side = index % 2 === 0 ? 1 : -1;

    const baseAngle = (index * 60 + (Math.random() - 0.5) * 30) * (Math.PI / 180);
    const tiltAngle = -0.4 + Math.random() * 0.2;

    leaf.position.set(0, this.currentState.stemHeight * heightRatio, 0);

    leaf.rotation.y = baseAngle;
    leaf.rotation.z = tiltAngle * side;

    leaf.translateX(0.35 * side);
    leaf.rotation.x = -0.2;

    const scale = 0.6 + heightRatio * 0.6;
    leaf.scale.set(scale, scale, scale);

    leaf.castShadow = true;
    leaf.receiveShadow = true;
    leaf.userData.isLeaf = true;
    leaf.userData.leafIndex = index;

    this.plantGroup.add(leaf);
    this.leaves.push({
      mesh: leaf,
      originalColor: (material as THREE.MeshStandardMaterial).color.clone(),
      baseAngle,
      heightRatio
    });
  }

  private createBudAndPetals(): void {
    const budPositionY = this.currentState.stemHeight + 0.1;

    if (this.currentState.budState === 3) {
      const witherGeo = new THREE.SphereGeometry(0.15, 8, 8);
      const witherMat = new THREE.MeshStandardMaterial({
        color: 0x8b7355,
        roughness: 0.95
      });
      this.bud = new THREE.Mesh(witherGeo, witherMat);
      this.bud.position.y = budPositionY;
      this.bud.castShadow = true;
      this.plantGroup.add(this.bud);
      return;
    }

    const petalColors = [0xff69b4, 0xff85c1, 0xff9ecb, 0xffb6d5, 0xffa5c9, 0xff7eb8];

    for (let i = 0; i < 6; i++) {
      const petalGeo = new THREE.SphereGeometry(0.2, 8, 8, 0, Math.PI * 2, 0, Math.PI / 2);
      const petalMat = new THREE.MeshStandardMaterial({
        color: petalColors[i % petalColors.length],
        side: THREE.DoubleSide,
        roughness: 0.5,
        metalness: 0.1
      });
      const petal = new THREE.Mesh(petalGeo, petalMat);
      const baseRotation = (i / 6) * Math.PI * 2;

      let openProgress = 0;
      if (this.currentState.budState >= 2) {
        openProgress = 1;
      } else if (this.currentState.budState === 1) {
        openProgress = 0.4;
      }

      petal.position.y = budPositionY;
      petal.rotation.y = baseRotation;
      petal.rotation.z = Math.PI / 2 - openProgress * (Math.PI / 2.5);
      petal.scale.setScalar(0.3 + openProgress * 0.7);

      petal.castShadow = true;
      petal.userData.isPetal = true;
      this.plantGroup.add(petal);
      this.petals.push({ mesh: petal, baseRotation, openProgress });
    }

    const centerGeo = new THREE.SphereGeometry(0.18, 8, 8);
    const centerMat = new THREE.MeshStandardMaterial({
      color: 0xffd700,
      roughness: 0.4,
      metalness: 0.3
    });
    this.bud = new THREE.Mesh(centerGeo, centerMat);
    this.bud.position.y = budPositionY;
    this.bud.castShadow = true;
    this.bud.userData.isBudCenter = true;
    this.plantGroup.add(this.bud);
  }

  public updatePlant(state: IPlantState): void {
    this.targetState = { ...state };
    this.lerpToTarget(0.15);
  }

  private lerpToTarget(alpha: number): void {
    const prevLeafCount = Math.round(this.currentState.leafCount);
    const prevBudState = this.currentState.budState;
    const prevDay = this.currentState.growthDay;

    this.currentState.stemHeight += (this.targetState.stemHeight - this.currentState.stemHeight) * alpha;
    this.currentState.leafCount += (this.targetState.leafCount - this.currentState.leafCount) * alpha;
    this.currentState.budState += (this.targetState.budState - this.currentState.budState) * alpha;
    this.currentState.growthDay = this.targetState.growthDay;
    this.currentState.isWilting = this.targetState.isWilting;
    this.currentState.leafYellowing = this.targetState.leafYellowing;

    const newLeafCount = Math.round(this.currentState.leafCount);
    const newDay = this.currentState.growthDay;
    const needRebuild =
      prevLeafCount !== newLeafCount ||
      (prevDay <= 0 && newDay > 0) ||
      (prevDay > 0 && newDay <= 0) ||
      (prevBudState < 1 && this.currentState.budState >= 1) ||
      (prevBudState >= 1 && this.currentState.budState < 1) ||
      (prevBudState < 3 && this.currentState.budState >= 3);

    if (needRebuild) {
      this.buildPlant();
      return;
    }

    this.updateStem();
    this.updateLeaves();
    this.updatePetals();
    this.updateBud();
  }

  private updateStem(): void {
    if (!this.stem) return;
    const mat = this.stem.material as THREE.MeshStandardMaterial;
    const targetColor = this.currentState.leafYellowing ? 0xb8a86a : 0x4a7c39;
    mat.color.lerp(new THREE.Color(targetColor), 0.1);

    const oldGeo = this.stem.geometry as THREE.CylinderGeometry;
    const oldHeight = (oldGeo.parameters as any).height;
    if (Math.abs(oldHeight - this.currentState.stemHeight) > 0.01) {
      const newGeo = new THREE.CylinderGeometry(0.08, 0.12, this.currentState.stemHeight, 8);
      this.stem.geometry.dispose();
      this.stem.geometry = newGeo;
      this.stem.position.y = this.currentState.stemHeight / 2;
    }
  }

  private updateLeaves(): void {
    for (const leaf of this.leaves) {
      const mat = leaf.mesh.material as THREE.MeshStandardMaterial;
      if (this.currentState.leafYellowing || this.currentState.isWilting) {
        mat.color.lerp(new THREE.Color(0xc4a35a), 0.08);
      } else {
        mat.color.lerp(leaf.originalColor, 0.08);
      }

      const targetY = this.currentState.stemHeight * leaf.heightRatio;
      leaf.mesh.position.y += (targetY - leaf.mesh.position.y) * 0.12;
    }
  }

  private updatePetals(): void {
    if (this.petals.length === 0) return;
    const budPositionY = this.currentState.stemHeight + 0.1;

    for (const petal of this.petals) {
      let targetProgress = 0;
      if (this.currentState.budState >= 2 || this.animatingBud) {
        targetProgress = 1;
      } else if (this.currentState.budState === 1) {
        targetProgress = 0.4;
      }

      if (this.animatingBud) {
        const elapsed = (performance.now() - this.budAnimationStart) / 1000;
        const t = Math.min(elapsed / 1, 1);
        const eased = 1 - Math.pow(1 - t, 3);
        petal.openProgress = eased;
        if (t >= 1) {
          this.animatingBud = false;
        }
      } else {
        petal.openProgress += (targetProgress - petal.openProgress) * 0.12;
      }

      petal.mesh.rotation.z = Math.PI / 2 - petal.openProgress * (Math.PI / 2.5);
      const targetScale = 0.3 + petal.openProgress * 0.7;
      petal.mesh.scale.setScalar(petal.mesh.scale.x + (targetScale - petal.mesh.scale.x) * 0.12);
      petal.mesh.position.y += (budPositionY - petal.mesh.position.y) * 0.12;
    }

    if (this.bud && this.bud.userData.isBudCenter) {
      this.bud.position.y += (budPositionY - this.bud.position.y) * 0.12;
    }
  }

  private updateBud(): void {
    if (this.bud && this.currentState.budState >= 3) {
      const budPositionY = this.currentState.stemHeight + 0.1;
      this.bud.position.y += (budPositionY - this.bud.position.y) * 0.12;
    }
  }

  public animate(): void {
    this.lerpToTarget(0.1);

    const time = performance.now() / 1000;
    for (let i = 0; i < this.leaves.length; i++) {
      const leaf = this.leaves[i];
      const sway = Math.sin(time * 1.2 + i * 0.8) * 0.02;
      leaf.mesh.rotation.y = leaf.baseAngle + sway;
    }
  }

  public handleHover(intersect: THREE.Intersection | null, clientX: number, clientY: number): void {
    if (!intersect || !intersect.object.userData.isLeaf) {
      if (this.hoveredLeaf) {
        const mat = this.hoveredLeaf.mesh.material as THREE.MeshStandardMaterial;
        mat.color.copy(this.hoveredLeaf.originalColor);
        if (this.currentState.leafYellowing || this.currentState.isWilting) {
          mat.color.lerp(new THREE.Color(0xc4a35a), 1);
        }
        this.hoveredLeaf = null;
        this.hideTooltip();
      }
      return;
    }

    const leafData = this.leaves.find(l => l.mesh === intersect.object);
    if (!leafData) return;

    if (this.hoveredLeaf !== leafData) {
      if (this.hoveredLeaf) {
        const prevMat = this.hoveredLeaf.mesh.material as THREE.MeshStandardMaterial;
        prevMat.color.copy(this.hoveredLeaf.originalColor);
        if (this.currentState.leafYellowing || this.currentState.isWilting) {
          prevMat.color.lerp(new THREE.Color(0xc4a35a), 1);
        }
      }

      this.hoveredLeaf = leafData;
      const mat = leafData.mesh.material as THREE.MeshStandardMaterial;
      const targetColor = leafData.originalColor.clone();
      targetColor.multiplyScalar(1.3);
      mat.color.copy(targetColor);

      let status = '健康';
      if (this.currentState.isWilting) status = '水涝';
      const statusText = `叶片 ${intersect.object.userData.leafIndex + 1} · ${status}`;
      this.showTooltip(clientX, clientY, statusText);
    }
  }

  public handleClick(intersect: THREE.Intersection | null, onBloom?: () => void): boolean {
    if (!intersect) return false;
    const obj = intersect.object;
    const isBud = obj.userData.isBudCenter || obj.userData.isPetal;
    if (isBud && !this.animatingBud && this.currentState.budState >= 0 && this.currentState.budState < 3) {
      this.animatingBud = true;
      this.budAnimationStart = performance.now();
      if (onBloom) onBloom();
      return true;
    }
    return false;
  }

  public dispose(): void {
    this.scene.remove(this.plantGroup);
    this.leafGeometry.dispose();
    this.leafMaterial.dispose();
    this.yellowLeafMaterial.dispose();
    if (this.tooltipElement) {
      this.tooltipElement.remove();
      this.tooltipElement = null;
    }
  }
}

export function createGroundGrid(scene: THREE.Scene): void {
  const group = new THREE.Group();

  const circles = 8;
  const maxRadius = 80;
  const segments = 64;

  for (let i = 1; i <= circles; i++) {
    const radius = (i / circles) * maxRadius;
    const points: THREE.Vector3[] = [];
    for (let j = 0; j <= segments; j++) {
      const angle = (j / segments) * Math.PI * 2;
      points.push(new THREE.Vector3(Math.cos(angle) * radius, 0, Math.sin(angle) * radius));
    }
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({
      color: 0x2a5a3a,
      transparent: true,
      opacity: 0.5
    });
    const line = new THREE.Line(geometry, material);
    group.add(line);
  }

  const radialLines = 24;
  for (let i = 0; i < radialLines; i++) {
    const angle = (i / radialLines) * Math.PI * 2;
    const points = [
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(Math.cos(angle) * maxRadius, 0, Math.sin(angle) * maxRadius)
    ];
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({
      color: 0x2a5a3a,
      transparent: true,
      opacity: 0.4
    });
    const line = new THREE.Line(geometry, material);
    group.add(line);
  }

  const groundGeo = new THREE.CircleGeometry(maxRadius, 64);
  const groundMat = new THREE.MeshStandardMaterial({
    color: 0x1e3d2a,
    roughness: 0.95,
    metalness: 0,
    transparent: true,
    opacity: 0.9
  });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.01;
  ground.receiveShadow = true;
  group.add(ground);

  scene.add(group);
}
