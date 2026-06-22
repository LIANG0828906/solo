import { eventBus, state, getMultiplier } from './gameState';

interface HudButton {
  x: number;
  y: number;
  w: number;
  h: number;
  label: string;
  action: () => void;
  hovered: boolean;
}

let ctx: CanvasRenderingContext2D;
let cw = 0;
let ch = 0;
let mouseX = 0;
let mouseY = 0;
let buttons: HudButton[] = [];
let comboDisplay = 0;
let comboAnimTimer = 0;
let brightnessDisplay = 100;
let scoreDisplay = 0;
let shakeTimer = 0;
let shakeIntensity = 0;

function initHud(context: CanvasRenderingContext2D, width: number, height: number): void {
  ctx = context;
  cw = width;
  ch = height;
  buttons = [];

  eventBus.on('enemyHit', () => {
    shakeTimer = 0.3;
    shakeIntensity = 6;
  });
}

function resizeHud(width: number, height: number): void {
  cw = width;
  ch = height;
}

function drawRoundedRect(
  x: number, y: number, w: number, h: number, r: number,
  fill?: string, stroke?: string, lineWidth?: number
): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill();
  }
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = lineWidth || 1;
    ctx.stroke();
  }
}

function renderBrightnessBar(): void {
  const cx = 60;
  const cy = 60;
  const radius = 32;
  const lineW = 6;

  brightnessDisplay += (state.brightness - brightnessDisplay) * 0.15;

  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(255,255,255,0.15)';
  ctx.lineWidth = lineW;
  ctx.stroke();

  const angle = (brightnessDisplay / 100) * Math.PI * 2;
  const startAngle = -Math.PI / 2;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, startAngle, startAngle + angle);
  const barColor = brightnessDisplay > 50
    ? `rgba(110, 231, 183, 0.9)`
    : brightnessDisplay > 25
      ? `rgba(251, 191, 36, 0.9)`
      : `rgba(239, 68, 68, 0.9)`;
  ctx.strokeStyle = barColor;
  ctx.lineWidth = lineW;
  ctx.lineCap = 'round';
  ctx.stroke();
  ctx.lineCap = 'butt';

  ctx.font = 'bold 14px "Segoe UI", sans-serif';
  ctx.fillStyle = '#E2E8F0';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`${Math.round(brightnessDisplay)}`, cx, cy);
}

function renderScorePanel(): void {
  scoreDisplay += (state.score - scoreDisplay) * 0.2;

  const px = 20;
  const py = 110;
  const pw = 160;
  const ph = 90;

  drawRoundedRect(px, py, pw, ph, 12,
    'rgba(0,0,0,0.6)',
    'rgba(255,255,255,0.1)',
    1
  );

  ctx.font = '12px "Segoe UI", sans-serif';
  ctx.fillStyle = 'rgba(226,232,240,0.7)';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText('得分', px + 16, py + 12);

  ctx.font = 'bold 22px "Segoe UI", sans-serif';
  ctx.fillStyle = '#E2E8F0';
  ctx.fillText(`${Math.round(scoreDisplay)}`, px + 16, py + 28);

  ctx.font = '12px "Segoe UI", sans-serif';
  ctx.fillStyle = 'rgba(226,232,240,0.6)';
  ctx.fillText(`倍率 ×${getMultiplier().toFixed(1)}`, px + 16, py + 58);

  if (state.combo > 0) {
    comboAnimTimer = 0.5;
    comboDisplay = state.combo;
  }
  if (comboAnimTimer > 0) {
    const scale = 1 + Math.sin(comboAnimTimer / 0.5 * Math.PI) * 0.1;
    ctx.save();
    ctx.translate(px + pw - 20, py + 60);
    ctx.scale(scale, scale);
    ctx.font = 'bold 16px "Segoe UI", sans-serif';
    ctx.fillStyle = '#6EE7B7';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillText(`×${comboDisplay}`, 0, 0);
    ctx.restore();
  }
}

function renderTimePanel(): void {
  const px = cw - 180;
  const py = 20;
  const pw = 160;
  const ph = 50;

  drawRoundedRect(px, py, pw, ph, 12,
    'rgba(0,0,0,0.6)',
    'rgba(255,255,255,0.1)',
    1
  );

  const mins = Math.floor(state.survivalTime / 60);
  const secs = Math.floor(state.survivalTime % 60);
  ctx.font = '16px "Segoe UI", sans-serif';
  ctx.fillStyle = '#E2E8F0';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`, px + pw / 2, py + ph / 2);
}

function renderCountdown(): void {
  if (state.phase !== 'countdown') return;

  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.fillRect(0, 0, cw, ch);

  const text = state.countdownValue > 0 ? `${Math.ceil(state.countdownValue)}` : 'GO!';
  const scale = 1 + (state.countdownValue % 1) * 0.3;
  ctx.save();
  ctx.translate(cw / 2, ch / 2);
  ctx.scale(scale, scale);
  ctx.font = 'bold 72px "Segoe UI", sans-serif';
  ctx.fillStyle = '#FFFFFF';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = 'rgba(110, 231, 183, 0.6)';
  ctx.shadowBlur = 20;
  ctx.fillText(text, 0, 0);
  ctx.restore();
}

function renderTutorialHint(): void {
  if (state.phase !== 'tutorial') return;
  const alpha = 0.5 + 0.3 * Math.sin(performance.now() / 500);
  ctx.font = '18px "Segoe UI", sans-serif';
  ctx.fillStyle = `rgba(255, 215, 0, ${alpha})`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('🛡 无敌教学阶段 — 安全移动中', cw / 2, ch - 50);
}

function renderPauseOverlay(): void {
  if (state.phase !== 'paused') return;

  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.fillRect(0, 0, cw, ch);

  const panelW = 280;
  const panelH = 260;
  const panelX = (cw - panelW) / 2;
  const panelY = (ch - panelH) / 2;

  drawRoundedRect(panelX, panelY, panelW, panelH, 16,
    'rgba(15,15,40,0.9)',
    'rgba(255,255,255,0.1)',
    1
  );

  ctx.font = 'bold 24px "Segoe UI", sans-serif';
  ctx.fillStyle = '#E2E8F0';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('暂停', cw / 2, panelY + 40);

  const btnW = 200;
  const btnH = 48;
  const btnX = (cw - btnW) / 2;
  const labels = ['继续', '重新开始', '返回主菜单'];
  const actions = [
    () => { state.phase = 'playing'; },
    () => { eventBus.emit('restart'); },
    () => { eventBus.emit('restart'); },
  ];

  buttons = [];
  for (let i = 0; i < labels.length; i++) {
    const btnY = panelY + 80 + i * 58;
    const hovered = mouseX >= btnX && mouseX <= btnX + btnW && mouseY >= btnY && mouseY <= btnY + btnH;
    buttons.push({ x: btnX, y: btnY, w: btnW, h: btnH, label: labels[i], action: actions[i], hovered });

    if (hovered) {
      drawRoundedRect(btnX, btnY, btnW, btnH, 24,
        'linear-gradient(#6EE7B7, #10B981)',
      );
      const grad = ctx.createLinearGradient(btnX, btnY, btnX + btnW, btnY + btnH);
      grad.addColorStop(0, '#8BFFCF');
      grad.addColorStop(1, '#2DD48A');
      drawRoundedRect(btnX, btnY, btnW, btnH, 24, undefined, 'rgba(255,255,255,0.3)', 1);
      drawRoundedRect(btnX, btnY, btnW, btnH, 24, grad as unknown as string);
    } else {
      const grad = ctx.createLinearGradient(btnX, btnY, btnX + btnW, btnY + btnH);
      grad.addColorStop(0, '#6EE7B7');
      grad.addColorStop(1, '#10B981');
      drawRoundedRect(btnX, btnY, btnW, btnH, 24, grad as unknown as string);
    }

    ctx.font = '16px "Segoe UI", sans-serif';
    ctx.fillStyle = '#0B0C2A';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(labels[i], btnX + btnW / 2, btnY + btnH / 2);
  }
}

function renderEndPanel(): void {
  if (state.phase !== 'ended') return;

  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.fillRect(0, 0, cw, ch);

  const panelW = 360;
  const panelH = 380;
  const panelX = (cw - panelW) / 2;
  const panelY = (ch - panelH) / 2;

  ctx.save();
  ctx.filter = 'blur(10px)';
  drawRoundedRect(panelX, panelY, panelW, panelH, 24, 'rgba(0,0,0,0.7)');
  ctx.restore();
  drawRoundedRect(panelX, panelY, panelW, panelH, 24,
    'rgba(15,15,40,0.85)',
    'rgba(255,255,255,0.1)',
    1
  );

  ctx.font = 'bold 28px "Segoe UI", sans-serif';
  ctx.fillStyle = '#E2E8F0';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('游戏结束', cw / 2, panelY + 40);

  const items = [
    ['得分', `${state.score}`],
    ['收集碎片', `${state.fragmentsCollected}`],
    ['存活时间', `${Math.floor(state.survivalTime / 60)}:${Math.floor(state.survivalTime % 60).toString().padStart(2, '0')}`],
    ['最高连击', `${state.maxCombo}`],
  ];

  for (let i = 0; i < items.length; i++) {
    const iy = panelY + 90 + i * 50;
    ctx.font = '14px "Segoe UI", sans-serif';
    ctx.fillStyle = 'rgba(226,232,240,0.6)';
    ctx.textAlign = 'left';
    ctx.fillText(items[i][0], panelX + 40, iy);
    ctx.font = 'bold 20px "Segoe UI", sans-serif';
    ctx.fillStyle = '#E2E8F0';
    ctx.textAlign = 'right';
    ctx.fillText(items[i][1], panelX + panelW - 40, iy);
  }

  const btnW = 200;
  const btnH = 48;
  const btnX = (cw - btnW) / 2;
  const btnY = panelY + panelH - 72;

  buttons = [];
  const hovered = mouseX >= btnX && mouseX <= btnX + btnW && mouseY >= btnY && mouseY <= btnY + btnH;
  buttons.push({ x: btnX, y: btnY, w: btnW, h: btnH, label: '重新开始', action: () => eventBus.emit('restart'), hovered });

  const grad = ctx.createLinearGradient(btnX, btnY, btnX + btnW, btnY + btnH);
  if (hovered) {
    grad.addColorStop(0, '#8BFFCF');
    grad.addColorStop(1, '#2DD48A');
  } else {
    grad.addColorStop(0, '#6EE7B7');
    grad.addColorStop(1, '#10B981');
  }
  drawRoundedRect(btnX, btnY, btnW, btnH, 24, grad as unknown as string);
  ctx.font = '16px "Segoe UI", sans-serif';
  ctx.fillStyle = '#0B0C2A';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('重新开始', btnX + btnW / 2, btnY + btnH / 2);
}

function renderInvincibleTimer(): void {
  if (state.phase !== 'tutorial') return;
  const remaining = 10 - state.survivalTime;
  if (remaining <= 0) return;
  const px = cw / 2;
  const py = 40;
  ctx.font = '14px "Segoe UI", sans-serif';
  ctx.fillStyle = 'rgba(255, 215, 0, 0.7)';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`无敌时间 ${Math.ceil(remaining)}s`, px, py);
}

function updateHud(dt: number): void {
  if (comboAnimTimer > 0) comboAnimTimer -= dt;
  if (shakeTimer > 0) shakeTimer -= dt;
}

function renderHud(): void {
  ctx.save();
  if (shakeTimer > 0) {
    const ox = (Math.random() - 0.5) * shakeIntensity;
    const oy = (Math.random() - 0.5) * shakeIntensity;
    ctx.translate(ox, oy);
  }

  renderBrightnessBar();
  renderScorePanel();
  renderTimePanel();
  renderInvincibleTimer();
  renderTutorialHint();
  renderCountdown();
  renderPauseOverlay();
  renderEndPanel();

  ctx.restore();
}

function handleHudClick(x: number, y: number): boolean {
  for (const btn of buttons) {
    if (x >= btn.x && x <= btn.x + btn.w && y >= btn.y && y <= btn.y + btn.h) {
      btn.action();
      return true;
    }
  }
  return false;
}

function handleHudMouseMove(x: number, y: number): void {
  mouseX = x;
  mouseY = y;
}

export {
  initHud,
  updateHud,
  renderHud,
  handleHudClick,
  handleHudMouseMove,
  resizeHud,
};
