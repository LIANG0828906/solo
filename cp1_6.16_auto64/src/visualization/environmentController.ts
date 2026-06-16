import * as THREE from 'three';

export class EnvironmentController {
  private scene: THREE.Scene;
  private ambientLight: THREE.AmbientLight;
  private directionalLight: THREE.DirectionalLight;
  private targetLightIntensity: number;
  private targetLightAngle: number;
  private currentLightIntensity: number;
  private currentLightAngle: number;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.targetLightIntensity = 1.0;
    this.currentLightIntensity = 1.0;
    this.targetLightAngle = 45;
    this.currentLightAngle = 45;

    this.ambientLight = new THREE.AmbientLight(0x404050, 0.4);
    this.scene.add(this.ambientLight);

    this.directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
    this.directionalLight.position.set(50, 100, 50);
    this.directionalLight.castShadow = true;
    this.directionalLight.shadow.mapSize.width = 2048;
    this.directionalLight.shadow.mapSize.height = 2048;
    this.directionalLight.shadow.camera.near = 0.5;
    this.directionalLight.shadow.camera.far = 500;
    this.directionalLight.shadow.camera.left = -100;
    this.directionalLight.shadow.camera.right = 100;
    this.directionalLight.shadow.camera.top = 100;
    this.directionalLight.shadow.camera.bottom = -100;
    this.scene.add(this.directionalLight);

    this.scene.fog = new THREE.FogExp2(0x1a1a2e, 0.003);
  }

  setLightIntensity(intensity: number): void {
    this.targetLightIntensity = intensity;
    this.targetLightAngle = 20 + (1.5 - intensity) * 70;
  }

  update(deltaTime: number): void {
    const lerpFactor = Math.min(1, deltaTime * 2);

    this.currentLightIntensity += (this.targetLightIntensity - this.currentLightIntensity) * lerpFactor;
    this.currentLightAngle += (this.targetLightAngle - this.currentLightAngle) * lerpFactor;

    this.directionalLight.intensity = this.currentLightIntensity * 1.2;
    this.ambientLight.intensity = 0.2 + this.currentLightIntensity * 0.3;

    const angleRad = (this.currentLightAngle * Math.PI) / 180;
    const distance = 150;
    this.directionalLight.position.set(
      Math.cos(angleRad) * distance,
      Math.sin(angleRad) * distance,
      50
    );

    const fogDensity = 0.002 + (1.5 - this.currentLightIntensity) * 0.002;
    if (this.scene.fog instanceof THREE.FogExp2) {
      this.scene.fog.density = fogDensity;
    }
  }

  getDirectionalLight(): THREE.DirectionalLight {
    return this.directionalLight;
  }

  getAmbientLight(): THREE.AmbientLight {
    return this.ambientLight;
  }
}
