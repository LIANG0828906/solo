import * as THREE from 'three';
import type { StarData, SpectralType } from '@/types/star';
import {
  createStarMesh,
  updateStarShaders,
  setStarHighlight,
  setStarOpacity,
  selectStar as renderSelectStar,
  deselectStar as renderDeselectStar,
  updateAtmosphericScattering,
  type RenderedStar,
} from './StarRenderer';

export interface StarSceneCallbacks {
  onStarClick: (starId: string) => void;
  onBackgroundClick: () => void;
}

export class StarScene {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private container: HTMLElement;
  private callbacks: StarSceneCallbacks;

  private starsGroup: THREE.Group;
  private backgroundStars: THREE.Points;
  private gridHelper: THREE.GridHelper;
  private lightsGroup: THREE.Group;

  private renderedStars: Map<string, RenderedStar> = new Map();
  private starData: Map<string, StarData> = new Map();

  private raycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;

  private isDragging: boolean = false;
  private previousMousePosition: { x: number; y: number } = { x: 0, y: 0 };
  private rotationVelocity: { x: number; y: number } = { x: 0, y: 0 };
  private cameraTarget: THREE.Vector3;
  private cameraDistance: number = 30;
  private cameraTheta: number = 0;
  private cameraPhi: number = Math.PI / 3;
  private minDistance: number = 5;
  private maxDistance: number = 50;
  private rotationSpeed: number = 0.5;

  private animationId: number | null = null;
  private clock: THREE.Clock;
  private lastFrameTime: number = 0;

  private selectedStarId: string | null = null;
  private selectedStarTargetPosition: THREE.Vector3 | null = null;
  private selectedOriginalPosition: THREE.Vector3 | null = null;

  private filterSpectralTypes: SpectralType[] = [];

  constructor(container: HTMLElement, callbacks: StarSceneCallbacks) {
    this.container = container;
    this.callbacks = callbacks;
    this.clock = new THREE.Clock();
    this.cameraTarget = new THREE.Vector3(0, 0, 0);

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color('#0B0E27');
    this.scene.fog = new THREE.FogExp2('#0B0E27', 0.015);

    this.camera = new THREE.PerspectiveCamera(
      60,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    this.updateCameraPosition();

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;
    container.appendChild(this.renderer.domElement);

    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    this.starsGroup = new THREE.Group();
    this.starsGroup.name = 'starsGroup';
    this.scene.add(this.starsGroup);

    this.lightsGroup = new THREE.Group();
    this.setupLights();
    this.scene.add(this.lightsGroup);

    this.gridHelper = this.createGrid();
    this.scene.add(this.gridHelper);

    this.backgroundStars = this.createBackgroundStars();
    this.scene.add(this.backgroundStars);

    this.setupEventListeners();
    this.startAnimation();
  }

  private setupLights(): void {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    this.lightsGroup.add(ambientLight);

    const pointLight1 = new THREE.PointLight(0x9bb0ff, 1.5, 200);
    pointLight1.position.set(50, 30, 50);
    this.lightsGroup.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0xff8c42, 1.0, 200);
    pointLight2.position.set(-50, -20, -30);
    this.lightsGroup.add(pointLight2);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(0, 50, 50);
    this.lightsGroup.add(directionalLight);
  }

  private createGrid(): THREE.GridHelper {
    const grid = new THREE.GridHelper(100, 50, 0x2d3748, 0x2d3748);
    grid.material.transparent = true;
    (grid.material as THREE.Material).opacity = 0.2;
    grid.position.y = -15;
    return grid;
  }

  private createBackgroundStars(): THREE.Points {
    const count = 200;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const phases = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const radius = 80 + Math.random() * 120;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = radius * Math.cos(phi);
      sizes[i] = 1 + Math.random() * 2;
      phases[i] = Math.random() * Math.PI * 2;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    geometry.setAttribute('phase', new THREE.BufferAttribute(phases, 1));

    const material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
      },
      vertexShader: `
        attribute float size;
        attribute float phase;
        uniform float uTime;
        varying float vAlpha;
        
        void main() {
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          float twinkle = sin(uTime * (2.0 + phase) + phase) * 0.5 + 0.5;
          vAlpha = 0.5 + twinkle * 0.5;
          gl_PointSize = size * (300.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying float vAlpha;
        
        void main() {
          float dist = length(gl_PointCoord - vec2(0.5));
          if (dist > 0.5) discard;
          float glow = 1.0 - dist * 2.0;
          gl_FragColor = vec4(1.0, 1.0, 1.0, vAlpha * glow);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    const points = new THREE.Points(geometry, material);
    points.name = 'backgroundStars';
    return points;
  }

  private updateCameraPosition(): void {
    const x =
      this.cameraTarget.x +
      this.cameraDistance * Math.sin(this.cameraPhi) * Math.cos(this.cameraTheta);
    const y = this.cameraTarget.y + this.cameraDistance * Math.cos(this.cameraPhi);
    const z =
      this.cameraTarget.z +
      this.cameraDistance * Math.sin(this.cameraPhi) * Math.sin(this.cameraTheta);
    this.camera.position.set(x, y, z);
    this.camera.lookAt(this.cameraTarget);
  }

  private setupEventListeners(): void {
    const canvas = this.renderer.domElement;

    canvas.addEventListener('mousedown', this.onMouseDown);
    canvas.addEventListener('mousemove', this.onMouseMove);
    canvas.addEventListener('mouseup', this.onMouseUp);
    canvas.addEventListener('mouseleave', this.onMouseUp);
    canvas.addEventListener('wheel', this.onWheel, { passive: false });
    canvas.addEventListener('click', this.onClick);

    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('resize', this.onResize);
  }

  private onMouseDown = (e: MouseEvent): void => {
    this.isDragging = true;
    this.previousMousePosition = { x: e.clientX, y: e.clientY };
    this.rotationVelocity = { x: 0, y: 0 };
  };

  private onMouseMove = (e: MouseEvent): void => {
    if (!this.isDragging) return;

    const deltaX = e.clientX - this.previousMousePosition.x;
    const deltaY = e.clientY - this.previousMousePosition.y;

    const dt = Math.max(0.001, (performance.now() - this.lastFrameTime) / 1000);

    this.cameraTheta -= deltaX * 0.005;
    this.cameraPhi = Math.max(
      0.1,
      Math.min(Math.PI - 0.1, this.cameraPhi - deltaY * 0.005)
    );

    this.rotationVelocity = {
      x: (deltaY * 0.005) / dt,
      y: (deltaX * 0.005) / dt,
    };

    this.updateCameraPosition();
    this.previousMousePosition = { x: e.clientX, y: e.clientY };
    this.lastFrameTime = performance.now();
  };

  private onMouseUp = (): void => {
    this.isDragging = false;
  };

  private onWheel = (e: WheelEvent): void => {
    e.preventDefault();
    const zoomFactor = Math.exp(e.deltaY * 0.001);
    this.cameraDistance = Math.max(
      this.minDistance,
      Math.min(this.maxDistance, this.cameraDistance * zoomFactor)
    );
    this.updateCameraPosition();
  };

  private onClick = (e: MouseEvent): void => {
    if (Math.abs(this.rotationVelocity.x) > 0.01 || Math.abs(this.rotationVelocity.y) > 0.01) {
      return;
    }

    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);

    const meshes: THREE.Object3D[] = [];
    this.renderedStars.forEach((star) => {
      meshes.push(star.coreMesh);
    });

    const intersects = this.raycaster.intersectObjects(meshes, false);

    if (intersects.length > 0) {
      const starId = (intersects[0].object.userData.starId) as string;
      if (starId) {
        this.callbacks.onStarClick(starId);
      }
    } else {
      this.callbacks.onBackgroundClick();
    }
  };

  private onKeyDown = (e: KeyboardEvent): void => {
    if (e.key === 'Escape') {
      this.callbacks.onBackgroundClick();
    }
  };

  private onResize = (): void => {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  };

  private startAnimation(): void {
    const animate = (): void => {
      this.animationId = requestAnimationFrame(animate);
      this.update();
      this.renderer.render(this.scene, this.camera);
    };
    animate();
  }

  private update(): void {
    const elapsed = this.clock.getElapsedTime();
    const delta = this.clock.getDelta();

    if (this.backgroundStars.material instanceof THREE.ShaderMaterial) {
      this.backgroundStars.material.uniforms.uTime.value = elapsed;
    }

    const renderedStarsList = Array.from(this.renderedStars.values());
    updateStarShaders(renderedStarsList, elapsed, this.camera.position);

    const cameraDirection = new THREE.Vector3();
    this.camera.getWorldDirection(cameraDirection);
    updateAtmosphericScattering(renderedStarsList, cameraDirection);

    this.renderedStars.forEach((star) => {
      star.coreMesh.rotation.y += delta * 0.1;
      if (star.selectionRing) {
        star.selectionRing.rotation.z += delta * 2;
        star.selectionRing.lookAt(this.camera.position);
      }
    });

    if (this.selectedStarId && this.selectedStarTargetPosition && this.selectedOriginalPosition) {
      const renderedStar = this.renderedStars.get(this.selectedStarId);
      if (renderedStar) {
        const target = renderedStar.group.userData.isSelected
          ? this.selectedStarTargetPosition
          : this.selectedOriginalPosition;
        renderedStar.group.position.lerp(target, delta * 3);
      }
    }

    if (!this.isDragging) {
      const damping = 0.95;
      if (Math.abs(this.rotationVelocity.y) > 0.001) {
        this.cameraTheta -= this.rotationVelocity.y * delta * this.rotationSpeed;
        this.rotationVelocity.y *= damping;
      }
      if (Math.abs(this.rotationVelocity.x) > 0.001) {
        this.cameraPhi = Math.max(
          0.1,
          Math.min(Math.PI - 0.1, this.cameraPhi - this.rotationVelocity.x * delta * this.rotationSpeed)
        );
        this.rotationVelocity.x *= damping;
      }
      this.updateCameraPosition();
    }
  }

  public setStars(stars: StarData[]): void {
    this.renderedStars.forEach((star) => {
      this.starsGroup.remove(star.group);
    });
    this.renderedStars.clear();
    this.starData.clear();

    stars.forEach((starData) => {
      this.starData.set(starData.id, starData);
      const renderedStar = createStarMesh(starData);
      this.renderedStars.set(starData.id, renderedStar);
      this.starsGroup.add(renderedStar.group);
    });

    this.applyFilters();
  }

  public selectStar(starId: string | null): void {
    if (this.selectedStarId === starId) return;

    if (this.selectedStarId) {
      const prevStar = this.renderedStars.get(this.selectedStarId);
      if (prevStar) {
        renderDeselectStar(prevStar);
      }
    }

    this.selectedStarId = starId;

    if (starId) {
      const renderedStar = this.renderedStars.get(starId);
      if (renderedStar) {
        renderSelectStar(renderedStar, Array.from(this.renderedStars.values()));
        this.selectedOriginalPosition = renderedStar.group.userData.originalPosition.clone();
        this.selectedStarTargetPosition = this.cameraTarget.clone();

        const direction = new THREE.Vector3();
        this.camera.getWorldDirection(direction);
        this.selectedStarTargetPosition.add(direction.multiplyScalar(2));
      }
    } else {
      this.selectedStarTargetPosition = null;
      this.selectedOriginalPosition = null;
    }
  }

  public setSpectralFilter(types: SpectralType[]): void {
    this.filterSpectralTypes = types;
    this.applyFilters();
  }

  private applyFilters(): void {
    const hasFilter = this.filterSpectralTypes.length > 0;

    this.renderedStars.forEach((star, starId) => {
      const starData = this.starData.get(starId);
      if (!starData) return;

      const isVisible = !hasFilter || this.filterSpectralTypes.includes(starData.spectralType);

      if (hasFilter) {
        if (isVisible) {
          setStarHighlight(star, true);
          setStarOpacity(star, 1);
        } else {
          setStarHighlight(star, false);
          setStarOpacity(star, 0.15);
        }
      } else {
        setStarHighlight(star, false);
        setStarOpacity(star, 1);
      }
    });
  }

  public rotate(deltaTheta: number, deltaPhi: number): void {
    this.cameraTheta += deltaTheta;
    this.cameraPhi = Math.max(0.1, Math.min(Math.PI - 0.1, this.cameraPhi + deltaPhi));
    this.updateCameraPosition();
  }

  public zoom(factor: number): void {
    this.cameraDistance = Math.max(
      this.minDistance,
      Math.min(this.maxDistance, this.cameraDistance * factor)
    );
    this.updateCameraPosition();
  }

  public getCameraInfo(): {
    distance: number;
    theta: number;
    phi: number;
    target: THREE.Vector3;
  } {
    return {
      distance: this.cameraDistance,
      theta: this.cameraTheta,
      phi: this.cameraPhi,
      target: this.cameraTarget.clone(),
    };
  }

  public dispose(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }

    const canvas = this.renderer.domElement;
    canvas.removeEventListener('mousedown', this.onMouseDown);
    canvas.removeEventListener('mousemove', this.onMouseMove);
    canvas.removeEventListener('mouseup', this.onMouseUp);
    canvas.removeEventListener('mouseleave', this.onMouseUp);
    canvas.removeEventListener('wheel', this.onWheel);
    canvas.removeEventListener('click', this.onClick);
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('resize', this.onResize);

    this.renderedStars.forEach((star) => {
      star.group.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose();
          if (child.material instanceof THREE.Material) {
            if (child.material instanceof THREE.ShaderMaterial) {
              Object.values(child.material.uniforms).forEach((uniform) => {
                if (uniform.value instanceof THREE.Texture) {
                  uniform.value.dispose();
                }
              });
            }
            child.material.dispose();
          }
        }
      });
    });

    if (this.backgroundStars.geometry) {
      this.backgroundStars.geometry.dispose();
    }
    if (this.backgroundStars.material instanceof THREE.Material) {
      this.backgroundStars.material.dispose();
    }

    this.gridHelper.geometry.dispose();
    (this.gridHelper.material as THREE.Material).dispose();

    this.renderer.dispose();
    if (canvas.parentNode) {
      canvas.parentNode.removeChild(canvas);
    }
  }
}

export default StarScene;
