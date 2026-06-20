import { eventBus } from './eventBus';
import type { PlantState } from './plant';

export function initGeneEditor(state: PlantState): void {
  const lightSlider = document.getElementById('light-slider') as HTMLInputElement;
  const waterSlider = document.getElementById('water-slider') as HTMLInputElement;
  const nutrientSlider = document.getElementById('nutrient-slider') as HTMLInputElement;

  const lightValue = document.getElementById('light-value') as HTMLSpanElement;
  const waterValue = document.getElementById('water-value') as HTMLSpanElement;
  const nutrientValue = document.getElementById('nutrient-value') as HTMLSpanElement;

  const lightText = document.getElementById('light-text') as HTMLSpanElement;
  const waterText = document.getElementById('water-text') as HTMLSpanElement;
  const nutrientText = document.getElementById('nutrient-text') as HTMLSpanElement;

  const geneEditBtn = document.getElementById('gene-edit-btn') as HTMLButtonElement;
  const modalOverlay = document.getElementById('modal-overlay') as HTMLDivElement;
  const modalClose = document.getElementById('modal-close') as HTMLButtonElement;

  const geneColor = document.getElementById('gene-color') as HTMLInputElement;
  const geneShape = document.getElementById('gene-shape') as HTMLInputElement;
  const geneSpeed = document.getElementById('gene-speed') as HTMLInputElement;

  function updateSliderDisplay(): void {
    lightValue.textContent = String(state.light);
    waterValue.textContent = String(state.water);
    nutrientValue.textContent = String(state.nutrient);
    lightText.textContent = String(state.light);
    waterText.textContent = String(state.water);
    nutrientText.textContent = String(state.nutrient);
  }

  updateSliderDisplay();

  lightSlider.addEventListener('input', () => {
    state.light = Number(lightSlider.value);
    updateSliderDisplay();
    eventBus.emit('env:change', state);
  });

  waterSlider.addEventListener('input', () => {
    state.water = Number(waterSlider.value);
    updateSliderDisplay();
    eventBus.emit('env:change', state);
  });

  nutrientSlider.addEventListener('input', () => {
    state.nutrient = Number(nutrientSlider.value);
    updateSliderDisplay();
    eventBus.emit('env:change', state);
  });

  geneEditBtn.addEventListener('click', () => {
    geneColor.checked = state.genes.colorMutation;
    geneShape.checked = state.genes.shapeMutation;
    geneSpeed.checked = state.genes.speedMutation;
    modalOverlay.classList.add('active');
  });

  modalClose.addEventListener('click', () => {
    modalOverlay.classList.remove('active');
  });

  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) {
      modalOverlay.classList.remove('active');
    }
  });

  geneColor.addEventListener('change', () => {
    state.genes.colorMutation = geneColor.checked;
    eventBus.emit('gene:colorMutation', geneColor.checked);
    eventBus.emit('env:change', state);
    modalOverlay.classList.remove('active');
  });

  geneShape.addEventListener('change', () => {
    state.genes.shapeMutation = geneShape.checked;
    eventBus.emit('gene:shapeMutation', geneShape.checked);
    eventBus.emit('env:change', state);
    modalOverlay.classList.remove('active');
  });

  geneSpeed.addEventListener('change', () => {
    state.genes.speedMutation = geneSpeed.checked;
    eventBus.emit('gene:speedMutation', geneSpeed.checked);
    eventBus.emit('env:change', state);
    modalOverlay.classList.remove('active');
  });
}
