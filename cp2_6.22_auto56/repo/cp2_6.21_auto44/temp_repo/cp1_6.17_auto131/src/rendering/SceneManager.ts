import {
  Scene,
  PerspectiveCamera,
  WebGLRenderer,
  AmbientLight,
  PointLight,
  InstancedMesh,
  Vector3,
  Color,
  Raycaster,
  Vector2,
  Clock,
  Mesh,
  SphereGeometry,
  MeshBasicMaterial,
  MeshStandardMaterial,
  Matrix4,
  CanvasTexture,
} from 'three';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error: OrbitControls is not exported from three main module
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import {
  createStarMesh,
  createInstancedStarsMaterial,
  disposeMesh,
} from './StarMeshFactory';
import { EvolutionPath } from './EvolutionPath';
import type { Star, SpectralType } from '../types/star';
import { SPECTRAL_COLORS, SCALE_FACTOR } from '../types/star';
import { useStarStore } from '../store/useStarStore';

type InstancedGroup = {
  mesh: InstancedMesh;
  starIds: string[];
  dummy: Matrix4;
};

export class SceneManager {
  private container: HTMLElement;
  private scene: Scene;
  private camera: PerspectiveCamera;
  private renderer: WebGLRenderer;
  private controls: OrbitControls;
  private raycaster: Raycaster;
  private mouse: Vector2;
  private clock: Clock;
  private evolutionPath: EvolutionPath;
  private animationId: number | null = null;

  private instancedMeshes: Map<Exclude<SpectralType, 'ALL'>, InstancedGroup> =
    new Map();
  private starIdToPosition: Map<string, Vector3> = new Map();
  private selectedStarMesh: Mesh | null = null;
  private hoverStarId: string | null = null;
  private selectedStarId: string | null = null;

  private filterAnimation: {
    active: boolean;
    startTime: number;
    duration: number;
    targetType: SpectralType;
  } | null = null;

  private flyAnimation: {
    active: boolean;
    startTime: number;
    duration: number;
    startPosition: Vector3;
    targetPosition: Vector3;
    startTarget: Vector3;
    targetLookAt: Vector3;
  } | null = null;

  private tooltipElement: HTMLElement | null = null;

  private boundHandleResize: () => void;
  private boundOnMouseMove: (event: MouseEvent) => void;
  private boundOnClick: (event: MouseEvent) => void;

  constructor(container: HTMLElement) {
    this.container = container;

    this.scene = new Scene();
    this.setupBackground();

    this.camera = new PerspectiveCamera(
      60,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    this.camera.position.set(0, 0, 50);

    this.renderer = new WebGLRenderer({ antialias: true });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(this.renderer.domElement);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.minDistance = 5;
    this.controls.maxDistance = 200;

    this.setupLighting();

    this.raycaster = new Raycaster();
    this.mouse = new Vector2();
    this.clock = new Clock();

    this.evolutionPath = new EvolutionPath(this.scene);

    this.boundHandleResize = this.handleResize.bind(this);
    this.boundOnMouseMove = this.onMouseMove.bind(this);
    this.boundOnClick = this.onClick.bind(this);

    window.addEventListener('resize', this.boundHandleResize);
    this.renderer.domElement.addEventListener(
      'mousemove',
      this.boundOnMouseMove
    );
    this.renderer.domElement.addEventListener('click', this.boundOnClick);

    this.createTooltip();

    this.animate();
  }

  private setupBackground(): void {
    const canvas = document.createElement('canvas');
    canvas.width = 2;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;
    const gradient = ctx.createLinearGradient(0, 0, 0, 512);
    gradient.addColorStop(0, '#0B0C10');
    gradient.addColorStop(1, '#1F2833');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 2, 512);

    const texture = new CanvasTexture(canvas);
    texture.needsUpdate = true;
    this.scene.background = texture;
  }

  private setupLighting(): void {
    const ambientLight = new AmbientLight(0xffffff, 0.4);
    this.scene.add(ambientLight);

    const pointLight = new PointLight(0xffffff, 1, 100);
    pointLight.position.set(10, 10, 10);
    this.scene.add(pointLight);
  }

  private createTooltip(): void {
    this.tooltipElement = document.createElement('div');
    this.tooltipElement.style.cssText = `
      position: absolute;
      background: rgba(11, 12, 16, 0.95);
      border: 1px solid #45A29E;
      border-radius: 4px;
      padding: 8px 12px;
      color: #C5C6C7;
      font-size: 12px;
      pointer-events: none;
      z-index: 1000;
      display: none;
      backdrop-filter: blur(4px);
    `;
    this.container.appendChild(this.tooltipElement);
  }

  renderStars(stars: Star[], filterType: SpectralType): void {
    this.disposeAllMeshes();
    this.starIdToPosition.clear();

    if (stars.length === 0) return;

    const spectralTypes = [
      'O',
      'B',
      'A',
      'F',
      'G',
      'K',
      'M',
    ] as Exclude<SpectralType, 'ALL'>[];

    for (const type of spectralTypes) {
      const filteredStars = stars.filter(
        (star) =>
          filterType === 'ALL' ? true : star.spectralType === type
      );

      if (filteredStars.length === 0) continue;

      const maxStars = Math.min(filteredStars.length, 200);
      const useStars = filteredStars.slice(0, maxStars);

      const baseGeometry = new SphereGeometry(1, 16, 16);
      const material = createInstancedStarsMaterial(type);
      material.transparent = true;

      const instancedMesh = new InstancedMesh(
        baseGeometry,
        material,
        useStars.length
      );
      instancedMesh.instanceMatrix.setUsage(35044);

      const starIds: string[] = [];
      const dummy = new Matrix4();

      useStars.forEach((star, index) => {
        const x = (Math.log10(star.temperature) - 3.8) * 8;
        const y = (15 - star.absoluteMagnitude) * 0.8 - 10;
        const z = (Math.random() - 0.5) * 4;

        const position = new Vector3(x, y, z);
        this.starIdToPosition.set(star.id, position.clone());

        const scale = star.radius * SCALE_FACTOR;
        dummy.identity();
        dummy.setPosition(position);
        dummy.scale(new Vector3(scale, scale, scale));
        instancedMesh.setMatrixAt(index, dummy);

        starIds.push(star.id);
      });

      instancedMesh.instanceMatrix.needsUpdate = true;

      if (filterType !== 'ALL' && filterType !== type) {
        material.opacity = 0.1;
      } else {
        material.opacity = 1;
      }

      this.instancedMeshes.set(type, {
        mesh: instancedMesh,
        starIds,
        dummy,
      });

      this.scene.add(instancedMesh);
    }
  }

  updateFilter(filterType: SpectralType, _progress: number): void {
    this.filterAnimation = {
      active: true,
      startTime: this.clock.getElapsedTime(),
      duration: 0.5,
      targetType: filterType,
    };
  }

  private updateFilterAnimation(): void {
    if (!this.filterAnimation?.active) return;

    const elapsed = this.clock.getElapsedTime() - this.filterAnimation.startTime;
    const t = Math.min(elapsed / this.filterAnimation.duration, 1);
    const eased = this.easeOutCubic(t);

    this.instancedMeshes.forEach((group, type) => {
      const materials = Array.isArray(group.mesh.material)
        ? group.mesh.material
        : [group.mesh.material];
      const shouldBeVisible =
        this.filterAnimation!.targetType === 'ALL' ||
        this.filterAnimation!.targetType === type;

      const targetOpacity = shouldBeVisible ? 1 : 0.1;
      const startOpacity = shouldBeVisible ? 0.1 : 1;
      const opacity = startOpacity + (targetOpacity - startOpacity) * eased;

      materials.forEach((mat) => {
        if ('opacity' in mat) {
          (mat as MeshStandardMaterial).opacity = opacity;
          (mat as MeshStandardMaterial).transparent = true;
        }
      });
    });

    if (t >= 1) {
      this.filterAnimation.active = false;
    }
  }

  private easeOutCubic(t: number): number {
    return 1 - Math.pow(1 - t, 3);
  }

  flyToStar(star: Star, duration: number = 1500): void {
    const starPosition = this.starIdToPosition.get(star.id);
    if (!starPosition) return;

    const direction = starPosition.clone().sub(this.camera.position).normalize();
    const distance = Math.max(star.radius * SCALE_FACTOR * 5, 3);
    const targetPosition = starPosition
      .clone()
      .sub(direction.multiplyScalar(distance));

    this.flyAnimation = {
      active: true,
      startTime: this.clock.getElapsedTime() * 1000,
      duration,
      startPosition: this.camera.position.clone(),
      targetPosition,
      startTarget: this.controls.target.clone(),
      targetLookAt: starPosition.clone(),
    };

    this.controls.enabled = false;
  }

  private updateFlyAnimation(): void {
    if (!this.flyAnimation?.active) return;

    const elapsed = this.clock.getElapsedTime() * 1000 - this.flyAnimation.startTime;
    const t = Math.min(elapsed / this.flyAnimation.duration, 1);
    const eased = easeOutElastic(t);

    this.camera.position.lerpVectors(
      this.flyAnimation.startPosition,
      this.flyAnimation.targetPosition,
      eased
    );

    this.controls.target.lerpVectors(
      this.flyAnimation.startTarget,
      this.flyAnimation.targetLookAt,
      eased
    );

    if (t >= 1) {
      this.flyAnimation.active = false;
      this.controls.enabled = true;
    }
  }

  highlightStar(starId: string): void {
    this.removeHighlight();
    this.selectedStarId = starId;

    const star = useStarStore.getState().stars.find((s) => s.id === starId);
    if (!star) return;

    const position = this.starIdToPosition.get(starId);
    if (!position) return;

    this.selectedStarMesh = createStarMesh(star.spectralType, star.radius, true);
    this.selectedStarMesh.position.copy(position);
    this.scene.add(this.selectedStarMesh);

    this.hideInstancedStar(starId);
  }

  private hideInstancedStar(starId: string): void {
    this.instancedMeshes.forEach((group) => {
      const index = group.starIds.indexOf(starId);
      if (index !== -1) {
        group.dummy.identity();
        group.dummy.setPosition(new Vector3(0, -1000, 0));
        group.dummy.scale(new Vector3(0, 0, 0));
        group.mesh.setMatrixAt(index, group.dummy);
        group.mesh.instanceMatrix.needsUpdate = true;
      }
    });
  }

  private showInstancedStar(starId: string): void {
    const star = useStarStore.getState().stars.find((s) => s.id === starId);
    if (!star) return;

    const position = this.starIdToPosition.get(starId);
    if (!position) return;

    this.instancedMeshes.forEach((group) => {
      const index = group.starIds.indexOf(starId);
      if (index !== -1) {
        const scale = star.radius * SCALE_FACTOR;
        group.dummy.identity();
        group.dummy.setPosition(position);
        group.dummy.scale(new Vector3(scale, scale, scale));
        group.mesh.setMatrixAt(index, group.dummy);
        group.mesh.instanceMatrix.needsUpdate = true;
      }
    });
  }

  private removeHighlight(): void {
    if (this.selectedStarId) {
      this.showInstancedStar(this.selectedStarId);
    }

    if (this.selectedStarMesh) {
      this.scene.remove(this.selectedStarMesh);
      disposeMesh(this.selectedStarMesh);
      this.selectedStarMesh = null;
    }

    this.selectedStarId = null;
  }

  updateSelectedStar(progress: number): void {
    if (!this.selectedStarId) return;

    const evolutionPath = useStarStore.getState().evolutionPath;
    if (evolutionPath.length < 2) return;

    const clampedProgress = Math.max(0, Math.min(1, progress));
    const index = clampedProgress * (evolutionPath.length - 1);
    const lowerIndex = Math.floor(index);
    const upperIndex = Math.min(lowerIndex + 1, evolutionPath.length - 1);
    const t = index - lowerIndex;

    const lowerPoint = evolutionPath[lowerIndex];
    const upperPoint = evolutionPath[upperIndex];

    const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

    const x = lerp(lowerPoint.position.x, upperPoint.position.x, t);
    const y = lerp(lowerPoint.position.y, upperPoint.position.y, t);
    const z = lerp(lowerPoint.position.z, upperPoint.position.z, t);
    const radius = lerp(lowerPoint.radius, upperPoint.radius, t);

    if (this.selectedStarMesh) {
      this.selectedStarMesh.position.set(x, y, z);
      const scale = radius * SCALE_FACTOR;
      this.selectedStarMesh.scale.setScalar(scale);

      const color = new Color(SPECTRAL_COLORS[lowerPoint.spectralType]);
      const upperColor = new Color(SPECTRAL_COLORS[upperPoint.spectralType]);
      color.lerp(upperColor, t);

      const material = this.selectedStarMesh.material as MeshStandardMaterial;
      if ('emissive' in material) {
        material.emissive.copy(color);
      }

      const glowMesh = this.selectedStarMesh.children.find(
        (child) => child.name === 'glow'
      ) as Mesh;
      if (glowMesh) {
        const glowMaterial = glowMesh.material as MeshBasicMaterial;
        glowMaterial.color.copy(color);
        glowMesh.scale.setScalar(1.5 / scale);
      }
    }

    if (this.starIdToPosition.has(this.selectedStarId)) {
      this.starIdToPosition.set(
        this.selectedStarId,
        new Vector3(x, y, z)
      );
    }
  }

  onMouseMove(event: MouseEvent): void {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);

    let hoveredStarId: string | null = null;
    let hoveredPosition: Vector3 | null = null;
    let hoveredStar: Star | null = null;

    const meshes: (Mesh | InstancedMesh)[] = Array.from(this.instancedMeshes.values()).map(
      (group) => group.mesh
    );

    if (this.selectedStarMesh) {
      meshes.push(this.selectedStarMesh);
    }

    const intersects = this.raycaster.intersectObjects(meshes, true);

    if (intersects.length > 0) {
      const intersection = intersects[0];
      const object = intersection.object;

      if (object === this.selectedStarMesh) {
        hoveredStarId = this.selectedStarId;
        hoveredPosition = intersection.point;
        hoveredStar = useStarStore
          .getState()
          .stars.find((s) => s.id === hoveredStarId)!;
      } else if (object instanceof InstancedMesh) {
        const instanceId = intersection.instanceId;
        if (instanceId !== undefined) {
          const group = Array.from(this.instancedMeshes.values()).find(
            (g) => g.mesh === object
          );
          if (group && instanceId < group.starIds.length) {
            hoveredStarId = group.starIds[instanceId];
            hoveredPosition = intersection.point;
            hoveredStar = useStarStore
              .getState()
              .stars.find((s) => s.id === hoveredStarId)!;
          }
        }
      }
    }

    this.hoverStarId = hoveredStarId;
    this.updateTooltip(event, hoveredStar, hoveredPosition);
    this.renderer.domElement.style.cursor = hoveredStarId
      ? 'pointer'
      : 'default';
  }

  private updateTooltip(
    event: MouseEvent,
    star: Star | null,
    position: Vector3 | null
  ): void {
    if (!this.tooltipElement) return;

    if (star && position) {
      this.tooltipElement.style.display = 'block';
      this.tooltipElement.style.left = `${event.clientX - this.container.getBoundingClientRect().left + 15}px`;
      this.tooltipElement.style.top = `${event.clientY - this.container.getBoundingClientRect().top + 15}px`;
      this.tooltipElement.innerHTML = `
        <div style="font-weight: bold; color: #66FCF1; margin-bottom: 4px;">${star.name}</div>
        <div>光谱类型: ${star.spectralType}</div>
        <div>温度: ${star.temperature.toLocaleString()} K</div>
        <div>光度: ${star.luminosity.toFixed(2)} L☉</div>
        <div>质量: ${star.mass.toFixed(2)} M☉</div>
      `;
    } else {
      this.tooltipElement.style.display = 'none';
    }
  }

  onClick(_event: MouseEvent): void {
    if (this.hoverStarId) {
      useStarStore.getState().setSelectedStar(this.hoverStarId);
      useStarStore.getState().loadEvolutionPath(this.hoverStarId);

      const star = useStarStore
        .getState()
        .stars.find((s) => s.id === this.hoverStarId);
      if (star) {
        this.highlightStar(this.hoverStarId);
        this.flyToStar(star);

        const evolutionPath = useStarStore.getState().evolutionPath;
        if (evolutionPath.length > 0) {
          this.evolutionPath.createPath(evolutionPath);
          this.evolutionPath.startAnimation();
        }
      }
    }
  }

  private animate(): void {
    this.animationId = requestAnimationFrame(() => this.animate());

    const deltaTime = this.clock.getDelta();
    const isPlaying = useStarStore.getState().isPlaying;
    const evolutionProgress = useStarStore.getState().evolutionProgress;

    this.controls.update();

    this.updateFilterAnimation();
    this.updateFlyAnimation();

    if (isPlaying) {
      this.evolutionPath.update(deltaTime, evolutionProgress);
    } else {
      this.evolutionPath.stopAnimation();
    }

    this.updateSelectedStarPulse(deltaTime);
    this.updateSelectedStar(evolutionProgress);

    this.renderer.render(this.scene, this.camera);
  }

  private pulseTime: number = 0;

  private updateSelectedStarPulse(deltaTime: number): void {
    if (!this.selectedStarMesh) return;

    this.pulseTime += deltaTime;
    const pulseScale = 1 + Math.sin(this.pulseTime * 3) * 0.1;

    const glowMesh = this.selectedStarMesh.children.find(
      (child) => child.name === 'glow'
    ) as Mesh;
    if (glowMesh) {
      const glowMaterial = glowMesh.material as MeshBasicMaterial;
      glowMaterial.opacity = 0.3 + Math.sin(this.pulseTime * 3) * 0.15;
      glowMesh.scale.setScalar(1.5 * pulseScale);
    }
  }

  handleResize(): void {
    if (!this.container) return;

    this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(
      this.container.clientWidth,
      this.container.clientHeight
    );
  }

  private disposeAllMeshes(): void {
    this.instancedMeshes.forEach((group) => {
      this.scene.remove(group.mesh);
      disposeMesh(group.mesh);
    });
    this.instancedMeshes.clear();
  }

  dispose(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }

    window.removeEventListener('resize', this.boundHandleResize);
    this.renderer.domElement.removeEventListener(
      'mousemove',
      this.boundOnMouseMove
    );
    this.renderer.domElement.removeEventListener('click', this.boundOnClick);

    this.disposeAllMeshes();
    this.removeHighlight();

    this.evolutionPath.clear();

    this.controls.dispose();
    this.renderer.dispose();

    if (this.tooltipElement && this.tooltipElement.parentNode) {
      this.tooltipElement.parentNode.removeChild(this.tooltipElement);
    }

    if (this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(
        this.renderer.domElement
      );
    }

    if (this.scene.background instanceof CanvasTexture) {
      this.scene.background.dispose();
    }
  }
}

export function easeOutElastic(t: number): number {
  if (t === 0) return 0;
  if (t === 1) return 1;
  return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * (2 * Math.PI / 3)) + 1;
}
