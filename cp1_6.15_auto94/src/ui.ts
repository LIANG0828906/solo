import * as api from './api.js';
import { SceneManager } from './scene.js';
import {
  GROWTH_STAGES,
  STAGE_LABELS,
  STAGE_ORDER,
  type PlantBase,
  type EvolutionGraph,
  type EvolutionNode,
  type EvolutionLink,
  type GrowthStage,
  type PlantInfo,
  type LightAngle
} from './types.js';

type PlantSelectedCallback = (plantId: string) => void;
type StageChangedCallback = (stage: GrowthStage) => void;
type LightAngleChangedCallback = (azimuth: number, elevation: number) => void;

export class UIManager {
  private sceneManager: SceneManager;
  private apiInstance: typeof api;

  selectedPlantId: string | null;
  evolutionGraph: EvolutionGraph | null;
  plantsList: PlantBase[];
  onPlantSelected: PlantSelectedCallback | null;
  onStageChanged: StageChangedCallback | null;
  onLightAngleChanged: LightAngleChangedCallback | null;

  private currentLightAngle: LightAngle;
  private isDraggingLight: boolean;
  private lightStartPos: { x: number; y: number };
  private sidebarVisible: boolean;
  private infoCardTimeout: number | null;

  constructor(sceneManager: SceneManager, apiInstance: typeof api) {
    this.sceneManager = sceneManager;
    this.apiInstance = apiInstance;

    this.selectedPlantId = null;
    this.evolutionGraph = null;
    this.plantsList = [];
    this.onPlantSelected = null;
    this.onStageChanged = null;
    this.onLightAngleChanged = null;

    this.currentLightAngle = { azimuth: 45, elevation: 60 };
    this.isDraggingLight = false;
    this.lightStartPos = { x: 0, y: 0 };
    this.sidebarVisible = true;
    this.infoCardTimeout = null;
  }

  async initialize(): Promise<void> {
    this.showLoading();

    try {
      const [plants, graph] = await Promise.all([
        this.apiInstance.getPlantList(),
        this.apiInstance.getEvolutionGraph()
      ]);

      this.plantsList = plants;
      this.evolutionGraph = graph;

      this.buildEvolutionPanel('evolution-svg');
      this.initStageControl();
      this.initLightController();
      this.initResponsive();
      this.initInfoCardClose();

      this.showPanels();
    } catch (error) {
      console.error('[UIManager] Initialization failed:', error);
    } finally {
      this.hideLoading();
    }
  }

  private showPanels(): void {
    const ids = [
      'evolution-panel',
      'sidebar-toggle',
      'light-controller',
      'stage-control'
    ];
    ids.forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.style.display = '';
      }
    });
  }

  buildEvolutionPanel(svgId: string = 'evolution-svg'): void {
    const svg = document.getElementById(svgId) as SVGElement | null;
    if (!svg || !this.evolutionGraph) return;

    const SVG_NS = 'http://www.w3.org/2000/svg';
    while (svg.firstChild) {
      svg.removeChild(svg.firstChild);
    }

    const { nodes, links } = this.evolutionGraph;
    const nodeMap = new Map<string, EvolutionNode>();
    nodes.forEach(n => nodeMap.set(n.plantId, n));

    const VIEW_W = 200;
    const VIEW_H = 480;

    links.forEach(link => {
      const from = nodeMap.get(link.from);
      const to = nodeMap.get(link.to);
      if (!from || !to) return;

      const fx = from.position.x * VIEW_W;
      const fy = from.position.y * VIEW_H;
      const tx = to.position.x * VIEW_W;
      const ty = to.position.y * VIEW_H;

      const path = document.createElementNS(SVG_NS, 'path');
      const midY = (fy + ty) / 2;
      const ctrlX = (fx + tx) / 2;
      const d = `M ${fx} ${fy} C ${ctrlX} ${midY}, ${ctrlX} ${midY}, ${tx} ${ty}`;
      path.setAttribute('d', d);
      path.setAttribute('class', 'evo-link');
      svg.appendChild(path);
    });

    nodes.forEach(node => {
      const plant = this.plantsList.find(p => p.id === node.plantId);
      if (!plant) return;

      const nx = node.position.x * VIEW_W;
      const ny = node.position.y * VIEW_H;

      const g = document.createElementNS(SVG_NS, 'g');
      g.setAttribute('data-plant-id', plant.id);
      g.style.cursor = 'pointer';

      const circle = document.createElementNS(SVG_NS, 'circle');
      circle.setAttribute('cx', String(nx));
      circle.setAttribute('cy', String(ny));
      circle.setAttribute('class', 'evo-node');
      circle.setAttribute('data-plant-id', plant.id);
      g.appendChild(circle);

      const text = document.createElementNS(SVG_NS, 'text');
      text.setAttribute('x', String(nx));
      text.setAttribute('y', String(ny + 26));
      text.setAttribute('class', 'evo-label');
      text.textContent = plant.commonName;
      g.appendChild(text);

      g.addEventListener('click', () => {
        this.setSelectedPlant(plant.id);
        if (this.onPlantSelected) {
          this.onPlantSelected(plant.id);
        }
      });

      svg.appendChild(g);
    });
  }

  setSelectedPlant(id: string): void {
    this.selectedPlantId = id;

    const nodes = document.querySelectorAll('.evo-node');
    nodes.forEach(n => {
      const nid = n.getAttribute('data-plant-id');
      if (nid === id) {
        n.classList.add('selected');
      } else {
        n.classList.remove('selected');
      }
    });
  }

  initStageControl(): void {
    const slider = document.getElementById('stage-slider') as HTMLInputElement | null;
    const labels = document.querySelectorAll('.stage-label');

    if (slider) {
      slider.addEventListener('input', () => {
        const idx = parseInt(slider.value, 10);
        const stage = GROWTH_STAGES[idx] || 'mature';
        this.updateStageUI(idx);
        if (this.onStageChanged) {
          this.onStageChanged(stage);
        }
      });
    }

    labels.forEach(label => {
      label.addEventListener('click', () => {
        const stageIdx = label.getAttribute('data-stage');
        if (!stageIdx) return;
        const idx = parseInt(stageIdx, 10);
        const stage = GROWTH_STAGES[idx] || 'mature';

        if (slider) slider.value = String(idx);
        this.updateStageUI(idx);
        if (this.onStageChanged) {
          this.onStageChanged(stage);
        }
      });
    });

    this.updateStageUI(2);
  }

  private updateStageUI(activeIdx: number): void {
    const labels = document.querySelectorAll('.stage-label');
    labels.forEach(label => {
      const stageIdx = label.getAttribute('data-stage');
      if (!stageIdx) return;
      const idx = parseInt(stageIdx, 10);
      if (idx === activeIdx) {
        label.classList.add('active');
      } else {
        label.classList.remove('active');
      }
    });
  }

  initLightController(): void {
    const controller = document.getElementById('light-controller');
    if (!controller) return;

    const CTRL_SIZE = 20;
    const MAX_RADIUS = 60;

    controller.style.width = `${CTRL_SIZE}px`;
    controller.style.height = `${CTRL_SIZE}px`;
    controller.style.borderRadius = '50%';
    controller.style.position = 'absolute';
    controller.style.cursor = 'grab';
    controller.style.touchAction = 'none';

    let centerClientX = 0;
    let centerClientY = 0;
    let offsetStartX = 0;
    let offsetStartY = 0;

    const computeAngles = (dx: number, dy: number) => {
      const dist = Math.sqrt(dx * dx + dy * dy);
      let azimuth = Math.atan2(dx, -dy) * (180 / Math.PI);
      if (azimuth < 0) azimuth += 360;
      const normDist = Math.min(1, dist / MAX_RADIUS);
      const elevation = (1 - normDist) * 90;
      return { azimuth, elevation };
    };

    const updatePositionFromAngles = (azimuth: number, elevation: number) => {
      const azRad = (azimuth * Math.PI) / 180;
      const elNorm = (90 - elevation) / 90;
      const dist = elNorm * MAX_RADIUS;
      const offsetX = Math.sin(azRad) * dist;
      const offsetY = -Math.cos(azRad) * dist;
      controller.style.left = `calc(50% + ${offsetX}px - ${CTRL_SIZE / 2}px)`;
      controller.style.top = `calc(50% + ${offsetY}px - ${CTRL_SIZE / 2}px)`;
    };

    const updateAnglesFromOffset = (offsetX: number, offsetY: number) => {
      const dist = Math.sqrt(offsetX * offsetX + offsetY * offsetY);
      let clampedX = offsetX;
      let clampedY = offsetY;
      if (dist > MAX_RADIUS) {
        const ratio = MAX_RADIUS / dist;
        clampedX = offsetX * ratio;
        clampedY = offsetY * ratio;
      }
      controller.style.left = `calc(50% + ${clampedX}px - ${CTRL_SIZE / 2}px)`;
      controller.style.top = `calc(50% + ${clampedY}px - ${CTRL_SIZE / 2}px)`;
      const { azimuth, elevation } = computeAngles(clampedX, clampedY);
      this.currentLightAngle = { azimuth, elevation };
      if (this.onLightAngleChanged) {
        this.onLightAngleChanged(azimuth, elevation);
      }
    };

    const refreshCenter = () => {
      const parent = controller.parentElement;
      if (!parent) return;
      const parentRect = parent.getBoundingClientRect();
      centerClientX = parentRect.left + parentRect.width / 2;
      centerClientY = parentRect.top + parentRect.height / 2;
    };

    updatePositionFromAngles(this.currentLightAngle.azimuth, this.currentLightAngle.elevation);

    const onMouseDown = (e: MouseEvent) => {
      refreshCenter();
      this.isDraggingLight = true;
      const ctrlRect = controller.getBoundingClientRect();
      const ctrlCenterX = ctrlRect.left + CTRL_SIZE / 2;
      const ctrlCenterY = ctrlRect.top + CTRL_SIZE / 2;
      offsetStartX = ctrlCenterX - centerClientX;
      offsetStartY = ctrlCenterY - centerClientY;
      this.lightStartPos = { x: e.clientX, y: e.clientY };
      controller.style.cursor = 'grabbing';
      e.preventDefault();
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!this.isDraggingLight) return;
      const dx = e.clientX - this.lightStartPos.x;
      const dy = e.clientY - this.lightStartPos.y;
      updateAnglesFromOffset(offsetStartX + dx, offsetStartY + dy);
    };

    const onMouseUp = () => {
      this.isDraggingLight = false;
      controller.style.cursor = 'grab';
    };

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 0) return;
      refreshCenter();
      this.isDraggingLight = true;
      const t = e.touches[0];
      const ctrlRect = controller.getBoundingClientRect();
      const ctrlCenterX = ctrlRect.left + CTRL_SIZE / 2;
      const ctrlCenterY = ctrlRect.top + CTRL_SIZE / 2;
      offsetStartX = ctrlCenterX - centerClientX;
      offsetStartY = ctrlCenterY - centerClientY;
      this.lightStartPos = { x: t.clientX, y: t.clientY };
      controller.style.cursor = 'grabbing';
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!this.isDraggingLight || e.touches.length === 0) return;
      const t = e.touches[0];
      const dx = t.clientX - this.lightStartPos.x;
      const dy = t.clientY - this.lightStartPos.y;
      updateAnglesFromOffset(offsetStartX + dx, offsetStartY + dy);
      e.preventDefault();
    };

    const onTouchEnd = () => {
      this.isDraggingLight = false;
      controller.style.cursor = 'grab';
    };

    controller.addEventListener('mousedown', onMouseDown);
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);

    controller.addEventListener('touchstart', onTouchStart, { passive: true });
    document.addEventListener('touchmove', onTouchMove, { passive: false });
    document.addEventListener('touchend', onTouchEnd);
  }

  initResponsive(): void {
    const sidebar = document.getElementById('evolution-panel');
    const toggle = document.getElementById('sidebar-toggle');
    if (!sidebar || !toggle) return;

    const mq = window.matchMedia('(max-width: 1023px)');

    const handleMQ = (e: MediaQueryListEvent | MediaQueryList) => {
      const isSmall = e.matches;
      if (isSmall) {
        sidebar.classList.remove('visible');
        this.sidebarVisible = false;
      } else {
        sidebar.classList.remove('visible');
        this.sidebarVisible = true;
      }
    };

    mq.addEventListener ? mq.addEventListener('change', handleMQ) : mq.addListener(handleMQ);
    handleMQ(mq);

    toggle.addEventListener('click', () => {
      this.sidebarVisible = !this.sidebarVisible;
      if (this.sidebarVisible) {
        sidebar.classList.add('visible');
      } else {
        sidebar.classList.remove('visible');
      }
    });
  }

  private initInfoCardClose(): void {
    const closeBtn = document.getElementById('info-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.hideInfoCard());
    }
  }

  async showInfoCard(plantId: string, screenX: number, screenY: number): Promise<void> {
    if (this.infoCardTimeout !== null) {
      clearTimeout(this.infoCardTimeout);
      this.infoCardTimeout = null;
    }

    const card = document.getElementById('info-card');
    if (!card) return;

    try {
      const info: PlantInfo = await this.apiInstance.getPlantInfo(plantId);

      const sciEl = document.getElementById('info-scientific');
      const comEl = document.getElementById('info-common');
      const tempEl = document.getElementById('info-temp');
      const humEl = document.getElementById('info-humidity');
      const envEl = document.getElementById('info-environment');
      const evoEl = document.getElementById('info-evolution');
      const factsEl = document.getElementById('info-facts');

      if (sciEl) sciEl.textContent = info.scientificName;
      if (comEl) comEl.textContent = info.commonName;
      if (tempEl) tempEl.textContent = `${info.habitat.temperatureRange[0]}°C ~ ${info.habitat.temperatureRange[1]}°C`;
      if (humEl) humEl.textContent = info.habitat.humidityRequirement;
      if (envEl) envEl.textContent = info.habitat.typicalEnvironment;
      if (evoEl) evoEl.textContent = info.evolutionDescription;
      if (factsEl) {
        factsEl.innerHTML = '';
        info.interestingFacts.forEach(fact => {
          const li = document.createElement('li');
          li.textContent = fact;
          factsEl.appendChild(li);
        });
      }

      const cardW = 300;
      const cardH = 420;
      const margin = 16;
      const vw = window.innerWidth;
      const vh = window.innerHeight;

      let left = screenX + 16;
      let top = screenY - 20;

      if (left + cardW + margin > vw) {
        left = screenX - cardW - 16;
      }
      left = Math.max(margin, Math.min(left, vw - cardW - margin));

      if (top + cardH + margin > vh) {
        top = vh - cardH - margin;
      }
      top = Math.max(margin, top);

      card.style.left = `${left}px`;
      card.style.top = `${top}px`;
      card.classList.remove('active');
      card.style.display = 'block';
      card.style.opacity = '0';
      card.style.transform = 'translateY(20px) scale(0.95)';
      card.style.transition = 'opacity 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)';

      requestAnimationFrame(() => {
        card.classList.add('active');
        card.style.opacity = '1';
        card.style.transform = 'translateY(0) scale(1)';
      });
    } catch (error) {
      console.error('[UIManager] showInfoCard failed:', error);
    }
  }

  hideInfoCard(): void {
    const card = document.getElementById('info-card');
    if (!card) return;

    card.classList.remove('active');

    if (this.infoCardTimeout !== null) {
      clearTimeout(this.infoCardTimeout);
    }
    this.infoCardTimeout = window.setTimeout(() => {
      card.style.display = 'none';
      this.infoCardTimeout = null;
    }, 400);
  }

  showLoading(): void {
    const loading = document.getElementById('loading');
    if (loading) {
      loading.classList.remove('hidden');
    }
  }

  hideLoading(): void {
    const loading = document.getElementById('loading');
    if (loading) {
      loading.classList.add('hidden');
    }
  }

  getDefaultPlantId(): string {
    if (this.plantsList.length > 0) {
      const adiantum = this.plantsList.find(p => p.id === 'adiantum');
      return adiantum ? adiantum.id : this.plantsList[0].id;
    }
    return 'adiantum';
  }
}
