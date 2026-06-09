export interface Riddle {
  id: string;
  question: string;
  answer: string;
  difficulty: 'easy' | 'medium' | 'hard';
  theme: string;
}

export const riddleLibrary: Riddle[] = [
  {
    id: '1',
    question: '什么东西越洗越脏？',
    answer: '水',
    difficulty: 'easy',
    theme: '日常'
  },
  {
    id: '2',
    question: '什么动物最爱问为什么？',
    answer: '猪',
    difficulty: 'easy',
    theme: '动物'
  },
  {
    id: '3',
    question: '一个人在森林里迷路了，他走啊走，突然看到前面有一座桥，桥的另一端有一只老虎，他怎么过去？',
    answer: '晕过去',
    difficulty: 'easy',
    theme: '趣味'
  },
  {
    id: '4',
    question: '什么书中毛病最多？',
    answer: '医书',
    difficulty: 'easy',
    theme: '文字'
  },
  {
    id: '5',
    question: '什么东西有头无脚？',
    answer: '砖',
    difficulty: 'easy',
    theme: '日常'
  },
  {
    id: '6',
    question: '千条线，万条线，掉在水里看不见。',
    answer: '雨',
    difficulty: 'easy',
    theme: '自然'
  },
  {
    id: '7',
    question: '一点一横长，一撇到南洋，南洋有个人，只有一寸长。',
    answer: '府',
    difficulty: 'medium',
    theme: '文字'
  },
  {
    id: '8',
    question: '上边毛，下边毛，中间一颗黑葡萄。',
    answer: '眼睛',
    difficulty: 'easy',
    theme: '人体'
  },
  {
    id: '9',
    question: '红口袋，绿口袋，有人怕，有人爱。',
    answer: '辣椒',
    difficulty: 'easy',
    theme: '植物'
  },
  {
    id: '10',
    question: '身穿绿衣裳，肚里水汪汪，生的子儿多，个个黑脸膛。',
    answer: '西瓜',
    difficulty: 'easy',
    theme: '植物'
  },
  {
    id: '11',
    question: '弯弯藤儿架上爬，串串珍珠上边挂。',
    answer: '葡萄',
    difficulty: 'easy',
    theme: '植物'
  },
  {
    id: '12',
    question: '小小诸葛亮，独坐中军帐，摆下八卦阵，专捉飞来将。',
    answer: '蜘蛛',
    difficulty: 'medium',
    theme: '动物'
  },
  {
    id: '13',
    question: '远看像座山，近看不是山，上边水直流，下边石头干。',
    answer: '雨伞',
    difficulty: 'medium',
    theme: '日常'
  },
  {
    id: '14',
    question: '一物生来真奇怪，肚下长个皮口袋，口袋里面藏宝宝，走起路来蹦得快。',
    answer: '袋鼠',
    difficulty: 'easy',
    theme: '动物'
  },
  {
    id: '15',
    question: '解落三秋叶，能开二月花。过江千尺浪，入竹万竿斜。',
    answer: '风',
    difficulty: 'medium',
    theme: '自然'
  },
  {
    id: '16',
    question: '两个小口袋，天天随身带，若是少一个，就把人笑坏。',
    answer: '袜子',
    difficulty: 'easy',
    theme: '日常'
  },
  {
    id: '17',
    question: '有面没有口，有脚没有手，虽有四只脚，自己不会走。',
    answer: '桌子',
    difficulty: 'easy',
    theme: '日常'
  },
  {
    id: '18',
    question: '独木造高楼，没瓦没砖头，人在水下走，水在人上流。',
    answer: '雨伞',
    difficulty: 'medium',
    theme: '日常'
  },
  {
    id: '19',
    question: '身披花棉袄，唱歌呱呱叫，田里捉害虫，丰收立功劳。',
    answer: '青蛙',
    difficulty: 'easy',
    theme: '动物'
  },
  {
    id: '20',
    question: '像云不是云，像烟不是烟，风吹轻轻飘，日出慢慢散。',
    answer: '雾',
    difficulty: 'easy',
    theme: '自然'
  }
];

export const lanternColors = {
  round: '#ff6b6b',
  walking: '#feca57',
  silk: '#48dbfb'
} as const;

export type LanternType = keyof typeof lanternColors;

export interface Lantern {
  id: string;
  type: LanternType;
  slotIndex: number | null;
  riddle: Riddle | null;
  isSwinging: boolean;
  isExploding: boolean;
  isDimming: boolean;
}
