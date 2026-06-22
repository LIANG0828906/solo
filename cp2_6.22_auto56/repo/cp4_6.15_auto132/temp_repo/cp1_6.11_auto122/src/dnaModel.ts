import * as THREE from 'three';

export type BaseType = 'A' | 'T' | 'C' | 'G';

export interface BasePairData {
  base1: BaseType;
  base2: BaseType;
  isMismatch: boolean;
}

export interface DNAModelOptions {
  radius?: number;
  pitch?: number;
  basePairsPerTurn?: number;
  basePairCount?: number;
  sphereSegments?: number;
}

const BASE_COLORS: Record<BaseType, number> = {
  A: 0xff4444,
  T: 0x4444ff,
  C: 0x44ff44,
  G: 0xffff44,
};

const MISMATCH_COLOR = 0x888888;
const BACKBONE_COLOR_1 = 0x4a90d9;
const BACKBONE_COLOR_2 = 0xe87a90;

export function getComplementaryBase(base: BaseType): BaseType {
  switch (base) {
    case 'A': return 'T';
    case 'T': return 'A';
    case 'C': return 'G';
    case 'G': return 'C';
  }
}

export function isValidPair(base1: BaseType, base2: BaseType): boolean {
  return (base1 === 'A' && base2 === 'T') ||
         (base1 === 'T' && base2 === 'A') ||
         (base1 === 'C' && base2 === 'G') ||
         (base1 === 'G' && base2 === 'C');
}

export class DNAModel {
  public group: THREE.Group;
  private options: Required<DNAModelOptions>;
  private basePairs: BasePairData[] = [];
  private backboneSegments1: THREE.Mesh[] = [];
  private backboneSegments2: THREE.Mesh[] = [];
  private basePairMeshes: { group: THREE.Group; sphere1: THREE.Mesh; sphere2: THREE.Mesh; connector: THREE.Mesh | null; sphereSegments: number }[] = [];
  private pulseAnimations: { index: number; startTime: number; duration: number }[] = [];
  private haloMeshes: { mesh: THREE.Mesh; startTime: number; duration: number; position: THREE.Vector3 }[] = [];
  private camera: THREE.Camera | null = null;

  constructor(options: DNAModelOptions = {}) {
    this.options = {
      radius: 2,
      pitch: 3,
      basePairsPerTurn: 10,
      basePairCount: 10,
      sphereSegments: 32,
      ...options,
    };

    this.group = new THREE.Group();
    this.group.name = 'DNA_Model';
  }

  public setCamera(camera: THREE.Camera): void {
    this.camera = camera;
  }

  public build(sequence: BaseType[]): void {
    this.clear();

    this.basePairs = sequence.map((base1) => {
      const base2 = getComplementaryBase(base1);
      return {
        base1,
        base2,
        isMismatch: false,
      };
    });

    this.createBackbone();
    this.createBasePairs();
  }

  public rebuild(sequence: BaseType[]): void {
    this.build(sequence);
  }

  public rebuildWithPairs(pairs: { base1: BaseType; base2: BaseType }[]): void {
    this.clear();

    this.basePairs = pairs.map(({ base1, base2 }) => ({
      base1,
      base2,
      isMismatch: !isValidPair(base1, base2),
    }));

    this.createBackbone();
    this.createBasePairs();
  }

  private clear(): void {
    while (this.group.children.length > 0) {
      const child = this.group.children[0];
      this.group.remove(child);
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        if (Array.isArray(child.material)) {
          child.material.forEach((m) => m.dispose());
        } else {
          child.material.dispose();
        }
      }
    }

    this.backboneSegments1 = [];
    this.backboneSegments2 = [];
    this.basePairMeshes = [];
    this.pulseAnimations = [];
    this.haloMeshes = [];
    this.basePairs = [];
  }

  private createBackbone(): void {
    const count = this.basePairs.length;
    const angleStep = (2 * Math.PI) / this.options.basePairsPerTurn;
    const yStep = this.options.pitch / this.options.basePairsPerTurn;
    const radius = this.options.radius;
    const cylinderRadius = 0.12;

    const material1 = new THREE.MeshStandardMaterial({
      color: BACKBONE_COLOR_1,
      metalness: 0.3,
      roughness: 0.4,
    });

    const material2 = new THREE.MeshStandardMaterial({
      color: BACKBONE_COLOR_2,
      metalness: 0.3,
      roughness: 0.4,
    });

    const getPos = (i: number, strandOffset: number): THREE.Vector3 => {
      const angle = i * angleStep + strandOffset;
      const y = i * yStep - (count - 1) * yStep / 2;
      return new THREE.Vector3(
        Math.cos(angle) * radius,
        y,
        Math.sin(angle) * radius
      );
    };

    for (let i = 0; i < count - 1; i++) {
      const start1 = getPos(i, 0);
      const end1 = getPos(i + 1, 0);
      const start2 = getPos(i, Math.PI);
      const end2 = getPos(i + 1, Math.PI);

      const length1 = start1.distanceTo(end1);
      const geometry1 = new THREE.CylinderGeometry(cylinderRadius, cylinderRadius, length1, 12);
      const segment1 = new THREE.Mesh(geometry1, material1);
      const mid1 = start1.clone().add(end1).multiplyScalar(0.5);
      segment1.position.copy(mid1);
      segment1.quaternion.setFromUnitVectors(
        new THREE.Vector3(0, 1, 0),
        end1.clone().sub(start1).normalize()
      );
      this.group.add(segment1);
      this.backboneSegments1.push(segment1);

      const length2 = start2.distanceTo(end2);
      const geometry2 = new THREE.CylinderGeometry(cylinderRadius, cylinderRadius, length2, 12);
      const segment2 = new THREE.Mesh(geometry2, material2);
      const mid2 = start2.clone().add(end2).multiplyScalar(0.5);
      segment2.position.copy(mid2);
      segment2.quaternion.setFromUnitVectors(
        new THREE.Vector3(0, 1, 0),
        end2.clone().sub(start2).normalize()
      );
      this.group.add(segment2);
      this.backboneSegments2.push(segment2);
    }

    for (let strandOffset of [0, Math.PI]) {
      for (let i = 0; i < count; i++) {
        const pos = getPos(i, strandOffset);
        const sphereGeo = new THREE.SphereGeometry(cylinderRadius * 1.1, 12, 12);
        const material = strandOffset === 0 ? material1 : material2;
        const sphere = new THREE.Mesh(sphereGeo, material);
        sphere.position.copy(pos);
        this.group.add(sphere);
        if (strandOffset === 0) {
          this.backboneSegments1.push(sphere);
        } else {
          this.backboneSegments2.push(sphere);
        }
      }
    }
  }

  private createBasePairs(): void {
    const count = this.basePairs.length;
    const angleStep = (2 * Math.PI) / this.options.basePairsPerTurn;
    const yStep = this.options.pitch / this.options.basePairsPerTurn;
    const radius = this.options.radius;
    const sphereRadius = 0.22;

    for (let i = 0; i < count; i++) {
      const pair = this.basePairs[i];
      const angle = i * angleStep;
      const y = i * yStep - (count - 1) * yStep / 2;

      const x1 = Math.cos(angle) * radius;
      const z1 = Math.sin(angle) * radius;

      const x2 = Math.cos(angle + Math.PI) * radius;
      const z2 = Math.sin(angle + Math.PI) * radius;

      const pairGroup = new THREE.Group();
      pairGroup.name = `basePair_${i}`;

      const segments = this.getSphereSegmentsForIndex(i);

      const sphereGeo1 = new THREE.SphereGeometry(sphereRadius, segments, segments);
      const sphereGeo2 = new THREE.SphereGeometry(sphereRadius, segments, segments);

      let color1 = BASE_COLORS[pair.base1];
      let color2 = BASE_COLORS[pair.base2];

      if (pair.isMismatch) {
        color1 = MISMATCH_COLOR;
        color2 = MISMATCH_COLOR;
      }

      const material1 = new THREE.MeshStandardMaterial({
        color: color1,
        metalness: 0.2,
        roughness: 0.3,
        wireframe: pair.isMismatch,
      });

      const material2 = new THREE.MeshStandardMaterial({
        color: color2,
        metalness: 0.2,
        roughness: 0.3,
        wireframe: pair.isMismatch,
      });

      const sphere1 = new THREE.Mesh(sphereGeo1, material1);
      sphere1.position.set(x1, y, z1);

      const sphere2 = new THREE.Mesh(sphereGeo2, material2);
      sphere2.position.set(x2, y, z2);

      let connector: THREE.Mesh | null = null;
      if (pair.isMismatch) {
        const connectorGeo = new THREE.CylinderGeometry(0.03, 0.03, radius * 2 - sphereRadius * 2, 8);
        const connectorMat = new THREE.MeshBasicMaterial({
          color: 0x888888,
          wireframe: true,
          transparent: true,
          opacity: 0.6,
        });
        connector = new THREE.Mesh(connectorGeo, connectorMat);
        connector.position.set(0, y, 0);
        connector.rotation.z = Math.PI / 2;
        connector.rotation.y = angle;
      }

      pairGroup.add(sphere1);
      pairGroup.add(sphere2);
      if (connector) pairGroup.add(connector);

      this.group.add(pairGroup);

      this.basePairMeshes.push({
        group: pairGroup,
        sphere1,
        sphere2,
        connector,
        sphereSegments: segments,
      });
    }
  }

  private getSphereSegmentsForIndex(index: number): number {
    if (this.basePairs.length <= 20) {
      return this.options.sphereSegments;
    }

    if (!this.camera) {
      return this.options.sphereSegments;
    }

    const pair = this.basePairMeshes[index];
    if (!pair) return this.options.sphereSegments;

    const distance = this.camera.position.distanceTo(pair.sphere1.position);
    return distance > 8 ? 16 : 32;
  }

  public updateLOD(): void {
    if (this.basePairs.length <= 20 || !this.camera) return;

    for (let i = 0; i < this.basePairMeshes.length; i++) {
      const pair = this.basePairMeshes[i];
      const segments = this.getSphereSegmentsForIndex(i);

      if (pair.sphereSegments !== segments) {
        const sphereRadius = 0.22;
        const newGeo1 = new THREE.SphereGeometry(sphereRadius, segments, segments);
        const newGeo2 = new THREE.SphereGeometry(sphereRadius, segments, segments);

        pair.sphere1.geometry.dispose();
        pair.sphere2.geometry.dispose();

        pair.sphere1.geometry = newGeo1;
        pair.sphere2.geometry = newGeo2;
        pair.sphereSegments = segments;
      }
    }
  }

  public triggerPulseAnimation(index: number): void {
    this.pulseAnimations.push({
      index,
      startTime: performance.now(),
      duration: 500,
    });

    const pair = this.basePairMeshes[index];
    if (pair) {
      const haloGeo = new THREE.RingGeometry(0.1, 0.15, 32);
      const haloMat = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.8,
        side: THREE.DoubleSide,
      });
      const halo = new THREE.Mesh(haloGeo, haloMat);
      const pos = new THREE.Vector3();
      pair.sphere1.getWorldPosition(pos);
      pos.lerp(pair.sphere2.position, 0.5);
      halo.position.copy(pos);
      halo.lookAt(this.camera?.position || new THREE.Vector3(0, 0, 10));
      this.group.add(halo);

      this.haloMeshes.push({
        mesh: halo,
        startTime: performance.now(),
        duration: 800,
        position: pos.clone(),
      });
    }
  }

  public update(deltaTime: number): void {
    const now = performance.now();

    for (let i = this.pulseAnimations.length - 1; i >= 0; i--) {
      const anim = this.pulseAnimations[i];
      const elapsed = now - anim.startTime;
      const progress = elapsed / anim.duration;

      if (progress >= 1) {
        const pair = this.basePairMeshes[anim.index];
        if (pair) {
          pair.sphere1.scale.set(1, 1, 1);
          pair.sphere2.scale.set(1, 1, 1);
        }
        this.pulseAnimations.splice(i, 1);
      } else {
        const pulseScale = 1 + 0.5 * Math.sin(progress * Math.PI);
        const pair = this.basePairMeshes[anim.index];
        if (pair) {
          pair.sphere1.scale.set(pulseScale, pulseScale, pulseScale);
          pair.sphere2.scale.set(pulseScale, pulseScale, pulseScale);
        }
      }
    }

    for (let i = this.haloMeshes.length - 1; i >= 0; i--) {
      const halo = this.haloMeshes[i];
      const elapsed = now - halo.startTime;
      const progress = elapsed / halo.duration;

      if (progress >= 1) {
        halo.mesh.geometry.dispose();
        (halo.mesh.material as THREE.Material).dispose();
        this.group.remove(halo.mesh);
        this.haloMeshes.splice(i, 1);
      } else {
        const scale = 0.5 + progress * 3;
        halo.mesh.scale.set(scale, scale, scale);
        const material = halo.mesh.material as THREE.MeshBasicMaterial;
        material.opacity = 0.8 * (1 - progress);
        if (this.camera) {
          halo.mesh.lookAt(this.camera.position);
        }
      }
    }
  }

  public getBasePairCount(): number {
    return this.basePairs.length;
  }

  public getBasePairs(): BasePairData[] {
    return [...this.basePairs];
  }
}
