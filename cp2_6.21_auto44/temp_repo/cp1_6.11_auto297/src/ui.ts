import { WindField } from './wind';

export function setupUI(windField: WindField): {
  getLanternCount: () => number;
  getBuoyancy: () => number;
  onLaunch: (cb: () => void) => void;
  onReset: (cb: () => void) => void;
} {
  const countSlider = document.getElementById('lantern-count') as HTMLInputElement;
  const countValue = document.getElementById('count-value') as HTMLSpanElement;
  const strengthSlider = document.getElementById('wind-strength') as HTMLInputElement;
  const strengthValue = document.getElementById('strength-value') as HTMLSpanElement;
  const buoyancySlider = document.getElementById('buoyancy-coeff') as HTMLInputElement;
  const buoyancyValue = document.getElementById('buoyancy-value') as HTMLSpanElement;
  const directionValue = document.getElementById('direction-value') as HTMLSpanElement;
  const windNeedle = document.getElementById('wind-needle') as HTMLDivElement;
  const windRing = document.getElementById('wind-direction-ring') as HTMLDivElement;
  const launchBtn = document.getElementById('launch-btn') as HTMLButtonElement;
  const toggleBtn = document.getElementById('toggle-panel-btn') as HTMLButtonElement;
  const uiPanel = document.getElementById('ui-panel') as HTMLDivElement;

  countSlider.addEventListener('input', () => {
    countValue.textContent = countSlider.value;
  });

  strengthSlider.addEventListener('input', () => {
    strengthValue.textContent = strengthSlider.value;
    windField.setStrength(parseFloat(strengthSlider.value));
  });

  buoyancySlider.addEventListener('input', () => {
    buoyancyValue.textContent = parseFloat(buoyancySlider.value).toFixed(1);
  });

  let isDragging = false;

  function updateWindDirection(e: MouseEvent | TouchEvent): void {
    const rect = windRing.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    let clientX: number, clientY: number;

    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const dx = clientX - cx;
    const dy = clientY - cy;
    let angle = Math.atan2(dx, -dy) * (180 / Math.PI);
    if (angle < 0) angle += 360;

    windField.setDirection(angle);
    directionValue.textContent = `${Math.round(angle)}°`;
    windNeedle.style.transform = `translate(-50%, -100%) rotate(${angle}deg)`;
  }

  windRing.addEventListener('mousedown', (e) => {
    isDragging = true;
    updateWindDirection(e);
  });

  windRing.addEventListener('touchstart', (e) => {
    isDragging = true;
    updateWindDirection(e);
    e.preventDefault();
  }, { passive: false });

  window.addEventListener('mousemove', (e) => {
    if (isDragging) updateWindDirection(e);
  });

  window.addEventListener('touchmove', (e) => {
    if (isDragging) updateWindDirection(e);
  }, { passive: true });

  window.addEventListener('mouseup', () => { isDragging = false; });
  window.addEventListener('touchend', () => { isDragging = false; });

  let launchCallback: (() => void) | null = null;
  let resetCallback: (() => void) | null = null;

  launchBtn.addEventListener('click', () => {
    if (launchCallback) launchCallback();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'r' || e.key === 'R') {
      if (resetCallback) resetCallback();
    }
  });

  toggleBtn.addEventListener('click', () => {
    uiPanel.classList.toggle('collapsed');
    toggleBtn.textContent = uiPanel.classList.contains('collapsed') ? '☰ 控制面板' : '✕ 关闭';
  });

  return {
    getLanternCount: () => parseInt(countSlider.value, 10),
    getBuoyancy: () => parseFloat(buoyancySlider.value),
    onLaunch: (cb) => { launchCallback = cb; },
    onReset: (cb) => { resetCallback = cb; },
  };
}
