import { Ecosystem, SpeciesName } from './ecosystem.js';
import { WARNING_DURATION } from './config.js';

export class UiController {
  ecosystem: Ecosystem;
  playPauseBtn: HTMLButtonElement;
  resetBtn: HTMLButtonElement;
  speedSlider: HTMLInputElement;
  speedValueEl: HTMLElement;
  plantCountEl: HTMLElement;
  herbivoreCountEl: HTMLElement;
  carnivoreCountEl: HTMLElement;
  timerEl: HTMLElement;
  warningEl: HTMLElement;
  confirmModal: HTMLElement;
  confirmCancel: HTMLButtonElement;
  confirmOk: HTMLButtonElement;
  predationBar: HTMLElement;
  predationValue: HTMLElement;
  grazingBar: HTMLElement;
  grazingValue: HTMLElement;
  warningTimeout: number | null;
  onPlayPause: (() => void) | null;
  onReset: (() => void) | null;

  constructor(ecosystem: Ecosystem) {
    this.ecosystem = ecosystem;
    this.onPlayPause = null;
    this.onReset = null;
    this.warningTimeout = null;

    this.playPauseBtn = document.getElementById('play-pause-btn') as HTMLButtonElement;
    this.resetBtn = document.getElementById('reset-btn') as HTMLButtonElement;
    this.speedSlider = document.getElementById('speed-slider') as HTMLInputElement;
    this.speedValueEl = document.getElementById('speed-value') as HTMLElement;
    this.plantCountEl = document.getElementById('plant-count') as HTMLElement;
    this.herbivoreCountEl = document.getElementById('herbivore-count') as HTMLElement;
    this.carnivoreCountEl = document.getElementById('carnivore-count') as HTMLElement;
    this.timerEl = document.getElementById('timer') as HTMLElement;
    this.warningEl = document.getElementById('warning-overlay') as HTMLElement;
    this.confirmModal = document.getElementById('confirm-modal') as HTMLElement;
    this.confirmCancel = document.getElementById('confirm-cancel') as HTMLButtonElement;
    this.confirmOk = document.getElementById('confirm-ok') as HTMLButtonElement;
    this.predationBar = document.getElementById('predation-bar') as HTMLElement;
    this.predationValue = document.getElementById('predation-value') as HTMLElement;
    this.grazingBar = document.getElementById('grazing-bar') as HTMLElement;
    this.grazingValue = document.getElementById('grazing-value') as HTMLElement;
  }

  bindEvents(): void {
    this.playPauseBtn.addEventListener('click', () => {
      if (this.onPlayPause) this.onPlayPause();
    });

    this.resetBtn.addEventListener('click', () => {
      this.showResetConfirm();
    });

    this.speedSlider.addEventListener('input', (e) => {
      const value = parseFloat((e.target as HTMLInputElement).value);
      this.ecosystem.setSpeed(value);
      this.updateSpeedDisplay(value);
    });

    this.confirmCancel.addEventListener('click', () => {
      this.hideResetConfirm();
    });

    this.confirmOk.addEventListener('click', () => {
      this.hideResetConfirm();
      if (this.onReset) this.onReset();
    });
  }

  togglePlayPauseUI(isRunning: boolean): void {
    if (isRunning) {
      this.playPauseBtn.textContent = '暂停';
      this.playPauseBtn.classList.remove('btn-play');
      this.playPauseBtn.classList.add('btn-pause');
    } else {
      this.playPauseBtn.textContent = '开始';
      this.playPauseBtn.classList.remove('btn-pause');
      this.playPauseBtn.classList.add('btn-play');
    }
  }

  updateSpeedDisplay(speed: number): void {
    this.speedValueEl.textContent = `${speed.toFixed(1)}x`;
  }

  updateCounts(counts: { plants: number; herbivores: number; carnivores: number }): void {
    this.plantCountEl.textContent = String(counts.plants);
    this.herbivoreCountEl.textContent = String(counts.herbivores);
    this.carnivoreCountEl.textContent = String(counts.carnivores);
  }

  updateTimer(simulationTimeMs: number): void {
    const totalSeconds = Math.floor(simulationTimeMs / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    this.timerEl.textContent =
      `${String(hours).padStart(2, '0')}:` +
      `${String(minutes).padStart(2, '0')}:` +
      `${String(seconds).padStart(2, '0')}`;
  }

  updateBarChart(): void {
    const predation = this.ecosystem.predationCount;
    const grazing = this.ecosystem.grazingCount;
    const maxVal = Math.max(predation, grazing, 1);
    const maxBarHeight = 58;

    const predationHeight = Math.max(2, (predation / maxVal) * maxBarHeight);
    const grazingHeight = Math.max(2, (grazing / maxVal) * maxBarHeight);

    this.predationBar.style.height = `${predationHeight}px`;
    this.grazingBar.style.height = `${grazingHeight}px`;
    this.predationValue.textContent = String(predation);
    this.grazingValue.textContent = String(grazing);
  }

  showWarning(species: SpeciesName): void {
    this.warningEl.textContent = `⚠️ ${species}濒临灭绝！`;
    this.warningEl.classList.add('visible');

    if (this.warningTimeout !== null) {
      window.clearTimeout(this.warningTimeout);
    }
    this.warningTimeout = window.setTimeout(() => {
      this.warningEl.classList.remove('visible');
      this.warningTimeout = null;
    }, WARNING_DURATION);
  }

  showResetConfirm(): void {
    this.confirmModal.classList.add('visible');
  }

  hideResetConfirm(): void {
    this.confirmModal.classList.remove('visible');
  }
}
