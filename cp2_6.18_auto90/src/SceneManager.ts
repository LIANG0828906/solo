import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { PlanetFactory, PlanetData } from './PlanetFactory';
import { ControlPanel } from './ControlPanel';

const PLANET_DATA: PlanetData[] = [
  { name: '水星', radius: 1.5, orbitRadius: 35, color: '#8C7853', orbitalPeriod: 88, rotationPeriod: 1407.6, mass: '3.285×10²³ kg', moons: 0 },
  { name: '金星', radius: 3.7, orbitRadius: 50, color: '#FFC649', orbitalPeriod: 225, rotationPeriod: 5832.5, mass: '4.867×10²⁴ kg', moons: 0 },
  { name: '地球', radius: 4, orbitRadius: 70, color: '#2E86AB', orbitalPeriod: 365, rotationPeriod: 24, mass: '5.972×10²⁴ kg', moons: 1, hasClouds: true },
  { name: '火星', radius: 2.1, orbitRadius: 90, color: '#C0392B', orbitalPeriod: 687, rotationPeriod: 24.6, mass: '6.39×10²³ kg', moons: 2 },
  { name: '木星', radius: 10, orbitRadius: 130, color: '#D4AC0D', orbitalPeriod: 4333, rotationPeriod: 9.9, mass: '1.898×10²⁷ kg', moons: 95 },
  { name: '土星', radius: 8.5, orbitRadius: 175, color: '#F4D03F', orbitalPeriod: 10759, rotationPeriod: 10.7, mass: '5.683×10²⁶ kg', moons: 146, hasRing: true },
  { name: '天王星', radius: 5, orbitRadius: 220, color: '#73C6B6', orbitalPeriod: 30687, rotationPeriod: 17.2, mass: '8.681×10²⁵ kg', moons: 27 },
  { name: '海王星', radius: 4.8, orbitRadius: 260, color: '#3498DB', orbitalPeriod: 60190, rotationPeriod: 16.1, mass: '1.024×10²⁶ kg', moons: 16 }
];

export class SceneManager {
  private container: HTMLElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private controls: OrbitControls;
  private planetFactory: PlanetFactory;
  private controlPanel: ControlPanel;
  private sun: THREE.Group;
  private planets: THREE.Group[] = [];
  private timeScale: number = 1;
  private autoRotate: boolean = false;
  private clock: THREE.Clock;
  private raycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;
  private keys: { [key: string]: boolean } = {};
  private isAnimating: boolean = false;
  private animationId: number = 0;
  private focusTarget: THREE.Group | null = null;
  private focusProgress: number = 0;
  private focusStartPos: THREE.Vector3 = new THREE.Vector3();
  private focusEndPos: THREE.Vector3 = new THREE.Vector3();
  private focusStartTarget: THREE.Vector3 = new THREE.Vector3();
  private focusEndTarget: THREE.Vector3 = new THREE.Vector3();
  private onFocusComplete: ((data: PlanetData) => void) | null = null;
  private stars: THREE.Points;

  constructor(container: HTMLElement) {
    this.container = container;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.planetFactory = new PlanetFactory();
    this.clock = new THREE.Clock();
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.sun = new THREE.Group();
    this.stars = this.createStars();
    this.controlPanel = new ControlPanel(container, PLANET_DATA.map(p => p.name), {
      onPlanetSelect: (name) => this.focusOnPlanetByName(name),
      onTimeScaleChange: (scale) => this.setTimeScale(scale),
      onAutoRotateChange: (enabled) => this.setAutoRotate(enabled)
    });
    this.init();
  }

  private init(): void {
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setClearColor(0x000000, 1);
    this.container.appendChild(this.renderer.domElement);
    this.camera.position.set(0, 80, 200);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.minDistance = 5;
    this.controls.maxDistance = 800;
    this.scene.add(this.stars);
    this.createSolarSystem();
    this.setupLighting();
    this.setupEventListeners();
  }

  private createStars(): THREE.Points {
    const count = 5000;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const radius = 500 + Math.random() * 500;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = radius * Math.cos(phi);
      const brightness = 0.5 + Math.random() * 0.5;
      colors[i * 3] = brightness;
      colors[i * 3 + 1] = brightness;
      colors[i * 3 + 2] = brightness * (0.9 + Math.random() * 0.2);
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    const material = new THREE.PointsMaterial({
      size: 0.5,
      vertexColors: true,
      transparent: true,
      opacity: 0.9
    });
    return new THREE.Points(geometry, material);
  }

  private createSolarSystem(): void {
    this.sun = this.planetFactory.createSun(20, '#FFAA00');
    this.scene.add(this.sun);
    PLANET_DATA.forEach(data => {
      const planet = this.planetFactory.createPlanet(data);
      this.planets.push(planet);
      this.scene.add(planet);
      if (planet.userData.orbit) {
        this.scene.add(planet.userData.orbit);
      }
    });
  }

  private setupLighting(): void {
    const sunLight = new THREE.PointLight(0xFFAA00, 2, 1000);
    sunLight.position.set(0, 0, 0);
    this.scene.add(sunLight);
    const ambientLight = new THREE.AmbientLight(0x222244, 0.3);
    this.scene.add(ambientLight);
  }

  private setupEventListeners(): void {
    window.addEventListener('resize', () => this.resize());
    window.addEventListener('keydown', (e) => {
      this.keys[e.key.toLowerCase()] = true;
    });
    window.addEventListener('keyup', (e) => {
      this.keys[e.key.toLowerCase()] = false;
    });
    this.renderer.domElement.addEventListener('click', (e) => this.handleClick(e));
  }

  private handleClick(event: MouseEvent): void {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const allMeshes: THREE.Mesh[] = [];
    this.planets.forEach(planet => {
      const mesh = planet.getObjectByName('planet') as THREE.Mesh;
      if (mesh) allMeshes.push(mesh);
    });
    const sunMesh = this.sun.getObjectByName('sun') as THREE.Mesh;
    if (sunMesh) allMeshes.push(sunMesh);
    const intersects = this.raycaster.intersectObjects(allMeshes, false);
    if (intersects.length > 0) {
      const clickedMesh = intersects[0].object;
      const planetGroup = clickedMesh.parent as THREE.Group;
      if (planetGroup && planetGroup.userData.type === 'planet') {
        this.focusOnPlanet(planetGroup, (data) => {
          this.controlPanel.showInfoCard(data);
        });
      } else if (planetGroup && planetGroup.userData.type === 'sun') {
        this.focusOnPlanet(planetGroup, () => {});
        this.controlPanel.hideInfoCard();
      }
    } else {
      this.cancelFocus();
      this.controlPanel.hideInfoCard();
    }
  }

  private focusOnPlanetByName(name: string): void {
    const planet = this.planets.find(p => p.name === name);
    if (planet) {
      this.focusOnPlanet(planet, (data) => {
        this.controlPanel.showInfoCard(data);
      });
    }
  }

  private focusOnPlanet(planetGroup: THREE.Group, onComplete: (data: PlanetData) => void): void {
    this.focusTarget = planetGroup;
    this.focusProgress = 0;
    this.focusStartPos.copy(this.camera.position);
    const planetPos = new THREE.Vector3();
    planetGroup.getWorldPosition(planetPos);
    const direction = new THREE.Vector3().subVectors(planetPos, this.camera.position).normalize();
    const distance = (planetGroup.userData.data?.radius || 5) + 5;
    this.focusEndPos.copy(planetPos).add(direction.multiplyScalar(-distance));
    this.focusStartTarget.copy(this.controls.target);
    this.focusEndTarget.copy(planetPos);
    this.onFocusComplete = onComplete;
  }

  private cancelFocus(): void {
    this.focusTarget = null;
    this.focusProgress = 0;
    this.onFocusComplete = null;
  }

  private updateFocus(delta: number): void {
    if (!this.focusTarget) return;
    this.focusProgress += delta * 2;
    const t = Math.min(this.focusProgress, 1);
    const easeT = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    this.camera.position.lerpVectors(this.focusStartPos, this.focusEndPos, easeT);
    this.controls.target.lerpVectors(this.focusStartTarget, this.focusEndTarget, easeT);
    if (t >= 1) {
      const completedTarget = this.focusTarget;
      this.focusTarget = null;
      this.focusProgress = 0;
      if (this.onFocusComplete) {
        const data = completedTarget?.userData.data;
        if (data) {
          this.onFocusComplete(data);
        }
        this.onFocusComplete = null;
      }
    }
  }

  private updateMovement(delta: number): void {
    if (this.focusTarget) return;
    const speed = 50 * delta;
    const direction = new THREE.Vector3();
    this.camera.getWorldDirection(direction);
    direction.y = 0;
    direction.normalize();
    const right = new THREE.Vector3();
    right.crossVectors(direction, new THREE.Vector3(0, 1, 0)).normalize();
    if (this.keys['w']) {
      this.camera.position.addScaledVector(direction, speed);
      this.controls.target.addScaledVector(direction, speed);
    }
    if (this.keys['s']) {
      this.camera.position.addScaledVector(direction, -speed);
      this.controls.target.addScaledVector(direction, -speed);
    }
    if (this.keys['a']) {
      this.camera.position.addScaledVector(right, -speed);
      this.controls.target.addScaledVector(right, -speed);
    }
    if (this.keys['d']) {
      this.camera.position.addScaledVector(right, speed);
      this.controls.target.addScaledVector(right, speed);
    }
  }

  private updatePlanets(delta: number): void {
    const scaledDelta = delta * this.timeScale * 100000;
    this.planets.forEach(planet => {
      const userData = planet.userData;
      userData.angle += userData.orbitalSpeed * scaledDelta;
      const x = Math.cos(userData.angle) * userData.orbitRadius;
      const z = Math.sin(userData.angle) * userData.orbitRadius;
      planet.position.set(x, 0, z);
      const planetMesh = planet.getObjectByName('planet');
      if (planetMesh) {
        planetMesh.rotation.y += userData.rotationSpeed * scaledDelta;
      }
      if (userData.clouds) {
        userData.clouds.rotation.y += userData.rotationSpeed * scaledDelta * 1.1;
      }
    });
    const sunMesh = this.sun.getObjectByName('sun');
    if (sunMesh) {
      sunMesh.rotation.y += this.sun.userData.rotationSpeed * scaledDelta;
    }
    const particles = this.sun.children.find(c => c.type === 'Points');
    if (particles) {
      particles.rotation.y += delta * 0.05;
    }
  }

  private updateAutoRotate(delta: number): void {
    if (this.autoRotate && !this.focusTarget) {
      const angle = delta * 0.1;
      const distance = this.camera.position.distanceTo(this.controls.target);
      const currentAngle = Math.atan2(this.camera.position.x, this.camera.position.z);
      const newAngle = currentAngle + angle;
      this.camera.position.x = Math.sin(newAngle) * distance;
      this.camera.position.z = Math.cos(newAngle) * distance;
      this.camera.lookAt(this.controls.target);
    }
  }

  public update(): void {
    const delta = Math.min(this.clock.getDelta(), 0.1);
    this.updateFocus(delta);
    this.updateMovement(delta);
    this.updatePlanets(delta);
    this.updateAutoRotate(delta);
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }

  public start(): void {
    if (this.isAnimating) return;
    this.isAnimating = true;
    const animate = () => {
      this.animationId = requestAnimationFrame(animate);
      this.update();
    };
    animate();
  }

  public stop(): void {
    this.isAnimating = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
  }

  public setTimeScale(scale: number): void {
    this.timeScale = scale;
  }

  public setAutoRotate(enabled: boolean): void {
    this.autoRotate = enabled;
  }

  public resize(): void {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  public dispose(): void {
    this.stop();
    this.controlPanel.dispose();
    this.planetFactory.dispose();
    this.renderer.dispose();
    this.controls.dispose();
    this.scene.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.geometry.dispose();
        if (Array.isArray(object.material)) {
          object.material.forEach(m => m.dispose());
        } else {
          object.material.dispose();
        }
      }
    });
    this.container.removeChild(this.renderer.domElement);
  }
}
