import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { BeeRole, BEE_COLORS, BeeState, PheromoneGrid } from '@/engine/BeeAgent';

const HEX_SIZE = 10;
const HEX_DEPTH = 5;
const HONEYCOMB_LAYERS = 3;
const COMB_COLOR = 0xD4A574;
const COMB_ALPHA = 0.3;
const BEE_RADIUS = 0.3;
const TRAIL_AUTO_DISABLE_THRESHOLD = 150;

export interface RendererOptions {
  container: HTMLElement;
  gridSize: number;
  cellSize: number;
}

export class Renderer {
  private container: HTMLElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private controls: OrbitControls;
  private clock: THREE.Clock;

  private honeycombGroup: THREE.Group;
  private beesGroup: THREE.Group;
  private trailsGroup: THREE.Group;
  private heatmapGroup: THREE.Group;

  private beeMeshes: Map<number, THREE.InstancedMesh> = new Map();
  private trailMeshes: Map<number, THREE.Points> = new Map();
  private heatmapPlanes: THREE.Mesh[] = [];
  private heatmapDataTexture: THREE.DataTexture | null = null;

  private heatmapVisible: boolean = false;
  private trailsVisible: boolean = true;
  private gridSize: number;
  private cellSize: number;

  private dummy: THREE.Object3D;

  constructor(options: RendererOptions) {
    this.container = options.container;
    this.gridSize = options.gridSize;
    this.cellSize = options.cellSize;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x1E1510);
    this.scene.fog = new THREE.FogExp2(0x1E1510, 0.008);

    this.camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.camera.position.set(0, 20, 50);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;

    this.container.appendChild(this.renderer.domElement);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.minDistance = 20;
    this.controls.maxDistance = 100;
    this.controls.maxPolarAngle = Math.PI * 0.9;

    this.clock = new THREE.Clock();
    this.dummy = new THREE.Object3D();

    this.honeycombGroup = new THREE.Group();
    this.beesGroup = new THREE.Group();
    this.trailsGroup = new THREE.Group();
    this.heatmapGroup = new THREE.Group();

    this.scene.add(this.honeycombGroup);
    this.scene.add(this.beesGroup);
    this.scene.add(this.trailsGroup);
    this.scene.add(this.heatmapGroup);

    this.initLights();
    this.createHoneycomb();
    this.createHeatmap();

    window.addEventListener('resize', this.onResize.bind(this));
  }

  private initLights(): void {
    const ambientLight = new THREE.AmbientLight(0xFFD700, 0.3);
    this.scene.add(ambientLight);

    const hemisphereLight = new THREE.HemisphereLight(0xFFD700, 0x8B4513, 0.5);
    this.scene.add(hemisphereLight);

    const directionalLight = new THREE.DirectionalLight(0xFFFAF0, 1);
    directionalLight.position.set(10, 20, 15);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 100;
    directionalLight.shadow.camera.left = -30;
    directionalLight.shadow.camera.right = 30;
    directionalLight.shadow.camera.top = 30;
    directionalLight.shadow.camera.bottom = -30;
    this.scene.add(directionalLight);

    const pointLight = new THREE.PointLight(0xFFA500, 0.5, 50);
    pointLight.position.set(0, 0, 0);
    this.scene.add(pointLight);
  }

  private createHoneycomb(): void {
    const hexGeometry = this.createHexagonGeometry(HEX_SIZE, HEX_DEPTH);
    const hexMaterial = new THREE.MeshPhysicalMaterial({
      color: COMB_COLOR,
      transparent: true,
      opacity: COMB_ALPHA,
      roughness: 0.3,
      metalness: 0.1,
      transmission: 0.5,
      thickness: 0.5,
      side: THREE.DoubleSide
    });

    const edgeMaterial = new THREE.LineBasicMaterial({
      color: 0xFFD700,
      transparent: true,
      opacity: 0.4
    });

    for (let layer = 0; layer < HONEYCOMB_LAYERS; layer++) {
      const layerGroup = new THREE.Group();
      const zOffset = (layer - (HONEYCOMB_LAYERS - 1) / 2) * HEX_DEPTH * 1.2;

      const hexPositions = this.generateHexGrid(3);
      for (const pos of hexPositions) {
        const hexMesh = new THREE.Mesh(hexGeometry, hexMaterial);
        hexMesh.position.set(pos.x, pos.y, zOffset);
        hexMesh.castShadow = true;
        hexMesh.receiveShadow = true;
        layerGroup.add(hexMesh);

        const edges = new THREE.EdgesGeometry(hexGeometry);
        const line = new THREE.LineSegments(edges, edgeMaterial);
        line.position.copy(hexMesh.position);
        layerGroup.add(line);
      }

      this.honeycombGroup.add(layerGroup);
    }
  }

  private createHexagonGeometry(size: number, depth: number): THREE.ExtrudeGeometry {
    const shape = new THREE.Shape();
    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI) / 3;
      const x = Math.cos(angle) * size;
      const y = Math.sin(angle) * size;
      if (i === 0) {
        shape.moveTo(x, y);
      } else {
        shape.lineTo(x, y);
      }
    }
    shape.closePath();

    const innerShape = new THREE.Path();
    const innerSize = size * 0.85;
    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI) / 3;
      const x = Math.cos(angle) * innerSize;
      const y = Math.sin(angle) * innerSize;
      if (i === 0) {
        innerShape.moveTo(x, y);
      } else {
        innerShape.lineTo(x, y);
      }
    }
    innerShape.closePath();
    shape.holes.push(innerShape);

    const extrudeSettings = {
      depth: depth,
      bevelEnabled: true,
      bevelThickness: 0.2,
      bevelSize: 0.2,
      bevelSegments: 2
    };

    return new THREE.ExtrudeGeometry(shape, extrudeSettings);
  }

  private generateHexGrid(radius: number): { x: number; y: number }[] {
    const positions: { x: number; y: number }[] = [];
    const hexWidth = HEX_SIZE * 1.732;
    const hexHeight = HEX_SIZE * 2;

    for (let q = -radius; q <= radius; q++) {
      for (let r = -radius; r <= radius; r++) {
        if (Math.abs(q + r) <= radius) {
          const x = hexWidth * (q + r / 2);
          const y = hexHeight * r * 0.75;
          positions.push({ x, y });
        }
      }
    }
    return positions;
  }

  private createHeatmap(): void {
    const halfGrid = this.gridSize / 2;
    const planeSize = this.gridSize * this.cellSize;

    const heatmapMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTexture: { value: null },
        uGridSize: { value: this.gridSize },
        uOpacity: { value: 0.6 }
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D uTexture;
        uniform float uGridSize;
        uniform float uOpacity;
        varying vec2 vUv;

        void main() {
          vec4 color = texture2D(uTexture, vUv);
          float alpha = max(max(color.r, color.g), color.b) * uOpacity;
          gl_FragColor = vec4(color.rgb, alpha);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    for (let z = 0; z < 3; z++) {
      const geometry = new THREE.PlaneGeometry(planeSize, planeSize);
      const plane = new THREE.Mesh(geometry, heatmapMaterial.clone());
      plane.position.z = (z - 1) * this.cellSize * 2;
      plane.rotation.x = -Math.PI / 2;
      plane.visible = this.heatmapVisible;
      this.heatmapPlanes.push(plane);
      this.heatmapGroup.add(plane);
    }

    const data = new Uint8Array(this.gridSize * this.gridSize * 4);
    this.heatmapDataTexture = new THREE.DataTexture(
      data,
      this.gridSize,
      this.gridSize,
      THREE.RGBAFormat
    );
    this.heatmapDataTexture.needsUpdate = true;
  }

  updateBees(beeStates: BeeState[], currentTime: number): void {
    const roleGroups: Map<BeeRole, BeeState[]> = new Map();
    
    for (const bee of beeStates) {
      if (!roleGroups.has(bee.role)) {
        roleGroups.set(bee.role, []);
      }
      roleGroups.get(bee.role)!.push(bee);
    }

    const beeGeometry = new THREE.SphereGeometry(BEE_RADIUS, 8, 6);

    for (const [role, bees] of roleGroups) {
      const color = new THREE.Color(BEE_COLORS[role]);
      const material = new THREE.MeshStandardMaterial({
        color: color,
        emissive: color,
        emissiveIntensity: 0.2,
        roughness: 0.5,
        metalness: 0.3
      });

      let instancedMesh = this.beeMeshes.get(role as unknown as number);
      if (!instancedMesh || instancedMesh.count !== bees.length) {
        if (instancedMesh) {
          this.beesGroup.remove(instancedMesh);
          instancedMesh.geometry.dispose();
          (instancedMesh.material as THREE.Material).dispose();
        }
        instancedMesh = new THREE.InstancedMesh(beeGeometry, material, bees.length);
        instancedMesh.castShadow = true;
        instancedMesh.receiveShadow = true;
        this.beeMeshes.set(role as unknown as number, instancedMesh);
        this.beesGroup.add(instancedMesh);
      }

      for (let i = 0; i < bees.length; i++) {
        this.dummy.position.copy(bees[i].position);
        this.dummy.updateMatrix();
        instancedMesh.setMatrixAt(i, this.dummy.matrix);
      }
      instancedMesh.instanceMatrix.needsUpdate = true;
    }

    if (this.trailsVisible && beeStates.length <= TRAIL_AUTO_DISABLE_THRESHOLD) {
      this.updateTrails(beeStates, currentTime);
    } else {
      this.trailsGroup.visible = false;
    }
  }

  private updateTrails(beeStates: BeeState[], currentTime: number): void {
    this.trailsGroup.visible = true;

    const activeBeeIds = new Set(beeStates.map(b => b.id));
    for (const [id, mesh] of this.trailMeshes) {
      if (!activeBeeIds.has(id)) {
        this.trailsGroup.remove(mesh);
        mesh.geometry.dispose();
        (mesh.material as THREE.Material).dispose();
        this.trailMeshes.delete(id);
      }
    }

    for (const bee of beeStates) {
      if (bee.trail.length < 2) continue;

      const color = new THREE.Color(BEE_COLORS[bee.role]);
      const positions = new Float32Array(bee.trail.length * 3);
      const colors = new Float32Array(bee.trail.length * 3);
      const sizes = new Float32Array(bee.trail.length);

      for (let i = 0; i < bee.trail.length; i++) {
        const pos = bee.trail[i];
        const age = currentTime - bee.trailTimes[i];
        const alpha = Math.max(0, 1 - age / 2000);

        positions[i * 3] = pos.x;
        positions[i * 3 + 1] = pos.y;
        positions[i * 3 + 2] = pos.z;

        colors[i * 3] = color.r;
        colors[i * 3 + 1] = color.g;
        colors[i * 3 + 2] = color.b;

        sizes[i] = 0.1 * alpha;
      }

      let trailMesh = this.trailMeshes.get(bee.id);
      if (!trailMesh) {
        const geometry = new THREE.BufferGeometry();
        const material = new THREE.PointsMaterial({
          size: 0.15,
          vertexColors: true,
          transparent: true,
          opacity: 0.6,
          blending: THREE.AdditiveBlending,
          depthWrite: false
        });
        trailMesh = new THREE.Points(geometry, material);
        this.trailMeshes.set(bee.id, trailMesh);
        this.trailsGroup.add(trailMesh);
      }

      const geometry = trailMesh.geometry as THREE.BufferGeometry;
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
      geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
      geometry.attributes.position.needsUpdate = true;
      geometry.attributes.color.needsUpdate = true;
      geometry.attributes.size.needsUpdate = true;
    }
  }

  updatePheromoneHeatmap(grid: PheromoneGrid): void {
    if (!this.heatmapDataTexture) return;

    const data = this.heatmapDataTexture.image.data as unknown as Uint8Array;

    for (let x = 0; x < this.gridSize; x++) {
      for (let y = 0; y < this.gridSize; y++) {
        let totalR = 0, totalG = 0, totalB = 0;
        for (let z = 0; z < 3; z++) {
          const cell = grid[x][y][z];
          totalR += cell.guard;
          totalG += cell.nurse;
          totalB += cell.worker;
        }
        
        const idx = (y * this.gridSize + x) * 4;
        data[idx] = Math.min(255, totalR / 3 * 2.55);
        data[idx + 1] = Math.min(255, totalG / 3 * 2.55);
        data[idx + 2] = Math.min(255, totalB / 3 * 2.55);
        data[idx + 3] = 255;
      }
    }

    this.heatmapDataTexture.needsUpdate = true;

    for (const plane of this.heatmapPlanes) {
      const material = plane.material as THREE.ShaderMaterial;
      material.uniforms.uTexture.value = this.heatmapDataTexture;
    }
  }

  setHeatmapVisible(visible: boolean): void {
    this.heatmapVisible = visible;
    for (const plane of this.heatmapPlanes) {
      plane.visible = visible;
    }
  }

  setTrailsVisible(visible: boolean): void {
    this.trailsVisible = visible;
    this.trailsGroup.visible = visible;
  }

  isHeatmapVisible(): boolean {
    return this.heatmapVisible;
  }

  isTrailsVisible(): boolean {
    return this.trailsVisible;
  }

  render(): void {
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }

  getDelta(): number {
    return this.clock.getDelta() * 1000;
  }

  private onResize(): void {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  dispose(): void {
    window.removeEventListener('resize', this.onResize.bind(this));
    this.renderer.dispose();
    this.controls.dispose();
  }
}
