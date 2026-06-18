class BulletManager {
    constructor() {
        this.playerBullets = [];
        this.enemyBullets = [];
    }

    spawnPlayerBullet(x, y) {
        this.playerBullets.push({
            x: x,
            y: y,
            radius: Constants.BULLET.PLAYER_RADIUS,
            speed: Constants.BULLET.PLAYER_SPEED,
            color: Constants.BULLET.PLAYER_COLOR
        });
    }

    spawnEnemyBullet(x, y, angle) {
        this.enemyBullets.push({
            x: x,
            y: y,
            radius: Constants.BULLET.ENEMY_RADIUS,
            speed: Constants.BULLET.ENEMY_SPEED,
            vx: Math.cos(angle) * Constants.BULLET.ENEMY_SPEED,
            vy: Math.sin(angle) * Constants.BULLET.ENEMY_SPEED,
            color: Constants.BULLET.ENEMY_COLOR
        });
    }

    spawnBossBullets(x, y, playerX, playerY) {
        const angleToPlayer = Math.atan2(playerY - y, playerX - x);
        const spreadRad = (Constants.BOSS.SPREAD_ANGLE * Math.PI) / 180;
        const count = Constants.BOSS.BULLET_COUNT;

        for (let i = 0; i < count; i++) {
            const offset = (i - (count - 1) / 2) * spreadRad;
            const angle = angleToPlayer + offset;
            this.spawnEnemyBullet(x, y, angle);
        }
    }

    update() {
        for (let i = this.playerBullets.length - 1; i >= 0; i--) {
            const b = this.playerBullets[i];
            b.y -= b.speed;
            if (b.y + b.radius < 0) {
                this.playerBullets.splice(i, 1);
            }
        }

        for (let i = this.enemyBullets.length - 1; i >= 0; i--) {
            const b = this.enemyBullets[i];
            b.x += b.vx;
            b.y += b.vy;
            if (
                b.x + b.radius < 0 ||
                b.x - b.radius > Constants.CANVAS.WIDTH ||
                b.y + b.radius < 0 ||
                b.y - b.radius > Constants.CANVAS.HEIGHT
            ) {
                this.enemyBullets.splice(i, 1);
            }
        }
    }

    render(ctx) {
        ctx.fillStyle = Constants.BULLET.PLAYER_COLOR;
        for (const b of this.playerBullets) {
            ctx.beginPath();
            ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.fillStyle = Constants.BULLET.ENEMY_COLOR;
        for (const b of this.enemyBullets) {
            ctx.beginPath();
            ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    checkPlayerBulletEnemyCollision(enemy) {
        for (let i = this.playerBullets.length - 1; i >= 0; i--) {
            const b = this.playerBullets[i];
            const dx = b.x - enemy.x;
            const dy = b.y - enemy.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < b.radius + enemy.radius) {
                this.playerBullets.splice(i, 1);
                return true;
            }
        }
        return false;
    }

    checkEnemyBulletPlayerCollision(player) {
        for (let i = this.enemyBullets.length - 1; i >= 0; i--) {
            const b = this.enemyBullets[i];
            const dx = b.x - player.x;
            const dy = b.y - player.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < b.radius + player.size / 2) {
                this.enemyBullets.splice(i, 1);
                return true;
            }
        }
        return false;
    }

    reset() {
        this.playerBullets = [];
        this.enemyBullets = [];
    }
}
