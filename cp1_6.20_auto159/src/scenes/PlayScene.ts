import Phaser from 'phaser';

const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;
const PLAYER_SPEED = 200;
const PLAYER_RADIUS = 10;
const PLAYER_MAX_HP = 100;
const PLAYER_START_AMMO = 30;
const ENEMY_SPEED = 60;
const ENEMY_RADIUS = 12;
const BULLET_SPEED = 500;
const BULLET_RADIUS = 3;
const SHOOT_COOLDOWN = 300;
const WAVE_INTERVAL = 5000;
const SAFE_ZONE_START_DELAY = 30000;
const SAFE_ZONE_SHRINK_RATE = 2;
const SAFE_ZONE_MIN_SIZE = 200;
const DAMAGE_OUTSIDE_SAFE_ZONE = 5;
const SUPPLY_DROP_CHANCE = 0.3;
const SUPPLY_LIFETIME = 5000;
const SUPPLY_PICKUP_ANIM_DURATION = 200;

interface PlayerState {
    hp: number;
    ammo: number;
    x: number;
    y: number;
    angle: number;
}

interface Enemy {
    id: number;
    sprite: Phaser.GameObjects.Arc;
    hp: number;
    flashTimer: number;
}

interface Bullet {
    id: number;
    sprite: Phaser.GameObjects.Arc;
    line: Phaser.GameObjects.Line;
    velocity: Phaser.Math.Vector2;
    lifetime: number;
}

interface Supply {
    id: number;
    sprite: Phaser.GameObjects.Graphics;
    type: 'health' | 'ammo';
    lifetime: number;
    pickupAnimActive: boolean;
    pickupAnimTimer: number;
}

interface ScoreEntry {
    id: string;
    name: string;
    waves: number;
    time: number;
    score: number;
    createdAt: string;
}

export default class PlayScene extends Phaser.Scene {
    private player!: Phaser.GameObjects.Arc;
    private playerGlow!: Phaser.GameObjects.Arc;
    private playerState: PlayerState = {
        hp: PLAYER_MAX_HP,
        ammo: PLAYER_START_AMMO,
        x: GAME_WIDTH / 2,
        y: GAME_HEIGHT / 2,
        angle: 0
    };

    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
    private wasdKeys!: { W: Phaser.Input.Keyboard.Key; A: Phaser.Input.Keyboard.Key; S: Phaser.Input.Keyboard.Key; D: Phaser.Input.Keyboard.Key };
    private isMouseDown = false;
    private lastShootTime = 0;

    private enemies: Enemy[] = [];
    private bullets: Bullet[] = [];
    private supplies: Supply[] = [];
    private nextEnemyId = 0;
    private nextBulletId = 0;
    private nextSupplyId = 0;

    private currentWave = 0;
    private survivalTime = 0;
    private lastWaveTime = 0;
    private gameStartedAt = 0;
    private isGameOver = false;

    private safeZoneRadius = Math.min(GAME_WIDTH, GAME_HEIGHT) / 2;
    private safeZoneCenterX = GAME_WIDTH / 2;
    private safeZoneCenterY = GAME_HEIGHT / 2;
    private safeZoneCircle!: Phaser.GameObjects.Graphics;
    private dangerOverlay!: Phaser.GameObjects.Graphics;

    private hpBarBg!: Phaser.GameObjects.Graphics;
    private hpBar!: Phaser.GameObjects.Graphics;
    private ammoBarBg!: Phaser.GameObjects.Graphics;
    private ammoBar!: Phaser.GameObjects.Graphics;
    private waveText!: Phaser.GameObjects.Text;
    private timeText!: Phaser.GameObjects.Text;
    private hpText!: Phaser.GameObjects.Text;
    private ammoText!: Phaser.GameObjects.Text;

    private vignette!: Phaser.GameObjects.Graphics;

    private gameOverPanel!: Phaser.GameObjects.Container;
    private gameOverBg!: Phaser.GameObjects.Graphics;
    private gameOverTitle!: Phaser.GameObjects.Text;
    private gameOverStats!: Phaser.GameObjects.Text;
    private nameInputBg!: Phaser.GameObjects.Graphics;
    private nameInputText!: Phaser.GameObjects.Text;
    private submitButtonBg!: Phaser.GameObjects.Graphics;
    private submitButtonText!: Phaser.GameObjects.Text;
    private scoresText!: Phaser.GameObjects.Text;

    private inputName = '';
    private scores: ScoreEntry[] = [];
    private isSubmitting = false;

    private enemySpawnTimer = 0;
    private outsideSafeZoneDamageTimer = 0;

    constructor() {
        super('PlayScene');
    }

    create(): void {
        this.gameStartedAt = this.time.now;
        this.lastWaveTime = this.time.now;

        this.createVignette();
        this.createPlayer();
        this.createSafeZoneVisuals();
        this.createUI();
        this.createGameOverPanel();
        this.setupInput();
        this.loadScores();

        this.spawnWave();
    }

    private createVignette(): void {
        this.vignette = this.add.graphics();
        this.vignette.setDepth(100);

        const cornerAlpha = 0.2;
        const innerAlpha = 0;

        const cornerSize = 150;

        this.vignette.fillGradientStyle(
            0x000000, 0x000000, 0x000000, 0x000000,
            cornerAlpha, innerAlpha, innerAlpha, cornerAlpha
        );
        this.vignette.fillTriangle(
            0, 0,
            cornerSize, 0,
            0, cornerSize
        );

        this.vignette.fillGradientStyle(
            0x000000, 0x000000, 0x000000, 0x000000,
            innerAlpha, cornerAlpha, cornerAlpha, innerAlpha
        );
        this.vignette.fillTriangle(
            GAME_WIDTH, 0,
            GAME_WIDTH - cornerSize, 0,
            GAME_WIDTH, cornerSize
        );

        this.vignette.fillGradientStyle(
            0x000000, 0x000000, 0x000000, 0x000000,
            innerAlpha, cornerAlpha, cornerAlpha, innerAlpha
        );
        this.vignette.fillTriangle(
            0, GAME_HEIGHT,
            cornerSize, GAME_HEIGHT,
            0, GAME_HEIGHT - cornerSize
        );

        this.vignette.fillGradientStyle(
            0x000000, 0x000000, 0x000000, 0x000000,
            cornerAlpha, innerAlpha, innerAlpha, cornerAlpha
        );
        this.vignette.fillTriangle(
            GAME_WIDTH, GAME_HEIGHT,
            GAME_WIDTH - cornerSize, GAME_HEIGHT,
            GAME_WIDTH, GAME_HEIGHT - cornerSize
        );
    }

    private createPlayer(): void {
        this.playerGlow = this.add.circle(
            this.playerState.x,
            this.playerState.y,
            PLAYER_RADIUS + 6,
            0xffffff,
            0.3
        );
        this.playerGlow.setDepth(10);

        this.player = this.add.circle(
            this.playerState.x,
            this.playerState.y,
            PLAYER_RADIUS,
            0x3498db
        );
        this.player.setStrokeStyle(2, 0xffffff, 0.8);
        this.player.setDepth(11);
    }

    private createSafeZoneVisuals(): void {
        this.safeZoneCircle = this.add.graphics();
        this.safeZoneCircle.setDepth(5);

        this.dangerOverlay = this.add.graphics();
        this.dangerOverlay.setDepth(1);
    }

    private createUI(): void {
        this.hpBarBg = this.add.graphics();
        this.hpBarBg.setDepth(50);
        this.hpBarBg.fillStyle(0x333333, 0.8);
        this.hpBarBg.fillRect(15, 15, 150, 16);

        this.hpBar = this.add.graphics();
        this.hpBar.setDepth(51);

        this.ammoBarBg = this.add.graphics();
        this.ammoBarBg.setDepth(50);
        this.ammoBarBg.fillStyle(0x333333, 0.8);
        this.ammoBarBg.fillRect(15, 38, 150, 16);

        this.ammoBar = this.add.graphics();
        this.ammoBar.setDepth(51);

        this.hpText = this.add.text(15, 15, '', {
            fontFamily: 'Courier New',
            fontSize: '12px',
            color: '#ffffff'
        });
        this.hpText.setDepth(52);

        this.ammoText = this.add.text(15, 38, '', {
            fontFamily: 'Courier New',
            fontSize: '12px',
            color: '#ffffff'
        });
        this.ammoText.setDepth(52);

        this.waveText = this.add.text(GAME_WIDTH - 15, 15, '', {
            fontFamily: 'Courier New',
            fontSize: '16px',
            color: '#ffffff'
        });
        this.waveText.setOrigin(1, 0);
        this.waveText.setDepth(52);

        this.timeText = this.add.text(GAME_WIDTH - 15, 38, '', {
            fontFamily: 'Courier New',
            fontSize: '16px',
            color: '#ffffff'
        });
        this.timeText.setOrigin(1, 0);
        this.timeText.setDepth(52);

        this.updateUI();
    }

    private createGameOverPanel(): void {
        this.gameOverPanel = this.add.container(GAME_WIDTH / 2, GAME_HEIGHT / 2);
        this.gameOverPanel.setDepth(200);
        this.gameOverPanel.setAlpha(0);
        this.gameOverPanel.setVisible(false);

        this.gameOverBg = this.add.graphics();
        this.gameOverBg.fillStyle(0x000000, 0.7);
        this.gameOverBg.fillRect(-220, -250, 440, 500);
        this.gameOverPanel.add(this.gameOverBg);

        this.gameOverTitle = this.add.text(0, -220, '游戏结束', {
            fontFamily: 'Courier New',
            fontSize: '28px',
            color: '#ffffff'
        });
        this.gameOverTitle.setOrigin(0.5);
        this.gameOverPanel.add(this.gameOverTitle);

        this.gameOverStats = this.add.text(0, -160, '', {
            fontFamily: 'Courier New',
            fontSize: '18px',
            color: '#ffffff',
            align: 'center'
        });
        this.gameOverStats.setOrigin(0.5);
        this.gameOverPanel.add(this.gameOverStats);

        const nameLabel = this.add.text(0, -90, '请输入你的名字：', {
            fontFamily: 'Courier New',
            fontSize: '16px',
            color: '#ffffff'
        });
        nameLabel.setOrigin(0.5);
        this.gameOverPanel.add(nameLabel);

        this.nameInputBg = this.add.graphics();
        this.nameInputBg.fillStyle(0xcccccc, 1);
        this.nameInputBg.fillRoundedRect(-100, -65, 200, 36, 6);
        this.nameInputBg.lineStyle(2, 0xffffff, 0.5);
        this.nameInputBg.strokeRoundedRect(-100, -65, 200, 36, 6);
        this.nameInputBg.setInteractive(
            new Phaser.Geom.Rectangle(-100, -65, 200, 36),
            Phaser.Geom.Rectangle.Contains
        );
        this.gameOverPanel.add(this.nameInputBg);

        this.nameInputText = this.add.text(0, -47, '', {
            fontFamily: 'Courier New',
            fontSize: '18px',
            color: '#222222'
        });
        this.nameInputText.setOrigin(0.5);
        this.gameOverPanel.add(this.nameInputText);

        this.submitButtonBg = this.add.graphics();
        this.submitButtonBg.fillStyle(0x3498db, 1);
        this.submitButtonBg.fillRoundedRect(-70, -15, 140, 40, 6);
        this.submitButtonBg.setInteractive(
            new Phaser.Geom.Rectangle(-70, -15, 140, 40),
            Phaser.Geom.Rectangle.Contains
        );
        this.gameOverPanel.add(this.submitButtonBg);

        this.submitButtonText = this.add.text(0, 5, '提交分数', {
            fontFamily: 'Courier New',
            fontSize: '18px',
            color: '#ffffff'
        });
        this.submitButtonText.setOrigin(0.5);
        this.gameOverPanel.add(this.submitButtonText);

        this.scoresText = this.add.text(0, 50, '加载高分榜...', {
            fontFamily: 'Courier New',
            fontSize: '14px',
            color: '#ffffff',
            align: 'center'
        });
        this.scoresText.setOrigin(0.5, 0);
        this.gameOverPanel.add(this.scoresText);

        this.nameInputBg.on('pointerdown', () => {
            this.inputName = '';
            this.nameInputText.setText('|');
        });

        this.submitButtonBg.on('pointerdown', () => {
            this.submitScore();
        });

        this.input.keyboard!.on('keydown', (event: KeyboardEvent) => {
            if (!this.isGameOver) return;
            if (!this.gameOverPanel.visible) return;

            if (event.key === 'Backspace') {
                this.inputName = this.inputName.slice(0, -1);
            } else if (event.key === 'Enter') {
                this.submitScore();
            } else if (event.key.length === 1 && this.inputName.length < 12) {
                this.inputName += event.key;
            }
            this.nameInputText.setText(this.inputName + '|');
        });
    }

    private setupInput(): void {
        this.cursors = this.input.keyboard!.createCursorKeys();
        this.wasdKeys = {
            W: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W),
            A: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A),
            S: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S),
            D: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D)
        };

        this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
            if (pointer.leftButtonDown()) {
                this.isMouseDown = true;
            }
        });

        this.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
            if (!pointer.leftButtonDown()) {
                this.isMouseDown = false;
            }
        });
    }

    private loadScores(): void {
        fetch('http://localhost:3001/api/score')
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    this.scores = data.data;
                }
            })
            .catch(() => {});
    }

    private submitScore(): void {
        if (this.isSubmitting) return;
        const name = this.inputName.trim();
        if (!name) return;

        this.isSubmitting = true;
        this.submitButtonText.setText('提交中...');

        fetch('http://localhost:3001/api/score', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name,
                waves: this.currentWave,
                time: this.survivalTime
            })
        })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    this.scores.push(data.data);
                    this.scores.sort((a, b) => b.score - a.score);
                    this.scores = this.scores.slice(0, 10);
                    this.updateScoresDisplay();
                    this.submitButtonText.setText('已提交');
                } else {
                    this.submitButtonText.setText('提交失败');
                }
            })
            .catch(() => {
                this.submitButtonText.setText('提交失败');
            });
    }

    private updateScoresDisplay(): void {
        if (this.scores.length === 0) {
            this.scoresText.setText('暂无记录');
            return;
        }
        const lines = ['--- 高分榜 TOP 10 ---'];
        this.scores.forEach((s, i) => {
            lines.push(`${i + 1}. ${s.name} - ${s.score}分 (${s.waves}波/${Math.floor(s.time)}秒)`);
        });
        this.scoresText.setText(lines.join('\n'));
    }

    private spawnWave(): void {
        this.currentWave++;
        const enemyCount = Phaser.Math.Between(3, 8);
        for (let i = 0; i < enemyCount; i++) {
            this.time.delayedCall(i * 200, () => this.spawnEnemy());
        }
        this.lastWaveTime = this.time.now;
    }

    private spawnEnemy(): void {
        const side = Phaser.Math.Between(0, 3);
        let x: number, y: number;
        const margin = 50;

        switch (side) {
            case 0:
                x = Phaser.Math.Between(-margin, GAME_WIDTH + margin);
                y = -margin;
                break;
            case 1:
                x = GAME_WIDTH + margin;
                y = Phaser.Math.Between(-margin, GAME_HEIGHT + margin);
                break;
            case 2:
                x = Phaser.Math.Between(-margin, GAME_WIDTH + margin);
                y = GAME_HEIGHT + margin;
                break;
            default:
                x = -margin;
                y = Phaser.Math.Between(-margin, GAME_HEIGHT + margin);
                break;
        }

        const sprite = this.add.circle(x, y, ENEMY_RADIUS, 0xe74c3c);
        sprite.setStrokeStyle(2, 0xff0000, 0.6);
        sprite.setDepth(8);

        this.enemies.push({
            id: this.nextEnemyId++,
            sprite,
            hp: 2,
            flashTimer: 0
        });
    }

    private shoot(): void {
        const now = this.time.now;
        if (now - this.lastShootTime < SHOOT_COOLDOWN) return;
        if (this.playerState.ammo <= 0) return;

        this.lastShootTime = now;
        this.playerState.ammo--;

        const dx = this.input.activePointer.x - this.playerState.x;
        const dy = this.input.activePointer.y - this.playerState.y;
        const len = Math.sqrt(dx * dx + dy * dy) || 1;
        const vx = (dx / len) * BULLET_SPEED;
        const vy = (dy / len) * BULLET_SPEED;

        const startX = this.playerState.x + (dx / len) * PLAYER_RADIUS;
        const startY = this.playerState.y + (dy / len) * PLAYER_RADIUS;

        const sprite = this.add.circle(startX, startY, BULLET_RADIUS, 0xffffff);
        sprite.setDepth(12);

        const line = this.add.line(
            0, 0,
            startX, startY,
            startX + (dx / len) * 20,
            startY + (dy / len) * 20,
            0xffffff,
            0.8
        );
        line.setDepth(11);

        this.bullets.push({
            id: this.nextBulletId++,
            sprite,
            line,
            velocity: new Phaser.Math.Vector2(vx, vy),
            lifetime: 200
        });

        this.updateUI();
    }

    private tryDropSupply(x: number, y: number): void {
        if (Math.random() > SUPPLY_DROP_CHANCE) return;

        const type: 'health' | 'ammo' = Math.random() > 0.5 ? 'health' : 'ammo';
        const graphics = this.add.graphics();
        graphics.setPosition(x, y);
        graphics.setDepth(7);

        if (type === 'health') {
            graphics.fillStyle(0xe74c3c, 1);
            graphics.fillRoundedRect(-10, -10, 20, 20, 3);
            graphics.fillStyle(0xffffff, 1);
            graphics.fillRect(-2, -7, 4, 14);
            graphics.fillRect(-7, -2, 14, 4);
        } else {
            graphics.fillStyle(0xf1c40f, 1);
            graphics.fillRoundedRect(-10, -10, 20, 20, 3);
            graphics.fillStyle(0x222222, 1);
            graphics.fillRect(-5, -6, 10, 2);
            graphics.fillRect(-5, -2, 10, 2);
            graphics.fillRect(-5, 2, 10, 2);
        }

        this.supplies.push({
            id: this.nextSupplyId++,
            sprite: graphics,
            type,
            lifetime: SUPPLY_LIFETIME,
            pickupAnimActive: false,
            pickupAnimTimer: 0
        });
    }

    private pickupSupply(supply: Supply): void {
        if (supply.type === 'health') {
            this.playerState.hp = Math.min(PLAYER_MAX_HP, this.playerState.hp + Math.floor(PLAYER_MAX_HP * 0.2));
        } else {
            this.playerState.ammo += 10;
        }
        supply.pickupAnimActive = true;
        supply.pickupAnimTimer = SUPPLY_PICKUP_ANIM_DURATION;
        this.updateUI();
    }

    private triggerGameOver(): void {
        this.isGameOver = true;
        this.gameOverPanel.setVisible(true);
        this.gameOverStats.setText(`波次数: ${this.currentWave}\n存活时间: ${Math.floor(this.survivalTime)}秒\n总分: ${this.currentWave * 100 + Math.floor(this.survivalTime)}`);
        this.updateScoresDisplay();

        this.tweens.add({
            targets: this.gameOverPanel,
            alpha: 1,
            duration: 300,
            ease: 'Quad.easeOut'
        });
    }

    private updateUI(): void {
        this.hpBar.clear();
        const hpRatio = this.playerState.hp / PLAYER_MAX_HP;
        this.hpBar.fillStyle(0xe74c3c, 1);
        this.hpBar.fillRect(15, 15, 150 * hpRatio, 16);
        this.hpText.setText(`HP ${this.playerState.hp}/${PLAYER_MAX_HP}`);

        this.ammoBar.clear();
        const ammoRatio = Math.min(1, this.playerState.ammo / 50);
        this.ammoBar.fillStyle(0xf1c40f, 1);
        this.ammoBar.fillRect(15, 38, 150 * ammoRatio, 16);
        this.ammoText.setText(`弹药 ${this.playerState.ammo}`);

        this.waveText.setText(`波次: ${this.currentWave}`);
        this.timeText.setText(`时间: ${Math.floor(this.survivalTime)}s`);
    }

    private updateSafeZoneVisuals(): void {
        this.safeZoneCircle.clear();
        this.safeZoneCircle.lineStyle(2, 0xffffff, 0.4);
        this.safeZoneCircle.beginPath();
        const dashLen = 10;
        const gapLen = 6;
        const circumference = 2 * Math.PI * this.safeZoneRadius;
        const totalDashes = Math.floor(circumference / (dashLen + gapLen));
        const anglePerDash = (2 * Math.PI) / totalDashes;
        const dashAngle = (dashLen / circumference) * 2 * Math.PI;

        for (let i = 0; i < totalDashes; i++) {
            const startAngle = i * anglePerDash;
            const endAngle = startAngle + dashAngle;
            this.safeZoneCircle.beginPath();
            this.safeZoneCircle.arc(
                this.safeZoneCenterX,
                this.safeZoneCenterY,
                this.safeZoneRadius,
                startAngle,
                endAngle,
                false
            );
            this.safeZoneCircle.strokePath();
        }

        this.dangerOverlay.clear();
        this.dangerOverlay.fillStyle(0xff0000, 0.3);
        this.dangerOverlay.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
        this.dangerOverlay.setDepth(1);

        const maskShape = this.make.graphics({ x: 0, y: 0, add: false });
        maskShape.fillStyle(0xffffff, 1);
        maskShape.beginPath();
        maskShape.arc(this.safeZoneCenterX, this.safeZoneCenterY, this.safeZoneRadius, 0, Math.PI * 2);
        maskShape.fillPath();

        const mask = maskShape.createGeometryMask();
        this.dangerOverlay.setMask(mask);
        mask.invertAlpha = true;
    }

    update(_time: number, delta: number): void {
        if (this.isGameOver) return;

        this.survivalTime += delta / 1000;

        this.updatePlayer(delta);
        this.updateBullets(delta);
        this.updateEnemies(delta);
        this.updateSupplies(delta);
        this.updateSafeZone(delta);
        this.checkCollisions();
        this.checkWaveSpawn();
        this.updateUI();
    }

    private updatePlayer(delta: number): void {
        const dt = delta / 1000;
        let dx = 0, dy = 0;

        if (this.wasdKeys.W.isDown || this.cursors.up?.isDown) dy -= 1;
        if (this.wasdKeys.S.isDown || this.cursors.down?.isDown) dy += 1;
        if (this.wasdKeys.A.isDown || this.cursors.left?.isDown) dx -= 1;
        if (this.wasdKeys.D.isDown || this.cursors.right?.isDown) dx += 1;

        if (dx !== 0 || dy !== 0) {
            const len = Math.sqrt(dx * dx + dy * dy);
            dx /= len;
            dy /= len;
            this.playerState.x += dx * PLAYER_SPEED * dt;
            this.playerState.y += dy * PLAYER_SPEED * dt;
        }

        this.playerState.x = Phaser.Math.Clamp(this.playerState.x, PLAYER_RADIUS, GAME_WIDTH - PLAYER_RADIUS);
        this.playerState.y = Phaser.Math.Clamp(this.playerState.y, PLAYER_RADIUS, GAME_HEIGHT - PLAYER_RADIUS);

        this.playerState.angle = Math.atan2(
            this.input.activePointer.y - this.playerState.y,
            this.input.activePointer.x - this.playerState.x
        );

        this.player.setPosition(this.playerState.x, this.playerState.y);
        this.playerGlow.setPosition(this.playerState.x, this.playerState.y);

        if (this.isMouseDown) {
            this.shoot();
        }
    }

    private updateBullets(delta: number): void {
        const dt = delta / 1000;
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const b = this.bullets[i];
            b.sprite.x += b.velocity.x * dt;
            b.sprite.y += b.velocity.y * dt;
            b.line.setTo(
                b.sprite.x, b.sprite.y,
                b.sprite.x - b.velocity.x * 0.03,
                b.sprite.y - b.velocity.y * 0.03
            );
            b.lifetime -= delta;

            if (b.lifetime <= 0 ||
                b.sprite.x < -20 || b.sprite.x > GAME_WIDTH + 20 ||
                b.sprite.y < -20 || b.sprite.y > GAME_HEIGHT + 20) {
                b.sprite.destroy();
                b.line.destroy();
                this.bullets.splice(i, 1);
            }
        }
    }

    private updateEnemies(delta: number): void {
        const dt = delta / 1000;
        for (const e of this.enemies) {
            const dx = this.playerState.x - e.sprite.x;
            const dy = this.playerState.y - e.sprite.y;
            const len = Math.sqrt(dx * dx + dy * dy) || 1;
            e.sprite.x += (dx / len) * ENEMY_SPEED * dt;
            e.sprite.y += (dy / len) * ENEMY_SPEED * dt;

            e.flashTimer += delta;
            if (e.flashTimer > 500) e.flashTimer = 0;
            const flashOn = Math.floor(e.flashTimer / 250) % 2 === 0;
            e.sprite.setFillStyle(flashOn ? 0xff4444 : 0xe74c3c, 1);
        }
    }

    private updateSupplies(delta: number): void {
        for (let i = this.supplies.length - 1; i >= 0; i--) {
            const s = this.supplies[i];
            s.lifetime -= delta;

            if (s.pickupAnimActive) {
                s.pickupAnimTimer -= delta;
                const flashOn = Math.floor((200 - s.pickupAnimTimer) / 50) % 2 === 0;
                s.sprite.setAlpha(flashOn ? 1 : 0.2);
                if (s.pickupAnimTimer <= 0) {
                    s.sprite.destroy();
                    this.supplies.splice(i, 1);
                    continue;
                }
            }

            if (s.lifetime <= 0 && !s.pickupAnimActive) {
                s.sprite.destroy();
                this.supplies.splice(i, 1);
            }
        }
    }

    private updateSafeZone(delta: number): void {
        const elapsed = this.time.now - this.gameStartedAt;
        if (elapsed > SAFE_ZONE_START_DELAY && this.safeZoneRadius > SAFE_ZONE_MIN_SIZE / 2) {
            const dt = delta / 1000;
            this.safeZoneRadius = Math.max(SAFE_ZONE_MIN_SIZE / 2, this.safeZoneRadius - SAFE_ZONE_SHRINK_RATE * dt);
        }
        this.updateSafeZoneVisuals();

        const distFromCenter = Math.sqrt(
            Math.pow(this.playerState.x - this.safeZoneCenterX, 2) +
            Math.pow(this.playerState.y - this.safeZoneCenterY, 2)
        );

        if (distFromCenter > this.safeZoneRadius) {
            this.outsideSafeZoneDamageTimer += delta;
            if (this.outsideSafeZoneDamageTimer >= 1000) {
                this.outsideSafeZoneDamageTimer = 0;
                this.playerState.hp = Math.max(0, this.playerState.hp - DAMAGE_OUTSIDE_SAFE_ZONE);
                if (this.playerState.hp <= 0) {
                    this.triggerGameOver();
                }
            }
        } else {
            this.outsideSafeZoneDamageTimer = 0;
        }
    }

    private checkCollisions(): void {
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const b = this.bullets[i];
            for (let j = this.enemies.length - 1; j >= 0; j--) {
                const e = this.enemies[j];
                const dx = b.sprite.x - e.sprite.x;
                const dy = b.sprite.y - e.sprite.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < ENEMY_RADIUS + BULLET_RADIUS) {
                    e.hp--;
                    b.sprite.destroy();
                    b.line.destroy();
                    this.bullets.splice(i, 1);

                    if (e.hp <= 0) {
                        this.tryDropSupply(e.sprite.x, e.sprite.y);
                        e.sprite.destroy();
                        this.enemies.splice(j, 1);
                    }
                    break;
                }
            }
        }

        for (const e of this.enemies) {
            const dx = e.sprite.x - this.playerState.x;
            const dy = e.sprite.y - this.playerState.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < ENEMY_RADIUS + PLAYER_RADIUS) {
                this.playerState.hp = Math.max(0, this.playerState.hp - 0.5);
                if (this.playerState.hp <= 0) {
                    this.triggerGameOver();
                }
            }
        }

        for (const s of this.supplies) {
            if (s.pickupAnimActive) continue;
            const sx = s.sprite.x;
            const sy = s.sprite.y;
            const dx = sx - this.playerState.x;
            const dy = sy - this.playerState.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < PLAYER_RADIUS + 12) {
                this.pickupSupply(s);
            }
        }
    }

    private checkWaveSpawn(): void {
        if (this.time.now - this.lastWaveTime >= WAVE_INTERVAL) {
            this.spawnWave();
        }
    }
}
