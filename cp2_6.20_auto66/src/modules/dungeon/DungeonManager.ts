import { v4 as uuidv4 } from 'uuid';
import type {
  DungeonMap,
  DungeonCell,
  CellType,
  GameEvent,
  EventOption,
  Enemy,
  Attributes,
} from '../../types';
import { ENEMY_TEMPLATES, LOOT_ITEMS } from '../../data/gameData';

export class DungeonManager {
  static generateDungeon(width: number = 5, height: number = 5, floor: number = 1): DungeonMap {
    const cells: DungeonCell[][] = [];

    for (let y = 0; y < height; y++) {
      const row: DungeonCell[] = [];
      for (let x = 0; x < width; x++) {
        let type: CellType = 'empty';
        const rand = Math.random();

        if (x === 0 && y === height - 1) {
          type = 'entrance';
        } else if (x === width - 1 && y === 0) {
          type = 'boss';
        } else if (rand < 0.2) {
          type = 'monster';
        } else if (rand < 0.3) {
          type = 'treasure';
        } else if (rand < 0.4) {
          type = 'trap';
        } else if (rand < 0.45) {
          type = 'npc';
        }

        row.push({
          x,
          y,
          type,
          status: x === 0 && y === height - 1 ? 'visited' : 'hidden',
          eventId: type !== 'empty' && type !== 'entrance' ? uuidv4() : undefined,
          cleared: false,
        });
      }
      cells.push(row);
    }

    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const nx = dx;
        const ny = height - 1 + dy;
        if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
          cells[ny][nx].status = 'revealed';
        }
      }
    }

    return {
      width,
      height,
      cells,
      playerPosition: { x: 0, y: height - 1 },
      floor,
    };
  }

  static getCellEvent(cell: DungeonCell): GameEvent | null {
    if (cell.cleared && cell.type !== 'entrance' && cell.type !== 'exit') {
      return null;
    }

    switch (cell.type) {
      case 'treasure':
        return this.generateTreasureEvent(cell);
      case 'trap':
        return this.generateTrapEvent(cell);
      case 'monster':
        return this.generateMonsterEvent(cell);
      case 'npc':
        return this.generateNPCEvent(cell);
      case 'boss':
        return this.generateBossEvent(cell);
      case 'entrance':
        return {
          id: cell.eventId || 'entrance',
          type: 'npc',
          title: '地牢入口',
          description: '你站在地牢的入口处，潮湿的空气中弥漫着危险的气息。前方的道路充满未知...',
          options: [
            {
              id: 'enter',
              text: '继续探索',
              result: {
                success: true,
                message: '你深吸一口气，踏入了地牢深处。',
              },
            },
          ],
        };
      default:
        return null;
    }
  }

  static generateTreasureEvent(cell: DungeonCell): GameEvent {
    const goldAmount = Math.floor(Math.random() * 50) + 20;
    const hasItem = Math.random() > 0.5;

    const options: EventOption[] = [
      {
        id: 'open_lockpick',
        text: '尝试撬锁 (敏捷检定 DC12)',
        requiredCheck: {
          attribute: 'dexterity',
          dc: 12,
        },
        result: {
          success: true,
          message: '你巧妙地打开了宝箱！',
          goldChange: goldAmount,
          experienceChange: 15,
          items: hasItem
            ? [
                {
                  ...LOOT_ITEMS['health-potion-1'],
                  id: `potion-${uuidv4().slice(0, 8)}`,
                },
              ]
            : undefined,
        },
      },
      {
        id: 'smash',
        text: '强行砸开',
        result: {
          success: true,
          message: '你用蛮力砸开了宝箱，但里面的东西有些损坏...',
          goldChange: Math.floor(goldAmount * 0.7),
        },
      },
      {
        id: 'leave',
        text: '离开',
        result: {
          success: false,
          message: '你决定不冒险，离开了宝箱。',
        },
      },
    ];

    return {
      id: cell.eventId || `treasure-${uuidv4()}`,
      type: 'treasure',
      title: '发现宝箱！',
      description: '你发现了一个布满灰尘的古老宝箱，锁看起来有些生锈...',
      options,
    };
  }

  static generateTrapEvent(cell: DungeonCell): GameEvent {
    const damage = Math.floor(Math.random() * 15) + 10;

    const options: EventOption[] = [
      {
        id: 'dodge',
        text: '快速闪躲 (敏捷检定 DC14)',
        requiredCheck: {
          attribute: 'dexterity',
          dc: 14,
        },
        result: {
          success: true,
          message: '你灵巧地躲开了陷阱！',
          experienceChange: 10,
        },
      },
      {
        id: 'block',
        text: '用盾牌格挡 (体质检定 DC16)',
        requiredCheck: {
          attribute: 'constitution',
          dc: 16,
        },
        result: {
          success: true,
          message: '你用手臂挡住了大部分伤害！',
          healthChange: -Math.floor(damage * 0.3),
          experienceChange: 10,
        },
      },
      {
        id: 'take_hit',
        text: '硬抗伤害',
        result: {
          success: false,
          message: '你被陷阱击中了！',
          healthChange: -damage,
        },
      },
    ];

    return {
      id: cell.eventId || `trap-${uuidv4()}`,
      type: 'trap',
      title: '陷阱！',
      description: '地面突然塌陷，飞镖从墙壁中射出！你必须快速做出反应！',
      options,
    };
  }

  static generateMonsterEvent(cell: DungeonCell): GameEvent {
    const enemyTemplate = ENEMY_TEMPLATES[Math.floor(Math.random() * ENEMY_TEMPLATES.length)];
    const enemy: Enemy = {
      ...enemyTemplate,
      id: `enemy-${uuidv4().slice(0, 8)}`,
      currentHealth: enemyTemplate.maxHealth,
    };

    return {
      id: cell.eventId || `monster-${uuidv4()}`,
      type: 'monster',
      title: '遭遇敌人！',
      description: `一只${enemy.name}从阴影中跳了出来，挡住了你的去路！`,
      options: [
        {
          id: 'fight',
          text: '⚔️ 战斗！',
          result: {
            success: true,
            message: '战斗开始！',
            triggerCombat: true,
            enemy,
          },
        },
        {
          id: 'flee',
          text: '🏃 尝试逃跑 (敏捷检定 DC13)',
          requiredCheck: {
            attribute: 'dexterity',
            dc: 13,
          },
          result: {
            success: true,
            message: '你成功逃脱了！',
          },
        },
      ],
    };
  }

  static generateNPCEvent(cell: DungeonCell): GameEvent {
    const events = [
      {
        title: '神秘商人',
        description: '一位披着斗篷的神秘商人出现在你面前，他似乎有一些有趣的东西...',
        options: [
          {
            id: 'buy_potion',
            text: '购买生命药水 (30金币)',
            result: {
              success: true,
              message: '你购买了一瓶生命药水！',
              goldChange: -30,
              items: [
                {
                  ...LOOT_ITEMS['health-potion-1'],
                  id: `potion-${uuidv4().slice(0, 8)}`,
                },
              ],
            },
          },
          {
            id: 'buy_ring',
            text: '购买力量之戒 (80金币)',
            result: {
              success: true,
              message: '你获得了力量之戒！',
              goldChange: -80,
              items: [
                {
                  ...LOOT_ITEMS['ring-of-power'],
                  id: `ring-${uuidv4().slice(0, 8)}`,
                },
              ],
            },
          },
          {
            id: 'leave',
            text: '离开',
            result: {
              success: false,
              message: '你礼貌地告别了商人。',
            },
          },
        ],
      },
      {
        title: '治愈之泉',
        description: '你发现了一处散发着淡淡光芒的泉水，似乎有治愈的效果...',
        options: [
          {
            id: 'drink',
            text: '饮用泉水',
            result: {
              success: true,
              message: '温暖的能量流遍全身，你感到精神焕发！',
              healthChange: 50,
              manaChange: 30,
              experienceChange: 5,
            },
          },
          {
            id: 'bottle',
            text: '装瓶带走',
            result: {
              success: true,
              message: '你装了一些泉水带走。',
              items: [
                {
                  ...LOOT_ITEMS['health-potion-1'],
                  id: `potion-${uuidv4().slice(0, 8)}`,
                  name: '泉水瓶',
                  description: '装着治愈泉水的瓶子。',
                },
              ],
            },
          },
        ],
      },
      {
        title: '神秘祭坛',
        description: '一座古老的祭坛矗立在房间中央，上面刻着奇怪的符文...',
        options: [
          {
            id: 'pray',
            text: '虔诚祈祷 (感知检定 DC15)',
            requiredCheck: {
              attribute: 'wisdom',
              dc: 15,
            },
            result: {
              success: true,
              message: '神圣的力量降临于你！',
              experienceChange: 30,
              healthChange: 30,
            },
          },
          {
            id: 'sacrifice',
            text: '献上金币 (50金币)',
            result: {
              success: true,
              message: '祭坛接受了你的供奉，你感到力量在增长。',
              goldChange: -50,
              items: [
                {
                  ...LOOT_ITEMS['iron-helmet'],
                  id: `helmet-${uuidv4().slice(0, 8)}`,
                },
              ],
            },
          },
          {
            id: 'leave',
            text: '离开',
            result: {
              success: false,
              message: '你决定不打扰这座古老的祭坛。',
            },
          },
        ],
      },
    ];

    const event = events[Math.floor(Math.random() * events.length)];

    return {
      id: cell.eventId || `npc-${uuidv4()}`,
      type: 'npc',
      title: event.title,
      description: event.description,
      options: event.options.map((opt) => ({
        ...opt,
        id: `${opt.id}-${uuidv4().slice(0, 6)}`,
      })) as EventOption[],
    };
  }

  static generateBossEvent(cell: DungeonCell): GameEvent {
    return {
      id: cell.eventId || `boss-${uuidv4()}`,
      type: 'monster',
      title: '地牢守护者！',
      description: '一位强大的地牢守护者挡在出口前，它的眼中闪烁着危险的光芒。这是一场生死之战！',
      options: [
        {
          id: 'fight_boss',
          text: '⚔️ 挑战守护者！',
          result: {
            success: true,
            message: 'Boss战开始！',
            triggerCombat: true,
            enemy: {
              id: `boss-${uuidv4().slice(0, 8)}`,
              name: '地牢守护者',
              maxHealth: 200,
              currentHealth: 200,
              damage: 20,
              defense: 8,
              experienceReward: 200,
              lootTable: [
                { itemId: 'gold-sack-large', chance: 1.0 },
                { itemId: 'ring-of-power', chance: 0.5 },
              ],
              icon: '👑',
            },
          },
        },
      ],
    };
  }

  static canMoveTo(
    dungeon: DungeonMap,
    x: number,
    y: number
  ): boolean {
    if (x < 0 || x >= dungeon.width || y < 0 || y >= dungeon.height) {
      return false;
    }
    const dx = Math.abs(dungeon.playerPosition.x - x);
    const dy = Math.abs(dungeon.playerPosition.y - y);
    return dx + dy === 1;
  }

  static getAdjacentCells(dungeon: DungeonMap): DungeonCell[] {
    const { x, y } = dungeon.playerPosition;
    const adjacent: DungeonCell[] = [];
    const directions = [
      [0, -1],
      [1, 0],
      [0, 1],
      [-1, 0],
    ];

    for (const [dx, dy] of directions) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx >= 0 && nx < dungeon.width && ny >= 0 && ny < dungeon.height) {
        adjacent.push(dungeon.cells[ny][nx]);
      }
    }

    return adjacent;
  }
}
