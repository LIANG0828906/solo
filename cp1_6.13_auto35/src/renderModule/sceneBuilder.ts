import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { BranchData, Vector3 } from '../processModule/growthController';

export interface WindParams {
  direction: { x: number; z: number };
  strength: number;
}

interface LeafInstance {
  mesh: THREE.InstancedMesh;
  count: number;
  dummy: THREE.Object3D;
}

export class SceneBuilder {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private controls: OrbitControls;
  private container: HTMLElement;
  
  private ambientLight: THREE.AmbientLight;
  private directionalLight: THREE.DirectionalLight;
  private directionalLightOn: boolean = true;
  
  private plantGroup: THREE.Group;
  private branchMeshes: THREE.Mesh[] = [];
  private leafInstance!: LeafInstance;
  private ground: THREE.Mesh;
  
  private wind: WindParams = {
    direction: { x: 1, z: 0 },
    strength: 3
  };
  
  private clock: THREE.Clock;
  private animationFrameId: number | null = null;
  private onAnimate?: (deltaTime: number) => void;
  
  private fadeOverlay: HTMLElement;
  private isFading: boolean = false;

  constructor(containerId: string) {
    this.container = document.getElementById(containerId)!;
    this.clock = new THREE.Clock();
    this.fadeOverlay = document.getElementById('fade-overlay')!;
    
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x1a1a2e);
    this.scene.fog = new THREE.Fog(0x1a1a2e, 10, 30);
    
    this.camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.camera.position.set(0, 2, 5);
    this.camera.lookAt(0, 1, 0);
    
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.container.appendChild(this.renderer.domElement);
    
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.minDistance = 2;
    this.controls.maxDistance = 15;
    this.controls.maxPolarAngle = Math.PI * 0.85;
    this.controls.target.set(0, 1, 0);
    
    this.ambientLight = new THREE.AmbientLight(0x404060, 0.5);
    this.scene.add(this.ambientLight);
    
    this.directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    this.directionalLight.position.set(5, 10, 7);
    this.directionalLight.castShadow = true;
    this.directionalLight.shadow.mapSize.width = 2048;
    this.directionalLight.shadow.mapSize.height = 2048;
    this.directionalLight.shadow.camera.near = 0.5;
    this.directionalLight.shadow.camera.far = 50;
    this.directionalLight.shadow.camera.left = -10;
    this.directionalLight.shadow.camera.right = 10;
    this.directionalLight.shadow.camera.top = 10;
    this.directionalLight.shadow.camera.bottom = -10;
    this.directionalLight.shadow.bias = -0.0001;
    this.scene.add(this.directionalLight);
    
    this.plantGroup = new THREE.Group();
    this.plantGroup.position.y = -0.5;
    this.scene.add(this.plantGroup);
    
    this.ground = this.createGround();
    this.scene.add(this.ground);
    
    this.createLeafInstance();
    
    window.addEventListener('resize', this.onResize.bind(this));
  }

  private createGround(): THREE.Mesh {
    const geometry = new THREE.CircleGeometry(10, 64);
    const material = new THREE.MeshStandardMaterial({
      color: 0x1a1a2e,
      transparent: true,
      opacity: 0.6,
      roughness: 0.8,
      metalness: 0.2
    });
    
    const mesh = new THREE.Mesh(geometry, material);
    mesh.rotation.x = -Math.PI / 2;
    mesh.receiveShadow = true;
    
    const grid = new THREE.GridHelper(20, 40, 0x333355, 0x222244);
    grid.position.y = -0.001;
    (grid.material as THREE.Material).transparent = true;
    (grid.material as THREE.Material).opacity = 0.3;
    this.scene.add(grid);
    
    return mesh;
  }

  private createLeafInstance(): void {
    const leafShape = 1;
    const leafWidth = 0.15 * leafShape;
    const leafHeight = 0.15 / leafShape;
    
    const shape = new THREE.Shape();
    shape.moveTo(0, 0);
    shape.quadraticCurveTo(leafWidth * 0.5, leafHeight * 0.3, leafWidth, leafHeight);
    shape.quadraticCurveTo(leafWidth * 0.5, leafHeight * 0.7, 0, leafHeight * 0.5);
    shape.quadraticCurveTo(-leafWidth * 0.5, leafHeight * 0.7, -leafWidth, leafHeight);
    shape.quadraticCurveTo(-leafWidth * 0.5, leafHeight * 0.3, 0, 0);
    
    const geometry = new THREE.ShapeGeometry(shape);
    geometry.computeVertexNormals();
    
    const material = new THREE.MeshStandardMaterial({
      color: 0x4ade80,
      side: THREE.DoubleSide,
      roughness: 0.6,
      metalness: 0.1
    });
    
    const maxLeaves = 200;
    this.leafInstance = {
      mesh: new THREE.InstancedMesh(geometry, material, maxLeaves),
      count: 0,
      dummy: new THREE.Object3D()
    };
    
    this.leafInstance.mesh.castShadow = true;
    this.leafInstance.mesh.receiveShadow = true;
    this.plantGroup.add(this.leafInstance.mesh);
  }

  public setOnAnimate(callback: (deltaTime: number) => void): void {
    this.onAnimate = callback;
  }

  public updateWind(params: WindParams): void {
    this.wind = params;
  }

  public toggleDirectionalLight(enabled: boolean): void {
    this.directionalLightOn = enabled;
    this.directionalLight.intensity = enabled ? 1 : 0;
  }

  public isDirectionalLightOn(): boolean {
    return this.directionalLightOn;
  }

  public updatePlant(branches: BranchData[], time: number): void {
    this.clearBranches();
    this.leafInstance.count = 0;
    
    const windFactor = this.wind.strength / 10;
    const windAngle = Math.atan2(this.wind.direction.z, this.wind.direction.x);
    
    for (let i = 0; i < branches.length; i++) {
      const branch = branches[i];
      
      const bentEnd = this.applyWindBending(branch, windFactor, windAngle, time);
      const branchMesh = this.createBranchMesh(branch, bentEnd);
      this.plantGroup.add(branchMesh);
      this.branchMeshes.push(branchMesh);
      
      if (branch.hasLeaf) {
        this.addLeafInstance(branch, bentEnd, windFactor, windAngle, time, i);
      }
    }
    
    this.leafInstance.mesh.count = this.leafInstance.count;
    this.leafInstance.mesh.instanceMatrix.needsUpdate = true;
  }

  private applyWindBending(
    branch: BranchData,
    windFactor: number,
    windAngle: number,
    time: number
  ): Vector3 {
    const dx = branch.end.x - branch.start.x;
    const dy = branch.end.y - branch.start.y;
    const dz = branch.end.z - branch.start.z;
    
    const branchLength = Math.sqrt(dx * dx + dy * dy + dz * dz);
    const heightFactor = Math.max(0, branch.end.y / 3);
    
    const bendAmount = windFactor * heightFactor * branchLength * 0.15;
    const bendX = Math.cos(windAngle) * bendAmount;
    const bendZ = Math.sin(windAngle) * bendAmount;
    
    const turbulence = Math.sin(time * 2 + branch.start.x * 5 + branch.start.z * 3) * 0.3
                     + Math.sin(time * 3.7 + branch.start.y * 2) * 0.2;
    const turbulenceAmount = windFactor * 0.05 * turbulence;
    
    return {
      x: branch.end.x + bendX + turbulenceAmount * Math.cos(windAngle),
      y: branch.end.y,
      z: branch.end.z + bendZ + turbulenceAmount * Math.sin(windAngle)
    };
  }

  private createBranchMesh(branch: BranchData, end: Vector3): THREE.Mesh {
    const start = new THREE.Vector3(branch.start.x, branch.start.y, branch.start.z);
    const endVec = new THREE.Vector3(end.x, end.y, end.z);
    const length = start.distanceTo(endVec);
    
    const geometry = new THREE.CylinderGeometry(
      branch.radius * 0.8,
      branch.radius,
      length,
      8
    );
    
    geometry.translate(0, length / 2, 0);
    
    const color = new THREE.Color(branch.color);
    const brightness = 0.9 + Math.random() * 0.2;
    color.multiplyScalar(brightness);
    
    const material = new THREE.MeshStandardMaterial({
      color,
      roughness: 0.9,
      metalness: 0.05
    });
    
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.copy(start);
    mesh.lookAt(endVec);
    mesh.rotateX(Math.PI / 2);
    mesh.rotateZ(branch.rotation);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    
    return mesh;
  }

  private addLeafInstance(
    branch: BranchData,
    end: Vector3,
    windFactor: number,
    windAngle: number,
    time: number,
    index: number
  ): void {
    if (this.leafInstance.count >= 200) return;
    
    const dummy = this.leafInstance.dummy;
    
    const leafSwingFrequency = 1 + windFactor * 3;
    const leafSwingAmplitude = 0.1 + windFactor * 0.4;
    
    const baseAngle = Math.atan2(
      branch.end.x - branch.start.x,
      branch.end.z - branch.start.z
    );
    
    const swingOffset = Math.sin(time * leafSwingFrequency + index * 0.7) * leafSwingAmplitude;
    const swingOffset2 = Math.cos(time * leafSwingFrequency * 1.3 + index * 1.1) * leafSwingAmplitude * 0.5;
    
    dummy.position.set(end.x, end.y, end.z);
    
    const windBend = windFactor * 0.3;
    dummy.rotation.set(
      Math.PI / 4 + swingOffset + windBend * Math.sin(windAngle),
      baseAngle + branch.rotation + swingOffset2 * 0.5,
      swingOffset2 * 0.3
    );
    
    const leafScale = 0.8 + Math.random() * 0.4;
    dummy.scale.setScalar(leafScale);
    
    dummy.updateMatrix();
    this.leafInstance.mesh.setMatrixAt(this.leafInstance.count, dummy.matrix);
    
    const leafColor = new THREE.Color(branch.color);
    const hueShift = (Math.random() - 0.5) * 0.1;
    leafColor.offsetHSL(hueShift, 0, (Math.random() - 0.5) * 0.2);
    this.leafInstance.mesh.setColorAt(this.leafInstance.count, leafColor);
    
    this.leafInstance.count++;
  }

  private clearBranches(): void {
    for (const mesh of this.branchMeshes) {
      this.plantGroup.remove(mesh);
      mesh.geometry.dispose();
      (mesh.material as THREE.Material).dispose();
    }
    this.branchMeshes = [];
  }

  public startAnimation(): void {
    this.animate();
  }

  public stopAnimation(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  private animate(): void {
    this.animationFrameId = requestAnimationFrame(this.animate.bind(this));
    
    const deltaTime = this.clock.getDelta();
    
    if (this.onAnimate) {
      this.onAnimate(deltaTime);
    }
    
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }

  private onResize(): void {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  public fadeOut(callback?: () => void): void {
    if (this.isFading) return;
    this.isFading = true;
    
    this.fadeOverlay.classList.add('active');
    
    setTimeout(() => {
      this.isFading = false;
      if (callback) callback();
    }, 500);
  }

  public fadeIn(callback?: () => void): void {
    if (this.isFading) return;
    this.isFading = true;
    
    setTimeout(() => {
      this.fadeOverlay.classList.remove('active');
      this.isFading = false;
      if (callback) callback();
    }, 50);
  }

  public getScene(): THREE.Scene {
    return this.scene;
  }

  public getCamera(): THREE.PerspectiveCamera {
    return this.camera;
  }

  public getRenderer(): THREE.WebGLRenderer {
    return this.renderer;
  }

  public getControls(): OrbitControls {
    return this.controls;
  }

  public dispose(): void {
    this.stopAnimation();
    window.removeEventListener('resize', this.onResize.bind(this));
    this.clearBranches();
    
    this.leafInstance.mesh.geometry.dispose();
    (this.leafInstance.mesh.material as THREE.Material).dispose();
    
    this.renderer.dispose();
    this.container.removeChild(this.renderer.domElement);
  }
}
