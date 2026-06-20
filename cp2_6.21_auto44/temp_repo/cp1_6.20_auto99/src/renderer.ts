import { GameStateSnapshot, Tile, BUILDINGS, Particle } from './types';

const TERRAIN_COLORS: Record<string, { base: string; accent: string }> = {
  grass:    { base: '#90C567', accent: '#7BAE52' },
  forest:   { base: '#3E8948', accent: '#2E6B37' },
  river:    { base: '#6EC1E4', accent: '#4FA8D0' },
  mountain: { base: '#8C8C8C', accent: '#6B6B6B' }
};

export interface ViewTransform {
  scale: number;
  offsetX: number;
  offsetY: number;
}

export class Renderer {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  dpr: number;
  tileSize = 80;
  view: ViewTransform = { scale: 1, offsetX: 0, offsetY: 0 };
  particles: Particle[] = [];
  shakeT = 0;
  shakeAmp = 0;
  raf = 0;
  lastSnap: GameStateSnapshot | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false })!;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    const { clientWidth: w, clientHeight: h } = this.canvas;
    this.canvas.width = w * this.dpr;
    this.canvas.height = h * this.dpr;
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
  }

  setView(v: ViewTransform) {
    this.view = { ...v };
  }

  getView(): ViewTransform { return { ...this.view }; }

  setShake(amp: number, durationMs = 400) {
    this.shakeAmp = amp;
    this.shakeT = durationMs;
  }

  addBuildParticles(tx: number, ty: number) {
    const { x, y } = this.tileToScreen(tx, ty);
    const colors = ['#8B6F47', '#A0522D', '#D4A373', '#D2691E'];
    for (let i = 0; i < 18; i++) {
      this.particles.push({
        id: 'p' + Math.random(),
        x: x + this.tileSize / 2 + (Math.random() - 0.5) * 30,
        y: y + this.tileSize - 10,
        vx: (Math.random() - 0.5) * 4,
        vy: -Math.random() * 5 - 1,
        life: 0, maxLife: 600 + Math.random() * 400,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 3 + Math.random() * 4,
        kind: 'dirt'
      });
    }
  }

  addSparkParticles(tx: number, ty: number, color = '#FFD700') {
    const { x, y } = this.tileToScreen(tx, ty);
    for (let i = 0; i < 10; i++) {
      this.particles.push({
        id: 's' + Math.random(),
        x: x + this.tileSize / 2,
        y: y + this.tileSize / 2,
        vx: (Math.random() - 0.5) * 6,
        vy: (Math.random() - 0.5) * 6 - 1,
        life: 0, maxLife: 400 + Math.random() * 300,
        color, size: 2 + Math.random() * 3, kind: 'spark'
      });
    }
  }

  worldBounds(snap: GameStateSnapshot): { w: number; h: number } {
    return { w: snap.cols * this.tileSize, h: snap.rows * this.tileSize };
  }

  screenToTile(sx: number, sy: number): { x: number; y: number } {
    const vw = this.canvas.clientWidth, vh = this.canvas.clientHeight;
    let ox = this.view.offsetX, oy = this.view.offsetY;
    if (this.shakeT > 0) {
      ox += (Math.random() - 0.5) * this.shakeAmp;
      oy += (Math.random() - 0.5) * this.shakeAmp;
    }
    const cx = (sx - vw / 2) / this.view.scale - ox;
    const cy = (sy - vh / 2) / this.view.scale - oy;
    return { x: Math.floor(cx / this.tileSize), y: Math.floor(cy / this.tileSize) };
  }

  tileToScreen(tx: number, ty: number): { x: number; y: number } {
    const vw = this.canvas.clientWidth, vh = this.canvas.clientHeight;
    const cx = tx * this.tileSize + this.view.offsetX;
    const cy = ty * this.tileSize + this.view.offsetY;
    return { x: cx * this.view.scale + vw / 2, y: cy * this.view.scale + vh / 2 };
  }

  centerMap(snap: GameStateSnapshot) {
    this.view.offsetX = -(snap.cols * this.tileSize) / 2;
    this.view.offsetY = -(snap.rows * this.tileSize) / 2;
  }

  clampView(snap: GameStateSnapshot) {
    const vw = this.canvas.clientWidth, vh = this.canvas.clientHeight;
    const mapW = snap.cols * this.tileSize, mapH = snap.rows * this.tileSize;
    const minOX = -mapW / 2 - (mapW - vw / this.view.scale) / 2;
    const maxOX = -mapW / 2 + (mapW - vw / this.view.scale) / 2 + mapW;
    const minOY = -mapH / 2 - (mapH - vh / this.view.scale) / 2;
    const maxOY = -mapH / 2 + (mapH - vh / this.view.scale) / 2 + mapH;
    if (mapW * this.view.scale < vw) {
      this.view.offsetX = -mapW / 2;
    } else {
      this.view.offsetX = Math.min(maxOX, Math.max(minOX, this.view.offsetX + mapW / 2) - mapW / 2);
    }
    if (mapH * this.view.scale < vh) {
      this.view.offsetY = -mapH / 2;
    } else {
      this.view.offsetY = Math.min(maxOY, Math.max(minOY, this.view.offsetY + mapH / 2) - mapH / 2);
    }
  }

  startLoop(getSnapshot: () => GameStateSnapshot | null) {
    let last = performance.now();
    const tick = (t: number) => {
      const dt = Math.min(50, t - last); last = t;
      const snap = getSnapshot();
      if (snap) this.lastSnap = snap;
      this.updateParticles(dt);
      if (this.shakeT > 0) this.shakeT = Math.max(0, this.shakeT - dt);
      this.render(snap);
      this.raf = requestAnimationFrame(tick);
    };
    this.raf = requestAnimationFrame(tick);
  }

  stopLoop() { cancelAnimationFrame(this.raf); }

  updateParticles(dt: number) {
    const g = 0.015;
    this.particles = this.particles.filter(p => {
      p.life += dt;
      if (p.life >= p.maxLife) return false;
      p.vy += g * dt;
      p.x += p.vx * (dt / 16);
      p.y += p.vy * (dt / 16);
      return true;
    });
  }

  render(snap: GameStateSnapshot | null) {
    const ctx = this.ctx;
    const w = this.canvas.clientWidth, h = this.canvas.clientHeight;
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#87CEEB');
    grad.addColorStop(0.65, '#D8F0FF');
    grad.addColorStop(1, '#FFF8DC');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
    this._drawClouds(w, h);

    if (!snap) return;
    ctx.save();
    let shX = 0, shY = 0;
    if (this.shakeT > 0) {
      shX = (Math.random() - 0.5) * this.shakeAmp;
      shY = (Math.random() - 0.5) * this.shakeAmp;
    }
    ctx.translate(w / 2 + shX, h / 2 + shY);
    ctx.scale(this.view.scale, this.view.scale);
    ctx.translate(this.view.offsetX, this.view.offsetY);

    for (let y = 0; y < snap.rows; y++) {
      for (let x = 0; x < snap.cols; x++) {
        const tile = snap.map[y][x];
        this._drawTile(tile);
      }
    }
    ctx.strokeStyle = 'rgba(92, 64, 51, 0.25)';
    ctx.lineWidth = 1.5;
    for (let y = 0; y <= snap.rows; y++) {
      ctx.beginPath();
      ctx.moveTo(0, y * this.tileSize);
      ctx.lineTo(snap.cols * this.tileSize, y * this.tileSize);
      ctx.stroke();
    }
    for (let x = 0; x <= snap.cols; x++) {
      ctx.beginPath();
      ctx.moveTo(x * this.tileSize, 0);
      ctx.lineTo(x * this.tileSize, snap.rows * this.tileSize);
      ctx.stroke();
    }
    for (let y = 0; y < snap.rows; y++) {
      for (let x = 0; x < snap.cols; x++) {
        const tile = snap.map[y][x];
        if (tile.building) this._drawBuilding(tile);
      }
    }
    this._drawParticles(ctx);
    ctx.restore();
  }

  _drawClouds(w: number, h: number) {
    const ctx = this.ctx;
    const t = Date.now() / 50000;
    ctx.globalAlpha = 0.55;
    ctx.fillStyle = '#FFFFFF';
    for (let i = 0; i < 5; i++) {
      const cx = ((i * 223 + t * 180) % (w + 200)) - 100;
      const cy = 50 + i * 38;
      this._blurryEllipse(cx, cy, 58 + i * 4, 22 + i * 2, ctx);
      this._blurryEllipse(cx + 30, cy + 4, 40, 18, ctx);
      this._blurryEllipse(cx - 22, cy + 2, 36, 16, ctx);
    }
    ctx.globalAlpha = 1;
  }

  _blurryEllipse(x: number, y: number, rx: number, ry: number, ctx: CanvasRenderingContext2D) {
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  _drawTile(tile: Tile) {
    const ctx = this.ctx;
    const ts = this.tileSize;
    const px = tile.x * ts, py = tile.y * ts;
    const c = TERRAIN_COLORS[tile.terrain] || TERRAIN_COLORS.grass;
    ctx.fillStyle = c.base;
    ctx.fillRect(px, py, ts, ts);

    ctx.fillStyle = c.accent;
    const seed = tile.x * 137 + tile.y * 271;
    if (tile.terrain === 'grass') {
      for (let i = 0; i < 6; i++) {
        const dx = ((seed + i * 43) % ts);
        const dy = ((seed * 3 + i * 79) % ts);
        ctx.fillRect(px + dx, py + dy, 2, 4);
      }
    } else if (tile.terrain === 'forest') {
      for (let i = 0; i < 3; i++) {
        const dx = 12 + ((seed + i * 67) % (ts - 28));
        const dy = 10 + ((seed * 5 + i * 91) % (ts - 28));
        ctx.beginPath();
        ctx.moveTo(px + dx + 14, py + dy);
        ctx.lineTo(px + dx, py + dy + 24);
        ctx.lineTo(px + dx + 28, py + dy + 24);
        ctx.closePath();
        ctx.fillStyle = '#2E6B37';
        ctx.fill();
        ctx.fillStyle = '#6B4423';
        ctx.fillRect(px + dx + 11, py + dy + 22, 6, 8);
      }
    } else if (tile.terrain === 'river') {
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2;
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        const y0 = py + 14 + i * (ts / 3);
        ctx.moveTo(px + 6, y0 + Math.sin((Date.now() / 400) + i) * 2);
        ctx.quadraticCurveTo(px + ts / 2, y0 + 3, px + ts - 6, y0 + Math.cos((Date.now() / 400) + i) * 2);
        ctx.stroke();
      }
    } else if (tile.terrain === 'mountain') {
      ctx.fillStyle = '#A9A9A9';
      ctx.beginPath();
      ctx.moveTo(px + ts * 0.1, py + ts * 0.9);
      ctx.lineTo(px + ts * 0.5, py + ts * 0.2);
      ctx.lineTo(px + ts * 0.9, py + ts * 0.9);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.moveTo(px + ts * 0.38, py + ts * 0.38);
      ctx.lineTo(px + ts * 0.5, py + ts * 0.2);
      ctx.lineTo(px + ts * 0.62, py + ts * 0.38);
      ctx.closePath();
      ctx.fill();
    }
  }

  _drawBuilding(tile: Tile) {
    const ctx = this.ctx;
    const b = tile.building!;
    const def = BUILDINGS[b.type];
    const ts = this.tileSize;
    const px = tile.x * ts, py = tile.y * ts;
    const prog = b.buildProgress;
    const now = Date.now();
    const just = b.justBuilt && now - b.justBuilt < 600;
    const growY = just ? 1 - (1 - (now - (b.justBuilt || now)) / 600) : 1;

    ctx.save();
    const cx = px + ts / 2, cy = py + ts / 2;
    const working = b.buildProgress >= 1;
    if (working) {
      const pulse = 0.3 + Math.sin(now / 500 + (tile.x + tile.y)) * 0.1;
      ctx.fillStyle = `rgba(255, 220, 130, ${pulse * 0.25})`;
      ctx.beginPath();
      ctx.arc(cx, cy, ts * 0.5, 0, Math.PI * 2);
      ctx.fill();
    }
    const drawH = (ts - 16) * Math.min(1, prog * 1.5) * (just ? growY : 1);
    const drawW = (ts - 16) * Math.min(1, prog * 1.5);
    const bx = cx - drawW / 2, by = cy - drawH / 2 + (ts - 16 - drawH) / 2;

    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    ctx.beginPath();
    ctx.ellipse(cx, py + ts - 10, drawW / 2, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    this._roundedRect(bx, by, drawW, drawH, 8);
    ctx.fillStyle = def.bgColor;
    ctx.fill();
    ctx.strokeStyle = '#5C4033';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    if (prog >= 0.5) {
      ctx.font = `${Math.max(14, drawW * 0.45)}px system-ui, "Segoe UI Emoji"`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.globalAlpha = Math.min(1, (prog - 0.5) * 2);
      ctx.fillText(def.icon, cx, cy);
      ctx.globalAlpha = 1;
    }

    if (prog < 1) {
      ctx.fillStyle = 'rgba(92, 64, 51, 0.8)';
      ctx.fillRect(bx, by - 8, drawW, 5);
      ctx.fillStyle = '#D4A373';
      ctx.fillRect(bx + 1, by - 7, (drawW - 2) * prog, 3);
    }
    ctx.restore();
  }

  _drawParticles(ctx: CanvasRenderingContext2D) {
    this.particles.forEach(p => {
      const a = 1 - p.life / p.maxLife;
      ctx.globalAlpha = a;
      if (p.kind === 'spark') {
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 8;
      }
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * (p.kind === 'spark' ? a : 1), 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;
    });
  }

  _roundedRect(x: number, y: number, w: number, h: number, r: number) {
    const ctx = this.ctx;
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
}
