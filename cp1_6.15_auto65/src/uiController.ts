import { NebulaParams } from './particleSystem';
import axios from 'axios';

const API_BASE = 'http://localhost:3001/api';

const colorPalettes = [
  { name: '宇宙紫蓝', colors: ['#6a0dad', '#1e90ff', '#00ffff'] },
  { name: '玫瑰红橙', colors: ['#ff1493', '#ff6347', '#ffa500'] },
  { name: '极光青绿', colors: ['#00ff88', '#00bfff', '#4169e1'] },
  { name: '火焰金白', colors: ['#ff4500', '#ffd700', '#ffffff'] },
  { name: '深海蓝', colors: ['#000080', '#0000cd', '#4169e1'] },
  { name: '薰衣草', colors: ['#9370db', '#ba55d3', '#ee82ee'] },
  { name: '森林绿', colors: ['#006400', '#228b22', '#98fb98'] },
  { name: '日落', colors: ['#ff4500', '#ff6b6b', '#ffd93d'] },
  { name: '午夜', colors: ['#0c0c0c', '#1a1a2e', '#4a4a6a'] },
  { name: '彩虹', colors: ['#ff0000', '#ffff00', '#00ffff'] },
  { name: '星云粉', colors: ['#ff69b4', '#ff1493', '#c71585'] },
  { name: '冰晶蓝', colors: ['#00bfff', '#87ceeb', '#e0ffff'] }
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

const createColorPicker = (
  label: string,
  initialColor: string,
  onChange: (color: string) => void
): { container: HTMLDivElement; setColor: (c: string) => void } => {
  const container = document.createElement('div');
  container.style.display = 'flex';
  container.style.flexDirection = 'column';
  container.style.gap = '6px';
  container.style.position = 'relative';

  const labelEl = document.createElement('label');
  labelEl.textContent = label;
  labelEl.style.color = '#ddd';
  labelEl.style.fontSize = '12px';

  const colorPreview = document.createElement('div');
  colorPreview.style.width = '100%';
  colorPreview.style.height = '32px';
  colorPreview.style.borderRadius = '8px';
  colorPreview.style.background = initialColor;
  colorPreview.style.cursor = 'pointer';
  colorPreview.style.border = '2px solid rgba(255,255,255,0.2)';
  colorPreview.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)';
  colorPreview.style.transition = 'all 0.3s';
  colorPreview.textContent = initialColor;
  colorPreview.style.color = '#fff';
  colorPreview.style.fontSize = '11px';
  colorPreview.style.display = 'flex';
  colorPreview.style.alignItems = 'center';
  colorPreview.style.justifyContent = 'center';
  colorPreview.style.textShadow = '0 1px 2px rgba(0,0,0,0.5)';
  colorPreview.style.fontWeight = 'bold';

  const popup = document.createElement('div');
  popup.style.position = 'absolute';
  popup.style.top = '100%';
  popup.style.left = '0';
  popup.style.zIndex = '1000';
  popup.style.background = 'rgba(10,10,30,0.95)';
  popup.style.border = '1px solid rgba(255,255,255,0.2)';
  popup.style.borderRadius = '12px';
  popup.style.padding = '12px';
  popup.style.backdropFilter = 'blur(10px)';
  popup.style.display = 'none';
  popup.style.width = '220px';
  popup.style.marginTop = '8px';

  const paletteGrid = document.createElement('div');
  paletteGrid.style.display = 'grid';
  paletteGrid.style.gridTemplateColumns = 'repeat(4, 1fr)';
  paletteGrid.style.gap = '6px';
  paletteGrid.style.marginBottom = '12px';

  colorPalettes.forEach(palette => {
    const paletteBtn = document.createElement('button');
    paletteBtn.style.width = '100%';
    paletteBtn.style.aspectRatio = '1';
    paletteBtn.style.borderRadius = '6px';
    paletteBtn.style.border = 'none';
    paletteBtn.style.cursor = 'pointer';
    paletteBtn.style.background = `linear-gradient(135deg, ${palette.colors[0]} 0%, ${palette.colors[1]} 50%, ${palette.colors[2]} 100%)`;
    paletteBtn.title = palette.name;
    paletteBtn.style.transition = 'transform 0.2s';
    paletteBtn.addEventListener('mouseenter', () => {
      paletteBtn.style.transform = 'scale(1.1)';
    });
    paletteBtn.addEventListener('mouseleave', () => {
      paletteBtn.style.transform = 'scale(1)';
    });
    paletteGrid.appendChild(paletteBtn);
  });

  const hexInput = document.createElement('input');
  hexInput.type = 'text';
  hexInput.placeholder = '#RRGGBB';
  hexInput.value = initialColor;
  hexInput.style.width = '100%';
  hexInput.style.padding = '8px 12px';
  hexInput.style.borderRadius = '8px';
  hexInput.style.border = '1px solid rgba(255,255,255,0.2)';
  hexInput.style.background = 'rgba(255,255,255,0.1)';
  hexInput.style.color = '#fff';
  hexInput.style.fontSize = '12px';
  hexInput.style.outline = 'none';

  colorPreview.addEventListener('click', (e) => {
    e.stopPropagation();
    popup.style.display = popup.style.display === 'none' ? 'block' : 'none';
  });

  document.addEventListener('click', (e) => {
    if (!container.contains(e.target as Node)) {
      popup.style.display = 'none';
    }
  });

  hexInput.addEventListener('change', () => {
    let color = hexInput.value.trim();
    if (!color.startsWith('#')) {
      color = '#' + color;
    }
    if (/^#[0-9A-Fa-f]{6}$/.test(color)) {
      colorPreview.style.background = color;
      colorPreview.textContent = color;
      onChange(color);
    }
  });

  popup.appendChild(paletteGrid);
  popup.appendChild(hexInput);
  container.appendChild(labelEl);
  container.appendChild(colorPreview);
  container.appendChild(popup);

  return {
    container,
    setColor: (c: string) => {
      colorPreview.style.background = c;
      colorPreview.textContent = c;
      hexInput.value = c;
    }
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
): { container: HTMLDivElement; setValue: (v: string) => void } => {
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

  options.forEach(opt => {
    const option = document.createElement('option');
    option.value = opt.value;
    option.textContent = opt.label;
    option.style.background = '#1a1a2e';
    select.appendChild(option);
  });

  select.value = value;
  select.addEventListener('change', () => onChange(select.value));

  container.appendChild(labelEl);
  container.appendChild(select);

  return {
    container,
    setValue: (v: string) => {
      select.value = v;
    }
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

  const section = (name: string) => {
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

  const shapeSection = section('分布形状');
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

  const templateSection = section('预设模板');
  const templateSelect = createSelect(
    '',
    [{ value: '', label: '选择模板...' }],
    '',
    () => {}
  );
  templateSection.appendChild(templateSelect.container);

  const savedSection = section('已保存');
  const savedSelect = createSelect(
    '',
    [{ value: '', label: '加载已保存...' }],
    '',
    () => {}
  );
  savedSection.appendChild(savedSelect.container);

  const paramsSection = section('参数调节');
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

  const colorSection = section('颜色调色板');
  const colorStartPicker = createColorPicker(
    '起始颜色',
    params.colorStart,
    (c) => {
      params.colorStart = c;
      paramsChangeCallback?.({ colorStart: c });
    }
  );
  const colorMidPicker = createColorPicker(
    '中间颜色',
    params.colorMid,
    (c) => {
      params.colorMid = c;
      paramsChangeCallback?.({ colorMid: c });
    }
  );
  const colorEndPicker = createColorPicker(
    '结束颜色',
    params.colorEnd,
    (c) => {
      params.colorEnd = c;
      paramsChangeCallback?.({ colorEnd: c });
    }
  );

  colorSection.appendChild(colorStartPicker.container);
  colorSection.appendChild(colorMidPicker.container);
  colorSection.appendChild(colorEndPicker.container);

  const buttonsSection = section('操作');
  buttonsSection.style.flexDirection = 'row';
  buttonsSection.style.flexWrap = 'wrap';

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
  panel.appendChild(colorSection);
  panel.appendChild(buttonsSection);

  const loadTemplates = async () => {
    try {
      const res = await axios.get(`${API_BASE}/templates`);
      const templates = res.data as Array<NebulaParams & { id: string; name: string }>;
      
      templateSelect.container.removeChild(templateSelect.container.querySelector('select')!);
      const newSelect = createSelect(
        '',
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
      templateSelect.setValue = newSelect.setValue;
      templateSection.appendChild(newSelect.container);
    } catch {
      console.warn('无法加载模板列表');
    }
  };

  const refreshSavedList = async () => {
    try {
      const res = await axios.get(`${API_BASE}/saved`);
      const saved = res.data as Array<NebulaParams & { id: string; name: string }>;
      
      const oldSelect = savedSection.querySelector('select');
      if (oldSelect) {
        savedSection.removeChild(oldSelect.parentElement!);
      }
      
      const newSelect = createSelect(
        '',
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
      savedSelect.setValue = newSelect.setValue;
      savedSection.appendChild(newSelect.container);
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
    colorStartPicker.setColor(params.colorStart);
    colorMidPicker.setColor(params.colorMid);
    colorEndPicker.setColor(params.colorEnd);
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
    } else {
      panel.style.left = '20px';
      panel.style.right = 'auto';
      panel.style.top = '20px';
      panel.style.bottom = 'auto';
      panel.style.width = '280px';
      panel.style.maxHeight = 'calc(100vh - 40px)';
    }
  };

  window.addEventListener('resize', handleResize);
  handleResize();

  document.body.appendChild(panel);

  requestAnimationFrame(() => {
    panel.style.transform = 'translateX(0)';
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
