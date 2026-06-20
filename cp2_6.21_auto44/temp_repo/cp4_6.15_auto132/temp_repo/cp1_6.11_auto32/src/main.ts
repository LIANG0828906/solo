import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { ParticleSystem } from './particleSystem';
import { DrawingTool } from './drawingTool';

const THEME_COLORS: Record<string, string> = {
  '#FFD700': '暖金',
  '#4169E1': '星空蓝',
  '#FF4500': '火焰红',
  '#00FF7F': '极光绿',
  '#8A2BE2': '幻彩紫',
};

const STAR_COUNT = 200;
const EMIT_PER_FRAME = 30;

class SandArtApp {
  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private controls!: OrbitControls;
  private particleSystem!: ParticleSystem;
  private drawingTool!: DrawingTool;
  private clock: THREE.Clock;

  private currentColor: THREE.Color = new THREE.Color('#FFD700');
  private isReplaying: boolean = false;
  private isRecording: boolean = false;

  private stars!: THREE.Points;
  private starData!: {
    baseSizes: Float32Array;
    twinkleSpeeds: Float32Array;
    twinkleOffsets: Float32Array;
  };

  private hintElement!: HTMLElement;
  private hasDrawn: boolean = false;

  constructor() {
    this.clock = new THREE.Clock();
    this.init();
    this.createStars();
    this.createParticleSystem();
    this.createDrawingTool();
    this.setupUI();
    this.animate();
  }

  private init(): void {
    const container = document.getElementById('canvas-container')!;

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setClearColor(0x000000, 0);
    container.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();

    this.camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      100
    );
    this.camera.position.set(0, 0, 5);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.rotateSpeed = 0.8;
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.1;
    this.controls.minDistance = 0.5 * 5;
    this.controls.maxDistance = 5 * 5;
    this.controls.enablePan = false;

    window.addEventListener('resize', this.onResize.bind(this));

    this.hintElement = document.getElementById('hint')!;
  }

  private createStars(): void {
    const positions = new Float32Array(STAR_COUNT * 3);
    const sizes = new Float32Array(STAR_COUNT);
    const alphas = new Float32Array(STAR_COUNT);
    const baseSizes = new Float32Array(STAR_COUNT);
    const twinkleSpeeds = new Float32Array(STAR_COUNT);
    const twinkleOffsets = new Float32Array(STAR_COUNT);

    for (let i = 0; i < STAR_COUNT; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 30;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 30;
      positions[i * 3 + 2] = -5 - Math.random() * 20;

      baseSizes[i] = 0.01 + Math.random() * 0.02;
      sizes[i] = baseSizes[i];
      alphas[i] = 0.4 + Math.random() * 0.6;
      twinkleSpeeds[i] = (2 + Math.random() * 2);
      twinkleOffsets[i] = Math.random() * Math.PI * 2;
    }

    const starVertShader = `
      attribute float aSize;
      attribute float aAlpha;
      varying float vAlpha;

      void main() {
        vAlpha = aAlpha;
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = aSize * (300.0 / -mvPosition.z);
        gl_PointSize = max(gl_PointSize, 0.5);
        gl_Position = projectionMatrix * mvPosition;
      }
    `;

    const starFragShader = `
      varying float vAlpha;

      void main() {
        float dist = length(gl_PointCoord - vec2(0.5));
        if (dist > 0.5) discard;
        float glow = exp(-dist * dist * 8.0);
        gl_FragColor = vec4(0.85, 0.88, 1.0, vAlpha * glow);
      }
    `;

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
    geometry.setAttribute('aAlpha', new THREE.BufferAttribute(alphas, 1));

    const material = new THREE.ShaderMaterial({
      vertexShader: starVertShader,
      fragmentShader: starFragShader,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    this.stars = new THREE.Points(geometry, material);
    this.stars.frustumCulled = false;
    this.scene.add(this.stars);

    this.starData = { baseSizes, twinkleSpeeds, twinkleOffsets };
  }

  private updateStars(time: number): void {
    const alphaAttr = this.stars.geometry.attributes.aAlpha as THREE.BufferAttribute;
    const sizeAttr = this.stars.geometry.attributes.aSize as THREE.BufferAttribute;

    for (let i = 0; i < STAR_COUNT; i++) {
      const t = Math.sin(time * this.starData.twinkleSpeeds[i] + this.starData.twinkleOffsets[i]);
      const twinkle = 0.3 + 0.7 * (t * 0.5 + 0.5);
      alphaAttr.array[i] = twinkle;
      sizeAttr.array[i] = this.starData.baseSizes[i] * (0.8 + 0.2 * twinkle);
    }

    alphaAttr.needsUpdate = true;
    sizeAttr.needsUpdate = true;
  }

  private createParticleSystem(): void {
    this.particleSystem = new ParticleSystem(this.scene);
  }

  private createDrawingTool(): void {
    this.drawingTool = new DrawingTool(
      this.camera,
      this.renderer.domElement,
      this.onDraw.bind(this),
      this.onStrokeEnd.bind(this)
    );
  }

  private onDraw(point: THREE.Vector3): void {
    if (this.isReplaying) return;

    if (!this.hasDrawn) {
      this.hasDrawn = true;
      this.hintElement.classList.add('hidden');
    }

    this.particleSystem.emit(point, this.currentColor, EMIT_PER_FRAME);
  }

  private onStrokeEnd(): void {
    this.particleSystem.endStroke();
    this.controls.enabled = true;
  }

  private setupUI(): void {
    const colorBtns = document.querySelectorAll('.color-btn');
    colorBtns.forEach((btn) => {
      const colorHex = (btn as HTMLElement).dataset.color!;
      btn.addEventListener('click', () => {
        colorBtns.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');

        this.currentColor = new THREE.Color(colorHex);
        this.drawingTool.setColor(this.currentColor);
        this.particleSystem.setThemeColor(this.currentColor);

        this.particleSystem.emitBurst(
          new THREE.Vector3(0, 0, 0),
          this.currentColor,
          30
        );
      });
    });

    document.getElementById('btn-undo')!.addEventListener('click', () => {
      if (this.isReplaying) return;
      this.particleSystem.undo();
    });

    document.getElementById('btn-replay')!.addEventListener('click', () => {
      if (this.isReplaying) return;
      this.startReplay();
    });

    document.getElementById('btn-export')!.addEventListener('click', () => {
      if (this.isReplaying) return;
      this.startExport();
    });

    this.renderer.domElement.addEventListener('mousedown', (e) => {
      if (e.button === 0 && !this.isReplaying) {
        this.controls.enabled = false;
        this.particleSystem.beginStroke(this.currentColor);
      }
    });

    this.renderer.domElement.addEventListener('touchstart', () => {
      if (!this.isReplaying) {
        this.controls.enabled = false;
        this.particleSystem.beginStroke(this.currentColor);
      }
    });
  }

  private async startReplay(): Promise<void> {
    const strokes = this.particleSystem.getStrokes();
    if (strokes.length === 0) return;

    this.isReplaying = true;
    this.drawingTool.setEnabled(false);
    this.setButtonsDisabled(true);

    this.particleSystem.clearAll();

    await this.performReplay(strokes, null);

    this.isReplaying = false;
    this.drawingTool.setEnabled(true);
    this.setButtonsDisabled(false);
  }

  private performReplay(
    strokes: { points: THREE.Vector3[]; color: THREE.Color }[],
    onFrame?: (canvas: HTMLCanvasElement) => void
  ): Promise<void> {
    return new Promise((resolve) => {
      this.particleSystem.clearAll();

      const totalDuration = strokes.reduce((sum, s) => sum + s.points.length * 0.033, 0);
      const fadeDuration = 3.0;
      const fullDuration = (totalDuration + fadeDuration) * 2;

      let elapsed = 0;
      let strokeIdx = 0;
      let pointIdx = 0;
      let drawing = true;

      const replayLoop = () => {
        const delta = this.clock.getDelta();
        const replayDelta = delta * 0.5;

        if (drawing) {
          if (strokeIdx < strokes.length) {
            const stroke = strokes[strokeIdx];
            const prevColor = this.currentColor;
            this.currentColor = stroke.color;

            if (pointIdx === 0) {
              this.particleSystem.beginStroke(stroke.color);
            }

            const pointsPerFrame = 2;
            for (let p = 0; p < pointsPerFrame && pointIdx < stroke.points.length; p++) {
              this.particleSystem.emit(stroke.points[pointIdx], stroke.color, EMIT_PER_FRAME);
              pointIdx++;
            }

            if (pointIdx >= stroke.points.length) {
              this.particleSystem.endStroke();
              strokeIdx++;
              pointIdx = 0;
            }
          } else {
            drawing = false;
          }
        }

        elapsed += replayDelta;

        this.particleSystem.update(replayDelta);
        this.updateStars(elapsed);
        this.controls.update();
        this.renderer.render(this.scene, this.camera);

        if (onFrame) {
          onFrame(this.renderer.domElement);
        }

        if (elapsed < fullDuration) {
          requestAnimationFrame(replayLoop);
        } else {
          this.particleSystem.clearAll();
          resolve();
        }
      };

      this.clock.getDelta();
      requestAnimationFrame(replayLoop);
    });
  }

  private async startExport(): Promise<void> {
    const strokes = this.particleSystem.getStrokes();
    if (strokes.length === 0) return;

    this.isReplaying = true;
    this.isRecording = true;
    this.drawingTool.setEnabled(false);
    this.setButtonsDisabled(true);

    const exportBtn = document.getElementById('btn-export')!;
    exportBtn.textContent = '录制中...';

    try {
      const { default: GIF } = await import('gif.js');

      const workerBlob = new Blob(
        [`importScripts('https://cdn.jsdelivr.net/npm/gif.js@0.2.0/dist/gif.worker.js')`],
        { type: 'application/javascript' }
      );
      const workerUrl = URL.createObjectURL(workerBlob);

      const gif = new GIF({
        workers: 2,
        quality: 10,
        width: 800,
        height: 600,
        workerScript: workerUrl,
      });

      const frameInterval = 1000 / 15;
      let lastFrameTime = 0;

      await this.performReplay(strokes, (canvas) => {
        const now = performance.now();
        if (now - lastFrameTime >= frameInterval) {
          lastFrameTime = now;

          const tmpCanvas = document.createElement('canvas');
          tmpCanvas.width = 800;
          tmpCanvas.height = 600;
          const ctx = tmpCanvas.getContext('2d')!;

          const grd = ctx.createRadialGradient(400, 300, 0, 400, 300, 500);
          grd.addColorStop(0, '#1a1a3e');
          grd.addColorStop(1, '#0a0a2e');
          ctx.fillStyle = grd;
          ctx.fillRect(0, 0, 800, 600);

          ctx.drawImage(canvas, 0, 0, 800, 600);
          gif.addFrame(tmpCanvas, { delay: Math.round(frameInterval), copy: true });
        }
      });

      gif.on('finished', (blob: Blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'sand-art.gif';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        URL.revokeObjectURL(workerUrl);

        exportBtn.textContent = '导出GIF';
        this.isRecording = false;
        this.isReplaying = false;
        this.drawingTool.setEnabled(true);
        this.setButtonsDisabled(false);
      });

      gif.render();
    } catch {
      exportBtn.textContent = '导出GIF';
      this.isRecording = false;
      this.isReplaying = false;
      this.drawingTool.setEnabled(true);
      this.setButtonsDisabled(false);
    }
  }

  private setButtonsDisabled(disabled: boolean): void {
    const ids = ['btn-undo', 'btn-replay', 'btn-export'];
    ids.forEach((id) => {
      const btn = document.getElementById(id) as HTMLButtonElement;
      if (btn) btn.disabled = disabled;
    });
  }

  private onResize(): void {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }

  private animate(): void {
    requestAnimationFrame(this.animate.bind(this));

    if (this.isReplaying) return;

    const delta = this.clock.getDelta();
    const elapsed = this.clock.getElapsedTime();

    this.particleSystem.update(delta);
    this.updateStars(elapsed);
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }
}

new SandArtApp();
