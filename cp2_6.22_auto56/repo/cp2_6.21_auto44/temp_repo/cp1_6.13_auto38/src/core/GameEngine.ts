import { LogicModule } from './LogicModule';
import { RenderModule } from './RenderModule';
import { AIStrategy } from '../ai/AIStrategy';
import { InfoPanel } from '../ui/InfoPanel';
import type { GameState, Creature, Position, Tile, SkillType, AIDecision, EventPayloadMap } from '../types';
import { MAP_SIZE, SPECIES_STATS, SKILLS, EVOLUTION_KILLS_REQUIRED, SPECIES_INFO, TARGET_FPS } from '../types';
import { v4 as uuidv4 } from 'uuid';
import type { EventBus } from './EventBus';

export class GameEngine {
  private canvas: HTMLCanvasElement;
  private eventBus: EventBus<EventPayloadMap>;
  private infoPanel: InfoPanel;
  private logicModule: LogicModule;
  private renderModule: RenderModule;
  private aiStrategy: AIStrategy;

  private gameState: GameState;
  private lastFrameTime: number = 0;
  private frameCount: number = 0;
  private fps: number = 0;
  private isRunning: boolean = false;
  private animationFrameId: number | null = null;

  private moveAccumulators: Map<string, number> = new Map();
  private attackAnimations: Map<string, { timer: number; duration: number }> = new Map();
  private hitAnimations: Map<string, { timer: number; duration: number }> = new Map();
  private damageTexts: Map<string, { value: number; offsetY: number; timer: number }> = new Map();

  private boundHandleCanvasClick: (event: MouseEvent) => void;
  private boundHandleCanvasRightClick: (event: MouseEvent) => void;

  constructor(
    canvas: HTMLCanvasElement,
    eventBus: EventBus<EventPayloadMap>,
    infoPanelContainer: HTMLElement
  ) {
    this.canvas = canvas;
    this.eventBus = eventBus;
    this.infoPanel = new InfoPanel(infoPanelContainer, eventBus);
    this.logicModule = new LogicModule();
    this.renderModule = new RenderModule(canvas);
    this.aiStrategy = new AIStrategy();

    this.gameState = this.createInitialState();

    this.boundHandleCanvasClick = this.handleCanvasClick.bind(this);
    this.boundHandleCanvasRightClick = this.handleCanvasRightClick.bind(this);

    this.initEventListeners();
  }

  private createInitialState(): GameState {
    return {
      time: 0,
      map: [],
      mapWidth: MAP_SIZE,
      mapHeight: MAP_SIZE,
      creatures: [],
      selectedCreatureId: null,
      userTarget: null,
      path: [],
      eventLogs: [],
    };
  }

  private initEventListeners(): void {
    this.canvas.addEventListener('click', this.boundHandleCanvasClick);
    this.canvas.addEventListener('contextmenu', this.boundHandleCanvasRightClick);
  }

  private removeEventListeners(): void {
    this.canvas.removeEventListener('click', this.boundHandleCanvasClick);
    this.canvas.removeEventListener('contextmenu', this.boundHandleCanvasRightClick);
  }

  start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastFrameTime = performance.now();
    this.gameLoop(this.lastFrameTime);
  }

  stop(): void {
    this.isRunning = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  private gameLoop(currentTime: number): void {
    if (!this.isRunning) return;

    const deltaTime = currentTime - this.lastFrameTime;
    this.lastFrameTime = currentTime;

    this.frameCount++;
    if (this.frameCount % 30 === 0) {
      this.fps = Math.round(1000 / deltaTime);
    }

    this.update(deltaTime);
    this.render();

    this.animationFrameId = requestAnimationFrame((time) => this.gameLoop(time));
  }

  private update(deltaTime: number): void {
    const dt = deltaTime / 1000;
    this.gameState.time += dt;

    for (const creature of this.gameState.creatures) {
      if (creature.hp <= 0) continue;

      if (creature.isEvolving) {
        this.updateEvolution(creature, dt);
        continue;
      }

      this.updateAnimations(creature, dt);

      const decision = this.aiStrategy.decideAction(creature, this.gameState);
      this.executeDecision(creature, decision, dt);

      this.updateVisitedTiles(creature);
    }

    this.applyPassiveSkills();

    this.cleanupDeadCreatures();

    this.updateDamageTexts(dt);
  }

  private updateEvolution(creature: Creature, dt: number): void {
    creature.evolutionTimer += dt * 1000;

    if (creature.evolutionTimer >= 2000) {
      creature.isEvolving = false;
      creature.evolutionTimer = 0;
      creature.kills = 0;

      const newSkill = this.getRandomSkillForSpecies(creature.species);
      if (newSkill && !creature.skills.includes(newSkill)) {
        creature.skills.push(newSkill);
        this.eventBus.emit('CREATURE_EVOLVED', {
          creatureId: creature.id,
          newSkill,
        });
        this.addLog(`${SPECIES_INFO[creature.species].name} 进化了！获得技能：${SKILLS[newSkill].name}`);
      }
    }
  }

  private getRandomSkillForSpecies(species: string): SkillType | null {
    const skillPool: Record<string, SkillType[]> = {
      dragon: ['flameAura'],
      elf: ['multiTeleport'],
      gargoyle: ['stoneSkin'],
    };

    const pool = skillPool[species];
    if (!pool || pool.length === 0) return null;

    return pool[Math.floor(Math.random() * pool.length)];
  }

  private updateAnimations(creature: Creature, dt: number): void {
    const attackAnim = this.attackAnimations.get(creature.id);
    if (attackAnim) {
      attackAnim.timer -= dt * 1000;
      if (attackAnim.timer <= 0) {
        this.attackAnimations.delete(creature.id);
        creature.animation.type = 'idle';
      }
    }

    const hitAnim = this.hitAnimations.get(creature.id);
    if (hitAnim) {
      hitAnim.timer -= dt * 1000;
      if (hitAnim.timer <= 0) {
        this.hitAnimations.delete(creature.id);
      }
    }
  }

  private executeDecision(creature: Creature, decision: AIDecision, dt: number): void {
    switch (decision.action) {
      case 'move':
      case 'flee':
      case 'explore':
        if (decision.targetPosition) {
          this.moveCreature(creature, decision.targetPosition, dt);
        }
        break;
      case 'attack':
        if (decision.targetCreatureId) {
          this.attackCreature(creature, decision.targetCreatureId);
        }
        break;
      case 'useChest':
        this.useChest(creature);
        break;
      case 'usePortal':
        this.usePortal(creature);
        break;
    }
  }

  private moveCreature(creature: Creature, target: Position, dt: number): void {
    const moveInterval = 1000 / creature.speed;
    let accumulator = this.moveAccumulators.get(creature.id) || 0;
    accumulator += dt * 1000;

    if (accumulator >= moveInterval) {
      accumulator -= moveInterval;

      const direction = this.getMoveDirection(creature.position, target);
      const newPos: Position = {
        x: creature.position.x + direction.x,
        y: creature.position.y + direction.y,
      };

      if (!this.logicModule.checkCollision(newPos, this.gameState.map, this.gameState.creatures, creature.id)) {
        const fromPos = { ...creature.position };
        creature.position = newPos;
        creature.animation.type = 'moving';

        this.eventBus.emit('CREATURE_MOVED', {
          creatureId: creature.id,
          from: fromPos,
          to: newPos,
        });

        this.checkTileInteractions(creature);
      }
    }

    this.moveAccumulators.set(creature.id, accumulator);

    this.updateRenderPosition(creature, dt);
  }

  private getMoveDirection(from: Position, to: Position): Position {
    const dx = to.x - from.x;
    const dy = to.y - from.y;

    if (Math.abs(dx) > Math.abs(dy)) {
      return { x: dx > 0 ? 1 : -1, y: 0 };
    } else if (dy !== 0) {
      return { x: 0, y: dy > 0 ? 1 : -1 };
    }
    return { x: 0, y: 0 };
  }

  private updateRenderPosition(creature: Creature, dt: number): void {
    const speed = creature.speed * 3;
    const dx = creature.position.x - creature.renderPosition.x;
    const dy = creature.position.y - creature.renderPosition.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > 0.01) {
      const moveAmount = Math.min(dist, speed * dt);
      creature.renderPosition.x += (dx / dist) * moveAmount;
      creature.renderPosition.y += (dy / dist) * moveAmount;
    } else {
      creature.renderPosition.x = creature.position.x;
      creature.renderPosition.y = creature.position.y;
      if (creature.animation.type === 'moving') {
        creature.animation.type = 'idle';
      }
    }
  }

  private checkTileInteractions(creature: Creature): void {
    const tile = this.gameState.map[creature.position.y]?.[creature.position.x];
    if (!tile) return;

    if (tile.hasChest) {
      this.useChest(creature);
    }

    if (tile.hasPortal) {
      this.usePortal(creature);
    }
  }

  private useChest(creature: Creature): void {
    const tile = this.gameState.map[creature.position.y]?.[creature.position.x];
    if (!tile || !tile.hasChest) return;

    const reward = this.logicModule.openChest(creature, tile);
    this.renderModule.setMapDirty();

    let rewardText = '';
    if (reward.isTrap) {
      rewardText = `陷阱！受到 ${reward.damage} 点伤害`;
    } else if (reward.reward) {
      rewardText = `获得 ${this.getStatName(reward.reward.type)} +${reward.reward.value}`;
    }

    this.eventBus.emit('CHEST_OPENED', {
      position: creature.position,
      reward: rewardText,
      isTrap: reward.isTrap,
    });

    this.addLog(`${SPECIES_INFO[creature.species].name} 打开了宝箱：${rewardText}`);
  }

  private getStatName(type: string): string {
    const names: Record<string, string> = {
      hp: '生命',
      attack: '攻击',
      defense: '防御',
      speed: '速度',
    };
    return names[type] || type;
  }

  private usePortal(creature: Creature): void {
    const tile = this.gameState.map[creature.position.y]?.[creature.position.x];
    if (!tile || !tile.hasPortal) return;

    const fromPos = { ...creature.position };
    const targetPos = this.logicModule.usePortal(creature, tile);

    if (targetPos) {
      creature.renderPosition = { ...targetPos };

      this.eventBus.emit('PORTAL_USED', {
        creatureId: creature.id,
        from: fromPos,
        to: targetPos,
      });

      this.addLog(`${SPECIES_INFO[creature.species].name} 使用了传送门`);
    }
  }

  private attackCreature(attacker: Creature, defenderId: string): void {
    const defender = this.gameState.creatures.find((c) => c.id === defenderId);
    if (!defender || defender.hp <= 0) return;

    const distance = this.getManhattanDistance(attacker.position, defender.position);
    if (distance > 1) return;

    if (this.attackAnimations.has(attacker.id)) return;

    this.eventBus.emit('COMBAT_STARTED', {
      attackerId: attacker.id,
      defenderId: defender.id,
    });

    this.attackAnimations.set(attacker.id, { timer: 200, duration: 200 });
    attacker.animation.type = 'attacking';

    let damage = attacker.attack - defender.defense * 0.5;
    damage = Math.max(1, Math.floor(damage * (0.8 + Math.random() * 0.4)));

    if (defender.skills.includes('stoneSkin')) {
      damage = Math.floor(damage * 0.8);
    }

    defender.hp = Math.max(0, defender.hp - damage);

    this.hitAnimations.set(defender.id, { timer: 300, duration: 300 });
    this.damageTexts.set(defender.id, { value: damage, offsetY: 0, timer: 1 });

    const isDefenderDead = defender.hp <= 0;
    if (isDefenderDead) {
      attacker.kills++;

      if (attacker.kills >= EVOLUTION_KILLS_REQUIRED && !attacker.isEvolving) {
        attacker.isEvolving = true;
        attacker.evolutionTimer = 0;
        this.addLog(`${SPECIES_INFO[attacker.species].name} 开始进化！`);
      }
    }

    this.eventBus.emit('COMBAT_ENDED', {
      winnerId: isDefenderDead ? attacker.id : defender.id,
      loserId: isDefenderDead ? defender.id : attacker.id,
      damage,
    });

    this.addLog(
      `${SPECIES_INFO[attacker.species].name} 攻击 ${SPECIES_INFO[defender.species].name}，造成 ${damage} 点伤害${isDefenderDead ? '，击杀！' : ''}`
    );
  }

  private getManhattanDistance(a: Position, b: Position): number {
    return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
  }

  private applyPassiveSkills(): void {
    for (const creature of this.gameState.creatures) {
      if (creature.hp <= 0) continue;

      this.logicModule.applySkillEffects(creature, this.gameState.creatures);
    }
  }

  private updateVisitedTiles(creature: Creature): void {
    const key = `${creature.position.x},${creature.position.y}`;
    creature.visitedTiles.add(key as any);
  }

  private cleanupDeadCreatures(): void {
    const deadCreatures = this.gameState.creatures.filter((c) => c.hp <= 0);
    for (const dead of deadCreatures) {
      this.moveAccumulators.delete(dead.id);
      this.attackAnimations.delete(dead.id);
      this.hitAnimations.delete(dead.id);
      this.damageTexts.delete(dead.id);

      if (this.gameState.selectedCreatureId === dead.id) {
        this.gameState.selectedCreatureId = null;
        this.eventBus.emit('CREATURE_SELECTED', { creatureId: null });
      }
    }
  }

  private updateDamageTexts(dt: number): void {
    for (const creature of this.gameState.creatures) {
      const dmgText = this.damageTexts.get(creature.id);
      if (dmgText) {
        dmgText.timer -= dt;
        dmgText.offsetY += 30 * dt;

        if (dmgText.timer <= 0) {
          this.damageTexts.delete(creature.id);
          creature.displayDamage = undefined;
        } else {
          creature.displayDamage = { ...dmgText };
        }
      }
    }
  }

  private render(): void {
    this.renderModule.render(this.gameState);
  }

  initGame(): void {
    this.gameState.map = this.logicModule.generateDungeon();
    this.gameState.creatures = this.createCreatures();
    this.gameState.selectedCreatureId = null;
    this.gameState.userTarget = null;
    this.gameState.path = [];
    this.gameState.eventLogs = [];
    this.gameState.time = 0;

    this.moveAccumulators.clear();
    this.attackAnimations.clear();
    this.hitAnimations.clear();
    this.damageTexts.clear();

    this.renderModule.setMapDirty();

    this.addLog('游戏开始！');
  }

  private createCreatures(): Creature[] {
    const creatures: Creature[] = [];
    const species: Array<'dragon' | 'elf' | 'gargoyle'> = ['dragon', 'elf', 'gargoyle'];

    for (const s of species) {
      const pos = this.logicModule.getRandomSpawnPosition(this.gameState.map, creatures);
      if (!pos) continue;

      const stats = SPECIES_STATS[s];
      const creature: Creature = {
        id: uuidv4(),
        species: s,
        hp: stats.hp,
        maxHp: stats.hp,
        attack: stats.attack,
        defense: stats.defense,
        speed: stats.speed,
        position: pos,
        renderPosition: { ...pos },
        currentPath: [],
        moveProgress: 0,
        moveSpeed: stats.speed,
        userControlled: false,
        kills: 0,
        skills: [],
        visitedTiles: new Set(),
        isEvolving: false,
        evolutionTimer: 0,
        animation: {
          type: 'idle',
          progress: 0,
        },
      };

      const key = `${pos.x},${pos.y}`;
      creature.visitedTiles.add(key as any);

      creatures.push(creature);
    }

    return creatures;
  }

  private handleCanvasClick(event: MouseEvent): void {
    event.preventDefault();

    const rect = this.canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const tilePos = this.renderModule.screenToTile(x, y);

    const clickedCreature = this.gameState.creatures.find(
      (c) => c.hp > 0 && c.position.x === tilePos.x && c.position.y === tilePos.y
    );

    if (clickedCreature) {
      this.gameState.selectedCreatureId = clickedCreature.id;
      this.gameState.userTarget = null;
      this.eventBus.emit('CREATURE_SELECTED', { creatureId: clickedCreature.id });
    } else {
      this.gameState.selectedCreatureId = null;
      this.gameState.userTarget = null;
      this.eventBus.emit('CREATURE_SELECTED', { creatureId: null });
    }
  }

  private handleCanvasRightClick(event: MouseEvent): void {
    event.preventDefault();

    if (!this.gameState.selectedCreatureId) return;

    const rect = this.canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const tilePos = this.renderModule.screenToTile(x, y);

    if (
      tilePos.x >= 0 &&
      tilePos.x < MAP_SIZE &&
      tilePos.y >= 0 &&
      tilePos.y < MAP_SIZE &&
      this.gameState.map[tilePos.y]?.[tilePos.x]?.type !== 'wall'
    ) {
      this.gameState.userTarget = tilePos;
      this.eventBus.emit('TARGET_SET', { position: tilePos });
    }
  }

  private addLog(message: string): void {
    const entry = {
      message,
      timestamp: Date.now(),
    };
    this.gameState.eventLogs.unshift(entry);
    this.eventBus.emit('LOG_ADDED', entry);

    if (this.gameState.eventLogs.length > 50) {
      this.gameState.eventLogs.pop();
    }
  }

  getGameState(): GameState {
    return this.gameState;
  }

  getFps(): number {
    return this.fps;
  }

  destroy(): void {
    this.stop();
    this.removeEventListeners();
    this.renderModule.destroy();
  }
}
