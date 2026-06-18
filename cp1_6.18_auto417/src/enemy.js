class EnemyManager {
    constructor() {
        this.enemies = [];
        this.boss = null;
        this.wave = 1;
        this.enemiesKilledInWave = 0;
        this.spawnTimer = 0;
        this.spawnInterval = Constants.ENEMY.SPAWN_INTERVAL;
        this.enemySpeed = Constants.ENEMY.SPEED;
        this.bossActive = false;
        this.bossPending = false;
        this.bossKilled = false;
        this.victoryProcessed = false;
    }

    reset() {
        this.enemies = [];
        this.boss = null;
        this.wave = 1;
        this.enemiesKilledInWave = 0;
        this.spawnTimer = 0;
        this.spawnInterval = Constants.ENEMY.SPAWN_INTERVAL;
        this.enemySpeed = Constants.ENEMY.SPEED;
        this.bossActive = false;
        this.bossPending = false;
        this.bossKilled = false;
        this.victoryProcessed = false;
    }

    spawnWave() {
        const count = 3 + Math.floor(Math.random() * 3);
        for (let i = 0; i < count; i++) {
            const x = 30 + Math.random() * (Constants.CANVAS.WIDTH - 60);
            const angle = Math.PI / 2 + (Math.random() - 0.5) * 0.5;
            this.enemies.push({
                x: x,
                y: -20 - i * 30,
                radius: Constants.ENEMY.RADIUS,
                speed: this.enemySpeed,
                angle: angle,
                shootCooldown: Constants.ENEMY.SHOOT_COOLDOWN * (0.5 + Math.random() * 0.5),
                color: Constants.ENEMY.COLOR,
                isBoss: false
            });
        }
    }

    spawnBoss() {
        this.boss = {
            x: Constants.CANVAS.WIDTH / 2,
            y: -Constants.BOSS.RADIUS,
            radius: Constants.BOSS.RADIUS,
            speed: Constants.BOSS.SPEED,
            health: Constants.BOSS.HEALTH,
            maxHealth: Constants.BOSS.HEALTH,
            shootCooldown: Constants.BOSS.SHOOT_COOLDOWN,
            color: Constants.BOSS.COLOR,
            isBoss: true,
            targetY: 100,
            moveDirection: 1,
            moveTimer: 0
        };
        this.bossActive = true;
    }

    update(deltaTime, player, bulletManager, effects) {
        if (!this.bossActive) {
            this.spawnTimer -= deltaTime;
            if (this.spawnTimer <= 0) {
                this.spawnWave();
                this.spawnTimer = this.spawnInterval;
            }
        }

        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const e = this.enemies[i];
            e.x += Math.cos(e.angle) * e.speed;
            e.y += Math.sin(e.angle) * e.speed;

            if (e.x - e.radius < 0 || e.x + e.radius > Constants.CANVAS.WIDTH) {
                e.angle = Math.PI - e.angle;
            }

            e.shootCooldown -= deltaTime;
            if (e.shootCooldown <= 0 && e.y > 0 && player.alive) {
                const angle = Math.atan2(player.y - e.y, player.x - e.x);
                bulletManager.spawnEnemyBullet(e.x, e.y, angle);
                e.shootCooldown = Constants.ENEMY.SHOOT_COOLDOWN;
            }

            if (e.y - e.radius > Constants.CANVAS.HEIGHT) {
                this.enemies.splice(i, 1);
            }
        }

        if (this.boss) {
            if (this.boss.y < this.boss.targetY) {
                this.boss.y += this.boss.speed;
            } else {
                this.boss.moveTimer += deltaTime;
                this.boss.x += this.boss.speed * this.boss.moveDirection;
                if (this.boss.x - this.boss.radius < 20) {
                    this.boss.x = 20 + this.boss.radius;
                    this.boss.moveDirection = 1;
                }
                if (this.boss.x + this.boss.radius > Constants.CANVAS.WIDTH - 20) {
                    this.boss.x = Constants.CANVAS.WIDTH - 20 - this.boss.radius;
                    this.boss.moveDirection = -1;
                }
            }

            this.boss.shootCooldown -= deltaTime;
            if (this.boss.shootCooldown <= 0 && player.alive) {
                bulletManager.spawnBossBullets(this.boss.x, this.boss.y, player.x, player.y);
                this.boss.shootCooldown = Constants.BOSS.SHOOT_COOLDOWN;
            }
        }

        this.checkPlayerCollision(player, effects);
    }

    checkCollisions(bulletManager, effects) {
        let killed = 0;
        let bossKilled = false;

        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const e = this.enemies[i];
            if (bulletManager.checkPlayerBulletEnemyCollision(e)) {
                effects.createExplosion(e.x, e.y);
                this.enemies.splice(i, 1);
                this.onEnemyKilled();
                killed++;
            }
        }

        if (this.boss) {
            const hits = this.countPlayerBulletHits(this.boss, bulletManager);
            if (hits > 0) {
                this.boss.health -= hits;
                if (this.boss.health <= 0) {
                    const bossX = this.boss.x;
                    const bossY = this.boss.y;
                    for (let i = 0; i < 5; i++) {
                        setTimeout(() => {
                            const offsetX = (Math.random() - 0.5) * 40;
                            const offsetY = (Math.random() - 0.5) * 40;
                            effects.createExplosion(bossX + offsetX, bossY + offsetY);
                        }, i * 100);
                    }
                    effects.startVictory();
                    this.boss = null;
                    this.bossActive = false;
                    this.bossKilled = true;
                    this.victoryProcessed = false;
                    bossKilled = true;
                }
            }
        }

        return { killed, bossKilled };
    }

    countPlayerBulletHits(enemy, bulletManager) {
        let hits = 0;
        for (let i = bulletManager.playerBullets.length - 1; i >= 0; i--) {
            const b = bulletManager.playerBullets[i];
            const dx = b.x - enemy.x;
            const dy = b.y - enemy.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < b.radius + enemy.radius) {
                bulletManager.playerBullets.splice(i, 1);
                hits++;
            }
        }
        return hits;
    }

    checkPlayerCollision(player, effects) {
        if (!player.alive) return;

        for (const e of this.enemies) {
            const dx = player.x - e.x;
            const dy = player.y - e.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < player.size / 2 + e.radius) {
                player.destroy();
                effects.createExplosion(player.x, player.y);
                return;
            }
        }

        if (this.boss) {
            const dx = player.x - this.boss.x;
            const dy = player.y - this.boss.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < player.size / 2 + this.boss.radius) {
                player.destroy();
                effects.createExplosion(player.x, player.y);
            }
        }
    }

    onEnemyKilled() {
        this.enemiesKilledInWave++;
        if (this.enemiesKilledInWave >= Constants.WAVE.ENEMIES_PER_WAVE_PROGRESS) {
            this.advanceWave();
        }
    }

    advanceWave() {
        this.wave++;
        this.enemiesKilledInWave = 0;

        if (this.wave % Constants.WAVE.BOSS_EVERY === 0) {
            this.bossPending = true;
            this.enemies = [];
            return;
        }

        this.spawnInterval = Math.max(
            Constants.ENEMY.MIN_SPAWN_INTERVAL,
            this.spawnInterval - Constants.ENEMY.SPAWN_INTERVAL_DECREMENT
        );

        this.enemySpeed = Math.min(
            Constants.ENEMY.MAX_SPEED,
            this.enemySpeed + Constants.ENEMY.SPEED_INCREMENT
        );
    }

    resetToWave1() {
        this.wave = 1;
        this.enemiesKilledInWave = 0;
        this.spawnInterval = Constants.ENEMY.SPAWN_INTERVAL;
        this.enemySpeed = Constants.ENEMY.SPEED;
        this.spawnTimer = 1000;
    }

    render(ctx) {
        for (const e of this.enemies) {
            ctx.fillStyle = e.color;
            ctx.beginPath();
            ctx.arc(e.x, e.y, e.radius, 0, Math.PI * 2);
            ctx.fill();
        }

        if (this.boss) {
            const gradient = ctx.createRadialGradient(
                this.boss.x, this.boss.y, 0,
                this.boss.x, this.boss.y, this.boss.radius
            );
            gradient.addColorStop(0, '#FF6666');
            gradient.addColorStop(1, this.boss.color);
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(this.boss.x, this.boss.y, this.boss.radius, 0, Math.PI * 2);
            ctx.fill();

            const barWidth = this.boss.radius * 2;
            const barHeight = 6;
            const barX = this.boss.x - this.boss.radius;
            const barY = this.boss.y - this.boss.radius - 15;
            const healthPercent = this.boss.health / this.boss.maxHealth;

            ctx.fillStyle = '#333';
            ctx.fillRect(barX, barY, barWidth, barHeight);
            ctx.fillStyle = '#FF4444';
            ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight);
            ctx.strokeStyle = '#FFF';
            ctx.lineWidth = 1;
            ctx.strokeRect(barX, barY, barWidth, barHeight);
        }
    }

    getScoreForKill(enemy) {
        if (enemy.isBoss) return 500;
        return 10;
    }
}
