import * as THREE from 'three';

export interface CharacterModuleOptions {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  getState: () => any;
  setState: (updater: (state: any) => any) => void;
  onFragmentCollect: (fragmentId: number) => void;
}

export class CharacterModule {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private getState: () => any;
  private setState: (updater: (state: any) => any) => void;
  private onFragmentCollect: (id: number) => void;
  
  private character: THREE.Group;
  private velocity: THREE.Vector3 = new THREE.Vector3();
  private moveSpeed: number = 8;
  private keys: { [key: string]: boolean } = {};
  private raycaster: THREE.Raycaster = new THREE.Raycaster();
  private mouse: THREE.Vector2 = new THREE.Vector2();
  private groundPlane: THREE.Mesh;
  private isTeleporting: boolean = false;
  private teleportProgress: number = 0;
  private teleportStart: THREE.Vector3 = new THREE.Vector3();
  private teleportEnd: THREE.Vector3 = new THREE.Vector3();
  private teleportDuration: number = 0.8;
  private collectDistance: number = 1.5;
  private fragmentMeshes: Map<number, THREE.Mesh> = new Map();

  constructor(options: CharacterModuleOptions) {
    this.scene = options.scene;
    this.camera = options.camera;
    this.getState = options.getState;
    this.setState = options.setState;
    this.onFragmentCollect = options.onFragmentCollect;
    
    this.character = this.createCharacter();
    this.scene.add(this.character);
    
    const groundGeometry = new THREE.PlaneGeometry(100, 100);
    const groundMaterial = new THREE.MeshBasicMaterial({ 
      visible: false,
      side: THREE.DoubleSide 
    });
    this.groundPlane = new THREE.Mesh(groundGeometry, groundMaterial);
    this.groundPlane.rotation.x = -Math.PI / 2;
    this.scene.add(this.groundPlane);
    
    this.setupEventListeners();
  }

  private createCharacter(): THREE.Group {
    const group = new THREE.Group();
    
    const bodyGeometry = new THREE.CapsuleGeometry(0.3, 0.8, 4, 8);
    const bodyMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x6366f1,
      metalness: 0.3,
      roughness: 0.7,
      emissive: 0x4338ca,
      emissiveIntensity: 0.2
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 0.7;
    group.add(body);
    
    const headGeometry = new THREE.SphereGeometry(0.25, 16, 16);
    const headMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xfcd34d,
      metalness: 0.5,
      roughness: 0.3,
      emissive: 0xf59e0b,
      emissiveIntensity: 0.3
    });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.y = 1.4;
    group.add(head);
    
    const glowGeometry = new THREE.RingGeometry(0.5, 0.6, 32);
    const glowMaterial = new THREE.MeshBasicMaterial({ 
      color: 0x8b5cf6, 
      transparent: true, 
      opacity: 0.6,
      side: THREE.DoubleSide
    });
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    glow.rotation.x = -Math.PI / 2;
    glow.position.y = 0.01;
    group.add(glow);
    
    return group;
  }

  private setupEventListeners(): void {
    window.addEventListener('keydown', (e) => {
      this.keys[e.key.toLowerCase()] = true;
    });
    
    window.addEventListener('keyup', (e) => {
      this.keys[e.key.toLowerCase()] = false;
    });
    
    window.addEventListener('click', (e) => {
      if (e.button === 0 && !this.isTeleporting) {
        this.handleClick(e);
      }
    });
  }

  private handleClick(event: MouseEvent): void {
    const canvas = this.scene.userData.canvas;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    
    this.raycaster.setFromCamera(this.mouse, this.camera);
    
    const intersects = this.raycaster.intersectObject(this.groundPlane);
    if (intersects.length > 0) {
      const point = intersects[0].point;
      this.teleportTo(point);
    }
    
    const fragmentIntersects = this.raycaster.intersectObjects(
      Array.from(this.fragmentMeshes.values())
    );
    if (fragmentIntersects.length > 0) {
      const mesh = fragmentIntersects[0].object as THREE.Mesh;
      const fragmentId = mesh.userData.fragmentId;
      if (fragmentId !== undefined) {
        const state = this.getState();
        const fragment = state.fragments.find((f: any) => f.id === fragmentId);
        if (fragment && !fragment.collected) {
          const distance = this.character.position.distanceTo(
            new THREE.Vector3(fragment.x, 0.5, fragment.z)
          );
          if (distance < 3) {
            this.collectFragment(fragmentId);
          }
        }
      }
    }
  }

  public teleportTo(target: THREE.Vector3): void {
    if (this.isTeleporting) return;
    
    this.teleportStart.copy(this.character.position);
    this.teleportEnd.set(target.x, 0, target.z);
    this.isTeleporting = true;
    this.teleportProgress = 0;
    
    this.setState((state: any) => ({ ...state, isTeleporting: true }));
  }

  private collectFragment(fragmentId: number): void {
    const mesh = this.fragmentMeshes.get(fragmentId);
    if (mesh) {
      const animate = () => {
        mesh.scale.multiplyScalar(0.9);
        (mesh.material as THREE.MeshStandardMaterial).emissiveIntensity *= 1.2;
        if (mesh.scale.x > 0.05) {
          requestAnimationFrame(animate);
        } else {
          this.scene.remove(mesh);
          this.fragmentMeshes.delete(fragmentId);
        }
      };
      animate();
    }
    
    this.onFragmentCollect(fragmentId);
  }

  public registerFragmentMesh(id: number, mesh: THREE.Mesh): void {
    this.fragmentMeshes.set(id, mesh);
  }

  public update(deltaTime: number): void {
    if (this.isTeleporting) {
      this.updateTeleport(deltaTime);
      return;
    }
    
    this.updateMovement(deltaTime);
    this.checkFragmentCollection();
    this.checkAltarProximity();
    this.updateCamera();
  }

  private updateMovement(deltaTime: number): void {
    const direction = new THREE.Vector3();
    
    const cameraDirection = new THREE.Vector3();
    this.camera.getWorldDirection(cameraDirection);
    cameraDirection.y = 0;
    cameraDirection.normalize();
    
    const cameraRight = new THREE.Vector3();
    cameraRight.crossVectors(cameraDirection, new THREE.Vector3(0, 1, 0));
    
    if (this.keys['w']) {
      direction.add(cameraDirection);
    }
    if (this.keys['s']) {
      direction.sub(cameraDirection);
    }
    if (this.keys['a']) {
      direction.sub(cameraRight);
    }
    if (this.keys['d']) {
      direction.add(cameraRight);
    }
    
    if (direction.length() > 0) {
      direction.normalize();
      this.velocity.copy(direction).multiplyScalar(this.moveSpeed * deltaTime);
      this.character.position.add(this.velocity);
      
      const angle = Math.atan2(direction.x, direction.z);
      this.character.rotation.y = angle;
      
      this.setState((state: any) => ({
        ...state,
        characterPosition: this.character.position.clone()
      }));
    }
  }

  private updateTeleport(deltaTime: number): void {
    this.teleportProgress += deltaTime / this.teleportDuration;
    
    if (this.teleportProgress >= 1) {
      this.isTeleporting = false;
      this.character.position.copy(this.teleportEnd);
      this.teleportProgress = 0;
      this.setState((state: any) => ({ 
        ...state, 
        isTeleporting: false,
        characterPosition: this.character.position.clone()
      }));
      return;
    }
    
    const t = this.teleportProgress;
    const easeInOut = t < 0.5 
      ? 2 * t * t 
      : 1 - Math.pow(-2 * t + 2, 2) / 2;
    
    this.character.position.lerpVectors(this.teleportStart, this.teleportEnd, easeInOut);
    
    const scale = t < 0.5 
      ? 1 - t * 2 
      : (t - 0.5) * 2;
    this.character.scale.setScalar(Math.max(0.1, scale));
    
    this.setState((state: any) => ({
      ...state,
      characterPosition: this.character.position.clone()
    }));
  }

  private checkFragmentCollection(): void {
    const state = this.getState();
    const fragments = state.fragments;
    
    for (const fragment of fragments) {
      if (fragment.collected) continue;
      
      const fragmentPos = new THREE.Vector3(fragment.x, 0.5, fragment.z);
      const distance = this.character.position.distanceTo(fragmentPos);
      
      if (distance < this.collectDistance) {
        this.collectFragment(fragment.id);
      }
    }
  }

  private checkAltarProximity(): void {
    const altarPosition = new THREE.Vector3(0, 0, 0);
    const distance = this.character.position.distanceTo(altarPosition);
    
    this.setState((state: any) => {
      const near = distance < 3;
      if (state.isNearAltar !== near) {
        return { ...state, isNearAltar: near };
      }
      return state;
    });
  }

  private updateCamera(): void {
    const targetPosition = new THREE.Vector3(
      this.character.position.x,
      this.character.position.y + 8,
      this.character.position.z + 10
    );
    
    this.camera.position.lerp(targetPosition, 0.05);
    this.camera.lookAt(
      this.character.position.x,
      this.character.position.y + 1,
      this.character.position.z
    );
  }

  public getPosition(): THREE.Vector3 {
    return this.character.position.clone();
  }

  public setPosition(pos: THREE.Vector3): void {
    this.character.position.copy(pos);
  }
}
