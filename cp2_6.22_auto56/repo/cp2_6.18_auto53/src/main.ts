import * as THREE from 'three';
import { GameEngine, GameMode } from './gameEngine';
import { AudioPlayer, getSongs, SongInfo } from './audioAnalyzer';
import { UIController } from './uiController';

class EchoArenaApp {
  private renderer!: THREE.WebGLRenderer;
  private engine!: GameEngine;
  private audioPlayer!: AudioPlayer;
  private ui!: UIController;
  private currentMode: GameMode = 'single';
  private currentSong: SongInfo | null = null;
  private isRunning = false;
  private animFrameId = 0;
  private lastFrameTime = 0;
  private deltaAccumulator = 0;
  private frameCount = 0;

  async init(): Promise<void> {
    const container = document.getElementById('app')!;

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setClearColor(0x000000, 1);
    this.renderer.autoClear = false;
    container.appendChild(this.renderer.domElement);

    this.audioPlayer = new AudioPlayer();
    await this.audioPlayer.init();

    this.engine = new GameEngine(this.audioPlayer);
    this.ui = new UIController(container);

    this.setupEngineCallbacks();
    this.setupUICallbacks();
    this.setupInputHandlers();
    this.setupResizeHandler();
    this.injectKeyframes();

    this.ui.showMenu();
  }

  private injectKeyframes(): void {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes pulse {
        0%, 100% { transform: scale(1); opacity: 1; }
        50% { transform: scale(1.15); opacity: 0.85; }
      }
      @keyframes comboPulse {
        0% { transform: scale(0.8); opacity: 0; }
        30% { transform: scale(1.05); opacity: 1; }
        100% { transform: scale(1); opacity: 0.8; }
      }
      @keyframes floatUp {
        0% { transform: translateY(0) scale(1); opacity: 1; }
        100% { transform: translateY(-60px) scale(1.1); opacity: 0; }
      }
    `;
    document.head.appendChild(style);
  }

  private setupEngineCallbacks(): void {
    this.engine.onJudge = (feedback) => {
      const pos = this.worldToScreen(feedback.position, feedback.playerIndex);
      this.ui.showJudgeFeedback(feedback.grade, pos, feedback.playerIndex);
    };

    this.engine.onComboMilestone = (playerIndex) => {
      this.ui.triggerComboFlash(playerIndex);
    };

    this.engine.onFeverStart = (playerIndex) => {
      console.log(`[EchoArena] Player ${playerIndex + 1} FEVER MODE activated!`);
    };

    this.engine.onFeverEnd = (playerIndex) => {
      console.log(`[EchoArena] Player ${playerIndex + 1} fever ended`);
    };

    this.engine.onGameEnd = () => {
      this.isRunning = false;
      cancelAnimationFrame(this.animFrameId);
      const states = this.engine.getPlayerStates();
      this.ui.showResult(states, this.currentMode);
    };

    this.engine.onStateUpdate = (states) => {
      this.ui.updateHUD(states);
    };

    this.engine.onBeatDetected = (_playerIndex) => {
    };
  }

  private setupUICallbacks(): void {
    this.ui.setCallbacks({
      onModeSelect: (mode) => {
        this.currentMode = mode;
        if (window.innerWidth < 480) {
          alert('分屏需更大屏幕');
          this.currentMode = 'single';
        }
        this.ui.showSongSelect(getSongs());
      },
      onSongSelect: (song) => {
        this.currentSong = song;
        this.startGame();
      },
      onResume: () => {
        this.audioPlayer.resume();
        this.lastFrameTime = performance.now();
        this.isRunning = true;
        this.gameLoop();
      },
      onRestart: () => {
        if (this.currentSong) this.startGame();
      },
      onBackToSongs: () => {
        this.engine.stopGame();
        this.isRunning = false;
        cancelAnimationFrame(this.animFrameId);
        this.ui.showSongSelect(getSongs());
      },
    });
  }

  private setupInputHandlers(): void {
    const keyMap: Record<string, { player: number; direction: 'up' | 'down' | 'left' | 'right' }> = {
      KeyW: { player: 0, direction: 'up' },
      KeyS: { player: 0, direction: 'down' },
      KeyA: { player: 0, direction: 'left' },
      KeyD: { player: 0, direction: 'right' },
      ArrowUp: { player: 1, direction: 'up' },
      ArrowDown: { player: 1, direction: 'down' },
      ArrowLeft: { player: 1, direction: 'left' },
      ArrowRight: { player: 1, direction: 'right' },
    };

    window.addEventListener('keydown', (e) => {
      if (e.code === 'Escape') {
        if (this.isRunning) {
          this.isRunning = false;
          cancelAnimationFrame(this.animFrameId);
          this.audioPlayer.pause();
          this.ui.showPause();
        }
        return;
      }

      const mapping = keyMap[e.code];
      if (!mapping) return;

      if (this.currentMode === 'single') {
        if (mapping.player === 0) {
          this.engine.handleInput(0, mapping.direction);
        }
      } else {
        this.engine.handleInput(mapping.player, mapping.direction);
      }
    });

    let inputStart: {
      x: number; y: number; t: number; player: number;
    } | null = null;

    const determinePlayer = (x: number): number => {
      if (this.currentMode === 'single') return 0;
      const isHorizontal = window.innerWidth >= 960;
      if (isHorizontal) {
        return x < window.innerWidth / 2 ? 0 : 1;
      } else {
        return 0;
      }
    };

    const onPointerDown = (x: number, y: number) => {
      if (!this.isRunning) return;
      inputStart = {
        x, y,
        t: performance.now(),
        player: determinePlayer(x),
      };
    };

    const onPointerUp = (x: number, y: number) => {
      if (!inputStart || !this.isRunning) return;

      const dx = x - inputStart.x;
      const dy = y - inputStart.y;
      const dt = performance.now() - inputStart.t;
      const player = inputStart.player;
      inputStart = null;

      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 20) return;

      this.engine.handleSwipe(player, dx, dy, 15);
    };

    this.renderer.domElement.addEventListener('mousedown', (e) => {
      onPointerDown(e.clientX, e.clientY);
    });

    this.renderer.domElement.addEventListener('mouseup', (e) => {
      onPointerUp(e.clientX, e.clientY);
    });

    this.renderer.domElement.addEventListener('touchstart', (e) => {
      const t = e.touches[0];
      if (t) onPointerDown(t.clientX, t.clientY);
      e.preventDefault();
    }, { passive: false });

    this.renderer.domElement.addEventListener('touchend', (e) => {
      const t = e.changedTouches[0];
      if (t) onPointerUp(t.clientX, t.clientY);
      e.preventDefault();
    }, { passive: false });
  }

  private setupResizeHandler(): void {
    window.addEventListener('resize', () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      this.renderer.setSize(w, h);

      const playerCount = this.currentMode === 'dual' ? 2 : 1;
      const isHorizontal = w >= 960;
      const isSingle = playerCount === 1;

      for (let i = 0; i < playerCount; i++) {
        const camera = this.engine.getCamera(i);
        if (camera) {
          if (isSingle) {
            camera.aspect = w / h;
          } else if (isHorizontal) {
            camera.aspect = (w / 2) / h;
          } else {
            camera.aspect = w / (h / 2);
          }
          camera.updateProjectionMatrix();
        }
      }

      this.ui.handleResize();
    });
  }

  private startGame(): void {
    if (!this.currentSong) return;

    this.engine.stopGame();
    cancelAnimationFrame(this.animFrameId);
    this.isRunning = false;

    this.engine.init(this.currentMode, this.renderer);

    const w = window.innerWidth;
    const h = window.innerHeight;
    const playerCount = this.currentMode === 'dual' ? 2 : 1;
    const isHorizontal = w >= 960;
    const isSingle = playerCount === 1;

    for (let i = 0; i < playerCount; i++) {
      const camera = this.engine.getCamera(i)!;
      if (isSingle) {
        camera.aspect = w / h;
      } else if (isHorizontal) {
        camera.aspect = (w / 2) / h;
      } else {
        camera.aspect = w / (h / 2);
      }
      camera.updateProjectionMatrix();
    }

    this.ui.showHUD(playerCount);
    this.engine.startGame(this.currentSong);

    this.lastFrameTime = performance.now();
    this.deltaAccumulator = 0;
    this.frameCount = 0;
    this.isRunning = true;
    this.gameLoop();
  }

  private gameLoop(): void {
    if (!this.isRunning) return;

    this.animFrameId = requestAnimationFrame(() => this.gameLoop());

    const now = performance.now();
    let delta = (now - this.lastFrameTime) / 1000;
    this.lastFrameTime = now;

    if (delta > 0.1) delta = 0.1;
    if (delta < 0) delta = 0;

    this.engine.update(delta);
    this.renderSplitScreen();

    const freqData = this.audioPlayer.getFrequencyData();
    this.ui.updateSpectrum(freqData, this.currentMode === 'dual' ? 2 : 1);

    this.frameCount++;
    this.deltaAccumulator += delta;
    if (this.deltaAccumulator >= 2.0) {
      const fps = this.frameCount / this.deltaAccumulator;
      if (fps < 25) {
        console.warn(`[EchoArena] Low FPS: ${fps.toFixed(1)}`);
      }
      this.frameCount = 0;
      this.deltaAccumulator = 0;
    }
  }

  private renderSplitScreen(): void {
    const w = this.renderer.domElement.width;
    const h = this.renderer.domElement.height;
    const playerCount = this.currentMode === 'dual' ? 2 : 1;
    const isHorizontal = w >= h;

    this.renderer.setScissorTest(false);
    this.renderer.clear(true, true, true);
    this.renderer.setScissorTest(true);

    for (let i = 0; i < playerCount; i++) {
      const scene = this.engine.getScene(i);
      const camera = this.engine.getCamera(i);
      if (!scene || !camera) continue;

      let viewportX = 0;
      let viewportY = 0;
      let viewportW = w;
      let viewportH = h;

      if (playerCount === 2) {
        if (isHorizontal) {
          const halfW = Math.floor(w / 2);
          viewportW = halfW;
          viewportX = i === 0 ? 0 : halfW;

          if (i === 1 && halfW * 2 < w) {
            viewportW = w - halfW;
          }
        } else {
          const halfH = Math.floor(h / 2);
          viewportH = halfH;
          viewportY = i === 0 ? halfH : 0;

          if (i === 0 && halfH * 2 < h) {
            viewportH = h - halfH;
          }
        }
      }

      this.renderer.setViewport(viewportX, viewportY, viewportW, viewportH);
      this.renderer.setScissor(viewportX, viewportY, viewportW, viewportH);

      const bgColor = i === 0 ? 0x000018 : 0x180008;
      if (scene.background instanceof THREE.Color) {
        scene.background.setHex(bgColor);
      }

      this.renderer.render(scene, camera);
    }

    this.renderer.setScissorTest(false);
  }

  private worldToScreen(worldPos: THREE.Vector3, playerIndex: number): { x: number; y: number } {
    const camera = this.engine.getCamera(playerIndex);
    if (!camera) return { x: 0, y: 0 };

    const w = this.renderer.domElement.width;
    const h = this.renderer.domElement.height;
    const playerCount = this.currentMode === 'dual' ? 2 : 1;
    const isHorizontal = w >= h;

    const vec = worldPos.clone().project(camera);

    let ndcX = (vec.x + 1) / 2;
    let ndcY = (1 - vec.y) / 2;

    let screenX: number;
    let screenY: number;

    if (playerCount === 1) {
      screenX = ndcX * w;
      screenY = ndcY * h;
    } else if (isHorizontal) {
      const halfW = Math.floor(w / 2);
      const viewportW = playerIndex === 0 ? halfW : (w - halfW);
      const viewportX = playerIndex === 0 ? 0 : halfW;

      screenX = viewportX + ndcX * viewportW;
      screenY = ndcY * h;
    } else {
      const halfH = Math.floor(h / 2);
      const viewportH = playerIndex === 0 ? (h - halfH) : halfH;
      const viewportY = playerIndex === 0 ? halfH : 0;

      screenX = ndcX * w;
      screenY = viewportY + ndcY * viewportH;
    }

    return { x: screenX, y: screenY };
  }
}

const app = new EchoArenaApp();
app.init().catch(console.error);
