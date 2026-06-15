import type { Mood } from '../../shared/types';

interface RhymeGroup {
  [rhymeKey: string]: string[];
}

interface MarkovModel {
  [word: string]: { next: string[]; weights: number[] };
}

const TEMPLATES: Record<Mood, string[][]> = {
  happy: [
    ['阳光洒满了{scene}', '风也在轻轻唱着歌', '心跳的节奏是{rhythm}', '快乐在每一个角落'],
    ['笑着走过{scene}', '把烦恼全都留给昨天', '阳光下张开了双臂', '这一刻就是永远'],
    ['{scene}的午后暖洋洋', '冰淇淋融化在手上', '你说今天的天气好', '我说是因为你在身旁'],
    ['脚步轻快像在飞翔', '{scene}充满了希望', '每一口呼吸都香甜', '幸福就在眼前荡漾'],
    ['啦啦啦{scene}在发光', '啦啦啦心情在飞扬', '把所有美好都收藏', '这是我们的时光'],
  ],
  sad: [
    ['{scene}没有尽头', '眼泪模糊了所有', '回忆还在原地停留', '而你却不再回头'],
    ['走在{scene}的路上', '影子被拉得很长', '那些说过的话', '现在只剩下回响'],
    ['{scene}是如此安静', '连呼吸都变得透明', '我试着把你忘记', '却总在午夜惊醒'],
    ['雨落在{scene}', '像我止不住的伤心', '曾经的温热掌心', '现在只剩冰冷'],
    ['一个人坐在{scene}', '数着天上孤单的星', '如果离别是注定', '为何要让我们相遇'],
  ],
  romantic: [
    ['在{scene}遇见你', '是我最美的奇迹', '你的笑容像春风', '融化了我所有的冬季'],
    ['牵着你走过{scene}', '星星都在眨眼睛', '这一刻世界很安静', '我只听见你的心跳声'],
    ['{scene}的月光很柔', '就像你凝视我的眼眸', '如果可以就这样', '我愿陪你到永久'],
    ['在{scene}许下心愿', '愿你永远在我身边', '不管世界怎么变', '我爱你的心不会变'],
    ['你的名字写在{scene}', '每一个字都是想念', '风把思念带很远', '带到你住的那条街'],
  ],
  passionate: [
    ['{scene}在燃烧', '热血在胸膛咆哮', '没有人能阻挡', '我们前进的步调'],
    ['站在{scene}的中央', '全世界为我鼓掌', '汗水是荣耀的勋章', '梦想就在前方'],
    ['呐喊声穿透{scene}', '我们是不败的信仰', '哪怕跌倒千万次', '也要站起来向前闯'],
    ['{scene}的风在呼啸', '心跳像战鼓在敲', '今天我要让世界', '都看到我的骄傲'],
    ['燃烧吧{scene}', '让青春不留遗憾', '冲破所有的阻挡', '黎明就在前方'],
  ],
};

const SCENE_WORDS: Record<Mood, string[]> = {
  happy: ['海边', '花园', '老街', '屋顶', '操场', '街角', '湖畔', '田野', '小镇', '天台'],
  sad: ['雨夜', '空房', '车站', '老巷', '窗前', '路口', '山顶', '码头', '旧居', '天桥'],
  romantic: ['海边', '星空下', '樱花路', '咖啡馆', '公园', '电影院', '巷口', '黄昏', '阁楼', '河畔'],
  passionate: ['赛场', '舞台', '街头', '战场', '终点线', '山巅', '跑道', '擂台', '赛道', '高地'],
};

const RHYTHM_WORDS: Record<Mood, string[]> = {
  happy: ['快乐节拍', '欢快旋律', '甜蜜节奏', '阳光步调', '开心舞曲'],
  sad: ['心碎旋律', '寂寞节拍', '忧伤调子', '孤独节奏', '无声乐章'],
  romantic: ['心跳频率', '温柔旋律', '甜蜜节拍', '浪漫调子', '爱之韵律'],
  passionate: ['战斗节拍', '热血节奏', '燃魂旋律', '呐喊调子', '胜利乐章'],
};

const RHYME_DICT: RhymeGroup = {
  ang: ['光', '方', '唱', '望', '亮', '场', '扬', '浪', '想', '伤', '旁', '长', '狂', '装', '闯', '荡', '响', '量', '样', '香'],
  ing: ['行', '听', '星', '心', '情', '醒', '静', '影', '明', '青', '轻', '停', '灵', '梦', '风', '空', '中', '红', '痛', '懂'],
  ai: ['爱', '来', '在', '海', '白', '彩', '代', '待', '开', '拍', '排', '买', '卖', '太', '歪', '载', '摘', '猜', '材', '柴'],
  ei: ['飞', '谁', '累', '泪', '美', '追', '最', '给', '背', '杯', '悲', '醉', '碎', '岁', '会', '对', '说', '多', '错', '过'],
  ou: ['走', '手', '口', '后', '候', '守', '够', '楼', '愁', '留', '流', '柔', '有', '友', '久', '酒', '眸', '昼', '骤', '透'],
  an: ['看', '天', '边', '远', '言', '前', '年', '念', '见', '间', '脸', '眼', '晚', '暖', '满', '慢', '难', '断', '短', '换'],
  u: ['路', '步', '不', '苦', '哭', '书', '树', '度', '独', '处', '住', '助', '注', '主', '古', '故', '顾', '物', '雾', '悟'],
  i: ['你', '里', '起', '记', '气', '期', '地', '题', '洗', '里', '离', '许', '语', '雨', '曲', '去', '举', '聚', '绿', '律'],
};

function getRhymeKey(word: string): string | null {
  const lastChar = word.slice(-1);
  for (const [key, words] of Object.entries(RHYME_DICT)) {
    if (words.includes(lastChar)) return key;
  }
  return null;
}

function findRhymeWords(word: string, exclude: string[] = []): string[] {
  const key = getRhymeKey(word);
  if (!key) return [];
  return RHYME_DICT[key].filter(w => !exclude.includes(w));
}

function buildMarkovModel(lines: string[]): MarkovModel {
  const model: MarkovModel = {};
  
  for (const line of lines) {
    const chars = Array.from(line);
    for (let i = 0; i < chars.length - 1; i++) {
      const current = chars[i];
      const next = chars[i + 1];
      if (!model[current]) {
        model[current] = { next: [], weights: [] };
      }
      const idx = model[current].next.indexOf(next);
      if (idx === -1) {
        model[current].next.push(next);
        model[current].weights.push(1);
      } else {
        model[current].weights[idx]++;
      }
    }
  }
  
  return model;
}

function sampleNext(model: MarkovModel, current: string): string {
  const entry = model[current];
  if (!entry || entry.next.length === 0) {
    const keys = Object.keys(model);
    return keys[Math.floor(Math.random() * keys.length)] || '';
  }
  
  const totalWeight = entry.weights.reduce((a, b) => a + b, 0);
  let random = Math.random() * totalWeight;
  
  for (let i = 0; i < entry.next.length; i++) {
    random -= entry.weights[i];
    if (random <= 0) return entry.next[i];
  }
  
  return entry.next[entry.next.length - 1];
}

function generateWithMarkov(model: MarkovModel, startChar: string, targetLength: number): string {
  let result = startChar;
  let current = startChar;
  
  for (let i = 0; i < targetLength - 1; i++) {
    const next = sampleNext(model, current);
    result += next;
    current = next;
  }
  
  return result;
}

function weightedRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function fillTemplate(
  template: string[],
  mood: Mood,
  keyword: string
): { lines: string[]; rhymeWords: string[] } {
  const sceneWords = SCENE_WORDS[mood];
  const rhythmWords = RHYTHM_WORDS[mood];
  
  const usedScenes: string[] = [];
  const usedRhythms: string[] = [];
  const rhymeWords: string[] = [];
  
  let scenePool = keyword && keyword.length > 0 
    ? [keyword, ...sceneWords]
    : sceneWords;
  
  const lines = template.map((line, idx) => {
    let result = line;
    
    if (result.includes('{scene}')) {
      const available = scenePool.filter(s => !usedScenes.includes(s));
      const scene = available.length > 0 
        ? weightedRandom(available)
        : weightedRandom(sceneWords);
      usedScenes.push(scene);
      result = result.replace('{scene}', scene);
    }
    
    if (result.includes('{rhythm}')) {
      const available = rhythmWords.filter(r => !usedRhythms.includes(r));
      const rhythm = available.length > 0
        ? weightedRandom(available)
        : weightedRandom(rhythmWords);
      usedRhythms.push(rhythm);
      result = result.replace('{rhythm}', rhythm);
    }
    
    if (idx % 2 === 1 || idx === template.length - 1) {
      const lastWord = result.slice(-1);
      const rhymes = findRhymeWords(lastWord);
      if (rhymes.length > 0) {
        rhymeWords.push(rhymes[0]);
      }
      rhymeWords.push(lastWord);
    }
    
    return result;
  });
  
  return { lines, rhymeWords: [...new Set(rhymeWords)] };
}

function enhanceLyricWithMarkov(
  lines: string[],
  mood: Mood
): { lines: string[]; rhymeWords: string[] } {
  const allTemplateLines = TEMPLATES[mood].flat();
  const model = buildMarkovModel(allTemplateLines);
  
  const enhancedLines = lines.map((line, idx) => {
    if (Math.random() < 0.3 && line.length < 10) {
      const startChar = line[0] || weightedRandom(SCENE_WORDS[mood])[0];
      const extension = generateWithMarkov(model, startChar, Math.floor(Math.random() * 5) + 3);
      if (extension.length > line.length) {
        return extension;
      }
    }
    return line;
  });
  
  const rhymeWords: string[] = [];
  for (let i = 0; i < enhancedLines.length; i++) {
    if (i % 2 === 1 || i === enhancedLines.length - 1) {
      const lastChar = enhancedLines[i].slice(-1);
      const rhymes = findRhymeWords(lastChar);
      rhymeWords.push(lastChar, ...rhymes.slice(0, 2));
    }
  }
  
  return { lines: enhancedLines, rhymeWords: [...new Set(rhymeWords)] };
}

export interface GenerateResult {
  content: string[];
  rhymeWords: string[];
}

export function generateLyric(
  mood: Mood,
  keyword: string = ''
): GenerateResult {
  const templates = TEMPLATES[mood];
  const template = templates[Math.floor(Math.random() * templates.length)];
  
  const { lines, rhymeWords: templateRhymes } = fillTemplate(template, mood, keyword);
  const { lines: finalLines, rhymeWords: enhancedRhymes } = enhanceLyricWithMarkov(lines, mood);
  
  const allRhymeWords = [...new Set([...templateRhymes, ...enhancedRhymes])];
  
  return {
    content: finalLines,
    rhymeWords: allRhymeWords,
  };
}

export function adjustRhymeForWord(
  lineIndex: number,
  wordIndex: number,
  newWord: string,
  lines: string[],
  mood: Mood
): string[] {
  const newLines = [...lines];
  const currentLine = newLines[lineIndex];
  const words = currentLine.split('');
  
  if (wordIndex >= 0 && wordIndex < words.length) {
    const oldWord = words[wordIndex];
    words[wordIndex] = newWord;
    
    if (lineIndex % 2 === 1 || lineIndex === lines.length - 1) {
      const oldRhymeKey = getRhymeKey(oldWord);
      const newRhymeKey = getRhymeKey(newWord);
      
      if (oldRhymeKey !== newRhymeKey && lineIndex > 0) {
        const prevLine = newLines[lineIndex - 1];
        const prevWords = prevLine.split('');
        const prevLastChar = prevWords[prevWords.length - 1];
        const rhymesForNew = findRhymeWords(newWord);
        
        if (rhymesForNew.length > 0 && !rhymesForNew.includes(prevLastChar)) {
          const replacement = rhymesForNew[Math.floor(Math.random() * rhymesForNew.length)];
          prevWords[prevWords.length - 1] = replacement;
          newLines[lineIndex - 1] = prevWords.join('');
        }
      }
    }
    
    newLines[lineIndex] = words.join('');
  }
  
  return newLines;
}

export function getRhymeHighlightWords(lines: string[]): string[] {
  const highlights: string[] = [];
  
  for (let i = 0; i < lines.length; i++) {
    if (i % 2 === 1 || i === lines.length - 1) {
      const line = lines[i];
      if (line.length >= 2) {
        highlights.push(line.slice(-2));
      }
      highlights.push(line.slice(-1));
    }
  }
  
  return [...new Set(highlights)];
}
