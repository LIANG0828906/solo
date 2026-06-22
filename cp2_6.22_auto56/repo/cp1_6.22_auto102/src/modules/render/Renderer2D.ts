import { AtomManager } from '@/managers/AtomManager';
import { EventDispatcher } from '@/managers/EventDispatcher';
import { Atom, CollisionParticle, EnergyRipple } from '@/types';

export class Renderer2D {
  private ctx: CanvasRenderingContext2D;
  private canvas: HTMLCanvasElement;
  private atomManager: AtomManager;
  private eventDispatcher: EventDispatcher;
  private collisionParticles: Map<string, CollisionParticle> = new Map();
  private ripples: Map<string, EnergyRipple> = new Map();
  private gridSpacing: number = 40;

  constructor(
    canvas: HTMLCanvasElement,
    atomManager: AtomManager,
    eventDispatcher: EventDispatcher,
  ) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Cannot get 2D context');
    this.ctx = ctx;
    this.atomManager = atomManager;
    this.eventDispatcher = eventDispatcher;

    this.eventDispatcher.addParticleListener((particle) => {
      this.collisionParticles.set(particle.id, particle);
    });

    this.eventDispatcher.addRippleListener((ripple) => {
      this.ripples.set(ripple.id, ripple);
    });
  }

  public render(deltaTime: number): void {
    const { width, height } = this.canvas;

    this.ctx.clearRect(0, 0, width, height);
    this.drawBackground(width, height);
    this.drawGrid(width, height);
    this.updateAndDrawRipples(deltaTime);
    this.drawBonds();
    this.updateAndDrawParticles(deltaTime);
    this.drawAtoms();
  }

  private drawBackground(width: number, height: number): void {
    const gradient = this.ctx.createRadialGradient(
      width / 2,
      height / 2,
      0,
      width / 2,
      height / 2,
      Math.max(width, height) * 0.7,
    );
    gradient.addColorStop(0, '#3a3a3a');
    gradient.addColorStop(0.5, '#252525');
    gradient.addColorStop(1, '#121212');

    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, width, height);
  }

  private drawGrid(width: number, height: number): void {
    this.ctx.save();
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    this.ctx.lineWidth = 0.3;

    for (let x = 0; x <= width; x += this.gridSpacing) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, height);
      this.ctx.stroke();
    }

    for (let y = 0; y <= height; y += this.gridSpacing) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(width, y);
      this.ctx.stroke();
    }

    this.ctx.restore();
  }

  private drawAtoms(): void {
    const atoms = this.atomManager.getAllAtoms();
    const now = performance.now();

    for (const atom of atoms) {
      this.drawAtom(atom, now);
    }
  }

  private drawAtom(atom: Atom, now: number): void {
    const spawnDuration = 300;
    const spawnElapsed = now - atom.spawnTime;
    const spawnProgress = Math.min(spawnElapsed / spawnDuration, 1);
    const scale = 0.3 + 0.7 * this.easeOutBack(spawnProgress);

    const effectiveRadius = atom.radius * scale;

    this.ctx.save();
    this.ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    this.ctx.shadowBlur = 4;
    this.ctx.shadowOffsetX = 1;
    this.ctx.shadowOffsetY = 2;

    const gradient = this.ctx.createRadialGradient(
      atom.position.x - effectiveRadius * 0.3,
      atom.position.y - effectiveRadius * 0.3,
      0,
      atom.position.x,
      atom.position.y,
      effectiveRadius,
    );
    gradient.addColorStop(0, this.lightenColor(atom.color, 50));
    gradient.addColorStop(0.7, atom.color);
    gradient.addColorStop(1, this.darkenColor(atom.color, 30));

    this.ctx.beginPath();
    this.ctx.arc(atom.position.x, atom.position.y, effectiveRadius, 0, Math.PI * 2);
    this.ctx.fillStyle = gradient;
    this.ctx.fill();

    this.ctx.restore();

    if (atom.isSelected) {
      this.drawSelectionGlow(atom, effectiveRadius, now);
    }

    this.ctx.save();
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    this.ctx.font = `bold ${Math.max(effectiveRadius * 1.2, 8)}px Arial`;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(atom.type, atom.position.x, atom.position.y);
    this.ctx.restore();
  }

  private drawSelectionGlow(atom: Atom, radius: number, now: number): void {
    const pulse = 0.8 + 0.2 * Math.sin(now * 0.005);
    const glowRadius = radius + 6 * pulse;

    this.ctx.save();
    this.ctx.beginPath();
    this.ctx.arc(atom.position.x, atom.position.y, glowRadius, 0, Math.PI * 2);
    this.ctx.strokeStyle = `rgba(100, 180, 255, ${0.6 + 0.3 * pulse})`;
    this.ctx.lineWidth = 2;
    this.ctx.shadowColor = '#64B4FF';
    this.ctx.shadowBlur = 12;
    this.ctx.stroke();
    this.ctx.restore();
  }

  private drawBonds(): void {
    const bonds = this.atomManager.getBonds();
    const atoms = this.atomManager.getAllAtoms();
    const atomMap = new Map(atoms.map((a) => [a.id, a]));
    const now = performance.now();

    for (const bond of bonds) {
      const atom1 = atomMap.get(bond.atom1Id);
      const atom2 = atomMap.get(bond.atom2Id);
      if (!atom1 || !atom2) continue;

      const formationDuration = 300;
      const formationElapsed = now - bond.formationTime;
      const formationProgress = Math.min(formationElapsed / formationDuration, 1);
      const alpha = formationProgress;
      const flashIntensity = Math.sin(formationProgress * Math.PI) * 0.5;

      this.drawBondLine(atom1, atom2, bond.type, alpha, flashIntensity);
    }
  }

  private drawBondLine(
    atom1: Atom,
    atom2: Atom,
    bondType: 'single' | 'double' | 'triple',
    alpha: number,
    flashIntensity: number,
  ): void {
    const dx = atom2.position.x - atom1.position.x;
    const dy = atom2.position.y - atom1.position.y;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len === 0) return;

    const nx = -dy / len;
    const ny = dx / len;

    const offsets = bondType === 'single' ? [0] : bondType === 'double' ? [-2, 2] : [-3.5, 0, 3.5];

    for (const offset of offsets) {
      this.ctx.save();

      this.ctx.beginPath();
      const startX = atom1.position.x + nx * offset;
      const startY = atom1.position.y + ny * offset;
      const endX = atom2.position.x + nx * offset;
      const endY = atom2.position.y + ny * offset;

      this.ctx.moveTo(startX, startY);
      this.ctx.lineTo(endX, endY);

      const baseColor = `rgba(255, 255, 255, ${alpha})`;
      const flashColor = `rgba(255, 255, 200, ${alpha * flashIntensity})`;

      this.ctx.strokeStyle = flashIntensity > 0.1 ? flashColor : baseColor;
      this.ctx.lineWidth = 1;
      this.ctx.lineCap = 'round';

      if (flashIntensity > 0.1) {
        this.ctx.shadowColor = '#FFFF80';
        this.ctx.shadowBlur = 4 + flashIntensity * 6;
      }

      this.ctx.stroke();
      this.ctx.restore();
    }
  }

  private updateAndDrawParticles(deltaTime: number): void {
    const particlesToRemove: string[] = [];

    for (const [id, particle] of this.collisionParticles) {
      particle.lifetime += deltaTime;
      if (particle.lifetime >= particle.maxLifetime) {
        particlesToRemove.push(id);
        continue;
      }

      particle.position.x += particle.velocity.x;
      particle.position.y += particle.velocity.y;
      particle.velocity.x *= 0.98;
      particle.velocity.y *= 0.98;

      const progress = particle.lifetime / particle.maxLifetime;
      const alpha = 1 - progress;

      this.ctx.save();
      this.ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
      this.ctx.shadowColor = '#FFFFFF';
      this.ctx.shadowBlur = 3;
      this.ctx.fillRect(
        particle.position.x - particle.size / 2,
        particle.position.y - particle.size / 2,
        particle.size,
        particle.size,
      );
      this.ctx.restore();
    }

    particlesToRemove.forEach((id) => this.collisionParticles.delete(id));
  }

  private updateAndDrawRipples(deltaTime: number): void {
    const ripplesToRemove: string[] = [];

    for (const [id, ripple] of this.ripples) {
      ripple.lifetime += deltaTime;
      if (ripple.lifetime >= ripple.maxLifetime) {
        ripplesToRemove.push(id);
        continue;
      }

      const progress = ripple.lifetime / ripple.maxLifetime;
      ripple.currentRadius = ripple.maxRadius * progress;
      const alpha = (1 - progress) * 0.8;

      this.ctx.save();
      this.ctx.beginPath();
      this.ctx.arc(ripple.position.x, ripple.position.y, ripple.currentRadius, 0, Math.PI * 2);
      this.ctx.strokeStyle = `${this.hexToRgba(ripple.color, alpha)}`;
      this.ctx.lineWidth = 2 + (1 - progress) * 2;
      this.ctx.shadowColor = ripple.color;
      this.ctx.shadowBlur = 8;
      this.ctx.stroke();
      this.ctx.restore();
    }

    ripplesToRemove.forEach((id) => this.ripples.delete(id));
  }

  private lightenColor(hex: string, percent: number): string {
    const num = parseInt(hex.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.min(255, (num >> 16) + amt);
    const G = Math.min(255, ((num >> 8) & 0x00ff) + amt);
    const B = Math.min(255, (num & 0x0000ff) + amt);
    return `#${(0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)}`;
  }

  private darkenColor(hex: string, percent: number): string {
    const num = parseInt(hex.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.max(0, (num >> 16) - amt);
    const G = Math.max(0, ((num >> 8) & 0x00ff) - amt);
    const B = Math.max(0, (num & 0x0000ff) - amt);
    return `#${(0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)}`;
  }

  private hexToRgba(hex: string, alpha: number): string {
    const num = parseInt(hex.replace('#', ''), 16);
    const R = (num >> 16) & 0xff;
    const G = (num >> 8) & 0xff;
    const B = num & 0xff;
    return `rgba(${R}, ${G}, ${B}, ${alpha})`;
  }

  private easeOutBack(t: number): number {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  }

  public resize(width: number, height: number): void {
    this.canvas.width = width;
    this.canvas.height = height;
    this.atomManager.setCanvasSize(width, height);
  }

  public getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }
}
