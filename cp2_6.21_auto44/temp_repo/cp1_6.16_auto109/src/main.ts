import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Virus, InvasionPhase, PHASE_NAMES, SpikeData } from './virus';
import { Membrane } from './membrane';
import { Controls, CAMERA_VIEWS } from './controls';

class App {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private orbitControls: OrbitControls;
  private virus: Virus;
  private membrane: Membrane;
  private controls: Controls;
  private container: HTMLElement;
  private raycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;
  private dragging = false;
  private dragStartPos = new THREE.Vector3();
  private dragPlane: THREE.Plane;
  private selectedSpike: SpikeData | null = null;
  private spikeLabel: HTMLElement;
  private timeScale = 1;
  private slowMotionScale = 0.2;
  private inSlowMotion = false;
  private clock: THREE.Clock;
  private cameraTarget = new THREE.Vector3(0, 0, 0);
  private baseSpeed = 1;

  constructor() {
    this.container = document.getElementById('app')!;
    this.scene = new THREE.Scene();

    this.camera = new THREE.PerspectiveCamera(
      50,
      this.container.clientWidth / this.container.clientHeight,
      0.1,
      100
    );
    this.camera.position.copy(CAMERA_VIEWS.default.position);
    this.cameraTarget.copy(CAMERA_VIEWS.default.target);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.setClearColor(0x000000, 0);
    this.container.insertBefore(this.renderer.domElement, this.container.firstChild);

    this.orbitControls = new OrbitControls(this.camera, this.renderer.domElement);
    this.orbitControls.target.copy(this.cameraTarget);
    this.orbitControls.enableDamping = true;
    this.orbitControls.dampingFactor = 0.08;
    this.orbitControls.minDistance = 3;
    this.orbitControls.maxDistance = 18;

    this.setupLights();

    const membraneWidth = 10;
    const membraneHeight = 6;
    this.membrane = new Membrane(this.scene, membraneWidth, membraneHeight);
    this.virus = new Virus(this.scene, new THREE.Vector3(-2.5, 0, 0));

    this.controls = new Controls(this.container, {
      onReset: () => this.resetAll(),
      onSpeedChange: (speed) => { this.baseSpeed = speed; this.updateEffectiveSpeed(); },
      onViewChange: (view) => {
        const preset = CAMERA_VIEWS[view];
        this.controls.startCameraTransition(
          this.camera.position.clone(),
          this.orbitControls.target.clone(),
          preset.position,
          preset.target
        );
      },
      onToggleSlowMotion: () => {
        this.inSlowMotion = !this.inSlowMotion;
        this.controls.setSlowMotion(this.inSlowMotion);
        this.updateEffectiveSpeed();
      },
      onStepFrame: (dir) => this.stepFrame(dir * 0.1)
    });

    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.dragPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

    this.spikeLabel = document.getElementById('spike-label')!;

    this.clock = new THREE.Clock();
    this.bindEvents();

    window.addEventListener('resize', () => this.onResize());
    this.animate();
  }

  private setupLights(): void {
    const ambient = new THREE.AmbientLight(0x404060, 0.6);
    this.scene.add(ambient);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.9);
    dirLight.position.set(5, 8, 5);
    dirLight.castShadow = true;
    this.scene.add(dirLight);

    const blueLight = new THREE.PointLight(0x0088ff, 0.6, 20);
    blueLight.position.set(-4, 3, -3);
    this.scene.add(blueLight);

    const purpleLight = new THREE.PointLight(0x8844ff, 0.5, 20);
    purpleLight.position.set(4, 2, 3);
    this.scene.add(purpleLight);
  }

  private bindEvents(): void {
    const canvas = this.renderer.domElement;

    canvas.addEventListener('pointerdown', (e) => this.onPointerDown(e));
    canvas.addEventListener('pointermove', (e) => this.onPointerMove(e));
    canvas.addEventListener('pointerup', () => this.onPointerUp());
    canvas.addEventListener('pointerleave', () => this.onPointerUp());

    canvas.addEventListener('click', (e) => this.onClick(e));
  }

  private updateMouse(e: PointerEvent | MouseEvent): void {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
  }

  private onPointerDown(e: PointerEvent): void {
    this.updateMouse(e);
    this.raycaster.setFromCamera(this.mouse, this.camera);

    const intersects = this.raycaster.intersectObject(this.virus.group, true);
    if (intersects.length > 0 && this.virus.phase === InvasionPhase.IDLE) {
      this.dragging = true;
      this.orbitControls.enabled = false;

      const intersectPoint = intersects[0].point;
      this.dragStartPos.copy(this.virus.group.position);

      const normal = new THREE.Vector3();
      this.camera.getWorldDirection(normal);
      this.dragPlane.setFromNormalAndCoplanarPoint(normal, intersectPoint);

      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    }
  }

  private onPointerMove(e: PointerEvent): void {
    this.updateMouse(e);
    this.raycaster.setFromCamera(this.mouse, this.camera);

    if (this.dragging && this.virus.phase === InvasionPhase.IDLE) {
      const intersectPoint = new THREE.Vector3();
      if (this.raycaster.ray.intersectPlane(this.dragPlane, intersectPoint)) {
        this.virus.group.position.x = THREE.MathUtils.clamp(intersectPoint.x, -8, 8);
        this.virus.group.position.y = THREE.MathUtils.clamp(intersectPoint.y, -3, 5);
        this.virus.group.position.z = THREE.MathUtils.clamp(intersectPoint.z, -5, 5);
      }
    }

    if (this.selectedSpike) {
      this.updateSpikeLabelPosition();
    }
  }

  private onPointerUp(): void {
    if (this.dragging && this.virus.phase === InvasionPhase.IDLE) {
      this.dragging = false;
      this.orbitControls.enabled = true;

      const distToMembrane = Math.abs(this.virus.group.position.y - 0.3);
      if (distToMembrane < 1.8 && this.virus.group.position.y > 0.2) {
        const receptors = this.membrane.getClosestReceptors(this.virus.group.position, 3);
        this.virus.startInvasion(0.3, receptors);
        const center = receptors[0].clone();
        this.membrane.startDepression(new THREE.Vector3(center.x, 0, center.z), 0.3);
      }
    }
  }

  private onClick(e: MouseEvent): void {
    if (this.dragging) return;
    this.updateMouse(e);
    this.raycaster.setFromCamera(this.mouse, this.camera);

    const intersects = this.raycaster.intersectObject(this.virus.group, true);
    const spike = this.virus.getSpikeAt(intersects);
    if (spike) {
      this.selectedSpike = spike;
      this.showSpikeLabel(spike);
    } else {
      this.selectedSpike = null;
      this.spikeLabel.style.display = 'none';
    }
  }

  private showSpikeLabel(spike: SpikeData): void {
    const aff = (spike.info.affinity * 100).toFixed(0);
    this.spikeLabel.innerHTML = `
      <div class="label-title">刺突糖蛋白 #${spike.info.id + 1}</div>
      <div class="label-row">类型: ${spike.info.type} 亚基</div>
      <div class="label-row">受体亲和度: ${aff}%</div>
    `;
    this.spikeLabel.style.display = 'block';
    this.updateSpikeLabelPosition();
  }

  private updateSpikeLabelPosition(): void {
    if (!this.selectedSpike) return;
    const worldPos = new THREE.Vector3();
    this.selectedSpike.group.getWorldPosition(worldPos);
    const projected = worldPos.project(this.camera);

    const rect = this.container.getBoundingClientRect();
    const x = (projected.x * 0.5 + 0.5) * rect.width;
    const y = (-projected.y * 0.5 + 0.5) * rect.height;

    this.spikeLabel.style.left = (x + 15) + 'px';
    this.spikeLabel.style.top = (y - 20) + 'px';
  }

  private onResize(): void {
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }

  private updateEffectiveSpeed(): void {
    this.timeScale = this.inSlowMotion ? this.baseSpeed * this.slowMotionScale : this.baseSpeed;
  }

  private stepFrame(seconds: number): void {
    if (this.virus.phase === InvasionPhase.IDLE || this.virus.phase === InvasionPhase.COMPLETE) {
      return;
    }
    this.virus.update(Math.abs(seconds), seconds > 0 ? 1 : -1);
    const isMembranePhase = this.virus.phase === InvasionPhase.MEMBRANE_DEPRESSION ||
                            this.virus.phase === InvasionPhase.ENDOCYTOSIS;
    this.membrane.update(Math.abs(seconds), seconds > 0 ? 1 : -1, isMembranePhase);
    this.controls.updateProgress(this.virus.totalProgress);
    this.controls.updatePhaseLabel(PHASE_NAMES[this.virus.phase]);
  }

  private resetAll(): void {
    this.virus.reset();
    this.membrane.reset();
    this.selectedSpike = null;
    this.spikeLabel.style.display = 'none';
    this.inSlowMotion = false;
    this.controls.setSlowMotion(false);
    this.baseSpeed = 1;
    this.controls.resetUI();
    this.updateEffectiveSpeed();

    this.camera.position.copy(CAMERA_VIEWS.default.position);
    this.orbitControls.target.copy(CAMERA_VIEWS.default.target);
    this.cameraTarget.copy(CAMERA_VIEWS.default.target);
  }

  private animate = (): void => {
    requestAnimationFrame(this.animate);

    const delta = Math.min(this.clock.getDelta(), 0.1);

    this.controls.updateCameraTransition(delta, this.camera, this.cameraTarget);
    this.orbitControls.target.lerp(this.cameraTarget, 0.2);

    const transitioning = this.controls['cameraTransitionActive'];
    if (!transitioning) {
      this.orbitControls.update();
    }

    this.virus.update(delta, this.timeScale);

    const isMembranePhase = this.virus.phase === InvasionPhase.MEMBRANE_DEPRESSION ||
                            this.virus.phase === InvasionPhase.ENDOCYTOSIS;
    this.membrane.update(delta, this.timeScale, isMembranePhase);

    if (this.virus.phase !== InvasionPhase.IDLE) {
      this.controls.updateProgress(this.virus.totalProgress);
    }
    this.controls.updatePhaseLabel(PHASE_NAMES[this.virus.phase]);

    if (this.selectedSpike) {
      this.updateSpikeLabelPosition();
    }

    this.renderer.render(this.scene, this.camera);
  };
}

new App();
