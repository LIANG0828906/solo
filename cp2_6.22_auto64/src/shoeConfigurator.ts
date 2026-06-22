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
  generateSuedeNormalMap,
  generateMeshAlphaMap,
  generateMeshColorMap,
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
  baseX: number;
  baseY: number;
  baseZ: number;
  baseSize: { w: number; h: number };
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
  private cachedSuedeNormal: THREE.CanvasTexture | null = null;
  private cachedSuedeBump: THREE.CanvasTexture | null = null;
  private cachedMeshAlpha: THREE.CanvasTexture | null = null;
  private cachedMeshColor: THREE.CanvasTexture | null = null;

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

    this.clearDecalMeshes();

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
    return this.buildMaterial(color, materialType);
  }

  private buildMaterial(color: THREE.Color, materialType: MaterialType): THREE.MeshPhysicalMaterial {
    const preset = getMaterialPreset(materialType);
    const matParams: THREE.MeshPhysicalMaterialParameters = {
      ...preset,
      color: color.clone(),
    };

    if (materialType === 'suede') {
      if (!this.cachedSuedeNormal) this.cachedSuedeNormal = generateSuedeNormalMap();
      if (!this.cachedSuedeBump) this.cachedSuedeBump = generateSuedeBumpMap();
      matParams.normalMap = this.cachedSuedeNormal;
      matParams.normalScale = new THREE.Vector2(0.8, 0.8);
      matParams.bumpMap = this.cachedSuedeBump;
      matParams.bumpScale = 0.04;
    }
    if (materialType === 'mesh') {
      if (!this.cachedMeshAlpha) this.cachedMeshAlpha = generateMeshAlphaMap();
      if (!this.cachedMeshColor) this.cachedMeshColor = generateMeshColorMap();
      matParams.alphaMap = this.cachedMeshAlpha;
      matParams.alphaTest = 0.4;
      matParams.map = this.cachedMeshColor;
      matParams.side = THREE.DoubleSide;
    }

    return new THREE.MeshPhysicalMaterial(matParams);
  }

  private modifyVertices(
    geo: THREE.BufferGeometry,
    fn: (pos: THREE.Vector3, normal: THREE.Vector3, uv: THREE.Vector2) => void
  ): void {
    const posAttr = geo.getAttribute('position') as THREE.BufferAttribute;
    const normAttr = geo.getAttribute('normal') as THREE.BufferAttribute | undefined;
    const uvAttr = geo.getAttribute('uv') as THREE.BufferAttribute | undefined;
    const vec = new THREE.Vector3();
    const nrm = new THREE.Vector3();
    const uv = new THREE.Vector2();
    for (let i = 0; i < posAttr.count; i++) {
      vec.set(posAttr.getX(i), posAttr.getY(i), posAttr.getZ(i));
      if (normAttr) nrm.set(normAttr.getX(i), normAttr.getY(i), normAttr.getZ(i));
      if (uvAttr) uv.set(uvAttr.getX(i), uvAttr.getY(i));
      fn(vec, nrm, uv);
      posAttr.setXYZ(i, vec.x, vec.y, vec.z);
      if (normAttr) normAttr.setXYZ(i, nrm.x, nrm.y, nrm.z);
      if (uvAttr) uvAttr.setXY(i, uv.x, uv.y);
    }
    posAttr.needsUpdate = true;
    if (normAttr) normAttr.needsUpdate = true;
    if (uvAttr) uvAttr.needsUpdate = true;
    geo.computeVertexNormals();
  }

  private buildSoleFromProfile(
    profile: Array<{ x: number; y: number }>,
    thickness: number,
    width: number
  ): THREE.BufferGeometry {
    const shape = new THREE.Shape();
    shape.moveTo(profile[0].x, profile[0].y);
    for (let i = 1; i < profile.length; i++) {
      shape.lineTo(profile[i].x, profile[i].y);
    }
    shape.lineTo(profile[0].x, profile[0].y);

    const extrudeSettings: THREE.ExtrudeGeometryOptions = {
      depth: width,
      bevelEnabled: true,
      bevelThickness: thickness * 0.15,
      bevelSize: thickness * 0.15,
      bevelSegments: 6,
      curveSegments: 16,
    };

    const geo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    geo.translate(0, 0, -width / 2);
    geo.rotateY(0);
    return geo;
  }

  private buildUpperFromLathe(
    profile: Array<{ x: number; y: number }>,
    segments: number = 40,
    scaleFn?: (angle: number, y: number) => { sx: number; sz: number; dy: number }
  ): THREE.BufferGeometry {
    const points = profile.map((p) => new THREE.Vector2(p.x, p.y));
    const geo = new THREE.LatheGeometry(points, segments);
    if (scaleFn) {
      this.modifyVertices(geo, (p) => {
        const angle = Math.atan2(p.z, p.x);
        const result = scaleFn(angle, p.y);
        p.x *= result.sx;
        p.z *= result.sz;
        p.y += result.dy;
      });
    }
    return geo;
  }

  private buildRunner(group: THREE.Group): void {
    const soleProfile = [
      { x: -1.2, y: -0.02 },
      { x: -1.0, y: 0.02 },
      { x: -0.6, y: 0.08 },
      { x: 0.0, y: 0.1 },
      { x: 0.6, y: 0.08 },
      { x: 1.0, y: 0.02 },
      { x: 1.25, y: -0.05 },
      { x: 1.35, y: -0.18 },
      { x: 1.28, y: -0.28 },
      { x: 1.0, y: -0.26 },
      { x: 0.0, y: -0.2 },
      { x: -1.0, y: -0.24 },
      { x: -1.25, y: -0.28 },
      { x: -1.3, y: -0.18 },
      { x: -1.25, y: -0.06 },
    ];
    const soleGeo = this.buildSoleFromProfile(soleProfile, 0.25, 1.05);
    this.modifyVertices(soleGeo, (p) => {
      p.y -= 0.05;
      p.z *= 1.0;
    });
    const sole = new THREE.Mesh(soleGeo, this.createPartMaterial('sole'));
    sole.castShadow = true;
    sole.receiveShadow = true;
    group.add(sole);
    this.partMeshes.sole.push(sole);

    const midsoleCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-1.1, 0.02, 0),
      new THREE.Vector3(-0.6, 0.1, 0),
      new THREE.Vector3(0.0, 0.14, 0),
      new THREE.Vector3(0.5, 0.12, 0),
      new THREE.Vector3(1.0, 0.04, 0),
      new THREE.Vector3(1.25, -0.08, 0),
    ]);
    const midsoleTube = new THREE.TubeGeometry(midsoleCurve, 80, 0.07, 12, false);
    this.modifyVertices(midsoleTube, (p) => {
      p.z *= 5.2;
    });
    const midsole = new THREE.Mesh(midsoleTube, this.createPartMaterial('sole'));
    midsole.castShadow = true;
    group.add(midsole);
    this.partMeshes.sole.push(midsole);

    const upperProfile = [
      { x: 0.05, y: -0.05 },
      { x: 0.35, y: 0.0 },
      { x: 0.55, y: 0.2 },
      { x: 0.6, y: 0.45 },
      { x: 0.5, y: 0.7 },
      { x: 0.35, y: 0.85 },
      { x: 0.2, y: 0.9 },
      { x: 0.0, y: 0.85 },
      { x: -0.15, y: 0.72 },
      { x: -0.25, y: 0.5 },
      { x: -0.3, y: 0.25 },
      { x: -0.25, y: 0.0 },
      { x: -0.1, y: -0.05 },
    ];
    const upperGeo = this.buildUpperFromLathe(
      upperProfile,
      48,
      (angle, y) => {
        const ca = Math.cos(angle);
        const sa = Math.sin(angle);
        const sideFactor = Math.abs(sa);
        let sx = 1.0;
        let sz = 1.0;
        let dy = 0;

        if (ca > 0) {
          sx = 1.0 + ca * 1.1;
          sz = 0.55 + (1.0 - sideFactor) * 0.2;
          if (y > 0.5) {
            sx *= Math.max(0.55, 1.0 - (y - 0.5) * 0.8);
            sz *= Math.max(0.5, 1.0 - (y - 0.5) * 0.9);
          }
        } else {
          sx = 1.0 + Math.abs(ca) * 0.4;
          sz = 0.55 + (1.0 - sideFactor) * 0.15;
          dy = -0.15;
          if (y > 0.55) {
            sx *= Math.max(0.5, 1.0 - (y - 0.55) * 0.9);
            sz *= Math.max(0.5, 1.0 - (y - 0.55) * 0.9);
            dy += (y - 0.55) * 0.3;
          }
        }
        return { sx, sz, dy };
      }
    );
    this.modifyVertices(upperGeo, (p) => {
      p.y += 0.05;
      const r = Math.sqrt(p.x * p.x + p.z * p.z);
      if (r < 0.15 && p.y > 0.75) {
        const keep = Math.max(0, (p.y - 0.75) * 3.0);
        p.x *= 1.0 - keep * 0.5;
        p.z *= 1.0 - keep * 0.5;
      }
    });
    const upper = new THREE.Mesh(upperGeo, this.createPartMaterial('upper'));
    upper.castShadow = true;
    group.add(upper);
    this.partMeshes.upper.push(upper);

    const toeShape = new THREE.Shape();
    const toePts = 16;
    for (let i = 0; i <= toePts; i++) {
      const t = (i / toePts) * Math.PI;
      const x = 0.9 + Math.cos(t) * 0.55;
      const y = Math.sin(t) * 0.42 + 0.0;
      if (i === 0) toeShape.moveTo(x, y);
      else toeShape.lineTo(x, y);
    }
    const toeGeo = new THREE.ExtrudeGeometry(toeShape, {
      depth: 1.0,
      bevelEnabled: true,
      bevelThickness: 0.06,
      bevelSize: 0.08,
      bevelSegments: 6,
      curveSegments: 12,
    });
    toeGeo.translate(0, 0, -0.5);
    this.modifyVertices(toeGeo, (p) => {
      const dist = Math.abs(p.z);
      if (dist > 0.3) {
        const shrink = (dist - 0.3) / 0.3;
        p.x -= shrink * 0.08;
        p.y -= shrink * 0.06;
      }
    });
    const toeCap = new THREE.Mesh(toeGeo, this.createPartMaterial('upper'));
    toeCap.castShadow = true;
    group.add(toeCap);
    this.partMeshes.upper.push(toeCap);

    const heelShape = new THREE.Shape();
    const heelPts = 14;
    for (let i = 0; i <= heelPts; i++) {
      const t = (i / heelPts) * Math.PI;
      const x = -0.85 - Math.cos(t) * 0.55;
      const y = Math.sin(t) * 0.55 + 0.0;
      if (i === 0) heelShape.moveTo(x, y);
      else heelShape.lineTo(x, y);
    }
    const heelGeo = new THREE.ExtrudeGeometry(heelShape, {
      depth: 0.95,
      bevelEnabled: true,
      bevelThickness: 0.05,
      bevelSize: 0.07,
      bevelSegments: 6,
      curveSegments: 12,
    });
    heelGeo.translate(0, 0, -0.475);
    const heelCap = new THREE.Mesh(heelGeo, this.createPartMaterial('upper'));
    heelCap.castShadow = true;
    group.add(heelCap);
    this.partMeshes.upper.push(heelCap);

    const tonguePts = [
      new THREE.Vector3(-0.15, 0.82, 0),
      new THREE.Vector3(0.05, 0.92, 0),
      new THREE.Vector3(0.25, 0.9, 0),
      new THREE.Vector3(0.4, 0.78, 0),
    ];
    const tongueCurve = new THREE.CatmullRomCurve3(tonguePts);
    const tongueGeo = new THREE.TubeGeometry(tongueCurve, 30, 0.05, 10, false);
    this.modifyVertices(tongueGeo, (p) => {
      p.z *= 9.5;
    });
    const tongue = new THREE.Mesh(tongueGeo, this.createPartMaterial('upper'));
    tongue.castShadow = true;
    group.add(tongue);
    this.partMeshes.upper.push(tongue);

    const tongueTopShape = new THREE.Shape();
    tongueTopShape.moveTo(-0.25, 0.82);
    tongueTopShape.quadraticCurveTo(0.0, 0.98, 0.3, 0.88);
    tongueTopShape.lineTo(0.45, 0.78);
    tongueTopShape.lineTo(-0.2, 0.75);
    tongueTopShape.lineTo(-0.25, 0.82);
    const tongueTopGeo = new THREE.ExtrudeGeometry(tongueTopShape, {
      depth: 0.9,
      bevelEnabled: true,
      bevelThickness: 0.02,
      bevelSize: 0.02,
      bevelSegments: 3,
    });
    tongueTopGeo.translate(0, 0, -0.45);
    const tongueTop = new THREE.Mesh(tongueTopGeo, this.createPartMaterial('upper'));
    tongueTop.castShadow = true;
    group.add(tongueTop);
    this.partMeshes.upper.push(tongueTop);

    const collarPts: THREE.Vector3[] = [];
    const collarSegs = 24;
    for (let i = 0; i <= collarSegs; i++) {
      const t = (i / collarSegs) * Math.PI;
      collarPts.push(new THREE.Vector3(-0.85 + Math.cos(t) * 0.45, 0.85 + Math.sin(t) * 0.45, 0));
    }
    const collarCurve = new THREE.CatmullRomCurve3(collarPts);
    const collarGeo = new THREE.TubeGeometry(collarCurve, 32, 0.06, 10, false);
    this.modifyVertices(collarGeo, (p) => {
      p.z *= 8.0;
    });
    const collar = new THREE.Mesh(collarGeo, this.createPartMaterial('upper'));
    collar.castShadow = true;
    group.add(collar);
    this.partMeshes.upper.push(collar);

    for (let i = 0; i < 4; i++) {
      const eyeletGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.05, 12);
      const eyeletL = new THREE.Mesh(eyeletGeo, this.createPartMaterial('logo'));
      eyeletL.rotation.x = Math.PI / 2;
      eyeletL.position.set(-0.05 + i * 0.22, 0.9, 0.48);
      group.add(eyeletL);
      this.partMeshes.logo.push(eyeletL);

      const eyeletR = eyeletL.clone();
      eyeletR.position.z = -0.48;
      group.add(eyeletR);
      this.partMeshes.logo.push(eyeletR);
    }

    for (let i = 0; i < 4; i++) {
      const laceCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(-0.05 + i * 0.22, 0.92, 0.48),
        new THREE.Vector3(-0.05 + i * 0.22 + 0.03, 0.93, 0),
        new THREE.Vector3(-0.05 + i * 0.22, 0.92, -0.48),
      ]);
      const laceGeo = new THREE.TubeGeometry(laceCurve, 20, 0.022, 8, false);
      const lace = new THREE.Mesh(laceGeo, this.createPartMaterial('lace'));
      lace.castShadow = true;
      if (i % 2 === 0) lace.rotation.y = 0.12;
      else lace.rotation.y = -0.12;
      group.add(lace);
      this.partMeshes.lace.push(lace);
    }

    const swooshShape = new THREE.Shape();
    swooshShape.moveTo(-0.55, 0.35);
    swooshShape.bezierCurveTo(-0.3, 0.55, 0.1, 0.48, 0.45, 0.32);
    swooshShape.bezierCurveTo(0.15, 0.44, -0.2, 0.42, -0.55, 0.28);
    swooshShape.lineTo(-0.55, 0.35);
    const swooshGeo = new THREE.ExtrudeGeometry(swooshShape, {
      depth: 0.02,
      bevelEnabled: true,
      bevelThickness: 0.005,
      bevelSize: 0.008,
      bevelSegments: 2,
    });
    swooshGeo.translate(0, 0, 0.51);
    const swoosh = new THREE.Mesh(swooshGeo, this.createPartMaterial('logo'));
    swoosh.castShadow = true;
    group.add(swoosh);
    this.partMeshes.logo.push(swoosh);

    const swooshR = swoosh.clone();
    swooshR.position.z = -0.51;
    swooshR.rotation.y = Math.PI;
    group.add(swooshR);
    this.partMeshes.logo.push(swooshR);
  }

  private buildHighTop(group: THREE.Group): void {
    const soleProfile = [
      { x: -1.15, y: -0.02 },
      { x: -0.8, y: 0.04 },
      { x: 0.0, y: 0.12 },
      { x: 0.7, y: 0.1 },
      { x: 1.05, y: 0.03 },
      { x: 1.2, y: -0.12 },
      { x: 1.12, y: -0.3 },
      { x: 0.5, y: -0.32 },
      { x: -0.5, y: -0.3 },
      { x: -1.1, y: -0.3 },
      { x: -1.18, y: -0.18 },
      { x: -1.15, y: -0.05 },
    ];
    const soleGeo = this.buildSoleFromProfile(soleProfile, 0.3, 1.15);
    this.modifyVertices(soleGeo, (p) => {
      p.y -= 0.05;
    });
    const sole = new THREE.Mesh(soleGeo, this.createPartMaterial('sole'));
    sole.castShadow = true;
    sole.receiveShadow = true;
    group.add(sole);
    this.partMeshes.sole.push(sole);

    for (let i = 0; i < 3; i++) {
      const stripShape = new THREE.Shape();
      stripShape.moveTo(-1.1, 0.12 + i * 0.05);
      stripShape.lineTo(1.1, 0.12 + i * 0.05);
      stripShape.lineTo(1.1, 0.14 + i * 0.05);
      stripShape.lineTo(-1.1, 0.14 + i * 0.05);
      const stripGeo = new THREE.ExtrudeGeometry(stripShape, {
        depth: 1.12,
        bevelEnabled: false,
      });
      stripGeo.translate(0, 0, -0.56);
      const strip = new THREE.Mesh(stripGeo, this.createPartMaterial('sole'));
      strip.castShadow = true;
      group.add(strip);
      this.partMeshes.sole.push(strip);
    }

    const lowerProfile = [
      { x: 0.05, y: 0.0 },
      { x: 0.4, y: 0.05 },
      { x: 0.58, y: 0.3 },
      { x: 0.58, y: 0.65 },
      { x: 0.5, y: 0.9 },
      { x: 0.3, y: 1.0 },
      { x: 0.0, y: 0.95 },
      { x: -0.2, y: 0.8 },
      { x: -0.3, y: 0.55 },
      { x: -0.3, y: 0.25 },
      { x: -0.2, y: 0.0 },
    ];
    const lowerGeo = this.buildUpperFromLathe(
      lowerProfile,
      48,
      (angle, y) => {
        const ca = Math.cos(angle);
        const sa = Math.sin(angle);
        const sideFactor = Math.abs(sa);
        let sx = 1.0;
        let sz = 1.0;
        let dy = 0;

        if (ca > 0) {
          sx = 1.0 + ca * 0.95;
          sz = 0.6 + (1.0 - sideFactor) * 0.15;
        } else {
          sx = 1.0 + Math.abs(ca) * 0.35;
          sz = 0.6 + (1.0 - sideFactor) * 0.1;
          dy = -0.2;
        }
        if (y > 0.8) {
          const factor = (y - 0.8) / 0.3;
          sx *= Math.max(0.55, 1.0 - factor * 0.7);
          sz *= Math.max(0.5, 1.0 - factor * 0.8);
        }
        return { sx, sz, dy };
      }
    );
    const lower = new THREE.Mesh(lowerGeo, this.createPartMaterial('upper'));
    lower.castShadow = true;
    group.add(lower);
    this.partMeshes.upper.push(lower);

    const collarProfile = [
      { x: 0.05, y: 0.0 },
      { x: 0.45, y: 0.05 },
      { x: 0.55, y: 0.3 },
      { x: 0.52, y: 0.6 },
      { x: 0.4, y: 0.85 },
      { x: 0.2, y: 0.95 },
      { x: -0.05, y: 0.9 },
      { x: -0.25, y: 0.7 },
      { x: -0.35, y: 0.45 },
      { x: -0.35, y: 0.2 },
      { x: -0.25, y: 0.0 },
    ];
    const collarGeo = this.buildUpperFromLathe(
      collarProfile,
      36,
      (angle, y) => {
        const ca = Math.cos(angle);
        const sa = Math.sin(angle);
        const sideFactor = Math.abs(sa);
        let sx = 1.0;
        let sz = 1.0;
        let dy = 1.05;
        if (ca > 0) {
          sx = 1.0 + ca * 0.5;
          sz = 0.62 + (1.0 - sideFactor) * 0.1;
        } else {
          sx = 1.0 + Math.abs(ca) * 0.2;
          sz = 0.62 + (1.0 - sideFactor) * 0.08;
          dy += -0.25;
        }
        if (y > 0.75) {
          const f = (y - 0.75) / 0.25;
          sx *= Math.max(0.6, 1.0 - f * 0.6);
          sz *= Math.max(0.55, 1.0 - f * 0.65);
        }
        return { sx, sz, dy };
      }
    );
    collarGeo.rotateX(0);
    const collar = new THREE.Mesh(collarGeo, this.createPartMaterial('upper'));
    collar.castShadow = true;
    group.add(collar);
    this.partMeshes.upper.push(collar);

    const topPts: THREE.Vector3[] = [];
    const topSegs = 28;
    for (let i = 0; i <= topSegs; i++) {
      const t = (i / topSegs) * Math.PI;
      topPts.push(new THREE.Vector3(-0.55 + Math.cos(t) * 0.55, 1.55 + Math.sin(t) * 0.42, 0));
    }
    const topCurve = new THREE.CatmullRomCurve3(topPts);
    const topGeo = new THREE.TubeGeometry(topCurve, 36, 0.075, 12, false);
    this.modifyVertices(topGeo, (p) => {
      p.z *= 7.6;
    });
    const topCollar = new THREE.Mesh(topGeo, this.createPartMaterial('upper'));
    topCollar.castShadow = true;
    group.add(topCollar);
    this.partMeshes.upper.push(topCollar);

    const toeShape = new THREE.Shape();
    const toePts = 16;
    for (let i = 0; i <= toePts; i++) {
      const t = (i / toePts) * Math.PI;
      toeShape.moveTo;
      const x = 0.8 + Math.cos(t) * 0.58;
      const y = Math.sin(t) * 0.48 - 0.02;
      if (i === 0) toeShape.moveTo(x, y);
      else toeShape.lineTo(x, y);
    }
    const toeGeo = new THREE.ExtrudeGeometry(toeShape, {
      depth: 1.1,
      bevelEnabled: true,
      bevelThickness: 0.06,
      bevelSize: 0.08,
      bevelSegments: 6,
      curveSegments: 12,
    });
    toeGeo.translate(0, 0, -0.55);
    const toeCap = new THREE.Mesh(toeGeo, this.createPartMaterial('upper'));
    toeCap.castShadow = true;
    group.add(toeCap);
    this.partMeshes.upper.push(toeCap);

    const heelShape = new THREE.Shape();
    const heelPts = 14;
    for (let i = 0; i <= heelPts; i++) {
      const t = (i / heelPts) * Math.PI;
      const x = -0.82 - Math.cos(t) * 0.6;
      const y = Math.sin(t) * 0.65 - 0.02;
      if (i === 0) heelShape.moveTo(x, y);
      else heelShape.lineTo(x, y);
    }
    const heelGeo = new THREE.ExtrudeGeometry(heelShape, {
      depth: 1.05,
      bevelEnabled: true,
      bevelThickness: 0.05,
      bevelSize: 0.07,
      bevelSegments: 6,
      curveSegments: 12,
    });
    heelGeo.translate(0, 0, -0.525);
    const heelCounter = new THREE.Mesh(heelGeo, this.createPartMaterial('upper'));
    heelCounter.castShadow = true;
    group.add(heelCounter);
    this.partMeshes.upper.push(heelCounter);

    const strapShape = new THREE.Shape();
    strapShape.moveTo(-0.7, 1.15);
    strapShape.lineTo(0.15, 1.2);
    strapShape.lineTo(0.2, 1.35);
    strapShape.lineTo(-0.75, 1.3);
    strapShape.lineTo(-0.7, 1.15);
    const strapGeo = new THREE.ExtrudeGeometry(strapShape, {
      depth: 1.15,
      bevelEnabled: true,
      bevelThickness: 0.02,
      bevelSize: 0.02,
      bevelSegments: 3,
    });
    strapGeo.translate(0, 0, -0.575);
    const ankleStrap = new THREE.Mesh(strapGeo, this.createPartMaterial('upper'));
    ankleStrap.castShadow = true;
    group.add(ankleStrap);
    this.partMeshes.upper.push(ankleStrap);

    for (let i = 0; i < 6; i++) {
      const eyeletGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.05, 12);
      const eyeletL = new THREE.Mesh(eyeletGeo, this.createPartMaterial('logo'));
      eyeletL.rotation.x = Math.PI / 2;
      eyeletL.position.set(-0.05 + i * 0.2, 0.9 + i * 0.1, 0.54);
      group.add(eyeletL);
      this.partMeshes.logo.push(eyeletL);

      const eyeletR = eyeletL.clone();
      eyeletR.position.z = -0.54;
      group.add(eyeletR);
      this.partMeshes.logo.push(eyeletR);
    }

    for (let i = 0; i < 5; i++) {
      const laceCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(-0.05 + i * 0.2, 0.93 + i * 0.1, 0.54),
        new THREE.Vector3(-0.05 + i * 0.2 + 0.03, 0.96 + i * 0.1, 0),
        new THREE.Vector3(-0.05 + i * 0.2, 0.93 + i * 0.1, -0.54),
      ]);
      const laceGeo = new THREE.TubeGeometry(laceCurve, 20, 0.025, 8, false);
      const lace = new THREE.Mesh(laceGeo, this.createPartMaterial('lace'));
      lace.castShadow = true;
      group.add(lace);
      this.partMeshes.lace.push(lace);
    }

    const logoShape = new THREE.Shape();
    logoShape.moveTo(-0.28, 0.48);
    logoShape.lineTo(0.0, 0.9);
    logoShape.lineTo(0.28, 0.48);
    logoShape.lineTo(0.12, 0.48);
    logoShape.lineTo(0.0, 0.7);
    logoShape.lineTo(-0.12, 0.48);
    logoShape.lineTo(-0.28, 0.48);
    const logoGeo = new THREE.ExtrudeGeometry(logoShape, {
      depth: 0.025,
      bevelEnabled: true,
      bevelThickness: 0.005,
      bevelSize: 0.008,
      bevelSegments: 3,
    });
    logoGeo.translate(0, 0, 0.57);
    const logo = new THREE.Mesh(logoGeo, this.createPartMaterial('logo'));
    logo.castShadow = true;
    group.add(logo);
    this.partMeshes.logo.push(logo);

    const logoR = logo.clone();
    logoR.position.z = -0.57;
    logoR.rotation.y = Math.PI;
    group.add(logoR);
    this.partMeshes.logo.push(logoR);
  }

  private buildSkate(group: THREE.Group): void {
    const soleProfile = [
      { x: -1.3, y: -0.02 },
      { x: -0.8, y: 0.04 },
      { x: 0.0, y: 0.08 },
      { x: 0.8, y: 0.06 },
      { x: 1.25, y: -0.02 },
      { x: 1.35, y: -0.2 },
      { x: 1.25, y: -0.3 },
      { x: 0.0, y: -0.28 },
      { x: -1.25, y: -0.3 },
      { x: -1.35, y: -0.2 },
      { x: -1.3, y: -0.05 },
    ];
    const soleGeo = this.buildSoleFromProfile(soleProfile, 0.25, 1.22);
    this.modifyVertices(soleGeo, (p) => {
      p.y -= 0.05;
    });
    const sole = new THREE.Mesh(soleGeo, this.createPartMaterial('sole'));
    sole.castShadow = true;
    sole.receiveShadow = true;
    group.add(sole);
    this.partMeshes.sole.push(sole);

    const wallPts = [
      new THREE.Vector3(-1.25, 0.08, 0),
      new THREE.Vector3(0.0, 0.12, 0),
      new THREE.Vector3(1.25, 0.08, 0),
    ];
    const wallCurve = new THREE.CatmullRomCurve3(wallPts);
    const wallTube = new THREE.TubeGeometry(wallCurve, 60, 0.04, 8, false);
    this.modifyVertices(wallTube, (p) => {
      p.z *= 15;
    });
    const sideWallF = wallTube.clone();
    sideWallF.position.z = 0.61;
    group.add(sideWallF);
    this.partMeshes.sole.push(sideWallF);
    const sideWallB = wallTube.clone();
    sideWallB.position.z = -0.61;
    group.add(sideWallB);
    this.partMeshes.sole.push(sideWallB);

    const upperProfile = [
      { x: 0.05, y: -0.02 },
      { x: 0.45, y: 0.0 },
      { x: 0.6, y: 0.2 },
      { x: 0.58, y: 0.45 },
      { x: 0.45, y: 0.62 },
      { x: 0.25, y: 0.68 },
      { x: 0.0, y: 0.64 },
      { x: -0.2, y: 0.52 },
      { x: -0.32, y: 0.35 },
      { x: -0.32, y: 0.12 },
      { x: -0.22, y: -0.02 },
    ];
    const upperGeo = this.buildUpperFromLathe(
      upperProfile,
      48,
      (angle, y) => {
        const ca = Math.cos(angle);
        const sa = Math.sin(angle);
        const sideFactor = Math.abs(sa);
        let sx = 1.0;
        let sz = 1.0;
        let dy = 0;
        if (ca > 0) {
          sx = 1.0 + ca * 1.05;
          sz = 0.62 + (1.0 - sideFactor) * 0.18;
        } else {
          sx = 1.0 + Math.abs(ca) * 0.45;
          sz = 0.62 + (1.0 - sideFactor) * 0.15;
          dy = -0.12;
        }
        if (y > 0.5) {
          const f = (y - 0.5) / 0.22;
          sx *= Math.max(0.55, 1.0 - f * 0.75);
          sz *= Math.max(0.5, 1.0 - f * 0.85);
        }
        return { sx, sz, dy };
      }
    );
    const upper = new THREE.Mesh(upperGeo, this.createPartMaterial('upper'));
    upper.castShadow = true;
    group.add(upper);
    this.partMeshes.upper.push(upper);

    const toeShape = new THREE.Shape();
    const toePts = 18;
    for (let i = 0; i <= toePts; i++) {
      const t = (i / toePts) * Math.PI;
      const x = 0.95 + Math.cos(t) * 0.65;
      const y = Math.sin(t) * 0.45 - 0.05;
      if (i === 0) toeShape.moveTo(x, y);
      else toeShape.lineTo(x, y);
    }
    const toeGeo = new THREE.ExtrudeGeometry(toeShape, {
      depth: 1.18,
      bevelEnabled: true,
      bevelThickness: 0.05,
      bevelSize: 0.06,
      bevelSegments: 5,
      curveSegments: 12,
    });
    toeGeo.translate(0, 0, -0.59);
    const toeCap = new THREE.Mesh(toeGeo, this.createPartMaterial('upper'));
    toeCap.castShadow = true;
    group.add(toeCap);
    this.partMeshes.upper.push(toeCap);

    const toeBumperShape = new THREE.Shape();
    toeBumperShape.moveTo(1.1, -0.12);
    toeBumperShape.lineTo(1.65, -0.08);
    toeBumperShape.lineTo(1.65, 0.08);
    toeBumperShape.lineTo(1.1, 0.12);
    const bumperGeo = new THREE.ExtrudeGeometry(toeBumperShape, {
      depth: 1.2,
      bevelEnabled: true,
      bevelThickness: 0.03,
      bevelSize: 0.03,
      bevelSegments: 3,
    });
    bumperGeo.translate(0, 0, -0.6);
    const bumper = new THREE.Mesh(bumperGeo, this.createPartMaterial('upper'));
    bumper.castShadow = true;
    group.add(bumper);
    this.partMeshes.upper.push(bumper);

    const heelShape = new THREE.Shape();
    const heelPts = 14;
    for (let i = 0; i <= heelPts; i++) {
      const t = (i / heelPts) * Math.PI;
      const x = -0.88 - Math.cos(t) * 0.62;
      const y = Math.sin(t) * 0.5 - 0.05;
      if (i === 0) heelShape.moveTo(x, y);
      else heelShape.lineTo(x, y);
    }
    const heelGeo = new THREE.ExtrudeGeometry(heelShape, {
      depth: 1.15,
      bevelEnabled: true,
      bevelThickness: 0.05,
      bevelSize: 0.06,
      bevelSegments: 5,
      curveSegments: 12,
    });
    heelGeo.translate(0, 0, -0.575);
    const heelCounter = new THREE.Mesh(heelGeo, this.createPartMaterial('upper'));
    heelCounter.castShadow = true;
    group.add(heelCounter);
    this.partMeshes.upper.push(heelCounter);

    const tongueShape = new THREE.Shape();
    tongueShape.moveTo(-0.4, 0.62);
    tongueShape.quadraticCurveTo(-0.1, 0.76, 0.2, 0.7);
    tongueShape.lineTo(0.5, 0.55);
    tongueShape.lineTo(-0.35, 0.56);
    tongueShape.lineTo(-0.4, 0.62);
    const tongueGeo = new THREE.ExtrudeGeometry(tongueShape, {
      depth: 0.98,
      bevelEnabled: true,
      bevelThickness: 0.015,
      bevelSize: 0.015,
      bevelSegments: 3,
    });
    tongueGeo.translate(0, 0, -0.49);
    const tongue = new THREE.Mesh(tongueGeo, this.createPartMaterial('upper'));
    tongue.castShadow = true;
    group.add(tongue);
    this.partMeshes.upper.push(tongue);

    const panelShape = new THREE.Shape();
    panelShape.moveTo(-0.35, 0.25);
    panelShape.quadraticCurveTo(0.0, 0.6, 0.6, 0.55);
    panelShape.lineTo(0.65, 0.35);
    panelShape.quadraticCurveTo(0.1, 0.32, -0.3, 0.18);
    panelShape.lineTo(-0.35, 0.25);
    const panelGeo = new THREE.ExtrudeGeometry(panelShape, {
      depth: 0.025,
      bevelEnabled: true,
      bevelThickness: 0.004,
      bevelSize: 0.006,
      bevelSegments: 2,
    });
    panelGeo.translate(0, 0, 0.59);
    const panelL = new THREE.Mesh(panelGeo, this.createPartMaterial('upper'));
    panelL.castShadow = true;
    group.add(panelL);
    this.partMeshes.upper.push(panelL);
    const panelR = panelL.clone();
    panelR.position.z = -0.59;
    panelR.rotation.y = Math.PI;
    group.add(panelR);
    this.partMeshes.upper.push(panelR);

    for (let i = 0; i < 3; i++) {
      const eyeletGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.05, 12);
      const eyeletL = new THREE.Mesh(eyeletGeo, this.createPartMaterial('logo'));
      eyeletL.rotation.x = Math.PI / 2;
      eyeletL.position.set(-0.2 + i * 0.3, 0.72, 0.52);
      group.add(eyeletL);
      this.partMeshes.logo.push(eyeletL);

      const eyeletR = eyeletL.clone();
      eyeletR.position.z = -0.52;
      group.add(eyeletR);
      this.partMeshes.logo.push(eyeletR);
    }

    for (let i = 0; i < 3; i++) {
      const laceCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(-0.2 + i * 0.3, 0.75, 0.52),
        new THREE.Vector3(-0.2 + i * 0.3 + 0.03, 0.77, 0),
        new THREE.Vector3(-0.2 + i * 0.3, 0.75, -0.52),
      ]);
      const laceGeo = new THREE.TubeGeometry(laceCurve, 20, 0.023, 8, false);
      const lace = new THREE.Mesh(laceGeo, this.createPartMaterial('lace'));
      lace.castShadow = true;
      group.add(lace);
      this.partMeshes.lace.push(lace);
    }

    const starShape = new THREE.Shape();
    const spikes = 5;
    const outerR = 0.34;
    const innerR = 0.15;
    for (let i = 0; i < spikes * 2; i++) {
      const r = i % 2 === 0 ? outerR : innerR;
      const a = (i / (spikes * 2)) * Math.PI * 2 - Math.PI / 2;
      const x = Math.cos(a) * r;
      const y = Math.sin(a) * r;
      if (i === 0) starShape.moveTo(x, y);
      else starShape.lineTo(x, y);
    }
    starShape.lineTo(Math.cos(-Math.PI / 2) * outerR, Math.sin(-Math.PI / 2) * outerR);
    const starGeo = new THREE.ExtrudeGeometry(starShape, {
      depth: 0.025,
      bevelEnabled: true,
      bevelThickness: 0.006,
      bevelSize: 0.008,
      bevelSegments: 3,
    });
    starGeo.translate(0.25, 0.42, 0.6);
    const starL = new THREE.Mesh(starGeo, this.createPartMaterial('logo'));
    starL.castShadow = true;
    group.add(starL);
    this.partMeshes.logo.push(starL);

    const starR = starL.clone();
    starR.position.z = -0.6;
    starR.rotation.y = Math.PI;
    group.add(starR);
    this.partMeshes.logo.push(starR);
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

  updateDecalTransform(offsetX: number, offsetY: number, scale: number, rotation: number): void {
    this.config.decalOffsetX = offsetX;
    this.config.decalOffsetY = offsetY;
    this.config.decalScale = scale;
    this.config.decalRotation = rotation;
    this.applyDecalTransform();
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

    const positionsByModel: Array<Array<{ x: number; y: number; z: number; side: 'left' | 'right' }>> = [
      [
        { x: 0.0, y: 0.5, z: 0.54 },
        { x: 0.0, y: 0.5, z: -0.54 },
      ],
      [
        { x: 0.1, y: 0.7, z: 0.6 },
        { x: 0.1, y: 0.7, z: -0.6 },
      ],
      [
        { x: 0.25, y: 0.45, z: 0.62 },
        { x: 0.25, y: 0.45, z: -0.62 },
      ],
    ];

    const sizeByModel: Array<{ w: number; h: number }> = [
      { w: 0.65, h: 0.3 },
      { w: 0.5, h: 0.38 },
      { w: 0.55, h: 0.3 },
    ];

    const positions = positionsByModel[this.config.shoeModel] || positionsByModel[0];
    const size = sizeByModel[this.config.shoeModel] || sizeByModel[0];

    positions.forEach((pos) => {
      const geo = new THREE.PlaneGeometry(size.w, size.h, 16, 12);
      this.modifyVertices(geo, (p) => {
        const dist = Math.sqrt(p.x * p.x + p.y * p.y);
        const bend = Math.max(0, 1.0 - dist / 0.6) * 0.12;
        if (pos.side === 'left') p.z += bend;
        else p.z -= bend;
      });
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
      this.decalMeshes.push({
        mesh,
        side: pos.side,
        baseX: pos.x,
        baseY: pos.y,
        baseZ: pos.z,
        baseSize: size,
      });
    });

    this.applyDecalTransform();
  }

  private applyDecalTransform(): void {
    this.decalMeshes.forEach((d) => {
      d.mesh.position.x = d.baseX + this.config.decalOffsetX;
      d.mesh.position.y = d.baseY + this.config.decalOffsetY;
      d.mesh.scale.setScalar(this.config.decalScale);
      if (d.side === 'left') {
        d.mesh.rotation.z = (this.config.decalRotation * Math.PI) / 180;
      } else {
        d.mesh.rotation.z = -(this.config.decalRotation * Math.PI) / 180;
      }
    });
  }

  private applyMaterialToPart(partName: PartName, type: MaterialType): void {
    const meshes = this.partMeshes[partName];
    const colorKey = `${partName}Color` as keyof ShoeConfig;
    const color = hexToThreeColor(this.config[colorKey] as string);

    meshes.forEach((mesh) => {
      const oldMat = mesh.material as THREE.MeshPhysicalMaterial;
      const newMat = this.buildMaterial(color, type);
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

    await new Promise((resolve) => setTimeout(resolve, 80));

    const dpr = Math.min(window.devicePixelRatio, 2);
    const appEl = document.getElementById('app');
    if (!appEl) return;

    const rect = appEl.getBoundingClientRect();
    const width = Math.floor(rect.width * dpr);
    const height = Math.floor(rect.height * dpr);

    const canvas = document.createElement('canvas');
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
      try {
        const html2canvas = (await import('html2canvas')).default;
        const cardCanvas = await html2canvas(summaryCard, {
          backgroundColor: null,
          useCORS: true,
          scale: dpr,
          logging: false,
          windowWidth: summaryCard.clientWidth,
          windowHeight: summaryCard.clientHeight,
        });

        const sRect = summaryCard.getBoundingClientRect();
        const dx = Math.floor((sRect.left - rect.left) * dpr);
        const dy = Math.floor((sRect.top - rect.top) * dpr);
        ctx.drawImage(cardCanvas, dx, dy);
      } catch (e) {
        console.warn('html2canvas capture failed, fallback to manual draw', e);
        const sRect = summaryCard.getBoundingClientRect();
        const dx = Math.floor((sRect.left - rect.left) * dpr);
        const dy = Math.floor((sRect.top - rect.top) * dpr);
        const dw = Math.floor(sRect.width * dpr);
        const dh = Math.floor(sRect.height * dpr);
        const bg = window.getComputedStyle(summaryCard).backgroundColor;
        ctx.save();
        ctx.fillStyle = bg || 'rgba(35,39,64,0.65)';
        this.roundRect(ctx, dx, dy, dw, dh, 16 * dpr);
        ctx.fill();
        ctx.restore();
      }
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

    if (this.decalTexture) this.decalTexture.dispose();
    if (this.cachedSuedeNormal) this.cachedSuedeNormal.dispose();
    if (this.cachedSuedeBump) this.cachedSuedeBump.dispose();
    if (this.cachedMeshAlpha) this.cachedMeshAlpha.dispose();
    if (this.cachedMeshColor) this.cachedMeshColor.dispose();
  }
}
