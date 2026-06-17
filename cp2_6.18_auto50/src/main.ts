import * as THREE from 'three';
import { SceneManager, GRID_SIZE, CELL_SIZE, PRESET_COLORS } from './sceneManager';
import { InteractionManager, type EditMode, type HoverInfo } from './interaction';
import { GUIManager, type GUIState } from './gui';

interface AppState {
  scene: THREE.Scene | null;
  camera: THREE.PerspectiveCamera | null;
  renderer: THREE.WebGLRenderer | null;
  sceneManager: SceneManager | null;
  interaction: InteractionManager | null;
  gui: GUIManager | null;
  clock: THREE.Clock | null;
  previewMesh: THREE.Mesh | null;
  previewBorder: THREE.LineSegments | null;
  gridHelper: THREE.GridHelper | null;
  animating: boolean;
  lastHoverCache: string;
  init: () => void;
  setupLighting: () => void;
  setupGridHelper: () => void;
  createPreviewMesh: () => void;
  setupResizeHandler: (container: HTMLElement) => void;
  animate: () => void;
  dispose: () => void;
}

const app: AppState = {
  scene: null,
  camera: null,
  renderer: null,
  sceneManager: null,
  interaction: null,
  gui: null,
  clock: null,
  previewMesh: null,
  previewBorder: null,
  gridHelper: null,
  animating: true,
  lastHoverCache: '',

  init(): void {
    const container = document.getElementById('app');
    if (!container) {
      console.error('Container element #app not found');
      return;
    }

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x000000);

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    this.camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    const center = (GRID_SIZE * CELL_SIZE) / 2 - CELL_SIZE / 2;
    this.camera.position.set(center + 18, 22, center + 22);
    this.camera.lookAt(center, center * 0.5, center);

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance'
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(width, height);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;
    container.appendChild(this.renderer.domElement);

    this.setupLighting();
    this.setupGridHelper();

    this.sceneManager = new SceneManager(this.scene);

    this.createPreviewMesh();

    const editState: {
      mode: EditMode;
      currentColor: string;
      brushSize: number;
    } = {
      mode: 'place',
      currentColor: PRESET_COLORS[5],
      brushSize: 1
    };

    this.interaction = new InteractionManager(
      this.camera,
      this.renderer,
      this.sceneManager,
      container,
      {
        mode: editState.mode,
        currentColor: editState.currentColor,
        brushSize: editState.brushSize
      }
    );

    if (this.previewMesh) {
      this.interaction.setPreviewMesh(this.previewMesh);
    }

    const guiState: GUIState = {
      color: editState.currentColor,
      brushSize: editState.brushSize,
      mode: editState.mode
    };

    this.gui = new GUIManager(guiState, {
      onClearScene: () => {
        if (this.sceneManager) {
          this.sceneManager.clearScene();
        }
      },
      onColorChange: (color: string) => {
        editState.currentColor = color;
        if (this.interaction) {
          this.interaction.updateOptions({ currentColor: color });
        }
      },
      onBrushSizeChange: (size: number) => {
        editState.brushSize = size;
        if (this.interaction) {
          this.interaction.updateOptions({ brushSize: size });
        }
      },
      onModeChange: (mode: EditMode) => {
        editState.mode = mode;
        if (this.interaction) {
          this.interaction.updateOptions({ mode });
        }
      }
    });

    this.gui.updateVoxelCount(this.sceneManager.getTotalVoxelCount());

    this.sceneManager.onSceneChange = () => {
      if (this.sceneManager && this.gui) {
        this.gui.updateVoxelCount(this.sceneManager.getTotalVoxelCount());
      }
    };

    this.clock = new THREE.Clock();

    this.setupResizeHandler(container);
    this.animate();
  },

  setupLighting(): void {
    if (!this.scene) return;

    const ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.4);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xFFFFFF, 0.8);
    directionalLight.position.set(10, 20, 10);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.set(2048, 2048);
    directionalLight.shadow.camera.left = -GRID_SIZE;
    directionalLight.shadow.camera.right = GRID_SIZE * 2;
    directionalLight.shadow.camera.top = GRID_SIZE * 2;
    directionalLight.shadow.camera.bottom = -GRID_SIZE;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 80;
    directionalLight.shadow.bias = -0.0005;
    this.scene.add(directionalLight);

    const fillLight = new THREE.DirectionalLight(0x5AC8FA, 0.15);
    fillLight.position.set(-10, 8, -10);
    this.scene.add(fillLight);
  },

  setupGridHelper(): void {
    if (!this.scene) return;

    const gridDivisions = GRID_SIZE;
    const gridSize = GRID_SIZE * CELL_SIZE;

    this.gridHelper = new THREE.GridHelper(
      gridSize,
      gridDivisions,
      0x444444,
      0x333333
    );

    this.gridHelper.position.set(
      gridSize / 2 - CELL_SIZE / 2,
      0,
      gridSize / 2 - CELL_SIZE / 2
    );
    (this.gridHelper.material as THREE.Material).transparent = true;
    (this.gridHelper.material as THREE.Material).opacity = 0.6;
    this.scene.add(this.gridHelper);

    const boundsGeometry = new THREE.BoxGeometry(
      GRID_SIZE * CELL_SIZE,
      GRID_SIZE * CELL_SIZE,
      GRID_SIZE * CELL_SIZE
    );
    const edgesGeometry = new THREE.EdgesGeometry(boundsGeometry);
    const boundsMaterial = new THREE.LineBasicMaterial({
      color: 0x444444,
      transparent: true,
      opacity: 0.3
    });
    const boundsLines = new THREE.LineSegments(edgesGeometry, boundsMaterial);
    boundsLines.position.set(
      (GRID_SIZE * CELL_SIZE) / 2 - CELL_SIZE / 2,
      (GRID_SIZE * CELL_SIZE) / 2 - CELL_SIZE / 2,
      (GRID_SIZE * CELL_SIZE) / 2 - CELL_SIZE / 2
    );
    this.scene.add(boundsLines);
  },

  createPreviewMesh(): void {
    if (!this.scene) return;

    const initialColor = new THREE.Color(PRESET_COLORS[5]);

    const geometry = new THREE.BoxGeometry(
      CELL_SIZE * 0.96,
      CELL_SIZE * 0.96,
      CELL_SIZE * 0.96
    );
    const material = new THREE.MeshBasicMaterial({
      color: initialColor,
      transparent: true,
      opacity: 0.4,
      depthTest: true,
      depthWrite: false,
      side: THREE.DoubleSide
    });

    this.previewMesh = new THREE.Mesh(geometry, material);
    this.previewMesh.visible = false;
    this.previewMesh.renderOrder = 999;
    this.scene.add(this.previewMesh);

    const borderEdges = new THREE.EdgesGeometry(new THREE.BoxGeometry(
      CELL_SIZE * 0.98,
      CELL_SIZE * 0.98,
      CELL_SIZE * 0.98
    ));
    const borderMat = new THREE.LineBasicMaterial({
      color: 0xFFFFFF,
      transparent: true,
      opacity: 0.9,
      depthTest: true,
      depthWrite: false
    });
    this.previewBorder = new THREE.LineSegments(borderEdges, borderMat);
    this.previewBorder.visible = false;
    this.previewBorder.renderOrder = 999;
    this.scene.add(this.previewBorder);
  },

  setupResizeHandler(container: HTMLElement): void {
    window.addEventListener('resize', () => {
      if (!this.camera || !this.renderer) return;

      const width = container.clientWidth || window.innerWidth;
      const height = container.clientHeight || window.innerHeight;

      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(width, height);
    });
  },

  animate(): void {
    if (!this.animating) return;

    requestAnimationFrame(() => this.animate());

    if (!this.scene || !this.camera || !this.renderer || !this.clock) return;

    const deltaTime = Math.min(this.clock.getDelta(), 0.05);

    if (this.sceneManager) {
      this.sceneManager.update(deltaTime);
    }
    if (this.interaction) {
      this.interaction.update(deltaTime);

      const hover: HoverInfo = this.interaction.getHoverInfo();
      const cacheKey = `${hover.x},${hover.y},${hover.z},${hover.displayX},${hover.displayY},${hover.displayZ}`;
      if (cacheKey !== this.lastHoverCache) {
        this.lastHoverCache = cacheKey;
        if (this.gui) {
          this.gui.updateHoverCoords(
            hover.displayX,
            hover.displayY,
            hover.displayZ
          );
        }
      }
    }

    if (this.previewMesh && this.previewBorder) {
      this.previewBorder.visible = this.previewMesh.visible;
      if (this.previewMesh.visible) {
        this.previewBorder.position.copy(this.previewMesh.position);
      }
    }

    this.renderer.render(this.scene, this.camera);
  },

  dispose(): void {
    this.animating = false;

    if (this.gui) this.gui.dispose();
    if (this.interaction) this.interaction.dispose();
    if (this.sceneManager) this.sceneManager.dispose();

    if (this.previewMesh) {
      this.scene?.remove(this.previewMesh);
      (this.previewMesh.material as THREE.Material).dispose();
      this.previewMesh.geometry.dispose();
    }

    if (this.previewBorder) {
      this.scene?.remove(this.previewBorder);
      (this.previewBorder.material as THREE.Material).dispose();
      this.previewBorder.geometry.dispose();
    }

    if (this.gridHelper) {
      this.scene?.remove(this.gridHelper);
      (this.gridHelper.material as THREE.Material).dispose();
      this.gridHelper.geometry.dispose();
    }

    if (this.renderer) {
      this.renderer.dispose();
      this.renderer.domElement.remove();
    }

    this.scene?.clear();
  }
};

window.addEventListener('DOMContentLoaded', () => {
  app.init();
});

window.addEventListener('beforeunload', () => {
  app.dispose();
});
