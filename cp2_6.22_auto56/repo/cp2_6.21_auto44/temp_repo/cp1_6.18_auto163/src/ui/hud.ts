import { BattleState } from '../engine/battleEngine';

export class HUD {
  render(ctx: CanvasRenderingContext2D, state: BattleState, canvasWidth: number) {
    this.drawStatusBar(ctx, state, canvasWidth);
  }

  private drawStatusBar(ctx: CanvasRenderingContext2D, state: BattleState, canvasWidth: number) {
    const barH = 60;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(0, 0, canvasWidth, barH);

    ctx.fillStyle = '#111';
    this.roundRect(ctx, 12, 14, 130, 16, 4);
    ctx.fill();

    const hpRatio = state.playerHp / state.playerMaxHp;
    const hpColor = hpRatio > 0.5 ? '#FF4500' : hpRatio > 0.25 ? '#FF8C00' : '#FF0000';
    ctx.fillStyle = hpColor;
    this.roundRect(ctx, 12, 14, 130 * hpRatio, 16, 4);
    ctx.fill();

    ctx.fillStyle = '#FFF';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${state.playerHp}/${state.playerMaxHp}`, 77, 26);

    ctx.fillStyle = '#FFF';
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`回合 ${state.turn}`, canvasWidth / 2, 28);

    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`积分 ${state.score}`, canvasWidth - 15, 28);

    if (state.wave > 0) {
      ctx.fillStyle = '#E94560';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(`第 ${state.wave} 波`, canvasWidth - 15, 46);
    }

    if (state.enemies.length > 0) {
      ctx.fillStyle = '#FF6B6B';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`敌人: ${state.enemies.length}`, 15, 46);
    }
  }

  private roundRect(
    ctx: CanvasRenderingContext2D,
    x: number, y: number,
    w: number, h: number,
    r: number
  ) {
    if (w <= 0) return;
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
