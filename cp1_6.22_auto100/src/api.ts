import { v4 as uuidv4 } from 'uuid';
import type { Work, UserAction, ActionType, AddWorkForm } from './types';

const DECAY_RATE = 0.05;
const DECAY_INTERVAL = 3600000;
const ACTION_WEIGHTS: Record<ActionType, number> = {
  view: 1,
  click: 2,
  favorite: 3,
  unfavorite: -3
};

const initialWorks: Work[] = [
  {
    id: uuidv4(),
    title: '企业级数据可视化平台',
    coverUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=modern%20data%20visualization%20dashboard%20with%20charts%20and%20graphs%20dark%20theme%20professional&image_size=landscape_16_9',
    description: '基于React和D3.js构建的企业级数据可视化平台，支持实时数据流、自定义图表和多维度数据分析。',
    tags: [
      { name: 'React', category: 'tech' },
      { name: 'D3.js', category: 'tech' },
      { name: 'TypeScript', category: 'tech' }
    ],
    createdAt: Date.now() - 86400000 * 7,
    score: 15,
    lastScoreUpdate: Date.now() - 86400000 * 2
  },
  {
    id: uuidv4(),
    title: '轻奢品牌视觉识别系统',
    coverUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=luxury%20brand%20identity%20design%20logo%20mockup%20elegant%20minimalist&image_size=landscape_16_9',
    description: '为高端时尚品牌设计的完整视觉识别系统，包含Logo、色彩体系、字体规范和应用场景设计。',
    tags: [
      { name: '品牌设计', category: 'design' },
      { name: 'VI系统', category: 'design' }
    ],
    createdAt: Date.now() - 86400000 * 5,
    score: 22,
    lastScoreUpdate: Date.now() - 3600000
  },
  {
    id: uuidv4(),
    title: '赛博朋克城市夜景插画',
    coverUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cyberpunk%20city%20night%20scene%20neon%20lights%20futuristic%20digital%20art%20illustration&image_size=landscape_16_9',
    description: '赛博朋克风格的城市夜景数字插画，展现未来都市的霓虹光影与科技氛围。',
    tags: [
      { name: '数字插画', category: 'illustration' },
      { name: '赛博朋克', category: 'illustration' }
    ],
    createdAt: Date.now() - 86400000 * 3,
    score: 18,
    lastScoreUpdate: Date.now() - 7200000
  },
  {
    id: uuidv4(),
    title: '电商小程序前端系统',
    coverUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=mobile%20ecommerce%20app%20interface%20design%20shopping%20modern%20ui&image_size=landscape_16_9',
    description: '基于Taro框架开发的跨端电商小程序，支持商品浏览、购物车、订单管理和支付功能。',
    tags: [
      { name: 'Taro', category: 'tech' },
      { name: '小程序', category: 'tech' },
      { name: 'Redux', category: 'tech' }
    ],
    createdAt: Date.now() - 86400000 * 10,
    score: 8,
    lastScoreUpdate: Date.now() - 86400000
  },
  {
    id: uuidv4(),
    title: '金融科技App UI设计',
    coverUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=fintech%20mobile%20app%20ui%20design%20banking%20finance%20modern%20clean&image_size=landscape_16_9',
    description: '金融科技类移动应用的完整UI/UX设计，包含40+页面设计稿和交互原型。',
    tags: [
      { name: 'UI设计', category: 'design' },
      { name: '移动端', category: 'design' },
      { name: 'Figma', category: 'design' }
    ],
    createdAt: Date.now() - 86400000 * 2,
    score: 25,
    lastScoreUpdate: Date.now() - 1800000
  },
  {
    id: uuidv4(),
    title: '奇幻森林角色设定集',
    coverUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=fantasy%20forest%20magical%20creatures%20character%20design%20concept%20art%20illustration&image_size=landscape_16_9',
    description: '原创奇幻森林主题的角色概念设计集，包含12个独特角色及其背景故事设定。',
    tags: [
      { name: '概念设计', category: 'illustration' },
      { name: '角色设定', category: 'illustration' },
      { name: '奇幻', category: 'illustration' }
    ],
    createdAt: Date.now() - 86400000 * 1,
    score: 12,
    lastScoreUpdate: Date.now() - 3600000 * 5
  },
  {
    id: uuidv4(),
    title: '智能物联网监控平台',
    coverUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=iot%20smart%20home%20monitoring%20dashboard%20technology%20interface%20dark&image_size=landscape_16_9',
    description: '集成多协议物联网设备的智能监控平台，支持实时数据采集、异常告警和远程控制。',
    tags: [
      { name: 'Node.js', category: 'tech' },
      { name: 'IoT', category: 'tech' },
      { name: 'WebSocket', category: 'tech' }
    ],
    createdAt: Date.now() - 86400000 * 14,
    score: 5,
    lastScoreUpdate: Date.now() - 86400000 * 3
  },
  {
    id: uuidv4(),
    title: '咖啡品牌包装设计',
    coverUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=premium%20coffee%20brand%20packaging%20design%20bags%20mockup%20artisan%20aesthetic&image_size=landscape_16_9',
    description: '精品手工咖啡品牌的全套包装设计，从咖啡豆袋到周边产品的视觉呈现。',
    tags: [
      { name: '包装设计', category: 'design' },
      { name: '品牌设计', category: 'design' }
    ],
    createdAt: Date.now() - 86400000 * 4,
    score: 16,
    lastScoreUpdate: Date.now() - 3600000 * 3
  },
  {
    id: uuidv4(),
    title: '东方神话手绘插画系列',
    coverUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=chinese%20mythology%20traditional%20style%20hand%20drawn%20illustration%20ancient%20gods&image_size=landscape_16_9',
    description: '中国古代神话传说主题的手绘插画系列，融合传统水墨技法与现代审美。',
    tags: [
      { name: '手绘', category: 'illustration' },
      { name: '东方美学', category: 'illustration' }
    ],
    createdAt: Date.now() - 86400000 * 6,
    score: 20,
    lastScoreUpdate: Date.now() - 3600000 * 2
  }
];

class MockDatabase {
  private works: Work[];
  private actions: UserAction[];
  private favorites: Set<string>;

  constructor() {
    this.works = [...initialWorks];
    this.actions = [];
    this.favorites = new Set();
  }

  private applyDecay(work: Work): number {
    const now = Date.now();
    const hoursElapsed = (now - work.lastScoreUpdate) / DECAY_INTERVAL;
    if (hoursElapsed < 1) return work.score;
    const decayedScore = work.score * Math.pow(1 - DECAY_RATE, Math.floor(hoursElapsed));
    return decayedScore;
  }

  private refreshScores(): void {
    this.works = this.works.map(work => {
      const decayed = this.applyDecay(work);
      const hoursElapsed = Math.floor((Date.now() - work.lastScoreUpdate) / DECAY_INTERVAL);
      if (hoursElapsed >= 1) {
        return {
          ...work,
          score: decayed,
          lastScoreUpdate: work.lastScoreUpdate + hoursElapsed * DECAY_INTERVAL
        };
      }
      return work;
    });
  }

  getWorks(): Work[] {
    this.refreshScores();
    return [...this.works];
  }

  getFavorites(): Set<string> {
    return new Set(this.favorites);
  }

  recordAction(workId: string, actionType: ActionType, duration?: number): boolean {
    const work = this.works.find(w => w.id === workId);
    if (!work) return false;

    this.refreshScores();

    const action: UserAction = {
      id: uuidv4(),
      workId,
      actionType,
      timestamp: Date.now(),
      duration
    };
    this.actions.push(action);

    const weight = ACTION_WEIGHTS[actionType];
    const workIndex = this.works.findIndex(w => w.id === workId);
    if (workIndex !== -1) {
      this.works[workIndex] = {
        ...this.works[workIndex],
        score: Math.max(0, this.works[workIndex].score + weight)
      };
    }

    if (actionType === 'favorite') {
      this.favorites.add(workId);
    } else if (actionType === 'unfavorite') {
      this.favorites.delete(workId);
    }

    return true;
  }

  getRecommendations(count?: number): Work[] {
    this.refreshScores();
    const sorted = [...this.works].sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.createdAt - b.createdAt;
    });
    return count ? sorted.slice(0, count) : sorted;
  }

  addWork(form: AddWorkForm): Work {
    const newWork: Work = {
      id: uuidv4(),
      title: form.title,
      coverUrl: form.coverUrl,
      description: form.description,
      tags: form.tags,
      createdAt: Date.now(),
      score: 0,
      lastScoreUpdate: Date.now()
    };
    this.works.push(newWork);
    return newWork;
  }

  getFavoriteCount(workId: string): number {
    return this.actions.filter(
      a => a.workId === workId && a.actionType === 'favorite'
    ).length - this.actions.filter(
      a => a.workId === workId && a.actionType === 'unfavorite'
    ).length;
  }

  getTopThree(): Work[] {
    return this.getRecommendations(3);
  }
}

const db = new MockDatabase();

const delay = <T>(data: T, ms = 100): Promise<T> =>
  new Promise(resolve => setTimeout(() => resolve(data), ms));

export const fetchWorks = async (): Promise<{ works: Work[]; favorites: Set<string> }> => {
  const works = db.getWorks();
  const favorites = db.getFavorites();
  return delay({ works, favorites });
};

export const recordAction = async (
  workId: string,
  actionType: ActionType,
  duration?: number
): Promise<boolean> => {
  return delay(db.recordAction(workId, actionType, duration));
};

export const getRecommendations = async (count?: number): Promise<Work[]> => {
  return delay(db.getRecommendations(count));
};

export const addWork = async (form: AddWorkForm): Promise<Work> => {
  return delay(db.addWork(form));
};

export const getTopThree = async (): Promise<Work[]> => {
  return delay(db.getTopThree());
};

export const getFavoriteCount = (workId: string): number => {
  return db.getFavoriteCount(workId);
};
