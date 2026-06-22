import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type { BlockData, SceneConfig } from './types';

const DEFAULT_CONFIG: SceneConfig = {
  gridSize: 3,
  blockSpacing: 2.5,
  blockSize: 1.8,
  minHeight: 1,
  maxHeight: 5,
  colorLow: '#00ff00',
  colorHigh: '#ff0000'
};

export interface HeatMapSceneCallbacks {
  onBlockHover: (blockId: number | null) => void;
  onBlockClick: (blockId: number) => void;
  onBackgroundClick: () => void;
  onFpsUpdate?: (fps: number) => void;
}

export class HeatMapScene {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private controls: OrbitControls;
  private config: SceneConfig;
  private blockMeshes: Map<number, THREE.Mesh> = new Map();
  private blockEdges: Map<number, THREE.LineSegments> = new Map();
  private raycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;
  private callbacks: HeatMapSceneCallbacks;
  private animationFrameId: number | null = null;
  private hoveredBlockId: number | null = null;
  private selectedBlockId: number | null = null;
  private lastTime: number = performance.now();
  private frameCount: number = 0;

  constructor(
    container: HTMLElement,
    callbacks: HeatMapSceneCallbacks,
    config: Partial<SceneConfig> = {}
  ) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.callbacks = callbacks;
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0b0b2b);
    this.scene.fog = new THREE.Fog(0x0b0b2b, 15, 40);

    const width = container.clientWidth;
    const height = container.clientHeight;

    this.camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    this.camera.position.set(8, 10, 8);

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;

    container.appendChild(this.renderer.domElement);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.minDistance = 5;
    this.controls.maxDistance = 25;
    this.controls.maxPolarAngle = Math.PI / 2.2;
    this.controls.target.set(0, 0, 0);

    this.setupLighting();
    this.createGround();
    this.setupEventListeners(container);
    this.animate();
  }

  private setupLighting(): void {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(-10, 15, -10);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 50;
    directionalLight.shadow.camera.left = -15;
    directionalLight.shadow.camera.right = 15;
    directionalLight.shadow.camera.top = 15;
    directionalLight.shadow.camera.bottom = -15;
    directionalLight.shadow.bias = -0.0001;
    this.scene.add(directionalLight);

    const fillLight = new THREE.DirectionalLight(0x4488ff, 0.3);
    fillLight.position.set(10, 8, 10);
    this.scene.add(fillLight);
  }

  private createGround(): void {
    const gridHelper = new THREE.GridHelper(30, 30, 0x333355, 0x222244);
    gridHelper.position.y = -0.01;
    this.scene.add(gridHelper);

    const groundGeometry = new THREE.PlaneGeometry(30, 30);
    const groundMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a1a2e,
      transparent: true,
      opacity: 0.6,
      roughness: 0.9,
      metalness: 0.1
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.02;
    ground.receiveShadow = true;
    this.scene.add(ground);
  }

  private getColorForPollution(index: number): THREE.Color {
    const t = Math.max(0, Math.min(1, index / 100));
    const colorLow = new THREE.Color(this.config.colorLow);
    const colorHigh = new THREE.Color(this.config.colorHigh);
    
    const color = new THREE.Color();
    if (t < 0.5) {
      const localT = t * 2;
      color.r = colorLow.r + (1 - colorLow.r) * localT;
      color.g = colorLow.g + (1 - colorLow.g) * localT;
      color.b = colorLow.b + (0 - colorLow.b) * localT;
    } else {
      const localT = (t - 0.5) * 2;
      color.r = 1 + (colorHigh.r - 1) * localT;
      color.g = 1 + (colorHigh.g - 1) * localT;
      color.b = 0 + (colorHigh.b - 0) * localT;
    }
    
    return color;
  }

  private getHeightForPollution(index: number): number {
    const t = Math.max(0, Math.min(1, index / 100));
    return this.config.minHeight + t * (this.config.maxHeight - this.config.minHeight);
  }

  public createBlocks(blocks: BlockData[]): void {
    this.blockMeshes.forEach(mesh => {
      this.scene.remove(mesh);
      mesh.geometry.dispose();
      if (Array.isArray(mesh.material)) {
        mesh.material.forEach(m => m.dispose());
      } else {
        mesh.material.dispose();
      }
    });
    this.blockEdges.forEach(edge => {
      this.scene.remove(edge);
      edge.geometry.dispose();
      if (Array.isArray(edge.material)) {
        edge.material.forEach(m => m.dispose());
      } else {
        edge.material.dispose();
      }
    });
    this.blockMeshes.clear();
    this.blockEdges.clear();

    const offset = (this.config.gridSize - 1) * this.config.blockSpacing / 2;

    blocks.forEach(block => {
      const height = this.getHeightForPollution(block.pollutionIndex);
      const color = this.getColorForPollution(block.pollutionIndex);

      const geometry = new THREE.BoxGeometry(
        this.config.blockSize,
        height,
        this.config.blockSize
      );

      const material = new THREE.MeshStandardMaterial({
        color: color,
        roughness: 0.3,
        metalness: 0.7,
        emissive: color.clone().multiplyScalar(0.2),
        emissiveIntensity: 0.3,
        transparent: true,
        opacity: 1.0
      });

      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(
        block.positionX * this.config.blockSpacing - offset,
        height / 2,
        block.positionZ * this.config.blockSpacing - offset
      );
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.userData = { blockId: block.id, baseHeight: height };

      const edgesGeometry = new THREE.EdgesGeometry(geometry);
      const edgesMaterial = new THREE.LineBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0
      });
      const edges = new THREE.LineSegments(edgesGeometry, edgesMaterial);
      edges.position.copy(mesh.position);
      edges.userData = { blockId: block.id };

      this.scene.add(mesh);
      this.scene.add(edges);
      this.blockMeshes.set(block.id, mesh);
      this.blockEdges.set(block.id, edges);
    });
  }

  public updateBlocks(blocks: BlockData[]): void {
    blocks.forEach(block => {
      const mesh = this.blockMeshes.get(block.id);
      const edge = this.blockEdges.get(block.id);
      
      if (mesh) {
        const newHeight = this.getHeightForPollution(block.pollutionIndex);
        const newColor = this.getColorForPollution(block.pollutionIndex);
        
        const baseHeight = mesh.userData.baseHeight as number;
        const currentScaleY = mesh.scale.y;
        const oldHeight = baseHeight * currentScaleY;
        const heightDiff = newHeight - oldHeight;
        
        mesh.position.y += heightDiff / 2;
        mesh.scale.y = newHeight / baseHeight;
        
        const material = mesh.material as THREE.MeshStandardMaterial;
        material.color.copy(newColor);
        material.emissive.copy(newColor.clone().multiplyScalar(0.2));
        
        if (edge) {
          edge.position.y += heightDiff / 2;
          edge.scale.y = newHeight / oldHeight;
        }
      }
    });
  }

  public setHoveredBlock(blockId: number | null): void {
    if (this.hoveredBlockId === blockId) return;
    
    if (this.hoveredBlockId !== null && this.hoveredBlockId !== this.selectedBlockId) {
      this.setBlockHighlight(this.hoveredBlockId, false);
    }
    
    this.hoveredBlockId = blockId;
    
    if (blockId !== null) {
      this.setBlockHighlight(blockId, true);
    }
    
    this.updateOtherBlocksOpacity();
  }

  public setSelectedBlock(blockId: number | null): void {
    if (this.selectedBlockId === blockId) return;
    
    if (this.selectedBlockId !== null && this.selectedBlockId !== this.hoveredBlockId) {
      this.setBlockHighlight(this.selectedBlockId, false);
    }
    
    this.selectedBlockId = blockId;
    
    if (blockId !== null) {
      this.setBlockHighlight(blockId, true);
    }
    
    this.updateOtherBlocksOpacity();
  }

  private setBlockHighlight(blockId: number, highlighted: boolean): void {
    const edge = this.blockEdges.get(blockId);
    if (edge) {
      const material = edge.material as THREE.LineBasicMaterial;
      material.opacity = highlighted ? 1 : 0;
    }
  }

  private updateOtherBlocksOpacity(): void {
    const activeBlockId = this.selectedBlockId ?? this.hoveredBlockId;
    
    this.blockMeshes.forEach((mesh, blockId) => {
      const material = mesh.material as THREE.MeshStandardMaterial;
      if (activeBlockId !== null && blockId !== activeBlockId) {
        material.opacity = 0.3;
      } else {
        material.opacity = 1.0;
      }
    });
  }

  private setupEventListeners(container: HTMLElement): void {
    const onMouseMove = (event: MouseEvent) => {
      const rect = this.renderer.domElement.getBoundingClientRect();
      this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      
      this.raycaster.setFromCamera(this.mouse, this.camera);
      const intersects = this.raycaster.intersectObjects(
        Array.from(this.blockMeshes.values())
      );
      
      if (intersects.length > 0) {
        const blockId = intersects[0].object.userData.blockId as number;
        this.callbacks.onBlockHover(blockId);
      } else {
        this.callbacks.onBlockHover(null);
      }
    };

    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented) return;
      
      const rect = this.renderer.domElement.getBoundingClientRect();
      this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      
      this.raycaster.setFromCamera(this.mouse, this.camera);
      const intersects = this.raycaster.intersectObjects(
        Array.from(this.blockMeshes.values())
      );
      
      if (intersects.length > 0) {
        const blockId = intersects[0].object.userData.blockId as number;
        this.callbacks.onBlockClick(blockId);
      } else {
        this.callbacks.onBackgroundClick();
      }
    };

    const onResize = () => {
      const width = container.clientWidth;
      const height = container.clientHeight;
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(width, height);
    };

    container.addEventListener('mousemove', onMouseMove);
    container.addEventListener('click', onClick);
    window.addEventListener('resize', onResize);
  }

  private animate = (): void => {
    this.animationFrameId = requestAnimationFrame(this.animate);
    
    this.frameCount++;
    const currentTime = performance.now();
    if (currentTime - this.lastTime >= 1000) {
      const fps = Math.round(this.frameCount * 1000 / (currentTime - this.lastTime));
      this.callbacks.onFpsUpdate?.(fps);
      this.frameCount = 0;
      this.lastTime = currentTime;
    }
    
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  };

  public getScene(): THREE.Scene {
    return this.scene;
  }

  public dispose(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }
    
    this.blockMeshes.forEach(mesh => {
      mesh.geometry.dispose();
      if (Array.isArray(mesh.material)) {
        mesh.material.forEach(m => m.dispose());
      } else {
        mesh.material.dispose();
      }
    });
    
    this.blockEdges.forEach(edge => {
      edge.geometry.dispose();
      if (Array.isArray(edge.material)) {
        edge.material.forEach(m => m.dispose());
      } else {
        edge.material.dispose();
      }
    });
    
    this.renderer.dispose();
    this.controls.dispose();
  }
}
