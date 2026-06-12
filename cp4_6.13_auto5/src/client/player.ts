import Phaser from 'phaser';
import { Direction, Position, PlayerColor, COLORS, MAZE_SIZE, MazeData, CELL_WALL } from './types/game.js';
import { wsClient } from './utils/wsClient.js';

interface PlayerVisual {
  sprite: Phaser.GameObjects.Arc;
  glow: Phaser.GameObjects.Arc;
  trail: Phaser.GameObjects.Arc[];
  nameText: Phaser.GameObjects.Text;
}

export class PlayerController {
  private scene: Phaser.Scene;
  private playerId: string;
  private playerColor: PlayerColor;
  private playerName: string;
  private visual: PlayerVisual | null = null;
  private currentPosition: Position = { x: 0, y: 0 };
  private targetPosition: Position = { x: 0, y: 0 };
  private predictedPosition: Position = { x: 0, y: 0 };
  private isMoving: boolean = false;
  private moveProgress: number = 0;
  private cellSize: number = 0;
  private offsetX: number = 0;
  private offsetY: number = 0;
  private maze: MazeData | null = null;
  private lastInputTime: number = 0;
  private inputCooldown: number = 120;
  private isLocalPlayer: boolean = false;
  private breathTween: Phaser.Tweens.Tween | null = null;
  private steps: number = 0;

  private keyW!: Phaser.Input.Keyboard.Key;
  private keyA!: Phaser.Input.Keyboard.Key;
  private keyS!: Phaser.Input.Keyboard.Key;
  private keyD!: Phaser.Input.Keyboard.Key;
  private keyUp!: Phaser.Input.Keyboard.Key;
  private keyDown!: Phaser.Input.Keyboard.Key;
  private keyLeft!: Phaser.Input.Keyboard.Key;
  private keyRight!: Phaser.Input.Keyboard.Key;

  constructor(
    scene: Phaser.Scene,
    playerId: string,
    playerName: string,
    color: PlayerColor,
    isLocal: boolean = false
  ) {
    this.scene = scene;
    this.playerId = playerId;
    this.playerName = playerName;
    this.playerColor = color;
    this.isLocalPlayer = isLocal;

    if (this.isLocalPlayer) {
      this.setupKeyboardControls();
    }
  }

  setMaze(maze: MazeData, cellSize: number, offsetX: number, offsetY: number): void {
    this.maze = maze;
    this.cellSize = cellSize;
    this.offsetX = offsetX;
    this.offsetY = offsetY;
  }

  setInitialPosition(pos: Position): void {
    this.currentPosition = { ...pos };
    this.targetPosition = { ...pos };
    this.predictedPosition = { ...pos };
  }

  createVisual(): void {
    const color = this.playerColor === 'blue' ? COLORS.NEON_BLUE : COLORS.NEON_PINK;
    const pixelPos = this.gridToPixel(this.currentPosition.x, this.currentPosition.y);
    const radius = this.cellSize * 0.35;

    const glow = this.scene.add.circle(pixelPos.x, pixelPos.y, radius * 1.8, color, 0.2);
    glow.setBlendMode(Phaser.BlendModes.ADD);

    const sprite = this.scene.add.circle(pixelPos.x, pixelPos.y, radius, color, 1);
    sprite.setBlendMode(Phaser.BlendModes.NORMAL);

    this.scene.add.circle(pixelPos.x, pixelPos.y, radius * 0.6, COLORS.WHITE, 0.4);

    const trail: Phaser.GameObjects.Arc[] = [];
    for (let i = 0; i < 3; i++) {
      const t = this.scene.add.circle(pixelPos.x, pixelPos.y, radius * (0.5 - i * 0.12), color, 0.3 - i * 0.08);
      trail.push(t);
    }

    const nameText = this.scene.add.text(pixelPos.x, pixelPos.y - radius - 15, this.playerName, {
      fontFamily: 'Share Tech Mono, monospace',
      fontSize: `${Math.max(10, this.cellSize * 0.22)}px`,
      color: color
    });
    nameText.setOrigin(0.5);
    nameText.setShadow(0, 0, color, 8);

    this.visual = { sprite, glow, trail, nameText };
    this.startBreathAnimation();
  }

  private startBreathAnimation(): void {
    if (!this.visual || this.breathTween) return;

    let breathPhase = 0;
    const baseScale = 1;

    this.breathTween = this.scene.tweens.addCounter({
      from: 0,
      to: Math.PI * 2,
      duration: 2000,
      repeat: -1,
      onUpdate: (tween) => {
        if (!this.visual) return;
        const val = tween.getValue();
        breathPhase = val !== null ? val : breathPhase;
        const scale = baseScale + Math.sin(breathPhase) * 0.15;
        this.visual.sprite.setScale(scale);
        this.visual.glow.setScale(1 + Math.sin(breathPhase) * 0.25);
        const alpha = 0.25 + Math.sin(breathPhase) * 0.15;
        this.visual.glow.setAlpha(alpha);
      }
    });
  }

  private setupKeyboardControls(): void {
    const input = this.scene.input.keyboard;
    if (!input) return;

    this.keyW = input.addKey(Phaser.Input.Keyboard.KeyCodes.W);
    this.keyA = input.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    this.keyS = input.addKey(Phaser.Input.Keyboard.KeyCodes.S);
    this.keyD = input.addKey(Phaser.Input.Keyboard.KeyCodes.D);

    this.keyUp = input.addKey(Phaser.Input.Keyboard.KeyCodes.UP);
    this.keyDown = input.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN);
    this.keyLeft = input.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT);
    this.keyRight = input.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT);
  }

  update(time: number, delta: number): void {
    if (this.isLocalPlayer) {
      this.handleInput(time);
    }

    if (this.isMoving) {
      this.updateMovement(delta);
    }

    this.updateVisual();
  }

  private handleInput(currentTime: number): void {
    if (currentTime - this.lastInputTime < this.inputCooldown) return;
    if (this.isMoving) return;

    let direction: Direction = 'none';

    if (this.keyW?.isDown || this.keyUp?.isDown) {
      direction = 'up';
    } else if (this.keyS?.isDown || this.keyDown?.isDown) {
      direction = 'down';
    } else if (this.keyA?.isDown || this.keyLeft?.isDown) {
      direction = 'left';
    } else if (this.keyD?.isDown || this.keyRight?.isDown) {
      direction = 'right';
    }

    if (direction !== 'none') {
      this.attemptMove(direction, currentTime);
    }
  }

  private attemptMove(direction: Direction, currentTime: number): void {
    const newPos = this.calculateNewPosition(this.currentPosition, direction);

    if (this.isValidMove(newPos)) {
      this.lastInputTime = currentTime;
      this.targetPosition = { ...newPos };
      this.predictedPosition = { ...newPos };
      this.isMoving = true;
      this.moveProgress = 0;
      this.steps++;

      wsClient.send({
        type: 'PLAYER_INPUT',
        direction,
        timestamp: currentTime
      });
    }
  }

  private calculateNewPosition(current: Position, direction: Direction): Position {
    const delta: Record<Direction, Position> = {
      up: { x: 0, y: -1 },
      down: { x: 0, y: 1 },
      left: { x: -1, y: 0 },
      right: { x: 1, y: 0 },
      none: { x: 0, y: 0 }
    };
    return {
      x: current.x + delta[direction].x,
      y: current.y + delta[direction].y
    };
  }

  private isValidMove(pos: Position): boolean {
    if (!this.maze) return false;
    if (pos.x < 0 || pos.x >= MAZE_SIZE || pos.y < 0 || pos.y >= MAZE_SIZE) {
      return false;
    }
    return this.maze[pos.y][pos.x] !== CELL_WALL;
  }

  private updateMovement(delta: number): void {
    const moveSpeed = 0.008;
    this.moveProgress += delta * moveSpeed;

    if (this.moveProgress >= 1) {
      this.moveProgress = 1;
      this.currentPosition = { ...this.targetPosition };
      this.isMoving = false;
    }
  }

  private updateVisual(): void {
    if (!this.visual) return;

    let renderPos: Position;

    if (this.isMoving && this.isLocalPlayer) {
      renderPos = this.lerpPosition(this.currentPosition, this.targetPosition, this.moveProgress);
    } else {
      renderPos = { ...this.currentPosition };
    }

    const pixelPos = this.gridToPixel(renderPos.x, renderPos.y);

    this.visual.sprite.setPosition(pixelPos.x, pixelPos.y);
    this.visual.glow.setPosition(pixelPos.x, pixelPos.y);
    this.visual.nameText.setPosition(pixelPos.x, pixelPos.y - this.cellSize * 0.35 - 10);

    this.visual.trail.forEach((trail, index) => {
      const trailProgress = Math.max(0, this.moveProgress - (index + 1) * 0.2);
      const trailPos = this.lerpPosition(this.currentPosition, this.targetPosition, trailProgress);
      const trailPixel = this.gridToPixel(trailPos.x, trailPos.y);
      trail.setPosition(trailPixel.x, trailPixel.y);
      trail.setAlpha(Math.max(0, 0.3 - index * 0.1) * this.moveProgress);
    });
  }

  private lerpPosition(from: Position, to: Position, progress: number): Position {
    return {
      x: from.x + (to.x - from.x) * progress,
      y: from.y + (to.y - from.y) * progress
    };
  }

  updateFromServer(position: Position, direction: Direction): void {
    if (this.isLocalPlayer) {
      const dx = Math.abs(position.x - this.predictedPosition.x);
      const dy = Math.abs(position.y - this.predictedPosition.y);
      if (dx > 1 || dy > 1) {
        this.currentPosition = { ...position };
        this.targetPosition = { ...position };
        this.predictedPosition = { ...position };
        this.isMoving = false;
      }
    } else {
      if (!this.isMoving) {
        this.targetPosition = { ...position };
        this.isMoving = true;
        this.moveProgress = 0;
      }
    }
  }

  handleCollision(position: Position): void {
    if (this.isLocalPlayer) {
      this.currentPosition = { ...position };
      this.targetPosition = { ...position };
      this.predictedPosition = { ...position };
      this.isMoving = false;
      this.steps--;

      this.scene.cameras.main.shake(100, 0.005);
    }
  }

  gridToPixel(gridX: number, gridY: number): { x: number; y: number } {
    return {
      x: this.offsetX + (gridX + 0.5) * this.cellSize,
      y: this.offsetY + (gridY + 0.5) * this.cellSize
    };
  }

  getPosition(): Position {
    return { ...this.currentPosition };
  }

  getSteps(): number {
    return this.steps;
  }

  getColor(): PlayerColor {
    return this.playerColor;
  }

  getId(): string {
    return this.playerId;
  }

  setSteps(steps: number): void {
    this.steps = steps;
  }

  destroy(): void {
    if (this.visual) {
      this.visual.sprite.destroy();
      this.visual.glow.destroy();
      this.visual.trail.forEach(t => t.destroy());
      this.visual.nameText.destroy();
    }
    if (this.breathTween) {
      this.breathTween.remove();
    }
  }
}

export class VirtualJoystick {
  private scene: Phaser.Scene;
  private base: Phaser.GameObjects.Arc | null = null;
  private stick: Phaser.GameObjects.Arc | null = null;
  private pointerId: number | null = null;
  private active: boolean = false;
  private onDirectionChange: ((direction: Direction) => void) | null = null;
  private centerX: number = 0;
  private centerY: number = 0;
  private currentDirection: Direction = 'none';
  private lastDirectionTime: number = 0;
  private cooldown: number = 120;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  create(x: number, y: number): void {
    this.centerX = x;
    this.centerY = y;

    this.base = this.scene.add.circle(x, y, 60, 0x000000, 0.3);
    this.base.setStrokeStyle(2, COLORS.NEON_BLUE, 0.5);
    this.base.setScrollFactor(0);
    this.base.setDepth(100);

    this.stick = this.scene.add.circle(x, y, 30, COLORS.NEON_BLUE, 0.6);
    this.stick.setBlendMode(Phaser.BlendModes.ADD);
    this.stick.setScrollFactor(0);
    this.stick.setDepth(101);

    this.base.setInteractive({ useHandCursor: false });

    this.scene.input.on('pointerdown', this.handlePointerDown, this);
    this.scene.input.on('pointermove', this.handlePointerMove, this);
    this.scene.input.on('pointerup', this.handlePointerUp, this);
    this.scene.input.on('pointercancel', this.handlePointerUp, this);
  }

  setOnDirectionChange(callback: (direction: Direction) => void): void {
    this.onDirectionChange = callback;
  }

  private handlePointerDown(pointer: Phaser.Input.Pointer): void {
    if (this.pointerId !== null) return;

    const dx = pointer.x - this.centerX;
    const dy = pointer.y - this.centerY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < 100) {
      this.pointerId = pointer.id;
      this.active = true;
      this.updateStickPosition(pointer.x, pointer.y);
    }
  }

  private handlePointerMove(pointer: Phaser.Input.Pointer): void {
    if (this.pointerId !== pointer.id || !this.active) return;
    this.updateStickPosition(pointer.x, pointer.y);
  }

  private handlePointerUp(pointer: Phaser.Input.Pointer): void {
    if (this.pointerId !== pointer.id) return;

    this.pointerId = null;
    this.active = false;
    this.currentDirection = 'none';

    if (this.stick) {
      this.stick.setPosition(this.centerX, this.centerY);
    }
  }

  private updateStickPosition(pointerX: number, pointerY: number): void {
    if (!this.stick || !this.base) return;

    const dx = pointerX - this.centerX;
    const dy = pointerY - this.centerY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const maxDistance = 45;

    let stickX = pointerX;
    let stickY = pointerY;

    if (distance > maxDistance) {
      const ratio = maxDistance / distance;
      stickX = this.centerX + dx * ratio;
      stickY = this.centerY + dy * ratio;
    }

    this.stick.setPosition(stickX, stickY);

    const now = Date.now();
    if (now - this.lastDirectionTime > this.cooldown) {
      const direction = this.calculateDirection(dx, dy, distance);
      if (direction !== this.currentDirection && direction !== 'none') {
        this.currentDirection = direction;
        this.lastDirectionTime = now;
        if (this.onDirectionChange) {
          this.onDirectionChange(direction);
        }
      }
    }
  }

  private calculateDirection(dx: number, dy: number, distance: number): Direction {
    if (distance < 15) return 'none';

    const angle = Math.atan2(dy, dx);
    const degrees = (angle * 180) / Math.PI;

    if (degrees >= -22.5 && degrees < 22.5) return 'right';
    if (degrees >= 22.5 && degrees < 67.5) return 'down';
    if (degrees >= 67.5 && degrees < 112.5) return 'down';
    if (degrees >= 112.5 && degrees < 157.5) return 'left';
    if (degrees >= 157.5 || degrees < -157.5) return 'left';
    if (degrees >= -157.5 && degrees < -112.5) return 'up';
    if (degrees >= -112.5 && degrees < -67.5) return 'up';
    if (degrees >= -67.5 && degrees < -22.5) return 'right';

    return 'none';
  }

  setVisible(visible: boolean): void {
    if (this.base) this.base.setVisible(visible);
    if (this.stick) this.stick.setVisible(visible);
  }

  destroy(): void {
    if (this.base) this.base.destroy();
    if (this.stick) this.stick.destroy();
    this.scene.input.off('pointerdown', this.handlePointerDown, this);
    this.scene.input.off('pointermove', this.handlePointerMove, this);
    this.scene.input.off('pointerup', this.handlePointerUp, this);
    this.scene.input.off('pointercancel', this.handlePointerUp, this);
  }
}
