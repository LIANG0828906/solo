import * as THREE from 'three';
import { River } from './river';
import { Raft } from './raft';
import { Vegetation } from './vegetation';
import { Interaction } from './interaction';

class Game {
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private river: River;
  private raft: Raft;
  private vegetation: Vegetation;
  private interaction: Interaction;
  private clock: THREE.Clock;
  private startTime: number = 0;
  private isRunning: boolean = false;
  private isFinished: boolean = false;
  private checkpointTimers: Map<number, number> = new Map();
  private fog: THREE.Fog;

  constructor() {
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 0.9;

    const container = document.getElementById('canvas-container');
    if (container) {
      container.appendChild(this.renderer.domElement);
    }

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xD4E6F1);
    this.fog = new THREE.Fog(0xD4E6F1, 30, 150);
    this.scene.fog = this.fog;

    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 300);

    this.river = new River(this.scene);
    this.raft = new Raft(this.river, this.scene);
    this.vegetation = new Vegetation(this.river);
    this.scene.add(this.vegetation.group);

    this.setupLighting();
    this.setupSkybox();

    this.interaction = new Interaction(this.raft);
    this.interaction.onPole(this.onPole.bind(this));
    this.interaction.onReset(this.onReset.bind(this));
    this.interaction.onVortexEscape(this.onVortexEscape.bind(this));

    this.setupWindSlider();

    this.clock = new THREE.Clock();

    window.addEventListener('resize', this.onResize.bind(this));

    this.hideLoading();
    this.start();
  }

  private setupLighting(): void {
    const ambient = new THREE.AmbientLight(0xB0C4DE, 0.6);
    this.scene.add(ambient);

    const sun = new THREE.DirectionalLight(0xFFF8DC, 1.0);
    sun.position.set(20, 40, -10);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.near = 0.5;
    sun.shadow.camera.far = 200;
    sun.shadow.camera.left = -50;
    sun.shadow.camera.right = 50;
    sun.shadow.camera.top = 50;
    sun.shadow.camera.bottom = -50;
    this.scene.add(sun);

    const hemi = new THREE.HemisphereLight(0xD4E6F1, 0x6B5B4F, 0.3);
    this.scene.add(hemi);
  }

  private setupSkybox(): void {
    const skyGeo = new THREE.SphereGeometry(200, 32, 15);
    const skyMat = new THREE.ShaderMaterial({
      uniforms: {
        uTopColor: { value: new THREE.Color(0x87CEEB) },
        uBottomColor: { value: new THREE.Color(0xD4E6F1) },
        uOffset: { value: 0.4 },
        uExponent: { value: 0.6 }
      },
      vertexShader: `
        varying vec3 vWorldPosition;
        void main() {
          vec4 worldPos = modelMatrix * vec4(position, 1.0);
          vWorldPosition = worldPos.xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 uTopColor;
        uniform vec3 uBottomColor;
        uniform float uOffset;
        uniform float uExponent;
        varying vec3 vWorldPosition;
        void main() {
          float h = normalize(vWorldPosition).y + uOffset;
          gl_FragColor = vec4(mix(uBottomColor, uTopColor, max(pow(max(h, 0.0), uExponent), 0.0)), 1.0);
        }
      `,
      side: THREE.BackSide
    });
    this.scene.add(new THREE.Mesh(skyGeo, skyMat));
  }

  private setupWindSlider(): void {
    const slider = document.getElementById('wind-slider') as HTMLInputElement;
    const windValue = document.getElementById('wind-value');
    if (slider) {
      slider.addEventListener('input', () => {
        const val = parseInt(slider.value);
        if (windValue) windValue.textContent = String(val);
        this.vegetation.setWindSpeed(val);
      });
    }
  }

  private hideLoading(): void {
    const loading = document.getElementById('loading');
    if (loading) {
      loading.style.transition = 'opacity 1s ease';
      loading.style.opacity = '0';
      setTimeout(() => { loading.style.display = 'none'; }, 1000);
    }
  }

  private onPole(angle: number, force: number): void {
    if (!this.isRunning) {
      this.isRunning = true;
      this.startTime = performance.now();
    }
  }

  private onReset(): void {
    this.raft.reset();
    this.isRunning = false;
    this.isFinished = false;
    this.startTime = 0;
    this.checkpointTimers.clear();

    this.river.checkpoints.forEach(cp => {
      cp.passed = false;
      cp.passTime = 0;
    });

    const checkpointDisplay = document.getElementById('checkpoint-display');
    if (checkpointDisplay) checkpointDisplay.innerHTML = '';

    const finishScroll = document.getElementById('finish-scroll');
    if (finishScroll) finishScroll.style.display = 'none';
  }

  private onVortexEscape(reverse: boolean): void {
    this.raft.tryEscapeVortex(reverse);
  }

  private updateCamera(): void {
    const raftPos = this.raft.state.position.clone();
    const tangent = this.river.getTangentAtT(this.raft.state.currentT);
    const cameraOffset = tangent.clone().multiplyScalar(5);
    const upOffset = new THREE.Vector3(0, 3, 0);

    const targetCamPos = raftPos.add(upOffset).sub(cameraOffset);
    this.camera.position.lerp(targetCamPos, 0.05);

    const lookTarget = this.raft.state.position.clone().add(tangent.clone().multiplyScalar(10)).add(new THREE.Vector3(0, 0.5, 0));
    this.camera.lookAt(lookTarget);
  }

  private checkCheckpoints(): void {
    const raftPos = this.raft.state.position;
    this.river.checkpoints.forEach((cp, index) => {
      if (cp.passed) return;
      const dist = raftPos.distanceTo(cp.position);
      if (dist < 8) {
        cp.passed = true;
        cp.passTime = this.isRunning ? (performance.now() - this.startTime) / 1000 : 0;
        this.showCheckpoint(cp);
      }
    });
  }

  private showCheckpoint(cp: { label: string }): void {
    const display = document.getElementById('checkpoint-display');
    if (!display) return;

    const stele = document.createElement('div');
    stele.className = 'checkpoint-stele';
    stele.textContent = cp.label;
    display.innerHTML = '';
    display.appendChild(stele);

    setTimeout(() => {
      if (display.contains(stele)) {
        display.removeChild(stele);
      }
    }, 1200);
  }

  private checkFinish(): void {
    if (this.isFinished) return;
    if (this.raft.state.currentT >= 0.95) {
      this.isFinished = true;
      this.showFinishScreen();
    }
  }

  private showFinishScreen(): void {
    const totalTime = this.isRunning ? ((performance.now() - this.startTime) / 1000).toFixed(1) + '秒' : '--';
    const finishScroll = document.getElementById('finish-scroll');
    if (!finishScroll) return;

    const finTime = document.getElementById('fin-time');
    const finCollisions = document.getElementById('fin-collisions');
    const finPoles = document.getElementById('fin-poles');
    const finDistance = document.getElementById('fin-distance');

    if (finTime) finTime.textContent = totalTime;
    if (finCollisions) finCollisions.textContent = String(this.raft.state.collisionCount);
    if (finPoles) finPoles.textContent = String(this.raft.state.poleCount);
    if (finDistance) finDistance.textContent = this.raft.getDistance() + '里';

    finishScroll.style.display = 'block';
  }

  private onResize(): void {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  private start(): void {
    this.clock.start();
    this.animate();
  }

  private animate = (): void => {
    requestAnimationFrame(this.animate);

    const delta = Math.min(this.clock.getDelta(), 0.05);
    const time = this.clock.getElapsedTime();

    this.river.update(time);
    this.raft.update(delta, time);
    this.vegetation.update(time);
    this.interaction.update(delta);

    this.updateCamera();
    this.checkCheckpoints();
    this.checkFinish();

    this.renderer.render(this.scene, this.camera);
  };
}

new Game();
