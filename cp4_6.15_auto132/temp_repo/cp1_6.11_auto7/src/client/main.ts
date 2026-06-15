import {
  GameState,
  Snake,
  Food,
  Player,
  Direction,
  Position,
  WSMessage,
  JoinData,
  DirectionData,
  ReadyData,
  COLORS,
  FOOD_CONFIG,
  GRID_WIDTH,
  GRID_HEIGHT,
  TARGET_FPS,
} from '../types.js';

const app = document.getElementById('app') as HTMLDivElement;

let canvas: HTMLCanvasElement;
let ctx: CanvasRenderingContext2D;
let cellSize = 16;

let ws: WebSocket | null = null;
let connectionStatus = 'disconnected';

let gameState: GameState | null = null;
let prevGameState: GameState | null = null;
let lastStateTime = 0;
let localPlayerId: string | null = null;

let currentDirection: Direction = 'right';
let pendingDirection: Direction | null = null;

let animationTime = 0;
let lastFrameTime = 0;

let playerName = '';
let selectedColor = COLORS[0];
let isReady = false;

let currentPage: 'lobby' | 'game' | 'gameover' = 'lobby';
let gameOverData: GameState | null = null;

function init() {
  createLobbyPage();
  connectWebSocket();
}

function connectWebSocket() {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsUrl = `${protocol}//${window.location.host}/ws`;

  connectionStatus = 'connecting';
  updateConnectionStatus();

  try {
    ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      connectionStatus = 'connected';
      updateConnectionStatus();
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data) as WSMessage;
        handleWSMessage(message);
      } catch (e) {
        console.error('Error parsing WS message:', e);
      }
    };

    ws.onclose = () => {
      connectionStatus = 'disconnected';
      updateConnectionStatus();
      setTimeout(connectWebSocket, 3000);
    };

    ws.onerror = () => {
      connectionStatus = 'disconnected';
      updateConnectionStatus();
    };
  } catch (e) {
    console.error('Error connecting WebSocket:', e);
    connectionStatus = 'disconnected';
    updateConnectionStatus();
  }
}

function sendMessage<T>(type: string, data: T) {
  if (!ws || ws.readyState !== WebSocket.OPEN) return;

  const message: WSMessage<T> = {
    type: type as WSMessage['type'],
    data,
    timestamp: Date.now(),
  };
  ws.send(JSON.stringify(message));
}

function handleWSMessage(message: WSMessage) {
  switch (message.type) {
    case 'state':
      prevGameState = gameState;
      gameState = message.data as GameState;
      lastStateTime = message.timestamp;

      if (gameState.status === 'playing' && currentPage === 'lobby') {
        showGamePage();
      }
      if (gameState.status === 'ended' && currentPage === 'game') {
        gameOverData = gameState;
        showGameOverPage();
      }
      if (gameState.status === 'waiting') {
        isReady = false;
        if (currentPage === 'gameover') {
          showLobbyPage();
        }
      }
      break;

    case 'playersUpdate':
      if (gameState) {
        gameState.players = (message.data as { players: Player[] }).players;
        gameState.status = (message.data as { status: string }).status as GameState['status'];
      }
      updateLobbyPlayers();
      break;

    case 'start':
      break;

    case 'gameOver':
      gameOverData = (message.data as { state: GameState }).state;
      gameState = gameOverData;
      showGameOverPage();
      break;

    case 'error':
      alert((message.data as { message: string }).message);
      break;
  }
}

function createLobbyPage() {
  app.innerHTML = '';

  const page = document.createElement('div');
  page.className = 'page';
  page.id = 'lobbyPage';

  const container = document.createElement('div');
  container.className = 'lobby-container glass';

  const titleDiv = document.createElement('div');
  titleDiv.className = 'game-title';
  titleDiv.innerHTML = `
    <h1>🐍 贪吃蛇大作战</h1>
    <p>实时多人对战 · 吃食物长身体 · 活到最后</p>
  `;

  const formGroup = document.createElement('div');
  formGroup.className = 'form-group';
  formGroup.innerHTML = `
    <label for="nameInput">你的昵称</label>
    <input type="text" id="nameInput" placeholder="输入昵称开始游戏..." maxlength="12" />
  `;

  const colorGroup = document.createElement('div');
  colorGroup.className = 'form-group';
  colorGroup.innerHTML = `
    <label>选择颜色</label>
    <div class="color-picker" id="colorPicker"></div>
  `;

  const playersGroup = document.createElement('div');
  playersGroup.className = 'form-group';
  playersGroup.innerHTML = `
    <label>玩家列表 (<span id="playerCount">0</span>/4)</label>
    <div class="players-list" id="playersList">
      <span class="waiting-text">等待玩家加入...</span>
    </div>
  `;

  const button = document.createElement('button');
  button.className = 'btn';
  button.id = 'startBtn';
  button.textContent = '开始游戏';
  button.disabled = true;

  const statusDiv = document.createElement('div');
  statusDiv.className = 'connection-status';
  statusDiv.id = 'connStatus';
  statusDiv.innerHTML = '<span class="dot"></span><span>连接中...</span>';

  container.appendChild(titleDiv);
  container.appendChild(formGroup);
  container.appendChild(colorGroup);
  container.appendChild(playersGroup);
  container.appendChild(button);
  page.appendChild(container);
  page.appendChild(statusDiv);
  app.appendChild(page);

  const nameInput = document.getElementById('nameInput') as HTMLInputElement;
  nameInput.addEventListener('input', () => {
    playerName = nameInput.value.trim();
    updateStartButton();
  });

  const colorPicker = document.getElementById('colorPicker') as HTMLDivElement;
  COLORS.forEach((color, index) => {
    const option = document.createElement('div');
    option.className = 'color-option' + (index === 0 ? ' selected' : '');
    option.style.backgroundColor = color;
    option.style.color = color;
    option.dataset.color = color;
    option.addEventListener('click', () => {
      selectedColor = color;
      document.querySelectorAll('.color-option').forEach(el => el.classList.remove('selected'));
      option.classList.add('selected');
    });
    colorPicker.appendChild(option);
  });

  button.addEventListener('click', () => {
    if (!playerName.trim()) return;

    if (!isReady) {
      sendMessage<JoinData>('join', {
        name: playerName.trim(),
        color: selectedColor,
      });
      isReady = true;
      sendMessage<ReadyData>('ready', { isReady: true });
      button.textContent = '取消准备';
      button.classList.add('btn-secondary');
    } else {
      isReady = false;
      sendMessage<ReadyData>('ready', { isReady: false });
      button.textContent = '开始游戏';
      button.classList.remove('btn-secondary');
    }
  });

  nameInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && playerName.trim()) {
      button.click();
    }
  });

  updateConnectionStatus();
  updateStartButton();
}

function updateStartButton() {
  const btn = document.getElementById('startBtn') as HTMLButtonElement;
  if (btn) {
    btn.disabled = !playerName.trim() || connectionStatus !== 'connected';
  }
}

function updateConnectionStatus() {
  const statusEl = document.getElementById('connStatus');
  if (!statusEl) return;

  statusEl.className = 'connection-status ' + connectionStatus;
  const text = statusEl.querySelector('span:last-child');
  if (text) {
    if (connectionStatus === 'connected') {
      text.textContent = '已连接';
    } else if (connectionStatus === 'connecting') {
      text.textContent = '连接中...';
    } else {
      text.textContent = '未连接';
    }
  }
}

function updateLobbyPlayers() {
  const playersList = document.getElementById('playersList');
  const playerCount = document.getElementById('playerCount');
  if (!playersList || !playerCount || !gameState) return;

  playerCount.textContent = gameState.players.length.toString();

  if (gameState.players.length === 0) {
    playersList.innerHTML = '<span class="waiting-text">等待玩家加入...</span>';
    return;
  }

  playersList.innerHTML = '';
  gameState.players.forEach((player) => {
    const card = document.createElement('div');
    card.className = 'player-card';
    card.innerHTML = `
      <span class="dot" style="background-color: ${player.color}"></span>
      <span>${player.name}</span>
      ${player.isReady ? '<span class="ready-badge">准备</span>' : ''}
    `;
    playersList.appendChild(card);
  });
}

function showGamePage() {
  currentPage = 'game';
  app.innerHTML = '';

  const page = document.createElement('div');
  page.className = 'page';
  page.id = 'gamePage';

  canvas = document.createElement('canvas');
  canvas.id = 'gameCanvas';

  const scoreboard = document.createElement('div');
  scoreboard.className = 'scoreboard glass';
  scoreboard.id = 'scoreboard';
  scoreboard.innerHTML = `
    <h3>🏆 排行榜</h3>
    <div id="scoreList"></div>
  `;

  const safeModeBanner = document.createElement('div');
  safeModeBanner.className = 'safe-mode-banner hidden';
  safeModeBanner.id = 'safeModeBanner';
  safeModeBanner.textContent = '⚠️ 安全模式 - 最后决战';

  const statusDiv = document.createElement('div');
  statusDiv.className = 'connection-status';
  statusDiv.id = 'connStatus';
  statusDiv.innerHTML = '<span class="dot"></span><span>已连接</span>';

  page.appendChild(canvas);
  page.appendChild(scoreboard);
  page.appendChild(safeModeBanner);
  page.appendChild(statusDiv);
  app.appendChild(page);

  ctx = canvas.getContext('2d')!;
  resizeCanvas();

  window.addEventListener('resize', resizeCanvas);
  window.addEventListener('keydown', handleKeyDown);

  lastFrameTime = performance.now();
  requestAnimationFrame(gameLoop);

  updateConnectionStatus();
}

function showLobbyPage() {
  currentPage = 'lobby';
  isReady = false;
  createLobbyPage();
  updateLobbyPlayers();
}

function showGameOverPage() {
  currentPage = 'gameover';
  if (!gameOverData) return;

  const overlay = document.createElement('div');
  overlay.className = 'game-over-overlay';
  overlay.id = 'gameOverOverlay';

  const panel = document.createElement('div');
  panel.className = 'game-over-panel glass';

  const title = document.createElement('h2');
  title.textContent = '🎮 游戏结束';

  const rankingList = document.createElement('div');
  rankingList.className = 'ranking-list';

  const rankedPlayers = getRankedPlayers();

  rankedPlayers.forEach((snake, index) => {
    const player = gameOverData!.players.find(p => p.id === snake.id);
    const name = player?.name || 'Unknown';
    const color = player?.color || '#fff';

    const item = document.createElement('div');
    item.className = 'ranking-item';
    if (index === 0) item.classList.add('gold');
    else if (index === 1) item.classList.add('silver');
    else if (index === 2) item.classList.add('bronze');

    const survivalTime = snake.deathTime
      ? Math.floor((snake.deathTime - snake.spawnTime) / 1000)
      : gameOverData!.endTime
      ? Math.floor((gameOverData!.endTime - snake.spawnTime) / 1000)
      : 0;

    item.innerHTML = `
      <div class="rank-num">${index + 1}</div>
      <div class="player-info">
        <div class="name">
          <span class="player-color-dot" style="background-color: ${color}"></span>
          ${name}
        </div>
        <div class="stats">
          <span class="stat-badge">📏 ${snake.maxLength}</span>
          <span class="stat-badge">⏱️ ${survivalTime}s</span>
          <span class="stat-badge">💀 ${snake.kills}</span>
        </div>
      </div>
    `;

    rankingList.appendChild(item);
  });

  const actions = document.createElement('div');
  actions.className = 'actions';

  const restartBtn = document.createElement('button');
  restartBtn.className = 'btn';
  restartBtn.textContent = '再来一局';
  restartBtn.addEventListener('click', () => {
    sendMessage('restart', {});
    setTimeout(() => {
      isReady = true;
      sendMessage<ReadyData>('ready', { isReady: true });
    }, 300);
  });

  actions.appendChild(restartBtn);

  panel.appendChild(title);
  panel.appendChild(rankingList);
  panel.appendChild(actions);
  overlay.appendChild(panel);
  app.appendChild(overlay);
}

function getRankedPlayers(): Snake[] {
  if (!gameOverData) return [];

  return [...gameOverData.snakes].sort((a, b) => {
    if (b.maxLength !== a.maxLength) {
      return b.maxLength - a.maxLength;
    }
    const aTime = a.deathTime || gameOverData!.endTime || 0;
    const bTime = b.deathTime || gameOverData!.endTime || 0;
    return bTime - aTime;
  });
}

function resizeCanvas() {
  if (!canvas || !ctx) return;

  const isMobile = window.innerWidth < 768;
  const maxWidth = window.innerWidth - 40;
  const maxHeight = window.innerHeight - 40;

  const aspectRatio = GRID_WIDTH / GRID_HEIGHT;

  let canvasWidth: number;
  let canvasHeight: number;

  if (maxWidth / aspectRatio <= maxHeight) {
    canvasWidth = maxWidth;
    canvasHeight = maxWidth / aspectRatio;
  } else {
    canvasHeight = maxHeight;
    canvasWidth = maxHeight * aspectRatio;
  }

  cellSize = Math.floor(canvasWidth / GRID_WIDTH);
  canvasWidth = cellSize * GRID_WIDTH;
  canvasHeight = cellSize * GRID_HEIGHT;

  const dpr = window.devicePixelRatio || 1;
  canvas.style.width = canvasWidth + 'px';
  canvas.style.height = canvasHeight + 'px';
  canvas.width = canvasWidth * dpr;
  canvas.height = canvasHeight * dpr;

  if (isMobile) {
    cellSize = Math.max(6, Math.floor(cellSize * 0.9));
  }

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function handleKeyDown(e: KeyboardEvent) {
  let newDirection: Direction | null = null;

  switch (e.key) {
    case 'ArrowUp':
    case 'w':
    case 'W':
      newDirection = 'up';
      break;
    case 'ArrowDown':
    case 's':
    case 'S':
      newDirection = 'down';
      break;
    case 'ArrowLeft':
    case 'a':
    case 'A':
      newDirection = 'left';
      break;
    case 'ArrowRight':
    case 'd':
    case 'D':
      newDirection = 'right';
      break;
  }

  if (newDirection) {
    e.preventDefault();
    pendingDirection = newDirection;
    sendMessage<DirectionData>('direction', { direction: newDirection });
  }
}

function gameLoop(timestamp: number) {
  if (currentPage !== 'game') return;

  const deltaTime = timestamp - lastFrameTime;
  lastFrameTime = timestamp;
  animationTime = timestamp;

  update(deltaTime);
  render();

  requestAnimationFrame(gameLoop);
}

function update(deltaTime: number) {
  if (!gameState || !prevGameState) return;

  if (pendingDirection && gameState.status === 'playing') {
    const playerSnake = gameState.snakes.find(s => s.id === localPlayerId);
    if (playerSnake && playerSnake.isAlive) {
      const opposite: Record<Direction, Direction> = {
        up: 'down',
        down: 'up',
        left: 'right',
        right: 'left',
      };
      if (pendingDirection !== opposite[playerSnake.direction]) {
        currentDirection = pendingDirection;
      }
    }
    pendingDirection = null;
  }

  updateScoreboard();
  updateSafeModeBanner();
}

function updateScoreboard() {
  const scoreList = document.getElementById('scoreList');
  if (!scoreList || !gameState) return;

  const sortedSnakes = [...gameState.snakes]
    .filter(s => s.body.length > 0)
    .sort((a, b) => b.body.length - a.body.length);

  const maxLen = sortedSnakes.length > 0 ? sortedSnakes[0].body.length : 0;

  scoreList.innerHTML = '';

  sortedSnakes.forEach((snake, index) => {
    const player = gameState!.players.find(p => p.id === snake.id);
    const name = player?.name || 'Unknown';
    const color = player?.color || '#fff';
    const isTop = index === 0 && snake.isAlive && snake.body.length === maxLen;

    const item = document.createElement('div');
    item.className = 'score-item';
    if (isTop) item.classList.add('top');
    if (!snake.isAlive) item.classList.add('dead');

    item.innerHTML = `
      <span class="rank">${index + 1}</span>
      <span class="player-color-dot" style="background-color: ${color}"></span>
      <span class="name">${name}</span>
      <div class="stats">
        <span>${snake.body.length}</span>
        <span>💀${snake.kills}</span>
      </div>
    `;

    scoreList.appendChild(item);
  });
}

function updateSafeModeBanner() {
  const banner = document.getElementById('safeModeBanner');
  if (!banner || !gameState) return;

  if (gameState.safeMode) {
    banner.classList.remove('hidden');
  } else {
    banner.classList.add('hidden');
  }
}

function getInterpolatedPosition(pos1: Position, pos2: Position, t: number): Position {
  return {
    x: pos1.x + (pos2.x - pos1.x) * t,
    y: pos1.y + (pos2.y - pos1.y) * t,
  };
}

function getInterpolationFactor(): number {
  const timeSinceLastState = Date.now() - lastStateTime;
  const syncInterval = 100;
  return Math.min(timeSinceLastState / syncInterval, 1.2);
}

function render() {
  if (!ctx || !canvas || !gameState) return;

  const width = canvas.width / (window.devicePixelRatio || 1);
  const height = canvas.height / (window.devicePixelRatio || 1);

  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(0, 0, width, height);

  drawGrid(width, height);

  const t = getInterpolationFactor();

  for (const food of gameState.foods) {
    drawFood(food);
  }

  const sortedSnakes = [...gameState.snakes].sort((a, b) => {
    if (a.isAlive && !b.isAlive) return 1;
    if (!a.isAlive && b.isAlive) return -1;
    return 0;
  });

  for (const snake of sortedSnakes) {
    if (snake.body.length > 0) {
      drawSnake(snake, t);
    }
  }
}

function drawGrid(width: number, height: number) {
  ctx.strokeStyle = 'rgba(58, 58, 90, 0.5)';
  ctx.lineWidth = 0.5;

  for (let x = 0; x <= GRID_WIDTH; x++) {
    const px = x * cellSize;
    ctx.beginPath();
    ctx.moveTo(px, 0);
    ctx.lineTo(px, height);
    ctx.stroke();
  }

  for (let y = 0; y <= GRID_HEIGHT; y++) {
    const py = y * cellSize;
    ctx.beginPath();
    ctx.moveTo(0, py);
    ctx.lineTo(width, py);
    ctx.stroke();
  }
}

function drawFood(food: Food) {
  const x = food.position.x * cellSize + cellSize / 2;
  const y = food.position.y * cellSize + cellSize / 2;

  const breathScale = 1 + 0.2 * Math.sin(animationTime / 500);
  const radius = (cellSize * 0.4) * breathScale;

  const config = FOOD_CONFIG[food.type];

  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);

  if (food.type === 'normal') {
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'rgba(255, 255, 255, 0.6)';
    ctx.shadowBlur = 8;
  } else if (food.type === 'speed') {
    ctx.fillStyle = '#ef4444';
    ctx.shadowColor = 'rgba(239, 68, 68, 0.8)';
    ctx.shadowBlur = 12;
  } else if (food.type === 'bomb') {
    ctx.fillStyle = '#1a1a1a';
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 2;
    ctx.shadowColor = 'rgba(239, 68, 68, 0.5)';
    ctx.shadowBlur = 10;
  }

  ctx.fill();

  if (food.type === 'bomb') {
    ctx.stroke();
    ctx.fillStyle = '#ef4444';
    ctx.font = `bold ${Math.floor(cellSize * 0.5)}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('💣', x, y);
  }

  ctx.restore();
}

function drawSnake(snake: Snake, t: number) {
  if (snake.body.length === 0) return;

  const body = snake.body;
  const isLocal = snake.id === localPlayerId;

  ctx.save();

  for (let i = body.length - 1; i >= 0; i--) {
    const segment = body[i];

    const alpha = 1 - (i / body.length) * 0.6;

    const x = segment.x * cellSize;
    const y = segment.y * cellSize;

    const size = cellSize - 1;

    const gradient = ctx.createRadialGradient(
      x + cellSize / 2,
      y + cellSize / 2,
      0,
      x + cellSize / 2,
      y + cellSize / 2,
      cellSize / 2
    );

    if (i === 0) {
      gradient.addColorStop(0, snake.color);
      gradient.addColorStop(1, adjustColor(snake.color, -30));
    } else {
      gradient.addColorStop(0, adjustColor(snake.color, -20));
      gradient.addColorStop(1, adjustColor(snake.color, -60));
    }

    ctx.globalAlpha = alpha;

    const radius = Math.max(2, cellSize * 0.25);
    drawRoundedRect(
      ctx,
      x + 0.5,
      y + 0.5,
      size,
      size,
      radius
    );

    ctx.fillStyle = gradient;

    if (isLocal && i === 0) {
      ctx.shadowColor = snake.color;
      ctx.shadowBlur = 10;
    }

    ctx.fill();

    if (i === 0) {
      ctx.globalAlpha = 1;
      drawEyes(x, y, snake.direction);
    }

    ctx.shadowBlur = 0;
  }

  ctx.restore();
}

function drawEyes(x: number, y: number, direction: Direction) {
  const eyeSize = Math.max(2, cellSize * 0.18);
  const eyeOffset = cellSize * 0.25;

  let eye1X: number, eye1Y: number, eye2X: number, eye2Y: number;

  const centerX = x + cellSize / 2;
  const centerY = y + cellSize / 2;

  switch (direction) {
    case 'up':
      eye1X = centerX - eyeOffset;
      eye1Y = centerY - eyeOffset * 0.5;
      eye2X = centerX + eyeOffset;
      eye2Y = centerY - eyeOffset * 0.5;
      break;
    case 'down':
      eye1X = centerX - eyeOffset;
      eye1Y = centerY + eyeOffset * 0.5;
      eye2X = centerX + eyeOffset;
      eye2Y = centerY + eyeOffset * 0.5;
      break;
    case 'left':
      eye1X = centerX - eyeOffset * 0.5;
      eye1Y = centerY - eyeOffset;
      eye2X = centerX - eyeOffset * 0.5;
      eye2Y = centerY + eyeOffset;
      break;
    case 'right':
    default:
      eye1X = centerX + eyeOffset * 0.5;
      eye1Y = centerY - eyeOffset;
      eye2X = centerX + eyeOffset * 0.5;
      eye2Y = centerY + eyeOffset;
      break;
  }

  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(eye1X, eye1Y, eyeSize, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(eye2X, eye2Y, eyeSize, 0, Math.PI * 2);
  ctx.fill();

  const pupilSize = eyeSize * 0.5;
  const pupilOffset = eyeSize * 0.3;

  let pOffsetX = 0;
  let pOffsetY = 0;

  switch (direction) {
    case 'up':
      pOffsetY = -pupilOffset;
      break;
    case 'down':
      pOffsetY = pupilOffset;
      break;
    case 'left':
      pOffsetX = -pupilOffset;
      break;
    case 'right':
      pOffsetX = pupilOffset;
      break;
  }

  ctx.fillStyle = '#1a1a2e';
  ctx.beginPath();
  ctx.arc(eye1X + pOffsetX, eye1Y + pOffsetY, pupilSize, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(eye2X + pOffsetX, eye2Y + pOffsetY, pupilSize, 0, Math.PI * 2);
  ctx.fill();
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function adjustColor(hex: string, amount: number): string {
  const num = parseInt(hex.slice(1), 16);
  const r = Math.min(255, Math.max(0, (num >> 16) + amount));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00ff) + amount));
  const b = Math.min(255, Math.max(0, (num & 0x0000ff) + amount));
  return `rgb(${r}, ${g}, ${b})`;
}

function setLocalPlayerId(id: string) {
  localPlayerId = id;
}

document.addEventListener('DOMContentLoaded', init);

if (document.readyState === 'interactive' || document.readyState === 'complete') {
  init();
}

export { setLocalPlayerId };
