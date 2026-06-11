export interface GameRenderState {
  poemLines: string[];
  keywords: number[];
  decomposedBlocks: Array<{ id: string; char: string; sourceIndex: number; owner: string }>;
  ringOrder: Array<{ id: string; char: string; sourceIndex: number; owner: string }>;
  timer: number;
  timerMax: number;
  chatMessages: Array<{ nickname: string; message: string }>;
  category: string;
  revealed: boolean;
  answer: string;
  scoreResult: { score: number; show: boolean } | null;
  achievement: string | null;
  judgeResult: { success: boolean } | null;
}

export interface Animations {
  pulseCharIndex: number | null;
  pulseTime: number;
  shakeBlocks: string[];
  shakeTime: number;
  successGlow: boolean;
  successGlowTime: number;
  failSplash: boolean;
  failSplashTime: number;
  particles: Array<{ x: number; y: number; vy: number; alpha: number; color: string }>;
  ripples: Array<{ x: number; y: number; radius: number; alpha: number }>;
  bounceBlock: string | null;
  bounceTime: number;
  achievementAlpha: number;
}

export interface DragState {
  active: boolean;
  blockId: string | null;
  char: string;
  sourceType: 'poem' | 'decomposed' | 'ring';
  sourceIndex: number;
  mouseX: number;
  mouseY: number;
  offsetX: number;
  offsetY: number;
}

interface Rect { x: number; y: number; w: number; h: number }
interface Circle { cx: number; cy: number; r: number }
interface Point { x: number; y: number }

interface Layout {
  cw: number;
  ch: number;
  isNarrow: boolean;
  s: number;
  title: Rect;
  poem: Rect;
  decompose: Rect;
  ring: Circle;
  ringInnerR: number;
  timer: Circle & { innerR: number };
  chat: Rect;
  judgeBtn: Circle;
  blockW: number;
  blockH: number;
  charSize: number;
  poemPad: number;
}

interface CharSlot {
  index: number;
  x: number;
  y: number;
  w: number;
  h: number;
}

interface BlockSlot {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

function easeOut(t: number): number {
  return 1 - Math.pow(1 - Math.min(Math.max(t, 0), 1), 3);
}

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function computeLayout(cw: number, ch: number): Layout {
  const isNarrow = cw < 768;
  const s = isNarrow ? Math.min(cw / 768, ch / 1200) : Math.min(cw / 1200, ch / 800);
  const blockW = Math.round(80 * s);
  const blockH = Math.round(40 * s);
  const charSize = Math.round(36 * s);
  const poemPad = Math.round(20 * s);

  if (isNarrow) {
    const titleH = Math.round(60 * s);
    const timerR = Math.round(50 * s);
    const timerInner = Math.round(35 * s);
    const poemH = Math.round(220 * s);
    const decomposeH = Math.round(200 * s);
    const ringR = Math.round(80 * s);
    const chatH = Math.round(90 * s);
    const mx = Math.round(16 * s);
    return {
      cw, ch, isNarrow, s,
      title: { x: mx, y: Math.round(8 * s), w: cw - mx * 2 - timerR * 2, h: titleH },
      poem: { x: mx, y: titleH + Math.round(20 * s), w: cw - mx * 2, h: poemH },
      decompose: { x: mx, y: titleH + poemH + Math.round(36 * s), w: cw - mx * 2, h: decomposeH },
      ring: { cx: cw / 2, cy: titleH + poemH + decomposeH + Math.round(60 * s) + ringR, r: ringR },
      ringInnerR: Math.round(30 * s),
      timer: { cx: cw - mx - timerR, cy: Math.round(8 * s) + timerR, r: timerR, innerR: timerInner },
      chat: { x: 0, y: ch - chatH, w: cw, h: chatH },
      judgeBtn: { cx: cw / 2, cy: titleH + poemH + decomposeH + Math.round(60 * s) + ringR, r: Math.round(28 * s) },
      blockW, blockH, charSize, poemPad,
    };
  }

  const titleH = Math.round(80 * s);
  const timerOuter = Math.round(120 * s);
  const timerInner = Math.round(90 * s);
  const poemH = Math.round(260 * s);
  const decomposeH = Math.round(400 * s);
  const decomposeW = Math.round(160 * s);
  const ringR = Math.round(100 * s);
  const chatH = Math.round(120 * s);

  return {
    cw, ch, isNarrow, s,
    title: { x: Math.round(100 * s), y: Math.round(5 * s), w: Math.round(1000 * s), h: titleH },
    poem: { x: decomposeW + Math.round(40 * s), y: titleH + Math.round(20 * s), w: cw - decomposeW - ringR * 2 - Math.round(80 * s), h: poemH },
    decompose: { x: Math.round(20 * s), y: titleH + Math.round(20 * s), w: decomposeW, h: decomposeH },
    ring: { cx: cw - ringR - Math.round(40 * s), cy: ch - chatH - ringR - Math.round(40 * s), r: ringR },
    ringInnerR: Math.round(35 * s),
    timer: { cx: cw - Math.round(60 * s) - timerOuter, cy: Math.round(60 * s) + timerOuter, r: timerOuter, innerR: timerInner },
    chat: { x: 0, y: ch - chatH, w: cw, h: chatH },
    judgeBtn: { cx: cw - ringR - Math.round(40 * s), cy: ch - chatH - ringR - Math.round(40 * s), r: Math.round(35 * s) },
    blockW, blockH, charSize, poemPad,
  };
}

function generateTornEdge(cw: number, ch: number): Point[] {
  const rng = seededRandom(42);
  const pts: Point[] = [];
  const step = 12;
  const depth = 14;

  for (let x = 0; x <= cw; x += step) pts.push({ x, y: rng() * depth });
  for (let y = 0; y <= ch; y += step) pts.push({ x: cw - rng() * depth, y });
  for (let x = cw; x >= 0; x -= step) pts.push({ x, y: ch - rng() * depth });
  for (let y = ch; y >= 0; y -= step) pts.push({ x: rng() * depth, y });

  return pts;
}

function generateCracks(): Point[][] {
  const rng = seededRandom(77);
  const cracks: Point[][] = [];
  for (let i = 0; i < 8; i++) {
    const line: Point[] = [];
    const angle = rng() * Math.PI * 2;
    const len = 0.3 + rng() * 0.6;
    let x = Math.cos(angle) * 0.5;
    let y = Math.sin(angle) * 0.5;
    line.push({ x, y });
    const segs = 3 + Math.floor(rng() * 4);
    for (let j = 0; j < segs; j++) {
      const da = (rng() - 0.5) * 0.8;
      const dx = Math.cos(angle + da) * len / segs;
      const dy = Math.sin(angle + da) * len / segs;
      x += dx;
      y += dy;
      line.push({ x, y });
    }
    cracks.push(line);
  }
  return cracks;
}

export function createRenderer(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext('2d')!;
  let layout = computeLayout(1200, 800);
  let tornEdge = generateTornEdge(1200, 800);
  let cracks = generateCracks();
  let charSlots: CharSlot[] = [];
  let decomposedSlots: BlockSlot[] = [];
  let ringSlots: BlockSlot[] = [];
  let scoreShowStart = 0;
  let prevScoreShow = false;

  function resize() {
    const dpr = window.devicePixelRatio || 1;
    const ww = window.innerWidth;
    const wh = window.innerHeight;
    canvas.width = Math.round(ww * dpr);
    canvas.height = Math.round(wh * dpr);
    canvas.style.width = ww + 'px';
    canvas.style.height = wh + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    layout = computeLayout(ww, wh);
    tornEdge = generateTornEdge(ww, wh);
    cracks = generateCracks();
  }

  function drawTornPaperBg() {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(tornEdge[0].x, tornEdge[0].y);
    for (let i = 1; i < tornEdge.length; i++) ctx.lineTo(tornEdge[i].x, tornEdge[i].y);
    ctx.closePath();
    ctx.fillStyle = '#F5E6C8';
    ctx.fill();
    ctx.strokeStyle = '#C4A882';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();
  }

  function drawTitleBanner() {
    const t = layout.title;
    ctx.save();

    ctx.fillStyle = '#5C3A21';
    ctx.beginPath();
    const r = 6 * layout.s;
    ctx.moveTo(t.x + r, t.y);
    ctx.lineTo(t.x + t.w - r, t.y);
    ctx.arcTo(t.x + t.w, t.y, t.x + t.w, t.y + r, r);
    ctx.lineTo(t.x + t.w, t.y + t.h - r);
    ctx.arcTo(t.x + t.w, t.y + t.h, t.x + t.w - r, t.y + t.h, r);
    ctx.lineTo(t.x + r, t.y + t.h);
    ctx.arcTo(t.x, t.y + t.h, t.x, t.y + t.h - r, r);
    ctx.lineTo(t.x, t.y + r);
    ctx.arcTo(t.x, t.y, t.x + r, t.y, r);
    ctx.closePath();
    ctx.fill();

    const grain = ctx.createLinearGradient(t.x, t.y, t.x, t.y + t.h);
    grain.addColorStop(0, 'rgba(0,0,0,0.05)');
    grain.addColorStop(0.5, 'rgba(255,255,255,0.08)');
    grain.addColorStop(1, 'rgba(0,0,0,0.1)');
    ctx.fillStyle = grain;
    ctx.fill();

    ctx.strokeStyle = '#D4A017';
    ctx.lineWidth = 2 * layout.s;
    ctx.stroke();

    ctx.fillStyle = '#D4A017';
    ctx.font = `bold ${Math.round(48 * layout.s)}px '隶书', 'LiSu', 'STLiti', 'SimLi', serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('诗谜雅集', t.x + t.w / 2, t.y + t.h / 2);
    ctx.restore();
  }

  function drawPoemBoard(state: GameRenderState, anims: Animations) {
    const p = layout.poem;
    const s = layout.s;
    const cs = layout.charSize;
    const pad = layout.poemPad;
    const rollerH = Math.round(22 * s);
    ctx.save();

    ctx.fillStyle = '#8B4513';
    const rollerGrad1 = ctx.createLinearGradient(p.x, p.y, p.x, p.y + rollerH);
    rollerGrad1.addColorStop(0, '#A0623A');
    rollerGrad1.addColorStop(0.5, '#8B4513');
    rollerGrad1.addColorStop(1, '#6B3410');
    ctx.fillStyle = rollerGrad1;
    roundRect(p.x - 10 * s, p.y, p.w + 20 * s, rollerH, 6 * s);
    ctx.fill();

    const bodyY = p.y + rollerH;
    const bodyH = p.h - rollerH * 2;

    const scrollGrad = ctx.createLinearGradient(p.x, bodyY, p.x + p.w, bodyY);
    scrollGrad.addColorStop(0, '#E8D5B0');
    scrollGrad.addColorStop(0.02, '#F5E6C8');
    scrollGrad.addColorStop(0.98, '#F5E6C8');
    scrollGrad.addColorStop(1, '#E8D5B0');
    ctx.fillStyle = scrollGrad;
    ctx.fillRect(p.x, bodyY, p.w, bodyH);

    const stripW = Math.round(30 * s);
    ctx.strokeStyle = 'rgba(180,155,120,0.25)';
    ctx.lineWidth = 0.5;
    for (let sx = p.x + stripW; sx < p.x + p.w; sx += stripW) {
      ctx.beginPath();
      ctx.moveTo(sx, bodyY);
      ctx.lineTo(sx, bodyY + bodyH);
      ctx.stroke();
    }

    const rollerGrad2 = ctx.createLinearGradient(p.x, p.y + p.h - rollerH, p.x, p.y + p.h);
    rollerGrad2.addColorStop(0, '#6B3410');
    rollerGrad2.addColorStop(0.5, '#8B4513');
    rollerGrad2.addColorStop(1, '#A0623A');
    ctx.fillStyle = rollerGrad2;
    roundRect(p.x - 10 * s, p.y + p.h - rollerH, p.w + 20 * s, rollerH, 6 * s);
    ctx.fill();

    charSlots = [];
    const lines = state.poemLines;
    const maxChars = Math.max(...lines.map(l => l.length), 1);
    const lineH = cs + Math.round(16 * s);
    const totalH = lines.length * lineH;
    const startY = bodyY + (bodyH - totalH) / 2 + cs * 0.6;

    ctx.font = `${cs}px '楷体', 'KaiTi', 'STKaiti', 'SimKai', serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    let globalIdx = 0;
    for (let li = 0; li < lines.length; li++) {
      const line = lines[li];
      const charW = cs + Math.round(12 * s);
      const totalW = line.length * charW;
      const startX = p.x + (p.w - totalW) / 2 + charW / 2;

      for (let ci = 0; ci < line.length; ci++) {
        const cx = startX + ci * charW;
        const cy = startY + li * lineH;
        const isKeyword = state.keywords.includes(globalIdx);
        const isPulse = anims.pulseCharIndex === globalIdx && anims.pulseTime < 0.4;
        const slotW = cs + Math.round(6 * s);
        const slotH = cs + Math.round(6 * s);
        const slotX = cx - slotW / 2;
        const slotY = cy - slotH / 2;

        charSlots.push({ index: globalIdx, x: slotX, y: slotY, w: slotW, h: slotH });

        if (isKeyword) {
          ctx.save();
          if (isPulse) {
            const prog = anims.pulseTime / 0.4;
            const alpha = 1 - prog;
            const expand = prog * 8 * s;
            ctx.shadowColor = `rgba(255,165,0,${alpha})`;
            ctx.shadowBlur = 20 * s + expand;
            ctx.strokeStyle = `rgba(255,165,0,${alpha})`;
            ctx.lineWidth = 3 * s;
            ctx.strokeRect(slotX - expand, slotY - expand, slotW + expand * 2, slotH + expand * 2);
          }
          ctx.strokeStyle = '#5C3A21';
          ctx.lineWidth = 2.5 * s;
          ctx.strokeRect(slotX, slotY, slotW, slotH);
          ctx.restore();
          ctx.fillStyle = '#3A2E1E';
        } else {
          ctx.fillStyle = '#A08060';
        }

        ctx.fillText(line[ci], cx, cy);
        globalIdx++;
      }
    }

    if (state.category) {
      ctx.save();
      ctx.font = `${Math.round(18 * s)}px '楷体', 'KaiTi', 'STKaiti', serif`;
      ctx.fillStyle = '#8B6914';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'top';
      ctx.fillText(`谜目：${state.category}`, p.x + p.w - pad, p.y + rollerH + 6 * s);
      ctx.restore();
    }

    ctx.restore();
  }

  function drawDecomposeArea(state: GameRenderState, anims: Animations) {
    const d = layout.decompose;
    const s = layout.s;
    const bw = layout.blockW;
    const bh = layout.blockH;
    ctx.save();

    ctx.fillStyle = '#D4B896';
    roundRect(d.x, d.y, d.w, d.h, 4 * s);
    ctx.fill();

    const stripW = Math.round(38 * s);
    ctx.strokeStyle = 'rgba(160,130,90,0.35)';
    ctx.lineWidth = 0.5;
    for (let sx = d.x + stripW; sx < d.x + d.w; sx += stripW) {
      ctx.beginPath();
      ctx.moveTo(sx, d.y);
      ctx.lineTo(sx, d.y + d.h);
      ctx.stroke();
    }

    ctx.strokeStyle = '#5C3A21';
    ctx.lineWidth = 2 * s;
    roundRect(d.x, d.y, d.w, d.h, 4 * s);
    ctx.stroke();

    ctx.fillStyle = '#5C3A21';
    ctx.font = `${Math.round(16 * s)}px '楷体', 'KaiTi', 'STKaiti', serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('拆解区', d.x + d.w / 2, d.y + 6 * s);

    decomposedSlots = [];
    const startX = d.x + (d.w - bw * 2 - 4 * s) / 2;
    const startY = d.y + Math.round(30 * s);
    const gap = 2 * s;

    for (let i = 0; i < state.decomposedBlocks.length; i++) {
      const block = state.decomposedBlocks[i];
      const col = i % 2;
      const row = Math.floor(i / 2);
      const bx = startX + col * (bw + gap);
      const by = startY + row * (bh + gap * 2);
      const isShaking = anims.shakeBlocks.includes(block.id) && anims.shakeTime < 0.3;
      const isBouncing = anims.bounceBlock === block.id && anims.bounceTime < 0.3;
      const shakeOffset = isShaking ? (Math.sin(anims.shakeTime * 40) * 4 * s) : 0;
      const bounceOffset = isBouncing ? (-Math.abs(Math.sin(anims.bounceTime * Math.PI / 0.3)) * 5 * s) : 0;

      const dx = bx + shakeOffset;
      const dy = by + bounceOffset;

      ctx.save();
      if (isShaking) {
        ctx.fillStyle = '#8B2500';
      } else {
        const bGrad = ctx.createLinearGradient(dx, dy, dx, dy + bh);
        bGrad.addColorStop(0, '#E8D5A8');
        bGrad.addColorStop(1, '#C4A870');
        ctx.fillStyle = bGrad;
      }
      roundRect(dx, dy, bw, bh, 3 * s);
      ctx.fill();
      ctx.strokeStyle = '#5C3A21';
      ctx.lineWidth = 1 * s;
      roundRect(dx, dy, bw, bh, 3 * s);
      ctx.stroke();

      ctx.fillStyle = isShaking ? '#FFF' : '#3A2E1E';
      ctx.font = `bold ${Math.round(22 * s)}px '楷体', 'KaiTi', 'STKaiti', serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(block.char, dx + bw / 2, dy + bh / 2);
      ctx.restore();

      decomposedSlots.push({ id: block.id, x: bx, y: by, w: bw, h: bh });
    }

    ctx.restore();
  }

  function drawRecomposeArea(state: GameRenderState, anims: Animations) {
    const ring = layout.ring;
    const s = layout.s;
    const bw = layout.blockW;
    const bh = layout.blockH;
    ctx.save();

    const isFail = anims.failSplash && anims.failSplashTime < 0.5;
    const isSuccess = anims.successGlow && anims.successGlowTime < 2;

    const grad = ctx.createRadialGradient(ring.cx, ring.cy, 0, ring.cx, ring.cy, ring.r);
    if (isFail) {
      grad.addColorStop(0, '#8A8A8A');
      grad.addColorStop(1, '#5A5A5A');
    } else {
      grad.addColorStop(0, '#F0FFF0');
      grad.addColorStop(0.7, '#9ACD32');
      grad.addColorStop(1, '#7EB830');
    }

    ctx.beginPath();
    ctx.arc(ring.cx, ring.cy, ring.r, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();

    if (isSuccess) {
      const glowAlpha = Math.max(0, 1 - anims.successGlowTime / 2);
      ctx.shadowColor = `rgba(0,255,255,${glowAlpha * 0.8})`;
      ctx.shadowBlur = 30 * s;
      ctx.beginPath();
      ctx.arc(ring.cx, ring.cy, ring.r, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(0,255,255,${glowAlpha})`;
      ctx.lineWidth = 4 * s;
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    ctx.beginPath();
    ctx.arc(ring.cx, ring.cy, ring.r, 0, Math.PI * 2);
    ctx.strokeStyle = '#5C3A21';
    ctx.lineWidth = 2.5 * s;
    ctx.stroke();

    const holeR = ring.r * 0.18;
    ctx.beginPath();
    ctx.arc(ring.cx, ring.cy, holeR, 0, Math.PI * 2);
    ctx.fillStyle = isFail ? '#444' : '#F5E6C8';
    ctx.fill();
    ctx.strokeStyle = '#5C3A21';
    ctx.lineWidth = 1.5 * s;
    ctx.stroke();

    const decorR = ring.r * 0.95;
    ctx.beginPath();
    ctx.arc(ring.cx, ring.cy, decorR, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(92,58,33,0.2)';
    ctx.lineWidth = 1 * s;
    ctx.stroke();

    ringSlots = [];
    const numBlocks = state.ringOrder.length;
    const ringBlockR = ring.r * 0.65;

    for (let i = 0; i < numBlocks; i++) {
      const block = state.ringOrder[i];
      const angle = (Math.PI * 2 * i / Math.max(numBlocks, 1)) - Math.PI / 2;
      const bx = ring.cx + Math.cos(angle) * ringBlockR - bw / 2;
      const by = ring.cy + Math.sin(angle) * ringBlockR - bh / 2;
      const isShaking = anims.shakeBlocks.includes(block.id) && anims.shakeTime < 0.3;
      const shakeOffset = isShaking ? (Math.sin(anims.shakeTime * 40) * 4 * s) : 0;

      ctx.save();
      ctx.translate(bx + bw / 2 + shakeOffset, by + bh / 2);
      if (isShaking) {
        ctx.fillStyle = '#8B2500';
      } else {
        const bGrad = ctx.createLinearGradient(-bw / 2, -bh / 2, -bw / 2, bh / 2);
        bGrad.addColorStop(0, '#E8D5A8');
        bGrad.addColorStop(1, '#C4A870');
        ctx.fillStyle = bGrad;
      }
      roundRect(-bw / 2, -bh / 2, bw, bh, 3 * s);
      ctx.fill();
      ctx.strokeStyle = '#5C3A21';
      ctx.lineWidth = 1 * s;
      roundRect(-bw / 2, -bh / 2, bw, bh, 3 * s);
      ctx.stroke();

      ctx.fillStyle = isShaking ? '#FFF' : '#3A2E1E';
      ctx.font = `bold ${Math.round(20 * s)}px '楷体', 'KaiTi', 'STKaiti', serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(block.char, 0, 0);
      ctx.restore();

      ringSlots.push({ id: block.id, x: bx, y: by, w: bw, h: bh });
    }

    drawJudgeButton();

    if (isFail) {
      const splashAlpha = Math.max(0, 1 - anims.failSplashTime / 0.5);
      ctx.fillStyle = `rgba(180,20,20,${splashAlpha * 0.6})`;
      const rng = seededRandom(99);
      for (let i = 0; i < 12; i++) {
        const sa = rng() * Math.PI * 2;
        const sr = rng() * ring.r * 0.8;
        const sx = ring.cx + Math.cos(sa) * sr;
        const sy = ring.cy + Math.sin(sa) * sr;
        const ss = (5 + rng() * 15) * s * (1 - anims.failSplashTime / 0.5);
        ctx.beginPath();
        ctx.arc(sx, sy, ss, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.restore();
  }

  function drawJudgeButton() {
    const btn = layout.judgeBtn;
    const s = layout.s;
    ctx.save();

    const grad = ctx.createRadialGradient(btn.cx, btn.cy, 0, btn.cx, btn.cy, btn.r);
    grad.addColorStop(0, '#D4A017');
    grad.addColorStop(1, '#8B6914');
    ctx.beginPath();
    ctx.arc(btn.cx, btn.cy, btn.r, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.strokeStyle = '#5C3A21';
    ctx.lineWidth = 2 * s;
    ctx.stroke();

    ctx.fillStyle = '#3A2E1E';
    ctx.font = `bold ${Math.round(16 * s)}px '楷体', 'KaiTi', 'STKaiti', serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('请君', btn.cx, btn.cy - 8 * s);
    ctx.fillText('判断', btn.cx, btn.cy + 10 * s);
    ctx.restore();
  }

  function drawTimer(state: GameRenderState) {
    const t = layout.timer;
    const s = layout.s;
    ctx.save();

    ctx.beginPath();
    ctx.arc(t.cx, t.cy, t.r, 0, Math.PI * 2);
    ctx.fillStyle = '#D4B896';
    ctx.fill();

    ctx.beginPath();
    ctx.arc(t.cx, t.cy, t.innerR, 0, Math.PI * 2);
    ctx.fillStyle = '#F5E6C8';
    ctx.fill();

    const frac = Math.max(0, state.timer / Math.max(state.timerMax, 1));
    const startAngle = -Math.PI / 2;
    const endAngle = startAngle + Math.PI * 2 * frac;

    ctx.beginPath();
    ctx.arc(t.cx, t.cy, (t.r + t.innerR) / 2, startAngle, endAngle);
    ctx.lineWidth = t.r - t.innerR;
    ctx.strokeStyle = '#3E2723';
    ctx.lineCap = 'butt';
    ctx.stroke();

    for (const crack of cracks) {
      ctx.beginPath();
      const firstPt = crack[0];
      ctx.moveTo(
        t.cx + firstPt.x * t.innerR * 1.6,
        t.cy + firstPt.y * t.innerR * 1.6
      );
      for (let i = 1; i < crack.length; i++) {
        ctx.lineTo(
          t.cx + crack[i].x * t.innerR * 1.6,
          t.cy + crack[i].y * t.innerR * 1.6
        );
      }
      ctx.strokeStyle = 'rgba(62,39,35,0.4)';
      ctx.lineWidth = 1.2 * s;
      ctx.stroke();
    }

    ctx.beginPath();
    ctx.arc(t.cx, t.cy, t.r, 0, Math.PI * 2);
    ctx.strokeStyle = '#5C3A21';
    ctx.lineWidth = 2 * s;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(t.cx, t.cy, t.innerR, 0, Math.PI * 2);
    ctx.strokeStyle = '#5C3A21';
    ctx.lineWidth = 1.5 * s;
    ctx.stroke();

    ctx.fillStyle = '#3E2723';
    ctx.font = `bold ${Math.round(24 * s)}px '楷体', 'KaiTi', serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(Math.ceil(state.timer)), t.cx, t.cy);
    ctx.restore();
  }

  function drawChatBar(state: GameRenderState) {
    const c = layout.chat;
    const s = layout.s;
    ctx.save();

    ctx.fillStyle = 'rgba(47,47,47,0.85)';
    ctx.fillRect(c.x, c.y, c.w, c.h);

    ctx.strokeStyle = '#5C3A21';
    ctx.lineWidth = 4 * s;
    ctx.strokeRect(c.x, c.y, c.w, c.h);

    ctx.strokeStyle = '#5C3A21';
    ctx.lineWidth = 2 * s;
    ctx.strokeRect(c.x + 4 * s, c.y + 4 * s, c.w - 8 * s, c.h - 8 * s);

    ctx.fillStyle = '#F0E68C';
    ctx.font = `${Math.round(16 * s)}px '草书', 'STCaiyun', 'FangSong', 'STFangsong', serif`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';

    const maxLines = Math.floor((c.h - 16 * s) / (20 * s));
    const startIdx = Math.max(0, state.chatMessages.length - maxLines);
    const msgX = c.x + 12 * s;
    let msgY = c.y + 8 * s;

    for (let i = startIdx; i < state.chatMessages.length; i++) {
      const msg = state.chatMessages[i];
      const text = `${msg.nickname}：${msg.message}`;
      ctx.fillText(text, msgX, msgY, c.w - 24 * s);
      msgY += 20 * s;
    }
    ctx.restore();
  }

  function drawDragGhost(drag: DragState) {
    if (!drag.active) return;
    const s = layout.s;
    const bw = layout.blockW;
    const bh = layout.blockH;
    ctx.save();
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = '#E8D5A8';
    roundRect(drag.mouseX - drag.offsetX, drag.mouseY - drag.offsetY, bw, bh, 3 * s);
    ctx.fill();
    ctx.strokeStyle = '#5C3A21';
    ctx.lineWidth = 1 * s;
    roundRect(drag.mouseX - drag.offsetX, drag.mouseY - drag.offsetY, bw, bh, 3 * s);
    ctx.stroke();
    ctx.fillStyle = '#3A2E1E';
    ctx.font = `bold ${Math.round(22 * s)}px '楷体', 'KaiTi', 'STKaiti', serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(drag.char, drag.mouseX - drag.offsetX + bw / 2, drag.mouseY - drag.offsetY + bh / 2);
    ctx.restore();
  }

  function drawParticles(anims: Animations) {
    ctx.save();
    for (const p of anims.particles) {
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawRipples(anims: Animations) {
    ctx.save();
    for (const r of anims.ripples) {
      ctx.globalAlpha = Math.max(0, r.alpha);
      ctx.strokeStyle = 'rgba(212,160,23,0.6)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawScorePanel(state: GameRenderState) {
    if (!state.scoreResult || !state.scoreResult.show) {
      prevScoreShow = false;
      return;
    }
    if (!prevScoreShow) {
      scoreShowStart = performance.now();
      prevScoreShow = true;
    }
    const elapsed = (performance.now() - scoreShowStart) / 1000;
    const progress = easeOut(elapsed / 0.6);
    const s = layout.s;
    const pw = Math.round(360 * s) * progress;
    const ph = Math.round(240 * s) * progress;
    const px = (layout.cw - pw) / 2;
    const py = (layout.ch - ph) / 2;
    const r = 12 * s * progress;

    ctx.save();
    ctx.globalAlpha = Math.min(1, progress * 1.5);

    ctx.shadowColor = 'rgba(0,0,0,0.3)';
    ctx.shadowBlur = 20 * s;
    ctx.fillStyle = '#F5E6C8';
    roundRect(px, py, pw, ph, r);
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.strokeStyle = '#5C3A21';
    ctx.lineWidth = 2 * s;
    roundRect(px, py, pw, ph, r);
    ctx.stroke();

    if (progress > 0.5) {
      const textAlpha = (progress - 0.5) * 2;
      ctx.globalAlpha = textAlpha;
      ctx.fillStyle = '#5C3A21';
      ctx.font = `bold ${Math.round(28 * s)}px '楷体', 'KaiTi', 'STKaiti', serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('评分', px + pw / 2, py + ph * 0.25);

      ctx.font = `bold ${Math.round(48 * s)}px '楷体', 'KaiTi', 'STKaiti', serif`;
      ctx.fillStyle = '#D4A017';
      ctx.fillText(`${state.scoreResult.score}`, px + pw / 2, py + ph * 0.55);

      ctx.font = `${Math.round(20 * s)}px '楷体', 'KaiTi', 'STKaiti', serif`;
      ctx.fillStyle = '#5C3A21';
      ctx.fillText(`谜底：${state.answer}`, px + pw / 2, py + ph * 0.8);
    }
    ctx.restore();
  }

  function drawAchievement(anims: Animations) {
    if (anims.achievementAlpha <= 0) return;
    const s = layout.s;
    const cx = layout.cw / 2;
    const cy = layout.ch / 2;
    const size = Math.round(80 * s);

    ctx.save();
    ctx.globalAlpha = anims.achievementAlpha;

    ctx.fillStyle = '#C8102E';
    ctx.beginPath();
    const sides = 4;
    const rot = Math.PI / 4;
    for (let i = 0; i <= sides; i++) {
      const angle = rot + (Math.PI * 2 * i / sides);
      const px = cx + Math.cos(angle) * size;
      const py = cy + Math.sin(angle) * size;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = '#D4A017';
    ctx.lineWidth = 3 * s;
    ctx.stroke();

    ctx.fillStyle = '#D4A017';
    ctx.font = `bold ${Math.round(20 * s)}px '楷体', 'KaiTi', 'STKaiti', serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('诗仙初现', cx, cy);

    ctx.restore();
  }

  function drawRevealedAnswer(state: GameRenderState) {
    if (!state.revealed) return;
    const s = layout.s;
    const p = layout.poem;
    ctx.save();
    ctx.fillStyle = 'rgba(245,230,200,0.85)';
    const boxW = Math.round(300 * s);
    const boxH = Math.round(60 * s);
    const bx = p.x + (p.w - boxW) / 2;
    const by = p.y + p.h - boxH - Math.round(10 * s);
    roundRect(bx, by, boxW, boxH, 6 * s);
    ctx.fill();
    ctx.strokeStyle = '#5C3A21';
    ctx.lineWidth = 1.5 * s;
    roundRect(bx, by, boxW, boxH, 6 * s);
    ctx.stroke();

    ctx.fillStyle = '#8B2500';
    ctx.font = `bold ${Math.round(24 * s)}px '楷体', 'KaiTi', 'STKaiti', serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`谜底：${state.answer}`, bx + boxW / 2, by + boxH / 2);
    ctx.restore();
  }

  function roundRect(x: number, y: number, w: number, h: number, r: number) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.arcTo(x + w, y, x + w, y + r, r);
    ctx.lineTo(x + w, y + h - r);
    ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    ctx.lineTo(x + r, y + h);
    ctx.arcTo(x, y + h, x, y + h - r, r);
    ctx.lineTo(x, y + r);
    ctx.arcTo(x, y, x + r, y, r);
    ctx.closePath();
  }

  function render(state: GameRenderState, anims: Animations, drag: DragState) {
    ctx.clearRect(0, 0, layout.cw, layout.ch);
    drawTornPaperBg();
    drawTitleBanner();
    drawPoemBoard(state, anims);
    drawDecomposeArea(state, anims);
    drawRecomposeArea(state, anims);
    drawTimer(state);
    drawChatBar(state);
    drawRevealedAnswer(state);
    drawRipples(anims);
    drawParticles(anims);
    drawDragGhost(drag);
    drawScorePanel(state);
    drawAchievement(anims);
  }

  function hitTestPoem(x: number, y: number, _state: GameRenderState): number {
    for (const slot of charSlots) {
      if (x >= slot.x && x <= slot.x + slot.w && y >= slot.y && y <= slot.y + slot.h) {
        return slot.index;
      }
    }
    return -1;
  }

  function hitTestDecomposed(x: number, y: number, _state: GameRenderState): string | null {
    for (const slot of decomposedSlots) {
      if (x >= slot.x && x <= slot.x + slot.w && y >= slot.y && y <= slot.y + slot.h) {
        return slot.id;
      }
    }
    return null;
  }

  function hitTestRing(x: number, y: number, _state: GameRenderState): string | null {
    for (const slot of ringSlots) {
      if (x >= slot.x && x <= slot.x + slot.w && y >= slot.y && y <= slot.y + slot.h) {
        return slot.id;
      }
    }
    return null;
  }

  function hitTestJudgeButton(x: number, y: number): boolean {
    const btn = layout.judgeBtn;
    const dx = x - btn.cx;
    const dy = y - btn.cy;
    return dx * dx + dy * dy <= btn.r * btn.r;
  }

  function hitTestDecomposeArea(x: number, y: number): boolean {
    const d = layout.decompose;
    return x >= d.x && x <= d.x + d.w && y >= d.y && y <= d.y + d.h;
  }

  function hitTestRingArea(x: number, y: number): boolean {
    const ring = layout.ring;
    const dx = x - ring.cx;
    const dy = y - ring.cy;
    return dx * dx + dy * dy <= ring.r * ring.r;
  }

  resize();

  return {
    render,
    resize,
    hitTestPoem,
    hitTestDecomposed,
    hitTestRing,
    hitTestJudgeButton,
    hitTestDecomposeArea,
    hitTestRingArea,
  };
}
