import { eventBus, EVENTS } from './eventBus';
import { dataManager } from './dataManager';

export class UIManager {
  private altitudeDisplay: HTMLElement;
  private avgWindSpeedDisplay: HTMLElement;
  private maxTempDisplay: HTMLElement;
  private altitudeButtons: NodeListOf<HTMLElement>;
  private rotationSpeedInput: HTMLInputElement;
  private speedValueDisplay: HTMLElement;
  private infoPanel: HTMLElement;
  private infoPanelHeader: HTMLElement | null;

  private currentAltitude: number = 1000;
  private lastUpdateTime: number = 0;
  private updateInterval: number = 1000;

  constructor() {
    this.altitudeDisplay = document.getElementById('altitude-display')!;
    this.avgWindSpeedDisplay = document.getElementById('avg-wind-speed')!;
    this.maxTempDisplay = document.getElementById('max-temp')!;
    this.altitudeButtons = document.querySelectorAll('.altitude-btn');
    this.rotationSpeedInput = document.getElementById('rotation-speed') as HTMLInputElement;
    this.speedValueDisplay = document.getElementById('speed-value')!;
    this.infoPanel = document.getElementById('info-panel')!;
    this.infoPanelHeader = document.getElementById('info-panel-header');

    this.setupEventListeners();
    this.updateInfo();
  }

  private setupEventListeners(): void {
    this.altitudeButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const altitude = parseInt(btn.dataset.altitude || '1000', 10);
        this.switchAltitude(altitude);
      });
    });

    this.rotationSpeedInput.addEventListener('input', () => {
      const speed = parseFloat(this.rotationSpeedInput.value);
      this.speedValueDisplay.textContent = `${speed.toFixed(1)}x`;
      eventBus.emit(EVENTS.EARTH_ROTATION_SPEED_CHANGED, speed);
    });

    if (this.infoPanelHeader) {
      this.infoPanelHeader.addEventListener('click', () => {
        this.infoPanel.classList.toggle('panel-collapsed');
      });
    }
  }

  private switchAltitude(altitude: number): void {
    if (altitude === this.currentAltitude) return;

    this.currentAltitude = altitude;
    this.altitudeDisplay.innerHTML = `${altitude}<small>米</small>`;

    this.altitudeButtons.forEach((btn) => {
      const btnAltitude = parseInt(btn.dataset.altitude || '1000', 10);
      if (btnAltitude === altitude) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    eventBus.emit(EVENTS.ALTITUDE_CHANGED, altitude);
    this.updateInfo();
  }

  public update(currentTime: number): void {
    if (currentTime - this.lastUpdateTime >= this.updateInterval) {
      this.lastUpdateTime = currentTime;
      this.updateInfo();
    }
  }

  private updateInfo(): void {
    const stats = dataManager.getStats(this.currentAltitude);
    if (stats) {
      this.avgWindSpeedDisplay.innerHTML = `${stats.avgWindSpeed.toFixed(1)}<small>m/s</small>`;
      this.maxTempDisplay.innerHTML = `${stats.maxTemperature.toFixed(1)}<small>°C</small>`;

      eventBus.emit(EVENTS.INFO_UPDATE, {
        altitude: this.currentAltitude,
        avgWindSpeed: stats.avgWindSpeed,
        maxTemperature: stats.maxTemperature,
      });
    }
  }

  public dispose(): void {
  }
}
