import { NoteManager, CHARTS, DIFFICULTY_CONFIG, JUDGE_SCORE, JUDGE_ENERGY, HEAVY_NOTE_SCORE_MULTIPLIER, HEAVY_NOTE_ENERGY_MULTIPLIER, type Difficulty, type JudgeResult, type Note, type ChartData, type NoteType } from './NoteManager';
import { EffectManager } from './effects';
import { InputHandler, type Direction, type GameAction } from './InputHandler';
import { Renderer } from './Renderer';

export type SkillType = 'slow' | 'shield' | 'doubleCombo';
export type GameState = 'menu' | 'playing' | 'paused' | 'gameover' | 'finished';

export interface GameStats {
  score: number;
  combo: number;
  maxCombo: number;
  hp: number;
  maxHp: number;
  energy: number;
  maxEnergy: number;
  accuracy: number;
  perfectCount: number;
  goodCount: number;
  normalCount: number;
  missCount: number;
  skillUsedCount: number;
  completionPercent: number;
}

export interface ActiveSkill {
  type: SkillType;
  endTime: number;
}

export interface SkillCooldown {
  slow: number;
  shield: number;
  doubleCombo: number;
}

const SKILL_COOLDOWN = 5;
const SKILL_ENERGY_COST = 100;

export class GameEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private noteManager: NoteManager;
  private effectManager: EffectManager;
  private inputHandler: InputHandler;
  private renderer: Renderer;

  private state: GameState = 'menu';
  private currentChartIndex = 0;
  private currentDifficulty: Difficulty = 'normal';

  private gameTime = 0;
  private lastFrameTime = 0;
  private animationFrameId = 0;

  private stats: GameStats;
  private activeSkills: ActiveSkill[] = [];
  private skillCooldowns: SkillCooldown = { slow: 0, shield: 0, doubleCombo: 0 };
  private hasShield = false;
  private lastJudge: { result: JudgeResult; time: number } | null = null;
  private selectedMenuIndex = 0;

  private width = 1280;
  private height = 720;
  private isMobile = false;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.effectManager = new EffectManager();
    this.noteManager = new NoteManager(CHARTS[0], 'normal', this.height * 0.8, this.height * 0.05);
    this.inputHandler = new InputHandler(canvas, this.handleInput.bind(this));
    this.renderer = new Renderer(this);

    this.stats = this.createInitialStats();
    this.resize();
    window.addEventListener('resize', this.resize.bind(this));
    this.canvas.addEventListener('click', this.handleClick.bind(this));
  }

  private createInitialStats(): GameStats {
    return {
      score: 0,
      combo: 0,
      maxCombo: 0,
      hp: 5,
      maxHp: 5,
      energy: 0,
      maxEnergy: 100,
      accuracy: 100,
      perfectCount: 0,
      goodCount: 0,
      normalCount: 0,
      missCount: 0,
      skillUsedCount: 0,
      completionPercent: 0
    };
  }

  private resize(): void {
    const container = this.canvas.parentElement!;
    const cw = container.clientWidth;
    const ch = container.clientHeight;

    const targetRatio = 16 / 9;
    let w = cw;
    let h = cw / targetRatio;
    if (h > ch) {
      h = ch;
      w = ch * targetRatio;
    }

    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = Math.floor(w * dpr);
    this.canvas.height = Math.floor(h * dpr);
    this.canvas.style.width = w + 'px';
    this.canvas.style.height = h + 'px';
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    this.width = w;
    this.height = h;
    this.isMobile = window.innerWidth < 768;

    const judgeY = this.height * 0.8;
    const topY = this.height * 0.05;
    this.noteManager.setJudgePositions(judgeY, topY);

    this.renderer.setSize(w, h, this.isMobile);
    this.updateTouchZones();
  }

  private updateTouchZones(): void {
    const zones: Array<{ action: GameAction; x: number; y: number; w: number; h: number }> = [];
    if (this.isMobile) {
      const btnSize = 44;
      const gap = 12;
      const startX = this.width / 2 - (btnSize * 3 + gap * 2) / 2;
      const y = this.height - btnSize - 40;
      zones.push({ action: 'skill1', x: startX, y, w: btnSize, h: btnSize });
      zones.push({ action: 'skill2', x: startX + btnSize + gap, y, w: btnSize, h: btnSize });
      zones.push({ action: 'skill3', x: startX + (btnSize + gap) * 2, y, w: btnSize, h: btnSize });
    }
    this.inputHandler.setTouchZones(zones);
  }

  start(): void {
    this.lastFrameTime = performance.now() / 1000;
    this.loop();
  }

  private loop(): void {
    const now = performance.now() / 1000;
    let dt = now - this.lastFrameTime;
    if (dt > 0.05) dt = 0.05;
    this.lastFrameTime = now;

    this.update(dt, now);
    this.render(now);

    this.animationFrameId = requestAnimationFrame(() => this.loop());
  }

  private update(dt: number, now: number): void {
    this.effectManager.update(dt, now);
    this.updateSkillCooldowns(dt);
    this.updateActiveSkills(dt, now);

    if (this.state === 'playing') {
      this.gameTime += this.isSkillActive('slow') ? dt * 0.5 : dt;

      const missed = this.noteManager.update(dt, this.gameTime);
      for (const m of missed) {
        this.handleJudge('miss', m, now);
      }

      const total = this.noteManager.getTotalNotes();
      const hit = this.stats.perfectCount + this.stats.goodCount + this.stats.normalCount + this.stats.missCount;
      this.stats.completionPercent = total > 0 ? Math.min(100, (hit / total) * 100) : 0;

      if (this.stats.hp <= 0) {
        this.state = 'gameover';
      } else if (this.noteManager.isFinished(this.gameTime)) {
        this.state = 'finished';
      }
    }
  }

  private updateSkillCooldowns(dt: number): void {
    this.skillCooldowns.slow = Math.max(0, this.skillCooldowns.slow - dt);
    this.skillCooldowns.shield = Math.max(0, this.skillCooldowns.shield - dt);
    this.skillCooldowns.doubleCombo = Math.max(0, this.skillCooldowns.doubleCombo - dt);
  }

  private updateActiveSkills(dt: number, now: number): void {
    for (let i = this.activeSkills.length - 1; i >= 0; i--) {
      if (now >= this.activeSkills[i].endTime) {
        const skill = this.activeSkills[i];
        if (skill.type === 'slow') {
          const cfg = DIFFICULTY_CONFIG[this.currentDifficulty];
          this.noteManager.setSpeedMultiplier(cfg.speedMultiplier);
        }
        this.activeSkills.splice(i, 1);
      }
    }
  }

  private isSkillActive(type: SkillType): boolean {
    return this.activeSkills.some(s => s.type === type);
  }

  private handleInput(action: GameAction, pressed: boolean): void {
    if (!pressed) return;

    if (this.state === 'menu') {
      if (action === 'up') this.selectedMenuIndex = (this.selectedMenuIndex + 2) % 3;
      else if (action === 'down') this.selectedMenuIndex = (this.selectedMenuIndex + 1) % 3;
      else if (action === 'left') {
        if (this.selectedMenuIndex === 0) this.currentChartIndex = (this.currentChartIndex + CHARTS.length - 1) % CHARTS.length;
        else if (this.selectedMenuIndex === 1) {
          const diffs: Difficulty[] = ['easy', 'normal', 'hard'];
          const idx = diffs.indexOf(this.currentDifficulty);
          this.currentDifficulty = diffs[(idx + 2) % 3];
        }
      } else if (action === 'right') {
        if (this.selectedMenuIndex === 0) this.currentChartIndex = (this.currentChartIndex + 1) % CHARTS.length;
        else if (this.selectedMenuIndex === 1) {
          const diffs: Difficulty[] = ['easy', 'normal', 'hard'];
          const idx = diffs.indexOf(this.currentDifficulty);
          this.currentDifficulty = diffs[(idx + 1) % 3];
        }
      } else if (action === 'confirm') {
        if (this.selectedMenuIndex === 2) this.startGame();
      }
      return;
    }

    if (action === 'pause') {
      if (this.state === 'playing') this.state = 'paused';
      else if (this.state === 'paused') this.state = 'playing';
      return;
    }

    if (this.state === 'gameover' || this.state === 'finished') {
      if (action === 'confirm') {
        this.startGame();
      }
      return;
    }
    if (this.state !== 'playing') return;

    const now = performance.now() / 1000;

    if (action === 'skill1') {
      this.tryUseSkill('slow', now);
    } else if (action === 'skill2') {
      this.tryUseSkill('shield', now);
    } else if (action === 'skill3') {
      this.tryUseSkill('doubleCombo', now);
    } else {
      const dir = action as Direction;
      const { note, result } = this.noteManager.judge(dir, this.gameTime);
      if (note || result === 'miss') {
        this.handleJudge(result, note, now);
      }
    }
  }

  private tryUseSkill(type: SkillType, now: number): void {
    if (this.stats.energy < SKILL_ENERGY_COST) return;

    const cdKey = type;
    if (this.skillCooldowns[cdKey] > 0) return;

    this.stats.energy -= SKILL_ENERGY_COST;
    this.skillCooldowns[cdKey] = SKILL_COOLDOWN;
    this.stats.skillUsedCount++;
    this.effectManager.setEnergyFull(false);

    if (type === 'slow') {
      this.activeSkills.push({ type, endTime: now + 5 });
      this.noteManager.setSpeedMultiplier(this.noteManager.getSpeedMultiplier() * 0.5);
      this.effectManager.triggerTint('#00e5ff', 0.15, 1.0, now);
      this.effectManager.triggerFlash('#00e5ff', 0.4);
    } else if (type === 'shield') {
      this.hasShield = true;
      this.effectManager.triggerTint('#00ff88', 0.15, 1.0, now);
      this.effectManager.triggerFlash('#00ff88', 0.4);
    } else if (type === 'doubleCombo') {
      this.activeSkills.push({ type, endTime: now + 5 });
      this.effectManager.triggerTint('#ff3d77', 0.15, 1.0, now);
      this.effectManager.triggerFlash('#ff3d77', 0.4);
    }
  }

  private handleJudge(result: JudgeResult, note: Note | null, now: number): void {
    const trackColors: Record<Direction, string> = {
      up: '#00e5ff',
      down: '#ff3d77',
      left: '#ffeb3b',
      right: '#7c4dff'
    };

    const judgeResultColors: Record<JudgeResult, string> = {
      perfect: '#00e5ff',
      good: '#00ff88',
      normal: '#ffeb3b',
      miss: '#ff3d77'
    };

    const prevEnergy = this.stats.energy;
    let scoreGain = JUDGE_SCORE[result];
    let energyGain = JUDGE_ENERGY[result];

    const isHeavy = note?.type === 'heavy';
    if (isHeavy && result !== 'miss') {
      scoreGain = Math.floor(scoreGain * HEAVY_NOTE_SCORE_MULTIPLIER);
      energyGain = Math.floor(energyGain * HEAVY_NOTE_ENERGY_MULTIPLIER);
    }

    if (result === 'miss') {
      if (this.hasShield) {
        this.hasShield = false;
        this.effectManager.triggerFlash('#00ff88', 0.5);
        this.lastJudge = { result: 'perfect', time: now };
        return;
      }
      this.stats.combo = 0;
      this.stats.hp--;
      this.stats.missCount++;
      this.effectManager.addShake(isHeavy ? 18 : 12, 0.35, now);
    } else {
      this.stats.combo++;
      if (this.stats.combo > this.stats.maxCombo) this.stats.maxCombo = this.stats.combo;

      if (this.isSkillActive('doubleCombo') && result === 'perfect') {
        scoreGain *= 2;
      }
      scoreGain = Math.floor(scoreGain * (1 + this.stats.combo * 0.002));

      if (result === 'perfect') this.stats.perfectCount++;
      else if (result === 'good') this.stats.goodCount++;
      else this.stats.normalCount++;

      this.stats.energy = Math.min(this.stats.maxEnergy, this.stats.energy + energyGain);
    }

    if (prevEnergy < this.stats.maxEnergy && this.stats.energy >= this.stats.maxEnergy) {
      this.effectManager.setEnergyFull(true);
    }

    this.stats.score += scoreGain;
    this.lastJudge = { result, time: now };
    this.updateAccuracy();

    if (note) {
      const judgeY = this.height * 0.8;
      const trackWidth = this.isMobile ? this.width * 0.9 : this.width * 0.6;
      const trackX = (this.width - trackWidth) / 2;
      const laneWidth = trackWidth / 4;
      const laneOrder: Direction[] = ['left', 'down', 'up', 'right'];
      const laneIdx = laneOrder.indexOf(note.direction);
      const nx = trackX + laneIdx * laneWidth + laneWidth / 2;

      this.effectManager.addJudgeLineGlow(
        trackX,
        trackWidth,
        laneIdx,
        4,
        judgeY,
        judgeResultColors[result],
        now
      );

      const glowMult = isHeavy ? 1.4 : 1.0;
      const particleMult = isHeavy ? 1.5 : 1.0;

      if (result === 'perfect') {
        this.effectManager.addGlow(nx, judgeY, 140 * glowMult, trackColors[note.direction], isHeavy ? 0.8 : 0.6);
        this.effectManager.addParticles(nx, judgeY, Math.floor(30 * particleMult), trackColors[note.direction], isHeavy ? 400 : 300);
        this.effectManager.addDebrisParticles(nx, judgeY, (3 + Math.floor(Math.random() * 3)) * (isHeavy ? 2 : 1), isHeavy ? '#ffffff' : '#00e5ff');
        if (isHeavy) {
          this.effectManager.triggerFlash(trackColors[note.direction], 0.1);
          this.effectManager.addShake(3, 0.2, now);
        }
      } else if (result === 'good') {
        this.effectManager.addGlow(nx, judgeY, 90 * glowMult, trackColors[note.direction], isHeavy ? 0.55 : 0.4);
        this.effectManager.addParticles(nx, judgeY, Math.floor(15 * particleMult), trackColors[note.direction], isHeavy ? 260 : 200);
      } else {
        this.effectManager.addParticles(nx, judgeY, Math.floor(8 * particleMult), trackColors[note.direction], isHeavy ? 160 : 120);
      }

      if ([50, 100, 200].includes(this.stats.combo)) {
        this.effectManager.addShake(this.stats.combo >= 200 ? 10 : this.stats.combo >= 100 ? 7 : 4, 0.4, now);
        this.effectManager.addParticles(this.width / 2, this.height / 2, this.stats.combo >= 100 ? 80 : 40, '#ffffff', 400);
        this.effectManager.triggerFlash('#ffffff', 0.15);
        this.effectManager.addComboPopup(this.stats.combo, now);
      }
    }
  }

  private updateAccuracy(): void {
    const total = this.stats.perfectCount + this.stats.goodCount + this.stats.normalCount + this.stats.missCount;
    if (total === 0) {
      this.stats.accuracy = 100;
      return;
    }
    const weighted = this.stats.perfectCount * 100 + this.stats.goodCount * 70 + this.stats.normalCount * 40;
    this.stats.accuracy = weighted / total;
  }

  private handleClick(e: MouseEvent): void {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.width / rect.width;
    const scaleY = this.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    if (this.state === 'menu') {
      for (const el of this.renderer.uiElements) {
        if (x >= el.x && x <= el.x + el.w && y >= el.y && y <= el.y + el.h) {
          if (el.id === 'chart') {
            const dir = x > el.x + el.w / 2 ? 1 : -1;
            this.currentChartIndex = (this.currentChartIndex + dir + CHARTS.length) % CHARTS.length;
          } else if (el.id === 'difficulty') {
            const diffs: Difficulty[] = ['easy', 'normal', 'hard'];
            const dir = x > el.x + el.w / 2 ? 1 : -1;
            const idx = diffs.indexOf(this.currentDifficulty);
            this.currentDifficulty = diffs[(idx + dir + 3) % 3];
          } else if (el.id === 'start') {
            this.startGame();
          }
          return;
        }
      }
    } else if (this.state === 'gameover' || this.state === 'finished') {
      for (const el of this.renderer.uiElements) {
        if (x >= el.x && x <= el.x + el.w && y >= el.y && y <= el.y + el.h) {
          if (el.id === 'retry') this.startGame();
          else if (el.id === 'back') {
            this.state = 'menu';
            this.selectedMenuIndex = 0;
          }
          return;
        }
      }
    }
  }

  private startGame(): void {
    const chart = CHARTS[this.currentChartIndex];
    this.noteManager = new NoteManager(chart, this.currentDifficulty, this.height * 0.8, this.height * 0.05);
    this.stats = this.createInitialStats();
    this.activeSkills = [];
    this.skillCooldowns = { slow: 0, shield: 0, doubleCombo: 0 };
    this.hasShield = false;
    this.gameTime = 0;
    this.state = 'playing';
    this.lastJudge = null;
    this.effectManager.setEnergyFull(false);
  }

  getStats(): GameStats {
    return { ...this.stats };
  }

  getState(): GameState {
    return this.state;
  }

  getChart(): ChartData {
    return this.noteManager.getChart();
  }

  getCurrentChartIndex(): number {
    return this.currentChartIndex;
  }

  getCurrentDifficulty(): Difficulty {
    return this.currentDifficulty;
  }

  getSelectedMenuIndex(): number {
    return this.selectedMenuIndex;
  }

  getEffectManager(): EffectManager {
    return this.effectManager;
  }

  getRating(): string {
    const acc = this.stats.accuracy;
    if (acc >= 95) return 'S';
    if (acc >= 85) return 'A';
    if (acc >= 70) return 'B';
    if (acc >= 50) return 'C';
    return 'D';
  }

  getActiveNotes(): Note[] {
    return this.noteManager.getActiveNotes();
  }

  getLastJudge(): { result: JudgeResult; time: number } | null {
    return this.lastJudge;
  }

  getGameTime(): number {
    return this.gameTime;
  }

  getSkillCooldowns(): SkillCooldown {
    return { ...this.skillCooldowns };
  }

  getActiveSkills(): ActiveSkill[] {
    return [...this.activeSkills];
  }

  getHasShield(): boolean {
    return this.hasShield;
  }

  getWidth(): number {
    return this.width;
  }

  getHeight(): number {
    return this.height;
  }

  getIsMobile(): boolean {
    return this.isMobile;
  }

  private render(now: number): void {
    const shake = this.effectManager.getShakeOffset(now);
    this.renderer.render(this.ctx, now, shake);
    this.effectManager.render(this.ctx, this.width, this.height);
  }

  destroy(): void {
    cancelAnimationFrame(this.animationFrameId);
    this.inputHandler.destroy();
  }
}
