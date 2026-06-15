import * as THREE from 'three';

interface TreeCollision {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

export class TerrainManager {
  private scene: THREE.Scene;
  private terrainMesh!: THREE.Mesh;
  private terrainGeometry!: THREE.PlaneGeometry;
  private waterVertexIndices: number[] = [];
  private originalWaterY: Map<number, number> = new Map();
  private treeCollisions: TreeCollision[] = [];
  private treesGroup: THREE.Group = new THREE.Group();
  private roadsGroup: THREE.Group = new THREE.Group();

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  createTerrain(): void {
    const width = 200;
    const height = 200;
    const widthSegments = 64;
    const heightSegments = 64;

    this.terrainGeometry = new THREE.PlaneGeometry(width, height, widthSegments, heightSegments);
    this.terrainGeometry.rotateX(-Math.PI / 2);

    const positions = this.terrainGeometry.attributes.position;
    const colors: number[] = [];

    const waterColorStart = new THREE.Color('#2E6B8A');
    const waterColorEnd = new THREE.Color('#4A90D9');
    const plainColorStart = new THREE.Color('#8B7355');
    const plainColorEnd = new THREE.Color('#C4A882');
    const hillColorStart = new THREE.Color('#6B8E23');
    const hillColorEnd = new THREE.Color('#556B2F');

    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      const z = positions.getZ(i);
      let y = 0;
      let color: THREE.Color;

      if (x >= -100 && x < -50) {
        color = waterColorStart.clone().lerp(waterColorEnd, (x + 100) / 50);
        this.waterVertexIndices.push(i);
        this.originalWaterY.set(i, 0);
      } else if (x >= -50 && x <= 50) {
        color = plainColorStart.clone().lerp(plainColorEnd, (x + 50) / 100);
      } else {
        const hillHeight = this.noise(x * 0.08, z * 0.08) * 6 + 2;
        y = hillHeight;
        color = hillColorStart.clone().lerp(hillColorEnd, hillHeight / 8);
      }

      positions.setY(i, y);
      colors.push(color.r, color.g, color.b);
    }

    this.terrainGeometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    this.terrainGeometry.computeVertexNormals();

    const material = new THREE.MeshStandardMaterial({
      vertexColors: true,
      side: THREE.DoubleSide,
      roughness: 0.9,
      metalness: 0.1,
    });

    this.terrainMesh = new THREE.Mesh(this.terrainGeometry, material);
    this.terrainMesh.receiveShadow = true;
    this.terrainMesh.name = 'terrain';
    this.scene.add(this.terrainMesh);
  }

  createTrees(): void {
    this.treeCollisions = [];
    const treeCount = 60;
    const plainMinX = -50;
    const plainMaxX = 50;
    const minZ = -95;
    const maxZ = 95;
    const minDistance = 5;

    const trunkMaterial = new THREE.MeshStandardMaterial({ color: '#8B4513', roughness: 0.9 });
    const foliageMaterials = [
      new THREE.MeshStandardMaterial({ color: '#228B22', roughness: 0.8 }),
      new THREE.MeshStandardMaterial({ color: '#006400', roughness: 0.8 }),
    ];

    let placed = 0;
    let attempts = 0;
    const maxAttempts = 2000;

    while (placed < treeCount && attempts < maxAttempts) {
      attempts++;
      const x = plainMinX + Math.random() * (plainMaxX - plainMinX);
      const z = minZ + Math.random() * (maxZ - minZ);

      let tooClose = false;
      for (const t of this.treeCollisions) {
        const cx = (t.minX + t.maxX) / 2;
        const cz = (t.minZ + t.maxZ) / 2;
        const dx = x - cx;
        const dz = z - cz;
        if (Math.sqrt(dx * dx + dz * dz) < minDistance) {
          tooClose = true;
          break;
        }
      }
      if (tooClose) continue;

      const totalHeight = 4 + Math.random() * 2;
      const trunkHeight = 2;
      const foliageHeight = totalHeight - trunkHeight;
      const terrainY = this.getTerrainHeight(x, z);

      const treeGroup = new THREE.Group();

      const trunkGeometry = new THREE.CylinderGeometry(0.2, 0.25, trunkHeight, 8);
      const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
      trunk.position.y = terrainY + trunkHeight / 2;
      trunk.castShadow = true;
      treeGroup.add(trunk);

      const foliageRadius = 1 + Math.random() * 0.5;
      const coneGeometry1 = new THREE.ConeGeometry(foliageRadius, foliageHeight * 0.6, 8);
      const foliage1 = new THREE.Mesh(coneGeometry1, foliageMaterials[placed % 2]);
      foliage1.position.y = terrainY + trunkHeight + foliageHeight * 0.3;
      foliage1.castShadow = true;
      treeGroup.add(foliage1);

      const coneGeometry2 = new THREE.ConeGeometry(foliageRadius * 0.7, foliageHeight * 0.5, 8);
      const foliage2 = new THREE.Mesh(coneGeometry2, foliageMaterials[(placed + 1) % 2]);
      foliage2.position.y = terrainY + trunkHeight + foliageHeight * 0.65;
      foliage2.castShadow = true;
      treeGroup.add(foliage2);

      treeGroup.position.set(x, 0, z);
      this.treesGroup.add(treeGroup);

      this.treeCollisions.push({
        minX: x - foliageRadius,
        maxX: x + foliageRadius,
        minZ: z - foliageRadius,
        maxZ: z + foliageRadius,
      });

      placed++;
    }

    this.scene.add(this.treesGroup);
  }

  createRoads(): void {
    const roadWidth = 6;
    const zPositions = [-20, 0, 20];

    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 64;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#C4A882';
    ctx.fillRect(0, 0, 256, 64);

    ctx.strokeStyle = '#8B7355';
    ctx.lineWidth = 3;
    for (let i = 0; i < 8; i++) {
      ctx.beginPath();
      ctx.moveTo(0, 8 + i * 8);
      ctx.lineTo(256, 8 + i * 8);
      ctx.stroke();
    }

    const roadTexture = new THREE.CanvasTexture(canvas);
    roadTexture.wrapS = THREE.RepeatWrapping;
    roadTexture.wrapT = THREE.RepeatWrapping;
    roadTexture.repeat.set(10, 1);

    const roadMaterial = new THREE.MeshStandardMaterial({
      map: roadTexture,
      color: '#C4A882',
      roughness: 0.95,
    });

    for (const baseZ of zPositions) {
      const points: THREE.Vector3[] = [];
      const segments = 40;
      for (let i = 0; i <= segments; i++) {
        const t = i / segments;
        const x = -100 + t * 200;
        const zOffset = Math.sin(t * Math.PI * 2) * 2;
        const z = baseZ + zOffset;
        const y = this.getTerrainHeight(x, z) + 0.05;
        points.push(new THREE.Vector3(x, y, z));
      }

      const curve = new THREE.CatmullRomCurve3(points);
      const tubeGeometry = new THREE.TubeGeometry(curve, 80, roadWidth / 2, 8, false);

      const road = new THREE.Mesh(tubeGeometry, roadMaterial);
      road.receiveShadow = true;
      road.castShadow = false;
      this.roadsGroup.add(road);
    }

    this.scene.add(this.roadsGroup);
  }

  updateWaves(time: number): void {
    const positions = this.terrainGeometry.attributes.position;
    const frequency = 0.5;
    const amplitude = 0.3;

    for (const i of this.waterVertexIndices) {
      const x = positions.getX(i);
      const z = positions.getZ(i);
      const wave = Math.sin((x + z) * 0.3 + time * frequency * Math.PI * 2) * amplitude;
      positions.setY(i, wave);
    }

    positions.needsUpdate = true;
    this.terrainGeometry.computeVertexNormals();
  }

  getTerrainHeight(x: number, z: number): number {
    if (x >= -100 && x < -50) {
      return 0;
    } else if (x >= -50 && x <= 50) {
      return 0;
    } else {
      return this.noise(x * 0.08, z * 0.08) * 6 + 2;
    }
  }

  getAllTreePositions(): TreeCollision[] {
    return [...this.treeCollisions];
  }

  private noise(x: number, z: number): number {
    const n = Math.sin(x * 12.9898 + z * 78.233) * 43758.5453;
    const a = n - Math.floor(n);
    const b = Math.sin((x + 1) * 12.9898 + z * 78.233) * 43758.5453;
    const bF = b - Math.floor(b);
    const c = Math.sin(x * 12.9898 + (z + 1) * 78.233) * 43758.5453;
    const cF = c - Math.floor(c);
    return (a + bF + cF) / 3;
  }
}
