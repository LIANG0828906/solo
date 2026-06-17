import { ClusterInfo } from './ParticleClusterGenerator';

export interface UIControllerOptions {
  container: HTMLElement;
  clusters: ClusterInfo[];
}

export class UIController {
  private container: HTMLElement;
  private clusters: ClusterInfo[];
  private filteredClusters: ClusterInfo[];

  private panelElement!: HTMLElement;
  private panelToggle!: HTMLElement;
  private panelContent!: HTMLElement;
  private searchInput!: HTMLInputElement;
  private infoCard!: HTMLElement;

  private isPanelOpen: boolean = false;
  private currentClusterId: number | null = null;

  private onClusterSelectCallback: ((clusterId: number) => void) | null = null;
  private onSearchCallback: ((query: string) => void) | null = null;

  constructor(options: UIControllerOptions) {
    this.container = options.container;
    this.clusters = options.clusters;
    this.filteredClusters = [...options.clusters];

    this.init();
  }

  private init(): void {
    this.createPanel();
    this.createSearchBox();
    this.createInfoCard();
  }

  private createPanel(): void {
    this.panelElement = document.createElement('div');
    this.panelElement.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 280px;
      height: 100%;
      background: rgba(15, 22, 38, 0.85);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      border-right: 1px solid rgba(255, 255, 255, 0.1);
      transform: translateX(-280px);
      transition: transform 0.3s ease;
      z-index: 100;
      display: flex;
      flex-direction: column;
    `;

    this.panelToggle = document.createElement('div');
    this.panelToggle.style.cssText = `
      position: absolute;
      top: 50%;
      right: -32px;
      transform: translateY(-50%);
      width: 32px;
      height: 64px;
      background: rgba(15, 22, 38, 0.85);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      border-radius: 0 8px 8px 0;
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-left: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.2s ease;
    `;
    this.panelToggle.innerHTML = `
      <svg width="12" height="20" viewBox="0 0 12 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M2 2L10 10L2 18" stroke="#E0E6ED" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `;
    this.panelToggle.addEventListener('click', () => this.togglePanel());
    this.panelToggle.addEventListener('mouseenter', () => {
      this.panelToggle.style.background = 'rgba(74, 144, 217, 0.3)';
    });
    this.panelToggle.addEventListener('mouseleave', () => {
      this.panelToggle.style.background = 'rgba(15, 22, 38, 0.85)';
    });

    this.panelElement.appendChild(this.panelToggle);

    const header = document.createElement('div');
    header.style.cssText = `
      padding: 24px 20px 16px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    `;
    header.innerHTML = `
      <h2 style="color: #E0E6ED; font-size: 18px; font-weight: 600; margin: 0;">星座图鉴</h2>
      <p style="color: #6C757D; font-size: 12px; margin: 4px 0 0 0;">共 ${this.clusters.length} 个星座</p>
    `;
    this.panelElement.appendChild(header);

    this.panelContent = document.createElement('div');
    this.panelContent.style.cssText = `
      flex: 1;
      overflow-y: auto;
      padding: 12px;
      scrollbar-width: thin;
      scrollbar-color: rgba(255, 255, 255, 0.2) transparent;
    `;

    const style = document.createElement('style');
    style.textContent = `
      .panel-content::-webkit-scrollbar {
        width: 4px;
      }
      .panel-content::-webkit-scrollbar-track {
        background: transparent;
      }
      .panel-content::-webkit-scrollbar-thumb {
        background: rgba(255, 255, 255, 0.2);
        border-radius: 2px;
      }
      .panel-content::-webkit-scrollbar-thumb:hover {
        background: rgba(255, 255, 255, 0.3);
      }
    `;
    document.head.appendChild(style);
    this.panelContent.classList.add('panel-content');

    this.renderClusterList();
    this.panelElement.appendChild(this.panelContent);

    this.container.appendChild(this.panelElement);
  }

  private renderClusterList(): void {
    this.panelContent.innerHTML = '';

    for (const cluster of this.filteredClusters) {
      const item = document.createElement('div');
      item.style.cssText = `
        background: #1A233A;
        border-radius: 8px;
        padding: 12px;
        margin-bottom: 8px;
        cursor: pointer;
        transition: all 0.2s ease;
        border: 1px solid transparent;
      `;

      const colorHex = '#' + cluster.color.getHexString();

      item.innerHTML = `
        <div style="display: flex; align-items: center; gap: 10px;">
          <div style="
            width: 10px;
            height: 10px;
            border-radius: 50%;
            background: ${colorHex};
            box-shadow: 0 0 8px ${colorHex};
          "></div>
          <div style="flex: 1;">
            <div style="color: #E0E6ED; font-size: 14px; font-weight: 500;">${cluster.name}</div>
            <div style="color: #6C757D; font-size: 11px; margin-top: 2px;">主星亮度: ${(cluster.brightness * 100).toFixed(0)}%</div>
          </div>
        </div>
      `;

      item.addEventListener('mouseenter', () => {
        item.style.background = '#2A3A5A';
        item.style.borderColor = 'rgba(74, 144, 217, 0.3)';
      });

      item.addEventListener('mouseleave', () => {
        if (this.currentClusterId !== cluster.id) {
          item.style.background = '#1A233A';
          item.style.borderColor = 'transparent';
        }
      });

      item.addEventListener('click', () => {
        this.selectCluster(cluster.id);
        if (this.onClusterSelectCallback) {
          this.onClusterSelectCallback(cluster.id);
        }
      });

      this.panelContent.appendChild(item);
    }
  }

  private createSearchBox(): void {
    const searchContainer = document.createElement('div');
    searchContainer.style.cssText = `
      position: absolute;
      top: 20px;
      right: 20px;
      z-index: 100;
    `;

    this.searchInput = document.createElement('input');
    this.searchInput.type = 'text';
    this.searchInput.placeholder = '搜索星座...';
    this.searchInput.style.cssText = `
      width: 200px;
      padding: 8px 16px;
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid rgba(255, 255, 255, 0.13);
      border-radius: 20px;
      color: #E0E6ED;
      font-size: 14px;
      outline: none;
      transition: all 0.2s ease;
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
    `;

    this.searchInput.addEventListener('focus', () => {
      this.searchInput.style.borderColor = '#4A90D9';
      this.searchInput.style.background = 'rgba(255, 255, 255, 0.1)';
    });

    this.searchInput.addEventListener('blur', () => {
      this.searchInput.style.borderColor = 'rgba(255, 255, 255, 0.13)';
      this.searchInput.style.background = 'rgba(255, 255, 255, 0.06)';
    });

    this.searchInput.addEventListener('input', (e) => {
      const target = e.target as HTMLInputElement;
      const query = target.value.trim().toLowerCase();
      this.filterClusters(query);

      if (this.onSearchCallback) {
        this.onSearchCallback(query);
      }
    });

    searchContainer.appendChild(this.searchInput);
    this.container.appendChild(searchContainer);
  }

  private createInfoCard(): void {
    this.infoCard = document.createElement('div');
    this.infoCard.style.cssText = `
      position: absolute;
      width: 220px;
      background: #FFFFFF;
      border-radius: 8px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.19);
      padding: 16px;
      pointer-events: none;
      opacity: 0;
      transform: scale(0.8);
      transform-origin: center bottom;
      transition: opacity 0.3s ease, transform 0.3s ease;
      z-index: 200;
      display: none;
    `;

    this.container.appendChild(this.infoCard);
  }

  public showInfoCard(cluster: ClusterInfo, screenX: number, screenY: number): void {
    const colorHex = '#' + cluster.color.getHexString();

    this.infoCard.innerHTML = `
      <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
        <div style="
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: ${colorHex};
          box-shadow: 0 0 10px ${colorHex};
        "></div>
        <h3 style="color: #1A1A2E; font-size: 18px; font-weight: 700; margin: 0;">${cluster.name}</h3>
      </div>
      <div style="color: #6C757D; font-size: 14px; margin-bottom: 10px;">
        主星亮度: ${(cluster.brightness * 100).toFixed(0)}%
      </div>
      <div style="color: #4A4A4A; font-size: 12px; line-height: 1.6;">
        ${cluster.myth}
      </div>
    `;

    this.infoCard.style.display = 'block';

    requestAnimationFrame(() => {
      const cardRect = this.infoCard.getBoundingClientRect();
      let left = screenX - cardRect.width / 2;
      let top = screenY - cardRect.height - 20;

      if (left < 10) left = 10;
      if (left + cardRect.width > window.innerWidth - 10) {
        left = window.innerWidth - cardRect.width - 10;
      }
      if (top < 10) top = screenY + 20;

      this.infoCard.style.left = left + 'px';
      this.infoCard.style.top = top + 'px';
      this.infoCard.style.opacity = '1';
      this.infoCard.style.transform = 'scale(1)';
    });
  }

  public hideInfoCard(): void {
    this.infoCard.style.opacity = '0';
    this.infoCard.style.transform = 'scale(0.8)';
    setTimeout(() => {
      this.infoCard.style.display = 'none';
    }, 300);
  }

  private togglePanel(): void {
    if (this.isPanelOpen) {
      this.closePanel();
    } else {
      this.openPanel();
    }
  }

  public openPanel(): void {
    this.isPanelOpen = true;
    this.panelElement.style.transform = 'translateX(0)';
    this.panelToggle.innerHTML = `
      <svg width="12" height="20" viewBox="0 0 12 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M10 2L2 10L10 18" stroke="#E0E6ED" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `;
  }

  public closePanel(): void {
    this.isPanelOpen = false;
    this.panelElement.style.transform = 'translateX(-280px)';
    this.panelToggle.innerHTML = `
      <svg width="12" height="20" viewBox="0 0 12 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M2 2L10 10L2 18" stroke="#E0E6ED" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `;
  }

  private filterClusters(query: string): void {
    if (!query) {
      this.filteredClusters = [...this.clusters];
    } else {
      this.filteredClusters = this.clusters.filter(c =>
        c.name.toLowerCase().includes(query)
      );
    }
    this.renderClusterList();
  }

  private selectCluster(clusterId: number): void {
    this.currentClusterId = clusterId;

    const items = this.panelContent.children;
    for (let i = 0; i < items.length; i++) {
      const item = items[i] as HTMLElement;
      if (this.filteredClusters[i]?.id === clusterId) {
        item.style.background = '#2A3A5A';
        item.style.borderColor = 'rgba(74, 144, 217, 0.5)';
      } else {
        item.style.background = '#1A233A';
        item.style.borderColor = 'transparent';
      }
    }
  }

  public onClusterSelect(callback: (clusterId: number) => void): void {
    this.onClusterSelectCallback = callback;
  }

  public onSearch(callback: (query: string) => void): void {
    this.onSearchCallback = callback;
  }

  public setActiveCluster(clusterId: number | null): void {
    this.currentClusterId = clusterId;

    if (clusterId === null) {
      const items = this.panelContent.children;
      for (let i = 0; i < items.length; i++) {
        const item = items[i] as HTMLElement;
        item.style.background = '#1A233A';
        item.style.borderColor = 'transparent';
      }
    } else {
      this.selectCluster(clusterId);
    }
  }

  public dispose(): void {
    if (this.panelElement && this.panelElement.parentNode) {
      this.panelElement.parentNode.removeChild(this.panelElement);
    }
    if (this.searchInput && this.searchInput.parentNode) {
      this.searchInput.parentNode.parentNode?.removeChild(this.searchInput.parentNode);
    }
    if (this.infoCard && this.infoCard.parentNode) {
      this.infoCard.parentNode.removeChild(this.infoCard);
    }
  }
}
