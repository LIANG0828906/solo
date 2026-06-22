import * as THREE from 'three';

export interface ColorTheme {
  [element: string]: number;
}

export const SCIENCE_THEME: ColorTheme = {
  O: 0xff4444,
  C: 0x909090,
  H: 0xffffff,
  N: 0x4444ff,
  S: 0xffff44,
  P: 0xff8800,
  Cl: 0x44ff44,
  F: 0x00ffff,
  Br: 0x882200,
  I: 0x660099,
  B: 0xff9999,
  Li: 0x6666ff,
  Na: 0xab5cf2,
  Mg: 0x8aff00,
  Al: 0xbfa6a6,
  Si: 0xf0c8a0,
  K: 0x8f40d4,
  Ca: 0x3dff00,
  Fe: 0xe06633,
  Cu: 0xc88033,
  Zn: 0x7d80b0,
  default: 0xcccccc
};

export const NEON_THEME: ColorTheme = {
  O: 0x00ffff,
  C: 0x39ff14,
  H: 0xff6ec7,
  N: 0xff00ff,
  S: 0xffff00,
  P: 0xff0080,
  Cl: 0x00ff80,
  F: 0x00ffff,
  Br: 0xff4500,
  I: 0x9d00ff,
  B: 0xff1493,
  Li: 0x00bfff,
  Na: 0xff00ff,
  Mg: 0x39ff14,
  Al: 0x00ffff,
  Si: 0xff6600,
  K: 0xff00ff,
  Ca: 0x39ff14,
  Fe: 0xff4500,
  Cu: 0x00ffff,
  Zn: 0xff6ec7,
  default: 0x00ffff
};

export class MoleculeRenderer {
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public renderer: THREE.WebGLRenderer;
  private container: HTMLElement;
  private moleculeGroup: THREE.Group | null = null;
  private starfield: THREE.Points | null = null;
  private gridHelper: THREE.GridHelper | null = null;
  private raycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;
  private isDragging: boolean = false;
  private previousMousePosition: { x: number; y: number } = { x: 0, y: 0 };
  private rotationVelocity: { x: number; y: number } = { x: 0, y: 0 };
  private initialCameraPosition: THREE.Vector3;
  private initialCameraTarget: THREE.Vector3;
  private isAnimatingCamera: boolean = false;
  private animationStartTime: number = 0;
  private animationDuration: number = 1000;
  private animationStartPosition: THREE.Vector3 = new THREE.Vector3();
  private animationStartQuaternion: THREE.Quaternion = new THREE.Quaternion();
  private currentTheme: ColorTheme = SCIENCE_THEME;
  private isNeonTheme: boolean = false;
  private bondOpacity: number = 0.7;
  private onAtomClickCallback: ((atomData: any, event: MouseEvent) => void) | null = null;
  private atomMeshes: Map<THREE.Mesh, any> = new Map();

  constructor(containerId: string) {
    this.container = document.getElementById(containerId)!;
    
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a0f1e);

    this.camera = new THREE.PerspectiveCamera(
      60,
      this.container.clientWidth / this.container.clientHeight,
      0.1,
      1000
    );
    this.initialCameraPosition = new THREE.Vector3(0, 0, 12);
    this.initialCameraTarget = new THREE.Vector3(0, 0, 0);
    this.camera.position.copy(this.initialCameraPosition);
    this.camera.lookAt(this.initialCameraTarget);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;
    this.container.appendChild(this.renderer.domElement);

    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    this.setupLighting();
    this.createStarfield();
    this.createGrid();
    this.setupEventListeners();
  }

  private setupLighting(): void {
    const ambientLight = new THREE.AmbientLight(0x404060, 0.6);
    this.scene.add(ambientLight);

    const mainLight = new THREE.DirectionalLight(0xffffff, 1.2);
    mainLight.position.set(10, 10, 10);
    mainLight.castShadow = true;
    mainLight.shadow.mapSize.width = 2048;
    mainLight.shadow.mapSize.height = 2048;
    this.scene.add(mainLight);

    const fillLight = new THREE.DirectionalLight(0x6688ff, 0.4);
    fillLight.position.set(-10, 5, -10);
    this.scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xff8888, 0.3);
    rimLight.position.set(0, -10, 10);
    this.scene.add(rimLight);
  }

  private createStarfield(): void {
    const starGeometry = new THREE.BufferGeometry();
    const starCount = 500;
    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const radius = 80 + Math.random() * 40;

      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = radius * Math.cos(phi);

      const brightness = 0.5 + Math.random() * 0.5;
      colors[i * 3] = brightness;
      colors[i * 3 + 1] = brightness;
      colors[i * 3 + 2] = brightness * (0.9 + Math.random() * 0.2);
    }

    starGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    starGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const starMaterial = new THREE.PointsMaterial({
      size: 0.15,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      sizeAttenuation: true
    });

    this.starfield = new THREE.Points(starGeometry, starMaterial);
    this.scene.add(this.starfield);
  }

  private createGrid(): void {
    this.gridHelper = new THREE.GridHelper(30, 30, 0x4488ff, 0x2244aa);
    this.gridHelper.material.transparent = true;
    this.gridHelper.material.opacity = 0.08;
    this.gridHelper.position.y = -6;
    this.scene.add(this.gridHelper);
  }

  private setupEventListeners(): void {
    window.addEventListener('resize', () => this.onWindowResize());
    
    this.renderer.domElement.addEventListener('mousedown', (e) => this.onMouseDown(e));
    window.addEventListener('mousemove', (e) => this.onMouseMove(e));
    window.addEventListener('mouseup', () => this.onMouseUp());
    window.addEventListener('wheel', (e) => this.onWheel(e), { passive: false });
    
    this.renderer.domElement.addEventListener('click', (e) => this.onClick(e));

    this.renderer.domElement.addEventListener('touchstart', (e) => this.onTouchStart(e));
    this.renderer.domElement.addEventListener('touchmove', (e) => this.onTouchMove(e));
    this.renderer.domElement.addEventListener('touchend', (e) => this.onTouchEnd(e));
  }

  private onWindowResize(): void {
    this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
  }

  private onMouseDown(event: MouseEvent): void {
    this.isDragging = true;
    this.previousMousePosition = { x: event.clientX, y: event.clientY };
  }

  private onMouseMove(event: MouseEvent): void {
    if (this.isDragging && this.moleculeGroup) {
      const deltaX = event.clientX - this.previousMousePosition.x;
      const deltaY = event.clientY - this.previousMousePosition.y;

      this.rotationVelocity.x = deltaY * 0.005;
      this.rotationVelocity.y = deltaX * 0.005;

      this.moleculeGroup.rotation.x += this.rotationVelocity.x;
      this.moleculeGroup.rotation.y += this.rotationVelocity.y;

      this.previousMousePosition = { x: event.clientX, y: event.clientY };
    }
  }

  private onMouseUp(): void {
    this.isDragging = false;
  }

  private onWheel(event: WheelEvent): void {
    event.preventDefault();
    const delta = event.deltaY * 0.01;
    const direction = new THREE.Vector3();
    this.camera.getWorldDirection(direction);
    
    const maxDistance = 30;
    const minDistance = 3;
    const currentDistance = this.camera.position.length();
    
    if ((delta > 0 && currentDistance < maxDistance) || (delta < 0 && currentDistance > minDistance)) {
      this.camera.position.addScaledVector(direction, delta);
    }
  }

  private onClick(event: MouseEvent): void {
    if (this.isDragging) return;

    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    
    if (this.moleculeGroup) {
      const intersects = this.raycaster.intersectObjects(this.moleculeGroup.children, true);
      
      for (const intersect of intersects) {
        let object = intersect.object as THREE.Mesh;
        while (object.parent && object.parent !== this.moleculeGroup) {
          object = object.parent as THREE.Mesh;
        }
        
        if (this.atomMeshes.has(object)) {
          const atomData = this.atomMeshes.get(object);
          if (this.onAtomClickCallback) {
            this.onAtomClickCallback(atomData, event);
          }
          return;
        }
      }
    }
  }

  private onTouchStart(event: TouchEvent): void {
    if (event.touches.length === 1) {
      this.isDragging = true;
      this.previousMousePosition = { x: event.touches[0].clientX, y: event.touches[0].clientY };
    }
  }

  private onTouchMove(event: TouchEvent): void {
    if (event.touches.length === 1 && this.isDragging && this.moleculeGroup) {
      event.preventDefault();
      const deltaX = event.touches[0].clientX - this.previousMousePosition.x;
      const deltaY = event.touches[0].clientY - this.previousMousePosition.y;

      this.moleculeGroup.rotation.x += deltaY * 0.005;
      this.moleculeGroup.rotation.y += deltaX * 0.005;

      this.previousMousePosition = { x: event.touches[0].clientX, y: event.touches[0].clientY };
    }
  }

  private onTouchEnd(event: TouchEvent): void {
    if (event.changedTouches.length === 1) {
      this.isDragging = false;
    }
  }

  public setMoleculeGroup(group: THREE.Group, atomDataMap: Map<THREE.Mesh, any>): void {
    if (this.moleculeGroup) {
      this.scene.remove(this.moleculeGroup);
      this.moleculeGroup.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose();
          if (Array.isArray(child.material)) {
            child.material.forEach(m => m.dispose());
          } else {
            child.material.dispose();
          }
        }
      });
    }

    this.moleculeGroup = group;
    this.atomMeshes = atomDataMap;
    this.scene.add(group);
    this.applyThemeToMolecule();
  }

  public setOnAtomClick(callback: (atomData: any, event: MouseEvent) => void): void {
    this.onAtomClickCallback = callback;
  }

  public resetCamera(): void {
    if (this.isAnimatingCamera) return;

    this.isAnimatingCamera = true;
    this.animationStartTime = performance.now();
    this.animationStartPosition.copy(this.camera.position);
    this.animationStartQuaternion.copy(this.camera.quaternion);
    
    if (this.moleculeGroup) {
      this.moleculeGroup.rotation.set(0, 0, 0);
    }
  }

  private updateCameraAnimation(currentTime: number): void {
    if (!this.isAnimatingCamera) return;

    const elapsed = currentTime - this.animationStartTime;
    const progress = Math.min(elapsed / this.animationDuration, 1);
    
    const easeProgress = 1 - Math.pow(1 - progress, 3);

    this.camera.position.lerpVectors(
      this.animationStartPosition,
      this.initialCameraPosition,
      easeProgress
    );

    const targetQuaternion = new THREE.Quaternion();
    const tempCamera = new THREE.PerspectiveCamera();
    tempCamera.position.copy(this.initialCameraPosition);
    tempCamera.lookAt(this.initialCameraTarget);
    targetQuaternion.copy(tempCamera.quaternion);

    this.camera.quaternion.slerpQuaternions(
      this.animationStartQuaternion,
      targetQuaternion,
      easeProgress
    );

    if (progress >= 1) {
      this.isAnimatingCamera = false;
    }
  }

  public toggleTheme(): void {
    this.isNeonTheme = !this.isNeonTheme;
    this.currentTheme = this.isNeonTheme ? NEON_THEME : SCIENCE_THEME;
    this.bondOpacity = this.isNeonTheme ? 0.9 : 0.7;
    this.animateThemeChange();
  }

  private animateThemeChange(): void {
    const duration = 500;
    const startTime = performance.now();
    
    const oldAtomColors = new Map<THREE.Mesh, THREE.Color>();
    const oldBondColors = new Map<THREE.Mesh, THREE.Color>();
    
    if (this.moleculeGroup) {
      this.moleculeGroup.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          const material = child.material as THREE.MeshPhongMaterial;
          if (material.color) {
            if (this.atomMeshes.has(child)) {
              oldAtomColors.set(child, material.color.clone());
            } else {
              oldBondColors.set(child, material.color.clone());
            }
          }
        }
      });
    }

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeProgress = 1 - Math.pow(1 - progress, 3);

      oldAtomColors.forEach((oldColor, mesh) => {
        const material = mesh.material as THREE.MeshPhongMaterial;
        const atomData = this.atomMeshes.get(mesh);
        const element = atomData?.element || 'default';
        const newColor = new THREE.Color(this.currentTheme[element] || this.currentTheme.default);
        
        material.color.copy(oldColor.clone().lerp(newColor, easeProgress));
        
        if (this.isNeonTheme) {
          material.emissive = material.color.clone().multiplyScalar(easeProgress * 0.5);
        } else {
          material.emissive = new THREE.Color(0x000000);
        }
      });

      oldBondColors.forEach((oldColor, mesh) => {
        const material = mesh.material as THREE.MeshPhongMaterial;
        const newColor = this.isNeonTheme ? new THREE.Color(0x00ffff) : new THREE.Color(0xcccccc);
        
        material.color.copy(oldColor.clone().lerp(newColor, easeProgress));
        material.opacity = this.bondOpacity;
        
        if (this.isNeonTheme) {
          material.emissive = material.color.clone().multiplyScalar(easeProgress * 0.8);
        } else {
          material.emissive = new THREE.Color(0x000000);
        }
      });

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }

  private applyThemeToMolecule(): void {
    if (!this.moleculeGroup) return;

    this.moleculeGroup.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const material = child.material as THREE.MeshPhongMaterial;
        
        if (this.atomMeshes.has(child)) {
          const atomData = this.atomMeshes.get(child);
          const element = atomData?.element || 'default';
          material.color.setHex(this.currentTheme[element] || this.currentTheme.default);
          
          if (this.isNeonTheme) {
            material.emissive = material.color.clone().multiplyScalar(0.5);
          }
        } else {
          material.color.setHex(this.isNeonTheme ? 0x00ffff : 0xcccccc);
          material.opacity = this.bondOpacity;
          
          if (this.isNeonTheme) {
            material.emissive = material.color.clone().multiplyScalar(0.8);
          }
        }
      }
    });
  }

  public render(): void {
    const currentTime = performance.now();

    if (!this.isDragging && this.moleculeGroup) {
      this.moleculeGroup.rotation.x += this.rotationVelocity.x;
      this.moleculeGroup.rotation.y += this.rotationVelocity.y;
      
      this.rotationVelocity.x *= 0.95;
      this.rotationVelocity.y *= 0.95;
    }

    if (this.starfield) {
      this.starfield.rotation.y += 0.0001;
      this.starfield.rotation.x += 0.00005;
    }

    if (this.gridHelper) {
      const cameraDirection = new THREE.Vector3();
      this.camera.getWorldDirection(cameraDirection);
      const dot = cameraDirection.y;
      this.gridHelper.material.opacity = Math.max(0, dot) * 0.15;
    }

    this.updateCameraAnimation(currentTime);

    this.renderer.render(this.scene, this.camera);
  }

  public dispose(): void {
    this.renderer.dispose();
    this.container.removeChild(this.renderer.domElement);
  }
}
