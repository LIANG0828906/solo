import {
  Player,
  Note,
  Enemy,
  Star,
  ExplosionParticle,
  HitText,
  LaserEffect,
  TRACK_COLORS,
  TRACK_KEYS
} from './entities';

export interface GameState {
  score: number;
  combo: number;
  maxCombo: number;
  health: number;
  maxHealth: number;
  skillCharge: number;
  maxSkillCharge: number;
  skillCooldown: number;
  isGameOver: boolean;
}

const BPM = 120;
const NOTE_START_Y = -50;
const JUDGMENT_LINE_Y = 500;
const PERFECT_WINDOW = 50;
const GOOD_WINDOW = 100;
const MISS_WINDOW = 150;
const SKILL_CHARGE_PER_HIT = 10;
const SKILL_COOLDOWN = 5;

export class GameEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private width: number;
  private height: number;

  private player: Player;
  private notes: Note[] = [];
  private enemies: Enemy[] = [];
  private stars: Star[] = [];
  private particles: ExplosionParticle[] = [];
  private hitTexts: HitText[] = [];
  private perfectNotes: Set<Note> = new Set();

  private state: GameState;
  private lastTime: number = 0;
  private beatInterval: number;
  private lastBeatTime: number = 0;
  private beatCount: number = 0;
  private musicStartTime: number = 0;
  private audioContext: AudioContext | null = null;
  private laserEffect: LaserEffect;

  private trackX: number[] = [100, 250, 400, 550, 700];

  private activeKeys: Set<string> = new Set();
  private trackCooldowns: boolean[] = [false, false, false, false, false];

  private onStateChange: ((state: GameState) => void) | null = null;
  private onHeartLost: ((index: number) => void) | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.width = canvas.width;
    this.height = canvas.height;

    this.player = new Player(this.width / 2, JUDGMENT_LINE_Y - 30);
    this.laserEffect = new LaserEffect();

    this.beatInterval = 60000 / BPM;

    this.state = {
      score: 0,
      combo: 0,
      maxCombo: 0,
      health: 5,
      maxHealth: 5,
      skillCharge: 0,
      maxSkillCharge: 100,
      skillCooldown: 0,
      isGameOver: false
    };

    this.initStars();
    this.initAudio();
  }

  private initStars(): void {
    for (let i = 0; i < 100; i++) {
      this.stars.push(new Star(this.width, this.height));
    }
  }

  private initAudio(): void {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (e) {
      console.log('Web Audio API not supported');
    }
  }

  public setOnStateChange(callback: (state: GameState) => void): void {
    this.onStateChange = callback;
  }

  public setOnHeartLost(callback: (index: number) => void): void {
    this.onHeartLost = callback;
  }

  public start(): void {
    if (this.audioContext?.state === 'suspended') {
      this.audioContext.resume();
    }
    this.musicStartTime = performance.now();
    this.lastTime = performance.now();
    this.gameLoop();
    this.playMusicLoop();
  }

  public restart(): void {
    this.state = {
      score: 0,
      combo: 0,
      maxCombo: 0,
      health: 5,
      maxHealth: 5,
      skillCharge: 0,
      maxSkillCharge: 100,
      skillCooldown: 0,
      isGameOver: false
    };

    this.notes = [];
    this.enemies = [];
    this.particles = [];
    this.hitTexts = [];
    this.perfectNotes.clear();
    this.beatCount = 0;
    this.lastBeatTime = 0;
    this.player = new Player(this.width / 2, JUDGMENT_LINE_Y - 30);
    this.laserEffect = new LaserEffect();

    if (this.audioContext?.state === 'suspended') {
      this.audioContext.resume();
    }
    this.musicStartTime = performance.now();
    this.lastTime = performance.now();
    this.notifyStateChange();
  }

  private playMusicLoop(): void {
    const now = performance.now();
    const elapsed = now - this.musicStartTime;
    const currentBeat = Math.floor(elapsed / this.beatInterval);

    if (currentBeat > this.lastBeatTime) {
      this.lastBeatTime = currentBeat;
      this.onBeat(currentBeat);
    }

    if (!this.state.isGameOver) {
      requestAnimationFrame(() => this.playMusicLoop());
    }
  }

  private onBeat(beatNumber: number): void {
    this.playBeatSound(beatNumber);

    const pattern = this.getBeatPattern(beatNumber);

    for (let track = 0; track < 5; track++) {
      if (pattern[track]) {
        this.spawnNoteAndEnemy(track);
      }
    }

    this.beatCount++;
  }

  private getBeatPattern(beatNumber: number): boolean[] {
    const pattern: boolean[] = [false, false, false, false, false];
    const beatInBar = beatNumber % 16;

    if (beatInBar % 4 === 0) {
      pattern[Math.floor(Math.random() * 5)] = true;
    }

    if (beatInBar % 2 === 1 && Math.random() > 0.5) {
      const track = Math.floor(Math.random() * 5);
      if (!pattern[track]) {
        pattern[track] = true;
      }
    }

    if (beatNumber > 32 && beatInBar % 2 === 0 && Math.random() > 0.7) {
      const track = Math.floor(Math.random() * 5);
      if (!pattern[track]) {
        pattern[track] = true;
      }
    }

    if (beatNumber > 64 && beatInBar % 1 === 0 && Math.random() > 0.85) {
      let track1 = Math.floor(Math.random() * 5);
      let track2 = Math.floor(Math.random() * 5);
      while (track2 === track1) {
        track2 = Math.floor(Math.random() * 5);
      }
      pattern[track1] = true;
      pattern[track2] = true;
    }

    return pattern;
  }

  private spawnNoteAndEnemy(track: number): void {
    const note = new Note(track, NOTE_START_Y, JUDGMENT_LINE_Y, BPM);
    const enemy = new Enemy(track, NOTE_START_Y, JUDGMENT_LINE_Y, BPM);
    enemy.linkNote(note);

    this.notes.push(note);
    this.enemies.push(enemy);
  }

  private playBeatSound(beatNumber: number): void {
    if (!this.audioContext) return;

    const beatInBar = beatNumber % 4;
    const now = this.audioContext.currentTime;

    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();

    osc.connect(gain);
    gain.connect(this.audioContext.destination);

    if (beatInBar === 0) {
      osc.type = 'square';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.setValueAtTime(330, now + 0.05);
    } else if (beatInBar === 2) {
      osc.type = 'square';
      osc.frequency.setValueAtTime(165, now);
    } else {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(110, now);
    }

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

    osc.start(now);
    osc.stop(now + 0.1);

    if (beatNumber % 8 === 0) {
      const bassOsc = this.audioContext.createOscillator();
      const bassGain = this.audioContext.createGain();
      bassOsc.connect(bassGain);
      bassGain.connect(this.audioContext.destination);
      bassOsc.type = 'sawtooth';
      bassOsc.frequency.setValueAtTime(55, now);
      bassGain.gain.setValueAtTime(0.08, now);
      bassGain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      bassOsc.start(now);
      bassOsc.stop(now + 0.2);
    }
  }

  private playHitSound(isPerfect: boolean): void {
    if (!this.audioContext) return;

    const now = this.audioContext.currentTime;
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();

    osc.connect(gain);
    gain.connect(this.audioContext.destination);

    osc.type = 'square';
    osc.frequency.setValueAtTime(isPerfect ? 880 : 660, now);
    osc.frequency.exponentialRampToValueAtTime(isPerfect ? 1320 : 880, now + 0.05);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    osc.start(now);
    osc.stop(now + 0.15);
  }

  private playMissSound(): void {
    if (!this.audioContext) return;

    const now = this.audioContext.currentTime;
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();

    osc.connect(gain);
    gain.connect(this.audioContext.destination);

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.2);

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    osc.start(now);
    osc.stop(now + 0.2);
  }

  private playSkillSound(): void {
    if (!this.audioContext) return;

    const now = this.audioContext.currentTime;

    for (let i = 0; i < 5; i++) {
      const osc = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();
      osc.connect(gain);
      gain.connect(this.audioContext.destination);
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(440 + i * 110, now + i * 0.05);
      gain.gain.setValueAtTime(0.15, now + i * 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
      osc.start(now + i * 0.05);
      osc.stop(now + 0.5);
    }
  }

  public handleKeyDown(key: string): void {
    if (this.state.isGameOver) return;

    const lowerKey = key.toLowerCase();
    this.activeKeys.add(lowerKey);

    if (lowerKey === 'a' || lowerKey === 'arrowleft') {
      this.player.moveLeft();
    } else if (lowerKey === 'd' || lowerKey === 'arrowright') {
      this.player.moveRight();
    }

    const trackIndex = TRACK_KEYS.indexOf(lowerKey);
    if (trackIndex !== -1 && !this.trackCooldowns[trackIndex]) {
      this.tryHitTrack(trackIndex);
      this.trackCooldowns[trackIndex] = true;
      setTimeout(() => {
        this.trackCooldowns[trackIndex] = false;
      }, 100);
    }

    if (lowerKey === ' ') {
      this.tryUseSkill();
    }
  }

  public handleKeyUp(key: string): void {
    const lowerKey = key.toLowerCase();
    this.activeKeys.delete(lowerKey);

    if ((lowerKey === 'a' || lowerKey === 'arrowleft') && !this.activeKeys.has('d') && !this.activeKeys.has('arrowright')) {
      this.player.stop();
    } else if ((lowerKey === 'd' || lowerKey === 'arrowright') && !this.activeKeys.has('a') && !this.activeKeys.has('arrowleft')) {
      this.player.stop();
    }
  }

  private tryHitTrack(trackIndex: number): void {
    let closestNote: Note | null = null;
    let closestDistance = Infinity;

    for (const note of this.notes) {
      if (!note.active || note.track !== trackIndex || note.hit) continue;

      const distance = Math.abs(note.y - JUDGMENT_LINE_Y);
      if (distance < closestDistance && distance < MISS_WINDOW) {
        closestNote = note;
        closestDistance = distance;
      }
    }

    if (closestNote) {
      this.processHit(closestNote, closestDistance);
    }
  }

  private processHit(note: Note, distance: number): void {
    note.hit = true;
    note.active = false;

    const enemy = this.enemies.find(e => e.note === note);
    if (enemy) {
      enemy.active = false;
      this.spawnExplosion(enemy.x, enemy.y, enemy.color);
    }

    let hitType: 'perfect' | 'good' | 'miss';
    let points: number;
    let color: string;
    let text: string;

    if (distance <= PERFECT_WINDOW) {
      hitType = 'perfect';
      points = 100;
      color = '#ffd700';
      text = 'PERFECT!';
      this.perfectNotes.add(note);
      setTimeout(() => this.perfectNotes.delete(note), 500);
      this.playHitSound(true);
    } else if (distance <= GOOD_WINDOW) {
      hitType = 'good';
      points = 50;
      color = '#00ff88';
      text = 'GOOD';
      this.playHitSound(false);
    } else {
      hitType = 'miss';
      points = 10;
      color = '#888888';
      text = 'MISS';
      this.playMissSound();
    }

    if (hitType !== 'miss') {
      this.state.combo++;
      this.state.maxCombo = Math.max(this.state.maxCombo, this.state.combo);
      this.state.score += points * (1 + Math.floor(this.state.combo / 10) * 0.1);

      if (this.state.skillCooldown <= 0) {
        this.state.skillCharge = Math.min(
          this.state.maxSkillCharge,
          this.state.skillCharge + SKILL_CHARGE_PER_HIT
        );
      }
    } else {
      this.state.combo = 0;
    }

    this.hitTexts.push(new HitText(note.x, note.y, text, color));

    this.notifyStateChange();
  }

  private spawnExplosion(x: number, y: number, color: string): void {
    for (let i = 0; i < 20; i++) {
      const particleColor = Math.random() > 0.5 ? color : '#ffffff';
      this.particles.push(new ExplosionParticle(x, y, particleColor));
    }
  }

  private tryUseSkill(): void {
    if (this.state.skillCharge < this.state.maxSkillCharge || this.state.skillCooldown > 0) {
      return;
    }

    this.state.skillCharge = 0;
    this.state.skillCooldown = SKILL_COOLDOWN;
    this.laserEffect.start();
    this.playSkillSound();

    const laserFlash = document.getElementById('laserFlash');
    if (laserFlash) {
      laserFlash.classList.remove('active');
      void laserFlash.offsetWidth;
      laserFlash.classList.add('active');
    }

    for (const enemy of this.enemies) {
      if (enemy.active) {
        enemy.active = false;
        this.spawnExplosion(enemy.x, enemy.y, enemy.color);
        this.state.score += 50;
      }
    }

    for (const note of this.notes) {
      if (note.active) {
        note.active = false;
      }
    }

    this.notifyStateChange();
  }

  private checkMissedNotes(): void {
    for (const note of this.notes) {
      if (!note.active || note.hit) continue;

      if (note.y > JUDGMENT_LINE_Y + MISS_WINDOW) {
        note.active = false;
        note.hit = true;

        const enemy = this.enemies.find(e => e.note === note);
        if (enemy) {
          enemy.active = false;
        }

        this.state.combo = 0;
        this.state.health--;
        this.playMissSound();

        if (this.onHeartLost) {
          this.onHeartLost(this.state.health);
        }

        this.hitTexts.push(new HitText(note.x, JUDGMENT_LINE_Y, 'MISS', '#ff4757'));

        if (this.state.health <= 0) {
          this.state.isGameOver = true;
        }

        this.notifyStateChange();
      }
    }
  }

  private notifyStateChange(): void {
    if (this.onStateChange) {
      this.onStateChange({ ...this.state });
    }
  }

  private gameLoop = (): void => {
    const currentTime = performance.now();
    let deltaTime = (currentTime - this.lastTime) / 1000;

    if (deltaTime > 0.1) {
      deltaTime = 0.016;
    }

    this.lastTime = currentTime;

    if (!this.state.isGameOver) {
      this.update(deltaTime);
    }

    this.render();

    if (this.state.isGameOver) {
      this.renderGameOver();
    }

    requestAnimationFrame(this.gameLoop);
  };

  private update(deltaTime: number): void {
    if (this.state.skillCooldown > 0) {
      this.state.skillCooldown = Math.max(0, this.state.skillCooldown - deltaTime);
    }

    for (const star of this.stars) {
      star.update(deltaTime, this.height);
    }

    this.player.update(deltaTime);
    this.laserEffect.update(deltaTime);

    for (const note of this.notes) {
      note.update(deltaTime);
    }

    for (const enemy of this.enemies) {
      enemy.update(deltaTime);
    }

    this.particles = this.particles.filter(p => p.update(deltaTime));
    this.hitTexts = this.hitTexts.filter(t => t.update(deltaTime));

    this.notes = this.notes.filter(n => n.active || n.hit);
    this.enemies = this.enemies.filter(e => e.active);

    this.checkMissedNotes();

    if (this.state.skillCooldown > 0) {
      this.notifyStateChange();
    }
  }

  private render(): void {
    this.ctx.clearRect(0, 0, this.width, this.height);

    this.renderBackground();
    this.renderTracks();
    this.renderJudgmentLine();

    for (const star of this.stars) {
      star.render(this.ctx);
    }

    for (const enemy of this.enemies) {
      enemy.render(this.ctx);
    }

    for (const note of this.notes) {
      note.render(this.ctx);
    }

    for (const note of this.perfectNotes) {
      note.renderPerfect(this.ctx);
    }

    this.player.render(this.ctx);

    for (const particle of this.particles) {
      particle.render(this.ctx);
    }

    for (const text of this.hitTexts) {
      text.render(this.ctx);
    }

    this.laserEffect.render(this.ctx, this.width, this.height);
  }

  private renderBackground(): void {
    const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
    gradient.addColorStop(0, '#1a0a2e');
    gradient.addColorStop(0.5, '#16213e');
    gradient.addColorStop(1, '#0f3460');
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  private renderTracks(): void {
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    this.ctx.lineWidth = 2;

    for (let i = 0; i < 5; i++) {
      const x = this.trackX[i];
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, this.height);
      this.ctx.stroke();
    }
  }

  private renderJudgmentLine(): void {
    const gradient = this.ctx.createLinearGradient(0, JUDGMENT_LINE_Y, this.width, JUDGMENT_LINE_Y);
    gradient.addColorStop(0, 'rgba(46, 213, 115, 0)');
    gradient.addColorStop(0.5, 'rgba(46, 213, 115, 1)');
    gradient.addColorStop(1, 'rgba(46, 213, 115, 0)');

    this.ctx.strokeStyle = gradient;
    this.ctx.lineWidth = 4;
    this.ctx.shadowColor = '#2ed573';
    this.ctx.shadowBlur = 15;
    this.ctx.beginPath();
    this.ctx.moveTo(50, JUDGMENT_LINE_Y);
    this.ctx.lineTo(this.width - 50, JUDGMENT_LINE_Y);
    this.ctx.stroke();
    this.ctx.shadowBlur = 0;

    for (let i = 0; i < 5; i++) {
      const x = this.trackX[i];
      this.ctx.fillStyle = TRACK_COLORS[i] + '40';
      this.ctx.beginPath();
      this.ctx.arc(x, JUDGMENT_LINE_Y, 25, 0, Math.PI * 2);
      this.ctx.fill();

      this.ctx.strokeStyle = TRACK_COLORS[i];
      this.ctx.lineWidth = 2;
      this.ctx.shadowColor = TRACK_COLORS[i];
      this.ctx.shadowBlur = 10;
      this.ctx.beginPath();
      this.ctx.arc(x, JUDGMENT_LINE_Y, 25, 0, Math.PI * 2);
      this.ctx.stroke();
      this.ctx.shadowBlur = 0;

      this.ctx.fillStyle = '#fff';
      this.ctx.font = 'bold 16px Courier New';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText(TRACK_KEYS[i].toUpperCase(), x, JUDGMENT_LINE_Y);
    }
  }

  private renderGameOver(): void {
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    this.ctx.fillRect(0, 0, this.width, this.height);
  }

  public getState(): GameState {
    return { ...this.state };
  }
}
