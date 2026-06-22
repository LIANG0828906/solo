import * as THREE from 'three';
import { PerlinNoise } from '../utils/perlin';

export class Terrain {
  private scene: THREE.Scene;
  private mesh: THREE.Mesh;
  private size: number = 30;
  private segments: number = 255;
  private noise: PerlinNoise;
  private heights: Float32Array;
  private treesGroup: THREE.Group;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.noise = new PerlinNoise(42);
    this.heights = new Float32Array((this.segments + 1) * (this.segments + 1));
    this.treesGroup = new THREE.Group();

    this.createTerrain();
    this.createTrees();
    this.scene.add(this.treesGroup);
  }

  private createTerrain(): void {
    const geometry = new THREE.PlaneGeometry(
      this.size,
      this.size,
      this.segments,
      this.segments
    );
    geometry.rotateX(-Math.PI / 2);

    const positions = geometry.attributes.position;
    const colors: number[] = [];
    const colorLow = new THREE.Color(0x4A7C59);
    const colorHigh = new THREE.Color(0x6B8E23);

    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      const z = positions.getZ(i);

      const nx = (x + this.size / 2) / this.size;
      const nz = (z + this.size / 2) / this.size;

      let height = this.noise.octaveNoise2D(nx * 4, nz * 4, 4, 0.5);
      height = height * 1.5 + 0.5;
      height = Math.max(-1, Math.min(2, height));

      positions.setY(i, height);
      this.heights[i] = height;

      const t = (height + 1) / 3;
      const color = colorLow.clone().lerp(colorHigh, t);
      colors.push(color.r, color.g, color.b);
    }

    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geometry.computeVertexNormals();

    const material = new THREE.MeshLambertMaterial({
      vertexColors: true,
      flatShading: true
    });

    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.receiveShadow = true;
    this.mesh.name = 'terrain';
    this.scene.add(this.mesh);
  }

  private createTrees(): void {
    const trunkGeometry = new THREE.CylinderGeometry(0.04, 0.06, 0.3, 6);
    const trunkMaterial = new THREE.MeshLambertMaterial({ color: 0x5D4037 });

    const foliageGeometry = new THREE.SphereGeometry(0.2, 6, 5);
    const foliageMaterial = new THREE.MeshLambertMaterial({ color: 0x2E7D32 });

    const treeCount = 50;
    const placedPositions: { x: number; z: number }[] = [];

    for (let i = 0; i < treeCount; i++) {
      let attempts = 0;
      let x = 0, z = 0;
      let valid = false;

      while (attempts < 50 && !valid) {
        x = (Math.random() - 0.5) * (this.size - 4);
        z = (Math.random() - 0.5) * (this.size - 4);
        valid = true;
        for (const pos of placedPositions) {
          const dist = Math.sqrt((x - pos.x) ** 2 + (z - pos.z) ** 2);
          if (dist < 1.5) {
            valid = false;
            break;
          }
        }
        attempts++;
      }

      if (!valid) continue;
      placedPositions.push({ x, z });

      const y = this.getHeightAt(x, z);
      const scale = 0.3 + Math.random() * 0.5;

      const tree = new THREE.Group();

      const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
      trunk.position.y = 0.15 * scale;
      trunk.scale.setScalar(scale);

      const foliage = new THREE.Mesh(foliageGeometry, foliageMaterial);
      foliage.position.y = 0.35 * scale;
      foliage.scale.setScalar(scale);
      foliage.rotation.y = Math.random() * Math.PI * 2;

      tree.add(trunk);
      tree.add(foliage);
      tree.position.set(x, y, z);
      this.treesGroup.add(tree);
    }
  }

  getHeightAt(x: number, z: number): number {
    const half = this.size / 2;
    if (x < -half || x > half || z < -half || z > half) return 0;

    const nx = (x + half) / this.size;
    const nz = (z + half) / this.size;

    const fx = nx * this.segments;
    const fz = nz * this.segments;

    const ix = Math.floor(fx);
    const iz = Math.floor(fz);
    const tx = fx - ix;
    const tz = fz - iz;

    const idx = (row: number, col: number) => row * (this.segments + 1) + col;

    const h00 = this.heights[idx(iz, ix)];
    const h10 = this.heights[idx(iz, Math.min(ix + 1, this.segments))];
    const h01 = this.heights[idx(Math.min(iz + 1, this.segments), ix)];
    const h11 = this.heights[idx(Math.min(iz + 1, this.segments), Math.min(ix + 1, this.segments))];

    const h0 = h00 * (1 - tx) + h10 * tx;
    const h1 = h01 * (1 - tx) + h11 * tx;
    return h0 * (1 - tz) + h1 * tz;
  }

  getMesh(): THREE.Mesh {
    return this.mesh;
  }

  getSize(): number {
    return this.size;
  }
}
