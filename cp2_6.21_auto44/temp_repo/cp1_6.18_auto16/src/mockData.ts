export interface YearEvent {
  id: string;
  date: string;
  title: string;
  summary: string;
  color: string;
  imageIndex: number;
  sentimentIntensity: number;
  sentiment: 'positive' | 'neutral' | 'negative';
  sentimentWeek: number[];
}

export interface MonthGroup {
  month: number;
  events: YearEvent[];
}

const TITLES: Record<number, string[]> = {
  1: ['新年开局', '冬季突破', '年度规划启动'],
  2: ['团队重组', '春季预演', '创意激荡'],
  3: ['春季发布', '项目上线', '合作签约'],
  4: ['增长加速', '用户突破', '产品迭代'],
  5: ['夏日冲刺', '数据新高', '品牌升级'],
  6: ['年中总结', '技术突破', '市场拓展'],
  7: ['全球发布', '社区成长', '里程碑达成'],
  8: ['效率革新', '设计焕新', '战略调整'],
  9: ['秋季攻势', '竞赛获奖', '生态扩展'],
  10: ['技术峰会', '开源贡献', '用户庆典'],
  11: ['双十一突破', '内容升级', '年终冲刺'],
  12: ['年度收官', '成果回顾', '未来展望'],
};

const SUMMARIES: Record<number, string[]> = {
  1: ['以全新的姿态开启年度征程，团队士气高涨，目标清晰明确。', '在寒冷的冬季完成了关键技术突破，为全年奠定基础。'],
  2: ['完成了团队架构优化，引入多位核心人才，协作效率显著提升。', '春季头脑风暴产生了三个高价值项目方向。'],
  3: ['旗舰产品2.0版本正式发布，首周下载量突破十万。', '与三家行业领先企业达成战略合作协议。'],
  4: ['月活用户增长200%，创下历史新高。', '完成三轮产品迭代，核心体验指标提升45%。'],
  5: ['夏季冲刺计划超额完成，关键项目交付提前两周。', '数据中心处理量突破日均千万级，系统稳定性达99.99%。'],
  6: ['半年度总结显示多项核心指标超出预期，团队信心倍增。', '自研算法获得国际竞赛银奖，技术影响力大幅提升。'],
  7: ['产品正式进入国际市场，覆盖15个国家和地区。', '开发者社区突破十万成员，生态体系初具规模。'],
  8: ['内部工具链升级完成，研发效率提升60%。', '品牌视觉全面焕新，用户满意度提升25个百分点。'],
  9: ['秋季产品矩阵发布，三款新品同时上线。', '在行业年度评选中获最佳创新奖和最佳用户体验奖。'],
  10: ['成功举办年度技术峰会，吸引超过5000名开发者参与。', '开源项目GitHub Star突破一万，社区贡献者超300人。'],
  11: ['双十一期间交易额同比增长180%，刷新多项纪录。', '内容平台完成从图文到视频的全面升级。'],
  12: ['年度收官总结：营收增长150%，用户规模翻倍。', '发布明年战略路线图，聚焦AI和全球化两大方向。'],
};

const COLORS = [
  '#E8B4B8', '#B8D4E3', '#C8E6C9', '#FFE0B2',
  '#D1C4E9', '#B2EBF2', '#F8BBD0', '#DCEDC8',
  '#FFCCBC', '#CFD8DC', '#FFF9C4', '#B2DFDB',
];

function rand(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateSentimentWeek(base: number): number[] {
  const week: number[] = [];
  for (let i = 0; i < 7; i++) {
    const variation = (Math.random() - 0.5) * 8;
    week.push(Math.max(-10, Math.min(10, base + variation)));
  }
  return week.map(v => Math.round(v * 10) / 10);
}

export function generateYearEvents(): MonthGroup[] {
  const months: MonthGroup[] = [];

  for (let m = 1; m <= 12; m++) {
    const eventCount = rand(3, 14);
    const events: YearEvent[] = [];
    const titles = TITLES[m];
    const summaries = SUMMARIES[m];

    for (let i = 0; i < eventCount; i++) {
      const sentimentRoll = Math.random();
      let sentiment: 'positive' | 'neutral' | 'negative';
      let baseIntensity: number;

      if (sentimentRoll < 0.45) {
        sentiment = 'positive';
        baseIntensity = rand(3, 10);
      } else if (sentimentRoll < 0.8) {
        sentiment = 'neutral';
        baseIntensity = rand(-3, 3);
      } else {
        sentiment = 'negative';
        baseIntensity = rand(-10, -3);
      }

      const day = rand(1, 28);
      const dateStr = `2025-${String(m).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

      events.push({
        id: `evt-${m}-${i}`,
        date: dateStr,
        title: titles[i % titles.length] + (eventCount > titles.length ? ` · ${i + 1}` : ''),
        summary: summaries[i % summaries.length],
        color: COLORS[(m + i) % COLORS.length],
        imageIndex: rand(1, 10),
        sentimentIntensity: baseIntensity,
        sentiment,
        sentimentWeek: generateSentimentWeek(baseIntensity),
      });
    }

    events.sort((a, b) => a.date.localeCompare(b.date));

    months.push({ month: m, events });
  }

  return months;
}
