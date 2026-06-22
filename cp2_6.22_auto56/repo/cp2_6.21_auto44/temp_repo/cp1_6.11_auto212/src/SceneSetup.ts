import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export class SceneSetup {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  controls: OrbitControls;
  private backgroundStars: THREE.Points;

  constructor(container: HTMLElement) {
    this.scene = new THREE.Scene();

    this.camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.camera.position.set(0, 5, 10);
    this.camera.lookAt(0, 0, 0);

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setClearColor(0x0A0E27, 1);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;
    container.appendChild(this.renderer.domElement);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.1;
    this.controls.minDistance = 5;
    this.controls.maxDistance = 30;
    this.controls.enablePan = false;
    this.controls.target.set(0, 0, 0);

    this.setupLights();
    this.backgroundStars = this.createStarfield();
    this.scene.add(this.backgroundStars);
    this.createBackgroundGradient();

    window.addEventListener('resize', this.onResize.bind(this));
  }

  private setupLights(): void {
    const ambientLight = new THREE.AmbientLight(0x222244, 0.3);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
    directionalLight.position.set(5, 10, 7);
    this.scene.add(directionalLight);

    const pointLight = new THREE.PointLight(0x4466aa, 0.2, 50);
    pointLight.position.set(-5, -3, -5);
    this.scene.add(pointLight);
  }

  private createStarfield(): THREE.Points {
    const starCount = 200;
    const positions = new Float32Array(starCount * 3);
    const sizes = new Float32Array(starCount);
    const opacities = new Float32Array(starCount);

    for (let i = 0; i < starCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 80 + Math.random() * 120;

      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);

      sizes[i] = 0.5 + Math.random() * 1.0;
      opacities[i] = 0.3 + Math.random() * 0.5;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    geometry.setAttribute('aOpacity', new THREE.BufferAttribute(opacities, 1));

    const material = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 1.0,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    return new THREE.Points(geometry, material);
  }

  private createBackgroundGradient(): void {
    const canvas = document.createElement('canvas');
    canvas.width = 2;
    canvas.height = 512;

    const ctx = canvas.getContext('2d')!;
    const gradient = ctx.createLinearGradient(0, 0, 0, 512);
    gradient.addColorStop(0, '#1F1344');
    gradient.addColorStop(0.5, '#0E0B2A');
    gradient.addColorStop(1, '#0A0E27');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 2, 512);

    const texture = new THREE.CanvasTexture(canvas);
    texture.mapping = THREE.EquirectangularReflectionMapping;

    const bgGeometry = new THREE.SphereGeometry(200, 32, 32);
    const bgMaterial = new THREE.MeshBasicMaterial({
      map: texture,
      side: THREE.BackSide,
      transparent: false,
      fog: false
    });

    const bgMesh = new THREE.Mesh(bgGeometry, bgMaterial);
    this.scene.add(bgMesh);
  }

  resetCamera(animated: boolean = true): void {
    if (!animated) {
      this.camera.position.set(0, 5, 10);
      this.controls.target.set(0, 0, 0);
      this.controls.update();
      return;
    }

    const startPos = this.camera.position.clone();
    const endPos = new THREE.Vector3(0, 5, 10);
    const startTarget = this.controls.target.clone();
    const endTarget = new THREE.Vector3(0, 0, 0);
    const duration = 500;
    const startTime = performance.now();

    const animateCamera = (now: number) => {
      const elapsed = now - startTime;
      let t = Math.min(elapsed / duration, 1);
      t = 1 - Math.pow(1 - t, 3);

      this.camera.position.lerpVectors(startPos, endPos, t);
      this.controls.target.lerpVectors(startTarget, endTarget, t);
      this.controls.update();

      if (t < 1) {
        requestAnimationFrame(animateCamera);
      }
    };

    requestAnimationFrame(animateCamera);
  }

  private onResize(): void {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  render(): void {
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }

  dispose(): void {
    this.controls.dispose();
    this.renderer.dispose();
    window.removeEventListener('resize', this.onResize.bind(this));
  }
}
