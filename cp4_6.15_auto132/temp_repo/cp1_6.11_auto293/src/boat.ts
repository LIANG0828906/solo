import * as THREE from 'three';

export interface BoatState {
  position: THREE.Vector3;
  rotation: THREE.Euler;
  draftDepth: number;
  rollAngle: number;
  gmHeight: number;
  floodPercentage: number;
  submergedVolume: number;
  stabilityLevel: 'safe' | 'warning' | 'danger' | 'sunk';
}

export interface BoatInput {
  cargoWeight: number;
  centerOffset: number;
}

const BOAT_PARAMS = {
  length: 20,
  width: 4,
  height: 3.5,
  hullHeight: 2.5,
  freeboardHeight: 20,
  maxRollAngle: 40,
  rollThreshold: 25,
  gmBase: 150,
  weightPerUnit: 0.005,
  maxWeight: 800
};

export class WuPengBoat {
  public group: THREE.Group;
  public state: BoatState;
  private hullMesh!: THREE.Mesh;
  private coverMesh!: THREE.Mesh;
  private deckMesh!: THREE.Mesh;
  private floodParticles: THREE.Points;
  private floodParticleCount: number = 200;
  private floodParticlePositions: Float32Array;
  private woodPlanks: THREE.Mesh[] = [];

  constructor() {
    this.group = new THREE.Group();
    this.state = {
      position: new THREE.Vector3(0, 0, 0),
      rotation: new THREE.Euler(0, 0, 0),
      draftDepth: 0,
      rollAngle: 0,
      gmHeight: BOAT_PARAMS.gmBase,
      floodPercentage: 0,
      submergedVolume: 0,
      stabilityLevel: 'safe'
    };

    this.floodParticlePositions = new Float32Array(this.floodParticleCount * 3);
    this.floodParticles = this.createFloodParticles();

    this.createBoatModel();
  }

  private createBoatModel(): void {
    this.hullMesh = this.createHull();
    this.coverMesh = this.createCover();
    this.deckMesh = this.createDeck();
    this.createWoodPlanks();
    this.createGuardRail();

    this.group.add(this.hullMesh);
    this.group.add(this.coverMesh);
    this.group.add(this.deckMesh);
    this.group.add(this.floodParticles);
    this.woodPlanks.forEach(plank => this.group.add(plank));
  }

  private createHull(): THREE.Mesh {
    const points: THREE.Vector2[] = [];
    const segments = 40;
    const length = BOAT_PARAMS.length;
    const width = BOAT_PARAMS.width;
    const height = BOAT_PARAMS.hullHeight;

    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const x = (t - 0.5) * length;
      const taperFactor = 1 - Math.pow(Math.abs(t - 0.5) * 2, 2);
      const w = width * (0.3 + 0.7 * taperFactor);
      const h = height * (0.2 + 0.8 * taperFactor);
      points.push(new THREE.Vector2(x, -h));
    }

    for (let i = segments; i >= 0; i--) {
      const t = i / segments;
      const x = (t - 0.5) * length;
      const taperFactor = 1 - Math.pow(Math.abs(t - 0.5) * 2, 2);
      const w = width * (0.3 + 0.7 * taperFactor);
      const h = height * (0.2 + 0.8 * taperFactor);
      points.push(new THREE.Vector2(x, h * 0.3));
    }

    const shape = new THREE.Shape(points);
    const geometry = new THREE.ExtrudeGeometry(shape, {
      steps: 1,
      depth: width,
      bevelEnabled: true,
      bevelThickness: 0.1,
      bevelSize: 0.2,
      bevelSegments: 3
    });

    geometry.center();
    geometry.rotateX(Math.PI / 2);
    geometry.rotateY(Math.PI / 2);
    geometry.scale(1, 1, 0.5);

    const material = new THREE.MeshStandardMaterial({
      color: 0x5D3A1A,
      roughness: 0.8,
      metalness: 0.1,
      side: THREE.DoubleSide
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    return mesh;
  }

  private createCover(): THREE.Mesh {
    const coverLength = BOAT_PARAMS.length * 0.5;
    const coverWidth = BOAT_PARAMS.width * 1.1;
    const coverHeight = 1.5;

    const geometry = new THREE.CylinderGeometry(
      coverWidth / 2,
      coverWidth / 2,
      coverLength,
      32,
      1,
      true,
      0,
      Math.PI
    );

    geometry.rotateZ(Math.PI / 2);
    geometry.rotateX(Math.PI / 2);

    const material = new THREE.MeshStandardMaterial({
      color: 0x2C2C2C,
      roughness: 0.9,
      metalness: 0.0,
      side: THREE.DoubleSide
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.y = BOAT_PARAMS.hullHeight * 0.5;
    mesh.castShadow = true;

    return mesh;
  }

  private createDeck(): THREE.Mesh {
    const deckLength = BOAT_PARAMS.length * 0.9;
    const deckWidth = BOAT_PARAMS.width * 0.95;

    const shape = new THREE.Shape();
    const segments = 30;

    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const x = (t - 0.5) * deckLength;
      const taperFactor = 1 - Math.pow(Math.abs(t - 0.5) * 2, 2);
      const w = deckWidth * (0.25 + 0.75 * taperFactor);
      if (i === 0) {
        shape.moveTo(x, w);
      } else {
        shape.lineTo(x, w);
      }
    }

    for (let i = segments; i >= 0; i--) {
      const t = i / segments;
      const x = (t - 0.5) * deckLength;
      const taperFactor = 1 - Math.pow(Math.abs(t - 0.5) * 2, 2);
      const w = deckWidth * (0.25 + 0.75 * taperFactor);
      shape.lineTo(x, -w);
    }

    const geometry = new THREE.ExtrudeGeometry(shape, {
      steps: 1,
      depth: 0.15,
      bevelEnabled: false
    });

    geometry.rotateX(Math.PI / 2);
    geometry.center();

    const material = new THREE.MeshStandardMaterial({
      color: 0x5D3A1A,
      roughness: 0.7,
      metalness: 0.1
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.y = BOAT_PARAMS.hullHeight * 0.25;
    mesh.receiveShadow = true;

    return mesh;
  }

  private createWoodPlanks(): void {
    const plankCount = 12;
    const plankLength = BOAT_PARAMS.length * 0.9;

    for (let i = 0; i < plankCount; i++) {
      const t = i / (plankCount - 1);
      const yPos = -BOAT_PARAMS.hullHeight * 0.8 + t * BOAT_PARAMS.hullHeight * 1.6;
      
      const taperFactor = 1 - Math.pow(Math.abs(t - 0.5) * 2, 2);
      const plankWidth = 0.1 + 0.1 * taperFactor;

      const geometry = new THREE.BoxGeometry(plankLength * (0.3 + 0.7 * taperFactor), 0.05, plankWidth);
      const material = new THREE.MeshStandardMaterial({
        color: 0x3E2723,
        roughness: 0.9
      });

      const plank = new THREE.Mesh(geometry, material);
      plank.position.set(0, yPos, 0);
      plank.castShadow = true;
      this.woodPlanks.push(plank);
    }
  }

  private createGuardRail(): void {
    const railLength = BOAT_PARAMS.length * 0.85;
    const railHeight = 0.3;
    const railWidth = BOAT_PARAMS.width * 0.9;

    const railGeometry = new THREE.BoxGeometry(railLength, 0.1, 0.08);
    const postGeometry = new THREE.CylinderGeometry(0.04, 0.04, railHeight, 8);
    
    const material = new THREE.MeshStandardMaterial({
      color: 0xD4A76A,
      roughness: 0.6,
      metalness: 0.2
    });

    const leftRail = new THREE.Mesh(railGeometry, material);
    leftRail.position.set(0, BOAT_PARAMS.hullHeight * 0.5 + railHeight / 2, railWidth / 2);
    this.group.add(leftRail);

    const rightRail = new THREE.Mesh(railGeometry, material);
    rightRail.position.set(0, BOAT_PARAMS.hullHeight * 0.5 + railHeight / 2, -railWidth / 2);
    this.group.add(rightRail);

    const postCount = 8;
    for (let i = 0; i < postCount; i++) {
      const t = i / (postCount - 1);
      const x = (t - 0.5) * railLength;
      
      const leftPost = new THREE.Mesh(postGeometry, material);
      leftPost.position.set(x, BOAT_PARAMS.hullHeight * 0.5, railWidth / 2);
      this.group.add(leftPost);

      const rightPost = new THREE.Mesh(postGeometry, material);
      rightPost.position.set(x, BOAT_PARAMS.hullHeight * 0.5, -railWidth / 2);
      this.group.add(rightPost);
    }
  }

  private createFloodParticles(): THREE.Points {
    const geometry = new THREE.BufferGeometry();
    
    for (let i = 0; i < this.floodParticleCount; i++) {
      this.floodParticlePositions[i * 3] = (Math.random() - 0.5) * BOAT_PARAMS.length * 0.6;
      this.floodParticlePositions[i * 3 + 1] = -BOAT_PARAMS.hullHeight;
      this.floodParticlePositions[i * 3 + 2] = (Math.random() - 0.5) * BOAT_PARAMS.width * 0.6;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(this.floodParticlePositions, 3));

    const material = new THREE.PointsMaterial({
      color: 0x4A90D9,
      size: 0.15,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending
    });

    const points = new THREE.Points(geometry, material);
    points.visible = false;

    return points;
  }

  public update(input: BoatInput, deltaTime: number): void {
    const { cargoWeight, centerOffset } = input;
    const weightRatio = cargoWeight / BOAT_PARAMS.maxWeight;

    const targetDraft = weightRatio * BOAT_PARAMS.hullHeight * 1.5;
    this.state.draftDepth += (targetDraft - this.state.draftDepth) * Math.min(deltaTime * 3, 1);

    const targetRoll = Math.min(
      Math.max(centerOffset * 0.8, -BOAT_PARAMS.maxRollAngle),
      BOAT_PARAMS.maxRollAngle
    ) * Math.PI / 180;

    this.state.rollAngle += (targetRoll - this.state.rollAngle) * Math.min(deltaTime * 2, 1);
    this.state.gmHeight = BOAT_PARAMS.gmBase * (1 - weightRatio * 0.5) * Math.max(0, 1 - Math.abs(this.state.rollAngle) / 0.8);

    const rollDegrees = Math.abs(this.state.rollAngle) * 180 / Math.PI;
    const draftCm = this.state.draftDepth * 10;
    const floodThreshold = BOAT_PARAMS.freeboardHeight * 0.8;

    let floodRate = 0;
    if (rollDegrees > BOAT_PARAMS.rollThreshold) {
      floodRate += (rollDegrees - BOAT_PARAMS.rollThreshold) * 0.02;
    }
    if (draftCm > floodThreshold) {
      floodRate += (draftCm - floodThreshold) * 0.01;
    }

    if (this.state.floodPercentage < 100 && this.state.floodPercentage > 0) {
      if (floodRate === 0) {
        this.state.floodPercentage = Math.max(0, this.state.floodPercentage - deltaTime * 2);
      }
    }

    if (floodRate > 0 || this.state.floodPercentage > 0) {
      this.state.floodPercentage += floodRate * deltaTime;
      this.state.floodPercentage = Math.max(0, Math.min(100, this.state.floodPercentage));
      this.updateFloodParticles(deltaTime);
    }

    if (this.state.floodPercentage >= 100) {
      this.state.stabilityLevel = 'sunk';
    } else if (rollDegrees > BOAT_PARAMS.rollThreshold || draftCm > floodThreshold) {
      this.state.stabilityLevel = 'danger';
    } else if (rollDegrees > 15 || draftCm > floodThreshold * 0.7) {
      this.state.stabilityLevel = 'warning';
    } else {
      this.state.stabilityLevel = 'safe';
    }

    this.state.submergedVolume = this.state.draftDepth * BOAT_PARAMS.length * BOAT_PARAMS.width * 0.5;

    const sinkOffset = this.state.floodPercentage / 100 * BOAT_PARAMS.hullHeight * 3;
    const buoyancy = -this.state.draftDepth - sinkOffset;
    const roll = this.state.rollAngle * (1 + this.state.floodPercentage / 200);

    this.state.position.y = buoyancy;
    this.state.rotation.z = roll;

    this.group.position.copy(this.state.position);
    this.group.rotation.copy(this.state.rotation);
  }

  private updateFloodParticles(deltaTime: number): void {
    if (this.state.floodPercentage <= 0) {
      this.floodParticles.visible = false;
      return;
    }

    this.floodParticles.visible = true;
    const positions = this.floodParticles.geometry.attributes.position.array as Float32Array;
    const floodHeight = (this.state.floodPercentage / 100) * BOAT_PARAMS.hullHeight * 0.8;

    for (let i = 0; i < this.floodParticleCount; i++) {
      const idx = i * 3;
      
      positions[idx + 1] += deltaTime * (0.5 + Math.random() * 0.5);
      
      if (positions[idx + 1] > floodHeight) {
        positions[idx] = (Math.random() - 0.5) * BOAT_PARAMS.length * 0.6;
        positions[idx + 1] = -BOAT_PARAMS.hullHeight * 0.3 + (Math.random() - 0.5) * 0.5;
        positions[idx + 2] = (Math.random() - 0.5) * BOAT_PARAMS.width * 0.6;
      }
    }

    this.floodParticles.geometry.attributes.position.needsUpdate = true;
    (this.floodParticles.material as THREE.PointsMaterial).opacity = Math.min(0.8, this.state.floodPercentage / 100);
  }

  public getState(): BoatState {
    return { ...this.state };
  }

  public getWaterlineY(): number {
    return 0;
  }

  public getBowPosition(): THREE.Vector3 {
    return new THREE.Vector3(BOAT_PARAMS.length / 2, this.state.position.y, 0);
  }

  public getSternPosition(): THREE.Vector3 {
    return new THREE.Vector3(-BOAT_PARAMS.length / 2, this.state.position.y, 0);
  }
}
