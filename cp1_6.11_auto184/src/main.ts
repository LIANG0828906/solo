import * as THREE from 'three';
import { WaterClock } from './WaterClock';
import { AstralSphere } from './AstralSphere';
import { UI } from './UI';

class App {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private waterClock: WaterClock;
  private astralSphere: AstralSphere;
  private ui: UI;
  private clock: THREE.Clock;
  private isSmallScreen = false;

  constructor() {
    const container = document.getElementById('app')!;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x1A0E06);
    this.scene.fog = new THREE.FogExp2(0x1A0E06, 0.03);

    this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
    this.camera.position.set(6, 5, 8);
    this.camera.lookAt(0, 3, 0);

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 0.8;
    container.appendChild(this.renderer.domElement);

    this.addLights();
    this.addBackgroundElements();

    this.waterClock = new WaterClock();
    this.scene.add(this.waterClock.group);

    this.astralSphere = new AstralSphere();
    this.scene.add(this.astralSphere.group);

    this.ui = new UI(container);
    this.ui.bindWaterClock(this.waterClock);

    this.waterClock.setOnHourChange((hour: number) => {
      this.astralSphere.setHour(hour);
    });

    this.clock = new THREE.Clock();

    this.handleResize();
    window.addEventListener('resize', () => this.handleResize());

    this.animate();
  }

  private addLights() {
    const ambient = new THREE.AmbientLight(0x4A3A2A, 0.6);
    this.scene.add(ambient);

    const mainLight = new THREE.DirectionalLight(0xFFD4A0, 1.2);
    mainLight.position.set(5, 10, 5);
    mainLight.castShadow = true;
    mainLight.shadow.mapSize.width = 1024;
    mainLight.shadow.mapSize.height = 1024;
    mainLight.shadow.camera.near = 0.5;
    mainLight.shadow.camera.far = 30;
    this.scene.add(mainLight);

    const fillLight = new THREE.DirectionalLight(0x4488AA, 0.3);
    fillLight.position.set(-5, 3, -5);
    this.scene.add(fillLight);

    const pointLight = new THREE.PointLight(0xFFA040, 0.8, 15);
    pointLight.position.set(0, 8, 2);
    this.scene.add(pointLight);

    const rimLight = new THREE.PointLight(0x4488FF, 0.4, 12);
    rimLight.position.set(-3, 5, -3);
    this.scene.add(rimLight);
  }

  private addBackgroundElements() {
    const floorGeom = new THREE.PlaneGeometry(30, 30);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x2B1A10,
      roughness: 0.95,
      metalness: 0.0
    });
    const floor = new THREE.Mesh(floorGeom, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0;
    floor.receiveShadow = true;
    this.scene.add(floor);

    const wallGeom = new THREE.PlaneGeometry(30, 15);
    const wallMat = new THREE.MeshStandardMaterial({
      color: 0x3E2A1A,
      roughness: 0.9,
      metalness: 0.0
    });
    const backWall = new THREE.Mesh(wallGeom, wallMat);
    backWall.position.set(0, 7.5, -8);
    this.scene.add(backWall);

    const pillarGeom = new THREE.CylinderGeometry(0.3, 0.35, 8, 16);
    const pillarMat = new THREE.MeshStandardMaterial({ color: 0x4A6A6A, roughness: 0.7, metalness: 0.2 });
    const pillarPositions = [[-4, 4, -6], [4, 4, -6]];
    for (const pos of pillarPositions) {
      const pillar = new THREE.Mesh(pillarGeom, pillarMat);
      pillar.position.set(pos[0], pos[1], pos[2]);
      this.scene.add(pillar);
    }

    const beamGeom = new THREE.BoxGeometry(10, 0.3, 0.3);
    const beamMat = new THREE.MeshStandardMaterial({ color: 0x5C3A1A, roughness: 0.8, metalness: 0.1 });
    const beam = new THREE.Mesh(beamGeom, beamMat);
    beam.position.set(0, 8, -6);
    this.scene.add(beam);
  }

  private handleResize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);

    const wasSmall = this.isSmallScreen;
    this.isSmallScreen = w < 768;

    if (this.isSmallScreen) {
      this.waterClock.group.scale.setScalar(0.7);
      this.waterClock.group.position.set(-1, 0, 0);
      this.astralSphere.setResponsiveScale(2.5 / 4);
      this.astralSphere.setResponsivePosition(-3, 5, -3);
      this.camera.position.set(5, 4, 6);
    } else {
      this.waterClock.group.scale.setScalar(1);
      this.waterClock.group.position.set(0, 0, 0);
      this.astralSphere.setResponsiveScale(1);
      this.astralSphere.setResponsivePosition(0, 3, -5);
      this.camera.position.set(6, 5, 8);
    }

    this.camera.lookAt(0, 3, 0);

    if (wasSmall !== this.isSmallScreen) {
      this.ui.setResponsive(this.isSmallScreen);
    }
  }

  private animate() {
    requestAnimationFrame(() => this.animate());

    const delta = Math.min(this.clock.getDelta(), 0.05);

    this.waterClock.update(delta);
    this.astralSphere.update(delta);

    const hour = this.waterClock.getCurrentHour();
    const buoyPos = this.waterClock.getBuoyNormalizedPosition();
    const waterLevel = this.waterClock.getWaterLevel();
    this.ui.update(hour, buoyPos, waterLevel);

    this.renderer.render(this.scene, this.camera);
  }
}

new App();
