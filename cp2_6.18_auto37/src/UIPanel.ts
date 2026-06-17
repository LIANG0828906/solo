import GUI from 'lil-gui';
import { eventBus } from './EventBus';

interface UIParams {
  lightX: number;
  lightY: number;
  lightZ: number;
  obstacleX: number;
  obstacleY: number;
  obstacleZ: number;
  rayCount: number;
  bounceCount: number;
  rayOpacity: number;
}

class UIPanel {
  private gui: GUI;
  private params: UIParams;

  constructor(container?: HTMLElement) {
    this.params = {
      lightX: 5,
      lightY: 8,
      lightZ: 5,
      obstacleX: 0,
      obstacleY: 0,
      obstacleZ: 0,
      rayCount: 8,
      bounceCount: 1,
      rayOpacity: 0.7,
    };

    this.gui = new GUI({
      title: '光线参数控制',
      container: container || undefined,
      width: 280,
    });

    this.setupStyles();
    this.setupControls();
    this.setupEventListeners();

    this.gui.close();
  }

  private setupStyles(): void {
    const style = document.createElement('style');
    style.textContent = `
      .lil-gui {
        --background-color: #1A1A2EB0;
        --widget-color: #2A2A4E;
        --focus-color: #3A3A6E;
        --hover-color: #30305A;
        --number-color: #FFAA00;
        --string-color: #E0E0E0;
        --font-family: 'Fira Code', monospace;
        --font-size: 12px;
        --title-font-size: 13px;
        border-radius: 8px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
        backdrop-filter: blur(10px);
        position: absolute;
        top: 20px;
        left: 20px;
        z-index: 1000;
      }
      .lil-gui .title {
        border-radius: 8px 8px 0 0;
        background-color: rgba(26, 26, 46, 0.95);
      }
      .lil-gui.closed .title {
        border-radius: 8px;
      }
      .lil-gui .controller {
        border-left: 2px solid transparent;
        transition: border-color 0.2s;
      }
      .lil-gui .controller:hover {
        border-left-color: #FFAA00;
      }
      .lil-gui .slider {
        background: #2A2A4E;
      }
      .lil-gui .slider .fill {
        background: linear-gradient(90deg, #FFAA00, #FFCC44);
      }
      .lil-gui .widget input[type="range"] {
        accent-color: #FFAA00;
      }
    `;
    document.head.appendChild(style);
  }

  private setupControls(): void {
    const lightFolder = this.gui.addFolder('光源位置');
    lightFolder.add(this.params, 'lightX', -10, 10, 0.5)
      .name('光源 X')
      .onChange((value: number) => {
        eventBus.emit('lightPositionChanged', value, this.params.lightY, this.params.lightZ);
      });
    lightFolder.add(this.params, 'lightY', 1, 15, 0.5)
      .name('光源 Y')
      .onChange((value: number) => {
        eventBus.emit('lightPositionChanged', this.params.lightX, value, this.params.lightZ);
      });
    lightFolder.add(this.params, 'lightZ', -10, 10, 0.5)
      .name('光源 Z')
      .onChange((value: number) => {
        eventBus.emit('lightPositionChanged', this.params.lightX, this.params.lightY, value);
      });

    const obstacleFolder = this.gui.addFolder('障碍物位置');
    obstacleFolder.add(this.params, 'obstacleX', -5, 5, 0.5)
      .name('障碍物 X')
      .onChange((value: number) => {
        eventBus.emit('obstaclePositionChanged', value, this.params.obstacleY, this.params.obstacleZ);
      });
    obstacleFolder.add(this.params, 'obstacleY', -5, 5, 0.5)
      .name('障碍物 Y')
      .onChange((value: number) => {
        eventBus.emit('obstaclePositionChanged', this.params.obstacleX, value, this.params.obstacleZ);
      });
    obstacleFolder.add(this.params, 'obstacleZ', -5, 5, 0.5)
      .name('障碍物 Z')
      .onChange((value: number) => {
        eventBus.emit('obstaclePositionChanged', this.params.obstacleX, this.params.obstacleY, value);
      });

    const rayFolder = this.gui.addFolder('光线参数');
    rayFolder.add(this.params, 'rayCount', 4, 16, 4)
      .name('主光线数量')
      .onChange((value: number) => {
        eventBus.emit('rayCountChanged', value);
      });
    rayFolder.add(this.params, 'bounceCount', 0, 3, 1)
      .name('反射次数')
      .onChange((value: number) => {
        eventBus.emit('bounceCountChanged', value);
      });
    rayFolder.add(this.params, 'rayOpacity', 0.1, 1.0, 0.05)
      .name('光线透明度')
      .onChange((value: number) => {
        eventBus.emit('rayOpacityChanged', value);
      });
  }

  private setupEventListeners(): void {
    eventBus.on('lightPositionChanged', (x: number, y: number, z: number) => {
      this.params.lightX = x;
      this.params.lightY = y;
      this.params.lightZ = z;
      this.updateControllers();
    });

    eventBus.on('obstaclePositionChanged', (x: number, y: number, z: number) => {
      this.params.obstacleX = x;
      this.params.obstacleY = y;
      this.params.obstacleZ = z;
      this.updateControllers();
    });
  }

  private updateControllers(): void {
    this.gui.controllersRecursive().forEach((controller) => {
      controller.updateDisplay();
    });
  }

  getParams(): UIParams {
    return { ...this.params };
  }
}

export default UIPanel;
