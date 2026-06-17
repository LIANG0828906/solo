import { TerrainGenerator, TerrainData } from './terrain';
import { SceneRenderer } from './renderer';
import { GUIControls, ControlListeners } from './controls';

const MAX_HEIGHT = 5;
const MIN_HEIGHT = -3;
const EDIT_RADIUS = 2;
const EDIT_DELTA = 0.5;

class App {
  private terrain: TerrainGenerator;
  private renderer: SceneRenderer;
  private controls: GUIControls;
  private heightLabel: HTMLElement;
  private hoverTimeoutId: number | null;
  private isLabelVisible: boolean;

  constructor() {
    const app = document.getElementById('app');
    const guiContainer = document.getElementById('gui-container');
    const label = document.getElementById('height-label');

    if (!app || !guiContainer || !label) {
      throw new Error('Required DOM nodes not found');
    }
    this.heightLabel = label;
    this.hoverTimeoutId = null;
    this.isLabelVisible = false;

    this.terrain = new TerrainGenerator();
    this.renderer = new SceneRenderer(app);

    const initialParams = this.terrain.getParams();
    const listeners: ControlListeners = {
      onResolutionChange: (v) => this.handleResolutionChange(v),
      onAmplitudeChange: (v) => this.handleAmplitudeChange(v),
      onStartColorChange: (v) => this.handleStartColorChange(v),
      onEndColorChange: (v) => this.handleEndColorChange(v),
      onReset: () => this.handleReset()
    };
    this.controls = new GUIControls(
      guiContainer,
      listeners,
      {
        resolution: initialParams.resolution,
        amplitude: initialParams.amplitude,
        startColor: initialParams.startColor,
        endColor: initialParams.endColor
      }
    );

    this.initTerrain();
    this.bindPointerEvents();
  }

  private initTerrain(): void {
    const data = this.terrain.regenerate();
    this.applyDataToRenderer(data, true);
  }

  private applyDataToRenderer(data: TerrainData, rebuild: boolean): void {
    if (rebuild) {
      this.renderer.setPointCloud(data.positions, data.colors, data.count);
    } else {
      this.renderer.updatePositionsAndColors(data.positions, data.colors);
    }
  }

  private handleResolutionChange(value: number): void {
    const data = this.terrain.setResolution(value);
    this.applyDataToRenderer(data, true);
  }

  private handleAmplitudeChange(value: number): void {
    const data = this.terrain.setAmplitude(value);
    this.applyDataToRenderer(data, false);
  }

  private handleStartColorChange(value: string): void {
    const data = this.terrain.setStartColor(value);
    this.renderer.updateColorsOnly(data.colors);
  }

  private handleEndColorChange(value: string): void {
    const data = this.terrain.setEndColor(value);
    this.renderer.updateColorsOnly(data.colors);
  }

  private handleReset(): void {
    const data = this.terrain.reset();
    this.applyDataToRenderer(data, true);
  }

  private bindPointerEvents(): void {
    const canvas = this.renderer.getDomElement();

    canvas.addEventListener('pointermove', (e) => {
      if (e.buttons === 0) {
        this.handleHover(e.clientX, e.clientY);
      }
    });

    canvas.addEventListener('pointerdown', (e) => {
      if (e.button !== 0) return;
      if (e.shiftKey || e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const delta = e.shiftKey ? EDIT_DELTA : -EDIT_DELTA;
        this.handleEdit(e.clientX, e.clientY, delta);
      }
    });

    canvas.addEventListener('pointerleave', () => {
      this.hideLabel();
    });
  }

  private handleHover(clientX: number, clientY: number): void {
    const pick = this.renderer.pickFromPointer(clientX, clientY);
    if (pick) {
      this.showLabel(pick.height);
      if (this.hoverTimeoutId !== null) {
        window.clearTimeout(this.hoverTimeoutId);
      }
      this.hoverTimeoutId = window.setTimeout(() => {
        this.hideLabel();
        this.hoverTimeoutId = null;
      }, 1500);
    } else {
      this.hideLabel();
    }
  }

  private handleEdit(clientX: number, clientY: number, delta: number): void {
    const pick = this.renderer.pickFromPointer(clientX, clientY);
    if (!pick) return;
    const result = this.terrain.editHeight(
      pick.point.x,
      pick.point.z,
      EDIT_RADIUS,
      delta,
      MIN_HEIGHT,
      MAX_HEIGHT
    );
    if (result.updated) {
      const data = this.terrain.getData();
      this.renderer.updatePositionsAndColors(data.positions, data.colors);
      this.showLabel(pick.height + delta);
    }
  }

  private showLabel(height: number): void {
    const eps = 0.001;
    let text: string;
    if (Math.abs(height) < eps) {
      text = 'Height: 0.00';
    } else if (height > 0) {
      text = `Height: +${height.toFixed(2)}`;
    } else {
      text = `Height: -${Math.abs(height).toFixed(2)}`;
    }
    this.heightLabel.textContent = text;
    if (!this.isLabelVisible) {
      this.heightLabel.style.display = 'block';
      this.isLabelVisible = true;
    }
  }

  private hideLabel(): void {
    if (this.isLabelVisible) {
      this.heightLabel.style.display = 'none';
      this.isLabelVisible = false;
    }
  }
}

window.addEventListener('DOMContentLoaded', () => {
  try {
    (window as unknown as { __app?: App }).__app = new App();
  } catch (e) {
    console.error(e);
  }
});
