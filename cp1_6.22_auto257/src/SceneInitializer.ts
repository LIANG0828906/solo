import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Building, ZoneType, ZONE_INFO } from './types';
import { LightPollutionEngine } from './LightPollutionEngine';

export interface SceneObjects {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  controls: OrbitControls;
  buildingMeshes: Map<string, THREE.Mesh>;
  barMeshes: Map<string, THREE.Mesh>;
  barLabels: Map<string, { element: HTMLDivElement; mesh: THREE.Mesh }>;
  ground: THREE.Mesh;
  gridHelper: THREE.GridHelper;
  heatmapMesh: THREE.Mesh | null;
  labelContainer: HTMLDivElement;
}

export class SceneInitializer {
  private container: HTMLElement;
  private sceneObjects: SceneObjects | null = null;
  private pollutionEngine: LightPollutionEngine;
  private gridSize: number = 2000;
  private cellSize: number = 100;
  private animationId: number | null = null;
  private raycaster: THREE.Raycaster = new THREE.Raycaster();
  private mouse: THREE.Vector2 = new THREE.Vector2();
  private hoveredBuildingId: string | null = null;

  constructor(container: HTMLElement) {
    this.container = container;
    this.pollutionEngine = new LightPollutionEngine();
  }

  init(buildings: Building[]): SceneObjects {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0D0D1A);
    scene.fog = new THREE.Fog(0x0D0D1A, 1500, 3000);

    const camera = new THREE.PerspectiveCamera(
      60,
      this.container.clientWidth / this.container.clientHeight,
      0.1,
      5000
    );
    camera.position.set(0, 1200, 800);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2.2;
    controls.minDistance = 200;
    controls.maxDistance = 2500;
    controls.target.set(0, 0, 0);

    const ambientLight = new THREE.AmbientLight(0x404050, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(500, 1000, 500);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 3000;
    directionalLight.shadow.camera.left = -1500;
    directionalLight.shadow.camera.right = 1500;
    directionalLight.shadow.camera.top = 1500;
    directionalLight.shadow.camera.bottom = -1500;
    scene.add(directionalLight);

    const groundGeometry = new THREE.PlaneGeometry(this.gridSize, this.gridSize);
    const groundMaterial = new THREE.MeshStandardMaterial({
      color: 0x12121F,
      roughness: 0.9,
      metalness: 0.1
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    const gridHelper = new THREE.GridHelper(
      this.gridSize,
      this.gridSize / this.cellSize,
      0xE0E0E0,
      0xE0E0E0
    );
    gridHelper.position.y = 0.1;
    (gridHelper.material as THREE.Material).opacity = 0.2;
    (gridHelper.material as THREE.Material).transparent = true;
    scene.add(gridHelper);

    const buildingMeshes = new Map<string, THREE.Mesh>();
    const barMeshes = new Map<string, THREE.Mesh>();
    const barLabels = new Map<string, { element: HTMLDivElement; mesh: THREE.Mesh }>();

    const labelContainer = document.createElement('div');
    labelContainer.style.position = 'absolute';
    labelContainer.style.top = '0';
    labelContainer.style.left = '0';
    labelContainer.style.width = '100%';
    labelContainer.style.height = '100%';
    labelContainer.style.pointerEvents = 'none';
    labelContainer.style.overflow = 'hidden';
    this.container.appendChild(labelContainer);

    buildings.forEach(building => {
      const buildingMesh = this.createBuildingMesh(building);
      scene.add(buildingMesh);
      buildingMeshes.set(building.id, buildingMesh);

      const barMesh = this.createPollutionBar(building);
      scene.add(barMesh);
      barMeshes.set(building.id, barMesh);

      const labelElement = this.createPollutionLabel(building);
      labelContainer.appendChild(labelElement);
      barLabels.set(building.id, { element: labelElement, mesh: barMesh });
    });

    this.sceneObjects = {
      scene,
      camera,
      renderer,
      controls,
      buildingMeshes,
      barMeshes,
      barLabels,
      ground,
      gridHelper,
      heatmapMesh: null,
      labelContainer
    };

    this.animate();
    window.addEventListener('resize', this.onResize);

    return this.sceneObjects;
  }

  private createBuildingMesh(building: Building): THREE.Mesh {
    const geometry = new THREE.BoxGeometry(building.width, building.height, building.depth);
    const zoneColor = ZONE_INFO[building.zoneType].color;
    
    const material = new THREE.MeshStandardMaterial({
      color: new THREE.Color(zoneColor),
      transparent: true,
      opacity: 0.7,
      roughness: 0.6,
      metalness: 0.2
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(building.x, building.height / 2, building.z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.userData = { buildingId: building.id, isBuilding: true };

    return mesh;
  }

  private createPollutionBar(building: Building): THREE.Mesh {
    const geometry = new THREE.BoxGeometry(building.width * 0.6, 1, building.depth * 0.6);
    const renderData = this.pollutionEngine.calculatePollutionRenderData(building.currentPollution);
    
    const material = new THREE.MeshStandardMaterial({
      color: new THREE.Color(renderData.color),
      transparent: true,
      opacity: 0.8,
      emissive: new THREE.Color(renderData.color),
      emissiveIntensity: 0.3
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(building.x, building.height + renderData.barHeight / 2, building.z);
    mesh.scale.y = renderData.barHeight;
    mesh.userData = { buildingId: building.id, isBar: true, targetHeight: renderData.barHeight };

    return mesh;
  }

  private createPollutionLabel(building: Building): HTMLDivElement {
    const label = document.createElement('div');
    label.style.position = 'absolute';
    label.style.padding = '2px 6px';
    label.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    label.style.color = '#FFFFFF';
    label.style.fontSize = '12px';
    label.style.fontFamily = "'Segoe UI', sans-serif";
    label.style.borderRadius = '4px';
    label.style.whiteSpace = 'nowrap';
    label.style.pointerEvents = 'none';
    label.style.transform = 'translate(-50%, -50%)';
    label.style.zIndex = '10';
    label.textContent = building.currentPollution.toFixed(0);
    
    return label;
  }

  updatePollutionBars(buildings: Building[]): void {
    if (!this.sceneObjects) return;

    buildings.forEach(building => {
      const barMesh = this.sceneObjects!.barMeshes.get(building.id);
      const labelData = this.sceneObjects!.barLabels.get(building.id);
      
      if (barMesh) {
        const renderData = this.pollutionEngine.calculatePollutionRenderData(building.currentPollution);
        const material = barMesh.material as THREE.MeshStandardMaterial;
        
        material.color = new THREE.Color(renderData.color);
        material.emissive = new THREE.Color(renderData.color);
        
        barMesh.userData.targetHeight = renderData.barHeight;
        barMesh.position.y = building.height + renderData.barHeight / 2;
      }

      if (labelData) {
        labelData.element.textContent = building.currentPollution.toFixed(0);
      }
    });
  }

  updateLabelPositions(): void {
    if (!this.sceneObjects) return;

    const { camera, barLabels, renderer } = this.sceneObjects;
    const canvasRect = renderer.domElement.getBoundingClientRect();

    barLabels.forEach(({ element, mesh }) => {
      const worldPos = new THREE.Vector3();
      mesh.getWorldPosition(worldPos);
      worldPos.y += mesh.scale.y / 2 + 5;

      const screenPos = worldPos.project(camera);
      const x = (screenPos.x + 1) / 2 * canvasRect.width;
      const y = (-screenPos.y + 1) / 2 * canvasRect.height;

      if (screenPos.z < 1) {
        element.style.display = 'block';
        element.style.left = `${x}px`;
        element.style.top = `${y}px`;
      } else {
        element.style.display = 'none';
      }
    });
  }

  highlightBuilding(buildingId: string | null): void {
    if (!this.sceneObjects) return;

    this.sceneObjects.buildingMeshes.forEach((mesh, id) => {
      const material = mesh.material as THREE.MeshStandardMaterial;
      if (id === buildingId) {
        material.emissive = new THREE.Color(0xFF4500);
        material.emissiveIntensity = 0.3;
      } else {
        material.emissive = new THREE.Color(0x000000);
        material.emissiveIntensity = 0;
      }
    });
  }

  getIntersectedBuilding(event: MouseEvent): string | null {
    if (!this.sceneObjects) return null;

    const rect = this.sceneObjects.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.sceneObjects.camera);

    const buildingMeshes = Array.from(this.sceneObjects.buildingMeshes.values());
    const barMeshes = Array.from(this.sceneObjects.barMeshes.values());
    const allMeshes = [...buildingMeshes, ...barMeshes];

    const intersects = this.raycaster.intersectObjects(allMeshes);

    if (intersects.length > 0) {
      const userData = intersects[0].object.userData;
      return userData.buildingId || null;
    }

    return null;
  }

  updateCursor(buildingId: string | null): void {
    if (!this.sceneObjects) return;
    
    const canvas = this.sceneObjects.renderer.domElement;
    canvas.style.cursor = buildingId ? 'pointer' : 'grab';
  }

  createHeatmap(heatmapData: number[][]): void {
    if (!this.sceneObjects) return;

    if (this.sceneObjects.heatmapMesh) {
      this.sceneObjects.scene.remove(this.sceneObjects.heatmapMesh);
      this.sceneObjects.heatmapMesh = null;
    }

    const cells = heatmapData.length;
    const cellSize = this.gridSize / cells;

    const canvas = document.createElement('canvas');
    canvas.width = cells;
    canvas.height = cells;
    const ctx = canvas.getContext('2d')!;

    const imageData = ctx.createImageData(cells, cells);

    for (let i = 0; i < cells; i++) {
      for (let j = 0; j < cells; j++) {
        const value = heatmapData[i][j];
        const color = this.getHeatmapColor(value);
        const idx = (i * cells + j) * 4;
        imageData.data[idx] = color.r;
        imageData.data[idx + 1] = color.g;
        imageData.data[idx + 2] = color.b;
        imageData.data[idx + 3] = Math.floor(255 * 0.5);
      }
    }

    ctx.putImageData(imageData, 0, 0);

    const texture = new THREE.CanvasTexture(canvas);
    texture.magFilter = THREE.LinearFilter;
    texture.minFilter = THREE.LinearFilter;

    const geometry = new THREE.PlaneGeometry(this.gridSize, this.gridSize);
    const material = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      opacity: 0,
      depthWrite: false
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.y = 100;
    mesh.renderOrder = 100;

    this.sceneObjects.scene.add(mesh);
    this.sceneObjects.heatmapMesh = mesh;

    material.transparent = true;
    let opacity = 0;
    const targetOpacity = 0.5;
    const duration = 300;
    const startTime = performance.now();

    const fadeIn = () => {
      const elapsed = performance.now() - startTime;
      const t = Math.min(1, elapsed / duration);
      opacity = targetOpacity * t;
      material.opacity = opacity;

      if (t < 1) {
        requestAnimationFrame(fadeIn);
      }
    };

    fadeIn();
  }

  hideHeatmap(): void {
    if (!this.sceneObjects || !this.sceneObjects.heatmapMesh) return;

    const mesh = this.sceneObjects.heatmapMesh;
    const material = mesh.material as THREE.MeshBasicMaterial;
    const startOpacity = material.opacity;
    const duration = 300;
    const startTime = performance.now();

    const fadeOut = () => {
      const elapsed = performance.now() - startTime;
      const t = Math.min(1, elapsed / duration);
      material.opacity = startOpacity * (1 - t);

      if (t < 1) {
        requestAnimationFrame(fadeOut);
      } else {
        this.sceneObjects?.scene.remove(mesh);
        if (this.sceneObjects) {
          this.sceneObjects.heatmapMesh = null;
        }
      }
    };

    fadeOut();
  }

  private getHeatmapColor(value: number): { r: number; g: number; b: number } {
    const v = Math.max(0, Math.min(100, value));
    
    if (v < 50) {
      const t = v / 50;
      return {
        r: Math.floor(t * 255),
        g: 255,
        b: 0
      };
    } else {
      const t = (v - 50) / 50;
      return {
        r: 255,
        g: Math.floor((1 - t) * 255),
        b: 0
      };
    }
  }

  private animate = (): void => {
    if (!this.sceneObjects) return;

    this.animationId = requestAnimationFrame(this.animate);

    this.sceneObjects.barMeshes.forEach(barMesh => {
      const targetHeight = barMesh.userData.targetHeight || 0;
      const currentScale = barMesh.scale.y;
      const newScale = currentScale + (targetHeight - currentScale) * 0.1;
      barMesh.scale.y = newScale;
    });

    this.updateLabelPositions();
    this.sceneObjects.controls.update();
    this.sceneObjects.renderer.render(this.sceneObjects.scene, this.sceneObjects.camera);
  };

  private onResize = (): void => {
    if (!this.sceneObjects) return;

    const { camera, renderer } = this.sceneObjects;
    camera.aspect = this.container.clientWidth / this.container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(this.container.clientWidth, this.container.clientHeight);
  };

  dispose(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }

    window.removeEventListener('resize', this.onResize);

    if (this.sceneObjects) {
      this.sceneObjects.renderer.dispose();
      this.sceneObjects.controls.dispose();
      
      if (this.sceneObjects.labelContainer.parentNode) {
        this.sceneObjects.labelContainer.parentNode.removeChild(this.sceneObjects.labelContainer);
      }
      
      if (this.sceneObjects.renderer.domElement.parentNode) {
        this.sceneObjects.renderer.domElement.parentNode.removeChild(this.sceneObjects.renderer.domElement);
      }
    }
  }
}
