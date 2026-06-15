import { Creature, CreatureType, Fish, BigFish, Plankton } from '../entities/creature';

export interface PopulationStats {
    fish: number;
    bigFish: number;
    plankton: number;
}

export interface SimulationParams {
    planktonSpawnInterval: number;
    bigFishPredationRadius: number;
    smallFishBreedingThreshold: number;
}

const SCENE_WIDTH = 800;
const SCENE_HEIGHT = 600;
const DIRECTION_CHANGE_INTERVAL = 0.5;

export class Simulation {
    creatures: Creature[] = [];
    params: SimulationParams;
    predationHistory: number[] = [];
    populationHistory: PopulationStats[] = [];
    private predationCountPerSecond = 0;
    private secondTimer = 0;
    private planktonSpawnTimer = 0;
    private onResetCallback?: () => void;

    constructor(params: SimulationParams) {
        this.params = { ...params };
        this.initialize();
    }

    initialize(): void {
        this.creatures = [];
        this.predationHistory = [];
        this.populationHistory = [];
        this.predationCountPerSecond = 0;
        this.secondTimer = 0;
        this.planktonSpawnTimer = 0;

        for (let i = 0; i < 20; i++) {
            this.creatures.push(new Fish(
                Math.random() * SCENE_WIDTH,
                Math.random() * SCENE_HEIGHT
            ));
        }

        for (let i = 0; i < 5; i++) {
            this.creatures.push(new BigFish(
                Math.random() * SCENE_WIDTH,
                Math.random() * SCENE_HEIGHT
            ));
        }

        for (let i = 0; i < 30; i++) {
            this.creatures.push(new Plankton(
                Math.random() * SCENE_WIDTH,
                Math.random() * SCENE_HEIGHT
            ));
        }
    }

    setParams(params: Partial<SimulationParams>): void {
        this.params = { ...this.params, ...params };
    }

    onReset(callback: () => void): void {
        this.onResetCallback = callback;
    }

    reset(): void {
        this.initialize();
        if (this.onResetCallback) {
            this.onResetCallback();
        }
    }

    getPopulationStats(): PopulationStats {
        let fish = 0, bigFish = 0, plankton = 0;
        for (const c of this.creatures) {
            if (c.type === 'fish') fish++;
            else if (c.type === 'bigFish') bigFish++;
            else plankton++;
        }
        return { fish, bigFish, plankton };
    }

    getPredationSuccessRate(): number[] {
        return this.predationHistory.slice(-60);
    }

    getPopulationFluctuation(): PopulationStats {
        if (this.populationHistory.length < 2) {
            return { fish: 0, bigFish: 0, plankton: 0 };
        }
        const recent = this.populationHistory.slice(-10);
        const calcStd = (arr: number[]): number => {
            if (arr.length === 0) return 0;
            const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
            const variance = arr.reduce((a, b) => a + (b - mean) ** 2, 0) / arr.length;
            return Math.sqrt(variance);
        };
        return {
            fish: calcStd(recent.map(p => p.fish)),
            bigFish: calcStd(recent.map(p => p.bigFish)),
            plankton: calcStd(recent.map(p => p.plankton))
        };
    }

    update(dt: number): void {
        this.secondTimer += dt;
        this.planktonSpawnTimer += dt;

        if (this.planktonSpawnTimer >= this.params.planktonSpawnInterval) {
            this.planktonSpawnTimer = 0;
            this.creatures.push(new Plankton(
                Math.random() * SCENE_WIDTH,
                Math.random() * SCENE_HEIGHT
            ));
        }

        if (this.secondTimer >= 1) {
            this.secondTimer = 0;
            this.predationHistory.push(this.predationCountPerSecond);
            if (this.predationHistory.length > 60) this.predationHistory.shift();
            this.predationCountPerSecond = 0;

            this.populationHistory.push(this.getPopulationStats());
            if (this.populationHistory.length > 10) this.populationHistory.shift();
        }

        this.updateCreatures(dt);
        this.handlePredation();
        this.handleBreeding();
        this.handleAgingAndDeath(dt);
        this.trimCreatures();
    }

    private updateCreatures(dt: number): void {
        const fishes = this.creatures.filter(c => c.type === 'fish');

        for (const c of this.creatures) {
            c.directionChangeTimer += dt;

            if (c.type === 'bigFish') {
                const nearestFish = this.findNearest(c, fishes);
                if (nearestFish) {
                    const dx = nearestFish.x - c.x;
                    const dy = nearestFish.y - c.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < this.params.bigFishPredationRadius && dist > 0) {
                        const speed = 66;
                        c.vx = (dx / dist) * speed;
                        c.vy = (dy / dist) * speed;
                    } else {
                        this.randomizeDirectionIfNeeded(c);
                    }
                } else {
                    this.randomizeDirectionIfNeeded(c);
                }
            } else {
                this.randomizeDirectionIfNeeded(c);
            }

            c.x += c.vx * dt;
            c.y += c.vy * dt;

            if (c.x < 0) { c.x = 0; c.vx = Math.abs(c.vx); }
            if (c.x > SCENE_WIDTH) { c.x = SCENE_WIDTH; c.vx = -Math.abs(c.vx); }
            if (c.y < 0) { c.y = 0; c.vy = Math.abs(c.vy); }
            if (c.y > SCENE_HEIGHT) { c.y = SCENE_HEIGHT; c.vy = -Math.abs(c.vy); }
        }
    }

    private randomizeDirectionIfNeeded(c: Creature): void {
        if (c.directionChangeTimer >= DIRECTION_CHANGE_INTERVAL) {
            c.directionChangeTimer = 0;
            const angle = Math.random() * Math.PI * 2;
            let speed = 60;
            if (c.type === 'bigFish') speed = 66;
            else if (c.type === 'plankton') speed = 15;
            c.vx = Math.cos(angle) * speed;
            c.vy = Math.sin(angle) * speed;
        }
    }

    private findNearest(self: Creature, others: Creature[]): Creature | null {
        let nearest: Creature | null = null;
        let minDist = Infinity;
        for (const o of others) {
            if (o.id === self.id) continue;
            const dx = o.x - self.x;
            const dy = o.y - self.y;
            const dist = dx * dx + dy * dy;
            if (dist < minDist) {
                minDist = dist;
                nearest = o;
            }
        }
        return nearest;
    }

    private handlePredation(): void {
        const bigFishes = this.creatures.filter(c => c.type === 'bigFish');
        const fishes = this.creatures.filter(c => c.type === 'fish');
        const planktons = this.creatures.filter(c => c.type === 'plankton');

        for (const bigFish of bigFishes) {
            for (const fish of fishes) {
                const dx = fish.x - bigFish.x;
                const dy = fish.y - bigFish.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 18) {
                    this.creatures = this.creatures.filter(c => c.id !== fish.id);
                    const idx = fishes.indexOf(fish);
                    if (idx > -1) fishes.splice(idx, 1);
                    bigFish.eaten++;
                    this.predationCountPerSecond++;
                    break;
                }
            }
        }

        for (const fish of this.creatures.filter(c => c.type === 'fish')) {
            for (const plankton of planktons) {
                const dx = plankton.x - fish.x;
                const dy = plankton.y - fish.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 12) {
                    this.creatures = this.creatures.filter(c => c.id !== plankton.id);
                    const idx = planktons.indexOf(plankton);
                    if (idx > -1) planktons.splice(idx, 1);
                    fish.eaten++;
                    break;
                }
            }
        }
    }

    private handleBreeding(): void {
        const newCreatures: Creature[] = [];

        for (const c of this.creatures) {
            if (c.type === 'fish' && c.eaten >= this.params.smallFishBreedingThreshold) {
                c.eaten = 0;
                newCreatures.push(new Fish(
                    Math.max(0, Math.min(SCENE_WIDTH, c.x + (Math.random() - 0.5) * 30)),
                    Math.max(0, Math.min(SCENE_HEIGHT, c.y + (Math.random() - 0.5) * 30))
                ));
            } else if (c.type === 'bigFish' && c.eaten >= 2) {
                c.eaten = 0;
                newCreatures.push(new BigFish(
                    Math.max(0, Math.min(SCENE_WIDTH, c.x + (Math.random() - 0.5) * 30)),
                    Math.max(0, Math.min(SCENE_HEIGHT, c.y + (Math.random() - 0.5) * 30))
                ));
            }
        }

        this.creatures.push(...newCreatures);
    }

    private handleAgingAndDeath(dt: number): void {
        for (const c of this.creatures) {
            c.age += dt;
        }
        this.creatures = this.creatures.filter(c => c.age < c.lifespan);
    }

    private trimCreatures(): void {
        if (this.creatures.length > 200) {
            const planktons = this.creatures.filter(c => c.type === 'plankton');
            const others = this.creatures.filter(c => c.type !== 'plankton');
            if (planktons.length > 100) {
                const trimmed = planktons.slice(0, 100);
                this.creatures = [...others, ...trimmed];
            }
        }
    }
}
