import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { MoleculeBuilder, DisplayMode } from './MoleculeBuilder';
import { ReactionAnimator } from './ReactionAnimator';
import { MoleculeData, getMolecule, getReaction } from '../data/MoleculeData';

export class SceneManager {
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public renderer: THREE.WebGLRenderer;
  public controls: OrbitControls;

  private container: HTMLElement;
  private moleculeBuilder: MoleculeBuilder;
  private reactionAnimator: ReactionAnimator;
  private currentMolecule: THREE.Group | null = null;
  private reactionGroup: THREE.Group | null = null;
  private stars: THREE.Points | null = null;

  private displayMode: DisplayMode = 'ball-stick';
  private labelsVisible: boolean = false;
  private autoRotate: boolean = true;
  private isReactionMode: boolean = false;
  private animationFrameId: number = 0;
  private clock: THREE.Clock;

  private onReactionCompleteCallback: ((equation: string, productName: string) => void) | null = null;
  private currentReactionEquation: string = '';
  private currentProductName: string = '';

  constructor(container: HTMLElement) {
    this.container = container;
    this.clock = new THREE.Clock();

    this.scene = new THREE.Scene();
    this.scene.background = null;
    this.scene.fog = new THREE.FogExp2(0x0a0a1f, 0.02);

    this.camera = new THREE.PerspectiveCamera(
      60,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    this.camera.position.set(0, 2, 10);

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      preserveDrawingBuffer: true,
    });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;

    container.appendChild(this.renderer.domElement);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.autoRotate = true;
    this.controls.autoRotateSpeed = 0.8;
    this.controls.minDistance = 2;
    this.controls.maxDistance = 30;
    this.controls.enablePan = true;

    this.moleculeBuilder = new MoleculeBuilder();
    this.reactionAnimator = new ReactionAnimator(this.moleculeBuilder);

    this.setupLights();
    this.createStars();
    this.setupResizeHandler();
    this.startRenderLoop();
  }

  private setupLights(): void {
    const ambientLight = new THREE.AmbientLight(0x404060, 0.4);
    this.scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xaaccff, 0.8);
    keyLight.position.set(-5, 8, 5);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    this.scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xffddaa, 0.5);
    fillLight.position.set(6, 3, -5);
    this.scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0x6666ff, 0.3);
    rimLight.position.set(0, -5, -8);
    this.scene.add(rimLight);
  }

  private createStars(): void {
    const starCount = 500;
    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount; i++) {
      const radius = 50 + Math.random() * 50;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = radius * Math.cos(phi);

      const brightness = 0.5 + Math.random() * 0.5;
      colors[i * 3] = brightness;
      colors[i * 3 + 1] = brightness;
      colors[i * 3 + 2] = brightness * 1.1;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 0.3,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      sizeAttenuation: true,
    });

    this.stars = new THREE.Points(geometry, material);
    this.scene.add(this.stars);
  }

  private setupResizeHandler(): void {
    window.addEventListener('resize', () => {
      this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    });
  }

  private startRenderLoop(): void {
    const animate = () => {
      this.animationFrameId = requestAnimationFrame(animate);

      const delta = this.clock.getDelta();

      this.controls.update();

      if (this.stars) {
        this.stars.rotation.y += delta * 0.01;
      }

      if (this.isReactionMode && this.reactionAnimator.getIsRunning()) {
        const completed = this.reactionAnimator.update(delta);
        if (completed && this.onReactionCompleteCallback) {
          this.onReactionCompleteCallback(this.currentReactionEquation, this.currentProductName);
          this.highlightProduct();
        }
      }

      this.renderer.render(this.scene, this.camera);
    };

    animate();
  }

  public showMolecule(name: string): boolean {
    const data = getMolecule(name);
    if (!data) return false;

    this.clearMolecule();
    this.isReactionMode = false;

    this.currentMolecule = this.moleculeBuilder.build(data, this.displayMode);
    this.scene.add(this.currentMolecule);

    this.centerCameraOnMolecule(this.currentMolecule);
    this.updateLabels();

    return true;
  }

  public startReaction(reactant1: string, reactant2: string): boolean {
    const reaction = getReaction(reactant1, reactant2);
    if (!reaction) return false;

    const r1Data = getMolecule(reactant1);
    const r2Data = getMolecule(reactant2);
    if (!r1Data || !r2Data) return false;

    this.clearMolecule();
    this.isReactionMode = true;
    this.currentReactionEquation = reaction.equation;
    this.currentProductName = reaction.product;

    const reactionGroup = this.reactionAnimator.start(
      r1Data,
      r2Data,
      reaction.product,
      this.displayMode
    );

    if (reactionGroup) {
      this.reactionGroup = reactionGroup;
      this.scene.add(reactionGroup);
      this.camera.position.set(0, 2, 14);
      this.controls.target.set(0, 0, 0);
    }

    this.reactionAnimator.onComplete(() => {
      if (this.onReactionCompleteCallback) {
        this.onReactionCompleteCallback(reaction.equation, reaction.product);
      }
    });

    return true;
  }

  private highlightProduct(): void {
    if (this.reactionGroup) {
      const atomsGroup = this.reactionGroup.getObjectByName('atoms');
      if (atomsGroup) {
        let pulsePhase = 0;
        const pulse = () => {
          pulsePhase += 0.05;
          const intensity = 0.2 + 0.15 * Math.sin(pulsePhase);
          atomsGroup.traverse((child) => {
            if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshStandardMaterial) {
              child.material.emissive = new THREE.Color(0x00ffff);
              child.material.emissiveIntensity = intensity;
            }
          });
          if (pulsePhase < Math.PI * 3) {
            requestAnimationFrame(pulse);
          }
        };
        pulse();
      }
    }
  }

  public onReactionComplete(callback: (equation: string, productName: string) => void): void {
    this.onReactionCompleteCallback = callback;
  }

  private clearMolecule(): void {
    if (this.currentMolecule) {
      this.scene.remove(this.currentMolecule);
      this.disposeGroup(this.currentMolecule);
      this.currentMolecule = null;
    }
    if (this.reactionGroup) {
      this.scene.remove(this.reactionGroup);
      this.reactionAnimator.dispose();
      this.reactionGroup = null;
    }
  }

  private disposeGroup(group: THREE.Group): void {
    group.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
          if (Array.isArray(obj.material)) {
            obj.material.forEach((m) => m.dispose());
          } else {
            obj.material.dispose();
          }
        }
      }
    });
  }

  private centerCameraOnMolecule(group: THREE.Group): void {
    const box = new THREE.Box3().setFromObject(group);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());

    const maxDim = Math.max(size.x, size.y, size.z);
    const fov = this.camera.fov * (Math.PI / 180);
    let distance = maxDim / (2 * Math.tan(fov / 2));
    distance *= 1.5;

    this.camera.position.set(distance * 0.5, distance * 0.4, distance);
    this.controls.target.copy(center);
    this.controls.update();

    this.controls.minDistance = distance * 0.5;
    this.controls.maxDistance = distance * 4;
  }

  public setDisplayMode(mode: DisplayMode): void {
    this.displayMode = mode;

    if (this.currentMolecule && !this.isReactionMode) {
      this.moleculeBuilder.setDisplayMode(this.currentMolecule, mode);
    }
  }

  public getDisplayMode(): DisplayMode {
    return this.displayMode;
  }

  public setLabelsVisible(visible: boolean): void {
    this.labelsVisible = visible;
    this.updateLabels();
  }

  public getLabelsVisible(): boolean {
    return this.labelsVisible;
  }

  private updateLabels(): void {
    const group = this.currentMolecule;
    if (!group) return;

    const atomsGroup = group.getObjectByName('atoms');
    if (!atomsGroup) return;

    let labelGroup = group.getObjectByName('labels') as THREE.Group;
    if (!labelGroup) {
      labelGroup = new THREE.Group();
      labelGroup.name = 'labels';
      group.add(labelGroup);
    }

    while (labelGroup.children.length > 0) {
      const child = labelGroup.children[0];
      labelGroup.remove(child);
      if (child instanceof THREE.Sprite) {
        if (child.material) {
          if (child.material instanceof THREE.Material) {
            child.material.dispose();
          }
        }
        if (child.material instanceof THREE.SpriteMaterial && child.material.map) {
          child.material.map.dispose();
        }
      }
    }

    if (!this.labelsVisible) return;

    const userData = (group as any).userData;
    const data: MoleculeData = userData?.moleculeData;
    if (!data) return;

    for (let i = 0; i < data.atoms.length; i++) {
      const atom = data.atoms[i];
      const label = this.createLabelSprite(atom.element);
      label.position.set(atom.position[0], atom.position[1] + 0.5, atom.position[2]);
      labelGroup.add(label);
    }
  }

  private createLabelSprite(text: string): THREE.Sprite {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d')!;
    canvas.width = 128;
    canvas.height = 64;

    context.font = 'bold 36px sans-serif';
    context.textAlign = 'center';
    context.textBaseline = 'middle';

    context.shadowColor = 'rgba(0, 0, 0, 0.8)';
    context.shadowBlur = 4;
    context.shadowOffsetX = 1;
    context.shadowOffsetY = 1;

    context.fillStyle = 'white';
    context.fillText(text, 64, 32);

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;

    const material = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthTest: false,
    });

    const sprite = new THREE.Sprite(material);
    sprite.scale.set(0.8, 0.4, 1);
    sprite.renderOrder = 999;

    return sprite;
  }

  public setAutoRotate(enabled: boolean): void {
    this.autoRotate = enabled;
    this.controls.autoRotate = enabled;
  }

  public getAutoRotate(): boolean {
    return this.autoRotate;
  }

  public resetCamera(): void {
    if (this.currentMolecule && !this.isReactionMode) {
      this.centerCameraOnMolecule(this.currentMolecule);
    } else {
      this.camera.position.set(0, 2, 10);
      this.controls.target.set(0, 0, 0);
    }
    this.controls.update();
  }

  public getRendererDomElement(): HTMLCanvasElement {
    return this.renderer.domElement;
  }

  public getIsReactionMode(): boolean {
    return this.isReactionMode;
  }

  public getIsReactionRunning(): boolean {
    return this.reactionAnimator.getIsRunning();
  }

  public dispose(): void {
    cancelAnimationFrame(this.animationFrameId);
    this.clearMolecule();
    this.moleculeBuilder.dispose();
    this.reactionAnimator.dispose();
    if (this.stars) {
      this.scene.remove(this.stars);
      if (this.stars.geometry) this.stars.geometry.dispose();
      const mat = this.stars.material;
      if (mat) {
        if (Array.isArray(mat)) {
          mat.forEach((m) => m.dispose());
        } else {
          mat.dispose();
        }
      }
    }
    this.renderer.dispose();
    this.controls.dispose();
  }
}
