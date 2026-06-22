import type { Level, CharacterData } from '../types';

const pinyinMap: Record<string, string> = {
  '人': 'rén', '之': 'zhī', '初': 'chū', '性': 'xìng', '本': 'běn',
  '善': 'shàn', '相': 'xiāng', '近': 'jìn', '习': 'xí', '远': 'yuǎn',
  '苟': 'gǒu', '教': 'jiào', '道': 'dào', '贵': 'guì', '以': 'yǐ',
  '专': 'zhuān', '昔': 'xī', '孟': 'mèng', '母': 'mǔ', '择': 'zé',
  '床': 'chuáng', '前': 'qián', '明': 'míng', '月': 'yuè', '光': 'guāng',
  '疑': 'yí', '是': 'shì', '地': 'dì', '上': 'shàng', '霜': 'shuāng',
  '举': 'jǔ', '头': 'tóu', '望': 'wàng', '低': 'dī', '思': 'sī',
  '故': 'gù', '乡': 'xiāng', '春': 'chūn', '眠': 'mián', '不': 'bù',
  '觉': 'jué', '晓': 'xiǎo', '处': 'chù', '闻': 'wén', '啼': 'tí',
  '鸟': 'niǎo', '夜': 'yè', '来': 'lái', '风': 'fēng', '雨': 'yǔ',
  '花': 'huā', '落': 'luò', '多': 'duō', '少': 'shǎo',
  '先': 'xiān', '天': 'tiān', '下': 'xià', '之': 'zhī', '忧': 'yōu',
  '而': 'ér', '后': 'hòu', '乐': 'lè', '山': 'shān', '行': 'xíng',
  '远': 'yuǎn', '寒': 'hán', '山': 'shān', '石': 'shí', '径': 'jìng',
  '斜': 'xié', '白': 'bái', '云': 'yún', '深': 'shēn', '有': 'yǒu',
  '人': 'rén', '家': 'jiā', '停': 'tíng', '车': 'chē', '坐': 'zuò',
  '爱': 'ài', '枫': 'fēng', '林': 'lín', '晚': 'wǎn', '霜': 'shuāng',
  '叶': 'yè', '红': 'hóng', '于': 'yú', '二': 'èr', '月': 'yuè',
  '花': 'huā', '空': 'kōng', '新': 'xīn', '雨': 'yǔ', '后': 'hòu',
  '天': 'tiān', '气': 'qì', '晚': 'wǎn', '来': 'lái', '秋': 'qiū',
  '明': 'míng', '月': 'yuè', '松': 'sōng', '间': 'jiān', '照': 'zhào',
  '清': 'qīng', '泉': 'quán', '石': 'shí', '上': 'shàng', '流': 'liú'
};

const rhymeMap: Record<string, string> = {
  '人': '十一真', '之': '四支', '初': '六鱼', '性': '二十四敬', '本': '十三元',
  '善': '十七霰', '相': '七阳', '近': '十二吻', '习': '十四缉', '远': '十四愿',
  '苟': '二十六宥', '教': '十九效', '道': '十九皓', '贵': '五未', '以': '四纸',
  '专': '一先', '昔': '十一陌', '孟': '二十四敬', '母': '一姥', '择': '十一陌',
  '床': '七阳', '前': '一先', '明': '八庚', '月': '六月', '光': '七阳',
  '疑': '四支', '是': '四纸', '地': '四寘', '上': '二十二养', '霜': '七阳',
  '举': '六语', '头': '十一尤', '望': '二十三漾', '低': '八齐', '思': '四支',
  '故': '七遇', '乡': '七阳', '春': '十一真', '眠': '一先', '不': '五物',
  '觉': '三觉', '晓': '十七筱', '处': '六御', '闻': '十二文', '啼': '八齐',
  '鸟': '十七筱', '夜': '二十二禡', '来': '十灰', '风': '一东', '雨': '七麌',
  '花': '六麻', '落': '十药', '多': '五歌', '少': '十七筱',
  '先': '一先', '天': '一先', '下': '二十二禡', '忧': '十一尤', '而': '四支',
  '后': '二十六宥', '乐': '十药', '山': '十五删', '行': '七阳', '寒': '十四寒',
  '石': '十一陌', '径': '二十五径', '斜': '六麻', '白': '十一陌', '云': '十二文',
  '深': '十二侵', '有': '二十五有', '家': '六麻', '停': '九青', '车': '六麻',
  '坐': '二十一箇', '爱': '十一队', '枫': '一东', '林': '十二侵', '晚': '十四旱',
  '叶': '十六叶', '红': '一东', '于': '六鱼', '二': '四寘', '空': '一东',
  '新': '十一真', '后': '二十六宥', '气': '五未', '秋': '十一尤', '松': '二冬',
  '间': '十五删', '照': '十八啸', '清': '八庚', '泉': '一先', '流': '十一尤'
};

const distractorChars = ['之', '乎', '者', '也', '矣', '焉', '哉', '于', '以', '为'];

function getPinyin(char: string): string {
  return pinyinMap[char] || char;
}

function getRhyme(char: string): string {
  return rhymeMap[char] || '平水韵';
}

export const levels: Level[] = [
  {
    id: 1,
    title: '第一关 · 三字经',
    content: '人之初 性本善 性相近 习相远',
    targetChars: ['人','之','初','性','本','善','性','相','近','习','相','远','苟','教','道','贵','以','专','昔','孟'],
    distractorChars: [],
    randomize: false
  },
  {
    id: 2,
    title: '第二关 · 静夜思',
    content: '床前明月光 疑是地上霜\n举头望明月 低头思故乡\n春眠不觉晓 处处闻啼鸟',
    targetChars: ['床','前','明','月','光','疑','是','地','上','霜','举','头','望','明','月','低','头','思','故','乡','春','眠','不','觉','晓','处','处','闻','啼','鸟','夜','来','风','雨','声','花','落','知','多','少'],
    distractorChars: distractorChars.slice(0, 5),
    randomize: false
  },
  {
    id: 3,
    title: '第三关 · 岳阳楼记',
    content: '先天下之忧而忧 后天下之乐而乐\n远上寒山石径斜 白云深处有人家\n停车坐爱枫林晚 霜叶红于二月花',
    targetChars: ['先','天','下','之','忧','而','忧','后','天','下','之','乐','而','乐','远','上','寒','山','石','径','斜','白','云','深','处','有','人','家','停','车','坐','爱','枫','林','晚','霜','叶','红','于','二','月','花','空','山','新','雨','后','天','气','晚','来','秋','明','月','松','间','照','清','泉','石','上','流'],
    distractorChars: distractorChars,
    randomize: true
  }
];

export function getCharacterList(level: Level): CharacterData[] {
  const chars: CharacterData[] = [];
  
  const targetSet = new Set(level.targetChars);
  targetSet.forEach(char => {
    chars.push({
      char,
      pinyin: getPinyin(char),
      rhyme: getRhyme(char),
      isDistractor: false
    });
  });
  
  level.distractorChars.forEach(char => {
    chars.push({
      char,
      pinyin: getPinyin(char),
      rhyme: getRhyme(char),
      isDistractor: true
    });
  });
  
  if (level.randomize) {
    for (let i = chars.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [chars[i], chars[j]] = [chars[j], chars[i]];
    }
  } else {
    chars.sort((a, b) => a.rhyme.localeCompare(b.rhyme));
  }
  
  return chars;
}

export function getCurrentLevel(levelId: number): Level {
  return levels.find(l => l.id === levelId) || levels[0];
}
