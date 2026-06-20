import { describe, it, expect } from 'vitest';
import { parseArticle, extractDates, findKeywordMatches, detectEventType, mergeNearbyDates } from '../src/tools/parser';
import type { Article, EventNode, EventType } from '../src/types';

function createMockArticle(overrides: Partial<Article> = {}): Article {
  return {
    id: 'test-article-1',
    title: '测试文章',
    content: '',
    createdAt: '2024-01-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('日期解析 - YYYY-MM-DD 格式', () => {
  it('应该正确解析标准 YYYY-MM-DD 日期', () => {
    const text = '项目于 2024-03-15 正式上线。';
    const dates = extractDates(text);
    expect(dates.length).toBe(1);
    expect(dates[0].date).toBe('2024-03-15');
  });

  it('应该正确解析多个日期', () => {
    const text = '2024-01-01 开始，2024-03-15 上线，2024-06-01 达成里程碑。';
    const dates = extractDates(text);
    expect(dates.length).toBe(3);
    expect(dates[0].date).toBe('2024-01-01');
    expect(dates[1].date).toBe('2024-03-15');
    expect(dates[2].date).toBe('2024-06-01');
  });

  it('应该忽略无效日期', () => {
    const text = '2024-13-01 无效月份，2024-02-30 无效日期。';
    const dates = extractDates(text);
    expect(dates.length).toBe(0);
  });
});

describe('日期解析 - 中文格式', () => {
  it('应该解析 2024年3月15日 格式', () => {
    const text = '项目于2024年3月15日正式发布。';
    const dates = extractDates(text);
    expect(dates.length).toBe(1);
    expect(dates[0].date).toBe('2024-03-15');
  });

  it('应该解析 2024年03月15日 补零格式', () => {
    const text = '2024年03月15日是一个重要的日子。';
    const dates = extractDates(text);
    expect(dates.length).toBe(1);
    expect(dates[0].date).toBe('2024-03-15');
  });

  it('应该解析带点号的日期 2024.03.15', () => {
    const text = '更新日期：2024.03.15';
    const dates = extractDates(text);
    expect(dates.length).toBe(1);
    expect(dates[0].date).toBe('2024-03-15');
  });

  it('应该解析斜杠分隔的日期 2024/03/15', () => {
    const text = '截止日期：2024/03/15';
    const dates = extractDates(text);
    expect(dates.length).toBe(1);
    expect(dates[0].date).toBe('2024-03-15');
  });
});

describe('日期解析 - 英文格式', () => {
  it('应该解析 Mar 15, 2024 格式', () => {
    const text = 'Released on Mar 15, 2024.';
    const dates = extractDates(text);
    expect(dates.length).toBe(1);
    expect(dates[0].date).toBe('2024-03-15');
  });

  it('应该解析 March 15, 2024 完整月份名', () => {
    const text = 'Launch date: March 15, 2024.';
    const dates = extractDates(text);
    expect(dates.length).toBe(1);
    expect(dates[0].date).toBe('2024-03-15');
  });

  it('应该解析 15 March 2024 日-月-年格式', () => {
    const text = 'Started on 15 March 2024.';
    const dates = extractDates(text);
    expect(dates.length).toBe(1);
    expect(dates[0].date).toBe('2024-03-15');
  });

  it('应该解析带序数词的日期 15th March 2024', () => {
    const text = 'The 15th March 2024 was a big day.';
    const dates = extractDates(text);
    expect(dates.length).toBe(1);
    expect(dates[0].date).toBe('2024-03-15');
  });

  it('应该解析 2024Mar15 紧凑格式', () => {
    const text = 'Build date: 2024Mar15';
    const dates = extractDates(text);
    expect(dates.length).toBe(1);
    expect(dates[0].date).toBe('2024-03-15');
  });

  it('应该正确识别所有12个月份', () => {
    const months = [
      { m: 'Jan', d: '2024-01-15' },
      { m: 'Feb', d: '2024-02-15' },
      { m: 'Mar', d: '2024-03-15' },
      { m: 'Apr', d: '2024-04-15' },
      { m: 'May', d: '2024-05-15' },
      { m: 'Jun', d: '2024-06-15' },
      { m: 'Jul', d: '2024-07-15' },
      { m: 'Aug', d: '2024-08-15' },
      { m: 'Sep', d: '2024-09-15' },
      { m: 'Oct', d: '2024-10-15' },
      { m: 'Nov', d: '2024-11-15' },
      { m: 'Dec', d: '2024-12-15' },
    ];
    for (const { m, d } of months) {
      const text = `${m} 15, 2024`;
      const dates = extractDates(text);
      expect(dates.length).toBeGreaterThanOrEqual(1);
      expect(dates[0].date).toBe(d);
    }
  });
});

describe('日期解析 - 相对日期', () => {
  it('应该解析 "今天"', () => {
    const text = '今天发布了新版本。';
    const dates = extractDates(text);
    expect(dates.length).toBe(1);
    const today = new Date();
    const expected = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    expect(dates[0].date).toBe(expected);
  });

  it('应该解析 "昨天"', () => {
    const text = '昨天完成了修复。';
    const dates = extractDates(text);
    expect(dates.length).toBe(1);
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const expected = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;
    expect(dates[0].date).toBe(expected);
  });

  it('应该解析 "3天前"', () => {
    const text = '这个功能3天前上线了。';
    const dates = extractDates(text);
    expect(dates.length).toBe(1);
    const d = new Date();
    d.setDate(d.getDate() - 3);
    const expected = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    expect(dates[0].date).toBe(expected);
  });

  it('应该解析 "2周前"', () => {
    const text = '项目启动于2周前。';
    const dates = extractDates(text);
    expect(dates.length).toBe(1);
  });

  it('应该解析 "1个月前"', () => {
    const text = '1个月前我们发布了v1.0。';
    const dates = extractDates(text);
    expect(dates.length).toBe(1);
  });
});

describe('日期解析 - 合并相近日期', () => {
  it('应该合并位置相近的重复日期', () => {
    const dates = [
      { date: '2024-01-01', index: 0, raw: '2024-01-01' },
      { date: '2024-01-01', index: 10, raw: '2024年1月1日' },
      { date: '2024-03-15', index: 100, raw: '2024-03-15' },
    ];
    const merged = mergeNearbyDates(dates, 50);
    expect(merged.length).toBe(2);
    expect(merged[0].date).toBe('2024-01-01');
    expect(merged[1].date).toBe('2024-03-15');
  });
});

describe('关键词匹配 - 事件类型识别', () => {
  it('应该识别里程碑关键词', () => {
    const text = '这是一个重要的里程碑，标志着项目的重大突破。';
    const matches = findKeywordMatches(text);
    const milestoneMatches = matches.filter((m) => m.type === 'milestone');
    expect(milestoneMatches.length).toBeGreaterThan(0);
  });

  it('应该识别成果关键词', () => {
    const text = '我们成功发布了新版本，用户数突破10万。';
    const matches = findKeywordMatches(text);
    const achievementMatches = matches.filter((m) => m.type === 'achievement');
    expect(achievementMatches.length).toBeGreaterThan(0);
  });

  it('应该识别迭代关键词', () => {
    const text = '本次迭代优化了性能，修复了若干bug。';
    const matches = findKeywordMatches(text);
    const iterationMatches = matches.filter((m) => m.type === 'iteration');
    expect(iterationMatches.length).toBeGreaterThan(0);
  });

  it('上下文加权：关键词在特定上下文中权重更高', () => {
    const text1 = '正式发布版本';
    const text2 = '预发布版本';
    const m1 = findKeywordMatches(text1);
    const m2 = findKeywordMatches(text2);
    expect(m1.length).toBeGreaterThanOrEqual(m2.length);
  });

  it('应该正确分类包含多种关键词的文本', () => {
    const milestoneText = '里程碑 重大突破 关键节点';
    const achievementText = '发布 上线 完成了';
    const iterationText = '迭代 更新 优化 修复';

    const milestoneMatches = findKeywordMatches(milestoneText);
    const achievementMatches = findKeywordMatches(achievementText);
    const iterationMatches = findKeywordMatches(iterationText);

    const type1 = detectEventType(milestoneText, milestoneMatches);
    const type2 = detectEventType(achievementText, achievementMatches);
    const type3 = detectEventType(iterationText, iterationMatches);

    expect(type1).toBe('milestone');
    expect(type2).toBe('achievement');
    expect(type3).toBe('iteration');
  });

  it('无关键词时根据文本长度给出默认分类', () => {
    const shortText = '小更新';
    const mediumText = 'a'.repeat(250);
    const longText = 'a'.repeat(600);

    const type1 = detectEventType(shortText, []);
    const type2 = detectEventType(mediumText, []);
    const type3 = detectEventType(longText, []);

    expect(type1).toBe('iteration');
    expect(type2).toBe('achievement');
    expect(type3).toBe('milestone');
  });
});

describe('文章解析 - 整体流程', () => {
  it('应该解析包含多个日期的文章为多个节点', () => {
    const content = `
# 项目发展史

2024-01-01 项目正式启动，团队组建完成。

## 第一阶段

2024-03-15 完成了MVP版本的开发，正式上线内测。

## 第二阶段

2024-06-01 用户数突破10万，达成重要里程碑。

2024-09-01 完成了新一轮融资，团队扩张。
`;
    const article = createMockArticle({ content, title: '项目发展史' });
    const nodes = parseArticle(article);

    expect(nodes.length).toBeGreaterThanOrEqual(4);
    expect(nodes.every((n) => n.id)).toBe(true);
    expect(nodes.every((n) => n.articleId === article.id)).toBe(true);
    expect(nodes[0].date < nodes[nodes.length - 1].date).toBe(true);
  });

  it('应该正确设置每个节点的事件类型', () => {
    const content = `
2024-01-01 项目迭代更新，修复了一些bug。

2024-03-15 正式发布1.0版本，这是一个重要的里程碑。

2024-06-01 用户数突破百万，取得重大成果。
`;
    const article = createMockArticle({ content });
    const nodes = parseArticle(article);

    expect(nodes.length).toBeGreaterThanOrEqual(3);

    const milestoneCount = nodes.filter((n) => n.eventType === 'milestone').length;
    const achievementCount = nodes.filter((n) => n.eventType === 'achievement').length;

    expect(milestoneCount).toBeGreaterThan(0);
    expect(achievementCount).toBeGreaterThan(0);
  });

  it('应该为每个节点生成标题和摘要', () => {
    const content = `
2024-03-15 发布v1.0版本
这是我们第一个正式版本，包含了核心功能。
经过三个月的开发，终于上线了。
`;
    const article = createMockArticle({ content });
    const nodes = parseArticle(article);

    expect(nodes.length).toBeGreaterThanOrEqual(1);
    expect(nodes[0].title.length).toBeGreaterThan(0);
    expect(nodes[0].summary.length).toBeGreaterThan(0);
    expect(nodes[0].rawText.length).toBeGreaterThan(0);
  });

  it('无日期文章应该按段落分割', () => {
    const content = `
第一段内容，讲了一些事情。

第二段内容，讲了另一些事情。

第三段内容，总结一下。
`;
    const article = createMockArticle({ content });
    const nodes = parseArticle(article);

    expect(nodes.length).toBeGreaterThanOrEqual(2);
  });

  it('极短文章应该生成单个节点', () => {
    const content = '只有一句话。';
    const article = createMockArticle({ content });
    const nodes = parseArticle(article);

    expect(nodes.length).toBe(1);
  });

  it('节点应该按日期升序排序', () => {
    const content = `
2024-06-01 六月的事件。

2024-01-01 一月的事件。

2024-03-15 三月的事件。
`;
    const article = createMockArticle({ content });
    const nodes = parseArticle(article);

    for (let i = 1; i < nodes.length; i++) {
      expect(nodes[i].date >= nodes[i - 1].date).toBe(true);
    }
  });

  it('应该检测节点间的引用关系', () => {
    const content = `
2024-01-01 项目启动。

2024-03-15 如前文所述，我们完成了第一阶段。

2024-06-01 参考之前的成果，我们继续推进。
`;
    const article = createMockArticle({ content });
    const nodes = parseArticle(article);

    const nodesWithRefs = nodes.filter((n) => n.references.length > 0);
    expect(nodesWithRefs.length).toBeGreaterThan(0);
  });
});

describe('解析精度评估', () => {
  it('日期识别准确率应达到85%以上', () => {
    const testCases = [
      { text: '2024-03-15', expected: '2024-03-15' },
      { text: '2024年3月15日', expected: '2024-03-15' },
      { text: 'Mar 15, 2024', expected: '2024-03-15' },
      { text: 'March 15, 2024', expected: '2024-03-15' },
      { text: '15 March 2024', expected: '2024-03-15' },
      { text: '2024.03.15', expected: '2024-03-15' },
      { text: '2024/03/15', expected: '2024-03-15' },
      { text: '03/15/2024', expected: '2024-03-15' },
      { text: '2024Mar15', expected: '2024-03-15' },
      { text: '2024-01-01', expected: '2024-01-01' },
      { text: '2024-12-31', expected: '2024-12-31' },
      { text: 'Dec 31, 2024', expected: '2024-12-31' },
    ];

    let correct = 0;
    for (const tc of testCases) {
      const dates = extractDates(tc.text);
      if (dates.length > 0 && dates[0].date === tc.expected) {
        correct++;
      }
    }

    const accuracy = correct / testCases.length;
    expect(accuracy).toBeGreaterThanOrEqual(0.85);
  });

  it('混合格式文章应该正确识别所有日期', () => {
    const content = `
# 项目时间线

## 启动阶段
2024年1月1日 项目正式启动。
团队成员到位，开始需求分析。

## 开发阶段
Mar 15, 2024 完成第一个迭代版本。
修复了一些关键问题。

2024.04.20 进行了第二次迭代。
优化了核心算法性能。

## 发布阶段
2024-06-01 正式上线发布。
这是一个重要的里程碑。

2024年9月1日 用户数突破十万。
`;
    const article = createMockArticle({ content });
    const nodes = parseArticle(article);

    const expectedDates = [
      '2024-01-01',
      '2024-03-15',
      '2024-04-20',
      '2024-06-01',
      '2024-09-01',
    ];

    expect(nodes.length).toBeGreaterThanOrEqual(expectedDates.length);

    const nodeDates = nodes.map((n) => n.date);
    for (const expected of expectedDates) {
      expect(nodeDates).toContain(expected);
    }
  });
});
