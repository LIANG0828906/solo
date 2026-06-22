import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { ParticleSystem, ParticleType, ForceType, ForceField } from './particleSystem';

class Application {
  private container: HTMLElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private controls: OrbitControls;
  private clock: THREE.Clock;

  private particleSystem: ParticleSystem;
  private raycaster: THREE.Raycaster;
  private pointer: THREE.Vector2;

  private draggingForce: ForceField | null = null;
  private dragPlane: THREE.Plane;
  private dragOffset: THREE.Vector3;
  private dragStartPos: THREE.Vector3;

  private fpsFrames = 0;
  private fpsLastTime = 0;
  private fpsValue = 60;

  private stars: THREE.Points;

  constructor() {
    this.container = document.getElementById('canvas-container')!;
    this.clock = new THREE.Clock();
    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();
    this.dragPlane = new THREE.Plane();
    this.dragOffset = new THREE.Vector3();
    this.dragStartPos = new THREE.Vector3();

    this.scene = new THREE.Scene();
    this.setupCamera();
    this.setupRenderer();
    this.setupControls();
    this.setupStars();

    this.particleSystem = new ParticleSystem(this.scene);

    this.setupUI();
    this.setupEventListeners();
    this.setupDragListeners();

    this.animate = this.animate.bind(this);
    this.animate();
  }

  private setupCamera(): void {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.camera = new THREE.PerspectiveCamera(60, w / h, 0.1, 200);
    this.camera.position.set(0, 2, 8);
    this.camera.lookAt(0, 1, 0);
  }

  private setupRenderer(): void {
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setClearColor(0x000000, 0);
    this.container.appendChild(this.renderer.domElement);
  }

  private setupControls(): void {
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.minDistance = 2;
    this.controls.maxDistance = 30;
    this.controls.maxPolarAngle = Math.PI * 0.92;
    this.controls.target.set(0, 1, 0);
    this.controls.update();
  }

  private setupStars(): void {
    const count = 800;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const r = 30 + Math.random() * 50;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);

      const brightness = 0.5 + Math.random() * 0.5;
      const tint = Math.random();
      colors[i * 3] = brightness * (0.8 + tint * 0.2);
      colors[i * 3 + 1] = brightness * (0.85 + tint * 0.15);
      colors[i * 3 + 2] = brightness * 1.0;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const starCanvas = document.createElement('canvas');
    starCanvas.width = 32;
    starCanvas.height = 32;
    const ctx = starCanvas.getContext('2d')!;
    const grad = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    grad.addColorStop(0, 'rgba(255,255,255,1)');
    grad.addColorStop(0.4, 'rgba(200,210,255,0.5)');
    grad.addColorStop(1, 'rgba(150,170,255,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 32, 32);
    const starTex = new THREE.CanvasTexture(starCanvas);

    const mat = new THREE.PointsMaterial({
      size: 0.3,
      sizeAttenuation: true,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      map: starTex,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.stars = new THREE.Points(geo, mat);
    this.scene.add(this.stars);
  }

  private setupUI(): void {
    const params = this.particleSystem.getParams();
    this.updateSliderDisplays(params);

    document.querySelectorAll<HTMLButtonElement>('.type-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const type = btn.dataset.type as ParticleType;
        if (type) this.setParticleType(type);
      });
    });

    const rateSlider = document.getElementById('rate-slider') as HTMLInputElement;
    const speedSlider = document.getElementById('speed-slider') as HTMLInputElement;
    const lifeSlider = document.getElementById('life-slider') as HTMLInputElement;
    const sizeSlider = document.getElementById('size-slider') as HTMLInputElement;

    rateSlider.addEventListener('input', () => {
      const val = parseFloat(rateSlider.value);
      this.particleSystem.setParam('emissionRate', val);
      document.getElementById('rate-value')!.textContent = val.toString();
    });
    speedSlider.addEventListener('input', () => {
      const val = parseFloat(speedSlider.value);
      this.particleSystem.setParam('initialSpeed', val);
      document.getElementById('speed-value')!.textContent = val.toFixed(1);
    });
    lifeSlider.addEventListener('input', () => {
      const val = parseFloat(lifeSlider.value);
      this.particleSystem.setParam('lifetime', val);
      document.getElementById('life-value')!.textContent = val.toFixed(1);
    });
    sizeSlider.addEventListener('input', () => {
      const val = parseFloat(sizeSlider.value);
      this.particleSystem.setParam('particleSize', val);
      document.getElementById('size-value')!.textContent = val.toFixed(2);
    });

    document.querySelectorAll<HTMLButtonElement>('.force-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const type = btn.dataset.force as ForceType;
        if (type) this.addForceField(type);
      });
    });

    document.getElementById('save-preset')!.addEventListener('click', () => {
      this.savePreset();
    });
    document.getElementById('load-preset')!.addEventListener('click', () => {
      (document.getElementById('file-input') as HTMLInputElement).click();
    });
    (document.getElementById('file-input') as HTMLInputElement).addEventListener('change', (e) => {
      const input = e.target as HTMLInputElement;
      const file = input.files?.[0];
      if (file) this.loadPreset(file);
      input.value = '';
    });

    this.updateForceButtonsState();
    this.updateForceList();
  }

  private updateSliderDisplays(params: { emissionRate: number; initialSpeed: number; lifetime: number; particleSize: number }): void {
    document.getElementById('rate-value')!.textContent = Math.round(params.emissionRate).toString();
    document.getElementById('speed-value')!.textContent = params.initialSpeed.toFixed(1);
    document.getElementById('life-value')!.textContent = params.lifetime.toFixed(1);
    document.getElementById('size-value')!.textContent = params.particleSize.toFixed(2);

    (document.getElementById('rate-slider') as HTMLInputElement).value = params.emissionRate.toString();
    (document.getElementById('speed-slider') as HTMLInputElement).value = params.initialSpeed.toString();
    (document.getElementById('life-slider') as HTMLInputElement).value = params.lifetime.toString();
    (document.getElementById('size-slider') as HTMLInputElement).value = params.particleSize.toString();
  }

  private setParticleType(type: ParticleType): void {
    document.querySelectorAll('.type-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector(`.type-btn[data-type="${type}"]`)?.classList.add('active');
    this.particleSystem.setParticleType(type);

    const defaults: Record<ParticleType, { emissionRate: number; initialSpeed: number; lifetime: number; particleSize: number }> = {
      smoke: { emissionRate: 20, initialSpeed: 0.8, lifetime: 3.5, particleSize: 0.35 },
      water: { emissionRate: 50, initialSpeed: 3.0, lifetime: 1.5, particleSize: 0.12 },
      fire: { emissionRate: 30, initialSpeed: 2.0, lifetime: 2.0, particleSize: 0.20 },
    };
    const target = defaults[type];
    this.animateSliderTo(target, 400);
  }

  private animateSliderTo(target: { emissionRate: number; initialSpeed: number; lifetime: number; particleSize: number }, durationMs: number): void {
    const rateEl = document.getElementById('rate-slider') as HTMLInputElement;
    const speedEl = document.getElementById('speed-slider') as HTMLInputElement;
    const lifeEl = document.getElementById('life-slider') as HTMLInputElement;
    const sizeEl = document.getElementById('size-slider') as HTMLInputElement;

    const start = {
      emissionRate: parseFloat(rateEl.value),
      initialSpeed: parseFloat(speedEl.value),
      lifetime: parseFloat(lifeEl.value),
      particleSize: parseFloat(sizeEl.value),
    };

    const startTime = performance.now();
    const easeInOut = (t: number) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

    const step = () => {
      const elapsed = performance.now() - startTime;
      const t = Math.min(elapsed / durationMs, 1);
      const e = easeInOut(t);

      const emissionRate = start.emissionRate + (target.emissionRate - start.emissionRate) * e;
      const initialSpeed = start.initialSpeed + (target.initialSpeed - start.initialSpeed) * e;
      const lifetime = start.lifetime + (target.lifetime - start.lifetime) * e;
      const particleSize = start.particleSize + (target.particleSize - start.particleSize) * e;

      rateEl.value = emissionRate.toString();
      speedEl.value = initialSpeed.toString();
      lifeEl.value = lifetime.toString();
      sizeEl.value = particleSize.toString();

      document.getElementById('rate-value')!.textContent = Math.round(emissionRate).toString();
      document.getElementById('speed-value')!.textContent = initialSpeed.toFixed(1);
      document.getElementById('life-value')!.textContent = lifetime.toFixed(1);
      document.getElementById('size-value')!.textContent = particleSize.toFixed(2);

      if (t < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  private addForceField(type: ForceType): void {
    const fields = this.particleSystem.getForceFields();
    if (fields.length >= 3) return;

    const angle = fields.length * 2.1;
    const radius = 2.5;
    const pos = new THREE.Vector3(
      Math.cos(angle) * radius,
      1.0,
      Math.sin(angle) * radius
    );

    const field = this.particleSystem.addForceField(type, pos);
    if (field) {
      this.updateForceButtonsState();
      this.updateForceList();
    }
  }

  private removeForceField(id: string): void {
    this.particleSystem.removeForceField(id);
    this.updateForceButtonsState();
    this.updateForceList();
  }

  private updateForceButtonsState(): void {
    const fields = this.particleSystem.getForceFields();
    const disabled = fields.length >= 3;
    document.querySelectorAll<HTMLButtonElement>('.force-btn').forEach(btn => {
      btn.disabled = disabled;
    });
  }

  private updateForceList(): void {
    const list = document.getElementById('force-list')!;
    list.innerHTML = '';
    const fields = this.particleSystem.getForceFields();
    const forceNames: Record<ForceType, string> = { gravity: '引力场', vortex: '涡流场', wind: '风场' };

    fields.forEach(field => {
      const item = document.createElement('div');
      item.className = 'force-item';
      item.innerHTML = `
        <div class="force-item-info">
          <div class="force-item-dot ${field.type}"></div>
          <span>${forceNames[field.type]} <small style="color:#707090">(X:${field.position.x.toFixed(1)} Y:${field.position.y.toFixed(1)} Z:${field.position.z.toFixed(1)})</small></span>
        </div>
        <button class="force-item-remove" title="移除">×</button>
      `;
      item.querySelector('.force-item-remove')!.addEventListener('click', () => {
        this.removeForceField(field.id);
      });
      list.appendChild(item);
    });

    document.getElementById('force-count')!.textContent = `${fields.length}/3`;
  }

  private setupEventListeners(): void {
    window.addEventListener('resize', () => this.onWindowResize());
  }

  private setupDragListeners(): void {
    const canvas = this.renderer.domElement;

    const getPointer = (clientX: number, clientY: number) => {
      const rect = canvas.getBoundingClientRect();
      this.pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      this.pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1;
    };

    const findForceFieldUnderPointer = (): ForceField | null => {
      this.raycaster.setFromCamera(this.pointer, this.camera);
      const fields = this.particleSystem.getForceFields();
      for (const field of fields) {
        const meshes: THREE.Mesh[] = [];
        field.mesh.traverse(child => { if (child instanceof THREE.Mesh) meshes.push(child); });
        const hit = this.raycaster.intersectObjects(meshes, false);
        if (hit.length > 0) return field;
      }
      return null;
    };

    const onPointerDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      if (e.ctrlKey || e.shiftKey || e.metaKey) return;
      getPointer(e.clientX, e.clientY);
      const field = findForceFieldUnderPointer();
      if (field) {
        this.draggingForce = field;
        this.controls.enabled = false;

        const normal = new THREE.Vector3();
        this.camera.getWorldDirection(normal);
        this.dragPlane.setFromNormalAndCoplanarPoint(normal, field.position);

        this.raycaster.setFromCamera(this.pointer, this.camera);
        const intersection = new THREE.Vector3();
        if (this.raycaster.ray.intersectPlane(this.dragPlane, intersection)) {
          this.dragOffset.copy(field.position).sub(intersection);
          this.dragStartPos.copy(field.position);
        }
        canvas.style.cursor = 'grabbing';
        e.preventDefault();
        e.stopPropagation();
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      getPointer(e.clientX, e.clientY);
      if (this.draggingForce) {
        this.raycaster.setFromCamera(this.pointer, this.camera);
        const intersection = new THREE.Vector3();
        if (this.raycaster.ray.intersectPlane(this.dragPlane, intersection)) {
          const target = intersection.clone().add(this.dragOffset);
          this.particleSystem.setForceFieldTargetPosition(this.draggingForce.id, target);
        }
      } else {
        this.raycaster.setFromCamera(this.pointer, this.camera);
        const fields = this.particleSystem.getForceFields();
        let hovering = false;
        for (const field of fields) {
          const meshes: THREE.Mesh[] = [];
          field.mesh.traverse(child => { if (child instanceof THREE.Mesh) meshes.push(child); });
          const hit = this.raycaster.intersectObjects(meshes, false);
          if (hit.length > 0) { hovering = true; break; }
        }
        canvas.style.cursor = hovering ? 'grab' : '';
      }
    };

    const onPointerUp = () => {
      if (this.draggingForce) {
        this.draggingForce = null;
        this.controls.enabled = true;
        canvas.style.cursor = '';
        this.updateForceList();
      }
    };

    canvas.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  }

  private onWindowResize(): void {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
    this.particleSystem.resize();
  }

  private savePreset(): void {
    const data = this.particleSystem.serialize();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `particle-preset-${timestamp}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    const btn = document.getElementById('save-preset') as HTMLButtonElement;
    btn.textContent = '✓ 已保存';
    setTimeout(() => { btn.textContent = '💾 保存预设'; }, 1000);
  }

  private async loadPreset(file: File): Promise<void> {
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      const type = this.particleSystem.deserialize(data);
      if (type) {
        document.querySelectorAll('.type-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelector(`.type-btn[data-type="${type}"]`)?.classList.add('active');
      }
      const params = this.particleSystem.getParams();
      this.updateSliderDisplays(params);
      this.updateForceButtonsState();
      this.updateForceList();

      const btn = document.getElementById('load-preset') as HTMLButtonElement;
      btn.textContent = '✓ 已加载';
      setTimeout(() => { btn.textContent = '📂 加载预设'; }, 1000);
    } catch (err) {
      console.error('加载预设失败:', err);
      alert('预设文件格式无效');
    }
  }

  private updateFPS(): void {
    this.fpsFrames++;
    const now = performance.now();
    if (now - this.fpsLastTime >= 500) {
      this.fpsValue = Math.round((this.fpsFrames * 1000) / (now - this.fpsLastTime));
      this.fpsFrames = 0;
      this.fpsLastTime = now;

      const fpsEl = document.getElementById('fps-value')!;
      fpsEl.textContent = this.fpsValue.toString();
      fpsEl.style.color = this.fpsValue >= 30 ? '#4a90d9' : this.fpsValue >= 20 ? '#f39c12' : '#e74c3c';

      const count = this.particleSystem.getActiveParticleCount();
      const countEl = document.getElementById('particle-count')!;
      countEl.textContent = count.toString();
      countEl.classList.toggle('particle-count-warn', count > 5000);
    }
  }

  private animate(): void {
    requestAnimationFrame(this.animate);
    const delta = Math.min(this.clock.getDelta(), 0.05);

    this.particleSystem.update(delta);

    this.stars.rotation.y += delta * 0.005;
    this.stars.rotation.x += delta * 0.002;

    this.controls.update();
    this.renderer.render(this.scene, this.camera);
    this.updateFPS();
  }

  dispose(): void {
    this.particleSystem.dispose();
    this.renderer.dispose();
    this.controls.dispose();
  }
}

window.addEventListener('DOMContentLoaded', () => {
  (window as any).__app = new Application();
});
