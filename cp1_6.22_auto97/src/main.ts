import { PreviewManager } from './preview';
import { PanelManager } from './panel';
import { getFirstEffect } from './effects';

class App {
  private preview: PreviewManager;
  private panel: PanelManager;

  constructor() {
    this.preview = new PreviewManager('preview-element');

    this.panel = new PanelManager({
      onEffectSelect: (effect) => {
        this.preview.applyEffect(effect);
      },
      onCodeChange: (code) => {
        this.preview.applyCustomCSS(code);
      },
      onCopy: () => {
      }
    });

    this.init();
  }

  private init(): void {
    const firstEffect = getFirstEffect();

    this.panel.setActiveEffect(firstEffect.id);
    this.panel.setCode(firstEffect.codeTemplate);
    this.preview.applyEffect(firstEffect);

    this.panel.validateCSS();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new App();
});
