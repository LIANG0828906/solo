import {
  launchArrow,
  getArrowPosition,
  getZoneScore,
  POT_CONFIG,
  LaunchParams,
  HitResult,
  TrajectoryPoint
} from './arrow.js';
import {
  drawRiddle,
  generateDrinkingPoem,
  createEmptyRound,
  Riddle,
  RoundRecord,
  getRiddleAnswerText
} from './riddle.js';

type GamePhase = 'idle' | 'aiming' | 'flying' | 'answering' | 'gameover';

interface GameState {
  phase: GamePhase;
  currentArrow: number;
  totalScore: number;
  chipCount: number;
  roundHistory: RoundRecord[];
  usedRiddleIds: Set<string>;
}

interface ArrowSlot {
  x: number;
  y: number;
  used: boolean;
}

interface Particle {
  x: number; y: number; vx: number; vy: number;
  size: number; alpha: number; life: number; color: string;
}

interface Ant {
  x: number; y: number; vx: number; baseY: number;
}

interface GoldIngotFx {
  x: number; y: number; vy: number; rot: number; vrot: number;
  alpha: number; life: number;
}

const LOGICAL_W = 1000;
const LOGICAL_H = 600;
const ARROW_SLOTS: ArrowSlot[] = [
  { x: 135, y: 360, used: false },
  { x: 135, y: 390, used: false },
  { x: 135, y: 420, used: false },
  { x: 135, y: 450, used: false },
  { x: 135, y: 480, used: false }
];

export class Game {
  private container: HTMLElement;
  private sceneCanvas: HTMLCanvasElement;
  private fxCtx: CanvasRenderingContext2D;
  private sceneCtx: CanvasRenderingContext2D;
  private fxCanvas: HTMLCanvasElement;
  private state: GameState;
  private dpr = 1;
  private scale = 1;
  private slotClones: ArrowSlot[] = JSON.parse(JSON.stringify(ARROW_SLOTS));

  private aiming = {
    active: false,
    slotIndex: -1,
    startX: 0, startY: 0,
    curX: 0, curY: 0,
    angle: 45,
    power: 50
  };

  private flying: {
    result: HitResult; startTime: number; duration: number;
    pos: TrajectoryPoint; angleDeg: number; done: boolean;
  } | null = null;

  private shakeTimer = 0;
  private particles: Particle[] = [];
  private goldIngots: GoldIngotFx[] = [];
  private currentRoundRecord: RoundRecord | null = null;
  private currentRiddle: Riddle | null = null;
  private ants: Ant[] = [];
  private lastLeafCount = 0;
  private lastAntPairs = 0;
  private rafId = 0;
  private lastTime = 0;
  private sceneDirty = true;
  private inkSplash = { active: false, x: 0, y: 0, t: 0 };
  private hitGlow = { active: false, x: 0, y: 0, t: 0 };

  private ui: {
    scoreEl: HTMLElement;
    chipEl: HTMLElement;
    chipListEl: HTMLElement;
    riddleModal: HTMLElement;
    riddleQ: HTMLElement;
    riddleOpts: HTMLElement[];
    resultModal: HTMLElement;
    resultLeft: HTMLElement;
    resultRight: HTMLElement;
    poemBox: HTMLElement;
    statusEl: HTMLElement;
  } | null = null;

  constructor(container: HTMLElement) {
    this.container = container;
    this.state = {
      phase: 'idle',
      currentArrow: 0,
      totalScore: 0,
      chipCount: 0,
      roundHistory: [],
      usedRiddleIds: new Set()
    };
    const fxCanvas = document.createElement('canvas');
    const sceneCanvas = document.createElement('canvas');
    fxCanvas.className = 'fx-canvas';
    sceneCanvas.className = 'scene-canvas';
    container.appendChild(sceneCanvas);
    container.appendChild(fxCanvas);
    this.sceneCanvas = sceneCanvas;
    this.fxCanvas = fxCanvas;
    const fx = fxCanvas.getContext('2d');
    const sc = sceneCanvas.getContext('2d');
    if (!fx || !sc) throw new Error('Canvas not supported');
    this.fxCtx = fx;
    this.sceneCtx = sc;
    this.ctx = fx;
    this.setupUI();
    this.resize();
    this.bindEvents();
    this.lastTime = performance.now();
    this.loop();
  }

  private setupUI(): void {
    const uiHTML = `
      <div class="hud-top">
        <div class="seal-btn" id="resetBtn" style="font-family:LiSu,STLiti,'隶书',serif">重置</div>
        <div class="title-main" style="font-family:'Ma Shan Zheng','Zhi Mang Xing','华文行楷','行书',serif">墨客投壶</div>
        <div class="hud-score">
          <div class="score-item">积分：<span id="scoreVal">0</span></div>
          <div class="score-item">酒筹：<span id="chipVal">0</span></div>
          <div class="score-item">第 <span id="arrowIdx">1</span>/5 箭</div>
        </div>
      </div>
      <div class="chip-sidebar" id="chipSidebar">
        <div class="chip-title" style="font-family:LiSu,STLiti,'隶书',serif">酒筹簿</div>
        <div class="chip-list" id="chipList"></div>
      </div>
      <div class="status-tip" id="statusTip">拖拽左侧箭矢开始投壶</div>

      <div class="riddle-modal" id="riddleModal">
        <div class="scroll-panel">
          <div class="scroll-top"></div>
          <div class="scroll-content">
            <div class="riddle-zone" id="riddleZone">入门</div>
            <div class="riddle-q" id="riddleQ" style="font-family:KaiTi,STKaiti,'楷体',serif"></div>
            <div class="riddle-opts">
              <div class="riddle-opt" data-i="0" style="font-family:KaiTi,STKaiti,'楷体',serif"></div>
              <div class="riddle-opt" data-i="1" style="font-family:KaiTi,STKaiti,'楷体',serif"></div>
              <div class="riddle-opt" data-i="2" style="font-family:KaiTi,STKaiti,'楷体',serif"></div>
            </div>
            <div class="riddle-feedback" id="riddleFeedback"></div>
          </div>
          <div class="scroll-bottom"></div>
        </div>
      </div>

      <div class="result-modal" id="resultModal">
        <div class="zheye-panel">
          <div class="zheye-title" style="font-family:'Ma Shan Zheng',serif">终局·折页册</div>
          <div class="zheye-body">
            <div class="zheye-left"><div class="zheye-col-title" style="font-family:LiSu,serif">回合实录</div><div id="resultLeft"></div></div>
            <div class="zheye-split"></div>
            <div class="zheye-right"><div class="zheye-col-title" style="font-family:LiSu,serif">积分酒筹</div>
              <div id="resultRight"></div>
              <div class="zheye-col-title" style="font-family:LiSu,serif;margin-top:18px">竹片酒筹</div>
              <div id="resultChips" class="result-chips"></div>
            </div>
          </div>
          <div class="poem-box" id="poemBox" style="font-family:FangSong,STFangsong,'仿宋',serif"></div>
          <div class="zheye-actions">
            <div class="seal-btn" id="playAgainBtn" style="font-family:LiSu,serif">再来一局</div>
            <div class="seal-btn" id="genPoemBtn" style="font-family:LiSu,serif">分享行酒令</div>
          </div>
        </div>
      </div>
    `;
    this.container.insertAdjacentHTML('beforeend', uiHTML);

    this.ui = {
      scoreEl: document.getElementById('scoreVal')!,
      chipEl: document.getElementById('chipVal')!,
      chipListEl: document.getElementById('chipList')!,
      riddleModal: document.getElementById('riddleModal')!,
      riddleQ: document.getElementById('riddleQ')!,
      riddleOpts: Array.from(document.querySelectorAll('.riddle-opt')) as HTMLElement[],
      resultModal: document.getElementById('resultModal')!,
      resultLeft: document.getElementById('resultLeft')!,
      resultRight: document.getElementById('resultRight')!,
      poemBox: document.getElementById('poemBox')!,
      statusEl: document.getElementById('statusTip')!
    };

    document.getElementById('resetBtn')!.addEventListener('click', () => this.reset());
    document.getElementById('playAgainBtn')!.addEventListener('click', () => {
      if (this.ui) this.ui.resultModal.classList.remove('show');
      this.reset();
    });
    document.getElementById('genPoemBtn')!.addEventListener('click', () => this.showPoem());

    this.ui.riddleOpts.forEach(el => {
      el.addEventListener('click', () => {
        if (!this.currentRiddle || this.state.phase !== 'answering') return;
        const idx = Number(el.dataset.i) as 0 | 1 | 2;
        this.answerRiddle(idx);
      });
    });

    document.getElementById('arrowIdx')!.textContent = '1';
  }

  public resize(): void {
    const isMobile = window.innerWidth < 768;
    const w = isMobile ? Math.min(window.innerWidth * 0.9, 620) : Math.min(window.innerWidth * 0.95, 1000);
    this.scale = w / LOGICAL_W;
    const cssW = LOGICAL_W * this.scale;
    const cssH = LOGICAL_H * this.scale;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    for (const c of [this.sceneCanvas, this.fxCanvas]) {
      c.style.width = cssW + 'px';
      c.style.height = cssH + 'px';
      c.width = Math.round(LOGICAL_W * this.dpr);
      c.height = Math.round(LOGICAL_H * this.dpr);
    }
    this.sceneCtx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    this.fxCtx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    this.sceneDirty = true;
  }

  private toLogical(clientX: number, clientY: number): { x: number; y: number } {
    const r = this.fxCanvas.getBoundingClientRect();
    return {
      x: (clientX - r.left) / this.scale,
      y: (clientY - r.top) / this.scale
    };
  }

  private bindEvents(): void {
    window.addEventListener('resize', () => this.resize());
    const c = this.fxCanvas;
    c.style.touchAction = 'none';
    c.addEventListener('pointerdown', e => this.onDown(e));
    c.addEventListener('pointermove', e => this.onMove(e));
    c.addEventListener('pointerup', e => this.onUp(e));
    c.addEventListener('pointercancel', () => this.onCancel());
    c.addEventListener('pointerleave', () => this.onCancel());
  }

  private onDown(e: PointerEvent): void {
    if (this.state.phase !== 'idle') return;
    const p = this.toLogical(e.clientX, e.clientY);
    const slotIdx = this.hitTestArrowSlot(p.x, p.y);
    if (slotIdx < 0 || this.slotClones[slotIdx].used) return;
    this.aiming.active = true;
    this.aiming.slotIndex = slotIdx;
    this.aiming.startX = this.slotClones[slotIdx].x;
    this.aiming.startY = this.slotClones[slotIdx].y;
    this.aiming.curX = p.x; this.aiming.curY = p.y;
    this.updateAimParams();
    (e.target as Element).setPointerCapture?.(e.pointerId);
    this.state.phase = 'aiming';
    if (this.ui) this.ui.statusEl.textContent = '拖拽调整角度与力度，松开发射';
  }

  private onMove(e: PointerEvent): void {
    if (!this.aiming.active) return;
    const p = this.toLogical(e.clientX, e.clientY);
    this.aiming.curX = p.x; this.aiming.curY = p.y;
    this.updateAimParams();
  }

  private onUp(e: PointerEvent): void {
    if (!this.aiming.active) return;
    const p = this.toLogical(e.clientX, e.clientY);
    this.aiming.curX = p.x; this.aiming.curY = p.y;
    this.updateAimParams();
    const slotIdx = this.aiming.slotIndex;
    const slot = this.slotClones[slotIdx];
    const params: LaunchParams = {
      angle: this.aiming.angle,
      power: this.aiming.power,
      startX: slot.x,
      startY: slot.y
    };
    const result = launchArrow(params);
    slot.used = true;
    this.aiming.active = false;
    this.flying = {
      result,
      startTime: performance.now(),
      duration: Math.max(0.5, Math.min(1.5, 0.55 + params.power * 0.0095)) * 1000,
      pos: { x: slot.x, y: slot.y },
      angleDeg: this.aiming.angle,
      done: false
    };
    this.state.phase = 'flying';
    this.currentRoundRecord = createEmptyRound(this.state.currentArrow + 1);
    if (this.ui) this.ui.statusEl.textContent = result.hit ? '箭矢投出…' : '箭矢投出…';
    (e.target as Element).releasePointerCapture?.(e.pointerId);
  }

  private onCancel(): void {
    if (this.aiming.active && this.state.phase === 'aiming') {
      this.aiming.active = false;
      this.state.phase = 'idle';
    }
  }

  private updateAimParams(): void {
    const dx = this.aiming.curX - this.aiming.startX;
    const dy = this.aiming.curY - this.aiming.startY;
    let ang = Math.atan2(-dy, -dx) * 180 / Math.PI;
    ang = Math.max(5, Math.min(88, ang));
    this.aiming.angle = ang;
    const dist = Math.sqrt(dx * dx + dy * dy);
    this.aiming.power = Math.max(5, Math.min(100, dist * 0.55));
  }

  private hitTestArrowSlot(x: number, y: number): number {
    const touchPad = window.innerWidth < 768 ? 22 : 16;
    for (let i = 0; i < this.slotClones.length; i++) {
      const s = this.slotClones[i];
      if (Math.abs(x - s.x) < 42 && Math.abs(y - s.y) < touchPad && !s.used) return i;
    }
    return -1;
  }

  private spawnDirtParticles(x: number, y: number): void {
    const count = 10 + Math.floor(Math.random() * 6);
    const colors = ['#C4A265', '#B8956A', '#A68050', '#D4B896'];
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: x + (Math.random() - 0.5) * 20,
        y: y - 2,
        vx: (Math.random() - 0.5) * 120,
        vy: -(60 + Math.random() * 100),
        size: 2 + Math.random() * 4,
        alpha: 1,
        life: 0.45 + Math.random() * 0.3,
        color: colors[Math.floor(Math.random() * colors.length)]
      });
    }
  }

  private spawnGoldIngots(): void {
    for (let i = 0; i < 6; i++) {
      this.goldIngots.push({
        x: 300 + Math.random() * 400,
        y: -30,
        vy: 120 + Math.random() * 120,
        rot: Math.random() * Math.PI,
        vrot: (Math.random() - 0.5) * 6,
        alpha: 1,
        life: 1.2
      });
    }
  }

  private updateParticles(dt: number): void {
    const g = 260;
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.vy += g * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      p.alpha = Math.max(0, p.life / 0.7);
      if (p.life <= 0) this.particles.splice(i, 1);
    }
    for (let i = this.goldIngots.length - 1; i >= 0; i--) {
      const g2 = this.goldIngots[i];
      g2.vy += 380 * dt;
      g2.y += g2.vy * dt;
      g2.rot += g2.vrot * dt;
      g2.life -= dt;
      g2.alpha = Math.max(0, Math.min(1, g2.life / 0.3));
      if (g2.life <= 0 || g2.y > 700) this.goldIngots.splice(i, 1);
    }
  }

  private updateAnts(dt: number): void {
    for (const a of this.ants) {
      a.x += a.vx * dt;
      if (a.x > 960) { a.vx = -Math.abs(a.vx); a.baseY = 540 + Math.random() * 30; }
      if (a.x < 640) { a.vx = Math.abs(a.vx); a.baseY = 540 + Math.random() * 30; }
      a.y = a.baseY + Math.sin(performance.now() * 0.006 + a.x * 0.03) * 1.5;
    }
  }

  private updateDecorCounts(): void {
    const leafTarget = Math.floor(this.state.totalScore / 50);
    if (leafTarget !== this.lastLeafCount) {
      this.lastLeafCount = leafTarget;
      this.sceneDirty = true;
    }
    const antTarget = Math.floor(this.state.chipCount / 3);
    if (antTarget * 2 !== this.lastAntPairs) {
      this.lastAntPairs = antTarget * 2;
      this.ants = [];
      for (let i = 0; i < antTarget * 2; i++) {
        this.ants.push({
          x: 700 + Math.random() * 200,
          y: 550 + Math.random() * 25,
          baseY: 550 + Math.random() * 25,
          vx: (Math.random() > 0.5 ? 1 : -1) * (30 + Math.random() * 40)
        });
      }
      this.sceneDirty = true;
    }
  }

  private advanceArrow(): void {
    this.state.currentArrow++;
    document.getElementById('arrowIdx')!.textContent = String(Math.min(5, this.state.currentArrow + 1));
    if (this.state.currentArrow >= 5) {
      this.state.phase = 'gameover';
      this.showGameOver();
    } else {
      this.state.phase = 'idle';
      if (this.ui) this.ui.statusEl.textContent = '继续拖拽下一支箭矢';
    }
  }

  private handleHit(): void {
    if (!this.flying) return;
    const res = this.flying.result;
    if (this.currentRoundRecord && res.zoneId !== null) {
      this.currentRoundRecord.zoneId = res.zoneId;
      this.currentRoundRecord.zoneName = res.zoneName;
    }
    this.hitGlow = { active: true, x: res.impactX, y: POT_CONFIG.centerY, t: 0 };
    this.shakeTimer = 0.3;
    setTimeout(() => this.openRiddlePanel(res.zoneId!), 320);
  }

  private openRiddlePanel(zoneId: 0 | 1 | 2): void {
    const riddle = drawRiddle(zoneId, this.state.usedRiddleIds);
    this.state.usedRiddleIds.add(riddle.id);
    this.currentRiddle = riddle;
    if (this.currentRoundRecord) {
      this.currentRoundRecord.riddle = riddle;
      this.currentRoundRecord.keyword = riddle.keyword;
    }
    if (!this.ui) return;
    document.getElementById('riddleZone')!.textContent =
      (zoneId === 0 ? '入门之题' : zoneId === 1 ? '登堂之题' : '入室之题');
    this.ui.riddleQ.textContent = riddle.question;
    this.ui.riddleOpts.forEach((el, i) => {
      el.innerHTML = `<span class="opt-tag">${String.fromCharCode(65 + i)}.</span>${riddle.options[i]}`;
      el.classList.remove('correct', 'wrong', 'disabled');
    });
    document.getElementById('riddleFeedback')!.textContent = '';
    document.getElementById('riddleFeedback')!.className = 'riddle-feedback';
    this.ui.riddleModal.classList.add('show');
    this.state.phase = 'answering';
  }

  private answerRiddle(choice: 0 | 1 | 2): void {
    if (!this.currentRiddle || !this.currentRoundRecord || !this.ui) return;
    const correct = choice === this.currentRiddle.answerIndex;
    this.ui.riddleOpts.forEach((el, i) => {
      el.classList.add('disabled');
      if (i === this.currentRiddle!.answerIndex) el.classList.add('correct');
      if (i === choice && !correct) el.classList.add('wrong');
    });
    const fb = document.getElementById('riddleFeedback')!;
    if (correct) {
      const score = getZoneScore(this.currentRiddle.difficulty === 'easy' ? 0 : this.currentRiddle.difficulty === 'medium' ? 1 : 2);
      this.state.totalScore += score;
      this.state.chipCount++;
      this.currentRoundRecord.answeredCorrect = true;
      this.currentRoundRecord.scoreEarned = score;
      this.spawnGoldIngots();
      fb.className = 'riddle-feedback ok';
      fb.innerHTML = `🎉 答对！ ＋${score}分，获得酒筹「${this.currentRiddle.keyword}」`;
      this.addChip(this.currentRiddle.keyword);
    } else {
      this.currentRoundRecord.answeredCorrect = false;
      fb.className = 'riddle-feedback no';
      fb.innerHTML = `💧 答错了！正确答案：${String.fromCharCode(65 + this.currentRiddle.answerIndex)}. ${getRiddleAnswerText(this.currentRiddle)}`;
      this.inkSplash = { active: true, x: 500, y: 260, t: 0 };
    }
    this.updateHUD();
    this.state.roundHistory.push(this.currentRoundRecord);
    setTimeout(() => {
      if (this.ui) this.ui.riddleModal.classList.remove('show');
      this.currentRiddle = null;
      this.advanceArrow();
    }, correct ? 1600 : 2200);
  }

  private updateHUD(): void {
    if (!this.ui) return;
    this.ui.scoreEl.textContent = String(this.state.totalScore);
    this.ui.chipEl.textContent = String(this.state.chipCount);
    this.updateDecorCounts();
  }

  private addChip(keyword: string): void {
    if (!this.ui) return;
    const chip = document.createElement('div');
    chip.className = 'chip-item';
    chip.style.fontFamily = "FangSong,STFangsong,'仿宋',serif";
    chip.textContent = keyword;
    this.ui.chipListEl.appendChild(chip);
  }

  private showGameOver(): void {
    if (!this.ui) return;
    const history = this.state.roundHistory;
    for (let i = history.length; i < 5; i++) {
      history.push(createEmptyRound(i + 1));
    }
    this.ui.resultLeft.innerHTML = history.map(r => `
      <div class="round-row ${r.answeredCorrect === null ? 'miss' : r.answeredCorrect ? 'right' : 'wrong'}">
        <span class="r-round">第${r.round}箭</span>
        <span class="r-zone">${r.zoneName}</span>
        <span class="r-riddle">${r.riddle ? r.riddle.question.slice(0, 10) + '…' : '—'}</span>
        <span class="r-status">${r.answeredCorrect === null ? '未中' : r.answeredCorrect ? '✓对' : '✗错'}</span>
        <span class="r-score">${r.scoreEarned ? '+' + r.scoreEarned : '0'}</span>
      </div>
    `).join('');
    this.ui.resultRight.innerHTML = `
      <div class="sum-line">总积分：<strong>${this.state.totalScore}</strong></div>
      <div class="sum-line">酒筹数：<strong>${this.state.chipCount}</strong></div>
      <div class="sum-line">命中率：<strong>${Math.round(this.state.roundHistory.filter(r => r.riddle).length / 5 * 100)}%</strong></div>
      <div class="sum-line">答对率：<strong>${this.state.roundHistory.filter(r => r.riddle).length ? Math.round(this.state.roundHistory.filter(r => r.answeredCorrect).length / this.state.roundHistory.filter(r => r.riddle).length * 100) : 0}%</strong></div>
    `;
    const chipsBox = document.getElementById('resultChips') as HTMLElement;
    const chips = this.state.roundHistory.filter(r => r.answeredCorrect).map(r => r.keyword);
    chipsBox.innerHTML = chips.length
      ? chips.map(k => `<div class="big-chip" style="font-family:FangSong,STFangsong,'仿宋',serif">${k}</div>`).join('')
      : '<div class="empty-chips">此局未得酒筹</div>';
    this.ui.poemBox.textContent = '点击「分享行酒令」生成四言酒令';
    this.ui.resultModal.classList.add('show');
  }

  private showPoem(): void {
    if (!this.ui) return;
    const poem = generateDrinkingPoem(this.state.roundHistory);
    this.ui.poemBox.textContent = poem;
  }

  public reset(): void {
    this.state = {
      phase: 'idle',
      currentArrow: 0,
      totalScore: 0,
      chipCount: 0,
      roundHistory: [],
      usedRiddleIds: new Set()
    };
    this.slotClones = JSON.parse(JSON.stringify(ARROW_SLOTS));
    this.particles = [];
    this.goldIngots = [];
    this.ants = [];
    this.lastLeafCount = 0;
    this.lastAntPairs = 0;
    this.currentRiddle = null;
    this.currentRoundRecord = null;
    this.flying = null;
    this.aiming.active = false;
    if (this.ui) {
      this.ui.chipListEl.innerHTML = '';
      this.ui.resultModal.classList.remove('show');
      this.ui.riddleModal.classList.remove('show');
      this.ui.statusEl.textContent = '拖拽左侧箭矢开始投壶';
    }
    document.getElementById('arrowIdx')!.textContent = '1';
    this.updateHUD();
    this.sceneDirty = true;
  }

  // ============== RENDERING ==============

  private renderScene(): void {
    const c = this.sceneCtx;
    c.clearRect(0, 0, LOGICAL_W, LOGICAL_H);
    this.drawWall(c);
    this.drawGround(c);
    this.drawTree(c);
    this.drawPot(c);
    this.drawRack(c);
    this.drawArrowsOnRack(c);
    this.drawStaticDecor(c);
    this.sceneDirty = false;
  }

  private drawWall(c: CanvasRenderingContext2D): void {
    c.fillStyle = '#3A3F32';
    c.fillRect(0, 0, LOGICAL_W, 470);
    c.strokeStyle = 'rgba(0,0,0,0.25)';
    c.lineWidth = 1;
    for (let y = 0; y < 470; y += 28) {
      for (let x = (y / 28 % 2) * 35; x < LOGICAL_W; x += 70) {
        c.strokeRect(x + 0.5, y + 0.5, 68, 26);
      }
    }
    const g = c.createLinearGradient(0, 0, 0, 470);
    g.addColorStop(0, 'rgba(0,0,0,0.35)');
    g.addColorStop(0.5, 'rgba(0,0,0,0.05)');
    g.addColorStop(1, 'rgba(0,0,0,0.2)');
    c.fillStyle = g;
    c.fillRect(0, 0, LOGICAL_W, 470);
  }

  private drawGround(c: CanvasRenderingContext2D): void {
    c.fillStyle = '#7A7A6E';
    c.fillRect(0, 470, LOGICAL_W, 130);
    c.strokeStyle = 'rgba(0,0,0,0.2)';
    c.lineWidth = 1;
    for (let y = 470; y < 590; y += 26) {
      const off = ((y - 470) / 26 % 2) * 40;
      for (let x = off; x < LOGICAL_W; x += 80) {
        c.strokeRect(x + 0.5, y + 0.5, 78, 24);
      }
    }
    const g = c.createLinearGradient(0, 470, 0, 600);
    g.addColorStop(0, 'rgba(255,255,255,0.06)');
    g.addColorStop(1, 'rgba(0,0,0,0.25)');
    c.fillStyle = g;
    c.fillRect(0, 470, LOGICAL_W, 130);
  }

  private drawTree(c: CanvasRenderingContext2D): void {
    // 树干
    c.save();
    const trunkX = 850, trunkBaseY = 580;
    c.fillStyle = '#4A3624';
    c.beginPath();
    c.moveTo(trunkX - 22, trunkBaseY);
    c.lineTo(trunkX - 16, 380);
    c.quadraticCurveTo(trunkX - 12, 360, trunkX - 6, 340);
    c.lineTo(trunkX + 16, 340);
    c.quadraticCurveTo(trunkX + 22, 360, trunkX + 20, 380);
    c.lineTo(trunkX + 24, trunkBaseY);
    c.closePath();
    c.fill();
    // 纹理
    c.strokeStyle = 'rgba(30,20,10,0.5)';
    c.lineWidth = 1.5;
    for (let i = 0; i < 6; i++) {
      c.beginPath();
      const ty = 360 + i * 35;
      c.moveTo(trunkX - 15, ty);
      c.bezierCurveTo(trunkX - 5, ty + 10, trunkX + 10, ty - 8, trunkX + 18, ty + 12);
      c.stroke();
    }
    // 树根
    c.fillStyle = '#3A2A18';
    for (let i = 0; i < 4; i++) {
      c.beginPath();
      const rx = trunkX - 30 + i * 20;
      c.moveTo(rx, trunkBaseY);
      c.quadraticCurveTo(rx - 10, trunkBaseY + 10, rx - 18 + i * 3, trunkBaseY + 18);
      c.lineTo(rx + 8, trunkBaseY + 18);
      c.quadraticCurveTo(rx + 4, trunkBaseY + 8, rx + 14, trunkBaseY);
      c.fill();
    }
    // 树冠
    const leafCount = this.lastLeafCount;
    const crowns = [
      { x: 830, y: 250, r: 90 },
      { x: 900, y: 220, r: 80 },
      { x: 780, y: 300, r: 70 },
      { x: 870, y: 310, r: 65 },
      { x: 950, y: 290, r: 60 }
    ];
    crowns.forEach((cr, idx) => {
      const g = c.createRadialGradient(cr.x - 10, cr.y - 10, 4, cr.x, cr.y, cr.r);
      g.addColorStop(0, '#7FA838');
      g.addColorStop(1, '#4F6B20');
      c.fillStyle = g;
      c.beginPath();
      c.arc(cr.x, cr.y, cr.r, 0, Math.PI * 2);
      c.fill();
      // 金叶
      const goldForCrown = Math.ceil(leafCount / crowns.length);
      for (let k = 0; k < goldForCrown && idx * goldForCrown + k < leafCount; k++) {
        const seed = (idx * 137 + k * 239) % 1000;
        const ang = (seed / 1000) * Math.PI * 2;
        const rad = (seed % 600) / 700 * (cr.r * 0.85);
        const lx = cr.x + Math.cos(ang) * rad;
        const ly = cr.y + Math.sin(ang) * rad;
        this.drawGinkgoLeaf(c, lx, ly, 1 + (seed % 4) * 0.2, (seed % 100) / 100 * Math.PI);
      }
    });
    c.restore();
  }

  private drawGinkgoLeaf(c: CanvasRenderingContext2D, x: number, y: number, s: number, rot: number): void {
    c.save();
    c.translate(x, y);
    c.rotate(rot);
    c.scale(s, s);
    const t = performance.now() * 0.001;
    const shimmer = 0.85 + Math.sin(t * 2 + x * 0.1) * 0.15;
    const grad = c.createRadialGradient(-2, -2, 1, 0, 0, 12);
    grad.addColorStop(0, `rgba(255,236,140,${shimmer})`);
    grad.addColorStop(0.6, `rgba(255,215,0,${shimmer})`);
    grad.addColorStop(1, 'rgba(218,165,32,0.9)');
    c.fillStyle = grad;
    c.beginPath();
    c.moveTo(0, 8);
    c.quadraticCurveTo(-10, 6, -12, -4);
    c.quadraticCurveTo(-8, -10, 0, -8);
    c.quadraticCurveTo(8, -10, 12, -4);
    c.quadraticCurveTo(10, 6, 0, 8);
    c.closePath();
    c.fill();
    c.strokeStyle = 'rgba(160,110,20,0.6)';
    c.lineWidth = 0.6;
    c.beginPath();
    c.moveTo(0, 8); c.lineTo(0, -8);
    c.stroke();
    c.restore();
  }

  private drawPot(c: CanvasRenderingContext2D): void {
    const cx = POT_CONFIG.centerX, cy = POT_CONFIG.centerY;
    const r = POT_CONFIG.radius;
    const bodyTop = cy + 6;
    const bodyBottom = 530;
    // 阴影
    c.fillStyle = 'rgba(0,0,0,0.35)';
    c.beginPath();
    c.ellipse(cx, 548, r + 16, 12, 0, 0, Math.PI * 2);
    c.fill();
    // 壶身
    const bodyGrad = c.createLinearGradient(cx - r, bodyTop, cx + r, bodyBottom);
    bodyGrad.addColorStop(0, '#2E8B57');
    bodyGrad.addColorStop(0.35, '#3CB371');
    bodyGrad.addColorStop(0.7, '#2E8B57');
    bodyGrad.addColorStop(1, '#1F5F3B');
    c.fillStyle = bodyGrad;
    c.beginPath();
    c.moveTo(cx - r + 5, bodyTop);
    c.lineTo(cx - r - 5, bodyBottom - 25);
    c.quadraticCurveTo(cx - r - 8, bodyBottom - 12, cx - r + 12, bodyBottom);
    c.lineTo(cx + r - 12, bodyBottom);
    c.quadraticCurveTo(cx + r + 8, bodyBottom - 12, cx + r + 5, bodyBottom - 25);
    c.lineTo(cx + r - 5, bodyTop);
    c.closePath();
    c.fill();
    // 蟠虺纹
    c.strokeStyle = 'rgba(15,60,35,0.55)';
    c.lineWidth = 1.4;
    for (let i = 0; i < 3; i++) {
      const bandY = bodyTop + 55 + i * 55;
      c.beginPath();
      for (let x = cx - r - 2; x < cx + r + 2; x += 18) {
        c.moveTo(x, bandY);
        c.quadraticCurveTo(x + 9, bandY - 8, x + 18, bandY);
        c.quadraticCurveTo(x + 9, bandY + 8, x, bandY);
      }
      c.stroke();
    }
    // 壶口沿
    const rimGrad = c.createLinearGradient(cx - r - 6, cy - 6, cx + r + 6, cy + 6);
    rimGrad.addColorStop(0, '#1F5F3B');
    rimGrad.addColorStop(0.5, '#4FC384');
    rimGrad.addColorStop(1, '#1F5F3B');
    c.fillStyle = rimGrad;
    c.beginPath();
    c.ellipse(cx, cy, r + 8, 14, 0, 0, Math.PI * 2);
    c.fill();
    // 壶口内部（三环形区域）
    const innerGrad = c.createRadialGradient(cx, cy + 10, 2, cx, cy + 20, r);
    innerGrad.addColorStop(0, '#0D2818');
    innerGrad.addColorStop(1, '#1A3C28');
    c.fillStyle = innerGrad;
    c.beginPath();
    c.ellipse(cx, cy + 5, r, 9, 0, 0, Math.PI * 2);
    c.fill();
    // 三环形区域标识
    const zones = [
      { rRatio: 0.95, color: 'rgba(255,230,140,0.35)', label: '入门' },
      { rRatio: 0.65, color: 'rgba(255,180,100,0.4)', label: '登堂' },
      { rRatio: 0.35, color: 'rgba(255,120,80,0.45)', label: '入室' }
    ];
    zones.forEach((z, i) => {
      c.strokeStyle = z.color;
      c.lineWidth = 1.3;
      c.beginPath();
      c.ellipse(cx, cy + 5, r * z.rRatio, 8 * z.rRatio, 0, 0, Math.PI * 2);
      c.stroke();
      if (i === 0 || i === 2) {
        c.fillStyle = 'rgba(255,255,255,0.75)';
        c.font = "12px KaiTi,STKaiti,'楷体',serif";
        c.textAlign = 'center';
        c.fillText(z.label, cx, cy + (i === 0 ? -12 : 14));
      }
    });
    c.fillStyle = 'rgba(255,255,255,0.75)';
    c.font = "12px KaiTi,STKaiti,'楷体',serif";
    c.textAlign = 'center';
    c.fillText('登堂', cx - r * 0.55, cy + 4);
    // 高光
    c.fillStyle = 'rgba(255,255,255,0.22)';
    c.beginPath();
    c.ellipse(cx - r * 0.4, bodyTop + 80, 8, 55, -0.25, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = 'rgba(255,255,255,0.1)';
    c.beginPath();
    c.ellipse(cx + r * 0.35, bodyTop + 110, 4, 40, 0.2, 0, Math.PI * 2);
    c.fill();
  }

  private drawRack(c: CanvasRenderingContext2D): void {
    const baseX = 60, baseY = 560;
    c.fillStyle = 'rgba(0,0,0,0.25)';
    c.beginPath();
    c.ellipse(baseX + 60, baseY + 15, 68, 8, 0, 0, Math.PI * 2);
    c.fill();
    // 底座
    c.fillStyle = '#6B4423';
    c.fillRect(baseX - 5, baseY, 130, 18);
    c.fillStyle = '#8B5A2B';
    c.fillRect(baseX, baseY + 2, 120, 12);
    // 立柱
    c.fillStyle = '#6B4423';
    c.fillRect(baseX + 10, baseY - 230, 14, 230);
    c.fillRect(baseX + 96, baseY - 230, 14, 230);
    // 横梁
    const beamGrad = c.createLinearGradient(0, baseY - 240, 0, baseY - 220);
    beamGrad.addColorStop(0, '#A67045');
    beamGrad.addColorStop(0.5, '#8B5A2B');
    beamGrad.addColorStop(1, '#6B4423');
    c.fillStyle = beamGrad;
    c.fillRect(baseX + 4, baseY - 242, 112, 16);
    c.fillRect(baseX + 4, baseY - 180, 112, 10);
    c.fillRect(baseX + 4, baseY - 120, 112, 10);
    // 横梁装饰端头
    c.fillStyle = '#5C3A1C';
    c.beginPath();
    c.arc(baseX + 10, baseY - 234, 10, 0, Math.PI * 2);
    c.arc(baseX + 110, baseY - 234, 10, 0, Math.PI * 2);
    c.fill();
    // 木纹
    c.strokeStyle = 'rgba(40,20,10,0.35)';
    c.lineWidth = 1;
    c.beginPath();
    c.moveTo(baseX + 12, baseY - 230);
    c.lineTo(baseX + 14, baseY);
    c.moveTo(baseX + 100, baseY - 230);
    c.lineTo(baseX + 102, baseY);
    c.stroke();
  }

  private drawArrowsOnRack(c: CanvasRenderingContext2D): void {
    for (let i = 0; i < this.slotClones.length; i++) {
      if (this.slotClones[i].used) continue;
      const isAiming = this.aiming.active && this.aiming.slotIndex === i;
      if (isAiming) continue;
      this.drawArrow(c, this.slotClones[i].x, this.slotClones[i].y, 95, 0.95);
    }
  }

  private drawArrow(c: CanvasRenderingContext2D, x: number, y: number, angleDeg: number, alpha = 1): void {
    c.save();
    c.globalAlpha = alpha;
    c.translate(x, y);
    c.rotate((angleDeg * Math.PI) / 180);
    // 箭杆
    const shaftGrad = c.createLinearGradient(0, -3, 0, 3);
    shaftGrad.addColorStop(0, '#8FB868');
    shaftGrad.addColorStop(0.5, '#7B9C5E');
    shaftGrad.addColorStop(1, '#5F7C48');
    c.fillStyle = shaftGrad;
    c.fillRect(-52, -2, 88, 4);
    // 竹节
    c.strokeStyle = 'rgba(40,60,20,0.45)';
    c.lineWidth = 0.8;
    for (let i = -40; i < 30; i += 15) {
      c.beginPath();
      c.moveTo(i, -2); c.lineTo(i, 2); c.stroke();
    }
    // 箭头
    c.fillStyle = '#333';
    c.beginPath();
    c.moveTo(52, 0);
    c.lineTo(36, -7);
    c.lineTo(36, 7);
    c.closePath();
    c.fill();
    // 箭羽
    c.fillStyle = '#F5F5DC';
    c.beginPath();
    c.moveTo(-52, 0);
    c.lineTo(-68, -10);
    c.lineTo(-58, 0);
    c.lineTo(-68, 10);
    c.closePath();
    c.fill();
    c.fillStyle = '#E8E0B8';
    c.beginPath();
    c.moveTo(-52, 0); c.lineTo(-62, -5); c.lineTo(-56, 0); c.lineTo(-62, 5);
    c.closePath();
    c.fill();
    // 绑线
    c.strokeStyle = '#8B2500';
    c.lineWidth = 1.2;
    c.beginPath();
    c.moveTo(-50, -4); c.lineTo(-50, 4);
    c.moveTo(-46, -4); c.lineTo(-46, 4);
    c.stroke();
    c.restore();
  }

  private drawStaticDecor(c: CanvasRenderingContext2D): void {
    // 蚂蚁
    for (const a of this.ants) {
      c.fillStyle = '#111';
      c.beginPath();
      c.arc(a.x - 3, a.y, 2.2, 0, Math.PI * 2);
      c.arc(a.x + 1, a.y, 2.6, 0, Math.PI * 2);
      c.arc(a.x + 5, a.y, 3, 0, Math.PI * 2);
      c.fill();
    }
  }

  // ====== FX / Dynamic rendering ======

  private renderFx(dt: number): void {
    const c = this.fxCtx;
    c.clearRect(0, 0, LOGICAL_W, LOGICAL_H);
    // 蚂蚁需在fx层更新绘制以便移动
    for (const a of this.ants) {
      c.fillStyle = '#111';
      c.beginPath();
      c.arc(a.x - 3, a.y, 2.2, 0, Math.PI * 2);
      c.arc(a.x + 1, a.y, 2.6, 0, Math.PI * 2);
      c.arc(a.x + 5, a.y, 3, 0, Math.PI * 2);
      c.fill();
    }
    if (this.aiming.active) this.drawAimingGuide(c);
    if (this.flying) this.drawFlyingArrow(c);
    // 命中光晕
    if (this.hitGlow.active) {
      this.hitGlow.t += dt;
      const t = Math.min(1, this.hitGlow.t / 0.6);
      const g = c.createRadialGradient(this.hitGlow.x, POT_CONFIG.centerY + 10, 4, this.hitGlow.x, POT_CONFIG.centerY + 10, 80 * (0.5 + t));
      g.addColorStop(0, `rgba(140,255,170,${0.7 * (1 - t)})`);
      g.addColorStop(1, 'rgba(60,220,130,0)');
      c.fillStyle = g;
      c.beginPath();
      c.arc(this.hitGlow.x, POT_CONFIG.centerY + 10, 80 * (0.5 + t), 0, Math.PI * 2);
      c.fill();
      if (t >= 1) this.hitGlow.active = false;
    }
    this.drawParticles(c);
    this.drawGoldIngots(c);
    if (this.inkSplash.active) {
      this.inkSplash.t += dt;
      const t = Math.min(1, this.inkSplash.t / 0.9);
      this.drawInkSplash(c, this.inkSplash.x, this.inkSplash.y - 60, t);
      if (t >= 1) this.inkSplash.active = false;
    }
  }

  private drawAimingGuide(c: CanvasRenderingContext2D): void {
    const slot = this.slotClones[this.aiming.slotIndex];
    // 反方向（因为拖拽方向与投射方向相反，类似弹弓）
    const dx = this.aiming.startX - this.aiming.curX;
    const dy = this.aiming.startY - this.aiming.curY;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    const ang = this.aiming.angle;
    const rad = (ang * Math.PI) / 180;
    const lineLen = 60 + this.aiming.power * 0.6;
    const ex = slot.x + Math.cos(rad) * lineLen;
    const ey = slot.y - Math.sin(rad) * lineLen;
    // 虚线
    c.save();
    c.strokeStyle = 'rgba(170,180,190,0.65)';
    c.setLineDash([6, 6]);
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(slot.x, slot.y);
    c.lineTo(ex, ey);
    c.stroke();
    c.setLineDash([]);
    // 箭头
    c.fillStyle = 'rgba(170,180,190,0.75)';
    c.beginPath();
    const aRad = Math.atan2(ey - slot.y, ex - slot.x);
    c.moveTo(ex, ey);
    c.lineTo(ex - Math.cos(aRad - 0.4) * 12, ey - Math.sin(aRad - 0.4) * 12);
    c.lineTo(ex - Math.cos(aRad + 0.4) * 12, ey - Math.sin(aRad + 0.4) * 12);
    c.closePath();
    c.fill();
    c.restore();
    // 角度/力度标签
    c.save();
    c.fillStyle = 'rgba(255,255,240,0.92)';
    c.fillRect(slot.x + 30, slot.y - 30, 110, 36);
    c.strokeStyle = '#8B5A2B';
    c.lineWidth = 1.5;
    c.strokeRect(slot.x + 30, slot.y - 30, 110, 36);
    c.fillStyle = '#3A2A18';
    c.font = "13px KaiTi,STKaiti,'楷体',serif";
    c.textAlign = 'left';
    c.fillText(`角度 ${ang.toFixed(0)}°`, slot.x + 36, slot.y - 14);
    c.fillText(`力度 ${this.aiming.power.toFixed(0)}`, slot.x + 36, slot.y - 0);
    c.restore();
    // 待发射箭
    this.drawArrow(c, slot.x, slot.y, ang, 1);
    // 轨迹预览
    const preview = launchArrow({ angle: ang, power: this.aiming.power, startX: slot.x, startY: slot.y }).trajectory;
    c.save();
    c.strokeStyle = 'rgba(220,230,210,0.25)';
    c.setLineDash([3, 5]);
    c.lineWidth = 1.2;
    c.beginPath();
    preview.forEach((p, i) => { if (i === 0) c.moveTo(p.x, p.y); else c.lineTo(p.x, p.y); });
    c.stroke();
    c.restore();
  }

  private drawFlyingArrow(c: CanvasRenderingContext2D): void {
    if (!this.flying) return;
    const now = performance.now();
    const prog = Math.max(0, Math.min(1, (now - this.flying.startTime) / this.flying.duration));
    const ease = prog < 0.5 ? 2 * prog * prog : 1 - Math.pow(-2 * prog + 2, 2) / 2;
    const { pos, angleDeg } = getArrowPosition(this.flying.result.trajectory, ease);
    this.flying.pos = pos;
    this.flying.angleDeg = angleDeg;
    let renderAngle = angleDeg;
    let shake = 0;
    if (prog >= 1) {
      if (!this.flying.done) {
        this.flying.done = true;
        this.onFlightComplete();
      }
      if (this.flying.result.hit) {
        renderAngle = angleDeg;
        if (this.shakeTimer > 0) {
          shake = Math.sin(performance.now() * 0.06) * 4 * (this.shakeTimer / 0.3);
        }
      }
    }
    this.drawArrow(c, pos.x, pos.y, renderAngle + shake, 1);
    // 飞行轨迹尾迹
    if (prog < 1) {
      c.save();
      c.strokeStyle = 'rgba(245,245,220,0.3)';
      c.lineWidth = 1.5;
      c.beginPath();
      const trailStart = Math.max(0, Math.floor((ease - 0.12) * (this.flying.result.trajectory.length - 1)));
      const trailEnd = Math.floor(ease * (this.flying.result.trajectory.length - 1));
      for (let i = trailStart; i <= trailEnd; i++) {
        const t = this.flying.result.trajectory[i];
        if (i === trailStart) c.moveTo(t.x, t.y); else c.lineTo(t.x, t.y);
      }
      c.stroke();
      c.restore();
    }
  }

  private onFlightComplete(): void {
    if (!this.flying) return;
    const res = this.flying.result;
    if (res.hit) {
      this.handleHit();
    } else {
      this.spawnDirtParticles(res.impactX, res.impactY);
      if (this.currentRoundRecord) this.state.roundHistory.push(this.currentRoundRecord);
      setTimeout(() => this.advanceArrow(), 900);
    }
  }

  private drawParticles(c: CanvasRenderingContext2D): void {
    for (const p of this.particles) {
      c.globalAlpha = p.alpha;
      c.fillStyle = p.color;
      c.beginPath();
      c.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      c.fill();
    }
    c.globalAlpha = 1;
  }

  private drawGoldIngots(c: CanvasRenderingContext2D): void {
    for (const g of this.goldIngots) {
      c.save();
      c.globalAlpha = g.alpha;
      c.translate(g.x, g.y);
      c.rotate(g.rot);
      // 元宝
      const grad = c.createLinearGradient(-16, -10, 16, 14);
      grad.addColorStop(0, '#FFEE90');
      grad.addColorStop(0.5, '#FFD700');
      grad.addColorStop(1, '#B8860B');
      c.fillStyle = grad;
      c.beginPath();
      c.moveTo(-22, 0);
      c.quadraticCurveTo(-22, -10, -10, -10);
      c.quadraticCurveTo(0, -14, 10, -10);
      c.quadraticCurveTo(22, -10, 22, 0);
      c.quadraticCurveTo(22, 12, 0, 14);
      c.quadraticCurveTo(-22, 12, -22, 0);
      c.closePath();
      c.fill();
      c.strokeStyle = 'rgba(120,75,0,0.7)';
      c.lineWidth = 1.2;
      c.stroke();
      c.fillStyle = 'rgba(255,255,255,0.6)';
      c.beginPath();
      c.ellipse(-5, -5, 6, 2, -0.3, 0, Math.PI * 2);
      c.fill();
      c.restore();
    }
    c.globalAlpha = 1;
  }

  private drawInkSplash(c: CanvasRenderingContext2D, cx: number, cy: number, t: number): void {
    c.save();
    const alpha = t < 0.8 ? 1 : (1 - t) / 0.2;
    c.globalAlpha = Math.max(0, alpha);
    c.fillStyle = '#1A1A1A';
    // 中心溅落
    c.beginPath();
    c.arc(cx, cy, 18 + t * 18, 0, Math.PI * 2);
    c.fill();
    // 飞溅
    for (let i = 0; i < 12; i++) {
      const ang = (i / 12) * Math.PI * 2 + 17;
      const d = (30 + t * 60) * (0.7 + Math.sin(i * 2.3) * 0.3);
      const sz = 2 + (i % 3) * 2 + t * 2;
      c.beginPath();
      c.arc(cx + Math.cos(ang) * d, cy + Math.sin(ang) * d, sz, 0, Math.PI * 2);
      c.fill();
    }
    c.restore();
  }

  // ====== MAIN LOOP ======

  private loop(): void {
    const now = performance.now();
    let dt = (now - this.lastTime) / 1000;
    if (dt > 0.05) dt = 0.05;
    this.lastTime = now;

    if (this.shakeTimer > 0) this.shakeTimer -= dt;

    this.updateParticles(dt);
    this.updateAnts(dt);

    if (this.sceneDirty) this.renderScene();
    else {
      // 金叶闪烁需要重绘
      if (this.lastLeafCount > 0) this.renderScene();
    }
    this.renderFx(dt);

    this.rafId = requestAnimationFrame(() => this.loop());
  }

  public destroy(): void {
    cancelAnimationFrame(this.rafId);
  }
}

// Bootstrap
window.addEventListener('DOMContentLoaded', () => {
  const host = document.getElementById('game-root');
  if (host) new Game(host);
});
