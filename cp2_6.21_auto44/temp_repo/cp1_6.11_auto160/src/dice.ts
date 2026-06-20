import type { ZodiacSign } from './zodiac';

export interface DiceParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  alpha: number;
}

export interface DiceFace {
  points: number;
}

export type RollCallback = (result: number, prediction: string, matchScore: number, isGrandPrediction: boolean) => void;

export class Dice {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private x: number = 0;
  private y: number = 0;
  private size: number = 30;
  private currentFace: number = 1;
  private displayedFace: number = 1;
  private isRolling: boolean = false;
  private rollStartTime: number = 0;
  private rollDuration: number = 800;
  private rotationX: number = 0;
  private rotationY: number = 0;
  private rollTargetFace: number = 1;
  private idleRotation: number = 0;
  private currentTime: number = 0;
  private energyFull: boolean = false;
  private shakeAmplitude: number = 0;
  private onRollComplete: RollCallback | null = null;
  private grandParticles: DiceParticle[] = [];
  private maxGrandParticles: number = 200;
  private grandEffectActive: boolean = false;
  private grandEffectStartTime: number = 0;
  private grandEffectDuration: number = 2000;
  private screenFlashAlpha: number = 0;

  private readonly FACES: number[] = [1, 2, 3, 4, 5, 6];

  constructor(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) {
    this.canvas = canvas;
    this.ctx = ctx;
  }

  setPosition(x: number, y: number): void {
    this.x = x;
    this.y = y;
  }

  setOnRollComplete(callback: RollCallback): void {
    this.onRollComplete = callback;
  }

  setEnergyFull(full: boolean): void {
    this.energyFull = full;
  }

  getSize(): number {
    return this.size;
  }

  isPointInDice(mx: number, my: number): boolean {
    const s = this.size * 0.7;
    return Math.abs(mx - this.x) <= s && Math.abs(my - this.y) <= s;
  }

  roll(sign: ZodiacSign | null): boolean {
    if (this.isRolling) return false;

    this.isRolling = true;
    this.rollStartTime = performance.now();

    const targetIndex = Math.floor(Math.random() * 6);
    this.rollTargetFace = this.FACES[targetIndex];

    if (this.energyFull && sign) {
      setTimeout(() => {
        this.triggerGrandPrediction();
      }, this.rollDuration * 0.3);
    }

    return true;
  }

  private triggerGrandPrediction(): void {
    this.grandEffectActive = true;
    this.grandEffectStartTime = performance.now();
    this.spawnGrandParticles();
  }

  private spawnGrandParticles(): void {
    const cw = this.canvas.width / (window.devicePixelRatio || 1);
    const ch = this.canvas.height / (window.devicePixelRatio || 1);

    for (let i = 0; i < this.maxGrandParticles; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = (0.2 + Math.random() * 0.8);
      const colors = ['#FFD700', '#FFFFFF', '#9B59B6', '#FF6B6B', '#64B5F6', '#4A9E6B'];
      const color = colors[Math.floor(Math.random() * colors.length)];
      this.grandParticles.push({
        x: cw / 2 + (Math.random() - 0.5) * 200,
        y: ch / 2 + (Math.random() - 0.5) * 200,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0,
        maxLife: 1500 + Math.random() * 500,
        size: 1 + Math.random() * 3,
        color,
        alpha: 1
      });
    }
  }

  private getPrediction(sign: ZodiacSign | null, face: number): { text: string; matchScore: number } {
    if (!sign) {
      return { text: '请先选择一个星座，再投掷命运骰子。', matchScore: 0 };
    }

    const index = Math.min(face - 1, sign.predictions.length - 1);
    const prediction = sign.predictions[index] || '星辰闪烁，命运正在书写中...';

    let matchScore = 5;
    if (face === 6) matchScore = 20;
    else if (face === 5) matchScore = 15;
    else if (face === 4) matchScore = 12;
    else if (face === 3) matchScore = 10;
    else if (face === 2) matchScore = 7;

    const luckyIndex = sign.startAngle >= 0 ? Math.floor(sign.startAngle) % 6 : 0;
    if (face === ((luckyIndex % 6) + 1)) {
      matchScore += 5;
    }

    return { text: prediction, matchScore };
  }

  update(deltaTime: number, currentTime: number, selectedSign: ZodiacSign | null): void {
    this.currentTime = currentTime;
    this.idleRotation += deltaTime * 0.0005;

    if (this.energyFull) {
      this.shakeAmplitude = (Math.sin(currentTime * 0.01) + 1) * 1.5;
    } else {
      this.shakeAmplitude = Math.max(0, this.shakeAmplitude - deltaTime * 0.01);
    }

    if (this.isRolling) {
      const elapsed = currentTime - this.rollStartTime;
      const progress = Math.min(1, elapsed / this.rollDuration);

      const spinSpeed = (1 - progress) * 15 + 1;
      this.rotationX += deltaTime * 0.02 * spinSpeed;
      this.rotationY += deltaTime * 0.025 * spinSpeed;

      const phaseProgress = Math.floor(progress * 12);
      this.displayedFace = this.FACES[phaseProgress % 6];

      if (progress >= 1) {
        this.isRolling = false;
        this.displayedFace = this.rollTargetFace;
        this.currentFace = this.rollTargetFace;

        const isGrand = this.grandEffectActive;
        const { text, matchScore } = this.getPrediction(selectedSign, this.currentFace);
        const finalScore = isGrand ? matchScore * 2 : matchScore;
        const finalText = isGrand ? `✨ 命运大预言 ✨\n${text}` : text;

        if (this.onRollComplete) {
          this.onRollComplete(this.currentFace, finalText, finalScore, isGrand);
        }
      }
    }

    if (this.grandEffectActive) {
      const elapsed = currentTime - this.grandEffectStartTime;
      const progress = elapsed / this.grandEffectDuration;

      if (progress < 0.2) {
        this.screenFlashAlpha = progress / 0.2 * 0.6;
      } else if (progress > 0.8) {
        this.screenFlashAlpha = (1 - (progress - 0.8) / 0.2) * 0.3;
      } else {
        this.screenFlashAlpha = 0.3 + Math.sin(elapsed * 0.01) * 0.15;
      }

      if (progress >= 1) {
        this.grandEffectActive = false;
        this.screenFlashAlpha = 0;
      }
    }

    this.updateGrandParticles(deltaTime);
  }

  private updateGrandParticles(deltaTime: number): void {
    for (let i = this.grandParticles.length - 1; i >= 0; i--) {
      const p = this.grandParticles[i];
      p.x += p.vx * deltaTime * 0.8;
      p.y += p.vy * deltaTime * 0.8;
      p.vx *= 0.995;
      p.vy *= 0.995;
      p.life += deltaTime;
      p.alpha = Math.max(0, 1 - p.life / p.maxLife);

      if (p.life >= p.maxLife || p.alpha <= 0) {
        this.grandParticles.splice(i, 1);
      }
    }
  }

  draw(): void {
    this.drawGrandParticles();
    this.drawDice();
    this.drawGrandFlash();
  }

  private drawDice(): void {
    const ctx = this.ctx;
    const s = this.size;

    let shakeX = 0, shakeY = 0;
    if (this.shakeAmplitude > 0.1) {
      shakeX = (Math.random() - 0.5) * this.shakeAmplitude;
      shakeY = (Math.random() - 0.5) * this.shakeAmplitude;
    }

    const drawX = this.x + shakeX;
    const drawY = this.y + shakeY;

    ctx.save();
    ctx.translate(drawX, drawY);

    let rotX = this.idleRotation;
    let rotY = this.idleRotation * 1.3;
    if (this.isRolling) {
      rotX = this.rotationX;
      rotY = this.rotationY;
    }

    const cosX = Math.cos(rotX);
    const sinX = Math.sin(rotX);
    const cosY = Math.cos(rotY);
    const sinY = Math.sin(rotY);

    const faces = this.getVisibleFaces(cosX, sinX, cosY, sinY);
    for (const face of faces) {
      this.drawCubeFace(face, cosX, sinX, cosY, sinY, s);
    }

    this.drawDiceLabel();
    ctx.restore();
  }

  private getVisibleFaces(cosX: number, sinX: number, cosY: number, sinY: number): number[] {
    const faces: { index: number; depth: number }[] = [];
    const s = this.size;

    const facesNormals = [
      { index: 1, nx: 0, ny: 0, nz: 1 },
      { index: 6, nx: 0, ny: 0, nz: -1 },
      { index: 2, nx: -1, ny: 0, nz: 0 },
      { index: 5, nx: 1, ny: 0, nz: 0 },
      { index: 3, nx: 0, ny: -1, nz: 0 },
      { index: 4, nx: 0, ny: 1, nz: 0 }
    ];

    for (const f of facesNormals) {
      const n1x = f.nx * cosY + f.nz * sinY;
      const n1z = -f.nx * sinY + f.nz * cosY;
      const n2y = f.ny * cosX - n1z * sinX;
      const n2z = f.ny * sinX + n1z * cosX;

      if (n2z > -0.01) {
        faces.push({ index: f.index, depth: n2z });
      }
    }

    faces.sort((a, b) => a.depth - b.depth);
    return faces.map(f => f.index);
  }

  private drawCubeFace(
    faceIndex: number,
    cosX: number, sinX: number,
    cosY: number, sinY: number,
    s: number
  ): void {
    const ctx = this.ctx;
    const half = s / 2;

    let vertices: { x: number; y: number; z: number }[] = [];

    switch (faceIndex) {
      case 1:
        vertices = [
          { x: -half, y: -half, z: half },
          { x: half, y: -half, z: half },
          { x: half, y: half, z: half },
          { x: -half, y: half, z: half }
        ];
        break;
      case 6:
        vertices = [
          { x: half, y: -half, z: -half },
          { x: -half, y: -half, z: -half },
          { x: -half, y: half, z: -half },
          { x: half, y: half, z: -half }
        ];
        break;
      case 2:
        vertices = [
          { x: -half, y: -half, z: -half },
          { x: -half, y: -half, z: half },
          { x: -half, y: half, z: half },
          { x: -half, y: half, z: -half }
        ];
        break;
      case 5:
        vertices = [
          { x: half, y: -half, z: half },
          { x: half, y: -half, z: -half },
          { x: half, y: half, z: -half },
          { x: half, y: half, z: half }
        ];
        break;
      case 3:
        vertices = [
          { x: -half, y: -half, z: -half },
          { x: half, y: -half, z: -half },
          { x: half, y: -half, z: half },
          { x: -half, y: -half, z: half }
        ];
        break;
      case 4:
        vertices = [
          { x: -half, y: half, z: half },
          { x: half, y: half, z: half },
          { x: half, y: half, z: -half },
          { x: -half, y: half, z: -half }
        ];
        break;
    }

    const projected = vertices.map(v => {
      let x = v.x * cosY + v.z * sinY;
      let z = -v.x * sinY + v.z * cosY;
      let y = v.y * cosX - z * sinX;
      z = v.y * sinX + z * cosX;
      const scale = 1 + z * 0.002;
      return { x: x * scale, y: y * scale, z };
    });

    const avgZ = projected.reduce((s, p) => s + p.z, 0) / 4;
    const shade = 0.5 + (avgZ + half) / (half * 2) * 0.5;

    ctx.beginPath();
    ctx.moveTo(projected[0].x, projected[0].y);
    for (let i = 1; i < projected.length; i++) {
      ctx.lineTo(projected[i].x, projected[i].y);
    }
    ctx.closePath();

    let fillColor: string;
    if (this.energyFull) {
      const hue = (this.currentTime * 0.1 + faceIndex * 60) % 360;
      fillColor = `hsl(${hue}, 80%, ${40 + shade * 30}%)`;
    } else {
      fillColor = this.interpolateColor('#FFFFFF', '#FFE4B5', shade);
    }

    ctx.fillStyle = fillColor;
    ctx.fill();

    let strokeColor: string;
    if (this.energyFull) {
      const pulse = (Math.sin(this.currentTime * 0.008) + 1) / 2;
      strokeColor = `rgba(255, 215, 0, ${0.7 + pulse * 0.3})`;
      ctx.lineWidth = 2;
      ctx.shadowColor = '#FFD700';
      ctx.shadowBlur = 8 + pulse * 8;
    } else {
      strokeColor = 'rgba(180, 160, 140, 0.8)';
      ctx.lineWidth = 1;
    }
    ctx.strokeStyle = strokeColor;
    ctx.stroke();
    ctx.shadowBlur = 0;

    this.drawFacePips(faceIndex, projected, shade);
  }

  private drawFacePips(
    faceIndex: number,
    corners: { x: number; y: number; z: number }[],
    shade: number
  ): void {
    const ctx = this.ctx;
    const displayFace = this.isRolling ? this.displayedFace : this.currentFace;
    const pipCount = faceIndex === 1 || faceIndex === 6 ? (faceIndex === 1 ? displayFace : 7 - displayFace) : faceIndex;

    const cx = (corners[0].x + corners[2].x) / 2;
    const cy = (corners[0].y + corners[2].y) / 2;
    const w = Math.abs(corners[1].x - corners[0].x) * 0.85;
    const h = Math.abs(corners[3].y - corners[0].y) * 0.85;

    const pipPositions: Record<number, [number, number][]> = {
      1: [[0.5, 0.5]],
      2: [[0.25, 0.25], [0.75, 0.75]],
      3: [[0.25, 0.25], [0.5, 0.5], [0.75, 0.75]],
      4: [[0.25, 0.25], [0.75, 0.25], [0.25, 0.75], [0.75, 0.75]],
      5: [[0.25, 0.25], [0.75, 0.25], [0.5, 0.5], [0.25, 0.75], [0.75, 0.75]],
      6: [[0.25, 0.22], [0.75, 0.22], [0.25, 0.5], [0.75, 0.5], [0.25, 0.78], [0.75, 0.78]]
    };

    const positions = pipPositions[pipCount] || [];
    const pipR = Math.min(w, h) * 0.08;

    let pipColor: string;
    if (this.energyFull) {
      pipColor = '#FFFFFF';
    } else {
      pipColor = this.interpolateColor('#8B7355', '#3D2914', 1 - shade * 0.3);
    }

    for (const [px, py] of positions) {
      const x = cx + (px - 0.5) * w;
      const y = cy + (py - 0.5) * h;

      ctx.beginPath();
      ctx.arc(x, y, pipR, 0, Math.PI * 2);
      ctx.fillStyle = pipColor;
      ctx.fill();

      if (this.energyFull) {
        ctx.shadowColor = '#FFFFFF';
        ctx.shadowBlur = 4;
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    }
  }

  private drawDiceLabel(): void {
    const ctx = this.ctx;
    ctx.font = '10px "Microsoft YaHei", serif';
    ctx.fillStyle = 'rgba(232, 213, 183, 0.8)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('命运骰子', 0, this.size / 2 + 8);
  }

  private drawGrandParticles(): void {
    const ctx = this.ctx;
    for (const p of this.grandParticles) {
      const alpha = p.alpha;
      const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 4);
      glow.addColorStop(0, this.hexToRgba(p.color, alpha));
      glow.addColorStop(1, this.hexToRgba(p.color, 0));
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = this.hexToRgba('#FFFFFF', alpha * 0.95);
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private drawGrandFlash(): void {
    if (this.screenFlashAlpha <= 0) return;
    const ctx = this.ctx;
    const cw = this.canvas.width / (window.devicePixelRatio || 1);
    const ch = this.canvas.height / (window.devicePixelRatio || 1);

    ctx.save();
    const gradient = ctx.createRadialGradient(cw / 2, ch / 2, 0, cw / 2, ch / 2, Math.max(cw, ch) * 0.7);
    gradient.addColorStop(0, `rgba(255, 255, 255, ${this.screenFlashAlpha})`);
    gradient.addColorStop(0.3, `rgba(255, 215, 0, ${this.screenFlashAlpha * 0.7})`);
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, cw, ch);
    ctx.restore();
  }

  isGrandEffectActive(): boolean {
    return this.grandEffectActive;
  }

  private hexToRgba(hex: string, alpha: number): string {
    const h = hex.replace('#', '');
    if (h.length !== 6) return `rgba(255, 255, 255, ${alpha})`;
    const r = parseInt(h.substring(0, 2), 16);
    const g = parseInt(h.substring(2, 4), 16);
    const b = parseInt(h.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  private interpolateColor(c1: string, c2: string, t: number): string {
    t = Math.max(0, Math.min(1, t));
    const h1 = c1.replace('#', '');
    const h2 = c2.replace('#', '');
    const r1 = parseInt(h1.substring(0, 2), 16);
    const g1 = parseInt(h1.substring(2, 4), 16);
    const b1 = parseInt(h1.substring(4, 6), 16);
    const r2 = parseInt(h2.substring(0, 2), 16);
    const g2 = parseInt(h2.substring(2, 4), 16);
    const b2 = parseInt(h2.substring(4, 6), 16);
    const r = Math.round(r1 + (r2 - r1) * t);
    const g = Math.round(g1 + (g2 - g1) * t);
    const b = Math.round(b1 + (b2 - b1) * t);
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }
}
