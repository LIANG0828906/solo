import * as PIXI from 'pixi.js';
import type {
  LevelConfig,
  PlatformConfig,
  ButtonConfig,
  DoorConfig,
  Rect,
  ButtonTriggerEvent,
  RecordingSegment
} from '../../types';

export const LEVELS: LevelConfig[] = [
  {
    id: 1,
    name: '第一关：时间初探',
    description: '录制自己按下按钮的动作，回放时让幽灵帮你开门',
    playerStart: { x: 100, y: 500 },
    platforms: [
      { x: 0, y: 550, width: 1280, height: 50, type: 'normal' },
      { x: 300, y: 450, width: 200, height: 20, type: 'normal' },
      { x: 600, y: 380, width: 150, height: 20, type: 'normal' },
      { x: 900, y: 300, width: 200, height: 20, type: 'normal' }
    ],
    spikes: [
      { x: 500, y: 540, width: 80, height: 10 }
    ],
    buttons: [
      { id: 'btn1', x: 640, y: 360, width: 60, height: 20 }
    ],
    doors: [
      { id: 'door1', x: 1100, y: 430, width: 30, height: 120, triggeredBy: ['btn1'], requiresAll: true }
    ],
    goal: { x: 1180, y: 490, width: 50, height: 60 },
    ghostColors: [0x00ffff, 0xffa500],
    maxRecordings: 2
  },
  {
    id: 2,
    name: '第二关：双重协奏',
    description: '两个按钮必须同时被按下才能开门，需要两个幽灵配合',
    playerStart: { x: 80, y: 500 },
    platforms: [
      { x: 0, y: 550, width: 1280, height: 50, type: 'normal' },
      { x: 150, y: 470, width: 120, height: 20, type: 'normal' },
      { x: 400, y: 400, width: 120, height: 20, type: 'normal' },
      { x: 700, y: 400, width: 120, height: 20, type: 'normal' },
      { x: 950, y: 470, width: 120, height: 20, type: 'normal' },
      { x: 550, y: 300, width: 180, height: 20, type: 'normal' }
    ],
    spikes: [
      { x: 300, y: 540, width: 60, height: 10 },
      { x: 600, y: 540, width: 80, height: 10 },
      { x: 850, y: 540, width: 60, height: 10 }
    ],
    buttons: [
      { id: 'btn1', x: 420, y: 380, width: 60, height: 20, requiresSimultaneous: ['btn2'], triggerWindowMs: 500 },
      { id: 'btn2', x: 720, y: 380, width: 60, height: 20, requiresSimultaneous: ['btn1'], triggerWindowMs: 500 }
    ],
    doors: [
      { id: 'door1', x: 1150, y: 430, width: 30, height: 120, triggeredBy: ['btn1', 'btn2'], requiresAll: true }
    ],
    goal: { x: 1210, y: 490, width: 50, height: 60 },
    ghostColors: [0x00ffff, 0xffa500, 0xff00ff],
    maxRecordings: 3
  },
  {
    id: 3,
    name: '第三关：限时序列',
    description: '精确计时！必须在录制时间段内完成整条路径',
    playerStart: { x: 80, y: 500 },
    platforms: [
      { x: 0, y: 550, width: 200, height: 50, type: 'normal' },
      { x: 280, y: 500, width: 80, height: 20, type: 'normal' },
      { x: 440, y: 440, width: 80, height: 20, type: 'normal' },
      { x: 600, y: 380, width: 80, height: 20, type: 'normal' },
      { x: 760, y: 320, width: 80, height: 20, type: 'normal' },
      { x: 920, y: 380, width: 80, height: 20, type: 'normal' },
      { x: 1080, y: 450, width: 200, height: 100, type: 'normal' }
    ],
    spikes: [
      { x: 200, y: 540, width: 80, height: 10 },
      { x: 360, y: 540, width: 80, height: 10 },
      { x: 520, y: 540, width: 80, height: 10 },
      { x: 680, y: 540, width: 80, height: 10 },
      { x: 840, y: 540, width: 80, height: 10 },
      { x: 1000, y: 540, width: 80, height: 10 }
    ],
    buttons: [
      { id: 'btn1', x: 780, y: 300, width: 60, height: 20 }
    ],
    doors: [
      { id: 'door1', x: 1050, y: 330, width: 30, height: 120, triggeredBy: ['btn1'], requiresAll: true }
    ],
    goal: { x: 1200, y: 390, width: 50, height: 60 },
    timeLimit: 10000,
    ghostColors: [0x00ffff, 0xffa500],
    maxRecordings: 2
  }
];

interface ButtonRuntimeState {
  isPressed: boolean;
  lastTriggerEvents: Map<string, number>;
}

export class Level {
  public config: LevelConfig;
  public container: PIXI.Container;

  private platformGraphics: PIXI.Graphics;
  private spikeGraphics: PIXI.Graphics;
  private buttonGraphics: Map<string, PIXI.Graphics> = new Map();
  private doorGraphics: Map<string, PIXI.Graphics> = new Map();
  private goalGraphic: PIXI.Graphics;

  private buttonStates: Map<string, ButtonRuntimeState> = new Map();
  private doorStates: Map<string, boolean> = new Map();

  private readonly DEFAULT_TRIGGER_WINDOW = 500;

  constructor(config: LevelConfig) {
    this.config = config;
    this.container = new PIXI.Container();

    this.platformGraphics = new PIXI.Graphics();
    this.spikeGraphics = new PIXI.Graphics();
    this.goalGraphic = new PIXI.Graphics();

    this.container.addChild(this.platformGraphics);
    this.container.addChild(this.spikeGraphics);

    for (const button of config.buttons) {
      const g = new PIXI.Graphics();
      this.buttonGraphics.set(button.id, g);
      this.container.addChild(g);
      this.buttonStates.set(button.id, {
        isPressed: false,
        lastTriggerEvents: new Map()
      });
    }

    for (const door of config.doors) {
      const g = new PIXI.Graphics();
      this.doorGraphics.set(door.id, g);
      this.container.addChild(g);
      this.doorStates.set(door.id, false);
    }

    this.container.addChild(this.goalGraphic);

    this.draw();
  }

  private draw(): void {
    this.platformGraphics.clear();
    for (const platform of this.config.platforms) {
      this.drawPlatform(platform);
    }

    this.spikeGraphics.clear();
    for (const spike of this.config.spikes) {
      this.drawSpike(spike);
    }

    for (const button of this.config.buttons) {
      this.drawButton(button, false);
    }

    for (const door of this.config.doors) {
      this.drawDoor(door, false);
    }

    this.drawGoal();
  }

  private drawPlatform(platform: PlatformConfig): void {
    this.platformGraphics.beginFill(0x7ec8e3);
    this.platformGraphics.drawRect(platform.x, platform.y, platform.width, platform.height);
    this.platformGraphics.endFill();

    this.platformGraphics.lineStyle(2, 0x5a9bb3, 0.8);
    this.platformGraphics.drawRect(platform.x, platform.y, platform.width, platform.height);

    this.platformGraphics.beginFill(0xa5dcf5, 0.5);
    this.platformGraphics.drawRect(platform.x, platform.y, platform.width, 3);
    this.platformGraphics.endFill();
  }

  private drawSpike(spike: { x: number; y: number; width: number; height: number }): void {
    this.spikeGraphics.beginFill(0xff4444);
    const spikeCount = Math.floor(spike.width / 10);
    const spikeWidth = spike.width / spikeCount;

    for (let i = 0; i < spikeCount; i++) {
      this.spikeGraphics.moveTo(spike.x + i * spikeWidth, spike.y + spike.height);
      this.spikeGraphics.lineTo(spike.x + i * spikeWidth + spikeWidth / 2, spike.y);
      this.spikeGraphics.lineTo(spike.x + (i + 1) * spikeWidth, spike.y + spike.height);
    }
    this.spikeGraphics.endFill();
  }

  private drawButton(button: ButtonConfig, pressed: boolean): void {
    const g = this.buttonGraphics.get(button.id);
    if (!g) return;

    g.clear();

    const yOffset = pressed ? 8 : 0;

    g.beginFill(0x444466);
    g.drawRect(button.x - 5, button.y + 12, button.width + 10, 10);
    g.endFill();

    g.beginFill(pressed ? 0x88ff88 : 0x44aa44);
    g.drawRect(button.x, button.y + yOffset, button.width, button.height - yOffset);
    g.endFill();

    g.lineStyle(2, pressed ? 0xaaffaa : 0x66cc66);
    g.drawRect(button.x, button.y + yOffset, button.width, button.height - yOffset);
  }

  private drawDoor(door: DoorConfig, open: boolean): void {
    const g = this.doorGraphics.get(door.id);
    if (!g) return;

    g.clear();

    if (open) {
      g.beginFill(0x666688, 0.3);
      g.drawRect(door.x, door.y, door.width, 5);
      g.endFill();

      g.beginFill(0x666688, 0.3);
      g.drawRect(door.x, door.y + door.height - 5, door.width, 5);
      g.endFill();
    } else {
      g.beginFill(0x884444);
      g.drawRect(door.x, door.y, door.width, door.height);
      g.endFill();

      g.lineStyle(3, 0xaa6666);
      g.drawRect(door.x, door.y, door.width, door.height);

      g.beginFill(0xffcc00);
      g.drawCircle(door.x + door.width - 8, door.y + door.height / 2, 4);
      g.endFill();
    }
  }

  private drawGoal(): void {
    const goal = this.config.goal;
    this.goalGraphic.clear();

    this.goalGraphic.beginFill(0xffd700, 0.3);
    this.goalGraphic.drawRect(goal.x, goal.y, goal.width, goal.height);
    this.goalGraphic.endFill();

    this.goalGraphic.lineStyle(3, 0xffd700);
    this.goalGraphic.drawRect(goal.x, goal.y, goal.width, goal.height);

    this.goalGraphic.beginFill(0xffd700);
    this.goalGraphic.moveTo(goal.x + goal.width / 2, goal.y);
    this.goalGraphic.lineTo(goal.x + goal.width / 2 + 20, goal.y + 15);
    this.goalGraphic.lineTo(goal.x + goal.width / 2, goal.y + 30);
    this.goalGraphic.endFill();

    this.goalGraphic.lineStyle(2, 0x8b6914);
    this.goalGraphic.moveTo(goal.x + goal.width / 2, goal.y);
    this.goalGraphic.lineTo(goal.x + goal.width / 2, goal.y + goal.height);
  }

  public getActiveDoors(): Rect[] {
    const activeDoors: Rect[] = [];
    for (const door of this.config.doors) {
      if (!this.doorStates.get(door.id)) {
        activeDoors.push({ x: door.x, y: door.y, width: door.width, height: door.height });
      }
    }
    return activeDoors;
  }

  public checkButtonPresses(
    playerRect: Rect,
    ghostRects: Map<string, Rect>,
    currentTime: number,
    segments: RecordingSegment[]
  ): void {
    for (const button of this.config.buttons) {
      const state = this.buttonStates.get(button.id)!;

      if (this.rectOverlap(playerRect, button)) {
        state.lastTriggerEvents.set('player', currentTime);
      }

      for (const [ghostId, ghostRect] of ghostRects) {
        const segment = segments.find(s => s.id === ghostId);
        if (!segment) continue;

        if (this.rectOverlap(ghostRect, button)) {
          state.lastTriggerEvents.set(ghostId, currentTime);
        }
      }
    }

    this.updateDoorStates(currentTime, segments);
  }

  private getGhostLocalTime(
    ghostId: string,
    globalTime: number,
    segments: RecordingSegment[]
  ): { localTime: number; offset: number; duration: number } | null {
    const segment = segments.find(s => s.id === ghostId);
    if (!segment) return null;

    const duration = Math.max(1, segment.endTime - segment.startTime);
    let localTime = globalTime - segment.startTime;

    if (segment.loop) {
      localTime = ((localTime % duration) + duration) % duration;
    } else {
      localTime = Math.max(0, Math.min(localTime, duration));
    }

    return {
      localTime,
      offset: segment.startTime,
      duration
    };
  }

  private isTriggerActive(
    sourceId: string,
    triggerTime: number,
    checkTime: number,
    triggerWindow: number,
    segments: RecordingSegment[]
  ): boolean {
    if (sourceId === 'player') {
      return Math.abs(checkTime - triggerTime) <= triggerWindow;
    }

    const triggerInfo = this.getGhostLocalTime(sourceId, triggerTime, segments);
    const checkInfo = this.getGhostLocalTime(sourceId, checkTime, segments);

    if (!triggerInfo || !checkInfo) {
      return Math.abs(checkTime - triggerTime) <= triggerWindow;
    }

    const timeDiff = Math.abs(checkInfo.localTime - triggerInfo.localTime);
    const wrappedDiff = triggerInfo.duration - timeDiff;
    const minDiff = Math.min(timeDiff, wrappedDiff);

    return minDiff <= triggerWindow;
  }

  private hasAnyActiveTrigger(
    buttonId: string,
    currentTime: number,
    triggerWindow: number,
    segments: RecordingSegment[],
    excludePlayer: boolean = false
  ): { hasTrigger: boolean; activeSource: string | null } {
    const state = this.buttonStates.get(buttonId);
    if (!state) return { hasTrigger: false, activeSource: null };

    for (const [sourceId, triggerTime] of state.lastTriggerEvents) {
      if (excludePlayer && sourceId === 'player') continue;

      if (this.isTriggerActive(sourceId, triggerTime, currentTime, triggerWindow, segments)) {
        return { hasTrigger: true, activeSource: sourceId };
      }
    }

    return { hasTrigger: false, activeSource: null };
  }

  private findAlignedTriggerTime(
    buttonId: string,
    targetSourceId: string,
    targetTriggerTime: number,
    _currentTime: number,
    triggerWindow: number,
    segments: RecordingSegment[]
  ): number | null {
    const state = this.buttonStates.get(buttonId);
    if (!state) return null;

    let bestMatch: number | null = null;
    let bestDiff = Infinity;

    for (const [sourceId, triggerTime] of state.lastTriggerEvents) {
      if (sourceId === targetSourceId) continue;

      if (targetSourceId === 'player' || sourceId === 'player') {
        const diff = Math.abs(triggerTime - targetTriggerTime);
        if (diff <= triggerWindow && diff < bestDiff) {
          bestDiff = diff;
          bestMatch = triggerTime;
        }
      } else {
        const targetInfo = this.getGhostLocalTime(targetSourceId, targetTriggerTime, segments);
        const sourceInfo = this.getGhostLocalTime(sourceId, triggerTime, segments);

        if (targetInfo && sourceInfo) {
          const timeDiff = Math.abs(sourceInfo.localTime - targetInfo.localTime);
          const wrappedDiff = Math.min(sourceInfo.duration, targetInfo.duration) - timeDiff;
          const minDiff = Math.min(timeDiff, wrappedDiff);

          if (minDiff <= triggerWindow && minDiff < bestDiff) {
            bestDiff = minDiff;
            bestMatch = triggerTime;
          }
        }
      }
    }

    return bestMatch;
  }

  private isButtonPressed(
    buttonId: string,
    currentTime: number,
    segments: RecordingSegment[]
  ): boolean {
    const button = this.config.buttons.find(b => b.id === buttonId);
    const state = this.buttonStates.get(buttonId);
    if (!button || !state) return false;

    const triggerWindow = button.triggerWindowMs || this.DEFAULT_TRIGGER_WINDOW;

    if (!button.requiresSimultaneous || button.requiresSimultaneous.length === 0) {
      const result = this.hasAnyActiveTrigger(buttonId, currentTime, triggerWindow, segments);
      return result.hasTrigger;
    }

    const selfResult = this.hasAnyActiveTrigger(buttonId, currentTime, triggerWindow, segments);
    if (!selfResult.hasTrigger || !selfResult.activeSource) return false;

    const selfState = state.lastTriggerEvents.get(selfResult.activeSource);
    if (selfState === undefined) return false;

    for (const requiredId of button.requiresSimultaneous) {
      const alignedTime = this.findAlignedTriggerTime(
        requiredId,
        selfResult.activeSource,
        selfState,
        currentTime,
        triggerWindow,
        segments
      );

      if (alignedTime === null) {
        return false;
      }
    }

    return true;
  }

  private updateDoorStates(currentTime: number, segments: RecordingSegment[]): void {
    for (const door of this.config.doors) {
      let shouldOpen: boolean;

      if (door.requiresAll) {
        shouldOpen = door.triggeredBy.every(btnId => this.isButtonPressed(btnId, currentTime, segments));
      } else {
        shouldOpen = door.triggeredBy.some(btnId => this.isButtonPressed(btnId, currentTime, segments));
      }

      const wasOpen = this.doorStates.get(door.id);
      if (wasOpen !== shouldOpen) {
        this.doorStates.set(door.id, shouldOpen);
        this.drawDoor(door, shouldOpen);
      }
    }

    for (const button of this.config.buttons) {
      const isPressed = this.isButtonPressed(button.id, currentTime, segments);
      const state = this.buttonStates.get(button.id)!;
      if (state.isPressed !== isPressed) {
        state.isPressed = isPressed;
        this.drawButton(button, isPressed);
      }
    }
  }

  private rectOverlap(a: Rect, b: { x: number; y: number; width: number; height: number }): boolean {
    return (
      a.x < b.x + b.width &&
      a.x + a.width > b.x &&
      a.y < b.y + b.height &&
      a.y + a.height > b.y
    );
  }

  public checkSpikeCollision(rect: Rect): boolean {
    for (const spike of this.config.spikes) {
      if (this.rectOverlap(rect, spike)) {
        return true;
      }
    }
    return false;
  }

  public checkGoalReached(rect: Rect): boolean {
    return this.rectOverlap(rect, this.config.goal);
  }

  public reset(): void {
    for (const button of this.config.buttons) {
      const state = this.buttonStates.get(button.id)!;
      state.isPressed = false;
      state.lastTriggerEvents.clear();
      this.drawButton(button, false);
    }

    for (const door of this.config.doors) {
      this.doorStates.set(door.id, false);
      this.drawDoor(door, false);
    }
  }

  public getButtonEventsAtTime(currentTime: number): ButtonTriggerEvent[] {
    const events: ButtonTriggerEvent[] = [];
    const triggerWindow = this.DEFAULT_TRIGGER_WINDOW;

    for (const button of this.config.buttons) {
      const state = this.buttonStates.get(button.id)!;
      for (const [sourceId, triggerTime] of state.lastTriggerEvents) {
        if (Math.abs(currentTime - triggerTime) <= triggerWindow) {
          events.push({
            buttonId: button.id,
            triggerTime,
            sourceType: sourceId === 'player' ? 'player' : 'ghost',
            sourceId
          });
        }
      }
    }

    return events;
  }

  public isDoorOpen(doorId: string): boolean {
    return this.doorStates.get(doorId) || false;
  }

  public getPlatforms(): PlatformConfig[] {
    return this.config.platforms;
  }

  public destroy(): void {
    this.platformGraphics.destroy();
    this.spikeGraphics.destroy();
    this.goalGraphic.destroy();
    for (const g of this.buttonGraphics.values()) g.destroy();
    for (const g of this.doorGraphics.values()) g.destroy();
    this.container.destroy();
  }
}
