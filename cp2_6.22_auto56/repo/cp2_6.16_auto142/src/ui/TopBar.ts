import { useMaterialStore } from '../stores/useMaterialStore';
import { SceneManager } from '../scene/SceneManager';

export class TopBar {
  private container: HTMLElement;
  private sceneManager: SceneManager;
  private searchTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(sceneManager: SceneManager) {
    this.container = document.getElementById('topbar') as HTMLElement;
    this.sceneManager = sceneManager;
    this.render();
    this.setupSubscriptions();
  }

  private setupSubscriptions(): void {
    useMaterialStore.subscribe(
      (state) => state.currentMaterial,
      () => this.updateMaterialName()
    );
  }

  private render(): void {
    const state = useMaterialStore.getState();
    const material = state.materials[state.currentMaterial];

    this.container.innerHTML = `
      <div class="topbar-left">
        <div class="logo">
          <div class="logo-icon">⚛</div>
          <span>NanoLens</span>
        </div>
        <div class="current-material" id="current-material-name">
          ${material.displayName} · ${material.category}
        </div>
      </div>

      <div class="topbar-center">
        <div class="search-box">
          <span class="search-icon">🔍</span>
          <input type="text" id="search-input" 
            placeholder="搜索材料或元素（如：碳纳米管、石墨烯、C、Si）..." 
            autocomplete="off">
        </div>
      </div>

      <div class="topbar-right">
        <button class="zoom-btn" id="zoom-in" title="放大">+</button>
        <button class="zoom-btn" id="zoom-out" title="缩小">−</button>
      </div>
    `;

    this.bindEvents();
  }

  private bindEvents(): void {
    const zoomIn = document.getElementById('zoom-in');
    const zoomOut = document.getElementById('zoom-out');
    const searchInput = document.getElementById('search-input') as HTMLInputElement;

    if (zoomIn) {
      zoomIn.addEventListener('click', () => {
        this.sceneManager.zoom(0.8);
      });
    }

    if (zoomOut) {
      zoomOut.addEventListener('click', () => {
        this.sceneManager.zoom(1.25);
      });
    }

    if (searchInput) {
      searchInput.addEventListener('input', () => {
        if (this.searchTimer) clearTimeout(this.searchTimer);
        this.searchTimer = setTimeout(() => {
          const query = searchInput.value;
          if (query.trim()) {
            useMaterialStore.getState().searchAndNavigate(query);
          }
        }, 300);
      });

      searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          const query = searchInput.value;
          if (query.trim()) {
            useMaterialStore.getState().searchAndNavigate(query);
          }
        }
      });
    }
  }

  private updateMaterialName(): void {
    const state = useMaterialStore.getState();
    const material = state.materials[state.currentMaterial];
    const el = document.getElementById('current-material-name');
    if (el) {
      el.textContent = `${material.displayName} · ${material.category}`;
    }
  }
}
