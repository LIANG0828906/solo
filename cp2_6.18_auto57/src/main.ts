import { eventBus, on, RailEvent, UIEvent, PlayerState, SegmentData } from './eventBus';
import { RailGenerator } from './railGenerator';
import { Renderer } from './renderer';
import { UIManager } from './ui';
import { audioManager } from './audioManager';
import * as THREE from 'three';

class Game {
  private container: HTMLElement;
  private railGenerator: RailGenerator;
  private renderer: Renderer;
  private uiManager: UIManager;
  private lastTime: number = 0;
  private animationId: number | null = null;
  private isRunning: boolean = false;
  private keys: Set<string> = new Set();
  private targetLane: number = 1;

  constructor() {
    this.container = document.getElementById('game-container')!;

    const isMobile = window.innerWidth < 768;

    this.railGenerator = new RailGenerator(isMobile);
    this.renderer = new Renderer(this.container);
    this.uiManager = new UIManager(this.container);

    this.setupEventListeners();
    this.setupInputHandlers();
  }

  private setupEventListeners(): void {
    eventBus.on('scoreChanged', (event) => {
      const e = event as { type: string; score: number; combo: number };
      this.uiManager.updateScore(e.score, e.combo);
    });

    eventBus.on('speedChanged', (event) => {
      const e = event as { type: string; speed: number };
      this.uiManager.updateSpeed(e.speed);
    });

    eventBus.on('collision', (event) => {
      const e = event as {
        type: string;
        collisionType: 'obstacle' | 'energy';
        position: { x: number; y: number; z: number };
      };
      const pos = new THREE.Vector3(e.position.x, e.position.y, -e.position.z);
      
      if (e.collisionType === 'energy') {
        this.renderer.spawnParticles(pos, 0xFFD700, 20);
      } else {
        this.renderer.spawnParticles(pos, 0xff3333, 15);
      }
    });

    eventBus.on('lifeLost', (event) => {
      const e = event as { type: string; lives: number };
      this.uiManager.updateLives(e.lives);
    });

    eventBus.on('lifeRestored', (event) => {
      const e = event as { type: string; lives: number };
      this.uiManager.updateLives(e.lives);
    });

    eventBus.on('gameOver', (event) => {
      const e = event as { type: string; finalScore: number };
      this.stop();
      this.uiManager.showGameOver(e.finalScore);
    });

    eventBus.on('pause', () => {
      this.railGenerator.pause();
    });

    eventBus.on('resume', () => {
      this.railGenerator.resume();
    });

    this.uiManager.setOnStart(() => {
      this.start();
    });

    this.uiManager.setOnRestart(() => {
      this.restart();
    });
  }

  private setupInputHandlers(): void {
    document.addEventListener('keydown', (e) => {
      this.keys.add(e.key.toLowerCase());
      
      if (e.key.toLowerCase() === 'a' || e.key === 'ArrowLeft') {
        this.railGenerator.moveLeft();
      }
      if (e.key.toLowerCase() === 'd' || e.key === 'ArrowRight') {
        this.railGenerator.moveRight();
      }
      if (e.key === ' ') {
        e.preventDefault();
        this.railGenerator.jump();
      }
    });

    document.addEventListener('keyup', (e) => {
      this.keys.delete(e.key.toLowerCase());
    });

    document.addEventListener('laneChange', ((e: CustomEvent) => {
      const targetLane = e.detail.lane;
      const playerState = this.railGenerator.getPlayerState();
      const currentLane = playerState.lane;
      
      if (targetLane < currentLane) {
        this.railGenerator.moveLeft();
      } else if (targetLane > currentLane) {
        this.railGenerator.moveRight();
      }
    }) as EventListener);
  }

  start(): void {
    if (this.isRunning) return;

    audioManager.init();
    audioManager.resume();

    this.isRunning = true;
    this.lastTime = performance.now();

    for (let i = 0; i < 10; i++) {
      const segment = this.railGenerator.generateSegment(i);
      this.renderer.createSegment(segment);
    }

    const playerState = this.railGenerator.getPlayerState();
    this.uiManager.updateScore(playerState.score, playerState.combo);
    this.uiManager.updateSpeed(playerState.speed);

    this.gameLoop();
  }

  private gameLoop = (): void => {
    if (!this.isRunning) return;

    const currentTime = performance.now();
    const deltaTime = Math.min((currentTime - this.lastTime) / 1000, 0.1);
    this.lastTime = currentTime;

    this.railGenerator.update(deltaTime);

    const playerState = this.railGenerator.getPlayerState();
    const segments = this.railGenerator.getSegments();

    const playerSegIndex = Math.floor(
      playerState.z / (this.railGenerator.getSegmentLength() + this.railGenerator.getGapSize())
    );

    for (const segment of segments) {
      if (!this.renderer['segmentMeshes'].has(segment.index)) {
        this.renderer.createSegment(segment);
      }
    }

    const existingSegIndices = Array.from((this.renderer as any).segmentMeshes.keys());
    const keepFromIndex = playerSegIndex - 5;
    for (const idx of existingSegIndices) {
      if (idx < keepFromIndex) {
        this.renderer.removeSegment(idx);
      }
    }

    this.renderer.update(playerState, segments, deltaTime);

    this.animationId = requestAnimationFrame(this.gameLoop);
  };

  stop(): void {
    this.isRunning = false;
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  restart(): void {
    this.stop();

    audioManager.init();
    audioManager.resume();

    this.railGenerator.restart();

    const segMeshes = (this.renderer as any).segmentMeshes as Map<number, any>;
    for (const idx of segMeshes.keys()) {
      this.renderer.removeSegment(idx);
    }

    const segments = this.railGenerator.getSegments();
    for (const segment of segments) {
      this.renderer.createSegment(segment);
    }

    const playerState = this.railGenerator.getPlayerState();
    this.uiManager.updateScore(playerState.score, playerState.combo);
    this.uiManager.updateSpeed(playerState.speed);

    this.isRunning = true;
    this.lastTime = performance.now();
    this.gameLoop();
  }

  dispose(): void {
    this.stop();
    this.renderer.dispose();
  }
}

window.addEventListener('DOMContentLoaded', () => {
  const game = new Game();
  
  (window as any).game = game;
});
