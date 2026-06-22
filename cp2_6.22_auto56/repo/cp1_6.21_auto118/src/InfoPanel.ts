import { BuildingData } from './CityModel.js';

export class InfoPanel {
  private panel: HTMLElement;
  private yearEl: HTMLElement;
  private nameEl: HTMLElement;
  private styleEl: HTMLElement;
  private descEl: HTMLElement;
  private closeBtn: HTMLElement;
  private onClose: (() => void) | null = null;

  constructor(panelId: string) {
    const panel = document.getElementById(panelId);
    if (!panel) throw new Error(`Info panel #${panelId} not found`);
    this.panel = panel;

    this.yearEl = this.panel.querySelector('#info-year') as HTMLElement;
    this.nameEl = this.panel.querySelector('#info-name') as HTMLElement;
    this.styleEl = this.panel.querySelector('#info-style') as HTMLElement;
    this.descEl = this.panel.querySelector('#info-desc') as HTMLElement;
    this.closeBtn = this.panel.querySelector('#info-close') as HTMLElement;

    if (!this.yearEl || !this.nameEl || !this.styleEl || !this.descEl || !this.closeBtn) {
      throw new Error('Info panel DOM elements not found');
    }

    this.closeBtn.addEventListener('click', () => {
      this.hide();
      if (this.onClose) this.onClose();
    });
  }

  public setOnClose(callback: () => void): void {
    this.onClose = callback;
  }

  public show(data: BuildingData): void {
    this.yearEl.textContent = String(data.year);
    this.nameEl.textContent = data.name;
    this.styleEl.textContent = data.style;
    this.descEl.textContent = data.description;
    this.panel.classList.add('visible');
  }

  public hide(): void {
    this.panel.classList.remove('visible');
  }

  public isVisible(): boolean {
    return this.panel.classList.contains('visible');
  }
}
