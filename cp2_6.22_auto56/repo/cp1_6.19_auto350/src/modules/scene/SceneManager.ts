import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

type EventCallback = (data?: any) => void;

interface LightTarget {
  id: string;
  color?: number;
  intensity?: number;
  position?: { x: number; y: number; z: number };
}

interface MaterialTarget {
  id: string;
  color?: number;
  roughness?: number;
  metalness?: number;
  emissive?: number;
  emissiveIntensity?: number;
}

class SceneManager {
  private canvas: HTMLCanvasElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private controls: OrbitControls;
  private raycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;

  private objects: Map<string, THREE.Object3D> = new Map();
  private lights: Map<string, THREE.Light> = new Map();
  private materials: Map<string, THREE.Material> = new Map();

  private eventListeners: Map<string, EventCallback[]> = new Map();

  private animationFrameId: number | null = null;
  private lastTime: number = 0;
  private readonly minFrameTime: number = 1000 / 60;

  private activeTransitions: Array<{
    startTime: number;
    duration: number;
    update: (progress: number) => void;
  }> = [];

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    this.scene = this.createScene();
    this.camera = this.createCamera();
    this.renderer = this.createRenderer();
    this.controls = this.createControls();

    this.createRoom();
    this.createFurniture();
    this.createLights();

    this.setupEventListeners();
    this.startRenderLoop();
  }

  private createScene(): THREE.Scene {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a2e);
    return scene;
  }

  private createCamera(): THREE.PerspectiveCamera {
    const camera = new THREE.PerspectiveCamera(
      60,
      this.canvas.clientWidth / this.canvas.clientHeight,
      0.1,
      1000
    );
    camera.position.set(4, 3, 5);
    return camera;
  }

  private createRenderer(): THREE.WebGLRenderer {
    const renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
    });
    renderer.setSize(this.canvas.clientWidth, this.canvas.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    return renderer;
  }

  private createControls(): OrbitControls {
    const controls = new OrbitControls(this.camera, this.renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2.1;
    controls.minDistance = 2;
    controls.maxDistance = 20;
    return controls;
  }

  private createRoom(): void {
    const roomWidth = 6;
    const roomLength = 8;
    const roomHeight = 3;
    const halfWidth = roomWidth / 2;
    const halfLength = roomLength / 2;

    const wallMaterial = new THREE.MeshStandardMaterial({
      color: 0xf5f5f5,
      roughness: 0.8,
      metalness: 0.1,
    });
    this.materials.set('wall_material', wallMaterial);

    const floorMaterial = new THREE.MeshStandardMaterial({
      color: 0xe0e0e0,
      roughness: 0.9,
      metalness: 0.05,
    });
    this.materials.set('floor_material', floorMaterial);

    const ceilingMaterial = new THREE.MeshStandardMaterial({
      color: 0xf5f5f5,
      roughness: 0.8,
      metalness: 0.1,
      side: THREE.DoubleSide,
    });
    this.materials.set('ceiling_material', ceilingMaterial);

    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(roomWidth, roomLength),
      floorMaterial
    );
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    floor.name = 'floor';
    floor.userData.id = 'floor';
    this.scene.add(floor);
    this.objects.set('floor', floor);

    const ceiling = new THREE.Mesh(
      new THREE.PlaneGeometry(roomWidth, roomLength),
      ceilingMaterial
    );
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.y = roomHeight;
    ceiling.receiveShadow = true;
    ceiling.name = 'ceiling';
    ceiling.userData.id = 'ceiling';
    this.scene.add(ceiling);
    this.objects.set('ceiling', ceiling);

    const northWall = new THREE.Mesh(
      new THREE.PlaneGeometry(roomWidth, roomHeight),
      wallMaterial
    );
    northWall.position.set(0, roomHeight / 2, -halfLength);
    northWall.receiveShadow = true;
    northWall.name = 'wall_north';
    northWall.userData.id = 'wall_north';
    this.scene.add(northWall);
    this.objects.set('wall_north', northWall);

    const southWall = new THREE.Mesh(
      new THREE.PlaneGeometry(roomWidth, roomHeight),
      wallMaterial
    );
    southWall.position.set(0, roomHeight / 2, halfLength);
    southWall.rotation.y = Math.PI;
    southWall.receiveShadow = true;
    southWall.name = 'wall_south';
    southWall.userData.id = 'wall_south';
    this.scene.add(southWall);
    this.objects.set('wall_south', southWall);

    const eastWall = new THREE.Mesh(
      new THREE.PlaneGeometry(roomLength, roomHeight),
      wallMaterial
    );
    eastWall.position.set(halfWidth, roomHeight / 2, 0);
    eastWall.rotation.y = Math.PI / 2;
    eastWall.receiveShadow = true;
    eastWall.name = 'wall_east';
    eastWall.userData.id = 'wall_east';
    this.scene.add(eastWall);
    this.objects.set('wall_east', eastWall);

    const westWall = new THREE.Mesh(
      new THREE.PlaneGeometry(roomLength, roomHeight),
      wallMaterial
    );
    westWall.position.set(-halfWidth, roomHeight / 2, 0);
    westWall.rotation.y = -Math.PI / 2;
    westWall.receiveShadow = true;
    westWall.name = 'wall_west';
    westWall.userData.id = 'wall_west';
    this.scene.add(westWall);
    this.objects.set('wall_west', westWall);
  }

  private createFurniture(): void {
    const sofaGroup = new THREE.Group();
    sofaGroup.name = 'sofa';
    sofaGroup.userData.id = 'sofa';

    const sofaMaterial = new THREE.MeshStandardMaterial({
      color: 0x4a5568,
      roughness: 0.9,
      metalness: 0.1,
    });
    this.materials.set('sofa_material', sofaMaterial);

    const sofaBase = new THREE.Mesh(
      new THREE.BoxGeometry(2.5, 0.4, 1),
      sofaMaterial
    );
    sofaBase.position.y = 0.2;
    sofaBase.castShadow = true;
    sofaBase.receiveShadow = true;
    sofaGroup.add(sofaBase);

    const sofaBack = new THREE.Mesh(
      new THREE.BoxGeometry(2.5, 0.8, 0.2),
      sofaMaterial
    );
    sofaBack.position.set(0, 0.8, -0.4);
    sofaBack.castShadow = true;
    sofaBack.receiveShadow = true;
    sofaGroup.add(sofaBack);

    const armLeft = new THREE.Mesh(
      new THREE.BoxGeometry(0.2, 0.5, 1),
      sofaMaterial
    );
    armLeft.position.set(-1.15, 0.45, 0);
    armLeft.castShadow = true;
    armLeft.receiveShadow = true;
    sofaGroup.add(armLeft);

    const armRight = new THREE.Mesh(
      new THREE.BoxGeometry(0.2, 0.5, 1),
      sofaMaterial
    );
    armRight.position.set(1.15, 0.45, 0);
    armRight.castShadow = true;
    armRight.receiveShadow = true;
    sofaGroup.add(armRight);

    sofaGroup.position.set(0, 0, 2);
    this.scene.add(sofaGroup);
    this.objects.set('sofa', sofaGroup);

    const tableMaterial = new THREE.MeshStandardMaterial({
      color: 0x8b5a2b,
      roughness: 0.7,
      metalness: 0.1,
    });
    this.materials.set('coffee_table_material', tableMaterial);

    const coffeeTable = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 0.05, 0.6),
      tableMaterial
    );
    coffeeTable.position.set(0, 0.4, 0.5);
    coffeeTable.castShadow = true;
    coffeeTable.receiveShadow = true;
    coffeeTable.name = 'coffee_table';
    coffeeTable.userData.id = 'coffee_table';

    const leg1 = new THREE.Mesh(
      new THREE.BoxGeometry(0.05, 0.4, 0.05),
      tableMaterial
    );
    leg1.position.set(-0.55, 0.2, 0.25);
    leg1.castShadow = true;
    leg1.receiveShadow = true;
    coffeeTable.add(leg1);

    const leg2 = leg1.clone();
    leg2.position.set(0.55, 0.2, 0.25);
    coffeeTable.add(leg2);

    const leg3 = leg1.clone();
    leg3.position.set(-0.55, 0.2, -0.25);
    coffeeTable.add(leg3);

    const leg4 = leg1.clone();
    leg4.position.set(0.55, 0.2, -0.25);
    coffeeTable.add(leg4);

    this.scene.add(coffeeTable);
    this.objects.set('coffee_table', coffeeTable);

    const carpetMaterial = new THREE.MeshStandardMaterial({
      color: 0x2d3748,
      roughness: 1,
      metalness: 0,
    });
    this.materials.set('carpet_material', carpetMaterial);

    const carpet = new THREE.Mesh(
      new THREE.PlaneGeometry(3, 2),
      carpetMaterial
    );
    carpet.rotation.x = -Math.PI / 2;
    carpet.position.set(0, 0.01, 1);
    carpet.receiveShadow = true;
    carpet.name = 'carpet';
    carpet.userData.id = 'carpet';
    this.scene.add(carpet);
    this.objects.set('carpet', carpet);
  }

  private createLights(): void {
    const ambientLight = new THREE.AmbientLight(0x404040, 0.3);
    ambientLight.name = 'ambient_light';
    ambientLight.userData.id = 'ambient_light';
    this.scene.add(ambientLight);
    this.lights.set('ambient_light', ambientLight);

    const mainLight = new THREE.DirectionalLight(0xffffff, 0.8);
    mainLight.position.set(3, 5, 3);
    mainLight.castShadow = true;
    mainLight.shadow.mapSize.width = 2048;
    mainLight.shadow.mapSize.height = 2048;
    mainLight.shadow.camera.near = 0.5;
    mainLight.shadow.camera.far = 50;
    mainLight.shadow.camera.left = -10;
    mainLight.shadow.camera.right = 10;
    mainLight.shadow.camera.top = 10;
    mainLight.shadow.camera.bottom = -10;
    mainLight.name = 'main_light';
    mainLight.userData.id = 'main_light';
    this.scene.add(mainLight);
    this.lights.set('main_light', mainLight);

    const fillLight = new THREE.DirectionalLight(0xffffff, 0.3);
    fillLight.position.set(-3, 4, -3);
    fillLight.name = 'fill_light';
    fillLight.userData.id = 'fill_light';
    this.scene.add(fillLight);
    this.lights.set('fill_light', fillLight);
  }

  private setupEventListeners(): void {
    this.canvas.addEventListener('click', this.handleCanvasClick);
    window.addEventListener('resize', this.handleResize);
  }

  private handleCanvasClick = (event: MouseEvent): void => {
    const rect = this.canvas.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.scene.children, true);

    if (intersects.length > 0) {
      let object = intersects[0].object;
      while (object.parent && !object.userData.id) {
        object = object.parent;
      }
      if (object.userData.id) {
        this.emit('object:select', {
          id: object.userData.id,
          object,
          point: intersects[0].point,
        });
      }
    }
  };

  private handleResize = (): void => {
    this.camera.aspect = this.canvas.clientWidth / this.canvas.clientHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.canvas.clientWidth, this.canvas.clientHeight);
  };

  private startRenderLoop(): void {
    const animate = (time: number) => {
      this.animationFrameId = requestAnimationFrame(animate);

      const deltaTime = time - this.lastTime;
      if (deltaTime < this.minFrameTime) return;

      this.lastTime = time;

      this.updateTransitions(time);
      this.controls.update();
      this.renderer.render(this.scene, this.camera);
    };

    this.animationFrameId = requestAnimationFrame(animate);
  }

  private updateTransitions(currentTime: number): void {
    this.activeTransitions = this.activeTransitions.filter((transition) => {
      const elapsed = currentTime - transition.startTime;
      const progress = Math.min(elapsed / transition.duration, 1);
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      transition.update(easeProgress);
      return progress < 1;
    });
  }

  takeThumbnail(): string {
    this.renderer.render(this.scene, this.camera);
    return this.renderer.domElement.toDataURL('image/png');
  }

  transitionToLights(targetLights: LightTarget[], duration: number = 500): void {
    const currentTime = performance.now();

    targetLights.forEach((target) => {
      const light = this.lights.get(target.id);
      if (!light) return;

      const startColor = (light as THREE.AmbientLight).color
        ? (light as THREE.AmbientLight).color.clone()
        : null;
      const startIntensity = light.intensity;
      const startPosition = light.position.clone();

      this.activeTransitions.push({
        startTime: currentTime,
        duration,
        update: (progress: number) => {
          if (target.color !== undefined && startColor) {
            const targetColor = new THREE.Color(target.color);
            (light as THREE.AmbientLight).color.lerpColors(
              startColor,
              targetColor,
              progress
            );
          }
          if (target.intensity !== undefined) {
            light.intensity =
              startIntensity + (target.intensity - startIntensity) * progress;
          }
          if (target.position) {
            light.position.lerpVectors(
              startPosition,
              new THREE.Vector3(
                target.position.x,
                target.position.y,
                target.position.z
              ),
              progress
            );
          }
        },
      });
    });
  }

  transitionToMaterials(
    targetMaterials: MaterialTarget[],
    duration: number = 500
  ): void {
    const currentTime = performance.now();

    targetMaterials.forEach((target) => {
      const object = this.objects.get(target.id);
      if (!object) return;

      const material = this.getObjectMaterial(object);
      if (!material || !(material instanceof THREE.MeshStandardMaterial)) return;

      const startColor = material.color.clone();
      const startRoughness = material.roughness;
      const startMetalness = material.metalness;
      const startEmissive = material.emissive.clone();
      const startEmissiveIntensity = material.emissiveIntensity;

      this.activeTransitions.push({
        startTime: currentTime,
        duration,
        update: (progress: number) => {
          if (target.color !== undefined) {
            const targetColor = new THREE.Color(target.color);
            material.color.lerpColors(startColor, targetColor, progress);
          }
          if (target.roughness !== undefined) {
            material.roughness =
              startRoughness + (target.roughness - startRoughness) * progress;
          }
          if (target.metalness !== undefined) {
            material.metalness =
              startMetalness + (target.metalness - startMetalness) * progress;
          }
          if (target.emissive !== undefined) {
            const targetEmissive = new THREE.Color(target.emissive);
            material.emissive.lerpColors(
              startEmissive,
              targetEmissive,
              progress
            );
          }
          if (target.emissiveIntensity !== undefined) {
            material.emissiveIntensity =
              startEmissiveIntensity +
              (target.emissiveIntensity - startEmissiveIntensity) * progress;
          }
        },
      });
    });
  }

  private getObjectMaterial(
    object: THREE.Object3D
  ): THREE.Material | undefined {
    if (object instanceof THREE.Mesh && object.material) {
      if (Array.isArray(object.material)) {
        return object.material[0];
      }
      return object.material;
    }
    for (const child of object.children) {
      const mat = this.getObjectMaterial(child);
      if (mat) return mat;
    }
    return undefined;
  }

  setLightParameter(
    lightId: string,
    param: string,
    value: number | { x: number; y: number; z: number }
  ): void {
    const light = this.lights.get(lightId);
    if (!light) return;

    if (param === 'color' && typeof value === 'number') {
      (light as THREE.AmbientLight).color.setHex(value);
    } else if (param === 'intensity' && typeof value === 'number') {
      light.intensity = value;
    } else if (param === 'position' && typeof value === 'object') {
      light.position.set(value.x, value.y, value.z);
    }
  }

  setMaterialParameter(
    objectId: string,
    param: string,
    value: number
  ): void {
    const object = this.objects.get(objectId);
    if (!object) return;

    const material = this.getObjectMaterial(object);
    if (!material || !(material instanceof THREE.MeshStandardMaterial)) return;

    if (param === 'color' && typeof value === 'number') {
      material.color.setHex(value);
    } else if (param === 'roughness' && typeof value === 'number') {
      material.roughness = value;
    } else if (param === 'metalness' && typeof value === 'number') {
      material.metalness = value;
    } else if (param === 'emissive' && typeof value === 'number') {
      material.emissive.setHex(value);
    } else if (param === 'emissiveIntensity' && typeof value === 'number') {
      material.emissiveIntensity = value;
    }
  }

  on(event: string, callback: EventCallback): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  off(event: string, callback: EventCallback): void {
    const listeners = this.eventListeners.get(event);
    if (!listeners) return;

    const index = listeners.indexOf(callback);
    if (index > -1) {
      listeners.splice(index, 1);
    }
  }

  emit(event: string, data?: any): void {
    const listeners = this.eventListeners.get(event);
    if (!listeners) return;

    listeners.forEach((callback) => callback(data));
  }

  dispose(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }

    this.canvas.removeEventListener('click', this.handleCanvasClick);
    window.removeEventListener('resize', this.handleResize);

    this.objects.forEach((object) => {
      if (object instanceof THREE.Mesh) {
        object.geometry.dispose();
        if (Array.isArray(object.material)) {
          object.material.forEach((m) => m.dispose());
        } else {
          object.material.dispose();
        }
      }
    });

    this.lights.forEach((light) => {
      this.scene.remove(light);
    });

    this.controls.dispose();
    this.renderer.dispose();
  }

  getScene(): THREE.Scene {
    return this.scene;
  }

  getCamera(): THREE.PerspectiveCamera {
    return this.camera;
  }

  getRenderer(): THREE.WebGLRenderer {
    return this.renderer;
  }

  getObjectById(id: string): THREE.Object3D | undefined {
    return this.objects.get(id);
  }

  getLightById(id: string): THREE.Light | undefined {
    return this.lights.get(id);
  }
}

export default SceneManager;
