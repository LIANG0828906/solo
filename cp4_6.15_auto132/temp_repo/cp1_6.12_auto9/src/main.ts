import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import * as d3 from 'd3';
import { BuildingModel, type RoomInfo } from './model/building';
import { EnergyDataModule, type EnergyType } from './model/data';
import { ControlPanel } from './ui/panel';
import { DetailPanel } from './ui/detail';
import { ParticleSystem } from './effects/particles';

const FLOORS = 5;
const ROOMS_PER_FLOOR = 10;

class App {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private controls: OrbitControls;
  private clock: THREE.Clock;
  private raycaster: THREE.Raycaster;
  private pointer: THREE.Vector2;

  private building: BuildingModel;
  private data: EnergyDataModule;
  private panel: ControlPanel;
  private detail: DetailPanel;
  private particles: ParticleSystem;

  private hoveredRoomId: string | null = null;
  private selectedRoomId: string | null = null;
  private introAnim = { t: 0, active: true };
  private detailType: EnergyType = 'electricity';

  constructor() {
    const container = document.getElementById('canvas-container')!;
    const uiLayer = document.getElementById('ui-layer')!;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color('#0f1923');
    this.scene.fog = new THREE.FogExp2('#0f1923', 0.025);

    this.camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 500);
    this.camera.position.set(28, 22, 32);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    container.appendChild(this.renderer.domElement);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.minDistance = 8;
    this.controls.maxDistance = 80;
    this.controls.maxPolarAngle = Math.PI * 0.49;
    this.controls.target.set(0, 6, 0);

    this.clock = new THREE.Clock();
    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2(-10, -10);

    this.building = new BuildingModel();
    this.data = new EnergyDataModule();
    this.panel = new ControlPanel();
    this.detail = new DetailPanel();
    this.particles = new ParticleSystem();

    this.panel.mount(uiLayer);
    this.detail.mount(uiLayer);

    this.setupLights();
    this.buildModel();
    this.setupEvents();
    this.setupDataFlow();

    window.addEventListener('resize', this.onResize.bind(this));
    this.renderer.domElement.addEventListener('pointermove', this.onPointerMove.bind(this));
    this.renderer.domElement.addEventListener('pointerdown', this.onPointerDown.bind(this));
    this.renderer.domElement.addEventListener('pointerleave', () => { this.pointer.set(-10, -10); });

    this.animate();
  }

  private setupLights(): void {
    const amb = new THREE.AmbientLight(0x6b8cb8, 0.55);
    this.scene.add(amb);

    const hemi = new THREE.HemisphereLight(0x7dd3fc, 0x0a1420, 0.35);
    this.scene.add(hemi);

    const d1 = new THREE.DirectionalLight(0xffffff, 0.9);
    d1.position.set(20, 30, 15);
    d1.castShadow = true;
    d1.shadow.mapSize.set(1024, 1024);
    d1.shadow.camera.near = 1;
    d1.shadow.camera.far = 100;
    d1.shadow.camera.left = -35;
    d1.shadow.camera.right = 35;
    d1.shadow.camera.top = 35;
    d1.shadow.camera.bottom = -35;
    this.scene.add(d1);

    const d2 = new THREE.DirectionalLight(0x00e5ff, 0.35);
    d2.position.set(-18, 12, -10);
    this.scene.add(d2);

    const fill = new THREE.PointLight(0xff6b35, 0.25, 60);
    fill.position.set(-8, 4, 10);
    this.scene.add(fill);
  }

  private buildModel(): void {
    const t0 = performance.now();
    const roomsInfo = this.building.generate(FLOORS, ROOMS_PER_FLOOR);
    this.scene.add(this.building.group);

    this.particles.init(
      this.building.getBuildingCenter(),
      this.building.getBuildingSize(),
      FLOORS
    );
    this.scene.add(this.particles.points);

    const liteRooms = roomsInfo.map(r => ({ id: r.id, floor: r.floor, name: r.name }));
    this.data.init(liteRooms);

    this.panel.setTotalFloors(FLOORS);

    this.detail.setupTypeSwitch(
      ['electricity', 'water', 'gas'],
      this.detailType,
      (t) => {
        this.detailType = t;
        this.refreshDetail();
      }
    );

    this.building.group.scale.setScalar(0.01);
    this.building.group.rotation.y = Math.PI;
    this.building.group.position.y = -4;

    console.info(`[App] Model built: ${roomsInfo.length} rooms in ${(performance.now() - t0).toFixed(1)}ms`);
  }

  private setupDataFlow(): void {
    this.data.subscribe(() => this.refreshRoomColors());

    this.panel.onFloorChange(f => {
      this.data.setFloor(f);
      this.building.setFloorVisibility(f);
      this.refreshRoomColors();
      this.refreshStats();
    });
    this.panel.onTypeChange(t => {
      this.data.setType(t);
      this.refreshRoomColors();
      this.refreshStats();
      this.refreshDetail();
    });
    this.panel.onTimeRangeChange(h => {
      this.data.setTimeRange(h);
      this.refreshDetail();
    });

    this.detail.onClose(() => {
      this.selectedRoomId = null;
      this.building.highlightRoom(this.hoveredRoomId);
    });
  }

  private refreshRoomColors(): void {
    const type = this.data.getType();
    const floor = this.data.getFloor();
    let anomalyCount = 0;
    this.building.roomInfo.forEach((info, id) => {
      if (floor !== 'all' && info.floor !== floor) return;
      const nv = this.data.getNormalizedValue(id, type);
      this.building.updateRoomEnergy(id, nv);
      const anomaly = this.data.hasAnomaly(id, type);
      this.building.setRoomAnomaly(id, anomaly);
      if (anomaly) anomalyCount++;
    });
    this.refreshStats();
  }

  private refreshStats(): void {
    const type = this.data.getType();
    const floor = this.data.getFloor();
    const unit = this.panel.getTypeLabel(type).unit;
    let sum = 0;
    let count = 0;
    let anomalyCount = 0;
    this.building.roomInfo.forEach((info, id) => {
      if (floor !== 'all' && info.floor !== floor) return;
      sum += this.data.getRoomCurrent(id, type);
      count++;
      if (this.data.hasAnomaly(id, type)) anomalyCount++;
    });
    this.panel.updateStats(count > 0 ? sum / count : 0, unit, anomalyCount);
  }

  private refreshDetail(): void {
    if (!this.selectedRoomId) return;
    const info = this.building.roomInfo.get(this.selectedRoomId);
    if (!info) return;
    const type = this.detailType;
    const hours = this.data.getTimeRange();
    const history = this.data.getRoomHistory(this.selectedRoomId, type, hours);
    const current = this.data.getRoomCurrent(this.selectedRoomId, type);
    const anomaly = this.data.hasAnomaly(this.selectedRoomId, type);
    const unit = this.panel.getTypeLabel(type).unit;
    this.detail.update(history, current, anomaly, unit, type);
  }

  private setupEvents(): void { }

  private onResize(): void {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  private onPointerMove(e: PointerEvent): void {
    this.pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
    this.pointer.y = -(e.clientY / window.innerHeight) * 2 + 1;
  }

  private onPointerDown(e: PointerEvent): void {
    if (e.button !== 0) return;
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const intersects = this.raycaster.intersectObjects([this.building.group], true);
    if (intersects.length > 0) {
      const roomId = this.building.getRoomByIntersect(intersects[0]);
      if (roomId) {
        const info = this.building.roomInfo.get(roomId);
        if (info) {
          this.selectedRoomId = roomId;
          this.detail.show(roomId, info);
          this.detailType = this.data.getType();
          this.detail.setupTypeSwitch(
            ['electricity', 'water', 'gas'],
            this.detailType,
            (t) => { this.detailType = t; this.refreshDetail(); }
          );
          this.building.highlightRoom(roomId);
          this.refreshDetail();
          return;
        }
      }
    }
    if (this.detail.isVisible() && !(e.target as HTMLElement).closest('.detail-panel')) {
      this.detail.hide();
    }
  }

  private updateHover(): void {
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const intersects = this.raycaster.intersectObjects([this.building.group], true);
    let hovered: string | null = null;
    if (intersects.length > 0) {
      hovered = this.building.getRoomByIntersect(intersects[0]);
    }
    if (hovered !== this.hoveredRoomId) {
      this.hoveredRoomId = hovered;
      if (!this.selectedRoomId) this.building.highlightRoom(hovered);
      this.renderer.domElement.style.cursor = hovered ? 'pointer' : 'grab';
    }
  }

  private updateIntro(delta: number): void {
    if (!this.introAnim.active) return;
    this.introAnim.t = Math.min(1, this.introAnim.t + delta * 0.55);
    const e = d3.easeCubicOut(this.introAnim.t);
    this.building.group.scale.setScalar(0.01 + 0.99 * e);
    this.building.group.rotation.y = Math.PI * (1 - e);
    this.building.group.position.y = -4 + 4 * e;
    if (this.introAnim.t >= 1) {
      this.introAnim.active = false;
      this.building.group.scale.setScalar(1);
      this.building.group.rotation.y = 0;
      this.building.group.position.y = 0;
    }
  }

  private animate(): void {
    requestAnimationFrame(this.animate.bind(this));
    const delta = Math.min(this.clock.getDelta(), 0.05);
    const elapsed = this.clock.elapsedTime;

    this.updateIntro(delta);
    this.updateHover();

    this.building.update(delta, elapsed);
    this.particles.update(delta, this.data.getTotalEnergyMultiplier());

    if (!this.introAnim.active && this.selectedRoomId == null) {
      this.building.group.rotation.y = Math.sin(elapsed * 0.08) * 0.05;
    }

    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }
}

window.addEventListener('DOMContentLoaded', () => {
  new App();
});
