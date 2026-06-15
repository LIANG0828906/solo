export interface DialogButton {
  text: string;
  action: string;
  bounds: { x: number; y: number; width: number; height: number };
  hovered: boolean;
}

export class UI {
  dialogVisible: boolean = false;
  dialogOpening: boolean = false;
  dialogOpenProgress: number = 0;
  dialogText: string = '';
  dialogButtons: DialogButton[] = [];
  dialogCallback: ((action: string) => void) | null = null;
  private audioCtx: AudioContext | null = null;
  borderOffset: number = 0;
  startButtonHovered: boolean = false;
  startButtonBounds: { x: number; y: number; width: number; height: number } = {
    x: 0, y: 0, width: 0, height: 0
  };

  initAudio(): void {
    if (!this.audioCtx) {
      this.audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }

  playClickSound(): void {
    if (!this.audioCtx) return;
    try {
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.frequency.value = 800;
      osc.type = 'sine';
      gain.gain.setValueAtTime(0.3, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.1);
      osc.start(this.audioCtx.currentTime);
      osc.stop(this.audioCtx.currentTime + 0.1);
    } catch (e) {
      // ignore
    }
  }

  playSwordSound(): void {
    if (!this.audioCtx) return;
    try {
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.frequency.value = 1200;
      osc.type = 'sawtooth';
      gain.gain.setValueAtTime(0.2, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.15);
      osc.start(this.audioCtx.currentTime);
      osc.stop(this.audioCtx.currentTime + 0.15);
    } catch (e) {
      // ignore
    }
  }

  playVictorySound(): void {
    if (!this.audioCtx) return;
    try {
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.frequency.setValueAtTime(523, this.audioCtx.currentTime);
      osc.frequency.setValueAtTime(659, this.audioCtx.currentTime + 0.15);
      osc.frequency.setValueAtTime(784, this.audioCtx.currentTime + 0.3);
      osc.type = 'sine';
      gain.gain.setValueAtTime(0.3, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.5);
      osc.start(this.audioCtx.currentTime);
      osc.stop(this.audioCtx.currentTime + 0.5);
    } catch (e) {
      // ignore
    }
  }

  playDefeatSound(): void {
    if (!this.audioCtx) return;
    try {
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.frequency.setValueAtTime(400, this.audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(150, this.audioCtx.currentTime + 0.4);
      osc.type = 'sine';
      gain.gain.setValueAtTime(0.3, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.5);
      osc.start(this.audioCtx.currentTime);
      osc.stop(this.audioCtx.currentTime + 0.5);
    } catch (e) {
      // ignore
    }
  }

  showDialog(
    text: string,
    buttons: { text: string; action: string }[],
    callback: (action: string) => void
  ): void {
    this.dialogVisible = true;
    this.dialogOpening = true;
    this.dialogOpenProgress = 0;
    this.dialogText = text;
    this.dialogCallback = callback;
    this.dialogButtons = buttons.map(b => ({
      text: b.text,
      action: b.action,
      bounds: { x: 0, y: 0, width: 0, height: 0 },
      hovered: false
    }));
  }

  hideDialog(): void {
    this.dialogVisible = false;
    this.dialogOpening = false;
    this.dialogCallback = null;
    this.dialogButtons = [];
  }

  update(): void {
    if (this.dialogOpening) {
      this.dialogOpenProgress += 1 / 24;
      if (this.dialogOpenProgress >= 1) {
        this.dialogOpenProgress = 1;
        this.dialogOpening = false;
      }
    }
    this.borderOffset = (this.borderOffset + 0.3) % 60;
  }

  drawBorder(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    const bw = 20;
    ctx.fillStyle = '#6B4226';
    ctx.fillRect(0, 0, w, bw);
    ctx.fillRect(0, h - bw, w, bw);
    ctx.fillRect(0, 0, bw, h);
    ctx.fillRect(w - bw, 0, bw, h);

    ctx.strokeStyle = '#8B6914';
    ctx.lineWidth = 1;
    for (let i = 0; i < w; i += 30) {
      const x = i + this.borderOffset;
      ctx.beginPath();
      ctx.moveTo(x, 2);
      ctx.lineTo(x + 15, bw - 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x, h - 2);
      ctx.lineTo(x + 15, h - bw + 2);
      ctx.stroke();
    }
    for (let i = 0; i < h; i += 30) {
      const y = i + this.borderOffset;
      ctx.beginPath();
      ctx.moveTo(2, y);
      ctx.lineTo(bw - 2, y + 15);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(w - 2, y);
      ctx.lineTo(w - bw + 2, y + 15);
      ctx.stroke();
    }

    ctx.strokeStyle = '#4A2F1A';
    ctx.lineWidth = 2;
    ctx.strokeRect(bw, bw, w - bw * 2, h - bw * 2);

    const corners = [
      [0, 0], [w - 30, 0], [0, h - 30], [w - 30, h - 30]
    ];
    ctx.fillStyle = '#D4AF37';
    for (const [cx, cy] of corners) {
      ctx.beginPath();
      ctx.arc(cx + 15, cy + 15, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#8B6914';
      ctx.beginPath();
      ctx.arc(cx + 15, cy + 15, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#D4AF37';
    }
  }

  drawHUD(
    ctx: CanvasRenderingContext2D,
    player: { name: string; level: number; hp: number; maxHp: number; xp: number; xpToLevel: number; silver: number; food: number; weaponLevel: number; isUpgrading: boolean; upgradeTimer: number; getHpRatio: () => number; getXpRatio: () => number },
    world: { currentSegment: number; distance: number; getProgress: () => number },
    w: number,
    h: number
  ): void {
    const pad = 30;
    const avatarSize = 60;
    const avatarX = pad;
    const avatarY = pad;

    ctx.save();

    ctx.strokeStyle = '#B8860B';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = '#4A4A4A';
    ctx.beginPath();
    ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2 - 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#D2B48C';
    ctx.beginPath();
    ctx.arc(avatarX + avatarSize / 2, avatarY + 18, 10, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#C2A670';
    ctx.beginPath();
    ctx.ellipse(avatarX + avatarSize / 2, avatarY + 10, 16, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#4A4A4A';
    ctx.fillRect(avatarX + 15, avatarY + 26, 30, 28);

    if (player.isUpgrading) {
      const glowAlpha = Math.sin(player.upgradeTimer * 0.2) * 0.3 + 0.5;
      ctx.strokeStyle = `rgba(255, 215, 0, ${glowAlpha})`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2 + 5, 0, Math.PI * 2);
      ctx.stroke();
    }

    const infoX = avatarX + avatarSize + 12;
    const infoY = avatarY + 4;

    ctx.font = 'bold 16px "KaiTi", "STKaiti", "楷体", serif';
    ctx.fillStyle = '#3C2415';
    ctx.fillText(player.name, infoX, infoY + 14);

    ctx.font = '13px "KaiTi", "STKaiti", "楷体", serif';
    ctx.fillStyle = '#6B4226';
    ctx.fillText(`等级 ${player.level}`, infoX, infoY + 32);

    const hpBarX = infoX;
    const hpBarY = infoY + 38;
    const hpBarW = 120;
    const hpBarH = 12;

    ctx.fillStyle = '#3C2415';
    ctx.fillRect(hpBarX, hpBarY, hpBarW, hpBarH);

    const hpRatio = player.getHpRatio();
    const hpGrad = ctx.createLinearGradient(hpBarX, 0, hpBarX + hpBarW * hpRatio, 0);
    if (hpRatio > 0.5) {
      hpGrad.addColorStop(0, '#32CD32');
      hpGrad.addColorStop(1, '#228B22');
    } else if (hpRatio > 0.25) {
      hpGrad.addColorStop(0, '#FFD700');
      hpGrad.addColorStop(1, '#FF8C00');
    } else {
      hpGrad.addColorStop(0, '#FF4500');
      hpGrad.addColorStop(1, '#8B0000');
    }
    ctx.fillStyle = hpGrad;
    ctx.fillRect(hpBarX + 1, hpBarY + 1, (hpBarW - 2) * hpRatio, hpBarH - 2);

    ctx.font = '10px "KaiTi", "STKaiti", "楷体", serif';
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'center';
    ctx.fillText(`${player.hp}/${player.maxHp}`, hpBarX + hpBarW / 2, hpBarY + 10);
    ctx.textAlign = 'left';

    const xpBarY = hpBarY + hpBarH + 4;
    const xpBarH = 6;
    ctx.fillStyle = '#3C2415';
    ctx.fillRect(hpBarX, xpBarY, hpBarW, xpBarH);
    ctx.fillStyle = '#9370DB';
    ctx.fillRect(hpBarX + 1, xpBarY + 1, (hpBarW - 2) * player.getXpRatio(), xpBarH - 2);

    const progressX = w - 250;
    const progressY = pad + 8;
    const progressW = 210;
    const progressH = 10;

    ctx.fillStyle = '#3C2415';
    ctx.fillRect(progressX - 4, progressY - 20, progressW + 8, 55);

    ctx.font = 'bold 13px "KaiTi", "STKaiti", "楷体", serif';
    ctx.fillStyle = '#EDE4D4';
    ctx.fillText('任务进度', progressX, progressY - 4);

    ctx.fillStyle = '#8B7355';
    ctx.fillRect(progressX, progressY + 4, progressW, progressH);

    const overallProgress = world.getProgress();
    ctx.fillStyle = '#D4AF37';
    ctx.fillRect(progressX, progressY + 4, progressW * overallProgress, progressH);

    const segmentNames = ['长安', '华阴', '函谷关', '洛阳'];
    for (let i = 0; i <= 3; i++) {
      const dx = progressX + (progressW / 3) * i;
      const passed = world.currentSegment >= i;
      ctx.fillStyle = passed ? '#FFD700' : '#808080';
      ctx.beginPath();
      ctx.moveTo(dx, progressY + 2);
      ctx.lineTo(dx + 6, progressY + 9 + progressH / 2);
      ctx.lineTo(dx, progressY + 9 + progressH);
      ctx.lineTo(dx - 6, progressY + 9 + progressH / 2);
      ctx.closePath();
      ctx.fill();

      ctx.font = '10px "KaiTi", "STKaiti", "楷体", serif';
      ctx.fillStyle = '#EDE4D4';
      ctx.textAlign = 'center';
      ctx.fillText(segmentNames[i], dx, progressY + 9 + progressH + 14);
    }
    ctx.textAlign = 'left';

    const silverX = pad;
    const silverY = h - 50;

    ctx.fillStyle = '#B8860B';
    ctx.beginPath();
    ctx.arc(silverX + 12, silverY + 12, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#D4AF37';
    ctx.beginPath();
    ctx.arc(silverX + 12, silverY + 12, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#8B6914';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(silverX + 12, silverY + 12, 6, 0, Math.PI * 2);
    ctx.stroke();

    ctx.font = 'bold 15px "KaiTi", "STKaiti", "楷体", serif';
    ctx.fillStyle = '#3C2415';
    ctx.fillText(`${player.silver} 两`, silverX + 28, silverY + 17);

    ctx.font = '12px "KaiTi", "STKaiti", "楷体", serif';
    ctx.fillStyle = '#6B4226';
    ctx.fillText(`干粮×${player.food}  武器Lv${player.weaponLevel}`, silverX + 90, silverY + 17);

    ctx.restore();
  }

  drawDialog(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    if (!this.dialogVisible) return;

    const dialogW = Math.min(500, w - 100);
    const dialogH = 220;
    const dialogX = (w - dialogW) / 2;
    const dialogY = (h - dialogH) / 2;
    const progress = this.dialogOpenProgress;

    ctx.save();

    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.fillRect(0, 0, w, h);

    const openWidth = dialogW * progress;
    const openX = dialogX + (dialogW - openWidth) / 2;

    ctx.fillStyle = 'rgba(139, 69, 19, 0.85)';
    ctx.fillRect(openX, dialogY, openWidth, dialogH);

    const shaftW = 12;
    const shaftH = dialogH + 10;
    ctx.fillStyle = '#D4AF37';
    ctx.fillRect(openX - shaftW / 2, dialogY - 5, shaftW, shaftH);
    ctx.fillRect(openX + openWidth - shaftW / 2, dialogY - 5, shaftW, shaftH);

    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.arc(openX, dialogY + shaftH / 2 - 5, shaftW / 2 + 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(openX + openWidth, dialogY + shaftH / 2 - 5, shaftW / 2 + 3, 0, Math.PI * 2);
    ctx.fill();

    if (progress >= 1) {
      ctx.strokeStyle = '#D4AF37';
      ctx.lineWidth = 2;
      ctx.strokeRect(openX + 10, dialogY + 10, openWidth - 20, dialogH - 20);

      ctx.font = '18px "KaiTi", "STKaiti", "楷体", serif';
      ctx.fillStyle = '#EDE4D4';
      ctx.textAlign = 'center';

      const lines = this.wrapText(ctx, this.dialogText, openWidth - 60);
      const lineHeight = 26;
      const textStartY = dialogY + 50;
      for (let i = 0; i < lines.length; i++) {
        ctx.fillText(lines[i], w / 2, textStartY + i * lineHeight);
      }

      const btnW = 130;
      const btnH = 38;
      const btnY = dialogY + dialogH - 60;
      const totalBtnW = this.dialogButtons.length * btnW + (this.dialogButtons.length - 1) * 20;
      const btnStartX = (w - totalBtnW) / 2;

      for (let i = 0; i < this.dialogButtons.length; i++) {
        const btn = this.dialogButtons[i];
        const bx = btnStartX + i * (btnW + 20);
        const by = btnY;

        btn.bounds = { x: bx, y: by, width: btnW, height: btnH };

        ctx.fillStyle = '#8B0000';
        this.roundRect(ctx, bx, by, btnW, btnH, 6);
        ctx.fill();

        if (btn.hovered) {
          ctx.strokeStyle = '#FFA500';
          ctx.lineWidth = 3;
          ctx.shadowColor = '#FFA500';
          ctx.shadowBlur = 10;
        } else {
          ctx.strokeStyle = '#FFD700';
          ctx.lineWidth = 2;
          ctx.shadowBlur = 0;
        }
        this.roundRect(ctx, bx, by, btnW, btnH, 6);
        ctx.stroke();
        ctx.shadowBlur = 0;

        ctx.font = 'bold 16px "KaiTi", "STKaiti", "楷体", serif';
        ctx.fillStyle = '#FFD700';
        ctx.textAlign = 'center';
        ctx.fillText(btn.text, bx + btnW / 2, by + btnH / 2 + 6);
      }
      ctx.textAlign = 'left';
    }

    ctx.restore();
  }

  drawStartButton(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    const btnW = 120;
    const btnH = 50;
    const btnX = w - btnW - 40;
    const btnY = h - btnH - 40;

    this.startButtonBounds = { x: btnX, y: btnY, width: btnW, height: btnH };

    ctx.save();

    ctx.fillStyle = '#8B0000';
    this.roundRect(ctx, btnX, btnY, btnW, btnH, 8);
    ctx.fill();

    if (this.startButtonHovered) {
      ctx.strokeStyle = '#FFA500';
      ctx.lineWidth = 3;
      ctx.shadowColor = '#FFA500';
      ctx.shadowBlur = 12;
    } else {
      ctx.strokeStyle = '#FFD700';
      ctx.lineWidth = 2;
    }
    this.roundRect(ctx, btnX, btnY, btnW, btnH, 8);
    ctx.stroke();
    ctx.shadowBlur = 0;

    ctx.font = 'bold 22px "KaiTi", "STKaiti", "楷体", serif';
    ctx.fillStyle = '#FFD700';
    ctx.textAlign = 'center';
    ctx.fillText('起镖', btnX + btnW / 2, btnY + btnH / 2 + 8);
    ctx.textAlign = 'left';

    ctx.restore();
  }

  drawGameOver(ctx: CanvasRenderingContext2D, w: number, h: number, won: boolean): void {
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(0, 0, w, h);

    ctx.font = 'bold 48px "KaiTi", "STKaiti", "楷体", serif';
    ctx.fillStyle = won ? '#FFD700' : '#FF4500';
    ctx.textAlign = 'center';
    ctx.fillText(won ? '押镖成功！' : '镖车被劫！', w / 2, h / 2 - 20);

    ctx.font = '20px "KaiTi", "STKaiti", "楷体", serif';
    ctx.fillStyle = '#EDE4D4';
    ctx.fillText('点击任意处重新开始', w / 2, h / 2 + 30);
    ctx.textAlign = 'left';
    ctx.restore();
  }

  handleMouseMove(mx: number, my: number): void {
    if (this.dialogVisible && !this.dialogOpening) {
      for (const btn of this.dialogButtons) {
        btn.hovered = this.isInsideRect(mx, my, btn.bounds);
      }
    }

    const sb = this.startButtonBounds;
    this.startButtonHovered = this.isInsideRect(mx, my, sb);
  }

  handleDialogClick(mx: number, my: number): string | null {
    if (!this.dialogVisible || this.dialogOpening) return null;

    for (const btn of this.dialogButtons) {
      if (this.isInsideRect(mx, my, btn.bounds)) {
        const action = btn.action;
        this.playClickSound();
        this.hideDialog();
        return action;
      }
    }
    return null;
  }

  isStartButtonClick(mx: number, my: number): boolean {
    return this.isInsideRect(mx, my, this.startButtonBounds);
  }

  private isInsideRect(
    mx: number, my: number,
    rect: { x: number; y: number; width: number; height: number }
  ): boolean {
    return mx >= rect.x && mx <= rect.x + rect.width &&
           my >= rect.y && my <= rect.y + rect.height;
  }

  private roundRect(
    ctx: CanvasRenderingContext2D,
    x: number, y: number, w: number, h: number, r: number
  ): void {
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

  private wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
    const lines: string[] = [];
    let currentLine = '';
    for (const char of text) {
      const testLine = currentLine + char;
      if (ctx.measureText(testLine).width > maxWidth && currentLine.length > 0) {
        lines.push(currentLine);
        currentLine = char;
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine) lines.push(currentLine);
    return lines;
  }
}
