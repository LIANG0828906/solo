import * as THREE from 'three';

export class Lighting {
  private ambientLight: THREE.AmbientLight | null = null;
  private pointLight1: THREE.PointLight | null = null;
  private pointLight2: THREE.PointLight | null = null;
  private ambientOn: boolean = true;
  private pointOn: boolean = true;

  public setup(scene: THREE.Scene): void {
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(this.ambientLight);

    this.pointLight1 = new THREE.PointLight(0xffffff, 1, 100);
    this.pointLight1.position.set(5, 5, 5);
    this.pointLight1.castShadow = true;
    this.pointLight1.shadow.mapSize.width = 2048;
    this.pointLight1.shadow.mapSize.height = 2048;
    scene.add(this.pointLight1);

    this.pointLight2 = new THREE.PointLight(0x8b5cf6, 0.8, 100);
    this.pointLight2.position.set(-5, 3, -5);
    scene.add(this.pointLight2);
  }

  public update(ambientOn: boolean, pointOn: boolean): void {
    this.ambientOn = ambientOn;
    this.pointOn = pointOn;

    if (this.ambientLight) {
      this.ambientLight.visible = ambientOn;
    }
    if (this.pointLight1 && this.pointLight2) {
      this.pointLight1.visible = pointOn;
      this.pointLight2.visible = pointOn;
    }
  }

  public animate(time: number): void {
    if (this.pointLight1 && this.pointOn) {
      this.pointLight1.position.x = Math.cos(time * 0.5) * 5;
      this.pointLight1.position.z = Math.sin(time * 0.5) * 5;
    }
    if (this.pointLight2 && this.pointOn) {
      this.pointLight2.position.x = Math.cos(time * 0.3 + Math.PI) * 5;
      this.pointLight2.position.z = Math.sin(time * 0.3 + Math.PI) * 5;
    }
  }

  public dispose(): void {
    if (this.ambientLight) this.ambientLight.dispose();
    if (this.pointLight1) this.pointLight1.dispose();
    if (this.pointLight2) this.pointLight2.dispose();
  }
}
