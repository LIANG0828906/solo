import * as THREE from 'three';
import { CSS2DRenderer } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import { Creature, Formation, CombatLog, Element, ELEMENT_COLORS, Team } from '../types';

interface CreatureMesh extends THREE.Group {
  userData: {
    creatureId: string;
    originalScale: THREE.Vector3;
    isFlashing: boolean;
    flashStartTime: number;
    isDying: boolean;
    deathStartTime: number;
    halo?: THREE.Mesh;
    body?: THREE.Mesh;
  };
}

interface AnimationState {
  attackRays: Array<{
    mesh: THREE.Line;
    startTime: number;
    duration: number;
  }>;
  flashingCreatures: Map<string, number>;
  dyingCreatures: Map<string, number>;
  ripples: Array<{
    mesh: THREE.Mesh;
    startTime: number;
    duration: number;
    position: THREE.Vector3;
  }>;
}

export class BattleScene {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private labelRenderer: CSS2DRenderer;
  private container: HTMLElement;
  
  private ground!: THREE.Mesh;
  private gridHelper!: THREE.GridHelper;
  
  private geometries: {
    cone: THREE.ConeGeometry;
    box: THREE.BoxGeometry;
    sphere: THREE.SphereGeometry;
    torus: THREE.TorusGeometry;
  };
  
  private materials: Record<Element, {
    body: THREE.MeshStandardMaterial;
    halo: THREE.MeshBasicMaterial;
  }>;
  
  private creatureMeshes: Map<string, CreatureMesh>;
  
  private animationState: AnimationState;
  private raycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;
  
  private animationFrameId: number | null;
  private lastTime: number;
  
  private isDisposed: boolean;

  constructor(canvasContainer: HTMLElement, _labelContainer: HTMLElement) {
    this.container = canvasContainer;
    this.creatureMeshes = new Map();
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.animationFrameId = null;
    this.lastTime = performance.now();
    this.isDisposed = false;
    
    this.animationState = {
      attackRays: [],
      flashingCreatures: new Map(),
      dyingCreatures: new Map(),
      ripples: []
    };
    
    this.scene = new THREE.Scene();
    this.scene.background = null;
    this.scene.fog = new THREE.Fog(0x0d0015, 15, 30);
    
    const aspect = canvasContainer.clientWidth / canvasContainer.clientHeight;
    this.camera = new THREE.PerspectiveCamera(50, aspect, 0.1, 100);
    this.camera.position.set(0, 3, 8);
    this.camera.lookAt(0, 0, 0);
    
    this.renderer = new THREE.WebGLRenderer({
      canvas: canvasContainer.querySelector('canvas') || undefined,
      antialias: true,
      alpha: true
    });
    this.renderer.setSize(canvasContainer.clientWidth, canvasContainer.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;
    
    this.labelRenderer = new CSS2DRenderer();
    this.labelRenderer.setSize(canvasContainer.clientWidth, canvasContainer.clientHeight);
    this.labelRenderer.domElement.style.position = 'absolute';
    this.labelRenderer.domElement.style.top = '0';
    this.labelRenderer.domElement.style.left = '0';
    this.labelRenderer.domElement.style.pointerEvents = 'none';
    _labelContainer.appendChild(this.labelRenderer.domElement);
    
    this.geometries = {
      cone: new THREE.ConeGeometry(0.4, 0.8, 8),
      box: new THREE.BoxGeometry(0.5, 0.5, 0.5),
      sphere: new THREE.SphereGeometry(0.35, 16, 16),
      torus: new THREE.TorusGeometry(0.3, 0.03, 8, 24)
    };
    
    this.materials = {
      fire: {
        body: new THREE.MeshStandardMaterial({
          color: 0xff6b6b,
          emissive: 0xff3333,
          emissiveIntensity: 0.3,
          roughness: 0.5,
          metalness: 0.1
        }),
        halo: new THREE.MeshBasicMaterial({
          color: 0xff6b6b,
          transparent: true,
          opacity: 0.4,
          side: THREE.DoubleSide
        })
      },
      water: {
        body: new THREE.MeshStandardMaterial({
          color: 0x4ecdc4,
          emissive: 0x00bcd4,
          emissiveIntensity: 0.3,
          roughness: 0.3,
          metalness: 0.2
        }),
        halo: new THREE.MeshBasicMaterial({
          color: 0x4ecdc4,
          transparent: true,
          opacity: 0.4,
          side: THREE.DoubleSide
        })
      },
      grass: {
        body: new THREE.MeshStandardMaterial({
          color: 0x95e1a3,
          emissive: 0x4caf50,
          emissiveIntensity: 0.3,
          roughness: 0.6,
          metalness: 0.0
        }),
        halo: new THREE.MeshBasicMaterial({
          color: 0x95e1a3,
          transparent: true,
          opacity: 0.4,
          side: THREE.DoubleSide
        })
      }
    };
    
    this.setupLighting();
    this.createGround();
    this.setupResizeHandler();
    this.startAnimationLoop();
  }

  private setupLighting(): void {
    const ambientLight = new THREE.AmbientLight(0x404080, 0.6);
    this.scene.add(ambientLight);
    
    const mainLight = new THREE.DirectionalLight(0xffffff, 1.2);
    mainLight.position.set(5, 10, 5);
    mainLight.castShadow = true;
    mainLight.shadow.mapSize.width = 2048;
    mainLight.shadow.mapSize.height = 2048;
    mainLight.shadow.camera.near = 0.5;
    mainLight.shadow.camera.far = 50;
    mainLight.shadow.camera.left = -15;
    mainLight.shadow.camera.right = 15;
    mainLight.shadow.camera.top = 15;
    mainLight.shadow.camera.bottom = -15;
    this.scene.add(mainLight);
    
    const fillLight = new THREE.DirectionalLight(0x6666ff, 0.4);
    fillLight.position.set(-5, 5, -5);
    this.scene.add(fillLight);
    
    const rimLight = new THREE.DirectionalLight(0xff66ff, 0.3);
    rimLight.position.set(0, 5, -10);
    this.scene.add(rimLight);
  }

  private createGround(): void {
    const groundGeometry = new THREE.PlaneGeometry(15, 15);
    const groundMaterial = new THREE.MeshStandardMaterial({
      color: 0x2a2a3e,
      roughness: 0.9,
      metalness: 0.1
    });
    
    this.ground = new THREE.Mesh(groundGeometry, groundMaterial);
    this.ground.rotation.x = -Math.PI / 2;
    this.ground.receiveShadow = true;
    this.scene.add(this.ground);
    
    this.gridHelper = new THREE.GridHelper(15, 30, 0x444466, 0x333355);
    this.gridHelper.position.y = 0.01;
    this.scene.add(this.gridHelper);
    
    const formationGrid = new THREE.GridHelper(8, 8, 0x6666aa, 0x555588);
    formationGrid.position.y = 0.02;
    this.scene.add(formationGrid);
  }

  private setupResizeHandler(): void {
    const handleResize = () => {
      if (this.isDisposed) return;
      const width = this.container.clientWidth;
      const height = this.container.clientHeight;
      
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
      
      this.renderer.setSize(width, height);
      this.labelRenderer.setSize(width, height);
    };
    
    window.addEventListener('resize', handleResize);
  }

  private createCreatureMesh(creature: Creature, position: THREE.Vector3): CreatureMesh {
    const group = new THREE.Group() as CreatureMesh;
    
    let bodyGeometry: THREE.BufferGeometry;
    switch (creature.element) {
      case 'fire':
        bodyGeometry = this.geometries.cone;
        break;
      case 'water':
        bodyGeometry = this.geometries.box;
        break;
      case 'grass':
        bodyGeometry = this.geometries.sphere;
        break;
    }
    
    const bodyMaterial = this.materials[creature.element].body;
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial.clone());
    body.castShadow = true;
    body.receiveShadow = true;
    
    if (creature.element === 'fire') {
      body.position.y = 0.4;
    } else {
      body.position.y = 0.35;
    }
    group.add(body);
    
    const haloGeometry = this.geometries.torus;
    const haloMaterial = this.materials[creature.element].halo.clone();
    const halo = new THREE.Mesh(haloGeometry, haloMaterial);
    halo.rotation.x = Math.PI / 2;
    halo.position.y = 0.9;
    group.add(halo);
    
    group.position.copy(position);
    group.userData = {
      creatureId: creature.id,
      originalScale: new THREE.Vector3(1, 1, 1),
      isFlashing: false,
      flashStartTime: 0,
      isDying: false,
      deathStartTime: 0,
      halo,
      body
    };
    
    return group;
  }

  public renderFormation(
    formation: Formation,
    creatures: Map<string, Creature>,
    team: Team
  ): void {
    for (const cell of formation) {
      const existingMesh = this.creatureMeshes.get(cell.id);
      if (existingMesh) {
        this.scene.remove(existingMesh);
        this.creatureMeshes.delete(cell.id);
      }
      
      if (cell.creatureId) {
        const creature = creatures.get(cell.creatureId);
        if (creature) {
          const position = new THREE.Vector3(cell.position.x, 0, cell.position.z);
          const mesh = this.createCreatureMesh(creature, position);
          
          if (team === 'enemy') {
            mesh.rotation.y = Math.PI;
          }
          
          this.scene.add(mesh);
          this.creatureMeshes.set(cell.id, mesh);
        }
      }
    }
  }

  public updateCreaturePosition(cellId: string, position: THREE.Vector3): void {
    const mesh = this.creatureMeshes.get(cellId);
    if (mesh) {
      mesh.position.copy(position);
    }
  }

  public showAttackRay(log: CombatLog): void {
    const from = new THREE.Vector3(
      log.attackerPosition.x,
      log.attackerPosition.y,
      log.attackerPosition.z
    );
    const to = new THREE.Vector3(
      log.targetPosition.x,
      log.targetPosition.y,
      log.targetPosition.z
    );
    
    const points = [from, to];
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    
    const color = new THREE.Color(ELEMENT_COLORS[log.attackerElement]);
    const material = new THREE.LineBasicMaterial({
      color,
      linewidth: 3,
      transparent: true,
      opacity: 1
    });
    
    const line = new THREE.Line(geometry, material);
    this.scene.add(line);
    
    this.animationState.attackRays.push({
      mesh: line,
      startTime: performance.now(),
      duration: 300
    });
  }

  public showDamageFlash(creatureId: string): void {
    const mesh = this.findCreatureMeshById(creatureId);
    if (mesh) {
      this.animationState.flashingCreatures.set(creatureId, performance.now());
    }
  }

  public showDeathAnimation(creatureId: string): void {
    const mesh = this.findCreatureMeshById(creatureId);
    if (mesh) {
      mesh.userData.isDying = true;
      mesh.userData.deathStartTime = performance.now();
      this.animationState.dyingCreatures.set(creatureId, performance.now());
    }
  }

  public showRipple(position: THREE.Vector3): void {
    const geometry = new THREE.RingGeometry(0.1, 0.15, 32);
    const material = new THREE.MeshBasicMaterial({
      color: 0xffd700,
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide
    });
    
    const ripple = new THREE.Mesh(geometry, material);
    ripple.rotation.x = -Math.PI / 2;
    ripple.position.copy(position);
    ripple.position.y = 0.05;
    this.scene.add(ripple);
    
    this.animationState.ripples.push({
      mesh: ripple,
      startTime: performance.now(),
      duration: 600,
      position: position.clone()
    });
  }

  private findCreatureMeshById(creatureId: string): CreatureMesh | undefined {
    for (const [, mesh] of this.creatureMeshes) {
      if (mesh.userData.creatureId === creatureId) {
        return mesh;
      }
    }
    return undefined;
  }

  public getCreatureWorldPosition(cellId: string): THREE.Vector3 | null {
    const mesh = this.creatureMeshes.get(cellId);
    if (mesh) {
      return mesh.position.clone();
    }
    return null;
  }

  public raycastToGround(clientX: number, clientY: number): THREE.Vector3 | null {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;
    
    this.raycaster.setFromCamera(this.mouse, this.camera);
    
    const intersects = this.raycaster.intersectObject(this.ground);
    if (intersects.length > 0) {
      return intersects[0].point;
    }
    return null;
  }

  public raycastToCreature(clientX: number, clientY: number): string | null {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;
    
    this.raycaster.setFromCamera(this.mouse, this.camera);
    
    const meshes = Array.from(this.creatureMeshes.values());
    const intersects = this.raycaster.intersectObjects(meshes, true);
    
    if (intersects.length > 0) {
      let obj: THREE.Object3D | null = intersects[0].object;
      while (obj && !obj.userData.creatureId) {
        obj = obj.parent;
      }
      if (obj && obj.userData.creatureId) {
        return obj.userData.creatureId;
      }
    }
    return null;
  }

  private updateAnimations(currentTime: number): void {
    const dt = (currentTime - this.lastTime) / 1000;
    this.lastTime = currentTime;
    
    for (let i = this.animationState.attackRays.length - 1; i >= 0; i--) {
      const ray = this.animationState.attackRays[i];
      const elapsed = currentTime - ray.startTime;
      
      if (elapsed >= ray.duration) {
        this.scene.remove(ray.mesh);
        ray.mesh.geometry.dispose();
        (ray.mesh.material as THREE.Material).dispose();
        this.animationState.attackRays.splice(i, 1);
      } else {
        const progress = elapsed / ray.duration;
        (ray.mesh.material as THREE.LineBasicMaterial).opacity = 1 - progress;
      }
    }
    
    for (const [creatureId, startTime] of this.animationState.flashingCreatures) {
      const elapsed = currentTime - startTime;
      
      if (elapsed >= 1000) {
        this.animationState.flashingCreatures.delete(creatureId);
        const mesh = this.findCreatureMeshById(creatureId);
        if (mesh?.userData.body) {
          const material = mesh.userData.body.material as THREE.MeshStandardMaterial;
          material.emissiveIntensity = 0.3;
        }
      } else {
        const flashCycle = Math.sin(elapsed * (Math.PI / 0.2));
        const mesh = this.findCreatureMeshById(creatureId);
        if (mesh?.userData.body) {
          const material = mesh.userData.body.material as THREE.MeshStandardMaterial;
          material.emissiveIntensity = 0.3 + flashCycle * 0.7;
          if (flashCycle > 0) {
            material.emissive.setHex(0xff0000);
          } else {
            material.emissive.setHex(this.getElementEmissiveColor(
              this.getCreatureElementById(creatureId) || 'fire'
            ));
          }
        }
      }
    }
    
    for (let i = this.animationState.ripples.length - 1; i >= 0; i--) {
      const ripple = this.animationState.ripples[i];
      const elapsed = currentTime - ripple.startTime;
      
      if (elapsed >= ripple.duration) {
        this.scene.remove(ripple.mesh);
        ripple.mesh.geometry.dispose();
        (ripple.mesh.material as THREE.Material).dispose();
        this.animationState.ripples.splice(i, 1);
      } else {
        const progress = elapsed / ripple.duration;
        const scale = 1 + progress * 3;
        ripple.mesh.scale.setScalar(scale);
        (ripple.mesh.material as THREE.MeshBasicMaterial).opacity = 0.8 * (1 - progress);
      }
    }
    
    for (const [creatureId, startTime] of this.animationState.dyingCreatures) {
      const mesh = this.findCreatureMeshById(creatureId);
      if (!mesh) continue;
      
      const elapsed = currentTime - startTime;
      
      if (elapsed >= 500) {
        this.animationState.dyingCreatures.delete(creatureId);
        this.scene.remove(mesh);
        for (const [cellId, m] of this.creatureMeshes) {
          if (m === mesh) {
            this.creatureMeshes.delete(cellId);
            break;
          }
        }
      } else {
        const progress = elapsed / 500;
        const scale = 1 - progress;
        mesh.scale.setScalar(Math.max(0.01, scale));
        mesh.position.y -= dt * 0.5;
        if (mesh.userData.halo) {
          (mesh.userData.halo.material as THREE.MeshBasicMaterial).opacity = 0.4 * (1 - progress);
        }
      }
    }
    
    for (const [, mesh] of this.creatureMeshes) {
      if (mesh.userData.halo && !mesh.userData.isDying) {
        mesh.userData.halo.rotation.z += dt * 0.5;
        mesh.userData.halo.position.y = 0.9 + Math.sin(currentTime * 0.003) * 0.05;
      }
    }
  }

  private getElementEmissiveColor(element: Element): number {
    switch (element) {
      case 'fire': return 0xff3333;
      case 'water': return 0x00bcd4;
      case 'grass': return 0x4caf50;
    }
  }

  private getCreatureElementById(creatureId: string): Element | null {
    for (const [, mesh] of this.creatureMeshes) {
      if (mesh.userData.creatureId === creatureId) {
        if (mesh.userData.body) {
          const color = (mesh.userData.body.material as THREE.MeshStandardMaterial).color;
          if (color.r > 0.8) return 'fire';
          if (color.b > 0.8) return 'water';
          if (color.g > 0.8) return 'grass';
        }
      }
    }
    return null;
  }

  private startAnimationLoop(): void {
    const animate = (time: number) => {
      if (this.isDisposed) return;
      
      this.animationFrameId = requestAnimationFrame(animate);
      this.updateAnimations(time);
      this.renderer.render(this.scene, this.camera);
      this.labelRenderer.render(this.scene, this.camera);
    };
    
    this.animationFrameId = requestAnimationFrame(animate);
  }

  public clearFormation(): void {
    for (const [, mesh] of this.creatureMeshes) {
      this.scene.remove(mesh);
    }
    this.creatureMeshes.clear();
    this.animationState.flashingCreatures.clear();
    this.animationState.dyingCreatures.clear();
  }

  public resetCreatureStates(): void {
    for (const [, mesh] of this.creatureMeshes) {
      mesh.scale.copy(mesh.userData.originalScale);
      mesh.position.y = 0;
      mesh.userData.isDying = false;
      mesh.userData.isFlashing = false;
      if (mesh.userData.halo) {
        (mesh.userData.halo.material as THREE.MeshBasicMaterial).opacity = 0.4;
      }
      if (mesh.userData.body) {
        const material = mesh.userData.body.material as THREE.MeshStandardMaterial;
        material.emissiveIntensity = 0.3;
      }
    }
    this.animationState.flashingCreatures.clear();
    this.animationState.dyingCreatures.clear();
  }

  public dispose(): void {
    this.isDisposed = true;
    
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }
    
    this.clearFormation();
    
    this.geometries.cone.dispose();
    this.geometries.box.dispose();
    this.geometries.sphere.dispose();
    this.geometries.torus.dispose();
    
    for (const element of ['fire', 'water', 'grass'] as Element[]) {
      this.materials[element].body.dispose();
      this.materials[element].halo.dispose();
    }
    
    this.renderer.dispose();
    
    if (this.labelRenderer.domElement.parentNode) {
      this.labelRenderer.domElement.parentNode.removeChild(this.labelRenderer.domElement);
    }
  }

  public getScene(): THREE.Scene {
    return this.scene;
  }

  public getCamera(): THREE.PerspectiveCamera {
    return this.camera;
  }
}
