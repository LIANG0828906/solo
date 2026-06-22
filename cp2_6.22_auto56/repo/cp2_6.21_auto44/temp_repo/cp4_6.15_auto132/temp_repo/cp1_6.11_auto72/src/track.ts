import * as THREE from 'three';

const NEON_COLORS = [0xFF00FF, 0x00FFFF, 0xFFFF00];
const SEGMENT_LENGTH = 20;
const INITIAL_ROAD_WIDTH = 10;
const MIN_ROAD_WIDTH = 6;

export interface TrackSegment {
  mesh: THREE.Mesh;
  leftNeon: THREE.Mesh;
  rightNeon: THREE.Mesh;
  startZ: number;
  endZ: number;
  curveOffset: number;
  obstacles: THREE.Mesh[];
  energyOrbs: THREE.Mesh[];
}

export class TrackManager {
  private scene: THREE.Scene;
  private segments: TrackSegment[] = [];
  private obstacles: THREE.Mesh[] = [];
  private energyOrbs: THREE.Mesh[] = [];
  private currentZ = 0;
  private score = 0;
  private maxSegments = 40;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.init();
  }

  private init() {
    for (let i = 0; i < this.maxSegments; i++) {
      this.generateSegment();
    }
  }

  private getRoadWidth(): number {
    const widthReduction = Math.min(4, this.score / 2000 * 4);
    return INITIAL_ROAD_WIDTH - widthReduction;
  }

  private getObstacleDensity(): number {
    return Math.min(0.8, 0.2 + this.score / 5000 * 0.6);
  }

  private getCurveFrequency(): number {
    return Math.min(0.6, 0.1 + this.score / 4000 * 0.5);
  }

  private generateSegment() {
    const roadWidth = this.getRoadWidth();
    const isCurve = Math.random() < this.getCurveFrequency();
    const curveOffset = isCurve ? (Math.random() - 0.5) * 8 : 0;

    const roadGeometry = new THREE.PlaneGeometry(roadWidth, SEGMENT_LENGTH, 1, 1);
    const roadMaterial = new THREE.MeshStandardMaterial({
      color: 0x2A2A3A,
      metalness: 0.8,
      roughness: 0.2,
      emissive: 0x1A1A2A,
      emissiveIntensity: 0.3
    });

    const segmentCenterZ = this.currentZ - SEGMENT_LENGTH / 2;
    const segmentBackZ = this.currentZ;
    const segmentFrontZ = this.currentZ - SEGMENT_LENGTH;

    const road = new THREE.Mesh(roadGeometry, roadMaterial);
    road.rotation.x = -Math.PI / 2;
    road.position.set(0, 0, segmentCenterZ);
    this.scene.add(road);

    const neonColor = NEON_COLORS[Math.floor(Math.random() * NEON_COLORS.length)];
    const neonGeometry = new THREE.BoxGeometry(0.15, 0.25, SEGMENT_LENGTH);
    const neonMaterial = new THREE.MeshStandardMaterial({
      color: neonColor,
      emissive: neonColor,
      emissiveIntensity: 1.2,
      metalness: 0.5,
      roughness: 0.3
    });

    const leftNeon = new THREE.Mesh(neonGeometry, neonMaterial.clone());
    leftNeon.position.set(-roadWidth / 2, 0.1, segmentCenterZ);
    this.scene.add(leftNeon);

    const rightNeon = new THREE.Mesh(neonGeometry, neonMaterial.clone());
    rightNeon.position.set(roadWidth / 2, 0.1, segmentCenterZ);
    this.scene.add(rightNeon);

    const segment: TrackSegment = {
      mesh: road,
      leftNeon,
      rightNeon,
      startZ: segmentFrontZ,
      endZ: segmentBackZ,
      curveOffset,
      obstacles: [],
      energyOrbs: []
    };

    const numObstacles = Math.floor(Math.random() * 3 * this.getObstacleDensity()) + 1;
    for (let i = 0; i < numObstacles; i++) {
      const obstacle = this.createObstacle();
      const zPos = segmentFrontZ + 2 + Math.random() * (SEGMENT_LENGTH - 4);
      const xPos = (Math.random() - 0.5) * (roadWidth - 2);
      obstacle.position.set(xPos, 0.5, zPos);
      this.scene.add(obstacle);
      this.obstacles.push(obstacle);
      segment.obstacles.push(obstacle);
    }

    if (Math.random() < 0.4) {
      const orb = this.createEnergyOrb();
      const zPos = segmentFrontZ + 2 + Math.random() * (SEGMENT_LENGTH - 4);
      const xPos = (Math.random() - 0.5) * (roadWidth - 2);
      orb.position.set(xPos, 1.5, zPos);
      this.scene.add(orb);
      this.energyOrbs.push(orb);
      segment.energyOrbs.push(orb);
    }

    this.segments.push(segment);
    this.currentZ -= SEGMENT_LENGTH;
  }

  private createObstacle(): THREE.Mesh {
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshStandardMaterial({
      color: 0xFF3333,
      emissive: 0xFF0000,
      emissiveIntensity: 0.8,
      metalness: 0.5,
      roughness: 0.3
    });
    return new THREE.Mesh(geometry, material);
  }

  private createEnergyOrb(): THREE.Mesh {
    const geometry = new THREE.SphereGeometry(0.3, 16, 16);
    const material = new THREE.MeshStandardMaterial({
      color: 0xFFD700,
      emissive: 0xFFD700,
      emissiveIntensity: 0.8,
      metalness: 0.9,
      roughness: 0.1
    });
    return new THREE.Mesh(geometry, material);
  }

  update(deltaTime: number, playerSpeed: number, playerZ: number, score: number) {
    this.score = score;

    const moveDistance = playerSpeed * deltaTime;

    for (const segment of this.segments) {
      segment.mesh.position.z += moveDistance;
      segment.leftNeon.position.z += moveDistance;
      segment.rightNeon.position.z += moveDistance;

      for (const obstacle of segment.obstacles) {
        obstacle.position.z += moveDistance;
        obstacle.rotation.x += deltaTime * (30 * Math.PI / 180);
        obstacle.rotation.y += deltaTime * (30 * Math.PI / 180);
      }

      for (const orb of segment.energyOrbs) {
        orb.position.z += moveDistance;
        const pulse = 1 + Math.sin(Date.now() * 0.005) * 0.2;
        orb.scale.setScalar(pulse);
      }
    }

    while (this.segments.length > 0 && this.segments[0].mesh.position.z > playerZ + 50) {
      this.removeSegment(this.segments[0]);
      this.segments.shift();
    }

    while (this.segments.length < this.maxSegments) {
      const lastSegment = this.segments[this.segments.length - 1];
      this.currentZ = lastSegment ? lastSegment.mesh.position.z - SEGMENT_LENGTH / 2 : 0;
      this.generateSegment();
    }
  }

  private removeSegment(segment: TrackSegment) {
    this.scene.remove(segment.mesh);
    this.scene.remove(segment.leftNeon);
    this.scene.remove(segment.rightNeon);
    segment.mesh.geometry.dispose();
    (segment.mesh.material as THREE.Material).dispose();
    segment.leftNeon.geometry.dispose();
    (segment.leftNeon.material as THREE.Material).dispose();
    segment.rightNeon.geometry.dispose();
    (segment.rightNeon.material as THREE.Material).dispose();

    for (const obstacle of segment.obstacles) {
      this.scene.remove(obstacle);
      obstacle.geometry.dispose();
      (obstacle.material as THREE.Material).dispose();
      const idx = this.obstacles.indexOf(obstacle);
      if (idx > -1) this.obstacles.splice(idx, 1);
    }

    for (const orb of segment.energyOrbs) {
      this.scene.remove(orb);
      orb.geometry.dispose();
      (orb.material as THREE.Material).dispose();
      const idx = this.energyOrbs.indexOf(orb);
      if (idx > -1) this.energyOrbs.splice(idx, 1);
    }
  }

  checkObstacleCollision(playerPos: THREE.Vector3, playerRadius: number = 0.8): THREE.Mesh | null {
    for (const obstacle of this.obstacles) {
      const dx = playerPos.x - obstacle.position.x;
      const dz = playerPos.z - obstacle.position.z;
      const dy = playerPos.y - obstacle.position.y;
      
      if (Math.abs(dy) < 1.5) {
        const distance = Math.sqrt(dx * dx + dz * dz);
        if (distance < playerRadius + 0.5) {
          return obstacle;
        }
      }
    }
    return null;
  }

  checkEnergyOrbCollision(playerPos: THREE.Vector3, playerRadius: number = 1): THREE.Mesh | null {
    for (let i = this.energyOrbs.length - 1; i >= 0; i--) {
      const orb = this.energyOrbs[i];
      const distance = playerPos.distanceTo(orb.position);
      if (distance < playerRadius + 0.5) {
        this.removeEnergyOrb(orb);
        return orb;
      }
    }
    return null;
  }

  private removeEnergyOrb(orb: THREE.Mesh) {
    this.scene.remove(orb);
    orb.geometry.dispose();
    (orb.material as THREE.Material).dispose();
    const idx = this.energyOrbs.indexOf(orb);
    if (idx > -1) this.energyOrbs.splice(idx, 1);

    for (const segment of this.segments) {
      const segIdx = segment.energyOrbs.indexOf(orb);
      if (segIdx > -1) {
        segment.energyOrbs.splice(segIdx, 1);
        break;
      }
    }
  }

  removeObstacle(obstacle: THREE.Mesh) {
    this.scene.remove(obstacle);
    obstacle.geometry.dispose();
    (obstacle.material as THREE.Material).dispose();
    const idx = this.obstacles.indexOf(obstacle);
    if (idx > -1) this.obstacles.splice(idx, 1);

    for (const segment of this.segments) {
      const segIdx = segment.obstacles.indexOf(obstacle);
      if (segIdx > -1) {
        segment.obstacles.splice(segIdx, 1);
        break;
      }
    }
  }

  getRoadWidthAt(z: number): number {
    return this.getRoadWidth();
  }

  reset() {
    while (this.segments.length > 0) {
      this.removeSegment(this.segments[0]);
      this.segments.shift();
    }
    this.obstacles = [];
    this.energyOrbs = [];
    this.currentZ = 0;
    this.score = 0;
    this.init();
  }

  getObstacles(): THREE.Mesh[] {
    return this.obstacles;
  }

  getEnergyOrbs(): THREE.Mesh[] {
    return this.energyOrbs;
  }
}
