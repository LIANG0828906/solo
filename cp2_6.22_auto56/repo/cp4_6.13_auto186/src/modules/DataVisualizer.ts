import * as THREE from 'three';
import type { OceanDataset, VisualizerConfig, ColorScheme, GridCell } from '../types';
import { DEPTH_LEVELS, DEPTH_Y_POSITIONS, GRID_SIZE, PARTICLE_COUNT, TEMP_MIN, TEMP_MAX, BAR_MAX_HEIGHT } from '../types';

export interface BarClickInfo {
  layerIdx: number;
  row: number;
  col: number;
  depth: number;
  temperature: number;
  salinity: number;
  velocity: number;
  position: THREE.Vector3;
}

const BAR_RADIUS = 3;
const GRID_SPACING = 12;
const BAR_SEGMENTS = 16;
const PARTICLES_PER_GAP = 2000;
const NUM_LAYERS = 6;

export class DataVisualizer {
  private scene: THREE.Scene;
  private dataset: OceanDataset | null = null;
  private config: VisualizerConfig;

  private barInstances: THREE.InstancedMesh[] = [];
  private particleSystem: THREE.Points | null = null;
  private particleVelocities: Float32Array | null = null;
  private particleBaseSpeeds: Float32Array | null = null;
  private layerGroups: THREE.Group[] = [];

  private selectedBar: {
    mesh: THREE.InstancedMesh;
    instanceId: number;
    layerIdx: number;
    originalMatrix: THREE.Matrix4;
  } | null = null;
  private tooltipTimeout: ReturnType<typeof setTimeout> | null = null;

  private targetHeights: number[][][] = [];
  private currentHeights: number[][][] = [];
  private targetColors: THREE.Color[][][] = [];
  private currentColors: THREE.Color[][][] = [];
  private colorTransitionProgress = 1;

  private barGeometry: THREE.CylinderGeometry;
  private barMaterial: THREE.MeshPhongMaterial;

  onBarClick: ((info: BarClickInfo) => void) | null = null;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.config = {
      visibleLayers: Array(NUM_LAYERS).fill(true) as boolean[],
      velocityScale: 1,
      colorScheme: 'thermal',
      autoRotate: false,
      showParticles: true,
    };

    this.barGeometry = new THREE.CylinderGeometry(
      BAR_RADIUS, BAR_RADIUS, 1, BAR_SEGMENTS
    );
    this.barGeometry.translate(0, 0.5, 0);

    this.barMaterial = new THREE.MeshPhongMaterial({
      vertexColors: false,
      shininess: 60,
      transparent: true,
      opacity: 0.92,
    });

    this.initLayerGroups();
  }

  private initLayerGroups() {
    for (let i = 0; i < NUM_LAYERS; i++) {
      const group = new THREE.Group();
      group.visible = this.config.visibleLayers[i];
      this.scene.add(group);
      this.layerGroups.push(group);
    }
  }

  setData(dataset: OceanDataset) {
    this.dataset = dataset;
    this.clearAll();
    this.initHeightArrays();
    this.createBars();
    this.createParticles();
    this.applyInitialHeights();
  }

  private clearAll() {
    this.barInstances.forEach(m => {
      m.geometry !== this.barGeometry && m.geometry.dispose();
      m.dispose();
    });
    this.barInstances = [];

    this.layerGroups.forEach(g => {
      while (g.children.length > 0) {
        const child = g.children[0];
        g.remove(child);
        if (child instanceof THREE.Mesh || child instanceof THREE.Points) {
          child.geometry?.dispose();
          if (child.material instanceof THREE.Material) child.material.dispose();
        }
      }
    });

    if (this.particleSystem) {
      this.particleSystem.geometry.dispose();
      if (this.particleSystem.material instanceof THREE.Material) {
        this.particleSystem.material.dispose();
      }
      this.particleSystem = null;
    }
  }

  private initHeightArrays() {
    this.targetHeights = [];
    this.currentHeights = [];
    this.targetColors = [];
    this.currentColors = [];

    for (let l = 0; l < NUM_LAYERS; l++) {
      this.targetHeights[l] = [];
      this.currentHeights[l] = [];
      this.targetColors[l] = [];
      this.currentColors[l] = [];
      const grid = this.dataset!.layers[l].grid;

      for (let r = 0; r < GRID_SIZE; r++) {
        this.targetHeights[l][r] = [];
        this.currentHeights[l][r] = [];
        this.targetColors[l][r] = [];
        this.currentColors[l][r] = [];
        for (let c = 0; c < GRID_SIZE; c++) {
          const cell = grid[r][c];
          const h = this.tempToHeight(cell.temperature);
          this.targetHeights[l][r][c] = h;
          this.currentHeights[l][r][c] = 0;
          const color = this.tempToColor(cell.temperature, this.config.colorScheme);
          this.targetColors[l][r][c] = color.clone();
          this.currentColors[l][r][c] = color.clone();
        }
      }
    }
  }

  private createBars() {
    const dummy = new THREE.Object3D();
    const color = new THREE.Color();

    for (let l = 0; l < NUM_LAYERS; l++) {
      const instanceCount = GRID_SIZE * GRID_SIZE;
      const instancedMesh = new THREE.InstancedMesh(
        this.barGeometry,
        this.barMaterial.clone(),
        instanceCount
      );
      instancedMesh.userData.layerIdx = l;

      const layerY = DEPTH_Y_POSITIONS[l];

      for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
          const idx = r * GRID_SIZE + c;
          const x = (c - (GRID_SIZE - 1) / 2) * GRID_SPACING;
          const z = (r - (GRID_SIZE - 1) / 2) * GRID_SPACING;
          const h = this.targetHeights[l][r][c];

          dummy.position.set(x, layerY, z);
          dummy.scale.set(1, Math.max(0.01, h), 1);
          dummy.updateMatrix();
          instancedMesh.setMatrixAt(idx, dummy.matrix);

          color.copy(this.targetColors[l][r][c]);
          instancedMesh.setColorAt(idx, color);
        }
      }

      instancedMesh.instanceMatrix.needsUpdate = true;
      if (instancedMesh.instanceColor) instancedMesh.instanceColor.needsUpdate = true;

      instancedMesh.castShadow = true;
      instancedMesh.receiveShadow = true;

      this.layerGroups[l].add(instancedMesh);
      this.barInstances.push(instancedMesh);
    }
  }

  private createParticles() {
    if (!this.dataset) return;

    const totalParticles = PARTICLES_PER_GAP * (NUM_LAYERS - 1);
    const positions = new Float32Array(totalParticles * 3);
    const colors = new Float32Array(totalParticles * 3);
    const sizes = new Float32Array(totalParticles);
    this.particleVelocities = new Float32Array(totalParticles * 3);
    this.particleBaseSpeeds = new Float32Array(totalParticles);

    let pIdx = 0;

    for (let gap = 0; gap < NUM_LAYERS - 1; gap++) {
      const yTop = DEPTH_Y_POSITIONS[gap];
      const yBottom = DEPTH_Y_POSITIONS[gap + 1];
      const gridBelow = this.dataset.layers[gap + 1].grid;

      for (let i = 0; i < PARTICLES_PER_GAP; i++) {
        const x = (Math.random() - 0.5) * (GRID_SIZE - 1) * GRID_SPACING * 1.2;
        const z = (Math.random() - 0.5) * (GRID_SIZE - 1) * GRID_SPACING * 1.2;
        const y = yBottom + Math.random() * (yTop - yBottom);

        positions[pIdx * 3] = x;
        positions[pIdx * 3 + 1] = y;
        positions[pIdx * 3 + 2] = z;

        const gridR = Math.floor(Math.random() * GRID_SIZE);
        const gridC = Math.floor(Math.random() * GRID_SIZE);
        const cell = gridBelow[gridR][gridC];

        const dir = cell.velocityDir;
        const speed = 0.1 + Math.random() * 0.4;
        this.particleVelocities[pIdx * 3] = Math.cos(dir) * speed;
        this.particleVelocities[pIdx * 3 + 1] = 0;
        this.particleVelocities[pIdx * 3 + 2] = Math.sin(dir) * speed;
        this.particleBaseSpeeds[pIdx] = speed;

        const pColor = this.salinityToColor(cell.salinity);
        colors[pIdx * 3] = pColor.r;
        colors[pIdx * 3 + 1] = pColor.g;
        colors[pIdx * 3 + 2] = pColor.b;

        sizes[pIdx] = 2 + Math.random() * 3;

        pIdx++;
      }
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('customColor', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const material = new THREE.ShaderMaterial({
      uniforms: {
        viewportHeight: { value: window.innerHeight },
      },
      vertexShader: `
        attribute float size;
        attribute vec3 customColor;
        varying vec3 vColor;
        varying float vAlpha;
        void main() {
          vColor = customColor;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size * (200.0 / -mvPosition.z);
          gl_PointSize = clamp(gl_PointSize, 1.0, 20.0);
          gl_Position = projectionMatrix * mvPosition;
          vAlpha = smoothstep(600.0, 100.0, -mvPosition.z);
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        varying float vAlpha;
        void main() {
          float dist = length(gl_PointCoord - vec2(0.5));
          if (dist > 0.5) discard;
          float alpha = (1.0 - smoothstep(0.2, 0.5, dist)) * 0.7 * vAlpha;
          gl_FragColor = vec4(vColor, alpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    this.particleSystem = new THREE.Points(geometry, material);
    this.scene.add(this.particleSystem);
    this.particleSystem.visible = this.config.showParticles;
  }

  private applyInitialHeights() {
    for (let l = 0; l < NUM_LAYERS; l++) {
      for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
          this.currentHeights[l][r][c] = this.targetHeights[l][r][c];
        }
      }
    }
    this.updateBarMatrices();
  }

  updateConfig(config: VisualizerConfig) {
    const prevScheme = this.config.colorScheme;
    this.config = { ...config };

    for (let i = 0; i < NUM_LAYERS; i++) {
      this.layerGroups[i].visible = config.visibleLayers[i];
    }

    if (this.particleSystem) {
      this.particleSystem.visible = config.showParticles;
    }

    if (prevScheme !== config.colorScheme && this.dataset) {
      this.recalculateColors();
      this.colorTransitionProgress = 0;
    }
  }

  private recalculateColors() {
    if (!this.dataset) return;
    for (let l = 0; l < NUM_LAYERS; l++) {
      const grid = this.dataset.layers[l].grid;
      for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
          this.currentColors[l][r][c] = this.tempToColor(grid[r][c].temperature, this.config.colorScheme);
          this.targetColors[l][r][c] = this.tempToColor(grid[r][c].temperature, this.config.colorScheme);
        }
      }
    }
  }

  updateTimePoint(index: number) {
    if (!this.dataset) return;
    this.dataset.currentTimeIndex = index;
    this.recalculateForCurrentData();
  }

  private recalculateForCurrentData() {
    if (!this.dataset) return;
    for (let l = 0; l < NUM_LAYERS; l++) {
      const grid = this.dataset.layers[l].grid;
      for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
          const cell = grid[r][c];
          this.targetHeights[l][r][c] = this.tempToHeight(cell.temperature);
          this.targetColors[l][r][c] = this.tempToColor(cell.temperature, this.config.colorScheme);
        }
      }
    }
  }

  update(deltaTime: number) {
    this.animateBarHeights(deltaTime);
    this.animateColorTransition(deltaTime);
    this.animateParticles(deltaTime);
    this.animateSelectedBar(deltaTime);
  }

  private animateBarHeights(deltaTime: number) {
    const lerpSpeed = 3.0;
    let needsUpdate = false;

    for (let l = 0; l < NUM_LAYERS; l++) {
      for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
          const target = this.targetHeights[l][r][c];
          const current = this.currentHeights[l][r][c];
          if (Math.abs(target - current) > 0.01) {
            this.currentHeights[l][r][c] += (target - current) * Math.min(1, lerpSpeed * deltaTime);
            needsUpdate = true;
          }
        }
      }
    }

    if (needsUpdate) {
      this.updateBarMatrices();
    }
  }

  private animateColorTransition(deltaTime: number) {
    if (this.colorTransitionProgress >= 1) return;

    this.colorTransitionProgress = Math.min(1, this.colorTransitionProgress + deltaTime / 0.5);
    const t = this.colorTransitionProgress;

    for (let l = 0; l < NUM_LAYERS; l++) {
      const mesh = this.barInstances[l];
      if (!mesh || !mesh.instanceColor) continue;
      const color = new THREE.Color();

      for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
          const idx = r * GRID_SIZE + c;
          color.copy(this.currentColors[l][r][c]).lerp(this.targetColors[l][r][c], t);
          mesh.setColorAt(idx, color);
        }
      }
      mesh.instanceColor.needsUpdate = true;
    }

    if (this.colorTransitionProgress >= 1) {
      for (let l = 0; l < NUM_LAYERS; l++) {
        for (let r = 0; r < GRID_SIZE; r++) {
          for (let c = 0; c < GRID_SIZE; c++) {
            this.currentColors[l][r][c].copy(this.targetColors[l][r][c]);
          }
        }
      }
    }
  }

  private animateParticles(deltaTime: number) {
    if (!this.particleSystem || !this.particleVelocities || !this.particleBaseSpeeds) return;
    if (!this.config.showParticles) return;

    const positions = this.particleSystem.geometry.attributes.position as THREE.BufferAttribute;
    const posArray = positions.array as Float32Array;
    const scale = this.config.velocityScale;
    const halfExtent = ((GRID_SIZE - 1) * GRID_SPACING) / 2 * 1.2;

    for (let i = 0; i < posArray.length / 3; i++) {
      const vx = this.particleVelocities[i * 3] * scale;
      const vz = this.particleVelocities[i * 3 + 2] * scale;

      posArray[i * 3] += vx * deltaTime;
      posArray[i * 3 + 2] += vz * deltaTime;

      if (posArray[i * 3] > halfExtent) posArray[i * 3] = -halfExtent;
      if (posArray[i * 3] < -halfExtent) posArray[i * 3] = halfExtent;
      if (posArray[i * 3 + 2] > halfExtent) posArray[i * 3 + 2] = -halfExtent;
      if (posArray[i * 3 + 2] < -halfExtent) posArray[i * 3 + 2] = halfExtent;
    }

    positions.needsUpdate = true;
  }

  private animateSelectedBar(deltaTime: number) {
    if (!this.selectedBar) return;
  }

  private updateBarMatrices() {
    const dummy = new THREE.Object3D();

    for (let l = 0; l < NUM_LAYERS; l++) {
      const mesh = this.barInstances[l];
      if (!mesh) continue;
      const layerY = DEPTH_Y_POSITIONS[l];

      for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
          const idx = r * GRID_SIZE + c;
          const x = (c - (GRID_SIZE - 1) / 2) * GRID_SPACING;
          const z = (r - (GRID_SIZE - 1) / 2) * GRID_SPACING;
          const h = Math.max(0.01, this.currentHeights[l][r][c]);

          dummy.position.set(x, layerY, z);
          dummy.scale.set(1, h, 1);
          dummy.updateMatrix();
          mesh.setMatrixAt(idx, dummy.matrix);
        }
      }
      mesh.instanceMatrix.needsUpdate = true;
    }
  }

  handleClick(mouse: THREE.Vector2, camera: THREE.Camera): BarClickInfo | null {
    if (!this.dataset) return null;

    this.raycaster.setFromCamera(mouse, camera);
    this.restoreSelectedBar();

    for (let l = 0; l < NUM_LAYERS; l++) {
      if (!this.config.visibleLayers[l]) continue;
      const mesh = this.barInstances[l];
      if (!mesh) continue;

      const intersects = this.raycaster.intersectObject(mesh);
      if (intersects.length > 0 && intersects[0].instanceId !== undefined) {
        const instanceId = intersects[0].instanceId;
        const row = Math.floor(instanceId / GRID_SIZE);
        const col = instanceId % GRID_SIZE;
        const cell = this.dataset.layers[l].grid[row][col];

        const originalMatrix = new THREE.Matrix4();
        mesh.getMatrixAt(instanceId, originalMatrix);

        this.selectedBar = { mesh, instanceId, layerIdx: l, originalMatrix };

        const scaledMatrix = new THREE.Matrix4();
        const pos = new THREE.Vector3();
        const quat = new THREE.Quaternion();
        const scale = new THREE.Vector3();
        originalMatrix.decompose(pos, quat, scale);
        scale.multiplyScalar(1.5);
        scaledMatrix.compose(pos, quat, scale);
        mesh.setMatrixAt(instanceId, scaledMatrix);
        mesh.instanceMatrix.needsUpdate = true;

        const worldPos = new THREE.Vector3();
        pos.setY(pos.y + this.currentHeights[l][row][col]);
        worldPos.copy(pos);

        this.scheduleBarRestore();

        return {
          layerIdx: l,
          row,
          col,
          depth: DEPTH_LEVELS[l],
          temperature: cell.temperature,
          salinity: cell.salinity,
          velocity: cell.velocity,
          position: worldPos,
        };
      }
    }
    return null;
  }

  private scheduleBarRestore() {
    if (this.tooltipTimeout) clearTimeout(this.tooltipTimeout);
    this.tooltipTimeout = setTimeout(() => {
      this.restoreSelectedBar();
    }, 2000);
  }

  private restoreSelectedBar() {
    if (!this.selectedBar) return;
    const { mesh, instanceId, originalMatrix } = this.selectedBar;
    mesh.setMatrixAt(instanceId, originalMatrix);
    mesh.instanceMatrix.needsUpdate = true;
    this.selectedBar = null;
  }

  private tempToHeight(temp: number): number {
    const t = (temp - TEMP_MIN) / (TEMP_MAX - TEMP_MIN);
    return Math.max(0, Math.min(1, t)) * BAR_MAX_HEIGHT;
  }

  private tempToColor(temp: number, scheme: ColorScheme): THREE.Color {
    const t = Math.max(0, Math.min(1, (temp - TEMP_MIN) / (TEMP_MAX - TEMP_MIN)));
    const color = new THREE.Color();

    switch (scheme) {
      case 'thermal': {
        if (t < 0.25) {
          color.setRGB(0, t * 4 * 0.545, 0.545 + t * 4 * 0.455);
        } else if (t < 0.5) {
          const lt = (t - 0.25) * 4;
          color.setRGB(lt * 0.5, 0.545 + lt * 0.455, 1 - lt * 0.3);
        } else if (t < 0.75) {
          const lt = (t - 0.5) * 4;
          color.setRGB(0.5 + lt * 0.5, 1 - lt * 0.2, 0.7 - lt * 0.7);
        } else {
          const lt = (t - 0.75) * 4;
          color.setRGB(1, 0.8 - lt * 0.529, lt * 0.1);
        }
        break;
      }
      case 'cool': {
        if (t < 0.33) {
          const lt = t * 3;
          color.setRGB(0.545 * (1 - lt), 0, 0.545 + lt * 0.455);
        } else if (t < 0.66) {
          const lt = (t - 0.33) * 3;
          color.setRGB(0, lt * 0.5, 1);
        } else {
          const lt = (t - 0.66) * 3;
          color.setRGB(0, 0.5 + lt * 0.5, 1 - lt * 0.3);
        }
        break;
      }
      case 'monochrome': {
        const v = 0.2 + t * 0.8;
        color.setRGB(v, v, v);
        break;
      }
    }
    return color;
  }

  private salinityToColor(salinity: number): THREE.Color {
    const minSal = 33;
    const maxSal = 37;
    const t = Math.max(0, Math.min(1, (salinity - minSal) / (maxSal - minSal)));
    const lightBlue = new THREE.Color(0x87CEEB);
    const deepPurple = new THREE.Color(0x8B008B);
    return lightBlue.clone().lerp(deepPurple, t);
  }

  getBarCount(): number {
    let count = 0;
    for (let i = 0; i < NUM_LAYERS; i++) {
      if (this.config.visibleLayers[i]) count += GRID_SIZE * GRID_SIZE;
    }
    return count;
  }

  getParticleCount(): number {
    return this.config.showParticles && this.particleSystem
      ? (this.particleSystem.geometry.attributes.position as THREE.BufferAttribute).count
      : 0;
  }

  dispose() {
    this.clearAll();
    this.barGeometry.dispose();
    this.barMaterial.dispose();
    if (this.tooltipTimeout) clearTimeout(this.tooltipTimeout);
  }
}
