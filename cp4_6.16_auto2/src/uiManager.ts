import type { BuildingInfo } from './sceneBuilder';

export class UIManager {
  private infoCard: HTMLElement;
  private cardIcon: HTMLElement;
  private cardTitle: HTMLElement;
  private cardTag: HTMLElement;
  private cardFloors: HTMLElement;
  private cardType: HTMLElement;
  private cardDesc: HTMLElement;
  private cardClose: HTMLElement;
  private modeDisplay: HTMLElement;
  private fpsCounter: HTMLElement;
  private progressBar: HTMLElement;
  private progressText: HTMLElement;
  private loadingScreen: HTMLElement;

  public onClose?: () => void;
  private currentBuildingId: string | null = null;
  private isVisible = false;

  constructor() {
    this.infoCard = document.getElementById('info-card')!;
    this.cardIcon = document.getElementById('card-icon')!;
    this.cardTitle = document.getElementById('card-title')!;
    this.cardTag = document.getElementById('card-tag')!;
    this.cardFloors = document.getElementById('card-floors')!;
    this.cardType = document.getElementById('card-type')!;
    this.cardDesc = document.getElementById('card-desc')!;
    this.cardClose = document.getElementById('card-close')!;
    this.modeDisplay = document.getElementById('mode-display')!;
    this.fpsCounter = document.getElementById('fps-counter')!;
    this.progressBar = document.getElementById('progress-bar')!;
    this.progressText = document.getElementById('progress-text')!;
    this.loadingScreen = document.getElementById('loading-screen')!;

    this.bindCardEvents();
  }

  private bindCardEvents(): void {
    this.cardClose.addEventListener('click', () => this.hideCard());

    window.addEventListener('keydown', (e) => {
      if (e.code === 'Escape' && this.isVisible) {
        this.hideCard();
      }
    });

    this.infoCard.addEventListener('click', (e) => {
      e.stopPropagation();
    });
  }

  setProgress(loaded: number, total: number, stage: string): void {
    const pct = Math.min(100, Math.round((loaded / total) * 100));
    this.progressBar.style.width = `${pct}%`;
    this.progressText.textContent = `${stage} ${pct}%`;
  }

  hideLoading(delay = 400): void {
    this.progressBar.style.width = '100%';
    this.progressText.textContent = '场景加载完成 100%';
    setTimeout(() => {
      this.loadingScreen.classList.add('hidden');
      setTimeout(() => {
        this.loadingScreen.style.display = 'none';
      }, 700);
    }, delay);
  }

  setMode(mode: 'firstPerson' | 'overhead'): void {
    this.modeDisplay.textContent =
      mode === 'firstPerson' ? '第一人称漫游' : '俯瞰漫游模式';
  }

  updateFPS(fps: number): void {
    this.fpsCounter.textContent = `FPS: ${fps.toFixed(0)}`;
    if (fps >= 50) {
      this.fpsCounter.style.color = '#66bb6a';
    } else if (fps >= 30) {
      this.fpsCounter.style.color = '#4dd0e1';
    } else {
      this.fpsCounter.style.color = '#ef5350';
    }
  }

  showCard(info: BuildingInfo): void {
    if (this.currentBuildingId === info.id && this.isVisible) {
      this.flashCard();
      return;
    }

    this.currentBuildingId = info.id;

    this.cardIcon.textContent = info.icon || '🏛️';
    this.cardTitle.textContent = info.name;
    this.cardTag.textContent = info.tag || info.type;
    this.cardFloors.textContent = `${info.floors} 层`;
    this.cardType.textContent = info.type;
    this.cardDesc.textContent = info.description;

    if (!this.isVisible) {
      requestAnimationFrame(() => {
        this.infoCard.classList.add('visible');
        this.isVisible = true;
      });
    } else {
      this.flashCard();
    }
  }

  private flashCard(): void {
    this.infoCard.style.transition = 'none';
    this.infoCard.style.opacity = '0.4';
    this.infoCard.style.transform = 'translateY(-50%) translateX(8px)';
    requestAnimationFrame(() => {
      this.infoCard.style.transition = '';
      this.infoCard.style.opacity = '';
      this.infoCard.style.transform = '';
    });
  }

  hideCard(): void {
    if (!this.isVisible) return;
    this.infoCard.classList.remove('visible');
    this.isVisible = false;
    this.currentBuildingId = null;
    this.onClose?.();
  }

  getIsCardVisible(): boolean {
    return this.isVisible;
  }
}
