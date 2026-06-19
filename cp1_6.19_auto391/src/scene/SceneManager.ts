import * as THREE from 'three';
import { RootNode } from '../engine/rootGrowthEngine';

const COLOR_TIP = new THREE.Color(0xfff176);
const COLOR_ROOT = new THREE.Color(0x5d4037);
const COLOR_SOIL_TOP = new THREE.Color(0x3e2723);
const COLOR_SOIL_BOTTOM = new THREE.Color(0x1b0f0c);
const COLOR_WATER = new THREE.Color(0x1565c0);

const MAX_PARTICLES = 800;
const PARTICLE_SIZE = 0.12;

export class SceneManager {
  private container: HTMLElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private particles: THREE.Points;
  private particleGeometry: THREE.BufferGeometry;
  private particleMaterial: THREE.PointsMaterial;
  private positions: Float32Array;
  private colors: Float32Array;
  private clock: THREE.Clock;
  private animationFrameId: number | null = null;
  private onUpdate: ((delta: number) => void) | null = null;
  private hasReachedBottom: boolean = false;
  private soilColorProgress: number = 0;
  private soilMesh: THREE.Mesh;
  private soilMaterial: THREE.MeshBasicMaterial;
  private cameraAngle: number = 0;
  private cameraHeight: number = 3;
  private cameraDistance: number = 15;
  private isDragging: boolean = false;
  private lastMouseX: number = 0;
  private lastMouseY: number = 0;

  constructor(container: HTMLElement) {
    this.container = container;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x1b0f0c);
    this.scene.fog = new THREE.Fog(0x1b0f0c, 15, 35);

    this.camera = new THREE.PerspectiveCamera(
      60,
      container.clientWidth / container.clientHeight,
      0.1,
      100
    );
    this.updateCameraPosition();

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setClearColor(0x1b0f0c, 1);
    container.appendChild(this.renderer.domElement);

    this.soilMaterial = new THREE.MeshBasicMaterial({
      side: THREE.BackSide,
      transparent: true,
      opacity: 0.8,
    });
    this.updateSoilColor(0);
    const soilGeometry = new THREE.CylinderGeometry(12, 12, 20, 32, 1, true);
    soilGeometry.translate(0, -10, 0);
    this.soilMesh = new THREE.Mesh(soilGeometry, this.soilMaterial);
    this.scene.add(this.soilMesh);

    const gridHelper = new THREE.GridHelper(16, 16, 0x4e342e, 0x3e2723);
    gridHelper.position.y = -0.01;
    (gridHelper.material as THREE.Material).transparent = true;
    (gridHelper.material as THREE.Material).opacity = 0.3;
    this.scene.add(gridHelper);

    this.positions = new Float32Array(MAX_PARTICLES * 3);
    this.colors = new Float32Array(MAX_PARTICLES * 3);

    this.particleGeometry = new THREE.BufferGeometry();
    this.particleGeometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    this.particleGeometry.setAttribute('color', new THREE.BufferAttribute(this.colors, 3));
    this.particleGeometry.setDrawRange(0, 0);

    this.particleMaterial = new THREE.PointsMaterial({
      size: PARTICLE_SIZE,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      sizeAttenuation: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.particles = new THREE.Points(this.particleGeometry, this.particleMaterial);
    this.scene.add(this.particles);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xfff8e7, 0.8);
    directionalLight.position.set(5, 10, 5);
    this.scene.add(directionalLight);

    this.clock = new THREE.Clock();

    this.setupMouseControls();
    window.addEventListener('resize', this.handleResize);
  }

  private updateCameraPosition() {
    const x = Math.sin(this.cameraAngle) * this.cameraDistance;
    const z = Math.cos(this.cameraAngle) * this.cameraDistance;
    this.camera.position.set(x, this.cameraHeight, z);
    this.camera.lookAt(0, -5, 0);
  }

  private setupMouseControls() {
    const canvas = this.renderer.domElement;

    canvas.addEventListener('mousedown', (e) => {
      this.isDragging = true;
      this.lastMouseX = e.clientX;
      this.lastMouseY = e.clientY;
      canvas.style.cursor = 'grabbing';
    });

    window.addEventListener('mousemove', (e) => {
      if (!this.isDragging) return;
      const deltaX = e.clientX - this.lastMouseX;
      const deltaY = e.clientY - this.lastMouseY;
      this.cameraAngle += deltaX * 0.005;
      this.cameraHeight = Math.max(-8, Math.min(12, this.cameraHeight + deltaY * 0.03));
      this.updateCameraPosition();
      this.lastMouseX = e.clientX;
      this.lastMouseY = e.clientY;
    });

    window.addEventListener('mouseup', () => {
      this.isDragging = false;
      canvas.style.cursor = 'grab';
    });

    canvas.style.cursor = 'grab';

    canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      this.cameraDistance = Math.max(8, Math.min(25, this.cameraDistance + e.deltaY * 0.01));
      this.updateCameraPosition();
    }, { passive: false });

    canvas.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        this.isDragging = true;
        this.lastMouseX = e.touches[0].clientX;
        this.lastMouseY = e.touches[0].clientY;
      }
    });

    canvas.addEventListener('touchmove', (e) => {
      if (!this.isDragging || e.touches.length !== 1) return;
      const deltaX = e.touches[0].clientX - this.lastMouseX;
      const deltaY = e.touches[0].clientY - this.lastMouseY;
      this.cameraAngle += deltaX * 0.005;
      this.cameraHeight = Math.max(-8, Math.min(12, this.cameraHeight + deltaY * 0.03));
      this.updateCameraPosition();
      this.lastMouseX = e.touches[0].clientX;
      this.lastMouseY = e.touches[0].clientY;
    });

    canvas.addEventListener('touchend', () => {
      this.isDragging = false;
    });
  }

  private handleResize = () => {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  };

  private updateSoilColor(progress: number) {
    const topColor = COLOR_SOIL_TOP.clone().lerp(COLOR_WATER, progress * 0.3);
    const bottomColor = COLOR_SOIL_BOTTOM.clone().lerp(COLOR_WATER, progress * 0.8);
    
    const canvas = document.createElement('canvas');
    canvas.width = 2;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;
    const gradient = ctx.createLinearGradient(0, 0, 0, 256);
    gradient.addColorStop(0, '#' + topColor.getHexString());
    gradient.addColorStop(1, '#' + bottomColor.getHexString());
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 2, 256);

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    this.soilMaterial.map = texture;
    this.soilMaterial.needsUpdate = true;
  }

  public updateNodes(nodes: RootNode[], hasReachedBottom: boolean) {
    this.hasReachedBottom = hasReachedBottom;

    const time = this.clock.getElapsedTime();

    for (let i = 0; i < nodes.length && i < MAX_PARTICLES; i++) {
      const node = nodes[i];
      const brownianX = (Math.random() - 0.5) * 0.02;
      const brownianY = (Math.random() - 0.5) * 0.01;
      const brownianZ = (Math.random() - 0.5) * 0.02;

      this.positions[i * 3] = node.position[0] + brownianX;
      this.positions[i * 3 + 1] = node.position[1] + brownianY;
      this.positions[i * 3 + 2] = node.position[2] + brownianZ;

      const depthRatio = Math.min(1, node.depth / 12);
      const generationRatio = Math.min(1, node.generation / 5);
      const tipRatio = node.isTip ? 0.8 : 0.2;
      const colorMix = Math.max(0, Math.min(1, depthRatio * 0.5 + generationRatio * 0.3 - tipRatio * 0.3));

      const color = COLOR_TIP.clone().lerp(COLOR_ROOT, colorMix);
      
      const pulse = node.isTip ? 1 + Math.sin(time * 3 + i) * 0.1 : 1;

      this.colors[i * 3] = color.r * pulse;
      this.colors[i * 3 + 1] = color.g * pulse;
      this.colors[i * 3 + 2] = color.b * pulse;
    }

    this.particleGeometry.setDrawRange(0, nodes.length);
    const posAttr = this.particleGeometry.getAttribute('position') as THREE.BufferAttribute;
    const colAttr = this.particleGeometry.getAttribute('color') as THREE.BufferAttribute;
    posAttr.needsUpdate = true;
    colAttr.needsUpdate = true;
  }

  public setOnUpdate(callback: (delta: number) => void) {
    this.onUpdate = callback;
  }

  public start() {
    this.clock.start();
    this.animate();
  }

  public stop() {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  private animate = () => {
    this.animationFrameId = requestAnimationFrame(this.animate);

    const delta = this.clock.getDelta();

    if (this.onUpdate) {
      this.onUpdate(delta);
    }

    if (this.hasReachedBottom && this.soilColorProgress < 1) {
      this.soilColorProgress = Math.min(1, this.soilColorProgress + delta * 0.5);
      this.updateSoilColor(this.soilColorProgress);
    }

    this.renderer.render(this.scene, this.camera);
  };

  public dispose() {
    this.stop();
    window.removeEventListener('resize', this.handleResize);
    
    this.particleGeometry.dispose();
    this.particleMaterial.dispose();
    this.soilMaterial.dispose();
    this.renderer.dispose();
    
    if (this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }
  }
}
