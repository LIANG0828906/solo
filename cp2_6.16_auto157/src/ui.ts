export interface HUDState {
  collectedCrystals: number;
  totalCrystals: number;
  timeRemaining: number;
  isGameOver: boolean;
  hasUnlockedHiddenArea: boolean;
  elapsedTime: number;
  isVictory: boolean;
}

const BG_COLOR = '#0F0F1A';
const PANEL_COLOR = '#1E1E30';
const BORDER_COLOR = '#2A2A50';
const ACCENT_COLOR = '#4488ff';
const TEXT_COLOR = '#ccddff';
const GOLD_COLOR = '#ffcc33';

export function initHUD(canvas: HTMLCanvasElement): void {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = window.innerWidth * dpr;
  canvas.height = window.innerHeight * dpr;
  canvas.style.width = window.innerWidth + 'px';
  canvas.style.height = window.innerHeight + 'px';
}

export function resizeHUD(canvas: HTMLCanvasElement): void {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = window.innerWidth * dpr;
  canvas.height = window.innerHeight * dpr;
  canvas.style.width = window.innerWidth + 'px';
  canvas.style.height = window.innerHeight + 'px';
}

export function drawHUD(canvas: HTMLCanvasElement, state: HUDState): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const dpr = window.devicePixelRatio || 1;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  drawCrystalCount(ctx, state);
  drawTimer(ctx, state);
  drawEnergyBar(ctx, state);

  if (state.isGameOver) {
    drawSettlementPanel(ctx, state);
  }
}

function drawCrystalCount(ctx: CanvasRenderingContext2D, state: HUDState): void {
  const x = 20;
  const y = 20;
  const w = 180;
  const h = 44;

  ctx.save();
  ctx.filter = 'blur(12px)';
  ctx.fillStyle = PANEL_COLOR;
  ctx.fillRect(x, y, w, h);
  ctx.restore();

  ctx.strokeStyle = BORDER_COLOR;
  ctx.lineWidth = 1;
  ctx.strokeRect(x, y, w, h);

  ctx.fillStyle = PANEL_COLOR + 'cc';
  ctx.fillRect(x, y, w, h);

  ctx.font = '16px "Courier New", monospace';
  ctx.fillStyle = TEXT_COLOR;
  ctx.textBaseline = 'middle';
  ctx.fillText(`⚡ 晶体  ${state.collectedCrystals} / ${state.totalCrystals}`, x + 14, y + h / 2);
}

function drawTimer(ctx: CanvasRenderingContext2D, state: HUDState): void {
  const w = 130;
  const h = 44;
  const x = window.innerWidth - w - 20;
  const y = 20;

  ctx.save();
  ctx.filter = 'blur(12px)';
  ctx.fillStyle = PANEL_COLOR;
  ctx.fillRect(x, y, w, h);
  ctx.restore();

  ctx.strokeStyle = BORDER_COLOR;
  ctx.lineWidth = 1;
  ctx.strokeRect(x, y, w, h);

  ctx.fillStyle = PANEL_COLOR + 'cc';
  ctx.fillRect(x, y, w, h);

  const minutes = Math.floor(state.timeRemaining / 60);
  const seconds = Math.floor(state.timeRemaining % 60);
  const timeStr = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  ctx.font = '16px "Courier New", monospace';
  ctx.fillStyle = state.timeRemaining < 30 ? '#ff4466' : TEXT_COLOR;
  ctx.textBaseline = 'middle';
  ctx.fillText(`⏱ ${timeStr}`, x + 14, y + h / 2);
}

function drawEnergyBar(ctx: CanvasRenderingContext2D, state: HUDState): void {
  const barWidth = 200;
  const barHeight = 16;
  const segWidth = (barWidth - (state.totalCrystals - 1) * 4) / state.totalCrystals;
  const x = window.innerWidth - barWidth - 20;
  const y = window.innerHeight - barHeight - 24;

  const panelW = barWidth + 20;
  const panelH = barHeight + 30;
  const panelX = x - 10;
  const panelY = y - 18;

  ctx.save();
  ctx.filter = 'blur(12px)';
  ctx.fillStyle = PANEL_COLOR;
  ctx.fillRect(panelX, panelY, panelW, panelH);
  ctx.restore();

  ctx.strokeStyle = BORDER_COLOR;
  ctx.lineWidth = 1;
  ctx.strokeRect(panelX, panelY, panelW, panelH);

  ctx.fillStyle = PANEL_COLOR + 'cc';
  ctx.fillRect(panelX, panelY, panelW, panelH);

  ctx.font = '11px "Courier New", monospace';
  ctx.fillStyle = TEXT_COLOR;
  ctx.textBaseline = 'bottom';
  ctx.fillText('能量', panelX + 10, y - 3);

  const colors = ['#ff3355', '#3388ff', '#33ff88', '#aa44ff', '#ffcc33'];
  for (let i = 0; i < state.totalCrystals; i++) {
    const segX = x + i * (segWidth + 4);
    ctx.fillStyle = i < state.collectedCrystals ? colors[i] : '#333355';
    ctx.fillRect(segX, y, segWidth, barHeight);

    if (i < state.collectedCrystals) {
      ctx.save();
      ctx.shadowColor = colors[i];
      ctx.shadowBlur = 8;
      ctx.fillRect(segX, y, segWidth, barHeight);
      ctx.restore();
    }
  }
}

function drawSettlementPanel(ctx: CanvasRenderingContext2D, state: HUDState): void {
  const w = 360;
  const h = 280;
  const x = (window.innerWidth - w) / 2;
  const y = (window.innerHeight - h) / 2;

  ctx.save();
  ctx.filter = 'blur(12px)';
  ctx.fillStyle = '#000000aa';
  ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);
  ctx.restore();

  ctx.fillStyle = '#000000aa';
  ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);

  ctx.fillStyle = PANEL_COLOR + 'ee';
  ctx.fillRect(x, y, w, h);

  ctx.strokeStyle = ACCENT_COLOR;
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, w, h);

  ctx.font = 'bold 24px "Courier New", monospace';
  ctx.fillStyle = state.isVictory ? GOLD_COLOR : '#ff4466';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(state.isVictory ? '✦ 通关 ✦' : '⏱ 时间到', x + w / 2, y + 40);

  ctx.font = '15px "Courier New", monospace';
  ctx.fillStyle = TEXT_COLOR;
  ctx.textAlign = 'left';

  const minutes = Math.floor(state.elapsedTime / 60);
  const seconds = Math.floor(state.elapsedTime % 60);
  const timeStr = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  const lines = [
    `采集晶体: ${state.collectedCrystals} / ${state.totalCrystals}`,
    `用时: ${timeStr}`,
    `隐藏区域: ${state.hasUnlockedHiddenArea ? '已解锁 ✓' : '未解锁 ✗'}`,
  ];

  lines.forEach((line, i) => {
    ctx.fillText(line, x + 40, y + 90 + i * 32);
  });

  ctx.font = '13px "Courier New", monospace';
  ctx.fillStyle = ACCENT_COLOR;
  ctx.textAlign = 'center';
  ctx.fillText('点击任意处重新开始', x + w / 2, y + h - 30);

  ctx.textAlign = 'left';
}
