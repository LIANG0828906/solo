import type { TimelineEvent } from '../../types';

export const events: TimelineEvent[] = [
  {
    id: 'event-1',
    year: -2560,
    title: '古埃及金字塔建造',
    description: '古埃及人建造吉萨大金字塔，展现了惊人的建筑技艺',
    civilization: '古埃及',
    color: '#4A148C',
    icon: '🏛️'
  },
  {
    id: 'event-2',
    year: -776,
    title: '古希腊奥林匹克诞生',
    description: '第一届古代奥林匹克运动会在希腊奥林匹亚举行',
    civilization: '古希腊',
    color: '#6A1B9A',
    icon: '🏺'
  },
  {
    id: 'event-3',
    year: -221,
    title: '秦统一中国',
    description: '秦始皇统一六国，修建万里长城抵御匈奴',
    civilization: '古中国',
    color: '#7B1FA2',
    icon: '🏯'
  },
  {
    id: 'event-4',
    year: -70,
    title: '古罗马斗兽场建成',
    description: '罗马大斗兽场完工，可容纳5万名观众观看角斗表演',
    civilization: '古罗马',
    color: '#8E24AA',
    icon: '🏟️'
  },
  {
    id: 'event-5',
    year: 600,
    title: '玛雅文明鼎盛',
    description: '玛雅文明进入古典期，建造了众多金字塔神庙',
    civilization: '古玛雅',
    color: '#9C27B0',
    icon: '🗿'
  },
  {
    id: 'event-6',
    year: 652,
    title: '大雁塔建成',
    description: '唐代大雁塔在长安建成，用于保存玄奘取回的经卷',
    civilization: '古中国',
    color: '#EF6C00',
    icon: '🗼'
  },
  {
    id: 'event-7',
    year: 1160,
    title: '吴哥窟修建',
    description: '高棉帝国苏利耶跋摩二世主持修建吴哥窟',
    civilization: '高棉',
    color: '#FF8F00',
    icon: '🛕'
  },
  {
    id: 'event-8',
    year: 1450,
    title: '文艺复兴鼎盛',
    description: '欧洲文艺复兴运动达到顶峰，佛罗伦萨大教堂穹顶完工',
    civilization: '欧洲',
    color: '#FFA000',
    icon: '⛪'
  }
];

export function getEventById(id: string): TimelineEvent | undefined {
  return events.find(e => e.id === id);
}

export function getColorByYear(year: number): string {
  const minYear = -3000;
  const maxYear = 1500;
  const t = Math.max(0, Math.min(1, (year - minYear) / (maxYear - minYear)));
  
  const startColor = { r: 74, g: 20, b: 140 };
  const endColor = { r: 255, g: 143, b: 0 };
  
  const r = Math.round(startColor.r + (endColor.r - startColor.r) * t);
  const g = Math.round(startColor.g + (endColor.g - startColor.g) * t);
  const b = Math.round(startColor.b + (endColor.b - startColor.b) * t);
  
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

export function formatYear(year: number): string {
  if (year < 0) {
    return `公元前${Math.abs(year)}年`;
  }
  return `公元${year}年`;
}
