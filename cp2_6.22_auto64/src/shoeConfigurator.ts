import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { ShoeConfig, PartName, MaterialType, DEFAULT_CONFIG } from './types';
import {
  hexToThreeColor,
  getMaterialPreset,
  createDecalTexture,
  easeInOutCubic,
  generateSuedeBumpMap,
  generateMeshAlphaMap,
  lerpColor,
} from './utils';

interface PartMeshes {
  upper: THREE.Mesh[];
  sole: THREE.Mesh[];
  lace: THREE.Mesh[];
  logo: THREE.Mesh[];
}

interface DecalInfo {
  mesh: THREE.Mesh;
  side: 'left' | 'right';
}

interface TransitionState {
  active: boolean;
  partName: PartName;
  fromColor: THREE.Color;
  toColor: THREE.Color;
  fromMaterial: MaterialType;
  toMaterial: MaterialType;
  startTime: number;
  duration: number;
}

type ConfigChangeListener = (config: ShoeConfig) => void;

export class ShoeConfigurator {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private controls: OrbitControls;
  private composer: EffectComposer;
  private currentModel: THREE.Group | null = null;
  private partMeshes: PartMeshes = { upper: [], sole: [], lace: [], logo: [] };
  private decalMeshes: DecalInfo[] = [];
  private config: ShoeConfig = { ...DEFAULT_CONFIG };
  private animationId: number = 0;
  private autoRotate: boolean = true;
  private transitions: TransitionState[] = [];
  private decalTexture: THREE.Texture | null = null;
  private container: HTMLElement;
  private clock: THREE.Clock;
  private configChangeListeners: ConfigChangeListener[] = [];

  constructor(container: HTMLElement) {
    this.container = container;
    this.clock = new THREE.Clock();

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x1a1d2e);
    this.scene.fog = new THREE.Fog(0x1a1d2e, 8, 20);

    const aspect = container.clientWidth / container.clientHeight;
    this.camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 100);
    this.camera.position.set(3, 2.5, 4);
    this.camera.lookAt(0, 0.3, 0);

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      preserveDrawingBuffer: true,
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(this.renderer.domElement);

    this.composer = new EffectComposer(this.renderer);
    const renderPass = new RenderPass(this.scene, this.camera);
    this.composer.addPass(renderPass);

    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(container.clientWidth, container.clientHeight),
      0.3,
      0.4,
      0.85
    );
    this.composer.addPass(bloomPass);

    const outputPass = new OutputPass();
    this.composer.addPass(outputPass);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.minDistance = 2;
    this.controls.maxDistance = 10;
    this.controls.maxPolarAngle = Math.PI * 0.85;
    this.controls.minPolarAngle = Math.PI * 0.1;
    this.controls.target.set(0, 0.3, 0);
    this.controls.autoRotate = true;
    this.controls.autoRotateSpeed = 1.5;

    let userInteracting = false;
    let interactionTimeout: ReturnType<typeof setTimeout>;
    this.controls.addEventListener('start', () => {
      userInteracting = true;
      this.autoRotate = false;
      this.controls.autoRotate = false;
      clearTimeout(interactionTimeout);
    });
    this.controls.addEventListener('end', () => {
      interactionTimeout = setTimeout(() => {
        userInteracting = false;
        this.autoRotate = true;
        this.controls.autoRotate = true;
      }, 3000);
    });

    this.setupLights();
    this.setupGround();
    this.switchShoeModel(0);

    this.handleResize = this.handleResize.bind(this);
    window.addEventListener('resize', this.handleResize);
  }

  public addConfigChangeListener(listener: ConfigChangeListener): void {
    this.configChangeListeners.push(listener);
  }

  private notifyConfigChange(): void {
    const config = { ...this.config };
    this.configChangeListeners.forEach((fn) => fn(config));
  }

  private setupLights(): void {
    const ambientLight = new THREE.AmbientLight(0x4466aa, 0.6);
    this.scene.add(ambientLight);

    const mainSpot = new THREE.SpotLight(0xffffff, 30);
    mainSpot.position.set(4, 6, 3);
    mainSpot.angle = Math.PI / 5;
    mainSpot.penumbra = 0.5;
    mainSpot.castShadow = true;
    mainSpot.shadow.mapSize.width = 1024;
    mainSpot.shadow.mapSize.height = 1024;
    this.scene.add(mainSpot);

    const fillSpot = new THREE.SpotLight(0x88aaff, 15);
    fillSpot.position.set(-3, 4, -2);
    fillSpot.angle = Math.PI / 4;
    fillSpot.penumbra = 0.6;
    this.scene.add(fillSpot);

    const rimLight = new THREE.PointLight(0x00d4ff, 5, 10);
    rimLight.position.set(-2, 1, -3);
    this.scene.add(rimLight);

    const bottomFill = new THREE.PointLight(0x334466, 3, 8);
    bottomFill.position.set(0, -1, 2);
    this.scene.add(bottomFill);
  }

  private setupGround(): void {
    const groundGeo = new THREE.CircleGeometry(6, 64);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x151830,
      roughness: 0.8,
      metalness: 0.2,
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.01;
    ground.receiveShadow = true;
    this.scene.add(ground);

    const gridHelper = new THREE.GridHelper(10, 20, 0x222644, 0x1a1e38);
    gridHelper.position.y = 0;
    this.scene.add(gridHelper);
  }

  switchShoeModel(modelId: number): void {
    if (this.currentModel) {
      this.scene.remove(this.currentModel);
      this.currentModel.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose();
          if (child.material instanceof THREE.Material) {
            child.material.dispose();
          }
        }
      });
    }

    this.decalMeshes.forEach((d) => {
      d.mesh.geometry.dispose();
      if (d.mesh.material instanceof THREE.Material) {
        d.mesh.material.dispose();
      }
    });
    this.decalMeshes = [];

    this.partMeshes = { upper: [], sole: [], lace: [], logo: [] };
    this.config.shoeModel = modelId;

    const model = this.buildShoeGeometry(modelId);
    this.currentModel = model;
    this.scene.add(model);

    this.applyFullConfig();

    if (this.config.decalImage) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = this.config.decalImage;
      img.onload = () => {
        this.updateTexture(img);
      };
    }

    this.notifyConfigChange();
  }

  private buildShoeGeometry(modelId: number): THREE.Group {
    const group = new THREE.Group();

    switch (modelId) {
      case 0:
        this.buildRunner(group);
        break;
      case 1:
        this.buildHighTop(group);
        break;
      case 2:
        this.buildSkate(group);
        break;
    }

    return group;
  }

  private createPartMaterial(partName: PartName): THREE.MeshPhysicalMaterial {
    const colorKey = `${partName}Color` as keyof ShoeConfig;
    const materialKey = `${partName}Material` as keyof ShoeConfig;
    const color = hexToThreeColor(this.config[colorKey] as string);
    const materialType = this.config[materialKey] as MaterialType;
    const preset = getMaterialPreset(materialType);

    const matParams: THREE.MeshPhysicalMaterialParameters = {
      ...preset,
      color,
    };

    if (materialType === 'suede') {
      matParams.bumpMap = generateSuedeBumpMap();
      matParams.bumpScale = 0.06;
    }
    if (materialType === 'mesh') {
      matParams.alphaMap = generateMeshAlphaMap();
      matParams.transparent = true;
      matParams.side = THREE.DoubleSide;
    }

    return new THREE.MeshPhysicalMaterial(matParams);
  }

  private buildRunner(group: THREE.Group): void {
    const soleGeo = new THREE.BoxGeometry(2.5, 0.18, 1.1, 12, 2, 6);
    this.modifyVertices(soleGeo, (p) => {
      p.y -= 0.09;
      if (p.x > 0.8) {
        p.y += Math.pow(p.x - 0.8, 2) * 0.4;
      }
      if (p.x < -0.9) {
        p.y += Math.pow(-p.x - 0.9, 2) * 0.3;
      }
      if (p.x < -0.95) {
        p.x += (-p.x - 0.95) * 0.3;
      }
      if (p.x > 1.15) {
        p.x -= (p.x - 1.15) * 0.3;
      }
    });
    const sole = new THREE.Mesh(soleGeo, this.createPartMaterial('sole'));
    sole.castShadow = true;
    sole.receiveShadow = true;
    group.add(sole);
    this.partMeshes.sole.push(sole);

    const midsoleGeo = new THREE.BoxGeometry(2.4, 0.08, 1.05, 12, 2, 6);
    this.modifyVertices(midsoleGeo, (p) => {
      p.y += 0.04;
      if (p.x > 0.8) p.y += Math.pow(p.x - 0.8, 2) * 0.35;
      if (p.x < -0.9) p.y += Math.pow(-p.x - 0.9, 2) * 0.25;
    });
    const midsole = new THREE.Mesh(midsoleGeo, this.createPartMaterial('sole'));
    midsole.castShadow = true;
    group.add(midsole);
    this.partMeshes.sole.push(midsole);

    for (let i = 0; i < 5; i++) {
      const ridgeGeo = new THREE.BoxGeometry(1.0, 0.03, 0.08);
      const ridge = new THREE.Mesh(ridgeGeo, this.createPartMaterial('sole'));
      ridge.position.set(-0.6 + i * 0.3, 0.01, 0.52);
      group.add(ridge);
      this.partMeshes.sole.push(ridge);

      const ridge2 = ridge.clone();
      ridge2.position.z = -0.52;
      group.add(ridge2);
      this.partMeshes.sole.push(ridge2);
    }

    const upperGeo = new THREE.BoxGeometry(2.2, 0.8, 1.0, 10, 6, 6);
    this.modifyVertices(upperGeo, (p) => {
      p.y += 0.4;

      if (p.x < 0) {
        p.y += -p.x * 0.15;
      }
      if (p.x > 0.6) {
        p.y -= (p.x - 0.6) * 0.3;
      }

      if (p.x < -0.8) {
        p.y += (-p.x - 0.8) * 0.5;
        p.x += (-p.x - 0.8) * 0.2;
      }

      if (p.y > 0.7) {
        p.z *= Math.max(0.5, 1.0 - (p.y - 0.7) * 0.5);
        p.x *= Math.max(0.6, 1.0 - (p.y - 0.7) * 0.2);
      }

      if (p.y < -0.1) {
        p.z *= 1.02;
      }

      if (p.x > 1.0) {
        p.x -= (p.x - 1.0) * 0.3;
        p.y += (p.x - 1.0) * 0.1;
      }
    });
    const upper = new THREE.Mesh(upperGeo, this.createPartMaterial('upper'));
    upper.castShadow = true;
    group.add(upper);
    this.partMeshes.upper.push(upper);

    const toeCapGeo = new THREE.SphereGeometry(0.55, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2);
    this.modifyVertices(toeCapGeo, (p) => {
      p.x = p.x * 1.1 + 0.9;
      p.y = p.y * 0.5 + 0.15;
      p.z = p.z * 0.95;
    });
    const toeCap = new THREE.Mesh(toeCapGeo, this.createPartMaterial('upper'));
    toeCap.castShadow = true;
    group.add(toeCap);
    this.partMeshes.upper.push(toeCap);

    const heelCapGeo = new THREE.SphereGeometry(0.5, 16, 10, 0, Math.PI, 0, Math.PI);
    this.modifyVertices(heelCapGeo, (p) => {
      p.x = -p.x * 1.0 - 0.85;
      p.y = p.y * 1.0 + 0.15;
      p.z = p.z * 0.95;
    });
    const heelCap = new THREE.Mesh(heelCapGeo, this.createPartMaterial('upper'));
    heelCap.castShadow = true;
    group.add(heelCap);
    this.partMeshes.upper.push(heelCap);

    const tongueGeo = new THREE.BoxGeometry(0.9, 0.08, 0.9, 8, 2, 6);
    this.modifyVertices(tongueGeo, (p) => {
      p.x *= 1.0;
      p.y += 0.85;
      p.z *= 1.0;
      if (p.x < 0) p.y += (-p.x) * 0.1;
      if (p.x > 0.3) p.y -= (p.x - 0.3) * 0.2;
    });
    const tongue = new THREE.Mesh(tongueGeo, this.createPartMaterial('upper'));
    tongue.castShadow = true;
    tongue.position.x = -0.15;
    group.add(tongue);
    this.partMeshes.upper.push(tongue);

    const collarGeo = new THREE.TorusGeometry(0.42, 0.06, 8, 20, Math.PI);
    this.modifyVertices(collarGeo, (p) => {
      const t = p.x;
      p.x = -0.85 + Math.cos(t) * 0.42;
      p.y = 0.85 + Math.sin(t) * 0.42;
      p.z = p.z;
    });
    const collar = new THREE.Mesh(collarGeo, this.createPartMaterial('upper'));
    collar.castShadow = true;
    group.add(collar);
    this.partMeshes.upper.push(collar);

    for (let i = 0; i < 4; i++) {
      const eyeletGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.05, 12);
      const eyeletL = new THREE.Mesh(eyeletGeo, this.createPartMaterial('logo'));
      eyeletL.rotation.x = Math.PI / 2;
      eyeletL.position.set(-0.1 + i * 0.22, 0.85, 0.48);
      group.add(eyeletL);
      this.partMeshes.logo.push(eyeletL);

      const eyeletR = eyeletL.clone();
      eyeletR.position.z = -0.48;
      group.add(eyeletR);
      this.partMeshes.logo.push(eyeletR);
    }

    for (let i = 0; i < 4; i++) {
      const laceGeo = new THREE.BoxGeometry(0.05, 0.03, 0.95);
      const lace = new THREE.Mesh(laceGeo, this.createPartMaterial('lace'));
      lace.position.set(-0.1 + i * 0.22, 0.88, 0);
      if (i % 2 === 0) {
        lace.rotation.y = 0.15;
      } else {
        lace.rotation.y = -0.15;
      }
      group.add(lace);
      this.partMeshes.lace.push(lace);
    }

    const swooshGeo = new THREE.BoxGeometry(0.9, 0.08, 0.025, 12, 3, 2);
    this.modifyVertices(swooshGeo, (p) => {
      const curve = Math.sin(p.x * 2.0) * 0.15;
      p.y += curve;
      if (Math.abs(p.x) > 0.4) {
        p.y *= 1.0 - (Math.abs(p.x) - 0.4) * 1.0;
      }
    });
    const swoosh = new THREE.Mesh(swooshGeo, this.createPartMaterial('logo'));
    swoosh.position.set(0.0, 0.4, 0.51);
    group.add(swoosh);
    this.partMeshes.logo.push(swoosh);

    const swooshR = swoosh.clone();
    swooshR.position.z = -0.51;
    group.add(swooshR);
    this.partMeshes.logo.push(swooshR);
  }

  private buildHighTop(group: THREE.Group): void {
    const soleGeo = new THREE.BoxGeometry(2.3, 0.22, 1.2, 10, 3, 6);
    this.modifyVertices(soleGeo, (p) => {
      p.y -= 0.11;
      if (p.x < -0.9) {
        p.y += Math.pow(-p.x - 0.9, 2) * 0.2;
      }
      if (p.x > 1.0) {
        p.x -= (p.x - 1.0) * 0.3;
      }
    });
    const sole = new THREE.Mesh(soleGeo, this.createPartMaterial('sole'));
    sole.castShadow = true;
    sole.receiveShadow = true;
    group.add(sole);
    this.partMeshes.sole.push(sole);

    const midsoleGeo = new THREE.BoxGeometry(2.25, 0.12, 1.18, 10, 2, 6);
    this.modifyVertices(midsoleGeo, (p) => {
      p.y += 0.06;
    });
    const midsole = new THREE.Mesh(midsoleGeo, this.createPartMaterial('sole'));
    midsole.castShadow = true;
    group.add(midsole);
    this.partMeshes.sole.push(midsole);

    for (let i = 0; i < 3; i++) {
      const stripGeo = new THREE.BoxGeometry(2.15, 0.025, 1.12);
      const strip = new THREE.Mesh(stripGeo, this.createPartMaterial('sole'));
      strip.position.set(0, 0.15 + i * 0.05, 0);
      group.add(strip);
      this.partMeshes.sole.push(strip);
    }

    const upperLowGeo = new THREE.BoxGeometry(2.1, 0.8, 1.1, 10, 6, 6);
    this.modifyVertices(upperLowGeo, (p) => {
      p.y += 0.4;

      if (p.x < -0.7) {
        p.y += (-p.x - 0.7) * 0.3;
      }
      if (p.y > 0.7) {
        p.z *= Math.max(0.55, 1.0 - (p.y - 0.7) * 0.45);
        p.x *= Math.max(0.65, 1.0 - (p.y - 0.7) * 0.18);
      }
    });
    const upperLow = new THREE.Mesh(upperLowGeo, this.createPartMaterial('upper'));
    upperLow.castShadow = true;
    group.add(upperLow);
    this.partMeshes.upper.push(upperLow);

    const highCollarGeo = new THREE.CylinderGeometry(0.48, 0.55, 0.9, 16, 4, true);
    this.modifyVertices(highCollarGeo, (p) => {
      p.y += 1.15;
      p.x *= 1.15;
      p.z *= 0.95;
      if (p.x < -0.1) {
        p.z *= 1.0 - (-p.x - 0.1) * 0.15;
      }
    });
    const highCollar = new THREE.Mesh(highCollarGeo, this.createPartMaterial('upper'));
    highCollar.castShadow = true;
    highCollar.position.x = -0.55;
    group.add(highCollar);
    this.partMeshes.upper.push(highCollar);

    const topCollarGeo = new THREE.TorusGeometry(0.52, 0.08, 10, 24, Math.PI);
    this.modifyVertices(topCollarGeo, (p) => {
      const t = p.x;
      p.x = -0.55 + Math.cos(t) * 0.52;
      p.y = 1.6 + Math.sin(t) * 0.52;
      p.z = p.z;
    });
    const topCollar = new THREE.Mesh(topCollarGeo, this.createPartMaterial('upper'));
    topCollar.castShadow = true;
    group.add(topCollar);
    this.partMeshes.upper.push(topCollar);

    const toeCapGeo = new THREE.SphereGeometry(0.58, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2);
    this.modifyVertices(toeCapGeo, (p) => {
      p.x = p.x * 1.05 + 0.85;
      p.y = p.y * 0.55 + 0.15;
      p.z = p.z * 1.0;
    });
    const toeCap = new THREE.Mesh(toeCapGeo, this.createPartMaterial('upper'));
    toeCap.castShadow = true;
    group.add(toeCap);
    this.partMeshes.upper.push(toeCap);

    const heelCounterGeo = new THREE.SphereGeometry(0.55, 16, 10, 0, Math.PI, 0, Math.PI);
    this.modifyVertices(heelCounterGeo, (p) => {
      p.x = -p.x - 0.8;
      p.y = p.y * 1.1 + 0.2;
      p.z = p.z;
    });
    const heelCounter = new THREE.Mesh(heelCounterGeo, this.createPartMaterial('upper'));
    heelCounter.castShadow = true;
    group.add(heelCounter);
    this.partMeshes.upper.push(heelCounter);

    const ankleStrapGeo = new THREE.BoxGeometry(0.9, 0.15, 1.15, 8, 2, 4);
    this.modifyVertices(ankleStrapGeo, (p) => {
      p.y += 1.2;
      p.x -= 0.2;
    });
    const ankleStrap = new THREE.Mesh(ankleStrapGeo, this.createPartMaterial('upper'));
    ankleStrap.castShadow = true;
    group.add(ankleStrap);
    this.partMeshes.upper.push(ankleStrap);

    for (let i = 0; i < 6; i++) {
      const eyeletGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.05, 12);
      const eyeletL = new THREE.Mesh(eyeletGeo, this.createPartMaterial('logo'));
      eyeletL.rotation.x = Math.PI / 2;
      eyeletL.position.set(-0.1 + i * 0.2, 0.85 + i * 0.08, 0.54);
      group.add(eyeletL);
      this.partMeshes.logo.push(eyeletL);

      const eyeletR = eyeletL.clone();
      eyeletR.position.z = -0.54;
      group.add(eyeletR);
      this.partMeshes.logo.push(eyeletR);
    }

    for (let i = 0; i < 5; i++) {
      const laceGeo = new THREE.BoxGeometry(0.05, 0.03, 1.05);
      const lace = new THREE.Mesh(laceGeo, this.createPartMaterial('lace'));
      lace.position.set(-0.05 + i * 0.2, 0.9 + i * 0.09, 0);
      group.add(lace);
      this.partMeshes.lace.push(lace);
    }

    const logoGeo = new THREE.BoxGeometry(0.6, 0.5, 0.03, 10, 8, 2);
    this.modifyVertices(logoGeo, (p) => {
      p.y += Math.sin(p.x * 3) * 0.05;
    });
    const logo = new THREE.Mesh(logoGeo, this.createPartMaterial('logo'));
    logo.position.set(0.1, 0.7, 0.57);
    group.add(logo);
    this.partMeshes.logo.push(logo);

    const logoR = logo.clone();
    logoR.position.z = -0.57;
    group.add(logoR);
    this.partMeshes.logo.push(logoR);
  }

  private buildSkate(group: THREE.Group): void {
    const soleGeo = new THREE.BoxGeometry(2.6, 0.2, 1.25, 12, 2, 6);
    this.modifyVertices(soleGeo, (p) => {
      p.y -= 0.1;
      if (p.x < -1.15) {
        p.x += (-p.x - 1.15) * 0.3;
      }
      if (p.x > 1.15) {
        p.x -= (p.x - 1.15) * 0.3;
      }
    });
    const sole = new THREE.Mesh(soleGeo, this.createPartMaterial('sole'));
    sole.castShadow = true;
    sole.receiveShadow = true;
    group.add(sole);
    this.partMeshes.sole.push(sole);

    const midsoleGeo = new THREE.BoxGeometry(2.55, 0.1, 1.22);
    this.modifyVertices(midsoleGeo, (p) => {
      p.y += 0.05;
    });
    const midsole = new THREE.Mesh(midsoleGeo, this.createPartMaterial('sole'));
    midsole.castShadow = true;
    group.add(midsole);
    this.partMeshes.sole.push(midsole);

    const wallGeo = new THREE.BoxGeometry(2.55, 0.12, 0.04);
    const wallF = new THREE.Mesh(wallGeo, this.createPartMaterial('sole'));
    wallF.position.set(0, 0.15, 0.61);
    group.add(wallF);
    this.partMeshes.sole.push(wallF);
    const wallB = wallF.clone();
    wallB.position.z = -0.61;
    group.add(wallB);
    this.partMeshes.sole.push(wallB);

    const upperGeo = new THREE.BoxGeometry(2.4, 0.65, 1.15, 12, 6, 6);
    this.modifyVertices(upperGeo, (p) => {
      p.y += 0.32;

      if (p.x < -0.8) {
        p.y += (-p.x - 0.8) * 0.15;
      }
      if (p.x > 0.8) {
        p.y -= (p.x - 0.8) * 0.2;
      }

      if (p.y > 0.5) {
        p.z *= Math.max(0.55, 1.0 - (p.y - 0.5) * 0.5);
        p.x *= Math.max(0.7, 1.0 - (p.y - 0.5) * 0.2);
      }
    });
    const upper = new THREE.Mesh(upperGeo, this.createPartMaterial('upper'));
    upper.castShadow = true;
    group.add(upper);
    this.partMeshes.upper.push(upper);

    const toeCapGeo = new THREE.SphereGeometry(0.62, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2);
    this.modifyVertices(toeCapGeo, (p) => {
      p.x = p.x * 1.0 + 1.0;
      p.y = p.y * 0.5 + 0.05;
      p.z = p.z * 1.0;
    });
    const toeCap = new THREE.Mesh(toeCapGeo, this.createPartMaterial('upper'));
    toeCap.castShadow = true;
    group.add(toeCap);
    this.partMeshes.upper.push(toeCap);

    const toeBumperGeo = new THREE.BoxGeometry(0.25, 0.1, 1.2);
    const toeBumper = new THREE.Mesh(toeBumperGeo, this.createPartMaterial('upper'));
    toeBumper.position.set(1.1, 0.05, 0);
    group.add(toeBumper);
    this.partMeshes.upper.push(toeBumper);

    const heelCounterGeo = new THREE.SphereGeometry(0.58, 16, 10, 0, Math.PI, 0, Math.PI);
    this.modifyVertices(heelCounterGeo, (p) => {
      p.x = -p.x - 0.9;
      p.y = p.y * 0.85 + 0.1;
      p.z = p.z;
    });
    const heelCounter = new THREE.Mesh(heelCounterGeo, this.createPartMaterial('upper'));
    heelCounter.castShadow = true;
    group.add(heelCounter);
    this.partMeshes.upper.push(heelCounter);

    const tongueGeo = new THREE.BoxGeometry(1.0, 0.07, 0.95, 8, 2, 6);
    this.modifyVertices(tongueGeo, (p) => {
      p.y += 0.68;
      p.x -= 0.2;
      if (p.x < -0.3) {
        p.y += (-p.x - 0.3) * 0.15;
      }
      if (p.x > 0.3) {
        p.y -= (p.x - 0.3) * 0.25;
      }
    });
    const tongue = new THREE.Mesh(tongueGeo, this.createPartMaterial('upper'));
    tongue.castShadow = true;
    group.add(tongue);
    this.partMeshes.upper.push(tongue);

    const sidePanelGeo = new THREE.BoxGeometry(1.0, 0.3, 0.03, 10, 4, 2);
    this.modifyVertices(sidePanelGeo, (p) => {
      if (p.y > 0.1) {
        p.x *= Math.max(0.7, 1.0 - (p.y - 0.1) * 0.5);
      }
    });
    const sidePanelL = new THREE.Mesh(sidePanelGeo, this.createPartMaterial('upper'));
    sidePanelL.position.set(0.15, 0.4, 0.59);
    group.add(sidePanelL);
    this.partMeshes.upper.push(sidePanelL);

    const sidePanelR = sidePanelL.clone();
    sidePanelR.position.z = -0.59;
    group.add(sidePanelR);
    this.partMeshes.upper.push(sidePanelR);

    for (let i = 0; i < 3; i++) {
      const eyeletGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.05, 12);
      const eyeletL = new THREE.Mesh(eyeletGeo, this.createPartMaterial('logo'));
      eyeletL.rotation.x = Math.PI / 2;
      eyeletL.position.set(-0.25 + i * 0.3, 0.7, 0.52);
      group.add(eyeletL);
      this.partMeshes.logo.push(eyeletL);

      const eyeletR = eyeletL.clone();
      eyeletR.position.z = -0.52;
      group.add(eyeletR);
      this.partMeshes.logo.push(eyeletR);
    }

    for (let i = 0; i < 3; i++) {
      const laceGeo = new THREE.BoxGeometry(0.05, 0.03, 1.0);
      const lace = new THREE.Mesh(laceGeo, this.createPartMaterial('lace'));
      lace.position.set(-0.25 + i * 0.3, 0.72, 0);
      group.add(lace);
      this.partMeshes.lace.push(lace);
    }

    const starLogoGeo = new THREE.PlaneGeometry(0.6, 0.28, 12, 6);
    this.modifyVertices(starLogoGeo, (p) => {
      const dist = Math.sqrt(p.x * p.x + p.y * p.y);
      if (dist > 0.3 && dist < 0.35) {
        p.z -= 0.05;
      }
    });
    const starLogoL = new THREE.Mesh(starLogoGeo, this.createPartMaterial('logo'));
    starLogoL.position.set(0.25, 0.42, 0.6);
    group.add(starLogoL);
    this.partMeshes.logo.push(starLogoL);

    const starLogoR = starLogoL.clone();
    starLogoR.position.z = -0.6;
    starLogoR.rotation.y = Math.PI;
    group.add(starLogoR);
    this.partMeshes.logo.push(starLogoR);
  }

  private modifyVertices(
    geo: THREE.BufferGeometry,
    fn: (pos: THREE.Vector3) => void
  ): void {
    const posAttr = geo.getAttribute('position');
    const vec = new THREE.Vector3();
    for (let i = 0; i < posAttr.count; i++) {
      vec.set(posAttr.getX(i), posAttr.getY(i), posAttr.getZ(i));
      fn(vec);
      posAttr.setXYZ(i, vec.x, vec.y, vec.z);
    }
    posAttr.needsUpdate = true;
    geo.computeVertexNormals();
  }

  updateColor(partName: PartName, color: string): void {
    const colorKey = `${partName}Color` as keyof ShoeConfig;
    const materialKey = `${partName}Material` as keyof ShoeConfig;
    const fromColor = hexToThreeColor(this.config[colorKey] as string);
    const toColor = hexToThreeColor(color);

    (this.config as any)[colorKey] = color;

    this.transitions.push({
      active: true,
      partName,
      fromColor,
      toColor,
      fromMaterial: this.config[materialKey] as MaterialType,
      toMaterial: this.config[materialKey] as MaterialType,
      startTime: performance.now(),
      duration: 500,
    });

    this.notifyConfigChange();
  }

  updateMaterial(partName: PartName, type: MaterialType): void {
    const materialKey = `${partName}Material` as keyof ShoeConfig;
    const colorKey = `${partName}Color` as keyof ShoeConfig;

    (this.config as any)[materialKey] = type;

    const currentColor = hexToThreeColor(this.config[colorKey] as string);

    this.transitions.push({
      active: true,
      partName,
      fromColor: currentColor.clone(),
      toColor: currentColor.clone(),
      fromMaterial: type,
      toMaterial: type,
      startTime: performance.now(),
      duration: 500,
    });

    this.applyMaterialToPart(partName, type);
    this.notifyConfigChange();
  }

  updateTexture(image: HTMLImageElement): void {
    if (this.decalTexture) {
      this.decalTexture.dispose();
    }

    this.decalTexture = createDecalTexture(image);
    this.config.decalImage = image.src;

    this.clearDecalMeshes();
    this.createDecalMeshes();

    this.notifyConfigChange();
  }

  removeTexture(): void {
    if (this.decalTexture) {
      this.decalTexture.dispose();
      this.decalTexture = null;
    }
    this.config.decalImage = null;
    this.clearDecalMeshes();
    this.notifyConfigChange();
  }

  private clearDecalMeshes(): void {
    if (!this.currentModel) return;
    this.decalMeshes.forEach((d) => {
      this.currentModel!.remove(d.mesh);
      d.mesh.geometry.dispose();
      if (d.mesh.material instanceof THREE.Material) {
        d.mesh.material.dispose();
      }
    });
    this.decalMeshes = [];
  }

  private createDecalMeshes(): void {
    if (!this.currentModel || !this.decalTexture) return;

    const positionsByModel: Array<Array<{ x: number; y: number; z: number; side: 'left' | 'right'; rotY?: number }>> = [
      [
        { x: 0.0, y: 0.5, z: 0.52, side: 'left' },
        { x: 0.0, y: 0.5, z: -0.52, side: 'right' },
      ],
      [
        { x: 0.1, y: 0.65, z: 0.58, side: 'left' },
        { x: 0.1, y: 0.65, z: -0.58, side: 'right' },
      ],
      [
        { x: 0.25, y: 0.45, z: 0.6, side: 'left' },
        { x: 0.25, y: 0.45, z: -0.6, side: 'right' },
      ],
    ];

    const sizeByModel: Array<{ w: number; h: number }> = [
      { w: 0.7, h: 0.35 },
      { w: 0.55, h: 0.4 },
      { w: 0.75, h: 0.35 },
    ];

    const positions = positionsByModel[this.config.shoeModel] || positionsByModel[0];
    const size = sizeByModel[this.config.shoeModel] || sizeByModel[0];

    positions.forEach((pos) => {
      const geo = new THREE.PlaneGeometry(size.w, size.h);
      const mat = new THREE.MeshBasicMaterial({
        map: this.decalTexture,
        transparent: true,
        depthWrite: false,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(pos.x, pos.y, pos.z);
      if (pos.side === 'right') {
        mesh.rotation.y = Math.PI;
      }
      this.currentModel!.add(mesh);
      this.decalMeshes.push({ mesh, side: pos.side });
    });
  }

  private applyMaterialToPart(partName: PartName, type: MaterialType): void {
    const meshes = this.partMeshes[partName];
    const colorKey = `${partName}Color` as keyof ShoeConfig;
    const color = hexToThreeColor(this.config[colorKey] as string);
    const preset = getMaterialPreset(type);

    const matParams: THREE.MeshPhysicalMaterialParameters = {
      ...preset,
      color,
    };

    if (type === 'suede') {
      matParams.bumpMap = generateSuedeBumpMap();
      matParams.bumpScale = 0.06;
    }
    if (type === 'mesh') {
      matParams.alphaMap = generateMeshAlphaMap();
      matParams.transparent = true;
      matParams.side = THREE.DoubleSide;
    }

    meshes.forEach((mesh) => {
      const oldMat = mesh.material as THREE.MeshPhysicalMaterial;
      const newMat = new THREE.MeshPhysicalMaterial(matParams);
      oldMat.dispose();
      mesh.material = newMat;
    });
  }

  private applyFullConfig(): void {
    const parts: PartName[] = ['upper', 'sole', 'lace', 'logo'];
    parts.forEach((part) => {
      const materialKey = `${part}Material` as keyof ShoeConfig;
      this.applyMaterialToPart(part, this.config[materialKey] as MaterialType);
    });
  }

  private processTransitions(): void {
    const now = performance.now();
    this.transitions = this.transitions.filter((t) => {
      const elapsed = now - t.startTime;
      const progress = Math.min(elapsed / t.duration, 1);
      const easedProgress = easeInOutCubic(progress);

      const currentColor = lerpColor(t.fromColor, t.toColor, easedProgress);
      const meshes = this.partMeshes[t.partName];
      meshes.forEach((mesh) => {
        const mat = mesh.material as THREE.MeshPhysicalMaterial;
        mat.color.copy(currentColor);
      });

      return progress < 1;
    });
  }

  getConfig(): ShoeConfig {
    return { ...this.config };
  }

  async captureScreenshot(): Promise<void> {
    this.controls.autoRotate = false;
    this.composer.render();

    await new Promise((resolve) => setTimeout(resolve, 50));

    const canvas = document.createElement('canvas');
    const dpr = Math.min(window.devicePixelRatio, 2);
    const appEl = document.getElementById('app');
    if (!appEl) return;

    const rect = appEl.getBoundingClientRect();
    const width = Math.floor(rect.width * dpr);
    const height = Math.floor(rect.height * dpr);

    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#1a1d2e';
    ctx.fillRect(0, 0, width, height);

    const threeContainer = document.getElementById('three-container');
    if (threeContainer) {
      const tRect = threeContainer.getBoundingClientRect();
      const threeCanvas = threeContainer.querySelector('canvas') as HTMLCanvasElement | null;
      if (threeCanvas) {
        const dx = Math.floor((tRect.left - rect.left) * dpr);
        const dy = Math.floor((tRect.top - rect.top) * dpr);
        const dw = Math.floor(tRect.width * dpr);
        const dh = Math.floor(tRect.height * dpr);
        try {
          ctx.drawImage(threeCanvas, 0, 0, threeCanvas.width, threeCanvas.height, dx, dy, dw, dh);
        } catch (e) {
          console.warn('draw three canvas failed', e);
        }
      }
    }

    const summaryCard = document.getElementById('summary-card');
    if (summaryCard) {
      const sRect = summaryCard.getBoundingClientRect();
      const dx = Math.floor((sRect.left - rect.left) * dpr);
      const dy = Math.floor((sRect.top - rect.top) * dpr);
      const dw = Math.floor(sRect.width * dpr);
      const dh = Math.floor(sRect.height * dpr);

      const bg = window.getComputedStyle(summaryCard).backgroundColor;
      ctx.save();
      ctx.fillStyle = bg || 'rgba(35,39,64,0.65)';
      ctx.shadowColor = 'rgba(0,0,0,0.3)';
      ctx.shadowBlur = 20 * dpr;
      this.roundRect(ctx, dx, dy, dw, dh, 16 * dpr);
      ctx.fill();
      ctx.restore();

      const titleEl = summaryCard.querySelector('.summary-title');
      if (titleEl) {
        ctx.font = `${11 * dpr}px Orbitron, sans-serif`;
        ctx.fillStyle = '#9ca3b8';
        ctx.fillText('参数摘要', dx + 20 * dpr, dy + 30 * dpr);
      }

      const grid = summaryCard.querySelector('#summary-grid');
      if (grid) {
        const rows = grid.querySelectorAll('span.sg-label, span.sg-value');
        let yy = dy + 60 * dpr;
        const pairs: Array<{ label: string; swatchColor: string | null; value: string }> = [];
        this.collectSummaryRows(grid, pairs);
        pairs.forEach((p) => {
          ctx.font = `${12 * dpr}px 'Exo 2', sans-serif`;
          ctx.fillStyle = '#6b7294';
          ctx.fillText(p.label, dx + 20 * dpr, yy);
          let xx = dx + 110 * dpr;
          if (p.swatchColor) {
            ctx.fillStyle = p.swatchColor;
            ctx.fillRect(xx, yy - 12 * dpr, 14 * dpr, 14 * dpr);
            ctx.strokeStyle = 'rgba(255,255,255,0.15)';
            ctx.strokeRect(xx, yy - 12 * dpr, 14 * dpr, 14 * dpr);
            xx += 22 * dpr;
          }
          ctx.fillStyle = '#e8eaf0';
          ctx.font = `600 ${12 * dpr}px 'Exo 2', sans-serif`;
          ctx.fillText(p.value, xx, yy);
          yy += 22 * dpr;
        });
      }

      ctx.save();
      const btnX = dx + 20 * dpr;
      const btnY = dy + dh - 60 * dpr;
      const btnW = dw - 40 * dpr;
      const btnH = 40 * dpr;
      const btnGrad = ctx.createLinearGradient(btnX, btnY, btnX + btnW, btnY + btnH);
      btnGrad.addColorStop(0, '#00d4ff');
      btnGrad.addColorStop(1, '#0090b3');
      ctx.fillStyle = btnGrad;
      this.roundRect(ctx, btnX, btnY, btnW, btnH, 10 * dpr);
      ctx.fill();
      ctx.fillStyle = '#0a0e1a';
      ctx.font = `700 ${12 * dpr}px Orbitron, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('📷 分享截图', btnX + btnW / 2, btnY + btnH / 2);
      ctx.restore();
    }

    ctx.save();
    ctx.globalAlpha = 0.12;
    ctx.font = `${18 * dpr}px Orbitron, sans-serif`;
    ctx.fillStyle = '#ffffff';
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate(-Math.PI / 6);
    const text = 'SHOE CONFIGURATOR';
    const metrics = ctx.measureText(text);
    for (let row = -5; row <= 5; row++) {
      for (let col = -3; col <= 3; col++) {
        ctx.fillText(text, col * (metrics.width + 40 * dpr), row * 50 * dpr);
      }
    }
    ctx.restore();

    const link = document.createElement('a');
    link.download = `shoe-config-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();

    this.controls.autoRotate = true;
  }

  private collectSummaryRows(
    grid: Element,
    out: Array<{ label: string; swatchColor: string | null; value: string }>
  ): void {
    const labels = grid.querySelectorAll('.sg-label');
    const values = grid.querySelectorAll('.sg-value');
    labels.forEach((l, i) => {
      const label = l.textContent || '';
      const valueEl = values[i];
      if (!valueEl) return;
      const swatch = valueEl.querySelector('.sg-swatch') as HTMLElement | null;
      const swatchColor = swatch ? swatch.style.backgroundColor : null;
      const valueText = (valueEl.lastChild?.textContent || '').trim();
      out.push({ label, swatchColor, value: valueText });
    });
  }

  private roundRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    r: number
  ): void {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  startAnimationLoop(): void {
    const animate = () => {
      this.animationId = requestAnimationFrame(animate);

      this.processTransitions();

      this.controls.update();

      this.composer.render();
    };

    animate();
  }

  private handleResize(): void {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(width, height);
    this.composer.setSize(width, height);
  }

  dispose(): void {
    cancelAnimationFrame(this.animationId);
    window.removeEventListener('resize', this.handleResize);

    this.clearDecalMeshes();

    if (this.currentModel) {
      this.currentModel.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose();
          if (child.material instanceof THREE.Material) {
            child.material.dispose();
          }
        }
      });
    }

    this.renderer.dispose();
    this.controls.dispose();

    if (this.decalTexture) {
      this.decalTexture.dispose();
    }
  }
}
