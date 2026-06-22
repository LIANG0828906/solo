import * as THREE from 'three';
import { SceneManager } from '@/editor/sceneManager';
import { UIController } from '@/editor/uiController';

const EXPORT_WIDTH = 2560;
const EXPORT_HEIGHT = 1440;

export class ExportManager {
  private sceneManager: SceneManager;
  private uiController: UIController;
  private isExporting: boolean = false;

  private savedCameraPos: THREE.Vector3 = new THREE.Vector3();
  private savedCameraTarget: THREE.Vector3 = new THREE.Vector3();

  constructor(sceneManager: SceneManager, uiController: UIController) {
    this.sceneManager = sceneManager;
    this.uiController = uiController;
    this.uiController.setExportCallback(() => this.startExport());
  }

  async startExport(): Promise<void> {
    if (this.isExporting) return;
    this.isExporting = true;
    this.uiController.hideSuccess();

    try {
      for (let i = 3; i >= 1; i--) {
        this.uiController.showCountdown(i);
        await this.sleep(1000);
      }
      this.uiController.hideCountdown();

      const orbit = this.sceneManager.getOrbitControls();
      this.savedCameraPos.copy(this.sceneManager.getCamera().position);
      this.savedCameraTarget.copy(orbit.target);
      orbit.enabled = false;

      await this.animateToExportView();
      await this.rotateShowcase();

      const dataUrl = await this.renderSilhouette();
      this.uiController.showSuccess(dataUrl);

      await this.restoreCamera();
      orbit.enabled = true;
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      this.isExporting = false;
    }
  }

  private async animateToExportView(): Promise<void> {
    const camera = this.sceneManager.getCamera();
    const orbit = this.sceneManager.getOrbitControls();

    const startPos = camera.position.clone();
    const startTarget = orbit.target.clone();

    const buildings = this.sceneManager.getAllBuildingParams();
    let maxDist = 100;
    if (buildings.length > 0) {
      const maxH = Math.max(...buildings.map((b) => b.size.h));
      const maxX = Math.max(...buildings.map((b) => Math.abs(b.position.x)));
      const maxZ = Math.max(...buildings.map((b) => Math.abs(b.position.z)));
      maxDist = Math.max(maxH, maxX, maxZ) * 1.8;
    }

    const endPos = new THREE.Vector3(0, maxDist * 0.8, maxDist * 0.8);
    const endTarget = new THREE.Vector3(0, 0, 0);

    const duration = 1500;
    const startTime = performance.now();

    return new Promise((resolve) => {
      const animate = () => {
        const elapsed = performance.now() - startTime;
        const t = Math.min(elapsed / duration, 1);
        const eased = this.easeInOutCubic(t);

        camera.position.lerpVectors(startPos, endPos, eased);
        orbit.target.lerpVectors(startTarget, endTarget, eased);
        camera.lookAt(orbit.target);

        if (t < 1) {
          requestAnimationFrame(animate);
        } else {
          resolve();
        }
      };
      animate();
    });
  }

  private async rotateShowcase(): Promise<void> {
    const camera = this.sceneManager.getCamera();
    const orbit = this.sceneManager.getOrbitControls();

    const center = orbit.target.clone();
    const radius = camera.position.distanceTo(center);
    const startAngle = Math.atan2(camera.position.z - center.z, camera.position.x - center.x);
    const height = camera.position.y;

    const duration = 3000;
    const startTime = performance.now();

    return new Promise((resolve) => {
      const animate = () => {
        const elapsed = performance.now() - startTime;
        const t = Math.min(elapsed / duration, 1);
        const eased = this.easeInOutCubic(t);

        const angle = startAngle + eased * Math.PI * 2;
        camera.position.x = center.x + Math.cos(angle) * radius;
        camera.position.z = center.z + Math.sin(angle) * radius;
        camera.position.y = height;
        camera.lookAt(center);

        if (t < 1) {
          requestAnimationFrame(animate);
        } else {
          resolve();
        }
      };
      animate();
    });
  }

  private async renderSilhouette(): Promise<string> {
    const scene = this.sceneManager.getScene();
    const camera = this.sceneManager.getCamera();
    const renderer = this.sceneManager.getRenderer();

    const offscreenCanvas = document.createElement('canvas');
    offscreenCanvas.width = EXPORT_WIDTH;
    offscreenCanvas.height = EXPORT_HEIGHT;
    const ctx = offscreenCanvas.getContext('2d')!;

    const originalSize = renderer.getSize(new THREE.Vector2());
    const originalPixelRatio = renderer.getPixelRatio();

    renderer.setPixelRatio(1);
    renderer.setSize(EXPORT_WIDTH, EXPORT_HEIGHT, false);

    const originalMaterials: Map<THREE.Object3D, THREE.Material | THREE.Material[]> = new Map();
    const originalVisibility: Map<THREE.Object3D, boolean> = new Map();
    const silhouetteColor = new THREE.Color(0x1a1a2e);
    const silhouetteMat = new THREE.MeshBasicMaterial({ color: silhouetteColor });

    scene.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        originalVisibility.set(obj, obj.visible);
        if (obj.geometry instanceof THREE.PlaneGeometry && obj.rotation.x !== 0) {
          originalMaterials.set(obj, obj.material);
          obj.material = new THREE.MeshBasicMaterial({ color: 0x0a0a1a });
        } else if (obj.userData.buildingId || obj.parent?.userData.buildingId) {
          originalMaterials.set(obj, obj.material);
          obj.material = silhouetteMat;
        } else if (obj instanceof THREE.Mesh && !(obj.geometry instanceof THREE.SphereGeometry)) {
          originalMaterials.set(obj, obj.material);
          obj.material = new THREE.MeshBasicMaterial({ color: 0x0a0a1a });
        }
      }
      if (obj instanceof THREE.GridHelper) {
        originalVisibility.set(obj, obj.visible);
        obj.visible = false;
      }
    });

    renderer.render(scene, camera);

    const renderCanvas = renderer.domElement;
    ctx.drawImage(renderCanvas, 0, 0, EXPORT_WIDTH, EXPORT_HEIGHT);

    originalMaterials.forEach((mat, obj) => {
      (obj as THREE.Mesh).material = mat;
    });
    originalVisibility.forEach((vis, obj) => {
      obj.visible = vis;
    });
    silhouetteMat.dispose();

    this.addBottomShadow(ctx, EXPORT_WIDTH, EXPORT_HEIGHT);

    renderer.setPixelRatio(originalPixelRatio);
    renderer.setSize(originalSize.x, originalSize.y, false);

    return offscreenCanvas.toDataURL('image/png');
  }

  private addBottomShadow(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    const gradient = ctx.createLinearGradient(0, height * 0.7, 0, height);
    gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
    gradient.addColorStop(0.5, 'rgba(0, 0, 0, 0.4)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0.7)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, height * 0.7, width, height * 0.3);
  }

  private async restoreCamera(): Promise<void> {
    const camera = this.sceneManager.getCamera();
    const orbit = this.sceneManager.getOrbitControls();

    const startPos = camera.position.clone();
    const startTarget = orbit.target.clone();

    const duration = 800;
    const startTime = performance.now();

    return new Promise((resolve) => {
      const animate = () => {
        const elapsed = performance.now() - startTime;
        const t = Math.min(elapsed / duration, 1);
        const eased = this.easeInOutCubic(t);

        camera.position.lerpVectors(startPos, this.savedCameraPos, eased);
        orbit.target.lerpVectors(startTarget, this.savedCameraTarget, eased);
        camera.lookAt(orbit.target);

        if (t < 1) {
          requestAnimationFrame(animate);
        } else {
          resolve();
        }
      };
      animate();
    });
  }

  private easeInOutCubic(t: number): number {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
