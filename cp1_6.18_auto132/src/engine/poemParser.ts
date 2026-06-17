import { Imagery, ShapeType } from '../stores/poemStore';

interface ImageryRule {
  keywords: string[];
  name: string;
  color: string;
  shape: ShapeType;
  meaning: string;
  source: string;
  author: string;
  similarPoems: string[];
}

const IMAGERY_RULES: ImageryRule[] = [
  {
    keywords: ['柳', '杨', '翠柳', '垂柳', '柳枝'],
    name: '翠柳',
    color: '#5B8C5A',
    shape: 'tree',
    meaning: '柳树在中国古典诗词中常象征离别、思念与春意盎然。柳枝依依，寄托了诗人对友人或故土的眷恋之情。',
    source: '《绝句》',
    author: '杜甫',
    similarPoems: ['碧玉妆成一树高，万条垂下绿丝绦', '羌笛何须怨杨柳，春风不度玉门关', '渭城朝雨浥轻尘，客舍青青柳色新'],
  },
  {
    keywords: ['黄鹂', '黄莺', '鸟', '雀', '燕', '雁', '鸥'],
    name: '黄鹂',
    color: '#E8B923',
    shape: 'bird',
    meaning: '黄鹂是春天的使者，鸣声清脆悦耳，象征生机与喜悦。在诗词中常以鸟语传达春日的美好与自然的生机。',
    source: '《绝句》',
    author: '杜甫',
    similarPoems: ['春眠不觉晓，处处闻啼鸟', '两个黄鹂鸣翠柳，一行白鹭上青天', '留连戏蝶时时舞，自在娇莺恰恰啼'],
  },
  {
    keywords: ['鸣', '叫', '啼', '唱', '语'],
    name: '鸣叫',
    color: '#C9A66B',
    shape: 'cloud',
    meaning: '鸟鸣之声是大自然最动人的乐章，诗词中常以声音描写烘托意境，或表达喜悦，或寄托离愁。',
    source: '《绝句》',
    author: '杜甫',
    similarPoems: ['月出惊山鸟，时鸣春涧中', '蝉噪林逾静，鸟鸣山更幽', '春眠不觉晓，处处闻啼鸟'],
  },
  {
    keywords: ['山', '峰', '岭', '峦', '崖', '丘'],
    name: '青山',
    color: '#6B7B6B',
    shape: 'mountain',
    meaning: '山在中国文化中象征崇高、稳重与永恒。青山绿水寄托了诗人对自然的热爱和对隐逸生活的向往。',
    source: '《望庐山瀑布》',
    author: '李白',
    similarPoems: ['会当凌绝顶，一览众山小', '相看两不厌，只有敬亭山', '青山遮不住，毕竟东流去'],
  },
  {
    keywords: ['水', '江', '河', '湖', '海', '溪', '泉', '流', '浪'],
    name: '流水',
    color: '#7BA3B5',
    shape: 'water',
    meaning: '流水象征时间的流逝、生命的绵延，也常寄托绵绵不绝的思念与愁绪。',
    source: '《虞美人》',
    author: '李煜',
    similarPoems: ['问君能有几多愁，恰似一江春水向东流', '桃花潭水深千尺，不及汪伦送我情', '抽刀断水水更流，举杯消愁愁更愁'],
  },
  {
    keywords: ['船', '舟', '帆', '橹', '棹'],
    name: '孤舟',
    color: '#8B6B4A',
    shape: 'boat',
    meaning: '孤舟常象征漂泊、孤独与远方。一叶扁舟在诗词中既是旅人的载体，也是自由心灵的寄托。',
    source: '《江雪》',
    author: '柳宗元',
    similarPoems: ['孤帆远影碧空尽，唯见长江天际流', '君看一叶舟，出没风波里', '移舟泊烟渚，日暮客愁新'],
  },
  {
    keywords: ['竹', '筠', '竿'],
    name: '翠竹',
    color: '#4A7A4A',
    shape: 'bamboo',
    meaning: '竹象征高洁、坚韧与君子之风。宁折不弯的竹节代表了文人的气节与操守。',
    source: '《竹石》',
    author: '郑燮',
    similarPoems: ['咬定青山不放松，立根原在破岩中', '独坐幽篁里，弹琴复长啸', '竹外桃花三两枝，春江水暖鸭先知'],
  },
  {
    keywords: ['花', '桃', '梅', '菊', '荷', '兰', '杏', '牡丹'],
    name: '落花',
    color: '#D47A7A',
    shape: 'flower',
    meaning: '花是美好与短暂的象征。花开令人欣喜，花落惹人感伤，花开花落承载着诗人对生命的感悟。',
    source: '《春晓》',
    author: '孟浩然',
    similarPoems: ['夜来风雨声，花落知多少', '人面不知何处去，桃花依旧笑春风', '落红不是无情物，化作春泥更护花'],
  },
  {
    keywords: ['月', '明月', '月光', '月色', '月轮'],
    name: '明月',
    color: '#E8E0D0',
    shape: 'moon',
    meaning: '明月是思乡、团圆与思念的象征。千里共明月，明月千里寄相思，承载了无数游子的乡愁。',
    source: '《静夜思》',
    author: '李白',
    similarPoems: ['床前明月光，疑是地上霜', '海上生明月，天涯共此时', '明月几时有，把酒问青天'],
  },
  {
    keywords: ['云', '烟', '雾', '霞', '霭'],
    name: '云烟',
    color: '#B8B0A0',
    shape: 'cloud',
    meaning: '云烟象征缥缈、悠闲与超脱。云卷云舒的悠然，常被诗人用来表达对自由与闲适生活的向往。',
    source: '《终南别业》',
    author: '王维',
    similarPoems: ['行到水穷处，坐看云起时', '黄河远上白云间，一片孤城万仞山', '只在此山中，云深不知处'],
  },
  {
    keywords: ['日', '阳', '朝', '曦', '落日', '夕阳'],
    name: '朝阳',
    color: '#E88C4A',
    shape: 'sun',
    meaning: '太阳象征光明、希望与温暖。朝阳代表新生，夕阳寄寓迟暮，都是诗人情感的重要寄托。',
    source: '《登鹳雀楼》',
    author: '王之涣',
    similarPoems: ['白日依山尽，黄河入海流', '大漠孤烟直，长河落日圆', '夕阳无限好，只是近黄昏'],
  },
  {
    keywords: ['雨', '雨', '霖', '霖', '露', '雪'],
    name: '春雨',
    color: '#8CA8B8',
    shape: 'rain',
    meaning: '春雨滋润万物，象征恩泽与希望。雨也是忧愁的化身，梧桐更兼细雨，点点滴滴都是愁绪。',
    source: '《春夜喜雨》',
    author: '杜甫',
    similarPoems: ['好雨知时节，当春乃发生', '清明时节雨纷纷，路上行人欲断魂', '夜阑卧听风吹雨，铁马冰河入梦来'],
  },
  {
    keywords: ['风', '飙', '飓'],
    name: '清风',
    color: '#A8B8A8',
    shape: 'wind',
    meaning: '风是无形的诗意。春风送暖，秋风萧瑟，风既是自然的呼吸，也是诗人心情的外化。',
    source: '《敕勒歌》',
    author: '佚名',
    similarPoems: ['天苍苍，野茫茫，风吹草低见牛羊', '春风又绿江南岸，明月何时照我还', '夜来风雨声，花落知多少'],
  },
];

function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}

function getDefaultPosition(index: number, total: number): { x: number; y: number } {
  const cols = Math.ceil(Math.sqrt(total));
  const row = Math.floor(index / cols);
  const col = index % cols;
  return {
    x: 100 + col * 200 + (Math.random() - 0.5) * 60,
    y: 100 + row * 150 + (Math.random() - 0.5) * 40,
  };
}

export function parsePoem(poem: string): Imagery[] {
  if (!poem.trim()) return [];

  const results: Imagery[] = [];
  const usedRules = new Set<number>();

  for (let i = 0; i < IMAGERY_RULES.length; i++) {
    const rule = IMAGERY_RULES[i];
    for (const keyword of rule.keywords) {
      if (poem.includes(keyword) && !usedRules.has(i)) {
        usedRules.add(i);
        break;
      }
    }
  }

  const matchedIndices = Array.from(usedRules);

  if (matchedIndices.length === 0) {
    const fallbackRules = [0, 1, 3, 4];
    fallbackRules.forEach((idx, i) => {
      const rule = IMAGERY_RULES[idx];
      results.push({
        id: generateId(),
        name: rule.name,
        color: rule.color,
        shape: rule.shape,
        position: getDefaultPosition(i, fallbackRules.length),
        size: 1,
        opacity: 1,
        meaning: rule.meaning,
        source: rule.source,
        author: rule.author,
        similarPoems: rule.similarPoems,
      });
    });
    return results;
  }

  matchedIndices.forEach((ruleIdx, i) => {
    const rule = IMAGERY_RULES[ruleIdx];
    results.push({
      id: generateId(),
      name: rule.name,
      color: rule.color,
      shape: rule.shape,
      position: getDefaultPosition(i, matchedIndices.length),
      size: 1,
      opacity: 1,
      meaning: rule.meaning,
      source: rule.source,
      author: rule.author,
      similarPoems: rule.similarPoems,
    });
  });

  return results;
}
