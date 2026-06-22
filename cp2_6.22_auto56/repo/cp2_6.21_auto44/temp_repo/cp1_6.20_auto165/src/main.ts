import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { LightingService } from './services/LightingService';
import { Panel } from './ui/Panel';
import { EventBus, Events, LightingParams } from './utils/EventBus';

class CityLightSimulator {
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private controls!: OrbitControls;
  private canvas!: HTMLCanvasElement;
  
  private lightingService!: LightingService;
  private panel!: Panel;
  
  private directionalLight!: THREE.DirectionalLight;
  private ambientLight!: THREE.AmbientLight;
  private sunHelper!: THREE.Mesh;
  private sunLightHelper!: THREE.DirectionalLightHelper;
  
  private buildings: THREE.Mesh[] = [];
  private buildingEdges: THREE.LineSegments[] = [];
  private streetLights: THREE.Mesh[] = [];
  private streetLightMeshes: THREE.PointLight[] = [];
  
  private currentParams!: LightingParams;
  private isWireframe: boolean = false;
  private reflectivity: number = 0.3;
  private roughness: number = 0.7;
  
  private isAnimating: boolean = false;
  private animationStartTime: number = 0;
  private animationDuration: number = 2000;
  private animationStartValue: number = 0;
  private animationEndValue: number = 0;
  
  private isDraggingSun: boolean = false;
  private raycaster!: THREE.Raycaster;
  private mouse!: THREE.Vector2;
  
  private clock!: THREE.Clock;
  private frameCount: number = 0;
  private lastFpsUpdate: number = 0;
  
  private readonly GRID_SIZE: number = 10;
  private readonly CELL_SIZE: number = 8;
  private readonly MAX_BUILDINGS: number = 80;

  constructor() {
    this.init();
  }

  private init(): void {
    this.clock = new THREE.Clock();
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    
    this.setupScene();
    this.setupCamera();
    this.setupRenderer();
    this.setupControls();
    this.setupLighting();
    this.generateCity();
    this.setupServices();
    this.setupEventListeners();
    
    this.animate();
    this.lightingService.forceUpdate();
  }

  private setupScene(): void {
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x0f0c29, 0.008);
  }

  private setupCamera(): void {
    const container = document.getElementById('scene-container')!;
    const aspect = container.clientWidth / container.clientHeight;
    
    this.camera = new THREE.PerspectiveCamera(60, aspect, 0.1, 1000);
    this.camera.position.set(60, 50, 60);
  }

  private setupRenderer(): void {
    this.canvas = document.getElementById('canvas') as HTMLCanvasElement;
    const container = document.getElementById('scene-container')!;
    
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: true,
    });
    
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;
  }

  private setupControls(): void {
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.minDistance = 20;
    this.controls.maxDistance = 150;
    this.controls.maxPolarAngle = Math.PI / 2.1;
    this.controls.target.set(0, 5, 0);
    this.controls.update();
  }

  private setupLighting(): void {
    this.directionalLight = new THREE.DirectionalLight(0xffffff, 2.5);
    this.directionalLight.castShadow = true;
    this.directionalLight.shadow.mapSize.width = 2048;
    this.directionalLight.shadow.mapSize.height = 2048;
    this.directionalLight.shadow.camera.near = 0.5;
    this.directionalLight.shadow.camera.far = 500;
    this.directionalLight.shadow.camera.left = -100;
    this.directionalLight.shadow.camera.right = 100;
    this.directionalLight.shadow.camera.top = 100;
    this.directionalLight.shadow.camera.bottom = -100;
    this.directionalLight.shadow.bias = -0.0001;
    this.scene.add(this.directionalLight);

    this.ambientLight = new THREE.AmbientLight(0x404060, 0.5);
    this.scene.add(this.ambientLight);

    const sunGeometry = new THREE.SphereGeometry(3, 32, 32);
    const sunMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });
    this.sunHelper = new THREE.Mesh(sunGeometry, sunMaterial);
    this.scene.add(this.sunHelper);

    this.sunLightHelper = new THREE.DirectionalLightHelper(this.directionalLight, 10, 0xffff00);
    this.scene.add(this.sunLightHelper);
  }

  private generateCity(): void {
    const groundGeometry = new THREE.PlaneGeometry(
      this.GRID_SIZE * this.CELL_SIZE,
      this.GRID_SIZE * this.CELL_SIZE
    );
    const groundMaterial = new THREE.MeshStandardMaterial({
      color: 0x2d2d3a,
      roughness: 0.9,
      metalness: 0.1,
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);

    this.generateStreets();
    this.generateBuildings();
    this.generateGreenBelt();
    this.generateStreetLights();
  }

  private generateStreets(): void {
    const streetMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a1a24,
      roughness: 0.8,
      metalness: 0.1,
    });

    for (let i = 0; i <= this.GRID_SIZE; i++) {
      const hStreet = new THREE.Mesh(
        new THREE.BoxGeometry(this.GRID_SIZE * this.CELL_SIZE, 0.1, 1.5),
        streetMaterial
      );
      hStreet.position.set(
        0,
        0.05,
        -this.GRID_SIZE * this.CELL_SIZE / 2 + i * this.CELL_SIZE
      );
      hStreet.receiveShadow = true;
      this.scene.add(hStreet);

      const vStreet = new THREE.Mesh(
        new THREE.BoxGeometry(1.5, 0.1, this.GRID_SIZE * this.CELL_SIZE),
        streetMaterial
      );
      vStreet.position.set(
        -this.GRID_SIZE * this.CELL_SIZE / 2 + i * this.CELL_SIZE,
        0.05,
        0
      );
      vStreet.receiveShadow = true;
      this.scene.add(vStreet);
    }
  }

  private generateBuildings(): void {
    const buildingColors = [0x4a5568, 0x718096, 0x2d3748, 0x1a202c, 0x5a6778];
    const windowColors = [0xffd700, 0x87ceeb, 0xffffff, 0xe6e6fa];
    
    let buildingCount = 0;
    const halfGrid = this.GRID_SIZE / 2;

    for (let x = -halfGrid + 1; x < halfGrid && buildingCount < this.MAX_BUILDINGS; x++) {
      for (let z = -halfGrid + 1; z < halfGrid && buildingCount < this.MAX_BUILDINGS; z++) {
        if (Math.random() > 0.3) continue;
        
        const baseHeight = 5 + Math.random() * 35;
        const width = 3 + Math.random() * 4;
        const depth = 3 + Math.random() * 4;
        
        const posX = x * this.CELL_SIZE + (Math.random() - 0.5) * 2;
        const posZ = z * this.CELL_SIZE + (Math.random() - 0.5) * 2;
        
        const colorIndex = Math.floor(Math.random() * buildingColors.length);
        const buildingColor = buildingColors[colorIndex];
        
        const building = this.createBuilding(
          width,
          baseHeight,
          depth,
          buildingColor,
          windowColors
        );
        building.position.set(posX, baseHeight / 2, posZ);
        
        this.buildings.push(building);
        this.scene.add(building);
        
        const edges = new THREE.EdgesGeometry(building.geometry as THREE.BufferGeometry);
        const lineMaterial = new THREE.LineBasicMaterial({ 
          color: 0x64b5f6, 
          transparent: true, 
          opacity: 0 
        });
        const lineSegments = new THREE.LineSegments(edges, lineMaterial);
        lineSegments.position.copy(building.position);
        this.buildingEdges.push(lineSegments);
        this.scene.add(lineSegments);
        
        buildingCount++;
      }
    }
  }

  private createBuilding(
    width: number,
    height: number,
    depth: number,
    color: number,
    windowColors: number[]
  ): THREE.Mesh {
    const geometry = new THREE.BoxGeometry(width, height, depth);
    
    const positions = geometry.attributes.position;
    const colors = new Float32Array(positions.count * 3);
    const colorObj = new THREE.Color(color);
    
    for (let i = 0; i < positions.count; i++) {
      const y = positions.getY(i);
      const variation = 0.9 + (y / height) * 0.2;
      
      colors[i * 3] = colorObj.r * variation;
      colors[i * 3 + 1] = colorObj.g * variation;
      colors[i * 3 + 2] = colorObj.b * variation;
    }
    
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    
    const windowColor = windowColors[Math.floor(Math.random() * windowColors.length)];
    const emissiveIntensity = 0.05 + Math.random() * 0.1;
    
    const material = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: this.roughness,
      metalness: this.reflectivity,
      emissive: windowColor,
      emissiveIntensity: emissiveIntensity,
    });
    
    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    
    return mesh;
  }

  private generateGreenBelt(): void {
    const greenMaterial = new THREE.MeshStandardMaterial({
      color: 0x2d5016,
      roughness: 0.9,
      metalness: 0.0,
    });

    const parkPositions = [
      { x: -this.CELL_SIZE * 3, z: -this.CELL_SIZE * 3 },
      { x: this.CELL_SIZE * 3, z: this.CELL_SIZE * 3 },
      { x: 0, z: this.CELL_SIZE * 4 },
    ];

    parkPositions.forEach((pos) => {
      const park = new THREE.Mesh(
        new THREE.BoxGeometry(10, 0.2, 10),
        greenMaterial
      );
      park.position.set(pos.x, 0.1, pos.z);
      park.receiveShadow = true;
      this.scene.add(park);

      for (let i = 0; i < 5; i++) {
        const tree = this.createTree();
        tree.position.set(
          pos.x + (Math.random() - 0.5) * 8,
          0,
          pos.z + (Math.random() - 0.5) * 8
        );
        this.scene.add(tree);
      }
    });
  }

  private createTree(): THREE.Group {
    const group = new THREE.Group();
    
    const trunkMaterial = new THREE.MeshStandardMaterial({
      color: 0x4a3728,
      roughness: 0.9,
    });
    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.2, 0.3, 2, 8),
      trunkMaterial
    );
    trunk.position.y = 1;
    trunk.castShadow = true;
    group.add(trunk);
    
    const foliageMaterial = new THREE.MeshStandardMaterial({
      color: 0x228b22,
      roughness: 0.8,
    });
    const foliage = new THREE.Mesh(
      new THREE.SphereGeometry(1.5, 8, 8),
      foliageMaterial
    );
    foliage.position.y = 3;
    foliage.castShadow = true;
    group.add(foliage);
    
    return group;
  }

  private generateStreetLights(): void {
    const halfGrid = this.GRID_SIZE / 2;
    let lightCount = 0;
    
    for (let i = -halfGrid; i <= halfGrid; i += 3) {
      for (let j = -halfGrid; j <= halfGrid; j += 3) {
        if (lightCount >= 16) break;
        
        const poleMaterial = new THREE.MeshStandardMaterial({
          color: 0x333333,
          metalness: 0.8,
          roughness: 0.3,
        });
        
        const pole = new THREE.Mesh(
          new THREE.CylinderGeometry(0.1, 0.15, 5, 8),
          poleMaterial
        );
        pole.position.set(
          i * this.CELL_SIZE + this.CELL_SIZE / 2,
          2.5,
          j * this.CELL_SIZE + this.CELL_SIZE / 2
        );
        pole.castShadow = true;
        this.streetLights.push(pole);
        this.scene.add(pole);
        
        const lampMaterial = new THREE.MeshBasicMaterial({
          color: 0xffaa00,
        });
        const lamp = new THREE.Mesh(
          new THREE.SphereGeometry(0.3, 8, 8),
          lampMaterial
        );
        lamp.position.set(
          pole.position.x,
          5,
          pole.position.z
        );
        this.streetLights.push(lamp);
        this.scene.add(lamp);
        
        const pointLight = new THREE.PointLight(0xffaa00, 0, 12);
        pointLight.position.copy(lamp.position);
        pointLight.castShadow = false;
        this.streetLightMeshes.push(pointLight);
        this.scene.add(pointLight);
        
        lightCount++;
      }
    }
  }

  private setupServices(): void {
    this.lightingService = new LightingService();
    
    this.panel = new Panel('panel-container', {
      onTimeChange: (time: number) => {
        EventBus.emit(Events.TIME_CHANGED, time);
      },
      onPresetChange: (preset: 'dawn' | 'noon' | 'dusk') => {
        const targetTime = this.lightingService.getTimePreset(preset);
        this.startTimeAnimation(targetTime);
      },
      onStyleChange: (wireframe: boolean) => {
        this.setWireframeMode(wireframe);
      },
      onMaterialChange: (reflectivity: number, roughness: number) => {
        this.reflectivity = reflectivity;
        this.roughness = roughness;
        this.updateBuildingMaterials();
      },
    });

    this.reflectivity = this.panel.getReflectivity();
    this.roughness = this.panel.getRoughness();
    this.isWireframe = this.panel.getIsWireframe();
  }

  private setupEventListeners(): void {
    EventBus.on(Events.LIGHTING_UPDATED, (params: LightingParams) => {
      this.currentParams = params;
      this.updateLighting(params);
      this.panel.updateLightingParams(params);
    });

    window.addEventListener('resize', () => {
      this.onWindowResize();
    });

    this.canvas.addEventListener('mousedown', (e) => {
      this.onMouseDown(e);
    });
    
    window.addEventListener('mousemove', (e) => {
      this.onMouseMove(e);
    });
    
    window.addEventListener('mouseup', () => {
      this.onMouseUp();
    });
  }

  private updateLighting(params: LightingParams): void {
    this.directionalLight.position.set(
      params.sunPosition.x,
      params.sunPosition.y,
      params.sunPosition.z
    );
    this.directionalLight.color.setHex(params.color);
    this.directionalLight.intensity = params.intensity;
    
    this.ambientLight.intensity = params.ambientIntensity;
    this.ambientLight.color.setHex(params.color);
    this.ambientLight.color.multiplyScalar(0.3);
    
    this.sunHelper.position.set(
      params.sunPosition.x,
      params.sunPosition.y,
      params.sunPosition.z
    );
    (this.sunHelper.material as THREE.MeshBasicMaterial).color.setHex(params.color);
    
    this.sunLightHelper.update();
    
    const streetLightIntensity = Math.max(0, 1 - params.elevation / 30);
    this.streetLightMeshes.forEach((light) => {
      light.intensity = streetLightIntensity * 0.8;
    });
    
    const emissiveIntensity = Math.max(0.05, 0.2 - params.elevation / 450);
    this.buildings.forEach((building) => {
      const material = building.material as THREE.MeshStandardMaterial;
      material.emissiveIntensity = emissiveIntensity;
    });
    
    const fogDensity = 0.008 + (1 - params.elevation / 90) * 0.01;
    (this.scene.fog as THREE.FogExp2).density = fogDensity;
    
    const brightness = Math.max(0, params.elevation / 90);
    const bgColor = new THREE.Color();
    bgColor.setRGB(
      0.06 + brightness * 0.3,
      0.05 + brightness * 0.25,
      0.16 + brightness * 0.35
    );
    this.renderer.setClearColor(bgColor, 1);
  }

  private startTimeAnimation(targetTime: number): void {
    if (this.isAnimating) return;
    
    this.isAnimating = true;
    this.animationStartTime = performance.now();
    this.animationStartValue = this.lightingService.getTime();
    this.animationEndValue = targetTime;
    this.animationDuration = 2000;
  }

  private updateAnimation(): void {
    if (!this.isAnimating) return;
    
    const elapsed = performance.now() - this.animationStartTime;
    const progress = Math.min(elapsed / this.animationDuration, 1);
    
    const easedProgress = this.easeOutCubic(progress);
    const currentTime = this.animationStartValue + 
      (this.animationEndValue - this.animationStartValue) * easedProgress;
    
    EventBus.emit(Events.TIME_CHANGED, currentTime);
    this.panel.setTime(currentTime);
    
    if (progress >= 1) {
      this.isAnimating = false;
    }
  }

  private easeOutCubic(t: number): number {
    return 1 - Math.pow(1 - t, 3);
  }

  private setWireframeMode(wireframe: boolean): void {
    this.isWireframe = wireframe;
    
    this.buildings.forEach((building) => {
      const material = building.material as THREE.MeshStandardMaterial;
      if (wireframe) {
        material.color.setHex(0x64b5f6);
        material.emissive.setHex(0x000000);
        material.emissiveIntensity = 0;
        material.vertexColors = false;
        material.wireframe = true;
        material.wireframeLinewidth = 1;
      } else {
        material.wireframe = false;
        material.vertexColors = true;
        material.emissiveIntensity = 0.1;
      }
      material.needsUpdate = true;
    });
    
    this.buildingEdges.forEach((edges) => {
      const material = edges.material as THREE.LineBasicMaterial;
      material.opacity = wireframe ? 0.8 : 0;
      material.visible = wireframe;
      material.needsUpdate = true;
    });
  }

  private updateBuildingMaterials(): void {
    this.buildings.forEach((building) => {
      const material = building.material as THREE.MeshStandardMaterial;
      material.roughness = this.roughness;
      material.metalness = this.reflectivity;
      material.needsUpdate = true;
    });
  }

  private onWindowResize(): void {
    const container = document.getElementById('scene-container')!;
    const width = container.clientWidth;
    const height = container.clientHeight;
    
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    
    this.renderer.setSize(width, height);
  }

  private onMouseDown(event: MouseEvent): void {
    const rect = this.canvas.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObject(this.sunHelper);
    
    if (intersects.length > 0) {
      this.isDraggingSun = true;
      this.controls.enabled = false;
    }
  }

  private onMouseMove(event: MouseEvent): void {
    if (!this.isDraggingSun) return;
    
    const rect = this.canvas.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    
    this.raycaster.setFromCamera(this.mouse, this.camera);
    
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const intersectPoint = new THREE.Vector3();
    this.raycaster.ray.intersectPlane(plane, intersectPoint);
    
    if (intersectPoint) {
      const direction = intersectPoint.clone().normalize();
      const distance = 80;
      const newSunPos = direction.multiplyScalar(distance);
      newSunPos.y = Math.abs(newSunPos.y);
      
      const azimuth = Math.atan2(newSunPos.x, newSunPos.z) * (180 / Math.PI);
      const elevation = Math.asin(Math.max(0, Math.min(1, newSunPos.y / distance))) * (180 / Math.PI);
      
      const normalizedTime = ((azimuth + 90) / 180);
      const time = 5 + normalizedTime * 15;
      
      const clampedTime = Math.max(5, Math.min(20, time));
      EventBus.emit(Events.TIME_CHANGED, clampedTime);
      this.panel.setTime(clampedTime);
    }
  }

  private onMouseUp(): void {
    this.isDraggingSun = false;
    this.controls.enabled = true;
  }

  private animate(): void {
    requestAnimationFrame(() => this.animate());
    
    const delta = this.clock.getDelta();
    
    this.updateAnimation();
    this.controls.update();
    
    this.frameCount++;
    const now = performance.now();
    if (now - this.lastFpsUpdate >= 1000) {
      this.lastFpsUpdate = now;
      this.frameCount = 0;
    }
    
    this.renderer.render(this.scene, this.camera);
  }
}

window.addEventListener('DOMContentLoaded', () => {
  new CityLightSimulator();
});
