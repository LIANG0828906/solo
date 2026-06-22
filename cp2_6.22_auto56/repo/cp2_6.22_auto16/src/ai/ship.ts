export interface TrailParticle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
    maxLife: number;
    size: number;
    color: number;
}

export class Ship {
    id: string;
    fleetId: string;
    x: number;
    y: number;
    targetX: number;
    targetY: number;
    hp: number;
    maxHp: number;
    firepower: number;
    armor: number;
    angle: number = 0;
    speedCoefficient: number = 1;
    trailParticles: TrailParticle[];
    sprite?: any;
    offsetX: number;
    offsetY: number;

    private _trailTimer: number = 0;

    constructor(
        id: string,
        fleetId: string,
        x: number,
        y: number,
        offsetX: number = 0,
        offsetY: number = 0
    ) {
        this.id = id;
        this.fleetId = fleetId;
        this.x = x;
        this.y = y;
        this.targetX = x;
        this.targetY = y;
        this.maxHp = 100;
        this.hp = 100;
        this.firepower = 20;
        this.armor = 5;
        this.trailParticles = [];
        this.offsetX = offsetX;
        this.offsetY = offsetY;
    }

    moveToward(targetX: number, targetY: number, delta: number, speed: number): number {
        const dx = targetX - this.x;
        const dy = targetY - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < 0.001) {
            return 0;
        }

        this.angle = Math.atan2(dy, dx);

        const moveDistance = Math.min(distance, speed * this.speedCoefficient * delta);
        const ratio = moveDistance / distance;
        this.x += dx * ratio;
        this.y += dy * ratio;

        this._trailTimer += delta;
        if (this._trailTimer >= 0.05) {
            this._trailTimer = 0;
            const tailX = this.x - Math.cos(this.angle) * 0.3;
            const tailY = this.y - Math.sin(this.angle) * 0.3;
            this.trailParticles.push({
                x: tailX,
                y: tailY,
                vx: -Math.cos(this.angle) * 0.5,
                vy: -Math.sin(this.angle) * 0.5,
                life: 0.5,
                maxLife: 0.5,
                size: 0.15,
                color: 0x66ccff
            });
        }

        return moveDistance;
    }

    updateTrail(delta: number): void {
        for (let i = this.trailParticles.length - 1; i >= 0; i--) {
            const p = this.trailParticles[i];
            p.life -= delta;
            if (p.life <= 0) {
                this.trailParticles.splice(i, 1);
            } else {
                    p.x += p.vx * delta;
                    p.y += p.vy * delta;
            }
        }
    }

    takeDamage(amount: number): void {
        const actualDamage = Math.max(1, amount - this.armor);
        this.hp = Math.max(0, this.hp - actualDamage);
    }

    isAlive(): boolean {
        return this.hp > 0;
    }
}
