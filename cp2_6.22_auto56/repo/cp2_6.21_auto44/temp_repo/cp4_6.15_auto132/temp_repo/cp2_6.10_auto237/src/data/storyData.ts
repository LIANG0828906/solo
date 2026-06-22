import { Era, ClothPiece } from '../types';

const STORY_TEMPLATES: Record<Era, Array<{ title: string; story: string }>> = {
  ancient: [
    {
      title: '第一缕火种',
      story: '在那个雷电交加的夜晚，部落里最勇敢的年轻人捡起了被闪电点燃的树枝。火焰驱散了黑暗，也点亮了人类文明的黎明。从此，人们不再畏惧漫漫长夜。'
    },
    {
      title: '岩壁上的画',
      story: '一位老萨满用赭石在洞穴壁上描绘狩猎的场景。他不知道，这些简单的线条将穿越数万年，向未来的人们诉说远古的故事。'
    },
    {
      title: '陶罐的秘密',
      story: '少女不小心将黏土掉进了火堆。当灰烬冷却，她发现了一个坚硬的容器。这个意外的发现，让人类开始了陶器制作的历史。'
    }
  ],
  medieval: [
    {
      title: '骑士的誓言',
      story: '在君王的加冕典礼上，年轻的骑士单膝跪地，将宝剑横在胸前。他宣誓效忠王权，守护弱者，用生命捍卫荣誉。那一天，骑士精神闪耀在整个王国。'
    },
    {
      title: '炼金术士的配方',
      story: '炼金术士在实验室里熬煮着神秘的液体。他想要炼出黄金，却意外地发明了火药。这个错误，将永远改变战争的面貌。'
    },
    {
      title: '城堡的信使',
      story: '信使骑着快马在山间奔驰，他携带的信件决定着两个王国的战与和。翻过最后一座山峰时，他看到了远处城堡升起的炊烟。'
    }
  ],
  renaissance: [
    {
      title: '蒙娜丽莎的微笑',
      story: '达芬奇在画布上涂抹着最后一笔颜料。画中的妇人似乎有了生命，她的微笑神秘而温柔。这幅画将成为人类艺术史上最璀璨的明珠。'
    },
    {
      title: '天体运行论',
      story: '哥白尼在临终前终于看到了自己著作的出版。他提出的日心说，如同投向教会权威的一颗巨石，掀起了科学革命的巨浪。'
    },
    {
      title: '大卫雕像',
      story: '米开朗基罗手持凿子，凝视着眼前的大理石块。三年后，一块普通的石头在他手中变成了完美的大卫雕像，展现着人体最纯粹的力量与美。'
    }
  ],
  industrial: [
    {
      title: '蒸汽火车的鸣笛',
      story: '史蒂芬森驾驶着他发明的蒸汽机车，在铁轨上缓缓前行。人们惊恐又兴奋地看着这个"铁马"喷出白色的蒸汽，一个新的时代就此拉开序幕。'
    },
    {
      title: '电灯的光芒',
      story: '经过上千次失败，爱迪生终于点亮了第一盏实用的白炽灯。那温暖而稳定的光芒，让黑夜变得如同白昼，人类的活动时间被无限延长。'
    },
    {
      title: '电话机的另一端',
      story: '贝尔对着那个奇怪的装置喊道："沃森先生，过来一下，我需要你！"在另一个房间，沃森清晰地听到了这句话。人类的通讯方式从此被彻底改变。'
    }
  ],
  modern: [
    {
      title: '人类登上月球',
      story: '阿姆斯特朗踏上了月球表面，留下了人类的第一个脚印。"这是个人的一小步，却是人类的一大步。"这句话通过电波传遍了地球上的每一个角落。'
    },
    {
      title: '万维网的诞生',
      story: '蒂姆·伯纳斯-李在实验室里发布了第一个网站。他没有想到，这个小小的发明将会把整个人类连接在一起，创造出一个全新的数字世界。'
    },
    {
      title: '基因密码',
      story: '科学家们终于完成了人类基因组的测序工作。当那长达30亿个碱基对的序列展示在眼前时，人类第一次读到了自己的生命说明书。'
    }
  ],
  future: [
    {
      title: '星际移民',
      story: '第一艘殖民飞船缓缓驶离地球轨道。船上的人们回望那颗蓝色的星球，眼中满是不舍与希望。他们将在火星上建立人类的第二个家园。'
    },
    {
      title: '意识上传',
      story: '老人躺在手术台上，感受着自己的意识被逐渐扫描、上传。当他再次"醒来"，发现自己已经生活在一个没有衰老、没有疾病的数字世界中。'
    },
    {
      title: '第一接触',
      story: '射电望远镜接收到了来自深空的规律信号。经过破译，科学家确认这是外星文明的问候。人类终于知道，在浩瀚宇宙中，我们并不孤独。'
    }
  ]
};

export function generateRandomStory(era: Era): { title: string; story: string } {
  const templates = STORY_TEMPLATES[era];
  return templates[Math.floor(Math.random() * templates.length)];
}

export function generateRandomEra(): Era {
  const eras: Era[] = ['ancient', 'medieval', 'renaissance', 'industrial', 'modern', 'future'];
  return eras[Math.floor(Math.random() * eras.length)];
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
}

export function generateClothPieceData(): Omit<ClothPiece, 'status' | 'createdAt'> {
  const era = generateRandomEra();
  const { title, story } = generateRandomStory(era);
  const colors = ['#b87333', '#2a6f97', '#9370DB', '#20B2AA', '#CD853F', '#4682B4'];
  
  return {
    id: generateId(),
    title,
    story,
    era,
    eraLabel: {
      ancient: '远古时代',
      medieval: '中世纪',
      renaissance: '文艺复兴',
      industrial: '工业时代',
      modern: '现代',
      future: '未来'
    }[era],
    correctOrder: ['ancient', 'medieval', 'renaissance', 'industrial', 'modern', 'future'].indexOf(era),
    color: colors[Math.floor(Math.random() * colors.length)],
    pattern: ['条纹', '波点', '花纹', '几何', '刺绣', '渐变'][Math.floor(Math.random() * 6)]
  };
}

export const INITIAL_PIECES_COUNT = 3;
export const TOTAL_PIECES_TO_WIN = 12;
