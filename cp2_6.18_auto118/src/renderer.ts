import * as THREE from 'three';

export interface ColorPalette {
  top: THREE.Color;
  bottom: THREE.Color;
}

export const PALETTES: Record<string, ColorPalette> = {
  warm: {
    top: new THREE.Color(0xFF6B35),
    bottom: new THREE.Color(0xFFD93D)
  },
  cool: {
    top: new THREE.Color(0x4ECDC4),
    bottom: new THREE.Color(0xA855F7)
  }
};

export class ClothRenderer {
  private scene: THREE.Scene;
  private mesh: THREE.Mesh | null = null;
  private geometry: THREE.BufferGeometry | null = null;
  private material: THREE.MeshStandardMaterial | null = null;
  private segmentsX: number = 0;
  private segmentsY: number = 0;
  private currentPalette: ColorPalette = PALETTES.warm;
  private targetPalette: ColorPalette = PALETTES.warm;
  private transitionProgress: number = 1;
  private transitionDuration: number = 0.3;
  private time: number = 0;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  buildMesh(vertices: Float32Array, segmentsX: number, segmentsY: number): void {
    this.disposeMesh();

    this.segmentsX = segmentsX;
    this.segmentsY = segmentsY;

    this.geometry = new THREE.BufferGeometry();
    this.geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));

    const indices: number[] = [];
    const uvs: number[] = [];

    for (let y = 0; y <= segmentsY; y++) {
      for (let x = 0; x <= segmentsX; x++) {
        uvs.push(x / segmentsX, y / segmentsY);
      }
    }

    for (let y = 0; y < segmentsY; y++) {
      for (let x = 0; x < segmentsX; x++) {
        const a = y * (segmentsX + 1) + x;
        const b = a + 1;
        const c = a + segmentsX + 1;
        const d = c + 1;

        indices.push(a, c, b);
        indices.push(b, c, d);
      }
    }

    this.geometry.setIndex(indices);
    this.geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    this.geometry.computeVertexNormals();

    const colors = this.generateVertexColors(this.currentPalette);
    this.geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    this.material = new THREE.MeshStandardMaterial({
      vertexColors: true,
      side: THREE.DoubleSide,
      roughness: 0.8,
      metalness: 0.1
    });

    this.mesh = new THREE.Mesh(this.geometry, this.material);
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;
    this.scene.add(this.mesh);
  }

  private generateVertexColors(palette: ColorPalette): Float32Array {
    const colors = new Float32Array((this.segmentsX + 1) * (this.segmentsY + 1) * 3);

    for (let y = 0; y <= this.segmentsY; y++) {
      for (let x = 0; x <= this.segmentsX; x++) {
        const index = y * (this.segmentsX + 1) + x;
        const t = y / this.segmentsY;

        const r = palette.bottom.r + (palette.top.r - palette.bottom.r) * t;
        const g = palette.bottom.g + (palette.top.g - palette.bottom.g) * t;
        const b = palette.bottom.b + (palette.top.b - palette.bottom.b) * t;

        colors[index * 3] = r;
        colors[index * 3 + 1] = g;
        colors[index * 3 + 2] = b;
      }
    }

    return colors;
  }

  updateMesh(vertices: Float32Array): void {
    if (!this.geometry) return;

    const positionAttr = this.geometry.getAttribute('position') as THREE.BufferAttribute;
    const positionArray = positionAttr.array as Float32Array;
    positionArray.set(vertices);
    positionAttr.needsUpdate = true;

    this.geometry.computeVertexNormals();

    if (this.transitionProgress < 1) {
      this.time += 0.016;
      this.transitionProgress = Math.min(1, this.transitionProgress + 0.016 / this.transitionDuration);

      const t = this.transitionProgress;
      const easeT = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

      const interpolated: ColorPalette = {
        top: new THREE.Color().lerpColors(this.currentPalette.top, this.targetPalette.top, easeT),
        bottom: new THREE.Color().lerpColors(this.currentPalette.bottom, this.targetPalette.bottom, easeT)
      };

      const colors = this.generateVertexColors(interpolated);
      const colorAttr = this.geometry.getAttribute('color') as THREE.BufferAttribute;
      (colorAttr.array as Float32Array).set(colors);
      colorAttr.needsUpdate = true;

      if (this.transitionProgress >= 1) {
        this.currentPalette = this.targetPalette;
      }
    }
  }

  setColorPalette(palette: ColorPalette, duration: number = 0.3): void {
    this.targetPalette = palette;
    this.transitionDuration = duration;
    this.transitionProgress = 0;
  }

  private disposeMesh(): void {
    if (this.mesh) {
      this.scene.remove(this.mesh);
      this.mesh = null;
    }
    if (this.geometry) {
      this.geometry.dispose();
      this.geometry = null;
    }
    if (this.material) {
      this.material.dispose();
      this.material = null;
    }
  }

  dispose(): void {
    this.disposeMesh();
  }
}
