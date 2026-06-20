import {
  GameState,
  GameConfig,
  ELEMENT_COLORS,
  ELEMENT_NAMES,
  ALL_ELEMENTS,
  ElementType
} from './types';

export class Renderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private config: GameConfig;
  private time: number = 0;
  private offscreenCanvas: HTMLCanvasElement;
  private offscreenCtx: CanvasRenderingContext2D;
  private altarCache: ImageData | null = null;

  constructor(canvas: HTMLCanvasElement, config: GameConfig) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Cannot get 2D context');
    this.ctx = ctx;
    this.config = config;
    
    this.offscreenCanvas = document.createElement('canvas');
    this.offscreenCanvas.width = canvas.width;
    this.offscreenCanvas.height = canvas.height;
    const octx = this.offscreenCanvas.getContext('2d');
    if (!octx) throw new Error('Cannot get offscreen context');
    this.offscreenCtx = octx;
  }

  public resize(width: number, height: number): void {
    this.offscreenCanvas.width = width;
    this.offscreenCanvas.height = height;
    this.altarCache = null;
  }

  public render(state: GameState, time: number): void {
    this.time = time;
    const ctx = this.ctx;
    const { width, height } = this.canvas;
    
    ctx.clearRect(0, 0, width, height);
    
    this.drawBackground(ctx, state);
    this.drawAltar(ctx, state);
    this.drawWarningRing(ctx, state);
    this.drawMonsters(ctx, state);
    this.drawRuneSlots(ctx, state);
    this.drawBeams(ctx, state);
    this.drawParticles(ctx, state);
    this.drawFragments(ctx, state);
    this.drawFloatingTexts(ctx, state);
    this.drawUI(ctx, state);
    this.drawRunePanel(ctx, state);
    this.drawScreenFlash(ctx, state);
    this.drawGameOver(ctx, state);
  }

  private drawBackground(ctx: CanvasRenderingContext2D, state: GameState): void {
    const { width, height } = this.canvas;
    
    if (state.isElementStorm && state.stormElement) {
      this.drawStormBackground(ctx, state);
    } else {
      const gradient = ctx.createRadialGradient(
        width / 2, height / 2, 0,
        width / 2, height / 2, Math.max(width, height) / 2
      );
      gradient.addColorStop(0, '#1A0A3E');
      gradient.addColorStop(1, '#0B0020');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);
      
      this.drawStars(ctx, width, height);
    }
  }

  private drawStormBackground(ctx: CanvasRenderingContext2D, state: GameState): void {
    const { width, height } = this.canvas;
    const centerX = width / 2;
    const centerY = height / 2;
    const elementColor = state.stormElement ? ELEMENT_COLORS[state.stormElement] : '#FFD700';
    
    ctx.save();
    ctx.translate(centerX, centerY);
    
    for (let i = 0; i < 6; i++) {
      const rotation = (this.time / 3000 + i * 0.5) % (Math.PI * 2);
      ctx.rotate(rotation);
      
      const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, Math.max(width, height));
      gradient.addColorStop(0, this.adjustColorAlpha(elementColor, 0.15));
      gradient.addColorStop(0.5, this.adjustColorAlpha(elementColor, 0.05));
      gradient.addColorStop(1, '#0B0020');
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, Math.max(width, height), 0, Math.PI / 3);
      ctx.closePath();
      ctx.fill();
      
      ctx.rotate(-rotation);
    }
    
    ctx.restore();
  }

  private drawStars(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    const starCount = 100;
    ctx.fillStyle = '#FFFFFF';
    
    for (let i = 0; i < starCount; i++) {
      const seed = i * 12345.6789;
      const x = ((Math.sin(seed) + 1) / 2) * width;
      const y = ((Math.cos(seed * 1.5) + 1) / 2) * height;
      const brightness = 0.3 + Math.sin(this.time / 1000 + seed) * 0.2;
      const size = 0.5 + (i % 3) * 0.5;
      
      ctx.globalAlpha = brightness;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  private drawAltar(ctx: CanvasRenderingContext2D, state: GameState): void {
    const { centerX, centerY, altarRadius } = state;
    
    const glowGradient = ctx.createRadialGradient(
      centerX, centerY, altarRadius * 0.9,
      centerX, centerY, altarRadius * 1.3
    );
    glowGradient.addColorStop(0, 'rgba(138, 43, 226, 0.4)');
    glowGradient.addColorStop(1, 'rgba(138, 43, 226, 0)');
    ctx.fillStyle = glowGradient;
    ctx.beginPath();
    ctx.arc(centerX, centerY, altarRadius * 1.3, 0, Math.PI * 2);
    ctx.fill();
    
    const altarGradient = ctx.createRadialGradient(
      centerX, centerY, 0,
      centerX, centerY, altarRadius
    );
    altarGradient.addColorStop(0, '#4A2C8D');
    altarGradient.addColorStop(0.7, '#2A1A5E');
    altarGradient.addColorStop(1, '#1A0A3E');
    
    ctx.fillStyle = altarGradient;
    ctx.beginPath();
    ctx.arc(centerX, centerY, altarRadius, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.strokeStyle = '#6B3FA0';
    ctx.lineWidth = 3 * state.scale;
    ctx.beginPath();
    ctx.arc(centerX, centerY, altarRadius, 0, Math.PI * 2);
    ctx.stroke();
    
    this.drawRuneCircles(ctx, state);
    
    const corePulse = 0.8 + Math.sin(this.time / 500) * 0.2;
    const coreGradient = ctx.createRadialGradient(
      centerX, centerY, 0,
      centerX, centerY, altarRadius * 0.3
    );
    coreGradient.addColorStop(0, `rgba(255, 215, 0, ${corePulse * 0.8})`);
    coreGradient.addColorStop(0.5, `rgba(138, 43, 226, ${corePulse * 0.4})`);
    coreGradient.addColorStop(1, 'rgba(138, 43, 226, 0)');
    
    ctx.fillStyle = coreGradient;
    ctx.beginPath();
    ctx.arc(centerX, centerY, altarRadius * 0.3, 0, Math.PI * 2);
    ctx.fill();
  }

  private drawRuneCircles(ctx: CanvasRenderingContext2D, state: GameState): void {
    const { centerX, centerY, altarRadius } = state;
    const rotations = [this.time / 10000, -this.time / 8000, this.time / 12000];
    const radii = [altarRadius * 0.7, altarRadius * 0.55, altarRadius * 0.4];
    
    for (let i = 0; i < 3; i++) {
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(rotations[i] % (Math.PI * 2));
      
      ctx.strokeStyle = `rgba(138, 43, 226, ${0.3 - i * 0.1})`;
      ctx.lineWidth = 2 * state.scale;
      ctx.beginPath();
      ctx.arc(0, 0, radii[i], 0, Math.PI * 2);
      ctx.stroke();
      
      const symbolCount = 8;
      for (let j = 0; j < symbolCount; j++) {
        const angle = (j / symbolCount) * Math.PI * 2;
        const x = Math.cos(angle) * radii[i];
        const y = Math.sin(angle) * radii[i];
        
        ctx.fillStyle = `rgba(176, 136, 255, ${0.5 - i * 0.15})`;
        ctx.beginPath();
        ctx.arc(x, y, 3 * state.scale, 0, Math.PI * 2);
        ctx.fill();
      }
      
      ctx.restore();
    }
  }

  private drawWarningRing(ctx: CanvasRenderingContext2D, state: GameState): void {
    const { centerX, centerY, warningRadius } = state;
    const hasMonsterInWarning = state.monsters.some(m => {
      const dx = centerX - m.x;
      const dy = centerY - m.y;
      return Math.sqrt(dx * dx + dy * dy) < warningRadius + m.radius;
    });
    
    if (!hasMonsterInWarning) return;
    
    const pulse = 0.5 + Math.sin(this.time / 200) * 0.5;
    ctx.strokeStyle = `rgba(255, 34, 0, ${pulse})`;
    ctx.lineWidth = 3 * state.scale;
    ctx.setLineDash([10 * state.scale, 5 * state.scale]);
    ctx.beginPath();
    ctx.arc(centerX, centerY, warningRadius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  private drawRuneSlots(ctx: CanvasRenderingContext2D, state: GameState): void {
    for (let i = 0; i < state.totalSlots; i++) {
      const slot = state.slots[i];
      const posX = state.centerX + Math.cos(slot.angle) * state.altarRadius * 0.85;
      const posY = state.centerY + Math.sin(slot.angle) * state.altarRadius * 0.85;
      
      this.drawSlot(ctx, posX, posY, slot, state);
    }
  }

  private drawSlot(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    slot: any,
    state: GameState
  ): void {
    const scale = state.scale;
    const slotRadius = 25 * scale;
    
    if (slot.isHighlighted) {
      const glowPulse = 0.5 + Math.sin(this.time / 150) * 0.5;
      ctx.shadowColor = '#FFD700';
      ctx.shadowBlur = 20 * glowPulse;
    }
    
    ctx.fillStyle = slot.rune ? '#1A0A3E' : '#0B0020';
    ctx.strokeStyle = slot.rune ? ELEMENT_COLORS[slot.rune.element] : '#4A2C8D';
    ctx.lineWidth = 2 * scale;
    
    ctx.beginPath();
    ctx.arc(x, y, slotRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    
    ctx.shadowBlur = 0;
    
    if (slot.rune) {
      const pulse = 0.6 + Math.sin((this.time + slot.rune.pulsePhase) / this.config.PULSE_PERIOD * Math.PI * 2) * 0.4;
      const runeColor = ELEMENT_COLORS[slot.rune.element];
      
      ctx.shadowColor = runeColor;
      ctx.shadowBlur = 15 * pulse;
      
      ctx.fillStyle = runeColor;
      ctx.globalAlpha = pulse;
      ctx.beginPath();
      ctx.arc(x, y, slotRadius * 0.7, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
      
      ctx.fillStyle = '#FFFFFF';
      ctx.font = `${14 * scale}px serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(ELEMENT_NAMES[slot.rune.element], x, y);
      
      ctx.shadowBlur = 0;
    }
    
    if (slot.ripplePhase >= 0) {
      const progress = slot.ripplePhase / this.config.RIPPLE_DURATION;
      const rippleRadius = slotRadius + progress * 30 * scale;
      const alpha = 1 - progress;
      
      ctx.strokeStyle = slot.rune 
        ? this.adjustColorAlpha(ELEMENT_COLORS[slot.rune.element], alpha)
        : `rgba(255, 255, 255, ${alpha})`;
      ctx.lineWidth = 2 * scale;
      ctx.beginPath();
      ctx.arc(x, y, rippleRadius, 0, Math.PI * 2);
      ctx.stroke();
    }
    
    if (state.sequenceInput.includes(slot.index)) {
      const orderIndex = state.sequenceInput.indexOf(slot.index) + 1;
      ctx.fillStyle = '#FFD700';
      ctx.font = `bold ${12 * scale}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(orderIndex.toString(), x, y - slotRadius - 10 * scale);
    }
  }

  private drawMonsters(ctx: CanvasRenderingContext2D, state: GameState): void {
    for (const monster of state.monsters) {
      this.drawMonster(ctx, monster, state);
    }
  }

  private drawMonster(
    ctx: CanvasRenderingContext2D,
    monster: any,
    state: GameState
  ): void {
    const { x, y, radius } = monster;
    
    const gradient = ctx.createRadialGradient(
      x, y, 0,
      x, y, radius
    );
    gradient.addColorStop(0, monster.colorEnd);
    gradient.addColorStop(0.7, monster.colorStart);
    gradient.addColorStop(1, 'rgba(43, 0, 84, 0.5)');
    
    ctx.globalAlpha = 0.85;
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    
    ctx.strokeStyle = `rgba(255, 255, 255, 0.3)`;
    ctx.lineWidth = 1 * state.scale;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.stroke();
    
    const hpWidth = radius * 2;
    const hpHeight = 4 * state.scale;
    const hpX = x - radius;
    const hpY = y - radius - 10 * state.scale;
    const hpPercent = monster.hp / monster.maxHp;
    
    ctx.fillStyle = '#333333';
    ctx.fillRect(hpX, hpY, hpWidth, hpHeight);
    
    ctx.fillStyle = hpPercent > 0.5 ? '#44FF88' : hpPercent > 0.25 ? '#FFD700' : '#FF4444';
    ctx.fillRect(hpX, hpY, hpWidth * hpPercent, hpHeight);
    
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1;
    ctx.strokeRect(hpX, hpY, hpWidth, hpHeight);
    
    const elementColor = ELEMENT_COLORS[monster.element];
    ctx.fillStyle = elementColor;
    ctx.globalAlpha = 0.6;
    ctx.beginPath();
    ctx.arc(x, y, radius * 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  private drawBeams(ctx: CanvasRenderingContext2D, state: GameState): void {
    for (const beam of state.beams) {
      const alpha = beam.life / beam.maxLife;
      const tailLength = 20 * state.scale;
      
      const dx = beam.endX - beam.startX;
      const dy = beam.endY - beam.startY;
      const length = Math.sqrt(dx * dx + dy * dy);
      const nx = -dy / length;
      const ny = dx / length;
      
      ctx.save();
      
      ctx.strokeStyle = this.adjustColorAlpha(beam.color, alpha * 0.3);
      ctx.lineWidth = beam.width + tailLength;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(beam.startX, beam.startY);
      ctx.lineTo(beam.endX, beam.endY);
      ctx.stroke();
      
      ctx.strokeStyle = this.adjustColorAlpha(beam.color, alpha);
      ctx.lineWidth = beam.width;
      ctx.beginPath();
      ctx.moveTo(beam.startX, beam.startY);
      ctx.lineTo(beam.endX, beam.endY);
      ctx.stroke();
      
      ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
      ctx.lineWidth = beam.width * 0.3;
      ctx.beginPath();
      ctx.moveTo(beam.startX, beam.startY);
      ctx.lineTo(beam.endX, beam.endY);
      ctx.stroke();
      
      ctx.restore();
    }
  }

  private drawParticles(ctx: CanvasRenderingContext2D, state: GameState): void {
    for (const particle of state.particles) {
      const alpha = particle.life / particle.maxLife;
      
      ctx.globalAlpha = alpha;
      ctx.fillStyle = particle.color;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size * alpha, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  private drawFragments(ctx: CanvasRenderingContext2D, state: GameState): void {
    for (const fragment of state.fragmentsItems) {
      this.drawStar(ctx, fragment.x, fragment.y, fragment.rotation, state);
    }
  }

  private drawStar(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    rotation: number,
    state: GameState
  ): void {
    const scale = state.scale;
    const outerRadius = 12 * scale;
    const innerRadius = 5 * scale;
    const spikes = 5;
    
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);
    
    ctx.shadowColor = '#FFD700';
    ctx.shadowBlur = 10;
    
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    
    for (let i = 0; i < spikes * 2; i++) {
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      const angle = (i / (spikes * 2)) * Math.PI * 2 - Math.PI / 2;
      const px = Math.cos(angle) * radius;
      const py = Math.sin(angle) * radius;
      
      if (i === 0) {
        ctx.moveTo(px, py);
      } else {
        ctx.lineTo(px, py);
      }
    }
    
    ctx.closePath();
    ctx.fill();
    
    ctx.shadowBlur = 0;
    ctx.restore();
  }

  private drawFloatingTexts(ctx: CanvasRenderingContext2D, state: GameState): void {
    for (const ft of state.floatingTexts) {
      const alpha = ft.life / ft.maxLife;
      const scale = state.scale;
      
      ctx.globalAlpha = alpha;
      ctx.fillStyle = ft.color;
      ctx.font = `bold ${16 * scale}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = '#000000';
      ctx.shadowBlur = 4;
      ctx.fillText(ft.text, ft.x, ft.y);
      ctx.shadowBlur = 0;
    }
    ctx.globalAlpha = 1;
  }

  private drawUI(ctx: CanvasRenderingContext2D, state: GameState): void {
    const scale = state.scale;
    const padding = 20 * scale;
    
    this.drawHealthBar(ctx, padding, padding, state);
    this.drawFragments(ctx, this.canvas.width / 2, padding, state);
    this.drawWave(ctx, this.canvas.width - padding, padding, state);
    this.drawSequencePreview(ctx, state);
    
    if (state.isElementStorm) {
      this.drawStormIndicator(ctx, state);
    }
  }

  private drawHealthBar(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    state: GameState
  ): void {
    const scale = state.scale;
    const width = 200 * scale;
    const height = 25 * scale;
    const segments = 10;
    const segmentWidth = width / segments;
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(x, y, width, height);
    
    const hpPercent = state.playerHp / state.maxPlayerHp;
    const fillWidth = width * hpPercent;
    
    const hpGradient = ctx.createLinearGradient(x, y, x, y + height);
    hpGradient.addColorStop(0, '#FF6677');
    hpGradient.addColorStop(1, '#FF3355');
    ctx.fillStyle = hpGradient;
    ctx.fillRect(x, y, fillWidth, height);
    
    ctx.strokeStyle = '#FF3355';
    ctx.lineWidth = 2 * scale;
    ctx.strokeRect(x, y, width, height);
    
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1;
    for (let i = 1; i < segments; i++) {
      const sx = x + i * segmentWidth;
      ctx.beginPath();
      ctx.moveTo(sx, y);
      ctx.lineTo(sx, y + height);
      ctx.stroke();
    }
    
    ctx.fillStyle = '#FFFFFF';
    ctx.font = `bold ${14 * scale}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${state.playerHp}/${state.maxPlayerHp}`, x + width / 2, y + height / 2);
    
    ctx.font = `${12 * scale}px sans-serif`;
    ctx.textAlign = 'left';
    ctx.fillText('生命值', x, y + height + 18 * scale);
  }

  private drawFragments(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    state: GameState
  ): void {
    const scale = state.scale;
    
    this.drawStar(ctx, x - 25 * scale, y + 12 * scale, 0, state);
    
    ctx.fillStyle = '#FFD700';
    ctx.font = `bold ${24 * scale}px sans-serif`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = '#FFD700';
    ctx.shadowBlur = 10;
    ctx.fillText(state.fragments.toString(), x, y + 12 * scale);
    ctx.shadowBlur = 0;
    
    ctx.fillStyle = '#B088FF';
    ctx.font = `${12 * scale}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(`碎片`, x, y + 40 * scale);
  }

  private drawWave(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    state: GameState
  ): void {
    const scale = state.scale;
    
    ctx.fillStyle = '#B088FF';
    ctx.font = `bold ${24 * scale}px sans-serif`;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillText(`第 ${state.wave} 波`, x, y + 12 * scale);
    
    ctx.font = `${12 * scale}px sans-serif`;
    ctx.fillText('怪物波次', x, y + 40 * scale);
  }

  private drawSequencePreview(ctx: CanvasRenderingContext2D, state: GameState): void {
    const scale = state.scale;
    const panelX = this.canvas.width - 20 * scale;
    const panelY = this.canvas.height - 20 * scale;
    const dotSize = 12 * scale;
    const dotSpacing = 20 * scale;
    const padding = 15 * scale;
    
    const sequenceLength = state.targetSequence.length;
    const panelWidth = sequenceLength * (dotSize + dotSpacing) - dotSpacing + padding * 2;
    const panelHeight = dotSize + padding * 2 + 30 * scale;
    
    const px = panelX - panelWidth;
    const py = panelY - panelHeight;
    
    ctx.fillStyle = 'rgba(42, 26, 94, 0.7)';
    ctx.strokeStyle = 'rgba(176, 136, 255, 0.5)';
    ctx.lineWidth = 2 * scale;
    this.drawRoundedRect(ctx, px, py, panelWidth, panelHeight, 10 * scale);
    ctx.fill();
    ctx.stroke();
    
    ctx.fillStyle = '#B088FF';
    ctx.font = `${12 * scale}px sans-serif`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('建议序列', px + padding, py + padding);
    
    const dotsY = py + padding + 25 * scale;
    
    for (let i = 0; i < sequenceLength; i++) {
      const element = state.targetSequence[i];
      const color = ELEMENT_COLORS[element];
      const dotX = px + padding + i * (dotSize + dotSpacing) + dotSize / 2;
      
      const breath = 0.8 + Math.sin(this.time / 500 + i * 0.5) * 0.2;
      const isCompleted = i < state.sequenceInput.length;
      const isCurrent = i === state.sequenceInput.length;
      
      if (isCurrent) {
        ctx.shadowColor = '#FFD700';
        ctx.shadowBlur = 15 * breath;
      }
      
      ctx.fillStyle = isCompleted ? this.adjustColorAlpha(color, 0.4) : color;
      ctx.beginPath();
      ctx.arc(dotX, dotsY, (dotSize / 2) * breath, 0, Math.PI * 2);
      ctx.fill();
      
      if (isCompleted) {
        ctx.strokeStyle = '#44FF88';
        ctx.lineWidth = 2 * scale;
        ctx.beginPath();
        ctx.moveTo(dotX - dotSize / 4, dotsY);
        ctx.lineTo(dotX - dotSize / 8, dotsY + dotSize / 4);
        ctx.lineTo(dotX + dotSize / 3, dotsY - dotSize / 4);
        ctx.stroke();
      }
      
      ctx.shadowBlur = 0;
    }
  }

  private drawStormIndicator(ctx: CanvasRenderingContext2D, state: GameState): void {
    const scale = state.scale;
    const x = this.canvas.width / 2;
    const y = 80 * scale;
    
    const timeLeft = Math.ceil(state.stormTimer / 1000);
    const element = state.stormElement ? ELEMENT_NAMES[state.stormElement] : '';
    
    ctx.fillStyle = '#FFD700';
    ctx.font = `bold ${20 * scale}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.shadowColor = '#FFD700';
    ctx.shadowBlur = 10;
    ctx.fillText(`⚡ 元素风暴 - ${element}属性 ⚡`, x, y);
    ctx.font = `${14 * scale}px sans-serif`;
    ctx.fillText(`剩余 ${timeLeft} 秒 | 成功: ${state.stormSuccessCount}次`, x, y + 25 * scale);
    ctx.shadowBlur = 0;
  }

  private drawRunePanel(ctx: CanvasRenderingContext2D, state: GameState): void {
    if (!state.showRunePanel) return;
    
    const scale = state.scale;
    const { x: panelX, y: panelY } = state.panelPosition;
    const buttonRadius = 25 * scale;
    const spacing = 60 * scale;
    
    const panelWidth = ALL_ELEMENTS.length * spacing + 40 * scale;
    const panelHeight = 100 * scale;
    const px = panelX - panelWidth / 2;
    const py = panelY - 130 * scale;
    
    ctx.fillStyle = 'rgba(42, 26, 94, 0.85)';
    ctx.strokeStyle = 'rgba(176, 136, 255, 0.6)';
    ctx.lineWidth = 2 * scale;
    this.drawRoundedRect(ctx, px, py, panelWidth, panelHeight, 15 * scale);
    ctx.fill();
    ctx.stroke();
    
    ctx.fillStyle = '#FFFFFF';
    ctx.font = `${14 * scale}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('选择符文', panelX, py + 25 * scale);
    
    for (let i = 0; i < ALL_ELEMENTS.length; i++) {
      const element = ALL_ELEMENTS[i];
      const btnX = panelX + (i - 2) * spacing;
      const btnY = py + 60 * scale;
      const color = ELEMENT_COLORS[element];
      
      ctx.shadowColor = color;
      ctx.shadowBlur = 15;
      
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(btnX, btnY, buttonRadius, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.shadowBlur = 0;
      
      ctx.fillStyle = '#FFFFFF';
      ctx.font = `bold ${14 * scale}px serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(ELEMENT_NAMES[element], btnX, btnY);
      
      ctx.font = `${10 * scale}px sans-serif`;
      ctx.fillText(ELEMENT_NAMES[element], btnX, btnY + buttonRadius + 15 * scale);
    }
  }

  private drawScreenFlash(ctx: CanvasRenderingContext2D, state: GameState): void {
    if (!state.screenFlash) return;
    
    const alpha = state.screenFlash.life / 200;
    ctx.fillStyle = this.adjustColorAlpha(state.screenFlash.color, alpha * 0.5);
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  private drawGameOver(ctx: CanvasRenderingContext2D, state: GameState): void {
    if (state.isRunning) return;
    
    const scale = state.scale;
    const { width, height } = this.canvas;
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, width, height);
    
    ctx.fillStyle = '#FF3355';
    ctx.font = `bold ${48 * scale}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = '#FF3355';
    ctx.shadowBlur = 20;
    ctx.fillText('游戏结束', width / 2, height / 2 - 50 * scale);
    
    ctx.fillStyle = '#FFD700';
    ctx.font = `${24 * scale}px sans-serif`;
    ctx.fillText(`坚持了 ${state.wave} 波`, width / 2, height / 2 + 10 * scale);
    ctx.fillText(`收集了 ${state.fragments} 个碎片`, width / 2, height / 2 + 50 * scale);
    ctx.shadowBlur = 0;
    
    ctx.fillStyle = '#B088FF';
    ctx.font = `${18 * scale}px sans-serif`;
    ctx.fillText('刷新页面重新开始', width / 2, height / 2 + 100 * scale);
  }

  private drawRoundedRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number
  ): void {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }

  private adjustColorAlpha(color: string, alpha: number): string {
    if (color.startsWith('#')) {
      const r = parseInt(color.slice(1, 3), 16);
      const g = parseInt(color.slice(3, 5), 16);
      const b = parseInt(color.slice(5, 7), 16);
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
    return color;
  }
}
