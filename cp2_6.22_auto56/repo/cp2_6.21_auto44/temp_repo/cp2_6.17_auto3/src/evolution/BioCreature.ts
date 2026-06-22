import * as THREE from 'three';
import type { Genotype } from './EvolutionEngine';

const SKIN_COLORS = [
  new THREE.Color(0x4a90d9),
  new THREE.Color(0x6bb3f0),
  new THREE.Color(0x8fd3b8),
  new THREE.Color(0xc9e26d),
  new THREE.Color(0xe6c22b),
  new THREE.Color(0xe8863b),
  new THREE.Color(0xe74c3c),
];

export class BioCreature {
  public group: THREE.Group;
  private genotype: Genotype | null = null;
  private baseScale = 1;

  private body: THREE.Mesh | null = null;
  private head: THREE.Mesh | null = null;
  private limbs: THREE.Mesh[] = [];
  private horns: THREE.Mesh[] = [];
  private tail: THREE.Mesh | null = null;
  private eyes: THREE.Mesh[] = [];

  private bodyMaterial: THREE.MeshStandardMaterial;
  private hornMaterial: THREE.MeshStandardMaterial;
  private eyeMaterial: THREE.MeshStandardMaterial;

  private isHighlighted = false;
  private highlightTime = 0;

  private isMutating = false;
  private mutationTime = 0;

  private targetPosition: THREE.Vector3 = new THREE.Vector3();
  private sourcePosition: THREE.Vector3 = new THREE.Vector3();
  private transitionProgress = 1;

  private animationTime = 0;

  constructor() {
    this.group = new THREE.Group();

    this.bodyMaterial = new THREE.MeshStandardMaterial({
      color: 0x4a90d9,
      metalness: 0.1,
      roughness: 0.6,
      emissive: 0x000000,
      emissiveIntensity: 0,
    });

    this.hornMaterial = new THREE.MeshStandardMaterial({
      color: 0x8b7355,
      metalness: 0.3,
      roughness: 0.5,
    });

    this.eyeMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0x000000,
      emissiveIntensity: 0,
    });

    this.createGeometry();
  }

  private createGeometry(): void {
    const bodyGeo = new THREE.SphereGeometry(1, 16, 12);
    this.body = new THREE.Mesh(bodyGeo, this.bodyMaterial);
    this.body.position.y = 1.2;
    this.body.castShadow = true;
    this.body.receiveShadow = true;
    this.group.add(this.body);

    const headGeo = new THREE.SphereGeometry(0.6, 12, 10);
    this.head = new THREE.Mesh(headGeo, this.bodyMaterial);
    this.head.position.set(0, 2.2, 0.6);
    this.head.castShadow = true;
    this.group.add(this.head);

    const limbPositions = [
      { x: 0.5, z: 0.5 },
      { x: -0.5, z: 0.5 },
      { x: 0.5, z: -0.5 },
      { x: -0.5, z: -0.5 },
    ];

    for (let i = 0; i < 4; i++) {
      const limbGeo = new THREE.ConeGeometry(0.2, 1.2, 8);
      const limb = new THREE.Mesh(limbGeo, this.bodyMaterial);
      limb.position.set(limbPositions[i].x, 0.5, limbPositions[i].z);
      limb.rotation.x = Math.PI;
      limb.castShadow = true;
      this.limbs.push(limb);
      this.group.add(limb);
    }

    this.horns.push(this.createHornGeometry(true));
    this.horns.push(this.createHornGeometry(false));
    for (const horn of this.horns) {
      this.group.add(horn);
    }

    this.tail = this.createTailGeometry();
    this.group.add(this.tail);

    const eyePositions = [
      { x: 0.2, z: 1.05 },
      { x: -0.2, z: 1.05 },
    ];

    for (let i = 0; i < 2; i++) {
      const eyeGeo = new THREE.SphereGeometry(0.1, 8, 8);
      const eye = new THREE.Mesh(eyeGeo, this.eyeMaterial);
      eye.position.set(eyePositions[i].x, 2.3, eyePositions[i].z);
      this.eyes.push(eye);
      this.group.add(eye);

      const pupilGeo = new THREE.SphereGeometry(0.05, 6, 6);
      const pupilMat = new THREE.MeshStandardMaterial({ color: 0x000000 });
      const pupil = new THREE.Mesh(pupilGeo, pupilMat);
      pupil.position.set(eyePositions[i].x, 2.3, eyePositions[i].z + 0.08);
      this.group.add(pupil);
    }
  }

  private createHornGeometry(isLeft: boolean): THREE.Mesh {
    const hornLength = 1.5;
    const segments = 16;
    const radialSegments = 10;

    const geometry = new THREE.BufferGeometry();
    const positions: number[] = [];
    const normals: number[] = [];
    const uvs: number[] = [];
    const indices: number[] = [];

    const baseRadius = 0.14;
    const tipRadius = 0.015;
    const curvatureStrength = 0.35;
    const curvatureFrequency = 0.7;

    for (let i = 0; i <= segments; i++) {
      const t = i / segments;

      const linearRadius = baseRadius * (1 - t) + tipRadius * t;
      const yOffset = t * hornLength;

      const bendAngle = t * t * curvatureFrequency * Math.PI;
      const bendOffsetX = Math.sin(bendAngle) * curvatureStrength * (isLeft ? 1 : -1);
      const bendOffsetZ = (1 - Math.cos(bendAngle)) * curvatureStrength * 0.15;

      for (let j = 0; j <= radialSegments; j++) {
        const angle = (j / radialSegments) * Math.PI * 2;

        const baseX = Math.cos(angle) * linearRadius;
        const baseZ = Math.sin(angle) * linearRadius;

        const vertexX = baseX + bendOffsetX;
        const vertexY = yOffset;
        const vertexZ = baseZ + bendOffsetZ;

        positions.push(vertexX, vertexY, vertexZ);

        const nx = Math.cos(angle);
        const nz = Math.sin(angle);
        const ny = Math.cos(bendAngle) * curvatureStrength * curvatureFrequency * Math.PI * 2 * t;
        const len = Math.sqrt(nx * nx + ny * ny + nz * nz);
        normals.push(nx / len, -Math.abs(ny) / len, nz / len);

        uvs.push(j / radialSegments, t);
      }
    }

    for (let i = 0; i < segments; i++) {
      for (let j = 0; j < radialSegments; j++) {
        const a = i * (radialSegments + 1) + j;
        const b = a + 1;
        const c = a + radialSegments + 1;
        const d = c + 1;

        indices.push(a, c, b);
        indices.push(b, c, d);
      }
    }

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();

    const horn = new THREE.Mesh(geometry, this.hornMaterial);
    horn.position.set(isLeft ? 0.25 : -0.25, 2.5, 0.3);
    horn.rotation.z = isLeft ? 0.3 : -0.3;
    horn.rotation.x = -0.2;
    horn.castShadow = true;

    return horn;
  }

  private createTailGeometry(): THREE.Mesh {
    const tailLength = 2.5;
    const segments = 24;
    const radialSegments = 12;

    const geometry = new THREE.BufferGeometry();
    const positions: number[] = [];
    const normals: number[] = [];
    const uvs: number[] = [];
    const indices: number[] = [];

    const baseRadius = 0.22;
    const tipRadius = 0.018;
    const waveAmplitude = 0.25;
    const waveFrequency = 1.5;
    const droopStrength = 0.2;

    for (let i = 0; i <= segments; i++) {
      const t = i / segments;

      const taperT = Math.pow(t, 0.6);
      const radialRadius = baseRadius * (1 - taperT) + tipRadius * taperT;

      const waveX = Math.sin(t * Math.PI * waveFrequency) * waveAmplitude;
      const droopY = -droopStrength * t * t;

      const centerZ = -t * tailLength;

      for (let j = 0; j <= radialSegments; j++) {
        const angle = (j / radialSegments) * Math.PI * 2;

        const localX = Math.cos(angle) * radialRadius;
        const localY = Math.sin(angle) * radialRadius;

        const vertexX = localX + waveX;
        const vertexY = localY + droopY;
        const vertexZ = centerZ;

        positions.push(vertexX, vertexY, vertexZ);

        const nx = Math.cos(angle);
        const ny = Math.sin(angle);
        const nz = -1;
        const len = Math.sqrt(nx * nx + ny * ny + nz * nz);
        normals.push(nx / len, ny / len, nz / len);

        uvs.push(j / radialSegments, t);
      }
    }

    for (let i = 0; i < segments; i++) {
      for (let j = 0; j < radialSegments; j++) {
        const a = i * (radialSegments + 1) + j;
        const b = a + 1;
        const c = a + radialSegments + 1;
        const d = c + 1;

        indices.push(a, c, b);
        indices.push(b, c, d);
      }
    }

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();

    const tail = new THREE.Mesh(geometry, this.bodyMaterial);
    tail.position.set(0, 1.2, -0.8);
    tail.rotation.x = 0.3;
    tail.castShadow = true;

    return tail;
  }

  public update(genotype: Genotype): void {
    this.genotype = genotype;

    this.baseScale = 0.6 + genotype.bodySize * 0.8;

    const colorIndex = Math.min(
      SKIN_COLORS.length - 1,
      Math.floor(genotype.skinColor * SKIN_COLORS.length)
    );
    const nextColorIndex = Math.min(SKIN_COLORS.length - 1, colorIndex + 1);
    const colorT = (genotype.skinColor * SKIN_COLORS.length) % 1;
    const skinColor = SKIN_COLORS[colorIndex].clone().lerp(SKIN_COLORS[nextColorIndex], colorT);
    this.bodyMaterial.color.copy(skinColor);

    if (this.body) {
      this.body.scale.setScalar(1 + genotype.spineCurve * 0.3);
    }

    if (this.head) {
      this.head.scale.setScalar(0.7 + genotype.headSize * 0.6);
      this.head.position.y = 1.8 + genotype.headSize * 0.6;
    }

    const hornScale = 0.3 + genotype.hornLength * 1.7;
    for (const horn of this.horns) {
      horn.scale.setScalar(hornScale);
    }

    for (let i = 0; i < this.limbs.length; i++) {
      const limb = this.limbs[i];
      const limbScale = 0.6 + genotype.limbLength * 0.8;
      limb.scale.set(limbScale, limbScale * (0.8 + genotype.limbLength * 0.4), limbScale);
      limb.position.y = 0.2 + genotype.limbLength * 0.6;
    }

    if (this.tail) {
      this.tail.scale.set(
        0.5 + genotype.tailType * 0.5,
        1,
        0.5 + genotype.tailType * 1.5
      );
    }

    for (const eye of this.eyes) {
      eye.scale.setScalar(0.6 + genotype.eyeSize * 0.8);
    }

    this.group.scale.setScalar(this.baseScale);
  }

  public setTargetPosition(position: THREE.Vector3): void {
    this.sourcePosition.copy(this.group.position);
    this.targetPosition.copy(position);
    this.transitionProgress = 0;
  }

  public cubicBezier(t: number): number {
    const p0 = 0;
    const p1 = 0.25;
    const p2 = 0.45;
    const p3 = 1;

    const t2 = t * t;
    const t3 = t2 * t;
    const mt = 1 - t;
    const mt2 = mt * mt;
    const mt3 = mt2 * mt;

    return mt3 * p0 + 3 * mt2 * t * p1 + 3 * mt * t2 * p2 + t3 * p3;
  }

  public animate(delta: number): void {
    this.animationTime += delta;

    if (this.transitionProgress < 1) {
      this.transitionProgress = Math.min(1, this.transitionProgress + delta * 2);
      const easedT = this.cubicBezier(this.transitionProgress);
      this.group.position.lerpVectors(
        this.sourcePosition,
        this.targetPosition,
        easedT
      );
    }

    if (this.isHighlighted) {
      this.highlightTime += delta;
      const pulse = 0.5 + 0.5 * Math.sin(this.highlightTime * 10);
      this.bodyMaterial.emissive.setHex(0x7c4dff);
      this.bodyMaterial.emissiveIntensity = 0.3 + pulse * 0.3;
    }

    if (this.isMutating) {
      this.mutationTime += delta;
      const mutT = this.mutationTime / 1.5;

      if (mutT < 1) {
        const scalePulse = 1 + 0.5 * Math.sin(mutT * Math.PI);
        this.group.scale.setScalar(this.baseScale * scalePulse);
        this.group.rotation.y += delta * 8;

        this.bodyMaterial.emissive.setHex(0xe74c3c);
        this.bodyMaterial.emissiveIntensity = 0.5 * (1 - mutT);
      } else {
        this.isMutating = false;
        this.group.scale.setScalar(this.baseScale);
        this.bodyMaterial.emissiveIntensity = this.isHighlighted ? 0.3 : 0;
        if (!this.isHighlighted) {
          this.bodyMaterial.emissive.setHex(0x000000);
        }
      }
    }

    if (this.tail && !this.isMutating) {
      this.tail.rotation.y = Math.sin(this.animationTime * 2) * 0.15;
    }
  }

  public highlight(enabled: boolean): void {
    this.isHighlighted = enabled;
    this.highlightTime = 0;

    if (!enabled) {
      this.bodyMaterial.emissive.setHex(0x000000);
      this.bodyMaterial.emissiveIntensity = 0;
    }
  }

  public playMutationAnimation(): void {
    this.isMutating = true;
    this.mutationTime = 0;
  }

  public getGenotype(): Genotype | null {
    return this.genotype;
  }

  public dispose(): void {
    this.group.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.geometry.dispose();
        if (Array.isArray(obj.material)) {
          obj.material.forEach((m) => m.dispose());
        } else {
          obj.material.dispose();
        }
      }
    });
  }
}
