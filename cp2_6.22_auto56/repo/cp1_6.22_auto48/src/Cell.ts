export enum CellState {
    EMPTY,
    FADE_IN,
    NORMAL,
    SELECTED,
    ELIMINATING,
    ERROR,
    HINT
}

export const ICON_EMOJIS = ['🐱', '🐶', '🐰', '🐻', '🐟', '🌸', '⭐', '❤️'];

export const ICON_BG_COLORS = [
    '#FFE0E6', '#FFF0E0', '#E0F4FF', '#F0E6FF',
    '#E0FFF0', '#FFF5CC', '#FFF0F5', '#FFE8EC'
];

export const ICON_BORDER_COLORS = [
    '#FF9AA2', '#FFB347', '#87CEEB', '#C3A6E0',
    '#77DD77', '#FFD700', '#FF69B4', '#FF6B6B'
];

export class Cell {
    row: number;
    col: number;
    iconType: number;
    state: CellState;
    stateStartTime: number = 0;
    fadeDelay: number = 0;

    constructor(row: number, col: number, iconType: number) {
        this.row = row;
        this.col = col;
        this.iconType = iconType;
        this.state = iconType === -1 ? CellState.EMPTY : CellState.FADE_IN;
    }

    get isEmpty(): boolean {
        return this.iconType === -1;
    }

    setState(state: CellState, time: number): void {
        this.state = state;
        this.stateStartTime = time;
    }

    isStateFinished(time: number, duration: number): boolean {
        return (time - this.stateStartTime) >= duration;
    }

    draw(
        ctx: CanvasRenderingContext2D,
        x: number, y: number, size: number,
        time: number,
        elimProgress?: number,
        elimCenterX?: number,
        elimCenterY?: number,
        isHovered?: boolean
    ): void {
        if (this.state === CellState.EMPTY) return;

        const elapsed = time - this.stateStartTime;
        const pad = 3;
        const inner = size - pad * 2;
        const cx = x + size / 2;
        const cy = y + size / 2;

        ctx.save();

        let alpha = 1;
        if (this.state === CellState.FADE_IN) {
            const fadeStart = this.fadeDelay;
            const fadeElapsed = time - fadeStart;
            alpha = Math.max(0, Math.min(1, fadeElapsed / 400));
            if (alpha >= 1) {
                this.state = CellState.NORMAL;
            }
        }

        let scale = 1;
        let rotation = 0;
        let drawX = x;
        let drawY = y;

        if (elimProgress !== undefined && elimProgress > 0) {
            const t = Math.min(1, elimProgress);
            const ease = t * t * (3 - 2 * t);
            scale = 1 - ease;
            rotation = ease * Math.PI * 1.5;
            if (elimCenterX !== undefined && elimCenterY !== undefined) {
                drawX = x + (elimCenterX - cx) * ease;
                drawY = y + (elimCenterY - cy) * ease;
            }
        }

        if (this.state === CellState.ERROR) {
            if (elapsed >= 300) {
                this.state = CellState.NORMAL;
            }
        }

        if (this.state === CellState.HINT) {
            if (elapsed >= 900) {
                this.state = CellState.NORMAL;
            }
        }

        const newCx = drawX + size / 2;
        const newCy = drawY + size / 2;

        ctx.translate(newCx, newCy);
        ctx.rotate(rotation);
        ctx.scale(scale, scale);
        ctx.translate(-newCx, -newCy);
        ctx.globalAlpha = alpha * (elimProgress !== undefined && elimProgress > 0 ? (1 - elimProgress) : 1);

        const hoverScale = (isHovered && this.state === CellState.NORMAL && !(elimProgress !== undefined && elimProgress > 0)) ? 1.06 : 1;
        if (hoverScale !== 1) {
            ctx.translate(newCx, newCy);
            ctx.scale(hoverScale, hoverScale);
            ctx.translate(-newCx, -newCy);
        }

        const bgX = drawX + pad;
        const bgY = drawY + pad;

        ctx.fillStyle = ICON_BG_COLORS[this.iconType] || '#FFFFFF';
        this.roundRect(ctx, bgX, bgY, inner, inner, 10);
        ctx.fill();

        ctx.strokeStyle = ICON_BORDER_COLORS[this.iconType] || '#DDDDDD';
        ctx.lineWidth = 2;
        this.roundRect(ctx, bgX, bgY, inner, inner, 10);
        ctx.stroke();

        if (isHovered && this.state === CellState.NORMAL) {
            ctx.shadowColor = 'rgba(0,0,0,0.15)';
            ctx.shadowBlur = 8;
            ctx.shadowOffsetY = 3;
        }

        if (this.state === CellState.SELECTED) {
            const pulsePhase = (elapsed / 500) * Math.PI * 2;
            const pulseAlpha = 0.4 + 0.6 * (0.5 + 0.5 * Math.sin(pulsePhase));
            ctx.strokeStyle = `rgba(60, 120, 255, ${pulseAlpha})`;
            ctx.lineWidth = 4;
            this.roundRect(ctx, bgX - 1, bgY - 1, inner + 2, inner + 2, 11);
            ctx.stroke();

            ctx.shadowColor = `rgba(60, 120, 255, ${pulseAlpha * 0.5})`;
            ctx.shadowBlur = 12;
            ctx.strokeStyle = `rgba(60, 120, 255, ${pulseAlpha * 0.4})`;
            ctx.lineWidth = 2;
            this.roundRect(ctx, bgX - 2, bgY - 2, inner + 4, inner + 4, 12);
            ctx.stroke();
        }

        if (this.state === CellState.ERROR) {
            const flashCycle = elapsed / 100;
            const flashOn = Math.floor(flashCycle) % 2 === 0;
            if (flashOn) {
                ctx.fillStyle = 'rgba(255, 50, 50, 0.45)';
                this.roundRect(ctx, bgX, bgY, inner, inner, 10);
                ctx.fill();
            }
            ctx.strokeStyle = '#FF3333';
            ctx.lineWidth = 3;
            this.roundRect(ctx, bgX, bgY, inner, inner, 10);
            ctx.stroke();
        }

        if (this.state === CellState.HINT) {
            const flashCycle = elapsed / 150;
            const flashOn = Math.floor(flashCycle) % 2 === 0;
            if (flashOn) {
                ctx.strokeStyle = '#FFD700';
                ctx.lineWidth = 4;
                this.roundRect(ctx, bgX - 1, bgY - 1, inner + 2, inner + 2, 11);
                ctx.stroke();

                ctx.shadowColor = 'rgba(255, 215, 0, 0.6)';
                ctx.shadowBlur = 10;
                ctx.strokeStyle = 'rgba(255, 215, 0, 0.4)';
                ctx.lineWidth = 2;
                this.roundRect(ctx, bgX - 2, bgY - 2, inner + 4, inner + 4, 12);
                ctx.stroke();
            }
        }

        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetY = 0;

        const fontSize = inner * 0.55;
        ctx.font = `${fontSize}px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(ICON_EMOJIS[this.iconType], newCx, newCy + 1);

        ctx.restore();
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
}
