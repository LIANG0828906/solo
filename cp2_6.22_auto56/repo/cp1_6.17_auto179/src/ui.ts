import {
  BuildingStyle,
  BuildingData,
  generateBuildings,
  startGrowthAnimation,
  pauseGrowthAnimation,
  resumeGrowthAnimation,
  setGrowthProgress,
  isAnimationPlaying,
  getGrowthProgress,
  highlightBuilding,
  clearHighlight,
  removeBuilding,
  transitionStyle,
  getBuildings,
} from './cityBuilder';

let controlPanel: HTMLDivElement;
let playbackBar: HTMLDivElement;
let infoCard: HTMLDivElement | null = null;
let selectedBuilding: BuildingData | null = null;

let heightSlider: HTMLInputElement;
let densitySlider: HTMLInputElement;
let styleSelect: HTMLSelectElement;
let heightValue: HTMLSpanElement;
let densityValue: HTMLSpanElement;
let progressSlider: HTMLInputElement;
let yearDisplay: HTMLSpanElement;
let playBtn: HTMLButtonElement;

let currentHeight = 50;
let currentDensity = 0.5;
let currentStyle: BuildingStyle = 'modern-glass';
let hasGenerated = false;

export function initUI(): void {
  createControlPanel();
  createPlaybackBar();
  applyInitialBuildings();
}

function createControlPanel(): void {
  controlPanel = document.createElement('div');
  controlPanel.id = 'control-panel';
  Object.assign(controlPanel.style, {
    position: 'fixed',
    top: '20px',
    left: '20px',
    width: '320px',
    background: 'rgba(30, 30, 46, 0.85)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    borderRadius: '16px',
    padding: '24px',
    zIndex: '100',
    border: '1px solid rgba(124, 77, 255, 0.15)',
    boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
    transition: 'transform 0.2s ease',
  });

  const title = document.createElement('div');
  Object.assign(title.style, {
    fontSize: '18px',
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: '8px',
    letterSpacing: '0.5px',
  });
  title.textContent = '城市天际线控制台';
  controlPanel.appendChild(title);

  const subtitle = document.createElement('div');
  Object.assign(subtitle.style, {
    fontSize: '12px',
    color: 'rgba(255,255,255,0.45)',
    marginBottom: '24px',
  });
  subtitle.textContent = '调整参数，塑造未来城市';
  controlPanel.appendChild(subtitle);

  heightSlider = createSlider(
    '建筑高度',
    10, 100, 5, currentHeight,
    'height',
    (val) => {
      currentHeight = val;
      heightValue.textContent = String(val);
      applyInitialBuildings();
    }
  );
  heightValue = controlPanel.querySelector('#height-value') as HTMLSpanElement;

  densitySlider = createSlider(
    '建筑密度',
    2, 10, 1, currentDensity * 10,
    'density',
    (val) => {
      currentDensity = val / 10;
      densityValue.textContent = currentDensity.toFixed(1);
      applyInitialBuildings();
    }
  );
  densityValue = controlPanel.querySelector('#density-value') as HTMLSpanElement;

  const styleGroup = createStyleSelect();
  controlPanel.appendChild(styleGroup);

  const generateBtn = document.createElement('button');
  Object.assign(generateBtn.style, {
    width: '100%',
    height: '42px',
    background: 'linear-gradient(135deg, #7C4DFF, #536DFE)',
    border: 'none',
    borderRadius: '10px',
    color: '#ffffff',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    marginTop: '20px',
    transition: 'all 0.2s ease',
    letterSpacing: '1px',
  });
  generateBtn.textContent = '重新生成城市';
  generateBtn.addEventListener('mouseenter', () => {
    generateBtn.style.transform = 'scale(0.97)';
    generateBtn.style.boxShadow = '0 4px 20px rgba(124,77,255,0.4)';
  });
  generateBtn.addEventListener('mouseleave', () => {
    generateBtn.style.transform = 'scale(1)';
    generateBtn.style.boxShadow = 'none';
  });
  generateBtn.addEventListener('mousedown', () => {
    generateBtn.style.transform = 'scale(0.95)';
  });
  generateBtn.addEventListener('mouseup', () => {
    generateBtn.style.transform = 'scale(0.97)';
  });
  generateBtn.addEventListener('click', () => {
    applyInitialBuildings();
  });
  controlPanel.appendChild(generateBtn);

  document.body.appendChild(controlPanel);
}

function createSlider(
  label: string,
  min: number, max: number, step: number, value: number,
  id: string,
  onChange: (val: number) => void
): HTMLInputElement {
  const group = document.createElement('div');
  Object.assign(group.style, {
    marginBottom: '20px',
  });

  const header = document.createElement('div');
  Object.assign(header.style, {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '10px',
  });

  const labelEl = document.createElement('span');
  Object.assign(labelEl.style, {
    fontSize: '13px',
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '500',
  });
  labelEl.textContent = label;

  const valEl = document.createElement('span');
  valEl.id = `${id}-value`;
  Object.assign(valEl.style, {
    fontSize: '13px',
    color: '#7C4DFF',
    fontWeight: '700',
    minWidth: '30px',
    textAlign: 'right',
  });
  valEl.textContent = id === 'density' ? (value / 10).toFixed(1) : String(value);

  header.appendChild(labelEl);
  header.appendChild(valEl);
  group.appendChild(header);

  const sliderContainer = document.createElement('div');
  Object.assign(sliderContainer.style, {
    position: 'relative',
    height: '24px',
    display: 'flex',
    alignItems: 'center',
  });

  const track = document.createElement('div');
  Object.assign(track.style, {
    position: 'absolute',
    width: '100%',
    height: '4px',
    background: '#3A3A4E',
    borderRadius: '2px',
  });
  sliderContainer.appendChild(track);

  const fill = document.createElement('div');
  fill.id = `${id}-fill`;
  const pct = ((value - min) / (max - min)) * 100;
  Object.assign(fill.style, {
    position: 'absolute',
    width: `${pct}%`,
    height: '4px',
    background: 'linear-gradient(90deg, #7C4DFF, #536DFE)',
    borderRadius: '2px',
    pointerEvents: 'none',
  });
  sliderContainer.appendChild(fill);

  const input = document.createElement('input');
  input.type = 'range';
  input.min = String(min);
  input.max = String(max);
  input.step = String(step);
  input.value = String(value);
  Object.assign(input.style, {
    position: 'absolute',
    width: '100%',
    height: '24px',
    appearance: 'none',
    WebkitAppearance: 'none',
    background: 'transparent',
    cursor: 'pointer',
    margin: '0',
    zIndex: '2',
  });

  input.addEventListener('input', () => {
    const v = Number(input.value);
    const fillEl = document.getElementById(`${id}-fill`);
    if (fillEl) {
      const percentage = ((v - min) / (max - min)) * 100;
      fillEl.style.width = `${percentage}%`;
    }
    onChange(v);
  });

  sliderContainer.appendChild(input);
  group.appendChild(sliderContainer);
  controlPanel.appendChild(group);

  const styleEl = document.createElement('style');
  styleEl.textContent = `
    input[type="range"]::-webkit-slider-thumb {
      -webkit-appearance: none;
      width: 16px;
      height: 16px;
      border-radius: 50%;
      background: #7C4DFF;
      box-shadow: 0 0 10px rgba(124,77,255,0.6), 0 0 20px rgba(124,77,255,0.3);
      cursor: pointer;
      transition: transform 0.15s ease, box-shadow 0.15s ease;
    }
    input[type="range"]::-webkit-slider-thumb:hover {
      transform: scale(1.2);
      box-shadow: 0 0 14px rgba(124,77,255,0.8), 0 0 28px rgba(124,77,255,0.4);
    }
    input[type="range"]::-moz-range-thumb {
      width: 16px;
      height: 16px;
      border-radius: 50%;
      background: #7C4DFF;
      box-shadow: 0 0 10px rgba(124,77,255,0.6);
      cursor: pointer;
      border: none;
    }
  `;
  if (!document.getElementById('slider-styles')) {
    styleEl.id = 'slider-styles';
    document.head.appendChild(styleEl);
  }

  return input;
}

function createStyleSelect(): HTMLDivElement {
  const group = document.createElement('div');
  Object.assign(group.style, {
    marginBottom: '8px',
  });

  const labelEl = document.createElement('div');
  Object.assign(labelEl.style, {
    fontSize: '13px',
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '500',
    marginBottom: '10px',
  });
  labelEl.textContent = '建筑风格';
  group.appendChild(labelEl);

  styleSelect = document.createElement('select');
  Object.assign(styleSelect.style, {
    width: '100%',
    height: '40px',
    background: '#2A2A3C',
    border: '1px solid rgba(124,77,255,0.2)',
    borderRadius: '10px',
    color: '#ffffff',
    fontSize: '13px',
    padding: '0 14px',
    cursor: 'pointer',
    outline: 'none',
    appearance: 'none',
    WebkitAppearance: 'none',
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%237C4DFF' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 14px center',
    transition: 'border-color 0.2s ease',
  });

  const styles: { value: BuildingStyle; label: string }[] = [
    { value: 'modern-glass', label: '现代玻璃' },
    { value: 'classical-stone', label: '古典石砌' },
    { value: 'future-streamline', label: '未来流线' },
  ];

  styles.forEach(s => {
    const opt = document.createElement('option');
    opt.value = s.value;
    opt.textContent = s.label;
    styleSelect.appendChild(opt);
  });

  styleSelect.addEventListener('focus', () => {
    styleSelect.style.borderColor = 'rgba(124,77,255,0.5)';
  });
  styleSelect.addEventListener('blur', () => {
    styleSelect.style.borderColor = 'rgba(124,77,255,0.2)';
  });
  styleSelect.addEventListener('change', () => {
    currentStyle = styleSelect.value as BuildingStyle;
    transitionStyle(currentStyle);
  });

  group.appendChild(styleSelect);
  return group;
}

function createPlaybackBar(): void {
  playbackBar = document.createElement('div');
  Object.assign(playbackBar.style, {
    position: 'fixed',
    bottom: '30px',
    left: '20px',
    width: '320px',
    height: '40px',
    background: '#2A2A3C',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    padding: '0 12px',
    gap: '10px',
    zIndex: '100',
    boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
  });

  playBtn = document.createElement('button');
  Object.assign(playBtn.style, {
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    background: '#7C4DFF',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: '0',
    transition: 'all 0.15s ease',
    boxShadow: '0 2px 8px rgba(124,77,255,0.4)',
  });
  playBtn.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="white" stroke="none">
    <polygon points="5,3 19,12 5,21"></polygon>
  </svg>`;
  playBtn.addEventListener('click', togglePlay);
  playBtn.addEventListener('mouseenter', () => {
    playBtn.style.transform = 'scale(1.1)';
    playBtn.style.boxShadow = '0 2px 14px rgba(124,77,255,0.6)';
  });
  playBtn.addEventListener('mouseleave', () => {
    playBtn.style.transform = 'scale(1)';
    playBtn.style.boxShadow = '0 2px 8px rgba(124,77,255,0.4)';
  });
  playbackBar.appendChild(playBtn);

  const progressContainer = document.createElement('div');
  Object.assign(progressContainer.style, {
    position: 'relative',
    width: '180px',
    height: '24px',
    display: 'flex',
    alignItems: 'center',
    flexShrink: '0',
  });

  const progressTrack = document.createElement('div');
  Object.assign(progressTrack.style, {
    position: 'absolute',
    width: '100%',
    height: '4px',
    background: '#3A3A4E',
    borderRadius: '2px',
  });
  progressContainer.appendChild(progressTrack);

  const progressFill = document.createElement('div');
  progressFill.id = 'progress-fill';
  Object.assign(progressFill.style, {
    position: 'absolute',
    width: '0%',
    height: '4px',
    background: '#7C4DFF',
    borderRadius: '2px',
    pointerEvents: 'none',
  });
  progressContainer.appendChild(progressFill);

  progressSlider = document.createElement('input');
  progressSlider.type = 'range';
  progressSlider.min = '0';
  progressSlider.max = '100';
  progressSlider.step = '0.1';
  progressSlider.value = '0';
  Object.assign(progressSlider.style, {
    position: 'absolute',
    width: '100%',
    height: '24px',
    appearance: 'none',
    WebkitAppearance: 'none',
    background: 'transparent',
    cursor: 'pointer',
    margin: '0',
    zIndex: '2',
  });

  progressSlider.addEventListener('input', () => {
    const prog = Number(progressSlider.value) / 100;
    const fillEl = document.getElementById('progress-fill');
    if (fillEl) fillEl.style.width = `${progressSlider.value}%`;
    setGrowthProgress(prog, (p, y) => {
      yearDisplay.textContent = `${y}年`;
    });
  });

  progressContainer.appendChild(progressSlider);
  playbackBar.appendChild(progressContainer);

  yearDisplay = document.createElement('span');
  Object.assign(yearDisplay.style, {
    fontSize: '13px',
    color: '#ffffff',
    fontWeight: '600',
    whiteSpace: 'nowrap',
    flexShrink: '0',
  });
  yearDisplay.textContent = '2024年';
  playbackBar.appendChild(yearDisplay);

  document.body.appendChild(playbackBar);
}

function togglePlay(): void {
  if (!hasGenerated) {
    hasGenerated = true;
    applyInitialBuildings();
  }

  if (isAnimationPlaying()) {
    pauseGrowthAnimation();
    playBtn.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="white" stroke="none">
      <polygon points="5,3 19,12 5,21"></polygon>
    </svg>`;
  } else {
    const progress = getGrowthProgress();
    if (progress >= 1) {
      applyInitialBuildings();
    }
    if (!hasGenerated || progress === 0) {
      startGrowthAnimation((prog, year) => {
        updateProgressUI(prog, year);
      });
    } else {
      resumeGrowthAnimation();
    }
    playBtn.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="white" stroke="none">
      <rect x="5" y="3" width="5" height="18"></rect>
      <rect x="14" y="3" width="5" height="18"></rect>
    </svg>`;
  }
}

function updateProgressUI(progress: number, year: number): void {
  const fillEl = document.getElementById('progress-fill');
  if (fillEl) fillEl.style.width = `${progress * 100}%`;
  progressSlider.value = String(progress * 100);
  yearDisplay.textContent = `${year}年`;
}

function applyInitialBuildings(): void {
  hasGenerated = true;
  generateBuildings(currentHeight, currentDensity, currentStyle);

  buildingsVisible(true);

  startGrowthAnimation((progress, year) => {
    updateProgressUI(progress, year);
  });

  playBtn.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="white" stroke="none">
    <rect x="5" y="3" width="5" height="18"></rect>
    <rect x="14" y="3" width="5" height="18"></rect>
  </svg>`;
}

function buildingsVisible(visible: boolean): void {
  const bldgs = getBuildings();
  bldgs.forEach(b => {
    b.group.visible = visible;
  });
}

export function showInfoCard(building: BuildingData): void {
  selectedBuilding = building;
  highlightBuilding(building);

  if (infoCard) {
    document.body.removeChild(infoCard);
  }

  infoCard = document.createElement('div');
  Object.assign(infoCard.style, {
    position: 'fixed',
    bottom: '90px',
    right: '20px',
    width: '240px',
    background: 'rgba(26, 26, 46, 0.95)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    borderRadius: '12px',
    border: '1px solid #7C4DFF',
    padding: '20px',
    zIndex: '100',
    boxShadow: '0 8px 32px rgba(124,77,255,0.2)',
    transform: 'scale(0.9)',
    opacity: '0',
    transition: 'transform 0.25s ease, opacity 0.25s ease',
  });

  const nameEl = document.createElement('div');
  Object.assign(nameEl.style, {
    fontSize: '16px',
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: '14px',
  });
  nameEl.textContent = building.name;
  infoCard.appendChild(nameEl);

  const styleLabels: Record<BuildingStyle, string> = {
    'modern-glass': '现代玻璃',
    'classical-stone': '古典石砌',
    'future-streamline': '未来流线',
  };

  const infoItems = [
    { label: '楼层数', value: `${building.floors}层` },
    { label: '高度', value: `${building.height.toFixed(1)}m` },
    { label: '风格', value: styleLabels[building.style] },
  ];

  infoItems.forEach(item => {
    const row = document.createElement('div');
    Object.assign(row.style, {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '6px 0',
      borderBottom: '1px solid rgba(255,255,255,0.06)',
    });

    const lbl = document.createElement('span');
    Object.assign(lbl.style, {
      fontSize: '12px',
      color: 'rgba(255,255,255,0.5)',
    });
    lbl.textContent = item.label;

    const val = document.createElement('span');
    Object.assign(val.style, {
      fontSize: '12px',
      color: '#FFD54F',
      fontWeight: '600',
    });
    val.textContent = item.value;

    row.appendChild(lbl);
    row.appendChild(val);
    infoCard.appendChild(row);
  });

  const btnGroup = document.createElement('div');
  Object.assign(btnGroup.style, {
    display: 'flex',
    gap: '8px',
    marginTop: '16px',
  });

  const editBtn = document.createElement('button');
  Object.assign(editBtn.style, {
    flex: '1',
    height: '34px',
    background: 'rgba(124,77,255,0.15)',
    border: '1px solid rgba(124,77,255,0.4)',
    borderRadius: '8px',
    color: '#7C4DFF',
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  });
  editBtn.textContent = '修改参数';
  editBtn.addEventListener('mouseenter', () => {
    editBtn.style.background = 'rgba(124,77,255,0.25)';
  });
  editBtn.addEventListener('mouseleave', () => {
    editBtn.style.background = 'rgba(124,77,255,0.15)';
  });
  editBtn.addEventListener('mousedown', () => {
    editBtn.style.transform = 'scale(0.95)';
  });
  editBtn.addEventListener('mouseup', () => {
    editBtn.style.transform = 'scale(1)';
  });
  editBtn.addEventListener('click', () => {
    controlPanel.style.boxShadow = '0 0 40px rgba(124,77,255,0.5)';
    setTimeout(() => {
      controlPanel.style.boxShadow = '0 8px 32px rgba(0,0,0,0.4)';
    }, 800);
  });
  btnGroup.appendChild(editBtn);

  const demolishBtn = document.createElement('button');
  Object.assign(demolishBtn.style, {
    flex: '1',
    height: '34px',
    background: 'rgba(255,82,82,0.15)',
    border: '1px solid rgba(255,82,82,0.4)',
    borderRadius: '8px',
    color: '#FF5252',
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  });
  demolishBtn.textContent = '拆除建筑';
  demolishBtn.addEventListener('mouseenter', () => {
    demolishBtn.style.background = 'rgba(255,82,82,0.25)';
  });
  demolishBtn.addEventListener('mouseleave', () => {
    demolishBtn.style.background = 'rgba(255,82,82,0.15)';
  });
  demolishBtn.addEventListener('mousedown', () => {
    demolishBtn.style.transform = 'scale(0.95)';
  });
  demolishBtn.addEventListener('mouseup', () => {
    demolishBtn.style.transform = 'scale(1)';
  });
  demolishBtn.addEventListener('click', () => {
    if (selectedBuilding) {
      removeBuilding(selectedBuilding, () => {
        hideInfoCard();
      });
      selectedBuilding = null;
    }
  });
  btnGroup.appendChild(demolishBtn);

  infoCard.appendChild(btnGroup);
  document.body.appendChild(infoCard);

  requestAnimationFrame(() => {
    if (infoCard) {
      infoCard.style.transform = 'scale(1)';
      infoCard.style.opacity = '1';
    }
  });
}

export function hideInfoCard(): void {
  clearHighlight();
  selectedBuilding = null;
  if (infoCard) {
    infoCard.style.transform = 'scale(0.9)';
    infoCard.style.opacity = '0';
    setTimeout(() => {
      if (infoCard && infoCard.parentNode) {
        document.body.removeChild(infoCard);
        infoCard = null;
      }
    }, 250);
  }
}

export { controlPanel, playbackBar };
