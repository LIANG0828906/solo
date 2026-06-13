import { Bubble, BubbleColor, BubbleType } from './bubble';
import { random, randomChoice } from './utils';

export type GameState = 'waiting' | 'playing' | 'ended';

export type AchievementLevel = 'bronze' | 'silver' | 'gold' | 'diamond';

export interface GameStats {
  score: number;
  combo: number;
  maxCombo: number;
  level: number;
  timeRemaining: number;
  targetColor: BubbleColor;
  state: GameState;
  achievement: AchievementLevel | null;
}

export class GameManager {
  private static instance: GameManager | null = null;

  private state: GameState = 'waiting';
  private score: number = 0;
  private combo: number = 0;
  private maxCombo: number = 0;
  private level: number = 1;
  private timeRemaining: number = 90;
  private targetColor: BubbleColor = 'red';
  
  private bubbles: Bubble[] = [];
  private lastSpawnTime: number = 0;
  private spawnInterval: number = 1000;
  private baseSpeed: number = 1.5;
  
  private lastLevelUpTime: number = 0;
  private levelUpInterval: number = 15000;
  
  private availableColors: BubbleColor[] = ['red', 'orange', 'yellow'];
  
  private canvasWidth: number = 800;
  private canvasHeight: number = 600;

  private constructor() {}

  static getInstance(): GameManager {
    if (!GameManager.instance) {
      GameManager.instance = new GameManager();
    }
    return GameManager.instance;
  }

  init(canvasWidth: number, canvasHeight: number): void {
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    this.reset();
  }

  reset(): void {
    this.state = 'waiting';
    this.score = 0;
    this.combo = 0;
    this.maxCombo = 0;
    this.level = 1;
    this.timeRemaining = 90;
    this.bubbles = [];
    this.lastSpawnTime = 0;
    this.spawnInterval = 1000;
    this.baseSpeed = 1.5;
    this.lastLevelUpTime = 0;
    this.availableColors = ['red', 'orange', 'yellow'];
    this.targetColor = randomChoice(this.availableColors);
  }

  start(): void {
    this.state = 'playing';
    this.lastSpawnTime = performance.now();
    this.lastLevelUpTime = performance.now();
  }

  update(currentTime: number, deltaTime: number): void {
    if (this.state !== 'playing') return;

    this.timeRemaining -= deltaTime / 1000;
    
    if (this.timeRemaining <= 0) {
      this.timeRemaining = 0;
      this.endGame();
      return;
    }

    const elapsedSinceLevelUp = currentTime - this.lastLevelUpTime;
    if (elapsedSinceLevelUp >= this.levelUpInterval && this.level < 5) {
      this.levelUp();
    }

    const elapsedSinceSpawn = currentTime - this.lastSpawnTime;
    if (elapsedSinceSpawn >= this.spawnInterval) {
      this.spawnBubble();
      this.lastSpawnTime = currentTime;
    }

    for (const bubble of this.bubbles) {
      bubble.update(deltaTime, currentTime);
    }

    const missedBubbles = this.bubbles.filter(b => b.isOffScreen());
    if (missedBubbles.length > 0) {
      this.resetCombo();
    }

    this.bubbles = this.bubbles.filter(b => !b.isPopped() && !b.isOffScreen());
  }

  private spawnBubble(): void {
    const color = randomChoice(this.availableColors);
    const pattern = Bubble.getPatternForColor(color);
    const diameter = random(30, 50);
    const x = random(diameter, this.canvasWidth - diameter);
    const y = this.canvasHeight + diameter;
    
    let type: BubbleType = 'normal';
    let secondaryColor: BubbleColor | undefined;
    const rand = Math.random();
    
    switch (this.level) {
      case 1:
      case 2:
        type = 'normal';
        break;
      case 3:
        if (rand < 0.25) {
          type = 'striped';
          const otherColors = this.availableColors.filter(c => c !== color);
          if (otherColors.length > 0) {
            secondaryColor = randomChoice(otherColors);
          }
        }
        break;
      case 4:
        if (rand < 0.15) {
          type = 'bomb';
        } else if (rand < 0.40) {
          type = 'striped';
          const otherColors = this.availableColors.filter(c => c !== color);
          if (otherColors.length > 0) {
            secondaryColor = randomChoice(otherColors);
          }
        }
        break;
      case 5:
        if (rand < 0.10) {
          type = 'comet';
        } else if (rand < 0.25) {
          type = 'bomb';
        } else if (rand < 0.50) {
          type = 'striped';
          const otherColors = this.availableColors.filter(c => c !== color);
          if (otherColors.length > 0) {
            secondaryColor = randomChoice(otherColors);
          }
        }
        break;
    }
    
    let speed = this.baseSpeed;
    if (type === 'comet') {
      speed *= 2;
    }
    
    const bubble = new Bubble({
      color,
      secondaryColor,
      pattern,
      diameter,
      x,
      y,
      speed,
      type
    });
    
    this.bubbles.push(bubble);
  }

  private levelUp(): void {
    if (this.level >= 5) return;
    
    this.level++;
    this.lastLevelUpTime = performance.now();
    
    this.spawnInterval *= 0.8;
    this.baseSpeed *= 1.2;
    
    const allColors: BubbleColor[] = ['red', 'orange', 'yellow', 'green', 'blue', 'purple'];
    const nextColor = allColors[this.availableColors.length];
    if (nextColor) {
      this.availableColors.push(nextColor);
    }
    
    this.targetColor = randomChoice(this.availableColors);
  }

  handleClick(x: number, y: number): {
    hit: boolean;
    bubble: Bubble | null;
    isBomb: boolean;
    isCorrect: boolean;
    scoreGained: number;
    shouldFlashRed: boolean;
    shouldBurst: boolean;
  } {
    if (this.state !== 'playing') {
      return {
        hit: false,
        bubble: null,
        isBomb: false,
        isCorrect: false,
        scoreGained: 0,
        shouldFlashRed: false,
        shouldBurst: false
      };
    }

    for (let i = this.bubbles.length - 1; i >= 0; i--) {
      const bubble = this.bubbles[i];
      
      if (!bubble.isClickable()) continue;
      
      if (bubble.containsPoint(x, y)) {
        if (bubble.type === 'bomb') {
          bubble.shake();
          const penalty = 5;
          this.score = Math.max(0, this.score - penalty);
          this.resetCombo();
          return {
            hit: true,
            bubble,
            isBomb: true,
            isCorrect: false,
            scoreGained: -penalty,
            shouldFlashRed: true,
            shouldBurst: false
          };
        }
        
        if (bubble.matchesTarget(this.targetColor)) {
          bubble.pop();
          
          this.addCombo();
          const baseScore = 10;
          const multiplier = this.getComboMultiplier();
          const actualScore = Math.floor(baseScore * multiplier);
          this.score += actualScore;
          
          this.targetColor = randomChoice(this.availableColors);
          
          return {
            hit: true,
            bubble,
            isBomb: false,
            isCorrect: true,
            scoreGained: actualScore,
            shouldFlashRed: false,
            shouldBurst: false
          };
        } else {
          bubble.shake();
          bubble.darken();
          this.resetCombo();
          return {
            hit: true,
            bubble,
            isBomb: false,
            isCorrect: false,
            scoreGained: 0,
            shouldFlashRed: false,
            shouldBurst: false
          };
        }
      }
    }
    
    return {
      hit: false,
      bubble: null,
      isBomb: false,
      isCorrect: false,
      scoreGained: 0,
      shouldFlashRed: false,
      shouldBurst: false
    };
  }

  private addCombo(): void {
    this.combo++;
    if (this.combo > this.maxCombo) {
      this.maxCombo = this.combo;
    }
  }

  private resetCombo(): void {
    this.combo = 0;
  }

  private endGame(): void {
    this.state = 'ended';
  }

  getBubbles(): Bubble[] {
    return this.bubbles;
  }

  getStats(): GameStats {
    return {
      score: this.score,
      combo: this.combo,
      maxCombo: this.maxCombo,
      level: this.level,
      timeRemaining: this.timeRemaining,
      targetColor: this.targetColor,
      state: this.state,
      achievement: this.getAchievement()
    };
  }

  getAchievement(): AchievementLevel | null {
    if (this.state !== 'ended') return null;
    
    if (this.score >= 1000) return 'diamond';
    if (this.score >= 600) return 'gold';
    if (this.score >= 300) return 'silver';
    return 'bronze';
  }

  getState(): GameState {
    return this.state;
  }

  getTargetColor(): BubbleColor {
    return this.targetColor;
  }

  getComboMultiplier(): number {
    if (this.combo > 10) return 2;
    if (this.combo > 5) return 1.5;
    return 1;
  }

  fullScreenBurst(): void {
    for (const bubble of this.bubbles) {
      if (bubble.animationState === 'idle') {
        bubble.pop();
        this.score += 5;
      }
    }
  }

  hasSpecialBubble(): boolean {
    return this.bubbles.some(b => b.type === 'bomb' || b.type === 'comet' || b.type === 'striped');
  }
}
