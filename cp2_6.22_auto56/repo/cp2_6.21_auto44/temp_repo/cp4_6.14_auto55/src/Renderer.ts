import type { Direction, Note, HitEffect, ShatterParticle, HitBurstParticle } from './NoteSystem';
import type { Enemy, KnockbackEffect, ScreenFlashEffect } from './EnemySystem';
import type { ComboEffect } from './ScoreManager';
import { NoteSystem } from './NoteSystem';

interface StarParticle {
  x: number;
  y: number;
  size: number;
  speed: number;
}

export class Renderer {
  private ctx: CanvasRenderingContext2D;
  private canvasWidth: number;
  private canvasHeight: number;
  private starParticles: StarParticle[] = [];
  private noteSystem: NoteSystem;

  constructor(ctx: CanvasRenderingContext2D, canvasWidth: number, canvasHeight: number, noteSystem: NoteSystem) {
    this.ctx = ctx;
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    this.noteSystem = noteSystem;
    this.initStarParticles();
  }

  private initStarParticles(): void {
    this.starParticles = [];
    for (let i = 0; i < 100; i++) {
      this.starParticles.push({
        x: Math.random() * this.canvasWidth,
        y: Math.random() * this.canvasHeight,
        size: 1 + Math.random() * 2,
        speed: 0.5
      });
    }
  }

  public updateCanvasSize(canvasWidth: number, canvasHeight: number): void {
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    this.initStarParticles();
  }

  public clear(): void {
    this.ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
  }

  public updateStars(): void {
    for (const star of this.starParticles) {
      star.y += star.speed;
      if (star.y > this.canvasHeight) {
        star.y = 0;
        star.x = Math.random() * this.canvasWidth;
      }
    }
  }

  public render(
    notes: Note[],
    enemies: Enemy[],
    hp: number,
    maxHp: number,
    score: number,
    combo: number,
    shouldShowCombo: boolean,
    hitEffects: HitEffect[],
    shatterParticles: ShatterParticle[],
    hitBurstParticles: HitBurstParticle[],
    knockbackEffects: KnockbackEffect[],
    screenFlashEffects: ScreenFlashEffect[],
    comboEffects: ComboEffect[],
    trackPositions: Map<Direction, number>,
    judgmentArea: { x: number; y: number; width: number; height: number },
    currentTime: number,
    playerPosition: { x: number; y: number },
    enemyRadius: number
  ): void {
    this.drawBackground();
    this.drawStars();
    this.drawTracks(trackPositions);
    this.drawJudgmentArea(judgmentArea);
    this.drawNotes(notes);
    this.drawEnemies(enemies, enemyRadius);
    this.drawHitBurstParticles(hitBurstParticles, currentTime);
    this.drawShatterParticles(shatterParticles, currentTime);
    this.drawKnockbackEffects(knockbackEffects, currentTime);
    this.drawHitEffects(hitEffects, currentTime);
    this.drawHPBar(hp, maxHp, currentTime);
    this.drawScore(score);
    if (shouldShowCombo) {
      this.drawCombo(combo);
    }
    this.drawComboEffects(comboEffects, currentTime);
    this.drawRhythmIndicator(playerPosition);
    this.drawScreenFlash(screenFlashEffects, currentTime);
  }

  private drawBackground(): void {
    const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvasHeight);
    gradient.addColorStop(0, '#1a1a2e');
    gradient.addColorStop(1, '#16213e');
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);
  }

  private drawStars(): void {
    this.ctx.fillStyle = '#ffffff';
    for (const star of this.starParticles) {
      this.ctx.beginPath();
      this.ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
      this.ctx.fill();
    }
  }

  private drawTracks(trackPositions: Map<Direction, number>): void {
    const trackWidth = 60;
    
    trackPositions.forEach((x) => {
      const gradient = this.ctx.createLinearGradient(x, 0, x, this.canvasHeight);
      gradient.addColorStop(0, 'rgba(0, 229, 255, 0)');
      gradient.addColorStop(0.5, 'rgba(0, 229, 255, 0.15)');
      gradient.addColorStop(1, 'rgba(0, 229, 255, 0)');
      
      this.ctx.fillStyle = gradient;
      this.ctx.fillRect(x - trackWidth / 2, 0, trackWidth, this.canvasHeight);
    });
  }

  private drawJudgmentArea(judgmentArea: { x: number; y: number; width: number; height: number }): void {
    this.ctx.fillStyle = 'rgba(200, 200, 200, 0.3)';
    this.ctx.fillRect(judgmentArea.x, judgmentArea.y, judgmentArea.width, judgmentArea.height);
    
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(judgmentArea.x, judgmentArea.y, judgmentArea.width, judgmentArea.height);
  }

  private drawNotes(notes: Note[]): void {
    const noteSize = 50;
    
    for (const note of notes) {
      const color = this.noteSystem.getDirectionColor(note.direction);
      const arrow = this.noteSystem.getDirectionArrow(note.direction);
      
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      this.ctx.beginPath();
      this.ctx.roundRect(note.x - noteSize / 2 + 2, note.y - noteSize / 2 + 2, noteSize, noteSize, 8);
      this.ctx.fill();
      
      this.ctx.fillStyle = color;
      this.ctx.beginPath();
      this.ctx.roundRect(note.x - noteSize / 2, note.y - noteSize / 2, noteSize, noteSize, 8);
      this.ctx.fill();
      
      this.ctx.strokeStyle = '#ffffff';
      this.ctx.lineWidth = 2;
      this.ctx.beginPath();
      this.ctx.roundRect(note.x - noteSize / 2, note.y - noteSize / 2, noteSize, noteSize, 8);
      this.ctx.stroke();
      
      this.ctx.fillStyle = '#ffffff';
      this.ctx.font = 'bold 28px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText(arrow, note.x, note.y);
    }
  }

  private drawEnemies(enemies: Enemy[], enemyRadius: number): void {
    for (const enemy of enemies) {
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      this.ctx.beginPath();
      this.ctx.arc(enemy.x + 2, enemy.y + 2, enemyRadius, 0, Math.PI * 2);
      this.ctx.fill();
      
      const gradient = this.ctx.createRadialGradient(
        enemy.x - enemyRadius * 0.3, enemy.y - enemyRadius * 0.3, 0,
        enemy.x, enemy.y, enemyRadius
      );
      gradient.addColorStop(0, '#ff6666');
      gradient.addColorStop(1, '#cc0000');
      
      this.ctx.fillStyle = gradient;
      this.ctx.beginPath();
      this.ctx.arc(enemy.x, enemy.y, enemyRadius, 0, Math.PI * 2);
      this.ctx.fill();
      
      this.ctx.strokeStyle = '#ff0000';
      this.ctx.lineWidth = 2;
      this.ctx.beginPath();
      this.ctx.arc(enemy.x, enemy.y, enemyRadius, 0, Math.PI * 2);
      this.ctx.stroke();
      
      const eyeOffsetX = enemyRadius * 0.35;
      const eyeY = enemy.y - enemyRadius * 0.15;
      const eyeWidth = enemyRadius * 0.25;
      const eyeHeight = enemy.isBlinking ? 2 : enemyRadius * 0.3;
      
      this.ctx.fillStyle = '#ffffff';
      this.ctx.beginPath();
      this.ctx.ellipse(enemy.x - eyeOffsetX, eyeY, eyeWidth, eyeHeight, 0, 0, Math.PI * 2);
      this.ctx.fill();
      
      this.ctx.beginPath();
      this.ctx.ellipse(enemy.x + eyeOffsetX, eyeY, eyeWidth, eyeHeight, 0, 0, Math.PI * 2);
      this.ctx.fill();
      
      if (!enemy.isBlinking) {
        this.ctx.fillStyle = '#000000';
        this.ctx.beginPath();
        this.ctx.arc(enemy.x - eyeOffsetX + 2, eyeY, eyeWidth * 0.5, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.beginPath();
        this.ctx.arc(enemy.x + eyeOffsetX + 2, eyeY, eyeWidth * 0.5, 0, Math.PI * 2);
        this.ctx.fill();
      }
      
      this.ctx.strokeStyle = '#000000';
      this.ctx.lineWidth = 2;
      this.ctx.beginPath();
      this.ctx.arc(enemy.x, enemy.y + enemyRadius * 0.25, enemyRadius * 0.25, 0.1 * Math.PI, 0.9 * Math.PI);
      this.ctx.stroke();
      
      const arrow = this.noteSystem.getDirectionArrow(enemy.direction);
      const color = this.noteSystem.getDirectionColor(enemy.direction);
      
      this.ctx.font = 'bold 16px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      
      this.ctx.shadowColor = color;
      this.ctx.shadowBlur = 10;
      this.ctx.fillStyle = color;
      this.ctx.fillText(arrow, enemy.x, enemy.y - enemyRadius - 15);
      this.ctx.shadowBlur = 0;
    }
  }

  private drawHitEffects(hitEffects: HitEffect[], currentTime: number): void {
    for (const effect of hitEffects) {
      const elapsed = currentTime - effect.startTime;
      const progress = elapsed / effect.duration;
      const alpha = 1 - progress;
      
      let text = '';
      let color = '';
      if (effect.type === 'perfect') {
        text = 'Perfect!';
        color = '#00ff00';
      } else {
        text = 'Good!';
        color = '#ffff00';
      }
      
      this.ctx.font = 'bold 24px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.shadowColor = color;
      this.ctx.shadowBlur = 15;
      this.ctx.fillStyle = color;
      this.ctx.globalAlpha = alpha;
      this.ctx.fillText(text, effect.x, effect.y - progress * 30);
      this.ctx.globalAlpha = 1;
      this.ctx.shadowBlur = 0;
    }
  }

  private drawShatterParticles(shatterParticles: ShatterParticle[], currentTime: number): void {
    for (const particle of shatterParticles) {
      const elapsed = currentTime - particle.startTime;
      const progress = elapsed / particle.duration;
      const alpha = 1 - progress;
      
      this.ctx.fillStyle = particle.color;
      this.ctx.globalAlpha = alpha;
      this.ctx.beginPath();
      this.ctx.arc(particle.x, particle.y, particle.size * (1 - progress * 0.5), 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.globalAlpha = 1;
    }
  }

  private drawHitBurstParticles(hitBurstParticles: HitBurstParticle[], currentTime: number): void {
    for (const particle of hitBurstParticles) {
      const elapsed = currentTime - particle.startTime;
      const progress = elapsed / particle.duration;
      const alpha = 1 - progress;
      
      this.ctx.fillStyle = particle.color;
      this.ctx.globalAlpha = alpha;
      this.ctx.beginPath();
      this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.globalAlpha = 1;
    }
  }

  private drawKnockbackEffects(knockbackEffects: KnockbackEffect[], currentTime: number): void {
    for (const effect of knockbackEffects) {
      const elapsed = currentTime - effect.startTime;
      const progress = elapsed / effect.duration;
      const alpha = 0.8 * (1 - progress);
      const radius = effect.maxRadius * progress;
      
      this.ctx.strokeStyle = '#ffffff';
      this.ctx.lineWidth = 3;
      this.ctx.globalAlpha = alpha;
      this.ctx.beginPath();
      this.ctx.arc(effect.x, effect.y, radius, 0, Math.PI * 2);
      this.ctx.stroke();
      this.ctx.globalAlpha = 1;
    }
  }

  private drawHPBar(hp: number, maxHp: number, currentTime: number): void {
    const barWidth = 300;
    const barHeight = 20;
    const barX = (this.canvasWidth - barWidth) / 2;
    const barY = 30;
    const hpPercent = Math.max(0, hp / maxHp);
    
    const bgGradient = this.ctx.createLinearGradient(barX, barY, barX, barY + barHeight);
    bgGradient.addColorStop(0, '#333333');
    bgGradient.addColorStop(1, '#1a1a1a');
    
    this.ctx.fillStyle = bgGradient;
    this.ctx.beginPath();
    this.ctx.roundRect(barX, barY, barWidth, barHeight, 10);
    this.ctx.fill();
    
    const hpGradient = this.ctx.createLinearGradient(barX, barY, barX, barY + barHeight);
    if (hpPercent > 0.5) {
      hpGradient.addColorStop(0, '#00ff00');
      hpGradient.addColorStop(1, '#00aa00');
    } else if (hpPercent > 0.25) {
      hpGradient.addColorStop(0, '#ffff00');
      hpGradient.addColorStop(1, '#aaaa00');
    } else {
      hpGradient.addColorStop(0, '#ff0000');
      hpGradient.addColorStop(1, '#aa0000');
    }
    
    let flashAlpha = 1;
    if (hpPercent < 0.3) {
      flashAlpha = 0.7 + Math.sin(currentTime * 0.01) * 0.3;
    }
    
    this.ctx.globalAlpha = flashAlpha;
    this.ctx.fillStyle = hpGradient;
    this.ctx.beginPath();
    this.ctx.roundRect(barX, barY, barWidth * hpPercent, barHeight, 10);
    this.ctx.fill();
    this.ctx.globalAlpha = 1;
    
    this.ctx.strokeStyle = '#00e5ff';
    this.ctx.lineWidth = 2;
    this.ctx.shadowColor = '#00e5ff';
    this.ctx.shadowBlur = 10;
    this.ctx.beginPath();
    this.ctx.roundRect(barX, barY, barWidth, barHeight, 10);
    this.ctx.stroke();
    this.ctx.shadowBlur = 0;
    
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = 'bold 14px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(`HP: ${Math.max(0, hp)} / ${maxHp}`, barX + barWidth / 2, barY + barHeight / 2);
  }

  private drawScore(score: number): void {
    const x = this.canvasWidth - 30;
    const y = 60;
    
    this.ctx.font = 'bold 24px Arial';
    this.ctx.textAlign = 'right';
    this.ctx.textBaseline = 'middle';
    this.ctx.shadowColor = '#00e5ff';
    this.ctx.shadowBlur = 10;
    this.ctx.fillStyle = '#00e5ff';
    this.ctx.fillText(`得分: ${score}`, x, y);
    this.ctx.shadowBlur = 0;
  }

  private drawCombo(combo: number): void {
    const x = this.canvasWidth - 30;
    const y = 95;
    
    this.ctx.font = 'bold 24px Arial';
    this.ctx.textAlign = 'right';
    this.ctx.textBaseline = 'middle';
    this.ctx.shadowColor = '#ffffff';
    this.ctx.shadowBlur = 10;
    this.ctx.fillStyle = '#ffffff';
    this.ctx.fillText(`连击: ${combo}`, x, y);
    this.ctx.shadowBlur = 0;
  }

  private drawComboEffects(comboEffects: ComboEffect[], currentTime: number): void {
    for (const effect of comboEffects) {
      const elapsed = currentTime - effect.startTime;
      const progress = elapsed / effect.duration;
      
      let scale = 1;
      if (progress < 0.3) {
        scale = 1 + (1.2 - 1) * (progress / 0.3);
      } else {
        scale = 1.2 - (1.2 - 1) * ((progress - 0.3) / 0.7);
      }
      
      const alpha = progress < 0.8 ? 1 : 1 - ((progress - 0.8) / 0.2);
      
      const centerX = this.canvasWidth / 2;
      const centerY = this.canvasHeight / 2;
      
      this.ctx.save();
      this.ctx.translate(centerX, centerY);
      this.ctx.scale(scale, scale);
      
      this.ctx.font = 'bold 48px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.shadowColor = '#ffd700';
      this.ctx.shadowBlur = 20;
      this.ctx.fillStyle = '#ffd700';
      this.ctx.globalAlpha = alpha;
      this.ctx.fillText(`Combo x${effect.comboCount}!`, 0, 0);
      this.ctx.globalAlpha = 1;
      this.ctx.shadowBlur = 0;
      
      this.ctx.restore();
    }
  }

  private drawRhythmIndicator(playerPosition: { x: number; y: number }): void {
    const size = 20;
    
    this.ctx.strokeStyle = '#d500f9';
    this.ctx.lineWidth = 3;
    this.ctx.shadowColor = '#d500f9';
    this.ctx.shadowBlur = 15;
    this.ctx.beginPath();
    this.ctx.arc(playerPosition.x, playerPosition.y, size, 0, Math.PI * 2);
    this.ctx.stroke();
    
    this.ctx.fillStyle = '#00e5ff';
    this.ctx.beginPath();
    this.ctx.arc(playerPosition.x, playerPosition.y, size * 0.5, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.shadowBlur = 0;
    
    const directions: Array<{ dir: Direction; angle: number }> = [
      { dir: 'up', angle: -Math.PI / 2 },
      { dir: 'down', angle: Math.PI / 2 },
      { dir: 'left', angle: Math.PI },
      { dir: 'right', angle: 0 }
    ];
    
    for (const { dir, angle } of directions) {
      const arrowX = playerPosition.x + Math.cos(angle) * (size + 15);
      const arrowY = playerPosition.y + Math.sin(angle) * (size + 15);
      const arrow = this.noteSystem.getDirectionArrow(dir);
      const color = this.noteSystem.getDirectionColor(dir);
      
      this.ctx.font = 'bold 16px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.shadowColor = color;
      this.ctx.shadowBlur = 8;
      this.ctx.fillStyle = color;
      this.ctx.fillText(arrow, arrowX, arrowY);
      this.ctx.shadowBlur = 0;
    }
  }

  private drawScreenFlash(screenFlashEffects: ScreenFlashEffect[], currentTime: number): void {
    for (const effect of screenFlashEffects) {
      const elapsed = currentTime - effect.startTime;
      const progress = elapsed / effect.duration;
      const alpha = 0.5 * (1 - progress);
      
      this.ctx.fillStyle = `rgba(255, 0, 0, ${alpha})`;
      this.ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);
    }
  }
}
