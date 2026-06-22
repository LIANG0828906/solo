import * as THREE from 'three';

export class GravityNode {
  private position: THREE.Vector3;
  private mesh: THREE.Mesh;
  private glowMesh: THREE.Mesh;
  private scene: THREE.Scene;
  private time: number = 0;
  private influenceRadius: number = 5;
  private pulseSpeed: number = Math.PI;

  constructor(position: THREE.Vector3, scene: THREE.Scene) {
    this.position = position.clone();
    this.scene = scene;

    const wireGeo = new THREE.SphereGeometry(0.5, 16, 12);
    const wireMat = new THREE.MeshBasicMaterial({
      color: 0xffd700,
      wireframe: true,
      transparent: true,
      opacity: 0.8
    });
    this.mesh = new THREE.Mesh(wireGeo, wireMat);
    this.mesh.position.copy(this.position);
    scene.add(this.mesh);

    const glowGeo = new THREE.SphereGeometry(0.7, 16, 12);
    const glowMat = new THREE.MeshBasicMaterial({
      color: 0xffd700,
      transparent: true,
      opacity: 0.6,
      side: THREE.BackSide
    });
    this.glowMesh = new THREE.Mesh(glowGeo, glowMat);
    this.glowMesh.position.copy(this.position);
    scene.add(this.glowMesh);
  }

  update(deltaTime: number): void {
    this.time += deltaTime;
    const pulse = 0.6 + 0.4 * (0.5 + 0.5 * Math.sin(this.time * this.pulseSpeed));
    const glowScale = 1.0 + 0.3 * Math.sin(this.time * this.pulseSpeed);
    this.glowMesh.material.opacity = pulse;
    this.glowMesh.scale.setScalar(glowScale);
  }

  getPosition(): THREE.Vector3 {
    return this.position;
  }

  getInfluenceRadius(): number {
    return this.influenceRadius;
  }

  dispose(): void {
    this.scene.remove(this.mesh);
    this.scene.remove(this.glowMesh);
    this.mesh.geometry.dispose();
    (this.mesh.material as THREE.Material).dispose();
    this.glowMesh.geometry.dispose();
    (this.glowMesh.material as THREE.Material).dispose();
  }
}
