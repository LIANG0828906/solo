import { Cauldron } from './cauldron';
import { ReactionEngine, INGREDIENTS, Ingredient, ReactionRule, PotionRecord, Rarity } from './reactionEngine';
import { ParticleEffect } from './particleEffect';

const STORAGE_KEY = 'alchemy_potion_records';
const MAX_RECORDS = 50;

class GameApp {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private cauldron: Cauldron;
  private reactionEngine: ReactionEngine;
  private particleEffect: ParticleEffect;
  private lastTime = 0;
  private animFrameId = 0;
  private isPanelOpen = false;
  private elementTargets = { nature: 0, magic: 0, darkness: 0 };
  private elementCurrent = { nature: 0, magic: 0, darkness: 0 };

  constructor() {
    this.canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
    this.ctx = this.canvas.getContext('2d')!;
    this.reactionEngine = new ReactionEngine();
    this.particleEffect = new ParticleEffect();

    const center = this.getCauldronCenter();
    this.cauldron = new Cauldron(center.x, center.y, center.radius);
    this.particleEffect.setCauldronCenter(center.x, center.y, center.radius);

    this.resize();
    this.setupEventListeners();
    this.createIngredientBottles();
    this.updateElementArcs();
    this.loop = this.loop.bind(this);
    this.lastTime = performance.now();
    this.animFrameId = requestAnimationFrame(this.loop);
  }

  private getCauldronCenter(): { x: number; y: number; radius: number } {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const isMobile = w < 768;
    const radius = isMobile ? 120 : 160;
    return {
      x: w / 2,
      y: h / 2,
      radius,
    };
  }

  private resize(): void {
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = window.innerWidth * dpr;
    this.canvas.height = window.innerHeight * dpr;
    this.canvas.style.width = `${window.innerWidth}px`;
    this.canvas.style.height = `${window.innerHeight}px`;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const center = this.getCauldronCenter();
    this.cauldron.setPosition(center.x, center.y, center.radius);
    this.particleEffect.setCauldronCenter(center.x, center.y, center.radius);
  }

  private loop(now: number): void {
    const dt = Math.min(0.05, (now - this.lastTime) / 1000);
    this.lastTime = now;

    if (!this.isPanelOpen) {
      this.cauldron.update(dt);
      this.particleEffect.update(dt);
      this.checkReaction();
      this.updateElementProgress(dt);
    }

    this.render();
    this.renderElementArcs();
    this.animFrameId = requestAnimationFrame(this.loop);
  }

  private render(): void {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.ctx.clearRect(0, 0, w, h);

    const bgGrad = this.ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.max(w, h) * 0.7);
    bgGrad.addColorStop(0, '#1A0A2E');
    bgGrad.addColorStop(1, '#0D0515');
    this.ctx.fillStyle = bgGrad;
    this.ctx.fillRect(0, 0, w, h);

    this.drawAmbientParticles();

    this.cauldron.render(this.ctx);
    this.particleEffect.render(this.ctx);
  }

  private drawAmbientParticles(): void {
    const time = performance.now() / 1000;
    this.ctx.save();
    for (let i = 0; i < 30; i++) {
      const seed = i * 123.456;
      const x = ((Math.sin(seed) + 1) / 2) * window.innerWidth;
      const y = ((Math.cos(seed * 1.3) + 1) / 2) * window.innerHeight;
      const offset = Math.sin(time + seed) * 10;
      const alpha = 0.15 + 0.1 * Math.sin(time * 2 + seed);
      this.ctx.fillStyle = `rgba(155, 89, 182, ${alpha})`;
      this.ctx.beginPath();
      this.ctx.arc(x + offset, y + offset * 0.5, 1.5, 0, Math.PI * 2);
      this.ctx.fill();
    }
    this.ctx.restore();
  }

  private checkReaction(): void {
    if (this.cauldron.canReact()) {
      const ingredientIds = this.cauldron.getIngredientIds();
      const rule = this.reactionEngine.matchReaction(ingredientIds);
      if (rule) {
        this.triggerReaction(rule);
      } else {
        this.cauldron.clearForReaction();
      }
    }
  }

  private triggerReaction(rule: ReactionRule): void {
    const ingredients = this.cauldron.getIngredients();
    this.particleEffect.triggerReaction(
      rule.particleParams,
      this.cauldron.centerX,
      this.cauldron.centerY,
      rule.glowColor
    );
    this.cauldron.clearForReaction();
    this.showPotionCard(rule, ingredients);
    this.saveRecord(rule, ingredients);
    this.updateElementArcs();
  }

  private setupEventListeners(): void {
    window.addEventListener('resize', () => this.resize());

    const resetBtn = document.getElementById('resetBtn')!;
    resetBtn.addEventListener('click', () => {
      this.cauldron.reset();
      this.particleEffect.clear();
      this.updateElementArcs();
      const ripple = document.createElement('span');
      ripple.className = 'ripple';
      resetBtn.appendChild(ripple);
      setTimeout(() => ripple.remove(), 600);
    });

    const recordBtn = document.getElementById('recordBtn')!;
    const recordClose = document.getElementById('recordPanelClose')!;

    recordBtn.addEventListener('click', () => {
      this.openRecordPanel();
    });
    recordClose.addEventListener('click', () => {
      this.closeRecordPanel();
    });
  }

  private openRecordPanel(): void {
    const panel = document.getElementById('recordPanel')!;
    panel.classList.add('open');
    this.isPanelOpen = true;
    this.particleEffect.setPaused(true);
    this.renderRecordList();
  }

  private closeRecordPanel(): void {
    const panel = document.getElementById('recordPanel')!;
    panel.classList.remove('open');
    this.isPanelOpen = false;
    this.particleEffect.setPaused(false);
  }

  private createIngredientBottles(): void {
    const panel = document.getElementById('ingredientsPanel')!;
    panel.innerHTML = '';

    for (const ing of INGREDIENTS) {
      const bottle = this.createBottleSVG(ing);
      bottle.dataset.ingredientId = ing.id;
      this.setupDrag(bottle, ing);
      panel.appendChild(bottle);
    }
  }

  private createBottleSVG(ing: Ingredient): HTMLElement {
    const el = document.createElement('div');
    el.className = 'potion-bottle';
    el.innerHTML = `
      <svg viewBox="0 0 40 80" width="40" height="80">
        <defs>
          <linearGradient id="bottleGrad-${ing.id}" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="rgba(255,255,255,0.2)"/>
            <stop offset="50%" stop-color="rgba(255,255,255,0.05)"/>
            <stop offset="100%" stop-color="rgba(255,255,255,0.15)"/>
          </linearGradient>
          <linearGradient id="liquidGrad-${ing.id}" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="${this.lightenColor(ing.color, 30)}"/>
            <stop offset="100%" stop-color="${ing.color}"/>
          </linearGradient>
        </defs>
        <rect x="14" y="2" width="12" height="10" rx="2" fill="#8B5A2B"/>
        <rect x="12" y="10" width="16" height="4" rx="1" fill="#B87333"/>
        <path d="M10 14 Q10 20, 6 28 L6 70 Q6 78, 14 78 L26 78 Q34 78, 34 70 L34 28 Q30 20, 30 14 Z"
              fill="url(#bottleGrad-${ing.id})" stroke="rgba(255,255,255,0.25)" stroke-width="1"/>
        <path d="M10 14 Q10 20, 6 28 L6 70 Q6 78, 14 78 L26 78 Q34 78, 34 70 L34 28 Q30 20, 30 14 Z"
              fill="url(#liquidGrad-${ing.id})" opacity="0.75"/>
        <ellipse cx="15" cy="40" rx="2" ry="12" fill="rgba(255,255,255,0.35)"/>
      </svg>
    `;
    el.title = ing.name;
    return el;
  }

  private lightenColor(hex: string, percent: number): string {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    const nr = Math.min(255, r + Math.round((255 - r) * percent / 100));
    const ng = Math.min(255, g + Math.round((255 - g) * percent / 100));
    const nb = Math.min(255, b + Math.round((255 - b) * percent / 100));
    return `#${nr.toString(16).padStart(2, '0')}${ng.toString(16).padStart(2, '0')}${nb.toString(16).padStart(2, '0')}`;
  }

  private setupDrag(bottle: HTMLElement, ingredient: Ingredient): void {
    let dragClone: HTMLElement | null = null;
    let pointerId: number | null = null;

    const onPointerDown = (e: PointerEvent) => {
      e.preventDefault();
      pointerId = (e as PointerEvent).pointerId;
      bottle.setPointerCapture(pointerId);

      dragClone = bottle.cloneNode(true) as HTMLElement;
      dragClone.classList.add('dragging');
      dragClone.style.left = `${e.clientX - 20}px`;
      dragClone.style.top = `${e.clientY - 40}px`;
      document.body.appendChild(dragClone);
    };

    const onPointerMove = (e: PointerEvent) => {
      if (dragClone) {
        dragClone.style.left = `${e.clientX - 20}px`;
        dragClone.style.top = `${e.clientY - 40}px`;
      }
    };

    const onPointerUp = (e: PointerEvent) => {
      if (pointerId !== null) {
        try { bottle.releasePointerCapture(pointerId); } catch { /* ignore */ }
      }
      pointerId = null;

      if (dragClone) {
        if (this.cauldron.containsPoint(e.clientX, e.clientY)) {
          this.cauldron.addIngredient(ingredient, e.clientX, e.clientY);
          this.updateElementArcs();
        }
        dragClone.remove();
        dragClone = null;
      }
    };

    bottle.addEventListener('pointerdown', onPointerDown);
    bottle.addEventListener('pointermove', onPointerMove);
    bottle.addEventListener('pointerup', onPointerUp);
    bottle.addEventListener('pointercancel', onPointerUp);
  }

  private showPotionCard(rule: ReactionRule, ingredients: Ingredient[]): void {
    const container = document.getElementById('potionCardContainer')!;
    const card = document.createElement('div');
    card.className = 'potion-card';
    card.style.borderColor = rule.glowColor;
    card.style.boxShadow = `0 0 24px ${rule.glowColor}55, 0 4px 16px rgba(0,0,0,0.4)`;

    const stars = this.renderStars(rule.rarity);

    card.innerHTML = `
      <div class="potion-card-title">${rule.potionName}</div>
      <div class="potion-card-body">
        <div class="potion-card-icon" style="background: radial-gradient(circle, ${rule.glowColor}, ${rule.color}); box-shadow: 0 0 16px ${rule.glowColor}aa;">
          <span style="font-size: 20px;">${rule.icon}</span>
        </div>
        <div style="display:flex;flex-direction:column;gap:4px;flex:1;min-width:0;">
          <div style="font-size:11px;color:#B8A5C7;">${rule.effect}</div>
          <div class="potion-card-stars">${stars}</div>
        </div>
      </div>
    `;

    container.appendChild(card);

    setTimeout(() => {
      card.classList.add('fading');
      setTimeout(() => card.remove(), 500);
    }, 3000);

    void ingredients;
  }

  private renderStars(rarity: Rarity): string {
    let html = '';
    for (let i = 0; i < 5; i++) {
      if (i < rarity) {
        html += `<svg viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>`;
      } else {
        html += `<svg class="empty" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>`;
      }
    }
    return html;
  }

  private saveRecord(rule: ReactionRule, ingredients: Ingredient[]): void {
    const records = this.loadRecords();
    const record: PotionRecord = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name: rule.potionName,
      ingredients: ingredients.map((i) => i.id),
      ingredientColors: ingredients.map((i) => i.color),
      rarity: rule.rarity,
      color: rule.color,
      icon: rule.icon,
      timestamp: Date.now(),
    };
    records.unshift(record);
    if (records.length > MAX_RECORDS) {
      records.length = MAX_RECORDS;
    }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
    } catch { /* ignore */ }
  }

  private loadRecords(): PotionRecord[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw) as PotionRecord[];
    } catch { /* ignore */ }
    return [];
  }

  private renderRecordList(): void {
    const listEl = document.getElementById('recordPanelList')!;
    const records = this.loadRecords();

    if (records.length === 0) {
      listEl.innerHTML = `
        <div class="record-empty">
          <svg viewBox="0 0 24 24" fill="#6B5B7A"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
          <div>还没有合成记录<br/>快调配你的第一瓶药剂吧！</div>
        </div>
      `;
      return;
    }

    listEl.innerHTML = records.map((r) => {
      const date = new Date(r.timestamp);
      const timeStr = `${date.getMonth() + 1}/${date.getDate()} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
      const dots = r.ingredientColors.map((c) => `<span class="ingredient-dot" style="background:${c};"></span>`).join('');
      return `
        <div class="record-item">
          <div class="record-item-thumb" style="background: radial-gradient(circle, ${this.lightenColor(r.color, 40)}, ${r.color}); box-shadow: 0 0 12px ${r.color}66;">
            <span style="font-size: 18px;">${r.icon}</span>
          </div>
          <div class="record-item-info">
            <div class="record-item-name">${r.name} ${'★'.repeat(r.rarity)}</div>
            <div class="record-item-meta">
              <span class="record-item-ingredients">${dots}</span>
              <span>·</span>
              <span>${timeStr}</span>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  private updateElementArcs(): void {
    const ratio = this.cauldron.getElementRatio();
    this.elementTargets.nature = ratio.nature;
    this.elementTargets.magic = ratio.magic;
    this.elementTargets.darkness = ratio.darkness;
  }

  private updateElementProgress(dt: number): void {
    const speed = 3;
    let changed = false;
    for (const k of ['nature', 'magic', 'darkness'] as const) {
      const diff = this.elementTargets[k] - this.elementCurrent[k];
      if (Math.abs(diff) > 0.001) {
        this.elementCurrent[k] += diff * Math.min(1, dt * speed);
        changed = true;
      }
    }
    if (changed) {
      // Element arcs render every frame anyway
    }
  }

  private renderElementArcs(): void {
    const canvases = document.querySelectorAll<HTMLCanvasElement>('.element-arc');
    const colorMap: Record<string, [string, string]> = {
      nature: ['#48BB78', '#38A169'],
      magic: ['#9F7AEA', '#805AD5'],
      darkness: ['#F56565', '#E53E3E'],
    };

    canvases.forEach((canvas) => {
      const type = canvas.dataset.type as 'nature' | 'magic' | 'darkness';
      const ctx = canvas.getContext('2d')!;
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      const cx = w / 2;
      const cy = h - 2;
      const r = 20;
      const [c1, c2] = colorMap[type];
      const progress = this.elementCurrent[type];

      ctx.strokeStyle = 'rgba(255,255,255,0.1)';
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.arc(cx, cy, r, Math.PI, 0, false);
      ctx.stroke();

      if (progress > 0) {
        const startAngle = Math.PI;
        const endAngle = Math.PI + Math.PI * progress;
        const grad = ctx.createLinearGradient(cx - r, 0, cx + r, 0);
        grad.addColorStop(0, c1);
        grad.addColorStop(1, c2);
        ctx.strokeStyle = grad;
        ctx.shadowColor = c1;
        ctx.shadowBlur = 6;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(cx, cy, r, startAngle, endAngle, false);
        ctx.stroke();
        ctx.shadowBlur = 0;
      }
    });
  }

  public destroy(): void {
    if (this.animFrameId) cancelAnimationFrame(this.animFrameId);
  }
}

window.addEventListener('DOMContentLoaded', () => {
  new GameApp();
});
