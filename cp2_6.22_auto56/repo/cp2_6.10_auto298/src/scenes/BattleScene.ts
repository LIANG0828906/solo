import Phaser from 'phaser';
import { Piece, ElementType, Player, ELEMENT_CONFIG, isAdjacent } from '../utils/elements';

interface PieceSprite {
  piece: Piece;
  container: Phaser.GameObjects.Container;
  circle: Phaser.GameObjects.Arc;
  glow: Phaser.GameObjects.Arc;
  icon: Phaser.GameObjects.Text;
  hpBar: Phaser.GameObjects.Graphics;
  hpBarBg: Phaser.GameObjects.Graphics;
}

interface CellHighlight {
  graphics: Phaser.GameObjects.Graphics;
  gridX: number;
  gridY: number;
}

export class BattleScene extends Phaser.Scene {
  private gridSize: number = 3;
  private cellSize: number = 100;
  private gridOffsetX: number = 0;
  private gridOffsetY: number = 0;
  private board: (Piece | null)[][] = [];
  private pieceSprites: Map<string, PieceSprite> = new Map();
  private currentPlayer: Player = Player.PLAYER1;
  private selectedPiece: Piece | null = null;
  private selectedSprite: PieceSprite | null = null;
  private cellHighlights: CellHighlight[] = [];
  private placementPhase: boolean = true;
  private player1PiecesPlaced: number = 0;
  private player2PiecesPlaced: number = 0;
  private maxPiecesPerPlayer: number = 4;
  private currentElementIndex: number = 0;
  private elements: ElementType[] = [ElementType.FIRE, ElementType.WATER, ElementType.EARTH, ElementType.WIND];
  private player1Score: number = 0;
  private player2Score: number = 0;
  private isDragging: boolean = false;
  private pathPreview: Phaser.GameObjects.Graphics | null = null;
  private turnIndicator!: Phaser.GameObjects.Text;
  private scoreText!: Phaser.GameObjects.Text;
  private elementSelector!: Phaser.GameObjects.Container;
  private isAnimating: boolean = false;

  constructor() {
    super('BattleScene');
  }

  create(): void {
    const { width, height } = this.scale;
    const isMobile = width < 768;

    this.cameras.main.setBackgroundColor('#0d1117');

    this.cellSize = isMobile ? Math.min(width * 0.25, 90) : 100;
    this.gridOffsetX = width / 2 - (this.cellSize * this.gridSize) / 2;
    this.gridOffsetY = height / 2 - (this.cellSize * this.gridSize) / 2;

    this.initBoard();
    this.createGridBackground(width, height);
    this.createBoard();
    this.createUI(isMobile);
    this.createElementSelector(width, isMobile);
    this.createResetButton(width, height, isMobile);
    this.setupInput();
    this.createClickSound();

    this.updateTurnIndicator();
  }

  private initBoard(): void {
    this.board = [];
    for (let y = 0; y < this.gridSize; y++) {
      this.board[y] = [];
      for (let x = 0; x < this.gridSize; x++) {
        this.board[y][x] = null;
      }
    }
  }

  private createGridBackground(width: number, height: number): void {
    const graphics = this.add.graphics();
    graphics.lineStyle(1, 0x1a2332, 0.3);

    const gridSize = 40;
    for (let x = 0; x < width; x += gridSize) {
      graphics.beginPath();
      graphics.moveTo(x, 0);
      graphics.lineTo(x, height);
      graphics.strokePath();
    }
    for (let y = 0; y < height; y += gridSize) {
      graphics.beginPath();
      graphics.moveTo(0, y);
      graphics.lineTo(width, y);
      graphics.strokePath();
    }
  }

  private createBoard(): void {
    const boardGraphics = this.add.graphics();
    
    for (let y = 0; y < this.gridSize; y++) {
      for (let x = 0; x < this.gridSize; x++) {
        const cellX = this.gridOffsetX + x * this.cellSize;
        const cellY = this.gridOffsetY + y * this.cellSize;

        boardGraphics.fillStyle(0x1a2332, 0.6);
        boardGraphics.lineStyle(2, 0x00d4ff, 0.4);
        boardGraphics.strokeRoundedRect(cellX + 4, cellY + 4, this.cellSize - 8, this.cellSize - 8, 8);
        boardGraphics.fillRoundedRect(cellX + 4, cellY + 4, this.cellSize - 8, this.cellSize - 8, 8);

        const hitZone = this.add.zone(
          cellX + this.cellSize / 2,
          cellY + this.cellSize / 2,
          this.cellSize - 8,
          this.cellSize - 8
        ).setInteractive();

        hitZone.on('pointerup', () => {
          if (!this.isAnimating) {
            this.handleCellClick(x, y);
          }
        });
      }
    }

    const borderGraphics = this.add.graphics();
    borderGraphics.lineStyle(3, 0x00ffaa, 0.6);
    borderGraphics.strokeRoundedRect(
      this.gridOffsetX - 6,
      this.gridOffsetY - 6,
      this.cellSize * this.gridSize + 12,
      this.cellSize * this.gridSize + 12,
      16
    );
  }

  private createUI(isMobile: boolean): void {
    const uiY = isMobile ? 15 : 20;
    const fontSize = isMobile ? '14px' : '18px';

    this.turnIndicator = this.add.text(
      isMobile ? 15 : 25,
      uiY,
      '',
      {
        fontFamily: 'Segoe UI, system-ui, sans-serif',
        fontSize: fontSize,
        color: '#ffffff',
        fontStyle: 'bold'
      }
    );

    this.scoreText = this.add.text(
      isMobile ? 15 : 25,
      uiY + (isMobile ? 22 : 30),
      '',
      {
        fontFamily: 'Segoe UI, system-ui, sans-serif',
        fontSize: isMobile ? '12px' : '14px',
        color: '#8b949e'
      }
    );
  }

  private createElementSelector(width: number, isMobile: boolean): void {
    const selectorY = this.gridOffsetY + this.cellSize * this.gridSize + (isMobile ? 30 : 40);
    const elementSize = isMobile ? 40 : 50;
    const spacing = isMobile ? 12 : 16;

    this.elementSelector = this.add.container(width / 2, selectorY);

    const bgWidth = (elementSize + spacing) * this.elements.length + spacing;
    const bgHeight = elementSize + 20;

    const bg = this.add.graphics();
    bg.fillStyle(0x1a2332, 0.9);
    bg.lineStyle(2, 0x00d4ff, 0.5);
    bg.strokeRoundedRect(-bgWidth / 2, -bgHeight / 2, bgWidth, bgHeight, 12);
    bg.fillRoundedRect(-bgWidth / 2, -bgHeight / 2, bgWidth, bgHeight, 12);
    this.elementSelector.add(bg);

    const hintText = this.add.text(0, -bgHeight / 2 + 12, '选择元素放置', {
      fontFamily: 'Segoe UI, system-ui, sans-serif',
      fontSize: isMobile ? '11px' : '12px',
      color: '#00d4ff'
    }).setOrigin(0.5);
    this.elementSelector.add(hintText);

    this.elements.forEach((element, index) => {
      const config = ELEMENT_CONFIG[element];
      const x = -((this.elements.length - 1) * (elementSize + spacing)) / 2 + index * (elementSize + spacing);

      const circle = this.add.circle(x, 5, elementSize / 2 - 2, 0x0d1117)
        .setStrokeStyle(3, config.color, 0.8);

      const icon = this.add.text(x, 5, config.icon, {
        fontSize: isMobile ? '24px' : '28px'
      }).setOrigin(0.5);

      const hitZone = this.add.zone(x, 5, elementSize, elementSize)
        .setInteractive({ useHandCursor: true });

      hitZone.on('pointerover', () => {
        circle.setStrokeStyle(4, config.color, 1);
        circle.setScale(1.1);
      });

      hitZone.on('pointerout', () => {
        if (this.currentElementIndex !== index) {
          circle.setStrokeStyle(3, config.color, 0.8);
          circle.setScale(1);
        }
      });

      hitZone.on('pointerup', () => {
        this.sound.add('click').play();
        this.currentElementIndex = index;
        this.updateElementSelector();
      });

      this.elementSelector.add([circle, icon, hitZone]);
    });

    this.updateElementSelector();
  }

  private updateElementSelector(): void {
    if (!this.elementSelector) return;

    this.elementSelector.each((child: Phaser.GameObjects.GameObject) => {
      if (child instanceof Phaser.GameObjects.Arc && child.type === 'Arc') {
        child.setStrokeStyle(3, (child as any).strokeColor, 0.8);
        child.setScale(1);
      }
    });

    const selectedCircle = this.elementSelector.getAt(this.currentElementIndex * 3 + 2) as Phaser.GameObjects.Arc;
    if (selectedCircle) {
      selectedCircle.setStrokeStyle(4, ELEMENT_CONFIG[this.elements[this.currentElementIndex]].color, 1);
      selectedCircle.setScale(1.15);
    }

    this.elementSelector.setVisible(this.placementPhase);
  }

  private createResetButton(width: number, height: number, isMobile: boolean): void {
    const buttonX = width - (isMobile ? 70 : 90);
    const buttonY = height - (isMobile ? 30 : 40);
    const buttonWidth = isMobile ? 100 : 120;
    const buttonHeight = isMobile ? 35 : 45;

    const buttonBg = this.add.graphics();
    
    const drawButton = (alpha: number) => {
      buttonBg.clear();
      buttonBg.fillStyle(0xff0040, alpha);
      buttonBg.lineStyle(2, 0xff0040, 0.8);
      buttonBg.strokeRoundedRect(
        buttonX - buttonWidth / 2,
        buttonY - buttonHeight / 2,
        buttonWidth,
        buttonHeight,
        10
      );
      buttonBg.fillRoundedRect(
        buttonX - buttonWidth / 2,
        buttonY - buttonHeight / 2,
        buttonWidth,
        buttonHeight,
        10
      );
    };

    drawButton(0.3);

    const buttonText = this.add.text(buttonX, buttonY, '重置游戏', {
      fontFamily: 'Segoe UI, system-ui, sans-serif',
      fontSize: isMobile ? '12px' : '14px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    const buttonHitZone = this.add.zone(
      buttonX,
      buttonY,
      buttonWidth,
      buttonHeight
    ).setInteractive({ useHandCursor: true });

    buttonHitZone.on('pointerover', () => {
      drawButton(0.5);
      buttonText.setScale(1.05);
    });

    buttonHitZone.on('pointerout', () => {
      drawButton(0.3);
      buttonText.setScale(1);
    });

    buttonHitZone.on('pointerup', () => {
      this.sound.add('click').play();
      this.resetGame();
    });
  }

  private setupInput(): void {
    this.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      if (this.isDragging && this.selectedPiece && !this.placementPhase && !this.isAnimating) {
        this.handleDragEnd(pointer);
      }
      this.isDragging = false;
      this.clearPathPreview();
    });
  }

  private createClickSound(): void {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      this.sound.add('click', {
        mute: false,
        volume: 0.3
      });

      const clickSound = this.sound.get('click');
      if (!clickSound) {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = 800;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
        
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.1);
      }
    } catch (e) {
      console.log('Audio not supported');
    }
  }

  private handleCellClick(gridX: number, gridY: number): void {
    const piece = this.board[gridY][gridX];

    if (this.placementPhase) {
      if (!piece) {
        this.placePiece(gridX, gridY);
      }
      return;
    }

    if (this.selectedPiece) {
      if (piece && piece.player !== this.currentPlayer && !this.selectedPiece.hasActed) {
        if (isAdjacent(this.selectedPiece.gridX, this.selectedPiece.gridY, gridX, gridY)) {
          this.attackPiece(this.selectedPiece, piece);
        }
      } else if (!piece && !this.selectedPiece.hasMoved) {
        if (isAdjacent(this.selectedPiece.gridX, this.selectedPiece.gridY, gridX, gridY)) {
          this.movePiece(this.selectedPiece, gridX, gridY);
        }
      } else if (piece && piece.player === this.currentPlayer) {
        this.selectPiece(piece);
      }
    } else if (piece && piece.player === this.currentPlayer) {
      this.selectPiece(piece);
    }
  }

  private placePiece(gridX: number, gridY: number): void {
    if (this.board[gridY][gridX]) return;

    const currentPlayerPieces = this.currentPlayer === Player.PLAYER1 
      ? this.player1PiecesPlaced 
      : this.player2PiecesPlaced;

    if (currentPlayerPieces >= this.maxPiecesPerPlayer) return;

    const element = this.elements[this.currentElementIndex];
    const piece = new Piece(element, this.currentPlayer, gridX, gridY);
    
    this.board[gridY][gridX] = piece;
    this.createPieceSprite(piece);

    if (this.currentPlayer === Player.PLAYER1) {
      this.player1PiecesPlaced++;
    } else {
      this.player2PiecesPlaced++;
    }

    this.sound.add('click').play();
    this.playPlaceSound(element);
    this.createElementPlacementEffect(gridX, gridY, element);

    if (this.player1PiecesPlaced >= this.maxPiecesPerPlayer && 
        this.player2PiecesPlaced >= this.maxPiecesPerPlayer) {
      this.placementPhase = false;
      this.updateElementSelector();
      this.currentPlayer = Player.PLAYER1;
      this.resetAllPiecesTurnState();
    } else {
      this.currentPlayer = this.currentPlayer === Player.PLAYER1 ? Player.PLAYER2 : Player.PLAYER1;
      this.currentElementIndex = (this.currentElementIndex + 1) % this.elements.length;
      this.updateElementSelector();
    }

    this.updateTurnIndicator();
  }

  private createPieceSprite(piece: Piece): void {
    const config = piece.config;
    const x = this.gridOffsetX + piece.gridX * this.cellSize + this.cellSize / 2;
    const y = this.gridOffsetY + piece.gridY * this.cellSize + this.cellSize / 2;
    const radius = this.cellSize * 0.35;

    const container = this.add.container(x, y);

    const glow = this.add.circle(0, 0, radius * 1.3, config.glowColor, 0.2);
    container.add(glow);

    const circle = this.add.circle(0, 0, radius, config.color, 0.9)
      .setStrokeStyle(3, config.color, 1);
    container.add(circle);

    const playerIndicator = this.add.circle(
      radius * 0.6,
      -radius * 0.6,
      radius * 0.25,
      piece.player === Player.PLAYER1 ? 0xff0040 : 0x00d4ff
    ).setStrokeStyle(2, 0xffffff, 0.8);
    container.add(playerIndicator);

    const icon = this.add.text(0, 0, config.icon, {
      fontSize: `${radius * 1.2}px`
    }).setOrigin(0.5);
    container.add(icon);

    const hpBarBg = this.add.graphics();
    hpBarBg.fillStyle(0x30363d, 0.8);
    hpBarBg.fillRoundedRect(-radius * 0.8, radius * 0.7, radius * 1.6, 6, 3);
    container.add(hpBarBg);

    const hpBar = this.add.graphics();
    container.add(hpBar);

    this.updateHpBar(hpBar, piece, radius);

    container.setSize(this.cellSize, this.cellSize);
    container.setInteractive({
      draggable: true,
      useHandCursor: true,
      pixelPerfect: true
    });

    container.on('pointerdown', (_pointer: Phaser.Input.Pointer) => {
      if (this.isAnimating) return;
      if (piece.player !== this.currentPlayer || this.placementPhase) return;
      
      this.isDragging = true;
      this.selectPiece(piece);
    });

    container.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (!this.isDragging || this.placementPhase || this.isAnimating) return;
      this.updatePathPreview(pointer);
    });

    container.on('pointerup', () => {
      this.isDragging = false;
      this.clearPathPreview();
    });

    container.on('pointerover', () => {
      if (piece.player === this.currentPlayer && !this.placementPhase && !this.isAnimating) {
        container.setScale(1.05);
      }
    });

    container.on('pointerout', () => {
      if (!this.selectedPiece || this.selectedPiece.id !== piece.id) {
        container.setScale(1);
      }
    });

    this.tweens.add({
      targets: glow,
      scale: { from: 1, to: 1.3 },
      alpha: { from: 0.2, to: 0.4 },
      duration: 1500 + Math.random() * 500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    const pieceSprite: PieceSprite = {
      piece,
      container,
      circle,
      glow,
      icon,
      hpBar,
      hpBarBg
    };

    this.pieceSprites.set(piece.id, pieceSprite);

    container.setScale(0);
    this.tweens.add({
      targets: container,
      scale: 1,
      duration: 300,
      ease: 'Back.easeOut'
    });
  }

  private updateHpBar(hpBar: Phaser.GameObjects.Graphics, piece: Piece, radius: number): void {
    hpBar.clear();
    const hpPercent = piece.hp / piece.maxHp;
    const barWidth = radius * 1.6 * hpPercent;
    
    let color = 0x00ff00;
    if (hpPercent < 0.3) color = 0xff0000;
    else if (hpPercent < 0.6) color = 0xffaa00;
    
    hpBar.fillStyle(color, 1);
    hpBar.fillRoundedRect(-radius * 0.8, radius * 0.7, barWidth, 6, 3);
  }

  private selectPiece(piece: Piece): void {
    if (this.selectedSprite) {
      this.selectedSprite.container.setScale(1);
      this.selectedSprite.circle.setStrokeStyle(3, this.selectedSprite.piece.config.color, 1);
    }

    this.clearHighlights();

    if (this.selectedPiece && this.selectedPiece.id === piece.id) {
      this.selectedPiece = null;
      this.selectedSprite = null;
      return;
    }

    this.selectedPiece = piece;
    this.selectedSprite = this.pieceSprites.get(piece.id) || null;

    if (this.selectedSprite) {
      this.selectedSprite.container.setScale(1.15);
      this.selectedSprite.circle.setStrokeStyle(4, 0xffffff, 1);
    }

    this.highlightValidMoves(piece);
  }

  private highlightValidMoves(piece: Piece): void {
    if (this.placementPhase) return;

    const directions = [
      { dx: 0, dy: -1 },
      { dx: 0, dy: 1 },
      { dx: -1, dy: 0 },
      { dx: 1, dy: 0 }
    ];

    directions.forEach(({ dx, dy }) => {
      const newX = piece.gridX + dx;
      const newY = piece.gridY + dy;

      if (newX >= 0 && newX < this.gridSize && newY >= 0 && newY < this.gridSize) {
        const targetPiece = this.board[newY][newX];
        
        if (!targetPiece && !piece.hasMoved) {
          this.createCellHighlight(newX, newY, 0x00ffaa, 0.3);
        } else if (targetPiece && targetPiece.player !== this.currentPlayer && !piece.hasActed) {
          this.createCellHighlight(newX, newY, 0xff0040, 0.4);
        }
      }
    });
  }

  private createCellHighlight(gridX: number, gridY: number, color: number, alpha: number): void {
    const x = this.gridOffsetX + gridX * this.cellSize + this.cellSize / 2;
    const y = this.gridOffsetY + gridY * this.cellSize + this.cellSize / 2;

    const graphics = this.add.graphics();
    graphics.lineStyle(3, color, 1);
    graphics.strokeRoundedRect(
      x - this.cellSize / 2 + 6,
      y - this.cellSize / 2 + 6,
      this.cellSize - 12,
      this.cellSize - 12,
      8
    );
    graphics.fillStyle(color, alpha);
    graphics.fillRoundedRect(
      x - this.cellSize / 2 + 6,
      y - this.cellSize / 2 + 6,
      this.cellSize - 12,
      this.cellSize - 12,
      8
    );

    this.tweens.add({
      targets: graphics,
      alpha: { from: alpha, to: alpha * 0.5 },
      duration: 500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    this.cellHighlights.push({ graphics, gridX, gridY });
  }

  private clearHighlights(): void {
    this.cellHighlights.forEach(({ graphics }) => {
      graphics.destroy();
    });
    this.cellHighlights = [];
  }

  private movePiece(piece: Piece, newX: number, newY: number): void {
    this.isAnimating = true;
    const sprite = this.pieceSprites.get(piece.id);
    if (!sprite) return;

    const targetX = this.gridOffsetX + newX * this.cellSize + this.cellSize / 2;
    const targetY = this.gridOffsetY + newY * this.cellSize + this.cellSize / 2;

    this.sound.add('click').play();
    this.playMoveSound();

    this.tweens.add({
      targets: sprite.container,
      x: targetX,
      y: targetY,
      duration: 200,
      ease: 'Cubic.easeOut',
      onComplete: () => {
        this.board[piece.gridY][piece.gridX] = null;
        piece.gridX = newX;
        piece.gridY = newY;
        this.board[newY][newX] = piece;
        piece.hasMoved = true;

        this.createMoveEffect(newX, newY, piece.element);
        this.clearHighlights();
        this.highlightValidMoves(piece);
        
        this.isAnimating = false;
        this.checkTurnEnd();
      }
    });
  }

  private attackPiece(attacker: Piece, defender: Piece): void {
    this.isAnimating = true;
    const attackerSprite = this.pieceSprites.get(attacker.id);
    const defenderSprite = this.pieceSprites.get(defender.id);

    if (!attackerSprite || !defenderSprite) return;

    const attackerOriginalX = attackerSprite.container.x;
    const attackerOriginalY = attackerSprite.container.y;

    this.sound.add('click').play();
    this.playAttackSound(attacker.element);

    this.tweens.add({
      targets: attackerSprite.container,
      x: defenderSprite.container.x,
      y: defenderSprite.container.y,
      duration: 150,
      ease: 'Cubic.easeOut',
      onComplete: () => {
        const result = defender.takeDamage(attacker.attack, attacker.element);
        
        this.showDamageNumber(defender, result.damage, result.isEffective);
        this.createAttackEffect(defender.gridX, defender.gridY, defender.element, attacker.element);
        this.updateHpBar(defenderSprite.hpBar, defender, this.cellSize * 0.35);

        this.tweens.add({
          targets: defenderSprite.container,
          x: defenderSprite.container.x + Phaser.Math.Between(-5, 5),
          y: defenderSprite.container.y + Phaser.Math.Between(-5, 5),
          duration: 50,
          yoyo: true,
          repeat: 3,
          ease: 'Linear'
        });

        this.tweens.add({
          targets: attackerSprite.container,
          x: attackerOriginalX,
          y: attackerOriginalY,
          duration: 150,
          ease: 'Cubic.easeIn',
          delay: 100,
          onComplete: () => {
            attacker.hasActed = true;

            if (defender.isDead()) {
              this.removePiece(defender);
            }

            this.clearHighlights();
            
            this.time.delayedCall(200, () => {
              this.isAnimating = false;
              
              if (!this.checkGameEnd()) {
                this.highlightValidMoves(attacker);
                this.checkTurnEnd();
              }
            });
          }
        });
      }
    });
  }

  private removePiece(piece: Piece): void {
    const sprite = this.pieceSprites.get(piece.id);
    if (!sprite) return;

    if (piece.player === Player.PLAYER1) {
      this.player2Score++;
    } else {
      this.player1Score++;
    }

    this.createDeathEffect(piece.gridX, piece.gridY, piece.element);

    this.tweens.add({
      targets: sprite.container,
      scale: 0,
      alpha: 0,
      duration: 300,
      ease: 'Cubic.easeIn',
      onComplete: () => {
        sprite.container.destroy();
        this.pieceSprites.delete(piece.id);
        this.board[piece.gridY][piece.gridX] = null;
      }
    });
  }

  private handleDragEnd(pointer: Phaser.Input.Pointer): void {
    if (!this.selectedPiece) return;

    const gridX = Math.floor((pointer.x - this.gridOffsetX) / this.cellSize);
    const gridY = Math.floor((pointer.y - this.gridOffsetY) / this.cellSize);

    if (gridX >= 0 && gridX < this.gridSize && gridY >= 0 && gridY < this.gridSize) {
      const targetPiece = this.board[gridY][gridX];

      if (!targetPiece && !this.selectedPiece.hasMoved) {
        if (isAdjacent(this.selectedPiece.gridX, this.selectedPiece.gridY, gridX, gridY)) {
          this.movePiece(this.selectedPiece, gridX, gridY);
        }
      } else if (targetPiece && targetPiece.player !== this.currentPlayer && !this.selectedPiece.hasActed) {
        if (isAdjacent(this.selectedPiece.gridX, this.selectedPiece.gridY, gridX, gridY)) {
          this.attackPiece(this.selectedPiece, targetPiece);
        }
      }
    }
  }

  private updatePathPreview(pointer: Phaser.Input.Pointer): void {
    if (!this.selectedPiece) return;

    this.clearPathPreview();

    const startX = this.gridOffsetX + this.selectedPiece.gridX * this.cellSize + this.cellSize / 2;
    const startY = this.gridOffsetY + this.selectedPiece.gridY * this.cellSize + this.cellSize / 2;

    const gridX = Math.floor((pointer.x - this.gridOffsetX) / this.cellSize);
    const gridY = Math.floor((pointer.y - this.gridOffsetY) / this.cellSize);

    let isValid = false;
    let color = 0xff0040;

    if (gridX >= 0 && gridX < this.gridSize && gridY >= 0 && gridY < this.gridSize) {
      const targetPiece = this.board[gridY][gridX];
      
      if (isAdjacent(this.selectedPiece.gridX, this.selectedPiece.gridY, gridX, gridY)) {
        if (!targetPiece && !this.selectedPiece.hasMoved) {
          isValid = true;
          color = 0x00ffaa;
        } else if (targetPiece && targetPiece.player !== this.currentPlayer && !this.selectedPiece.hasActed) {
          isValid = true;
          color = 0xff0040;
        }
      }
    }

    const endX = this.gridOffsetX + gridX * this.cellSize + this.cellSize / 2;
    const endY = this.gridOffsetY + gridY * this.cellSize + this.cellSize / 2;

    this.pathPreview = this.add.graphics();
    this.pathPreview.lineStyle(3, color, isValid ? 0.8 : 0.3);
    this.pathPreview.beginPath();
    this.pathPreview.moveTo(startX, startY);
    this.pathPreview.lineTo(endX, endY);
    this.pathPreview.strokePath();

    this.pathPreview.fillStyle(color, isValid ? 0.4 : 0.2);
    this.pathPreview.fillCircle(endX, endY, 15);
  }

  private clearPathPreview(): void {
    if (this.pathPreview) {
      this.pathPreview.destroy();
      this.pathPreview = null;
    }
  }

  private showDamageNumber(defender: Piece, damage: number, isEffective: boolean): void {
    const sprite = this.pieceSprites.get(defender.id);
    if (!sprite) return;

    const text = this.add.text(
      sprite.container.x,
      sprite.container.y - 30,
      `-${damage}`,
      {
        fontFamily: 'Segoe UI, system-ui, sans-serif',
        fontSize: '24px',
        color: isEffective ? '#ff0040' : '#ffffff',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 3
      }
    ).setOrigin(0.5);

    if (isEffective) {
      const effectiveText = this.add.text(
        sprite.container.x,
        sprite.container.y - 55,
        '克制!',
        {
          fontFamily: 'Segoe UI, system-ui, sans-serif',
          fontSize: '14px',
          color: '#ff0040',
          fontStyle: 'bold',
          stroke: '#000000',
          strokeThickness: 2
        }
      ).setOrigin(0.5);

      this.tweens.add({
        targets: effectiveText,
        y: effectiveText.y - 20,
        alpha: 0,
        scale: { from: 1, to: 1.5 },
        duration: 800,
        ease: 'Cubic.easeOut',
        onComplete: () => effectiveText.destroy()
      });
    }

    this.tweens.add({
      targets: text,
      y: text.y - 40,
      alpha: 0,
      scale: { from: 1, to: 1.3 },
      duration: 800,
      ease: 'Cubic.easeOut',
      onComplete: () => text.destroy()
    });
  }

  private createAttackEffect(gridX: number, gridY: number, _defenderElement: ElementType, attackerElement: ElementType): void {
    const x = this.gridOffsetX + gridX * this.cellSize + this.cellSize / 2;
    const y = this.gridOffsetY + gridY * this.cellSize + this.cellSize / 2;

    const config = ELEMENT_CONFIG[attackerElement];
    const particleCount = 15;

    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 * i) / particleCount + Math.random() * 0.5;
      const speed = Phaser.Math.Between(50, 150);
      const size = Phaser.Math.Between(4, 10);

      let particle: Phaser.GameObjects.Shape;
      
      switch (attackerElement) {
        case ElementType.FIRE:
          particle = this.add.circle(
            x + Phaser.Math.Between(-10, 10),
            y + Phaser.Math.Between(-10, 10),
            size,
            config.color
          );
          break;
        case ElementType.WATER:
          particle = this.add.ellipse(
            x + Phaser.Math.Between(-10, 10),
            y + Phaser.Math.Between(-10, 10),
            size,
            size * 1.5,
            config.color
          );
          break;
        case ElementType.EARTH:
          particle = this.add.rectangle(
            x + Phaser.Math.Between(-10, 10),
            y + Phaser.Math.Between(-10, 10),
            size,
            size,
            config.color
          );
          break;
        case ElementType.WIND:
          particle = this.add.triangle(
            x + Phaser.Math.Between(-10, 10),
            y + Phaser.Math.Between(-10, 10),
            0, -size,
            size * 0.866, size * 0.5,
            -size * 0.866, size * 0.5,
            config.color
          );
          break;
        default:
          particle = this.add.circle(x, y, size, config.color);
      }

      particle.setAlpha(0.9);

      this.tweens.add({
        targets: particle,
        x: particle.x + Math.cos(angle) * speed,
        y: particle.y + Math.sin(angle) * speed,
        alpha: 0,
        scale: { from: 1, to: 0.3 },
        duration: Phaser.Math.Between(300, 600),
        ease: 'Cubic.easeOut',
        onComplete: () => particle.destroy()
      });
    }

    const flash = this.add.circle(x, y, this.cellSize * 0.4, config.color, 0.5);
    this.tweens.add({
      targets: flash,
      scale: { from: 0.5, to: 2 },
      alpha: 0,
      duration: 300,
      ease: 'Cubic.easeOut',
      onComplete: () => flash.destroy()
    });
  }

  private createMoveEffect(gridX: number, gridY: number, element: ElementType): void {
    const x = this.gridOffsetX + gridX * this.cellSize + this.cellSize / 2;
    const y = this.gridOffsetY + gridY * this.cellSize + this.cellSize / 2;
    const config = ELEMENT_CONFIG[element];

    const ring = this.add.circle(x, y, this.cellSize * 0.3, config.color, 0)
      .setStrokeStyle(3, config.color, 0.8);

    this.tweens.add({
      targets: ring,
      scale: { from: 0.5, to: 1.5 },
      alpha: 0,
      duration: 400,
      ease: 'Cubic.easeOut',
      onComplete: () => ring.destroy()
    });
  }

  private createElementPlacementEffect(gridX: number, gridY: number, element: ElementType): void {
    const x = this.gridOffsetX + gridX * this.cellSize + this.cellSize / 2;
    const y = this.gridOffsetY + gridY * this.cellSize + this.cellSize / 2;
    const config = ELEMENT_CONFIG[element];

    for (let i = 0; i < 3; i++) {
      const ring = this.add.circle(x, y, this.cellSize * 0.2 * (i + 1), config.color, 0)
        .setStrokeStyle(2, config.color, 0.6);

      this.tweens.add({
        targets: ring,
        scale: { from: 0, to: 2 },
        alpha: 0,
        duration: 500,
        delay: i * 100,
        ease: 'Cubic.easeOut',
        onComplete: () => ring.destroy()
      });
    }
  }

  private createDeathEffect(gridX: number, gridY: number, element: ElementType): void {
    const x = this.gridOffsetX + gridX * this.cellSize + this.cellSize / 2;
    const y = this.gridOffsetY + gridY * this.cellSize + this.cellSize / 2;
    const config = ELEMENT_CONFIG[element];

    for (let i = 0; i < 20; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Phaser.Math.Between(80, 200);
      
      const particle = this.add.circle(
        x,
        y,
        Phaser.Math.Between(3, 8),
        config.color
      );

      this.tweens.add({
        targets: particle,
        x: particle.x + Math.cos(angle) * speed,
        y: particle.y + Math.sin(angle) * speed,
        alpha: 0,
        scale: { from: 1, to: 0 },
        duration: Phaser.Math.Between(400, 800),
        ease: 'Cubic.easeOut',
        onComplete: () => particle.destroy()
      });
    }
  }

  private checkTurnEnd(): void {
    if (this.placementPhase) return;

    if (!this.selectedPiece) return;

    if (this.selectedPiece.hasMoved && this.selectedPiece.hasActed) {
      this.endTurn();
    }
  }

  public endTurn(): void {
    if (this.selectedSprite) {
      this.selectedSprite.container.setScale(1);
    }

    this.selectedPiece = null;
    this.selectedSprite = null;
    this.clearHighlights();
    this.clearPathPreview();

    this.currentPlayer = this.currentPlayer === Player.PLAYER1 ? Player.PLAYER2 : Player.PLAYER1;
    this.resetAllPiecesTurnState();
    this.updateTurnIndicator();
  }

  private resetAllPiecesTurnState(): void {
    for (let y = 0; y < this.gridSize; y++) {
      for (let x = 0; x < this.gridSize; x++) {
        const piece = this.board[y][x];
        if (piece) {
          piece.hasMoved = false;
          piece.hasActed = false;
        }
      }
    }
  }

  private checkGameEnd(): boolean {
    let player1HasPieces = false;
    let player2HasPieces = false;

    for (let y = 0; y < this.gridSize; y++) {
      for (let x = 0; x < this.gridSize; x++) {
        const piece = this.board[y][x];
        if (piece) {
          if (piece.player === Player.PLAYER1) player1HasPieces = true;
          if (piece.player === Player.PLAYER2) player2HasPieces = true;
        }
      }
    }

    if (!player1HasPieces || !player2HasPieces) {
      const winner = player1HasPieces ? Player.PLAYER1 : Player.PLAYER2;
      this.time.delayedCall(500, () => {
        this.scene.start('GameOverScene', {
          winner,
          player1Score: this.player1Score,
          player2Score: this.player2Score
        });
      });
      return true;
    }

    return false;
  }

  private updateTurnIndicator(): void {
    const playerColor = this.currentPlayer === Player.PLAYER1 ? '#ff0040' : '#00d4ff';
    const playerName = this.currentPlayer === Player.PLAYER1 ? '玩家1' : '玩家2';
    const phaseText = this.placementPhase ? '放置阶段' : '战斗阶段';
    
    if (this.turnIndicator) {
      this.turnIndicator.setText(`[${phaseText}] ${playerName}回合`);
      this.turnIndicator.setColor(playerColor);
    }

    if (this.scoreText) {
      this.scoreText.setText(`比分: ${this.player1Score} - ${this.player2Score}`);
    }
  }

  private resetGame(): void {
    this.pieceSprites.forEach((sprite) => {
      sprite.container.destroy();
    });
    this.pieceSprites.clear();

    this.initBoard();
    this.selectedPiece = null;
    this.selectedSprite = null;
    this.currentPlayer = Player.PLAYER1;
    this.placementPhase = true;
    this.player1PiecesPlaced = 0;
    this.player2PiecesPlaced = 0;
    this.player1Score = 0;
    this.player2Score = 0;
    this.currentElementIndex = 0;
    this.isAnimating = false;

    this.clearHighlights();
    this.clearPathPreview();
    this.updateElementSelector();
    this.updateTurnIndicator();
  }

  private playPlaceSound(element: ElementType): void {
    this.playTone(ELEMENT_CONFIG[element].color, 0.15, 600);
  }

  private playMoveSound(): void {
    this.playTone(0x00ffaa, 0.1, 400);
  }

  private playAttackSound(element: ElementType): void {
    this.playTone(ELEMENT_CONFIG[element].color, 0.2, 800);
  }

  private playTone(color: number, duration: number, baseFreq: number): void {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      const hue = (color % 360);
      const freq = baseFreq + (hue / 360) * 400;
      oscillator.frequency.value = freq;
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.15, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
      
      oscillator.start();
      oscillator.stop(audioContext.currentTime + duration);
    } catch (e) {
    }
  }
}
