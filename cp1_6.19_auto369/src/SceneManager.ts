import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { createSun, createEarth, createMoon } from './CelestialBodies';
import { OrbitController } from './OrbitController';
import { useCelestialStore } from './store';

export class SceneManager {
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private controls!: OrbitControls;
  private sun!: THREE.Mesh;
  private earth!: THREE.Group;
  private moon!: THREE.Mesh;
  private orbitController!: OrbitController;
  private sunLight!: THREE.PointLight;
  private ambientLight!: THREE.AmbientLight;
  private stars!: THREE.Points;
  private animationId: number = 0;
  private clock: THREE.Clock;
  private container: HTMLElement | null = null;
  private lastEarthScale: number = 1;

  constructor() {
    this.clock = new THREE.Clock();
  }

  init(container: HTMLElement): void {
    this.container = container;
    
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x000011);
    
    this.camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.camera.position.set(15, 10, 20);
    
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
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
    this.controls.maxDistance = 100;
    
    this.setupLighting();
    this.createCelestialBodies();
    this.createStarfield();
    this.createOrbitLines();
    
    this.orbitController = new OrbitController();
    
    window.addEventListener('resize', this.onResize.bind(this));
    
    this.animate();
  }

  private setupLighting(): void {
    this.ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.2);
    this.scene.add(this.ambientLight);
    
    this.sunLight = new THREE.PointLight(0xFFD700, 1.5, 100);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 1024;
    this.sunLight.shadow.mapSize.height = 1024;
    this.sunLight.shadow.camera.near = 0.5;
    this.sunLight.shadow.camera.far = 100;
    this.sunLight.shadow.bias = -0.0001;
    this.scene.add(this.sunLight);
  }

  private createCelestialBodies(): void {
    this.sun = createSun();
    this.scene.add(this.sun);
    
    const { earth, clouds } = createEarth();
    this.earth = earth;
    this.scene.add(this.earth);
    
    this.moon = createMoon();
    this.scene.add(this.moon);
    
    this.sunLight.position.copy(this.sun.position);
  }

  private createStarfield(): void {
    const starCount = 300;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);
    const sizes = new Float32Array(starCount);
    
    for (let i = 0; i < starCount; i++) {
      const i3 = i * 3;
      const radius = 80 + Math.random() * 40;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      
      positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i3 + 2] = radius * Math.cos(phi);
      
      const brightness = 0.4 + Math.random() * 0.6;
      colors[i3] = brightness;
      colors[i3 + 1] = brightness;
      colors[i3 + 2] = brightness;
      
      sizes[i] = 1 + Math.random() * 2;
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    
    const material = new THREE.PointsMaterial({
      size: 1.5,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      sizeAttenuation: true,
    });
    
    this.stars = new THREE.Points(geometry, material);
    this.scene.add(this.stars);
  }

  private createOrbitLines(): void {
    const earthOrbitPoints: THREE.Vector3[] = [];
    const earthOrbitRadius = 10;
    for (let i = 0; i <= 128; i++) {
      const angle = (i / 128) * Math.PI * 2;
      earthOrbitPoints.push(new THREE.Vector3(
        earthOrbitRadius * Math.cos(angle),
        0,
        earthOrbitRadius * Math.sin(angle)
      ));
    }
    const earthOrbitGeometry = new THREE.BufferGeometry().setFromPoints(earthOrbitPoints);
    const earthOrbitMaterial = new THREE.LineBasicMaterial({ 
      color: 0x4FC3F7, 
      transparent: true, 
      opacity: 0.3 
    });
    const earthOrbitLine = new THREE.Line(earthOrbitGeometry, earthOrbitMaterial);
    this.scene.add(earthOrbitLine);
  }

  private updateEarthScale(): void {
    const state = useCelestialStore.getState();
    const scale = state.earthScale;
    
    if (Math.abs(scale - this.lastEarthScale) > 0.001) {
      this.earth.scale.setScalar(scale);
      this.lastEarthScale = scale;
      
      this.sunLight.shadow.camera.updateProjectionMatrix();
    }
  }

  private onResize(): void {
    if (!this.container) return;
    
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  private animate(): void {
    this.animationId = requestAnimationFrame(this.animate.bind(this));
    
    const delta = Math.min(this.clock.getDelta(), 0.1);
    
    this.orbitController.update(delta, this.earth, this.moon, this.sun);
    
    this.updateEarthScale();
    
    this.controls.update();
    
    this.stars.rotation.y += delta * 0.01;
    
    this.renderer.render(this.scene, this.camera);
  }

  dispose(): void {
    cancelAnimationFrame(this.animationId);
    window.removeEventListener('resize', this.onResize.bind(this));
    
    this.renderer.dispose();
    this.controls.dispose();
    
    if (this.container && this.renderer.domElement.parentNode === this.container) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}
