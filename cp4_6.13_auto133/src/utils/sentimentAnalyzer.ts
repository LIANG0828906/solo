import { SentimentResult } from '../types';

const positiveWords: string[] = [
  '喜欢', '很棒', '优秀', '推荐', '满意', '惊喜', '舒适', '方便', '实用', '美观',
  '赞', '好', '棒', '支持', '值得', '高品质', '用心', '创新', '贴心', '完美',
  '不错', '太好了', '超级', '最棒', '厉害', '牛', '绝了', 'yyds', '真香', '爱了',
  '好评', '点赞', '感谢', '幸福', '开心', '快乐', '舒服', '漂亮', '好看', '帅',
  '美', '酷', '炫', '出色', '卓越', '精湛', '专业', '靠谱', '安心', '好用',
  '精致', '优雅', '时尚', '大气', '上档次', '有质感', '物超所值', '性价比高'
];

const negativeWords: string[] = [
  '失望', '糟糕', '差', '不满', '太贵', '浪费', '不好', '劣质', '后悔', '难用',
  '坑', '假', '差评', '吐槽', '弃用', '麻烦', '笨重', '易碎', '褪色', '差劲',
  '垃圾', '恶心', '讨厌', '烦人', '糟糕透顶', '无语', '醉了', '服了', '气人', '难过',
  '伤心', '痛苦', '焦虑', '担忧', '害怕', '担心', '不爽', '郁闷', '烦躁', '无聊',
  '浪费钱', '不值', '被骗', '假货', '次品', '山寨', '抄袭', '烂', '菜', '弱',
  '粗糙', '简陋', '廉价', '低档', '没质感', '华而不实', '名不副实', '上当受骗'
];

const negationWords: string[] = ['不', '没', '无', '非', '别', '莫', '未', '否', '不是', '没有'];

const degreeAdverbs: Array<{ word: string; multiplier: number }> = [
  { word: '非常', multiplier: 1.8 },
  { word: '极其', multiplier: 2.0 },
  { word: '特别', multiplier: 1.6 },
  { word: '十分', multiplier: 1.5 },
  { word: '相当', multiplier: 1.4 },
  { word: '很', multiplier: 1.3 },
  { word: '挺', multiplier: 1.2 },
  { word: '蛮', multiplier: 1.2 },
  { word: '比较', multiplier: 1.1 },
  { word: '有点', multiplier: 0.7 },
  { word: '稍微', multiplier: 0.6 },
  { word: '略微', multiplier: 0.6 },
  { word: '不大', multiplier: 0.5 },
  { word: '不太', multiplier: 0.5 }
];

interface MatchedWord {
  word: string;
  index: number;
  weight: number;
  isPositive: boolean;
  isNegated: boolean;
  degreeMultiplier: number;
}

export function analyzeSentiment(text: string): SentimentResult {
  const matchedWords: MatchedWord[] = [];
  const foundPositive: string[] = [];
  const foundNegative: string[] = [];

  for (const word of positiveWords) {
    const regex = new RegExp(word, 'g');
    let match;
    while ((match = regex.exec(text)) !== null) {
      matchedWords.push({
        word,
        index: match.index,
        weight: 1,
        isPositive: true,
        isNegated: false,
        degreeMultiplier: 1
      });
    }
  }

  for (const word of negativeWords) {
    const regex = new RegExp(word, 'g');
    let match;
    while ((match = regex.exec(text)) !== null) {
      matchedWords.push({
        word,
        index: match.index,
        weight: 1,
        isPositive: false,
        isNegated: false,
        degreeMultiplier: 1
      });
    }
  }

  for (const matched of matchedWords) {
    const textBefore = text.substring(Math.max(0, matched.index - 6), matched.index);
    
    for (const neg of negationWords) {
      if (textBefore.endsWith(neg)) {
        matched.isNegated = true;
        break;
      }
    }
    
    for (const adv of degreeAdverbs) {
      if (textBefore.endsWith(adv.word)) {
        matched.degreeMultiplier = adv.multiplier;
        break;
      }
    }
  }

  const uniqueWords = removeOverlappingMatches(matchedWords);

  let positiveScore = 0;
  let negativeScore = 0;

  for (const matched of uniqueWords) {
    let score = matched.weight * matched.degreeMultiplier;
    
    if (matched.isNegated) {
      if (matched.isPositive) {
        negativeScore += score;
        foundNegative.push('不' + matched.word);
      } else {
        positiveScore += score;
        foundPositive.push('不' + matched.word);
      }
    } else {
      if (matched.isPositive) {
        positiveScore += score;
        foundPositive.push(matched.word);
      } else {
        negativeScore += score;
        foundNegative.push(matched.word);
      }
    }
  }

  const total = positiveScore + negativeScore;
  let score = 0;
  
  if (total > 0) {
    score = (positiveScore - negativeScore) / total;
  }

  score = Math.max(-1, Math.min(1, score));

  let label: 'positive' | 'neutral' | 'negative' = 'neutral';
  if (score > 0.3) {
    label = 'positive';
  } else if (score < -0.3) {
    label = 'negative';
  }

  return {
    score,
    label,
    positiveWords: [...new Set(foundPositive)],
    negativeWords: [...new Set(foundNegative)],
    positiveCount: foundPositive.length,
    negativeCount: foundNegative.length
  };
}

function removeOverlappingMatches(matches: MatchedWord[]): MatchedWord[] {
  if (matches.length === 0) return [];

  const sorted = [...matches].sort((a, b) => {
    if (a.index !== b.index) return a.index - b.index;
    return b.word.length - a.word.length;
  });

  const result: MatchedWord[] = [];
  let lastEnd = -1;

  for (const match of sorted) {
    const matchEnd = match.index + match.word.length;
    if (match.index >= lastEnd) {
      result.push(match);
      lastEnd = matchEnd;
    } else if (match.word.length > (result[result.length - 1]?.word.length || 0)) {
      result[result.length - 1] = match;
      lastEnd = matchEnd;
    }
  }

  return result;
}

export function getSentimentLabelText(label: string): string {
  const labels: Record<string, string> = {
    positive: '积极',
    neutral: '中性',
    negative: '消极'
  };
  return labels[label] || '中性';
}
