import { GridManager } from '../map/gridManager';
import { ResourceField, ResourceType } from '../map/resourceField';
import { Ship } from './ship';

export enum FleetState {
    IDLE,
    MOVING_TO_TARGET,
    HARVESTING,
    RETURNING,
    FIGHTING
}

export interface Cargo {
    iron: number;
    crystal: number;
    gas: number;
}

export interface Fleet {
    id: string;
    ships: Ship[];
    state: FleetState;
    targetResourceId?: string;
    homeBaseId: string;
    path: { x: number; y: number }[];
    pathIndex: number;
    cargo: Cargo;
    cargoCapacity: number;
    speed: number;
    speedCoefficient: number;
    sprite?: any;
    pirateCooldown: number;
    fightingTime: number;
    combatLog?: any;
}

export interface PirateFleet {
    id: string;
    x: number;
    y: number;
    firepower: number;
    armor: number;
    hp: number;
    maxHp: number;
}

interface AStarNode {
    x: number;
    y: number;
    g: number;
    h: number;
    f: number;
    parent: AStarNode | null;
}

export class FleetManager {
    fleets: Fleet[];
    pirates: PirateFleet[];
    gridManager: GridManager;
    eventTarget: EventTarget;
    nextId: number;

    constructor(gridManager: GridManager) {
        this.fleets = [];
        this.pirates = [];
        this.gridManager = gridManager;
        this.eventTarget = new EventTarget();
        this.nextId = 1;
    }

    createFleet(baseId: string, baseX: number, baseY: number, shipCount: number = 3): Fleet {
        const fleetId = `fleet_${this.nextId++}`;
        const ships: Ship[] = [];
        const offsets = [
            { x: 0, y: 0 },
            { x: -0.5, y: 0.4 },
            { x: 0.5, y: 0.4 },
            { x: -0.3, y: -0.4 },
            { x: 0.3, y: -0.4 }
        ];
        for (let i = 0; i < shipCount; i++) {
            const offset = offsets[i % offsets.length];
            ships.push(new Ship(
                `ship_${fleetId}_${i}`,
                fleetId,
                baseX + offset.x,
                baseY + offset.y,
                offset.x,
                offset.y
            ));
        }

        const fleet: Fleet = {
            id: fleetId,
            ships,
            state: FleetState.IDLE,
            homeBaseId: baseId,
            path: [],
            pathIndex: 0,
            cargo: { iron: 0, crystal: 0, gas: 0 },
            cargoCapacity: shipCount * 50,
            speed: 3,
            speedCoefficient: 1,
            pirateCooldown: 0,
            fightingTime: 0
        };

        this.fleets.push(fleet);
        this.eventTarget.dispatchEvent(new CustomEvent('fleet:created', { detail: fleet }));
        return fleet;
    }

    assignTarget(fleetId: string, resourceId: string): void {
        const fleet = this.fleets.find(f => f.id === fleetId);
        if (!fleet) return;

        const resourceField = this.gridManager.getResourceField(resourceId);
        if (!resourceField) return;

        fleet.targetResourceId = resourceId;
        const pos = this.getFleetPosition(fleet);
        fleet.path = this.calculatePath(pos.x, pos.y, resourceField.x, resourceField.y);
        fleet.pathIndex = 0;
        fleet.state = FleetState.MOVING_TO_TARGET;
        this.eventTarget.dispatchEvent(new CustomEvent('fleet:stateChanged', { detail: fleet }));
    }

    update(delta: number, baseManager: any): void {
        for (const fleet of this.fleets) {
            for (const ship of fleet.ships) {
                ship.updateTrail(delta);
            }

            if (fleet.state === FleetState.FIGHTING) {
                fleet.fightingTime -= delta;
                if (fleet.fightingTime <= 0) {
                    this._resolveCombat(fleet);
                }
                continue;
            }

            if (fleet.pirateCooldown > 0) {
                fleet.pirateCooldown -= delta;
            }

            if (fleet.state === FleetState.MOVING_TO_TARGET || fleet.state === FleetState.RETURNING) {
                this._moveFleet(fleet, delta);

                if (fleet.pirateCooldown <= 0 && Math.random() < 0.03 * delta / 1.5) {
                    const pos = this.getFleetPosition(fleet);
                    const pirate = this.spawnPirateNear(pos.x, pos.y);
                    this.pirates.push(pirate);
                    fleet.state = FleetState.FIGHTING;
                    fleet.fightingTime = 1.5;
                    fleet.combatLog = { pirate };
                    this.eventTarget.dispatchEvent(new CustomEvent('combat:occurred', { detail: { fleet, pirate } }));
                }
            } else if (fleet.state === FleetState.HARVESTING) {
                this._harvest(fleet, delta);
            } else if (fleet.state === FleetState.IDLE) {
            }
        }
    }

    private _moveFleet(fleet: Fleet, delta: number): void {
        if (fleet.pathIndex >= fleet.path.length) {
            if (fleet.state === FleetState.MOVING_TO_TARGET) {
                fleet.state = FleetState.HARVESTING;
                this.eventTarget.dispatchEvent(new CustomEvent('fleet:stateChanged', { detail: fleet }));
            } else if (fleet.state === FleetState.RETURNING) {
                this._unloadCargo(fleet);
            }
            return;
        }

        const target = fleet.path[fleet.pathIndex];
        let allReached = true;

        for (const ship of fleet.ships) {
            const shipTargetX = target.x + ship.offsetX;
            const shipTargetY = target.y + ship.offsetY;
            const moved = ship.moveToward(shipTargetX, shipTargetY, delta, fleet.speed);
            if (moved > 0) {
                allReached = false;
            }
        }

        if (allReached) {
            fleet.pathIndex++;
        }
    }

    private _harvest(fleet: Fleet, delta: number): void {
        if (!fleet.targetResourceId) {
            fleet.state = FleetState.IDLE;
            return;
        }

        const resourceField = this.gridManager.getResourceField(fleet.targetResourceId);
        if (!resourceField || resourceField.isDepleted) {
            this._returnToBase(fleet);
            return;
        }

        const totalCargo = this.getTotalCargo(fleet);
        if (totalCargo >= fleet.cargoCapacity) {
            this._returnToBase(fleet);
            return;
        }

        const efficiency = resourceField.efficiency;
        const shipCount = fleet.ships.filter(s => s.isAlive()).length;
        const harvestAmount = efficiency * shipCount * delta;
        const actualHarvested = resourceField.harvest(harvestAmount);

        const remaining = fleet.cargoCapacity - totalCargo;
        const toStore = Math.min(actualHarvested, remaining);

        switch (resourceField.type) {
            case ResourceType.IRON:
                fleet.cargo.iron += toStore;
                break;
            case ResourceType.CRYSTAL:
                fleet.cargo.crystal += toStore;
                break;
            case ResourceType.GAS:
                fleet.cargo.gas += toStore;
                break;
        }

        if (resourceField.isDepleted) {
            this._returnToBase(fleet);
        }
    }

    private _returnToBase(fleet: Fleet): void {
        const base = this._getBaseById(fleet.homeBaseId);
        if (!base) {
            fleet.state = FleetState.IDLE;
            return;
        }
        const pos = this.getFleetPosition(fleet);
        fleet.path = this.calculatePath(pos.x, pos.y, base.x, base.y);
        fleet.pathIndex = 0;
        fleet.state = FleetState.RETURNING;
        this.eventTarget.dispatchEvent(new CustomEvent('fleet:stateChanged', { detail: fleet }));
    }

    private _unloadCargo(fleet: Fleet): void {
        if (fleet.cargo.iron > 0 || fleet.cargo.crystal > 0 || fleet.cargo.gas > 0) {
            this.eventTarget.dispatchEvent(new CustomEvent('fleet:unloaded', {
                detail: { fleetId: fleet.id, cargo: { ...fleet.cargo } }
            }));
            fleet.cargo = { iron: 0, crystal: 0, gas: 0 };
        }

        if (fleet.targetResourceId) {
            const resourceField = this.gridManager.getResourceField(fleet.targetResourceId);
            if (resourceField && !resourceField.isDepleted) {
                const base = this._getBaseById(fleet.homeBaseId);
                if (base) {
                    fleet.path = this.calculatePath(base.x, base.y, resourceField.x, resourceField.y);
                    fleet.pathIndex = 0;
                    fleet.state = FleetState.MOVING_TO_TARGET;
                    this.eventTarget.dispatchEvent(new CustomEvent('fleet:stateChanged', { detail: fleet }));
                    return;
                }
            }
        }

        fleet.state = FleetState.IDLE;
        fleet.targetResourceId = undefined;
        this.eventTarget.dispatchEvent(new CustomEvent('fleet:stateChanged', { detail: fleet }));
    }

    private _getBaseById(baseId: string): any {
        return null;
    }

    private _resolveCombat(fleet: Fleet): void {
        if (!fleet.combatLog) {
            fleet.state = FleetState.IDLE;
            return;
        }

        const pirate: PirateFleet = fleet.combatLog.pirate;
        const totalFirepower = fleet.ships.filter(s => s.isAlive()).reduce((sum, s) => sum + s.firepower, 0);
        const totalArmor = fleet.ships.filter(s => s.isAlive()).reduce((sum, s) => sum + s.armor, 0) / fleet.ships.length;

        const damageToPirate = Math.max(1, totalFirepower - pirate.armor);
        const damageToFleet = Math.max(1, pirate.firepower - totalArmor);

        pirate.hp -= damageToPirate;

        for (const ship of fleet.ships) {
            if (ship.isAlive()) {
                ship.takeDamage(damageToFleet / fleet.ships.length);
            }
        }

        if (pirate.hp <= 0) {
            const idx = this.pirates.indexOf(pirate);
            if (idx >= 0) this.pirates.splice(idx, 1);
            fleet.pirateCooldown = 5;

            if (fleet.path.length > 0 && fleet.pathIndex < fleet.path.length) {
                fleet.state = FleetState.MOVING_TO_TARGET;
            } else if (fleet.targetResourceId) {
                fleet.state = FleetState.HARVESTING;
            } else {
                fleet.state = FleetState.RETURNING;
            }
        } else {
            const lossRatio = 0.2 + Math.random() * 0.3;
            fleet.cargo.iron = Math.floor(fleet.cargo.iron * (1 - lossRatio));
            fleet.cargo.crystal = Math.floor(fleet.cargo.crystal * (1 - lossRatio));
            fleet.cargo.gas = Math.floor(fleet.cargo.gas * (1 - lossRatio));
            fleet.pirateCooldown = 5;
            this._returnToBase(fleet);
        }

        fleet.combatLog = undefined;
        this.eventTarget.dispatchEvent(new CustomEvent('fleet:stateChanged', { detail: fleet }));
    }

    calculatePath(fromX: number, fromY: number, toX: number, toY: number): { x: number; y: number }[] {
        const sx = Math.round(fromX);
        const sy = Math.round(fromY);
        const tx = Math.round(toX);
        const ty = Math.round(toY);

        if (sx === tx && sy === ty) {
            return [{ x: toX, y: toY }];
        }

        const path = this.aStarSearch(sx, sy, tx, ty);
        if (!path || path.length === 0) {
            return [{ x: toX, y: toY }];
        }

        const simplified = this._simplifyPath(path);
        if (simplified.length > 0) {
            simplified[simplified.length - 1] = { x: toX, y: toY };
        }
        return simplified;
    }

    private _simplifyPath(path: { x: number; y: number }[]): { x: number; y: number }[] {
        if (path.length <= 2) return path.slice();

        const result: { x: number; y: number }[] = [path[0]];
        let lastDirection: { x: number; y: number } | null = null;

        for (let i = 1; i < path.length; i++) {
            const prev = result[result.length - 1];
            const curr = path[i];
            const dx = curr.x - prev.x;
            const dy = curr.y - prev.y;
            const len = Math.sqrt(dx * dx + dy * dy);
            if (len === 0) continue;

            const dir = { x: dx / len, y: dy / len };

            if (!lastDirection || Math.abs(dir.x - lastDirection.x) > 0.01 || Math.abs(dir.y - lastDirection.y) > 0.01) {
                if (i !== path.length - 1) {
                    result.push(curr);
                }
                lastDirection = dir;
            }
        }

        result.push(path[path.length - 1]);
        return result;
    }

    getFleetPosition(fleet: Fleet): { x: number; y: number } {
        if (fleet.ships.length === 0) {
            return { x: 0, y: 0 };
        }
        if (fleet.ships.length === 1) {
            return { x: fleet.ships[0].x, y: fleet.ships[0].y };
        }
        let sumX = 0;
        let sumY = 0;
        let count = 0;
        for (const ship of fleet.ships) {
            if (ship.isAlive()) {
                sumX += ship.x;
                sumY += ship.y;
                count++;
            }
        }
        if (count === 0) {
            return { x: fleet.ships[0].x, y: fleet.ships[0].y };
        }
        return { x: sumX / count, y: sumY / count };
    }

    getTotalCargo(fleet: Fleet): number {
        return fleet.cargo.iron + fleet.cargo.crystal + fleet.cargo.gas;
    }

    activeFleetCount(): number {
        return this.fleets.filter(f => f.state !== FleetState.IDLE).length;
    }

    private aStarSearch(sx: number, sy: number, tx: number, ty: number): { x: number; y: number }[] | null {
        const open: Map<string, AStarNode> = new Map();
        const closed: Set<string> = new Set();

        const start: AStarNode = {
            x: sx,
            y: sy,
            g: 0,
            h: this.heuristic(sx, sy, tx, ty),
            f: 0,
            parent: null
        };
        start.f = start.g + start.h;
        open.set(`${sx},${sy}`, start);

        const directions = [
            { dx: 1, dy: 0, cost: 1 },
            { dx: -1, dy: 0, cost: 1 },
            { dx: 0, dy: 1, cost: 1 },
            { dx: 0, dy: -1, cost: 1 },
            { dx: 1, dy: 1, cost: 1.414 },
            { dx: 1, dy: -1, cost: 1.414 },
            { dx: -1, dy: 1, cost: 1.414 },
            { dx: -1, dy: -1, cost: 1.414 }
        ];

        while (open.size > 0) {
            let current: AStarNode | null = null;
            for (const node of open.values()) {
                if (!current || node.f < current.f) {
                    current = node;
                }
            }

            if (!current) break;

            if (current.x === tx && current.y === ty) {
                const path: { x: number; y: number }[] = [];
                let node: AStarNode | null = current;
                while (node) {
                    path.push({ x: node.x, y: node.y });
                    node = node.parent;
                }
                path.reverse();
                return path;
            }

            open.delete(`${current.x},${current.y}`);
            closed.add(`${current.x},${current.y}`);

            for (const dir of directions) {
                const nx = current.x + dir.dx;
                const ny = current.y + dir.dy;
                const key = `${nx},${ny}`;

                if (closed.has(key)) continue;
                if (!this.gridManager.isWalkable(nx, ny)) continue;

                const tentativeG = current.g + dir.cost;
                const existing = open.get(key);

                if (!existing) {
                    const neighbor: AStarNode = {
                        x: nx,
                        y: ny,
                        g: tentativeG,
                        h: this.heuristic(nx, ny, tx, ty),
                        f: 0,
                        parent: current
                    };
                    neighbor.f = neighbor.g + neighbor.h;
                    open.set(key, neighbor);
                } else if (tentativeG < existing.g) {
                    existing.g = tentativeG;
                    existing.f = existing.g + existing.h;
                    existing.parent = current;
                }
            }
        }

        return null;
    }

    private heuristic(x1: number, y1: number, x2: number, y2: number): number {
        const dx = Math.abs(x1 - x2);
        const dy = Math.abs(y1 - y2);
        return 1.414 * Math.min(dx, dy) + Math.abs(dx - dy);
    }

    private spawnPirateNear(x: number, y: number): PirateFleet {
        const angle = Math.random() * Math.PI * 2;
        const distance = 3 + Math.random() * 2;
        return {
            id: `pirate_${this.nextId++}`,
            x: x + Math.cos(angle) * distance,
            y: y + Math.sin(angle) * distance,
            firepower: 30 + Math.floor(Math.random() * 40),
            armor: 2 + Math.floor(Math.random() * 5),
            hp: 80 + Math.floor(Math.random() * 60),
            maxHp: 80 + Math.floor(Math.random() * 60)
        };
    }
}
