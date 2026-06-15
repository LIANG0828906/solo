export type ThemeType = 'idiom' | 'daily' | 'english';

export const IDIOMS: string[] = [
  '一心一意', '意气风发', '发扬光大', '大显身手', '手忙脚乱',
  '乱七八糟', '糟糕透顶', '顶天立地', '地久天长', '长驱直入',
  '入木三分', '分秒必争', '争先恐后', '后来居上', '上行下效',
  '效犬马劳', '劳苦功高', '高山流水', '水落石出', '出奇制胜',
  '胜券在握', '握手言欢', '欢天喜地', '地大物博', '博学多才',
  '才高八斗', '斗志昂扬', '扬长避短', '短兵相接', '接二连三',
  '三心二意', '意味深长', '长年累月', '月明星稀', '稀世珍宝',
  '宝刀不老', '老当益壮', '壮志凌云', '云开雾散', '散兵游勇',
  '勇往直前', '前赴后继', '继往开来', '来日方长', '长治久安',
  '安居乐业', '业精于勤', '勤学好问', '问心无愧', '愧不敢当',
  '当机立断', '断章取义', '义不容辞', '辞旧迎新', '新陈代谢',
  '谢天谢地', '地老天荒', '荒无人烟', '烟消云散', '散花天女',
  '女娲补天', '天衣无缝', '缝衣浅带', '带月披星', '星罗棋布',
  '布衣之交', '交头接耳', '耳聪目明', '明察秋毫', '毫不犹豫',
  '豫让吞炭', '炭火熊熊', '雄心壮志', '志士仁人', '人山人海',
  '海阔天空', '空前绝后', '后顾之忧', '忧心忡忡', '忡忡不安',
  '安然无恙', '恙疾不生', '生龙活虎', '虎头蛇尾', '尾大不掉',
  '掉以轻心', '心想事成', '成人之美', '美不胜收', '收放自如',
  '如鱼得水', '水到渠成', '成千上万', '万紫千红', '红红火火',
  '火树银花', '花好月圆', '圆满成功', '功成名就', '就地取材'
];

export const DAILY_WORDS: string[] = [
  '天空', '空气', '气球', '球拍', '拍手', '手机', '机会',
  '会议', '议论', '论文', '文字', '字体', '体育', '育人',
  '人民', '民生', '生活', '活动', '动力', '力气', '气候',
  '候选', '选择', '择业', '业务', '务实', '实现', '现场',
  '场地', '地面', '面包', '包容', '容易', '易经', '经常',
  '常识', '识别', '别人', '人生', '生日', '日出', '出门',
  '门口', '口红', '红色', '色彩', '彩云', '云朵', '朵朵',
  '花朵', '花园', '园丁', '丁香', '香气', '气味', '味道',
  '道路', '路灯', '灯光', '光明', '明天', '天空', '空虚',
  '虚伪', '伪装', '装备', '备注', '注意', '意思', '思念',
  '念书', '书本', '本来', '来回', '回家', '家庭', '庭院',
  '院落', '落叶', '叶子', '子夜', '夜晚', '晚上', '上课',
  '课堂', '堂主', '主席', '席位', '位置', '置顶', '顶级',
  '级别', '别离', '离开', '开心', '心情', '情感', '感动',
  '动物', '物品', '品质', '质量', '量力', '力求', '求救',
  '救命', '命令', '令牌', '牌匾', '匾额', '额外', '外出',
  '出现', '现在', '在乎', '呼吸', '吸引', '引导', '导游'
];

export const ENGLISH_WORDS: string[] = [
  'apple', 'elephant', 'tiger', 'rabbit', 'tree', 'eagle', 'egg',
  'garden', 'nose', 'eleven', 'name', 'email', 'lion', 'nest',
  'tower', 'river', 'rose', 'east', 'tea', 'art', 'toy', 'youth',
  'heart', 'top', 'pen', 'note', 'eye', 'end', 'dog', 'game',
  'eat', 'tank', 'king', 'goat', 'think', 'key', 'yellow', 'wolf',
  'fox', 'xenon', 'nice', 'ear', 'run', 'nest', 'turtle', 'eraser',
  'road', 'desk', 'kite', 'engine', 'engineer', 'rain', 'notebook',
  'kangaroo', 'orange', 'elephant', 'trombone', 'erasable', 'error',
  'root', 'tooth', 'happy', 'yogurt', 'tomato', 'oxygen', 'nurse',
  'eager', 'respond', 'dolphin', 'node', 'eastern', 'network',
  'kitchen', 'needle', 'effort', 'travel', 'laptop', 'piano',
  'ocean', 'near', 'rocket', 'tornado', 'opera', 'astronaut',
  'tiger', 'radish', 'husband', 'dictionary', 'yesterday', 'winner'
];

export function normalizeChar(char: string): string {
  return char.trim().toLowerCase();
}

export function validateWordMatch(prevWord: string, nextWord: string): boolean {
  if (!prevWord || !nextWord) return false;
  const trimmedPrev = prevWord.trim();
  const trimmedNext = nextWord.trim();
  if (trimmedPrev.length === 0 || trimmedNext.length === 0) return false;
  const lastChar = normalizeChar(trimmedPrev[trimmedPrev.length - 1]);
  const firstChar = normalizeChar(trimmedNext[0]);
  return lastChar === firstChar;
}

export function getWordsByTheme(theme: ThemeType): string[] {
  switch (theme) {
    case 'idiom':
      return IDIOMS;
    case 'daily':
      return DAILY_WORDS;
    case 'english':
      return ENGLISH_WORDS;
    default:
      return IDIOMS;
  }
}

export function getRandomStartWord(theme: ThemeType): string {
  const words = getWordsByTheme(theme);
  return words[Math.floor(Math.random() * words.length)];
}

export const THEME_LABELS: Record<ThemeType, string> = {
  idiom: '成语',
  daily: '日常词语',
  english: '英文单词'
};
