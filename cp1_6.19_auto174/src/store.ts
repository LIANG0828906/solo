import { GameState, Ship, Debris, SatellitePart, Warning, Particle, Star, GameStatus } from './engine/types';

type Listener = (state: GameState) => void;

const CANVAS_WIDTH = 1200;
const CANVAS_HEIGHT = 800;

function createInitialShip(): Ship {
  return {
    x: CANVAS_WIDTH / 2,
    y: CANVAS_HEIGHT / 2,
    angle: -Math.PI / 2,
    speed: 200,
    lives: 3,
    shieldCooldown: 0,
    isInvincible: false,
    invincibleTimer: 0,
    hitFlashTimer: 0,
  };
}

function createInitialState(): GameState {
  const highScore = typeof window !== 'undefined'
    ? parseInt(localStorage.getItem('spaceHighScore') || '0', 10)
    : 0;

  return {
    debrisList: [],
    satelliteParts: [],
    ship: createInitialShip(),
    score: 0,
    highScore,
    warnings: [],
    gameStatus: 'playing',
    beamActive: false,
    beamTimer: 0,
    beamCooldown: 0,
    beamAngle: -Math.PI / 2,
    difficultyMultiplier: 1,
    partsCollected: 0,
    particles: [],
    stars: [],
    galaxyAngle: 0,
    canvasWidth: CANVAS_WIDTH,
    canvasHeight: CANVAS_HEIGHT,
  };
}

class GameStore {
  private state: GameState;
  private listeners: Set<Listener> = new Set();
  private animationFrameId: number | null = null;
  private lastTime: number = 0;
  private keys: Set<string> = new Set();
  private mouseX: number = CANVAS_WIDTH / 2;
  private mouseY: number = CANVAS_HEIGHT / 2;

  constructor() {
    this.state = createInitialState();
  }

  getState(): GameState {
    return this.state;
  }

  setState(partial: Partial<GameState>): void {
    this.state = { ...this.state, ...partial };
    this.notify();
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    this.listeners.forEach((listener) => listener(this.state));
  }

  setCanvasSize(width: number, height: number): void {
    this.setState({ canvasWidth: width, canvasHeight: height });
  }

  getKeys(): Set<string> {
    return this.keys;
  }

  setKey(key: string, pressed: boolean): void {
    if (pressed) {
      this.keys.add(key.toLowerCase());
    } else {
      this.keys.delete(key.toLowerCase());
    }
  }

  setMousePosition(x: number, y: number): void {
    this.mouseX = x;
    this.mouseY = y;
  }

  getMousePosition(): { x: number; y: number } {
    return { x: this.mouseX, y: this.mouseY };
  }

  addScore(points: number): void {
    const newScore = this.state.score + points;
    const newHighScore = Math.max(newScore, this.state.highScore);
    if (newHighScore > this.state.highScore) {
      if (typeof window !== 'undefined') {
        localStorage.setItem('spaceHighScore', newHighScore.toString());
      }
    }
    this.setState({ score: newScore, highScore: newHighScore });
  }

  loseLife(): void {
    const newLives = this.state.ship.lives - 1;
    const newShip = {
      ...this.state.ship,
      lives: newLives,
      isInvincible: true,
      invincibleTimer: 1.5,
      hitFlashTimer: 0.8,
    };

    if (newLives <= 0) {
      this.setState({
        ship: newShip,
        gameStatus: 'gameover',
      });
    } else {
      this.setState({ ship: newShip });
    }
  }

  restart(): void {
    const highScore = this.state.highScore;
    this.state = createInitialState();
    this.state.highScore = highScore;
    this.notify();
  }

  addParticles(particles: Particle[]): void {
    this.setState({
      particles: [...this.state.particles, ...particles],
    });
  }

  updateWarnings(warnings: Warning[]): void {
    this.setState({ warnings });
  }

  setGameStatus(status: GameStatus): void {
    this.setState({ gameStatus: status });
  }

  incrementPartsCollected(): void {
    const newPartsCollected = this.state.partsCollected + 1;
    this.setState({ partsCollected: newPartsCollected });
  }

  setDifficultyMultiplier(multiplier: number): void {
    this.setState({ difficultyMultiplier: multiplier });
  }
}

export const gameStore = new GameStore();
