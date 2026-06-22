import type { TimelineEvent, Artifact } from '../../types';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const events: TimelineEvent[] = [
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

const artifacts: Record<string, Artifact> = {
  'event-1': {
    id: 'artifact-1',
    name: '吉萨金字塔群',
    era: '公元前2560年',
    civilization: '古埃及',
    modelPath: '/models/pyramid.glb',
    description: '吉萨金字塔群是古埃及文明最伟大的建筑成就，其中胡夫金字塔是古代世界七大奇迹中唯一保存至今的。金字塔高达146.5米，由约230万块石灰岩砌成，每块平均重2.5吨。其精确的几何结构和天文定位至今仍令科学家惊叹，展现了古埃及人非凡的数学和工程能力。',
    relatedEvents: ['event-2', 'event-5'],
    modelType: 'pyramid'
  },
  'event-2': {
    id: 'artifact-2',
    name: '帕特农神庙',
    era: '公元前447年',
    civilization: '古希腊',
    modelPath: '/models/parthenon.glb',
    description: '帕特农神庙是雅典卫城的主体建筑，为祭祀雅典娜女神而建。这座多立克式神庙代表了古希腊建筑的最高成就，其完美的比例、精美的浮雕装饰展现了古希腊人对美的极致追求。神庙的黄金比例和视觉校正技巧至今仍是建筑史上的典范。',
    relatedEvents: ['event-1', 'event-4'],
    modelType: 'parthenon'
  },
  'event-3': {
    id: 'artifact-3',
    name: '万里长城',
    era: '公元前221年',
    civilization: '古中国',
    modelPath: '/models/greatwall.glb',
    description: '万里长城是世界上最宏伟的军事防御工程，始建于春秋战国时期，秦始皇统一后将各国长城连接并延伸。长城东起山海关，西至嘉峪关，全长超过2万公里，宛如一条巨龙蜿蜒于中国北方的群山峻岭之间，是中华民族坚韧不拔精神的象征。',
    relatedEvents: ['event-6', 'event-8'],
    modelType: 'wall'
  },
  'event-4': {
    id: 'artifact-4',
    name: '罗马斗兽场',
    era: '公元80年',
    civilization: '古罗马',
    modelPath: '/models/colosseum.glb',
    description: '罗马斗兽场是古罗马文明的象征，可容纳5万名观众观看角斗士比赛和公共庆典。这座椭圆形建筑高48米，拥有80个入口，其复杂的拱券结构和柱式组合对后世西方建筑产生了深远影响。斗兽场的地下通道系统和观众席设计体现了古罗马卓越的工程技术。',
    relatedEvents: ['event-2', 'event-8'],
    modelType: 'colosseum'
  },
  'event-5': {
    id: 'artifact-5',
    name: '玛雅金字塔神庙',
    era: '公元600年',
    civilization: '古玛雅',
    modelPath: '/models/maya.glb',
    description: '玛雅金字塔是中美洲文明的杰出代表，与埃及金字塔不同，玛雅金字塔主要用于宗教祭祀和天文观测。蒂卡尔城的金字塔高达60米，顶部建有神庙，阶梯上雕刻着精美的浮雕。玛雅人精确的天文历法和先进的数学系统通过这些建筑得以永恒流传。',
    relatedEvents: ['event-1', 'event-7'],
    modelType: 'temple'
  },
  'event-6': {
    id: 'artifact-6',
    name: '大雁塔',
    era: '公元652年',
    civilization: '古中国',
    modelPath: '/models/pagoda.glb',
    description: '大雁塔位于西安慈恩寺内，由唐代著名僧人玄奘主持修建，用于保存其从印度取回的佛经、佛像和舍利。塔身七层，高64.5米，是唐代楼阁式砖塔的典范。大雁塔见证了丝绸之路的文化交流，是中印文化交流的重要象征。',
    relatedEvents: ['event-3', 'event-7'],
    modelType: 'pagoda'
  },
  'event-7': {
    id: 'artifact-7',
    name: '吴哥窟',
    era: '公元1113年',
    civilization: '高棉',
    modelPath: '/models/angkhor.glb',
    description: '吴哥窟是世界上最大的宗教建筑，原为供奉毗湿奴的印度教寺庙，后改为佛教寺庙。寺庙主体建筑高65米，周围环绕着宽190米的护城河。精美的浮雕回廊讲述着印度教史诗和高棉王朝的历史，其宏伟的规模和精湛的工艺令人叹为观止。',
    relatedEvents: ['event-5', 'event-6'],
    modelType: 'mosque'
  },
  'event-8': {
    id: 'artifact-8',
    name: '佛罗伦萨大教堂',
    era: '公元1436年',
    civilization: '欧洲',
    modelPath: '/models/cathedral.glb',
    description: '佛罗伦萨大教堂的穹顶是文艺复兴建筑的里程碑，由建筑师布鲁内莱斯基设计。这座直径45米的巨大穹顶无需任何支撑结构，其建造技术在当时堪称奇迹。穹顶的建成标志着文艺复兴时期建筑艺术的巅峰，展现了人类对完美和永恒的追求。',
    relatedEvents: ['event-2', 'event-4'],
    modelType: 'cathedral'
  }
};

export async function getEvents(): Promise<TimelineEvent[]> {
  await delay(300 + Math.random() * 500);
  return [...events];
}

export async function getEventById(id: string): Promise<TimelineEvent | undefined> {
  await delay(200 + Math.random() * 300);
  return events.find(e => e.id === id);
}

export async function getArtifactByEventId(eventId: string): Promise<Artifact | undefined> {
  await delay(800 + Math.random() * 2200);
  return artifacts[eventId];
}
