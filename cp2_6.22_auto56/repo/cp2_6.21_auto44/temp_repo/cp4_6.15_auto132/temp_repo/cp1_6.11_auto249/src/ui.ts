import { Game, IncensePill, LedgerRecord } from './game';
import {
  getSpiceById,
  GRINDING_BOWL_RADIUS,
  GRINDING_CENTER_X,
  GRINDING_CENTER_Y,
  PARTICLE_COUNT,
  PARTICLE_SPREAD_RADIUS,
  PARTICLE_DURATION
} from './data';

interface FlyPowderParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  alpha: number;
  life: number;
  maxLife: number;
}

interface ScentParticle {
  x: number;
  y: number;
  baseX: number;
  baseY: number;
  vx: number;
  vy: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
  size: number;
  angle: number;
  radius: number;
  angularSpeed: number;
  phase: 'rise' | 'spread' | 'sink';
  phaseTime: number;
}

interface DragState {
  isDragging: boolean;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  offsetX: number;
  offsetY: number;
  targetId: string | null;
  targetType: 'spice' | 'pill' | null;
  cloneEl: HTMLElement | null;
}

export class UIRenderer {
  private game: Game;
  private els: Record<string, HTMLElement> = {};
  private canvases: Record<string, HTMLCanvasElement> = {};
  private ctxs: Record<string, CanvasRenderingContext2D> = {};

  private dragState: DragState = {
    isDragging: false,
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
    offsetX: 0,
    offsetY: 0,
    targetId: null,
    targetType: null,
    cloneEl: null
  };

  private grinderAngle = 0;
  private grinderPosition = { x: GRINDING_CENTER_X, y: GRINDING_CENTER_Y };
  private lastGrinderPosition = { x: GRINDING_CENTER_X, y: GRINDING_CENTER_Y };
  private isGrinding = false;
  private lastGrindTime = 0;

  private flyPowderParticles: FlyPowderParticle[] = [];
  private scentParticles: ScentParticle[] = [];
  private animationFrameId: number | null = null;
  private lastFrameTime = 0;

  private audioCtx: AudioContext | null = null;

  private floatingLabel: HTMLDivElement;

  constructor(game: Game) {
    this.game = game;
    this.floatingLabel = document.createElement('div');
    this.floatingLabel.className = 'floating-label';
    document.body.appendChild(this.floatingLabel);
  }

  init(): void {
    this.cacheElements();
    this.initCanvases();
    this.bindEvents();
    this.startRenderLoop();
    this.drawStaticScenes();
  }

  private cacheElements(): void {
    const ids = [
      'spice-list',
      'selected-spices',
      'blend-btn',
      'clear-btn',
      'pill-container',
      'ledger-records',
      'fineness-value',
      'work-area',
      'censer-container',
      'censer-area'
    ];
    ids.forEach(id => {
      const el = document.getElementById(id);
      if (el) this.els[id] = el;
    });
  }

  private initCanvases(): void {
    const bowlCanvas = document.getElementById('bowl-canvas') as HTMLCanvasElement;
    const censerCanvas = document.getElementById('censer-canvas') as HTMLCanvasElement;
    const particleCanvas = document.getElementById('particle-canvas') as HTMLCanvasElement;

    if (bowlCanvas) {
      this.canvases.bowl = bowlCanvas;
      this.ctxs.bowl = bowlCanvas.getContext('2d')!;
    }
    if (censerCanvas) {
      this.canvases.censer = censerCanvas;
      this.ctxs.censer = censerCanvas.getContext('2d')!;
    }
    if (particleCanvas) {
      this.canvases.particle = particleCanvas;
      this.ctxs.particle = particleCanvas.getContext('2d')!;
    }
  }

  private bindEvents(): void {
    const blendBtn = this.els['blend-btn'];
    const clearBtn = this.els['clear-btn'];

    if (blendBtn) {
      blendBtn.addEventListener('click', () => this.handleBlend());
    }
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        this.playSound(220, 0.05, 'sine');
        this.game.clearWorkArea();
      });
    }

    document.addEventListener('mousemove', (e) => this.onMouseMove(e));
    document.addEventListener('mouseup', (e) => this.onMouseUp(e));
    document.addEventListener('touchmove', (e) => this.onTouchMove(e), { passive: false });
    document.addEventListener('touchend', (e) => this.onTouchEnd(e));
    window.addEventListener('resize', () => this.drawStaticScenes());
  }

  render(): void {
    const state = this.game.getState();
    this.renderSpiceRack();
    this.renderSelectedSpices();
    this.renderFineness();
    this.renderPills();
    this.renderLedger();
    this.updateButtons();
    this.drawBowlContent();
  }

  private renderSpiceRack(): void {
    const container = this.els['spice-list'];
    if (!container) return;

    const selectedIds = new Set(this.game.getState().selectedSpices.map(s => s.spiceId));
    const spices = this.game.getAllSpices();

    if (container.children.length === spices.length) {
      spices.forEach(spice => {
        const el = container.querySelector(`[data-spice-id="${spice.id}"]`) as HTMLElement;
        if (el) {
          el.style.opacity = selectedIds.has(spice.id) ? '0.4' : '1';
          el.style.pointerEvents = selectedIds.has(spice.id) ? 'none' : 'auto';
        }
      });
      return;
    }

    container.innerHTML = '';
    spices.forEach(spice => {
      const jar = document.createElement('div');
      jar.className = 'spice-jar';
      jar.dataset.spice = spice.name;
      jar.dataset.spiceId = spice.id;
      jar.draggable = false;
      if (selectedIds.has(spice.id)) {
        jar.style.opacity = '0.4';
        jar.style.pointerEvents = 'none';
      }

      jar.innerHTML = `
        <div class="jar-icon"></div>
        <div class="spice-info">
          <div class="spice-name">${spice.name}</div>
          <div class="spice-desc">${spice.description}</div>
        </div>
      `;

      const startHandler = (e: MouseEvent | TouchEvent) => {
        if (selectedIds.has(spice.id)) return;
        const point = this.getEventPoint(e);
        this.startDrag(e, {
          type: 'spice',
          id: spice.id,
          sourceEl: jar,
          point
        });
      };

      jar.addEventListener('mousedown', startHandler);
      jar.addEventListener('touchstart', startHandler, { passive: true });

      container.appendChild(jar);
    });
  }

  private renderSelectedSpices(): void {
    const container = this.els['selected-spices'];
    if (!container) return;

    const state = this.game.getState();

    if (state.selectedSpices.length === 0) {
      container.innerHTML = '<div class="empty-hint">拖拽香料入碗<br/>（最多三种）</div>';
      return;
    }

    const existing = Array.from(container.children) as HTMLElement[];
    const existingIds = new Set(existing.map(e => e.dataset.spiceId));
    const currentIds = new Set(state.selectedSpices.map(s => s.spiceId));

    existing.forEach(el => {
      if (!currentIds.has(el.dataset.spiceId!)) {
        el.classList.add('removing');
        setTimeout(() => el.remove(), 300);
      }
    });

    state.selectedSpices.forEach(sel => {
      const spice = getSpiceById(sel.spiceId);
      if (!spice) return;

      let item: HTMLElement | null = container.querySelector(`[data-spice-id="${sel.spiceId}"]`);
      const isNew = !item;

      if (isNew) {
        item = document.createElement('div');
        item.className = 'selected-spice-item';
        item.dataset.spiceId = sel.spiceId;
        item.innerHTML = `
          <span class="selected-spice-name"></span>
          <input type="range" class="selected-spice-slider" min="5" max="95" step="5" />
          <span class="selected-spice-value"></span>
          <button class="remove-spice-btn" title="移除">×</button>
        `;
        container.appendChild(item);

        const slider = item.querySelector('.selected-spice-slider') as HTMLInputElement;
        slider.addEventListener('input', (e) => {
          const val = parseInt((e.target as HTMLInputElement).value, 10);
          this.game.setSpicePercentage(sel.spiceId, val);
        });

        const removeBtn = item.querySelector('.remove-spice-btn') as HTMLButtonElement;
        removeBtn.addEventListener('click', () => {
          this.playSound(260, 0.04, 'sine');
          this.game.removeSpice(sel.spiceId);
        });
      }

      const nameEl = item!.querySelector('.selected-spice-name') as HTMLElement;
      const sliderEl = item!.querySelector('.selected-spice-slider') as HTMLInputElement;
      const valueEl = item!.querySelector('.selected-spice-value') as HTMLElement;

      if (nameEl) nameEl.textContent = spice.name;
      if (sliderEl && !this.dragState.isDragging) {
        sliderEl.value = String(sel.percentage);
      }
      if (valueEl) valueEl.textContent = sel.percentage + '%';
    });
  }

  private renderFineness(): void {
    const el = this.els['fineness-value'];
    if (el) {
      el.textContent = Math.round(this.game.getState().fineness).toString();
    }
  }

  private renderPills(): void {
    const container = this.els['pill-container'];
    if (!container) return;

    const state = this.game.getState();

    if (state.pills.length === 0) {
      if (container.children.length === 0 ||
          (container.children.length === 1 && container.querySelector('.empty-hint'))) {
        if (!container.querySelector('.empty-hint')) {
          container.innerHTML = '<div class="empty-hint">调和后香丸在此窖藏</div>';
        }
        return;
      }
    }

    const existingIds = new Set(
      Array.from(container.children)
        .filter(e => e.classList.contains('pill'))
        .map(e => (e as HTMLElement).dataset.pillId!)
    );
    const currentIds = new Set(state.pills.map(p => p.id));

    Array.from(container.children).forEach(c => {
      if (c.classList.contains('pill') &&
          !currentIds.has((c as HTMLElement).dataset.pillId!)) {
        c.remove();
      }
      if (c.classList.contains('empty-hint')) c.remove();
    });

    state.pills.forEach(pill => {
      if (!existingIds.has(pill.id)) {
        this.createPillElement(pill, container);
      } else {
        this.updatePillElement(pill);
      }
    });
  }

  private createPillElement(pill: IncensePill, container: HTMLElement): void {
    const el = document.createElement('div');
    el.className = 'pill';
    el.dataset.pillId = pill.id;

    el.innerHTML = `
      <div class="pill-ball" data-color="${pill.recipeName}"></div>
      <div class="pill-label">${pill.recipeName}</div>
      <div class="pill-timer"></div>
      <div class="age-actions"></div>
    `;

    const ball = el.querySelector('.pill-ball') as HTMLElement;
    const timer = el.querySelector('.pill-timer') as HTMLElement;
    const actions = el.querySelector('.age-actions') as HTMLElement;

    const startHandler = (e: MouseEvent | TouchEvent) => {
      if (!pill.isAged) return;
      const point = this.getEventPoint(e);
      this.startDrag(e, {
        type: 'pill',
        id: pill.id,
        sourceEl: el,
        point
      });
    };

    ball.addEventListener('mousedown', startHandler);
    ball.addEventListener('touchstart', startHandler, { passive: true });

    this.updatePillElementContent(pill, ball, timer, actions);
    container.appendChild(el);
  }

  private updatePillElement(pill: IncensePill): void {
    const container = this.els['pill-container'];
    if (!container) return;
    const el = container.querySelector(`[data-pill-id="${pill.id}"]`) as HTMLElement;
    if (!el) return;

    const ball = el.querySelector('.pill-ball') as HTMLElement;
    const timer = el.querySelector('.pill-timer') as HTMLElement;
    const actions = el.querySelector('.age-actions') as HTMLElement;

    this.updatePillElementContent(pill, ball, timer, actions);
  }

  private updatePillElementContent(
    pill: IncensePill,
    ball: HTMLElement,
    timer: HTMLElement,
    actions: HTMLElement
  ): void {
    if (!pill.isAged) {
      ball.classList.add('aging');
      ball.style.cursor = 'wait';
      timer.textContent = `${pill.ageingRemaining}s`;
      timer.style.display = 'block';

      if (actions.children.length === 0) {
        const btn = document.createElement('button');
        btn.className = 'btn btn-small';
        btn.textContent = '加速';
        btn.addEventListener('click', (ev) => {
          ev.stopPropagation();
          this.playSound(330, 0.06, 'triangle');
          this.game.accelerateAgeing(pill.id);
        });
        actions.appendChild(btn);
      }
      actions.style.display = 'flex';
    } else {
      ball.classList.remove('aging');
      ball.style.cursor = 'grab';
      timer.textContent = '已成';
      actions.innerHTML = '';
      actions.style.display = 'none';
    }
  }

  private renderLedger(): void {
    const container = this.els['ledger-records'];
    if (!container) return;

    const ledger = this.game.getState().ledger;

    if (ledger.length === 0) {
      if (!container.querySelector('.empty-hint')) {
        container.innerHTML = '<div class="empty-hint">尚无制香记录<br/>—— 愿君初试妙手 ——</div>';
      }
      return;
    }

    const existingIds = new Set(
      Array.from(container.children)
        .filter(e => e.classList.contains('ledger-record'))
        .map(e => (e as HTMLElement).dataset.recordId!)
    );
    const currentIds = new Set(ledger.map(r => r.id));

    Array.from(container.children).forEach(c => {
      if (c.classList.contains('ledger-record') &&
          !currentIds.has((c as HTMLElement).dataset.recordId!)) {
        c.remove();
      }
      if (c.classList.contains('empty-hint')) c.remove();
    });

    const frag = document.createDocumentFragment();
    ledger.forEach(record => {
      if (existingIds.has(record.id)) return;
      frag.appendChild(this.createRecordElement(record));
    });
    container.insertBefore(frag, container.firstChild);
  }

  private createRecordElement(record: LedgerRecord): HTMLElement {
    const el = document.createElement('div');
    el.className = 'ledger-record';
    el.dataset.recordId = record.id;

    const time = new Date(record.completedAt);
    const hh = String(time.getHours()).padStart(2, '0');
    const mm = String(time.getMinutes()).padStart(2, '0');
    const ss = String(time.getSeconds()).padStart(2, '0');

    const ingredientsText = record.ingredients.map(ing => {
      const sp = getSpiceById(ing.spiceId);
      return `${sp?.name || ''}${ing.percentage}%`;
    }).join(' · ');

    el.innerHTML = `
      <div class="record-time">${hh}:${mm}:${ss}</div>
      <div class="record-content">
        <span class="record-recipe-name">${record.recipeName}</span>
        <span class="record-detail">
          <span>配方：${ingredientsText}</span>
          <span>细度：${Math.round(record.fineness)}</span>
          <span>窖藏：${record.ageingDuration}s</span>
        </span>
      </div>
      <div class="record-actions">
        <button class="btn btn-small btn-secondary reapply-btn">重制</button>
      </div>
    `;

    const reapplyBtn = el.querySelector('.reapply-btn') as HTMLButtonElement;
    reapplyBtn.addEventListener('click', () => {
      this.playSound(392, 0.08, 'triangle');
      this.game.reapplyRecord(record.id);
    });

    return el;
  }

  private updateButtons(): void {
    const state = this.game.getState();
    const blendBtn = this.els['blend-btn'] as HTMLButtonElement;
    const clearBtn = this.els['clear-btn'] as HTMLButtonElement;

    if (blendBtn) {
      const hasSpices = state.selectedSpices.length > 0;
      const finenessOk = state.fineness >= 30;
      const totalPct = state.selectedSpices.reduce((s, x) => s + x.percentage, 0);
      blendBtn.disabled = !(hasSpices && finenessOk && totalPct === 100);
    }
    if (clearBtn) {
      clearBtn.disabled = state.selectedSpices.length === 0 && state.fineness === 0;
    }
  }

  private drawStaticScenes(): void {
    this.drawBowl();
    this.drawCenser();
    this.drawBowlContent();
  }

  private drawBowl(): void {
    const ctx = this.ctxs.bowl;
    const canvas = this.canvases.bowl;
    if (!ctx || !canvas) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const cx = GRINDING_CENTER_X;
    const cy = GRINDING_CENTER_Y;
    const outerR = 115;
    const innerR = 95;
    const rimR = 100;

    ctx.save();
    ctx.beginPath();
    ctx.ellipse(cx, cy + 8, outerR, outerR * 0.4, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    ctx.fill();
    ctx.restore();

    const grad = ctx.createLinearGradient(cx - outerR, cy, cx + outerR, cy + 40);
    grad.addColorStop(0, '#8B7355');
    grad.addColorStop(0.5, '#6B5B4C');
    grad.addColorStop(1, '#4A3A2C');

    ctx.save();
    ctx.beginPath();
    ctx.ellipse(cx, cy, outerR, outerR * 0.38, 0, 0, Math.PI);
    ctx.lineTo(cx + outerR, cy + 60);
    ctx.ellipse(cx, cy + 60, outerR, outerR * 0.28, 0, Math.PI, 0, true);
    ctx.lineTo(cx - outerR, cy);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.beginPath();
    ctx.ellipse(cx, cy, rimR, rimR * 0.35, 0, 0, Math.PI * 2);
    ctx.strokeStyle = '#3A2C1C';
    ctx.lineWidth = 6;
    ctx.stroke();
    ctx.restore();

    const innerGrad = ctx.createRadialGradient(cx, cy - 5, 10, cx, cy, innerR);
    innerGrad.addColorStop(0, '#5A4A3A');
    innerGrad.addColorStop(0.7, '#4A3A2A');
    innerGrad.addColorStop(1, '#3A2C1C');

    ctx.save();
    ctx.beginPath();
    ctx.ellipse(cx, cy, innerR, innerR * 0.33, 0, 0, Math.PI * 2);
    ctx.fillStyle = innerGrad;
    ctx.fill();
    ctx.restore();
  }

  private drawBowlContent(): void {
    const ctx = this.ctxs.bowl;
    const canvas = this.canvases.bowl;
    if (!ctx || !canvas) return;

    this.drawBowl();

    const cx = GRINDING_CENTER_X;
    const cy = GRINDING_CENTER_Y;
    const state = this.game.getState();

    if (state.selectedSpices.length > 0) {
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(cx, cy, 80, 80 * 0.33, 0, 0, Math.PI * 2);
      ctx.clip();

      let r = 139, g = 90, b = 43;
      if (state.selectedSpices.length > 0) {
        const total = state.selectedSpices.reduce((s, x) => s + x.percentage, 0) || 1;
        r = g = b = 0;
        state.selectedSpices.forEach(sel => {
          const sp = getSpiceById(sel.spiceId);
          if (sp) {
            const hex = sp.color.replace('#', '');
            const cr = parseInt(hex.substring(0, 2), 16);
            const cg = parseInt(hex.substring(2, 4), 16);
            const cb = parseInt(hex.substring(4, 6), 16);
            const weight = sel.percentage / total;
            r += cr * weight;
            g += cg * weight;
            b += cb * weight;
          }
        });
      }

      const finenessRatio = state.fineness / 100;
      const particleCount = Math.floor(50 + finenessRatio * 150);
      const particleSize = 4 - finenessRatio * 3;

      for (let i = 0; i < particleCount; i++) {
        const angle = (i / particleCount) * Math.PI * 2 + Math.sin(i) * 0.5;
        const rad = 10 + Math.pow(Math.random(), 0.5) * 68;
        const px = cx + Math.cos(angle) * rad * (0.5 + Math.random() * 0.5);
        const py = cy + Math.sin(angle) * rad * 0.33;
        const jitter = (Math.random() - 0.5) * 10;

        ctx.beginPath();
        ctx.arc(px + jitter * 0.5, py + jitter * 0.2, particleSize * (0.6 + Math.random() * 0.8), 0, Math.PI * 2);
        const colorFuzz = (Math.random() - 0.5) * 25;
        ctx.fillStyle = `rgb(${Math.round(r + colorFuzz)},${Math.round(g + colorFuzz)},${Math.round(b + colorFuzz)})`;
        ctx.globalAlpha = 0.7 + Math.random() * 0.3;
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      ctx.restore();
    }

    this.drawGrinder();
  }

  private drawGrinder(): void {
    const ctx = this.ctxs.bowl;
    if (!ctx) return;

    const { x, y } = this.grinderPosition;
    const angle = this.grinderAngle;

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);

    ctx.beginPath();
    ctx.ellipse(0, 0, 20, 20 * 0.38, 0, 0, Math.PI * 2);
    const baseGrad = ctx.createRadialGradient(-5, -3, 2, 0, 0, 20);
    baseGrad.addColorStop(0, '#8B7355');
    baseGrad.addColorStop(0.6, '#5C4A38');
    baseGrad.addColorStop(1, '#3A2C1C');
    ctx.fillStyle = baseGrad;
    ctx.fill();
    ctx.strokeStyle = '#2A1C0C';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, -2);
    ctx.lineTo(-6, -70);
    ctx.lineTo(6, -70);
    ctx.closePath();
    const handleGrad = ctx.createLinearGradient(-6, 0, 6, 0);
    handleGrad.addColorStop(0, '#5C4A38');
    handleGrad.addColorStop(0.5, '#8B7355');
    handleGrad.addColorStop(1, '#5C4A38');
    ctx.fillStyle = handleGrad;
    ctx.fill();
    ctx.strokeStyle = '#2A1C0C';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.beginPath();
    ctx.ellipse(0, -70, 10, 4, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#4A3A28';
    ctx.fill();

    ctx.restore();

    ctx.save();
    ctx.beginPath();
    ctx.ellipse(x, y + 2, 22, 8, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.fill();
    ctx.restore();
  }

  private drawCenser(): void {
    const ctx = this.ctxs.censer;
    const canvas = this.canvases.censer;
    if (!ctx || !canvas) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const cx = canvas.width / 2;
    const cy = canvas.height / 2 + 40;

    ctx.save();
    ctx.beginPath();
    ctx.ellipse(cx, cy + 95, 100, 18, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    ctx.fill();
    ctx.restore();

    ctx.save();
    [-40, 0, 40].forEach((offset, idx) => {
      const lx = cx + offset;
      const ly = cy + 80;

      ctx.beginPath();
      if (idx === 0) {
        ctx.moveTo(lx - 10, ly);
        ctx.lineTo(lx - 5, ly + 20);
        ctx.quadraticCurveTo(lx, ly + 28, lx + 5, ly + 20);
        ctx.lineTo(lx + 10, ly);
      } else {
        const side = idx === 1 ? 1 : -1;
        ctx.moveTo(lx - 8, ly);
        ctx.lineTo(lx - 5, ly + 22);
        ctx.quadraticCurveTo(lx + side * 2, ly + 30, lx + 7, ly + 22);
        ctx.lineTo(lx + 10, ly);
      }
      ctx.closePath();

      const legGrad = ctx.createLinearGradient(lx - 10, ly, lx + 10, ly);
      legGrad.addColorStop(0, '#6B3A10');
      legGrad.addColorStop(0.5, '#8B4513');
      legGrad.addColorStop(1, '#5C2A08');
      ctx.fillStyle = legGrad;
      ctx.fill();
      ctx.strokeStyle = '#3A1A00';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.beginPath();
      ctx.ellipse(lx, ly, 10, 4, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#7B5530';
      ctx.fill();
    });
    ctx.restore();

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(cx - 100, cy + 75);
    ctx.quadraticCurveTo(cx - 115, cy + 30, cx - 95, cy);
    ctx.lineTo(cx + 95, cy);
    ctx.quadraticCurveTo(cx + 115, cy + 30, cx + 100, cy + 75);
    ctx.quadraticCurveTo(cx, cy + 90, cx - 100, cy + 75);
    ctx.closePath();

    const bodyGrad = ctx.createRadialGradient(cx - 30, cy + 10, 10, cx, cy + 40, 110);
    bodyGrad.addColorStop(0, '#C49A6C');
    bodyGrad.addColorStop(0.3, '#A07240');
    bodyGrad.addColorStop(0.6, '#8B4513');
    bodyGrad.addColorStop(0.85, '#5C3317');
    bodyGrad.addColorStop(1, '#3A1F08');
    ctx.fillStyle = bodyGrad;
    ctx.fill();
    ctx.strokeStyle = '#2A0F00';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.globalAlpha = 0.3;
    for (let i = 0; i < 5; i++) {
      const patX = cx - 70 + i * 35;
      ctx.beginPath();
      ctx.arc(patX, cy + 40, 12, 0, Math.PI * 2);
      ctx.strokeStyle = '#D4B088';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(patX, cy + 40, 6, 0, Math.PI * 2);
      ctx.fillStyle = '#D4B088';
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.restore();

    ctx.save();
    ctx.beginPath();
    ctx.ellipse(cx, cy, 100, 22, 0, Math.PI, 0);
    ctx.lineTo(cx + 110, cy + 8);
    ctx.quadraticCurveTo(cx, cy + 18, cx - 110, cy + 8);
    ctx.closePath();

    const rimGrad = ctx.createLinearGradient(cx - 110, cy, cx + 110, cy);
    rimGrad.addColorStop(0, '#6B3A10');
    rimGrad.addColorStop(0.5, '#C49A6C');
    rimGrad.addColorStop(1, '#6B3A10');
    ctx.fillStyle = rimGrad;
    ctx.fill();
    ctx.strokeStyle = '#2A0F00';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(cx - 70, cy - 2);
    ctx.quadraticCurveTo(cx - 78, cy - 50, cx - 50, cy - 75);
    ctx.lineTo(cx - 40, cy - 70);
    ctx.quadraticCurveTo(cx - 55, cy - 50, cx - 58, cy - 5);
    ctx.closePath();
    ctx.fillStyle = '#8B4513';
    ctx.fill();
    ctx.strokeStyle = '#3A1A00';
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(cx + 70, cy - 2);
    ctx.quadraticCurveTo(cx + 78, cy - 50, cx + 50, cy - 75);
    ctx.lineTo(cx + 40, cy - 70);
    ctx.quadraticCurveTo(cx + 55, cy - 50, cx + 58, cy - 5);
    ctx.closePath();
    ctx.fillStyle = '#8B4513';
    ctx.fill();
    ctx.strokeStyle = '#3A1A00';
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.beginPath();
    ctx.ellipse(cx, cy - 80, 55, 12, 0, 0, Math.PI * 2);
    const lidGrad = ctx.createRadialGradient(cx - 15, cy - 85, 5, cx, cy - 80, 55);
    lidGrad.addColorStop(0, '#C49A6C');
    lidGrad.addColorStop(0.5, '#8B4513');
    lidGrad.addColorStop(1, '#5C2A08');
    ctx.fillStyle = lidGrad;
    ctx.fill();
    ctx.strokeStyle = '#2A0F00';
    ctx.lineWidth = 1.2;
    ctx.stroke();
    ctx.restore();

    const holePositions: [number, number][] = [];
    for (let ring = 0; ring < 3; ring++) {
      const count = 6 + ring * 4;
      const ringR = 10 + ring * 12;
      for (let i = 0; i < count; i++) {
        const a = (i / count) * Math.PI * 2 + ring * 0.3;
        holePositions.push([
          cx + Math.cos(a) * ringR,
          cy - 80 + Math.sin(a) * ringR * 0.35
        ]);
      }
    }

    ctx.save();
    holePositions.forEach(([hx, hy]) => {
      ctx.beginPath();
      ctx.ellipse(hx, hy, 1.8, 0.9, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#1A0A00';
      ctx.fill();
    });
    ctx.restore();

    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy - 110, 8, 0, Math.PI * 2);
    const knobGrad = ctx.createRadialGradient(cx - 2, cy - 113, 2, cx, cy - 110, 8);
    knobGrad.addColorStop(0, '#D4B088');
    knobGrad.addColorStop(1, '#6B3A10');
    ctx.fillStyle = knobGrad;
    ctx.fill();
    ctx.strokeStyle = '#2A0F00';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();
  }

  private startRenderLoop(): void {
    const loop = (t: number) => {
      const dt = Math.min(t - this.lastFrameTime, 50);
      this.lastFrameTime = t;
      this.updateAndDraw(dt);
      this.animationFrameId = requestAnimationFrame(loop);
    };
    this.animationFrameId = requestAnimationFrame(loop);
  }

  private updateAndDraw(dt: number): void {
    this.updateFlyPowder(dt);
    this.drawFlyPowder();
    this.updateScentParticles(dt);
    this.drawScentParticles();

    if (this.isGrinding && Date.now() - this.lastGrindTime < 80) {
      this.drawBowlContent();
    }
  }

  spawnFlyPowder(cx: number, cy: number): void {
    for (let i = 0; i < 20; i++) {
      const a = Math.random() * Math.PI * 2;
      const speed = 20 + Math.random() * 60;
      this.flyPowderParticles.push({
        x: cx + (Math.random() - 0.5) * 30,
        y: cy + (Math.random() - 0.5) * 20,
        vx: Math.cos(a) * speed,
        vy: Math.sin(a) * speed - 30,
        alpha: 0.8,
        life: 0,
        maxLife: 500
      });
    }
  }

  private updateFlyPowder(dt: number): void {
    if (this.flyPowderParticles.length === 0) return;

    this.flyPowderParticles = this.flyPowderParticles.filter(p => {
      p.life += dt;
      if (p.life >= p.maxLife) return false;

      p.x += p.vx * dt / 1000;
      p.y += p.vy * dt / 1000;
      p.vy += 80 * dt / 1000;
      p.vx *= 0.98;
      p.alpha = 0.8 * (1 - p.life / p.maxLife);
      return true;
    });
  }

  private drawFlyPowder(): void {
    const ctx = this.ctxs.bowl;
    if (!ctx || this.flyPowderParticles.length === 0) return;

    ctx.save();
    this.flyPowderParticles.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, 1.5 + Math.random() * 1.5, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${p.alpha})`;
      ctx.fill();
    });
    ctx.restore();
  }

  spawnScentBurst(colors: string[]): void {
    const canvas = this.canvases.particle;
    if (!canvas) return;

    const cx = canvas.width / 2;
    const cy = canvas.height / 2 - 80;

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const color = colors[Math.floor(Math.random() * colors.length)];
      const phaseRand = Math.random();
      const phase: ScentParticle['phase'] = phaseRand < 0.5 ? 'rise' : (phaseRand < 0.8 ? 'spread' : 'sink');

      this.scentParticles.push({
        x: cx + (Math.random() - 0.5) * 40,
        y: cy + (Math.random() - 0.5) * 20,
        baseX: cx,
        baseY: cy,
        vx: 0,
        vy: 0,
        color,
        alpha: 0,
        life: 0,
        maxLife: PARTICLE_DURATION * (0.7 + Math.random() * 0.5),
        size: 2 + Math.random() * 5,
        angle: Math.random() * Math.PI * 2,
        radius: 10 + Math.random() * 40,
        angularSpeed: (Math.random() - 0.5) * 3,
        phase,
        phaseTime: Math.random() * 1000
      });
    }
  }

  private updateScentParticles(dt: number): void {
    if (this.scentParticles.length === 0) return;

    this.scentParticles = this.scentParticles.filter(p => {
      p.life += dt;
      if (p.life >= p.maxLife) return false;

      p.phaseTime += dt;
      const t = p.life / p.maxLife;

      if (t < 0.15) {
        p.alpha = t / 0.15 * 0.75;
      } else if (t > 0.75) {
        p.alpha = ((1 - t) / 0.25) * 0.75;
      } else {
        p.alpha = 0.75;
      }

      p.angle += p.angularSpeed * dt / 1000;

      const spiralFactor = PARTICLE_SPREAD_RADIUS * (0.3 + t * 0.7);
      p.radius = 20 + Math.abs(Math.sin(p.phaseTime / 500)) * spiralFactor * 0.5;

      switch (p.phase) {
        case 'rise':
          p.x = p.baseX + Math.cos(p.angle) * p.radius * 0.4;
          p.y = p.baseY - t * 250 + Math.sin(p.angle * 2) * 15;
          break;
        case 'spread':
          p.x = p.baseX + Math.cos(p.angle) * p.radius;
          p.y = p.baseY - 80 + Math.sin(p.angle * 1.5) * p.radius * 0.5 + Math.sin(t * Math.PI) * 40;
          break;
        case 'sink':
          p.x = p.baseX + Math.cos(p.angle) * p.radius * 0.6;
          p.y = p.baseY - 100 + t * 200 + Math.sin(p.angle * 3) * 20;
          break;
      }

      return true;
    });
  }

  private drawScentParticles(): void {
    const ctx = this.ctxs.particle;
    const canvas = this.canvases.particle;
    if (!ctx || !canvas) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (this.scentParticles.length === 0) return;

    this.scentParticles.forEach(p => {
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);

      const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
      grad.addColorStop(0, p.color);
      grad.addColorStop(1, this.colorWithAlpha(p.color, 0));
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.restore();
    });
  }

  private colorWithAlpha(hex: string, alpha: number): string {
    const h = hex.replace('#', '');
    const r = parseInt(h.substring(0, 2), 16);
    const g = parseInt(h.substring(2, 4), 16);
    const b = parseInt(h.substring(4, 6), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  }

  showHalo(centerEl: HTMLElement, color: string): void {
    const parent = centerEl;
    const halo1 = document.createElement('div');
    halo1.className = 'halo-center';
    halo1.style.color = color;
    parent.appendChild(halo1);
    setTimeout(() => halo1.remove(), 2000);

    const halo2 = document.createElement('div');
    halo2.className = 'halo';
    halo2.style.background = `radial-gradient(circle, ${color}66 0%, ${color}22 40%, transparent 70%)`;
    parent.appendChild(halo2);
    setTimeout(() => halo2.remove(), 2000);
  }

  playSound(freq: number, duration: number = 0.08, type: OscillatorType = 'sine'): void {
    try {
      if (!this.audioCtx) {
        this.audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = this.audioCtx!;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = type;
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

      osc.connect(gain).connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (e) {}
  }

  private getEventPoint(e: MouseEvent | TouchEvent): { x: number; y: number } {
    if ('touches' in e) {
      return { x: e.touches[0]?.clientX ?? 0, y: e.touches[0]?.clientY ?? 0 };
    }
    return { x: (e as MouseEvent).clientX, y: (e as MouseEvent).clientY };
  }

  private startDrag(
    e: MouseEvent | TouchEvent,
    opts: { type: 'spice' | 'pill'; id: string; sourceEl: HTMLElement; point: { x: number; y: number } }
  ): void {
    e.preventDefault();
    this.playSound(440, 0.04, 'sine');

    const rect = opts.sourceEl.getBoundingClientRect();
    this.dragState = {
      isDragging: true,
      startX: opts.point.x,
      startY: opts.point.y,
      currentX: opts.point.x,
      currentY: opts.point.y,
      offsetX: opts.point.x - rect.left,
      offsetY: opts.point.y - rect.top,
      targetId: opts.id,
      targetType: opts.type,
      cloneEl: this.createDragClone(opts.sourceEl, opts.point.x, opts.point.y, rect)
    };

    opts.sourceEl.classList.add('dragging');
    this.floatingLabel.style.opacity = '1';
  }

  private createDragClone(
    sourceEl: HTMLElement,
    x: number,
    y: number,
    rect: DOMRect
  ): HTMLElement {
    const clone = sourceEl.cloneNode(true) as HTMLElement;
    clone.style.position = 'fixed';
    clone.style.left = (x - this.dragState.offsetX) + 'px';
    clone.style.top = (y - this.dragState.offsetY) + 'px';
    clone.style.width = rect.width + 'px';
    clone.style.height = rect.height + 'px';
    clone.style.zIndex = '10000';
    clone.style.pointerEvents = 'none';
    clone.style.opacity = '0.85';
    clone.style.transform = 'scale(1.05) rotate(-2deg)';
    document.body.appendChild(clone);
    return clone;
  }

  private onMouseMove(e: MouseEvent): void {
    this.handleMove(e.clientX, e.clientY);
    this.handleGrinderMove(e);
  }

  private onTouchMove(e: TouchEvent): void {
    if (e.touches.length > 0) {
      e.preventDefault();
      this.handleMove(e.touches[0].clientX, e.touches[0].clientY);
      this.handleGrinderMove({ clientX: e.touches[0].clientX, clientY: e.touches[0].clientY } as MouseEvent);
    }
  }

  private handleMove(x: number, y: number): void {
    if (!this.dragState.isDragging) return;

    this.dragState.currentX = x;
    this.dragState.currentY = y;

    if (this.dragState.cloneEl) {
      this.dragState.cloneEl.style.left = (x - this.dragState.offsetX) + 'px';
      this.dragState.cloneEl.style.top = (y - this.dragState.offsetY) + 'px';
    }

    this.floatingLabel.style.left = (x + 15) + 'px';
    this.floatingLabel.style.top = (y + 15) + 'px';

    let hint = '';
    if (this.dragState.targetType === 'spice') {
      hint = this.isOverBowl(x, y) ? '释放加入研磨碗' : '拖入中央研磨碗';
    } else if (this.dragState.targetType === 'pill') {
      hint = this.isOverCenser(x, y) ? '释放放入香炉品香' : '拖至右侧香炉';
    }
    this.floatingLabel.textContent = hint;
  }

  private handleGrinderMove(e: { clientX: number; clientY: number }): void {
    const bowlCanvas = this.canvases.bowl;
    if (!bowlCanvas) return;

    if (!this.isGrinding) {
      if (this.dragState.isDragging) return;
      if (!(e as any).buttons && !(e as any).touches) return;
    }

    const rect = bowlCanvas.getBoundingClientRect();
    const scaleX = bowlCanvas.width / rect.width;
    const scaleY = bowlCanvas.height / rect.height;
    const mx = (e.clientX - rect.left) * scaleX;
    const my = (e.clientY - rect.top) * scaleY;

    const cx = GRINDING_CENTER_X;
    const cy = GRINDING_CENTER_Y;
    let dx = mx - cx;
    let dy = my - cy;

    dy = dy / 0.38;

    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist === 0) return;

    const clampedDist = Math.min(dist, GRINDING_BOWL_RADIUS);
    dx = (dx / dist) * clampedDist;
    dy = (dy / dist) * clampedDist;

    const newX = cx + dx;
    const newY = cy + dy * 0.38;

    const travelDist = Math.sqrt(
      Math.pow(newX - this.lastGrinderPosition.x, 2) +
      Math.pow(newY - this.lastGrinderPosition.y, 2) * 2
    );

    if (travelDist > 3 && this.isGrinding) {
      this.game.addGrindingProgress(travelDist);
      this.lastGrinderPosition = { x: newX, y: newY };
      this.lastGrindTime = Date.now();

      if (Math.random() < 0.15) {
        this.playSound(150 + Math.random() * 80, 0.02, 'triangle');
      }
    }

    this.grinderAngle = Math.atan2(dy, dx) + Math.PI / 2;
    this.grinderPosition = { x: newX, y: newY };

    if (this.isGrinding) {
      this.drawBowlContent();
    }
  }

  private onMouseUp(e: MouseEvent): void {
    this.handleRelease(e.clientX, e.clientY);
    this.handleGrinderRelease();
  }

  private onTouchEnd(e: TouchEvent): void {
    const t = e.changedTouches[0];
    if (t) {
      this.handleRelease(t.clientX, t.clientY);
    }
    this.handleGrinderRelease();
  }

  private handleRelease(x: number, y: number): void {
    if (!this.dragState.isDragging) return;

    const state = this.game.getState();

    if (this.dragState.targetType === 'spice') {
      if (this.isOverBowl(x, y) || this.isOverWorkArea(x, y)) {
        const added = this.game.addSpice(this.dragState.targetId!);
        if (added) {
          this.playSound(523, 0.1, 'sine');
          const bowlCanvas = this.canvases.bowl;
          if (bowlCanvas) {
            const r = bowlCanvas.getBoundingClientRect();
            this.spawnFlyPowder(r.width / 2, r.height / 2);
          }
        } else {
          this.playSound(200, 0.15, 'square');
        }
      }
    } else if (this.dragState.targetType === 'pill') {
      if (this.isOverCenser(x, y)) {
        const pill = state.pills.find(p => p.id === this.dragState.targetId);
        if (pill && pill.isAged) {
          const record = this.game.placePillInCenser(this.dragState.targetId!);
          if (record) {
            this.playSound(392, 0.15, 'sine');
            setTimeout(() => this.playSound(523, 0.15, 'sine'), 120);
            setTimeout(() => this.playSound(659, 0.2, 'triangle'), 260);
            this.spawnScentBurst(pill.particleColors);
            const censerContainer = this.els['censer-container'];
            if (censerContainer) {
              this.showHalo(censerContainer, pill.color);
            }
          }
        }
      }
    }

    this.cleanupDrag();
  }

  private cleanupDrag(): void {
    if (this.dragState.cloneEl) {
      this.dragState.cloneEl.remove();
    }

    document.querySelectorAll('.dragging').forEach(el => el.classList.remove('dragging'));

    this.dragState = {
      isDragging: false,
      startX: 0,
      startY: 0,
      currentX: 0,
      currentY: 0,
      offsetX: 0,
      offsetY: 0,
      targetId: null,
      targetType: null,
      cloneEl: null
    };

    this.floatingLabel.style.opacity = '0';
  }

  handleGrinderStart(e: MouseEvent | TouchEvent): void {
    const canvas = this.canvases.bowl;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const point = this.getEventPoint(e);

    if (point.x >= rect.left && point.x <= rect.right &&
        point.y >= rect.top && point.y <= rect.bottom) {
      this.isGrinding = true;
      this.game.setGrinding(true);
      e.preventDefault();
    }
  }

  private handleGrinderRelease(): void {
    if (this.isGrinding) {
      this.isGrinding = false;
      this.game.setGrinding(false);
    }
  }

  private isOverBowl(x: number, y: number): boolean {
    const canvas = this.canvases.bowl;
    if (!canvas) return false;
    const r = canvas.getBoundingClientRect();
    return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
  }

  private isOverWorkArea(x: number, y: number): boolean {
    const area = this.els['work-area'];
    if (!area) return false;
    const r = area.getBoundingClientRect();
    return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
  }

  private isOverCenser(x: number, y: number): boolean {
    const area = this.els['censer-area'];
    if (!area) return false;
    const r = area.getBoundingClientRect();
    return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
  }

  private handleBlend(): void {
    const result = this.game.blend();

    if (!result.success) {
      this.playSound(180, 0.2, 'square');
      return;
    }

    this.playSound(440, 0.1, 'sine');
    setTimeout(() => this.playSound(554, 0.12, 'sine'), 100);
    setTimeout(() => this.playSound(659, 0.18, 'triangle'), 220);

    const container = this.els['work-area'];
    if (container && result.pill) {
      this.showHalo(container, result.pill.color);
    }
  }

  bindGrinderEvents(): void {
    const bowlCanvas = this.canvases.bowl;
    if (!bowlCanvas) return;
    bowlCanvas.addEventListener('mousedown', (e) => this.handleGrinderStart(e));
    bowlCanvas.addEventListener('touchstart', (e) => this.handleGrinderStart(e), { passive: false });
  }

  destroy(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }
    if (this.floatingLabel.parentNode) {
      this.floatingLabel.parentNode.removeChild(this.floatingLabel);
    }
  }
}
