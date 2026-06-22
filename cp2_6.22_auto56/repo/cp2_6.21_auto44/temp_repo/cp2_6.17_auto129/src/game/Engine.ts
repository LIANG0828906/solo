import { RiverGenerator } from './RiverGenerator';
import { useGameStore, GameState, Position, Obstacle, Coin } from '../store/gameStore';

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const PLAYER_SPEED = 400;
const DRIFTWOOD_SPEED = 80;
const WATER_FREQUENCY = 0.5;
const WATER_AMPLITUDE = 3;
const SEGMENT_TRANSITION_TIME = 0.5;
const SEGMENT_CHANGE_INTERVAL = 3;
const MAX_SPEED_MULTIPLIER = 2.5;
const SPEED_INCREASE_INTERVAL = 15;
const BEND_OFFSET_INCREASE_INTERVAL = 10;
const HIT_FLASH_DURATION = 0.3;
const HIT_FLASH_COUNT = 3;
const GAME_OVER_FADE_DURATION = 2;
const COIN_ROTATION_SPEED = 60;
const COIN_COLLECT_ANIMATION_DURATION = 0.3;
const SCORE_FLASH_DURATION = 0.15;

export class GameEngine {
  private riverGenerator: RiverGenerator;
  private animationFrameId: number | null = null;
  private lastTime: number = 0;
  private keys: Set<string> = new Set();
  private mousePosition: Position | null = null;
  private isDragging: boolean = false;
  private segmentTimer: number = 0;
  private speedIncreaseTimer: number = 0;
  private bendIncreaseTimer: number = 0;
  private baseScrollSpeed: number = 200;
  private canvas: HTMLCanvasElement | null = null;

  constructor() {
    this.riverGenerator = new RiverGenerator();
  }

  setCanvas(canvas: HTMLCanvasElement): void {
    this.canvas = canvas;
  }

  start(): void {
    const state = useGameStore.getState();
    if (state.gameStatus === 'playing') return;

    this.reset();
    useGameStore.getState().setGameStatus('playing');
    this.lastTime = performance.now();
    this.gameLoop();
  }

  reset(): void {
    this.riverGenerator.reset();
    this.segmentTimer = 0;
    this.speedIncreaseTimer = 0;
    this.bendIncreaseTimer = 0;
    this.keys.clear();
    this.mousePosition = null;
    this.isDragging = false;

    const initialSegments = [];
    const initialObstacles: Obstacle[] = [];
    const initialCoins: Coin[] = [];

    for (let i = 0; i < 4; i++) {
      const segment = this.riverGenerator.generateSegment();
      initialSegments.push(segment);
      if (i > 0) {
        initialObstacles.push(...this.riverGenerator.generateObstaclesForSegment(segment, 0, 1));
        initialCoins.push(...this.riverGenerator.generateCoinsForSegment(segment, 0, 1));
      }
    }

    useGameStore.setState({
      gameStatus: 'playing',
      score: 0,
      lives: 3,
      speedMultiplier: 1,
      bendOffset: 80,
      gameTime: 0,
      playerPosition: { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT - 200 },
      playerTilt: 0,
      targetTilt: 0,
      isHit: false,
      hitTime: 0,
      isPaused: false,
      showScoreFlash: false,
      scoreFlashTime: 0,
      riverSegments: initialSegments,
      currentSegmentIndex: 1,
      segmentTransition: 0,
      obstacles: initialObstacles,
      coins: initialCoins,
      waterPhase: 0,
      scrollOffset: 0,
      lastScoreMilestone: 0,
      gameOverOpacity: 0,
    });

    this.riverGenerator.setBendOffset(80);
  }

  pause(): void {
    const state = useGameStore.getState();
    if (state.gameStatus !== 'playing') return;

    useGameStore.getState().setIsPaused(true);
    useGameStore.getState().setGameStatus('paused');
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  resume(): void {
    const state = useGameStore.getState();
    if (state.gameStatus !== 'paused') return;

    useGameStore.getState().setIsPaused(false);
    useGameStore.getState().setGameStatus('playing');
    this.lastTime = performance.now();
    this.gameLoop();
  }

  togglePause(): void {
    const state = useGameStore.getState();
    if (state.gameStatus === 'playing') {
      this.pause();
    } else if (state.gameStatus === 'paused') {
      this.resume();
    }
  }

  private gameLoop = (): void => {
    const currentTime = performance.now();
    const deltaTime = Math.min((currentTime - this.lastTime) / 1000, 0.1);
    this.lastTime = currentTime;

    const state = useGameStore.getState();
    if (state.gameStatus === 'playing' && !state.isPaused) {
      this.update(deltaTime);
    }

    this.animationFrameId = requestAnimationFrame(this.gameLoop);
  };

  private update(deltaTime: number): void {
    const state = useGameStore.getState();

    if (state.gameStatus === 'gameOver') {
      const newOpacity = Math.min(1, state.gameOverOpacity + deltaTime / GAME_OVER_FADE_DURATION);
      useGameStore.getState().setGameOverOpacity(newOpacity);
      return;
    }

    const newGameTime = state.gameTime + deltaTime;
    useGameStore.getState().setGameTime(newGameTime);

    this.speedIncreaseTimer += deltaTime;
    if (this.speedIncreaseTimer >= SPEED_INCREASE_INTERVAL) {
      this.speedIncreaseTimer = 0;
      const newSpeed = Math.min(MAX_SPEED_MULTIPLIER, state.speedMultiplier + 0.1);
      useGameStore.getState().setSpeedMultiplier(newSpeed);
    }

    this.bendIncreaseTimer += deltaTime;
    if (this.bendIncreaseTimer >= BEND_OFFSET_INCREASE_INTERVAL) {
      this.bendIncreaseTimer = 0;
      const newBendOffset = Math.min(200, state.bendOffset + 20);
      useGameStore.getState().setBendOffset(newBendOffset);
      this.riverGenerator.setBendOffset(newBendOffset);
    }

    const newWaterPhase = (state.waterPhase + WATER_FREQUENCY * deltaTime * Math.PI * 2) % (Math.PI * 2);
    useGameStore.getState().setWaterPhase(newWaterPhase);

    const scrollSpeed = this.baseScrollSpeed * state.speedMultiplier;
    const newScrollOffset = state.scrollOffset + scrollSpeed * deltaTime;
    useGameStore.getState().setScrollOffset(newScrollOffset);

    this.segmentTimer += deltaTime;
    let newSegmentTransition = state.segmentTransition;
    let newCurrentSegmentIndex = state.currentSegmentIndex;
    let newSegments = [...state.riverSegments];
    let newObstacles = [...state.obstacles];
    let newCoins = [...state.coins];

    if (this.segmentTimer >= SEGMENT_CHANGE_INTERVAL) {
      if (newSegmentTransition < 1) {
        newSegmentTransition = Math.min(1, newSegmentTransition + deltaTime / SEGMENT_TRANSITION_TIME);
        useGameStore.getState().setSegmentTransition(newSegmentTransition);
      }

      if (newSegmentTransition >= 1) {
        this.segmentTimer = 0;
        newSegmentTransition = 0;
        newCurrentSegmentIndex = (newCurrentSegmentIndex + 1) % newSegments.length;
        useGameStore.getState().setSegmentTransition(0);
        useGameStore.getState().setCurrentSegmentIndex(newCurrentSegmentIndex);

        const newSegment = this.riverGenerator.generateSegment();
        const oldestIndex = (newCurrentSegmentIndex + 1) % newSegments.length;
        newSegments[oldestIndex] = newSegment;

        newObstacles.push(...this.riverGenerator.generateObstaclesForSegment(newSegment, newGameTime, state.speedMultiplier));
        newCoins.push(...this.riverGenerator.generateCoinsForSegment(newSegment, newGameTime, state.speedMultiplier));

        useGameStore.getState().setRiverSegments(newSegments);
      }
    }

    const currentSegment = newSegments[newCurrentSegmentIndex];
    const nextSegmentIndex = (newCurrentSegmentIndex + 1) % newSegments.length;
    const nextSegment = newSegments[nextSegmentIndex];

    newObstacles = newObstacles.map(obs => {
      const newPos = { ...obs.position };
      newPos.y += scrollSpeed * deltaTime;

      if (obs.type === 'driftwood') {
        newPos.y += DRIFTWOOD_SPEED * state.speedMultiplier * deltaTime;
      }

      return { ...obs, position: newPos };
    }).filter(obs => obs.position.y < CANVAS_HEIGHT + 100);

    newCoins = newCoins.map(coin => {
      const newPos = { ...coin.position };
      newPos.y += scrollSpeed * deltaTime;

      let newRotation = coin.rotation + COIN_ROTATION_SPEED * deltaTime;
      let newScale = coin.scale;

      if (coin.collected) {
        newScale = Math.max(0, coin.scale - deltaTime / COIN_COLLECT_ANIMATION_DURATION);
      }

      return { ...coin, position: newPos, rotation: newRotation, scale: newScale };
    }).filter(coin => coin.position.y < CANVAS_HEIGHT + 100 && !(coin.collected && coin.scale <= 0));

    useGameStore.getState().setObstacles(newObstacles);
    useGameStore.getState().setCoins(newCoins);

    let playerX = state.playerPosition.x;
    let targetTilt = 0;
    const moveAmount = PLAYER_SPEED * deltaTime;

    if (this.keys.has('ArrowLeft') || this.keys.has('a') || this.keys.has('A')) {
      playerX -= moveAmount;
      targetTilt = -1;
    }
    if (this.keys.has('ArrowRight') || this.keys.has('d') || this.keys.has('D')) {
      playerX += moveAmount;
      targetTilt = 1;
    }

    if (this.isDragging && this.mousePosition) {
      const centerX = this.canvas ? this.canvas.width / 2 : CANVAS_WIDTH / 2;
      const targetX = centerX + (this.mousePosition.x - centerX) * 1.5;
      const diff = targetX - playerX;
      if (Math.abs(diff) > 5) {
        playerX += Math.sign(diff) * Math.min(Math.abs(diff), moveAmount * 1.5);
        targetTilt = Math.sign(diff);
      }
    }

    const currentWidth = currentSegment.width * (1 - newSegmentTransition) + nextSegment.width * newSegmentTransition;
    const minX = (CANVAS_WIDTH - currentWidth) / 2 + 30;
    const maxX = (CANVAS_WIDTH + currentWidth) / 2 - 30;
    playerX = Math.max(minX, Math.min(maxX, playerX));

    useGameStore.getState().setPlayerPosition({ x: playerX, y: state.playerPosition.y });
    useGameStore.getState().setTargetTilt(targetTilt);

    const newTilt = state.playerTilt + (targetTilt - state.playerTilt) * deltaTime * 10;
    useGameStore.getState().setPlayerTilt(newTilt);

    if (state.isHit) {
      const newHitTime = state.hitTime + deltaTime;
      if (newHitTime >= HIT_FLASH_DURATION) {
        useGameStore.getState().setIsHit(false, 0);
      } else {
        useGameStore.getState().setIsHit(true, newHitTime);
      }
    }

    if (state.showScoreFlash) {
      const newScoreFlashTime = state.scoreFlashTime + deltaTime;
      if (newScoreFlashTime >= SCORE_FLASH_DURATION) {
        useGameStore.getState().setShowScoreFlash(false, 0);
      } else {
        useGameStore.getState().setShowScoreFlash(true, newScoreFlashTime);
      }
    }

    this.checkCollisions(playerX, state.playerPosition.y, currentWidth, newObstacles, newCoins, state);

    const currentMilestone = Math.floor(state.score / 100);
    if (currentMilestone > state.lastScoreMilestone) {
      useGameStore.getState().setLastScoreMilestone(currentMilestone);
      useGameStore.getState().setShowScoreFlash(true, 0);
    }
  }

  private checkCollisions(
    playerX: number,
    playerY: number,
    riverWidth: number,
    obstacles: Obstacle[],
    coins: Coin[],
    state: GameState
  ): void {
    const playerRadius = 15;

    if (!state.isHit) {
      for (const obstacle of obstacles) {
        let collision = false;
        const obsRadius = obstacle.type === 'rock' ? 12 : 14;

        const dx = playerX - obstacle.position.x;
        const dy = playerY - obstacle.position.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < playerRadius + obsRadius) {
          collision = true;
        }

        if (collision) {
          const newLives = state.lives - 1;
          useGameStore.getState().setLives(newLives);
          useGameStore.getState().setIsHit(true, 0);

          if (newLives <= 0) {
            useGameStore.getState().setGameStatus('gameOver');
          }
          break;
        }
      }
    }

    const updatedCoins = coins.map(coin => {
      if (coin.collected) return coin;

      const dx = playerX - coin.position.x;
      const dy = playerY - coin.position.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < playerRadius + 12) {
        const newScore = state.score + 10;
        useGameStore.getState().setScore(newScore);
        return { ...coin, collected: true };
      }
      return coin;
    });

    useGameStore.getState().setCoins(updatedCoins);
  }

  handleKeyDown(key: string): void {
    this.keys.add(key);
    if (key === 'Escape' || key === 'p' || key === 'P') {
      this.togglePause();
    }
  }

  handleKeyUp(key: string): void {
    this.keys.delete(key);
  }

  handleMouseMove(x: number, y: number): void {
    this.mousePosition = { x, y };
  }

  handleMouseDown(x: number, y: number): void {
    this.mousePosition = { x, y };
    this.isDragging = true;
  }

  handleMouseUp(): void {
    this.isDragging = false;
  }

  getWaterAmplitude(): number {
    return WATER_AMPLITUDE;
  }

  getCanvasSize(): { width: number; height: number } {
    return { width: CANVAS_WIDTH, height: CANVAS_HEIGHT };
  }

  destroy(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }
}
