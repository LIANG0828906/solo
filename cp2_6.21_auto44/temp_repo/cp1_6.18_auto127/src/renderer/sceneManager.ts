import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { speciesData, type BoneNode } from '@/data/speciesData';
import { defaultConfig } from '@/data/skeletonConfig';
import {
  createSkeleton,
  createPointCloudSkeleton,
  updateSkeletonParams,
  highlightJoint,
  type SkeletonObjects,
} from '@/engine/skeletonGenerator';
import type { PointCloudPoint } from '@/stores/appStore';

export class SceneManager {
  private container: HTMLElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private controls: OrbitControls;
  private skeleton: SkeletonObjects | null = null;
  private pointCloudGroup: THREE.Group | null = null;
  private gridHelper: THREE.GridHelper | null = null;
  private glowMesh: THREE.Mesh | null = null;
  private raycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;
  private hoveredJoint: THREE.Mesh | null = null;
  private animationId: number = 0;
  private onNodeClick: ((node: BoneNode | null) => void) | null = null;
  private targetCameraAngle: number = 0;
  private currentGlowRadius: number = 12;

  constructor(container: HTMLElement) {
    this.container = container;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(defaultConfig.backgroundColor);

    this.camera = new THREE.PerspectiveCamera(
      60,
      container.clientWidth / container.clientHeight,
      0.1,
      defaultConfig.cameraFar
    );
    this.camera.position.set(5, 3, 8);

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    container.appendChild(this.renderer.domElement);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.minDistance = 2;
    this.controls.maxDistance = 20;

    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    this.setupLights();
    this.setupGround();
    this.setupGlow();
    this.setupEventListeners();
    this.animate();

    window.addEventListener('resize', this.handleResize);
  }

  private setupLights(): void {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 10, 5);
    directionalLight.castShadow = true;
    this.scene.add(directionalLight);

    const pointLight1 = new THREE.PointLight(0x3b82f6, 0.3, 20);
    pointLight1.position.set(-5, 3, -5);
    this.scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0xf59e0b, 0.2, 20);
    pointLight2.position.set(5, 2, 5);
    this.scene.add(pointLight2);
  }

  private setupGround(): void {
    this.gridHelper = new THREE.GridHelper(20, 20, defaultConfig.gridColor, defaultConfig.gridColor);
    this.gridHelper.position.y = -2.5;
    (this.gridHelper.material as THREE.Material).transparent = true;
    (this.gridHelper.material as THREE.Material).opacity = 0.5;
    this.scene.add(this.gridHelper);
  }

  private setupGlow(): void {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    const gradient = ctx.createRadialGradient(256, 256, 0, 256, 256, 256);
    gradient.addColorStop(0, 'rgba(59, 130, 246, 0)');
    gradient.addColorStop(0.6, 'rgba(59, 130, 246, 0)');
    gradient.addColorStop(0.8, 'rgba(59, 130, 246, 0.05)');
    gradient.addColorStop(1, 'rgba(59, 130, 246, 0.15)');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 512, 512);

    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      side: THREE.BackSide,
      depthWrite: false,
    });

    const geometry = new THREE.SphereGeometry(this.currentGlowRadius, 32, 32);
    this.glowMesh = new THREE.Mesh(geometry, material);
    this.scene.add(this.glowMesh);
  }

  private setupEventListeners(): void {
    this.renderer.domElement.addEventListener('mousemove', this.handleMouseMove);
    this.renderer.domElement.addEventListener('click', this.handleClick);
  }

  private handleMouseMove = (event: MouseEvent): void => {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.updateHover();
  };

  private handleClick = (): void => {
    if (this.hoveredJoint && this.skeleton) {
      const nodeData = this.skeleton.jointDataMap.get(this.hoveredJoint);
      if (nodeData && this.onNodeClick) {
        this.onNodeClick(nodeData);
      }
    } else if (this.onNodeClick) {
      this.onNodeClick(null);
    }
  };

  private updateHover(): void {
    if (!this.skeleton) {
      this.renderer.domElement.style.cursor = 'default';
      return;
    }

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.skeleton.joints);

    if (intersects.length > 0) {
      const joint = intersects[0].object as THREE.Mesh;
      if (this.hoveredJoint !== joint) {
        if (this.hoveredJoint) {
          highlightJoint(this.hoveredJoint, false);
        }
        this.hoveredJoint = joint;
        highlightJoint(joint, true);
        this.renderer.domElement.style.cursor = 'pointer';
      }
    } else {
      if (this.hoveredJoint) {
        highlightJoint(this.hoveredJoint, false);
        this.hoveredJoint = null;
      }
      this.renderer.domElement.style.cursor = 'grab';
    }
  }

  private animate = (): void => {
    this.animationId = requestAnimationFrame(this.animate);
    this.controls.update();
    this.updateGlow();
    this.renderer.render(this.scene, this.camera);
  };

  private updateGlow(): void {
    if (!this.glowMesh) return;

    const cameraDir = new THREE.Vector3();
    this.camera.getWorldDirection(cameraDir);
    const angle = Math.atan2(cameraDir.x, cameraDir.z);
    this.targetCameraAngle = angle;

    const targetRadius = 12 + Math.sin(angle * 2) * 0.5;
    this.currentGlowRadius += (targetRadius - this.currentGlowRadius) * 0.02;

    this.glowMesh.scale.setScalar(this.currentGlowRadius / 12);
  }

  private handleResize = (): void => {
    this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
  };

  public loadSpecies(speciesId: string, density: number, thickness: number, showLabels: boolean): void {
    this.clearSkeleton();

    const species = speciesData.find((s) => s.id === speciesId);
    if (!species) return;

    this.skeleton = createSkeleton(species, density, thickness, showLabels);
    this.scene.add(this.skeleton.group);

    const vertexCount = this.calculateVertexCount();
    console.log(`顶点数: ${vertexCount} / 上限: ${defaultConfig.maxVertices}`);
  }

  public loadPointCloud(points: PointCloudPoint[], density: number, thickness: number): void {
    this.clearSkeleton();

    const result = createPointCloudSkeleton(points, density, thickness);
    this.pointCloudGroup = result.group;
    this.scene.add(result.group);

    const vertexCount = points.length;
    console.log(`点云点数: ${vertexCount} / 上限: ${defaultConfig.maxVertices}`);
  }

  public updateParams(density: number, thickness: number, showLabels: boolean): void {
    if (this.skeleton) {
      updateSkeletonParams(this.skeleton, thickness, showLabels);
    }
    if (this.pointCloudGroup) {
      this.pointCloudGroup.traverse((obj) => {
        if (obj instanceof THREE.Points) {
          (obj.material as THREE.PointsMaterial).size = 0.08 * thickness;
        }
      });
    }
  }

  private clearSkeleton(): void {
    if (this.skeleton) {
      this.scene.remove(this.skeleton.group);
      this.skeleton.group.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry.dispose();
          if (Array.isArray(obj.material)) {
            obj.material.forEach((m) => m.dispose());
          } else {
            obj.material.dispose();
          }
        }
      });
      this.skeleton = null;
    }
    if (this.pointCloudGroup) {
      this.scene.remove(this.pointCloudGroup);
      this.pointCloudGroup.traverse((obj) => {
        if (obj instanceof THREE.Points) {
          obj.geometry.dispose();
          (obj.material as THREE.Material).dispose();
        }
      });
      this.pointCloudGroup = null;
    }
    this.hoveredJoint = null;
  }

  private calculateVertexCount(): number {
    let count = 0;
    if (this.skeleton) {
      this.skeleton.group.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          const position = obj.geometry.getAttribute('position');
          count += position ? position.count : 0;
        }
      });
    }
    return count;
  }

  public setOnNodeClick(callback: (node: BoneNode | null) => void): void {
    this.onNodeClick = callback;
  }

  public dispose(): void {
    cancelAnimationFrame(this.animationId);
    window.removeEventListener('resize', this.handleResize);
    this.renderer.domElement.removeEventListener('mousemove', this.handleMouseMove);
    this.renderer.domElement.removeEventListener('click', this.handleClick);
    this.clearSkeleton();
    this.renderer.dispose();
    this.controls.dispose();
    if (this.container.contains(this.renderer.domElement)) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}
