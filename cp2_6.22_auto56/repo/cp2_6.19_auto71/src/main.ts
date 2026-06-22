import { Ship } from './ship';
import { AsteroidManager } from './asteroid';
import { Renderer } from './renderer';

type EventType =
  | 'key_down'
  | 'key_up'
  | 'laser_fire'
  | 'asteroid_hit'
  | 'ore_pickup'
  | 'portal_enter'
  | 'fuel_low'
  | 'portal_appear';

class EventBus {
  private listeners: Map<EventType, Set<Function>> = new Map();

  public on(type: EventType, callback: Function): void {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    this.listeners.get(type)!.add(callback);
  }

  public emit(type: EventType, data?: any): void {
    const callbacks = this.listeners.get(type);
    if (callbacks) {
      callbacks.forEach((cb) => cb(data));
    }
  }

  public off(type: EventType, callback: Function): void {
    const callbacks = this.listeners.get(type);
    if (callbacks) {
      callbacks.delete(callback);
    }
  }
}

class AudioManager {
  private audioContext: AudioContext | null = null;

  private init(): void {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }

  public playPickupSound(): void {
    this.init();
    if (!this.audioContext) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.frequency.setValueAtTime(880, this.audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(1760, this.audioContext.currentTime + 0.1);

    gainNode.gain.setValueAtTime(0.15, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);

    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + 0.1);
  }

  public playLaserSound(): void {
    this.init();
    if (!this.audioContext) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.type = 'sawtooth';
    oscillator.frequency.setValueAtTime(440, this.audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(110, this.audioContext.currentTime + 0.15);

    gainNode.gain.setValueAtTime(0.08, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.15);

    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + 0.15);
  }

  public playExplosionSound(): void {
    this.init();
    if (!this.audioContext) return;

    const bufferSize = this.audioContext.sampleRate * 0.2;
    const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
    }

    const source = this.audioContext.createBufferSource();
    const gainNode = this.audioContext.createGain();
    const filter = this.audioContext.createBiquadFilter();

    source.buffer = buffer;
    filter.type = 'lowpass';
    filter.frequency.value = 1000;

    source.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.2);

    source.start(this.audioContext.currentTime);
  }

  public playPortalSound(): void {
    this.init();
    if (!this.audioContext) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(220, this.audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(880, this.audioContext.currentTime + 0.5);

    gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.5);

    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + 0.5);
  }
}

class Game {
  private canvas: HTMLCanvasElement;
  private ship: Ship;
  private asteroidManager: AsteroidManager;
  private renderer: Renderer;
  private eventBus: EventBus;
  private audioManager: AudioManager;

  private score: number = 0;
  private oreCount: number = 0;
  private gameTime: number = 0;
  private lastFrameTime: number = 0;
  private animationFrameId: number | null = null;
  private isRunning: boolean = false;

  private keys: Set<string> = new Set();

  private readonly canvasWidth: number = 800;
  private readonly canvasHeight: number = 600;

  constructor() {
    this.canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
    this.canvas.width = this.canvasWidth;
    this.canvas.height = this.canvasHeight;

    this.ship = new Ship(this.canvasWidth / 2, this.canvasHeight / 2);
    this.asteroidManager = new AsteroidManager(this.canvasWidth, this.canvasHeight);
    this.renderer = new Renderer(this.canvas);
    this.eventBus = new EventBus();
    this.audioManager = new AudioManager();

    this.setupEventListeners();
    this.setupEventHandlers();
  }

  private setupEventListeners(): void {
    window.addEventListener('keydown', (e) => {
      if (e.key === ' ') {
        e.preventDefault();
      }
      this.keys.add(e.key.toLowerCase());
      this.ship.handleKeyDown(e.key);
      this.eventBus.emit('key_down', e.key);
    });

    window.addEventListener('keyup', (e) => {
      this.keys.delete(e.key.toLowerCase());
      this.ship.handleKeyUp(e.key);
      this.eventBus.emit('key_up', e.key);
    });
  }

  private setupEventHandlers(): void {
    this.eventBus.on('laser_fire', () => {
      this.audioManager.playLaserSound();
    });

    this.eventBus.on('asteroid_hit', () => {
      this.audioManager.playExplosionSound();
    });

    this.eventBus.on('ore_pickup', (data: any) => {
      this.audioManager.playPickupSound();
      this.score += data.value;
      this.oreCount += 1;
      this.renderer.addScoreAnimation(data.value, data.x, data.y, data.color);
    });

    this.eventBus.on('portal_enter', () => {
      this.audioManager.playPortalSound();
      this.renderer.triggerScreenFlash();
      this.ship.resetFuel();
      this.asteroidManager.clear();
      this.asteroidManager.generateAsteroids(50);
      this.renderer.deactivatePortal();
      this.ship.x = this.canvasWidth / 2;
      this.ship.y = this.canvasHeight / 2;
      this.ship.vx = 0;
      this.ship.vy = 0;
    });

    this.eventBus.on('portal_appear', () => {
      this.audioManager.playPortalSound();
    });
  }

  public start(): void {
    this.asteroidManager.generateAsteroids(50);
    this.isRunning = true;
    this.lastFrameTime = performance.now();
    this.gameLoop();
  }

  public stop(): void {
    this.isRunning = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
  }

  private gameLoop(): void {
    if (!this.isRunning) {
      return;
    }

    const currentTime = performance.now();
    const deltaTime = currentTime - this.lastFrameTime;
    this.lastFrameTime = currentTime;
    this.gameTime += deltaTime;

    this.update(deltaTime, currentTime);
    this.render(currentTime);

    this.animationFrameId = requestAnimationFrame(() => this.gameLoop());
  }

  private update(deltaTime: number, currentTime: number): void {
    const nearAsteroid = this.asteroidManager.isNearAsteroid(this.ship.x, this.ship.y);
    this.ship.update(nearAsteroid, this.canvasWidth, this.canvasHeight);

    if (this.keys.has(' ')) {
      const fired = this.asteroidManager.fireLaser(
        this.ship.x,
        this.ship.y,
        this.ship.rotation,
        currentTime
      );
      if (fired) {
        this.eventBus.emit('laser_fire');
      }
    }

    this.asteroidManager.updateLasers();
    this.asteroidManager.updateAsteroids();
    this.asteroidManager.updateOres();
    this.asteroidManager.updateParticles(deltaTime);

    const collisionResult = this.asteroidManager.checkLaserAsteroidCollisions();
    if (collisionResult.destroyed.length > 0) {
      this.eventBus.emit('asteroid_hit');
    }

    const pickedOres = this.asteroidManager.checkShipOreCollision(this.ship.x, this.ship.y);
    for (const ore of pickedOres) {
      this.eventBus.emit('ore_pickup', {
        value: ore.value,
        x: ore.x,
        y: ore.y,
        color: ore.color,
      });
    }

    this.renderer.updateStars(currentTime);
    this.renderer.updatePortal(this.gameTime);
    this.renderer.updateScoreAnimations(deltaTime);

    const portalState = this.renderer.getPortalState();
    if (portalState.active && this.renderer.checkPortalCollision(this.ship.x, this.ship.y)) {
      this.eventBus.emit('portal_enter');
    }
  }

  private render(time: number): void {
    this.renderer.clear();

    this.renderer.drawBackground(time);
    this.renderer.drawAsteroids(this.asteroidManager.getAsteroids());
    this.renderer.drawOres(this.asteroidManager.getOres(), time);
    this.renderer.drawLasers(this.asteroidManager.getLasers());
    this.renderer.drawShip(this.ship.getState());
    this.renderer.drawPortal(time);
    this.renderer.drawParticles(this.asteroidManager.getParticles());
    this.renderer.drawScoreAnimations();
    this.renderer.drawHUD(
      this.oreCount,
      this.ship.fuel,
      this.ship.maxFuel,
      this.score,
      this.gameTime
    );
    this.renderer.drawEdgeGlow(16, this.gameTime);
    this.renderer.drawScreenFlash(16);
  }
}

const game = new Game();
game.start();
