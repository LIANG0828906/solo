import { ParsedStratum, useAppStore } from './stratumParser';

export class UIController {
  private stratumListEl: HTMLElement;
  private cutSliderEl: HTMLInputElement;
  private cutValueEl: HTMLElement;
  private resetBtnEl: HTMLButtonElement;
  private infoCardEl: HTMLElement;
  private infoNameEl: HTMLElement;
  private infoDepthEl: HTMLElement;
  private infoDensityEl: HTMLElement;
  private infoMineralsEl: HTMLElement;
  private strata: ParsedStratum[] = [];
  private onSelectStratumCallback: ((stratumId: string) => void) | null = null;
  private onCutDepthChangeCallback: ((depth: number) => void) | null = null;
  private onOpacityChangeCallback: ((stratumId: string, opacity: number) => void) | null = null;
  private onResetCameraCallback: (() => void) | null = null;
  private unsubscribe: (() => void) | null = null;

  constructor() {
    this.stratumListEl = document.getElementById('stratum-list')!;
    this.cutSliderEl = document.getElementById('cut-slider') as HTMLInputElement;
    this.cutValueEl = document.getElementById('cut-value')!;
    this.resetBtnEl = document.getElementById('reset-btn') as HTMLButtonElement;
    this.infoCardEl = document.getElementById('info-card')!;
    this.infoNameEl = document.getElementById('info-name')!;
    this.infoDepthEl = document.getElementById('info-depth')!;
    this.infoDensityEl = document.getElementById('info-density')!;
    this.infoMineralsEl = document.getElementById('info-minerals')!;

    this.setupEventListeners();
    this.subscribeToStore();
  }

  private setupEventListeners(): void {
    this.cutSliderEl.addEventListener('input', (e) => {
      const value = parseFloat((e.target as HTMLInputElement).value);
      this.cutValueEl.textContent = value.toString();
      if (this.onCutDepthChangeCallback) {
        this.onCutDepthChangeCallback(value);
      }
    });

    this.resetBtnEl.addEventListener('click', () => {
      if (this.onResetCameraCallback) {
        this.onResetCameraCallback();
      }
    });

    document.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      if (!this.infoCardEl.contains(target)) {
        const store = useAppStore.getState();
        if (store.infoCard?.visible) {
          store.hideInfoCard();
        }
      }
    });
  }

  private subscribeToStore(): void {
    this.unsubscribe = useAppStore.subscribe((state) => {
      this.updateSelectedHighlight(state.selectedStratumId);
      this.updateInfoCard(state.infoCard, state.strata);
    });
  }

  private updateSelectedHighlight(selectedId: string | null): void {
    const items = this.stratumListEl.querySelectorAll('.stratum-item');
    items.forEach((item) => {
      const id = (item as HTMLElement).dataset.stratumId;
      if (id === selectedId) {
        item.classList.add('selected');
      } else {
        item.classList.remove('selected');
      }
    });
  }

  private updateInfoCard(
    infoCard: { visible: boolean; stratumId: string | null; screenX: number; screenY: number } | null,
    strata: ParsedStratum[]
  ): void {
    if (!infoCard || !infoCard.visible || !infoCard.stratumId) {
      this.infoCardEl.classList.remove('visible');
      return;
    }

    const stratum = strata.find(s => s.id === infoCard.stratumId);
    if (!stratum) {
      this.infoCardEl.classList.remove('visible');
      return;
    }

    this.infoNameEl.textContent = stratum.name;
    this.infoDepthEl.textContent = `${stratum.depthStart.toFixed(1)}m - ${stratum.depthEnd.toFixed(1)}m`;
    this.infoDensityEl.textContent = `${stratum.density.toFixed(2)} g/cm³`;
    this.infoMineralsEl.textContent = `矿物组成: ${stratum.minerals}`;

    const maxX = window.innerWidth - 260 - 220;
    const maxY = window.innerHeight - 180;
    const x = Math.min(Math.max(10, infoCard.screenX - 100), maxX);
    const y = Math.min(Math.max(10, infoCard.screenY), maxY);

    this.infoCardEl.style.left = `${x + 260}px`;
    this.infoCardEl.style.top = `${y}px`;
    this.infoCardEl.classList.add('visible');
  }

  public setStrata(strata: ParsedStratum[]): void {
    this.strata = strata;
    this.renderStratumList();
  }

  private renderStratumList(): void {
    this.stratumListEl.innerHTML = '';

    this.strata.forEach((stratum) => {
      const item = document.createElement('div');
      item.className = 'stratum-item';
      item.dataset.stratumId = stratum.id;

      const header = document.createElement('div');
      header.className = 'stratum-header';

      const colorDot = document.createElement('div');
      colorDot.className = 'stratum-color';
      colorDot.style.backgroundColor = stratum.color;

      const name = document.createElement('div');
      name.className = 'stratum-name';
      name.textContent = stratum.name;

      header.appendChild(colorDot);
      header.appendChild(name);

      const sliderContainer = document.createElement('div');
      sliderContainer.className = 'opacity-slider-container';

      const label = document.createElement('div');
      label.className = 'opacity-label';
      const currentOpacity = useAppStore.getState().stratumOpacities[stratum.id] ?? 85;
      label.textContent = `${currentOpacity}%`;

      const slider = document.createElement('input');
      slider.type = 'range';
      slider.min = '0';
      slider.max = '100';
      slider.step = '1';
      slider.value = currentOpacity.toString();
      slider.dataset.stratumId = stratum.id;

      slider.addEventListener('input', (e) => {
        const value = parseFloat((e.target as HTMLInputElement).value);
        label.textContent = `${value}%`;
        useAppStore.getState().setStratumOpacity(stratum.id, value);
        if (this.onOpacityChangeCallback) {
          this.onOpacityChangeCallback(stratum.id, value);
        }
      });

      sliderContainer.appendChild(label);
      sliderContainer.appendChild(slider);

      item.appendChild(header);
      item.appendChild(sliderContainer);

      header.addEventListener('click', (e) => {
        e.stopPropagation();
        const opacity = useAppStore.getState().stratumOpacities[stratum.id];
        if (opacity <= 5) return;
        useAppStore.getState().setSelectedStratum(stratum.id);
        if (this.onSelectStratumCallback) {
          this.onSelectStratumCallback(stratum.id);
        }
      });

      this.stratumListEl.appendChild(item);
    });
  }

  public setOnSelectStratum(callback: (stratumId: string) => void): void {
    this.onSelectStratumCallback = callback;
  }

  public setOnCutDepthChange(callback: (depth: number) => void): void {
    this.onCutDepthChangeCallback = callback;
  }

  public setOnOpacityChange(callback: (stratumId: string, opacity: number) => void): void {
    this.onOpacityChangeCallback = callback;
  }

  public setOnResetCamera(callback: () => void): void {
    this.onResetCameraCallback = callback;
  }

  public dispose(): void {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
  }
}
