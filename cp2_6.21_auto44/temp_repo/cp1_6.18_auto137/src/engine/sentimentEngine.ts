import { tagMap } from '../data/tagMap';

export interface SentimentResult {
  label: 'positive' | 'negative' | 'neutral';
  strength: number;
  comment: string;
}

const techKeywords = ['技术', '科学', '研究', '数据', 'AI', '人工智能', '算法', '芯片', '量子', '宇宙'];
const lifeKeywords = ['生活', '日常', '温暖', '美好', '家庭', '朋友', '美食', '旅行', '时光', '幸福'];

function detectCategory(text: string): 'tech' | 'life' | 'neutral' {
  const lowerText = text.toLowerCase();
  for (const kw of techKeywords) {
    if (lowerText.includes(kw.toLowerCase())) return 'tech';
  }
  for (const kw of lifeKeywords) {
    if (lowerText.includes(kw.toLowerCase())) return 'life';
  }
  return 'neutral';
}

function generateComment(
  title: string,
  label: 'positive' | 'negative' | 'neutral',
  category: 'tech' | 'life' | 'neutral'
): string {
  const techComments = {
    positive: [
      `技术突破令人振奋，${title}展现前沿实力。`,
      `创新驱动发展，该成果标志领域新高度。`,
      `精密的技术架构，彰显工程美学。`,
      `性能指标优异，为行业树立新标杆。`,
    ],
    negative: [
      `技术方案存在缺陷，需进一步优化。`,
      `数据表明稳定性不足，风险可控但需警惕。`,
      `架构设计有疏漏，安全隐患亟待处理。`,
      `性能瓶颈明显，迭代空间较大。`,
    ],
    neutral: [
      `技术分析已完成，数据呈现典型特征。`,
      `实验结果符合预期，结论客观中立。`,
      `指标处于正常区间，无显著异常。`,
      `研究方法严谨，数据可信度高。`,
    ],
  };

  const lifeComments = {
    positive: [
      `这是一段温柔的记忆，${title}的美好在时光中静静流淌，温暖着每一个想起它的瞬间。`,
      `生活的小确幸在此刻定格，那些平凡而珍贵的片段，构成了我们最真实的幸福。`,
      `岁月静好，愿这份美好能一直陪伴你，在每个清晨醒来时都能感受到生活的善意。`,
      `温暖的瞬间值得被珍藏，它是疲惫生活里的英雄梦想，让人心底柔软。`,
    ],
    negative: [
      `遗憾也是生活的一部分，它让我们学会珍惜当下，在下一个转角遇见更好的自己。`,
      `时光不会倒流，但记忆会带着我们前行，那些过往终将成为成长的养分。`,
      `人生总有些许不如意，正是这些不完美，让完整的生命更有厚度和重量。`,
      `不必沉溺于遗憾，每一次经历都是宝贵的课程，让未来的脚步更坚定。`,
    ],
    neutral: [
      `平淡的日常里藏着生活的真谛，在柴米油盐间感受岁月静好的温度。`,
      `这就是生活本来的样子，不疾不徐，在平凡中寻找属于自己的节奏。`,
      `每一个普通的日子都值得被记住，它们串联起我们独一无二的人生轨迹。`,
      `简单的快乐最真实，在烟火气里发现生活的美好与感动。`,
    ],
  };

  const neutralComments = {
    positive: [`内容积极向上，传递正向价值。`],
    negative: [`内容偏消极，建议多角度审视。`],
    neutral: [`内容客观中立，信息呈现完整。`],
  };

  const pool = category === 'tech' ? techComments : category === 'life' ? lifeComments : neutralComments;
  const comments = pool[label];
  let comment = comments[Math.floor(Math.random() * comments.length)];

  if (comment.length > 80) {
    comment = comment.slice(0, 77) + '...';
  }

  return comment;
}

export function analyze(title: string, description: string): SentimentResult {
  const text = `${title} ${description}`;
  const lowerText = text.toLowerCase();

  let positiveScore = 0;
  let negativeScore = 0;
  let neutralScore = 0;
  let matchCount = 0;

  for (const [keyword, mapping] of Object.entries(tagMap)) {
    if (lowerText.includes(keyword.toLowerCase())) {
      if (mapping.label === 'positive') positiveScore += mapping.strength;
      else if (mapping.label === 'negative') negativeScore += mapping.strength;
      else neutralScore += mapping.strength;
      matchCount++;
    }
  }

  let label: 'positive' | 'negative' | 'neutral' = 'neutral';
  let strength = 0.5;

  if (matchCount > 0) {
    if (positiveScore > negativeScore && positiveScore > neutralScore) {
      label = 'positive';
      strength = Math.min(1, positiveScore / matchCount);
    } else if (negativeScore > positiveScore && negativeScore > neutralScore) {
      label = 'negative';
      strength = Math.min(1, negativeScore / matchCount);
    } else {
      label = 'neutral';
      strength = Math.min(1, neutralScore / matchCount || 0.5);
    }
  }

  const category = detectCategory(text);
  const comment = generateComment(title, label, category);

  return { label, strength, comment };
}
