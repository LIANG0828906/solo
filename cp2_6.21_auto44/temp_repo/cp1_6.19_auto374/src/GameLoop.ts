import { create } from 'zustand';
import { SkillType, useSkillStore } from './SkillManager';
import { EffectRenderer } from './EffectRenderer';

export interface Player {
  x: number;
  y: number;
  baseY: number;
  velocityY: number;
  isJumping: boolean;
  jumpProgress: number;
}

export interface Obstacle {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Cloud {
  x: number;
  y: number;
  width: number;
  speed: number;
}

interface GameState {
  player: Player;
  obstacles: Obstacle[];
  clouds: Cloud[];
  scrollOffset: number;
  fps: number;
  frameCount: number;
  lastFpsUpdate: number;
}

interface GameStore extends GameState {
  setPlayer: (player: Partial<Player>) => void;
  addObstacle: (obstacle: Obstacle) => void;
  removeObstacle: (index: number) => void;
  updateObstacles: (obstacles: Obstacle[]) => void;
  addCloud: (cloud: Cloud) => void;
  updateClouds: (clouds: Cloud[]) => void;
  setScrollOffset: (offset: number) => void;
  setFps: (fps: number) => void;
  incrementFrameCount: () => void;
  setLastFpsUpdate: (time: number) => void;
  resetGame: () => void;
}

const CANVAS_WIDTH = 600;
const CANVAS_HEIGHT = 400;
const GROUND_Y = CANVAS_HEIGHT * 0.75;
const PLAYER_SIZE = 16;
const RUN_SPEED = 3;
const JUMP_HEIGHT = 50;
const JUMP_DURATION = 500;

export const useGameStore = create<GameStore>((set, get) => ({
  player: {
    x: CANVAS_WIDTH * 0.2,
    y: GROUND_Y - PLAYER_SIZE,
    baseY: GROUND_Y - PLAYER_SIZE,
    velocityY: 0,
    isJumping: false,
    jumpProgress: 0,
  },
  obstacles: [],
  clouds: [],
  scrollOffset: 0,
  fps: 60,
  frameCount: 0,
  lastFpsUpdate: 0,

  setPlayer: (player) =>
    set((state) => ({ player: { ...state.player, ...player } })),

  addObstacle: (obstacle) =>
    set((state) => ({ obstacles: [...state.obstacles, obstacle] })),

  removeObstacle: (index) =>
    set((state) => ({
      obstacles: state.obstacles.filter((_, i) => i !== index),
    })),

  updateObstacles: (obstacles) => set({ obstacles }),

  addCloud: (cloud) =>
    set((state) => ({ clouds: [...state.clouds, cloud] })),

  updateClouds: (clouds) => set({ clouds }),

  setScrollOffset: (scrollOffset) => set({ scrollOffset }),

  setFps: (fps) => set({ fps }),

  incrementFrameCount: () =>
    set((state) => ({ frameCount: state.frameCount + 1 })),

  setLastFpsUpdate: (lastFpsUpdate) => set({ lastFpsUpdate }),

  resetGame: () =>
    set({
      player: {
        x: CANVAS_WIDTH * 0.2,
        y: GROUND_Y - PLAYER_SIZE,
        baseY: GROUND_Y - PLAYER_SIZE,
        velocityY: 0,
        isJumping: false,
        jumpProgress: 0,
      },
      obstacles: [],
      scrollOffset: 0,
    }),
}));

export class GameLoop {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private effectRenderer: EffectRenderer;
  private animationId: number | null = null;
  private lastTime: number = 0;
  private isRunning: boolean = false;
  private accumulator: number = 0;
  private readonly FIXED_TIMESTEP = 1000 / 60;

  private skillKeyMap: Record<string, SkillType> = {
    '1': 'dash',
    '2': 'shield',
    '3': 'doubleJump',
    '4': 'slowTime',
  };

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.effectRenderer = new EffectRenderer();
    this.ctx.imageSmoothingEnabled = false;
    this.initializeClouds();
  }

  private initializeClouds(): void {
    const { addCloud } = useGameStore.getState();
    for (let i = 0; i < 5; i++) {
      addCloud({
        x: Math.random() * CANVAS_WIDTH,
        y: 30 + Math.random() * 80,
        width: 40 + Math.random() * 40,
        speed: 0.5 + Math.random() * 0.5,
      });
    }
  }

  start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastTime = performance.now();
    const now = performance.now();
    useGameStore.setState({ lastFpsUpdate: now, fps: 60, frameCount: 0 });
    this.loop(this.lastTime);
  }

  stop(): void {
    this.isRunning = false;
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  handleKeyDown(key: string): void {
    const skillType = this.skillKeyMap[key];
    if (!skillType) return;

    const { triggerSkill, skills } = useSkillStore.getState();
    const { player } = useGameStore.getState();

    if (triggerSkill(skillType)) {
      const skill = skills[skillType];
      this.effectRenderer.spawnParticles(
        skillType,
        player.x + PLAYER_SIZE / 2,
        player.y + PLAYER_SIZE / 2,
        skill.particleCount
      );
      this.effectRenderer.triggerScreenShake(3, 300);
      this.applySkillEffect(skillType);
    }
  }

  private applySkillEffect(skillType: SkillType): void {
    const { setPlayer } = useGameStore.getState();
    const { player } = useGameStore.getState();

    switch (skillType) {
      case 'dash':
        setPlayer({ x: Math.min(player.x + 80, CANVAS_WIDTH - PLAYER_SIZE) });
        break;
      case 'doubleJump':
        if (!player.isJumping) {
          setPlayer({ isJumping: true, jumpProgress: 0 });
        }
        break;
      case 'slowTime':
        this.effectRenderer.setSlowMotion(true);
        break;
    }
  }

  private loop(currentTime: number): void {
    if (!this.isRunning) return;

    const deltaTime = currentTime - this.lastTime;
    this.lastTime = currentTime;

    const { skills, updateSkills } = useSkillStore.getState();
    const timeScale = skills.slowTime.isActive ? 0.5 : 1;
    const scaledDelta = deltaTime * timeScale;

    updateSkills(deltaTime);

    if (!skills.slowTime.isActive) {
      this.effectRenderer.setSlowMotion(false);
    }

    this.accumulator += scaledDelta;
    while (this.accumulator >= this.FIXED_TIMESTEP) {
      this.update(this.FIXED_TIMESTEP);
      this.accumulator -= this.FIXED_TIMESTEP;
    }

    this.effectRenderer.update(deltaTime);
    this.updateFPS(deltaTime);
    this.render();

    this.animationId = requestAnimationFrame((t) => this.loop(t));
  }

  private update(deltaTime: number): void {
    const state = useGameStore.getState();
    const { setPlayer, setScrollOffset, updateObstacles, updateClouds, addObstacle } = state;
    let { player, obstacles, clouds, scrollOffset } = state;

    scrollOffset += RUN_SPEED;
    setScrollOffset(scrollOffset);

    const tileSize = 100;
    const currentTile = Math.floor(scrollOffset / tileSize);
    const nextTileX = (currentTile + 1) * tileSize - scrollOffset;

    if (nextTileX <= CANVAS_WIDTH && !obstacles.some((o) => Math.abs(o.x - nextTileX) < 10)) {
      if (Math.random() < 0.4) {
        const height = 2 + Math.floor(Math.random() * 3);
        addObstacle({
          x: nextTileX,
          y: GROUND_Y - height,
          width: 8,
          height,
        });
      }
    }

    obstacles = obstacles
      .map((o) => ({ ...o, x: o.x - RUN_SPEED }))
      .filter((o) => o.x + o.width > 0);
    updateObstacles(obstacles);

    clouds = clouds.map((c) => {
      let newX = c.x - c.speed;
      if (newX + c.width < 0) {
        newX = CANVAS_WIDTH;
      }
      return { ...c, x: newX };
    });
    updateClouds(clouds);

    if (player.isJumping) {
      let newProgress = player.jumpProgress + deltaTime;
      if (newProgress >= JUMP_DURATION) {
        setPlayer({
          y: player.baseY,
          isJumping: false,
          jumpProgress: 0,
        });
      } else {
        const jumpPhase = newProgress / JUMP_DURATION;
        const heightOffset = Math.sin(jumpPhase * Math.PI) * JUMP_HEIGHT;
        setPlayer({
          y: player.baseY - heightOffset,
          jumpProgress: newProgress,
        });
      }
    }
  }

  private updateFPS(deltaTime: number): void {
    const state = useGameStore.getState();
    const { lastFpsUpdate } = state;
    const now = performance.now();

    useGameStore.setState((state) => ({ frameCount: state.frameCount + 1 }));

    if (now - lastFpsUpdate >= 1000) {
      const newState = useGameStore.getState();
      const fps = Math.round((newState.frameCount * 1000) / (now - lastFpsUpdate));
      useGameStore.setState({ fps, lastFpsUpdate: now, frameCount: 0 });
    }
  }

  private render(): void {
    const { player, obstacles, clouds } = useGameStore.getState();
    const { skills } = useSkillStore.getState();

    this.ctx.fillStyle = '#1a1a2e';
    this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    this.ctx.fillStyle = '#3a3a5e';
    clouds.forEach((cloud) => {
      this.drawPixelCloud(cloud.x, cloud.y, cloud.width);
    });

    this.ctx.fillStyle = '#b0bec5';
    this.ctx.fillRect(0, GROUND_Y, CANVAS_WIDTH, CANVAS_HEIGHT - GROUND_Y);

    this.ctx.fillStyle = '#90a4ae';
    for (let x = -((useGameStore.getState().scrollOffset * 0.5) % 20); x < CANVAS_WIDTH; x += 20) {
      this.ctx.fillRect(x, GROUND_Y, 2, 4);
    }

    this.ctx.fillStyle = '#e94560';
    obstacles.forEach((obstacle) => {
      this.ctx.fillRect(
        Math.floor(obstacle.x),
        Math.floor(obstacle.y),
        obstacle.width,
        obstacle.height
      );
    });

    const shakeOffset = this.effectRenderer.getShakeOffset();
    const playerDrawX = Math.floor(player.x);
    const playerDrawY = Math.floor(player.y);

    this.drawPixelPlayer(playerDrawX, playerDrawY);

    if (skills.shield.isActive) {
      this.ctx.strokeStyle = '#45B7D1';
      this.ctx.lineWidth = 2;
      this.ctx.strokeRect(
        playerDrawX - 2,
        playerDrawY - 2,
        PLAYER_SIZE + 4,
        PLAYER_SIZE + 4
      );
    }

    this.effectRenderer.render(this.ctx);
  }

  private drawPixelCloud(x: number, y: number, width: number): void {
    const h = 12;
    this.ctx.fillRect(Math.floor(x) + 4, Math.floor(y), width - 8, h);
    this.ctx.fillRect(Math.floor(x), Math.floor(y) + 4, width, h - 4);
    this.ctx.fillRect(Math.floor(x) + 8, Math.floor(y) - 4, width - 16, 4);
  }

  private drawPixelPlayer(x: number, y: number): void {
    const px = (px: number, py: number, color: string) => {
      this.ctx.fillStyle = color;
      this.ctx.fillRect(x + px, y + py, 2, 2);
    };

    const main = '#4ECDC4';
    const dark = '#3AA89F';
    const eye = '#ffffff';
    const pupil = '#1a1a2e';

    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const pxPos = col * 2;
        const pyPos = row * 2;
        
        if (row >= 2 && row <= 5 && col >= 1 && col <= 6) {
          px(pxPos, pyPos, main);
        } else if (row === 1 && col >= 2 && col <= 5) {
          px(pxPos, pyPos, main);
        } else if (row === 6 && col >= 2 && col <= 5) {
          px(pxPos, pyPos, dark);
        } else if (row === 0 && col >= 3 && col <= 4) {
          px(pxPos, pyPos, dark);
        }
        
        if (row === 2 && col === 2) {
          px(pxPos, pyPos, eye);
          px(pxPos + 1, pyPos, pupil);
        }
        if (row === 2 && col === 5) {
          px(pxPos, pyPos, eye);
          px(pxPos + 1, pyPos, pupil);
        }
      }
    }
  }

  getEffectRenderer(): EffectRenderer {
    return this.effectRenderer;
  }
}
