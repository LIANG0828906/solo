import * as THREE from 'three';
import { ClothVertex, Constraint } from '../types';

export class ClothSimulator {
  private widthSeg: number;
  private heightSeg: number;
  private size: number;
  private gravity: number = 0.98;
  private centrifugalForce: number = 0.3;
  private damping: number = 0.97;
  private timeStep: number = 1 / 60;

  public vertices: ClothVertex[][] = [];
  public constraints: Constraint[] = [];
  public isRotating: boolean = false;
  public rotationAngle: number = 0;
  public rotationSpeed: number = 0;

  constructor(widthSeg: number, heightSeg: number, size: number) {
    this.widthSeg = widthSeg;
    this.heightSeg = heightSeg;
    this.size = size;
    this.initVertices();
    this.initConstraints();
  }

  private initVertices(): void {
    const segWidth = this.size / this.widthSeg;
    const segHeight = this.size / this.heightSeg;

    for (let y = 0; y <= this.heightSeg; y++) {
      this.vertices[y] = [];
      for (let x = 0; x <= this.widthSeg; x++) {
        const px = x * segWidth - this.size / 2;
        const py = -y * segHeight + this.size / 2;
        const pz = 0;

        const position = new THREE.Vector3(px, py, pz);
        const previous = position.clone();
        const original = position.clone();
        const acceleration = new THREE.Vector3(0, 0, 0);
        const mass = 1;

        this.vertices[y][x] = {
          position,
          previous,
          original,
          acceleration,
          mass,
        };
      }
    }
  }

  private initConstraints(): void {
    for (let y = 0; y <= this.heightSeg; y++) {
      for (let x = 0; x <= this.widthSeg; x++) {
        if (x < this.widthSeg) {
          this.constraints.push({
            p1: this.vertices[y][x],
            p2: this.vertices[y][x + 1],
            restLength: this.vertices[y][x].position.distanceTo(
              this.vertices[y][x + 1].position
            ),
          });
        }
        if (y < this.heightSeg) {
          this.constraints.push({
            p1: this.vertices[y][x],
            p2: this.vertices[y + 1][x],
            restLength: this.vertices[y][x].position.distanceTo(
              this.vertices[y + 1][x].position
            ),
          });
        }
      }
    }
  }

  public update(deltaTime: number): void {
    const dt = Math.min(deltaTime, this.timeStep * 3);

    for (let y = 0; y <= this.heightSeg; y++) {
      for (let x = 0; x <= this.widthSeg; x++) {
        const vertex = this.vertices[y][x];
        
        if (y === 0) {
          vertex.acceleration.set(0, 0, 0);
          continue;
        }

        vertex.acceleration.set(0, -this.gravity, 0);

        if (this.isRotating) {
          const centrifugal = new THREE.Vector3(
            Math.sin(this.rotationAngle) * this.centrifugalForce,
            0,
            Math.cos(this.rotationAngle) * this.centrifugalForce
          );
          vertex.acceleration.add(centrifugal);
        }

        const velocity = vertex.position.clone().sub(vertex.previous);
        velocity.multiplyScalar(this.damping);

        const newPosition = vertex.position.clone()
          .add(velocity)
          .add(vertex.acceleration.multiplyScalar(dt * dt));

        vertex.previous.copy(vertex.position);
        vertex.position.copy(newPosition);
      }
    }

    if (this.isRotating) {
      this.rotationAngle += this.rotationSpeed * dt;
    }
  }

  public solveConstraints(iterations: number = 3): void {
    for (let i = 0; i < iterations; i++) {
      for (const constraint of this.constraints) {
        const diff = constraint.p2.position.clone().sub(constraint.p1.position);
        const currentLength = diff.length();
        
        if (currentLength === 0) continue;

        const correction = diff.multiplyScalar(
          1 - constraint.restLength / currentLength
        );
        const correctionHalf = correction.multiplyScalar(0.5);

        if (constraint.p1 !== this.vertices[0][0] && 
            constraint.p1 !== this.vertices[0][this.widthSeg]) {
          constraint.p1.position.add(correctionHalf);
        }
        if (constraint.p2 !== this.vertices[0][0] && 
            constraint.p2 !== this.vertices[0][this.widthSeg]) {
          constraint.p2.position.sub(correctionHalf);
        }
      }
    }
  }

  public getPositions(): Float32Array {
    const positions = new Float32Array((this.widthSeg + 1) * (this.heightSeg + 1) * 3);
    let index = 0;

    for (let y = 0; y <= this.heightSeg; y++) {
      for (let x = 0; x <= this.widthSeg; x++) {
        const vertex = this.vertices[y][x];
        positions[index++] = vertex.position.x;
        positions[index++] = vertex.position.y;
        positions[index++] = vertex.position.z;
      }
    }

    return positions;
  }

  public setRotating(rotating: boolean, speed: number = 2): void {
    this.isRotating = rotating;
    this.rotationSpeed = speed;
  }

  public reset(): void {
    for (let y = 0; y <= this.heightSeg; y++) {
      for (let x = 0; x <= this.widthSeg; x++) {
        const vertex = this.vertices[y][x];
        vertex.position.copy(vertex.original);
        vertex.previous.copy(vertex.original);
        vertex.acceleration.set(0, 0, 0);
      }
    }
    this.rotationAngle = 0;
    this.isRotating = false;
  }
}
