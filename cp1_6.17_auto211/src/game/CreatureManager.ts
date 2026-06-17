import { useGameStore } from '../state/StateManager';
import type { Plankton, Predator, Decoy } from '../types';
import { PlayerController } from './PlayerController';
import { clamp, dist, randomRange } from '../utils/noise';

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const PLANKTON_COLORS = ['#00FF88', '#88FFAA', '#AAFFCC'];
const PLANKTON_WANDER_RADIUS = 40;
const PLANKTON_BASE_SPEED = 20;
const PREDATOR_RADIUS = 36;
const PREDATOR_DETECT_RADIUS = 300;
const PREDATOR_CHASE_SPEED = 200;
const PREDATOR_RETREAT_SPEED = 80;
const PREDATOR_RESPAWN_INTERVAL = 20000;
const DECOY_LIFETIME = 3000;
const DECOY_RADIUS = 20;
const DOUBLE_SCORE_DURATION = 13000;
const SPATIAL_GRID_SIZE = 40;

interface SpatialHash {
  [key: string]: number[];
}

let planktonIdCounter = 0;
let predatorIdCounter = 0;

export class CreatureManager {
  private lastPredatorRespawn: number = 0;

  init(count: number = 100, predatorCount: number = 3) {
    this.spawnPlanktons(count);
    this.spawnPredators(predatorCount);
    this.lastPredatorRespawn = Date.now();
  }

  private spawnPlanktons(count: number) {
    const store = useGameStore.getState();
    const planktons: Plankton[] = [];
    const margin = 50;

    for (let i = 0; i < count; i++) {
      const x = randomRange(margin, CANVAS_WIDTH - margin);
      const y = randomRange(margin, CANVAS_HEIGHT - margin);
      planktons.push({
        id: ++planktonIdCounter,
        position: { x, y },
        velocity: { x: 0, y: 0 },
        radius: randomRange(4, 6),
        color: PLANKTON_COLORS[Math.floor(Math.random() * PLANKTON_COLORS.length)],
        basePosition: { x, y },
        wanderRadius: PLANKTON_WANDER_RADIUS,
        wanderAngle: Math.random() * Math.PI * 2,
      });
    }

    store.setPlanktons(planktons);
  }

  private spawnPredators(count: number) {
    const store = useGameStore.getState();
    const predators: Predator[] = [];
    const margin = 100;

    for (let i = 0; i < count; i++) {
      let x: number, y: number;
      do {
        x = randomRange(margin, CANVAS_WIDTH - margin);
        y = randomRange(margin, CANVAS_HEIGHT - margin);
      } while (dist(x, y, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2) < 200);

      predators.push({
        id: ++predatorIdCounter,
        position: { x, y },
        velocity: { x: 0, y: 0 },
        radius: PREDATOR_RADIUS,
        speedMultiplier: 1.0,
        respawnTime: Date.now() + PREDATOR_RESPAWN_INTERVAL,
        isRetreating: false,
        retreatEnd: 0,
      });
    }

    store.setPredators(predators);
  }

  update(deltaTime: number, currentTime: number) {
    const store = useGameStore.getState();
    if (store.game.phase !== 'playing') return;

    const difficultyLevel = store.game.difficultyLevel;
    const planktonCountMultiplier = Math.max(0.7, 1 - difficultyLevel * 0.1);
    const predatorSpeedMultiplier = Math.min(1.6, 1 + difficultyLevel * 0.1);
    const tideMultiplier = store.game.tideActive ? 1.5 : 1.0;

    this.updatePlanktons(deltaTime * tideMultiplier, planktonCountMultiplier);
    this.updatePredators(deltaTime * tideMultiplier, predatorSpeedMultiplier, currentTime);
    this.updateDecoys(currentTime);
    this.checkCollisions();
    this.managePredatorRespawn(currentTime);
    this.maintainPlanktonCount(planktonCountMultiplier);
  }

  private updatePlanktons(deltaTime: number, countMultiplier: number) {
    const store = useGameStore.getState();
    const player = store.player;
    const planktons = store.planktons;
    const decoys = store.decoys;
    const attractionRadius = PlayerController.getGlowAttractionRadius();
    const playerRadius = PlayerController.getPlayerRadius(player.size);
    const speed = PLANKTON_BASE_SPEED;

    const updatedPlanktons = planktons.map((p) => {
      let targetX = p.basePosition.x;
      let targetY = p.basePosition.y;
      let fleeX = 0;
      let fleeY = 0;

      p.wanderAngle += (Math.random() - 0.5) * 0.2;
      targetX = p.basePosition.x + Math.cos(p.wanderAngle) * p.wanderRadius;
      targetY = p.basePosition.y + Math.sin(p.wanderAngle) * p.wanderRadius;

      if (player.isGlowing) {
        const dx = player.position.x - p.position.x;
        const dy = player.position.y - p.position.y;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < attractionRadius && d > 0) {
          targetX = player.position.x;
          targetY = player.position.y;
        }
      }

      for (const decoy of decoys) {
        const dx = decoy.position.x - p.position.x;
        const dy = decoy.position.y - p.position.y;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < 150 && d > 0) {
          targetX = decoy.position.x;
          targetY = decoy.position.y;
          break;
        }
      }

      for (const pred of store.predators) {
        const dx = p.position.x - pred.position.x;
        const dy = p.position.y - pred.position.y;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < 80 && d > 0) {
          fleeX += (dx / d) * 2;
          fleeY += (dy / d) * 2;
        }
      }

      let dx = targetX - p.position.x + fleeX * 50;
      let dy = targetY - p.position.y + fleeY * 50;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d > 0) {
        dx /= d;
        dy /= d;
      }

      const newX = clamp(p.position.x + dx * speed * deltaTime, p.radius, CANVAS_WIDTH - p.radius);
      const newY = clamp(p.position.y + dy * speed * deltaTime, p.radius, CANVAS_HEIGHT - p.radius);

      const baseDx = newX - p.basePosition.x;
      const baseDy = newY - p.basePosition.y;
      const baseDist = Math.sqrt(baseDx * baseDx + baseDy * baseDy);
      if (baseDist > p.wanderRadius * 2) {
        p.basePosition.x = newX;
        p.basePosition.y = newY;
      }

      return {
        ...p,
        position: { x: newX, y: newY },
        velocity: { x: dx * speed, y: dy * speed },
      };
    });

    store.setPlanktons(updatedPlanktons);
  }

  private updatePredators(
    deltaTime: number,
    speedMultiplier: number,
    currentTime: number
  ) {
    const store = useGameStore.getState();
    const player = store.player;
    const predators = store.predators;

    const updatedPredators = predators.map((pred) => {
      const dx = player.position.x - pred.position.x;
      const dy = player.position.y - pred.position.y;
      const d = Math.sqrt(dx * dx + dy * dy);

      let speed: number;
      let moveX = 0;
      let moveY = 0;

      if (pred.isRetreating && currentTime < pred.retreatEnd) {
        speed = PREDATOR_RETREAT_SPEED * speedMultiplier;
        if (d > 0) {
          moveX = -dx / d;
          moveY = -dy / d;
        }
      } else if (player.isGlowing) {
        speed = PREDATOR_RETREAT_SPEED * speedMultiplier;
        if (d > 0) {
          moveX = -dx / d;
          moveY = -dy / d;
        }
      } else if (d < PREDATOR_DETECT_RADIUS) {
        speed = PREDATOR_CHASE_SPEED * speedMultiplier;
        if (d > 0) {
          moveX = dx / d;
          moveY = dy / d;
        }
      } else {
        speed = 60 * speedMultiplier;
        const angle = Math.sin(currentTime * 0.001 + pred.id) * Math.PI;
        moveX = Math.cos(angle);
        moveY = Math.sin(angle);
      }

      const newX = clamp(
        pred.position.x + moveX * speed * deltaTime,
        pred.radius,
        CANVAS_WIDTH - pred.radius
      );
      const newY = clamp(
        pred.position.y + moveY * speed * deltaTime,
        pred.radius,
        CANVAS_HEIGHT - pred.radius
      );

      return {
        ...pred,
        position: { x: newX, y: newY },
        velocity: { x: moveX * speed, y: moveY * speed },
        isRetreating: pred.isRetreating && currentTime < pred.retreatEnd,
      };
    });

    store.setPredators(updatedPredators);
  }

  private updateDecoys(currentTime: number) {
    const store = useGameStore.getState();
    const decoys = store.decoys;
    const player = store.player;

    const remaining: Decoy[] = [];
    for (const decoy of decoys) {
      if (currentTime > decoy.expireTime) continue;

      const d = dist(
        player.position.x,
        player.position.y,
        decoy.position.x,
        decoy.position.y
      );
      const playerRadius = PlayerController.getPlayerRadius(player.size);

      if (d < playerRadius + decoy.radius) {
        store.setDoubleScore(DOUBLE_SCORE_DURATION);
        store.addFloatingText({
          id: 0,
          position: { ...decoy.position },
          text: '双倍得分!',
          color: '#FF8800',
          alpha: 1,
          life: 1500,
          maxLife: 1500,
        });
        continue;
      }

      remaining.push(decoy);
    }

    if (remaining.length !== decoys.length) {
      useGameStore.setState({ decoys: remaining });
    }
  }

  private buildSpatialHash(): SpatialHash {
    const store = useGameStore.getState();
    const hash: SpatialHash = {};

    store.planktons.forEach((p) => {
      const cellX = Math.floor(p.position.x / SPATIAL_GRID_SIZE);
      const cellY = Math.floor(p.position.y / SPATIAL_GRID_SIZE);
      const key = `${cellX},${cellY}`;
      if (!hash[key]) hash[key] = [];
      hash[key].push(p.id);
    });

    return hash;
  }

  private checkCollisions() {
    const store = useGameStore.getState();
    const player = store.player;
    const planktons = store.planktons;
    const predators = store.predators;
    const playerRadius = PlayerController.getPlayerRadius(player.size);

    const hash = this.buildSpatialHash();
    const cellX = Math.floor(player.position.x / SPATIAL_GRID_SIZE);
    const cellY = Math.floor(player.position.y / SPATIAL_GRID_SIZE);

    const nearbyIds: Set<number> = new Set();
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        const key = `${cellX + dx},${cellY + dy}`;
        if (hash[key]) {
          hash[key].forEach((id) => nearbyIds.add(id));
        }
      }
    }

    const collectedIds: number[] = [];
    for (const id of nearbyIds) {
      const p = planktons.find((pl) => pl.id === id);
      if (!p) continue;

      const d = dist(player.position.x, player.position.y, p.position.x, p.position.y);
      if (d < playerRadius + p.radius) {
        collectedIds.push(id);
        store.incrementCombo();
        const isComboBonus = store.player.combo > 0 && store.player.combo % 5 === 0;
        const points = isComboBonus ? 20 : 10;
        store.addScore(points);
        store.growPlayer();
        store.incrementTotalCollected();
        if (player.health === player.maxHealth) {
          store.addShield();
        }

        store.addFloatingText({
          id: 0,
          position: { x: p.position.x, y: p.position.y - 10 },
          text: isComboBonus ? '+20' : '+10',
          color: '#FFFFFF',
          alpha: 1,
          life: 1200,
          maxLife: 1200,
        });

        store.emit('planktonCollected', { position: p.position, comboBonus: isComboBonus });
      }
    }

    if (collectedIds.length > 0) {
      useGameStore.setState((state) => ({
        planktons: state.planktons.filter((p) => !collectedIds.includes(p.id)),
      }));
    }

    for (const pred of predators) {
      const d = dist(player.position.x, player.position.y, pred.position.x, pred.position.y);
      if (d < playerRadius + pred.radius) {
        if (!player.isInvincible) {
          store.damagePlayer();
        }
        if (player.isGlowing) {
          store.updatePredator(pred.id, {
            isRetreating: true,
            retreatEnd: Date.now() + 3000,
          });
        }
      }
    }
  }

  private managePredatorRespawn(currentTime: number) {
    const store = useGameStore.getState();
    const difficultyLevel = store.game.difficultyLevel;
    const maxPredators = Math.min(5, 3 + difficultyLevel);

    if (currentTime - this.lastPredatorRespawn > PREDATOR_RESPAWN_INTERVAL) {
      this.lastPredatorRespawn = currentTime;

      if (store.predators.length < maxPredators) {
        const margin = 100;
        let x: number, y: number;
        do {
          x = randomRange(margin, CANVAS_WIDTH - margin);
          y = randomRange(margin, CANVAS_HEIGHT - margin);
        } while (dist(x, y, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2) < 200);

        const deadPredator = store.predators.find(
          (p) => currentTime > p.respawnTime
        );

        if (deadPredator) {
          store.addDecoy({
            id: 0,
            position: { ...deadPredator.position },
            radius: DECOY_RADIUS,
            expireTime: currentTime + DECOY_LIFETIME,
          });
          store.removePredator(deadPredator.id);
        }

        store.setPredators([
          ...store.predators,
          {
            id: ++predatorIdCounter,
            position: { x, y },
            velocity: { x: 0, y: 0 },
            radius: PREDATOR_RADIUS,
            speedMultiplier: 1.0,
            respawnTime: currentTime + PREDATOR_RESPAWN_INTERVAL,
            isRetreating: false,
            retreatEnd: 0,
          },
        ]);
      }
    }
  }

  private maintainPlanktonCount(countMultiplier: number) {
    const store = useGameStore.getState();
    const targetCount = Math.floor(100 * countMultiplier);

    while (store.planktons.length < targetCount) {
      const margin = 50;
      const x = randomRange(margin, CANVAS_WIDTH - margin);
      const y = randomRange(margin, CANVAS_HEIGHT - margin);
      store.setPlanktons([
        ...store.planktons,
        {
          id: ++planktonIdCounter,
          position: { x, y },
          velocity: { x: 0, y: 0 },
          radius: randomRange(4, 6),
          color: PLANKTON_COLORS[Math.floor(Math.random() * PLANKTON_COLORS.length)],
          basePosition: { x, y },
          wanderRadius: PLANKTON_WANDER_RADIUS,
          wanderAngle: Math.random() * Math.PI * 2,
        },
      ]);
    }
  }
}
