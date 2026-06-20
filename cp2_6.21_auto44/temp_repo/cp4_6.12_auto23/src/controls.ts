import { GalaxyParams, DEFAULT_PARAMS } from './galaxy';

export type OnParamsChange = (params: GalaxyParams) => void;

export function initControls(onChange: OnParamsChange): void {
  const params = { ...DEFAULT_PARAMS };

  const armsSlider = document.getElementById('arms-slider') as HTMLInputElement;
  const armsValue = document.getElementById('arms-value') as HTMLSpanElement;
  const countSlider = document.getElementById('count-slider') as HTMLInputElement;
  const countValue = document.getElementById('count-value') as HTMLSpanElement;
  const speedSlider = document.getElementById('speed-slider') as HTMLInputElement;
  const speedValue = document.getElementById('speed-value') as HTMLSpanElement;
  const spreadSlider = document.getElementById('spread-slider') as HTMLInputElement;
  const spreadValue = document.getElementById('spread-value') as HTMLSpanElement;
  const color1Input = document.getElementById('color1-input') as HTMLInputElement;
  const color1Btn = document.getElementById('color1-btn') as HTMLDivElement;
  const color2Input = document.getElementById('color2-input') as HTMLInputElement;
  const color2Btn = document.getElementById('color2-btn') as HTMLDivElement;
  const toggleBtn = document.getElementById('toggle-panel-btn') as HTMLButtonElement;
  const panel = document.getElementById('controls-panel') as HTMLDivElement;

  let debounceTimer: ReturnType<typeof setTimeout> | null = null;

  function debouncedOnChange() {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      onChange({ ...params });
    }, 50);
  }

  armsSlider.addEventListener('input', () => {
    params.arms = parseInt(armsSlider.value);
    armsValue.textContent = String(params.arms);
    debouncedOnChange();
  });

  countSlider.addEventListener('input', () => {
    params.count = parseInt(countSlider.value);
    countValue.textContent = String(params.count);
    debouncedOnChange();
  });

  speedSlider.addEventListener('input', () => {
    params.speed = parseFloat(speedSlider.value);
    speedValue.textContent = params.speed.toFixed(3);
    debouncedOnChange();
  });

  spreadSlider.addEventListener('input', () => {
    params.spread = parseFloat(spreadSlider.value);
    spreadValue.textContent = params.spread.toFixed(1);
    debouncedOnChange();
  });

  color1Input.addEventListener('input', () => {
    params.color1 = color1Input.value;
    color1Btn.style.background = color1Input.value;
    debouncedOnChange();
  });

  color2Input.addEventListener('input', () => {
    params.color2 = color2Input.value;
    color2Btn.style.background = color2Input.value;
    debouncedOnChange();
  });

  let mobileOpen = false;
  toggleBtn.addEventListener('click', () => {
    mobileOpen = !mobileOpen;
    if (mobileOpen) {
      panel.classList.add('mobile-open');
    } else {
      panel.classList.remove('mobile-open');
    }
  });
}
