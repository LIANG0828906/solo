import * as THREE from 'three';
import { create } from 'zustand';

export interface SphereSystemConfig {
  outerRadius: number;
  middleRadius: number;
  innerRadius: number;
  particleCount: number;
  fragmentCount: number;
  passwordLength: number;
}

interface HexFragment {
  id: number;
  mesh: THREE.Mesh;
  targetPosition: THREE.Vector3;
  targetRotation: THREE.Euler;
  isSnapped: boolean;
  glowMesh: THREE.Mesh;
}

interface AppState {
  snappedCount: number;
  totalFragments: number;
  progress: number;
  isComplete: boolean;
  setSnappedCount: (count: number) => void;
  setComplete: (complete: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  snappedCount: 0,
  totalFragments: 12,
  progress: 0,
  isComplete: false,
  setSnappedCount: (count: number) =>
    set((state) => ({
      snappedCount: count,
      progress: (count / state.totalFragments) * 100,
      isComplete: count === state.totalFragments
    })),
  setComplete: (complete: boolean) => set({ isComplete: complete })
}));

export class EncryptedSphere {
  private scene: THREE.Scene;
  private config: SphereSystemConfig;
  private camera: THREE.PerspectiveCamera;

  private outerSphere!: THREE.Mesh;
  private outerParticles!: THREE.Points;
  private particleBasePositions: Float32Array;
  private particleLatitudes: Float32Array;

  private fragments: HexFragment[] = [];
  private innerSphere!: THREE.Mesh;
  private innerTexture!: THREE.CanvasTexture;
  private innerCanvas: HTMLCanvasElement;
  private innerContext: CanvasRenderingContext2D;

  private raycaster: THREE.Raycaster;
  private pointer: THREE.Vector2;
  private draggedFragment: HexFragment | null = null;
  private dragOffset: THREE.Vector3 = new THREE.Vector3();
  private dragPlane: THREE.Plane = new THREE.Plane();

  private innerRotationSpeed: number = 0.2;
  private currentInnerBrightness: number = 0.5;
  private targetInnerBrightness: number = 0.5;

  private passwordText: string = '';
  private passwordRefreshTimer: number = 0;
  private passwordFlashAlpha: number = 1;

  private group: THREE.Group;

  constructor(
    scene: THREE.Scene,
    config: SphereSystemConfig,
    camera: THREE.PerspectiveCamera
  ) {
    this.scene = scene;
    this.config = config;
    this.camera = camera;
    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();

    this.particleBasePositions = new Float32Array(config.particleCount * 3);
    this.particleLatitudes = new Float32Array(config.particleCount);

    this.innerCanvas = document.createElement('canvas');
    this.innerCanvas.width = 512;
    this.innerCanvas.height = 512;
    const ctx = this.innerCanvas.getContext('2d');
    if (!ctx) throw new Error('Cannot get canvas context');
    this.innerContext = ctx;

    this.group = new THREE.Group();
    scene.add(this.group);

    this.createOuterSphere();
    this.createOuterParticles();
    this.createMiddleFragments();
    this.createInnerSphere();
    this.generatePassword();

    useAppStore.getState().setSnappedCount(0);
  }

  private createOuterSphere(): void {
    const geometry = new THREE.SphereGeometry(this.config.outerRadius, 64, 64);
    const material = new THREE.MeshPhysicalMaterial({
      color: 0x0088ff,
      transparent: true,
      opacity: 0.25,
      roughness: 0.1,
      metalness: 0.1,
      transmission: 0.9,
      thickness: 0.5,
      side: THREE.DoubleSide
    });
    this.outerSphere = new THREE.Mesh(geometry, material);
    this.group.add(this.outerSphere);
  }

  private createOuterParticles(): void {
    const positions = new Float32Array(this.config.particleCount * 3);

    for (let i = 0; i < this.config.particleCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = this.config.outerRadius + 0.05;

      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.sin(phi) * Math.sin(theta);
      const z = r * Math.cos(phi);

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      this.particleBasePositions[i * 3] = x;
      this.particleBasePositions[i * 3 + 1] = y;
      this.particleBasePositions[i * 3 + 2] = z;

      this.particleLatitudes[i] = phi;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
      color: 0xc0c0c0,
      size: 0.08,
      transparent: true,
      opacity: 0.9,
      sizeAttenuation: true
    });

    this.outerParticles = new THREE.Points(geometry, material);
    this.group.add(this.outerParticles);
  }

  private createMiddleFragments(): void {
    const hexGeometry = new THREE.CylinderGeometry(0.8, 0.8, 0.15, 6);
    const glowGeometry = new THREE.CylinderGeometry(0.9, 0.9, 0.18, 6);

    const points = this.generateFibonacciSphere(this.config.fragmentCount);

    for (let i = 0; i < this.config.fragmentCount; i++) {
      const point = points[i];
      const targetPos = point.multiplyScalar(this.config.middleRadius);

      const offset = new THREE.Vector3(
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 2
      );
      const startPos = targetPos.clone().add(offset);

      const material = new THREE.MeshStandardMaterial({
        color: 0x2a6fbf,
        metalness: 0.6,
        roughness: 0.3,
        emissive: 0x002244,
        emissiveIntensity: 0.3
      });

      const mesh = new THREE.Mesh(hexGeometry, material);
      mesh.position.copy(startPos);

      const targetRot = new THREE.Euler(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      );
      mesh.rotation.copy(targetRot);

      mesh.lookAt(new THREE.Vector3(0, 0, 0));
      mesh.rotateX(Math.PI / 2);

      const glowMaterial = new THREE.MeshBasicMaterial({
        color: 0xffeb96,
        transparent: true,
        opacity: 0,
        side: THREE.BackSide
      });
      const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
      mesh.add(glowMesh);

      this.group.add(mesh);

      this.fragments.push({
        id: i,
        mesh,
        targetPosition: targetPos,
        targetRotation: mesh.rotation.clone(),
        isSnapped: false,
        glowMesh
      });
    }
  }

  private generateFibonacciSphere(count: number): THREE.Vector3[] {
    const points: THREE.Vector3[] = [];
    const phi = Math.PI * (3 - Math.sqrt(5));

    for (let i = 0; i < count; i++) {
      const y = 1 - (i / (count - 1)) * 2;
      const radius = Math.sqrt(1 - y * y);
      const theta = phi * i;

      const x = Math.cos(theta) * radius;
      const z = Math.sin(theta) * radius;

      points.push(new THREE.Vector3(x, y, z));
    }

    return points;
  }

  private createInnerSphere(): void {
    this.updatePasswordTexture();

    const geometry = new THREE.SphereGeometry(this.config.innerRadius, 32, 32);
    this.innerTexture = new THREE.CanvasTexture(this.innerCanvas);
    this.innerTexture.wrapS = THREE.RepeatWrapping;
    this.innerTexture.wrapT = THREE.RepeatWrapping;

    const material = new THREE.MeshBasicMaterial({
      map: this.innerTexture,
      transparent: true,
      opacity: 1
    });

    this.innerSphere = new THREE.Mesh(geometry, material);
    this.group.add(this.innerSphere);
  }

  private generatePassword(): void {
    let password = '';
    for (let i = 0; i < this.config.passwordLength; i++) {
      password += Math.floor(Math.random() * 10).toString();
    }
    this.passwordText = password;
    this.passwordFlashAlpha = 0;
    this.updatePasswordTexture();
  }

  private updatePasswordTexture(): void {
    const ctx = this.innerContext;
    const w = this.innerCanvas.width;
    const h = this.innerCanvas.height;

    ctx.fillStyle = `rgba(0, 30, 60, ${this.currentInnerBrightness})`;
    ctx.fillRect(0, 0, w, h);

    const gradient = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
    gradient.addColorStop(0, `rgba(0, 191, 255, ${0.3 * this.currentInnerBrightness})`);
    gradient.addColorStop(1, 'rgba(0, 20, 40, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, h);

    const alpha = 0.3 + 0.7 * this.passwordFlashAlpha;
    ctx.font = 'bold 72px Courier New, monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.shadowColor = '#00BFFF';
    ctx.shadowBlur = 20;
    ctx.fillStyle = `rgba(0, 191, 255, ${alpha})`;
    ctx.fillText(this.passwordText, w / 2, h / 2);

    ctx.shadowBlur = 0;
    ctx.font = '14px Courier New, monospace';
    ctx.fillStyle = `rgba(100, 150, 200, ${0.5 * this.currentInnerBrightness})`;

    for (let i = 0; i < 20; i++) {
      const lineY = (i / 20) * h;
      const chars = Math.floor(Math.random() * 30) + 10;
      let noiseText = '';
      for (let j = 0; j < chars; j++) {
        noiseText += Math.floor(Math.random() * 10).toString();
      }
      ctx.fillText(noiseText, (i % 2 === 0 ? -50 : 50) + Math.random() * 100, lineY);
    }

    if (this.innerTexture) {
      this.innerTexture.needsUpdate = true;
    }
  }

  public onPointerDown(event: PointerEvent, rect: DOMRect): void {
    if (event.button !== 0) return;

    this.pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.pointer, this.camera);

    const meshes = this.fragments
      .filter((f) => !f.isSnapped)
      .map((f) => f.mesh);
    const intersects = this.raycaster.intersectObjects(meshes, false);

    if (intersects.length > 0) {
      const hitMesh = intersects[0].object as THREE.Mesh;
      const fragment = this.fragments.find((f) => f.mesh === hitMesh);

      if (fragment) {
        this.draggedFragment = fragment;
        document.body.classList.add('grabbing');

        const normal = new THREE.Vector3();
        normal.subVectors(this.camera.position, fragment.mesh.position).normalize();
        this.dragPlane.setFromNormalAndCoplanarPoint(
          normal,
          fragment.mesh.position
        );

        const intersectionPoint = new THREE.Vector3();
        this.raycaster.ray.intersectPlane(this.dragPlane, intersectionPoint);
        this.dragOffset.subVectors(fragment.mesh.position, intersectionPoint);

        event.stopPropagation();
      }
    }
  }

  public onPointerMove(event: PointerEvent, rect: DOMRect): void {
    if (!this.draggedFragment) return;

    this.pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.pointer, this.camera);

    const intersectionPoint = new THREE.Vector3();
    this.raycaster.ray.intersectPlane(this.dragPlane, intersectionPoint);

    this.draggedFragment.mesh.position.copy(
      intersectionPoint.add(this.dragOffset)
    );

    const distance = this.draggedFragment.mesh.position.distanceTo(
      this.draggedFragment.targetPosition
    );

    const material = this.draggedFragment.mesh.material as THREE.MeshStandardMaterial;
    if (distance < 0.6) {
      const t = 1 - (distance - 0.3) / 0.3;
      material.emissive.setHex(0x0066aa);
      material.emissiveIntensity = 0.3 + t * 0.5;
    } else {
      material.emissive.setHex(0x002244);
      material.emissiveIntensity = 0.3;
    }

    event.stopPropagation();
  }

  public onPointerUp(event: PointerEvent): void {
    if (this.draggedFragment) {
      const distance = this.draggedFragment.mesh.position.distanceTo(
        this.draggedFragment.targetPosition
      );

      if (distance < 0.3) {
        this.snapFragment(this.draggedFragment);
      } else {
        const material = this.draggedFragment.mesh.material as THREE.MeshStandardMaterial;
        material.emissive.setHex(0x002244);
        material.emissiveIntensity = 0.3;
      }

      this.draggedFragment = null;
      document.body.classList.remove('grabbing');
      event.stopPropagation();
    }
  }

  private snapFragment(fragment: HexFragment): void {
    fragment.isSnapped = true;

    fragment.mesh.position.copy(fragment.targetPosition);
    fragment.mesh.rotation.copy(fragment.targetRotation);

    const material = fragment.mesh.material as THREE.MeshStandardMaterial;
    material.emissive.setHex(0x00aaff);
    material.emissiveIntensity = 0.8;

    const glowMaterial = fragment.glowMesh.material as THREE.MeshBasicMaterial;
    glowMaterial.opacity = 0.8;
    setTimeout(() => {
      glowMaterial.opacity = 0;
    }, 200);

    this.triggerFlash();

    const snappedCount = this.fragments.filter((f) => f.isSnapped).length;
    useAppStore.getState().setSnappedCount(snappedCount);

    if (snappedCount === this.config.fragmentCount) {
      this.targetInnerBrightness = 1.0;
      this.innerRotationSpeed = 0.5;
      useAppStore.getState().setComplete(true);
    }
  }

  private triggerFlash(): void {
    const overlay = document.getElementById('flash-overlay');
    if (overlay) {
      overlay.classList.add('active');
      setTimeout(() => {
        overlay.classList.remove('active');
      }, 200);
    }
  }

  public update(deltaTime: number, elapsedTime: number): void {
    const positions = this.outerParticles.geometry.attributes.position.array as Float32Array;

    for (let i = 0; i < this.config.particleCount; i++) {
      const baseX = this.particleBasePositions[i * 3];
      const baseY = this.particleBasePositions[i * 3 + 1];
      const baseZ = this.particleBasePositions[i * 3 + 2];

      const latitude = this.particleLatitudes[i];
      const offset = Math.sin(latitude + elapsedTime * 0.05) * 0.08;

      const len = Math.sqrt(baseX * baseX + baseY * baseY + baseZ * baseZ);
      const factor = (this.config.outerRadius + 0.05 + offset) / len;

      positions[i * 3] = baseX * factor;
      positions[i * 3 + 1] = baseY * factor;
      positions[i * 3 + 2] = baseZ * factor;
    }
    this.outerParticles.geometry.attributes.position.needsUpdate = true;

    if (this.draggedFragment) {
      const normal = new THREE.Vector3();
      normal.subVectors(this.camera.position, this.draggedFragment.mesh.position).normalize();
      this.dragPlane.setFromNormalAndCoplanarPoint(
        normal,
        this.draggedFragment.mesh.position
      );
    }

    for (const fragment of this.fragments) {
      if (!fragment.isSnapped && fragment !== this.draggedFragment) {
        const floatOffset = Math.sin(elapsedTime * 0.5 + fragment.id) * 0.02;
        fragment.mesh.position.y += 0;
        void floatOffset;
      }
    }

    if (this.currentInnerBrightness < this.targetInnerBrightness) {
      this.currentInnerBrightness = Math.min(
        this.currentInnerBrightness + deltaTime * 0.5,
        this.targetInnerBrightness
      );
    }

    this.passwordRefreshTimer += deltaTime;
    if (this.passwordRefreshTimer >= 2) {
      this.passwordRefreshTimer = 0;
      this.generatePassword();
    }

    if (this.passwordFlashAlpha < 1) {
      this.passwordFlashAlpha = Math.min(
        this.passwordFlashAlpha + deltaTime * 3,
        1
      );
    }

    this.updatePasswordTexture();

    this.innerSphere.rotation.y += this.innerRotationSpeed * deltaTime;
    this.innerSphere.rotation.x += this.innerRotationSpeed * 0.3 * deltaTime;
  }

  public getGroup(): THREE.Group {
    return this.group;
  }

  public getSnappedCount(): number {
    return this.fragments.filter((f) => f.isSnapped).length;
  }

  public getAllSnapped(): boolean {
    return this.fragments.every((f) => f.isSnapped);
  }
}
