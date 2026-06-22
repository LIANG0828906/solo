import { PlayerCommand, CommandType, Vec2, AlertZone } from '../types';
import { eventBus } from '../events/event_bus';
import { ColonyManager } from './colony_manager';
import { AntAgent } from './ant_agent';
import { Nest } from '../types';

let alertIdCounter = 0;

export interface CommandCooldown {
  type: CommandType;
  remaining: number;
  total: number;
}

export class DecisionEngine {
  private colony: ColonyManager;
  private pendingCommands: PlayerCommand[] = [];
  private commandCooldowns: Map<CommandType, CommandCooldown> = new Map();
  private alertZones: AlertZone[] = [];
  private selectedAntIds: Set<string> = new Set();
  private selectedNestIds: Set<string> = new Set();

  constructor(colony: ColonyManager) {
    this.colony = colony;
    this.setupEventListeners();
    this.initCooldowns();
  }

  private initCooldowns(): void {
    const defaults: Array<{ type: CommandType; cooldown: number }> = [
      { type: 'attack_area', cooldown: 3 },
      { type: 'gather_priority', cooldown: 2 },
      { type: 'recall', cooldown: 5 },
      { type: 'spawn_worker', cooldown: 1 },
      { type: 'spawn_soldier', cooldown: 2 },
      { type: 'set_alert_zone', cooldown: 1.5 },
      { type: 'move_to', cooldown: 0.3 },
    ];
    defaults.forEach(({ type, cooldown }) => {
      this.commandCooldowns.set(type, { type, remaining: 0, total: cooldown });
    });
  }

  private setupEventListeners(): void {
    eventBus.on('player:command', (payload) => {
      const cmd = payload.command as PlayerCommand;
      if (cmd) this.queueCommand(cmd);
    });

    eventBus.on('player:select', (payload) => {
      const antIds = payload.antIds as string[];
      const nestIds = payload.nestIds as string[];
      this.setSelection(antIds || [], nestIds || []);
    });
  }

  queueCommand(cmd: PlayerCommand): void {
    const cd = this.commandCooldowns.get(cmd.type);
    if (cd && cd.remaining > 0) return;
    this.pendingCommands.push(cmd);
    if (cd) cd.remaining = cd.total;
  }

  setSelection(antIds: string[], nestIds: string[]): void {
    this.colony.ants.forEach((ant) => (ant.selected = false));
    this.colony.nests.forEach((nest) => (nest.selected = false));

    this.selectedAntIds.clear();
    this.selectedNestIds.clear();

    antIds.forEach((id) => {
      const ant = this.colony.ants.get(id);
      if (ant) {
        ant.selected = true;
        this.selectedAntIds.add(id);
      }
    });

    nestIds.forEach((id) => {
      const nest = this.colony.nests.get(id);
      if (nest) {
        nest.selected = true;
        this.selectedNestIds.add(id);
      }
    });
  }

  update(deltaTime: number, currentTime: number): void {
    this.commandCooldowns.forEach((cd) => {
      if (cd.remaining > 0) {
        cd.remaining = Math.max(0, cd.remaining - deltaTime);
      }
    });

    this.alertZones = this.alertZones.filter((zone) => {
      const age = currentTime - zone.createdAt;
      return age < zone.duration;
    });

    this.processCommands();
  }

  private processCommands(): void {
    while (this.pendingCommands.length > 0) {
      const cmd = this.pendingCommands.shift()!;
      this.executeCommand(cmd);
    }
  }

  private executeCommand(cmd: PlayerCommand): void {
    eventBus.emit('ui:command_issued', { type: cmd.type });

    switch (cmd.type) {
      case 'move_to':
        this.handleMoveTo(cmd);
        break;
      case 'attack_area':
        this.handleAttackArea(cmd);
        break;
      case 'gather_priority':
        this.handleGatherPriority(cmd);
        break;
      case 'recall':
        this.handleRecall(cmd);
        break;
      case 'spawn_worker':
        this.handleSpawnWorker(cmd);
        break;
      case 'spawn_soldier':
        this.handleSpawnSoldier(cmd);
        break;
      case 'set_alert_zone':
        this.handleSetAlertZone(cmd);
        break;
    }
  }

  private handleMoveTo(cmd: PlayerCommand): void {
    if (!cmd.position) return;
    const targets = this.getTargetAnts(cmd);
    targets.forEach((ant) => {
      ant.target = { ...cmd.position! };
    });
  }

  private handleAttackArea(cmd: PlayerCommand): void {
    if (!cmd.position) return;
    const zone: AlertZone = {
      id: `alert_${++alertIdCounter}`,
      position: { ...cmd.position },
      radius: 120,
      priority: cmd.priority || 1,
      createdAt: performance.now() / 1000,
      duration: 10,
    };
    this.alertZones.push(zone);
    eventBus.emit('game:alert_zone', { zone });

    this.colony.ants.forEach((ant) => {
      if (ant.type === 'soldier') {
        const angle = Math.random() * Math.PI * 2;
        const r = Math.random() * zone.radius * 0.6;
        ant.target = {
          x: zone.position.x + Math.cos(angle) * r,
          y: zone.position.y + Math.sin(angle) * r,
        };
        ant.state = 'patrolling';
      }
    });
  }

  private handleGatherPriority(cmd: PlayerCommand): void {
  }

  private handleRecall(cmd: PlayerCommand): void {
    const targets = this.getTargetAnts(cmd);
    targets.forEach((ant) => {
      const nest = this.colony.nests.get(ant.homeNestId);
      if (nest) {
        ant.target = { ...nest.position };
      }
    });
  }

  private handleSpawnWorker(cmd: PlayerCommand): void {
    const nestIds = cmd.targetIds.length > 0
      ? cmd.targetIds.filter((id) => this.colony.nests.get(id)?.type === 'worker_nest')
      : Array.from(this.colony.nests.values())
          .filter((n) => n.type === 'worker_nest')
          .map((n) => n.id);

    nestIds.forEach((id) => this.colony.spawnAnt(id, 'worker'));
  }

  private handleSpawnSoldier(cmd: PlayerCommand): void {
    const nestIds = cmd.targetIds.length > 0
      ? cmd.targetIds.filter((id) => this.colony.nests.get(id)?.type === 'soldier_nest')
      : Array.from(this.colony.nests.values())
          .filter((n) => n.type === 'soldier_nest')
          .map((n) => n.id);

    nestIds.forEach((id) => this.colony.spawnAnt(id, 'soldier'));
  }

  private handleSetAlertZone(cmd: PlayerCommand): void {
    if (!cmd.position) return;
    const zone: AlertZone = {
      id: `alert_${++alertIdCounter}`,
      position: { ...cmd.position },
      radius: 100,
      priority: cmd.priority || 1,
      createdAt: performance.now() / 1000,
      duration: 15,
    };
    this.alertZones.push(zone);
    eventBus.emit('game:alert_zone', { zone });
  }

  private getTargetAnts(cmd: PlayerCommand): AntAgent[] {
    const result: AntAgent[] = [];
    const hasExplicitTargets = cmd.targetIds.length > 0;

    if (hasExplicitTargets) {
      cmd.targetIds.forEach((id) => {
        const ant = this.colony.ants.get(id);
        if (ant) result.push(ant);
      });
    }

    if (result.length === 0 && this.selectedAntIds.size > 0) {
      this.selectedAntIds.forEach((id) => {
        const ant = this.colony.ants.get(id);
        if (ant) result.push(ant);
      });
    }

    if (result.length === 0) {
      this.colony.ants.forEach((ant) => result.push(ant));
    }

    return result;
  }

  getAlertZones(): AlertZone[] {
    return this.alertZones;
  }

  getSimpleAlertZones(): Array<{ position: Vec2; radius: number }> {
    return this.alertZones.map((z) => ({ position: z.position, radius: z.radius }));
  }

  getCooldowns(): Map<CommandType, CommandCooldown> {
    return this.commandCooldowns;
  }

  getCooldown(type: CommandType): CommandCooldown | undefined {
    return this.commandCooldowns.get(type);
  }

  getSelectedAntIds(): Set<string> {
    return this.selectedAntIds;
  }

  getSelectedNestIds(): Set<string> {
    return this.selectedNestIds;
  }
}
