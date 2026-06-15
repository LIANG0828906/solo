import Phaser from 'phaser';
import { BeatScene } from './BeatScene';
import { UIScene, GameEndData } from './UIScene';
import { BADGE_DEFS, BadgeTier, badgeManager } from './BadgeManager';

const container = document.getElementById('game-container')!;
const overlay = document.getElementById('overlay')!;

function buildBadgeSVGInline(tier: BadgeTier, size: number): string {
  return badgeManager.renderBadgeSVG(tier, size);
}

function htmlToElement(html: string): HTMLElement {
  const tpl = document.createElement('template');
  tpl.innerHTML = html.trim();
  return tpl.content.firstChild as HTMLElement;
}

function createModal(): { mask: HTMLElement; show: (tier: BadgeTier) => void } {
  const mask = document.createElement('div');
  mask.className = 'modal-mask';
  const borderColors: Record<BadgeTier, string> = {
    bronze: '#cd7f32',
    silver: '#d0d0d0',
    gold: '#ffd700'
  };
  mask.innerHTML = `
    <div class="modal-content">
      <div class="modal-badge"></div>
      <div class="modal-name"></div>
      <div class="modal-desc"></div>
      <button class="modal-close">关闭</button>
    </div>
  `;
  const content = mask.querySelector('.modal-content') as HTMLElement;
  const badgeEl = mask.querySelector('.modal-badge') as HTMLElement;
  const nameEl = mask.querySelector('.modal-name') as HTMLElement;
  const descEl = mask.querySelector('.modal-desc') as HTMLElement;
  const closeBtn = mask.querySelector('.modal-close') as HTMLElement;

  const hide = () => { mask.classList.remove('show'); };
  closeBtn.addEventListener('click', hide);
  mask.addEventListener('click', (e) => { if (e.target === mask) hide(); });

  overlay.appendChild(mask);

  const show = (tier: BadgeTier) => {
    const def = BADGE_DEFS.find(d => d.id === tier)!;
    content.style.borderColor = borderColors[tier];
    badgeEl.innerHTML = buildBadgeSVGInline(tier, 140);
    badgeEl.style.color = borderColors[tier];
    nameEl.textContent = def.name;
    nameEl.style.color = def.color;
    descEl.textContent = def.description;
    mask.classList.add('show');
  };
  return { mask, show };
}

function generateShareImage(name: string, score: number, badges: BadgeTier[]): void {
  const W = 720;
  const H = 1080;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, '#1a0a2e');
  bg.addColorStop(0.5, '#2d0f4a');
  bg.addColorStop(1, '#1a0a2e');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = 'rgba(255,255,255,0.08)';
  ctx.fillRect(40, 40, W - 80, H - 80);
  ctx.strokeStyle = 'rgba(255,255,255,0.2)';
  ctx.lineWidth = 2;
  ctx.strokeRect(40, 40, W - 80, H - 80);

  const titleGrad = ctx.createLinearGradient(100, 0, W - 100, 0);
  titleGrad.addColorStop(0, '#00e5ff');
  titleGrad.addColorStop(1, '#ff4dd2');
  ctx.fillStyle = titleGrad;
  ctx.font = 'bold 56px "Segoe UI", "PingFang SC", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('音乐节限定徽章', W / 2, 160);

  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.font = '24px "Segoe UI", "PingFang SC", sans-serif';
  ctx.fillText('RHYTHM BADGE FESTIVAL', W / 2, 200);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 36px "Segoe UI", "PingFang SC", sans-serif';
  ctx.fillText(name || '匿名玩家', W / 2, 300);

  ctx.fillStyle = '#00e5ff';
  ctx.shadowColor = '#00e5ff';
  ctx.shadowBlur = 20;
  ctx.font = 'bold 96px "Segoe UI", sans-serif';
  ctx.fillText(String(score), W / 2, 440);
  ctx.shadowBlur = 0;

  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.font = '24px "Segoe UI", "PingFang SC", sans-serif';
  ctx.fillText('最终得分', W / 2, 490);

  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.font = 'bold 30px "Segoe UI", "PingFang SC", sans-serif';
  ctx.fillText('已解锁徽章', W / 2, 590);

  const badgeSize = 160;
  const gap = 30;
  const totalW = badges.length * badgeSize + (badges.length - 1) * gap;
  let x = (W - totalW) / 2;
  const y = 640;

  if (badges.length === 0) {
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.font = '22px "Segoe UI", "PingFang SC", sans-serif';
    ctx.fillText('本次未解锁任何徽章，继续努力！', W / 2, y + 80);
  }

  badges.forEach((tier, i) => {
    const svg = badgeManager.renderBadgeSVG(tier, badgeSize);
    const img = new Image();
    const svgBlob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    const bx = x + i * (badgeSize + gap);
    img.onload = () => {
      ctx.shadowColor = BADGE_DEFS.find(d => d.id === tier)!.color;
      ctx.shadowBlur = 25;
      ctx.drawImage(img, bx, y, badgeSize, badgeSize);
      ctx.shadowBlur = 0;
      URL.revokeObjectURL(url);
    };
    img.src = url;
  });

  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.font = '20px "Segoe UI", "PingFang SC", sans-serif';
  ctx.fillText('© 2026 节奏徽章 · 音乐节限定版', W / 2, H - 70);

  setTimeout(() => {
    canvas.toBlob(blob => {
      if (!blob) return;
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `rhythm-badge-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(a.href), 3000);
    }, 'image/png');
  }, 400);
}

function showResultPanel(data: GameEndData): void {
  const oldPanel = overlay.querySelector('.result-panel');
  if (oldPanel) oldPanel.remove();

  const modal = createModal();

  const panel = htmlToElement(`
    <div class="result-panel">
      <h2>表演结束</h2>
      <div class="subtitle">感谢参与音乐节限定节奏挑战</div>
      <div class="stats-row">
        <div class="stat-item stat-score">
          <span class="num">${data.score}</span>
          <span class="label">总分</span>
        </div>
        <div class="stat-item stat-perfect">
          <span class="num">${data.perfect}</span>
          <span class="label">PERFECT</span>
        </div>
        <div class="stat-item stat-good">
          <span class="num">${data.good}</span>
          <span class="label">GOOD</span>
        </div>
        <div class="stat-item stat-miss">
          <span class="num">${data.miss}</span>
          <span class="label">MISS</span>
        </div>
      </div>
      <div class="badges-title">已解锁徽章</div>
      <div class="badge-grid"></div>
      <input type="text" class="name-input" placeholder="输入你的昵称用于分享" maxlength="16" />
      <div class="btn-row">
        <button class="btn btn-secondary" data-action="replay">再玩一次</button>
        <button class="btn btn-primary" data-action="save">保存徽章</button>
      </div>
    </div>
  `);

  const grid = panel.querySelector('.badge-grid') as HTMLElement;
  BADGE_DEFS.forEach(def => {
    const unlocked = data.badges.includes(def.id);
    const card = htmlToElement(`
      <div class="badge-card ${unlocked ? '' : 'locked'}">
        <div class="badge-icon">${buildBadgeSVGInline(def.id, 64)}</div>
        <div class="badge-name" style="color:${unlocked ? def.color : 'rgba(255,255,255,0.5)'}">${def.name}</div>
        <div class="badge-desc">${def.description}</div>
      </div>
    `);
    if (unlocked) {
      card.addEventListener('click', () => modal.show(def.id));
    }
    grid.appendChild(card);
  });

  const nameInput = panel.querySelector('.name-input') as HTMLInputElement;
  const replayBtn = panel.querySelector('[data-action="replay"]') as HTMLElement;
  const saveBtn = panel.querySelector('[data-action="save"]') as HTMLElement;

  replayBtn.addEventListener('click', () => {
    panel.classList.remove('show');
    setTimeout(() => {
      overlay.innerHTML = '';
      restartGame();
    }, 450);
  });

  saveBtn.addEventListener('click', () => {
    generateShareImage(nameInput.value.trim(), data.score, data.badges);
    saveBtn.textContent = '已保存 ✓';
    setTimeout(() => { saveBtn.textContent = '保存徽章'; }, 1800);
  });

  overlay.appendChild(panel);
  requestAnimationFrame(() => panel.classList.add('show'));
}

(window as any).__showResultPanel = showResultPanel;

function createGame(): Phaser.Game {
  return new Phaser.Game({
    type: Phaser.AUTO,
    parent: container,
    backgroundColor: '#1a0a2e',
    scale: {
      mode: Phaser.Scale.RESIZE,
      width: window.innerWidth,
      height: window.innerHeight,
      autoCenter: Phaser.Scale.CENTER_BOTH
    },
    input: {
      activePointers: 3
    },
    scene: [BeatScene, UIScene],
    fps: {
      target: 60,
      min: 30,
      forceSetTimeOut: false
    },
    render: {
      antialias: true,
      pixelArt: false,
      roundPixels: false
    }
  });
}

let game = createGame();

function restartGame(): void {
  game.destroy(true);
  badgeManager.reset();
  game = createGame();
}

game.events.once('ready', () => {
  game.scene.start('BeatScene');
  game.scene.start('UIScene');
  game.scene.bringToTop('UIScene');
});
