import { v4 as uuidv4 } from 'uuid';
import { StoryParagraph, StoryboardPanel, ShotType } from '../../types';

const SCENE_PATTERNS = [
  { keywords: ['城市', '街道', '建筑', '摩天楼', '灯火', '夜景'], scene: '城市街景' },
  { keywords: ['森林', '树林', '树木', '草地', '公园', '花园'], scene: '自然森林' },
  { keywords: ['海边', '沙滩', '海浪', '大海', '海洋', '港口'], scene: '海边沙滩' },
  { keywords: ['山', '山脉', '山峰', '雪山', '山谷', '悬崖'], scene: '高山峡谷' },
  { keywords: ['天空', '云端', '星空', '月亮', '太阳', '日落'], scene: '天空远景' },
  { keywords: ['房间', '屋内', '客厅', '卧室', '办公室', '教室'], scene: '室内场景' },
  { keywords: ['餐厅', '咖啡馆', '酒吧', '商店', '超市', '商场'], scene: '商业场所' },
  { keywords: ['雨', '雪', '风', '雷', '闪电', '雾'], scene: '天气氛围' },
  { keywords: ['夜晚', '深夜', '凌晨', '黄昏', '傍晚', '黎明'], scene: '特定时段' },
  { keywords: ['学校', '医院', '警局', '监狱', '工厂'], scene: '特定建筑' },
];

const ACTION_KEYWORDS = [
  { words: ['走进', '进入', '走入', '踏进'], action: '迈步走入场景' },
  { words: ['跑出', '冲出', '逃离', '逃跑'], action: '快速奔跑逃离' },
  { words: ['站着', '站立', '矗立', '伫立'], action: '静止站立' },
  { words: ['坐下', '坐了下来', '落座'], action: '缓缓坐下' },
  { words: ['蹲下', '俯身', '弯腰'], action: '蹲下身姿' },
  { words: ['转身', '回头', '转过头'], action: '突然转身' },
  { words: ['推', '推开', '拉', '拉开'], action: '手部推拉动作' },
  { words: ['拿起', '抓起', '举起', '抬起'], action: '拿起物体' },
  { words: ['放下', '丢下', '扔下'], action: '放下物体' },
  { words: ['拥抱', '抱住', '搂住'], action: '相互拥抱' },
  { words: ['握手', '挥手', '招手'], action: '手部示意动作' },
  { words: ['打', '挥拳', '踢', '踹'], action: '肢体攻击动作' },
  { words: ['哭泣', '流泪', '抽泣'], action: '悲伤哭泣' },
  { words: ['微笑', '笑了', '大笑', '欢笑'], action: '面带微笑' },
  { words: ['皱眉', '皱眉', '怒视'], action: '眉头紧锁' },
  { words: ['看着', '注视', '凝视', '望向'], action: '目光注视' },
  { words: ['听着', '聆听', '侧耳'], action: '侧耳倾听' },
  { words: ['说', '说道', '开口', '回答'], action: '开口说话' },
  { words: ['喊', '大叫', '怒吼', '尖叫'], action: '大声叫喊' },
  { words: ['跑', '奔跑', '冲刺', '追赶'], action: '快速奔跑' },
];

const SHOT_RULES: { pattern: RegExp; type: ShotType; priority: number }[] = [
  { pattern: /[看注视望凝盯]/, type: '特写', priority: 10 },
  { pattern: /[脸眼嘴鼻眉表情神情]/, type: '特写', priority: 10 },
  { pattern: /[微笑哭泣流泪愤怒惊讶]/, type: '特写', priority: 9 },
  { pattern: /[手握掌手指指尖拿握]/, type: '特写', priority: 8 },
  { pattern: /[喊声叫怒吼尖叫]/, type: '近景', priority: 7 },
  { pattern: /[站坐蹲跪躺趴]/, type: '近景', priority: 6 },
  { pattern: /[走跑跳奔追逃]/, type: '中景', priority: 5 },
  { pattern: /[转身回头拥抱握手]/, type: '中景', priority: 5 },
  { pattern: /[房间屋里屋内客厅卧室办公室]/, type: '全景', priority: 4 },
  { pattern: /[城市街道建筑森林海边天空]/, type: '远景', priority: 3 },
  { pattern: /[整个全部四周周围环境]/, type: '全景', priority: 2 },
];

const DEFAULT_SHOT_TYPES: ShotType[] = ['远景', '全景', '中景', '近景', '特写'];

function detectScene(text: string): string {
  for (const pattern of SCENE_PATTERNS) {
    if (pattern.keywords.some((k) => text.includes(k))) {
      return pattern.scene;
    }
  }
  return '综合场景';
}

function detectAction(text: string): string | null {
  for (const item of ACTION_KEYWORDS) {
    if (item.words.some((w) => text.includes(w))) {
      return item.action;
    }
  }
  return null;
}

function extractDialogue(text: string): string {
  const patterns = [
    /"([^"]+)"/g,
    /"([^"]+)"/g,
    /「([^」]+)」/g,
    /『([^』]+)』/g,
    /"([^"]+)"/g,
    /："([^"]+)"/g,
    /:"([^"]+)"/g,
  ];

  const results: string[] = [];

  for (const pattern of patterns) {
    const matches = text.match(pattern);
    if (matches) {
      for (const match of matches) {
        const clean = match.replace(/^[:""「『]|[""」』]$/g, '');
        if (clean.length > 0 && !results.includes(clean)) {
          results.push(clean);
        }
      }
    }
  }

  const colonPattern = /[：:]([^。！？!?\n]{2,80})[。！？!?]/g;
  let match;
  while ((match = colonPattern.exec(text)) !== null) {
    const content = match[1].trim();
    if (content.length > 2 && content.length < 80 && !results.includes(content)) {
      results.push(content);
    }
  }

  return results.length > 0 ? results.join(' / ') : '';
}

function determineShotType(text: string, paragraphIndex: number): ShotType {
  let bestMatch: { type: ShotType; priority: number } | null = null;

  for (const rule of SHOT_RULES) {
    if (rule.pattern.test(text)) {
      if (!bestMatch || rule.priority > bestMatch.priority) {
        bestMatch = { type: rule.type, priority: rule.priority };
      }
    }
  }

  if (bestMatch) return bestMatch.type;

  return DEFAULT_SHOT_TYPES[paragraphIndex % DEFAULT_SHOT_TYPES.length];
}

function extractCharacters(text: string): string[] {
  const namePattern = /[\u4e00-\u9fa5]{2,3}(?=[，。：！？\s])/g;
  const matches = text.match(namePattern) || [];
  const stopWords = ['我们', '你们', '他们', '她们', '它们', '自己', '一个', '没有', '不是', '什么', '这个', '那个', '这里', '那里'];
  return [...new Set(matches.filter((m) => !stopWords.includes(m) && m.length >= 2))].slice(0, 3);
}

function generateDescription(text: string, scene: string, action: string | null, characters: string[]): string {
  const charStr = characters.length > 0 ? `角色 ${characters.join('、')}` : '主要角色';

  if (action && scene !== '综合场景') {
    return `${scene}背景下，${charStr}${action}，画面情绪随剧情发展变化`;
  }
  if (action) {
    return `${charStr}${action}，光影效果突出人物状态`;
  }
  if (scene !== '综合场景') {
    return `${scene}全景展示，${charStr}位于画面中合适位置，营造故事氛围`;
  }

  const patterns = [
    `${charStr}处于画面中心位置，周围环境烘托人物心境`,
    `中景展示${charStr}的互动关系，背景虚化处理`,
    `多角度捕捉${charStr}的细微动作和表情变化`,
    `场景缓慢展开，${charStr}逐渐进入观众视野`,
    `特写镜头聚焦${charStr}的关键动作细节`,
  ];

  const wordCount = text.length;
  return patterns[wordCount % patterns.length];
}

function analyzeParagraph(
  text: string,
  paragraphIndex: number
): { description: string; shotType: ShotType; dialogue: string; scene: string; action: string | null } {
  const scene = detectScene(text);
  const action = detectAction(text);
  const dialogue = extractDialogue(text);
  const shotType = determineShotType(text, paragraphIndex);
  const characters = extractCharacters(text);
  const description = generateDescription(text, scene, action, characters);

  return { description, shotType, dialogue, scene, action };
}

export function generateStoryboard(paragraphs: StoryParagraph[]): Promise<StoryboardPanel[]> {
  return new Promise((resolve, reject) => {
    const delay = 400 + Math.random() * 2200;

    setTimeout(() => {
      try {
        const panels: StoryboardPanel[] = paragraphs.map((p, idx) => {
          const analysis = analyzeParagraph(p.content, idx);
          let dialogue = analysis.dialogue;
          if (!dialogue && p.content.length > 0) {
            const shortText = p.content.replace(/\s+/g, '').slice(0, 36);
            dialogue = shortText + (p.content.length > 36 ? '…' : '');
          }
          return {
            id: uuidv4(),
            sceneNumber: idx + 1,
            shotType: analysis.shotType,
            description: analysis.description,
            dialogue,
            sourceParagraphIndex: idx,
          };
        });
        resolve(panels);
      } catch (err) {
        reject(err);
      }
    }, delay);
  });
}
