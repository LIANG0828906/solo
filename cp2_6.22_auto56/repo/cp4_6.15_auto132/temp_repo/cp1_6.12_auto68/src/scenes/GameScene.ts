import Phaser from 'phaser';
import { MapGenerator, MapData, TileType } from '../utils/MapGenerator';
import { PuzzleManager, PuzzlePiece, PuzzleShape, PuzzleColor, PUZZLE_COLORS_HEX } from '../utils/PuzzleManager';

const TILE_SIZE = 32;
const GRID_SIZE = 15;
const MAP_OFFSET_X = 20;
const MAP_OFFSET_Y = 20;

const TILE_COLORS: Record<TileType, number> = {
  grass: 0x4a5d23,
  sand: 0xc2b280,
  rock: 0x888888,
  water: 0x2980b9
};

const TILE_COLORS_ALT: Record<TileType, number> = {
  grass: 0x3d4d1c,
  sand: 0xb0a070,
  rock: 0x707070,
  water: 0x1f6fa5
};

interface Treasure {
  pos: { x: number; y: number };
  opened: boolean;
  pieceId: number;
  container: Phaser.GameObjects.Container;
  lid: Phaser.GameObjects.Rectangle;
}

interface DraggingPiece {
  pieceId: number;
  container: Phaser.GameObjects.Container;
  originalSlot: number;
  originalX: number;
  originalY: number;
}

export class GameScene extends Phaser.Scene {
  private level: number = 1;
  private mapData!: MapData;
  private puzzleManager!: PuzzleManager;

  private playerGridX: number = 0;
  private playerGridY: number = 0;
  private playerContainer!: Phaser.GameObjects.Container;
  private isMoving: boolean = false;
  private moveCooldown: number = 0;

  private treasures: Treasure[] = [];
  private adjacentTreasure: Treasure | null = null;

  private puzzleSlots: (Phaser.GameObjects.Container | null)[] = [];
  private puzzleBoardSlots: (Phaser.GameObjects.Rectangle | null)[] = [];
  private puzzleBoardContainer!: Phaser.GameObjects.Container;
  private puzzleSlotContainer!: Phaser.GameObjects.Container;

  private portalContainer!: Phaser.GameObjects.Container;
  private portalActive: boolean = false;

  private levelText!: Phaser.GameObjects.Text;
  private hintText!: Phaser.GameObjects.Text;

  private dragging: DraggingPiece | null = null;

  private audioContext: AudioContext | null = null;
  private walkSoundBuffer: AudioBuffer | null = null;

  private fadeLayer!: Phaser.GameObjects.Rectangle;

  private lastCollectedPieces: number[] = [];

  constructor() {
    super('GameScene');
  }

  init(data: { level: number }): void {
    this.level = data.level || 1;
  }

  create(): void {
    this.initAudio();
    this.createFadeLayer();
    this.setupLevel();
    this.setupInput();
    this.cameras.main.fadeIn(500, 0, 0, 0);
  }

  private createFadeLayer(): void {
    this.fadeLayer = this.add.rectangle(0, 0, 800, 600, 0x000000, 1)
      .setOrigin(0, 0)
      .setDepth(1000)
      .setAlpha(0);
  }

  private setupLevel(): void {
    this.children.removeAll(true);
    this.treasures = [];
    this.puzzleSlots = [];
    this.puzzleBoardSlots = [];
    this.dragging = null;
    this.portalActive = false;
    this.lastCollectedPieces = [];

    this.mapData = MapGenerator.generate(this.level);
    this.puzzleManager = new PuzzleManager();

    this.drawMap();
    this.drawUI();
    this.drawPuzzleBoard();
    this.drawPuzzleSlots();
    this.spawnTreasures();
    this.spawnPortal();
    this.spawnPlayer();
    this.createFadeLayer();

    this.updateAdjacentTreasure();
  }

  private drawMap(): void {
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        const tile = this.mapData.grid[y][x];
        const px = MAP_OFFSET_X + x * TILE_SIZE;
        const py = MAP_OFFSET_Y + y * TILE_SIZE;

        const baseColor = (x + y) % 2 === 0 ? TILE_COLORS[tile] : TILE_COLORS_ALT[tile];
        this.add.rectangle(px + TILE_SIZE / 2, py + TILE_SIZE / 2, TILE_SIZE, TILE_SIZE, baseColor);

        if (tile === 'grass') {
          const seed = (x * 7 + y * 13) % 100;
          if (seed < 25) {
            this.add.rectangle(px + 4 + (seed % 5) * 5, py + 4 + (seed % 4) * 6, 3, 3, 0x6b8e23, 0.6);
          }
          if (seed < 10) {
            this.add.rectangle(px + 15 + (seed % 3) * 4, py + 20 + (seed % 2) * 5, 2, 4, 0x8fbc8f, 0.5);
          }
        } else if (tile === 'sand') {
          const seed = (x * 11 + y * 5) % 100;
          if (seed < 30) {
            this.add.rectangle(px + (seed % 28), py + (seed % 28), 2, 2, 0xd4c4a0, 0.7);
          }
        } else if (tile === 'water') {
          const seed = (x * 3 + y * 7) % 100;
          if (seed < 40) {
            this.add.rectangle(px + 4 + (seed % 20), py + 8 + (seed % 16), 10, 2, 0x5dade2, 0.4);
          }
        } else if (tile === 'rock') {
          this.add.rectangle(px + TILE_SIZE / 2, py + TILE_SIZE / 2, 20, 16, 0x666666);
          this.add.rectangle(px + TILE_SIZE / 2 - 4, py + TILE_SIZE / 2 - 4, 6, 6, 0x999999);
        }
      }
    }

    const mapW = GRID_SIZE * TILE_SIZE;
    const mapH = GRID_SIZE * TILE_SIZE;
    this.add.rectangle(MAP_OFFSET_X + mapW / 2, MAP_OFFSET_Y + mapH / 2, mapW + 4, mapH + 4)
      .setStrokeStyle(3, 0x8b6914)
      .setFillStyle(0x000000, 0);
  }

  private drawUI(): void {
    this.levelText = this.add.text(780, 16, `第 ${this.level} / 5 关`, {
      fontFamily: 'Segoe UI, Arial, sans-serif',
      fontSize: '22px',
      color: '#f1c40f',
      fontStyle: 'bold',
      stroke: '#5a4510',
      strokeThickness: 4
    }).setOrigin(1, 0).setDepth(100);

    this.hintText = this.add.text(MAP_OFFSET_X + GRID_SIZE * TILE_SIZE / 2, MAP_OFFSET_Y + GRID_SIZE * TILE_SIZE + 14,
      '', {
        fontFamily: 'Segoe UI, Arial, sans-serif',
        fontSize: '16px',
        color: '#ffeaa7',
        fontStyle: 'bold'
      }).setOrigin(0.5, 0).setDepth(100);
  }

  private drawPuzzleBoard(): void {
    const boardX = 560;
    const boardY = 80;
    const cellSize = 56;
    const gap = 6;

    this.puzzleBoardContainer = this.add.container(boardX, boardY);

    const bgW = cellSize * 3 + gap * 4;
    const bgH = cellSize * 2 + gap * 3;
    const bg = this.add.rectangle(0, 0, bgW, bgH, 0x3a2a10)
      .setStrokeStyle(4, 0x8b6914)
      .setOrigin(0, 0);
    this.puzzleBoardContainer.add(bg);

    this.add.text(bgW / 2, -36, '拼图底板', {
      fontFamily: 'Segoe UI, Arial, sans-serif',
      fontSize: '18px',
      color: '#f1c40f',
      fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(101);

    for (let i = 0; i < 6; i++) {
      const col = i % 3;
      const row = Math.floor(i / 3);
      const sx = gap + col * (cellSize + gap);
      const sy = gap + row * (cellSize + gap);

      const slot = this.add.rectangle(sx + cellSize / 2, sy + cellSize / 2, cellSize, cellSize, 0x4a3a20)
        .setStrokeStyle(2, 0x6b5030)
        .setOrigin(0.5, 0.5)
        .setData('slotIndex', i);
      this.puzzleBoardContainer.add(slot);
      this.puzzleBoardSlots.push(slot);

      const correctPiece = this.puzzleManager.pieces[i];
      this.add.text(sx + cellSize / 2, sy + cellSize / 2, this.getShapeSymbol(correctPiece.shape), {
        fontFamily: 'Segoe UI, Arial, sans-serif',
        fontSize: '28px',
        color: '#5a4a30'
      }).setOrigin(0.5).setDepth(50);
    }

    this.puzzleBoardContainer.setDepth(50);
  }

  private drawPuzzleSlots(): void {
    const slotX = 20;
    const slotY = 490;
    const cellSize = 48;
    const gap = 6;

    this.puzzleSlotContainer = this.add.container(slotX, slotY);

    const bgW = cellSize * 3 + gap * 4;
    const bgH = cellSize * 2 + gap * 3;
    const bg = this.add.rectangle(0, 0, bgW, bgH, 0x3a2a10)
      .setStrokeStyle(4, 0x8b6914)
      .setOrigin(0, 0);
    this.puzzleSlotContainer.add(bg);

    this.add.text(bgW / 2, -32, '拼图栏  ' + this.puzzleManager.getCollectedCount() + '/6', {
      fontFamily: 'Segoe UI, Arial, sans-serif',
      fontSize: '16px',
      color: '#f1c40f',
      fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(101);

    for (let i = 0; i < 6; i++) {
      const col = i % 3;
      const row = Math.floor(i / 3);
      const sx = gap + col * (cellSize + gap);
      const sy = gap + row * (cellSize + gap);

      const slot = this.add.rectangle(sx + cellSize / 2, sy + cellSize / 2, cellSize, cellSize, 0x2a1a00)
        .setStrokeStyle(2, 0x5a4020)
        .setOrigin(0.5, 0.5)
        .setData('slotIndex', i);
      this.puzzleSlotContainer.add(slot);
      this.puzzleSlots.push(null);
    }

    this.puzzleSlotContainer.setDepth(50);
  }

  private getShapeSymbol(shape: PuzzleShape): string {
    const map: Record<PuzzleShape, string> = {
      semicircle: '◡',
      triangle: '△',
      zigzag: '≋',
      diamond: '◇',
      star: '☆',
      heart: '♡'
    };
    return map[shape];
  }

  private createPuzzlePieceGraphics(piece: PuzzlePiece, size: number = 40): Phaser.GameObjects.Container {
    const container = this.add.container(0, 0);
    const color = PUZZLE_COLORS_HEX[piece.color];
    const darkerColor = Phaser.Display.Color.IntegerToColor(color).darken(30).color;

    const bg = this.add.rectangle(0, 0, size, size, 0x1a1208)
      .setStrokeStyle(3, darkerColor);
    container.add(bg);

    const inner = this.add.rectangle(0, 0, size - 8, size - 8, color, 0.85);
    container.add(inner);

    const symbol = this.add.text(0, 0, this.getShapeSymbol(piece.shape), {
      fontFamily: 'Segoe UI, Arial, sans-serif',
      fontSize: String(size * 0.5) + 'px',
      color: '#ffffff',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5);
    container.add(symbol);

    const highlight = this.add.rectangle(-size * 0.2, -size * 0.2, size * 0.3, size * 0.1, 0xffffff, 0.3)
      .setRotation(-0.5);
    container.add(highlight);

    return container;
  }

  private placePieceInSlot(piece: PuzzlePiece, slotIndex: number): void {
    const cellSize = 48;
    const gap = 6;
    const col = slotIndex % 3;
    const row = Math.floor(slotIndex / 3);
    const sx = gap + col * (cellSize + gap) + cellSize / 2;
    const sy = gap + row * (cellSize + gap) + cellSize / 2;

    const pieceGfx = this.createPuzzlePieceGraphics(piece, 40);
    pieceGfx.setPosition(sx, sy);
    pieceGfx.setSize(cellSize, cellSize);
    pieceGfx.setData('pieceId', piece.id);
    pieceGfx.setData('slotIndex', slotIndex);
    pieceGfx.setInteractive({ useHandCursor: true, draggable: true });

    this.setupPieceDrag(pieceGfx);
    this.puzzleSlotContainer.add(pieceGfx);

    if (this.puzzleSlots[slotIndex]) {
      this.puzzleSlots[slotIndex]!.destroy();
    }
    this.puzzleSlots[slotIndex] = pieceGfx;
  }

  private setupPieceDrag(container: Phaser.GameObjects.Container): void {
    container.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (this.dragging) return;

      const pieceId = container.getData('pieceId') as number;
      const piece = this.puzzleManager.getPieceById(pieceId);
      if (!piece || piece.placed) return;

      this.dragging = {
        pieceId,
        container,
        originalSlot: container.getData('slotIndex'),
        originalX: container.x,
        originalY: container.y
      };

      const worldPoint = this.puzzleSlotContainer.getWorldTransformMatrix().
        transformPoint(container.x, container.y);
      this.puzzleSlotContainer.remove(container);
      container.setPosition(worldPoint.x, worldPoint.y);
      this.children.bringToTop(container);
      container.setDepth(200);
      container.setScale(1.15);
    });
  }

  private spawnTreasures(): void {
    const unassignedPieceIds = [0, 1, 2, 3, 4, 5];
    Phaser.Utils.Array.Shuffle(unassignedPieceIds);

    const treasCount = this.mapData.treasurePositions.length;
    let pieceCursor = 0;

    for (let i = 0; i < treasCount; i++) {
      const pos = this.mapData.treasurePositions[i];
      let pieceId: number;

      if (i < 6) {
        pieceId = unassignedPieceIds[pieceCursor++ % 6];
      } else {
        pieceId = unassignedPieceIds[i % 6];
      }

      this.createTreasure(pos, pieceId);
    }
  }

  private createTreasure(pos: { x: number; y: number }, pieceId: number): void {
    const px = MAP_OFFSET_X + pos.x * TILE_SIZE + TILE_SIZE / 2;
    const py = MAP_OFFSET_Y + pos.y * TILE_SIZE + TILE_SIZE / 2;

    const container = this.add.container(px, py);

    const base = this.add.rectangle(0, 4, 22, 14, 0x5a3a15)
      .setStrokeStyle(2, 0x3a2010);
    container.add(base);

    const body = this.add.rectangle(0, 0, 22, 16, 0x8b5a2b)
      .setStrokeStyle(2, 0x5a3a15);
    container.add(body);

    const lid = this.add.rectangle(0, -10, 22, 8, 0xa0693a)
      .setStrokeStyle(2, 0x6b4020);
    container.add(lid);

    const metalBand1 = this.add.rectangle(0, -8, 22, 2, 0xf1c40f);
    container.add(metalBand1);
    const metalBand2 = this.add.rectangle(0, -2, 22, 2, 0xf1c40f);
    container.add(metalBand2);
    const lock = this.add.rectangle(0, -4, 4, 6, 0xf1c40f)
      .setStrokeStyle(1, 0x8b6914);
    container.add(lock);

    const shimmer = this.add.rectangle(-6, -10, 4, 2, 0xffffff, 0.3);
    container.add(shimmer);

    const glow = this.add.rectangle(0, 0, 28, 24, 0xf1c40f, 0)
      .setDepth(-1);
    container.add(glow);

    this.tweens.add({
      targets: glow,
      alpha: { from: 0, to: 0.15 },
      duration: 1000,
      yoyo: true,
      repeat: -1
    });

    this.tweens.add({
      targets: shimmer,
      x: { from: -6, to: 4 },
      alpha: { from: 0.3, to: 0 },
      duration: 1500,
      repeat: -1,
      delay: i * 300
    });

    container.setDepth(10);

    this.treasures.push({
      pos,
      opened: false,
      pieceId,
      container,
      lid
    });
  }

  private spawnPortal(): void {
    const pos = this.mapData.portalPosition;
    const px = MAP_OFFSET_X + pos.x * TILE_SIZE + TILE_SIZE / 2;
    const py = MAP_OFFSET_Y + pos.y * TILE_SIZE + TILE_SIZE / 2;

    this.portalContainer = this.add.container(px, py);
    this.portalContainer.setDepth(5);
    this.portalContainer.setVisible(false);
    this.portalContainer.setActive(false);

    const outerGlow = this.add.circle(0, 0, 22, 0xf1c40f, 0);
    this.portalContainer.add(outerGlow);

    for (let ring = 0; ring < 2; ring++) {
      for (let i = 0; i < 16; i++) {
        const angle = (i / 16) * Math.PI * 2;
        const radius = 18 - ring * 5;
        const dx = Math.cos(angle) * radius;
        const dy = Math.sin(angle) * radius;
        const dot = this.add.rectangle(dx, dy, 4, 4, 0xf1c40f, 0.8 + ring * 0.2);
        dot.setData('ring', ring);
        dot.setData('angle', angle);
        this.portalContainer.add(dot);
      }
    }

    const swirl1 = this.add.arc(0, 0, 12, 0, 320, false, 0xf1c40f, 0.3);
    this.portalContainer.add(swirl1);
    const swirl2 = this.add.arc(0, 0, 8, 0, 320, false, 0xffd700, 0.5);
    this.portalContainer.add(swirl2);
    const core = this.add.circle(0, 0, 5, 0xffffff, 0.7);
    this.portalContainer.add(core);

    this.tweens.add({
      targets: outerGlow,
      alpha: { from: 0, to: 0.4 },
      scale: { from: 0.8, to: 1.2 },
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    this.tweens.add({
      targets: [swirl1, swirl2],
      rotation: Math.PI * 2,
      duration: 2000,
      repeat: -1,
      ease: 'Linear'
    });

    this.time.addEvent({
      delay: 30,
      loop: true,
      callback: () => {
        if (!this.portalContainer.visible) return;
        const dots = this.portalContainer.list.filter(
          (o) => o.type === 'Rectangle' && (o as any).width === 4 && (o as any).height === 4
        ) as Phaser.GameObjects.Rectangle[];

        dots.forEach((dot) => {
          const ring = dot.getData('ring') as number;
          const baseAngle = dot.getData('angle') as number;
          const dir = ring === 0 ? 1 : -1;
          const speed = 0.03 * dir;
          const radius = 18 - ring * 5;
          const newAngle = baseAngle + (this.time.now * speed * 0.01);
          dot.x = Math.cos(newAngle) * radius;
          dot.y = Math.sin(newAngle) * radius;
        });
      }
    });
  }

  private activatePortal(): void {
    this.portalActive = true;
    this.portalContainer.setVisible(true);
    this.portalContainer.setActive(true);
    this.portalContainer.setScale(0.1);

    this.tweens.add({
      targets: this.portalContainer,
      scale: 1,
      duration: 600,
      ease: 'Back.easeOut'
    });

    this.showHint('✦ 传送门已开启！走到中央进入下一关 ✦');
  }

  private spawnPlayer(): void {
    this.playerGridX = this.mapData.playerStart.x;
    this.playerGridY = this.mapData.playerStart.y;

    const px = MAP_OFFSET_X + this.playerGridX * TILE_SIZE + TILE_SIZE / 2;
    const py = MAP_OFFSET_Y + this.playerGridY * TILE_SIZE + TILE_SIZE / 2;

    this.playerContainer = this.add.container(px, py);

    const pattern = [
      '  ####  ',
      ' #RRRR# ',
      ' #RRRR# ',
      ' #FFFF# ',
      '  #FF#  ',
      ' #RRRR# ',
      ' #RRRR# ',
      '  #  #  '
    ];
    const s = 3;
    const totalW = 8 * s;
    const totalH = 8 * s;
    const colorMap: Record<string, number> = { '#': 0x2a1a1a, 'R': 0xc0392b, 'F': 0xf5cba7 };

    for (let py2 = 0; py2 < pattern.length; py2++) {
      for (let px2 = 0; px2 < pattern[py2].length; px2++) {
        const ch = pattern[py2][px2];
        if (colorMap[ch]) {
          const pixel = this.add.rectangle(
            -totalW / 2 + px2 * s + s / 2,
            -totalH / 2 + py2 * s + s / 2,
            s, s, colorMap[ch]
          );
          this.playerContainer.add(pixel);
        }
      }
    }

    const shadow = this.add.ellipse(0, totalH / 2, 16, 4, 0x000000, 0.3);
    this.playerContainer.addAt(shadow, 0);

    this.playerContainer.setDepth(20);
  }

  private setupInput(): void {
    this.input.keyboard!.on('keydown-E', this.tryOpenTreasure, this);
    this.input.keyboard!.on('keydown-UP', () => this.tryMove(0, -1), this);
    this.input.keyboard!.on('keydown-DOWN', () => this.tryMove(0, 1), this);
    this.input.keyboard!.on('keydown-LEFT', () => this.tryMove(-1, 0), this);
    this.input.keyboard!.on('keydown-RIGHT', () => this.tryMove(1, 0), this);
    this.input.keyboard!.on('keydown-W', () => this.tryMove(0, -1), this);
    this.input.keyboard!.on('keydown-S', () => this.tryMove(0, 1), this);
    this.input.keyboard!.on('keydown-A', () => this.tryMove(-1, 0), this);
    this.input.keyboard!.on('keydown-D', () => this.tryMove(1, 0), this);

    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (this.dragging) {
        this.dragging.container.x = pointer.x;
        this.dragging.container.y = pointer.y;
      }
    });

    this.input.on('pointerup', this.handlePieceDrop, this);
  }

  private handlePieceDrop(): void {
    if (!this.dragging) return;

    const { pieceId, container, originalSlot, originalX, originalY } = this.dragging;
    const piece = this.puzzleManager.getPieceById(pieceId);
    if (!piece) {
      this.dragging = null;
      return;
    }

    const boardMat = this.puzzleBoardContainer.getWorldTransformMatrix();
    const droppedOnBoard = this.findBoardSlotAt(container.x, container.y, boardMat);

    if (droppedOnBoard >= 0) {
      if (this.puzzleManager.tryPlacePiece(pieceId, droppedOnBoard)) {
        this.placePieceOnBoard(piece, droppedOnBoard, container);
        this.puzzleSlots[originalSlot] = null;
        container.destroy();

        if (this.puzzleManager.isComplete()) {
          this.onPuzzleComplete();
        }
      } else {
        this.animateWrongDrop(container);
        this.returnPieceToSlot(container, originalSlot, originalX, originalY);
      }
    } else {
      this.returnPieceToSlot(container, originalSlot, originalX, originalY);
    }

    this.dragging = null;
  }

  private findBoardSlotAt(worldX: number, worldY: number, matrix: Phaser.GameObjects.Components.TransformMatrix): number {
    const cellSize = 56;
    const gap = 6;

    for (let i = 0; i < 6; i++) {
      const col = i % 3;
      const row = Math.floor(i / 3);
      const lx = gap + col * (cellSize + gap) + cellSize / 2;
      const ly = gap + row * (cellSize + gap) + cellSize / 2;
      const wp = matrix.transformPoint(lx, ly);

      const dx = worldX - wp.x;
      const dy = worldY - wp.y;
      if (Math.abs(dx) < cellSize / 2 && Math.abs(dy) < cellSize / 2) {
        return i;
      }
    }
    return -1;
  }

  private returnPieceToSlot(container: Phaser.GameObjects.Container, slotIndex: number, origX: number, origY: number): void {
    const mat = this.puzzleSlotContainer.getWorldTransformMatrix();
    const targetWP = mat.transformPoint(origX, origY);

    this.tweens.add({
      targets: container,
      x: targetWP.x,
      y: targetWP.y,
      scaleX: 1,
      scaleY: 1,
      duration: 250,
      ease: 'Cubic.easeOut',
      onComplete: () => {
        const lp = this.puzzleSlotContainer.getLocalPoint(targetWP.x, targetWP.y);
        this.children.remove(container);
        container.setPosition(lp.x, lp.y);
        this.puzzleSlotContainer.add(container);
        container.setDepth(0);
        container.setScale(1);
      }
    });
  }

  private placePieceOnBoard(piece: PuzzlePiece, slotIndex: number, droppedContainer: Phaser.GameObjects.Container): void {
    const cellSize = 56;
    const gap = 6;
    const col = slotIndex % 3;
    const row = Math.floor(slotIndex / 3);
    const lx = gap + col * (cellSize + gap) + cellSize / 2;
    const ly = gap + row * (cellSize + gap) + cellSize / 2;

    const pieceGfx = this.createPuzzlePieceGraphics(piece, 50);
    pieceGfx.setPosition(droppedContainer.x, droppedContainer.y);
    pieceGfx.setScale(1.15);
    this.children.bringToTop(pieceGfx);
    pieceGfx.setDepth(200);

    const boardMat = this.puzzleBoardContainer.getWorldTransformMatrix();
    const targetWP = boardMat.transformPoint(lx, ly);

    this.tweens.add({
      targets: pieceGfx,
      x: targetWP.x,
      y: targetWP.y,
      scaleX: 1,
      scaleY: 1,
      duration: 200,
      ease: 'Back.easeOut',
      onComplete: () => {
        const bp = this.puzzleBoardContainer.getLocalPoint(targetWP.x, targetWP.y);
        this.children.remove(pieceGfx);
        pieceGfx.setPosition(bp.x, bp.y);
        this.puzzleBoardContainer.add(pieceGfx);
        pieceGfx.setDepth(60);

        this.tweens.add({
          targets: pieceGfx,
          scaleX: { from: 0.9, to: 1.05 },
          scaleY: { from: 0.9, to: 1.05 },
          x: { from: bp.x - 2, to: bp.x + 2 },
          duration: 50,
          yoyo: true,
          repeat: 3,
          onComplete: () => {
            pieceGfx.setScale(1);
            pieceGfx.setPosition(bp.x, bp.y);
          }
        });

        this.playSnapSound();
      }
    });
  }

  private animateWrongDrop(container: Phaser.GameObjects.Container): void {
    const origX = container.x;
    const origY = container.y;
    let flashCount = 0;

    this.time.addEvent({
      delay: 50,
      repeat: 3,
      callback: () => {
        flashCount++;
        const show = flashCount % 2 === 1;
        if (show) {
          container.list.forEach((child) => {
            if ((child as any).setStrokeStyle) {
              (child as Phaser.GameObjects.Rectangle).setStrokeStyle(4, 0xff0000);
            }
          });
        } else {
          container.list.forEach((child, idx) => {
            if ((child as any).setStrokeStyle && idx === 0) {
              const pieceId = container.getData('pieceId') as number;
              const piece = this.puzzleManager.getPieceById(pieceId);
              if (piece) {
                const darker = Phaser.Display.Color.IntegerToColor(PUZZLE_COLORS_HEX[piece.color]).darken(30).color;
                (child as Phaser.GameObjects.Rectangle).setStrokeStyle(3, darker);
              }
            }
          });
        }
      }
    });

    this.tweens.add({
      targets: container,
      x: origX + 6,
      duration: 40,
      yoyo: true,
      repeat: 3,
      onComplete: () => {
        container.setPosition(origX, origY);
        container.list.forEach((child, idx) => {
          if ((child as any).setStrokeStyle && idx === 0) {
            const pieceId = container.getData('pieceId') as number;
            const piece = this.puzzleManager.getPieceById(pieceId);
            if (piece) {
              const darker = Phaser.Display.Color.IntegerToColor(PUZZLE_COLORS_HEX[piece.color]).darken(30).color;
              (child as Phaser.GameObjects.Rectangle).setStrokeStyle(3, darker);
            }
          }
        });
      }
    });
  }

  private onPuzzleComplete(): void {
    this.time.delayedCall(400, () => {
      const flashRect = this.add.rectangle(
        this.puzzleBoardContainer.x + this.puzzleBoardContainer.width / 2,
        this.puzzleBoardContainer.y + this.puzzleBoardContainer.height / 2,
        this.puzzleBoardContainer.width + 20,
        this.puzzleBoardContainer.height + 20,
        0xffffff, 0
      ).setOrigin(0.5).setDepth(300);

      this.tweens.add({
        targets: flashRect,
        alpha: { from: 0, to: 0.9, duration: 150 },
        yoyo: true,
        repeat: 2,
        onComplete: () => flashRect.destroy()
      });

      this.tweens.add({
        targets: this.puzzleBoardContainer,
        scaleX: 0,
        scaleY: 0,
        alpha: 0,
        duration: 600,
        delay: 400,
        ease: 'Back.easeIn',
        onComplete: () => {
          this.activatePortal();
        }
      });

      this.cameras.main.flash(300, 255, 255, 200);
    });
  }

  update(time: number, delta: number): void {
    if (this.moveCooldown > 0) {
      this.moveCooldown -= delta;
    }
  }

  private tryMove(dx: number, dy: number): void {
    if (this.isMoving || this.moveCooldown > 0) return;

    const newX = this.playerGridX + dx;
    const newY = this.playerGridY + dy;

    if (newX < 0 || newX >= GRID_SIZE || newY < 0 || newY >= GRID_SIZE) return;

    const tile = this.mapData.grid[newY][newX];
    if (tile === 'water' || tile === 'rock') return;

    for (const t of this.treasures) {
      if (!t.opened && t.pos.x === newX && t.pos.y === newY) return;
    }

    this.isMoving = true;
    this.playerGridX = newX;
    this.playerGridY = newY;

    const tx = MAP_OFFSET_X + newX * TILE_SIZE + TILE_SIZE / 2;
    const ty = MAP_OFFSET_Y + newY * TILE_SIZE + TILE_SIZE / 2;

    if (dx < 0) this.playerContainer.setScale(-1, 1);
    else if (dx > 0) this.playerContainer.setScale(1, 1);

    this.tweens.add({
      targets: this.playerContainer,
      x: tx,
      y: ty,
      duration: 110,
      ease: 'Linear',
      onComplete: () => {
        this.isMoving = false;
        this.moveCooldown = 50;
        this.updateAdjacentTreasure();
        this.checkPortal();
      }
    });

    this.tweens.add({
      targets: this.playerContainer,
      y: ty - 3,
      duration: 55,
      yoyo: true,
      ease: 'Sine.easeOut'
    });

    this.playWalkSound();
  }

  private updateAdjacentTreasure(): void {
    this.adjacentTreasure = null;

    const directions = [[0, 0], [0, -1], [0, 1], [-1, 0], [1, 0]];
    for (const [dx, dy] of directions) {
      const cx = this.playerGridX + dx;
      const cy = this.playerGridY + dy;
      for (const t of this.treasures) {
        if (!t.opened && t.pos.x === cx && t.pos.y === cy) {
          this.adjacentTreasure = t;
          break;
        }
      }
      if (this.adjacentTreasure) break;
    }

    if (this.adjacentTreasure) {
      this.showHint('按 E 键打开宝箱');
    } else if (!this.portalActive) {
      if (this.puzzleManager.getCollectedCount() < 6) {
        this.showHint(`收集碎片：${this.puzzleManager.getCollectedCount()}/6  ·  拖拽完成拼图`);
      } else {
        this.showHint('全部收集！拖拽左下角碎片到中央拼图底板');
      }
    }
  }

  private tryOpenTreasure(): void {
    if (!this.adjacentTreasure || this.adjacentTreasure.opened) return;

    const t = this.adjacentTreasure;
    t.opened = true;

    this.tweens.add({
      targets: t.lid,
      rotation: -1.2,
      y: t.lid.y - 6,
      duration: 300,
      ease: 'Back.easeOut'
    });

    this.tweens.add({
      targets: t.container,
      scaleX: { from: 1, to: 1.15 },
      scaleY: { from: 1, to: 0.9 },
      duration: 150,
      yoyo: true,
      ease: 'Sine.easeOut'
    });

    this.playOpenSound();

    this.time.delayedCall(200, () => {
      this.collectPuzzlePiece(t.pieceId, t.container.x, t.container.y);
    });

    this.adjacentTreasure = null;
  }

  private collectPuzzlePiece(pieceId: number, fx: number, fy: number): void {
    const piece = this.puzzleManager.getPieceById(pieceId);
    if (!piece) return;

    if (piece.collected) {
      this.updateAdjacentTreasure();
      return;
    }

    this.puzzleManager.collectPiece(pieceId);
    this.lastCollectedPieces.push(pieceId);

    const flyingPiece = this.createPuzzlePieceGraphics(piece, 36);
    flyingPiece.setPosition(fx, fy - 16);
    flyingPiece.setDepth(500);
    flyingPiece.setScale(0.4);

    const collectedLabel = this.add.text(fx, fy - 34, '+1 碎片', {
      fontFamily: 'Segoe UI, Arial, sans-serif',
      fontSize: '14px',
      color: '#f1c40f',
      fontStyle: 'bold',
      stroke: '#5a4010',
      strokeThickness: 3
    }).setOrigin(0.5).setDepth(510);

    this.tweens.add({
      targets: collectedLabel,
      y: fy - 60,
      alpha: { from: 1, to: 0 },
      duration: 800,
      ease: 'Cubic.easeOut',
      onComplete: () => collectedLabel.destroy()
    });

    const nextEmptySlot = this.findNextEmptySlot();
    if (nextEmptySlot < 0) {
      flyingPiece.destroy();
      this.updatePuzzleSlotLabel();
      this.updateAdjacentTreasure();
      return;
    }

    const slotMat = this.puzzleSlotContainer.getWorldTransformMatrix();
    const cellSize = 48;
    const gap = 6;
    const col = nextEmptySlot % 3;
    const row = Math.floor(nextEmptySlot / 3);
    const lx = gap + col * (cellSize + gap) + cellSize / 2;
    const ly = gap + row * (cellSize + gap) + cellSize / 2;
    const targetWP = slotMat.transformPoint(lx, ly);

    this.tweens.add({
      targets: flyingPiece,
      x: targetWP.x,
      y: targetWP.y,
      scaleX: 1,
      scaleY: 1,
      rotation: Math.PI * 2,
      duration: 700,
      ease: 'Cubic.easeInOut',
      onComplete: () => {
        flyingPiece.destroy();
        this.placePieceInSlot(piece, nextEmptySlot);
        this.updatePuzzleSlotLabel();
        this.playCollectSound();
        this.updateAdjacentTreasure();
      }
    });
  }

  private findNextEmptySlot(): number {
    for (let i = 0; i < 6; i++) {
      if (this.puzzleSlots[i] === null) return i;
    }
    return -1;
  }

  private updatePuzzleSlotLabel(): void {
    const label = this.puzzleSlotContainer.getAt(this.puzzleSlotContainer.length - 1) as Phaser.GameObjects.Text;
    if (label && label.type === 'Text') {
      label.setText('拼图栏  ' + this.puzzleManager.getCollectedCount() + '/6');
    } else {
      const bgW = 48 * 3 + 6 * 4;
      const t = this.children.list.find((c) => {
        const ct = c as any;
        return ct.type === 'Text' && ct.text && ct.text.startsWith('拼图栏');
      }) as Phaser.GameObjects.Text | undefined;
      if (t) t.setText('拼图栏  ' + this.puzzleManager.getCollectedCount() + '/6');
    }
  }

  private checkPortal(): void {
    if (!this.portalActive) return;
    if (this.playerGridX === this.mapData.portalPosition.x &&
        this.playerGridY === this.mapData.portalPosition.y) {
      this.enterPortal();
    }
  }

  private enterPortal(): void {
    this.cameras.main.shake(300, 0.01);

    this.fadeLayer.setAlpha(0);
    this.tweens.add({
      targets: this.fadeLayer,
      alpha: 1,
      duration: 500,
      ease: 'Linear',
      onComplete: () => {
        if (this.level >= 5) {
          this.scene.stop('GameScene');
          this.scene.start('MenuScene');
          this.time.delayedCall(200, () => {
            const menu = this.scene.get('MenuScene') as any;
            if (menu && menu.showVictory) menu.showVictory();
          });
        } else {
          this.scene.restart({ level: this.level + 1 });
        }
      }
    });

    for (let i = 0; i < 20; i++) {
      const angle = (i / 20) * Math.PI * 2;
      const dist = 5;
      const px = this.playerContainer.x + Math.cos(angle) * dist;
      const py = this.playerContainer.y + Math.sin(angle) * dist;
      const sparkle = this.add.rectangle(px, py, 3, 3, 0xf1c40f);
      sparkle.setDepth(900);

      this.tweens.add({
        targets: sparkle,
        x: this.portalContainer.x,
        y: this.portalContainer.y,
        alpha: 0,
        scale: 0.2,
        duration: 400,
        ease: 'Cubic.easeIn',
        delay: i * 20,
        onComplete: () => sparkle.destroy()
      });
    }
  }

  private showHint(text: string): void {
    if (this.hintText) {
      this.hintText.setText(text);
    }
  }

  private initAudio(): void {
    try {
      const AC = (window as any).AudioContext || (window as any).webkitAudioContext;
      this.audioContext = new AC();
    } catch (e) {
      this.audioContext = null;
    }
  }

  private ensureAudio(): AudioContext | null {
    if (!this.audioContext) return null;
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume().catch(() => {});
    }
    return this.audioContext;
  }

  private playSquareWave(freq: number, duration: number, volume: number = 0.05, attack: number = 0.005): void {
    const ctx = this.ensureAudio();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.value = freq;

    const now = ctx.currentTime;
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(volume, now + attack);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  private playWalkSound(): void {
    const freq = Phaser.Math.Between(180, 220);
    this.playSquareWave(freq, 0.07, 0.035);
  }

  private playOpenSound(): void {
    this.playSquareWave(330, 0.08, 0.05);
    this.time.delayedCall(80, () => this.playSquareWave(440, 0.1, 0.05));
    this.time.delayedCall(180, () => this.playSquareWave(660, 0.12, 0.06));
  }

  private playCollectSound(): void {
    this.playSquareWave(523, 0.08, 0.06);
    this.time.delayedCall(70, () => this.playSquareWave(659, 0.08, 0.06));
    this.time.delayedCall(140, () => this.playSquareWave(784, 0.12, 0.07));
  }

  private playSnapSound(): void {
    this.playSquareWave(800, 0.04, 0.05);
    this.time.delayedCall(40, () => this.playSquareWave(1200, 0.06, 0.04));
  }
}
