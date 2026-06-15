import { Vector2, Projectile, Fragment } from './physicsEngine';

export type GamePhase = 'placing' | 'aiming' | 'charging' | 'firing' | 'ended';

export type StructureType = 'wall' | 'fence' | 'sandbag';

export interface Particle {
    position: Vector2;
    velocity: Vector2;
    color: string;
    life: number;
    maxLife: number;
    size: number;
}

export interface Structure {
    id: string;
    type: StructureType;
    position: Vector2;
    health: number;
    maxHealth: number;
    scale: number;
    isPlayer: boolean;
    placementProgress: number;
}

export interface Unit {
    id: string;
    position: Vector2;
    targetPosition: Vector2;
    moveProgress: number;
    isSelected: boolean;
    isMoving: boolean;
}

export interface GameStats {
    playerStructuresLeft: number;
    enemyStructuresLeft: number;
    hitRate: number;
    maxSingleDamage: number;
    shotsFired: number;
    shotsHit: number;
}

const STRUCTURE_HEALTH: Record<StructureType, number> = {
    wall: 100,
    fence: 50,
    sandbag: 75,
};

export class GameState {
    private eventCallbacks: Map<string, Function[]> = new Map();

    phase: GamePhase;
    timeRemaining: number;
    playerStructures: Structure[];
    enemyStructures: Structure[];
    projectiles: Projectile[];
    particles: Particle[];
    fragments: Fragment[];
    units: Unit[];
    stats: GameStats;
    chargeLevel: number;
    aimAngle: number;
    selectedStructureType: StructureType;
    selectedAmmoType: string;
    statsPanelProgress: number;

    constructor() {
        this.phase = 'placing';
        this.timeRemaining = 180;
        this.playerStructures = [];
        this.enemyStructures = [];
        this.projectiles = [];
        this.particles = [];
        this.fragments = [];
        this.units = [];
        this.stats = {
            playerStructuresLeft: 0,
            enemyStructuresLeft: 0,
            hitRate: 0,
            maxSingleDamage: 0,
            shotsFired: 0,
            shotsHit: 0,
        };
        this.chargeLevel = 0;
        this.aimAngle = Math.PI / 4;
        this.selectedStructureType = 'wall';
        this.selectedAmmoType = 'cannonball';
        this.statsPanelProgress = 0;

        this.generateEnemyStructures();
    }

    on(event: string, callback: Function): void {
        if (!this.eventCallbacks.has(event)) {
            this.eventCallbacks.set(event, []);
        }
        this.eventCallbacks.get(event)!.push(callback);
    }

    emit(event: string, data?: any): void {
        const callbacks: Function[] | undefined = this.eventCallbacks.get(event);
        if (callbacks) {
            for (const callback of callbacks) {
                callback(data);
            }
        }
    }

    update(deltaTime: number): void {
        if (this.phase !== 'ended') {
            this.timeRemaining -= deltaTime;
            if (this.timeRemaining <= 0) {
                this.timeRemaining = 0;
                this.endGame();
            }
        }

        this.updatePlacementAnimations(deltaTime);
        this.updateUnits(deltaTime);
        this.updateStats();
        this.checkGameEnd();
    }

    private updatePlacementAnimations(deltaTime: number): void {
        const allStructures: Structure[] = [...this.playerStructures, ...this.enemyStructures];
        for (const structure of allStructures) {
            if (structure.placementProgress < 1) {
                structure.placementProgress = Math.min(1, structure.placementProgress + deltaTime * 3);
                structure.scale = this.easeOutElastic(structure.placementProgress, 0.5, 0.5, 1);
            }
        }
    }

    private updateUnits(deltaTime: number): void {
        for (const unit of this.units) {
            if (unit.isMoving && unit.moveProgress < 1) {
                unit.moveProgress = Math.min(1, unit.moveProgress + deltaTime * 2);
                const t: number = this.easeInOutQuad(unit.moveProgress);
                unit.position = {
                    x: unit.position.x + (unit.targetPosition.x - unit.position.x) * t,
                    y: unit.position.y + (unit.targetPosition.y - unit.position.y) * t,
                };
                if (unit.moveProgress >= 1) {
                    unit.isMoving = false;
                }
            }
        }
    }

    private updateStats(): void {
        this.stats.playerStructuresLeft = this.playerStructures.filter(
            (s: Structure): boolean => s.health > 0
        ).length;
        this.stats.enemyStructuresLeft = this.enemyStructures.filter(
            (s: Structure): boolean => s.health > 0
        ).length;
        if (this.stats.shotsFired > 0) {
            this.stats.hitRate = this.stats.shotsHit / this.stats.shotsFired;
        }
    }

    private checkGameEnd(): void {
        if (this.phase === 'ended' || this.phase === 'placing') return;

        const playerAlive: boolean = this.playerStructures.some(
            (s: Structure): boolean => s.health > 0
        );
        const enemyAlive: boolean = this.enemyStructures.some(
            (s: Structure): boolean => s.health > 0
        );

        if (!playerAlive || !enemyAlive) {
            this.endGame();
        }
    }

    private endGame(): void {
        this.phase = 'ended';
        this.emit('gameEnd', this.stats);
    }

    private generateEnemyStructures(): void {
        const types: StructureType[] = ['wall', 'fence', 'sandbag'];
        for (let i: number = 0; i < 5; i++) {
            const type: StructureType = types[Math.floor(Math.random() * types.length)];
            const maxHealth: number = STRUCTURE_HEALTH[type];
            const structure: Structure = {
                id: `enemy-${i}`,
                type,
                position: {
                    x: 16 + Math.random() * 6,
                    y: 4 + Math.random() * 12,
                },
                health: maxHealth,
                maxHealth,
                scale: 0.5,
                isPlayer: false,
                placementProgress: 1,
            };
            this.enemyStructures.push(structure);
        }
    }

    private easeOutElastic(t: number, b: number, c: number, d: number): number {
        let s: number = 1.70158;
        let p: number = 0;
        let a: number = c;
        if (t === 0) return b;
        if ((t /= d) === 1) return b + c;
        if (!p) p = d * 0.3;
        if (a < Math.abs(c)) {
            a = c;
            s = p / 4;
        } else {
            s = (p / (2 * Math.PI)) * Math.asin(c / a);
        }
        return a * Math.pow(2, -10 * t) * Math.sin((t * d - s) * (2 * Math.PI) / p) + c + b;
    }

    private easeInOutQuad(t: number): number {
        return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    }
}
