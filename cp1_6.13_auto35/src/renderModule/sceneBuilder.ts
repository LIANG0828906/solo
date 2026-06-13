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

interface BranchMeshEntry {
  mesh: THREE.Mesh;
  targetBranch: BranchData | null;
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
  private branchMeshPool: BranchMeshEntry[] = [];
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

  private targetBranchesCache: BranchData[] = [];

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

  private easeOut(t: number): number {
    return 1 - Math.pow(1 - t, 3);
  }

  private getBranchAngle(branch: BranchData, index: number): number {
    const contourFactor = Math.sin(index * 0.37) * 0.5 + 0.5;
    const levelFactor = Math.max(0, 1 - branch.level * 0.2);
    return branch.rotation + contourFactor * levelFactor * 0.3;
  }

  private interpolateBranchEnd(branch: BranchData, progress: number): Vector3 {
    const easedProgress = this.easeOut(Math.max(0, Math.min(1, progress)));
    return {
      x: branch.start.x + (branch.end.x - branch.start.x) * easedProgress,
      y: branch.start.y + (branch.end.y - branch.start.y) * easedProgress,
      z: branch.start.z + (branch.end.z - branch.start.z) * easedProgress
    };
  }

  public updatePlant(branches: BranchData[], time: number, growthProgress: number): void {
    if (branches.length > this.targetBranchesCache.length) {
      this.targetBranchesCache = branches.map(b => ({ ...b }));
    }

    const totalBranches = this.targetBranchesCache.length;
    const easedGlobalProgress = this.easeOut(growthProgress);
    const visibleFloat = totalBranches * easedGlobalProgress;
    const visibleCount = Math.min(branches.length, Math.ceil(visibleFloat));

    this.ensureBranchMeshPool(visibleCount);
    this.leafInstance.count = 0;

    const windStrength = Math.max(0, Math.min(10, this.wind.strength));
    const windBendAngle = windStrength * 0.05;
    const windAngle = Math.atan2(this.wind.direction.z, this.wind.direction.x);

    for (let i = 0; i < visibleCount; i++) {
      const branch = this.targetBranchesCache[i] || branches[i];
      if (!branch) continue;

      const branchStart = i / Math.max(1, totalBranches);
      const branchEnd = (i + 1) / Math.max(1, totalBranches);
      const branchLocalProgress = Math.max(0, Math.min(1,
        (growthProgress - branchStart) / Math.max(0.0001, branchEnd - branchStart)
      ));

      const interpolatedEnd = this.interpolateBranchEnd(branch, branchLocalProgress);
      const branchAngle = this.getBranchAngle(branch, i);
      const bentEnd = this.applyWindBending(branch, interpolatedEnd, windBendAngle, windAngle, time, i);

      const entry = this.branchMeshPool[i];
      this.updateBranchMesh(entry.mesh, branch, bentEnd, branchAngle);
      entry.targetBranch = branch;
      entry.mesh.visible = true;

      if (branch.hasLeaf && branchLocalProgress > 0.5) {
        this.addLeafInstance(branch, bentEnd, windStrength, windAngle, time, i);
      }
    }

    for (let i = visibleCount; i < this.branchMeshPool.length; i++) {
      this.branchMeshPool[i].mesh.visible = false;
      this.branchMeshPool[i].targetBranch = null;
    }

    this.leafInstance.mesh.count = this.leafInstance.count;
    this.leafInstance.mesh.instanceMatrix.needsUpdate = true;
    if (this.leafInstance.mesh.instanceColor) {
      this.leafInstance.mesh.instanceColor.needsUpdate = true;
    }
  }

  private ensureBranchMeshPool(count: number): void {
    while (this.branchMeshPool.length < count) {
      const mesh = this.createEmptyBranchMesh();
      this.plantGroup.add(mesh);
      this.branchMeshPool.push({ mesh, targetBranch: null });
    }
  }

  private createEmptyBranchMesh(): THREE.Mesh {
    const geometry = new THREE.CylinderGeometry(0.05, 0.05, 1, 8);
    geometry.translate(0, 0.5, 0);

    const material = new THREE.MeshStandardMaterial({
      color: 0x8b4513,
      roughness: 0.9,
      metalness: 0.05
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.visible = false;
    return mesh;
  }

  private updateBranchMesh(
    mesh: THREE.Mesh,
    branch: BranchData,
    end: Vector3,
    branchAngle: number
  ): void {
    const start = new THREE.Vector3(branch.start.x, branch.start.y, branch.start.z);
    const endVec = new THREE.Vector3(end.x, end.y, end.z);
    const length = Math.max(0.001, start.distanceTo(endVec));

    mesh.scale.set(branch.radius / 0.05, length, branch.radius / 0.05);
    mesh.position.copy(start);

    const direction = new THREE.Vector3().subVectors(endVec, start).normalize();
    const up = new THREE.Vector3(0, 1, 0);
    const quaternion = new THREE.Quaternion().setFromUnitVectors(up, direction);
    mesh.quaternion.copy(quaternion);

    mesh.rotateZ(branchAngle);

    const material = mesh.material as THREE.MeshStandardMaterial;
    const color = new THREE.Color(branch.color);
    const brightness = 0.9 + Math.sin(branch.start.x * 10 + branch.start.y * 7) * 0.05 + 0.05;
    color.multiplyScalar(Math.max(0.7, Math.min(1.2, brightness)));
    material.color.copy(color);
  }

  private applyWindBending(
    branch: BranchData,
    interpolatedEnd: Vector3,
    windBendAngle: number,
    windAngle: number,
    time: number,
    index: number
  ): Vector3 {
    const dx = interpolatedEnd.x - branch.start.x;
    const dy = interpolatedEnd.y - branch.start.y;
    const dz = interpolatedEnd.z - branch.start.z;

    const branchLength = Math.sqrt(dx * dx + dy * dy + dz * dz);
    const heightFactor = Math.max(0, branch.end.y / 3);
    const levelFactor = 1 + branch.level * 0.3;

    const baseFrequency = 1 + this.wind.strength * 0.3;
    const phaseOffset = index * 0.47 + branch.start.x * 2.3 + branch.start.z * 1.7;

    const sineWave = Math.sin(time * baseFrequency * Math.PI * 2 + phaseOffset);
    const noise = (Math.sin(time * 5.7 + phaseOffset * 1.3) * 0.5 +
                   Math.sin(time * 11.3 + phaseOffset * 0.7) * 0.3 +
                   Math.sin(time * 17.9 + phaseOffset * 2.1) * 0.2);

    const dynamicBend = windBendAngle * heightFactor * levelFactor * (sineWave * 0.7 + noise * 0.3);

    const bendAmount = dynamicBend * branchLength;
    const bendX = Math.cos(windAngle) * bendAmount;
    const bendZ = Math.sin(windAngle) * bendAmount;

    const turbulenceNoise = Math.sin(time * 3.1 + index * 0.9) * 0.3 +
                            Math.cos(time * 7.3 + index * 1.4) * 0.2;
    const turbulenceAmount = windBendAngle * branchLength * 0.2 * turbulenceNoise;

    return {
      x: interpolatedEnd.x + bendX + turbulenceAmount * Math.cos(windAngle + 0.5),
      y: interpolatedEnd.y + Math.abs(dynamicBend) * 0.1 * branchLength,
      z: interpolatedEnd.z + bendZ + turbulenceAmount * Math.sin(windAngle + 0.5)
    };
  }

  private createBranchMesh(branch: BranchData, end: Vector3): THREE.Mesh {
    const start = new THREE.Vector3(branch.start.x, branch.start.y, branch.start.z);
    const endVec = new THREE.Vector3(end.x, end.y, end.z);
    const length = Math.max(0.001, start.distanceTo(endVec));

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
    windStrength: number,
    windAngle: number,
    time: number,
    index: number
  ): void {
    const maxLeaves = 200;
    if (this.leafInstance.count >= maxLeaves) return;

    const dummy = this.leafInstance.dummy;

    const baseFrequency = 1 + windStrength * 0.3;
    const leafSwingAmplitude = windStrength * 0.1;

    const baseAngle = Math.atan2(
      branch.end.x - branch.start.x,
      branch.end.z - branch.start.z
    );

    const phaseOffset = index * 0.63 + branch.start.x * 3.1;
    const sineMain = Math.sin(time * baseFrequency * Math.PI * 2 + phaseOffset);
    const noise = Math.sin(time * (baseFrequency * 2.3 + 3) + phaseOffset * 1.7) * 0.4 +
                  Math.cos(time * (baseFrequency * 4.1 + 7) + phaseOffset * 0.9) * 0.2;

    const swingOffset = leafSwingAmplitude * (sineMain * 0.7 + noise * 0.3);
    const swingOffset2 = leafSwingAmplitude * 0.5 * (Math.cos(time * baseFrequency * Math.PI * 2 * 1.3 + phaseOffset * 1.1) + noise * 0.3);

    dummy.position.set(end.x, end.y, end.z);

    const windBend = windStrength * 0.02;
    dummy.rotation.set(
      Math.PI / 4 + swingOffset + windBend * Math.sin(windAngle),
      baseAngle + branch.rotation + swingOffset2 * 0.5,
      swingOffset2 * 0.3
    );

    const leafScale = 0.8 + (Math.sin(index * 2.7) * 0.5 + 0.5) * 0.4;
    dummy.scale.setScalar(leafScale);

    dummy.updateMatrix();
    this.leafInstance.mesh.setMatrixAt(this.leafInstance.count, dummy.matrix);

    const leafColor = new THREE.Color(branch.color);
    const hueShift = (Math.sin(index * 1.9) * 0.5) * 0.1;
    leafColor.offsetHSL(hueShift, 0, (Math.sin(index * 3.3) * 0.5) * 0.2);
    this.leafInstance.mesh.setColorAt(this.leafInstance.count, leafColor);

    this.leafInstance.count++;
  }

  private clearBranches(): void {
    for (const entry of this.branchMeshPool) {
      this.plantGroup.remove(entry.mesh);
      entry.mesh.geometry.dispose();
      (entry.mesh.material as THREE.Material).dispose();
    }
    this.branchMeshPool = [];
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

    this.fadeOverlay.style.opacity = '1';

    const handleTransitionEnd = (): void => {
      this.fadeOverlay.removeEventListener('transitionend', handleTransitionEnd);
      this.isFading = false;
      if (callback) callback();
    };

    this.fadeOverlay.addEventListener('transitionend', handleTransitionEnd);

    setTimeout(() => {
      this.fadeOverlay.removeEventListener('transitionend', handleTransitionEnd);
      if (this.isFading) {
        this.isFading = false;
        if (callback) callback();
      }
    }, 600);
  }

  public fadeIn(callback?: () => void): void {
    if (this.isFading) return;
    this.isFading = true;

    this.fadeOverlay.style.opacity = '0';

    const handleTransitionEnd = (): void => {
      this.fadeOverlay.removeEventListener('transitionend', handleTransitionEnd);
      this.isFading = false;
      if (callback) callback();
    };

    this.fadeOverlay.addEventListener('transitionend', handleTransitionEnd);

    setTimeout(() => {
      this.fadeOverlay.removeEventListener('transitionend', handleTransitionEnd);
      if (this.isFading) {
        this.isFading = false;
        if (callback) callback();
      }
    }, 600);
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
    this.targetBranchesCache = [];

    this.leafInstance.mesh.geometry.dispose();
    (this.leafInstance.mesh.material as THREE.Material).dispose();

    this.renderer.dispose();
    this.container.removeChild(this.renderer.domElement);
  }
}
