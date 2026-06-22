class Effects {
    constructor() {
        this.particles = [];
        this.warningActive = false;
        this.warningTime = 0;
        this.warningFlashCount = 0;
        this.victoryActive = false;
        this.victoryTime = 0;
        this.gameOverActive = false;
    }

    createExplosion(x, y) {
        const particleCount = Constants.EFFECTS.EXPLOSION_PARTICLES;
        const duration = Constants.EFFECTS.EXPLOSION_DURATION;

        for (let i = 0; i < particleCount; i++) {
            const angle = (Math.PI * 2 * i) / particleCount + Math.random() * 0.5;
            const speed = 1 + Math.random() * 3;
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: duration,
                maxLife: duration,
                radius: 2 + Math.random() * 2,
                color: Constants.EFFECTS.EXPLOSION_COLOR
            });
        }
    }

    startWarning() {
        this.warningActive = true;
        this.warningTime = 0;
        this.warningFlashCount = 0;
    }

    startVictory() {
        this.victoryActive = true;
        this.victoryTime = 0;
    }

    startGameOver() {
        this.gameOverActive = true;
    }

    update(deltaTime) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.life -= deltaTime;
            if (p.life <= 0) {
                this.particles.splice(i, 1);
            }
        }

        if (this.warningActive) {
            this.warningTime += deltaTime;
            const flashDuration = Constants.EFFECTS.WARNING_DURATION;
            if (this.warningTime >= flashDuration * 2) {
                this.warningTime = 0;
                this.warningFlashCount++;
                if (this.warningFlashCount >= Constants.EFFECTS.WARNING_FLASHES) {
                    this.warningActive = false;
                }
            }
        }

        if (this.victoryActive) {
            this.victoryTime += deltaTime;
            if (this.victoryTime >= Constants.EFFECTS.VICTORY_FLASH_DURATION) {
                this.victoryActive = false;
            }
        }
    }

    render(ctx) {
        for (const p of this.particles) {
            const alpha = p.life / p.maxLife;
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        if (this.warningActive) {
            const flashDuration = Constants.EFFECTS.WARNING_DURATION;
            const t = this.warningTime / flashDuration;
            let alpha;
            if (t <= 1) {
                alpha = t;
            } else {
                alpha = 2 - t;
            }
            alpha = Math.max(0, Math.min(1, alpha));

            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.fillStyle = '#FF0000';
            ctx.font = 'bold 48px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            ctx.fillText('WARNING', Constants.CANVAS.WIDTH / 2, 60);
            ctx.restore();
        }

        if (this.victoryActive) {
            const t = this.victoryTime / Constants.EFFECTS.VICTORY_FLASH_DURATION;
            let alpha = Math.sin(t * Math.PI);
            alpha = Math.max(0, Math.min(1, alpha));

            ctx.save();
            ctx.globalAlpha = alpha * 0.6;
            ctx.fillStyle = '#FFD700';
            ctx.fillRect(0, 0, Constants.CANVAS.WIDTH, Constants.CANVAS.HEIGHT);
            ctx.restore();
        }
    }

    renderGameOver(ctx, score, restartHover) {
        if (!this.gameOverActive) return;

        ctx.save();
        ctx.fillStyle = Constants.UI.GAME_OVER_OVERLAY;
        ctx.fillRect(0, 0, Constants.CANVAS.WIDTH, Constants.CANVAS.HEIGHT);

        ctx.fillStyle = Constants.UI.GAME_OVER_COLOR;
        ctx.font = `bold ${Constants.UI.GAME_OVER_FONT_SIZE}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('GAME OVER', Constants.CANVAS.WIDTH / 2, Constants.CANVAS.HEIGHT / 2 - 60);

        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 28px Arial';
        ctx.fillText(`最终得分: ${score}`, Constants.CANVAS.WIDTH / 2, Constants.CANVAS.HEIGHT / 2);

        ctx.fillStyle = restartHover ? Constants.UI.RESTART_HOVER_COLOR : Constants.UI.RESTART_COLOR;
        ctx.font = `${Constants.UI.RESTART_FONT_SIZE}px Arial`;
        ctx.fillText('点击重新开始', Constants.CANVAS.WIDTH / 2, Constants.CANVAS.HEIGHT / 2 + 60);

        ctx.restore();
    }

    reset() {
        this.particles = [];
        this.warningActive = false;
        this.warningTime = 0;
        this.warningFlashCount = 0;
        this.victoryActive = false;
        this.victoryTime = 0;
        this.gameOverActive = false;
    }
}
