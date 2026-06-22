import { Renderer } from './renderer/Renderer';
import { CoralManager } from './coral/CoralManager';
import { EnvironmentController } from './environment/EnvironmentController';
import { useStore, CoralSpeciesType } from './store/useStore';
import GUI from 'lil-gui';

class App {
  private renderer: Renderer;
  private coralManager: CoralManager;
  private environmentController: EnvironmentController;
  private gui: GUI;

  constructor() {
    const container = document.getElementById('app')!;

    this.renderer = new Renderer(container);
    this.environmentController = new EnvironmentController(this.renderer.getScene());

    const seaFloor = this.environmentController.getSeaFloor();
    if (!seaFloor) {
      throw new Error('Sea floor not created');
    }

    this.coralManager = new CoralManager(
      this.renderer.getScene(),
      this.renderer.getCamera(),
      seaFloor
    );

    this.renderer.setCoralManager(this.coralManager);
    this.renderer.setEnvironmentController(this.environmentController);

    this.gui = this.createGUI();

    this.addInitialCorals();

    this.renderer.start();

    console.log('珊瑚礁生态系统模拟器已启动');
  }

  private createGUI(): GUI {
    const gui = new GUI({ title: '环境控制面板' });
    gui.domElement.style.position = 'fixed';
    gui.domElement.style.top = '20px';
    gui.domElement.style.right = '20px';
    gui.domElement.style.zIndex = '1000';

    const envFolder = gui.addFolder('环境参数');
    envFolder.open();

    const envParams = {
      洋流强度: useStore.getState().environment.currentStrength,
      水温: useStore.getState().environment.waterTemperature,
      光照强度: useStore.getState().environment.lightIntensity,
    };

    envFolder.add(envParams, '洋流强度', 0, 2, 0.1)
      .onChange((value: number) => {
        useStore.getState().setEnvironment({ currentStrength: value });
      })
      .name('洋流强度');

    envFolder.add(envParams, '水温', 20, 30, 0.5)
      .onChange((value: number) => {
        useStore.getState().setEnvironment({ waterTemperature: value });
        this.updateTemperatureWarning(value);
      })
      .name('水温 (°C)');

    envFolder.add(envParams, '光照强度', 0, 2, 0.1)
      .onChange((value: number) => {
        useStore.getState().setEnvironment({ lightIntensity: value });
      })
      .name('光照强度');

    const coralFolder = gui.addFolder('珊瑚管理');
    coralFolder.open();

    const coralParams = {
      珊瑚品种: 'acropora' as CoralSpeciesType,
      放置模式: false,
      珊瑚数量: 0,
    };

    coralFolder.add(coralParams, '珊瑚品种', {
      '鹿角珊瑚': 'acropora',
      '针叶珊瑚': 'pocillopora',
      '叶片珊瑚': 'montipora',
    })
      .onChange((value: CoralSpeciesType) => {
        useStore.getState().setSelectedSpecies(value);
      })
      .name('选择品种');

    coralFolder.add(coralParams, '放置模式')
      .onChange((value: boolean) => {
        useStore.getState().setPlacementMode(value);
        this.updateCursor(value);
      })
      .name('点击放置珊瑚');

    const statsFolder = gui.addFolder('状态监控');
    statsFolder.open();

    const statsParams = {
      珊瑚总数: 0,
      FPS: 60,
      白化警告: '正常',
    };

    const coralCountController = statsFolder.add(statsParams, '珊瑚总数')
      .name('珊瑚总数');

    const fpsController = statsFolder.add(statsParams, 'FPS')
      .name('FPS');

    const warningController = statsFolder.add(statsParams, '白化警告')
      .name('白化警告');

    let frameCount = 0;
    let lastTime = performance.now();
    let fpsDisplay = 60;
    let updateCount = 0;

    const updateStats = () => {
      frameCount++;
      updateCount++;
      const now = performance.now();
      
      if (now - lastTime >= 500) {
        fpsDisplay = Math.round(frameCount * 1000 / (now - lastTime));
        console.log('FPS update:', fpsDisplay, 'updateCount:', updateCount);
        fpsController.setValue(fpsDisplay);
        frameCount = 0;
        lastTime = now;
      }

      const coralCount = this.coralManager.getCoralCount();
      coralCountController.setValue(coralCount);

      const waterTemp = useStore.getState().environment.waterTemperature;
      const warningText = waterTemp > 28 ? '警告' : '正常';
      warningController.setValue(warningText);

      requestAnimationFrame(updateStats);
    };
    
    updateStats();

    return gui;
  }

  private updateTemperatureWarning(temp: number): void {
    const warningEl = document.querySelector('.warning-indicator');
    if (temp > 28) {
      if (!warningEl) {
        const warning = document.createElement('div');
        warning.className = 'warning-indicator';
        warning.style.cssText = `
          position: fixed;
          top: 80px;
          left: 50%;
          transform: translateX(-50%);
          background: rgba(255, 100, 100, 0.9);
          color: white;
          padding: 10px 20px;
          border-radius: 8px;
          font-family: sans-serif;
          font-size: 14px;
          z-index: 1001;
          animation: pulse 1s infinite;
        `;
        warning.textContent = '⚠️ 水温过高！珊瑚白化风险警告';
        
        const style = document.createElement('style');
        style.textContent = `
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.7; }
          }
        `;
        document.head.appendChild(style);
        document.body.appendChild(warning);
      }
    } else {
      if (warningEl) {
        warningEl.remove();
      }
    }
  }

  private updateCursor(placementMode: boolean): void {
    document.body.style.cursor = placementMode ? 'crosshair' : 'default';
  }

  private addInitialCorals(): void {
    const speciesList: CoralSpeciesType[] = ['acropora', 'pocillopora', 'montipora'];
    
    for (let i = 0; i < 3; i++) {
      const species = speciesList[i];
      const angle = (i / 3) * Math.PI * 2 + Math.random() * 0.3;
      const distance = 8 + Math.random() * 5;
      const x = Math.cos(angle) * distance;
      const z = Math.sin(angle) * distance;
      
      this.coralManager.createCoralColony(species, x, z, 60);
    }

    for (let i = 0; i < 6; i++) {
      const species = speciesList[Math.floor(Math.random() * 3)];
      const angle = Math.random() * Math.PI * 2;
      const distance = 15 + Math.random() * 15;
      const x = Math.cos(angle) * distance;
      const z = Math.sin(angle) * distance;
      
      this.coralManager.createCoralColony(species, x, z, 30);
    }
  }

  public dispose(): void {
    this.renderer.dispose();
    this.coralManager.dispose();
    this.environmentController.dispose();
    this.gui.destroy();
  }
}

window.addEventListener('DOMContentLoaded', () => {
  const app = new App();
  
  window.addEventListener('beforeunload', () => {
    app.dispose();
  });
});
