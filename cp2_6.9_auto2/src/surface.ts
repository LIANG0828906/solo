import * as THREE from 'three';

export interface SurfaceVertex {
  position: THREE.Vector3;
  normal: THREE.Vector3;
  u: number;
  v: number;
  originalPosition: THREE.Vector3;
  deformedPosition: THREE.Vector3;
}

export class TopologicalSurface {
  private mesh!: THREE.LineSegments;
  private geometry: THREE.BufferGeometry;
  private vertices: SurfaceVertex[] = [];
  private originalVertices: SurfaceVertex[] = [];
  private readonly samples: number = 360;
  private readonly width: number = 0.6;
  private readonly radius: number = 2.0;
  private readonly vSegments: number = 3;
  private twistFactor: number = 0;
  private targetTwistFactor: number = 0;
  private morphProgress: number = 1;
  private morphDuration: number = 5;
  private isMorphing: boolean = false;
  private deformationOffsets: Map<number, THREE.Vector3> = new Map();
  private controlPoint: THREE.Mesh | null = null;
  private controlPointPosition: THREE.Vector3 = new THREE.Vector3();
  private isDragging: boolean = false;
  private recoveryStartTime: number = 0;
  private isRecovering: boolean = false;
  private basePositions: Float32Array | null = null;

  constructor(scene: THREE.Scene) {
    this.geometry = new THREE.BufferGeometry();
    this.createSurface();
    this.setupMesh(scene);
    this.createControlPoint(scene);
  }

  private createSurface(): void {
    this.vertices = [];
    this.originalVertices = [];

    for (let i = 0; i < this.samples; i++) {
      const u = (i / this.samples) * Math.PI * 2;
      for (let j = 0; j <= this.vSegments; j++) {
        const v = (j / this.vSegments - 0.5) * this.width;
        const vertex = this.calculateMobiusVertex(u, v);
        this.vertices.push(vertex);
        this.originalVertices.push({
          ...vertex,
          position: vertex.position.clone(),
          originalPosition: vertex.originalPosition.clone(),
          deformedPosition: vertex.deformedPosition.clone(),
          normal: vertex.normal.clone()
        });
      }
    }

    this.updateGeometry();
    this.storeBasePositions();
  }

  private storeBasePositions(): void {
    const positions = this.geometry.attributes.position.array as Float32Array;
    this.basePositions = new Float32Array(positions.length);
    this.basePositions.set(positions);
  }

  private calculateMobiusVertex(u: number, v: number): SurfaceVertex {
    const halfTwist = u / 2;
    const cosU = Math.cos(u);
    const sinU = Math.sin(u);
    const cosHalf = Math.cos(halfTwist);
    const sinHalf = Math.sin(halfTwist);

    const x = (this.radius + v * cosHalf) * cosU;
    const y = v * sinHalf;
    const z = (this.radius + v * cosHalf) * sinU;

    const position = new THREE.Vector3(x, y, z);
    
    const tangentU = this.calculateMobiusTangentU(u, v);
    const tangentV = this.calculateMobiusTangentV(u, v);
    const normal = new THREE.Vector3().crossVectors(tangentU, tangentV).normalize();

    return {
      position,
      normal,
      u,
      v,
      originalPosition: position.clone(),
      deformedPosition: position.clone()
    };
  }

  private calculateMobiusTangentU(u: number, v: number): THREE.Vector3 {
    const halfTwist = u / 2;
    const cosU = Math.cos(u);
    const sinU = Math.sin(u);
    const cosHalf = Math.cos(halfTwist);
    const sinHalf = Math.sin(halfTwist);

    const dx = -this.radius * sinU - v * (sinHalf * cosU * 0.5 + cosHalf * sinU);
    const dy = v * cosHalf * 0.5;
    const dz = this.radius * cosU + v * (cosHalf * cosU * 0.5 - sinHalf * sinU);

    return new THREE.Vector3(dx, dy, dz).normalize();
  }

  private calculateMobiusTangentV(u: number, v: number): THREE.Vector3 {
    const halfTwist = u / 2;
    const cosU = Math.cos(u);
    const sinU = Math.sin(u);
    const cosHalf = Math.cos(halfTwist);
    const sinHalf = Math.sin(halfTwist);

    const dx = cosHalf * cosU;
    const dy = sinHalf;
    const dz = cosHalf * sinU;

    return new THREE.Vector3(dx, dy, dz).normalize();
  }

  private calculateKleinVertex(u: number, v: number): SurfaceVertex {
    const a = this.radius;
    const b = this.width * 1.5;
    const c = 0.5;

    const cosU = Math.cos(u);
    const sinU = Math.sin(u);
    const cosV = Math.cos(v);
    const sinV = Math.sin(v);

    let x: number, y: number, z: number;

    if (u < Math.PI) {
      x = a * cosU * (1 + sinU) + c * a * cosU * cosV;
      z = b * sinU + c * a * sinU * cosV;
      y = c * a * sinV;
    } else {
      x = a * cosU * (1 + sinU) - c * a * cosU * cosV;
      z = b * sinU;
      y = c * a * sinV;
    }

    const position = new THREE.Vector3(x * 0.8, y * 0.8, z * 0.8);
    const normal = this.calculateKleinNormal(u, v);

    return {
      position,
      normal,
      u,
      v,
      originalPosition: position.clone(),
      deformedPosition: position.clone()
    };
  }

  private calculateKleinNormal(u: number, v: number): THREE.Vector3 {
    const eps = 0.001;
    const v1 = this.calculateKleinVertex(u + eps, v).position;
    const v2 = this.calculateKleinVertex(u - eps, v).position;
    const v3 = this.calculateKleinVertex(u, v + eps).position;
    const v4 = this.calculateKleinVertex(u, v - eps).position;

    const tangentU = new THREE.Vector3().subVectors(v1, v2).normalize();
    const tangentV = new THREE.Vector3().subVectors(v3, v4).normalize();

    return new THREE.Vector3().crossVectors(tangentU, tangentV).normalize();
  }

  private updateGeometry(): void {
    const positions: number[] = [];
    const colors: number[] = [];

    const colorStart = new THREE.Color('#6a0dad');
    const colorEnd = new THREE.Color('#00bfff');

    for (let i = 0; i < this.samples; i++) {
      const nextI = (i + 1) % this.samples;
      const t = i / this.samples;
      const color = colorStart.clone().lerp(colorEnd, t);

      for (let j = 0; j < this.vSegments; j++) {
        const idx1 = i * (this.vSegments + 1) + j;
        const idx2 = i * (this.vSegments + 1) + j + 1;
        const idx3 = nextI * (this.vSegments + 1) + j;
        const idx4 = nextI * (this.vSegments + 1) + j + 1;

        positions.push(
          this.vertices[idx1].deformedPosition.x,
          this.vertices[idx1].deformedPosition.y,
          this.vertices[idx1].deformedPosition.z,
          this.vertices[idx2].deformedPosition.x,
          this.vertices[idx2].deformedPosition.y,
          this.vertices[idx2].deformedPosition.z
        );

        positions.push(
          this.vertices[idx1].deformedPosition.x,
          this.vertices[idx1].deformedPosition.y,
          this.vertices[idx1].deformedPosition.z,
          this.vertices[idx3].deformedPosition.x,
          this.vertices[idx3].deformedPosition.y,
          this.vertices[idx3].deformedPosition.z
        );

        for (let k = 0; k < 6; k++) {
          colors.push(color.r, color.g, color.b);
        }
      }
    }

    this.geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    this.geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    this.geometry.computeVertexNormals();
  }

  private setupMesh(scene: THREE.Scene): void {
    const material = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.6,
      linewidth: 0.5
    });

    this.mesh = new THREE.LineSegments(this.geometry, material);
    scene.add(this.mesh);
  }

  private createControlPoint(scene: THREE.Scene): void {
    const geometry = new THREE.SphereGeometry(0.3, 32, 32);
    const material = new THREE.MeshBasicMaterial({
      color: 0xffff00,
      transparent: true,
      opacity: 0.9
    });

    this.controlPoint = new THREE.Mesh(geometry, material);
    this.controlPointPosition.set(this.radius + this.width * 0.5, 0, 0);
    this.controlPoint.position.copy(this.controlPointPosition);

    const glowGeometry = new THREE.SphereGeometry(0.4, 32, 32);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: 0xffff00,
      transparent: true,
      opacity: 0.3,
      side: THREE.BackSide
    });

    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    glow.name = 'glow';
    this.controlPoint.add(glow);

    scene.add(this.controlPoint);
  }

  public setTwistFactor(target: number): void {
    if (Math.abs(target - this.targetTwistFactor) > 0.01) {
      this.targetTwistFactor = target;
      this.isMorphing = true;
      this.morphProgress = 0;
    }
  }

  public update(deltaTime: number): void {
    if (this.isMorphing) {
      this.morphProgress += deltaTime / this.morphDuration;
      if (this.morphProgress >= 1) {
        this.morphProgress = 1;
        this.isMorphing = false;
      }
      this.twistFactor = this.targetTwistFactor;
      this.interpolateSurface();
    }

    if (this.isRecovering) {
      const recoveryProgress = Math.min((performance.now() - this.recoveryStartTime) / 1000, 1);
      const easeOut = 1 - Math.pow(1 - recoveryProgress, 3);
      this.recoverDeformation(easeOut);
      if (recoveryProgress >= 1) {
        this.isRecovering = false;
        this.deformationOffsets.clear();
      }
    }

    this.updateGeometry();
  }

  private interpolateSurface(): void {
    const t = this.morphProgress;

    for (let i = 0; i < this.samples; i++) {
      const u = (i / this.samples) * Math.PI * 2;
      for (let j = 0; j <= this.vSegments; j++) {
        const v = (j / this.vSegments - 0.5) * this.width;
        const mobiusVertex = this.originalVertices[i * (this.vSegments + 1) + j];
        const kleinVertex = this.calculateKleinVertex(u, v * 2);

        const twistAmount = Math.min(this.twistFactor / 3, 1);
        const morphT = t * twistAmount;

        const morphedPosition = mobiusVertex.originalPosition.clone().lerp(kleinVertex.position, morphT);
        const morphedNormal = mobiusVertex.normal.clone().lerp(kleinVertex.normal, morphT).normalize();

        const idx = i * (this.vSegments + 1) + j;
        this.vertices[idx].position.copy(morphedPosition);
        this.vertices[idx].normal.copy(morphedNormal);
        this.vertices[idx].deformedPosition.copy(morphedPosition);
      }
    }
  }

  public applyDeformation(worldPoint: THREE.Vector3, strength: number): void {
    this.controlPointPosition.copy(worldPoint);
    if (this.controlPoint) {
      this.controlPoint.position.copy(worldPoint);
      const glow = this.controlPoint.getObjectByName('glow') as THREE.Mesh;
      if (glow) {
        glow.scale.setScalar(2);
      }
    }

    const pullRadius = 0.8;

    for (let i = 0; i < this.vertices.length; i++) {
      const vertex = this.vertices[i];
      const distance = vertex.deformedPosition.distanceTo(worldPoint);

      if (distance < pullRadius) {
        const gaussianWeight = Math.exp(-(distance * distance) / (2 * pullRadius * pullRadius * 0.25));
        const displacement = strength * gaussianWeight;

        const direction = worldPoint.clone().sub(vertex.position).normalize();
        const offset = direction.multiplyScalar(displacement);

        if (!this.deformationOffsets.has(i)) {
          this.deformationOffsets.set(i, new THREE.Vector3());
        }
        this.deformationOffsets.get(i)!.copy(offset);
        vertex.deformedPosition.copy(vertex.position).add(offset);
      }
    }
  }

  private recoverDeformation(progress: number): void {
    for (let i = 0; i < this.vertices.length; i++) {
      const vertex = this.vertices[i];
      const offset = this.deformationOffsets.get(i);
      if (offset) {
        const currentOffset = offset.clone().multiplyScalar(1 - progress);
        vertex.deformedPosition.copy(vertex.position).add(currentOffset);
      }
    }
  }

  public startDragging(): void {
    this.isDragging = true;
    this.isRecovering = false;
  }

  public stopDragging(): void {
    this.isDragging = false;
    this.isRecovering = true;
    this.recoveryStartTime = performance.now();
    if (this.controlPoint) {
      const glow = this.controlPoint.getObjectByName('glow') as THREE.Mesh;
      if (glow) {
        glow.scale.setScalar(1);
      }
    }
  }

  public getDeformationEnergy(): number {
    let energy = 0;
    for (let i = 0; i < this.vertices.length; i++) {
      const offset = this.deformationOffsets.get(i);
      if (offset) {
        energy += offset.lengthSq();
      }
    }
    return energy;
  }

  public getTopologyType(): string {
    const twistAmount = Math.min(this.twistFactor / 3, 1);
    return twistAmount > 0.5 ? '克莱因瓶' : '莫比乌斯带';
  }

  public getVertices(): SurfaceVertex[] {
    return this.vertices;
  }

  public getMesh(): THREE.LineSegments {
    return this.mesh;
  }

  public getControlPoint(): THREE.Mesh | null {
    return this.controlPoint;
  }

  public getMorphProgress(): number {
    return this.morphProgress * Math.min(this.twistFactor / 3, 1);
  }

  public getTwistFactor(): number {
    return this.twistFactor;
  }

  public isCurrentlyMorphing(): boolean {
    return this.isMorphing;
  }

  public getClosestVertex(position: THREE.Vector3): SurfaceVertex | null {
    let closest: SurfaceVertex | null = null;
    let minDist = Infinity;

    for (const vertex of this.vertices) {
      const dist = vertex.deformedPosition.distanceTo(position);
      if (dist < minDist) {
        minDist = dist;
        closest = vertex;
      }
    }

    return closest;
  }

  public reset(): void {
    this.targetTwistFactor = 0;
    this.isMorphing = true;
    this.morphProgress = 0;
    this.deformationOffsets.clear();
  }

  public getVSegments(): number {
    return this.vSegments;
  }
}
