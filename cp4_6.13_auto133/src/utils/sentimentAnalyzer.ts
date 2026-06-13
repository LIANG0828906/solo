import { SentimentResult } from '../types';

const positiveWords: string[] = [
  '喜欢', '很棒', '优秀', '推荐', '满意', '惊喜', '舒适', '方便', '实用', '美观',
  '赞', '好', '棒', '支持', '值得', '高品质', '用心', '创新', '贴心', '完美',
  '不错', '太好了', '超级', '最棒', '厉害', '牛', '绝了', 'yyds', '真香', '爱了',
  '好评', '点赞', '感谢', '幸福', '开心', '快乐', '舒服', '漂亮', '好看', '帅',
  '美', '酷', '炫', '优秀', '出色', '卓越', '精湛', '专业', '靠谱', '安心'
];

const negativeWords: string[] = [
  '失望', '糟糕', '差', '不满', '太贵', '浪费', '不好', '劣质', '后悔', '难用',
  '坑', '假', '差评', '吐槽', '弃用', '麻烦', '笨重', '易碎', '褪色', '差劲',
  '垃圾', '恶心', '讨厌', '烦人', '糟糕透顶', '无语', '醉了', '服了', '气人', '难过',
  '伤心', '痛苦', '焦虑', '担忧', '害怕', '担心', '不爽', '郁闷', '烦躁', '无聊',
  '浪费钱', '不值', '被骗', '假货', '次品', '山寨', '抄袭', '烂', '菜', '弱'
];

const negationWords: string[] = ['不', '没', '无', '非', '别', '莫', '未', '否'];

export function analyzeSentiment(text: string): SentimentResult {
  const foundPositive: string[] = [];
  const foundNegative: string[] = [];

  let positiveCount = 0;
  let negativeCount = 0;

  for (const word of positiveWords) {
    const regex = new RegExp(word, 'g');
    const matches = text.match(regex);
    if (matches) {
      const count = matches.length;
      positiveCount += count;
      for (let i = 0; i < count; i++) {
        foundPositive.push(word);
      }
    }
  }

  for (const word of negativeWords) {
    const regex = new RegExp(word, 'g');
    const matches = text.match(regex);
    if (matches) {
      const count = matches.length;
      negativeCount += count;
      for (let i = 0; i < count; i++) {
        foundNegative.push(word);
      }
    }
  }

  for (const neg of negationWords) {
    for (const word of positiveWords) {
      const negWord = neg + word;
      const regex = new RegExp(negWord, 'g');
      const matches = text.match(regex);
      if (matches) {
        const count = matches.length;
        positiveCount = Math.max(0, positiveCount - count);
        negativeCount += count;
        const idx = foundPositive.indexOf(word);
        if (idx > -1) foundPositive.splice(idx, 1);
        foundNegative.push(negWord);
      }
    }
    for (const word of negativeWords) {
      const negWord = neg + word;
      const regex = new RegExp(negWord, 'g');
      const matches = text.match(regex);
      if (matches) {
        const count = matches.length;
        negativeCount = Math.max(0, negativeCount - count);
        positiveCount += count;
        const idx = foundNegative.indexOf(word);
        if (idx > -1) foundNegative.splice(idx, 1);
        foundPositive.push(negWord);
      }
    }
  }

  const total = positiveCount + negativeCount;
  let score = 0;
  
  if (total > 0) {
    score = (positiveCount - negativeCount) / total;
  }

  let label: 'positive' | 'neutral' | 'negative' = 'neutral';
  if (score > 0.3) {
    label = 'positive';
  } else if (score < -0.3) {
    label = 'negative';
  }

  return {
    score,
    label,
    positiveWords: foundPositive,
    negativeWords: foundNegative,
    positiveCount: foundPositive.length,
    negativeCount: foundNegative.length
  };
}

export function getSentimentLabelText(label: string): string {
  const labels: Record<string, string> = {
    positive: '积极',
    neutral: '中性',
    negative: '消极'
  };
  return labels[label] || '中性';
}
