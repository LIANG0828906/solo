import { ParticleClusterGenerator, ClusterInfo } from './ParticleClusterGenerator';
import { SceneRenderer } from './SceneRenderer';
import { UIController } from './UIController';

class App {
  private particleGenerator!: ParticleClusterGenerator;
  private sceneRenderer!: SceneRenderer;
  private uiController!: UIController;

  private canvasContainer!: HTMLElement;
  private uiContainer!: HTMLElement;

  private clusters: ClusterInfo[] = [];

  constructor() {
    this.init();
  }

  private init(): void {
    this.canvasContainer = document.getElementById('canvas-container')!;
    this.uiContainer = document.getElementById('ui-container')!;

    if (!this.canvasContainer || !this.uiContainer) {
      console.error('Container elements not found');
      return;
    }

    this.generateParticles();
    this.setupScene();
    this.setupUI();
    this.setupEventListeners();
  }

  private generateParticles(): void {
    this.particleGenerator = new ParticleClusterGenerator(15000, 6, 50);
  }

  private setupScene(): void {
    const { particles, clusters } = this.particleGenerator.generate();
    this.clusters = clusters;

    this.sceneRenderer = new SceneRenderer({
      container: this.canvasContainer,
      particles,
      clusters
    });
  }

  private setupUI(): void {
    this.uiController = new UIController({
      container: this.uiContainer,
      clusters: this.clusters
    });
  }

  private setupEventListeners(): void {
    this.sceneRenderer.onParticleClick((clusterId) => {
      this.handleParticleClick(clusterId);
    });

    this.uiController.onClusterSelect((clusterId) => {
      this.handleClusterSelect(clusterId);
    });

    this.uiController.onSearch((query) => {
      this.handleSearch(query);
    });

    document.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      const isPanelClick = target.closest('#ui-container > div:first-child');
      const isCardClick = target.closest('[style*="width: 220px"]');

      if (!isPanelClick && !isCardClick) {
        this.uiController.hideInfoCard();
        this.uiController.setActiveCluster(null);
        this.sceneRenderer.highlightCluster(null);
      }
    });
  }

  private handleParticleClick(clusterId: number): void {
    const cluster = this.clusters.find(c => c.id === clusterId);
    if (!cluster) return;

    const center = this.sceneRenderer.getClusterCenter(clusterId);
    if (!center) return;

    const screenPos = this.sceneRenderer.projectToScreen(center);

    this.uiController.showInfoCard(cluster, screenPos.x, screenPos.y);
    this.uiController.setActiveCluster(clusterId);
    this.sceneRenderer.highlightCluster(clusterId);
  }

  private handleClusterSelect(clusterId: number): void {
    this.sceneRenderer.flyToCluster(clusterId);
    this.sceneRenderer.highlightCluster(clusterId);
    this.uiController.setActiveCluster(clusterId);

    const cluster = this.clusters.find(c => c.id === clusterId);
    if (cluster) {
      setTimeout(() => {
        const center = this.sceneRenderer.getClusterCenter(clusterId);
        if (center) {
          const screenPos = this.sceneRenderer.projectToScreen(center);
          this.uiController.showInfoCard(cluster, screenPos.x, screenPos.y);
        }
      }, 1500);
    }
  }

  private handleSearch(query: string): void {
    if (!query) {
      this.sceneRenderer.highlightCluster(null);
      return;
    }

    const matchedCluster = this.clusters.find(c =>
      c.name.toLowerCase().includes(query.toLowerCase())
    );

    if (matchedCluster) {
      this.sceneRenderer.highlightCluster(matchedCluster.id);
    } else {
      this.sceneRenderer.highlightCluster(null);
    }
  }

  public dispose(): void {
    this.sceneRenderer.dispose();
    this.uiController.dispose();
  }
}

let app: App | null = null;

window.addEventListener('DOMContentLoaded', () => {
  app = new App();
});

window.addEventListener('beforeunload', () => {
  if (app) {
    app.dispose();
  }
});
