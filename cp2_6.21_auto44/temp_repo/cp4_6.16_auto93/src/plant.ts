import * as THREE from 'three';
import { PlantData } from './store';

const GROWTH_DURATION = 60;
const MAX_LEAVES = 6;
const MAX_INSTANCES = 100;
const MAX_EAR_PARTICLES_PER_PLANT = 60;
const TOTAL_EAR_PARTICLES = MAX_INSTANCES * MAX_EAR_PARTICLES_PER_PLANT;

interface LeafInfo {
  baseAngle: number;
  baseZ: number;
  heightRatio: number;
  phase: number;
  index: number;
  visible: boolean;
  spawnProgress: number;
}

export interface PlantRuntimeState {
  id: string;
  instanceIndex: number;
  position: THREE.Vector3;
  stemSegments: THREE.Vector3[];
  stemHeight: number;
  initialHeight: number;
  targetHeight: number;
  createdAt: number;
  leaves: LeafInfo[];
  earPositions: Float32Array;
  earParticleCount: number;
  earParticleScale: number;
  currentBendX: number;
  currentBendZ: number;
  bendTargetX: number;
  bendTargetZ: number;
  highlighted: boolean;
  highlightIntensity: number;
}

export class PlantRenderSystem {
  scene: THREE.Scene;
  stemGeom: THREE.CylinderGeometry;
  stemMat: THREE.MeshStandardMaterial;
  stemMesh: THREE.InstancedMesh;

  leafGeom: THREE.BufferGeometry;
  leafMat: THREE.MeshStandardMaterial;
  leafMesh: THREE.InstancedMesh;

  earGeom: THREE.BufferGeometry;
  earMat: THREE.PointsMaterial;
  earPoints: THREE.Points;

  highlightGeom: THREE.CylinderGeometry;
  highlightMat: THREE.MeshBasicMaterial;
  highlightMesh: THREE.InstancedMesh;

  stemDummy: THREE.Object3D;
  leafDummy: THREE.Object3D;
  highlightDummy: THREE.Object3D;

  plants: Map<string, PlantRuntimeState> = new Map();
  private nextIndex = 0;
  private freeIndices: number[] = [];

  private stemHeightTarget: number[] = [];
  private stemHeightCurrent: number[] = [];

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.stemDummy = new THREE.Object3D();
    this.leafDummy = new THREE.Object3D();
    this.highlightDummy = new THREE.Object3D();

    this.stemGeom = new THREE.CylinderGeometry(0.025, 0.035, 1, 8);
    this.stemMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#4CAF50'),
      roughness: 0.6,
      metalness: 0.1,
      vertexColors: false,
    });
    this.stemMesh = new THREE.InstancedMesh(
      this.stemGeom,
      this.stemMat,
      MAX_INSTANCES
    );
    this.stemMesh.count = 0;
    this.stemMesh.castShadow = true;
    this.stemMesh.receiveShadow = false;
    this.stemMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    scene.add(this.stemMesh);

    this.leafGeom = this.createLeafGeometry();
    this.leafMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#5cb85c'),
      side: THREE.DoubleSide,
      roughness: 0.75,
      metalness: 0.05,
      transparent: true,
      opacity: 0.95,
    });
    this.leafMesh = new THREE.InstancedMesh(
      this.leafGeom,
      this.leafMat,
      MAX_INSTANCES * MAX_LEAVES
    );
    this.leafMesh.count = 0;
    this.leafMesh.castShadow = true;
    this.leafMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    scene.add(this.leafMesh);

    this.earGeom = new THREE.BufferGeometry();
    const earPositions = new Float32Array(TOTAL_EAR_PARTICLES * 3);
    this.earGeom.setAttribute(
      'position',
      new THREE.BufferAttribute(earPositions, 3)
    );
    const earColors = new Float32Array(TOTAL_EAR_PARTICLES * 3);
    for (let i = 0; i < TOTAL_EAR_PARTICLES; i++) {
      earColors[i * 3] = 1.0;
      earColors[i * 3 + 1] = 0.843;
      earColors[i * 3 + 2] = 0.0;
    }
    this.earGeom.setAttribute(
      'color',
      new THREE.BufferAttribute(earColors, 3)
    );
    this.earGeom.setDrawRange(0, 0);
    this.earMat = new THREE.PointsMaterial({
      size: 0.045,
      sizeAttenuation: true,
      vertexColors: true,
      transparent: true,
      opacity: 0.92,
    });
    this.earPoints = new THREE.Points(this.earGeom, this.earMat);
    scene.add(this.earPoints);

    this.highlightGeom = new THREE.CylinderGeometry(0.08, 0.1, 1, 10);
    this.highlightMat = new THREE.MeshBasicMaterial({
      color: 0x00ff88,
      transparent: true,
      opacity: 0.0,
      side: THREE.BackSide,
    });
    this.highlightMesh = new THREE.InstancedMesh(
      this.highlightGeom,
      this.highlightMat,
      MAX_INSTANCES
    );
    this.highlightMesh.count = 0;
    this.highlightMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    scene.add(this.highlightMesh);
  }

  private createLeafGeometry(): THREE.BufferGeometry {
    const leafWidth = 0.13;
    const leafLength = 0.3;
    const segments = 8;
    const positions: number[] = [];
    const uvs: number[] = [];
    const indices: number[] = [];

    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const y = t * leafLength;
      const halfWidth =
        leafWidth *
        (1 - Math.pow(t - 0.4, 2) * 3.5) *
        (0.2 + 0.8 * Math.sin(t * Math.PI));
      const curveOffset = Math.sin(t * Math.PI * 0.8) * leafWidth * 0.25;

      positions.push(-halfWidth + curveOffset, y, 0);
      positions.push(halfWidth + curveOffset, y, 0);
      uvs.push(0, t);
      uvs.push(1, t);
    }

    for (let i = 0; i < segments; i++) {
      const a = i * 2;
      const b = i * 2 + 1;
      const c = i * 2 + 2;
      const d = i * 2 + 3;
      indices.push(a, c, b);
      indices.push(b, c, d);
    }

    const geom = new THREE.BufferGeometry();
    geom.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(positions, 3)
    );
    geom.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geom.setIndex(indices);
    geom.computeVertexNormals();
    return geom;
  }

  addPlant(data: PlantData): void {
    if (this.plants.has(data.id)) return;

    let index: number;
    if (this.freeIndices.length > 0) {
      index = this.freeIndices.pop()!;
    } else {
      index = this.nextIndex++;
    }

    const leaves: LeafInfo[] = [];
    const leafYRatios = [0.35, 0.55, 0.45, 0.68, 0.78, 0.88];
    const leafAngles = [0, Math.PI, Math.PI * 0.5, Math.PI * 1.5, Math.PI * 0.25, Math.PI * 1.25];

    for (let i = 0; i < MAX_LEAVES; i++) {
      leaves.push({
        baseAngle: leafAngles[i] + (Math.random() - 0.5) * 0.3,
        baseZ: -0.4 - Math.random() * 0.35,
        heightRatio: leafYRatios[i],
        phase: Math.random() * Math.PI * 2,
        index: i,
        visible: i < 2,
        spawnProgress: i < 2 ? 1 : 0,
      });
    }

    const earPositions = new Float32Array(MAX_EAR_PARTICLES_PER_PLANT * 3);

    const state: PlantRuntimeState = {
      id: data.id,
      instanceIndex: index,
      position: new THREE.Vector3(data.position.x, 0, data.position.z),
      stemSegments: [],
      stemHeight: data.currentHeight,
      initialHeight: data.initialHeight,
      targetHeight: data.targetHeight,
      createdAt: data.createdAt,
      leaves,
      earPositions,
      earParticleCount: 10,
      earParticleScale: 0.3,
      currentBendX: 0,
      currentBendZ: 0,
      bendTargetX: 0,
      bendTargetZ: 0,
      highlighted: false,
      highlightIntensity: 0,
    };

    for (let i = 0; i < 10; i++) {
      const phi = Math.random() * Math.PI * 2;
      const r = 0.02 * Math.sqrt(Math.random());
      earPositions[i * 3] = Math.cos(phi) * r;
      earPositions[i * 3 + 1] = data.currentHeight + Math.random() * 0.04;
      earPositions[i * 3 + 2] = Math.sin(phi) * r;
    }

    this.plants.set(data.id, state);
    this.stemMesh.count = Math.max(this.stemMesh.count, index + 1);
    this.leafMesh.count = Math.max(
      this.leafMesh.count,
      (index + 1) * MAX_LEAVES
    );
    this.highlightMesh.count = Math.max(this.highlightMesh.count, index + 1);
  }

  removePlant(id: string): void {
    const state = this.plants.get(id);
    if (!state) return;
    this.freeIndices.push(state.instanceIndex);
    this.plants.delete(id);
  }

  setHighlighted(id: string, highlighted: boolean): void {
    const state = this.plants.get(id);
    if (state) {
      state.highlighted = highlighted;
    }
  }

  private getLeafCountForAge(ageSec: number): number {
    if (ageSec < 15) return 2;
    if (ageSec < 30) return 3;
    if (ageSec < 45) return 4;
    if (ageSec < 55) return 5;
    return 6;
  }

  private getEarCountForAge(ageSec: number): number {
    const t = Math.min(ageSec / GROWTH_DURATION, 1);
    return Math.round(10 + 50 * t * t * (3 - 2 * t));
  }

  update(
    deltaTime: number,
    time: number,
    windDirectionDeg: number,
    windStrength: number,
    onUpdateData?: (id: string, data: Partial<PlantData>) => void
  ): void {
    const windRad = (windDirectionDeg * Math.PI) / 180;
    const normalizedStrength = windStrength / 5;
    const bendAmount = normalizedStrength * 0.35;
    const bendTargetX = Math.sin(windRad) * bendAmount;
    const bendTargetZ = Math.cos(windRad) * bendAmount;
    const swayBaseSpeed = 0.6 + normalizedStrength * 2.2;
    const swayBaseAmount = 0.12 + normalizedStrength * 0.35;

    const earPosAttr = this.earGeom.getAttribute(
      'position'
    ) as THREE.BufferAttribute;
    const earPosArr = earPosAttr.array as Float32Array;
    let totalEarParticles = 0;

    this.plants.forEach((state) => {
      const ageSec = (Date.now() - state.createdAt) / 1000;
      const growthT = Math.min(ageSec / GROWTH_DURATION, 1);
      const smoothT = growthT * growthT * (3 - 2 * growthT);

      const newHeight =
        state.initialHeight +
        (state.targetHeight - state.initialHeight) * smoothT;
      state.stemHeight = newHeight;

      state.bendTargetX = bendTargetX + Math.sin(time * 0.9 + state.instanceIndex) * 0.02;
      state.bendTargetZ = bendTargetZ + Math.cos(time * 0.7 + state.instanceIndex * 0.7) * 0.02;

      const bendLerp = 1 - Math.pow(0.001, deltaTime);
      state.currentBendX += (state.bendTargetX - state.currentBendX) * bendLerp;
      state.currentBendZ += (state.bendTargetZ - state.currentBendZ) * bendLerp;

      const targetLeafCount = this.getLeafCountForAge(ageSec);
      for (let i = 0; i < MAX_LEAVES; i++) {
        const leaf = state.leaves[i];
        const shouldBeVisible = i < targetLeafCount;
        leaf.visible = shouldBeVisible;
        if (shouldBeVisible && leaf.spawnProgress < 1) {
          leaf.spawnProgress = Math.min(1, leaf.spawnProgress + deltaTime * 0.8);
        }
      }

      const targetEarCount = this.getEarCountForAge(ageSec);
      if (targetEarCount !== state.earParticleCount) {
        if (targetEarCount > state.earParticleCount) {
          for (let i = state.earParticleCount; i < targetEarCount; i++) {
            const phi = Math.random() * Math.PI * 2;
            const r = 0.015 * Math.sqrt(Math.random());
            state.earPositions[i * 3] = Math.cos(phi) * r;
            state.earPositions[i * 3 + 1] =
              state.stemHeight + Math.random() * 0.08 * (0.3 + smoothT * 0.7);
            state.earPositions[i * 3 + 2] = Math.sin(phi) * r;
          }
        }
        state.earParticleCount = targetEarCount;
      }
      state.earParticleScale = 0.3 + 0.7 * smoothT;

      const stemTopY = state.stemHeight;
      const bendX = state.currentBendX * state.stemHeight * 0.5;
      const bendZ = state.currentBendZ * state.stemHeight * 0.5;

      this.stemDummy.position.set(
        state.position.x + bendX * 0.5,
        state.stemHeight / 2,
        state.position.z + bendZ * 0.5
      );
      const stemScaleY = state.stemHeight;
      this.stemDummy.scale.set(1, stemScaleY, 1);
      this.stemDummy.rotation.z = -state.currentBendX * 0.8;
      this.stemDummy.rotation.x = state.currentBendZ * 0.8;
      this.stemDummy.rotation.y = 0;
      this.stemDummy.updateMatrix();
      this.stemMesh.setMatrixAt(state.instanceIndex, this.stemDummy.matrix);

      if (state.highlighted && state.highlightIntensity < 1) {
        state.highlightIntensity = Math.min(1, state.highlightIntensity + deltaTime * 4);
      } else if (!state.highlighted && state.highlightIntensity > 0) {
        state.highlightIntensity = Math.max(0, state.highlightIntensity - deltaTime * 4);
      }

      this.highlightDummy.position.set(
        state.position.x + bendX * 0.5,
        state.stemHeight / 2,
        state.position.z + bendZ * 0.5
      );
      this.highlightDummy.scale.set(
        2.2 + state.highlightIntensity * 0.8,
        stemScaleY * 1.1,
        2.2 + state.highlightIntensity * 0.8
      );
      this.highlightDummy.rotation.z = -state.currentBendX * 0.8;
      this.highlightDummy.rotation.x = state.currentBendZ * 0.8;
      this.highlightDummy.updateMatrix();
      this.highlightMesh.setMatrixAt(state.instanceIndex, this.highlightDummy.matrix);
      this.highlightMat.opacity = 0.25 + state.highlightIntensity * 0.2;

      for (let li = 0; li < MAX_LEAVES; li++) {
        const leaf = state.leaves[li];
        const leafInstanceIdx = state.instanceIndex * MAX_LEAVES + li;

        if (!leaf.visible || leaf.spawnProgress < 0.05) {
          this.leafDummy.position.set(
            state.position.x,
            -1000,
            state.position.z
          );
          this.leafDummy.scale.set(0.001, 0.001, 0.001);
          this.leafDummy.updateMatrix();
          this.leafMesh.setMatrixAt(leafInstanceIdx, this.leafDummy.matrix);
          continue;
        }

        const leafY = state.stemHeight * leaf.heightRatio;
        const leafBendX = state.currentBendX * leafY * 0.9;
        const leafBendZ = state.currentBendZ * leafY * 0.9;

        const swayAmt = swayBaseAmount * (0.8 + leaf.index * 0.05);
        const swaySpd = swayBaseSpeed * (0.85 + leaf.index * 0.04);
        const sway =
          Math.sin(time * swaySpd + leaf.phase + state.instanceIndex * 0.3) *
          swayAmt;
        const swayX =
          Math.cos(time * swaySpd * 0.7 + leaf.phase * 1.3) * swayAmt * 0.4;

        this.leafDummy.position.set(
          state.position.x + leafBendX,
          leafY,
          state.position.z + leafBendZ
        );

        const spawnScale = leaf.spawnProgress;
        this.leafDummy.scale.set(spawnScale, spawnScale, spawnScale);
        this.leafDummy.rotation.set(
          swayX + state.currentBendZ * 0.3,
          leaf.baseAngle + sway * 0.4,
          leaf.baseZ + sway
        );
        this.leafDummy.updateMatrix();
        this.leafMesh.setMatrixAt(leafInstanceIdx, this.leafDummy.matrix);
      }

      const earOffset = state.instanceIndex * MAX_EAR_PARTICLES_PER_PLANT * 3;
      const earSway =
        Math.sin(time * (swayBaseSpeed * 1.3) + state.instanceIndex * 0.5) *
        0.015 *
        normalizedStrength;
      const earSwayX =
        Math.cos(time * (swayBaseSpeed * 0.9) + state.instanceIndex * 0.8) *
        0.01 *
        normalizedStrength;

      for (let i = 0; i < state.earParticleCount; i++) {
        const baseIdx = state.instanceIndex * MAX_EAR_PARTICLES_PER_PLANT + i;
        const posIdx = baseIdx * 3;
        earPosArr[posIdx] =
          state.position.x +
          state.earPositions[i * 3] * (0.5 + state.earParticleScale) +
          bendX +
          earSwayX;
        earPosArr[posIdx + 1] =
          state.earPositions[i * 3 + 1] + earSway * 2;
        earPosArr[posIdx + 2] =
          state.position.z +
          state.earPositions[i * 3 + 2] * (0.5 + state.earParticleScale) +
          bendZ +
          earSway;
      }
      totalEarParticles = Math.max(
        totalEarParticles,
        (state.instanceIndex + 1) * MAX_EAR_PARTICLES_PER_PLANT
      );

      if (onUpdateData) {
        onUpdateData(state.id, {
          currentHeight: state.stemHeight,
          leafCount: state.leaves.filter((l) => l.visible).length,
          earParticleCount: state.earParticleCount,
          earParticleScale: state.earParticleScale,
        });
      }
    });

    this.stemMesh.instanceMatrix.needsUpdate = true;
    this.leafMesh.instanceMatrix.needsUpdate = true;
    this.highlightMesh.instanceMatrix.needsUpdate = true;
    earPosAttr.needsUpdate = true;
    this.earGeom.setDrawRange(0, totalEarParticles);
    this.earMat.size = 0.035 + 0.02;
  }

  pickPlant(raycaster: THREE.Raycaster): string | null {
    const stemIntersects = raycaster.intersectObject(this.stemMesh, false);
    if (stemIntersects.length > 0 && stemIntersects[0].instanceId !== undefined) {
      const idx = stemIntersects[0].instanceId;
      for (const [id, state] of this.plants.entries()) {
        if (state.instanceIndex === idx) return id;
      }
    }
    const leafIntersects = raycaster.intersectObject(this.leafMesh, false);
    if (leafIntersects.length > 0 && leafIntersects[0].instanceId !== undefined) {
      const leafIdx = leafIntersects[0].instanceId;
      const instIdx = Math.floor(leafIdx / MAX_LEAVES);
      for (const [id, state] of this.plants.entries()) {
        if (state.instanceIndex === instIdx) return id;
      }
    }
    return null;
  }

  getPlantData(id: string): { currentHeight: number; leafCount: number; earParticleCount: number; earParticleScale: number; createdAt: number } | null {
    const s = this.plants.get(id);
    if (!s) return null;
    return {
      currentHeight: s.stemHeight,
      leafCount: s.leaves.filter((l) => l.visible).length,
      earParticleCount: s.earParticleCount,
      earParticleScale: s.earParticleScale,
      createdAt: s.createdAt,
    };
  }

  dispose(): void {
    this.stemGeom.dispose();
    this.stemMat.dispose();
    this.scene.remove(this.stemMesh);
    this.leafGeom.dispose();
    this.leafMat.dispose();
    this.scene.remove(this.leafMesh);
    this.earGeom.dispose();
    this.earMat.dispose();
    this.scene.remove(this.earPoints);
    this.highlightGeom.dispose();
    this.highlightMat.dispose();
    this.scene.remove(this.highlightMesh);
  }
}
