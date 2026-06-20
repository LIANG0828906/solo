import type { TeamState, Escort, EventEffect } from './team';
import type { GameEvent, EventOption } from './event';
import type { BattleState, BattleEffect } from './battle';
import { calculateReward, getRandomComment, getAliveEscorts } from './team';

export interface EscortRecord {
  id: string;
  date: string;
  duration: number;
  cargoIntegrity: number;
  survivors: number;
  reward: number;
  comment: string;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

interface UIElements {
  container: HTMLElement;
  teamPanel: HTMLElement;
  gameArea: HTMLElement;
  logPanel: HTMLElement;
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  startBtn: HTMLElement;
  historyBtn: HTMLElement;
  progressBar: HTMLElement;
  cargoBar: HTMLElement;
  timeDisplay: HTMLElement;
  overlay: HTMLElement;
}

let elements: UIElements | null = null;
let currentState: TeamState | null = null;
let particles: Particle[] = [];
let particlePool: Particle[] = [];
let animationFrameId: number | null = null;
let weatherType: 'rain' | 'campfire' | 'none' = 'none';
let isShaking = false;

const COLORS = {
  rammedEarth: '#A08050',
  greyTile: '#808080',
  mountainNear: '#4A6741',
  mountainMid: '#5C7A52',
  mountainFar: '#7B9C6B',
  parchment: '#F5DEB3',
  scrollBg: '#FFF8DC',
  wood: '#8B4513',
  darkRed: '#8B0000',
  flagRed: '#DC143C',
  gold: '#FFD700',
  stamina: '#228B22',
  strength: '#DC143C',
  morale: '#FFD700',
  rain: '#4682B4'
};

export function initUI(container: HTMLElement): void {
  container.innerHTML = '';
  container.style.cssText = `
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    background: linear-gradient(to bottom, #87CEEB 0%, #E0F0E0 100%);
    position: relative;
    overflow: hidden;
  `;

  const mainLayout = document.createElement('div');
  mainLayout.style.cssText = `
    display: flex;
    flex: 1;
    min-height: 0;
    position: relative;
  `;

  const teamPanel = createTeamPanel();
  const gameArea = createGameArea();
  const logPanel = createLogPanel();
  const overlay = createOverlay();

  mainLayout.appendChild(teamPanel);
  mainLayout.appendChild(gameArea);
  mainLayout.appendChild(logPanel);
  container.appendChild(mainLayout);
  container.appendChild(overlay);

  const canvas = gameArea.querySelector('canvas') as HTMLCanvasElement;
  const ctx = canvas.getContext('2d')!;

  elements = {
    container,
    teamPanel,
    gameArea,
    logPanel,
    canvas,
    ctx,
    startBtn: gameArea.querySelector('#start-btn') as HTMLElement,
    historyBtn: gameArea.querySelector('#history-btn') as HTMLElement,
    progressBar: gameArea.querySelector('#progress-bar') as HTMLElement,
    cargoBar: gameArea.querySelector('#cargo-bar') as HTMLElement,
    timeDisplay: gameArea.querySelector('#time-display') as HTMLElement,
    overlay
  };

  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);
  startAnimationLoop();
}

function createOverlay(): HTMLElement {
  const overlay = document.createElement('div');
  overlay.id = 'overlay';
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 100;
  `;
  return overlay;
}

function createTeamPanel(): HTMLElement {
  const panel = document.createElement('div');
  panel.className = 'team-panel';
  panel.style.cssText = `
    width: 220px;
    background: linear-gradient(to right, rgba(139,69,19,0.95), rgba(139,69,19,0.85));
    border-right: 4px solid #5D3A1A;
    padding: 12px 8px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    overflow-y: auto;
    box-shadow: inset -4px 0 8px rgba(0,0,0,0.3);
    z-index: 10;
  `;

  const title = document.createElement('h2');
  title.className = 'title-font';
  title.textContent = '镖队成员';
  title.style.cssText = `
    color: #FFD700;
    font-size: 22px;
    text-align: center;
    padding: 8px 0;
    border-bottom: 2px solid #FFD700;
    margin-bottom: 6px;
    text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
  `;
  panel.appendChild(title);

  return panel;
}

function createGameArea(): HTMLElement {
  const area = document.createElement('div');
  area.style.cssText = `
    flex: 1;
    position: relative;
    display: flex;
    flex-direction: column;
    min-width: 0;
  `;

  const statusBar = document.createElement('div');
  statusBar.style.cssText = `
    display: flex;
    justify-content: space-around;
    align-items: center;
    padding: 10px 20px;
    background: linear-gradient(to bottom, rgba(139,69,19,0.9), rgba(139,69,19,0.7));
    border-bottom: 3px solid #5D3A1A;
    z-index: 5;
  `;

  const progressContainer = createStatusItem('进度', 'progress-bar', COLORS.stamina);
  const cargoContainer = createStatusItem('货物', 'cargo-bar', COLORS.gold);
  const timeContainer = document.createElement('div');
  timeContainer.style.cssText = 'display: flex; align-items: center; gap: 8px;';
  timeContainer.innerHTML = `
    <span style="color: #FFD700; font-weight: bold;">用时:</span>
    <span id="time-display" style="color: #FFF; font-size: 18px; min-width: 80px;">00:00</span>
  `;

  statusBar.appendChild(progressContainer);
  statusBar.appendChild(cargoContainer);
  statusBar.appendChild(timeContainer);

  const canvasContainer = document.createElement('div');
  canvasContainer.style.cssText = `
    flex: 1;
    position: relative;
    overflow: hidden;
  `;

  const canvas = document.createElement('canvas');
  canvas.style.cssText = `
    width: 100%;
    height: 100%;
    display: block;
  `;

  const buttonContainer = document.createElement('div');
  buttonContainer.style.cssText = `
    position: absolute;
    bottom: 30px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    gap: 20px;
    z-index: 5;
  `;

  const startBtn = createButton('出发', '#start-btn');
  const historyBtn = createButton('查看日志', '#history-btn');

  buttonContainer.appendChild(startBtn);
  buttonContainer.appendChild(historyBtn);

  canvasContainer.appendChild(canvas);
  canvasContainer.appendChild(buttonContainer);

  area.appendChild(statusBar);
  area.appendChild(canvasContainer);

  return area;
}

function createStatusItem(label: string, id: string, color: string): HTMLElement {
  const container = document.createElement('div');
  container.style.cssText = 'display: flex; align-items: center; gap: 8px; min-width: 200px;';
  
  const labelEl = document.createElement('span');
  labelEl.style.cssText = 'color: #FFD700; font-weight: bold; min-width: 40px;';
  labelEl.textContent = label;
  
  const barBg = document.createElement('div');
  barBg.style.cssText = `
    width: 150px;
    height: 20px;
    background: rgba(0,0,0,0.4);
    border: 2px solid #5D3A1A;
    border-radius: 10px;
    overflow: hidden;
    position: relative;
  `;
  
  const barFill = document.createElement('div');
  barFill.id = id;
  barFill.style.cssText = `
    width: 0%;
    height: 100%;
    background: linear-gradient(to right, ${color}, ${color}dd);
    transition: width 0.3s ease-out, background-color 0.3s ease-out;
    border-radius: 8px;
  `;
  
  const barText = document.createElement('span');
  barText.style.cssText = `
    position: absolute;
    width: 100%;
    text-align: center;
    color: #FFF;
    font-size: 12px;
    font-weight: bold;
    line-height: 20px;
    text-shadow: 1px 1px 2px rgba(0,0,0,0.8);
  `;
  barText.id = `${id}-text`;
  
  barBg.appendChild(barFill);
  barBg.appendChild(barText);
  container.appendChild(labelEl);
  container.appendChild(barBg);
  
  return container;
}

function createButton(text: string, id: string): HTMLElement {
  const btn = document.createElement('button');
  btn.id = id.replace('#', '');
  btn.textContent = text;
  btn.style.cssText = `
    padding: 14px 36px;
    font-size: 20px;
    font-family: 'Ma Shan Zheng', 'KaiTi', serif;
    background: linear-gradient(to bottom, #8B0000, #5C0000);
    color: #FFD700;
    border: 3px solid #FFD700;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.3s ease-out;
    box-shadow: 0 4px 8px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.2);
    text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
    min-width: 140px;
  `;
  
  btn.addEventListener('mouseenter', () => {
    btn.style.transform = 'scale(1.05)';
    btn.style.boxShadow = '0 6px 12px rgba(0,0,0,0.4), 0 0 20px rgba(255,215,0,0.5), inset 0 1px 0 rgba(255,255,255,0.3)';
  });
  
  btn.addEventListener('mouseleave', () => {
    btn.style.transform = 'scale(1)';
    btn.style.boxShadow = '0 4px 8px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.2)';
  });
  
  return btn;
}

function createLogPanel(): HTMLElement {
  const panel = document.createElement('div');
  panel.className = 'log-panel';
  panel.style.cssText = `
    width: 280px;
    background: ${COLORS.parchment};
    border-left: 4px solid #8B4513;
    display: flex;
    flex-direction: column;
    box-shadow: inset 4px 0 8px rgba(0,0,0,0.2);
    z-index: 10;
    position: relative;
  `;

  const title = document.createElement('h2');
  title.className = 'title-font';
  title.textContent = '押镖日志';
  title.style.cssText = `
    color: #5D3A1A;
    font-size: 22px;
    text-align: center;
    padding: 12px 0;
    border-bottom: 2px solid #8B4513;
    background: linear-gradient(to bottom, rgba(139,69,19,0.1), transparent);
  `;

  const logContent = document.createElement('div');
  logContent.id = 'log-content';
  logContent.style.cssText = `
    flex: 1;
    padding: 12px;
    overflow-y: auto;
    display: flex;
    flex-direction: column-reverse;
    gap: 8px;
    font-family: 'ZCOOL XiaoWei', 'KaiTi', serif;
    font-size: 14px;
    line-height: 1.6;
    color: #3D2817;
  `;

  const toggleBtn = document.createElement('button');
  toggleBtn.className = 'log-toggle';
  toggleBtn.innerHTML = '☰';
  toggleBtn.style.cssText = `
    display: none;
    position: absolute;
    left: -44px;
    top: 50%;
    transform: translateY(-50%);
    width: 40px;
    height: 40px;
    background: #8B4513;
    color: #FFD700;
    border: 2px solid #FFD700;
    border-radius: 4px 0 0 4px;
    cursor: pointer;
    font-size: 20px;
  `;

  panel.appendChild(title);
  panel.appendChild(logContent);
  panel.appendChild(toggleBtn);

  return panel;
}

function resizeCanvas(): void {
  if (!elements) return;
  
  const { canvas } = elements;
  const rect = canvas.parentElement!.getBoundingClientRect();
  
  canvas.width = rect.width * window.devicePixelRatio;
  canvas.height = rect.height * window.devicePixelRatio;
  canvas.style.width = `${rect.width}px`;
  canvas.style.height = `${rect.height}px`;
  
  const ctx = canvas.getContext('2d')!;
  ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
}

function startAnimationLoop(): void {
  let lastTime = 0;
  
  const animate = (time: number) => {
    const deltaTime = (time - lastTime) / 1000;
    lastTime = time;
    
    updateParticles(deltaTime);
    
    if (currentState) {
      renderScene(currentState);
    }
    
    animationFrameId = requestAnimationFrame(animate);
  };
  
  animationFrameId = requestAnimationFrame(animate);
}

function getParticle(): Particle {
  if (particlePool.length > 0) {
    return particlePool.pop()!;
  }
  return { x: 0, y: 0, vx: 0, vy: 0, life: 0, maxLife: 1, color: '#000', size: 2 };
}

function releaseParticle(p: Particle): void {
  particlePool.push(p);
}

function createRainParticles(): void {
  if (!elements || weatherType !== 'rain') return;
  
  const { canvas } = elements;
  const count = 3;
  
  for (let i = 0; i < count; i++) {
    const p = getParticle();
    p.x = Math.random() * canvas.width;
    p.y = -10;
    p.vx = Math.sin(Math.PI / 6) * 400;
    p.vy = Math.cos(Math.PI / 6) * 600;
    p.life = 2;
    p.maxLife = 2;
    p.color = COLORS.rain;
    p.size = 2;
    particles.push(p);
  }
}

function createCampfireParticles(): void {
  if (!elements || weatherType !== 'campfire') return;
  
  const { canvas } = elements;
  const fireX = canvas.width / 2;
  const fireY = canvas.height * 0.6;
  
  for (let i = 0; i < 2; i++) {
    const p = getParticle();
    p.x = fireX + (Math.random() - 0.5) * 30;
    p.y = fireY;
    p.vx = (Math.random() - 0.5) * 50;
    p.vy = -100 - Math.random() * 100;
    p.life = 1.5;
    p.maxLife = 1.5;
    p.color = Math.random() > 0.5 ? '#FF6B00' : '#FFD700';
    p.size = 3 + Math.random() * 4;
    particles.push(p);
  }
}

function updateParticles(deltaTime: number): void {
  if (weatherType === 'rain') {
    createRainParticles();
  } else if (weatherType === 'campfire') {
    createCampfireParticles();
  }
  
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx * deltaTime;
    p.y += p.vy * deltaTime;
    p.life -= deltaTime;
    
    if (p.life <= 0) {
      releaseParticle(p);
      particles.splice(i, 1);
    }
  }
}

function renderParticles(ctx: CanvasRenderingContext2D): void {
  particles.forEach(p => {
    const alpha = p.life / p.maxLife;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = p.color;
    
    if (weatherType === 'rain') {
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x + 4, p.y + 12);
      ctx.strokeStyle = p.color;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
      ctx.fill();
    }
  });
  ctx.globalAlpha = 1;
}

export function renderScene(state: TeamState): void {
  if (!elements) return;
  
  currentState = state;
  const { canvas, ctx, progressBar, cargoBar, timeDisplay, teamPanel } = elements;
  const w = canvas.width / window.devicePixelRatio;
  const h = canvas.height / window.devicePixelRatio;
  
  ctx.clearRect(0, 0, w, h);
  
  drawMountains(ctx, w, h);
  drawGround(ctx, w, h, state);
  drawBureau(ctx, w, h);
  drawOxCart(ctx, w, h, state);
  drawProgressFlags(ctx, w, h, state);
  renderParticles(ctx);
  
  if (weatherType === 'rain') {
    ctx.fillStyle = 'rgba(70, 130, 180, 0.15)';
    ctx.fillRect(0, 0, w, h);
  } else if (weatherType === 'campfire') {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.fillRect(0, 0, w, h);
  }
  
  progressBar.style.width = `${state.progress}%`;
  (document.querySelector('#progress-bar-text') as HTMLElement).textContent = `${Math.floor(state.progress)}%`;
  
  cargoBar.style.width = `${state.cargoIntegrity}%`;
  if (state.cargoIntegrity > 70) {
    cargoBar.style.background = `linear-gradient(to right, ${COLORS.gold}, #FFA500)`;
  } else if (state.cargoIntegrity > 50) {
    cargoBar.style.background = `linear-gradient(to right, #FFA500, #FF6347)`;
  } else {
    cargoBar.style.background = `linear-gradient(to right, #FF6347, ${COLORS.strength})`;
  }
  (document.querySelector('#cargo-bar-text') as HTMLElement).textContent = `${Math.floor(state.cargoIntegrity)}%`;
  
  const mins = Math.floor(state.elapsedTime / 60);
  const secs = state.elapsedTime % 60;
  timeDisplay.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  
  renderTeamPanel(teamPanel, state);
}

function drawMountains(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  const horizonY = h * 0.55;
  
  ctx.fillStyle = COLORS.mountainFar;
  ctx.beginPath();
  ctx.moveTo(0, horizonY);
  for (let x = 0; x <= w; x += 50) {
    const y = horizonY - 30 - Math.sin(x * 0.008) * 40 - Math.cos(x * 0.012) * 25;
    ctx.lineTo(x, y);
  }
  ctx.lineTo(w, horizonY);
  ctx.closePath();
  ctx.fill();
  
  ctx.fillStyle = COLORS.mountainMid;
  ctx.beginPath();
  ctx.moveTo(0, horizonY + 10);
  for (let x = 0; x <= w; x += 40) {
    const y = horizonY + 10 - 50 - Math.sin(x * 0.01 + 1) * 50 - Math.cos(x * 0.015 + 0.5) * 30;
    ctx.lineTo(x, y);
  }
  ctx.lineTo(w, horizonY + 10);
  ctx.closePath();
  ctx.fill();
  
  ctx.fillStyle = COLORS.mountainNear;
  ctx.beginPath();
  ctx.moveTo(0, horizonY + 20);
  for (let x = 0; x <= w; x += 30) {
    const y = horizonY + 20 - 70 - Math.sin(x * 0.015 + 2) * 60 - Math.cos(x * 0.02 + 1) * 35;
    ctx.lineTo(x, y);
  }
  ctx.lineTo(w, horizonY + 20);
  ctx.closePath();
  ctx.fill();
}

function drawGround(ctx: CanvasRenderingContext2D, w: number, h: number, state: TeamState): void {
  const groundY = h * 0.75;
  
  if (weatherType === 'rain') {
    ctx.fillStyle = '#3D5A3D';
  } else {
    ctx.fillStyle = '#6B8E6B';
  }
  ctx.fillRect(0, groundY, w, h - groundY);
  
  ctx.strokeStyle = '#5D3A1A';
  ctx.lineWidth = 3;
  ctx.setLineDash([]);
  
  const roadStartX = w * 0.3;
  const roadEndX = w * 0.9;
  const progressOffset = (state.progress / 100) * (roadEndX - roadStartX);
  
  ctx.beginPath();
  ctx.moveTo(roadStartX, groundY + 10);
  ctx.lineTo(roadEndX - progressOffset, groundY + 10);
  ctx.stroke();
  
  ctx.fillStyle = '#8B7355';
  ctx.fillRect(roadStartX, groundY + 5, roadEndX - roadStartX - progressOffset, 15);
  
  ctx.strokeStyle = 'rgba(139,115,85,0.3)';
  ctx.lineWidth = 1;
  for (let x = roadStartX; x < roadEndX - progressOffset; x += 30) {
    ctx.beginPath();
    ctx.moveTo(x, groundY + 8);
    ctx.lineTo(x + 15, groundY + 17);
    ctx.stroke();
  }
}

function drawBureau(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  const groundY = h * 0.75;
  const bureauX = w * 0.08;
  const bureauW = w * 0.2;
  const bureauH = h * 0.3;
  const bureauY = groundY - bureauH;
  
  ctx.fillStyle = COLORS.rammedEarth;
  ctx.fillRect(bureauX, bureauY + bureauH * 0.2, bureauW, bureauH * 0.8);
  
  ctx.strokeStyle = '#8B6914';
  ctx.lineWidth = 2;
  for (let y = bureauY + bureauH * 0.25; y < groundY - 5; y += 15) {
    ctx.beginPath();
    ctx.moveTo(bureauX + 5, y);
    ctx.lineTo(bureauX + bureauW - 5, y);
    ctx.stroke();
  }
  
  ctx.fillStyle = COLORS.greyTile;
  ctx.beginPath();
  ctx.moveTo(bureauX - 15, bureauY + bureauH * 0.2);
  ctx.lineTo(bureauX + bureauW * 0.5, bureauY);
  ctx.lineTo(bureauX + bureauW + 15, bureauY + bureauH * 0.2);
  ctx.closePath();
  ctx.fill();
  
  ctx.strokeStyle = '#5D5D5D';
  ctx.lineWidth = 1;
  for (let i = 0; i < 8; i++) {
    const tileX = bureauX + bureauW * 0.2 + i * (bureauW * 0.075);
    ctx.beginPath();
    ctx.moveTo(tileX, bureauY + 5);
    ctx.lineTo(tileX + 10, bureauY + bureauH * 0.18);
    ctx.stroke();
  }
  
  ctx.fillStyle = '#5D3A1A';
  ctx.fillRect(bureauX + bureauW * 0.35, bureauY + bureauH * 0.5, bureauW * 0.3, bureauH * 0.5);
  
  ctx.fillStyle = '#FFD700';
  ctx.font = 'bold 20px "Ma Shan Zheng", serif';
  ctx.textAlign = 'center';
  ctx.fillText('风云镖局', bureauX + bureauW * 0.5, bureauY + bureauH * 0.18);
  
  ctx.fillStyle = '#DC143C';
  ctx.fillRect(bureauX + bureauW * 0.42, bureauY - 35, 6, 40);
  ctx.beginPath();
  ctx.moveTo(bureauX + bureauW * 0.42 + 6, bureauY - 30);
  ctx.lineTo(bureauX + bureauW * 0.42 + 30, bureauY - 22);
  ctx.lineTo(bureauX + bureauW * 0.42 + 6, bureauY - 14);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#FFD700';
  ctx.font = 'bold 12px serif';
  ctx.fillText('镖', bureauX + bureauW * 0.42 + 16, bureauY - 20);
}

function drawOxCart(ctx: CanvasRenderingContext2D, w: number, h: number, state: TeamState): void {
  const groundY = h * 0.75;
  const roadStartX = w * 0.3;
  const roadEndX = w * 0.9;
  const cartX = roadStartX + (state.progress / 100) * (roadEndX - roadStartX) - 40;
  const cartY = groundY - 5;
  
  if (state.progress === 0) return;
  
  ctx.fillStyle = '#8B4513';
  ctx.beginPath();
  ctx.ellipse(cartX - 30, cartY, 18, 25, Math.PI / 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#A0522D';
  ctx.beginPath();
  ctx.ellipse(cartX - 30, cartY, 8, 15, Math.PI / 2, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.fillStyle = '#4A3728';
  ctx.fillRect(cartX - 50, cartY - 3, 45, 25);
  ctx.fillStyle = '#8B4513';
  ctx.fillRect(cartX - 52, cartY - 8, 50, 8);
  
  ctx.fillStyle = '#3D2817';
  ctx.beginPath();
  ctx.arc(cartX - 35, cartY + 22, 15, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cartX - 5, cartY + 22, 15, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#8B4513';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(cartX - 35, cartY + 22, 8, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cartX - 5, cartY + 22, 8, 0, Math.PI * 2);
  ctx.stroke();
  
  const sackColors = ['rgba(210,180,140,0.7)', 'rgba(222,184,135,0.7)', 'rgba(245,222,179,0.7)'];
  for (let i = 0; i < 3; i++) {
    const sx = cartX - 45 + i * 15;
    const sy = cartY - 15 - (i % 2) * 8;
    ctx.fillStyle = sackColors[i];
    ctx.beginPath();
    ctx.ellipse(sx, sy, 10, 14, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#8B4513';
    ctx.lineWidth = 1;
    ctx.stroke();
    
    if (i === 0) {
      ctx.fillStyle = 'rgba(255,215,0,0.6)';
      ctx.fillRect(sx - 3, sy - 5, 6, 10);
    } else if (i === 1) {
      ctx.fillStyle = 'rgba(34,139,34,0.5)';
      ctx.beginPath();
      ctx.ellipse(sx, sy, 4, 6, 0.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function drawProgressFlags(ctx: CanvasRenderingContext2D, w: number, h: number, state: TeamState): void {
  const groundY = h * 0.75;
  const roadStartX = w * 0.35;
  const roadEndX = w * 0.85;
  const totalFlags = 10;
  const visibleFlags = Math.floor((1 - state.progress / 100) * totalFlags);
  
  for (let i = 0; i < visibleFlags; i++) {
    const fx = roadStartX + (i / totalFlags) * (roadEndX - roadStartX);
    const fy = groundY - 3;
    
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(fx, fy - 30, 3, 35);
    
    ctx.fillStyle = COLORS.flagRed;
    ctx.beginPath();
    ctx.moveTo(fx + 3, fy - 28);
    ctx.lineTo(fx + 20, fy - 23);
    ctx.lineTo(fx + 3, fy - 18);
    ctx.closePath();
    ctx.fill();
  }
}

function renderTeamPanel(panel: HTMLElement, state: TeamState): void {
  const existingCards = panel.querySelectorAll('.escort-card');
  existingCards.forEach(card => card.remove());
  
  state.escorts.forEach((escort, index) => {
    setTimeout(() => {
      const card = createEscortCard(escort);
      panel.appendChild(card);
    }, index * 50);
  });
}

function createEscortCard(escort: Escort): HTMLElement {
  const card = document.createElement('div');
  card.className = 'escort-card';
  card.style.cssText = `
    background: ${escort.alive ? 'rgba(255,248,220,0.95)' : 'rgba(100,100,100,0.6)'};
    border: 2px solid ${escort.alive ? '#8B4513' : '#555'};
    border-radius: 8px;
    padding: 8px;
    transition: all 0.3s ease-out;
    filter: ${escort.alive ? 'none' : 'grayscale(100%)'};
    opacity: ${escort.alive ? '1' : '0.6'};
  `;
  
  const header = document.createElement('div');
  header.style.cssText = 'display: flex; align-items: center; gap: 8px; margin-bottom: 6px;';
  
  const avatar = document.createElement('div');
  avatar.style.cssText = `
    width: 36px;
    height: 36px;
    background: ${escort.alive ? 'linear-gradient(135deg, #FFD700, #FFA500)' : '#666'};
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    border: 2px solid ${escort.alive ? '#8B0000' : '#444'};
  `;
  avatar.textContent = escort.alive ? escort.avatar : '💀';
  
  const name = document.createElement('span');
  name.style.cssText = `
    font-weight: bold;
    color: ${escort.alive ? '#5D3A1A' : '#999'};
    font-size: 14px;
    flex: 1;
  `;
  name.textContent = escort.name;
  
  header.appendChild(avatar);
  header.appendChild(name);
  
  const stats = document.createElement('div');
  stats.style.cssText = 'display: flex; flex-direction: column; gap: 3px;';
  
  stats.appendChild(createStatBar('体力', escort.stamina, COLORS.stamina));
  stats.appendChild(createStatBar('武力', escort.strength, COLORS.strength));
  stats.appendChild(createStatBar('士气', escort.morale, COLORS.morale));
  
  card.appendChild(header);
  card.appendChild(stats);
  
  return card;
}

function createStatBar(label: string, value: number, color: string): HTMLElement {
  const container = document.createElement('div');
  container.style.cssText = 'display: flex; align-items: center; gap: 4px;';
  
  const labelEl = document.createElement('span');
  labelEl.style.cssText = 'font-size: 10px; color: #5D3A1A; width: 24px;';
  labelEl.textContent = label;
  
  const barBg = document.createElement('div');
  barBg.style.cssText = `
    flex: 1;
    height: 8px;
    background: rgba(0,0,0,0.3);
    border-radius: 4px;
    overflow: hidden;
  `;
  
  const barFill = document.createElement('div');
  barFill.style.cssText = `
    width: ${value}%;
    height: 100%;
    background: linear-gradient(to right, ${color}, ${color}cc);
    transition: width 0.3s ease-out, background-color 0.3s ease-out;
    border-radius: 4px;
  `;
  
  const valueEl = document.createElement('span');
  valueEl.style.cssText = 'font-size: 10px; color: #5D3A1A; width: 28px; text-align: right;';
  valueEl.textContent = Math.floor(value).toString();
  
  barBg.appendChild(barFill);
  container.appendChild(labelEl);
  container.appendChild(barBg);
  container.appendChild(valueEl);
  
  return container;
}

export function updateLog(message: string): void {
  const logContent = document.querySelector('#log-content');
  if (!logContent) return;
  
  const entry = document.createElement('div');
  entry.className = 'log-entry ink-spread slide-in';
  entry.style.cssText = `
    padding: 8px 10px;
    background: rgba(139,69,19,0.1);
    border-left: 3px solid #8B4513;
    border-radius: 0 4px 4px 0;
    position: relative;
  `;
  
  const time = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  entry.innerHTML = `
    <span style="color: #8B4513; font-size: 11px;">[${time}]</span>
    <span style="margin-left: 4px;">${message}</span>
  `;
  
  logContent.insertBefore(entry, logContent.firstChild);
  
  while (logContent.children.length > 50) {
    logContent.removeChild(logContent.lastChild);
  }
}

export function showEventDialog(
  event: GameEvent,
  callback: (option: EventOption) => void
): void {
  if (!elements) return;
  
  const dialog = document.createElement('div');
  dialog.className = 'event-dialog';
  dialog.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0,0,0,0.6);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 200;
  `;
  
  const scroll = document.createElement('div');
  scroll.className = 'scroll-unroll';
  scroll.style.cssText = `
    background: ${COLORS.scrollBg};
    padding: 40px 50px;
    max-width: 600px;
    width: 90%;
    position: relative;
    border: none;
    box-shadow: 0 20px 60px rgba(0,0,0,0.5);
  `;
  
  const leftAxle = document.createElement('div');
  leftAxle.style.cssText = `
    position: absolute;
    left: -15px;
    top: 0;
    height: 100%;
    width: 30px;
    background: linear-gradient(to right, #5D3A1A, #8B4513, #5D3A1A);
    border-radius: 8px;
    box-shadow: -3px 0 8px rgba(0,0,0,0.3);
  `;
  
  const rightAxle = document.createElement('div');
  rightAxle.style.cssText = `
    position: absolute;
    right: -15px;
    top: 0;
    height: 100%;
    width: 30px;
    background: linear-gradient(to left, #5D3A1A, #8B4513, #5D3A1A);
    border-radius: 8px;
    box-shadow: 3px 0 8px rgba(0,0,0,0.3);
  `;
  
  const borderPattern = document.createElement('div');
  borderPattern.style.cssText = `
    position: absolute;
    inset: 10px;
    border: 3px double #8B4513;
    border-radius: 4px;
    pointer-events: none;
  `;
  
  const title = document.createElement('h3');
  title.className = 'title-font';
  title.textContent = event.title;
  title.style.cssText = `
    font-size: 32px;
    color: #8B0000;
    text-align: center;
    margin-bottom: 20px;
    text-shadow: 2px 2px 4px rgba(0,0,0,0.2);
  `;
  
  const description = document.createElement('p');
  description.textContent = event.description;
  description.style.cssText = `
    font-size: 18px;
    color: #3D2817;
    line-height: 1.8;
    text-align: center;
    margin-bottom: 30px;
    padding: 0 20px;
  `;
  
  const optionsContainer = document.createElement('div');
  optionsContainer.style.cssText = `
    display: flex;
    flex-direction: column;
    gap: 15px;
    align-items: center;
  `;
  
  event.options.forEach((option, index) => {
    const btn = document.createElement('button');
    btn.className = 'option-button';
    btn.style.cssText = `
      width: 320px;
      padding: 16px 24px;
      font-size: 20px;
      font-family: 'ZCOOL XiaoWei', 'KaiTi', serif;
      background: linear-gradient(to bottom, #DEB887, #D2691E);
      color: #3D2817;
      border: 3px solid #8B4513;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.3s ease-out;
      box-shadow: 0 4px 8px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.3);
      position: relative;
      transform: translateY(20px);
      opacity: 0;
      animation: slideInUp 0.3s ease-out forwards;
      animation-delay: ${0.3 + index * 0.1}s;
    `;
    
    btn.innerHTML = `
      <span style="font-weight: bold;">${['壹', '贰', '叁'][index]}.</span>
      <span style="margin-left: 10px;">${option.text}</span>
    `;
    
    btn.addEventListener('mouseenter', () => {
      btn.style.transform = 'translateY(-5px) scale(1.05)';
      btn.style.boxShadow = '0 8px 16px rgba(0,0,0,0.4), 0 0 20px rgba(139,69,19,0.4)';
    });
    
    btn.addEventListener('mouseleave', () => {
      btn.style.transform = 'translateY(0) scale(1)';
      btn.style.boxShadow = '0 4px 8px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.3)';
    });
    
    btn.addEventListener('click', () => {
      dialog.remove();
      callback(option);
    });
    
    optionsContainer.appendChild(btn);
  });
  
  scroll.appendChild(leftAxle);
  scroll.appendChild(rightAxle);
  scroll.appendChild(borderPattern);
  scroll.appendChild(title);
  scroll.appendChild(description);
  scroll.appendChild(optionsContainer);
  dialog.appendChild(scroll);
  
  elements.overlay.appendChild(dialog);
}

export function renderBattle(
  battle: BattleState,
  state: TeamState,
  callback: (action: 'attack' | 'defend' | 'retreat') => void
): void {
  if (!elements) return;
  
  clearWeather();
  
  const existingBattle = elements.overlay.querySelector('.battle-container');
  if (existingBattle) existingBattle.remove();
  
  const container = document.createElement('div');
  container.className = 'battle-container';
  container.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0,0,0,0.7);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    z-index: 200;
    padding: 20px;
  `;
  
  const battleArea = document.createElement('div');
  battleArea.style.cssText = `
    width: 100%;
    max-width: 700px;
    height: 350px;
    background: linear-gradient(to bottom, #8B4513 0%, #654321 50%, #8B4513 100%);
    border: 4px solid #FFD700;
    border-radius: 12px;
    position: relative;
    overflow: hidden;
    margin-bottom: 20px;
  `;
  
  const playerArea = document.createElement('div');
  playerArea.id = 'player-area';
  playerArea.style.cssText = `
    position: absolute;
    left: 60px;
    top: 50%;
    transform: translateY(-50%);
    display: flex;
    flex-direction: column;
    align-items: center;
    transition: transform 0.3s ease-out;
  `;
  
  const playerChar = createQbCharacter('player', state);
  const playerLabel = document.createElement('div');
  playerLabel.style.cssText = 'margin-top: 8px; color: #FFD700; font-weight: bold; text-shadow: 2px 2px 4px rgba(0,0,0,0.8);';
  playerLabel.textContent = '镖队';
  playerArea.appendChild(playerChar);
  playerArea.appendChild(playerLabel);
  
  const enemyArea = document.createElement('div');
  enemyArea.id = 'enemy-area';
  enemyArea.style.cssText = `
    position: absolute;
    right: 60px;
    top: 50%;
    transform: translateY(-50%);
    display: flex;
    flex-direction: column;
    align-items: center;
    transition: transform 0.3s ease-out;
  `;
  
  const enemyChar = createQbCharacter('enemy', state, battle.enemy);
  const enemyLabel = document.createElement('div');
  enemyLabel.style.cssText = 'margin-top: 8px; color: #FF6B6B; font-weight: bold; text-shadow: 2px 2px 4px rgba(0,0,0,0.8);';
  enemyLabel.textContent = battle.enemy.name;
  enemyArea.appendChild(enemyChar);
  enemyArea.appendChild(enemyLabel);
  
  const enemyHpBar = document.createElement('div');
  enemyHpBar.style.cssText = `
    width: 120px;
    height: 12px;
    background: rgba(0,0,0,0.5);
    border: 2px solid #333;
    border-radius: 6px;
    overflow: hidden;
    margin-top: 5px;
  `;
  const enemyHpFill = document.createElement('div');
  enemyHpFill.style.cssText = `
    width: ${(battle.enemy.health / battle.enemy.maxHealth) * 100}%;
    height: 100%;
    background: linear-gradient(to right, #FF6B6B, #DC143C);
    transition: width 0.3s ease-out;
  `;
  enemyHpBar.appendChild(enemyHpFill);
  enemyArea.appendChild(enemyHpBar);
  
  const vsText = document.createElement('div');
  vsText.className = 'title-font';
  vsText.style.cssText = `
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    font-size: 48px;
    color: #FFD700;
    text-shadow: 3px 3px 6px rgba(0,0,0,0.8), 0 0 20px rgba(255,215,0,0.5);
  `;
  vsText.textContent = 'VS';
  
  battleArea.appendChild(playerArea);
  battleArea.appendChild(enemyArea);
  battleArea.appendChild(vsText);
  
  battle.effects.forEach(effect => {
    playBattleEffect(effect, battleArea);
  });
  
  const infoPanel = document.createElement('div');
  infoPanel.style.cssText = `
    background: ${COLORS.parchment};
    border: 3px solid #8B4513;
    border-radius: 8px;
    padding: 15px 25px;
    margin-bottom: 15px;
    min-width: 400px;
  `;
  
  const roundInfo = document.createElement('div');
  roundInfo.style.cssText = `
    display: flex;
    justify-content: space-between;
    margin-bottom: 10px;
    font-weight: bold;
    color: #5D3A1A;
  `;
  roundInfo.innerHTML = `
    <span>第 ${battle.round}/${battle.maxRounds} 回合</span>
    <span>${battle.playerTurn ? '👉 我方回合' : '⏳ 敌方回合'}</span>
  `;
  
  const battleLog = document.createElement('div');
  battleLog.style.cssText = `
    max-height: 80px;
    overflow-y: auto;
    font-size: 14px;
    color: #3D2817;
    line-height: 1.6;
  `;
  battleLog.innerHTML = battle.log.slice(-3).map(l => `<div>${l}</div>`).join('');
  
  infoPanel.appendChild(roundInfo);
  infoPanel.appendChild(battleLog);
  
  const actionsContainer = document.createElement('div');
  actionsContainer.style.cssText = `
    display: flex;
    gap: 15px;
    justify-content: center;
  `;
  
  const actions: { id: 'attack' | 'defend' | 'retreat'; text: string; emoji: string }[] = [
    { id: 'attack', text: '攻击', emoji: '⚔️' },
    { id: 'defend', text: '防御', emoji: '🛡️' },
    { id: 'retreat', text: '撤退', emoji: '🏃' }
  ];
  
  actions.forEach(action => {
    const btn = document.createElement('button');
    btn.style.cssText = `
      padding: 15px 30px;
      font-size: 18px;
      font-family: 'ZCOOL XiaoWei', 'KaiTi', serif;
      background: linear-gradient(to bottom, #DEB887, #D2691E);
      color: #3D2817;
      border: 3px solid #8B4513;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.3s ease-out;
      box-shadow: 0 4px 8px rgba(0,0,0,0.3);
      min-width: 120px;
      ${!battle.playerTurn || battle.result !== 'ongoing' ? 'opacity: 0.5; cursor: not-allowed;' : ''}
    `;
    btn.innerHTML = `<span style="font-size: 24px;">${action.emoji}</span><br>${action.text}`;
    
    if (battle.playerTurn && battle.result === 'ongoing') {
      btn.addEventListener('mouseenter', () => {
        btn.style.transform = 'scale(1.05)';
        btn.style.boxShadow = '0 6px 12px rgba(0,0,0,0.4)';
      });
      btn.addEventListener('mouseleave', () => {
        btn.style.transform = 'scale(1)';
        btn.style.boxShadow = '0 4px 8px rgba(0,0,0,0.3)';
      });
      btn.addEventListener('click', () => {
        container.remove();
        callback(action.id);
      });
    }
    
    actionsContainer.appendChild(btn);
  });
  
  container.appendChild(battleArea);
  container.appendChild(infoPanel);
  container.appendChild(actionsContainer);
  
  elements.overlay.appendChild(container);
}

function createQbCharacter(type: 'player' | 'enemy', state: TeamState, enemy?: any): HTMLElement {
  const char = document.createElement('div');
  char.style.cssText = `
    width: 100px;
    height: 100px;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
  `;
  
  const body = document.createElement('div');
  body.style.cssText = `
    width: 70px;
    height: 70px;
    background: ${type === 'player' ? 'linear-gradient(135deg, #4169E1, #1E90FF)' : 'linear-gradient(135deg, #8B0000, #DC143C)'};
    border-radius: 50% 50% 45% 45%;
    position: relative;
    border: 3px solid ${type === 'player' ? '#FFD700' : '#333'};
    box-shadow: 0 4px 8px rgba(0,0,0,0.4);
  `;
  
  const face = document.createElement('div');
  face.style.cssText = `
    position: absolute;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    width: 50px;
    height: 35px;
  `;
  
  const eyes = document.createElement('div');
  eyes.style.cssText = 'display: flex; justify-content: space-around; margin-bottom: 5px;';
  eyes.innerHTML = `
    <div style="width: 10px; height: 10px; background: #000; border-radius: 50%;"></div>
    <div style="width: 10px; height: 10px; background: #000; border-radius: 50%;"></div>
  `;
  
  const mouth = document.createElement('div');
  mouth.style.cssText = `
    width: 25px;
    height: 6px;
    margin: 0 auto;
    border: 2px solid #000;
    border-top: none;
    border-radius: 0 0 15px 15px;
  `;
  
  face.appendChild(eyes);
  face.appendChild(mouth);
  body.appendChild(face);
  
  if (type === 'player') {
    const hat = document.createElement('div');
    hat.style.cssText = `
      position: absolute;
      top: -25px;
      left: 50%;
      transform: translateX(-50%);
      width: 0;
      height: 0;
      border-left: 25px solid transparent;
      border-right: 25px solid transparent;
      border-bottom: 30px solid #8B4513;
    `;
    body.appendChild(hat);
    
    const sword = document.createElement('div');
    sword.style.cssText = `
      position: absolute;
      right: -25px;
      top: 15px;
      width: 8px;
      height: 50px;
      background: linear-gradient(to right, #888, #FFF, #888);
      border-radius: 2px;
      transform: rotate(-30deg);
    `;
    body.appendChild(sword);
  } else {
    const bandana = document.createElement('div');
    bandana.style.cssText = `
      position: absolute;
      top: -5px;
      left: 50%;
      transform: translateX(-50%);
      width: 60px;
      height: 15px;
      background: #DC143C;
      border-radius: 50% 50% 0 0;
    `;
    body.appendChild(bandana);
    
    const weapon = document.createElement('div');
    weapon.style.cssText = `
      position: absolute;
      left: -30px;
      top: 20px;
      width: 12px;
      height: 45px;
      background: #8B4513;
      border-radius: 3px;
      transform: rotate(30deg);
    `;
    body.appendChild(weapon);
  }
  
  char.appendChild(body);
  return char;
}

function playBattleEffect(effect: BattleEffect, container: HTMLElement): void {
  const playerArea = container.querySelector('#player-area') as HTMLElement;
  const enemyArea = container.querySelector('#enemy-area') as HTMLElement;
  
  const targetArea = effect.actor === 'player' ? enemyArea : playerArea;
  const sourceArea = effect.actor === 'player' ? playerArea : enemyArea;
  
  if (effect.type === 'hit' || effect.type === 'critical') {
    sourceArea.style.transform = 'translateY(-50%) translateX(30px)';
    setTimeout(() => {
      sourceArea.style.transform = 'translateY(-50%) translateX(0)';
    }, 200);
    
    targetArea.classList.add('shake');
    setTimeout(() => targetArea.classList.remove('shake'), 300);
    
    if (effect.type === 'critical') {
      container.classList.add('shake');
      setTimeout(() => container.classList.remove('shake'), 300);
      
      const flash = document.createElement('div');
      flash.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(255,215,0,0.5);
        pointer-events: none;
        animation: inkSpread 0.3s ease-out forwards;
      `;
      container.appendChild(flash);
      setTimeout(() => flash.remove(), 300);
      
      const slash = document.createElement('div');
      slash.className = 'title-font';
      slash.style.cssText = `
        position: absolute;
        left: 50%;
        top: 30%;
        transform: translate(-50%, -50%);
        font-size: 60px;
        color: #FFD700;
        text-shadow: 0 0 20px #FF6B00, 0 0 40px #FF0000;
        animation: inkSpread 0.4s ease-out forwards;
        z-index: 10;
      `;
      slash.textContent = '暴击！';
      container.appendChild(slash);
      setTimeout(() => slash.remove(), 500);
    }
  } else if (effect.type === 'dodge') {
    targetArea.style.transform = 'translateY(-50%) translateX(-20px) rotate(-15deg)';
    targetArea.style.opacity = '0.5';
    setTimeout(() => {
      targetArea.style.transform = 'translateY(-50%) translateX(0) rotate(0deg)';
      targetArea.style.opacity = '1';
    }, 300);
    
    const afterimage = targetArea.cloneNode(true) as HTMLElement;
    afterimage.style.opacity = '0.3';
    afterimage.style.filter = 'blur(2px)';
    afterimage.style.pointerEvents = 'none';
    targetArea.parentElement!.insertBefore(afterimage, targetArea);
    setTimeout(() => afterimage.remove(), 300);
  } else if (effect.type === 'block') {
    const shield = document.createElement('div');
    shield.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 120px;
      height: 120px;
      border: 4px solid #FFD700;
      border-radius: 50%;
      background: rgba(255,215,0,0.2);
      animation: inkSpread 0.3s ease-out forwards;
      box-shadow: 0 0 30px rgba(255,215,0,0.6);
      pointer-events: none;
    `;
    targetArea.appendChild(shield);
    setTimeout(() => shield.remove(), 400);
  }
}

export function showSettlement(
  state: TeamState,
  callback: { onRestart: () => void; onViewHistory: () => void }
): void {
  if (!elements) return;
  
  const dialog = document.createElement('div');
  dialog.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0,0,0,0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 200;
    padding: 20px;
  `;
  
  const scroll = document.createElement('div');
  scroll.className = 'scroll-unroll';
  scroll.style.cssText = `
    background: ${COLORS.scrollBg};
    padding: 50px 60px;
    max-width: 550px;
    width: 100%;
    position: relative;
    box-shadow: 0 20px 60px rgba(0,0,0,0.5);
  `;
  
  const borderDecor = document.createElement('div');
  borderDecor.style.cssText = `
    position: absolute;
    inset: 15px;
    border: 3px double #8B4513;
    border-radius: 4px;
    pointer-events: none;
  `;
  
  const cornerPatterns = ['↖', '↗', '↙', '↘'];
  cornerPatterns.forEach((corner, i) => {
    const c = document.createElement('div');
    c.style.cssText = `
      position: absolute;
      ${i < 2 ? 'top' : 'bottom'}: 5px;
      ${i % 2 === 0 ? 'left' : 'right'}: 5px;
      font-size: 30px;
      color: #8B4513;
      opacity: 0.5;
    `;
    c.textContent = corner;
    scroll.appendChild(c);
  });
  
  const title = document.createElement('h2');
  title.className = 'title-font';
  title.textContent = state.isVictory ? '🎉 押镖成功！' : '💔 押镖失败';
  title.style.cssText = `
    font-size: 40px;
    color: ${state.isVictory ? '#228B22' : '#8B0000'};
    text-align: center;
    margin-bottom: 30px;
    text-shadow: 3px 3px 6px rgba(0,0,0,0.2);
  `;
  
  const reward = calculateReward(state);
  const survivors = getAliveEscorts(state).length;
  const comment = getRandomComment();
  
  const details = document.createElement('div');
  details.style.cssText = `
    display: flex;
    flex-direction: column;
    gap: 15px;
    margin-bottom: 30px;
  `;
  
  const detailItems = [
    { label: '总用时', value: `${Math.floor(state.elapsedTime / 60)}分${state.elapsedTime % 60}秒`, icon: '⏱️' },
    { label: '货物完整度', value: `${Math.floor(state.cargoIntegrity)}%`, icon: '📦' },
    { label: '镖师存活', value: `${survivors}/${state.escorts.length}人`, icon: '👥' },
    { label: '最终酬金', value: `${reward}两`, icon: '💰', highlight: true }
  ];
  
  detailItems.forEach(item => {
    const row = document.createElement('div');
    row.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 20px;
      background: ${item.highlight ? 'rgba(255,215,0,0.2)' : 'rgba(139,69,19,0.1)'};
      border-radius: 6px;
      border-left: 4px solid ${item.highlight ? '#FFD700' : '#8B4513'};
    `;
    
    const label = document.createElement('span');
    label.innerHTML = `<span style="margin-right: 10px;">${item.icon}</span>${item.label}`;
    label.style.cssText = 'color: #5D3A1A; font-weight: bold; font-size: 16px;';
    
    const value = document.createElement('span');
    value.textContent = item.value;
    value.style.cssText = `color: ${item.highlight ? '#8B0000' : '#3D2817'}; font-weight: bold; font-size: ${item.highlight ? '24px' : '18px'};`;
    
    row.appendChild(label);
    row.appendChild(value);
    details.appendChild(row);
  });
  
  const commentBox = document.createElement('div');
  commentBox.className = 'title-font';
  commentBox.style.cssText = `
    text-align: center;
    padding: 20px;
    margin: 20px 0;
    background: rgba(139,69,19,0.15);
    border-radius: 8px;
    font-style: italic;
    color: #5D3A1A;
    font-size: 20px;
    border: 2px dashed #8B4513;
  `;
  commentBox.textContent = `「${comment}」`;
  
  const buttonsContainer = document.createElement('div');
  buttonsContainer.style.cssText = `
    display: flex;
    gap: 20px;
    justify-content: center;
    margin-top: 30px;
  `;
  
  const restartBtn = createSettlementButton('再押一镖', '🔄');
  restartBtn.addEventListener('click', () => {
    dialog.remove();
    clearWeather();
    callback.onRestart();
  });
  
  const historyBtn = createSettlementButton('查看日志', '📜');
  historyBtn.addEventListener('click', () => {
    dialog.remove();
    callback.onViewHistory();
  });
  
  buttonsContainer.appendChild(restartBtn);
  buttonsContainer.appendChild(historyBtn);
  
  scroll.appendChild(borderDecor);
  scroll.appendChild(title);
  scroll.appendChild(details);
  scroll.appendChild(commentBox);
  scroll.appendChild(buttonsContainer);
  dialog.appendChild(scroll);
  
  elements!.overlay.appendChild(dialog);
}

function createSettlementButton(text: string, emoji: string): HTMLElement {
  const btn = document.createElement('button');
  btn.style.cssText = `
    padding: 16px 32px;
    font-size: 20px;
    font-family: 'ZCOOL XiaoWei', 'KaiTi', serif;
    background: linear-gradient(to bottom, #8B0000, #5C0000);
    color: #FFD700;
    border: 3px solid #FFD700;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.3s ease-out;
    box-shadow: 0 4px 8px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.2);
    text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
    min-width: 160px;
  `;
  btn.innerHTML = `<span style="margin-right: 8px;">${emoji}</span>${text}`;
  
  btn.addEventListener('mouseenter', () => {
    btn.style.transform = 'scale(1.05)';
    btn.style.boxShadow = '0 6px 12px rgba(0,0,0,0.4), 0 0 30px rgba(255,215,0,0.6), inset 0 1px 0 rgba(255,255,255,0.3)';
    btn.style.filter = 'brightness(1.2)';
  });
  
  btn.addEventListener('mouseleave', () => {
    btn.style.transform = 'scale(1)';
    btn.style.boxShadow = '0 4px 8px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.2)';
    btn.style.filter = 'brightness(1)';
  });
  
  return btn;
}

export function showHistory(records: EscortRecord[], onClear: () => void, onClose: () => void): void {
  if (!elements) return;
  
  const dialog = document.createElement('div');
  dialog.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0,0,0,0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 200;
    padding: 20px;
  `;
  
  const scroll = document.createElement('div');
  scroll.className = 'scroll-unroll';
  scroll.style.cssText = `
    background: ${COLORS.scrollBg};
    padding: 40px 50px;
    max-width: 700px;
    width: 100%;
    max-height: 80vh;
    position: relative;
    box-shadow: 0 20px 60px rgba(0,0,0,0.5);
    display: flex;
    flex-direction: column;
  `;
  
  const borderDecor = document.createElement('div');
  borderDecor.style.cssText = `
    position: absolute;
    inset: 15px;
    border: 3px double #8B4513;
    border-radius: 4px;
    pointer-events: none;
  `;
  
  const title = document.createElement('h2');
  title.className = 'title-font';
  title.textContent = '📜 押镖史册';
  title.style.cssText = `
    font-size: 36px;
    color: #8B0000;
    text-align: center;
    margin-bottom: 25px;
    text-shadow: 2px 2px 4px rgba(0,0,0,0.2);
  `;
  
  const tableContainer = document.createElement('div');
  tableContainer.style.cssText = `
    flex: 1;
    overflow-y: auto;
    border: 2px solid #8B4513;
    border-radius: 6px;
    background: rgba(255,248,220,0.5);
  `;
  
  const table = document.createElement('table');
  table.style.cssText = `
    width: 100%;
    border-collapse: collapse;
    font-size: 14px;
  `;
  
  const thead = document.createElement('thead');
  thead.innerHTML = `
    <tr style="background: #8B4513; color: #FFD700;">
      <th style="padding: 12px; text-align: left;">日期</th>
      <th style="padding: 12px; text-align: center;">用时</th>
      <th style="padding: 12px; text-align: center;">货物</th>
      <th style="padding: 12px; text-align: center;">存活</th>
      <th style="padding: 12px; text-align: right;">酬金</th>
    </tr>
  `;
  
  const tbody = document.createElement('tbody');
  
  if (records.length === 0) {
    const emptyRow = document.createElement('tr');
    emptyRow.innerHTML = `
      <td colspan="5" style="padding: 40px; text-align: center; color: #8B4513; font-style: italic;">
        暂无押镖记录，快去闯一闯江湖吧！
      </td>
    `;
    tbody.appendChild(emptyRow);
  } else {
    records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    records.forEach((record, index) => {
      const row = document.createElement('tr');
      row.style.cssText = `
        background: ${index % 2 === 0 ? '#FFF5EE' : '#F5DEB3'};
        transition: all 0.2s ease-out;
        cursor: pointer;
      `;
      
      row.addEventListener('mouseenter', () => {
        row.style.background = '#FFE4B5';
        row.style.transform = 'scale(1.01)';
      });
      
      row.addEventListener('mouseleave', () => {
        row.style.background = index % 2 === 0 ? '#FFF5EE' : '#F5DEB3';
        row.style.transform = 'scale(1)';
      });
      
      const date = new Date(record.date);
      const dateStr = date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
      
      row.innerHTML = `
        <td style="padding: 10px 12px; border-bottom: 1px solid #D2B48C;">${dateStr}</td>
        <td style="padding: 10px 12px; text-align: center; border-bottom: 1px solid #D2B48C;">${Math.floor(record.duration / 60)}分${record.duration % 60}秒</td>
        <td style="padding: 10px 12px; text-align: center; border-bottom: 1px solid #D2B48C;">
          <span style="color: ${record.cargoIntegrity > 70 ? '#228B22' : record.cargoIntegrity > 50 ? '#FFA500' : '#DC143C'}; font-weight: bold;">
            ${record.cargoIntegrity}%
          </span>
        </td>
        <td style="padding: 10px 12px; text-align: center; border-bottom: 1px solid #D2B48C;">${record.survivors}/6人</td>
        <td style="padding: 10px 12px; text-align: right; border-bottom: 1px solid #D2B48C; font-weight: bold; color: #8B0000;">${record.reward}两</td>
      `;
      
      tbody.appendChild(row);
    });
  }
  
  table.appendChild(thead);
  table.appendChild(tbody);
  tableContainer.appendChild(table);
  
  const buttonsContainer = document.createElement('div');
  buttonsContainer.style.cssText = `
    display: flex;
    justify-content: space-between;
    margin-top: 25px;
    gap: 15px;
  `;
  
  const clearBtn = document.createElement('button');
  clearBtn.textContent = '🗑️ 清空记录';
  clearBtn.style.cssText = `
    padding: 12px 24px;
    font-size: 16px;
    font-family: 'ZCOOL XiaoWei', 'KaiTi', serif;
    background: linear-gradient(to bottom, #666, #444);
    color: #FFF;
    border: 2px solid #555;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.3s ease-out;
  `;
  
  clearBtn.addEventListener('mouseenter', () => {
    clearBtn.style.transform = 'scale(1.05)';
    clearBtn.style.background = 'linear-gradient(to bottom, #8B0000, #5C0000)';
    clearBtn.style.borderColor = '#FFD700';
  });
  
  clearBtn.addEventListener('mouseleave', () => {
    clearBtn.style.transform = 'scale(1)';
    clearBtn.style.background = 'linear-gradient(to bottom, #666, #444)';
    clearBtn.style.borderColor = '#555';
  });
  
  clearBtn.addEventListener('click', () => {
    showConfirmDialog('确定要清空所有押镖记录吗？此操作不可恢复。', () => {
      dialog.remove();
      onClear();
    });
  });
  
  const closeBtn = document.createElement('button');
  closeBtn.textContent = '关闭 ✖';
  closeBtn.style.cssText = `
    padding: 12px 24px;
    font-size: 16px;
    font-family: 'ZCOOL XiaoWei', 'KaiTi', serif;
    background: linear-gradient(to bottom, #8B4513, #5D3A1A);
    color: #FFD700;
    border: 2px solid #FFD700;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.3s ease-out;
  `;
  
  closeBtn.addEventListener('mouseenter', () => {
    closeBtn.style.transform = 'scale(1.05)';
    closeBtn.style.boxShadow = '0 0 20px rgba(255,215,0,0.5)';
  });
  
  closeBtn.addEventListener('mouseleave', () => {
    closeBtn.style.transform = 'scale(1)';
    closeBtn.style.boxShadow = 'none';
  });
  
  closeBtn.addEventListener('click', () => {
    dialog.remove();
    onClose();
  });
  
  buttonsContainer.appendChild(clearBtn);
  buttonsContainer.appendChild(closeBtn);
  
  scroll.appendChild(borderDecor);
  scroll.appendChild(title);
  scroll.appendChild(tableContainer);
  scroll.appendChild(buttonsContainer);
  dialog.appendChild(scroll);
  
  elements.overlay.appendChild(dialog);
}

function showConfirmDialog(message: string, onConfirm: () => void): void {
  if (!elements) return;
  
  const dialog = document.createElement('div');
  dialog.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0,0,0,0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 300;
  `;
  
  const scroll = document.createElement('div');
  scroll.className = 'scroll-unroll';
  scroll.style.cssText = `
    background: ${COLORS.scrollBg};
    padding: 35px 45px;
    max-width: 450px;
    width: 90%;
    position: relative;
    box-shadow: 0 20px 60px rgba(0,0,0,0.5);
  `;
  
  const leftAxle = document.createElement('div');
  leftAxle.style.cssText = `
    position: absolute;
    left: -12px;
    top: 0;
    height: 100%;
    width: 24px;
    background: linear-gradient(to right, #5D3A1A, #8B4513, #5D3A1A);
    border-radius: 6px;
  `;
  
  const rightAxle = document.createElement('div');
  rightAxle.style.cssText = `
    position: absolute;
    right: -12px;
    top: 0;
    height: 100%;
    width: 24px;
    background: linear-gradient(to left, #5D3A1A, #8B4513, #5D3A1A);
    border-radius: 6px;
  `;
  
  const messageEl = document.createElement('p');
  messageEl.textContent = message;
  messageEl.style.cssText = `
    font-size: 18px;
    color: #3D2817;
    text-align: center;
    margin-bottom: 25px;
    line-height: 1.8;
  `;
  
  const buttonsContainer = document.createElement('div');
  buttonsContainer.style.cssText = `
    display: flex;
    gap: 15px;
    justify-content: center;
  `;
  
  const confirmBtn = document.createElement('button');
  confirmBtn.textContent = '确定';
  confirmBtn.style.cssText = `
    padding: 10px 28px;
    font-size: 16px;
    font-family: 'ZCOOL XiaoWei', 'KaiTi', serif;
    background: linear-gradient(to bottom, #8B0000, #5C0000);
    color: #FFD700;
    border: 2px solid #FFD700;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.3s ease-out;
  `;
  
  confirmBtn.addEventListener('click', () => {
    dialog.remove();
    onConfirm();
  });
  
  const cancelBtn = document.createElement('button');
  cancelBtn.textContent = '取消';
  cancelBtn.style.cssText = `
    padding: 10px 28px;
    font-size: 16px;
    font-family: 'ZCOOL XiaoWei', 'KaiTi', serif;
    background: linear-gradient(to bottom, #888, #666);
    color: #FFF;
    border: 2px solid #999;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.3s ease-out;
  `;
  
  cancelBtn.addEventListener('click', () => {
    dialog.remove();
  });
  
  [confirmBtn, cancelBtn].forEach(btn => {
    btn.addEventListener('mouseenter', () => btn.style.transform = 'scale(1.05)');
    btn.addEventListener('mouseleave', () => btn.style.transform = 'scale(1)');
  });
  
  buttonsContainer.appendChild(cancelBtn);
  buttonsContainer.appendChild(confirmBtn);
  
  scroll.appendChild(leftAxle);
  scroll.appendChild(rightAxle);
  scroll.appendChild(messageEl);
  scroll.appendChild(buttonsContainer);
  dialog.appendChild(scroll);
  
  elements.overlay.appendChild(dialog);
}

export function setWeather(type: 'rain' | 'campfire' | 'none'): void {
  weatherType = type;
  particles = [];
}

export function clearWeather(): void {
  weatherType = 'none';
  particles = [];
}

export function shakeScreen(): void {
  if (isShaking || !elements) return;
  
  isShaking = true;
  elements.container.classList.add('shake');
  
  setTimeout(() => {
    elements!.container.classList.remove('shake');
    isShaking = false;
  }, 300);
}

export function getStartButton(): HTMLElement | null {
  return elements?.startBtn || null;
}

export function getHistoryButton(): HTMLElement | null {
  return elements?.historyBtn || null;
}

export function addResponsiveStyles(): void {
  const style = document.createElement('style');
  style.textContent = `
    @media (max-width: 768px) {
      .team-panel {
        width: 100% !important;
        flex-direction: row !important;
        overflow-x: auto !important;
        overflow-y: hidden !important;
        border-right: none !important;
        border-bottom: 3px solid #5D3A1A !important;
        padding: 8px !important;
        height: auto !important;
      }
      
      .escort-card {
        min-width: 160px !important;
        flex-shrink: 0 !important;
      }
      
      .log-panel {
        position: fixed !important;
        right: 0 !important;
        top: 0 !important;
        height: 100% !important;
        transform: translateX(100%) !important;
        transition: transform 0.3s ease-out !important;
        z-index: 50 !important;
      }
      
      .log-panel.open {
        transform: translateX(0) !important;
      }
      
      .log-toggle {
        display: block !important;
      }
      
      .battle-container > div:first-child {
        height: 280px !important;
      }
      
      .battle-container > div:first-child > div {
        transform: scale(0.7) !important;
      }
      
      #player-area {
        left: 20px !important;
      }
      
      #enemy-area {
        right: 20px !important;
      }
    }
  `;
  document.head.appendChild(style);
}

export function cleanup(): void {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }
  window.removeEventListener('resize', resizeCanvas);
  particles = [];
  particlePool = [];
  currentState = null;
  elements = null;
}
