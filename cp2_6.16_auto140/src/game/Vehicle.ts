import * as THREE from 'three';
import { clamp, lerp, computeAABB, getRoadWorldWidth } from '../utils/helpers';
import type { InputState } from './InputHandler';
import type { AABB } from '../types';

export class Vehicle {
  public mesh: THREE.Group;
  public position: THREE.Vector3;
  public rotation: THREE.Euler;
  public rollAngle = 0;
  public targetRollAngle = 0;
  public shieldMesh?: THREE.Mesh;
  private halfRoadWidth = getRoadWorldWidth() / 2 - 1.5;

  constructor() {
    this.position = new THREE.Vector3(0, 0.8, 0);
    this.rotation = new THREE.Euler(0, 0, 0);
    this.mesh = this.createTruck();
    this.mesh.position.copy(this.position);
  }

  private createTruck(): THREE.Group {
    const group = new THREE.Group();

    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x1e60c4,
      metalness: 0.4,
      roughness: 0.5,
    });
    const darkMat = new THREE.MeshStandardMaterial({
      color: 0x15151f,
      metalness: 0.6,
      roughness: 0.4,
    });
    const stripeMat = new THREE.MeshStandardMaterial({
      color: 0xffcc00,
      emissive: 0xffaa00,
      emissiveIntensity: 0.3,
    });
    const glassMat = new THREE.MeshStandardMaterial({
      color: 0x88ccff,
      metalness: 0.9,
      roughness: 0.1,
      transparent: true,
      opacity: 0.7,
    });

    const cab = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.8, 2.4), bodyMat);
    cab.position.set(0, 1.1, 1.2);
    group.add(cab);

    const windshield = new THREE.Mesh(new THREE.BoxGeometry(2.0, 1.0, 0.1), glassMat);
    windshield.position.set(0, 1.5, 2.4);
    group.add(windshield);

    const trailer = new THREE.Mesh(new THREE.BoxGeometry(2.4, 2.0, 5.0), bodyMat);
    trailer.position.set(0, 1.2, -2.5);
    group.add(trailer);

    const stripe1 = new THREE.Mesh(new THREE.BoxGeometry(2.42, 0.25, 5.02), stripeMat);
    stripe1.position.set(0, 1.2, -2.5);
    group.add(stripe1);

    const stripe2 = new THREE.Mesh(new THREE.BoxGeometry(2.42, 0.25, 5.02), stripeMat);
    stripe2.position.set(0, 2.0, -2.5);
    group.add(stripe2);

    const wheelGeo = new THREE.CylinderGeometry(0.5, 0.5, 0.35, 16);
    wheelGeo.rotateZ(Math.PI / 2);
    const wheelPositions = [
      [-1.1, 0.5, 2.0],
      [1.1, 0.5, 2.0],
      [-1.1, 0.5, -0.5],
      [1.1, 0.5, -0.5],
      [-1.1, 0.5, -4.5],
      [1.1, 0.5, -4.5],
    ];
    wheelPositions.forEach((pos) => {
      const wheel = new THREE.Mesh(wheelGeo, darkMat);
      wheel.position.set(pos[0], pos[1], pos[2]);
      group.add(wheel);
    });

    const shieldGeo = new THREE.SphereGeometry(3.5, 16, 16);
    const shieldMat = new THREE.MeshBasicMaterial({
      color: 0x3a86ff,
      transparent: true,
      opacity: 0.25,
      side: THREE.DoubleSide,
    });
    const shield = new THREE.Mesh(shieldGeo, shieldMat);
    shield.visible = false;
    shield.position.y = 1.5;
    group.add(shield);
    this.shieldMesh = shield;

    return group;
  }

  public update(input: InputState, delta: number, currentSpeed: number): void {
    const turnSpeed = 1.8;
    const brakeFactor = 0.4;
    const accelFactor = 1.2;

    if (input.left) {
      this.position.x -= turnSpeed * delta * (currentSpeed / 30);
      this.targetRollAngle = 0.25;
    } else if (input.right) {
      this.position.x += turnSpeed * delta * (currentSpeed / 30);
      this.targetRollAngle = -0.25;
    } else {
      this.targetRollAngle = 0;
    }

    this.rollAngle = lerp(this.rollAngle, this.targetRollAngle, delta * 8);
    this.mesh.rotation.z = this.rollAngle;

    let speedMult = 1;
    if (input.up) speedMult = accelFactor;
    if (input.down) speedMult = -brakeFactor;

    this.position.x = clamp(this.position.x, -this.halfRoadWidth, this.halfRoadWidth);
    this.mesh.position.copy(this.position);
    this.mesh.position.y = 0.8 + Math.sin(Date.now() * 0.003) * 0.02;

    this.mesh.rotation.y = -this.position.x * 0.02;
  }

  public setShieldVisible(visible: boolean): void {
    if (this.shieldMesh) {
      this.shieldMesh.visible = visible;
    }
  }

  public getAABB(): AABB {
    return computeAABB(this.position, 2.6, 8);
  }

  public reset(): void {
    this.position.set(0, 0.8, 0);
    this.rollAngle = 0;
    this.targetRollAngle = 0;
    this.mesh.position.copy(this.position);
    this.mesh.rotation.set(0, 0, 0);
  }
}
