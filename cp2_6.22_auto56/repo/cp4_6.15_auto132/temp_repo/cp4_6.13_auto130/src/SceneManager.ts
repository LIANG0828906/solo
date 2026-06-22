import * as THREE from 'three';

export class SceneManager {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private ambientLight: THREE.AmbientLight;
  private directionalLight: THREE.DirectionalLight;
  private container: HTMLElement;
  private baseLightPosition: THREE.Vector3;

  constructor(containerId: string) {
    const container = document.getElementById(containerId);
    if (!container) {
      throw new Error(`Container with id "${containerId}" not found`);
    }
    this.container = container;
    this.baseLightPosition = new THREE.Vector3(5, 8, 5);

    this.scene = this.createScene();
    this.camera = this.createCamera();
    this.renderer = this.createRenderer();
    this.ambientLight = this.createAmbientLight();
    this.directionalLight = this.createDirectionalLight();

    this.setupScene();
    this.handleResize();
    window.addEventListener('resize', () => this.handleResize());
  }

  private createScene(): THREE.Scene {
    const scene = new THREE.Scene();
    return scene;
  }

  private createCamera(): THREE.PerspectiveCamera {
    const aspect = this.container.clientWidth / this.container.clientHeight;
    const camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 1000);
    camera.position.set(0, 2, 8);
    camera.lookAt(0, 0, 0);
    return camera;
  }

  private createRenderer(): THREE.WebGLRenderer {
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    return renderer;
  }

  private createAmbientLight(): THREE.AmbientLight {
    const light = new THREE.AmbientLight(0xffffff, 0.4);
    return light;
  }

  private createDirectionalLight(): THREE.DirectionalLight {
    const light = new THREE.DirectionalLight(0xffffff, 1.2);
    light.position.copy(this.baseLightPosition);
    light.castShadow = true;
    light.shadow.mapSize.width = 2048;
    light.shadow.mapSize.height = 2048;
    light.shadow.camera.near = 0.5;
    light.shadow.camera.far = 50;
    light.shadow.camera.left = -10;
    light.shadow.camera.right = 10;
    light.shadow.camera.top = 10;
    light.shadow.camera.bottom = -10;
    light.shadow.bias = -0.0001;
    return light;
  }

  private setupScene(): void {
    this.scene.add(this.ambientLight);
    this.scene.add(this.directionalLight);
    this.container.appendChild(this.renderer.domElement);
  }

  public handleResize(): void {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  public render(): void {
    this.renderer.render(this.scene, this.camera);
  }

  public getScene(): THREE.Scene {
    return this.scene;
  }

  public getCamera(): THREE.PerspectiveCamera {
    return this.camera;
  }

  public getRenderer(): THREE.WebGLRenderer {
    return this.renderer;
  }

  public getDirectionalLight(): THREE.DirectionalLight {
    return this.directionalLight;
  }

  public getBaseLightPosition(): THREE.Vector3 {
    return this.baseLightPosition.clone();
  }

  public updateLightPosition(normalizedX: number, normalizedY: number): void {
    const maxHorizontalAngle = THREE.MathUtils.degToRad(20);
    const maxVerticalAngle = THREE.MathUtils.degToRad(10);

    const aspectRatio = this.container.clientWidth / this.container.clientHeight;
    const adjustedX = normalizedX / Math.max(1, aspectRatio);

    const horizontalOffset = adjustedX * maxHorizontalAngle;
    const verticalOffset = normalizedY * maxVerticalAngle;

    const basePos = this.baseLightPosition.clone();
    const distance = basePos.length();

    const baseYaw = Math.atan2(basePos.x, basePos.z);
    const basePitch = Math.asin(basePos.y / distance);

    const newYaw = baseYaw + horizontalOffset;
    const newPitch = Math.max(-Math.PI / 2 + 0.1, Math.min(Math.PI / 2 - 0.1, basePitch + verticalOffset));

    const targetX = distance * Math.sin(newYaw) * Math.cos(newPitch);
    const targetY = distance * Math.sin(newPitch);
    const targetZ = distance * Math.cos(newYaw) * Math.cos(newPitch);

    this.directionalLight.position.x += (targetX - this.directionalLight.position.x) * 0.1;
    this.directionalLight.position.y += (targetY - this.directionalLight.position.y) * 0.1;
    this.directionalLight.position.z += (targetZ - this.directionalLight.position.z) * 0.1;
  }
}
