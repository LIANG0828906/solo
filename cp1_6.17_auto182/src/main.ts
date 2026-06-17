import * as THREE from 'three';
import { StarMapManager } from './StarMapManager';
import { SceneRenderer } from './SceneRenderer';
import { UIHandler } from './UIHandler';

class TrajectoryStarMapApp {
  private manager: StarMapManager;
  private renderer: SceneRenderer;
  private ui: UIHandler;
  private sceneContainer: HTMLElement;

  constructor(app: HTMLElement) {
    this.manager = new StarMapManager();

    this.ui = new UIHandler(app, this.manager, {
      onNewCanvas: () => this.handleNewCanvas(),
      onUndo: () => this.handleUndo(),
      onExport: () => this.handleExport(),
      onDeleteStar: (id) => this.handleDeleteStar(id),
      onChangeColor: (id, color) => this.handleChangeColor(id, color),
      onToggleLock: (id) => this.handleToggleLock(id),
      onConnectionMode: (id) => this.handleConnectionMode(id),
    });

    this.sceneContainer = this.ui.getSceneContainer();

    this.renderer = new SceneRenderer(this.sceneContainer, this.manager);
    this.bindSceneEvents();

    this.manager.subscribe(() => {
      this.renderer.refreshAll();
    });

    this.renderer.start();
  }

  private bindSceneEvents(): void {
    this.renderer.onPlaceStar = (position: THREE.Vector3) => {
      this.ui.hideAllOverlays();
      const star = this.manager.placeStar(
        { x: position.x, y: position.y, z: position.z },
        '#FFFFFF',
      );
      this.renderer.spawnRipple(position.clone());
      this.manager.selectStar(star.id);
    };

    this.renderer.onStarClick = (id: string, event: MouseEvent) => {
      this.manager.selectStar(id);
      this.ui.showRadialMenu(id, event.clientX, event.clientY);
      if (this.manager.getFirstConnectionId() !== null && this.manager.getFirstConnectionId() !== id) {
        this.manager.toggleConnectionSelect(id);
        this.ui.hideAllOverlays();
      }
    };

    this.renderer.onStarDragStart = (id: string) => {
      this.ui.hideAllOverlays();
      this.manager.selectStar(id);
    };

    this.renderer.onStarDragMove = (id: string, position: THREE.Vector3) => {
      this.manager.moveStar(id, { x: position.x, y: position.y, z: position.z });
    };

    this.renderer.onStarDragEnd = (_id: string) => {
      this.manager.commitMove();
    };

    this.renderer.onEmptyClick = () => {
      this.ui.hideAllOverlays();
      this.manager.selectStar(null);
      this.manager.cancelConnectionSelect();
    };

    this.renderer.onSceneContextMenu = () => {
      this.ui.hideAllOverlays();
      this.manager.selectStar(null);
      this.manager.cancelConnectionSelect();
    };
  }

  private async handleNewCanvas(): Promise<void> {
    this.ui.hideAllOverlays();
    await this.renderer.fadeOut(450);
    this.manager.clear();
  }

  private handleUndo(): void {
    this.ui.hideAllOverlays();
    this.manager.undo();
  }

  private handleExport(): void {
    const renderer = this.renderer.getRenderer();
    const canvas = renderer.domElement;
    try {
      const url = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      const now = new Date();
      const pad = (n: number) => String(n).padStart(2, '0');
      const ts = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
      a.href = url;
      a.download = `constellation-${ts}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (e) {
      console.error('Export failed:', e);
    }
  }

  private handleDeleteStar(id: string): void {
    this.manager.deleteStar(id);
  }

  private handleChangeColor(id: string, color: string): void {
    this.manager.setStarColor(id, color);
  }

  private handleToggleLock(id: string): void {
    this.manager.toggleStarLock(id);
  }

  private handleConnectionMode(id: string): void {
    const connected = this.manager.toggleConnectionSelect(id);
    if (connected) {
      this.ui.hideAllOverlays();
    }
  }

  public dispose(): void {
    this.renderer.dispose();
    this.ui.destroy();
  }
}

function bootstrap(): void {
  const app = document.getElementById('app');
  if (!app) {
    console.error('#app element not found');
    return;
  }
  (window as any).__starmap = new TrajectoryStarMapApp(app);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrap);
} else {
  bootstrap();
}
