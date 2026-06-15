import * as THREE from 'three';
import { BuildingGenerator } from './BuildingGenerator';
import { EffectsEngine } from './EffectsEngine';

export interface SceneState {
  time: number;
  season: string;
  weather: string;
}

export interface BuildingData {
  id: string;
  height: number;
  width: number;
  depth: number;
  x: number;
  z: number;
  color: number;
  emissive: number;
  emissiveIntensity: number;
}

interface LightingParams {
  color: THREE.Color;
  intensity: number;
  shadowRadius: number;
  ambientIntensity: number;
  position: THREE.Vector3;
  emissiveIntensity: number;
}

export class SceneManager {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private container: HTMLElement;

  private buildingGenerator: BuildingGenerator;
  private effectsEngine: EffectsEngine;

  private ambientLight: THREE.AmbientLight;
  private directionalLight: THREE.DirectionalLight;
  private hemisphereLight: THREE.HemisphereLight;
  private moonLight: THREE.PointLight;

  private ground: THREE.Mesh | null = null;
  private renderTarget: THREE.WebGLRenderTarget | null = null;
  private groundMirror: THREE.Mesh | null = null;

  private isDragging: boolean = false;
  private previousMousePosition: { x: number; y: number } = { x: 0, y: 0 };
  private cameraAngle: number = Math.PI / 4;
  private cameraHeight: number = 60;
  private cameraDistance: number = 100;

  private targetState: SceneState;
  private currentState: SceneState;
  private transitionProgress: number = 1;
  private transitionDuration: number = 0.5;
  private isTransitioning: boolean = false;
  private transitionFromState: SceneState;
  private transitionToState: SceneState;

  private buildings: THREE.Group | null = null;
  private buildingData: BuildingData[] = [];

  private animationFrameId: number | null = null;
  private clock: THREE.Clock;

  private sunGlow: THREE.Mesh | null = null;
  private sunGlowLight: THREE.PointLight | null = null;

  private targetFogDensity: number = 0;
  private currentFogDensity: number = 0;
  private targetFogColor: THREE.Color = new THREE.Color(0x0a0a1a);
  private currentFogColor: THREE.Color = new THREE.Color(0x0a0a1a);

  private buildingColorTransitionProgress: number = 1;
  private buildingColorTransitionDuration: number = 0.5;
  private isBuildingColorTransitioning: boolean = false;
  private previousHueShift: number = 0;
  private targetHueShift: number = 0;

  constructor(container: HTMLElement) {
    this.container = container;
    this.clock = new THREE.Clock();

    this.currentState = {
      time: 12,
      season: 'summer',
      weather: 'sunny'
    };
    this.targetState = { ...this.currentState };
    this.transitionFromState = { ...this.currentState };
    this.transitionToState = { ...this.currentState };

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a0a1a);

    this.camera = new THREE.PerspectiveCamera(
      60,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    this.updateCameraPosition();

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1;

    container.appendChild(this.renderer.domElement);

    this.ambientLight = new THREE.AmbientLight(0x404050, 0.3);
    this.scene.add(this.ambientLight);

    this.directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    this.directionalLight.castShadow = true;
    this.directionalLight.shadow.mapSize.width = 2048;
    this.directionalLight.shadow.mapSize.height = 2048;
    this.directionalLight.shadow.camera.near = 0.5;
    this.directionalLight.shadow.camera.far = 500;
    this.directionalLight.shadow.camera.left = -150;
    this.directionalLight.shadow.camera.right = 150;
    this.directionalLight.shadow.camera.top = 150;
    this.directionalLight.shadow.camera.bottom = -150;
    this.directionalLight.shadow.bias = -0.0005;
    this.directionalLight.shadow.normalBias = 0.02;
    this.scene.add(this.directionalLight);

    this.hemisphereLight = new THREE.HemisphereLight(0x87ceeb, 0x1a1a2e, 0.4);
    this.scene.add(this.hemisphereLight);

    this.moonLight = new THREE.PointLight(0x4466aa, 0, 200);
    this.moonLight.position.set(0, 100, 0);
    this.scene.add(this.moonLight);

    this.createGround();
    this.createSunGlow();

    this.buildingGenerator = new BuildingGenerator(this.scene);
    this.effectsEngine = new EffectsEngine(this.scene);

    this.previousHueShift = this.getSeasonHueShift(this.currentState.season);
    this.targetHueShift = this.previousHueShift;

    this.setupEventListeners();

    this.updateSceneFromState(this.currentState, 1);
    this.animate();
  }

  private createGround() {
    const groundGeometry = new THREE.PlaneGeometry(500, 500);
    
    const groundMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a1a2e,
      metalness: 0.4,
      roughness: 0.7,
      envMapIntensity: 0.5
    });
    this.ground = new THREE.Mesh(groundGeometry, groundMaterial);
    this.ground.rotation.x = -Math.PI / 2;
    this.ground.receiveShadow = true;
    this.scene.add(this.ground);

    this.groundMirror = this.createReflector(500, 500, 0.35);
    this.groundMirror.rotation.x = -Math.PI / 2;
    this.groundMirror.position.y = 0.01;
    this.scene.add(this.groundMirror);
  }

  private createReflector(width: number, height: number, opacity: number): THREE.Mesh {
    const geometry = new THREE.PlaneGeometry(width, height);
    
    const reflectorPlane = new THREE.Plane();
    const normal = new THREE.Vector3();
    const reflectorWorldPosition = new THREE.Vector3();
    const cameraWorldPosition = new THREE.Vector3();
    const rotationMatrix = new THREE.Matrix4();
    const lookAtPosition = new THREE.Vector3(0, 0, -1);
    const clipPlane = new THREE.Vector4();
    const view = new THREE.Vector3();
    const target = new THREE.Vector3();
    const q = new THREE.Vector4();
    const textureMatrix = new THREE.Matrix4();
    const virtualCamera = new THREE.PerspectiveCamera();

    this.renderTarget = new THREE.WebGLRenderTarget(1024, 1024, {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      format: THREE.RGBAFormat
    });

    const material = new THREE.MeshStandardMaterial({
      map: this.renderTarget.texture,
      transparent: true,
      opacity: opacity,
      metalness: 0.1,
      roughness: 0.2
    });

    const mesh = new THREE.Mesh(geometry, material);

    (mesh as any).onBeforeRender = (renderer: THREE.WebGLRenderer, scene: THREE.Scene, camera: THREE.PerspectiveCamera) => {
      reflectorWorldPosition.setFromMatrixPosition(mesh.matrixWorld);
      cameraWorldPosition.setFromMatrixPosition(camera.matrixWorld);
      
      rotationMatrix.extractRotation(mesh.matrixWorld);
      normal.set(0, 0, 1);
      normal.applyMatrix4(rotationMatrix);
      
      view.subVectors(reflectorWorldPosition, cameraWorldPosition);
      
      if (view.dot(normal) > 0) return;
      
      view.reflect(normal).negate();
      view.add(reflectorWorldPosition);
      
      rotationMatrix.extractRotation(camera.matrixWorld);
      lookAtPosition.set(0, 0, -1);
      lookAtPosition.applyMatrix4(rotationMatrix);
      lookAtPosition.add(cameraWorldPosition);
      
      target.subVectors(reflectorWorldPosition, lookAtPosition);
      target.reflect(normal).negate();
      target.add(reflectorWorldPosition);
      
      virtualCamera.position.copy(view);
      virtualCamera.up.set(0, 1, 0);
      virtualCamera.up.applyMatrix4(rotationMatrix);
      virtualCamera.up.reflect(normal);
      virtualCamera.lookAt(target);
      virtualCamera.far = camera.far;
      
      virtualCamera.updateMatrixWorld();
      virtualCamera.projectionMatrix.copy(camera.projectionMatrix);
      
      textureMatrix.set(
        0.5, 0.0, 0.0, 0.5,
        0.0, 0.5, 0.0, 0.5,
        0.0, 0.0, 0.5, 0.5,
        0.0, 0.0, 0.0, 1.0
      );
      textureMatrix.multiply(virtualCamera.projectionMatrix);
      textureMatrix.multiply(virtualCamera.matrixWorldInverse);
      textureMatrix.multiply(mesh.matrixWorld);
      
      reflectorPlane.setFromNormalAndCoplanarPoint(normal, reflectorWorldPosition);
      reflectorPlane.translate(normal.clone().multiplyScalar(-0.01));
      
      clipPlane.set(reflectorPlane.normal.x, reflectorPlane.normal.y, reflectorPlane.normal.z, reflectorPlane.constant);
      
      const projectionMatrix = virtualCamera.projectionMatrix;
      q.x = (Math.sign(clipPlane.x) + projectionMatrix.elements[8]) / projectionMatrix.elements[0];
      q.y = (Math.sign(clipPlane.y) + projectionMatrix.elements[9]) / projectionMatrix.elements[5];
      q.z = -1.0;
      q.w = (1.0 + projectionMatrix.elements[10]) / projectionMatrix.elements[14];
      
      clipPlane.multiplyScalar(2.0 / clipPlane.dot(q));
      
      projectionMatrix.elements[2] = clipPlane.x;
      projectionMatrix.elements[6] = clipPlane.y;
      projectionMatrix.elements[10] = clipPlane.z + 1.0;
      projectionMatrix.elements[14] = clipPlane.w;
      
      const currentRenderTarget = renderer.getRenderTarget();
      const currentXrEnabled = renderer.xr.enabled;
      const currentShadowAutoUpdate = renderer.shadowMap.autoUpdate;
      
      renderer.xr.enabled = false;
      renderer.shadowMap.autoUpdate = false;
      
      renderer.setRenderTarget(this.renderTarget);
      renderer.state.buffers.depth.setMask(true);
      
      if (renderer.autoClear === false) renderer.clear();
      mesh.visible = false;
      renderer.render(scene, virtualCamera);
      mesh.visible = true;
      
      renderer.xr.enabled = currentXrEnabled;
      renderer.shadowMap.autoUpdate = currentShadowAutoUpdate;
      renderer.setRenderTarget(currentRenderTarget);
      
      (material as any).map = this.renderTarget!.texture;
      (material as any).needsUpdate = true;
    };

    return mesh;
  }

  private createSunGlow() {
    const glowGroup = new THREE.Group();

    const glowGeometry = new THREE.SphereGeometry(6, 32, 32);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: 0xffdd88,
      transparent: true,
      opacity: 0.8
    });
    this.sunGlow = new THREE.Mesh(glowGeometry, glowMaterial);
    glowGroup.add(this.sunGlow);

    const haloGeometry = new THREE.RingGeometry(6, 10, 32);
    const haloMaterial = new THREE.MeshBasicMaterial({
      color: 0xffaa55,
      transparent: true,
      opacity: 0.3,
      side: THREE.DoubleSide
    });
    const halo = new THREE.Mesh(haloGeometry, haloMaterial);
    glowGroup.add(halo);

    this.sunGlowLight = new THREE.PointLight(0xffdd88, 0, 150);
    glowGroup.add(this.sunGlowLight);

    this.scene.add(glowGroup);
    (this.sunGlow as any).parentGroup = glowGroup;
  }

  private setupEventListeners() {
    const canvas = this.renderer.domElement;

    canvas.addEventListener('mousedown', this.onMouseDown.bind(this));
    canvas.addEventListener('mousemove', this.onMouseMove.bind(this));
    canvas.addEventListener('mouseup', this.onMouseUp.bind(this));
    canvas.addEventListener('mouseleave', this.onMouseUp.bind(this));
    canvas.addEventListener('wheel', this.onWheel.bind(this));

    canvas.addEventListener('touchstart', this.onTouchStart.bind(this));
    canvas.addEventListener('touchmove', this.onTouchMove.bind(this));
    canvas.addEventListener('touchend', this.onTouchEnd.bind(this));

    window.addEventListener('resize', this.onResize.bind(this));
  }

  private onMouseDown(event: MouseEvent) {
    this.isDragging = true;
    this.previousMousePosition = { x: event.clientX, y: event.clientY };
  }

  private onMouseMove(event: MouseEvent) {
    if (!this.isDragging) return;

    const deltaX = event.clientX - this.previousMousePosition.x;
    const deltaY = event.clientY - this.previousMousePosition.y;

    this.cameraAngle -= deltaX * 0.005;
    this.cameraHeight = Math.max(10, Math.min(150, this.cameraHeight + deltaY * 0.3));

    this.previousMousePosition = { x: event.clientX, y: event.clientY };
    this.updateCameraPosition();
  }

  private onMouseUp() {
    this.isDragging = false;
  }

  private onWheel(event: WheelEvent) {
    event.preventDefault();
    const delta = event.deltaY * 0.1;
    this.cameraDistance = Math.max(10, Math.min(200, this.cameraDistance + delta));
    this.updateCameraPosition();
  }

  private onTouchStart(event: TouchEvent) {
    if (event.touches.length === 1) {
      this.isDragging = true;
      this.previousMousePosition = {
        x: event.touches[0].clientX,
        y: event.touches[0].clientY
      };
    }
  }

  private onTouchMove(event: TouchEvent) {
    if (!this.isDragging || event.touches.length !== 1) return;

    const deltaX = event.touches[0].clientX - this.previousMousePosition.x;
    const deltaY = event.touches[0].clientY - this.previousMousePosition.y;

    this.cameraAngle -= deltaX * 0.005;
    this.cameraHeight = Math.max(10, Math.min(150, this.cameraHeight + deltaY * 0.3));

    this.previousMousePosition = {
      x: event.touches[0].clientX,
      y: event.touches[0].clientY
    };
    this.updateCameraPosition();
  }

  private onTouchEnd() {
    this.isDragging = false;
  }

  private onResize() {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(width, height);
  }

  private updateCameraPosition() {
    const x = Math.cos(this.cameraAngle) * this.cameraDistance;
    const z = Math.sin(this.cameraAngle) * this.cameraDistance;

    this.camera.position.set(x, this.cameraHeight, z);
    this.camera.lookAt(0, 20, 0);
  }

  public setBuildingData(data: BuildingData[]) {
    this.buildingData = data;
    this.rebuildBuildings();
  }

  private rebuildBuildings() {
    if (this.buildings) {
      this.scene.remove(this.buildings);
    }

    const seasonHueShift = this.getSeasonHueShift(this.currentState.season);
    this.buildings = this.buildingGenerator.generateBuildings(
      this.buildingData,
      seasonHueShift
    );
  }

  private getSeasonHueShift(season: string): number {
    switch (season) {
      case 'spring':
        return 20;
      case 'summer':
        return 20;
      case 'autumn':
        return 40;
      case 'winter':
        return -20;
      default:
        return 0;
    }
  }

  public setState(newState: Partial<SceneState>, animate: boolean = true) {
    const needsSeasonTransition = newState.season !== undefined && newState.season !== this.targetState.season;

    this.transitionFromState = { ...this.targetState };
    this.targetState = { ...this.targetState, ...newState };
    this.transitionToState = { ...this.targetState };

    if (needsSeasonTransition) {
      this.previousHueShift = this.getSeasonHueShift(this.transitionFromState.season);
      this.targetHueShift = this.getSeasonHueShift(this.targetState.season);
      this.isBuildingColorTransitioning = true;
      this.buildingColorTransitionProgress = 0;
    }

    if (animate && (this.transitionFromState.time !== this.targetState.time ||
        this.transitionFromState.season !== this.targetState.season ||
        this.transitionFromState.weather !== this.targetState.weather)) {
      this.transitionProgress = 0;
      this.isTransitioning = true;
    } else {
      this.currentState = { ...this.targetState };
      this.transitionProgress = 1;
      this.isTransitioning = false;
      this.updateSceneFromState(this.currentState, 1);
    }
  }

  private lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t;
  }

  private lerpColor(color1: THREE.Color, color2: THREE.Color, t: number): THREE.Color {
    const result = new THREE.Color();
    result.r = this.lerp(color1.r, color2.r, t);
    result.g = this.lerp(color1.g, color2.g, t);
    result.b = this.lerp(color1.b, color2.b, t);
    return result;
  }

  private interpolateState(from: SceneState, to: SceneState, t: number): SceneState {
    return {
      time: this.lerp(from.time, to.time, t),
      season: t < 0.5 ? from.season : to.season,
      weather: t < 0.5 ? from.weather : to.weather
    };
  }

  private easeInOutCubic(t: number): number {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  private kelvinToRGB(kelvin: number): THREE.Color {
    const temp = kelvin / 100;
    let red, green, blue;

    if (temp <= 66) {
      red = 255;
      green = Math.min(255, Math.max(0, 99.4708025861 * Math.log(temp) - 161.1195681661));
      blue = temp <= 19 
        ? 0 
        : Math.min(255, Math.max(0, 138.5177312231 * Math.log(temp - 10) - 305.0447927307));
    } else {
      red = Math.min(255, Math.max(0, 329.698727446 * Math.pow(temp - 60, -0.1332047592)));
      green = Math.min(255, Math.max(0, 288.1221695283 * Math.pow(temp - 60, -0.0755148492)));
      blue = 255;
    }

    return new THREE.Color(
      Math.floor(red) / 255,
      Math.floor(green) / 255,
      Math.floor(blue) / 255
    );
  }

  private getLightingParams(time: number, weather: string): LightingParams {
    const sunAngle = ((time - 6) / 12) * Math.PI;
    const sunHeight = Math.sin(sunAngle);
    const sunX = Math.cos(sunAngle) * 100;
    const sunY = Math.max(-50, sunHeight * 120);
    const sunZ = -50;

    let color: THREE.Color;
    let intensity: number;
    let shadowRadius: number;
    let ambientIntensity: number;
    let emissiveIntensity: number;

    if (time >= 5 && time < 7) {
      const t = (time - 5) / 2;
      const nightColor = this.kelvinToRGB(8000);
      const morningColor = this.kelvinToRGB(3500);
      color = new THREE.Color().lerpColors(nightColor, morningColor, t);
      intensity = 0.2 + t * 0.1;
      shadowRadius = 6 - t * 2;
      ambientIntensity = 0.1 + t * 0.15;
      emissiveIntensity = 0.5 - t * 0.2;
    } else if (time >= 7 && time < 11) {
      const t = (time - 7) / 4;
      const morningColor = this.kelvinToRGB(3500);
      const noonColor = this.kelvinToRGB(5500);
      color = new THREE.Color().lerpColors(morningColor, noonColor, t);
      intensity = 0.3 + t * 0.7;
      shadowRadius = 4 - t * 3.5;
      ambientIntensity = 0.25 + t * 0.15;
      emissiveIntensity = 0.3 - t * 0.25;
    } else if (time >= 11 && time < 13) {
      color = this.kelvinToRGB(5500);
      intensity = 1.0;
      shadowRadius = 0.5;
      ambientIntensity = 0.4;
      emissiveIntensity = 0.05;
    } else if (time >= 13 && time < 17) {
      const t = (time - 13) / 4;
      const noonColor = this.kelvinToRGB(5500);
      const afternoonColor = this.kelvinToRGB(4500);
      color = new THREE.Color().lerpColors(noonColor, afternoonColor, t);
      intensity = 1.0 - t * 0.25;
      shadowRadius = 0.5 + t * 1.5;
      ambientIntensity = 0.4 - t * 0.1;
      emissiveIntensity = 0.05 + t * 0.1;
    } else if (time >= 17 && time < 19) {
      const t = (time - 17) / 2;
      const afternoonColor = this.kelvinToRGB(4500);
      const sunsetColor = this.kelvinToRGB(2500);
      color = new THREE.Color().lerpColors(afternoonColor, sunsetColor, t);
      intensity = 0.75 - t * 0.35;
      shadowRadius = 2 + t * 3;
      ambientIntensity = 0.3 - t * 0.1;
      emissiveIntensity = 0.15 + t * 0.3;
    } else if (time >= 19 && time < 22) {
      const t = (time - 19) / 3;
      const sunsetColor = this.kelvinToRGB(2500);
      const nightColor = this.kelvinToRGB(8000);
      color = new THREE.Color().lerpColors(sunsetColor, nightColor, t);
      intensity = 0.4 - t * 0.3;
      shadowRadius = 5 + t * 0.5;
      ambientIntensity = 0.2 - t * 0.1;
      emissiveIntensity = 0.45 + t * 0.05;
    } else {
      color = this.kelvinToRGB(8000);
      intensity = 0.1;
      shadowRadius = 6;
      ambientIntensity = 0.1;
      emissiveIntensity = 0.5;
    }

    if (weather === 'foggy') {
      intensity *= 0.4;
      ambientIntensity *= 1.5;
      shadowRadius *= 2;
    } else if (weather === 'rainy' || weather === 'cloudy') {
      intensity *= 0.6;
      ambientIntensity *= 1.3;
      shadowRadius *= 1.5;
    }

    return {
      color,
      intensity,
      shadowRadius,
      ambientIntensity,
      position: new THREE.Vector3(sunX, sunY, sunZ),
      emissiveIntensity
    };
  }

  private getSkyColor(time: number): THREE.Color {
    if (time >= 5 && time < 7) {
      const t = (time - 5) / 2;
      return new THREE.Color().lerpColors(
        new THREE.Color(0x0a0a1a),
        new THREE.Color(0xffaa55),
        t
      );
    } else if (time >= 7 && time < 11) {
      const t = (time - 7) / 4;
      return new THREE.Color().lerpColors(
        new THREE.Color(0xffaa55),
        new THREE.Color(0x87ceeb),
        t
      );
    } else if (time >= 11 && time < 17) {
      return new THREE.Color(0x87ceeb);
    } else if (time >= 17 && time < 19) {
      const t = (time - 17) / 2;
      return new THREE.Color().lerpColors(
        new THREE.Color(0x87ceeb),
        new THREE.Color(0xff6633),
        t
      );
    } else if (time >= 19 && time < 22) {
      const t = (time - 19) / 3;
      return new THREE.Color().lerpColors(
        new THREE.Color(0xff6633),
        new THREE.Color(0x0a0a2a),
        t
      );
    } else {
      return new THREE.Color(0x0a0a2a);
    }
  }

  private updateSceneFromState(state: SceneState, transitionT: number = 1) {
    this.updateLighting(state.time, state.weather, transitionT);
    this.updateAtmosphere(state.time, state.weather, transitionT);
    this.effectsEngine.updateWeather(state.weather, state.season);
    this.updateSunGlow(state.time, state.weather);
    this.updateMoonLight(state.time);
  }

  private updateLighting(time: number, weather: string, transitionT: number) {
    const params = this.getLightingParams(time, weather);

    this.directionalLight.position.lerp(params.position, transitionT);
    this.directionalLight.color.lerp(params.color, transitionT);
    this.directionalLight.intensity = this.lerp(this.directionalLight.intensity, params.intensity, transitionT);
    this.directionalLight.shadow.radius = this.lerp(this.directionalLight.shadow.radius, params.shadowRadius, transitionT);

    this.ambientLight.intensity = this.lerp(this.ambientLight.intensity, params.ambientIntensity, transitionT);

    const skyColor = this.getSkyColor(time);
    this.hemisphereLight.color.lerp(skyColor, transitionT);
    this.hemisphereLight.intensity = this.lerp(this.hemisphereLight.intensity, params.ambientIntensity * 1.5, transitionT);

    this.buildingGenerator.updateEmissiveIntensity(params.emissiveIntensity);
  }

  private calculateFogDensityForVisibility(visibilityDistance: number, visibleAtDistance: number = 0.02): number {
    return -Math.log(visibleAtDistance) / visibilityDistance;
  }

  private updateAtmosphere(time: number, weather: string, transitionT: number) {
    const skyColor = this.getSkyColor(time);

    let bgColor: THREE.Color;
    let fogColor: THREE.Color;
    let fogDensity: number;

    if (weather === 'foggy') {
      bgColor = new THREE.Color(0x888899);
      fogColor = new THREE.Color(0x888899);
      fogDensity = 0.03;
    } else if (weather === 'rainy') {
      bgColor = skyColor.clone().multiplyScalar(0.5);
      fogColor = new THREE.Color(0x334455);
      fogDensity = 0.01;
    } else if (weather === 'cloudy') {
      bgColor = skyColor.clone().multiplyScalar(0.7);
      fogColor = skyColor.clone().multiplyScalar(0.7);
      fogDensity = 0.005;
    } else {
      bgColor = skyColor;
      fogColor = skyColor;
      fogDensity = 0;
    }

    this.targetFogColor = fogColor;
    this.targetFogDensity = fogDensity;

    this.currentFogColor.lerp(bgColor, transitionT);
    this.scene.background = this.currentFogColor.clone();

    if (this.ground) {
      const groundColor = weather === 'foggy'
        ? new THREE.Color(0x555566)
        : new THREE.Color(0x1a1a2e);
      (this.ground.material as THREE.MeshStandardMaterial).color.lerp(groundColor, transitionT);
    }

    if (weather === 'foggy') {
      this.camera.far = 80;
      this.camera.updateProjectionMatrix();
    } else if (weather === 'rainy') {
      this.camera.far = 150;
      this.camera.updateProjectionMatrix();
    } else {
      this.camera.far = 500;
      this.camera.updateProjectionMatrix();
    }
  }

  private updateSunGlow(time: number, weather: string) {
    if (!this.sunGlow || !(this.sunGlow as any).parentGroup) return;

    const parentGroup = (this.sunGlow as any).parentGroup as THREE.Group;
    const glowMaterial = this.sunGlow.material as THREE.MeshBasicMaterial;
    const glowLight = this.sunGlowLight as THREE.PointLight;

    if (weather !== 'sunny' || time < 6 || time > 19) {
      parentGroup.visible = false;
      return;
    }

    parentGroup.visible = true;

    const sunAngle = ((time - 6) / 12) * Math.PI;
    const sunHeight = Math.sin(sunAngle);
    const sunX = Math.cos(sunAngle) * 80;
    const sunY = sunHeight * 80;
    const sunZ = -60;

    parentGroup.position.set(sunX, sunY, sunZ);

    if (time >= 6 && time < 8) {
      glowMaterial.color = new THREE.Color(0xffaa55);
      glowMaterial.opacity = 0.7;
      glowLight.color = new THREE.Color(0xffaa55);
      glowLight.intensity = 0.5;
    } else if (time >= 8 && time < 17) {
      glowMaterial.color = new THREE.Color(0xffffaa);
      glowMaterial.opacity = 0.9;
      glowLight.color = new THREE.Color(0xffffaa);
      glowLight.intensity = 1;
    } else {
      glowMaterial.color = new THREE.Color(0xff6622);
      glowMaterial.opacity = 0.6;
      glowLight.color = new THREE.Color(0xff6622);
      glowLight.intensity = 0.4;
    }
  }

  private updateMoonLight(time: number) {
    const isNight = time < 6 || time > 19;
    const moonIntensity = isNight ? 0.5 : 0;
    
    this.moonLight.intensity = this.lerp(this.moonLight.intensity, moonIntensity, 0.1);
    this.moonLight.position.set(
      Math.cos(Math.PI) * 60,
      80,
      Math.sin(Math.PI) * 60
    );
  }

  private updateGroundReflection() {
    if (!this.groundMirror || !this.renderTarget) return;

    this.groundMirror.visible = false;
    
    const originalCameraPosition = this.camera.position.clone();
    const originalCameraUp = this.camera.up.clone();
    
    this.camera.position.y *= -1;
    this.camera.up.y *= -1;
    this.camera.lookAt(0, -20, 0);
    
    this.renderer.setRenderTarget(this.renderTarget);
    this.renderer.render(this.scene, this.camera);
    this.renderer.setRenderTarget(null);
    
    this.camera.position.copy(originalCameraPosition);
    this.camera.up.copy(originalCameraUp);
    this.camera.lookAt(0, 20, 0);
    
    this.groundMirror.visible = true;
  }

  private updateFog(delta: number) {
    this.currentFogDensity = this.lerp(this.currentFogDensity, this.targetFogDensity, delta / 0.3);
    this.currentFogColor.lerp(this.targetFogColor, delta / 0.3);

    if (this.currentFogDensity > 0.001) {
      if (!this.scene.fog) {
        this.scene.fog = new THREE.FogExp2(this.currentFogColor, this.currentFogDensity);
      } else if (this.scene.fog instanceof THREE.FogExp2) {
        this.scene.fog.density = this.currentFogDensity;
        this.scene.fog.color.copy(this.currentFogColor);
      }
    } else {
      if (this.scene.fog) {
        this.scene.fog = null;
      }
    }
  }

  private updateBuildingColors(delta: number) {
    if (!this.isBuildingColorTransitioning) return;

    this.buildingColorTransitionProgress = Math.min(
      1,
      this.buildingColorTransitionProgress + delta / this.buildingColorTransitionDuration
    );

    const t = this.easeInOutCubic(this.buildingColorTransitionProgress);
    const currentHueShift = this.lerp(this.previousHueShift, this.targetHueShift, t);

    this.buildingGenerator.updateBuildingColors(this.targetHueShift, t);

    if (this.buildingColorTransitionProgress >= 1) {
      this.isBuildingColorTransitioning = false;
      this.previousHueShift = this.targetHueShift;
    }
  }

  private animate() {
    this.animationFrameId = requestAnimationFrame(this.animate.bind(this));

    const delta = Math.min(this.clock.getDelta(), 0.1);

    if (this.isTransitioning) {
      this.transitionProgress = Math.min(1, this.transitionProgress + delta / this.transitionDuration);
      const t = this.easeInOutCubic(this.transitionProgress);
      const interpolatedState = this.interpolateState(this.transitionFromState, this.transitionToState, t);
      this.updateSceneFromState(interpolatedState, delta / this.transitionDuration);

      if (this.transitionProgress >= 1) {
        this.currentState = { ...this.targetState };
        this.isTransitioning = false;
      }
    }

    this.effectsEngine.update(delta);
    this.updateFog(delta);
    this.updateBuildingColors(delta);

    if (this.sunGlow && (this.sunGlow as any).parentGroup) {
      const parentGroup = (this.sunGlow as any).parentGroup as THREE.Group;
      if (parentGroup.visible) {
        parentGroup.rotation.y += delta * 0.3;
        parentGroup.children.forEach((child, index) => {
          if (child instanceof THREE.Mesh && child !== this.sunGlow) {
            child.rotation.z += delta * (0.5 + index * 0.1);
          }
        });
      }
    }

    this.renderer.render(this.scene, this.camera);
  }

  public getState(): SceneState {
    return { ...this.currentState };
  }

  public dispose() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }

    window.removeEventListener('resize', this.onResize.bind(this));

    this.renderer.dispose();
    this.buildingGenerator.dispose();
    this.effectsEngine.dispose();

    if (this.renderTarget) {
      this.renderTarget.dispose();
    }

    if (this.container.contains(this.renderer.domElement)) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}
