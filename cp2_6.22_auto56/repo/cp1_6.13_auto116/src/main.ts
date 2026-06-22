import { LightEngine } from './lightEngine';
import { UIController, BgPreset } from './uiController';
import { EffectType } from './effects';

class PulseFrameApp {
  private lightEngine!: LightEngine;
  private uiController!: UIController;

  constructor() {
    this.init();
  }

  private init(): void {
    const canvas = document.getElementById('paintCanvas') as HTMLCanvasElement | null;

    if (!canvas) {
      console.error('找不到画布元素 paintCanvas');
      return;
    }

    try {
      this.lightEngine = new LightEngine(canvas, {
        onBgUpdate: this.handleBgUpdate.bind(this)
      });
    } catch (err) {
      console.error('光绘引擎初始化失败:', err);
      return;
    }

    try {
      this.uiController = new UIController({
        onEffectChange: this.handleEffectChange.bind(this),
        onColorChange: this.handleColorChange.bind(this),
        onBgChange: this.handleBgChange.bind(this),
        onClear: this.handleClear.bind(this),
        onSave: this.handleSave.bind(this)
      });
    } catch (err) {
      console.error('UI控制器初始化失败:', err);
      return;
    }

    const initialColor = this.uiController.getCurrentColor();
    this.lightEngine.setColor(initialColor);

    this.lightEngine.setBgPreset('night');

    console.log('[PulseFrame] 应用初始化完成');
    console.log('[PulseFrame] 提示：在画布上按住鼠标或触摸拖动即可开始光绘');
  }

  private handleEffectChange(effect: EffectType): void {
    this.lightEngine.setEffect(effect);
    console.log(`[PulseFrame] 切换效果: ${effect}`);
  }

  private handleColorChange(color: string): void {
    this.lightEngine.setColor(color);
  }

  private handleBgChange(preset: BgPreset): void {
    this.lightEngine.setBgPreset(preset);
    console.log(`[PulseFrame] 切换背景: ${preset}`);
  }

  private handleBgUpdate(gradientCss: string): void {
    if (this.uiController) {
      this.uiController.setCanvasWrapperBg(gradientCss);
    }
  }

  private handleClear(): void {
    this.lightEngine.clear();
    console.log('[PulseFrame] 画布已清空');
  }

  private handleSave(): void {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const filename = `pulseframe-${timestamp}.png`;
    this.lightEngine.saveAsPNG(filename);
    console.log(`[PulseFrame] 作品已保存: ${filename}`);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new PulseFrameApp();
});
