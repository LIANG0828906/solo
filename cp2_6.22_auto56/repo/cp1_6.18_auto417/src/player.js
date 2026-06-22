class Player {
    constructor() {
        this.reset();
        this.keys = {};
        this.setupInput();
    }

    reset() {
        this.x = Constants.CANVAS.WIDTH / 2;
        this.y = Constants.CANVAS.HEIGHT - 60;
        this.size = Constants.PLAYER.SIZE;
        this.speed = Constants.PLAYER.SPEED;
        this.shootCooldown = 0;
        this.tilt = 0;
        this.targetTilt = 0;
        this.alive = true;
    }

    setupInput() {
        window.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            if (Constants.KEYS.SHOOT.includes(e.code)) {
                e.preventDefault();
            }
        });

        window.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });
    }

    isKeyPressed(keyArray) {
        return keyArray.some(k => this.keys[k]);
    }

    update(deltaTime, bulletManager) {
        if (!this.alive) return;

        let dx = 0;
        let dy = 0;

        if (this.isKeyPressed(Constants.KEYS.UP)) dy -= 1;
        if (this.isKeyPressed(Constants.KEYS.DOWN)) dy += 1;
        if (this.isKeyPressed(Constants.KEYS.LEFT)) dx -= 1;
        if (this.isKeyPressed(Constants.KEYS.RIGHT)) dx += 1;

        if (dx !== 0 && dy !== 0) {
            const len = Math.sqrt(dx * dx + dy * dy);
            dx /= len;
            dy /= len;
        }

        this.x += dx * this.speed;
        this.y += dy * this.speed;

        const halfSize = this.size / 2;
        this.x = Math.max(halfSize, Math.min(Constants.CANVAS.WIDTH - halfSize, this.x));
        this.y = Math.max(halfSize, Math.min(Constants.CANVAS.HEIGHT - halfSize, this.y));

        this.targetTilt = dx * Constants.PLAYER.MAX_TILT;
        const tiltSpeed = Constants.PLAYER.MAX_TILT / Constants.PLAYER.TILT_TRANSITION;
        const tiltDelta = tiltSpeed * (deltaTime / 1000);
        if (this.tilt < this.targetTilt) {
            this.tilt = Math.min(this.tilt + tiltDelta, this.targetTilt);
        } else if (this.tilt > this.targetTilt) {
            this.tilt = Math.max(this.tilt - tiltDelta, this.targetTilt);
        }

        this.shootCooldown -= deltaTime;
        if (this.isKeyPressed(Constants.KEYS.SHOOT) && this.shootCooldown <= 0) {
            bulletManager.spawnPlayerBullet(this.x, this.y - this.size / 2);
            this.shootCooldown = Constants.PLAYER.SHOOT_COOLDOWN;
        }
    }

    render(ctx) {
        if (!this.alive) return;

        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate((this.tilt * Math.PI) / 180);

        ctx.fillStyle = Constants.PLAYER.COLOR;
        ctx.beginPath();
        ctx.moveTo(0, -this.size / 2);
        ctx.lineTo(-this.size / 2, this.size / 2);
        ctx.lineTo(this.size / 2, this.size / 2);
        ctx.closePath();
        ctx.fill();

        ctx.restore();
    }

    destroy() {
        this.alive = false;
    }
}
