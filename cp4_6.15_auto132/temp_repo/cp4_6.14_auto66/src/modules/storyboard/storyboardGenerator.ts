import { v4 as uuidv4 } from 'uuid';
import type { StoryParagraph, StoryboardPanel, ShotType } from '../../types';

interface SceneInfo {
  location: string;
  time: string;
  atmosphere: string;
}

interface ActionInfo {
  subject: string;
  verb: string;
  object: string;
  emotion: string;
  intensity: number;
}

interface AnalysisResult {
  scene: SceneInfo;
  action: ActionInfo | null;
  dialogue: string;
  shotType: ShotType;
  characters: string[];
  description: string;
}

const LOCATION_KEYWORDS: Array<{ pattern: RegExp; name: string }> = [
  { pattern: /城市|街道|马路|巷子|胡同|摩天楼|大厦|建筑|街区/, name: '城市街道' },
  { pattern: /森林|树林|树木|丛林|雨林|树丛/, name: '茂密森林' },
  { pattern: /公园|花园|庭院|草坪|草地|花坛/, name: '城市公园' },
  { pattern: /海边|沙滩|海岸|港口|码头|海浪|大海|海洋/, name: '海边沙滩' },
  { pattern: /山顶|山峰|悬崖|山谷|山脉|雪山/, name: '高山峡谷' },
  { pattern: /天空|云端|星空|月亮|太阳|日落|日出/, name: '辽阔天空' },
  { pattern: /河流|湖泊|瀑布|池塘|溪水/, name: '水边湖畔' },
  { pattern: /房间|屋内|客厅|卧室|书房|厨房|办公室|教室/, name: '室内空间' },
  { pattern: /餐厅|咖啡馆|酒吧|商店|超市|商场|书店/, name: '商业场所' },
  { pattern: /学校|医院|警局|监狱|工厂|实验室/, name: '特定建筑' },
  { pattern: /火车|地铁|飞机|汽车|船舱|车站|机场/, name: '交通场景' },
  { pattern: /城堡|宫殿|古寺|教堂|废墟|遗迹/, name: '历史建筑' },
  { pattern: /沙漠|戈壁|荒原|冰原|沼泽/, name: '极端地貌' },
];

const TIME_KEYWORDS: Array<{ pattern: RegExp; name: string }> = [
  { pattern: /深夜|午夜|夜晚|夜里|晚上/, name: '深夜' },
  { pattern: /黄昏|傍晚|夕阳|日落/, name: '黄昏' },
  { pattern: /黎明|清晨|凌晨|日出|早上/, name: '黎明' },
  { pattern: /正午|中午|午后|下午/, name: '正午' },
  { pattern: /雨天|下雨|大雨|小雨|阵雨/, name: '雨天' },
  { pattern: /雪天|下雪|大雪|小雪|飘雪/, name: '雪天' },
  { pattern: /雾天|起雾|浓雾|薄雾/, name: '雾天' },
  { pattern: /晴天|阳光|烈日|晴朗/, name: '晴天' },
];

const EMOTION_KEYWORDS: Array<{ pattern: RegExp; name: string }> = [
  { pattern: /开心|高兴|快乐|喜悦|欣喜|兴奋/, name: '喜悦' },
  { pattern: /悲伤|难过|伤心|哭泣|流泪|痛苦/, name: '悲伤' },
  { pattern: /愤怒|生气|怒吼|怒斥|怒火/, name: '愤怒' },
  { pattern: /惊讶|吃惊|震惊|愕然|诧异/, name: '惊讶' },
  { pattern: /恐惧|害怕|畏惧|惊恐|慌张/, name: '恐惧' },
  { pattern: /温柔|柔和|温馨|甜蜜|幸福/, name: '温柔' },
  { pattern: /紧张|焦虑|不安|担心|犹豫/, name: '紧张' },
  { pattern: /平静|安静|沉默|淡然|从容/, name: '平静' },
];

const ACTION_VERBS: Array<{ pattern: RegExp; description: string; intensity: number }> = [
  { pattern: /推开门|推门而入|走进|走入|进入|踏进/, description: '迈步走入场景', intensity: 3 },
  { pattern: /跑出|冲出|逃离|逃跑|飞奔|冲刺/, description: '快速奔跑逃离', intensity: 5 },
  { pattern: /站着|站立|矗立|伫立|挺立/, description: '静止站立', intensity: 1 },
  { pattern: /坐下|坐了下来|落座|瘫坐/, description: '缓缓坐下', intensity: 2 },
  { pattern: /蹲下|俯身|弯腰|蜷伏/, description: '蹲下身姿', intensity: 2 },
  { pattern: /转身|回头|转过头|回过身/, description: '突然转身', intensity: 3 },
  { pattern: /推开|拉开|推|拉/, description: '手部推拉动作', intensity: 3 },
  { pattern: /拿起|抓起|举起|抬起|握紧/, description: '拿起物体', intensity: 2 },
  { pattern: /放下|丢下|扔下|掉落/, description: '放下物体', intensity: 2 },
  { pattern: /拥抱|抱住|搂住|相拥/, description: '相互拥抱', intensity: 4 },
  { pattern: /握手|挥手|招手|摆手/, description: '手部示意动作', intensity: 2 },
  { pattern: /挥拳|踢|踹|抽打|掌掴/, description: '肢体攻击动作', intensity: 5 },
  { pattern: /哭泣|流泪|抽泣|哽咽/, description: '悲伤哭泣', intensity: 4 },
  { pattern: /微笑|笑了|大笑|欢笑|咧嘴/, description: '面带微笑', intensity: 2 },
  { pattern: /皱眉|蹙额|怒视|瞪着/, description: '眉头紧锁', intensity: 3 },
  { pattern: /看着|注视|凝视|望向|盯着|凝望/, description: '目光注视', intensity: 2 },
  { pattern: /听着|聆听|侧耳|倾听/, description: '侧耳倾听', intensity: 1 },
  { pattern: /说|说道|开口|回答|问道/, description: '开口说话', intensity: 2 },
  { pattern: /喊|大叫|怒吼|尖叫|咆哮/, description: '大声叫喊', intensity: 5 },
  { pattern: /走|行走|步行|漫步|踱步/, description: '缓步行走', intensity: 2 },
  { pattern: /跑|奔跑|追赶|追逐|逃窜/, description: '快速奔跑', intensity: 4 },
  { pattern: /跳跃|跳起|跃起|纵身/, description: '跳跃动作', intensity: 4 },
  { pattern: /倒下|摔倒|跌倒|坠落/, description: '摔倒在地', intensity: 5 },
  { pattern: /伸出手|递出|接过|收下/, description: '手部交接动作', intensity: 2 },
];

function detectLocation(text: string): string {
  for (const item of LOCATION_KEYWORDS) {
    if (item.pattern.test(text)) {
      return item.name;
    }
  }
  return '未知场景';
}

function detectTime(text: string): string {
  for (const item of TIME_KEYWORDS) {
    if (item.pattern.test(text)) {
      return item.name;
    }
  }
  return '白昼';
}

function detectAtmosphere(text: string): string {
  for (const item of EMOTION_KEYWORDS) {
    if (item.pattern.test(text)) {
      return item.name;
    }
  }
  return '中性';
}

function extractCharacters(text: string): string[] {
  const namePattern = /[\u4e00-\u9fa5]{2,3}(?=[，。：！？\s说叫看想])/g;
  const matches = text.match(namePattern) || [];
  const stopWords = [
    '我们', '你们', '他们', '她们', '它们', '自己', '一个', '没有', '不是',
    '什么', '这个', '那个', '这里', '那里', '怎么', '为什么', '因为', '所以',
    '但是', '然后', '接着', '突然', '忽然', '终于', '已经', '正在', '开始',
    '看到', '听见', '感觉', '知道', '明白', '觉得', '心里', '脸上', '眼中',
  ];
  const filtered = matches.filter((m) => !stopWords.includes(m) && m.length >= 2);
  return [...new Set(filtered)].slice(0, 3);
}

function detectAction(text: string): ActionInfo | null {
  let bestMatch: { description: string; intensity: number; index: number } | null = null;

  for (const item of ACTION_VERBS) {
    const match = text.match(item.pattern);
    if (match && match.index !== undefined) {
      if (!bestMatch || match.index < bestMatch.index) {
        bestMatch = { description: item.description, intensity: item.intensity, index: match.index };
      }
    }
  }

  if (!bestMatch) return null;

  const characters = extractCharacters(text);
  const subject = characters.length > 0 ? characters[0] : '人物';

  return {
    subject,
    verb: bestMatch.description,
    object: '',
    emotion: detectAtmosphere(text),
    intensity: bestMatch.intensity,
  };
}

function extractDialogue(text: string): string {
  const results: string[] = [];

  const quotePatterns = [
    /"([^"]{1,80})"/g,
    /"([^"]{1,80})"/g,
    /「([^」]{1,80})」/g,
    /『([^』]{1,80})』/g,
    /"([^"]{1,80})"/g,
  ];

  for (const pattern of quotePatterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const content = match[1].trim();
      if (content.length > 0 && content.length <= 80 && !results.includes(content)) {
        results.push(content);
      }
    }
  }

  const colonPattern = /[\u4e00-\u9fa5]{1,4}[：:]([^。！？!?\n]{2,60})[。！？!?]/g;
  let match;
  while ((match = colonPattern.exec(text)) !== null) {
    const content = match[1].trim();
    if (content.length > 2 && content.length <= 60 && !results.includes(content)) {
      results.push(content);
    }
  }

  return results.slice(0, 2).join(' / ');
}

function determineShotType(text: string, action: ActionInfo | null, scene: SceneInfo): ShotType {
  const emotion = detectAtmosphere(text);

  if (action) {
    if (action.intensity <= 2 || emotion === '悲伤' || emotion === '喜悦' || emotion === '恐惧') {
      return '特写';
    }
    if (action.intensity === 3) {
      return '近景';
    }
    if (action.intensity === 4) {
      return '中景';
    }
    if (action.intensity >= 5) {
      return '全景';
    }
  }

  if (emotion === '悲伤' || emotion === '恐惧' || emotion === '惊讶') {
    return '特写';
  }

  if (scene.location === '辽阔天空' || scene.location === '高山峡谷' || scene.location === '极端地貌') {
    return '远景';
  }

  if (scene.location === '室内空间' || scene.location === '商业场所') {
    return '中景';
  }

  const hasCloseUpIndicator = /眼|脸|手|嘴|眉|表情|目光|神情/.test(text);
  if (hasCloseUpIndicator) return '特写';

  const hasWideIndicator = /四周|周围|整个|全部|广阔|辽阔|一望无际/.test(text);
  if (hasWideIndicator) return '远景';

  return '中景';
}

function buildDescription(scene: SceneInfo, action: ActionInfo | null, characters: string[]): string {
  const charDesc = characters.length > 0 ? characters.join('、') : '主要角色';
  const location = scene.location !== '未知场景' ? scene.location : '场景';
  const time = scene.time !== '白昼' ? `，${scene.time}时分` : '';
  const atmosphere = scene.atmosphere !== '中性' ? `，${scene.atmosphere}氛围` : '';

  if (action && scene.location !== '未知场景') {
    return `${location}背景下${time}${atmosphere}，${charDesc}${action.verb}，画面聚焦人物状态`;
  }

  if (action) {
    return `${charDesc}${action.verb}，${scene.atmosphere !== '中性' ? scene.atmosphere + '的情绪渲染画面' : '光影突出人物神态'}`;
  }

  if (scene.location !== '未知场景') {
    return `${location}全景${time}${atmosphere}，${charDesc}位于画面中，营造故事氛围`;
  }

  return `${charDesc}处于画面中心，环境烘托人物心境，${scene.atmosphere}氛围弥漫`;
}

function analyzeParagraph(text: string, index: number): AnalysisResult {
  const scene: SceneInfo = {
    location: detectLocation(text),
    time: detectTime(text),
    atmosphere: detectAtmosphere(text),
  };

  const action = detectAction(text);
  const dialogue = extractDialogue(text);
  const characters = extractCharacters(text);
  const shotType = determineShotType(text, action, scene);
  const description = buildDescription(scene, action, characters);

  return { scene, action, dialogue, shotType, characters, description };
}

export function generateStoryboard(paragraphs: StoryParagraph[]): Promise<StoryboardPanel[]> {
  return new Promise((resolve, reject) => {
    const delay = 500 + Math.random() * 2000;

    setTimeout(() => {
      try {
        const panels: StoryboardPanel[] = paragraphs.map((p, idx) => {
          const analysis = analyzeParagraph(p.content, idx);
          let dialogue = analysis.dialogue;

          if (!dialogue) {
            const cleanText = p.content.replace(/\s+/g, '').slice(0, 40);
            dialogue = cleanText + (p.content.replace(/\s+/g, '').length > 40 ? '…' : '');
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
