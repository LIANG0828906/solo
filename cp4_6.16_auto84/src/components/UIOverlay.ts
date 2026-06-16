import { StarData } from '../utils/starData';
import { useStarStore } from '../stores/starStore';
import { StarScene } from './StarScene';

export class UIOverlay {
  private container: HTMLElement;
  private starScene: StarScene;
  private overlay: HTMLDivElement;
  
  private topBar: HTMLDivElement;
  private leftPanel: HTMLDivElement;
  private rightPanel: HTMLDivElement;
  private controlsPanel: HTMLDivElement;
  private infoPanel: HTMLDivElement;
  private favoritesPanel: HTMLDivElement;
  private roamButton: HTMLButtonElement;

  private currentSeason: string;
  private heartAnimating: boolean;

  constructor(container: HTMLElement, starScene: StarScene) {
    this.container = container;
    this.starScene = starScene;
    this.currentSeason = 'spring';
    this.heartAnimating = false;

    this.overlay = document.createElement('div');
    this.overlay.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 10;
      font-family: 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif;
    `;

    this.topBar = this.createTopBar();
    this.leftPanel = this.createLeftPanel();
    this.rightPanel = this.createRightPanel();
    this.controlsPanel = this.createControlsPanel();
    this.infoPanel = this.createInfoPanel();
    this.favoritesPanel = this.createFavoritesPanel();
    this.roamButton = this.createRoamButton();

    this.overlay.appendChild(this.topBar);
    this.overlay.appendChild(this.leftPanel);
    this.overlay.appendChild(this.rightPanel);
    this.rightPanel.appendChild(this.controlsPanel);
    this.rightPanel.appendChild(this.infoPanel);
    this.leftPanel.appendChild(this.favoritesPanel);
    this.overlay.appendChild(this.roamButton);

    this.container.appendChild(this.overlay);

    this.setupStoreSubscription();
  }

  private createTopBar(): HTMLDivElement {
    const bar = document.createElement('div');
    bar.style.cssText = `
      position: absolute;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      gap: 12px;
      padding: 12px 20px;
      background: rgba(10, 15, 40, 0.6);
      backdrop-filter: blur(20px);
      border-radius: 16px;
      border: 1px solid rgba(100, 120, 255, 0.2);
      pointer-events: auto;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
    `;

    const seasons = [
      { id: 'spring', name: '春', icon: '🌸' },
      { id: 'summer', name: '夏', icon: '☀️' },
      { id: 'autumn', name: '秋', icon: '🍂' },
      { id: 'winter', name: '冬', icon: '❄️' }
    ];

    for (const season of seasons) {
      const btn = document.createElement('button');
      btn.textContent = `${season.icon} ${season.name}`;
      btn.dataset.season = season.id;
      btn.style.cssText = `
        padding: 10px 20px;
        border: none;
        border-radius: 10px;
        background: ${season.id === 'spring' 
          ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' 
          : 'rgba(50, 60, 100, 0.5)'};
        color: white;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.25s ease;
        pointer-events: auto;
      `;

      btn.addEventListener('mouseenter', () => {
        btn.style.transform = 'translateY(-2px)';
        btn.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.4)';
      });

      btn.addEventListener('mouseleave', () => {
        btn.style.transform = 'translateY(0)';
        btn.style.boxShadow = 'none';
      });

      btn.addEventListener('click', () => {
        this.setSeason(season.id);
      });

      bar.appendChild(btn);
    }

    return bar;
  }

  private createLeftPanel(): HTMLDivElement {
    const panel = document.createElement('div');
    panel.style.cssText = `
      position: absolute;
      top: 100px;
      left: 20px;
      width: 260px;
      pointer-events: auto;
    `;
    return panel;
  }

  private createRightPanel(): HTMLDivElement {
    const panel = document.createElement('div');
    panel.style.cssText = `
      position: absolute;
      top: 100px;
      right: 20px;
      width: 300px;
      display: flex;
      flex-direction: column;
      gap: 16px;
      pointer-events: auto;
    `;
    return panel;
  }

  private createControlsPanel(): HTMLDivElement {
    const panel = document.createElement('div');
    panel.style.cssText = `
      padding: 16px;
      background: rgba(10, 15, 40, 0.6);
      backdrop-filter: blur(20px);
      border-radius: 16px;
      border: 1px solid rgba(100, 120, 255, 0.2);
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
    `;

    const title = document.createElement('h3');
    title.textContent = '星空控制';
    title.style.cssText = `
      margin: 0 0 12px 0;
      font-size: 15px;
      font-weight: 600;
      color: #a0b0ff;
    `;
    panel.appendChild(title);

    const btnContainer = document.createElement('div');
    btnContainer.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: 8px;
    `;

    const toggleLinesBtn = this.createControlButton('显示/隐藏连线', () => {
      const store = useStarStore.getState();
      store.toggleShowConnections();
      this.starScene.setShowConnections(store.showConnections);
    });

    const resetViewBtn = this.createControlButton('重置视角', () => {
      this.starScene.resetView();
      useStarStore.getState().setSelectedStar(null);
    });

    btnContainer.appendChild(toggleLinesBtn);
    btnContainer.appendChild(resetViewBtn);
    panel.appendChild(btnContainer);

    return panel;
  }

  private createControlButton(text: string, onClick: () => void): HTMLButtonElement {
    const btn = document.createElement('button');
    btn.textContent = text;
    btn.style.cssText = `
      padding: 10px 16px;
      border: none;
      border-radius: 8px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.25s ease;
      width: 100%;
    `;

    btn.addEventListener('mouseenter', () => {
      btn.style.transform = 'translateY(-1px)';
      btn.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.4)';
    });

    btn.addEventListener('mouseleave', () => {
      btn.style.transform = 'translateY(0)';
      btn.style.boxShadow = 'none';
    });

    btn.addEventListener('click', onClick);

    return btn;
  }

  private createInfoPanel(): HTMLDivElement {
    const panel = document.createElement('div');
    panel.style.cssText = `
      padding: 0;
      background: rgba(10, 15, 40, 0.7);
      backdrop-filter: blur(20px);
      border-radius: 12px;
      border: 1px solid rgba(100, 120, 255, 0.2);
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
      transform: translateX(340px);
      transition: transform 0.3s ease-out;
      overflow: hidden;
      opacity: 0;
    `;

    panel.id = 'star-info-panel';
    return panel;
  }

  private createFavoritesPanel(): HTMLDivElement {
    const panel = document.createElement('div');
    panel.style.cssText = `
      padding: 16px;
      background: rgba(10, 15, 40, 0.6);
      backdrop-filter: blur(20px);
      border-radius: 16px;
      border: 1px solid rgba(100, 120, 255, 0.2);
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
    `;

    const title = document.createElement('h3');
    title.textContent = '⭐ 收藏夹';
    title.style.cssText = `
      margin: 0 0 12px 0;
      font-size: 15px;
      font-weight: 600;
      color: #ffd700;
    `;
    panel.appendChild(title);

    const listContainer = document.createElement('div');
    listContainer.id = 'favorites-list';
    listContainer.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: 6px;
      max-height: 400px;
      overflow-y: auto;
    `;
    panel.appendChild(listContainer);

    return panel;
  }

  private createRoamButton(): HTMLButtonElement {
    const btn = document.createElement('button');
    btn.innerHTML = '🚀 开始漫游';
    btn.style.cssText = `
      position: absolute;
      bottom: 30px;
      right: 30px;
      padding: 14px 24px;
      border: none;
      border-radius: 16px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      font-size: 15px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      pointer-events: auto;
      box-shadow: 0 8px 24px rgba(102, 126, 234, 0.4);
      z-index: 20;
    `;

    btn.addEventListener('mouseenter', () => {
      btn.style.transform = 'translateY(-3px)';
      btn.style.boxShadow = '0 12px 32px rgba(102, 126, 234, 0.5)';
    });

    btn.addEventListener('mouseleave', () => {
      btn.style.transform = 'translateY(0)';
      btn.style.boxShadow = '0 8px 24px rgba(102, 126, 234, 0.4)';
    });

    btn.addEventListener('click', () => {
      const isRoaming = this.starScene.toggleRoaming();
      useStarStore.getState().setIsRoaming(isRoaming);
      this.updateRoamButton(isRoaming);
    });

    return btn;
  }

  private updateRoamButton(isRoaming: boolean) {
    if (isRoaming) {
      this.roamButton.innerHTML = '⏸️ 停止漫游';
      this.roamButton.style.background = 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)';
    } else {
      this.roamButton.innerHTML = '🚀 开始漫游';
      this.roamButton.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
    }
  }

  private setSeason(season: string) {
    this.currentSeason = season;
    useStarStore.getState().setCurrentSeason(season);
    this.starScene.setSeason(season);

    const buttons = this.topBar.querySelectorAll('button');
    buttons.forEach(btn => {
      if (btn.dataset.season === season) {
        btn.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
      } else {
        btn.style.background = 'rgba(50, 60, 100, 0.5)';
      }
    });
  }

  private setupStoreSubscription() {
    useStarStore.subscribe(
      (state) => ({ selectedStar: state.selectedStar, favorites: state.favorites }),
      ({ selectedStar, favorites }) => {
        this.updateInfoPanel(selectedStar);
        this.updateFavoritesList(favorites);
      }
    );
  }

  private updateInfoPanel(star: StarData | null) {
    this.infoPanel.innerHTML = '';

    if (!star) {
      this.infoPanel.style.transform = 'translateX(340px)';
      this.infoPanel.style.opacity = '0';
      return;
    }

    this.infoPanel.style.transform = 'translateX(0)';
    this.infoPanel.style.opacity = '1';
    this.infoPanel.style.padding = '20px';

    const header = document.createElement('div');
    header.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 16px;
    `;

    const titleSection = document.createElement('div');
    const name = document.createElement('h2');
    name.textContent = star.name;
    name.style.cssText = `
      margin: 0 0 4px 0;
      font-size: 18px;
      font-weight: 700;
      color: #ffffff;
      line-height: 1.3;
    `;

    const constellationTag = document.createElement('div');
    constellationTag.textContent = `所属星座: ${star.constellation}`;
    constellationTag.style.cssText = `
      display: inline-block;
      padding: 4px 10px;
      background: rgba(100, 120, 255, 0.3);
      border-radius: 6px;
      font-size: 12px;
      color: #a0b0ff;
      margin-top: 8px;
    `;

    titleSection.appendChild(name);
    titleSection.appendChild(constellationTag);

    const isFav = useStarStore.getState().isFavorite(star.id);
    const heartBtn = this.createHeartButton(star, isFav);
    header.appendChild(titleSection);
    header.appendChild(heartBtn);

    this.infoPanel.appendChild(header);

    const infoGrid = document.createElement('div');
    infoGrid.style.cssText = `
      display: grid;
      gap: 10px;
    `;

    const infoItems = [
      { label: '视星等', value: star.apparentMagnitude.toFixed(2), unit: ' mag' },
      { label: '绝对星等', value: star.absoluteMagnitude.toFixed(2), unit: ' mag' },
      { label: '距地距离', value: this.calculateDistance(star).toFixed(1), unit: ' 光年' },
      { label: '光谱类型', value: star.spectralType, unit: '' },
      { label: 'B-V色指数', value: star.bvColorIndex.toFixed(2), unit: '' }
    ];

    for (const item of infoItems) {
      const row = document.createElement('div');
      row.style.cssText = `
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 10px 12px;
        background: rgba(30, 40, 80, 0.4);
        border-radius: 8px;
      `;

      const label = document.createElement('span');
      label.textContent = item.label;
      label.style.cssText = 'color: #8090c0; font-size: 13px;';

      const value = document.createElement('span');
      value.innerHTML = `<strong>${item.value}</strong>${item.unit}`;
      value.style.cssText = 'color: #ffffff; font-size: 14px; font-weight: 500;';

      row.appendChild(label);
      row.appendChild(value);
      infoGrid.appendChild(row);
    }

    this.infoPanel.appendChild(infoGrid);
  }

  private createHeartButton(star: StarData, isFav: boolean): HTMLButtonElement {
    const btn = document.createElement('button');
    btn.innerHTML = isFav ? '❤️' : '🤍';
    btn.style.cssText = `
      width: 40px;
      height: 40px;
      border: none;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.1);
      cursor: pointer;
      font-size: 20px;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      justify-content: center;
    `;

    btn.addEventListener('mouseenter', () => {
      btn.style.transform = 'scale(1.1)';
      btn.style.background = 'rgba(255, 100, 100, 0.2)';
    });

    btn.addEventListener('mouseleave', () => {
      btn.style.transform = 'scale(1)';
      btn.style.background = 'rgba(255, 255, 255, 0.1)';
    });

    btn.addEventListener('click', async () => {
      if (this.heartAnimating) return;
      this.heartAnimating = true;

      btn.style.animation = 'none';
      btn.offsetHeight;

      if (!useStarStore.getState().isFavorite(star.id)) {
        await useStarStore.getState().addFavorite(star);
        btn.innerHTML = '❤️';
        btn.style.animation = 'heartBounce 0.4s ease-out';
      } else {
        await useStarStore.getState().removeFavorite(star.id);
        btn.innerHTML = '🤍';
      }

      setTimeout(() => {
        this.heartAnimating = false;
      }, 400);
    });

    return btn;
  }

  private updateFavoritesList(favorites: StarData[]) {
    const listContainer = this.favoritesPanel.querySelector('#favorites-list') as HTMLDivElement;
    if (!listContainer) return;

    listContainer.innerHTML = '';

    if (favorites.length === 0) {
      const emptyMsg = document.createElement('div');
      emptyMsg.textContent = '暂无收藏恒星';
      emptyMsg.style.cssText = `
        padding: 20px;
        text-align: center;
        color: #6070a0;
        font-size: 13px;
      `;
      listContainer.appendChild(emptyMsg);
      return;
    }

    for (const star of favorites) {
      const item = document.createElement('div');
      item.style.cssText = `
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 10px 12px;
        background: rgba(30, 40, 80, 0.4);
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.2s ease;
      `;

      item.addEventListener('mouseenter', () => {
        item.style.background = 'rgba(50, 60, 120, 0.6)';
        item.style.transform = 'translateX(3px)';
      });

      item.addEventListener('mouseleave', () => {
        item.style.background = 'rgba(30, 40, 80, 0.4)';
        item.style.transform = 'translateX(0)';
      });

      item.addEventListener('click', () => {
        this.starScene.focusOnStar(star);
        useStarStore.getState().setSelectedStar(star);
      });

      const starIcon = document.createElement('span');
      starIcon.textContent = '⭐';
      starIcon.style.fontSize = '14px';

      const name = document.createElement('span');
      name.textContent = star.name.split(' ')[0];
      name.style.cssText = `
        flex: 1;
        color: #e0e0ff;
        font-size: 13px;
        font-weight: 500;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      `;

      const deleteBtn = document.createElement('button');
      deleteBtn.innerHTML = '✕';
      deleteBtn.style.cssText = `
        width: 24px;
        height: 24px;
        border: none;
        border-radius: 50%;
        background: rgba(255, 100, 100, 0.2);
        color: #ff6060;
        cursor: pointer;
        font-size: 12px;
        transition: all 0.2s ease;
      `;

      deleteBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        await useStarStore.getState().removeFavorite(star.id);
      });

      deleteBtn.addEventListener('mouseenter', () => {
        deleteBtn.style.background = 'rgba(255, 100, 100, 0.4)';
        deleteBtn.style.transform = 'scale(1.1)';
      });

      deleteBtn.addEventListener('mouseleave', () => {
        deleteBtn.style.background = 'rgba(255, 100, 100, 0.2)';
        deleteBtn.style.transform = 'scale(1)';
      });

      item.appendChild(starIcon);
      item.appendChild(name);
      item.appendChild(deleteBtn);
      listContainer.appendChild(item);
    }
  }

  private calculateDistance(star: StarData): number {
    const distanceModulus = star.apparentMagnitude - star.absoluteMagnitude;
    const distanceInParsecs = Math.pow(10, distanceModulus / 5 + 1);
    return distanceInParsecs * 3.26156;
  }

  public dispose() {
    if (this.overlay.parentNode) {
      this.overlay.parentNode.removeChild(this.overlay);
    }
  }
}

const style = document.createElement('style');
style.textContent = `
  @keyframes heartBounce {
    0% { transform: scale(1); }
    30% { transform: scale(1.2); }
    50% { transform: scale(0.95); }
    70% { transform: scale(1.1); }
    100% { transform: scale(1); }
  }
  
  #favorites-list::-webkit-scrollbar {
    width: 6px;
  }
  
  #favorites-list::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.2);
    border-radius: 3px;
  }
  
  #favorites-list::-webkit-scrollbar-thumb {
    background: rgba(100, 120, 255, 0.4);
    border-radius: 3px;
  }
  
  #favorites-list::-webkit-scrollbar-thumb:hover {
    background: rgba(100, 120, 255, 0.6);
  }
`;
document.head.appendChild(style);
