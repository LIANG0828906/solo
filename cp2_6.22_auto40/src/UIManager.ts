import * as PIXI from 'pixi.js';
import { MapManager, TERRAIN_CONFIGS, Cell } from './MapManager';

export interface MinimapCallbacks {
  getPlayerGridPos: () => { x: number; y: number };
  onMinimapClick: (gx: number, gy: number) => void;
}

export class UIManager {
  private app: PIXI.Application;
  private mapManager: MapManager;
  private minimapCallbacks: MinimapCallbacks;

  private container: PIXI.Container;
  private topLeftPanel: PIXI.Container;
  private topRightPanel: PIXI.Container;
  private bottomBar: PIXI.Container;

  private exploredText: PIXI.Text;
  private progressBarBg: PIXI.Graphics;
  private progressBarFill: PIXI.Graphics;
  private treasureText: PIXI.Text;
  private instructionText: PIXI.Text;

  private toastContainer: PIXI.Container;
  private victoryOverlay: PIXI.Container | null = null;
  private victoryActive: boolean = false;

  private minimapPanel: PIXI.Container;
  private minimapBg: PIXI.Sprite | null = null;
  private minimapCanvas: PIXI.Graphics | null = null;
  private minimapPlayerDot: PIXI.Graphics | null = null;
  private minimapViewRect: PIXI.Graphics | null = null;
  private minimapTitle: PIXI.Text;
  private minimapWidth: number = 180;
  private minimapHeight: number = 210;
  private minimapCellSize: number = 5;
  private minimapInnerX: number = 15;
  private minimapInnerY: number = 32;
  private minimapDirty: boolean = true;
  private lastExploredSnapshot: boolean[][] = [];
  private lastPlayerX: number = -1;
  private lastPlayerY: number = -1;

  private audioCtx: AudioContext | null = null;
  private audioUnlocked: boolean = false;

  constructor(app: PIXI.Application, mapManager: MapManager, callbacks: MinimapCallbacks) {
    this.app = app;
    this.mapManager = mapManager;
    this.minimapCallbacks = callbacks;
    this.container = new PIXI.Container();
    app.stage.addChild(this.container);

    this.topLeftPanel = new PIXI.Container();
    this.container.addChild(this.topLeftPanel);

    this.topRightPanel = new PIXI.Container();
    this.container.addChild(this.topRightPanel);

    this.bottomBar = new PIXI.Container();
    this.container.addChild(this.bottomBar);

    this.minimapPanel = new PIXI.Container();
    this.container.addChild(this.minimapPanel);

    this.toastContainer = new PIXI.Container();
    this.container.addChild(this.toastContainer);

    this.exploredText = new PIXI.Text('', this.getTextStyle(16, 0x3d2817));
    this.progressBarBg = new PIXI.Graphics();
    this.progressBarFill = new PIXI.Graphics();
    this.treasureText = new PIXI.Text('', this.getTextStyle(16, 0x3d2817));
    this.instructionText = new PIXI.Text('', this.getTextStyle(14, 0x3d2817, 'center'));
    this.minimapTitle = new PIXI.Text('地图概览', this.getTextStyle(13, 0x5a3d1e, 'center'));

    this.buildTopLeftPanel();
    this.buildTopRightPanel();
    this.buildBottomBar();
    this.buildMinimap();
    this.resize();
    this.initAudio();
  }

  private initAudio(): void {
    try {
      this.audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (e) {
      this.audioCtx = null;
    }
  }

  public unlockAudio(): void {
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    this.audioUnlocked = true;
  }

  private getTextStyle(size: number, color: number, align: string = 'left'): PIXI.TextStyle {
    return new PIXI.TextStyle({
      fontFamily: 'Georgia, "Times New Roman", serif',
      fontSize: size,
      fontWeight: 'bold',
      fill: color,
      align: align as any,
      stroke: 0xf5deb3,
      strokeThickness: 2,
      lineJoin: 'round'
    });
  }

  private createParchmentTexture(w: number, h: number): PIXI.Texture {
    const g = new PIXI.Graphics();
    g.beginFill(0xd4b896);
    g.drawRoundedRect(0, 0, w, h, 6);
    g.endFill();
    g.beginFill(0xc9a977, 0.4);
    for (let i = 0; i < 40; i++) {
      const px = Math.random() * w;
      const py = Math.random() * h;
      const ds = Math.random() * 4 + 1;
      g.drawCircle(px, py, ds);
    }
    g.endFill();
    g.lineStyle(2, 0x8b6914, 0.8);
    g.drawRoundedRect(1, 1, w - 2, h - 2, 5);
    g.lineStyle(1, 0x5a3d1e, 0.5);
    g.drawRoundedRect(3, 3, w - 6, h - 6, 4);
    return this.app.renderer.generateTexture(g, PIXI.SCALE_MODES.LINEAR, 1, new PIXI.Rectangle(0, 0, w, h));
  }

  private buildTopLeftPanel(): void {
    const panelW = 220;
    const panelH = 58;
    const bg = new PIXI.Sprite(this.createParchmentTexture(panelW, panelH));
    this.topLeftPanel.addChild(bg);

    const label = new PIXI.Text('探索进度', this.getTextStyle(13, 0x5a3d1e));
    label.x = 12;
    label.y = 6;
    this.topLeftPanel.addChild(label);

    this.progressBarBg = new PIXI.Graphics();
    this.progressBarBg.x = 12;
    this.progressBarBg.y = 28;
    this.topLeftPanel.addChild(this.progressBarBg);

    this.progressBarFill = new PIXI.Graphics();
    this.progressBarFill.x = 12;
    this.progressBarFill.y = 28;
    this.topLeftPanel.addChild(this.progressBarFill);

    this.exploredText.x = 12;
    this.exploredText.y = 26;
    this.topLeftPanel.addChild(this.exploredText);
  }

  private buildTopRightPanel(): void {
    const panelW = 160;
    const panelH = 58;
    const bg = new PIXI.Sprite(this.createParchmentTexture(panelW, panelH));
    this.topRightPanel.addChild(bg);

    const label = new PIXI.Text('宝藏收集', this.getTextStyle(13, 0x5a3d1e));
    label.x = 12;
    label.y = 6;
    this.topRightPanel.addChild(label);

    const chestG = new PIXI.Graphics();
    chestG.lineStyle(2, 0x5a3d1e, 1);
    chestG.beginFill(0xb8860b);
    chestG.drawRoundedRect(12, 30, 22, 18, 3);
    chestG.endFill();
    chestG.beginFill(0xd4a01a);
    chestG.drawRoundedRect(14, 32, 18, 10, 2);
    chestG.endFill();
    chestG.beginFill(0xffe066);
    chestG.drawCircle(23, 39, 2.5);
    chestG.endFill();
    this.topRightPanel.addChild(chestG);

    this.treasureText.x = 44;
    this.treasureText.y = 28;
    this.topRightPanel.addChild(this.treasureText);
  }

  private buildBottomBar(): void {
    const barW = 520;
    const barH = 44;
    const bg = new PIXI.Sprite(this.createParchmentTexture(barW, barH));
    bg.alpha = 0.9;
    this.bottomBar.addChild(bg);

    this.instructionText.x = 0;
    this.instructionText.y = 12;
    this.instructionText.style.wordWrap = true;
    this.instructionText.style.wordWrapWidth = barW;
    this.bottomBar.addChild(this.instructionText);
  }

  private createWoodFrameTexture(w: number, h: number): PIXI.Texture {
    const g = new PIXI.Graphics();
    g.beginFill(0x3d2817);
    g.drawRoundedRect(0, 0, w, h, 8);
    g.endFill();
    g.beginFill(0x5c3d1e, 0.8);
    for (let i = 0; i < 30; i++) {
      const px = Math.random() * w;
      const py = Math.random() * h;
      const rw = Math.random() * 12 + 4;
      const rh = Math.random() * 2 + 0.8;
      g.drawEllipse(px, py, rw, rh);
    }
    g.endFill();
    g.lineStyle(3, 0x2a1a0e, 1);
    g.drawRoundedRect(1, 1, w - 2, h - 2, 7);
    g.lineStyle(1, 0x6b4a28, 0.9);
    g.drawRoundedRect(3, 3, w - 6, h - 6, 6);
    return this.app.renderer.generateTexture(g, PIXI.SCALE_MODES.LINEAR, 1, new PIXI.Rectangle(0, 0, w, h));
  }

  private buildMinimap(): void {
    this.minimapPanel.removeChildren();
    this.minimapWidth = Math.max(160, Math.floor(this.app.renderer.width * 0.15));
    this.minimapHeight = this.minimapWidth + 30;
    const frame = new PIXI.Sprite(this.createWoodFrameTexture(this.minimapWidth, this.minimapHeight));
    this.minimapPanel.addChild(frame);

    const innerW = this.minimapWidth - 16;
    const innerH = this.minimapHeight - 44;
    const parchmentG = new PIXI.Graphics();
    parchmentG.beginFill(0xd4b896, 0.92);
    parchmentG.drawRoundedRect(8, 26, innerW, innerH, 4);
    parchmentG.endFill();
    parchmentG.beginFill(0xc9a977, 0.35);
    for (let i = 0; i < 25; i++) {
      const px = 8 + Math.random() * innerW;
      const py = 26 + Math.random() * innerH;
      const ds = Math.random() * 3 + 0.8;
      parchmentG.drawCircle(px, py, ds);
    }
    parchmentG.endFill();
    parchmentG.lineStyle(1, 0x8b6914, 0.6);
    parchmentG.drawRoundedRect(9, 27, innerW - 2, innerH - 2, 3);
    this.minimapPanel.addChild(parchmentG);

    this.minimapTitle.x = this.minimapWidth / 2;
    this.minimapTitle.y = 7;
    this.minimapPanel.addChild(this.minimapTitle);

    const gridW = this.mapManager.gridWidth;
    const gridH = this.mapManager.gridHeight;
    this.minimapCellSize = Math.min((innerW - 8) / gridW, (innerH - 8) / gridH);
    const mapPxW = gridW * this.minimapCellSize;
    const mapPxH = gridH * this.minimapCellSize;
    this.minimapInnerX = 8 + (innerW - mapPxW) / 2;
    this.minimapInnerY = 26 + (innerH - mapPxH) / 2;

    this.minimapCanvas = new PIXI.Graphics();
    this.minimapCanvas.x = this.minimapInnerX;
    this.minimapCanvas.y = this.minimapInnerY;
    this.minimapPanel.addChild(this.minimapCanvas);

    this.minimapViewRect = new PIXI.Graphics();
    this.minimapViewRect.x = this.minimapInnerX;
    this.minimapViewRect.y = this.minimapInnerY;
    this.minimapPanel.addChild(this.minimapViewRect);

    this.minimapPlayerDot = new PIXI.Graphics();
    this.minimapPlayerDot.x = this.minimapInnerX;
    this.minimapPlayerDot.y = this.minimapInnerY;
    this.minimapPanel.addChild(this.minimapPlayerDot);

    this.minimapPanel.eventMode = 'static';
    this.minimapPanel.cursor = 'pointer';
    this.minimapPanel.on('pointerdown', (e: PIXI.FederatedPointerEvent) => {
      const local = this.minimapPanel.toLocal(e.global);
      const px = local.x - this.minimapInnerX;
      const py = local.y - this.minimapInnerY;
      const gx = Math.floor(px / this.minimapCellSize);
      const gy = Math.floor(py / this.minimapCellSize);
      if (this.mapManager.isInBounds(gx, gy)) {
        this.minimapCallbacks.onMinimapClick(gx, gy);
      }
    });

    this.lastExploredSnapshot = [];
    for (let y = 0; y < gridH; y++) {
      this.lastExploredSnapshot[y] = [];
      for (let x = 0; x < gridW; x++) {
        this.lastExploredSnapshot[y][x] = false;
      }
    }
    this.minimapDirty = true;
  }

  private renderMinimapCell(x: number, y: number, cell: Cell): void {
    if (!this.minimapCanvas) return;
    const cs = this.minimapCellSize;
    const px = x * cs;
    const py = y * cs;
    if (!cell.explored) {
      this.minimapCanvas.beginFill(0x2a2a33, 1);
      this.minimapCanvas.drawRect(px, py, cs, cs);
      this.minimapCanvas.endFill();
    } else {
      const cfg = TERRAIN_CONFIGS[cell.terrain];
      const alpha = cell.visible ? 1 : 0.75;
      this.minimapCanvas.beginFill(cfg.color, alpha);
      this.minimapCanvas.drawRect(px, py, cs, cs);
      this.minimapCanvas.endFill();
      if (cell.hasTreasure) {
        this.minimapCanvas.beginFill(0xffd700, 1);
        this.minimapCanvas.drawCircle(px + cs / 2, py + cs / 2, cs * 0.35);
        this.minimapCanvas.endFill();
        this.minimapCanvas.lineStyle(0.5, 0xffffaa, 0.8);
        this.minimapCanvas.drawCircle(px + cs / 2, py + cs / 2, cs * 0.35);
      }
    }
  }

  public updateMinimap(playerGridX: number, playerGridY: number, cameraCenterX: number, cameraCenterY: number): void {
    const gridW = this.mapManager.gridWidth;
    const gridH = this.mapManager.gridHeight;
    let needsRedraw = this.minimapDirty;
    if (playerGridX !== this.lastPlayerX || playerGridY !== this.lastPlayerY) {
      this.lastPlayerX = playerGridX;
      this.lastPlayerY = playerGridY;
      needsRedraw = true;
    }
    if (!needsRedraw) {
      for (let y = 0; y < gridH && !needsRedraw; y++) {
        for (let x = 0; x < gridW && !needsRedraw; x++) {
          const cell = this.mapManager.getCell(x, y);
          if (!cell) continue;
          if (cell.explored !== this.lastExploredSnapshot[y][x]) {
            needsRedraw = true;
          }
        }
      }
    }
    if (this.minimapCanvas && needsRedraw) {
      this.minimapCanvas.clear();
      for (let y = 0; y < gridH; y++) {
        for (let x = 0; x < gridW; x++) {
          const cell = this.mapManager.getCell(x, y);
          if (!cell) continue;
          this.renderMinimapCell(x, y, cell);
          this.lastExploredSnapshot[y][x] = cell.explored;
        }
      }
      this.minimapCanvas.lineStyle(0.5, 0x5a3d1e, 0.5);
      for (let y = 0; y <= gridH; y++) {
        this.minimapCanvas.moveTo(0, y * this.minimapCellSize);
        this.minimapCanvas.lineTo(gridW * this.minimapCellSize, y * this.minimapCellSize);
      }
      for (let x = 0; x <= gridW; x++) {
        this.minimapCanvas.moveTo(x * this.minimapCellSize, 0);
        this.minimapCanvas.lineTo(x * this.minimapCellSize, gridH * this.minimapCellSize);
      }
      this.minimapDirty = false;
    }

    if (this.minimapPlayerDot) {
      this.minimapPlayerDot.clear();
      const px = playerGridX * this.minimapCellSize + this.minimapCellSize / 2;
      const py = playerGridY * this.minimapCellSize + this.minimapCellSize / 2;
      for (let i = 3; i >= 0; i--) {
        const r = (this.minimapCellSize * 0.9 + i * 1.2);
        const a = 0.15 * (4 - i);
        this.minimapPlayerDot.beginFill(0xffd700, a);
        this.minimapPlayerDot.drawCircle(px, py, r);
        this.minimapPlayerDot.endFill();
      }
      this.minimapPlayerDot.lineStyle(1, 0xb8860b, 1);
      this.minimapPlayerDot.beginFill(0xffe066, 1);
      this.minimapPlayerDot.drawCircle(px, py, this.minimapCellSize * 0.5);
      this.minimapPlayerDot.endFill();
      this.minimapPlayerDot.lineStyle(0.8, 0xffffff, 0.9);
      this.minimapPlayerDot.beginFill(0xffffaa, 1);
      this.minimapPlayerDot.drawCircle(px - 0.8, py - 0.8, this.minimapCellSize * 0.18);
      this.minimapPlayerDot.endFill();
    }

    if (this.minimapViewRect) {
      this.minimapViewRect.clear();
      const cs = this.minimapCellSize;
      const frameEl = document.getElementById('game-frame');
      if (frameEl) {
        const rect = frameEl.getBoundingClientRect();
        const viewGridW = Math.ceil(rect.width / this.mapManager.cellSize);
        const viewGridH = Math.ceil(rect.height / this.mapManager.cellSize);
        const cx = cameraCenterX;
        const cy = cameraCenterY;
        const left = (cx - viewGridW / 2) * cs;
        const top = (cy - viewGridH / 2) * cs;
        const w = viewGridW * cs;
        const h = viewGridH * cs;
        this.minimapViewRect.lineStyle(1.2, 0xffe066, 0.85);
        this.minimapViewRect.beginFill(0xffd700, 0.08);
        this.minimapViewRect.drawRect(left, top, w, h);
        this.minimapViewRect.endFill();
      }
    }
  }

  public updateStats(exploredCount: number, totalCells: number, treasureCount: number, totalTreasures: number): void {
    const pct = totalCells > 0 ? (exploredCount / totalCells * 100) : 0;
    this.exploredText.text = `${exploredCount} / ${totalCells}  (${pct.toFixed(1)}%)`;
    this.treasureText.text = `${treasureCount} / ${totalTreasures}`;

    this.progressBarBg.clear();
    this.progressBarBg.lineStyle(1, 0x5a3d1e, 1);
    this.progressBarBg.beginFill(0x8b7355, 0.5);
    this.progressBarBg.drawRoundedRect(0, 0, 196, 16, 4);
    this.progressBarBg.endFill();

    this.progressBarFill.clear();
    const fillW = Math.max(0, Math.min(196, 196 * (pct / 100)));
    this.progressBarFill.beginFill(0x2f6b2f);
    this.progressBarFill.drawRoundedRect(0, 0, fillW, 16, 4);
    this.progressBarFill.endFill();
    this.progressBarFill.lineStyle(1, 0x1a3a1a, 0.8);
    this.progressBarFill.drawRoundedRect(0, 0, fillW, 16, 4);
    if (fillW > 10) {
      this.progressBarFill.lineStyle(0);
      this.progressBarFill.beginFill(0xffffff, 0.25);
      this.progressBarFill.drawRoundedRect(2, 2, fillW - 4, 5, 2);
      this.progressBarFill.endFill();
    }
    this.exploredText.text = `${exploredCount} / ${totalCells}  (${pct.toFixed(1)}%)`;
  }

  public showToast(message: string, color: number = 0xb8860b, duration: number = 2): void {
    const toastW = 300;
    const toastH = 50;
    const g = new PIXI.Graphics();
    g.beginFill(0x1a0f08, 0.85);
    g.drawRoundedRect(0, 0, toastW, toastH, 8);
    g.endFill();
    g.lineStyle(2, color, 1);
    g.drawRoundedRect(1, 1, toastW - 2, toastH - 2, 7);

    const tex = this.app.renderer.generateTexture(g, PIXI.SCALE_MODES.LINEAR, 1, new PIXI.Rectangle(0, 0, toastW, toastH));
    const bg = new PIXI.Sprite(tex);
    bg.anchor.set(0.5);
    bg.x = this.app.renderer.width / 2;
    bg.y = this.app.renderer.height / 2 - 100;
    bg.alpha = 0;

    const txt = new PIXI.Text(message, this.getTextStyle(18, color, 'center'));
    txt.anchor.set(0.5);
    txt.x = bg.x;
    txt.y = bg.y;
    txt.alpha = 0;

    const container = new PIXI.Container();
    container.addChild(bg);
    container.addChild(txt);
    this.toastContainer.addChild(container);

    const startTime = performance.now();
    const animate = () => {
      const elapsed = (performance.now() - startTime) / 1000;
      if (elapsed < 0.3) {
        const t = elapsed / 0.3;
        bg.alpha = t;
        txt.alpha = t;
        bg.scale.set(0.8 + t * 0.2);
        requestAnimationFrame(animate);
      } else if (elapsed < duration) {
        bg.alpha = 1;
        txt.alpha = 1;
        requestAnimationFrame(animate);
      } else if (elapsed < duration + 0.4) {
        const t = (elapsed - duration) / 0.4;
        bg.alpha = 1 - t;
        txt.alpha = 1 - t;
        bg.y -= t * 30;
        txt.y -= t * 30;
        requestAnimationFrame(animate);
      } else {
        this.toastContainer.removeChild(container);
      }
    };
    animate();
  }

  public playBlockedToast(): void {
    this.showToast('⚠ 前方不可通行！', 0xcc3333, 1.2);
    this.playBlockedSound();
  }

  public playTreasureToast(count: number, total: number): void {
    this.showToast(`✦ 获得宝藏！(${count}/${total})`, 0xffc83c, 2);
    this.playTreasureSound();
  }

  public triggerVictory(): void {
    if (this.victoryActive) return;
    this.victoryActive = true;
    this.playVictorySound();

    this.victoryOverlay = new PIXI.Container();
    this.container.addChild(this.victoryOverlay);

    const w = this.app.renderer.width;
    const h = this.app.renderer.height;

    const darken = new PIXI.Graphics();
    darken.beginFill(0x1a0f08, 0);
    darken.drawRect(0, 0, w, h);
    darken.endFill();
    this.victoryOverlay.addChild(darken);

    const glow = new PIXI.Graphics();
    this.victoryOverlay.addChild(glow);

    const frameG = new PIXI.Graphics();
    this.victoryOverlay.addChild(frameG);

    const titleText = new PIXI.Text('🎉 恭喜通关！', this.getTextStyle(52, 0xb8860b, 'center'));
    titleText.anchor.set(0.5);
    titleText.alpha = 0;
    this.victoryOverlay.addChild(titleText);

    const subText = new PIXI.Text('你已成功寻得传说中的宝藏！', this.getTextStyle(22, 0x8b6914, 'center'));
    subText.anchor.set(0.5);
    subText.alpha = 0;
    this.victoryOverlay.addChild(subText);

    const startTime = performance.now();
    const animate = () => {
      if (!this.victoryOverlay) return;
      const elapsed = (performance.now() - startTime) / 1000;

      const darkT = Math.min(1, elapsed / 0.8);
      darken.clear();
      darken.beginFill(0x1a0f08, darkT * 0.7);
      darken.drawRect(0, 0, w, h);
      darken.endFill();

      const glowT = Math.min(1, elapsed / 1.5);
      glow.clear();
      for (let i = 6; i >= 0; i--) {
        const r = (w * 0.15 + glowT * w * 0.6) * (1 + i * 0.15);
        const a = glowT * 0.06 * (7 - i);
        glow.beginFill(0xffd700, a);
        glow.drawCircle(w / 2, h / 2, r);
        glow.endFill();
      }

      const frameT = Math.min(1, Math.max(0, (elapsed - 0.5) / 0.6));
      const fw = 560 * frameT;
      const fh = 220 * frameT;
      frameG.clear();
      if (frameT > 0.02) {
        frameG.lineStyle(4, 0xb8860b, frameT);
        frameG.beginFill(0xd4b896, frameT * 0.95);
        frameG.drawRoundedRect(w / 2 - fw / 2, h / 2 - fh / 2, fw, fh, 12);
        frameG.endFill();
        frameG.lineStyle(2, 0x8b6914, frameT);
        frameG.drawRoundedRect(w / 2 - fw / 2 + 6, h / 2 - fh / 2 + 6, fw - 12, fh - 12, 10);
      }

      const titleT = Math.min(1, Math.max(0, (elapsed - 0.8) / 0.6));
      titleText.alpha = titleT;
      titleText.x = w / 2;
      titleText.y = h / 2 - 40;
      titleText.scale.set(0.8 + titleT * 0.2 + Math.sin(elapsed * 3) * 0.02);

      const subT = Math.min(1, Math.max(0, (elapsed - 1.3) / 0.5));
      subText.alpha = subT;
      subText.x = w / 2;
      subText.y = h / 2 + 25;

      if (elapsed < 4) {
        requestAnimationFrame(animate);
      }
    };
    animate();
  }

  private playMoveSound(): void {
    if (!this.audioCtx || !this.audioUnlocked) return;
    const now = this.audioCtx.currentTime;
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(120, now + 0.08);
    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
    osc.connect(gain).connect(this.audioCtx.destination);
    osc.start(now);
    osc.stop(now + 0.12);
  }

  private playBlockedSound(): void {
    if (!this.audioCtx || !this.audioUnlocked) return;
    const now = this.audioCtx.currentTime;
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(260, now);
    osc.frequency.setValueAtTime(200, now + 0.06);
    osc.frequency.setValueAtTime(260, now + 0.12);
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
    osc.connect(gain).connect(this.audioCtx.destination);
    osc.start(now);
    osc.stop(now + 0.22);
  }

  private playTreasureSound(): void {
    if (!this.audioCtx || !this.audioUnlocked) return;
    const now = this.audioCtx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, i) => {
      const osc = this.audioCtx!.createOscillator();
      const gain = this.audioCtx!.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + i * 0.08);
      gain.gain.setValueAtTime(0.001, now + i * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.15, now + i * 0.08 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.35);
      osc.connect(gain).connect(this.audioCtx!.destination);
      osc.start(now + i * 0.08);
      osc.stop(now + i * 0.08 + 0.4);
    });
  }

  private playVictorySound(): void {
    if (!this.audioCtx || !this.audioUnlocked) return;
    const now = this.audioCtx.currentTime;
    const chord = [261.63, 329.63, 392.0, 523.25, 659.25];
    chord.forEach((freq, i) => {
      const osc = this.audioCtx!.createOscillator();
      const gain = this.audioCtx!.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + i * 0.12);
      gain.gain.setValueAtTime(0.001, now + i * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.18, now + i * 0.12 + 0.15);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.12 + 1.8);
      osc.connect(gain).connect(this.audioCtx!.destination);
      osc.start(now + i * 0.12);
      osc.stop(now + i * 0.12 + 2);
    });
  }

  public onMove(): void {
    this.playMoveSound();
  }

  public onBlocked(): void {
    this.playBlockedToast();
  }

  public onTreasureCollected(count: number, total: number): void {
    this.playTreasureToast(count, total);
  }

  public resize(): void {
    const w = this.app.renderer.width;
    const h = this.app.renderer.height;

    this.topLeftPanel.x = 24;
    this.topLeftPanel.y = 24;

    this.topRightPanel.x = w - 184;
    this.topRightPanel.y = 24;

    this.bottomBar.x = (w - 520) / 2;
    this.bottomBar.y = h - 60;

    this.buildMinimap();
    this.minimapPanel.x = w - this.minimapWidth - 24;
    this.minimapPanel.y = h - this.minimapHeight - 24;

    this.instructionText.text = '⬆⬇⬅➡/WASD 移动  ·  点击缩略图快速查看  ·  收集 2 宝藏通关  ·  水域不可通行  ·  山地 2 步';

    if (this.victoryOverlay) {
      this.victoryOverlay.removeChildren();
      this.container.removeChild(this.victoryOverlay);
      this.victoryOverlay = null;
      this.victoryActive = false;
    }
  }

  public destroy(): void {
    this.app.stage.removeChild(this.container);
  }
}
