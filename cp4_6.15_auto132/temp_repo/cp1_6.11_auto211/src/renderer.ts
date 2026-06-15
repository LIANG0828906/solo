import {
  PERFUMES,
  getPerfumeById,
  FormulaItem,
  SavedFormula
} from './perfumeData';
import { Particle, FlyingParticle } from './animation';

export interface RenderState {
  appState: 'idle' | 'mixing' | 'ready' | 'burning';
  width: number;
  height: number;
  scale: number;
  shelfWidth: number;
  formulaItems: FormulaItem[];
  activePerfumeId: string | null;
  sliderValue: number;
  sliderOpenPulse: number;
  hoverBambooId: string | null;
  hoverButton: string | null;
  mixingProgress: number;
  pestleRotation: number;
  pestleTilt: number;
  particles: Particle[];
  flyingParticles: FlyingParticle[];
  burningElapsed: number;
  curveData: number[];
  savedFormulas: SavedFormula[];
  activeFormulaId: string | null;
  hoverFormulaId: string | null;
  panelPulse: number;
  buttonHover: { [key: string]: boolean };
  deleteConfirmId: string | null;
  sliderDragActive: boolean;
}

export interface UIHit {
  type:
    | 'bamboo'
    | 'slider-track'
    | 'slider-thumb'
    | 'blend-btn'
    | 'panel-light'
    | 'panel-save'
    | 'panel-reset'
    | 'formula-item'
    | 'formula-delete'
    | 'formula-clear'
    | 'none';
  data?: any;
}

const BAMBOO_COUNT = 6;

export function getLayout(width: number, height: number) {
  const shelfW = width < 1600 ? 220 : 280;
  const scale = shelfW / 280;
  const pad = 20 * scale;
  const bambooW = (shelfW - pad * 2 - 12) / 2;
  const bambooH = 110 * scale;
  const bambooGapX = 12 + bambooW;
  const bambooGapY = bambooH + 16;
  const bambooStartY = 90 * scale;
  return {
    shelfW,
    scale,
    pad,
    bambooW,
    bambooH,
    bambooGapX,
    bambooGapY,
    bambooStartY,
    getBamboo: (idx: number) => {
      const col = idx % 2;
      const row = Math.floor(idx / 2);
      return {
        x: pad + col * bambooGapX,
        y: bambooStartY + row * bambooGapY,
        w: bambooW,
        h: bambooH
      };
    },
    getSliderArea: (bambooX: number, bambooY: number, bambooW: number) => ({
      x: bambooX + 6 * scale,
      y: bambooY - 38 * scale,
      w: bambooW - 12 * scale,
      h: 32 * scale
    }),
    getBowl: () => {
      const cx = shelfW + (width - shelfW) / 2;
      const cy = height * 0.55;
      const r = 30 * scale;
      return { cx, cy, r };
    },
    getCenser: () => {
      const cx = shelfW + (width - shelfW) / 2;
      const cy = height * 0.38;
      return { cx, cy };
    },
    getBlendButton: () => {
      const cx = shelfW + (width - shelfW) / 2;
      const cy = height * 0.78;
      return { cx, cy, w: 120 * scale, h: 40 * scale };
    },
    getPanel: () => {
      const cx = shelfW + (width - shelfW) / 2;
      const cy = height * 0.5;
      return { cx, cy, w: 420 * scale, h: 200 * scale };
    },
    getChart: () => {
      const x = shelfW + 30;
      const y = 30;
      const w = Math.min(width - shelfW - 60, 720);
      const h = 130;
      return { x, y, w, h };
    },
    getBarChart: () => {
      const cx = shelfW + (width - shelfW) / 2;
      const cy = height * 0.55;
      const r = 30 * scale;
      return {
        x: cx + r + 50 * scale,
        y: cy - 20,
        w: 180 * scale,
        h: 110,
        bowlCx: cx,
        bowlCy: cy,
        bowlR: r
      };
    },
    getFormulaList: () => {
      const listStartY = bambooStartY + Math.ceil(BAMBOO_COUNT / 2) * bambooGapY + 16;
      return {
        x: pad,
        y: listStartY,
        w: shelfW - pad * 2,
        itemH: 60 * scale
      };
    }
  };
}

export class Renderer {
  ctx: CanvasRenderingContext2D;
  private offscreenCenser: HTMLCanvasElement;
  private offscreenBowl: HTMLCanvasElement;
  private dirty = true;

  constructor(ctx: CanvasRenderingContext2D, width: number, height: number) {
    this.ctx = ctx;
    this.offscreenCenser = document.createElement('canvas');
    this.offscreenBowl = document.createElement('canvas');
    this.prebuildStatic(width, height);
  }

  private prebuildStatic(width: number, height: number) {
    const L = getLayout(width, height);
    const csz = 240 * L.scale;
    this.offscreenCenser.width = csz;
    this.offscreenCenser.height = csz;
    const cc = this.offscreenCenser.getContext('2d')!;
    this.drawCenserBase(cc, csz / 2, csz / 2, L.scale);

    const bsz = 120 * L.scale;
    this.offscreenBowl.width = bsz;
    this.offscreenBowl.height = bsz;
    const bc = this.offscreenBowl.getContext('2d')!;
    this.drawBowlBase(bc, bsz / 2, bsz / 2, L.scale);
    this.dirty = false;
  }

  resize(width: number, height: number) {
    this.prebuildStatic(width, height);
  }

  draw(state: RenderState) {
    const { ctx } = this;
    const { width, height } = state;
    const L = getLayout(width, height);

    ctx.clearRect(0, 0, width, height);

    this.drawBackground(ctx, width, height);
    this.drawShelf(ctx, L, width, height);
    this.drawBamboos(ctx, L, state);
    this.drawActiveSlider(ctx, L, state);
    this.drawCenser(ctx, L, state);
    this.drawBowlArea(ctx, L, state);
    this.drawFlyingParticles(ctx, state.flyingParticles);
    this.drawPestle(ctx, L, state);
    this.drawBlendButton(ctx, L, state);
    this.drawParticles(ctx, state.particles);
    if (state.appState === 'burning') this.drawChart(ctx, L, state);
    this.drawActionPanel(ctx, L, state);
    this.drawFormulaList(ctx, L, state);
  }

  private drawBackground(ctx: CanvasRenderingContext2D, w: number, h: number) {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#2B1B0E');
    g.addColorStop(1, '#1A0F08');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);

    ctx.save();
    ctx.globalAlpha = 0.08;
    for (let i = 0; i < 120; i++) {
      ctx.fillStyle = Math.random() > 0.5 ? '#000' : '#fff';
      ctx.fillRect(Math.random() * w, Math.random() * h, 1, 1);
    }
    ctx.restore();
  }

  private drawShelf(
    ctx: CanvasRenderingContext2D,
    L: ReturnType<typeof getLayout>,
    w: number,
    h: number
  ) {
    ctx.fillStyle = '#5C4033';
    ctx.fillRect(0, 0, L.shelfW, h);

    ctx.save();
    ctx.globalAlpha = 0.15;
    const stripe = 18 * L.scale;
    for (let y = 0; y < h; y += stripe) {
      ctx.fillStyle = '#3A2719';
      ctx.fillRect(0, y, L.shelfW, 1);
    }
    ctx.restore();

    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.fillRect(L.shelfW - 3, 0, 3, h);

    ctx.save();
    ctx.fillStyle = '#F5DEB3';
    ctx.font = `${Math.round(22 * L.scale)}px 'Noto Serif SC', serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('香 料 阁', L.shelfW / 2, 28 * L.scale);

    ctx.strokeStyle = '#D2B48C';
    ctx.lineWidth = 0.8;
    const tw = ctx.measureText('香 料 阁').width + 20;
    ctx.beginPath();
    ctx.moveTo(L.shelfW / 2 - tw / 2, 62 * L.scale);
    ctx.lineTo(L.shelfW / 2 + tw / 2, 62 * L.scale);
    ctx.stroke();
    ctx.restore();
  }

  private drawBamboos(
    ctx: CanvasRenderingContext2D,
    L: ReturnType<typeof getLayout>,
    state: RenderState
  ) {
    for (let i = 0; i < BAMBOO_COUNT; i++) {
      const perfume = PERFUMES[i];
      const r = L.getBamboo(i);
      const isHover = state.hoverBambooId === perfume.id;
      const isActive = state.activePerfumeId === perfume.id;

      ctx.save();
      const scale = isHover || isActive ? 1.03 : 1;
      ctx.translate(r.x + r.w / 2, r.y + r.h / 2);
      ctx.scale(scale, scale);
      ctx.translate(-(r.x + r.w / 2), -(r.y + r.h / 2));

      ctx.fillStyle = 'rgba(210, 180, 140, 0.45)';
      this.roundRect(ctx, r.x, r.y, r.w, r.h, 8);
      ctx.fill();

      ctx.save();
      ctx.beginPath();
      this.roundRect(ctx, r.x, r.y, r.w, r.h, 8);
      ctx.clip();
      const top = r.y + 22;
      const fillH = r.h - 28;
      ctx.fillStyle = perfume.color;
      for (let rr = 0; rr < 40; rr++) {
        const px = r.x + 6 + Math.random() * (r.w - 12);
        const py = top + Math.random() * fillH;
        const sz = 2 + Math.random() * 3;
        ctx.globalAlpha = 0.55 + Math.random() * 0.45;
        ctx.beginPath();
        ctx.arc(px, py, sz, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      ctx.strokeStyle = isActive ? 'rgba(255, 215, 0, 0.85)' : 'rgba(139, 69, 19, 0.7)';
      ctx.lineWidth = isActive ? 1.8 : 1;
      this.roundRect(ctx, r.x, r.y, r.w, r.h, 8);
      ctx.stroke();

      ctx.fillStyle = 'rgba(92, 64, 51, 0.85)';
      ctx.fillRect(r.x, r.y, r.w, 20);
      this.roundRect(ctx, r.x, r.y, r.w, 20, { tl: 8, tr: 8, bl: 0, br: 0 });
      ctx.fill();

      ctx.fillStyle = '#FFF8DC';
      ctx.font = `${Math.round(13 * L.scale)}px 'Noto Serif SC', serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(perfume.name, r.x + r.w / 2, r.y + 10);

      const gx = r.x + r.w - 8;
      const gy = r.y + r.h - 8;
      const curGrams = state.formulaItems.find(f => f.perfumeId === perfume.id)?.grams || 0;
      if (curGrams > 0) {
        ctx.save();
        ctx.fillStyle = '#FFD700';
        ctx.font = `${Math.round(11 * L.scale)}px 'Noto Serif SC', serif`;
        ctx.textAlign = 'right';
        ctx.textBaseline = 'bottom';
        ctx.fillText(`${curGrams.toFixed(1)}g`, gx, gy);
        ctx.restore();
      }
      ctx.restore();
    }
  }

  private drawActiveSlider(
    ctx: CanvasRenderingContext2D,
    L: ReturnType<typeof getLayout>,
    state: RenderState
  ) {
    if (!state.activePerfumeId) return;
    const perfume = getPerfumeById(state.activePerfumeId);
    if (!perfume) return;
    const idx = PERFUMES.findIndex(p => p.id === perfume.id);
    const br = L.getBamboo(idx);
    const a = L.getSliderArea(br.x, br.y, br.w);

    const pulse = state.sliderOpenPulse;
    ctx.save();
    ctx.globalAlpha = Math.min(1, pulse);
    ctx.translate(a.x + a.w / 2, a.y + a.h / 2);
    const s = 0.9 + 0.1 * pulse;
    ctx.scale(s, s);
    ctx.translate(-(a.x + a.w / 2), -(a.y + a.h / 2));

    ctx.fillStyle = 'rgba(43, 27, 14, 0.92)';
    this.roundRect(ctx, a.x, a.y, a.w, a.h, 6);
    ctx.fill();
    ctx.strokeStyle = perfume.color;
    ctx.lineWidth = 1;
    this.roundRect(ctx, a.x, a.y, a.w, a.h, 6);
    ctx.stroke();

    const trackY = a.y + a.h - 14;
    const trackH = 4;
    const trackL = a.x + 10;
    const trackR = a.x + a.w - 10;
    const trackW = trackR - trackL;

    ctx.fillStyle = 'rgba(210, 180, 140, 0.4)';
    ctx.fillRect(trackL, trackY, trackW, trackH);

    const ratio = state.sliderValue / 15;
    ctx.fillStyle = perfume.color;
    ctx.fillRect(trackL, trackY, trackW * ratio, trackH);

    const thumbX = trackL + trackW * ratio;
    const thumbY = trackY + trackH / 2;
    const thumbR = 7;
    ctx.beginPath();
    ctx.arc(thumbX, thumbY, thumbR, 0, Math.PI * 2);
    ctx.fillStyle = perfume.color;
    ctx.fill();
    ctx.strokeStyle = '#FFF8DC';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = '#FFF8DC';
    ctx.font = `${Math.round(11 * L.scale)}px 'Noto Serif SC', serif`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(`${state.sliderValue.toFixed(1)}g / 15g`, a.x + 10, a.y + 6);
    ctx.textAlign = 'right';
    ctx.fillText(`${perfume.name}`, a.x + a.w - 10, a.y + 6);
    ctx.restore();
  }

  private drawCenserBase(ctx: CanvasRenderingContext2D, cx: number, cy: number, scale: number) {
    const topD = 100 * scale;
    const bodyH = 120 * scale;
    const baseW = 130 * scale;
    const r = topD / 2;

    ctx.save();
    const grd = ctx.createLinearGradient(cx, cy - bodyH / 2, cx, cy + bodyH / 2);
    grd.addColorStop(0, '#B87333');
    grd.addColorStop(0.5, '#9B5A26');
    grd.addColorStop(1, '#8B4513');
    ctx.fillStyle = grd;

    ctx.beginPath();
    ctx.moveTo(cx - r, cy - bodyH / 2);
    ctx.bezierCurveTo(cx - r * 1.25, cy - bodyH / 4, cx - r * 1.35, cy + bodyH / 4, cx - baseW / 2, cy + bodyH / 2);
    ctx.lineTo(cx + baseW / 2, cy + bodyH / 2);
    ctx.bezierCurveTo(cx + r * 1.35, cy + bodyH / 4, cx + r * 1.25, cy - bodyH / 4, cx + r, cy - bodyH / 2);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.ellipse(cx, cy - bodyH / 2, r, r * 0.3, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#2B1B0E';
    ctx.fill();
    ctx.strokeStyle = '#5C3317';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.ellipse(cx, cy - bodyH / 2 + 4, r - 3, r * 0.27, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.lineWidth = 0.5;
    for (let i = 0; i < 14; i++) {
      const t = i / 14;
      const x = cx - baseW / 2 + t * baseW;
      const y1 = cy - bodyH / 2 + 20 + Math.sin(t * Math.PI * 3) * 8;
      const y2 = cy + bodyH / 2 - 10;
      ctx.beginPath();
      ctx.moveTo(x, y1);
      ctx.quadraticCurveTo(cx + Math.sin(t * 6) * 10, (y1 + y2) / 2, x, y2);
      ctx.stroke();
    }

    ctx.fillStyle = 'rgba(255, 200, 100, 0.08)';
    for (let i = 0; i < 6; i++) {
      ctx.beginPath();
      const ang = (i / 6) * Math.PI * 2;
      const rx = cx + Math.cos(ang) * r * 0.7;
      const ry = cy - bodyH / 2 + 30 + Math.sin(ang) * 25;
      ctx.arc(rx, ry, 4 * scale, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  private drawCenser(
    ctx: CanvasRenderingContext2D,
    L: ReturnType<typeof getLayout>,
    state: RenderState
  ) {
    const { cx, cy } = L.getCenser();
    const csz = this.offscreenCenser.width;
    const scale = csz / (240 * L.scale);
    const drawR = csz / scale / 2;
    ctx.drawImage(this.offscreenCenser, cx - drawR, cy - drawR, drawR * 2, drawR * 2);

    if (state.appState === 'burning') {
      ctx.save();
      ctx.globalAlpha = 0.85;
      const glow = ctx.createRadialGradient(cx, cy - 60 * L.scale, 4, cx, cy - 60 * L.scale, 50 * L.scale);
      glow.addColorStop(0, 'rgba(255, 160, 60, 0.5)');
      glow.addColorStop(1, 'rgba(255, 160, 60, 0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(cx, cy - 60 * L.scale, 50 * L.scale, 0, Math.PI * 2);
      ctx.fill();

      for (let i = 0; i < 6; i++) {
        const a = state.burningElapsed * 0.001 + i * 1.1;
        const rx = cx + Math.sin(a) * 20 * L.scale;
        const ry = cy - 60 * L.scale - Math.cos(a * 1.3) * 6;
        ctx.fillStyle = `rgba(255, ${120 + i * 20}, 40, ${0.25 + Math.sin(a * 2) * 0.15})`;
        ctx.beginPath();
        ctx.arc(rx, ry, 2 + Math.sin(a * 3) * 0.8, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  private drawBowlBase(ctx: CanvasRenderingContext2D, cx: number, cy: number, scale: number) {
    const r = 30 * scale;
    const rimH = 8 * scale;
    const depth = 20 * scale;
    ctx.save();
    const grd = ctx.createLinearGradient(cx, cy - rimH, cx, cy + depth);
    grd.addColorStop(0, '#9C8362');
    grd.addColorStop(0.5, '#8B7355');
    grd.addColorStop(1, '#5C4033');
    ctx.fillStyle = grd;

    ctx.beginPath();
    ctx.ellipse(cx, cy + depth, r * 0.6, r * 0.2, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(cx - r, cy);
    ctx.quadraticCurveTo(cx - r * 0.8, cy + depth * 1.3, cx - r * 0.6, cy + depth);
    ctx.lineTo(cx + r * 0.6, cy + depth);
    ctx.quadraticCurveTo(cx + r * 0.8, cy + depth * 1.3, cx + r, cy);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#A0896A';
    ctx.beginPath();
    ctx.ellipse(cx, cy, r, rimH, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(58, 35, 20, 0.85)';
    ctx.beginPath();
    ctx.ellipse(cx, cy, r * 0.88, rimH * 0.75, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = 'rgba(0,0,0,0.4)';
    ctx.lineWidth = 0.5;
    for (let i = 0; i < 8; i++) {
      ctx.beginPath();
      const x1 = cx - r * 0.7 + (i / 8) * r * 1.4;
      ctx.moveTo(x1, cy - rimH * 0.5);
      ctx.lineTo(x1 + 4, cy + depth - 2);
      ctx.stroke();
    }
    ctx.restore();
  }

  private drawBowlArea(
    ctx: CanvasRenderingContext2D,
    L: ReturnType<typeof getLayout>,
    state: RenderState
  ) {
    const { cx, cy, r } = L.getBowl();
    const bsz = this.offscreenBowl.width;
    const scaleB = bsz / (120 * L.scale);
    const drawR = bsz / scaleB / 2;
    ctx.drawImage(this.offscreenBowl, cx - drawR, cy - drawR, drawR * 2, drawR * 2);

    const usedItems = state.formulaItems.filter(f => f.grams > 0);
    const total = usedItems.reduce((s, f) => s + f.grams, 0);
    const maxH = r * 0.6;
    const isMixed = state.appState === 'mixing' || state.appState === 'ready' || state.appState === 'burning';
    const mixP = state.appState === 'mixing' ? Math.min(1, state.mixingProgress / 5000) : state.appState === 'idle' ? 0 : 1;

    if (total > 0) {
      const powderH = Math.min(maxH, total * 3 * L.scale);
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(cx, cy, r * 0.85, 6 * L.scale, 0, 0, Math.PI * 2);
      ctx.clip();

      if (isMixed && mixP > 0) {
        const mixedColor = this.interpolateLayeredColor(usedItems, mixP);
        ctx.fillStyle = mixedColor;
      } else {
        let accH = 0;
        const sorted = [...usedItems].sort((a, b) => a.perfumeId.localeCompare(b.perfumeId));
        for (let i = sorted.length - 1; i >= 0; i--) {
          const it = sorted[i];
          const p = getPerfumeById(it.perfumeId)!;
          const layerH = (it.grams / total) * powderH;
          const y0 = cy - accH;
          ctx.fillStyle = p.color;
          ctx.globalAlpha = 0.85;
          ctx.fillRect(cx - r * 0.9, y0 - layerH, r * 1.8, layerH + 4);
          ctx.globalAlpha = 0.3;
          for (let k = 0; k < 30; k++) {
            const px = cx - r * 0.85 + Math.random() * r * 1.7;
            const py = y0 - layerH + Math.random() * layerH;
            ctx.fillStyle = p.color;
            ctx.fillRect(px, py, 1.5, 1.5);
          }
          ctx.globalAlpha = 1;
          accH += layerH;
        }
      }

      if (state.appState === 'mixing') {
        ctx.save();
        ctx.globalCompositeOperation = 'source-atop';
        for (let i = 0; i < 80; i++) {
          const t = state.mixingProgress * 0.006 + i * 0.1;
          const px = cx + Math.cos(t + i) * (r * 0.7);
          const py = cy - Math.sin(t * 0.7 + i * 0.3) * 8;
          ctx.fillStyle = `rgba(74, 55, 40, ${0.4 + Math.sin(t) * 0.2})`;
          ctx.beginPath();
          ctx.arc(px, py, 1.5, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }
      ctx.restore();
    }

    this.drawBarChart(ctx, L, state);
  }

  private interpolateLayeredColor(items: FormulaItem[], t: number): string {
    if (t <= 0) return '#8B7355';
    const target = { r: 74, g: 55, b: 40 };
    if (t >= 1) return `rgb(${target.r},${target.g},${target.b})`;
    let sr = 0, sg = 0, sb = 0;
    const total = items.reduce((s, i) => s + i.grams, 0);
    for (const it of items) {
      const p = getPerfumeById(it.perfumeId);
      if (!p) continue;
      const hex = p.color.replace('#', '');
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);
      const w = it.grams / total;
      sr += r * w; sg += g * w; sb += b * w;
    }
    const r = Math.round(sr * (1 - t) + target.r * t);
    const g = Math.round(sg * (1 - t) + target.g * t);
    const b = Math.round(sb * (1 - t) + target.b * t);
    return `rgb(${r},${g},${b})`;
  }

  private drawBarChart(
    ctx: CanvasRenderingContext2D,
    L: ReturnType<typeof getLayout>,
    state: RenderState
  ) {
    const used = state.formulaItems.filter(f => f.grams > 0);
    const total = used.reduce((s, f) => s + f.grams, 0);
    const { cx, cy, r } = L.getBowl();
    const baseX = cx + r + 30 * L.scale;
    const baseY = cy - 5;
    const maxW = 180 * L.scale;
    const barH = 8;
    const gap = 6;

    ctx.save();
    for (let i = 0; i < used.length; i++) {
      const it = used[i];
      const p = getPerfumeById(it.perfumeId)!;
      const y = baseY - (barH + gap) * (used.length - 1 - i);
      const w = total > 0 ? Math.max(6, (it.grams / total) * maxW) : 0;
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.fillRect(baseX - 1, y - 1, maxW + 2, barH + 2);
      ctx.fillStyle = p.color;
      ctx.fillRect(baseX, y, w, barH);
      ctx.fillStyle = '#FFF8DC';
      ctx.font = `${Math.round(11 * L.scale)}px 'Noto Serif SC', serif`;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${p.name}  ${it.grams.toFixed(1)}g`, baseX + maxW + 8, y + barH / 2);
    }
    ctx.fillStyle = '#FFD700';
    ctx.font = `${Math.round(13 * L.scale)}px 'Noto Serif SC', serif`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'bottom';
    ctx.fillText(`总质量：${total.toFixed(1)}g`, baseX, baseY - (barH + gap) * used.length - 6);
    ctx.restore();
  }

  private drawFlyingParticles(ctx: CanvasRenderingContext2D, particles: FlyingParticle[]) {
    ctx.save();
    for (const p of particles) {
      const a = 1 - Math.abs(p.progress - 0.5) * 1.2;
      ctx.globalAlpha = Math.max(0, Math.min(1, a));
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = Math.max(0, Math.min(1, a * 0.4));
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * 1.6, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  private drawPestle(
    ctx: CanvasRenderingContext2D,
    L: ReturnType<typeof getLayout>,
    state: RenderState
  ) {
    if (state.appState !== 'mixing') return;
    const { cx, cy } = L.getBowl();
    ctx.save();
    ctx.translate(cx, cy - 30 * L.scale);
    const tilt = 20 * Math.PI / 180;
    ctx.rotate(tilt + Math.sin(state.pestleTilt) * 0.15);
    ctx.rotate(state.pestleRotation);

    const stickL = 100 * L.scale;
    const stickW = 5 * L.scale;
    const headR = 14 * L.scale;

    const grd = ctx.createLinearGradient(0, -stickL, 0, headR);
    grd.addColorStop(0, '#E8E8E8');
    grd.addColorStop(0.5, '#C0C0C0');
    grd.addColorStop(1, '#8A8A8A');
    ctx.fillStyle = grd;

    ctx.beginPath();
    ctx.roundRect(-stickW / 2, -stickL, stickW, stickL + stickW, 2);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(0, 0, headR, 0, Math.PI * 2);
    ctx.fillStyle = '#C0C0C0';
    ctx.fill();
    ctx.strokeStyle = '#6B6B6B';
    ctx.lineWidth = 0.8;
    ctx.stroke();

    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.beginPath();
    ctx.arc(-headR * 0.35, -headR * 0.35, headR * 0.35, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  private drawBlendButton(
    ctx: CanvasRenderingContext2D,
    L: ReturnType<typeof getLayout>,
    state: RenderState
  ) {
    if (state.appState !== 'idle') return;
    const { cx, cy, w, h } = L.getBlendButton();
    const used = state.formulaItems.filter(f => f.grams > 0);
    const canClick = used.length > 0;
    const isHover = state.buttonHover['blend'] === true;
    ctx.save();
    const offsetY = isHover && canClick ? -2 : 0;
    const baseColor = canClick ? (isHover ? '#8B4513' : '#B87333') : '#6A5A4A';
    const x = cx - w / 2;
    const y = cy - h / 2 + offsetY;
    ctx.shadowColor = 'rgba(0,0,0,0.45)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetY = 3;
    ctx.fillStyle = baseColor;
    this.roundRect(ctx, x, y, w, h, 6);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = 'rgba(255, 220, 150, 0.4)';
    ctx.lineWidth = 1;
    this.roundRect(ctx, x + 0.5, y + 0.5, w - 1, h - 1, 6);
    ctx.stroke();
    ctx.fillStyle = canClick ? '#FFF8DC' : '#B0A090';
    ctx.font = `600 ${Math.round(16 * L.scale)}px 'Noto Serif SC', serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('合 香', cx, cy + offsetY + 1);
    ctx.restore();
  }

  private drawParticles(ctx: CanvasRenderingContext2D, particles: Particle[]) {
    ctx.save();
    for (const p of particles) {
      ctx.globalAlpha = p.alpha;
      const r = p.radius;
      const grd = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r * 2);
      grd.addColorStop(0, p.color);
      grd.addColorStop(0.5, p.color);
      grd.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grd;
      ctx.beginPath();
      ctx.arc(p.x, p.y, r * 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  private drawChart(
    ctx: CanvasRenderingContext2D,
    L: ReturnType<typeof getLayout>,
    state: RenderState
  ) {
    const { x, y, w, h } = L.getChart();
    ctx.save();
    ctx.globalAlpha = 0.88;
    ctx.fillStyle = 'rgba(26, 15, 8, 0.7)';
    this.roundRect(ctx, x, y, w, h, 10);
    ctx.fill();
    ctx.strokeStyle = 'rgba(210, 180, 140, 0.3)';
    ctx.lineWidth = 1;
    this.roundRect(ctx, x, y, w, h, 10);
    ctx.stroke();

    const padL = 40, padR = 10, padT = 18, padB = 22;
    const plotX = x + padL, plotY = y + padT;
    const plotW = w - padL - padR, plotH = h - padT - padB;

    ctx.strokeStyle = 'rgba(255, 215, 0, 0.2)';
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= 4; i++) {
      const yy = plotY + (i / 4) * plotH;
      ctx.beginPath();
      ctx.moveTo(plotX, yy);
      ctx.lineTo(plotX + plotW, yy);
      ctx.stroke();
    }
    for (let i = 0; i <= 6; i++) {
      const xx = plotX + (i / 6) * plotW;
      ctx.beginPath();
      ctx.moveTo(xx, plotY);
      ctx.lineTo(xx, plotY + plotH);
      ctx.stroke();
    }

    ctx.fillStyle = '#FFF8DC';
    ctx.font = `${10}px 'Noto Serif SC', serif`;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    for (let i = 0; i <= 4; i++) {
      const v = 100 - i * 25;
      ctx.fillText(`${v}%`, plotX - 5, plotY + (i / 4) * plotH);
    }
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    for (let i = 0; i <= 6; i++) {
      const v = i * 10;
      ctx.fillText(`${v}s`, plotX + (i / 6) * plotW, plotY + plotH + 5);
    }

    const data = state.curveData;
    if (data.length > 1) {
      ctx.beginPath();
      const maxSec = 60;
      for (let i = 0; i < data.length; i++) {
        const t = i / maxSec;
        const px = plotX + Math.min(1, t) * plotW;
        const py = plotY + (1 - data[i] / 100) * plotH;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      const lastX = plotX + Math.min(1, (data.length - 1) / maxSec) * plotW;
      const lastY = plotY + plotH;
      ctx.lineTo(lastX, lastY);
      ctx.lineTo(plotX, lastY);
      ctx.closePath();
      const fillGrd = ctx.createLinearGradient(0, plotY, 0, plotY + plotH);
      fillGrd.addColorStop(0, 'rgba(255, 215, 0, 0.45)');
      fillGrd.addColorStop(1, 'rgba(255, 215, 0, 0)');
      ctx.fillStyle = fillGrd;
      ctx.fill();

      ctx.beginPath();
      for (let i = 0; i < data.length; i++) {
        const t = i / maxSec;
        const px = plotX + Math.min(1, t) * plotW;
        const py = plotY + (1 - data[i] / 100) * plotH;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.strokeStyle = '#FFD700';
      ctx.lineWidth = 2;
      ctx.lineJoin = 'round';
      ctx.stroke();

      const lastIdx = data.length - 1;
      const dotX = plotX + Math.min(1, lastIdx / maxSec) * plotW;
      const dotY = plotY + (1 - data[lastIdx] / 100) * plotH;
      ctx.fillStyle = '#FFD700';
      ctx.beginPath();
      ctx.arc(dotX, dotY, 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#FFF8DC';
      ctx.font = `${11}px 'Noto Serif SC', serif`;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'bottom';
      ctx.fillText(` ${data[lastIdx].toFixed(1)}%`, dotX, dotY - 2);
    }

    ctx.fillStyle = '#FFD700';
    ctx.font = `500 ${13}px 'Noto Serif SC', serif`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('香气强度实时曲线', x + 10, y + 6);
    ctx.restore();
  }

  private drawActionPanel(
    ctx: CanvasRenderingContext2D,
    L: ReturnType<typeof getLayout>,
    state: RenderState
  ) {
    if (state.appState !== 'ready') return;
    const { cx, cy, w, h } = L.getPanel();
    const pulse = state.panelPulse;
    ctx.save();
    ctx.globalAlpha = Math.min(1, pulse);
    const sx = 0.95 + 0.05 * pulse;
    ctx.translate(cx, cy);
    ctx.scale(sx, sx);
    ctx.translate(-cx, -cy);

    ctx.shadowColor = 'rgba(0,0,0,0.6)';
    ctx.shadowBlur = 30;
    ctx.fillStyle = 'rgba(43, 27, 14, 0.96)';
    this.roundRect(ctx, cx - w / 2, cy - h / 2, w, h, 14);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = '#D2B48C';
    ctx.lineWidth = 1.5;
    this.roundRect(ctx, cx - w / 2, cy - h / 2, w, h, 14);
    ctx.stroke();

    ctx.fillStyle = '#FFD700';
    ctx.font = `600 ${Math.round(22 * L.scale)}px 'Noto Serif SC', serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('合香已就，君欲何为？', cx, cy - h / 2 + 24 * L.scale);

    const btnW = 110 * L.scale, btnH = 42 * L.scale, gap = 26 * L.scale;
    const totalW = btnW * 3 + gap * 2;
    const startX = cx - totalW / 2;
    const by = cy + 18 * L.scale;
    const labels = [
      { k: 'light', t: '点 燃', c: '#B87333', h: '#8B4513' },
      { k: 'save',  t: '保存配方', c: '#6B8E23', h: '#556B2F' },
      { k: 'reset', t: '重 置', c: '#7B5A3A', h: '#5C4033' }
    ];
    (window as any).__panelBtns = {};
    for (let i = 0; i < 3; i++) {
      const l = labels[i];
      const bx = startX + i * (btnW + gap);
      const isH = state.buttonHover['panel-' + l.k] === true;
      const offY = isH ? -2 : 0;
      ctx.save();
      ctx.shadowColor = 'rgba(0,0,0,0.5)';
      ctx.shadowBlur = 8;
      ctx.shadowOffsetY = 2;
      ctx.fillStyle = isH ? l.h : l.c;
      this.roundRect(ctx, bx, by + offY, btnW, btnH, 8);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.strokeStyle = 'rgba(255, 230, 180, 0.35)';
      ctx.lineWidth = 1;
      this.roundRect(ctx, bx + 0.5, by + offY + 0.5, btnW - 1, btnH - 1, 8);
      ctx.stroke();
      ctx.fillStyle = '#FFF8DC';
      ctx.font = `600 ${Math.round(15 * L.scale)}px 'Noto Serif SC', serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(l.t, bx + btnW / 2, by + offY + btnH / 2 + 1);
      ctx.restore();
      (window as any).__panelBtns[l.k] = { x: bx, y: by, w: btnW, h: btnH };
    }
    ctx.restore();
  }

  private drawFormulaList(
    ctx: CanvasRenderingContext2D,
    L: ReturnType<typeof getLayout>,
    state: RenderState
  ) {
    const area = L.getFormulaList();
    ctx.save();

    ctx.fillStyle = '#F5DEB3';
    ctx.font = `${Math.round(15 * L.scale)}px 'Noto Serif SC', serif`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('藏 香 阁', area.x, area.y);

    ctx.strokeStyle = '#D2B48C';
    ctx.lineWidth = 0.7;
    ctx.beginPath();
    ctx.moveTo(area.x, area.y + 22 * L.scale);
    ctx.lineTo(area.x + area.w, area.y + 22 * L.scale);
    ctx.stroke();

    if (state.savedFormulas.length === 0) {
      ctx.fillStyle = 'rgba(210, 180, 140, 0.6)';
      ctx.font = `${Math.round(11 * L.scale)}px 'Noto Serif SC', serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText('尚无藏香，合香后可保存', area.x + area.w / 2, area.y + 36 * L.scale);
    } else {
      const max = Math.min(state.savedFormulas.length, 6);
      for (let i = 0; i < max; i++) {
        const f = state.savedFormulas[i];
        const iy = area.y + 30 * L.scale + i * (area.itemH + 6);
        const isH = state.hoverFormulaId === f.id;
        const isA = state.activeFormulaId === f.id;

        ctx.fillStyle = isA ? 'rgba(255, 215, 0, 0.15)' : (isH ? 'rgba(210, 180, 140, 0.15)' : 'rgba(0,0,0,0.2)');
        this.roundRect(ctx, area.x, iy, area.w, area.itemH, 6);
        ctx.fill();
        ctx.strokeStyle = isA ? 'rgba(255, 215, 0, 0.6)' : 'rgba(139, 69, 19, 0.5)';
        ctx.lineWidth = 1;
        this.roundRect(ctx, area.x, iy, area.w, area.itemH, 6);
        ctx.stroke();

        ctx.fillStyle = '#FFF8DC';
        ctx.font = `600 ${Math.round(13 * L.scale)}px 'Noto Serif SC', serif`;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText(f.name, area.x + 10, iy + 8);

        ctx.fillStyle = '#D2B48C';
        ctx.font = `${Math.round(10 * L.scale)}px 'Noto Serif SC', serif`;
        ctx.fillText(`${f.totalGrams.toFixed(1)}g`, area.x + 10, iy + area.itemH - 18);

        ctx.fillStyle = '#FFD700';
        ctx.font = `${Math.round(12 * L.scale)}px 'Noto Serif SC', serif`;
        ctx.textAlign = 'right';
        const stars = '★'.repeat(f.score) + '☆'.repeat(5 - f.score);
        ctx.fillText(stars, area.x + area.w - 24, iy + 10);

        ctx.fillStyle = isH ? '#E06060' : '#AA8060';
        ctx.font = `${Math.round(12 * L.scale)}px 'Noto Serif SC', serif`;
        ctx.fillText('×', area.x + area.w - 8, iy + 6);
      }

      const clearY = area.y + 30 * L.scale + max * (area.itemH + 6) + 8;
      ctx.fillStyle = state.buttonHover['clear-all'] ? '#E06060' : '#AA8060';
      ctx.font = `${Math.round(11 * L.scale)}px 'Noto Serif SC', serif`;
      ctx.textAlign = 'center';
      ctx.fillText('— 清空全部藏香 —', area.x + area.w / 2, clearY);
      (window as any).__clearBtn = { x: area.x, y: clearY - 6, w: area.w, h: 20 };
    }
    ctx.restore();
  }

  private roundRect(
    ctx: CanvasRenderingContext2D,
    x: number, y: number, w: number, h: number,
    r: number | { tl: number; tr: number; bl: number; br: number }
  ) {
    const rr = typeof r === 'number' ? { tl: r, tr: r, bl: r, br: r } : r;
    ctx.beginPath();
    ctx.moveTo(x + rr.tl, y);
    ctx.lineTo(x + w - rr.tr, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + rr.tr);
    ctx.lineTo(x + w, y + h - rr.br);
    ctx.quadraticCurveTo(x + w, y + h, x + w - rr.br, y + h);
    ctx.lineTo(x + rr.bl, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - rr.bl);
    ctx.lineTo(x, y + rr.tl);
    ctx.quadraticCurveTo(x, y, x + rr.tl, y);
    ctx.closePath();
  }

  hitTest(state: RenderState, mx: number, my: number): UIHit {
    const { width, height, appState } = state;
    const L = getLayout(width, height);

    if (appState === 'ready') {
      const btns = (window as any).__panelBtns || {};
      const map: Record<string, string> = { light: 'panel-light', save: 'panel-save', reset: 'panel-reset' };
      for (const k of Object.keys(btns)) {
        const b = btns[k];
        if (mx >= b.x && mx <= b.x + b.w && my >= b.y && my <= b.y + b.h) {
          return { type: map[k] as any };
        }
      }
    }

    if (state.activePerfumeId) {
      const idx = PERFUMES.findIndex(p => p.id === state.activePerfumeId);
      if (idx >= 0) {
        const br = L.getBamboo(idx);
        const a = L.getSliderArea(br.x, br.y, br.w);
        if (mx >= a.x && mx <= a.x + a.w && my >= a.y && my <= a.y + a.h) {
          return { type: 'slider-track', data: { area: a } };
        }
      }
    }

    for (let i = 0; i < BAMBOO_COUNT; i++) {
      const perfume = PERFUMES[i];
      const r = L.getBamboo(i);
      if (mx >= r.x && mx <= r.x + r.w && my >= r.y && my <= r.y + r.h) {
        return { type: 'bamboo', data: { id: perfume.id } };
      }
    }

    if (appState === 'idle') {
      const b = L.getBlendButton();
      if (mx >= b.cx - b.w / 2 && mx <= b.cx + b.w / 2 && my >= b.cy - b.h / 2 && my <= b.cy + b.h / 2) {
        return { type: 'blend-btn' };
      }
    }

    const area = L.getFormulaList();
    const max = Math.min(state.savedFormulas.length, 6);
    for (let i = 0; i < max; i++) {
      const f = state.savedFormulas[i];
      const iy = area.y + 30 * L.scale + i * (area.itemH + 6);
      if (mx >= area.x && mx <= area.x + area.w && my >= iy && my <= iy + area.itemH) {
        const isDelX = mx >= area.x + area.w - 20;
        return { type: isDelX ? 'formula-delete' : 'formula-item', data: { id: f.id } };
      }
    }
    const cb = (window as any).__clearBtn;
    if (state.savedFormulas.length > 0 && cb && mx >= cb.x && mx <= cb.x + cb.w && my >= cb.y && my <= cb.y + cb.h) {
      return { type: 'formula-clear' };
    }

    return { type: 'none' };
  }

  getSliderValueFromPoint(state: RenderState, mx: number): number {
    if (!state.activePerfumeId) return 0;
    const L = getLayout(state.width, state.height);
    const idx = PERFUMES.findIndex(p => p.id === state.activePerfumeId);
    if (idx < 0) return 0;
    const br = L.getBamboo(idx);
    const a = L.getSliderArea(br.x, br.y, br.w);
    const trackL = a.x + 10;
    const trackR = a.x + a.w - 10;
    const t = (mx - trackL) / (trackR - trackL);
    const clamped = Math.max(0, Math.min(1, t));
    const steps = Math.round(clamped * 30);
    return steps * 0.5;
  }
}
