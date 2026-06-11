import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { PapermakingProcess, PapermakingStep } from './papermaking';
import { UIController } from './ui';

class App {
  private container: HTMLElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private controls: OrbitControls;
  private clock: THREE.Clock;

  private process: PapermakingProcess;
  private ui: UIController;

  private fpsFrames: number = 0;
  private fpsAccum: number = 0;
  private fpsSmoothed: number = 60;

  constructor() {
    const container = document.getElementById('scene-container');
    if (!container) throw new Error('#scene-container not found');
    this.container = container;

    this.clock = new THREE.Clock();
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xe8e0d0);
    this.scene.fog = new THREE.Fog(0xe8e0d0, 12, 35);

    this.camera = new THREE.PerspectiveCamera(
      50, container.clientWidth / container.clientHeight, 0.1, 200
    );
    this.camera.position.set(0, 4.2, 9.5);
    this.camera.lookAt(0, 1.6, 0);

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      preserveDrawingBuffer: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    container.appendChild(this.renderer.domElement);

    this.setupLights();

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.target.set(0, 1.6, 0);
    this.controls.minDistance = 4;
    this.controls.maxDistance = 22;
    this.controls.minPolarAngle = 0.2;
    this.controls.maxPolarAngle = Math.PI / 2 + 0.1;
    this.controls.mouseButtons = {
      LEFT: THREE.MOUSE.ROTATE,
      MIDDLE: THREE.MOUSE.DOLLY,
      RIGHT: THREE.MOUSE.PAN,
    };
    this.controls.update();

    this.process = new PapermakingProcess(this.scene);

    this.ui = new UIController();
    this.ui.bindProcess(this.process);
    this.bindProcessCallbacks();
    this.ui.updateStepState(this.process.getCurrentStep(), this.process.getCompletedSteps());
    this.ui.updateQuality(this.process.getQuality());

    window.addEventListener('resize', this.onResize.bind(this));

    this.animate();
  }

  private setupLights(): void {
    const ambient = new THREE.AmbientLight(0xfff5e1, 0.55);
    this.scene.add(ambient);

    const hemi = new THREE.HemisphereLight(0xfff2d6, 0xd4b896, 0.35);
    this.scene.add(hemi);

    const sun = new THREE.DirectionalLight(0xfff1d0, 1.1);
    sun.position.set(6, 10, 6);
    sun.castShadow = true;
    sun.shadow.mapSize.width = 2048;
    sun.shadow.mapSize.height = 2048;
    sun.shadow.camera.near = 0.5;
    sun.shadow.camera.far = 40;
    sun.shadow.camera.left = -10;
    sun.shadow.camera.right = 10;
    sun.shadow.camera.top = 10;
    sun.shadow.camera.bottom = -10;
    sun.shadow.bias = -0.0005;
    this.scene.add(sun);

    const fill = new THREE.DirectionalLight(0xe0eaf5, 0.3);
    fill.position.set(-6, 6, -4);
    this.scene.add(fill);

    const accent = new THREE.PointLight(0xffc880, 0.4, 20, 1.8);
    accent.position.set(0, 5, 3);
    this.scene.add(accent);
  }

  private bindProcessCallbacks(): void {
    this.ui.onParamChange((params) => {
      this.process.setParams(params);
      if (!this.process.isStepRunning()) {
        this.ui.updateQuality(this.process.getQuality());
      }
    });

    this.ui.onStepClick((step) => {
      if (this.process.isStepRunning()) return;
      const completed = this.process.getCompletedSteps();
      const current = this.process.getCurrentStep();
      if (step === current) return;
      if (step > current && step !== (current + 1) && !completed.includes(current)) {
        this.ui.showTemporaryMsg('请按顺序完成前置工序');
        return;
      }
      if (!completed.includes(step) && step > current) return;
      this.ui.runTransition(() => {
        this.process.jumpToStep(step);
        this.ui.updateStepState(this.process.getCurrentStep(), this.process.getCompletedSteps());
        this.ui.updateProgress(0);
        this.ui.updateQuality(this.process.getQuality());
      });
    });

    this.ui.onStartClick(() => {
      if (this.process.isStepRunning()) return;
      this.process.startStep();
      this.ui.updateStartButtonState(true);
    });

    this.process.onStepComplete((step) => {
      this.ui.updateProgress(1);
      this.ui.updateQuality(this.process.getQuality());

      const nextStep = (step + 1) as PapermakingStep;
      if (nextStep <= PapermakingStep.DRYING) {
        this.ui.showTemporaryMsg(`${PapermakingProcess.getStepName(step)} · 完成`);
        window.setTimeout(() => {
          this.ui.runTransition(() => {
            this.process.jumpToStep(nextStep);
            this.ui.updateStepState(this.process.getCurrentStep(), this.process.getCompletedSteps());
            this.ui.updateProgress(0);
            this.ui.updateQuality(this.process.getQuality());
          });
        }, 900);
      } else {
        this.ui.showTemporaryMsg('造纸完成 · 成品已呈现', 2500);
        this.ui.updateStepState(this.process.getCurrentStep(), this.process.getCompletedSteps());
      }
    });

    this.process.onProgress((_step, progress) => {
      this.ui.updateProgress(progress);
    });

    this.ui.onScreenshot(() => {
      try {
        this.renderer.render(this.scene, this.camera);
        const dataUrl = this.renderer.domElement.toDataURL('image/png');
        const a = document.createElement('a');
        const ts = new Date();
        const pad = (n: number) => String(n).padStart(2, '0');
        a.download = `papermaking_${ts.getFullYear()}${pad(ts.getMonth() + 1)}${pad(ts.getDate())}_${pad(ts.getHours())}${pad(ts.getMinutes())}${pad(ts.getSeconds())}.png`;
        a.href = dataUrl;
        document.body.appendChild(a);
        a.click();
        a.remove();
        this.ui.showTemporaryMsg('截图已保存');
      } catch (e) {
        console.error(e);
        this.ui.showTemporaryMsg('截图失败');
      }
    });
  }

  private onResize(): void {
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }

  private animate = (): void => {
    requestAnimationFrame(this.animate);
    const delta = Math.min(this.clock.getDelta(), 0.05);

    this.process.update(delta);
    this.controls.update();

    if (!this.process.isStepRunning()) {
      this.ui.updateProgress(this.process.getProgress());
    }

    this.renderer.render(this.scene, this.camera);

    this.fpsFrames++;
    this.fpsAccum += delta;
    if (this.fpsAccum >= 0.5) {
      const inst = this.fpsFrames / this.fpsAccum;
      this.fpsSmoothed = this.fpsSmoothed * 0.7 + inst * 0.3;
      this.ui.updateFPS(this.fpsSmoothed);
      this.fpsFrames = 0;
      this.fpsAccum = 0;
    }
  }

  dispose(): void {
    this.process.dispose();
    this.renderer.dispose();
    this.controls.dispose();
    window.removeEventListener('resize', this.onResize.bind(this));
  }
}

window.addEventListener('DOMContentLoaded', () => {
  try {
    (window as unknown as { __app?: App }).__app = new App();
  } catch (e) {
    console.error('App init failed:', e);
  }
});
