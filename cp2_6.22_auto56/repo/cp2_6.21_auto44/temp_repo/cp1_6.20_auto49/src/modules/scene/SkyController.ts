import * as THREE from 'three';

export class SkyController {
  private ambientLight: THREE.AmbientLight;
  private directionalLight: THREE.DirectionalLight;
  private currentTime: number = 12;
  private scene: THREE.Scene;

  private readonly dayColor = new THREE.Color(0xfff4e6);
  private readonly nightColor = new THREE.Color(0x0a1628);
  private readonly noonColor = new THREE.Color(0xffffff);
  private readonly sunsetColor = new THREE.Color(0xff7f50);

  constructor(scene: THREE.Scene) {
    this.scene = scene;

    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(this.ambientLight);

    this.directionalLight = new THREE.DirectionalLight(0xffffff, 1);
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

    this.updateLights();
  }

  setTime(hour: number): void {
    this.currentTime = ((hour % 24) + 24) % 24;
    this.updateLights();
  }

  update(): number {
    this.currentTime = (this.currentTime + 0.01) % 24;
    this.updateLights();
    return this.currentTime;
  }

  getCurrentTime(): number {
    return this.currentTime;
  }

  private updateLights(): void {
    const t = this.currentTime;
    const intensity = this.calculateLightIntensity(t);
    const lightColor = this.calculateLightColor(t);
    const ambientIntensity = this.calculateAmbientIntensity(t);
    const ambientColor = this.calculateAmbientColor(t);

    this.directionalLight.intensity = intensity;
    this.directionalLight.color.copy(lightColor);
    this.ambientLight.intensity = ambientIntensity;
    this.ambientLight.color.copy(ambientColor);

    const sunPosition = this.getSunPosition(t);
    this.directionalLight.position.copy(sunPosition);
    this.directionalLight.target.position.set(0, 0, 0);
    this.directionalLight.target.updateMatrixWorld();
  }

  private calculateLightIntensity(hour: number): number {
    if (hour >= 6 && hour <= 18) {
      const normalized = (hour - 6) / 12;
      return 0.3 + Math.sin(normalized * Math.PI) * 0.9;
    } else {
      return 0.05;
    }
  }

  private calculateAmbientIntensity(hour: number): number {
    if (hour >= 6 && hour <= 18) {
      const normalized = (hour - 6) / 12;
      return 0.3 + Math.sin(normalized * Math.PI) * 0.4;
    } else {
      return 0.15;
    }
  }

  private calculateLightColor(hour: number): THREE.Color {
    if (hour >= 5 && hour < 7) {
      const t = (hour - 5) / 2;
      return this.nightColor.clone().lerp(this.sunsetColor, t);
    } else if (hour >= 7 && hour < 9) {
      const t = (hour - 7) / 2;
      return this.sunsetColor.clone().lerp(this.noonColor, t);
    } else if (hour >= 9 && hour < 17) {
      return this.noonColor.clone();
    } else if (hour >= 17 && hour < 19) {
      const t = (hour - 17) / 2;
      return this.noonColor.clone().lerp(this.sunsetColor, t);
    } else if (hour >= 19 && hour < 21) {
      const t = (hour - 19) / 2;
      return this.sunsetColor.clone().lerp(this.nightColor, t);
    } else {
      return this.nightColor.clone();
    }
  }

  private calculateAmbientColor(hour: number): THREE.Color {
    if (hour >= 6 && hour <= 18) {
      const normalized = (hour - 6) / 12;
      const dayFactor = Math.sin(normalized * Math.PI);
      return this.nightColor.clone().lerp(this.dayColor, dayFactor);
    } else {
      return this.nightColor.clone();
    }
  }

  getSunPosition(hour: number): THREE.Vector3 {
    const normalizedTime = ((hour - 6) / 24) * Math.PI * 2;
    const radius = 100;
    const heightFactor = Math.sin(normalizedTime);

    const x = Math.cos(normalizedTime) * radius;
    const y = Math.max(5, heightFactor * radius);
    const z = Math.sin(normalizedTime) * radius * 0.5;

    return new THREE.Vector3(x, y, z);
  }

  isNight(): boolean {
    return this.currentTime < 6 || this.currentTime > 19;
  }

  dispose(): void {
    this.scene.remove(this.ambientLight);
    this.scene.remove(this.directionalLight);
    this.ambientLight.dispose();
    this.directionalLight.dispose();
  }
}
