import * as dat from 'dat.gui';
import { EngineConfig, EventBus, BodyState } from '../types';

export class ControlPanel {
  private gui: dat.GUI;
  private eventBus: EventBus;
  private config: EngineConfig = {
    gravitationalConstant: 0.5,
    starMass: 5
  };
  private bodies: BodyState[] = [];
  private infoFolder: dat.GUI | null = null;

  constructor(eventBus: EventBus) {
    this.eventBus = eventBus;
    this.gui = new dat.GUI({ width: 280 });
    this.gui.domElement.style.position = 'fixed';
    this.gui.domElement.style.top = '12px';
    this.gui.domElement.style.right = '12px';
    this.gui.domElement.style.borderRadius = '10px';
    this.gui.domElement.style.overflow = 'hidden';
    this.gui.domElement.style.backgroundColor = 'rgba(20, 20, 40, 0.85)';
    this.gui.domElement.style.backdropFilter = 'blur(10px)';
    this.gui.domElement.style.setProperty('--webkit-backdrop-filter', 'blur(10px)');
    this.gui.domElement.style.border = '1px solid rgba(0, 229, 255, 0.3)';
    this.gui.domElement.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.5)';

    this.setupStyles();
    this.setupControls();
    this.setupEventListeners();
    this.setupMobileToggle();
  }

  private setupStyles(): void {
    const style = document.createElement('style');
    style.textContent = `
      .dg.main {
        width: 100% !important;
      }
      .dg .c {
        width: 60% !important;
      }
      .dg .slider {
        background: rgba(255, 255, 255, 0.1) !important;
        border-radius: 4px !important;
      }
      .dg .slider-fg {
        background: linear-gradient(90deg, #00E5FF, #00CCFF) !important;
        border-radius: 4px !important;
      }
      .dg li:not(.folder) {
        background: transparent !important;
        border-bottom: 1px solid rgba(255, 255, 255, 0.05) !important;
      }
      .dg .folder {
        background: rgba(0, 0, 0, 0.2) !important;
      }
      .dg .title {
        background: rgba(0, 229, 255, 0.1) !important;
        color: #00E5FF !important;
        font-weight: 600 !important;
        text-shadow: 0 0 10px rgba(0, 229, 255, 0.3) !important;
      }
      .dg .property-name {
        color: #E0E0E0 !important;
        width: 40% !important;
      }
      .dg .c .slider:hover .slider-fg {
        opacity: 1 !important;
      }
      .dg.ac {
        z-index: 100 !important;
      }
      @media (max-width: 768px) {
        .dg.ac {
          position: fixed !important;
          top: 60px !important;
          left: 12px !important;
          right: auto !important;
          max-height: calc(100vh - 80px) !important;
          overflow-y: auto !important;
        }
      }
    `;
    document.head.appendChild(style);
  }

  private setupControls(): void {
    const physicsFolder = this.gui.addFolder('⚙️ 物理参数');
    physicsFolder.open();

    physicsFolder
      .add(this.config, 'gravitationalConstant', 0.1, 2.0, 0.01)
      .name('引力常数 G')
      .onChange((value: number) => {
        this.eventBus.emit('config:update', { gravitationalConstant: value });
      });

    physicsFolder
      .add(this.config, 'starMass', 1, 10, 0.1)
      .name('恒星质量')
      .onChange((value: number) => {
        this.eventBus.emit('config:update', { starMass: value });
      });

    this.infoFolder = this.gui.addFolder('🌟 选中星体');
    this.infoFolder.open();

    const infoObj = {
      name: '未选中',
      mass: '-',
      orbitRadius: '-'
    };

    this.infoFolder.add(infoObj, 'name').name('名称').listen();
    this.infoFolder.add(infoObj, 'mass').name('质量').listen();
    this.infoFolder.add(infoObj, 'orbitRadius').name('轨道半径').listen();
  }

  private setupEventListeners(): void {
    this.eventBus.on('config:updated', (config) => {
      this.config = { ...this.config, ...(config as Partial<EngineConfig>) };
    });

    this.eventBus.on('bodies:initialized', (bodies) => {
      this.bodies = bodies as BodyState[];
    });

    this.eventBus.on('body:clicked', (bodyId) => {
      const body = this.bodies.find((b) => b.id === bodyId);
      if (body) {
        this.updateSelectedBodyInfo(body);
      }
    });

    this.eventBus.on('scene:clicked', () => {
      this.clearSelectedBodyInfo();
    });
  }

  private updateSelectedBodyInfo(body: BodyState): void {
    const controller = this.infoFolder?.__controllers;
    if (controller) {
      controller.forEach((ctrl) => {
        if (ctrl.property === 'name') {
          ctrl.setValue(body.name);
        } else if (ctrl.property === 'mass') {
          ctrl.setValue(body.mass.toFixed(3));
        } else if (ctrl.property === 'orbitRadius') {
          ctrl.setValue(body.orbitRadius.toFixed(2) + ' 单位');
        }
      });
    }
  }

  private clearSelectedBodyInfo(): void {
    const controller = this.infoFolder?.__controllers;
    if (controller) {
      controller.forEach((ctrl) => {
        if (ctrl.property === 'name') {
          ctrl.setValue('未选中');
        } else if (ctrl.property === 'mass') {
          ctrl.setValue('-');
        } else if (ctrl.property === 'orbitRadius') {
          ctrl.setValue('-');
        }
      });
    }
  }

  private setupMobileToggle(): void {
    const mobileBtn = document.getElementById('mobile-menu-btn');
    if (!mobileBtn) return;

    const dgContainer = document.querySelector('.dg.ac') as HTMLElement;
    let isOpen = false;

    mobileBtn.addEventListener('click', () => {
      isOpen = !isOpen;
      if (dgContainer) {
        dgContainer.classList.toggle('mobile-visible', isOpen);
      }
    });
  }

  destroy(): void {
    this.gui.destroy();
  }
}
