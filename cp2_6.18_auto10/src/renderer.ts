import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import type { PlantStemData, LayerConfig, VascularBundle } from './dataParser';
import { EventType, eventBus } from './dataParser';
import { EffectsManager } from './effects';

export interface RenderState {
  currentLayer: number;
  autoRotate: boolean;
  autoRotateSpeed: number;
  selectedVascular: number | null;
  isAnimating: boolean;
}

export class PlantRenderer {
  private container: HTMLElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private controls: OrbitControls;
  private composer: EffectComposer;
  private stemGroup: THREE.Group;
  private layerMeshes: Map<string, THREE.Mesh> = new Map();
  private vascularMeshes: Map<number, THREE.Mesh> = new Map();
  private boundaryRingLines: THREE.Line[] = [];
  private vascularParticleSystems: THREE.Points[] = [];
  private outerGlowWireframe: THREE.Mesh | null = null;
  private stemData: PlantStemData;
  private effectsManager: EffectsManager;
  private raycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;
  private frameId: number | null = null;
  private lastInteractionTime: number = 0;
  private idleTimeout: number = 3000;
  private boundHandleResize: () => void;
  private boundHandleMouseMove: (event: MouseEvent) => void;
  private boundOpacityChange: (data: unknown) => void;
  private boundRotationSpeedChange: (data: unknown) => void;
  private boundAutoRotateToggle: (data: unknown) => void;
  private boundLayerRestore: (data: unknown) => void;
  private boundInteractionStart: () => void;
  private boundInteractionEnd: () => void;

  public state: RenderState = {
    currentLayer: 1,
    autoRotate: true,
    autoRotateSpeed: 0.02,
    selectedVascular: null,
    isAnimating: false,
  };

  constructor(container: HTMLElement, stemData: PlantStemData) {
    this.container = container;
    this.stemData = stemData;
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.boundHandleResize = this.handleResize.bind(this);
    this.boundHandleMouseMove = this.handleMouseMove.bind(this);
    this.boundOpacityChange = this.handleOpacityChange.bind(this);
    this.boundRotationSpeedChange = this.handleRotationSpeedChange.bind(this);
    this.boundAutoRotateToggle = this.handleAutoRotateToggle.bind(this);
    this.boundLayerRestore = this.handleLayerRestore.bind(this);
    this.boundInteractionStart = this.handleInteractionStart.bind(this);
    this.boundInteractionEnd = this.handleInteractionEnd.bind(this);

    this.scene = new THREE.Scene();
    this.camera = this.createCamera();
    this.renderer = this.createRenderer();
    this.controls = this.createControls();
    this.composer = this.createComposer();
    this.effectsManager = new EffectsManager(this.scene);
    this.stemGroup = new THREE.Group();

    this.setupEventListeners();
    this.buildStemModel();
    this.scene.add(this.stemGroup);
  }

  private createCamera(): THREE.PerspectiveCamera {
    const camera = new THREE.PerspectiveCamera(
      60,
      this.container.clientWidth / this.container.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 0, 15);
    return camera;
  }

  private createRenderer(): THREE.WebGLRenderer {
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    renderer.setClearColor(0x000000, 0);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1;
    this.container.appendChild(renderer.domElement);
    return renderer;
  }

  private createControls(): OrbitControls {
    const controls = new OrbitControls(this.camera, this.renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 5;
    controls.maxDistance = 30;
    controls.autoRotate = this.state.autoRotate;
    controls.autoRotateSpeed = this.state.autoRotateSpeed * 60;
    return controls;
  }

  private createComposer(): EffectComposer {
    const composer = new EffectComposer(this.renderer);
    
    const renderPass = new RenderPass(this.scene, this.camera);
    composer.addPass(renderPass);

    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(this.container.clientWidth, this.container.clientHeight),
      0.3,
      0.4,
      0.85
    );
    composer.addPass(bloomPass);

    return composer;
  }

  private createTubeGeometry(
    outerRadius: number,
    innerRadius: number,
    height: number
  ): THREE.BufferGeometry {
    const geometry = new THREE.CylinderGeometry(
      outerRadius,
      outerRadius,
      height,
      64,
      1,
      false
    );

    const positions = geometry.attributes.position;
    const normals = geometry.attributes.normal;
    const uvs = geometry.attributes.uv;

    const innerGeometry = new THREE.CylinderGeometry(
      innerRadius,
      innerRadius,
      height,
      64,
      1,
      true
    );

    const innerPositions = innerGeometry.attributes.position;
    const innerNormals = innerGeometry.attributes.normal;

    const vertexCount = positions.count + innerPositions.count + 4 * 64;
    const newPositions = new Float32Array(vertexCount * 3);
    const newNormals = new Float32Array(vertexCount * 3);
    const newUvs = new Float32Array(vertexCount * 2);

    let offset = 0;

    for (let i = 0; i < positions.count; i++) {
      newPositions[offset * 3] = positions.getX(i);
      newPositions[offset * 3 + 1] = positions.getY(i);
      newPositions[offset * 3 + 2] = positions.getZ(i);
      newNormals[offset * 3] = normals.getX(i);
      newNormals[offset * 3 + 1] = normals.getY(i);
      newNormals[offset * 3 + 2] = normals.getZ(i);
      newUvs[offset * 2] = uvs.getX(i);
      newUvs[offset * 2 + 1] = uvs.getY(i);
      offset++;
    }

    for (let i = 0; i < innerPositions.count; i++) {
      newPositions[offset * 3] = innerPositions.getX(i);
      newPositions[offset * 3 + 1] = innerPositions.getY(i);
      newPositions[offset * 3 + 2] = innerPositions.getZ(i);
      newNormals[offset * 3] = -innerNormals.getX(i);
      newNormals[offset * 3 + 1] = -innerNormals.getY(i);
      newNormals[offset * 3 + 2] = -innerNormals.getZ(i);
      newUvs[offset * 2] = 1 - (i % 64) / 64;
      newUvs[offset * 2 + 1] = Math.floor(i / 64);
      offset++;
    }

    for (let i = 0; i < 64; i++) {
      const angle1 = (i / 64) * Math.PI * 2;
      const angle2 = ((i + 1) % 64) / 64 * Math.PI * 2;
      const y = height / 2;

      newPositions[offset * 3] = Math.cos(angle1) * outerRadius;
      newPositions[offset * 3 + 1] = y;
      newPositions[offset * 3 + 2] = Math.sin(angle1) * outerRadius;
      newNormals[offset * 3] = 0;
      newNormals[offset * 3 + 1] = 1;
      newNormals[offset * 3 + 2] = 0;
      offset++;

      newPositions[offset * 3] = Math.cos(angle2) * outerRadius;
      newPositions[offset * 3 + 1] = y;
      newPositions[offset * 3 + 2] = Math.sin(angle2) * outerRadius;
      newNormals[offset * 3] = 0;
      newNormals[offset * 3 + 1] = 1;
      newNormals[offset * 3 + 2] = 0;
      offset++;

      newPositions[offset * 3] = Math.cos(angle2) * innerRadius;
      newPositions[offset * 3 + 1] = y;
      newPositions[offset * 3 + 2] = Math.sin(angle2) * innerRadius;
      newNormals[offset * 3] = 0;
      newNormals[offset * 3 + 1] = 1;
      newNormals[offset * 3 + 2] = 0;
      offset++;

      newPositions[offset * 3] = Math.cos(angle2) * innerRadius;
      newPositions[offset * 3 + 1] = y;
      newPositions[offset * 3 + 2] = Math.sin(angle2) * innerRadius;
      newNormals[offset * 3] = 0;
      newNormals[offset * 3 + 1] = 1;
      newNormals[offset * 3 + 2] = 0;
      offset++;

      newPositions[offset * 3] = Math.cos(angle1) * innerRadius;
      newPositions[offset * 3 + 1] = y;
      newPositions[offset * 3 + 2] = Math.sin(angle1) * innerRadius;
      newNormals[offset * 3] = 0;
      newNormals[offset * 3 + 1] = 1;
      newNormals[offset * 3 + 2] = 0;
      offset++;

      newPositions[offset * 3] = Math.cos(angle1) * outerRadius;
      newPositions[offset * 3 + 1] = y;
      newPositions[offset * 3 + 2] = Math.sin(angle1) * outerRadius;
      newNormals[offset * 3] = 0;
      newNormals[offset * 3 + 1] = 1;
      newNormals[offset * 3 + 2] = 0;
      offset++;

      const y2 = -height / 2;

      newPositions[offset * 3] = Math.cos(angle1) * innerRadius;
      newPositions[offset * 3 + 1] = y2;
      newPositions[offset * 3 + 2] = Math.sin(angle1) * innerRadius;
      newNormals[offset * 3] = 0;
      newNormals[offset * 3 + 1] = -1;
      newNormals[offset * 3 + 2] = 0;
      offset++;

      newPositions[offset * 3] = Math.cos(angle2) * innerRadius;
      newPositions[offset * 3 + 1] = y2;
      newPositions[offset * 3 + 2] = Math.sin(angle2) * innerRadius;
      newNormals[offset * 3] = 0;
      newNormals[offset * 3 + 1] = -1;
      newNormals[offset * 3 + 2] = 0;
      offset++;

      newPositions[offset * 3] = Math.cos(angle2) * outerRadius;
      newPositions[offset * 3 + 1] = y2;
      newPositions[offset * 3 + 2] = Math.sin(angle2) * outerRadius;
      newNormals[offset * 3] = 0;
      newNormals[offset * 3 + 1] = -1;
      newNormals[offset * 3 + 2] = 0;
      offset++;

      newPositions[offset * 3] = Math.cos(angle2) * outerRadius;
      newPositions[offset * 3 + 1] = y2;
      newPositions[offset * 3 + 2] = Math.sin(angle2) * outerRadius;
      newNormals[offset * 3] = 0;
      newNormals[offset * 3 + 1] = -1;
      newNormals[offset * 3 + 2] = 0;
      offset++;

      newPositions[offset * 3] = Math.cos(angle1) * outerRadius;
      newPositions[offset * 3 + 1] = y2;
      newPositions[offset * 3 + 2] = Math.sin(angle1) * outerRadius;
      newNormals[offset * 3] = 0;
      newNormals[offset * 3 + 1] = -1;
      newNormals[offset * 3 + 2] = 0;
      offset++;

      newPositions[offset * 3] = Math.cos(angle1) * innerRadius;
      newPositions[offset * 3 + 1] = y2;
      newPositions[offset * 3 + 2] = Math.sin(angle1) * innerRadius;
      newNormals[offset * 3] = 0;
      newNormals[offset * 3 + 1] = -1;
      newNormals[offset * 3 + 2] = 0;
      offset++;
    }

    const newGeometry = new THREE.BufferGeometry();
    newGeometry.setAttribute('position', new THREE.BufferAttribute(newPositions, 3));
    newGeometry.setAttribute('normal', new THREE.BufferAttribute(newNormals, 3));
    newGeometry.setAttribute('uv', new THREE.BufferAttribute(newUvs, 2));

    geometry.dispose();
    innerGeometry.dispose();

    return newGeometry;
  }

  private buildStemModel(): void {
    this.stemData.layers.forEach((layer) => {
      const mesh = this.createLayerMesh(layer);
      this.layerMeshes.set(layer.id, mesh);
      this.stemGroup.add(mesh);
    });

    this.stemData.vascularBundles.forEach((bundle) => {
      const mesh = this.createVascularBundleMesh(bundle);
      this.vascularMeshes.set(bundle.id, mesh);
      this.stemGroup.add(mesh);
    });

    this.createBoundaryRingLines();
    this.createVascularParticleSystems();
    this.createOuterGlowWireframe();
  }

  private createBoundaryRingLines(): void {
    const halfHeight = this.stemData.height / 2;
    const segments = 128;

    const createRingAtHeight = (radius: number, y: number): THREE.Line => {
      const points: THREE.Vector3[] = [];
      for (let i = 0; i <= segments; i++) {
        const angle = (i / segments) * Math.PI * 2;
        points.push(new THREE.Vector3(
          Math.cos(angle) * radius,
          y,
          Math.sin(angle) * radius
        ));
      }
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const material = new THREE.LineBasicMaterial({
        color: 0xaaaaaa,
        transparent: true,
        opacity: 0.5,
      });
      const line = new THREE.Line(geometry, material);
      line.renderOrder = 10;
      return line;
    };

    for (let i = 0; i < this.stemData.layers.length - 1; i++) {
      const outerLayer = this.stemData.layers[i];
      const innerLayer = this.stemData.layers[i + 1];
      const midRadius = (outerLayer.innerRadius + innerLayer.outerRadius) / 2;
      const gapRadius = midRadius;

      const topRing = createRingAtHeight(gapRadius, halfHeight);
      const bottomRing = createRingAtHeight(gapRadius, -halfHeight);

      this.boundaryRingLines.push(topRing, bottomRing);
      this.stemGroup.add(topRing);
      this.stemGroup.add(bottomRing);
    }

    for (let i = 0; i < this.stemData.layers.length; i++) {
      const layer = this.stemData.layers[i];
      const topOuterRing = createRingAtHeight(layer.outerRadius, halfHeight);
      const bottomOuterRing = createRingAtHeight(layer.outerRadius, -halfHeight);
      const topInnerRing = createRingAtHeight(layer.innerRadius, halfHeight);
      const bottomInnerRing = createRingAtHeight(layer.innerRadius, -halfHeight);

      this.boundaryRingLines.push(topOuterRing, bottomOuterRing, topInnerRing, bottomInnerRing);
      this.stemGroup.add(topOuterRing);
      this.stemGroup.add(bottomOuterRing);
      this.stemGroup.add(topInnerRing);
      this.stemGroup.add(bottomInnerRing);
    }
  }

  private createVascularParticleSystems(): void {
    this.stemData.vascularBundles.forEach((bundle) => {
      const particleCount = 50 + Math.floor(Math.random() * 31);
      const positions = new Float32Array(particleCount * 3);
      const colors = new Float32Array(particleCount * 3);

      for (let i = 0; i < particleCount; i++) {
        const angleOffset = Math.random() * Math.PI * 2;
        const distOffset = Math.random() * 0.2;
        const heightOffset = (Math.random() - 0.5) * (bundle.height * 0.8);

        const radialAngle = (bundle.angle * Math.PI) / 180;
        const tangentAngle = radialAngle + Math.PI / 2;

        const localX = Math.cos(tangentAngle) * distOffset * Math.cos(angleOffset) +
                       Math.cos(radialAngle) * distOffset * Math.sin(angleOffset) * 0.5;
        const localZ = Math.sin(tangentAngle) * distOffset * Math.cos(angleOffset) +
                       Math.sin(radialAngle) * distOffset * Math.sin(angleOffset) * 0.5;
        const localY = heightOffset;

        positions[i * 3] = bundle.x + localX;
        positions[i * 3 + 1] = localY;
        positions[i * 3 + 2] = bundle.z + localZ;

        const colorVariation = 0.85 + Math.random() * 0.15;
        colors[i * 3] = 1.0 * colorVariation;
        colors[i * 3 + 1] = 0.95 * colorVariation;
        colors[i * 3 + 2] = 0.4 * colorVariation;
      }

      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

      const material = new THREE.PointsMaterial({
        size: 0.04,
        vertexColors: true,
        transparent: true,
        opacity: 0.6,
        sizeAttenuation: true,
      });

      const points = new THREE.Points(geometry, material);
      points.renderOrder = 5;
      this.vascularParticleSystems.push(points);
      this.stemGroup.add(points);
    });
  }

  private createOuterGlowWireframe(): void {
    const epidermisLayer = this.stemData.layers[0];
    if (!epidermisLayer) return;

    const glowRadius = epidermisLayer.outerRadius + 0.08;
    const geometry = new THREE.CylinderGeometry(
      glowRadius,
      glowRadius,
      this.stemData.height + 0.1,
      64,
      1,
      true
    );

    const material = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      wireframe: true,
      transparent: true,
      opacity: 0.1,
      side: THREE.DoubleSide,
    });

    this.outerGlowWireframe = new THREE.Mesh(geometry, material);
    this.outerGlowWireframe.renderOrder = -1;
    this.stemGroup.add(this.outerGlowWireframe);
  }

  private createLayerMesh(layer: LayerConfig): THREE.Mesh {
    const geometry = this.createTubeGeometry(
      layer.outerRadius,
      layer.innerRadius,
      this.stemData.height
    );

    const material = new THREE.MeshStandardMaterial({
      color: layer.color,
      transparent: true,
      opacity: layer.opacity,
      side: THREE.DoubleSide,
      roughness: 0.7,
      metalness: 0.1,
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.userData = { layerId: layer.id, type: 'layer' };
    mesh.renderOrder = 3 - layer.index;

    return mesh;
  }

  private createVascularBundleMesh(bundle: VascularBundle): THREE.Mesh {
    const geometry = new THREE.CylinderGeometry(
      bundle.width / 2,
      bundle.width / 2,
      bundle.height,
      8
    );

    const material = new THREE.MeshStandardMaterial({
      color: 0x006400,
      transparent: true,
      opacity: 1,
      roughness: 0.5,
      metalness: 0.1,
      emissive: 0x000000,
      emissiveIntensity: 0,
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(bundle.x, 0, bundle.z);
    mesh.rotation.z = Math.PI / 2;
    mesh.scale.set(1, 1, bundle.length / bundle.width);
    mesh.userData = { vascularId: bundle.id, type: 'vascular', bundleData: bundle };
    mesh.castShadow = true;
    mesh.renderOrder = 0;

    return mesh;
  }

  private setupEventListeners(): void {
    window.addEventListener('resize', this.boundHandleResize);
    this.renderer.domElement.addEventListener('mousemove', this.boundHandleMouseMove);
    this.controls.addEventListener('start', this.boundInteractionStart);
    this.controls.addEventListener('end', this.boundInteractionEnd);

    eventBus.on(EventType.LAYER_OPACITY_CHANGE, this.boundOpacityChange);
    eventBus.on(EventType.ROTATION_SPEED_CHANGE, this.boundRotationSpeedChange);
    eventBus.on(EventType.AUTO_ROTATE_TOGGLE, this.boundAutoRotateToggle);
    eventBus.on(EventType.LAYER_RESTORE, this.boundLayerRestore);
  }

  private handleResize(): void {
    this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.composer.setSize(this.container.clientWidth, this.container.clientHeight);
  }

  private handleMouseMove(event: MouseEvent): void {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.checkVascularHover();
  }

  private checkVascularHover(): void {
    if (this.state.currentLayer < 3) {
      if (this.state.selectedVascular !== null) {
        this.clearVascularHighlight();
      }
      return;
    }

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const vascularArray = Array.from(this.vascularMeshes.values());
    const intersects = this.raycaster.intersectObjects(vascularArray);

    if (intersects.length > 0) {
      const mesh = intersects[0].object as THREE.Mesh;
      const vascularId = mesh.userData.vascularId as number;

      if (this.state.selectedVascular !== vascularId) {
        this.clearVascularHighlight();
        this.state.selectedVascular = vascularId;
        this.effectsManager.animateVascularHighlight(mesh, true);
        eventBus.emit(EventType.VASCULAR_HOVER, mesh.userData.bundleData);
      }
    } else if (this.state.selectedVascular !== null) {
      this.clearVascularHighlight();
    }
  }

  private clearVascularHighlight(): void {
    if (this.state.selectedVascular !== null) {
      const mesh = this.vascularMeshes.get(this.state.selectedVascular);
      if (mesh) {
        this.effectsManager.animateVascularHighlight(mesh, false);
      }
      eventBus.emit(EventType.VASCULAR_LEAVE);
      this.state.selectedVascular = null;
    }
  }

  private handleInteractionStart(): void {
    this.lastInteractionTime = Date.now();
    this.state.autoRotate = false;
    this.controls.autoRotate = false;
  }

  private handleInteractionEnd(): void {
    this.lastInteractionTime = Date.now();
  }

  private checkIdle(): void {
    if (!this.state.autoRotate && Date.now() - this.lastInteractionTime > this.idleTimeout) {
      this.state.autoRotate = true;
      this.controls.autoRotate = true;
    }
  }

  private handleOpacityChange(data: unknown): void {
    const { layerId, opacity } = data as { layerId: string; opacity: number };
    const mesh = this.layerMeshes.get(layerId);
    if (mesh) {
      const material = mesh.material as THREE.MeshStandardMaterial;
      material.opacity = opacity;
    }
    if (layerId === 'vascular') {
      this.vascularMeshes.forEach((mesh) => {
        const material = mesh.material as THREE.MeshStandardMaterial;
        material.opacity = opacity;
      });
    }
  }

  private handleRotationSpeedChange(data: unknown): void {
    const speed = data as number;
    this.state.autoRotateSpeed = speed;
    this.controls.autoRotateSpeed = speed * 60;
  }

  private handleAutoRotateToggle(data: unknown): void {
    const enabled = data as boolean;
    this.state.autoRotate = enabled;
    this.controls.autoRotate = enabled;
  }

  private handleLayerRestore(data: unknown): void {
    const targetLayer = data as number;
    this.restoreToLayer(targetLayer);
  }

  public switchToLayer(targetLayer: number): void {
    if (this.state.isAnimating) return;
    if (targetLayer < 1 || targetLayer > 3) return;
    if (targetLayer === this.state.currentLayer) return;

    if (targetLayer > this.state.currentLayer) {
      this.peelToLayer(targetLayer);
    } else {
      this.restoreToLayer(targetLayer);
    }
  }

  private peelToLayer(targetLayer: number): void {
    const layersToPeel: LayerConfig[] = [];
    for (let i = this.state.currentLayer; i < targetLayer; i++) {
      const layer = this.stemData.layers[i - 1];
      if (layer) {
        layersToPeel.push(layer);
      }
    }

    if (layersToPeel.length === 0) return;

    this.state.isAnimating = true;
    let completed = 0;

    layersToPeel.forEach((layer, index) => {
      setTimeout(() => {
        const mesh = this.layerMeshes.get(layer.id);
        if (mesh) {
          this.effectsManager.animateLayerPeel(mesh, layer, () => {
            completed++;
            if (completed === layersToPeel.length) {
              this.state.currentLayer = targetLayer;
              this.state.isAnimating = false;
              this.updateAuxiliaryVisibility();
              eventBus.emit(EventType.LAYER_SWITCH, targetLayer);

              if (targetLayer === 3) {
                this.vascularMeshes.forEach((mesh) => {
                  this.effectsManager.animateLayerFadeIn(mesh, 1, 0.5);
                });
              }
            }
          });
        } else {
          completed++;
        }
      }, index * 200);
    });
  }

  private restoreToLayer(targetLayer: number): void {
    const layersToRestore: LayerConfig[] = [];
    for (let i = this.state.currentLayer - 1; i >= targetLayer; i--) {
      const layer = this.stemData.layers[i - 1];
      if (layer) {
        layersToRestore.push(layer);
      }
    }

    if (layersToRestore.length === 0) {
      this.state.currentLayer = targetLayer;
      this.updateAuxiliaryVisibility();
      eventBus.emit(EventType.LAYER_SWITCH, targetLayer);
      return;
    }

    this.state.isAnimating = true;
    let completed = 0;

    layersToRestore.forEach((layer, index) => {
      setTimeout(() => {
        const mesh = this.layerMeshes.get(layer.id);
        if (mesh) {
          this.effectsManager.animateLayerRestore(mesh, layer, () => {
            completed++;
            if (completed === layersToRestore.length) {
              this.state.currentLayer = targetLayer;
              this.state.isAnimating = false;
              this.updateAuxiliaryVisibility();
              eventBus.emit(EventType.LAYER_SWITCH, targetLayer);
            }
          });
        } else {
          completed++;
        }
      }, index * 200);
    });
  }

  private updateAuxiliaryVisibility(): void {
    const currentLayer = this.state.currentLayer;

    if (this.outerGlowWireframe) {
      this.outerGlowWireframe.visible = currentLayer <= 1;
    }

    const gapLinesCount = (this.stemData.layers.length - 1) * 2;
    const layerLinesPerLayer = 4;
    for (let i = 0; i < this.boundaryRingLines.length; i++) {
      let visible = false;
      if (i < gapLinesCount) {
        const gapIndex = Math.floor(i / 2);
        visible = currentLayer <= gapIndex + 1;
      } else {
        const lineOffset = i - gapLinesCount;
        const layerIndex = Math.floor(lineOffset / layerLinesPerLayer);
        visible = currentLayer <= layerIndex + 1;
      }
      this.boundaryRingLines[i].visible = visible;
    }

    this.vascularParticleSystems.forEach((points) => {
      points.visible = currentLayer >= 3;
    });
  }

  public setLayerOpacity(layerId: string, opacity: number): void {
    eventBus.emit(EventType.LAYER_OPACITY_CHANGE, { layerId, opacity });
  }

  private animate(): void {
    this.frameId = requestAnimationFrame(this.animate.bind(this));
    this.checkIdle();
    this.controls.update();
    this.composer.render();
  }

  public start(): void {
    this.animate();
  }

  public stop(): void {
    if (this.frameId !== null) {
      cancelAnimationFrame(this.frameId);
      this.frameId = null;
    }
  }

  public dispose(): void {
    this.stop();
    this.effectsManager.dispose();

    this.layerMeshes.forEach((mesh) => {
      mesh.geometry.dispose();
      (mesh.material as THREE.Material).dispose();
    });

    this.vascularMeshes.forEach((mesh) => {
      mesh.geometry.dispose();
      (mesh.material as THREE.Material).dispose();
    });

    this.boundaryRingLines.forEach((line) => {
      line.geometry.dispose();
      (line.material as THREE.Material).dispose();
    });
    this.boundaryRingLines = [];

    this.vascularParticleSystems.forEach((points) => {
      points.geometry.dispose();
      (points.material as THREE.Material).dispose();
    });
    this.vascularParticleSystems = [];

    if (this.outerGlowWireframe) {
      this.outerGlowWireframe.geometry.dispose();
      (this.outerGlowWireframe.material as THREE.Material).dispose();
      this.outerGlowWireframe = null;
    }

    this.renderer.dispose();
    this.controls.dispose();
    this.composer.dispose();

    window.removeEventListener('resize', this.boundHandleResize);
    this.renderer.domElement.removeEventListener('mousemove', this.boundHandleMouseMove);
    this.controls.removeEventListener('start', this.boundInteractionStart);
    this.controls.removeEventListener('end', this.boundInteractionEnd);

    eventBus.off(EventType.LAYER_OPACITY_CHANGE, this.boundOpacityChange);
    eventBus.off(EventType.ROTATION_SPEED_CHANGE, this.boundRotationSpeedChange);
    eventBus.off(EventType.AUTO_ROTATE_TOGGLE, this.boundAutoRotateToggle);
    eventBus.off(EventType.LAYER_RESTORE, this.boundLayerRestore);
  }
}
