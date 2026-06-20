import { Creature } from '../entities/creature';

const SCENE_WIDTH = 800;
const SCENE_HEIGHT = 600;

export class Renderer {
    private ctx: CanvasRenderingContext2D;
    private canvas: HTMLCanvasElement;
    private time: number = 0;
    private fadeAlpha: number = 1;
    private fadeTarget: number = 1;

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d')!;
    }

    startFadeIn(): void {
        this.fadeAlpha = 0;
        this.fadeTarget = 1;
    }

    draw(creatures: Creature[], dt: number): void {
        this.time += dt;

        if (this.fadeAlpha < this.fadeTarget) {
            this.fadeAlpha = Math.min(1, this.fadeAlpha + dt / 0.4);
        }

        this.drawBackground();
        this.drawWaterWaves();

        for (const c of creatures) {
            this.drawCreature(c);
        }

        if (this.fadeAlpha < 1) {
            this.ctx.fillStyle = `rgba(11, 61, 145, ${1 - this.fadeAlpha})`;
            this.ctx.fillRect(0, 0, SCENE_WIDTH, SCENE_HEIGHT);
        }
    }

    getThumbnail(): ImageData {
        const offCanvas = document.createElement('canvas');
        offCanvas.width = 120;
        offCanvas.height = 90;
        const offCtx = offCanvas.getContext('2d')!;
        offCtx.drawImage(this.canvas, 0, 0, SCENE_WIDTH, SCENE_HEIGHT, 0, 0, 120, 90);
        return offCtx.getImageData(0, 0, 120, 90);
    }

    private drawBackground(): void {
        const gradient = this.ctx.createLinearGradient(0, 0, 0, SCENE_HEIGHT);
        gradient.addColorStop(0, '#0B3D91');
        gradient.addColorStop(1, '#1B5E9E');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, SCENE_WIDTH, SCENE_HEIGHT);
    }

    private drawWaterWaves(): void {
        this.ctx.save();
        this.ctx.globalAlpha = 0.12;

        const cx = SCENE_WIDTH / 2;
        const cy = SCENE_HEIGHT / 2;
        const phase = (this.time % 5) / 5;

        for (let i = 0; i < 4; i++) {
            const radius = 100 + i * 150;
            const offset = phase * Math.PI * 2 + i * 0.5;

            this.ctx.beginPath();
            this.ctx.strokeStyle = `rgba(255, 255, 255, ${0.4 - i * 0.08})`;
            this.ctx.lineWidth = 2;

            for (let angle = 0; angle <= Math.PI * 2; angle += 0.05) {
                const r = radius + Math.sin(angle * 6 + offset) * 15;
                const x = cx + Math.cos(angle) * r;
                const y = cy + Math.sin(angle) * r;
                if (angle === 0) {
                    this.ctx.moveTo(x, y);
                } else {
                    this.ctx.lineTo(x, y);
                }
            }
            this.ctx.closePath();
            this.ctx.stroke();
        }

        this.ctx.restore();
    }

    private drawCreature(c: Creature): void {
        this.ctx.save();
        this.ctx.translate(c.x, c.y);

        const angle = Math.atan2(c.vy, c.vx);
        this.ctx.rotate(angle);

        switch (c.type) {
            case 'fish':
                this.drawFish();
                break;
            case 'bigFish':
                this.drawBigFish();
                break;
            case 'plankton':
                this.drawPlankton();
                break;
        }

        this.ctx.restore();
    }

    private drawFish(): void {
        this.ctx.fillStyle = '#3B82F6';
        this.ctx.beginPath();
        this.ctx.moveTo(10, 0);
        this.ctx.lineTo(-8, -7);
        this.ctx.lineTo(-8, 7);
        this.ctx.closePath();
        this.ctx.fill();

        this.ctx.fillStyle = '#2563EB';
        this.ctx.beginPath();
        this.ctx.moveTo(-6, 0);
        this.ctx.lineTo(-14, -5);
        this.ctx.lineTo(-14, 5);
        this.ctx.closePath();
        this.ctx.fill();
    }

    private drawBigFish(): void {
        this.ctx.fillStyle = '#F97316';
        this.ctx.beginPath();
        this.ctx.moveTo(14, 0);
        this.ctx.lineTo(0, -10);
        this.ctx.lineTo(-14, 0);
        this.ctx.lineTo(0, 10);
        this.ctx.closePath();
        this.ctx.fill();

        this.ctx.fillStyle = '#EA580C';
        this.ctx.beginPath();
        this.ctx.moveTo(-10, 0);
        this.ctx.lineTo(-20, -7);
        this.ctx.lineTo(-20, 7);
        this.ctx.closePath();
        this.ctx.fill();
    }

    private drawPlankton(): void {
        this.ctx.fillStyle = '#22C55E';
        this.ctx.beginPath();
        this.ctx.arc(0, 0, 4, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.fillStyle = 'rgba(34, 197, 94, 0.3)';
        this.ctx.beginPath();
        this.ctx.arc(0, 0, 7, 0, Math.PI * 2);
        this.ctx.fill();
    }
}
