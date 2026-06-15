import type { IGameState, IBeatData } from '../types';

export class HUD {
  private container: HTMLElement;
  private scoreEl: HTMLElement | null = null;
  private comboEl: HTMLElement | null = null;
  private comboValueEl: HTMLElement | null = null;
  private hpBarEl: HTMLElement | null = null;
  private feverEl: HTMLElement | null = null;
  private beatRingContainer: HTMLElement | null = null;
  private beatRings: HTMLElement[] = [];
  private lastBeatTime: number = 0;
  private lastBeatIntensity: number = 0;
  private gameOverOverlay: HTMLElement | null = null;
  private currentBeatIndex: number = -1;
  private pulseValue: number = 0;
  private lastScore: number = 0;

  constructor(container: HTMLElement) {
    this.container = container;
    this.render();
    this.startPulseAnim();
  }

  private render(): void {
    this.container.innerHTML = '';
    this.container.style.cssText = `
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      pointer-events: none; z-index: 10; font-family: 'Orbitron', monospace;
    `;

    const topBar = document.createElement('div');
    topBar.style.cssText = `
      display: flex; justify-content: space-between; align-items: flex-start;
      padding: 20px 30px; width: 100%; box-sizing: border-box;
    `;

    const leftSection = document.createElement('div');
    leftSection.style.cssText = `display: flex; flex-direction: column; gap: 6px;`;

    const scoreLabel = document.createElement('div');
    scoreLabel.style.cssText = `font-size: 10px; color: #bf40ff88; letter-spacing: 3px;`;
    scoreLabel.textContent = 'SCORE';
    leftSection.appendChild(scoreLabel);

    this.scoreEl = document.createElement('div');
    this.scoreEl.style.cssText = `
      font-size: clamp(22px, 3vw, 34px); font-weight: 900;
      color: #00e5ff; text-shadow: 0 0 10px #00e5ff88, 0 0 20px #00e5ff44;
      transition: transform 0.1s;
    `;
    this.scoreEl.textContent = '0';
    leftSection.appendChild(this.scoreEl);

    this.comboEl = document.createElement('div');
    this.comboEl.style.cssText = `
      display: flex; align-items: baseline; gap: 6px;
      opacity: 0; transition: opacity 0.25s;
    `;

    this.comboValueEl = document.createElement('div');
    this.comboValueEl.style.cssText = `
      font-size: clamp(18px, 2.5vw, 26px); font-weight: 900;
      color: #ff4081; text-shadow: 0 0 10px #ff4081aa, 0 0 20px #ff408155;
      transition: transform 0.08s;
    `;
    this.comboValueEl.textContent = '0';

    const comboLabel = document.createElement('div');
    comboLabel.style.cssText = `
      font-size: clamp(10px, 1.5vw, 14px); font-weight: 700;
      color: #ff408188; letter-spacing: 2px;
    `;
    comboLabel.textContent = 'COMBO';

    this.comboEl.appendChild(this.comboValueEl);
    this.comboEl.appendChild(comboLabel);
    leftSection.appendChild(this.comboEl);

    topBar.appendChild(leftSection);

    const rightSection = document.createElement('div');
    rightSection.style.cssText = `display: flex; flex-direction: column; align-items: flex-end; gap: 6px;`;

    const hpLabel = document.createElement('div');
    hpLabel.style.cssText = `font-size: 10px; color: #bf40ff88; letter-spacing: 3px;`;
    hpLabel.textContent = 'HP';
    rightSection.appendChild(hpLabel);

    const hpBarBg = document.createElement('div');
    hpBarBg.style.cssText = `
      width: clamp(120px, 15vw, 200px); height: 10px; background: #1a1a2e;
      border: 1px solid #bf40ff44; border-radius: 5px; overflow: hidden;
    `;

    this.hpBarEl = document.createElement('div');
    this.hpBarEl.style.cssText = `
      width: 100%; height: 100%;
      background: linear-gradient(90deg, #bf40ff, #00e5ff);
      border-radius: 5px; transition: width 0.3s;
    `;
    hpBarBg.appendChild(this.hpBarEl);
    rightSection.appendChild(hpBarBg);

    topBar.appendChild(rightSection);
    this.container.appendChild(topBar);

    this.feverEl = document.createElement('div');
    this.feverEl.style.cssText = `
      position: fixed; top: 100px; left: 50%; transform: translate(-50%, -50%);
      font-size: clamp(20px, 3vw, 36px); font-weight: 900;
      color: #ff00ff; text-shadow: 0 0 25px #ff00ff99, 0 0 50px #ff00ff55, 0 0 80px #ff00ff33;
      opacity: 0; transition: opacity 0.35s; pointer-events: none;
      letter-spacing: 6px;
    `;
    this.feverEl.textContent = '★ COMBO FEVER ★';
    this.container.appendChild(this.feverEl);

    this.beatRingContainer = document.createElement('div');
    this.beatRingContainer.style.cssText = `
      position: fixed; bottom: 80px; left: 50%; transform: translateX(-50%);
      width: 140px; height: 140px; pointer-events: none;
      display: flex; align-items: center; justify-content: center;
    `;
    this.container.appendChild(this.beatRingContainer);

    for (let i = 0; i < 3; i++) {
      const ring = document.createElement('div');
      ring.style.cssText = `
        position: absolute; width: 40px; height: 40px;
        border: 2px solid #bf40ff; border-radius: 50%;
        opacity: 0; transition: all 0.5s cubic-bezier(.25,.8,.25,1);
        box-shadow: 0 0 15px #bf40ff66, inset 0 0 10px #bf40ff33;
      `;
      this.beatRingContainer.appendChild(ring);
      this.beatRings.push(ring);
    }

    const core = document.createElement('div');
    core.style.cssText = `
      width: 14px; height: 14px; border-radius: 50%;
      background: radial-gradient(circle, #ffffff, #bf40ff);
      box-shadow: 0 0 15px #bf40ffaa, 0 0 30px #bf40ff66;
      transition: transform 0.08s;
    `;
    this.beatRingContainer.appendChild(core);
    this.beatRings.push(core);
  }

  private startPulseAnim(): void {
    const tick = () => {
      const now = Date.now();
      this.pulseValue = Math.max(0, 1 - (now - this.lastBeatTime) / 400);

      if (this.beatRings[3]) {
        const s = 1 + this.pulseValue * 0.5;
        this.beatRings[3].style.transform = `scale(${s})`;
      }

      if (this.comboEl) {
        const glowIntensity = this.pulseValue * this.lastBeatIntensity;
        if (this.comboValueEl && this.comboEl.style.opacity !== '0') {
          this.comboValueEl.style.filter = `drop-shadow(0 0 ${5 + glowIntensity * 12}px #ff4081)`;
        }
      }

      if (this.scoreEl && this.scoreEl.textContent !== '0') {
        const s = 1 + this.pulseValue * 0.05 * this.lastBeatIntensity;
        this.scoreEl.style.transform = `scale(${s})`;
      }

      requestAnimationFrame(tick);
    };
    tick();
  }

  update(state: IGameState, beatProgress?: number, nextBeatIntensity?: number): void {
    if (this.scoreEl) {
      if (state.score !== this.lastScore) {
        this.scoreEl.textContent = state.score.toLocaleString();
        this.lastScore = state.score;
      }
    }

    if (this.comboEl && this.comboValueEl) {
      if (state.combo > 0) {
        this.comboEl.style.opacity = '1';
        this.comboValueEl.textContent = `${state.combo}x`;
        const pulse = 1 + (Math.sin(Date.now() * 0.008) + 1) * 0.05 * Math.min(1, state.combo / 5);
        this.comboEl.style.transform = `scale(${pulse})`;

        if (state.combo >= 10) {
          this.comboValueEl.style.color = '#ff00ff';
          this.comboValueEl.style.textShadow = '0 0 10px #ff00ffaa, 0 0 25px #ff00ff66';
        } else if (state.combo >= 5) {
          this.comboValueEl.style.color = '#ffa500';
          this.comboValueEl.style.textShadow = '0 0 10px #ffa500aa, 0 0 20px #ffa50066';
        } else {
          this.comboValueEl.style.color = '#ff4081';
          this.comboValueEl.style.textShadow = '0 0 10px #ff4081aa, 0 0 20px #ff408155';
        }
      } else {
        this.comboEl.style.opacity = '0';
      }
    }

    if (this.hpBarEl) {
      const hpPercent = (state.hp / state.maxHp) * 100;
      this.hpBarEl.style.width = hpPercent + '%';
      if (hpPercent < 30) {
        this.hpBarEl.style.background = 'linear-gradient(90deg, #ff0055, #ff4081)';
        this.hpBarEl.style.boxShadow = `0 0 ${6 + this.pulseValue * 12}px #ff005588`;
      } else {
        this.hpBarEl.style.background = 'linear-gradient(90deg, #bf40ff, #00e5ff)';
        this.hpBarEl.style.boxShadow = 'none';
      }
    }

    if (this.feverEl) {
      this.feverEl.style.opacity = state.isComboFever ? '1' : '0';
      if (state.isComboFever) {
        const t = Date.now() * 0.003;
        const s = 1 + Math.sin(t) * 0.08;
        const hue = (Date.now() / 10) % 360;
        this.feverEl.style.transform = `translate(-50%, -50%) scale(${s})`;
        this.feverEl.style.color = `hsl(${hue}, 100%, 70%)`;
        this.feverEl.style.textShadow = `0 0 25px hsla(${hue}, 100%, 60%, 0.7), 0 0 50px hsla(${hue}, 100%, 50%, 0.4)`;
      }
    }

    if (beatProgress !== undefined && nextBeatIntensity !== undefined) {
      for (let i = 0; i < 3; i++) {
        const ring = this.beatRings[i];
        if (!ring) continue;

        const ringPhase = (beatProgress + i * 0.33) % 1;
        const size = 40 + ringPhase * 100 * (0.5 + nextBeatIntensity * 0.5);
        const opacity = nextBeatIntensity * (1 - ringPhase) * 0.9;

        ring.style.width = size + 'px';
        ring.style.height = size + 'px';
        ring.style.opacity = String(Math.max(0, Math.min(1, opacity)));
        ring.style.borderWidth = (2 + nextBeatIntensity * 3).toFixed(1) + 'px';
        ring.style.borderColor = nextBeatIntensity > 0.7
          ? `hsl(${320 + nextBeatIntensity * 60}, 100%, 60%)`
          : '#bf40ff';
      }
    }
  }

  onBeat(beat: IBeatData, index: number): void {
    if (index === this.currentBeatIndex) return;
    this.currentBeatIndex = index;
    this.lastBeatTime = Date.now();
    this.lastBeatIntensity = beat.intensity;

    for (let i = 0; i < 3; i++) {
      const ring = this.beatRings[i];
      if (!ring) continue;
      ring.style.transition = 'none';
      ring.style.width = '40px';
      ring.style.height = '40px';
      ring.style.opacity = String(beat.intensity);
      requestAnimationFrame(() => {
        ring.style.transition = 'all 0.45s cubic-bezier(.25,.8,.25,1)';
      });
    }

    if (this.comboValueEl) {
      this.comboValueEl.style.transition = 'transform 0.08s';
      this.comboValueEl.style.transform = `scale(${1.2 + beat.intensity * 0.4})`;
      setTimeout(() => {
        if (this.comboValueEl) {
          this.comboValueEl.style.transform = 'scale(1)';
        }
      }, 80);
    }
  }

  showGameOver(score: number, maxCombo: number, onRestart: () => void, onMenu: () => void): void {
    if (this.gameOverOverlay) this.gameOverOverlay.remove();

    this.gameOverOverlay = document.createElement('div');
    this.gameOverOverlay.style.cssText = `
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      background: rgba(5, 5, 10, 0.9); display: flex; flex-direction: column;
      align-items: center; justify-content: center; pointer-events: auto; z-index: 30;
      backdrop-filter: blur(6px);
      animation: fadeIn 0.6s ease-out;
    `;

    const style = document.createElement('style');
    style.textContent = `
      @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      @keyframes glitchAnim {
        0% { transform: translate(0); filter: hue-rotate(0deg); }
        15% { transform: translate(-3px, 3px); filter: hue-rotate(30deg); }
        30% { transform: translate(3px, -3px); filter: hue-rotate(-20deg); }
        45% { transform: translate(-1px, -2px); filter: hue-rotate(10deg); }
        60% { transform: translate(2px, 1px); filter: hue-rotate(-10deg); }
        80% { transform: translate(0); filter: hue-rotate(0deg); }
        100% { transform: translate(0); filter: hue-rotate(0deg); }
      }
      @keyframes scoreFlash {
        0% { transform: scale(0.3); opacity: 0; text-shadow: 0 0 0 #00e5ff; }
        50% { transform: scale(1.25); text-shadow: 0 0 40px #00e5ff; }
        100% { transform: scale(1); opacity: 1; text-shadow: 0 0 20px #00e5ffaa; }
      }
    `;
    document.head.appendChild(style);

    const title = document.createElement('div');
    title.style.cssText = `
      font-family: 'Orbitron', monospace; font-size: clamp(32px, 7vw, 64px); font-weight: 900;
      color: #ff0055; text-shadow: 0 0 30px #ff0055aa, 0 0 60px #ff005555, -2px 2px 0 #00e5ff;
      margin-bottom: 40px; animation: glitchAnim 0.35s ease-in-out infinite alternate;
      letter-spacing: 8px;
    `;
    title.textContent = 'GAME OVER';
    this.gameOverOverlay.appendChild(title);

    const stats = document.createElement('div');
    stats.style.cssText = `
      font-family: 'Orbitron', monospace; text-align: center; margin-bottom: 50px;
      line-height: 2.4;
    `;
    stats.innerHTML = `
      <div style="font-size: 12px; color: #bf40ff88; letter-spacing: 3px;">FINAL SCORE</div>
      <div style="font-size: clamp(30px, 5vw, 48px); font-weight: 900; color: #00e5ff;
                  text-shadow: 0 0 20px #00e5ffaa, 0 0 40px #00e5ff66;
                  animation: scoreFlash 1s ease-out 0.2s both;">${score.toLocaleString()}</div>
      <div style="font-size: 12px; color: #ff408188; margin-top: 20px; letter-spacing: 2px;">
        MAX COMBO: <span style="color: #ff4081; text-shadow: 0 0 8px #ff4081aa; font-size: 20px; font-weight: 700;">${maxCombo}x</span>
      </div>
    `;
    this.gameOverOverlay.appendChild(stats);

    const btnContainer = document.createElement('div');
    btnContainer.style.cssText = `display: flex; gap: 18px; flex-wrap: wrap; justify-content: center;`;

    const makeBtn = (text: string, color: string, onClick: () => void) => {
      const btn = document.createElement('button');
      btn.textContent = text;
      btn.style.cssText = `
        font-family: 'Orbitron', monospace; font-size: 14px; font-weight: 700;
        padding: 14px 38px; background: ${color}11; border: 2px solid ${color};
        color: ${color}; cursor: pointer; letter-spacing: 3px;
        text-shadow: 0 0 8px ${color}aa; box-shadow: 0 0 18px ${color}33, inset 0 0 18px ${color}11;
        pointer-events: auto; transition: all 0.25s;
      `;
      btn.addEventListener('mouseenter', () => {
        btn.style.boxShadow = `0 0 32px ${color}77, inset 0 0 25px ${color}22`;
        btn.style.background = `${color}22`;
        btn.style.transform = 'translateY(-2px)';
      });
      btn.addEventListener('mouseleave', () => {
        btn.style.boxShadow = `0 0 18px ${color}33, inset 0 0 18px ${color}11`;
        btn.style.background = `${color}11`;
        btn.style.transform = 'translateY(0)';
      });
      btn.addEventListener('click', onClick);
      return btn;
    };

    btnContainer.appendChild(makeBtn('RETRY', '#bf40ff', onRestart));
    btnContainer.appendChild(makeBtn('MENU', '#00e5ff', onMenu));

    this.gameOverOverlay.appendChild(btnContainer);
    this.container.appendChild(this.gameOverOverlay);
  }

  hideGameOver(): void {
    if (this.gameOverOverlay) {
      this.gameOverOverlay.remove();
      this.gameOverOverlay = null;
    }
  }
}
