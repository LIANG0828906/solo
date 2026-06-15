export interface Note {
  id: string;
  time: number;
  track: 'melody' | 'drum' | 'harmony';
  y: number;
}

export interface Particle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  life: number;
  maxLife: number;
  size: number;
}

export interface GameState {
  isPlaying: boolean;
  currentTime: number;
  speed: number;
  notes: Note[];
  particles: Particle[];
  performanceMode: 'normal' | 'low';
}

export interface EngineOptions {
  bpm?: number;
  noteFlyTime?: number;
  judgementLineX?: number;
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
}

export function getTrackColor(track: 'melody' | 'drum' | 'harmony'): string {
  const colors: Record<'melody' | 'drum' | 'harmony', string> = {
    melody: '#ff3366',
    drum: '#3399ff',
    harmony: '#ffcc00',
  };
  return colors[track];
}

export class GameEngine {
  private _state: GameState;
  private _animationId: number | null = null;
  private _lastTime: number = 0;
  private _onFrameCallback: ((state: GameState) => void) | null = null;
  private _hitNotes: Set<string> = new Set();
  private _options: Required<EngineOptions>;
  private _fpsHistory: number[] = [];
  private _frameCount: number = 0;
  private _fpsTime: number = 0;

  constructor(options: EngineOptions = {}, initialNotes: Note[] = []) {
    this._options = {
      bpm: options.bpm ?? 120,
      noteFlyTime: options.noteFlyTime ?? 2,
      judgementLineX: options.judgementLineX ?? 15,
    };

    this._state = {
      isPlaying: false,
      currentTime: 0,
      speed: 1,
      notes: [...initialNotes],
      particles: [],
      performanceMode: 'normal',
    };
  }

  start(): void {
    if (this._state.isPlaying) return;
    this._state.isPlaying = true;
    this._lastTime = performance.now();
    this._fpsTime = performance.now();
    this._frameCount = 0;
    this._fpsHistory = [];
    this._animate();
  }

  stop(): void {
    this._state.isPlaying = false;
    if (this._animationId !== null) {
      cancelAnimationFrame(this._animationId);
      this._animationId = null;
    }
    this._state.currentTime = 0;
    this._hitNotes.clear();
    this._state.particles = [];
  }

  pause(): void {
    this._state.isPlaying = false;
    if (this._animationId !== null) {
      cancelAnimationFrame(this._animationId);
      this._animationId = null;
    }
  }

  onFrame(callback: (state: GameState) => void): void {
    this._onFrameCallback = callback;
  }

  getState(): GameState {
    return { ...this._state, notes: [...this._state.notes], particles: [...this._state.particles] };
  }

  setSpeed(speed: number): void {
    this._state.speed = speed;
  }

  setNotes(notes: Note[]): void {
    this._state.notes = [...notes];
    this._hitNotes.clear();
  }

  private _animate = (): void => {
    if (!this._state.isPlaying) return;

    const now = performance.now();
    const deltaTime = (now - this._lastTime) / 1000;
    this._lastTime = now;

    this._frameCount++;
    if (now - this._fpsTime >= 1000) {
      const fps = this._frameCount * 1000 / (now - this._fpsTime);
      this._fpsHistory.push(fps);
      if (this._fpsHistory.length > 3) {
        this._fpsHistory.shift();
      }
      this._frameCount = 0;
      this._fpsTime = now;
      this._checkPerformance();
    }

    this._update(deltaTime);

    if (this._onFrameCallback) {
      this._onFrameCallback(this._state);
    }

    this._animationId = requestAnimationFrame(this._animate);
  };

  private _update(deltaTime: number): void {
    const adjustedDelta = deltaTime * this._state.speed;
    this._state.currentTime += adjustedDelta;

    this._checkCollisions();
    this._updateParticles(adjustedDelta);
    this._checkParticleCount();
  }

  private _checkCollisions(): void {
    const { currentTime } = this._state;
    const judgementTime = currentTime;

    for (const note of this._state.notes) {
      if (this._hitNotes.has(note.id)) continue;

      const timeDiff = Math.abs(note.time - judgementTime);
      if (timeDiff < 0.05) {
        this._hitNotes.add(note.id);
        this._spawnParticles(note);
      }
    }
  }

  private _spawnParticles(note: Note): void {
    const color = getTrackColor(note.track);
    const baseCount = this._state.performanceMode === 'low' ? 10 : 20;
    const count = baseCount + Math.floor(Math.random() * (baseCount / 2));
    const x = this._options.judgementLineX;
    const y = note.y;

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 100 + Math.random() * 200;
      const life = 0.5 + Math.random() * 1;
      const size = 3 + Math.random() * 5;

      const particle: Particle = {
        id: generateId(),
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        life,
        maxLife: life,
        size,
      };

      this._state.particles.push(particle);
    }
  }

  private _updateParticles(deltaTime: number): void {
    const particles = this._state.particles;
    const alive: Particle[] = [];

    for (const particle of particles) {
      particle.life -= deltaTime;
      if (particle.life <= 0) continue;

      particle.x += particle.vx * deltaTime;
      particle.y += particle.vy * deltaTime;
      particle.vx *= 0.98;
      particle.vy *= 0.98;

      alive.push(particle);
    }

    this._state.particles = alive;
  }

  private _checkPerformance(): void {
    if (this._fpsHistory.length < 3) return;

    const lowFpsCount = this._fpsHistory.filter(fps => fps < 45).length;
    if (lowFpsCount >= 3) {
      this._state.performanceMode = 'low';
    }
  }

  private _checkParticleCount(): void {
    if (this._state.particles.length > 300) {
      this._state.performanceMode = 'low';
    }
  }
}
