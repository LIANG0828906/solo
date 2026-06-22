class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = Constants.CANVAS.WIDTH;
        this.canvas.height = Constants.CANVAS.HEIGHT;

        this.score = 0;
        this.state = 'playing';
        this.restartTimer = 0;
        this.lastTime = 0;
        this.mouseX = 0;
        this.mouseY = 0;
        this.restartHover = false;
        this.bossWarningTriggered = false;
        this.victoryScoreAdded = false;

        this.player = new Player();
        this.bulletManager = new BulletManager();
        this.enemyManager = new EnemyManager();
        this.effects = new Effects();

        this.setupMouse();
        this.setupClick();

        this.enemyManager.spawnTimer = 500;

        this.lastTime = performance.now();
        requestAnimationFrame((t) => this.gameLoop(t));
    }

    setupMouse() {
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.mouseX = e.clientX - rect.left;
            this.mouseY = e.clientY - rect.top;
            this.updateRestartHover();
        });
    }

    setupClick() {
        this.canvas.addEventListener('click', (e) => {
            if (this.state === 'gameover' && this.restartHover) {
                this.restart();
            }
        });
    }

    updateRestartHover() {
        if (this.state !== 'gameover') {
            this.restartHover = false;
            return;
        }

        const cx = Constants.CANVAS.WIDTH / 2;
        const cy = Constants.CANVAS.HEIGHT / 2 + 60;
        const textWidth = 160;
        const textHeight = 30;

        this.restartHover =
            this.mouseX >= cx - textWidth / 2 &&
            this.mouseX <= cx + textWidth / 2 &&
            this.mouseY >= cy - textHeight / 2 &&
            this.mouseY <= cy + textHeight / 2;

        this.canvas.style.cursor = this.restartHover ? 'pointer' : 'default';
    }

    gameLoop(currentTime) {
        const deltaTime = Math.min(currentTime - this.lastTime, 50);
        this.lastTime = currentTime;

        this.update(deltaTime);
        this.render();

        requestAnimationFrame((t) => this.gameLoop(t));
    }

    update(deltaTime) {
        if (this.state === 'playing') {
            this.player.update(deltaTime, this.bulletManager);
            this.bulletManager.update();
            this.enemyManager.update(deltaTime, this.player, this.bulletManager, this.effects);
            this.effects.update(deltaTime);

            const collisionResult = this.enemyManager.checkCollisions(this.bulletManager, this.effects);
            this.score += collisionResult.killed * 10;

            if (this.enemyManager.bossKilled && !this.victoryScoreAdded) {
                this.score += 500;
                this.victoryScoreAdded = true;
            }

            if (this.effects.victoryActive === false && this.enemyManager.bossKilled && !this.enemyManager.victoryProcessed) {
                this.enemyManager.resetToWave1();
                this.enemyManager.victoryProcessed = true;
                this.enemyManager.bossKilled = false;
                this.victoryScoreAdded = false;
                this.bossWarningTriggered = false;
            }

            if (this.bulletManager.checkEnemyBulletPlayerCollision(this.player)) {
                this.player.destroy();
                this.effects.createExplosion(this.player.x, this.player.y);
            }

            if (!this.player.alive && !this.effects.gameOverActive) {
                this.triggerGameOver();
            }

            if (this.enemyManager.bossPending && !this.bossWarningTriggered) {
                this.bossWarningTriggered = true;
                this.effects.startWarning();
                const totalWarningTime = Constants.EFFECTS.WARNING_DURATION * 2 * Constants.EFFECTS.WARNING_FLASHES;
                setTimeout(() => {
                    this.enemyManager.bossPending = false;
                    this.enemyManager.spawnBoss();
                }, totalWarningTime);
            }
        } else if (this.state === 'gameover') {
            this.effects.update(deltaTime);
        }
    }

    triggerGameOver() {
        this.state = 'gameover';
        this.effects.startGameOver();
        this.restartTimer = Constants.GAME.RESTART_DELAY;

        setTimeout(() => {
            if (this.state === 'gameover') {
                this.restart();
            }
        }, Constants.GAME.RESTART_DELAY);
    }

    restart() {
        this.score = 0;
        this.state = 'playing';
        this.restartTimer = 0;
        this.restartHover = false;
        this.bossWarningTriggered = false;
        this.victoryScoreAdded = false;

        this.player.reset();
        this.bulletManager.reset();
        this.enemyManager.reset();
        this.effects.reset();

        this.enemyManager.spawnTimer = 500;
    }

    render() {
        this.ctx.fillStyle = Constants.CANVAS.BG_COLOR;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.renderBorder();
        this.bulletManager.render(this.ctx);
        this.enemyManager.render(this.ctx);
        this.player.render(this.ctx);
        this.effects.render(this.ctx);
        this.renderUI();

        if (this.state === 'gameover') {
            this.effects.renderGameOver(this.ctx, this.score, this.restartHover);
        }
    }

    renderBorder() {
        this.ctx.strokeStyle = Constants.CANVAS.BORDER_COLOR;
        this.ctx.lineWidth = Constants.CANVAS.BORDER_WIDTH;
        this.ctx.strokeRect(
            Constants.CANVAS.BORDER_WIDTH / 2,
            Constants.CANVAS.BORDER_WIDTH / 2,
            Constants.CANVAS.WIDTH - Constants.CANVAS.BORDER_WIDTH,
            Constants.CANVAS.HEIGHT - Constants.CANVAS.BORDER_WIDTH
        );
    }

    renderUI() {
        this.ctx.save();
        this.ctx.shadowColor = Constants.UI.SCORE_SHADOW;
        this.ctx.shadowBlur = 4;
        this.ctx.shadowOffsetX = 2;
        this.ctx.shadowOffsetY = 2;

        this.ctx.fillStyle = Constants.UI.SCORE_COLOR;
        this.ctx.font = `bold ${Constants.UI.SCORE_FONT_SIZE}px Arial`;
        this.ctx.textAlign = 'left';
        this.ctx.textBaseline = 'top';
        this.ctx.fillText(`得分: ${this.score}`, 20, 20);
        this.ctx.fillText(`波次: ${this.enemyManager.wave}`, 20, 55);

        this.ctx.restore();
    }
}

window.addEventListener('load', () => {
    new Game();
});
