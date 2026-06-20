import { GameEngine } from './GameEngine';
import { LevelConfig, BlockPosition } from './types';
import { gsap } from 'gsap';

const GRID_SIZE = 10;
const MAX_HEIGHT = 5;

export class UIManager {
  private container: HTMLElement;
  private engine: GameEngine;
  private rootEl: HTMLElement;
  private canvasContainer: HTMLElement;
  private uiOverlay: HTMLElement;
  private timerWrapperEl: HTMLElement;
  private timerEl: SVGSVGElement;
  private timerProgressCircle: SVGCircleElement;
  private timerTextEl: HTMLElement;
  private timerPulseEl: HTMLElement;
  private levelLabelEl: HTMLElement;
  private blueprintPanel: HTMLElement;
  private blueprintCanvas: HTMLCanvasElement;
  private blueprintTooltip: HTMLElement;
  private blueprintModal: HTMLElement | null = null;
  private levelSelectPanel: HTMLElement;
  private nextLevelBtn: HTMLButtonElement;
  private hintEl: HTMLElement;
  private celebrateContainer: HTMLElement;
  private pulseInterval: number | null = null;
  private currentBlueprint: number[][][] | null = null;

  constructor(container: HTMLElement, engine: GameEngine) {
    this.container = container;
    this.engine = engine;
    this.rootEl = this.createRoot();
    this.canvasContainer = this.createCanvasContainer();
    this.uiOverlay = this.createUIOverlay();
    this.timerWrapperEl = this.createTimer();
    this.levelLabelEl = this.createLevelLabel();
    this.blueprintPanel = this.createBlueprintPanel();
    this.blueprintCanvas = this.blueprintPanel.querySelector('canvas') as HTMLCanvasElement;
    this.blueprintTooltip = this.blueprintPanel.querySelector('.tooltip') as HTMLElement;
    this.levelSelectPanel = this.createLevelSelect();
    this.nextLevelBtn = this.createNextLevelBtn();
    this.hintEl = this.createHint();
    this.celebrateContainer = this.createCelebrateContainer();
    this.mount();
    this.bindEngine();
  }

  private createRoot(): HTMLElement {
    const el = document.createElement('div');
    el.style.cssText = `
      width: 100%;
      max-width: 1280px;
      min-height: 800px;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      background: #1A1A2E;
      color: #E0E0E0;
      font-family: monospace;
      font-size: 14px;
      position: relative;
      box-shadow: 0 0 60px rgba(15, 52, 96, 0.3);
      overflow: hidden;
    `;
    return el;
  }

  private createCanvasContainer(): HTMLElement {
    const el = document.createElement('div');
    el.style.cssText = `
      flex: 1;
      position: relative;
      min-height: 600px;
      background: #1A1A2E;
    `;
    return el;
  }

  private createUIOverlay(): HTMLElement {
    const el = document.createElement('div');
    el.style.cssText = `
      position: absolute;
      inset: 0;
      pointer-events: none;
      z-index: 10;
    `;
    return el;
  }

  private createTimer(): HTMLElement {
    // Inject keyframe animations once
    UIManager.ensureGlobalStyles();

    const wrapper = document.createElement('div');
    wrapper.style.cssText = `
      position: absolute;
      top: 20px;
      left: 20px;
      width: 100px;
      height: 100px;
      pointer-events: none;
      display: flex;
      align-items: center;
      justify-content: center;
    `;
    const pulse = document.createElement('div');
    pulse.style.cssText = `
      position: absolute;
      width: 92px;
      height: 92px;
      border-radius: 50%;
      border: 2px solid transparent;
      opacity: 0;
      transition: opacity 0.3s ease;
      pointer-events: none;
    `;
    this.timerPulseEl = pulse;
    wrapper.appendChild(pulse);

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '92');
    svg.setAttribute('height', '92');
    svg.setAttribute('viewBox', '0 0 92 92');
    svg.style.cssText = 'filter: drop-shadow(0 4px 8px rgba(0,0,0,0.5));';
    this.timerEl = svg;

    const bg = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    bg.setAttribute('cx', '46');
    bg.setAttribute('cy', '46');
    bg.setAttribute('r', '40');
    bg.setAttribute('fill', 'none');
    bg.setAttribute('stroke', '#16213E');
    bg.setAttribute('stroke-width', '6');
    svg.appendChild(bg);

    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    const grad = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
    grad.setAttribute('id', 'timerGradient');
    grad.setAttribute('x1', '0%');
    grad.setAttribute('y1', '0%');
    grad.setAttribute('x2', '100%');
    grad.setAttribute('y2', '100%');
    const stop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
    stop1.setAttribute('offset', '0%');
    stop1.setAttribute('stop-color', '#00BFFF');
    const stop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
    stop2.setAttribute('offset', '100%');
    stop2.setAttribute('stop-color', '#FF4500');
    grad.appendChild(stop1);
    grad.appendChild(stop2);
    defs.appendChild(grad);
    svg.appendChild(defs);

    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', '46');
    circle.setAttribute('cy', '46');
    circle.setAttribute('r', '40');
    circle.setAttribute('fill', 'none');
    circle.setAttribute('stroke', 'url(#timerGradient)');
    circle.setAttribute('stroke-width', '6');
    circle.setAttribute('stroke-linecap', 'round');
    circle.setAttribute('transform', 'rotate(-90 46 46)');
    const circumference = 2 * Math.PI * 40;
    circle.setAttribute('stroke-dasharray', String(circumference));
    circle.setAttribute('stroke-dashoffset', '0');
    this.timerProgressCircle = circle;
    svg.appendChild(circle);

    const text = document.createElement('div');
    text.style.cssText = `
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
      font-weight: bold;
      color: #E0E0E0;
      text-shadow: 0 2px 4px rgba(0,0,0,0.6);
    `;
    text.textContent = '60';
    this.timerTextEl = text;

    wrapper.appendChild(svg);
    wrapper.appendChild(text);
    this.uiOverlay.appendChild(wrapper);
    return wrapper;
  }

  private static _globalStylesInjected = false;
  private static ensureGlobalStyles(): void {
    if (UIManager._globalStylesInjected) return;
    UIManager._globalStylesInjected = true;
    const style = document.createElement('style');
    style.textContent = `
      @keyframes chronoblock-timer-pulse {
        0%   { opacity: 0.3; box-shadow: 0 0 0 0px rgba(255, 69, 0, 0.3); }
        50%  { opacity: 0.6; box-shadow: 0 0 0 8px rgba(255, 69, 0, 0.5); }
        100% { opacity: 0.3; box-shadow: 0 0 0 0px rgba(255, 69, 0, 0.3); }
      }
      @keyframes chronoblock-celebrate-color {
        0%   { background-color: #FFD700; box-shadow: 0 0 8px #FFD700; }
        33%  { background-color: #FFFFFF; box-shadow: 0 0 8px #FFFFFF; }
        66%  { background-color: #00FFFF; box-shadow: 0 0 8px #00FFFF; }
        100% { background-color: #FFD700; box-shadow: 0 0 8px #FFD700; }
      }
    `;
    document.head.appendChild(style);
  }

  private createLevelLabel(): HTMLElement {
    const el = document.createElement('div');
    el.style.cssText = `
      position: absolute;
      top: 24px;
      left: 50%;
      transform: translateX(-50%);
      font-size: 20px;
      font-family: monospace;
      color: #FFFFFF;
      text-shadow: 0 2px 6px rgba(0,0,0,0.7);
      pointer-events: none;
      letter-spacing: 2px;
    `;
    this.uiOverlay.appendChild(el);
    return el;
  }

  private createBlueprintPanel(): HTMLElement {
    const panel = document.createElement('div');
    panel.style.cssText = `
      position: absolute;
      top: 20px;
      right: 20px;
      width: 200px;
      background: rgba(0, 0, 0, 0.8);
      border-radius: 8px;
      padding: 12px;
      pointer-events: auto;
      cursor: pointer;
      transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.25s ease, z-index 0s;
      backdrop-filter: blur(6px);
      border: 1px solid rgba(15, 52, 96, 0.6);
      transform-origin: top right;
      z-index: 2;
    `;

    const title = document.createElement('div');
    title.style.cssText = `
      font-size: 12px;
      color: #00BFFF;
      margin-bottom: 8px;
      text-transform: uppercase;
      letter-spacing: 1px;
      font-weight: bold;
    `;
    title.textContent = 'BLUEPRINT / 蓝图';
    panel.appendChild(title);

    const canvas = document.createElement('canvas');
    canvas.width = 176;
    canvas.height = 176;
    canvas.style.cssText = `
      display: block;
      width: 176px;
      height: 176px;
      border-radius: 4px;
      background: #0a0f1f;
      transition: filter 0.25s ease;
    `;
    panel.appendChild(canvas);

    const tooltip = document.createElement('div');
    tooltip.style.cssText = `
      margin-top: 8px;
      font-size: 11px;
      color: #FFD700;
      text-align: center;
      opacity: 0;
      transform: translateY(-4px);
      transition: opacity 0.25s ease, transform 0.25s ease;
      font-weight: bold;
      text-shadow: 0 0 8px rgba(255, 215, 0, 0.4);
    `;
    tooltip.textContent = '👁 点击查看详情';
    panel.appendChild(tooltip);

    panel.addEventListener('mouseenter', () => {
      panel.style.transform = 'scale(1.2)';
      panel.style.zIndex = '100';
      panel.style.boxShadow = '0 12px 36px rgba(0, 191, 255, 0.35), 0 0 0 1px rgba(0, 191, 255, 0.5)';
      canvas.style.filter = 'brightness(1.15) saturate(1.2)';
      tooltip.style.opacity = '1';
      tooltip.style.transform = 'translateY(0)';
    });
    panel.addEventListener('mouseleave', () => {
      panel.style.transform = 'scale(1)';
      panel.style.zIndex = '2';
      panel.style.boxShadow = 'none';
      canvas.style.filter = 'none';
      tooltip.style.opacity = '0';
      tooltip.style.transform = 'translateY(-4px)';
    });
    panel.addEventListener('click', () => {
      this.showBlueprintModal();
    });

    this.uiOverlay.appendChild(panel);
    this.drawBlueprintOn(canvas, null);
    return panel;
  }

  private showBlueprintModal(): void {
    if (this.blueprintModal) return;
    const modal = document.createElement('div');
    modal.style.cssText = `
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.75);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
      pointer-events: auto;
    `;
    const card = document.createElement('div');
    card.style.cssText = `
      width: 400px;
      height: 400px;
      background: rgba(22, 33, 62, 0.95);
      border: 1px solid rgba(0, 191, 255, 0.4);
      border-radius: 12px;
      padding: 24px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.7);
      display: flex;
      flex-direction: column;
    `;
    const title = document.createElement('div');
    title.style.cssText = `
      font-size: 16px;
      color: #00BFFF;
      margin-bottom: 12px;
      text-transform: uppercase;
      letter-spacing: 1px;
      text-align: center;
    `;
    title.textContent = '蓝图详情 - Blueprint Detail';
    card.appendChild(title);

    const canvas = document.createElement('canvas');
    canvas.width = 352;
    canvas.height = 352;
    canvas.style.cssText = `
      width: 352px;
      height: 352px;
      border-radius: 6px;
      background: #0a0f1f;
      margin: 0 auto;
      display: block;
    `;
    card.appendChild(canvas);

    const close = document.createElement('button');
    close.style.cssText = `
      margin-top: 14px;
      padding: 10px 16px;
      font-family: monospace;
      font-size: 13px;
      color: #E0E0E0;
      background: linear-gradient(180deg, #0F3460, #16213E);
      border: 1px solid #0F3460;
      border-radius: 4px;
      cursor: pointer;
      transition: filter 0.15s ease;
      align-self: center;
    `;
    close.textContent = '关闭 / Close';
    close.addEventListener('mouseenter', () => (close.style.filter = 'brightness(1.15)'));
    close.addEventListener('mouseleave', () => (close.style.filter = 'brightness(1)'));
    card.appendChild(close);

    modal.appendChild(card);
    document.body.appendChild(modal);
    this.blueprintModal = modal;
    this.drawBlueprintOn(canvas, this.currentBlueprint);

    const closeFn = () => {
      modal.removeEventListener('click', outside);
      document.body.removeChild(modal);
      this.blueprintModal = null;
    };
    const outside = (e: MouseEvent) => {
      if (e.target === modal) closeFn();
    };
    close.addEventListener('click', closeFn);
    modal.addEventListener('click', outside);
    document.addEventListener('keydown', function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        document.removeEventListener('keydown', onKey);
        closeFn();
      }
    });
  }

  private createLevelSelect(): HTMLElement {
    const panel = document.createElement('div');
    panel.style.cssText = `
      position: absolute;
      bottom: 20px;
      left: 20px;
      background: rgba(0, 0, 0, 0.8);
      border-radius: 8px;
      padding: 12px;
      pointer-events: auto;
      border: 1px solid rgba(15, 52, 96, 0.6);
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      max-width: calc(100% - 40px);
    `;
    const levels = this.engine.getLevels();
    levels.forEach((lv) => {
      const btn = document.createElement('button');
      btn.dataset.level = String(lv.id);
      btn.style.cssText = `
        padding: 8px 14px;
        font-family: monospace;
        font-size: 13px;
        color: #E0E0E0;
        background: linear-gradient(180deg, #0F3460, #16213E);
        border: 1px solid #0F3460;
        border-radius: 4px;
        cursor: pointer;
        transition: filter 0.15s ease, transform 0.15s ease;
        min-width: 36px;
      `;
      btn.textContent = `L${lv.id}`;
      btn.title = `${lv.name}: ${lv.description}`;
      btn.addEventListener('mouseenter', () => {
        btn.style.filter = 'brightness(1.15)';
        btn.style.transform = 'translateY(-1px)';
      });
      btn.addEventListener('mouseleave', () => {
        btn.style.filter = 'brightness(1)';
        btn.style.transform = 'translateY(0)';
      });
      btn.addEventListener('click', () => {
        this.engine.startLevel(lv.id);
      });
      panel.appendChild(btn);
    });
    this.uiOverlay.appendChild(panel);
    return panel;
  }

  private createNextLevelBtn(): HTMLButtonElement {
    const btn = document.createElement('button');
    btn.style.cssText = `
      position: absolute;
      bottom: 20px;
      right: 20px;
      padding: 12px 22px;
      font-family: monospace;
      font-size: 14px;
      color: #E0E0E0;
      background: linear-gradient(180deg, #0F3460, #16213E);
      border: 1px solid #00BFFF;
      border-radius: 4px;
      cursor: pointer;
      pointer-events: auto;
      transition: filter 0.15s ease, transform 0.15s ease, opacity 0.3s ease;
      opacity: 0.4;
      pointer-events: none;
      box-shadow: 0 0 20px rgba(0, 191, 255, 0.2);
    `;
    btn.textContent = '下一关 →';
    btn.addEventListener('mouseenter', () => (btn.style.filter = 'brightness(1.15)'));
    btn.addEventListener('mouseleave', () => (btn.style.filter = 'brightness(1)'));
    btn.addEventListener('click', () => {
      this.engine.nextLevel();
    });
    this.uiOverlay.appendChild(btn);
    return btn;
  }

  private createHint(): HTMLElement {
    const el = document.createElement('div');
    el.style.cssText = `
      position: absolute;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(0, 0, 0, 0.8);
      border-radius: 6px;
      padding: 10px 16px;
      font-size: 12px;
      color: #B8C5E0;
      pointer-events: none;
      border-left: 3px solid #00BFFF;
      max-width: 480px;
      text-align: center;
      opacity: 0.9;
    `;
    this.uiOverlay.appendChild(el);
    return el;
  }

  private createCelebrateContainer(): HTMLElement {
    const el = document.createElement('div');
    el.style.cssText = `
      position: absolute;
      inset: 0;
      pointer-events: none;
      overflow: hidden;
      z-index: 20;
    `;
    this.uiOverlay.appendChild(el);
    return el;
  }

  private mount(): void {
    this.rootEl.appendChild(this.canvasContainer);
    this.canvasContainer.appendChild(this.uiOverlay);
    this.container.appendChild(this.rootEl);
  }

  public getCanvasContainer(): HTMLElement {
    return this.canvasContainer;
  }

  private bindEngine(): void {
    this.engine.on('loop:tick', ({ time, total }: { time: number; total: number }) => {
      this.updateTimer(time, total);
    });

    this.engine.on('level:start', ({ level }: { level: LevelConfig }) => {
      this.levelLabelEl.textContent = `关卡 ${level.id} / LEVEL ${level.id} - ${level.name}`;
      this.hintEl.textContent = `💡 ${level.hint}  |  左键放置 / 右键拆除`;
      this.nextLevelBtn.style.opacity = '0.4';
      (this.nextLevelBtn.style as any).pointerEvents = 'none';
      this.clearCelebrate();
    });

    this.engine.on('blueprint:updated', ({ blueprint }: { blueprint: number[][][] }) => {
      this.currentBlueprint = blueprint;
      this.drawBlueprintOn(this.blueprintCanvas, blueprint);
    });

    this.engine.on('level:complete', ({ endPos }: { level: LevelConfig; endPos: BlockPosition }) => {
      this.spawnCelebrateDOM();
      const next = this.engine.getCurrentLevelId() < this.engine.getLevels().length;
      if (next) {
        this.nextLevelBtn.style.opacity = '1';
        (this.nextLevelBtn.style as any).pointerEvents = 'auto';
      }
    });

    this.engine.on('loop:reset', () => {
      this.clearPulse();
    });
  }

  private updateTimer(time: number, total: number): void {
    if (!this.timerProgressCircle || !this.timerTextEl) return;
    const circumference = 2 * Math.PI * 40;
    const progress = Math.max(0, time / total);
    const offset = circumference * (1 - progress);
    try {
      (this.timerProgressCircle.style as any).transition = 'stroke-dashoffset 0.2s linear';
    } catch (e) { /* SVG style may not allow direct assignment in some browsers */ }
    this.timerProgressCircle.setAttribute('stroke-dashoffset', String(offset));
    this.timerTextEl.textContent = String(Math.ceil(time));

    if (time <= 15) {
      this.startPulse();
    } else {
      this.clearPulse();
    }
  }

  private startPulse(): void {
    if (!this.timerPulseEl) return;
    const pulse = this.timerPulseEl as HTMLElement;
    if (pulse.dataset.active === '1') return;
    pulse.dataset.active = '1';
    pulse.style.opacity = '1';
    pulse.style.animation = 'chronoblock-timer-pulse 0.5s ease-in-out infinite';
  }

  private clearPulse(): void {
    if (this.pulseInterval !== null) {
      clearInterval(this.pulseInterval);
      this.pulseInterval = null;
    }
    if (!this.timerPulseEl) return;
    const pulse = this.timerPulseEl as HTMLElement;
    pulse.dataset.active = '';
    pulse.style.opacity = '0';
    pulse.style.animation = 'none';
    pulse.style.boxShadow = 'none';
  }

  private drawBlueprintOn(canvas: HTMLCanvasElement, blueprint: number[][][] | null): void {
    const ctx = canvas.getContext('2d')!;
    const W = canvas.width;
    const H = canvas.height;
    const pad = 16;
    const cellW = (W - pad * 2) / GRID_SIZE;
    const cellH = (H - pad * 2) / GRID_SIZE;
    ctx.clearRect(0, 0, W, H);

    // Draw grid background
    ctx.fillStyle = '#0a0f1f';
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = 'rgba(15, 52, 96, 0.6)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= GRID_SIZE; i++) {
      ctx.beginPath();
      ctx.moveTo(pad + i * cellW, pad);
      ctx.lineTo(pad + i * cellW, pad + GRID_SIZE * cellH);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(pad, pad + i * cellH);
      ctx.lineTo(pad + GRID_SIZE * cellW, pad + i * cellH);
      ctx.stroke();
    }

    // Draw blueprint blocks (green placed, red removed)
    if (blueprint) {
      for (let x = 0; x < GRID_SIZE; x++) {
        for (let z = 0; z < GRID_SIZE; z++) {
          let maxH = 0;
          let type = 0;
          for (let y = 0; y <= MAX_HEIGHT; y++) {
            const v = blueprint[x][z][y];
            if (v !== 0) {
              maxH = y;
              type = v;
            }
          }
          if (type !== 0) {
            const intensity = Math.min(1, 0.3 + maxH * 0.15);
            if (type === 1) {
              ctx.fillStyle = `rgba(0, 255, 136, ${0.27 + intensity * 0.4})`;
            } else {
              ctx.fillStyle = `rgba(255, 80, 80, ${0.27 + intensity * 0.4})`;
            }
            ctx.fillRect(
              pad + z * cellW + 1,
              pad + x * cellH + 1,
              cellW - 2,
              cellH - 2
            );
            if (maxH > 0) {
              ctx.fillStyle = 'rgba(255,255,255,0.85)';
              ctx.font = `${Math.floor(cellH * 0.5)}px monospace`;
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillText(
                String(maxH),
                pad + z * cellW + cellW / 2,
                pad + x * cellH + cellH / 2
              );
            }
          }
        }
      }
    } else {
      ctx.fillStyle = 'rgba(224, 224, 224, 0.35)';
      ctx.font = `${Math.floor(cellH * 0.7)}px monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('等待循环', W / 2, H / 2 - 10);
      ctx.font = `${Math.floor(cellH * 0.45)}px monospace`;
      ctx.fillStyle = 'rgba(224, 224, 224, 0.25)';
      ctx.fillText('(首次循环重置后显示)', W / 2, H / 2 + cellH);
    }
  }

  private spawnCelebrateDOM(): void {
    const colors = ['#FFD700', '#FFFFFF', '#00FFFF'];
    const count = 30;
    const rect = this.celebrateContainer.getBoundingClientRect();
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    for (let i = 0; i < count; i++) {
      const p = document.createElement('div');
      const angle = Math.random() * Math.PI * 2;
      const dist = 80 + Math.random() * 180;
      const tx = cx + Math.cos(angle) * dist;
      const ty = cy + Math.sin(angle) * dist - 40;
      const animDuration = 0.25 + Math.random() * 0.25;
      p.style.cssText = `
        position: absolute;
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: ${colors[i % 3]};
        left: ${cx}px;
        top: ${cy}px;
        box-shadow: 0 0 10px ${colors[i % 3]};
        pointer-events: none;
        opacity: 1;
        animation: chronoblock-celebrate-color ${animDuration}s steps(1, end) infinite;
        animation-delay: ${(Math.random() * 0.2).toFixed(3)}s;
      `;
      this.celebrateContainer.appendChild(p);
      gsap.to(p, {
        x: tx - cx,
        y: ty - cy,
        opacity: 0,
        scale: 0.5,
        duration: 1.5,
        ease: 'power3.out',
        onComplete: () => p.remove()
      });
    }

    const banner = document.createElement('div');
    banner.style.cssText = `
      position: absolute;
      left: 50%;
      top: 30%;
      transform: translateX(-50%) scale(0.5);
      padding: 18px 40px;
      background: linear-gradient(135deg, rgba(255,215,0,0.25), rgba(0,191,255,0.25));
      border: 2px solid #FFD700;
      border-radius: 12px;
      font-size: 32px;
      font-family: monospace;
      color: #FFD700;
      text-shadow: 0 0 20px rgba(255,215,0,0.6);
      letter-spacing: 4px;
      opacity: 0;
      pointer-events: none;
    `;
    banner.textContent = '✦ 通关成功 LEVEL CLEAR ✦';
    this.celebrateContainer.appendChild(banner);
    gsap.to(banner, {
      opacity: 1,
      scale: 1,
      duration: 0.6,
      ease: 'back.out(1.7)'
    });
    gsap.to(banner, {
      opacity: 0,
      scale: 1.1,
      duration: 0.6,
      delay: 1.8,
      ease: 'power2.in',
      onComplete: () => banner.remove()
    });
  }

  private clearCelebrate(): void {
    this.celebrateContainer.innerHTML = '';
  }

  destroy(): void {
    this.clearPulse();
    this.rootEl.remove();
  }
}
