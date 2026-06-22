import { Puppet, PuppetData } from './puppet';
import { Light } from './light';
import { UI } from './ui';

const CANVAS_W = 1360;
const CANVAS_H = 840;

const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
canvas.width = CANVAS_W;
canvas.height = CANVAS_H;
const ctx = canvas.getContext('2d')!;

const ui = new UI(CANVAS_W, CANVAS_H);
const light = new Light(ui.screenX + ui.screenWidth / 2, ui.screenY - 60);

const puppetDatas: PuppetData[] = [
  {
    name: '孫悟空',
    index: 0,
    bodyColor: '#D4A017',
    outlineColor: '#8B6914',
    headDraw(ctx, x, y, scale) {
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(scale, scale);
      ctx.fillStyle = '#D4A017';
      ctx.beginPath();
      ctx.arc(0, 0, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#8B6914';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(-3, -2, 1.5, 0, Math.PI * 2);
      ctx.arc(3, -2, 1.5, 0, Math.PI * 2);
      ctx.fillStyle = '#1A1A1A';
      ctx.fill();

      ctx.beginPath();
      ctx.ellipse(0, 3, 4, 2, 0, 0, Math.PI);
      ctx.strokeStyle = '#8B6914';
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(-3, -10);
      ctx.lineTo(-5, -18);
      ctx.lineTo(0, -14);
      ctx.lineTo(5, -18);
      ctx.lineTo(3, -10);
      ctx.closePath();
      ctx.fillStyle = '#FFD54F';
      ctx.fill();
      ctx.strokeStyle = '#B8860B';
      ctx.lineWidth = 0.8;
      ctx.stroke();

      ctx.beginPath();
      ctx.ellipse(-9, 0, 5, 3, -0.3, 0, Math.PI * 2);
      ctx.fillStyle = '#D4A017';
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(9, 0, 5, 3, 0.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.restore();
    },
    accessoryDraw(ctx, x, y, scale, actionActive, actionTime) {
      if (!actionActive) return;
      if (actionTime > 3000) return;
      const t = actionTime / 3000;
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(scale, scale);

      if (actionActive) {
        const staffAngle = (actionTime / 300) * Math.PI * 2;
        ctx.save();
        ctx.translate(15, -20);
        ctx.rotate(staffAngle);
        ctx.strokeStyle = '#FFD54F';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(0, -30);
        ctx.lineTo(0, 30);
        ctx.stroke();
        ctx.fillStyle = '#FF5722';
        ctx.beginPath();
        ctx.arc(0, -30, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(0, 30, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        ctx.strokeStyle = 'rgba(255,213,79,0.4)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(15, -20, 30, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.restore();
    },
  },
  {
    name: '二郎神',
    index: 1,
    bodyColor: '#C0C0C0',
    outlineColor: '#707070',
    headDraw(ctx, x, y, scale) {
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(scale, scale);
      ctx.fillStyle = '#C0C0C0';
      ctx.beginPath();
      ctx.arc(0, 0, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#707070';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(-3, -2, 1.5, 0, Math.PI * 2);
      ctx.arc(3, -2, 1.5, 0, Math.PI * 2);
      ctx.arc(0, -5, 1.5, 0, Math.PI * 2);
      ctx.fillStyle = '#1A1A1A';
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(-6, -10);
      ctx.lineTo(0, -20);
      ctx.lineTo(6, -10);
      ctx.closePath();
      ctx.fillStyle = '#FFD54F';
      ctx.fill();
      ctx.strokeStyle = '#B8860B';
      ctx.lineWidth = 0.8;
      ctx.stroke();

      ctx.restore();
    },
    accessoryDraw() {},
  },
  {
    name: '持琵琶天王',
    index: 2,
    bodyColor: '#4A7C59',
    outlineColor: '#2E5339',
    headDraw(ctx, x, y, scale) {
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(scale, scale);
      ctx.fillStyle = '#4A7C59';
      ctx.beginPath();
      ctx.arc(0, 0, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#2E5339';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(-3, -2, 1.5, 0, Math.PI * 2);
      ctx.arc(3, -2, 1.5, 0, Math.PI * 2);
      ctx.fillStyle = '#1A1A1A';
      ctx.fill();

      ctx.beginPath();
      ctx.arc(0, -12, 7, Math.PI, 0);
      ctx.strokeStyle = '#FFD54F';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.restore();
    },
    accessoryDraw(ctx, x, y, scale) {
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(scale, scale);
      ctx.strokeStyle = '#8D6E63';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(20, -5, 5, 12, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(20, -17);
      ctx.lineTo(20, 7);
      ctx.stroke();
      ctx.strokeStyle = '#FFD54F';
      ctx.lineWidth = 0.5;
      for (let i = -3; i <= 3; i++) {
        ctx.beginPath();
        ctx.moveTo(18, -5 + i * 3);
        ctx.lineTo(22, -5 + i * 3);
        ctx.stroke();
      }
      ctx.restore();
    },
  },
  {
    name: '持伞天王',
    index: 3,
    bodyColor: '#1565C0',
    outlineColor: '#0D47A1',
    headDraw(ctx, x, y, scale) {
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(scale, scale);
      ctx.fillStyle = '#1565C0';
      ctx.beginPath();
      ctx.arc(0, 0, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#0D47A1';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(-3, -2, 1.5, 0, Math.PI * 2);
      ctx.arc(3, -2, 1.5, 0, Math.PI * 2);
      ctx.fillStyle = '#1A1A1A';
      ctx.fill();

      ctx.beginPath();
      ctx.arc(0, -12, 7, Math.PI, 0);
      ctx.strokeStyle = '#FFD54F';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.restore();
    },
    accessoryDraw(ctx, x, y, scale) {
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(scale, scale);
      ctx.strokeStyle = '#8D6E63';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(18, -25);
      ctx.lineTo(18, 10);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(18, -25, 12, Math.PI, 0);
      ctx.fillStyle = 'rgba(21,101,192,0.5)';
      ctx.fill();
      ctx.strokeStyle = '#1565C0';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(18, -25, 2, 0, Math.PI * 2);
      ctx.fillStyle = '#FFD54F';
      ctx.fill();
      ctx.restore();
    },
  },
  {
    name: '持蛇天王',
    index: 4,
    bodyColor: '#6A1B9A',
    outlineColor: '#4A148C',
    headDraw(ctx, x, y, scale) {
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(scale, scale);
      ctx.fillStyle = '#6A1B9A';
      ctx.beginPath();
      ctx.arc(0, 0, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#4A148C';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(-3, -2, 1.5, 0, Math.PI * 2);
      ctx.arc(3, -2, 1.5, 0, Math.PI * 2);
      ctx.fillStyle = '#1A1A1A';
      ctx.fill();

      ctx.beginPath();
      ctx.arc(0, -12, 7, Math.PI, 0);
      ctx.strokeStyle = '#FFD54F';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.restore();
    },
    accessoryDraw(ctx, x, y, scale) {
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(scale, scale);
      ctx.strokeStyle = '#4CAF50';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(20, -20);
      ctx.quadraticCurveTo(28, -10, 22, 0);
      ctx.quadraticCurveTo(16, 10, 24, 15);
      ctx.stroke();

      ctx.fillStyle = '#4CAF50';
      ctx.beginPath();
      ctx.moveTo(20, -20);
      ctx.lineTo(18, -24);
      ctx.lineTo(22, -23);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#FF0000';
      ctx.beginPath();
      ctx.arc(19, -22, 1, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    },
  },
  {
    name: '持劍天王',
    index: 5,
    bodyColor: '#B71C1C',
    outlineColor: '#7F0000',
    headDraw(ctx, x, y, scale) {
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(scale, scale);
      ctx.fillStyle = '#B71C1C';
      ctx.beginPath();
      ctx.arc(0, 0, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#7F0000';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(-3, -2, 1.5, 0, Math.PI * 2);
      ctx.arc(3, -2, 1.5, 0, Math.PI * 2);
      ctx.fillStyle = '#1A1A1A';
      ctx.fill();

      ctx.beginPath();
      ctx.arc(0, -12, 7, Math.PI, 0);
      ctx.strokeStyle = '#FFD54F';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.restore();
    },
    accessoryDraw(ctx, x, y, scale) {
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(scale, scale);
      ctx.strokeStyle = '#E0E0E0';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(20, -30);
      ctx.lineTo(20, 10);
      ctx.stroke();

      ctx.strokeStyle = '#FFD54F';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(15, -30);
      ctx.lineTo(25, -30);
      ctx.stroke();

      ctx.fillStyle = '#FFD54F';
      ctx.beginPath();
      ctx.moveTo(20, -33);
      ctx.lineTo(18, -30);
      ctx.lineTo(22, -30);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    },
  },
];

const puppets: Puppet[] = [];
const spacing = 160;
const startX = ui.screenX + ui.screenWidth / 2 - (puppetDatas.length * spacing) / 2 + spacing / 2;
const puppetY = ui.screenY + ui.screenHeight / 2 + 30;

for (let i = 0; i < puppetDatas.length; i++) {
  const p = new Puppet(puppetDatas[i], startX + i * spacing, puppetY);
  p.distanceFromScreen = 20 + i * 8;
  puppets.push(p);
}

let currentPuppetIndex = 0;
let dragActive = false;
let dragType: 'right' | 'left' | null = null;
let lightDragActive = false;
let lightDragStartX = 0;
let lightDragStartLightX = 0;
let mouseX = 0;
let mouseY = 0;

const actionNames = ['flip', 'staff', 'giant', 'cloud'];

function getCanvasPos(e: MouseEvent): { x: number; y: number } {
  const rect = canvas.getBoundingClientRect();
  return {
    x: (e.clientX - rect.left) * (canvas.width / rect.width),
    y: (e.clientY - rect.top) * (canvas.height / rect.height),
  };
}

canvas.addEventListener('mousedown', (e) => {
  const pos = getCanvasPos(e);
  mouseX = pos.x;
  mouseY = pos.y;

  const btnIdx = ui.getClickedActionButton(pos.x, pos.y);
  if (btnIdx >= 0) {
    const currentPuppet = puppets[currentPuppetIndex];
    currentPuppet.playAction(actionNames[btnIdx]);
    return;
  }

  const charIdx = ui.getClickedCharButton(pos.x, pos.y);
  if (charIdx >= 0) {
    switchPuppet(charIdx);
    return;
  }

  const currentPuppet = puppets[currentPuppetIndex];
  const handles = currentPuppet.getHandlePositions();
  const stickLen = 50 * currentPuppet.scale;

  const distR = Math.hypot(pos.x - handles.rightX, pos.y - (handles.rightY + stickLen));
  const distL = Math.hypot(pos.x - handles.leftX, pos.y - (handles.leftY + stickLen));

  if (distR < 20) {
    dragActive = true;
    dragType = 'right';
  } else if (distL < 20) {
    dragActive = true;
    dragType = 'left';
  }
});

canvas.addEventListener('mousemove', (e) => {
  const pos = getCanvasPos(e);
  mouseX = pos.x;
  mouseY = pos.y;

  if (dragActive && dragType) {
    const currentPuppet = puppets[currentPuppetIndex];
    currentPuppet.drag(dragType, pos.x, pos.y);
    return;
  }

  const btnIdx = ui.getClickedActionButton(pos.x, pos.y);
  ui.setHoveredButton(btnIdx);

  if (btnIdx >= 0) {
    canvas.style.cursor = 'pointer';
  } else {
    const currentPuppet = puppets[currentPuppetIndex];
    const handles = currentPuppet.getHandlePositions();
    const stickLen = 50 * currentPuppet.scale;
    const distR = Math.hypot(pos.x - handles.rightX, pos.y - (handles.rightY + stickLen));
    const distL = Math.hypot(pos.x - handles.leftX, pos.y - (handles.leftY + stickLen));
    if (distR < 20 || distL < 20) {
      canvas.style.cursor = 'grab';
    } else {
      canvas.style.cursor = 'default';
    }
  }
});

canvas.addEventListener('mouseup', () => {
  dragActive = false;
  dragType = null;
  canvas.style.cursor = 'default';
});

canvas.addEventListener('mouseleave', () => {
  dragActive = false;
  dragType = null;
});

canvas.addEventListener('wheel', (e) => {
  e.preventDefault();
}, { passive: false });

let middleDown = false;
canvas.addEventListener('mousedown', (e) => {
  if (e.button === 1) {
    e.preventDefault();
    middleDown = true;
    lightDragStartX = e.clientX;
    lightDragStartLightX = light.x - light.baseX;
  }
});

window.addEventListener('mouseup', (e) => {
  if (e.button === 1) {
    middleDown = false;
  }
});

window.addEventListener('mousemove', (e) => {
  if (middleDown) {
    const dx = e.clientX - lightDragStartX;
    light.setLightPosition(lightDragStartLightX + dx);
  }
});

canvas.addEventListener('contextmenu', (e) => e.preventDefault());

document.addEventListener('keydown', (e) => {
  const key = parseInt(e.key);
  if (key >= 1 && key <= 6) {
    switchPuppet(key - 1);
  }
});

function switchPuppet(index: number): void {
  if (index < 0 || index >= puppets.length) return;
  currentPuppetIndex = index;
  const puppet = puppets[currentPuppetIndex];
  ui.showPortrait(puppet.data.name);
}

let lastTime = 0;

function gameLoop(timestamp: number): void {
  const dt = lastTime === 0 ? 16 : Math.min(timestamp - lastTime, 50);
  lastTime = timestamp;

  ui.update(dt);

  for (const puppet of puppets) {
    puppet.updateAction(dt);
  }

  ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

  ui.drawBackground(ctx);
  ui.drawStage(ctx);

  ctx.save();
  ctx.beginPath();
  ctx.rect(ui.screenX, ui.screenY, ui.screenWidth, ui.screenHeight);
  ctx.clip();

  const backGlow = ctx.createRadialGradient(
    light.x, ui.screenY + ui.screenHeight / 2, 50,
    light.x, ui.screenY + ui.screenHeight / 2, 400
  );
  backGlow.addColorStop(0, 'rgba(255,213,79,0.15)');
  backGlow.addColorStop(0.5, 'rgba(255,152,0,0.06)');
  backGlow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = backGlow;
  ctx.fillRect(ui.screenX, ui.screenY, ui.screenWidth, ui.screenHeight);

  for (const puppet of puppets) {
    puppet.projectShadow(ctx, light);
  }

  for (const puppet of puppets) {
    puppet.draw(ctx, puppet.actionTime);
  }

  ctx.restore();

  light.draw(ctx);

  ui.drawPortrait(ctx, puppetDatas[currentPuppetIndex]);

  const currentPuppet = puppets[currentPuppetIndex];
  const handles = currentPuppet.getHandlePositions();

  ctx.save();
  ctx.font = '12px KaiTi, STKaiti, 楷体, serif';
  ctx.fillStyle = 'rgba(255,213,79,0.6)';
  ctx.textAlign = 'left';
  ctx.fillText(`当前角色: ${currentPuppet.data.name}  |  拖拽竹签操控  |  鼠标中键移动油灯  |  数字键1-6切换角色`, ui.screenX + 10, CANVAS_H - 10);
  ctx.restore();

  requestAnimationFrame(gameLoop);
}

switchPuppet(0);
requestAnimationFrame(gameLoop);
