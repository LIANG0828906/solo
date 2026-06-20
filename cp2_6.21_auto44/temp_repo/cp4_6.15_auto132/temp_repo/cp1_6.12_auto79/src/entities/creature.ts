export type CreatureType = 'fish' | 'bigFish' | 'plankton';

export interface Creature {
    id: number;
    type: CreatureType;
    x: number;
    y: number;
    vx: number;
    vy: number;
    age: number;
    lifespan: number;
    directionChangeTimer: number;
    eaten: number;
}

let nextId = 0;

export class Fish implements Creature {
    id: number;
    type: CreatureType = 'fish';
    x: number;
    y: number;
    vx: number;
    vy: number;
    age: number = 0;
    lifespan: number = 60;
    directionChangeTimer: number = 0;
    eaten: number = 0;

    constructor(x: number, y: number) {
        this.id = nextId++;
        this.x = x;
        this.y = y;
        const angle = Math.random() * Math.PI * 2;
        const speed = 60;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
    }
}

export class BigFish implements Creature {
    id: number;
    type: CreatureType = 'bigFish';
    x: number;
    y: number;
    vx: number;
    vy: number;
    age: number = 0;
    lifespan: number = 120;
    directionChangeTimer: number = 0;
    eaten: number = 0;

    constructor(x: number, y: number) {
        this.id = nextId++;
        this.x = x;
        this.y = y;
        const angle = Math.random() * Math.PI * 2;
        const speed = 66;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
    }
}

export class Plankton implements Creature {
    id: number;
    type: CreatureType = 'plankton';
    x: number;
    y: number;
    vx: number;
    vy: number;
    age: number = 0;
    lifespan: number = Infinity;
    directionChangeTimer: number = 0;
    eaten: number = 0;

    constructor(x: number, y: number) {
        this.id = nextId++;
        this.x = x;
        this.y = y;
        const angle = Math.random() * Math.PI * 2;
        const speed = 15;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
    }
}
