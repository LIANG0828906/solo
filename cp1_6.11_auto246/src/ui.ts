export interface UIOptions {
  onIconClick?: (index: number) => void;
  onIconHover?: (index: number | null) => void;
}

export interface MortiseIconState {
  type: string;
  label: string;
  completed: boolean;
  index: number;
}

export class UIManager {
  private container: HTMLElement;
  private progressEl: HTMLDivElement | null = null;
  private progressFill: HTMLDivElement | null = null;
  private progressText: HTMLDivElement | null = null;
  private healthEl: HTMLDivElement | null = null;
  private healthFill: HTMLDivElement | null = null;
  private healthText: HTMLDivElement | null = null;
  private toastEl: HTMLDivElement | null = null;
  private toastTimer: number | null = null;
  private iconsContainer: HTMLDivElement | null = null;
  private iconEls: HTMLDivElement[] = [];
  private finishOverlay: HTMLDivElement | null = null;
  private waxOverlay: HTMLCanvasElement | null = null;
  private hintEl: HTMLDivElement | null = null;

  constructor(container: HTMLElement, opts: UIOptions = {}) {
    this.container = container;
    this.initElements(opts);
  }

  private initElements(opts: UIOptions): void {
    const container = this.container;
    container.innerHTML = '';

    this.iconsContainer = document.createElement('div');
    this.iconsContainer.style.cssText = `
      position: absolute;
      top: 90px;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      gap: 18px;
      z-index: 15;
      pointer-events: auto;
    `;
    container.appendChild(this.iconsContainer);

    const progressWrap = document.createElement('div');
    progressWrap.style.cssText = `
      position: absolute;
      top: 190px;
      left: calc(50% - 300px + 20px);
      z-index: 15;
      pointer-events: none;
    `;
    this.progressEl = document.createElement('div');
    this.progressEl.style.cssText = `
      width: 120px;
      height: 12px;
      background: rgba(0,0,0,0.35);
      border-radius: 6px;
      overflow: hidden;
      border: 1px solid rgba(90,60,30,0.6);
      box-shadow: inset 0 1px 3px rgba(0,0,0,0.4);
    `;
    this.progressFill = document.createElement('div');
    this.progressFill.style.cssText = `
      height: 100%;
      width: 0%;
      background: linear-gradient(90deg, #FF4444 0%, #FF9944 50%, #44FF44 100%);
      background-size: 240px 100%;
      background-position: 0 0;
      border-radius: 6px;
      transition: width 0.35s cubic-bezier(.25,.8,.25,1);
    `;
    this.progressEl.appendChild(this.progressFill);
    this.progressText = document.createElement('div');
    this.progressText.style.cssText = `
      margin-top: 3px;
      font-family: 'KaiTi','楷体',serif;
      font-size: 12px;
      color: #3E2723;
      text-shadow: 0 1px 1px rgba(255,255,255,0.5);
      text-align: center;
      width: 120px;
    `;
    this.progressText.textContent = '咬合度 0%';
    progressWrap.appendChild(this.progressEl);
    progressWrap.appendChild(this.progressText);
    container.appendChild(progressWrap);

    const healthWrap = document.createElement('div');
    healthWrap.style.cssText = `
      position: absolute;
      top: 28px;
      right: 32px;
      z-index: 15;
      pointer-events: none;
      text-align: right;
    `;
    const healthLabel = document.createElement('div');
    healthLabel.style.cssText = `
      font-family: 'KaiTi','楷体',serif;
      font-size: 13px;
      color: #3E2723;
      margin-bottom: 4px;
      text-shadow: 0 1px 1px rgba(255,255,255,0.4);
    `;
    healthLabel.textContent = '木材完好度';
    this.healthEl = document.createElement('div');
    this.healthEl.style.cssText = `
      width: 200px;
      height: 15px;
      background: rgba(0,0,0,0.35);
      border-radius: 8px;
      overflow: hidden;
      border: 1px solid rgba(90,60,30,0.6);
      box-shadow: inset 0 1px 3px rgba(0,0,0,0.4);
    `;
    this.healthFill = document.createElement('div');
    this.healthFill.style.cssText = `
      height: 100%;
      width: 100%;
      background: linear-gradient(90deg, #FF4444 0%, #DDDD44 50%, #44FF44 100%);
      background-size: 400px 100%;
      background-position: 0 0;
      border-radius: 8px;
      transition: width 0.35s cubic-bezier(.25,.8,.25,1), background-position 0.35s;
    `;
    this.healthEl.appendChild(this.healthFill);
    this.healthText = document.createElement('div');
    this.healthText.style.cssText = `
      margin-top: 3px;
      font-family: 'KaiTi','楷体',serif;
      font-size: 12px;
      color: #3E2723;
      text-shadow: 0 1px 1px rgba(255,255,255,0.5);
    `;
    this.healthText.textContent = '100 / 100';
    healthWrap.appendChild(healthLabel);
    healthWrap.appendChild(this.healthEl);
    healthWrap.appendChild(this.healthText);
    container.appendChild(healthWrap);

    this.toastEl = document.createElement('div');
    this.toastEl.style.cssText = `
      position: absolute;
      top: 40%;
      left: 50%;
      transform: translate(-50%, -50%) scale(0.9);
      background: #FF4444;
      color: #FFFFFF;
      font-family: 'KaiTi','楷体',serif;
      font-size: 20px;
      padding: 14px 32px;
      border-radius: 12px;
      box-shadow: 0 8px 24px rgba(255,68,68,0.5);
      z-index: 30;
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.25s, transform 0.25s;
      letter-spacing: 2px;
      font-weight: bold;
    `;
    container.appendChild(this.toastEl);

    this.hintEl = document.createElement('div');
    this.hintEl.style.cssText = `
      position: absolute;
      bottom: 24px;
      left: 50%;
      transform: translateX(-50%);
      font-family: 'KaiTi','楷体',serif;
      font-size: 14px;
      color: #5D3A1A;
      background: rgba(222, 184, 135, 0.75);
      padding: 8px 20px;
      border-radius: 20px;
      border: 1px solid rgba(139, 69, 19, 0.3);
      pointer-events: none;
      z-index: 12;
      letter-spacing: 1px;
    `;
    this.hintEl.textContent = '提示：点击榫卯图标 → 依次拖拽 木锉→凿子→锤子 到高亮区域';
    container.appendChild(this.hintEl);

    this.finishOverlay = document.createElement('div');
    this.finishOverlay.style.cssText = `
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 40;
      pointer-events: none;
      opacity: 0;
      transition: opacity 0.6s;
    `;
    const card = document.createElement('div');
    card.style.cssText = `
      background: linear-gradient(160deg, rgba(245,222,179,0.97), rgba(218,165,32,0.92));
      border: 3px double #8B4513;
      border-radius: 18px;
      padding: 36px 56px;
      text-align: center;
      box-shadow: 0 20px 60px rgba(0,0,0,0.45);
      font-family: 'Ma Shan Zheng','KaiTi','楷体',serif;
      min-width: 360px;
    `;
    card.innerHTML = `
      <div style="font-size:44px;letter-spacing:12px;color:#8B4513;margin-bottom:6px;text-shadow:0 2px 8px rgba(218,165,32,0.6);">大功告成</div>
      <div style="font-size:18px;letter-spacing:3px;color:#5D3A1A;margin-bottom:24px;">——  一榫一卯，皆合匠心  ——</div>
      <div style="display:flex;gap:36px;justify-content:center;margin-bottom:20px;">
        <div>
          <div style="font-size:14px;color:#6B4423;letter-spacing:2px;">总用时</div>
          <div id="ui_time" style="font-size:32px;color:#8B4513;margin-top:4px;">00:00</div>
        </div>
        <div>
          <div style="font-size:14px;color:#6B4423;letter-spacing:2px;">综合评分</div>
          <div id="ui_score" style="font-size:40px;color:#B8860B;margin-top:2px;font-weight:bold;">0</div>
        </div>
      </div>
      <div id="ui_rank" style="font-size:18px;color:#8B4513;letter-spacing:4px;margin-bottom:18px;">——</div>
      <button id="ui_restart" style="pointer-events:auto;margin-top:4px;padding:10px 36px;font-family:'KaiTi','楷体',serif;font-size:18px;background:linear-gradient(180deg,#A0522D,#6B3410);color:#F5DEB3;border:none;border-radius:8px;letter-spacing:3px;cursor:pointer;box-shadow:0 4px 12px rgba(0,0,0,0.3);">再 制 一 器</button>
    `;
    this.finishOverlay.appendChild(card);
    container.appendChild(this.finishOverlay);

    const btn = card.querySelector('#ui_restart') as HTMLButtonElement;
    btn.addEventListener('click', () => {
      const ev = new CustomEvent('restart-game');
      window.dispatchEvent(ev);
    });
  }

  buildIcons(icons: MortiseIconState[], opts: UIOptions): void {
    if (!this.iconsContainer) return;
    this.iconsContainer.innerHTML = '';
    this.iconEls = [];

    icons.forEach((ic, idx) => {
      const el = document.createElement('div');
      el.style.cssText = `
        width: 60px;
        height: 60px;
        border-radius: 10px;
        position: relative;
        cursor: pointer;
        transition: transform 0.18s, box-shadow 0.18s, filter 0.18s;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 5px 12px rgba(0,0,0,0.3);
        border: 2px solid ${ic.completed ? '#DAA520' : 'rgba(0,0,0,0.3)'};
        background: ${ic.completed
          ? 'linear-gradient(145deg, #8B4513, #A0522D)'
          : 'linear-gradient(145deg, #A89882, #8B8172)'};
        filter: ${ic.completed ? 'none' : 'grayscale(0.85) opacity(0.75)'};
      `;
      el.title = ic.label;
      el.dataset.index = String(idx);
      const svg = this.iconSVG(ic.type);
      el.innerHTML = svg + `
        <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;${ic.completed ? 'display:none;' : ''}">
          <svg viewBox="0 0 24 24" width="22" height="22" style="opacity:0.85;filter:drop-shadow(0 1px 2px rgba(0,0,0,0.5));"><path fill="#2E2A24" d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/></svg>
        </div>
      `;

      el.addEventListener('mouseenter', () => {
        el.style.transform = 'scale(1.05)';
        el.style.boxShadow = '0 8px 18px rgba(0,0,0,0.45)';
        opts.onIconHover?.(idx);
      });
      el.addEventListener('mouseleave', () => {
        el.style.transform = 'scale(1)';
        el.style.boxShadow = '0 5px 12px rgba(0,0,0,0.3)';
        opts.onIconHover?.(null);
      });
      el.addEventListener('mousedown', () => {
        el.style.transform = 'scale(0.95)';
      });
      el.addEventListener('mouseup', () => {
        el.style.transform = 'scale(1.05)';
      });
      el.addEventListener('click', (e) => {
        e.preventDefault();
        opts.onIconClick?.(idx);
      });

      this.iconEls.push(el);
      this.iconsContainer!.appendChild(el);
    });
  }

  updateIcon(idx: number, completed: boolean): void {
    const el = this.iconEls[idx];
    if (!el) return;
    el.style.background = completed
      ? 'linear-gradient(145deg, #8B4513, #A0522D)'
      : 'linear-gradient(145deg, #A89882, #8B8172)';
    el.style.border = `2px solid ${completed ? '#DAA520' : 'rgba(0,0,0,0.3)'}`;
    el.style.filter = completed ? 'none' : 'grayscale(0.85) opacity(0.75)';
    const lock = el.querySelector('div > svg') as SVGSVGElement | null;
    if (lock && lock.parentElement) {
      lock.parentElement.style.display = completed ? 'none' : 'flex';
    }
  }

  setProgress(percent: number): void {
    const p = Math.max(0, Math.min(100, percent));
    if (this.progressFill) {
      this.progressFill.style.width = p + '%';
      this.progressFill.style.backgroundPosition = -(240 * (1 - p / 100)) + 'px 0';
    }
    if (this.progressText) {
      this.progressText.textContent = '咬合度 ' + Math.round(p) + '%';
    }
  }

  setHealth(value: number): void {
    const v = Math.max(0, Math.min(100, value));
    if (this.healthFill) {
      this.healthFill.style.width = v + '%';
      this.healthFill.style.backgroundPosition = -(400 * (1 - v / 100)) + 'px 0';
      if (v < 50) {
        const rate = v < 20 ? 0.3 : 0.6;
        this.healthFill.style.animation = `ui-blink ${rate}s infinite alternate`;
      } else {
        this.healthFill.style.animation = 'none';
      }
    }
    if (this.healthText) {
      this.healthText.textContent = Math.round(v) + ' / 100';
    }
  }

  ensureBlinkKeyframes(): void {
    if (document.getElementById('ui-blink-kf')) return;
    const style = document.createElement('style');
    style.id = 'ui-blink-kf';
    style.textContent = `@keyframes ui-blink { from { opacity: 1; filter: brightness(1); } to { opacity: 0.55; filter: brightness(1.35); } }`;
    document.head.appendChild(style);
  }

  showToast(text: string): void {
    this.ensureBlinkKeyframes();
    if (!this.toastEl) return;
    if (this.toastTimer) {
      window.clearTimeout(this.toastTimer);
    }
    this.toastEl.textContent = text;
    this.toastEl.style.opacity = '1';
    this.toastEl.style.transform = 'translate(-50%, -50%) scale(1)';
    this.toastTimer = window.setTimeout(() => {
      if (!this.toastEl) return;
      this.toastEl.style.opacity = '0';
      this.toastEl.style.transform = 'translate(-50%, -50%) scale(0.9)';
      this.toastTimer = null;
    }, 1500);
  }

  setHint(text: string): void {
    if (this.hintEl) this.hintEl.textContent = text;
  }

  showFinish(seconds: number, score: number): void {
    if (!this.finishOverlay) return;
    this.finishOverlay.style.opacity = '1';
    const mm = Math.floor(seconds / 60).toString().padStart(2, '0');
    const ss = Math.floor(seconds % 60).toString().padStart(2, '0');
    const t = this.finishOverlay.querySelector('#ui_time') as HTMLDivElement;
    const s = this.finishOverlay.querySelector('#ui_score') as HTMLDivElement;
    const r = this.finishOverlay.querySelector('#ui_rank') as HTMLDivElement;
    if (t) t.textContent = `${mm}:${ss}`;
    if (s) {
      s.textContent = String(Math.round(score));
      if (score >= 90) s.style.color = '#DAA520';
      else if (score >= 70) s.style.color = '#8B6914';
      else s.style.color = '#A0522D';
    }
    if (r) {
      let rank = '——';
      if (score >= 95) rank = '神 工 圣 匠';
      else if (score >= 85) rank = '一 代 宗 师';
      else if (score >= 70) rank = '技 近 于 道';
      else if (score >= 55) rank = '略 有 小 成';
      else rank = '初 窥 门 径';
      r.textContent = rank;
    }
  }

  hideFinish(): void {
    if (this.finishOverlay) this.finishOverlay.style.opacity = '0';
  }

  private iconSVG(type: string): string {
    const color = '#F5DEB3';
    switch (type) {
      case 'dovetail':
        return `<svg viewBox="0 0 48 48" width="42" height="42"><path d="M6 12 L6 36 L24 36 L30 30 L18 30 L24 18 L30 18 L24 12 Z M24 12 L30 18 L42 18 L42 30 L30 30 L24 36 Z" fill="none" stroke="${color}" stroke-width="2" stroke-linejoin="round"/></svg>`;
      case 'straight':
        return `<svg viewBox="0 0 48 48" width="42" height="42"><rect x="6" y="14" width="24" height="20" fill="none" stroke="${color}" stroke-width="2"/><rect x="24" y="8" width="18" height="10" fill="none" stroke="${color}" stroke-width="2"/><rect x="24" y="30" width="18" height="10" fill="none" stroke="${color}" stroke-width="2"/></svg>`;
      case 'shoulder':
        return `<svg viewBox="0 0 48 48" width="42" height="42"><path d="M4 14 L4 34 L16 34 L16 28 L22 28 L22 20 L16 20 L16 14 Z" fill="none" stroke="${color}" stroke-width="2" stroke-linejoin="round"/><path d="M16 20 L44 20 L44 28 L16 28 L16 20 Z" fill="none" stroke="${color}" stroke-width="2"/></svg>`;
      case 'mortise_tenon':
        return `<svg viewBox="0 0 48 48" width="42" height="42"><rect x="6" y="12" width="18" height="24" fill="none" stroke="${color}" stroke-width="2"/><rect x="24" y="20" width="6" height="8" fill="${color}" opacity="0.4" stroke="${color}" stroke-width="1.5"/><rect x="30" y="16" width="12" height="16" fill="none" stroke="${color}" stroke-width="2"/></svg>`;
      case 'fishtail':
        return `<svg viewBox="0 0 48 48" width="42" height="42"><path d="M4 20 L4 28 L24 28 L24 32 L20 42 L28 36 L34 42 L30 32 L30 28 L44 28 L44 20 L30 20 L30 16 L34 6 L28 12 L20 6 L24 16 L24 20 Z" fill="none" stroke="${color}" stroke-width="2" stroke-linejoin="round"/></svg>`;
      case 'cross_lap':
      default:
        return `<svg viewBox="0 0 48 48" width="42" height="42"><rect x="4" y="20" width="40" height="8" fill="none" stroke="${color}" stroke-width="2"/><path d="M20 4 L28 4 L28 20 L36 20 L36 28 L28 28 L28 44 L20 44 L20 28 L12 28 L12 20 L20 20 Z" fill="none" stroke="${color}" stroke-width="2" stroke-linejoin="round"/></svg>`;
    }
  }

  applyResponsive(mobile: boolean): void {
    if (this.iconsContainer) {
      this.iconsContainer.style.top = mobile ? '70px' : '90px';
      this.iconsContainer.style.gap = mobile ? '10px' : '18px';
      this.iconEls.forEach(el => {
        el.style.width = mobile ? '44px' : '60px';
        el.style.height = mobile ? '44px' : '60px';
      });
    }
    if (this.toastEl) {
      this.toastEl.style.fontSize = mobile ? '16px' : '20px';
      this.toastEl.style.padding = mobile ? '10px 20px' : '14px 32px';
    }
    if (this.hintEl) {
      this.hintEl.style.fontSize = mobile ? '12px' : '14px';
    }
    const progWrap = this.progressEl?.parentElement;
    if (progWrap) {
      progWrap.style.top = mobile ? '150px' : '190px';
      progWrap.style.left = mobile ? 'calc(50% - 210px + 14px)' : 'calc(50% - 300px + 20px)';
    }
    const healthWrap = this.healthEl?.parentElement;
    if (healthWrap) {
      healthWrap.style.top = mobile ? '16px' : '28px';
      healthWrap.style.right = mobile ? '14px' : '32px';
    }
    if (this.healthEl) {
      this.healthEl.style.width = mobile ? '140px' : '200px';
      this.healthEl.style.height = mobile ? '12px' : '15px';
    }
  }
}
