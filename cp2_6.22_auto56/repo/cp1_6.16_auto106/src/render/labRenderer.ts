import type { MaterialType, Potion } from '../game/alchemy';
import { getMaterialColor, getMaterialName } from '../game/alchemy';

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  alpha: number;
  shape: 'circle' | 'star' | 'square';
}

export interface Bubble {
  x: number;
  y: number;
  vy: number;
  size: number;
  alpha: number;
}

export interface LabLayout {
  canvasW: number;
  canvasH: number;
  tableX: number;
  tableY: number;
  tableW: number;
  tableH: number;
  slotPositions: { x: number; y: number }[];
  shelfX: number;
  shelfY: number;
  shelfW: number;
  materialPositions: { x: number; y: number; type: MaterialType }[];
  cauldronX: number;
  cauldronY: number;
  cauldronR: number;
  potionShelfX: number;
  potionShelfY: number;
  statusX: number;
  statusY: number;
  summonAreaX: number;
  summonAreaY: number;
  summonAreaW: number;
  summonAreaH: number;
  brewBtnX: number;
  brewBtnY: number;
  brewBtnW: number;
  brewBtnH: number;
  bookX: number;
  bookY: number;
  bookW: number;
  bookH: number;
  circleX: number;
  circleY: number;
  circleR: number;
  plantPositions: { x: number; y: number }[];
  candlePositions: { x: number; y: number }[];
  interactBtns: { x: number; y: number; w: number; h: number; label: string; action: string }[];
}

const TIPS: string[] = [
  '相传龙血草生长于火山口，采摘时需佩戴隔热手套。',
  '月光石只在满月之夜才能采集，否则会失去光泽。',
  '魔菇的孢子具有致幻效果，炼金时需保持通风。',
  '黄金砂是沙漠精灵的遗物，每粒都蕴含远古力量。',
  '四元素融合时需保持精神集中，否则会产生爆炸。',
  '飞龙最喜欢在满月时被抚摸翅膀根部。',
  '独角兽的角能净化一切毒素，但只在心情好时才会发光。',
  '石像鬼白天化为石雕，夜晚才恢复活力。',
  '凤凰的羽毛是制作不灭火焰的核心材料。',
  '万物始源圣液据说是创世神的遗留配方。',
  '炼金术的最高境界是理解万物之间的联系。',
  '古老的炼金卷轴记载着三百余种配方，但大部分已失传。',
];

let tipIndex = 0;

export function computeLayout(w: number, h: number): LabLayout {
  const tableW = w * 0.35;
  const tableH = h * 0.45;
  const tableX = w * 0.03;
  const tableY = h * 0.25;
  const slotSize = 50;
  const slotGap = 15;
  const slotStartX = tableX + tableW / 2 - (4 * slotSize + 3 * slotGap) / 2;
  const slotStartY = tableY + 40;
  const slotPositions: { x: number; y: number }[] = [];
  for (let i = 0; i < 4; i++) {
    slotPositions.push({ x: slotStartX + i * (slotSize + slotGap), y: slotStartY });
  }
  const shelfW = w * 0.18;
  const shelfX = w - shelfW - w * 0.02;
  const shelfY = h * 0.08;
  const matSize = 60;
  const matGap = 20;
  const matStartY = shelfY + 30;
  const materialPositions: { x: number; y: number; type: MaterialType }[] = [
    { x: shelfX + shelfW / 2 - matSize / 2, y: matStartY, type: 'red' },
    { x: shelfX + shelfW / 2 - matSize / 2, y: matStartY + matSize + matGap, type: 'blue' },
    { x: shelfX + shelfW / 2 - matSize / 2, y: matStartY + 2 * (matSize + matGap), type: 'green' },
    { x: shelfX + shelfW / 2 - matSize / 2, y: matStartY + 3 * (matSize + matGap), type: 'yellow' },
  ];
  const cauldronR = 60;
  const cauldronX = w * 0.5;
  const cauldronY = h * 0.55;
  const potionShelfX = shelfX;
  const potionShelfY = h * 0.58;
  const statusX = w - 220 - w * 0.02;
  const statusY = h * 0.02;
  const summonAreaX = w * 0.35;
  const summonAreaY = h * 0.15;
  const summonAreaW = w * 0.3;
  const summonAreaH = h * 0.5;
  const brewBtnW = 120;
  const brewBtnH = 40;
  const brewBtnX = tableX + tableW / 2 - brewBtnW / 2;
  const brewBtnY = tableY + tableH - 50;
  const bookW = 60;
  const bookH = 45;
  const bookX = w * 0.42;
  const bookY = h * 0.04;
  const circleX = w * 0.55;
  const circleY = h * 0.88;
  const circleR = 50;
  const plantPositions = [
    { x: w * 0.12, y: h * 0.03 },
    { x: w * 0.28, y: h * 0.02 },
    { x: w * 0.65, y: h * 0.03 },
  ];
  const candlePositions = [
    { x: w * 0.08, y: h * 0.08 },
    { x: w * 0.22, y: h * 0.06 },
    { x: w * 0.7, y: h * 0.06 },
    { x: w * 0.85, y: h * 0.08 },
    { x: w * 0.5, y: h * 0.04 },
  ];
  const btnW = 90;
  const btnH = 30;
  const btnY2 = cauldronY + cauldronR + 70;
  const interactBtns = [
    { x: cauldronX - btnW * 1.6, y: btnY2, w: btnW, h: btnH, label: '抚摸', action: 'pet' },
    { x: cauldronX - btnW * 0.5, y: btnY2, w: btnW, h: btnH, label: '喂食', action: 'feed' },
    { x: cauldronX + btnW * 0.6, y: btnY2, w: btnW, h: btnH, label: '训练', action: 'train' },
  ];
  return {
    canvasW: w, canvasH: h,
    tableX, tableY, tableW, tableH, slotPositions,
    shelfX, shelfY, shelfW, materialPositions,
    cauldronX, cauldronY, cauldronR,
    potionShelfX, potionShelfY,
    statusX, statusY,
    summonAreaX, summonAreaY, summonAreaW, summonAreaH,
    brewBtnX, brewBtnY, brewBtnW, brewBtnH,
    bookX, bookY, bookW, bookH,
    circleX, circleY, circleR,
    plantPositions, candlePositions,
    interactBtns,
  };
}

function drawStoneTexture(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.fillStyle = '#1A0A2E';
  ctx.fillRect(0, 0, w, h);
  const rng = (seed: number) => {
    let s = seed;
    return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
  };
  const rand = rng(42);
  for (let i = 0; i < 600; i++) {
    const x = rand() * w;
    const y = rand() * h;
    const s = rand() * 3 + 1;
    const a = rand() * 0.08;
    ctx.fillStyle = `rgba(80,60,100,${a})`;
    ctx.fillRect(x, y, s, s);
  }
  for (let i = 0; i < 40; i++) {
    const x = rand() * w;
    const y = rand() * h;
    const rw = rand() * 80 + 30;
    const rh = rand() * 20 + 8;
    ctx.strokeStyle = `rgba(60,40,80,${rand() * 0.15 + 0.05})`;
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, rw, rh);
  }
}

function drawWoodTexture(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 8);
  ctx.clip();
  const grad = ctx.createLinearGradient(x, y, x, y + h);
  grad.addColorStop(0, '#5C3A1E');
  grad.addColorStop(0.3, '#4A2E16');
  grad.addColorStop(0.7, '#5C3A1E');
  grad.addColorStop(1, '#3D2410');
  ctx.fillStyle = grad;
  ctx.fill();
  const rng = (seed: number) => {
    let s = seed;
    return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
  };
  const rand = rng(123);
  for (let i = 0; i < 20; i++) {
    const ly = y + rand() * h;
    ctx.strokeStyle = `rgba(30,15,5,${rand() * 0.2 + 0.05})`;
    ctx.lineWidth = rand() * 2 + 0.5;
    ctx.beginPath();
    ctx.moveTo(x, ly);
    ctx.lineTo(x + w, ly + (rand() - 0.5) * 6);
    ctx.stroke();
  }
  ctx.restore();
}

function drawGothicButton(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, label: string, pulsePhase: number, enabled: boolean) {
  ctx.save();
  if (enabled) {
    const glowAlpha = 0.15 + Math.sin(pulsePhase) * 0.1;
    const glow = ctx.createRadialGradient(x + w / 2, y + h / 2, 0, x + w / 2, y + h / 2, Math.max(1, w * 0.8));
    glow.addColorStop(0, `rgba(197,155,39,${glowAlpha})`);
    glow.addColorStop(1, 'rgba(197,155,39,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(x - w * 0.2, y - h, w * 1.4, h * 3);
  }
  ctx.fillStyle = enabled ? '#2A0A3A' : '#1A0A1E';
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 4);
  ctx.fill();
  ctx.strokeStyle = enabled ? '#C59B27' : '#665520';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 4);
  ctx.stroke();
  const cornerLen = 6;
  ctx.strokeStyle = '#C59B27';
  ctx.lineWidth = 1.5;
  const corners = [
    [x, y], [x + w, y], [x + w, y + h], [x, y + h]
  ];
  const dirs = [
    [1, 1], [-1, 1], [-1, -1], [1, -1]
  ];
  for (let i = 0; i < 4; i++) {
    const [cx, cy] = corners[i];
    const [dx, dy] = dirs[i];
    ctx.beginPath();
    ctx.moveTo(cx, cy + dy * cornerLen);
    ctx.lineTo(cx, cy);
    ctx.lineTo(cx + dx * cornerLen, cy);
    ctx.stroke();
  }
  ctx.fillStyle = enabled ? '#E0D5C1' : '#7A6A5A';
  ctx.font = 'bold 14px serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, x + w / 2, y + h / 2 + 1);
  ctx.restore();
}

function drawMaterialIcon(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, type: MaterialType, alpha: number) {
  ctx.save();
  ctx.globalAlpha = alpha;
  const color = getMaterialColor(type);
  const cx = x + size / 2;
  const cy = y + size / 2;
  const r = size / 2 - 4;
  ctx.fillStyle = color;
  ctx.shadowColor = color;
  ctx.shadowBlur = 8;
  switch (type) {
    case 'red':
      for (let i = 0; i < 3; i++) {
        const angle = (i / 3) * Math.PI * 2 - Math.PI / 2;
        const lx = cx + Math.cos(angle) * r * 0.4;
        const ly = cy + Math.sin(angle) * r * 0.4;
        ctx.beginPath();
        ctx.ellipse(lx, ly, r * 0.5, r * 0.3, angle, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    case 'blue':
      ctx.beginPath();
      for (let i = 0; i <= 8; i++) {
        const angle = (i / 8) * Math.PI * 2;
        const px = cx + Math.cos(angle) * r * (i % 2 === 0 ? 1 : 0.6);
        const py = cy + Math.sin(angle) * r * (i % 2 === 0 ? 1 : 0.6);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.beginPath();
      ctx.arc(cx - r * 0.2, cy - r * 0.2, r * 0.15, 0, Math.PI * 2);
      ctx.fill();
      break;
    case 'green':
      ctx.beginPath();
      ctx.arc(cx, cy, r * 0.7, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(0,0,0,0.15)';
      for (let i = 0; i < 5; i++) {
        const sa = (i / 5) * Math.PI * 2;
        ctx.beginPath();
        ctx.arc(cx + Math.cos(sa) * r * 0.3, cy + Math.sin(sa) * r * 0.3, r * 0.12, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    case 'yellow':
      for (let i = 0; i < 12; i++) {
        const angle = (i / 12) * Math.PI * 2;
        const px = cx + Math.cos(angle) * r * 0.8;
        const py = cy + Math.sin(angle) * r * 0.8;
        ctx.beginPath();
        ctx.arc(px, py, r * 0.1, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = '#FFE066';
      ctx.beginPath();
      ctx.arc(cx, cy, r * 0.35, 0, Math.PI * 2);
      ctx.fill();
      break;
  }
  ctx.shadowBlur = 0;
  ctx.font = '11px serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#E0D5C1';
  ctx.fillText(getMaterialName(type), cx, y + size + 14);
  ctx.restore();
}

function drawCauldron(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, brewProgress: number, isBrewing: boolean, bubbles: Bubble[], potionColor?: string) {
  ctx.save();
  const bodyH = r * 1.3;
  ctx.fillStyle = '#2A2A2A';
  ctx.beginPath();
  ctx.moveTo(cx - r, cy);
  ctx.bezierCurveTo(cx - r, cy + bodyH, cx + r, cy + bodyH, cx + r, cy);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#444';
  ctx.lineWidth = 2;
  ctx.stroke();
  const rimH = 12;
  ctx.fillStyle = '#3A3A3A';
  ctx.beginPath();
  ctx.ellipse(cx, cy, r + 5, rimH, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#555';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.fillStyle = '#1A1A1A';
  ctx.beginPath();
  ctx.ellipse(cx, cy, r - 3, rimH - 3, 0, 0, Math.PI * 2);
  ctx.fill();
  if (isBrewing || brewProgress > 0) {
    const liquidY = cy - rimH * 0.3;
    if (brewProgress >= 1 && potionColor) {
      ctx.fillStyle = potionColor;
      ctx.beginPath();
      ctx.ellipse(cx, liquidY, r - 5, rimH - 5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.2)';
      ctx.beginPath();
      ctx.ellipse(cx - r * 0.2, liquidY - 2, r * 0.3, 4, 0, 0, Math.PI * 2);
      ctx.fill();
    } else if (isBrewing) {
      const failProgress = brewProgress > 0.8 ? 1 : 0;
      ctx.fillStyle = failProgress ? '#4A4A3A' : '#2A3A4A';
      ctx.beginPath();
      ctx.ellipse(cx, liquidY, r - 5, rimH - 5, 0, 0, Math.PI * 2);
      ctx.fill();
      const waveT = Date.now() / 300;
      ctx.strokeStyle = 'rgba(100,150,200,0.3)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let i = -r + 5; i < r - 5; i += 2) {
        const wy = liquidY + Math.sin(i * 0.1 + waveT) * 2;
        if (i === -r + 5) ctx.moveTo(cx + i, wy);
        else ctx.lineTo(cx + i, wy);
      }
      ctx.stroke();
      for (const b of bubbles) {
        ctx.fillStyle = `rgba(150,200,255,${b.alpha})`;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    const steamCount = isBrewing ? 5 : 2;
    for (let i = 0; i < steamCount; i++) {
      const sx = cx + Math.sin(Date.now() / 500 + i * 2) * r * 0.5;
      const sy = cy - rimH - 15 - i * 12;
      const sa = 0.1 + Math.sin(Date.now() / 800 + i) * 0.05;
      ctx.fillStyle = `rgba(200,200,220,${sa})`;
      ctx.beginPath();
      ctx.arc(sx, sy, 4 + i * 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.fillStyle = '#3A3A3A';
  ctx.fillRect(cx - r - 20, cy - 5, 20, 6);
  ctx.fillRect(cx + r, cy - 5, 20, 6);
  ctx.restore();
}

function drawCandle(ctx: CanvasRenderingContext2D, x: number, y: number, time: number) {
  ctx.save();
  const holderH = 20;
  const holderW = 12;
  ctx.fillStyle = '#6B3A2A';
  ctx.fillRect(x - holderW / 2, y, holderW, holderH);
  ctx.fillStyle = '#5A2E1E';
  ctx.fillRect(x - holderW / 2 - 2, y + holderH - 4, holderW + 4, 4);
  const candleH = 25;
  const candleW = 8;
  ctx.fillStyle = '#D4C5A0';
  ctx.fillRect(x - candleW / 2, y - candleH, candleW, candleH);
  ctx.fillStyle = '#333';
  ctx.fillRect(x - 1, y - candleH - 4, 2, 5);
  const flickerX = Math.sin(time * 0.005 + x) * 2;
  const flickerY = Math.cos(time * 0.007 + x * 0.5) * 1;
  const flameH = 12 + Math.sin(time * 0.01 + x) * 3;
  const flameW = 6 + Math.sin(time * 0.008 + x * 0.3) * 2;
  const fx = x + flickerX;
  const fy = y - candleH - 4;
  const grad = ctx.createRadialGradient(fx, fy - flameH / 2, 0, fx, fy - flameH / 2, Math.max(1, flameH));
  grad.addColorStop(0, 'rgba(255,200,50,0.9)');
  grad.addColorStop(0.4, 'rgba(255,150,30,0.6)');
  grad.addColorStop(1, 'rgba(255,100,0,0)');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.moveTo(fx - flameW / 2, fy);
  ctx.quadraticCurveTo(fx - flameW, fy - flameH * 0.5, fx + flickerX, fy - flameH + flickerY);
  ctx.quadraticCurveTo(fx + flameW, fy - flameH * 0.5, fx + flameW / 2, fy);
  ctx.closePath();
  ctx.fill();
  const glow = ctx.createRadialGradient(fx, fy - flameH / 2, 0, fx, fy - flameH / 2, Math.max(1, flameH * 3));
  glow.addColorStop(0, 'rgba(255,180,50,0.08)');
  glow.addColorStop(1, 'rgba(255,150,30,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(fx - flameH * 3, fy - flameH * 4, flameH * 6, flameH * 6);
  ctx.restore();
}

function drawPlant(ctx: CanvasRenderingContext2D, x: number, y: number, time: number) {
  ctx.save();
  ctx.fillStyle = '#5A3A2A';
  ctx.beginPath();
  ctx.roundRect(x - 15, y + 10, 30, 20, 3);
  ctx.fill();
  ctx.strokeStyle = '#3A7A3A';
  ctx.lineWidth = 2;
  const sway = Math.sin(time * 0.002 + x) * 3;
  ctx.beginPath();
  ctx.moveTo(x, y + 10);
  ctx.quadraticCurveTo(x + sway, y - 5, x + sway * 0.5, y - 15);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x, y + 10);
  ctx.quadraticCurveTo(x - sway * 0.7, y - 3, x - sway * 0.3, y - 12);
  ctx.stroke();
  ctx.fillStyle = '#4A8A4A';
  ctx.beginPath();
  ctx.ellipse(x + sway * 0.5, y - 18, 6, 4, sway * 0.02, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#5A9A5A';
  ctx.beginPath();
  ctx.ellipse(x - sway * 0.3, y - 15, 5, 3, -sway * 0.02, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawBook(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, isOpen: boolean) {
  ctx.save();
  ctx.fillStyle = '#5A2A1A';
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 2);
  ctx.fill();
  ctx.strokeStyle = '#C59B27';
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 3, y + 3, w - 6, h - 6);
  if (isOpen) {
    ctx.fillStyle = '#E8D8B8';
    ctx.fillRect(x + 5, y + 5, w - 10, h - 10);
    ctx.fillStyle = '#2A0A3A';
    ctx.font = '8px serif';
    ctx.textAlign = 'center';
    const lines = TIPS[tipIndex % TIPS.length].split('');
    const mid = Math.ceil(lines.length / 2);
    ctx.fillText(lines.slice(0, mid).join(''), x + w / 2, y + h / 2 - 2, w - 12);
    ctx.fillText(lines.slice(mid).join(''), x + w / 2, y + h / 2 + 8, w - 12);
  } else {
    ctx.fillStyle = '#8A6A3A';
    ctx.font = 'bold 10px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('炼金术', x + w / 2, y + h / 2);
  }
  ctx.restore();
}

function drawMagicCircle(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, time: number, successRate: number) {
  ctx.save();
  const brightness = 0.2 + successRate * 0.5 + Math.sin(time * 0.003) * 0.05;
  ctx.strokeStyle = `rgba(150,100,200,${brightness})`;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.7, 0, Math.PI * 2);
  ctx.stroke();
  const rot = time * 0.001;
  for (let i = 0; i < 6; i++) {
    const a = rot + (i / 6) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * r * 0.7, cy + Math.sin(a) * r * 0.7);
    ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
    ctx.stroke();
  }
  ctx.strokeStyle = `rgba(200,150,255,${brightness * 0.5})`;
  ctx.lineWidth = 1;
  const innerRot = -rot * 0.5;
  for (let i = 0; i < 3; i++) {
    const a = innerRot + (i / 3) * Math.PI * 2;
    const px1 = cx + Math.cos(a) * r * 0.5;
    const py1 = cy + Math.sin(a) * r * 0.5;
    const a2 = a + Math.PI * 2 / 3;
    const px2 = cx + Math.cos(a2) * r * 0.5;
    const py2 = cy + Math.sin(a2) * r * 0.5;
    ctx.beginPath();
    ctx.moveTo(px1, py1);
    ctx.lineTo(px2, py2);
    ctx.stroke();
  }
  ctx.restore();
}

function drawPotionShelf(ctx: CanvasRenderingContext2D, x: number, y: number, potions: Potion[]) {
  ctx.save();
  ctx.fillStyle = 'rgba(30,15,50,0.7)';
  ctx.beginPath();
  ctx.roundRect(x - 5, y - 5, 180, 200, 6);
  ctx.fill();
  ctx.strokeStyle = '#C59B27';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(x - 5, y - 5, 180, 200, 6);
  ctx.stroke();
  ctx.fillStyle = '#E0D5C1';
  ctx.font = 'bold 12px serif';
  ctx.textAlign = 'center';
  ctx.fillText('药剂架', x + 85, y + 10);
  for (let i = 0; i < potions.length && i < 6; i++) {
    const p = potions[i];
    const px = x + 10 + (i % 2) * 80;
    const py = y + 25 + Math.floor(i / 2) * 55;
    ctx.fillStyle = p.recipe.potionColor;
    ctx.shadowColor = p.recipe.potionColor;
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.roundRect(px, py, 20, 35, 3);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.fillRect(px + 4, py + 5, 3, 12);
    ctx.fillStyle = '#8A6A3A';
    ctx.fillRect(px + 2, py - 4, 16, 6);
    ctx.fillStyle = '#E0D5C1';
    ctx.font = '9px serif';
    ctx.textAlign = 'center';
    ctx.fillText(p.recipe.potionName.slice(0, 4), px + 10, py + 48);
  }
  ctx.restore();
}

export function drawLab(
  ctx: CanvasRenderingContext2D,
  layout: LabLayout,
  slots: (MaterialType | null)[],
  potions: Potion[],
  isBrewing: boolean,
  brewProgress: number,
  bubbles: Bubble[],
  particles: Particle[],
  brewResultPotionColor: string | undefined,
  showBook: boolean,
  time: number,
) {
  const { canvasW: w, canvasH: h } = layout;
  drawStoneTexture(ctx, w, h);
  for (const p of layout.plantPositions) {
    drawPlant(ctx, p.x, p.y, time);
  }
  for (const c of layout.candlePositions) {
    drawCandle(ctx, c.x, c.y, time);
  }
  drawWoodTexture(ctx, layout.tableX, layout.tableY, layout.tableW, layout.tableH);
  ctx.fillStyle = '#C59B27';
  ctx.font = 'bold 16px serif';
  ctx.textAlign = 'center';
  ctx.fillText('炼金合成台', layout.tableX + layout.tableW / 2, layout.tableY + 25);
  for (let i = 0; i < 4; i++) {
    const sp = layout.slotPositions[i];
    const mat = slots[i];
    ctx.save();
    if (mat) {
      ctx.strokeStyle = getMaterialColor(mat);
      ctx.lineWidth = 2;
      ctx.setLineDash([]);
    } else {
      ctx.strokeStyle = 'rgba(200,200,200,0.4)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
    }
    ctx.beginPath();
    ctx.roundRect(sp.x, sp.y, 50, 50, 4);
    ctx.stroke();
    ctx.setLineDash([]);
    if (mat) {
      drawMaterialIcon(ctx, sp.x + 5, sp.y + 5, 40, mat, 1);
    }
    ctx.restore();
  }
  const pulsePhase = (time / 1000) * Math.PI;
  drawGothicButton(
    ctx, layout.brewBtnX, layout.brewBtnY,
    layout.brewBtnW, layout.brewBtnH,
    isBrewing ? '炼金中...' : '合成',
    pulsePhase, !isBrewing && slots.some(s => s !== null)
  );
  drawCauldron(ctx, layout.cauldronX, layout.cauldronY, layout.cauldronR, brewProgress, isBrewing, bubbles, brewResultPotionColor);
  ctx.fillStyle = 'rgba(30,15,50,0.6)';
  ctx.beginPath();
  ctx.roundRect(layout.shelfX - 5, layout.shelfY - 5, layout.shelfW + 10, layout.materialPositions.length * 80 + 20, 6);
  ctx.fill();
  ctx.strokeStyle = '#C59B27';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(layout.shelfX - 5, layout.shelfY - 5, layout.shelfW + 10, layout.materialPositions.length * 80 + 20, 6);
  ctx.stroke();
  ctx.fillStyle = '#C59B27';
  ctx.font = 'bold 13px serif';
  ctx.textAlign = 'center';
  ctx.fillText('材料架', layout.shelfX + layout.shelfW / 2, layout.shelfY + 10);
  for (const mp of layout.materialPositions) {
    drawMaterialIcon(ctx, mp.x, mp.y, 60, mp.type, 1);
  }
  if (potions.length > 0) {
    drawPotionShelf(ctx, layout.potionShelfX, layout.potionShelfY, potions);
  }
  drawBook(ctx, layout.bookX, layout.bookY, layout.bookW, layout.bookH, showBook);
  const successRate = potions.length > 0 ? 0.7 : 0.3;
  drawMagicCircle(ctx, layout.circleX, layout.circleY, layout.circleR, time, successRate);
  for (const p of particles) {
    ctx.save();
    ctx.globalAlpha = p.alpha;
    ctx.fillStyle = p.color;
    if (p.shape === 'star') {
      drawStar(ctx, p.x, p.y, p.size);
    } else {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}

function drawStar(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) {
  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    const a1 = (i / 5) * Math.PI * 2 - Math.PI / 2;
    const a2 = a1 + Math.PI / 5;
    ctx.lineTo(x + Math.cos(a1) * r, y + Math.sin(a1) * r);
    ctx.lineTo(x + Math.cos(a2) * r * 0.4, y + Math.sin(a2) * r * 0.4);
  }
  ctx.closePath();
  ctx.fill();
}

export function spawnDropParticles(particles: Particle[], x: number, y: number, color: string): Particle[] {
  const newParticles: Particle[] = [];
  for (let i = 0; i < 15; i++) {
    newParticles.push({
      x: x + (Math.random() - 0.5) * 20,
      y: y,
      vx: (Math.random() - 0.5) * 2,
      vy: -Math.random() * 3 - 1,
      life: 600 + Math.random() * 400,
      maxLife: 1000,
      size: 3 + Math.random() * 5,
      color: i % 3 === 0 ? '#FFFFFF' : color,
      alpha: 1,
      shape: Math.random() > 0.5 ? 'star' : 'circle',
    });
  }
  return [...particles, ...newParticles].slice(-200);
}

export function updateParticles(particles: Particle[], dt: number): Particle[] {
  return particles
    .map(p => ({
      ...p,
      x: p.x + p.vx * dt * 0.06,
      y: p.y + p.vy * dt * 0.06,
      vy: p.vy - 0.02 * dt * 0.06,
      life: p.life - dt,
      alpha: Math.max(0, p.life / p.maxLife),
    }))
    .filter(p => p.life > 0);
}

export function updateBubbles(bubbles: Bubble[], cauldronX: number, cauldronY: number, cauldronR: number, isBrewing: boolean, dt: number): Bubble[] {
  if (!isBrewing) return [];
  let updated = bubbles
    .map(b => ({
      ...b,
      y: b.y - b.vy * dt * 0.05,
      alpha: b.alpha - 0.001 * dt,
    }))
    .filter(b => b.alpha > 0 && b.y > cauldronY - cauldronR);
  if (Math.random() < 0.05 * dt * 0.06) {
    updated.push({
      x: cauldronX + (Math.random() - 0.5) * cauldronR,
      y: cauldronY - 5,
      vy: 0.5 + Math.random() * 0.5,
      size: 5 + Math.random() * 10,
      alpha: 0.6,
    });
  }
  while (updated.length > 8) updated.shift();
  return updated;
}

export function cycleTip(): void {
  tipIndex++;
}

export function getTipIndex(): number {
  return tipIndex;
}
