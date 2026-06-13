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
    const geometry = new THREE.BufferGeometry();
    const positions: number[] = [];
    const uv: number[] = [];
    const indices: number[] = [];

    for (let y = 0; y <= this.height; y++) {
      for (let x = 0; x <= this.width; x++) {
        const u = x / this.width;
        const v = y / this.height;
        const height = heightMap[y * this.width + x] * this.heightScale;
        positions.push(
          (u - 0.5) * this.size,
          height,
          (v - 0.5) * this.size
        );
        uv.push(u, v);
      }
    }

    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const i = y * (this.width + 1) + x;
        indices.push(i, i + 1, i + this.width + 1);
        indices.push(i + 1, i + this.width + 2, i + this.width + 1);
      }
    }

    geometry.setIndex(indices);
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    geometry.computeVertexNormals();

    const material = this.createTerrainMaterial();
    const mesh = new THREE.Mesh(geometry, material);
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
    const waterMaterial = this.createWaterMaterial();

    const mesh = new THREE.Mesh(geometry, waterMaterial);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.y = this.waterLevel * this.heightScale;

    if (this.waterMesh) {
      this.scene.remove(this.waterMesh);
    }
    this.waterMesh = mesh;
    this.scene.add(mesh);

    return mesh;
  }

  private createWaterMaterial(): THREE.MeshStandardMaterial {
    const material = new THREE.MeshStandardMaterial({
      color: 0x1e6b8a,
      transparent: true,
      opacity: 0.6,
      roughness: 0.1,
      metalness: 0.3,
      side: THREE.DoubleSide
    });

    material.onBeforeCompile = (shader) => {
      shader.uniforms.time = { value: 0 };
      shader.uniforms.waterLevel = { value: this.waterLevel * this.heightScale };

      shader.vertexShader = `
        uniform float time;
        uniform float waterLevel;
        ${shader.vertexShader}
      `.replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
          float wave = sin(position.x * 0.1 + time) * 0.1 + sin(position.z * 0.15 + time * 1.2) * 0.05;
          transformed.y = waterLevel + wave;
        `
      );

      material.userData.shader = shader;
    };

    return material;
  }

  updateTerrain(heightMap: number[], affectedRegion?: { x: number; y: number; width: number; height: number }): void {
    if (!this.terrainMesh) return;

    const positions = this.terrainMesh.geometry.attributes.position;
    
    if (affectedRegion) {
      const startX = Math.max(0, Math.floor(affectedRegion.x));
      const endX = Math.min(this.width, Math.floor(affectedRegion.x + affectedRegion.width));
      const startY = Math.max(0, Math.floor(affectedRegion.y));
      const endY = Math.min(this.height, Math.floor(affectedRegion.y + affectedRegion.height));

      for (let y = startY; y <= endY; y++) {
        for (let x = startX; x <= endX; x++) {
          const index = y * (this.width + 1) + x;
          const height = heightMap[y * this.width + x] * this.heightScale;
          positions.setY(index, height);
        }
      }
    } else {
      for (let y = 0; y <= this.height; y++) {
        for (let x = 0; x <= this.width; x++) {
          const index = y * (this.width + 1) + x;
          const height = heightMap[y * this.width + x] * this.heightScale;
          positions.setY(index, height);
        }
      }
    }

    positions.needsUpdate = true;
    this.terrainMesh.geometry.computeVertexNormals();
  }

  updateWaterLevel(level: number): void {
    this.waterLevel = level;
    if (this.waterMesh) {
      this.waterMesh.position.y = level * this.heightScale;
      if (this.waterMesh.material instanceof THREE.MeshStandardMaterial && 
          this.waterMesh.material.userData.shader) {
        this.waterMesh.material.userData.shader.uniforms.waterLevel.value = level * this.heightScale;
      }
    }
  }

  updateWaterAnimation(deltaTime: number): void {
    this.waterAnimationTime += deltaTime;
    if (this.waterMesh && this.waterMesh.material instanceof THREE.MeshStandardMaterial) {
      const shader = this.waterMesh.material.userData.shader;
      if (shader && shader.uniforms.time) {
        shader.uniforms.time.value = this.waterAnimationTime;
      }
    }
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
