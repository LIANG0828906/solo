import * as THREE from 'three';

export class DynamicSun {
  public light: THREE.DirectionalLight;
  public visualMesh: THREE.Mesh;
  public ambient: THREE.AmbientLight;

  private scene: THREE.Scene;
  private sunY: number = 30;
  private sunRadius: number = 80;
  private currentAngle: number = 0;
  private targetAngle: number = 0;
  private targetX: number = 0;

  constructor(scene: THREE.Scene) {
    this.scene = scene;

    this.ambient = new THREE.AmbientLight(0x6b8cc9, 0.45);
    scene.add(this.ambient);

    this.light = new THREE.DirectionalLight(0xfff5d6, 1.2);
    this.light.castShadow = true;
    this.light.shadow.mapSize.width = 2048;
    this.light.shadow.mapSize.height = 2048;
    this.light.shadow.camera.near = 0.5;
    this.light.shadow.camera.far = 500;
    this.light.shadow.camera.left = -150;
    this.light.shadow.camera.right = 150;
    this.light.shadow.camera.top = 150;
    this.light.shadow.camera.bottom = -150;
    this.light.shadow.bias = -0.0005;
    scene.add(this.light);
    scene.add(this.light.target);

    const sunGeo = new THREE.SphereGeometry(3.5, 32, 32);
    const sunMat = new THREE.MeshBasicMaterial({
      color: 0xffdd88
    });
    this.visualMesh = new THREE.Mesh(sunGeo, sunMat);
    scene.add(this.visualMesh);

    const glowGeo = new THREE.SphereGeometry(5.5, 32, 32);
    const glowMat = new THREE.MeshBasicMaterial({
      color: 0xffcc66,
      transparent: true,
      opacity: 0.35,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    const glowMesh = new THREE.Mesh(glowGeo, glowMat);
    this.visualMesh.add(glowMesh);

    this.setAngleByMouseX(0.25);
    this.currentAngle = this.targetAngle;
    this.updateSunPosition();
  }

  public setAngleByMouseX(normalizedX: number): void {
    const clamped = Math.max(0, Math.min(1, normalizedX));
    this.targetX = clamped;
    this.targetAngle = clamped * Math.PI * 2;
  }

  public getDirection(): THREE.Vector3 {
    return this.light.position.clone().normalize();
  }

  private updateSunPosition(): void {
    const angle = this.currentAngle;
    const radius = this.sunRadius;
    const sunY = this.sunY;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    this.visualMesh.position.set(x, sunY, z);
    this.light.position.copy(this.visualMesh.position);
    this.light.target.position.set(0, 0, 0);
    this.light.target.updateMatrixWorld();
  }

  public update(_delta: number): void {
    const diff = this.targetAngle - this.currentAngle;
    this.currentAngle += diff * 0.08;
    this.updateSunPosition();
    const nightFactor = Math.max(0, Math.sin(this.targetX * Math.PI));
    this.light.intensity = 0.7 + nightFactor * 0.6;
    this.ambient.intensity = 0.3 + nightFactor * 0.25;
    void _delta;
  }

  public dispose(): void {
    this.visualMesh.geometry.dispose();
    (this.visualMesh.material as THREE.Material).dispose();
  }
}
