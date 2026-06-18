import {
  eventBus,
  type Ship,
  type AttackLine,
  type CombatSnapshot,
  type CombatState,
  type WeaponType,
  type WeaponConfig,
  type FormationType,
} from '../eventBus';
import { applyFormation, generateRandomFleet } from '../domain/fleet';
import {
  getDefaultWeaponConfigs,
  createFocusFireAttackLines,
  isAttackLineActive,
} from '../domain/weapon';

const MAX_ATTACK_LINES = 20;
const MAX_RECORDED_FRAMES = 60;
const RECORD_INTERVAL = 100;
const SHIP_SPEED = 0.08;

export class CombatSimulator {
  private state: CombatState;
  private animationFrameId: number | null = null;
  private lastTime: number = 0;
  private lastRecordTime: number = 0;
  private canvasWidth: number = 800;
  private canvasHeight: number = 600;

  constructor(canvasWidth: number = 800, canvasHeight: number = 600) {
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    this.state = this.createInitialState();
    this.setupEventListeners();
  }

  private createInitialState(): CombatState {
    const playerCenterX = this.canvasWidth * 0.3;
    const playerCenterY = this.canvasHeight * 0.5;
    const enemyCenterX = this.canvasWidth * 0.75;
    const enemyCenterY = this.canvasHeight * 0.5;

    const playerFleet = applyFormation(
      generateRandomFleet(playerCenterX, playerCenterY),
      'wedge',
      playerCenterX,
      playerCenterY
    );

    const enemyFleet = this.createEnemyGrid(enemyCenterX, enemyCenterY);

    return {
      playerFleet,
      enemyFleet,
      attackLines: [],
      selectedTargetId: null,
      selectedShipId: null,
      showRange: false,
      isRecording: false,
      recordedFrames: [],
      currentFrame: 0,
      isPlaying: false,
      playbackSpeed: 1,
      weaponConfigs: getDefaultWeaponConfigs(),
      currentFormation: 'wedge',
    };
  }

  private createEnemyGrid(centerX: number, centerY: number): Ship[] {
    const ships: Ship[] = [];
    const spacing = 60;
    const shipTypes = ['destroyer', 'cruiser', 'capital'] as const;

    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        const type = shipTypes[Math.floor(Math.random() * shipTypes.length)];
        const x = centerX + (col - 1) * spacing;
        const y = centerY + (row - 1) * spacing;
        const weaponTypes = ['laser', 'missile', 'railgun'] as const;
        const weaponType = weaponTypes[Math.floor(Math.random() * weaponTypes.length)];

        const healthMap = { destroyer: 50, cruiser: 100, capital: 200 };

        ships.push({
          id: `enemy-${row}-${col}`,
          type,
          x,
          y,
          targetX: x,
          targetY: y,
          weaponType,
          health: healthMap[type],
          maxHealth: healthMap[type],
        });
      }
    }

    return ships;
  }

  private setupEventListeners(): void {
    eventBus.on('formation:change', (formation) => this.handleFormationChange(formation));
    eventBus.on('target:select', (targetId) => this.handleTargetSelect(targetId));
    eventBus.on('fire:focus', (targetId) => this.handleFocusFire(targetId));
    eventBus.on('range:toggle', (show) => this.handleRangeToggle(show));
    eventBus.on('weapon:update', ({ type, config }) => this.handleWeaponUpdate(type, config));
    eventBus.on('combat:record', () => this.handleRecord());
    eventBus.on('combat:play', () => this.handlePlay());
    eventBus.on('combat:pause', () => this.handlePause());
    eventBus.on('combat:seek', (frame) => this.handleSeek(frame));
    eventBus.on('combat:speed', (speed) => this.handleSpeedChange(speed));
    eventBus.on('ship:click', ({ shipId, isEnemy }) => this.handleShipClick(shipId, isEnemy));
  }

  private handleFormationChange(formation: FormationType): void {
    const centerX = this.canvasWidth * 0.3;
    const centerY = this.canvasHeight * 0.5;
    this.state.currentFormation = formation;
    this.state.playerFleet = applyFormation(
      this.state.playerFleet,
      formation,
      centerX,
      centerY
    );
  }

  private handleTargetSelect(targetId: string | null): void {
    this.state.selectedTargetId = targetId;
  }

  private handleFocusFire(targetId: string): void {
    const targetShip = this.state.enemyFleet.find((s) => s.id === targetId);
    if (!targetShip) return;

    const now = performance.now();
    const newLines = createFocusFireAttackLines(
      this.state.playerFleet,
      targetShip,
      this.state.weaponConfigs,
      now
    );

    this.state.attackLines = [...this.state.attackLines, ...newLines];
    if (this.state.attackLines.length > MAX_ATTACK_LINES) {
      this.state.attackLines = this.state.attackLines.slice(-MAX_ATTACK_LINES);
    }

    targetShip.isFlashing = true;
    targetShip.flashStartTime = now;
  }

  private handleRangeToggle(show: boolean): void {
    this.state.showRange = show;
  }

  private handleWeaponUpdate(type: WeaponType, config: Partial<WeaponConfig>): void {
    this.state.weaponConfigs[type] = {
      ...this.state.weaponConfigs[type],
      ...config,
    };
  }

  private handleRecord(): void {
    this.state.isRecording = !this.state.isRecording;
    if (this.state.isRecording) {
      this.state.recordedFrames = [];
      this.state.currentFrame = 0;
      this.lastRecordTime = performance.now();
    }
  }

  private handlePlay(): void {
    if (this.state.recordedFrames.length === 0) return;
    this.state.isPlaying = true;
  }

  private handlePause(): void {
    this.state.isPlaying = false;
  }

  private handleSeek(frame: number): void {
    this.state.currentFrame = Math.max(0, Math.min(frame, this.state.recordedFrames.length - 1));
    this.state.isPlaying = false;
  }

  private handleSpeedChange(speed: number): void {
    this.state.playbackSpeed = speed;
  }

  private handleShipClick(shipId: string, isEnemy: boolean): void {
    if (isEnemy) {
      this.state.selectedTargetId = shipId;
      eventBus.emit('target:select', shipId);
    } else {
      this.state.selectedShipId = shipId;
      eventBus.emit('selected-ship:change', shipId);
    }
  }

  public start(): void {
    this.lastTime = performance.now();
    this.loop();
  }

  public stop(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  public getState(): CombatState {
    return this.state;
  }

  public setCanvasSize(width: number, height: number): void {
    this.canvasWidth = width;
    this.canvasHeight = height;
  }

  private loop = (): void => {
    const now = performance.now();
    const deltaTime = now - this.lastTime;
    this.lastTime = now;

    if (this.state.isPlaying && this.state.recordedFrames.length > 0) {
      this.updatePlayback(deltaTime);
    } else {
      this.update(deltaTime, now);
    }

    if (this.state.isRecording) {
      this.recordFrame(now);
    }

    eventBus.emit('frame:update', this.createSnapshot());
    this.animationFrameId = requestAnimationFrame(this.loop);
  };

  private update(deltaTime: number, now: number): void {
    this.updateShipPositions(deltaTime);
    this.updateAttackLines(now);
    this.updateFlashingShips(now);
  }

  private updateShipPositions(deltaTime: number): void {
    const allShips = [...this.state.playerFleet, ...this.state.enemyFleet];
    const factor = Math.min(deltaTime * SHIP_SPEED, 1);

    for (const ship of allShips) {
      ship.x += (ship.targetX - ship.x) * factor;
      ship.y += (ship.targetY - ship.y) * factor;
    }
  }

  private updateAttackLines(now: number): void {
    this.state.attackLines = this.state.attackLines.filter((line) =>
      isAttackLineActive(line, now)
    );
  }

  private updateFlashingShips(now: number): void {
    const flashDuration = 600;
    const allShips = [...this.state.playerFleet, ...this.state.enemyFleet];

    for (const ship of allShips) {
      if (ship.isFlashing && ship.flashStartTime !== undefined) {
        if (now - ship.flashStartTime > flashDuration) {
          ship.isFlashing = false;
          ship.flashStartTime = undefined;
        }
      }
    }
  }

  private updatePlayback(deltaTime: number): void {
    const frameTime = RECORD_INTERVAL / this.state.playbackSpeed;
    const frameAdvance = deltaTime / frameTime;
    this.state.currentFrame += frameAdvance;

    if (this.state.currentFrame >= this.state.recordedFrames.length - 1) {
      this.state.currentFrame = this.state.recordedFrames.length - 1;
      this.state.isPlaying = false;
    }
  }

  private recordFrame(now: number): void {
    if (now - this.lastRecordTime >= RECORD_INTERVAL) {
      if (this.state.recordedFrames.length >= MAX_RECORDED_FRAMES) {
        this.state.recordedFrames.shift();
      }
      this.state.recordedFrames.push(this.createSnapshot());
      this.lastRecordTime = now;
    }
  }

  private createSnapshot(): CombatSnapshot {
    return {
      playerFleet: this.state.playerFleet.map((s) => ({ ...s })),
      enemyFleet: this.state.enemyFleet.map((s) => ({ ...s })),
      attackLines: this.state.attackLines.map((l) => ({ ...l })),
      timestamp: performance.now(),
    };
  }

  public getDisplayState(): CombatState {
    if (this.state.recordedFrames.length > 0 && (this.state.isPlaying || this.state.currentFrame > 0)) {
      const frameIndex = Math.floor(this.state.currentFrame);
      const frame = this.state.recordedFrames[Math.min(frameIndex, this.state.recordedFrames.length - 1)];
      if (frame) {
        return {
          ...this.state,
          playerFleet: frame.playerFleet,
          enemyFleet: frame.enemyFleet,
          attackLines: frame.attackLines,
        };
      }
    }
    return this.state;
  }
}
