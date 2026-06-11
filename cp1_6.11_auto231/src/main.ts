import {
  Peddler, Customer, GOODS_LIST, Goods, CustomerData, CustomerEntity, DustParticle
} from './character';

declare global {
  interface Window {
    handleTradeAction: (action: string) => void;
    closeTradePanel: () => void;
    restartGame: () => void;
    movePeddler: (dir: string) => void;
  }
}

const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;

const statusBar = {
  money: document.getElementById('money-display')!,
  reputationFill: document.getElementById('reputation-fill')!,
  reputationValue: document.getElementById('reputation-value')!,
  staminaValue: document.getElementById('stamina-value')!,
  roundCount: document.getElementById('round-count')!
};

const tradePanel = document.getElementById('trade-panel') as HTMLDivElement;
const tradeResult = document.getElementById('trade-result') as HTMLDivElement;
const settlementPanel = document.getElementById('settlement-panel') as HTMLDivElement;

let game: {
  peddler: Peddler;
  customers: Customer[];
  particles: DustParticle[];
  lastTime: number;
  spawnTimer: number;
  running: boolean;
  selectedGoods: Goods | null;
  activeCustomer: Customer | null;
  hueRotate: number;
  gameOver: boolean;
} = {
  peddler: new Peddler(),
  customers: [],
  particles: [],
  lastTime: 0,
  spawnTimer: 0,
  running: true,
  selectedGoods: null,
  activeCustomer: null,
  hueRotate: 0,
  gameOver: false
};

let LOGICAL_WIDTH = 1200;
let LOGICAL_HEIGHT = 800;
let scale = 1;
let offsetX = 0;
let offsetY = 0;

const SHOP_NAMES = [
  { name: '布庄', icon: '🧵' },
  { name: '茶楼', icon: '🍵' },
  { name: '当铺', icon: '💱' },
  { name: '书坊', icon: '📜' },
  { name: '药铺', icon: '🌿' },
  { name: '酒肆', icon: '🍶' },
  { name: '客栈', icon: '🏨' },
  { name: '胭脂铺', icon: '💄' }
];

const STALL_ICONS = ['🥟', '🍜', '🥮', '🍡', '🍵', '🥧', '🍯'];

function resizeCanvas(): void {
  const container = document.getElementById('game-container')!;
  const cw = container.clientWidth;
  const ch = container.clientHeight;

  canvas.width = cw;
  canvas.height = ch;

  if (cw < 1200) {
    LOGICAL_WIDTH = Math.max(800, cw);
  } else {
    LOGICAL_WIDTH = 1200;
  }

  scale = Math.min(cw / LOGICAL_WIDTH, ch / LOGICAL_HEIGHT);
  offsetX = (cw - LOGICAL_WIDTH * scale) / 2;
  offsetY = (ch - LOGICAL_HEIGHT * scale) / 2;
}

function initGame(): void {
  game = {
    peddler: new Peddler(),
    customers: [],
    particles: [],
    lastTime: performance.now(),
    spawnTimer: 2,
    running: true,
    selectedGoods: null,
    activeCustomer: null,
    hueRotate: 0,
    gameOver: false
  };
  resizeCanvas();
  game.peddler.setY(LOGICAL_HEIGHT * 0.7);
  game.peddler.state.x = LOGICAL_WIDTH * 0.5;
  game.peddler.state.targetX = game.peddler.state.x;
  initGoodsGrid();
  updateStatusBar();
  settlementPanel.classList.remove('active');
}

function initGoodsGrid(): void {
  const grid = document.getElementById('goods-grid')!;
  grid.innerHTML = '';
  GOODS_LIST.forEach((goods) => {
    const item = document.createElement('div');
    item.className = 'goods-item';
    item.innerHTML = `
      <div class="goods-icon">${goods.icon}</div>
      <div class="goods-name">${goods.name}</div>
      <div class="goods-price">${goods.basePrice}文</div>
    `;
    item.onclick = () => selectGoods(goods, item);
    grid.appendChild(item);
  });
}

function selectGoods(goods: Goods, element: HTMLDivElement): void {
  document.querySelectorAll('.goods-item').forEach(el => el.classList.remove('selected'));
  element.classList.add('selected');
  game.selectedGoods = goods;
  tradeResult.className = 'trade-result';
  tradeResult.textContent = '';
}

const API_BASE = 'http://localhost:3001';

async function spawnCustomer(): Promise<void> {
  try {
    const response = await fetch(`${API_BASE}/api/customer`);
    const data: CustomerData = await response.json();
    const streetY = LOGICAL_HEIGHT * 0.65 + (Math.random() - 0.5) * 50;
    const customer = new Customer(data, LOGICAL_WIDTH, streetY);
    game.customers.push(customer);
  } catch (e) {
    console.error('Failed to spawn customer:', e);
  }
}

function updateStatusBar(): void {
  statusBar.money.textContent = game.peddler.money.toString();
  statusBar.reputationFill.style.width = game.peddler.reputation + '%';
  statusBar.reputationValue.textContent = game.peddler.reputation.toString();
  statusBar.staminaValue.textContent = game.peddler.stamina.toString();
  statusBar.roundCount.textContent = game.peddler.rounds.toString();
}

function pulseElement(element: HTMLElement): void {
  element.classList.remove('pulse-animation');
  void element.offsetWidth;
  element.classList.add('pulse-animation');
}

async function performTrade(action: string): Promise<void> {
  if (!game.selectedGoods || !game.activeCustomer) {
    tradeResult.className = 'trade-result fail';
    tradeResult.textContent = '请先选择货物！';
    return;
  }

  const customer = game.activeCustomer;
  const goods = game.selectedGoods;
  const custData = customer.entity;

  let baseSuccessRate = 0.5;

  if (action === 'raise') {
    baseSuccessRate -= 0.25;
  } else if (action === 'gift') {
    baseSuccessRate += 0.15;
  }

  if (custData.type === 'generous' && action === 'raise') {
    baseSuccessRate += 0.15;
  }
  if (custData.type === 'stingy') {
    if (action === 'gift') {
      baseSuccessRate += 0.2;
    }
    if (action === 'raise') {
      baseSuccessRate -= 0.1;
    }
  }
  if (custData.type === 'child' && custData.bonusItems.includes(goods.name)) {
    baseSuccessRate += custData.successBonus;
  }

  baseSuccessRate += (game.peddler.reputation - 50) / 200;

  const success = Math.random() < Math.max(0.1, Math.min(0.95, baseSuccessRate));

  try {
    const response = await fetch(`${API_BASE}/api/trade`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success,
        action,
        basePrice: goods.basePrice,
        customerType: custData.type
      })
    });

    const result = await response.json();

    if (success) {
      game.peddler.addMoney(result.moneyChange);
      game.peddler.addReputation(result.reputationChange);
      game.peddler.recordTrade(true);
      tradeResult.className = 'trade-result success';
      tradeResult.textContent = `交易成功！+${result.moneyChange}文 声望+${result.reputationChange}`;
      pulseElement(statusBar.money);
      pulseElement(statusBar.reputationValue);
    } else {
      game.peddler.addReputation(result.reputationChange);
      game.peddler.addStamina(result.staminaCost);
      game.peddler.recordTrade(false);
      tradeResult.className = 'trade-result fail';
      tradeResult.textContent = `交易失败！体力-10 声望${result.reputationChange}`;
      pulseElement(statusBar.staminaValue);
      pulseElement(statusBar.reputationValue);
    }

    game.peddler.incrementRound();
    customer.markInteracted();

    const expectedRoundsForHue = Math.floor(game.peddler.rounds / 5);
    game.hueRotate = expectedRoundsForHue * 30;

    updateStatusBar();

    if (game.peddler.isGameOver()) {
      setTimeout(showSettlement, 1500);
    }
  } catch (e) {
    console.error('Trade failed:', e);
  }
}

window.handleTradeAction = (action: string) => performTrade(action);

window.closeTradePanel = () => {
  tradePanel.classList.remove('active');
  document.querySelectorAll('.goods-item').forEach(el => el.classList.remove('selected'));
  game.selectedGoods = null;
  game.activeCustomer = null;
  tradeResult.className = 'trade-result';
  tradeResult.textContent = '';
};

window.movePeddler = (dir: string) => {
  if (game.gameOver) return;
  const step = LOGICAL_WIDTH * 0.15;
  let target = game.peddler.state.x + (dir === 'left' ? -step : step);
  target = Math.max(80, Math.min(LOGICAL_WIDTH - 80, target));
  game.peddler.moveTo(target);
};

function showCustomerDialog(customer: Customer): void {
  game.activeCustomer = customer;
  game.selectedGoods = null;
  tradeResult.className = 'trade-result';
  tradeResult.textContent = '';
  document.querySelectorAll('.goods-item').forEach(el => el.classList.remove('selected'));

  document.getElementById('customer-icon')!.textContent = customer.entity.icon;
  document.getElementById('customer-name')!.textContent = customer.entity.name;
  document.getElementById('customer-dialog')!.textContent = customer.entity.dialog;

  tradePanel.classList.add('active');
}

function showSettlement(): void {
  game.gameOver = true;
  tradePanel.classList.remove('active');

  const totalTrades = game.peddler.successfulTrades + game.peddler.failedTrades;
  const successRate = totalTrades > 0
    ? Math.round(game.peddler.successfulTrades / totalTrades * 100)
    : 0;

  document.getElementById('settlement-rounds')!.textContent = game.peddler.rounds.toString();
  document.getElementById('settlement-success')!.textContent = game.peddler.successfulTrades.toString();
  document.getElementById('settlement-fail')!.textContent = game.peddler.failedTrades.toString();
  document.getElementById('settlement-money')!.textContent = game.peddler.money + ' 文';
  document.getElementById('settlement-reputation')!.textContent = game.peddler.reputation.toString();

  let evalText = '';
  if (game.peddler.money >= game.peddler.targetRevenue) {
    if (successRate >= 80) {
      evalText = '今日大获丰收！阁下经商有道，日进斗金，百姓交口称赞，真乃当世陶朱再世！市井之间，商道亨通！';
    } else if (successRate >= 60) {
      evalText = '顺利达成目标！虽然偶有波折，但总体经营不错，明日继续努力！';
    } else {
      evalText = '虽达成营收目标，但屡经坎坷，当思改进经营之道！';
    }
  } else if (game.peddler.stamina <= 0) {
    evalText = '体力耗尽！今日只得早早收摊。经商不易，切记量力而行，明日再战江湖！';
  } else {
    if (successRate >= 70) {
      evalText = '今日虽未达营收目标，但口碑不错，名声在外，来日方长！';
    } else {
      evalText = '今日诸事不顺，当闭门思过，改日重整旗鼓！';
    }
  }

  document.getElementById('evaluation-text')!.textContent = evalText;
  settlementPanel.classList.add('active');
}

window.restartGame = () => {
  initGame();
};

function drawBackground(time: number): void {
  const t = game.peddler.getTimeOfDay();
  ctx.save();
  ctx.translate(offsetX, offsetY);
  ctx.scale(scale, scale);

  const skyGradient = ctx.createLinearGradient(0, 0, 0, LOGICAL_HEIGHT * 0.5);
  const r1 = Math.floor(173 + t * 80);
  const g1 = Math.floor(216 - t * 60);
  const b1 = Math.floor(230 - t * 100);
  const r2 = Math.floor(255 - t * 50);
  const g2 = Math.floor(248 - t * 30);
  const b2 = Math.floor(220 - t * 80);
  skyGradient.addColorStop(0, `rgb(${r1},${g1},${b1})`);
  skyGradient.addColorStop(1, `rgb(${r2},${g2},${b2})`);
  ctx.fillStyle = skyGradient;
  ctx.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT * 0.5);

  drawDistantBuildings();
  drawShops();
  drawStalls();
  drawStreet();

  ctx.restore();
}

function drawDistantBuildings(): void {
  ctx.save();
  ctx.filter = 'blur(3px)';

  const buildingColors = [
    { x: 0, w: 180, h: 180, color: '#8B7355' },
    { x: 160, w: 140, h: 220, color: '#A08060' },
    { x: 280, w: 200, h: 160, color: '#7B6B5B' },
    { x: 460, w: 160, h: 200, color: '#8B7B6B' },
    { x: 600, w: 180, h: 170, color: '#9B8B7B' },
    { x: 760, w: 140, h: 210, color: '#8B7B6B' },
    { x: 880, w: 200, h: 190, color: '#7B6B5B' },
    { x: 1060, w: 160, h: 175, color: '#A08060' }
  ];

  buildingColors.forEach(b => {
    ctx.fillStyle = b.color;
    ctx.fillRect(b.x, LOGICAL_HEIGHT * 0.25 - b.h * 0.3, b.w, b.h * 0.4);
    ctx.fillStyle = '#5C4033';
    ctx.beginPath();
    ctx.moveTo(b.x - 10, LOGICAL_HEIGHT * 0.25 - b.h * 0.3);
    ctx.lineTo(b.x + b.w / 2, LOGICAL_HEIGHT * 0.25 - b.h * 0.5);
    ctx.lineTo(b.x + b.w + 10, LOGICAL_HEIGHT * 0.25 - b.h * 0.3);
    ctx.closePath();
    ctx.fill();
  });

  ctx.restore();
}

function drawShops(): void {
  const shopRowY = LOGICAL_HEIGHT * 0.35;
  const shopWidth = 100;
  const shopHeight = 140;
  const startX = 20;
  const gap = 15;

  ctx.save();
  ctx.filter = `hue-rotate(${game.hueRotate}deg)`;

  SHOP_NAMES.forEach((shop, i) => {
    const x = startX + i * (shopWidth + gap);
    const y = shopRowY - shopHeight;

    ctx.fillStyle = '#D2B48C';
    ctx.fillRect(x, y + 40, shopWidth, shopHeight - 40);

    ctx.fillStyle = '#8B5E3C';
    ctx.fillRect(x, y + 40, shopWidth, 15);
    ctx.fillRect(x, y + shopHeight - 20, shopWidth, 20);

    ctx.fillStyle = '#FFF8DC';
    ctx.fillRect(x + 15, y + 70, 25, 30);
    ctx.fillRect(x + shopWidth - 40, y + 70, 25, 30);

    ctx.fillStyle = '#8B5E3C';
    ctx.fillRect(x + shopWidth / 2 - 15, y + shopHeight - 60, 30, 40);
    ctx.strokeStyle = '#6B4E2C';
    ctx.lineWidth = 2;
    ctx.strokeRect(x + shopWidth / 2 - 15, y + shopHeight - 60, 30, 40);

    ctx.fillStyle = '#5C4033';
    ctx.beginPath();
    ctx.moveTo(x - 8, y + 40);
    ctx.lineTo(x + shopWidth / 2, y - 5);
    ctx.lineTo(x + shopWidth + 8, y + 40);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#8B5E3C';
    ctx.fillRect(x + shopWidth / 2 - 38, y - 20, 76, 36);
    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 18px "Noto Serif SC", SimSun, serif';
    ctx.textAlign = 'center';
    ctx.fillText(shop.name, x + shopWidth / 2, y + 5);
    ctx.font = '14px sans-serif';
    ctx.fillText(shop.icon, x + shopWidth / 2 - 7, y - 2);
  });

  ctx.restore();
}

function drawStalls(): void {
  const stallY = LOGICAL_HEIGHT * 0.38;
  const stallWidth = 90;
  const startX = LOGICAL_WIDTH - 80;
  const gap = 12;

  ctx.save();
  ctx.filter = `hue-rotate(${game.hueRotate}deg)`;

  for (let i = 0; i < 7; i++) {
    const x = startX - i * (stallWidth + gap);
    const y = stallY;

    ctx.fillStyle = '#8B5E3C';
    ctx.fillRect(x, y, stallWidth, 8);

    ctx.strokeStyle = '#4A6FA5';
    ctx.lineWidth = 2;
    ctx.strokeRect(x + 5, y - 50, stallWidth - 10, 3);

    ctx.fillStyle = '#4A6FA5';
    ctx.beginPath();
    ctx.moveTo(x - 5, y - 50);
    ctx.lineTo(x + stallWidth / 2, y - 90);
    ctx.lineTo(x + stallWidth + 5, y - 50);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#D2B48C';
    ctx.beginPath();
    ctx.arc(x + stallWidth / 2, y - 30, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.font = '20px sans-serif';
    ctx.fillStyle = '#000';
    ctx.fillText(STALL_ICONS[i], x + stallWidth / 2 - 10, y - 24);

    ctx.fillStyle = '#6B4E2C';
    ctx.fillRect(x + 10, y + 8, 3, 60);
    ctx.fillRect(x + stallWidth - 13, y + 8, 3, 60);
  }

  ctx.restore();
}

function drawStreet(): void {
  const streetTop = LOGICAL_HEIGHT * 0.48;
  const streetBottom = LOGICAL_HEIGHT;

  ctx.fillStyle = '#696969';
  ctx.fillRect(0, streetTop, LOGICAL_WIDTH, streetBottom - streetTop);

  ctx.strokeStyle = '#5A5A5A';
  ctx.lineWidth = 1;
  const tileW = 60;
  const tileH = 40;
  for (let row = 0; row < Math.ceil((streetBottom - streetTop) / tileH) + 1; row++) {
    for (let col = 0; col < Math.ceil(LOGICAL_WIDTH / tileW) + 1; col++) {
      const tileOffsetX = (row % 2) * (tileW / 2);
      ctx.strokeRect(col * tileW + tileOffsetX, streetTop + row * tileH, tileW, tileH);
    }
  }

  ctx.fillStyle = '#8B7355';
  ctx.fillRect(0, streetTop, LOGICAL_WIDTH, 6);
  ctx.fillRect(0, streetTop + 6, LOGICAL_WIDTH, 2);
}

function drawPeddler(): void {
  const s = game.peddler.state;
  const bobOffset = s.walking ? Math.sin(s.walkFrame) * 3 : 0;
  const x = s.x;
  const y = s.y + bobOffset;
  const dir = s.direction === 'right' ? 1 : -1;

  ctx.save();
  ctx.translate(x, y);
  ctx.scale(dir, 1);

  const legSwing = s.walking ? Math.sin(s.walkFrame * 2) * 15 : 0;
  ctx.strokeStyle = '#2F2F2F';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(-5, 70);
  ctx.lineTo(-5 - legSwing, 100);
  ctx.moveTo(5, 70);
  ctx.lineTo(5 + legSwing, 100);
  ctx.stroke();

  ctx.strokeStyle = '#5C4033';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, 20);
  ctx.lineTo(0, 70);
  ctx.stroke();

  ctx.fillStyle = '#1E90FF';
  ctx.fillRect(-14, 25, 28, 48);
  ctx.fillStyle = '#00CED1';
  ctx.fillRect(-14, 25, 28, 8);

  ctx.strokeStyle = '#F4A460';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-14, 35);
  ctx.quadraticCurveTo(-28, 45, -22, 65);
  ctx.moveTo(14, 35);
  ctx.quadraticCurveTo(28, 45, 22, 65);
  ctx.stroke();

  ctx.fillStyle = '#FFDAB9';
  ctx.beginPath();
  ctx.arc(0, 8, 14, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#2F2F2F';
  ctx.beginPath();
  ctx.arc(0, 0, 15, Math.PI, 0);
  ctx.fill();
  ctx.fillRect(-15, 0, 30, 4);

  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.arc(4, 8, 1.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#8B4513';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(4, 13, 3, 0.1, Math.PI - 0.1);
  ctx.stroke();

  ctx.strokeStyle = '#8B4513';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-25, 30);
  ctx.lineTo(0, 10);
  ctx.lineTo(25, 30);
  ctx.stroke();

  ctx.fillStyle = '#C19A6B';
  ctx.beginPath();
  ctx.ellipse(-25, 35, 15, 20, 0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#8B4513';
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.fillStyle = '#C19A6B';
  ctx.beginPath();
  ctx.ellipse(25, 35, 15, 20, -0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#8B4513';
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.strokeStyle = '#A0522D';
  ctx.lineWidth = 2;
  ctx.strokeRect(-38, 28, 8, 4);
  ctx.strokeRect(30, 28, 8, 4);

  ctx.restore();
}

function drawCustomer(customer: CustomerEntity): void {
  const s = customer;
  const bobOffset = s.walking ? Math.sin(s.walkFrame) * 2 : 0;
  const x = s.x;
  const y = s.y + bobOffset;
  const dir = s.direction === 'right' ? 1 : -1;

  ctx.save();
  ctx.translate(x, y);
  ctx.scale(dir, 1);

  const type = s.type;
  const colors = s.color;

  const height = type === 'child' ? 0.75 : 1;
  ctx.scale(1, height);
  const yOffset = type === 'child' ? 25 : 0;
  ctx.translate(0, yOffset);

  const legSwing = s.walking ? Math.sin(s.walkFrame * 2) * 12 : 0;
  ctx.strokeStyle = '#2F2F2F';
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.moveTo(-4, 60);
  ctx.lineTo(-4 - legSwing, 85);
  ctx.moveTo(4, 60);
  ctx.lineTo(4 + legSwing, 85);
  ctx.stroke();

  ctx.strokeStyle = '#5C4033';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(0, 18);
  ctx.lineTo(0, 60);
  ctx.stroke();

  ctx.fillStyle = colors.robe;
  ctx.beginPath();
  ctx.moveTo(-12, 22);
  ctx.lineTo(-18, 80);
  ctx.lineTo(18, 80);
  ctx.lineTo(12, 22);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = colors.sash;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(-16, 50);
  ctx.lineTo(16, 50);
  ctx.stroke();

  ctx.strokeStyle = colors.robe;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-12, 30);
  ctx.quadraticCurveTo(-22, 40, -18, 55);
  ctx.moveTo(12, 30);
  ctx.quadraticCurveTo(22, 40, 18, 55);
  ctx.stroke();

  ctx.fillStyle = '#FFDAB9';
  ctx.beginPath();
  ctx.arc(0, 6, 12, 0, Math.PI * 2);
  ctx.fill();

  if (type === 'child') {
    ctx.fillStyle = '#2F2F2F';
    ctx.beginPath();
    ctx.arc(0, 0, 12, Math.PI, 0);
    ctx.fill();
    ctx.fillRect(-12, 0, 24, 3);
    ctx.fillStyle = '#FF69B4';
    ctx.beginPath();
    ctx.arc(10, -5, 4, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.fillStyle = '#1a1a1a';
    ctx.beginPath();
    ctx.arc(0, -1, 13, Math.PI, 0);
    ctx.fill();
    if (type === 'stingy') {
      ctx.fillStyle = '#555';
      ctx.fillRect(-14, 4, 28, 5);
    }
  }

  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.arc(3, 6, 1.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();

  if (s.dialogVisible && !s.interacted) {
    drawDialogBubble(s);
  }
}

function drawDialogBubble(c: CustomerEntity): void {
  const bx = c.x;
  const by = c.y - 130;
  const w = 170;
  const h = 52;

  ctx.save();
  ctx.translate(bx, by);

  ctx.fillStyle = '#FFF8DC';
  ctx.strokeStyle = '#8B5E3C';
  ctx.lineWidth = 2;

  roundRect(ctx, -w / 2, -h / 2, w, h, 8);
  ctx.fill();
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(-8, h / 2 - 2);
  ctx.lineTo(0, h / 2 + 12);
  ctx.lineTo(8, h / 2 - 2);
  ctx.closePath();
  ctx.fillStyle = '#FFF8DC';
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#000';
  ctx.font = '13px "Noto Serif SC", SimSun, serif';
  ctx.textAlign = 'center';
  ctx.fillText(c.dialog.slice(0, 12), 0, -6);
  if (c.dialog.length > 12) {
    ctx.fillText(c.dialog.slice(12, 24), 0, 12);
  }

  ctx.restore();
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
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
}

function updateParticles(deltaTime: number): void {
  for (let i = game.particles.length - 1; i >= 0; i--) {
    const p = game.particles[i];
    p.life += deltaTime;
    p.x += p.vx * deltaTime;
    p.y += p.vy * deltaTime;
    p.vy += 60 * deltaTime;

    if (p.life >= p.maxLife) {
      game.particles.splice(i, 1);
    }
  }
}

function drawParticles(): void {
  game.particles.forEach(p => {
    const alpha = 1 - p.life / p.maxLife;
    ctx.save();
    ctx.translate(offsetX, offsetY);
    ctx.scale(scale, scale);
    ctx.fillStyle = `rgba(180, 180, 180, ${alpha * 0.6})`;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });
}

function gameLoop(currentTime: number): void {
  if (!game.running) return;

  const deltaTime = Math.min((currentTime - game.lastTime) / 1000, 0.05);
  game.lastTime = currentTime;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawBackground(currentTime);

  if (!game.gameOver) {
    const newParticles = game.peddler.update(deltaTime);
    game.particles.push(...newParticles);

    game.spawnTimer -= deltaTime;
    const activeCount = game.customers.filter(c => !c.entity.interacted).length;
    if (game.spawnTimer <= 0 && activeCount < 3) {
      spawnCustomer();
      game.spawnTimer = 4 + Math.random() * 4;
    }

    for (let i = game.customers.length - 1; i >= 0; i--) {
      const c = game.customers[i];
      c.update(deltaTime, game.peddler.state.x, game.peddler.state.y);
      if (c.entity.interacted && !c.entity.walking && c.entity.dialogVisible === false) {
        if (c.entity.x < -100 || c.entity.x > LOGICAL_WIDTH + 100) {
          game.customers.splice(i, 1);
          continue;
        }
        c.entity.targetX = c.entity.direction === 'right' ? LOGICAL_WIDTH + 100 : -100;
        c.entity.walking = true;
      }
    }
  }

  updateParticles(deltaTime);

  ctx.save();
  ctx.translate(offsetX, offsetY);
  ctx.scale(scale, scale);

  const sorted = [...game.customers].sort((a, b) => a.entity.y - b.entity.y);
  sorted.forEach(c => {
    if (c.entity.y < game.peddler.state.y) {
      drawCustomer(c.entity);
    }
  });

  drawPeddler();

  sorted.forEach(c => {
    if (c.entity.y >= game.peddler.state.y) {
      drawCustomer(c.entity);
    }
  });

  ctx.restore();

  drawParticles();

  requestAnimationFrame(gameLoop);
}

canvas.addEventListener('click', (e: MouseEvent) => {
  if (game.gameOver) return;

  const rect = canvas.getBoundingClientRect();
  const cx = e.clientX - rect.left;
  const cy = e.clientY - rect.top;

  const logicalX = (cx - offsetX) / scale;
  const logicalY = (cy - offsetY) / scale;

  for (const customer of game.customers) {
    if (customer.checkDialogClick(logicalX, logicalY)) {
      showCustomerDialog(customer);
      return;
    }
  }

  if (logicalY > LOGICAL_HEIGHT * 0.5 && logicalY < LOGICAL_HEIGHT * 0.95) {
    const targetX = Math.max(80, Math.min(LOGICAL_WIDTH - 80, logicalX));
    game.peddler.moveTo(targetX);
  }
});

window.addEventListener('resize', resizeCanvas);
window.addEventListener('keydown', (e: KeyboardEvent) => {
  if (game.gameOver) return;
  if (e.key === 'ArrowLeft' || e.key === 'a') {
    window.movePeddler('left');
  } else if (e.key === 'ArrowRight' || e.key === 'd') {
    window.movePeddler('right');
  }
});

window.addEventListener('load', () => {
  resizeCanvas();
  initGame();
  requestAnimationFrame((t) => {
    game.lastTime = t;
    gameLoop(t);
  });
});
