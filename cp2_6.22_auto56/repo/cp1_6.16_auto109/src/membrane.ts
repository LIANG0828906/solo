import * as THREE from 'three';

export interface ReceptorData {
  mesh: THREE.Mesh;
  position: THREE.Vector3;
  color: THREE.Color;
}

export class Membrane {
  scene: THREE.Scene;
  group: THREE.Group;
  private bilayerGroup: THREE.Group;
  private topLayer: THREE.Mesh;
  private bottomLayer: THREE.Mesh;
  private topPositions: Float32Array;
  private basePositions: Float32Array;
  receptors: ReceptorData[] = [];
  width: number;
  height: number;
  private depressionCenter: THREE.Vector3 | null = null;
  private depressionDepth = 0;
  private depressionTargetDepth = 0;
  private depressionRadius = 1.5;
  segmentsW = 60;
  segmentsH = 60;

  constructor(scene: THREE.Scene, width: number, height: number) {
    this.scene = scene;
    this.width = width;
    this.height = height;

    this.group = new THREE.Group();
    this.bilayerGroup = new THREE.Group();

    const topGeometry = new THREE.PlaneGeometry(width, height, this.segmentsW, this.segmentsH);
    topGeometry.rotateX(-Math.PI / 2);
    this.topPositions = topGeometry.attributes.position.array as Float32Array;
    this.basePositions = new Float32Array(this.topPositions);

    const topMaterial = new THREE.MeshPhongMaterial({
      color: 0x4488aa,
      transparent: true,
      opacity: 0.45,
      side: THREE.DoubleSide,
      shininess: 80
    });
    this.topLayer = new THREE.Mesh(topGeometry, topMaterial);
    this.topLayer.position.y = 0.15;
    this.bilayerGroup.add(this.topLayer);

    const bottomGeometry = new THREE.PlaneGeometry(width, height, this.segmentsW, this.segmentsH);
    bottomGeometry.rotateX(-Math.PI / 2);
    const bottomMaterial = new THREE.MeshPhongMaterial({
      color: 0x336688,
      transparent: true,
      opacity: 0.4,
      side: THREE.DoubleSide,
      shininess: 80
    });
    this.bottomLayer = new THREE.Mesh(bottomGeometry, bottomMaterial);
    this.bottomLayer.position.y = -0.15;
    this.bilayerGroup.add(this.bottomLayer);

    this.group.add(this.bilayerGroup);
    this.generateReceptors(25);
    scene.add(this.group);
  }

  private generateReceptors(count: number): void {
    const hexGeometry = new THREE.CylinderGeometry(0.1, 0.08, 0.15, 6);
    const positions: THREE.Vector3[] = [];
    const minDist = 0.7;

    for (let i = 0; i < count * 5 && positions.length < count; i++) {
      const x = (Math.random() - 0.5) * (this.width - 1.5);
      const z = (Math.random() - 0.5) * (this.height - 1.5);
      const candidate = new THREE.Vector3(x, 0.25, z);
      const tooClose = positions.some(p => p.distanceTo(candidate) < minDist);
      if (!tooClose) positions.push(candidate);
    }

    const colorStart = new THREE.Color('#FF6B6B');
    const colorEnd = new THREE.Color('#4ECDC4');

    for (const pos of positions) {
      const colorMix = Math.random();
      const color = new THREE.Color().lerpColors(colorStart, colorEnd, colorMix);

      const material = new THREE.MeshPhongMaterial({
        color,
        shininess: 90,
        specular: 0x666666,
        emissive: color,
        emissiveIntensity: 0.1
      });
      const mesh = new THREE.Mesh(hexGeometry, material);
      mesh.position.copy(pos);
      mesh.rotation.x = Math.PI / 2;
      this.group.add(mesh);
      this.receptors.push({ mesh, position: pos.clone(), color });
    }
  }

  startDepression(center: THREE.Vector3, depth: number): void {
    this.depressionCenter = center.clone();
    this.depressionTargetDepth = depth;
    this.depressionDepth = 0;
  }

  update(delta: number, timeScale: number, isMembranePhase: boolean): void {
    if (this.depressionCenter && isMembranePhase) {
      const targetDepth = this.depressionTargetDepth;
      this.depressionDepth += (targetDepth - this.depressionDepth) * Math.min(1, delta * timeScale * 4);
      this.applyDepression();
    } else if (this.depressionDepth > 0 && !isMembranePhase && this.depressionCenter) {
      this.applyDepression();
    }
  }

  private applyDepression(): void {
    if (!this.depressionCenter) return;

    for (let i = 0; i < this.topPositions.length; i += 3) {
      const baseY = this.basePositions[i + 1];
      const x = this.basePositions[i];
      const z = this.basePositions[i + 2];

      const dx = x - this.depressionCenter.x;
      const dz = z - this.depressionCenter.z;
      const dist = Math.sqrt(dx * dx + dz * dz);

      if (dist < this.depressionRadius) {
        const falloff = 1 - dist / this.depressionRadius;
        const depression = this.depressionDepth * falloff * falloff;
        this.topPositions[i + 1] = baseY - depression;
      } else {
        this.topPositions[i + 1] = baseY;
      }
    }
    (this.topLayer.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
    this.topLayer.geometry.computeVertexNormals();

    const bottomPositions = this.bottomLayer.geometry.attributes.position.array as Float32Array;
    for (let i = 0; i < bottomPositions.length; i += 3) {
      const baseY = this.basePositions[i + 1] - 0.3;
      const x = this.basePositions[i];
      const z = this.basePositions[i + 2];

      const dx = x - this.depressionCenter.x;
      const dz = z - this.depressionCenter.z;
      const dist = Math.sqrt(dx * dx + dz * dz);

      if (dist < this.depressionRadius) {
        const falloff = 1 - dist / this.depressionRadius;
        const depression = this.depressionDepth * falloff * falloff;
        bottomPositions[i + 1] = baseY - depression;
      } else {
        bottomPositions[i + 1] = baseY;
      }
    }
    (this.bottomLayer.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
    this.bottomLayer.geometry.computeVertexNormals();

    for (const receptor of this.receptors) {
      const dx = receptor.position.x - this.depressionCenter.x;
      const dz = receptor.position.z - this.depressionCenter.z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < this.depressionRadius) {
        const falloff = 1 - dist / this.depressionRadius;
        const depression = this.depressionDepth * falloff * falloff;
        receptor.mesh.position.y = 0.25 - depression;
      } else {
        receptor.mesh.position.y = 0.25;
      }
    }
  }

  getClosestReceptors(position: THREE.Vector3, count: number): THREE.Vector3[] {
    return [...this.receptors]
      .sort((a, b) => {
        const da = new THREE.Vector2(a.position.x - position.x, a.position.z - position.z).length();
        const db = new THREE.Vector2(b.position.x - position.x, b.position.z - position.z).length();
        return da - db;
      })
      .slice(0, count)
      .map(r => r.position.clone());
  }

  reset(): void {
    this.depressionCenter = null;
    this.depressionDepth = 0;
    this.depressionTargetDepth = 0;

    for (let i = 0; i < this.topPositions.length; i++) {
      this.topPositions[i] = this.basePositions[i];
    }
    (this.topLayer.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
    this.topLayer.geometry.computeVertexNormals();

    const bottomPositions = this.bottomLayer.geometry.attributes.position.array as Float32Array;
    for (let i = 0; i < bottomPositions.length; i += 3) {
      bottomPositions[i] = this.basePositions[i];
      bottomPositions[i + 1] = this.basePositions[i + 1] - 0.3;
      bottomPositions[i + 2] = this.basePositions[i + 2];
    }
    (this.bottomLayer.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
    this.bottomLayer.geometry.computeVertexNormals();

    for (const receptor of this.receptors) {
      receptor.mesh.position.y = 0.25;
    }
  }

  dispose(): void {
    this.scene.remove(this.group);
    this.topLayer.geometry.dispose();
    (this.topLayer.material as THREE.Material).dispose();
    this.bottomLayer.geometry.dispose();
    (this.bottomLayer.material as THREE.Material).dispose();
    for (const r of this.receptors) {
      r.mesh.geometry.dispose();
      (r.mesh.material as THREE.Material).dispose();
    }
  }
}
