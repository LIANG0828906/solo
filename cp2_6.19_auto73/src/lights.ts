import * as THREE from 'three';

export class LightManager {
  private scene: THREE.Scene;
  public directionalLight!: THREE.DirectionalLight;
  private ambientLight!: THREE.AmbientLight;
  private hemisphereLight!: THREE.HemisphereLight;
  private sunMesh!: THREE.Mesh;
  private sunGlow!: THREE.Mesh;

  private readonly sunOrbitRadius: number = 80;
  private readonly centerOffset: number = 0;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.createSunVisual();
    this.initLights();
  }

  private initLights(): void {
    this.ambientLight = new THREE.AmbientLight(0x404060, 0.4);
    this.scene.add(this.ambientLight);

    this.hemisphereLight = new THREE.HemisphereLight(0x87ceeb, 0x362d26, 0.4);
    this.scene.add(this.hemisphereLight);

    this.directionalLight = new THREE.DirectionalLight(0xffffff, 1.2);
    this.directionalLight.castShadow = true;
    this.directionalLight.shadow.mapSize.set(2048, 2048);
    this.directionalLight.shadow.camera.near = 0.5;
    this.directionalLight.shadow.camera.far = 200;
    this.directionalLight.shadow.camera.left = -60;
    this.directionalLight.shadow.camera.right = 60;
    this.directionalLight.shadow.camera.top = 60;
    this.directionalLight.shadow.camera.bottom = -60;
    this.directionalLight.shadow.bias = -0.0005;
    this.directionalLight.shadow.normalBias = 0.02;
    this.directionalLight.shadow.radius = 4;
    this.directionalLight.shadow.blurSamples = 8;

    this.scene.add(this.directionalLight);
    this.scene.add(this.directionalLight.target);

    this.updateSunPosition(12);
  }

  private createSunVisual(): void {
    const sunGeometry = new THREE.SphereGeometry(2.5, 32, 32);
    const sunMaterial = new THREE.MeshBasicMaterial({
      color: 0xffdd00,
    });
    this.sunMesh = new THREE.Mesh(sunGeometry, sunMaterial);
    this.scene.add(this.sunMesh);

    const glowGeometry = new THREE.SphereGeometry(5, 32, 32);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: 0xffaa00,
      transparent: true,
      opacity: 0.3,
    });
    this.sunGlow = new THREE.Mesh(glowGeometry, glowMaterial);
    this.scene.add(this.sunGlow);
  }

  public updateSunPosition(hours: number): void {
    const t = (hours - 6) / 12;
    const clampedT = Math.max(0, Math.min(1, t));
    const angle = Math.PI * clampedT;

    const x = this.sunOrbitRadius * Math.cos(angle) + this.centerOffset;
    const y = this.sunOrbitRadius * Math.sin(angle);
    const z = this.centerOffset;

    this.directionalLight.position.set(x, y, z);
    this.directionalLight.target.position.set(this.centerOffset, 0, this.centerOffset);
    this.directionalLight.target.updateMatrixWorld();

    this.sunMesh.position.set(x, y, z);
    this.sunGlow.position.set(x, y, z);

    this.updateLightingByTime(hours, clampedT);
  }

  private updateLightingByTime(hours: number, t: number): void {
    const sunHeight = Math.sin(Math.PI * t);
    const intensity = 0.3 + sunHeight * 0.9;
    this.directionalLight.intensity = intensity;

    let sunColor: THREE.Color;
    if (hours < 8) {
      sunColor = new THREE.Color(0xff8844).lerp(new THREE.Color(0xffdd88), (hours - 6) / 2);
    } else if (hours < 16) {
      sunColor = new THREE.Color(0xffdd88).lerp(new THREE.Color(0xffffff), Math.min(1, (hours - 8) / 4));
      sunColor.lerp(new THREE.Color(0xffdd88), Math.max(0, (hours - 12) / 4));
    } else {
      sunColor = new THREE.Color(0xffdd88).lerp(new THREE.Color(0xff6644), (hours - 16) / 2);
    }
    this.directionalLight.color.copy(sunColor);

    (this.sunMesh.material as THREE.MeshBasicMaterial).color.copy(sunColor);
    (this.sunGlow.material as THREE.MeshBasicMaterial).color.copy(sunColor);
    (this.sunGlow.material as THREE.MeshBasicMaterial).opacity = 0.2 + sunHeight * 0.3;

    const ambientIntensity = 0.2 + sunHeight * 0.35;
    this.ambientLight.intensity = ambientIntensity;
    this.hemisphereLight.intensity = 0.2 + sunHeight * 0.4;

    const skyColor = this.getSkyColor(hours, sunHeight);
    this.hemisphereLight.color.copy(skyColor);
  }

  private getSkyColor(hours: number, sunHeight: number): THREE.Color {
    if (hours < 7 || hours > 17) {
      return new THREE.Color(0xff7744);
    } else if (hours < 9 || hours > 15) {
      return new THREE.Color(0xffaa66);
    } else {
      return new THREE.Color(0x87ceeb);
    }
  }

  public getDirectionalLight(): THREE.DirectionalLight {
    return this.directionalLight;
  }
}
