import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { ShoeConfig, PartName, MaterialType, DEFAULT_CONFIG } from './types';
import { hexToThreeColor, getMaterialPreset, createDecalTexture, easeInOutCubic } from './utils';

interface PartMeshes {
  upper: THREE.Mesh[];
  sole: THREE.Mesh[];
  lace: THREE.Mesh[];
  logo: THREE.Mesh[];
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

export class ShoeConfigurator {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private controls: OrbitControls;
  private composer: EffectComposer;
  private currentModel: THREE.Group | null = null;
  private partMeshes: PartMeshes = { upper: [], sole: [], lace: [], logo: [] };
  private config: ShoeConfig = { ...DEFAULT_CONFIG };
  private animationId: number = 0;
  private autoRotate: boolean = true;
  private transitions: TransitionState[] = [];
  private decalTexture: THREE.Texture | null = null;
  private container: HTMLElement;
  private clock: THREE.Clock;

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

    this.partMeshes = { upper: [], sole: [], lace: [], logo: [] };
    this.config.shoeModel = modelId;

    const model = this.buildShoeGeometry(modelId);
    this.currentModel = model;
    this.scene.add(model);

    this.applyFullConfig();
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

    return new THREE.MeshPhysicalMaterial({
      ...preset,
      color,
    });
  }

  private buildRunner(group: THREE.Group): void {
    const upperGeo = new THREE.BoxGeometry(2.2, 0.9, 1.1, 8, 4, 4);
    this.modifyVertices(upperGeo, (pos) => {
      const x = pos.x;
      const y = pos.y;
      const z = pos.z;

      pos.x = x * (1.0 - y * 0.15);
      pos.y = y + 0.45;
      pos.z = z * (0.95 + y * 0.05);

      if (x > 0.5) {
        pos.x += (x - 0.5) * 0.3;
        pos.y -= Math.pow(x - 0.5, 2) * 0.15;
      }

      if (x < -0.7) {
        pos.y += (-x - 0.7) * 0.25;
        pos.z *= 1.0 - (-x - 0.7) * 0.15;
      }
    });
    const upper = new THREE.Mesh(upperGeo, this.createPartMaterial('upper'));
    upper.castShadow = true;
    group.add(upper);
    this.partMeshes.upper.push(upper);

    const soleGeo = new THREE.BoxGeometry(2.4, 0.25, 1.15, 8, 2, 4);
    this.modifyVertices(soleGeo, (pos) => {
      pos.y = pos.y - 0.12;
      if (pos.x > 0.8) {
        pos.y += (pos.x - 0.8) * 0.15;
      }
      if (pos.x < -0.8) {
        pos.y += (-pos.x - 0.8) * 0.1;
      }
    });
    const sole = new THREE.Mesh(soleGeo, this.createPartMaterial('sole'));
    sole.castShadow = true;
    group.add(sole);
    this.partMeshes.sole.push(sole);

    const treadGeo = new THREE.CylinderGeometry(0.55, 0.55, 2.3, 16, 1, false, -Math.PI / 2, Math.PI);
    this.modifyVertices(treadGeo, (pos) => {
      pos.x = pos.y;
      pos.y = pos.z - 0.24;
      pos.z = pos.x;
      pos.y -= 0.02;
    });

    for (let i = 0; i < 4; i++) {
      const laceGeo = new THREE.BoxGeometry(0.06, 0.04, 1.0);
      const lace = new THREE.Mesh(laceGeo, this.createPartMaterial('lace'));
      lace.position.set(-0.3 + i * 0.25, 0.92, 0);
      group.add(lace);
      this.partMeshes.lace.push(lace);
    }

    const logoGeo = new THREE.BoxGeometry(0.8, 0.3, 0.02);
    const logo = new THREE.Mesh(logoGeo, this.createPartMaterial('logo'));
    logo.position.set(0, 0.55, 0.56);
    group.add(logo);
    this.partMeshes.logo.push(logo);

    const logoSide = new THREE.Mesh(logoGeo.clone(), this.createPartMaterial('logo'));
    logoSide.position.set(0, 0.55, -0.56);
    logoSide.rotation.y = Math.PI;
    group.add(logoSide);
    this.partMeshes.logo.push(logoSide);
  }

  private buildHighTop(group: THREE.Group): void {
    const upperGeo = new THREE.BoxGeometry(2.0, 1.4, 1.2, 6, 6, 4);
    this.modifyVertices(upperGeo, (pos) => {
      const y = pos.y;
      pos.x = pos.x * (1.0 - Math.max(0, y) * 0.1);
      pos.y = y + 0.7;
      pos.z = pos.z * (1.0 - Math.max(0, y) * 0.08);

      if (pos.x < -0.5) {
        pos.y += (-pos.x - 0.5) * 0.35;
      }
    });
    const upper = new THREE.Mesh(upperGeo, this.createPartMaterial('upper'));
    upper.castShadow = true;
    group.add(upper);
    this.partMeshes.upper.push(upper);

    const collarGeo = new THREE.CylinderGeometry(0.48, 0.55, 0.3, 16);
    const collar = new THREE.Mesh(collarGeo, this.createPartMaterial('upper'));
    collar.position.set(-0.6, 1.5, 0);
    group.add(collar);
    this.partMeshes.upper.push(collar);

    const soleGeo = new THREE.BoxGeometry(2.2, 0.35, 1.3, 6, 2, 4);
    this.modifyVertices(soleGeo, (pos) => {
      pos.y = pos.y - 0.17;
    });
    const sole = new THREE.Mesh(soleGeo, this.createPartMaterial('sole'));
    sole.castShadow = true;
    group.add(sole);
    this.partMeshes.sole.push(sole);

    const midsoleGeo = new THREE.BoxGeometry(2.15, 0.15, 1.25);
    const midsole = new THREE.Mesh(midsoleGeo, this.createPartMaterial('sole'));
    midsole.position.y = 0.07;
    group.add(midsole);
    this.partMeshes.sole.push(midsole);

    for (let i = 0; i < 5; i++) {
      const laceGeo = new THREE.BoxGeometry(0.06, 0.04, 1.05);
      const lace = new THREE.Mesh(laceGeo, this.createPartMaterial('lace'));
      lace.position.set(-0.2 + i * 0.2, 1.2 + i * 0.08, 0);
      group.add(lace);
      this.partMeshes.lace.push(lace);
    }

    const logoGeo = new THREE.BoxGeometry(0.7, 0.5, 0.02);
    const logo = new THREE.Mesh(logoGeo, this.createPartMaterial('logo'));
    logo.position.set(0.1, 0.7, 0.61);
    group.add(logo);
    this.partMeshes.logo.push(logo);

    const logoSide = new THREE.Mesh(logoGeo.clone(), this.createPartMaterial('logo'));
    logoSide.position.set(0.1, 0.7, -0.61);
    logoSide.rotation.y = Math.PI;
    group.add(logoSide);
    this.partMeshes.logo.push(logoSide);
  }

  private buildSkate(group: THREE.Group): void {
    const upperGeo = new THREE.BoxGeometry(2.4, 0.65, 1.2, 8, 4, 4);
    this.modifyVertices(upperGeo, (pos) => {
      const y = pos.y;
      pos.y = y + 0.33;

      if (pos.x < -0.6) {
        pos.y += (-pos.x - 0.6) * 0.12;
      }
      if (pos.x > 0.6) {
        pos.y -= (pos.x - 0.6) * 0.08;
      }
    });
    const upper = new THREE.Mesh(upperGeo, this.createPartMaterial('upper'));
    upper.castShadow = true;
    group.add(upper);
    this.partMeshes.upper.push(upper);

    const toeCapGeo = new THREE.SphereGeometry(0.6, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2);
    this.modifyVertices(toeCapGeo, (pos) => {
      pos.x = pos.x * 1.0 + 1.0;
      pos.y = pos.y * 0.5 + 0.0;
      pos.z = pos.z * 1.0;
    });
    const toeCap = new THREE.Mesh(toeCapGeo, this.createPartMaterial('upper'));
    toeCap.position.set(0.4, 0.05, 0);
    group.add(toeCap);
    this.partMeshes.upper.push(toeCap);

    const soleGeo = new THREE.BoxGeometry(2.6, 0.2, 1.25, 8, 2, 4);
    this.modifyVertices(soleGeo, (pos) => {
      pos.y = pos.y - 0.1;
      pos.x *= 1.02;
    });
    const sole = new THREE.Mesh(soleGeo, this.createPartMaterial('sole'));
    sole.castShadow = true;
    group.add(sole);
    this.partMeshes.sole.push(sole);

    for (let i = 0; i < 3; i++) {
      const laceGeo = new THREE.BoxGeometry(0.06, 0.03, 1.05);
      const lace = new THREE.Mesh(laceGeo, this.createPartMaterial('lace'));
      lace.position.set(-0.2 + i * 0.3, 0.67, 0);
      group.add(lace);
      this.partMeshes.lace.push(lace);
    }

    const logoGeo = new THREE.BoxGeometry(1.0, 0.25, 0.02);
    const logo = new THREE.Mesh(logoGeo, this.createPartMaterial('logo'));
    logo.position.set(0.2, 0.4, 0.61);
    group.add(logo);
    this.partMeshes.logo.push(logo);

    const logoSide = new THREE.Mesh(logoGeo.clone(), this.createPartMaterial('logo'));
    logoSide.position.set(0.2, 0.4, -0.61);
    logoSide.rotation.y = Math.PI;
    group.add(logoSide);
    this.partMeshes.logo.push(logoSide);
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

    this.config[colorKey] = color;

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
  }

  updateMaterial(partName: PartName, type: MaterialType): void {
    const materialKey = `${partName}Material` as keyof ShoeConfig;
    const colorKey = `${partName}Color` as keyof ShoeConfig;

    this.config[materialKey] = type;

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
  }

  updateTexture(image: HTMLImageElement): void {
    if (this.decalTexture) {
      this.decalTexture.dispose();
    }

    this.decalTexture = createDecalTexture(image);
    this.config.decalImage = image.src;

    this.partMeshes.upper.forEach((mesh) => {
      const mat = mesh.material as THREE.MeshPhysicalMaterial;
      mat.map = this.decalTexture;
      mat.needsUpdate = true;
    });
  }

  removeTexture(): void {
    if (this.decalTexture) {
      this.decalTexture.dispose();
      this.decalTexture = null;
    }
    this.config.decalImage = null;

    this.partMeshes.upper.forEach((mesh) => {
      const mat = mesh.material as THREE.MeshPhysicalMaterial;
      mat.map = null;
      mat.needsUpdate = true;
    });
  }

  private applyMaterialToPart(partName: PartName, type: MaterialType): void {
    const meshes = this.partMeshes[partName];
    const colorKey = `${partName}Color` as keyof ShoeConfig;
    const color = hexToThreeColor(this.config[colorKey] as string);
    const preset = getMaterialPreset(type);

    meshes.forEach((mesh) => {
      const oldMat = mesh.material as THREE.MeshPhysicalMaterial;
      const newMat = new THREE.MeshPhysicalMaterial({
        ...preset,
        color,
        map: oldMat.map || null,
      });
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
    const html2canvas = (await import('html2canvas')).default;
    const appEl = document.getElementById('app');
    if (!appEl) return;

    const canvas = await html2canvas(appEl, {
      backgroundColor: '#1a1d2e',
      useCORS: true,
      scale: 2,
    });

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.save();
      ctx.globalAlpha = 0.15;
      ctx.font = '18px Orbitron, sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate(-Math.PI / 6);
      const text = 'SHOE CONFIGURATOR';
      const metrics = ctx.measureText(text);
      for (let row = -5; row <= 5; row++) {
        for (let col = -3; col <= 3; col++) {
          ctx.fillText(text, col * (metrics.width + 40), row * 50);
        }
      }
      ctx.restore();
    }

    const link = document.createElement('a');
    link.download = `shoe-config-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
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
