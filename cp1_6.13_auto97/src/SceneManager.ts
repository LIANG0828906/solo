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
  
  private ground: THREE.Mesh;
  
  private isDragging: boolean = false;
  private previousMousePosition: { x: number; y: number } = { x: 0, y: 0 };
  private cameraAngle: number = Math.PI / 4;
  private cameraHeight: number = 60;
  private cameraDistance: number = 100;
  
  private targetState: SceneState;
  private currentState: SceneState;
  private transitionProgress: number = 1;
  private transitionDuration: number = 0.5;
  
  private buildings: THREE.Group | null = null;
  private buildingData: BuildingData[] = [];
  
  private animationFrameId: number | null = null;
  private clock: THREE.Clock;
  
  private sunGlow: THREE.Mesh | null = null;
  
  constructor(container: HTMLElement) {
    this.container = container;
    this.clock = new THREE.Clock();
    
    this.currentState = {
      time: 12,
      season: 'summer',
      weather: 'sunny'
    };
    this.targetState = { ...this.currentState };
    
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
    this.directionalLight.shadow.camera.left = -100;
    this.directionalLight.shadow.camera.right = 100;
    this.directionalLight.shadow.camera.top = 100;
    this.directionalLight.shadow.camera.bottom = -100;
    this.directionalLight.shadow.bias = -0.0001;
    this.scene.add(this.directionalLight);
    
    this.hemisphereLight = new THREE.HemisphereLight(0x87ceeb, 0x1a1a2e, 0.4);
    this.scene.add(this.hemisphereLight);
    
    const groundGeometry = new THREE.PlaneGeometry(300, 300);
    const groundMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a1a2e,
      metalness: 0.3,
      roughness: 0.8,
      envMapIntensity: 0.5
    });
    this.ground = new THREE.Mesh(groundGeometry, groundMaterial);
    this.ground.rotation.x = -Math.PI / 2;
    this.ground.receiveShadow = true;
    this.scene.add(this.ground);
    
    this.buildingGenerator = new BuildingGenerator(this.scene);
    this.effectsEngine = new EffectsEngine(this.scene);
    
    this.setupEventListeners();
    this.createSunGlow();
    
    this.animate();
  }
  
  private createSunGlow() {
    const glowGeometry = new THREE.SphereGeometry(8, 32, 32);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: 0xffdd88,
      transparent: true,
      opacity: 0.8
    });
    this.sunGlow = new THREE.Mesh(glowGeometry, glowMaterial);
    this.scene.add(this.sunGlow);
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
    this.targetState = { ...this.targetState, ...newState };
    
    if (animate) {
      this.transitionProgress = 0;
    } else {
      this.currentState = { ...this.targetState };
      this.transitionProgress = 1;
      this.updateSceneFromState(this.currentState);
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
  
  private updateSceneFromState(state: SceneState) {
    this.updateLighting(state.time);
    this.updateAtmosphere(state.time, state.weather);
    this.effectsEngine.updateWeather(state.weather, state.season);
    this.updateBuildingEmissive(state.time);
    this.updateSunGlow(state.time, state.weather);
  }
  
  private updateLighting(time: number) {
    const sunAngle = ((time - 6) / 12) * Math.PI;
    const sunHeight = Math.sin(sunAngle);
    const sunX = Math.cos(sunAngle) * 80;
    const sunY = Math.max(-20, sunHeight * 80);
    const sunZ = -30;
    
    this.directionalLight.position.set(sunX, sunY, sunZ);
    
    let lightColor: THREE.Color;
    let intensity: number;
    let shadowBlur: number;
    
    if (time >= 5 && time < 7) {
      const t = (time - 5) / 2;
      lightColor = new THREE.Color().lerpColors(
        new THREE.Color(0x1a1a3e),
        new THREE.Color(0xffcc88),
        t
      );
      intensity = 0.2 + t * 0.3;
      shadowBlur = 5 - t * 3;
    } else if (time >= 7 && time < 11) {
      const t = (time - 7) / 4;
      lightColor = new THREE.Color().lerpColors(
        new THREE.Color(0xffcc88),
        new THREE.Color(0xffffff),
        t
      );
      intensity = 0.5 + t * 0.5;
      shadowBlur = 2 - t * 1.5;
    } else if (time >= 11 && time < 13) {
      lightColor = new THREE.Color(0xffffff);
      intensity = 1.0;
      shadowBlur = 0.5;
    } else if (time >= 13 && time < 17) {
      const t = (time - 13) / 4;
      lightColor = new THREE.Color().lerpColors(
        new THREE.Color(0xffffff),
        new THREE.Color(0xffddaa),
        t
      );
      intensity = 1.0 - t * 0.3;
      shadowBlur = 0.5 + t * 1;
    } else if (time >= 17 && time < 19) {
      const t = (time - 17) / 2;
      lightColor = new THREE.Color().lerpColors(
        new THREE.Color(0xffddaa),
        new THREE.Color(0xff6633),
        t
      );
      intensity = 0.7 - t * 0.3;
      shadowBlur = 1.5 + t * 2;
    } else if (time >= 19 && time < 22) {
      const t = (time - 19) / 3;
      lightColor = new THREE.Color().lerpColors(
        new THREE.Color(0xff6633),
        new THREE.Color(0x1a1a3e),
        t
      );
      intensity = 0.4 - t * 0.3;
      shadowBlur = 3.5 + t * 1.5;
    } else {
      lightColor = new THREE.Color(0x4466aa);
      intensity = 0.08;
      shadowBlur = 5;
    }
    
    this.directionalLight.color = lightColor;
    this.directionalLight.intensity = intensity;
    
    this.directionalLight.shadow.radius = shadowBlur;
    
    const ambientIntensity = intensity * 0.3 + 0.05;
    this.ambientLight.intensity = ambientIntensity;
    
    const skyColor = this.getSkyColor(time);
    this.hemisphereLight.color = skyColor;
    this.hemisphereLight.groundColor = new THREE.Color(0x1a1a2e);
    this.hemisphereLight.intensity = ambientIntensity * 1.5;
  }
  
  private getSkyColor(time: number): THREE.Color {
    if (time >= 5 && time < 7) {
      const t = (time - 5) / 2;
      return new THREE.Color().lerpColors(
        new THREE.Color(0x0a0a1a),
        new THREE.Color(0xffaa77),
        t
      );
    } else if (time >= 7 && time < 11) {
      const t = (time - 7) / 4;
      return new THREE.Color().lerpColors(
        new THREE.Color(0xffaa77),
        new THREE.Color(0x87ceeb),
        t
      );
    } else if (time >= 11 && time < 17) {
      return new THREE.Color(0x87ceeb);
    } else if (time >= 17 && time < 19) {
      const t = (time - 17) / 2;
      return new THREE.Color().lerpColors(
        new THREE.Color(0x87ceeb),
        new THREE.Color(0xff7744),
        t
      );
    } else if (time >= 19 && time < 22) {
      const t = (time - 19) / 3;
      return new THREE.Color().lerpColors(
        new THREE.Color(0xff7744),
        new THREE.Color(0x0a0a2a),
        t
      );
    } else {
      return new THREE.Color(0x0a0a2a);
    }
  }
  
  private updateAtmosphere(time: number, weather: string) {
    const skyColor = this.getSkyColor(time);
    
    if (weather === 'foggy') {
      this.scene.background = new THREE.Color(0x888899);
      this.scene.fog = new THREE.FogExp2(0x888899, 0.03);
    } else if (weather === 'rainy') {
      this.scene.background = skyColor.clone().multiplyScalar(0.5);
      this.scene.fog = new THREE.FogExp2(0x334455, 0.01);
    } else if (weather === 'snowy') {
      this.scene.background = skyColor.clone().multiplyScalar(0.7);
      this.scene.fog = new THREE.FogExp2(0xaabbcc, 0.008);
    } else {
      this.scene.background = skyColor;
      this.scene.fog = null;
    }
    
    const groundColor = weather === 'foggy' 
      ? new THREE.Color(0x555566)
      : weather === 'rainy'
        ? new THREE.Color(0x1a1a2e)
        : new THREE.Color(0x1a1a2e);
    
    (this.ground.material as THREE.MeshStandardMaterial).color = groundColor;
  }
  
  private updateBuildingEmissive(time: number) {
    const isNight = time < 6 || time > 19;
    const emissiveIntensity = isNight ? 0.5 : 0.05;
    
    if (this.buildings) {
      this.buildings.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          const material = child.material as THREE.MeshStandardMaterial;
          if (material.emissive) {
            material.emissiveIntensity = emissiveIntensity;
          }
        }
      });
    }
  }
  
  private updateSunGlow(time: number, weather: string) {
    if (!this.sunGlow) return;
    
    if (weather !== 'sunny' || time < 6 || time > 19) {
      this.sunGlow.visible = false;
      return;
    }
    
    this.sunGlow.visible = true;
    
    const sunAngle = ((time - 6) / 12) * Math.PI;
    const sunHeight = Math.sin(sunAngle);
    const sunX = Math.cos(sunAngle) * 80;
    const sunY = sunHeight * 80;
    const sunZ = -50;
    
    this.sunGlow.position.set(sunX, sunY, sunZ);
    
    const glowMaterial = this.sunGlow.material as THREE.MeshBasicMaterial;
    if (time >= 6 && time < 8) {
      glowMaterial.color = new THREE.Color(0xffcc88);
      glowMaterial.opacity = 0.6;
    } else if (time >= 8 && time < 17) {
      glowMaterial.color = new THREE.Color(0xffffcc);
      glowMaterial.opacity = 0.8;
    } else {
      glowMaterial.color = new THREE.Color(0xff8844);
      glowMaterial.opacity = 0.5;
    }
  }
  
  private animate() {
    this.animationFrameId = requestAnimationFrame(this.animate.bind(this));
    
    const delta = this.clock.getDelta();
    
    if (this.transitionProgress < 1) {
      this.transitionProgress = Math.min(1, this.transitionProgress + delta / this.transitionDuration);
      const t = this.easeInOutCubic(this.transitionProgress);
      const interpolatedState = this.interpolateState(this.currentState, this.targetState, t);
      this.updateSceneFromState(interpolatedState);
      
      if (this.transitionProgress >= 1) {
        this.currentState = { ...this.targetState };
      }
    }
    
    this.effectsEngine.update(delta);
    
    if (this.sunGlow && this.sunGlow.visible) {
      this.sunGlow.rotation.y += delta * 0.1;
    }
    
    this.renderer.render(this.scene, this.camera);
  }
  
  private easeInOutCubic(t: number): number {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
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
    
    if (this.container.contains(this.renderer.domElement)) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}
