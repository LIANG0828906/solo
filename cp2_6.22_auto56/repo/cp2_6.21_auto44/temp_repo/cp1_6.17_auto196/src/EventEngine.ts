import { EventBus } from './EventBus';
import { GameLogic, ItemType } from './GameLogic';

interface EventTemplate {
  id: string;
  name: string;
  description: string;
  type: 'item' | 'trap' | 'puzzle' | 'npc' | 'story' | 'rest' | 'merchant' | 'mystery' | 'blessing' | 'curse';
  minRoomDistance?: number;
  execute: (game: GameLogic) => EventResult;
}

interface EventResult {
  message: string;
  type: 'info' | 'danger' | 'success' | 'story' | 'puzzle' | 'merchant';
  choices?: EventChoice[];
}

interface EventChoice {
  text: string;
  effect: (game: GameLogic) => string;
}

interface StoryState {
  helpedTraveler: boolean | null;
  foundChest: boolean | null;
  sparedBandit: boolean | null;
}

const storyState: StoryState = {
  helpedTraveler: null,
  foundChest: null,
  sparedBandit: null,
};

const eventTemplates: EventTemplate[] = [
  {
    id: 'treasure_gold',
    name: '金币宝箱',
    description: '你发现了一个闪闪发光的宝箱！',
    type: 'item',
    execute: (game) => {
      const amount = Math.floor(Math.random() * 5) + 3;
      game.addItem('coin', amount);
      game.player.eventsEncountered++;
      return { message: `你打开了宝箱，获得了${amount}枚金币！`, type: 'success' };
    },
  },
  {
    id: 'trap_spike',
    name: '尖刺陷阱',
    description: '你踩到了隐藏的尖刺陷阱！',
    type: 'trap',
    execute: (game) => {
      const damage = Math.floor(Math.random() * 15) + 10;
      game.applyDamage(damage);
      game.player.eventsEncountered++;
      return { message: `尖刺从地面刺出，你受到了${damage}点伤害！`, type: 'danger' };
    },
  },
  {
    id: 'puzzle_riddle',
    name: '谜题之门',
    description: '一扇古老的门挡住了去路，上面刻着谜题。',
    type: 'puzzle',
    execute: (game) => {
      game.player.eventsEncountered++;
      return {
        message: '石门上刻着："我有城市却没有房屋，有森林却没有树木，有水域却没有鱼。我是什么？"',
        type: 'puzzle',
        choices: [
          {
            text: '地图',
            effect: (g) => {
              g.addItem('potion');
              g.addStamina(10);
              return '正确！石门缓缓打开，你获得了一瓶药水并恢复了10点体力！';
            },
          },
          {
            text: '梦境',
            effect: () => '错误！石门发出刺耳的声音，但随后缓缓打开了。',
          },
          {
            text: '影子',
            effect: () => '错误！一阵狂风从门缝吹出，你被吓退了。',
          },
        ],
      };
    },
  },
  {
    id: 'npc_merchant',
    name: '流浪商人',
    description: '一位神秘的商人在角落等候。',
    type: 'merchant',
    execute: (game) => {
      game.player.eventsEncountered++;
      return {
        message: '流浪商人微笑着说："旅行者，看看我的货物吧，或许有你需要的东西。"',
        type: 'merchant',
        choices: [
          {
            text: '花费5金币购买药水',
            effect: (g) => {
              if (g.removeItem('coin', 5)) {
                g.addItem('potion');
                return '交易成功！你获得了一瓶药水。';
              }
              return '金币不足！商人摇了摇头。';
            },
          },
          {
            text: '花费8金币购买火把',
            effect: (g) => {
              if (g.removeItem('coin', 8)) {
                g.addItem('torch');
                return '交易成功！你获得了一支火把。';
              }
              return '金币不足！商人叹了口气。';
            },
          },
          {
            text: '花费10金币购买护盾',
            effect: (g) => {
              if (g.removeItem('coin', 10)) {
                g.addItem('shield');
                return '交易成功！你获得了一面护盾。';
              }
              return '金币不足！商人失望地看着你。';
            },
          },
          {
            text: '离开',
            effect: () => '你向商人告别，继续前行。',
          },
        ],
      };
    },
  },
  {
    id: 'story_traveler',
    name: '受伤的旅人',
    description: '你发现了一位受伤的旅人。',
    type: 'story',
    execute: (game) => {
      game.player.eventsEncountered++;
      return {
        message: '一位受伤的旅人倒在地上，他虚弱地向你伸出手："请...帮帮我..."',
        type: 'story',
        choices: [
          {
            text: '给予药水救助',
            effect: (g) => {
              if (g.player.inventory.potion.quantity > 0) {
                g.removeItem('potion');
                storyState.helpedTraveler = true;
                g.addItem('coin', 10);
                g.addItem('shield');
                return '旅人感激涕零，赠予你10枚金币和一面护盾作为答谢。"愿光明指引你的道路！"';
              }
              storyState.helpedTraveler = false;
              return '你没有药水可以给予，只能遗憾地离开。旅人失望地闭上了眼睛...';
            },
          },
          {
            text: '忽略并离开',
            effect: (g) => {
              storyState.helpedTraveler = false;
              if (Math.random() < 0.3) {
                g.applyDamage(5);
                return '你转身离开时，旅人愤怒地诅咒了你，你感到了一阵刺痛！';
              }
              return '你选择了无视旅人，继续在迷宫中前行。心中隐约感到一丝愧疚...';
            },
          },
        ],
      };
    },
  },
  {
    id: 'rest_camp',
    name: '安全营地',
    description: '你发现了一个安全的休息点。',
    type: 'rest',
    execute: (game) => {
      const staminaGain = Math.floor(Math.random() * 15) + 10;
      const hpGain = Math.floor(Math.random() * 10) + 5;
      game.addStamina(staminaGain);
      game.heal(hpGain);
      game.player.eventsEncountered++;
      return { message: `你在营地里休息片刻，恢复了${staminaGain}点体力和${hpGain}点生命值。`, type: 'success' };
    },
  },
  {
    id: 'mystery_fountain',
    name: '神秘喷泉',
    description: '你发现了一座古老的喷泉。',
    type: 'mystery',
    execute: (game) => {
      game.player.eventsEncountered++;
      const isGood = Math.random() > 0.4;
      if (isGood) {
        const hpGain = Math.floor(Math.random() * 20) + 10;
        game.heal(hpGain);
        return { message: `你饮用了喷泉的水，一股温暖的力量涌遍全身！恢复了${hpGain}点生命值。`, type: 'success' };
      } else {
        const damage = Math.floor(Math.random() * 10) + 5;
        game.applyDamage(damage);
        return { message: `喷泉的水散发着诡异的气息，你感到身体一阵虚弱...受到${damage}点伤害！`, type: 'danger' };
      }
    },
  },
  {
    id: 'blessing_altar',
    name: '祝福祭坛',
    description: '你发现了一座散发着柔和光芒的祭坛。',
    type: 'blessing',
    execute: (game) => {
      game.player.eventsEncountered++;
      const bonus = Math.floor(Math.random() * 3);
      if (bonus === 0) {
        game.addStamina(20);
        return { message: '祭坛的力量注入你的身体，恢复了20点体力！', type: 'success' };
      } else if (bonus === 1) {
        game.heal(25);
        return { message: '祭坛的圣光治愈了你的伤口，恢复了25点生命值！', type: 'success' };
      } else {
        game.addItem('potion');
        return { message: '祭坛上出现了一瓶闪烁着光芒的药水！', type: 'success' };
      }
    },
  },
  {
    id: 'curse_shadow',
    name: '暗影诅咒',
    description: '黑暗中传来低语声...',
    type: 'curse',
    execute: (game) => {
      game.player.eventsEncountered++;
      const curseType = Math.floor(Math.random() * 3);
      if (curseType === 0) {
        const damage = Math.floor(Math.random() * 12) + 8;
        game.applyDamage(damage);
        return { message: `暗影缠绕着你，你受到了${damage}点伤害！`, type: 'danger' };
      } else if (curseType === 1) {
        game.player.stamina = Math.max(0, game.player.stamina - 15);
        return { message: '暗影吸取了你的能量，你损失了15点体力！', type: 'danger' };
      } else {
        if (game.player.inventory.coin.quantity > 0) {
          const lost = Math.min(game.player.inventory.coin.quantity, 3);
          game.removeItem('coin', lost);
          return { message: `暗影偷走了你${lost}枚金币！`, type: 'danger' };
        }
        const damage = Math.floor(Math.random() * 8) + 5;
        game.applyDamage(damage);
        return { message: `暗影猛击了你，受到${damage}点伤害！`, type: 'danger' };
      }
    },
  },
  {
    id: 'story_chest',
    name: '古老的箱子',
    description: '你发现了一个尘封已久的箱子。',
    type: 'story',
    execute: (game) => {
      game.player.eventsEncountered++;
      return {
        message: '一个古老的箱子放在房间中央，箱子上刻着警告："贪婪者将付出代价。"',
        type: 'story',
        choices: [
          {
            text: '小心翼翼地打开',
            effect: (g) => {
              storyState.foundChest = true;
              const reward = Math.random();
              if (reward < 0.5) {
                g.addItem('coin', 8);
                return '你谨慎地打开箱子，发现了8枚金币！看来小心是值得的。';
              } else {
                g.addItem('torch');
                g.addItem('potion');
                return '箱子里有一支火把和一瓶药水，你的谨慎得到了回报！';
              }
            },
          },
          {
            text: '粗暴地撬开',
            effect: (g) => {
              storyState.foundChest = false;
              const damage = Math.floor(Math.random() * 15) + 5;
              g.applyDamage(damage);
              g.addItem('coin', 5);
              return `箱子触发了陷阱！你受到了${damage}点伤害，但仍然获得了5枚金币。贪婪果然有代价。`;
            },
          },
          {
            text: '不去触碰',
            effect: () => {
              storyState.foundChest = null;
              return '你选择不去冒险，转身离开。也许这是明智之举。';
            },
          },
        ],
      };
    },
  },
  {
    id: 'story_bandit',
    name: '落魄的盗贼',
    description: '你遇到了一个被陷阱困住的盗贼。',
    type: 'story',
    execute: (game) => {
      game.player.eventsEncountered++;
      return {
        message: '一个盗贼被困在绳索陷阱中，他看到你后眼中闪过复杂的神色："放我走，我会报答你...或者你也可以搜刮我的财物。"',
        type: 'story',
        choices: [
          {
            text: '释放他',
            effect: (g) => {
              storyState.sparedBandit = true;
              g.addItem('coin', 7);
              g.addStamina(5);
              if (storyState.helpedTraveler) {
                g.addItem('shield');
                return '盗贼感激不已，不仅给了你7枚金币，还从怀中掏出一面护盾相赠。"看来这世上还有善良之人。"';
              }
              return '盗贼给了你7枚金币作为谢礼，消失在了黑暗中...';
            },
          },
          {
            text: '拿走他的财物',
            effect: (g) => {
              storyState.sparedBandit = false;
              g.addItem('coin', 12);
              if (Math.random() < 0.5) {
                g.applyDamage(8);
                return '你拿走了12枚金币，但盗贼趁你不备踢了你一脚！受到8点伤害。';
              }
              return '你搜刮了12枚金币，盗贼用怨恨的眼神看着你离去。';
            },
          },
        ],
      };
    },
  },
  {
    id: 'trap_pit',
    name: '深坑陷阱',
    description: '地面突然塌陷！',
    type: 'trap',
    execute: (game) => {
      const damage = Math.floor(Math.random() * 20) + 5;
      game.applyDamage(damage);
      game.player.eventsEncountered++;
      return { message: `你差点掉入深坑！勉强稳住身体，但受到了${damage}点伤害。`, type: 'danger' };
    },
  },
  {
    id: 'item_torch',
    name: '墙壁上的火把',
    description: '墙上插着一支还能使用的火把。',
    type: 'item',
    execute: (game) => {
      game.addItem('torch');
      game.player.eventsEncountered++;
      return { message: '你从墙上取下了火把，它可以照亮周围的黑暗区域。', type: 'success' };
    },
  },
  {
    id: 'item_map_fragment',
    name: '地图碎片',
    description: '你发现了一张褪色的地图碎片。',
    type: 'item',
    execute: (game) => {
      game.addItem('map');
      game.player.eventsEncountered++;
      return { message: '地图碎片上标注了通往出口的路径，你将其仔细收好。', type: 'success' };
    },
  },
];

const triggeredRooms = new Set<number>();

export class EventEngine {
  private game: GameLogic;
  private pendingChoiceCallback: ((choiceIndex: number) => void) | null = null;

  constructor(game: GameLogic) {
    this.game = game;

    EventBus.on<{ x: number; y: number; roomId: number }>('room:entered', (data) => {
      this.handleRoomEntry(data);
    });

    EventBus.on<{ choiceIndex: number }>('event:choiceMade', (data) => {
      if (this.pendingChoiceCallback) {
        this.pendingChoiceCallback(data.choiceIndex);
        this.pendingChoiceCallback = null;
      }
    });

    EventBus.on('game:reset', () => {
      triggeredRooms.clear();
      storyState.helpedTraveler = null;
      storyState.foundChest = null;
      storyState.sparedBandit = null;
      this.pendingChoiceCallback = null;
    });
  }

  private handleRoomEntry(data: { x: number; y: number; roomId: number }): void {
    if (triggeredRooms.has(data.roomId)) return;

    const distFromStart = data.x + data.y;
    const distFromExit = (this.game.maze.width - 1 - data.x) + (this.game.maze.height - 1 - data.y);

    let triggerChance = 0.35;
    if (distFromStart < 5) triggerChance = 0.2;
    if (distFromExit < 5) triggerChance = 0.5;

    if (Math.random() > triggerChance) return;

    const eligibleEvents = eventTemplates.filter(e => {
      if (e.minRoomDistance && distFromStart < e.minRoomDistance) return false;
      return true;
    });

    if (eligibleEvents.length === 0) return;

    const event = eligibleEvents[Math.floor(Math.random() * eligibleEvents.length)];
    triggeredRooms.add(data.roomId);

    const result = event.execute(this.game);

    if (result.choices && result.choices.length > 0) {
      EventBus.emit('event:showChoices', {
        title: event.name,
        message: result.message,
        choices: result.choices.map(c => c.text),
      });

      this.pendingChoiceCallback = (choiceIndex: number) => {
        const choice = result.choices![choiceIndex];
        if (choice) {
          const outcome = choice.effect(this.game);
          EventBus.emit('event:outcome', { message: outcome, type: 'info' });
          EventBus.emit('player:stateChanged', this.game.getPlayerInfo());
        }
      };
    } else {
      EventBus.emit('event:triggered', { message: result.message, type: result.type, name: event.name });
    }
  }
}
