import { AtomManager } from '@/managers/AtomManager';
import { EventDispatcher } from '@/managers/EventDispatcher';
import { BondRules } from './BondRules';
import { Vector2, CollisionParticle, EnergyRipple, AtomType } from '@/types';

export class PhysicsEngine {
  private atomManager: AtomManager;
  private eventDispatcher: EventDispatcher;
  private bondRules: BondRules;
  private gravity: number = 0;
  private friction: number = 0;

  constructor(atomManager: AtomManager, eventDispatcher: EventDispatcher) {
    this.atomManager = atomManager;
    this.eventDispatcher = eventDispatcher;
    this.bondRules = new BondRules();
  }

  public update(deltaTime: number): void {
    const atoms = this.atomManager.getAllAtoms();
    const bounds = this.atomManager.getCanvasBounds();

    for (const atom of atoms) {
      if (atom.isDragging) continue;

      atom.velocity.y += this.gravity * deltaTime;
      atom.velocity.x *= 1 - this.friction * deltaTime;
      atom.velocity.y *= 1 - this.friction * deltaTime;

      atom.position.x += atom.velocity.x;
      atom.position.y += atom.velocity.y;

      if (atom.position.x - atom.radius < 0) {
        atom.position.x = atom.radius;
        atom.velocity.x = Math.abs(atom.velocity.x) * 0.9;
      }
      if (atom.position.x + atom.radius > bounds.width) {
        atom.position.x = bounds.width - atom.radius;
        atom.velocity.x = -Math.abs(atom.velocity.x) * 0.9;
      }
      if (atom.position.y - atom.radius < 0) {
        atom.position.y = atom.radius;
        atom.velocity.y = Math.abs(atom.velocity.y) * 0.9;
      }
      if (atom.position.y + atom.radius > bounds.height) {
        atom.position.y = bounds.height - atom.radius;
        atom.velocity.y = -Math.abs(atom.velocity.y) * 0.9;
      }
    }

    this.checkCollisionsAndBonds(atoms);
    this.atomManager.enforceBondConstraints(this.bondRules);
    this.eventDispatcher.processEvents();
  }

  private checkCollisionsAndBonds(atoms: ReturnType<AtomManager['getAllAtoms']>): void {
    const now = performance.now();

    for (let i = 0; i < atoms.length; i++) {
      for (let j = i + 1; j < atoms.length; j++) {
        const atom1 = atoms[i];
        const atom2 = atoms[j];

        if (atom1.isDragging || atom2.isDragging) continue;

        const dx = atom2.position.x - atom1.position.x;
        const dy = atom2.position.y - atom1.position.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const minDist = atom1.radius + atom2.radius;

        if (dist < minDist && dist > 0) {
          this.resolveCollision(atom1, atom2, dx, dy, dist);
          this.dispatchCollisionEvent(atom1, atom2, dx, dy, dist);
        }

        const isBonded = atom1.bondedTo.has(atom2.id) || atom2.bondedTo.has(atom1.id);
        if (!isBonded) {
          const relVx = atom1.velocity.x - atom2.velocity.x;
          const relVy = atom1.velocity.y - atom2.velocity.y;
          const relSpeed = Math.sqrt(relVx * relVx + relVy * relVy);

          const maxBonds1 = this.bondRules.getMaxBonds(atom1.type);
          const maxBonds2 = this.bondRules.getMaxBonds(atom2.type);

          if (atom1.bondedTo.size < maxBonds1 && atom2.bondedTo.size < maxBonds2) {
            const rule = this.bondRules.findBondRule(atom1.type, atom2.type, dist, relSpeed);

            if (rule) {
              this.atomManager.createBond(atom1.id, atom2.id, rule.bondType, rule.bondEnergy);
              this.dispatchBondFormedEvent(atom1, atom2, rule.bondEnergy, rule.bondType);
            }
          }
        }
      }
    }
  }

  private resolveCollision(
    atom1: ReturnType<AtomManager['getAllAtoms']>[number],
    atom2: ReturnType<AtomManager['getAllAtoms']>[number],
    dx: number,
    dy: number,
    dist: number,
  ): void {
    const nx = dx / dist;
    const ny = dy / dist;

    const overlap = atom1.radius + atom2.radius - dist;
    const isBonded = atom1.bondedTo.has(atom2.id);

    if (!isBonded) {
      const separation = overlap / 2;
      atom1.position.x -= nx * separation;
      atom1.position.y -= ny * separation;
      atom2.position.x += nx * separation;
      atom2.position.y += ny * separation;

      const dvx = atom1.velocity.x - atom2.velocity.x;
      const dvy = atom1.velocity.y - atom2.velocity.y;
      const dvn = dvx * nx + dvy * ny;

      if (dvn > 0) {
        atom1.velocity.x -= dvn * nx;
        atom1.velocity.y -= dvn * ny;
        atom2.velocity.x += dvn * nx;
        atom2.velocity.y += dvn * ny;
      }
    } else {
      const separation = overlap * 0.3;
      atom1.position.x -= nx * separation;
      atom1.position.y -= ny * separation;
      atom2.position.x += nx * separation;
      atom2.position.y += ny * separation;
    }
  }

  private dispatchCollisionEvent(
    atom1: ReturnType<AtomManager['getAllAtoms']>[number],
    atom2: ReturnType<AtomManager['getAllAtoms']>[number],
    dx: number,
    dy: number,
    dist: number,
  ): void {
    const point: Vector2 = {
      x: atom1.position.x + (dx / dist) * atom1.radius,
      y: atom1.position.y + (dy / dist) * atom1.radius,
    };

    const isBonded = atom1.bondedTo.has(atom2.id);

    if (!isBonded) {
      this.eventDispatcher.dispatchEvent({
        type: 'collision',
        atom1Id: atom1.id,
        atom2Id: atom2.id,
        point,
        timestamp: performance.now(),
      });

      for (let p = 0; p < 3; p++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 1 + Math.random() * 2;
        const particle: CollisionParticle = {
          id: `particle_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          position: { ...point },
          velocity: {
            x: Math.cos(angle) * speed,
            y: Math.sin(angle) * speed,
          },
          size: 2,
          color: '#FFFFFF',
          lifetime: 0,
          maxLifetime: 1000,
        };
        this.eventDispatcher.dispatchParticle(particle);
      }
    }
  }

  private dispatchBondFormedEvent(
    atom1: ReturnType<AtomManager['getAllAtoms']>[number],
    atom2: ReturnType<AtomManager['getAllAtoms']>[number],
    energy: number,
    bondType: 'single' | 'double' | 'triple',
  ): void {
    const point: Vector2 = {
      x: (atom1.position.x + atom2.position.x) / 2,
      y: (atom1.position.y + atom2.position.y) / 2,
    };

    this.eventDispatcher.dispatchEvent({
      type: 'bond_formed',
      atom1Id: atom1.id,
      atom2Id: atom2.id,
      point,
      energy,
      bondType,
      timestamp: performance.now(),
    });

    const rippleColor = this.getRippleColor(bondType);
    const ripple: EnergyRipple = {
      id: `ripple_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      position: { ...point },
      maxRadius: 50,
      currentRadius: 0,
      lifetime: 0,
      maxLifetime: 500,
      color: rippleColor,
    };
    this.eventDispatcher.dispatchRipple(ripple);
  }

  private getRippleColor(bondType: 'single' | 'double' | 'triple'): string {
    switch (bondType) {
      case 'single':
        return '#4FC3F7';
      case 'double':
        return '#FFD54F';
      case 'triple':
        return '#E91E63';
      default:
        return '#FFFFFF';
    }
  }

  public getBondRules(): BondRules {
    return this.bondRules;
  }
}
