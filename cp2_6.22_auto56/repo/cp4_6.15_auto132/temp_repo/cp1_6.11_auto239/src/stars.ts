export interface StarData {
  name: string;
  x: number;
  y: number;
}

export interface Constellation {
  name: string;
  stars: StarData[];
  auspicious: boolean;
  omen: string;
  explanation: string;
}

export interface ConstellationRange {
  startAngle: number;
  endAngle: number;
  constellation: Constellation;
}

export interface Planet {
  name: string;
  x: number;
  y: number;
  color: string;
}

export const twentyEightMansions: ConstellationRange[] = [
  {
    startAngle: 0,
    endAngle: 12.857,
    constellation: {
      name: '角宿',
      stars: [
        { name: '角一', x: 420, y: 180 },
        { name: '角二', x: 440, y: 200 },
        { name: '角三', x: 450, y: 230 }
      ],
      auspicious: true,
      omen: '角宿明亮，主五谷丰登',
      explanation: '角宿为东方苍龙之首，主造化万物，生杀权衡。角星明则天下太平，五谷丰稔。'
    }
  },
  {
    startAngle: 12.857,
    endAngle: 25.714,
    constellation: {
      name: '亢宿',
      stars: [
        { name: '亢一', x: 470, y: 260 },
        { name: '亢二', x: 480, y: 290 },
        { name: '亢三', x: 485, y: 320 }
      ],
      auspicious: true,
      omen: '亢宿康宁，主朝政清明',
      explanation: '亢宿为苍龙之颈，主天子内朝，总领百官。亢星明则君臣和穆，政令通行。'
    }
  },
  {
    startAngle: 25.714,
    endAngle: 38.571,
    constellation: {
      name: '氐宿',
      stars: [
        { name: '氐一', x: 490, y: 350 },
        { name: '氐二', x: 490, y: 380 },
        { name: '氐三', x: 485, y: 410 },
        { name: '氐四', x: 475, y: 435 }
      ],
      auspicious: true,
      omen: '氐宿安宁，主民安国泰',
      explanation: '氐宿为苍龙之胸，主四时八节，养育万物。氐星明则民安物阜，天下太平。'
    }
  },
  {
    startAngle: 38.571,
    endAngle: 51.428,
    constellation: {
      name: '房宿',
      stars: [
        { name: '房一', x: 460, y: 455 },
        { name: '房二', x: 445, y: 475 },
        { name: '房三', x: 425, y: 490 },
        { name: '房四', x: 400, y: 500 }
      ],
      auspicious: false,
      omen: '月犯房宿，主国有忧',
      explanation: '房宿为苍龙之腹，主天子布政之宫。月犯房星则君臣失和，国有忧患。'
    }
  },
  {
    startAngle: 51.428,
    endAngle: 64.285,
    constellation: {
      name: '心宿',
      stars: [
        { name: '心一', x: 370, y: 505 },
        { name: '心二', x: 340, y: 505 },
        { name: '心三', x: 310, y: 500 }
      ],
      auspicious: false,
      omen: '月犯心宿，主国忧',
      explanation: '心宿为苍龙之腰，主天下赏罚。心星明则天下治，暗则主忧。月犯心宿，其下有丧。'
    }
  },
  {
    startAngle: 64.285,
    endAngle: 77.142,
    constellation: {
      name: '尾宿',
      stars: [
        { name: '尾一', x: 280, y: 490 },
        { name: '尾二', x: 255, y: 475 },
        { name: '尾三', x: 235, y: 455 },
        { name: '尾四', x: 220, y: 430 },
        { name: '尾五', x: 210, y: 400 }
      ],
      auspicious: true,
      omen: '尾宿和顺，主君臣同心',
      explanation: '尾宿为苍龙之尾，主君臣和洽，后宫有序。尾星明则君臣合心，子孙蕃息。'
    }
  },
  {
    startAngle: 77.142,
    endAngle: 90,
    constellation: {
      name: '箕宿',
      stars: [
        { name: '箕一', x: 205, y: 370 },
        { name: '箕二', x: 205, y: 340 },
        { name: '箕三', x: 210, y: 310 },
        { name: '箕四', x: 220, y: 285 }
      ],
      auspicious: true,
      omen: '箕宿调顺，主风雨以时',
      explanation: '箕宿为苍龙之尾末，主八风，亦主后妃之位。箕星明则风雨顺时，五谷成熟。'
    }
  },
  {
    startAngle: 90,
    endAngle: 102.857,
    constellation: {
      name: '斗宿',
      stars: [
        { name: '斗一', x: 195, y: 260 },
        { name: '斗二', x: 180, y: 235 },
        { name: '斗三', x: 170, y: 205 },
        { name: '斗四', x: 165, y: 175 },
        { name: '斗五', x: 165, y: 145 },
        { name: '斗六', x: 170, y: 115 }
      ],
      auspicious: true,
      omen: '斗宿光明，主爵禄丰盈',
      explanation: '斗宿为北方玄武之首，主天子寿禄，亦主宰相之位。斗星明则爵禄行，贤者进。'
    }
  },
  {
    startAngle: 102.857,
    endAngle: 115.714,
    constellation: {
      name: '牛宿',
      stars: [
        { name: '牛一', x: 180, y: 90 },
        { name: '牛二', x: 195, y: 70 },
        { name: '牛三', x: 215, y: 55 },
        { name: '牛四', x: 235, y: 45 },
        { name: '牛五', x: 260, y: 40 },
        { name: '牛六', x: 285, y: 40 }
      ],
      auspicious: false,
      omen: '牛宿动摇，主有牺牲之事',
      explanation: '牛宿主牺牲之事，亦主武库兵甲。牛星动摇则有兵革之事，天下不安。'
    }
  },
  {
    startAngle: 115.714,
    endAngle: 128.571,
    constellation: {
      name: '女宿',
      stars: [
        { name: '女一', x: 310, y: 45 },
        { name: '女二', x: 335, y: 55 },
        { name: '女三', x: 355, y: 70 },
        { name: '女四', x: 370, y: 90 }
      ],
      auspicious: true,
      omen: '女宿静明，主嫁娶贞吉',
      explanation: '女宿主妇女嫁娶，亦主丝绵布帛。女星明则嫁娶吉，妇女贞顺，蚕桑丰收。'
    }
  },
  {
    startAngle: 128.571,
    endAngle: 141.428,
    constellation: {
      name: '虚宿',
      stars: [
        { name: '虚一', x: 385, y: 115 },
        { name: '虚二', x: 395, y: 140 }
      ],
      auspicious: false,
      omen: '虚宿昏暗，主有丧亡',
      explanation: '虚宿主死丧哭泣，亦主庙堂祭祀。虚星暗则有大丧，天下多忧，民多疾病。'
    }
  },
  {
    startAngle: 141.428,
    endAngle: 154.285,
    constellation: {
      name: '危宿',
      stars: [
        { name: '危一', x: 400, y: 165 },
        { name: '危二', x: 400, y: 195 },
        { name: '危三', x: 395, y: 225 }
      ],
      auspicious: false,
      omen: '危宿倾斜，主有危亡',
      explanation: '危宿主天下危亡，又主宗庙祭祀。危星倾斜则有兵革之危，国有忧难。'
    }
  },
  {
    startAngle: 154.285,
    endAngle: 167.142,
    constellation: {
      name: '室宿',
      stars: [
        { name: '室一', x: 385, y: 255 },
        { name: '室二', x: 370, y: 280 },
        { name: '室三', x: 350, y: 300 },
        { name: '室四', x: 325, y: 315 }
      ],
      auspicious: true,
      omen: '室宿通明，主宫室安宁',
      explanation: '室宿主天下宫室，亦主军旅。室星明则宫室安，君王吉，五谷丰。'
    }
  },
  {
    startAngle: 167.142,
    endAngle: 180,
    constellation: {
      name: '壁宿',
      stars: [
        { name: '壁一', x: 300, y: 325 },
        { name: '壁二', x: 270, y: 330 },
        { name: '壁三', x: 245, y: 328 }
      ],
      auspicious: true,
      omen: '壁宿有光，主文章大兴',
      explanation: '壁宿主天下文章图书，亦主秘府。壁星明则天下有道，文章兴，君子进。'
    }
  },
  {
    startAngle: 180,
    endAngle: 192.857,
    constellation: {
      name: '奎宿',
      stars: [
        { name: '奎一', x: 220, y: 320 },
        { name: '奎二', x: 195, y: 305 },
        { name: '奎三', x: 175, y: 285 },
        { name: '奎四', x: 160, y: 260 },
        { name: '奎五', x: 155, y: 230 },
        { name: '奎六', x: 155, y: 200 },
        { name: '奎七', x: 160, y: 170 },
        { name: '奎八', x: 170, y: 145 },
        { name: '奎九', x: 185, y: 120 }
      ],
      auspicious: true,
      omen: '奎宿炳焕，主武库兵精',
      explanation: '奎宿为西方白虎之首，主武库兵甲。奎星明则武库精，四夷宾服，天下安。'
    }
  },
  {
    startAngle: 192.857,
    endAngle: 205.714,
    constellation: {
      name: '娄宿',
      stars: [
        { name: '娄一', x: 205, y: 100 },
        { name: '娄二', x: 225, y: 80 },
        { name: '娄三', x: 250, y: 65 }
      ],
      auspicious: true,
      omen: '娄宿安静，主苑牧丰收',
      explanation: '娄宿主苑牧牺牲，亦主兴兵聚众。娄星安静则苑牧丰收，六畜蕃息。'
    }
  },
  {
    startAngle: 205.714,
    endAngle: 218.571,
    constellation: {
      name: '胃宿',
      stars: [
        { name: '胃一', x: 275, y: 55 },
        { name: '胃二', x: 300, y: 50 },
        { name: '胃三', x: 325, y: 55 }
      ],
      auspicious: true,
      omen: '胃宿明润，主仓廪充实',
      explanation: '胃宿主仓廪五谷，亦主饮食。胃星明则仓廪实，五谷丰，民食足。'
    }
  },
  {
    startAngle: 218.571,
    endAngle: 231.428,
    constellation: {
      name: '昴宿',
      stars: [
        { name: '昴一', x: 350, y: 65 },
        { name: '昴二', x: 370, y: 80 },
        { name: '昴三', x: 385, y: 100 },
        { name: '昴四', x: 395, y: 125 },
        { name: '昴五', x: 400, y: 150 },
        { name: '昴六', x: 398, y: 175 },
        { name: '昴七', x: 390, y: 200 }
      ],
      auspicious: false,
      omen: '昴宿动摇，主有边警',
      explanation: '昴宿主胡狄边兵，亦主丧事。昴星动摇则胡兵起，边境有忧，天下多事。'
    }
  },
  {
    startAngle: 231.428,
    endAngle: 244.285,
    constellation: {
      name: '毕宿',
      stars: [
        { name: '毕一', x: 380, y: 225 },
        { name: '毕二', x: 365, y: 250 },
        { name: '毕三', x: 345, y: 270 },
        { name: '毕四', x: 320, y: 285 },
        { name: '毕五', x: 295, y: 295 },
        { name: '毕六', x: 265, y: 300 },
        { name: '毕七', x: 240, y: 300 },
        { name: '毕八', x: 215, y: 290 }
      ],
      auspicious: true,
      omen: '毕宿润泽，主雨泽应期',
      explanation: '毕宿主雨师，亦主边兵。毕星润泽则雨水应期，农作有成，万物蕃息。'
    }
  },
  {
    startAngle: 244.285,
    endAngle: 257.142,
    constellation: {
      name: '觜宿',
      stars: [
        { name: '觜一', x: 190, y: 275 },
        { name: '觜二', x: 175, y: 255 },
        { name: '觜三', x: 165, y: 230 }
      ],
      auspicious: true,
      omen: '觜宿明正，主收敛以时',
      explanation: '觜宿主万物收敛，亦主军旅。觜星明正则五谷收敛，仓库充实，不失其时。'
    }
  },
  {
    startAngle: 257.142,
    endAngle: 270,
    constellation: {
      name: '参宿',
      stars: [
        { name: '参一', x: 160, y: 200 },
        { name: '参二', x: 160, y: 170 },
        { name: '参三', x: 165, y: 140 },
        { name: '参四', x: 175, y: 115 },
        { name: '参五', x: 190, y: 95 },
        { name: '参六', x: 210, y: 75 },
        { name: '参七', x: 235, y: 60 }
      ],
      auspicious: true,
      omen: '参宿整齐，主天下太平',
      explanation: '参宿主天下边兵，亦主斩刈。参星整齐则天下太平，兵革不兴，四夷朝贡。'
    }
  },
  {
    startAngle: 270,
    endAngle: 282.857,
    constellation: {
      name: '井宿',
      stars: [
        { name: '井一', x: 260, y: 50 },
        { name: '井二', x: 285, y: 45 },
        { name: '井三', x: 310, y: 45 },
        { name: '井四', x: 335, y: 55 },
        { name: '井五', x: 355, y: 70 },
        { name: '井六', x: 370, y: 90 },
        { name: '井七', x: 380, y: 115 },
        { name: '井八', x: 385, y: 140 }
      ],
      auspicious: true,
      omen: '井宿清冽，主水泉流通',
      explanation: '井宿为南方朱鸟之首，主水泉，亦主法令。井星明则水泉流通，法令公正，民无疾苦。'
    }
  },
  {
    startAngle: 282.857,
    endAngle: 295.714,
    constellation: {
      name: '鬼宿',
      stars: [
        { name: '鬼一', x: 385, y: 165 },
        { name: '鬼二', x: 380, y: 190 },
        { name: '鬼三', x: 370, y: 215 },
        { name: '鬼四', x: 355, y: 235 }
      ],
      auspicious: false,
      omen: '鬼宿中有变，主有大丧',
      explanation: '鬼宿主死丧祭祀，亦主疾病。鬼星有变则有大丧，天下多疫，民多疾病。'
    }
  },
  {
    startAngle: 295.714,
    endAngle: 308.571,
    constellation: {
      name: '柳宿',
      stars: [
        { name: '柳一', x: 335, y: 255 },
        { name: '柳二', x: 315, y: 270 },
        { name: '柳三', x: 290, y: 280 },
        { name: '柳四', x: 265, y: 285 },
        { name: '柳五', x: 240, y: 285 },
        { name: '柳六', x: 215, y: 275 },
        { name: '柳七', x: 195, y: 260 },
        { name: '柳八', x: 180, y: 240 }
      ],
      auspicious: true,
      omen: '柳宿舒展，主草木丰茂',
      explanation: '柳宿主草木，亦主天子膳食。柳星舒展则草木丰茂，饮食丰美，民无饥寒。'
    }
  },
  {
    startAngle: 308.571,
    endAngle: 321.428,
    constellation: {
      name: '星宿',
      stars: [
        { name: '星一', x: 170, y: 215 },
        { name: '星二', x: 165, y: 185 },
        { name: '星三', x: 165, y: 155 },
        { name: '星四', x: 170, y: 130 },
        { name: '星五', x: 180, y: 105 },
        { name: '星六', x: 195, y: 85 },
        { name: '星七', x: 215, y: 70 }
      ],
      auspicious: true,
      omen: '星宿光明，主衣裳华美',
      explanation: '星宿主衣裳文绣，亦主天子急事。星光明则衣裳华美，贤才得用，天下文明。'
    }
  },
  {
    startAngle: 321.428,
    endAngle: 334.285,
    constellation: {
      name: '张宿',
      stars: [
        { name: '张一', x: 235, y: 55 },
        { name: '张二', x: 260, y: 45 },
        { name: '张三', x: 285, y: 40 },
        { name: '张四', x: 310, y: 45 },
        { name: '张五', x: 335, y: 55 },
        { name: '张六', x: 355, y: 75 }
      ],
      auspicious: true,
      omen: '张宿开张，主财宝丰盛',
      explanation: '张宿主宝物，亦主宗庙祭祀。张星明则财宝丰盛，祭祀丰洁，神明歆享。'
    }
  },
  {
    startAngle: 334.285,
    endAngle: 347.142,
    constellation: {
      name: '翼宿',
      stars: [
        { name: '翼一', x: 370, y: 100 },
        { name: '翼二', x: 380, y: 125 },
        { name: '翼三', x: 385, y: 150 },
        { name: '翼四', x: 385, y: 175 },
        { name: '翼五', x: 380, y: 200 },
        { name: '翼六', x: 370, y: 225 }
      ],
      auspicious: true,
      omen: '翼宿丰盈，主礼乐大兴',
      explanation: '翼宿主礼乐，亦主远方夷狄。翼星明则礼乐兴，四夷宾服，天下和同。'
    }
  },
  {
    startAngle: 347.142,
    endAngle: 360,
    constellation: {
      name: '轸宿',
      stars: [
        { name: '轸一', x: 355, y: 250 },
        { name: '轸二', x: 335, y: 270 },
        { name: '轸三', x: 310, y: 285 },
        { name: '轸四', x: 285, y: 295 }
      ],
      auspicious: true,
      omen: '轸宿安正，主车驾齐备',
      explanation: '轸宿主车骑，亦主风。轸星安正则车驾齐备，道路通畅，君王安行。'
    }
  }
];

export const sevenPlanets: Planet[] = [
  { name: '日', x: 300, y: 120, color: '#FFD700' },
  { name: '月', x: 480, y: 300, color: '#C0C0C0' },
  { name: '木', x: 180, y: 200, color: '#DEB887' },
  { name: '火', x: 420, y: 420, color: '#CD5C5C' },
  { name: '土', x: 150, y: 400, color: '#DAA520' },
  { name: '金', x: 350, y: 80, color: '#F0E68C' },
  { name: '水', x: 200, y: 450, color: '#87CEEB' }
];

export const twentyFourMountains = [
  { name: '壬', angle: 345, element: '水' },
  { name: '子', angle: 0, element: '水' },
  { name: '癸', angle: 15, element: '水' },
  { name: '丑', angle: 30, element: '土' },
  { name: '艮', angle: 45, element: '土' },
  { name: '寅', angle: 60, element: '木' },
  { name: '甲', angle: 75, element: '木' },
  { name: '卯', angle: 90, element: '木' },
  { name: '乙', angle: 105, element: '木' },
  { name: '辰', angle: 120, element: '土' },
  { name: '巽', angle: 135, element: '木' },
  { name: '巳', angle: 150, element: '火' },
  { name: '丙', angle: 165, element: '火' },
  { name: '午', angle: 180, element: '火' },
  { name: '丁', angle: 195, element: '火' },
  { name: '未', angle: 210, element: '土' },
  { name: '坤', angle: 225, element: '土' },
  { name: '申', angle: 240, element: '金' },
  { name: '庚', angle: 255, element: '金' },
  { name: '酉', angle: 270, element: '金' },
  { name: '辛', angle: 285, element: '金' },
  { name: '戌', angle: 300, element: '土' },
  { name: '乾', angle: 315, element: '金' },
  { name: '亥', angle: 330, element: '水' }
];

export const eightTrigrams = [
  { name: '坎', angle: 0, lines: [0, 1, 0] },
  { name: '艮', angle: 45, lines: [1, 0, 0] },
  { name: '震', angle: 90, lines: [0, 0, 1] },
  { name: '巽', angle: 135, lines: [1, 1, 0] },
  { name: '离', angle: 180, lines: [1, 0, 1] },
  { name: '坤', angle: 225, lines: [0, 0, 0] },
  { name: '兑', angle: 270, lines: [0, 1, 1] },
  { name: '乾', angle: 315, lines: [1, 1, 1] }
];

export function getCurrentConstellation(angle: number): Constellation {
  const normalizedAngle = ((angle % 360) + 360) % 360;
  
  for (const range of twentyEightMansions) {
    if (normalizedAngle >= range.startAngle && normalizedAngle < range.endAngle) {
      return range.constellation;
    }
  }
  
  return twentyEightMansions[0].constellation;
}

export function getMountainByAngle(angle: number): typeof twentyFourMountains[0] | null {
  const normalizedAngle = ((angle % 360) + 360) % 360;
  
  for (const mountain of twentyFourMountains) {
    const diff = Math.abs(normalizedAngle - mountain.angle);
    if (diff <= 7.5 || diff >= 352.5) {
      return mountain;
    }
  }
  
  return null;
}

export function getTrigramByAngle(angle: number): typeof eightTrigrams[0] | null {
  const normalizedAngle = ((angle % 360) + 360) % 360;
  
  for (const trigram of eightTrigrams) {
    const diff = Math.abs(normalizedAngle - trigram.angle);
    if (diff <= 22.5 || diff >= 337.5) {
      return trigram;
    }
  }
  
  return null;
}
