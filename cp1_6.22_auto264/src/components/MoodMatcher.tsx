import { mockResources, Resource } from '../data/mockResources';

export interface MatchResult {
  keyword: string;
  label: string;
  labelBg: string;
  labelColor: string;
  resources: Resource[];
}

const KEYWORD_MAP: Record<string, string[]> = {
  焦虑: ['焦虑', '紧张', '不安', '担忧', '害怕', '慌'],
  开心: ['开心', '高兴', '快乐', '幸福', '兴奋', '愉快', '满足'],
  平静: ['平静', '放松', '安宁', '从容', '淡定', '舒适', '安心'],
  疲惫: ['疲惫', '累', '疲倦', '无力', '困倦', '乏力', '精疲力竭'],
  愤怒: ['愤怒', '生气', '烦躁', '恼怒', '恼火', '暴躁'],
};

const MOOD_VALUES: Record<string, number> = {
  开心: 2,
  平静: 1,
  焦虑: -1,
  疲惫: -1,
  愤怒: -2,
};

export function getMoodValue(keyword: string): number {
  return MOOD_VALUES[keyword] || 0;
}

export function matchMood(text: string): MatchResult[] {
  const results: MatchResult[] = [];
  const matchedKeywords = new Set<string>();

  for (const [mood, synonyms] of Object.entries(KEYWORD_MAP)) {
    for (const synonym of synonyms) {
      if (text.includes(synonym)) {
        matchedKeywords.add(mood);
        break;
      }
    }
  }

  const labelMap: Record<string, { label: string; labelBg: string; labelColor: string }> = {
    焦虑: { label: '缓解焦虑', labelBg: '#FF6B6B', labelColor: '#FFFFFF' },
    疲惫: { label: '恢复活力', labelBg: '#FF6B6B', labelColor: '#FFFFFF' },
    愤怒: { label: '平复情绪', labelBg: '#FF6B6B', labelColor: '#FFFFFF' },
    平静: { label: '温馨提示', labelBg: '#48C9B0', labelColor: '#FFFFFF' },
    开心: { label: '保持好心情', labelBg: '#F7DC6F', labelColor: '#333333' },
  };

  for (const keyword of matchedKeywords) {
    const keywordSynonyms = KEYWORD_MAP[keyword] || [];
    const matchedResources = mockResources
      .filter((r) => r.tags.some((tag) => keywordSynonyms.includes(tag) || tag === keyword))
      .slice(0, 3);

    if (matchedResources.length > 0) {
      const labelInfo = labelMap[keyword] || { label: '温馨提示', labelBg: '#48C9B0', labelColor: '#FFFFFF' };
      results.push({
        keyword,
        label: labelInfo.label,
        labelBg: labelInfo.labelBg,
        labelColor: labelInfo.labelColor,
        resources: matchedResources,
      });
    }
  }

  return results;
}
