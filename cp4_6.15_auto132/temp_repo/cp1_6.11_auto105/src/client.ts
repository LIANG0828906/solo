import { v4 as uuidv4 } from 'uuid';
import type { User, Danmaku, TrailPoint, Shockwave, ClientMessage, ServerMessage } from './types';

const COLORS = [
  '#FF3366', '#33FF66', '#3366FF', '#FFCC00',
  '#FF66CC', '#00FFFF', '#FF9933', '#9966FF',
  '#66FFCC', '#FF6666', '#66CCFF', '#CCFF66'
];

const MAX_DANMAKU = 300;
const TRAIL_FADE_TIME = 5000;
const TRAIL_LENGTH = 50;
const SHOCKWAVE_DURATION = 300;

let ws: WebSocket | null = null;
let selfId: string | null = null;
let isHost = false;
let currentColor = COLORS[0];
let users: Map<string, User> = new Map();

const danmakuList: Danmaku[] = [];
const shockwaves: Shockwave[] = [];

let isDragging = false;
let dragStartX = 0;
let dragStartY = 0;
let dragCurrentX = 0;
let dragCurrentY = 0;

let canvas: HTMLCanvasElement;
let ctx: CanvasRenderingContext2D;
let canvasWidth = 0;
let canvasHeight = 0;

let lastUserCountUpdate = 0;

const loginModal = document.getElementById('loginModal')!;
const app = document.getElementById('app')!;
const nicknameInput = document.getElementById('nicknameInput') as HTMLInputElement;
const roomInput = document.getElementById('roomInput') as HTMLInputElement;
const joinBtn = document.getElementById('joinBtn')!;
const counter = document.getElementById('counter')!;
const roomIdDisplay = document.getElementById('roomIdDisplay')!;
const clearBtn = document.getElementById('clearBtn') as HTMLButtonElement;
const colorPalette = document.getElementById('colorPalette')!;
const userList = document.getElementById('userList')!;

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function initColorPalette(): void {
  colorPalette.innerHTML = '';
  COLORS.forEach((color, index) => {
    const btn = document.createElement('div');
    btn.className = 'color-btn';
    btn.style.backgroundColor = color;
    btn.style.color = color;
    if (color === currentColor) {
      btn.classList.add('active');
    }
    btn.addEventListener('click', () => {
      currentColor = color;
      document.querySelectorAll('.color-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      if (ws && ws.readyState === WebSocket.OPEN) {
        const msg: ClientMessage = { type: 'setColor', color };
        ws.send(JSON.stringify(msg));
      }
    });
    colorPalette.appendChild(btn);
  });
}

function renderUserList(): void {
  userList.innerHTML = '';
  const sortedUsers = Array.from(users.values()).sort((a, b) => {
    if (a.isHost !== b.isHost) return a.isHost ? -1 : 1;
    return b.danmakuCount - a.danmakuCount;
  });

  sortedUsers.forEach(user => {
    const item = document.createElement('div');
    item.className = 'user-item' + (user.isHost ? ' is-host' : '');

    const avatar = document.createElement('div');
    avatar.className = 'user-avatar';
    avatar.style.backgroundColor = user.avatarColor;
    avatar.textContent = user.nickname.charAt(0).toUpperCase();

    const info = document.createElement('div');
    info.className = 'user-info';

    const name = document.createElement('div');
    name.className = 'user-name';
    name.textContent = user.nickname;
    if (user.id === selfId) {
      name.textContent += ' (我)';
    }

    const count = document.createElement('div');
    count.className = 'user-count';
    count.textContent = `弹幕数: ${user.danmakuCount}`;

    const like = document.createElement('div');
    like.className = 'like-icon';
    like.textContent = '❤️';
    like.addEventListener('click', (e) => {
      e.stopPropagation();
      like.textContent = '💖';
      like.style.transform = 'translateY(-50%) scale(1.5)';
      setTimeout(() => {
        like.textContent = '❤️';
        like.style.transform = '';
      }, 300);
    });

    info.appendChild(name);
    info.appendChild(count);
    item.appendChild(avatar);
    item.appendChild(info);
    item.appendChild(like);
    userList.appendChild(item);
  });
}

function updateCounter(): void {
  counter.textContent = `${users.size}人在线协作中`;
}

function resizeCanvas(): void {
  const wrapper = canvas.parentElement!;
  const rect = wrapper.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;

  canvasWidth = rect.width;
  canvasHeight = rect.height;

  canvas.width = canvasWidth * dpr;
  canvas.height = canvasHeight * dpr;
  canvas.style.width = `${canvasWidth}px`;
  canvas.style.height = `${canvasHeight}px`;

  ctx.scale(dpr, dpr);
}

function getCanvasCoords(e: MouseEvent): { x: number; y: number } {
  const rect = canvas.getBoundingClientRect();
  return {
    x: e.clientX - rect.left,
    y: e.clientY - rect.top
  };
}

function handleMouseDown(e: MouseEvent): void {
  if (e.button !== 0) return;
  const coords = getCanvasCoords(e);
  isDragging = true;
  dragStartX = coords.x;
  dragStartY = coords.y;
  dragCurrentX = coords.x;
  dragCurrentY = coords.y;
}

function handleMouseMove(e: MouseEvent): void {
  if (!isDragging) return;
  const coords = getCanvasCoords(e);
  dragCurrentX = coords.x;
  dragCurrentY = coords.y;
}

function handleMouseUp(e: MouseEvent): void {
  if (!isDragging) return;
  isDragging = false;

  const coords = getCanvasCoords(e);
  const dx = coords.x - dragStartX;
  const dy = coords.y - dragStartY;
  const distance = Math.sqrt(dx * dx + dy * dy);

  if (distance < 5) return;

  const size = Math.max(5, Math.min(20, (distance / 100) * 20));
  const speed = 3 + Math.random() * 3;
  const vx = (dx / distance) * speed;
  const vy = (dy / distance) * speed;

  const danmaku: Omit<Danmaku, 'trail'> = {
    id: uuidv4(),
    userId: selfId || '',
    color: currentColor,
    x: dragStartX,
    y: dragStartY,
    vx,
    vy,
    size,
    createdAt: Date.now()
  };

  addDanmaku({ ...danmaku, trail: [] });

  shockwaves.push({
    x: dragStartX,
    y: dragStartY,
    radius: 5,
    maxRadius: 30,
    opacity: 0.8,
    createdAt: Date.now()
  });

  if (ws && ws.readyState === WebSocket.OPEN) {
    const msg: ClientMessage = { type: 'danmaku', danmaku };
    ws.send(JSON.stringify(msg));
  }
}

function addDanmaku(danmaku: Danmaku): void {
  if (danmakuList.length >= MAX_DANMAKU) {
    danmakuList.shift();
  }
  danmakuList.push(danmaku);
}

function updateDanmaku(d: Danmaku): void {
  d.x += d.vx;
  d.y += d.vy;

  if (d.x - d.size / 2 <= 0 || d.x + d.size / 2 >= canvasWidth) {
    d.vx *= -1;
    d.x = Math.max(d.size / 2, Math.min(canvasWidth - d.size / 2, d.x));
  }
  if (d.y - d.size / 2 <= 0 || d.y + d.size / 2 >= canvasHeight) {
    d.vy *= -1;
    d.y = Math.max(d.size / 2, Math.min(canvasHeight - d.size / 2, d.y));
  }

  d.trail.push({
    x: d.x,
    y: d.y,
    size: d.size,
    createdAt: Date.now()
  });

  const now = Date.now();
  while (d.trail.length > 0 && now - d.trail[0].createdAt > TRAIL_FADE_TIME) {
    d.trail.shift();
  }
  if (d.trail.length > TRAIL_LENGTH) {
    d.trail.splice(0, d.trail.length - TRAIL_LENGTH);
  }
}

function drawTrail(d: Danmaku): void {
  if (d.trail.length < 2) return;

  const now = Date.now();

  for (let i = 1; i < d.trail.length; i++) {
    const prev = d.trail[i - 1];
    const curr = d.trail[i];
    const age = now - curr.createdAt;
    const alpha = Math.max(0, 1 - age / TRAIL_FADE_TIME);
    const sizeRatio = i / d.trail.length;
    const size = curr.size * sizeRatio;

    ctx.beginPath();
    ctx.strokeStyle = hexToRgba(d.color, alpha * 0.8);
    ctx.lineWidth = Math.max(1, size);
    ctx.lineCap = 'round';
    ctx.moveTo(prev.x, prev.y);
    ctx.lineTo(curr.x, curr.y);
    ctx.stroke();
  }
}

function drawDanmaku(d: Danmaku): void {
  ctx.beginPath();
  ctx.fillStyle = d.color;
  ctx.shadowColor = d.color;
  ctx.shadowBlur = 10;
  ctx.arc(d.x, d.y, d.size / 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
}

function drawShockwaves(): void {
  const now = Date.now();
  for (let i = shockwaves.length - 1; i >= 0; i--) {
    const s = shockwaves[i];
    const age = now - s.createdAt;
    const progress = age / SHOCKWAVE_DURATION;

    if (progress >= 1) {
      shockwaves.splice(i, 1);
      continue;
    }

    s.radius = 5 + (s.maxRadius - 5) * progress;
    s.opacity = 0.8 * (1 - progress);

    ctx.beginPath();
    ctx.strokeStyle = `rgba(255, 255, 255, ${s.opacity})`;
    ctx.lineWidth = 2;
    ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
    ctx.stroke();
  }
}

function drawDragLine(): void {
  if (!isDragging) return;

  ctx.beginPath();
  ctx.strokeStyle = hexToRgba(currentColor, 0.6);
  ctx.lineWidth = 2;
  ctx.setLineDash([5, 5]);
  ctx.moveTo(dragStartX, dragStartY);
  ctx.lineTo(dragCurrentX, dragCurrentY);
  ctx.stroke();
  ctx.setLineDash([]);

  const dx = dragCurrentX - dragStartX;
  const dy = dragCurrentY - dragStartY;
  const distance = Math.sqrt(dx * dx + dy * dy);
  const size = Math.max(5, Math.min(20, (distance / 100) * 20));

  ctx.beginPath();
  ctx.fillStyle = hexToRgba(currentColor, 0.5);
  ctx.arc(dragStartX, dragStartY, size / 2, 0, Math.PI * 2);
  ctx.fill();
}

function render(): void {
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  for (const d of danmakuList) {
    drawTrail(d);
  }

  for (const d of danmakuList) {
    drawDanmaku(d);
  }

  drawShockwaves();
  drawDragLine();
}

function update(): void {
  for (const d of danmakuList) {
    updateDanmaku(d);
  }

  const now = Date.now();
  if (now - lastUserCountUpdate >= 1000) {
    lastUserCountUpdate = now;
    renderUserList();
  }
}

function gameLoop(): void {
  update();
  render();
  requestAnimationFrame(gameLoop);
}

function handleServerMessage(message: ServerMessage): void {
  switch (message.type) {
    case 'init':
      selfId = message.selfId;
      isHost = message.isHost;
      users = new Map(message.users.map(u => [u.id, u]));
      roomIdDisplay.textContent = roomInput.value;
      clearBtn.disabled = !isHost;
      loginModal.style.display = 'none';
      app.style.display = 'block';
      resizeCanvas();
      updateCounter();
      renderUserList();
      break;

    case 'userJoin':
      users.set(message.user.id, message.user);
      updateCounter();
      renderUserList();
      break;

    case 'userLeave':
      users.delete(message.userId);
      if (message.userId === selfId) {
        selfId = null;
      }
      const leavingUser = Array.from(users.values()).find(u => u.id === message.userId);
      if (leavingUser && leavingUser.isHost) {
        for (const u of users.values()) {
          if (u.isHost) {
            isHost = u.id === selfId;
            clearBtn.disabled = !isHost;
            break;
          }
        }
      }
      updateCounter();
      renderUserList();
      break;

    case 'userUpdate':
      users.set(message.user.id, message.user);
      if (message.user.id === selfId) {
        isHost = message.user.isHost;
        clearBtn.disabled = !isHost;
      }
      break;

    case 'danmaku':
      if (message.danmaku.userId !== selfId) {
        addDanmaku({ ...message.danmaku, trail: [] });
      }
      break;

    case 'clearCanvas':
      danmakuList.length = 0;
      shockwaves.length = 0;
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);
      renderUserList();
      break;

    case 'error':
      alert(message.message);
      break;
  }
}

function connectWebSocket(): void {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsUrl = `${protocol}//${window.location.host}/ws`;
  ws = new WebSocket(wsUrl);

  ws.onopen = () => {
    const msg: ClientMessage = {
      type: 'join',
      nickname: nicknameInput.value,
      roomId: roomInput.value
    };
    ws!.send(JSON.stringify(msg));
  };

  ws.onmessage = (event) => {
    try {
      const message: ServerMessage = JSON.parse(event.data);
      handleServerMessage(message);
    } catch (e) {
      console.error('Failed to parse server message:', e);
    }
  };

  ws.onclose = () => {
    console.log('WebSocket closed');
  };

  ws.onerror = (error) => {
    console.error('WebSocket error:', error);
    alert('连接服务器失败，请刷新页面重试');
  };
}

function init(): void {
  canvas = document.getElementById('canvas') as HTMLCanvasElement;
  ctx = canvas.getContext('2d')!;

  initColorPalette();

  joinBtn.addEventListener('click', () => {
    if (!nicknameInput.value.trim()) {
      alert('请输入昵称');
      return;
    }
    if (!roomInput.value.trim()) {
      alert('请输入房间号');
      return;
    }
    connectWebSocket();
  });

  roomInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') joinBtn.click();
  });

  nicknameInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') roomInput.focus();
  });

  clearBtn.addEventListener('click', () => {
    if (!isHost || !ws) return;
    clearBtn.classList.add('shake');
    setTimeout(() => clearBtn.classList.remove('shake'), 300);
    const msg: ClientMessage = { type: 'clearCanvas' };
    ws.send(JSON.stringify(msg));
  });

  canvas.addEventListener('mousedown', handleMouseDown);
  window.addEventListener('mousemove', handleMouseMove);
  window.addEventListener('mouseup', handleMouseUp);

  window.addEventListener('resize', () => {
    if (app.style.display !== 'none') {
      resizeCanvas();
    }
  });

  gameLoop();
}

init();
