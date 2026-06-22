import * as THREE from 'three';
import { getSentimentColor } from './sentiment';
import type { SentimentType } from './sentiment';
import type { BubbleData } from './mockData';

export class Bubble {
  mesh: THREE.Mesh;
  glowMesh: THREE.Mesh;
  data: BubbleData;
  targetScale: number;
  currentScale: number = 0;
  isSpawned: boolean = false;
  spawnTime: number = 0;
  isSelected: boolean = false;
  pulsePhase: number = 0;
  rotationSpeed: number = 0;
  basePosition: THREE.Vector3;

  private static readonly SPAWN_DURATION = 1.0;
  private static readonly MIN_RADIUS = 0.5;
  private static readonly MAX_RADIUS = 1.5;

  constructor(data: BubbleData) {
    this.data = data;
    this.basePosition = new THREE.Vector3(data.position.x, data.position.y, data.position.z);

    const charCount = data.text.length;
    const radius = Math.min(
      Bubble.MAX_RADIUS,
      Math.max(Bubble.MIN_RADIUS, Bubble.MIN_RADIUS + charCount / 10 * 0.1)
    );
    this.targetScale = radius / Bubble.MIN_RADIUS;

    const color = getSentimentColor(data.sentiment);

    const geometry = new THREE.SphereGeometry(Bubble.MIN_RADIUS, 32, 32);
    const material = new THREE.MeshPhongMaterial({
      color,
      transparent: true,
      opacity: 0,
      shininess: 80,
      emissive: new THREE.Color(color),
      emissiveIntensity: 0.15,
    });
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.scale.set(0, 0, 0);
    this.mesh.position.copy(this.basePosition);
    this.mesh.userData = { bubbleId: data.id };

    const glowGeometry = new THREE.SphereGeometry(Bubble.MIN_RADIUS * 1.3, 32, 32);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0,
      side: THREE.BackSide,
    });
    this.glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
    this.glowMesh.position.copy(this.basePosition);
    this.glowMesh.scale.set(0, 0, 0);
  }

  spawn(currentTime: number) {
    this.isSpawned = true;
    this.spawnTime = currentTime;
  }

  update(deltaTime: number, currentTime: number) {
    if (!this.isSpawned) return;

    const elapsed = currentTime - this.spawnTime;
    const t = Math.min(1, elapsed / Bubble.SPAWN_DURATION);
    const eased = 1 - Math.pow(1 - t, 3);

    this.currentScale = eased * this.targetScale;
    const s = Math.max(0.001, this.currentScale);
    this.mesh.scale.set(s, s, s);
    this.glowMesh.scale.set(s, s, s);

    const mat = this.mesh.material as THREE.MeshPhongMaterial;
    mat.opacity = eased * 0.85;

    const glowMat = this.glowMesh.material as THREE.MeshBasicMaterial;
    glowMat.opacity = eased * 0.08;

    if (this.isSelected) {
      const selectScale = this.targetScale * 1.5;
      this.pulsePhase += deltaTime * (Math.PI * 2 / 1.5);
      const pulse = 1 + 0.15 * Math.sin(this.pulsePhase);
      const ps = Math.max(0.001, selectScale * pulse);
      this.mesh.scale.set(ps, ps, ps);

      this.rotationSpeed += deltaTime * (Math.PI * 2 / 3) * 0.3;
      this.mesh.rotation.y += this.rotationSpeed * deltaTime;
      this.glowMesh.rotation.y = this.mesh.rotation.y;

      const glowPulse = 1.8 + 0.3 * Math.sin(this.pulsePhase);
      const gs = Math.max(0.001, selectScale * glowPulse);
      this.glowMesh.scale.set(gs, gs, gs);
      glowMat.opacity = 0.3 * (0.5 + 0.5 * Math.sin(this.pulsePhase));
    } else {
      this.rotationSpeed *= 0.95;
      this.mesh.rotation.y += this.rotationSpeed * deltaTime;
      this.glowMesh.rotation.y = this.mesh.rotation.y;
    }

    this.glowMesh.position.copy(this.mesh.position);
  }

  select() {
    this.isSelected = true;
    this.pulsePhase = 0;
  }

  deselect() {
    this.isSelected = false;
    const s = Math.max(0.001, this.currentScale);
    this.mesh.scale.set(s, s, s);
    this.glowMesh.scale.set(s, s, s);
    this.rotationSpeed = 0;
  }

  getSentimentColor(): number {
    return getSentimentColor(this.data.sentiment);
  }

  dispose() {
    this.mesh.geometry.dispose();
    (this.mesh.material as THREE.Material).dispose();
    this.glowMesh.geometry.dispose();
    (this.glowMesh.material as THREE.Material).dispose();
  }
}
