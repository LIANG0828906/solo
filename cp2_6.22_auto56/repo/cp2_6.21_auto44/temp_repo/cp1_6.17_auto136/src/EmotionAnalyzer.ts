const EMOTION_LEXICON: Record<string, string> = {
  '希望': '#FFB347',
  '忧伤': '#5B86E5',
  '宁静': '#A8E6CF',
  '温暖': '#FF6B6B',
  '孤独': '#7B68EE',
  '喜悦': '#FFD93D',
  '思念': '#C9B1FF',
  '迷茫': '#B0BEC5',
  '勇气': '#FF8A65',
  '温柔': '#F8BBD0',
  '自由': '#80DEEA',
  '感恩': '#AED581',
  '悲伤': '#90A4AE',
  '安心': '#B2DFDB',
  '愤怒': '#EF5350',
  '惊喜': '#FFAB40',
  '期待': '#FFD54F',
  '释然': '#CE93D8',
  '深情': '#F48FB1',
  '坚强': '#FF7043',
};

const EMOTION_KEYWORDS = Object.keys(EMOTION_LEXICON);

export interface EmotionResult {
  keyword: string;
  color: string;
}

export function analyzeEmotions(lines: string[]): EmotionResult[] {
  const text = lines.join('');
  const results: EmotionResult[] = [];
  for (const kw of EMOTION_KEYWORDS) {
    if (text.includes(kw)) {
      results.push({ keyword: kw, color: EMOTION_LEXICON[kw] });
    }
    if (results.length >= 3) break;
  }
  if (results.length === 0) {
    const defaultEmotions = ['宁静', '温柔'];
    for (const kw of defaultEmotions) {
      results.push({ keyword: kw, color: EMOTION_LEXICON[kw] });
      if (results.length >= 1) break;
    }
  }
  return results;
}

export { EMOTION_LEXICON };
