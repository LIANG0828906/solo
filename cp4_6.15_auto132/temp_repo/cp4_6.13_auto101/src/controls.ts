import { SceneManager, LightConfig, ViewMode } from './scene';
import { UIManager } from './ui';

export class ControlManager {
  private sceneManager: SceneManager;
  private uiManager: UIManager;
  private isUpdatingFromScene: boolean = false;

  constructor(sceneManager: SceneManager) {
    this.sceneManager = sceneManager;

    this.uiManager = new UIManager({
      onLightChange: this.handleLightChange.bind(this),
      onPresetChange: this.handlePresetChange.bind(this),
      onViewChange: this.handleViewChange.bind(this)
    });

    window.addEventListener('lightchange', (e) => {
      const event = e as CustomEvent<LightConfig>;
      this.isUpdatingFromScene = true;
      this.uiManager.updateLightConfig(event.detail);
      this.isUpdatingFromScene = false;
    });

    this.sceneManager.setFpsCallback((fps) => {
      this.uiManager.setFps(fps);
    });

    this.uiManager.setActivePreset('warmDusk');
    this.uiManager.setActiveView('top');
  }

  private handleLightChange(config: Partial<LightConfig>): void {
    if (this.isUpdatingFromScene) return;

    const current = this.sceneManager.getLightConfig();
    const updated = { ...current, ...config };

    if (config.x !== undefined || config.y !== undefined || config.z !== undefined) {
      this.sceneManager.setLightPosition(
        updated.x,
        updated.y,
        updated.z
      );
    }

    if (config.color !== undefined) {
      this.sceneManager.setLightColor(config.color);
    }

    if (config.intensity !== undefined) {
      this.sceneManager.setLightIntensity(config.intensity);
    }

    this.clearPresetActive();
  }

  private handlePresetChange(presetKey: string): void {
    this.sceneManager.applyPreset(presetKey);
    const config = this.sceneManager.getLightConfig();

    this.isUpdatingFromScene = true;
    this.uiManager.updateLightConfig(config);
    this.uiManager.setActivePreset(presetKey);
    this.isUpdatingFromScene = false;
  }

  private handleViewChange(mode: ViewMode): void {
    this.sceneManager.setViewMode(mode);
    this.uiManager.setActiveView(mode);
  }

  private clearPresetActive(): void {
    this.uiManager.setActivePreset('');
  }
}
