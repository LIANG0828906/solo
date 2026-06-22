import { CONFIG } from './types';
import type { GameState, Direction, Position, Chest, ChestReward } from './types';
import { GamePhase, TileType } from './types';
import { DungeonGenerator } from './DungeonGenerator';
import { Player } from './Player';
import { CombatManager } from './CombatManager';
import { Renderer } from './Renderer';

export class GameEngine {
  private state: GameState;
  private dungeonGenerator: DungeonGenerator;
  private player: Player;
  private combatManager: CombatManager;
  private renderer: Renderer;
  private animationFrameId: number | null = null;
  private lastTime: number = 0;
  private nextChestId: number = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.dungeonGenerator = new DungeonGenerator();
    this.combatManager = new CombatManager();
    this.renderer = new Renderer(canvas, this.combatManager);

    this.state = this.initializeGame();
    this.player = new Player(this.state.player.position);

    this.setupInputHandlers();
  }

  private initializeGame(): GameState {
    const dungeon = this.dungeonGenerator.generate();

    const playerRoom = dungeon.rooms[0];
    const playerPosition: Position = { x: playerRoom.centerX, y: playerRoom.centerY };

    const exitRoom = dungeon.rooms[dungeon.rooms.length - 1];
    const exitPosition: Position = { x: exitRoom.centerX, y: exitRoom.centerY };
    dungeon.tiles[exitPosition.y][exitPosition.x] = TileType.EXIT;

    const enemies = this.spawnEnemies(dungeon, playerPosition);
    const chests = this.spawnChests(dungeon, playerPosition, exitPosition);

    return {
      phase: GamePhase.PLAYING,
      dungeon,
      player: {
        position: { ...playerPosition },
        targetPosition: { ...playerPosition },
        health: CONFIG.PLAYER_MAX_HEALTH,
        maxHealth: CONFIG.PLAYER_MAX_HEALTH,
        attack: CONFIG.PLAYER_BASE_ATTACK,
        baseAttack: CONFIG.PLAYER_BASE_ATTACK,
        coins: 0,
        experience: 0,
        kills: 0,
        isMoving: false,
        moveStartTime: 0,
      },
      enemies,
      chests,
      particles: [],
      damageNumbers: [],
      stats: {
        kills: 0,
        coins: 0,
        startTime: performance.now(),
        totalTime: 0,
      },
      exitPosition,
      combatFlash: 0,
      lastInputTime: 0,
      currentEnemyInCombat: null,
      pickupMessage: null,
      pickupMessageTime: 0,
    };
  }

  private spawnEnemies(dungeon: GameState['dungeon'], playerPosition: Position): GameState['enemies'] {
    const enemies: GameState['enemies'] = [];
    const enemyCount = this.randomInt(CONFIG.ENEMY_MIN_COUNT, CONFIG.ENEMY_MAX_COUNT);
    const usedPositions: Position[] = [playerPosition];
    let nextId = 0;

    const otherRooms = dungeon.rooms.slice(1);

    for (let i = 0; i < enemyCount; i++) {
      const room = otherRooms[i % otherRooms.length];
      const pos = this.dungeonGenerator.getRandomFloorPositionInRoom(dungeon, room, usedPositions);

      if (pos) {
        enemies.push({
          id: nextId++,
          position: { ...pos },
          targetPosition: { ...pos },
          health: CONFIG.ENEMY_HEALTH,
          maxHealth: CONFIG.ENEMY_HEALTH,
          attack: CONFIG.ENEMY_ATTACK,
          isAlive: true,
          isMoving: false,
          moveStartTime: 0,
          flashStartTime: 0,
        });
        usedPositions.push(pos);
      }
    }

    return enemies;
  }

  private spawnChests(
    dungeon: GameState['dungeon'],
    playerPosition: Position,
    exitPosition: Position
  ): Chest[] {
    const chests: Chest[] = [];
    const chestCount = this.randomInt(CONFIG.CHEST_MIN_COUNT, CONFIG.CHEST_MAX_COUNT);
    const usedPositions: Position[] = [playerPosition, exitPosition];

    this.nextChestId = 0;

    for (let i = 0; i < chestCount; i++) {
      const room = this.dungeonGenerator.getRandomRoom(dungeon.rooms, [0, dungeon.rooms.length - 1]);
      const pos = this.dungeonGenerator.getRandomFloorPositionInRoom(dungeon, room, usedPositions);

      if (pos) {
        chests.push({
          id: this.nextChestId++,
          position: { ...pos },
          isOpened: false,
        });
        usedPositions.push(pos);
      }
    }

    return chests;
  }

  private setupInputHandlers(): void {
    document.addEventListener('keydown', (e) => this.handleKeyDown(e));

    const touchButtons = document.querySelectorAll('.touch-btn');
    touchButtons.forEach((btn) => {
      btn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        const dir = btn.getAttribute('data-dir');
        const action = btn.getAttribute('data-action');

        if (dir) {
          this.handleMove(dir as Direction);
        } else if (action === 'interact') {
          this.handleInteract();
        }
      });
    });
  }

  private handleKeyDown(e: KeyboardEvent): void {
    if (this.state.phase === GamePhase.VICTORY || this.state.phase === GamePhase.DEFEAT) {
      if (e.code === 'Space') {
        this.restartGame();
      }
      return;
    }

    if (this.state.phase !== GamePhase.PLAYING) return;

    let direction: Direction | null = null;

    switch (e.code) {
      case 'KeyW':
      case 'ArrowUp':
        direction = 'up';
        break;
      case 'KeyS':
      case 'ArrowDown':
        direction = 'down';
        break;
      case 'KeyA':
      case 'ArrowLeft':
        direction = 'left';
        break;
      case 'KeyD':
      case 'ArrowRight':
        direction = 'right';
        break;
      case 'KeyE':
        this.handleInteract();
        return;
    }

    if (direction) {
      e.preventDefault();
      this.handleMove(direction);
    }
  }

  private handleMove(direction: Direction): void {
    if (this.state.phase !== GamePhase.PLAYING) return;

    const currentTime = performance.now();
    const result = this.player.tryMove(
      direction,
      this.state.dungeon,
      currentTime,
      this.state.lastInputTime
    );

    if (!result.moved) {
      this.state.lastInputTime = result.newLastInputTime;
      return;
    }

    this.state.player = { ...this.player.state };
    this.state.lastInputTime = result.newLastInputTime;

    setTimeout(() => {
      this.afterPlayerMove();
    }, CONFIG.MOVE_ANIMATION_DURATION + 10);
  }

  private afterPlayerMove(): void {
    this.player.state.position = { ...this.player.state.targetPosition };
    this.player.state.isMoving = false;
    this.state.player = { ...this.player.state };

    const adjacentEnemy = this.combatManager.findAdjacentEnemy(
      this.player.state.position,
      this.state.enemies
    );

    if (adjacentEnemy) {
      this.initiateCombat(adjacentEnemy);
      return;
    }

    this.updateEnemyAI();
    this.checkGameConditions();
  }

  private initiateCombat(enemy: GameState['enemies'][0]): void {
    this.state.phase = GamePhase.COMBAT;
    this.state.currentEnemyInCombat = enemy;
    this.state.combatFlash = 1;

    const currentTime = performance.now();
    const { result, particles, damageNumbers } = this.combatManager.executeCombat(
      this.player.state,
      enemy,
      currentTime
    );

    this.state.particles.push(...particles);
    this.state.damageNumbers.push(...damageNumbers);
    this.state.player = { ...this.player.state };

    if (result.enemyDefeated) {
      this.player.addKill();
      this.player.addExperience(result.experienceGained);
      this.state.stats.kills += 1;

      if (result.healthPotionDropped) {
        this.player.heal(CONFIG.HEALTH_POTION_RESTORE);
        this.showPickupMessage(`获得血瓶! 回复 ${CONFIG.HEALTH_POTION_RESTORE} HP`);
      }

      this.state.player = { ...this.player.state };
      this.state.enemies = this.state.enemies.filter((e) => e.id !== enemy.id);
    }

    if (result.playerDied) {
      this.state.phase = GamePhase.DEFEAT;
      this.state.stats.totalTime = performance.now() - this.state.stats.startTime;
      return;
    }

    setTimeout(() => {
      this.state.phase = GamePhase.PLAYING;
      this.state.currentEnemyInCombat = null;
      this.updateEnemyAI();
      this.checkGameConditions();
    }, 300);
  }

  private updateEnemyAI(): void {
    const currentTime = performance.now();
    let anyMoved = false;

    for (const enemy of this.state.enemies) {
      if (enemy.isAlive && !enemy.isMoving) {
        const moved = this.combatManager.updateEnemyAI(
          enemy,
          this.player.state.position,
          this.state.dungeon,
          this.state.enemies,
          currentTime
        );
        if (moved) anyMoved = true;
      }
    }

    if (anyMoved) {
      setTimeout(() => {
        for (const enemy of this.state.enemies) {
          this.combatManager.updateEnemyMovement(enemy, performance.now());
        }

        const adjacentEnemy = this.combatManager.findAdjacentEnemy(
          this.player.state.position,
          this.state.enemies
        );

        if (adjacentEnemy) {
          this.initiateCombat(adjacentEnemy);
        }
      }, CONFIG.MOVE_ANIMATION_DURATION + 10);
    }
  }

  private handleInteract(): void {
    if (this.state.phase !== GamePhase.PLAYING) return;

    const playerPos = this.player.state.position;
    const chest = this.state.chests.find(
      (c) => !c.isOpened && c.position.x === playerPos.x && c.position.y === playerPos.y
    );

    if (chest) {
      this.openChest(chest);
    }
  }

  private openChest(chest: Chest): void {
    chest.isOpened = true;

    const reward = this.generateChestReward();
    const particles = this.renderer.createGoldParticles(chest.position);
    this.state.particles.push(...particles);

    switch (reward.type) {
      case 'coins':
        this.player.addCoins(reward.amount);
        this.state.stats.coins += reward.amount;
        this.showPickupMessage(`获得 ${reward.amount} 金币!`);
        break;
      case 'weapon':
        this.player.increaseAttack(reward.bonus);
        this.showPickupMessage(`获得武器! 攻击力 +${reward.bonus}`);
        break;
      case 'potion':
        this.player.heal(reward.heal);
        this.showPickupMessage(`获得药剂! 回复 ${reward.heal} HP`);
        break;
    }

    this.state.player = { ...this.player.state };
  }

  private generateChestReward(): ChestReward {
    const roll = Math.random();

    if (roll < 0.5) {
      return {
        type: 'coins',
        amount: this.randomInt(CONFIG.COIN_MIN, CONFIG.COIN_MAX),
      };
    } else if (roll < 0.75) {
      return {
        type: 'weapon',
        bonus: CONFIG.WEAPON_ATTACK_BONUS,
      };
    } else {
      return {
        type: 'potion',
        heal: CONFIG.CHEST_POTION_RESTORE,
      };
    }
  }

  private showPickupMessage(message: string): void {
    this.state.pickupMessage = message;
    this.state.pickup