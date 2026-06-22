export interface Star {
  id: string;
  name: string;
  magnitude: number;
  theta: number;
  phi: number;
}

export interface Constellation {
  id: string;
  name: string;
  chineseName: string;
  stars: Star[];
  connections: [number, number][];
  story: string;
  field: string;
  solarTerm: string;
  centralStar: { theta: number; phi: number };
}

export const magnitudeColors: Record<number, string> = {
  1: '#ffd700',
  2: '#c0c0c0',
  3: '#a0c4ff'
};

export const magnitudeSizes: Record<number, number> = {
  1: 0.6,
  2: 0.4,
  3: 0.2
};

const DOME_RADIUS = 8;

const createStar = (id: string, name: string, magnitude: number, theta: number, phi: number): Star => ({
  id,
  name,
  magnitude,
  theta,
  phi
});

export const constellations: Constellation[] = [
  {
    id: 'dou',
    name: '斗宿',
    chineseName: '斗',
    stars: [
      createStar('dou1', '斗宿一', 2, 180, 60),
      createStar('dou2', '斗宿二', 2, 175, 55),
      createStar('dou3', '斗宿三', 2, 170, 50),
      createStar('dou4', '斗宿四', 1, 165, 55),
      createStar('dou5', '斗宿五', 2, 160, 60),
      createStar('dou6', '斗宿六', 3, 168, 62)
    ],
    connections: [[0, 1], [1, 2], [2, 3], [3, 4], [1, 5], [3, 5]],
    story: '斗宿，南斗六星，主天子寿命，亦主宰相爵禄之位。古云：「南斗注生，北斗注死。」司天监每逢冬至，必祭南斗，以求国运昌隆。',
    field: '斗宿分野在吴越，今江苏、浙江一带。',
    solarTerm: '斗宿对应冬至前后，阳气初生之时。',
    centralStar: { theta: 170, phi: 55 }
  },
  {
    id: 'xin',
    name: '心宿',
    chineseName: '心',
    stars: [
      createStar('xin1', '心宿一', 3, 210, 35),
      createStar('xin2', '心宿二', 1, 215, 30),
      createStar('xin3', '心宿三', 2, 220, 35)
    ],
    connections: [[0, 1], [1, 2]],
    story: '心宿，又名大火，其中央之星心宿二色赤如丹，古称「荧惑守心」则天下有变。心宿为东宫苍龙之心，主号令天下，赏罚分明。',
    field: '心宿分野在宋、卫，今河南东部、山东南部。',
    solarTerm: '心宿对应大暑前后，火德最盛之时。',
    centralStar: { theta: 215, phi: 30 }
  },
  {
    id: 'wei',
    name: '尾宿',
    chineseName: '尾',
    stars: [
      createStar('wei1', '尾宿一', 2, 230, 28),
      createStar('wei2', '尾宿二', 2, 235, 25),
      createStar('wei3', '尾宿三', 3, 240, 22),
      createStar('wei4', '尾宿四', 2, 245, 20),
      createStar('wei5', '尾宿五', 3, 250, 18)
    ],
    connections: [[0, 1], [1, 2], [2, 3], [3, 4]],
    story: '尾宿，东宫苍龙九尾之尾，主君臣之和、后妃之府。尾宿九星明，则君臣和、后妃顺；若星暗，则君臣失和、后妃有乱。',
    field: '尾宿分野在燕，今北京、河北北部一带。',
    solarTerm: '尾宿对应处暑前后，阳气渐收之时。',
    centralStar: { theta: 240, phi: 22 }
  },
  {
    id: 'fang',
    name: '房宿',
    chineseName: '房',
    stars: [
      createStar('fang1', '房宿一', 2, 195, 38),
      createStar('fang2', '房宿二', 2, 200, 36),
      createStar('fang3', '房宿三', 2, 205, 38),
      createStar('fang4', '房宿四', 1, 200, 40)
    ],
    connections: [[0, 1], [1, 2], [1, 3], [0, 3], [2, 3]],
    story: '房宿，东宫苍龙之腹，为明堂，天子布政之宫。房宿四星主天府、天驷，主车驾之马，亦主后宫之事。',
    field: '房宿分野在楚，今湖北、湖南一带。',
    solarTerm: '房宿对应秋分前后，阴阳平衡之时。',
    centralStar: { theta: 200, phi: 38 }
  },
  {
    id: 'kang',
    name: '亢宿',
    chineseName: '亢',
    stars: [
      createStar('kang1', '亢宿一', 3, 170, 42),
      createStar('kang2', '亢宿二', 2, 175, 40),
      createStar('kang3', '亢宿三', 2, 180, 42),
      createStar('kang4', '亢宿四', 3, 175, 45)
    ],
    connections: [[0, 1], [1, 2], [1, 3], [0, 3], [2, 3]],
    story: '亢宿，东宫苍龙之首，主疾病、疾疫。亢宿四星明，则无疾疫；若星暗，则民多疾病。',
    field: '亢宿分野在郑，今河南中部。',
    solarTerm: '亢宿对应寒露前后，寒气渐盛之时。',
    centralStar: { theta: 175, phi: 42 }
  },
  {
    id: 'jiao',
    name: '角宿',
    chineseName: '角',
    stars: [
      createStar('jiao1', '角宿一', 1, 155, 45),
      createStar('jiao2', '角宿二', 2, 160, 48)
    ],
    connections: [[0, 1]],
    story: '角宿，东宫苍龙两角，主天门、关梁、主兵事。角宿二星明，则天下太平；若星暗，则兵戈四起。',
    field: '角宿分野在兖州，今山东西部。',
    solarTerm: '角宿对应霜降前后，秋冬交替之时。',
    centralStar: { theta: 157, phi: 46 }
  },
  {
    id: 'di',
    name: '氐宿',
    chineseName: '氐',
    stars: [
      createStar('di1', '氐宿一', 2, 185, 45),
      createStar('di2', '氐宿二', 3, 190, 43),
      createStar('di3', '氐宿三', 2, 195, 45),
      createStar('di4', '氐宿四', 3, 190, 47)
    ],
    connections: [[0, 1], [1, 2], [1, 3], [0, 3], [2, 3]],
    story: '氐宿，东宫苍龙之足，主宗庙、天子之正寝。氐宿四星明，则宗庙安、天子宁；若星暗，则宗庙有危。',
    field: '氐宿分野在宋，今河南东部。',
    solarTerm: '氐宿对应立冬前后，万物收藏之时。',
    centralStar: { theta: 190, phi: 45 }
  },
  {
    id: 'ji',
    name: '箕宿',
    chineseName: '箕',
    stars: [
      createStar('ji1', '箕宿一', 2, 260, 25),
      createStar('ji2', '箕宿二', 2, 265, 22),
      createStar('ji3', '箕宿三', 2, 270, 25),
      createStar('ji4', '箕宿四', 3, 265, 28)
    ],
    connections: [[0, 1], [1, 2], [1, 3], [0, 3], [2, 3]],
    story: '箕宿，主口舌、主风、主客。箕宿四星明，则风雨顺、五谷丰；若星动，则有大风、口舌之争。',
    field: '箕宿分野在幽州，今河北北部、辽宁南部。',
    solarTerm: '箕宿对应小雪前后，寒风乍起之时。',
    centralStar: { theta: 265, phi: 25 }
  },
  {
    id: 'niu',
    name: '牛宿',
    chineseName: '牛',
    stars: [
      createStar('niu1', '牛宿一', 2, 280, 35),
      createStar('niu2', '牛宿二', 3, 285, 32),
      createStar('niu3', '牛宿三', 2, 290, 35),
      createStar('niu4', '牛宿四', 3, 285, 38),
      createStar('niu5', '牛宿五', 3, 282, 34),
      createStar('niu6', '牛宿六', 3, 288, 34)
    ],
    connections: [[0, 1], [1, 2], [1, 3], [0, 4], [2, 5]],
    story: '牛宿，主牺牲、主五谷、主仓库。牛宿六星明，则五谷丰登、仓库充实；若星暗，则五谷不收、仓库空虚。',
    field: '牛宿分野在杨州，今江苏南部、浙江北部。',
    solarTerm: '牛宿对应大雪前后，寒气正盛之时。',
    centralStar: { theta: 285, phi: 35 }
  },
  {
    id: 'nü',
    name: '女宿',
    chineseName: '女',
    stars: [
      createStar('nü1', '女宿一', 2, 300, 40),
      createStar('nü2', '女宿二', 3, 305, 38),
      createStar('nü3', '女宿三', 2, 310, 40),
      createStar('nü4', '女宿四', 3, 305, 42)
    ],
    connections: [[0, 1], [1, 2], [1, 3], [0, 3], [2, 3]],
    story: '女宿，主少女、主布帛、主婚嫁。女宿四星明，则婚姻顺、布帛丰；若星暗，则女事乱、布帛贵。',
    field: '女宿分野在青州，今山东北部。',
    solarTerm: '女宿对应小寒前后，寒极生阳之时。',
    centralStar: { theta: 305, phi: 40 }
  },
  {
    id: 'xu',
    name: '虚宿',
    chineseName: '虚',
    stars: [
      createStar('xu1', '虚宿一', 1, 320, 45),
      createStar('xu2', '虚宿二', 2, 325, 48)
    ],
    connections: [[0, 1]],
    story: '虚宿，主坟墓、主哭祭、主死丧。虚宿二星明，则天下安；若星暗，则有大丧、哭声遍天下。',
    field: '虚宿分野在齐州，今山东中部。',
    solarTerm: '虚宿对应大寒前后，寒尽春生之时。',
    centralStar: { theta: 322, phi: 46 }
  },
  {
    id: 'wei-2',
    name: '危宿',
    chineseName: '危',
    stars: [
      createStar('wei2-1', '危宿一', 2, 340, 50),
      createStar('wei2-2', '危宿二', 2, 345, 52),
      createStar('wei2-3', '危宿三', 2, 350, 50)
    ],
    connections: [[0, 1], [1, 2], [0, 2]],
    story: '危宿，主架屋、主盖藏、主宗庙。危宿三星明，则宗庙安、宫室固；若星暗，则宫室倾、宗庙危。',
    field: '危宿分野在青州，今山东东部。',
    solarTerm: '危宿对应立春前后，春回大地之时。',
    centralStar: { theta: 345, phi: 51 }
  },
  {
    id: 'shi',
    name: '室宿',
    chineseName: '室',
    stars: [
      createStar('shi1', '室宿一', 2, 355, 55),
      createStar('shi2', '室宿二', 2, 0, 58),
      createStar('shi3', '室宿三', 2, 5, 55),
      createStar('shi4', '室宿四', 2, 0, 52)
    ],
    connections: [[0, 1], [1, 2], [2, 3], [3, 0], [1, 3]],
    story: '室宿，主兵事、主土木、主粮食。室宿四星明，则兵马盛、粮食足；若星暗，则兵弱粮少。',
    field: '室宿分野在并州，今山西一带。',
    solarTerm: '室宿对应雨水前后，春雨润物之时。',
    centralStar: { theta: 0, phi: 55 }
  },
  {
    id: 'bi-2',
    name: '壁宿',
    chineseName: '壁',
    stars: [
      createStar('bi2-1', '壁宿一', 1, 10, 58),
      createStar('bi2-2', '壁宿二', 2, 15, 60)
    ],
    connections: [[0, 1]],
    story: '壁宿，主文章、主图书、主秘府。壁宿二星明，则文章兴、图书盛；若星暗，则文章衰、图书散。',
    field: '壁宿分野在卫州，今河南北部。',
    solarTerm: '壁宿对应惊蛰前后，万物复苏之时。',
    centralStar: { theta: 12, phi: 59 }
  },
  {
    id: 'kui',
    name: '奎宿',
    chineseName: '奎',
    stars: [
      createStar('kui1', '奎宿一', 2, 25, 55),
      createStar('kui2', '奎宿二', 3, 30, 52),
      createStar('kui3', '奎宿三', 2, 35, 55),
      createStar('kui4', '奎宿四', 3, 40, 58),
      createStar('kui5', '奎宿五', 2, 38, 53),
      createStar('kui6', '奎宿六', 3, 28, 57)
    ],
    connections: [[0, 1], [1, 2], [2, 3], [4, 5], [1, 4], [2, 4]],
    story: '奎宿，主兵事、主武库、主文章。奎宿十六星主天下兵甲，又主封豕，为西方白虎之首。',
    field: '奎宿分野在徐州，今山东南部、江苏北部。',
    solarTerm: '奎宿对应春分前后，昼夜平分之时。',
    centralStar: { theta: 32, phi: 55 }
  },
  {
    id: 'lou',
    name: '娄宿',
    chineseName: '娄',
    stars: [
      createStar('lou1', '娄宿一', 2, 45, 50),
      createStar('lou2', '娄宿二', 2, 50, 52),
      createStar('lou3', '娄宿三', 1, 55, 50)
    ],
    connections: [[0, 1], [1, 2], [0, 2]],
    story: '娄宿，主牺牲、主兴兵、主聚敛。娄宿三星明，则牺牲具、兵甲备；若星暗，则牺牲不备、兵甲不兴。',
    field: '娄宿分野在豫州，今河南东南部。',
    solarTerm: '娄宿对应清明前后，万物生长之时。',
    centralStar: { theta: 50, phi: 51 }
  },
  {
    id: 'wei-3',
    name: '胃宿',
    chineseName: '胃',
    stars: [
      createStar('wei3-1', '胃宿一', 3, 60, 45),
      createStar('wei3-2', '胃宿二', 2, 65, 48),
      createStar('wei3-3', '胃宿三', 2, 70, 45)
    ],
    connections: [[0, 1], [1, 2], [0, 2]],
    story: '胃宿，主仓廪、主五谷、主饮食。胃宿三星明，则仓廪实、五谷丰；若星暗，则仓廪虚、五谷贵。',
    field: '胃宿分野在冀州，今河北南部。',
    solarTerm: '胃宿对应谷雨前后，雨生百谷之时。',
    centralStar: { theta: 65, phi: 46 }
  },
  {
    id: 'mao',
    name: '昴宿',
    chineseName: '昴',
    stars: [
      createStar('mao1', '昴宿一', 2, 75, 40),
      createStar('mao2', '昴宿二', 2, 78, 38),
      createStar('mao3', '昴宿三', 2, 82, 40),
      createStar('mao4', '昴宿四', 2, 78, 42),
      createStar('mao5', '昴宿五', 3, 76, 41),
      createStar('mao6', '昴宿六', 3, 80, 41),
      createStar('mao7', '昴宿七', 3, 79, 39)
    ],
    connections: [[0, 1], [1, 2], [1, 3], [0, 4], [2, 5], [1, 6]],
    story: '昴宿，主边兵、主匈奴、主丧纪。昴宿七星明则天下安，若有星入昴中，则匈奴入寇。',
    field: '昴宿分野在冀州，今河北中部。',
    solarTerm: '昴宿对应立夏前后，万物繁茂之时。',
    centralStar: { theta: 78, phi: 40 }
  },
  {
    id: 'bi',
    name: '毕宿',
    chineseName: '毕',
    stars: [
      createStar('bi1', '毕宿一', 2, 90, 38),
      createStar('bi2', '毕宿二', 3, 95, 36),
      createStar('bi3', '毕宿三', 2, 100, 38),
      createStar('bi4', '毕宿四', 2, 98, 40),
      createStar('bi5', '毕宿五', 1, 92, 42)
    ],
    connections: [[0, 1], [1, 2], [2, 3], [3, 4], [0, 4], [1, 3]],
    story: '毕宿，主兵戈、主狩猎、主边鄙。毕宿八星明，则天下太平；若星动，则兵戈起。',
    field: '毕宿分野在益州，今四川一带。',
    solarTerm: '毕宿对应小满前后，麦秋将至之时。',
    centralStar: { theta: 95, phi: 38 }
  },
  {
    id: 'zui',
    name: '觜宿',
    chineseName: '觜',
    stars: [
      createStar('zui1', '觜宿一', 3, 110, 35),
      createStar('zui2', '觜宿二', 2, 115, 33),
      createStar('zui3', '觜宿三', 3, 120, 35)
    ],
    connections: [[0, 1], [1, 2], [0, 2]],
    story: '觜宿，主行军、主收敛、主万物之始。觜宿三星明，则军粮足、三军振；若星暗，则军粮乏、三军馁。',
    field: '觜宿分野在益州，今四川南部。',
    solarTerm: '觜宿对应芒种前后，麦熟蚕老之时。',
    centralStar: { theta: 115, phi: 34 }
  },
  {
    id: 'shen',
    name: '参宿',
    chineseName: '参',
    stars: [
      createStar('shen1', '参宿一', 2, 125, 30),
      createStar('shen2', '参宿二', 1, 130, 28),
      createStar('shen3', '参宿三', 2, 135, 30),
      createStar('shen4', '参宿四', 1, 125, 35),
      createStar('shen5', '参宿五', 2, 135, 35),
      createStar('shen6', '参宿六', 1, 130, 25),
      createStar('shen7', '参宿七', 2, 128, 32),
      createStar('shen8', '参宿八', 2, 132, 32)
    ],
    connections: [[0, 1], [1, 2], [3, 0], [2, 4], [1, 5], [6, 7], [1, 6], [1, 7]],
    story: '参宿，主斩刈、主杀伐、主边境之事。参宿七星明，则天下安、四夷服；若星暗，则四夷叛、边境不宁。',
    field: '参宿分野在益州，今四川西部。',
    solarTerm: '参宿对应夏至前后，阳极阴生之时。',
    centralStar: { theta: 130, phi: 30 }
  },
  {
    id: 'jing',
    name: '井宿',
    chineseName: '井',
    stars: [
      createStar('jing1', '井宿一', 2, 140, 25),
      createStar('jing2', '井宿二', 2, 145, 22),
      createStar('jing3', '井宿三', 3, 150, 25),
      createStar('jing4', '井宿四', 2, 145, 28),
      createStar('jing5', '井宿五', 3, 142, 24),
      createStar('jing6', '井宿六', 3, 148, 24),
      createStar('jing7', '井宿七', 3, 148, 26),
      createStar('jing8', '井宿八', 3, 142, 26)
    ],
    connections: [[0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7], [7, 4]],
    story: '井宿，主水事、主酒食、主宾客。井宿八星明，则水利兴、酒食丰；若星暗，则水旱不调、酒食不丰。',
    field: '井宿分野在雍州，今陕西、甘肃一带。',
    solarTerm: '井宿对应小暑前后，暑气初盛之时。',
    centralStar: { theta: 145, phi: 25 }
  },
  {
    id: 'gui',
    name: '鬼宿',
    chineseName: '鬼',
    stars: [
      createStar('gui1', '鬼宿一', 3, 155, 22),
      createStar('gui2', '鬼宿二', 3, 160, 20),
      createStar('gui3', '鬼宿三', 3, 165, 22),
      createStar('gui4', '鬼宿四', 3, 160, 24)
    ],
    connections: [[0, 1], [1, 2], [2, 3], [3, 0]],
    story: '鬼宿，主祠祀、主死丧、主疾病。鬼宿四星明，则祠祀丰、民无疾；若星暗，则祠祀废、民多疾。',
    field: '鬼宿分野在雍州，今陕西南部。',
    solarTerm: '鬼宿对应大暑前后，暑气正盛之时。',
    centralStar: { theta: 160, phi: 22 }
  },
  {
    id: 'liu',
    name: '柳宿',
    chineseName: '柳',
    stars: [
      createStar('liu1', '柳宿一', 2, 170, 18),
      createStar('liu2', '柳宿二', 3, 175, 16),
      createStar('liu3', '柳宿三', 3, 180, 18),
      createStar('liu4', '柳宿四', 2, 185, 20),
      createStar('liu5', '柳宿五', 3, 178, 19),
      createStar('liu6', '柳宿六', 3, 173, 17)
    ],
    connections: [[0, 1], [1, 2], [2, 3], [4, 5], [1, 4], [2, 4]],
    story: '柳宿，主草木、主饮食、主仓库。柳宿八星明，则草木茂、饮食丰；若星暗，则草木枯、饮食乏。',
    field: '柳宿分野在三河，今河南西部。',
    solarTerm: '柳宿对应立秋前后，秋高气爽之时。',
    centralStar: { theta: 178, phi: 18 }
  },
  {
    id: 'xing',
    name: '星宿',
    chineseName: '星',
    stars: [
      createStar('xing1', '星宿一', 1, 190, 18),
      createStar('xing2', '星宿二', 3, 193, 20),
      createStar('xing3', '星宿三', 3, 196, 22),
      createStar('xing4', '星宿四', 3, 193, 16)
    ],
    connections: [[0, 1], [1, 2], [0, 3]],
    story: '星宿，主衣服、主文绣、主百官。星宿七星明，则百官正、衣服备；若星暗，则百官乱、衣服不备。',
    field: '星宿分野在周地，今河南洛阳一带。',
    solarTerm: '星宿对应处暑前后，暑气渐消之时。',
    centralStar: { theta: 193, phi: 19 }
  },
  {
    id: 'zhang',
    name: '张宿',
    chineseName: '张',
    stars: [
      createStar('zhang1', '张宿一', 2, 200, 20),
      createStar('zhang2', '张宿二', 3, 205, 22),
      createStar('zhang3', '张宿三', 2, 210, 20),
      createStar('zhang4', '张宿四', 3, 207, 18),
      createStar('zhang5', '张宿五', 3, 203, 18),
      createStar('zhang6', '张宿六', 3, 205, 24)
    ],
    connections: [[0, 1], [1, 2], [3, 4], [1, 5], [1, 3], [1, 4]],
    story: '张宿，主珍宝、主珠玉、主宗庙之用。张宿六星明，则珍宝聚、珠玉丰；若星暗，则珍宝散、珠玉少。',
    field: '张宿分野在周地，今河南东部。',
    solarTerm: '张宿对应白露前后，露凝为霜之时。',
    centralStar: { theta: 205, phi: 21 }
  },
  {
    id: 'yi',
    name: '翼宿',
    chineseName: '翼',
    stars: [
      createStar('yi1', '翼宿一', 2, 220, 22),
      createStar('yi2', '翼宿二', 3, 225, 20),
      createStar('yi3', '翼宿三', 3, 230, 22),
      createStar('yi4', '翼宿四', 2, 235, 24),
      createStar('yi5', '翼宿五', 3, 228, 25),
      createStar('yi6', '翼宿六', 3, 222, 25)
    ],
    connections: [[0, 1], [1, 2], [2, 3], [4, 5], [1, 4], [2, 4]],
    story: '翼宿，主礼乐、主文章、主远方宾客。翼宿二十二星明，则礼乐兴、文章盛；若星暗，则礼乐废、文章衰。',
    field: '翼宿分野在荆州，今湖北一带。',
    solarTerm: '翼宿对应秋分前后，金风送爽之时。',
    centralStar: { theta: 227, phi: 22 }
  },
  {
    id: 'zhen',
    name: '轸宿',
    chineseName: '轸',
    stars: [
      createStar('zhen1', '轸宿一', 2, 245, 28),
      createStar('zhen2', '轸宿二', 2, 250, 30),
      createStar('zhen3', '轸宿三', 2, 255, 28),
      createStar('zhen4', '轸宿四', 3, 250, 32)
    ],
    connections: [[0, 1], [1, 2], [2, 3], [3, 0], [1, 3]],
    story: '轸宿，主车骑、主载任、主道路之事。轸宿四星明，则车马盛、道路通；若星暗，则车马少、道路塞。',
    field: '轸宿分野在荆州，今湖南一带。',
    solarTerm: '轸宿对应寒露前后，秋意渐浓之时。',
    centralStar: { theta: 250, phi: 29 }
  }
];

export const generateBackgroundStars = (count: number): Star[] => {
  const stars: Star[] = [];
  const usedPositions = new Set<string>();
  
  for (let i = 0; i < count; i++) {
    let theta, phi, key;
    do {
      theta = Math.random() * 360;
      phi = Math.random() * 90;
      key = `${Math.floor(theta / 5)}-${Math.floor(phi / 5)}`;
    } while (usedPositions.has(key));
    
    usedPositions.add(key);
    const magnitude = Math.random() > 0.85 ? 2 : 3;
    
    stars.push({
      id: `bg-${i}`,
      name: '',
      magnitude,
      theta,
      phi
    });
  }
  
  return stars;
};

export const sphericalToCartesian = (theta: number, phi: number, radius: number = DOME_RADIUS): [number, number, number] => {
  const thetaRad = (theta * Math.PI) / 180;
  const phiRad = (phi * Math.PI) / 180;
  const x = radius * Math.sin(phiRad) * Math.cos(thetaRad);
  const y = radius * Math.cos(phiRad);
  const z = radius * Math.sin(phiRad) * Math.sin(thetaRad);
  return [x, y, z];
};

export { DOME_RADIUS };
