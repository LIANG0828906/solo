import type { ForceParams, ParticleType } from './types';

export function initUI(
  forceParams: ForceParams,
  onReset: () => void,
  onSpawnTypeChange: (type: ParticleType) => void
): void {
  const gravitySlider = document.getElementById('gravitySlider') as HTMLInputElement;
  const repulsionSlider = document.getElementById('repulsionSlider') as HTMLInputElement;
  const turbulenceSlider = document.getElementById('turbulenceSlider') as HTMLInputElement;
  const resetBtn = document.getElementById('resetBtn') as HTMLButtonElement;
  const spawnBtns = document.querySelectorAll('.spawn-btn') as NodeListOf<HTMLButtonElement>;

  gravitySlider.addEventListener('input', () => {
    forceParams.gravityStrength = parseFloat(gravitySlider.value);
    updateSliderThumbColor(gravitySlider, 0.1, 2.0);
  });

  repulsionSlider.addEventListener('input', () => {
    forceParams.repulsionRadius = parseFloat(repulsionSlider.value);
    updateSliderThumbColor(repulsionSlider, 20, 160);
  });

  turbulenceSlider.addEventListener('input', () => {
    forceParams.turbulenceAmplitude = parseFloat(turbulenceSlider.value);
    updateSliderThumbColor(turbulenceSlider, 0, 2);
  });

  resetBtn.addEventListener('click', () => {
    onReset();
  });

  spawnBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      spawnBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      const type = btn.dataset.type as ParticleType;
      onSpawnTypeChange(type);
    });
  });

  updateSliderThumbColor(gravitySlider, 0.1, 2.0);
  updateSliderThumbColor(repulsionSlider, 20, 160);
  updateSliderThumbColor(turbulenceSlider, 0, 2);
}

function updateSliderThumbColor(slider: HTMLInputElement, min: number, max: number): void {
  const value = parseFloat(slider.value);
  const ratio = (value - min) / (max - min);
  const hue = 210 + ratio * 120;
  const color = `hsl(${hue}, 80%, 60%)`;
  slider.style.setProperty('--thumb-color', color);

  const styleId = 'slider-dynamic-style';
  let styleEl = document.getElementById(styleId) as HTMLStyleElement | null;
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = styleId;
    document.head.appendChild(styleEl);
  }

  const sliders = document.querySelectorAll('.control-group input[type="range"]');
  let css = '';
  sliders.forEach((s, i) => {
    const input = s as HTMLInputElement;
    const val = parseFloat(input.value);
    const minVal = parseFloat(input.min);
    const maxVal = parseFloat(input.max);
    const r = (val - minVal) / (maxVal - minVal);
    const h = 210 + r * 120;
    const c = `hsl(${h}, 80%, 60%)`;
    css += `
      .control-group:nth-of-type(${i + 1}) input[type="range"]::-webkit-slider-thumb { background: ${c}; }
      .control-group:nth-of-type(${i + 1}) input[type="range"]::-moz-range-thumb { background: ${c}; }
    `;
  });
  styleEl.textContent = css;
}

export function updateStats(
  particles: { type: string; health: number }[],
  splitRate: number,
  eatRate: number
): void {
  const totalCount = document.getElementById('totalCount');
  const producerCount = document.getElementById('producerCount');
  const consumerCount = document.getElementById('consumerCount');
  const hunterCount = document.getElementById('hunterCount');
  const avgHealth = document.getElementById('avgHealth');
  const splitRateEl = document.getElementById('splitRate');
  const eatRateEl = document.getElementById('eatRate');

  let producers = 0;
  let consumers = 0;
  let hunters = 0;
  let totalHealth = 0;

  for (const p of particles) {
    totalHealth += p.health;
    if (p.type === 'producer') producers++;
    else if (p.type === 'consumer') consumers++;
    else if (p.type === 'hunter') hunters++;
  }

  const avg = particles.length > 0 ? Math.round(totalHealth / particles.length) : 0;

  if (totalCount) totalCount.textContent = particles.length.toString();
  if (producerCount) producerCount.textContent = producers.toString();
  if (consumerCount) consumerCount.textContent = consumers.toString();
  if (hunterCount) hunterCount.textContent = hunters.toString();
  if (avgHealth) avgHealth.textContent = avg.toString();
  if (splitRateEl) splitRateEl.textContent = splitRate.toFixed(1);
  if (eatRateEl) eatRateEl.textContent = eatRate.toFixed(1);
}
