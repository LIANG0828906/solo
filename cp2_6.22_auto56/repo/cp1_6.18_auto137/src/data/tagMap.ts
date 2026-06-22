export interface TagMapping {
  label: 'positive' | 'negative' | 'neutral';
  strength: number;
}

export const tagMap: Record<string, TagMapping> = {
  '创新': { label: 'positive', strength: 0.85 },
  '突破': { label: 'positive', strength: 0.9 },
  '优秀': { label: 'positive', strength: 0.8 },
  '温暖': { label: 'positive', strength: 0.75 },
  '美好': { label: 'positive', strength: 0.82 },
  '成功': { label: 'positive', strength: 0.88 },
  '智能': { label: 'positive', strength: 0.7 },
  '高效': { label: 'positive', strength: 0.78 },
  '故障': { label: 'negative', strength: 0.75 },
  '问题': { label: 'negative', strength: 0.6 },
  '危机': { label: 'negative', strength: 0.85 },
  '风险': { label: 'negative', strength: 0.7 },
  '遗憾': { label: 'negative', strength: 0.65 },
  '技术': { label: 'neutral', strength: 0.5 },
  '科学': { label: 'neutral', strength: 0.55 },
  '研究': { label: 'neutral', strength: 0.52 },
  '数据': { label: 'neutral', strength: 0.48 },
  '生活': { label: 'neutral', strength: 0.5 },
  '日常': { label: 'neutral', strength: 0.45 },
  '新闻': { label: 'neutral', strength: 0.5 },
};
