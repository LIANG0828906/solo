import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type {
  ShipModule,
  Slot,
  Ship,
  BattleState,
  BattleLogEntry,
  GameStore,
  ModuleType,
  LogType,
  Rarity,
} from './types';

const PRESET_MODULES: ShipModule[] = [
  { id: 'engine-1', name: '离子引擎', type: 'engine', value: 8, rarity: 'common', description: '基础推进系统' },
  { id: 'engine-2', name: '等离子引擎', type: 'engine', value: 12, rarity: 'rare', description: '中型推进系统' },
  { id: 'engine-3', name: '曲率引擎', type: 'engine', value: 15, rarity: 'legendary', description: '高级推进系统' },
  { id: 'shield-1', name: '标准护盾', type: 'shield', value: 20, rarity: 'common', description: '基础能量护盾' },
  { id: 'shield-2', name: '增压护盾', type: 'shield', value: 30, rarity: 'rare', description: '中型能量护盾' },
  { id: 'shield-3', name: '量子护盾', type: 'shield', value: 40, rarity: 'legendary', description: '高级能量护盾' },
  { id: 'weapon-1', name: '脉冲激光', type: 'weapon', value: 12, rarity: 'common', description: '基础激光武器' },
  { id: 'weapon-2', name: '等离子炮', type: 'weapon', value: 18, rarity: 'rare', description: '中型能量武器' },
  { id: 'weapon-3', name: '反物质炮', type: 'weapon', value: 25, rarity: 'legendary', description: '高级能量武器' },
  { id: 'weapon-4', name: '量子鱼雷', type: 'weapon', value: 22, rarity: 'rare', description: '追踪型武器' },
];

const INITIAL_SLOTS: Slot[] = [
  { id: 'slot-engine-1', type: 'engine', position: { x: 20, y: 75 }, equippedModule: null },
  { id: 'slot-engine-2', type: 'engine', position: { x: 80, y: 75 }, equippedModule: null },
  { id: 'slot-shield-1', type: 'shield', position: { x: 15, y: 45 }, equippedModule: null },
  { id: 'slot-shield-2', type: 'shield', position: { x: 85, y: 45 }, equippedModule: null },
  { id: 'slot-weapon-1', type: 'weapon', position: { x: 35, y: 15 }, equippedModule: null },
  { id: 'slot-weapon-2', type: 'weapon', position: { x: 65, y: 15 }, equippedModule: null },
];

const INITIAL_PLAYER_SHIP: Ship = {
  name: '先锋号',
  maxHp: 100,
  currentHp: 100,
  baseShield: 10,
  baseWeapon: 5,
  slots: INITIAL_SLOTS.map(s => ({ ...s })),
};

const ENEMY_SHIP: Ship = {
  name: '掠夺者',
  maxHp: 100,
  currentHp: 100,
  baseShield: 10,
  baseWeapon: 5,
  slots: [
    { id: 'enemy-engine-1', type: 'engine', position: { x: 0, y: 0 }, equippedModule: { id: 'ee1', name: '敌军引擎', type: 'engine', value: 30, rarity: 'common', description: '' } },
    { id: 'enemy-shield-1', type: 'shield', position: { x: 0, y: 0 }, equippedModule: { id: 'es1', name: '敌军护盾', type: 'shield', value: 40, rarity: 'common', description: '' } },
    { id: 'enemy-weapon-1', type: 'weapon', position: { x: 0, y: 0 }, equippedModule: { id: 'ew1', name: '敌军武器', type: 'weapon', value: 30, rarity: 'common', description: '' } },
  ],
};

const calculateShipStats = (ship: Ship) => {
  const thrust = ship.slots
    .filter(s => s.type === 'engine' && s.equippedModule)
    .reduce((sum, s) => sum + (s.equippedModule?.value || 0), 0);
  
  const shield = ship.baseShield + ship.slots
    .filter(s => s.type === 'shield' && s.equippedModule)
    .reduce((sum, s) => sum + (s.equippedModule?.value || 0), 0);
  
  const weapon = ship.baseWeapon + ship.slots
    .filter(s => s.type === 'weapon' && s.equippedModule)
    .reduce((sum, s) => sum + (s.equippedModule?.value || 0), 0);
  
  return { thrust, shield, weapon };
};

const createLogEntry = (turn: number, type: LogType, message: string): BattleLogEntry => ({
  id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  turn,
  type,
  message,
  timestamp: Date.now(),
});

const MAX_LOG_ENTRIES = 20;

export const useGameStore = create<GameStore>()(
  immer((set, get) => ({
    warehouse: PRESET_MODULES,
    playerShip: INITIAL_PLAYER_SHIP,
    battleState: null,
    draggedModule: null,

    setDraggedModule: (module) => {
      set(state => {
        state.draggedModule = module;
      });
    },

    assembleModule: (slotId, moduleId) => {
      const state = get();
      const slot = state.playerShip.slots.find(s => s.id === slotId);
      const module = state.warehouse.find(m => m.id === moduleId);

      if (!slot || !module) return false;
      if (slot.type !== module.type) return false;

      set(draft => {
        const targetSlot = draft.playerShip.slots.find(s => s.id === slotId);
        if (targetSlot) {
          if (targetSlot.equippedModule) {
            draft.warehouse.push(targetSlot.equippedModule);
          }
          targetSlot.equippedModule = module;
          const moduleIndex = draft.warehouse.findIndex(m => m.id === moduleId);
          if (moduleIndex > -1) {
            draft.warehouse.splice(moduleIndex, 1);
          }
        }
      });

      return true;
    },

    disassembleModule: (slotId) => {
      set(draft => {
        const slot = draft.playerShip.slots.find(s => s.id === slotId);
        if (slot && slot.equippedModule) {
          draft.warehouse.push(slot.equippedModule);
          slot.equippedModule = null;
        }
      });
    },

    startBattle: () => {
      const state = get();
      const playerShipCopy: Ship = {
        ...state.playerShip,
        currentHp: state.playerShip.maxHp,
        slots: state.playerShip.slots.map(s => ({ ...s, equippedModule: s.equippedModule ? { ...s.equippedModule } : null })),
      };
      const enemyShipCopy: Ship = {
        ...ENEMY_SHIP,
        currentHp: ENEMY_SHIP.maxHp,
        slots: ENEMY_SHIP.slots.map(s => ({ ...s, equippedModule: s.equippedModule ? { ...s.equippedModule } : null })),
      };

      const initialBattleState: BattleState = {
        isActive: true,
        currentTurn: 0,
        maxTurns: 10,
        playerShip: playerShipCopy,
        enemyShip: enemyShipCopy,
        logs: [createLogEntry(0, 'turnEnd', '⚔️ 战斗开始！')],
        winner: null,
        lastHitShip: null,
      };

      set(draft => {
        draft.battleState = initialBattleState;
      });
    },

    executeTurn: () => {
      const state = get();
      if (!state.battleState || !state.battleState.isActive || state.battleState.winner) return;

      const { playerShip, enemyShip } = state.battleState;
      const playerStats = calculateShipStats(playerShip);
      const enemyStats = calculateShipStats(enemyShip);

      let playerCurrentShield = playerStats.shield;
      let enemyCurrentShield = enemyStats.shield;

      const newLogs: BattleLogEntry[] = [];
      const newTurn = state.battleState.currentTurn + 1;
      let winner: 'player' | 'enemy' | null = null;
      let lastHitShip: 'player' | 'enemy' | null = null;

      let playerHp = playerShip.currentHp;
      let enemyHp = enemyShip.currentHp;

      const playerFirst = playerStats.thrust >= enemyStats.thrust;

      const attack = (
        attackerName: string,
        attackerWeapon: number,
        defenderName: string,
        defenderHp: number,
        defenderShield: number,
        weaponName: string
      ): { hp: number; shield: number; killed: boolean; log: string } => {
        const damage = Math.max(1, attackerWeapon);
        let remainingDamage = damage;
        let newShield = defenderShield;
        let newHp = defenderHp;
        let shieldDamage = 0;
        let hpDamage = 0;

        if (newShield > 0) {
          shieldDamage = Math.min(newShield, remainingDamage);
          newShield -= shieldDamage;
          remainingDamage -= shieldDamage;
        }

        if (remainingDamage > 0) {
          hpDamage = remainingDamage;
          newHp -= remainingDamage;
        }

        let logMessage = `${attackerName}使用${weaponName}攻击${defenderName}，造成${damage}点伤害`;
        if (shieldDamage > 0) {
          logMessage += `，护盾吸收${shieldDamage}点`;
        }
        if (hpDamage > 0) {
          logMessage += `，生命值损失${hpDamage}点`;
        }
        logMessage += `，${defenderName}剩余护盾${Math.max(0, newShield)}，生命值${Math.max(0, newHp)}`;

        return {
          hp: Math.max(0, newHp),
          shield: Math.max(0, newShield),
          killed: newHp <= 0,
          log: logMessage,
        };
      };

      const getPlayerWeaponName = () => {
        const weapons = playerShip.slots.filter(s => s.type === 'weapon' && s.equippedModule);
        return weapons.length > 0 && weapons[0].equippedModule
          ? weapons[0].equippedModule.name
          : '基础武器';
      };

      const getEnemyWeaponName = () => {
        const weapons = enemyShip.slots.filter(s => s.type === 'weapon' && s.equippedModule);
        return weapons.length > 0 && weapons[0].equippedModule
          ? weapons[0].equippedModule.name
          : '激光炮';
      };

      if (playerFirst) {
        const playerAttackResult = attack(
          '我方',
          playerStats.weapon,
          '敌方',
          enemyHp,
          enemyCurrentShield,
          getPlayerWeaponName()
        );
        enemyHp = playerAttackResult.hp;
        enemyCurrentShield = playerAttackResult.shield;
        newLogs.push(createLogEntry(newTurn, 'playerAttack', playerAttackResult.log));
        lastHitShip = 'enemy';

        if (!playerAttackResult.killed) {
          const enemyAttackResult = attack(
            '敌方',
            enemyStats.weapon,
            '我方',
            playerHp,
            playerCurrentShield,
            getEnemyWeaponName()
          );
          playerHp = enemyAttackResult.hp;
          playerCurrentShield = enemyAttackResult.shield;
          newLogs.push(createLogEntry(newTurn, 'enemyAttack', enemyAttackResult.log));
          lastHitShip = 'player';

          if (enemyAttackResult.killed) {
            winner = 'enemy';
          }
        } else {
          winner = 'player';
        }
      } else {
        const enemyAttackResult = attack(
          '敌方',
          enemyStats.weapon,
          '我方',
          playerHp,
          playerCurrentShield,
          getEnemyWeaponName()
        );
        playerHp = enemyAttackResult.hp;
        playerCurrentShield = enemyAttackResult.shield;
        newLogs.push(createLogEntry(newTurn, 'enemyAttack', enemyAttackResult.log));
        lastHitShip = 'player';

        if (!enemyAttackResult.killed) {
          const playerAttackResult = attack(
            '我方',
            playerStats.weapon,
            '敌方',
            enemyHp,
            enemyCurrentShield,
            getPlayerWeaponName()
          );
          enemyHp = playerAttackResult.hp;
          enemyCurrentShield = playerAttackResult.shield;
          newLogs.push(createLogEntry(newTurn, 'playerAttack', playerAttackResult.log));
          lastHitShip = 'enemy';

          if (playerAttackResult.killed) {
            winner = 'player';
          }
        } else {
          winner = 'enemy';
        }
      }

      playerCurrentShield = Math.min(playerStats.shield, playerCurrentShield + 5);
      enemyCurrentShield = Math.min(enemyStats.shield, enemyCurrentShield + 5);

      if (!winner) {
        newLogs.push(createLogEntry(newTurn, 'turnEnd', `📊 第${newTurn}回合结束，护盾自动回复5点`));
      }

      if (newTurn >= state.battleState.maxTurns && !winner) {
        if (playerHp > enemyHp) {
          winner = 'player';
          newLogs.push(createLogEntry(newTurn, 'battleEnd', `🏆 战斗结束！我方剩余生命值${playerHp} > 敌方${enemyHp}，我方胜利！`));
        } else {
          winner = 'enemy';
          newLogs.push(createLogEntry(newTurn, 'battleEnd', `💀 战斗结束！我方剩余生命值${playerHp} <= 敌方${enemyHp}，我方失败！`));
        }
      } else if (winner === 'player') {
        newLogs.push(createLogEntry(newTurn, 'battleEnd', '🏆 胜利！敌方飞船已被摧毁！'));
      } else if (winner === 'enemy') {
        newLogs.push(createLogEntry(newTurn, 'battleEnd', '💀 失败！我方飞船已被摧毁...'));
      }

      set(draft => {
        if (!draft.battleState) return;

        draft.battleState.currentTurn = newTurn;
        draft.battleState.playerShip.currentHp = playerHp;
        draft.battleState.enemyShip.currentHp = enemyHp;
        draft.battleState.lastHitShip = lastHitShip;
        draft.battleState.winner = winner;
        if (winner) {
          draft.battleState.isActive = false;
        }

        draft.battleState.logs = [
          ...draft.battleState.logs,
          ...newLogs,
        ].slice(-MAX_LOG_ENTRIES);
      });
    },

    resetBattle: () => {
      set(draft => {
        draft.battleState = null;
      });
    },

    clearLastHit: () => {
      set(draft => {
        if (draft.battleState) {
          draft.battleState.lastHitShip = null;
        }
      });
    },

    getTotalThrust: () => {
      const state = get();
      return calculateShipStats(state.playerShip).thrust;
    },

    getTotalShield: () => {
      const state = get();
      return calculateShipStats(state.playerShip).shield;
    },

    getTotalWeapon: () => {
      const state = get();
      return calculateShipStats(state.playerShip).weapon;
    },
  }))
);

export { calculateShipStats };
export type { ShipModule, Slot, ModuleType, Rarity };
