import { NebulaParams } from './particleSystem';
import axios from 'axios';

const API_BASE = 'http://localhost:3001/api';

const scientificPalettes = [
  { name: '宇宙紫蓝', start: '#6a0dad', mid: '#1e90ff', end: '#00ffff' },
  { name: '玫瑰红橙', start: '#ff1493', mid: '#ff6347', end: '#ffa500' },
  { name: '极光青绿', start: '#00ff88', mid: '#00bfff', end: '#4169e1' },
  { name: '火焰金白', start: '#ff4500', mid: '#ffd700', end: '#ffffff' },
  { name: '深海蓝调', start: '#000080', mid: '#0000cd', end: '#4169e1' },
  { name: '薰衣草紫', start: '#9370db', mid: '#ba55d3', end: '#ee82ee' },
  { name: '森林翠绿', start: '#006400', mid: '#228b22', end: '#98fb98' },
  { name: '日落余晖', start: '#ff4500', mid: '#ff6b6b', end: '#ffd93d' },
  { name: '午夜深蓝', start: '#0c0c0c', mid: '#1a1a2e', end: '#4a4a6a' },
  { name: '彩虹光谱', start: '#ff0000', mid: '#ffff00', end: '#00ffff' },
  { name: '星云粉红', start: '#ff69b4', mid: '#ff1493', end: '#c71585' },
  { name: '冰晶蓝白', start: '#00bfff', mid: '#87ceeb', end: '#e0ffff' }
];

interface UIParams {
  shape: 'sphere' | 'torus' | 'spiral';
  density: number;
  rotationSpeed: number;
  particleSize: number;
  attenuation: number;
  pulseAmplitude: number;
  colorStart: string;
  colorMid: string;
  colorEnd: string;
}

export interface UIController {
  getParams: () => NebulaParams;
  onParamsChange: (callback: (params: Partial<NebulaParams>) => void) => void;
  onTemplateLoad: (callback: (params: NebulaParams) => void) => void;
  onReset: (callback: () => void) => void;
  refreshSavedList: () => Promise<void>;
}

const createSlider = (
  label: string,
  min: number,
  max: number,
  value: number,
  step: number,
  onChange: (value: number) => void
): { container: HTMLDivElement; setValue: (v: number) => void } => {
  const container = document.createElement('div');
  container.style.display = 'flex';
  container.style.flexDirection = 'column';
  container.style.gap = '4px';

  const labelRow = document.createElement('div');
  labelRow.style.display = 'flex';
  labelRow.style.justifyContent = 'space-between';
  labelRow.style.alignItems = 'center';

  const labelEl = document.createElement('label');
  labelEl.textContent = label;
  labelEl.style.color = '#ddd';
  labelEl.style.fontSize = '12px';

  const valueEl = document.createElement('span');
  valueEl.textContent = value.toFixed(step < 1 ? 2 : 0);
  valueEl.style.color = '#64b5f6';
  valueEl.style.fontSize = '12px';
  valueEl.style.fontWeight = 'bold';
  valueEl.style.minWidth = '40px';
  valueEl.style.textAlign = 'right';

  labelRow.appendChild(labelEl);
  labelRow.appendChild(valueEl);

  const slider = document.createElement('input');
  slider.type = 'range';
  slider.min = String(min);
  slider.max = String(max);
  slider.step = String(step);
  slider.value = String(value);

  slider.style.appearance = 'none';
  slider.style.width = '100%';
  slider.style.height = '6px';
  slider.style.borderRadius = '3px';
  slider.style.background = 'rgba(255,255,255,0.1)';
  slider.style.outline = 'none';
  slider.style.cursor = 'pointer';

  const style = document.createElement('style');
  style.textContent = `
    input[type="range"]::-webkit-slider-thumb {
      -webkit-appearance: none;
      appearance: none;
      width: 16px;
      height: 16px;
      border-radius: 50%;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      cursor: pointer;
      box-shadow: 0 2px 6px rgba(102, 126, 234, 0.5);
      transition: transform 0.2s;
    }
    input[type="range"]::-webkit-slider-thumb:hover {
      transform: scale(1.2);
    }
    input[type="range"]::-moz-range-thumb {
      width: 16px;
      height: 16px;
      border-radius: 50%;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      cursor: pointer;
      border: none;
      box-shadow: 0 2px 6px rgba(102, 126, 234, 0.5);
    }
  `;
  document.head.appendChild(style);

  slider.addEventListener('input', () => {
    const v = parseFloat(slider.value);
    valueEl.textContent = v.toFixed(step < 1 ? 2 : 0);
    onChange(v);
  });

  container.appendChild(labelRow);
  container.appendChild(slider);

  return {
    container,
    setValue: (v: number) => {
      slider.value = String(v);
      valueEl.textContent = v.toFixed(step < 1 ? 2 : 0);
    }
  };
};

const createColorPalettePicker = (
  initialColors: { start: string; mid: string; end: string },
  onPaletteChange: (colors: { start: string; mid: string; end: string }) => void
): { 
  container: HTMLDivElement; 
  setColors: (colors: { start: string; mid: string; end: string }) => void;
  getColors: () => { start: string; mid: string; end: string };
} => {
  let currentColors = { ...initialColors };

  const container = document.createElement('div');
  container.style.display = 'flex';
  container.style.flexDirection = 'column';
  container.style.gap = '8px';

  const sectionTitle = document.createElement('div');
  sectionTitle.textContent = '颜色调色板';
  sectionTitle.style.fontSize = '11px';
  sectionTitle.style.textTransform = 'uppercase';
  sectionTitle.style.letterSpacing = '1px';
  sectionTitle.style.color = 'rgba(255,255,255,0.5)';
  sectionTitle.style.marginBottom = '4px';
  container.appendChild(sectionTitle);

  const previewRow = document.createElement('div');
  previewRow.style.display = 'flex';
  previewRow.style.gap = '6px';
  previewRow.style.marginBottom = '4px';

  const createColorDot = (color: string, label: string, onChange: (c: string) => void) => {
    const wrapper = document.createElement('div');
    wrapper.style.display = 'flex';
    wrapper.style.flexDirection = 'column';
    wrapper.style.alignItems = 'center';
    wrapper.style.gap = '2px';
    wrapper.style.flex = '1';

    const dot = document.createElement('div');
    dot.style.width = '100%';
    dot.style.height = '28px';
    dot.style.borderRadius = '6px';
    dot.style.background = color;
    dot.style.cursor = 'pointer';
    dot.style.border = '2px solid rgba(255,255,255,0.3)';
    dot.style.transition = 'all 0.2s';
    dot.style.boxShadow = '0 2px 6px rgba(0,0,0,0.3)';

    const labelEl = document.createElement('span');
    labelEl.textContent = label;
    labelEl.style.fontSize = '10px';
    labelEl.style.color = 'rgba(255,255,255,0.6)';

    const pickerPopup = document.createElement('div');
    pickerPopup.style.position = 'absolute';
    pickerPopup.style.zIndex = '1001';
    pickerPopup.style.background = 'rgba(10,10,30,0.98)';
    pickerPopup.style.border = '1px solid rgba(255,255,255,0.2)';
    pickerPopup.style.borderRadius = '10px';
    pickerPopup.style.padding = '12px';
    pickerPopup.style.backdropFilter = 'blur(10px)';
    pickerPopup.style.display = 'none';
    pickerPopup.style.minWidth = '180px';

    const paletteGrid = document.createElement('div');
    paletteGrid.style.display = 'grid';
    paletteGrid.style.gridTemplateColumns = 'repeat(6, 1fr)';
    paletteGrid.style.gap = '4px';
    paletteGrid.style.marginBottom = '10px';

    const quickColors = [
      '#ff0000', '#ff4500', '#ff8c00', '#ffd700', '#ffff00', '#adff2f',
      '#00ff00', '#00fa9a', '#00ffff', '#1e90ff', '#6a0dad', '#ff1493',
      '#ffffff', '#c0c0c0', '#808080', '#404040', '#000000', '#8b4513'
    ];

    quickColors.forEach(c => {
      const colorBtn = document.createElement('button');
      colorBtn.style.width = '100%';
      colorBtn.style.aspectRatio = '1';
      colorBtn.style.borderRadius = '4px';
      colorBtn.style.border = 'none';
      colorBtn.style.background = c;
      colorBtn.style.cursor = 'pointer';
      colorBtn.style.transition = 'transform 0.15s';
      colorBtn.title = c;
      colorBtn.addEventListener('mouseenter', () => {
        colorBtn.style.transform = 'scale(1.15)';
      });
      colorBtn.addEventListener('mouseleave', () => {
        colorBtn.style.transform = 'scale(1)';
      });
      colorBtn.addEventListener('click', () => {
        dot.style.background = c;
        onChange(c);
        pickerPopup.style.display = 'none';
      });
      paletteGrid.appendChild(colorBtn);
    });

    const hexLabel = document.createElement('div');
    hexLabel.textContent = '自定义 HEX:';
    hexLabel.style.fontSize = '11px';
    hexLabel.style.color = 'rgba(255,255,255,0.6)';
    hexLabel.style.marginBottom = '4px';

    const hexInput = document.createElement('input');
    hexInput.type = 'text';
    hexInput.value = color;
    hexInput.placeholder = '#RRGGBB';
    hexInput.style.width = '100%';
    hexInput.style.padding = '6px 10px';
    hexInput.style.borderRadius = '6px';
    hexInput.style.border = '1px solid rgba(255,255,255,0.2)';
    hexInput.style.background = 'rgba(255,255,255,0.1)';
    hexInput.style.color = '#fff';
    hexInput.style.fontSize = '11px';
    hexInput.style.outline = 'none';
    hexInput.style.fontFamily = 'monospace';

    hexInput.addEventListener('change', () => {
      let c = hexInput.value.trim();
      if (!c.startsWith('#')) c = '#' + c;
      if (/^#[0-9A-Fa-f]{6}$/.test(c)) {
        dot.style.background = c;
        onChange(c);
        pickerPopup.style.display = 'none';
      }
    });

    pickerPopup.appendChild(paletteGrid);
    pickerPopup.appendChild(hexLabel);
    pickerPopup.appendChild(hexInput);

    dot.addEventListener('click', (e) => {
      e.stopPropagation();
      document.querySelectorAll('.color-picker-popup').forEach(p => {
        if (p !== pickerPopup) (p as HTMLElement).style.display = 'none';
      });
      const rect = dot.getBoundingClientRect();
      pickerPopup.style.top = `${rect.bottom + 8}px`;
      pickerPopup.style.left = `${rect.left}px`;
      pickerPopup.style.display = pickerPopup.style.display === 'none' ? 'block' : 'none';
      pickerPopup.classList.add('color-picker-popup');
      hexInput.value = dot.style.background.startsWith('#') 
        ? dot.style.background 
        : color;
    });

    document.addEventListener('click', (e) => {
      if (!pickerPopup.contains(e.target as Node) && e.target !== dot) {
        pickerPopup.style.display = 'none';
      }
    });

    document.body.appendChild(pickerPopup);

    wrapper.appendChild(dot);
    wrapper.appendChild(labelEl);
    return { wrapper, dot, setColor: (c: string) => {
      dot.style.background = c;
      hexInput.value = c;
    }};
  };

  const startColor = createColorDot(currentColors.start, '起始', (c) => {
    currentColors.start = c;
    onPaletteChange({ ...currentColors });
  });
  const midColor = createColorDot(currentColors.mid, '中间', (c) => {
    currentColors.mid = c;
    onPaletteChange({ ...currentColors });
  });
  const endColor = createColorDot(currentColors.end, '结束', (c) => {
    currentColors.end = c;
    onPaletteChange({ ...currentColors });
  });

  previewRow.appendChild(startColor.wrapper);
  previewRow.appendChild(midColor.wrapper);
  previewRow.appendChild(endColor.wrapper);

  const gradientBar = document.createElement('div');
  gradientBar.style.height = '20px';
  gradientBar.style.borderRadius = '6px';
  gradientBar.style.background = `linear-gradient(90deg, ${currentColors.start} 0%, ${currentColors.mid} 50%, ${currentColors.end} 100%)`;
  gradientBar.style.marginBottom = '4px';
  gradientBar.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)';

  const presetsLabel = document.createElement('div');
  presetsLabel.textContent = '12种科学可视化配色方案';
  presetsLabel.style.fontSize = '10px';
  presetsLabel.style.color = 'rgba(255,255,255,0.5)';
  presetsLabel.style.marginBottom = '4px';

  const presetsGrid = document.createElement('div');
  presetsGrid.style.display = 'grid';
  presetsGrid.style.gridTemplateColumns = 'repeat(3, 1fr)';
  presetsGrid.style.gap = '6px';

  scientificPalettes.forEach(palette => {
    const presetBtn = document.createElement('button');
    presetBtn.style.display = 'flex';
    presetBtn.style.flexDirection = 'column';
    presetBtn.style.gap = '2px';
    presetBtn.style.padding = '4px';
    presetBtn.style.borderRadius = '6px';
    presetBtn.style.border = '1px solid rgba(255,255,255,0.15)';
    presetBtn.style.background = 'rgba(255,255,255,0.05)';
    presetBtn.style.cursor = 'pointer';
    presetBtn.style.transition = 'all 0.2s';
    presetBtn.title = palette.name;

    const gradient = document.createElement('div');
    gradient.style.height = '16px';
    gradient.style.borderRadius = '4px';
    gradient.style.background = `linear-gradient(90deg, ${palette.start} 0%, ${palette.mid} 50%, ${palette.end} 100%)`;

    const name = document.createElement('span');
    name.textContent = palette.name;
    name.style.fontSize = '9px';
    name.style.color = 'rgba(255,255,255,0.7)';
    name.style.textAlign = 'center';
    name.style.whiteSpace = 'nowrap';
    name.style.overflow = 'hidden';
    name.style.textOverflow = 'ellipsis';

    presetBtn.appendChild(gradient);
    presetBtn.appendChild(name);

    presetBtn.addEventListener('mouseenter', () => {
      presetBtn.style.transform = 'translateY(-2px)';
      presetBtn.style.background = 'rgba(255,255,255,0.1)';
      presetBtn.style.borderColor = 'rgba(102, 126, 234, 0.6)';
    });
    presetBtn.addEventListener('mouseleave', () => {
      presetBtn.style.transform = 'translateY(0)';
      presetBtn.style.background = 'rgba(255,255,255,0.05)';
      presetBtn.style.borderColor = 'rgba(255,255,255,0.15)';
    });

    presetBtn.addEventListener('click', () => {
      currentColors = { start: palette.start, mid: palette.mid, end: palette.end };
      startColor.setColor(palette.start);
      midColor.setColor(palette.mid);
      endColor.setColor(palette.end);
      gradientBar.style.background = `linear-gradient(90deg, ${palette.start} 0%, ${palette.mid} 50%, ${palette.end} 100%)`;
      onPaletteChange({ ...currentColors });
    });

    presetsGrid.appendChild(presetBtn);
  });

  container.appendChild(previewRow);
  container.appendChild(gradientBar);
  container.appendChild(presetsLabel);
  container.appendChild(presetsGrid);

  return {
    container,
    setColors: (colors) => {
      currentColors = { ...colors };
      startColor.setColor(colors.start);
      midColor.setColor(colors.mid);
      endColor.setColor(colors.end);
      gradientBar.style.background = `linear-gradient(90deg, ${colors.start} 0%, ${colors.mid} 50%, ${colors.end} 100%)`;
    },
    getColors: () => ({ ...currentColors })
  };
};

const createButton = (
  text: string,
  onClick: () => void,
  type: 'primary' | 'secondary' = 'primary'
): HTMLButtonElement => {
  const btn = document.createElement('button');
  btn.textContent = text;
  btn.style.padding = '10px 16px';
  btn.style.borderRadius = '8px';
  btn.style.border = type === 'primary' 
    ? '1px solid transparent' 
    : '1px solid rgba(102, 126, 234, 0.5)';
  btn.style.background = type === 'primary'
    ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    : 'transparent';
  btn.style.color = '#fff';
  btn.style.fontSize = '12px';
  btn.style.fontWeight = '600';
  btn.style.cursor = 'pointer';
  btn.style.transition = 'all 0.3s';
  btn.style.boxShadow = type === 'primary' ? '0 4px 12px rgba(102, 126, 234, 0.4)' : 'none';

  btn.addEventListener('mouseenter', () => {
    btn.style.transform = 'translateY(-2px)';
    btn.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.6)';
  });

  btn.addEventListener('mouseleave', () => {
    btn.style.transform = 'translateY(0)';
    btn.style.boxShadow = type === 'primary' ? '0 4px 12px rgba(102, 126, 234, 0.4)' : 'none';
  });

  btn.addEventListener('click', onClick);

  return btn;
};

const createSelect = (
  label: string,
  options: { value: string; label: string }[],
  value: string,
  onChange: (value: string) => void
): { container: HTMLDivElement; setValue: (v: string) => void; recreate: (opts: { value: string; label: string }[], val: string, cb: (v: string) => void) => void } => {
  let currentOnChange = onChange;

  const container = document.createElement('div');
  container.style.display = 'flex';
  container.style.flexDirection = 'column';
  container.style.gap = '4px';

  const labelEl = document.createElement('label');
  labelEl.textContent = label;
  labelEl.style.color = '#ddd';
  labelEl.style.fontSize = '12px';

  const select = document.createElement('select');
  select.style.padding = '8px 12px';
  select.style.borderRadius = '8px';
  select.style.border = '1px solid rgba(255,255,255,0.2)';
  select.style.background = 'rgba(255,255,255,0.1)';
  select.style.color = '#fff';
  select.style.fontSize = '12px';
  select.style.outline = 'none';
  select.style.cursor = 'pointer';
  select.style.width = '100%';

  const rebuild = (opts: { value: string; label: string }[], val: string, cb: (v: string) => void) => {
    select.innerHTML = '';
    opts.forEach(opt => {
      const option = document.createElement('option');
      option.value = opt.value;
      option.textContent = opt.label;
      option.style.background = '#1a1a2e';
      select.appendChild(option);
    });
    select.value = val;
    currentOnChange = cb;
  };

  rebuild(options, value, onChange);

  select.addEventListener('change', () => currentOnChange(select.value));

  container.appendChild(labelEl);
  container.appendChild(select);

  return {
    container,
    setValue: (v: string) => {
      select.value = v;
    },
    recreate: rebuild
  };
};

const showToast = (message: string, type: 'success' | 'error' = 'success') => {
  const toast = document.createElement('div');
  toast.textContent = message;
  toast.style.position = 'fixed';
  toast.style.top = '20px';
  toast.style.left = '50%';
  toast.style.transform = 'translateX(-50%) translateY(-100px)';
  toast.style.background = type === 'success' 
    ? 'rgba(34, 197, 94, 0.9)' 
    : 'rgba(239, 68, 68, 0.9)';
  toast.style.color = '#fff';
  toast.style.padding = '12px 24px';
  toast.style.borderRadius = '8px';
  toast.style.fontSize = '14px';
  toast.style.fontWeight = '500';
  toast.style.zIndex = '9999';
  toast.style.backdropFilter = 'blur(10px)';
  toast.style.boxShadow = '0 4px 20px rgba(0,0,0,0.3)';
  toast.style.transition = 'transform 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55)';

  document.body.appendChild(toast);

  requestAnimationFrame(() => {
    toast.style.transform = 'translateX(-50%) translateY(0)';
  });

  setTimeout(() => {
    toast.style.transform = 'translateX(-50%) translateY(-100px)';
    setTimeout(() => toast.remove(), 300);
  }, 2000);
};

export const createUIController = (
  initialParams: UIParams
): UIController => {
  let params = { ...initialParams };
  let paramsChangeCallback: ((params: Partial<NebulaParams>) => void) | null = null;
  let templateLoadCallback: ((params: NebulaParams) => void) | null = null;
  let resetCallback: (() => void) | null = null;

  const panel = document.createElement('div');
  panel.style.position = 'fixed';
  panel.style.left = '20px';
  panel.style.top = '20px';
  panel.style.width = '280px';
  panel.style.maxHeight = 'calc(100vh - 40px)';
  panel.style.overflowY = 'auto';
  panel.style.background = 'rgba(10,10,30,0.7)';
  panel.style.border = '1px solid rgba(255,255,255,0.2)';
  panel.style.borderRadius = '12px';
  panel.style.backdropFilter = 'blur(8px)';
  panel.style.padding = '20px';
  panel.style.boxShadow = '0 8px 32px rgba(0,0,0,0.4)';
  panel.style.color = '#ddd';
  panel.style.zIndex = '100';
  panel.style.transform = 'translateX(-120%)';
  panel.style.transition = 'transform 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55)';

  const title = document.createElement('h2');
  title.textContent = '✨ 星云生成器';
  title.style.margin = '0 0 16px 0';
  title.style.fontSize = '18px';
  title.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
  title.style.webkitBackgroundClip = 'text';
  title.style.webkitTextFillColor = 'transparent';
  title.style.backgroundClip = 'text';

  const createSection = (name: string) => {
    const div = document.createElement('div');
    div.style.marginBottom = '16px';
    div.style.display = 'flex';
    div.style.flexDirection = 'column';
    div.style.gap = '8px';

    const sectionTitle = document.createElement('div');
    sectionTitle.textContent = name;
    sectionTitle.style.fontSize = '11px';
    sectionTitle.style.textTransform = 'uppercase';
    sectionTitle.style.letterSpacing = '1px';
    sectionTitle.style.color = 'rgba(255,255,255,0.5)';
    sectionTitle.style.marginBottom = '4px';

    div.appendChild(sectionTitle);
    return div;
  };

  const shapeSection = createSection('分布形状');
  const shapeSelect = createSelect(
    '',
    [
      { value: 'sphere', label: '球体' },
      { value: 'torus', label: '圆环' },
      { value: 'spiral', label: '螺旋' }
    ],
    params.shape,
    (value) => {
      params.shape = value as 'sphere' | 'torus' | 'spiral';
      paramsChangeCallback?.({ shape: params.shape });
    }
  );
  shapeSection.appendChild(shapeSelect.container);

  const templateSection = createSection('预设模板');
  const templateSelect = createSelect(
    '',
    [{ value: '', label: '选择模板...' }],
    '',
    () => {}
  );
  templateSection.appendChild(templateSelect.container);

  const savedSection = createSection('已保存');
  const savedSelect = createSelect(
    '',
    [{ value: '', label: '加载已保存...' }],
    '',
    () => {}
  );
  savedSection.appendChild(savedSelect.container);

  const paramsSection = createSection('参数调节');
  const densitySlider = createSlider(
    '粒子密度',
    1000,
    50000,
    params.density,
    500,
    (v) => {
      params.density = v;
      paramsChangeCallback?.({ density: v });
    }
  );
  const rotationSlider = createSlider(
    '旋转速度',
    0,
    2,
    params.rotationSpeed,
    0.01,
    (v) => {
      params.rotationSpeed = v;
      paramsChangeCallback?.({ rotationSpeed: v });
    }
  );
  const sizeSlider = createSlider(
    '粒子大小',
    0.5,
    5,
    params.particleSize,
    0.1,
    (v) => {
      params.particleSize = v;
      paramsChangeCallback?.({ particleSize: v });
    }
  );
  const attenuationSlider = createSlider(
    '衰减度',
    0,
    1,
    params.attenuation,
    0.01,
    (v) => {
      params.attenuation = v;
      paramsChangeCallback?.({ attenuation: v });
    }
  );
  const pulseSlider = createSlider(
    '脉冲幅度',
    0,
    0.5,
    params.pulseAmplitude,
    0.01,
    (v) => {
      params.pulseAmplitude = v;
      paramsChangeCallback?.({ pulseAmplitude: v });
    }
  );

  paramsSection.appendChild(densitySlider.container);
  paramsSection.appendChild(rotationSlider.container);
  paramsSection.appendChild(sizeSlider.container);
  paramsSection.appendChild(attenuationSlider.container);
  paramsSection.appendChild(pulseSlider.container);

  const palettePicker = createColorPalettePicker(
    { start: params.colorStart, mid: params.colorMid, end: params.colorEnd },
    (colors) => {
      params.colorStart = colors.start;
      params.colorMid = colors.mid;
      params.colorEnd = colors.end;
      paramsChangeCallback?.({
        colorStart: colors.start,
        colorMid: colors.mid,
        colorEnd: colors.end
      });
    }
  );

  const buttonsSection = createSection('操作');
  buttonsSection.style.flexDirection = 'row';
  buttonsSection.style.flexWrap = 'wrap';
  buttonsSection.style.gap = '8px';

  const saveBtn = createButton('💾 保存', async () => {
    const name = prompt('输入预设名称:', `星云_${Date.now()}`);
    if (!name) return;

    try {
      const res = await axios.post(`${API_BASE}/saved`, {
        ...params,
        name
      });
      showToast(`保存成功！ID: ${res.data.id.slice(0, 8)}...`);
      await refreshSavedList();
    } catch {
      showToast('保存失败，请检查后端服务', 'error');
    }
  });

  const resetBtn = createButton('🔄 重置', () => {
    resetCallback?.();
  }, 'secondary');

  buttonsSection.appendChild(saveBtn);
  buttonsSection.appendChild(resetBtn);

  panel.appendChild(title);
  panel.appendChild(shapeSection);
  panel.appendChild(templateSection);
  panel.appendChild(savedSection);
  panel.appendChild(paramsSection);
  panel.appendChild(palettePicker.container);
  panel.appendChild(buttonsSection);

  const loadTemplates = async () => {
    try {
      const res = await axios.get(`${API_BASE}/templates`);
      const templates = res.data as Array<NebulaParams & { id: string; name: string }>;
      
      templateSelect.recreate(
        [
          { value: '', label: '选择模板...' },
          ...templates.map(t => ({ value: t.id, label: t.name }))
        ],
        '',
        (value) => {
          const template = templates.find(t => t.id === value);
          if (template) {
            templateLoadCallback?.(template);
          }
        }
      );
    } catch {
      console.warn('无法加载模板列表');
    }
  };

  const refreshSavedList = async () => {
    try {
      const res = await axios.get(`${API_BASE}/saved`);
      const saved = res.data as Array<NebulaParams & { id: string; name: string }>;
      
      savedSelect.recreate(
        [
          { value: '', label: '加载已保存...' },
          ...saved.map(s => ({ value: s.id, label: s.name || `预设_${s.id.slice(0, 6)}` }))
        ],
        '',
        (value) => {
          const config = saved.find(s => s.id === value);
          if (config) {
            templateLoadCallback?.(config);
          }
        }
      );
    } catch {
      console.warn('无法加载已保存列表');
    }
  };

  const updateUIFromParams = (newParams: NebulaParams) => {
    params = { ...newParams };
    shapeSelect.setValue(params.shape);
    densitySlider.setValue(params.density);
    rotationSlider.setValue(params.rotationSpeed);
    sizeSlider.setValue(params.particleSize);
    attenuationSlider.setValue(params.attenuation);
    pulseSlider.setValue(params.pulseAmplitude);
    palettePicker.setColors({
      start: params.colorStart,
      mid: params.colorMid,
      end: params.colorEnd
    });
  };

  const handleResize = () => {
    if (window.innerWidth < 768) {
      panel.style.left = '10px';
      panel.style.right = '10px';
      panel.style.top = 'auto';
      panel.style.bottom = '10px';
      panel.style.width = 'auto';
      panel.style.maxHeight = '45vh';
      panel.style.overflowY = 'auto';
      panel.style.overflowX = 'hidden';
      panel.style.flexDirection = 'row';
      panel.style.transform = 'translateY(120%)';
    } else {
      panel.style.left = '20px';
      panel.style.right = 'auto';
      panel.style.top = '20px';
      panel.style.bottom = 'auto';
      panel.style.width = '280px';
      panel.style.maxHeight = 'calc(100vh - 40px)';
      panel.style.transform = 'translateX(0)';
    }
  };

  window.addEventListener('resize', handleResize);
  handleResize();

  document.body.appendChild(panel);

  requestAnimationFrame(() => {
    if (window.innerWidth < 768) {
      panel.style.transform = 'translateY(0)';
    } else {
      panel.style.transform = 'translateX(0)';
    }
  });

  loadTemplates();
  refreshSavedList();

  return {
    getParams: () => ({ ...params }),
    onParamsChange: (callback) => {
      paramsChangeCallback = callback;
    },
    onTemplateLoad: (callback) => {
      templateLoadCallback = (p) => {
        updateUIFromParams(p);
        callback(p);
      };
    },
    onReset: (callback) => {
      resetCallback = () => {
        const defaultParams: NebulaParams = {
          shape: 'spiral',
          density: 30000,
          rotationSpeed: 0.5,
          particleSize: 1.5,
          attenuation: 0.6,
          pulseAmplitude: 0.2,
          colorStart: '#6a0dad',
          colorMid: '#1e90ff',
          colorEnd: '#00ffff'
        };
        updateUIFromParams(defaultParams);
        callback();
      };
    },
    refreshSavedList
  };
};
