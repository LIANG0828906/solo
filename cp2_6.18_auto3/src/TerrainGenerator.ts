import * as THREE from 'three';

export interface TerrainHeightData {
  size: number;
  heights: number[][];
  textureIndex: number;
}

export type TextureType = 'grass' | 'desert' | 'snow' | 'rock';

export class TerrainGenerator {
  public mesh: THREE.Mesh;
  public size: number;
  public gridSize: number;
  public brushRadius: number = 3;
  public brushStrength: number = 1.0;
  public textureIndex: number = 0;

  private geometry: THREE.PlaneGeometry;
  private material: THREE.MeshStandardMaterial;
  private raycaster: THREE.Raycaster;
  private isDragging: boolean = false;
  private isRaising: boolean = true;
  private currentHeightData: Float32Array;
  private currentColors: Float32Array;

  private colorLow = new THREE.Color(0x4CAF50);
  private colorMid = new THREE.Color(0x8BC34A);
  private colorHigh = new THREE.Color(0xFFEB3B);
  private colorSnow = new THREE.Color(0xFFFFFF);

  private snowLine: number = 8;
  private midLine: number = 4;
  private lowLine: number = 0;

  private textures: THREE.CanvasTexture[] = [];
  private transitionMesh: THREE.Mesh | null = null;
  private transitionMaterial: THREE.MeshStandardMaterial | null = null;
  private textureTransition: number = 1;
  private targetTextureIndex: number = 0;
  private transitioning: boolean = false;

  public gridHelper: THREE.LineSegments | null = null;

  private tempVec = new THREE.Vector3();
  private tempColor = new THREE.Color();
  private unitSize: number = 1;

  constructor(gridSize: number = 30, unitSize: number = 1) {
    this.size = gridSize;
    this.gridSize = gridSize;
    this.brushRadius = 3;
    this.unitSize = unitSize;

    this.geometry = new THREE.PlaneGeometry(
      gridSize * unitSize,
      gridSize * unitSize,
      gridSize - 1,
      gridSize - 1
    );
    this.geometry.rotateX(-Math.PI / 2);

    const vertexCount = this.geometry.attributes.position.count;
    this.currentHeightData = new Float32Array(vertexCount);
    this.currentColors = new Float32Array(vertexCount * 3);

    this.generateBaseTerrain();

    this.material = new THREE.MeshStandardMaterial({
      vertexColors: true,
      flatShading: false,
      side: THREE.DoubleSide,
      roughness: 0.8,
      metalness: 0.1
    });

    this.mesh = new THREE.Mesh(this.geometry, this.material);
    this.mesh.receiveShadow = true;
    this.mesh.castShadow = true;

    this.raycaster = new THREE.Raycaster();

    this.generateTextures();
    this.applyTexture(0);

    this.createGridHelper();
  }

  private generateBaseTerrain(): void {
    const positions = this.geometry.attributes.position;
    const vertexCount = positions.count;

    for (let i = 0; i < vertexCount; i++) {
      const x = positions.getX(i);
      const z = positions.getZ(i);
      const height = this.perlinLikeNoise(x * 0.1, z * 0.1) * 2;
      positions.setY(i, height);
      this.currentHeightData[i] = height;
    }

    this.updateColors();
    this.geometry.computeVertexNormals();
    positions.needsUpdate = true;
  }

  private perlinLikeNoise(x: number, z: number): number {
    const value = Math.sin(x * 1.5) * Math.cos(z * 1.2) * 0.5 +
                  Math.sin(x * 0.7 + 1.3) * Math.cos(z * 0.9 + 0.5) * 0.8 +
                  Math.sin(x * 2.3 + 2.1) * Math.cos(z * 1.7 + 1.1) * 0.3;
    return value;
  }

  private updateColors(): void {
    const positions = this.geometry.attributes.position;
    const vertexCount = positions.count;

    if (!this.geometry.getAttribute('color')) {
      this.geometry.setAttribute('color', new THREE.BufferAttribute(this.currentColors, 3));
    }

    const colors = this.geometry.attributes.color;

    for (let i = 0; i < vertexCount; i++) {
      const height = positions.getY(i);
      const color = this.getHeightColor(height);
      colors.setXYZ(i, color.r, color.g, color.b);
    }

    colors.needsUpdate = true;
  }

  private getHeightColor(height: number): THREE.Color {
    const color = new THREE.Color();

    if (height >= this.snowLine) {
      color.copy(this.colorSnow);
    } else if (height >= this.midLine) {
      const t = (height - this.midLine) / (this.snowLine - this.midLine);
      color.copy(this.colorHigh).lerp(this.colorSnow, Math.max(0, Math.min(1, t)));
    } else if (height >= this.lowLine) {
      const t = (height - this.lowLine) / (this.midLine - this.lowLine);
      color.copy(this.colorLow).lerp(this.colorMid, Math.max(0, Math.min(1, t)));
    } else {
      const t = (height + 2) / 2;
      color.setHSL(0.35, 0.5, Math.max(0.1, t * 0.4));
    }

    return color;
  }

  private generateTextures(): void {
    const textureTypes: TextureType[] = ['grass', 'desert', 'snow', 'rock'];
    
    for (const type of textureTypes) {
      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 256;
      const ctx = canvas.getContext('2d')!;

      switch (type) {
        case 'grass':
          this.drawGrassTexture(ctx);
          break;
        case 'desert':
          this.drawDesertTexture(ctx);
          break;
        case 'snow':
          this.drawSnowTexture(ctx);
          break;
        case 'rock':
          this.drawRockTexture(ctx);
          break;
      }

      const texture = new THREE.CanvasTexture(canvas);
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(this.size, this.size);
      texture.needsUpdate = true;
      this.textures.push(texture);
    }
  }

  private drawGrassTexture(ctx: CanvasRenderingContext2D): void {
    const w = 256, h = 256;
    const gradient = ctx.createLinearGradient(0, 0, w, h);
    gradient.addColorStop(0, '#4CAF50');
    gradient.addColorStop(0.5, '#66BB6A');
    gradient.addColorStop(1, '#388E3C');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, h);

    for (let i = 0; i < 2000; i++) {
      const x = Math.random() * w;
      const y = Math.random() * h;
      const size = Math.random() * 3 + 1;
      ctx.fillStyle = Math.random() > 0.5 ? '#2E7D32' : '#81C784';
      ctx.fillRect(x, y, size, size);
    }

    for (let i = 0; i < 500; i++) {
      const x = Math.random() * w;
      const y = Math.random() * h;
      ctx.strokeStyle = '#1B5E20';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + Math.random() * 2 - 1, y - Math.random() * 4 - 2);
      ctx.stroke();
    }
  }

  private drawDesertTexture(ctx: CanvasRenderingContext2D): void {
    const w = 256, h = 256;
    const gradient = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
    gradient.addColorStop(0, '#F4D03F');
    gradient.addColorStop(0.7, '#E6B800');
    gradient.addColorStop(1, '#B8860B');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, h);

    for (let i = 0; i < 3000; i++) {
      const x = Math.random() * w;
      const y = Math.random() * h;
      const size = Math.random() * 2 + 0.5;
      const gray = Math.random() * 40 + 180;
      ctx.fillStyle = `rgb(${gray}, ${gray - 20}, ${gray - 60})`;
      ctx.fillRect(x, y, size, size);
    }

    for (let i = 0; i < 10; i++) {
      const y = Math.random() * h;
      ctx.strokeStyle = 'rgba(139, 90, 43, 0.3)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, y);
      for (let x = 0; x < w; x += 20) {
        ctx.lineTo(x, y + Math.sin(x * 0.05 + i) * 5);
      }
      ctx.stroke();
    }
  }

  private drawSnowTexture(ctx: CanvasRenderingContext2D): void {
    const w = 256, h = 256;
    const gradient = ctx.createLinearGradient(0, 0, 0, h);
    gradient.addColorStop(0, '#FFFFFF');
    gradient.addColorStop(1, '#E0E0E0');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, h);

    for (let i = 0; i < 1500; i++) {
      const x = Math.random() * w;
      const y = Math.random() * h;
      const size = Math.random() * 3 + 1;
      const alpha = Math.random() * 0.3 + 0.1;
      ctx.fillStyle = `rgba(180, 180, 200, ${alpha})`;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }

    for (let i = 0; i < 200; i++) {
      const x = Math.random() * w;
      const y = Math.random() * h;
      const size = Math.random() * 5 + 2;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private drawRockTexture(ctx: CanvasRenderingContext2D): void {
    const w = 256, h = 256;
    const gradient = ctx.createLinearGradient(0, 0, w, h);
    gradient.addColorStop(0, '#757575');
    gradient.addColorStop(0.5, '#9E9E9E');
    gradient.addColorStop(1, '#616161');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, h);

    for (let i = 0; i < 50; i++) {
      const x = Math.random() * w;
      const y = Math.random() * h;
      const rw = Math.random() * 40 + 20;
      const rh = Math.random() * 30 + 15;
      const gray = Math.random() * 30 + 90;
      ctx.fillStyle = `rgb(${gray}, ${gray}, ${gray})`;
      ctx.beginPath();
      ctx.ellipse(x, y, rw, rh, Math.random() * Math.PI, 0, Math.PI * 2);
      ctx.fill();
    }

    for (let i = 0; i < 100; i++) {
      const x = Math.random() * w;
      const y = Math.random() * h;
      const len = Math.random() * 30 + 10;
      const angle = Math.random() * Math.PI;
      ctx.strokeStyle = 'rgba(50, 50, 50, 0.4)';
      ctx.lineWidth = Math.random() * 2 + 0.5;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + Math.cos(angle) * len, y + Math.sin(angle) * len);
      ctx.stroke();
    }
  }

  public setTexture(index: number): void {
    if (index < 0 || index >= this.textures.length) return;
    if (index === this.textureIndex && !this.transitioning) return;

    if (this.transitioning) {
      this.finishTransition();
    }

    this.targetTextureIndex = index;
    this.transitioning = true;
    this.textureTransition = 0;

    this.transitionMaterial = new THREE.MeshStandardMaterial({
      vertexColors: true,
      flatShading: false,
      side: THREE.DoubleSide,
      roughness: 0.8,
      metalness: 0.1,
      transparent: true,
      opacity: 0,
      map: this.textures[index]
    });

    this.transitionMesh = new THREE.Mesh(this.geometry, this.transitionMaterial);
    this.transitionMesh.position.y = 0.01;
    this.transitionMesh.receiveShadow = true;

    if (this.mesh.parent) {
      this.mesh.parent.add(this.transitionMesh);
    }
  }

  private finishTransition(): void {
    if (this.transitionMesh && this.mesh.parent) {
      this.mesh.parent.remove(this.transitionMesh);
    }
    if (this.transitionMaterial) {
      this.transitionMaterial.dispose();
    }
    this.transitionMesh = null;
    this.transitionMaterial = null;
  }

  private applyTexture(index: number): void {
    if (index < 0 || index >= this.textures.length) return;
    this.textureIndex = index;
    this.material.map = this.textures[index];
    this.material.needsUpdate = true;
  }

  public update(deltaTime: number): void {
    if (this.transitioning && this.transitionMaterial) {
      this.textureTransition += deltaTime / 0.3;
      if (this.textureTransition >= 1) {
        this.textureTransition = 1;
        this.applyTexture(this.targetTextureIndex);
        this.finishTransition();
        this.transitioning = false;
      } else {
        this.transitionMaterial.opacity = this.textureTransition;
      }
    }
  }

  public startEdit(
    mouse: THREE.Vector2,
    camera: THREE.Camera,
    isRaising: boolean
  ): void {
    this.isDragging = true;
    this.isRaising = isRaising;
    this.applyBrush(mouse, camera);
  }

  public moveEdit(mouse: THREE.Vector2, camera: THREE.Camera): void {
    if (!this.isDragging) return;
    this.applyBrush(mouse, camera);
  }

  public endEdit(): void {
    this.isDragging = false;
  }

  private applyBrush(mouse: THREE.Vector2, camera: THREE.Camera): void {
    this.raycaster.setFromCamera(mouse, camera);
    const intersects = this.raycaster.intersectObject(this.mesh);

    if (intersects.length === 0) return;

    const point = intersects[0].point;
    const positions = this.geometry.attributes.position;
    const vertexCount = positions.count;

    for (let i = 0; i < vertexCount; i++) {
      const x = positions.getX(i);
      const z = positions.getZ(i);

      const dx = x - point.x;
      const dz = z - point.z;
      const distance = Math.sqrt(dx * dx + dz * dz);

      if (distance < this.brushRadius) {
        const falloff = 1 - distance / this.brushRadius;
        const smoothFalloff = falloff * falloff * (3 - 2 * falloff);
        const delta = this.brushStrength * smoothFalloff;

        const currentHeight = positions.getY(i);
        const newHeight = this.isRaising
          ? currentHeight + delta
          : currentHeight - delta;

        positions.setY(i, newHeight);
        this.currentHeightData[i] = newHeight;
      }
    }

    this.updateColors();
    this.geometry.computeVertexNormals();
    positions.needsUpdate = true;
    this.updateGridHelper();
  }

  public smoothTerrain(): void {
    const positions = this.geometry.attributes.position;
    const vertexCount = positions.count;
    
    const newHeights = new Float32Array(vertexCount);

    const width = this.size;
    const height = this.size;

    for (let i = 0; i < vertexCount; i++) {
      const ix = i % width;
      const iz = Math.floor(i / width);

      let sum = 0;
      let count = 0;

      for (let dz = -1; dz <= 1; dz++) {
        for (let dx = -1; dx <= 1; dx++) {
          const nx = ix + dx;
          const nz = iz + dz;

          if (nx >= 0 && nx < width && nz >= 0 && nz < height) {
            const ni = nz * width + nx;
            sum += positions.getY(ni);
            count++;
          }
        }
      }

      newHeights[i] = sum / count;
    }

    for (let i = 0; i < vertexCount; i++) {
      const original = positions.getY(i);
      const smoothed = newHeights[i];
      const blended = original * 0.5 + smoothed * 0.5;
      positions.setY(i, blended);
      this.currentHeightData[i] = blended;
    }

    this.updateColors();
    this.geometry.computeVertexNormals();
    positions.needsUpdate = true;
    this.updateGridHelper();
  }

  public resetTerrain(): void {
    this.generateBaseTerrain();
    this.updateGridHelper();
  }

  public getHeightData(): TerrainHeightData {
    const heights: number[][] = [];
    const positions = this.geometry.attributes.position;

    for (let z = 0; z < this.size; z++) {
      const row: number[] = [];
      for (let x = 0; x < this.size; x++) {
        const index = z * this.size + x;
        row.push(positions.getY(index));
      }
      heights.push(row);
    }

    return {
      size: this.size,
      heights,
      textureIndex: this.textureIndex
    };
  }

  public exportToJSON(): string {
    const data = this.getHeightData();
    return JSON.stringify(data, null, 2);
  }

  public setBrushRadius(radius: number): void {
    this.brushRadius = Math.max(1, Math.min(10, radius));
  }

  public setBrushStrength(strength: number): void {
    this.brushStrength = Math.max(0.1, Math.min(2.0, strength));
  }

  private createGridHelper(): void {
    const gridGeometry = new THREE.BufferGeometry();
    const vertices: number[] = [];

    const halfSize = (this.size * this.unitSize) / 2;
    const step = this.unitSize;

    for (let i = 0; i <= this.size; i++) {
      const pos = -halfSize + i * step;
      vertices.push(pos, 0.05, -halfSize);
      vertices.push(pos, 0.05, halfSize);
      vertices.push(-halfSize, 0.05, pos);
      vertices.push(halfSize, 0.05, pos);
    }

    gridGeometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));

    const gridMaterial = new THREE.LineBasicMaterial({
      color: 0xCCCCCC,
      transparent: true,
      opacity: 0.3
    });

    this.gridHelper = new THREE.LineSegments(gridGeometry, gridMaterial);
    this.updateGridHelper();
  }

  public updateGridHelper(): void {
    if (!this.gridHelper) return;

    const positions = this.gridHelper.geometry.attributes.position;
    const terrainPositions = this.geometry.attributes.position;

    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      const z = positions.getZ(i);

      const height = this.getHeightAt(x, z);
      positions.setY(i, height + 0.05);
    }

    positions.needsUpdate = true;
  }

  public getHeightAt(worldX: number, worldZ: number): number {
    const halfSize = (this.size * this.unitSize) / 2;
    const localX = worldX + halfSize;
    const localZ = worldZ + halfSize;

    const gridX = Math.floor(localX / this.unitSize);
    const gridZ = Math.floor(localZ / this.unitSize);

    if (gridX < 0 || gridX >= this.size - 1 || gridZ < 0 || gridZ >= this.size - 1) {
      return 0;
    }

    const fx = (localX % this.unitSize) / this.unitSize;
    const fz = (localZ % this.unitSize) / this.unitSize;

    const idx00 = gridZ * this.size + gridX;
    const idx10 = gridZ * this.size + (gridX + 1);
    const idx01 = (gridZ + 1) * this.size + gridX;
    const idx11 = (gridZ + 1) * this.size + (gridX + 1);

    const h00 = this.geometry.attributes.position.getY(idx00);
    const h10 = this.geometry.attributes.position.getY(idx10);
    const h01 = this.geometry.attributes.position.getY(idx01);
    const h11 = this.geometry.attributes.position.getY(idx11);

    const h0 = h00 * (1 - fx) + h10 * fx;
    const h1 = h01 * (1 - fx) + h11 * fx;

    return h0 * (1 - fz) + h1 * fz;
  }

  public getGridPosition(worldX: number, worldZ: number): { x: number; z: number } | null {
    const halfSize = (this.size * this.unitSize) / 2;
    const localX = worldX + halfSize;
    const localZ = worldZ + halfSize;

    const gridX = Math.floor(localX / this.unitSize);
    const gridZ = Math.floor(localZ / this.unitSize);

    if (gridX < 0 || gridX >= this.size || gridZ < 0 || gridZ >= this.size) {
      return null;
    }

    return { x: gridX, z: gridZ };
  }

  public dispose(): void {
    this.finishTransition();
    this.geometry.dispose();
    this.material.dispose();
    this.textures.forEach(t => t.dispose());
    if (this.gridHelper) {
      this.gridHelper.geometry.dispose();
      (this.gridHelper.material as THREE.Material).dispose();
    }
  }
}
