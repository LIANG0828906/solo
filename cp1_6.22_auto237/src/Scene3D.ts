import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import type { BarInstanceData, VisualConfig, City, CameraPreset } from './types';
import { easeOutCubic, createAnimation, updateAnimation, type AnimationState } from './utils/animation';
import { hexToRgb, lerpThreeColor } from './utils/color';

interface Scene3DCallbacks {
  onCityClick: (cityId: string) => void;
  onFpsUpdate: (fps: number) => void;
}

const CAMERA_PRESETS: Record<CameraPreset, { x: number; y: number; z: number }> = {
  front: { x: 0, y: 10, z: 30 },
  top45: { x: 0, y: 25, z: 25 },
  side: { x: 30, y: 10, z: 0 },
  birdseye: { x: 0, y: 40, z: 0.1 },
};

const BAR_WIDTH = 0.4;
const BAR_DEPTH = 0.4;
const ANIMATION_DURATION = 500;
const AUTO_ROTATE_SPEED = 0.01;
const PLAY_MONTH_INTERVAL = 200;

export class Scene3D {
  private container: HTMLElement;
  private callbacks: Scene3DCallbacks;

  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private labelRenderer!: CSS2DRenderer;
  private controls!: OrbitControls;
  private clock!: THREE.Clock;

  private instancedMesh!: THREE.InstancedMesh;
  private dummy!: THREE.Object3D;
  private instanceColors!: Float32Array;

  private barsData: BarInstanceData[] = [];
  private cities: City[] = [];
  private config!: VisualConfig;

  private heightAnimations: Map<number, AnimationState> = new Map();
  private colorAnimations: Map<number, AnimationState> = new Map();

  private cameraAnimation: {
    active: boolean;
    start: THREE.Vector3;
    end: THREE.Vector3;
    elapsed: number;
    duration: number;
  } | null = null;

  private categoryTransitionProgress = 0;

  private raycaster!: THREE.Raycaster;
  private mouse!: THREE.Vector2;

  private cityLabels: Map<string, CSS2DObject> = new Map();

  private frameCount = 0;
  private lastFpsTime = 0;

  private animationFrameId: number | null = null;
  private lastPlayMonthTime = 0;

  private disposed = false;

  constructor(container: HTMLElement, callbacks: Scene3DCallbacks) {
    this.container = container;
    this.callbacks = callbacks;
  }

  init(): void {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0f172a);

    this.camera = new THREE.PerspectiveCamera(
      60,
      this.container.clientWidth / this.container.clientHeight,
      0.1,
      1000
    );
    this.camera.position.set(0, 15, 25);

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.container.appendChild(this.renderer.domElement);

    this.labelRenderer = new CSS2DRenderer();
    this.labelRenderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.labelRenderer.domElement.style.position = 'absolute';
    this.labelRenderer.domElement.style.top = '0';
    this.labelRenderer.domElement.style.pointerEvents = 'none';
    this.container.appendChild(this.labelRenderer.domElement);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.minDistance = 10;
    this.controls.maxDistance = 50;
    this.controls.mouseButtons = {
      LEFT: THREE.MOUSE.ROTATE,
      MIDDLE: THREE.MOUSE.DOLLY,
      RIGHT: THREE.MOUSE.PAN,
    };

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(-1, 1, 1);
    this.scene.add(directionalLight);

    const gridHelper = new THREE.GridHelper(100, 50, 0x334155, 0x334155);
    (gridHelper.material as THREE.Material).opacity = 0.2;
    (gridHelper.material as THREE.Material).transparent = true;
    this.scene.add(gridHelper);

    const geometry = new THREE.BoxGeometry(BAR_WIDTH, 1, BAR_DEPTH);
    const material = new THREE.MeshStandardMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 1,
    });

    this.instancedMesh = new THREE.InstancedMesh(geometry, material, 120);
    this.instancedMesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(120 * 3), 3);
    this.instanceColors = this.instancedMesh.instanceColor.array as Float32Array;
    this.scene.add(this.instancedMesh);

    this.dummy = new THREE.Object3D();

    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    this.clock = new THREE.Clock();

    this.renderer.domElement.addEventListener('click', this.onClick);
    window.addEventListener('resize', this.onResize);

    this.animate();
  }

  updateData(data: BarInstanceData[], config: VisualConfig, cities: City[]): void {
    this.barsData = data;
    this.config = config;
    this.cities = cities;

    for (let i = 0; i < data.length; i++) {
      const bar = data[i];
      const startHeight = this.barsData[i].currentHeight || 0.01;
      const endHeight = bar.targetHeight;

      this.heightAnimations.set(i, createAnimation(startHeight, endHeight, ANIMATION_DURATION));
      this.colorAnimations.set(i, createAnimation(0, 1, ANIMATION_DURATION));
    }

    this.updateCityLabels();
    this.updateInstanceTransforms();
  }

  updateCategoryTransition(progress: number): void {
    this.categoryTransitionProgress = progress;
  }

  setCameraPreset(preset: CameraPreset): void {
    const target = CAMERA_PRESETS[preset];
    this.cameraAnimation = {
      active: true,
      start: this.camera.position.clone(),
      end: new THREE.Vector3(target.x, target.y, target.z),
      elapsed: 0,
      duration: 1000,
    };
  }

  dispose(): void {
    this.disposed = true;

    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }

    this.renderer.domElement.removeEventListener('click', this.onClick);
    window.removeEventListener('resize', this.onResize);

    this.instancedMesh.geometry.dispose();
    (this.instancedMesh.material as THREE.Material).dispose();

    this.renderer.dispose();
    this.labelRenderer.domElement.remove();

    this.container.removeChild(this.renderer.domElement);
  }

  private updateCityLabels(): void {
    this.cityLabels.forEach((label) => {
      this.scene.remove(label);
      label.element.remove();
    });
    this.cityLabels.clear();

    this.cities.forEach((city) => {
      const div = document.createElement('div');
      div.style.color = '#ffffff';
      div.style.fontSize = '12px';
      div.style.fontFamily = 'sans-serif';
      div.style.textShadow = '0 0 4px rgba(0,0,0,0.8)';
      div.style.pointerEvents = 'none';
      div.textContent = city.name;

      const label = new CSS2DObject(div);
      label.position.set(city.position.x, 2, city.position.z);
      this.scene.add(label);
      this.cityLabels.set(city.id, label);
    });
  }

  private updateInstanceTransforms(): void {
    const { selectedCityId, isPlaying, animationMonth } = this.config;

    for (let i = 0; i < this.barsData.length; i++) {
      const bar = this.barsData[i];
      const heightAnim = this.heightAnimations.get(i);
      const colorAnim = this.colorAnimations.get(i);

      let height = bar.currentHeight;
      if (heightAnim && heightAnim.active) {
        height = heightAnim.current;
      }

      let scaleY = height;
      let scaleX = BAR_WIDTH;
      let scaleZ = BAR_DEPTH;
      let opacity = 1;

      if (selectedCityId) {
        if (bar.cityId === selectedCityId) {
          scaleX = BAR_WIDTH * 1.2;
          scaleZ = BAR_DEPTH * 1.2;
        } else {
          opacity = 0.3;
        }
      }

      if (isPlaying && bar.month > animationMonth) {
        scaleY = 0.01;
        opacity = 0.1;
      }

      this.dummy.position.set(bar.x, scaleY / 2, bar.z);
      this.dummy.scale.set(scaleX, scaleY, scaleZ);
      this.dummy.updateMatrix();
      this.instancedMesh.setMatrixAt(i, this.dummy.matrix);

      let color = bar.color;
      if (colorAnim && colorAnim.active) {
        const t = colorAnim.current;
        const startColor = hexToRgb(bar.color);
        const endColor = hexToRgb(bar.targetColor);
        const lerpedColor = lerpThreeColor(
          new THREE.Color(startColor.r, startColor.g, startColor.b),
          new THREE.Color(endColor.r, endColor.g, endColor.b),
          t
        );
        color = `#${lerpedColor.getHexString()}`;
      }

      const rgb = hexToRgb(color);
      this.instanceColors[i * 3] = rgb.r;
      this.instanceColors[i * 3 + 1] = rgb.g;
      this.instanceColors[i * 3 + 2] = rgb.b;

      const material = this.instancedMesh.material as THREE.MeshStandardMaterial;
      material.opacity = opacity;
    }

    this.instancedMesh.instanceMatrix.needsUpdate = true;
    this.instancedMesh.instanceColor!.needsUpdate = true;
  }

  private onClick = (event: MouseEvent): void => {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);

    const intersects = this.raycaster.intersectObject(this.instancedMesh);
    if (intersects.length > 0) {
      const instanceId = intersects[0].instanceId;
      if (instanceId !== undefined && instanceId < this.barsData.length) {
        const bar = this.barsData[instanceId];
        this.callbacks.onCityClick(bar.cityId);
      }
    }
  };

  private onResize = (): void => {
    if (this.disposed) return;
    this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.labelRenderer.setSize(this.container.clientWidth, this.container.clientHeight);
  };

  private animate = (): void => {
    if (this.disposed) return;

    this.animationFrameId = requestAnimationFrame(this.animate);

    const deltaTime = this.clock.getDelta() * 1000;
    const elapsedTime = this.clock.getElapsedTime();

    this.heightAnimations.forEach((anim, index) => {
      if (anim.active) {
        this.heightAnimations.set(index, updateAnimation(anim, deltaTime));
        this.barsData[index].currentHeight = this.heightAnimations.get(index)!.current;
      }
    });

    this.colorAnimations.forEach((anim, index) => {
      if (anim.active) {
        this.colorAnimations.set(index, updateAnimation(anim, deltaTime));
      }
    });

    if (this.cameraAnimation && this.cameraAnimation.active) {
      this.cameraAnimation.elapsed += deltaTime;
      const t = Math.min(this.cameraAnimation.elapsed / this.cameraAnimation.duration, 1);
      const easedT = easeOutCubic(t);
      this.camera.position.lerpVectors(
        this.cameraAnimation.start,
        this.cameraAnimation.end,
        easedT
      );
      if (t >= 1) {
        this.cameraAnimation.active = false;
      }
      this.controls.target.set(0, 0, 0);
    }

    if (this.config?.autoRotate) {
      const angle = AUTO_ROTATE_SPEED * (deltaTime / 1000);
      const radius = Math.sqrt(
        this.camera.position.x ** 2 + this.camera.position.z ** 2
      );
      const currentAngle = Math.atan2(this.camera.position.z, this.camera.position.x);
      const newAngle = currentAngle + angle;
      this.camera.position.x = Math.cos(newAngle) * radius;
      this.camera.position.z = Math.sin(newAngle) * radius;
      this.camera.lookAt(0, 0, 0);
    }

    if (this.config?.isPlaying) {
      if (elapsedTime * 1000 - this.lastPlayMonthTime >= PLAY_MONTH_INTERVAL) {
        this.lastPlayMonthTime = elapsedTime * 1000;
      }
    }

    this.controls.update();
    this.updateInstanceTransforms();

    this.renderer.render(this.scene, this.camera);
    this.labelRenderer.render(this.scene, this.camera);

    this.frameCount++;
    if (this.frameCount % 30 === 0) {
      const now = performance.now();
      const fps = (30 * 1000) / (now - this.lastFpsTime);
      this.callbacks.onFpsUpdate(Math.round(fps));
      this.lastFpsTime = now;
    }
  };
}
