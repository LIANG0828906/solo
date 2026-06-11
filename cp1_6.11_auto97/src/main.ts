import { GameMap, CELL_PX, CANVAS_PX, GRID_SIZE } from './map';
import { Player, Bullet, SlowField, SkillType } from './player';
import { EnemyManager, Enemy } from './enemy';

const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;
const hudWave = document.getElementById('hudWave') as HTMLElement;
const hudEnemyCount = document.getElementById('hudEnemyCount') as HTMLElement;
const hudHp = document.getElementById('hudHp') as HTMLElement;
const hudCoins = document.getElementById('hudCoins') as HTMLElement;
const hpBarFill = document.getElementById('hpBarFill') as HTMLElement;
const canvasFlash = document.getElementById('canvasFlash') as HTMLElement;
const skillBar = document.getElementById('skillBar') as HTMLElement;
const gameOverPanel = document.getElementById('gameOverPanel') as HTMLElement;
const gameOverStats = document.getElementById('gameOverStats') as HTMLElement;

const skillSlots = skillBar.querySelectorAll('.skill-slot');

const gameMap = new GameMap();
gameMap.generate();
const player = new Player(gameMap);
const enemyMgr = new EnemyManager(gameMap);
const bullets: Bullet[] = [];
const slowFields: SlowField[] = [];
let running = true;

const skillAnimatedSlots: Set<number> = new Set();

function triggerFlash(): void {
  canvasFlash.classList.add('active');
  setTimeout(() => canvasFlash.classList.remove('active'), 200);
}

canvas.addEventListener('contextmenu', (e: MouseEvent) => e.preventDefault());

canvas.addEventListener('mousedown', (e: MouseEvent) => {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  const mx = (e.clientX - rect.left) * scaleX;
  const my = (e.clientY - rect.top) * scaleY;
  if (e.button === 0) {
    player.setMoveTarget(mx, my);
  } else if (e.button === 2) {
    const field = player.castSlowField(mx, my);
    if (field) {
      slowFields.push(field);
      triggerFlash();
    }
  }
});

function getSkillIconSVG(skill: SkillType): string {
  switch (skill) {
    case 'attack_up':
      return `<svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
        <g transform="rotate(45 18 18)">
          <rect x="15" y="4" width="6" height="28" rx="1" fill="#FF4444" stroke="#CC2222" stroke-width="1"/>
          <rect x="4" y="15" width="28" height="6" rx="1" fill="#FF6666" stroke="#CC2222" stroke-width="1"/>
        </g>
        <circle cx="18" cy="18" r="4" fill="#FFAAAA" stroke="#FF4444" stroke-width="1"/>
      </svg>`;
    case 'defense_up':
      return `<svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="18" cy="18" r="14" fill="#2266AA" stroke="#114488" stroke-width="1.5"/>
        <path d="M18 6 L26 10 V17 C26 23 22 28 18 30 C14 28 10 23 10 17 V10 Z" fill="#4488CC" stroke="#2266AA" stroke-width="1.5"/>
        <path d="M18 12 L22 14 V18 C22 21 20 24 18 25 C16 24 14 21 14 18 V14 Z" fill="#66AAEE"/>
      </svg>`;
    case 'speed_up':
      return `<svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M20 4 L8 20 H16 L14 32 L28 14 H20 Z" fill="#FFCC00" stroke="#CC9900" stroke-width="1.5"/>
        <path d="M19 9 L13 19 H17 L16 26 L24 17 H20 Z" fill="#FFEE66"/>
      </svg>`;
    case 'fire_rate_up':
      return `<svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="18" cy="18" r="13" fill="none" stroke="#FF6600" stroke-width="1.5" stroke-dasharray="3 2"/>
        <circle cx="18" cy="18" r="9" fill="none" stroke="#FF8822" stroke-width="1.5"/>
        <path d="M18 6 C14 12 12 14 12 18 C12 21.3 14.7 24 18 24 C21.3 24 24 21.3 24 18 C24 14 22 12 18 6 Z" fill="#FFAA44" stroke="#FF6600" stroke-width="1"/>
        <path d="M18 12 C16 15 15 16 15 18 C15 19.7 16.3 21 18 21 C19.7 21 21 19.7 21 18 C21 16 20 15 18 12 Z" fill="#FFDD88"/>
      </svg>`;
    default:
      return '';
  }
}

function renderSkillIcon(icoContainer: Element | null, skill: SkillType): void {
  if (!icoContainer) return;
  icoContainer.innerHTML = getSkillIconSVG(skill);
}

function updateHUD(): void {
  hudWave.textContent = String(enemyMgr.getWave());
  hudEnemyCount.textContent = String(enemyMgr.getAliveCount());
  hudHp.textContent = `${Math.max(0, player.hp)} / ${player.maxHp}`;
  hpBarFill.style.width = `${Math.max(0, player.getHpRatio() * 100)}%`;
  hudCoins.textContent = String(player.coins);

  for (let i = 0; i < skillSlots.length; i++) {
    const slot = skillSlots[i] as HTMLElement;
    const skill = player.skills[i];
    if (skill) {
      if (!slot.classList.contains('active')) {
        slot.classList.add('active');
      }
      const ico = slot.querySelector('.skill-ico');
      if (ico && !ico.innerHTML.trim()) {
        renderSkillIcon(ico, skill);
      }
      if (!skillAnimatedSlots.has(i)) {
        slot.classList.add('entering');
        skillAnimatedSlots.add(i);
        setTimeout(() => {
          slot.classList.remove('entering');
        }, 600);
      }
    }
  }
}

function gameOver(now: number): void {
  running = false;
  gameOverPanel.style.display = 'flex';
  gameOverStats.textContent = `存活了 ${enemyMgr.getWave()} 波，击杀 ${player.killCount} 只怪物，收集 ${player.coins} 金币`;
}

function update(dt: number, now: number): void {
  enemyMgr.waveTimer -= dt;
  if (enemyMgr.waveTimer <= 0) {
    enemyMgr.spawnNextWave();
  }

  player.update(dt, enemyMgr.getAliveEnemies(), bullets);

  const enemyResult = enemyMgr.update(dt, player.x, player.y, slowFields);
  if (enemyResult.damageDealt > 0) {
    player.takeDamage(enemyResult.damageDealt);
  }

  for (let i = 0; i < bullets.length; i++) {
    const b = bullets[i];
    if (!b.alive) continue;
    b.x += b.vx * 60 * dt;
    b.y += b.vy * 60 * dt;

    if (b.x < 0 || b.x > CANVAS_PX || b.y < 0 || b.y > CANVAS_PX) {
      b.alive = false;
      continue;
    }

    if (gameMap.blocksBullet(b.x, b.y)) {
      b.alive = false;
      continue;
    }

    const aliveEnemies = enemyMgr.getAliveEnemies();
    for (let j = 0; j < aliveEnemies.length; j++) {
      const e = aliveEnemies[j];
      if (Math.hypot(b.x - e.x, b.y - e.y) < (b.radius + e.size)) {
        const killed = enemyMgr.damageEnemy(e.id, b.damage);
        if (killed) {
          player.addKill();
        }
        b.alive = false;
        break;
      }
    }
  }

  for (let i = bullets.length - 1; i >= 0; i--) {
    if (!bullets[i].alive) {
      bullets.splice(i, 1);
    }
  }

  for (let i = 0; i < slowFields.length; i++) {
    slowFields[i].duration -= dt;
  }
  for (let i = slowFields.length - 1; i >= 0; i--) {
    if (slowFields[i].duration <= 0) {
      slowFields.splice(i, 1);
    }
  }

  if (player.dead) {
    gameOver(now);
  }
}

function render(timeMs: number): void {
  gameMap.renderStatic(ctx, timeMs);

  for (let i = 0; i < slowFields.length; i++) {
    const sf = slowFields[i];
    ctx.fillStyle = 'rgba(68,170,255,0.4)';
    ctx.beginPath();
    ctx.arc(sf.x, sf.y, sf.radius, 0, Math.PI * 2);
    ctx.fill();
  }

  for (let i = 0; i < bullets.length; i++) {
    const b = bullets[i];
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
    ctx.fill();
  }

  enemyMgr.render(ctx, timeMs);

  player.render(ctx);
}

let lastTime = performance.now();

function loop(now: number): void {
  const dt = Math.min(0.05, (now - lastTime) / 1000);
  lastTime = now;
  if (running) {
    update(dt, now);
  }
  render(now);
  updateHUD();
  requestAnimationFrame(loop);
}

requestAnimationFrame(loop);
