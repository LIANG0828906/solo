import { Enemy, Projectile, FloatingText, GameMode, PlantInstance } from './PlantTypes';
import { EventEmitter } from './PlantEngine';

export class BattleManager extends EventEmitter {
    static readonly GRID_SIZE = 50;
    static readonly GRID_COLS = 12;
    static readonly GRID_ROWS = 8;
    static readonly ENEMY_SIZE = 30;
    static readonly ENEMY_SPEED = 30;
    static readonly PROJECTILE_SPEED = 400;
    static readonly PROJECTILE_DURATION = 150;
    static readonly ENEMY_HP = 60;
    static readonly SPAWN_INTERVAL = 2000;

    private enemies: Enemy[];
    private projectiles: Projectile[];
    private floatingTexts: FloatingText[];
    private mode: GameMode;
    private lastSpawnTime: number;
    private gameTime: number;

    constructor(mode: GameMode = GameMode.SINGLE) {
        super();
        this.enemies = [];
        this.projectiles = [];
        this.floatingTexts = [];
        this.mode = mode;
        this.lastSpawnTime = 0;
        this.gameTime = 0;
    }

    setMode(mode: GameMode): void {
        this.mode = mode;
    }

    getEnemies(): Enemy[] {
        return this.enemies;
    }

    getProjectiles(): Projectile[] {
        return this.projectiles;
    }

    getFloatingTexts(): FloatingText[] {
        return this.floatingTexts;
    }

    spawnEnemy(playerSide: number = 1): void {
        const id = Date.now().toString() + Math.random().toString(36).slice(2, 8);
        const row = Math.floor(Math.random() * BattleManager.GRID_ROWS);
        let x: number;

        if (this.mode === GameMode.DUEL) {
            x = BattleManager.GRID_COLS * BattleManager.GRID_SIZE / 2;
        } else {
            x = BattleManager.GRID_COLS * BattleManager.GRID_SIZE;
        }

        const y = row * BattleManager.GRID_SIZE + BattleManager.GRID_SIZE / 2;

        const enemy: Enemy = {
            id,
            x,
            y,
            hp: BattleManager.ENEMY_HP,
            maxHp: BattleManager.ENEMY_HP,
            speed: BattleManager.ENEMY_SPEED,
            pathIndex: playerSide,
            pathPointIndex: row
        };

        (enemy as any).direction = this.mode === GameMode.DUEL ? (playerSide === 1 ? -1 : 1) : -1;
        (enemy as any).playerSide = playerSide;
        (enemy as any).row = row;

        this.enemies.push(enemy);
    }

    update(deltaTimeMs: number, plants: PlantInstance[]): { kills: { player1: number; player2: number } } {
        const kills = { player1: 0, player2: 0 };
        const deltaTime = deltaTimeMs / 1000;

        this.gameTime += deltaTimeMs;

        if (this.gameTime - this.lastSpawnTime >= BattleManager.SPAWN_INTERVAL) {
            this.lastSpawnTime = this.gameTime;
            if (this.mode === GameMode.DUEL) {
                this.spawnEnemy(1);
                this.spawnEnemy(2);
            } else {
                this.spawnEnemy(1);
            }
        }

        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            const direction = (enemy as any).direction ?? -1;
            enemy.x += direction * enemy.speed * deltaTime;

            const playerSide = (enemy as any).playerSide ?? 1;
            const outOfBounds = this.mode === GameMode.DUEL
                ? (playerSide === 1 && enemy.x < -BattleManager.ENEMY_SIZE) ||
                  (playerSide === 2 && enemy.x > BattleManager.GRID_COLS * BattleManager.GRID_SIZE + BattleManager.ENEMY_SIZE)
                : enemy.x < -BattleManager.ENEMY_SIZE;

            if (outOfBounds) {
                this.enemies.splice(i, 1);
            }
        }

        for (const plant of plants) {
            const plantCooldown = (plant as any).cooldown ?? plant.attackCooldown;
            if (plantCooldown <= 0) {
                let nearestEnemy: Enemy | null = null;
                let nearestDistance = Infinity;

                const plantX = (plant as any).x ?? plant.gridX * BattleManager.GRID_SIZE + BattleManager.GRID_SIZE / 2;
                const plantY = (plant as any).y ?? plant.gridY * BattleManager.GRID_SIZE + BattleManager.GRID_SIZE / 2;
                const plantRow = (plant as any).row ?? plant.gridY;
                const plantRange = (plant as any).range ?? plant.currentRange;
                const plantPlayerSide = (plant as any).playerSide ?? plant.playerId ?? 1;
                const plantDamage = (plant as any).damage ?? plant.currentAttack;
                const plantAttackSpeed = (plant as any).attackSpeed ?? plant.attackCooldown;

                for (const enemy of this.enemies) {
                    const enemyRow = (enemy as any).row ?? enemy.pathPointIndex;
                    const enemyPlayerSide = (enemy as any).playerSide ?? enemy.pathIndex;
                    
                    if (enemyRow !== plantRow) continue;
                    if (enemyPlayerSide !== plantPlayerSide) continue;

                    const inRange = this.mode === GameMode.DUEL && plantPlayerSide === 2
                        ? enemy.x > plantX - plantRange * BattleManager.GRID_SIZE
                        : enemy.x < plantX + plantRange * BattleManager.GRID_SIZE;

                    if (!inRange) continue;

                    const dist = this.distance(plantX, plantY, enemy.x, enemy.y);
                    if (dist < nearestDistance) {
                        nearestDistance = dist;
                        nearestEnemy = enemy;
                    }
                }

                if (nearestEnemy) {
                    const projectileId = Date.now().toString() + Math.random().toString(36).slice(2, 8);
                    const projectile: Projectile = {
                        id: projectileId,
                        x: plantX,
                        y: plantY,
                        targetId: nearestEnemy.id,
                        damage: plantDamage,
                        speed: BattleManager.PROJECTILE_SPEED,
                        color: '#FFFFFF'
                    };
                    (projectile as any).duration = BattleManager.PROJECTILE_DURATION;
                    (projectile as any).playerSide = plantPlayerSide;
                    this.projectiles.push(projectile);
                    (plant as any).cooldown = plantAttackSpeed;
                }
            } else {
                (plant as any).cooldown = plantCooldown - deltaTimeMs;
            }
        }

        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const projectile = this.projectiles[i];
            const projectileDuration = (projectile as any).duration ?? BattleManager.PROJECTILE_DURATION;
            (projectile as any).duration = projectileDuration - deltaTimeMs;

            if ((projectile as any).duration <= 0) {
                this.projectiles.splice(i, 1);
                continue;
            }

            const target = this.enemies.find(e => e.id === projectile.targetId);
            if (!target) {
                this.projectiles.splice(i, 1);
                continue;
            }

            const dx = target.x - projectile.x;
            const dy = target.y - projectile.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < BattleManager.ENEMY_SIZE / 2) {
                target.hp -= projectile.damage;
                this.projectiles.splice(i, 1);

                if (target.hp <= 0) {
                    const enemyIndex = this.enemies.findIndex(e => e.id === target.id);
                    if (enemyIndex !== -1) {
                        this.enemies.splice(enemyIndex, 1);
                    }

                    const targetPlayerSide = (target as any).playerSide ?? target.pathIndex;
                    if (targetPlayerSide === 1) {
                        kills.player1++;
                    } else {
                        kills.player2++;
                    }

                    this.addFloatingText(target.x, target.y, '+1', '#FFD700');
                    this.emit('enemyKilled', { enemy: target, playerSide: targetPlayerSide });
                }
            } else {
                projectile.x += (dx / dist) * projectile.speed * deltaTime;
                projectile.y += (dy / dist) * projectile.speed * deltaTime;
            }
        }

        for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
            const ft = this.floatingTexts[i];
            ft.duration -= deltaTimeMs;
            ft.y -= 30 * deltaTime;

            if (ft.duration <= 0) {
                this.floatingTexts.splice(i, 1);
            }
        }

        return { kills };
    }

    reset(): void {
        this.enemies = [];
        this.projectiles = [];
        this.floatingTexts = [];
        this.lastSpawnTime = 0;
        this.gameTime = 0;
    }

    gridToPixel(gridX: number, gridY: number): { x: number; y: number } {
        return {
            x: gridX * BattleManager.GRID_SIZE + BattleManager.GRID_SIZE / 2,
            y: gridY * BattleManager.GRID_SIZE + BattleManager.GRID_SIZE / 2
        };
    }

    distance(x1: number, y1: number, x2: number, y2: number): number {
        return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
    }

    addFloatingText(x: number, y: number, text: string, color: string): void {
        const id = Date.now().toString() + Math.random().toString(36).slice(2, 8);
        const floatingText: FloatingText = {
            id,
            x,
            y,
            text,
            color,
            createdAt: Date.now(),
            duration: 1000
        };
        this.floatingTexts.push(floatingText);
        this.emit('floatingTextCreated', floatingText);
    }
}
