import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Lantern } from './lantern';
import { WindField } from './wind';
import { setupUI } from './ui';

class App {
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private controls: OrbitControls;
  private windField: WindField;
  private lanterns: Lantern[] = [];
  private clock: THREE.Clock;
  private ui: ReturnType<typeof setupUI>;
  private collisionChecked: Set<string> = new Set();

  constructor() {
    const container = document.getElementById('canvas-container')!;

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;
    container.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x0B0C10, 0.008);

    this.camera = new THREE.PerspectiveCamera(
      55,
      container.clientWidth / container.clientHeight,
      0.1,
      500
    );
    this.camera.position.set(0, 12, 25);
    this.camera.lookAt(0, 8, 0);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.target.set(0, 8, 0);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.maxPolarAngle = Math.PI * 0.85;
    this.controls.minDistance = 5;
    this.controls.maxDistance = 80;
    this.controls.update();

    this.windField = new WindField();
    this.clock = new THREE.Clock();

    this.setupLighting();
    this.createGround();
    this.createStars();
    this.preCreateLanterns(15);

    this.ui = setupUI(this.windField);
    this.ui.onLaunch(() => this.launchLanterns());
    this.ui.onReset(() => this.resetAllLanterns());

    window.addEventListener('resize', () => this.onResize(container));
    this.animate();
  }

  private setupLighting(): void {
    const ambient = new THREE.AmbientLight(0x1a1a2e, 0.6);
    this.scene.add(ambient);

    const moonLight = new THREE.DirectionalLight(0x4466aa, 0.3);
    moonLight.position.set(-30, 40, -20);
    moonLight.castShadow = true;
    moonLight.shadow.mapSize.width = 4096;
    moonLight.shadow.mapSize.height = 4096;
    moonLight.shadow.camera.near = 0.5;
    moonLight.shadow.camera.far = 100;
    moonLight.shadow.camera.left = -30;
    moonLight.shadow.camera.right = 30;
    moonLight.shadow.camera.top = 30;
    moonLight.shadow.camera.bottom = -5;
    this.scene.add(moonLight);

    const hemisphere = new THREE.HemisphereLight(0x0B0C10, 0x2E1A47, 0.3);
    this.scene.add(hemisphere);
  }

  private createGround(): void {
    const groundGeom = new THREE.CircleGeometry(5, 64);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x7CCD7C,
      transparent: true,
      opacity: 0.6,
      roughness: 0.9,
      metalness: 0.0,
    });
    const ground = new THREE.Mesh(groundGeom, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = 0;
    ground.receiveShadow = true;
    this.scene.add(ground);

    const dirtCount = 40;
    const dirtGeom = new THREE.CircleGeometry(0.08, 6);
    const dirtMat = new THREE.MeshBasicMaterial({
      color: 0x3a2a1a,
      transparent: true,
      opacity: 0.5,
    });
    for (let i = 0; i < dirtCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * 4.5;
      const dirt = new THREE.Mesh(dirtGeom, dirtMat);
      dirt.position.set(
        Math.cos(angle) * radius,
        0.01,
        Math.sin(angle) * radius
      );
      dirt.rotation.x = -Math.PI / 2;
      dirt.rotation.z = Math.random() * Math.PI;
      this.scene.add(dirt);
    }
  }

  private createStars(): void {
    const starCount = 800;
    const positions = new Float32Array(starCount * 3);
    const sizes = new Float32Array(starCount);

    for (let i = 0; i < starCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI * 0.45;
      const r = 150 + Math.random() * 100;

      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.cos(phi) + 20;
      positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
      sizes[i] = Math.random() * 1.5 + 0.5;
    }

    const starGeom = new THREE.BufferGeometry();
    starGeom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    starGeom.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const starMat = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.5,
      transparent: true,
      opacity: 0.8,
      sizeAttenuation: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const stars = new THREE.Points(starGeom, starMat);
    this.scene.add(stars);
  }

  private preCreateLanterns(count: number): void {
    for (let i = 0; i < count; i++) {
      const lantern = new Lantern(this.scene, this.windField, i);
      this.lanterns.push(lantern);
    }
  }

  private launchLanterns(): void {
    const count = this.ui.getLanternCount();
    const buoyancy = this.ui.getBuoyancy();

    for (const lantern of this.lanterns) {
      if (lantern.isLaunched()) return;
    }

    let launched = 0;
    for (let i = 0; i < this.lanterns.length && launched < count; i++) {
      const lantern = this.lanterns[i];
      if (!lantern.isLaunched()) {
        const offset = (launched - (count - 1) / 2) * 0.8;
        setTimeout(() => {
          lantern.setPosition(offset, 0, (Math.random() - 0.5) * 0.5);
          lantern.setFloatForce(buoyancy);
          lantern.setWindInfluence(1.0);
          lantern.launch();
        }, launched * 500);
        launched++;
      }
    }
    this.collisionChecked.clear();
  }

  private resetAllLanterns(): void {
    const now = performance.now() / 1000;
    for (const lantern of this.lanterns) {
      if (lantern.isLaunched() && !lantern.isResetting()) {
        lantern.reset(now);
      }
    }
  }

  private checkCollisions(): void {
    const activeLanterns = this.lanterns.filter(
      (l) => l.isAlive() && !l.isResetting()
    );

    for (let i = 0; i < activeLanterns.length; i++) {
      for (let j = i + 1; j < activeLanterns.length; j++) {
        const a = activeLanterns[i];
        const b = activeLanterns[j];
        const posA = a.getPosition();
        const posB = b.getPosition();
        const dist = posA.distanceTo(posB);
        const key = `${this.lanterns.indexOf(a)}-${this.lanterns.indexOf(b)}`;

        if (dist < 1.0 && !this.collisionChecked.has(key)) {
          this.collisionChecked.add(key);
          const now = performance.now() / 1000;
          a.startShaking(now);
          b.startShaking(now);

          if (Math.random() < 0.3) {
            const victim = Math.random() < 0.5 ? a : b;
            victim.extinguish();
          }
        } else if (dist >= 2.0) {
          this.collisionChecked.delete(key);
        }
      }
    }
  }

  private animate(): void {
    requestAnimationFrame(() => this.animate());

    const dt = Math.min(this.clock.getDelta(), 0.05);
    const now = performance.now() / 1000;

    this.windField.update(dt);

    for (const lantern of this.lanterns) {
      lantern.update(dt, now);
    }

    this.checkCollisions();
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }

  private onResize(container: HTMLElement): void {
    const w = container.clientWidth;
    const h = container.clientHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }
}

new App();
