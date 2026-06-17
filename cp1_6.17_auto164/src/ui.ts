import { useStore, type StarParams, type FavoriteItem } from './store';

interface UIHandlers {
  onScreenshot: () => void;
  onStarInfoChange?: (params: StarParams) => void;
}

const formatAge = (years: number): string => {
  if (years >= 1e9) return `${(years / 1e9).toFixed(1)} 十亿年`;
  if (years >= 1e6) return `${(years / 1e6).toFixed(1)} 百万年`;
  if (years >= 1e4) return `${(years / 1e4).toFixed(1)} 万年`;
  return `${years} 年`;
};

const genId = (): string => Math.random().toString(36).slice(2, 10);

const STAR_PREFIXES = ['阿尔法', '贝塔', '伽马', '德尔塔', '艾普西隆', '泽塔', '艾塔', '西塔', '约塔', '卡帕', '兰姆达', '缪'];
const STAR_SUFFIXES = ['星', '星云', '星尘', '星系', '恒星', '红巨星', '白矮星', '中子星', '脉冲星', '变星'];

const genStarName = (): string => {
  return STAR_PREFIXES[Math.floor(Math.random() * STAR_PREFIXES.length)] +
    '-' +
    Math.floor(Math.random() * 9999).toString().padStart(4, '0') +
    STAR_SUFFIXES[Math.floor(Math.random() * STAR_SUFFIXES.length)];
};

const formatTime = (ts: number): string => {
  const d = new Date(ts);
  return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
};

const hexToRgb = (hex: string): { r: number; g: number; b: number } => {
  const h = hex.replace('#', '');
  return {
    r: parseInt(h.substring(0, 2), 16),
    g: parseInt(h.substring(2, 4), 16),
    b: parseInt(h.substring(4, 6), 16)
  };
};

export interface UIRef {
  updateStarInfo: (info: { spectralType: string; color: string; temperature: number; radius: number }) => void;
  showPlanetCard: (planet: { mass: string; distance: number; atmosphere: string; screenX: number; screenY: number) => void;
  hidePlanetCard: () => void;
}

export const createUI = (handlers: UIHandlers): UIRef => {
  const uiLayer = document.getElementById('ui-layer')!;
  let currentStarInfo: { spectralType: string; color: string; temperature: number; radius: number } | null = null;

  const style = document.createElement('style');
  style.textContent = `
    .sd-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 4px 0 16px 0;
    }
    .sd-title {
      font-size: 22px;
      font-weight: bold;
      color: #FFFFFF;
      letter-spacing: 2px;
      text-shadow: 0 0 20px #45A29E;
    }
    .sd-title-accent {
      color: #45A29E;
    }
    .sd-controls {
      display: flex;
      justify-content: center;
      gap: 40px;
      padding: 10px 0;
    }
    .sd-slider-group {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .sd-slider-label {
      font-size: 12px;
      color: #C5C6C7;
      display: flex;
      justify-content: space-between;
      width: 200px;
    }
    .sd-slider-value {
      color: #F9A825;
    }
    .sd-slider {
      -webkit-appearance: none;
      appearance: none;
      width: 200px;
      height: 6px;
      border-radius: 3px;
      background: #2D2D44;
      outline: none;
      transition: all 0.3s ease-in-out;
      cursor: pointer;
    }
    .sd-slider:hover {
      background: #3D3D54;
      box-shadow: 0 0 8px rgba(249, 168, 37, 0.5);
    }
    .sd-slider::-webkit-slider-thumb {
      -webkit-appearance: none;
      appearance: none;
      width: 18px;
      height: 18px;
      border-radius: 50%;
      background: #F9A825;
      cursor: pointer;
      box-shadow: 0 0 12px #F9A825, 0 0 20px rgba(249, 168, 37, 0.6);
      transition: all 0.3s ease-in-out;
    }
    .sd-slider::-webkit-slider-thumb:hover {
      transform: scale(1.15);
    }
    .sd-slider::-moz-range-thumb {
      width: 18px;
      height: 18px;
      border-radius: 50%;
      background: #F9A825;
      cursor: pointer;
      border: none;
      box-shadow: 0 0 12px #F9A825;
    }
    .sd-right-panel {
      position: absolute;
      top: 60px;
      right: 20px;
      width: 200px;
      background: rgba(30, 30, 46, 0.7);
      backdrop-filter: blur(10px);
      border: 1px solid rgba(69, 162, 158, 0.3);
      border-radius: 8px;
      padding: 16px;
    }
    .sd-info-title {
      font-size: 14px;
      color: #45A29E;
      margin-bottom: 12px;
      letter-spacing: 1px;
    }
    .sd-info-row {
      display: flex;
      justify-content: space-between;
      font-size: 12px;
      padding: 6px 0;
      border-bottom: 1px solid rgba(255,255,255,0.05);
    }
    .sd-info-key {
      color: #C5C6C7;
    }
    .sd-info-val {
      color: #FFFFFF;
    }
    .sd-color-dot {
      display: inline-block;
      width: 12px;
      height: 12px;
      border-radius: 50%;
      vertical-align: middle;
      margin-right: 6px;
    }
    .sd-bottom {
      margin-top: auto;
      display: flex;
      flex-direction: column;
      gap: 12px;
      padding-bottom: 8px;
    }
    .sd-fav-title {
      font-size: 13px;
      color: #C5C6C7;
      letter-spacing: 1px;
    }
    .sd-fav-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, 120px);
      gap: 12px;
      justify-content: center;
    }
    .sd-fav-card {
      width: 120px;
      height: 120px;
      border-radius: 8px;
      padding: 10px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      cursor: pointer;
      transition: all 0.3s ease-in-out;
      position: relative;
      overflow: hidden;
      border: 1px solid rgba(255,255,255,0.1);
    }
    .sd-fav-card:hover {
      transform: scale(1.05);
      box-shadow: 0 0 20px rgba(69, 162, 158, 0.4);
    }
    .sd-fav-name {
      font-size: 11px;
      color: #FFFFFF;
      font-weight: bold;
      text-shadow: 0 1px 3px rgba(0,0,0,0.8);
      word-break: break-all;
    }
    .sd-fav-time {
      font-size: 10px;
      color: rgba(255,255,255,0.8);
    }
    .sd-fav-remove {
      position: absolute;
      top: 4px;
      right: 6px;
      font-size: 14px;
      color: rgba(255,255,255,0.6);
      cursor: pointer;
      transition: color 0.2s;
    }
    .sd-fav-remove:hover {
      color: #FF6B6B;
    }
    .sd-empty-fav {
      width: 120px;
      height: 120px;
      border-radius: 8px;
      border: 2px dashed rgba(197, 198, 199, 0.2);
      display: flex;
      align-items: center;
      justify-content: center;
      color: rgba(197, 198, 199, 0.3);
      font-size: 24px;
    }
    .sd-buttons {
      display: flex;
      gap: 12px;
      justify-content: center;
    }
    .sd-btn {
      position: relative;
      padding: 10px 24px;
      border: none;
      border-radius: 6px;
      font-family: inherit;
      font-size: 13px;
      cursor: pointer;
      overflow: hidden;
      transition: all 0.3s ease-in-out;
      letter-spacing: 1px;
    }
    .sd-btn:hover {
      transform: scale(1.05);
    }
    .sd-btn-primary {
      background: linear-gradient(135deg, #45A29E, #307C7A);
      color: #FFFFFF;
      box-shadow: 0 0 15px rgba(69, 162, 158, 0.3);
    }
    .sd-btn-primary:hover {
      box-shadow: 0 0 25px rgba(69, 162, 158, 0.6);
    }
    .sd-btn-gold {
      background: linear-gradient(135deg, #F9A825, #E69116);
      color: #0B0C10;
      font-weight: bold;
      box-shadow: 0 0 15px rgba(249, 168, 37, 0.3);
    }
    .sd-btn-gold:hover {
      box-shadow: 0 0 25px rgba(249, 168, 37, 0.6);
    }
    .sd-btn-ripple {
      position: absolute;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.5);
      transform: scale(0);
      animation: sd-ripple 0.6s ease-out;
      pointer-events: none;
    }
    @keyframes sd-ripple {
      to {
        transform: scale(4);
        opacity: 0;
      }
    }
    .sd-planet-card {
      position: fixed;
      width: 220px;
      background: rgba(30, 30, 46, 0.92);
      backdrop-filter: blur(10px);
      border: 1px solid rgba(69, 162, 158, 0.4);
      border-radius: 8px;
      padding: 14px;
      z-index: 100;
      pointer-events: none;
      box-shadow: 0 8px 32px rgba(0,0,0,0.5);
    }
    .sd-planet-card-title {
      font-size: 13px;
      color: #45A29E;
      margin-bottom: 10px;
      letter-spacing: 1px;
    }
    .sd-planet-card-row {
      display: flex;
      justify-content: space-between;
      font-size: 12px;
      padding: 5px 0;
      border-bottom: 1px solid rgba(255,255,255,0.05);
    }
  `;
  document.head.appendChild(style);

  uiLayer.innerHTML = `
    <div class="sd-header">
      <div class="sd-title">✦ 星尘<span class="sd-title-accent">星图</span>生成器 ✦</div>
    </div>

    <div class="sd-controls">
      <div class="sd-slider-group">
        <div class="sd-slider-label">
          <span>恒星质量</span>
          <span class="sd-slider-value" id="sd-mass-val">1.0 M☉</span>
        </div>
        <input type="range" class="sd-slider" id="sd-mass" min="0.5" max="50" step="0.1" value="1">
      </div>
      <div class="sd-slider-group">
        <div class="sd-slider-label">
          <span>恒星年龄</span>
          <span class="sd-slider-value" id="sd-age-val">46.0 亿年</span>
        </div>
        <input type="range" class="sd-slider" id="sd-age" min="10000" max="10000000000" step="1000000" value="4600000000">
      </div>
      <div class="sd-slider-group">
        <div class="sd-slider-label">
          <span>金属丰度</span>
          <span class="sd-slider-value" id="sd-metal-val">0.020</span>
        </div>
        <input type="range" class="sd-slider" id="sd-metal" min="0.01" max="0.3" step="0.001" value="0.02">
      </div>
    </div>

    <div class="sd-right-panel" id="sd-info-panel">
      <div class="sd-info-title">◆ 恒星信息</div>
      <div class="sd-info-row">
        <span class="sd-info-key">光谱类型</span>
        <span class="sd-info-val" id="sd-spec">—</span>
      </div>
      <div class="sd-info-row">
        <span class="sd-info-key">表面温度</span>
        <span class="sd-info-val" id="sd-temp">—</span>
      </div>
      <div class="sd-info-row">
        <span class="sd-info-key">颜色</span>
        <span class="sd-info-val" id="sd-color"><span class="sd-color-dot" id="sd-color-dot" style="background:#FFFFFF"></span>—</span>
      </div>
      <div class="sd-info-row">
        <span class="sd-info-key">相对半径</span>
        <span class="sd-info-val" id="sd-radius">—</span>
      </div>
    </div>

    <div class="sd-bottom">
      <div class="sd-buttons">
        <button class="sd-btn sd-btn-primary" id="sd-save">★ 保存到收藏夹</button>
        <button class="sd-btn sd-btn-gold" id="sd-shot">⤓ 导出高清截图</button>
      </div>
      <div>
        <div class="sd-fav-title" style="margin-bottom:8px">★ 我的收藏 (最多12个)</div>
        <div class="sd-fav-grid" id="sd-fav-grid"></div>
      </div>
    </div>
  `;

  const massSlider = document.getElementById('sd-mass') as HTMLInputElement;
  const ageSlider = document.getElementById('sd-age') as HTMLInputElement;
  const metalSlider = document.getElementById('sd-metal') as HTMLInputElement;
  const massVal = document.getElementById('sd-mass-val')!;
  const ageVal = document.getElementById('sd-age-val')!;
  const metalVal = document.getElementById('sd-metal-val')!;
  const specEl = document.getElementById('sd-spec')!;
  const tempEl = document.getElementById('sd-temp')!;
  const colorEl = document.getElementById('sd-color')!;
  const colorDot = document.getElementById('sd-color-dot') as HTMLElement;
  const radiusEl = document.getElementById('sd-radius')!;
  const saveBtn = document.getElementById('sd-save')!;
  const shotBtn = document.getElementById('sd-shot')!;
  const favGrid = document.getElementById('sd-fav-grid')!;

  const syncParams = useStore.getState().params;
  massSlider.value = String(syncParams.mass);
  ageSlider.value = String(syncParams.age);
  metalSlider.value = String(syncParams.metallicity);
  massVal.textContent = `${syncParams.mass.toFixed(1)} M☉`;
  ageVal.textContent = formatAge(syncParams.age);
  metalVal.textContent = syncParams.metallicity.toFixed(3);

  const debounce = <T extends (...args: unknown[]) => void>(fn: T, wait: number): T => {
    let t: number | null = null;
    return ((...args: unknown[]) => {
      if (t !== null) clearTimeout(t);
      t = window.setTimeout(() => fn(...args), wait);
    } as unknown as T;
  };

  const updateParams = (): void => {
    const params: StarParams = {
      mass: parseFloat(massSlider.value),
      age: parseFloat(ageSlider.value),
      metallicity: parseFloat(metalSlider.value)
    };
    useStore.getState().setParams(params);
    handlers.onStarInfoChange?.(params);
  };

  const debouncedUpdate = debounce(updateParams, 50);

  massSlider.addEventListener('input', () => {
    const v = parseFloat(massSlider.value);
    massVal.textContent = `${v.toFixed(1)} M☉`;
    debouncedUpdate();
  });

  ageSlider.addEventListener('input', () => {
    const v = parseFloat(ageSlider.value);
    ageVal.textContent = formatAge(v);
    debouncedUpdate();
  });

  metalSlider.addEventListener('input', () => {
    const v = parseFloat(metalSlider.value);
    metalVal.textContent = v.toFixed(3);
    debouncedUpdate();
  });

  const addRipple = (btn: HTMLElement, e: MouseEvent): void => {
    const rect = btn.getBoundingClientRect();
    const ripple = document.createElement('span');
    ripple.className = 'sd-btn-ripple';
    const size = Math.max(rect.width, rect.height);
    ripple.style.width = ripple.style.height = size + 'px';
    ripple.style.left = (e.clientX - rect.left - size / 2 + 'px';
    ripple.style.top = (e.clientY - rect.top - size / 2 + 'px';
    btn.appendChild(ripple);
    setTimeout(() => ripple.remove(), 600);
  };

  saveBtn.addEventListener('click', (e) => {
    addRipple(saveBtn, e);
    const state = useStore.getState();
    if (!currentStarInfo) return;
    const item: FavoriteItem = {
      id: genId(),
      name: genStarName(),
      timestamp: Date.now(),
      params: { ...state.params },
      starColor: currentStarInfo.color
    };
    state.addFavorite(item);
    renderFavorites();
  });

  shotBtn.addEventListener('click', (e) => {
    addRipple(shotBtn, e);
    handlers.onScreenshot();
  });

  const renderFavorites = (): void => {
    const favs = useStore.getState().favorites;
    favGrid.innerHTML = '';
    for (const fav of favs) {
      const { r, g, b } = hexToRgb(fav.starColor);
      const card = document.createElement('div');
      card.className = 'sd-fav-card';
      card.style.background = `linear-gradient(135deg, ${fav.starColor}33, #0B0C10), radial-gradient(circle at 30% 30%, rgba(${r},${g},${b},0.6), #0B0C10)`;
      card.innerHTML = `
        <span class="sd-fav-remove" title="删除">✕</span>
        <div class="sd-fav-name">${fav.name}</div>
        <div class="sd-fav-time">${formatTime(fav.timestamp)}</div>
      `;
      card.addEventListener('click', (ev) => {
        if ((ev.target as HTMLElement).classList.contains('sd-fav-remove')) {
          ev.stopPropagation();
          useStore.getState().removeFavorite(fav.id);
          renderFavorites();
          return;
        }
        useStore.getState().loadFavorite(fav.id);
        const p = useStore.getState().params;
        massSlider.value = String(p.mass);
        ageSlider.value = String(p.age);
        metalSlider.value = String(p.metallicity);
        massVal.textContent = `${p.mass.toFixed(1)} M☉`;
        ageVal.textContent = formatAge(p.age);
        metalVal.textContent = p.metallicity.toFixed(3);
        updateParams();
      });
      favGrid.appendChild(card);
    }
    for (let i = favs.length; i < 12; i++) {
      const empty = document.createElement('div');
      empty.className = 'sd-empty-fav';
      empty.textContent = '+';
      favGrid.appendChild(empty);
    }
  };

  renderFavorites();

  useStore.subscribe(() => renderFavorites());

  let planetCard: HTMLDivElement | null = null;

  return {
    updateStarInfo: (info) => {
      currentStarInfo = info;
      specEl.textContent = info.spectralType + ' 型';
      tempEl.textContent = info.temperature.toLocaleString() + ' K';
      colorEl.innerHTML = `<span class="sd-color-dot" style="background:${info.color};box-shadow:0 0 8px ${info.color}"></span>${info.color.toUpperCase()}`;
      colorDot.style.background = info.color;
      colorDot.style.boxShadow = `0 0 8px ${info.color}`;
      radiusEl.textContent = info.radius.toFixed(2) + ' R☉';
    },
    showPlanetCard: (planet) => {
      if (!planetCard) planetCard.remove();
      planetCard = document.createElement('div');
      planetCard.className = 'sd-planet-card';
      planetCard.innerHTML = `
        <div class="sd-planet-card-title">◆ 行星信息</div>
        <div class="sd-planet-card-row">
          <span class="sd-info-key">质量</span>
          <span class="sd-info-val">${planet.mass}</span>
        </div>
        <div class="sd-planet-card-row">
          <span class="sd-info-key">距恒星</span>
          <span class="sd-info-val">${planet.distance.toFixed(2)} AU</span>
        </div>
        <div class="sd-planet-card-row">
          <span class="sd-info-key">大气成分</span>
          <span class="sd-info-val">${planet.atmosphere}</span>
        </div>
      `;
      document.body.appendChild(planetCard);
      const w = planetCard.offsetWidth;
      const h = planetCard.offsetHeight;
      let x = planet.screenX + 15;
      let y = planet.screenY - h / 2;
      if (x + w > window.innerWidth - 10) x = planet.screenX - w - 15;
      if (y < 10) y = 10;
      if (y + h > window.innerHeight - 10) y = window.innerHeight - h - 10;
      planetCard.style.left = x + 'px';
      planetCard.style.top = y + 'px';
    },
    hidePlanetCard: () => {
      if (planetCard) {
        planetCard.remove();
        planetCard = null;
      }
    }
  };
};
