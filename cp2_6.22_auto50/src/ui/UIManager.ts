import * as PIXI from 'pixi.js';
import type { RecordingSegment, GameStats, GameMode } from '../../types';

type UIButtonCallback = () => void;

interface UIButton {
  container: PIXI.Container;
  background: PIXI.Graphics;
  label: PIXI.Text;
  callback: UIButtonCallback;
  isHovered: boolean;
  isPressed: boolean;
  isDisabled: boolean;
  normalColor: number;
  hoverColor: number;
  activeColor: number;
  disabledColor: number;
  glowColor: number;
  pulseActive: boolean;
  pulsePhase: number;
}

export class UIManager {
  public container: PIXI.Container;
  private app: PIXI.Application;

  private hudContainer: PIXI.Container;
  private controlsContainer: PIXI.Container;
  private timelineContainer: PIXI.Container;
  private levelSelectContainer: PIXI.Container;
  private transitionOverlay: PIXI.Graphics;
  private historyContainer: PIXI.Container;

  private buttons: Map<string, UIButton> = new Map();
  private segments: RecordingSegment[] = [];

  private timelineWidth: number = 900;
  private timelineHeight: number = 60;
  private timelineX: number = 0;
  private timelineY: number = 0;
  private currentTime: number = 0;
  private maxDuration: number = 0;
  private timeScale: number = 1;
  private highlightedSegmentId: string | null = null;
  private isDraggingSlider: boolean = false;

  private timelineGraphics: PIXI.Graphics;
  private timelineSegmentsGraphics: PIXI.Graphics;
  private sliderGraphics: PIXI.Graphics;
  private sliderHandle: PIXI.Graphics;
  private scaleSliderGraphics: PIXI.Graphics;
  private scaleSliderHandle: PIXI.Graphics;
  private isDraggingScaleSlider: boolean = false;

  private hudLevelText: PIXI.Text;
  private hudStepsText: PIXI.Text;
  private hudTimeText: PIXI.Text;
  private hudMemoryText: PIXI.Text;
  private hintText: PIXI.Text;

  private stats: GameStats = { steps: 0, timeElapsed: 0, recordingsCount: 0, score: 0 };
  private gameMode: GameMode = 'playing';

  private historyItems: PIXI.Container[] = [];
  private readonly MAX_HISTORY_ITEMS = 10;

  public onRecordToggle: UIButtonCallback | null = null;
  public onPlayToggle: UIButtonCallback | null = null;
  public onRewindToggle: UIButtonCallback | null = null;
  public onPauseToggle: UIButtonCallback | null = null;
  public onStop: UIButtonCallback | null = null;
  public onClear: UIButtonCallback | null = null;
  public onUndo: UIButtonCallback | null = null;
  public onRedo: UIButtonCallback | null = null;
  public onTimeChange: ((time: number) => void) | null = null;
  public onScaleChange: ((scale: number) => void) | null = null;
  public onLevelSelect: ((levelIndex: number) => void) | null = null;
  public onDeleteSegment: ((segmentId: string) => void) | null = null;

  constructor(app: PIXI.Application) {
    this.app = app;
    this.container = new PIXI.Container();

    this.transitionOverlay = new PIXI.Graphics();
    this.transitionOverlay.beginFill(0x0a0a2e, 1);
    this.transitionOverlay.drawRect(0, 0, app.screen.width, app.screen.height);
    this.transitionOverlay.endFill();
    this.transitionOverlay.alpha = 0;
    this.container.addChild(this.transitionOverlay);

    this.hudContainer = new PIXI.Container();
    this.controlsContainer = new PIXI.Container();
    this.timelineContainer = new PIXI.Container();
    this.levelSelectContainer = new PIXI.Container();
    this.historyContainer = new PIXI.Container();

    this.container.addChild(this.hudContainer);
    this.container.addChild(this.historyContainer);
    this.container.addChild(this.controlsContainer);
    this.container.addChild(this.timelineContainer);
    this.container.addChild(this.levelSelectContainer);

    this.timelineGraphics = new PIXI.Graphics();
    this.timelineSegmentsGraphics = new PIXI.Graphics();
    this.sliderGraphics = new PIXI.Graphics();
    this.sliderHandle = new PIXI.Graphics();
    this.scaleSliderGraphics = new PIXI.Graphics();
    this.scaleSliderHandle = new PIXI.Graphics();

    this.hudLevelText = this.createText('', 10, 10, 14, 0xffffff);
    this.hudStepsText = this.createText('', 10, 35, 12, 0x7ec8e3);
    this.hudTimeText = this.createText('', 10, 55, 12, 0x7ec8e3);
    this.hudMemoryText = this.createText('', 10, 75, 10, 0x888888);
    this.hintText = this.createText('', app.screen.width / 2, 100, 14, 0xffff00, true);
    this.hintText.anchor.set(0.5, 0);

    this.hudContainer.addChild(this.hudLevelText);
    this.hudContainer.addChild(this.hudStepsText);
    this.hudContainer.addChild(this.hudTimeText);
    this.hudContainer.addChild(this.hudMemoryText);
    this.hudContainer.addChild(this.hintText);

    this.createControls();
    this.createTimeline();
    this.setupEventListeners();

    this.levelSelectContainer.visible = false;
  }

  private createText(text: string, x: number, y: number, size: number, color: number, centered: boolean = false): PIXI.Text {
    const t = new PIXI.Text(text, {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: size,
      fill: color,
      align: centered ? 'center' : 'left'
    });
    t.x = x;
    t.y = y;
    return t;
  }

  private createButton(
    id: string,
    x: number,
    y: number,
    width: number,
    height: number,
    label: string,
    callback: UIButtonCallback,
    options?: {
      normalColor?: number;
      hoverColor?: number;
      activeColor?: number;
      disabledColor?: number;
      glowColor?: number;
      fontSize?: number;
    }
  ): UIButton {
    const container = new PIXI.Container();
    container.x = x;
    container.y = y;

    const background = new PIXI.Graphics();
    const text = this.createText(label, width / 2, height / 2, options?.fontSize || 12, 0xffffff, true);
    text.anchor.set(0.5, 0.5);

    container.addChild(background);
    container.addChild(text);

    const button: UIButton = {
      container,
      background,
      label: text,
      callback,
      isHovered: false,
      isPressed: false,
      isDisabled: false,
      normalColor: options?.normalColor ?? 0x3a3a5e,
      hoverColor: options?.hoverColor ?? 0x4a4a7e,
      activeColor: options?.activeColor ?? 0x5a5a9e,
      disabledColor: options?.disabledColor ?? 0x2a2a3e,
      glowColor: options?.glowColor ?? 0x7ec8e3,
      pulseActive: false,
      pulsePhase: 0
    };

    this.buttons.set(id, button);
    this.controlsContainer.addChild(container);
    this.drawButton(id, button);

    container.eventMode = 'static';
    container.cursor = 'pointer';

    return button;
  }

  private drawButton(id: string, button: UIButton): void {
    const { background, container } = button;
    const width = container.width || 80;
    const height = container.height || 40;

    background.clear();

    let color = button.normalColor;
    let alpha = 1;
    let scale = 1;

    if (button.isDisabled) {
      color = button.disabledColor;
      alpha = 0.5;
    } else if (button.isPressed) {
      color = button.activeColor;
      scale = 0.95;
    } else if (button.isHovered) {
      color = button.hoverColor;
    }

    if (button.pulseActive) {
      scale = 1 + Math.sin(button.pulsePhase) * 0.1;
    }

    container.scale.set(scale);

    const radius = 8;
    const glowIntensity = button.isDisabled ? 0 : (button.isHovered || button.pulseActive ? 0.8 : 0.3);

    background.lineStyle(2, button.glowColor, glowIntensity);
    background.beginFill(color, alpha);
    background.drawRoundedRect(0, 0, width, height, radius);
    background.endFill();

    background.lineStyle(1, button.glowColor, glowIntensity * 0.5);
    background.drawRoundedRect(-2, -2, width + 4, height + 4, radius + 2);
  }

  private createControls(): void {
    const startX = this.app.screen.width / 2 - 250;
    const y = this.app.screen.height - 140;
    const buttonWidth = 70;
    const buttonHeight = 40;
    const gap = 10;

    this.createButton('record', startX, y, buttonWidth, buttonHeight, 'REC', () => {
      this.onRecordToggle?.();
    }, {
      normalColor: 0x8b0000,
      hoverColor: 0xaa0000,
      activeColor: 0xcc0000,
      glowColor: 0xff4444
    });

    this.createButton('play', startX + (buttonWidth + gap), y, buttonWidth, buttonHeight, 'PLAY', () => {
      this.onPlayToggle?.();
    }, {
      normalColor: 0x006400,
      hoverColor: 0x008000,
      activeColor: 0x00aa00,
      glowColor: 0x44ff44
    });

    this.createButton('rewind', startX + (buttonWidth + gap) * 2, y, buttonWidth, buttonHeight, 'RWD', () => {
      this.onRewindToggle?.();
    });

    this.createButton('pause', startX + (buttonWidth + gap) * 3, y, buttonWidth, buttonHeight, 'PAUSE', () => {
      this.onPauseToggle?.();
    });

    this.createButton('stop', startX + (buttonWidth + gap) * 4, y, buttonWidth, buttonHeight, 'STOP', () => {
      this.onStop?.();
    });

    this.createButton('undo', startX + (buttonWidth + gap) * 5 + 20, y, buttonWidth, buttonHeight, 'UNDO', () => {
      this.onUndo?.();
    });

    this.createButton('redo', startX + (buttonWidth + gap) * 6 + 20, y, buttonWidth, buttonHeight, 'REDO', () => {
      this.onRedo?.();
    });

    this.createButton('clear', startX + (buttonWidth + gap) * 7 + 20, y, buttonWidth, buttonHeight, 'CLR', () => {
      this.onClear?.();
    }, {
      normalColor: 0x4a2a2a,
      hoverColor: 0x6a3a3a,
      activeColor: 0x8a4a4a,
      glowColor: 0xff8888
    });
  }

  private createTimeline(): void {
    this.timelineWidth = Math.min(900, this.app.screen.width - 200);
    this.timelineX = (this.app.screen.width - this.timelineWidth) / 2;
    this.timelineY = this.app.screen.height - 80;

    this.timelineContainer.x = this.timelineX;
    this.timelineContainer.y = this.timelineY;

    this.timelineGraphics.eventMode = 'static';
    this.timelineGraphics.cursor = 'pointer';

    this.timelineContainer.addChild(this.timelineGraphics);
    this.timelineContainer.addChild(this.timelineSegmentsGraphics);
    this.timelineContainer.addChild(this.sliderGraphics);
    this.timelineContainer.addChild(this.sliderHandle);

    const scaleLabel = this.createText('缩放:', -80, 30, 10, 0xaaaaaa);
    this.timelineContainer.addChild(scaleLabel);

    this.scaleSliderGraphics.x = -80;
    this.scaleSliderGraphics.y = 45;
    this.scaleSliderGraphics.eventMode = 'static';
    this.scaleSliderGraphics.cursor = 'pointer';
    this.timelineContainer.addChild(this.scaleSliderGraphics);
    this.timelineContainer.addChild(this.scaleSliderHandle);

    this.drawTimeline();
  }

  private drawTimeline(): void {
    this.timelineGraphics.clear();
    this.timelineSegmentsGraphics.clear();
    this.sliderGraphics.clear();
    this.sliderHandle.clear();
    this.scaleSliderGraphics.clear();
    this.scaleSliderHandle.clear();

    const timelineBgRadius = 6;
    this.timelineGraphics.lineStyle(2, 0x4a4a6e, 0.8);
    this.timelineGraphics.beginFill(0x1a1a3e, 0.9);
    this.timelineGraphics.drawRoundedRect(0, 0, this.timelineWidth, this.timelineHeight, timelineBgRadius);
    this.timelineGraphics.endFill();

    this.timelineGraphics.lineStyle(1, 0x3a3a5e, 0.5);
    for (let i = 0; i <= 10; i++) {
      const x = (i / 10) * this.timelineWidth;
      this.timelineGraphics.moveTo(x, 5);
      this.timelineGraphics.lineTo(x, this.timelineHeight - 5);
    }

    this.drawTimelineSegments();

    const sliderX = this.maxDuration > 0 ? (this.currentTime / this.maxDuration) * this.timelineWidth : 0;

    this.sliderGraphics.lineStyle(2, 0x39ff14, 0.8);
    this.sliderGraphics.moveTo(sliderX, -5);
    this.sliderGraphics.lineTo(sliderX, this.timelineHeight + 5);

    this.sliderHandle.beginFill(0x39ff14, 1);
    this.sliderHandle.drawCircle(sliderX, this.timelineHeight / 2, 8);
    this.sliderHandle.endFill();

    this.sliderHandle.lineStyle(2, 0x7fffa0, 1);
    this.sliderHandle.beginFill(0x39ff14, 1);
    this.sliderHandle.drawCircle(sliderX, this.timelineHeight / 2, 8);
    this.sliderHandle.endFill();

    const scaleSliderWidth = 60;
    this.scaleSliderGraphics.lineStyle(1, 0x4a4a6e, 0.8);
    this.scaleSliderGraphics.beginFill(0x1a1a3e, 0.9);
    this.scaleSliderGraphics.drawRoundedRect(0, 0, scaleSliderWidth, 8, 4);
    this.scaleSliderGraphics.endFill();

    const scaleX = ((this.timeScale - 0.1) / 9.9) * scaleSliderWidth;
    this.scaleSliderHandle.x = -80;
    this.scaleSliderHandle.y = 45;
    this.scaleSliderHandle.beginFill(0x7ec8e3, 1);
    this.scaleSliderHandle.drawCircle(scaleX, 4, 6);
    this.scaleSliderHandle.endFill();
  }

  private drawTimelineSegments(): void {
    this.timelineSegmentsGraphics.clear();

    if (this.maxDuration <= 0) return;

    for (let i = 0; i < this.segments.length; i++) {
      const segment = this.segments[i];
      const startX = (segment.startTime / this.maxDuration) * this.timelineWidth;
      const endX = (segment.endTime / this.maxDuration) * this.timelineWidth;
      const segmentWidth = Math.max(endX - startX, 4);

      const isHighlighted = this.highlightedSegmentId === segment.id;

      this.timelineSegmentsGraphics.beginFill(segment.color, isHighlighted ? 0.9 : 0.6);
      this.timelineSegmentsGraphics.drawRoundedRect(
        startX,
        isHighlighted ? 5 : 8,
        segmentWidth,
        isHighlighted ? this.timelineHeight - 10 : this.timelineHeight - 16,
        3
      );
      this.timelineSegmentsGraphics.endFill();

      if (i > 0) {
        this.timelineSegmentsGraphics.lineStyle(2, 0xffffff, 0.6);
        this.timelineSegmentsGraphics.moveTo(startX, 3);
        this.timelineSegmentsGraphics.lineTo(startX, this.timelineHeight - 3);
      }

      if (segmentWidth > 40) {
        const labelText = `#${i + 1}`;
        const label = new PIXI.Text(labelText, {
          fontFamily: '"Press Start 2P", monospace',
          fontSize: 8,
          fill: 0xffffff
        });
        label.x = startX + segmentWidth / 2 - label.width / 2;
        label.y = this.timelineHeight / 2 - label.height / 2;
        this.timelineSegmentsGraphics.addChild(label);
      }
    }

    if (this.segments.length > 0) {
      const lastSegment = this.segments[this.segments.length - 1];
      const endX = (lastSegment.endTime / this.maxDuration) * this.timelineWidth;
      this.timelineSegmentsGraphics.lineStyle(2, 0xff4444, 0.8);
      this.timelineSegmentsGraphics.moveTo(endX, 3);
      this.timelineSegmentsGraphics.lineTo(endX, this.timelineHeight - 3);
    }
  }

  private setupEventListeners(): void {
    for (const [id, button] of this.buttons) {
      button.container.on('pointerenter', () => {
        if (!button.isDisabled) {
          button.isHovered = true;
          this.drawButton(id, button);
        }
      });

      button.container.on('pointerleave', () => {
        button.isHovered = false;
        button.isPressed = false;
        this.drawButton(id, button);
      });

      button.container.on('pointerdown', () => {
        if (!button.isDisabled) {
          button.isPressed = true;
          this.drawButton(id, button);
        }
      });

      button.container.on('pointerup', () => {
        if (!button.isDisabled) {
          button.isPressed = false;
          this.drawButton(id, button);
          button.callback();
        }
      });

      button.container.on('pointerupoutside', () => {
        button.isPressed = false;
        this.drawButton(id, button);
      });
    }

    this.timelineGraphics.on('pointerdown', (e: PIXI.FederatedPointerEvent) => {
      this.isDraggingSlider = true;
      this.handleTimelineClick(e);
    });

    this.sliderHandle.eventMode = 'static';
    this.sliderHandle.cursor = 'grab';
    this.sliderHandle.on('pointerdown', () => {
      this.isDraggingSlider = true;
    });

    this.app.stage.eventMode = 'static';
    this.app.stage.on('pointermove', (e: PIXI.FederatedPointerEvent) => {
      if (this.isDraggingSlider) {
        this.handleTimelineDrag(e);
      }
      if (this.isDraggingScaleSlider) {
        this.handleScaleDrag(e);
      }
    });

    this.app.stage.on('pointerup', () => {
      this.isDraggingSlider = false;
      this.isDraggingScaleSlider = false;
    });

    this.scaleSliderGraphics.on('pointerdown', (e: PIXI.FederatedPointerEvent) => {
      this.isDraggingScaleSlider = true;
      this.handleScaleDrag(e);
    });

    this.scaleSliderHandle.eventMode = 'static';
    this.scaleSliderHandle.cursor = 'grab';
    this.scaleSliderHandle.on('pointerdown', () => {
      this.isDraggingScaleSlider = true;
    });
  }

  private handleTimelineClick(e: PIXI.FederatedPointerEvent): void {
    const localPos = e.global;
    const x = localPos.x - this.timelineX;
    const ratio = Math.max(0, Math.min(1, x / this.timelineWidth));
    const newTime = ratio * this.maxDuration;
    this.currentTime = newTime;
    this.drawTimeline();
    this.onTimeChange?.(newTime);
  }

  private handleTimelineDrag(e: PIXI.FederatedPointerEvent): void {
    const localPos = e.global;
    const x = localPos.x - this.timelineX;
    const ratio = Math.max(0, Math.min(1, x / this.timelineWidth));
    const newTime = ratio * this.maxDuration;
    this.currentTime = newTime;

    this.updateHighlightedSegment(newTime);
    this.drawTimeline();
    this.onTimeChange?.(newTime);
  }

  private handleScaleDrag(e: PIXI.FederatedPointerEvent): void {
    const scaleSliderWidth = 60;
    const localX = e.global.x - this.timelineX + 80;
    const ratio = Math.max(0, Math.min(1, localX / scaleSliderWidth));
    const newScale = 0.1 + ratio * 9.9;
    this.timeScale = newScale;
    this.drawTimeline();
    this.onScaleChange?.(newScale);
  }

  private updateHighlightedSegment(time: number): void {
    let foundId: string | null = null;
    for (const segment of this.segments) {
      if (time >= segment.startTime && time <= segment.endTime) {
        foundId = segment.id;
        break;
      }
    }
    if (foundId !== this.highlightedSegmentId) {
      this.highlightedSegmentId = foundId;
    }
  }

  public setSegments(segments: RecordingSegment[]): void {
    this.segments = [...segments];
    this.updateHighlightedSegment(this.currentTime);
    this.drawTimeline();
  }

  public setCurrentTime(time: number): void {
    this.currentTime = time;
    this.updateHighlightedSegment(time);
    this.drawTimeline();
  }

  public setMaxDuration(duration: number): void {
    this.maxDuration = duration;
    this.drawTimeline();
  }

  public setTimeScale(scale: number): void {
    this.timeScale = scale;
    this.drawTimeline();
  }

  public setGameMode(mode: GameMode): void {
    this.gameMode = mode;

    const recordBtn = this.buttons.get('record');
    if (recordBtn) {
      recordBtn.pulseActive = mode === 'recording';
      this.drawButton('record', recordBtn);
    }

    this.updateButtonStates();
  }

  public updateButtonStates(): void {
    const hasSegments = this.segments.length > 0;

    this.setButtonEnabled('play', hasSegments && this.gameMode !== 'recording');
    this.setButtonEnabled('rewind', hasSegments && this.gameMode !== 'recording');
    this.setButtonEnabled('pause', (this.gameMode === 'playback' || this.gameMode === 'rewinding') && !this.buttons.get('pause')?.isPressed);
    this.setButtonEnabled('stop', hasSegments || this.gameMode === 'recording');
    this.setButtonEnabled('clear', hasSegments || this.gameMode === 'recording');
  }

  public setButtonEnabled(id: string, enabled: boolean): void {
    const button = this.buttons.get(id);
    if (button) {
      button.isDisabled = !enabled;
      button.container.eventMode = enabled ? 'static' : 'none';
      button.container.cursor = enabled ? 'pointer' : 'default';
      this.drawButton(id, button);
    }
  }

  public setButtonLabel(id: string, label: string): void {
    const button = this.buttons.get(id);
    if (button) {
      button.label.text = label;
    }
  }

  public updateStats(stats: Partial<GameStats>): void {
    this.stats = { ...this.stats, ...stats };
    this.hudStepsText.text = `步数: ${this.stats.steps}`;
    this.hudTimeText.text = `时间: ${(this.stats.timeElapsed / 1000).toFixed(1)}s`;
    this.hudMemoryText.text = `录制: ${this.stats.recordingsCount}段`;
  }

  public setLevelName(name: string): void {
    this.hudLevelText.text = name;
  }

  public setHint(text: string, duration: number = 3000): void {
    this.hintText.text = text;
    this.hintText.alpha = 1;
    if (duration > 0) {
      setTimeout(() => {
        this.hintText.alpha = 0;
      }, duration);
    }
  }

  public showLevelSelect(levels: { id: number; name: string; description: string }[]): void {
    this.levelSelectContainer.removeChildren();
    this.levelSelectContainer.visible = true;

    const bg = new PIXI.Graphics();
    bg.beginFill(0x0a0a2e, 0.95);
    bg.drawRect(0, 0, this.app.screen.width, this.app.screen.height);
    bg.endFill();
    this.levelSelectContainer.addChild(bg);

    const title = this.createText('选择关卡', this.app.screen.width / 2, 80, 24, 0x7ec8e3, true);
    title.anchor.set(0.5, 0);
    this.levelSelectContainer.addChild(title);

    const cardWidth = 300;
    const cardHeight = 180;
    const gap = 40;
    const startX = (this.app.screen.width - (cardWidth * levels.length + gap * (levels.length - 1))) / 2;

    for (let i = 0; i < levels.length; i++) {
      const card = new PIXI.Container();
      card.x = startX + i * (cardWidth + gap);
      card.y = 180;
      card.eventMode = 'static';
      card.cursor = 'pointer';

      const cardBg = new PIXI.Graphics();
      cardBg.lineStyle(2, 0x7ec8e3, 0.6);
      cardBg.beginFill(0x1a1a4e, 0.9);
      cardBg.drawRoundedRect(0, 0, cardWidth, cardHeight, 12);
      cardBg.endFill();
      card.addChild(cardBg);

      const levelNum = this.createText(`第${levels[i].id}关`, cardWidth / 2, 20, 16, 0xffd700, true);
      levelNum.anchor.set(0.5, 0);
      card.addChild(levelNum);

      const levelName = this.createText(levels[i].name, cardWidth / 2, 50, 12, 0xffffff, true);
      levelName.anchor.set(0.5, 0);
      card.addChild(levelName);

      const desc = this.createText(levels[i].description, cardWidth / 2, 85, 10, 0xaaaaaa, true);
      desc.anchor.set(0.5, 0);
      desc.style.wordWrap = true;
      desc.style.wordWrapWidth = cardWidth - 40;
      card.addChild(desc);

      card.on('pointerenter', () => {
        cardBg.clear();
        cardBg.lineStyle(3, 0x39ff14, 1);
        cardBg.beginFill(0x2a2a6e, 0.95);
        cardBg.drawRoundedRect(0, 0, cardWidth, cardHeight, 12);
        cardBg.endFill();
      });

      card.on('pointerleave', () => {
        cardBg.clear();
        cardBg.lineStyle(2, 0x7ec8e3, 0.6);
        cardBg.beginFill(0x1a1a4e, 0.9);
        cardBg.drawRoundedRect(0, 0, cardWidth, cardHeight, 12);
        cardBg.endFill();
      });

      const levelIndex = i;
      card.on('pointerup', () => {
        this.levelSelectContainer.visible = false;
        this.onLevelSelect?.(levelIndex);
      });

      this.levelSelectContainer.addChild(card);
    }
  }

  public showTransition(callback: () => void, fadeIn: boolean = true): void {
    const duration = 500;
    const startTime = Date.now();
    const startAlpha = fadeIn ? 0 : 1;
    const endAlpha = fadeIn ? 1 : 0;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(1, elapsed / duration);
      this.transitionOverlay.alpha = startAlpha + (endAlpha - startAlpha) * progress;

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        if (fadeIn) {
          callback();
          this.showTransition(() => {}, false);
        } else {
          callback();
        }
      }
    };
    animate();
  }

  public addHistoryItem(thumbnailData?: string): void {
    const item = new PIXI.Container();
    const itemWidth = 80;
    const itemHeight = 60;

    item.x = 10;
    item.y = 110 + this.historyItems.length * (itemHeight + 8);

    const bg = new PIXI.Graphics();
    bg.lineStyle(1, 0x4a4a6e, 0.6);
    bg.beginFill(0x1a1a3e, 0.8);
    bg.drawRoundedRect(0, 0, itemWidth, itemHeight, 4);
    bg.endFill();
    item.addChild(bg);

    const label = this.createText(`#${this.historyItems.length + 1}`, itemWidth / 2, itemHeight / 2 - 5, 10, 0x7ec8e3, true);
    label.anchor.set(0.5, 0);
    item.addChild(label);

    const timeLabel = this.createText(new Date().toLocaleTimeString(), itemWidth / 2, itemHeight - 18, 7, 0x888888, true);
    timeLabel.anchor.set(0.5, 0);
    item.addChild(timeLabel);

    this.historyItems.unshift(item);
    this.historyContainer.addChild(item);

    while (this.historyItems.length > this.MAX_HISTORY_ITEMS) {
      const removed = this.historyItems.pop()!;
      this.historyContainer.removeChild(removed);
    }

    for (let i = 0; i < this.historyItems.length; i++) {
      this.historyItems[i].y = 110 + i * (itemHeight + 8);
    }
  }

  public clearHistory(): void {
    for (const item of this.historyItems) {
      this.historyContainer.removeChild(item);
    }
    this.historyItems = [];
  }

  public update(deltaTime: number): void {
    for (const [id, button] of this.buttons) {
      if (button.pulseActive) {
        button.pulsePhase += deltaTime * Math.PI * 4;
        this.drawButton(id, button);
      }
    }
  }

  public destroy(): void {
    this.container.destroy();
  }
}
