import * as THREE from 'three';
import { PlantData } from './store';

const GROWTH_DURATION = 60;
const MAX_LEAVES = 6;
const INITIAL_LEAVES = 2;
const INITIAL_EAR_PARTICLES = 10;
const MAX_EAR_PARTICLES = 60;

export class Plant {
  group: THREE.Group;
  private stemMesh: THREE.Mesh;
  private leaves: THREE.Mesh[] = [];
  private earPoints: THREE.Points;
  private earGeometry: THREE.BufferGeometry;
  private data: PlantData;
  private outlineMesh: THREE.Mesh | null = null;
  private highlighted: boolean = false;
  private stemOriginalY: number = 0;

  constructor(data: PlantData, scene: THREE.Scene) {
    this.data = { ...data };
    this.group = new THREE.Group();
    this.group.position.set(data.position.x, 0, data.position.z);
    this.group.userData = { plantId: data.id };

    const stemGeometry = new THREE.CylinderGeometry(0.02, 0.03, data.currentHeight, 6);
    const stemMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#4CAF50'),
      roughness: 0.6,
      metalness: 0.1,
    });
    this.stemMesh = new THREE.Mesh(stemGeometry, stemMaterial);
    this.stemMesh.position.y = data.currentHeight / 2;
    this.stemMesh.castShadow = true;
    this.stemMesh.userData = { plantId: data.id };
    this.group.add(this.stemMesh);

    for (let i = 0; i < INITIAL_LEAVES; i++) {
      const leaf = this.createLeaf(i, INITIAL_LEAVES, data.currentHeight);
      this.leaves.push(leaf);
      this.group.add(leaf);
    }

    this.earGeometry = new THREE.BufferGeometry();
    this.updateEarGeometry(INITIAL_EAR_PARTICLES, 0.3);
    const earMaterial = new THREE.PointsMaterial({
      color: new THREE.Color('#FFD700'),
      size: 0.04,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.9,
    });
    this.earPoints = new THREE.Points(this.earGeometry, earMaterial);
    this.earPoints.position.y = data.currentHeight;
    this.earPoints.userData = { plantId: data.id };
    this.group.add(this.earPoints);

    scene.add(this.group);
  }

  private createLeaf(index: number, total: number, stemHeight: number): THREE.Mesh {
    const leafWidth = 0.12 + Math.random() * 0.06;
    const leafLength = 0.25 + Math.random() * 0.1;
    const shape = new THREE.Shape();
    shape.moveTo(0, 0);
    shape.quadraticCurveTo(leafWidth * 0.6, leafLength * 0.4, leafWidth * 0.15, leafLength);
    shape.quadraticCurveTo(-leafWidth * 0.1, leafLength * 0.5, 0, 0);

    const geometry = new THREE.ShapeGeometry(shape, 4);
    const material = new THREE.MeshStandardMaterial({
      color: new THREE.Color().lerpColors(
        new THREE.Color('#66BB6A'),
        new THREE.Color('#2E7D32'),
        Math.random()
      ),
      side: THREE.DoubleSide,
      roughness: 0.7,
      metalness: 0.05,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;

    const angle = (index / total) * Math.PI * 2 + (Math.random() - 0.5) * 0.5;
    const yPos = stemHeight * (0.3 + (index / total) * 0.5);
    mesh.position.set(0, yPos, 0);
    mesh.rotation.y = angle;
    mesh.rotation.z = -0.3 - Math.random() * 0.4;
    mesh.userData = { plantId: this.data.id, baseAngle: angle, baseZ: mesh.rotation.z };
    return mesh;
  }

  private updateEarGeometry(count: number, scale: number): void {
    const positions: number[] = [];
    const spreadY = 0.1 * scale;
    const spreadXZ = 0.04 * scale;
    for (let i = 0; i < count; i++) {
      positions.push(
        (Math.random() - 0.5) * spreadXZ * 2,
        Math.random() * spreadY,
        (Math.random() - 0.5) * spreadXZ * 2
      );
    }
    this.earGeometry.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(positions, 3)
    );
  }

  updateGrowth(deltaTime: number): void {
    const elapsed = (Date.now() - this.data.createdAt) / 1000;
    const progress = Math.min(elapsed / GROWTH_DURATION, 1);
    const smoothProgress = progress * progress * (3 - 2 * progress);

    const newHeight =
      this.data.initialHeight +
      (this.data.targetHeight - this.data.initialHeight) * smoothProgress;

    const newLeafCount = Math.floor(
      INITIAL_LEAVES + (MAX_LEAVES - INITIAL_LEAVES) * smoothProgress
    );

    const newEarCount = Math.floor(
      INITIAL_EAR_PARTICLES +
      (MAX_EAR_PARTICLES - INITIAL_EAR_PARTICLES) * smoothProgress
    );

    const newEarScale = 0.3 + 0.7 * smoothProgress;

    if (Math.abs(newHeight - this.data.currentHeight) > 0.001) {
      this.data.currentHeight = newHeight;

      const newGeom = new THREE.CylinderGeometry(
        0.02,
        0.03,
        newHeight,
        6
      );
      this.stemMesh.geometry.dispose();
      this.stemMesh.geometry = newGeom;
      this.stemMesh.position.y = newHeight / 2;
      this.earPoints.position.y = newHeight;
    }

    while (this.leaves.length < newLeafCount) {
      const leaf = this.createLeaf(
        this.leaves.length,
        newLeafCount,
        this.data.currentHeight
      );
      this.leaves.push(leaf);
      this.group.add(leaf);
    }

    if (newEarCount !== this.data.earParticleCount) {
      this.updateEarGeometry(newEarCount, newEarScale);
      (this.earPoints.material as THREE.PointsMaterial).size =
        0.04 * (0.5 + newEarScale * 0.5);
    }

    this.data.leafCount = newLeafCount;
    this.data.earParticleCount = newEarCount;
    this.data.earParticleScale = newEarScale;
  }

  updatePose(windDirection: number, windStrength: number, time: number): void {
    const windRad = (windDirection * Math.PI) / 180;
    const bendFactor = windStrength * 0.015;
    const timeFactor = time * (0.5 + windStrength * 0.3);

    const bendX = Math.sin(windRad) * bendFactor + Math.sin(timeFactor * 1.3) * 0.005;
    const bendZ = Math.cos(windRad) * bendFactor + Math.cos(timeFactor * 0.9) * 0.005;

    this.group.rotation.x = bendZ;
    this.group.rotation.z = -bendX;

    for (let i = 0; i < this.leaves.length; i++) {
      const leaf = this.leaves[i];
      const baseAngle = leaf.userData.baseAngle || 0;
      const swaySpeed = 0.8 + windStrength * 0.4;
      const swayAmount = 0.15 + windStrength * 0.08;
      leaf.rotation.z =
        leaf.userData.baseZ +
        Math.sin(timeFactor * swaySpeed + i * 1.5 + baseAngle) * swayAmount;
      leaf.rotation.x =
        Math.cos(timeFactor * swaySpeed * 0.7 + i * 2.1) * swayAmount * 0.5;
    }
  }

  setHighlighted(highlighted: boolean): void {
    if (this.highlighted === highlighted) return;
    this.highlighted = highlighted;

    if (highlighted) {
      const outlineGeom = this.stemMesh.geometry.clone();
      const outlineMat = new THREE.MeshBasicMaterial({
        color: 0x00ff88,
        side: THREE.BackSide,
        transparent: true,
        opacity: 0.5,
      });
      this.outlineMesh = new THREE.Mesh(outlineGeom, outlineMat);
      this.outlineMesh.scale.set(1.6, 1.2, 1.6);
      this.outlineMesh.position.copy(this.stemMesh.position);
      this.group.add(this.outlineMesh);

      (this.stemMesh.material as THREE.MeshStandardMaterial).emissive =
        new THREE.Color('#00ff88');
      (this.stemMesh.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.3;
    } else {
      if (this.outlineMesh) {
        this.group.remove(this.outlineMesh);
        this.outlineMesh.geometry.dispose();
        (this.outlineMesh.material as THREE.Material).dispose();
        this.outlineMesh = null;
      }
      (this.stemMesh.material as THREE.MeshStandardMaterial).emissive =
        new THREE.Color('#000000');
      (this.stemMesh.material as THREE.MeshStandardMaterial).emissiveIntensity = 0;
    }
  }

  getData(): PlantData {
    return { ...this.data };
  }

  dispose(scene: THREE.Scene): void {
    scene.remove(this.group);
    this.stemMesh.geometry.dispose();
    (this.stemMesh.material as THREE.Material).dispose();
    this.leaves.forEach((l) => {
      l.geometry.dispose();
      (l.material as THREE.Material).dispose();
    });
    this.earGeometry.dispose();
    (this.earPoints.material as THREE.Material).dispose();
    if (this.outlineMesh) {
      this.outlineMesh.geometry.dispose();
      (this.outlineMesh.material as THREE.Material).dispose();
    }
  }
}
