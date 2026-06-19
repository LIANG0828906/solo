import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {
  eventBus,
  Cell,
  GemColor,
  GEM_COLOR_VALUES,
  GemPosition,
  FallingGemInfo,
  LevelUpData
} from './gameEngine';

interface GemMeshData {
  mesh: THREE.Mesh;
  gemId: string;
  row: number;
  col: number;
  isEliminating: boolean;
  eliminateProgress: number;
  isFalling: boolean;
  fallStartX: number;
  fallStartY: number;
  fallStartZ: number;
  fallTargetX: number;
  fallTargetY: number;
  fallTargetZ: number;
  fallProgress: number;
  fallDuration: number;
  baseX: number;
  baseY: number;
  baseZ: number;
}

interface ParticleData {
  mesh: THREE.Points;
  positions: Float32Array;
  velocities: Float32Array;
  life: number;
  maxLife: number;
  color: THREE.Color;
}

export class Renderer {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private controls: OrbitControls;
  private canvas: HTMLCanvasElement;
  private gemMeshes: Map<string, GemMeshData> = new Map();
  private cellMeshes: Map<string, THREE.Mesh> = new Map();
  private particles: ParticleData[] = [];
  private raycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;
  private animationId: number | null = null;
  private clock: THREE.Clock;
  private gemGeometry: THREE.OctahedronGeometry;
  private particleTexture: THREE.Texture;
  private gridGroup: THREE.Group;
  private gemsGroup: THREE.Group;
  private particlesGroup: THREE.Group;
  private backgroundLevel: number = 1;
  private backgroundTargetLevel: number = 1;
  private levelUpText: THREE.Sprite | null = null;
  private currentGridSize: number = 6;
  private cellSize: number = 1;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.scene = new THREE.Scene();
    this.clock = new THREE.Clock();
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.gemGeometry = new THREE.OctahedronGeometry(0.35, 0);
    this.particleTexture = this.createParticleTexture();

    this.gridGroup = new THREE.Group();
    this.gemsGroup = new THREE.Group();
    this.particlesGroup = new THREE.Group();

    this.scene.add(this.gridGroup);
    this.scene.add(this.gemsGroup);
    this.scene.add(this.particlesGroup);

    this.camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.1,
      100
    );
    this.camera.position.set(0, 6, 8);
    this.camera.lookAt(0, 0, 0);

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: true
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setClearColor(0x000000, 0);

    this.controls = new OrbitControls(this.camera, this.canvas);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.minDistance = 4;
    this.controls.maxDistance = 15;
    this.controls.maxPolarAngle = Math.PI / 2.2;
    this.controls.enablePan = false;
    this.controls.mouseButtons = {
      LEFT: null as unknown as THREE.MOUSE,
      MIDDLE: THREE.MOUSE.DOLLY,
      RIGHT: THREE.MOUSE.ROTATE
    };

    this.setupLights();
    this.setupEventListeners();
    this.setupEventBusListeners();
    this.animate();
  }

  private createParticleTexture(): THREE.Texture {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d')!;

    const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.3, 'rgba(255, 255, 255, 0.8)');
    gradient.addColorStop(0.6, 'rgba(255, 255, 255, 0.3)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 128, 128);

    ctx.globalCompositeOperation = 'source-atop';
    ctx.fillStyle = 'white';
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2 - Math.PI / 2;
      const r = i % 2 === 0 ? 50 : 25;
      const x = 64 + Math.cos(angle) * r;
      const y = 64 + Math.sin(angle) * r;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  }

  private setupLights(): void {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 10, 5);
    directionalLight.castShadow = true;
    this.scene.add(directionalLight);

    const pointLight = new THREE.PointLight(0x6688ff, 0.5, 20);
    pointLight.position.set(-3, 3, -3);
    this.scene.add(pointLight);
  }

  private setupEventListeners(): void {
    window.addEventListener('resize', this.onResize.bind(this));
    this.canvas.addEventListener('click', this.onCanvasClick.bind(this));
  }

  private setupEventBusListeners(): void {
    eventBus.on('grid-updated', this.onGridUpdated.bind(this));
    eventBus.on('gems-eliminated', this.onGemsEliminated.bind(this));
    eventBus.on('gems-falling', this.onGemsFalling.bind(this));
    eventBus.on('gem-invalid-click', this.onGemInvalidClick.bind(this));
    eventBus.on('level-up', this.onLevelUp.bind(this));
  }

  private onResize(): void {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  private onCanvasClick(event: MouseEvent): void {
    if (event.button !== 0) return;

    const rect = this.canvas.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);

    const allGemMeshes: THREE.Mesh[] = [];
    this.gemMeshes.forEach((data) => {
      if (!data.isEliminating) {
        allGemMeshes.push(data.mesh);
      }
    });

    const intersects = this.raycaster.intersectObjects(allGemMeshes);

    if (intersects.length > 0) {
      const clickedMesh = intersects[0].object as THREE.Mesh;
      const gemData = this.findGemDataByMesh(clickedMesh);
      if (gemData) {
        eventBus.emit('gem-clicked', {
          row: gemData.row,
          col: gemData.col
        });
      }
    }
  }

  private findGemDataByMesh(mesh: THREE.Mesh): GemMeshData | null {
    for (const [, data] of this.gemMeshes) {
      if (data.mesh === mesh) {
        return data;
      }
    }
    return null;
  }

  private onGridUpdated(data: {
    cells: Cell[][];
    gridSize: number;
    cellSize: number;
  }): void {
    this.currentGridSize = data.gridSize;
    this.cellSize = data.cellSize;
    this.rebuildGrid(data.cells);
  }

  private onGemsEliminated(data: { gems: GemPosition[] }): void {
    data.gems.forEach((gemPos) => {
      const gemData = this.gemMeshes.get(gemPos.gemId);
      if (gemData) {
        gemData.isEliminating = true;
        gemData.eliminateProgress = 0;
      }

      this.createParticles(
        gemPos.worldX,
        gemPos.worldY,
        gemPos.worldZ,
        gemPos.color
      );
    });
  }

  private onGemsFalling(data: { gems: FallingGemInfo[] }): void {
    data.gems.forEach((fallInfo) => {
      let gemData = this.gemMeshes.get(fallInfo.gem.id);

      if (!gemData) {
        gemData = this.createGemMesh(fallInfo.gem.color, fallInfo.targetRow, fallInfo.targetCol, fallInfo.gem.id);
        gemData.mesh.position.set(fallInfo.startX, fallInfo.startY, fallInfo.startZ);
      }

      gemData.row = fallInfo.targetRow;
      gemData.col = fallInfo.targetCol;
      gemData.isFalling = true;
      gemData.fallStartX = fallInfo.startX;
      gemData.fallStartY = fallInfo.startY;
      gemData.fallStartZ = fallInfo.startZ;
      gemData.fallTargetX = fallInfo.targetX;
      gemData.fallTargetY = fallInfo.targetY;
      gemData.fallTargetZ = fallInfo.targetZ;
      gemData.fallProgress = 0;
      gemData.baseX = fallInfo.targetX;
      gemData.baseY = fallInfo.targetY;
      gemData.baseZ = fallInfo.targetZ;

      const distance = Math.abs(fallInfo.targetY - fallInfo.startY);
      gemData.fallDuration = distance / 0.5;
    });
  }

  private onGemInvalidClick(data: { row: number; col: number }): void {
    const gemData = this.findGemByGridPosition(data.row, data.col);
    if (gemData && !gemData.isEliminating) {
      this.triggerInvalidClickAnimation(gemData);
    }
  }

  private findGemByGridPosition(row: number, col: number): GemMeshData | null {
    for (const [, gemData] of this.gemMeshes) {
      if (gemData.row === row && gemData.col === col && !gemData.isEliminating) {
        return gemData;
      }
    }
    return null;
  }

  private onLevelUp(data: LevelUpData): void {
    this.backgroundTargetLevel = data.level;
    this.showLevelUpText();
  }

  private showLevelUpText(): void {
    if (this.levelUpText) {
      this.particlesGroup.remove(this.levelUpText);
      this.levelUpText = null;
    }

    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;

    ctx.font = 'bold 120px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.shadowColor = '#ffd700';
    ctx.shadowBlur = 30;

    const gradient = ctx.createLinearGradient(0, 0, 0, 128);
    gradient.addColorStop(0, '#ffffff');
    gradient.addColorStop(0.5, '#ffd700');
    gradient.addColorStop(1, '#ff6b9d');
    ctx.fillStyle = gradient;

    ctx.fillText('Level Up!', 512, 128);

    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthTest: false
    });

    this.levelUpText = new THREE.Sprite(material);
    this.levelUpText.position.set(0, 2, 0);
    this.levelUpText.scale.set(6, 1.5, 1);
    this.particlesGroup.add(this.levelUpText);

    const startTime = performance.now();
    const duration = 2000;

    const animateText = () => {
      const elapsed = performance.now() - startTime;
      const progress = Math.min(1, elapsed / duration);

      if (this.levelUpText) {
        let scale: number;
        let opacity: number;

        if (progress < 0.2) {
          scale = progress / 0.2;
          opacity = progress / 0.2;
        } else if (progress < 0.8) {
          scale = 1;
          opacity = 1;
        } else {
          scale = 1 + (progress - 0.8) / 0.2 * 0.5;
          opacity = 1 - (progress - 0.8) / 0.2;
        }

        this.levelUpText.scale.set(6 * scale, 1.5 * scale, 1);
        this.levelUpText.material.opacity = opacity;
      }

      if (progress < 1) {
        requestAnimationFrame(animateText);
      } else {
        if (this.levelUpText) {
          this.particlesGroup.remove(this.levelUpText);
          this.levelUpText = null;
        }
      }
    };

    animateText();
  }

  private triggerInvalidClickAnimation(gemData: GemMeshData): void {
    const startTime = performance.now();
    const duration = 300;

    const animate = () => {
      const elapsed = performance.now() - startTime;
      const progress = Math.min(1, elapsed / duration);

      if (gemData.isEliminating) return;

      const pulse = Math.sin(progress * Math.PI * 2) * 0.2;
      const scale = 1 + pulse * 0.3;
      gemData.mesh.scale.setScalar(scale);

      const material = gemData.mesh.material as THREE.MeshStandardMaterial;
      material.emissiveIntensity = 0.3 + pulse * 0.5;

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        gemData.mesh.scale.setScalar(1);
        material.emissiveIntensity = 0.3;
      }
    };

    animate();
  }

  public buildGrid(cells: Cell[][]): void {
    this.clearGrid();
    this.rebuildGrid(cells);
  }

  private clearGrid(): void {
    this.cellMeshes.forEach((mesh) => {
      this.gridGroup.remove(mesh);
      mesh.geometry.dispose();
      (mesh.material as THREE.Material).dispose();
    });
    this.cellMeshes.clear();

    this.gemMeshes.forEach((data) => {
      this.gemsGroup.remove(data.mesh);
      data.mesh.geometry.dispose();
      (data.mesh.material as THREE.Material).dispose();
    });
    this.gemMeshes.clear();
  }

  private rebuildGrid(cells: Cell[][]): void {
    this.clearGrid();

    const gridSize = cells.length;
    const offset = ((gridSize - 1) * this.cellSize) / 2;

    for (let row = 0; row < gridSize; row++) {
      for (let col = 0; col < gridSize; col++) {
        const cell = cells[row][col];
        const x = col * this.cellSize - offset;
        const z = row * this.cellSize - offset;

        const cellMesh = this.createCellMesh(cell);
        cellMesh.position.set(x, cell.height / 2, z);
        this.gridGroup.add(cellMesh);
        this.cellMeshes.set(`${row},${col}`, cellMesh);

        if (!cell.isWall && cell.gem) {
          const gemData = this.createGemMesh(cell.gem.color, row, col, cell.gem.id);
          gemData.mesh.position.set(x, cell.height + 0.2, z);
          gemData.baseX = x;
          gemData.baseY = cell.height + 0.2;
          gemData.baseZ = z;
        }
      }
    }
  }

  private createCellMesh(cell: Cell): THREE.Mesh {
    const geometry = new THREE.BoxGeometry(0.95, cell.height || 0.05, 0.95);
    let color: number;

    if (cell.isWall) {
      color = 0x2a2a2a;
    } else {
      const t = (cell.height - 0.3) / 1.2;
      const r = Math.floor(50 + t * 30);
      const g = Math.floor(180 - t * 60);
      const b = Math.floor(80 + t * 40);
      color = (r << 16) | (g << 8) | b;
    }

    const material = new THREE.MeshStandardMaterial({
      color,
      transparent: true,
      opacity: cell.isWall ? 0.7 : 0.85,
      roughness: 0.7,
      metalness: 0.1
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.receiveShadow = true;
    mesh.castShadow = true;
    return mesh;
  }

  private createGemMesh(
    color: GemColor,
    row: number,
    col: number,
    gemId?: string
  ): GemMeshData {
    const colorValue = GEM_COLOR_VALUES[color];
    const material = new THREE.MeshStandardMaterial({
      color: colorValue,
      emissive: colorValue,
      emissiveIntensity: 0.3,
      roughness: 0.2,
      metalness: 0.8,
      transparent: true,
      opacity: 1
    });

    const mesh = new THREE.Mesh(this.gemGeometry, material);
    mesh.castShadow = true;

    const offset = ((this.currentGridSize - 1) * this.cellSize) / 2;
    const x = col * this.cellSize - offset;
    const z = row * this.cellSize - offset;

    mesh.position.set(x, 0.5, z);
    this.gemsGroup.add(mesh);

    const id = gemId || `gem_${row}_${col}`;

    const gemData: GemMeshData = {
      mesh,
      gemId: id,
      row,
      col,
      isEliminating: false,
      eliminateProgress: 0,
      isFalling: false,
      fallStartX: 0,
      fallStartY: 0,
      fallStartZ: 0,
      fallTargetX: 0,
      fallTargetY: 0,
      fallTargetZ: 0,
      fallProgress: 0,
      fallDuration: 0,
      baseX: x,
      baseY: 0.5,
      baseZ: z
    };

    this.gemMeshes.set(id, gemData);
    return gemData;
  }

  private createParticles(
    x: number,
    y: number,
    z: number,
    color: GemColor
  ): void {
    const particleCount = 20;
    const positions = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount * 3);

    const colorValue = new THREE.Color(GEM_COLOR_VALUES[color]);

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      positions[i3] = x;
      positions[i3 + 1] = y;
      positions[i3 + 2] = z;

      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      const speed = 1 + Math.random() * 2;
      velocities[i3] = Math.sin(phi) * Math.cos(theta) * speed;
      velocities[i3 + 1] = Math.cos(phi) * speed + 1;
      velocities[i3 + 2] = Math.sin(phi) * Math.sin(theta) * speed;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
      size: 0.15,
      map: this.particleTexture,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      color: colorValue,
      opacity: 1
    });

    const points = new THREE.Points(geometry, material);
    this.particlesGroup.add(points);

    this.particles.push({
      mesh: points,
      positions,
      velocities,
      life: 0,
      maxLife: 1,
      color: colorValue
    });
  }

  private animate(): void {
    this.animationId = requestAnimationFrame(this.animate.bind(this));

    const delta = this.clock.getDelta();

    this.controls.update();
    this.updateBackground(delta);
    this.updateGems(delta);
    this.updateParticles(delta);
    this.updateFloatingGems(delta);

    this.renderer.render(this.scene, this.camera);
  }

  private updateBackground(_delta: number): void {
    if (this.backgroundLevel !== this.backgroundTargetLevel) {
      const app = document.getElementById('app');
      if (app) {
        if (this.backgroundTargetLevel >= 2) {
          app.classList.add('level-2');
        } else {
          app.classList.remove('level-2');
        }
      }
      this.backgroundLevel = this.backgroundTargetLevel;
    }
  }

  private updateGems(delta: number): void {
    const eliminateDuration = 0.6;

    const toRemove: string[] = [];

    this.gemMeshes.forEach((gemData, gemId) => {
      if (gemData.isEliminating) {
        gemData.eliminateProgress += delta;
        const t = Math.min(1, gemData.eliminateProgress / eliminateDuration);

        gemData.mesh.scale.setScalar(1 - t);
        gemData.mesh.position.y = gemData.baseY + t * 1.5;

        const material = gemData.mesh.material as THREE.MeshStandardMaterial;
        material.opacity = 1 - t;

        if (t >= 1) {
          toRemove.push(gemId);
        }
      }

      if (gemData.isFalling && !gemData.isEliminating) {
        gemData.fallProgress += delta;

        const t = Math.min(1, gemData.fallProgress / gemData.fallDuration);
        const eased = 1 - Math.pow(1 - t, 3);

        gemData.mesh.position.x = gemData.fallStartX + (gemData.fallTargetX - gemData.fallStartX) * eased;
        gemData.mesh.position.y = gemData.fallStartY + (gemData.fallTargetY - gemData.fallStartY) * eased;
        gemData.mesh.position.z = gemData.fallStartZ + (gemData.fallTargetZ - gemData.fallStartZ) * eased;

        if (t >= 1) {
          gemData.isFalling = false;
          gemData.mesh.position.set(gemData.fallTargetX, gemData.fallTargetY, gemData.fallTargetZ);
          gemData.baseX = gemData.fallTargetX;
          gemData.baseY = gemData.fallTargetY;
          gemData.baseZ = gemData.fallTargetZ;
        }
      }
    });

    toRemove.forEach((gemId) => {
      const gemData = this.gemMeshes.get(gemId);
      if (gemData) {
        this.gemsGroup.remove(gemData.mesh);
        (gemData.mesh.material as THREE.Material).dispose();
        this.gemMeshes.delete(gemId);
      }
    });
  }

  private updateFloatingGems(delta: number): void {
    const time = this.clock.getElapsedTime();

    this.gemMeshes.forEach((gemData) => {
      if (!gemData.isEliminating && !gemData.isFalling) {
        const floatOffset = Math.sin(time * 2 + gemData.row + gemData.col) * 0.05;
        gemData.mesh.position.y = gemData.baseY + floatOffset;
        gemData.mesh.rotation.y += delta * 0.5;
      }
    });
  }

  private updateParticles(delta: number): void {
    const toRemove: number[] = [];

    this.particles.forEach((particle, index) => {
      particle.life += delta;
      const t = particle.life / particle.maxLife;

      const positions = particle.mesh.geometry.attributes.position.array as Float32Array;

      for (let i = 0; i < 20; i++) {
        const i3 = i * 3;
        positions[i3] += particle.velocities[i3] * delta;
        positions[i3 + 1] += particle.velocities[i3 + 1] * delta;
        positions[i3 + 2] += particle.velocities[i3 + 2] * delta;

        particle.velocities[i3 + 1] -= delta * 2;
      }

      particle.mesh.geometry.attributes.position.needsUpdate = true;

      const material = particle.mesh.material as THREE.PointsMaterial;
      material.opacity = 1 - t;
      material.size = 0.15 * (1 - t * 0.5);

      if (t >= 1) {
        toRemove.push(index);
      }
    });

    toRemove.reverse().forEach((index) => {
      const particle = this.particles[index];
      this.particlesGroup.remove(particle.mesh);
      particle.mesh.geometry.dispose();
      (particle.mesh.material as THREE.Material).dispose();
      this.particles.splice(index, 1);
    });
  }

  public dispose(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
    }
    window.removeEventListener('resize', this.onResize.bind(this));
    this.canvas.removeEventListener('click', this.onCanvasClick.bind(this));
    this.renderer.dispose();
  }

  public getCamera(): THREE.PerspectiveCamera {
    return this.camera;
  }

  public getScene(): THREE.Scene {
    return this.scene;
  }
}
