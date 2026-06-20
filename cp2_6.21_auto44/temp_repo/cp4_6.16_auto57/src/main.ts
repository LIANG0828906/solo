import * as THREE from 'three';
import { loadGalaxyData, type CelestialBody } from './dataLoader';
import { StarSystem } from './StarSystem';
import { InteractionManager, type InteractionHandlers } from './interaction';
import { createUI, type UIActions, type CelestialBody as UICelestialBody } from './ui';

const SCENE_RADIUS = 100;
const BG_STAR_COUNT = 8000;

class App {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private starSystem: StarSystem | null = null;
  private interaction: InteractionManager | null = null;
  private ui: ReturnType<typeof createUI> | null = null;
  private clock: THREE.Clock;
  private container: HTMLElement;

  constructor(container: HTMLElement) {
    this.container = container;
    this.clock = new THREE.Clock();

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a0e27);
    this.scene.fog = new THREE.FogExp2(0x0a0e27, 0.003);

    this.camera = new THREE.PerspectiveCamera(
      60,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    this.camera.position.set(0, 5, 30);
    this.camera.lookAt(0, 0, 0);

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setClearColor(0x0a0e27);
    container.appendChild(this.renderer.domElement);

    this.setupLights();
    this.setupResize();
  }

  private setupLights(): void {
    const ambientLight = new THREE.AmbientLight(0x404050, 0.4);
    this.scene.add(ambientLight);

    const fillLight = new THREE.DirectionalLight(0x6688ff, 0.3);
    fillLight.position.set(50, 50, 50);
    this.scene.add(fillLight);
  }

  private setupResize(): void {
    window.addEventListener('resize', () => {
      this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    });
  }

  private toUIBody(body: CelestialBody): UICelestialBody {
    return {
      id: body.id,
      name: body.name,
      type: body.type,
      color: body.color,
      colorDesc: body.colorDesc,
      temperature: body.temperature,
      distanceFromSun: body.distanceFromSun,
      size: body.size,
    };
  }

  public async init(): Promise<void> {
    const data = await loadGalaxyData();

    const starCount = data.filter((d) => d.type === 'star').length;
    const planetCount = data.filter((d) => d.type === 'planet').length;

    this.starSystem = new StarSystem(data, {
      sceneRadius: SCENE_RADIUS,
      starCount,
      planetCount,
      backgroundStarCount: BG_STAR_COUNT,
    });
    this.scene.add(this.starSystem.group);

    const interactionHandlers: InteractionHandlers = {
      onSelect: (body) => {
        if (this.ui) {
          this.ui.showDetails(this.toUIBody(body));
        }
      },
      onDeselect: () => {
        if (this.ui) {
          this.ui.hideDetails();
        }
      },
      onCategorySelect: (cat) => {
        if (this.ui) {
          this.ui.setActiveCategory(cat);
        }
      },
    };

    this.interaction = new InteractionManager(
      this.camera,
      this.renderer,
      this.starSystem,
      interactionHandlers
    );

    const uiActions: UIActions = {
      onSelectCategory: (cat) => {
        if (this.interaction) {
          this.interaction.handleCategorySelect(cat);
        }
      },
      onClosePanel: () => {
        if (this.interaction) {
          this.interaction.deselect();
        }
      },
      onOutsideClick: () => {
        if (this.interaction) {
          this.interaction.deselect();
        }
      },
    };

    this.ui = createUI(uiActions);

    this.animate();
  }

  private animate = (): void => {
    requestAnimationFrame(this.animate);
    const delta = this.clock.getDelta();

    if (this.starSystem) {
      this.starSystem.update(delta);
    }
    if (this.interaction) {
      this.interaction.update(delta);
    }

    this.renderer.render(this.scene, this.camera);
  };

  public dispose(): void {
    if (this.interaction) {
      this.interaction.dispose();
    }
    this.renderer.dispose();
  }
}

const container = document.getElementById('app');
if (!container) {
  throw new Error('Container #app not found');
}

const app = new App(container);
app.init().catch((err) => {
  console.error('Failed to initialize StarDrifter:', err);
});
