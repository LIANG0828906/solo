import { Sentiment, PoemLine } from '../types';

const rhythmMap: Record<string, string[]> = {
  ang: ['光', '茫', '霜', '香', '伤', '场', '望', '浪', '方', '长', '扬', '藏', '响', '想', '象'],
  ing: ['星', '影', '行', '晴', '情', '声', '轻', '明', '静', '听', '梦', '醒', '风', '灯', '冷'],
  u: ['路', '雾', '暮', '树', '度', '处', '舞', '诉', '悟', '入', '护', '渡', '故', '雨', '语'],
  an: ['山', '间', '眠', '缘', '天', '前', '年', '边', '眼', '烟', '颜', '言', '远', '还', '传'],
  en: ['人', '春', '尘', '魂', '痕', '门', '深', '温', '吻', '分', '真', '身', '神', '根', '枕']
};

const rhythmKeys = Object.keys(rhythmMap);

const wordBankBySentiment: Record<Sentiment, { adjectives: string[]; nouns: string[]; verbs: string[] }> = {
  sad: {
    adjectives: ['孤寂的', '清冷的', '萧瑟的', '沉默的', '黯淡的', '落寞的', '憔悴的', '迷离的'],
    nouns: ['夜雨', '残月', '落花', '孤灯', '长街', '旧巷', '寒秋', '离人'],
    verbs: ['飘落', '消散', '沉寂', '凝望', '低吟', '独守', '回望', '轻叹']
  },
  joyful: {
    adjectives: ['明媚的', '灿烂的', '温暖的', '欢快的', '轻盈的', '缤纷的', '绚烂的', '清甜的'],
    nouns: ['暖阳', '繁花', '溪流', '微风', '云雀', '彩虹', '花海', '笑靥'],
    verbs: ['绽放', '飞舞', '歌唱', '荡漾', '闪耀', '拥抱', '追寻', '翩跹']
  },
  neutral: {
    adjectives: ['悠远的', '静谧的', '淡然的', '澄澈的', '空灵的', '朦胧的', '恬淡的', '悠然的'],
    nouns: ['青山', '白云', '远峰', '古木', '清泉', '石径', '亭台', '星河'],
    verbs: ['流转', '静观', '遥想', '缓步', '凭栏', '远眺', '闲坐', '漫行']
  },
  romantic: {
    adjectives: ['缱绻的', '温柔的', '摇曳的', '朦胧的', '脉脉的', '盈盈的', '袅袅的', '幽幽的'],
    nouns: ['明月', '星河', '锦书', '红豆', '青丝', '西楼', '秋水', '芳华'],
    verbs: ['低语', '轻吻', '携手', '相拥', '入梦', '遥望', '心念', '暗许']
  },
  melancholy: {
    adjectives: ['萧瑟的', '苍茫的', '寂寥的', '幽幽的', '淡淡的', '悠悠的', '深深的', '隐隐的'],
    nouns: ['故园', '归鸿', '残阳', '落叶', '孤帆', '寒钟', '老巷', '旧笺'],
    verbs: ['梦回', '望断', '吹尽', '泣露', '独倚', '暗数', '追忆', '愁听']
  }
};

const englishWordBank: { adjectives: string[]; nouns: string[]; verbs: string[] } = {
  adjectives: ['silver', 'golden', 'whispering', 'dancing', 'melting', 'shimmering', 'wandering', 'lingering'],
  nouns: ['moonlight', 'stars', 'breeze', 'waves', 'dreams', 'shadows', 'petals', 'echoes'],
  verbs: ['drift', 'fade', 'soar', 'weep', 'sing', 'bloom', 'fall', 'remain']
};

function isEnglish(text: string): boolean {
  return /^[a-zA-Z\s,.;:'"!?()-]+$/.test(text);
}

function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateChinesePoem(theme: string, sentiment: Sentiment): PoemLine[] {
  const bank = wordBankBySentiment[sentiment];
  const rhythm = randomFrom(rhythmKeys);
  const rhymes = rhythmMap[rhythm];
  const lines: PoemLine[] = [];

  const templates = [
    (adj: string, noun: string, rhyme: string) => `${adj}${noun}${rhyme}`,
    (adj: string, noun: string, rhyme: string) => `${noun}${adj}入${rhyme}`,
    (adj: string, noun: string, rhyme: string) => `${randomFrom(bank.verbs)}${adj}${noun}${rhyme}`,
    (_adj: string, _noun: string, rhyme: string) => `${theme.slice(0, Math.min(2, theme.length))}${randomFrom(bank.verbs)}${rhyme}`
  ];

  for (let i = 0; i < 4; i++) {
    const template = templates[i];
    const adj = randomFrom(bank.adjectives);
    const noun = randomFrom(bank.nouns);
    const rhyme = randomFrom(rhymes);
    let text = template(adj, noun, rhyme);

    while (text.length < 6 || text.length > 9) {
      if (text.length < 6) {
        text = randomFrom(bank.adjectives) + text;
      } else {
        text = text.slice(0, 8);
        if (!rhymes.some(r => text.endsWith(r))) {
          text = text.slice(0, -1) + randomFrom(rhymes);
        }
      }
    }

    lines.push({
      id: `line-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 7)}`,
      text
    });
  }

  return lines;
}

function generateEnglishPoem(theme: string, _sentiment: Sentiment): PoemLine[] {
  const bank = englishWordBank;
  const lines: PoemLine[] = [];

  const templates = [
    (adj: string, noun: string, verb: string) => `${adj.charAt(0).toUpperCase() + adj.slice(1)} ${noun} ${verb} so slow`,
    (adj: string, noun: string, verb: string) => `Beneath the ${adj} ${noun}, dreams ${verb} and grow`,
    (adj: string, noun: string, verb: string) => `${verb.charAt(0).toUpperCase() + verb.slice(1)} through the ${adj} ${noun}'s glow`,
    (_adj: string, _noun: string, verb: string) => `${theme.charAt(0).toUpperCase() + theme.slice(1)} whispers, let our hearts ${verb}`
  ];

  for (let i = 0; i < 4; i++) {
    const template = templates[i];
    const adj = randomFrom(bank.adjectives);
    const noun = randomFrom(bank.nouns);
    const verb = randomFrom(bank.verbs);
    lines.push({
      id: `line-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 7)}`,
      text: template(adj, noun, verb)
    });
  }

  return lines;
}

export function generatePoem(theme: string, sentiment: Sentiment): Promise<PoemLine[]> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const lines = isEnglish(theme)
        ? generateEnglishPoem(theme, sentiment)
        : generateChinesePoem(theme, sentiment);
      resolve(lines);
    }, 150 + Math.random() * 50);
  });
}
