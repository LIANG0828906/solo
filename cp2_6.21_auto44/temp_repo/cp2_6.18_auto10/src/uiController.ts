import * as dat from 'dat.gui';
import type { PlantStemData, VascularBundle } from './dataParser';
import { EventType, eventBus } from './dataParser';

interface UIControlParams {
  showEpidermis: boolean;
  showCortex: boolean;
  showVascular: boolean;
  epidermisOpacity: number;
  cortexOpacity: number;
  vascularOpacity: number;
  autoRotate: boolean;
  rotationSpeed: number;
  layer1: () => void;
  layer2: () => void;
  layer3: () => void;
  reset: () => void;
}

export class UIController {
  private gui: dat.GUI;
  private container: HTMLElement;
  private stemData: PlantStemData;
  private params: UIControlParams;
  private layerNumberEl: HTMLElement | null = null;
  private layerNameEl: HTMLElement | null = null;
  private vascularInfoPanel: HTMLElement | null = null;
  private vascularTitleEl: HTMLElement | null = null;
  private vascularDetailEl: HTMLElement | null = null;
  private mobileToggleBtn: HTMLElement | null = null;
  private guiContainer: HTMLElement | null = null;
  private closeBtn: HTMLElement | null = null;
  private switchToLayer: ((layer: number) => void) | null = null;
  private boundHandleKeyDown: (event: KeyboardEvent) => void;
  private boundHandleLayerSwitchEvent: (data: unknown) => void;
  private boundHandleVascularHover: (data: unknown) => void;
  private boundHandleVascularLeave: () => void;
  private boundCheckResponsiveLayout: () => void;

  constructor(containerId: string, stemData: PlantStemData) {
    this.container = document.getElementById(containerId) || document.body;
    this.stemData = stemData;
    this.boundHandleKeyDown = this.handleKeyDown.bind(this);
    this.boundHandleLayerSwitchEvent = this.handleLayerSwitchEvent.bind(this);
    this.boundHandleVascularHover = this.handleVascularHover.bind(this);
    this.boundHandleVascularLeave = this.handleVascularLeave.bind(this);
    this.boundCheckResponsiveLayout = this.checkResponsiveLayout.bind(this);

    this.params = {
      showEpidermis: true,
      showCortex: true,
      showVascular: true,
      epidermisOpacity: stemData.layers[0]?.defaultOpacity || 0.3,
      cortexOpacity: stemData.layers[1]?.defaultOpacity || 0.4,
      vascularOpacity: stemData.layers[2]?.defaultOpacity || 1,
      autoRotate: true,
      rotationSpeed: 0.02,
      layer1: () => this.handleLayerSwitch(1),
      layer2: () => this.handleLayerSwitch(2),
      layer3: () => this.handleLayerSwitch(3),
      reset: () => this.handleReset(),
    };

    this.gui = new dat.GUI({
      autoPlace: false,
      width: 280,
    });

    this.container.appendChild(this.gui.domElement);
    this.setupUIElements();
    this.buildGUI();
    this.setupEventListeners();
    this.setupMobileControls();
  }

  private setupUIElements(): void {
    this.layerNumberEl = document.getElementById('layerNumber');
    this.layerNameEl = document.getElementById('layerName');
    this.vascularInfoPanel = document.getElementById('vascularInfoPanel');
    this.vascularTitleEl = document.getElementById('vascularTitle');
    this.vascularDetailEl = document.getElementById('vascularDetail');
    this.mobileToggleBtn = document.getElementById('mobileToggleBtn');
    this.guiContainer = document.getElementById('guiContainer');
    this.closeBtn = document.getElementById('closeBtn');
  }

  private buildGUI(): void {
    const layerFolder = this.gui.addFolder('层级控制');
    layerFolder.open();

    layerFolder.add(this.params, 'layer1').name('显示表皮层');
    layerFolder.add(this.params, 'layer2').name('显示皮层');
    layerFolder.add(this.params, 'layer3').name('显示维管束层');
    layerFolder.add(this.params, 'reset').name('重置所有层');

    const opacityFolder = this.gui.addFolder('透明度调节');
    opacityFolder.open();

    const epidermisLayer = this.stemData.layers[0];
    const cortexLayer = this.stemData.layers[1];
    const vascularLayer = this.stemData.layers[2];

    opacityFolder
      .add(this.params, 'epidermisOpacity', 0, 1, 0.01)
      .name('表皮层透明度')
      .onChange((value: number) => {
        eventBus.emit(EventType.LAYER_OPACITY_CHANGE, {
          layerId: 'epidermis',
          opacity: value,
        });
        if (epidermisLayer) {
          epidermisLayer.opacity = value;
        }
      });

    opacityFolder
      .add(this.params, 'cortexOpacity', 0, 1, 0.01)
      .name('皮层透明度')
      .onChange((value: number) => {
        eventBus.emit(EventType.LAYER_OPACITY_CHANGE, {
          layerId: 'cortex',
          opacity: value,
        });
        if (cortexLayer) {
          cortexLayer.opacity = value;
        }
      });

    opacityFolder
      .add(this.params, 'vascularOpacity', 0, 1, 0.01)
      .name('维管束透明度')
      .onChange((value: number) => {
        eventBus.emit(EventType.LAYER_OPACITY_CHANGE, {
          layerId: 'vascular',
          opacity: value,
        });
        if (vascularLayer) {
          vascularLayer.opacity = value;
        }
      });

    const rotationFolder = this.gui.addFolder('旋转控制');
    rotationFolder.open();

    rotationFolder
      .add(this.params, 'autoRotate')
      .name('自动旋转')
      .onChange((value: boolean) => {
        eventBus.emit(EventType.AUTO_ROTATE_TOGGLE, value);
      });

    rotationFolder
      .add(this.params, 'rotationSpeed', 0, 0.1, 0.001)
      .name('旋转速度')
      .onChange((value: number) => {
        eventBus.emit(EventType.ROTATION_SPEED_CHANGE, value);
      });

    const infoFolder = this.gui.addFolder('操作说明');
    infoFolder.add({ info: '键盘 1/2/3: 切换层级' }, 'info').name('快捷键').listen();
    infoFolder.add({ info: '鼠标拖拽: 调整视角' }, 'info').name('视角控制').listen();
    infoFolder.add({ info: '悬停维管束: 查看详情' }, 'info').name('悬停交互').listen();
  }

  private setupEventListeners(): void {
    document.addEventListener('keydown', this.boundHandleKeyDown);

    eventBus.on(EventType.LAYER_SWITCH, this.boundHandleLayerSwitchEvent);
    eventBus.on(EventType.VASCULAR_HOVER, this.boundHandleVascularHover);
    eventBus.on(EventType.VASCULAR_LEAVE, this.boundHandleVascularLeave);
  }

  private setupMobileControls(): void {
    if (this.mobileToggleBtn && this.guiContainer) {
      this.mobileToggleBtn.addEventListener('click', () => {
        this.guiContainer?.classList.toggle('open');
      });
    }

    if (this.closeBtn && this.guiContainer) {
      this.closeBtn.addEventListener('click', () => {
        this.guiContainer?.classList.remove('open');
      });
    }

    this.checkResponsiveLayout();
    window.addEventListener('resize', this.boundCheckResponsiveLayout);
  }

  private checkResponsiveLayout(): void {
    if (this.guiContainer) {
      if (window.innerWidth <= 768) {
        this.guiContainer.classList.remove('collapsed');
      } else {
        this.guiContainer.classList.remove('open');
      }
    }
  }

  private handleKeyDown(event: KeyboardEvent): void {
    if (event.key === '1') {
      this.handleLayerSwitch(1);
    } else if (event.key === '2') {
      this.handleLayerSwitch(2);
    } else if (event.key === '3') {
      this.handleLayerSwitch(3);
    }
  }

  private handleLayerSwitch(targetLayer: number): void {
    if (this.switchToLayer) {
      this.switchToLayer(targetLayer);
    } else {
      eventBus.emit(EventType.LAYER_RESTORE, targetLayer);
    }
  }

  private handleLayerSwitchEvent(data: unknown): void {
    const layerIndex = data as number;
    const layer = this.stemData.layers[layerIndex - 1];
    if (layer) {
      this.updateLayerInfo(layerIndex, layer.name);
      this.updateLayerVisibility(layerIndex);
    }
  }

  private updateLayerInfo(layerIndex: number, layerName: string): void {
    if (this.layerNumberEl) {
      this.layerNumberEl.textContent = layerIndex.toString();
    }
    if (this.layerNameEl) {
      this.layerNameEl.textContent = layerName;
    }
  }

  private updateLayerVisibility(currentLayer: number): void {
    this.params.showEpidermis = currentLayer <= 1;
    this.params.showCortex = currentLayer <= 2;
    this.params.showVascular = currentLayer <= 3;
  }

  private handleVascularHover(data: unknown): void {
    const bundle = data as VascularBundle;
    if (this.vascularTitleEl) {
      this.vascularTitleEl.textContent = `维管束 #${bundle.id}`;
    }
    if (this.vascularDetailEl) {
      this.vascularDetailEl.textContent = `位置：极角 ${bundle.angle.toFixed(0)}°，直径 ${bundle.width} 单位`;
    }
    if (this.vascularInfoPanel) {
      this.vascularInfoPanel.classList.add('visible');
    }
  }

  private handleVascularLeave(): void {
    if (this.vascularInfoPanel) {
      this.vascularInfoPanel.classList.remove('visible');
    }
  }

  private handleReset(): void {
    this.handleLayerSwitch(1);
    
    this.params.epidermisOpacity = this.stemData.layers[0]?.defaultOpacity || 0.3;
    this.params.cortexOpacity = this.stemData.layers[1]?.defaultOpacity || 0.4;
    this.params.vascularOpacity = this.stemData.layers[2]?.defaultOpacity || 1;
    this.params.autoRotate = true;
    this.params.rotationSpeed = 0.02;

    eventBus.emit(EventType.LAYER_OPACITY_CHANGE, {
      layerId: 'epidermis',
      opacity: this.params.epidermisOpacity,
    });
    eventBus.emit(EventType.LAYER_OPACITY_CHANGE, {
      layerId: 'cortex',
      opacity: this.params.cortexOpacity,
    });
    eventBus.emit(EventType.LAYER_OPACITY_CHANGE, {
      layerId: 'vascular',
      opacity: this.params.vascularOpacity,
    });
    eventBus.emit(EventType.AUTO_ROTATE_TOGGLE, this.params.autoRotate);
    eventBus.emit(EventType.ROTATION_SPEED_CHANGE, this.params.rotationSpeed);

    this.updateAllControllers();
  }

  public setLayerSwitcher(switcher: (layer: number) => void): void {
    this.switchToLayer = switcher;
  }

  private updateAllControllers(): void {
    const updateFolder = (folder: dat.GUI): void => {
      folder.__controllers.forEach((controller: dat.GUIController) => {
        controller.updateDisplay();
      });
      Object.values(folder.__folders).forEach((subFolder: dat.GUI) => {
        updateFolder(subFolder);
      });
    };
    updateFolder(this.gui);
  }

  public updateAutoRotateDisplay(autoRotate: boolean): void {
    if (this.params.autoRotate !== autoRotate) {
      this.params.autoRotate = autoRotate;
      const findAndUpdate = (folder: dat.GUI): void => {
        for (const controller of folder.__controllers) {
          if (controller.property === 'autoRotate') {
            controller.updateDisplay();
            return;
          }
        }
        for (const subFolder of Object.values(folder.__folders)) {
          findAndUpdate(subFolder);
        }
      };
      findAndUpdate(this.gui);
    }
  }

  public dispose(): void {
    document.removeEventListener('keydown', this.boundHandleKeyDown);
    window.removeEventListener('resize', this.boundCheckResponsiveLayout);
    eventBus.off(EventType.LAYER_SWITCH, this.boundHandleLayerSwitchEvent);
    eventBus.off(EventType.VASCULAR_HOVER, this.boundHandleVascularHover);
    eventBus.off(EventType.VASCULAR_LEAVE, this.boundHandleVascularLeave);
    this.gui.destroy();
  }
}
