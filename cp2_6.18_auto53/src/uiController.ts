import { PlayerState, GameMode } from './gameEngine';
import { SongInfo } from './audioAnalyzer';

type GameState = 'menu' | 'song_select' | 'playing' | 'paused' | 'result';

export class UIController {
  private container: HTMLElement;
  private currentState: GameState = 'menu';
  private mode: GameMode = 'single';
  private songs: SongInfo[] = [];
  private onModeSelect: ((mode: GameMode) => void) | null = null;
  private onSongSelect: ((song: SongInfo) => void) | null = null;
  private onResume: (() => void) | null = null;
  private onRestart: (() => void) | null = null;
  private onBackToSongs: (() => void) | null = null;

  private menuEl: HTMLElement | null = null;
  private songSelectEl: HTMLElement | null = null;
  private hudEl: HTMLElement | null = null;
  private pauseEl: HTMLElement | null = null;
  private resultEl: HTMLElement | null = null;
  private particleCanvas: HTMLCanvasElement | null = null;
  private particleCtx: CanvasRenderingContext2D | null = null;
  private menuParticles: Array<{
    x: number; y: number; size: number; speed: number; offset: number;
  }> = [];

  private comboFlashEl: HTMLElement | null = null;
  private feverOverlayEl: HTMLElement | null = null;
  private judgeTexts: Array<{
    el: HTMLElement; startTime: number; duration: number; playerIndex: number;
  }> = [];

  private freqBarsLeft: HTMLElement[] = [];
  private freqBarsRight: HTMLElement[] = [];

  constructor(container: HTMLElement) {
    this.container = container;
  }

  setCallbacks(callbacks: {
    onModeSelect: (mode: GameMode) => void;
    onSongSelect: (song: SongInfo) => void;
    onResume: () => void;
    onRestart: () => void;
    onBackToSongs: () => void;
  }): void {
    this.onModeSelect = callbacks.onModeSelect;
    this.onSongSelect = callbacks.onSongSelect;
    this.onResume = callbacks.onResume;
    this.onRestart = callbacks.onRestart;
    this.onBackToSongs = callbacks.onBackToSongs;
  }

  showMenu(): void {
    this.currentState = 'menu';
    this.clearAll();
    this.createMenuParticles();

    const menu = document.createElement('div');
    menu.id = 'menu-screen';
    menu.style.cssText = `
      position:absolute;inset:0;display:flex;flex-direction:column;
      align-items:center;justify-content:center;z-index:100;
    `;

    const title = document.createElement('h1');
    title.textContent = 'ECHO ARENA';
    title.style.cssText = `
      font-size:72px;font-weight:900;letter-spacing:12px;
      color:#00BFFF;text-shadow:0 0 30px rgba(0,191,255,0.6),
      0 0 60px rgba(0,191,255,0.3),0 0 100px rgba(0,191,255,0.15);
      margin-bottom:12px;
    `;
    menu.appendChild(title);

    const subtitle = document.createElement('p');
    subtitle.textContent = '节奏对战';
    subtitle.style.cssText = `
      font-size:18px;letter-spacing:6px;color:#888;
      margin-bottom:60px;
    `;
    menu.appendChild(subtitle);

    const btnContainer = document.createElement('div');
    btnContainer.style.cssText = 'display:flex;gap:24px;';

    const singleBtn = this.createButton('单人练习', () => {
      this.mode = 'single';
      this.onModeSelect?.('single');
    });
    const dualBtn = this.createButton('双人对战', () => {
      const w = window.innerWidth;
      if (w < 480) {
        alert('分屏需更大屏幕');
        return;
      }
      this.mode = 'dual';
      this.onModeSelect?.('dual');
    });

    btnContainer.appendChild(singleBtn);
    btnContainer.appendChild(dualBtn);
    menu.appendChild(btnContainer);

    this.container.appendChild(menu);
    this.menuEl = menu;
  }

  showSongSelect(songs: SongInfo[]): void {
    this.currentState = 'song_select';
    this.songs = songs;
    this.clearAll();

    const screen = document.createElement('div');
    screen.id = 'song-select';
    screen.style.cssText = `
      position:absolute;inset:0;display:flex;flex-direction:column;
      align-items:center;justify-content:center;z-index:100;
    `;

    const title = document.createElement('h2');
    title.textContent = '选择曲目';
    title.style.cssText = `
      font-size:36px;color:#00BFFF;letter-spacing:4px;
      text-shadow:0 0 15px rgba(0,191,255,0.4);margin-bottom:40px;
    `;
    screen.appendChild(title);

    const cardContainer = document.createElement('div');
    cardContainer.style.cssText = 'display:flex;gap:24px;flex-wrap:wrap;justify-content:center;';

    songs.forEach(song => {
      const card = document.createElement('div');
      card.style.cssText = `
        width:200px;padding:24px;background:rgba(30,30,30,0.9);
        border:1px solid #333;border-radius:12px;cursor:pointer;
        transition:all 0.2s;text-align:center;
      `;
      card.addEventListener('mouseenter', () => {
        card.style.borderColor = '#00BFFF';
        card.style.transform = 'scale(1.05)';
        card.style.boxShadow = '0 0 20px rgba(0,191,255,0.3)';
      });
      card.addEventListener('mouseleave', () => {
        card.style.borderColor = '#333';
        card.style.transform = 'scale(1)';
        card.style.boxShadow = 'none';
      });

      const nameEl = document.createElement('div');
      nameEl.textContent = song.name;
      nameEl.style.cssText = 'font-size:18px;color:#fff;margin-bottom:12px;';

      const bpmEl = document.createElement('div');
      bpmEl.textContent = `BPM: ${song.bpm}`;
      bpmEl.style.cssText = 'font-size:14px;color:#888;margin-bottom:8px;';

      const durEl = document.createElement('div');
      durEl.textContent = `${song.duration}s`;
      durEl.style.cssText = 'font-size:14px;color:#888;';

      card.appendChild(nameEl);
      card.appendChild(bpmEl);
      card.appendChild(durEl);
      card.addEventListener('click', () => this.onSongSelect?.(song));
      cardContainer.appendChild(card);
    });

    screen.appendChild(cardContainer);

    const backBtn = this.createButton('返回', () => this.showMenu());
    backBtn.style.marginTop = '40px';
    screen.appendChild(backBtn);

    this.container.appendChild(screen);
    this.songSelectEl = screen;
  }

  showHUD(playerCount: number): void {
    this.currentState = 'playing';
    this.clearAll();

    const hud = document.createElement('div');
    hud.id = 'game-hud';
    hud.style.cssText = 'position:absolute;inset:0;pointer-events:none;z-index:50;';

    const isHorizontal = window.innerWidth >= 960;

    for (let i = 0; i < playerCount; i++) {
      const panel = document.createElement('div');
      panel.id = `player-hud-${i}`;
      panel.className = 'player-hud';
      panel.style.cssText = `
        position:absolute;pointer-events:auto;opacity:0.6;
        transition:opacity 0.3s;padding:16px;
        ${isHorizontal
          ? `left:${i === 0 ? '0' : '50%'};top:0;width:50%;`
          : `left:0;top:${i === 0 ? '0' : '50%'};height:50%;width:100%;`}
      `;

      panel.addEventListener('mouseenter', () => { panel.style.opacity = '1'; });
      panel.addEventListener('mouseleave', () => { panel.style.opacity = '0.6'; });

      const scoreEl = document.createElement('div');
      scoreEl.id = `score-${i}`;
      scoreEl.style.cssText = `
        font-size:36px;color:#fff;
        text-shadow:0 0 8px rgba(255,255,255,0.5);
      `;
      scoreEl.textContent = '0';

      const comboEl = document.createElement('div');
      comboEl.id = `combo-${i}`;
      comboEl.style.cssText = 'font-size:24px;color:#fff;';
      comboEl.textContent = '0 COMBO';

      const energyContainer = document.createElement('div');
      energyContainer.style.cssText = `
        width:300px;height:20px;background:#2A2A2A;
        border-radius:10px;overflow:hidden;margin-top:8px;
      `;
      const energyFill = document.createElement('div');
      energyFill.id = `energy-${i}`;
      energyFill.style.cssText = `
        width:0%;height:100%;border-radius:10px;
        background:linear-gradient(90deg,#00BFFF,#FF4500);
        transition:width 0.2s;
      `;
      energyContainer.appendChild(energyFill);

      panel.appendChild(scoreEl);
      panel.appendChild(comboEl);
      panel.appendChild(energyContainer);
      hud.appendChild(panel);
    }

    const pauseBtn = document.createElement('div');
    pauseBtn.style.cssText = `
      position:absolute;top:16px;left:50%;transform:translateX(-50%);
      pointer-events:auto;cursor:pointer;font-size:24px;color:#fff;
      opacity:0.6;transition:opacity 0.3s;
    `;
    pauseBtn.textContent = '❚❚';
    pauseBtn.addEventListener('mouseenter', () => { pauseBtn.style.opacity = '1'; });
    pauseBtn.addEventListener('mouseleave', () => { pauseBtn.style.opacity = '0.6'; });
    pauseBtn.addEventListener('click', () => this.showPause());
    hud.appendChild(pauseBtn);

    this.createSpectrumBars(hud, playerCount);

    this.comboFlashEl = document.createElement('div');
    this.comboFlashEl.style.cssText = `
      position:absolute;inset:0;pointer-events:none;opacity:0;
      transition:opacity 0.15s;
    `;
    hud.appendChild(this.comboFlashEl);

    this.feverOverlayEl = document.createElement('div');
    this.feverOverlayEl.id = 'fever-overlay';
    this.feverOverlayEl.style.cssText = `
      position:absolute;inset:0;pointer-events:none;opacity:0;
    `;
    hud.appendChild(this.feverOverlayEl);

    this.container.appendChild(hud);
    this.hudEl = hud;
  }

  private createSpectrumBars(parent: HTMLElement, playerCount: number): void {
    const barCount = 20;
    this.freqBarsLeft = [];
    this.freqBarsRight = [];

    for (let p = 0; p < playerCount; p++) {
      const isP1 = p === 0;
      const container = document.createElement('div');
      container.style.cssText = `
        position:absolute;bottom:40px;
        ${isP1 ? 'left:10px;' : 'right:10px;'}
        display:flex;align-items:flex-end;gap:2px;
      `;

      const bars: HTMLElement[] = [];
      for (let i = 0; i < barCount; i++) {
        const bar = document.createElement('div');
        const hue = (i / barCount) * 60;
        bar.style.cssText = `
          width:4px;height:5px;
          background:hsl(${270 + hue}, 80%, 60%);
          transition:height 0.05s;border-radius:2px 2px 0 0;
        `;
        container.appendChild(bar);
        bars.push(bar);
      }

      parent.appendChild(container);
      if (isP1) this.freqBarsLeft = bars;
      else this.freqBarsRight = bars;
    }
  }

  updateSpectrum(frequencyData: Uint8Array, playerCount: number): void {
    const barCount = 20;
    for (let i = 0; i < barCount && i < frequencyData.length; i++) {
      const val = frequencyData[i] / 255;
      const h = 5 + val * 75;

      if (this.freqBarsLeft[i]) {
        this.freqBarsLeft[i].style.height = `${h}px`;
      }
      if (playerCount > 1 && this.freqBarsRight[i]) {
        this.freqBarsRight[i].style.height = `${h}px`;
      }
    }
  }

  updateHUD(states: PlayerState[]): void {
    states.forEach((state, i) => {
      const scoreEl = document.getElementById(`score-${i}`);
      if (scoreEl) scoreEl.textContent = state.score.toString();

      const comboEl = document.getElementById(`combo-${i}`);
      if (comboEl) {
        comboEl.textContent = `${state.combo} COMBO`;
        if (state.combo >= 100) {
          comboEl.style.color = '#ff0000';
          comboEl.style.animation = 'pulse 0.5s infinite';
        } else if (state.combo >= 50) {
          comboEl.style.color = '#ff8800';
          comboEl.style.animation = '';
        } else if (state.combo >= 20) {
          comboEl.style.color = '#ffd700';
          comboEl.style.animation = '';
        } else {
          comboEl.style.color = '#ffffff';
          comboEl.style.animation = '';
        }
      }

      const energyEl = document.getElementById(`energy-${i}`);
      if (energyEl) energyEl.style.width = `${state.energy}%`;

      if (state.isFever && this.feverOverlayEl) {
        this.feverOverlayEl.style.opacity = '0.15';
        const hue = (Date.now() / 50) % 360;
        this.feverOverlayEl.style.background = `
          linear-gradient(${hue}deg,
            rgba(255,0,0,0.1),
            rgba(0,255,0,0.1),
            rgba(0,0,255,0.1),
            rgba(255,255,0,0.1))
        `;
      } else if (this.feverOverlayEl) {
        this.feverOverlayEl.style.opacity = '0';
      }
    });
  }

  showJudgeFeedback(grade: 'perfect' | 'good' | 'miss', position: { x: number; y: number }, playerIndex: number): void {
    const el = document.createElement('div');
    const colors: Record<string, string> = {
      perfect: '#00FF88',
      good: '#FFD700',
      miss: '#FF3366',
    };
    const labels: Record<string, string> = {
      perfect: 'PERFECT',
      good: 'GOOD',
      miss: 'MISS',
    };

    el.textContent = labels[grade];
    el.style.cssText = `
      position:absolute;
      left:${position.x}px;top:${position.y}px;
      font-size:28px;font-weight:bold;
      color:${colors[grade]};
      text-shadow:0 0 10px ${colors[grade]};
      pointer-events:none;z-index:60;
      transition:transform 1.5s,opacity 1.5s;
    `;

    this.container.appendChild(el);

    requestAnimationFrame(() => {
      el.style.transform = 'translateY(-60px)';
      el.style.opacity = '0';
    });

    setTimeout(() => el.remove(), 1500);
  }

  triggerComboFlash(playerIndex: number): void {
    if (!this.comboFlashEl) return;

    const isHorizontal = window.innerWidth >= 960;
    this.comboFlashEl.style.background = `
      radial-gradient(ellipse at ${isHorizontal
        ? (playerIndex === 0 ? '0% 50%' : '100% 50%')
        : (playerIndex === 0 ? '50% 0%' : '50% 100%')},
        rgba(255,215,0,0.4), transparent 60%)
    `;
    this.comboFlashEl.style.opacity = '1';

    setTimeout(() => {
      if (this.comboFlashEl) this.comboFlashEl.style.opacity = '0';
    }, 300);
  }

  showPause(): void {
    if (this.currentState !== 'playing') return;
    this.currentState = 'paused';

    const pause = document.createElement('div');
    pause.id = 'pause-screen';
    pause.style.cssText = `
      position:absolute;inset:0;background:rgba(0,0,0,0.8);
      display:flex;flex-direction:column;align-items:center;
      justify-content:center;z-index:200;
    `;

    const title = document.createElement('h2');
    title.textContent = '已暂停';
    title.style.cssText = 'font-size:36px;color:#00BFFF;margin-bottom:40px;';
    pause.appendChild(title);

    const resumeBtn = this.createButton('继续', () => {
      this.removePause();
      this.onResume?.();
    });
    resumeBtn.style.marginBottom = '16px';
    pause.appendChild(resumeBtn);

    const quitBtn = this.createButton('退出', () => {
      this.removePause();
      this.onBackToSongs?.();
    });
    pause.appendChild(quitBtn);

    this.container.appendChild(pause);
    this.pauseEl = pause;
  }

  private removePause(): void {
    if (this.pauseEl) {
      this.pauseEl.remove();
      this.pauseEl = null;
    }
    this.currentState = 'playing';
  }

  showResult(states: PlayerState[], mode: GameMode): void {
    this.currentState = 'result';
    this.clearAll();

    const screen = document.createElement('div');
    screen.id = 'result-screen';
    screen.style.cssText = `
      position:absolute;inset:0;background:rgba(0,0,0,0.92);
      display:flex;flex-direction:column;align-items:center;
      justify-content:center;z-index:200;
    `;

    const title = document.createElement('h2');
    title.textContent = '对战结果';
    title.style.cssText = `
      font-size:36px;color:#00BFFF;letter-spacing:4px;
      text-shadow:0 0 15px rgba(0,191,255,0.4);margin-bottom:30px;
    `;
    screen.appendChild(title);

    if (mode === 'dual' && states.length === 2) {
      const winner = states[0].score > states[1].score ? 0 :
        states[1].score > states[0].score ? 1 : -1;

      const winnerText = document.createElement('div');
      winnerText.style.cssText = `
        font-size:24px;margin-bottom:24px;
        color:${winner === -1 ? '#FFD700' : winner === 0 ? '#1E90FF' : '#FF6347'};
        text-shadow:0 0 10px currentColor;
      `;
      winnerText.textContent = winner === -1 ? '平局！' : `玩家 ${winner + 1} 获胜！`;
      screen.appendChild(winnerText);
    }

    const statsContainer = document.createElement('div');
    statsContainer.style.cssText = `
      display:flex;gap:40px;margin-bottom:40px;flex-wrap:wrap;
      justify-content:center;
    `;

    states.forEach((state, i) => {
      const panel = document.createElement('div');
      panel.id = `result-player-${i}`;
      panel.style.cssText = `
        padding:24px 32px;background:rgba(30,30,30,0.9);
        border:1px solid ${i === 0 ? '#1E90FF' : '#FF6347'};
        border-radius:12px;min-width:220px;
        transition:transform 2s,box-shadow 2s;
      `;

      const total = state.perfectCount + state.goodCount + state.missCount;
      const accuracy = total > 0 ? ((state.perfectCount + state.goodCount) / total * 100).toFixed(1) : '0.0';

      const labelColor = i === 0 ? '#1E90FF' : '#FF6347';
      panel.innerHTML = `
        <div style="font-size:20px;color:${labelColor};margin-bottom:16px;text-align:center;">
          玩家 ${i + 1}
        </div>
        <div style="font-size:36px;color:#fff;text-align:center;margin-bottom:12px;
          text-shadow:0 0 8px rgba(255,255,255,0.5);">
          ${state.score}
        </div>
        <div style="font-size:14px;color:#aaa;line-height:2;">
          最高连击: <span style="color:#FFD700">${state.maxCombo}</span><br>
          Perfect: <span style="color:#00FF88">${state.perfectCount}</span><br>
          Good: <span style="color:#FFD700">${state.goodCount}</span><br>
          Miss: <span style="color:#FF3366">${state.missCount}</span><br>
          准确率: <span style="color:#00BFFF">${accuracy}%</span>
        </div>
      `;

      statsContainer.appendChild(panel);
    });

    screen.appendChild(statsContainer);

    if (mode === 'dual' && states.length === 2) {
      const winner = states[0].score > states[1].score ? 0 :
        states[1].score > states[0].score ? 1 : -1;

      if (winner >= 0) {
        setTimeout(() => {
          const winnerPanel = document.getElementById(`result-player-${winner}`);
          if (winnerPanel) {
            winnerPanel.style.transform = 'scale(1.2)';
            winnerPanel.style.boxShadow = `0 0 40px rgba(255,215,0,0.5)`;
          }
        }, 100);
        setTimeout(() => {
          const winnerPanel = document.getElementById(`result-player-${winner}`);
          if (winnerPanel) {
            winnerPanel.style.transform = 'scale(1)';
            winnerPanel.style.boxShadow = 'none';
          }
        }, 2100);
      }
    }

    const btnContainer = document.createElement('div');
    btnContainer.style.cssText = 'display:flex;gap:16px;';

    const restartBtn = this.createButton('再来一局', () => this.onRestart?.());
    const backBtn = this.createButton('返回选歌', () => this.onBackToSongs?.());
    btnContainer.appendChild(restartBtn);
    btnContainer.appendChild(backBtn);
    screen.appendChild(btnContainer);

    this.container.appendChild(screen);
    this.resultEl = screen;
  }

  private createButton(text: string, onClick: () => void): HTMLDivElement {
    const btn = document.createElement('div');
    btn.textContent = text;
    btn.style.cssText = `
      width:160px;height:50px;display:flex;align-items:center;
      justify-content:center;background:#3A3A3A;color:#fff;
      border-radius:8px;cursor:pointer;transition:background 0.2s;
      font-size:16px;letter-spacing:2px;
    `;
    btn.addEventListener('mouseenter', () => { btn.style.background = '#555555'; });
    btn.addEventListener('mouseleave', () => { btn.style.background = '#3A3A3A'; });
    btn.addEventListener('click', onClick);
    return btn;
  }

  private createMenuParticles(): void {
    if (this.particleCanvas) {
      this.particleCanvas.remove();
    }

    const canvas = document.createElement('canvas');
    canvas.style.cssText = 'position:absolute;inset:0;z-index:99;pointer-events:none;';
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    this.container.appendChild(canvas);
    this.particleCanvas = canvas;
    this.particleCtx = canvas.getContext('2d');

    this.menuParticles = [];
    for (let i = 0; i < 50; i++) {
      this.menuParticles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: 2 + Math.random() * 3,
        speed: 0.3 + Math.random() * 0.4,
        offset: Math.random() * Math.PI * 2,
      });
    }

    this.animateMenuParticles();
  }

  private animateMenuParticles(): void {
    if (this.currentState !== 'menu' || !this.particleCtx || !this.particleCanvas) return;

    const ctx = this.particleCtx;
    const canvas = this.particleCanvas;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const time = Date.now() / 1000;

    for (const p of this.menuParticles) {
      p.x += p.speed;
      p.y += Math.sin(time + p.offset) * 0.5;

      if (p.x > canvas.width + 10) p.x = -10;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(0, 191, 255, ${0.3 + Math.sin(time + p.offset) * 0.2})`;
      ctx.fill();
    }

    requestAnimationFrame(() => this.animateMenuParticles());
  }

  private clearAll(): void {
    [this.menuEl, this.songSelectEl, this.hudEl, this.pauseEl, this.resultEl].forEach(el => {
      if (el) el.remove();
    });
    this.menuEl = null;
    this.songSelectEl = null;
    this.hudEl = null;
    this.pauseEl = null;
    this.resultEl = null;

    if (this.particleCanvas) {
      this.particleCanvas.remove();
      this.particleCanvas = null;
      this.particleCtx = null;
    }
  }

  handleResize(): void {
    if (this.particleCanvas) {
      this.particleCanvas.width = window.innerWidth;
      this.particleCanvas.height = window.innerHeight;
    }
  }

  getMode(): GameMode {
    return this.mode;
  }
}
