import { Dungeon, Player, Room, RoomType, InputState, GameState } from './types';

const ROOM_COLORS: Record<RoomType, string> = {
  [RoomType.CORE]: '#8B0000',
  [RoomType.TREASURE]: '#FFD700',
  [RoomType.MONSTER]: '#800080',
  [RoomType.CORRIDOR]: '#A0A0A0',
  [RoomType.EMPTY]: '#1A1A1A'
};

const ROOM_LABELS: Record<RoomType, string> = {
  [RoomType.CORE]: '核心房间',
  [RoomType.TREASURE]: '宝箱房间',
  [RoomType.MONSTER]: '怪物房间',
  [RoomType.CORRIDOR]: '通道',
  [RoomType.EMPTY]: '空房间'
};

export class UIOverlay {
  private container: HTMLElement;
  private gameCanvas: HTMLCanvasElement;
  private infoPanel: HTMLElement;
  private seedInput!: HTMLInputElement;
  private generateBtn!: HTMLButtonElement;
  private statusDiv!: HTMLElement;
  private mapCanvas!: HTMLCanvasElement;
  private mapContainer: HTMLElement;

  private inputState: InputState;
  private onGenerate: ((seed: number) => void) | null = null;
  private onRoomClick: ((x: number, y: number) => void) | null = null;
  private onBackToTopdown: (() => void) | null = null;

  private showMap: boolean = false;
  private mapBlinkTimer: number = 0;
  private mouseSensitivity: number = 0.3;

  constructor(container: HTMLElement) {
    this.container = container;
    this.inputState = this.createInitialInputState();

    this.gameCanvas = document.createElement('canvas');
    this.gameCanvas.width = 800;
    this.gameCanvas.height = 600;
    this.gameCanvas.style.background = '#000000';
    this.gameCanvas.style.cursor = 'crosshair';
    this.gameCanvas.style.imageRendering = 'pixelated';

    const gameView = document.createElement('div');
    gameView.style.flex = '0 0 75%';
    gameView.style.minWidth = '600px';
    gameView.style.display = 'flex';
    gameView.style.alignItems = 'center';
    gameView.style.justifyContent = 'center';
    gameView.style.padding = '16px';
    gameView.appendChild(this.gameCanvas);

    this.infoPanel = this.createInfoPanel();
    this.mapContainer = this.createMapOverlay();

    this.container.style.display = 'flex';
    this.container.style.width = '100%';
    this.container.style.height = '100%';
    this.container.style.minWidth = '1280px';
    this.container.appendChild(gameView);
    this.container.appendChild(this.infoPanel);
    this.container.appendChild(this.mapContainer);

    this.setupEventListeners();
  }

  private createInitialInputState(): InputState {
    return {
      w: false, a: false, s: false, d: false, m: false,
      mouseDown: false, mouseX: 0, mouseY: 0,
      isDragging: false, lastMouseX: 0
    };
  }

  private createInfoPanel(): HTMLElement {
    const panel = document.createElement('div');
    panel.style.flex = '0 0 25%';
    panel.style.minWidth = '180px';
    panel.style.maxWidth = '220px';
    panel.style.background = 'linear-gradient(180deg, #2B2B2B 0%, #1A1A1A 100%)';
    panel.style.padding = '20px';
    panel.style.boxSizing = 'border-box';
    panel.style.display = 'flex';
    panel.style.flexDirection = 'column';
    panel.style.gap = '20px';
    panel.style.borderLeft = '1px solid #333';

    const title = document.createElement('h1');
    title.textContent = '地下城生成器';
    title.style.color = '#FFD700';
    title.style.fontSize = '18px';
    title.style.margin = '0 0 10px 0';
    title.style.textAlign = 'center';

    const seedLabel = document.createElement('label');
    seedLabel.textContent = '种子值:';
    seedLabel.style.color = '#808080';
    seedLabel.style.fontSize = '12px';
    seedLabel.style.display = 'block';
    seedLabel.style.marginBottom = '5px';

    this.seedInput = document.createElement('input');
    this.seedInput.type = 'number';
    this.seedInput.value = Date.now().toString();
    this.seedInput.style.width = '100%';
    this.seedInput.style.padding = '8px';
    this.seedInput.style.background = '#333';
    this.seedInput.style.border = '1px solid #555';
    this.seedInput.style.borderRadius = '4px';
    this.seedInput.style.color = '#808080';
    this.seedInput.style.fontSize = '12px';
    this.seedInput.style.boxSizing = 'border-box';

    this.generateBtn = document.createElement('button');
    this.generateBtn.textContent = '生成地下城';
    this.generateBtn.style.width = '120px';
    this.generateBtn.style.height = '40px';
    this.generateBtn.style.margin = '0 auto';
    this.generateBtn.style.background = 'linear-gradient(180deg, #555555 0%, #333333 100%)';
    this.generateBtn.style.border = 'none';
    this.generateBtn.style.borderRadius = '8px';
    this.generateBtn.style.color = '#FFD700';
    this.generateBtn.style.fontSize = '12px';
    this.generateBtn.style.fontWeight = 'bold';
    this.generateBtn.style.cursor = 'pointer';
    this.generateBtn.style.transition = 'all 0.2s ease';
    this.generateBtn.style.display = 'block';

    const legend = this.createLegend();
    this.statusDiv = this.createStatusDiv();

    const controlsDiv = document.createElement('div');
    controlsDiv.style.marginTop = 'auto';
    controlsDiv.style.paddingTop = '15px';
    controlsDiv.style.borderTop = '1px solid #333';

    const controlsTitle = document.createElement('div');
    controlsTitle.textContent = '操作说明';
    controlsTitle.style.color = '#FFD700';
    controlsTitle.style.fontSize = '12px';
    controlsTitle.style.marginBottom = '8px';
    controlsTitle.style.fontWeight = 'bold';

    const controlsList = document.createElement('div');
    controlsList.style.fontSize = '11px';
    controlsList.style.lineHeight = '1.8';
    controlsList.innerHTML = `
      <div><span style="color:#FFD700">WASD</span> - 移动</div>
      <div><span style="color:#FFD700">鼠标拖拽</span> - 旋转视角</div>
      <div><span style="color:#FFD700">左键</span> - 发射火球</div>
      <div><span style="color:#FFD700">M</span> - 切换地图</div>
      <div><span style="color:#FFD700">ESC</span> - 返回俯视图</div>
      <div><span style="color:#FFD700">点击房间</span> - 进入探索</div>
    `;

    controlsDiv.appendChild(controlsTitle);
    controlsDiv.appendChild(controlsList);

    panel.appendChild(title);
    panel.appendChild(seedLabel);
    panel.appendChild(this.seedInput);
    panel.appendChild(this.generateBtn);
    panel.appendChild(legend);
    panel.appendChild(this.statusDiv);
    panel.appendChild(controlsDiv);

    return panel;
  }

  private createLegend(): HTMLElement {
    const legend = document.createElement('div');
    legend.style.display = 'grid';
    legend.style.gridTemplateColumns = '1fr';
    legend.style.gap = '8px';
    legend.style.marginTop = '10px';

    const legendTitle = document.createElement('div');
    legendTitle.textContent = '房间类型';
    legendTitle.style.color = '#FFD700';
    legendTitle.style.fontSize = '12px';
    legendTitle.style.fontWeight = 'bold';
    legendTitle.style.marginBottom = '5px';
    legend.appendChild(legendTitle);

    const types: RoomType[] = [RoomType.CORE, RoomType.TREASURE, RoomType.MONSTER, RoomType.CORRIDOR];
    for (const type of types) {
      const item = document.createElement('div');
      item.style.display = 'flex';
      item.style.alignItems = 'center';
      item.style.gap = '8px';

      const dot = document.createElement('span');
      dot.style.width = '12px';
      dot.style.height = '12px';
      dot.style.borderRadius = '50%';
      dot.style.background = ROOM_COLORS[type];
      dot.style.flexShrink = '0';

      const label = document.createElement('span');
      label.textContent = ROOM_LABELS[type];
      label.style.color = '#808080';
      label.style.fontSize = '11px';

      item.appendChild(dot);
      item.appendChild(label);
      legend.appendChild(item);
    }

    return legend;
  }

  private createStatusDiv(): HTMLElement {
    const status = document.createElement('div');
    status.style.background = 'rgba(0,0,0,0.3)';
    status.style.padding = '12px';
    status.style.borderRadius = '6px';
    status.style.fontSize = '11px';
    status.style.lineHeight = '1.8';

    const statusTitle = document.createElement('div');
    statusTitle.textContent = '状态';
    statusTitle.style.color = '#FFD700';
    statusTitle.style.fontWeight = 'bold';
    statusTitle.style.marginBottom = '8px';
    statusTitle.style.fontSize = '12px';
    status.appendChild(statusTitle);

    return status;
  }

  private createMapOverlay(): HTMLElement {
    const container = document.createElement('div');
    container.id = 'map-overlay';
    container.style.position = 'absolute';
    container.style.top = '16px';
    container.style.left = '16px';
    container.style.width = '300px';
    container.style.height = '300px';
    container.style.background = 'rgba(0, 0, 0, 0.67)';
    container.style.borderRadius = '8px';
    container.style.padding = '10px';
    container.style.boxSizing = 'border-box';
    container.style.display = 'none';
    container.style.zIndex = '100';
    container.style.backdropFilter = 'blur(4px)';

    const title = document.createElement('div');
    title.textContent = '地下城地图';
    title.style.color = '#FFD700';
    title.style.fontSize = '12px';
    title.style.fontWeight = 'bold';
    title.style.marginBottom = '8px';
    title.style.textAlign = 'center';

    this.mapCanvas = document.createElement('canvas');
    this.mapCanvas.width = 280;
    this.mapCanvas.height = 250;
    this.mapCanvas.style.display = 'block';
    this.mapCanvas.style.margin = '0 auto';

    const hint = document.createElement('div');
    hint.textContent = '按 M 键关闭地图';
    hint.style.color = '#666';
    hint.style.fontSize = '10px';
    hint.style.textAlign = 'center';
    hint.style.marginTop = '5px';

    container.appendChild(title);
    container.appendChild(this.mapCanvas);
    container.appendChild(hint);

    return container;
  }

  private setupEventListeners(): void {
    document.addEventListener('keydown', (e) => this.handleKeyDown(e));
    document.addEventListener('keyup', (e) => this.handleKeyUp(e));

    this.gameCanvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
    this.gameCanvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
    this.gameCanvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
    this.gameCanvas.addEventListener('click', (e) => this.handleCanvasClick(e));
    this.gameCanvas.addEventListener('contextmenu', (e) => e.preventDefault());

    this.generateBtn.addEventListener('click', () => this.handleGenerate());

    this.generateBtn.addEventListener('mouseenter', () => {
      this.generateBtn.style.filter = 'brightness(1.15)';
    });
    this.generateBtn.addEventListener('mouseleave', () => {
      this.generateBtn.style.filter = 'brightness(1)';
    });
    this.generateBtn.addEventListener('mousedown', () => {
      this.generateBtn.style.transform = 'scale(0.95)';
      this.generateBtn.style.filter = 'brightness(1.2)';
    });
    this.generateBtn.addEventListener('mouseup', () => {
      this.generateBtn.style.transform = 'scale(1)';
      this.generateBtn.style.filter = 'brightness(1.15)';
    });
  }

  private handleKeyDown(e: KeyboardEvent): void {
    const key = e.key.toLowerCase();
    if (key === 'w') this.inputState.w = true;
    if (key === 'a') this.inputState.a = true;
    if (key === 's') this.inputState.s = true;
    if (key === 'd') this.inputState.d = true;
    if (key === 'm' && !e.repeat) {
      this.showMap = !this.showMap;
      this.mapContainer.style.display = this.showMap ? 'block' : 'none';
    }
    if (key === 'escape' && this.onBackToTopdown) {
      this.onBackToTopdown();
    }
  }

  private handleKeyUp(e: KeyboardEvent): void {
    const key = e.key.toLowerCase();
    if (key === 'w') this.inputState.w = false;
    if (key === 'a') this.inputState.a = false;
    if (key === 's') this.inputState.s = false;
    if (key === 'd') this.inputState.d = false;
  }

  private handleMouseDown(e: MouseEvent): void {
    if (e.button === 0) {
      this.inputState.mouseDown = true;
      this.inputState.isDragging = true;
      this.inputState.lastMouseX = e.clientX;
    }
  }

  private handleMouseUp(e: MouseEvent): void {
    if (e.button === 0) {
      this.inputState.mouseDown = false;
      this.inputState.isDragging = false;
    }
  }

  private handleMouseMove(e: MouseEvent): void {
    const rect = this.gameCanvas.getBoundingClientRect();
    this.inputState.mouseX = e.clientX - rect.left;
    this.inputState.mouseY = e.clientY - rect.top;

    if (this.inputState.isDragging) {
      const deltaX = e.clientX - this.inputState.lastMouseX;
      this.inputState.lastMouseX = e.clientX;
      (this.inputState as any).deltaX = deltaX * this.mouseSensitivity * 0.01;
    }
  }

  private handleCanvasClick(e: MouseEvent): void {
    if (this.onRoomClick) {
      const rect = this.gameCanvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      this.onRoomClick(x, y);
    }
  }

  private handleGenerate(): void {
    if (this.onGenerate) {
      const seed = parseInt(this.seedInput.value) || Date.now();
      this.onGenerate(seed);
    }
  }

  getInputState(): InputState {
    const state = { ...this.inputState };
    (this.inputState as any).deltaX = 0;
    return state;
  }

  getGameCanvas(): HTMLCanvasElement {
    return this.gameCanvas;
  }

  setOnGenerate(callback: (seed: number) => void): void {
    this.onGenerate = callback;
  }

  setOnRoomClick(callback: (x: number, y: number) => void): void {
    this.onRoomClick = callback;
  }

  setOnBackToTopdown(callback: () => void): void {
    this.onBackToTopdown = callback;
  }

  updateStatus(dungeon: Dungeon, player: Player, currentRoom: Room, gameState: GameState): void {
    const enemiesAlive = currentRoom.enemies.filter(e => e.alive).length;

    let totalTreasures = 0;
    for (let y = 0; y < dungeon.gridHeight; y++) {
      for (let x = 0; x < dungeon.gridWidth; x++) {
        totalTreasures += dungeon.rooms[y][x].treasures;
      }
    }

    let statusHTML = `
      <div>当前房间: <span style="color:${ROOM_COLORS[currentRoom.type]}">${ROOM_LABELS[currentRoom.type]}</span></div>
      <div>敌人存活: <span style="color:${enemiesAlive > 0 ? '#FF6B6B' : '#4ECDC4'}">${enemiesAlive}</span></div>
      <div>宝箱收集: <span style="color:#FFD700">${player.treasuresCollected}/${totalTreasures}</span></div>
    `;

    if (gameState === GameState.TOPDOWN) {
      statusHTML += `<div style="margin-top:8px;color:#666">点击房间进入探索</div>`;
    } else if (gameState === GameState.FIRSTPERSON) {
      statusHTML += `<div style="margin-top:8px;color:#666">位置: (${player.x.toFixed(1)}, ${player.y.toFixed(1)})</div>`;
    }

    this.statusDiv.innerHTML = statusHTML;
  }

  renderTopdown(dungeon: Dungeon, _player: Player): void {
    const ctx = this.gameCanvas.getContext('2d')!;
    const canvas = this.gameCanvas;

    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const margin = 40;
    const availableWidth = canvas.width - margin * 2;
    const availableHeight = canvas.height - margin * 2;
    const cellSize = Math.min(availableWidth / dungeon.gridWidth, availableHeight / dungeon.gridHeight);
    const offsetX = margin + (availableWidth - cellSize * dungeon.gridWidth) / 2;
    const offsetY = margin + (availableHeight - cellSize * dungeon.gridHeight) / 2;

    for (let y = 0; y < dungeon.gridHeight; y++) {
      for (let x = 0; x < dungeon.gridWidth; x++) {
        const room = dungeon.rooms[y][x];
        const px = offsetX + x * cellSize;
        const py = offsetY + y * cellSize;
        const padding = 2;

        if (room.type === RoomType.EMPTY) {
          ctx.fillStyle = '#222';
          ctx.fillRect(px + padding, py + padding, cellSize - padding * 2, cellSize - padding * 2);
        } else {
          const color = ROOM_COLORS[room.type];

          if (room.clearFlashTimer > 0) {
            const flashIntensity = room.clearFlashTimer / 0.5;
            ctx.fillStyle = `rgba(0, 255, 0, ${flashIntensity * 0.5})`;
            ctx.fillRect(px + padding, py + padding, cellSize - padding * 2, cellSize - padding * 2);
          }

          ctx.fillStyle = room.explored ? color : this.darkenColor(color, 0.5);
          ctx.fillRect(px + padding, py + padding, cellSize - padding * 2, cellSize - padding * 2);

          ctx.strokeStyle = '#404040';
          ctx.lineWidth = 2;

          const mid = cellSize / 2;
          const doorSize = Math.min(cellSize * 0.3, 12);

          if (room.connections.north) {
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(px + mid - doorSize / 2, py, doorSize, 4);
          } else {
            ctx.fillStyle = '#404040';
            ctx.fillRect(px + padding, py, cellSize - padding * 2, 3);
          }

          if (room.connections.south) {
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(px + mid - doorSize / 2, py + cellSize - 4, doorSize, 4);
          } else {
            ctx.fillStyle = '#404040';
            ctx.fillRect(px + padding, py + cellSize - 3, cellSize - padding * 2, 3);
          }

          if (room.connections.west) {
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(px, py + mid - doorSize / 2, 4, doorSize);
          } else {
            ctx.fillStyle = '#404040';
            ctx.fillRect(px, py + padding, 3, cellSize - padding * 2);
          }

          if (room.connections.east) {
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(px + cellSize - 4, py + mid - doorSize / 2, 4, doorSize);
          } else {
            ctx.fillStyle = '#404040';
            ctx.fillRect(px + cellSize - 3, py + padding, 3, cellSize - padding * 2);
          }

          if (room.type === RoomType.CORE) {
            ctx.fillStyle = '#FFD700';
            ctx.font = `${Math.floor(cellSize * 0.4)}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('★', px + cellSize / 2, py + cellSize / 2);
          } else if (room.type === RoomType.TREASURE && room.treasures > 0) {
            ctx.fillStyle = '#FFFFFF';
            ctx.font = `${Math.floor(cellSize * 0.4)}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('◆', px + cellSize / 2, py + cellSize / 2);
          } else if (room.type === RoomType.MONSTER) {
            const aliveCount = room.enemies.filter(e => e.alive).length;
            if (aliveCount > 0) {
              ctx.fillStyle = '#FF0000';
              ctx.font = `${Math.floor(cellSize * 0.35)}px Arial`;
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillText('☠', px + cellSize / 2, py + cellSize / 2);
            }
          }
        }
      }
    }

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`种子: ${dungeon.seed}`, 10, 20);
    ctx.fillText(`网格: ${dungeon.gridWidth}x${dungeon.gridHeight}`, 10, 38);
  }

  renderMap(dungeon: Dungeon, player: Player, gameState: GameState): void {
    if (!this.showMap) return;

    const ctx = this.mapCanvas.getContext('2d')!;
    const canvas = this.mapCanvas;

    ctx.fillStyle = 'rgba(0, 0, 0, 0)';
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const margin = 10;
    const availableWidth = canvas.width - margin * 2;
    const availableHeight = canvas.height - margin * 2;
    const cellSize = Math.min(availableWidth / dungeon.gridWidth, availableHeight / dungeon.gridHeight);
    const offsetX = margin + (availableWidth - cellSize * dungeon.gridWidth) / 2;
    const offsetY = margin + (availableHeight - cellSize * dungeon.gridHeight) / 2;

    for (let y = 0; y < dungeon.gridHeight; y++) {
      for (let x = 0; x < dungeon.gridWidth; x++) {
        const room = dungeon.rooms[y][x];
        const px = offsetX + x * cellSize;
        const py = offsetY + y * cellSize;
        const padding = 1;

        if (!room.explored) {
          ctx.fillStyle = '#111';
        } else if (room.type === RoomType.EMPTY) {
          ctx.fillStyle = '#222';
        } else {
          ctx.fillStyle = ROOM_COLORS[room.type];
        }

        ctx.fillRect(px + padding, py + padding, cellSize - padding * 2, cellSize - padding * 2);
      }
    }

    this.mapBlinkTimer += 0.016;
    const blinkVisible = Math.sin(this.mapBlinkTimer * Math.PI * 2) > 0;

    if (blinkVisible) {
      const px = offsetX + player.currentRoomX * cellSize + cellSize / 2;
      const py = offsetY + player.currentRoomY * cellSize + cellSize / 2;
      const size = 6;

      let angle = 0;
      if (gameState === GameState.FIRSTPERSON) {
        angle = player.angle;
      }

      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(angle - Math.PI / 2);

      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.moveTo(0, -size);
      ctx.lineTo(-size * 0.866, size * 0.5);
      ctx.lineTo(size * 0.866, size * 0.5);
      ctx.closePath();
      ctx.fill();

      ctx.restore();
    }
  }

  renderTransition(progress: number): void {
    const ctx = this.gameCanvas.getContext('2d')!;
    const alpha = progress < 0.5 ? progress * 2 : (1 - progress) * 2;
    ctx.fillStyle = `rgba(0, 0, 0, ${alpha})`;
    ctx.fillRect(0, 0, this.gameCanvas.width, this.gameCanvas.height);
  }

  getTopdownRoomAt(x: number, y: number, dungeon: Dungeon): { gridX: number; gridY: number } | null {
    const canvas = this.gameCanvas;
    const margin = 40;
    const availableWidth = canvas.width - margin * 2;
    const availableHeight = canvas.height - margin * 2;
    const cellSize = Math.min(availableWidth / dungeon.gridWidth, availableHeight / dungeon.gridHeight);
    const offsetX = margin + (availableWidth - cellSize * dungeon.gridWidth) / 2;
    const offsetY = margin + (availableHeight - cellSize * dungeon.gridHeight) / 2;

    const gridX = Math.floor((x - offsetX) / cellSize);
    const gridY = Math.floor((y - offsetY) / cellSize);

    if (gridX >= 0 && gridX < dungeon.gridWidth && gridY >= 0 && gridY < dungeon.gridHeight) {
      const room = dungeon.rooms[gridY][gridX];
      if (room.type !== RoomType.EMPTY) {
        return { gridX, gridY };
      }
    }
    return null;
  }

  setSeed(seed: number): void {
    this.seedInput.value = seed.toString();
  }

  toggleMap(show?: boolean): void {
    if (show !== undefined) {
      this.showMap = show;
    } else {
      this.showMap = !this.showMap;
    }
    this.mapContainer.style.display = this.showMap ? 'block' : 'none';
  }

  private darkenColor(color: string, factor: number): string {
    const hex = color.replace('#', '');
    const r = Math.floor(parseInt(hex.substring(0, 2), 16) * factor);
    const g = Math.floor(parseInt(hex.substring(2, 4), 16) * factor);
    const b = Math.floor(parseInt(hex.substring(4, 6), 16) * factor);
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }

  update(_deltaTime: number, dungeon: Dungeon, player: Player, currentRoom: Room, gameState: GameState): void {
    if (gameState === GameState.TOPDOWN) {
      this.renderTopdown(dungeon, player);
    }
    this.renderMap(dungeon, player, gameState);
    this.updateStatus(dungeon, player, currentRoom, gameState);
  }
}
