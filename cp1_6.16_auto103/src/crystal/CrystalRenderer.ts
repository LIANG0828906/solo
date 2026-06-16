import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import { CrystalStructure, AtomData, BondData } from './CrystalStructure';
import { eventBus } from '@/EventBus';

interface AnimationState {
  targetScale: number;
  currentScale: number;
  startScale: number;
  startTime: number;
  duration: number;
}

interface ColorTransition {
  startColor: THREE.Color;
  targetColor: THREE.Color;
  startTime: number;
  duration: number;
}

export class CrystalRenderer {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private cssRenderer: CSS2DRenderer;
  private controls: OrbitControls;
  private crystalGroup: THREE.Group;
  private atomMeshes: Map<number, THREE.Mesh> = new Map();
  private bondMeshes: Map<number, THREE.Mesh> = new Map();
  private glowMeshes: Map<number, THREE.Mesh> = new Map();
  private labelObjects: Map<number, CSS2DObject> = new Map();
  private infoLabel: CSS2DObject | null = null;

  private atomGeometry: THREE.SphereGeometry;
  private bondGeometry: THREE.CylinderGeometry;

  private selectedAtomId: number | null = null;
  private hoveredAtomId: number | null = null;
  private draggingAtomId: number | null = null;

  private atomAnimations: Map<number, AnimationState> = new Map();
  private colorTransitions: Map<number, ColorTransition> = new Map();

  private autoRotate: boolean = false;
  private autoRotateSpeed: number = 0.01;
  private isAnimatingGrowth: boolean = false;

  private frameCount: number = 0;
  private lastFpsTime: number = 0;
  private currentFps: number = 0;
  private fpsCallback: ((fps: number) => void) | null = null;

  private container: HTMLElement;

  constructor(container: HTMLElement, private crystalStructure: CrystalStructure) {
    this.container = container;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x000000);

    const width = container.clientWidth;
    const height = container.clientHeight;

    this.camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    this.camera.position.set(5, 4, 6);
    this.camera.lookAt(0, 0, 0);

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(width, height);
    this.renderer.shadowMap.enabled = true;
    container.appendChild(this.renderer.domElement);

    this.cssRenderer = new CSS2DRenderer();
    this.cssRenderer.setSize(width, height);
    const cssDom = this.cssRenderer.domElement;
    cssDom.style.position = 'absolute';
    cssDom.style.top = '0';
    cssDom.style.left = '0';
    cssDom.style.pointerEvents = 'none';
    container.appendChild(cssDom);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;

    this.crystalGroup = new THREE.Group();
    this.scene.add(this.crystalGroup);

    this.atomGeometry = new THREE.SphereGeometry(0.2, 32, 32);
    this.bondGeometry = new THREE.CylinderGeometry(0.04, 0.04, 1, 8);

    this.setupLights();
    this.setupEventListeners();
    this.buildScene();

    window.addEventListener('resize', this.onWindowResize.bind(this));
    this.animate();
  }

  private setupLights(): void {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 10, 7);
    directionalLight.castShadow = true;
    this.scene.add(directionalLight);

    const pointLight = new THREE.PointLight(0x00BFFF, 0.3);
    pointLight.position.set(-5, 3, -5);
    this.scene.add(pointLight);
  }

  private setupEventListeners(): void {
    eventBus.on('crystal:updated', () => this.buildScene());
    eventBus.on('atom:selected', ({ atomId, position }: { atomId: number; position: { x: number; y: number; z: number } }) => {
      this.setSelectedAtom(atomId);
      this.showInfoLabel(atomId, position);
    });
    eventBus.on('atom:hovered', ({ atomId, isHover }: { atomId: number; isHover: boolean }) => {
      this.setHoveredAtom(isHover ? atomId : null);
    });
    eventBus.on('atom:dragStart', ({ atomId }: { atomId: number }) => {
      this.draggingAtomId = atomId;
      this.setDraggingHighlight(atomId, true);
    });
    eventBus.on('atom:dragMove', ({ atomId, position }: { atomId: number; position: { x: number; y: number; z: number } }) => {
      this.updateAtomMeshPosition(atomId, position);
    });
    eventBus.on('atom:dragEnd', ({ atomId, position }: { atomId: number; position: { x: number; y: number; z: number } }) => {
      this.draggingAtomId = null;
      this.setDraggingHighlight(atomId, false);
      this.animateSpringBack(atomId, position);
    });
    eventBus.on('atom:colorChange', ({ atomId, color }: { atomId: number; color: string }) => {
      this.animateColorChange(atomId, color);
    });
    eventBus.on('crystal:growth', () => {
      this.triggerGrowthAnimation();
    });
  }

  private buildScene(): void {
    this.clearScene();

    const atoms = this.crystalStructure.getAllAtoms();
    const bonds = this.crystalStructure.getAllBonds();

    atoms.forEach(atom => {
      this.createAtomMesh(atom);
    });

    bonds.forEach(bond => {
      this.createBondMesh(bond);
    });

    eventBus.emit('scene:atomCount', { count: atoms.length });
  }

  private clearScene(): void {
    this.atomMeshes.forEach(mesh => {
      this.crystalGroup.remove(mesh);
      if (mesh.material instanceof THREE.Material) {
        mesh.material.dispose();
      }
    });
    this.bondMeshes.forEach(mesh => {
      this.crystalGroup.remove(mesh);
      if (mesh.material instanceof THREE.Material) {
        mesh.material.dispose();
      }
    });
    this.glowMeshes.forEach(mesh => {
      this.crystalGroup.remove(mesh);
      if (mesh.material instanceof THREE.Material) {
        mesh.material.dispose();
      }
    });
    this.labelObjects.forEach(label => {
      this.crystalGroup.remove(label);
    });
    if (this.infoLabel) {
      this.crystalGroup.remove(this.infoLabel);
      this.infoLabel = null;
    }

    this.atomMeshes.clear();
    this.bondMeshes.clear();
    this.glowMeshes.clear();
    this.labelObjects.clear();
    this.atomAnimations.clear();
    this.colorTransitions.clear();
  }

  private createAtomMesh(atom: AtomData): void {
    const material = new THREE.MeshPhongMaterial({
      color: new THREE.Color(atom.color),
      transparent: true,
      opacity: 0.85,
      shininess: 100,
      specular: new THREE.Color(0x666666),
      specularIntensity: 0.6
    });

    const mesh = new THREE.Mesh(this.atomGeometry, material);
    mesh.position.set(atom.position.x, atom.position.y, atom.position.z);
    mesh.userData.atomId = atom.id;
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    if (this.isAnimatingGrowth) {
      mesh.scale.set(0, 0, 0);
      this.atomAnimations.set(atom.id, {
        targetScale: 1,
        currentScale: 0,
        startScale: 0,
        startTime: performance.now(),
        duration: 500
      });
    }

    this.atomMeshes.set(atom.id, mesh);
    this.crystalGroup.add(mesh);

    this.createGlowMesh(atom);
  }

  private createGlowMesh(atom: AtomData): void {
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: new THREE.Color(atom.color),
      transparent: true,
      opacity: 0,
      side: THREE.BackSide
    });

    const glowMesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.2 + 0.2, 32, 32),
      glowMaterial
    );
    glowMesh.position.set(atom.position.x, atom.position.y, atom.position.z);
    glowMesh.userData.atomId = atom.id;
    glowMesh.visible = false;

    this.glowMeshes.set(atom.id, glowMesh);
    this.crystalGroup.add(glowMesh);
  }

  private createBondMesh(bond: BondData): void {
    const atomA = this.crystalStructure.getAtom(bond.atomA);
    const atomB = this.crystalStructure.getAtom(bond.atomB);
    if (!atomA || !atomB) return;

    const start = new THREE.Vector3(atomA.position.x, atomA.position.y, atomA.position.z);
    const end = new THREE.Vector3(atomB.position.x, atomB.position.y, atomB.position.z);
    const direction = end.clone().sub(start);
    const length = direction.length();
    const radius = bond.isEdited ? 0.04 : 0.04;
    const finalRadius = bond.isEdited ? radius * 0.5 : radius;

    const material = new THREE.MeshPhongMaterial({
      color: 0xcccccc,
      transparent: true,
      opacity: 0.7
    });

    const geometry = new THREE.CylinderGeometry(finalRadius, finalRadius, length, 8);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.userData.bondId = bond.id;
    mesh.userData.atomA = bond.atomA;
    mesh.userData.atomB = bond.atomB;

    mesh.position.copy(start.clone().add(end).multiplyScalar(0.5));
    mesh.quaternion.setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      direction.clone().normalize()
    );

    this.bondMeshes.set(bond.id, mesh);
    this.crystalGroup.add(mesh);
  }

  private updateBondMeshesForAtom(atomId: number): void {
    this.bondMeshes.forEach((mesh, bondId) => {
      if (mesh.userData.atomA === atomId || mesh.userData.atomB === atomId) {
        const bond = this.crystalStructure.getAllBonds().find(b => b.id === bondId);
        if (!bond) return;
        const atomA = this.crystalStructure.getAtom(bond.atomA);
        const atomB = this.crystalStructure.getAtom(bond.atomB);
        if (!atomA || !atomB) return;

        const start = new THREE.Vector3(atomA.position.x, atomA.position.y, atomA.position.z);
        const end = new THREE.Vector3(atomB.position.x, atomB.position.y, atomB.position.z);
        const direction = end.clone().sub(start);
        const length = direction.length();

        const finalRadius = bond.isEdited ? 0.02 : 0.04;
        if (mesh.geometry instanceof THREE.CylinderGeometry) {
          mesh.geometry.dispose();
        }
        mesh.geometry = new THREE.CylinderGeometry(finalRadius, finalRadius, length, 8);
        mesh.position.copy(start.clone().add(end).multiplyScalar(0.5));
        mesh.quaternion.setFromUnitVectors(
          new THREE.Vector3(0, 1, 0),
          direction.clone().normalize()
        );
      }
    });
  }

  setSelectedAtom(atomId: number | null): void {
    if (this.selectedAtomId !== null && this.selectedAtomId !== atomId) {
      const prevMesh = this.atomMeshes.get(this.selectedAtomId);
      const prevAtom = this.crystalStructure.getAtom(this.selectedAtomId);
      if (prevMesh && prevMesh.material instanceof THREE.MeshPhongMaterial && prevAtom) {
        this.animateColorChange(this.selectedAtomId, prevAtom.color);
      }
    }

    this.selectedAtomId = atomId;

    if (atomId !== null) {
      const mesh = this.atomMeshes.get(atomId);
      if (mesh && mesh.material instanceof THREE.MeshPhongMaterial) {
        this.animateColorChange(atomId, '#00BFFF');
      }
    }
  }

  setHoveredAtom(atomId: number | null): void {
    if (this.hoveredAtomId !== null && this.hoveredAtomId !== atomId) {
      const prevMesh = this.atomMeshes.get(this.hoveredAtomId);
      const prevGlow = this.glowMeshes.get(this.hoveredAtomId);
      if (prevMesh) {
        prevMesh.scale.set(1, 1, 1);
      }
      if (prevGlow) {
        prevGlow.visible = false;
        if (prevGlow.material instanceof THREE.MeshBasicMaterial) {
          prevGlow.material.opacity = 0;
        }
      }
    }

    this.hoveredAtomId = atomId;

    if (atomId !== null && atomId !== this.draggingAtomId) {
      const mesh = this.atomMeshes.get(atomId);
      const glow = this.glowMeshes.get(atomId);
      const atom = this.crystalStructure.getAtom(atomId);
      if (mesh) {
        mesh.scale.set(1.2, 1.2, 1.2);
      }
      if (glow && atom) {
        glow.visible = true;
        if (glow.material instanceof THREE.MeshBasicMaterial) {
          glow.material.color.set(atom.color);
          glow.material.opacity = 0.4;
        }
      }
    }
  }

  setDraggingHighlight(atomId: number, isDragging: boolean): void {
    const mesh = this.atomMeshes.get(atomId);
    if (mesh && mesh.material instanceof THREE.MeshPhongMaterial) {
      if (isDragging) {
        mesh.material.color.set('#FFD700');
      } else {
        const atom = this.crystalStructure.getAtom(atomId);
        if (atom) {
          mesh.material.color.set(atom.color);
        }
      }
    }

    const connectedBonds = this.getBondsForAtom(atomId);
    connectedBonds.forEach(bondId => {
      const bondMesh = this.bondMeshes.get(bondId);
      if (bondMesh && bondMesh.material instanceof THREE.MeshPhongMaterial) {
        if (isDragging) {
          bondMesh.material.color.set('#FF4500');
          bondMesh.material.opacity = 1;
        } else {
          bondMesh.material.color.set(0xcccccc);
          bondMesh.material.opacity = 0.7;
        }
      }
    });
  }

  private getBondsForAtom(atomId: number): number[] {
    const result: number[] = [];
    this.bondMeshes.forEach((mesh, bondId) => {
      if (mesh.userData.atomA === atomId || mesh.userData.atomB === atomId) {
        result.push(bondId);
      }
    });
    return result;
  }

  updateAtomMeshPosition(atomId: number, position: { x: number; y: number; z: number }): void {
    const mesh = this.atomMeshes.get(atomId);
    const glow = this.glowMeshes.get(atomId);
    if (mesh) {
      mesh.position.set(position.x, position.y, position.z);
    }
    if (glow) {
      glow.position.set(position.x, position.y, position.z);
    }
    this.updateBondMeshesForAtom(atomId);
  }

  animateColorChange(atomId: number, targetColorHex: string): void {
    const mesh = this.atomMeshes.get(atomId);
    if (!mesh || !(mesh.material instanceof THREE.MeshPhongMaterial)) return;

    const targetColor = new THREE.Color(targetColorHex);
    const startColor = mesh.material.color.clone();

    this.colorTransitions.set(atomId, {
      startColor,
      targetColor,
      startTime: performance.now(),
      duration: 300
    });
  }

  animateSpringBack(atomId: number, targetPos: { x: number; y: number; z: number }): void {
    const mesh = this.atomMeshes.get(atomId);
    if (!mesh) return;

    const startTime = performance.now();
    const startPos = mesh.position.clone();
    const endPos = new THREE.Vector3(targetPos.x, targetPos.y, targetPos.z);
    const duration = 300;

    const animateSpring = () => {
      const elapsed = performance.now() - startTime;
      if (elapsed >= duration) {
        mesh.position.copy(endPos);
        const glow = this.glowMeshes.get(atomId);
        if (glow) {
          glow.position.copy(endPos);
        }
        return;
      }

      const t = elapsed / duration;
      const elastic = this.easeOutElastic(t);
      mesh.position.lerpVectors(startPos, endPos, elastic);

      const glow = this.glowMeshes.get(atomId);
      if (glow) {
        glow.position.copy(mesh.position);
      }

      this.updateBondMeshesForAtom(atomId);
      requestAnimationFrame(animateSpring);
    };

    animateSpring();
  }

  private easeOutElastic(t: number): number {
    const c4 = (2 * Math.PI) / 3;
    return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
  }

  triggerGrowthAnimation(): void {
    this.isAnimatingGrowth = true;
    this.autoRotate = false;

    this.atomMeshes.forEach((mesh, atomId) => {
      mesh.scale.set(0, 0, 0);
      this.atomAnimations.set(atomId, {
        targetScale: 1,
        currentScale: 0,
        startScale: 0,
        startTime: performance.now() + Math.random() * 300,
        duration: 500
      });
    });

    setTimeout(() => {
      this.isAnimatingGrowth = false;
      this.autoRotate = true;
    }, 1000);
  }

  private showInfoLabel(atomId: number, position: { x: number; y: number; z: number }): void {
    if (this.infoLabel) {
      this.crystalGroup.remove(this.infoLabel);
    }

    const div = document.createElement('div');
    div.style.color = '#00BFFF';
    div.style.fontSize = '12px';
    div.style.padding = '4px 8px';
    div.style.background = 'rgba(0, 0, 0, 0.7)';
    div.style.borderRadius = '4px';
    div.style.border = '1px solid #00BFFF';
    div.style.pointerEvents = 'none';
    div.style.whiteSpace = 'nowrap';
    div.textContent = `x: ${position.x.toFixed(2)}, y: ${position.y.toFixed(2)}, z: ${position.z.toFixed(2)}`;

    this.infoLabel = new CSS2DObject(div);
    this.infoLabel.position.set(position.x, position.y + 0.5, position.z);
    this.crystalGroup.add(this.infoLabel);
  }

  setFpsCallback(callback: (fps: number) => void): void {
    this.fpsCallback = callback;
  }

  getAtomMeshes(): THREE.Mesh[] {
    return Array.from(this.atomMeshes.values());
  }

  getAtomIdFromMesh(mesh: THREE.Object3D): number | null {
    if (mesh instanceof THREE.Mesh && typeof mesh.userData.atomId === 'number') {
      return mesh.userData.atomId;
    }
    return null;
  }

  getRenderer(): THREE.WebGLRenderer {
    return this.renderer;
  }

  getCamera(): THREE.PerspectiveCamera {
    return this.camera;
  }

  getControls(): OrbitControls {
    return this.controls;
  }

  private onWindowResize(): void {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(width, height);
    this.cssRenderer.setSize(width, height);
  }

  private animate(): void {
    requestAnimationFrame(this.animate.bind(this));

    const now = performance.now();
    this.frameCount++;
    if (now - this.lastFpsTime >= 1000) {
      this.currentFps = this.frameCount;
      this.frameCount = 0;
      this.lastFpsTime = now;
      if (this.fpsCallback) {
        this.fpsCallback(this.currentFps);
      }
    }

    this.atomAnimations.forEach((anim, atomId) => {
      const mesh = this.atomMeshes.get(atomId);
      if (!mesh) return;

      if (now >= anim.startTime) {
        const elapsed = now - anim.startTime;
        const t = Math.min(elapsed / anim.duration, 1);
        const eased = 1 - Math.pow(1 - t, 3);
        const scale = anim.startScale + (anim.targetScale - anim.startScale) * eased;
        mesh.scale.set(scale, scale, scale);

        if (t >= 1) {
          this.atomAnimations.delete(atomId);
        }
      }
    });

    this.colorTransitions.forEach((trans, atomId) => {
      const mesh = this.atomMeshes.get(atomId);
      if (!mesh || !(mesh.material instanceof THREE.MeshPhongMaterial)) {
        this.colorTransitions.delete(atomId);
        return;
      }

      const elapsed = now - trans.startTime;
      const t = Math.min(elapsed / trans.duration, 1);
      mesh.material.color.lerpColors(trans.startColor, trans.targetColor, t);

      if (t >= 1) {
        this.colorTransitions.delete(atomId);
      }
    });

    if (this.autoRotate && !this.isAnimatingGrowth) {
      this.crystalGroup.rotation.y += this.autoRotateSpeed;
    }

    this.controls.update();
    this.renderer.render(this.scene, this.camera);
    this.cssRenderer.render(this.scene, this.camera);
  }

  dispose(): void {
    window.removeEventListener('resize', this.onWindowResize.bind(this));
    this.clearScene();
    this.atomGeometry.dispose();
    this.bondGeometry.dispose();
    this.renderer.dispose();
  }
}
