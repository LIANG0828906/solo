import type { MoleculeName } from './moleculeFactory';
import { colorToHex, getAtomType } from './moleculeFactory';

export interface UICallbacks {
  onMoleculeChange: (name: MoleculeName) => void;
  onSpeedChange: (speed: number) => void;
  onReset: () => void;
}

export class UI {
  private moleculeSelect: HTMLSelectElement;
  private speedSlider: HTMLInputElement;
  private speedValue: HTMLSpanElement;
  private resetBtn: HTMLButtonElement;
  private infoPanel: HTMLDivElement;
  private atomName: HTMLSpanElement;
  private atomColorDot: HTMLSpanElement;
  private atomColorHex: HTMLSpanElement;
  private atomRadius: HTMLSpanElement;
  private callbacks: UICallbacks;

  constructor(callbacks: UICallbacks) {
    this.callbacks = callbacks;
    this.moleculeSelect = document.getElementById('molecule-select') as HTMLSelectElement;
    this.speedSlider = document.getElementById('speed-slider') as HTMLInputElement;
    this.speedValue = document.getElementById('speed-value') as HTMLSpanElement;
    this.resetBtn = document.getElementById('reset-btn') as HTMLButtonElement;
    this.infoPanel = document.getElementById('info-panel') as HTMLDivElement;
    this.atomName = document.getElementById('atom-name') as HTMLSpanElement;
    this.atomColorDot = document.getElementById('atom-color-dot') as HTMLSpanElement;
    this.atomColorHex = document.getElementById('atom-color-hex') as HTMLSpanElement;
    this.atomRadius = document.getElementById('atom-radius') as HTMLSpanElement;
    this.bindEvents();
  }

  private bindEvents(): void {
    this.moleculeSelect.addEventListener('change', (e) => {
      const target = e.target as HTMLSelectElement;
      this.callbacks.onMoleculeChange(target.value as MoleculeName);
    });

    this.speedSlider.addEventListener('input', (e) => {
      const target = e.target as HTMLInputElement;
      const value = parseInt(target.value, 10);
      this.speedValue.textContent = String(value);
      this.callbacks.onSpeedChange(value);
    });

    this.resetBtn.addEventListener('click', () => {
      this.callbacks.onReset();
    });
  }

  getCurrentMolecule(): MoleculeName {
    return this.moleculeSelect.value as MoleculeName;
  }

  getCurrentSpeed(): number {
    return parseInt(this.speedSlider.value, 10);
  }

  showAtomInfo(atomType: string): void {
    const type = getAtomType(atomType);
    this.atomName.textContent = type.name;
    this.atomColorDot.style.backgroundColor = colorToHex(type.color);
    this.atomColorHex.textContent = colorToHex(type.color);
    this.atomRadius.textContent = type.radius.toFixed(2);
    this.infoPanel.classList.add('visible');
  }

  hideAtomInfo(): void {
    this.infoPanel.classList.remove('visible');
  }
}
