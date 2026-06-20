import * as THREE from 'three';
import type { RoadSegment } from '../types';
import { generateId, getRoadWorldWidth, randomRange } from '../utils/helpers';

const SEGMENT_LENGTH = 80;
const VISIBLE_SEGMENTS = 8;

export class RoadGenerator {
  private scene: THREE.Scene;
  private segments: RoadSegment[] = [];
  private grassMeshes: THREE.Mesh[] = [];
  private lineMeshes: THREE.Mesh[] = [];
  private roadWidth: number;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.roadWidth = getRoadWorldWidth();
  }

  public init(): void {
    for (let i = 0; i < VISIBLE_SEGMENTS; i++) {
      this.addSegment(i * SEGMENT_LENGTH - 50);
    }
  }

  private createRoadSegment(): THREE.Mesh {
    const geo = new THREE.BoxGeometry(this.roadWidth, 0.2, SEGMENT_LENGTH);
    const mat = new THREE.MeshStandardMaterial({
      color: 0x2a2a35,
      roughness: 0.9,
    });
    return new THREE.Mesh(geo, mat);
  }

  private createCenterLine(): THREE.Mesh {
    const geo = new THREE.BoxGeometry(0.2, 0.22, 6);
    const mat = new THREE.MeshStandardMaterial({
      color: 0xffdd33,
      emissive: 0xffaa00,
      emissiveIntensity: 0.2,
    });
    return new THREE.Mesh(geo, mat);
  }

  private createEdgeLine(side: number): THREE.Mesh {
    const geo = new THREE.BoxGeometry(0.15, 0.22, SEGMENT_LENGTH);
    const mat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0xffffff,
      emissiveIntensity: 0.15,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.x = side * (this.roadWidth / 2 - 0.3);
    return mesh;
  }

  private createGrass(): THREE.Mesh {
    const geo = new THREE.PlaneGeometry(300, SEGMENT_LENGTH);
    const mat = new THREE.MeshStandardMaterial({
      color: 0x3e6b3e,
      roughness: 1,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.y = -0.01;
    return mesh;
  }

  private addSegment(zPos: number): void {
    const segment: RoadSegment = {
      id: generateId(),
      position: new THREE.Vector3(0, 0, zPos),
      mesh: this.createRoadSegment(),
      length: SEGMENT_LENGTH,
      curve: randomRange(-0.1, 0.1),
      hasHill: Math.random() < 0.2,
    };
    segment.mesh.position.copy(segment.position);
    this.scene.add(segment.mesh);

    const leftEdge = this.createEdgeLine(-1);
    leftEdge.position.z = zPos;
    this.scene.add(leftEdge);
    this.lineMeshes.push(leftEdge);

    const rightEdge = this.createEdgeLine(1);
    rightEdge.position.z = zPos;
    this.scene.add(rightEdge);
    this.lineMeshes.push(rightEdge);

    for (let i = 0; i < 6; i++) {
      const centerLine = this.createCenterLine();
      centerLine.position.z = zPos - i * 13 + SEGMENT_LENGTH / 2 - 6;
      this.scene.add(centerLine);
      this.lineMeshes.push(centerLine);
    }

    const grass = this.createGrass();
    grass.position.z = zPos;
    this.scene.add(grass);
    this.grassMeshes.push(grass);

    this.segments.push(segment);
  }

  private removeFirstSegment(): void {
    const first = this.segments.shift();
    if (first) {
      this.scene.remove(first.mesh);
      (first.mesh.material as THREE.Material).dispose();
    }
    for (let i = 0; i < 8; i++) {
      const line = this.lineMeshes.shift();
      if (line) {
        this.scene.remove(line);
        (line.material as THREE.Material).dispose();
      }
    }
    const grass = this.grassMeshes.shift();
    if (grass) {
      this.scene.remove(grass);
      (grass.material as THREE.Material).dispose();
    }
  }

  public update(playerZ: number, speed: number, delta: number): void {
    for (const seg of this.segments) {
      seg.mesh.position.z += speed * delta;
    }
    for (const line of this.lineMeshes) {
      line.position.z += speed * delta;
    }
    for (const grass of this.grassMeshes) {
      grass.position.z += speed * delta;
    }

    if (this.segments.length > 0) {
      const firstSeg = this.segments[0];
      if (firstSeg.mesh.position.z > playerZ + 80) {
        this.removeFirstSegment();
      }
      const lastSeg = this.segments[this.segments.length - 1];
      if (lastSeg && lastSeg.mesh.position.z > playerZ - 600) {
        this.addSegment(lastSeg.mesh.position.z - SEGMENT_LENGTH);
      }
    }
  }

  public reset(): void {
    for (const seg of this.segments) {
      this.scene.remove(seg.mesh);
      (seg.mesh.material as THREE.Material).dispose();
    }
    for (const line of this.lineMeshes) {
      this.scene.remove(line);
      (line.material as THREE.Material).dispose();
    }
    for (const grass of this.grassMeshes) {
      this.scene.remove(grass);
      (grass.material as THREE.Material).dispose();
    }
    this.segments = [];
    this.lineMeshes = [];
    this.grassMeshes = [];
    this.init();
  }
}
