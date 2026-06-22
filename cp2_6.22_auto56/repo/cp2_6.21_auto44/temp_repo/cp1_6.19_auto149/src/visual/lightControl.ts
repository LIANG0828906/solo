import * as THREE from 'three';

export class LightControl {
  private scene: THREE.Scene;
  private sunLight: THREE.PointLight;
  private spotLight: THREE.SpotLight;
  private ambientLight: THREE.AmbientLight;
  private sunHelper: THREE.Mesh;

  constructor(scene: THREE.Scene) {
    this.scene = scene;

    this.ambientLight = new THREE.AmbientLight(0x404040, 0.4);
    this.scene.add(this.ambientLight);

    this.sunLight = new THREE.PointLight(0xffffff, 1, 200, 1);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.set(1024, 1024);
    this.sunLight.shadow.camera.near = 0.5;
    this.sunLight.shadow.camera.far = 200;
    this.sunLight.shadow.bias = -0.0001;
    this.scene.add(this.sunLight);

    this.spotLight = new THREE.SpotLight(0xffffff, 0.5, 100, Math.PI / 6, 0.3, 1);
    this.spotLight.castShadow = true;
    this.spotLight.shadow.mapSize.set(1024, 1024);
    this.spotLight.shadow.camera.near = 0.5;
    this.spotLight.shadow.camera.far = 100;
    this.scene.add(this.spotLight);
    this.scene.add(this.spotLight.target);

    const sunGeo = new THREE.SphereGeometry(0.5, 16, 16);
    const sunMat = new THREE.MeshBasicMaterial({ color: 0xffff00 });
    this.sunHelper = new THREE.Mesh(sunGeo, sunMat);
    this.scene.add(this.sunHelper);

    this.setSunAngle(45, 60);
  }

  public setSunAngle(horizontalDeg: number, verticalDeg: number): void {
    const horizontalRad = (horizontalDeg * Math.PI) / 180;
    const verticalRad = (verticalDeg * Math.PI) / 180;
    const radius = 50;

    const x = radius * Math.cos(verticalRad) * Math.cos(horizontalRad);
    const y = radius * Math.sin(verticalRad);
    const z = radius * Math.cos(verticalRad) * Math.sin(horizontalRad);

    this.sunLight.position.set(x, y, z);
    this.spotLight.position.set(x * 0.8, y * 0.6, z * 0.8);
    this.spotLight.target.position.set(0, 1, 0);
    this.sunHelper.position.set(x, y, z);
  }

  public setLightIntensity(intensity: number): void {
    const normalized = intensity / 100;
    this.sunLight.intensity = 0.2 + normalized * 1.8;
    this.spotLight.intensity = 0.1 + normalized * 0.8;
    this.ambientLight.intensity = 0.15 + normalized * 0.35;
    this.sunHelper.visible = intensity > 10;
  }

  public setLightColor(color: string): void {
    const c = new THREE.Color(color);
    this.sunLight.color.copy(c);
    this.spotLight.color.copy(c);
    const mat = this.sunHelper.material as THREE.MeshBasicMaterial;
    mat.color.copy(c).lerp(new THREE.Color(0xffff00), 0.3);
  }
}
