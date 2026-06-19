import { create } from 'zustand';

export type Team = 'red' | 'blue';
export type CommandType = 'surround' | 'disperse' | 'formation';
export type UnitState = 'idle' | 'moving' | 'attacking' | 'dead';

export interface Unit {
  id: string;
  team: Team;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  path: { x: number; y: number }[];
  maxHp: number;
  hp: number;
  speed: number;
  attack: number;
  attackRange: number;
  lastAttackTime: number;
  state: UnitState;
  groupId?: string;
  formationOffset?: { x: number; y: number };
}

export interface Command {
  id: string;
  timestamp: number;
  type: CommandType;
  team: Team;
  unitIds: string[];
  target: { x: number; y: number };
  params: {
    radius?: number;
    width?: number;
    arc?: boolean;
  };
  snapshot?: Unit[];
}

export interface FloatingText {
  id: string;
  x: number;
  y: number;
  text: string;
  color: string;
  startTime: number;
  duration: number;
}

export interface Particle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  startTime: number;
  duration: number;
}

export interface AttackFlash {
  id: string;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  startTime: number;
  duration: number;
}

export interface BattlefieldState {
  units: Unit[];
  commands: Command[];
  selectedUnitIds: string[];
  hoveredUnitId: string | null;
  floatingTexts: FloatingText[];
  particles: Particle[];
  attackFlashes: AttackFlash[];
  isPlaying: boolean;
  isReplaying: boolean;
  replaySpeed: number;
  replayFromIndex: number;
  placingTeam: Team | null;
  commandType: CommandType;
  formationWidth: number;
  formationArc: boolean;
  disperseRadius: number;
  surroundRadius: number;
  pendingTarget: { x: number; y: number } | null;
}

export interface BattlefieldActions {
  placeUnit: (team: Team, x: number, y: number) => void;
  selectUnit: (id: string, additive?: boolean) => void;
  selectUnitsInRect: (x1: number, y1: number, x2: number, y2: number, team?: Team) => void;
  clearSelection: () => void;
  setHoveredUnit: (id: string | null) => void;
  setPlacingTeam: (team: Team | null) => void;
  setCommandType: (type: CommandType) => void;
  setFormationWidth: (w: number) => void;
  setFormationArc: (arc: boolean) => void;
  setDisperseRadius: (r: number) => void;
  setSurroundRadius: (r: number) => void;
  setPendingTarget: (t: { x: number; y: number } | null) => void;
  issueCommand: (
    type: CommandType,
    unitIds: string[],
    target: { x: number; y: number },
    params: Command['params']
  ) => void;
  applyCommand: (command: Command) => void;
  updateUnits: (deltaTime: number, now: number) => void;
  startReplay: (commandIndex: number) => void;
  setReplaySpeed: (speed: number) => void;
  stopReplay: () => void;
  resetBattlefield: () => void;
  setIsPlaying: (p: boolean) => void;
  addFloatingText: (text: Omit<FloatingText, 'id' | 'startTime'>) => void;
  addParticle: (particle: Omit<Particle, 'id' | 'startTime'>) => void;
  addAttackFlash: (flash: Omit<AttackFlash, 'id' | 'startTime'>) => void;
  cleanupEffects: (now: number) => void;
}

const genId = () => Math.random().toString(36).slice(2, 10);

export const BATTLEFIELD_WIDTH = 800;
export const BATTLEFIELD_HEIGHT = 600;

export const useBattlefieldStore = create<BattlefieldState & BattlefieldActions>((set, get) => ({
  units: [],
  commands: [],
  selectedUnitIds: [],
  hoveredUnitId: null,
  floatingTexts: [],
  particles: [],
  attackFlashes: [],
  isPlaying: true,
  isReplaying: false,
  replaySpeed: 1,
  replayFromIndex: -1,
  placingTeam: null,
  commandType: 'formation',
  formationWidth: 200,
  formationArc: false,
  disperseRadius: 100,
  surroundRadius: 120,
  pendingTarget: null,

  placeUnit: (team, x, y) => {
    const unit: Unit = {
      id: genId(),
      team,
      x,
      y,
      targetX: x,
      targetY: y,
      path: [],
      maxHp: 100,
      hp: 100,
      speed: 1 + Math.random() * 2,
      attack: 5 + Math.floor(Math.random() * 11),
      attackRange: 150,
      lastAttackTime: 0,
      state: 'idle',
    };
    set((s) => ({ units: [...s.units, unit] }));
  },

  selectUnit: (id, additive) => {
    set((s) => {
      if (additive) {
        return s.selectedUnitIds.includes(id)
          ? { selectedUnitIds: s.selectedUnitIds.filter((i) => i !== id) }
          : { selectedUnitIds: [...s.selectedUnitIds, id] };
      }
      return { selectedUnitIds: [id] };
    });
  },

  selectUnitsInRect: (x1, y1, x2, y2, team) => {
    const minX = Math.min(x1, x2);
    const maxX = Math.max(x1, x2);
    const minY = Math.min(y1, y2);
    const maxY = Math.max(y1, y2);
    set((s) => ({
      selectedUnitIds: s.units
        .filter(
          (u) =>
            u.state !== 'dead' &&
            (!team || u.team === team) &&
            u.x >= minX &&
            u.x <= maxX &&
            u.y >= minY &&
            u.y <= maxY
        )
        .map((u) => u.id),
    }));
  },

  clearSelection: () => set({ selectedUnitIds: [] }),
  setHoveredUnit: (id) => set({ hoveredUnitId: id }),
  setPlacingTeam: (team) => set({ placingTeam: team }),
  setCommandType: (type) => set({ commandType: type }),
  setFormationWidth: (w) => set({ formationWidth: w }),
  setFormationArc: (arc) => set({ formationArc: arc }),
  setDisperseRadius: (r) => set({ disperseRadius: r }),
  setSurroundRadius: (r) => set({ surroundRadius: r }),
  setPendingTarget: (t) => set({ pendingTarget: t }),

  issueCommand: (type, unitIds, target, params) => {
    const { units } = get();
    const snapshot = units.map((u) => ({ ...u, path: [...u.path] }));
    const teamUnits = units.filter((u) => unitIds.includes(u.id));
    const team = teamUnits.length > 0 ? teamUnits[0].team : 'blue';
    const command: Command = {
      id: genId(),
      timestamp: Date.now(),
      type,
      team,
      unitIds,
      target,
      params,
      snapshot,
    };
    set((s) => ({ commands: [...s.commands, command] }));
    get().applyCommand(command);
  },

  applyCommand: (command) => {
    const { unitIds, target, type, params } = command;
    set((s) => {
      const groupId = genId();
      const activeUnits = s.units.filter((u) => unitIds.includes(u.id) && u.state !== 'dead');
      if (activeUnits.length === 0) return s;
      const count = activeUnits.length;
      let targetPositions: { x: number; y: number }[] = [];

      if (type === 'surround') {
        const radius = params.radius ?? 120;
        for (let i = 0; i < count; i++) {
          const angle = (i / count) * Math.PI * 2;
          targetPositions.push({
            x: Math.max(10, Math.min(BATTLEFIELD_WIDTH - 10, target.x + Math.cos(angle) * radius)),
            y: Math.max(10, Math.min(BATTLEFIELD_HEIGHT - 10, target.y + Math.sin(angle) * radius)),
          });
        }
      } else if (type === 'disperse') {
        const radius = params.radius ?? 100;
        for (let i = 0; i < count; i++) {
          const angle = Math.random() * Math.PI * 2;
          const r = Math.random() * radius;
          targetPositions.push({
            x: Math.max(10, Math.min(BATTLEFIELD_WIDTH - 10, target.x + Math.cos(angle) * r)),
            y: Math.max(10, Math.min(BATTLEFIELD_HEIGHT - 10, target.y + Math.sin(angle) * r)),
          });
        }
      } else if (type === 'formation') {
        const width = params.width ?? 200;
        const arc = params.arc ?? false;
        const spacing = count > 1 ? width / (count - 1) : 0;
        for (let i = 0; i < count; i++) {
          if (arc) {
            const radius = Math.max(width, 100);
            const startAngle = -Math.PI / 4;
            const angleRange = Math.PI / 2;
            const angle = count > 1 ? startAngle + (i / (count - 1)) * angleRange : startAngle + angleRange / 2;
            targetPositions.push({
              x: Math.max(10, Math.min(BATTLEFIELD_WIDTH - 10, target.x + Math.sin(angle) * radius)),
              y: Math.max(10, Math.min(BATTLEFIELD_HEIGHT - 10, target.y + (1 - Math.cos(angle)) * radius)),
            });
          } else {
            const offsetX = count > 1 ? -width / 2 + i * spacing : 0;
            targetPositions.push({
              x: Math.max(10, Math.min(BATTLEFIELD_WIDTH - 10, target.x + offsetX)),
              y: Math.max(10, Math.min(BATTLEFIELD_HEIGHT - 10, target.y)),
            });
          }
        }
      }

      let centerX = 0, centerY = 0;
      targetPositions.forEach((p) => { centerX += p.x; centerY += p.y; });
      centerX /= targetPositions.length;
      centerY /= targetPositions.length;

      const updatedUnits = s.units.map((u) => {
        const idx = activeUnits.findIndex((au) => au.id === u.id);
        if (idx === -1) return u;
        const tp = targetPositions[idx];
        return {
          ...u,
          targetX: tp.x,
          targetY: tp.y,
          path: [{ x: tp.x, y: tp.y }],
          state: 'moving' as UnitState,
          groupId,
          formationOffset: { x: tp.x - centerX, y: tp.y - centerY },
        };
      });
      return { units: updatedUnits };
    });
  },

  updateUnits: (deltaTime, now) => {
    const state = get();
    if (!state.isPlaying) return;

    set((s) => {
      const enemyMap = new Map<string, Unit | null>();
      let floatingAdditions: FloatingText[] = [];
      let flashAdditions: AttackFlash[] = [];
      let particleAdditions: Particle[] = [];

      const updatedUnits = s.units.map((unit) => {
        if (unit.state === 'dead') return unit;
        let { x, y, hp, state: uState, lastAttackTime } = unit;

        const dx = unit.targetX - x;
        const dy = unit.targetY - y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > 2) {
          const moveX = (dx / dist) * unit.speed * deltaTime * 60;
          const moveY = (dy / dist) * unit.speed * deltaTime * 60;
          x = Math.max(5, Math.min(BATTLEFIELD_WIDTH - 5, x + moveX));
          y = Math.max(5, Math.min(BATTLEFIELD_HEIGHT - 5, y + moveY));
          uState = 'moving';
        } else {
          uState = 'attacking';
        }

        if (uState === 'attacking' || dist < unit.attackRange) {
          let nearestEnemy: Unit | null = enemyMap.get(unit.id) ?? null;
          if (!nearestEnemy) {
            let minDist = Infinity;
            for (const other of s.units) {
              if (other.team !== unit.team && other.state !== 'dead') {
                const d = Math.hypot(other.x - x, other.y - y);
                if (d < unit.attackRange && d < minDist) {
                  minDist = d;
                  nearestEnemy = other;
                }
              }
            }
            enemyMap.set(unit.id, nearestEnemy);
          }

          if (nearestEnemy && now - lastAttackTime > 1500) {
            lastAttackTime = now;
            flashAdditions.push({
              id: genId(),
              fromX: x,
              fromY: y,
              toX: nearestEnemy.x,
              toY: nearestEnemy.y,
              startTime: now,
              duration: 100,
            });
            const targetId = nearestEnemy.id;
            const dmg = unit.attack;
            floatingAdditions.push({
              id: genId(),
              x: nearestEnemy.x,
              y: nearestEnemy.y - 20,
              text: `-${dmg}`,
              color: '#ffffff',
              startTime: now,
              duration: 500,
            });
            const idx = s.units.findIndex((u) => u.id === targetId);
            if (idx !== -1) {
              const target = s.units[idx];
              const newHp = target.hp - dmg;
              if (newHp <= 0) {
                const color = target.team === 'red' ? '#ff4444' : '#4488ff';
                for (let i = 0; i < 4; i++) {
                  const angle = (i / 4) * Math.PI * 2;
                  particleAdditions.push({
                    id: genId(),
                    x: target.x,
                    y: target.y,
                    vx: Math.cos(angle) * (30 / 0.8),
                    vy: Math.sin(angle) * (30 / 0.8),
                    color,
                    startTime: now,
                    duration: 800,
                  });
                }
              }
            }
          }
        }

        return { ...unit, x, y, hp, state: uState, lastAttackTime };
      });

      const damagedUnits = updatedUnits.map((u) => {
        for (const ft of floatingAdditions) {
          if (ft.text.startsWith('-')) {
            const dmg = parseInt(ft.text.slice(1));
            const d = Math.hypot(ft.x - u.x, ft.y + 20 - u.y);
            if (d < 5 && u.hp > 0) {
              return { ...u, hp: Math.max(0, u.hp - dmg), state: u.hp - dmg <= 0 ? 'dead' as UnitState : u.state };
            }
          }
        }
        return u;
      });

      const regroupedUnits = damagedUnits.map((u, i) => {
        if (u.state === 'dead') return u;
        const damaged = damagedUnits[i];
        if (damaged.hp <= 0) {
          const groupUnits = damagedUnits.filter((gu) => gu.groupId === u.groupId && gu.state !== 'dead');
          if (groupUnits.length > 1) {
            let cx = 0, cy = 0;
            groupUnits.forEach((gu) => { cx += gu.x; cy += gu.y; });
            cx /= groupUnits.length;
            cy /= groupUnits.length;
            const newCount = groupUnits.length;
            return damagedUnits.map((gu2, j) => {
              if (gu2.groupId !== u.groupId || gu2.state === 'dead') return gu2;
              const idx = groupUnits.findIndex((g) => g.id === gu2.id);
              const angle = (idx / newCount) * Math.PI * 2;
              const radius = 50;
              return {
                ...gu2,
                targetX: cx + Math.cos(angle) * radius,
                targetY: cy + Math.sin(angle) * radius,
                path: [{ x: cx + Math.cos(angle) * radius, y: cy + Math.sin(angle) * radius }],
                state: 'moving' as UnitState,
                formationOffset: { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius },
              };
            })[j] ?? gu2;
          }
        }
        return damaged;
      });

      const finalUnits = regroupedUnits.length === damagedUnits.length ? regroupedUnits : damagedUnits;

      return {
        units: finalUnits,
        floatingTexts: [...s.floatingTexts, ...floatingAdditions],
        attackFlashes: [...s.attackFlashes, ...flashAdditions],
        particles: [...s.particles, ...particleAdditions],
      };
    });
  },

  cleanupEffects: (now) => {
    set((s) => ({
      floatingTexts: s.floatingTexts.filter((f) => now - f.startTime < f.duration),
      attackFlashes: s.attackFlashes.filter((f) => now - f.startTime < f.duration),
      particles: s.particles.filter((p) => now - p.startTime < p.duration),
    }));
  },

  startReplay: (commandIndex) => {
    const { commands } = get();
    if (commandIndex < 0 || commandIndex >= commands.length) return;
    const cmd = commands[commandIndex];
    if (!cmd.snapshot) return;
    set({
      units: cmd.snapshot.map((u) => ({ ...u, path: [...u.path] })),
      isReplaying: true,
      replayFromIndex: commandIndex,
      floatingTexts: [],
      attackFlashes: [],
      particles: [],
    });
  },

  setReplaySpeed: (speed) => set({ replaySpeed: speed }),

  stopReplay: () => set({ isReplaying: false, replayFromIndex: -1 }),

  resetBattlefield: () =>
    set({
      units: [],
      commands: [],
      selectedUnitIds: [],
      hoveredUnitId: null,
      floatingTexts: [],
      particles: [],
      attackFlashes: [],
      isPlaying: true,
      isReplaying: false,
      replayFromIndex: -1,
      placingTeam: null,
      pendingTarget: null,
    }),

  setIsPlaying: (p) => set({ isPlaying: p }),

  addFloatingText: (ft) =>
    set((s) => ({
      floatingTexts: [...s.floatingTexts, { ...ft, id: genId(), startTime: Date.now() }],
    })),

  addParticle: (p) =>
    set((s) => ({
      particles: [...s.particles, { ...p, id: genId(), startTime: Date.now() }],
    })),

  addAttackFlash: (f) =>
    set((s) => ({
      attackFlashes: [...s.attackFlashes, { ...f, id: genId(), startTime: Date.now() }],
    })),
}));
