export type Difficulty = 'easy' | 'medium' | 'hard';

export interface Riddle {
  id: string;
  question: string;
  options: [string, string, string];
  answerIndex: 0 | 1 | 2;
  keyword: string;
  difficulty: Difficulty;
}

export interface RoundRecord {
  round: number;
  zoneId: 0 | 1 | 2 | null;
  zoneName: string;
  riddle: Riddle | null;
  answeredCorrect: boolean | null;
  scoreEarned: number;
  keyword: string | null;
}

const EASY_RIDDLES: Riddle[] = [
  {
    id: 'e1', question: '什么鸟虽小却衔石填海？',
    options: ['精卫', '杜鹃', '喜鹊'], answerIndex: 0, keyword: '精卫填海', difficulty: 'easy'
  },
  {
    id: 'e2', question: '什么动物被称为百兽之王？',
    options: ['狮子', '老虎', '豹子'], answerIndex: 1, keyword: '虎啸山林', difficulty: 'easy'
  },
  {
    id: 'e3', question: '一年之中哪个节日吃月饼赏月？',
    options: ['端午', '中秋', '元宵'], answerIndex: 1, keyword: '中秋赏月', difficulty: 'easy'
  },
  {
    id: 'e4', question: '什么花开在寒冬腊月，傲雪凌霜？',
    options: ['牡丹', '梅花', '莲花'], answerIndex: 1, keyword: '寒梅傲雪', difficulty: 'easy'
  },
  {
    id: 'e5', question: '十二生肖之首是哪种动物？',
    options: ['牛', '鼠', '龙'], answerIndex: 1, keyword: '子鼠当先', difficulty: 'easy'
  },
  {
    id: 'e6', question: '太阳每天从哪个方向升起？',
    options: ['东方', '西方', '南方'], answerIndex: 0, keyword: '旭日东升', difficulty: 'easy'
  },
  {
    id: 'e7', question: '《西游记》中大闹天宫的是谁？',
    options: ['猪八戒', '孙悟空', '沙僧'], answerIndex: 1, keyword: '齐天大圣', difficulty: 'easy'
  },
  {
    id: 'e8', question: '什么颜色象征着喜庆与吉祥？',
    options: ['蓝色', '红色', '绿色'], answerIndex: 1, keyword: '红运当头', difficulty: 'easy'
  },
  {
    id: 'e9', question: '中国的母亲河是哪条河？',
    options: ['长江', '黄河', '淮河'], answerIndex: 1, keyword: '黄河奔腾', difficulty: 'easy'
  },
  {
    id: 'e10', question: '竹林七贤喜爱的植物是？',
    options: ['竹子', '松树', '兰花'], answerIndex: 0, keyword: '君子如竹', difficulty: 'easy'
  }
];

const MEDIUM_RIDDLES: Riddle[] = [
  {
    id: 'm1', question: '夸父逐日的故事中，夸父最终因何而死？',
    options: ['饥饿', '口渴', '劳累'], answerIndex: 1, keyword: '夸父逐日', difficulty: 'medium'
  },
  {
    id: 'm2', question: '嫦娥奔月中，嫦娥吃下的仙药是谁赠送的？',
    options: ['玉帝', '西王母', '太上老君'], answerIndex: 1, keyword: '嫦娥奔月', difficulty: 'medium'
  },
  {
    id: 'm3', question: '“四大发明”不包括以下哪项？',
    options: ['地动仪', '造纸术', '火药'], answerIndex: 0, keyword: '四大发明', difficulty: 'medium'
  },
  {
    id: 'm4', question: '“但愿人长久，千里共婵娟”是谁写的？',
    options: ['李白', '杜甫', '苏轼'], answerIndex: 2, keyword: '东坡问月', difficulty: 'medium'
  },
  {
    id: 'm5', question: '《红楼梦》又名什么？',
    options: ['西厢记', '石头记', '牡丹亭'], answerIndex: 1, keyword: '红楼梦影', difficulty: 'medium'
  },
  {
    id: 'm6', question: '古代科举考试殿试第一名叫什么？',
    options: ['榜眼', '状元', '探花'], answerIndex: 1, keyword: '金榜题名', difficulty: 'medium'
  },
  {
    id: 'm7', question: '“画龙点睛”的主人公是？',
    options: ['张僧繇', '顾恺之', '吴道子'], answerIndex: 0, keyword: '画龙点睛', difficulty: 'medium'
  },
  {
    id: 'm8', question: '“三顾茅庐”请的是谁？',
    options: ['司马懿', '诸葛亮', '周瑜'], answerIndex: 1, keyword: '三顾茅庐', difficulty: 'medium'
  },
  {
    id: 'm9', question: '长城是哪个朝代开始修建的？',
    options: ['秦朝', '汉朝', '春秋战国'], answerIndex: 2, keyword: '万里长城', difficulty: 'medium'
  },
  {
    id: 'm10', question: '“高山流水”比喻什么？',
    options: ['山水美景', '知音难觅', '音乐动听'], answerIndex: 1, keyword: '高山流水', difficulty: 'medium'
  }
];

const HARD_RIDDLES: Riddle[] = [
  {
    id: 'h1', question: '“刑天舞干戚，猛志固常在”出自哪部古籍？',
    options: ['《列子》', '《山海经》', '《淮南子》'], answerIndex: 1, keyword: '刑天舞戚', difficulty: 'hard'
  },
  {
    id: 'h2', question: '“一字千金”的典故与谁有关？',
    options: ['吕不韦', '李斯', '商鞅'], answerIndex: 0, keyword: '一字千金', difficulty: 'hard'
  },
  {
    id: 'h3', question: '“梅妻鹤子”说的是哪位诗人？',
    options: ['林逋', '陶渊明', '王维'], answerIndex: 0, keyword: '梅妻鹤子', difficulty: 'hard'
  },
  {
    id: 'h4', question: '“问鼎中原”的“鼎”象征什么？',
    options: ['财富', '权力', '文化'], answerIndex: 1, keyword: '问鼎中原', difficulty: 'hard'
  },
  {
    id: 'h5', question: '“五十步笑百步”出自哪部经典？',
    options: ['《论语》', '《孟子》', '《庄子》'], answerIndex: 1, keyword: '百步之喻', difficulty: 'hard'
  },
  {
    id: 'h6', question: '“推敲”二字的典故与哪位诗人有关？',
    options: ['贾岛', '孟郊', '韩愈'], answerIndex: 0, keyword: '推敲之妙', difficulty: 'hard'
  },
  {
    id: 'h7', question: '“三教九流”中的“三教”不包括？',
    options: ['法家', '儒家', '佛教'], answerIndex: 0, keyword: '三教九流', difficulty: 'hard'
  },
  {
    id: 'h8', question: '“草木皆兵”与哪场历史战役有关？',
    options: ['赤壁之战', '淝水之战', '官渡之战'], answerIndex: 1, keyword: '草木皆兵', difficulty: 'hard'
  },
  {
    id: 'h9', question: '“沉鱼落雁，闭月羞花”中“闭月”指谁？',
    options: ['西施', '貂蝉', '杨玉环'], answerIndex: 1, keyword: '貂蝉拜月', difficulty: 'hard'
  },
  {
    id: 'h10', question: '“六经”中后来失传的是哪一经？',
    options: ['《乐经》', '《书经》', '《礼经》'], answerIndex: 0, keyword: '乐经失传', difficulty: 'hard'
  }
];

const ALL_RIDDLES: Record<Difficulty, Riddle[]> = {
  easy: EASY_RIDDLES,
  medium: MEDIUM_RIDDLES,
  hard: HARD_RIDDLES
};

function zoneIdToDifficulty(zoneId: 0 | 1 | 2): Difficulty {
  return zoneId === 0 ? 'easy' : zoneId === 1 ? 'medium' : 'hard';
}

export function drawRiddle(zoneId: 0 | 1 | 2, excludeIds: Set<string> = new Set()): Riddle {
  const diff = zoneIdToDifficulty(zoneId);
  const pool = ALL_RIDDLES[diff].filter(r => !excludeIds.has(r.id));
  const source = pool.length > 0 ? pool : ALL_RIDDLES[diff];
  return source[Math.floor(Math.random() * source.length)];
}

export function getRiddleAnswerText(riddle: Riddle): string {
  return riddle.options[riddle.answerIndex];
}

function numberToChinese(n: number): string {
  const map = ['一', '二', '三', '四', '五'];
  return map[n - 1] ?? String(n);
}

function keywordToPhrase(keyword: string): string {
  if (keyword.length >= 4) {
    return keyword.slice(0, 2) + keyword.slice(2, 4);
  }
  return keyword;
}

export function generateDrinkingPoem(history: RoundRecord[]): string {
  const correctRounds = history.filter(r => r.answeredCorrect && r.keyword);
  const lines: string[] = [];
  const usedRounds = correctRounds.slice(0, 4);

  usedRounds.forEach((r, idx) => {
    const ord = idx === 0 ? '一投' : idx === 1 ? '再中' : idx === 2 ? '三投' : `${numberToChinese(idx + 1)}投`;
    const zone = r.zoneName || '壶中';
    const phrase = r.keyword ? keywordToPhrase(r.keyword) : '雅趣盎然';
    lines.push(`${ord}${zone}，${phrase}；`);
  });

  if (lines.length === 0) {
    return '五投未中，雅兴犹在；\n待君重来，再举琼觞。';
  }

  if (lines.length < 4) {
    const endings = [
      '雅集当歌，不醉无归；',
      '翰墨留香，尽醉方休；',
      '墨客风骚，畅饮开怀；',
      '投壶遣兴，且尽欢颜；'
    ];
    while (lines.length < 4) {
      lines.push(endings[lines.length]);
    }
  }

  return lines.join('\n');
}

export function createEmptyRound(round: number): RoundRecord {
  return {
    round,
    zoneId: null,
    zoneName: '未中',
    riddle: null,
    answeredCorrect: null,
    scoreEarned: 0,
    keyword: null
  };
}
