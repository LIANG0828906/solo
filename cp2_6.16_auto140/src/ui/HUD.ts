import { useGameStore } from '../store';
import { POWERUP_LABELS, POWERUP_DURATIONS } from '../types';
import type { PowerUpType } from '../types';

export class HUD {
  private container: HTMLElement;
  private root: HTMLDivElement | null = null;
  private scoreEl: HTMLDivElement | null = null;
  private livesEl: HTMLDivElement | null = null;
  private powerupsEl: HTMLDivElement | null = null;
  private timersEl: HTMLDivElement | null = null;

  constructor(container: HTMLElement) {
    this.container = container;
  }

  public init(): void {
    this.root = document.createElement('div');
    this.root.className = 'hud-root';

    this.scoreEl = document.createElement('div');
    this.scoreEl.className = 'hud-score';
    this.scoreEl.textContent = '0';

    this.livesEl = document.createElement('div');
    this.livesEl.className = 'hud-lives';

    this.powerupsEl = document.createElement('div');
    this.powerupsEl.className = 'hud-powerups';

    this.timersEl = document.createElement('div');
    this.timersEl.className = 'hud-timers';

    this.root.appendChild(this.scoreEl);
    this.root.appendChild(this.livesEl);
    this.root.appendChild(this.powerupsEl);
    this.root.appendChild(this.timersEl);
    this.container.appendChild(this.root);

    this.renderLives(3);
    this.renderPowerUps([]);

    useGameStore.subscribe((state) => {
      this.updateScore(state.score);
      this.updateLives(state.lives);
      this.updatePowerUps(state.heldPowerUps);
      this.updateTimers(
        state.speedBoostActive,
        state.speedBoostTimer,
        state.shieldActive,
        state.shieldTimer,
        state.doubleScoreActive,
        state.doubleScoreTimer
      );
      this.toggleVisible(state.gameState === 'playing');
    });

    this.toggleVisible(useGameStore.getState().gameState === 'playing');
  }

  private toggleVisible(visible: boolean): void {
    if (this.root) {
      this.root.style.display = visible ? 'block' : 'none';
    }
  }

  private updateScore(score: number): void {
    if (this.scoreEl) {
      this.scoreEl.textContent = String(Math.floor(score));
    }
  }

  private renderLives(lives: number): void {
    if (!this.livesEl) return;
    this.livesEl.innerHTML = '';
    for (let i = 0; i < 3; i++) {
      const heart = document.createElement('div');
      heart.className = 'heart' + (i >= lives ? ' lost' : '');
      heart.textContent = '❤️';
      this.livesEl.appendChild(heart);
    }
  }

  private updateLives(lives: number): void {
    this.renderLives(Math.max(0, lives));
  }

  private renderPowerUps(held: PowerUpType[]): void {
    if (!this.powerupsEl) return;
    this.powerupsEl.innerHTML = '';
    for (let i = 0; i < 3; i++) {
      const slot = document.createElement('div');
      slot.className = 'powerup-slot';
      if (held[i]) {
        slot.classList.add(held[i], 'active');
        slot.textContent = POWERUP_LABELS[held[i]];
      } else {
        slot.textContent = '';
      }
      this.powerupsEl.appendChild(slot);
    }
  }

  private updatePowerUps(held: PowerUpType[]): void {
    this.renderPowerUps(held);
  }

  private updateTimers(
    speedActive: boolean,
    speedTimer: number,
    shieldActive: boolean,
    shieldTimer: number,
    doubleActive: boolean,
    doubleTimer: number
  ): void {
    if (!this.timersEl) return;
    this.timersEl.innerHTML = '';

    if (speedActive) {
      this.timersEl.appendChild(this.createTimerBar('#00BFFF', speedTimer / POWERUP_DURATIONS.speed));
    }
    if (shieldActive) {
      this.timersEl.appendChild(this.createTimerBar('#00FF7F', shieldTimer / POWERUP_DURATIONS.shield));
    }
    if (doubleActive) {
      this.timersEl.appendChild(this.createTimerBar('#FFD700', doubleTimer / POWERUP_DURATIONS.double));
    }
  }

  private createTimerBar(color: string, progress: number): HTMLDivElement {
    const bar = document.createElement('div');
    bar.className = 'timer-bar';
    const fill = document.createElement('div');
    fill.style.width = `${Math.max(0, Math.min(1, progress)) * 100}%`;
    fill.style.background = color;
    fill.style.boxShadow = `0 0 8px ${color}`;
    bar.appendChild(fill);
    return bar;
  }
}
