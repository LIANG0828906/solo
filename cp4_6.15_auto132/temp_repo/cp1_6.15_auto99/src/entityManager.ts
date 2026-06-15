import { Vector2, Projectile, Fragment, AABB, PhysicsEngine } from './physicsEngine';
import { StructureType, Structure, Particle } from './gameState';

interface ProjectileWithMetadata extends Projectile {
    type: string;
    isEnemy: boolean;
}

interface EntitiesCollection {
    projectiles: ProjectileWithMetadata[];
    particles: Particle[];
    fragments: Fragment[];
}

export class EntityManager {
    private particlePool: Particle[] = [];
    private fragmentPool: Fragment[] = [];
    private readonly maxPoolSize: number = 200;

    public getPooledParticle(): Particle {
        if (this.particlePool.length > 0) {
            return this.particlePool.pop()!;
        }
        return {
            position: { x: 0, y: 0 },
            velocity: { x: 0, y: 0 },
            color: '#FFFFFF',
            life: 0,
            maxLife: 0,
            size: 0,
        };
    }

    public getPooledFragment(): Fragment {
        if (this.fragmentPool.length > 0) {
            return this.fragmentPool.pop()!;
        }
        return {
            position: { x: 0, y: 0 },
            velocity: { x: 0, y: 0 },
            rotation: 0,
            angularVelocity: 0,
            mass: 0,
        };
    }

    public returnParticle(p: Particle): void {
        if (this.particlePool.length < this.maxPoolSize) {
            p.life = 0;
            this.particlePool.push(p);
        }
    }

    public returnFragment(f: Fragment): void {
        if (this.fragmentPool.length < this.maxPoolSize) {
            f.mass = 0;
            this.fragmentPool.push(f);
        }
    }

    public createStructure(type: StructureType, position: Vector2, isPlayer: boolean): Structure {
        const healthConfig: Record<StructureType, number> = {
            wall: 100,
            fence: 50,
            sandbag: 75,
        };
        const maxHealth: number = healthConfig[type];
        return {
            id: `${isPlayer ? 'player' : 'enemy'}-${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            type,
            position: { ...position },
            health: maxHealth,
            maxHealth,
            scale: 0.5,
            isPlayer,
            placementProgress: 0,
        };
    }

    public createProjectile(
        position: Vector2,
        velocity: Vector2,
        type: string,
        isEnemy: boolean
    ): ProjectileWithMetadata {
        return {
            position: { ...position },
            velocity: { ...velocity },
            radius: 8,
            type,
            isEnemy,
        };
    }

    public createExplosion(position: Vector2, radius: number): Particle[] {
        const particles: Particle[] = [];
        const count: number = Math.floor(Math.random() * 11) + 20;
        const colors: string[] = ['#FF6B35', '#FFD93D', '#FF4444'];

        for (let i: number = 0; i < count; i++) {
            const angle: number = Math.random() * Math.PI * 2;
            const speed: number = Math.random() * radius * 0.5 + radius * 0.5;
            const particle: Particle = this.getPooledParticle();

            particle.position = { ...position };
            particle.velocity = {
                x: Math.cos(angle) * speed,
                y: Math.sin(angle) * speed,
            };
            particle.color = colors[Math.floor(Math.random() * colors.length)];
            particle.life = 0.6;
            particle.maxLife = 0.6;
            particle.size = Math.random() * 5 + 3;

            particles.push(particle);
        }

        return particles;
    }

    public createFragmentsFromStructure(structure: Structure): Fragment[] {
        const fragments: Fragment[] = [];
        let count: number;
        let minMass: number;
        let maxMass: number;

        switch (structure.type) {
            case 'wall':
                count = 3;
                minMass = 2;
                maxMass = 4;
                break;
            case 'fence':
                count = 2;
                minMass = 1;
                maxMass = 2;
                break;
            case 'sandbag':
                count = Math.floor(Math.random() * 3) + 4;
                minMass = 0.5;
                maxMass = 1;
                break;
            default:
                count = 2;
                minMass = 1;
                maxMass = 2;
        }

        for (let i: number = 0; i < count; i++) {
            const angle: number = Math.random() * Math.PI * 2;
            const speed: number = Math.random() * 3 + 2;
            const fragment: Fragment = this.getPooledFragment();

            fragment.position = { ...structure.position };
            fragment.velocity = {
                x: Math.cos(angle) * speed,
                y: Math.sin(angle) * speed,
            };
            fragment.rotation = Math.random() * Math.PI * 2;
            fragment.angularVelocity = (Math.random() - 0.5) * 4;
            fragment.mass = Math.random() * (maxMass - minMass) + minMass;

            fragments.push(fragment);
        }

        return fragments;
    }

    public getStructureAABB(structure: Structure): AABB {
        let width: number;
        let height: number;

        switch (structure.type) {
            case 'wall':
                width = 60;
                height = 80;
                break;
            case 'fence':
                width = 50;
                height = 60;
                break;
            case 'sandbag':
                width = 40;
                height = 30;
                break;
            default:
                width = 50;
                height = 50;
        }

        const halfWidth: number = width / 2;
        const halfHeight: number = height / 2;

        return {
            min: {
                x: structure.position.x - halfWidth,
                y: structure.position.y - halfHeight,
            },
            max: {
                x: structure.position.x + halfWidth,
                y: structure.position.y + halfHeight,
            },
        };
    }

    public updateAll(
        entities: EntitiesCollection,
        deltaTime: number,
        physics: typeof PhysicsEngine
    ): void {
        for (const projectile of entities.projectiles) {
            physics.updateProjectile(projectile, deltaTime);
        }

        for (const particle of entities.particles) {
            particle.position.x += particle.velocity.x * deltaTime;
            particle.position.y += particle.velocity.y * deltaTime;
            particle.velocity.y += physics.GRAVITY * deltaTime * 0.5;
            particle.life -= deltaTime;
        }

        for (const fragment of entities.fragments) {
            physics.updateFragment(fragment, deltaTime);
        }
    }

    public cleanup(entities: EntitiesCollection): void {
        const deadParticles: Particle[] = entities.particles.filter(
            (p: Particle): boolean => p.life <= 0 || p.position.y > 1000
        );
        entities.particles = entities.particles.filter(
            (p: Particle): boolean => p.life > 0 && p.position.y <= 1000
        );
        for (const p of deadParticles) {
            this.returnParticle(p);
        }

        const deadFragments: Fragment[] = entities.fragments.filter(
            (f: Fragment): boolean => f.position.y > 1000
        );
        entities.fragments = entities.fragments.filter(
            (f: Fragment): boolean => f.position.y <= 1000
        );
        for (const f of deadFragments) {
            this.returnFragment(f);
        }
    }
}
