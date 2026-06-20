import { Vector2, Projectile, Fragment } from './physicsEngine';
import { Structure, Particle, GameState, Unit, GameStats, type StructureType } from './gameState';

export class Renderer {
    private static readonly COLORS = {
        parchment: '#F4E4BC',
        brownDark: '#5D4037',
        brownLight: '#8D6E63',
        warmYellow: '#D4A574',
        gridGreen: '#90EE90',
        redWarning: '#FF4444',
        handDrawnStroke: '#3E2723',
    };

    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
    width: number;
    height: number;
    gridSize: number = 50;
    hoveredSkillIndex: number = -1;
    buttonPressStates: Map<string, { pressed: boolean; time: number }>;

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d')!;
        this.width = canvas.width;
        this.height = canvas.height;
        this.buttonPressStates = new Map();
    }

    resize(w: number, h: number): void {
        this.width = w;
        this.height = h;
        this.canvas.width = w;
        this.canvas.height = h;
    }

    clear(): void {
        this.ctx.clearRect(0, 0, this.width, this.height);
    }

    private easeOutElastic(t: number): number {
        const c4 = (2 * Math.PI) / 3;
        return t === 0
            ? 0
            : t === 1
            ? 1
            : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
    }

    private easeInOutQuad(t: number): number {
        return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    }

    private easeOutBack(t: number): number {
        const c1 = 1.70158;
        const c3 = c1 + 1;
        return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
    }

    private jitter(amount: number = 1): number {
        return (Math.random() - 0.5) * amount;
    }

    drawHandDrawnRect(
        x: number,
        y: number,
        w: number,
        h: number,
        fillColor: string,
        strokeColor: string = Renderer.COLORS.handDrawnStroke,
        lineWidth: number = 2
    ): void {
        const ctx = this.ctx;
        const j = 1.5;

        ctx.save();
        ctx.beginPath();
        ctx.moveTo(x + this.jitter(j), y + this.jitter(j));
        ctx.lineTo(x + w + this.jitter(j), y + this.jitter(j));
        ctx.lineTo(x + w + this.jitter(j), y + h + this.jitter(j));
        ctx.lineTo(x + this.jitter(j), y + h + this.jitter(j));
        ctx.closePath();

        if (fillColor) {
            ctx.fillStyle = fillColor;
            ctx.fill();
        }

        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = lineWidth;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();
        ctx.restore();
    }

    drawHandDrawnCircle(
        x: number,
        y: number,
        r: number,
        fillColor: string,
        strokeColor: string = Renderer.COLORS.handDrawnStroke,
        lineWidth: number = 2
    ): void {
        const ctx = this.ctx;
        const segments = 16;
        const j = 1;

        ctx.save();
        ctx.beginPath();
        for (let i = 0; i <= segments; i++) {
            const angle = (i / segments) * Math.PI * 2;
            const radius = r + this.jitter(j);
            const px = x + Math.cos(angle) * radius;
            const py = y + Math.sin(angle) * radius;
            if (i === 0) {
                ctx.moveTo(px, py);
            } else {
                ctx.lineTo(px, py);
            }
        }
        ctx.closePath();

        if (fillColor) {
            ctx.fillStyle = fillColor;
            ctx.fill();
        }

        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = lineWidth;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();
        ctx.restore();
    }

    drawGrid(): void {
        const ctx = this.ctx;
        ctx.save();
        ctx.strokeStyle = Renderer.COLORS.gridGreen;
        ctx.lineWidth = 0.5;
        ctx.globalAlpha = 0.3;

        for (let x = 0; x <= this.width; x += this.gridSize) {
            ctx.beginPath();
            ctx.moveTo(x + this.jitter(0.5), 0);
            ctx.lineTo(x + this.jitter(0.5), this.height);
            ctx.stroke();
        }

        for (let y = 0; y <= this.height; y += this.gridSize) {
            ctx.beginPath();
            ctx.moveTo(0, y + this.jitter(0.5));
            ctx.lineTo(this.width, y + this.jitter(0.5));
            ctx.stroke();
        }

        ctx.restore();
    }

    drawStructure(structure: Structure): void {
        const { position, type, placementProgress, scale, health, maxHealth } = structure;
        const x = position.x * this.gridSize;
        const y = position.y * this.gridSize;
        const w = this.gridSize * scale;
        const h = this.gridSize * scale;

        const structureType: StructureType = type;

        const animatedScale = 0.5 + 0.5 * this.easeOutElastic(placementProgress);
        const drawW = w * animatedScale;
        const drawH = h * animatedScale;
        const offsetX = (this.gridSize - drawW) / 2;
        const offsetY = (this.gridSize - drawH) / 2;

        this.ctx.save();
        this.ctx.translate(x + offsetX, y + offsetY);

        switch (structureType) {
            case 'wall':
                this.drawWall(drawW, drawH);
                break;
            case 'fence':
                this.drawFence(drawW, drawH);
                break;
            case 'sandbag':
                this.drawSandbag(drawW, drawH);
                break;
        }

        if (health < maxHealth) {
            const barWidth = drawW * 0.8;
            const barHeight = 4;
            const barX = (drawW - barWidth) / 2;
            const barY = drawH + 5;
            const healthPercent = health / maxHealth;

            this.ctx.fillStyle = '#333';
            this.ctx.fillRect(barX, barY, barWidth, barHeight);
            this.ctx.fillStyle = healthPercent > 0.5 ? '#4CAF50' : healthPercent > 0.25 ? '#FFC107' : '#F44336';
            this.ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight);
        }

        this.ctx.restore();
    }

    private drawWall(w: number, h: number): void {
        this.drawHandDrawnRect(0, 0, w, h, '#9E9E9E', '#616161', 2);

        const ctx = this.ctx;
        ctx.save();
        ctx.strokeStyle = '#757575';
        ctx.lineWidth = 1;

        const brickH = h / 4;
        for (let row = 0; row < 4; row++) {
            const y = row * brickH;
            const offset = row % 2 === 0 ? 0 : w / 2;
            for (let bx = -w / 2; bx < w * 1.5; bx += w / 2) {
                ctx.beginPath();
                ctx.moveTo(bx + offset + this.jitter(0.5), y + this.jitter(0.5));
                ctx.lineTo(bx + offset + this.jitter(0.5), y + brickH + this.jitter(0.5));
                ctx.stroke();
            }
            ctx.beginPath();
            ctx.moveTo(0 + this.jitter(0.5), y + brickH + this.jitter(0.5));
            ctx.lineTo(w + this.jitter(0.5), y + brickH + this.jitter(0.5));
            ctx.stroke();
        }
        ctx.restore();
    }

    private drawFence(w: number, h: number): void {
        const ctx = this.ctx;
        const postCount = 5;
        const postW = w / (postCount * 2 - 1);

        for (let i = 0; i < postCount; i++) {
            const px = i * postW * 2;
            this.drawHandDrawnRect(px, 0, postW, h, Renderer.COLORS.brownLight, Renderer.COLORS.brownDark, 1);

            ctx.save();
            ctx.strokeStyle = Renderer.COLORS.brownDark;
            ctx.lineWidth = 0.5;
            for (let ly = h / 6; ly < h; ly += h / 6) {
                ctx.beginPath();
                ctx.moveTo(px + 2 + this.jitter(0.3), ly + this.jitter(0.3));
                ctx.lineTo(px + postW - 2 + this.jitter(0.3), ly + this.jitter(0.3));
                ctx.stroke();
            }
            ctx.restore();
        }

        ctx.save();
        ctx.fillStyle = Renderer.COLORS.brownDark;
        for (let i = 0; i < postCount; i++) {
            const px = i * postW * 2;
            ctx.beginPath();
            ctx.moveTo(px + postW / 2, -3);
            ctx.lineTo(px + postW + 2, 5);
            ctx.lineTo(px - 2, 5);
            ctx.closePath();
            ctx.fill();
        }
        ctx.restore();
    }

    private drawSandbag(w: number, h: number): void {
        this.drawHandDrawnRect(0, 0, w, h, Renderer.COLORS.warmYellow, Renderer.COLORS.brownDark, 2);

        const ctx = this.ctx;
        ctx.save();
        ctx.strokeStyle = Renderer.COLORS.brownDark;
        ctx.lineWidth = 1;

        const bagH = h / 3;
        for (let row = 0; row < 3; row++) {
            const y = row * bagH;
            const offset = row % 2 === 0 ? 0 : w / 3;

            for (let bx = -w / 3; bx < w * 1.5; bx += w / 3) {
                const bagX = bx + offset;
                if (bagX < -w / 6 || bagX > w + w / 6) continue;

                ctx.beginPath();
                ctx.moveTo(bagX + this.jitter(0.5), y + this.jitter(0.5));
                ctx.quadraticCurveTo(
                    bagX + w / 6 + this.jitter(0.5),
                    y + bagH / 2 + this.jitter(0.5),
                    bagX + w / 3 + this.jitter(0.5),
                    y + this.jitter(0.5)
                );
                ctx.stroke();
            }

            ctx.beginPath();
            ctx.moveTo(0 + this.jitter(0.5), y + bagH + this.jitter(0.5));
            ctx.lineTo(w + this.jitter(0.5), y + bagH + this.jitter(0.5));
            ctx.stroke();
        }

        ctx.strokeStyle = Renderer.COLORS.brownLight;
        ctx.lineWidth = 0.5;
        for (let i = 0; i < 8; i++) {
            ctx.beginPath();
            ctx.moveTo(
                Math.random() * w + this.jitter(1),
                Math.random() * h + this.jitter(1)
            );
            ctx.lineTo(
                Math.random() * w + this.jitter(1),
                Math.random() * h + this.jitter(1)
            );
            ctx.stroke();
        }
        ctx.restore();
    }

    drawProjectile(projectile: Projectile): void {
        const { position, radius } = projectile;
        const x = position.x * this.gridSize;
        const y = position.y * this.gridSize;

        const ctx = this.ctx;
        ctx.save();

        ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
        ctx.shadowBlur = 5;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;

        const gradient = ctx.createRadialGradient(
            x - radius * 0.3,
            y - radius * 0.3,
            0,
            x,
            y,
            radius
        );
        gradient.addColorStop(0, '#B0BEC5');
        gradient.addColorStop(0.5, '#78909C');
        gradient.addColorStop(1, '#455A64');

        this.drawHandDrawnCircle(x, y, radius, gradient as unknown as string, '#263238', 1.5);

        ctx.restore();
    }

    drawParticle(particle: Particle): void {
        const { position, color, life, maxLife, size } = particle;
        const x = position.x * this.gridSize;
        const y = position.y * this.gridSize;
        const alpha = life / maxLife;

        const ctx = this.ctx;
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    drawFragment(fragment: Fragment, type: string): void {
        const { position, rotation, mass } = fragment;
        const x = position.x * this.gridSize;
        const y = position.y * this.gridSize;
        const size = 3 + mass * 2;

        const ctx = this.ctx;
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(rotation);

        const colors: Record<string, string> = {
            wall: '#9E9E9E',
            fence: Renderer.COLORS.brownLight,
            sandbag: Renderer.COLORS.warmYellow,
        };

        ctx.fillStyle = colors[type] || '#888';
        ctx.strokeStyle = Renderer.COLORS.handDrawnStroke;
        ctx.lineWidth = 1;

        ctx.beginPath();
        const points = 5 + Math.floor(Math.random() * 3);
        for (let i = 0; i < points; i++) {
            const angle = (i / points) * Math.PI * 2;
            const r = size * (0.5 + Math.random() * 0.5);
            const px = Math.cos(angle) * r + this.jitter(0.5);
            const py = Math.sin(angle) * r + this.jitter(0.5);
            if (i === 0) {
                ctx.moveTo(px, py);
            } else {
                ctx.lineTo(px, py);
            }
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.restore();
    }

    drawTrajectory(points: Vector2[]): void {
        const ctx = this.ctx;
        ctx.save();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);

        ctx.beginPath();
        for (let i = 0; i < points.length; i++) {
            const x = points[i].x * this.gridSize;
            const y = points[i].y * this.gridSize;
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        ctx.stroke();

        ctx.setLineDash([]);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        for (let i = 0; i < points.length; i += 10) {
            const x = points[i].x * this.gridSize;
            const y = points[i].y * this.gridSize;
            ctx.beginPath();
            ctx.arc(x, y, 3, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }

    drawWarningCircle(position: Vector2, progress: number): void {
        const x = position.x * this.gridSize;
        const y = position.y * this.gridSize;
        const startRadius = 150;
        const endRadius = 25;
        const radius = startRadius - (startRadius - endRadius) * progress;

        const ctx = this.ctx;
        ctx.save();

        const flash = Math.sin(progress * Math.PI * 8) * 0.3 + 0.7;
        ctx.globalAlpha = flash;
        ctx.strokeStyle = Renderer.COLORS.redWarning;
        ctx.lineWidth = 3;

        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.stroke();

        ctx.globalAlpha = flash * 0.2;
        ctx.fillStyle = Renderer.COLORS.redWarning;
        ctx.fill();

        ctx.restore();
    }

    drawChargeBar(level: number, cannonPos: Vector2): void {
        const x = cannonPos.x * this.gridSize - 40;
        const y = cannonPos.y * this.gridSize - 50;
        const w = 12;
        const h = 100;

        const ctx = this.ctx;
        ctx.save();

        this.drawHandDrawnRect(x - 2, y - 2, w + 4, h + 4, '#333', '#222', 2);

        const fillH = h * level;
        const fillY = y + h - fillH;
        const gradient = ctx.createLinearGradient(x, y + h, x, y);
        gradient.addColorStop(0, '#888');
        gradient.addColorStop(0.5, '#FF8A65');
        gradient.addColorStop(1, Renderer.COLORS.redWarning);

        ctx.fillStyle = gradient;
        ctx.fillRect(x, fillY, w, fillH);

        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, fillY, w, fillH);

        ctx.fillStyle = '#fff';
        ctx.font = 'bold 12px serif';
        ctx.textAlign = 'center';
        ctx.fillText(`${Math.floor(level * 100)}%`, x + w / 2, y + h + 15);

        ctx.restore();
    }

    drawCannon(position: Vector2, angle: number, heatLevel: number): void {
        const x = position.x * this.gridSize;
        const y = position.y * this.gridSize;

        const ctx = this.ctx;
        ctx.save();

        const bodyGradient = ctx.createRadialGradient(x, y, 0, x, y, 30);
        bodyGradient.addColorStop(0, '#9E9E9E');
        bodyGradient.addColorStop(1, '#616161');

        const heatColor = this.interpolateColor('#616161', '#F44336', heatLevel);
        bodyGradient.addColorStop(1, heatColor);

        this.drawHandDrawnCircle(x, y + 10, 28, bodyGradient as unknown as string, '#424242', 3);

        ctx.translate(x, y);
        ctx.rotate(-angle);

        ctx.fillStyle = '#424242';
        ctx.strokeStyle = '#212121';
        ctx.lineWidth = 2;

        ctx.beginPath();
        ctx.moveTo(-5, -10);
        ctx.lineTo(50, -8);
        ctx.lineTo(55, 0);
        ctx.lineTo(50, 8);
        ctx.lineTo(-5, 10);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        const barrelHeatGradient = ctx.createLinearGradient(0, 0, 55, 0);
        barrelHeatGradient.addColorStop(0, '#616161');
        barrelHeatGradient.addColorStop(1, this.interpolateColor('#616161', '#FF5722', heatLevel));
        ctx.fillStyle = barrelHeatGradient;
        ctx.fill();

        ctx.fillStyle = '#212121';
        ctx.beginPath();
        ctx.arc(55, 0, 6, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    private interpolateColor(color1: string, color2: string, t: number): string {
        const c1 = this.hexToRgb(color1);
        const c2 = this.hexToRgb(color2);
        const r = Math.round(c1.r + (c2.r - c1.r) * t);
        const g = Math.round(c1.g + (c2.g - c1.g) * t);
        const b = Math.round(c1.b + (c2.b - c1.b) * t);
        return `rgb(${r}, ${g}, ${b})`;
    }

    private hexToRgb(hex: string): { r: number; g: number; b: number } {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result
            ? {
                  r: parseInt(result[1], 16),
                  g: parseInt(result[2], 16),
                  b: parseInt(result[3], 16),
              }
            : { r: 0, g: 0, b: 0 };
    }

    drawResourcePanel(state: GameState, x: number, y: number): void {
        const w = 180;
        const h = 140;

        const ctx = this.ctx;
        ctx.save();

        ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
        ctx.shadowBlur = 10;
        ctx.shadowOffsetX = 3;
        ctx.shadowOffsetY = 3;

        this.drawHandDrawnRect(x, y, w, h, Renderer.COLORS.parchment, Renderer.COLORS.brownDark, 3);

        ctx.shadowBlur = 0;

        ctx.fillStyle = Renderer.COLORS.brownDark;
        ctx.font = 'bold 18px "Comic Sans MS", cursive, serif';
        ctx.textAlign = 'left';
        ctx.fillText('📜 资源面板', x + 15, y + 30);

        ctx.font = '14px "Comic Sans MS", cursive, serif';
        ctx.fillText(`⏱ 倒计时: ${Math.ceil(state.timeRemaining)}s`, x + 15, y + 55);

        const playerLeft = state.stats.playerStructuresLeft;
        const enemyLeft = state.stats.enemyStructuresLeft;
        ctx.fillText(`🏰 我方工事: ${playerLeft}`, x + 15, y + 80);
        ctx.fillText(`💀 敌方工事: ${enemyLeft}`, x + 15, y + 100);

        ctx.font = 'bold 16px "Comic Sans MS", cursive, serif';
        const phaseText: Record<string, string> = {
            placing: '📍 放置阶段',
            aiming: '🎯 瞄准阶段',
            charging: '⚡ 充能中...',
            firing: '💥 发射中...',
            ended: '🏆 游戏结束',
        };
        ctx.fillText(phaseText[state.phase] || state.phase, x + 15, y + 128);

        ctx.restore();
    }

    drawSkillDisc(state: GameState, x: number, y: number): void {
        const radius = 70;
        const skills = [
            { name: '普通弹', icon: '⚫', color: '#616161', type: 'cannonball' },
            { name: '爆破弹', icon: '💥', color: '#FF5722', type: 'explosive' },
            { name: '散射弹', icon: '✨', color: '#FFD54F', type: 'scatter' },
            { name: '冰冻弹', icon: '❄️', color: '#4FC3F7', type: 'ice' },
        ];

        const ctx = this.ctx;
        ctx.save();
        ctx.translate(x, y);

        for (let i = 0; i < 4; i++) {
            const startAngle = (i * Math.PI) / 2 - Math.PI / 4;
            const endAngle = ((i + 1) * Math.PI) / 2 - Math.PI / 4;
            const isHovered = this.hoveredSkillIndex === i;
            const isSelected = state.selectedAmmoType === skills[i].type;

            const popOffset = isHovered ? 15 : 0;
            const innerR = 20;
            const outerR = radius + popOffset;

            ctx.save();
            if (isHovered) {
                const hoverTime = (Date.now() % 2000) / 2000;
                const popProgress = this.easeOutBack(Math.min(1, hoverTime * 5));
                const offset = popProgress * 15;
                const midAngle = (startAngle + endAngle) / 2;
                ctx.translate(Math.cos(midAngle) * offset, Math.sin(midAngle) * offset);
            }

            ctx.beginPath();
            ctx.arc(0, 0, innerR, startAngle, endAngle);
            ctx.arc(0, 0, outerR, endAngle, startAngle, true);
            ctx.closePath();

            ctx.fillStyle = skills[i].color;
            ctx.globalAlpha = isSelected ? 1 : 0.7;
            ctx.fill();

            ctx.strokeStyle = isSelected ? '#FFD700' : Renderer.COLORS.handDrawnStroke;
            ctx.lineWidth = isSelected ? 3 : 2;
            ctx.stroke();

            const midAngle = (startAngle + endAngle) / 2;
            const textR = (innerR + outerR) / 2;
            const tx = Math.cos(midAngle) * textR;
            const ty = Math.sin(midAngle) * textR;

            ctx.globalAlpha = 1;
            ctx.fillStyle = '#fff';
            ctx.font = '20px serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(skills[i].icon, tx, ty - 8);

            ctx.font = 'bold 10px sans-serif';
            ctx.fillText(skills[i].name, tx, ty + 12);

            ctx.restore();
        }

        ctx.beginPath();
        ctx.arc(0, 0, 18, 0, Math.PI * 2);
        ctx.fillStyle = Renderer.COLORS.parchment;
        ctx.fill();
        ctx.strokeStyle = Renderer.COLORS.brownDark;
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = Renderer.COLORS.brownDark;
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('弹药', 0, -4);
        ctx.fillText('选择', 0, 8);

        ctx.restore();
    }

    drawUnit(unit: Unit): void {
        const { position, isSelected, isMoving, targetPosition, moveProgress } = unit;
        const x = position.x * this.gridSize;
        const y = position.y * this.gridSize;

        const ctx = this.ctx;
        ctx.save();

        if (isMoving) {
            const tx = targetPosition.x * this.gridSize;
            const ty = targetPosition.y * this.gridSize;
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
            ctx.lineWidth = 1;
            ctx.setLineDash([3, 3]);
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(tx, ty);
            ctx.stroke();
            ctx.setLineDash([]);

            const t = this.easeInOutQuad(moveProgress);
            const progressX = x + (tx - x) * t;
            const progressY = y + (ty - y) * t;
            ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.beginPath();
            ctx.arc(progressX, progressY, 6, 0, Math.PI * 2);
            ctx.fill();
        }

        if (isSelected) {
            ctx.strokeStyle = '#FFD700';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(x, y, 12, 0, Math.PI * 2);
            ctx.stroke();

            ctx.strokeStyle = 'rgba(255, 215, 0, 0.5)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(x, y, 15 + Math.sin(Date.now() / 200) * 2, 0, Math.PI * 2);
            ctx.stroke();
        }

        ctx.fillStyle = '#4CAF50';
        ctx.strokeStyle = '#2E7D32';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(x, y, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(x - 2, y - 2, 2, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    drawUI(state: GameState, _aiController?: any): void {
        this.drawGrid();

        for (const structure of state.enemyStructures) {
            if (structure.health > 0) {
                this.drawStructure(structure);
            }
        }

        for (const structure of state.playerStructures) {
            if (structure.health > 0) {
                this.drawStructure(structure);
            }
        }

        for (const unit of state.units) {
            this.drawUnit(unit);
        }

        for (const fragment of state.fragments) {
            this.drawFragment(fragment, 'wall');
        }

        for (const particle of state.particles) {
            this.drawParticle(particle);
        }

        for (const projectile of state.projectiles) {
            this.drawProjectile(projectile);
        }

        this.drawResourcePanel(state, 20, 20);

        const cannonPos = { x: 2, y: 10 };
        this.drawCannon(cannonPos, state.aimAngle, state.chargeLevel);
        if (state.phase === 'charging') {
            this.drawChargeBar(state.chargeLevel, cannonPos);
        }

        this.drawSkillDisc(state, this.width - 100, this.height - 100);

        if (state.statsPanelProgress > 0) {
            this.drawStatsPanel(state.stats, state.statsPanelProgress);
        }
    }

    drawStatsPanel(stats: GameStats, progress: number): void {
        const ctx = this.ctx;
        const panelW = 400;
        const panelH = 250;
        const x = (this.width - panelW) / 2;
        const startY = -panelH;
        const endY = 50;
        const currentY = startY + (endY - startY) * this.easeOutBack(progress);

        ctx.save();

        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, 0, this.width, this.height);

        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = 20;
        ctx.shadowOffsetX = 5;
        ctx.shadowOffsetY = 5;

        this.drawHandDrawnRect(x, currentY, panelW, panelH, Renderer.COLORS.parchment, Renderer.COLORS.brownDark, 4);

        ctx.shadowBlur = 0;

        ctx.fillStyle = Renderer.COLORS.brownDark;
        ctx.font = 'bold 24px "Comic Sans MS", cursive, serif';
        ctx.textAlign = 'center';
        ctx.fillText('📊 战斗统计', x + panelW / 2, currentY + 40);

        ctx.font = '16px "Comic Sans MS", cursive, serif';
        ctx.textAlign = 'left';

        const items = [
            { label: '🏰 我方剩余工事', value: stats.playerStructuresLeft },
            { label: '💀 敌方剩余工事', value: stats.enemyStructuresLeft },
            { label: '🎯 命中率', value: `${(stats.hitRate * 100).toFixed(1)}%` },
            { label: '💥 最高单发伤害', value: stats.maxSingleDamage },
            { label: '🔫 发射次数', value: stats.shotsFired },
        ];

        items.forEach((item, i) => {
            const iy = currentY + 70 + i * 30;
            ctx.fillStyle = Renderer.COLORS.brownDark;
            ctx.fillText(item.label, x + 30, iy);
            ctx.fillStyle = Renderer.COLORS.redWarning;
            ctx.font = 'bold 16px "Comic Sans MS", cursive, serif';
            ctx.fillText(String(item.value), x + 280, iy);
            ctx.font = '16px "Comic Sans MS", cursive, serif';
        });

        const winner =
            stats.playerStructuresLeft > stats.enemyStructuresLeft
                ? '🎉 胜利！'
                : stats.playerStructuresLeft < stats.enemyStructuresLeft
                ? '💔 失败...'
                : '🤝 平局';
        ctx.fillStyle =
            stats.playerStructuresLeft > stats.enemyStructuresLeft
                ? '#4CAF50'
                : stats.playerStructuresLeft < stats.enemyStructuresLeft
                ? '#F44336'
                : '#FFC107';
        ctx.font = 'bold 28px "Comic Sans MS", cursive, serif';
        ctx.textAlign = 'center';
        ctx.fillText(winner, x + panelW / 2, currentY + 220);

        ctx.restore();
    }

    drawButton(
        x: number,
        y: number,
        w: number,
        h: number,
        text: string,
        isHovered: boolean,
        isPressed: boolean
    ): void {
        const ctx = this.ctx;
        const key = `${x}-${y}-${text}`;

        if (!this.buttonPressStates.has(key)) {
            this.buttonPressStates.set(key, { pressed: false, time: 0 });
        }

        const state = this.buttonPressStates.get(key)!;
        if (isPressed && !state.pressed) {
            state.pressed = true;
            state.time = Date.now();
        } else if (!isPressed && state.pressed) {
            state.pressed = false;
        }

        let scale = isHovered ? 1.05 : 1;
        let pressOffset = 0;

        if (state.pressed) {
            const pressTime = (Date.now() - state.time) / 200;
            const pressProgress = Math.min(1, pressTime);
            pressOffset = pressProgress * 4;
            scale = 0.98 + pressProgress * 0.02;
        }

        const drawW = w * scale;
        const drawH = h * scale;
        const drawX = x + (w - drawW) / 2;
        const drawY = y + (h - drawH) / 2 + pressOffset;

        ctx.save();

        if (isHovered && !state.pressed) {
            ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
            ctx.shadowBlur = 10;
            ctx.shadowOffsetX = 3;
            ctx.shadowOffsetY = 3;
        }

        const bgColor = isHovered
            ? this.lightenColor(Renderer.COLORS.warmYellow, 20)
            : Renderer.COLORS.warmYellow;

        this.drawHandDrawnRect(drawX, drawY, drawW, drawH, bgColor, Renderer.COLORS.brownDark, 3);

        if (state.pressed) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
            ctx.fillRect(drawX + 2, drawY + 2, drawW - 4, drawH - 4);
        }

        ctx.shadowBlur = 0;
        ctx.fillStyle = Renderer.COLORS.brownDark;
        ctx.font = 'bold 16px "Comic Sans MS", cursive, serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, drawX + drawW / 2, drawY + drawH / 2);

        ctx.restore();
    }

    private lightenColor(color: string, percent: number): string {
        const num = parseInt(color.replace('#', ''), 16);
        const amt = Math.round(2.55 * percent);
        const R = Math.min(255, (num >> 16) + amt);
        const G = Math.min(255, ((num >> 8) & 0x00ff) + amt);
        const B = Math.min(255, (num & 0x0000ff) + amt);
        return `#${(0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)}`;
    }
}
