export type EventType =
  | 'sandstorm'
  | 'bandits'
  | 'ancientWell'
  | 'merchant'
  | 'lostTraveler'
  | 'mirage'
  | 'scorpion'
  | 'oasisRest'
  | 'treasure'
  | 'camelSick';

export interface EventChoice {
  text: string;
  effect: EventEffect;
}

export interface EventEffect {
  water?: number;
  food?: number;
  morale?: number;
  camelDamage?: number;
  camelHeal?: number;
  stopMovement?: boolean;
  resumeMovement?: boolean;
  gold?: number;
  message?: string;
}

export interface GameEvent {
  id: EventType;
  title: string;
  description: string;
  choices: EventChoice[];
  timerDuration: number;
}

export class EventSystem {
  private events: Map<EventType, GameEvent>;
  private currentEvent: GameEvent | null;
  private eventTimer: number;
  private eventActive: boolean;
  private onChoiceCallback: ((effect: EventEffect) => void) | null;

  constructor() {
    this.events = new Map();
    this.currentEvent = null;
    this.eventTimer = 0;
    this.eventActive = false;
    this.onChoiceCallback = null;
    this.initializeEvents();
  }

  private initializeEvents(): void {
    this.events.set('sandstorm', {
      id: 'sandstorm',
      title: '沙暴来袭！',
      description: '远方天际卷起漫天黄沙，一场沙暴正在逼近！你需要立即做出决定。',
      timerDuration: 15,
      choices: [
        {
          text: '原地搭帐篷躲避',
          effect: { stopMovement: true, water: -5, morale: -5, message: '你们搭起帐篷，在狂风中艰难地等待沙暴过去。' }
        },
        {
          text: '冒险继续前进',
          effect: { camelDamage: 20, water: -15, morale: -10, message: '你们在沙暴中艰难前行，骆驼们受到了伤害。' }
        }
      ]
    });

    this.events.set('bandits', {
      id: 'bandits',
      title: '遭遇劫匪！',
      description: '沙丘后突然冲出一群蒙面劫匪，他们手持弯刀，拦住了商队的去路。',
      timerDuration: 15,
      choices: [
        {
          text: '战斗抵抗',
          effect: { camelDamage: 15, food: -10, morale: 10, message: '经过一番激战，你们击退了劫匪，但也付出了代价。' }
        },
        {
          text: '付买路钱',
          effect: { water: -20, food: -20, morale: -15, message: '你交出了部分物资，劫匪放你们通过。士气受到打击。' }
        },
        {
          text: '尝试逃跑',
          effect: { water: -10, camelDamage: 10, morale: -5, message: '你们策马狂奔，勉强甩掉了劫匪，但物资有所损失。' }
        }
      ]
    });

    this.events.set('ancientWell', {
      id: 'ancientWell',
      title: '发现古井！',
      description: '商队在沙丘间发现了一口被掩埋的古井，井口刻满了古老的符文。',
      timerDuration: 15,
      choices: [
        {
          text: '挖掘取水',
          effect: { water: 40, morale: 15, message: '经过一番挖掘，你们取出了清凉甘甜的井水！' }
        },
        {
          text: '仔细研究符文',
          effect: { water: 20, morale: 20, message: '你发现符文记载着附近的水源位置，获得了珍贵的信息。' }
        }
      ]
    });

    this.events.set('merchant', {
      id: 'merchant',
      title: '路遇商人',
      description: '一位独行的商人向你走来，他愿意与你交换物资。',
      timerDuration: 15,
      choices: [
        {
          text: '用食物换水',
          effect: { water: 25, food: -20, morale: 5, message: '你用食物换取了珍贵的水源。' }
        },
        {
          text: '用水换食物',
          effect: { water: -20, food: 25, morale: 5, message: '你用水换取了充足的干粮。' }
        },
        {
          text: '礼貌拒绝',
          effect: { morale: 0, message: '你婉拒了商人的提议，继续赶路。' }
        }
      ]
    });

    this.events.set('lostTraveler', {
      id: 'lostTraveler',
      title: '迷路的旅人',
      description: '你在路边发现一个奄奄一息的旅人，他请求你给予帮助。',
      timerDuration: 15,
      choices: [
        {
          text: '慷慨救助',
          effect: { water: -15, food: -10, morale: 20, message: '你救助了旅人，他感激涕零，告诉了你一条捷径。商队士气大振！' }
        },
        {
          text: '给予少量帮助',
          effect: { water: -5, food: -5, morale: 5, message: '你给了他一些水和食物，他道谢后离去。' }
        },
        {
          text: '视而不见',
          effect: { morale: -20, message: '你选择无视他，继续前进。骆驼夫们面露不悦。' }
        }
      ]
    });

    this.events.set('mirage', {
      id: 'mirage',
      title: '海市蜃楼',
      description: '远处出现了一座金碧辉煌的宫殿，在热浪中若隐若现。',
      timerDuration: 15,
      choices: [
        {
          text: '前往探索',
          effect: { water: -20, stamina: -10, morale: -10, camelDamage: 5, message: '你们走了很远才发现那只是幻象，白白浪费了体力和水源。' }
        },
        {
          text: '保持冷静继续前进',
          effect: { morale: 10, message: '你识破了海市蜃楼的幻象，带领商队继续前行。大家对你的智慧深感佩服。' }
        }
      ]
    });

    this.events.set('scorpion', {
      id: 'scorpion',
      title: '毒蝎袭击！',
      description: '扎营时，一只巨大的沙漠毒蝎从沙中钻出，向骆驼发起攻击！',
      timerDuration: 15,
      choices: [
        {
          text: '奋力击杀',
          effect: { camelDamage: 10, morale: 5, message: '经过一番搏斗，你们杀死了毒蝎，但有骆驼被蜇伤了。' }
        },
        {
          text: '小心驱赶',
          effect: { camelDamage: 5, water: -5, message: '你们小心翼翼地驱赶毒蝎，损失相对较小。' }
        }
      ]
    });

    this.events.set('oasisRest', {
      id: 'oasisRest',
      title: '意外绿洲',
      description: '你们意外发现了一片小型绿洲，清澈的泉水和茂密的椰枣树令人精神振奋。',
      timerDuration: 15,
      choices: [
        {
          text: '停留休息一天',
          effect: { water: 30, food: 20, morale: 20, camelHeal: 20, stopMovement: true, message: '商队在绿洲好好休息了一番，骆驼们恢复了体力。' }
        },
        {
          text: '快速补给后继续',
          effect: { water: 15, food: 10, morale: 10, message: '你们快速补给后继续赶路，节省了时间。' }
        }
      ]
    });

    this.events.set('treasure', {
      id: 'treasure',
      title: '沙中宝藏',
      description: '骆驼踢开沙子，露出了一个古老的箱子，上面刻着神秘的图案。',
      timerDuration: 15,
      choices: [
        {
          text: '打开箱子',
          effect: { water: 10, food: 10, morale: 25, gold: 50, message: '箱子里装满了古老的金币和干粮！真是意外之财！' }
        },
        {
          text: '谨慎起见，不打开',
          effect: { morale: -5, message: '你担心有诈，决定不冒险。大家略感失望。' }
        }
      ]
    });

    this.events.set('camelSick', {
      id: 'camelSick',
      title: '骆驼生病',
      description: '一峰骆驼突然病倒了，看起来非常虚弱。',
      timerDuration: 15,
      choices: [
        {
          text: '停下来照料',
          effect: { water: -10, food: -5, camelHeal: 25, stopMovement: true, morale: 10, message: '你停下来细心照料病骆驼，它逐渐恢复了健康。' }
        },
        {
          text: '让它休息，其他骆驼分担负重',
          effect: { camelDamage: 15, morale: -5, message: '病骆驼勉强跟上队伍，但状态越来越差。' }
        },
        {
          text: '放弃这峰骆驼',
          effect: { camelDamage: 100, morale: -30, message: '你无奈地放弃了病骆驼。商队气氛变得沉重。' }
        }
      ]
    });
  }

  public triggerRandomEvent(): GameEvent | null {
    if (this.eventActive) return null;

    const eventTypes = Array.from(this.events.keys());
    const randomType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
    const event = this.events.get(randomType);

    if (event) {
      this.currentEvent = event;
      this.eventTimer = event.timerDuration;
      this.eventActive = true;
      return event;
    }

    return null;
  }

  public getEventById(id: EventType): GameEvent | undefined {
    return this.events.get(id);
  }

  public update(deltaTime: number): boolean {
    if (!this.eventActive || !this.currentEvent) return false;

    this.eventTimer -= deltaTime;

    if (this.eventTimer <= 0) {
      this.eventTimer = 0;
      this.autoChoose();
      return true;
    }

    return false;
  }

  private autoChoose(): void {
    if (!this.currentEvent || !this.onChoiceCallback) return;

    const defaultChoice = this.currentEvent.choices[0];
    this.makeChoice(0);
  }

  public makeChoice(index: number): EventEffect | null {
    if (!this.currentEvent || !this.eventActive) return null;
    if (index < 0 || index >= this.currentEvent.choices.length) return null;

    const choice = this.currentEvent.choices[index];
    const effect = choice.effect;

    if (this.onChoiceCallback) {
      this.onChoiceCallback(effect);
    }

    this.eventActive = false;
    this.currentEvent = null;

    return effect;
  }

  public isEventActive(): boolean {
    return this.eventActive;
  }

  public getCurrentEvent(): GameEvent | null {
    return this.currentEvent;
  }

  public getEventTimer(): number {
    return this.eventTimer;
  }

  public setOnChoiceCallback(callback: (effect: EventEffect) => void): void {
    this.onChoiceCallback = callback;
  }

  public closeEvent(): void {
    this.eventActive = false;
    this.currentEvent = null;
    this.eventTimer = 0;
  }
}
