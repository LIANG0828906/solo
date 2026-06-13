import { TypingEngine, KeyPressRecord } from './typingEngine';

const HEATMAP_ROWS_DESKTOP = 6;
const HEATMAP_COLS = 10;

const KEYBOARD_LAYOUT = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', ';'],
  ['Z', 'X', 'C', 'V', 'B', 'N', 'M', ',', '.', '/'],
  ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
  ['-', '=', '[', ']', '\\', '\'', 'ENTER', 'SHIFT', 'TAB', 'CAPS'],
  ['F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10']
];

const MOBILE_LAYOUT = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', ';'],
  ['Z', 'X', 'C', 'V', 'B', 'N', 'M', ',', '.', '/']
];

const COLOR_LIGHT_BLUE = { r: 135, g: 206, b: 235 };
const COLOR_WHITE = { r: 255, g: 255, b: 255 };
const COLOR_DARK_PURPLE = { r: 139, g: 92, b: 246 };

interface PulseAnimation {
  row: number;
  col: number;
  startTime: number;
  key: string;
}

interface BorderFlash {
  row: number;
  col: number;
  startTime: number;
}

export class UIRenderer {
  private container: HTMLElement;
  private engine: TypingEngine;

  private typingCanvas!: HTMLCanvasElement;
  private typingCtx!: CanvasRenderingContext2D;
  private heatmapCanvas!: HTMLCanvasElement;
  private heatmapCtx!: CanvasRenderingContext2D;
  private timerCanvas!: HTMLCanvasElement;
  private timerCtx!: CanvasRenderingContext2D;

  private typingArea!: HTMLDivElement;
  private controlPanel!: HTMLDivElement;
  private wpmDisplay!: HTMLDivElement;
  private remainingDisplay!: HTMLDivElement;
  private difficultyBtns!: HTMLButtonElement[];
  private progressBar!: HTMLDivElement;
  private progressFill!: HTMLDivElement;

  private animFrameId: number = 0;
  private lastWpmUpdate: number = 0;
  private currentWpm: number = 0;

  private pulses: PulseAnimation[] = [];
  private borderFlashes: BorderFlash[] = [];

  private shakeOffset: number = 0;
  private lastShakeIndex: number = -1;
  private shakeStart: number = 0;

  private isMobile: boolean = false;

  private savedKeyPressTime: number = 0;

  constructor(container: HTMLElement, engine: TypingEngine) {
    this.container = container;
    this.engine = engine;
    this.difficultyBtns = [];

    this.buildDOM();
    this.setupEvents();
    this.checkMobile();
  }

  private buildDOM(): void {
    this.container.innerHTML = '';

    const wrapper = document.createElement('div');
    wrapper.style.cssText = `
      width: 100%; height: 100%;
      display: flex; flex-direction: column;
      padding: 20px;
      overflow-y: auto;
    `;

    this.typingArea = document.createElement('div');
    this.typingArea.style.cssText = `
      background: #1e1e2e;
      border-radius: 16px;
      padding: 24px 28px;
      margin-bottom: 20px;
      position: relative;
      min-height: 180px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    `;

    this.typingCanvas = document.createElement('canvas');
    this.typingCanvas.style.cssText = `width: 100%; height: 100%; display: block;`;
    this.typingArea.appendChild(this.typingCanvas);

    this.timerCanvas = document.createElement('canvas');
    this.timerCanvas.width = 60;
    this.timerCanvas.height = 60;
    this.timerCanvas.style.cssText = `
      position: absolute;
      top: 12px;
      right: 12px;
      width: 60px;
      height: 60px;
    `;
    this.typingArea.appendChild(this.timerCanvas);

    this.timerCtx = this.timerCanvas.getContext('2d')!;

    wrapper.appendChild(this.typingArea);

    this.controlPanel = document.createElement('div');
    this.controlPanel.style.cssText = `
      background: #1e1e2e;
      border-radius: 16px;
      padding: 20px 24px;
      margin-bottom: 20px;
      flex-shrink: 0;
    `;

    const statsRow = document.createElement('div');
    statsRow.style.cssText = `
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 16px;
      flex-wrap: wrap;
      gap: 12px;
    `;

    this.wpmDisplay = document.createElement('div');
    this.wpmDisplay.style.cssText = `
      font-size: 36px; font-weight: 700;
      color: #50fa7b;
      font-family: 'Consolas', 'Monaco', monospace;
      min-width: 120px;
    `;
    this.wpmDisplay.textContent = '0 WPM';

    this.remainingDisplay = document.createElement('div');
    this.remainingDisplay.style.cssText = `
      font-size: 16px;
      color: #e2e8f0;
      font-family: 'Consolas', 'Monaco', monospace;
    `;
    this.remainingDisplay.textContent = 'Words: 0';

    const diffContainer = document.createElement('div');
    diffContainer.style.cssText = `display: flex; gap: 8px;`;

    const difficulties: { label: string; value: string; gradient: string }[] = [
      { label: 'Easy', value: 'easy', gradient: 'linear-gradient(135deg, #667eea, #764ba2)' },
      { label: 'Normal', value: 'normal', gradient: 'linear-gradient(135deg, #f093fb, #f5576c)' },
      { label: 'Hard', value: 'hard', gradient: 'linear-gradient(135deg, #c62828, #880e4f)' }
    ];

    difficulties.forEach(d => {
      const btn = document.createElement('button');
      btn.textContent = d.label;
      btn.dataset.difficulty = d.value;
      btn.style.cssText = `
        padding: 8px 20px;
        border: none;
        border-radius: 8px;
        color: #e2e8f0;
        font-family: 'Consolas', 'Monaco', monospace;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        background: ${d.gradient};
        opacity: 0.5;
      `;
      if (d.value === this.engine.getDifficulty()) {
        btn.style.opacity = '1';
        btn.style.transform = 'scale(1.05)';
        btn.style.boxShadow = '0 4px 15px rgba(0,0,0,0.3)';
      }
      btn.addEventListener('click', () => {
        this.engine.setDifficulty(d.value as any);
        this.engine.startNewRound();
        this.resetPulseAnimations();
        this.updateDifficultyButtons();
      });
      this.difficultyBtns.push(btn);
      diffContainer.appendChild(btn);
    });

    statsRow.appendChild(this.wpmDisplay);
    statsRow.appendChild(this.remainingDisplay);
    statsRow.appendChild(diffContainer);

    this.progressBar = document.createElement('div');
    this.progressBar.style.cssText = `
      width: 100%;
      height: 6px;
      background: rgba(255,255,255,0.1);
      border-radius: 3px;
      overflow: hidden;
    `;

    this.progressFill = document.createElement('div');
    this.progressFill.style.cssText = `
      height: 100%;
      width: 100%;
      background: linear-gradient(90deg, #50fa7b, #ff5555);
      border-radius: 3px;
      transition: width 0.1s linear;
    `;
    this.progressBar.appendChild(this.progressFill);

    this.controlPanel.appendChild(statsRow);
    this.controlPanel.appendChild(this.progressBar);

    wrapper.appendChild(this.controlPanel);

    const heatmapSection = document.createElement('div');
    heatmapSection.style.cssText = `
      background: #1e1e2e;
      border-radius: 16px;
      padding: 20px;
      flex-shrink: 0;
    `;

    const heatmapTitle = document.createElement('div');
    heatmapTitle.style.cssText = `
      font-size: 14px;
      color: #e2e8f0;
      margin-bottom: 12px;
      font-weight: 600;
      font-family: 'Consolas', 'Monaco', monospace;
    `;
    heatmapTitle.textContent = 'Keystroke Heatmap';
    heatmapSection.appendChild(heatmapTitle);

    this.heatmapCanvas = document.createElement('canvas');
    this.heatmapCanvas.style.cssText = `width: 100%; display: block;`;
    heatmapSection.appendChild(this.heatmapCanvas);

    wrapper.appendChild(heatmapSection);

    this.container.appendChild(wrapper);

    this.resizeCanvases();
  }

  private setupEvents(): void {
    this.engine.on('keyPress', (record: KeyPressRecord) => {
      this.addPulseAnimation(record.key);
      this.savedKeyPressTime = performance.now();
    });

    this.engine.on('inputChange', () => {
      this.forceRender();
    });

    this.engine.on('timerTick', () => {
      const remaining = this.engine.getTimeRemaining();
      const total = this.engine.getTotalDuration();
      const pct = remaining / total;
      this.progressFill.style.width = `${pct * 100}%`;
    });

    window.addEventListener('resize', () => {
      this.checkMobile();
      this.resizeCanvases();
    });
  }

  private checkMobile(): void {
    this.isMobile = window.innerWidth < 768;
  }

  private updateDifficultyButtons(): void {
    const current = this.engine.getDifficulty();
    this.difficultyBtns.forEach(btn => {
      if (btn.dataset.difficulty === current) {
        btn.style.opacity = '1';
        btn.style.transform = 'scale(1.05)';
        btn.style.boxShadow = '0 4px 15px rgba(0,0,0,0.3)';
      } else {
        btn.style.opacity = '0.5';
        btn.style.transform = 'scale(1)';
        btn.style.boxShadow = 'none';
      }
    });
  }

  private addPulseAnimation(key: string): void {
    const layout = this.isMobile ? MOBILE_LAYOUT : KEYBOARD_LAYOUT;
    const lowerKey = key.toLowerCase();

    for (let r = 0; r < layout.length; r++) {
      for (let c = 0; c < layout[r].length; c++) {
        if (layout[r][c].toLowerCase() === lowerKey) {
          this.pulses.push({ row: r, col: c, startTime: performance.now(), key });
          this.borderFlashes.push({ row: r, col: c, startTime: performance.now() });
          return;
        }
      }
    }
  }

  private resetPulseAnimations(): void {
    this.pulses = [];
    this.borderFlashes = [];
  }

  resizeCanvases(): void {
    const dpr = window.devicePixelRatio || 1;

    const typingRect = this.typingArea.getBoundingClientRect();
    const tw = typingRect.width - 56;
    const th = typingRect.height - 48;
    this.typingCanvas.width = tw * dpr;
    this.typingCanvas.height = th * dpr;
    this.typingCanvas.style.width = tw + 'px';
    this.typingCanvas.style.height = th + 'px';
    this.typingCtx = this.typingCanvas.getContext('2d')!;
    this.typingCtx.scale(dpr, dpr);

    const heatmapParent = this.heatmapCanvas.parentElement!;
    const hmW = heatmapParent.clientWidth - 40;
    const rows = this.isMobile ? 3 : HEATMAP_ROWS_DESKTOP;
    const cellSize = Math.floor(hmW / HEATMAP_COLS);
    const hmH = rows * cellSize;
    this.heatmapCanvas.width = hmW * dpr;
    this.heatmapCanvas.height = hmH * dpr;
    this.heatmapCanvas.style.width = hmW + 'px';
    this.heatmapCanvas.style.height = hmH + 'px';
    this.heatmapCtx = this.heatmapCanvas.getContext('2d')!;
    this.heatmapCtx.scale(dpr, dpr);
  }

  start(): void {
    const loop = (time: number) => {
      this.render(time);
      this.animFrameId = requestAnimationFrame(loop);
    };
    this.animFrameId = requestAnimationFrame(loop);
  }

  stop(): void {
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
    }
  }

  forceRender(): void {
    this.render(performance.now());
  }

  private render(time: number): void {
    this.renderTypingText(time);
    this.renderTimer(time);
    this.renderHeatmap(time);
    this.renderStats(time);
  }

  private renderTypingText(time: number): void {
    const ctx = this.typingCtx;
    if (!ctx) return;

    const canvas = this.typingCanvas;
    const w = canvas.width / (window.devicePixelRatio || 1);
    const h = canvas.height / (window.devicePixelRatio || 1);

    ctx.clearRect(0, 0, w, h);

    const sentence = this.engine.getCurrentSentence();
    if (!sentence) return;

    const fontSize = this.isMobile ? 16 : 20;
    ctx.font = `${fontSize}px 'Consolas', 'Monaco', 'Courier New', monospace`;
    ctx.textBaseline = 'middle';

    const charWidth = ctx.measureText('M').width;
    const maxCharsPerLine = Math.floor((w - 20) / charWidth);
    const lineHeight = fontSize * 1.8;

    const lines: string[] = [];
    let currentLine = '';
    for (let i = 0; i < sentence.length; i++) {
      currentLine += sentence[i];
      if (currentLine.length >= maxCharsPerLine - 1 && i < sentence.length - 1) {
        const lastSpace = currentLine.lastIndexOf(' ');
        if (lastSpace > 0) {
          lines.push(currentLine.slice(0, lastSpace));
          currentLine = currentLine.slice(lastSpace + 1);
        } else {
          lines.push(currentLine);
          currentLine = '';
        }
      }
    }
    if (currentLine) lines.push(currentLine);

    const totalHeight = lines.length * lineHeight;
    const startY = (h - totalHeight) / 2 + lineHeight / 2;
    const startX = 10;

    let globalIdx = 0;
    const userIndex = this.engine.getCurrentIndex();
    const userInput = this.engine.getUserInput();
    const shakeIndices = this.engine.getShakeIndices();
    const correctAnimIndices = this.engine.getCorrectAnimationIndices();

    for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
      const line = lines[lineIdx];
      let x = startX;

      for (let charIdx = 0; charIdx < line.length; charIdx++) {
        const gi = globalIdx;
        const ch = line[charIdx];

        let offsetY = 0;
        let charColor = '#6c7086';
        let bgColor = '';

        if (gi < userIndex) {
          if (userInput[gi] === sentence[gi]) {
            const animStart = correctAnimIndices[gi];
            const elapsed = animStart ? (time - animStart) : 1000;
            const liftProgress = Math.min(1, elapsed / 300);
            offsetY = -3 * liftProgress;
            charColor = '#50fa7b';
          } else {
            charColor = '#ff5555';
            bgColor = 'rgba(255, 85, 85, 0.3)';
          }
        } else if (gi === userIndex) {
          charColor = '#e2e8f0';
          bgColor = 'rgba(226, 232, 240, 0.15)';
        }

        const shakeTime = shakeIndices[gi];
        let shakeX = 0;
        if (shakeTime) {
          const shakeElapsed = time - shakeTime;
          if (shakeElapsed < 200) {
            const intensity = 1 - shakeElapsed / 200;
            shakeX = Math.sin(shakeElapsed / 20) * 4 * intensity;
          }
        }

        if (bgColor) {
          ctx.fillStyle = bgColor;
          ctx.fillRect(x - 2 + shakeX, startY + lineIdx * lineHeight + offsetY - fontSize / 2 - 2, charWidth + 4, fontSize + 4);
        }

        ctx.fillStyle = charColor;
        ctx.fillText(ch, x + shakeX, startY + lineIdx * lineHeight + offsetY);

        x += charWidth;
        globalIdx++;
      }
      globalIdx += sentence.length - sentence.split('').filter((_, i) => {
        let pos = 0;
        for (let l = 0; l <= lineIdx; l++) {
          if (l === lineIdx) return i < lines[l].length;
        }
        return false;
      }).length;
    }
  }

  private renderTimer(time: number): void {
    const ctx = this.timerCtx;
    if (!ctx) return;

    const size = 60;
    const center = size / 2;
    const radius = (size - 6) / 2;
    const strokeWidth = 6;

    ctx.clearRect(0, 0, size, size);

    ctx.beginPath();
    ctx.arc(center, center, radius, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.lineWidth = strokeWidth;
    ctx.stroke();

    const remaining = this.engine.getTimeRemaining();
    const total = this.engine.getTotalDuration();
    const progress = remaining / total;

    const secondsRemaining = remaining / 1000;
    const currentSecond = Math.ceil(secondsRemaining);
    const secondProgress = currentSecond / (total / 1000);

    const r = Math.round(255 * (1 - secondProgress));
    const g = Math.round(255 * secondProgress);
    const timerColor = `rgb(${r}, ${g}, 50)`;

    const startAngle = -Math.PI / 2;
    const endAngle = startAngle + progress * Math.PI * 2;

    ctx.beginPath();
    ctx.arc(center, center, radius, startAngle, endAngle);
    ctx.strokeStyle = timerColor;
    ctx.lineWidth = strokeWidth;
    ctx.lineCap = 'round';
    ctx.stroke();

    ctx.fillStyle = '#e2e8f0';
    ctx.font = 'bold 14px Consolas, Monaco, monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(Math.ceil(secondsRemaining).toString(), center, center);
    ctx.textAlign = 'start';
  }

  private renderHeatmap(time: number): void {
    const ctx = this.heatmapCtx;
    if (!ctx) return;

    const canvas = this.heatmapCanvas;
    const w = canvas.width / (window.devicePixelRatio || 1);
    const h = canvas.height / (window.devicePixelRatio || 1);

    ctx.clearRect(0, 0, w, h);

    const layout = this.isMobile ? MOBILE_LAYOUT : KEYBOARD_LAYOUT;
    const rows = layout.length;
    const cellW = w / HEATMAP_COLS;
    const cellH = h / rows;
    const gap = 3;
    const radius = 6;

    const keyCounts = this.engine.getKeyCountMap();
    let maxCount = 0;
    for (const key in keyCounts) {
      if (keyCounts[key] > maxCount) maxCount = keyCounts[key];
    }
    if (maxCount === 0) maxCount = 1;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < layout[r].length && c < HEATMAP_COLS; c++) {
        const key = layout[r][c];
        const lowerKey = key.toLowerCase();
        const count = keyCounts[lowerKey] || 0;
        const normalized = count / maxCount;

        const x = c * cellW + gap;
        const y = r * cellH + gap;
        const cw = cellW - gap * 2;
        const ch = cellH - gap * 2;

        let fillColor: string;
        if (normalized === 0) {
          fillColor = 'rgba(135, 206, 235, 0.15)';
        } else {
          fillColor = this.interpolateHeatmapColor(normalized);
        }

        const isFlashing = this.isBorderFlashing(r, c, time);
        const borderColor = isFlashing ? '#ffffff' : 'rgba(255, 255, 255, 0.1)';
        const borderWidth = isFlashing ? 2 : 1;

        ctx.fillStyle = fillColor;
        this.roundRect(ctx, x, y, cw, ch, radius);
        ctx.fill();

        ctx.strokeStyle = borderColor;
        ctx.lineWidth = borderWidth;
        this.roundRect(ctx, x, y, cw, ch, radius);
        ctx.stroke();

        ctx.fillStyle = normalized > 0.5 ? '#ffffff' : '#e2e8f0';
        ctx.font = `${this.isMobile ? 10 : 12}px Consolas, Monaco, monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(key, x + cw / 2, y + ch / 2);

        if (count > 0) {
          ctx.font = `${this.isMobile ? 8 : 9}px Consolas, Monaco, monospace`;
          ctx.fillStyle = 'rgba(226, 232, 240, 0.6)';
          ctx.fillText(count.toString(), x + cw / 2, y + ch - 6);
        }

        this.renderPulseAtCell(ctx, r, c, x, y, cw, ch, time);
      }
    }
  }

  private interpolateHeatmapColor(t: number): string {
    let r: number, g: number, b: number;
    if (t < 0.5) {
      const s = t * 2;
      r = Math.round(COLOR_LIGHT_BLUE.r + (COLOR_WHITE.r - COLOR_LIGHT_BLUE.r) * s);
      g = Math.round(COLOR_LIGHT_BLUE.g + (COLOR_WHITE.g - COLOR_LIGHT_BLUE.g) * s);
      b = Math.round(COLOR_LIGHT_BLUE.b + (COLOR_WHITE.b - COLOR_LIGHT_BLUE.b) * s);
    } else {
      const s = (t - 0.5) * 2;
      r = Math.round(COLOR_WHITE.r + (COLOR_DARK_PURPLE.r - COLOR_WHITE.r) * s);
      g = Math.round(COLOR_WHITE.g + (COLOR_DARK_PURPLE.g - COLOR_WHITE.g) * s);
      b = Math.round(COLOR_WHITE.b + (COLOR_DARK_PURPLE.b - COLOR_WHITE.b) * s);
    }
    return `rgb(${r}, ${g}, ${b})`;
  }

  private isBorderFlashing(row: number, col: number, time: number): boolean {
    for (let i = this.borderFlashes.length - 1; i >= 0; i--) {
      const f = this.borderFlashes[i];
      const elapsed = time - f.startTime;
      if (f.row === row && f.col === col && elapsed < 500) {
        return true;
      }
      if (elapsed > 500) {
        this.borderFlashes.splice(i, 1);
      }
    }
    return false;
  }

  private renderPulseAtCell(ctx: CanvasRenderingContext2D, row: number, col: number, x: number, y: number, cw: number, ch: number, time: number): void {
    for (let i = this.pulses.length - 1; i >= 0; i--) {
      const p = this.pulses[i];
      if (p.row !== row || p.col !== col) continue;

      const elapsed = time - p.startTime;
      if (elapsed > 400) {
        this.pulses.splice(i, 1);
        continue;
      }

      const progress = elapsed / 400;
      const maxRadius = Math.max(cw, ch) * 0.8;
      const currentRadius = maxRadius * progress;
      const alpha = 1 - progress;

      const cx = x + cw / 2;
      const cy = y + ch / 2;

      ctx.save();
      ctx.beginPath();
      this.roundRect(ctx, x, y, cw, ch, 6);
      ctx.clip();

      ctx.beginPath();
      ctx.arc(cx, cy, currentRadius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.5})`;
      ctx.fill();

      ctx.restore();
    }
  }

  private roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  private renderStats(time: number): void {
    if (time - this.lastWpmUpdate >= 100) {
      this.currentWpm = this.engine.getWPM();
      this.wpmDisplay.textContent = `${this.currentWpm} WPM`;

      if (this.currentWpm > 80) {
        this.wpmDisplay.style.color = '#ff5555';
      } else if (this.currentWpm > 50) {
        this.wpmDisplay.style.color = '#f1fa8c';
      } else {
        this.wpmDisplay.style.color = '#50fa7b';
      }

      this.lastWpmUpdate = time;
    }

    const remaining = this.engine.getRemainingWords();
    this.remainingDisplay.textContent = `Words: ${remaining}`;
  }
}
