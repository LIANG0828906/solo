import * as THREE from 'three';

export interface SunConfig {
  azimuth: number;
  altitude: number;
  intensity: number;
}

export class SunSimulator {
  private scene: THREE.Scene;
  private config: SunConfig;
  private directionalLight: THREE.DirectionalLight;
  private ambientLight: THREE.AmbientLight;
  private sunHelper?: THREE.Mesh;

  constructor(scene: THREE.Scene, config: SunConfig) {
    this.scene = scene;
    this.config = { ...config };

    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
    this.scene.add(this.ambientLight);

    this.directionalLight = new THREE.DirectionalLight(0xffffff, config.intensity);
    this.directionalLight.castShadow = true;
    this.directionalLight.shadow.mapSize.width = 2048;
    this.directionalLight.shadow.mapSize.height = 2048;
    this.directionalLight.shadow.camera.near = 0.5;
    this.directionalLight.shadow.camera.far = 200;
    this.directionalLight.shadow.camera.left = -50;
    this.directionalLight.shadow.camera.right = 50;
    this.directionalLight.shadow.camera.top = 50;
    this.directionalLight.shadow.camera.bottom = -50;
    this.directionalLight.shadow.bias = -0.0005;
    this.directionalLight.shadow.normalBias = 0.02;

    this.scene.add(this.directionalLight);
    this.scene.add(this.directionalLight.target);

    this.updateSunPosition();
  }

  setAzimuth(degrees: number): void {
    this.config.azimuth = degrees;
    this.updateSunPosition();
  }

  setAltitude(degrees: number): void {
    this.config.altitude = degrees;
    this.updateSunPosition();
  }

  setIntensity(intensity: number): void {
    this.config.intensity = intensity;
    this.directionalLight.intensity = intensity;
  }

  private updateSunPosition(): void {
    const azimuthRad = THREE.MathUtils.degToRad(this.config.azimuth);
    const altitudeRad = THREE.MathUtils.degToRad(this.config.altitude);

    const distance = 100;

    const x = distance * Math.cos(altitudeRad) * Math.sin(azimuthRad);
    const y = distance * Math.sin(altitudeRad);
    const z = distance * Math.cos(altitudeRad) * Math.cos(azimuthRad);

    this.directionalLight.position.set(x, y, z);
    this.directionalLight.target.position.set(0, 0, 0);
    this.directionalLight.target.updateMatrixWorld();

    this.directionalLight.shadow.camera.updateProjectionMatrix();
  }

  getLight(): THREE.DirectionalLight {
    return this.directionalLight;
  }

  getAmbientLight(): THREE.AmbientLight {
    return this.ambientLight;
  }

  update(): void {
  }

  dispose(): void {
    this.scene.remove(this.directionalLight);
    this.scene.remove(this.directionalLight.target);
    this.scene.remove(this.ambientLight);

    this.directionalLight.dispose();
    this.ambientLight.dispose();

    if (this.sunHelper) {
      this.sunHelper.geometry.dispose();
      (this.sunHelper.material as THREE.Material).dispose();
    }
  }
}
