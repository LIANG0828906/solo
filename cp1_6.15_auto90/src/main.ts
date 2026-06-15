import * as THREE from 'three';
import { MoleculeBuilder } from './MoleculeBuilder';
import { UIManager } from './UIManager';

class MoleculeViewer {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private moleculeBuilder: MoleculeBuilder;
  private uiManager: UIManager;
  private clock: THREE.Clock;
  private particleCore: THREE.Points;
  private particleMidHalos: THREE.Points;
  private particleOuterHalos: THREE.Points;
  private autoRotationAngle: number = 0;

  private frameCount: number = 0;
  private fpsTime: number = 0;
  private currentFps: number = 60;
  private fpsDisplay: HTMLElement | null = null;

  constructor() {
    const container = document.getElementById('canvas-container')!;

    this.scene = new THREE.Scene();

    this.camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      100
    );
    this.camera.position.set(0, 0, 5);
    this.camera.lookAt(0, 0, 0);

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setClearColor(0x000000, 0);
    container.appendChild(this.renderer.domElement);

    this.setupLighting();
    this.particleCore = this.createParticles();
    this.particleMidHalos = this.createMidHaloParticles();
    this.particleOuterHalos = this.createOuterHaloParticles();
    this.scene.add(this.particleCore);
    this.scene.add(this.particleMidHalos);
    this.scene.add(this.particleOuterHalos);
    this.setupFPSDisplay();

    this.moleculeBuilder = new MoleculeBuilder();
    this.moleculeBuilder.buildMolecule('h2o');
    this.scene.add(this.moleculeBuilder.getGroup());

    this.uiManager = new UIManager(this.renderer, this.camera, this.moleculeBuilder);
    this.uiManager.setBaseDistance(5);
    this.setupCallbacks();

    this.clock = new THREE.Clock();

    window.addEventListener('resize', () => this.onResize());
    this.animate();
  }

  private setupLighting(): void {
    const ambient = new THREE.AmbientLight(0x8888cc, 0.6);
    this.scene.add(ambient);

    const directional1 = new THREE.DirectionalLight(0xffffff, 0.9);
    directional1.position.set(5, 5, 5);
    this.scene.add(directional1);

    const directional2 = new THREE.DirectionalLight(0x4466ff, 0.3);
    directional2.position.set(-5, -3, -5);
    this.scene.add(directional2);

    const point = new THREE.PointLight(0x6644ff, 0.4, 20);
    point.position.set(0, 3, 0);
    this.scene.add(point);
  }

  private createParticles(): THREE.Points {
    const count = 120;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 3 + Math.random() * 5;
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);

      const colorMix = Math.random();
      colors[i * 3] = 0.3 + colorMix * 0.3;
      colors[i * 3 + 1] = 0.2 + colorMix * 0.2;
      colors[i * 3 + 2] = 0.7 + colorMix * 0.2;

      sizes[i] = 0.02 + Math.random() * 0.03;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d')!;
    const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1.0)');
    gradient.addColorStop(0.2, 'rgba(180, 200, 255, 0.9)');
    gradient.addColorStop(0.5, 'rgba(120, 150, 255, 0.3)');
    gradient.addColorStop(1, 'rgba(80, 100, 200, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 32, 32);
    const starTexture = new THREE.CanvasTexture(canvas);

    const material = new THREE.PointsMaterial({
      size: 0.12,
      map: starTexture,
      vertexColors: true,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    });

    const points = new THREE.Points(geometry, material);
    points.userData.basePositions = new Float32Array(positions);
    points.userData.offsets = new Float32Array(count).fill(0).map(() => Math.random() * Math.PI * 2);
    return points;
  }

  private createMidHaloParticles(): THREE.Points {
    const count = 80;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 2.5 + Math.random() * 3;
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);

      const shade = 0.4 + Math.random() * 0.3;
      colors[i * 3] = shade;
      colors[i * 3 + 1] = shade * 0.7;
      colors[i * 3 + 2] = 0.7 + Math.random() * 0.2;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d')!;
    const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    gradient.addColorStop(0, 'rgba(120, 160, 255, 0.7)');
    gradient.addColorStop(0.35, 'rgba(90, 130, 255, 0.35)');
    gradient.addColorStop(0.7, 'rgba(60, 90, 220, 0.1)');
    gradient.addColorStop(1, 'rgba(40, 60, 200, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 64, 64);
    const haloTexture = new THREE.CanvasTexture(canvas);

    const material = new THREE.PointsMaterial({
      size: 1.2,
      map: haloTexture,
      vertexColors: true,
      transparent: true,
      opacity: 0.35,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    });

    const points = new THREE.Points(geometry, material);
    points.userData.basePositions = new Float32Array(positions);
    points.userData.offsets = new Float32Array(count).fill(0).map(() => Math.random() * Math.PI * 2);
    return points;
  }

  private createOuterHaloParticles(): THREE.Points {
    const count = 50;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 4 + Math.random() * 4;
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);

      const shade = 0.3 + Math.random() * 0.2;
      colors[i * 3] = shade;
      colors[i * 3 + 1] = shade * 0.5;
      colors[i * 3 + 2] = 0.6 + Math.random() * 0.3;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d')!;
    const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    gradient.addColorStop(0, 'rgba(150, 100, 255, 0.25)');
    gradient.addColorStop(0.3, 'rgba(120, 80, 240, 0.12)');
    gradient.addColorStop(0.7, 'rgba(80, 60, 200, 0.05)');
    gradient.addColorStop(1, 'rgba(50, 40, 180, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 128, 128);
    const haloTexture = new THREE.CanvasTexture(canvas);

    const material = new THREE.PointsMaterial({
      size: 2.8,
      map: haloTexture,
      vertexColors: true,
      transparent: true,
      opacity: 0.25,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    });

    const points = new THREE.Points(geometry, material);
    points.userData.basePositions = new Float32Array(positions);
    points.userData.offsets = new Float32Array(count).fill(0).map(() => Math.random() * Math.PI * 2);
    return points;
  }

  private setupFPSDisplay(): void {
    const fpsDiv = document.createElement('div');
    fpsDiv.style.cssText = `
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 200;
      background: rgba(20, 20, 40, 0.75);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 8px;
      padding: 8px 14px;
      font-family: 'Segoe UI', system-ui, sans-serif;
      font-size: 12px;
      color: rgba(255, 255, 255, 0.8);
      font-variant-numeric: tabular-nums;
      pointer-events: none;
    `;
    fpsDiv.innerHTML = 'FPS: <span style="color:#4da6ff;font-weight:600">60</span>';
    document.body.appendChild(fpsDiv);
    this.fpsDisplay = fpsDiv.querySelector('span')!;
  }

  private updateFPS(delta: number): void {
    this.frameCount++;
    this.fpsTime += delta;
    if (this.fpsTime >= 0.5) {
      this.currentFps = Math.round(this.frameCount / this.fpsTime);
      if (this.fpsDisplay) {
        this.fpsDisplay.textContent = String(this.currentFps);
        if (this.currentFps >= 55) {
          this.fpsDisplay.style.color = '#4da6ff';
        } else if (this.currentFps >= 45) {
          this.fpsDisplay.style.color = '#ffcc00';
        } else {
          this.fpsDisplay.style.color = '#ff4444';
        }
      }
      this.frameCount = 0;
      this.fpsTime = 0;
    }
  }

  private setupCallbacks(): void {
    this.uiManager.setDisplayModeChangeCallback((mode) => {
      this.moleculeBuilder.setDisplayMode(mode);
    });
  }

  private onResize(): void {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  private animate(): void {
    requestAnimationFrame(() => this.animate());

    const delta = this.clock.getDelta();
    const elapsed = this.clock.getElapsedTime();

    this.uiManager.updateMoleculeTransition(delta);
    this.moleculeBuilder.update(delta);
    this.uiManager.updateWeightAnimation(delta);
    this.uiManager.updateAngleAnimation(delta);
    this.uiManager.updateCardAnimation(delta);

    if (!this.uiManager.getAutoRotatePaused() && !this.uiManager.isTransitioning()) {
      this.autoRotationAngle += delta * this.uiManager.getRotationSpeed() * Math.PI * 2;
    }

    this.uiManager.updateDragRotation();

    const group = this.moleculeBuilder.getGroup();
    group.rotation.y = this.autoRotationAngle + this.uiManager.getCurrentRotationY();
    group.rotation.x = this.uiManager.getCurrentRotationX();

    this.uiManager.updateLabelSizes(this.camera);

    this.updateParticles(elapsed);
    this.updateMidHalos(elapsed);
    this.updateOuterHalos(elapsed);
    this.updateFPS(delta);

    this.renderer.render(this.scene, this.camera);
  }

  private updateParticles(elapsed: number): void {
    const positions = this.particleCore.geometry.attributes.position as THREE.BufferAttribute;
    const arr = positions.array as Float32Array;
    const base = this.particleCore.userData.basePositions as Float32Array;
    const offsets = this.particleCore.userData.offsets as Float32Array;

    for (let i = 0; i < arr.length / 3; i++) {
      const idx = i * 3;
      const x = base[idx];
      const y = base[idx + 1];
      const z = base[idx + 2];
      const angle = elapsed * 0.12 + offsets[i];
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      const rotX = x * cos - z * sin;
      const rotZ = x * sin + z * cos;
      const breath = 1 + Math.sin(elapsed * 0.8 + offsets[i]) * 0.06;
      arr[idx] = rotX * breath;
      arr[idx + 2] = rotZ * breath;
      arr[idx + 1] = y * breath + Math.sin(elapsed * 1.4 + offsets[i]) * 0.07;
    }

    positions.needsUpdate = true;
    (this.particleCore.material as THREE.PointsMaterial).opacity =
      0.45 + Math.sin(elapsed * 1.1) * 0.2;
    (this.particleCore.material as THREE.PointsMaterial).size =
      0.12 + Math.sin(elapsed * 0.7) * 0.03;
  }

  private updateMidHalos(elapsed: number): void {
    const positions = this.particleMidHalos.geometry.attributes.position as THREE.BufferAttribute;
    const arr = positions.array as Float32Array;
    const base = this.particleMidHalos.userData.basePositions as Float32Array;
    const offsets = this.particleMidHalos.userData.offsets as Float32Array;
    const mat = this.particleMidHalos.material as THREE.PointsMaterial;

    for (let i = 0; i < arr.length / 3; i++) {
      const idx = i * 3;
      const x = base[idx];
      const y = base[idx + 1];
      const z = base[idx + 2];
      const angle = -elapsed * 0.05 + offsets[i];
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      const rotX = x * cos - z * sin;
      const rotZ = x * sin + z * cos;
      const pulse = 1 + Math.sin(elapsed * 0.9 + offsets[i] * 2) * 0.18;
      arr[idx] = rotX * pulse;
      arr[idx + 1] = y * pulse + Math.sin(elapsed * 0.6 + offsets[i]) * 0.1;
      arr[idx + 2] = rotZ * pulse;
    }

    positions.needsUpdate = true;
    mat.opacity = 0.28 + Math.sin(elapsed * 0.45) * 0.12;
    mat.size = 1.2 + Math.sin(elapsed * 0.8) * 0.35;
  }

  private updateOuterHalos(elapsed: number): void {
    const positions = this.particleOuterHalos.geometry.attributes.position as THREE.BufferAttribute;
    const arr = positions.array as Float32Array;
    const base = this.particleOuterHalos.userData.basePositions as Float32Array;
    const offsets = this.particleOuterHalos.userData.offsets as Float32Array;
    const mat = this.particleOuterHalos.material as THREE.PointsMaterial;

    for (let i = 0; i < arr.length / 3; i++) {
      const idx = i * 3;
      const x = base[idx];
      const y = base[idx + 1];
      const z = base[idx + 2];
      const angle = elapsed * 0.02 + offsets[i] * 0.5;
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      const rotX = x * cos - z * sin;
      const rotZ = x * sin + z * cos;
      const pulse = 1 + Math.sin(elapsed * 0.35 + offsets[i]) * 0.12;
      arr[idx] = rotX * pulse;
      arr[idx + 1] = y * pulse + Math.sin(elapsed * 0.4 + offsets[i] * 1.5) * 0.15;
      arr[idx + 2] = rotZ * pulse;
    }

    positions.needsUpdate = true;
    mat.opacity = 0.22 + Math.sin(elapsed * 0.25) * 0.1;
    mat.size = 2.8 + Math.sin(elapsed * 0.55) * 0.7;
  }
}

new MoleculeViewer();
