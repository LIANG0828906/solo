import GUI from 'lil-gui';

export interface ControlParams {
  resolution: number;
  amplitude: number;
  startColor: string;
  endColor: string;
}

export interface ControlListeners {
  onResolutionChange: (value: number) => void;
  onAmplitudeChange: (value: number) => void;
  onStartColorChange: (value: string) => void;
  onEndColorChange: (value: string) => void;
  onReset: () => void;
}

export class GUIControls {
  private gui: GUI;
  private params: ControlParams;
  private listeners: ControlListeners;

  constructor(container: HTMLElement, listeners: ControlListeners, initial: ControlParams) {
    this.listeners = listeners;
    this.params = { ...initial };
    this.gui = new GUI({ container, title: 'DepthCanvas', autoPlace: false });
    this.build();
  }

  private build(): void {
    const resolutionCtrl = this.gui
      .add(this.params, 'resolution', 10, 50, 5)
      .name('Resolution')
      .onChange((v: number) => {
        this.listeners.onResolutionChange(v);
      });

    resolutionCtrl.domElement.addEventListener('wheel', (e: Event) => {
      e.stopPropagation();
    });

    this.gui
      .add(this.params, 'amplitude', 0, 5, 0.1)
      .name('Height Amplitude')
      .onChange((v: number) => {
        this.listeners.onAmplitudeChange(v);
      });

    this.gui
      .addColor(this.params, 'startColor')
      .name('Gradient Start')
      .onChange((v: string | number) => {
        const color = typeof v === 'number' ? '#' + v.toString(16).padStart(6, '0') : v;
        this.listeners.onStartColorChange(color);
      });

    this.gui
      .addColor(this.params, 'endColor')
      .name('Gradient End')
      .onChange((v: string | number) => {
        const color = typeof v === 'number' ? '#' + v.toString(16).padStart(6, '0') : v;
        this.listeners.onEndColorChange(color);
      });

    this.gui
      .add(
        {
          reset: () => {
            const defaults = {
              resolution: 30,
              amplitude: 3,
              startColor: '#0A0A3A',
              endColor: '#FFFFFF'
            };
            this.params.resolution = defaults.resolution;
            this.params.amplitude = defaults.amplitude;
            this.params.startColor = defaults.startColor;
            this.params.endColor = defaults.endColor;
            this.gui.controllersRecursive().forEach((c) => c.updateDisplay());
            this.listeners.onReset();
          }
        },
        'reset'
      )
      .name('Reset Terrain');
  }

  setResolution(v: number): void {
    this.params.resolution = v;
  }

  setAmplitude(v: number): void {
    this.params.amplitude = v;
  }

  dispose(): void {
    this.gui.destroy();
  }
}
