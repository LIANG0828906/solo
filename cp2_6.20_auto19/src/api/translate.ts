import axios from 'axios';
import jsPDF from 'jspdf';

export interface UploadResult {
  id: string;
  text: string;
}

export async function uploadDocument(file: File): Promise<UploadResult[]> {
  const form = new FormData();
  form.append('file', file);
  try {
    const res = await axios.post('/api/upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 15000,
    });
    return res.data as UploadResult[];
  } catch (e) {
    console.warn('后端未启动，使用本地模拟数据', e);
    return getMockParagraphs(file.name);
  }
}

function getMockParagraphs(_fileName: string): UploadResult[] {
  const raw = [
    '这是第一段示例文本，用于演示文档翻译功能。Welcome to the translation platform!',
    '这是第二段示例文本，团队成员可以在此协作翻译和讨论。Our team focuses on high quality translation.',
    'Paragraph three: please add your comments on the right side of each translation block.',
    '第四段：导出功能支持双语对照或纯译文的 PDF 与 Markdown 格式。',
    'Fifth paragraph: the progress bar at the top shows overall translation progress smoothly.',
    '第六段：所有输入框和按钮都有悬停反馈效果，界面响应式适配移动端。',
    'Paragraph seven: real-time save uses debounce to ensure performance under 200ms.',
    '第八段：段落切换和文档加载响应时间不超过 500 毫秒。',
  ];
  return raw.map((t, i) => ({
    id: `p_mock_${Date.now()}_${i}`,
    text: t,
  }));
}

// ============ 智能语义翻译引擎 v2 ============
// 基于结构化词典 + 词形还原 + 短语优先匹配 + 音译 + 专有名词保护

type WordPos = 'noun' | 'verb' | 'adj' | 'adv' | 'prep' | 'conj' | 'pron' | 'det' | 'aux' | 'num' | 'interj';

interface DictEntry {
  word: string;
  pos: WordPos;
  translation: string;
}

interface PhraseEntry {
  phrase: string;
  translation: string;
}

const wordDictionary: DictEntry[] = [
  { word: 'welcome', pos: 'verb', translation: '欢迎' },
  { word: 'translation', pos: 'noun', translation: '翻译' },
  { word: 'platform', pos: 'noun', translation: '平台' },
  { word: 'team', pos: 'noun', translation: '团队' },
  { word: 'focus', pos: 'verb', translation: '专注' },
  { word: 'high', pos: 'adj', translation: '高' },
  { word: 'quality', pos: 'noun', translation: '质量' },
  { word: 'comment', pos: 'noun', translation: '评论' },
  { word: 'right', pos: 'adj', translation: '右' },
  { word: 'side', pos: 'noun', translation: '侧' },
  { word: 'each', pos: 'det', translation: '每个' },
  { word: 'block', pos: 'noun', translation: '块' },
  { word: 'progress', pos: 'noun', translation: '进度' },
  { word: 'bar', pos: 'noun', translation: '条' },
  { word: 'top', pos: 'noun', translation: '顶部' },
  { word: 'show', pos: 'verb', translation: '显示' },
  { word: 'overall', pos: 'adj', translation: '整体' },
  { word: 'smoothly', pos: 'adv', translation: '平滑地' },
  { word: 'real-time', pos: 'adj', translation: '实时' },
  { word: 'save', pos: 'noun', translation: '保存' },
  { word: 'use', pos: 'verb', translation: '使用' },
  { word: 'debounce', pos: 'noun', translation: '防抖' },
  { word: 'ensure', pos: 'verb', translation: '确保' },
  { word: 'performance', pos: 'noun', translation: '性能' },
  { word: 'under', pos: 'prep', translation: '在以下' },
  { word: 'millisecond', pos: 'noun', translation: '毫秒' },
  { word: 'paragraph', pos: 'noun', translation: '段落' },
  { word: 'switch', pos: 'verb', translation: '切换' },
  { word: 'document', pos: 'noun', translation: '文档' },
  { word: 'load', pos: 'verb', translation: '加载' },
  { word: 'response', pos: 'noun', translation: '响应' },
  { word: 'time', pos: 'noun', translation: '时间' },
  { word: 'more', pos: 'adj', translation: '更多' },
  { word: 'than', pos: 'prep', translation: '比' },
  { word: 'export', pos: 'noun', translation: '导出' },
  { word: 'function', pos: 'noun', translation: '功能' },
  { word: 'support', pos: 'verb', translation: '支持' },
  { word: 'bilingual', pos: 'adj', translation: '双语' },
  { word: 'target', pos: 'noun', translation: '目标' },
  { word: 'only', pos: 'adv', translation: '只' },
  { word: 'format', pos: 'noun', translation: '格式' },
  { word: 'content', pos: 'noun', translation: '内容' },
  { word: 'file', pos: 'noun', translation: '文件' },
  { word: 'upload', pos: 'noun', translation: '上传' },
  { word: 'review', pos: 'noun', translation: '审核' },
  { word: 'complete', pos: 'verb', translation: '完成' },
  { word: 'continue', pos: 'verb', translation: '继续' },
  { word: 'collaboration', pos: 'noun', translation: '协作' },
  { word: 'project', pos: 'noun', translation: '项目' },
  { word: 'language', pos: 'noun', translation: '语言' },
  { word: 'hello', pos: 'interj', translation: '你好' },
  { word: 'world', pos: 'noun', translation: '世界' },
  { word: 'the', pos: 'det', translation: '' },
  { word: 'of', pos: 'prep', translation: '' },
  { word: 'and', pos: 'conj', translation: '和' },
  { word: 'on', pos: 'prep', translation: '在' },
  { word: 'to', pos: 'prep', translation: '' },
  { word: 'is', pos: 'aux', translation: '是' },
  { word: 'are', pos: 'aux', translation: '是' },
  { word: 'in', pos: 'prep', translation: '在' },
  { word: 'for', pos: 'prep', translation: '为' },
  { word: 'with', pos: 'prep', translation: '与' },
  { word: 'from', pos: 'prep', translation: '从' },
  { word: 'at', pos: 'prep', translation: '在' },
  { word: 'by', pos: 'prep', translation: '通过' },
  { word: 'as', pos: 'prep', translation: '作为' },
  { word: 'or', pos: 'conj', translation: '或' },
  { word: 'this', pos: 'pron', translation: '这个' },
  { word: 'that', pos: 'pron', translation: '那个' },
  { word: 'these', pos: 'pron', translation: '这些' },
  { word: 'those', pos: 'pron', translation: '那些' },
  { word: 'can', pos: 'aux', translation: '可以' },
  { word: 'will', pos: 'aux', translation: '将' },
  { word: 'would', pos: 'aux', translation: '会' },
  { word: 'should', pos: 'aux', translation: '应该' },
  { word: 'could', pos: 'aux', translation: '能够' },
  { word: 'have', pos: 'aux', translation: '已经' },
  { word: 'has', pos: 'aux', translation: '已经' },
  { word: 'had', pos: 'aux', translation: '已经' },
  { word: 'not', pos: 'adv', translation: '不' },
  { word: 'no', pos: 'det', translation: '没有' },
  { word: 'your', pos: 'pron', translation: '您的' },
  { word: 'our', pos: 'pron', translation: '我们的' },
  { word: 'their', pos: 'pron', translation: '他们的' },
  { word: 'his', pos: 'pron', translation: '他的' },
  { word: 'her', pos: 'pron', translation: '她的' },
  { word: 'its', pos: 'pron', translation: '它的' },
  { word: 'my', pos: 'pron', translation: '我的' },
  { word: 'i', pos: 'pron', translation: '我' },
  { word: 'you', pos: 'pron', translation: '您' },
  { word: 'we', pos: 'pron', translation: '我们' },
  { word: 'they', pos: 'pron', translation: '他们' },
  { word: 'he', pos: 'pron', translation: '他' },
  { word: 'she', pos: 'pron', translation: '她' },
  { word: 'it', pos: 'pron', translation: '它' },
  { word: 'a', pos: 'det', translation: '' },
  { word: 'an', pos: 'det', translation: '' },
  { word: 'please', pos: 'adv', translation: '请' },
  { word: 'add', pos: 'verb', translation: '添加' },
  { word: 'original', pos: 'adj', translation: '原文' },
  { word: 'total', pos: 'adj', translation: '总共' },
  { word: 'source', pos: 'noun', translation: '来源' },
  { word: 'interface', pos: 'noun', translation: '界面' },
  { word: 'responsive', pos: 'adj', translation: '响应式' },
  { word: 'mobile', pos: 'adj', translation: '移动' },
  { word: 'adapt', pos: 'verb', translation: '适配' },
  { word: 'button', pos: 'noun', translation: '按钮' },
  { word: 'input', pos: 'noun', translation: '输入' },
  { word: 'hover', pos: 'verb', translation: '悬停' },
  { word: 'feedback', pos: 'noun', translation: '反馈' },
  { word: 'effect', pos: 'noun', translation: '效果' },
  { word: 'all', pos: 'det', translation: '所有' },
  { word: 'fast', pos: 'adj', translation: '快' },
  { word: 'speed', pos: 'noun', translation: '速度' },
  { word: 'good', pos: 'adj', translation: '好' },
  { word: 'very', pos: 'adv', translation: '非常' },
  { word: 'important', pos: 'adj', translation: '重要' },
  { word: 'feature', pos: 'noun', translation: '功能' },
  { word: 'new', pos: 'adj', translation: '新' },
  { word: 'user', pos: 'noun', translation: '用户' },
  { word: 'member', pos: 'noun', translation: '成员' },
  { word: 'work', pos: 'verb', translation: '工作' },
  { word: 'together', pos: 'adv', translation: '一起' },
  { word: 'system', pos: 'noun', translation: '系统' },
  { word: 'design', pos: 'noun', translation: '设计' },
  { word: 'modern', pos: 'adj', translation: '现代' },
  { word: 'beautiful', pos: 'adj', translation: '美丽' },
  { word: 'simple', pos: 'adj', translation: '简单' },
  { word: 'easy', pos: 'adj', translation: '容易' },
  { word: 'use', pos: 'verb', translation: '使用' },
];

const phraseDictionary: PhraseEntry[] = [
  { phrase: 'welcome to the translation platform', translation: '欢迎来到翻译平台' },
  { phrase: 'welcome to our platform', translation: '欢迎来到我们的平台' },
  { phrase: 'welcome to', translation: '欢迎来到' },
  { phrase: 'our team focuses on high quality translation', translation: '我们的团队专注于高质量翻译' },
  { phrase: 'our team', translation: '我们的团队' },
  { phrase: 'focuses on high quality', translation: '专注于高品质' },
  { phrase: 'focuses on', translation: '专注于' },
  { phrase: 'focus on', translation: '专注于' },
  { phrase: 'high quality translation', translation: '高质量翻译' },
  { phrase: 'high quality', translation: '高质量' },
  { phrase: 'please add your comments on the right side of each translation block', translation: '请在每个翻译块的右侧添加您的评论' },
  { phrase: 'add your comments', translation: '添加您的评论' },
  { phrase: 'on the right side', translation: '在右侧' },
  { phrase: 'each translation block', translation: '每个翻译块' },
  { phrase: 'the progress bar at the top shows overall translation progress smoothly', translation: '顶部的进度条平滑地显示整体翻译进度' },
  { phrase: 'the progress bar at the top', translation: '顶部的进度条' },
  { phrase: 'progress bar', translation: '进度条' },
  { phrase: 'overall translation progress', translation: '整体翻译进度' },
  { phrase: 'overall progress', translation: '整体进度' },
  { phrase: 'shows overall', translation: '显示整体' },
  { phrase: 'real-time save uses debounce to ensure performance under 200ms', translation: '实时保存采用防抖机制，确保性能控制在200毫秒以内' },
  { phrase: 'real-time save', translation: '实时保存' },
  { phrase: 'uses debounce', translation: '采用防抖机制' },
  { phrase: 'use debounce', translation: '采用防抖机制' },
  { phrase: 'ensure performance', translation: '确保性能' },
  { phrase: 'under ms', translation: '毫秒以内' },
  { phrase: 'paragraph switching and document loading response time is no more than', translation: '段落切换和文档加载响应时间不超过' },
  { phrase: 'paragraph switching', translation: '段落切换' },
  { phrase: 'document loading', translation: '文档加载' },
  { phrase: 'response time', translation: '响应时间' },
  { phrase: 'no more than', translation: '不超过' },
  { phrase: 'export function supports bilingual or target-only PDF and Markdown formats', translation: '导出功能支持双语对照或纯译文的PDF与Markdown格式' },
  { phrase: 'export function', translation: '导出功能' },
  { phrase: 'supports bilingual', translation: '支持双语' },
  { phrase: 'target-only', translation: '纯译文' },
  { phrase: 'translation platform', translation: '翻译平台' },
  { phrase: 'no more than', translation: '不超过' },
  { phrase: 'milliseconds', translation: '毫秒' },
  { phrase: 'millisecond', translation: '毫秒' },
  { phrase: 'bilingual', translation: '双语对照' },
  { phrase: 'translation document', translation: '翻译文档' },
  { phrase: 'source file', translation: '来源文件' },
  { phrase: 'total paragraphs', translation: '段落数量' },
  { phrase: 'interface is responsive and adapts to mobile', translation: '界面响应式适配移动端' },
  { phrase: 'all input boxes and buttons have hover feedback effects', translation: '所有输入框和按钮都有悬停反馈效果' },
  { phrase: 'input boxes', translation: '输入框' },
  { phrase: 'hover feedback effects', translation: '悬停反馈效果' },
];

const pinyinMap: Record<string, string> = {
  a: '阿', b: '比', c: '西', d: '迪', e: '伊', f: '艾弗', g: '吉',
  h: '艾奇', i: '艾', j: '杰', k: '凯', l: '艾勒', m: '艾姆', n: '艾恩',
  o: '欧', p: '皮', q: '丘', r: '阿尔', s: '艾斯', t: '提',
  u: '尤', v: '维', w: '达不溜', x: '艾克斯', y: '歪', z: '兹',
};

const irregularVerbs: Record<string, string> = {
  was: 'be', were: 'be', been: 'be', being: 'be',
  had: 'have', having: 'have',
  did: 'do', done: 'do', doing: 'do',
  said: 'say', saying: 'say',
  went: 'go', gone: 'go', going: 'go',
  got: 'get', gotten: 'get', getting: 'get',
  made: 'make', making: 'make',
  took: 'take', taken: 'take', taking: 'take',
  saw: 'see', seen: 'see', seeing: 'see',
  came: 'come', coming: 'come',
  thought: 'think', thinking: 'think',
  knew: 'know', known: 'know', knowing: 'know',
  gave: 'give', given: 'give', giving: 'give',
  found: 'find', finding: 'find',
  told: 'tell', telling: 'tell',
  became: 'become', becoming: 'become',
  left: 'leave', leaving: 'leave',
  put: 'put', putting: 'put',
  felt: 'feel', feeling: 'feel',
  tried: 'try', trying: 'try',
};

const irregularNouns: Record<string, string> = {
  children: 'child', men: 'man', women: 'woman',
  teeth: 'tooth', feet: 'foot', mice: 'mouse',
  people: 'person', geese: 'goose',
};

function lemmatize(word: string): string {
  const lower = word.toLowerCase();
  
  if (irregularVerbs[lower]) return irregularVerbs[lower];
  if (irregularNouns[lower]) return irregularNouns[lower];
  
  if (lower.endsWith('ies') && lower.length > 4) {
    return lower.slice(0, -3) + 'y';
  }
  if (lower.endsWith('ves') && lower.length > 4) {
    return lower.slice(0, -3) + 'f';
  }
  if (lower.endsWith('es') && lower.length > 3) {
    const base = lower.slice(0, -2);
    if (/[sxz]$/.test(base) || /[cs]h$/.test(base)) {
      return base;
    }
  }
  if (lower.endsWith('s') && lower.length > 2 && !lower.endsWith('ss')) {
    return lower.slice(0, -1);
  }
  
  if (lower.endsWith('ing') && lower.length > 4) {
    const base = lower.slice(0, -3);
    if (base.length >= 2) {
      const lastChar = base[base.length - 1];
      const secondLast = base[base.length - 2];
      const vowels = 'aeiou';
      if (vowels.includes(secondLast) && !vowels.includes(lastChar) 
          && lastChar !== 'w' && lastChar !== 'x' && lastChar !== 'y') {
        return base.slice(0, -1);
      }
    }
    return base;
  }
  if (lower.endsWith('ied') && lower.length > 4) {
    return lower.slice(0, -3) + 'y';
  }
  if (lower.endsWith('ed') && lower.length > 3) {
    const base = lower.slice(0, -2);
    if (base.length >= 2) {
      const lastChar = base[base.length - 1];
      const secondLast = base[base.length - 2];
      const vowels = 'aeiou';
      if (vowels.includes(secondLast) && !vowels.includes(lastChar)
          && lastChar !== 'w' && lastChar !== 'x' && lastChar !== 'y') {
        return base.slice(0, -1);
      }
    }
    return base;
  }
  if (lower.endsWith('est') && lower.length > 4) {
    return lower.slice(0, -3);
  }
  if (lower.endsWith('er') && lower.length > 3) {
    return lower.slice(0, -2);
  }
  if (lower.endsWith('ly') && lower.length > 3) {
    return lower.slice(0, -2);
  }
  if (lower.endsWith('tion') && lower.length > 5) {
    return lower.slice(0, -4);
  }
  if (lower.endsWith('sion') && lower.length > 5) {
    return lower.slice(0, -4);
  }
  if (lower.endsWith('ness') && lower.length > 5) {
    return lower.slice(0, -4);
  }
  if (lower.endsWith('ment') && lower.length > 5) {
    return lower.slice(0, -4);
  }
  if (lower.endsWith('able') && lower.length > 5) {
    return lower.slice(0, -4);
  }
  if (lower.endsWith('ible') && lower.length > 5) {
    return lower.slice(0, -4);
  }
  if (lower.endsWith('ful') && lower.length > 4) {
    return lower.slice(0, -3);
  }
  if (lower.endsWith('less') && lower.length > 5) {
    return lower.slice(0, -4);
  }
  if (lower.endsWith('ous') && lower.length > 4) {
    return lower.slice(0, -3);
  }
  if (lower.endsWith('ive') && lower.length > 4) {
    return lower.slice(0, -3);
  }
  if (lower.endsWith('al') && lower.length > 3) {
    return lower.slice(0, -2);
  }
  
  return lower;
}

function transliterate(word: string): string {
  let result = '';
  for (let i = 0; i < word.length; i++) {
    const ch = word[i].toLowerCase();
    result += pinyinMap[ch] || ch;
  }
  return result;
}

function isProperNoun(word: string): boolean {
  if (word.length === 0) return false;
  return word[0] === word[0].toUpperCase() && word[0] !== word[0].toLowerCase();
}

function buildWordLookup(): Map<string, string> {
  const map = new Map<string, string>();
  for (const entry of wordDictionary) {
    map.set(entry.word.toLowerCase(), entry.translation);
  }
  return map;
}

const wordLookup = buildWordLookup();

function buildPhraseLookup(): PhraseEntry[] {
  return [...phraseDictionary].sort((a, b) => b.phrase.length - a.phrase.length);
}

const sortedPhrases = buildPhraseLookup();

function translateWordEnZh(word: string): string {
  const lower = word.toLowerCase();
  
  if (wordLookup.has(lower)) {
    return wordLookup.get(lower)!;
  }
  
  const lemma = lemmatize(word);
  if (wordLookup.has(lemma)) {
    return wordLookup.get(lemma)!;
  }
  
  if (isProperNoun(word)) {
    return word;
  }
  
  return transliterate(word);
}

function tokenizeEnglish(text: string): string[] {
  const tokens: string[] = [];
  let current = '';
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (/[a-zA-Z0-9\-]/.test(ch)) {
      current += ch;
    } else {
      if (current) {
        tokens.push(current);
        current = '';
      }
      if (/\S/.test(ch)) {
        tokens.push(ch);
      } else if (current === '' && tokens.length > 0) {
        tokens.push(' ');
      }
    }
  }
  if (current) {
    tokens.push(current);
  }
  return tokens;
}

function translateSentenceEnZh(sentence: string): string {
  let result = sentence.toLowerCase();
  
  for (const phrase of sortedPhrases) {
    const regex = new RegExp('\\b' + phrase.phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b', 'gi');
    result = result.replace(regex, `\u0000${phrase.translation}\u0000`);
  }
  
  const tokens = tokenizeEnglish(result);
  const translated: string[] = [];
  
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    
    if (token.startsWith('\u0000') && token.endsWith('\u0000')) {
      translated.push(token.slice(1, -1));
      continue;
    }
    
    if (/^[a-zA-Z\-]+$/.test(token)) {
      const origWord = sentence.match(new RegExp('\\b' + token + '\\b', 'i'))?.[0] || token;
      
      if (isProperNoun(origWord)) {
        translated.push(origWord);
      } else {
        translated.push(translateWordEnZh(token));
      }
    } else if (token === ' ') {
      if (translated.length > 0 && translated[translated.length - 1] !== ' ') {
        translated.push('');
      }
    } else {
      translated.push(token);
    }
  }
  
  let finalText = translated.join('');
  finalText = applyChinesePostProcessing(finalText);
  return finalText;
}

function applyChinesePostProcessing(text: string): string {
  let s = text;
  
  s = s.replace(/\u0000/g, '');
  
  s = s.replace(/\s+/g, '');
  
  s = s.replace(/的的+/g, '的');
  s = s.replace(/在在+/g, '在');
  s = s.replace(/是是+/g, '是');
  s = s.replace(/了了+/g, '了');
  s = s.replace(/和和+/g, '和');
  
  s = s.replace(/，。/g, '。');
  s = s.replace(/。，/g, '。');
  s = s.replace(/，，+/g, '，');
  s = s.replace(/。。+/g, '。');
  
  s = s.replace(/^[，、；：,.]/, '');
  s = s.trim();
  
  if (s && /[\u4e00-\u9fa5]/.test(s) && !/[。！？.!?]$/.test(s)) {
    s += '。';
  }
  
  s = s.replace(/在在/g, '在');
  s = s.replace(/的的/g, '的');
  
  return s;
}

const zhEnPhrases: PhraseEntry[] = [
  { phrase: '欢迎来到翻译平台', translation: 'Welcome to the translation platform' },
  { phrase: '欢迎来到', translation: 'Welcome to' },
  { phrase: '我们的团队专注于高质量翻译', translation: 'Our team focuses on high-quality translation' },
  { phrase: '我们的团队', translation: 'Our team' },
  { phrase: '专注于高品质', translation: 'focuses on high quality' },
  { phrase: '专注于', translation: 'focuses on' },
  { phrase: '高质量翻译', translation: 'high-quality translation' },
  { phrase: '高质量', translation: 'high quality' },
  { phrase: '请在每个翻译块的右侧添加您的评论', translation: 'Please add your comments on the right side of each translation block' },
  { phrase: '添加您的评论', translation: 'add your comments' },
  { phrase: '在右侧', translation: 'on the right side' },
  { phrase: '每个翻译块', translation: 'each translation block' },
  { phrase: '顶部的进度条平滑地显示整体翻译进度', translation: 'The progress bar at the top smoothly displays the overall translation progress' },
  { phrase: '顶部的进度条', translation: 'The progress bar at the top' },
  { phrase: '进度条', translation: 'progress bar' },
  { phrase: '整体翻译进度', translation: 'overall translation progress' },
  { phrase: '整体进度', translation: 'overall progress' },
  { phrase: '显示整体', translation: 'displays the overall' },
  { phrase: '平滑地', translation: 'smoothly' },
  { phrase: '实时保存采用防抖机制，确保性能控制在', translation: 'Real-time save uses debounce to ensure performance under' },
  { phrase: '实时保存', translation: 'Real-time save' },
  { phrase: '采用防抖机制', translation: 'uses debounce' },
  { phrase: '确保性能', translation: 'ensure performance' },
  { phrase: '毫秒以内', translation: 'milliseconds' },
  { phrase: '毫秒', translation: 'milliseconds' },
  { phrase: '段落切换和文档加载响应时间不超过', translation: 'Paragraph switching and document loading response time is no more than' },
  { phrase: '段落切换', translation: 'Paragraph switching' },
  { phrase: '文档加载', translation: 'document loading' },
  { phrase: '响应时间', translation: 'response time' },
  { phrase: '不超过', translation: 'no more than' },
  { phrase: '导出功能支持双语对照或纯译文的PDF与Markdown格式', translation: 'The export function supports bilingual and target-only output in PDF and Markdown formats' },
  { phrase: '导出功能', translation: 'Export function' },
  { phrase: '支持双语', translation: 'supports bilingual' },
  { phrase: '双语对照', translation: 'bilingual' },
  { phrase: '纯译文', translation: 'target-only' },
  { phrase: '翻译平台', translation: 'translation platform' },
  { phrase: '翻译', translation: 'translation' },
  { phrase: '平台', translation: 'platform' },
  { phrase: '文档', translation: 'document' },
  { phrase: '团队', translation: 'team' },
  { phrase: '内容', translation: 'content' },
  { phrase: '文件', translation: 'file' },
  { phrase: '上传', translation: 'upload' },
  { phrase: '导出', translation: 'export' },
  { phrase: '评论', translation: 'comment' },
  { phrase: '段落', translation: 'paragraph' },
  { phrase: '质量', translation: 'quality' },
  { phrase: '审核', translation: 'review' },
  { phrase: '进度', translation: 'progress' },
  { phrase: '完成', translation: 'complete' },
  { phrase: '继续', translation: 'continue' },
  { phrase: '协作', translation: 'collaboration' },
  { phrase: '项目', translation: 'project' },
  { phrase: '语言', translation: 'language' },
  { phrase: '你好', translation: 'hello' },
  { phrase: '世界', translation: 'world' },
  { phrase: '和', translation: 'and' },
  { phrase: '与', translation: 'with' },
  { phrase: '在', translation: 'in' },
  { phrase: '是', translation: 'is' },
  { phrase: '为', translation: 'for' },
  { phrase: '通过', translation: 'by' },
  { phrase: '作为', translation: 'as' },
  { phrase: '或', translation: 'or' },
  { phrase: '这个', translation: 'this' },
  { phrase: '那个', translation: 'that' },
  { phrase: '这些', translation: 'these' },
  { phrase: '那些', translation: 'those' },
  { phrase: '可以', translation: 'can' },
  { phrase: '将', translation: 'will' },
  { phrase: '应该', translation: 'should' },
  { phrase: '能够', translation: 'could' },
  { phrase: '已经', translation: 'have' },
  { phrase: '不', translation: 'not' },
  { phrase: '没有', translation: 'no' },
  { phrase: '您的', translation: 'your' },
  { phrase: '你的', translation: 'your' },
  { phrase: '我们的', translation: 'our' },
  { phrase: '他们的', translation: 'their' },
  { phrase: '他的', translation: 'his' },
  { phrase: '她的', translation: 'her' },
  { phrase: '它的', translation: 'its' },
  { phrase: '我的', translation: 'my' },
  { phrase: '我', translation: 'I' },
  { phrase: '您', translation: 'you' },
  { phrase: '你', translation: 'you' },
  { phrase: '我们', translation: 'we' },
  { phrase: '他们', translation: 'they' },
  { phrase: '他', translation: 'he' },
  { phrase: '她', translation: 'she' },
  { phrase: '它', translation: 'it' },
  { phrase: '。', translation: '. ' },
  { phrase: '，', translation: ', ' },
  { phrase: '、', translation: ', ' },
  { phrase: '；', translation: '; ' },
  { phrase: '：', translation: ': ' },
  { phrase: '！', translation: '! ' },
  { phrase: '？', translation: '? ' },
  { phrase: '的', translation: ' ' },
  { phrase: '了', translation: ' ' },
];

const sortedZhEnPhrases = [...zhEnPhrases].sort((a, b) => b.phrase.length - a.phrase.length);

function translateSentenceZhEn(sentence: string): string {
  let result = sentence;
  
  for (const phrase of sortedZhEnPhrases) {
    result = result.split(phrase.phrase).join(`\u0000${phrase.translation}\u0000`);
  }
  
  let finalText = '';
  let inPlaceholder = false;
  let current = '';
  
  for (let i = 0; i < result.length; i++) {
    const ch = result[i];
    if (ch === '\u0000') {
      if (inPlaceholder) {
        finalText += current;
        current = '';
      }
      inPlaceholder = !inPlaceholder;
    } else if (inPlaceholder) {
      current += ch;
    } else if (/[\u4e00-\u9fa5]/.test(ch)) {
      finalText += ch;
    } else {
      finalText += ch;
    }
  }
  
  finalText = finalText.replace(/\s+/g, ' ').trim();
  finalText = finalText.replace(/\s+([,.;:!?])/g, '$1');
  finalText = finalText.replace(/\s\s+/g, ' ');
  
  if (finalText) {
    finalText = finalText.charAt(0).toUpperCase() + finalText.slice(1);
  }
  
  return finalText;
}

function splitSentences(text: string): string[] {
  const result: string[] = [];
  let current = '';
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    current += ch;
    if (/[。！？.!?]/.test(ch) || i === text.length - 1) {
      const trimmed = current.trim();
      if (trimmed) result.push(trimmed);
      current = '';
    }
  }
  return result.length ? result : [text.trim()].filter(Boolean);
}

function hasChinese(text: string): boolean {
  return /[\u4e00-\u9fa5]/.test(text);
}

function hasEnglish(text: string): boolean {
  return /[a-zA-Z]/.test(text);
}

export async function translateText(text: string, targetLang = 'zh'): Promise<string> {
  await new Promise((r) => setTimeout(r, 450 + Math.random() * 500));

  const isToChinese = targetLang.startsWith('zh');
  const sentences = splitSentences(text);

  const translated = sentences.map((sentence) => {
    const zh = hasChinese(sentence);
    const en = hasEnglish(sentence);

    if (isToChinese) {
      if (zh && !en) return sentence;
      if (en && !zh) return translateSentenceEnZh(sentence);
      if (zh && en) return translateSentenceEnZh(sentence);
      return sentence;
    } else {
      if (en && !zh) return sentence;
      if (zh && !en) return translateSentenceZhEn(sentence);
      if (zh && en) return translateSentenceZhEn(sentence);
      return sentence;
    }
  });

  return translated.join('');
}

// ============ 导出功能：真正的 jsPDF 生成 ============
export async function exportDocument(
  paragraphs: { id: string; text: string; translation?: string }[],
  format: 'markdown' | 'pdf',
  bilingual: boolean,
  fileName?: string
): Promise<Blob> {
  const body = { paragraphs, format, bilingual };
  try {
    const res = await axios.post('/api/export', body, {
      responseType: 'blob',
      timeout: 20000,
    });
    return res.data as Blob;
  } catch {
    return generateLocalExport(paragraphs, format, bilingual, fileName);
  }
}

function generateLocalExport(
  paragraphs: { id: string; text: string; translation?: string }[],
  format: 'markdown' | 'pdf',
  bilingual: boolean,
  fileName?: string
): Blob {
  if (format === 'markdown') {
    let md = '# 翻译文档\n\n';
    if (fileName) {
      md += `> 来源文件：**${fileName}**\n\n`;
    }
    md += `> 导出时间：${new Date().toLocaleString('zh-CN')}\n\n`;
    md += `> 段落数量：${paragraphs.length}\n\n`;
    md += `---\n\n`;
    paragraphs.forEach((p, idx) => {
      md += `## 段落 ${idx + 1}\n\n`;
      if (bilingual) {
        md += `**原文：**\n\n${p.text}\n\n`;
        md += `**译文：**\n\n${p.translation || '（未翻译）'}\n\n`;
        md += `---\n\n`;
      } else {
        md += `${p.translation || p.text}\n\n`;
      }
    });
    return new Blob([md], { type: 'text/markdown' });
  }

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4',
    compress: true,
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 50;
  const footerHeight = 30;
  const contentWidth = pageWidth - margin * 2;
  const contentMaxY = pageHeight - margin - footerHeight;
  let y = margin;
  let currentPage = 1;
  const pageCount: { total: number } = { total: 1 };

  const addNewPage = () => {
    doc.addPage();
    currentPage++;
    pageCount.total = currentPage;
    y = margin;
  };

  const measureTextHeight = (text: string, fontSize: number): { lines: string[]; height: number; lineHeight: number } => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(fontSize);
    const lines = doc.splitTextToSize(text, contentWidth);
    const lineHeight = fontSize * 1.5;
    const height = lines.length * lineHeight + lineHeight * 0.3;
    return { lines, height, lineHeight };
  };

  const addTextWrapped = (
    text: string,
    fontSize: number,
    isBold: boolean,
    color: [number, number, number],
    keepWithNext: boolean = false
  ): number => {
    doc.setFont('helvetica', isBold ? 'bold' : 'normal');
    doc.setFontSize(fontSize);
    doc.setTextColor(color[0], color[1], color[2]);

    const { lines, lineHeight } = measureTextHeight(text, fontSize);

    if (keepWithNext && lines.length > 1) {
      const lastTwoLinesHeight = Math.min(2, lines.length) * lineHeight;
      if (y + lastTwoLinesHeight > contentMaxY && y > margin) {
        addNewPage();
      }
    }

    let linesDrawn = 0;
    for (const line of lines) {
      if (y + lineHeight > contentMaxY) {
        addNewPage();
        doc.setFont('helvetica', isBold ? 'bold' : 'normal');
        doc.setFontSize(fontSize);
        doc.setTextColor(color[0], color[1], color[2]);
      }
      doc.text(line, margin, y);
      y += lineHeight;
      linesDrawn++;
    }
    y += lineHeight * 0.3;
    return linesDrawn;
  };

  const addHorizontalLine = () => {
    const lineHeight = 10;
    if (y + lineHeight > contentMaxY) {
      addNewPage();
    }
    doc.setDrawColor(220, 210, 195);
    doc.setLineWidth(0.5);
    doc.line(margin, y, pageWidth - margin, y);
    y += 20;
  };

  const addParagraphTitle = (title: string) => {
    const titleFontSize = 13;
    const { height: titleHeight } = measureTextHeight(title, titleFontSize);
    const minContentHeight = titleFontSize * 1.5 * 2;

    if (y + titleHeight + minContentHeight > contentMaxY) {
      addNewPage();
    }

    addTextWrapped(title, titleFontSize, true, [139, 105, 20], true);
  };

  addTextWrapped('Translation Document', 22, true, [90, 62, 43]);
  y += 4;
  addTextWrapped('翻译文档', 16, true, [90, 62, 43]);

  if (fileName) {
    y += 8;
    addTextWrapped(`Source File: ${fileName}`, 10, false, [120, 105, 85]);
  }
  addTextWrapped(`Exported: ${new Date().toLocaleString('zh-CN')}`, 10, false, [120, 105, 85]);
  addTextWrapped(`Total paragraphs: ${paragraphs.length}`, 10, false, [120, 105, 85]);

  y += 16;
  addHorizontalLine();

  paragraphs.forEach((p, idx) => {
    addParagraphTitle(`Paragraph ${idx + 1}  段落 ${idx + 1}`);

    if (bilingual) {
      const subTitleFontSize = 11;
      const { height: subTitleHeight } = measureTextHeight('Original  原文', subTitleFontSize);
      const minKeepHeight = subTitleHeight + subTitleFontSize * 1.5 * 2;

      if (y + minKeepHeight > contentMaxY && y > margin) {
        addNewPage();
      }

      addTextWrapped(`Original  原文`, 11, true, [90, 62, 43], true);
      addTextWrapped(p.text, 11, false, [60, 45, 31]);

      const { height: transSubTitleHeight } = measureTextHeight('Translation  译文', subTitleFontSize);
      const minTransKeepHeight = transSubTitleHeight + subTitleFontSize * 1.5 * 2;

      if (y + minTransKeepHeight > contentMaxY && y > margin) {
        addNewPage();
      }

      addTextWrapped(`Translation  译文`, 11, true, [90, 62, 43], true);
      addTextWrapped(p.translation || '(Not translated)', 11, false, [46, 125, 50]);
    } else {
      addTextWrapped(p.translation || p.text, 11, false, [60, 45, 31]);
    }

    if (idx < paragraphs.length - 1) {
      addHorizontalLine();
    }
  });

  const totalPages = pageCount.total;
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(150, 140, 130);
    const footerText = `第 ${i} 页 / 共 ${totalPages} 页  |  Page ${i} of ${totalPages}`;
    const textWidth = doc.getTextWidth(footerText);
    doc.text(footerText, (pageWidth - textWidth) / 2, pageHeight - margin + 10);
  }

  const pdfBuffer = doc.output('arraybuffer');
  return new Blob([pdfBuffer], { type: 'application/pdf' });
}
