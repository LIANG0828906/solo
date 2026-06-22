import { ComboEditor } from './editor';
import { CanvasRenderer } from './renderer';

class App {
  private editor: ComboEditor;
  private renderer: CanvasRenderer;

  constructor() {
    this.editor = new ComboEditor();
    this.renderer = new CanvasRenderer();

    this.editor.onChange((skills) => {
      this.renderer.setSkills(skills);
    });

    this.renderer.setSkills(this.editor.getSkills());
  }
}

const app = new App();

declare global {
  interface Window {
    app: App;
  }
}

window.app = app;
