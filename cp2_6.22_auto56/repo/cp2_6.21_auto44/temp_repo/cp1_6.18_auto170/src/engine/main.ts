import * as THREE from 'three';
import { parseMolecule } from './molParser';
import { buildMoleculeGroup, disposeGroup, BuildResult } from './sceneBuilder';
import { CameraController } from './cameraController';
import { MOLECULES, ELEMENT_CONFIG } from '../data/molecules';
import { Atom } from '../types';

export interface EngineState {
  currentMoleculeId: string;
  atomCount: number;
  bondCount: number;
  fps: number;
  hoveredAtomId: string | null;
  hoveredElement: string | null;
  hoveredScreenX: number;
  hoveredScreenY: number;
}

export class MoleculeEngine {
  private container: HTMLElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private cameraController: CameraController;
  private raycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;
  
  private currentBuildResult: BuildResult | null = null;
  private currentMoleculeData = MOLECULES[0];
  private currentAtoms: Atom[] = [];
  
  private frameCount = 0;
  private lastFpsUpdate = performance.now();
  private currentFps = 60;
  
  private animationId: number | null = null;
  private isTransitioning = false;
  
  private labelSprites: Map<string, THREE.Sprite> = new Map();
  private showLabels = false;
  
  private hoveredAtomMesh: THREE.Mesh | null = null;
  private hoverStartTime = 0;
  
  private onStateChange: ((state: EngineState) => void) | null = null;
  
  constructor(container: HTMLElement) {
    this.container = container;
    
    this.scene = new THREE.Scene();
    this.setupBackground();
    this.setupLighting();
    
    this.camera = new THREE.PerspectiveCamera(
      60,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    this.camera.position.set(0, 0, 5);
    
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;
    
    container.appendChild(this.renderer.domElement);
    
    this.cameraController = new CameraController(this.camera, this.renderer.domElement);
    this.cameraController.setRotationSensitivity(0.005);
    this.cameraController.setZoomRange(3, 30);
    this.cameraController.setDefaultView(new THREE.Vector3(0, 0, 5), new THREE.Vector3(0, 0, 0));
    
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    
    this.setupEventListeners();
    this.loadMolecule('h2o');
  }
  
  private setupBackground(): void {
    const canvas = document.createElement('canvas');
    canvas.width = 2;
    canvas.height = 2;
    const ctx = canvas.getContext('2d')!;
    
    const gradient = ctx.createRadialGradient(1, 1, 0, 1, 1, 1.5);
    gradient.addColorStop(0, '#1A1A2E');
    gradient.addColorStop(1, '#0A0A1A');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 2, 2);
    
    const texture = new THREE.CanvasTexture(canvas);
    this.scene.background = texture;
  }
  
  private setupLighting(): void {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    this.scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 10, 7);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 50;
    directionalLight.shadow.bias = -0.0001;
    this.scene.add(directionalLight);
    
    const rimLight = new THREE.DirectionalLight(0x4466ff, 0.3);
    rimLight.position.set(-5, -3, -5);
    this.scene.add(rimLight);
  }
  
  private setupEventListeners(): void {
    const canvas = this.renderer.domElement;
    
    canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
    canvas.addEventListener('mouseleave', this.handleMouseLeave.bind(this));
    
    window.addEventListener('resize', this.handleResize.bind(this));
    
    canvas.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: true });
    canvas.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: true });
    canvas.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: true });
  }
  
  private handleMouseMove(event: MouseEvent): void {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    this.updateHover(event.clientX, event.clientY);
  }
  
  private handleMouseLeave(): void {
    this.clearHover();
  }
  
  private handleTouchStart(event: TouchEvent): void {
    if (event.touches.length === 1) {
      const touch = event.touches[0];
      const rect = this.renderer.domElement.getBoundingClientRect();
      this.mouse.x = ((touch.clientX - rect.left) / rect.width) * 2 - 1;
      this.mouse.y = -((touch.clientY - rect.top) / rect.height) * 2 + 1;
      this.updateHover(touch.clientX, touch.clientY);
    }
  }
  
  private handleTouchMove(event: TouchEvent): void {
    if (event.touches.length === 1) {
      const touch = event.touches[0];
      const rect = this.renderer.domElement.getBoundingClientRect();
      this.mouse.x = ((touch.clientX - rect.left) / rect.width) * 2 - 1;
      this.mouse.y = -((touch.clientY - rect.top) / rect.height) * 2 + 1;
      this.updateHover(touch.clientX, touch.clientY);
    }
  }
  
  private handleTouchEnd(): void {
    this.clearHover();
  }
  
  private updateHover(screenX: number, screenY: number): void {
    if (!this.currentBuildResult || this.isTransitioning) return;
    
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const atomMeshes = Array.from(this.currentBuildResult.atomMeshes.values());
    const intersects = this.raycaster.intersectObjects(atomMeshes);
    
    if (intersects.length > 0) {
      const mesh = intersects[0].object as THREE.Mesh;
      const atomId = mesh.userData.atomId;
      const element = mesh.userData.element;
      
      if (this.hoveredAtomMesh !== mesh) {
        this.clearHover();
        this.hoveredAtomMesh = mesh;
        this.hoverStartTime = performance.now();
        
        if (mesh.userData.glowMesh) {
          mesh.userData.targetEmissive = 0.6;
        }
      }
      
      this.updateState(screenX, screenY);
    } else {
      this.clearHover();
    }
  }
  
  private clearHover(): void {
    if (this.hoveredAtomMesh && this.hoveredAtomMesh.userData.glowMesh) {
      this.hoveredAtomMesh.userData.targetEmissive = 0;
    }
    this.hoveredAtomMesh = null;
    
    this.onStateChange?.({
      currentMoleculeId: this.currentMoleculeData.id,
      atomCount: this.currentAtoms.length,
      bondCount: this.currentMoleculeData.bonds.length,
      fps: this.currentFps,
      hoveredAtomId: null,
      hoveredElement: null,
      hoveredScreenX: 0,
      hoveredScreenY: 0,
    });
  }
  
  private updateState(screenX: number, screenY: number): void {
    if (!this.hoveredAtomMesh) return;
    
    this.onStateChange?.({
      currentMoleculeId: this.currentMoleculeData.id,
      atomCount: this.currentAtoms.length,
      bondCount: this.currentMoleculeData.bonds.length,
      fps: this.currentFps,
      hoveredAtomId: this.hoveredAtomMesh.userData.atomId,
      hoveredElement: this.hoveredAtomMesh.userData.element,
      hoveredScreenX: screenX,
      hoveredScreenY: screenY,
    });
  }
  
  private handleResize(): void {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    
    this.renderer.setSize(width, height);
  }
  
  async loadMolecule(moleculeId: string): Promise<void> {
    if (this.isTransitioning) return;
    
    const moleculeData = MOLECULES.find(m => m.id === moleculeId);
    if (!moleculeData) return;
    
    this.isTransitioning = true;
    this.clearHover();
    
    if (this.currentBuildResult) {
      await this.animateOutMolecule();
      this.scene.remove(this.currentBuildResult.group);
      disposeGroup(this.currentBuildResult.group);
      this.labelSprites.clear();
    }
    
    const parsed = parseMolecule(moleculeData);
    this.currentAtoms = parsed.atoms;
    this.currentBuildResult = buildMoleculeGroup(parsed.atoms, parsed.bonds);
    this.currentMoleculeData = moleculeData;
    
    this.currentBuildResult.group.scale.setScalar(0.1);
    this.currentBuildResult.group.traverse(child => {
      if (child instanceof THREE.Mesh && child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach(m => {
            m.opacity = 0;
            m.transparent = true;
          });
        } else {
          child.material.opacity = 0;
          child.material.transparent = true;
        }
      }
    });
    
    this.scene.add(this.currentBuildResult.group);
    
    if (this.showLabels) {
      this.createLabelSprites();
    }
    
    await this.animateInMolecule();
    
    const distance = Math.max(5, this.currentBuildResult.boundingRadius * 3);
    this.cameraController.setDefaultView(
      new THREE.Vector3(0, 0, distance),
      new THREE.Vector3(0, 0, 0)
    );
    
    this.isTransitioning = false;
    this.updateState(0, 0);
  }
  
  private animateOutMolecule(): Promise<void> {
    return new Promise((resolve) => {
      if (!this.currentBuildResult) {
        resolve();
        return;
      }
      
      const group = this.currentBuildResult.group;
      const startTime = performance.now();
      const duration = 400;
      const startScale = group.scale.x;
      
      const animate = () => {
        const elapsed = performance.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        
        group.scale.setScalar(startScale * (1 - eased));
        
        group.traverse(child => {
          if (child instanceof THREE.Mesh && child.material) {
            const opacity = 1 - eased;
            if (Array.isArray(child.material)) {
              child.material.forEach(m => m.opacity = opacity);
            } else {
              child.material.opacity = opacity;
            }
          }
        });
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          resolve();
        }
      };
      
      animate();
    });
  }
  
  private animateInMolecule(): Promise<void> {
    return new Promise((resolve) => {
      if (!this.currentBuildResult) {
        resolve();
        return;
      }
      
      const group = this.currentBuildResult.group;
      const startTime = performance.now();
      const duration = 800;
      
      const animate = () => {
        const elapsed = performance.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        
        const scale = 0.1 + 0.9 * eased;
        group.scale.setScalar(scale);
        
        group.traverse(child => {
          if (child instanceof THREE.Mesh && child.material) {
            const opacity = eased;
            if (Array.isArray(child.material)) {
              child.material.forEach(m => m.opacity = opacity);
            } else {
              child.material.opacity = opacity;
            }
          }
        });
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          group.traverse(child => {
            if (child instanceof THREE.Mesh && child.material) {
              if (Array.isArray(child.material)) {
                child.material.forEach(m => {
                  m.transparent = m.opacity < 1;
                });
              } else {
                child.material.transparent = child.material.opacity < 1;
              }
            }
          });
          resolve();
        }
      };
      
      animate();
    });
  }
  
  private createLabelSprites(): void {
    if (!this.currentBuildResult) return;
    
    this.currentAtoms.forEach(atom => {
      const canvas = document.createElement('canvas');
      canvas.width = 128;
      canvas.height = 64;
      const ctx = canvas.getContext('2d')!;
      
      ctx.fillStyle = 'rgba(30, 30, 40, 0.85)';
      ctx.beginPath();
      ctx.roundRect(0, 0, 128, 64, 12);
      ctx.fill();
      
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 28px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(atom.element, 64, 32);
      
      const texture = new THREE.CanvasTexture(canvas);
      const material = new THREE.SpriteMaterial({
        map: texture,
        transparent: true,
        depthTest: false,
      });
      
      const sprite = new THREE.Sprite(material);
      sprite.position.set(atom.position[0], atom.position[1] + atom.radius + 0.5, atom.position[2]);
      sprite.scale.set(0.8, 0.4, 1);
      
      this.currentBuildResult!.group.add(sprite);
      this.labelSprites.set(atom.id, sprite);
    });
  }
  
  private destroyLabelSprites(): void {
    this.labelSprites.forEach(sprite => {
      if (sprite.parent) sprite.parent.remove(sprite);
      sprite.material.map?.dispose();
      sprite.material.dispose();
    });
    this.labelSprites.clear();
  }
  
  setShowLabels(show: boolean): void {
    this.showLabels = show;
    
    if (show) {
      this.createLabelSprites();
    } else {
      this.destroyLabelSprites();
    }
  }
  
  setAutoRotate(enabled: boolean): void {
    this.cameraController.setAutoRotate(enabled, 0.5);
  }
  
  centerView(): void {
    if (!this.currentBuildResult) return;
    
    const distance = Math.max(5, this.currentBuildResult.boundingRadius * 3);
    this.cameraController.centerOnTarget(
      new THREE.Vector3(0, 0, 0),
      distance,
      500
    );
  }
  
  resetView(): void {
    this.cameraController.resetView(500);
  }
  
  setStateCallback(callback: (state: EngineState) => void): void {
    this.onStateChange = callback;
  }
  
  start(): void {
    const animate = () => {
      this.animationId = requestAnimationFrame(animate);
      
      const now = performance.now();
      this.frameCount++;
      
      if (now - this.lastFpsUpdate >= 500) {
        this.currentFps = (this.frameCount * 1000) / (now - this.lastFpsUpdate);
        this.frameCount = 0;
        this.lastFpsUpdate = now;
        
        if (this.onStateChange && !this.hoveredAtomMesh) {
          this.onStateChange({
            currentMoleculeId: this.currentMoleculeData.id,
            atomCount: this.currentAtoms.length,
            bondCount: this.currentMoleculeData.bonds.length,
            fps: this.currentFps,
            hoveredAtomId: null,
            hoveredElement: null,
            hoveredScreenX: 0,
            hoveredScreenY: 0,
          });
        }
      }
      
      this.updateHoverAnimations();
      this.cameraController.update();
      this.renderer.render(this.scene, this.camera);
    };
    
    animate();
  }
  
  private updateHoverAnimations(): void {
    if (!this.currentBuildResult) return;
    
    const now = performance.now();
    
    this.currentBuildResult.atomMeshes.forEach(mesh => {
      const glowMesh = mesh.userData.glowMesh;
      if (!glowMesh) return;
      
      const currentEmissive = mesh.userData.baseEmissive || 0;
      const targetEmissive = mesh.userData.targetEmissive || 0;
      
      if (currentEmissive !== targetEmissive) {
        const elapsed = now - this.hoverStartTime;
        const progress = Math.min(elapsed / 300, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        
        const newEmissive = currentEmissive + (targetEmissive - currentEmissive) * eased;
        
        if (glowMesh.material instanceof THREE.MeshStandardMaterial) {
          glowMesh.material.emissiveIntensity = newEmissive;
          glowMesh.material.opacity = newEmissive * 0.5;
        }
        
        mesh.userData.baseEmissive = newEmissive;
        
        if (progress >= 1) {
          mesh.userData.baseEmissive = targetEmissive;
        }
      }
    });
  }
  
  stop(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }
  
  dispose(): void {
    this.stop();
    
    if (this.currentBuildResult) {
      disposeGroup(this.currentBuildResult.group);
      this.scene.remove(this.currentBuildResult.group);
    }
    
    this.destroyLabelSprites();
    this.cameraController.dispose();
    this.renderer.dispose();
    this.renderer.domElement.remove();
    
    window.removeEventListener('resize', this.handleResize.bind(this));
  }
}
