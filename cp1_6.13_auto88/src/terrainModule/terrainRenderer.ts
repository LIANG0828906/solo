import * as THREE from 'three';

export class TerrainRenderer {
  private scene: THREE.Scene;
  private terrainGroup: THREE.Group;
  private terrainMesh: THREE.Mesh | null = null;
  private waterMesh: THREE.Mesh | null = null;
  private width: number;
  private height: number;
  private size: number = 100;
  private heightScale: number = 25;
  private waterLevel: number = 0.3;
  private waterAnimationTime: number = 0;

  constructor(scene: THREE.Scene, width: number = 256, height: number = 256) {
    this.scene = scene;
    this.width = width;
    this.height = height;
    this.terrainGroup = new THREE.Group();
    scene.add(this.terrainGroup);
  }

  createTerrain(heightMap: number[]): THREE.Mesh {
    const geometry = new THREE.PlaneGeometry(this.size, this.size, this.width - 1, this.height - 1);
    const vertices = geometry.attributes.position;

    for (let i = 0; i < vertices.count; i++) {
      const x = Math.floor(i % (this.width));
      const y = Math.floor(i / this.width);
      const height = heightMap[y * this.width + x] * this.heightScale;
      vertices.setY(i, height);
    }

    geometry.computeVertexNormals();

    const material = this.createTerrainMaterial();
    const mesh = new THREE.Mesh(geometry, material);
    mesh.rotation.x = -Math.PI / 2;
    mesh.receiveShadow = true;
    mesh.castShadow = true;

    if (this.terrainMesh) {
      this.terrainGroup.remove(this.terrainMesh);
    }
    this.terrainMesh = mesh;
    this.terrainGroup.add(mesh);

    return mesh;
  }

  private createTerrainMaterial(): THREE.MeshStandardMaterial {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    const gradient = ctx.createLinearGradient(0, 0, 0, 512);
    gradient.addColorStop(0, '#1a3a4a');
    gradient.addColorStop(0.3, '#2d5a3d');
    gradient.addColorStop(0.5, '#4a7c59');
    gradient.addColorStop(0.7, '#6b8b5a');
    gradient.addColorStop(0.85, '#8b7355');
    gradient.addColorStop(1, '#a08060');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 512, 512);

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(4, 4);

    return new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.7,
      metalness: 0.1
    });
  }

  createWater(): THREE.Mesh {
    const geometry = new THREE.PlaneGeometry(this.size + 10, this.size + 10, 64, 64);
    const material = new THREE.MeshStandardMaterial({
      color: 0x1e6b8a,
      transparent: true,
      opacity: 0.6,
      roughness: 0.1,
      metalness: 0.3
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.y = this.waterLevel * this.heightScale;

    if (this.waterMesh) {
      this.scene.remove(this.waterMesh);
    }
    this.waterMesh = mesh;
    this.scene.add(mesh);

    return mesh;
  }

  updateTerrain(heightMap: number[], partialUpdate: boolean = false): void {
    if (!this.terrainMesh) return;

    const vertices = this.terrainMesh.geometry.attributes.position;
    
    if (partialUpdate) {
      for (let i = 0; i < vertices.count; i++) {
        const x = Math.floor(i % (this.width));
        const y = Math.floor(i / this.width);
        const height = heightMap[y * this.width + x] * this.heightScale;
        vertices.setY(i, height);
      }
    } else {
      for (let i = 0; i < vertices.count; i++) {
        const x = Math.floor(i % (this.width));
        const y = Math.floor(i / this.width);
        const height = heightMap[y * this.width + x] * this.heightScale;
        vertices.setY(i, height);
      }
    }

    vertices.needsUpdate = true;
    this.terrainMesh.geometry.computeVertexNormals();
  }

  updateWaterLevel(level: number): void {
    this.waterLevel = level;
    if (this.waterMesh) {
      this.waterMesh.position.y = level * this.heightScale;
    }
  }

  updateWaterAnimation(deltaTime: number): void {
    if (!this.waterMesh) return;

    this.waterAnimationTime += deltaTime;
    const vertices = this.waterMesh.geometry.attributes.position;
    
    for (let i = 0; i < vertices.count; i++) {
      const x = Math.floor(i % 65);
      const y = Math.floor(i / 65);
      const wave = Math.sin(x * 0.1 + this.waterAnimationTime) * 0.1 + 
                   Math.sin(y * 0.15 + this.waterAnimationTime * 1.2) * 0.05;
      vertices.setY(i, this.waterLevel * this.heightScale + wave);
    }

    vertices.needsUpdate = true;
  }

  getTerrainMesh(): THREE.Mesh | null {
    return this.terrainMesh;
  }

  getWaterMesh(): THREE.Mesh | null {
    return this.waterMesh;
  }

  getTerrainSize(): number {
    return this.size;
  }

  getHeightScale(): number {
    return this.heightScale;
  }

  dispose(): void {
    if (this.terrainMesh) {
      this.terrainMesh.geometry.dispose();
      if (this.terrainMesh.material instanceof THREE.Material) {
        this.terrainMesh.material.dispose();
      }
    }
    if (this.waterMesh) {
      this.waterMesh.geometry.dispose();
      if (this.waterMesh.material instanceof THREE.Material) {
        this.waterMesh.material.dispose();
      }
    }
    this.scene.remove(this.terrainGroup);
  }
}
