import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type { Vehicle, Road } from '../simulator/TrafficSimulator';

interface Building {
  position: THREE.Vector3;
  size: THREE.Vector3;
  color: number;
}

interface VehicleMesh {
  mesh: THREE.Mesh;
  material: THREE.MeshStandardMaterial;
  trail: THREE.Line;
  trailGeometry: THREE.BufferGeometry;
}

interface RoadMesh {
  mesh: THREE.Mesh;
  material: THREE.MeshStandardMaterial;
}

export class SceneManager {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private controls: OrbitControls;
  private container: HTMLElement;
  private vehicleMeshes: Map<number, VehicleMesh> = new Map();
  private roadMeshes: RoadMesh[] = [];
  private buildings: THREE.InstancedMesh | null = null;
  private buildingData: Building[] = [];
  private animationId: number | null = null;
  private lastTimestamp: number = 0;
  private targetHeatColors: string[] = [];
  private currentHeatColors: string[] = [];
  private heatTransitionProgress: number = 1;
  private showHeatmap: boolean = false;
  private showTrails: boolean = false;
  private sceneOpacity: number = 0;
  private onVehicleClick: ((vehicle: Vehicle) => void) | null = null;
  private raycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;
  private vehicles: Vehicle[] = [];
  private roads: Road[] = [];

  constructor(container: HTMLElement) {
    this.container = container;
    this.scene = new THREE.Scene();
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    this.camera = new THREE.PerspectiveCamera(
      60,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    this.camera.position.set(50, 50, 50);
    this.camera.lookAt(0, 0, 0);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(this.renderer.domElement);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.maxPolarAngle = Math.PI / 2.2;
    this.controls.minDistance = 30;
    this.controls.maxDistance = 120;
    this.controls.target.set(0, 0, 0);

    this.initScene();
    this.setupEventListeners();
  }

  private initScene(): void {
    this.scene.background = new THREE.Color(0x0a0a1a);

    const ambientLight = new THREE.AmbientLight(0x404060, 0.6);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(30, 50, 30);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 200;
    directionalLight.shadow.camera.left = -60;
    directionalLight.shadow.camera.right = 60;
    directionalLight.shadow.camera.top = 60;
    directionalLight.shadow.camera.bottom = -60;
    this.scene.add(directionalLight);

    const pointLight1 = new THREE.PointLight(0x6688ff, 0.3, 100);
    pointLight1.position.set(-30, 20, -30);
    this.scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0xff8866, 0.3, 100);
    pointLight2.position.set(30, 20, 30);
    this.scene.add(pointLight2);

    this.createGround();
    this.createGrid();
    this.createBuildings();
  }

  private createGround(): void {
    const groundGeometry = new THREE.PlaneGeometry(120, 120);
    const groundMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a1a2e,
      roughness: 0.9,
      metalness: 0.1
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    ground.name = 'ground';
    this.scene.add(ground);
  }

  private createGrid(): void {
    const gridHelper = new THREE.GridHelper(120, 60, 0x333355, 0x222244);
    gridHelper.position.y = 0.01;
    this.scene.add(gridHelper);
  }

  private createBuildings(): void {
    const buildingColors = [0x2a2a4a, 0x3a3a5a, 0x4a4a6a, 0x252545, 0x353555];
    
    for (let i = 0; i < 50; i++) {
      let x, z;
      do {
        x = (Math.random() - 0.5) * 90;
        z = (Math.random() - 0.5) * 90;
      } while (this.isOnRoad(x, z));

      const width = 2 + Math.random() * 4;
      const depth = 2 + Math.random() * 4;
      const height = 3 + Math.random() * 15;

      this.buildingData.push({
        position: new THREE.Vector3(x, height / 2, z),
        size: new THREE.Vector3(width, height, depth),
        color: buildingColors[Math.floor(Math.random() * buildingColors.length)]
      });
    }

    const boxGeometry = new THREE.BoxGeometry(1, 1, 1);
    this.buildings = new THREE.InstancedMesh(
      boxGeometry,
      new THREE.MeshStandardMaterial(),
      this.buildingData.length
    );
    this.buildings.castShadow = true;
    this.buildings.receiveShadow = true;

    const dummy = new THREE.Object3D();
    const colors = new Float32Array(this.buildingData.length * 3);

    this.buildingData.forEach((building, index) => {
      dummy.position.copy(building.position);
      dummy.scale.copy(building.size);
      dummy.updateMatrix();
      this.buildings!.setMatrixAt(index, dummy.matrix);

      const color = new THREE.Color(building.color);
      colors[index * 3] = color.r;
      colors[index * 3 + 1] = color.g;
      colors[index * 3 + 2] = color.b;
    });

    this.buildings.instanceMatrix.needsUpdate = true;
    this.buildings.geometry.setAttribute('color', new THREE.InstancedBufferAttribute(colors, 3));
    this.scene.add(this.buildings);
  }

  private isOnRoad(x: number, z: number): boolean {
    const roadSpacing = 12;
    const roadWidth = 4;
    for (let i = -2; i <= 2; i++) {
      if (Math.abs(z - i * roadSpacing) < roadWidth) return true;
      if (Math.abs(x - i * roadSpacing) < roadWidth) return true;
    }
    return false;
  }

  public createRoads(roads: Road[]): void {
    roads.forEach(road => {
      const dx = road.endX - road.startX;
      const dz = road.endZ - road.startZ;
      const length = Math.sqrt(dx * dx + dz * dz);
      const angle = Math.atan2(dz, dx);

      const roadGeometry = new THREE.PlaneGeometry(length, road.width);
      const roadMaterial = new THREE.MeshStandardMaterial({
        color: 0x151525,
        transparent: true,
        opacity: 0.8,
        roughness: 0.8
      });

      const roadMesh = new THREE.Mesh(roadGeometry, roadMaterial);
      roadMesh.rotation.x = -Math.PI / 2;
      roadMesh.rotation.z = -angle;
      roadMesh.position.set(
        (road.startX + road.endX) / 2,
        0.02,
        (road.startZ + road.endZ) / 2
      );
      roadMesh.receiveShadow = true;

      this.roadMeshes.push({
        mesh: roadMesh,
        material: roadMaterial
      });
      this.scene.add(roadMesh);
    });

    this.currentHeatColors = roads.map(() => '#151525');
    this.targetHeatColors = roads.map(() => '#151525');
  }

  public updateVehicles(vehicles: Vehicle[], alpha: number = 1): void {
    this.vehicles = vehicles;

    const existingIds = new Set(this.vehicleMeshes.keys());
    const newIds = new Set(vehicles.map(v => v.id));

    existingIds.forEach(id => {
      if (!newIds.has(id)) {
        const vehicleMesh = this.vehicleMeshes.get(id);
        if (vehicleMesh) {
          this.scene.remove(vehicleMesh.mesh);
          this.scene.remove(vehicleMesh.trail);
          vehicleMesh.mesh.geometry.dispose();
          vehicleMesh.material.dispose();
          vehicleMesh.trailGeometry.dispose();
          (vehicleMesh.trail.material as THREE.Material).dispose();
          this.vehicleMeshes.delete(id);
        }
      }
    });

    vehicles.forEach(vehicle => {
      let vehicleMesh = this.vehicleMeshes.get(vehicle.id);
      
      if (!vehicleMesh) {
        const geometry = new THREE.CylinderGeometry(0.4, 0.5, 0.6, 8);
        const material = new THREE.MeshStandardMaterial({
          color: vehicle.color,
          metalness: 0.3,
          roughness: 0.5,
          emissive: new THREE.Color(vehicle.color).multiplyScalar(0.2)
        });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.castShadow = true;
        mesh.userData.vehicleId = vehicle.id;

        const trailGeometry = new THREE.BufferGeometry();
        const trailPositions = new Float32Array(30 * 3);
        trailGeometry.setAttribute('position', new THREE.BufferAttribute(trailPositions, 3));
        
        const trailMaterial = new THREE.LineBasicMaterial({
          color: 0x66ccff,
          transparent: true,
          opacity: 0.4
        });
        const trail = new THREE.Line(trailGeometry, trailMaterial);
        trail.visible = this.showTrails;

        this.scene.add(mesh);
        this.scene.add(trail);

        vehicleMesh = { mesh, material, trail, trailGeometry };
        this.vehicleMeshes.set(vehicle.id, vehicleMesh);
      }

      const x = vehicle.prevX + (vehicle.x - vehicle.prevX) * alpha;
      const z = vehicle.prevZ + (vehicle.z - vehicle.prevZ) * alpha;
      vehicleMesh.mesh.position.set(x, 0.5, z);

      if (vehicleMesh.trailGeometry && this.showTrails && vehicle.trail.length > 1) {
        const positions = vehicleMesh.trailGeometry.attributes.position.array as Float32Array;
        vehicle.trail.forEach((point, i) => {
          const lerpedX = i === 0 ? x : point.x;
          const lerpedZ = i === 0 ? z : point.z;
          positions[i * 3] = lerpedX;
          positions[i * 3 + 1] = 0.3;
          positions[i * 3 + 2] = lerpedZ;
        });
        for (let i = vehicle.trail.length; i < 30; i++) {
          positions[i * 3] = positions[(vehicle.trail.length - 1) * 3];
          positions[i * 3 + 1] = 0.3;
          positions[i * 3 + 2] = positions[(vehicle.trail.length - 1) * 3 + 2];
        }
        vehicleMesh.trailGeometry.attributes.position.needsUpdate = true;
        vehicleMesh.trailGeometry.setDrawRange(0, vehicle.trail.length);
      }

      vehicleMesh.trail.visible = this.showTrails;
    });
  }

  public updateRoads(roads: Road[]): void {
    this.roads = roads;

    if (this.roadMeshes.length === 0) {
      this.createRoads(roads);
    }

    const maxVehicles = Math.max(...roads.map(r => r.vehicleCount), 1);

    this.targetHeatColors = roads.map(road => {
      const density = road.vehicleCount / maxVehicles;
      if (density < 0.33) {
        const t = density / 0.33;
        return this.interpolateColor('#00ff66', '#ccff33', t);
      } else if (density < 0.66) {
        const t = (density - 0.33) / 0.33;
        return this.interpolateColor('#ccff33', '#ffcc00', t);
      } else {
        const t = (density - 0.66) / 0.34;
        return this.interpolateColor('#ffcc00', '#ff3300', t);
      }
    });

    this.heatTransitionProgress = 0;
  }

  private interpolateColor(color1: string, color2: string, t: number): string {
    const c1 = new THREE.Color(color1);
    const c2 = new THREE.Color(color2);
    const result = new THREE.Color().lerpColors(c1, c2, t);
    return `#${result.getHexString()}`;
  }

  private updateHeatTransition(delta: number): void {
    if (this.heatTransitionProgress < 1) {
      this.heatTransitionProgress = Math.min(1, this.heatTransitionProgress + delta * 2);
      
      this.roadMeshes.forEach((roadMesh, index) => {
        const targetColor = this.showHeatmap ? this.targetHeatColors[index] : '#151525';
        const currentColor = this.currentHeatColors[index];
        const newColor = this.interpolateColor(
          currentColor,
          targetColor,
          this.heatTransitionProgress
        );
        roadMesh.material.color.set(newColor);
        
        if (this.heatTransitionProgress >= 1) {
          this.currentHeatColors[index] = targetColor;
        }
      });
    }
  }

  public setShowHeatmap(show: boolean): void {
    this.showHeatmap = show;
    this.heatTransitionProgress = 0;
  }

  public setShowTrails(show: boolean): void {
    this.showTrails = show;
    this.vehicleMeshes.forEach(vm => {
      vm.trail.visible = show;
    });
  }

  public setOnVehicleClick(callback: (vehicle: Vehicle) => void): void {
    this.onVehicleClick = callback;
  }

  private setupEventListeners(): void {
    window.addEventListener('resize', this.handleResize);
    this.renderer.domElement.addEventListener('click', this.handleClick);
  }

  private handleResize = (): void => {
    this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
  };

  private handleClick = (event: MouseEvent): void => {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    
    const vehicleMeshes = Array.from(this.vehicleMeshes.values()).map(vm => vm.mesh);
    const intersects = this.raycaster.intersectObjects(vehicleMeshes);

    if (intersects.length > 0) {
      const clickedMesh = intersects[0].object;
      const vehicleId = clickedMesh.userData.vehicleId;
      const vehicle = this.vehicles.find(v => v.id === vehicleId);
      if (vehicle && this.onVehicleClick) {
        this.onVehicleClick(vehicle);
      }
    }
  };

  public animate = (timestamp: number): void => {
    this.animationId = requestAnimationFrame(this.animate);

    const delta = Math.min((timestamp - this.lastTimestamp) / 1000, 0.1);
    this.lastTimestamp = timestamp;

    if (this.sceneOpacity < 1) {
      this.sceneOpacity = Math.min(1, this.sceneOpacity + delta * 0.5);
      this.renderer.domElement.style.opacity = this.sceneOpacity.toString();
    }

    this.updateHeatTransition(delta);
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  };

  public start(): void {
    this.renderer.domElement.style.opacity = '0';
    this.lastTimestamp = performance.now();
    this.animate(this.lastTimestamp);
  }

  public stop(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  public dispose(): void {
    this.stop();
    window.removeEventListener('resize', this.handleResize);
    this.renderer.domElement.removeEventListener('click', this.handleClick);
    this.renderer.dispose();
    this.container.removeChild(this.renderer.domElement);
  }

  public getVehicles(): Vehicle[] {
    return this.vehicles;
  }

  public getRoads(): Road[] {
    return this.roads;
  }
}
