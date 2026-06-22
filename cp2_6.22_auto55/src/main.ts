import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EnvParams } from './types';
import { SceneInitializer } from './SceneInitializer';
import { CoralGenerator } from './CoralGenerator';
import { FishSchool } from './FishSchool';
import { ControlPanel } from './ControlPanel';

type FishPart = 'body' | 'tail' | 'eye' | 'fin';

class App {
  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private controls!: OrbitControls;
  private sceneInit!: SceneInitializer;
  private coralGen!: CoralGenerator;
  private fishSchool!: FishSchool;
  private controlPanel!: ControlPanel;
  private clock = new THREE.Clock();
  private raycaster = new THREE.Raycaster();
  private pointer = new THREE.Vector2();
  private rendererSize = new THREE.Vector2();
  private fishClickables: THREE.Object3D[] = [];
  private fishMeshToIndexMap: Map<THREE.Object3D, { index: number; part: FishPart }> = new Map();
  private readonly DEFAULT_PARAMS: EnvParams = {
    currentSpeed: 2.0,
    lightIntensity: 60,
    nutrientLevel: 55,
    terrainAmplitude: 1.0,
    terrainFrequency: 1.0,
  };
  private smoothedParams: EnvParams = { ...this.DEFAULT_PARAMS };

  constructor() {
    this.init();
  }

  private init(): void {
    const container = document.getElementById('canvas-container')!;

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    container.appendChild(this.renderer.domElement);
    this.renderer.getSize(this.rendererSize);

    this.scene = new THREE.Scene();

    this.camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      400,
    );
    this.camera.position.set(18, 12, 22);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.07;
    this.controls.minDistance = 6;
    this.controls.maxDistance = 90;
    this.controls.maxPolarAngle = Math.PI * 0.48;
    this.controls.target.set(0, 2.5, 0);

    this.sceneInit = new SceneInitializer(this.scene);
    this.sceneInit.init();

    this.coralGen = new CoralGenerator(this.scene, this.sceneInit, 95);
    const corals = this.coralGen.generate();

    this.fishSchool = new FishSchool(this.scene, 80, corals);
    this.fishClickables = [];
    this.fishMeshToIndexMap.clear();
    this.fishSchool.fishes.forEach((f, fishIdx) => {
      f.mesh.traverse((child) => {
        this.fishClickables.push(child);
        let part: FishPart = 'body';
        if (child.name === 'tail') {
          part = 'tail';
        } else {
          const mesh = child as THREE.Mesh;
          if (mesh.isMesh) {
            const mat = mesh.material;
            if (mat instanceof THREE.MeshBasicMaterial) {
              part = 'eye';
            } else if (mesh.geometry instanceof THREE.ConeGeometry) {
              part = 'fin';
            }
          }
        }
        this.fishMeshToIndexMap.set(child, { index: fishIdx, part });
      });
    });

    this.controlPanel = new ControlPanel({
      onParamsChange: (p) => {
        this.DEFAULT_PARAMS.currentSpeed = p.currentSpeed;
        this.DEFAULT_PARAMS.lightIntensity = p.lightIntensity;
        this.DEFAULT_PARAMS.nutrientLevel = p.nutrientLevel;
        this.DEFAULT_PARAMS.terrainAmplitude = p.terrainAmplitude;
        this.DEFAULT_PARAMS.terrainFrequency = p.terrainFrequency;
      },
    });

    window.addEventListener('resize', this.onResize.bind(this));
    window.addEventListener('pointerdown', this.onPointerDown.bind(this));

    setTimeout(() => {
      const ld = document.getElementById('loading');
      if (ld) ld.classList.add('hidden');
    }, 1600);

    this.animate();
  }

  private onResize(): void {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.getSize(this.rendererSize);
  }

  private onPointerDown(event: PointerEvent): void {
    const width = this.rendererSize.x;
    const height = this.rendererSize.y;
    this.pointer.x = (event.clientX / width) * 2 - 1;
    this.pointer.y = -(event.clientY / height) * 2 + 1;
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const intersects = this.raycaster.intersectObjects(this.fishClickables, true);
    if (intersects.length === 0) return;

    intersects.sort((a, b) => a.distance - b.distance);

    const fishBestScore = new Map<number, { score: number; intersect: THREE.Intersection }>();

    for (const intersect of intersects) {
      const info = this.fishMeshToIndexMap.get(intersect.object);
      if (!info) continue;

      const { index, part } = info;
      const penalty = part === 'tail' ? 15 : part === 'fin' ? 8 : part === 'eye' ? 3 : 0;
      const score = intersect.distance * 1.0 + penalty;

      const existing = fishBestScore.get(index);
      if (!existing || score < existing.score) {
        fishBestScore.set(index, { score, intersect });
      }
    }

    let bestFishIdx = -1;
    let bestIntersect: THREE.Intersection | null = null;
    let minScore = Infinity;
    for (const [fishIdx, data] of fishBestScore) {
      if (data.score < minScore) {
        minScore = data.score;
        bestFishIdx = fishIdx;
        bestIntersect = data.intersect;
      }
    }

    if (bestFishIdx >= 0 && bestIntersect) {
      this.fishSchool.handleClick(bestIntersect);
    }
  }

  private smoothParams(dt: number): void {
    const lerpFactor = Math.min(1, dt * 2.2);
    this.smoothedParams.currentSpeed = THREE.MathUtils.lerp(
      this.smoothedParams.currentSpeed,
      this.DEFAULT_PARAMS.currentSpeed,
      lerpFactor,
    );
    this.smoothedParams.lightIntensity = THREE.MathUtils.lerp(
      this.smoothedParams.lightIntensity,
      this.DEFAULT_PARAMS.lightIntensity,
      lerpFactor,
    );
    this.smoothedParams.nutrientLevel = THREE.MathUtils.lerp(
      this.smoothedParams.nutrientLevel,
      this.DEFAULT_PARAMS.nutrientLevel,
      lerpFactor,
    );
    this.smoothedParams.terrainAmplitude = THREE.MathUtils.lerp(
      this.smoothedParams.terrainAmplitude ?? 1.0,
      this.DEFAULT_PARAMS.terrainAmplitude ?? 1.0,
      lerpFactor,
    );
    this.smoothedParams.terrainFrequency = THREE.MathUtils.lerp(
      this.smoothedParams.terrainFrequency ?? 1.0,
      this.DEFAULT_PARAMS.terrainFrequency ?? 1.0,
      lerpFactor,
    );
  }

  private animate(): void {
    requestAnimationFrame(() => this.animate());
    const dt = Math.min(0.05, this.clock.getDelta());
    const time = this.clock.elapsedTime;

    this.smoothParams(dt);
    const p = this.smoothedParams;

    this.controls.update();
    this.sceneInit.updateTerrainFromParams(p);
    this.sceneInit.updateParticles(time, p.currentSpeed);
    this.sceneInit.updateLighting(p);
    this.coralGen.update(time, p);
    this.fishSchool.update(time, dt, p);
    this.controlPanel.updateScore(dt);
    this.controlPanel.setFPS(1 / dt);
    this.controlPanel.updateInfoPanel(
      this.fishSchool.activeRegionInfo,
      this.camera,
      this.rendererSize,
    );
    this.renderer.render(this.scene, this.camera);
  }
}

new App();
