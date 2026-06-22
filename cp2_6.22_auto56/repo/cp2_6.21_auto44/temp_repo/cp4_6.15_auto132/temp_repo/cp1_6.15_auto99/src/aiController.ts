import { Vector2, PhysicsEngine, Projectile } from './physicsEngine';
import { Structure, GameState } from './gameState';

export class AIController {
    public nextShotTime: number = 0;
    public currentWarning: { position: Vector2; startTime: number; duration: number } | null = null;
    public minShotInterval: number = 8;
    public maxShotInterval: number = 12;
    public warningDuration: number = 1.5;

    private readonly cannonPosition: Vector2;
    private currentTime: number = 0;

    constructor(gridWidth: number, gridHeight: number) {
        this.cannonPosition = {
            x: gridWidth - 3,
            y: gridHeight / 2,
        };
    }

    public update(gameState: GameState, physics: typeof PhysicsEngine, deltaTime: number): void {
        this.currentTime += deltaTime;

        if (!this.currentWarning && this.currentTime >= this.nextShotTime) {
            const target: Vector2 = this.calculateAimTarget(gameState.playerStructures);
            this.startWarning(target);
        }

        if (this.currentWarning) {
            const elapsed: number = this.currentTime - this.currentWarning.startTime;
            if (elapsed >= this.currentWarning.duration) {
                const { angle, power } = this.generateFiringParams(this.currentWarning.position, this.cannonPosition, physics);
                this.fireProjectile(gameState, this.cannonPosition, angle, power);
            }
        }
    }

    public calculateAimTarget(playerStructures: Structure[]): Vector2 {
        const aliveStructures: Structure[] = playerStructures.filter((s: Structure): boolean => s.health > 0);

        if (aliveStructures.length > 0) {
            const targetStructure: Structure = aliveStructures[Math.floor(Math.random() * aliveStructures.length)];
            const offsetX: number = (Math.random() - 0.5) * 60;
            const offsetY: number = (Math.random() - 0.5) * 60;
            return {
                x: targetStructure.position.x + offsetX,
                y: targetStructure.position.y + offsetY,
            };
        }

        return {
            x: 100 + Math.random() * 200,
            y: 200 + Math.random() * 200,
        };
    }

    public generateFiringParams(target: Vector2, cannonPos: Vector2, physics: typeof PhysicsEngine): { angle: number; power: number } {
        const dx: number = target.x - cannonPos.x;
        const dy: number = target.y - cannonPos.y;
        const g: number = physics.GRAVITY;
        const power: number = 20 + Math.random() * 25;
        const v0: number = power;

        const A: number = (g * dx * dx) / (2 * v0 * v0);
        const B: number = -dx;
        const C: number = dy + A;

        const discriminant: number = B * B - 4 * A * C;

        if (discriminant < 0) {
            return { angle: 60, power };
        }

        const sqrtDiscriminant: number = Math.sqrt(discriminant);
        const u1: number = (-B + sqrtDiscriminant) / (2 * A);
        const u2: number = (-B - sqrtDiscriminant) / (2 * A);

        const angle1: number = Math.atan(u1) * (180 / Math.PI);
        const angle2: number = Math.atan(u2) * (180 / Math.PI);

        const highAngle: number = Math.max(angle1, angle2);

        return { angle: highAngle, power };
    }

    public startWarning(position: Vector2): void {
        this.currentWarning = {
            position,
            startTime: this.currentTime,
            duration: this.warningDuration,
        };
    }

    public fireProjectile(
        gameState: GameState,
        position: Vector2,
        angle: number,
        power: number
    ): void {
        const rad: number = (angle * Math.PI) / 180;
        const projectile = {
            position: { ...position },
            velocity: {
                x: -power * Math.cos(rad),
                y: -power * Math.sin(rad),
            },
            radius: 8,
            type: 'cannonball',
            isEnemy: true,
        };

        (gameState.projectiles as any[]).push(projectile);

        this.nextShotTime = this.currentTime + this.minShotInterval + Math.random() * (this.maxShotInterval - this.minShotInterval);
        this.currentWarning = null;

        gameState.emit('enemyFired', { projectile, angle, power });
    }

    public getWarningProgress(): number {
        if (!this.currentWarning) {
            return 0;
        }

        const elapsed: number = this.currentTime - this.currentWarning.startTime;
        return Math.min(1, elapsed / this.currentWarning.duration);
    }

    public getCannonPosition(): Vector2 {
        return { ...this.cannonPosition };
    }
}
