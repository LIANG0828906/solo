import type { HistoryEvent, Category } from './types';

const colorPalettes: Record<Category, string[][]> = {
  science: [
    ['#6366f1', '#818cf8', '#a5b4fc', '#c7d2fe'],
    ['#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe'],
    ['#06b6d4', '#22d3ee', '#67e8f9', '#a5f3fc'],
    ['#14b8a6', '#2dd4bf', '#5eead4', '#99f6e4'],
  ],
  culture: [
    ['#ec4899', '#f472b6', '#f9a8d4', '#fbcfe8'],
    ['#a855f7', '#c084fc', '#d8b4fe', '#e9d5ff'],
    ['#f43f5e', '#fb7185', '#fda4af', '#fecdd3'],
    ['#eab308', '#facc15', '#fde047', '#fef08a'],
  ],
  politics: [
    ['#0891b2', '#22d3ee', '#67e8f9', '#a5f3fc'],
    ['#0284c7', '#38bdf8', '#7dd3fc', '#bae6fd'],
    ['#0ea5e9', '#38bdf8', '#7dd3fc', '#bae6fd'],
    ['#06b6d4', '#22d3ee', '#67e8f9', '#a5f3fc'],
  ],
  sports: [
    ['#22c55e', '#4ade80', '#86efac', '#bbf7d0'],
    ['#10b981', '#34d399', '#6ee7b7', '#a7f3d0'],
    ['#84cc16', '#a3e635', '#bef264', '#d9f99d'],
    ['#16a34a', '#4ade80', '#86efac', '#bbf7d0'],
  ],
  nature: [
    ['#ca8a04', '#eab308', '#facc15', '#fde047'],
    ['#a16207', '#ca8a04', '#eab308', '#facc15'],
    ['#65a30d', '#84cc16', '#a3e635', '#bef264'],
    ['#15803d', '#22c55e', '#4ade80', '#86efac'],
  ],
};

const eventTemplates: Record<Category, { titles: string[]; descriptions: string[] }> = {
  science: {
    titles: [
      '重大科学发现',
      '新技术突破',
      '诺贝尔奖颁发',
      '太空探索里程碑',
      '医学革命',
      '计算机技术革新',
      '人工智能进步',
      '基因研究突破',
      '新能源技术',
      '量子计算进展',
    ],
    descriptions: [
      '科学家们在这一领域取得了突破性进展，为未来的研究奠定了坚实基础。\n这项成果被认为是近十年来最重要的发现之一。',
      '新技术的出现彻底改变了人们的生活方式，推动了社会的快速发展。\n全球各地的研究机构纷纷投入相关研究。',
      '本年度的诺贝尔奖授予了在该领域做出杰出贡献的科学家。\n他们的工作对人类文明产生了深远影响。',
      '人类在探索宇宙的道路上又迈出了重要一步。\n这次任务收集了大量宝贵的科学数据。',
      '医学界迎来了革命性的突破，为无数患者带来了希望。\n临床试验显示出令人振奋的效果。',
    ],
  },
  culture: {
    titles: [
      '经典作品问世',
      '艺术运动兴起',
      '国际文化盛事',
      '流行文化现象',
      '文学巨匠诞生',
      '电影艺术突破',
      '音乐流派诞生',
      '建筑杰作落成',
      '文化遗产保护',
      '东西方文化交流',
    ],
    descriptions: [
      '这部作品一经问世便引起轰动，成为传世经典。\n它深刻地影响了后世的艺术创作。',
      '一场新的艺术运动在全球范围内展开，重新定义了艺术的边界。\n艺术家们以大胆的创新挑战传统。',
      '国际文化盛事吸引了来自世界各地的参与者。\n不同文化在这里碰撞交融，绽放异彩。',
      '一股新的流行文化风潮席卷全球，成为时代的象征。\n年轻人以独特的方式表达自我。',
      '这位文学大师的诞生为世界文坛增添了璀璨的光芒。\n他的作品被翻译成数十种语言。',
    ],
  },
  politics: {
    titles: [
      '重要历史时刻',
      '国际协议签署',
      '政治格局变化',
      '独立运动胜利',
      '和平协议达成',
      '体制改革推进',
      '外交关系突破',
      '国际组织成立',
      '民主进程发展',
      '区域合作深化',
    ],
    descriptions: [
      '这是一个载入史册的重要时刻，改变了历史的进程。\n无数人为之奋斗的目标终于实现。',
      '多国领导人共同签署了具有里程碑意义的国际协议。\n这标志着全球合作进入新阶段。',
      '世界政治格局发生了深刻变化，新的力量平衡正在形成。\n各国纷纷调整外交策略。',
      '经过长期艰苦的斗争，独立运动最终取得胜利。\n一个新的国家诞生在世界舞台上。',
      '经过多轮谈判，交战双方终于达成和平协议。\n人民迎来了期盼已久的和平。',
    ],
  },
  sports: {
    titles: [
      '奥运会盛事',
      '世界杯决战',
      '世界纪录刷新',
      '传奇运动员退役',
      '新兴运动兴起',
      '体育产业腾飞',
      '大满贯奇迹',
      '国家荣耀时刻',
      '体育科技突破',
      '女子体育发展',
    ],
    descriptions: [
      '全球瞩目的体育盛事隆重开幕，各国运动员同场竞技。\n这届赛事创造了多项新纪录。',
      '决赛吸引了数十亿观众的目光，最终以戏剧性的方式决出胜负。\n这场比赛将永载史册。',
      '运动员以惊人的表现刷新了世界纪录，震惊了整个体育界。\n专家们认为这是一个时代的突破。',
      '体坛传奇宣布退役，带走了一个时代的记忆。\n球迷们以各种方式表达敬意。',
      '一项新兴运动迅速风靡全球，吸引了大量年轻人参与。\n职业联赛也在快速发展中。',
    ],
  },
  nature: {
    titles: [
      '重大自然现象',
      '环境保护突破',
      '新物种发现',
      '气候变迁记录',
      '自然灾难事件',
      '生态系统恢复',
      '国家公园设立',
      '珍稀物种保护',
      '海洋探索发现',
      '绿色革命兴起',
    ],
    descriptions: [
      '自然界展示了它壮观的一面，让人类感受到自身的渺小。\n科学家对这一现象进行了深入研究。',
      '全球环保努力取得了重要突破，生态环境明显改善。\n多国承诺加大环保投入。',
      '探险队在偏远地区发现了此前未知的新物种。\n这一发现丰富了人类对生物多样性的认识。',
      '气候数据显示地球环境正在发生显著变化。\n科学家呼吁全球共同应对挑战。',
      '一场严重的自然灾害袭击了该地区，造成了重大损失。\n国际社会纷纷伸出援手。',
    ],
  },
};

function generateEvents(): HistoryEvent[] {
  const events: HistoryEvent[] = [];
  const categories: Category[] = ['science', 'culture', 'politics', 'sports', 'nature'];
  let id = 1;

  for (let year = 1870; year <= 2023; year++) {
    const eventsPerYear = Math.floor(Math.random() * 3) + 1;
    
    for (let i = 0; i < eventsPerYear; i++) {
      const category = categories[Math.floor(Math.random() * categories.length)];
      const templates = eventTemplates[category];
      const titleIndex = Math.floor(Math.random() * templates.titles.length);
      const descIndex = Math.floor(Math.random() * templates.descriptions.length);
      const paletteIndex = Math.floor(Math.random() * colorPalettes[category].length);
      
      const yearSuffix = year % 100 === 0 ? 's' : '';
      const titleVariation = Math.random() > 0.5 ? `（${year}）` : '';
      
      events.push({
        id: `event-${id++}`,
        year,
        category,
        title: `${templates.titles[titleIndex]}${yearSuffix}${titleVariation}`,
        description: templates.descriptions[descIndex],
        colors: colorPalettes[category][paletteIndex],
      });
    }
  }

  return events;
}

export const events: HistoryEvent[] = generateEvents();

export function getEventsByYear(year: number): HistoryEvent[] {
  return events.filter(e => e.year === year);
}

export function getYearsWithEvents(): number[] {
  const years = new Set(events.map(e => e.year));
  return Array.from(years).sort((a, b) => a - b);
}

export function getEventsInRange(startYear: number, endYear: number): HistoryEvent[] {
  return events.filter(e => e.year >= startYear && e.year <= endYear);
}
