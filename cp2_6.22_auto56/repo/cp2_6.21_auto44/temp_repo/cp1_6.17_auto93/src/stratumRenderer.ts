import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import TWEEN from '@tweenjs/tween.js';
import { ParsedStratum, useAppStore } from './stratumParser';

const BLOCK_WIDTH = 10;
const BLOCK_DEPTH = 10;
const GAP = 0.05;
const NOISE_AMOUNT = 0.1;

interface StratumMesh {
  id: string;
  mesh: THREE.Mesh;
  clippingPlane: THREE.Plane | null;
}

export class StratumRenderer {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private controls: OrbitControls;
  private container: HTMLElement;
  private stratumMeshes: Map<string, StratumMesh> = new Map();
  private raycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;
  private cutPlane: THREE.Plane;
  private cutPlaneMesh: THREE.Mesh | null = null;
  private cutGridHelper: THREE.GridHelper | null = null;
  private animationId: number | null = null;
  private strata: ParsedStratum[] = [];
  private defaultCameraPosition = new THREE.Vector3(0, 8, 12);
  private defaultTarget = new THREE.Vector3(0, 0, 0);
  private onMeshClickCallback: ((stratumId: string, screenX: number, screenY: number) => void) | null = null;

  constructor(container: HTMLElement) {
    this.container = container;
    this.scene = new THREE.Scene();
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.cutPlane = new THREE.Plane(new THREE.Vector3(0, -1, 0), 100);

    const width = container.clientWidth;
    const height = container.clientHeight;

    this.camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    this.camera.position.copy(this.defaultCameraPosition);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = false;
    this.renderer.localClippingEnabled = true;
    container.appendChild(this.renderer.domElement);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.1;
    this.controls.minDistance = 3;
    this.controls.maxDistance = 25;
    this.controls.target.copy(this.defaultTarget);

    this.setupLighting();
    this.setupBackground();
    this.setupGroundGrid();
    this.setupEventListeners();
  }

  private setupLighting(): void {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
    this.scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight1.position.set(5, 10, 7);
    this.scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0xffffff, 0.5);
    dirLight2.position.set(-6, 5, -4);
    this.scene.add(dirLight2);
  }

  private setupBackground(): void {
    const canvas = document.createElement('canvas');
    canvas.width = 2;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;
    const gradient = ctx.createLinearGradient(0, 0, 0, 256);
    gradient.addColorStop(0, '#0B0E17');
    gradient.addColorStop(1, '#1A1F30');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 2, 256);
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    this.scene.background = texture;
  }

  private setupGroundGrid(): void {
    const gridHelper = new THREE.GridHelper(20, 20, 0x3B82F6, 0x3B82F6);
    gridHelper.position.y = -6.5;
    const gridMaterial = gridHelper.material as THREE.Material;
    gridMaterial.transparent = true;
    gridMaterial.opacity = 0.12;
    this.scene.add(gridHelper);
  }

  private setupEventListeners(): void {
    window.addEventListener('resize', this.onResize.bind(this));
    this.renderer.domElement.addEventListener('click', this.onMouseClick.bind(this));
    this.renderer.domElement.addEventListener('mousemove', this.onMouseMove.bind(this));
  }

  private onResize(): void {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  private onMouseMove(event: MouseEvent): void {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  }

  private onMouseClick(event: MouseEvent): void {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const meshes = Array.from(this.stratumMeshes.values())
      .filter(sm => {
        const opacity = useAppStore.getState().stratumOpacities[sm.id] ?? 100;
        return opacity > 5;
      })
      .map(sm => sm.mesh);

    const intersects = this.raycaster.intersectObjects(meshes, false);

    if (intersects.length > 0) {
      const mesh = intersects[0].object as THREE.Mesh;
      const stratumId = mesh.userData.stratumId;
      if (stratumId && this.onMeshClickCallback) {
        const viewport = this.renderer.domElement.getBoundingClientRect();
        const screenX = event.clientX - viewport.left;
        const screenY = event.clientY - viewport.top - 30;
        this.onMeshClickCallback(stratumId, screenX, screenY);
      }
    }
  }

  public setOnMeshClick(callback: (stratumId: string, screenX: number, screenY: number) => void): void {
    this.onMeshClickCallback = callback;
  }

  public loadStrata(strata: ParsedStratum[]): void {
    this.strata = strata;
    this.clearStrata();

    strata.forEach((stratum) => {
      const mesh = this.createStratumMesh(stratum);
      this.scene.add(mesh);
      this.stratumMeshes.set(stratum.id, {
        id: stratum.id,
        mesh,
        clippingPlane: null
      });
    });

    this.updateCutDepth(0);
  }

  private clearStrata(): void {
    this.stratumMeshes.forEach((sm) => {
      this.scene.remove(sm.mesh);
      (sm.mesh.geometry as THREE.BufferGeometry).dispose();
      const material = sm.mesh.material as THREE.Material;
      material.dispose();
    });
    this.stratumMeshes.clear();

    if (this.cutPlaneMesh) {
      this.scene.remove(this.cutPlaneMesh);
      (this.cutPlaneMesh.geometry as THREE.BufferGeometry).dispose();
      const material = this.cutPlaneMesh.material as THREE.Material;
      material.dispose();
      this.cutPlaneMesh = null;
    }

    if (this.cutGridHelper) {
      this.scene.remove(this.cutGridHelper);
      const gridMaterial = this.cutGridHelper.material as THREE.Material;
      gridMaterial.dispose();
      this.cutGridHelper = null;
    }
  }

  private createStratumMesh(stratum: ParsedStratum): THREE.Mesh {
    const thickness = stratum.thickness - GAP;
    const geometry = new THREE.BoxGeometry(BLOCK_WIDTH, thickness, BLOCK_DEPTH);

    const positions = geometry.attributes.position;
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      const y = positions.getY(i);
      const z = positions.getZ(i);
      positions.setX(i, x + (Math.random() - 0.5) * NOISE_AMOUNT);
      positions.setZ(i, z + (Math.random() - 0.5) * NOISE_AMOUNT);
      if (Math.abs(y) > thickness / 2 - 0.01) {
        positions.setY(i, y + (Math.random() - 0.5) * NOISE_AMOUNT * 0.5);
      }
    }
    geometry.computeVertexNormals();

    const texture = this.generateTexture(stratum);
    const material = new THREE.MeshStandardMaterial({
      color: new THREE.Color(stratum.color),
      map: texture,
      roughness: 0.7,
      metalness: 0.0,
      transparent: true,
      opacity: 0.85,
      side: THREE.DoubleSide
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.y = stratum.yPosition;
    mesh.userData.stratumId = stratum.id;
    mesh.userData.baseColor = stratum.color;

    return mesh;
  }

  private generateTexture(stratum: ParsedStratum): THREE.Texture {
    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    const baseColor = new THREE.Color(stratum.color);
    const darker = baseColor.clone().multiplyScalar(0.75);
    const lighter = baseColor.clone().multiplyScalar(1.15);

    ctx.fillStyle = `rgb(${Math.floor(baseColor.r * 255)}, ${Math.floor(baseColor.g * 255)}, ${Math.floor(baseColor.b * 255)})`;
    ctx.fillRect(0, 0, size, size);

    switch (stratum.textureType) {
      case 'noise':
        this.generateNoiseTexture(ctx, size, darker, lighter);
        break;
      case 'stripes':
        this.generateStripeTexture(ctx, size, baseColor, darker, lighter);
        break;
      case 'mixed':
        this.generateMixedTexture(ctx, size, baseColor, darker, lighter);
        break;
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.needsUpdate = true;
    return texture;
  }

  private generateNoiseTexture(ctx: CanvasRenderingContext2D, size: number, darker: THREE.Color, lighter: THREE.Color): void {
    const imageData = ctx.getImageData(0, 0, size, size);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
      const noise = Math.random();
      if (noise > 0.5) {
        const t = (noise - 0.5) * 2;
        data[i] = Math.floor(data[i] * (1 - t) + lighter.r * 255 * t);
        data[i + 1] = Math.floor(data[i + 1] * (1 - t) + lighter.g * 255 * t);
        data[i + 2] = Math.floor(data[i + 2] * (1 - t) + lighter.b * 255 * t);
      } else {
        const t = noise * 2;
        data[i] = Math.floor(data[i] * (1 - t) + darker.r * 255 * t);
        data[i + 1] = Math.floor(data[i + 1] * (1 - t) + darker.g * 255 * t);
        data[i + 2] = Math.floor(data[i + 2] * (1 - t) + darker.b * 255 * t);
      }
    }
    ctx.putImageData(imageData, 0, 0);
  }

  private generateStripeTexture(ctx: CanvasRenderingContext2D, size: number, base: THREE.Color, darker: THREE.Color, lighter: THREE.Color): void {
    const stripeCount = 12 + Math.floor(Math.random() * 8);
    const stripeHeight = size / stripeCount;

    for (let i = 0; i < stripeCount; i++) {
      const y = i * stripeHeight;
      const variation = Math.random();
      const color = variation > 0.5 ? lighter : darker;
      const alpha = 0.15 + Math.random() * 0.25;

      ctx.fillStyle = `rgba(${Math.floor(color.r * 255)}, ${Math.floor(color.g * 255)}, ${Math.floor(color.b * 255)}, ${alpha})`;
      const h = stripeHeight * (0.6 + Math.random() * 0.4);
      ctx.fillRect(0, y, size, h);
    }

    const imageData = ctx.getImageData(0, 0, size, size);
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      if (Math.random() > 0.85) {
        const t = Math.random() * 0.3;
        data[i] = Math.floor(data[i] * (1 - t) + lighter.r * 255 * t);
        data[i + 1] = Math.floor(data[i + 1] * (1 - t) + lighter.g * 255 * t);
        data[i + 2] = Math.floor(data[i + 2] * (1 - t) + lighter.b * 255 * t);
      }
    }
    ctx.putImageData(imageData, 0, 0);
  }

  private generateMixedTexture(ctx: CanvasRenderingContext2D, size: number, base: THREE.Color, darker: THREE.Color, lighter: THREE.Color): void {
    this.generateStripeTexture(ctx, size, base, darker, lighter);

    const imageData = ctx.getImageData(0, 0, size, size);
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      const noise = Math.random() * 0.2;
      if (Math.random() > 0.5) {
        data[i] = Math.min(255, Math.floor(data[i] + noise * 255));
        data[i + 1] = Math.min(255, Math.floor(data[i + 1] + noise * 255));
        data[i + 2] = Math.min(255, Math.floor(data[i + 2] + noise * 255));
      } else {
        data[i] = Math.max(0, Math.floor(data[i] - noise * 255));
        data[i + 1] = Math.max(0, Math.floor(data[i + 1] - noise * 255));
        data[i + 2] = Math.max(0, Math.floor(data[i + 2] - noise * 255));
      }
    }
    ctx.putImageData(imageData, 0, 0);
  }

  public updateCutDepth(cutDepthPercent: number): void {
    const totalHeight = 12;
    const cutY = totalHeight / 2 - (cutDepthPercent / 100) * totalHeight;
    this.cutPlane.constant = cutY;

    this.stratumMeshes.forEach((sm) => {
      const material = sm.mesh.material as THREE.MeshStandardMaterial;
      if (cutDepthPercent > 0) {
        material.clippingPlanes = [this.cutPlane];
      } else {
        material.clippingPlanes = [];
      }
      material.needsUpdate = true;
    });

    this.updateCutVisualization(cutY, cutDepthPercent);
  }

  private updateCutVisualization(cutY: number, cutDepthPercent: number): void {
    if (this.cutPlaneMesh) {
      this.scene.remove(this.cutPlaneMesh);
      (this.cutPlaneMesh.geometry as THREE.BufferGeometry).dispose();
      const material = this.cutPlaneMesh.material as THREE.Material;
      material.dispose();
      this.cutPlaneMesh = null;
    }

    if (this.cutGridHelper) {
      this.scene.remove(this.cutGridHelper);
      const gridMaterial = this.cutGridHelper.material as THREE.Material;
      gridMaterial.dispose();
      this.cutGridHelper = null;
    }

    if (cutDepthPercent > 0) {
      const planeGeometry = new THREE.PlaneGeometry(BLOCK_WIDTH, BLOCK_DEPTH);
      const planeMaterial = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.06,
        side: THREE.DoubleSide,
        depthWrite: false
      });
      this.cutPlaneMesh = new THREE.Mesh(planeGeometry, planeMaterial);
      this.cutPlaneMesh.rotation.x = Math.PI / 2;
      this.cutPlaneMesh.position.y = cutY;
      this.scene.add(this.cutPlaneMesh);

      this.cutGridHelper = new THREE.GridHelper(BLOCK_WIDTH, 10, 0xffffff, 0xffffff);
      this.cutGridHelper.position.y = cutY;
      const gridMaterial = this.cutGridHelper.material as THREE.Material;
      gridMaterial.transparent = true;
      gridMaterial.opacity = 0.18;
      gridMaterial.depthWrite = false;
      this.scene.add(this.cutGridHelper);
    }
  }

  public updateStratumOpacity(stratumId: string, opacityPercent: number): void {
    const sm = this.stratumMeshes.get(stratumId);
    if (!sm) return;

    const material = sm.mesh.material as THREE.MeshStandardMaterial;
    const targetOpacity = opacityPercent / 100;

    new TWEEN.Tween({ opacity: material.opacity })
      .to({ opacity: targetOpacity }, 200)
      .easing(TWEEN.Easing.Quadratic.Out)
      .onUpdate((obj) => {
        material.opacity = obj.opacity;
        material.transparent = obj.opacity < 1;
      })
      .start();
  }

  public highlightStratum(stratumId: string | null): void {
    this.stratumMeshes.forEach((sm) => {
      const material = sm.mesh.material as THREE.MeshStandardMaterial;
      const baseColor = new THREE.Color(sm.mesh.userData.baseColor);

      if (sm.id === stratumId) {
        material.emissive = new THREE.Color(0x3B82F6);
        material.emissiveIntensity = 0.25;
      } else {
        material.emissive = new THREE.Color(0x000000);
        material.emissiveIntensity = 0;
      }
    });
  }

  public focusOnStratum(stratumId: string): void {
    const sm = this.stratumMeshes.get(stratumId);
    if (!sm) return;

    const stratum = this.strata.find(s => s.id === stratumId);
    if (!stratum) return;

    const targetPos = new THREE.Vector3(0, stratum.yPosition, 5);
    const targetLookAt = new THREE.Vector3(0, stratum.yPosition, 0);

    this.animateCamera(targetPos, targetLookAt, 500);
  }

  public resetCamera(): void {
    this.animateCamera(this.defaultCameraPosition.clone(), this.defaultTarget.clone(), 500);
  }

  private animateCamera(targetPosition: THREE.Vector3, targetLookAt: THREE.Vector3, duration: number): void {
    const startPosition = this.camera.position.clone();
    const startTarget = this.controls.target.clone();

    const rotationAngle = (15 * Math.PI) / 180;
    const offset = new THREE.Vector3(
      Math.sin(rotationAngle) * 5,
      0,
      Math.cos(rotationAngle) * 5
    );
    targetPosition.x = targetLookAt.x + offset.x;
    targetPosition.z = targetLookAt.z + offset.z;

    new TWEEN.Tween({
      px: startPosition.x, py: startPosition.y, pz: startPosition.z,
      tx: startTarget.x, ty: startTarget.y, tz: startTarget.z
    })
      .to({
        px: targetPosition.x, py: targetPosition.y, pz: targetPosition.z,
        tx: targetLookAt.x, ty: targetLookAt.y, tz: targetLookAt.z
      }, duration)
      .easing(TWEEN.Easing.Cubic.InOut)
      .onUpdate((obj) => {
        this.camera.position.set(obj.px, obj.py, obj.pz);
        this.controls.target.set(obj.tx, obj.ty, obj.tz);
        this.controls.update();
      })
      .start();
  }

  public start(): void {
    const animate = () => {
      this.animationId = requestAnimationFrame(animate);
      TWEEN.update();
      this.controls.update();
      this.renderer.render(this.scene, this.camera);
    };
    animate();
  }

  public dispose(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
    }
    window.removeEventListener('resize', this.onResize.bind(this));
    this.clearStrata();
    this.controls.dispose();
    this.renderer.dispose();
    if (this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }
  }
}
