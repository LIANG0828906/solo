import { Hero, HERO_DEFS, SYNERGY_DEFS, ROLE_NAMES, RACE_NAMES, getActiveSynergies, HeroDef } from './hero';
import { Board, BOARD_SIZE } from './board';
import { CombatSystem } from './combatSystem';
import { Renderer } from './renderer';

type GamePhase = 'prep' | 'battle' | 'result';

class Game {
  canvas!: HTMLCanvasElement;
  renderer!: Renderer;
  board!: Board;
  combat!: CombatSystem;
  phase: GamePhase = 'prep';
  gold: number = 10;
  round: number = 1;
  winStreak: number = 0;
  loseStreak: number = 0;
  selectedHeroDef: HeroDef | null = null;
  hoverCell: { cx: number; cy: number } | null = null;
  mouseX: number = 0;
  mouseY: number = 0;
  isDragging: boolean = false;
  lastTime: number = 0;
  resultAnimStart: number = 0;
  autoBattleTimer: number = 0;
  tooltipHero: HeroDef | null = null;
  tooltipX: number = 0;
  tooltipY: number = 0;

  heroPoolEl!: HTMLElement;
  goldEl!: HTMLElement;
  roundEl!: HTMLElement;
  streakEl!: HTMLElement;
  startBtn!: HTMLElement;
  synergyPanelEl!: HTMLElement;
  phaseEl!: HTMLElement;
  rightPanelToggle!: HTMLElement;
  leftPanelToggle!: HTMLElement;

  constructor() {
    this.init();
  }

  init() {
    this.canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
    this.renderer = new Renderer(this.canvas);
    this.board = new Board();
    this.combat = new CombatSystem(this.board);

    this.heroPoolEl = document.getElementById('heroPool')!;
    this.goldEl = document.getElementById('goldDisplay')!;
    this.roundEl = document.getElementById('roundDisplay')!;
    this.streakEl = document.getElementById('streakDisplay')!;
    this.startBtn = document.getElementById('startBtn')!;
    this.synergyPanelEl = document.getElementById('synergyPanel')!;
    this.phaseEl = document.getElementById('phaseDisplay')!;
    this.rightPanelToggle = document.getElementById('rightPanelToggle')!;
    this.leftPanelToggle = document.getElementById('leftPanelToggle')!;

    this.resize();
    window.addEventListener('resize', () => this.resize());

    this.buildHeroPool();
    this.updateUI();

    this.canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
    this.canvas.addEventListener('click', (e) => this.onClick(e));
    this.canvas.addEventListener('contextmenu', (e) => this.onRightClick(e));
    this.canvas.addEventListener('mouseleave', () => {
      this.hoverCell = null;
      this.isDragging = false;
    });

    this.startBtn.addEventListener('click', () => this.startBattle());

    this.rightPanelToggle.addEventListener('click', () => {
      const panel = document.getElementById('rightPanel')!;
      panel.classList.toggle('collapsed');
    });

    this.leftPanelToggle.addEventListener('click', () => {
      const panel = document.getElementById('leftPanel')!;
      panel.classList.toggle('collapsed');
    });

    this.lastTime = performance.now();
    requestAnimationFrame((t) => this.gameLoop(t));
  }

  resize() {
    const container = document.getElementById('canvasContainer')!;
    const rect = container.getBoundingClientRect();
    this.renderer.resize(rect.width, rect.height);

    const maxBoardW = rect.width - 20;
    const maxBoardH = rect.height - 20;
    const maxCellSize = Math.min(maxBoardW / BOARD_SIZE, maxBoardH / BOARD_SIZE);
    this.renderer.cellSize = Math.min(72, Math.max(40, Math.floor(maxCellSize)));
  }

  buildHeroPool() {
    this.heroPoolEl.innerHTML = '';
    for (const def of HERO_DEFS) {
      const card = document.createElement('div');
      card.className = 'hero-card';
      card.dataset.heroId = def.id;
      card.innerHTML = `
        <div class="hero-emoji">${def.emoji}</div>
        <div class="hero-name">${def.name}</div>
        <div class="hero-cost">💰 ${def.cost}</div>
        <div class="hero-tags">
          <span class="tag tag-role" style="border-color:${this.getRoleColor(def.role)}">${ROLE_NAMES[def.role]}</span>
          <span class="tag tag-race" style="border-color:${this.getRaceColor(def.race)}">${RACE_NAMES[def.race]}</span>
        </div>
      `;

      card.addEventListener('click', () => {
        if (this.phase !== 'prep') return;
        if (this.gold < def.cost) {
          this.showToast('金币不足！');
          return;
        }
        if (this.board.blueHeroes.length >= 5) {
          this.showToast('已达到最大英雄数(5)！');
          return;
        }
        this.selectedHeroDef = def;
        this.isDragging = true;
        this.updateHeroPoolHighlight();
      });

      card.addEventListener('mouseenter', (e) => {
        this.tooltipHero = def;
        this.tooltipX = e.clientX;
        this.tooltipY = e.clientY;
        this.showTooltip(def, e.clientX, e.clientY);
      });

      card.addEventListener('mouseleave', () => {
        this.tooltipHero = null;
        this.hideTooltip();
      });

      this.heroPoolEl.appendChild(card);
    }
  }

  getRoleColor(role: string): string {
    const syn = SYNERGY_DEFS.find(s => s.type === 'role' && s.key === role);
    return syn ? syn.color : '#888';
  }

  getRaceColor(race: string): string {
    const syn = SYNERGY_DEFS.find(s => s.type === 'race' && s.key === race);
    return syn ? syn.color : '#888';
  }

  showTooltip(def: HeroDef, mx: number, my: number) {
    let tt = document.getElementById('heroTooltip');
    if (!tt) {
      tt = document.createElement('div');
      tt.id = 'heroTooltip';
      document.body.appendChild(tt);
    }
    tt.className = 'hero-tooltip';
    tt.innerHTML = `
      <div class="tt-name">${def.emoji} ${def.name}</div>
      <div class="tt-cost">💰 费用: ${def.cost}</div>
      <div class="tt-stat">❤️ 生命: ${def.maxHp}</div>
      <div class="tt-stat">⚔️ 攻击: ${def.attack}</div>
      <div class="tt-stat">⚡ 攻速: ${(1000 / def.attackSpeed).toFixed(1)}/s</div>
      <div class="tt-stat">🎯 射程: ${def.attackRange}</div>
      <div class="tt-skill">✨ ${def.skill.name} (${def.skill.type})</div>
      <div class="tt-tags">
        <span style="color:${this.getRoleColor(def.role)}">${ROLE_NAMES[def.role]}</span> ·
        <span style="color:${this.getRaceColor(def.race)}">${RACE_NAMES[def.race]}</span>
      </div>
    `;
    tt.style.display = 'block';
    const x = Math.min(mx + 15, window.innerWidth - 220);
    const y = Math.min(my + 15, window.innerHeight - 200);
    tt.style.left = x + 'px';
    tt.style.top = y + 'px';
  }

  hideTooltip() {
    const tt = document.getElementById('heroTooltip');
    if (tt) tt.style.display = 'none';
  }

  showToast(msg: string) {
    let toast = document.getElementById('toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'toast';
      document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.className = 'toast show';
    setTimeout(() => { toast.className = 'toast'; }, 1500);
  }

  updateHeroPoolHighlight() {
    const cards = this.heroPoolEl.querySelectorAll('.hero-card');
    cards.forEach(c => {
      const el = c as HTMLElement;
      if (this.selectedHeroDef && el.dataset.heroId === this.selectedHeroDef.id) {
        el.classList.add('selected');
      } else {
        el.classList.remove('selected');
      }
    });
  }

  onMouseMove(e: MouseEvent) {
    const rect = this.canvas.getBoundingClientRect();
    this.mouseX = e.clientX - rect.left;
    this.mouseY = e.clientY - rect.top;

    this.hoverCell = this.renderer.pixelToCell(this.mouseX, this.mouseY);
  }

  onClick(e: MouseEvent) {
    if (this.phase !== 'prep') return;

    const cell = this.renderer.pixelToCell(this.mouseX, this.mouseY);
    if (!cell) {
      this.selectedHeroDef = null;
      this.isDragging = false;
      this.updateHeroPoolHighlight();
      return;
    }

    if (this.selectedHeroDef && this.isDragging) {
      if (cell.cy > 3) {
        this.showToast('蓝方英雄只能放在上半区（前4行）');
        return;
      }

      const existing = this.board.grid[cell.cy][cell.cx];
      if (existing) {
        this.showToast('该位置已有英雄');
        return;
      }

      const hero = Hero.fromDef(this.selectedHeroDef.id, 'blue');
      if (!hero) return;

      if (this.gold < hero.cost) {
        this.showToast('金币不足！');
        return;
      }

      this.gold -= hero.cost;
      const placed = this.board.placeHero(hero, cell.cx, cell.cy);
      if (placed) {
        hero.placeAnimTime = 400;
        const pos = this.renderer.cellToPixel(cell.cx, cell.cy);
        hero.pixelX = pos.x;
        hero.pixelY = pos.y;
      }

      this.selectedHeroDef = null;
      this.isDragging = false;
      this.updateHeroPoolHighlight();
      this.updateUI();
    }
  }

  onRightClick(e: MouseEvent) {
    e.preventDefault();
    if (this.phase !== 'prep') return;

    const cell = this.renderer.pixelToCell(this.mouseX, this.mouseY);
    if (!cell) return;

    const hero = this.board.grid[cell.cy]?.[cell.cx];
    if (!hero || hero.team !== 'blue') return;

    const refund = hero.cost;
    this.board.removeHero(cell.cx, cell.cy);
    this.gold += refund;
    this.showToast(`出售 ${hero.name}，返还 💰${refund}`);
    this.updateUI();
  }

  startBattle() {
    if (this.phase !== 'prep') return;
    if (this.board.blueHeroes.length === 0) {
      this.showToast('请先放置至少一个英雄！');
      return;
    }

    this.spawnEnemyTeam();
    this.board.resetForBattle();
    this.phase = 'battle';
    this.combat = new CombatSystem(this.board);
    this.combat.initBattle();
    this.updateUI();

    for (const h of this.board.getAllHeroes()) {
      const pos = this.renderer.cellToPixel(h.x, h.y);
      h.pixelX = pos.x;
      h.pixelY = pos.y;
      h.targetPixelX = pos.x;
      h.targetPixelY = pos.y;
    }
  }

  spawnEnemyTeam() {
    const available = [...HERO_DEFS];
    const count = Math.min(5, this.round + 1);
    const budget = this.round * 3 + 5;

    this.board.redHeroes = [];
    for (let r = 4; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        this.board.grid[r][c] = null;
      }
    }

    let spent = 0;
    const placed: { hero: Hero; x: number; y: number }[] = [];

    for (let i = 0; i < count; i++) {
      const affordable = available.filter(d => d.cost <= budget - spent);
      if (affordable.length === 0) break;

      const def = affordable[Math.floor(Math.random() * affordable.length)];
      const hero = new Hero(def, 'red');
      spent += def.cost;

      let placedOk = false;
      const positions: { x: number; y: number }[] = [];
      for (let r = 4; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
          if (!this.board.grid[r][c]) positions.push({ x: c, y: r });
        }
      }
      if (positions.length > 0) {
        const pos = positions[Math.floor(Math.random() * positions.length)];
        this.board.placeHero(hero, pos.x, pos.y);
        placedOk = true;
      }
    }
  }

  endBattle() {
    this.phase = 'result';
    this.resultAnimStart = performance.now();

    if (this.combat.winner === 'blue') {
      this.winStreak++;
      this.loseStreak = 0;
    } else {
      this.loseStreak++;
      this.winStreak = 0;
    }

    this.updateUI();
  }

  nextRound() {
    this.round++;
    const baseIncome = 5;
    const streakBonus = Math.min(3, Math.max(this.winStreak, this.loseStreak));
    const interest = Math.min(5, Math.floor(this.gold / 10));
    this.gold += baseIncome + streakBonus + interest;

    this.board.clear();
    this.phase = 'prep';
    this.selectedHeroDef = null;
    this.isDragging = false;
    this.updateUI();
  }

  updateUI() {
    this.goldEl.textContent = `${this.gold}`;
    this.roundEl.textContent = `${this.round}`;
    this.phaseEl.textContent = this.phase === 'prep' ? '准备阶段' : this.phase === 'battle' ? '战斗中' : '结算';

    if (this.winStreak >= 2) {
      this.streakEl.textContent = `🔥连胜${this.winStreak}`;
      this.streakEl.style.color = '#ffd700';
    } else if (this.loseStreak >= 2) {
      this.streakEl.textContent = `❄️连败${this.loseStreak}`;
      this.streakEl.style.color = '#88aaff';
    } else {
      this.streakEl.textContent = '';
    }

    if (this.phase === 'prep') {
      this.startBtn.removeAttribute('disabled');
      this.startBtn.classList.remove('disabled');
    } else {
      this.startBtn.setAttribute('disabled', 'true');
      this.startBtn.classList.add('disabled');
    }

    this.updateSynergyPanel();
  }

  updateSynergyPanel() {
    const activeSynergies = getActiveSynergies(this.board.blueHeroes);
    let html = '<div class="synergy-title">羁绊</div>';

    if (activeSynergies.length === 0) {
      html += '<div class="synergy-empty">放置英雄激活羁绊</div>';
    }

    for (const { synergy, tier, count } of activeSynergies) {
      html += `
        <div class="synergy-item active" style="border-color:${synergy.color}">
          <span class="synergy-name" style="color:${synergy.color}">${synergy.name}</span>
          <span class="synergy-count">${count}/${tier.count}</span>
          <span class="synergy-effect">${tier.effect === 'armor' ? `+${Math.floor(tier.value * 100)}%护甲` :
            tier.effect === 'sp' ? `+${Math.floor(tier.value * 100)}%法强` :
            tier.effect === 'crit' ? `+${Math.floor(tier.value * 100)}%暴击` :
            tier.effect === 'range' ? `+${Math.floor(tier.value * 100)}%射程` :
            tier.effect === 'hp' ? `+${tier.value}生命` :
            tier.effect === 'healBoost' ? `+${Math.floor(tier.value * 100)}%治疗` :
            tier.effect === 'atk' ? `+${Math.floor(tier.value * 100)}%攻击` :
            tier.effect === 'dodge' ? `+${Math.floor(tier.value * 100)}%闪避` :
            tier.effect === 'enemyArmorReduce' ? `敌-${Math.floor(tier.value * 100)}%护甲` :
            tier.effect === 'startRage' ? `开局+${tier.value}怒气` :
            tier.effect === 'atkspd' ? `+${Math.floor(tier.value * 100)}%攻速` :
            tier.effect}</span>
        </div>
      `;
    }

    const roleCounts = new Map<string, number>();
    const raceCounts = new Map<string, number>();
    for (const h of this.board.blueHeroes) {
      roleCounts.set(h.role, (roleCounts.get(h.role) ?? 0) + 1);
      raceCounts.set(h.race, (raceCounts.get(h.race) ?? 0) + 1);
    }

    for (const syn of SYNERGY_DEFS) {
      const counts = syn.type === 'role' ? roleCounts : raceCounts;
      const count = counts.get(syn.key) ?? 0;
      const isActive = activeSynergies.some(s => s.synergy.key === syn.key);
      if (count > 0 && !isActive) {
        const nextTier = syn.tiers.find(t => t.count > count);
        html += `
          <div class="synergy-item inactive" style="border-color:${syn.color}40">
            <span class="synergy-name" style="color:${syn.color}88">${syn.name}</span>
            <span class="synergy-count">${count}/${nextTier?.count ?? '-'}</span>
          </div>
        `;
      }
    }

    this.synergyPanelEl.innerHTML = html;
  }

  gameLoop(now: number) {
    const dt = Math.min(now - this.lastTime, 50);
    this.lastTime = now;

    this.update(dt, now);
    this.render(now);

    requestAnimationFrame((t) => this.gameLoop(t));
  }

  update(dt: number, now: number) {
    for (const h of this.board.getAllHeroes()) {
      if (h.placeAnimTime > 0) h.placeAnimTime = Math.max(0, h.placeAnimTime - dt);
      if (h.hitFlashTime > 0) h.hitFlashTime = Math.max(0, h.hitFlashTime - dt);
      if (h.skillAnimTime > 0) h.skillAnimTime = Math.max(0, h.skillAnimTime - dt);
    }

    if (this.phase === 'battle') {
      this.combat.update(now, dt);
      if (this.combat.battleEnded) {
        this.endBattle();
      }
    }
  }

  render(now: number) {
    const ctx = this.renderer.ctx;
    const canvas = this.canvas;

    ctx.save();

    let shakeDx = 0, shakeDy = 0;
    if (this.combat.shakeEffect) {
      const shake = this.renderer.drawShake(this.combat.shakeEffect.intensity);
      shakeDx = shake.dx;
      shakeDy = shake.dy;
    }

    ctx.translate(shakeDx, shakeDy);

    this.renderer.drawBackground();
    this.renderer.drawBoard(this.board, this.hoverCell, this.selectedHeroDef, this.isDragging);
    this.renderer.drawSkillEffects(this.combat.skillEffects);
    this.renderer.drawHeroes(this.board.getAllHeroes().filter(h => h.isAlive), now);
    this.renderer.drawAttackEffects(this.combat.attackEffects);
    this.renderer.drawParticles(this.combat.particles);
    this.renderer.drawFloatingTexts(this.combat.floatingTexts);

    if (this.isDragging && this.selectedHeroDef) {
      this.renderer.drawDragGhost(this.selectedHeroDef, this.mouseX, this.mouseY);
    }

    ctx.restore();

    if (this.phase === 'result') {
      const animElapsed = now - this.resultAnimStart;
      this.renderer.drawBattleStats(
        this.combat,
        this.board.blueHeroes,
        this.board.redHeroes,
        animElapsed
      );

      if (animElapsed > 1000) {
        this.drawNextRoundButton();
      }
    }
  }

  drawNextRoundButton() {
    const existing = document.getElementById('nextRoundBtn');
    if (existing) return;

    const btn = document.createElement('button');
    btn.id = 'nextRoundBtn';
    btn.textContent = '下一回合 →';
    btn.className = 'next-round-btn';
    btn.addEventListener('click', () => {
      btn.remove();
      this.nextRound();
    });
    document.getElementById('canvasContainer')!.appendChild(btn);
  }
}

new Game();
