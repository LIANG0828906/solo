import * as THREE from 'three';
import { LeatherMaterialConfig, LEATHER_BOUNDS } from '@/types';

export class LeatherModel {
  private geometry: THREE.PlaneGeometry;
  private material: THREE.MeshStandardMaterial;
  private mesh: THREE.Mesh;
  private wireframe: THREE.LineSegments;
  private texture: THREE.CanvasTexture | null = null;
  private normalMap: THREE.CanvasTexture | null = null;

  constructor(materialConfig: LeatherMaterialConfig) {
    this.geometry = new THREE.PlaneGeometry(
      LEATHER_BOUNDS.width,
      LEATHER_BOUNDS.height,
      64,
      48
    );

    this.addSurfaceVariation();

    this.material = new THREE.MeshStandardMaterial({
      color: new THREE.Color(materialConfig.baseColor),
      roughness: materialConfig.roughness,
      metalness: materialConfig.metalness,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.95,
    });

    this.mesh = new THREE.Mesh(this.geometry, this.material);
    this.mesh.rotation.x = -Math.PI / 2;
    this.mesh.receiveShadow = true;

    const wireGeo = new THREE.WireframeGeometry(this.geometry);
    this.wireframe = new THREE.LineSegments(wireGeo, new THREE.LineBasicMaterial({
      color: 0xd2b48c,
      transparent: true,
      opacity: 0.08,
    }));
    this.wireframe.rotation.x = -Math.PI / 2;
  }

  private addSurfaceVariation(): void {
    const positions = this.geometry.attributes.position;
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      const y = positions.getY(i);
      const noise = Math.sin(x * 3) * Math.cos(y * 2) * 0.015
        + Math.sin(x * 7 + y * 5) * 0.005;
      positions.setZ(i, noise);
    }
    positions.needsUpdate = true;
    this.geometry.computeVertexNormals();
  }

  loadTextures(colorTex: THREE.CanvasTexture, normalTex: THREE.CanvasTexture): void {
    this.texture = colorTex;
    this.normalMap = normalTex;
    this.material.map = colorTex;
    this.material.normalMap = normalTex;
    this.material.normalScale = new THREE.Vector2(0.3, 0.3);
    this.material.needsUpdate = true;
  }

  getMesh(): THREE.Mesh {
    return this.mesh;
  }

  getWireframe(): THREE.LineSegments {
    return this.wireframe;
  }

  updateMaterial(config: LeatherMaterialConfig): void {
    this.material.color.set(config.baseColor);
    this.material.roughness = config.roughness;
    this.material.metalness = config.metalness;
    if (this.normalMap) {
      this.material.normalScale.set(config.normalScale, config.normalScale);
    }
    this.material.needsUpdate = true;
  }

  setUnusedOverlay(piecePositions: Array<{ x: number; y: number; width: number; height: number; scale: number }>): void {
    this.material.color.set(0x8b5e3c);
  }

  dispose(): void {
    this.geometry.dispose();
    this.material.dispose();
    if (this.texture) this.texture.dispose();
    if (this.normalMap) this.normalMap.dispose();
    this.wireframe.geometry.dispose();
    (this.wireframe.material as THREE.Material).dispose();
  }
}

export function createLeatherMaterial(): LeatherMaterialConfig {
  return {
    baseColor: '#8b5e3c',
    secondaryColor: '#d2b48c',
    roughness: 0.85,
    metalness: 0.02,
    normalScale: 0.3,
  };
}
