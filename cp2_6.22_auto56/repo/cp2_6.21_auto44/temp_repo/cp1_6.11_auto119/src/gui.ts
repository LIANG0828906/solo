import * as dat from 'dat.gui';
import { NebulaSystem, NebulaParams } from './nebula';

export class GUIController {
  private gui: dat.GUI;
  private nebula: NebulaSystem;
  private params: NebulaParams;

  constructor(nebula: NebulaSystem) {
    this.nebula = nebula;
    this.params = {
      density: 1.0,
      rotationSpeed: 0.01,
      colorOffset: 0
    };

    this.gui = new dat.GUI({
      autoPlace: true,
      width: 280
    });

    this.gui.domElement.style.position = 'absolute';
    this.gui.domElement.style.top = '10px';
    this.gui.domElement.style.left = '10px';
    this.gui.domElement.style.fontFamily = "'Helvetica Neue', Helvetica, Arial, sans-serif";

    this.setupControls();
  }

  private setupControls(): void {
    const folder = this.gui.addFolder('Nebula Controls');
    folder.open();

    folder
      .add(this.params, 'density', 0.5, 2.0, 0.1)
      .name('Particle Density')
      .onChange((value: number) => {
        this.nebula.updateParams({ density: value });
      });

    folder
      .add(this.params, 'rotationSpeed', 0, 0.05, 0.001)
      .name('Rotation Speed')
      .onChange((value: number) => {
        this.nebula.updateParams({ rotationSpeed: value });
      });

    folder
      .add(this.params, 'colorOffset', -1, 1, 0.1)
      .name('Color Gradient Offset')
      .onChange((value: number) => {
        this.nebula.updateParams({ colorOffset: value });
      });
  }

  public getParams(): NebulaParams {
    return { ...this.params };
  }
}
