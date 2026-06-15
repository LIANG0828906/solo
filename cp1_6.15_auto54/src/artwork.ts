import * as THREE from 'three';

export interface ArtworkData {
  id: string;
  title: string;
  author: string;
  year: number;
  imageUrl: string;
}

export interface ArtworkClickEvent extends CustomEvent {
  detail: ArtworkData;
}

declare global {
  interface HTMLElementEventMap {
    'artwork-click': ArtworkClickEvent;
  }
}

const FRAME_WIDTH = 1.8;
const FRAME_HEIGHT = 1.3;
const FRAME_DEPTH = 0.12;
const CANVAS_WIDTH = 1.5;
const CANVAS_HEIGHT = 1.0;
const MAX_TEXTURE_SIZE = 2048;

const frameGeometry = new THREE.BoxGeometry(FRAME_WIDTH, FRAME_HEIGHT, FRAME_DEPTH);
const canvasGeometry = new THREE.PlaneGeometry(CANVAS_WIDTH, CANVAS_HEIGHT);

const frameMaterial = new THREE.MeshStandardMaterial({
  color: 0x5D4037,
  roughness: 0.8,
  metalness: 0.1
});

const placeholderMaterial = new THREE.MeshStandardMaterial({
  color: 0x2a2a2a,
  roughness: 0.9
});

const textureLoader = new THREE.TextureLoader();

let maxAnisotropy: number = 1;

export function setMaxAnisotropy(value: number): void {
  maxAnisotropy = Math.max(1, value);
}

export class Artwork extends THREE.Group {
  private data: ArtworkData;
  private frameMesh: THREE.Mesh;
  private canvasMesh: THREE.Mesh;
  private hitboxMesh: THREE.Mesh;
  private originalPosition: THREE.Vector3;
  private isFloating: boolean = false;
  private floatProgress: number = 0;
  private animationId: number | null = null;
  private targetZOffset: number = 0.5;
  private normal: THREE.Vector3;
  public raycastTargets: THREE.Mesh[] = [];

  constructor(data: ArtworkData, position: THREE.Vector3, normal: THREE.Vector3) {
    super();
    this.data = data;
    this.originalPosition = position.clone();
    this.normal = normal.clone();
    this.position.copy(position);

    this.frameMesh = new THREE.Mesh(frameGeometry, frameMaterial);
    this.frameMesh.castShadow = true;
    this.frameMesh.receiveShadow = true;
    this.add(this.frameMesh);

    this.canvasMesh = new THREE.Mesh(canvasGeometry, placeholderMaterial);
    this.canvasMesh.position.z = FRAME_DEPTH / 2 + 0.01;
    this.canvasMesh.receiveShadow = true;
    this.canvasMesh.castShadow = false;
    this.add(this.canvasMesh);

    const hitboxGeometry = new THREE.PlaneGeometry(FRAME_WIDTH * 1.05, FRAME_HEIGHT * 1.05);
    const hitboxMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0,
      depthWrite: false
    });
    this.hitboxMesh = new THREE.Mesh(hitboxGeometry, hitboxMaterial);
    this.hitboxMesh.position.z = FRAME_DEPTH / 2 + 0.02;
    this.add(this.hitboxMesh);

    this.raycastTargets = [this.hitboxMesh, this.frameMesh, this.canvasMesh];

    this.loadTexture();
  }

  private loadTexture(): void {
    textureLoader.load(
      this.data.imageUrl,
      (texture) => {
        const maxSize = MAX_TEXTURE_SIZE;
        if (texture.image.width > maxSize || texture.image.height > maxSize) {
          const canvas = document.createElement('canvas');
          const ratio = Math.min(maxSize / texture.image.width, maxSize / texture.image.height);
          canvas.width = Math.floor(texture.image.width * ratio);
          canvas.height = Math.floor(texture.image.height * ratio);
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(texture.image, 0, 0, canvas.width, canvas.height);
            texture.image = canvas;
          }
        }
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.generateMipmaps = true;
        texture.minFilter = THREE.LinearMipmapLinearFilter;
        texture.magFilter = THREE.LinearFilter;
        texture.anisotropy = maxAnisotropy;
        texture.needsUpdate = true;

        const material = new THREE.MeshStandardMaterial({
          map: texture,
          roughness: 0.6,
          metalness: 0.0
        });
        this.canvasMesh.material = material;
      },
      undefined,
      (error) => {
        console.warn('Failed to load texture:', error);
      }
    );
  }

  public getData(): ArtworkData {
    return this.data;
  }

  public float(): void {
    if (this.isFloating) return;
    this.isFloating = true;
    this.targetZOffset = 0.5;
    this.animateFloat(0.3, 'out');
  }

  public retract(): void {
    if (!this.isFloating) return;
    this.isFloating = false;
    this.targetZOffset = 0;
    this.animateFloat(0.3, 'in');
  }

  private animateFloat(duration: number, direction: 'in' | 'out'): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
    }

    const startTime = performance.now();
    const startProgress = this.floatProgress;
    const targetProgress = direction === 'out' ? 1 : 0;

    const easeOutElastic = (t: number): number => {
      if (t === 0) return 0;
      if (t === 1) return 1;
      const period = 0.5;
      const overshoot = 1.15;
      const s = period / 4;
      const shifted = t - 1;
      const power = Math.pow(2, -10 * shifted);
      const wave = Math.sin((shifted - s) * (2 * Math.PI) / period);
      return (power * wave + 1) * overshoot - (overshoot - 1);
    };

    const animate = () => {
      const elapsed = (performance.now() - startTime) / 1000;
      let t = Math.min(elapsed / duration, 1);

      let easedT: number;
      if (direction === 'out') {
        easedT = easeOutElastic(t);
      } else {
        easedT = t * t * (3 - 2 * t);
      }
      this.floatProgress = startProgress + (targetProgress - startProgress) * easedT;

      const offset = this.normal.clone().multiplyScalar(this.targetZOffset * this.floatProgress);
      this.position.copy(this.originalPosition).add(offset);

      if (t < 1) {
        this.animationId = requestAnimationFrame(animate);
      } else {
        this.floatProgress = targetProgress;
        const finalOffset = this.normal.clone().multiplyScalar(this.targetZOffset * this.floatProgress);
        this.position.copy(this.originalPosition).add(finalOffset);
        this.animationId = null;
      }
    };

    this.animationId = requestAnimationFrame(animate);
  }

  public dispose(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
    }
    if (this.canvasMesh.material !== placeholderMaterial) {
      const material = this.canvasMesh.material as THREE.MeshStandardMaterial;
      if (material.map) {
        material.map.dispose();
      }
      material.dispose();
    }
  }
}
