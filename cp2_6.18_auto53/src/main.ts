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

    this.ui.showMenu();
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
      console.log(`Player ${playerIndex + 1} FEVER!`);
    };

    this.engine.onFeverEnd = (playerIndex) => {
      console.log(`Player ${playerIndex + 1} fever ended`);
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
  }

  private setupUICallbacks(): void {
    this.ui.setCallbacks({
      onModeSelect: (mode) => {
        this.currentMode = mode;
        this.ui.showSongSelect(getSongs());
      },
      onSongSelect: (song) => {
        this.currentSong = song;
        this.startGame();
      },
      onResume: () => {
        this.audioPlayer.resume();
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
    const keyMap: Record<string, { player: number; direction: string }> = {
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
        this.engine.handleInput(0, mapping.direction);
      } else {
        this.engine.handleInput(mapping.player, mapping.direction);
      }
    });

    let mouseDown = false;
    let mouseStart = { x: 0, y: 0 };
    let mousePlayer = 0;

    this.renderer.domElement.addEventListener('mousedown', (e) => {
      mouseDown = true;
      mouseStart = { x: e.clientX, y: e.clientY };
      if (this.currentMode === 'dual') {
        mousePlayer = e.clientX < window.innerWidth / 2 ? 0 : 1;
      } else {
        mousePlayer = 0;
      }
    });

    this.renderer.domElement.addEventListener('mouseup', (e) => {
      if (!mouseDown) return;
      mouseDown = false;

      const dx = e.clientX - mouseStart.x;
      const dy = e.clientY - mouseStart.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 20) return;

      let direction: string;
      if (Math.abs(dx) > Math.abs(dy)) {
        direction = dx > 0 ? 'right' : 'left';
      } else {
        direction = dy > 0 ? 'down' : 'up';
      }

      this.engine.handleInput(mousePlayer, direction);
    });

    this.renderer.domElement.addEventListener('touchstart', (e) => {
      const touch = e.touches[0];
      mouseDown = true;
      mouseStart = { x: touch.clientX, y: touch.clientY };
      if (this.currentMode === 'dual') {
        mousePlayer = touch.clientX < window.innerWidth / 2 ? 0 : 1;
      } else {
        mousePlayer = 0;
      }
    });

    this.renderer.domElement.addEventListener('touchend', (e) => {
      if (!mouseDown) return;
      mouseDown = false;

      const touch = e.changedTouches[0];
      const dx = touch.clientX - mouseStart.x;
      const dy = touch.clientY - mouseStart.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 20) return;

      let direction: string;
      if (Math.abs(dx) > Math.abs(dy)) {
        direction = dx > 0 ? 'right' : 'left';
      } else {
        direction = dy > 0 ? 'down' : 'up';
      }

      this.engine.handleInput(mousePlayer, direction);
    });
  }

  private setupResizeHandler(): void {
    window.addEventListener('resize', () => {
      this.renderer.setSize(window.innerWidth, window.innerHeight);

      const playerCount = this.currentMode === 'dual' ? 2 : 1;
      const isHorizontal = window.innerWidth >= 960;

      for (let i = 0; i < playerCount; i++) {
        const camera = this.engine.getCamera(i);
        if (camera) {
          if (isHorizontal) {
            camera.aspect = (window.innerWidth / 2) / window.innerHeight;
          } else {
            camera.aspect = window.innerWidth / (window.innerHeight / 2);
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

    this.engine.init(this.currentMode, this.renderer);

    const playerCount = this.currentMode === 'dual' ? 2 : 1;
    const isHorizontal = window.innerWidth >= 960;

    for (let i = 0; i < playerCount; i++) {
      const camera = this.engine.getCamera(i)!;
      if (isHorizontal) {
        camera.aspect = (window.innerWidth / 2) / window.innerHeight;
      } else if (this.currentMode === 'dual') {
        camera.aspect = window.innerWidth / (window.innerHeight / 2);
      } else {
        camera.aspect = window.innerWidth / window.innerHeight;
      }
      camera.updateProjectionMatrix();
    }

    this.ui.showHUD(playerCount);
    this.engine.startGame(this.currentSong);
    this.isRunning = true;
    this.gameLoop();
  }

  private gameLoop(): void {
    if (!this.isRunning) return;

    this.animFrameId = requestAnimationFrame(() => this.gameLoop());

    const delta = Math.min(1 / 30, this.engine.getScene(0) ? 1 / 60 : 0);

    this.engine.update(delta);
    this.render();

    const freqData = this.audioPlayer.getFrequencyData();
    this.ui.updateSpectrum(freqData, this.currentMode === 'dual' ? 2 : 1);
  }

  private render(): void {
    const playerCount = this.currentMode === 'dual' ? 2 : 1;
    const w = window.innerWidth;
    const h = window.innerHeight;
    const isHorizontal = w >= 960;

    this.renderer.clear();

    for (let i = 0; i < playerCount; i++) {
      const scene = this.engine.getScene(i);
      const camera = this.engine.getCamera(i);
      if (!scene || !camera) continue;

      this.renderer.setScissorTest(true);

      if (playerCount === 1) {
        this.renderer.setViewport(0, 0, w, h);
        this.renderer.setScissor(0, 0, w, h);
      } else if (isHorizontal) {
        const halfW = w / 2;
        if (i === 0) {
          this.renderer.setViewport(0, 0, halfW, h);
          this.renderer.setScissor(0, 0, halfW, h);
        } else {
          this.renderer.setViewport(halfW, 0, halfW, h);
          this.renderer.setScissor(halfW, 0, halfW, h);
        }
      } else {
        const halfH = h / 2;
        if (i === 0) {
          this.renderer.setViewport(0, halfH, w, halfH);
          this.renderer.setScissor(0, halfH, w, halfH);
        } else {
          this.renderer.setViewport(0, 0, w, halfH);
          this.renderer.setScissor(0, 0, w, halfH);
        }
      }

      this.renderer.render(scene, camera);
    }

    this.renderer.setScissorTest(false);
  }

  private worldToScreen(worldPos: THREE.Vector3, playerIndex: number): { x: number; y: number } {
    const camera = this.engine.getCamera(playerIndex);
    if (!camera) return { x: 0, y: 0 };

    const vec = worldPos.clone().project(camera);

    const w = window.innerWidth;
    const h = window.innerHeight;
    const isHorizontal = w >= 960;
    const playerCount = this.currentMode === 'dual' ? 2 : 1;

    let screenX = (vec.x * 0.5 + 0.5) * w;
    let screenY = (-vec.y * 0.5 + 0.5) * h;

    if (playerCount === 2) {
      if (isHorizontal) {
        const halfW = w / 2;
        screenX = playerIndex === 0
          ? (vec.x * 0.5 + 0.5) * halfW
          : halfW + (vec.x * 0.5 + 0.5) * halfW;
      } else {
        const halfH = h / 2;
        screenY = playerIndex === 0
          ? halfH + (1 - (vec.y * 0.5 + 0.5)) * halfH
          : (1 - (vec.y * 0.5 + 0.5)) * halfH;
      }
    }

    return { x: screenX, y: screenY };
  }
}

const app = new EchoArenaApp();
app.init().catch(console.error);
