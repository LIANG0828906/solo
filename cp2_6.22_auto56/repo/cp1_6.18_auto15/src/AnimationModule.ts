import { applyDamageAndCheckWin, useGameState } from './GameState';
import { ELEMENT_CONFIGS, type Animation, type ElementType, type Piece } from './entities';
import { EventBus, type EventName } from './EventBus';

const generateId = (): string =>
  Math.random().toString(36).substring(2, 11) + Date.now().toString(36);

export interface Particle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  life: number;
  maxLife: number;
  shape: 'circle' | 'fire' | 'ice' | 'wind' | 'rock';
}

export interface BoardParticles {
  particles: Particle[];
}

class AnimationController {
  private rafId: number | null = null;
  private particles: Map<string, Particle[]> = new Map();
  private activeAttacks: Map<string, { progress: number; duration: number }> = new Map();

  start() {
    if (this.rafId !== null) return;
    this.loop();
  }

  stop() {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  private loop = () => {
    this.updateParticles();
    this.updateAttackAnimations();
    this.rafId = requestAnimationFrame(this.loop);
  };

  private updateParticles() {
    const toRemove: string[] = [];
    this.particles.forEach((particleList, key) => {
      const alive: Particle[] = [];
      particleList.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.08;
        p.life -= 1;
        if (p.life > 0) alive.push(p);
      });
      if (alive.length === 0) {
        toRemove.push(key);
      } else {
        this.particles.set(key, alive);
      }
    });
    toRemove.forEach((key) => this.particles.delete(key));
  }

  private updateAttackAnimations() {
    const done: string[] = [];
    this.activeAttacks.forEach((attack, key) => {
      attack.progress += 16;
      if (attack.progress >= attack.duration) {
        done.push(key);
      }
    });

    done.forEach((key) => {
      this.activeAttacks.delete(key);
    });
  }

  getParticles(key: string): Particle[] {
    return this.particles.get(key) || [];
  }

  getAllParticles(): BoardParticles {
    const all: Particle[] = [];
    this.particles.forEach((list) => all.push(...list));
    return { particles: all };
  }

  playAttackAnimation(attacker: Piece, target: Piece) {
    const animId = generateId();
    const state = useGameState.getState();

    const animation: Animation = {
      id: animId,
      type: 'attack',
      payload: {
        attackerId: attacker.id,
        targetId: target.id,
        from: attacker.position,
        to: target.position,
        element: attacker.element,
      },
    };
    state.addAnimation(animation);

    this.spawnAttackParticles(attacker, target);
    this.activeAttacks.set(animId, { progress: 0, duration: 500 });

    setTimeout(() => {
      this.playHitAnimation(target, attacker.element);
    }, 300);

    setTimeout(() => {
      const result = applyDamageAndCheckWin(attacker.id, target.id);

      EventBus.emit('ANIMATION_COMPLETE' as EventName, {
        animationType: 'attack',
        attackerId: attacker.id,
        targetId: target.id,
      } as never);

      useGameState.getState().removeAnimation(animId);

      if (!result.winner) {
        setTimeout(() => {
          useGameState.getState().endTurn();
        }, 300);
      }
    }, 600);
  }

  playHitAnimation(target: Piece, _element: ElementType) {
    const animId = generateId();
    const state = useGameState.getState();

    const animation: Animation = {
      id: animId,
      type: 'hit',
      payload: { targetId: target.id },
    };
    state.addAnimation(animation);
    state.setHitPiece(target.id, true);

    this.spawnHitParticles(target);

    setTimeout(() => {
      useGameState.getState().setHitPiece(target.id, false);
      useGameState.getState().removeAnimation(animId);
    }, 200);
  }

  playVictoryAnimation(winner: number) {
    const animId = generateId();
    const state = useGameState.getState();
    const animation: Animation = {
      id: animId,
      type: 'victory',
      payload: { winner },
    };
    state.addAnimation(animation);
  }

  spawnBoardEdgeParticles(element: ElementType) {
    const config = ELEMENT_CONFIGS[element];
    const particleList: Particle[] = [];
    const count = 20;
    const boardPixels = 8 * 80;

    for (let i = 0; i < count; i++) {
      const side = Math.floor(Math.random() * 4);
      let x: number, y: number, vx: number, vy: number;

      switch (side) {
        case 0:
          x = Math.random() * boardPixels;
          y = 0;
          vx = (Math.random() - 0.5) * 2;
          vy = Math.random() * 2 + 1;
          break;
        case 1:
          x = boardPixels;
          y = Math.random() * boardPixels;
          vx = -(Math.random() * 2 + 1);
          vy = (Math.random() - 0.5) * 2;
          break;
        case 2:
          x = Math.random() * boardPixels;
          y = boardPixels;
          vx = (Math.random() - 0.5) * 2;
          vy = -(Math.random() * 2 + 1);
          break;
        default:
          x = 0;
          y = Math.random() * boardPixels;
          vx = Math.random() * 2 + 1;
          vy = (Math.random() - 0.5) * 2;
      }

      particleList.push({
        id: generateId(),
        x,
        y,
        vx,
        vy,
        size: 3 + Math.random() * 3,
        color: config.particleColor,
        life: 48,
        maxLife: 48,
        shape: 'circle',
      });
    }

    this.particles.set('edge-' + generateId(), particleList);
  }

  private spawnAttackParticles(attacker: Piece, target: Piece) {
    const config = ELEMENT_CONFIGS[attacker.element];
    const particleList: Particle[] = [];
    const count = 15;

    const fromX = attacker.position.x * 80 + 40;
    const fromY = attacker.position.y * 80 + 40;
    const toX = target.position.x * 80 + 40;
    const toY = target.position.y * 80 + 40;

    const shapeMap: Record<ElementType, Particle['shape']> = {
      fire: 'fire',
      ice: 'ice',
      wind: 'wind',
      earth: 'rock',
    };

    for (let i = 0; i < count; i++) {
      const t = i / count;
      particleList.push({
        id: generateId(),
        x: fromX + (toX - fromX) * t + (Math.random() - 0.5) * 10,
        y: fromY + (toY - fromY) * t + (Math.random() - 0.5) * 10,
        vx: (toX - fromX) * 0.02 + (Math.random() - 0.5) * 1,
        vy: (toY - fromY) * 0.02 + (Math.random() - 0.5) * 1 - 0.5,
        size: 5 + Math.random() * 6,
        color: config.particleColor,
        life: 30 + Math.floor(Math.random() * 15),
        maxLife: 45,
        shape: shapeMap[attacker.element],
      });
    }

    this.particles.set('attack-' + generateId(), particleList);
  }

  private spawnHitParticles(target: Piece) {
    const config = ELEMENT_CONFIGS[target.element];
    const particleList: Particle[] = [];
    const count = 12;
    const cx = target.position.x * 80 + 40;
    const cy = target.position.y * 80 + 40;

    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.3;
      const speed = 2 + Math.random() * 2;
      particleList.push({
        id: generateId(),
        x: cx,
        y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 4 + Math.random() * 4,
        color: config.particleColor,
        life: 25 + Math.floor(Math.random() * 10),
        maxLife: 35,
        shape: 'circle',
      });
    }

    this.particles.set('hit-' + generateId(), particleList);
  }
}

export const AnimationModule = new AnimationController();
